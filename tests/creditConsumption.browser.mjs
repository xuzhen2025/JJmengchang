import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, expect } = require("playwright/test");
const { unzipSync, strFromU8 } = require("fflate");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const root = page.getByTestId("credit-consumption");
const button = name => root.getByRole("button", { name, exact: true });
const tab = name => root.getByRole("tab", { name, exact: true });
const memberRows = () => root.locator("tbody tr[data-member-id]");
const detailRows = () => root.locator("tbody tr[data-credit-id]");

async function readExport() {
  const pending = page.waitForEvent("download");
  await button("Excel导出").click();
  const download = await pending;
  assert.ok(download.suggestedFilename().endsWith(".xlsx"));
  const files = unzipSync(new Uint8Array(await readFile(await download.path())));
  const worksheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
  const strings = files["xl/sharedStrings.xml"] ? strFromU8(files["xl/sharedStrings.xml"]) : "";
  return page.evaluate(({ worksheet, strings }) => {
    const parser = new DOMParser();
    const shared = [...parser.parseFromString(strings || "<sst/>", "application/xml").querySelectorAll("si")].map(node => node.textContent);
    return [...parser.parseFromString(worksheet, "application/xml").querySelectorAll("row")].map(row => [...row.querySelectorAll("c")].map(cell => {
      const value = cell.querySelector("v")?.textContent ?? cell.querySelector("t")?.textContent ?? "";
      return cell.getAttribute("t") === "s" ? shared[Number(value)] : value;
    }));
  }, { worksheet, strings });
}

try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "guanliyuan", mode: "admin" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "积分管理", exact: true }).click();
  await page.getByRole("button", { name: "积分明细", exact: true }).click();
  await expect(tab("个人消耗汇总")).toHaveAttribute("aria-selected", "true");
  const count = await memberRows().count();
  assert.ok(count > 8);
  assert.equal(await page.getByText("充值 / 调额", { exact: true }).count(), 0);
  assert.equal(await page.getByText("批量划拨/配额变更", { exact: true }).count(), 0);
  assert.equal(await root.getByRole("columnheader", { name: "当前可用余额", exact: true }).count(), 0);
  const totalValues = await root.getByTestId("credit-total").allTextContents();
  assert.equal(totalValues.reduce((sum, value) => sum + Number(value.replaceAll(",", "")), 0), 2385);
  assert.equal(totalValues[0], "370");
  await page.screenshot({ path: "tmp/credit-consumption-summary-desktop.png" });

  await root.getByTitle("按总消耗排序").click();
  await expect(root.getByRole("columnheader", { name: "总消耗" })).toHaveAttribute("aria-sort", "descending");
  assert.equal(await memberRows().first().getByTestId("credit-total").textContent(), "420");
  await root.getByTitle("按总消耗排序").click();
  assert.equal(await memberRows().first().getByTestId("credit-total").textContent(), "0");
  await root.getByTitle("按总消耗排序").click();
  const memberId = await memberRows().first().getAttribute("data-member-id");
  const memberName = await memberRows().first().locator("td").first().textContent();

  const dateRange = await page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() - 8);
    const start = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    date.setDate(date.getDate() + 1);
    const end = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { start, end };
  });
  await root.getByLabel("开始日期", { exact: true }).fill(dateRange.start);
  await root.getByLabel("结束日期", { exact: true }).fill(dateRange.end);
  await button("查询").click();
  await memberRows().first().getByRole("button", { name: "明细", exact: true }).click();
  await expect(tab("消耗明细")).toHaveAttribute("aria-selected", "true");
  await expect(root.getByLabel("用户账号", { exact: true })).toHaveValue(memberId);
  await expect(root.getByLabel("开始日期", { exact: true })).toHaveValue(dateRange.start);
  await expect(root.getByLabel("结束日期", { exact: true })).toHaveValue(dateRange.end);
  await expect(detailRows()).toHaveCount(2);
  for (const row of await detailRows().all()) assert.equal(await row.locator("td").nth(3).textContent(), memberName);
  await page.screenshot({ path: "tmp/credit-consumption-member-desktop.png" });
  await expect(tab("结算补扣")).toHaveCount(0);
  await expect(tab("结算退还")).toHaveCount(0);
  assert.deepEqual((await readExport()).slice(1).map(row => row[3]), [memberName, memberName]);

  await tab("失败退回").click();
  await expect(detailRows()).toHaveCount(1);
  assert.equal(await detailRows().first().locator("td").nth(2).textContent(), "+90");
  const refundExport = await readExport();
  assert.equal(refundExport.length, 2);
  assert.equal(refundExport[1][1], "失败退回");
  assert.equal(refundExport[1][2], "90");
  await tab("普通充值").click();
  await expect(root.getByText("暂无符合条件的消耗明细")).toBeVisible();
  await expect(button("Excel导出")).toBeDisabled();
  await tab("全部").click();
  await root.getByLabel("开始日期", { exact: true }).fill("2030-01-02");
  await root.getByLabel("结束日期", { exact: true }).fill("2030-01-01");
  await button("查询").click();
  await expect(root.getByRole("alert")).toHaveText("开始日期不能晚于结束日期");
  await expect(detailRows()).toHaveCount(2);
  await root.getByLabel("开始日期", { exact: true }).fill("2030-01-01");
  await button("查询").click();
  await expect(detailRows()).toHaveCount(0);

  await tab("个人消耗汇总").click();
  await expect(root.getByLabel("用户账号", { exact: true })).toHaveValue("");
  await expect(root.getByLabel("开始日期", { exact: true })).toHaveValue(dateRange.start);
  await root.getByLabel("用户账号", { exact: true }).selectOption(memberId);
  await expect(memberRows()).toHaveCount(count);
  await button("查询").click();
  await expect(memberRows()).toHaveCount(1);
  const summaryExport = await readExport();
  assert.equal(summaryExport.length, 2);
  assert.equal(summaryExport[1][0], memberName);
  assert.equal(summaryExport[1][3], "370");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("aside > div").last().getByRole("button").last().click();
  await expect(page.locator("aside")).toHaveClass(/w-16/);
  await expect(page.getByRole("status")).toHaveCount(0);
  await root.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "tmp/credit-consumption-summary-mobile.png", fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false);
  await memberRows().first().getByRole("button", { name: "明细", exact: true }).click();
  assert.equal(await root.getByTestId("credit-table-scroll").evaluate(element => element.scrollLeft), 0);
  await page.screenshot({ path: "tmp/credit-consumption-details-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.locator("aside > div").last().getByRole("button").last().click();

  await page.getByRole("button", { name: "积分充值 >", exact: true }).click();
  await page.getByRole("button", { name: "模拟扫码支付完成", exact: true }).click();
  await root.getByLabel("用户账号", { exact: true }).selectOption("");
  await root.getByLabel("开始日期", { exact: true }).fill("");
  await root.getByLabel("结束日期", { exact: true }).fill("");
  await button("查询").click();
  await tab("普通充值").click();
  await expect(detailRows()).toHaveCount(1);
  assert.equal(await detailRows().first().locator("td").nth(2).textContent(), "+10,000");
  assert.equal(await detailRows().first().locator("td").nth(3).textContent(), "徐振");
  await tab("赠送充值").click();
  await expect(detailRows()).toHaveCount(2);
  await tab("个人消耗汇总").click();
  assert.equal(await memberRows().first().getByTestId("credit-total").textContent(), "370");
  assert.deepEqual(errors, []);
  console.log("PASS: totals, sorting, account drilldown, dates, type filters, empty/error states, XLSX exports, responsive views and recharge ledger");
} finally {
  await browser.close();
}
