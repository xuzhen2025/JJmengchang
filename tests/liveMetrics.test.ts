import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_SESSIONS } from "../src/data/liveManagement.ts";
import {
  aggregateLiveMetrics, compareLiveMetrics, formatRoi, LIVE_METRIC_SNAPSHOTS, LIVE_TIMELINES,
  productLiveMetrics, productSalesTrend, rangeMatches, roi, sessionRefunds, summarizeRefunds,
  type LiveRefund,
} from "../src/data/liveMetrics.ts";

const current = INITIAL_SESSIONS[0];

test("GMV and paid orders do not decrease after refunds", () => {
  const metrics = aggregateLiveMetrics([current]);
  assert.equal(metrics.revenue, 92680);
  assert.equal(metrics.orders, 386);
  assert.equal(metrics.refundOrders, 10);
  assert.equal(metrics.refundAmount, 1310);
  assert.equal(metrics.refundRate, 10 / 386 * 100);
  assert.equal(metrics.roi, 92680 / 19220);
});

test("successful partial refunds deduplicate orders and refund events independently", () => {
  const first: LiveRefund = { id: "r1", orderId: "o1", amount: 10.11, status: "成功" };
  const result = summarizeRefunds([
    first, first,
    { id: "r2", orderId: "o1", amount: 20.22, status: "成功" },
    { id: "r3", orderId: "o2", amount: 15, status: "成功" },
    { id: "r4", orderId: "o3", amount: 40, status: "处理中" },
    { id: "r5", orderId: "o4", amount: 50, status: "失败" },
  ], 10);
  assert.deepEqual(result, { refundOrders: 2, refundAmount: 45.33, refundRate: 20 });
});

test("unknown refunds and zero paid orders are not a zero refund rate", () => {
  assert.deepEqual(summarizeRefunds(undefined, 10), { refundOrders: null, refundAmount: null, refundRate: null });
  assert.deepEqual(summarizeRefunds([], 0), { refundOrders: 0, refundAmount: 0, refundRate: null });
  assert.equal(summarizeRefunds([], 10).refundRate, 0);
  const incomplete = INITIAL_SESSIONS.find((session) => session.id === "live-30017")!;
  assert.equal(sessionRefunds(incomplete), undefined);
  assert.equal(aggregateLiveMetrics([current, incomplete]).refundAmount, null);
});

test("ROI is total GMV / spend, never the arithmetic mean of session ROIs", () => {
  const a = { ...current, revenue: 100, spend: 10, roi: 999 };
  const b = { ...current, revenue: 100, spend: 100, roi: 999 };
  assert.equal(aggregateLiveMetrics([a, b]).roi, 200 / 110);
  assert.equal(roi(100, 0), null);
  assert.equal(roi(0, 10), 0);
  assert.equal(roi(100, undefined), null);
  assert.equal(roi(100, Number.NaN), null);
  assert.equal(formatRoi(null), "--");
  assert.equal(formatRoi(0), "0.00");
  assert.equal(aggregateLiveMetrics([INITIAL_SESSIONS.find((session) => session.id === "live-10083")!]).roi, null);
});

test("each session's product amounts and unit counts reconcile with that session", () => {
  for (const session of INITIAL_SESSIONS) {
    const rows = LIVE_METRIC_SNAPSHOTS[session.id].products;
    assert.deepEqual(rows.map((row) => row.productId).sort(), [...session.productIds].sort());
    assert.equal(rows.reduce((sum, row) => sum + row.revenue, 0), session.revenue, session.id);
    assert.equal(rows.reduce((sum, row) => sum + row.sales, 0), session.sales, session.id);
    assert.equal(rows.reduce((sum, row) => sum + row.orders, 0), session.orders, session.id);
    assert.equal(rows.reduce((sum, row) => sum + row.clicks, 0), session.productClicks, session.id);
  }
});

test("product aggregates and the 30-day trend use the same per-session rows", () => {
  const product = productLiveMetrics(INITIAL_SESSIONS, "prod-1");
  assert.equal(product.gmv, 47760 + 45980 + 20000 + 26480);
  assert.equal(product.sales, 240 + 248 + 116 + 148);
  assert.equal(product.refundOrders, 13);
  const trend = productSalesTrend(INITIAL_SESSIONS, "prod-1")!;
  assert.equal(trend.length, 30);
  assert.equal(trend[0].date, "2026-08-10");
  assert.equal(trend.at(-1)!.date, "2026-09-08");
  assert.equal(trend.reduce((sum, day) => sum + day.revenue, 0), product.gmv);
  assert.equal(productLiveMetrics(INITIAL_SESSIONS, "prod-8").gmv, null);
  assert.equal(productLiveMetrics(INITIAL_SESSIONS, "prod-6").refundRate, null);
});

test("current online is a snapshot, distinct from average online", () => {
  assert.equal(LIVE_METRIC_SNAPSHOTS[current.id].currentOnline, 5740);
  assert.notEqual(LIVE_METRIC_SNAPSHOTS[current.id].currentOnline, current.avgOnline);
  for (const [id, points] of Object.entries(LIVE_TIMELINES)) {
    const session = INITIAL_SESSIONS.find((item) => item.id === id)!;
    assert.equal(points.at(-1)!.online, LIVE_METRIC_SNAPSHOTS[id].currentOnline);
    assert.equal(points.at(-1)!.revenue, session.revenue);
    assert.equal(points.at(-1)!.minute, session.durationMinutes);
    assert.equal(Math.max(...points.map((point) => point.online)), session.peakOnline);
  }
});

test("calendar week, rolling seven days, rolling thirty days, and future dates differ", () => {
  assert.equal(rangeMatches("2026-09-06 12:00", "本周"), false);
  assert.equal(rangeMatches("2026-09-06 12:00", "7日"), true);
  assert.equal(rangeMatches("2026-09-07 12:00", "本周"), true);
  assert.equal(rangeMatches("2026-08-10 12:00", "30日"), true);
  assert.equal(rangeMatches("2026-08-09 12:00", "30日"), false);
  assert.equal(rangeMatches("2026-09-09 12:00", "本月"), false);
  assert.equal(rangeMatches("2026-09-07 12:00", "昨日"), true);
});

test("previous session compares the latest completed session before the current start", () => {
  const result = compareLiveMetrics(current, [...INITIAL_SESSIONS].reverse(), "vs 上一场");
  assert.equal(result.metrics!.revenue, 81620);
  const historical = INITIAL_SESSIONS.find((session) => session.id === "live-10084")!;
  assert.equal(compareLiveMetrics(historical, INITIAL_SESSIONS, "vs 上一场").metrics!.revenue, 36480);
  assert.equal(compareLiveMetrics(historical, INITIAL_SESSIONS, "vs 上一场").metrics!.roi, null);
});

test("seven-session averages need seven eligible sessions, industry data never falls back", () => {
  assert.equal(compareLiveMetrics(current, INITIAL_SESSIONS, "vs 近7场均值").metrics, null);
  assert.equal(compareLiveMetrics(current, INITIAL_SESSIONS, "vs 行业均值").metrics, null);
  const previous = Array.from({ length: 7 }, (_, index) => ({ ...current, id: `history-${index}`, status: "已结束" as const, startedAt: `2026-08-${20 + index} 10:00`, revenue: (index + 1) * 100, spend: 10 }));
  const result = compareLiveMetrics(current, previous, "vs 近7场均值");
  assert.equal(result.metrics!.revenue, 400);
  assert.equal(result.metrics!.roi, 40);
  const syncing = previous.map((item, index) => index === 0 ? { ...item, status: "数据同步中" as const } : item);
  assert.equal(compareLiveMetrics(current, syncing, "vs 近7场均值").metrics, null);
});
