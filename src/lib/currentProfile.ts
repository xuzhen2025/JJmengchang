// SaaS：当前登录人在个人中心展示的资料（按登录账号所属公司动态计算）
import { readCompanyById, readPlatformUserByUsername, DEFAULT_COMPANY_ID } from "../data/companies";
import { readReportOrganization, memberOrganization } from "./analyticsOrganization";

export interface CurrentProfile {
  name: string;
  role: string;
  employeeId: string;
  phone: string;
  email: string;
  company: string;
  department: string;
  group: string;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  return phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;
}

export function readCurrentProfile(): CurrentProfile {
  let session: { username?: string; companyId?: string } = {};
  try {
    session = JSON.parse(localStorage.getItem("mengchang_auth_session") || "{}");
  } catch {
    /* fallback */
  }
  const username = session.username || "";
  const companyId = session.companyId || DEFAULT_COMPANY_ID;
  const company = readCompanyById(companyId);
  const org = readReportOrganization(); // 已按公司隔离
  const member = org.members.find((m) => m.id === username || m.employeeNo === username || m.name === username);
  const info = member ? memberOrganization(org, member.id) : null;
  const isSuper = !!member?.roleIds?.includes("role_super_admin");
  const platformUser = readPlatformUserByUsername(username);
  const fallbackRole = company && platformUser ? "超级管理员" : "成员";
  return {
    name: member?.name || platformUser?.name || company?.contactPerson || username || "用户",
    role: member?.roleName || (isSuper || username === "chaojiguanliyuan" || username === "guanliyuan" || (company && platformUser) ? "超级管理员" : fallbackRole),
    employeeId: member?.employeeNo || username || "—",
    phone: maskPhone(member?.phone || platformUser?.phone || ""),
    email: member?.email || "",
    company: company?.name || "梦畅AIGC",
    department: info && info.department && info.department !== "未归属团队" ? info.department : (member?.deptId ? "未配置" : "未配置"),
    group: info && info.group && info.group !== "未归属分组" ? info.group : "无",
  };
}
