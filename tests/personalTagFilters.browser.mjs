import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const filter = () => page.getByTestId("personal-tag-filter");
const popup = () => page.getByTestId("personal-tag-popover");
const scopeButtons = () => filter().getByRole("group", { name: "个人标签范围" });
const reset = () => filter().getByRole("button", { name: "重置个人标签", exact: true }).click();
const snapshot = async locator => locator.evaluate(node => {
  const s = getComputedStyle(node);
  return { height: node.getBoundingClientRect().height, fontSize: s.fontSize, padding: s.padding,
    borderRadius: s.borderRadius, borderWidth: s.borderWidth };
});
const assertInViewport = async () => {
  const dialog = popup().locator("..");
  assert.ok(await dialog.evaluate(node => node.parentElement === document.body));
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1);
};

try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();
  const name = "秋季复投备选";
  const renamed = "秋季复投精选";
  await page.evaluate(async name => {
    const { resourceTagStore: store } = await import("/src/lib/resourceTags.ts");
    store.setPersonalTags([...store.getPersonalTags(), { id: "filter-test", name, color: "#0284c7", resourceIds: [] }]);
    store.setPersonalGroups(store.getPersonalGroups().map((g, index) => index === 0 ? { ...g, tagIds: [...g.tagIds, "filter-test"] } : g));
    for (const [scope, id] of [["finished", "fv1"], ["materials", "fv1"], ["images", "img-1"], ["audio", "aud-1"], ["scripts", "S-10291"]]) {
      store.assign(scope, { id }, "personal", [name]);
    }
  }, name);

  for (const [tab, title, listTitle] of [
    ["成片管理", "0730-8835-鲁月园-复古耳环动态奢感视频.mp4", "列表明细视图"],
    ["素材管理", "0730-8835-鲁月园-复古耳环动态奢感视频.mp4", "列表明细视图"],
    ["脚本管理", "脚本 1 - 口播温和洁面破圈案", null],
    ["图片管理", "防晒植物提取精华液展图.jpg", null],
    ["音频管理", "现在洁牙", "列表试图"],
  ]) {
    await button(tab).click();
    if (listTitle) await page.getByTitle(listTitle, { exact: true }).click();
    await expect(scopeButtons().getByRole("button")).toHaveText(["全部", "无个人标签", "有个人标签"]);
    await expect(scopeButtons().getByRole("button", { name: "全部", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(popup()).toHaveCount(0);
    const group = filter().getByRole("button", { name: "内容排期", exact: true });
    const publicGroup = page.getByTestId("public-tag-filter").getByRole("button", { name: "商品卖点", exact: true });
    assert.deepEqual(await snapshot(group), await snapshot(publicGroup));
    await group.hover();
    await expect(popup()).toBeVisible();
    await popup().hover();
    await assertInViewport();
    await popup().getByRole("textbox").fill("not-a-tag");
    await expect(popup().getByText("未找到相关二级标签")).toBeVisible();
    await popup().getByRole("textbox").fill("复投");
    await expect(popup().getByRole("button")).toHaveCount(1);
    await popup().getByRole("button", { name, exact: true }).click();
    await expect(popup()).toHaveCount(0);
    await expect(filter().getByRole("button", { name: `内容排期: ${name}`, exact: true })).toBeVisible();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    if (listTitle || tab === "脚本管理") await expect(page.locator("tbody tr")).toHaveCount(1);
    else await expect(page.getByText("无痕防晒冰丝丝袜场景模特图.png", { exact: true })).toHaveCount(0);

    await page.evaluate(async renamed => {
      const { resourceTagStore: store } = await import("/src/lib/resourceTags.ts");
      store.setPersonalTags(store.getPersonalTags().map(t => t.id === "filter-test" ? { ...t, name: renamed } : t));
    }, renamed);
    await expect(filter().getByRole("button", { name: `内容排期: ${renamed}`, exact: true })).toBeVisible();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    await reset();
    await scopeButtons().getByRole("button", { name: "无个人标签", exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    await scopeButtons().getByRole("button", { name: "有个人标签", exact: true }).click();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    await reset();
    await filter().getByRole("textbox").fill(renamed);
    await expect(filter().getByRole("button", { name: "内容排期", exact: true })).toBeVisible();
    await expect(filter().getByRole("button", { name: "资料用途", exact: true })).toHaveCount(0);
    await reset();
    await expect(filter().getByRole("textbox")).toHaveValue("");
    await group.hover();
    await page.keyboard.press("Escape");
    await expect(popup()).toHaveCount(0);
    await page.evaluate(async name => {
      const { resourceTagStore: store } = await import("/src/lib/resourceTags.ts");
      store.setPersonalTags(store.getPersonalTags().map(t => t.id === "filter-test" ? { ...t, name } : t));
    }, name);
    console.log(`PASS: ${tab} shared style, hover search, exact filtering, rename, presence filters and reset`);
  }

  await button("图片管理").click();
  await filter().getByRole("button", { name: "内容排期", exact: true }).hover();
  await popup().getByRole("button", { name, exact: true }).click();
  await page.evaluate(async () => {
    const { resourceTagStore: store } = await import("/src/lib/resourceTags.ts");
    store.setPersonalTags(store.getPersonalTags().filter(t => t.id !== "filter-test"));
  });
  await expect(scopeButtons().getByRole("button", { name: "全部", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("防晒植物提取精华液展图.jpg", { exact: true }).first()).toBeVisible();

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const group = filter().getByRole("button", { name: "资料用途", exact: true });
    await group.hover();
    await expect(popup()).toBeVisible();
    await popup().hover();
    await assertInViewport();
    await page.screenshot({ path: `tmp/personal-tag-filters-${viewport.width}.png` });
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  console.log("PASS: deleted filter clears without deleting resources; desktop/mobile popovers remain inside viewport");
} finally {
  await browser.close();
}
