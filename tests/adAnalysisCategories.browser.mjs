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
const category = page.getByRole("combobox", { name: "资源分类", exact: true });
const popup = page.locator('[data-overlay-layer="popover"]').filter({ hasText: "一级分类" });
const primary = popup.locator(":scope > div").first();
const secondary = popup.locator(":scope > div").nth(1);
const table = page.getByRole("table");
const totalCost = () => table.locator("tbody tr").first().locator("td").nth(1).innerText();

try {
  await mkdir("tmp/ad-analysis-categories", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-ad_delivery").click();
  await button("广告平台分析").click();
  const initialCost = await totalCost();
  const initialRows = await table.locator("tbody tr").count();
  await category.click();
  await expect(popup).toBeVisible();
  await expect(secondary).toHaveCount(0);
  await primary.getByRole("button", { name: "美妆护肤", exact: true }).hover();
  await expect(secondary).toHaveCount(0);

  for (const [name, children] of [
    ["美妆护肤", ["面部精华", "面膜贴片", "口红唇釉", "防晒霜"]],
    ["服饰内衣", ["女士内衣", "塑身衣", "家居服", "保暖内衣"]],
    ["个护家清", ["洗发水", "洗衣液", "牙膏", "纸巾"]],
    ["食品饮料", ["黑芝麻丸", "养生茶", "坚果礼盒", "低脂零食"]],
    ["母婴宠物", ["婴儿纸尿裤", "猫粮", "孕妇钙片", "儿童零食"]],
  ]) {
    await primary.getByRole("button", { name, exact: true }).click();
    for (const child of children) await expect(secondary.getByRole("button", { name: child, exact: true })).toBeVisible();
    await expect(category).toHaveValue("");
    assert.equal(await totalCost(), initialCost);
  }
  await primary.getByRole("button", { name: "服饰内衣", exact: true }).click();
  await expect(secondary.getByRole("button")).toHaveText(["女士内衣", "塑身衣", "家居服", "保暖内衣"]);
  const leftBox = await primary.boundingBox();
  const rightBox = await secondary.boundingBox();
  assert.ok(rightBox.x >= leftBox.x + leftBox.width - 1);
  await page.screenshot({ path: "tmp/ad-analysis-categories/desktop.png" });
  await secondary.getByRole("button", { name: "女士内衣", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(category).toHaveValue("服饰内衣 / 女士内衣");
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect(table.locator("tbody tr").nth(1)).toContainText("服饰种草队");
  const filteredCost = await totalCost();
  assert.notEqual(filteredCost, initialCost);
  for (const dimension of ["分组", "个人", "明细", "分日", "分月"]) {
    await button(dimension).click();
    assert.equal(await totalCost(), filteredCost);
    if (dimension === "明细") {
      for (const row of await table.locator("tbody tr").all()) {
        if (await row.locator("td").first().getAttribute("colspan")) continue;
        await expect(row.locator("td").nth(3)).toHaveText("服饰内衣");
        await expect(row.locator("td").nth(4)).toHaveText("女士内衣");
      }
    }
  }
  await category.click();
  await expect(secondary.getByRole("button", { name: "女士内衣", exact: true })).toHaveAttribute("aria-pressed", "true");
  await primary.getByRole("button", { name: "食品饮料", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(category).toHaveValue("服饰内衣 / 女士内衣");
  assert.equal(await totalCost(), filteredCost);
  await button("查询").click();
  assert.equal(await totalCost(), filteredCost);
  await button("重置").click();
  await expect(category).toHaveValue("");
  assert.equal(await totalCost(), initialCost);
  await expect(table.locator("tbody tr")).toHaveCount(initialRows);

  await button("明细").click();
  await button("2").click();
  await category.click();
  await expect(secondary).toHaveCount(0);
  await primary.getByRole("button", { name: "食品饮料", exact: true }).click();
  await secondary.getByRole("button", { name: "养生茶", exact: true }).click();
  await expect(page.locator("input[readonly]")).toHaveValue("1");
  await category.fill("不存在的分类");
  await expect(popup.getByText("无匹配分类", { exact: true })).toBeVisible();
  await button("分组").click();
  await expect(popup).toHaveCount(0);
  await expect(category).toHaveValue("食品饮料 / 养生茶");

  for (const [width, height] of [[1024, 768], [430, 900]]) {
    await page.setViewportSize({ width, height });
    await category.click();
    await primary.getByRole("button", { name: "个护家清", exact: true }).click();
    await expect(secondary.getByRole("button", { name: "牙膏", exact: true })).toBeVisible();
    await expect.poll(async () => {
      const box = await popup.boundingBox();
      return box && box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= height;
    }).toBe(true);
    assert.equal(await secondary.getByRole("button", { name: "牙膏", exact: true }).evaluate(el => {
      const box = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), true);
    await page.screenshot({ path: `tmp/ad-analysis-categories/${width}.png` });
    await page.keyboard.press("Escape");
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("#sidebar-item-resources").click();
  await button("上传文件").click();
  await page.getByRole("button", { name: /^上传视频/ }).click();
  await category.click();
  await expect(secondary).toBeVisible();
  const catalog = await page.evaluate(async () => (await import("/src/lib/resourceConfig.ts")).resourceConfigStore.categoryMap("finished"));
  const [name, children] = Object.entries(catalog).find(([, children]) => children.length > 0);
  await primary.getByRole("button", { name, exact: true }).hover();
  await expect(secondary.getByRole("button", { name: children[0], exact: true })).toBeVisible();
  await secondary.getByRole("button", { name: children[0], exact: true }).click();
  await expect(category).toHaveValue(`${name} / ${children[0]}`);
  assert.deepEqual(errors, []);
  console.log("PASS: click-only category cascade, matching children, table/totals/dimensions, reset, paging, cancellation, search, responsive overlays and existing upload hover behavior.");
} catch (error) {
  await page.screenshot({ path: "tmp/ad-analysis-categories/failure.png" });
  throw error;
} finally {
  await browser.close();
}
