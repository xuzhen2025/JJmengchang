import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));

const defaultFields = [
  "视频数量", "消耗", "roi", "成交金额", "智能优惠券", "电商平台补贴金额", "转化数", "转化率",
  "转化成本", "展示数", "平均千次展现费用", "点击数", "点击率", "平均点击单价", "播放量",
  "3S完播率", "净成交金额", "净成交订单数", "净成交ROI", "净成交订单成本",
];

try {
  await mkdir("tmp/tag-column-settings", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-ad_delivery").click();
  await page.getByRole("button", { name: "标签分析", exact: true }).click();

  const table = page.getByTestId("tag-analytics-detail-table");
  const columnButton = page.getByTitle("列设置");
  const headers = async () => table.getByRole("columnheader").allTextContents();
  await expect(columnButton.locator("svg.lucide-settings-2")).toBeVisible();
  assert.deepEqual(await headers(), ["模特姓名 / 标签", ...defaultFields]);

  await columnButton.click();
  await expect(columnButton).toHaveAttribute("aria-expanded", "true");
  let settings = page.getByText("自定义字段(可拖动排序)").locator("../..");
  await expect(settings.locator('[draggable="true"]')).toHaveCount(defaultFields.length);
  await settings.getByText("净成交订单成本", { exact: true }).locator("..").getByRole("checkbox").uncheck();
  await page.keyboard.press("Escape");
  await expect(table.getByRole("columnheader", { name: "净成交订单成本", exact: true })).toHaveCount(0);
  await expect(table.locator("tbody tr").first().locator("td")).toHaveCount(defaultFields.length);

  await columnButton.click();
  settings = page.getByText("自定义字段(可拖动排序)").locator("../..");
  await settings.getByRole("button", { name: "重置", exact: true }).click();
  const source = settings.locator('[draggable="true"]').filter({ hasText: "消耗" });
  const target = settings.locator('[draggable="true"]').filter({ hasText: "视频数量" });
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  await source.dragTo(target);
  await expect(settings.locator('[draggable="true"]').first()).toContainText("消耗");
  await page.keyboard.press("Escape");
  assert.deepEqual(await headers(), ["模特姓名 / 标签", "消耗", "视频数量", ...defaultFields.slice(2)]);

  await columnButton.click();
  settings = page.getByText("自定义字段(可拖动排序)").locator("../..");
  await settings.getByRole("button", { name: "重置", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.deepEqual(await headers(), ["模特姓名 / 标签", ...defaultFields]);
  await page.screenshot({ path: "tmp/tag-column-settings/result.png", fullPage: true, animations: "disabled" });
  assert.deepEqual(errors, []);
  console.log("PASS: tag detail columns share the settings icon, visibility, drag ordering, reset and popover behavior.");
} catch (error) {
  await page.screenshot({ path: "tmp/tag-column-settings/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
