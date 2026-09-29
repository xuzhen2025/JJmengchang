import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { INITIAL_FINISHED } from "../src/data/finishedVideos";
import { AD_PUSH_STATUSES, AD_STORE_KEY, activeAdDerivationCount, adCatalog, advanceAdStore, createAdStore, getAdActor, readAdStore, retryAdRecords, revokeAdAccounts, updateAdStore, type AdStore } from "../src/lib/adPush";
import { AD_PLAN_QUEUE_STATUSES, adPlanQueueFilters, adPlanQueueRows, applyAdPlanQueueAction, filterAdPlanQueue } from "../src/lib/adPlanQueue";
import { recheckAdLibrary, simulateAdWriteRecheck } from "../src/lib/adPushRecovery";
import { withOperationAdExamples } from "../src/lib/operationAdExamples";
import { seedDerivationExamples } from "../src/lib/videoDerivation";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: Object.assign(new EventTarget(), { localStorage: storage, sessionStorage: storage }), configurable: true });
beforeEach(() => {
  values.clear();
  storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan" }));
  storage.setItem("mengchang-report-account-bindings-v1", "1");
});
const base = (): AdStore => ({ ...createAdStore(), records: [] });
const fixture = () => {
  const actor = getAdActor(); seedDerivationExamples(actor.id, actor.name);
  const store = withOperationAdExamples(base(), actor);
  storage.setItem(AD_STORE_KEY, JSON.stringify(store));
  return store;
};

test("all push and creation states are available in today's owner-scoped examples", () => {
  const store = fixture(), actor = getAdActor();
  assert.deepEqual(new Set(store.records.map(record => record.status)), new Set(AD_PUSH_STATUSES));
  const rows = filterAdPlanQueue(adPlanQueueRows(store.records, actor.id), adPlanQueueFilters());
  assert.deepEqual(new Set(rows.map(row => row.status)), new Set(AD_PLAN_QUEUE_STATUSES));
  assert.ok(store.records.every(record => record.operatorId === actor.id && record.dataSource === "prototype"));
  assert.ok(store.records.every(record => INITIAL_FINISHED.some(video => video.id === record.videoId && video.title === record.videoTitle)));
  assert.ok(rows.some(row => row.records[0].templateName));
  assert.ok(rows.some(row => row.records[0].method === "full_domain"));
  assert.ok(rows.every(row => row.records[0].snapshot.workbench?.operation === "create"));
});

test("examples append once and preserve existing records, account settings and plan contents", () => {
  const original = createAdStore(), before = structuredClone(original), actor = getAdActor();
  const next = withOperationAdExamples(original, actor);
  assert.deepEqual(original, before);
  assert.deepEqual(next.records.slice(0, original.records.length), original.records);
  for (const account of original.accounts) {
    const saved = next.accounts.find(item => item.id === account.id && item.platform === account.platform)!;
    assert.equal(saved.status, account.status); assert.equal(saved.authorizedBy, account.authorizedBy);
    for (const plan of adCatalog(account).plans) assert.deepEqual(adCatalog(saved).plans.find(item => item.id === plan.id), plan);
  }
  assert.equal(withOperationAdExamples(next, actor), next);
});

test("idle examples retain all intermediate states without execution or consuming derivation quota", () => {
  const store = fixture();
  assert.equal(advanceAdStore(store, Date.now() + 86400000), store);
  assert.equal(activeAdDerivationCount(store.records, getAdActor().id), 0);
  assert.doesNotThrow(() => revokeAdAccounts([store.accounts.find(account => account.platform === "巨量千川" && account.status === "authorized")!.id], "巨量千川"));
});

test("a partial batch has successful and failed plans; multiple videos share one plan", () => {
  const store = fixture(), rows = adPlanQueueRows(store.records);
  const partial = rows.filter(row => row.records[0].taskId.endsWith("partial-accounts"));
  assert.equal(partial.length, 2);
  assert.deepEqual(new Set(partial.map(row => row.status)), new Set(["创建成功", "创建失败"]));
  assert.equal(new Set(partial.map(row => row.records[0].accountId)).size, 2);
  const multiple = rows.filter(row => row.records[0].taskId.endsWith("multi-video"));
  assert.equal(multiple.length, 1); assert.equal(multiple[0].records.length, 2);
  assert.equal(new Set(multiple[0].records.map(record => record.planId)).size, 1);
  assert.equal(new Set(multiple[0].records.map(record => record.planName)).size, 1);
});

test("retry resumes only the selected example and preserves uploaded material", () => {
  const store = fixture(), actor = getAdActor(), record = store.records.find(item => item.id.endsWith("-plan-failed"))!;
  const row = adPlanQueueRows([record])[0];
  applyAdPlanQueueAction([row.id], "retry", actor.id);
  const retried = readAdStore().records.find(item => item.id === record.id)!;
  assert.equal(retried.examplePaused, false); assert.equal(retried.assetId, record.assetId);
  const next = advanceAdStore(readAdStore(), Date.now() + 20000);
  assert.equal(next.records.find(item => item.id === record.id)!.planResult, "创建成功");
  assert.equal(next.records.find(item => item.id.endsWith("-plan-running"))!.status, "创建计划中");
  assert.equal(next.records.find(item => item.id.endsWith("-upload-running"))!.status, "推送中");
});

test("cancellation is retained on revisit and never changes unrelated examples", () => {
  const store = fixture(), actor = getAdActor(), record = store.records.find(item => item.id.endsWith("-plan-waiting"))!;
  applyAdPlanQueueAction([adPlanQueueRows([record])[0].id], "cancel", actor.id);
  const cancelled = readAdStore();
  assert.equal(cancelled.records.find(item => item.id === record.id)!.status, "已取消");
  assert.equal(withOperationAdExamples(cancelled, actor), cancelled);
  assert.equal(cancelled.records.find(item => item.id.endsWith("-plan-running"))!.status, "创建计划中");
});

test("unknown-write and library examples recover through existing actions", () => {
  const store = fixture(), actor = getAdActor();
  const unknown = store.records.find(item => item.id.endsWith("-plan-unknown"))!;
  assert.throws(() => retryAdRecords([unknown.id], actor.id), /失败/);
  simulateAdWriteRecheck(unknown.id, "matched", actor.id);
  const matched = readAdStore().records.find(item => item.id === unknown.id)!;
  assert.equal(matched.examplePaused, false); assert.equal(matched.pendingWrite, undefined); assert.ok(matched.planId);
  const waiting = store.records.find(item => item.id.endsWith("-library-waiting"))!;
  recheckAdLibrary(waiting.id, "ready", actor.id);
  const ready = readAdStore().records.find(item => item.id === waiting.id)!;
  assert.equal(ready.examplePaused, false); assert.equal(ready.assetId, waiting.assetId);
  assert.equal(ready.planResult, "创建成功");
});

test("examples respect account visibility and do not grant permission or create anonymous history", () => {
  const store = base(), actor = getAdActor();
  assert.equal(withOperationAdExamples(store, { ...actor, id: "anonymous" }), store);
  assert.equal(withOperationAdExamples(store, { ...actor, permissions: [] }), store);
  const restricted = withOperationAdExamples({ ...store, visibility: "personal" }, { ...actor, name: "无授权人员" });
  assert.equal(restricted.records.length, 0);
  const uploads = withOperationAdExamples(store, { ...actor, permissions: ["uc_ad_push"] });
  assert.ok(uploads.records.every(record => record.method === "push" && !record.derivativeId));
});

test("enabling a previously created example never recreates its plan", () => {
  const store = fixture(), actor = getAdActor(), record = store.records.find(item => item.id.endsWith("-enable-failed"))!;
  retryAdRecords([record.id], actor.id);
  updateAdStore(current => advanceAdStore(current, Date.now() + 20000));
  const current = readAdStore(), saved = current.records.find(item => item.id === record.id)!;
  assert.equal(saved.planId, record.planId); assert.equal(saved.enableResult, "请求成功");
  assert.equal(adCatalog(current.accounts.find(account => account.id === record.accountId)!).plans.filter(plan => plan.id === record.planId).length, 1);
});
