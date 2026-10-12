// SaaS 多公司数据模型：公司档案表 + 平台用户表（公司超级管理员）
// 原型层面用 localStorage 模拟；平台用户（超级管理员）独立于公司档案，通过绑定关联公司

export interface Company {
  id: string;
  /** 企业名称（档案字段） */
  name: string;
  /** 公司编码 */
  code: string;
  /** 平台名称：登录工作台后左上角显示的平台名 */
  platformName: string;
  /** 公司 logo（URL/base64，空则用默认图标） */
  logo: string;
  /** 办公地址（选填） */
  address?: string;
  /** 联系人（公司档案字段，非登录账号） */
  contactPerson?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 邮箱（选填） */
  email?: string;
  /** 备注（选填） */
  remark?: string;
  status: "active" | "disabled";
  createdAt: string;
}

export interface PlatformUser {
  id: string;
  /** 登录账号（全局唯一，=手机号） */
  username: string;
  /** 密码（新增用户默认 12345，可重置） */
  password: string;
  /** 真实姓名 */
  name: string;
  /** 手机号（=登录账号） */
  phone: string;
  /** 邮箱（选填） */
  email?: string;
  /** 备注（选填） */
  remark?: string;
  /** 绑定的公司 id（空=未绑定） */
  companyId: string;
  status: "active" | "disabled";
  createdAt: string;
}

export const COMPANY_STORAGE_KEY = "mengchang_companies_v1";
export const USERS_STORAGE_KEY = "mengchang_platform_users_v1";
export const DEFAULT_COMPANY_ID = "company_default";

/** 平台管理员账号（登录页"平台管理"入口使用，账号+密码可配置） */
export const PLATFORM_ADMIN_USERNAME = "platform_admin";
export const PLATFORM_ADMIN_PASSWORD = "123456";

/** 新增平台用户（公司超级管理员）的默认密码 */
export const USER_DEFAULT_PASSWORD = "12345";

const DEFAULT_COMPANY: Company = {
  id: DEFAULT_COMPANY_ID,
  name: "梦畅AIGC",
  code: "MC-001",
  platformName: "梦畅AIGC",
  logo: "",
  address: "",
  contactPerson: "徐振",
  contactPhone: "13800138000",
  email: "",
  remark: "平台默认演示公司（承载现有全部演示数据）",
  status: "active",
  createdAt: "2025-12-16",
};

const DEFAULT_USER: PlatformUser = {
  id: "user_chaojiguanliyuan",
  username: "chaojiguanliyuan",
  password: "123456",
  name: "徐振",
  phone: "13800138000",
  email: "",
  remark: "默认公司超级管理员",
  companyId: DEFAULT_COMPANY_ID,
  status: "active",
  createdAt: "2025-12-16",
};

// ---------------------------------------------------------------------------
// 公司表
// ---------------------------------------------------------------------------

/** 读公司表；旧版本数据（含 superAdmin 字段）自动迁移为新结构 */
export function readCompanies(): Company[] {
  let raw: unknown = null;
  try {
    raw = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || "null");
  } catch {
    raw = null;
  }
  if (!Array.isArray(raw) || raw.length === 0) return [DEFAULT_COMPANY];
  const migrated = raw.map((c: any) => ({
    id: c.id,
    name: c.name || "",
    code: c.code || "",
    platformName: c.platformName || c.name || "",
    logo: c.logo || "",
    address: c.address || "",
    contactPerson: c.contactPerson || (c.superAdmin && c.superAdmin.name) || "",
    contactPhone: c.contactPhone || (c.superAdmin && c.superAdmin.phone) || "",
    email: c.email || "",
    remark: c.remark || c.description || "",
    status: c.status || "active",
    createdAt: c.createdAt || "",
  }));
  // 迁移旧 superAdmin 到用户表（只做一次：读旧数组时同步）
  const legacyHasSuper = raw.some((c: any) => c.superAdmin && c.superAdmin.username);
  if (legacyHasSuper) {
    const users = readPlatformUsersRaw();
    const existingNames = new Set(users.map((u) => u.username));
    let changed = false;
    for (const c of raw as any[]) {
      if (c.superAdmin && c.superAdmin.username && !existingNames.has(c.superAdmin.username)) {
        users.push({
          id: `user_${c.superAdmin.username}`,
          username: c.superAdmin.username,
          password: c.superAdmin.password || USER_DEFAULT_PASSWORD,
          name: c.superAdmin.name || c.superAdmin.username,
          phone: c.superAdmin.phone || c.superAdmin.username,
          email: "",
          remark: "",
          companyId: c.id,
          status: c.status === "active" ? "active" : "disabled",
          createdAt: c.createdAt || "",
        });
        existingNames.add(c.superAdmin.username);
        changed = true;
      }
    }
    if (changed) savePlatformUsers(users);
  }
  return migrated;
}

function readCompaniesRaw(): any[] {
  try {
    const v = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || "null");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveCompanies(companies: Company[]) {
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companies));
}

export function readCompanyById(id: string): Company | undefined {
  return readCompanies().find((c) => c.id === id);
}

/** 新建公司（仅公司档案，不包含超管；超管通过平台用户管理添加并绑定） */
export function createCompany(input: {
  name: string;
  code: string;
  platformName: string;
  logo?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  email?: string;
  remark?: string;
}): Company {
  const companies = readCompanies();
  const company: Company = {
    id: `company_${Date.now()}`,
    name: input.name.trim(),
    code: input.code.trim(),
    platformName: input.platformName.trim() || input.name.trim(),
    logo: input.logo || "",
    address: input.address?.trim() || "",
    contactPerson: input.contactPerson?.trim() || "",
    contactPhone: input.contactPhone?.trim() || "",
    email: input.email?.trim() || "",
    remark: input.remark?.trim() || "",
    status: "active",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  saveCompanies([...companies, company]);
  return company;
}

export function updateCompanyStatus(id: string, status: "active" | "disabled") {
  const companies = readCompanies();
  saveCompanies(companies.map((c) => (c.id === id ? { ...c, status } : c)));
}

// ---------------------------------------------------------------------------
// 平台用户表（公司超级管理员）
// ---------------------------------------------------------------------------

function readPlatformUsersRaw(): PlatformUser[] {
  try {
    const v = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "null");
    return Array.isArray(v) ? (v as PlatformUser[]) : [];
  } catch {
    return [];
  }
}

/** 读平台用户表；空表时初始化默认公司超管 */
export function readPlatformUsers(): PlatformUser[] {
  const users = readPlatformUsersRaw();
  if (users.length === 0) {
    // 初始化：默认公司超管（保留既有登录账号）
    const list = [DEFAULT_USER];
    // 兼容旧公司表：星海等既有公司的 superAdmin 一并迁入
    for (const c of readCompaniesRaw()) {
      if (c.superAdmin && c.superAdmin.username && c.superAdmin.username !== DEFAULT_USER.username) {
        list.push({
          id: `user_${c.superAdmin.username}`,
          username: c.superAdmin.username,
          password: c.superAdmin.password || USER_DEFAULT_PASSWORD,
          name: c.superAdmin.name || c.superAdmin.username,
          phone: c.superAdmin.phone || c.superAdmin.username,
          email: "",
          remark: "",
          companyId: c.id,
          status: c.status === "active" ? "active" : "disabled",
          createdAt: c.createdAt || "",
        });
      }
    }
    savePlatformUsers(list);
    return list;
  }
  return users;
}

export function savePlatformUsers(users: PlatformUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function readPlatformUserByUsername(username: string): PlatformUser | undefined {
  return readPlatformUsers().find((u) => u.username === username);
}

/** 新增平台用户（公司超级管理员）：账号=手机号，密码默认 12345 */
export function createPlatformUser(input: {
  name: string;
  phone: string;
  email?: string;
  remark?: string;
}): PlatformUser {
  const users = readPlatformUsers();
  const user: PlatformUser = {
    id: `user_${Date.now()}`,
    username: input.phone.trim(),
    password: USER_DEFAULT_PASSWORD,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || "",
    remark: input.remark?.trim() || "",
    companyId: "",
    status: "active",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  savePlatformUsers([...users, user]);
  return user;
}

/** 绑定/更换所属公司（一个用户只能绑定一家公司） */
export function updateUserCompany(userId: string, companyId: string) {
  const users = readPlatformUsers();
  savePlatformUsers(users.map((u) => (u.id === userId ? { ...u, companyId } : u)));
}

/** 重置密码为默认密码 */
export function resetUserPassword(userId: string) {
  const users = readPlatformUsers();
  savePlatformUsers(users.map((u) => (u.id === userId ? { ...u, password: USER_DEFAULT_PASSWORD } : u)));
}

export function toggleUserStatus(userId: string) {
  const users = readPlatformUsers();
  savePlatformUsers(users.map((u) => (u.id === userId ? { ...u, status: u.status === "active" ? "disabled" : "active" } : u)));
}

/** 是否处于正常状态的某公司超级管理员（含默认公司）：用于权限全量判定 */
export function isActiveCompanySuperAdmin(username: string): boolean {
  if (!username) return false;
  try {
    const user = readPlatformUsers().find((u) => u.username === username && u.status === "active");
    if (!user || !user.companyId) return false;
    const company = readCompanyById(user.companyId);
    return !!company && company.status === "active";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 平台账号（平台管理端登录）
// ---------------------------------------------------------------------------

/** 平台账号是否可配置：原型内置 platform_admin，后续可在平台端修改 */
export function readPlatformAccounts(): Array<{ username: string; password: string; label: string }> {
  try {
    const value = JSON.parse(localStorage.getItem("mengchang_platform_accounts_v1") || "null");
    if (Array.isArray(value) && value.length > 0) return value as Array<{ username: string; password: string; label: string }>;
  } catch {
    /* fallback */
  }
  return [{ username: PLATFORM_ADMIN_USERNAME, password: PLATFORM_ADMIN_PASSWORD, label: "平台管理员" }];
}

export function savePlatformAccounts(accounts: Array<{ username: string; password: string; label: string }>) {
  localStorage.setItem("mengchang_platform_accounts_v1", JSON.stringify(accounts));
}
