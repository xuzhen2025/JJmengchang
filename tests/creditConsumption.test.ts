import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_DEPTS, INITIAL_MEMBERS } from "../src/data/adminAccounts";
import {
  CREDIT_RECORD_TYPES, EMPTY_CREDIT_FILTERS, createCreditExamples, creditMemberOrganization,
  filterCreditRecords, netCreditConsumption, summarizeCreditConsumption, type CreditRecord,
} from "../src/lib/creditConsumption";

const records = createCreditExamples(INITIAL_MEMBERS, INITIAL_DEPTS, new Date(2026, 8, 22, 12));

test("demo ledger balances and summary totals agree with net consumption", () => {
  assert.equal(netCreditConsumption(records), 2385);
  assert.equal(records.reduce((sum, row) => sum + row.amount, 0), 2615);
  const summary = summarizeCreditConsumption(INITIAL_MEMBERS, INITIAL_DEPTS, records, EMPTY_CREDIT_FILTERS);
  assert.equal(summary.reduce((sum, row) => sum + row.total, 0), 2385);
  assert.equal(summary[0].total, 370);
  assert.equal(summary[7].total, 170);
  assert.ok(summary.some(row => row.total === 0));
  assert.equal(new Set(records.map(row => row.id)).size, records.length);
  assert.ok(records.every(row => INITIAL_MEMBERS.some(member => member.id === row.userId)));
});

test("recharge is excluded, refunds reduce consumption, decimal amounts are rounded", () => {
  const base = records[0];
  const example: CreditRecord[] = [
    { ...base, id: "1", type: "消耗", amount: -100 },
    { ...base, id: "2", type: "失败退回", amount: 30 },
    { ...base, id: "3", type: "普通充值", amount: 500 },
    { ...base, id: "4", type: "赠送充值", amount: 50 },
  ];
  assert.equal(netCreditConsumption(example), 70);
  assert.equal(netCreditConsumption([{ ...base, type: "消耗", amount: -0.1 }, { ...base, type: "消耗", amount: -0.2 }]), 0.3);
  assert.equal(netCreditConsumption([{ ...base, type: "失败退回", amount: 30 }]), -30);
  assert.deepEqual(CREDIT_RECORD_TYPES, ["普通充值", "消耗", "赠送充值", "失败退回"]);
});

test("date filters include both boundary days and combine with account and type filters", () => {
  const memberId = INITIAL_MEMBERS[0].id;
  const filters = { userId: memberId, startDate: "2026-09-14", endDate: "2026-09-15" };
  const rows = filterCreditRecords(records, filters);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].type, "失败退回");
  assert.equal(netCreditConsumption(rows), 370);
  assert.equal(filterCreditRecords(records, filters, "消耗").length, 1);
  assert.equal(filterCreditRecords(records, { ...filters, startDate: "2026-09-15" }).length, 1);
  assert.equal(filterCreditRecords(records, { ...filters, endDate: "2026-09-14" }).length, 1);
  assert.equal(filterCreditRecords(records, { ...EMPTY_CREDIT_FILTERS, startDate: "2030-01-01" }).length, 0);
  assert.equal(filterCreditRecords(records, EMPTY_CREDIT_FILTERS, "普通充值").length, 0);
});

test("member identity uses IDs even when names match", () => {
  const members = [INITIAL_MEMBERS[0], { ...INITIAL_MEMBERS[1], name: INITIAL_MEMBERS[0].name }];
  const summary = summarizeCreditConsumption(members, INITIAL_DEPTS, records, { ...EMPTY_CREDIT_FILTERS, userId: members[1].id });
  assert.equal(summary.length, 1);
  assert.equal(summary[0].id, members[1].id);
  assert.equal(summary[0].total, 420);
});

test("organization resolves group and parent department without fabricating missing groups", () => {
  const member = INITIAL_MEMBERS.find(row => row.deptId === "dept_1_1")!;
  assert.deepEqual(creditMemberOrganization(member, INITIAL_DEPTS), {
    group: "女装千川放量组", team: "电商投放一部", path: "梦畅AIGC / 电商投放一部 / 女装千川放量组",
  });
  assert.equal(creditMemberOrganization(INITIAL_MEMBERS[0], INITIAL_DEPTS).group, "-");
  assert.deepEqual(createCreditExamples([], INITIAL_DEPTS), []);
});
