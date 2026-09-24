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
const category = page.getByRole("combobox", { name: "分类", exact: true });
const popup = page.locator('[data-overlay-layer="popover"]').filter({ hasText: "一级分类" });
const primary = popup.locator(":scope > div").first();
const secondary = popup.locator(":scope > div").nth(1);
const table = page.getByRole("table");
const selectedPath = "测试分类A / 同名二级";
const choose = async () => {
  await category.click();
  await primary.getByRole("button", { name: "测试分类A", exact: true }).click();
  await secondary.getByRole("button", { name: "同名二级", exact: true }).click();
  await expect(category).toHaveValue(selectedPath);
};

try {
  await mkdir("tmp/report-category-filters", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  const expected = await page.evaluate(async () => {
    const { resourceConfigStore } = await import("/src/lib/resourceConfig.ts");
    const { resourceTagStore } = await import("/src/lib/resourceTags.ts");
    const { readAdStore, updateAdStore } = await import("/src/lib/adPush.ts");
    const { readReportOrganization } = await import("/src/lib/analyticsOrganization.ts");
    const { createReportFacts, stableNumber, selectReportFacts, reportTotals, tagReportRow, REPORT_TODAY, financialReportRows } = await import("/src/lib/reportDemoData.ts");
    resourceConfigStore.setCategories(previous => ({ ...previous, 成片: [...previous.成片,
      { id: "report-test-a", name: "测试分类A", children: [{ id: "report-test-a-child", name: "同名二级" }] },
      { id: "report-test-b", name: "测试分类B", children: [{ id: "report-test-b-child", name: "同名二级" }] },
    ] }));
    resourceTagStore.setPublicGroups(groups => groups.map((group, index) => ({
      ...group,
      categories: index === 0 ? ["成片", "测试分类A", "同名二级"] : index === 1 ? ["成片", "测试分类B", "同名二级"] : ["音频"],
    })));
    const [testCategoryATagGroup, testCategoryBTagGroup] = resourceTagStore.getPublicGroups();
    const categories = resourceConfigStore.categories("finished");
    const seedAccount = readAdStore().accounts[0];
    const accounts = [];
    for (const platform of ["巨量千川"]) {
      for (const name of ["测试分类A", "测试分类B"]) {
        const index = categories.findIndex(category => category.name === name);
        let number = 0;
        let id;
        do { id = `category-test-${platform}-${name}-${number++}`; } while (stableNumber(id) % categories.length !== index && number < 10000);
        if (stableNumber(id) % categories.length !== index) throw new Error("Unable to seed category account");
        accounts.push({ ...seedAccount, id, name: `${platform}-${name}`, platform });
      }
    }
    updateAdStore(store => ({ ...store, accounts: [...store.accounts, ...accounts] }));
    const facts = createReportFacts(readAdStore().accounts, readReportOrganization(), [], categories);
    const path = "测试分类A / 同名二级";
    const qc = selectReportFacts(facts, "巨量千川", { category: path });
    const financial = financialReportRows(facts, "巨量千川", REPORT_TODAY).filter(row => `${row.cat1} / ${row.cat2}` === path);
    return {
      categories,
      accountCount: reportTotals(qc).accounts,
      tag: tagReportRow(qc, "总计"),
      accountSpend: reportTotals(selectReportFacts(facts, "巨量千川", { category: path, promotion: "标准推广" })).spend.toFixed(2),
      financialCount: financial.length,
      financialSpend: financial.reduce((sum, row) => sum + row.totalSpend, 0).toFixed(2),
      testCategoryATagGroup: testCategoryATagGroup.name,
      testCategoryBTagGroup: testCategoryBTagGroup.name,
    };
  });
  await page.locator("#sidebar-item-ad_delivery").click();
  await expect(button("腾讯投放报表")).toHaveCount(0);
  await expect(button("投放报表")).toHaveCount(0);
  const pages = [
    ["视频数据分析", "广告平台标签", "tags", true, true],
    ["视频数据分析", "标签分析", "tag-analysis", true, true],
    ["广告账户分析", "广告账户数据", "accounts", true, true],
    ["广告账户分析", "广告账户财务报表", "finance", false, true],
  ];

  for (const [section, name, key, requiresQuery, hasReset] of pages) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await button(section).click();
    await button(name).click();
    if (key === "tags") await button("广告账户").click();
    if (key === "accounts") await button("广告主明细").click();
    await expect(category).toHaveValue("");
    const before = await table.locator("tbody").textContent();
    await category.click();
    await expect(secondary).toHaveCount(0);
    await expect(primary.getByRole("button")).toHaveText(expected.categories.map(category => category.name));
    for (const parent of expected.categories.slice(0, 2)) {
      await primary.getByRole("button", { name: parent.name, exact: true }).hover();
      if (await secondary.count()) await expect(primary.getByRole("button", { name: parent.name, exact: true })).toHaveAttribute("aria-expanded", "false");
      await primary.getByRole("button", { name: parent.name, exact: true }).click();
      await expect(secondary.getByRole("button")).toHaveText(parent.children.map(child => child.name));
    }
    await page.screenshot({ path: `tmp/report-category-filters/${key}-desktop.png` });
    await page.keyboard.press("Escape");
    await expect(category).toHaveValue("");
    if (key === "tag-analysis") {
      const tag = page.getByRole("combobox", { name: "选择标签", exact: true });
      await expect(tag).toBeDisabled();
      await choose();
      await expect(tag).toBeEnabled();
      await expect(tag.locator("option").first()).toHaveText("选择标签");
      await expect(tag.locator("optgroup")).toHaveCount(1);
      await expect(tag.locator("optgroup")).toHaveAttribute("label", expected.testCategoryATagGroup);
      assert.ok(await tag.locator('option:not([value=""])').count() > 0);
      await tag.selectOption({ index: 1 });
      assert.notEqual(await tag.inputValue(), "");
      await tag.selectOption("");
      await expect(tag).toHaveValue("");
    } else await choose();
    await expect(popup).toHaveCount(0);
    if (requiresQuery) {
      await expect(table.locator("tbody")).toHaveText(before);
      await button("查询").click();
    }
    const total = table.locator("tbody tr").first().locator("td");
    if (key === "tags") {
      await expect(table.locator("tbody tr")).toHaveCount(expected.accountCount + 1);
    } else if (key === "tag-analysis") {
      await expect(total.nth(1)).toHaveText(String(expected.tag.videoCount));
      await expect(total.nth(2)).toHaveText(expected.tag.spend);
    } else if (key === "accounts") await expect(total.nth(6)).toHaveText(expected.accountSpend);
    else {
      await expect(total.nth(6)).toHaveText(expected.financialSpend);
      await expect(table.locator("tbody tr")).toHaveCount(expected.financialCount + 1);
    }
    if (["tags", "accounts", "finance"].includes(key)) {
      const firstCategoryIndex = key === "tags" ? 5 : 4;
      for (const row of (await table.locator("tbody tr").all()).slice(1)) {
        await expect(row.locator("td").nth(firstCategoryIndex)).toHaveText("测试分类A");
        await expect(row.locator("td").nth(firstCategoryIndex + 1)).toHaveText("同名二级");
      }
    }
    if (key === "finance") {
      const firstDataRow = table.locator("tbody tr").nth(1);
      for (const columnIndex of [1, 2, 3, 4, 5]) {
        await expect(firstDataRow.locator("td").nth(columnIndex)).toHaveClass(/\btext-slate-900\b/);
      }
    }
    const filtered = await table.locator("tbody").textContent();
    await category.click();
    await expect(secondary.getByRole("button", { name: "同名二级", exact: true })).toHaveAttribute("aria-pressed", "true");
    await primary.getByRole("button", { name: "测试分类B", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(category).toHaveValue(selectedPath);
    await expect(table.locator("tbody")).toHaveText(filtered);
    await button("清除分类").click();
    await expect(category).toHaveValue("");
    if (requiresQuery) await button("查询").click();
    await expect(table.locator("tbody")).toHaveText(before);
    if (hasReset) {
      await choose();
      if (requiresQuery) await button("查询").click();
      await button("重置").click();
      await expect(category).toHaveValue("");
      await expect(table.locator("tbody")).toHaveText(before);
    }
    await page.setViewportSize({ width: 430, height: 900 });
    await category.click();
    const parent = expected.categories[0];
    await primary.getByRole("button", { name: parent.name, exact: true }).click();
    await expect.poll(async () => {
      const box = await popup.boundingBox();
      return box && box.x >= 0 && box.x + box.width <= 430 && box.y >= 0 && box.y + box.height <= 900;
    }).toBe(true);
    const leaf = secondary.getByRole("button").first();
    assert.equal(await leaf.evaluate(el => {
      const box = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), true);
    await page.screenshot({ path: `tmp/report-category-filters/${key}-mobile.png` });
    await page.keyboard.press("Escape");
    console.log(`PASS: ${name} cascading children, full-path filter, clear/reset, query timing and responsive overlay.`);
  }
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: "tmp/report-category-filters/failure.png" });
  throw error;
} finally {
  await browser.close();
}
