import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(12000);
const button = name => page.getByRole("button", { name, exact: true });
const gallery = page.getByTestId("viral-inspiration-gallery");
const trigger = gallery.getByRole("button", { name: /^爆款分类：/ });
const choices = page.getByRole("group", { name: "爆款分类", exact: true });
const galleryIds = () => gallery.getByTestId("viral-inspiration-card").evaluateAll(nodes => nodes.map(node => node.dataset.videoId).sort());
const resourceIds = () => page.getByTestId("finished-video-card").evaluateAll(nodes => nodes.map(node => node.dataset.videoId).sort());
const options = async () => {
  await trigger.click();
  await choices.waitFor({ state: "visible" });
  const labels = (await choices.getByRole("button").allTextContents()).map(label => label.trim());
  await page.keyboard.press("Escape");
  return labels;
};
const selectCategory = async name => {
  await trigger.click();
  await choices.getByRole("button", { name, exact: true }).click();
};
const edit = (id, patch) => page.evaluate(async ({ id, patch }) => {
  const { saveResourceEdits } = await import("/src/lib/useResourceEdits.ts");
  saveResourceEdits("finished", { [id]: patch });
}, { id, patch });
const setThreshold = thresholdWan => page.evaluate(async thresholdWan => {
  const { saveViralVideoRule } = await import("/src/lib/viralVideoRule.ts");
  saveViralVideoRule({ period: "monthly", thresholdWan });
}, thresholdWan);
const waitCount = count => page.waitForFunction(count => document.querySelectorAll('[data-testid="viral-inspiration-card"]').length === count, count);

try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.clock.setFixedTime(new Date("2026-09-12T06:00:00Z"));
  await page.goto(process.env.BASE_URL || "http://localhost:3003/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-video_remake").click();
  await waitCount(14);
  const expected = ["全部爆款", ...["高弹透气", "情侣套盒", "面部护肤", "日常彩妆", "身体护理", "智能手表", "头戴耳机", "智能手机", "办公键盘", "通勤女装", "运动鞋履"].sort((a, b) => a.localeCompare(b, "zh-CN"))];
  assert.deepEqual(await options(), expected);
  await selectCategory("面部护肤");
  assert.deepEqual(await galleryIds(), ["fv-analytics-1", "fv13", "fv14"]);
  assert.deepEqual(await options(), expected);
  await selectCategory("智能手表");
  assert.deepEqual(await galleryIds(), ["fv17"]);

  await page.locator("#sidebar-item-resources").click();
  const primary = page.getByText("一级分类：", { exact: true }).locator("..");
  const secondary = page.getByText("二级分类：", { exact: true }).locator("..");
  await secondary.getByRole("button", { name: "智能手表", exact: true }).click();
  assert.deepEqual(await resourceIds(), ["fv17"]);
  await primary.getByRole("button", { name: /^更多/ }).click();
  await primary.getByRole("button", { name: "数码科技", exact: true }).click();
  assert.deepEqual(await resourceIds(), ["fv17", "fv18", "fv19", "fv20"]);
  assert.deepEqual((await secondary.getByRole("button").allTextContents()).map(label => label.trim()), ["全部", "智能手表", "头戴耳机", "智能手机", "办公键盘"]);
  await secondary.getByPlaceholder("搜索分类").fill("智能手表");
  assert.deepEqual(await resourceIds(), ["fv17"]);
  await secondary.getByPlaceholder("搜索分类").fill("");
  await page.locator('[data-testid="finished-video-card"][data-video-id="fv17"]').click();
  await page.getByTitle("修改分类", { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改分类", exact: true });
  await dialog.getByRole("button", { name: "数码科技 / 智能手表", exact: true }).click();
  const picker = page.locator('[data-overlay-layer="popover"]');
  await picker.getByRole("button", { name: "办公键盘", exact: true }).click();
  await dialog.getByRole("button", { name: "确定", exact: true }).click();
  await dialog.waitFor({ state: "detached" });
  await button("返回成片列表").click();
  await secondary.getByRole("button", { name: "办公键盘", exact: true }).click();
  assert.deepEqual(await resourceIds(), ["fv17", "fv20"]);
  assert.equal(await secondary.getByRole("button", { name: "智能手表", exact: true }).count(), 1);

  await page.locator("#sidebar-item-video_remake").click();
  const editedOptions = await options();
  assert.ok(!editedOptions.includes("智能手表"));
  assert.equal(editedOptions.filter(option => option === "办公键盘").length, 1);
  await selectCategory("办公键盘");
  assert.deepEqual(await galleryIds(), ["fv17", "fv20"]);
  await edit("fv17", { deleted: true });
  await waitCount(1);
  assert.deepEqual(await galleryIds(), ["fv20"]);
  await edit("fv20", { deleted: true });
  await waitCount(12);
  assert.equal(await trigger.innerText(), "全部爆款");
  assert.ok(!(await options()).includes("办公键盘"));
  await edit("fv1", { category: "数码科技 / 智能手表" });
  assert.ok(!(await options()).includes("智能手表"));
  await edit("fv1", { monthlyCosts: { "2026-09": 100000 } });
  await waitCount(13);
  assert.ok((await options()).includes("智能手表"));
  await edit("fv22", { category: "鞋履服饰" });
  assert.ok((await galleryIds()).includes("fv22"));
  assert.ok(!(await options()).includes("运动鞋履"));
  await setThreshold(20);
  await waitCount(0);
  assert.deepEqual(await options(), ["全部爆款"]);
  await setThreshold(10);
  await waitCount(13);
  assert.deepEqual(errors, []);
  console.log("PASS: deduplicated viral secondary categories; exact gallery/resource filters; shared category editing; deletion, qualification changes and uncategorized videos.");
} finally {
  await browser.close();
}
