import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));

try {
  await mkdir("tmp/tools-view", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });

  const operationItem = page.locator("#sidebar-item-operation_records");
  const toolsItem = page.locator("#sidebar-item-tools");
  await expect(toolsItem).toBeVisible();
  assert.ok(await operationItem.evaluate((operation, tools) => operation.compareDocumentPosition(tools) & Node.DOCUMENT_POSITION_FOLLOWING, await toolsItem.elementHandle()));

  await toolsItem.click();
  await expect(page.getByTestId("tools-view")).toBeVisible();
  await expect(page.getByRole("heading", { name: "工具", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看爆款视频采集", exact: true })).toHaveCount(1);
  await expect(page.getByText("获取抖音爆款电商视频，并同步至第三方管理", { exact: true })).toBeVisible();
  const illustration = page.getByTestId("collector-illustration").first();
  await expect(illustration).toBeVisible();
  const cardBox = await page.getByRole("button", { name: "查看爆款视频采集", exact: true }).boundingBox();
  assert.ok(cardBox && cardBox.width <= 280);

  await page.getByRole("button", { name: "查看爆款视频采集", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "爆款视频采集", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "点击获取", exact: true })).toHaveAttribute("aria-disabled", "true");
  await expect(dialog.getByText("插件使用说明", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "查看使用说明", exact: true })).toHaveAttribute("href", "#");
  await page.screenshot({ path: "tmp/tools-view/desktop.png", fullPage: true, animations: "disabled" });

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.setViewportSize({ width: 430, height: 900 });
  await page.getByRole("button", { name: "查看爆款视频采集", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "爆款视频采集", exact: true })).toBeVisible();
  await page.screenshot({ path: "tmp/tools-view/mobile.png", fullPage: true, animations: "disabled" });

  assert.deepEqual(errors, []);
  console.log("PASS: tools menu, compact plugin card, collector illustration and responsive detail dialog render correctly.");
} catch (error) {
  await page.screenshot({ path: "tmp/tools-view/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
