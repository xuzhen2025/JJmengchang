import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { activeAdDerivationCount, adCatalog, advanceAdStore, createAdRecords, createAdStore, getAdActor, type AdDraft } from "../src/lib/adPush";
import { defaultWorkbench, readAdPushSettings, saveAdPushSettings } from "../src/lib/adPushConfig";
import { activeDerivationCount, derivationCount, DERIVATION_TIME_MS, getDerivationTasks, submitDerivation, validateDerivationCount } from "../src/lib/videoDerivation";
import { getUploadedResources } from "../src/lib/resourceUploads";
import { changeThirdPartyLifecycle, getThirdPartyLifecycle } from "../src/lib/thirdPartyLifecycle";
import { resourceConfigStore } from "../src/lib/resourceConfig";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: new EventTarget(), configurable: true });
const video = { id: "derive-source", title: "商品展示" };
const draft = (): AdDraft => ({ platform: "巨量千川", method: "push", goal: "推商品", rows: [3, 4].map(n => ({ id: `row-${n}`, accountId: `288194018274011${n}`, douyinId: "", productId: "", storeId: "", planId: "" })), templateIds: [], version: "原片", naming: "{视频名称}_{衍生编号}", scheduledAt: "", creative: "单创意", derivation: { allocation: "per_account", count: 2 } });
beforeEach(() => {
  values.clear();
  storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan" }));
});

test("admin limit preserves old settings, validates input and normalizes invalid saved data", () => {
  assert.equal(readAdPushSettings().maxDerive, 100);
  saveAdPushSettings({ ...readAdPushSettings(), maxDerive: 4 });
  saveAdPushSettings({ namingRule: "title_only", customNaming: "", maxPush: 200 });
  assert.equal(readAdPushSettings().maxDerive, 4);
  for (const maxDerive of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => saveAdPushSettings({ ...readAdPushSettings(), maxDerive }));
  storage.setItem("mengchang-ad-push-settings", JSON.stringify({ maxDerive: -1 }));
  assert.equal(readAdPushSettings().maxDerive, 100);
  assert.match(validateDerivationCount(3, 4, 2), /本次最多可衍生 2/);
});

test("super admin gets derivation permissions before visiting admin; ordinary members do not", () => {
  assert.ok(getAdActor().permissions.includes("uc_derivation"));
  storage.setItem("cloud_video_roles_v2", JSON.stringify([{ id: "role_super_admin", checkedKeys: [] }]));
  assert.ok(getAdActor().permissions.includes("uc_derivation"));
  storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "staff" }));
  assert.equal(getAdActor().permissions.includes("uc_derivation"), false);
});

test("per-account copies get independent IDs and stay linked to source history", () => {
  const store = createAdStore(), now = Date.now();
  store.records = createAdRecords(draft(), store, getAdActor(), video, now);
  assert.equal(store.records.length, 4);
  assert.equal(new Set(store.records.map(r => r.derivativeId)).size, 4);
  assert.equal(activeAdDerivationCount(store.records, getAdActor().id, now), 4);
  assert.ok(store.records.every(r => r.videoId === video.id && r.assetName.includes(r.derivativeId!)));
  const processing = advanceAdStore(store, now + 2000);
  assert.ok(processing.records.every(r => r.status === "衍生中" && !r.assetId));
  assert.equal(activeAdDerivationCount(processing.records, getAdActor().id, now + DERIVATION_TIME_MS), 0);
  const done = advanceAdStore(processing, now + 16000);
  assert.ok(done.records.every(r => r.status === "推送成功"));
  assert.equal(new Set(done.records.map(r => r.assetId)).size, 4);
});

test("shared mode derives one file across accounts and enforces quota before allocation", () => {
  const d = draft(), store = createAdStore(), actor = getAdActor();
  d.derivation = { allocation: "shared", count: 1 };
  const records = createAdRecords(d, store, actor, video);
  assert.equal(records.length, 2);
  assert.equal(new Set(records.map(r => r.derivativeId)).size, 1);
  assert.equal(derivationCount(d.derivation, 0), 0);
  saveAdPushSettings({ ...readAdPushSettings(), maxDerive: 3 });
  assert.throws(() => createAdRecords(draft(), store, actor, video), /最多可衍生 3/);
  d.derivation = { allocation: "per_account", count: 1e12 };
  assert.throws(() => createAdRecords(d, store, actor, video), /最多可衍生/);
  assert.throws(() => createAdRecords(draft(), store, { ...actor, permissions: ["uc_ad_push"] }, video), /暂无衍生/);
  store.records = records;
  d.derivation = { allocation: "per_account", count: 2 };
  saveAdPushSettings({ ...readAdPushSettings(), maxDerive: 4 });
  assert.throws(() => createAdRecords(d, store, actor, video), /正在衍生/);
});

test("multiple plans in one account reuse derived files and append output IDs, not source", () => {
  const d = draft(), store = createAdStore(), actor = getAdActor(), now = Date.now();
  d.method = "full_domain"; d.workbench = { ...defaultWorkbench(), target: "商品全域" };
  const catalog = adCatalog(store.accounts.find(a => a.id === d.rows[0].accountId)!);
  d.rows = catalog.plans.filter(p => p.goal === "推商品").map((plan, i) => ({ ...d.rows[0], id: `plan-${i}`, douyinId: plan.douyinId, planId: plan.id }));
  store.records = createAdRecords(d, store, actor, video, now);
  assert.equal(store.records.length, 4);
  assert.equal(new Set(store.records.map(r => r.derivativeId)).size, 2);
  const done = advanceAdStore(store, now + 16000);
  const plans = adCatalog(done.accounts.find(a => a.id === d.rows[0].accountId)!).plans.filter(p => p.goal === "推商品");
  for (const plan of plans) {
    assert.equal(plan.videoIds.length, 3);
    assert.ok(!plan.videoIds.includes(video.id));
    assert.equal(plan.videoIds.filter(id => id.startsWith("DER-")).length, 2);
  }
  assert.deepEqual(advanceAdStore(done, now + 18000), done);
});

test("multi-creative derivation honors all-videos and per-plan counts", () => {
  const d = draft(), store = createAdStore(), actor = getAdActor(), now = Date.now();
  const c = adCatalog(store.accounts.find(a => a.id === d.rows[0].accountId)!);
  d.rows = [{ ...d.rows[0], douyinId: c.douyins[0].id, storeId: c.stores[0].id, productId: c.products[0].id }];
  d.derivation = { allocation: "per_account", count: 3 };
  d.method = "plan"; d.creative = "多创意"; d.templateIds = ["template-qc-demo"];
  d.workbench = defaultWorkbench();
  store.records = createAdRecords(d, store, actor, video, now);
  const all = advanceAdStore(store, now + 16000);
  assert.equal(new Set(all.records.map(r => r.planId)).size, 1);
  const plan = adCatalog(all.accounts.find(a => a.id === d.rows[0].accountId)!).plans.find(p => p.id === all.records[0].planId)!;
  assert.equal(plan.videoIds.length, 3);
  assert.equal(plan.materials?.length, 3);
  d.workbench.videoCount = "每个计划分配n个视频"; d.workbench.count = 2;
  store.records = [];
  store.records = createAdRecords(d, store, actor, video, now);
  const batched = advanceAdStore(store, now + 16000);
  const ids = new Set(batched.records.map(r => r.planId));
  assert.equal(ids.size, 2);
  assert.deepEqual(adCatalog(batched.accounts.find(a => a.id === d.rows[0].accountId)!).plans.filter(p => ids.has(p.id)).map(p => p.videoIds.length).sort(), [1, 2]);
});

test("average allocation divides derived videos across each account's plans", () => {
  const d = draft(), store = createAdStore(), now = Date.now();
  d.method = "full_domain"; d.workbench = { ...defaultWorkbench(), target: "商品全域", distribution: "平均分配" };
  const c = adCatalog(store.accounts.find(a => a.id === d.rows[0].accountId)!);
  d.rows = c.plans.filter(p => p.goal === "推商品").map((p, i) => ({ ...d.rows[0], id: `plan-${i}`, douyinId: p.douyinId, planId: p.id }));
  d.derivation = { allocation: "per_account", count: 4 };
  store.records = createAdRecords(d, store, getAdActor(), video, now);
  assert.equal(store.records.length, 4);
  assert.equal(new Set(store.records.map(r => r.derivativeId)).size, 4);
  const done = advanceAdStore(store, now + 16000);
  assert.ok(adCatalog(done.accounts.find(a => a.id === d.rows[0].accountId)!).plans.filter(p => p.goal === "推商品").every(p => p.videoIds.length === 3));
  d.derivation.count = 1;
  assert.throws(() => createAdRecords(d, store, getAdActor(), video), /不足以平均分配/);
});

test("standalone completion only creates task metadata and does not publish resources", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const before = getUploadedResources().length;
  saveAdPushSettings({ ...readAdPushSettings(), maxDerive: 3 });
  const task = submitDerivation(video.id, 2, "standalone-owner");
  assert.equal(activeDerivationCount("standalone-owner"), 2);
  assert.throws(() => submitDerivation(video.id, 2, "standalone-owner"), /正在衍生/);
  context.mock.timers.tick(DERIVATION_TIME_MS);
  const completed = getDerivationTasks().find(t => t.id === task.id)!;
  assert.equal(completed.status, "已完成");
  assert.equal(completed.resultIds.length, 2);
  assert.equal(activeDerivationCount("standalone-owner"), 0);
  assert.equal(getUploadedResources().length, before);
});

test("third-party trash preserves classification; permanent deletion releases it and cannot restore", () => {
  const parent = resourceConfigStore.categories("thirdParty")[0];
  const resource = { id: "lifecycle-test", category: `${parent.name} / ${parent.children[0].name}` };
  resourceConfigStore.register("thirdParty", [resource]);
  const before = resourceConfigStore.categoryUsage("thirdParty", parent.id);
  changeThirdPartyLifecycle([resource.id], "deleted");
  assert.equal(getThirdPartyLifecycle()[resource.id], undefined);
  changeThirdPartyLifecycle([resource.id], "trash", "用户端");
  assert.equal(getThirdPartyLifecycle()[resource.id].deletedSource, "用户端");
  assert.equal(resourceConfigStore.categoryUsage("thirdParty", parent.id), before);
  changeThirdPartyLifecycle([resource.id], "active");
  assert.deepEqual(getThirdPartyLifecycle()[resource.id], { state: "active" });
  changeThirdPartyLifecycle([resource.id], "trash");
  changeThirdPartyLifecycle([resource.id], "deleted");
  assert.equal(resourceConfigStore.categoryUsage("thirdParty", parent.id), before - 1);
  changeThirdPartyLifecycle([resource.id], "active");
  assert.equal(getThirdPartyLifecycle()[resource.id].state, "deleted");
});
