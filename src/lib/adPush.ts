import { INITIAL_AD_ACCOUNTS, INITIAL_AD_GROUPS } from "../data/adAccounts";
import { DERIVATION_PERMISSION, canUseDerivations, requireDerivationPermission } from "./derivationPermissions";
import { readReportOrganization } from "./analyticsOrganization";
import { readAdPushSettings, targetGoal, validateWorkbench, type AdWorkbenchConfig } from "./adPushConfig";
import { activeDerivationCount, derivationCount, derivationOutput, syncPushDerivations, validateDerivationCount, DERIVATION_TIME_MS, type DerivationOptions } from "./videoDerivation";

export const AD_STORE_KEY = "mengchang-ad-workflow-v2";
export const AD_CHANGE_EVENT = "mengchang-ad-workflow-change";
export const AD_PLATFORMS = ["巨量千川", "巨量广告", "巨量本地推", "磁力智投", "磁力金牛", "腾讯ADQ", "淘宝超级短视频", "百度营销", "抖音号作品", "TikTok for Business", "TikTok Video", "快手号作品", "Bilibili", "小红书聚光", "小红书乘风", "Bilibili三连推广", "TikTok"];
export type MarketingGoal = "推商品" | "推直播间";
export type PushMethod = "push" | "plan" | "full_domain";
export type AdPushStatus = "待处理" | "衍生中" | "推送中" | "审核中" | "创建计划中" | "推送成功" | "推送失败" | "已取消";
export interface AdAccount {
  id: string; name: string; platform: string; status: "authorized" | "expired";
  category: string; group: string; user: string; remark: string; isStarred: boolean;
  authorizedBy?: string; revoked?: boolean; syncedAt?: string; syncError?: string; catalog?: AdCatalog;
}
export interface AdAccountGroup { id: string; name: string; platform: string; viewTeam: string; viewGroup: string; viewUsers: string[]; accountIds: string[]; }
export interface AdActor { id: string; name: string; team: string; group: string; categories: string[]; permissions: string[]; }
export interface AdParameters {
  scene: string; newcomer: string; adType: string; promotion: string; coupon: boolean;
  budget: number; bid: number; optimization: string; period: string;
}
export const DEFAULT_AD_PARAMETERS: AdParameters = { scene: "日常销售", newcomer: "店铺新客", adType: "通投广告", promotion: "托管", coupon: false, budget: 300, bid: 2, optimization: "成交", period: "7天" };
export interface AdTemplate { id: string; name: string; scope: "个人模板" | "公司模板"; ownerId: string; platform: string; goal: MarketingGoal; naming: string; suffix: string; params: AdParameters; workbench?: AdWorkbenchConfig; }
export interface DeliveryRow { id: string; accountId: string; douyinId: string; productId: string; storeId: string; planId: string; }
export interface AdVideo { id: string; title: string; coverUrl?: string; videoUrl?: string; author?: string; editedAt?: string; derivativeId?: string; }
export interface AdDraft { platform: string; method: PushMethod; goal: MarketingGoal; rows: DeliveryRow[]; templateIds: string[]; version: "原片" | "转码后视频"; naming: string; scheduledAt: string; creative: "单创意" | "多创意"; successStatus?: string; workbench?: AdWorkbenchConfig; derivation?: DerivationOptions; }
export interface AdPushRecord {
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
const QC = "288194018274011";
export function createAdStore(): AdStore {
  const accounts: AdAccount[] = INITIAL_AD_ACCOUNTS.map(a => ({ ...a, authorizedBy: "徐振" }));
  accounts.push(...[3, 4, 5].map((n): AdAccount => ({ id: QC + n, name: ["梦畅美妆旗舰店-千川主账户", "悦己珠宝直播间-千川账户", "轻氧服饰直营-千川账户"][n - 3], platform: "巨量千川", status: n === 5 ? "expired" : "authorized", category: "千川引流", group: "千川第一组", user: "徐振", authorizedBy: "徐振", remark: n === 5 ? "授权已过期" : "", isStarred: n === 3 })));
  const store: AdStore = { accounts, groups: [...INITIAL_AD_GROUPS, { id: "AG-QC", platform: "巨量千川", name: "千川运营账户", viewTeam: "", viewGroup: "", viewUsers: [], accountIds: accounts.filter(a => a.platform === "巨量千川").map(a => a.id) }], templates: [], records: [], visibility: "all", sequence: 0 };
  const template: AdTemplate = { id: "template-qc-demo", name: "千川日常销售", ownerId: "chaojiguanliyuan", scope: "公司模板", platform: "巨量千川", goal: "推商品", naming: "{日期(月日)}_{模板名称}", suffix: "_20260909_001", params: { ...DEFAULT_AD_PARAMETERS } };
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
  try { session = JSON.parse(localStorage.getItem("mengchang_prototype_session") || "{}"); roles = JSON.parse(localStorage.getItem("cloud_video_roles_v2") || "[]"); } catch { /* Use a fail-closed session below. */ }
  const admin = session.username === "chaojiguanliyuan" || session.username === "guanliyuan";
  const role = roles.find(r => r.id === (admin ? "role_super_admin" : "role_staff"));
  const permissions = admin
    ? [...new Set([...(role?.checkedKeys || []), "uc_ad_push", "uc_ad_plan_manage", DERIVATION_PERMISSION, "ab_ad_group_manage", "ab_system_setting_manage"])]
    : role?.enabled === false ? [] : role?.checkedKeys || [];
  return { id: session.username || "anonymous", name: admin ? "徐振" : "普通用户", team: "电商事业部", group: "千川第一组", categories: ["千川引流"], permissions };
}
export function canSeeAdAccount(account: AdAccount, store: AdStore, actor: AdActor): boolean {
  const personal = account.authorizedBy === actor.name || account.user === actor.name;
  const systemAllows = store.visibility === "all" || (store.visibility === "personal" && personal) || (store.visibility === "group" && (personal || account.group === actor.group)) || (store.visibility === "category" && actor.categories.includes(account.category));
  const groups = store.groups.filter(g => g.platform === account.platform && g.accountIds.includes(account.id));
  const groupAllows = groups.length ? groups.some(g => (!g.viewTeam && !g.viewGroup && !g.viewUsers.length) || g.viewTeam === actor.team || g.viewGroup === actor.group || g.viewUsers.includes(actor.name)) : personal;
  return systemAllows && groupAllows;
}
export function visibleAdAccounts(store: AdStore, actor: AdActor) { return store.accounts.filter(a => canSeeAdAccount(a, store, actor)); }
export function visibleAdRecords(store: AdStore, actor: AdActor, videoId: string) {
  const ids = new Set(visibleAdAccounts(store, actor).map(a => `${a.platform}:${a.id}`));
  return store.records.filter(r => r.videoId === videoId && ids.has(`${r.platform}:${r.accountId}`));
}

export interface AdCatalog {
  douyins: { id: string; name: string }[];
  stores: { id: string; name: string; douyinIds: string[] }[];
  products: { id: string; name: string; storeId: string }[];
  plans: AdPlan[];
}
export interface AdPlan {
  id: string; name: string; douyinId: string; goal: MarketingGoal; status: string; videoIds: string[];
  bidding?: AdWorkbenchConfig["bidding"]; cost?: number; roi?: number; revenue?: number; createdAt?: string; budget?: number;
  roiTarget?: number; workbench?: AdWorkbenchConfig; targets?: DeliveryRow[];
  materials?: { videoId: string; assetId: string; uploadedAt: string; rejected: boolean; daily: { date: string; cost: number; revenue: number }[] }[];
}
// Account-scoped fixtures stand in for platform synchronization, never a global option list.
export function adCatalog(account: AdAccount): AdCatalog {
  if (account.catalog) return account.catalog;
  const id = account.id;
  const douyins = [1, 2].map(n => ({ id: `${id}-dy${n}`, name: `${account.name.split("-")[0]} · 抖音号${n}` }));
  const stores = [1, 2].map(n => ({ id: `${id}-store${n}`, name: `旗舰店${n} (${id.slice(-4)})`, douyinIds: douyins.map(d => d.id) }));
  return { douyins, stores, products: stores.flatMap(s => [1, 2].map(n => ({ id: `${s.id}-p${n}`, name: n === 1 ? "ELL卸妆油" : "复古耳环", storeId: s.id }))), plans: douyins.flatMap((d, i) => (["推商品", "推直播间"] as MarketingGoal[]).map((goal, j) => ({ id: `${d.id}-${goal}`, name: `${goal === "推商品" ? "商品" : "直播"}日常推广计划 (${d.id.slice(-5)})`, douyinId: d.id, goal, status: i ? "已暂停" : "投放中", videoIds: ["existing-video"], bidding: i ? "放量投放" : "控成本投放", budget: i ? 1000 : 600, roiTarget: 2.5, cost: 1268.5 + i * 350 + j * 123, roi: 2.68, revenue: Math.round((1268.5 + i * 350 + j * 123) * 2.68 * 100) / 100, createdAt: `2026-09-${12 + i + j} 09:30:00`, materials: [{ videoId: "existing-video", assetId: `${id}-material-${i + 1}-${j + 1}`, uploadedAt: "2026-09-01", rejected: i === 1, daily: Array.from({ length: 30 }, (_, day) => ({ date: adDate(new Date(Date.now() - day * 86400000)).slice(0, 10), cost: 12.5, revenue: 18.75 })) }] }))) };
}
export const PLAN_WORDS = ["日期(月日)", "日期(年月日)", "当前时间", "剪辑时间", "推广方式", "转化目标", "优化周期", "模板名称", "视频名称", "视频作者", "抖音号名称", "创建日期", "创建时间", "商品名称", "整体支付ROI目标", "梦畅AIGC编号"];
export function resolveAdName(pattern: string, video: AdVideo, actor: AdActor, template?: AdTemplate, row?: DeliveryRow, account?: AdAccount, now = new Date()): string {
  const date = adDate(now), catalog = account && adCatalog(account);
  const values: Record<string, string> = { "日期(月日)": date.slice(5, 10).replace("-", ""), "日期(年月日)": date.slice(0, 10).replaceAll("-", ""), "当前时间": date.slice(11).replaceAll(":", ""), "剪辑时间": video.editedAt || date.slice(0, 10), "推广方式": template?.params.promotion || "托管", "转化目标": template?.params.optimization || "成交", "优化周期": template?.params.period || "7天", "模板名称": template?.name || "模板", "视频名称": video.title, "视频作者": video.author || actor.name, "抖音号名称": catalog?.douyins.find(d => d.id === row?.douyinId)?.name || "示例抖音号", "视频ID": video.id, "当前用户姓名": actor.name };
  Object.assign(values, { "创建日期": date.slice(0, 10).replaceAll("-", ""), "创建时间": date.slice(11).replaceAll(":", ""), "时间": date.slice(11).replaceAll(":", ""), "视频标题": video.title, "梦畅AIGC编号": video.id, "商品名称": catalog?.products.find(p => p.id === row?.productId)?.name || "商品", "整体支付ROI目标": String(template?.params.bid || "") });
  Object.assign(values, { "衍生编号": video.derivativeId || "", "原片/转码/衍生编号": video.derivativeId || video.id });
  return pattern.replace(/\{([^{}]+)\}/g, (match, key) => values[key] ?? match);
}
export const nameWidth = (text: string) => [...text].reduce((n, c) => n + (c.charCodeAt(0) > 127 ? 2 : 1), 0);
export function validateAdTemplate(template: AdTemplate): string {
  if (!template.name.trim()) return "请输入模板名称";
  if (!PLAN_WORDS.some(w => template.naming.includes(`{${w}}`))) return "至少添加一个动态词包后才能保存模板";
  const words: string[] = template.naming.match(/\{[^{}]*\}/g) ?? [];
  if (words.some(w => !PLAN_WORDS.includes(w.slice(1, -1)))) return "计划名称包含不支持的动态词包";
  if (!Number.isFinite(template.params.budget) || template.params.budget <= 0 || !Number.isFinite(template.params.bid) || template.params.bid <= 0) return "预算和出价必须大于0";
  return "";
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
    if (!a || !canSeeAdAccount(a, store, actor) || a.status !== "authorized" || a.revoked) return `明细${i + 1}的账户不可用或无操作权限，本次操作无法执行`;
    const c = adCatalog(a);
    if (draft.method !== "push") {
      if (!c.douyins.some(d => d.id === row.douyinId)) return `请补全明细${i + 1}的抖音号`;
      if (creating && (!c.stores.some(s => s.id === row.storeId && s.douyinIds.includes(row.douyinId)) || (draft.goal === "推商品" && !c.products.some(p => p.id === row.productId && p.storeId === row.storeId)))) return `请补全明细${i + 1}的店铺${draft.goal === "推商品" ? "和商品" : ""}`;
      if (draft.method === "full_domain" && !creating && !c.plans.some(p => p.id === row.planId && p.douyinId === row.douyinId && p.goal === draft.goal)) return `请选择明细${i + 1}中当前账户的已有全域计划`;
    }
    const combo = draft.method === "push" ? row.accountId : creating ? `${row.accountId}:${row.douyinId}:${row.storeId}${draft.method === "full_domain" ? `:${row.productId}` : ""}` : `${row.accountId}:${row.planId}`;
    if (combos.has(combo)) return creating ? "同一广告账户的投放组合不能重复" : "请勿重复选择同一推送目标";
    combos.add(combo);
  }
  if (draft.method === "plan" && (!draft.templateIds.length || draft.templateIds.some(id => !store.templates.some(t => t.id === id && t.platform === draft.platform && t.goal === draft.goal && (t.scope === "公司模板" || t.ownerId === actor.id))))) return "请选择适用于当前平台及营销目标的模板";
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
    const key = `${row.accountId}:` + (grouping === "聚合为一条计划" ? "all" : grouping === "每个商品一条计划" || grouping === "一个计划一个商品" ? row.productId : grouping === "每个抖音号一条计划" || grouping === "一个计划多个商品" ? row.douyinId : `${row.productId}:${row.douyinId}`);
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  return [...groups.values()];
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
  if (draft.derivation) {
    if (!["shared", "per_account"].includes(draft.derivation.allocation) || (draft.derivation.allocation === "per_account" && (!Number.isSafeInteger(draft.derivation.count) || draft.derivation.count < 1))) throw new Error("请填写有效的衍生数量");
    const amount = derivationCount(draft.derivation, new Set(draft.rows.map(row => row.accountId)).size);
    const issue = validateDerivationCount(amount, readAdPushSettings().maxDerive, activeDerivationCount(actor.id) + activeAdDerivationCount(store.records, actor.id, now));
    if (issue) throw new Error(issue);
  }
  const taskId = `PUSH-${adId()}`, time = adDate(new Date(now));
  const templates = draft.method === "plan" ? store.templates.filter(t => draft.templateIds.includes(t.id)) : [undefined];
  const copies = draft.derivation?.allocation === "per_account" ? draft.derivation.count : videos.length;
  const groups = groupAdRows(draft);
  const groupedPlans = new Map<string, { id: string; name: string }>();
  return groups.flatMap((rows, groupIndex) => templates.flatMap(template => Array.from({ length: copies }, (_, index) => index)
    .filter(index => {
      if (draft.method !== "full_domain" || draft.workbench?.distribution !== "平均分配") return true;
      const accountGroups = groups.filter(group => group[0].accountId === rows[0].accountId);
      return index % accountGroups.length === accountGroups.indexOf(rows);
    }).map(index => {
    const video = videos[draft.derivation ? 0 : index];
    const row = rows[0], creating = isCreatingAdPlan(draft), config = draft.workbench;
    const account = store.accounts.find(a => a.id === row.accountId && a.platform === draft.platform)!;
    const plan = draft.method === "full_domain" && !creating ? adCatalog(account).plans.find(p => p.id === row.planId) : undefined;
    const id = adId();
    const derivativeId = draft.derivation ? `DER-${taskId.slice(5)}-${draft.derivation.allocation === "shared" ? "shared" : row.accountId}-${index + 1}` : video.derivativeId;
    const inlineTemplate = creating && !template && config ? { params: { ...DEFAULT_AD_PARAMETERS, bid: Number(config.roi) || 0 } } as AdTemplate : undefined;
    const planName = template ? resolveAdName(template.naming, video, actor, template, row, account, new Date(now)) + template.suffix : creating && config ? resolveAdName(config.planName, video, actor, inlineTemplate, row, account, new Date(now)) + (config.suffix ? `_${id.slice(0, 6)}` : "") : plan?.name || "";
    if (creating && nameWidth(planName) > 110) throw new Error("计划名称超出110个字符（汉字按2个字符计算），请缩短名称");
    const groupKey = derivativeId && creating && (draft.method === "full_domain" || draft.creative === "多创意")
      ? `${groupIndex}:${template?.id || "inline"}:${draft.creative === "多创意" && config?.videoCount === "每个计划分配n个视频" ? Math.floor(index / config.count) : 0}` : "";
    if (groupKey && !groupedPlans.has(groupKey)) groupedPlans.set(groupKey, { id: `PLAN-${id}`, name: planName });
    const groupedPlan = groupedPlans.get(groupKey);
    return { id, taskId, derivativeId, sourceVideo: { ...video }, kind: "push_video", videoId: video.id, videoTitle: video.title, platform: draft.platform, accountId: account.id, account: account.name, method: draft.method, marketingGoal: draft.goal, assetId: "", assetName: resolveAdName(draft.naming, { ...video, derivativeId }, actor, undefined, row, account, new Date(now)), planId: groupedPlan?.id || plan?.id || "", planName: groupedPlan?.name || planName, templateName: template?.name || "", status: "待处理", pushStatus: "待处理", materialReview: "未提交", planResult: draft.method === "push" ? "不涉及" : "待处理", planReview: draft.method === "push" ? "不涉及" : "未提交", deliveryStatus: plan?.status || "未创建", failureReason: "", operator: actor.name, operatorId: actor.id, createdAt: time, updatedAt: time, startedAt: draft.scheduledAt ? Date.parse(draft.scheduledAt) : now, snapshot: structuredClone({ ...draft, rows, templateIds: template ? [template.id] : [] }), templateSnapshot: template && structuredClone(template), logs: [{ time, text: draft.derivation ? "衍生并推送任务已提交" : "推送任务已提交" }] } satisfies AdPushRecord;
  })));
}
export const isAdActive = (r: AdPushRecord) => ["待处理", "衍生中", "推送中", "审核中", "创建计划中"].includes(r.status);
export const activeAdDerivationCount = (records: AdPushRecord[], ownerId: string, now = Date.now()) => new Set(records.filter(r => r.operatorId === ownerId && r.snapshot.derivation && r.derivativeId && isAdActive(r) && derivationOutput(r.derivativeId, ownerId)?.status !== "取消衍生" && now < r.startedAt + DERIVATION_TIME_MS).map(r => r.derivativeId)).size;
export function advanceAdRecords(records: AdPushRecord[], accounts: AdAccount[], now = Date.now()): AdPushRecord[] {
  return records.map(r => {
    const output = r.derivativeId && derivationOutput(r.derivativeId);
    if (isAdActive(r) && output && ["取消衍生", "已删除", "失败"].includes(output.status)) return { ...r, status: output.status === "取消衍生" ? "已取消" : "推送失败", failureReason: output.status === "取消衍生" ? "衍生已取消" : "衍生文件不可用", pushStatus: "未推送", updatedAt: adDate(new Date(now)), logs: [...r.logs, { time: adDate(new Date(now)), text: "衍生文件不可用，停止推送" }] } as AdPushRecord;
    if (!isAdActive(r) || now < r.startedAt) return r;
    const age = now - r.startedAt, elapsed = age - (r.snapshot.derivation ? DERIVATION_TIME_MS : 0), a = accounts.find(a => a.id === r.accountId && a.platform === r.platform), creating = isCreatingAdPlan(r.snapshot);
    let status: AdPushStatus = age < 1000 ? "待处理" : elapsed < 0 ? "衍生中" : elapsed < 2500 ? "推送中" : elapsed < 5000 ? "审核中" : r.method !== "push" && elapsed < 7500 ? "创建计划中" : "推送成功";
    const failure = !a || a.status === "expired" || a.revoked ? "账户授权已失效，请由管理员重新授权后重新编辑" : r.method === "full_domain" && !creating && !adCatalog(a).plans.some(p => p.id === r.planId && p.goal === r.marketingGoal) ? "所选计划已不可用，请重新选择" : "";
    if (failure) status = "推送失败";
    if (status === r.status) return r;
    const uploaded = elapsed >= 2500 && !failure, passed = elapsed >= 5000 && !failure, success = status === "推送成功", time = adDate(new Date(now));
    return { ...r, status, updatedAt: time, failureReason: failure, assetId: uploaded ? r.assetId || `MAT-${AD_PLATFORMS.indexOf(r.platform)}-${r.accountId}-${r.derivativeId || r.videoId}-${r.snapshot.version === "原片" ? "O" : "T"}` : r.assetId, pushStatus: uploaded ? "推送成功" : failure && !r.assetId ? "推送失败" : r.assetId ? "推送成功" : status, materialReview: passed ? "审核通过" : uploaded ? "审核中" : r.materialReview, planResult: r.method === "push" ? "不涉及" : success ? creating ? "创建成功" : "追加成功" : failure ? "失败" : passed ? creating ? "创建计划中" : "追加中" : "待处理", planId: success && creating ? r.planId || `PLAN-${r.id}` : r.planId, planReview: r.method === "push" ? "不涉及" : success ? "审核通过" : passed ? "审核中" : r.planReview, deliveryStatus: success && creating ? "已暂停" : r.deliveryStatus, logs: [...r.logs, { time, text: failure || (success && creating ? "计划创建成功，默认暂停" : status) }] };
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
    return { ...current, records: current.records.map(r => ids.includes(r.id) ? { ...r, status: "已取消", pushStatus: "已取消", planResult: r.method === "push" ? "不涉及" : "已取消", updatedAt: adDate(), logs: [...r.logs, { time: adDate(), text: "用户取消待处理任务" }] } : r) };
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
export function retryAdRecords(ids: string[], ownerId?: string): void {
  const { current, targets } = validateOperationRecords(ids, ownerId, record => record.status === "推送失败", "批量重试仅支持推送失败的记录");
  const targetIds = new Set(targets.map(record => record.id));
  const now = Date.now(), time = adDate(new Date(now));
  updateAdStore(() => ({ ...current, records: current.records.map(record => targetIds.has(record.id) ? {
    ...record, status: "待处理", pushStatus: "待处理", materialReview: "未提交",
    planResult: record.method === "push" ? "不涉及" : "待处理", planReview: record.method === "push" ? "不涉及" : "未提交",
    failureReason: "", startedAt: now, updatedAt: time, logs: [...record.logs, { time, text: "用户批量重试推送任务" }],
  } : record) }));
}
export function cancelActiveAdRecords(ids: string[], ownerId?: string): void {
  const { current, targets } = validateOperationRecords(ids, ownerId, isAdActive, "批量取消仅支持进行中的推送记录");
  const targetIds = new Set(targets.map(record => record.id));
  const time = adDate();
  updateAdStore(() => ({ ...current, records: current.records.map(record => targetIds.has(record.id) ? {
    ...record, status: "已取消", pushStatus: "已取消", planResult: record.method === "push" ? "不涉及" : "已取消",
    updatedAt: time, logs: [...record.logs, { time, text: "用户批量取消进行中的推送任务" }],
  } : record) }));
}
export function revokeAdAccounts(ids: string[], platform: string): void {
  if (!getAdActor().permissions.includes("ab_ad_group_manage")) throw new Error("暂无管理广告组权限");
  updateAdStore(store => {
    const records = advanceAdRecords(store.records, store.accounts);
    if (records.some(r => r.platform === platform && ids.includes(r.accountId) && isAdActive(r))) throw new Error("当前账户有进行中的推送任务");
    return { ...store, records, accounts: store.accounts.map(a => a.platform === platform && ids.includes(a.id) ? { ...a, status: "expired", revoked: true } : a) };
  });
}

export function authorizeAdAccount(platform: string, id: string, name: string): void {
  const actor = getAdActor();
  if (!actor.permissions.includes("ab_ad_group_manage")) throw new Error("暂无管理广告组权限");
  if (!id || !name) throw new Error("请选择需要授权的广告账户");
  updateAdStore(store => {
    const existing = store.accounts.find(a => a.platform === platform && a.id === id);
    const account: AdAccount = existing
      ? { ...existing, name, status: "authorized", revoked: false, syncError: "", syncedAt: adDate() }
      : { id, name, platform, status: "authorized", category: "", group: "", user: actor.name, authorizedBy: actor.name, remark: "", isStarred: false, syncedAt: adDate() };
    account.catalog = adCatalog(account);
    return { ...store, accounts: [account, ...store.accounts.filter(a => a.platform !== platform || a.id !== id)] };
  });
}

function shouldRemoveMaterial(material: NonNullable<AdPlan["materials"]>[number], config: AdWorkbenchConfig, now: number): boolean {
  if (config.removal === "移除指定素材ID") return config.removeIds.split(/[，,\s]+/).includes(material.assetId);
  if (config.removal === "移除卡审视频" || config.removal === "移除低数据视频" && config.removeRejected && material.rejected) return material.rejected;
  if (config.removal !== "移除低数据视频") return false;
  const sum = (days: string, field: "cost" | "revenue") => {
    const end = adDate(new Date(now)).slice(0, 10), start = adDate(new Date(now - (Number(days) - 1) * 86400000)).slice(0, 10);
    const samples = material.daily.filter(d => d.date >= start && d.date <= end);
    return new Set(samples.map(d => d.date)).size === Number(days) ? samples.reduce((total, d) => total + d[field], 0) : null;
  };
  const cost = sum(config.costDays, "cost"), roiCost = sum(config.roiDays, "cost"), revenue = sum(config.roiDays, "revenue");
  if (cost === null || roiCost === null || revenue === null || roiCost <= 0) return false;
  return cost >= Number(config.costMin) && cost <= Number(config.costMax) && revenue / roiCost <= Number(config.roiMax) && (!config.ageDays || now - Date.parse(material.uploadedAt) >= Number(config.ageDays) * 86400000);
}

// Apply simulated changes only after success. Existing plan state and source files stay untouched.
export function advanceAdStore(store: AdStore, now = Date.now()): AdStore {
  const records = advanceAdRecords(store.records, store.accounts, now);
  let accounts = store.accounts;
  const applied = records.map(r => {
    if (r.method === "push" || r.status !== "推送成功" || r.applied) return r;
    let removed = 0;
    const outputVideoId = r.derivativeId || r.videoId;
    accounts = accounts.map(a => {
      if (a.id !== r.accountId || a.platform !== r.platform) return a;
      const catalog = adCatalog(a), config = r.method === "plan" ? r.templateSnapshot?.workbench : r.snapshot.workbench;
      if (isCreatingAdPlan(r.snapshot)) {
        if (catalog.plans.some(p => p.id === r.planId)) {
          return { ...a, catalog: { ...catalog, plans: catalog.plans.map(p => p.id !== r.planId || p.videoIds.includes(outputVideoId) ? p : {
            ...p, videoIds: [...p.videoIds, outputVideoId], materials: [...(p.materials || []), { videoId: outputVideoId, assetId: r.assetId, uploadedAt: r.updatedAt, rejected: false, daily: [] }],
          }) } };
        }
        const plan: AdPlan = { id: r.planId, name: r.planName, douyinId: r.snapshot.rows[0].douyinId, goal: r.marketingGoal, status: "已暂停", videoIds: [outputVideoId], targets: structuredClone(r.snapshot.rows), workbench: config && structuredClone(config), bidding: config?.bidding || "控成本投放", budget: r.templateSnapshot?.params.budget ?? Number(config?.budget), roiTarget: r.templateSnapshot?.params.bid ?? Number(config?.roi), cost: 0, revenue: 0, roi: 0, createdAt: r.updatedAt, materials: [{ videoId: outputVideoId, assetId: r.assetId, uploadedAt: r.updatedAt, rejected: false, daily: [] }] };
        return { ...a, catalog: { ...catalog, plans: [...catalog.plans, plan] } };
      }
      return { ...a, catalog: { ...catalog, plans: catalog.plans.map(p => {
        if (p.id !== r.planId) return p;
        const removalIds = new Set(config ? (p.materials || []).filter(m => m.videoId !== outputVideoId && shouldRemoveMaterial(m, config, now)).map(m => m.videoId) : []);
        removed = p.videoIds.filter(id => removalIds.has(id)).length;
        const materials = (p.materials || []).filter(m => !removalIds.has(m.videoId));
        if (!materials.some(m => m.videoId === outputVideoId)) materials.push({ videoId: outputVideoId, assetId: r.assetId, uploadedAt: r.updatedAt, rejected: false, daily: [] });
        return { ...p, videoIds: [...new Set([...p.videoIds.filter(id => !removalIds.has(id)), outputVideoId])], materials };
      }) } };
    });
    return { ...r, applied: true, logs: [...r.logs, { time: adDate(new Date(now)), text: isCreatingAdPlan(r.snapshot) ? "新计划已加入账户计划列表" : `视频追加成功${r.snapshot.workbench?.removal && r.snapshot.workbench.removal !== "不移除" ? `，匹配移除 ${removed} 个旧视频` : ""}，保留计划原投放状态` }] };
  });
  return applied.some((r, i) => r !== store.records[i]) ? { ...store, records: applied, accounts } : store;
}
