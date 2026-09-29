import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { AD_STORE_KEY, adAccountState, canSeeAdAccount, createAdRecords, createAdStore, getAdActor, readAdStore, revokeAdAccounts, validateAdDraft, type AdDraft } from "../src/lib/adPush";
import { bindAdAccounts, connectAuthorizedAdAccounts, demoAuthorizationCandidates, QIANCHUAN_DEMO_CANDIDATES, simulateAdAccountSync, simulateAdAuthorization, syncAdAccounts } from "../src/lib/adAccountAuthorization";
import { EMPTY_ACCOUNT_FILTERS, filterAdvertiserAccounts } from "../src/lib/adAccountManagement";
import { adExecutionPermissions, normalizeAdPermissionKeys } from "../src/lib/adPermissions";
import { readReportOrganization } from "../src/lib/analyticsOrganization";
import { PROTOTYPE_OPERATOR } from "../src/data/adminAccounts";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: Object.assign(new EventTarget(), { localStorage: storage, sessionStorage: storage }), configurable: true });
const session = (username: string) => storage.setItem("mengchang_prototype_session", JSON.stringify({ username }));
const receipt = () => simulateAdAuthorization("巨量千川", QIANCHUAN_DEMO_CANDIDATES, "success", true, "chaojiguanliyuan");
beforeEach(() => { values.clear(); session("chaojiguanliyuan"); storage.setItem(AD_STORE_KEY, JSON.stringify(createAdStore())); readAdStore(); });

test("consent, refusal, service failure, empty result and invalid callback do not connect accounts", () => {
  const before = storage.getItem(AD_STORE_KEY);
  for (const scenario of ["success", "failed", "empty", "invalid_callback"] as const) {
    const result = simulateAdAuthorization("巨量千川", QIANCHUAN_DEMO_CANDIDATES, scenario, true, "chaojiguanliyuan");
    assert.equal(storage.getItem(AD_STORE_KEY), before);
    if (scenario !== "success") assert.throws(() => connectAuthorizedAdAccounts(result, [QIANCHUAN_DEMO_CANDIDATES[0].id]));
  }
  const denied = simulateAdAuthorization("巨量千川", QIANCHUAN_DEMO_CANDIDATES, "success", false, "chaojiguanliyuan");
  assert.equal(denied.outcome, "denied");
  assert.throws(() => connectAuthorizedAdAccounts(denied, [QIANCHUAN_DEMO_CANDIDATES[0].id]), /无效/);
  assert.equal(storage.getItem(AD_STORE_KEY), before);
});

test("explicit selected import is private, scoped and creates no task", () => {
  const before = readAdStore();
  const result = receipt(), ids = result.candidates.slice(0, 2).map(a => a.id);
  connectAuthorizedAdAccounts(result, ids);
  const after = readAdStore();
  assert.equal(after.accounts.length, before.accounts.length + 2);
  assert.deepEqual(after.records, before.records);
  assert.deepEqual(after.groups, before.groups);
  assert.deepEqual(after.templates, before.templates);
  assert.equal(after.accounts.some(a => a.id === result.candidates[2].id), false);
  const account = after.accounts.find(a => a.id === ids[0])!;
  assert.equal(canSeeAdAccount(account, after, getAdActor()), true);
  assert.equal(canSeeAdAccount(account, after, { ...getAdActor(), name: "普通用户" }), false);
});

test("duplicate, missing, expired, wrong identity and already-connected selections are atomic", () => {
  const result = receipt(), id = result.candidates[0].id, before = storage.getItem(AD_STORE_KEY);
  for (const ids of [[], [id, id], [id, "unknown"]]) assert.throws(() => connectAuthorizedAdAccounts(result, ids));
  assert.throws(() => connectAuthorizedAdAccounts(result, [id], undefined, result.expiresAt), /过期/);
  session("putongyonghu");
  assert.throws(() => connectAuthorizedAdAccounts(result, [id]), /身份|权限/);
  assert.equal(storage.getItem(AD_STORE_KEY), before);
  session("chaojiguanliyuan");
  connectAuthorizedAdAccounts(result, [id]);
  const connected = storage.getItem(AD_STORE_KEY);
  assert.throws(() => connectAuthorizedAdAccounts(result, [id, result.candidates[1].id]), /已接入/);
  assert.equal(storage.getItem(AD_STORE_KEY), connected);
});

test("disconnect and reconnect preserve assignment, groups, catalog and history without enabling plans", () => {
  const result = receipt(), id = result.candidates[0].id;
  connectAuthorizedAdAccounts(result, [id]);
  bindAdAccounts("巨量千川", [id], { user: "普通用户", group: "女装千川放量组", category: "千川引流" });
  const store = readAdStore();
  store.accounts.find(a => a.id === id)!.remark = "保留备注";
  store.groups.push({ id: "test-group", platform: "巨量千川", name: "测试", viewTeam: "", viewGroup: "", viewUsers: ["普通用户"], accountIds: [id] });
  storage.setItem(AD_STORE_KEY, JSON.stringify(store));
  revokeAdAccounts([id], "巨量千川");
  const disconnected = readAdStore().accounts.find(a => a.id === id)!;
  assert.equal(adAccountState(disconnected), "disconnected");
  connectAuthorizedAdAccounts(result, [id], disconnected);
  const after = readAdStore(), account = after.accounts.find(a => a.id === id)!;
  assert.equal(adAccountState(account), "authorized");
  for (const key of ["user", "group", "category", "remark", "catalog"] as const) assert.deepEqual(account[key], store.accounts.find(a => a.id === id)![key]);
  assert.deepEqual(after.groups, store.groups);
  assert.deepEqual(after.records, store.records);
  assert.throws(() => connectAuthorizedAdAccounts(result, [id], disconnected), /状态已变化/);
});

test("reauthorization rejects results for another advertiser", () => {
  const account = readAdStore().accounts.find(a => a.status === "expired")!;
  const wrong = simulateAdAuthorization("巨量千川", [account], "wrong_account", true, "chaojiguanliyuan");
  const before = storage.getItem(AD_STORE_KEY);
  assert.throws(() => connectAuthorizedAdAccounts(wrong, [wrong.candidates[0].id], account), /待恢复账户/);
  assert.equal(storage.getItem(AD_STORE_KEY), before);
});

test("hidden legacy accounts reconnect through generic authorization without losing history", () => {
  const initial = readAdStore().accounts.find(a => a.platform === "巨量千川" && a.status === "authorized")!;
  syncAdAccounts(initial.platform, [initial.id], "normal");
  const before = readAdStore();
  const account = before.accounts.find(a => a.id === initial.id)!;
  revokeAdAccounts([account.id], account.platform);
  const disconnected = readAdStore();
  for (const status of ["authorized", "expired"] as const) {
    assert.ok(!filterAdvertiserAccounts(disconnected.accounts, account.platform, status, EMPTY_ACCOUNT_FILTERS).some(a => a.id === account.id));
  }
  const candidates = demoAuthorizationCandidates(account.platform, disconnected.accounts);
  assert.equal(candidates.filter(a => a.id === account.id).length, 1);
  assert.ok(!demoAuthorizationCandidates("巨量广告", disconnected.accounts).some(a => a.id === account.id));
  const result = simulateAdAuthorization(account.platform, candidates, "success", true, getAdActor().id);
  connectAuthorizedAdAccounts(result, [account.id]);
  const after = readAdStore(), restored = after.accounts.find(a => a.id === account.id)!;
  assert.equal(adAccountState(restored), "authorized");
  for (const key of ["group", "user", "category", "remark", "catalog", "syncPreferences"] as const) assert.deepEqual(restored[key], account[key]);
  assert.deepEqual(after.records, before.records);
  assert.deepEqual(after.groups, before.groups);
  assert.deepEqual(after.templates, before.templates);
});

test("generic authorization candidates never duplicate a disconnected standard demo account", () => {
  const result = receipt(), id = result.candidates[0].id;
  connectAuthorizedAdAccounts(result, [id]);
  revokeAdAccounts([id], result.platform);
  const candidates = demoAuthorizationCandidates(result.platform, readAdStore().accounts);
  assert.equal(candidates.filter(a => a.id === id).length, 1);
});

test("sync stays in current platform, preserves plans and disconnected accounts, and can retry transport failures", () => {
  const store = readAdStore(), id = "2881940182740113";
  const before = structuredClone(store);
  const failed = simulateAdAccountSync(store, "巨量千川", [id], "network");
  assert.equal(failed.result.success, 0);
  assert.equal(failed.result.failures.length, 1);
  assert.equal(failed.store.accounts.find(a => a.id === id)!.status, "authorized");
  assert.equal(failed.store.accounts.find(a => a.id === id)!.syncedAt, store.accounts.find(a => a.id === id)!.syncedAt);
  assert.deepEqual(store, before);
  const retried = simulateAdAccountSync(failed.store, "巨量千川", [id], "normal");
  assert.equal(retried.result.success, 1);
  assert.equal(retried.store.accounts.find(a => a.id === id)!.syncError, "");
  assert.deepEqual(retried.store.accounts.filter(a => a.id !== id), store.accounts.filter(a => a.id !== id));
  assert.deepEqual(retried.store.records, store.records);
  assert.throws(() => simulateAdAccountSync(store, "巨量千川", [id, "unknown"], "normal"), /变化/);
});

test("a shared subject expiry affects its connected accounts, not other grants or locally disconnected accounts", () => {
  const result = receipt();
  connectAuthorizedAdAccounts(result, result.candidates.map(a => a.id));
  const store = readAdStore();
  const ids = result.candidates.map(a => a.id);
  const next = simulateAdAccountSync(store, "巨量千川", [ids[0]], "expired");
  assert.deepEqual(next.result.failures.map(f => f.id), ids.slice(0, 2));
  assert.equal(adAccountState(next.store.accounts.find(a => a.id === ids[2])!), "authorized");
  const attempted = simulateAdAccountSync(next.store, "巨量千川", [ids[0]], "normal");
  assert.equal(attempted.result.success, 0);
  store.accounts.find(a => a.id === ids[1])!.connectionStatus = "disconnected";
  const disconnected = simulateAdAccountSync(store, "巨量千川", [ids[0]], "expired");
  assert.equal(disconnected.result.failures.length, 1);
  assert.equal(adAccountState(disconnected.store.accounts.find(a => a.id === ids[1])!), "disconnected");
});

test("ordinary member uses saved roles and organization, push and plan permissions remain distinct", () => {
  session("putongyonghu");
  storage.setItem("cloud_video_roles_v2", JSON.stringify([{ id: "role_staff", enabled: true, checkedKeys: ["uc_finished_ad_push"] }]));
  const actor = getAdActor();
  assert.equal(actor.name, "普通用户");
  assert.equal(actor.team, "电商投放一部");
  assert.equal(actor.group, "女装千川放量组");
  assert.ok(actor.permissions.includes("uc_ad_push"));
  assert.ok(!actor.permissions.includes("uc_ad_plan_manage"));
  const store = readAdStore(), draft: AdDraft = { platform: "巨量千川", method: "push", goal: "推商品", rows: [{ id: "row", accountId: "2881940182740113", douyinId: "", productId: "", storeId: "", planId: "" }], templateIds: [], version: "原片", naming: "{视频名称}", scheduledAt: "", creative: "单创意" };
  assert.equal(validateAdDraft(draft, store, actor), "");
  assert.equal(createAdRecords(draft, store, actor, { id: "video", title: "视频" }).length, 1);
  assert.match(validateAdDraft({ ...draft, method: "plan" }, store, actor), /管理投放计划/);
  assert.throws(() => syncAdAccounts("巨量千川", [], "normal"), /管理广告组/);
  const org = readReportOrganization();
  org.members.find(m => m.id === PROTOTYPE_OPERATOR.id)!.roleIds = ["custom-operator"];
  storage.setItem("cloud_video_members", JSON.stringify(org.members));
  storage.setItem("cloud_video_roles_v2", JSON.stringify([{ id: "custom-operator", checkedKeys: ["uc_finished_ad_push", "uc_ad_plan_manage"] }]));
  assert.ok(getAdActor().permissions.includes("uc_ad_plan_manage"));
  org.members.find(m => m.id === PROTOTYPE_OPERATOR.id)!.status = "disabled";
  storage.setItem("cloud_video_members", JSON.stringify(org.members));
  assert.deepEqual(getAdActor().permissions, []);
});

test("visibility still requires both system and group restrictions, blank actor fields do not grant access", () => {
  const store = readAdStore(), account = store.accounts.find(a => a.id === "2881940182740113")!;
  const actor = { id: "putongyonghu", name: "普通用户", team: "", group: "", categories: [], permissions: ["uc_ad_push"] };
  store.groups = [{ id: "g", name: "私有", platform: "巨量千川", viewTeam: "", viewGroup: "", viewUsers: ["徐振"], accountIds: [account.id] }];
  assert.equal(canSeeAdAccount(account, store, actor), false);
  store.groups[0].viewUsers = [actor.name];
  assert.equal(canSeeAdAccount(account, store, actor), true);
  store.visibility = "personal";
  assert.equal(canSeeAdAccount(account, store, actor), false);
  account.user = actor.name;
  assert.equal(canSeeAdAccount(account, store, actor), true);
});

test("binding supports explicit clearing and is atomic across stale selections and platform boundaries", () => {
  const id = "2881940182740113", before = storage.getItem(AD_STORE_KEY);
  assert.throws(() => bindAdAccounts("巨量千川", [id], {}), /至少/);
  assert.throws(() => bindAdAccounts("巨量千川", [id, "unknown"], { user: "普通用户" }), /变化/);
  assert.equal(storage.getItem(AD_STORE_KEY), before);
  bindAdAccounts("巨量千川", [id], { user: "普通用户", group: "女装千川放量组", category: "千川引流" });
  session("putongyonghu");
  assert.ok(getAdActor().categories.includes("千川引流"));
  session("chaojiguanliyuan");
  bindAdAccounts("巨量千川", [id], { group: "", category: "" });
  assert.equal(readAdStore().accounts.find(a => a.id === id)!.user, "普通用户");
  assert.equal(readAdStore().accounts.find(a => a.id === id)!.group, "");
});

test("legacy push alias migrates without implicitly granting plan or admin permissions", () => {
  assert.deepEqual(normalizeAdPermissionKeys(["uc_ad_push", "uc_finished_ad_push"]), ["uc_finished_ad_push"]);
  assert.deepEqual(adExecutionPermissions(["uc_finished_ad_push"]), ["uc_finished_ad_push", "uc_ad_push"]);
});

test("demo member migration preserves edits and intentional deletion", () => {
  let org = readReportOrganization();
  org.members.find(m => m.id === PROTOTYPE_OPERATOR.id)!.name = "演示投手";
  storage.setItem("cloud_video_members", JSON.stringify(org.members));
  assert.equal(readReportOrganization().members.find(m => m.id === PROTOTYPE_OPERATOR.id)!.name, "演示投手");
  org = readReportOrganization();
  storage.setItem("cloud_video_members", JSON.stringify(org.members.filter(m => m.id !== PROTOTYPE_OPERATOR.id)));
  assert.equal(readReportOrganization().members.some(m => m.id === PROTOTYPE_OPERATOR.id), false);
  session("putongyonghu");
  assert.deepEqual(getAdActor().permissions, []);
});
