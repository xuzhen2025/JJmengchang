import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { AD_STORE_KEY, adCatalog, advanceAdStore, cancelActiveAdRecords, createAdRecords, createAdStore, getAdActor, readAdStore, retryAdRecords, updateAdStore, type AdDraft, type AdPushRecord } from "../src/lib/adPush";
import { defaultWorkbench } from "../src/lib/adPushConfig";
import { adPlanCreationStatus, adPlanQueueActionIds, adPlanQueueFilters, adPlanQueueRows, applyAdPlanQueueAction, filterAdPlanQueue } from "../src/lib/adPlanQueue";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: Object.assign(new EventTarget(), { localStorage: storage, sessionStorage: storage }), configurable: true });
beforeEach(() => { values.clear(); storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan" })); storage.setItem(AD_STORE_KEY, JSON.stringify(createAdStore())); });

function records(count = 1, template = false) {
  const store = readAdStore(), account = store.accounts.find(item => item.id === "2881940182740113")!, catalog = adCatalog(account);
  const draft: AdDraft = {
    platform: "巨量千川", method: template ? "plan" : "full_domain", goal: "推商品", creative: "多创意", templateIds: template ? [store.templates[0].id] : [],
    version: "原片", naming: "{视频名称}", scheduledAt: "",
    rows: [{ id: "row", accountId: account.id, douyinId: catalog.douyins[0].id, storeId: catalog.stores[0].id, productId: catalog.products[0].id, planId: "" }],
    workbench: { ...defaultWorkbench(), target: "商品全域", operation: "create", budget: "300", roi: "2", titles: ["商品实拍展示"], planName: "队列测试" },
  };
  return createAdRecords(draft, store, getAdActor(), Array.from({ length: count }, (_, i) => ({ id: `video-${i}`, title: `成片${i}` })));
}
const persist = (items: AdPushRecord[]) => updateAdStore(store => ({ ...store, records: items }));
const rowIds = () => adPlanQueueRows(readAdStore().records, getAdActor().id).map(row => row.id);

test("queue contains template and direct creation, but not uploads, appends or another user", () => {
  const direct = records(), template = records(1, true), first = direct[0];
  const upload: AdPushRecord = { ...first, id: "upload", method: "push", snapshot: { ...first.snapshot, method: "push" } };
  const append: AdPushRecord = { ...first, id: "append", snapshot: { ...first.snapshot, workbench: { ...first.snapshot.workbench!, operation: "append" } } };
  const other = { ...first, id: "other", operatorId: "other-user" };
  const rows = adPlanQueueRows([...direct, ...template, upload, append, other], getAdActor().id);
  assert.equal(rows.length, 2);
  assert.deepEqual(new Set(rows.flatMap(row => row.records.map(item => item.id))), new Set([...direct, ...template].map(item => item.id)));
});

test("multi-video plans count once without merging different plans, accounts or tasks", () => {
  const first = records(3), second = records(2);
  const siblingPlan = { ...first[0], id: "different-plan", planGroupId: "other-plan" };
  const otherAccount = { ...first[0], id: "different-account", accountId: "different-account" };
  const rows = adPlanQueueRows([...first, ...second, siblingPlan, otherAccount]);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map(row => row.records.length).sort(), [1, 1, 2, 3]);
});

test("creation states never treat upload success, audit or delivery status as plan creation", () => {
  const record = records()[0];
  assert.equal(adPlanCreationStatus([record]), "待创建");
  assert.equal(adPlanCreationStatus([{ ...record, pushStatus: "推送成功", materialReview: "审核通过", deliveryStatus: "投放中" }]), "待创建");
  assert.equal(adPlanCreationStatus([{ ...record, status: "创建计划中" }]), "创建中");
  assert.equal(adPlanCreationStatus([{ ...record, status: "推送失败" }]), "创建失败");
  assert.equal(adPlanCreationStatus([{ ...record, status: "已取消" }]), "取消创建");
  assert.equal(adPlanCreationStatus([{ ...record, status: "推送失败", planId: "real-plan", planResult: "创建成功", enableResult: "请求失败" }]), "创建成功");
  assert.equal(adPlanCreationStatus([{ ...record, status: "待确认", pendingWrite: { step: "create", attemptId: "original", requestedAt: record.createdAt } }, { ...record, status: "推送失败" }]), "创建中");
});

test("queue filters use every video in a plan, exact platform and creation status, and inclusive dates", () => {
  const items = records(2, true).map(item => ({ ...item, createdAt: "2026-09-28 10:00:00", planId: "plan-search", planResult: "创建成功" }));
  const rows = adPlanQueueRows(items), filters = adPlanQueueFilters("2026-09-28");
  assert.equal(filterAdPlanQueue(rows, { ...filters, videoId: "VIDEO-1", templateName: "千川日常", accountId: items[0].accountId, planId: "search", platform: "巨量千川", goal: "推商品", operator: items[0].operator, taskId: items[0].taskId, status: "创建成功" }).length, 1);
  for (const mismatch of [{ status: "待创建" }, { platform: "巨量广告" }, { videoId: "unknown" }, { planId: "missing" }, { goal: "推直播间" }, { templateName: "unknown" }, { start: "2026-09-29" }, { end: "2026-09-27" }]) assert.equal(filterAdPlanQueue(rows, { ...filters, ...mismatch }).length, 0);
  assert.equal(filterAdPlanQueue(adPlanQueueRows([{ ...items[0], derivativeId: "derivative-123" }]), { ...filters, videoId: "derivative-123" }).length, 1);
});

test("batch cancellation stops all active videos of selected plans, not another plan", () => {
  const first = records(2).map(item => ({ ...item, startedAt: Date.now() + 60000 })), other = records();
  persist([...first, ...other]);
  const id = adPlanQueueRows(first)[0].id;
  applyAdPlanQueueAction([id], "cancel", getAdActor().id);
  assert.ok(readAdStore().records.filter(item => first.some(original => original.id === item.id)).every(item => item.status === "已取消"));
  assert.notEqual(readAdStore().records.find(item => item.id === other[0].id)!.status, "已取消");
  assert.equal(adPlanQueueRows(readAdStore().records).find(row => row.id === id)!.status, "取消创建");
});

test("retry only resets failed members and preserves confirmed uploads", () => {
  const [first, second] = records(2);
  persist([{ ...first, status: "推送失败", failureKind: "transport", failureReason: "上传异常", pushStatus: "推送成功", assetId: "saved-asset", remoteVideoId: "saved-video", startedAt: Date.now() }, { ...second, startedAt: Date.now() + 60000 }]);
  const ids = rowIds();
  applyAdPlanQueueAction(ids, "retry", getAdActor().id);
  const saved = readAdStore().records.find(item => item.id === first.id)!;
  assert.equal(saved.status, "待处理"); assert.equal(saved.assetId, "saved-asset"); assert.equal(saved.remoteVideoId, "saved-video");
  assert.equal(saved.pushStatus, "推送成功"); assert.equal(adPlanQueueRows(readAdStore().records)[0].status, "待创建");
});

test("partially failed plans cannot report a successful whole-plan cancellation", () => {
  const [first, second] = records(2);
  persist([{ ...first, status: "推送失败", failureKind: "transport", failureReason: "上传异常" }, { ...second, startedAt: Date.now() + 60000 }]);
  const before = storage.getItem(AD_STORE_KEY);
  assert.throws(() => applyAdPlanQueueAction(rowIds(), "cancel", getAdActor().id), /仅支持待创建或创建中/);
  assert.equal(storage.getItem(AD_STORE_KEY), before);
});

test("later delivery failures do not become creation failures in the queue", () => {
  const record = { ...records()[0], status: "推送失败" as const, planId: "created", planResult: "创建成功", failureReason: "请求开启失败" };
  const [row] = adPlanQueueRows([record]);
  assert.equal(row.status, "创建成功");
  assert.equal(row.failureReason, "");
  assert.equal(record.failureReason, "请求开启失败");
});

test("mixed, stale, unknown and media-rejected selections fail without changing records", () => {
  const failed = { ...records()[0], status: "推送失败" as const, failureKind: "transport" as const };
  const ready = records()[0], success = { ...ready, planId: "created", planResult: "创建成功" };
  for (const [items, expression] of [
    [[failed, success], /已创建成功/],
    [[{ ...failed, pendingWrite: { step: "create", attemptId: "id", requestedAt: failed.createdAt } }], /结果待确认/],
    [[{ ...failed, materialReview: "审核驳回" }], /回到资源库|返回资源库/],
  ] as [AdPushRecord[], RegExp][]) {
    persist(items);
    const before = storage.getItem(AD_STORE_KEY);
    assert.throws(() => applyAdPlanQueueAction(rowIds(), "retry", getAdActor().id), expression);
    assert.equal(storage.getItem(AD_STORE_KEY), before);
  }
  assert.throws(() => adPlanQueueActionIds(adPlanQueueRows([failed]), ["stale"], "retry"), /发生变化/);
  assert.throws(() => adPlanQueueActionIds([], [], "cancel"), /请先选择/);
});

test("confirmation rechecks newly created plans and operator permission", () => {
  const items = records(); persist(items);
  const ids = rowIds();
  persist([{ ...items[0], status: "推送失败", planId: "already-created", planResult: "创建成功" }]);
  assert.throws(() => applyAdPlanQueueAction(ids, "retry", getAdActor().id), /已创建成功/);
  assert.throws(() => retryAdRecords([items[0].id], getAdActor().id, { uncreatedPlansOnly: true }), /已创建/);
  persist([{ ...items[0], status: "请求开启中", planId: "already-created", planResult: "创建成功", startedAt: Date.now() + 60000 }]);
  assert.throws(() => cancelActiveAdRecords([items[0].id], getAdActor().id, { uncreatedPlansOnly: true }), /已创建/);
  const failed = { ...items[0], status: "推送失败" as const, failureKind: "transport" as const };
  persist([failed]);
  const owner = getAdActor().id;
  storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu" }));
  assert.throws(() => applyAdPlanQueueAction(ids, "retry", owner), /当前用户/);
});

test("execution updates feed the same queue without recreating records", () => {
  const items = records(2), store = readAdStore(); store.records = items;
  const ids = adPlanQueueRows(items).map(row => row.id);
  const done = advanceAdStore(store, Date.now() + 20000);
  assert.equal(adPlanQueueRows(done.records)[0].status, "创建成功");
  assert.deepEqual(adPlanQueueRows(done.records).map(row => row.id), ids);
  assert.equal(new Set(done.records.map(item => item.planId)).size, 1);
});
