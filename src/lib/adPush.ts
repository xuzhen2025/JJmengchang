import { INITIAL_AD_ACCOUNTS, INITIAL_AD_GROUPS } from "../data/adAccounts";
import { validateAdMedia, type AdMediaProbe } from "./adPushMedia";
import { DERIVATION_PERMISSION, canUseDerivations, requireDerivationPermission } from "./derivationPermissions";
import { memberOrganization, readReportOrganization } from "./analyticsOrganization";
import { PROTOTYPE_OPERATOR } from "../data/adminAccounts";
import { adExecutionPermissions } from "./adPermissions";
import { adCharacterCount, defaultWorkbench, planNameLimit, readAdPushSettings, targetGoal, validateWorkbench, type AdTarget, type AdWorkbenchConfig } from "./adPushConfig";
import { activeDerivationCount, derivationCount, derivationOutput, syncPushDerivations, validateDerivationCount, DERIVATION_TIME_MS, type DerivationOptions } from "./videoDerivation";

export const AD_STORE_KEY = "mengchang-ad-workflow-v2";
export const AD_CHANGE_EVENT = "mengchang-ad-workflow-change";
export const AD_PLATFORMS = ["巨量千川", "巨量广告", "巨量本地推", "磁力智投", "磁力金牛", "腾讯ADQ", "淘宝超级短视频", "百度营销", "抖音号作品", "TikTok for Business", "TikTok Video", "快手号作品", "Bilibili", "小红书聚光", "小红书乘风", "Bilibili三连推广", "TikTok"];
export type MarketingGoal = "推商品" | "推直播间";
export type PushMethod = "push" | "plan" | "full_domain";
export const AD_PUSH_STATUSES = ["待处理", "衍生中", "推送中", "等待素材入库", "审核中", "创建计划中", "追加中", "请求开启中", "待确认", "推送成功", "推送失败", "已取消"] as const;
export type AdPushStatus = (typeof AD_PUSH_STATUSES)[number];
export interface AdSyncPreferences {
  platformTags: boolean;
  talentMaterials: boolean;
  approvedMaterials: boolean;
  douyinVideoData: boolean;
  comments: boolean;
}
export interface AdAccount {
  id: string; name: string; platform: string; status: "authorized" | "expired";
  connectionStatus?: "connected" | "disconnected";
  ecpType?: "SHOP" | "SHOP_STAR" | "COMMON_STAR" | "AGENT";
  authorizationSubject?: { id: string; name: string; kind: "shop" | "agency" };
  category: string; group: string; user: string; remark: string; isStarred: boolean;
  authorizedBy?: string; revoked?: boolean; syncedAt?: string; syncError?: string; catalog?: AdCatalog;
  authorizedAt?: string;
  liveRoomName?: string;
  syncPreferences?: Partial<AdSyncPreferences>;
  capabilities?: { coupon?: boolean; commission?: boolean };
  authRepair?: { requestedAt: number; outcome: "accepted" | "unknown" | "failed"; checkedAt?: string; message: string };
}
export interface AdAccountGroup { id: string; name: string; platform: string; viewTeam: string; viewGroup: string; viewUsers: string[]; accountIds: string[]; }
export interface AdActor { id: string; name: string; team: string; group: string; categories: string[]; permissions: string[]; }
export interface AdParameters {
  scene: string; newcomer: string; adType: string; promotion: string; coupon: boolean;
  budget: number; bid: number; optimization: string; period: string;
}
export const DEFAULT_AD_PARAMETERS: AdParameters = { scene: "日常销售", newcomer: "店铺新客", adType: "通投广告", promotion: "托管", coupon: false, budget: 300, bid: 2, optimization: "成交", period: "7天" };
export interface AdTemplate { id: string; name: string; scope: "个人模板" | "公司模板"; ownerId: string; platform: string; goal: MarketingGoal; naming: string; suffix: string; params: AdParameters; workbench?: AdWorkbenchConfig; }
export interface AdPlanCombination { productId: string; douyinId: string; }
export interface DeliveryRow { id: string; accountId: string; douyinId: string; productId: string; storeId: string; planId: string; combinations?: AdPlanCombination[]; }
export interface AdVideo { id: string; title: string; coverUrl?: string; videoUrl?: string; author?: string; editedAt?: string; derivativeId?: string; preparedMedia?: AdMediaProbe; }
export interface AdDraft { platform: string; method: PushMethod; goal: MarketingGoal; rows: DeliveryRow[]; templateIds: string[]; version: "原片" | "转码后视频"; naming: string; scheduledAt: string; creative: "单创意" | "多创意"; successStatus?: string; workbench?: AdWorkbenchConfig; derivation?: DerivationOptions; }
export interface AdPushRecord {
  // Intermediate demo states advance only after an explicit retry or recovery action.
  examplePaused?: boolean;
  planGroupId?: string;
  lastCheckedAt?: string;
  feedbackScenario?: "pending" | "approved" | "delivering" | "material_rejected" | "plan_rejected" | "unavailable" | "no_material_feedback" | "balance" | "budget" | "schedule" | "quota" | "live_off";
  failureKind?: "transport" | "authorization" | "material_rejected" | "plan_rejected" | "dependency" | "invalid_target" | "unknown_write";
  dataSource?: "prototype";
  remoteVideoId?: string;
  coverId?: string;
  materialReady?: boolean;
  coverReady?: boolean;
  pendingWrite?: { step: "upload" | "cover" | "create" | "append" | "enable"; attemptId: string; requestedAt: string };
  recoveryEvidence?: { source: string; checkedAt: string; conclusion: string };
  executionIssue?: "media" | "cover" | "library" | "cover_library" | "capacity";
  planHandledAt?: string;
  enableResult?: "不涉及" | "未请求" | "请求中" | "请求成功" | "请求失败";
  enableApplied?: boolean;
  removalResult?: "不涉及" | "待确认" | "移除成功" | "移除失败" | "已保留";
  removalReason?: string;
  materialFeedback?: {
    advertiserId: string; adId: string; materialId: string; observedAt: string;
    auditStatus: "PASS" | "REJECT" | "IN_PROGRESS";
    materialStatus: "DELIVERY_OK" | "DELETED" | "EXCLUDE" | "DELIVERY_NOT";
    source: "qianchuan/uni_promotion/ad/material/get";
  };
  simulationFailure?: { step: "media" | "upload" | "cover" | "library" | "cover_library" | "capacity" | "create" | "append" | "enable" | "remove"; message: string; unknown?: boolean };
  sourceVideo?: AdVideo;
  derivativeId?: string;
  id: string; taskId: string; kind: "push_video"; videoId: string; videoTitle: string; platform: string;
  accountId: string; account: string; method: PushMethod; marketingGoal: MarketingGoal;
  assetId: string; assetName: string; planId: string; planName: string; templateName: string;
  status: AdPushStatus; pushStatus: string; materialReview: string; planResult: string; planReview: string; deliveryStatus: string;
  failureReason: string; operator: string; operatorId: string; createdAt: string; updatedAt: string; startedAt: number;
  snapshot: AdDraft; templateSnapshot?: AdTemplate; logs: { time: string; text: string }[]; applied?: boolean; resourceStateApplied?: boolean;
}
export interface AdStore { accounts: AdAccount[]; groups: AdAccountGroup[]; templates: AdTemplate[]; records: AdPushRecord[]; visibility: "all" | "personal" | "group" | "category"; sequence: number; }
export const adDate = (date = new Date()) => date.toLocaleString("sv-SE");
export const adId = () => crypto.randomUUID();
export const adAccountState = (account: AdAccount): "authorized" | "expired" | "disconnected" =>
  account.platform === "巨量千川" && (account.connectionStatus === "disconnected" || account.revoked) ? "disconnected" : account.status;
export const canUseAdAccount = (account: AdAccount) => adAccountState(account) === "authorized" && !account.revoked;
const QC = "288194018274011";
export function createAdStore(): AdStore {
  const accounts: AdAccount[] = INITIAL_AD_ACCOUNTS.map(a => ({ ...a, authorizedBy: "徐振" }));
  accounts.push(...[3, 4, 5].map((n): AdAccount => ({ id: QC + n, name: ["梦畅美妆旗舰店-千川主账户", "悦己珠宝直播间-千川账户", "轻氧服饰直营-千川账户"][n - 3], platform: "巨量千川", status: n === 5 ? "expired" : "authorized", category: "千川引流", group: "千川第一组", user: "徐振", authorizedBy: "徐振", remark: n === 5 ? "授权已过期" : "", isStarred: n === 3 })));
  const store: AdStore = { accounts, groups: [...INITIAL_AD_GROUPS, { id: "AG-QC", platform: "巨量千川", name: "千川运营账户", viewTeam: "", viewGroup: "", viewUsers: [], accountIds: accounts.filter(a => a.platform === "巨量千川").map(a => a.id) }], templates: [], records: [], visibility: "all", sequence: 0 };
  const template: AdTemplate = { id: "template-qc-demo", name: "千川日常销售", ownerId: "chaojiguanliyuan", scope: "公司模板", platform: "巨量千川", goal: "推商品", naming: "{日期(月日)}_{模板名称}", suffix: "_20260909_001", params: { ...DEFAULT_AD_PARAMETERS }, workbench: { ...defaultWorkbench(), target: "商品全域", operation: "create", budget: "300", roi: "2", titles: ["商品实拍展示"], planName: "{日期(月日)}_{模板名称}" } };
  store.templates = [template]; store.sequence = 1;
  const a = accounts.find(a => a.id === QC + "3")!, catalog = adCatalog(a);
  const draft: AdDraft = { platform: "巨量千川", method: "plan", goal: "推商品", rows: [{ id: "demo-row", accountId: a.id, douyinId: catalog.douyins[0].id, storeId: catalog.stores[0].id, productId: catalog.products[0].id, planId: "" }], templateIds: [template.id], version: "原片", naming: "{视频名称}", scheduledAt: "", creative: "单创意" };
  const actor: AdActor = { id: "chaojiguanliyuan", name: "徐振", team: "电商事业部", group: "千川第一组", categories: ["千川引流"], permissions: ["uc_ad_push", "uc_ad_plan_manage"] };
  const [sample] = createAdRecords(draft, store, actor, { id: "fv1", title: "0730-8835-鲁月园-复古耳环动态奢感视频.mp4", author: "鲁月园" }, new Date("2026-09-09T09:00:00").getTime());
  store.records = [
    { ...sample, id: "demo-material-rejected", taskId: "DEMO-PUSH-001", operator: "张小梅", operatorId: "demo-member", status: "推送失败", assetId: "DEMO-MAT-QC-001", pushStatus: "推送成功", materialReview: "审核驳回", planResult: "未创建", failureReason: "示例：素材包含无法验证的功效承诺，审核驳回", logs: [{ time: sample.createdAt, text: "素材上传成功" }, { time: sample.createdAt, text: "素材审核驳回，未创建计划" }] },
    { ...sample, id: "demo-plan-rejected", taskId: "DEMO-PUSH-002", status: "推送失败", assetId: "DEMO-MAT-QC-002", pushStatus: "推送成功", materialReview: "审核通过", planId: "DEMO-PLAN-002", planResult: "创建成功", planReview: "审核驳回", deliveryStatus: "已暂停", failureReason: "示例：计划资质信息不完整，审核驳回", logs: [{ time: sample.createdAt, text: "素材审核通过，计划创建成功" }, { time: sample.createdAt, text: "计划审核驳回，保持暂停" }] },
  ];
  return store;
}

// Prototype identities use the same persisted session and role matrix as the app.
export function getAdActor(): AdActor {
  let session: { username?: string } = {};
  let roles: { id: string; enabled?: boolean; checkedKeys?: string[] }[] = [];
  try {
    const savedSession = JSON.parse(localStorage.getItem("mengchang_prototype_session") || "{}");
    const savedRoles = JSON.parse(localStorage.getItem("cloud_video_roles_v2") || "[]");
    if (savedSession && typeof savedSession.username === "string") session = savedSession;
    if (Array.isArray(savedRoles)) roles = savedRoles.filter(r => r && typeof r.id === "string" && (!r.checkedKeys || Array.isArray(r.checkedKeys)));
  } catch { /* Use a fail-closed session below. */ }
  const admin = session.username === "chaojiguanliyuan" || session.username === "guanliyuan";
  if (admin) {
    const role = roles.find(r => r.id === "role_super_admin");
    return { id: session.username!, name: "徐振", team: "电商事业部", group: "千川第一组", categories: ["千川引流"],
      permissions: adExecutionPermissions([...new Set([...(role?.checkedKeys || []), "uc_ad_push", "uc_ad_plan_manage", DERIVATION_PERMISSION, "ab_ad_group_manage", "ab_system_setting_manage"])]) };
  }
  const org = readReportOrganization();
  const member = org.members.find(m => m.id === (session.username === "putongyonghu" ? PROTOTYPE_OPERATOR.id : session.username));
  const enabled = member && ["normal", "bound"].includes(member.status);
  const organization = member ? memberOrganization(org, member.id) : undefined;
  const permissions = enabled ? adExecutionPermissions(roles.filter(r => r.enabled !== false && member.roleIds.includes(r.id)).flatMap(r => r.checkedKeys || [])) : [];
  let categories: string[] = [];
  try {
    const accounts: AdAccount[] = JSON.parse(localStorage.getItem(AD_STORE_KEY) || "{}").accounts || [];
    categories = enabled ? [...new Set(accounts.filter(a => a.user === member.name || Boolean(organization?.group && a.group === organization.group)).map(a => a.category).filter(Boolean))] : [];
  } catch { /* Invalid local assignments grant no category access. */ }
  return { id: session.username || "anonymous", name: member?.name || "普通用户", team: organization?.department || "", group: organization?.group || "", categories, permissions };
}
export function canSeeAdAccount(account: AdAccount, store: AdStore, actor: AdActor): boolean {
  const personal = account.authorizedBy === actor.name || account.user === actor.name;
  const systemAllows = store.visibility === "all" || (store.visibility === "personal" && personal) || (store.visibility === "group" && (personal || account.group === actor.group)) || (store.visibility === "category" && actor.categories.includes(account.category));
  const groups = store.groups.filter(g => g.platform === account.platform && g.accountIds.includes(account.id));
  const groupAllows = groups.length ? groups.some(g => (!g.viewTeam && !g.viewGroup && !g.viewUsers.length) || Boolean(g.viewTeam && g.viewTeam === actor.team) || Boolean(g.viewGroup && g.viewGroup === actor.group) || g.viewUsers.includes(actor.name)) : personal;
  return systemAllows && groupAllows;
}
export function visibleAdAccounts(store: AdStore, actor: AdActor) { return store.accounts.filter(a => canSeeAdAccount(a, store, actor)); }
export function visibleAdRecords(store: AdStore, actor: AdActor, videoId: string) {
  const ids = new Set(visibleAdAccounts(store, actor).map(a => `${a.platform}:${a.id}`));
  return store.records.filter(r => r.videoId === videoId && ids.has(`${r.platform}:${r.accountId}`));
}

export interface AdCatalog {
  douyins: { id: string; name: string; bindType?: "OFFICIAL" | "SELF" | "OTHER"; disabledReason?: string }[];
  stores: { id: string; name: string; douyinIds: string[] }[];
  products: { id: string; name: string; storeId: string; douyinIds?: string[]; grayReasons?: string[]; channelId?: string; channelType?: "SHOP_SELL" | "STAR_SELL"; source?: "merchant" | "talent" }[];
  plans: AdPlan[];
}
export interface AdPlan {
  target?: AdTarget;
  optStatus?: "ENABLE" | "DISABLE" | "UNKNOWN";
  id: string; name: string; douyinId: string; goal: MarketingGoal; status: string; videoIds: string[];
  bidding?: AdWorkbenchConfig["bidding"]; cost?: number; roi?: number; revenue?: number; createdAt?: string; budget?: number;
  roiTarget?: number; workbench?: AdWorkbenchConfig; targets?: DeliveryRow[];
  combinations?: AdPlanCombination[];
  associationCoverage?: "complete" | "unknown";
  materials?: { videoId: string; assetId: string; uploadedAt: string; rejected: boolean; combinations?: AdPlanCombination[]; materialSelectType?: "CUSTOM" | "AUTO"; daily: { date: string; cost: number; revenue: number }[] }[];
}
export const combinationKey = (combination: AdPlanCombination) => JSON.stringify([combination.productId, combination.douyinId]);
export function planCombinations(plan: AdPlan): AdPlanCombination[] {
  const combinations = plan.combinations || plan.targets?.map(row => ({ productId: row.productId, douyinId: row.douyinId })) || [];
  return [...new Map(combinations.filter(item => item.douyinId && (plan.goal === "推直播间" || item.productId)).map(item => [combinationKey(item), item])).values()];
}
export function selectedPlanCombinations(plan: AdPlan, row: DeliveryRow): AdPlanCombination[] {
  const available = planCombinations(plan);
  return row.combinations ?? (available.length === 1 ? available : []);
}
export function validPlanSelection(plan: AdPlan, row: DeliveryRow): boolean {
  if (plan.goal === "推直播间") return plan.douyinId === row.douyinId;
  const available = new Set(planCombinations(plan).map(combinationKey)), selected = selectedPlanCombinations(plan, row);
  return selected.length > 0 && new Set(selected.map(combinationKey)).size === selected.length && selected.every(item => available.has(combinationKey(item)));
}
// Account-scoped fixtures stand in for platform synchronization, never a global option list.
export function adCatalog(account: AdAccount): AdCatalog {
  if (account.catalog) return account.catalog;
  const id = account.id;
  const talent = account.ecpType === "COMMON_STAR" || account.ecpType === "AGENT";
  const douyins = [1, 2].map(n => ({ id: `${id}-dy${n}`, name: `${account.name.split("-")[0]} · 抖音号${n}`, bindType: talent ? "OTHER" as const : "SELF" as const }));
  const stores = [1, 2].map(n => ({ id: `${id}-store${n}`, name: `旗舰店${n} (${id.slice(-4)})`, douyinIds: douyins.map(d => d.id) }));
  const targets: AdTarget[] = ["商品全域", "直播全域", "商品乘方", "直播乘方"];
  const products: AdCatalog["products"] = stores.flatMap(s => [1, 2].map(n => ({ id: `${s.id}-p${n}`, name: n === 1 ? "ELL卸妆油" : "复古耳环", storeId: talent ? "" : s.id, douyinIds: douyins.map(d => d.id), grayReasons: [], source: talent ? "talent" : "merchant", ...(talent ? { channelId: `${s.id}-channel-${n}`, channelType: "STAR_SELL" as const } : {}) })));
  products.push({ id: `${id}-unavailable`, name: "待授权商品", storeId: "", douyinIds: douyins.map(d => d.id), grayReasons: ["当前账户无使用该抖音号投放所选商品的全域投放权限"], source: talent ? "talent" : "merchant" });
  const plans = douyins.flatMap((d, i) => targets.map((target, j): AdPlan => {
    const goal = targetGoal(target);
    const combinations = goal === "推直播间" ? [{ productId: "", douyinId: d.id }]
      : [{ productId: products[0].id, douyinId: d.id }, ...(target === "商品乘方" || i === 1 ? [{ productId: products[1].id, douyinId: d.id }] : [])];
    return {
      id: `${d.id}-${target}`, name: `${target}日常推广计划 (${d.id.slice(-5)})`, target, douyinId: d.id, goal,
      status: i ? "已暂停" : "投放中", optStatus: i ? "DISABLE" : "ENABLE", videoIds: ["existing-video"],
      bidding: i && target.endsWith("全域") ? "放量投放" : "控成本投放", budget: i ? 1000 : 600, roiTarget: 2.5,
      cost: 1268.5 + i * 350 + j * 123, roi: 2.68, revenue: Math.round((1268.5 + i * 350 + j * 123) * 2.68 * 100) / 100,
      createdAt: `2026-09-${12 + i + j} 09:30:00`, combinations, associationCoverage: "complete",
      materials: [{ videoId: "existing-video", assetId: `${id}-material-${i + 1}-${j + 1}`, combinations: structuredClone(combinations), uploadedAt: "2026-09-01", rejected: i === 1, materialSelectType: "CUSTOM", daily: Array.from({ length: 30 }, (_, day) => ({ date: adDate(new Date(Date.now() - day * 86400000)).slice(0, 10), cost: 12.5, revenue: 18.75 })) }],
    };
  }));
  return { douyins, stores, products, plans };
}
export function adProductIssue(account: AdAccount, productId: string, douyinId: string, _target: AdTarget): string {
  const catalog = adCatalog(account), product = catalog.products.find(item => item.id === productId), douyin = catalog.douyins.find(item => item.id === douyinId);
  if (!product || !douyin) return "请补全商品和抖音号";
  if (douyin.disabledReason) return douyin.disabledReason;
  if (product.grayReasons?.length) return product.grayReasons.join("；");
  const allowed = product.douyinIds || catalog.stores.find(store => store.id === product.storeId)?.douyinIds;
  if (!allowed?.includes(douyinId)) return "商品与抖音号的投放授权未确认，请联系管理员核查后重新选择";
  if (["COMMON_STAR", "AGENT"].includes(account.ecpType || "") && product.source !== "talent") return "达人或机构商品来源未确认，请联系管理员手动同步账户数据";
  return "";
}
export function syncAdCatalogFixture(account: AdAccount): AdAccount {
  if (account.platform !== "巨量千川" || !canUseAdAccount(account)) return account;
  const current = adCatalog(account), fixture = adCatalog({ ...account, catalog: undefined });
  // Only fill missing metadata for known demo objects; preserve plans and custom eligibility.
  return { ...account, catalog: { ...current,
    douyins: current.douyins.map(item => ({ ...fixture.douyins.find(sample => sample.id === item.id), ...item })),
    products: current.products.map(item => ({ ...fixture.products.find(sample => sample.id === item.id), ...item })),
  } };
}
export const adPlanTarget = (plan: AdPlan) => plan.target || plan.workbench?.target;
export const PLAN_WORDS = ["日期(月日)", "日期(年月日)", "当前时间", "剪辑时间", "模板名称", "视频名称", "视频作者", "抖音号名称", "创建日期", "创建时间", "商品名称", "整体支付ROI目标", "梦畅AIGC编号"];
export function resolveAdName(pattern: string, video: AdVideo, actor: AdActor, template?: AdTemplate, row?: DeliveryRow, account?: AdAccount, now = new Date()): string {
  const date = adDate(now), catalog = account && adCatalog(account);
  const values: Record<string, string> = { "日期(月日)": date.slice(5, 10).replace("-", ""), "日期(年月日)": date.slice(0, 10).replaceAll("-", ""), "当前时间": date.slice(11).replaceAll(":", ""), "剪辑时间": video.editedAt || date.slice(0, 10), "推广方式": template?.params.promotion || "托管", "转化目标": template?.params.optimization || "成交", "优化周期": template?.params.period || "7天", "模板名称": template?.name || "模板", "视频名称": video.title, "视频作者": video.author || actor.name, "抖音号名称": catalog?.douyins.find(d => d.id === row?.douyinId)?.name || "示例抖音号", "视频ID": video.id, "当前用户姓名": actor.name };
  Object.assign(values, { "创建日期": date.slice(0, 10).replaceAll("-", ""), "创建时间": date.slice(11).replaceAll(":", ""), "时间": date.slice(11).replaceAll(":", ""), "视频标题": video.title, "梦畅AIGC编号": video.id, "商品名称": catalog?.products.find(p => p.id === row?.productId)?.name || "商品", "整体支付ROI目标": String(template?.workbench?.bidding === "放量投放" ? "" : template?.workbench?.roi ?? template?.params.bid ?? "") });
  Object.assign(values, { "衍生编号": video.derivativeId || "", "原片/转码/衍生编号": video.derivativeId || video.id });
  return pattern.replace(/\{([^{}]+)\}/g, (match, key) => values[key] ?? match);
}
export const nameWidth = adCharacterCount;
export function templateWorkbench(template: AdTemplate): AdWorkbenchConfig | undefined {
  return template.workbench && { ...template.workbench, operation: "create", planName: template.naming };
}
export function validateAdTemplate(template: AdTemplate): string {
  if (!template.name.trim()) return "请输入模板名称";
  if (!PLAN_WORDS.some(w => template.naming.includes(`{${w}}`))) return "至少添加一个动态词包后才能保存模板";
  const words: string[] = template.naming.match(/\{[^{}]*\}/g) ?? [];
  if (words.some(w => !PLAN_WORDS.includes(w.slice(1, -1)))) return "计划名称包含不支持的动态词包";
  const config = templateWorkbench(template);
  return config ? validateWorkbench(config) : "模板配置待补全，请编辑并保存投放参数和创意标题";
}
export function validateAdDraft(draft: AdDraft, store: AdStore, actor: AdActor, videoCount = 1, hasDerivatives = false): string {
  if (draft.derivation || hasDerivatives) { if (!canUseDerivations(actor)) return "暂无衍生视频权限"; }
  else if (!actor.permissions.includes("uc_ad_push")) return "暂无推送权限";
  if (draft.method !== "push" && !actor.permissions.includes("uc_ad_plan_manage")) return "暂无管理投放计划权限";
  if (!draft.rows.length) return "请至少选择一个广告账户";
  if (!draft.naming.trim()) return "请输入视频推送至素材库名称";
  if (draft.scheduledAt && (!Number.isFinite(Date.parse(draft.scheduledAt)) || Date.parse(draft.scheduledAt) <= Date.now())) return "定时创建时间必须晚于当前时间";
  if (draft.workbench && draft.scheduledAt && (Date.parse(draft.scheduledAt) < Date.now() + 3599000 || Date.parse(draft.scheduledAt) > Date.now() + 30 * 86400000)) return "定时创建时间请选择1小时后至30天内";
  const creating = isCreatingAdPlan(draft);
  if (creating && draft.goal === "推直播间") return "直播营销目标仅支持追加已有计划";
  const availableVideos = draft.derivation?.allocation === "per_account" ? draft.derivation.count : videoCount;
  if (draft.method === "full_domain" && draft.workbench) {
    if (targetGoal(draft.workbench.target) !== draft.goal) return "营销目标与计划类型不一致，请重新选择";
    const issue = validateWorkbench(draft.workbench); if (issue) return issue;
    const groups = groupAdRows(draft);
    const accountTargets = Math.max(...draft.rows.map(row => groups.filter(group => group[0].accountId === row.accountId).length));
    if (draft.workbench.distribution === "平均分配" && accountTargets > availableVideos) return draft.derivation ? "每个账户的衍生视频数不足以平均分配到所选计划，请增加数量或改为全部使用" : `当前有${availableVideos}个视频，不足以平均分配到所选目标，请减少目标或改为全部使用`;
  }
  if (draft.creative === "多创意" && draft.workbench?.videoCount === "每个计划分配n个视频" && (!Number.isSafeInteger(draft.workbench.count) || draft.workbench.count < 1 || draft.workbench.count > availableVideos)) return `每个计划分配数须为1至${availableVideos}的整数`;
  const combos = new Set<string>();
  for (const [i, row] of draft.rows.entries()) {
    const a = store.accounts.find(a => a.id === row.accountId && a.platform === draft.platform);
    if (!a || !canSeeAdAccount(a, store, actor) || !canUseAdAccount(a)) return `明细${i + 1}的账户不可用或无操作权限，本次操作无法执行`;
    const c = adCatalog(a);
    if (draft.method !== "push") {
      if (!c.douyins.some(d => d.id === row.douyinId)) return `请补全明细${i + 1}的抖音号`;
      if (creating && !c.products.some(p => p.id === row.productId)) return `请补全明细${i + 1}的商品`;
      if (creating) {
        const issue = adProductIssue(a, row.productId, row.douyinId, draft.workbench?.target || "商品全域");
        if (issue) return `明细${i + 1}：${issue}`;
      }
      if (draft.method === "full_domain" && !creating && !c.plans.some(p => p.id === row.planId && p.douyinId === row.douyinId && p.goal === draft.goal && (!draft.workbench || adPlanTarget(p) === draft.workbench.target))) return `请选择明细${i + 1}中当前账户且营销目标一致的已有计划`;
      if (draft.method === "full_domain" && !creating && !validPlanSelection(c.plans.find(p => p.id === row.planId)!, row)) return `请确认明细${i + 1}的商品与抖音号组合，原关联可能已失效`;
    }
    const combo = draft.method === "push" ? row.accountId : creating ? `${row.accountId}:${row.douyinId}:${row.productId}` : `${row.accountId}:${row.planId}`;
    if (combos.has(combo)) return creating ? "同一广告账户的投放组合不能重复" : "请勿重复选择同一推送目标";
    combos.add(combo);
  }
  if (draft.method === "plan" && (!draft.templateIds.length || draft.templateIds.some(id => !store.templates.some(t => t.id === id && t.platform === draft.platform && t.goal === draft.goal && (t.scope === "公司模板" || t.ownerId === actor.id))))) return "请选择适用于当前平台及营销目标的模板";
  if (draft.method === "plan" && draft.workbench && draft.templateIds.some(id => {
    const template = store.templates.find(t => t.id === id);
    return template?.workbench && template.workbench.target !== draft.workbench!.target;
  })) return "模板的推广类型与当前选择不一致，请重新选择模板";
  if (draft.method === "plan") for (const id of draft.templateIds) {
    const template = store.templates.find(item => item.id === id)!;
    const issue = validateAdTemplate(template);
    if (issue) return `${template.name}：${issue}`;
  }
  if (creating && draft.scheduledAt) {
    const date = adDate(new Date(draft.scheduledAt)).slice(0, 10);
    const configs = draft.method === "plan" ? store.templates.filter(t => draft.templateIds.includes(t.id)).map(templateWorkbench) : [draft.workbench];
    if (configs.some(config => config?.period === "设置开始和结束时间" && config.start < date)) return "投放开始日期不得早于定时创建日期";
  }
  return "";
}
export const isCreatingAdPlan = (draft: AdDraft) => draft.method === "plan" || (draft.method === "full_domain" && draft.workbench?.operation === "create");
export function groupAdRows(draft: AdDraft): DeliveryRow[][] {
  if (draft.method !== "full_domain" || draft.workbench?.operation !== "create") return draft.rows.map(row => [row]);
  const grouping = draft.workbench.grouping;
  let rows = draft.rows;
  if (grouping === "全量组合（商品+抖音号）") {
    rows = [...new Set(rows.map(r => r.accountId))].flatMap(accountId => {
      const accountRows = rows.filter(r => r.accountId === accountId);
      const products = [...new Map(accountRows.map(r => [r.productId, r])).values()];
      return products.flatMap(product => [...new Set(accountRows.map(r => r.douyinId))].map(douyinId => ({ ...product, douyinId })));
    });
  }
  const groups = new Map<string, DeliveryRow[]>();
  for (const row of rows) {
    const key = `${row.accountId}:` + (draft.workbench.target === "商品全域" ? `${row.douyinId}:${grouping === "一个计划多个商品" ? "all" : row.productId}` : grouping === "聚合为一条计划" ? "all" : grouping === "每个商品一条计划" || grouping === "一个计划一个商品" ? row.productId : grouping === "每个抖音号一条计划" || grouping === "一个计划多个商品" ? row.douyinId : `${row.productId}:${row.douyinId}`);
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  return [...groups.values()];
}
// The preview and execution share exactly the same account/template/video partition.
export function adPlanUnits(draft: AdDraft, videoCount = 1) {
  const groups = groupAdRows(draft), copies = draft.derivation?.allocation === "per_account" ? draft.derivation.count : videoCount;
  const templates = draft.method === "plan" ? draft.templateIds : [""];
  return groups.flatMap((rows, groupIndex) => templates.flatMap(templateId => {
    const peers = groups.filter(group => group[0].accountId === rows[0].accountId);
    const indexes = Array.from({ length: Math.max(0, copies) }, (_, index) => index).filter(index => draft.method !== "full_domain" || draft.workbench?.distribution !== "平均分配" || index % peers.length === peers.indexOf(rows));
    const size = draft.method === "plan" && draft.creative === "单创意" ? 1 : draft.method === "plan" && draft.workbench?.videoCount === "每个计划分配n个视频" ? Math.max(1, draft.workbench.count) : Math.max(1, indexes.length);
    return Array.from({ length: Math.ceil(indexes.length / size) }, (_, part) => ({ rows, templateId, videoIndexes: indexes.slice(part * size, (part + 1) * size), key: `${groupIndex}:${templateId}:${part}` }));
  }));
}
export function adSubmissionSummary(draft: AdDraft, store: AdStore, videoCount = 1) {
  const units = adPlanUnits(draft, videoCount);
  return { accounts: new Set(draft.rows.map(row => row.accountId)).size, videos: units.reduce((sum, unit) => sum + unit.videoIndexes.length, 0), plans: isCreatingAdPlan(draft) ? units.length : 0,
    budget: isCreatingAdPlan(draft) ? units.reduce((sum, unit) => sum + Math.round(Number((unit.templateId ? store.templates.find(t => t.id === unit.templateId)?.workbench : draft.workbench)?.budget || 0) * 100), 0) / 100 : 0 };
}
export function adConfirmationIssue(records: AdPushRecord[], store: AdStore): string {
  for (const record of records) {
    if (record.templateSnapshot && JSON.stringify(record.templateSnapshot) !== JSON.stringify(store.templates.find(template => template.id === record.templateSnapshot!.id))) return "模板已发生变化，请重新提交并核对计划与预算";
    const account = store.accounts.find(item => item.id === record.accountId && item.platform === record.platform);
    if (account && isCreatingAdPlan(record.snapshot) && adCatalog(account).plans.some(plan => plan.name === record.planName)) return "待确认的计划名称已被使用，请重新提交生成名称";
  }
  return "";
}
export function createAdRecords(draft: AdDraft, store: AdStore, actor: AdActor, input: AdVideo | AdVideo[], now = Date.now()): AdPushRecord[] {
  const videos = Array.isArray(input) ? input : [input];
  if (!videos.length) throw new Error("请选择视频");
  if (new Set(videos.map(v => v.derivativeId || v.id)).size !== videos.length) throw new Error("请勿重复选择同一个视频");
  if (draft.derivation && videos.length > 1) throw new Error("衍生仅支持一个原视频");
  if (draft.derivation || videos.some(v => v.derivativeId)) requireDerivationPermission(actor);
  if (videos.some(v => v.derivativeId && (draft.derivation || derivationOutput(v.derivativeId)?.status !== "成功" || derivationOutput(v.derivativeId)?.source.id !== v.id))) throw new Error("所选衍生视频已不可用，请返回记录页重新选择");
  const error = validateAdDraft(draft, store, actor, videos.length, videos.every(v => v.derivativeId));
  if (error) throw new Error(error);
  if (draft.method === "full_domain" && !isCreatingAdPlan(draft)) {
    draft = { ...draft, rows: draft.rows.map(row => {
      const account = store.accounts.find(a => a.id === row.accountId && a.platform === draft.platform)!;
      const plan = adCatalog(account).plans.find(p => p.id === row.planId)!;
      return { ...row, combinations: structuredClone(selectedPlanCombinations(plan, row)) };
    }) };
  }
  if (draft.method === "full_domain" && !isCreatingAdPlan(draft) && !draft.derivation) {
    for (const row of draft.rows) {
      const account = store.accounts.find(a => a.id === row.accountId && a.platform === draft.platform)!;
      const plan = adCatalog(account).plans.find(p => p.id === row.planId)!;
      if (videos.some(video => plan.videoIds.includes(video.derivativeId || video.id))) throw new Error("视频已在该计划中，请选择其他计划");
    }
  }
  if (draft.derivation) {
    if (!["shared", "per_account"].includes(draft.derivation.allocation) || (draft.derivation.allocation === "per_account" && (!Number.isSafeInteger(draft.derivation.count) || draft.derivation.count < 1))) throw new Error("请填写有效的衍生数量");
    const amount = derivationCount(draft.derivation, new Set(draft.rows.map(row => row.accountId)).size);
    const issue = validateDerivationCount(amount, readAdPushSettings().maxDerive, activeDerivationCount(actor.id) + activeAdDerivationCount(store.records, actor.id, now));
    if (issue) throw new Error(issue);
  }
  const taskId = `PUSH-${adId()}`, time = adDate(new Date(now));
  const usedNames = new Set<string>();
  return adPlanUnits(draft, videos.length).flatMap(unit => {
    const { rows } = unit, template = store.templates.find(t => t.id === unit.templateId);
    const creating = isCreatingAdPlan(draft), config = template ? templateWorkbench(template) : draft.workbench;
    const planGroupId = adId();
    let generatedName = "";
    if (creating && config) {
      if (config.target === "商品全域" && (new Set(rows.map(r => r.productId)).size > 30 || unit.videoIndexes.length > 100)) throw new Error("商品全域每计划最多30个商品、100个视频素材，请减少选择或拆分计划");
      for (const row of rows) {
        const account = store.accounts.find(a => a.id === row.accountId && a.platform === draft.platform)!;
        const issue = adProductIssue(account, row.productId, row.douyinId, config.target);
        if (issue) throw new Error(issue);
        if (config.coupon && account.capabilities?.coupon !== true) throw new Error("所选账户的智能优惠券能力未确认，请关闭该选项");
        if (config.commission && account.capabilities?.commission !== true) throw new Error("所选账户的达人带货佣金优化白名单未确认，请关闭该选项");
        if (config.profile !== "默认" && !["OFFICIAL", "SELF"].includes(adCatalog(account).douyins.find(item => item.id === row.douyinId)?.bindType || "")) throw new Error("所选抖音号不支持配置主页展示，请改为默认");
      }
      const row = rows[0], account = store.accounts.find(a => a.id === row.accountId && a.platform === draft.platform)!;
      const namingTemplate = template || { params: { ...DEFAULT_AD_PARAMETERS, bid: Number(config.roi) } } as AdTemplate;
      generatedName = resolveAdName(template?.naming || config.planName, videos[draft.derivation ? 0 : unit.videoIndexes[0]], actor, namingTemplate, row, account, new Date(now)) + (template ? `${template.suffix}_${planGroupId.slice(0, 6)}` : config.suffix ? `_${planGroupId.slice(0, 6)}` : "");
      const limit = planNameLimit(config.target);
      if (limit && nameWidth(generatedName) > limit) throw new Error(`计划名称超出${limit}个字符（汉字按2个字符计算，含后缀），请缩短名称`);
      const nameKey = `${account.id}:${generatedName}`;
      if (usedNames.has(nameKey) || adCatalog(account).plans.some(p => p.name === generatedName)) throw new Error("同一账户的计划名称不能重复，请启用随机ID后缀或修改名称");
      usedNames.add(nameKey);
    }
    return unit.videoIndexes.map(index => {
    const video = videos[draft.derivation ? 0 : index];
    if (video.preparedMedia) { const issue = validateAdMedia(video.preparedMedia, draft.method !== "push"); if (issue) throw new Error(issue); }
    const row = rows[0];
    const account = store.accounts.find(a => a.id === row.accountId && a.platform === draft.platform)!;
    const plan = draft.method === "full_domain" && !creating ? adCatalog(account).plans.find(p => p.id === row.planId) : undefined;
    const id = adId();
    const derivativeId = draft.derivation ? `DER-${taskId.slice(5)}-${draft.derivation.allocation === "shared" ? "shared" : row.accountId}-${index + 1}` : video.derivativeId;
    return { id, taskId, planGroupId, derivativeId, sourceVideo: { ...video }, kind: "push_video", videoId: video.id, videoTitle: video.title, platform: draft.platform, accountId: account.id, account: account.name, method: draft.method, marketingGoal: draft.goal, assetId: "", assetName: resolveAdName(draft.naming, { ...video, derivativeId }, actor, undefined, row, account, new Date(now)), planId: plan?.id || "", planName: generatedName || plan?.name || "", templateName: template?.name || "", status: "待处理", pushStatus: "待处理", materialReview: "未提交", planResult: draft.method === "push" ? "不涉及" : "待处理", planReview: draft.method === "push" ? "不涉及" : "未提交", deliveryStatus: plan?.status || "未创建", failureReason: "", operator: actor.name, operatorId: actor.id, createdAt: time, updatedAt: time, startedAt: draft.scheduledAt ? Date.parse(draft.scheduledAt) : now, snapshot: structuredClone({ ...draft, rows, workbench: config ? { ...config, strategy: draft.workbench?.strategy || config.strategy } : draft.workbench, templateIds: template ? [template.id] : [] }), templateSnapshot: template && structuredClone(template), logs: [{ time, text: draft.derivation ? "衍生并推送任务已提交" : "推送任务已提交" }] } satisfies AdPushRecord;
  }); });
}
export const isAdActive = (r: AdPushRecord) => ["待处理", "衍生中", "推送中", "等待素材入库", "审核中", "创建计划中", "追加中", "请求开启中", "待确认"].includes(r.status);
export const activeAdDerivationCount = (records: AdPushRecord[], ownerId: string, now = Date.now()) => new Set(records.filter(r => !r.examplePaused && r.operatorId === ownerId && r.snapshot.derivation && r.derivativeId && isAdActive(r) && derivationOutput(r.derivativeId, ownerId)?.status !== "取消衍生" && now < r.startedAt + DERIVATION_TIME_MS).map(r => r.derivativeId)).size;
export function advanceAdRecords(records: AdPushRecord[], accounts: AdAccount[], now = Date.now()): AdPushRecord[] {
  return records.map(r => {
    if (r.examplePaused) return r;
    const output = r.derivativeId && derivationOutput(r.derivativeId);
    if (isAdActive(r) && output && ["取消衍生", "已删除", "失败"].includes(output.status)) return { ...r, status: output.status === "取消衍生" ? "已取消" : "推送失败", failureReason: output.status === "取消衍生" ? "衍生已取消" : "衍生文件不可用", pushStatus: "未推送", updatedAt: adDate(new Date(now)), logs: [...r.logs, { time: adDate(new Date(now)), text: "衍生文件不可用，停止推送" }] } as AdPushRecord;
    if (!isAdActive(r) || r.status === "待确认" && r.failureKind !== "dependency" || now < r.startedAt) return r;
    const age = now - r.startedAt, elapsed = age - (r.snapshot.derivation ? DERIVATION_TIME_MS : 0), a = accounts.find(a => a.id === r.accountId && a.platform === r.platform), creating = isCreatingAdPlan(r.snapshot);
    const time = adDate(new Date(now));
    const targetPlan = a && adCatalog(a).plans.find(p => p.id === r.planId && p.goal === r.marketingGoal && (!r.snapshot.workbench || adPlanTarget(p) === r.snapshot.workbench.target));
    const creationIssue = creating && a && !["创建成功", "追加成功"].includes(r.planResult) ? r.snapshot.rows.map(row => adProductIssue(a, row.productId, row.douyinId, r.snapshot.workbench?.target || "商品全域")).find(Boolean) || (r.snapshot.workbench ? validateWorkbench(r.snapshot.workbench, adDate(new Date(now)).slice(0, 10)) : "计划参数待补全") : "";
    const failure = !a || !canUseAdAccount(a) ? a && adAccountState(a) === "disconnected" ? "账户已解除接入，请由管理员重新接入后重试" : "账户授权已失效，请由管理员重新授权后重试"
      : creationIssue ? creationIssue
      : r.method === "full_domain" && !creating && !targetPlan ? "所选计划已不可用或目标不匹配，请重新选择"
      : !creating && r.method !== "push" && !r.applied && r.planResult !== "追加成功" && targetPlan && !validPlanSelection(targetPlan, r.snapshot.rows[0]) ? "所选商品与抖音号关联已失效，未执行追加，请重新选择"
      : !creating && r.method !== "push" && !r.applied && r.planResult !== "追加成功" && targetPlan?.videoIds.includes(r.derivativeId || r.videoId) ? "视频已在该计划中，未重复追加" : "";
    if (failure) return { ...r, status: "推送失败", failureKind: !a || !canUseAdAccount(a) ? "authorization" : "invalid_target", failureReason: failure, updatedAt: time, logs: [...r.logs, { time, text: failure }] };
    if (r.simulationFailure?.step === "media") return { ...r, status: "推送失败", executionIssue: "media", failureKind: "transport", failureReason: "文件预检失败：模拟视频格式或尺寸不符合千川要求，请回到资源库处理成片后重新发起", logs: [...r.logs, { time, text: "文件预检失败，未上传视频、未创建计划" }] };
    if (r.simulationFailure?.step === "upload" && r.pushStatus !== "推送成功" && elapsed >= 2500) return { ...r, status: r.simulationFailure.unknown ? "待确认" : "推送失败", failureKind: r.simulationFailure.unknown ? "unknown_write" : "transport", pendingWrite: r.simulationFailure.unknown ? { step: "upload", attemptId: `${r.id}:upload`, requestedAt: time } : undefined, pushStatus: r.simulationFailure.unknown ? "结果待核查" : "推送失败", failureReason: r.simulationFailure.message, updatedAt: time, logs: [...r.logs, { time, text: r.simulationFailure.message }] };

    // Timings simulate transport acknowledgements only, never an audit or delivery verdict.
    const uploaded = r.pushStatus === "推送成功" || elapsed >= 2500;
    const ready = r.materialReady === true || (uploaded && elapsed >= 5000 && r.simulationFailure?.step !== "library");
    const coverUploaded = r.method === "push" || Boolean(r.coverId) || (ready && elapsed >= 5000 && r.simulationFailure?.step !== "cover");
    const coverReady = r.method === "push" || r.coverReady === true || (coverUploaded && r.simulationFailure?.step !== "cover_library");
    const peers = r.planGroupId ? records.filter(other => other.taskId === r.taskId && other.accountId === r.accountId && other.planGroupId === r.planGroupId) : [r];
    const peerFailed = (other: AdPushRecord) => ["推送失败", "已取消"].includes(other.status) || !other.simulationFailure?.unknown && (["media", "upload", "cover"].includes(other.simulationFailure?.step || "")) || Boolean(other.derivativeId && ["失败", "取消衍生", "已删除"].includes(derivationOutput(other.derivativeId)?.status || ""));
    const groupFailed = peers.some(peerFailed);
    const groupReady = peers.every(other => peerFailed(other) || !other.pendingWrite && !["upload", "cover", "library", "cover_library"].includes(other.simulationFailure?.step || "") && (other.materialReady && (other.coverReady || other.coverId) || now - other.startedAt - (other.snapshot.derivation ? DERIVATION_TIME_MS : 0) >= 5000));
    const completedPeer = peers.find(other => other.id !== r.id && other.planId && ["创建成功", "追加成功"].includes(other.planResult));
    const appendToCreated = creating && !["创建成功", "追加成功"].includes(r.planResult) && Boolean(completedPeer);
    const blocked = creating && !completedPeer && !["创建成功", "追加成功"].includes(r.planResult) && (!groupReady || groupFailed && r.snapshot.workbench?.strategy !== "跳过失败的直接搭建");
    const writeStep = r.simulationFailure?.step;
    const planWriteBlocked = ["create", "append", "capacity"].includes(writeStep || "") || peers.some(other => other.pendingWrite?.step === "create");
    const handled = ["创建成功", "追加成功"].includes(r.planResult) || (r.method !== "push" && ready && coverReady && elapsed >= 7500 && !blocked && !planWriteBlocked);
    const appendRecovery = appendToCreated || creating && r.planResult === "追加成功";
    const enabled = appendRecovery || r.enableResult === "请求成功" || (creating && handled && elapsed >= 9000 && r.simulationFailure?.step !== "enable");
    const enableFailed = creating && handled && elapsed >= 9000 && !enabled && r.simulationFailure?.step === "enable";
    const status: AdPushStatus = enableFailed ? "推送失败" : !uploaded ? age < 1000 ? "待处理" : elapsed < 0 ? "衍生中" : "推送中" : !ready ? "等待素材入库" : blocked ? "待确认" : r.method === "push" ? "推送成功" : !handled ? creating ? "创建计划中" : "追加中" : creating && !enabled ? "请求开启中" : "推送成功";
    const next: AdPushRecord = {
      ...r, dataSource: "prototype", status, updatedAt: time,
      failureKind: blocked ? "dependency" : enableFailed ? "transport" : undefined,
      failureReason: blocked ? groupFailed ? "同一计划存在失败或取消的视频，暂不创建；请处理失败记录或取消本计划剩余步骤" : "等待同一计划的其他视频入库" : enableFailed ? r.simulationFailure!.message : "",
      assetId: uploaded ? r.assetId || `MAT-${r.accountId}-${r.derivativeId || r.videoId}-${r.snapshot.version === "原片" ? "O" : "T"}` : r.assetId,
      remoteVideoId: uploaded ? r.remoteVideoId || `VID-${r.accountId}-${r.derivativeId || r.videoId}-${r.snapshot.version === "原片" ? "O" : "T"}` : r.remoteVideoId,
      coverId: coverUploaded && r.method !== "push" ? r.coverId || `IMG-${r.accountId}-${r.derivativeId || r.videoId}` : r.coverId,
      coverReady,
      materialReady: ready,
      pushStatus: uploaded ? "推送成功" : status,
      materialReview: r.method === "push" ? "不涉及投放审核" : r.materialReview === "未提交" ? "待确认" : r.materialReview,
      planResult: r.method === "push" ? "不涉及" : handled ? r.planResult === "追加成功" || appendToCreated || !creating ? "追加成功" : "创建成功" : ready ? creating ? "创建计划中" : "追加中" : "待处理",
      planId: handled && creating ? r.planId || completedPeer?.planId || `PLAN-${r.planGroupId || r.id}` : r.planId,
      planHandledAt: handled ? r.planHandledAt || time : r.planHandledAt,
      planReview: r.method === "push" ? "不涉及" : r.planReview === "未提交" ? "待同步" : r.planReview,
      enableResult: !creating || appendRecovery ? "不涉及" : enabled ? "请求成功" : enableFailed ? "请求失败" : handled ? "请求中" : "未请求",
      deliveryStatus: r.method === "push" ? "不涉及" : appendRecovery ? completedPeer?.deliveryStatus || r.deliveryStatus : creating && handled ? "待同步" : r.deliveryStatus,
    };
    if (next.enableResult === "请求成功" && r.enableResult !== "请求成功") next.enableApplied = false;
    const issueDue = r.simulationFailure && (writeStep === "library" && uploaded && elapsed >= 5000 || writeStep === "cover_library" && coverUploaded && !coverReady || writeStep === "cover" && ready && !coverReady || ["create", "append", "capacity"].includes(writeStep || "") && ready && coverReady && !blocked && !["创建成功", "追加成功"].includes(r.planResult) && elapsed >= 7500 || writeStep === "enable" && enableFailed);
    if (issueDue) {
      const unknown = Boolean(r.simulationFailure?.unknown && ["cover", "create", "append", "enable"].includes(writeStep!));
      Object.assign(next, { status: unknown || ["library", "cover_library"].includes(writeStep!) ? "待确认" : "推送失败", failureKind: unknown ? "unknown_write" : "transport", failureReason: r.simulationFailure!.message,
        executionIssue: ["cover", "library", "cover_library", "capacity"].includes(writeStep!) ? writeStep : undefined,
        pendingWrite: unknown ? { step: writeStep, attemptId: `${["create", "enable"].includes(writeStep!) ? r.planGroupId || r.id : r.id}:${writeStep}`, requestedAt: time } : undefined,
      });
      if (r.method !== "push" && ["cover", "library", "cover_library"].includes(writeStep!)) next.planResult = writeStep === "cover_library" ? "等待封面入库" : writeStep === "library" ? "等待视频入库" : "待处理";
      if (["create", "append", "capacity"].includes(writeStep!)) next.planResult = unknown ? "结果待核查" : "未完成";
      if (unknown && writeStep === "create") next.deliveryStatus = "待核查";
      next.logs = [...r.logs, { time, text: r.simulationFailure!.message }];
      return next;
    }
    if (status === r.status && next.planResult === r.planResult && next.enableResult === r.enableResult && next.materialReady === r.materialReady && next.failureReason === r.failureReason) return r;
    const message = enableFailed ? `计划已创建，请求开启失败：${next.failureReason}` : appendToCreated && handled ? "失败视频已补入同组原计划，不重复创建计划；审核状态待核查" : status === "推送成功" && creating ? "计划已创建，请求开启成功；审核与实际投放状态待千川同步" : status;
    next.logs = [...r.logs, { time, text: message }];
    return next;
  });
}
export function readAdStore(): AdStore {
  let store: AdStore;
  try { const parsed = JSON.parse(localStorage.getItem(AD_STORE_KEY) || "null"); store = parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.records) ? parsed : createAdStore(); }
  catch { return createAdStore(); }
  try {
    if (!localStorage.getItem("mengchang-report-account-bindings-v1")) {
      const org = readReportOrganization();
      const candidates = org.members.filter(member => member.status === "normal" && org.depts.some(dept => dept.id === member.deptId && dept.levelType === "group"));
      store = { ...store, accounts: store.accounts.map((account, index) => {
        if (!account.user && !account.group) return account;
        const valid = org.members.find(member => member.name === account.user);
        const member = valid || candidates[index % Math.max(1, candidates.length)];
        if (!member) return account;
        const group = org.depts.find(dept => dept.id === member.deptId && dept.levelType === "group");
        return { ...account, user: member.name, group: group?.name || "" };
      }) };
      localStorage.setItem(AD_STORE_KEY, JSON.stringify(store));
      localStorage.setItem("mengchang-report-account-bindings-v1", "1");
    }
  } catch { /* Preserve the loaded store when storage is unavailable. */ }
  return store;
}
export function updateAdStore(update: (store: AdStore) => AdStore): AdStore {
  const next = update(readAdStore());
  localStorage.setItem(AD_STORE_KEY, JSON.stringify(next));
  syncPushDerivations(next.records);
  window.dispatchEvent(new Event(AD_CHANGE_EVENT));
  return next;
}
export function saveAdTemplate(template: AdTemplate): AdTemplate {
  if (!getAdActor().permissions.includes("uc_ad_plan_manage")) throw new Error("暂无管理投放计划权限");
  const error = validateAdTemplate(template); if (error) throw new Error(error);
  let saved = template;
  updateAdStore(store => {
    const existing = store.templates.find(t => t.id === template.id);
    if (existing?.scope === "个人模板" && existing.ownerId !== getAdActor().id) throw new Error("暂无此模板操作权限");
    const sequence = template.suffix ? store.sequence : store.sequence + 1;
    saved = { ...template, suffix: template.suffix || `_${adDate().slice(0, 10).replaceAll("-", "")}_${String(sequence).padStart(3, "0")}` };
    return { ...store, sequence, templates: [saved, ...store.templates.filter(t => t.id !== saved.id)] };
  });
  return saved;
}
export function cancelAdRecords(ids: string[], ownerId?: string): void {
  const actor = getAdActor();
  updateAdStore(store => {
    const current = advanceAdStore(store);
    const targets = current.records.filter(r => ids.includes(r.id));
    if (!targets.length || targets.length !== new Set(ids).size) throw new Error("所选记录已发生变化，请刷新后重新选择");
    if (ownerId && (ownerId !== actor.id || targets.some(r => r.operatorId !== ownerId))) throw new Error("只能取消当前用户的推送记录");
    if (targets.some(r => (r.derivativeId ? !canUseDerivations(actor) : !actor.permissions.includes("uc_ad_push")) || r.status !== "待处理" || (r.method !== "push" && !actor.permissions.includes("uc_ad_plan_manage")) || !visibleAdRecords(store, actor, r.videoId).some(v => v.id === r.id))) throw new Error("存在无操作权限或已开始执行的记录，本次操作无法执行");
    return { ...current, records: current.records.map(r => ids.includes(r.id) ? { ...r, status: "已取消", pushStatus: r.pushStatus === "推送成功" ? r.pushStatus : "已取消", planResult: ["创建成功", "追加成功", "不涉及"].includes(r.planResult) ? r.planResult : "已取消", updatedAt: adDate(), logs: [...r.logs, { time: adDate(), text: "取消未完成步骤，已上传素材及已创建计划不撤销" }] } : r) };
  });
}
function validateOperationRecords(ids: string[], ownerId: string | undefined, status: (record: AdPushRecord) => boolean, statusMessage: string) {
  const actor = getAdActor();
  const current = advanceAdStore(readAdStore());
  const uniqueIds = [...new Set(ids)];
  const targets = current.records.filter(record => uniqueIds.includes(record.id));
  if (!uniqueIds.length) throw new Error("请先选择需要操作的推送记录");
  if (targets.length !== uniqueIds.length) throw new Error("所选记录已发生变化，请刷新后重新选择");
  if (ownerId && (ownerId !== actor.id || targets.some(record => record.operatorId !== ownerId))) throw new Error("只能操作当前用户的推送记录");
  if (targets.some(record => !status(record))) throw new Error(statusMessage);
  if (targets.some(record =>
    (record.derivativeId ? !canUseDerivations(actor) : !actor.permissions.includes("uc_ad_push")) ||
    (record.method !== "push" && !actor.permissions.includes("uc_ad_plan_manage")) ||
    !visibleAdRecords(current, actor, record.videoId).some(visible => visible.id === record.id)
  )) throw new Error("所选记录中存在无操作权限的数据");
  return { current, targets };
}
function requireUncreatedPlans(current: AdStore, targets: AdPushRecord[]) {
  if (targets.some(record => !isCreatingAdPlan(record.snapshot) || current.records.some(peer =>
    peer.operatorId === record.operatorId && peer.platform === record.platform && peer.accountId === record.accountId && peer.taskId === record.taskId &&
    (peer.id === record.id || Boolean(record.planGroupId && peer.planGroupId === record.planGroupId)) &&
    (peer.pendingWrite || peer.failureKind === "unknown_write" || peer.planId && ["创建成功", "追加成功"].includes(peer.planResult))
  ))) throw new Error("计划已创建或请求结果待确认，请到推送视频记录核查原任务");
}
export function retryAdRecords(ids: string[], ownerId?: string, options: { uncreatedPlansOnly?: boolean } = {}): void {
  const { current, targets } = validateOperationRecords(ids, ownerId, record => record.status === "推送失败", "批量重试仅支持推送失败的记录");
  if (options.uncreatedPlansOnly) requireUncreatedPlans(current, targets);
  for (const record of targets) {
    const reason = adRetryBlockReason(record);
    if (reason) throw new Error(reason);
    const account = current.accounts.find(a => a.platform === record.platform && a.id === record.accountId);
    if (!account || !canUseAdAccount(account)) throw new Error("账户授权不可用，请联系管理员恢复授权后重试");
  }
  const targetIds = new Set(targets.map(record => record.id));
  const now = Date.now(), time = adDate(new Date(now));
  updateAdStore(() => ({ ...current, records: current.records.map(record => targetIds.has(record.id) ? {
    ...record, examplePaused: false, status: "待处理",
    failureReason: "", failureKind: undefined, executionIssue: undefined, simulationFailure: undefined, startedAt: now, updatedAt: time, logs: [...record.logs, { time, text: "重试未完成步骤，保留已上传素材及已创建计划" }],
  } : record) }));
}
export function adRetryBlockReason(record: AdPushRecord): string {
  if (record.executionIssue === "media") return "文件不符合千川要求，请返回资源库处理成片并重新发起；原任务保留";
  if (record.materialReview === "审核驳回" || record.failureKind === "material_rejected") return "视频内容审核驳回，请返回资源库选择合规成片并重新发起；原任务保留";
  if (record.planReview === "审核驳回" || record.failureKind === "plan_rejected") return "计划审核驳回，请按审核原因处理资质等问题，再核查原计划状态；不能直接重试开启";
  if (record.failureKind === "unknown_write") return "上次请求结果尚未确认，请先核查原任务，不能重复创建计划";
  if (record.executionIssue === "capacity") return "千川返回计划素材容量不足，旧视频未移除；请先在千川处理容量，再核查原计划后重试，或取消剩余步骤";
  return "";
}
export type AdFeedbackScenario = NonNullable<AdPushRecord["feedbackScenario"]>;
export const AD_FEEDBACK_SCENARIOS: { value: AdFeedbackScenario; label: string }[] = [
  { value: "pending", label: "素材待审核 / 尚无可投结论" },
  { value: "approved", label: "审核通过，计划待投放" },
  { value: "delivering", label: "审核通过且计划投放中" },
  { value: "material_rejected", label: "视频内容审核驳回" },
  { value: "plan_rejected", label: "计划资质审核驳回" },
  { value: "unavailable", label: "查询失败 / 结果不明" },
  { value: "no_material_feedback", label: "零消耗素材暂无审核反馈" },
  { value: "balance", label: "计划账户余额不足" },
  { value: "budget", label: "计划预算不足" },
  { value: "schedule", label: "未到投放时间" },
  { value: "quota", label: "在投计划配额超限" },
  { value: "live_off", label: "关联直播间未开播" },
];
export function recheckAdRecords(ids: string[], scenario: AdFeedbackScenario = "pending", ownerId?: string): void {
  const { current, targets } = validateOperationRecords(ids, ownerId, record => record.status !== "已取消", "已取消的任务不再执行后续步骤");
  if (targets.some(record => !current.accounts.some(account => account.id === record.accountId && account.platform === record.platform && canUseAdAccount(account)))) throw new Error("账户授权不可用，无法核查千川状态，请联系管理员恢复授权");
  const targetIds = new Set(targets.map(record => record.id)), now = Date.now(), time = adDate(new Date(now));
  const next: AdStore = { ...current, records: current.records.map(record => {
    if (!targetIds.has(record.id)) return record;
    const checked = { ...record, feedbackScenario: scenario, lastCheckedAt: time, updatedAt: time, dataSource: "prototype" as const };
    const log = (text: string) => [...record.logs, { time, text: `模拟千川状态核查：${text}` }];
    if (scenario === "unavailable") return { ...checked, logs: log("查询失败，保留上次已确认结果，不重复提交写入请求") };
    if (record.failureKind === "unknown_write" || record.pendingWrite) return { ...checked, logs: log("写入结果待核查，请使用执行恢复入口核对原请求；审核查询不能解除写入锁定") };
    if (record.method === "push" || !record.planId || !record.applied) return { ...checked, logs: log("尚无计划素材关联，不能确认投放审核；仅推送不触发投放") };
    if (scenario === "no_material_feedback") return { ...checked, materialReview: record.materialFeedback ? record.materialReview : "待确认", logs: log("素材查询未返回匹配的新素材；零消耗可能无数据，不判为通过、驳回或已删除，旧视频继续保留") };
    const statusMap = { balance: "账户余额不足", budget: "投放预算不足", schedule: "未到达投放时间", quota: "在投计划配额超限", live_off: "关联直播间未开播" };
    if (scenario in statusMap) return { ...checked, deliveryStatus: statusMap[scenario as keyof typeof statusMap], materialFeedback: undefined, logs: log(`计划状态：${statusMap[scenario as keyof typeof statusMap]}；未确认素材可投，不重建计划`) };
    const approved = scenario === "approved" || scenario === "delivering", rejected = scenario === "material_rejected" || scenario === "plan_rejected";
    const account = current.accounts.find(a => a.id === record.accountId && a.platform === record.platform);
    const plan = account && adCatalog(account).plans.find(p => p.id === record.planId);
    const delivering = scenario === "delivering" && plan?.optStatus === "ENABLE";
    const deliveryStatus = scenario === "plan_rejected" ? "审核不通过" : approved ? plan?.optStatus === "DISABLE" ? "已暂停" : delivering ? "投放中" : "待投放" : record.deliveryStatus;
    const failureReason = scenario === "material_rejected" ? "视频内容审核驳回，请返回资源库选择合规成片重新发起" : scenario === "plan_rejected" ? "计划资质审核驳回，请按千川审核建议处理资质后核查状态" : "";
    return { ...checked, materialReview: scenario === "material_rejected" ? "审核驳回" : approved ? "审核通过" : scenario === "plan_rejected" ? record.materialReview : "审核中", planReview: scenario === "plan_rejected" ? "审核驳回" : approved ? "审核通过" : record.planReview, deliveryStatus,
      failureKind: rejected ? scenario : record.failureKind === "transport" ? record.failureKind : undefined,
      failureReason: rejected ? failureReason : record.failureKind === "transport" ? record.failureReason : "",
      status: rejected || record.failureKind === "transport" ? "推送失败" : record.removalResult === "待确认" ? "待确认" : "推送成功",
      materialFeedback: scenario === "plan_rejected" ? undefined : { advertiserId: record.accountId, adId: record.planId, materialId: record.assetId, observedAt: time, auditStatus: scenario === "material_rejected" ? "REJECT" : approved ? "PASS" : "IN_PROGRESS", materialStatus: delivering ? "DELIVERY_OK" : "DELIVERY_NOT", source: "qianchuan/uni_promotion/ad/material/get" },
      logs: log(failureReason || (approved ? `素材审核通过${delivering ? "且投放中" : "，尚未确认投放"}；计划${deliveryStatus}` : "素材审核尚未完成，继续保留原视频，计划状态不据此推断")),
    } satisfies AdPushRecord;
  }) };
  const confirmed = next.records.filter(record => targetIds.has(record.id) && record.planId && record.applied && !record.pendingWrite && !["unavailable", "no_material_feedback"].includes(scenario));
  next.accounts = next.accounts.map(account => {
    const matches = confirmed.filter(record => record.accountId === account.id && record.platform === account.platform);
    if (!matches.length) return account;
    const catalog = adCatalog(account);
    return { ...account, catalog: { ...catalog, plans: catalog.plans.map(plan => {
      const feedback = matches.find(record => record.planId === plan.id);
      return feedback ? { ...plan, status: feedback.deliveryStatus } : plan;
    }) } };
  });
  next.records = next.records.map(record => {
    const feedback = confirmed.find(other => other.planId === record.planId && other.accountId === record.accountId && other.platform === record.platform);
    return feedback && !targetIds.has(record.id) ? { ...record, planReview: feedback.planReview, deliveryStatus: feedback.deliveryStatus } : record;
  });
  updateAdStore(() => advanceAdStore(next, now));
}
export function cancelActiveAdRecords(ids: string[], ownerId?: string, options: { uncreatedPlansOnly?: boolean } = {}): void {
  const { current, targets } = validateOperationRecords(ids, ownerId, isAdActive, "批量取消仅支持进行中的推送记录");
  if (options.uncreatedPlansOnly) requireUncreatedPlans(current, targets);
  const targetIds = new Set(targets.map(record => record.id));
  const time = adDate();
  updateAdStore(() => ({ ...current, records: current.records.map(record => targetIds.has(record.id) ? {
    ...record, status: "已取消", pushStatus: record.pushStatus === "推送成功" ? record.pushStatus : "已取消", planResult: ["创建成功", "追加成功", "不涉及"].includes(record.planResult) ? record.planResult : "已取消",
    updatedAt: time, logs: [...record.logs, { time, text: "取消未完成步骤，已上传素材及已创建计划不撤销" }],
  } : record) }));
}
export function revokeAdAccounts(ids: string[], platform: string): void {
  if (!getAdActor().permissions.includes("ab_ad_group_manage")) throw new Error("暂无管理广告组权限");
  updateAdStore(store => {
    const uniqueIds = new Set(ids);
    if (!uniqueIds.size || store.accounts.filter(a => a.platform === platform && uniqueIds.has(a.id)).length !== uniqueIds.size) throw new Error("所选账户已发生变化，请重新选择");
    if (store.records.some(r => !r.examplePaused && r.platform === platform && ids.includes(r.accountId) && isAdActive(r))) throw new Error("当前账户有进行中的推送任务");
    return { ...store, accounts: store.accounts.map(a => a.platform === platform && ids.includes(a.id) ? platform === "巨量千川" ? { ...a, connectionStatus: "disconnected", revoked: true } : { ...a, status: "expired", revoked: true } : a) };
  });
}

export function authorizeAdAccount(platform: string, id: string, name: string): void {
  authorizeAdAccounts(platform, [{ id, name }]);
}

export type AdConnectionCandidate = Pick<AdAccount, "id" | "name" | "ecpType" | "authorizationSubject">;
export function authorizeAdAccounts(platform: string, candidates: AdConnectionCandidate[]): void {
  const actor = getAdActor();
  if (!actor.permissions.includes("ab_ad_group_manage")) throw new Error("暂无管理广告组权限");
  if (!candidates.length || candidates.some(item => !item.id || !item.name)) throw new Error("请选择需要接入的广告账户");
  if (new Set(candidates.map(item => item.id)).size !== candidates.length) throw new Error("请勿重复接入同一账户");
  if (platform !== "巨量千川" && candidates.length !== 1) throw new Error("当前平台仅支持单账户授权");
  updateAdStore(store => {
    const connected = candidates.map(candidate => {
      const existing = store.accounts.find(a => a.platform === platform && a.id === candidate.id);
      const account: AdAccount = existing
        ? { ...existing, ...candidate, connectionStatus: "connected", status: "authorized", revoked: false, syncError: "", syncedAt: adDate(), authorizedAt: adDate(), authorizedBy: actor.name }
        : { ...candidate, platform, connectionStatus: "connected", status: "authorized", category: "", group: "", user: actor.name, authorizedBy: actor.name, remark: "", isStarred: false, syncedAt: adDate(), authorizedAt: adDate() };
      account.catalog = adCatalog(account);
      return account;
    });
    const ids = new Set(connected.map(a => a.id));
    return { ...store, accounts: [...connected, ...store.accounts.filter(a => a.platform !== platform || !ids.has(a.id))] };
  });
}

function materialRemovalScope(plan: AdPlan | undefined, record: AdPushRecord, config: AdWorkbenchConfig) {
  const retained: string[] = [], removable = new Set<string>();
  const unknown = "影响范围无法确认，旧视频已保留";
  if (!plan || plan.associationCoverage !== "complete" || !validPlanSelection(plan, record.snapshot.rows[0])) return { retained: [unknown], removable };
  const available = new Set(planCombinations(plan).map(combinationKey));
  const selected = new Set(selectedPlanCombinations(plan, record.snapshot.rows[0]).map(combinationKey));
  const materials = plan.materials || [];
  // Every video-to-material mapping is needed: one material ID may have several video aliases.
  if (!selected.size || plan.videoIds.some(id => new Set(materials.filter(m => m.videoId === id).map(m => m.assetId)).size !== 1) || materials.some(m =>
    !m.assetId || !plan.videoIds.includes(m.videoId) || !m.combinations?.length || m.combinations.some(c => !available.has(combinationKey(c)))
  )) return { retained: [unknown], removable };
  for (const id of new Set(config.removeIds.split(/[，,\s]+/).filter(Boolean))) {
    const aliases = materials.filter(m => m.assetId === id);
    if (!aliases.length) retained.push(`${id}：未确认该素材在计划内的关联`);
    else if (id === record.assetId || aliases.some(m => m.videoId === (record.derivativeId || record.videoId))) retained.push(`${id}：本次新增素材不能移除`);
    else if (aliases.some(m => m.materialSelectType !== "CUSTOM")) retained.push(`${id}：不是已确认的自选素材`);
    else {
      const shared = [...new Map(aliases.flatMap(m => m.combinations!).filter(c => !selected.has(combinationKey(c))).map(c => [combinationKey(c), c])).values()];
      if (shared.length) retained.push(`${id}：仍关联未选组合 ${shared.map(c => `商品 ${c.productId || "不涉及"} / 抖音号 ${c.douyinId}`).join("、")}`);
      else removable.add(id);
    }
  }
  return { retained, removable };
}

export function hasConfirmedAdMaterial(record: AdPushRecord, now = Date.now()): boolean {
  const feedback = record.materialFeedback;
  const observedAt = Date.parse(feedback?.observedAt || ""), handledAt = Date.parse(record.planHandledAt || "");
  return Boolean(record.applied && feedback && feedback.source === "qianchuan/uni_promotion/ad/material/get" &&
    feedback.advertiserId === record.accountId && feedback.adId === record.planId && feedback.materialId === record.assetId &&
    Number.isFinite(observedAt) && Number.isFinite(handledAt) && observedAt >= Math.max(handledAt, record.startedAt) && observedAt <= now &&
    feedback.auditStatus === "PASS" && feedback.materialStatus === "DELIVERY_OK");
}

// Record successful remote steps independently; an enable/removal failure never rolls them back.
export function advanceAdStore(store: AdStore, now = Date.now()): AdStore {
  const records = advanceAdRecords(store.records, store.accounts, now);
  let accounts = store.accounts;
  const applied = records.map(r => {
    if (r.examplePaused) return r;
    if (r.method === "push" || !["创建成功", "追加成功"].includes(r.planResult) || !r.planId) return r;
    const config = r.method === "plan" ? r.templateSnapshot?.workbench || r.snapshot.workbench : r.snapshot.workbench;
    const creating = isCreatingAdPlan(r.snapshot), outputVideoId = r.derivativeId || r.videoId, time = adDate(new Date(now));
    let result = r;
    if (!r.applied) {
      accounts = accounts.map(a => {
        if (a.id !== r.accountId || a.platform !== r.platform) return a;
        const catalog = adCatalog(a), existing = catalog.plans.find(p => p.id === r.planId);
        const combinations = creating ? r.snapshot.rows.map(row => ({ productId: row.productId, douyinId: row.douyinId })) : r.snapshot.rows[0].combinations || [];
        const material = { videoId: outputVideoId, assetId: r.assetId, combinations: structuredClone(combinations), uploadedAt: r.updatedAt, rejected: false, materialSelectType: "CUSTOM" as const, daily: [] };
        if (existing) return { ...a, catalog: { ...catalog, plans: catalog.plans.map(p => p.id !== r.planId || p.videoIds.includes(outputVideoId) ? p : {
          ...p, videoIds: [...p.videoIds, outputVideoId], materials: [...(p.materials || []), material],
        }) } };
        if (!creating) return a;
        const plan: AdPlan = { id: r.planId, name: r.planName, target: config?.target, douyinId: r.snapshot.rows[0].douyinId, goal: r.marketingGoal, status: "待同步", optStatus: "UNKNOWN", videoIds: [outputVideoId], targets: structuredClone(r.snapshot.rows), combinations: structuredClone(combinations), associationCoverage: "complete", workbench: config && structuredClone(config), bidding: config?.bidding || "控成本投放", budget: Number(config?.budget), roiTarget: Number(config?.roi), createdAt: r.planHandledAt || r.updatedAt, materials: [material] };
        return { ...a, catalog: { ...catalog, plans: [...catalog.plans, plan] } };
      });
      result = { ...r, applied: true, planHandledAt: r.planHandledAt || time, logs: [...r.logs, { time, text: creating && r.planResult === "创建成功" ? "新计划已加入账户计划列表" : "视频追加成功，保留计划原投放状态" }] };
    }
    if (creating) {
      // Apply a new acknowledgement once; historical success cannot undo a later pause.
      if (result.status !== "已取消" && result.enableResult === "请求成功" && result.enableApplied === false) {
        accounts = accounts.map(a => {
          if (a.id !== r.accountId || a.platform !== r.platform) return a;
          const catalog = adCatalog(a), plan = catalog.plans.find(p => p.id === r.planId);
          if (!plan || plan.optStatus === "ENABLE") return a;
          return { ...a, catalog: { ...catalog, plans: catalog.plans.map(p => p.id === r.planId ? { ...p, optStatus: "ENABLE" as const } : p) } };
        });
        result = { ...result, enableApplied: true };
      }
      return result;
    }
    if (!config || config.removal === "不移除" || ["移除成功", "已保留"].includes(result.removalResult || "") || !["推送成功", "待确认"].includes(result.status)) return result;
    const account = accounts.find(a => a.id === r.accountId && a.platform === r.platform);
    const currentPlan = account && adCatalog(account).plans.find(p => p.id === r.planId);
    const selected = currentPlan ? selectedPlanCombinations(currentPlan, r.snapshot.rows[0]) : [];
    const feedbackReady = hasConfirmedAdMaterial(result, now) && Boolean(currentPlan?.videoIds.includes(outputVideoId) && selected.length && validPlanSelection(currentPlan, r.snapshot.rows[0]) &&
      selected.every(combination => currentPlan.materials?.some(material => material.videoId === outputVideoId && material.assetId === result.assetId && material.combinations?.some(c => combinationKey(c) === combinationKey(combination)))));
    const criteriaReady = config.removal === "移除指定素材ID";
    const scope = criteriaReady ? materialRemovalScope(currentPlan, result, config) : { removable: new Set<string>(), retained: [] };
    const protectedOnly = criteriaReady && scope.retained.length > 0 && !scope.removable.size;
    const canRemove = feedbackReady && criteriaReady && !protectedOnly;
    let removed = 0;
    const removalFailure = canRemove && (!account || !canUseAdAccount(account))
      ? "账户不可用，旧视频未移除"
      : canRemove && result.simulationFailure?.step === "remove" ? result.simulationFailure.message : "";
    if (canRemove && !removalFailure) accounts = accounts.map(a => {
      if (a.id !== r.accountId || a.platform !== r.platform) return a;
      const catalog = adCatalog(a);
      return { ...a, catalog: { ...catalog, plans: catalog.plans.map(p => {
        if (p.id !== r.planId) return p;
        const removalIds = new Set((p.materials || []).filter(m => scope.removable.has(m.assetId)).map(m => m.videoId));
        removed = removalIds.size;
        return { ...p, videoIds: p.videoIds.filter(id => !removalIds.has(id)), materials: p.materials?.filter(m => !removalIds.has(m.videoId)) };
      }) } };
    });
    const removalResult = protectedOnly ? "已保留" : !canRemove ? "待确认" : removalFailure ? "移除失败" : scope.retained.length ? "已保留" : "移除成功";
    const materialReview = feedbackReady ? "审核通过" : "待确认";
    const removalReason = protectedOnly ? scope.retained.join("；") : !feedbackReady ? "新视频的目标关联、审核或可投状态尚未确认，保留全部旧视频" : !criteriaReady ? "旧视频筛选依据尚未确认，保留全部旧视频" : removalFailure || (scope.retained.length ? `移除 ${removed} 个旧视频，其余已保留：${scope.retained.join("；")}` : "");
    if (result.removalResult === removalResult && result.materialReview === materialReview && result.removalReason === removalReason) return result;
    return { ...result, removalResult, removalReason, status: protectedOnly ? "推送成功" : !canRemove ? "待确认" : removalFailure ? "推送失败" : "推送成功", materialReview, failureReason: removalFailure, updatedAt: time,
      logs: [...result.logs, { time, text: removalReason ? `已追加；${removalReason}` : `已确认新视频审核通过且可投，匹配移除 ${removed} 个自选旧视频` }],
    } satisfies AdPushRecord;
  });
  return applied.some((r, i) => r !== store.records[i]) || accounts.some((a, i) => a !== store.accounts[i]) ? { ...store, records: applied, accounts } : store;
}
