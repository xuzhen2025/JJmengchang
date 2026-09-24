import test from "node:test";
import assert from "node:assert/strict";
import { creditLimitsForUser, creditUsage, remainingQuota, type CreditQuotaSettings } from "../src/lib/creditQuota";
import type { CreditTransaction } from "../src/types";

const settings: CreditQuotaSettings = {
  globalDailyLimit: "300",
  globalMonthlyLimit: "10000",
  customConfigs: [{
    id: "custom",
    name: "个人规则",
    dailyLimit: "800",
    monthlyLimit: "15000",
    applicableUser: "测试用户",
    creator: "管理员",
    enabled: true,
    createdAt: "2026-09-24 10:00:00",
  }],
};

test("personal quota uses enabled custom rules and otherwise falls back to global limits", () => {
  assert.deepEqual(creditLimitsForUser(settings, "徐振"), { dailyLimit: 300, monthlyLimit: 10000 });
  assert.deepEqual(creditLimitsForUser(settings, "测试用户"), { dailyLimit: 800, monthlyLimit: 15000 });
});

test("daily and monthly usage include consumption and offset refunds", () => {
  const transactions: CreditTransaction[] = [
    { id: "1", type: "consume", amount: -120, time: "2026-09-24 09:00:00" },
    { id: "2", type: "refund", amount: 20, time: "2026-09-24 10:00:00" },
    { id: "3", type: "consume", amount: -80, time: "2026-09-20 11:00:00" },
    { id: "4", type: "consume", amount: -50, time: "2026-08-31 11:00:00" },
    { id: "5", type: "recharge", amount: 500, time: "2026-09-24 12:00:00" },
  ];
  assert.deepEqual(creditUsage(transactions, new Date(2026, 8, 24, 12)), { dailyUsed: 100, monthlyUsed: 180 });
  assert.equal(remainingQuota(300, 100), 200);
  assert.equal(remainingQuota(0, 100), Number.POSITIVE_INFINITY);
});
