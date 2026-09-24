import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const cases = [["watermark", "视频去水印"], ["subtitle", "字幕擦除"], ["enhance", "画质增强"]];
const statuses = ["queue", "generating", "completed", "failed", "cancelled"];
try {
  // Expand existing examples only in this browser to exercise every task state.
  await page.route("**/src/data.ts*", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}
      for (const category of ["watermark", "subtitle", "enhance"]) {
        const sample = INITIAL_TASKS.find(task => task.category === category);
        const sampleOutput = INITIAL_TASKS.find(task => task.watermarkOutput).watermarkOutput;
        for (const status of ["queue", "generating", "completed", "failed", "cancelled"]) {
          INITIAL_TASKS.push({ ...structuredClone(sample), id: "queue-test-" + category + status,
            name: "queue-test-" + category + status, status, autoProgress: false,
            progress: status === "completed" ? 100 : status === "generating" ? 50 : 0,
            [category + "Output"]: status === "completed" ? structuredClone(sampleOutput) : undefined });
        }
      }
    ` });
  });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "快速创作", exact: true }).click();
  const draft = "保留当前工作台的未提交内容";
  await page.locator("#quick-creation-prompt").fill(draft);
  await page.locator('[data-overlay-layer="drawer"][role="button"]').click();
  const panel = page.locator('[data-overlay-layer="drawer"][role="complementary"]');
  await panel.getByRole("button", { name: "全部任务", exact: true }).first().click();
  await expect(panel.locator("header").getByText(/^(排队中|生成中|生成失败)$/)).toHaveCount(0);
  await expect(panel.locator("header span").last()).toHaveText(String(await panel.locator("article").count()));
  const headerBox = await panel.locator("header").boundingBox();
  const tabsBox = await panel.getByRole("button", { name: "近期任务", exact: true }).boundingBox();
  assert.ok(tabsBox.y - (headerBox.y + headerBox.height) < 16);
  await panel.screenshot({ path: "tmp/task-queue-without-summary.png" });
  const url = page.url();
  const homeClass = await page.locator("#sidebar-item-quick_creation").getAttribute("class");
  const publishedResources = () => page.evaluate(async () => (await import("/src/lib/resourceUploads.ts")).getUploadedResources());
  for (const [category, label] of cases) {
    await panel.getByRole("button", { name: label, exact: true }).click();
    await expect(panel.getByRole("button", { name: "查看任务", exact: true })).toHaveCount(0);
    for (const status of statuses) {
      const name = `queue-test-${category}${status}`;
      const card = panel.locator("article").filter({ has: page.getByText(name, { exact: true }) });
      await card.getByRole("button", { name: "查看结果", exact: true }).click();
      await expect(panel.getByRole("heading", { name: category === "enhance" ? "视频画质增强" : label, exact: true })).toBeVisible();
      await expect(panel.locator("video")).toBeVisible();
      await expect(panel.getByText(name, { exact: true })).toBeVisible();
      assert.equal(page.url(), url);
      assert.equal(await page.locator("#sidebar-item-quick_creation").getAttribute("class"), homeClass);
      await expect(panel.getByRole("button", { name: "下载视频", exact: true })).toHaveCount(status === "completed" ? 1 : 0);
      await expect(panel.getByRole("button", { name: "上传资源库", exact: true })).toHaveCount(status === "completed" ? 1 : 0);
      if (category === "watermark" && status === "completed") await page.screenshot({ path: "tmp/task-queue-result.png" });
      if (status === "completed") {
        const filename = `${name}-selected.mp4`;
        await panel.locator("input").fill(filename);
        const previewUrl = await panel.locator("video").getAttribute("src");
        const before = await publishedResources();
        const uploadPage = page.locator("main").getByTestId("video-upload-page");
        await panel.getByRole("button", { name: "上传资源库", exact: true }).click();
        await expect(uploadPage).toBeVisible();
        await expect(uploadPage.getByText(filename)).toBeVisible();
        await expect(panel).toHaveCount(0);
        await expect(page.locator('[data-overlay-layer="drawer"]')).toHaveCount(0);
        await expect(page.locator('[data-overlay-layer="modal"]')).toHaveCount(0);
        await expect(page.locator("#quick-creation-prompt")).toBeHidden();
        await uploadPage.getByRole("button", { name: "返回列表", exact: true }).click();
        await expect(panel.locator("input")).toHaveValue(filename);
        await expect(page.locator("#quick-creation-prompt")).toHaveValue(draft);
        assert.equal((await publishedResources()).length, before.length);
        await panel.getByRole("button", { name: "上传资源库", exact: true }).click();
        await uploadPage.getByRole("button", { name: "发布", exact: true }).click();
        await expect(page.getByText("视频已成功发布至资源库", { exact: true })).toBeVisible();
        await expect(uploadPage).toHaveCount(0);
        await expect(panel.getByText(name, { exact: true })).toBeVisible();
        await expect(panel.locator("input")).toHaveValue(filename);
        await expect(page.locator("#quick-creation-prompt")).toHaveValue(draft);
        const after = await publishedResources();
        assert.equal(after.length, before.length + 1);
        assert.equal(after[0].name, filename);
        assert.equal(after[0].url, previewUrl);
      }
      await panel.getByTitle("返回任务列表").click();
      await expect(card).toBeVisible();
    }
    console.log(`PASS: ${category} uses 查看结果 and inline results for all five states`);
  }
  await panel.getByRole("button", { name: "爆款复刻", exact: true }).click();
  await expect(panel.getByRole("button", { name: "查看任务", exact: true }).first()).toBeVisible();
  await panel.getByRole("button", { name: "视频去水印", exact: true }).click();
  await panel.locator("article").filter({ has: page.getByText("queue-test-watermarkcompleted", { exact: true }) }).getByRole("button", { name: "查看结果", exact: true }).click();
  await panel.getByRole("button", { name: "上传资源库", exact: true }).click();
  const beforeNavigation = (await publishedResources()).length;
  await page.locator("#sidebar-item-resources").click();
  await expect(page.getByTestId("video-upload-page")).toHaveCount(0);
  await expect(panel).toHaveCount(0);
  assert.equal((await publishedResources()).length, beforeNavigation);
  assert.deepEqual(errors, []);
  console.log("PASS: other task actions unchanged; no page navigation or runtime errors");
} finally { await browser.close(); }
