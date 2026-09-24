import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { adCatalog, advanceAdStore, cancelAdRecords, createAdRecords, createAdStore, getAdActor, updateAdStore, type AdDraft } from "../src/lib/adPush";
import { defaultWorkbench } from "../src/lib/adPushConfig";
import { changeDerivations, DERIVATION_STATUSES, derivationOutput, getDerivationRecords, seedDerivationExamples, submitDerivation, syncPushDerivations, validateDerivationSelection } from "../src/lib/videoDerivation";
import { getOperationRecords, operationUser, recordDownload, recordLogin, recordOperation, seedOperationExamples } from "../src/lib/operationHistory";
import { publishResources, getUploadedResources } from "../src/lib/resourceUploads";
import { resourceConfigStore } from "../src/lib/resourceConfig";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: new EventTarget(), configurable: true });
beforeEach(() => { values.clear(); storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan" })); });
const draft = (): AdDraft => ({ platform: "巨量千川", method: "push", goal: "推商品", rows: [3, 4].map(n => ({ id: String(n), accountId: `288194018274011${n}`, douyinId: "", storeId: "", productId: "", planId: "" })), templateIds: [], version: "原片", naming: "{视频名称}_{衍生编号}", scheduledAt: "", creative: "单创意" });

test("confirmed status set, owner isolation and one-time examples", () => {
  assert.deepEqual(DERIVATION_STATUSES, ["成功", "失败", "处理中", "取消衍生", "待衍生", "已删除"]);
  seedDerivationExamples("owner-a"); seedDerivationExamples("owner-a");
  const own = getDerivationRecords().filter(r => r.ownerId === "owner-a");
  assert.equal(own.length, 6);
  assert.throws(() => changeDerivations([own[0].id], "owner-b", "note", "bad"));
  assert.throws(() => validateDerivationSelection([own[0].id, "missing"], "owner-a"));
  assert.throws(() => changeDerivations([own[0].id, own[4].id], "owner-a", "cancel"));
  assert.equal(derivationOutput(own[4].id, "owner-a")?.status, "待衍生");
});

test("standalone queued cancellation survives completion timers and never publishes", ctx => {
  ctx.mock.timers.enable({ apis: ["setTimeout"] });
  const before = getUploadedResources().length;
  const task = submitDerivation("source-cancel", 2, "cancel-owner");
  const rows = getDerivationRecords().filter(r => r.taskId === task.id);
  changeDerivations([rows[0].id], "cancel-owner", "cancel");
  ctx.mock.timers.tick(6000);
  assert.equal(derivationOutput(rows[0].id, "cancel-owner")?.status, "取消衍生");
  assert.equal(derivationOutput(rows[1].id, "cancel-owner")?.status, "成功");
  assert.equal(getUploadedResources().length, before);
});

test("cancel rechecks start boundary rather than trusting stale UI state", ctx => {
  ctx.mock.timers.enable({ apis: ["setTimeout"] });
  const task = submitDerivation("source-race", 1, "race-owner");
  const row = getDerivationRecords().find(r => r.taskId === task.id)!;
  assert.throws(() => validateDerivationSelection([row.id], row.ownerId, ["待衍生"], row.startedAt + 1001), /状态已变化/);
});

test("retry updates same record, delete retains original snapshot and history", ctx => {
  ctx.mock.timers.enable({ apis: ["setTimeout"] });
  seedDerivationExamples("retry-owner");
  const row = getDerivationRecords().find(r => r.ownerId === "retry-owner" && r.status === "失败")!;
  const before = getDerivationRecords().length, source = structuredClone(row.source);
  changeDerivations([row.id], row.ownerId, "retry");
  ctx.mock.timers.tick(6000);
  assert.equal(getDerivationRecords().length, before);
  assert.equal(derivationOutput(row.id, row.ownerId)?.status, "成功");
  changeDerivations([row.id], row.ownerId, "delete");
  assert.equal(derivationOutput(row.id, row.ownerId)?.status, "已删除");
  assert.equal(derivationOutput(row.id, row.ownerId)?.url, "");
  assert.deepEqual(derivationOutput(row.id, row.ownerId)?.source, source);
  assert.throws(() => validateDerivationSelection([row.id], row.ownerId, ["成功"]));
});

test("derive-and-push shared output registers once; cancellation stops every pending push", ctx => {
  ctx.mock.timers.enable({ apis: ["setTimeout"] });
  const store = createAdStore(), d = draft(), actor = getAdActor(), now = Date.now();
  d.derivation = { allocation: "shared", count: 1 };
  store.records = createAdRecords(d, store, actor, { id: "src-shared", title: "商品.mp4", videoUrl: "/media.mp4" }, now);
  syncPushDerivations(store.records, now); syncPushDerivations(store.records, now);
  const outputs = getDerivationRecords().filter(r => r.taskId === store.records[0].taskId);
  assert.equal(outputs.length, 1); assert.equal(store.records.length, 2);
  changeDerivations([outputs[0].id], actor.id, "cancel");
  const advanced = advanceAdStore(store, now + 20000);
  assert.ok(advanced.records.every(r => r.status === "已取消" && !r.assetId));
  ctx.mock.timers.tick(6000);
  assert.equal(derivationOutput(outputs[0].id, actor.id)?.status, "取消衍生");
});

test("existing outputs batch push keeps IDs, skips derivation delay, and groups multi-creative plans", ctx => {
  ctx.mock.timers.enable({ apis: ["setTimeout"] });
  const actor = getAdActor(), task = submitDerivation("source-batch", 3, actor.id, 0, { id: "source-batch", title: "商品.mp4" });
  ctx.mock.timers.tick(6000);
  const outputs = getDerivationRecords().filter(r => r.taskId === task.id), videos = outputs.map(r => ({ ...r.source, derivativeId: r.id }));
  const before = getDerivationRecords().length, store = createAdStore(), d = draft(), now = Date.now();
  const c = adCatalog(store.accounts.find(a => a.id === d.rows[0].accountId)!);
  d.rows = [{ ...d.rows[0], douyinId: c.douyins[0].id, storeId: c.stores[0].id, productId: c.products[0].id }];
  d.method = "plan"; d.creative = "多创意"; d.templateIds = ["template-qc-demo"]; d.workbench = { ...defaultWorkbench(), videoCount: "每个计划分配n个视频", count: 2 };
  store.records = createAdRecords(d, store, actor, videos, now);
  assert.equal(store.records.length, 3); assert.equal(new Set(store.records.map(r => r.planId)).size, 2);
  assert.ok(store.records.every(r => !r.snapshot.derivation));
  assert.throws(() => createAdRecords(d, store, actor, [videos[0], videos[0]], now), /重复/);
  syncPushDerivations(store.records, now);
  assert.equal(getDerivationRecords().length, before);
  const done = advanceAdStore(store, now + 8000);
  assert.ok(done.records.every(r => r.status === "推送成功"));
  createAdRecords({ ...d, method: "push" }, done, actor, videos, now + 10000);
  assert.equal(getDerivationRecords().length, before);
  changeDerivations([outputs[0].id], actor.id, "delete");
  assert.throws(() => createAdRecords(d, store, actor, videos), /已不可用/);
});

test("history cancellation cannot mutate another operator's record", () => {
  const store = createAdStore(), actor = getAdActor(), d = draft();
  const records = createAdRecords(d, store, actor, { id: "other-push", title: "其他用户视频" });
  records.forEach(r => { r.operatorId = "other-user"; });
  updateAdStore(s => ({ ...s, records }));
  assert.throws(() => cancelAdRecords([records[0].id], actor.id), /当前用户/);
});

test("operation records belong to action initiator, never anonymous; download is initiated", () => {
  recordOperation({ kind: "upload", name: "sample", type: "素材", status: "成功", message: "", ownerId: "actor-start" });
  storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "other" }));
  recordDownload("video.mp4", "成片", true, "actor-start");
  const download = getOperationRecords().find(r => r.name === "video.mp4")!;
  assert.equal(download.ownerId, "actor-start"); assert.equal(download.status, "已发起");
  assert.equal(operationUser(), "other");
  recordLogin("login-owner", false, "密码验证失败");
  assert.equal(getOperationRecords()[0].ownerId, "login-owner");
  const before = getOperationRecords().length;
  recordOperation({ ownerId: "", kind: "login", name: "invalid", type: "", status: "失败", message: "" });
  assert.equal(getOperationRecords().length, before);
});

test("library upload records each accepted file; rejected categories create no history", () => {
  const parent = resourceConfigStore.categories("materials")[0];
  const before = getOperationRecords().length;
  const input = { ownerId: "upload-start", partition: "素材" as const, primaryCategory: parent.name, secondaryCategory: parent.children[0].name, publicTags: [], personalTags: [], files: [{ name: "原料一.mp4", url: "/one.mp4" }, { name: "原料二.mp4", url: "/two.mp4" }] };
  const result = publishResources(input);
  assert.equal(getOperationRecords().length, before + 2);
  assert.ok(result.resources.every(r => getOperationRecords().some(o => o.resourceId === r.id && o.ownerId === input.ownerId)));
  assert.throws(() => publishResources({ ...input, primaryCategory: "不存在" }));
  assert.equal(getOperationRecords().length, before + 2);
});

test("operation fixtures are idempotent and scoped per user", () => {
  seedOperationExamples("fixture-a"); seedOperationExamples("fixture-a"); seedOperationExamples("fixture-b");
  const own = getOperationRecords().filter(r => r.ownerId === "fixture-a");
  assert.equal(own.length, 13);
  assert.equal(own.filter(r => r.kind === "upload" && r.status === "成功").length, 6);
  assert.ok(own.every(r => r.ownerId !== "fixture-b"));
});
