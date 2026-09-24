import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../src/data/adminAccounts";
import { createAdStore } from "../src/lib/adPush";
import { createReportFacts, qualityReport, reportTotals, REPORT_START, REPORT_TODAY } from "../src/lib/reportDemoData";
import { INITIAL_PUBLIC_TAG_GROUPS } from "../src/lib/resourceTags";
import { PLATFORM_TAG_DIMENSIONS, platformTagGroupKey, platformTagTable, selectPlatformTagFacts } from "../src/lib/platformTagAnalytics";

const facts = createReportFacts(createAdStore().accounts, { depts: INITIAL_DEPTS, members: INITIAL_MEMBERS }, INITIAL_PUBLIC_TAG_GROUPS,
  [{ name: "美妆护肤", children: [{ name: "护肤精华" }] }]);
const currencyNumber = (value: string | number) => Number(String(value).replace(/[¥,]/g, ""));

test("five dimensions expose the reference columns on both platforms", () => {
  const identities = {
    team: ["部门"], group: ["部门", "分组"], user: ["部门", "分组", "用户"],
    account: ["广告账户", "主体", "部门", "分组", "用户", "一级分类", "二级分类"],
  };
  for (const platform of ["巨量千川", "巨量广告"]) {
    const selected = selectPlatformTagFacts(facts, platform, "summary", {});
    assert.ok(selected.length > 0);
    for (const { id } of PLATFORM_TAG_DIMENSIONS) {
      const table = platformTagTable(selected, id);
      const headers = table.columns.map(column => column.label);
      if (id === "summary") {
        assert.deepEqual(headers, ["广告标签", "素材数量", "数量占比", "消耗", "消耗占比"]);
        assert.equal(table.rows.length, 6);
        assert.equal(table.total.values.count, reportTotals(selected).materials);
        assert.equal(table.rows.reduce((sum, row) => sum + Number(row.values.count), 0), reportTotals(selected).materials);
        assert.ok(Math.abs(table.rows.reduce((sum, row) => sum + currencyNumber(row.values.spend), 0) - reportTotals(selected).spend) < 0.001);
      } else {
        assert.deepEqual(headers.slice(0, identities[id].length), identities[id]);
        assert.equal(headers.length, identities[id].length + 9);
        const total = qualityReport(selected);
        for (const key of ["totalMaterials", "firstRelease", "highQuality", "lowEfficiency", "lowQuality", "homogeneitySevere", "homogeneityRisk"] as const) {
          assert.equal(table.total.values[key], total[key]);
          assert.equal(table.rows.reduce((sum, row) => sum + Number(row.values[key]), 0), total[key]);
        }
      }
      for (const row of [table.total, ...table.rows]) {
        assert.ok(table.columns.every(column => row.values[column.key] !== undefined));
      }
    }
  }
});

test("same-named groups and employees remain distinct and account categories do not collapse", () => {
  const original = facts[0];
  const sample = [
    { ...original, id: "one", materialId: "one", department: "内容一部", group: "剪辑组", person: "李明", memberId: "member-a" },
    { ...original, id: "two", materialId: "two", department: "内容二部", group: "剪辑组", person: "李明", memberId: "member-b" },
  ];
  assert.equal(platformTagTable(sample, "group").rows.length, 2);
  assert.equal(platformTagTable(sample, "user").rows.length, 2);
  assert.equal(selectPlatformTagFacts(sample, original.platform, "group", { groupKey: platformTagGroupKey("内容二部", "剪辑组") })[0].id, "two");
  assert.equal(selectPlatformTagFacts(sample, original.platform, "user", { memberId: "member-b" })[0].id, "two");
  const categories = [sample[0], { ...sample[0], id: "three", materialId: "three", subcategory: "乳液" }];
  assert.equal(platformTagTable(categories, "account").rows.length, 2);
  assert.deepEqual(platformTagTable(categories, "account").rows.map(row => row.values.subcategory), [original.subcategory, "乳液"]);
  const sameGroupNames = [sample[0], { ...sample[1], department: sample[0].department }];
  assert.equal(platformTagTable(sameGroupNames, "user").rows.length, 2);
});

test("filters combine by dimension without hidden conditions leaking into other views", () => {
  const row = facts[0];
  const result = selectPlatformTagFacts(facts, row.platform, "account", {
    groupKey: platformTagGroupKey(row.department, row.group), subject: " 梦畅 ", category: row.category,
    department: "隐藏部门", memberId: "hidden-member", start: row.date, end: row.date,
  });
  assert.ok(result.length > 0);
  assert.ok(result.every(item => item.platform === row.platform && item.date === row.date && item.department === row.department && item.group === row.group));
  assert.equal(selectPlatformTagFacts(facts, row.platform, "account", { subject: "不存在的主体" }).length, 0);
  assert.ok(selectPlatformTagFacts(facts, row.platform, "summary", { subject: "不存在的主体", memberId: "hidden", groupKey: "hidden", department: "hidden" }).length > 0);
  assert.ok(selectPlatformTagFacts(facts, row.platform, "team", { department: row.department }).every(item => item.department === row.department));
  assert.equal(selectPlatformTagFacts(facts, row.platform, "summary", { category: "不存在的分类" }).length, 0);
  assert.equal(selectPlatformTagFacts(facts, row.platform, "summary", { start: REPORT_TODAY, end: REPORT_START }).length, 0);
});

test("empty results retain the correct columns, no fabricated rows or invalid ratios", () => {
  for (const { id } of PLATFORM_TAG_DIMENSIONS) {
    const table = platformTagTable([], id);
    assert.equal(table.rows.length, 0);
    assert.ok(table.columns.length > 0);
    assert.ok(!JSON.stringify(table).includes("NaN"));
    assert.ok(!JSON.stringify(table).includes("Infinity"));
  }
});
