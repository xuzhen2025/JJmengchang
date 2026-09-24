import assert from "node:assert/strict";
import test from "node:test";
import {
  AD_FACTS,
  REPORT_PLATFORMS,
  REPORT_START,
  REPORT_TODAY,
  adKey,
  adTotals,
  csvText,
  defaultAdFilter,
  filterAdFacts,
  financeRows,
  grouped,
  planTotals,
  qualityTotals,
  dateError,
} from "../src/lib/analyticsData";
import {
  creationTotals,
  taskTotals,
  fileStatusTotals,
} from "../src/lib/platformAnalytics";

test("platform facts reconcile across dimensions and use weighted ratios", () => {
  for (const platform of REPORT_PLATFORMS) {
    const facts = filterAdFacts(
      AD_FACTS.filter((row) => row.platform === platform),
      defaultAdFilter(),
    );
    const total = adTotals(facts);
    assert.ok(facts.length > 100);
    for (const dimension of [
      "department",
      "group",
      "person",
      "account",
      "material",
      "day",
      "month",
    ] as const) {
      const sums = grouped(facts, (row) => adKey(row, dimension)).map(
        ([, rows]) => adTotals(rows),
      );
      assert.ok(
        Math.abs(sums.reduce((sum, row) => sum + row.spend, 0) - total.spend) <
          0.0001,
      );
      assert.equal(
        sums.reduce((sum, row) => sum + row.conversions, 0),
        total.conversions,
      );
    }
    assert.ok(Math.abs(total.roi - total.gmv / total.spend) < 1e-10);
    assert.ok(
      Math.abs(total.gmv - total.paid - total.coupon - total.subsidy) < 1e-6,
    );
    if (platform !== "巨量千川") assert.equal(total.coupon + total.subsidy, 0);
  }
});
test("empty filters, invalid ranges and zero denominators are safe", () => {
  const filter = defaultAdFilter();
  assert.equal(
    filterAdFacts(AD_FACTS, { ...filter, query: "no-such-advertiser" }).length,
    0,
  );
  assert.equal(
    filterAdFacts(AD_FACTS, {
      ...filter,
      start: "2000-01-01",
      end: "2000-02-01",
    }).length,
    0,
  );
  assert.ok(dateError("2026-10-01", "2026-01-01"));
  assert.ok(Object.values(adTotals([])).every((value) => value === 0));
  const row = AD_FACTS[0];
  const selected = filterAdFacts(AD_FACTS, {
    ...filter,
    departments: [row.department],
    accounts: [row.accountId],
  });
  assert.ok(
    selected.every(
      (f) => f.department === row.department && f.accountId === row.accountId,
    ),
  );
});
test("finance ledgers balance and reconcile with delivery spend", () => {
  const filter = defaultAdFilter(),
    facts = AD_FACTS.filter((row) => row.platform === "巨量千川"),
    rows = financeRows(facts, filter);
  assert.ok(
    Math.abs(
      rows.reduce((sum, row) => sum + row.spend, 0) -
        adTotals(filterAdFacts(facts, filter)).spend,
    ) < 1e-6,
  );
  for (const row of rows) {
    assert.ok(
      Math.abs(
        row.opening +
          row.deposit +
          row.transferIn -
          row.transferOut -
          row.spend -
          row.balance,
      ) < 1e-6,
    );
    assert.ok(
      Math.abs(row.spend - row.cash - row.grant - row.rebate - row.wallet) <
        1e-6,
    );
    assert.ok(Math.abs(row.spend - row.standard - row.global) < 1e-6);
    assert.ok(row.balance >= 0);
  }
});
test("distinct materials and plans are not multiplied by days", () => {
  const facts = AD_FACTS.filter((row) => row.platform === "巨量千川");
  assert.equal(adTotals(facts).materials, 48);
  const plans = planTotals(facts);
  assert.equal(plans.plans, 48);
  assert.equal(
    Object.entries(plans)
      .filter(([key]) => key.startsWith("state"))
      .reduce((sum, [, value]) => sum + value, 0),
    48,
  );
  assert.ok(qualityTotals(facts).quality0 <= 48);
});
test("platform statistics count canonical resources and task snapshots", () => {
  const base = {
    sourceId: "r1",
    scope: "finished",
    label: "test",
    person: "徐振",
    department: "内容部",
    group: "剪辑组",
    date: REPORT_TODAY,
    category: "美妆",
    downloads: 3,
    cuts: 1,
    pushed: false,
    used: true,
    viral: true,
    status: "通过",
  };
  const total = creationTotals([
    { ...base, id: "finished:r1" },
    {
      ...base,
      id: "materials:r1",
      scope: "materials",
      viral: false,
      downloads: 0,
    },
  ]);
  assert.equal(total.uploads, 2);
  assert.equal(total.uploaders, 1);
  assert.equal(total.downloads, 3);
  assert.equal(total.viral, 1);
  const tasks = [
    {
      id: "t1",
      publisher: "徐振",
      publishDate: REPORT_START,
      deadlineDate: REPORT_TODAY,
      assignee: "徐振",
      orderCount: 2,
      completedCount: 3,
      status: "completed" as const,
      cost: 0,
      completionSnapshot: [
        { id: "r1", type: "video" as const, name: "旧文件", status: "通过" },
      ],
      associatedWorks: [],
    },
  ];
  assert.equal(taskTotals(tasks).delivered, 3);
  assert.equal(taskTotals(tasks).completed, 1);
  assert.equal(fileStatusTotals(tasks)[0].value, 1);
});
test("CSV preserves Unicode, quotes, and blocks formula injection", () => {
  const csv = csvText(
    ["名称", "数量"],
    [
      ['含逗号,和"引号', 2],
      ["=HYPERLINK(1)", 3],
    ],
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('含逗号,和""引号'));
  assert.ok(csv.includes("'=HYPERLINK"));
});
