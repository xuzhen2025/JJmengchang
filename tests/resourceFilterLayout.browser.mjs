import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));

const resources = [
  ["成片管理", "finished"],
  ["素材管理", "materials"],
  ["第三方管理", "thirdParty"],
  ["脚本管理", "scripts"],
  ["图片管理", "images"],
  ["音频管理", "audio"],
];

try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3005/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();

  let reference = null;
  for (const [tab, scope] of resources) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    const primary = page.getByTestId(`${scope}-primary-filter`);
    const secondary = page.getByTestId(`${scope}-secondary-filter`);
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();
    const panel = primary.locator("..");
    const metrics = await panel.evaluate((node, currentScope) => {
      const primaryRow = node.querySelector(`[data-testid="${currentScope}-primary-filter"]`);
      const secondaryRow = node.querySelector(`[data-testid="${currentScope}-secondary-filter"]`);
      const presetRow = node.firstElementChild;
      const primaryLabel = primaryRow?.querySelector("span");
      const panelStyle = getComputedStyle(node);
      const presetStyle = getComputedStyle(presetRow);
      const primaryStyle = getComputedStyle(primaryRow);
      const secondaryStyle = getComputedStyle(secondaryRow);
      const primaryBox = primaryRow.getBoundingClientRect();
      const labelBox = primaryLabel.getBoundingClientRect();
      const presetBox = presetRow.getBoundingClientRect();
      return {
        padding: panelStyle.padding,
        rowGap: Math.round(primaryBox.top - presetBox.bottom),
        presetBorderTop: presetStyle.borderTopWidth,
        presetBorderBottom: presetStyle.borderBottomWidth,
        primaryBorderTop: primaryStyle.borderTopWidth,
        secondaryBorderTop: secondaryStyle.borderTopWidth,
        primaryPaddingTop: primaryStyle.paddingTop,
        primaryLabelOffset: Math.round(labelBox.top - primaryBox.top),
      };
    }, scope);

    assert.equal(metrics.presetBorderTop, "0px", `${tab} preset row must not add a divider`);
    assert.equal(metrics.presetBorderBottom, "0px", `${tab} preset row must not create a double divider`);
    assert.equal(metrics.primaryBorderTop, "1px", `${tab} primary row keeps the single reference divider`);
    assert.equal(metrics.secondaryBorderTop, "1px", `${tab} secondary row keeps the reference divider`);
    assert.ok(metrics.primaryLabelOffset >= 12, `${tab} primary label must not touch the divider`);
    if (!reference) reference = metrics;
    assert.deepEqual(metrics, reference, `${tab} filter spacing differs from the reference layout`);

    await panel.screenshot({ path: `tmp/resource-filter-${scope}.png`, animations: "disabled" });
    console.log(`PASS: ${tab} uses the shared resource filter layout`);
  }

  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: "tmp/resource-filter-layout-failure.png", fullPage: true, animations: "disabled" });
  throw error;
} finally {
  await browser.close();
}
