import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const root = page.getByTestId("category-management");
const primary = root.getByTestId("category-primary");
const secondary = root.getByTestId("category-secondary");
const row = (column, name) => column.getByText(name, { exact: true }).locator("..");
const dialog = () => page.getByRole("dialog");
const confirm = () => dialog().getByRole("button", { name: "\u786e\u5b9a", exact: true }).click();
const fill = name => dialog().getByRole("textbox", { name: "\u5206\u7c7b\u540d\u79f0" }).fill(name);
const readNodes = column => column.locator("[data-category-id]").evaluateAll(nodes => nodes.map(node => ({
  id: node.dataset.categoryId, name: node.querySelector("span").textContent,
})));
const assertPortal = async () => {
  assert.ok(await dialog().evaluate(node => node.parentElement === document.body));
  const rect = await dialog().locator(":scope > div").boundingBox();
  const viewport = page.viewportSize();
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width && rect.y + rect.height <= viewport.height);
};

try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "guanliyuan", mode: "admin" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await button("\u5206\u7c7b\u7ba1\u7406").click();
  await expect(root).toBeVisible();
  const initial = await page.evaluate(async () => (await import("/src/components/CategoryManagementSubView.tsx")).INITIAL_CATEGORIES);
  for (const [type, nodes] of Object.entries(initial)) {
    await root.getByRole("button", { name: type, exact: true }).click();
    assert.deepEqual(await readNodes(primary), nodes.map(({ id, name }) => ({ id, name })));
    for (const node of nodes) {
      await primary.locator(`[data-category-id="${node.id}"]`).click();
      assert.deepEqual(await readNodes(secondary), node.children);
    }
    assert.equal(await page.getByText(/\u4e3b\s*\u7c7b\s*\u76ee/).count(), 0);

    const newName = `${type}-New`;
    await primary.getByRole("button", { name: "\u6dfb\u52a0", exact: true }).click();
    await assertPortal();
    await confirm();
    await expect(dialog()).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("\u5206\u7c7b\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a");
    await fill(newName);
    await confirm();
    await expect(row(primary, newName)).toBeVisible();
    await expect(secondary.locator("[data-category-id]")).toHaveCount(0);

    await secondary.getByRole("button", { name: "\u6dfb\u52a0", exact: true }).click();
    await fill("Child");
    await confirm();
    await row(secondary, "Child").getByTitle("\u7f16\u8f91\u540d\u79f0").click();
    await expect(dialog().getByRole("textbox")).toHaveValue("Child");
    await fill("Child edited");
    await confirm();
    await row(secondary, "Child edited").getByTitle("\u5220\u9664\u5206\u7c7b").click();
    await dialog().getByRole("button", { name: "\u53d6\u6d88", exact: true }).click();
    await expect(row(secondary, "Child edited")).toBeVisible();

    await row(primary, newName).getByTitle("\u7f16\u8f91\u540d\u79f0").click();
    const edited = `${newName}-edited`;
    await fill(edited);
    await confirm();
    await expect(row(secondary, "Child edited")).toBeVisible();
    await row(primary, edited).getByTitle("\u590d\u5236\u5206\u7c7b").click();
    const copy = row(primary, `${edited}-\u526f\u672c`);
    await expect(copy).toBeVisible();
    await copy.getByTitle("\u5220\u9664\u5206\u7c7b").click();
    await confirm();
    await expect(copy).toHaveCount(0);
    await expect(row(secondary, "Child edited")).toBeVisible();

    await root.getByRole("button", { name: Object.keys(initial).find(key => key !== type), exact: true }).click();
    await root.getByRole("button", { name: type, exact: true }).click();
    await row(primary, edited).click();
    await expect(row(secondary, "Child edited")).toBeVisible();
    await row(primary, edited).getByTitle("\u5220\u9664\u5206\u7c7b").click();
    await confirm();
    assert.deepEqual(await readNodes(primary), nodes.map(({ id, name }) => ({ id, name })));
    assert.deepEqual(await readNodes(secondary), nodes[0].children);

    await secondary.getByRole("button", { name: "\u6dfb\u52a0", exact: true }).click();
    await fill("After deletion");
    await confirm();
    await row(secondary, "After deletion").getByTitle("\u5220\u9664\u5206\u7c7b").click();
    await confirm();
    assert.deepEqual(await readNodes(secondary), nodes[0].children);
    console.log(`PASS: ${type} preserves categories; add, edit, copy, cancel, delete and tab switching`);
  }

  await root.getByRole("button", { name: "\u6210\u7247", exact: true }).click();
  await page.screenshot({ path: "tmp/admin-two-level-categories.png" });
  let occupied = 0;
  for (const node of initial["\u6210\u7247"]) {
    const usage = await page.evaluate(async id => (await import("/src/lib/resourceConfig.ts")).resourceConfigStore.categoryUsage("finished", id), node.id);
    await primary.locator(`[data-category-id="${node.id}"]`).getByTitle("\u5220\u9664\u5206\u7c7b").click();
    if (usage) {
      occupied++;
      await expect(dialog()).toHaveCount(0);
      await expect(page.getByRole("status")).toContainText("存在资源");
    } else await confirm();
  }
  await expect(primary.locator("[data-category-id]")).toHaveCount(occupied);
  await primary.getByRole("button", { name: "\u6dfb\u52a0", exact: true }).click();
  await fill("Restored");
  await confirm();
  await secondary.getByRole("button", { name: "\u6dfb\u52a0", exact: true }).click();
  await fill("Restored child");
  await confirm();
  await expect(row(secondary, "Restored child")).toBeVisible();
  await page.setViewportSize({ width: 900, height: 650 });
  await row(secondary, "Restored child").getByTitle("\u7f16\u8f91\u540d\u79f0").click();
  await assertPortal();
  await page.keyboard.press("Escape");
  await expect(dialog()).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });

  await button("\u7cfb\u7edf\u7ba1\u7406").click();
  await button("\u7cfb\u7edf\u8bbe\u7f6e").click();
  await expect(page.getByText("\u5206\u7c7b\u641c\u7d22\u5f00\u5173", { exact: true })).toBeVisible();
  assert.equal(await page.getByText(/\u4e3b\s*\u7c7b\s*\u76ee/).count(), 0);
  assert.deepEqual(errors, []);
  console.log("PASS: in-use categories protected, unoccupied categories removable, dialog portal, no page errors");
} finally {
  await browser.close();
}
