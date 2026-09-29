import { useSyncExternalStore } from "react";
import { INITIAL_ROLES } from "../components/AdminSystemManagementView";
import { PROTOTYPE_OPERATOR } from "../data/adminAccounts";
import { ORGANIZATION_CHANGE, readReportOrganization } from "./analyticsOrganization";
import { AD_CHANGE_EVENT } from "./adPush";

export const PERMISSION_CHANGE_EVENT = "mengchang_permission_change";

// ---------------------------------------------------------------------------
// 菜单级权限常量（与权限树保持一致）
// ---------------------------------------------------------------------------
export const RESOURCE_VIEW_KEYS = [
  "uc_resource_view_finished", "uc_resource_view_material", "uc_resource_view_third_party",
  "uc_resource_view_image", "uc_resource_view_audio", "uc_resource_view_script"
] as const;

export const UPLOAD_KEYS = ["uc_upload_video", "uc_upload_image", "uc_upload_script", "uc_upload_audio"] as const;

// 操作记录菜单及其 7 个子页（菜单权限，缺失即隐藏对应入口）
export const OPERATION_RECORDS_KEYS = [
  "uc_operation_records",
  "uc_operation_records_derivation", "uc_operation_records_push", "uc_operation_records_plan",
  "uc_operation_records_upload", "uc_operation_records_export", "uc_operation_records_download",
  "uc_operation_records_login"
] as const;

export const OPERATION_RECORDS_EXPORT_KEY = "uc_operation_records_export_btn";

// 数据分析各子页菜单（不含导出按钮权限）
export const DATA_ANALYSIS_MENU_KEYS = [
  "uc_analysis_video", "uc_analysis_ad_platform", "uc_analysis_platform_tags",
  "uc_analysis_tag_analytics", "uc_analysis_account", "uc_analysis_account_data", "uc_analysis_status_report"
] as const;

export const DERIVATION_PUSH_KEY = "uc_derivation_push";
export const DERIVATION_NEW_KEY = "uc_derivation_new";

export function notifyPermissionChange() {
  window.dispatchEvent(new Event(PERMISSION_CHANGE_EVENT));
}

interface SessionLike { username?: string }
interface RoleLike { id: string; enabled?: boolean; checkedKeys?: string[] }

// 读取当前登录用户在用户端的全部 uc_* 权限（与 getAdActor 同源的角色矩阵）
export function readUserPermissionKeys(): string[] {
  let session: SessionLike = {};
  let roles: RoleLike[] = [];
  try {
    const savedSession = JSON.parse(localStorage.getItem("mengchang_prototype_session") || "{}");
    const savedRoles = JSON.parse(localStorage.getItem("cloud_video_roles_v2") || "[]");
    if (savedSession && typeof savedSession.username === "string") session = savedSession;
    // 角色目录为空（管理端尚未初始化/未进入过系统管理）时回退到内置默认角色，保证普通用户登录即可获得默认权限
    // 旧数据键升级：以内置默认勾选为基准并集，补齐新版本新增键（如数据分析/操作记录/衍生），不丢失用户已保存键
    const upgradeRoleKeys = (r: RoleLike): RoleLike => { if (r.id === "role_super_admin") { const def = INITIAL_ROLES.find(d => d.id === r.id); return { ...r, checkedKeys: [...(def?.checkedKeys || r.checkedKeys || [])] }; } const defaults = INITIAL_ROLES.find(d => d.id === r.id); if (!defaults) return r; return { ...r, checkedKeys: Array.from(new Set([...(defaults.checkedKeys || []), ...(r.checkedKeys || [])])) }; };
    roles = (Array.isArray(savedRoles) && savedRoles.length > 0) ? savedRoles.filter((r): r is RoleLike => r && typeof r.id === "string" && (!r.checkedKeys || Array.isArray(r.checkedKeys))).map(upgradeRoleKeys) : (INITIAL_ROLES as unknown as RoleLike[]);
  } catch { /* fail closed */ }
  const admin = session.username === "chaojiguanliyuan" || session.username === "guanliyuan";
  if (admin) {
    const role = roles.find(r => r.id === "role_super_admin");
    const keys = role?.checkedKeys || INITIAL_ROLES.find(d => d.id === "role_super_admin")?.checkedKeys || [];
    return keys.filter(k => typeof k === "string" && k.startsWith("uc_"));
  }
  let org;
  try { org = readReportOrganization(); } catch { return []; }
  const member = org.members.find(m => m.id === (session.username === "putongyonghu" ? PROTOTYPE_OPERATOR.id : session.username));
  const enabled = member && ["normal", "bound"].includes(member.status);
  if (!enabled) return [];
  return roles.filter(r => r.enabled !== false && member.roleIds.includes(r.id))
    .flatMap(r => r.checkedKeys || [])
    .filter(k => typeof k === "string" && k.startsWith("uc_"));
}

const LISTEN_EVENTS = [AD_CHANGE_EVENT, ORGANIZATION_CHANGE, PERMISSION_CHANGE_EVENT, "storage"];

// ---------------------------------------------------------------------------
// 管理端权限读取（AUTH-02）：管理端菜单与操作统一按角色过滤。
// 口径：有菜单权限即有其操作权限；没有菜单权限则不显示该菜单/入口。
// ---------------------------------------------------------------------------
export function readAdminPermissionKeys(): string[] {
  let session: SessionLike = {};
  let roles: RoleLike[] = [];
  try {
    const savedSession = JSON.parse(localStorage.getItem("mengchang_prototype_session") || "{}");
    const savedRoles = JSON.parse(localStorage.getItem("cloud_video_roles_v2") || "[]");
    if (savedSession && typeof savedSession.username === "string") session = savedSession;
    const upgradeRoleKeys = (r: RoleLike): RoleLike => {
      if (r.id === "role_super_admin") { const def = INITIAL_ROLES.find(d => d.id === r.id); return { ...r, checkedKeys: [...(def?.checkedKeys || r.checkedKeys || [])] }; }
      const defaults = INITIAL_ROLES.find(d => d.id === r.id);
      if (!defaults) return r;
      return { ...r, checkedKeys: Array.from(new Set([...(defaults.checkedKeys || []), ...(r.checkedKeys || [])])) };
    };
    roles = (Array.isArray(savedRoles) && savedRoles.length > 0) ? savedRoles.filter((r): r is RoleLike => r && typeof r.id === "string" && (!r.checkedKeys || Array.isArray(r.checkedKeys))).map(upgradeRoleKeys) : (INITIAL_ROLES as unknown as RoleLike[]);
  } catch { /* fail closed */ }
  // 管理端演示账号映射：超管→超级管理员（全权限）；管理员→部门负责人/主管（部分菜单，演示只读与菜单过滤）
  const roleId = session.username === "chaojiguanliyuan" ? "role_super_admin"
    : session.username === "guanliyuan" ? "role_dept_head" : "";
  if (!roleId) return [];
  const role = roles.find(r => r.id === roleId);
  const keys = role?.checkedKeys || [];
  return keys.filter((k): k is string => typeof k === "string" && k.startsWith("ab_"));
}

// 惰性初始化：模块循环依赖（userPermissions ↔ AdminSystemManagementView）下，首次读取推迟到渲染/事件时，避免 TDZ
let cachedAdminKeys: string[] | null = null;
function subscribeAdmin(cb: () => void) {
  const handler = () => { cachedAdminKeys = readAdminPermissionKeys(); cb(); };
  LISTEN_EVENTS.forEach(ev => window.addEventListener(ev, handler));
  return () => LISTEN_EVENTS.forEach(ev => window.removeEventListener(ev, handler));
}
const adminSnapshot = () => { if (cachedAdminKeys === null) cachedAdminKeys = readAdminPermissionKeys(); return cachedAdminKeys; };

// 响应式管理端权限（管理端菜单/页签过滤使用）
export function useAdminPermissions() {
  const keys = useSyncExternalStore(subscribeAdmin, adminSnapshot, adminSnapshot);
  const has = (key: string) => keys.includes(key);
  const hasAny = (required: readonly string[]) => required.some(k => keys.includes(k));
  return { keys, has, hasAny };
}

// 即时管理端权限（管理端操作校验使用，每次点击读取最新配置）
export function hasAdminPermission(key: string): boolean {
  return readAdminPermissionKeys().includes(key);
}

// 是否超级管理员账号（资源库删除类等'不包含删除类'权限的专属能力判定）
export function isSuperAdminAccount(): boolean {
  try {
    const session = JSON.parse(localStorage.getItem("mengchang_prototype_session") || "{}");
    return !!session && session.username === "chaojiguanliyuan";
  } catch { return false; }
}

let cachedKeys: string[] | null = null;

function subscribe(cb: () => void) {
  const handler = () => { cachedKeys = readUserPermissionKeys(); cb(); };
  LISTEN_EVENTS.forEach(ev => window.addEventListener(ev, handler));
  return () => LISTEN_EVENTS.forEach(ev => window.removeEventListener(ev, handler));
}
const snapshot = () => { if (cachedKeys === null) cachedKeys = readUserPermissionKeys(); return cachedKeys; };

// 响应式权限（菜单隐藏/页签过滤使用，权限变更自动刷新）
export function useUserPermissions() {
  const keys = useSyncExternalStore(subscribe, snapshot, snapshot);
  const has = (key: string) => keys.includes(key);
  const hasAny = (required: readonly string[]) => required.some(k => keys.includes(k));
  return { keys, has, hasAny };
}

// 即时权限（按钮点击校验使用，每次点击读取最新配置，恢复权限立即生效）
export function hasUserPermission(key: string): boolean {
  return readUserPermissionKeys().includes(key);
}
