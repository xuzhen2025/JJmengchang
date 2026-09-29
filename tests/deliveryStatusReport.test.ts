import assert from "node:assert/strict";
import test from "node:test";
import { buildDeliveryReport, deliveryCategoryOptions, deliveryChartData, deliveryEntityOptions, type DeliveryFilters } from "../src/lib/deliveryStatusReport";
import { filterReportOptions, reportSelectLeaves, reportSelectPath, reportSelectState, toggleReportSelection } from "../src/lib/reportMultiSelect";
import { createAdStore } from "../src/lib/adPush";
import { createReportFacts, type ReportFact } from "../src/lib/reportDemoData";
import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../src/data/adminAccounts";

const tree = [
  { teamName: "Dept A", groups: [{ groupName: "Group", accounts: ["Ann", "Bob"] }, { groupName: "Other", accounts: ["Cal"] }] },
  { teamName: "Dept B", groups: [{ groupName: "Group", accounts: ["Dana"] }, { groupName: "Unassigned", accounts: ["Eve"] }] },
  { teamName: "Empty", groups: [] },
];
const categories = [{ name: "Primary A", children: [{ name: "Same" }, { name: "Other" }] }, { name: "Primary B", children: [{ name: "Same" }] }, { name: "Empty", children: [] }];
const base = createReportFacts(createAdStore().accounts.slice(0, 1), { depts: INITIAL_DEPTS, members: INITIAL_MEMBERS }, [], categories)[0];
const fact = (overrides: Partial<ReportFact>): ReportFact => ({ ...base, platform: "巨量千川", department: "Dept A", group: "Group", person: "Ann", accountId: "acct1", account: "Account", planId: "p1", planStatus: "投放中", planCreatedAt: "2026-09-01", date: "2026-09-01", category: "Primary A", subcategory: "Same", ...overrides });
const facts = [fact({}), fact({ date: "2026-09-02" }), fact({ planId: "p2", planStatus: "未投放", planCreatedAt: "2026-09-03" }),
  fact({ accountId: "acct2", planId: "p3", department: "Dept B", person: "Dana", category: "Primary B", planStatus: "已完成", planCreatedAt: "2026-08-01" }),
  fact({ platform: "巨量广告", planId: "p4" }),
];
const filters = (overrides: Partial<DeliveryFilters> = {}): DeliveryFilters => ({ platform: "巨量千川", dimension: "team", selectedEntities: ["Dept A", "Dept B"], advertiserAccountId: "", categories: [], startDate: "2026-09-01", endDate: "2026-09-03", ...overrides });

test("organization cascades preserve department/group/person paths and empty branches", () => {
  const departments = deliveryEntityOptions(tree, "team");
  assert.deepEqual(reportSelectLeaves(departments).map(row => row.value), ["Dept A", "Dept B", "Empty"]);
  const groups = deliveryEntityOptions(tree, "group");
  assert.equal(reportSelectLeaves(groups).length, 4);
  assert.equal(reportSelectState(groups[2], []).disabled, true);
  const people = deliveryEntityOptions(tree, "personal");
  assert.deepEqual(reportSelectPath(people, "Dept B / Group / Dana"), ["Dept B", "Dept B / Group", "Dept B / Group / Dana"]);
  assert.ok(reportSelectLeaves(people).some(row => row.value === "Dept B / Unassigned / Eve"));
});

test("parent selection toggles all leaves, preserves other branches and reports mixed states", () => {
  const options = deliveryEntityOptions(tree, "personal");
  const selected = toggleReportSelection(options[0], ["Dept B / Group / Dana"]);
  assert.equal(selected.length, 4);
  assert.equal(reportSelectState(options[0], selected).checked, true);
  const partial = toggleReportSelection(options[0].children![0].children![0], selected);
  assert.equal(reportSelectState(options[0], partial).mixed, true);
  assert.equal(reportSelectState(options[0].children![0], partial).mixed, true);
  assert.deepEqual(toggleReportSelection(options[0], selected), ["Dept B / Group / Dana"]);
  assert.deepEqual(toggleReportSelection(options[2], partial), partial);
  assert.equal(new Set(toggleReportSelection(options[0], partial)).size, 4);
});

test("search retains cascade ancestors and full-name category paths distinguish duplicate leaves", () => {
  const people = deliveryEntityOptions(tree, "personal");
  assert.deepEqual(reportSelectLeaves(filterReportOptions(people, "ann")).map(row => row.value), ["Dept A / Group / Ann"]);
  assert.equal(reportSelectLeaves(filterReportOptions(people, "Dept A")).length, 3);
  assert.deepEqual(filterReportOptions(people, "missing"), []);
  const options = deliveryCategoryOptions(categories);
  assert.deepEqual(toggleReportSelection(options[0], []), ["Primary A / Same", "Primary A / Other"]);
  assert.equal(reportSelectLeaves(filterReportOptions(options, "Same")).length, 2);
  assert.equal(reportSelectState(options[2], []).disabled, true);
});

test("no applied query or no selection leaves both report and chart empty", () => {
  const options = deliveryEntityOptions(tree, "team");
  for (const query of [null, filters({ selectedEntities: [] }), filters({ startDate: "2026-09-04" }), filters({ endDate: "invalid" })]) {
    const result = buildDeliveryReport(facts, query, options);
    assert.equal(result.rows.length, 0);
    assert.equal(result.dates.length, 0);
  }
  assert.equal(buildDeliveryReport(facts, filters({ dimension: "advertiser_detail" }), []).rows.length, 0);
});

test("selected identities remain in zero periods and daily series reconcile with plan totals", () => {
  const result = buildDeliveryReport(facts, filters({ selectedEntities: ["Dept A", "Dept B", "Empty"] }), deliveryEntityOptions(tree, "team"));
  assert.equal(result.rows.length, 3);
  assert.equal(result.rows[0].total, 2);
  assert.equal(result.rows[1].total, 0);
  assert.equal(result.rows[2].total, 0);
  assert.deepEqual(result.dates, ["2026-09-01", "2026-09-02", "2026-09-03"]);
  const chart = deliveryChartData(result.rows, result.dates, "total");
  assert.deepEqual(chart, [
    { date: "2026-09-01", series0: 1, series1: 0, series2: 0 },
    { date: "2026-09-02", series0: 0, series1: 0, series2: 0 },
    { date: "2026-09-03", series0: 1, series1: 0, series2: 0 },
  ]);
  for (const metric of ["total", "delivering", "pending", "terminated", "finished", "deleted"] as const) {
    const series = deliveryChartData(result.rows, result.dates, metric);
    result.rows.forEach((row, index) => assert.equal(series.reduce((sum, day) => sum + Number(day[`series${index}`]), 0), row[metric]));
    assert.equal(result.rows.reduce((sum, row) => sum + row[metric], 0), result.totals[metric]);
  }
});

test("groups and people with shared labels do not leak across department paths", () => {
  for (const [dimension, selection] of [["group", "Dept A / Group"], ["personal", "Dept A / Group / Ann"]] as const) {
    const result = buildDeliveryReport(facts, filters({ dimension, selectedEntities: [selection] }), deliveryEntityOptions(tree, dimension));
    assert.equal(result.rows.length, 1);
    assert.equal(result.totals.total, 2);
    assert.ok(result.rows[0].facts.every(row => row.department === "Dept A"));
  }
});

test("advertiser categories are ORed by full secondary path and account ID is an additional constraint", () => {
  const query = filters({ dimension: "advertiser_detail", categories: ["Primary A / Same", "Primary B / Same"] });
  const result = buildDeliveryReport(facts, query, []);
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows.map(row => row.accountId), ["acct1", "acct2"]);
  assert.equal(new Set(result.rows.map(row => row.legendName)).size, 2);
  assert.equal(result.rows[1].total, 0);
  assert.equal(buildDeliveryReport(facts, { ...query, categories: ["Primary A / Same"] }, []).rows.length, 1);
  assert.equal(buildDeliveryReport(facts, { ...query, advertiserAccountId: "acct2" }, []).rows[0].accountId, "acct2");
  assert.equal(buildDeliveryReport(facts, { ...query, advertiserAccountId: "missing" }, []).rows.length, 0);
  assert.equal(buildDeliveryReport(facts, { ...query, categories: [], advertiserAccountId: "acct1" }, []).rows.length, 1);
});

test("zero-date advertiser data has a full timeline without borrowing another platform's plans", () => {
  const result = buildDeliveryReport(facts, filters({ dimension: "advertiser_detail", advertiserAccountId: "acct1", startDate: "2026-09-10", endDate: "2026-09-12" }), []);
  assert.equal(result.rows.length, 1);
  assert.equal(result.totals.total, 0);
  assert.equal(deliveryChartData(result.rows, result.dates, "pending").length, 3);
  const other = buildDeliveryReport(facts, filters({ platform: "巨量广告", dimension: "advertiser_detail", advertiserAccountId: "acct1" }), []);
  assert.equal(other.totals.total, 1);
});
