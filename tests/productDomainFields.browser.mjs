import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const table = page.getByTestId("ad-platform-analysis-table");
const scroll = table.locator("..");
const headers = async () => (await table.locator("thead th").allTextContents()).map(text => text.replace(/\?$/, ""));

const productFields = [
  "整体消耗", "整体ROI", "整体总成交金额", "用户实际支付金额", "整体成交智能优惠券",
  "整体成交订单数", "整体成交订单成本", "电商平台补贴金额", "整体成交金额", "综合成本",
  "净成交金额", "净成交订单数", "综合ROI", "综合订单成本", "净成交ROI", "净成交订单成本",
  "整体展现次数", "转化率", "平均千次展现费用", "整体点击次数", "点击率", "整体预估订单金额",
  "整体预估订单数", "整体未完结预估订单", "基础消耗", "追投消耗", "追投成交金额",
  "追投成交订单数", "视频播放数", "视频完播数", "3秒播放数", "3秒播放率", "完播率",
  "视频点赞数", "视频评论数", "新增粉丝数",
];
const dimensions = [
  ["团队", ["团队"]],
  ["分组", ["团队", "分组"]],
  ["个人", ["团队", "分组", "视频发布人"]],
  ["明细", ["团队", "分组", "视频发布人", "一级分类", "二级分类", "视频", "操作", "视频上传时间"]],
  ["分日", ["日期"]],
  ["分月", ["月份"]],
];

try {
  await mkdir("tmp/product-domain-fields", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-ad_delivery").click();
  await button("广告平台分析").click();
  await expect(button("直播全域推广")).toHaveCount(0);
  for (const removedPlatform of ["巨量本地推", "磁力智投", "磁力金牛", "腾讯ADQ", "淘宝超级短视频"]) {
    await expect(button(removedPlatform)).toHaveCount(0);
  }
  await expect(button("巨量千川")).toBeVisible();
  await button("巨量广告").click();
  await expect(button("巨量广告")).toHaveClass(/text-\[#7C3AED\]/);
  await button("巨量千川").click();
  const standardFields = (await headers()).slice(1);
  assert.deepEqual(standardFields, [
    "消耗", "roi", "总成交金额", "成交金额", "智能优惠券", "电商平台补贴金额", "转化数", "转化率",
    "转化成本", "展示数", "平均千次展现费用", "点击数", "点击率", "平均点击单价", "播放量", "完播率",
    "有效播放数", "3s播放数", "3s播放率",
  ]);

  await button("商品全域推广").click();
  await expect(button("商品全域推广")).toHaveClass(/bg-\[#7C3AED\]/);
  for (const [dimension, leftFields] of dimensions) {
    await button(dimension).click();
    assert.deepEqual(await headers(), [...leftFields, ...productFields]);
    await expect(table.locator("tbody tr").nth(1)).toBeVisible();
    await expect(table).not.toContainText("NaN");
    await expect(table).not.toContainText("Infinity");
    await expect(table.locator("tbody tr").first().locator("td")).toHaveCount(productFields.length + 1);
  }

  await button("分组").click();
  const originalRows = await table.locator("tbody tr").evaluateAll(rows => rows.slice(1).map(row => row.textContent));
  await table.locator('th[data-column-key="productFollowers"]').click();
  const sortedRows = await table.locator("tbody tr").evaluateAll(rows => rows.slice(1).map(row => row.textContent));
  assert.notDeepEqual(sortedRows, originalRows);
  await table.locator('th[data-column-key="productFollowers"]').click();

  await page.getByTitle("列设置").click();
  const settings = page.getByText("自定义字段(可拖动排序)").locator("../..");
  await expect(settings.locator('input[type="checkbox"]')).toHaveCount(productFields.length);
  await expect(settings.locator("label")).toHaveText(productFields);
  await settings.locator("label").filter({ hasText: "新增粉丝数" }).getByRole("checkbox").uncheck();
  await page.keyboard.press("Escape");
  await expect(table.getByRole("columnheader", { name: /新增粉丝数/ })).toHaveCount(0);
  await page.getByTitle("列设置").click();
  await settings.getByRole("button", { name: "重置", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(table.getByRole("columnheader", { name: /新增粉丝数/ })).toBeVisible();

  const maxScroll = await scroll.evaluate(element => element.scrollWidth - element.clientWidth);
  assert.ok(maxScroll > 3000);
  for (const [name, position] of [["start", 0], ["middle", Math.round(maxScroll / 2)], ["end", maxScroll]]) {
    await scroll.evaluate((element, left) => { element.scrollLeft = left; }, position);
    await expect.poll(() => scroll.evaluate(element => Math.round(element.scrollLeft))).toBe(Math.round(position));
    await page.screenshot({ path: `tmp/product-domain-fields/${name}.png`, fullPage: true, animations: "disabled" });
  }

  for (const promo of ["千川汇总", "标准推广"]) {
    await button(promo).click();
    assert.deepEqual((await headers()).slice(2), standardFields);
  }
  await button("商品全域推广").click();
  assert.deepEqual((await headers()).slice(2), productFields);
  await button("广告账户分析").click();
  await expect(button("直播全域推广")).toHaveCount(0);
  await expect(button("商品全域推广")).toBeVisible();
  assert.deepEqual(errors, []);
  console.log("PASS: product-domain 36-field order, six dimensions, totals, sorting, column settings, horizontal scroll and isolated promo tabs.");
} catch (error) {
  await page.screenshot({ path: "tmp/product-domain-fields/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
