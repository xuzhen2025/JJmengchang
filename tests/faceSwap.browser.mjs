import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium, expect } = require("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const root = new URL(process.env.PREVIEW_DIR || "../docs/previews/", import.meta.url);
await mkdir(root, { recursive: true });
const screenshot = (name) => page.screenshot({ path: fileURLToPath(new URL(`video-face-swap-${name}.png`, root)) });
const waitText = (text) => page.getByText(text, { exact: true }).first().waitFor({ state: "visible", timeout: 15000 });
const assertResultActions = async (visible) => {
  for (const name of ["下载视频", "上传资源库"]) {
    const button = page.getByTestId("face-result-panel").getByRole("button", { name, exact: true });
    if (visible) await expect(button).toBeEnabled();
    else await expect(button).toHaveCount(0);
  }
};
const assertLayout = async () => {
  const layout = await page.getByTestId("face-swap-workspace").evaluate((workspace) => {
    const box = (selector) => {
      const element = workspace.querySelector(selector);
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
    };
    const rect = workspace.getBoundingClientRect();
    return {
      width: innerWidth, height: innerHeight, center: rect.x + rect.width / 2,
      pageOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
      body: box('[data-testid="face-swap-body"]'), roles: box('[data-testid="face-roles-panel"]'), list: box('[data-testid="face-role-list"]'),
      source: box('[data-testid="face-source-panel"]'), result: box('[data-testid="face-result-panel"]'), footer: box("footer"), nav: box('nav[aria-label="换脸阶段"]'),
      videoAreas: [...workspace.querySelectorAll('[data-testid="face-source-panel"] > div:last-child, [data-testid="face-result-panel"] > div:last-child')].map((el) => el.getBoundingClientRect().height),
      hasResult: Boolean(workspace.querySelector('[data-testid="face-result-panel"] video')),
      resultActions: [...workspace.querySelectorAll('[data-testid="face-result-panel"] button')].map((button) => {
        const bounds = button.getBoundingClientRect();
        return { text: button.textContent, height: bounds.height, x: bounds.x, right: bounds.right, y: bounds.y, clipped: button.scrollWidth > button.clientWidth };
      }),
    };
  });
  assert.equal(layout.pageOverflow, false);
  assert.ok(layout.body.scrollHeight <= layout.body.clientHeight + 1, JSON.stringify(layout));
  assert.ok(Math.abs(layout.nav.x + layout.nav.width / 2 - layout.center) < 2);
  assert.ok(layout.footer.bottom <= layout.height);
  assert.ok(layout.source.bottom < layout.result.y);
  assert.ok(layout.result.bottom <= layout.footer.y);
  assert.ok(layout.videoAreas.every((height) => height >= (layout.width >= 768 ? 100 : 40)), JSON.stringify(layout));
  assert.deepEqual(layout.resultActions.map((button) => button.text), layout.hasResult ? ["下载视频", "上传资源库"] : []);
  if (layout.hasResult) {
    assert.ok(layout.resultActions.every((button) => button.height === 36 && !button.clipped && button.right <= layout.result.right));
    assert.equal(layout.resultActions[0].y, layout.resultActions[1].y);
    assert.ok(layout.resultActions[0].right < layout.resultActions[1].x);
    assert.ok(Math.abs(layout.resultActions[1].right - layout.result.right) < 1);
  }
  if (layout.width >= 768) assert.ok(layout.roles.right < layout.source.x);
  return layout;
};
try {
  // In-memory task scenarios must not be reset by unrelated workspace edits.
  await page.routeWebSocket(/ws:\/\/localhost:3000\//, (socket) => socket.close());
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "快速创作", exact: true }).click();
  await page.getByText("视频换脸", { exact: true }).click();
  await screenshot("upload");
  await page.getByRole("button", { name: "选择视频", exact: true }).click();
  await page.getByText("梦畅_视频换脸演示.mp4", { exact: true }).click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await waitText("待配置");
  assert.equal(await page.getByTestId("face-group").count(), 3);
  assert.equal(await page.getByTestId("face-result-panel").locator("video").count(), 0);
  await waitText("暂无换脸结果");
  const emptyLayout = await assertLayout();
  await page.getByRole("button", { name: "播放原视频", exact: true }).click();
  await page.waitForTimeout(250);
  assert.ok(await page.getByTestId("face-source-panel").locator("video").evaluate((video) => !video.paused && video.currentTime > 0));
  await page.getByRole("button", { name: "暂停原视频", exact: true }).click();
  await page.getByRole("button", { name: "展开角色2截图" }).click();
  const beforeScroll = await assertLayout();
  await page.getByTestId("face-role-list").hover();
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(150);
  assert.ok(await page.getByTestId("face-role-list").evaluate((list) => list.scrollTop > 0));
  const afterScroll = await assertLayout();
  assert.equal(beforeScroll.source.y, afterScroll.source.y);
  assert.equal(beforeScroll.footer.y, afterScroll.footer.y);
  const mixed = page.getByTestId("face-group").nth(1);
  await mixed.getByRole("checkbox").last().check();
  await mixed.getByRole("button", { name: "独立形象" }).click();
  assert.equal(await page.getByTestId("face-group").count(), 4);
  await page.getByRole("button", { name: "撤销上一步" }).click();
  assert.equal(await page.getByTestId("face-group").count(), 3);
  await page.getByTestId("face-group").nth(2).getByTitle("合并去重").click();
  const merge = page.getByRole("dialog", { name: "合并去重", exact: true });
  await merge.getByRole("radio").first().check();
  await merge.getByRole("button", { name: "确认合并" }).click();
  assert.equal(await page.getByTestId("face-group").count(), 2);
  await page.getByRole("button", { name: "选择角色1替换人像" }).click();
  await page.getByText("人像03.jpg", { exact: true }).click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await waitText("已配置替换人像");
  await screenshot("roles");
  await page.getByRole("button", { name: /开始换脸/ }).click();
  await waitText("排队中");
  assert.equal(await page.getByTestId("face-result-panel").locator("video").count(), 0);
  assert.equal(await page.getByTestId("face-group").count(), 2);
  await assertLayout();
  await page.getByRole("button", { name: "取消排队", exact: true }).click();
  await waitText("已取消");
  await assertResultActions(false);
  await page.getByRole("button", { name: /开始换脸/ }).click();
  await waitText("处理中");
  await assertResultActions(false);
  await waitText("处理成功");
  await waitText("版本1");
  assert.equal(await page.getByTestId("face-group").count(), 2);
  assert.equal(await page.getByTestId("face-result-panel").locator("video").count(), 1);
  const completedLayout = await assertLayout();
  assert.deepEqual(completedLayout.videoAreas, emptyLayout.videoAreas);
  await page.getByRole("button", { name: "播放对比" }).click();
  await page.waitForTimeout(500);
  const playback = await page.getByTestId("face-compare-player").locator("video").evaluateAll((videos) => videos.map((video) => ({ time: video.currentTime, paused: video.paused })));
  assert.ok(playback.every((video) => !video.paused && video.time > 0));
  assert.ok(Math.abs(playback[0].time - playback[1].time) < 0.2);
  await page.getByRole("button", { name: "暂停对比" }).click();
  await page.getByRole("slider", { name: "对比播放进度" }).fill("6");
  await page.getByRole("slider", { name: "对比播放进度" }).dispatchEvent("input");
  await page.waitForTimeout(150);
  const seek = await page.getByTestId("face-compare-player").locator("video").evaluateAll((videos) => videos.map((video) => video.currentTime));
  assert.ok(seek.every((time) => Math.abs(time - 6) < 0.2));
  await page.getByRole("button", { name: /再次换脸/ }).click();
  await waitText("排队中");
  await assertResultActions(true);
  await waitText("处理中");
  await assertResultActions(true);
  await page.getByTitle("返回快速创作").click();
  await page.waitForTimeout(6500);
  await page.getByText("视频换脸", { exact: true }).click();
  await waitText("处理成功");
  const versions = page.getByRole("combobox", { name: "换脸结果版本" });
  assert.equal(await versions.locator("option:not([disabled])").count(), 2);
  await versions.selectOption({ label: "版本1" });
  const selectedVersionId = await versions.inputValue();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="face-compare-player"] video')].every((video) => video.readyState >= 2));
  const captureFrames = () => page.getByTestId("face-compare-player").locator("video").evaluateAll((videos) => videos.map((video) => {
    const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 36;
    const context = canvas.getContext("2d"); context.drawImage(video, 0, 0, 64, 36);
    const pixels = context.getImageData(0, 0, 64, 36).data;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 4) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
    return { colors: colors.size, poster: video.poster, time: video.currentTime };
  }));
  let frameChecks;
  await expect.poll(async () => {
    frameChecks = await captureFrames();
    return frameChecks.every((frame) => frame.colors > 100 && frame.poster === "" && frame.time < 0.1);
  }).toBe(true);
  await screenshot("results");
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await assertLayout();
    await screenshot(`results-${viewport.width}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载视频", exact: true }).click();
  const downloaded = await downloadPromise;
  assert.equal(downloaded.suggestedFilename(), "梦畅_视频换脸演示_换脸_版本1.mp4");
  await page.getByRole("button", { name: "上传资源库", exact: true }).click();
  const uploadPage = page.locator("main").getByTestId("video-upload-page");
  await expect(uploadPage).toBeVisible();
  await expect(page.getByTestId("face-swap-workspace")).toHaveCount(0);
  await expect(page.locator('[data-overlay-layer="modal"]')).toHaveCount(0);
  await waitText("梦畅_视频换脸演示_换脸_版本1.mp4");
  assert.equal(await page.getByText("梦畅_视频换脸演示_换脸_版本2.mp4", { exact: true }).count(), 0);
  await uploadPage.getByRole("button", { name: "返回列表", exact: true }).click();
  await expect(versions).toHaveValue(selectedVersionId);
  await assertResultActions(true);
  await page.getByRole("button", { name: "上传资源库", exact: true }).click();
  await expect(uploadPage).toBeVisible();
  await expect(uploadPage.getByText("梦畅_视频换脸演示_换脸_版本1.mp4", { exact: true })).toBeVisible();
  await screenshot("publish");
  assert.equal(await page.locator('input[type="file"]').count(), 0);
  await page.getByRole("button", { name: "发布", exact: true }).click();
  await waitText("视频已成功发布至资源库");
  await page.getByRole("button", { name: "资源库", exact: true }).click();
  await waitText("梦畅_视频换脸演示_换脸_版本1.mp4");
  assert.equal(await page.getByText("梦畅_视频换脸演示_换脸_版本2.mp4", { exact: true }).count(), 0);
  await page.getByTitle(/当前有.*个任务进行中|打开任务队列/).click();
  await page.getByRole("button", { name: "全部任务", exact: true }).first().click();
  await page.getByRole("button", { name: "视频换脸", exact: true }).click();
  const record = page.locator("article").filter({ hasText: "梦畅_视频换脸演示_视频换脸" });
  assert.equal(await record.count(), 1);
  const recordText = await record.innerText();
  assert.ok(recordText.includes("-120.00") && recordText.includes("40.00"));
  await screenshot("queue");
  await record.getByRole("button", { name: "查看任务", exact: true }).click();
  await page.getByTestId("face-swap-workspace").waitFor();
  assert.equal(await page.getByRole("combobox", { name: "换脸结果版本" }).inputValue(), selectedVersionId);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  await assertLayout();
  await screenshot("mobile-results");
  await page.getByRole("navigation", { name: "换脸阶段" }).getByRole("button", { name: "角色设定", exact: true }).click();
  assert.equal(await page.getByTestId("face-result-panel").locator("video").count(), 1);
  assert.equal(await page.getByTestId("face-group").count(), 2);
  await assertLayout();
  await screenshot("mobile-roles");
  await page.setViewportSize({ width: 1440, height: 900 });
  const portraitChecks = await page.evaluate(async () => {
    const { validateFacePortrait } = await import("/src/lib/facePortraitValidation.ts");
    const single = await validateFacePortrait("./assets/face-swap/portrait-a.jpg");
    const empty = document.createElement("canvas"); empty.width = empty.height = 320;
    const context = empty.getContext("2d"); context.fillStyle = "#ffffff"; context.fillRect(0, 0, 320, 320);
    const noFace = await validateFacePortrait(empty.toDataURL());
    const portrait = new Image(); portrait.src = "./assets/face-swap/portrait-a.jpg"; await portrait.decode();
    const multi = document.createElement("canvas"); multi.width = 640; multi.height = 400;
    const multiContext = multi.getContext("2d"); multiContext.drawImage(portrait, 0, 0); multiContext.drawImage(portrait, 320, 0);
    const multiple = await validateFacePortrait(multi.toDataURL());
    multi.width = 320; const blurContext = multi.getContext("2d"); blurContext.filter = "blur(18px)"; blurContext.drawImage(portrait, 0, 0);
    const blurred = await validateFacePortrait(multi.toDataURL());
    return { single, noFace, multiple, blurred };
  });
  assert.equal(portraitChecks.single, null);
  assert.ok(portraitChecks.noFace); assert.ok(portraitChecks.multiple?.includes("多张人脸")); assert.ok(portraitChecks.blurred);
  await page.getByRole("button", { name: "更换视频", exact: true }).click();
  await page.getByRole("button", { name: "本地上传", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(fileURLToPath(new URL("../public/assets/face-swap/demo.mp4", import.meta.url)));
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await waitText("待配置");
  await waitText("demo.mp4");
  assert.equal(await page.getByTestId("face-group").count(), 3);
  await page.getByRole("button", { name: "更换视频", exact: true }).click();
  await page.getByText("梦畅_无人脸案例.mp4", { exact: true }).click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await waitText("分析失败");
  assert.equal(await page.getByTestId("face-group").count(), 0);
  assert.ok(await page.getByRole("button", { name: /开始换脸/ }).isDisabled());
  await screenshot("no-faces");
  await page.getByRole("button", { name: "更换视频", exact: true }).click();
  await page.getByText("梦畅_处理失败案例.mp4", { exact: true }).click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await waitText("待配置");
  await page.getByRole("button", { name: "选择角色1替换人像" }).click();
  await page.getByText("人像01.jpg", { exact: true }).click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await waitText("已配置替换人像");
  const creditBeforeFailure = await page.getByText(/^\d+\.\d{2}$/).first().innerText();
  await page.getByRole("button", { name: /开始换脸/ }).click();
  await waitText("处理失败");
  await assertResultActions(false);
  assert.equal(await page.getByText(/^\d+\.\d{2}$/).first().innerText(), creditBeforeFailure);
  assert.equal(await page.getByRole("combobox", { name: "换脸结果版本" }).count(), 0);
  await screenshot("failed");
  assert.deepEqual(errors, []);
  console.log("Face swap browser checks passed", JSON.stringify({ playback, seek, frameChecks, recordText, portraitChecks }));
} catch (error) {
  await screenshot("test-failure");
  console.error("FAILURE_STATE", (await page.locator("body").innerText()).slice(-4500));
  throw error;
} finally { await browser.close(); }
