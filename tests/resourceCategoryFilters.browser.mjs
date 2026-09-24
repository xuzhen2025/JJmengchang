import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const presets = () => button("\u9009\u62e9\u5e38\u7528\u7b5b\u9009\u9884\u8bbe");
const primary = () => page.getByText("\u4e00\u7ea7\u5206\u7c7b\uff1a", { exact: true });
const secondary = () => page.getByText(/^\u4e8c\u7ea7\u5206\u7c7b[:\uff1a]$/);
const mainCategory = () => page.getByText(/^\s*\u4e3b\s*\u7c7b\s*\u76ee\s*[:\uff1a]?\s*$/);
const selectPreset = async name => {
  await presets().click();
  await page.getByRole("menuitemcheckbox", { name, exact: true }).click();
};

try {
  await page.addInitScript(() => {
    localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" }));
    const cases = [
      ["finished", "primaryCat", "\u5973\u58eb\u5185\u8863"],
      ["materials", "primaryCat", "\u5973\u58eb\u5185\u8863"],
      ["scripts", "selectedPrimaryCat", "\u7f8e\u5986\u62a4\u80a4"],
      ["audio", "selectedPrimaryCategory", "\u7f8e\u5986\u62a4\u80a4"],
    ];
    for (const [scope, key, category] of cases) {
      const obsolete = { mainCat: "obsolete", selectedMainCat: "obsolete", selectedMainCategory: "obsolete" };
      localStorage.setItem(`mengchang-filter-presets-v1:putongyonghu:${scope}`, JSON.stringify({ version: 1, presets: [
        { id: "old", name: "Legacy", filters: obsolete },
        { id: "filtered", name: "Filtered", filters: { ...obsolete, [key]: category } },
      ] }));
    }
  });
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();
  for (const [scope, label, listTitle] of [
    ["finished", "\u6210\u7247\u7ba1\u7406", null],
    ["materials", "\u7d20\u6750\u7ba1\u7406", "\u5217\u8868\u660e\u7ec6\u89c6\u56fe"],
    ["scripts", "\u811a\u672c\u7ba1\u7406", null],
    ["audio", "\u97f3\u9891\u7ba1\u7406", "\u5217\u8868\u8bd5\u56fe"],
  ]) {
    await button(label).click();
    await expect(primary()).toBeVisible();
    await expect(secondary()).toBeVisible();
    await expect(mainCategory()).toHaveCount(0);
    if (scope === "audio") {
      for (const width of [1440, 1920, 1024, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect.poll(async () => {
          const first = await page.getByTestId("audio-primary-filter").boundingBox();
          const second = await page.getByTestId("audio-secondary-filter").boundingBox();
          return Boolean(first && second && second.y >= first.y + first.height
            && Math.abs(first.x - second.x) <= 1 && Math.abs(first.width - second.width) <= 1);
        }, { message: `Audio category filters occupy separate aligned rows at ${width}px`, timeout: 3000 }).toBe(true);
        if (width === 1440 || width === 390) {
          await page.screenshot({ path: `tmp/audio-category-layout-${width}.png` });
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    if (listTitle) await page.getByTitle(listTitle, { exact: true }).click();
    const items = scope === "finished" ? page.getByTestId("finished-video-card") : page.locator("tbody tr");
    const baseline = await items.allTextContents();
    assert.ok(baseline.length > 1, `${scope}: baseline has multiple resources`);
    await selectPreset("Legacy");
    await expect(presets()).toHaveText("Legacy");
    assert.deepEqual(await items.allTextContents(), baseline, `${scope}: obsolete condition does not hide resources`);
    await selectPreset("Filtered");
    await expect(presets()).toHaveText("Filtered");
    assert.ok(await items.count() > 0 && await items.count() < baseline.length, `${scope}: primary category still filters`);

    await button("\u4fdd\u5b58\u5e38\u7528\u7b5b\u9009\u9884\u8bbe").click();
    const dialog = page.getByRole("dialog", { name: "\u4fdd\u5b58\u4e3a\u5e38\u7528\u7b5b\u9009", exact: true });
    await dialog.getByRole("textbox").fill("Saved");
    await dialog.getByRole("button", { name: "\u4fdd\u5b58", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const saved = await page.evaluate(scope => JSON.parse(localStorage.getItem(`mengchang-filter-presets-v1:putongyonghu:${scope}`)), scope);
    assert.equal(saved.presets.length, 3);
    for (const preset of saved.presets) {
      for (const key of ["mainCat", "selectedMainCat", "selectedMainCategory"]) assert.ok(!(key in preset.filters));
    }
    await selectPreset("Legacy");
    assert.deepEqual(await items.allTextContents(), baseline);
    if (scope === "finished") {
      await secondary().locator("..").getByRole("button", { name: "\u667a\u80fd\u624b\u8868", exact: true }).click();
      await expect(items).toHaveCount(1);
      await selectPreset("Legacy");
      await page.screenshot({ path: "tmp/resource-category-filters.png" });
    }
    console.log(`PASS: ${scope} filters, legacy presets, save and reload`);
  }

  await button("\u56fe\u7247\u7ba1\u7406").click();
  await expect(primary()).toBeVisible();
  await expect(secondary()).toBeVisible();
  await expect(presets()).toBeVisible();
  await expect(mainCategory()).toHaveCount(0);

  await button("\u811a\u672c\u7ba1\u7406").click();
  await page.locator("tbody tr").first().locator("td").nth(1).getByRole("button").click();
  await button("\u5173\u8054\u4f5c\u54c1").first().click();
  await expect(primary()).toBeVisible();
  await expect(secondary()).toBeVisible();
  await expect(mainCategory()).toHaveCount(0);
  await page.screenshot({ path: "tmp/script-work-category-filters.png" });
  assert.deepEqual(errors, []);
  console.log("PASS: image filters and script associated-work filters remain available without main categories");
} finally {
  await browser.close();
}
