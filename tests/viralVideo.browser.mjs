import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const previews = new URL("../docs/previews/", import.meta.url);
await mkdir(previews, { recursive: true });
await context.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
const newPage = async () => {
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.routeWebSocket(/ws:\/\/localhost:3000\//, socket => socket.close());
  await page.clock.install({ time: new Date("2026-09-09T04:00:00Z") });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  return page;
};
const user = await newPage();
try {
  await user.getByRole("button", { name: "资源库", exact: true }).click();
  await user.locator("select").filter({ has: user.locator('option[value="50"]') }).last().selectOption("50");
  const cards = user.getByTestId("finished-video-card");
  const sampleIds = Array.from({ length: 10 }, (_, index) => `fv${index + 13}`);
  const monthlyIds = ["fv11", "fv5", ...sampleIds].sort();
  const totalIds = ["fv11", "fv3", "fv5", ...sampleIds].sort();
  const twelveWanIds = ["fv5", "fv13", "fv14", "fv15", "fv17", "fv18", "fv19", "fv21"].sort();
  const badgeIds = () => cards.filter({ has: user.getByTestId("viral-video-badge") }).evaluateAll(nodes => nodes.map(node => node.dataset.videoId).sort());
  const expectBadgeIds = async (ids) => {
    await user.waitForFunction(expected => JSON.stringify([...document.querySelectorAll('[data-testid="finished-video-card"]')].filter(node => node.querySelector('[data-testid="viral-video-badge"]')).map(node => node.dataset.videoId).sort()) === JSON.stringify(expected), ids);
    assert.deepEqual(await badgeIds(), ids);
  };
  await expectBadgeIds(monthlyIds);
  const card = cards.filter({ has: user.locator('[data-testid="viral-video-badge"]') }).first();
  for (const width of [1920, 1440, 1280, 1024, 768, 390]) {
    await user.setViewportSize({ width, height: 1000 });
    if (width === 390) {
      await user.locator("aside").getByRole("button").last().click();
      await user.waitForFunction(() => document.querySelector("aside").getBoundingClientRect().width <= 65);
    }
    await card.scrollIntoViewIfNeeded();
    await user.mouse.move(0, 0);
    const preview = card.getByTestId("finished-video-hover-preview");
    await preview.waitFor({ state: "hidden" });
    const cover = await card.getByTestId("finished-video-cover").boundingBox();
    const badge = await card.getByTestId("viral-video-badge").boundingBox();
    const stats = await card.getByTestId("finished-video-stats").boundingBox();
    assert.ok(Math.abs(cover.x + cover.width - badge.x - badge.width - 6) < 1);
    assert.ok(Math.abs(cover.y + cover.height - badge.y - badge.height - 6) < 1);
    assert.ok(stats.x + stats.width < badge.x, JSON.stringify({ width, stats, badge }));
    await card.hover();
    await preview.waitFor({ state: "visible" });
    assert.equal(await card.getByTestId("viral-video-badge").count(), 1);
    const hoverBadge = await card.getByTestId("viral-video-badge").boundingBox();
    const previewBounds = await preview.boundingBox();
    const volume = preview.getByTitle("音量控制", { exact: true });
    const volumeBounds = await volume.boundingBox();
    assert.ok(hoverBadge.y > badge.y, JSON.stringify({ width, badge, hoverBadge }));
    assert.equal(hoverBadge.width, badge.width);
    assert.equal(hoverBadge.height, badge.height);
    assert.ok(Math.abs(previewBounds.x + previewBounds.width - hoverBadge.x - hoverBadge.width - 10) < 1);
    assert.ok(Math.abs(volumeBounds.y - hoverBadge.y - hoverBadge.height - 6) < 1);
    assert.ok(await card.getByTestId("viral-video-badge").evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
    assert.ok(await volume.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
    if (width === 1440) await card.screenshot({ path: fileURLToPath(new URL("finished-video-viral-hover.png", previews)) });
    await user.mouse.move(0, 0);
    await preview.waitFor({ state: "hidden" });
    const restoredBadge = await card.getByTestId("viral-video-badge").boundingBox();
    assert.ok(Math.abs(restoredBadge.y - badge.y) < 1);
    assert.ok(Math.abs(restoredBadge.x - badge.x) < 1);
  }
  assert.match(await card.getByTestId("viral-video-badge").getAttribute("title"), /月消耗达到10万/);
  await user.mouse.move(0, 0);
  await user.setViewportSize({ width: 1920, height: 1000 });
  await user.locator("aside").getByRole("button").last().click();
  await user.waitForFunction(() => document.querySelector("aside").getBoundingClientRect().width >= 255);
  await cards.first().locator("..").screenshot({ path: fileURLToPath(new URL("finished-video-viral-cards.png", previews)) });
  const filter = user.getByRole("combobox", { name: "成片消耗筛选" });
  const preset = user.getByRole("button", { name: "选择常用筛选预设", exact: true });
  await preset.click();
  await user.getByRole("menuitemcheckbox", { name: "高爆款成片预设", exact: true }).click();
  await expectBadgeIds(monthlyIds);
  assert.equal(await filter.inputValue(), "爆款视频");
  assert.match(await preset.innerText(), /高爆款成片预设/);
  await filter.selectOption("爆款视频");
  assert.equal(await cards.count(), 12);

  const admin = await newPage();
  await admin.locator("#btn-client-mode-dropdown").click();
  await admin.getByRole("button", { name: "管理端", exact: true }).click();
  await admin.getByRole("button", { name: "系统管理", exact: true }).click();
  await admin.getByText("系统自动化标签", { exact: true }).click();
  const settings = admin.getByTestId("viral-video-settings");
  const period = settings.getByRole("combobox", { name: "爆款判定指标" });
  const threshold = settings.getByRole("spinbutton", { name: "爆款消耗门槛（万元）" });
  const save = settings.getByRole("button", { name: "保存设置", exact: true });
  assert.equal(await threshold.inputValue(), "10");
  await threshold.fill("20");
  assert.deepEqual(await badgeIds(), monthlyIds);
  await save.click();
  await expectBadgeIds([]);
  assert.equal(await cards.count(), 0);
  assert.match(await filter.locator('option[value="爆款视频"]').innerText(), /月消耗达到20万/);

  await period.selectOption("total");
  await threshold.fill("10");
  await save.click();
  await expectBadgeIds(totalIds);
  assert.equal(await cards.count(), 13);
  assert.match(await filter.locator('option[value="爆款视频"]').innerText(), /总消耗达到10万/);
  assert.match(await preset.innerText(), /高爆款成片预设/);
  await period.selectOption("monthly");
  await threshold.fill("12");
  await save.click();
  await expectBadgeIds(twelveWanIds);

  for (const invalid of ["", "0", "-1"]) {
    await threshold.fill(invalid);
    await save.click();
    assert.equal(await threshold.getAttribute("aria-invalid"), "true");
    assert.equal(await threshold.evaluate(el => document.activeElement === el), true);
    assert.deepEqual(await badgeIds(), twelveWanIds);
  }
  await threshold.fill("10");
  await save.click();
  await expectBadgeIds(monthlyIds);
  await settings.screenshot({ path: fileURLToPath(new URL("finished-video-viral-settings.png", previews)) });
  await user.reload({ waitUntil: "domcontentloaded" });
  await user.getByRole("button", { name: "资源库", exact: true }).click();
  await user.locator("select").filter({ has: user.locator('option[value="50"]') }).last().selectOption("50");
  await expectBadgeIds(monthlyIds);
  await filter.selectOption("爆款视频");
  await user.clock.setFixedTime(new Date("2026-09-30T16:00:01Z"));
  await user.clock.runFor(60_001);
  await expectBadgeIds([]);
  assert.equal(await cards.count(), 0);
  await period.selectOption("total");
  await save.click();
  await expectBadgeIds(totalIds);
  assert.deepEqual(errors, []);
  console.log("PASS: badge placement and hover, saved-rule/filter/preset synchronization, exact threshold, draft and invalid settings, reload, and month rollover.");
} catch (error) {
  await user.screenshot({ path: fileURLToPath(new URL("finished-video-viral-test-failure.png", previews)) });
  throw error;
} finally { await browser.close(); }
