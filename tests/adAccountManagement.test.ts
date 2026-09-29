import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { accountBindingGroups, accountBindingPatch, AD_SYNC_OPTIONS, EMPTY_ACCOUNT_FILTERS, filterAdvertiserAccounts, recentAccountSpend, setAccountSyncPreference } from "../src/lib/adAccountManagement";
import { AD_STORE_KEY, authorizeAdAccounts, createAdStore, readAdStore, type AdAccount } from "../src/lib/adPush";
import { readReportOrganization } from "../src/lib/analyticsOrganization";
import { simulateAdAccountSync } from "../src/lib/adAccountAuthorization";
import { REPORT_TODAY, shiftDate, type ReportFact } from "../src/lib/reportDemoData";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: Object.assign(new EventTarget(), { localStorage: storage, sessionStorage: storage }), configurable: true });
beforeEach(() => {
  values.clear(); storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan" }));
  storage.setItem(AD_STORE_KEY, JSON.stringify(createAdStore())); readAdStore();
});

test("binding groups use actual active organization membership, not historical account labels", () => {
  const org = readReportOrganization();
  const group = org.depts.find(dept => dept.id === "dept_1_1")!;
  const other = org.depts.find(dept => dept.id === "dept_1_2")!;
  const person = org.members.find(member => member.name === "刘小青")!;
  let groups = accountBindingGroups(org);
  assert.ok(groups.find(item => item.id === group.id)!.users.some(user => user.id === person.id));
  assert.ok(!groups.find(item => item.id === other.id)!.users.some(user => user.id === person.id));
  person.status = "disabled";
  assert.ok(!accountBindingGroups(org).find(item => item.id === group.id)!.users.some(user => user.id === person.id));
  group.status = "disabled";
  assert.ok(!accountBindingGroups(org).some(item => item.id === group.id));
});

test("group-only and user binding share a patch, and changing groups clears old user", () => {
  const groups = accountBindingGroups(readReportOrganization()), group = groups.find(item => item.users.length)!;
  assert.deepEqual(accountBindingPatch({ groupId: group.id, userId: "", category: "" }, groups, []), { group: group.name, user: "" });
  assert.deepEqual(accountBindingPatch({ groupId: group.id, userId: group.users[0].id, category: "" }, groups, []), { group: group.name, user: group.users[0].name });
  assert.deepEqual(accountBindingPatch({ groupId: "__clear__", userId: "", category: "__clear__" }, groups, []), { group: "", user: "", category: "" });
});

test("category-only change preserves user/group, and stale or cross-group selections are rejected", () => {
  const groups = accountBindingGroups(readReportOrganization()), group = groups.find(item => item.users.length)!;
  assert.deepEqual(accountBindingPatch({ groupId: "", userId: "", category: "衣服 / 女装" }, groups, ["衣服 / 女装"]), { category: "衣服 / 女装" });
  assert.throws(() => accountBindingPatch({ groupId: group.id, userId: "wrong-user", category: "" }, groups, []), /不属于/);
  assert.throws(() => accountBindingPatch({ groupId: "removed", userId: "", category: "" }, groups, []), /不存在/);
  assert.throws(() => accountBindingPatch({ groupId: "", userId: "", category: "removed" }, groups, []), /不存在/);
  assert.throws(() => accountBindingPatch({ groupId: "", userId: "", category: "" }, groups, []), /至少/);
});

test("filters intersect across name, ID, relation status, secondary category and platform", () => {
  const base = readAdStore().accounts.find(account => account.platform === "巨量千川")!;
  const accounts: AdAccount[] = [
    { ...base, id: "123", name: "店铺一", category: "衣服 / 女装", group: "一组", user: "甲", liveRoomName: "品牌直播间" },
    { ...base, id: "124", name: "店铺二", category: "美妆 / 女装", group: "二组", user: "", liveRoomName: "" },
    { ...base, id: "123", name: "店铺一", platform: "巨量广告", group: "一组", user: "甲" },
  ];
  const filter = { ...EMPTY_ACCOUNT_FILTERS, name: "店铺", id: "12", group: "一组", category: "衣服 / 女装", roomBound: "bound", userBound: "bound" };
  assert.deepEqual(filterAdvertiserAccounts(accounts, "巨量千川", "authorized", filter).map(account => account.id), ["123"]);
  assert.equal(filterAdvertiserAccounts(accounts, "巨量千川", "authorized", { ...filter, userBound: "unbound" }).length, 0);
  assert.deepEqual(filterAdvertiserAccounts(accounts, "巨量千川", "authorized", { ...EMPTY_ACCOUNT_FILTERS, roomBound: "unbound" }).map(account => account.id), ["124"]);
});

test("recent spend sums cents once across exactly seven days and only the active platform", () => {
  const row = (day: number, spend: number, platform = "巨量千川") => ({ accountId: "one", date: shiftDate(REPORT_TODAY, day), spend, platform }) as ReportFact;
  const facts = [row(0, 123), row(-6, 456), row(-7, 10000), row(1, 20000), row(0, 30000, "巨量广告")];
  assert.equal(recentAccountSpend(facts, "巨量千川").get("one"), 5.79);
  assert.equal(recentAccountSpend(facts, "巨量广告").get("one"), 300);
});

test("all five settings persist per account without claiming synchronization or changing plans", () => {
  const before = readAdStore(), account = before.accounts.find(a => a.platform === "巨量千川" && a.status === "authorized")!;
  for (const option of AD_SYNC_OPTIONS) setAccountSyncPreference(account.platform, account.id, option.key, true);
  const after = readAdStore(), updated = after.accounts.find(a => a.id === account.id)!;
  assert.equal(Object.values(updated.syncPreferences!).filter(Boolean).length, 5);
  assert.equal(updated.syncedAt, account.syncedAt);
  assert.equal(updated.authorizedAt, account.authorizedAt);
  assert.deepEqual(after.records, before.records);
  assert.deepEqual(after.accounts.filter(a => a.id !== account.id), before.accounts.filter(a => a.id !== account.id));
  const synced = simulateAdAccountSync(after, account.platform, [account.id], "normal");
  assert.deepEqual(synced.store.accounts.find(a => a.id === account.id)!.syncPreferences, updated.syncPreferences);
  setAccountSyncPreference(account.platform, account.id, "comments", false);
  assert.equal(readAdStore().accounts.find(a => a.id === account.id)!.syncPreferences!.comments, false);
});

test("unavailable accounts and actors cannot change settings", () => {
  const account = readAdStore().accounts.find(a => a.platform === "巨量千川" && a.status === "expired")!;
  assert.throws(() => setAccountSyncPreference(account.platform, account.id, "comments", true), /恢复/);
  assert.throws(() => setAccountSyncPreference(account.platform, "missing", "comments", true), /不存在/);
  storage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu" }));
  assert.throws(() => setAccountSyncPreference(account.platform, account.id, "comments", true), /权限/);
});

test("authorization timestamp is recorded by authorization, not by a later sync", () => {
  authorizeAdAccounts("巨量千川", [{ id: "new-account", name: "新广告主" }]);
  const store = readAdStore(), account = store.accounts.find(a => a.id === "new-account")!;
  assert.match(account.authorizedAt!, /^\d{4}-\d{2}-\d{2} /);
  const later = simulateAdAccountSync(store, "巨量千川", [account.id], "normal", "2026-10-01 12:00:00");
  assert.equal(later.store.accounts.find(a => a.id === account.id)!.authorizedAt, account.authorizedAt);
  assert.equal(later.store.accounts.find(a => a.id === account.id)!.syncedAt, "2026-10-01 12:00:00");
});
