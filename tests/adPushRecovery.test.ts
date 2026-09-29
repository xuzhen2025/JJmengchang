import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { AD_STORE_KEY, adCatalog, adDate, advanceAdStore, cancelActiveAdRecords, createAdRecords, createAdStore, getAdActor, readAdStore, recheckAdRecords, retryAdRecords, updateAdStore, type AdDraft, type AdPushRecord } from "../src/lib/adPush";
import { defaultWorkbench } from "../src/lib/adPushConfig";
import { AUTH_REPAIR_INTERVAL, QC_AUTH_REASON, adAuthRepairIssue, adDeliveryAdvice, applyAdExecutionScenario, initializeAdAuthorization, recheckAdAuthorization, recheckAdLibrary, resolveAdWrite, retainOldAdMaterials, retryAdCapacity, simulateAdWriteRecheck, type AdExecutionScenario } from "../src/lib/adPushRecovery";
import { validateAdMedia } from "../src/lib/adPushMedia";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: Object.assign(new EventTarget(), { localStorage: storage, sessionStorage: storage }), configurable: true });
const accountId = "2881940182740113";
beforeEach(() => { values.clear(); storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan" })); storage.setItem(AD_STORE_KEY, JSON.stringify(createAdStore())); });

function start(operation: "push" | "create" | "append", scenario: AdExecutionScenario = "normal", count = 1) {
  const store = readAdStore(), account = store.accounts.find(a => a.id === accountId)!, catalog = adCatalog(account), plan = catalog.plans.find(p => p.target === "商品全域")!;
  const config = { ...defaultWorkbench(), operation: operation === "create" ? "create" as const : "append" as const, target: "商品全域" as const, budget: "300", roi: "2", planName: "测试计划", titles: ["商品实拍展示"], removal: operation === "append" ? "移除指定素材ID" as const : "不移除" as const, removeIds: plan.materials![0].assetId };
  const draft: AdDraft = { platform: "巨量千川", method: operation === "push" ? "push" : "full_domain", goal: "推商品", rows: [{ id: "row", accountId, douyinId: catalog.douyins[0].id, productId: catalog.products[0].id, storeId: catalog.stores[0].id, planId: operation === "append" ? plan.id : "", combinations: operation === "append" ? plan.combinations : undefined }], templateIds: [], version: "原片", naming: "{视频名称}", scheduledAt: "", creative: "多创意", workbench: config };
  const now = Date.now() - 15000;
  store.records = applyAdExecutionScenario(createAdRecords(draft, store, getAdActor(), Array.from({ length: count }, (_, i) => ({ id: `new-video-${i}`, title: `测试成片${i}` })), now), scenario);
  const next = advanceAdStore(store, Date.now());
  updateAdStore(() => next);
  return next.records[0];
}
function talentAccount() {
  updateAdStore(store => ({ ...store, accounts: store.accounts.map(a => a.id !== accountId ? a : { ...a, ecpType: "COMMON_STAR", catalog: undefined }) }));
  return readAdStore().accounts.find(a => a.id === accountId)!;
}
const saved = (record: AdPushRecord) => readAdStore().records.find(r => r.id === record.id)!;

test("authorization repair is limited to eligible talent accounts and current ad permissions", () => {
  assert.match(adAuthRepairIssue(readAdStore(), getAdActor(), accountId), /没有符合/);
  talentAccount();
  assert.equal(adAuthRepairIssue(readAdStore(), getAdActor(), accountId), "");
  assert.match(adAuthRepairIssue(readAdStore(), { ...getAdActor(), permissions: ["uc_ad_push"] }, accountId), /投放操作权限/);
  updateAdStore(s => ({ ...s, accounts: s.accounts.map(a => a.id !== accountId ? a : { ...a, status: "expired" }) }));
  assert.throws(() => initializeAdAuthorization(accountId, "accepted"), /授权不可用/);
});

test("initialization never clears eligibility and enforces per-account ten-minute cooldown", () => {
  const a = talentAccount(), now = Date.now();
  const productId = `${a.id}-unavailable`;
  initializeAdAuthorization(a.id, "accepted", now);
  assert.deepEqual(adCatalog(readAdStore().accounts.find(x => x.id === a.id)!).products.find(p => p.id === productId)!.grayReasons, [QC_AUTH_REASON]);
  assert.throws(() => initializeAdAuthorization(a.id, "accepted", now + AUTH_REPAIR_INTERVAL - 1), /10分钟/);
  recheckAdAuthorization(a.id, "unavailable");
  assert.match(readAdStore().accounts.find(x => x.id === a.id)!.authRepair!.message, /查询失败/);
  initializeAdAuthorization(a.id, "unknown", now + AUTH_REPAIR_INTERVAL);
  recheckAdAuthorization(a.id, "eligible");
  assert.deepEqual(adCatalog(readAdStore().accounts.find(x => x.id === a.id)!).products.find(p => p.id === productId)!.grayReasons, []);
});

test("successful eligibility requery preserves unrelated gray reasons and account authorization", () => {
  talentAccount();
  updateAdStore(s => ({ ...s, accounts: s.accounts.map(a => a.id !== accountId ? a : { ...a, catalog: { ...adCatalog(a), products: adCatalog(a).products.map(p => p.id.endsWith("unavailable") ? { ...p, grayReasons: [QC_AUTH_REASON, "商品已下架"] } : p) } }) }));
  initializeAdAuthorization(accountId, "accepted"); recheckAdAuthorization(accountId, "eligible");
  assert.deepEqual(adCatalog(readAdStore().accounts.find(x => x.id === accountId)!).products.find(p => p.id.endsWith("unavailable"))!.grayReasons, ["商品已下架"]);
});

test("cover failure and retry preserve confirmed video upload without prematurely creating plans", () => {
  const r = start("create", "cover");
  assert.equal(r.status, "推送失败"); assert.equal(r.executionIssue, "cover");
  assert.ok(r.remoteVideoId); assert.equal(r.coverId, undefined); assert.equal(r.planId, "");
  retryAdRecords([r.id]);
  const done = advanceAdStore(readAdStore(), Date.now() + 20000).records[0];
  assert.equal(done.remoteVideoId, r.remoteVideoId); assert.ok(done.coverId); assert.equal(done.planResult, "创建成功");
});

test("library delay never becomes success with time or retries uploads", () => {
  const r = start("create", "library");
  assert.equal(r.status, "待确认"); assert.equal(r.executionIssue, "library");
  assert.equal(advanceAdStore(readAdStore(), Date.now() + 3600000).records[0].planId, "");
  recheckAdLibrary(r.id, "pending"); assert.equal(saved(r).status, "待确认");
  recheckAdLibrary(r.id, "unavailable"); assert.equal(saved(r).remoteVideoId, r.remoteVideoId);
  recheckAdLibrary(r.id, "ready"); assert.equal(saved(r).planResult, "创建成功"); assert.equal(saved(r).remoteVideoId, r.remoteVideoId);
});

test("unknown outcomes for every supported write stage reconcile and resume once", () => {
  for (const [operation, scenario] of [["push", "upload_unknown"], ["create", "cover_unknown"], ["create", "create_unknown"], ["append", "append_unknown"], ["create", "enable_unknown"]] as const) {
    const r = start(operation, scenario);
    assert.equal(r.failureKind, "unknown_write", scenario); assert.ok(r.pendingWrite, scenario);
    recheckAdRecords([r.id], "delivering"); assert.ok(saved(r).pendingWrite);
    for (const result of ["not_found", "ambiguous", "unavailable"] as const) { simulateAdWriteRecheck(r.id, result); assert.ok(saved(r).pendingWrite); }
    simulateAdWriteRecheck(r.id, "matched");
    const done = saved(r); assert.equal(done.pendingWrite, undefined); assert.equal(done.failureKind, undefined);
    if (operation !== "push") assert.ok(done.planId);
    assert.throws(() => simulateAdWriteRecheck(r.id, "matched"), /没有待核查/);
  }
});

test("multi-video create timeout resolves all members to exactly one remote plan", () => {
  const r = start("create", "create_unknown", 3), before = adCatalog(readAdStore().accounts.find(a => a.id === accountId)!).plans.length;
  assert.ok(readAdStore().records.every(x => x.pendingWrite?.attemptId === r.pendingWrite?.attemptId));
  simulateAdWriteRecheck(r.id, "matched");
  const s = readAdStore(), plans = adCatalog(s.accounts.find(a => a.id === accountId)!).plans;
  assert.equal(plans.length, before + 1); assert.equal(new Set(s.records.map(x => x.planId)).size, 1);
  assert.equal(plans.find(p => p.id === s.records[0].planId)!.videoIds.length, 3);
});

test("cover library delay blocks plan creation and reuses the confirmed cover after requery", () => {
  const r = start("create", "cover_library", 2), peer = readAdStore().records[1];
  assert.ok(r.coverId); assert.equal(r.coverReady, false); assert.equal(r.materialReady, true); assert.equal(r.planId, "");
  assert.equal(r.planResult, "等待封面入库");
  recheckAdLibrary(r.id, "unavailable"); assert.equal(saved(r).executionIssue, "cover_library");
  recheckAdLibrary(r.id, "ready"); assert.equal(saved(r).planId, "");
  recheckAdLibrary(peer.id, "ready");
  assert.equal(saved(r).coverId, r.coverId); assert.equal(saved(r).remoteVideoId, r.remoteVideoId);
  assert.equal(saved(r).planResult, "创建成功"); assert.equal(saved(peer).planId, saved(r).planId);
  assert.throws(() => recheckAdLibrary(r.id, "ready"), /没有待查询/);
});

test("plan-scoped reconciliation never resumes a cancelled member", () => {
  for (const scenario of ["create_unknown", "enable_unknown"] as const) {
    const r = start("create", scenario, 3), cancelled = readAdStore().records[1];
    cancelActiveAdRecords([cancelled.id]);
    const stopped = saved(cancelled);
    simulateAdWriteRecheck(r.id, "matched");
    assert.equal(saved(r).status, "推送成功");
    assert.deepEqual(saved(cancelled), stopped);
  }
});

test("confirmed enable is applied once and cannot override a later remote pause", () => {
  for (const scenario of ["normal", "enable_unknown"] as const) {
    const r = start("create", scenario);
    if (r.pendingWrite) simulateAdWriteRecheck(r.id, "matched");
    const done = saved(r);
    assert.equal(done.enableApplied, true);
    updateAdStore(s => ({ ...s, accounts: s.accounts.map(a => a.id !== accountId ? a : { ...a, catalog: { ...adCatalog(a), plans: adCatalog(a).plans.map(p => p.id !== done.planId ? p : { ...p, optStatus: "DISABLE", status: "已暂停" }) } }) }));
    recheckAdRecords([r.id], "delivering");
    assert.equal(saved(r).deliveryStatus, "已暂停");
    assert.equal(adCatalog(readAdStore().accounts.find(a => a.id === accountId)!).plans.find(p => p.id === done.planId)!.optStatus, "DISABLE");
    updateAdStore(s => ({ ...s, records: s.records.map(x => x.id !== r.id ? x : { ...x, enableApplied: undefined }) }));
    recheckAdRecords([r.id], "delivering");
    assert.equal(saved(r).deliveryStatus, "已暂停", "legacy acknowledgements must not enable again");
  }
});

test("mismatched, stale or incomplete write evidence cannot unlock requests", () => {
  const r = start("create", "create_unknown");
  const evidence = { attemptId: r.pendingWrite!.attemptId, accountId, checkedAt: adDate(), source: "计划详情", outcome: "matched" as const, exactMatch: true, planId: "remote-plan" };
  assert.throws(() => resolveAdWrite(r, { ...evidence, accountId: "another-account" }), /不匹配/);
  assert.throws(() => resolveAdWrite(r, { ...evidence, checkedAt: "2020-01-01 00:00:00" }), /不匹配/);
  assert.throws(() => resolveAdWrite(r, { ...evidence, exactMatch: false }), /唯一匹配/);
  assert.throws(() => resolveAdWrite(r, { ...evidence, planId: "" }), /远端标识/);
});

test("an explicit original-request failure allows retry but an empty query does not", () => {
  const r = start("create", "create_unknown");
  simulateAdWriteRecheck(r.id, "not_found"); assert.throws(() => retryAdRecords([r.id]));
  simulateAdWriteRecheck(r.id, "failed"); assert.equal(saved(r).status, "推送失败");
  retryAdRecords([r.id]); assert.equal(advanceAdStore(readAdStore(), Date.now() + 20000).records[0].planResult, "创建成功");
});

test("remote balance, budget, schedule and quota states preserve plan IDs and old videos", () => {
  const r = start("append");
  for (const scenario of ["balance", "budget", "schedule", "quota"] as const) {
    recheckAdRecords([r.id], scenario);
    assert.equal(saved(r).planId, r.planId); assert.equal(saved(r).materialFeedback, undefined); assert.ok(adDeliveryAdvice(saved(r)));
    assert.ok(adCatalog(readAdStore().accounts.find(a => a.id === accountId)!).plans.find(p => p.id === r.planId)!.videoIds.includes("existing-video"));
  }
});

test("zero-spend missing audit feedback retains old media and can explicitly end replacement", () => {
  const r = start("append");
  recheckAdRecords([r.id], "no_material_feedback");
  assert.equal(saved(r).materialReview, "待确认"); assert.equal(saved(r).materialFeedback, undefined);
  retainOldAdMaterials(r.id); assert.equal(saved(r).removalResult, "已保留");
  recheckAdRecords([r.id], "delivering");
  assert.ok(adCatalog(readAdStore().accounts.find(a => a.id === accountId)!).plans.find(p => p.id === r.planId)!.videoIds.includes("existing-video"));
});

test("capacity rejection preserves old videos and retries only the original append", () => {
  const r = start("append", "capacity");
  assert.equal(r.executionIssue, "capacity"); assert.notEqual(r.planResult, "追加成功");
  const old = adCatalog(readAdStore().accounts.find(a => a.id === accountId)!).plans.find(p => p.id === r.planId)!;
  assert.deepEqual(old.videoIds, ["existing-video"]); assert.throws(() => retryAdRecords([r.id]), /容量不足/);
  retryAdCapacity(r.id);
  const done = advanceAdStore(readAdStore(), Date.now() + 20000).records[0];
  assert.equal(done.planId, r.planId); assert.equal(done.remoteVideoId, r.remoteVideoId); assert.equal(done.planResult, "追加成功");
});

test("recoveries recheck permissions and cannot resume a cancelled record", () => {
  const r = start("create", "create_unknown");
  assert.throws(() => simulateAdWriteRecheck(r.id, "matched", "different-user"), /权限/);
  updateAdStore(s => ({ ...s, records: s.records.map(x => ({ ...x, status: "已取消" })) }));
  assert.throws(() => simulateAdWriteRecheck(r.id, "matched"), /取消/);
});

test("media preflight enforces documented video and cover limits without invented duration rules", () => {
  const media = { format: "mp4", bytes: 90 * 1024 * 1024, width: 1080, height: 1920, cover: { format: "jpg", bytes: 300000, width: 720, height: 1280 } };
  assert.equal(validateAdMedia(media, true), "");
  assert.match(validateAdMedia({ ...media, bytes: 101 * 1024 * 1024 }, true), /100MB/);
  assert.match(validateAdMedia({ ...media, format: "mov" }, false), /格式/);
  assert.match(validateAdMedia({ ...media, cover: undefined }, true), /封面/);
  assert.equal(validateAdMedia({ ...media, cover: undefined }, false), "");
  assert.match(validateAdMedia({ ...media, cover: { ...media.cover, width: 360, height: 640 } }, true), /尺寸/);
  assert.match(validateAdMedia({ ...media, width: NaN }, false), /不完整/);
  const failed = start("create", "media"); assert.equal(failed.assetId, ""); assert.equal(failed.planId, ""); assert.throws(() => retryAdRecords([failed.id]), /文件不符合/);
});
