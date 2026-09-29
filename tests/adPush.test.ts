import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { AD_STORE_KEY, DEFAULT_AD_PARAMETERS, adAccountState, adCatalog, advanceAdStore, authorizeAdAccount, authorizeAdAccounts, cancelActiveAdRecords, cancelAdRecords, canSeeAdAccount, canUseAdAccount, createAdRecords, createAdStore, getAdActor, groupAdRows, hasConfirmedAdMaterial, readAdStore, resolveAdName, retryAdRecords, revokeAdAccounts, saveAdTemplate, updateAdStore, validateAdDraft, validateAdTemplate, visibleAdRecords, type AdDraft, type AdStore, type AdTemplate } from "../src/lib/adPush";
import { defaultWorkbench, targetGoal, validateWorkbench } from "../src/lib/adPushConfig";
import { adProductIssue, adSubmissionSummary, recheckAdRecords, adRetryBlockReason, adConfirmationIssue, syncAdCatalogFixture } from "../src/lib/adPush";
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

test("confirmation rejects changed template budgets and claimed plan names", () => {
  const store = readAdStore(), records = createAdRecords(planDraft(), store, getAdActor(), video);
  assert.equal(adConfirmationIssue(records, store), "");
  store.templates[0].workbench!.budget = "900";
  assert.match(adConfirmationIssue(records, store), /模板已发生变化/);
  store.templates[0] = structuredClone(records[0].templateSnapshot!);
  const account = store.accounts.find(item => item.id === records[0].accountId)!;
  account.catalog = adCatalog(account);
  account.catalog.plans[0].name = records[0].planName;
  assert.match(adConfirmationIssue(records, store), /名称已被使用/);
});

test("explicit demo catalog sync fills known metadata without changing plans or custom eligibility", () => {
  const account = readAdStore().accounts[0];
  Object.assign(account, { platform: "巨量千川", status: "authorized", ecpType: "COMMON_STAR" });
  account.catalog = adCatalog(account);
  const product = account.catalog.products[0];
  delete product.source;
  product.grayReasons = ["自定义禁用原因"];
  const synced = syncAdCatalogFixture(account);
  assert.equal(synced.catalog!.products[0].source, "talent");
  assert.deepEqual(synced.catalog!.products[0].grayReasons, ["自定义禁用原因"]);
  assert.deepEqual(synced.catalog!.plans, account.catalog.plans);
  account.connectionStatus = "disconnected";
  assert.equal(syncAdCatalogFixture(account), account);
});

test("unsupported Douyin profile visibility cannot bypass a disabled control", () => {
  const store = readAdStore(), d = planDraft();
  const account = store.accounts.find(item => item.id === d.rows[0].accountId)!;
  account.catalog = adCatalog(account);
  account.catalog.douyins[0].bindType = "OTHER";
  store.templates[0].workbench!.profile = "主页始终可见";
  assert.throws(() => createAdRecords(d, store, getAdActor(), video), /不支持配置主页展示/);
  store.templates[0].workbench!.profile = "默认";
  assert.equal(createAdRecords(d, store, getAdActor(), video).length, 1);
  store.templates[0].workbench!.bidding = "放量投放";
  store.templates[0].workbench!.roi = "";
  assert.equal(resolveAdName("{整体支付ROI目标}", video, getAdActor(), store.templates[0]), "");
});

test("creation dates and Chinese weighted title lengths match the API contract", () => {
  const config = { ...defaultWorkbench(), target: "商品全域" as const, operation: "create" as const, budget: "20.01", roi: "2.5", planName: "测试计划", titles: ["1234567890"] };
  assert.equal(validateWorkbench(config), "");
  assert.match(validateWorkbench({ ...config, titles: ["一"] }), /10至110/);
  assert.equal(validateWorkbench({ ...config, titles: ["a".repeat(110)] }), "");
  assert.match(validateWorkbench({ ...config, titles: ["测".repeat(56)] }), /10至110/);
  assert.match(validateWorkbench({ ...config, period: "设置开始和结束时间", start: "2020-01-01", end: "2020-01-02" }), /不得早于当天/);
  assert.match(validateWorkbench({ ...config, period: "设置开始和结束时间", start: "2026-99-99", end: "2026-99-99" }), /有效/);
});

test("templates missing titles cannot bypass direct creation validation", () => {
  const s = readAdStore(), d = planDraft();
  s.templates[0].workbench!.titles = [""];
  assert.throws(() => createAdRecords(d, s, getAdActor(), video), /标题/);
  s.templates[0].workbench = undefined;
  assert.throws(() => createAdRecords(d, s, getAdActor(), video), /待补全/);
});

test("plan preview counts and budgets match single and multi creative execution", () => {
  for (const creative of ["单创意", "多创意"] as const) {
    const s = readAdStore(), d = planDraft(), now = Date.now();
    d.creative = creative; d.derivation = { allocation: "per_account", count: 3 };
    d.workbench = { ...s.templates[0].workbench!, videoCount: "每个计划分配n个视频", count: 2 };
    const summary = adSubmissionSummary(d, s);
    s.records = createAdRecords(d, s, getAdActor(), video, now);
    const done = advanceAdStore(s, now + 30000);
    assert.equal(summary.plans, creative === "单创意" ? 3 : 2);
    assert.equal(new Set(done.records.map(record => record.planId)).size, summary.plans);
    assert.equal(summary.budget, summary.plans * 300);
  }
});

test("ordinary multi-video creation shares the same grouping as derivations", () => {
  const s = readAdStore(), d = planDraft(), now = Date.now();
  d.creative = "多创意"; d.workbench = { ...s.templates[0].workbench!, videoCount: "每个计划分配n个视频", count: 2 };
  const videos = [1, 2, 3].map(id => ({ ...video, id: String(id) }));
  s.records = createAdRecords(d, s, getAdActor(), videos, now);
  const done = advanceAdStore(s, now + 10000);
  assert.equal(new Set(done.records.map(record => record.planId)).size, adSubmissionSummary(d, s, 3).plans);
  assert.equal(new Set(done.records.map(record => record.planId)).size, 2);
});

test("all-success strategy waits only for videos in the same plan and resumes after retry", () => {
  const s = readAdStore(), d = planDraft(), now = Date.now();
  d.creative = "多创意"; d.workbench = { ...s.templates[0].workbench!, strategy: "全部成功才搭建计划" };
  const videos = [1, 2, 3].map(id => ({ ...video, id: String(id) }));
  s.records = createAdRecords(d, s, getAdActor(), videos, now);
  s.records[0].simulationFailure = { step: "upload", message: "模拟上传网络失败" };
  const waiting = advanceAdStore(s, now + 10000);
  assert.deepEqual(waiting.records.map(record => record.status), ["推送失败", "待确认", "待确认"]);
  assert.ok(waiting.records.every(record => !record.planId));
  updateAdStore(() => waiting); retryAdRecords([waiting.records[0].id]);
  const done = advanceAdStore(readAdStore(), now + 30000);
  assert.ok(done.records.every(record => record.planResult === "创建成功"));
  assert.equal(new Set(done.records.map(record => record.planId)).size, 1);
});

test("skip-failure strategy creates a plan with only successfully uploaded videos", () => {
  const s = readAdStore(), d = planDraft(), now = Date.now();
  d.creative = "多创意"; d.workbench = { ...s.templates[0].workbench!, strategy: "跳过失败的直接搭建" };
  s.records = createAdRecords(d, s, getAdActor(), [video, { ...video, id: "second" }], now);
  s.records[0].simulationFailure = { step: "upload", message: "模拟上传失败" };
  const done = advanceAdStore(s, now + 10000);
  assert.equal(done.records[0].status, "推送失败");
  assert.equal(done.records[1].planResult, "创建成功");
  assert.deepEqual(adCatalog(done.accounts.find(a => a.id === d.rows[0].accountId)!).plans.find(p => p.id === done.records[1].planId)!.videoIds, ["second"]);
  updateAdStore(() => done); retryAdRecords([done.records[0].id]);
  const recovered = advanceAdStore(readAdStore(), now + 30000);
  assert.equal(recovered.records[0].planId, done.records[1].planId);
  assert.equal(recovered.records[0].planResult, "追加成功");
  assert.equal(recovered.records[0].enableResult, "不涉及");
  assert.equal(adCatalog(recovered.accounts.find(a => a.id === d.rows[0].accountId)!).plans.filter(p => p.id === done.records[1].planId).length, 1);
});

test("one failed plan does not block a different plan in the same account", () => {
  const s = readAdStore(), d = planDraft(), now = Date.now();
  d.creative = "多创意"; d.workbench = { ...s.templates[0].workbench!, strategy: "全部成功才搭建计划", videoCount: "每个计划分配n个视频", count: 2 };
  s.records = createAdRecords(d, s, getAdActor(), [1, 2, 3].map(id => ({ ...video, id: String(id) })), now);
  s.records[0].simulationFailure = { step: "upload", message: "模拟上传失败" };
  const done = advanceAdStore(s, now + 10000);
  assert.equal(done.records[1].status, "待确认");
  assert.equal(done.records[2].planResult, "创建成功");
});

test("resolved plan names include suffixes in validation and reject duplicate names", () => {
  const s = readAdStore(), d = fullDraft(true);
  d.workbench!.planName = "测".repeat(50); d.workbench!.suffix = true;
  assert.throws(() => createAdRecords(d, s, getAdActor(), video), /100个字符/);
  d.workbench!.suffix = false;
  assert.equal(createAdRecords(d, s, getAdActor(), video).length, 1);
  d.rows.push({ ...d.rows[0], id: "other-row", productId: adCatalog(s.accounts.find(a => a.id === d.rows[0].accountId)!).products[1].id });
  assert.throws(() => createAdRecords(d, s, getAdActor(), video), /名称不能重复/);
});

test("an audit pass alone is not an actual delivery verdict", () => {
  const s = readAdStore(), now = Date.now() - 12000;
  s.records = createAdRecords(planDraft(), s, getAdActor(), video, now);
  updateAdStore(() => advanceAdStore(s));
  recheckAdRecords([s.records[0].id], "approved");
  assert.equal(readAdStore().records[0].deliveryStatus, "待投放");
  assert.equal(hasConfirmedAdMaterial(readAdStore().records[0]), false);
});

test("review rejection cannot be retried before fixing the cause", () => {
  const s = readAdStore();
  assert.match(adRetryBlockReason(s.records[0]), /返回资源库/);
  assert.throws(() => retryAdRecords(["demo-plan-rejected"]), /不能直接重试开启/);
  assert.equal(readAdStore().records.find(record => record.id === "demo-plan-rejected")!.planReview, "审核驳回");
});

test("explicit simulated feedback is required and query failures preserve confirmed states", () => {
  const s = readAdStore(), now = Date.now() - 12000;
  s.records = createAdRecords(planDraft(), s, getAdActor(), video, now);
  updateAdStore(() => advanceAdStore(s));
  const id = readAdStore().records[0].id;
  recheckAdRecords([id], "delivering");
  let record = readAdStore().records[0];
  assert.equal(record.materialReview, "审核通过"); assert.equal(record.deliveryStatus, "投放中"); assert.ok(record.lastCheckedAt);
  recheckAdRecords([id], "unavailable"); record = readAdStore().records[0];
  assert.equal(record.materialReview, "审核通过"); assert.equal(record.deliveryStatus, "投放中");
  recheckAdRecords([id], "material_rejected");
  assert.equal(readAdStore().records[0].deliveryStatus, "投放中");
  assert.equal(readAdStore().records[0].planReview, "审核通过");
  assert.throws(() => retryAdRecords([id]), /返回资源库/);
});

test("unknown write results never permit a second create through retry", () => {
  const s = readAdStore(); s.records[0] = { ...s.records[0], operatorId: getAdActor().id, materialReview: "待确认", failureKind: "unknown_write" };
  updateAdStore(() => s);
  assert.throws(() => retryAdRecords([s.records[0].id]), /不能重复创建/);
  recheckAdRecords([s.records[0].id], "approved");
  assert.equal(readAdStore().records[0].planId, "");
});

test("talent products retain their source and disabled reasons are enforced", () => {
  const s = readAdStore(), account = { ...s.accounts.find(a => a.id === draft().rows[0].accountId)!, ecpType: "AGENT" as const, catalog: undefined };
  const catalog = adCatalog(account);
  assert.equal(catalog.products[0].source, "talent");
  assert.equal(catalog.products[0].storeId, "");
  assert.equal(adProductIssue(account, catalog.products[0].id, catalog.douyins[0].id, "商品乘方"), "");
  assert.match(adProductIssue(account, catalog.products.at(-1)!.id, catalog.douyins[0].id, "商品乘方"), /无使用/);
});

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
test("live-room targets cannot create a plan through the legacy template path", () => {
  const d = planDraft(); d.goal = "推直播间"; d.rows[0].productId = "";
  const s = readAdStore(); s.templates[0].goal = "推直播间";
  assert.match(validateAdDraft(d, s, getAdActor()), /直播.*仅支持追加/);
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
test("new plan requests enable without inventing audit or delivery success", () => {
  const s = readAdStore(), now = Date.now(); s.records = createAdRecords(planDraft(), s, getAdActor(), video, now);
  const r = advanceAdStore(s, now + 10000).records[0];
  assert.equal(r.deliveryStatus, "待同步"); assert.equal(r.materialReview, "待确认"); assert.equal(r.planReview, "待同步"); assert.ok(r.planId);
  assert.equal(r.enableResult, "请求成功");
  assert.notEqual(r.remoteVideoId, r.assetId);
  assert.notEqual(r.coverId, r.remoteVideoId);
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

test("finished-video history combines source and derivative pushes without other videos", () => {
  const store = readAdStore(), actor = getAdActor();
  const recordsFor = (source: typeof video) => [draft(), planDraft()].flatMap(config => [
    ...createAdRecords(config, store, actor, source),
    ...createAdRecords({ ...config, derivation: { allocation: "per_account", count: 2 } }, store, actor, source),
  ]);
  const own = recordsFor(video), other = recordsFor({ ...video, id: "unrelated-video" });
  store.records = [...own, ...other];
  const related = visibleAdRecords(store, actor, video.id);
  assert.deepEqual(related.map(r => r.id), own.map(r => r.id));
  assert.equal(related.filter(r => r.derivativeId).length, 4);
  const plans = related.filter(r => r.method !== "push");
  assert.equal(plans.length, 3);
  assert.equal(plans.filter(r => r.derivativeId).length, 2);
  assert.equal(visibleAdRecords(store, actor, "no-records").length, 0);
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
test("new full-domain plans request enable once with immutable configuration", () => {
  const s = readAdStore(), d = fullDraft(true), now = Date.now();
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  d.workbench!.budget = "900";
  const next = advanceAdStore(s, now + 10000), again = advanceAdStore(next, now + 12000);
  assert.equal(next, again);
  const r = next.records[0], plan = adCatalog(next.accounts.find(a => a.id === r.accountId)!).plans.find(p => p.id === r.planId)!;
  assert.equal(plan.status, "待同步"); assert.equal(plan.optStatus, "ENABLE"); assert.equal(plan.budget, 600); assert.equal(r.planResult, "创建成功");
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
const withMaterialFeedback = (store: AdStore, now: number): AdStore => ({ ...store, records: store.records.map(record => ({ ...record, materialFeedback: {
  advertiserId: record.accountId, adId: record.planId, materialId: record.assetId,
  observedAt: new Date(now).toISOString(), auditStatus: "PASS", materialStatus: "DELIVERY_OK",
  source: "qianchuan/uni_promotion/ad/material/get",
} })) });

test("removal waits for matching confirmed material feedback and keeps the plan state", () => {
  const d = fullDraft(), s = readAdStore(), now = Date.now();
  const a = s.accounts.find(a => a.id === d.rows[0].accountId)!, p = adCatalog(a).plans[0];
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = p.materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const pending = advanceAdStore(s, now + 2000);
  assert.deepEqual(adCatalog(pending.accounts.find(x => x.id === a.id)!).plans[0].videoIds, ["existing-video"]);
  const waiting = advanceAdStore(pending, now + 10000);
  assert.equal(waiting.records[0].status, "待确认");
  assert.deepEqual(adCatalog(waiting.accounts.find(x => x.id === a.id)!).plans[0].videoIds, ["existing-video", video.id]);
  assert.equal(advanceAdStore(waiting, now + 60000), waiting);
  const next = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000), plan = adCatalog(next.accounts.find(x => x.id === a.id)!).plans[0];
  assert.deepEqual(plan.videoIds, [video.id]); assert.equal(plan.status, p.status);
  assert.match(next.records[0].logs.at(-1)!.text, /移除 1/);
});
test("failed pushes never remove existing plan videos", () => {
  const d = fullDraft(), s = readAdStore(), now = Date.now();
  d.workbench!.removal = "移除指定素材ID";
  d.workbench!.removeIds = "old-material";
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.accounts = s.accounts.map(a => a.id === d.rows[0].accountId ? { ...a, status: "expired" } : a);
  const next = advanceAdStore(s, now + 10000);
  assert.equal(next.records[0].status, "推送失败");
  assert.deepEqual(adCatalog(next.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, ["existing-video"]);
});
test("legacy daily metrics never substitute for verified removal criteria", () => {
  const d = fullDraft(), s = readAdStore(), now = Date.now();
  Object.assign(d.workbench!, { removal: "移除低数据视频", costDays: "7", costMin: "0", costMax: "100", roiDays: "7", roiMax: "2" });
  assert.throws(() => createAdRecords(d, s, getAdActor(), video, now), /暂不可用/);
  d.workbench!.removal = "不移除";
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.records[0].snapshot.workbench!.removal = "移除低数据视频";
  const waiting = advanceAdStore(s, now + 10000);
  const next = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000);
  assert.deepEqual(adCatalog(next.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, ["existing-video", video.id]);
  assert.equal(next.records[0].status, "待确认");
  assert.match(next.records[0].logs.at(-1)!.text, /筛选依据尚未确认/);
  d.workbench!.roiDays = "31"; s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.records[0].snapshot.workbench!.removal = "移除低数据视频";
  const pending = advanceAdStore(s, now + 10000);
  const incomplete = advanceAdStore(withMaterialFeedback(pending, now + 11000), now + 11000);
  assert.deepEqual(adCatalog(incomplete.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, ["existing-video", video.id]);
});
test("scheduled workbench submissions enforce one hour to thirty days", () => {
  const d = fullDraft(); d.scheduledAt = new Date(Date.now() + 600000).toISOString();
  assert.match(validateAdDraft(d, readAdStore(), getAdActor()), /1小时/);
  d.scheduledAt = new Date(Date.now() + 86400000).toISOString();
  assert.equal(validateAdDraft(d, readAdStore(), getAdActor()), "");
});

test("four target types are not interchangeable, and duplicate videos cannot be appended", () => {
  const s = readAdStore(), d = fullDraft();
  d.workbench!.target = "商品乘方";
  assert.match(validateAdDraft(d, s, getAdActor()), /营销目标一致/);
  d.workbench!.target = "商品全域";
  assert.throws(() => createAdRecords(d, s, getAdActor(), { ...video, id: "existing-video" }), /视频已在该计划中/);
});

test("account failures retain confirmed upload and plan steps on retry", () => {
  const s = readAdStore(), d = fullDraft(true), now = Date.now();
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.records[0].simulationFailure = { step: "enable", message: "模拟开启请求失败" };
  const failed = advanceAdStore(s, now + 10000), record = failed.records[0];
  assert.equal(record.status, "推送失败");
  assert.equal(record.planResult, "创建成功");
  assert.equal(record.enableResult, "请求失败");
  assert.ok(adCatalog(failed.accounts.find(a => a.id === record.accountId)!).plans.some(p => p.id === record.planId));
  updateAdStore(() => ({ ...failed, records: failed.records.map(r => ({ ...r, simulationFailure: undefined })) }));
  retryAdRecords([record.id]);
  const queued = readAdStore().records[0];
  assert.equal(queued.planId, record.planId);
  assert.equal(queued.remoteVideoId, record.remoteVideoId);
  assert.equal(queued.materialReady, true);
  assert.equal(queued.planResult, "创建成功");
  const retried = advanceAdStore(readAdStore(), queued.startedAt + 10000);
  assert.equal(retried.records[0].enableResult, "请求成功");
  assert.equal(adCatalog(retried.accounts.find(a => a.id === record.accountId)!).plans.filter(p => p.id === record.planId).length, 1);
});

test("only-push completes after library confirmation without any plan or audit request", () => {
  const s = readAdStore(), now = Date.now(); s.records = createAdRecords(draft(), s, getAdActor(), video, now);
  const uploaded = advanceAdStore(s, now + 3000);
  assert.equal(uploaded.records[0].status, "等待素材入库");
  assert.equal(uploaded.records[0].pushStatus, "推送成功");
  const done = advanceAdStore(uploaded, now + 6000).records[0];
  assert.equal(done.status, "推送成功");
  assert.equal(done.materialReview, "不涉及投放审核");
  assert.equal(done.enableResult, "不涉及");
  assert.equal(done.planId, "");
});

test("unknown, rejected, stale and mismatched audit evidence never permits removal", () => {
  const s = readAdStore(), d = fullDraft(), now = Date.now();
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = "old";
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const waiting = advanceAdStore(s, now + 10000), record = withMaterialFeedback(waiting, now + 11000).records[0];
  assert.equal(hasConfirmedAdMaterial(waiting.records[0], now + 12000), false);
  assert.equal(hasConfirmedAdMaterial(record, now + 12000), true);
  for (const patch of [
    { advertiserId: "other" }, { adId: "other" }, { materialId: "other" },
    { auditStatus: "REJECT" as const }, { auditStatus: "IN_PROGRESS" as const },
    { materialStatus: "DELIVERY_NOT" as const }, { materialStatus: "DELETED" as const },
    { observedAt: new Date(now - 1000).toISOString() }, { observedAt: new Date(now + 13000).toISOString() },
  ]) assert.equal(hasConfirmedAdMaterial({ ...record, materialFeedback: { ...record.materialFeedback!, ...patch } }, now + 12000), false);
});

test("automatic or unknown-source old materials are never removed", () => {
  for (const materialSelectType of ["AUTO" as const, undefined]) {
    const s = readAdStore(), d = fullDraft(), now = Date.now();
    const account = s.accounts.find(a => a.id === d.rows[0].accountId)!;
    account.catalog = adCatalog(account);
    account.catalog.plans[0].materials![0].materialSelectType = materialSelectType;
    d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = account.catalog.plans[0].materials![0].assetId;
    s.records = createAdRecords(d, s, getAdActor(), video, now);
    const waiting = advanceAdStore(s, now + 10000);
    const next = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000);
    assert.deepEqual(adCatalog(next.accounts.find(a => a.id === account.id)!).plans[0].videoIds, ["existing-video", video.id]);
  }
});

test("rejected materials do not imply an established stuck-review removal rule", () => {
  const s = readAdStore(), d = fullDraft(), now = Date.now();
  const a = s.accounts.find(a => a.id === d.rows[0].accountId)!;
  a.catalog = adCatalog(a); a.catalog.plans[0].materials![0].rejected = true;
  d.workbench!.removal = "移除卡审视频";
  assert.throws(() => createAdRecords(d, s, getAdActor(), video, now), /暂不可用/);
  d.workbench!.removal = "不移除";
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.records[0].snapshot.workbench!.removal = "移除卡审视频";
  const waiting = advanceAdStore(s, now + 10000);
  const done = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000);
  assert.equal(done.records[0].removalResult, "待确认");
  assert.deepEqual(adCatalog(done.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, ["existing-video", video.id]);
});

test("removal failure retry keeps the successful append and requires fresh feedback", () => {
  const s = readAdStore(), d = fullDraft(), now = Date.now() - 30000;
  const a = s.accounts.find(a => a.id === d.rows[0].accountId)!;
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = adCatalog(a).plans[0].materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.records[0].simulationFailure = { step: "remove", message: "模拟移除请求失败" };
  const waiting = advanceAdStore(s, now + 10000);
  const failed = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000);
  assert.equal(failed.records[0].removalResult, "移除失败");
  assert.equal(failed.records[0].planResult, "追加成功");
  updateAdStore(() => ({ ...failed, records: failed.records.map(r => ({ ...r, simulationFailure: undefined })) }));
  retryAdRecords([failed.records[0].id]);
  const retry = readAdStore(), retryAt = retry.records[0].startedAt + 10000;
  const pending = advanceAdStore(retry, retryAt);
  assert.equal(pending.records[0].status, "待确认");
  assert.deepEqual(adCatalog(pending.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, ["existing-video", video.id]);
  const done = advanceAdStore(withMaterialFeedback(pending, retryAt + 1000), retryAt + 1000);
  assert.equal(done.records[0].removalResult, "移除成功");
  assert.equal(done.records[0].remoteVideoId, failed.records[0].remoteVideoId);
  assert.equal(done.records[0].planId, failed.records[0].planId);
  assert.deepEqual(adCatalog(done.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0].videoIds, [video.id]);
  assert.equal(advanceAdStore(done, retryAt + 2000), done);
});

test("cancelling after creation preserves the plan and stops the enable request", () => {
  const s = readAdStore(), d = fullDraft(true), now = Date.now();
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const pending = advanceAdStore(s, now + 8000);
  updateAdStore(() => pending); cancelActiveAdRecords([pending.records[0].id]);
  const cancelled = readAdStore(), result = advanceAdStore(cancelled, now + 20000);
  assert.equal(result.records[0].status, "已取消");
  assert.equal(result.records[0].pushStatus, "推送成功");
  assert.equal(result.records[0].planResult, "创建成功");
  assert.notEqual(result.records[0].enableResult, "请求成功");
  assert.equal(adCatalog(result.accounts.find(a => a.id === d.rows[0].accountId)!).plans.filter(p => p.id === result.records[0].planId).length, 1);
});

test("removal stops when the newly added material is no longer associated", () => {
  const s = readAdStore(), d = fullDraft(), now = Date.now();
  d.workbench!.removal = "移除指定素材ID";
  const a = s.accounts.find(a => a.id === d.rows[0].accountId)!;
  d.workbench!.removeIds = adCatalog(a).plans[0].materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const waiting = withMaterialFeedback(advanceAdStore(s, now + 10000), now + 11000);
  const plan = waiting.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans[0];
  plan.videoIds = ["existing-video"]; plan.materials = plan.materials!.filter(m => m.videoId !== video.id);
  const result = advanceAdStore(waiting, now + 11000);
  assert.equal(result.records[0].removalResult, "待确认");
  assert.deepEqual(result.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans[0].videoIds, ["existing-video"]);
});

test("one enable failure does not interrupt another account or recreate its plan", () => {
  const s = readAdStore(), d = fullDraft(true), now = Date.now();
  const a = s.accounts.find(a => a.id === "2881940182740114")!, c = adCatalog(a);
  d.rows.push({ id: "second-account", accountId: a.id, douyinId: c.douyins[0].id, storeId: c.stores[0].id, productId: c.products[0].id, planId: "" });
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  s.records[0].simulationFailure = { step: "enable", message: "模拟开启失败" };
  const result = advanceAdStore(s, now + 10000);
  assert.equal(result.records[0].status, "推送失败");
  assert.equal(result.records[1].enableResult, "请求成功");
  assert.equal(result.records[1].status, "推送成功");
  assert.equal(adCatalog(result.accounts.find(x => x.id === a.id)!).plans.find(p => p.id === result.records[1].planId)!.optStatus, "ENABLE");
  assert.equal(advanceAdStore(result, now + 20000), result);
});

test("a template with a known promotion type cannot cross full-domain and multiplication", () => {
  const s = readAdStore(), d = planDraft();
  d.workbench = { ...defaultWorkbench(), target: "商品乘方", operation: "create" };
  s.templates[0].workbench = { ...defaultWorkbench(), target: "商品全域", operation: "create" };
  assert.match(validateAdDraft(d, s, getAdActor()), /模板的推广类型/);
});

test("multi-account connection imports only selected accounts without starting tasks", () => {
  const before = readAdStore();
  const subject = { id: "shop-subject", name: "授权店铺", kind: "shop" as const };
  authorizeAdAccounts("巨量千川", [
    { id: "selected-one", name: "商家账户", ecpType: "SHOP", authorizationSubject: subject },
    { id: "selected-two", name: "机构账户", ecpType: "AGENT", authorizationSubject: { id: "agency-subject", name: "代理商", kind: "agency" } },
  ]);
  const after = readAdStore();
  assert.equal(after.accounts.length, before.accounts.length + 2);
  assert.deepEqual(after.records, before.records);
  assert.equal(after.accounts.some(a => a.id === subject.id), false);
  assert.equal(after.accounts.find(a => a.id === "selected-one")!.authorizationSubject?.id, subject.id);
  assert.equal(after.accounts.find(a => a.id === "selected-two")!.ecpType, "AGENT");
  assert.equal(after.accounts.find(a => a.id === "selected-one")!.group, "");
});

test("batch connection and disconnection reject incomplete selections atomically", () => {
  const before = readAdStore();
  for (const candidates of [[], [{ id: "one", name: "one" }, { id: "two", name: "" }], [{ id: "one", name: "one" }, { id: "one", name: "duplicate" }]]) {
    assert.throws(() => authorizeAdAccounts("巨量千川", candidates));
    assert.deepEqual(readAdStore(), before);
  }
  assert.throws(() => revokeAdAccounts([draft().rows[0].accountId, "missing"], "巨量千川"), /重新选择/);
  assert.deepEqual(readAdStore(), before);
  assert.throws(() => authorizeAdAccounts("巨量广告", [{ id: "one", name: "one" }, { id: "two", name: "two" }]), /单账户/);
});

test("local disconnection preserves remote status, plans, history, permissions and other accounts", () => {
  const id = draft().rows[0].accountId;
  updateAdStore(s => ({ ...s, accounts: s.accounts.map(a => a.id === id ? { ...a, catalog: adCatalog(a) } : a) }));
  const before = readAdStore(), original = before.accounts.find(a => a.id === id)!;
  revokeAdAccounts([id], "巨量千川");
  const after = readAdStore(), disconnected = after.accounts.find(a => a.id === id)!;
  assert.equal(disconnected.status, original.status);
  assert.equal(adAccountState(disconnected), "disconnected");
  assert.equal(canUseAdAccount(disconnected), false);
  assert.deepEqual(disconnected.catalog, original.catalog);
  assert.deepEqual(after.groups, before.groups);
  assert.deepEqual(after.records, before.records);
  assert.deepEqual(after.accounts.filter(a => a.id !== id), before.accounts.filter(a => a.id !== id));
  assert.match(validateAdDraft(draft(), after, getAdActor()), /不可用/);
  for (const d of [planDraft(), fullDraft()]) assert.match(validateAdDraft(d, after, getAdActor()), /不可用/);
  authorizeAdAccount("巨量千川", id, "重新接入后的名称");
  const reconnected = readAdStore(), account = reconnected.accounts.find(a => a.id === id)!;
  assert.equal(reconnected.accounts.filter(a => a.id === id).length, 1);
  for (const key of ["group", "category", "user", "authorizedBy", "remark", "isStarred", "catalog"] as const) assert.deepEqual(account[key], original[key]);
  assert.deepEqual(reconnected.groups, before.groups);
  assert.deepEqual(reconnected.records, before.records);
  assert.equal(canUseAdAccount(account), true);
});

test("remote authorization refresh alone does not restore a locally disconnected account", () => {
  const account = readAdStore().accounts.find(a => a.id === draft().rows[0].accountId)!;
  assert.equal(canUseAdAccount({ ...account, status: "authorized", connectionStatus: "disconnected", revoked: false }), false);
  assert.equal(adAccountState({ ...account, status: "expired", revoked: true }), "disconnected");
  assert.equal(adAccountState({ ...account, status: "expired", revoked: false }), "expired");
});

const multipleCombinationDraft = (store: AdStore) => {
  const d = fullDraft();
  const account = store.accounts.find(a => a.id === d.rows[0].accountId)!;
  account.catalog = adCatalog(account);
  const plan = account.catalog.plans.find(p => p.target === "商品乘方")!;
  d.workbench!.target = "商品乘方";
  Object.assign(d.rows[0], { planId: plan.id, douyinId: plan.douyinId, combinations: [] });
  return { d, account, plan };
};

test("multiple combinations require explicit valid selection, never a cartesian expansion", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s);
  assert.match(validateAdDraft(d, s, getAdActor()), /商品与抖音号组合/);
  d.rows[0].combinations = [plan.combinations![0]];
  assert.equal(validateAdDraft(d, s, getAdActor()), "");
  d.rows[0].combinations.push({ productId: "unrelated-product", douyinId: plan.douyinId });
  assert.match(validateAdDraft(d, s, getAdActor()), /商品与抖音号组合/);
  d.rows[0].combinations = [plan.combinations![0], plan.combinations![0]];
  assert.match(validateAdDraft(d, s, getAdActor()), /商品与抖音号组合/);
});

test("single combination auto-selection is frozen in the task and appended material", () => {
  const s = readAdStore(), d = fullDraft(), now = Date.now();
  const plan = adCatalog(s.accounts.find(a => a.id === d.rows[0].accountId)!).plans[0];
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  assert.deepEqual(s.records[0].snapshot.rows[0].combinations, plan.combinations);
  d.rows[0].combinations = [];
  const done = advanceAdStore(s, now + 10000);
  const updated = done.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans[0];
  assert.deepEqual(updated.materials!.find(m => m.videoId === video.id)!.combinations, plan.combinations);
});

test("append affects only selected combinations and keeps other associations and opt status", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
  const old = structuredClone(plan.materials);
  d.rows[0].combinations = [plan.combinations![1]];
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  d.rows[0].combinations = plan.combinations;
  const done = advanceAdStore(s, now + 10000);
  const updated = done.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!;
  assert.deepEqual(updated.materials!.filter(m => m.videoId === "existing-video"), old);
  assert.deepEqual(updated.materials!.find(m => m.videoId === video.id)!.combinations, [plan.combinations![1]]);
  assert.equal(updated.optStatus, plan.optStatus);
});

test("stale associations are rejected again before execution without deleting old materials", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
  d.rows[0].combinations = [plan.combinations![0]];
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  plan.combinations = [plan.combinations![1]];
  const done = advanceAdStore(s, now + 10000);
  assert.equal(done.records[0].status, "推送失败");
  assert.match(done.records[0].failureReason, /关联已失效/);
  assert.deepEqual(done.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!.videoIds, ["existing-video"]);
});

test("shared old material is retained with the actual unselected combination", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
  d.rows[0].combinations = [plan.combinations![0]];
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = plan.materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const done = advanceAdStore(s, now + 10000), record = done.records[0];
  assert.equal(record.planResult, "追加成功");
  assert.equal(record.removalResult, "已保留");
  assert.equal(record.materialReview, "待确认");
  assert.match(record.removalReason!, /仍关联未选组合/);
  assert.ok(record.removalReason!.includes(plan.combinations![1].productId));
  assert.equal(advanceAdStore(done, now + 60000), done);
  const later = advanceAdStore(withMaterialFeedback(done, now + 11000), now + 11000);
  assert.ok(later.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!.videoIds.includes("existing-video"));
});

test("fully selected known combinations permit removal only after matching audit feedback", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
  d.rows[0].combinations = plan.combinations;
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = plan.materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const waiting = advanceAdStore(s, now + 10000);
  assert.equal(waiting.records[0].removalResult, "待确认");
  const done = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000);
  assert.equal(done.records[0].removalResult, "移除成功");
  assert.deepEqual(done.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!.videoIds, [video.id]);
});

test("all video aliases of a material ID participate in protection", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
  d.rows[0].combinations = [plan.combinations![0]];
  plan.materials![0].combinations = [plan.combinations![0]];
  plan.materials!.push({ ...plan.materials![0], videoId: "shared-alias", combinations: [plan.combinations![1]] });
  plan.videoIds.push("shared-alias");
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = plan.materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const done = advanceAdStore(s, now + 10000);
  assert.equal(done.records[0].removalResult, "已保留");
  assert.match(done.records[0].removalReason!, /仍关联未选组合/);
  assert.deepEqual(done.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!.videoIds, ["existing-video", "shared-alias", video.id]);
});

test("incomplete coverage, mappings and source never become removal success", () => {
  for (const missing of ["coverage", "mapping", "conflicting-mapping", "combinations", "source", "unmapped-video", "unknown-id"]) {
    const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
    d.rows[0].combinations = plan.combinations;
    d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = plan.materials![0].assetId;
    if (missing === "coverage") delete plan.associationCoverage;
    if (missing === "mapping") plan.materials![0].assetId = "";
    if (missing === "conflicting-mapping") plan.materials!.push({ ...plan.materials![0], assetId: "conflicting-material-id" });
    if (missing === "combinations") delete plan.materials![0].combinations;
    if (missing === "source") delete plan.materials![0].materialSelectType;
    if (missing === "unmapped-video") plan.videoIds.push("unmapped-video");
    if (missing === "unknown-id") d.workbench!.removeIds = "not-in-plan";
    s.records = createAdRecords(d, s, getAdActor(), video, now);
    const done = advanceAdStore(s, now + 10000);
    assert.equal(done.records[0].removalResult, "已保留", missing);
    assert.ok(done.records[0].removalReason, missing);
    assert.ok(done.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!.videoIds.includes("existing-video"), missing);
  }
});

test("mixed safe and shared IDs remove only the safe old material and report retained scope", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
  d.rows[0].combinations = [plan.combinations![0]];
  plan.materials!.push({ ...plan.materials![0], assetId: "safe-old", videoId: "safe-old-video", combinations: [plan.combinations![0]] });
  plan.videoIds.push("safe-old-video");
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = `${plan.materials![0].assetId},safe-old`;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const waiting = advanceAdStore(s, now + 10000);
  const done = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000);
  assert.equal(done.records[0].removalResult, "已保留");
  assert.match(done.records[0].removalReason!, /移除 1.*其余已保留/);
  assert.deepEqual(done.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!.videoIds, ["existing-video", video.id]);
});

test("missing newly added target association blocks removal despite plan-level success", () => {
  const s = readAdStore(), { d, plan } = multipleCombinationDraft(s), now = Date.now();
  d.rows[0].combinations = plan.combinations;
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = plan.materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  const waiting = advanceAdStore(s, now + 10000);
  const changed = waiting.accounts.find(a => a.id === d.rows[0].accountId)!.catalog!.plans.find(p => p.id === plan.id)!;
  changed.materials!.find(m => m.videoId === video.id)!.combinations = [plan.combinations![0]];
  const done = advanceAdStore(withMaterialFeedback(waiting, now + 11000), now + 11000);
  assert.equal(done.records[0].removalResult, "待确认");
  assert.deepEqual(changed.videoIds, ["existing-video", video.id]);
});

test("waiting removal blocks disconnection even if append transport has completed", () => {
  const s = readAdStore(), d = fullDraft(), now = Date.now() - 20000;
  const account = s.accounts.find(a => a.id === d.rows[0].accountId)!;
  d.workbench!.removal = "移除指定素材ID"; d.workbench!.removeIds = adCatalog(account).plans[0].materials![0].assetId;
  s.records = createAdRecords(d, s, getAdActor(), video, now);
  updateAdStore(() => s);
  assert.throws(() => revokeAdAccounts([account.id], "巨量千川"), /进行中/);
  assert.equal(canUseAdAccount(readAdStore().accounts.find(a => a.id === account.id)!), true);
});

test("live append requires no product selection and keeps the original live plan state", () => {
  for (const target of ["直播全域", "直播乘方"] as const) {
    const s = readAdStore(), d = fullDraft(), now = Date.now();
    const account = s.accounts.find(a => a.id === d.rows[0].accountId)!;
    const plan = adCatalog(account).plans.find(p => p.target === target)!;
    d.goal = "推直播间"; d.workbench!.target = target;
    Object.assign(d.rows[0], { productId: "", storeId: "", planId: plan.id, douyinId: plan.douyinId });
    s.records = createAdRecords(d, s, getAdActor(), video, now);
    const done = advanceAdStore(s, now + 10000);
    assert.equal(done.records[0].planResult, "追加成功");
    const updated = done.accounts.find(a => a.id === account.id)!.catalog!.plans.find(p => p.id === plan.id)!;
    assert.equal(updated.optStatus, plan.optStatus);
    assert.deepEqual(updated.materials!.find(m => m.videoId === video.id)!.combinations, [{ productId: "", douyinId: plan.douyinId }]);
  }
});
