import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";

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

const productDetailFields = [
  "整体消耗", "整体ROI", "整体总成交金额", "用户实际支付金额", "整体成交智能优惠券",
  "整体成交订单数", "整体成交订单成本", "电商平台补贴金额", "整体成交金额", "综合成本",
  "净成交金额", "净成交订单数", "综合ROI", "综合订单成本", "净成交ROI", "净成交订单成本",
  "整体展现次数", "转化率", "平均千次展现费用", "整体点击次数", "点击率",
  "基础消耗", "追投消耗", "追投成交金额",
  "追投成交订单数", "视频播放数", "视频完播数", "3秒播放数", "3秒播放率", "完播率",
  "视频点赞数", "视频评论数", "新增粉丝数",
];
const productDetailOnlyFields = ["视频完播数", "3秒播放数", "3秒播放率"];
const standardDetailOnlyFields = ["有效播放数", "3s播放数", "3s播放率"];
const productFields = productDetailFields.filter(field => !productDetailOnlyFields.includes(field));
const productFieldsFor = dimension => dimension === "明细" ? productDetailFields : productFields;
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
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-ad_delivery").click();
  await button("广告平台分析").click();
  await expect(button("直播全域推广")).toBeVisible();
  await expect(button("标准推广")).toHaveCount(0);
  await expect(button("商品乘方推广")).toBeVisible();
  await expect(button("直播乘方推广")).toBeVisible();
  const summaryTotals = await table.locator("tbody tr").first().locator("td").allTextContents();
  for (const removedPlatform of ["巨量本地推", "磁力智投", "磁力金牛", "腾讯ADQ", "淘宝超级短视频"]) {
    await expect(button(removedPlatform)).toHaveCount(0);
  }
  await expect(button("巨量千川")).toBeVisible();
  await button("巨量广告").click();
  await expect(button("巨量广告")).toHaveClass(/text-\[#7C3AED\]/);
  await expect(button("直播全域推广")).toHaveCount(0);
  await expect(button("商品乘方推广")).toHaveCount(0);
  await expect(button("直播乘方推广")).toHaveCount(0);
  await button("标准推广").click();
  await button("巨量千川").click();
  await expect(button("标准推广")).toHaveCount(0);
  await expect(button("千川汇总")).toHaveAttribute("aria-pressed", "true");
  const standardFields = (await headers()).slice(1);
  assert.deepEqual(standardFields, [
    "消耗", "roi", "总成交金额", "成交金额", "智能优惠券", "电商平台补贴金额", "转化数", "转化率",
    "转化成本", "展示数", "平均千次展现费用", "点击数", "点击率", "平均点击单价", "播放量", "完播率",
  ]);

  await button("商品全域推广").click();
  await expect(button("商品全域推广")).toHaveClass(/bg-\[#7C3AED\]/);
  for (const [dimension, leftFields] of dimensions) {
    await button(dimension).click();
    assert.deepEqual(await headers(), [...leftFields, ...productFieldsFor(dimension)]);
    await expect(table.locator("tbody tr").nth(1)).toBeVisible();
    await expect(table).not.toContainText("NaN");
    await expect(table).not.toContainText("Infinity");
    await expect(table.locator("tbody tr").first().locator("td")).toHaveCount(productFieldsFor(dimension).length + 1);
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
  assert.ok(maxScroll > 2000);
  for (const [name, position] of [["start", 0], ["middle", Math.round(maxScroll / 2)], ["end", maxScroll]]) {
    await scroll.evaluate((element, left) => { element.scrollLeft = left; }, position);
    await expect.poll(() => scroll.evaluate(element => Math.round(element.scrollLeft))).toBe(Math.round(position));
    await page.screenshot({ path: `tmp/product-domain-fields/${name}.png`, fullPage: true, animations: "disabled" });
  }

  await button("千川汇总").click();
  assert.deepEqual((await headers()).slice(2), standardFields);
  await button("商品全域推广").click();
  assert.deepEqual((await headers()).slice(2), productFields);
  await button("团队").click();
  const productTotals = await table.locator("tbody tr").first().allTextContents();

  await button("直播全域推广").click();
  await expect(button("直播全域推广")).toHaveClass(/bg-\[#7C3AED\]/);
  const liveTotals = await table.locator("tbody tr").first().allTextContents();
  assert.notDeepEqual(liveTotals, productTotals);
  for (const [dimension, leftFields] of dimensions) {
    await button(dimension).click();
    assert.deepEqual(await headers(), [...leftFields, ...productFieldsFor(dimension)]);
    await expect(table.locator("tbody tr").nth(1)).toBeVisible();
    await expect(table).not.toContainText("NaN");
    await expect(table).not.toContainText("Infinity");
    if (dimension !== "明细") assert.deepEqual(await table.locator("tbody tr").first().allTextContents(), liveTotals);
  }

  await button("明细").click();
  const firstVideo = await table.locator("tbody tr").nth(1).locator("td").nth(5).textContent();
  await button("2").click();
  assert.notEqual(await table.locator("tbody tr").nth(1).locator("td").nth(5).textContent(), firstVideo);
  await button("1").click();
  assert.equal(await table.locator("tbody tr").nth(1).locator("td").nth(5).textContent(), firstVideo);

  await page.getByRole("combobox", { name: "资源分类" }).click();
  await button("美妆护肤").click();
  await button("面部精华").click();
  await button("查询").click();
  for (const row of await table.locator("tbody tr").all().then(rows => rows.slice(1))) {
    await expect(row.locator("td").nth(3)).toHaveText("美妆护肤");
    await expect(row.locator("td").nth(4)).toHaveText("面部精华");
  }
  await button("重置").click();
  await expect(page.getByRole("combobox", { name: "资源分类" })).toHaveValue("");
  assert.deepEqual(await table.locator("tbody tr").first().allTextContents(), liveTotals);

  await table.locator('th[data-column-key="productOverallSpend"]').click();
  const costs = (await table.locator("tbody tr").all().then(rows => rows.slice(1)));
  const values = [];
  for (const row of costs) values.push(Number((await row.locator("td").nth(1).textContent()).replace(/[^\d.]/g, "")));
  assert.deepEqual(values, [...values].sort((a, b) => a - b));

  await page.getByTitle("列设置").click();
  await expect(settings.locator("label")).toHaveText(productFields);
  await settings.locator("label").filter({ hasText: "新增粉丝数" }).getByRole("checkbox").uncheck();
  await page.keyboard.press("Escape");
  await expect(table.getByRole("columnheader", { name: /新增粉丝数/ })).toHaveCount(0);
  await button("导出").click();
  const exportDialog = page.getByRole("dialog", { name: "导出", exact: true });
  await expect(exportDialog.getByRole("textbox", { name: "导出名称" })).toHaveValue(/推广-直播全域推广/);
  const downloadEvent = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "确定", exact: true }).click();
  const download = await downloadEvent;
  assert.ok(download.suggestedFilename().includes("直播全域推广"));
  const csv = await readFile(await download.path(), "utf8");
  assert.ok(csv.includes('"整体消耗"'));
  assert.ok(!csv.includes('"整体预估订单金额"'));
  assert.ok(!csv.includes('"整体预估订单数"'));
  assert.ok(!csv.includes('"整体未完结预估订单"'));
  assert.ok(!csv.includes('"新增粉丝数"'));
  for (const row of await table.locator("tbody tr").all().then(rows => rows.slice(1))) {
    assert.ok(csv.includes((await row.locator("td").allTextContents()).map(value => `"${value.replaceAll('"', '""')}"`).join(",")));
  }
  await page.getByTitle("列设置").click();
  await settings.getByRole("button", { name: "重置", exact: true }).click();
  await page.keyboard.press("Escape");
  await scroll.evaluate(element => { element.scrollLeft = 0; });
  await expect(page.getByText("导出成功", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: "tmp/product-domain-fields/live-desktop.png", fullPage: true, animations: "disabled" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("aside").getByRole("button").last().click();
  await button("直播全域推广").scrollIntoViewIfNeeded();
  await expect(button("直播全域推广")).toBeVisible();
  await page.screenshot({ path: "tmp/product-domain-fields/live-mobile.png", fullPage: true, animations: "disabled" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("aside").getByRole("button").last().click();

  const promotionTotals = [productTotals, liveTotals];
  for (const [promotion, screenshotName] of [["商品乘方推广", "product-multiplier"], ["直播乘方推广", "live-multiplier"]]) {
    await button(promotion).click();
    await expect(button(promotion)).toHaveAttribute("aria-pressed", "true");
    const totals = await table.locator("tbody tr").first().allTextContents();
    for (const previous of promotionTotals) assert.notDeepEqual(totals, previous);
    promotionTotals.push(totals);
    for (const [dimension, leftFields] of dimensions) {
      await button(dimension).click();
      assert.deepEqual(await headers(), [...leftFields, ...productFieldsFor(dimension)]);
      await expect(table.locator("tbody tr").nth(1)).toBeVisible();
      await expect(table).not.toContainText("NaN");
      await expect(table).not.toContainText("Infinity");
      if (dimension !== "明细") assert.deepEqual(await table.locator("tbody tr").first().allTextContents(), totals);
    }
    await button("明细").click();
    await page.getByRole("combobox", { name: "资源分类" }).click();
    await button("美妆护肤").click();
    await button("面部精华").click();
    await button("查询").click();
    for (const row of (await table.locator("tbody tr").all()).slice(1)) {
      await expect(row.locator("td").nth(3)).toHaveText("美妆护肤");
      await expect(row.locator("td").nth(4)).toHaveText("面部精华");
    }
    await button("重置").click();
    assert.deepEqual(await table.locator("tbody tr").first().allTextContents(), totals);
    await button("导出").click();
    await expect(exportDialog.getByRole("textbox", { name: "导出名称" })).toHaveValue(new RegExp(`推广-${promotion}`));
    const exported = page.waitForEvent("download");
    await exportDialog.getByRole("button", { name: "确定", exact: true }).click();
    const file = await exported;
    assert.ok(file.suggestedFilename().includes(promotion));
    const content = await readFile(await file.path(), "utf8");
    for (const field of productFields) assert.ok(content.includes(`"${field}"`));
    assert.ok(!content.includes('"整体预估订单金额"'));
    assert.ok(!content.includes('"整体预估订单数"'));
    assert.ok(!content.includes('"整体未完结预估订单"'));
    for (const row of (await table.locator("tbody tr").all()).slice(1)) {
      assert.ok(content.includes((await row.locator("td").allTextContents()).map(value => `"${value.replaceAll('"', '""')}"`).join(",")));
    }
    await scroll.evaluate(element => { element.scrollLeft = 0; });
    await expect(page.getByText("导出成功", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `tmp/product-domain-fields/${screenshotName}-desktop.png`, fullPage: true, animations: "disabled" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("aside").getByRole("button").last().click();
    await button(promotion).scrollIntoViewIfNeeded();
    await expect(button(promotion)).toBeVisible();
    await page.screenshot({ path: `tmp/product-domain-fields/${screenshotName}-mobile.png`, fullPage: true, animations: "disabled" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator("aside").getByRole("button").last().click();
  }
  await button("千川汇总").click();
  assert.deepEqual((await headers()).slice(1), standardFields);
  assert.deepEqual(await table.locator("tbody tr").first().locator("td").allTextContents(), summaryTotals);
  await button("直播乘方推广").click();
  await button("巨量广告").click();
  await expect(button("直播全域推广")).toHaveCount(0);
  await expect(button("商品乘方推广")).toHaveCount(0);
  await expect(button("直播乘方推广")).toHaveCount(0);
  await expect(button("标准推广")).toBeVisible();
  assert.deepEqual((await headers()).slice(1), standardFields);
  await button("巨量千川").click();
  await button("商品全域推广").click();
  assert.deepEqual(await table.locator("tbody tr").first().allTextContents(), productTotals);
  await button("巨量广告").click();
  const juliangFields = [...productFields];
  juliangFields.splice(juliangFields.indexOf("基础消耗"), 0, "整体预估订单金额", "整体预估订单数", "整体未完结预估订单");
  assert.deepEqual((await headers()).slice(1), juliangFields);
  await button("巨量千川").click();
  assert.deepEqual((await headers()).slice(1), productFields);
  await button("直播全域推广").click();
  assert.deepEqual(await table.locator("tbody tr").first().allTextContents(), liveTotals);

  for (const [platform, promotions] of [
    ["巨量千川", ["千川汇总", "商品全域推广", "直播全域推广", "商品乘方推广", "直播乘方推广"]],
    ["巨量广告", ["巨量广告汇总", "标准推广", "商品全域推广"]],
  ]) {
    await button(platform).click();
    for (const promotion of promotions) {
      await button(promotion).click();
      const isStandard = promotion.endsWith("汇总") || promotion === "标准推广";
      const detailOnlyFields = isStandard ? standardDetailOnlyFields : productDetailOnlyFields;
      const allFields = isStandard ? [...standardFields, ...standardDetailOnlyFields] : [...productDetailFields];
      if (!isStandard && platform === "巨量广告") {
        allFields.splice(allFields.indexOf("基础消耗"), 0, "整体预估订单金额", "整体预估订单数", "整体未完结预估订单");
      }
      for (const [dimension, leftFields] of dimensions) {
        const expectedFields = dimension === "明细" ? allFields : allFields.filter(field => !detailOnlyFields.includes(field));
        await button(dimension).click();
        assert.deepEqual(await headers(), [...leftFields, ...expectedFields]);
        await page.getByTitle("列设置").click();
        await expect(settings.locator("label")).toHaveText(expectedFields);
        await settings.getByRole("button", { name: "重置", exact: true }).click();
        await expect(settings.locator("label")).toHaveText(expectedFields);
        await page.keyboard.press("Escape");
        assert.deepEqual(await headers(), [...leftFields, ...expectedFields]);
        if (dimension === "团队" || dimension === "明细") {
          await button("导出").click();
          const exported = page.waitForEvent("download");
          await exportDialog.getByRole("button", { name: "确定", exact: true }).click();
          const content = await readFile(await (await exported).path(), "utf8");
          const csvHeader = content.replace(/^\uFEFF/, "").split(/\r?\n/)[0];
          assert.equal(csvHeader, [...leftFields, ...expectedFields].map(field => `"${field}"`).join(","));
        }
      }
      await button("明细").click();
      const sortColumnKey = isStandard ? "rate3s" : "productThreeSecondRate";
      await table.locator(`th[data-column-key="${sortColumnKey}"]`).click();
      await button("团队").click();
      const costValues = await table.locator("tbody tr").evaluateAll(rows => rows.slice(1).map(row => Number(row.cells[1].textContent.replace(/[^\d.]/g, ""))));
      assert.deepEqual(costValues, [...costValues].sort((a, b) => b - a));
      await button("明细").click();
      assert.deepEqual((await headers()).slice(8), allFields);
    }
  }

  await page.getByTitle("列设置").click();
  await settings.getByRole("checkbox", { name: "3秒播放数", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await button("分月").click();
  await button("明细").click();
  await expect(table.getByRole("columnheader", { name: "3秒播放数", exact: true })).toHaveCount(0);
  await button("团队").click();
  await page.getByTitle("列设置").click();
  await settings.getByRole("button", { name: "重置", exact: true }).click();
  await expect(settings.locator("label")).toHaveText(juliangFields);
  await page.keyboard.press("Escape");
  await button("明细").click();
  await expect(table.getByRole("columnheader", { name: "3秒播放数", exact: true })).toHaveCount(1);

  await button("巨量千川").click();
  await button("千川汇总").click();
  for (const dimension of ["团队", "明细"]) {
    await button(dimension).click();
    await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await expect(page.getByText("导出成功", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `tmp/product-domain-fields/detail-only-${dimension}.png`, fullPage: true, animations: "disabled" });
  }
  await button("广告账户分析").click();
  await expect(button("直播全域推广")).toHaveCount(0);
  await expect(button("商品全域推广")).toBeVisible();
  assert.deepEqual(errors, []);
  console.log("PASS: all eight platform/promotion tabs and six dimensions; playback fields appear only in details, including column settings/reset and CSV exports; filtering, sorting fallback, pagination, stable column order/data and desktop/mobile screenshots.");
} catch (error) {
  await page.screenshot({ path: "tmp/product-domain-fields/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
