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
const noteTrigger = button("编辑视频备注");
const dialog = page.getByRole("dialog", { name: "编辑备注", exact: true });
const input = dialog.getByRole("textbox", { name: "视频备注", exact: true });
const save = dialog.getByRole("button", { name: "保存", exact: true });
const cancel = dialog.getByRole("button", { name: "取消", exact: true });
const close = dialog.getByRole("button", { name: "关闭", exact: true });
const history = page.locator('select[title*="备注"]');
const readSaved = (scope, id) => page.evaluate(({ scope, id }) =>
  JSON.parse(sessionStorage.getItem(`mengchang-resource-edits-v1-${scope}`) || "{}")[id],
{ scope, id });

try {
  await mkdir("tmp/video-notes", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "putongyonghu", mode: "user" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3003", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-resources").click();

  for (const [scope, tab, back, testId, idAttr] of [
    ["finished", "成片管理", "返回成片列表", "finished-video-card", "data-video-id"],
    ["materials", "素材管理", "返回素材列表", "material-video-card", "data-resource-id"],
    ["thirdParty", "第三方管理", "返回第三方列表", "material-video-card", "data-resource-id"],
  ]) {
    await button(tab).click();
    const card = page.getByTestId(testId).first();
    const id = await card.getAttribute(idAttr);
    await card.click();
    await expect(noteTrigger).toHaveText("暂无备注");
    await expect(page.getByRole("textbox", { name: "视频备注", exact: true })).toHaveCount(0);
    await expect(button("保存")).toHaveCount(0);
    await expect(button("取消")).toHaveCount(0);
    const original = await readSaved(scope, id);
    await noteTrigger.click();
    await expect(dialog).toBeVisible();
    await expect(input).toBeFocused();
    await expect(save).toBeDisabled();
    await input.fill("Discard this draft");
    await input.press("Tab");
    assert.deepEqual(await readSaved(scope, id), original);
    await expect(noteTrigger).toHaveText("暂无备注");
    await expect(history).toBeDisabled();
    await cancel.click();
    await expect(dialog).toHaveCount(0);
    await expect(noteTrigger).toBeFocused();
    assert.deepEqual(await readSaved(scope, id), original);

    await noteTrigger.click();
    await expect(input).toHaveValue("");
    await input.fill(`  ${scope} saved note  `);
    await save.click();
    await expect(noteTrigger).toHaveText(`${scope} saved note`);
    const firstSave = await readSaved(scope, id);
    assert.equal(firstSave.notes, `${scope} saved note`);
    assert.equal(firstSave.notesHistory.length, 1);
    await expect(dialog).toHaveCount(0);
    for (const dismiss of [() => cancel.click(), () => close.click(), () => input.press("Escape")]) {
      await noteTrigger.click();
      await expect(input).toHaveValue(firstSave.notes);
      await input.fill("Unsaved close draft");
      await dismiss();
      await expect(dialog).toHaveCount(0);
      await expect(noteTrigger).toHaveText(firstSave.notes);
      await expect(noteTrigger).toBeFocused();
      assert.deepEqual(await readSaved(scope, id), firstSave);
    }
    await button(back).click();
    await card.click();
    await expect(noteTrigger).toHaveText(firstSave.notes);
    assert.deepEqual(await readSaved(scope, id), firstSave);

    await noteTrigger.click();
    await input.fill(`${scope} second note`);
    await save.click();
    const secondSave = await readSaved(scope, id);
    assert.equal(secondSave.notesHistory.length, 2);
    await history.selectOption(firstSave.notesHistory[0].id);
    await expect(input).toHaveValue(firstSave.notes);
    assert.deepEqual(await readSaved(scope, id), secondSave);
    await cancel.click();
    await expect(dialog).toHaveCount(0);
    await expect(noteTrigger).toHaveText(secondSave.notes);
    await history.selectOption(firstSave.notesHistory[0].id);
    await save.click();
    assert.equal((await readSaved(scope, id)).notes, firstSave.notes);

    await noteTrigger.click();
    await input.fill("");
    await save.click();
    const cleared = await readSaved(scope, id);
    assert.equal(cleared.notes, "");
    assert.equal(cleared.notesHistory.length, 4);
    assert.equal(cleared.notesHistory[0].content, "");
    assert.equal(new Set(cleared.notesHistory.map(entry => entry.id)).size, 4);

    if (scope === "finished") {
      await noteTrigger.click();
      await input.fill("Storage failure retains the draft");
      await page.evaluate(() => {
        window.originalNoteSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === "mengchang-resource-edits-v1-finished") throw new DOMException("Storage full", "QuotaExceededError");
          return window.originalNoteSetItem.call(this, key, value);
        };
      });
      await save.click();
      await expect(page.getByText("保存失败，请检查浏览器存储空间后重新操作", { exact: true })).toBeVisible();
      await expect(input).toHaveValue("Storage failure retains the draft");
      await expect(save).toBeEnabled();
      assert.deepEqual(await readSaved(scope, id), cleared);
      await page.evaluate(() => { Storage.prototype.setItem = window.originalNoteSetItem; });
      await cancel.click();

      await expect(page.getByText("保存失败，请检查浏览器存储空间后重新操作", { exact: true })).toBeHidden();
      await page.screenshot({ path: "tmp/video-notes/read-only.png" });
      await noteTrigger.focus();
      await noteTrigger.press("Enter");
      await expect(input).toBeFocused();
      await input.fill("产品质地特写已确认，下一版补充使用前后对比镜头。");
      await close.focus();
      await close.press("Shift+Tab");
      await expect(save).toBeFocused();
      await save.press("Tab");
      await expect(close).toBeFocused();
      await input.focus();
      await dialog.locator(":scope > div").screenshot({ path: "tmp/video-notes/note-editor.png" });
      await page.screenshot({ path: "tmp/video-notes/desktop.png" });
      for (const [width, height] of [[1440, 1000], [1024, 768], [430, 900], [430, 460]]) {
        await page.setViewportSize({ width, height });
        await save.scrollIntoViewIfNeeded();
        const box = await dialog.locator(":scope > div").boundingBox();
        const saveBox = await save.boundingBox();
        const cancelBox = await cancel.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width);
        assert.ok(box.y >= 0 && box.y + box.height <= height);
        assert.ok(saveBox.x >= box.x && saveBox.x + saveBox.width <= box.x + box.width);
        assert.ok(saveBox.y + saveBox.height <= box.y + box.height);
        assert.ok(cancelBox.x >= box.x && cancelBox.x + cancelBox.width <= saveBox.x);
        assert.equal(await save.evaluate(el => {
          const box = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
        }), true);
        await page.screenshot({ path: `tmp/video-notes/dialog-${width}-${height}.png` });
      }
      await page.screenshot({ path: "tmp/video-notes/narrow.png" });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await save.click();
      await page.getByRole("main").getByRole("button", { name: "操作记录", exact: true }).click();
      const logs = page.getByRole("heading", { name: "成片操作记录", exact: true }).locator("../../..");
      await expect(logs.locator("tbody tr").first()).toContainText("修改备注");
      await expect(logs.locator("tbody tr").first()).toContainText("产品质地特写已确认");
      await logs.getByRole("button", { name: "关闭", exact: true }).click();
    }

    await button(back).click();
    await card.click();
    await expect(noteTrigger).toHaveText((await readSaved(scope, id)).notes || "暂无备注");
    await button(back).click();
    console.log(`PASS: ${scope} read-only display, modal save, cancel/close/Escape, blur, reopen, history and clearing.`);
  }
  assert.deepEqual(errors, []);
  console.log("PASS: storage error handling, operation log, modal keyboard focus, responsive layout and no runtime errors.");
} catch (error) {
  await page.screenshot({ path: "tmp/video-notes/failure.png" });
  throw error;
} finally {
  await browser.close();
}
