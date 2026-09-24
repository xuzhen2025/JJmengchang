import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const playwrightRequire = createRequire("C:/Users/徐振/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js");
const { chromium, expect } = playwrightRequire("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
fs.mkdirSync("tmp/analytics-export-dialog", { recursive: true });

const pages = [
  { category: "视频数据分析", page: "广告平台分析", button: "导出" },
  { category: "视频数据分析", page: "广告平台标签", button: "导出表格" },
  { category: "视频数据分析", page: "标签分析", button: "导出" },
  { category: "广告账户分析", page: "广告账户数据", button: "导出" },
  { category: "广告账户分析", page: "广告账户财务报表", button: "导出" },
  { category: "部门分析", page: "数据洞察", button: "导出" },
  { category: "部门分析", page: "创作分析", button: "导出数据" },
  { category: "部门分析", page: "任务分析", button: "导出数据" },
];

const main = page.locator("main");
const openPage = async ({ category, page: pageName }) => {
  await main.getByRole("button", { name: category, exact: true }).click();
  await main.getByRole("button", { name: pageName, exact: true }).first().click();
};

try {
  await page.goto(process.env.BASE_URL || "http://localhost:3005/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-ad_delivery").click();

  for (const [index, item] of pages.entries()) {
    await openPage(item);
    await main.getByRole("button", { name: item.button, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "导出", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("radio", { name: "CSV", exact: true })).toBeChecked();
    const nameInput = dialog.getByLabel("导出名称");
    const defaultName = await nameInput.inputValue();
    assert.match(defaultName, new RegExp(`^${item.page}_\\d{14}_`));
    assert.equal(defaultName.includes("__"), false);
    await expect(dialog.getByLabel("导出开始日期")).not.toHaveValue("");
    await expect(dialog.getByLabel("导出结束日期")).not.toHaveValue("");
    if (index === 0) await page.screenshot({ path: "tmp/analytics-export-dialog/desktop.png", fullPage: true, animations: "disabled" });

    if (item.page === "广告平台标签") {
      const endDate = await dialog.getByLabel("导出结束日期").inputValue();
      await dialog.getByLabel("导出开始日期").fill(endDate);
      await expect(nameInput).toHaveValue(new RegExp(`时间-${endDate}至${endDate}$`));
      await dialog.getByRole("button", { name: "取消", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await main.getByRole("button", { name: item.button, exact: true }).click();
    }

    const activeDialog = page.getByRole("dialog", { name: "导出", exact: true });
    if (index === 0) await activeDialog.getByLabel("导出名称").fill("自定义_广告平台分析");
    const format = index % 2 === 0 ? "CSV" : "Excel";
    await activeDialog.getByRole("radio", { name: format, exact: true }).check();
    const downloadPromise = page.waitForEvent("download");
    await activeDialog.getByRole("button", { name: "确定", exact: true }).click();
    const download = await downloadPromise;
    const expectedExtension = format === "CSV" ? ".csv" : ".xlsx";
    assert.ok(download.suggestedFilename().endsWith(expectedExtension));
    if (index === 0) assert.equal(download.suggestedFilename(), `自定义_广告平台分析${expectedExtension}`);
    else assert.ok(download.suggestedFilename().startsWith(`${item.page}_`));
    const path = await download.path();
    assert.ok(path && fs.statSync(path).size > 0);
    await expect(activeDialog).toHaveCount(0);
  }

  await page.locator("#sidebar-item-operation_records").click();
  await page.getByRole("tab", { name: "导出记录", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("自定义_广告平台分析.csv");
  await expect(page.locator("tbody")).toContainText("任务分析_");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#sidebar-item-ad_delivery").click();
  await openPage(pages[0]);
  await main.getByRole("button", { name: "导出", exact: true }).click();
  const mobileDialog = page.getByRole("dialog", { name: "导出", exact: true });
  await expect(mobileDialog).toBeVisible();
  const box = await mobileDialog.boundingBox();
  assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844);
  await page.screenshot({ path: "tmp/analytics-export-dialog/mobile.png", fullPage: true, animations: "disabled" });
  await mobileDialog.getByRole("button", { name: "取消", exact: true }).click();

  assert.deepEqual(errors, []);
  console.log("Eight analytics export dialogs, CSV/XLSX downloads, editable names, date isolation, history and mobile layout passed");
} finally {
  await browser.close();
}
