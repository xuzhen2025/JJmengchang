import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.setDefaultTimeout(12000);
await mkdir("tmp/quick-creation-workspace", { recursive: true });
const controls = page.getByTestId("quick-creation-controls");
const records = page.getByTestId("quick-creation-records");
const articles = records.locator("article[data-task-id]");
const waitForCompleted = async () => {
  await page.waitForFunction(() => document.querySelector('[data-testid="quick-creation-records"] article[data-task-id]:last-child')?.getAttribute("data-status") === "completed");
};
const shot = (name) => page.screenshot({ path: `tmp/quick-creation-workspace/${name}.png` });

async function checkDesktopLayout() {
  const left = await controls.boundingBox();
  const right = await records.boundingBox();
  const submit = await controls.locator('button[type="submit"]').boundingBox();
  assert.ok(left.x + left.width < right.x, JSON.stringify({ left, right }));
  assert.equal(left.y, right.y);
  assert.equal(left.height, right.height);
  assert.ok(submit.y + submit.height <= page.viewportSize().height);
  assert.ok(right.x + right.width <= page.viewportSize().width);
  assert.equal(await records.getByRole("heading", { name: "生成记录", exact: true }).count(), 1);
}

try {
  await page.routeWebSocket(/ws:\/\/localhost:3000\//, (socket) => socket.close());
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "快速创作", exact: true }).click();
  assert.equal(await records.isVisible(), false);
  await controls.getByTitle("添加参考内容").click();
  await page.locator("tbody tr").first().click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await controls.locator("textarea").fill("护肤礼盒的自然光产品主图");
  await controls.locator('button[type="submit"]').click();
  await waitForCompleted();
  await records.getByRole("heading", { name: "已为你生成 1 张图片", exact: true }).waitFor();
  assert.equal(await records.getByText("护肤礼盒的自然光产品主图", { exact: true }).count(), 0);
  assert.equal(await records.getByRole("button", { name: "再次生成", exact: true }).count(), 0);
  assert.equal(await articles.first().getByRole("button", { name: /上传资源库/ }).isDisabled(), true);
  await checkDesktopLayout();
  assert.equal(await controls.locator("textarea").inputValue(), "护肤礼盒的自然光产品主图");
  assert.equal(await controls.getByTitle("删除参考内容").count(), 1);
  await shot("image-1440");

  await controls.getByRole("button", { name: "生成视频", exact: true }).click();
  await controls.locator("textarea").fill("镜头缓慢推进，展示护肤礼盒");
  await controls.locator('button[type="submit"]').click();
  await waitForCompleted();
  await articles.last().getByRole("heading", { name: "已为你生成 1 个视频", exact: true }).waitFor();
  assert.equal(await articles.count(), 2);
  assert.match(await articles.first().innerText(), /快速创作图片/);
  assert.match(await articles.last().innerText(), /快速创作视频/);
  const list = records.locator("div.overflow-y-auto").first();
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-testid="quick-creation-records"] div.overflow-y-auto');
    return element.scrollHeight - element.clientHeight - element.scrollTop < 2;
  });
  await articles.last().getByTitle(/^预览 /).click();
  assert.equal(await page.locator("video[controls]").count(), 1);
  await page.getByTitle("关闭预览").click();
  assert.equal(await articles.last().getByTitle("下载视频").count(), 1);
  await checkDesktopLayout();
  await shot("mixed-1440");
  await controls.getByRole("button", { name: "生成图片", exact: true }).click();
  assert.equal(await articles.count(), 2);
  await articles.first().getByRole("button", { name: "重新编辑", exact: true }).click();
  assert.equal(await controls.locator("textarea").inputValue(), "护肤礼盒的自然光产品主图");
  assert.equal(await controls.getByTitle("删除参考内容").count(), 1);

  await controls.getByRole("button", { name: "输出参数", exact: true }).click();
  await page.locator('input[name="output-count"][value="4"]').locator("..").click();
  await page.keyboard.press("Escape");
  await controls.locator('button[type="submit"]').click();
  await waitForCompleted();
  assert.equal(await articles.count(), 3);
  assert.equal(await articles.last().getByRole("checkbox").count(), 4);
  const lastRecord = articles.last();
  const checkboxes = lastRecord.getByRole("checkbox");
  await checkboxes.nth(0).check();
  assert.equal(await checkboxes.nth(2).isChecked(), false);
  assert.equal(await lastRecord.getByRole("checkbox", { checked: true }).count(), 1);
  await checkboxes.nth(0).uncheck();
  assert.equal(await lastRecord.getByRole("button", { name: /上传资源库/ }).isDisabled(), true);
  await checkboxes.nth(1).check();
  await checkboxes.nth(3).check();
  assert.equal(await lastRecord.getByRole("checkbox", { checked: true }).count(), 2);
  await lastRecord.getByTitle(/^预览 /).nth(1).click();
  await page.getByRole("heading", { name: "快速创作图片-2.png", exact: true }).waitFor();
  await page.getByTitle("关闭预览").click();
  const downloadPromise = page.waitForEvent("download");
  await lastRecord.getByTitle("下载图片").nth(1).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "快速创作图片-2.png");
  for (const width of [1280, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    await checkDesktopLayout();
    assert.ok((await articles.last().boundingBox()).height <= 480);
    await shot(`mixed-${width}`);
  }
  await page.locator("aside").getByRole("button").last().click();
  await page.setViewportSize({ width: 430, height: 900 });
  await controls.scrollIntoViewIfNeeded();
  const mobile = await controls.boundingBox();
  assert.ok(mobile.x + mobile.width <= 430);
  await shot("mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await lastRecord.getByRole("button", { name: "上传资源库 (2)", exact: true }).click();
  assert.equal(await records.count(), 0);
  await page.getByText("快速创作图片-2.png", { exact: true }).first().waitFor();
  await page.getByText("快速创作图片-4.png", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("快速创作图片-1.png", { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log("Passed: two-column workspace, mixed history, newest at bottom, re-edit, output parameters, resource upload and responsive layout.");
} catch (error) {
  console.error((await page.locator("body").innerText()).slice(-4500));
  await shot("failure");
  throw error;
} finally {
  await browser.close();
}
