import type { AccountMember, DeptNode } from "../data/adminAccounts";

export const CREDIT_RECORD_TYPES = ["普通充值", "消耗", "赠送充值", "失败退回"] as const;
export type CreditRecordType = typeof CREDIT_RECORD_TYPES[number];
export interface CreditRecord {
  id: string;
  userId: string;
  userName: string;
  group: string;
  team: string;
  type: CreditRecordType;
  amount: number;
  time: string;
}
export interface CreditFilters {
  userId: string;
  startDate: string;
  endDate: string;
}
export const EMPTY_CREDIT_FILTERS: CreditFilters = { userId: "", startDate: "", endDate: "" };
export const roundCredits = (value: number) => Math.round(value * 100) / 100;

export function creditMemberOrganization(member: AccountMember, depts: DeptNode[]) {
  const path: DeptNode[] = [];
  const seen = new Set<string>();
  let node = depts.find(dept => dept.id === member.deptId);
  while (node && !seen.has(node.id)) {
    path.unshift(node);
    seen.add(node.id);
    node = depts.find(dept => dept.id === node!.parentId);
  }
  const group = [...path].reverse().find(dept => dept.levelType === "group");
  const team = path.find(dept => dept.levelType === "department")
    ?? path.find(dept => dept.parentId !== null && dept.levelType !== "group")
    ?? path[0];
  return { group: group?.name ?? "-", team: team?.name ?? "-", path: path.map(dept => dept.name).join(" / ") };
}

export function localCreditTime(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function filterCreditRecords(records: CreditRecord[], filters: CreditFilters, type: CreditRecordType | "全部" = "全部") {
  return records.filter(record => {
    const date = record.time.slice(0, 10);
    return (!filters.userId || record.userId === filters.userId)
      && (!filters.startDate || date >= filters.startDate)
      && (!filters.endDate || date <= filters.endDate)
      && (type === "全部" || record.type === type);
  }).sort((a, b) => b.time.localeCompare(a.time) || b.id.localeCompare(a.id));
}

export function netCreditConsumption(records: CreditRecord[]) {
  return roundCredits(records.reduce((sum, record) =>
    record.type === "消耗" || record.type === "失败退回" ? sum - record.amount : sum, 0));
}

export function summarizeCreditConsumption(members: AccountMember[], depts: DeptNode[], records: CreditRecord[], filters: CreditFilters) {
  const filtered = filterCreditRecords(records, filters);
  return members.filter(member => !filters.userId || member.id === filters.userId).map(member => ({
    id: member.id,
    name: member.name,
    ...creditMemberOrganization(member, depts),
    total: netCreditConsumption(filtered.filter(record => record.userId === member.id)),
  }));
}

export function createCreditExamples(members: AccountMember[], depts: DeptNode[], now = new Date()): CreditRecord[] {
  if (!members.length) return [];
  const at = (daysAgo: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, 30, 0, 0);
    return localCreditTime(date);
  };
  const record = (id: string, member: AccountMember, type: CreditRecordType, amount: number, time: string): CreditRecord => ({
    id, userId: member.id, userName: member.name, ...creditMemberOrganization(member, depts), type, amount, time,
  });
  // The same demo ledger drives the enterprise balance, member totals and detail rows.
  const amounts = [460, 420, 380, 340, 280, 230, 195, 230];
  return [
    record("credit-demo-gift", members[0], "赠送充值", 5000, at(14, 9)),
    ...amounts.map((amount, index) => record(`credit-demo-consume-${index}`, members[index % members.length], "消耗", -amount, at(8 - index, 10))),
    record("credit-demo-refund-0", members[0], "失败退回", 90, at(7, 14)),
    record("credit-demo-refund-7", members[7 % members.length], "失败退回", 60, at(0, 9)),
  ];
}
