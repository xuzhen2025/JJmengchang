import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const dialog = () => page.getByRole("dialog").last();
const confirm = () => dialog().getByRole("button", { name: "确定", exact: true }).click();
const cancel = () => dialog().getByRole("button", { name: "取消", exact: true }).click();
const switchMode = async mode => {
  await page.locator("#btn-client-mode-dropdown").click();
  await button(mode === "admin" ? "管理端" : "用户端").click();
};
const resources = async tab => {
  await page.locator("#sidebar-item-home").click();
  await page.locator("#sidebar-item-resources").click();
  await button(tab).click();
};
try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "admin" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  const sources = [["finished", "成片", "成片管理", "fv1"], ["materials", "素材", "素材管理", "fv1"], ["images", "图片", "图片管理", "img-1"], ["audio", "音频", "音频管理", "aud-1"], ["scripts", "脚本", "脚本管理", "S-10291"]];
  for (const [scope, partition, tab, id] of sources) {
    await button("分类管理").click();
    const root = page.getByTestId("category-management");
    await root.getByRole("button", { name: partition, exact: true }).click();
    let current = await page.evaluate(async ({ scope, id }) => {
      const { resourceConfigStore: store } = await import("/src/lib/resourceConfig.ts");
      return store.project(scope, { id });
    }, { scope, id });
    assert.ok(current.primaryCategoryId, `${scope} seed is classified`);
    const parent = root.locator(`[data-category-id="${current.primaryCategoryId}"]`);
    await parent.click();
    if (!current.secondaryCategoryId) {
      await root.getByTestId("category-secondary").getByRole("button", { name: "添加", exact: true }).click();
      await dialog().getByRole("textbox").fill("二级联动案例");
      await confirm();
      current = await page.evaluate(async ({ scope, id, primary }) => {
        const { resourceConfigStore: store } = await import("/src/lib/resourceConfig.ts");
        store.assign(scope, { id }, { primaryCategory: primary, secondaryCategory: "二级联动案例" });
        return store.project(scope, { id });
      }, { scope, id, primary: current.primaryCategory });
    }
    await parent.getByTitle("删除分类").click();
    await expect(page.getByRole("status")).toContainText("存在资源");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const child = root.locator(`[data-category-id="${current.secondaryCategoryId}"]`);
    await child.getByTitle("删除分类").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await child.getByTitle("编辑名称").click();
    const renamed = `${partition}秋季案例`;
    await dialog().getByRole("textbox").fill(renamed);
    await confirm();
    await switchMode("user");
    await resources(tab);
    const filter = page.getByTestId(`${scope}-secondary-filter`);
    await expect(filter.getByRole("button", { name: renamed, exact: true })).toBeVisible();
    await filter.getByRole("button", { name: renamed, exact: true }).click();
    assert.equal(await page.evaluate(async ({ scope, id }) => (await import("/src/lib/resourceConfig.ts")).resourceConfigStore.project(scope, { id }).secondaryCategory, { scope, id }), renamed);
    await switchMode("admin");
    console.log(`PASS: ${scope} parent/child deletion guard and category rename -> resource filter`);
  }

  for (const [kind, label, renamed] of [["video", "视频状态", "复核通过"], ["script", "脚本状态", "脚本可拍摄"]]) {
    await button(label).click();
    await page.locator("tbody tr").filter({ has: page.getByText("审核通过", { exact: true }) }).getByRole("button", { name: "编辑", exact: true }).click();
    await dialog().getByRole("textbox").first().fill(renamed);
    await confirm();
    const row = page.locator("tbody tr").filter({ has: page.getByText(renamed, { exact: true }) });
    await row.getByTitle("点击设置背景颜色").click();
    await page.getByTitle("科技蓝", { exact: true }).click();
    await row.getByRole("button", { name: "删除", exact: true }).click();
    await confirm();
    await expect(dialog()).toBeVisible();
    await expect(page.getByRole("status")).toContainText("替代状态");
    await cancel();
    await switchMode("user");
    for (const [scope, tab] of kind === "video" ? [["finished", "成片管理"], ["materials", "素材管理"]] : [["scripts", "脚本管理"]]) {
      await resources(tab);
      await expect(page.getByTestId(`${scope}-status-filter`).getByRole("button", { name: renamed, exact: true })).toBeVisible();
      await page.getByTestId(`${scope}-status-filter`).getByRole("button", { name: renamed, exact: true }).click();
      await expect(page.getByText(renamed, { exact: true }).last()).toHaveCSS("background-color", "rgb(37, 99, 235)");
    }
    await switchMode("admin");
    await button(label).click();
    await page.locator("tbody tr").filter({ has: page.getByText(renamed, { exact: true }) }).getByRole("button", { name: "删除", exact: true }).click();
    await dialog().getByRole("checkbox").check();
    await confirm();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    assert.ok(await page.evaluate(async ({ kind, renamed }) => !(await import("/src/lib/resourceConfig.ts")).resourceConfigStore.getStatusCatalog(kind).some(s => s.name === renamed), { kind, renamed }));
    console.log(`PASS: ${kind} status rename/color -> resource filters; replacement deletion`);
  }

  await switchMode("user");
  await resources("脚本管理");
  const copyStatus = await page.evaluate(async () => {
    const { resourceConfigStore: store } = await import("/src/lib/resourceConfig.ts");
    store.setStatusCatalog("script", prev => prev.map((status, index) => ({ ...status, isDefault: index === 1 })));
    return store.defaultStatus("scripts");
  });
  await page.locator("tbody tr").first().getByRole("button", { name: "复制", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("(副本)");
  await expect(page.locator("tbody tr").first()).toContainText(copyStatus);
  console.log("PASS: copying a script uses the configured default status, not the source status ID");
  await switchMode("admin");

  await button("任务").click();
  await button("新增字段").click();
  await dialog().getByPlaceholder("请输入字段名称").fill("拍摄地点");
  await dialog().getByRole("combobox").selectOption("文本");
  await dialog().getByRole("radio", { name: "必填", exact: true }).check();
  await confirm();
  await switchMode("user");
  await page.locator("#sidebar-item-task_collaboration").click();
  await button("发布任务").click();
  await expect(dialog().getByLabel("拍摄地点", { exact: false })).toBeVisible();
  await confirm();
  await expect(dialog().getByText("请填写拍摄地点", { exact: true })).toBeVisible();
  await cancel();

  await resources("脚本管理");
  await page.locator("tbody tr").first().getByRole("button", { name: "发布任务", exact: true }).click();
  await confirm();
  await expect(dialog().getByText("请填写拍摄地点", { exact: true })).toBeVisible();
  await dialog().locator("#task-field-tf-product").selectOption("抗衰精华液");
  await dialog().getByLabel("拍摄地点", { exact: false }).fill("杭州滨江摄影棚");
  await confirm();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const saved = await page.evaluate(async () => (await import("/src/components/TaskCollaborationView.tsx")).getTaskRecords()[0]);
  assert.ok(saved.customFields.fields.some(f => f.name === "拍摄地点"));
  await resources("脚本管理");
  await page.getByText("脚本 1 - 口播温和洁面破圈案", { exact: true }).first().click();
  await button("发布任务").click();
  await confirm();
  await expect(dialog().getByText("请填写拍摄地点", { exact: true })).toBeVisible();
  await cancel();

  await switchMode("admin");
  await button("任务").click();
  await page.locator("tbody tr").filter({ hasText: "拍摄地点" }).getByRole("button", { name: "编辑", exact: true }).click();
  await dialog().getByPlaceholder("请输入字段名称").fill("取景地点");
  await confirm();
  await switchMode("user");
  await page.locator("#sidebar-item-task_collaboration").click();
  await page.locator("tbody tr").filter({ hasText: saved.id }).getByRole("button", { name: "编辑", exact: true }).click();
  await expect(dialog().getByLabel("拍摄地点", { exact: false })).toHaveValue("杭州滨江摄影棚");
  await cancel();
  await button("发布任务").click();
  await expect(dialog().getByLabel("取景地点", { exact: false })).toBeVisible();
  await cancel();
  console.log("PASS: all three publish forms use current fields; created task survives navigation with original schema");

  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.evaluate(async () => (await import("/src/lib/taskFieldConfig.ts")).taskFieldStore.getFields().length), 2);
  assert.ok(await page.evaluate(async id => !(await import("/src/components/TaskCollaborationView.tsx")).getTaskRecords().some(t => t.id === id), saved.id));
  assert.deepEqual(errors, []);
  console.log("PASS: refresh restores initial configuration and tasks; no page errors");
} catch (error) {
  await page.screenshot({ path: "tmp/resource-config-failure.png" });
  throw error;
} finally { await browser.close(); }
