import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdPushRecord } from "../src/lib/adPush";
import type { DerivationRecord } from "../src/lib/videoDerivation";
import { DERIVATION_HISTORY_COLUMNS, derivationHistoryExportRows, derivationHistoryFilters, derivationHistoryRows, filterDerivationHistory } from "../src/lib/derivationHistory";

const createdAt = new Date(2026, 8, 28, 12).getTime();
const output = (id: string, overrides: Partial<DerivationRecord> = {}): DerivationRecord => ({
  id, taskId: "shared-task", ownerId: "owner", ownerName: "操作人甲", source: { id: "original-video", title: "原视频.mp4" },
  name: `原视频_衍生${id}.mp4`, url: "/sample.mp4", status: "成功", createdAt, updatedAt: createdAt + 6000, startedAt: createdAt,
  note: "首轮，产品特写", message: "衍生完成", reviewBlocked: null, driver: "standalone", attempt: 0, ...overrides,
});
const push = (id: string, derivativeId: string, assetId = "", operatorId = "owner") => ({ id, taskId: "push-task", derivativeId, assetId, operatorId } as AdPushRecord);
const filters = () => ({ ...derivationHistoryFilters(), start: "2026-09-28", end: "2026-09-28" });

test("history renders each output, not each task; same-name outputs remain separate", () => {
  const rows = derivationHistoryRows([output("1"), output("2", { name: output("1").name }), output("3")], [], "owner", "甲");
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(row => row.output.id), ["1", "2", "3"]);
  assert.equal(new Set(rows.map(row => row.output.taskId)).size, 1);
  assert.ok(rows.every(row => row.assetIds.length === 0 && row.pushes.length === 0));
});

test("links use derivative IDs, not source or task IDs, and remain owner-scoped", () => {
  const records = [output("1"), output("2"), output("other", { ownerId: "other" })];
  const pushes = [push("p1", "1", "asset-a"), push("p2", "1", "asset-b"), push("p3", "1", "asset-a"), push("p4", "2"), push("other", "1", "private", "other"), push("original", "original-video", "source-asset")];
  const rows = derivationHistoryRows(records, pushes, "owner", "甲");
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].assetIds, ["asset-a", "asset-b"]);
  assert.deepEqual(rows[0].pushes.map(record => record.id), ["p1", "p2", "p3"]);
  assert.deepEqual(rows[1].assetIds, []);
  assert.equal(filterDerivationHistory(rows, { ...filters(), assetId: "original-video" }).length, 0);
  assert.equal(filterDerivationHistory(rows, { ...filters(), pushId: "push-task" }).length, 0);
});

test("all screenshot filters apply to individual outputs, with inclusive dates", () => {
  const rows = derivationHistoryRows([output("1"), output("2", { status: "失败", note: "解码异常", createdAt: createdAt - 86400000 })], [push("push-1", "1", "asset-1")], "owner", "甲");
  assert.equal(filterDerivationHistory(rows, filters()).length, 1);
  for (const field of ["videoId", "status", "operator", "pushId", "assetId", "title", "note"] as const) {
    assert.equal(filterDerivationHistory(rows, { ...filters(), [field]: "不存在" }).length, 0, field);
  }
  const all = { ...filters(), videoId: " ORIGINAL-VIDEO ", status: "成功", operator: "owner", pushId: "push-1", assetId: "asset-1", title: "衍生1", note: "特写" };
  assert.equal(filterDerivationHistory(rows, all).length, 1);
  assert.equal(filterDerivationHistory(rows, { ...filters(), start: "2026-09-27", end: "2026-09-27" })[0].output.status, "失败");
});

test("export mirrors visible fields, leaves absent IDs blank, and excludes derivation method", () => {
  const rows = derivationHistoryRows([output("1", { reviewBlocked: false }), output("2", { reviewBlocked: true }), output("3")], [push("push-1", "1", "asset-1")], "owner", "甲");
  const cells = derivationHistoryExportRows(rows);
  assert.equal(cells.length, 4);
  assert.ok(cells.every(row => row.length === cells[0].length));
  assert.equal(DERIVATION_HISTORY_COLUMNS.includes("衍生方式"), false);
  assert.equal(cells[0].includes("操作"), false);
  assert.deepEqual(cells.slice(1).map(row => row[4]), ["否", "是", "--"]);
  assert.equal(cells[1][8], "push-1");
  assert.equal(cells[2][2], "--");
  assert.equal(cells[2][8], "--");
});
