import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { AD_STORE_KEY, DEFAULT_AD_PARAMETERS, adCatalog, advanceAdStore, authorizeAdAccount, cancelAdRecords, canSeeAdAccount, createAdRecords, createAdStore, getAdActor, groupAdRows, readAdStore, resolveAdName, revokeAdAccounts, saveAdTemplate, updateAdStore, validateAdDraft, validateAdTemplate, visibleAdRecords, type AdDraft, type AdTemplate } from "../src/lib/adPush";
import { defaultWorkbench, targetGoal, validateWorkbench } from "../src/lib/adPushConfig";
import { saveResourceEdits } from "../src/lib/useResourceEdits";
import { resourceTagStore } from "../src/lib/resourceTags";
import { resourceConfigStore } from "../src/lib/resourceConfig";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
const target = new EventTarget();
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: Object.assign(target, { localStorage: storage, sessionStorage: storage }), configurable: true });
const video = { id: "test-video", title: "测试视频", author: "测试作者" };
const draft = (): AdDraft => ({ platform: "巨量千川", method: "push", goal: "推商品", rows: [{ id: "row1", accountId: "2881940182740113", douyinId: "", productId: "", storeId: "", planId: "" }], templateIds: [], version: "原片", naming: "{视频名称}", scheduledAt: "", creative: "单创意" });
const planDraft = () => {
  const d = draft(); d.method = "plan"; d.templateIds = ["template-qc-demo"];
  const c = adCatalog(readAdStore().accounts.find(a => a.id === d.rows[0].accountId)!);
  Object.assign(d.rows[0], { douyinId: c.douyins[0].id, storeId: c.stores[0].id, productId: c.products[0].id });
  return d;
};
beforeEach(() => { values.clear(); storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan" })); storage.setItem(AD_STORE_KEY, JSON.stringify(createAdStore())); });

test("push permission and account visibility are independent gates", () => {
  const s = readAdStore(), actor = getAdActor(), a = s.accounts.find(a => a.id === draft().rows[0].accountId)!;
  assert.equal(validateAdDraft(draft(), s, { ...actor, permissions: [] }), "暂无推送权限");
  assert.equal(canSeeAdAccount(a, { ...s, visibility: "personal" }, { ...actor, name: "其他成员" }), false);
  const restricted = { ...s, groups: s.groups.map(g => ({ ...g, viewUsers: ["其他成员"], viewTeam: "", viewGroup: "" })) };
  assert.equal(canSeeAdAccount(a, restricted, actor), false);
  assert.equal(validateAdDraft(draft(), restricted, actor).includes("无操作权限"), true);
});
test("new account is ungrouped and private; reauthorization upserts", () => {
  authorizeAdAccount("巨量千川", "fresh", "新账户");
  let s = readAdStore(); const a = s.accounts.find(a => a.id === "fresh")!;
  assert.equal(a.group, "");
  assert.equal(canSeeAdAccount(a, s, { ...getAdActor(), name: "普通用户" }), false);
  authorizeAdAccount("巨量千川", "fresh", "更新账户名"); s = readAdStore();
  assert.equal(s.accounts.filter(a => a.id === "fresh").length, 1);
  assert.ok(adCatalog(s.accounts.find(a => a.id === "fresh")!).douyins.length);
});
test("only-push needs no product, store or template", () => assert.equal(validateAdDraft(draft(), readAdStore(), getAdActor()), ""));
test("plan requires both permissions and account-scoped objects", () => {
  const d = planDraft(), s = readAdStore(), actor = getAdActor();
  assert.equal(validateAdDraft(d, s, { ...actor, permissions: ["uc_ad_push"] }), "暂无管理投放计划权限");
  d.rows[0].productId = "wrong-account-product";
  assert.match(validateAdDraft(d, s, actor), /补全/);
});
test("same account may repeat with distinct Douyin and store combinations", () => {
  const d = planDraft(); d.rows.push({ ...d.rows[0], id: "row2" });
  assert.match(validateAdDraft(d, readAdStore(), getAdActor()), /不能重复/);
  const c = adCatalog(readAdStore().accounts.find(a => a.id === d.rows[0].accountId)!);
  d.rows[1].douyinId = c.douyins[1].id;
  assert.equal(validateAdDraft(d, readAdStore(), getAdActor()), "");
  assert.equal(createAdRecords(d, readAdStore(), getAdActor(), video).length, 2);
});
test("live-room plan needs no product", () => {
  const d = planDraft(); d.goal = "推直播间"; d.rows[0].productId = "";
  const s = readAdStore(); s.templates[0].goal = "推直播间";
  assert.equal(validateAdDraft(d, s, getAdActor()), "");
});
test("template needs dynamic word and preserves click order with fixed text", () => {
  const t = { ...readAdStore().templates[0], naming: "固定文字" };
  assert.match(validateAdTemplate(t), /动态词包/);
  assert.equal(resolveAdName("前缀{视频作者}_{视频名称}", video, getAdActor()), "前缀测试作者_测试视频");
});
test("template number is generated on save and survives editing", () => {
  const t: AdTemplate = { ...readAdStore().templates[0], id: "new-template", suffix: "", params: { ...DEFAULT_AD_PARAMETERS } };
  const saved = saveAdTemplate(t), other = saveAdTemplate({ ...t, id: "other-template" });
  assert.match(saved.suffix, /^_\d{8}_\d{3,}$/);
  assert.notEqual(saved.suffix, other.suffix);
  assert.equal(saveAdTemplate({ ...saved, name: "已编辑" }).suffix, saved.suffix);
});
test("task snapshot survives editing and deletion of template", () => {
  const records = createAdRecords(planDraft(), readAdStore(), getAdActor(), video);
  updateAdStore(s => ({ ...s, records, templates: [] }));
  assert.equal(readAdStore().records[0].templateSnapshot?.name, "千川日常销售");
});
test("multiple accounts produce separate platform material IDs", () => {
  const d = draft(); d.rows.push({ ...d.rows[0], id: "r2", accountId: "2881940182740114" });
  const now = Date.now(), s = readAdStore(); s.records = createAdRecords(d, s, getAdActor(), video, now);
  const completed = advanceAdStore(s, now + 10000);
  assert.ok(completed.records.every(r => r.status === "推送成功"));
  assert.equal(new Set(completed.records.map(r => r.assetId)).size, 2);
});
test("new plan completes paused with independent review fields", () => {
  const s = readAdStore(), now = Date.now(); s.records = createAdRecords(planDraft(), s, getAdActor(), video, now);
  const r = advanceAdStore(s, now + 10000).records[0];
  assert.equal(r.deliveryStatus, "已暂停"); assert.equal(r.materialReview, "审核通过"); assert.equal(r.planReview, "审核通过"); assert.ok(r.planId);
});
test("full-domain appends exactly once and preserves existing videos and status", () => {
  const s = readAdStore(), d = draft(), now = Date.now(); d.method = "full_domain";
  const a = s.accounts.find(a => a.id === d.rows[0].accountId)!, p = adCatalog(a).plans[0];
  Object.assign(d.rows[0], { douyinId: p.douyinId, planId: p.id });
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const next = advanceAdStore(s, now + 10000), final = advanceAdStore(next, now + 11000);
  const result = adCatalog(final.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0];
  assert.deepEqual(result.videoIds, ["existing-video", video.id]); assert.equal(result.status, p.status); assert.equal(next, final);
});
test("active task blocks batch revoke; cancelling queued task allows revoke", () => {
  const d = draft(); d.scheduledAt = new Date(Date.now() + 3600000).toISOString();
  const records = createAdRecords(d, readAdStore(), getAdActor(), video);
  updateAdStore(s => ({ ...s, records }));
  assert.throws(() => revokeAdAccounts([d.rows[0].accountId, "2881940182740114"], d.platform), /进行中/);
  assert.equal(readAdStore().accounts.find(a => a.id === "2881940182740114")!.status, "authorized");
  cancelAdRecords(records.map(r => r.id)); revokeAdAccounts([d.rows[0].accountId], d.platform);
  assert.equal(readAdStore().accounts.find(a => a.id === d.rows[0].accountId)!.revoked, true);
  assert.equal(readAdStore().records.length, 1);
});
test("expired during execution fails only that account; other results retained", () => {
  const s = readAdStore(), d = draft(), now = Date.now(); d.rows.push({ ...d.rows[0], id: "row2", accountId: "2881940182740114" });
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.accounts = s.accounts.map(a => a.id === d.rows[0].accountId ? { ...a, status: "expired" } : a);
  const result = advanceAdStore(s, now + 10000);
  assert.deepEqual(result.records.map(r => r.status), ["推送失败", "推送成功"]);
});
test("records filter by video and visible account, not operator", () => {
  const s = readAdStore(), actor = getAdActor();
  assert.equal(visibleAdRecords(s, actor, "fv1").length, 2);
  assert.equal(visibleAdRecords(s, actor, "other-video").length, 0);
  assert.equal(visibleAdRecords({ ...s, visibility: "personal" }, { ...actor, name: "普通用户" }, "fv1").length, 0);
});
test("resource status update merges without removing existing metadata", () => {
  assert.ok(saveResourceEdits("finished", { fv1: { title: "商品实拍成片", status: "待审核", tags: ["产品实拍"] } }));
  assert.ok(saveResourceEdits("finished", { fv1: { status: "已上机" } }));
  assert.deepEqual(JSON.parse(storage.getItem("mengchang-resource-edits-v1-finished")!).fv1, { title: "商品实拍成片" });
  assert.equal(resourceConfigStore.project("finished", { id: "fv1", status: "待审核" }).status, "已上机");
  assert.deepEqual(resourceTagStore.project("finished", { id: "fv1" }).publicTags, ["产品实拍"]);
});

test("status updates preserve legacy stored metadata without reviving obsolete tags", () => {
  storage.setItem("mengchang-resource-edits-v1-finished", JSON.stringify({
    legacy: { title: "历史成片", tags: ["原标签"], status: "待审核" },
  }));
  assert.ok(saveResourceEdits("finished", { legacy: { status: "已上机" } }));
  assert.deepEqual(JSON.parse(storage.getItem("mengchang-resource-edits-v1-finished")!).legacy, {
    title: "历史成片",
  });
  assert.equal(resourceConfigStore.project("finished", { id: "legacy", status: "待审核" }).status, "已上机");
  assert.deepEqual(resourceTagStore.project("finished", { id: "legacy" }).publicTags, []);
});

const fullDraft = (create = false) => {
  const d = planDraft(); d.method = "full_domain"; d.templateIds = [];
  d.workbench = { ...defaultWorkbench(), target: "商品全域", operation: create ? "create" : "append", budget: "600", roi: "2.5", titles: ["商品实拍展示"], planName: "{创建日期}_{商品名称}_{整体支付ROI目标}" };
  if (!create) d.rows[0].planId = adCatalog(readAdStore().accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].id;
  return d;
};

test("four visible targets map to two plan categories", () => {
  assert.equal(targetGoal("直播全域"), "推直播间"); assert.equal(targetGoal("直播乘方"), "推直播间");
  assert.equal(targetGoal("商品全域"), "推商品"); assert.equal(targetGoal("商品乘方"), "推商品");
  const d = fullDraft(); d.workbench!.target = "直播乘方";
  assert.match(validateAdDraft(d, readAdStore(), getAdActor()), /不一致/);
});
test("AIGC identifier is the video ID, not the employee ID", () => {
  assert.equal(resolveAdName("{梦畅AIGC编号}_{视频标题}", video, getAdActor()), "test-video_测试视频");
});
test("full-domain creation validates money precision, titles and supported targets", () => {
  const c = fullDraft(true).workbench!;
  assert.equal(validateWorkbench(c), "");
  assert.match(validateWorkbench({ ...c, budget: "600.001" }), /两位小数/);
  assert.match(validateWorkbench({ ...c, roi: "NaN" }), /ROI/);
  assert.match(validateWorkbench({ ...c, titles: [] }), /标题/);
  assert.match(validateWorkbench({ ...c, target: "直播全域" }), /直播/);
});
test("new full-domain plans are created once, paused, with immutable configuration", () => {
  const s = readAdStore(), d = fullDraft(true), now = Date.now();
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  d.workbench!.budget = "900";
  const next = advanceAdStore(s, now + 10000), again = advanceAdStore(next, now + 12000);
  assert.equal(next, again);
  const r = next.records[0], plan = adCatalog(next.accounts.find(a => a.id === r.accountId)!).plans.find(p => p.id === r.planId)!;
  assert.equal(plan.status, "已暂停"); assert.equal(plan.budget, 600); assert.equal(r.planResult, "创建成功");
  assert.match(plan.name, /ELL卸妆油_2.5/); assert.doesNotMatch(plan.name, /\{/);
});
test("grouping creates the advertised number of plans within each account", () => {
  const d = fullDraft(true), first = d.rows[0], c = adCatalog(readAdStore().accounts.find(a => a.id === first.accountId)!);
  d.rows.push({ ...first, id: "second", douyinId: c.douyins[1].id, productId: c.products[1].id });
  const counts = { "每个商品一条计划": 2, "每个抖音号一条计划": 2, "全量组合（商品+抖音号）": 4, "聚合为一条计划": 1 };
  for (const [grouping, count] of Object.entries(counts)) {
    d.workbench!.target = "商品乘方"; d.workbench!.grouping = grouping;
    assert.equal(groupAdRows(d).length, count);
    assert.equal(createAdRecords(d, readAdStore(), getAdActor(), video).length, count);
  }
});
test("single-video average distribution does not silently submit empty targets", () => {
  const d = fullDraft(); d.workbench!.distribution = "平均分配";
  const c = adCatalog(readAdStore().accounts.find(a => a.id === d.rows[0].accountId)!);
  const other = c.plans.find(p => p.goal === d.goal && p.id !== d.rows[0].planId)!;
  d.rows.push({ ...d.rows[0], id: "other", planId: other.id, douyinId: other.douyinId });
  assert.match(validateAdDraft(d, readAdStore(), getAdActor()), /平均分配/);
});
test("removal uses platform material IDs after success, and leaves the plan state unchanged", () => {
  const d = fullDraft(), s = readAdStore(), now = Date.now();
  const a = s.accounts.find(a => a.id === d.rows[0].accountId)!, p = adCatalog(a).plans[0];
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = p.materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const pending = advanceAdStore(s, now + 2000);
  assert.deepEqual(adCatalog(pending.accounts.find(x => x.id === a.id)!).plans[0].videoIds, ["existing-video"]);
  const next = advanceAdStore(pending, now + 10000), plan = adCatalog(next.accounts.find(x => x.id === a.id)!).plans[0];
  assert.deepEqual(plan.videoIds, [video.id]); assert.equal(plan.status, p.status);
  assert.match(next.records[0].logs.at(-1)!.text, /移除 1/);
});
test("failed pushes never remove existing plan videos", () => {
  const d = fullDraft(), s = readAdStore(), now = Date.now();
  d.workbench!.removal = "移除卡审视频";
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.accounts = s.accounts.map(a => a.id === d.rows[0].accountId ? { ...a, status: "expired" } : a);
  const next = advanceAdStore(s, now + 10000);
  assert.equal(next.records[0].status, "推送失败");
  assert.deepEqual(adCatalog(next.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, ["existing-video"]);
});
test("low-data removal requires complete matching windows, not missing data treated as zero", () => {
  const d = fullDraft(), s = readAdStore(), now = Date.now();
  Object.assign(d.workbench!, { removal: "移除低数据视频", costDays: "7", costMin: "0", costMax: "100", roiDays: "7", roiMax: "2" });
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const next = advanceAdStore(s, now + 10000);
  assert.deepEqual(adCatalog(next.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, [video.id]);
  d.workbench!.roiDays = "31"; s.records = createAdRecords(d, s, getAdActor(), video, now);
  const incomplete = advanceAdStore(s, now + 10000);
  assert.deepEqual(adCatalog(incomplete.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, ["existing-video", video.id]);
});
test("scheduled workbench submissions enforce one hour to thirty days", () => {
  const d = fullDraft(); d.scheduledAt = new Date(Date.now() + 600000).toISOString();
  assert.match(validateAdDraft(d, readAdStore(), getAdActor()), /1小时/);
  d.scheduledAt = new Date(Date.now() + 86400000).toISOString();
  assert.equal(validateAdDraft(d, readAdStore(), getAdActor()), "");
});
