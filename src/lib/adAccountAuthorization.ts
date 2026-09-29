import { AD_PLATFORMS, adAccountState, adDate, authorizeAdAccounts, canUseAdAccount, getAdActor, readAdStore, syncAdCatalogFixture, updateAdStore, type AdAccount, type AdConnectionCandidate, type AdStore } from "./adPush";

export type AuthorizationScenario = "success" | "failed" | "empty" | "invalid_callback" | "wrong_account";
export interface DemoAuthorizationResult {
  platform: string;
  actorId: string;
  outcome: "success" | "denied" | "failed";
  candidates: AdConnectionCandidate[];
  message: string;
  expiresAt: number;
}
const shop = { id: "DEMO-SHOP-001", name: "梦畅官方店", kind: "shop" as const };
const agency = { id: "DEMO-AGENCY-001", name: "梦畅合作代理商", kind: "agency" as const };
export const QIANCHUAN_DEMO_CANDIDATES: AdConnectionCandidate[] = [
  { id: "9000000000001", name: "梦畅官方店 · 直投账户", ecpType: "SHOP", authorizationSubject: shop },
  { id: "9000000000002", name: "梦畅官方店 · 代理账户", ecpType: "SHOP", authorizationSubject: shop },
  { id: "9000000000003", name: "梦畅达人 · 投放账户", ecpType: "COMMON_STAR", authorizationSubject: agency },
  { id: "9000000000004", name: "梦畅机构 · 投放账户", ecpType: "AGENT", authorizationSubject: agency },
];

export function demoAuthorizationCandidates(platform: string, accounts: AdAccount[]): AdConnectionCandidate[] {
  const candidates: AdConnectionCandidate[] = platform === "巨量千川"
    ? [...QIANCHUAN_DEMO_CANDIDATES]
    : [1, 2].map(n => ({ id: `900${String(AD_PLATFORMS.indexOf(platform)).padStart(2, "0")}00000000${n}`, name: `${platform} · 梦畅官方店${n}` }));
  // Keep old demo accounts recoverable through the normal authorization entry.
  for (const account of accounts) {
    if (account.platform !== platform || adAccountState(account) !== "disconnected" || candidates.some(item => item.id === account.id)) continue;
    const { id, name, ecpType, authorizationSubject } = account;
    candidates.push({ id, name, ecpType, authorizationSubject });
  }
  return candidates;
}

// A demo callback receipt only. Production exchanges codes and stores grants on the server.
export function simulateAdAuthorization(platform: string, options: AdConnectionCandidate[], scenario: AuthorizationScenario, consent: boolean, actorId: string, now = Date.now()): DemoAuthorizationResult {
  const base = { platform, actorId, candidates: [] as AdConnectionCandidate[], expiresAt: now + 5 * 60_000 };
  if (!consent) return { ...base, outcome: "denied", message: "已拒绝授权，未修改任何账户" };
  if (scenario === "failed") return { ...base, outcome: "failed", message: "模拟授权服务失败，未接入账户，请重试" };
  if (scenario === "invalid_callback") return { ...base, outcome: "failed", message: "模拟回调校验失败，已中止接入，请重新发起授权" };
  return { ...base, outcome: "success", message: "模拟授权回调成功", candidates: scenario === "empty" ? [] : scenario === "wrong_account" ? [{ id: "9000000000099", name: "其他授权账户", ecpType: "SHOP", authorizationSubject: shop }] : structuredClone(options) };
}

export function connectAuthorizedAdAccounts(result: DemoAuthorizationResult, ids: string[], expectedAccount?: AdAccount, now = Date.now()): void {
  const actor = getAdActor();
  if (actor.id !== result.actorId || !actor.permissions.includes("ab_ad_group_manage")) throw new Error("登录身份或管理权限已变化，请重新发起授权");
  if (result.outcome !== "success" || now >= result.expiresAt) throw new Error("授权结果无效或已过期，请重新发起授权");
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error("请选择账户，且不能重复选择");
  const chosen = result.candidates.filter(item => ids.includes(item.id));
  if (chosen.length !== ids.length) throw new Error("所选账户不在本次授权范围内");
  const store = readAdStore();
  if (expectedAccount) {
    const current = store.accounts.find(item => item.platform === result.platform && item.id === expectedAccount.id);
    if (expectedAccount.platform !== result.platform || chosen.length !== 1 || chosen[0].id !== expectedAccount.id) throw new Error("本次授权未返回待恢复账户，请使用有该账户权限的主体重新授权");
    if (!current || adAccountState(current) !== adAccountState(expectedAccount)) throw new Error("账户状态已变化，请返回列表重新操作");
  } else if (chosen.some(candidate => store.accounts.some(account => account.platform === result.platform && account.id === candidate.id && canUseAdAccount(account)))) {
    throw new Error("所选账户已接入，请重新选择");
  }
  authorizeAdAccounts(result.platform, chosen);
}

export type AdSyncScenario = "normal" | "network" | "expired";
export interface AdSyncResult { platform: string; success: number; failures: { id: string; name: string; reason: string }[]; checkedAt: string; }
export function simulateAdAccountSync(store: AdStore, platform: string, ids: string[], scenario: AdSyncScenario, checkedAt = adDate()): { store: AdStore; result: AdSyncResult } {
  const selected = new Set(ids);
  if (selected.size && store.accounts.filter(a => a.platform === platform && selected.has(a.id)).length !== selected.size) throw new Error("所选账户已发生变化，请重新选择");
  const targets = store.accounts.filter(a => a.platform === platform && adAccountState(a) !== "disconnected" && (!selected.size || selected.has(a.id)));
  if (!targets.length) throw new Error("没有可同步的已接入账户");
  const targetIds = new Set(targets.map(a => a.id));
  // A failed shared subject grant can affect multiple actual advertiser accounts.
  const expiredSubjects = new Set(scenario === "expired" ? targets.map(a => a.authorizationSubject && `${a.authorizationSubject.kind}:${a.authorizationSubject.id}`).filter(Boolean) : []);
  const result: AdSyncResult = { platform, success: 0, failures: [], checkedAt };
  const accounts = store.accounts.map(account => {
    if (account.platform !== platform || adAccountState(account) === "disconnected") return account;
    const grantExpired = scenario === "expired" && (targetIds.has(account.id) || Boolean(account.authorizationSubject && expiredSubjects.has(`${account.authorizationSubject.kind}:${account.authorizationSubject.id}`)));
    if (!targetIds.has(account.id) && !grantExpired) return account;
    const reason = grantExpired || account.status === "expired" || account.revoked ? "授权已失效，请重新授权" : scenario === "network" ? "模拟请求失败，已保留上次同步数据，请重试" : "";
    if (reason) {
      result.failures.push({ id: account.id, name: account.name, reason });
      return { ...account, ...(grantExpired ? { status: "expired" as const } : {}), syncError: reason };
    }
    result.success++;
    return { ...syncAdCatalogFixture(account), syncedAt: checkedAt, syncError: "" };
  });
  return { store: { ...store, accounts }, result };
}
export function syncAdAccounts(platform: string, ids: string[], scenario: AdSyncScenario): AdSyncResult {
  if (!getAdActor().permissions.includes("ab_ad_group_manage")) throw new Error("暂无管理广告组权限");
  let result!: AdSyncResult;
  updateAdStore(store => {
    const next = simulateAdAccountSync(store, platform, ids, scenario);
    result = next.result;
    return next.store;
  });
  return result;
}

export function bindAdAccounts(platform: string, ids: string[], patch: Partial<Pick<AdAccount, "user" | "group" | "category">>): void {
  if (!getAdActor().permissions.includes("ab_ad_group_manage")) throw new Error("暂无管理广告组权限");
  if (!Object.keys(patch).length) throw new Error("请至少选择一项需要修改的绑定");
  updateAdStore(store => {
    const selected = new Set(ids);
    if (!selected.size || store.accounts.filter(a => a.platform === platform && selected.has(a.id)).length !== selected.size) throw new Error("所选账户已发生变化，请重新选择");
    return { ...store, accounts: store.accounts.map(a => a.platform === platform && selected.has(a.id) ? { ...a, ...patch } : a) };
  });
}
