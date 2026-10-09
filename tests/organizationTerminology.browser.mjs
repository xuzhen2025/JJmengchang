import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const noOldCopy = async () => assert.ok(!(await page.locator("body").innerText()).includes("部门"));
const openSystem = async () => {
  await page.locator("#sidebar-item-system_management").click();
  await expect(page.getByTestId("default-roles")).toBeVisible();
};

try {
  await mkdir("tmp/team-terminology", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "admin" })));
  await page.goto(process.env.BASE_URL || "http://localhost:3005", { waitUntil: "domcontentloaded" });
  await openSystem();
  const before = await page.evaluate(() => {
    const roles = JSON.parse(localStorage.getItem("cloud_video_roles_v2"));
    const members = JSON.parse(localStorage.getItem("cloud_video_members"));
    const depts = JSON.parse(localStorage.getItem("cloud_video_depts"));
    roles.find(role => role.id === "role_dept_head").name = "部门负责人/主管";
    roles.find(role => role.id === "role_dept_head").description = "管理本部门及下级分组的内容、数据与积分配置";
    members.find(member => member.id === "mem_1002").roleName = "部门负责人/主管";
    depts.find(dept => dept.id === "dept_1").type = "综合部门";
    localStorage.setItem("cloud_video_roles_v2", JSON.stringify(roles));
    localStorage.setItem("cloud_video_members", JSON.stringify(members));
    localStorage.setItem("cloud_video_depts", JSON.stringify(depts));
    return { roles, members, depts };
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await openSystem();
  await page.getByTestId("other-roles").getByText("团队负责人/主管", { exact: true }).click();
  await expect(button("本团队及下级")).toBeVisible();
  await noOldCopy();
  const after = await page.evaluate(() => ({
    roles: JSON.parse(localStorage.getItem("cloud_video_roles_v2")),
    members: JSON.parse(localStorage.getItem("cloud_video_members")),
    depts: JSON.parse(localStorage.getItem("cloud_video_depts")),
  }));
  assert.deepEqual(after.depts, before.depts);
  assert.deepEqual(after.members, before.members.map(member => ({ ...member, roleName: member.roleName.replaceAll("部门", "团队") })));
  assert.deepEqual(after.roles, before.roles.map(role => ({ ...role, name: role.name.replaceAll("部门", "团队"), description: role.description.replaceAll("部门", "团队") })));

  await button("组织团队架构").click();
  await expect(page.getByText("公司 > 团队 > 分组 > 人员", { exact: true })).toBeVisible();
  await expect(page.getByText("综合团队", { exact: true })).toBeVisible();
  await noOldCopy();
  await page.screenshot({ path: "tmp/team-terminology/organization.png", fullPage: true, animations: "disabled" });
  await page.getByTitle("修改团队配置", { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "编辑团队配置", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "职责类型", exact: true })).toHaveValue("综合部门");
  await expect(page.getByRole("combobox", { name: "职责类型", exact: true }).locator("option:checked")).toHaveText("综合团队");
  await noOldCopy();
  await page.screenshot({ path: "tmp/team-terminology/edit-team.png", fullPage: true, animations: "disabled" });
  await button("保存配置").click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("cloud_video_depts")).find(dept => dept.id === "dept_1").type), "综合部门");

  await button("人员账号管理").click();
  await expect(page.getByRole("columnheader", { name: "所属团队", exact: true })).toBeVisible();
  await noOldCopy();
  await button("新增人员").click();
  await expect(page.getByRole("combobox", { name: "所属团队 *", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "所属分组", exact: true })).toBeVisible();
  await noOldCopy();
  await button("取消").click();
  assert.deepEqual(errors, []);
  console.log("PASS: admin team wording, legacy role migration, unchanged grants/membership, organization and member dialogs, stored team type compatibility.");
} catch (error) {
  await page.screenshot({ path: "tmp/team-terminology/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
