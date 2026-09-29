import assert from "node:assert/strict";
import test from "node:test";
import {
  AD_FACTS,
  REPORT_PLATFORMS,
  adKey,
  adTotals,
  csvText,
  defaultAdFilter,
  filterAdFacts,
  grouped,
  planTotals,
  qualityTotals,
  dateError,
} from "../src/lib/analyticsData";

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
