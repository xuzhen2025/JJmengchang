import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  for (const [label, start] of [["视频去水印", "开始去水印"], ["字幕擦除", "开始擦除字幕"], ["画质增强", "开始增强"]]) {
    await page.getByRole("button", { name: "快速创作", exact: true }).click();
    await page.getByText(label, { exact: true }).click();
    await page.getByRole("button", { name: /^选择视频/ }).click();
    await page.getByRole("button", { name: "本地上传", exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles(fileURLToPath(new URL("../public/assets/face-swap/demo.mp4", import.meta.url)));
    await page.getByRole("button", { name: "确认选择", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(start) }).click();
    const uploadButton = page.getByRole("button", { name: "上传资源库", exact: true });
    await expect(uploadButton).toBeVisible({ timeout: 20000 });
    const filename = `${label}-完整结果.mp4`;
    await page.locator("main input:not([type])").fill(filename);
    await page.getByTitle("播放", { exact: true }).click();
    await expect(page.getByTitle("暂停", { exact: true })).toBeVisible();
    const outputUrl = await page.locator("main video").first().getAttribute("src");
    await uploadButton.click();
    const uploadPage = page.locator("main").getByTestId("video-upload-page");
    await expect(uploadPage).toBeVisible();
    await expect(uploadPage.getByText(filename)).toBeVisible();
    await expect(page.getByRole("heading", { name: label, exact: true })).toHaveCount(0);
    await expect(page.locator('[data-overlay-layer="modal"]')).toHaveCount(0);
    await uploadPage.getByRole("button", { name: "返回列表", exact: true }).click();
    await expect(page.locator("main input:not([type])")).toHaveValue(filename);
    await expect(page.getByTitle("播放", { exact: true })).toBeVisible();
    await uploadButton.click();
    await uploadPage.getByRole("button", { name: "发布", exact: true }).click();
    await expect(page.getByText("视频已成功发布至资源库", { exact: true })).toBeVisible();
    await expect(uploadPage).toHaveCount(0);
    await expect(uploadButton).toBeVisible();
    const uploaded = await page.evaluate(async () => (await import("/src/lib/resourceUploads.ts")).getUploadedResources());
    const resource = uploaded.find(item => item.name === filename);
    assert.ok(resource);
    assert.equal(resource.url, outputUrl);
    console.log(`PASS: ${label} opens full upload page, returns to result, and publishes the selected file`);
  }
  assert.deepEqual(errors, []);
} catch (error) {
  console.error("Runtime errors:", errors);
  console.error("Current page:", await page.locator("body").innerText());
  throw error;
} finally { await browser.close(); }
