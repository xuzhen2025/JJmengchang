import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { cancelAdRecords, createAdRecords, createAdStore, getAdActor, readAdStore, updateAdStore, type AdDraft } from "../src/lib/adPush";
import { canUseDerivations } from "../src/lib/derivationPermissions";
import { activeDerivationCount, changeDerivations, DERIVATION_STATUSES, derivationOutput, derivationVideo, getDerivationNoteHistory, getDerivationRecords, seedVideoDerivationExamples, submitDerivation, validateDerivationSelection } from "../src/lib/videoDerivation";
import { derivativeAnalyticsRows } from "../src/lib/derivationAnalytics";
import { readReportOrganization } from "../src/lib/analyticsOrganization";
import { getUploadedResources } from "../src/lib/resourceUploads";
import { INITIAL_FINISHED } from "../src/data/finishedVideos";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: new EventTarget(), configurable: true });
const session = (id: string, permissions: string[] = []) => {
  storage.setItem("mengchang_prototype_session", JSON.stringify({ username: id }));
  storage.setItem("cloud_video_roles_v2", JSON.stringify([{ id: "role_staff", enabled: true, checkedKeys: permissions }]));
};
const draft = (): AdDraft => ({ platform: "巨量千川", method: "push", goal: "推商品", rows: [{ id: "row", accountId: "2881940182740113", douyinId: "", productId: "", storeId: "", planId: "" }], templateIds: [], version: "原片", naming: "{视频名称}", scheduledAt: "", creative: "单创意" });
beforeEach(() => { values.clear(); session("chaojiguanliyuan"); });
seedVideoDerivationExamples({ id: "fv1", title: "商品特写.mp4" }, [{ id: "member-a", name: "张三" }, { id: "member-b", name: "李四" }]);
seedVideoDerivationExamples({ id: "fv2", title: "商品试用.mp4" }, [{ id: "member-a", name: "张三" }]);

test("one independent permission gates every derivative operation; legacy keys do not grant it", () => {
  session("staff", ["uc_ad_push", "uc_finished_delete", "uc_finished_edit", "uc_finished_derive", "uc_finished_derive_push"]);
  assert.equal(canUseDerivations(getAdActor()), false);
  for (const action of ["note", "delete", "retry", "cancel"] as const) assert.throws(() => changeDerivations(["DER-fv1-DEMO-1"], "staff", action, "", "fv1"), /暂无衍生视频权限/);
  assert.throws(() => validateDerivationSelection(["DER-fv1-DEMO-1"], "staff", ["成功"], Date.now(), "fv1"), /暂无衍生视频权限/);
  assert.throws(() => submitDerivation("fv1", 1, "staff"), /暂无衍生视频权限/);
  assert.throws(() => createAdRecords(draft(), createAdStore(), getAdActor(), derivationVideo(derivationOutput("DER-fv1-DEMO-1")!)), /暂无衍生视频权限/);
});

test("source detail can access all member outputs, while operation history remains owner-scoped", () => {
  session("staff", ["uc_derivation"]);
  assert.equal(validateDerivationSelection(["DER-fv1-DEMO-1", "DER-fv1-DEMO-2"], "staff", ["成功"], Date.now(), "fv1").length, 2);
  assert.throws(() => validateDerivationSelection(["DER-fv2-DEMO-1"], "staff", undefined, Date.now(), "fv1"), /当前成片/);
  assert.throws(() => validateDerivationSelection(["DER-fv1-DEMO-1"], "staff"), /当前用户/);
  const store = createAdStore(), output = derivationOutput("DER-fv1-DEMO-1")!;
  const pushed = createAdRecords(draft(), store, getAdActor(), derivationVideo(output));
  assert.equal(pushed[0].derivativeId, output.id);
  assert.equal(pushed[0].assetName, output.name);
  assert.equal(pushed[0].snapshot.derivation, undefined);
  assert.throws(() => createAdRecords(draft(), store, getAdActor(), output.source), /暂无推送权限/);
});

test("notes can be cleared, history belongs to the editing user and filters unique keywords", () => {
  session("editor-a", ["uc_derivation"]);
  changeDerivations(["DER-fv1-DEMO-1"], "editor-a", "note", "首轮投放，产品特写, 首轮投放", "fv1");
  assert.deepEqual(getDerivationNoteHistory("editor-a"), ["首轮投放", "产品特写"]);
  assert.deepEqual(getDerivationNoteHistory("member-a"), []);
  assert.throws(() => changeDerivations(["DER-fv1-DEMO-1"], "editor-a", "note", "字".repeat(201), "fv1"), /最多200/);
  changeDerivations(["DER-fv1-DEMO-1"], "editor-a", "note", "  ", "fv1");
  assert.equal(derivationOutput("DER-fv1-DEMO-1")!.note, "");
  assert.deepEqual(getDerivationNoteHistory("editor-a"), ["首轮投放", "产品特写"]);
  session("editor-b", ["uc_derivation"]);
  assert.deepEqual(getDerivationNoteHistory("editor-b"), []);
});

test("derivative-only permission permits cancelling pending derivative pushes but not original pushes", () => {
  session("staff", ["uc_derivation"]);
  const d = draft(); d.scheduledAt = new Date(Date.now() + 3600000).toISOString();
  const records = createAdRecords(d, createAdStore(), getAdActor(), derivationVideo(derivationOutput("DER-fv1-DEMO-2")!));
  updateAdStore(s => ({ ...s, records }));
  cancelAdRecords([records[0].id], "staff");
  assert.equal(readAdStore().records[0].status, "已取消");
  updateAdStore(s => ({ ...s, records: records.map(r => ({ ...r, derivativeId: undefined })) }));
  assert.throws(() => cancelAdRecords([records[0].id], "staff"), /无操作权限/);
});

test("analysis uses derivative identity, keeps same-name rows separate and never invents new delivery", () => {
  const org = readReportOrganization();
  const first = { ...derivationOutput("DER-fv1-DEMO-1")!, name: "同名衍生.mp4", ownerName: org.members[0].name };
  const second = { ...derivationOutput("DER-fv1-DEMO-2")!, name: first.name, example: false };
  const push = { ...createAdStore().records[0], derivativeId: first.id, status: "推送成功" as const, deliveryStatus: "投放中" };
  const rows = derivativeAnalyticsRows([first, second], [push], org);
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].videoId, rows[1].videoId);
  assert.equal(rows[0].video, rows[1].video);
  assert.equal(rows[0].author, org.members[0].name);
  assert.ok(rows[0].cost > 0);
  assert.equal(rows[1].cost, 0);
  assert.equal(rows[1].impressions, 0);
  assert.equal(derivativeAnalyticsRows([first], [{ ...push, status: "推送失败" }], org)[0].cost, 0);
  assert.ok(getDerivationRecords().some(record => record.status === "待衍生"));
  assert.equal(derivativeAnalyticsRows(getDerivationRecords(), [], org).some(row => row.videoId === "DER-fv1-DEMO-4"), false);
});

test("all on-machine demo sources have isolated playable examples without consuming quotas or publishing files", () => {
  const owners = [{ id: "demo-editor", name: "徐振" }, { id: "demo-colleague", name: "张总" }];
  const before = getUploadedResources().length, active = activeDerivationCount(owners[0].id);
  const sources = INITIAL_FINISHED.filter(video => video.status === "已上机");
  assert.equal(sources.length, 8);
  for (const source of sources) {
    const { id } = source;
    seedVideoDerivationExamples(source, owners);
    seedVideoDerivationExamples(source, owners);
    const examples = getDerivationRecords().filter(record => record.source.id === id);
    assert.equal(examples.length, 8);
    assert.deepEqual(new Set(examples.map(record => record.status)), new Set(DERIVATION_STATUSES));
    assert.ok(examples.every(record => record.id.startsWith(`DER-${id}-`) && record.name.startsWith(source.title.replace(/\.mp4$/i, ""))));
    assert.ok(examples.filter(record => record.status === "成功").every(record => record.url.startsWith("./assets/viral-gallery/")));
  }
  seedVideoDerivationExamples({ id: "user-upload", title: "用户上传.mp4" }, owners);
  assert.equal(getDerivationRecords().some(record => record.source.id === "user-upload"), false);
  assert.equal(getUploadedResources().length, before);
  assert.equal(activeDerivationCount(owners[0].id), active);
});
