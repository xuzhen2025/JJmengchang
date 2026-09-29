import { useSyncExternalStore } from "react";
import { PROTOTYPE_OPERATOR, INITIAL_DEPTS, DeptNode } from "../data/adminAccounts";
import { readReportOrganization, ORGANIZATION_CHANGE } from "./analyticsOrganization";
import { AD_CHANGE_EVENT } from "./adPush";
import { PERMISSION_CHANGE_EVENT } from "./userPermissions";
import { INITIAL_ROLES } from "../components/AdminSystemManagementView";

// ---------------------------------------------------------------------------
// 数据范围（AUTH-03）：角色与成员配置的"仅本人 / 本部门及下级 / 全部"
// 多角色合并规则：取最大范围（all > dept_tree > self）
// ---------------------------------------------------------------------------

export type DataScope = "self" | "dept_tree" | "all";

interface ScopeMemberLike {
  id?: string;
  deptId?: string;
  roleIds?: string[];
  dataScope?: DataScope | string;
  status?: string;
}
interface ScopeRoleLike {
  id?: string;
  dataScope?: DataScope | string;
  enabled?: boolean;
}

const SCOPE_ORDER: Record<string, number> = { self: 0, dept_tree: 1, all: 2 };
export const mergeDataScope = (...scopes: (DataScope | string | undefined)[]): DataScope => {
  let rank = 0;
  for (const s of scopes) {
    const r = SCOPE_ORDER[s as DataScope] ?? 0;
    if (r > rank) rank = r;
  }
  return rank >= 2 ? "all" : rank === 1 ? "dept_tree" : "self";
};

const readDepts = (): DeptNode[] => {
  try {
    const saved = localStorage.getItem("cloud_video_depts");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as DeptNode[];
    }
  } catch { /* fall through */ }
  return INITIAL_DEPTS;
};

// targetDeptId 是否在 memberDeptId 的子树（含自身，沿 target 父链上溯判定）
export const isDeptSelfOrDescendant = (memberDeptId: string, targetDeptId: string, depts?: DeptNode[]): boolean => {
  if (!targetDeptId || !memberDeptId) return false;
  if (memberDeptId === targetDeptId) return true;
  const tree = depts || readDepts();
  const parentMap = new Map<string, string | null>();
  for (const d of tree) parentMap.set(d.id, d.parentId);
  let cur: string | null = targetDeptId;
  const seen = new Set<string>();
  while (cur) {
    if (cur === memberDeptId) return true;
    if (seen.has(cur)) return false;
    seen.add(cur);
    cur = parentMap.get(cur) || null;
  }
  return false;
};

// 当前登录成员（数据范围过滤的基准身份；管理端账号在用户端视为全量）
export const getCurrentScopeMember = (): ScopeMemberLike => {
  let session: { username?: string } = {};
  try {
    session = JSON.parse(localStorage.getItem("mengchang_prototype_session") || "{}");
  } catch { /* fail closed */ }
  const username = session.username || "";
  if (username === "chaojiguanliyuan" || username === "guanliyuan") {
    return { id: username, deptId: "dept_root", roleIds: [], dataScope: "all", status: "normal" };
  }
  if (username === "putongyonghu") return PROTOTYPE_OPERATOR;
  try {
    const org = readReportOrganization();
    const member = org.members.find(m => m.id === username);
    if (member) return member as ScopeMemberLike;
  } catch { /* fall through */ }
  return PROTOTYPE_OPERATOR;
};

// 当前登录用户的数据范围：成员 dataScope 与全部启用角色 dataScope 取最大
export function readCurrentDataScope(): DataScope {
  const member = getCurrentScopeMember();
  if (member.id === "chaojiguanliyuan" || member.id === "guanliyuan") return "all";
  let roles: ScopeRoleLike[] = [];
  try {
    const saved = localStorage.getItem("cloud_video_roles_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) roles = parsed as ScopeRoleLike[];
    }
  } catch { /* fall through */ }
  // 用户端未进过管理端时角色表为空，回退内置默认角色（与用户端权限计算一致）
  if (roles.length === 0) roles = INITIAL_ROLES as ScopeRoleLike[];
  const roleScopes = roles
    .filter(r => r.enabled !== false && member.roleIds?.includes(r.id || ""))
    .map(r => r.dataScope);
  return mergeDataScope(member.dataScope, ...roleScopes);
}

// 按数据范围过滤资源列表（资源可带 creatorId/creatorDeptId 归属字段；无归属视为当前用户创建）
export const filterByDataScope = <T extends { creatorId?: string; creatorDeptId?: string }>(items: T[]): T[] => {
  const scope = readCurrentDataScope();
  if (scope === "all") return items;
  const member = getCurrentScopeMember();
  if (!member.id) return [];
  if (scope === "self") {
    return items.filter(i => (i.creatorId || member.id) === member.id);
  }
  // dept_tree：创建人在我部门及下级部门（无归属默认归我部门）
  return items.filter(i => {
    const dept = i.creatorDeptId || member.deptId || "";
    return isDeptSelfOrDescendant(member.deptId || "", dept);
  });
};

// 响应式数据范围（角色/成员/部门/权限变更后立即刷新）
const SCOPE_EVENTS = [ORGANIZATION_CHANGE, AD_CHANGE_EVENT, PERMISSION_CHANGE_EVENT, "storage"];
function subscribeScope(cb: () => void) {
  const handler = () => cb();
  SCOPE_EVENTS.forEach(ev => window.addEventListener(ev, handler));
  return () => SCOPE_EVENTS.forEach(ev => window.removeEventListener(ev, handler));
}
export function useDataScope(): DataScope {
  // 每次渲染读最新配置（改动即时生效）；订阅事件用于跨渲染刷新
  const scope = readCurrentDataScope();
  return useSyncExternalStore(subscribeScope, () => scope, () => scope);
}
