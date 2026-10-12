import { useEffect, useState } from "react";
import { ANALYTICS_DEMO_MEMBERS, INITIAL_DEPTS, INITIAL_MEMBERS, PROTOTYPE_OPERATOR, type DeptNode, type AccountMember } from "../data/adminAccounts";
import { teamTerminology } from "./organizationTerminology";
import { readCompanyById, readPlatformUsers, DEFAULT_COMPANY_ID } from "../data/companies";

export const ORGANIZATION_CHANGE = "mengchang-organization-change";
export interface ReportOrganization { depts: DeptNode[]; members: AccountMember[] }
const MIGRATION_KEY = "mengchang-report-members-v1";
function stored<T>(key: string, fallback: T[]): T[] {
  try { const value = JSON.parse(localStorage.getItem(key) || "null"); return Array.isArray(value) ? value : fallback; }
  catch { return fallback; }
}
export function readReportOrganization(): ReportOrganization {
  // SaaS：组织数据按公司隔离；仅默认公司（梦畅AIGC）承载现有演示组织，其他公司只有自己的超级管理员
  let companyId = DEFAULT_COMPANY_ID;
  try {
    const savedSession = JSON.parse(localStorage.getItem("mengchang_auth_session") || "{}");
    if (typeof savedSession.companyId === "string" && savedSession.companyId) companyId = savedSession.companyId;
  } catch { /* fallback */ }
  if (companyId !== DEFAULT_COMPANY_ID) {
    const company = readCompanyById(companyId);
    const superUsers = readPlatformUsers().filter((u) => u.status === "active" && u.companyId === companyId);
    const members: AccountMember[] = (company ? superUsers : []).map((u) => ({
      id: u.username,
      employeeNo: u.username,
      name: u.name,
      phone: u.phone || "",
      email: u.email || "",
      deptId: "",
      roleIds: ["role_super_admin"],
      roleName: "超级管理员",
      dataScope: "all",
      status: "normal",
      createdAt: u.createdAt || company?.createdAt || "",
      lastActiveAt: "尚未登录",
      logCount: 0,
      remark: (company?.name || "") + "超级管理员",
    }));
    return { depts: [], members };
  }
  const depts = stored<DeptNode>("cloud_video_depts", INITIAL_DEPTS);
  let members = stored<AccountMember>("cloud_video_members", INITIAL_MEMBERS);
  // 超管身份版本迁移：旧数据中"张总"超管统一更名为"徐振"（与登录侧边栏/个人中心一致），并持久化
  try {
    const renamed = members.map(m => {
      const member = m.name === "张总" && Array.isArray(m.roleIds) && m.roleIds.includes("role_super_admin")
        ? { ...m, name: "徐振", email: "zhen@dreamchang.com" } : m;
      const roleName = teamTerminology(member.roleName || "");
      return roleName !== member.roleName ? { ...member, roleName } : member;
    });
    if (renamed.some((m, i) => m !== members[i])) { members = renamed; localStorage.setItem("cloud_video_members", JSON.stringify(members)); }
  } catch { /* Storage is optional for this prototype. */ }
  // Add only the approved examples once, preserving edits and intentional later deletions.
  try {
    if (!localStorage.getItem(MIGRATION_KEY)) {
      members = [...members, ...ANALYTICS_DEMO_MEMBERS.filter(sample =>
        depts.some(dept => dept.id === sample.deptId) && !members.some(member => member.id === sample.id || member.name === sample.name))];
      localStorage.setItem("cloud_video_members", JSON.stringify(members));
      localStorage.setItem(MIGRATION_KEY, "1");
    }
  } catch { /* Storage is optional for this prototype. */ }
  try {
    if (!localStorage.getItem("mengchang-demo-operator-v1")) {
      if (!members.some(member => member.id === PROTOTYPE_OPERATOR.id)) members = [...members, { ...PROTOTYPE_OPERATOR }];
      localStorage.setItem("cloud_video_members", JSON.stringify(members));
      localStorage.setItem("mengchang-demo-operator-v1", "1");
    }
  } catch { /* Do not restore intentionally deleted demo members on later reads. */ }
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
  return { person: member?.name || "未关联员工", department: department?.name || "未归属团队", group: isGroup ? node!.name : "未归属分组", memberId: member?.id || "" };
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
