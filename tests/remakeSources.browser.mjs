import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const modal = page.locator('[data-overlay-layer="modal"]').filter({ has: button("确认选择") });
const rows = modal.locator("tbody tr[aria-selected]");
const thirdParty = () => modal.getByRole("button", { name: "第三方管理", exact: true }).click();
const pickerSearch = modal.getByPlaceholder("搜索文件名称或 ID");
const queue = page.locator('[data-overlay-layer="drawer"][role="complementary"]');
const savedSources = () => page.evaluate(() => Object.entries(localStorage)
  .filter(([key]) => key.startsWith("mengchang_remake_"))
  .map(([key, value]) => ({ key, ...JSON.parse(value) })));

try {
  await mkdir("tmp/remake-sources", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await button("历史任务").click();
  await expect(queue.locator("article")).toHaveCount(6);
  await expect(queue.getByRole("button", { name: "全部任务", exact: true })).toHaveCount(0);
  await page.getByTitle("收起任务队列").click();
  await page.screenshot({ path: "tmp/remake-sources/history-entry.png" });
  await page.getByRole("button", { name: /选择一个原视频/ }).click();
  await expect(modal).toBeVisible();
  const tabs = modal.getByRole("button").filter({ hasText: /^(成片管理|素材管理|第三方管理)$/ });
  assert.deepEqual(await tabs.allTextContents(), ["成片管理", "素材管理", "第三方管理"]);
  await thirdParty();
  await expect(rows).toHaveCount(6);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-overlay-layer="modal"] tbody img')].every(img => img.complete && img.naturalWidth > 0));
  await modal.screenshot({ path: "tmp/remake-sources/third-party-desktop.png" });

  await pickerSearch.fill("310332003");
  await expect(rows).toHaveCount(1);
  await rows.first().click();
  await pickerSearch.fill("");
  await rows.nth(1).click();
  await expect(rows.filter({ has: page.locator('span.bg-violet-600') })).toHaveCount(1);
  await expect(modal.getByText("已选择 1 个视频", { exact: true })).toBeVisible();

  const filters = modal.locator("select");
  await filters.nth(0).selectOption("美妆");
  await expect(rows).toHaveCount(2);
  await filters.nth(1).selectOption("美妆原片");
  await expect(rows).toHaveCount(1);
  await filters.nth(0).selectOption("服饰内衣");
  await expect(filters.nth(1)).toHaveValue("全部二级分类");
  await expect(rows).toHaveCount(3);
  await filters.nth(3).selectOption("待审核");
  await expect(rows).toHaveCount(1);
  await modal.getByRole("checkbox", { name: "仅看我的" }).check();
  await expect(modal.getByText("暂无符合条件的视频", { exact: true })).toBeVisible();
  await modal.getByRole("button", { name: "成片管理", exact: true }).click();
  await thirdParty();
  await expect(rows).toHaveCount(6);
  await expect(filters.nth(0)).toHaveValue("全部一级分类");
  await filters.nth(2).selectOption("商品展示");
  await expect(rows).toHaveCount(6);
  await filters.nth(4).selectOption("徐振");
  await expect(rows).toHaveCount(3);
  await filters.nth(4).selectOption("全部上传人");

  await page.evaluate(async () => {
    const { saveResourceEdits } = await import("/src/lib/useResourceEdits.ts");
    saveResourceEdits("thirdParty", { "third-party-1": { title: "edited-third-party.mp4", tags: ["产品实拍"], status: "待审核" } });
  });
  await filters.nth(2).selectOption("全部标签");
  await rows.filter({ hasText: "edited-third-party.mp4" }).click();
  await button("确认选择").click();
  await expect(button("开始解析")).toBeEnabled();
  let saved = (await savedSources()).find(state => state.source?.id === "third-party-1");
  assert.equal(saved.source.section, "第三方");
  assert.equal(saved.source.name, "edited-third-party.mp4");
  assert.equal(saved.source.url, "./assets/viral-gallery/serum.mp4");
  assert.equal(saved.step, "source");
  assert.equal(saved.spentCredits, 0);
  await button("历史任务").click();
  await expect(queue).toBeVisible();
  await page.getByTitle("收起任务队列").click();
  assert.deepEqual((await savedSources()).find(state => state.key === saved.key).source, saved.source);

  await button("重选视频").click();
  await expect(modal.getByRole("button", { name: "第三方管理", exact: true })).toHaveClass(/text-violet-700/);
  await expect(modal.locator('tr[aria-selected="true"]')).toContainText("edited-third-party.mp4");
  await page.evaluate(async () => {
    const { changeThirdPartyLifecycle } = await import("/src/lib/thirdPartyLifecycle.ts");
    changeThirdPartyLifecycle(["third-party-1"], "trash");
  });
  await expect(rows).toHaveCount(5);
  await expect(button("确认选择")).toBeDisabled();
  await page.evaluate(async () => {
    const { changeThirdPartyLifecycle } = await import("/src/lib/thirdPartyLifecycle.ts");
    changeThirdPartyLifecycle(["third-party-1"], "active");
  });
  await expect(rows).toHaveCount(6);

  const publishedId = await page.evaluate(async () => {
    const { publishResources } = await import("/src/lib/resourceUploads.ts");
    return publishResources({ partition: "第三方", primaryCategory: "美妆", secondaryCategory: "特写质感镜头", publicTags: ["产品实拍"], personalTags: [], files: [{ name: "published-third-party.mp4", url: "./assets/viral-gallery/serum.mp4", coverUrl: "./assets/viral-gallery/serum.jpg", size: 680000 }] }).resources[0].id;
  });
  await expect(rows).toHaveCount(7);
  await rows.filter({ hasText: "published-third-party.mp4" }).click();
  await page.setViewportSize({ width: 430, height: 900 });
  const modalBox = await modal.boundingBox();
  assert.ok(modalBox.x >= 0 && modalBox.x + modalBox.width <= 430);
  await expect(modal.getByRole("button", { name: "第三方管理", exact: true })).toBeVisible();
  await page.screenshot({ path: "tmp/remake-sources/third-party-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await button("确认选择").click();
  saved = (await savedSources()).find(state => state.source?.id === publishedId);
  assert.ok(saved);
  await button("开始解析").click();
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).step === "subjects", saved.key);
  await button("历史任务").click();
  await expect(queue.locator("article").filter({ hasText: "published-third-party" })).toHaveCount(1);
  await page.getByTitle("收起任务队列").click();

  await page.locator("#sidebar-item-resources").click();
  await button("第三方管理").click();
  await expect(page.getByText("published-third-party.mp4", { exact: true })).toBeVisible();
  await expect(page.getByText("edited-third-party.mp4", { exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  console.log("PASS: third-party shared resources, filters, single selection, edits/uploads/trash, reselect, remake analysis, history entry and responsive layout.");
} catch (error) {
  await page.screenshot({ path: "tmp/remake-sources/failure.png" });
  throw error;
} finally {
  await browser.close();
}
