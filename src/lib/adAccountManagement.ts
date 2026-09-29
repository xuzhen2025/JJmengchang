import { adAccountState, getAdActor, updateAdStore, type AdAccount, type AdSyncPreferences } from "./adPush";
import type { ReportOrganization } from "./analyticsOrganization";
import { REPORT_TODAY, shiftDate, type ReportFact } from "./reportDemoData";

export const AD_SYNC_OPTIONS: { key: keyof AdSyncPreferences; label: string }[] = [
  { key: "platformTags", label: "广告平台标签统计" },
  { key: "talentMaterials", label: "达人同步素材" },
  { key: "approvedMaterials", label: "同步过审素材" },
  { key: "douyinVideoData", label: "同步素材关联抖音视频数据" },
  { key: "comments", label: "同步评论" },
];

export interface AccountFilters {
  categoryBound: string; groupBound: string; userBound: string; roomBound: string;
  group: string; category: string; name: string; id: string;
}
export const EMPTY_ACCOUNT_FILTERS: AccountFilters = {
  categoryBound: "all", groupBound: "all", userBound: "all", roomBound: "all",
  group: "", category: "", name: "", id: "",
};
const boundMatches = (value: string | undefined, filter: string) => filter === "all" || (filter === "bound" ? Boolean(value?.trim()) : !value?.trim());

export function filterAdvertiserAccounts(accounts: AdAccount[], platform: string, status: ReturnType<typeof adAccountState>, filter: AccountFilters) {
  return accounts.filter(account => account.platform === platform && adAccountState(account) === status &&
    boundMatches(account.category, filter.categoryBound) && boundMatches(account.group, filter.groupBound) &&
    boundMatches(account.user, filter.userBound) && boundMatches(account.liveRoomName, filter.roomBound) &&
    (!filter.group || account.group === filter.group) && (!filter.category || account.category === filter.category) &&
    account.name.toLowerCase().includes(filter.name.trim().toLowerCase()) && account.id.includes(filter.id.trim()));
}

export function recentAccountSpend(facts: ReportFact[], platform: string, today = REPORT_TODAY) {
  const from = shiftDate(today, -6);
  const cents = new Map<string, number>();
  for (const fact of facts) {
    if (fact.platform === platform && fact.date >= from && fact.date <= today) cents.set(fact.accountId, (cents.get(fact.accountId) || 0) + fact.spend);
  }
  return new Map([...cents].map(([id, value]) => [id, value / 100]));
}

export function accountBindingGroups(org: ReportOrganization) {
  return org.depts.filter(group => group.levelType === "group" && group.status === "active").map(group => ({
    id: group.id, name: group.name,
    department: org.depts.find(dept => dept.id === group.parentId)?.name || "",
    users: org.members.filter(member => ["normal", "bound"].includes(member.status) &&
      (member.deptId === group.id || member.secondaryDeptIds?.includes(group.id))).map(member => ({ id: member.id, name: member.name })),
  }));
}
export type AccountBindingGroup = ReturnType<typeof accountBindingGroups>[number];
export interface AccountBindingDraft { groupId: string; userId: string; category: string; }

export function accountBindingPatch(draft: AccountBindingDraft, groups: AccountBindingGroup[], categories: string[]) {
  const patch: Partial<Pick<AdAccount, "group" | "user" | "category">> = {};
  if (draft.groupId === "__clear__") { patch.group = ""; patch.user = ""; }
  else if (draft.groupId) {
    const group = groups.find(item => item.id === draft.groupId);
    if (!group) throw new Error("所选小组已停用或不存在，请重新选择");
    const user = group.users.find(item => item.id === draft.userId);
    if (draft.userId && !user) throw new Error("所选用户已不属于该小组或已停用，请重新选择");
    patch.group = group.name;
    // Group-only binding explicitly clears an old user, including across group changes.
    patch.user = user?.name || "";
  }
  if (draft.category === "__clear__") patch.category = "";
  else if (draft.category) {
    if (!categories.includes(draft.category)) throw new Error("所选分类已不存在，请重新选择");
    patch.category = draft.category;
  }
  if (!Object.keys(patch).length) throw new Error("请至少选择一项需要修改的绑定");
  return patch;
}

export function setAccountSyncPreference(platform: string, accountId: string, key: keyof AdSyncPreferences, enabled: boolean) {
  if (!getAdActor().permissions.includes("ab_ad_group_manage")) throw new Error("暂无广告主管理权限");
  if (!AD_SYNC_OPTIONS.some(item => item.key === key)) throw new Error("未知的同步设置");
  updateAdStore(store => {
    const target = store.accounts.find(account => account.platform === platform && account.id === accountId);
    if (!target) throw new Error("账户已不存在，请刷新后重试");
    if (adAccountState(target) !== "authorized") throw new Error("请先恢复账户授权或接入，再修改同步设置");
    return { ...store, accounts: store.accounts.map(account => account === target
      ? { ...account, syncPreferences: { ...account.syncPreferences, [key]: enabled } } : account) };
  });
}
