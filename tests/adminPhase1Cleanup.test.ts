import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import type { RolePermission } from "../src/components/AdminSystemManagementView";
import { createResourceConfigStore } from "../src/lib/resourceConfig";

// These tests exercise role data, not browser styles imported by the admin view.
const cssHook = registerHooks({
  load(url, context, nextLoad) {
    return url.endsWith(".css")
      ? { format: "module", source: "export default {};", shortCircuit: true }
      : nextLoad(url, context);
  },
});
const { ALL_PERMISSION_KEYS, normalizeSystemRoles } = await import("../src/components/AdminSystemManagementView").finally(() => cssHook.deregister());

const removedKeys = ["ab_task_manage", "ab_message_rule_manage", "uc_home_view", "uc_message_view", "uc_message_handle", "uc_credit_approve", "ab_credit_approve"];
const role = (overrides: Partial<RolePermission> = {}): RolePermission => ({
  id: "custom-editor", name: "Editor", category: "custom", type: "custom",
  description: "Custom role", memberCount: 3, enabled: false, dataScope: "self",
  checkedKeys: ["uc_derivation"], permissions: ["uc_finished_ad_push"],
  ...overrides,
});

test("phase-one permission catalog excludes removed modules and retains video operations", () => {
  for (const key of removedKeys) assert.ok(!ALL_PERMISSION_KEYS.includes(key), key);
  for (const key of ["uc_derivation", "uc_finished_ad_push", "uc_finished_ad_records", "ab_video_status_manage", "ab_system_setting_manage"]) {
    assert.ok(ALL_PERMISSION_KEYS.includes(key), key);
  }
});

test("legacy permissions are removed without changing role identity, order, scope or membership", () => {
  const inputs = [role({ checkedKeys: ["uc_derivation", ...removedKeys], permissions: ["uc_finished_ad_push", ...removedKeys] }), role({ id: "other-editor" })];
  const original = structuredClone(inputs);
  const actual = normalizeSystemRoles(inputs).filter(item => inputs.some(input => input.id === item.id));
  assert.deepEqual(actual, [role(), role({ id: "other-editor" })]);
  assert.deepEqual(inputs, original);
});

test("super administrator retains all current permissions and stays protected", () => {
  const actual = normalizeSystemRoles([role({ id: "role_super_admin", checkedKeys: removedKeys, permissions: removedKeys, memberCount: 7 })]);
  const admin = actual.find(item => item.id === "role_super_admin")!;
  assert.deepEqual(admin.checkedKeys, ALL_PERMISSION_KEYS);
  assert.deepEqual(admin.permissions, []);
  assert.equal(admin.memberCount, 7);
  assert.equal(admin.enabled, true);
  assert.equal(admin.dataScope, "all");
  assert.equal(admin.category, "default");
  assert.equal(admin.type, "preset");
  assert.deepEqual(normalizeSystemRoles(actual), actual);
});

test("ad plan permission remains configurable and existing push aliases migrate without broadening grants", () => {
  assert.ok(ALL_PERMISSION_KEYS.includes("uc_ad_plan_manage"));
  const migrated = normalizeSystemRoles([role({ checkedKeys: ["uc_ad_push"], permissions: ["uc_ad_plan_manage"] })]).find(item => item.id === "custom-editor")!;
  assert.deepEqual(migrated.checkedKeys, ["uc_finished_ad_push"]);
  assert.deepEqual(migrated.permissions, ["uc_ad_plan_manage"]);
});

test("only unchanged obsolete default descriptions migrate", () => {
  const descriptions = [
    ["role_staff", "基础工作台、本人资源与被分配任务的最小可用权限", "爆款复刻与本人资源的基础使用权限"],
    ["role_dept_head", "管理本部门及下级分组的任务、内容、数据与积分审批", "管理本部门及下级分组的内容、数据与积分配置"],
    ["role_finance", "管理企业积分账户、审批记录及全公司业务数据只读查看", "管理企业积分账户、积分明细及全公司业务数据只读查看"],
    ["role_content_head", "内容生产质量控制、AI复刻模版审批与团队质检", "内容生产质量控制、资源分类与脚本模板管理"],
  ];
  const actual = normalizeSystemRoles(descriptions.map(([id, description]) => role({ id, description })));
  for (const [id, , description] of descriptions) assert.equal(actual.find(item => item.id === id)!.description, description);
  assert.deepEqual(normalizeSystemRoles(actual), actual);
  const custom = role({ id: "role_staff", description: "My own description" });
  assert.deepEqual(normalizeSystemRoles([custom]).find(item => item.id === custom.id), custom);
});

test("existing legacy-named custom roles are not deleted", () => {
  const custom = role({ id: "role_live_head" });
  assert.deepEqual(normalizeSystemRoles([custom]).find(item => item.id === custom.id), custom);
});

test("video and script statuses retain editing properties without notification configuration", () => {
  const store = createResourceConfigStore();
  for (const kind of ["video", "script"] as const) {
    const statuses = store.getStatusCatalog(kind);
    assert.ok(statuses.length);
    assert.equal(statuses.filter(item => item.isDefault).length, 1);
    for (const status of statuses) {
      assert.equal("notifyEnabled" in status, false);
      assert.ok(status.textColor && status.bgColor);
      assert.equal(typeof status.weight, "number");
    }
  }
});

test("removed admin pages, notification settings and script-task settings have no remaining implementation", () => {
  const root = new URL("../src/", import.meta.url);
  assert.equal(existsSync(new URL("components/TaskFieldsManagementView.tsx", root)), false);
  const admin = readFileSync(new URL("components/AdminView.tsx", root), "utf8");
  assert.doesNotMatch(admin, /TaskFieldsManagementView|"tasks"|onOpenTaskQueue|onTriggerTask/);
  const system = readFileSync(new URL("components/AdminSystemManagementView.tsx", root), "utf8");
  assert.doesNotMatch(system, /NotificationCategory|INITIAL_NOTIFICATION_CATEGORIES|cloud_video_notification_settings_v2|videoPushSuccessNotify|autoChangeStatusOnScriptLinked|scriptLinkedDefaultScriptStatus|notifyUser/);
  assert.match(system, /autoChangeStatusOnPushSuccess/);
  for (const file of ["VideoStatusManagementView.tsx", "ScriptStatusManagementView.tsx"]) {
    assert.doesNotMatch(readFileSync(new URL(`components/${file}`, root), "utf8"), /notifyEnabled|消息通知/);
  }
});
