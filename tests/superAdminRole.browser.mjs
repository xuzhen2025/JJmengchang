import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const readRoles = () => page.evaluate(() => JSON.parse(localStorage.getItem("cloud_video_roles_v2")));
const readMembers = () => page.evaluate(() => JSON.parse(localStorage.getItem("cloud_video_members")));
const openSystem = async () => {
  await page.locator("#sidebar-item-system_management").click();
  await expect(page.getByTestId("default-roles")).toBeVisible();
};
const checkLocked = async () => {
  await expect(page.getByTestId("default-roles")).toContainText("超级管理员");
  await expect(page.getByTestId("default-roles")).not.toContainText("普通员工");
  await expect(page.getByTestId("other-roles")).toContainText("普通员工");
  await expect(page.getByTestId("other-roles").getByText("超级管理员", { exact: true })).toHaveCount(0);
  await page.getByTestId("default-roles").getByText("超级管理员", { exact: true }).click();
  for (const name of ["全选", "清空", "仅本人", "本部门及下级", "全公司", "已启用", "保存"]) {
    await expect(button(name)).toBeDisabled();
  }
  await expect(button("全公司")).toHaveAttribute("aria-pressed", "true");
  while (await page.getByRole("button", { name: /^展开/ }).count()) {
    await page.getByRole("button", { name: /^展开/ }).first().click();
  }
  assert.ok(await page.getByRole("checkbox").count() > 70);
  assert.ok(await page.getByRole("checkbox").evaluateAll(nodes => nodes.every(node => node.disabled && node.getAttribute("aria-checked") === "true")));
  await expect(page.getByRole("checkbox", { name: "衍生视频", exact: true })).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "衍生新视频", exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "衍生视频并推送", exact: true })).toHaveCount(0);
  const before = await readRoles();
  await page.getByText("衍生视频", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "衍生视频", exact: true })).toBeChecked();
  assert.deepEqual(await readRoles(), before);
  const expectedKeys = await page.evaluate(async () => (await import("/src/components/AdminSystemManagementView.tsx")).ALL_PERMISSION_KEYS);
  const root = before.find(role => role.id === "role_super_admin");
  assert.deepEqual(new Set(root.checkedKeys), new Set(expectedKeys));
  assert.equal(root.enabled, true);
  assert.equal(root.dataScope, "all");
  assert.equal(root.type, "preset");
  assert.deepEqual(before.filter(role => role.category === "default").map(role => role.id), ["role_super_admin"]);
};

try {
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "admin" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await openSystem();
  await checkLocked();
  const initialRoles = await readRoles();
  const initialMembers = await readMembers();
  await page.screenshot({ path: "tmp/super-admin-role-readonly.png", fullPage: true });
  console.log("PASS: default super administrator has all permissions and read-only controls");

  await page.getByTestId("other-roles").getByText("普通员工", { exact: true }).click();
  const homePermission = page.getByRole("checkbox", { name: "衍生视频", exact: true });
  await expect(homePermission).toBeEnabled();
  await homePermission.click();
  await expect(homePermission).toBeChecked();
  await homePermission.focus();
  await page.keyboard.press("Space");
  await expect(homePermission).not.toBeChecked();
  await button("清空").click();
  await expect(homePermission).not.toBeChecked();
  await button("全选").click();
  await expect(homePermission).toBeChecked();
  await button("仅本人").click();
  await button("已启用").click();
  await expect(button("已停用")).toBeEnabled();
  await button("已停用").click();
  await button("保存").click();
  assert.deepEqual((await readRoles()).find(role => role.id === "role_super_admin"), initialRoles.find(role => role.id === "role_super_admin"));
  assert.deepEqual(await readMembers(), initialMembers);
  console.log("PASS: other roles remain editable; role changes do not reassign members");

  await button("人员账号管理").click();
  await button("新增人员").click();
  await expect(page.getByRole("combobox", { name: "绑定岗位角色", exact: true })).toHaveValue(initialRoles[2].id);
  await button("取消").click();
  await page.getByRole("button", { name: /邀请/ }).first().click();
  await expect(page.getByRole("combobox", { name: "预赋予角色", exact: true })).toHaveValue("role_staff");
  await button("关闭").last().click();
  console.log("PASS: new-member and invitation defaults do not select super administrator");

  const legacy = initialRoles.map(role => role.id === "role_super_admin"
    ? { ...role, name: "Legacy admin", type: "custom", category: "other", enabled: false, dataScope: "self", checkedKeys: [], memberCount: 7 }
    : role.id === "role_staff" ? { ...role, category: "default", enabled: false, checkedKeys: ["uc_derivation"] } : role);
  await page.evaluate(roles => localStorage.setItem("cloud_video_roles_v2", JSON.stringify(roles)), legacy);
  await page.reload({ waitUntil: "domcontentloaded" });
  await openSystem();
  await checkLocked();
  const migrated = await readRoles();
  assert.equal(migrated.find(role => role.id === "role_super_admin").memberCount, 7);
  assert.deepEqual(migrated.filter(role => role.id !== "role_super_admin"), legacy.filter(role => role.id !== "role_super_admin").map(role => ({ ...role, category: role.category === "default" ? "other" : role.category })));
  assert.deepEqual(await readMembers(), initialMembers);
  await page.reload({ waitUntil: "domcontentloaded" });
  await openSystem();
  assert.deepEqual(await readRoles(), migrated);
  console.log("PASS: old disabled/restricted admin is normalized without altering other permissions or members");

  await page.evaluate(roles => localStorage.setItem("cloud_video_roles_v2", JSON.stringify(roles.filter(role => role.id !== "role_super_admin"))), legacy);
  await page.reload({ waitUntil: "domcontentloaded" });
  await openSystem();
  await checkLocked();
  assert.deepEqual(await readMembers(), initialMembers);
  console.log("PASS: missing built-in administrator is restored without promoting members");
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: "tmp/super-admin-role-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
