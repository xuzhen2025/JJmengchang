import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const view = page.getByTestId("material-resource-view");
const cards = view.getByTestId("material-video-card");
const stats = cards.getByTestId("material-video-stats");
const titles = locator => locator.locator(":scope > span").evaluateAll(items => items.map(item => item.title));

try {
  await mkdir("tmp", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();
  assert.deepEqual(await titles(page.getByTestId("finished-video-stats").first()), ["下载次数", "推送次数", "被引用次数"]);

  await button("素材管理").click();
  await expect(view).toHaveAttribute("data-resource-scope", "materials");
  const count = await cards.count();
  assert.ok(count > 0);
  for (let i = 0; i < count; i++) {
    assert.deepEqual(await titles(stats.nth(i)), ["下载次数", "被引用次数"]);
    await expect(stats.nth(i).locator("svg.lucide-download")).toHaveCount(1);
    await expect(stats.nth(i).locator("svg.lucide-copy")).toHaveCount(1);
  }
  const sourceCounts = await page.evaluate(async () => {
    const { INITIAL_FINISHED } = await import("/src/components/MaterialsView.tsx");
    return Object.fromEntries(INITIAL_FINISHED.map(video => [video.id, [video.downloads ?? 0, video.referenceCount ?? video.secondaryCount ?? 0]]));
  });
  for (let i = 0; i < count; i++) {
    const id = await cards.nth(i).getAttribute("data-resource-id");
    assert.deepEqual((await stats.nth(i).locator(":scope > span").allTextContents()).map(Number), sourceCounts[id]);
  }

  await view.getByRole("combobox").filter({ has: page.locator('option[value="下载最多"]') }).selectOption("下载最多");
  const downloads = (await stats.locator('[title="下载次数"]').allTextContents()).map(Number);
  assert.deepEqual(downloads, [...downloads].sort((a, b) => b - a));
  const id = await cards.first().getAttribute("data-resource-id");
  await page.evaluate(async id => {
    const { saveResourceEdits } = await import("/src/lib/useResourceEdits.ts");
    saveResourceEdits("materials", { [id]: { referenceCount: 0 } });
  }, id);
  await expect(view.locator(`[data-resource-id="${id}"]`).getByTitle("被引用次数", { exact: true })).toHaveText("0");

  for (const width of [1920, 1366, 1024]) {
    await page.setViewportSize({ width, height: 1080 });
    await stats.first().scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5);
    for (let i = 0; i < Math.min(count, 6); i++) {
      const row = await stats.nth(i).boundingBox();
      const cover = await stats.nth(i).locator("..").boundingBox();
      assert.ok(row.x >= cover.x && row.x + row.width <= cover.x + cover.width + 1);
      const spans = await stats.nth(i).locator(":scope > span").all();
      const first = await spans[0].boundingBox();
      const second = await spans[1].boundingBox();
      assert.ok(first.x + first.width <= second.x);
    }
    await page.screenshot({ path: `tmp/material-card-stats-${width}.png` });
  }
  await button("第三方管理").click();
  await expect(view).toHaveAttribute("data-resource-scope", "thirdParty");
  assert.deepEqual(await titles(stats.first()), ["剪切/分镜数", "下载次数", "分享转发数"]);
  await button("成片管理").click();
  assert.deepEqual(await titles(page.getByTestId("finished-video-stats").first()), ["下载次数", "推送次数", "被引用次数"]);
  assert.deepEqual(errors, []);
  console.log("PASS: material download/reference counters, source values, explicit zero, download sorting, shared icons, viewport bounds, unchanged finished/third-party cards");
} catch (error) {
  await page.screenshot({ path: "tmp/material-card-stats-failure.png" });
  throw error;
} finally { await browser.close(); }
