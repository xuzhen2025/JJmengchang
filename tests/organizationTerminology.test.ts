import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../src/data/adminAccounts";
import { memberOrganization, readReportOrganization } from "../src/lib/analyticsOrganization";
import { teamTerminology } from "../src/lib/organizationTerminology";

test("team wording leaves organization keys and names without the old term intact", () => {
  assert.equal(teamTerminology("所属部门 / 部门成员 / 仅本部门"), "所属团队 / 团队成员 / 仅本团队");
  assert.equal(teamTerminology("department deptId dept_tree dept_1"), "department deptId dept_tree dept_1");
  assert.equal(teamTerminology("电商投放一部"), "电商投放一部");
  assert.equal(teamTerminology("综合部门"), "综合团队");
});

test("saved member titles migrate without changing team membership or permissions", () => {
  const original = { ...INITIAL_MEMBERS.find(member => member.id === "mem_1002")!, roleName: "部门负责人/主管" };
  const values = new Map<string, string>([
    ["cloud_video_depts", JSON.stringify(INITIAL_DEPTS)],
    ["cloud_video_members", JSON.stringify([original])],
    ["mengchang-report-members-v1", "1"],
    ["mengchang-demo-operator-v1", "1"],
  ]);
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  try {
    const organization = readReportOrganization();
    assert.deepEqual(organization.depts, INITIAL_DEPTS);
    assert.deepEqual(organization.members, [{ ...original, roleName: "团队负责人/主管" }]);
    assert.equal(memberOrganization(organization, original.id).department, "电商投放一部");
    assert.deepEqual(readReportOrganization(), organization);
    assert.deepEqual(JSON.parse(values.get("cloud_video_members")!), organization.members);
  } finally {
    if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("source copy uses team terminology except for explicit legacy compatibility values", () => {
  const sourceRoot = new URL("../src/", import.meta.url);
  const compatibilityFiles = new Set([
    "data/adminAccounts.ts", "components/AdminSystemManagementView.tsx", "lib/organizationTerminology.ts",
  ]);
  function inspect(directory: URL, prefix = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = `${prefix}${entry.name}`;
      const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
      if (entry.isDirectory()) { inspect(url, `${relative}/`); continue; }
      if (!/\.tsx?$/.test(entry.name)) continue;
      let source = readFileSync(url, "utf8");
      if (compatibilityFiles.has(relative)) {
        source = source.replaceAll('"综合部门"', '"legacy-team-type"')
          .replaceAll('value="内容部门"', 'value="legacy-content-type"')
          .replaceAll('value="投放部门"', 'value="legacy-delivery-type"')
          .replaceAll('"管理本部门及下级分组的任务、内容、数据与积分审批"', '"legacy-role-description"')
          .replaceAll('replaceAll("部门", "团队")', 'replaceLegacyTerm()');
      }
      assert.ok(!source.includes("部门"), `${relative} contains outdated wording`);
    }
  }
  inspect(sourceRoot);
  const admin = readFileSync(new URL("components/AdminSystemManagementView.tsx", sourceRoot), "utf8");
  assert.ok(admin.includes('value="综合部门">综合团队</option>'));
  assert.ok(admin.includes("{teamTerminology(d.type)}"));
});
