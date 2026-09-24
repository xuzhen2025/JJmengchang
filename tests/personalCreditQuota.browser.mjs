import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const playwrightRequire = createRequire("C:/Users/徐振/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js");
const { chromium, expect } = playwrightRequire("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
fs.mkdirSync("tmp/personal-credit-quota", { recursive: true });

try {
  await page.addInitScript(() => {
    localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" }));
    localStorage.removeItem("mengchang_credit_quota_settings");
  });
  await page.goto(process.env.BASE_URL || "http://localhost:3005/", { waitUntil: "domcontentloaded" });

  const sidebarCredits = page.locator("#btn-sidebar-credits");
  await expect(sidebarCredits).toContainText("本日可用积分：");
  await expect(sidebarCredits).toContainText("300.00");
  await sidebarCredits.click();

  const daily = page.getByTestId("daily-credit-limit");
  const monthly = page.getByTestId("monthly-credit-limit");
  await expect(daily).toContainText("本日上限");
  await expect(daily).toContainText("300.00");
  await expect(daily).toContainText("本日可用积分：300.00");
  await expect(monthly).toContainText("本月上限");
  await expect(monthly).toContainText("10,000.00");
  await expect(daily.getByRole("progressbar", { name: "本日积分使用进度" })).toHaveAttribute("aria-valuenow", "0");
  await expect(monthly.getByRole("progressbar", { name: "本月积分使用进度" })).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByText("额外申请积分", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /申请积分|申请补给/ })).toHaveCount(0);
  await page.screenshot({ path: "tmp/personal-credit-quota/default.png", fullPage: true, animations: "disabled" });

  await page.locator("#btn-client-mode-dropdown").click();
  await page.getByRole("button", { name: "管理端", exact: true }).click();
  await page.locator("#sidebar-item-credits_management").click();
  const dailyInput = page.getByText("全员每日生成消耗限制 (积分/天)", { exact: true }).locator("..").getByRole("spinbutton");
  const monthlyInput = page.getByText("全员每月生成消耗限制 (积分/月)", { exact: true }).locator("..").getByRole("spinbutton");
  await dailyInput.fill("450");
  await monthlyInput.fill("12000");
  await page.getByRole("button", { name: "保存全局配置", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("保存成功");

  await page.locator("#btn-client-mode-dropdown").click();
  await page.getByRole("button", { name: "用户端", exact: true }).click();
  await expect(sidebarCredits).toContainText("450.00");
  await expect(daily).toContainText("450.00");
  await expect(monthly).toContainText("12,000.00");
  await page.screenshot({ path: "tmp/personal-credit-quota/updated.png", fullPage: true, animations: "disabled" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("aside > div").last().getByRole("button").last().click();
  await expect(page.locator("aside")).toHaveClass(/w-16/);
  await expect(daily).toBeVisible();
  await expect(monthly).toBeVisible();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: "tmp/personal-credit-quota/mobile.png", fullPage: true, animations: "disabled" });
  assert.deepEqual(errors, []);
  console.log("PASS: personal daily/monthly limits, progress bars, removed applications and shared admin quota settings");
} finally {
  await browser.close();
}
