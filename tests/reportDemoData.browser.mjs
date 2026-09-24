import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium, expect } = require("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
fs.mkdirSync("tmp/analytics-linked-check", { recursive: true });
try {
  await page.goto(process.env.BASE_URL || "http://localhost:3003/");
  await page.locator("#sidebar-item-ad_delivery").click();
  const sections = [
    ["视频数据分析", ["广告平台分析", "广告平台标签", "标签分析"]],
    ["广告账户分析", ["广告账户数据", "广告账户财务报表", "投放状态报表"]],
    ["部门分析", ["数据洞察", "创作分析", "任务分析"]],
  ];
  await expect(page.getByRole("button", { name: "腾讯投放报表", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "投放报表", exact: true })).toHaveCount(0);
  for (const [section, menus] of sections) {
    await page.getByRole("button", { name: section, exact: true }).click();
    if (section === "广告账户分析") {
      const accountTab = page.getByRole("button", { name: "广告账户数据", exact: true });
      await expect(accountTab.locator("..").getByRole("button")).toHaveText(menus);
      await expect(page.getByRole("button", { name: "TikTok店铺", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "授权店铺", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "巨量千川", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "巨量广告", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "TikTok", exact: true })).toHaveCount(0);
    }
    for (const menu of menus) {
      await page.getByRole("button", { name: menu, exact: true }).click();
      if (menu === "投放状态报表") {
        await expect(page.getByRole("button", { name: "直播间数据", exact: true })).toHaveCount(0);
        const deliveryTable = page.getByTestId("delivery-status-table");
        await expect(page.getByRole("button", { name: "巨量广告", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "巨量千川", exact: true })).toBeVisible();
        await expect(deliveryTable).toContainText("暂无数据");
        await page.getByRole("button", { name: "部门筛选", exact: true }).click();
        await page.getByRole("checkbox", { name: "电商投放一部", exact: true }).check();
        await page.getByRole("checkbox", { name: "AIGC爆款内容拆解部", exact: true }).check();
        await expect(deliveryTable).toContainText("暂无数据");
        await page.getByRole("button", { name: "查询", exact: true }).click();
        await expect(deliveryTable.locator("tbody tr")).toHaveCount(3);
        await page.getByRole("button", { name: "分组数据", exact: true }).click();
        await expect(deliveryTable).toContainText("暂无数据");
        await page.getByRole("button", { name: "广告主明细数据", exact: true }).click();
        await expect(page.getByLabel("广告账户 ID", { exact: true })).toBeVisible();
        await expect(page.getByRole("combobox", { name: "分类", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "查看未投放状态说明", exact: true }).hover();
        await expect(page.getByText("未投放-包含状态：", { exact: true })).toBeVisible();
      }
      if (menu === "标签分析") {
        await expect(page.getByRole("button", { name: "标签分析", exact: true })).toHaveCount(1);
        await expect(page.getByRole("button", { name: "潜力 / 当月爆款", exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "使用数据", exact: true })).toHaveCount(0);
        await expect(page.getByRole("heading", { name: "占比分析", exact: true })).toBeVisible();
        await expect(page.getByRole("heading", { name: "详细数据", exact: true })).toBeVisible();
        await expect(page.getByRole("combobox")).toHaveCount(2);
        await page.getByRole("button", { name: "查询", exact: true }).click();
        await page.getByRole("button", { name: "重置", exact: true }).click();
      }
      await expect(page.locator("main")).not.toContainText("NaN");
      await expect(page.locator("main")).not.toContainText("Infinity");
      await page.screenshot({ path: `tmp/analytics-linked-check/${menu}.png`, fullPage: true });
      console.log(menu, "rows", await page.locator("tbody tr").count());
    }
  }
  await page.getByRole("button", { name: "创作分析", exact: true }).click();
  await page.getByRole("button", { name: "音频", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("AIGC爆款内容拆解部");
  await page.getByRole("button", { name: "个人数据", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("徐振");
  await expect(page.locator("tbody")).toContainText("王剪辑");
  await page.getByRole("button", { name: "任务分析", exact: true }).click();
  await page.getByRole("button", { name: "查看详情", exact: true }).first().click();
  await expect(page.getByText("TSK_20250410_01", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/任务详情列表 -/)).toBeVisible();
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "数据洞察", exact: true }).first().click();
  await expect(page.getByText("上传作品（音频）", { exact: true })).toBeVisible();
  await expect(page.getByText("上传作品（音视频）", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "领导力洞察", exact: true }).click();
  await expect(page.getByText("领导力洞察", { exact: true }).last()).toBeVisible();
  await page.getByRole("heading", { name: "领导力洞察", exact: true }).locator("..").getByRole("button").click();
  await page.getByRole("button", { name: "广告账户分析", exact: true }).click();
  await page.getByRole("button", { name: "广告账户财务报表", exact: true }).click();
  const financeRows = await page.locator("tbody tr").count();
  await page.getByPlaceholder("请输入账户名称/ID", { exact: true }).fill("missing-account");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "重置", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(financeRows);
  await page.getByRole("button", { name: "广告账户数据", exact: true }).click();
  await page.getByRole("button", { name: "巨量广告", exact: true }).click();
  await page.getByRole("button", { name: "广告主明细", exact: true }).click();
  const accountRows = await page.locator("tbody tr").count();
  await page.evaluate(async () => {
    const { updateAdStore } = await import("/src/lib/adPush.ts");
    updateAdStore(store => ({ ...store, accounts: [...store.accounts, { ...store.accounts[0], id: "report-test-account", name: "梦畅巨量广告测试账户", platform: "巨量广告", user: "徐振", group: "千川剧本拆解小组" }] }));
  });
  await expect(page.locator("tbody tr")).toHaveCount(accountRows + 1);
  await expect(page.locator("tbody")).toContainText("AIGC爆款内容拆解部");
  await page.evaluate(() => {
    const departments = JSON.parse(localStorage.getItem("cloud_video_depts") || "null");
    window.__reportOriginalDepts = departments;
  });
  await page.evaluate(async () => {
    const { INITIAL_DEPTS } = await import("/src/data/adminAccounts.ts");
    const departments = JSON.parse(localStorage.getItem("cloud_video_depts") || "null") || INITIAL_DEPTS;
    localStorage.setItem("cloud_video_depts", JSON.stringify(departments.map(dept => dept.id === "dept_3" ? { ...dept, name: "内容部门联动测试" } : dept)));
    window.dispatchEvent(new Event("mengchang-organization-change"));
  });
  await expect(page.locator("tbody")).toContainText("内容部门联动测试");
  await page.locator('input[type="date"]').first().fill("2000-01-01");
  await page.locator('input[type="date"]').last().fill("2000-01-02");
  await page.getByRole("button", { name: "查询", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`${sections.reduce((count, [, menus]) => count + menus.length, 0)} report views render; resource/task/leader data checks passed`);
} catch (error) {
  await page.screenshot({ path: "tmp/analytics-linked-check/failure.png", fullPage: true });
  throw error;
} finally { await browser.close(); }
