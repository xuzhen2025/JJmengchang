import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge", ignoreDefaultArgs: ["--hide-scrollbars"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const timeline = page.getByTestId("video-interaction-timeline");
const plot = page.getByTestId("video-interaction-plot");
const scrollbar = page.getByTestId("video-interaction-scrollbar");
const tooltip = page.locator('[role="tooltip"][data-overlay-layer="popover"]');
const media = page.locator("video").first();
const state = () => timeline.evaluate(element => ({ start: Number(element.dataset.start), end: Number(element.dataset.end), duration: Number(element.dataset.duration) }));
const playback = () => media.evaluate(element => element.currentTime);
const geometry = async () => {
  await plot.scrollIntoViewIfNeeded();
  return plot.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x + Number(element.dataset.plotX), y: rect.y + Number(element.dataset.plotY), width: Number(element.dataset.plotWidth), height: Number(element.dataset.plotHeight) };
  });
};
const wheel = async (delta, ratio = 0.5) => {
  const box = await geometry();
  await page.mouse.move(box.x + box.width * ratio, box.y + box.height * 0.5);
  await page.mouse.wheel(0, delta);
  await page.waitForTimeout(80);
};
const drag = async (from, to) => {
  const box = await geometry();
  await page.mouse.move(box.x + box.width * from, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to, box.y + box.height * 0.5, { steps: 10 });
  await page.mouse.up();
};
const setDuration = async duration => {
  // Isolate chart/media synchronization from the remote demo MP4's real length.
  await media.evaluate((element, value) => {
    element.pause();
    let currentTime = 0;
    Object.defineProperty(element, "duration", { configurable: true, get: () => value });
    Object.defineProperty(element, "currentTime", { configurable: true, get: () => currentTime, set: time => {
      currentTime = time;
      element.dispatchEvent(new Event("timeupdate"));
    } });
    element.dispatchEvent(new Event("loadedmetadata"));
  }, duration);
  await expect(timeline).toHaveAttribute("data-duration", String(duration));
  await expect.poll(async () => (await state()).end).toBe(duration);
};
try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3005/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();
  await page.getByText("0730-8835-\u9c81\u6708\u56ed-\u590d\u53e4\u8033\u73af\u52a8\u6001\u5962\u611f\u89c6\u9891.mp4", { exact: true }).click();
  await page.getByRole("button", { name: "\u4e92\u52a8\u6570\u636e", exact: true }).click();
  await expect(plot.locator(".recharts-area-curve")).toHaveCount(2);
  await expect.poll(async () => (await geometry()).width).toBeGreaterThan(50);

  await setDuration(15);
  await expect(scrollbar).toHaveCount(0);
  let box = await geometry();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height / 2);
  await expect.poll(playback).toBe(6);
  await expect(plot.locator(".recharts-reference-line-line")).toHaveCount(1);
  await drag(0.8, 0.2);
  assert.equal(await playback(), 6, "full-view drag must not seek");
  const beforeScroll = await page.evaluate(() => document.scrollingElement.scrollTop);
  await wheel(-240);
  await expect(scrollbar).toBeVisible();
  assert.equal(await playback(), 6, "wheel zoom must not seek");
  assert.equal(await page.evaluate(() => document.scrollingElement.scrollTop), beforeScroll);
  await timeline.screenshot({ path: "tmp/video-timeline-short.png", animations: "disabled" });

  await setDuration(600);
  const overview = await state();
  assert.deepEqual(overview, { start: 0, end: 600, duration: 600 });
  await expect(scrollbar).toHaveCount(0);
  await timeline.screenshot({ path: "tmp/video-timeline-long-overview.png", animations: "disabled" });
  await wheel(-120, 0.3);
  await expect(tooltip).toHaveCount(0);
  let zoom = await state();
  assert.ok(zoom.end - zoom.start < 600);
  assert.ok(Math.abs(zoom.start + (zoom.end - zoom.start) * 0.3 - 180) < 600 / (await geometry()).width, JSON.stringify(zoom));
  for (let index = 0; index < 12; index++) await wheel(-240);
  zoom = await state();
  box = await geometry();
  assert.ok(Math.abs(zoom.end - zoom.start - Math.floor(box.width / 48)) < 1e-5);
  const ticks = await plot.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value").allTextContents();
  assert.ok(ticks.length >= 2);
  const seconds = ticks.map(tick => Number(tick.replace("s", "")));
  assert.ok(seconds.every(Number.isInteger));
  assert.ok(seconds.slice(1).every((value, index) => value === seconds[index] + 1));
  const yAxes = await plot.locator(".recharts-yAxis-tick-labels").allTextContents();
  await drag(0.8, 0.2);
  await expect.poll(async () => (await state()).start).toBeGreaterThan(zoom.start);
  assert.equal(await playback(), 0, "panning must not seek");
  assert.deepEqual(await plot.locator(".recharts-yAxis-tick-labels").allTextContents(), yAxes, "Y scales must remain fixed while panning");
  await timeline.screenshot({ path: "tmp/video-timeline-long-zoomed.png", animations: "disabled" });

  await scrollbar.evaluate(element => { element.scrollLeft = 0; });
  await expect.poll(async () => (await state()).start).toBe(0);
  const scrollBox = await scrollbar.boundingBox();
  await page.mouse.move(scrollBox.x + 25, scrollBox.y + scrollBox.height - 4);
  await page.mouse.down();
  await page.mouse.move(scrollBox.x + scrollBox.width * 0.5, scrollBox.y + scrollBox.height - 4, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await state()).start).toBeGreaterThan(0);
  assert.equal(await playback(), 0, "scrollbar drag must not seek");
  await scrollbar.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await expect.poll(async () => Math.round((await state()).end)).toBe(600);
  const atEnd = await state();
  await drag(0.8, 0.2);
  assert.deepEqual(await state(), atEnd);
  assert.equal(await playback(), 0, "drag at the boundary must not become a click");
  box = await geometry();
  const expectedSecond = Math.round(atEnd.start + (atEnd.end - atEnd.start) * 0.4);
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
  await expect(tooltip).toContainText(`${expectedSecond}s`);
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height / 2);
  await expect.poll(playback).toBe(expectedSecond);
  await expect(plot.locator(".recharts-reference-line-line")).toHaveCount(1);
  await scrollbar.focus();
  await page.keyboard.press("Home");
  await expect.poll(async () => (await state()).start).toBe(0);
  for (let index = 0; index < 12; index++) await wheel(240);
  await expect(scrollbar).toHaveCount(0);
  assert.deepEqual(await state(), overview);
  assert.equal(await playback(), expectedSecond);

  for (const width of [1024, 390]) {
    if (width === 390) {
      await page.locator("aside").getByRole("button").last().click();
      await expect.poll(async () => (await page.locator("aside").boundingBox()).width).toBe(64);
    }
    await page.setViewportSize({ width, height: 844 });
    for (let index = 0; index < 12; index++) await wheel(-240);
    await expect(scrollbar).toBeVisible();
    assert.equal(await timeline.evaluate(element => element.scrollWidth <= element.clientWidth), true, JSON.stringify(await timeline.evaluate(element => ({ width: innerWidth, client: element.clientWidth, scroll: element.scrollWidth, children: Array.from(element.querySelectorAll("div")).map(child => ({ class: child.className, client: child.clientWidth, scroll: child.scrollWidth })).filter(child => child.scroll > child.client) }))));
    box = await geometry();
    assert.ok(box.width > 50);
    const tickBoxes = await plot.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value").evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, right: rect.right };
    }));
    assert.ok(tickBoxes.slice(1).every((tick, index) => tick.x >= tickBoxes[index].right));
    const before = await playback();
    await drag(0.7, 0.3);
    assert.equal(await playback(), before);
    box = await geometry();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await expect(tooltip).toBeVisible();
    const tooltipBox = await tooltip.boundingBox();
    assert.ok(tooltipBox.x >= 0 && tooltipBox.x + tooltipBox.width <= width && tooltipBox.y >= 0 && tooltipBox.y + tooltipBox.height <= 844);
    await page.screenshot({ path: `tmp/video-timeline-${width}.png`, animations: "disabled" });
    await timeline.screenshot({ path: `tmp/video-timeline-chart-${width}.png`, animations: "disabled" });
  }
  await setDuration(1.4);
  await expect(scrollbar).toHaveCount(0);
  await wheel(-240);
  await expect(plot.locator(".recharts-xAxis-tick-labels")).toContainText("1s");
  await setDuration(0.7);
  await wheel(-240);
  await expect(scrollbar).toHaveCount(0);
  assert.deepEqual(await state(), { start: 0, end: 0.7, duration: 0.7 });
  assert.deepEqual(errors, []);
  console.log("PASS: seconds, anchored wheel zoom, zoom limits, pan/click separation, native scrollbar drag/keyboard, short/long/fractional duration, resize and narrow-screen tick bounds");
} catch (error) {
  await page.screenshot({ path: "tmp/video-timeline-failure.png", animations: "disabled" });
  throw error;
} finally { await browser.close(); }
