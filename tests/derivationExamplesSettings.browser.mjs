import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const switchMode = async name => { await page.locator("#btn-client-mode-dropdown").click(); await button(name).click(); };
try {
  await page.addInitScript(() => {
    localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" }));
    sessionStorage.setItem("mengchang-ad-push-settings", JSON.stringify({ namingRule: "code_title", customNaming: "", maxPush: 180, maxDerive: 20 }));
  });
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await switchMode("管理端");
  await page.locator("#sidebar-item-system_management").click();
  await button("系统设置").click();
  await expect(page.getByRole("heading", { name: "成片推送", exact: true })).toHaveCount(0);
  await expect(page.getByText("到设定日期后，所有人可查看", { exact: true })).toHaveCount(0);
  const visibility = page.getByRole("heading", { name: "发布作品，可见性设置", exact: true }).locator("../..");
  await expect(visibility.getByRole("checkbox")).toHaveCount(5);
  for (const name of ["公开", "部门范围可见", "分组范围可见", "公用资源", "指定范围"]) await expect(visibility.getByRole("checkbox", { name, exact: true })).toBeChecked();
  await visibility.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "tmp/settings-removed-push-section.png" });
  await visibility.getByRole("button", { name: "保存设置", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem("mengchang-ad-push-settings"))), { namingRule: "code_title", customNaming: "", maxPush: 180, maxDerive: 20 });
  await expect(page.getByRole("heading", { name: "自动修改状态", exact: true })).toBeVisible();
  await switchMode("用户端");
  const examples = await page.evaluate(async () => {
    const moduleUrl = performance.getEntriesByType("resource").find(entry => new URL(entry.name).pathname === "/src/data/finishedVideos.ts")?.name || "/src/data/finishedVideos.ts";
    const { INITIAL_FINISHED } = await import(moduleUrl);
    return INITIAL_FINISHED.filter(video => video.status === "已上机").map(video => [video.id, video.title]);
  });
  assert.equal(examples.length, 8);
  for (const [id, title] of examples) {
    await page.locator("#sidebar-item-resources").click();
    await button("已上机").click();
    await page.getByText(title, { exact: true }).click();
    await expect(page.getByText("已上机", { exact: true }).first()).toBeVisible();
    await button("衍生视频").click();
    const table = page.getByTestId("finished-derivations");
    await expect(table.locator("tbody tr")).toHaveCount(8);
    await expect(table.locator(`tr[data-derivative-id^="DER-${id}-"]`)).toHaveCount(8);
    const first = page.locator(`[data-derivative-id="DER-${id}-DEMO-1"]`);
    await table.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `tmp/on-machine-derivatives-${id}.png` });
    await first.getByRole("button", { name: `${title.replace(/\.mp4$/i, "")}_衍生1.mp4`, exact: true }).click();
    await expect.poll(() => page.locator('[role="dialog"] video').evaluate(video => video.readyState)).toBeGreaterThan(1);
    await page.locator('[role="dialog"]').getByRole("button", { name: /^关闭/ }).click();
    await first.getByRole("button", { name: "查看数据", exact: true }).click();
    await expect(page.locator('[data-highlighted="true"]')).toHaveAttribute("data-video-id", `DER-${id}-DEMO-1`);
    await expect(page.locator('[data-highlighted="true"]')).toBeInViewport();
  }
  await page.locator("#sidebar-item-resources").click();
  await button("已上机").click();
  await page.getByText(examples[0][1], { exact: true }).click();
  await button("衍生视频").click();
  await expect(page.getByTestId("finished-derivations").locator("tbody tr")).toHaveCount(8);
  await button("更多").click();
  await button("衍生新视频").click();
  await expect(page.getByRole("dialog", { name: "衍生新视频", exact: true })).toContainText("本次最多可衍生 20 个");
  assert.deepEqual(errors, []);
  console.log("PASS: removed admin entries, retained visibility options and configured quota, all eight on-machine videos with eight isolated examples, local playback and analytics navigation");
} catch (error) { await page.screenshot({ path: "tmp/derivation-examples-settings-failure.png" }); throw error; }
finally { await browser.close(); }
