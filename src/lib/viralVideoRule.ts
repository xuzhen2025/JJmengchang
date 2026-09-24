export interface ViralVideoRule {
  period: "monthly" | "total";
  thresholdWan: number;
}

export interface VideoSpendMetrics {
  cost?: number;
  monthlyCosts?: Record<string, number>;
}

export const DEFAULT_VIRAL_VIDEO_RULE: ViralVideoRule = { period: "monthly", thresholdWan: 10 };
export const VIRAL_VIDEO_RULE_STORAGE_KEY = "cloud-video-viral-rule-v1";
export const VIRAL_VIDEO_RULE_CHANGE_EVENT = "cloud-video-viral-rule-changed";

const monthFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit" });

export function getVideoSpendMonth(date = new Date()): string {
  const parts = monthFormatter.formatToParts(date);
  return `${parts.find(part => part.type === "year")!.value}-${parts.find(part => part.type === "month")!.value}`;
}

export function isValidViralVideoRule(value: unknown): value is ViralVideoRule {
  if (!value || typeof value !== "object") return false;
  const rule = value as Partial<ViralVideoRule>;
  if (rule.period !== "monthly" && rule.period !== "total") return false;
  if (typeof rule.thresholdWan !== "number" || !Number.isFinite(rule.thresholdWan)) return false;
  const cents = Math.round(rule.thresholdWan * 1_000_000);
  return cents > 0 && Number.isSafeInteger(cents);
}

export function getViralVideoSpend(video: VideoSpendMetrics, rule: Pick<ViralVideoRule, "period">, month: string): number | null {
  const value = rule.period === "monthly" ? video.monthlyCosts?.[month] : video.cost;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function getViralVideoHeat(video: VideoSpendMetrics, month: string): number | null {
  const spend = getViralVideoSpend(video, { period: "monthly" }, month);
  return spend === null ? null : Math.floor(Math.round(spend * 100) / 10_000);
}

export function isViralVideo(video: VideoSpendMetrics, rule: ViralVideoRule, month: string): boolean {
  if (!isValidViralVideoRule(rule)) return false;
  const spend = getViralVideoSpend(video, rule, month);
  // Compare currency in cents, including exact threshold matches.
  return spend !== null && Math.round(spend * 100) >= Math.round(rule.thresholdWan * 1_000_000);
}

export function formatViralVideoRule(rule: ViralVideoRule): string {
  return `${rule.period === "monthly" ? "月消耗" : "总消耗"}达到${rule.thresholdWan}万`;
}

export function loadViralVideoRule(): ViralVideoRule {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(VIRAL_VIDEO_RULE_STORAGE_KEY) || "null");
    if (isValidViralVideoRule(stored)) return { period: stored.period, thresholdWan: stored.thresholdWan };
  } catch { /* An unavailable or invalid prototype setting uses the existing default. */ }
  return { ...DEFAULT_VIRAL_VIDEO_RULE };
}

export function saveViralVideoRule(rule: ViralVideoRule): void {
  if (!isValidViralVideoRule(rule)) throw new Error("请输入有效且大于0的消耗门槛。");
  window.localStorage.setItem(VIRAL_VIDEO_RULE_STORAGE_KEY, JSON.stringify({ period: rule.period, thresholdWan: rule.thresholdWan }));
  window.dispatchEvent(new CustomEvent(VIRAL_VIDEO_RULE_CHANGE_EVENT));
}
