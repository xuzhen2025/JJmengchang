import type { CreditTransaction } from "../types";

export interface CreditQuotaRule {
  id: string;
  name: string;
  dailyLimit: string;
  monthlyLimit: string;
  applicableUser: string;
  creator: string;
  enabled: boolean;
  createdAt: string;
}

export interface CreditQuotaSettings {
  globalDailyLimit: string;
  globalMonthlyLimit: string;
  customConfigs: CreditQuotaRule[];
}

const STORAGE_KEY = "mengchang_credit_quota_settings";
const CHANGE_EVENT = "mengchang-credit-quota-change";

export const DEFAULT_CREDIT_QUOTA_SETTINGS: CreditQuotaSettings = {
  globalDailyLimit: "300",
  globalMonthlyLimit: "10000",
  customConfigs: [
    {
      id: "cc_1",
      name: "VIP高配额模组",
      dailyLimit: "3000",
      monthlyLimit: "0",
      applicableUser: "梁靖淇",
      creator: "系统管理员",
      enabled: true,
      createdAt: "2026-04-22 17:00:12",
    },
    {
      id: "cc_2",
      name: "电商1组专项额度",
      dailyLimit: "1000",
      monthlyLimit: "20000",
      applicableUser: "张小花",
      creator: "系统管理员",
      enabled: true,
      createdAt: "2026-05-10 10:15:30",
    },
  ],
};

const cloneDefaults = () => structuredClone(DEFAULT_CREDIT_QUOTA_SETTINGS);
const validLimit = (value: unknown, fallback: string) => {
  const normalized = String(value ?? "").trim();
  return normalized !== "" && Number.isFinite(Number(normalized)) && Number(normalized) >= 0 ? normalized : fallback;
};

export function readCreditQuotaSettings(): CreditQuotaSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return cloneDefaults();
    const parsed = JSON.parse(stored) as Partial<CreditQuotaSettings>;
    return {
      globalDailyLimit: validLimit(parsed.globalDailyLimit, DEFAULT_CREDIT_QUOTA_SETTINGS.globalDailyLimit),
      globalMonthlyLimit: validLimit(parsed.globalMonthlyLimit, DEFAULT_CREDIT_QUOTA_SETTINGS.globalMonthlyLimit),
      customConfigs: Array.isArray(parsed.customConfigs) ? parsed.customConfigs : cloneDefaults().customConfigs,
    };
  } catch {
    return cloneDefaults();
  }
}

export function saveCreditQuotaSettings(settings: CreditQuotaSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeCreditQuotaSettings(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function creditLimitsForUser(settings: CreditQuotaSettings, userName: string) {
  const custom = settings.customConfigs.find(rule => rule.enabled && rule.applicableUser === userName);
  return {
    dailyLimit: Math.max(0, Number(custom?.dailyLimit ?? settings.globalDailyLimit) || 0),
    monthlyLimit: Math.max(0, Number(custom?.monthlyLimit ?? settings.globalMonthlyLimit) || 0),
  };
}

export function creditUsage(transactions: CreditTransaction[], now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const month = today.slice(0, 7);
  const netUsed = (items: CreditTransaction[]) => Math.max(0, items.reduce((sum, item) => {
    if (item.type === "consume") return sum + Math.abs(item.amount);
    if (item.type === "refund") return sum - Math.abs(item.amount);
    return sum;
  }, 0));
  return {
    dailyUsed: netUsed(transactions.filter(item => item.time.slice(0, 10) === today)),
    monthlyUsed: netUsed(transactions.filter(item => item.time.slice(0, 7) === month)),
  };
}

export function remainingQuota(limit: number, used: number) {
  return limit > 0 ? Math.max(0, limit - used) : Number.POSITIVE_INFINITY;
}
