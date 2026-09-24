import { useEffect, useState } from "react";
import { ANALYTICS_DEMO_MEMBERS, INITIAL_DEPTS, INITIAL_MEMBERS, type DeptNode, type AccountMember } from "../data/adminAccounts";

export const ORGANIZATION_CHANGE = "mengchang-organization-change";
export interface ReportOrganization { depts: DeptNode[]; members: AccountMember[] }
const MIGRATION_KEY = "mengchang-report-members-v1";
function stored<T>(key: string, fallback: T[]): T[] {
  try { const value = JSON.parse(localStorage.getItem(key) || "null"); return Array.isArray(value) ? value : fallback; }
  catch { return fallback; }
}
export function readReportOrganization(): ReportOrganization {
  const depts = stored<DeptNode>("cloud_video_depts", INITIAL_DEPTS);
  let members = stored<AccountMember>("cloud_video_members", INITIAL_MEMBERS);
  // Add only the approved examples once, preserving edits and intentional later deletions.
  try {
    if (!localStorage.getItem(MIGRATION_KEY)) {
      members = [...members, ...ANALYTICS_DEMO_MEMBERS.filter(sample =>
        depts.some(dept => dept.id === sample.deptId) && !members.some(member => member.id === sample.id || member.name === sample.name))];
      localStorage.setItem("cloud_video_members", JSON.stringify(members));
      localStorage.setItem(MIGRATION_KEY, "1");
    }
  } catch { /* Storage is optional for this prototype. */ }
  return { depts, members };
}
export function useReportOrganization() {
  const [value, setValue] = useState(readReportOrganization);
  useEffect(() => {
    const refresh = () => setValue(readReportOrganization());
    window.addEventListener(ORGANIZATION_CHANGE, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener(ORGANIZATION_CHANGE, refresh); window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  return value;
}
export function memberOrganization(org: ReportOrganization, name: string) {
  const member = org.members.find(row => row.name === name || row.id === name);
  const node = org.depts.find(row => row.id === member?.deptId);
  const isGroup = node?.levelType === "group" || (node?.parentId && node.parentId !== "dept_root");
  const department = isGroup ? org.depts.find(row => row.id === node.parentId) : node;
  return { person: member?.name || "未关联员工", department: department?.name || "未归属部门", group: isGroup ? node!.name : "未归属分组", memberId: member?.id || "" };
}
export function organizationTree(org: ReportOrganization) {
  return org.depts.filter(row => row.levelType !== "group" && (row.parentId === "dept_root" || row.id === "dept_root")).map(dept => ({
    teamName: dept.name,
    groups: [
      ...org.depts.filter(row => row.parentId === dept.id && row.levelType === "group").map(group => ({ groupName: group.name, accounts: org.members.filter(row => row.deptId === group.id).map(row => row.name) })),
      ...org.members.some(row => row.deptId === dept.id) ? [{ groupName: "未归属分组", accounts: org.members.filter(row => row.deptId === dept.id).map(row => row.name) }] : [],
    ],
  }));
}
