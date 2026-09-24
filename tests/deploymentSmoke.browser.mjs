import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const url = process.env.PREVIEW_URL || "http://127.0.0.1:4174/mengchang3/";
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(20000);
const errors = [], failedAssets = [];
page.on("pageerror", error => errors.push(error.message));
page.on("response", response => {
  if (response.status() >= 400 && response.url().startsWith(new URL(url).origin)) failedAssets.push(`${response.status()} ${response.url()}`);
});
try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  await page.locator("#sidebar-item-operation_records").click();
  await expect(page.getByRole("tab")).toHaveText(["衍生视频记录", "推送视频记录", "上传文件记录", "导出记录", "下载记录", "登录记录"]);
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await expect(page.locator("tbody img")).toHaveCount(0);
  await page.getByTestId("derivation-row-成功").getByRole("button").click();
  const preview = page.locator('[role="dialog"] video');
  await expect.poll(() => preview.evaluate(video => video.readyState)).toBeGreaterThan(1);
  assert.ok((await preview.getAttribute("src")).startsWith("./assets/"));
  await page.locator('[role="dialog"]').getByRole("button", { name: /^关闭/ }).click();
  for (const name of ["推送视频记录", "上传文件记录", "导出记录", "下载记录", "登录记录"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  }
  await page.getByRole("tab", { name: "衍生视频记录", exact: true }).click();
  await page.screenshot({ path: "tmp/deployment-records.png" });
  await page.locator("#sidebar-item-resources").click();
  await page.getByRole("button", { name: "第三方管理", exact: true }).click();
  await expect(page.getByText("0920-精华液质地展示-品牌供片.mp4", { exact: true })).toBeVisible();
  await page.screenshot({ path: "tmp/deployment-third-party.png" });
  await page.getByRole("button", { name: "成片管理", exact: true }).click();
  await page.getByText("0730-8835-鲁月园-复古耳环动态奢感视频.mp4", { exact: true }).click();
  await page.getByRole("button", { name: "推送广告账户", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "添加推送任务", exact: true })).toBeVisible();
  await expect(page.getByText("仅推送", { exact: true })).toBeVisible();
  await page.screenshot({ path: "tmp/deployment-push.png" });
  await page.getByRole("button", { name: "关闭推送任务", exact: true }).click();
  assert.deepEqual(errors, []);
  assert.deepEqual([...new Set(failedAssets)], []);
  console.log(`PASS deployed prototype: ${url}; six operation tabs, local media preview/download, third-party management and ad push workspace; no same-origin asset errors`);
} catch (error) { await page.screenshot({ path: "tmp/deployment-smoke-failure.png" }); throw error; }
finally { await browser.close(); }
