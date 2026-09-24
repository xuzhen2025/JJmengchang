import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const shots = page.getByTestId("shot-reference-list");
const results = page.getByTestId("reference-result-list");
const shotCards = shots.getByTestId("reference-video-card");
const resultCards = results.getByTestId("reference-video-card");

async function popoverBounds() {
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const rect = await menu.locator("..").boundingBox();
  const viewport = page.viewportSize();
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width && rect.y + rect.height <= viewport.height, JSON.stringify(rect));
}

try {
  await mkdir("tmp", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();
  const standard = await page.getByTestId("finished-video-card").first().boundingBox();
  await page.getByText("0730-8835-鲁月园-复古耳环动态奢感视频.mp4", { exact: true }).click();
  await shots.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  await expect(shotCards).toHaveCount(4);
  await expect(shots.getByTestId("reference-usage-duration")).toHaveText(["使用时长 16.7秒", "使用时长 14.3秒", "使用时长 6.3秒", "使用时长 4.3秒"]);
  await expect(shotCards.first()).toContainText("ID: 38945245");
  await expect(shotCards.first()).toContainText("审核通过");
  await expect(shotCards.first().getByTestId("reference-video-stats").locator(":scope > span")).toHaveCount(2);
  assert.deepEqual(await shotCards.first().getByTestId("reference-video-stats").locator(":scope > span").evaluateAll(items => items.map(item => item.title)), ["下载次数", "被引用次数"]);
  await expect(shotCards.first().getByLabel("被引用次数 10", { exact: true })).toHaveCount(1);
  const compact = await shotCards.first().boundingBox();
  const ratio = { width: compact.width / standard.width, height: (compact.height - 20) / standard.height };
  assert.ok(ratio.width > 0.6 && ratio.width < 0.73, JSON.stringify(ratio));
  assert.ok(ratio.height > 0.6 && ratio.height < 0.78, JSON.stringify(ratio));
  const cover = await shotCards.first().locator(".reference-video-cover").boundingBox();
  assert.ok(Math.abs(cover.width / cover.height - 0.75) < 0.01);
  await expect.poll(() => shotCards.locator(".reference-video-cover img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), { timeout: 30000 }).toBe(true);
  await shots.screenshot({ path: "tmp/reference-cards-shots.png" });

  await shotCards.first().hover();
  const media = shotCards.first().locator("video");
  await expect.poll(() => media.evaluate(video => video.currentTime)).toBeGreaterThan(0);
  assert.equal(await media.evaluate(video => video.muted), true);
  await expect(shotCards.first().getByTestId("reference-usage-duration")).toHaveText("使用时长 16.7秒");
  await shotCards.first().getByRole("button", { name: "暂停", exact: true }).click();
  assert.equal(await media.evaluate(video => video.paused), true);
  await shotCards.first().getByRole("button", { name: "开启声音", exact: true }).click();
  await expect.poll(() => media.evaluate(video => video.muted)).toBe(false);
  await shotCards.first().getByRole("button", { name: "播放", exact: true }).click();
  await expect.poll(() => media.evaluate(video => video.paused)).toBe(false);
  await shotCards.first().getByRole("button", { name: "下载", exact: true }).click();
  await popoverBounds();
  await expect(page.getByRole("menuitem")).toHaveText(["下载原片", "下载转码视频", "下载预览视频 (带水印)"]);
  await page.screenshot({ path: "tmp/reference-cards-hover-menu.png" });
  const downloaded = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "下载原片", exact: true }).click();
  assert.match((await downloaded).suggestedFilename(), /_原片\.mp4$/);
  await page.mouse.move(5, 5);
  await expect(shotCards.first().getByLabel("下载次数 7", { exact: true })).toHaveCount(1);

  await shotCards.first().hover();
  await shotCards.first().getByRole("button", { name: "标签", exact: true }).click();
  await page.getByRole("menuitem", { name: "添加公共标签", exact: true }).click();
  const tagDialog = page.getByRole("dialog", { name: "关联公共标签", exact: true });
  await expect(tagDialog).toBeVisible();
  await tagDialog.getByRole("button").first().click();
  await shotCards.first().hover();
  await shotCards.first().getByRole("button", { name: "分享", exact: true }).click();
  await page.getByRole("menuitem", { name: "复制PC端链接", exact: true }).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\/video\/pc\/shot_1$/);
  await shotCards.first().getByTestId("reference-video-preview").getByRole("button", { name: /^查看素材：/ }).click();
  const detail = page.getByRole("dialog", { name: "引用视频详情", exact: true });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText("张玲静 | 口播（实拍素材）");
  await detail.getByRole("button", { name: "返回引用列表", exact: true }).click();
  await expect(detail).toHaveCount(0);

  await button("编辑关联视频").click();
  await expect(shotCards.first().getByRole("button", { name: "取消关联", exact: true })).toBeVisible();
  await shotCards.first().hover();
  await expect(shotCards.first().getByTestId("reference-video-preview")).toHaveCount(0);
  await shotCards.first().getByRole("button", { name: "取消关联", exact: true }).click();
  await expect(shotCards).toHaveCount(3);
  await expect(shots.getByTestId("reference-usage-duration")).not.toContainText(["16.7秒"]);
  await button("退出关联视频").click();
  await button("被引用后出片").click();
  await results.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  await expect(resultCards).toHaveCount(3);
  await expect(results.getByTestId("reference-usage-duration")).toHaveCount(0);
  await expect(resultCards.first()).toContainText("审核通过");
  await expect(resultCards.first().getByLabel("推送次数 0", { exact: true })).toHaveCount(1);
  assert.deepEqual(await resultCards.first().getByTestId("reference-video-stats").locator(":scope > span").evaluateAll(items => items.map(item => item.title)), ["下载次数", "推送次数", "被引用次数"]);
  assert.ok(Math.abs((await resultCards.first().boundingBox()).width - compact.width) < 3);
  await expect.poll(() => resultCards.locator(".reference-video-cover img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), { timeout: 30000 }).toBe(true);
  await results.screenshot({ path: "tmp/reference-cards-produced.png" });

  for (const width of [1366, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await results.scrollIntoViewIfNeeded();
    assert.equal(await results.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    await resultCards.last().hover();
    await resultCards.last().getByRole("button", { name: "分享", exact: true }).click();
    await popoverBounds();
    await page.screenshot({ path: `tmp/reference-cards-${width}.png` });
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  console.log("PASS: compact card proportions, usage headers, hover playback, controls, download, tags, share, detail, unlink, responsive menus", ratio);
} catch (error) {
  await page.screenshot({ path: "tmp/reference-cards-failure.png" });
  throw error;
} finally { await browser.close(); }
