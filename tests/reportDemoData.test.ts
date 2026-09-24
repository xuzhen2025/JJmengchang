import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../src/data/adminAccounts";
import { createAdStore, readAdStore, AD_STORE_KEY } from "../src/lib/adPush";
import { createReportFacts, financialReportRows, reportRows, reportTotals, selectReportFacts, statusTotals, REPORT_START, REPORT_TODAY } from "../src/lib/reportDemoData";
import { INITIAL_PUBLIC_TAG_GROUPS } from "../src/lib/resourceTags";
import { leaderMembers, resourceActivities, creationMetrics } from "../src/lib/reportPlatformData";
import { insightProfile } from "../src/lib/reportInsights";
import type { PlatformResource } from "../src/lib/platformAnalytics";

const org = { depts: INITIAL_DEPTS, members: INITIAL_MEMBERS };
const accountStore = createAdStore();
const accounts = accountStore.accounts.map((row, index) => ({ ...row, user: ["徐振", "王剪辑", "周雅"][index % 3] }));
const facts = createReportFacts(accounts, org, INITIAL_PUBLIC_TAG_GROUPS, [{ name: "美妆护肤", children: [{ name: "护肤精华" }] }]);
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.000001, `${a} != ${b}`);

test("reports use actual admin account identities and organization membership", () => {
  assert.ok(facts.length > 100);
  for (const row of facts) {
    assert.ok(accounts.some(account => account.id === row.accountId && account.platform === row.platform && account.name === row.account));
    assert.ok(org.members.some(member => member.id === row.memberId && member.name === row.person));
    assert.ok(org.depts.some(dept => dept.name === row.department));
  }
  assert.equal(selectReportFacts(facts, "腾讯ADQ").length, 0);
  assert.equal(selectReportFacts(facts, "巨量千川", { query: "not-present" }).length, 0);
  assert.equal(selectReportFacts(facts, "巨量千川", { start: REPORT_TODAY, end: REPORT_START }).length, 0);
});

test("dimension sums, weighted ratios, quality counts and financial balances reconcile", () => {
  for (const platform of ["巨量广告", "巨量千川"]) {
    const selected = selectReportFacts(facts, platform), total = reportTotals(selected);
    for (const dimension of ["team", "group", "personal", "account", "daily", "monthly", "detail", "category"]) {
      const rows = reportRows(selected, dimension);
      near(rows.reduce((sum, row) => sum + row.spend, 0), total.spend);
      assert.equal(rows.reduce((sum, row) => sum + row.conv, 0), total.conv);
    }
    near(total.roi, total.gmv / total.spend);
    near(total.gmv, total.paid + total.coupon);
    near(total.cvr, total.conv / total.clicks * 100);
    const plans = statusTotals(selected);
    assert.equal(plans.total, accounts.filter(account => account.platform === platform).length * 8);
    assert.equal(plans.total, plans.delivering + plans.pending + plans.terminated + plans.finished + plans.deleted);
    for (const row of financialReportRows(facts, platform, REPORT_TODAY)) {
      near(row.totalSpend, row.nonGrantSpend + row.grantSpend + row.rebateSpend + row.sharedWalletSpend);
      near(row.totalSpend, row.standardSpend + row.globalSpend);
      near(row.totalBalance, row.totalDeposit - row.spend);
      near(row.totalBalance, row.grantBalance + row.nonGrantBalance);
    }
  }
  assert.ok(Object.values(reportTotals([])).every(value => value === 0));
});

test("approved legacy account binding migration preserves identities, groups and access configuration", () => {
  const values = new Map<string, string>();
  const local = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) };
  const before = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", { value: local, configurable: true });
  try {
    values.set(AD_STORE_KEY, JSON.stringify(accountStore));
    const migrated = readAdStore();
    assert.deepEqual(migrated.groups, accountStore.groups);
    assert.equal(migrated.visibility, accountStore.visibility);
    const identity = ({ user, group, ...rest }: any) => rest;
    assert.deepEqual(migrated.accounts.map(identity), accountStore.accounts.map(identity));
    assert.deepEqual(readAdStore(), migrated);
    for (const row of migrated.accounts.filter(row => row.user)) assert.ok(org.members.some(member => member.name === row.user));
  } finally { Object.defineProperty(globalThis, "localStorage", { value: before, configurable: true }); }
});

test("audio-only metrics, unique actor counts, and leader exclusion use shared records", () => {
  const base: PlatformResource = { id: "audio:r1", sourceId: "r1", scope: "audio", label: "口播.wav", person: "徐振", department: "AIGC爆款内容拆解部", group: "千川剧本拆解小组", date: REPORT_START, category: "口播", downloads: 8, cuts: 0, pushed: false, used: true, viral: false, status: "通过" };
  const resources = [base, { ...base, id: "finished:r2", scope: "finished", downloads: 5, cuts: 2 }];
  const events = resourceActivities(resources, org);
  assert.equal(events.filter(row => row.action === "download").length, 13);
  assert.ok(events.every(row => row.date >= REPORT_START && row.date <= REPORT_TODAY && row.person !== "徐振"));
  const metrics = creationMetrics(resources, events);
  assert.equal(metrics.downloadCount, 13);
  assert.equal(metrics.downloadedPersonCount, new Set(events.filter(row => row.action === "download").map(row => row.person)).size);
  const profile = insightProfile("徐振", ["徐振"], resources, events, [], []);
  assert.equal(profile.dataAnalysis["上传作品（音频）"], 1);
  assert.equal(profile.dataAnalysis["上传作品（成片）"], 1);
  assert.equal(profile.dataAnalysis["上传作品（素材）"], 0);
  assert.equal(insightProfile("王剪辑", ["王剪辑"], resources, events, [], []).dataAnalysis["上传作品（音频）"], 0);
  assert.ok(leaderMembers(org, "孙剧本").includes("徐振"));
  assert.ok(!leaderMembers(org, "孙剧本").includes("孙剧本"));
  assert.ok(!leaderMembers(org, "孙剧本").includes("王剪辑"));
});
