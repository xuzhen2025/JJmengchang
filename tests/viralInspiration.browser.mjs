import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.setDefaultTimeout(12000);
await mkdir("tmp/viral-inspiration", { recursive: true });
const gallery = page.getByTestId("viral-inspiration-gallery");
const cards = gallery.getByTestId("viral-inspiration-card");
const card = (id) => cards.and(page.locator(`[data-video-id="${id}"]`));
const navigate = (name) => page.getByRole("button", { name, exact: true }).click();
const shot = (name) => page.screenshot({ path: `tmp/viral-inspiration/${name}.png` });
const setRule = (period, thresholdWan) => page.evaluate(async ({ period, thresholdWan }) => {
  const { saveViralVideoRule } = await import("/src/lib/viralVideoRule.ts");
  saveViralVideoRule({ period, thresholdWan });
}, { period, thresholdWan });
const editVideo = (id, patch) => page.evaluate(async ({ id, patch }) => {
  const { saveResourceEdits } = await import("/src/lib/useResourceEdits.ts");
  saveResourceEdits("finished", { [id]: patch });
}, { id, patch });
const waitCount = (count) => page.waitForFunction((count) => document.querySelectorAll('[data-testid="viral-inspiration-card"]').length === count, count);

try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.clock.setFixedTime(new Date("2026-09-12T06:00:00Z"));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await navigate("资源库");
  await page.locator("select").filter({ has: page.locator('option[value="50"]') }).last().selectOption("50");
  const expectedIds = await page.getByTestId("finished-video-card").filter({ has: page.getByTestId("viral-video-badge") }).evaluateAll((nodes) => nodes.map((node) => node.dataset.videoId).sort());
  assert.equal(expectedIds.length, 14);
  await navigate("爆款复刻");
  await waitCount(14);
  const sourceButton = page.getByRole("button", { name: "开始解析", exact: true });
  assert.equal(await sourceButton.isEnabled(), false);
  assert.ok((await gallery.boundingBox()).y > (await sourceButton.boundingBox()).y);
  await shot("source-with-gallery");
  assert.deepEqual(await cards.evaluateAll((nodes) => nodes.map((node) => node.dataset.videoId).sort()), expectedIds);
  assert.equal(await cards.first().getAttribute("data-video-id"), "fv17");
  assert.equal(await card("fv5").getByTestId("viral-inspiration-heat").innerText(), "热度 1,200");
  assert.equal(await card("fv11").getByTestId("viral-inspiration-heat").innerText(), "热度 1,000");
  assert.equal(await cards.locator("[data-testid='viral-inspiration-heat'][title]").count(), 0);
  assert.equal(await cards.and(page.locator("[title]")).count(), 0);
  assert.equal(await gallery.getByRole("button", { name: /收藏/ }).count(), 0);
  await gallery.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="viral-inspiration-card"] img')].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 30000 });
  await page.mouse.move(0, 0);
  assert.equal(await gallery.getByTestId("viral-hover-video").count(), 0);
  assert.equal(await gallery.getByTestId("viral-hover-duration").count(), 0);
  assert.equal(await gallery.getByRole("button", { name: "开启声音", exact: true }).count(), 0);
  assert.equal(await cards.locator("p").count(), 0);
  assert.equal(await card("fv5").getByRole("button", { name: "一键复刻", exact: true }).evaluate((el) => getComputedStyle(el).opacity), "0");
  await shot("default");
  await card("fv5").hover();
  const hoverVideo = card("fv5").getByTestId("viral-hover-video");
  await page.waitForFunction(() => {
    const video = document.querySelector('[data-testid="viral-hover-video"]');
    return video && !video.paused && video.currentTime > 0.1;
  });
  assert.equal(await hoverVideo.evaluate((el) => el.muted), true);
  assert.equal(await card("fv5").getByTestId("viral-hover-duration").innerText(), "18s");
  await card("fv5").getByRole("button", { name: "开启声音", exact: true }).click();
  assert.equal(await hoverVideo.evaluate((el) => el.muted), false);
  await card("fv5").getByRole("button", { name: "关闭声音", exact: true }).click();
  assert.equal(await hoverVideo.evaluate((el) => el.muted), true);
  await page.mouse.move(0, 0);
  await hoverVideo.waitFor({ state: "detached" });
  assert.equal(await gallery.getByTestId("viral-hover-duration").count(), 0);
  await card("fv5").hover();
  await hoverVideo.waitFor();
  assert.equal(await hoverVideo.evaluate((el) => el.muted), true);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="viral-inspiration-card"][data-video-id="fv5"] button:last-child')).opacity === "1");
  await shot("hover");
  const sourceTitle = (await card("fv5").getByRole("button", { name: /^预览 / }).getAttribute("aria-label")).replace(/^预览 /, "");
  await card("fv5").getByRole("button", { name: /^预览 / }).click();
  assert.equal(await page.locator("video[controls]").count(), 1);
  await page.getByTitle("关闭预览").click();
  await card("fv5").hover();
  await card("fv5").getByRole("button", { name: "一键复刻", exact: true }).click();
  const analyze = page.getByRole("button", { name: "开始解析", exact: true });
  await analyze.waitFor();
  assert.equal(await analyze.isEnabled(), true);
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => button.textContent === "开始解析" && button.getBoundingClientRect().bottom < innerHeight));
  await page.getByText(sourceTitle, { exact: true }).waitFor();
  const state = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.startsWith("mengchang_remake_")).map(([key, value]) => ({ key, value: JSON.parse(value) })));
  // Inspect the saved source without relying on a generated session ID.
  const saved = state.find(({ value }) => value.source?.id === "fv5");
  assert.ok(saved, JSON.stringify(state));
  assert.equal(saved.value.step, "source");
  assert.equal(saved.value.spentCredits, 0);
  assert.equal(saved.value.backgroundOperation, null);
  assert.match(saved.value.source.url, /\.mp4/);
  await shot("remake-source");
  await analyze.click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).step === "subjects", saved.key);
  assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).projectName, saved.key), sourceTitle.replace(/\.[^.]+$/, ""));

  await page.clock.setFixedTime(new Date("2026-09-12T06:00:01Z"));
  await navigate("爆款复刻");
  await page.evaluate(async () => {
    const { resourceTagStore } = await import("/src/lib/resourceTags.ts");
    resourceTagStore.assign("finished", { id: "fv5" }, "public", ["成分卖点", "产品实拍"]);
    resourceTagStore.assign("finished", { id: "fv5" }, "personal", ["本周主推"]);
  });
  await card("fv5").getByText("成分卖点", { exact: true }).waitFor();
  assert.equal(await gallery.getByText("本周主推", { exact: true }).count(), 0);
  await navigate("资源库");
  const resourceCard = page.getByTestId("finished-video-card").and(page.locator('[data-video-id="fv5"]'));
  await resourceCard.click();
  await page.getByText("成分卖点", { exact: true }).waitFor();
  await navigate("爆款复刻");
  await setRule("monthly", 20);
  await waitCount(0);
  await gallery.getByText("暂无符合当前条件的爆款成片", { exact: true }).waitFor();
  await setRule("monthly", 10);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="viral-inspiration-card"]').length > 6);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="viral-inspiration-card"] img')].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 30000 });
  for (const width of [1440, 1280, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await gallery.scrollIntoViewIfNeeded();
    const bounds = await cards.evaluateAll((nodes) => nodes.slice(0, 7).map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }));
    for (const box of bounds.slice(0, 6)) {
      assert.ok(Math.abs(box.y - bounds[0].y) < 1);
      assert.ok(Math.abs(box.width / box.height - 9 / 16) < 0.005);
      assert.ok(box.x + box.width <= width);
    }
    assert.ok(bounds[6].y > bounds[0].y);
    await shot(`six-columns-${width}`);
  }
  await page.locator("aside").getByRole("button").last().click();
  await page.setViewportSize({ width: 430, height: 900 });
  await gallery.scrollIntoViewIfNeeded();
  assert.ok(await gallery.evaluate((el) => el.getBoundingClientRect().right <= innerWidth));
  await shot("mobile");
  await setRule("total", 10);
  await editVideo("fv5", { monthlyCosts: {} });
  await card("fv5").getByText("暂无热度", { exact: true }).waitFor();
  await editVideo("fv5", { deleted: true });
  await card("fv5").waitFor({ state: "detached" });
  await navigate("资源库");
  assert.equal(await page.getByTestId("finished-video-card").and(page.locator('[data-video-id="fv5"]')).count(), 0);
  assert.deepEqual(errors, []);
  console.log("Passed: shared viral resources/tags/deletion, monthly heat, six 9:16 cards per desktop row, preview, prefilled remake and explicit analysis.");
} catch (error) {
  await shot("failure");
  console.error((await page.locator("body").innerText()).slice(-3000));
  throw error;
} finally {
  await browser.close();
}
