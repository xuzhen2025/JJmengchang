export const AD_TARGETS = [
  "直播全域",
  "商品全域",
  "直播乘方",
  "商品乘方",
] as const;
export type AdTarget = (typeof AD_TARGETS)[number];
export const targetGoal = (target: AdTarget) =>
  target.startsWith("直播") ? ("推直播间" as const) : ("推商品" as const);
export const adCharacterCount = (value: string) => [...value].reduce((count, character) => count + (/\p{Script=Han}/u.test(character) ? 2 : 1), 0);
export const adToday = (now = new Date()) => now.toLocaleDateString("sv-SE");
export const planNameLimit = (target: AdTarget) => target === "商品全域" ? 100 : undefined;
export const unsupportedRemovalReason = "该移除规则的接口筛选依据尚未确认，暂不可用；请选择不移除或指定素材ID";
export interface AdWorkbenchConfig {
  target: AdTarget;
  operation: "append" | "create";
  distribution: "全部使用" | "平均分配";
  removal: "不移除" | "移除指定素材ID" | "移除低数据视频" | "移除卡审视频";
  removeIds: string;
  costDays: string;
  costMin: string;
  costMax: string;
  roiDays: string;
  roiMax: string;
  ageDays: string;
  removeRejected: boolean;
  bidding: "控成本投放" | "放量投放";
  budget: string;
  roi: string;
  period: "从今天起长期投放" | "设置开始和结束时间";
  start: string;
  end: string;
  coupon: boolean;
  starMaterial: boolean;
  commission: boolean;
  aigc: boolean;
  titles: string[];
  cardTitle: string;
  cardSellingPoints: string;
  profile: "默认" | "仅单次展示可见" | "主页始终可见";
  grouping: string;
  planName: string;
  suffix: boolean;
  strategy: "全部成功才搭建计划" | "跳过失败的直接搭建";
  videoCount: "全部视频" | "每个计划分配n个视频";
  count: number;
}
export const defaultWorkbench = (): AdWorkbenchConfig => ({
  target: "直播全域",
  operation: "append",
  distribution: "全部使用",
  removal: "不移除",
  removeIds: "",
  costDays: "",
  costMin: "",
  costMax: "",
  roiDays: "",
  roiMax: "",
  ageDays: "",
  removeRejected: false,
  bidding: "控成本投放",
  budget: "",
  roi: "",
  period: "从今天起长期投放",
  start: "",
  end: "",
  coupon: false,
  starMaterial: false,
  commission: false,
  aigc: false,
  titles: [""],
  cardTitle: "",
  cardSellingPoints: "",
  profile: "默认",
  grouping: "一个计划一个商品",
  planName: "",
  suffix: true,
  strategy: "全部成功才搭建计划",
  videoCount: "全部视频",
  count: 1,
});
export const VIDEO_NAME_WORDS = [
  "日期(月日)",
  "日期(年月日)",
  "时间",
  "梦畅AIGC编号",
  "视频标题",
  "视频作者",
  "当前用户姓名",
];
export interface AdPushSettings {
  namingRule: "code_title" | "title_code" | "title_only" | "custom";
  customNaming: string;
  maxPush: number;
  maxDerive: number;
}
const SETTINGS_KEY = "mengchang-ad-push-settings";
export const readAdPushSettings = (): AdPushSettings => {
  try {
    const settings = {
      namingRule: "title_only",
      customNaming: "",
      maxPush: 200,
      maxDerive: 100,
      ...JSON.parse(sessionStorage.getItem(SETTINGS_KEY) || "{}"),
    };
    if (!Number.isSafeInteger(settings.maxDerive) || settings.maxDerive < 1) settings.maxDerive = 100;
    return settings;
  } catch {
    return { namingRule: "title_only", customNaming: "", maxPush: 200, maxDerive: 100 };
  }
};
export function saveAdPushSettings(settings: Omit<AdPushSettings, "maxDerive"> & { maxDerive?: number }) {
  const maxDerive = settings.maxDerive ?? readAdPushSettings().maxDerive;
  if (!Number.isSafeInteger(maxDerive) || maxDerive < 1) throw new Error("同时衍生上限须为大于0的整数");
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, maxDerive }));
  window.dispatchEvent(new Event("mengchang-ad-workflow-change"));
}
export const companyVideoNaming = (settings = readAdPushSettings()) =>
  ({
    code_title: "{梦畅AIGC编号}_{视频标题}",
    title_code: "{视频标题}_{梦畅AIGC编号}",
    title_only: "{视频标题}",
    custom: settings.customNaming,
  })[settings.namingRule];
export function validateWorkbench(c: AdWorkbenchConfig, today = adToday()): string {
  if (c.operation === "create") {
    if (!c.target.startsWith("商品"))
      return "直播营销目标请选择已有计划添加视频";
    const decimal = (value: string) => /^\d+(\.\d{1,2})?$/.test(value);
    if (
      !decimal(c.budget) ||
      !Number.isFinite(Number(c.budget)) || Number(c.budget) <= 0
    )
      return "预算须大于0元，最多两位小数；账户实际限额以千川校验为准";
    if (
      c.bidding === "控成本投放" &&
      (!decimal(c.roi) || !Number.isFinite(Number(c.roi)) || Number(c.roi) <= 0)
    )
      return "ROI目标须大于0，最多两位小数";
    if (c.target === "商品乘方" && c.bidding !== "控成本投放")
      return "商品乘方仅支持控成本投放";
    if (
      c.period === "设置开始和结束时间" &&
      (![c.start, c.end].every(value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value) || c.start < today || c.end < c.start)
    )
      return "请设置有效的投放起止日期，开始日期不得早于当天，结束日期不得早于开始日期";
    if (
      !c.titles.length ||
      c.titles.length > 30 ||
      c.titles.some((t) => adCharacterCount(t.trim()) < 10 || adCharacterCount(t.trim()) > 110)
    )
      return "创意标题须为10至110个字符，汉字按2个字符计算，最多30条";
    if (!c.planName.trim()) return "请输入计划名称";
    if (c.cardTitle || c.cardSellingPoints) return "推广卡片写入字段尚未确认，请清除历史卡片配置后提交";
  }
  if (c.operation === "append" && ["移除低数据视频", "移除卡审视频"].includes(c.removal)) return unsupportedRemovalReason;
  if (
    c.operation === "append" &&
    c.removal === "移除指定素材ID" &&
    !c.removeIds.trim()
  )
    return "请输入需要移除的视频素材ID";
  if (c.operation === "append" && c.removal === "移除低数据视频") {
    if (
      ![c.costDays, c.roiDays].every(
        (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      )
    )
      return "请填写消耗和ROI的统计天数";
    if (
      ![c.costMin, c.costMax, c.roiMax].every(
        (v) => v.trim() && Number.isFinite(Number(v)) && Number(v) >= 0,
      ) ||
      Number(c.costMin) > Number(c.costMax)
    )
      return "请填写有效的消耗范围和ROI上限";
    if (
      c.ageDays &&
      (!Number.isInteger(Number(c.ageDays)) || Number(c.ageDays) < 0)
    )
      return "上传天数需为非负整数";
  }
  return "";
}
