import { createRequire } from "node:module";
import fs from "node:fs";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
fs.mkdirSync("tmp/platform-tag-check", { recursive: true });
const metrics = ["总素材数", "首发素材", "首发素材消耗", "优质素材", "优质素材消耗", "低效素材", "低质素材", "同质化挤压严重素材", "同质化素材风险-排队投放素材"];
const dimensions = [
  ["汇总", ["广告标签", "素材数量", "数量占比", "消耗", "消耗占比"], ["分类"]],
  ["部门", ["部门", ...metrics], ["部门", "分类"]],
  ["分组", ["部门", "分组", ...metrics], ["分组", "分类"]],
  ["个人", ["部门", "分组", "用户", ...metrics], ["个人账号", "分类"]],
  ["广告账户", ["广告账户", "主体", "部门", "分组", "用户", "一级分类", "二级分类", ...metrics], ["分组", "分类"]],
];
try {
  await page.goto(process.env.BASE_URL || "http://localhost:3003/");
  await page.locator("#sidebar-item-ad_delivery").click();
  await page.getByRole("button", { name: "广告平台标签", exact: true }).click();
  const view = page.getByTestId("platform-tags-view");
  const table = view.getByRole("table");
  const dimensionBar = view.getByRole("group", { name: "统计维度" });
  for (const platform of ["巨量千川", "巨量广告"]) {
    await view.getByRole("button", { name: platform, exact: true }).click();
    for (const [dimension, headers, selects] of dimensions) {
      await dimensionBar.getByRole("button", { name: dimension, exact: true }).click();
      await expect(table.getByRole("columnheader")).toHaveText(headers);
      await expect(view.getByRole("combobox")).toHaveCount(selects.length);
      for (const name of selects) await expect(view.getByRole("combobox", { name, exact: true })).toBeVisible();
      await expect(view.getByPlaceholder("请输入主体名称")).toHaveCount(dimension === "广告账户" ? 1 : 0);
      await expect(table.locator("tbody tr").nth(1)).toBeVisible();
      await expect(view).not.toContainText("NaN");
      await expect(view).not.toContainText("Infinity");
      await page.screenshot({ path: `tmp/platform-tag-check/${platform}-${dimension}.png`, fullPage: true, animations: "disabled" });
    }
  }

  await view.getByRole("button", { name: "巨量千川", exact: true }).click();
  const accountRowCount = await table.locator("tbody tr").count();
  const beforeQuery = await table.locator("tbody").textContent();
  await view.getByPlaceholder("请输入主体名称").fill("不存在的主体");
  await expect(table.locator("tbody")).toHaveText(beforeQuery);
  await view.getByRole("button", { name: "查询", exact: true }).click();
  await expect(table.locator("tbody")).toHaveText("暂无数据");
  await expect(view.getByText("数量: 0", { exact: true })).toHaveCount(6);
  await view.getByRole("button", { name: "重置", exact: true }).click();
  await expect(view.getByPlaceholder("请输入主体名称")).toHaveValue("");
  await expect(table.locator("tbody tr")).toHaveCount(accountRowCount);

  const department = (await table.locator("tbody tr").nth(1).locator("td").nth(2).innerText()).trim();
  const group = (await table.locator("tbody tr").nth(1).locator("td").nth(3).innerText()).trim();
  const person = (await table.locator("tbody tr").nth(1).locator("td").nth(4).innerText()).trim();
  for (const dimension of ["部门", "分组", "个人"]) {
    await dimensionBar.getByRole("button", { name: dimension, exact: true }).click();
    const select = view.getByRole("combobox", { name: dimension === "个人" ? "个人账号" : dimension, exact: true });
    if (dimension === "部门") await select.selectOption({ label: department });
    if (dimension === "分组") await select.selectOption(JSON.stringify([department, group]));
    if (dimension === "个人") await select.selectOption({ label: person });
    await view.getByRole("button", { name: "查询", exact: true }).click();
    await expect(table.locator("tbody tr")).toHaveCount(2);
    await expect(table.locator("tbody tr").nth(1)).toContainText(dimension === "部门" ? department : dimension === "分组" ? group : person);
  }
  await dimensionBar.getByRole("button", { name: "汇总", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(7);
  const allCount = await table.locator("tbody tr").first().locator("td").nth(1).innerText();
  await view.getByLabel("分类", { exact: true }).click();
  const categoryPopup = page.locator('[data-overlay-layer="popover"]').filter({ hasText: "一级分类" });
  await categoryPopup.locator(":scope > div").first().getByRole("button").first().click();
  await categoryPopup.locator(":scope > div").nth(1).getByRole("button").first().click();
  await view.getByRole("button", { name: "查询", exact: true }).click();
  const category = await view.getByLabel("分类", { exact: true }).inputValue();
  await dimensionBar.getByRole("button", { name: "分组", exact: true }).click();
  await expect(view.getByLabel("分类", { exact: true })).toHaveValue(category);
  await expect(view.getByLabel("分组", { exact: true })).toHaveValue("");
  await view.getByRole("button", { name: "重置", exact: true }).click();
  await view.getByLabel("消耗开始日期").fill("2000-01-01");
  await view.getByLabel("消耗结束日期").fill("2000-01-02");
  await view.getByRole("button", { name: "查询", exact: true }).click();
  await expect(table.locator("tbody")).toHaveText("暂无数据");
  await page.screenshot({ path: "tmp/platform-tag-check/empty.png", fullPage: true, animations: "disabled" });
  await view.getByLabel("消耗开始日期").fill("2001-01-01");
  await view.getByRole("button", { name: "查询", exact: true }).click();
  await expect(page.getByText("请选择有效的日期范围", { exact: true })).toBeVisible();
  await view.getByRole("button", { name: "重置", exact: true }).click();
  await dimensionBar.getByRole("button", { name: "汇总", exact: true }).click();
  await expect(table.locator("tbody tr").first().locator("td").nth(1)).toHaveText(allCount);

  await view.getByRole("button", { name: "导出表格", exact: true }).click();
  const exportDialog = page.getByRole("dialog", { name: "导出", exact: true });
  await expect(exportDialog).toBeVisible();
  await expect(exportDialog.getByRole("radio", { name: "CSV", exact: true })).toBeChecked();
  await expect(exportDialog.getByLabel("导出名称")).toHaveValue(/^广告平台标签_\d{14}_平台-巨量千川_维度-汇总_时间-/);
  const downloadPromise = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "确定", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^广告平台标签_\d{14}_平台-巨量千川_维度-汇总_时间-.*\.csv$/);
  const csv = fs.readFileSync(await download.path(), "utf8");
  expect(csv).toContain('"广告标签","素材数量","数量占比","消耗","消耗占比"');
  expect(csv).toContain('"首发素材"');

  await dimensionBar.getByRole("button", { name: "广告账户", exact: true }).click();
  const scroll = view.getByTestId("platform-tag-table-scroll");
  const firstFive = table.locator("thead th");
  const positions = await firstFive.evaluateAll(cells => cells.slice(0, 5).map(cell => cell.getBoundingClientRect().x));
  await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  expect(await firstFive.evaluateAll(cells => cells.slice(0, 5).map(cell => cell.getBoundingClientRect().x))).toEqual(positions);
  await page.screenshot({ path: "tmp/platform-tag-check/account-scrolled.png", fullPage: true, animations: "disabled" });
  for (const width of [1440, 1024, 390]) {
    if (width === 390) await page.locator("aside").getByRole("button").last().click();
    await page.setViewportSize({ width, height: 1000 });
    await scroll.evaluate(element => { element.scrollLeft = 0; });
    await expect(view.getByLabel("分类", { exact: true })).toBeVisible();
    const box = await view.getByTestId("platform-tag-filters").boundingBox();
    const controls = await view.getByTestId("platform-tag-filters").locator("input, select, button").evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return { x: rect.x, right: rect.right };
    }));
    expect(controls.every(control => control.x >= box.x - 1 && control.right <= box.x + box.width + 1)).toBe(true);
    if (width < 1280) expect(await firstFive.first().evaluate(cell => getComputedStyle(cell).position)).not.toBe("sticky");
    await page.screenshot({ path: `tmp/platform-tag-check/account-${width}.png`, fullPage: true, animations: "disabled" });
  }
  expect(errors).toEqual([]);
  console.log("Both platforms: five dimensions, filters, totals, empty state, reset, export, sticky columns and responsive controls passed");
} catch (error) {
  await page.screenshot({ path: "tmp/platform-tag-check/failure.png", fullPage: true });
  throw error;
} finally { await browser.close(); }
