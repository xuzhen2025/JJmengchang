import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const cases = [
  { scope: "finished", tab: "\u6210\u7247\u7ba1\u7406", id: "fv1", module: "/src/data/finishedVideos.ts", exportName: "INITIAL_FINISHED" },
  { scope: "materials", tab: "\u7d20\u6750\u7ba1\u7406", id: "fv1", module: "/src/components/MaterialsView.tsx", exportName: "INITIAL_FINISHED" },
  { scope: "thirdParty", tab: "\u7b2c\u4e09\u65b9\u7ba1\u7406", id: "third-party-1", module: "/src/data/thirdPartyVideos.ts", exportName: "INITIAL_THIRD_PARTY" },
  { scope: "images", tab: "\u56fe\u7247\u7ba1\u7406", id: "img-1", title: "\u9632\u6652\u690d\u7269\u63d0\u53d6\u7cbe\u534e\u6db2\u5c55\u56fe.jpg" },
  { scope: "audio", tab: "\u97f3\u9891\u7ba1\u7406", id: "aud-1", title: "\u73b0\u5728\u6d01\u7259" },
  { scope: "scripts", tab: "\u811a\u672c\u7ba1\u7406", id: "S-10291", title: "\u811a\u672c 1 - \u53e3\u64ad\u6e29\u548c\u6d01\u9762\u7834\u5708\u6848" },
];
const openDetail = async fixture => {
  await page.locator("#sidebar-item-operation_records").click();
  await page.locator("#sidebar-item-resources").click();
  await button(fixture.tab).click();
  const title = fixture.title || await page.evaluate(async fixture => {
    const module = await import(fixture.module);
    return module[fixture.exportName].find(item => item.id === fixture.id).title;
  }, fixture);
  await page.getByText(title, { exact: true }).first().click();
  await expect(page.getByRole("button", { name: /\u6dfb\u52a0\u4e2a\u4eba\u6807\u7b7e/ })).toBeVisible();
};
const readTags = (fixture, kind) => page.evaluate(async ({ scope, id, kind }) => {
  const { resourceTagStore } = await import("/src/lib/resourceTags.ts");
  return resourceTagStore.project(scope, { id })[kind === "public" ? "publicTags" : "personalTags"];
}, { ...fixture, kind });
const clearDraft = async dialog => {
  const removeButtons = dialog.getByRole("button", { name: "\u00d7", exact: true });
  while (await removeButtons.count()) await removeButtons.first().click();
};

try {
  await mkdir("tmp/resource-tag-removal", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3005/", { waitUntil: "domcontentloaded" });

  for (const fixture of cases) {
    await openDetail(fixture);
    for (const [kind, label] of [["public", "\u516c\u5171\u6807\u7b7e"], ["personal", "\u4e2a\u4eba\u6807\u7b7e"]]) {
      const row = page.getByText(new RegExp("^" + label + ":?$")).locator("..");
      const entry = row.getByRole("button", { name: new RegExp("\u6dfb\u52a0" + label) });
      const dialog = page.getByRole("dialog", { name: "\u5173\u8054" + label, exact: true });
      await expect(row.getByRole("button")).toHaveCount(1);
      await expect(page.getByTitle("\u5220\u9664\u6807\u7b7e", { exact: true })).toHaveCount(0);

      await entry.click();
      await clearDraft(dialog);
      const checkbox = dialog.getByRole("checkbox").first();
      const tag = (await checkbox.locator("..").innerText()).trim();
      await checkbox.check();
      await dialog.getByRole("button", { name: "\u786e\u5b9a", exact: true }).click();
      await expect(row.getByText(tag, { exact: true })).toBeVisible();
      await expect.poll(() => readTags(fixture, kind)).toEqual([tag]);
      if (kind === "personal") await page.screenshot({ path: "tmp/resource-tag-removal/" + fixture.scope + ".png", animations: "disabled" });

      await entry.click();
      await clearDraft(dialog);
      assert.deepEqual(await readTags(fixture, kind), [tag]);
      await dialog.getByRole("button", { name: "\u53d6\u6d88", exact: true }).click();
      await expect(row.getByText(tag, { exact: true })).toBeVisible();
      assert.deepEqual(await readTags(fixture, kind), [tag]);

      await entry.click();
      await dialog.getByRole("checkbox", { name: tag, exact: true }).uncheck();
      assert.deepEqual(await readTags(fixture, kind), [tag]);
      await dialog.getByRole("button", { name: "\u786e\u5b9a", exact: true }).click();
      await expect(row.getByText(tag, { exact: true })).toHaveCount(0);
      await expect.poll(() => readTags(fixture, kind)).toEqual([]);

      await entry.click();
      await dialog.getByRole("checkbox", { name: tag, exact: true }).check();
      await dialog.getByRole("button", { name: "\u786e\u5b9a", exact: true }).click();
      await entry.click();
      await clearDraft(dialog);
      await dialog.getByRole("button", { name: "\u786e\u5b9a", exact: true }).click();
      await expect.poll(() => readTags(fixture, kind)).toEqual([]);

      await openDetail(fixture);
      await expect(row.getByRole("button")).toHaveCount(1);
      await expect(row.getByText(tag, { exact: true })).toHaveCount(0);
      await entry.click();
      await expect(dialog.getByRole("checkbox", { name: tag, exact: true })).not.toBeChecked();
      await dialog.getByRole("button", { name: "\u53d6\u6d88", exact: true }).click();
      console.log("PASS: " + fixture.scope + " " + kind + " tags only change through confirmed dialog edits; cancellation, last-tag removal and reopening verified.");
    }
  }
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: "tmp/resource-tag-removal/failure.png", animations: "disabled" }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
