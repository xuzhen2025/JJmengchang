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

try {
  await mkdir("tmp/ad-account-data", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-ad_delivery").click();
  await button("广告账户分析").click();
  await button("广告账户数据").click();

  const table = page.getByTestId("ad-account-data-table");
  await expect(table).toBeVisible();
  await expect(button("巨量千川")).toBeVisible();
  await expect(button("巨量广告")).toBeVisible();
  await expect(button("巨量本地推")).toHaveCount(0);
  await expect(button("直播全域推广")).toHaveCount(0);
  await expect(button("直播间汇总")).toHaveCount(0);
  await expect(button("人员数据")).toBeVisible();
  await expect(button("分类数据")).toBeVisible();
  await expect(button("广告主明细")).toBeVisible();

  await expect(page.getByRole("combobox", { name: "人员汇总层级" })).toHaveValue("team");
  await page.getByRole("combobox", { name: "人员汇总层级" }).selectOption("group");
  await expect(table.locator("thead th").nth(0)).toHaveText("团队");
  await expect(table.locator("thead th").nth(1)).toHaveText("分组");
  await page.getByRole("combobox", { name: "人员汇总层级" }).selectOption("person");
  await expect(table.locator("thead th").nth(2)).toHaveText("用户");

  const beforeQuery = await table.locator("tbody").textContent();
  await page.getByPlaceholder("请输入广告主名称").fill("不存在的广告账户");
  await expect(table.locator("tbody")).toHaveText(beforeQuery);
  await button("查询").click();
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await button("重置").click();
  await expect(table.locator("tbody tr")).not.toHaveCount(1);

  await button("分类数据").click();
  await expect(page.getByRole("combobox", { name: "分类汇总层级" })).toHaveValue("primary");
  await page.getByRole("combobox", { name: "分类汇总层级" }).selectOption("secondary");
  await expect(table.locator("thead th").nth(0)).toHaveText("一级分类");
  await expect(table.locator("thead th").nth(1)).toHaveText("二级分类");

  await button("广告主明细").click();
  await expect(table.locator("thead th").evaluateAll(nodes => nodes.slice(0, 6).map(node => node.textContent?.trim()))).resolves.toEqual([
    "广告账户", "团队", "分组", "用户", "一级分类", "二级分类",
  ]);
  const detailText = await table.locator("tbody").textContent();
  assert.ok(detailText.includes("徐振") || detailText.includes("未绑定用户"));

  await button("商品全域推广").click();
  await expect(table.locator("thead th[data-column-key]")).toHaveCount(36);
  await expect(table.locator("thead th[data-column-key]").allTextContents()).resolves.toEqual([
    "整体消耗", "整体ROI", "整体总成交金额", "用户实际支付金额", "整体成交智能优惠券", "整体成交订单数",
    "整体成交订单成本", "电商平台补贴金额", "整体成交金额", "综合成本", "净成交金额", "净成交订单数",
    "综合ROI", "综合订单成本", "净成交ROI", "净成交订单成本", "整体展现次数", "转化率",
    "平均千次展现费用", "整体点击次数", "点击率", "整体预估订单金额", "整体预估订单数", "整体未完结预估订单",
    "基础消耗", "追投消耗", "追投成交金额", "追投成交订单数", "视频播放数", "视频完播数",
    "3秒播放数", "3秒播放率", "完播率", "视频点赞数", "视频评论数", "新增粉丝数",
  ]);
  await expect(table.locator('thead th[data-column-key="overallSpend"]')).toContainText("整体消耗");
  await expect(table.locator('thead th[data-column-key="followers"]')).toContainText("新增粉丝数");
  await page.getByRole("button", { name: "列设置" }).click();
  const popover = page.locator('[data-overlay-layer="popover"]');
  await expect(popover.getByRole("checkbox")).toHaveCount(36);
  await popover.getByRole("checkbox").first().uncheck();
  await expect(table.locator("thead th[data-column-key]")).toHaveCount(35);
  await popover.getByRole("button", { name: "重置", exact: true }).click();
  await expect(table.locator("thead th[data-column-key]")).toHaveCount(36);
  await page.keyboard.press("Escape");

  await page.waitForTimeout(3200);
  await page.screenshot({ path: "tmp/ad-account-data/product-domain-desktop.png", fullPage: true });

  await button("巨量广告").click();
  await expect(button("标准推广")).toHaveCount(0);
  await expect(button("商品全域推广")).toHaveCount(0);
  await expect(table.locator("thead th[data-column-key]")).toHaveCount(19);
  await expect(table.locator("tbody tr").count()).resolves.toBeGreaterThan(1);

  await page.setViewportSize({ width: 430, height: 900 });
  await page.screenshot({ path: "tmp/ad-account-data/juliang-mobile.png", fullPage: true });
  await expect(table).toBeVisible();
  assert.deepEqual(errors, []);
  console.log("PASS: ad account platform scope, dimensions, applied filters, 36 product metrics, column settings and responsive rendering.");
} catch (error) {
  await page.screenshot({ path: "tmp/ad-account-data/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
