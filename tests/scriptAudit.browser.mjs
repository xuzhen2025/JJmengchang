import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const title = "脚本 2 - 植萃修护洗发水评测";
const edit = button("修改状态并批注");
const statusRow = edit.locator("..");
const dialog = page.getByRole("dialog", { name: "修改状态并批注", exact: true });
const status = dialog.getByLabel("脚本状态");
const notes = dialog.getByRole("textbox", { name: "审核批注（选填）" });
const displayedNotes = page.getByTestId("script-audit-notes");
const confirm = dialog.getByRole("button", { name: "确定", exact: true });

async function checkDialogBounds() {
  const viewport = page.viewportSize();
  for (const locator of [dialog.locator(":scope > div"), status, notes, confirm]) {
    const box = await locator.boundingBox();
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height, JSON.stringify(box));
  }
  assert.equal(await dialog.evaluate(element => element.parentElement === document.body), true);
}

try {
  await mkdir("tmp", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();
  await page.getByText("脚本管理", { exact: true }).click();
  const configuredStatuses = await page.getByTestId("scripts-status-filter").getByRole("button").allTextContents();
  await button(title).click();
  await expect(button("修改状态")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "审核批注", exact: true }).getByRole("button")).toHaveCount(0);
  await expect(statusRow).toContainText("待审核");
  const originalNotes = await displayedNotes.textContent();

  await edit.click();
  await expect(status).toHaveValue("待审核");
  await expect(notes).toHaveValue(originalNotes);
  assert.deepEqual(await status.locator("option").allTextContents(), ["请选择状态", ...configuredStatuses.filter(value => value !== "全部")]);
  await expect(notes).not.toHaveAttribute("required", "");
  await checkDialogBounds();
  await page.screenshot({ path: "tmp/script-audit-dialog.png" });

  await status.selectOption("审核通过");
  await notes.fill("取消后不应保存");
  await expect(statusRow).toContainText("待审核");
  await expect(displayedNotes).toHaveText(originalNotes);
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await edit.click();
  await expect(status).toHaveValue("待审核");
  await expect(notes).toHaveValue(originalNotes);
  await notes.fill("关闭后不应保存");
  await dialog.getByRole("button", { name: "关闭", exact: true }).click();
  await edit.click();
  await expect(notes).toHaveValue(originalNotes);

  const savedNotes = "产品卖点表达清晰，审核通过。\n拍摄时保留洗前洗后对比镜头。";
  await status.selectOption("审核通过");
  await notes.fill(savedNotes);
  await confirm.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("脚本状态和审核批注已更新", { exact: true })).toBeVisible();
  await expect(statusRow).toContainText("审核通过");
  assert.equal(await displayedNotes.textContent(), savedNotes);
  await page.screenshot({ path: "tmp/script-audit-saved.png" });
  await button("返回脚本列表").click();
  await expect(page.getByRole("row").filter({ has: button(title) })).toContainText("审核通过");
  await button(title).click();
  await edit.click();
  await expect(status).toHaveValue("审核通过");
  await expect(notes).toHaveValue(savedNotes);

  // Clearing a note must survive leaving and reopening the detail page.
  await notes.fill("   ");
  await confirm.click();
  await expect(displayedNotes).toBeEmpty();
  await button("返回脚本列表").click();
  await button(title).click();
  await expect(displayedNotes).toBeEmpty();
  await edit.click();
  await expect(notes).toHaveValue("");
  await status.selectOption("驳回-待修改");
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(statusRow).toContainText("驳回-待修改");
  await expect(displayedNotes).toBeEmpty();

  // A note-only edit does not require a status transition.
  await edit.click();
  await notes.fill("补充产品成分说明后再提交。");
  await confirm.click();
  await expect(statusRow).toContainText("驳回-待修改");
  await expect(displayedNotes).toHaveText("补充产品成分说明后再提交。");

  await edit.click();
  for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await checkDialogBounds();
    await page.screenshot({ path: `tmp/script-audit-dialog-${viewport.width}.png` });
  }
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  assert.deepEqual(errors, []);
  console.log("Script audit dialog: save, cancel, clear, reopen, status sync and viewport checks passed.");
} finally {
  await browser.close();
}
