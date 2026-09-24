import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const titles = ["无痕防晒冰丝丝袜场景模特图.png", "防晒植物提取精华液展图.jpg"];

try {
  await mkdir("tmp", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();
  await button("图片管理").click();

  for (const [index, title] of titles.entries()) {
    await page.getByText(title, { exact: true }).first().click();
    await expect(button("返回图片列表")).toBeVisible();
    for (const removedText of ["仅供内部员工学习，不可用于商业用途", "所有人可见", "可查看时间:", "可下载时间:", "分组成员 / 不限", "部门成员 / 不限"]) {
      await expect(page.getByText(removedText, { exact: true })).toHaveCount(0);
    }
    await expect(page.getByText(/^下载次数:/)).toBeVisible();
    await expect(page.getByText(/^浏览量:/)).toBeVisible();
    await expect(page.getByText("图片备注:", { exact: true })).toBeVisible();
    await expect(button("下载无水印图片")).toBeVisible();
    await expect(page.getByTitle("修改分类", { exact: true })).toBeVisible();
    await expect(page.getByTitle("修改标题", { exact: true })).toBeVisible();
    await expect(button("添加公共标签")).toBeVisible();
    await expect(button("添加个人标签")).toBeVisible();
    await expect(button("更多")).toBeVisible();

    const noteSection = page.getByText("图片备注:", { exact: true }).locator("../..");
    const originalNote = await noteSection.locator("p").textContent();
    await noteSection.getByRole("button").click();
    await noteSection.getByRole("textbox").fill("取消修改测试");
    await noteSection.getByRole("button", { name: "取消", exact: true }).click();
    await expect(noteSection.locator("p")).toHaveText(originalNote);
    await noteSection.getByRole("button").click();
    await noteSection.getByRole("textbox").fill("已确认高清产品图，保留原始构图。");
    await button("保存备注").click();
    await expect(noteSection.locator("p")).toHaveText("已确认高清产品图，保留原始构图。");

    await page.screenshot({ path: `tmp/image-detail-cleaned-${index + 1}.png`, fullPage: true });
    await button("下载无水印图片").click();
    await expect(button("返回图片列表")).toBeVisible();
    await button("返回图片列表").click();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }
  assert.deepEqual(errors, []);
  console.log("Image details: obsolete permission copy removed; metrics, note editing, download control and navigation preserved.");
} finally {
  await browser.close();
}
