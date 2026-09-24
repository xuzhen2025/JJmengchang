import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  for (const [scope, partition, label, mime] of [
    ["finished", "成片", "上传视频", "video/mp4"], ["materials", "素材", "上传视频", "video/mp4"],
    ["images", "图片", "上传图片", "image/png"], ["audio", "音频", "上传音频", "audio/mpeg"], ["scripts", "脚本", "上传脚本", null],
  ]) {
    await page.locator("#sidebar-item-home").click();
    await page.locator("#sidebar-item-resources").click();
    await page.evaluate(async ({ scope, partition }) => {
      const { resourceConfigStore: store } = await import("/src/lib/resourceConfig.ts");
      store.setCategories(prev => ({ ...prev, [partition]: [...prev[partition], { id: `upload-${scope}`, name: "秋季商品", children: [{ id: `upload-${scope}-child`, name: "通勤展示" }] }] }));
      if (["finished", "materials", "scripts"].includes(scope)) {
        const kind = scope === "scripts" ? "script" : "video";
        store.setStatusCatalog(kind, prev => prev.map((s, i) => ({ ...s, isDefault: i === 1 })));
      }
    }, { scope, partition });
    await button("上传文件").click();
    await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    if (partition === "素材") await page.getByRole("radio", { name: "素材", exact: true }).check();
    const category = page.getByRole("combobox", { name: "资源分类", exact: true });
    await category.click();
    const popup = page.locator('[data-overlay-layer="popover"]').last();
    await expect(popup).toBeVisible();
    await popup.getByText("秋季商品", { exact: true }).click();
    await popup.getByText("通勤展示", { exact: true }).click();
    await expect(category).toHaveValue("秋季商品 / 通勤展示");
    if (mime) {
      await page.locator('input[type="file"]').first().setInputFiles({ name: `${scope}-category-file.${mime.split("/")[1]}`, mimeType: mime, buffer: Buffer.from("prototype-file") });
      await button("发布").click();
      await expect.poll(() => page.evaluate(async scope => (await import("/src/lib/resourceUploads.ts")).getUploadedResources().some(r => r.name.startsWith(`${scope}-category-file`)), scope)).toBe(true);
      const uploaded = await page.evaluate(async scope => {
        const { resourceConfigStore: store } = await import("/src/lib/resourceConfig.ts");
        const resource = (await import("/src/lib/resourceUploads.ts")).getUploadedResources().find(r => r.name.startsWith(`${scope}-category-file`));
        return { resource: store.project(scope, resource), count: store.categoryUsage(scope, `upload-${scope}-child`), defaultStatus: store.defaultStatus(scope) };
      }, scope);
      assert.equal(uploaded.resource.category, "秋季商品 / 通勤展示");
      assert.equal(uploaded.count, 1);
      if (["finished", "materials"].includes(scope)) assert.equal(uploaded.resource.status, uploaded.defaultStatus);
    }
    console.log(`PASS: ${scope} upload selector uses current catalog${mime ? "; published resource uses category and status defaults" : ""}`);
  }
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: "tmp/resource-upload-category-failure.png" });
  throw error;
} finally { await browser.close(); }
