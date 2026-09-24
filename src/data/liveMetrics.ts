import type { LiveSession } from "./liveManagement";

export const LIVE_METRIC_DATE = "2026-09-08";
export const METRIC_RULES = {
  revenue: "实际支付金额，包含自然流量和付费流量成交，不扣除退款",
  orders: "支付成功的订单数，后续退款不减少成交订单数",
  roi: "全部实付成交金额 / 投放消耗",
  noSpend: "无投放消耗，不计算ROI",
  refunds: "退款成功的成交订单数 / 成交订单总数；包含部分退款，同一订单只计一次",
  refundAmount: "退款成功的金额，单独统计，不冲减成交金额",
};

export interface LiveRefund {
  id: string;
  orderId: string;
  amount: number;
  status: "成功" | "处理中" | "失败";
}

interface ProductSnapshot {
  productId: string;
  orders: number;
  sales: number;
  revenue: number;
  exposure: number;
  clicks: number;
  refunds?: LiveRefund[];
}

interface SessionSnapshot {
  currentOnline?: number;
  sampledAt: string;
  products: ProductSnapshot[];
}

// Explicit per-session fixtures, not allocations of catalog totals or room traffic.
function productSnapshot(sessionId: string, productId: string, orders: number, sales: number, revenue: number, exposure: number, clicks: number, refundOrders?: number, refundAmount = 0): ProductSnapshot {
  let refunds: LiveRefund[] | undefined;
  if (refundOrders !== undefined) {
    const cents = Math.round(refundAmount * 100);
    refunds = Array.from({ length: refundOrders }, (_, index) => ({
      id: `${sessionId}-${productId}-refund-${index}`,
      orderId: `${sessionId}-${productId}-order-${index}`,
      amount: (Math.floor(cents / refundOrders) + (index < cents % refundOrders ? 1 : 0)) / 100,
      status: "成功" as const,
    }));
    // Two successful partial refunds for one order must count as one refunded order.
    if (refunds.length) {
      const first = refunds[0];
      const partial = Math.floor(first.amount * 50) / 100;
      refunds[0] = { ...first, amount: partial };
      refunds.push({ ...first, id: `${first.id}-second`, amount: Math.round((first.amount - partial) * 100) / 100 });
    }
  }
  return { productId, orders, sales, revenue, exposure, clicks, refunds };
}

const p = productSnapshot;
export const LIVE_METRIC_SNAPSHOTS: Record<string, SessionSnapshot> = {
  "live-10086": { currentOnline: 5740, sampledAt: "2026-09-08 13:12", products: [p("live-10086", "prod-1", 160, 240, 47760, 145000, 13000, 4, 640), p("live-10086", "prod-2", 135, 210, 22080, 110000, 9640, 3, 280), p("live-10086", "prod-3", 91, 162, 22840, 95000, 6000, 3, 390)] },
  "live-10085": { sampledAt: "2026-09-08 10:26", products: [p("live-10085", "prod-2", 182, 300, 35640, 130000, 12800, 4, 420), p("live-10085", "prod-1", 160, 248, 45980, 120000, 11060, 4, 660)] },
  "live-10084": { sampledAt: "2026-09-08 10:26", products: [p("live-10084", "prod-3", 140, 210, 28680, 125000, 10000, 5, 670), p("live-10084", "prod-1", 74, 116, 20000, 95000, 5420, 2, 300)] },
  "live-10083": { sampledAt: "2026-09-08 10:26", products: [p("live-10083", "prod-1", 96, 148, 26480, 100000, 6800, 3, 450), p("live-10083", "prod-2", 60, 100, 10000, 85000, 4060, 1, 80)] },
  "live-20041": { currentOnline: 4210, sampledAt: "2026-09-08 13:18", products: [p("live-20041", "prod-4", 192, 286, 51240, 160000, 13200, 12, 1800), p("live-20041", "prod-5", 136, 200, 35180, 140000, 9260, 10, 1200)] },
  "live-20040": { sampledAt: "2026-09-08 10:24", products: [p("live-20040", "prod-5", 164, 242, 31860, 150000, 11300, 9, 990), p("live-20040", "prod-4", 122, 180, 40000, 135000, 8380, 7, 1050)] },
  "live-20039": { sampledAt: "2026-09-08 10:24", products: [p("live-20039", "prod-4", 242, 358, 62480, 210000, 16920)] },
  "live-30018": { sampledAt: "2026-09-07 23:58", products: [p("live-30018", "prod-6", 112, 182, 24680, 105000, 7800, 2, 160), p("live-30018", "prod-7", 76, 120, 18000, 85000, 4880, 1, 90)] },
  "live-30017": { sampledAt: "2026-09-07 23:58", products: [p("live-30017", "prod-7", 80, 128, 16640, 85000, 5600), p("live-30017", "prod-6", 56, 86, 12000, 72000, 3880)] },
};

export const LIVE_TIMELINES: Record<string, { minute: number; online: number; revenue: number }[]> = {
  "live-10086": [
    { minute: 0, online: 0, revenue: 0 }, { minute: 30, online: 2860, revenue: 7420 },
    { minute: 60, online: 4320, revenue: 17610 }, { minute: 90, online: 8920, revenue: 33360 },
    { minute: 120, online: 6480, revenue: 50050 }, { minute: 150, online: 5860, revenue: 65800 },
    { minute: 180, online: 4720, revenue: 77850 }, { minute: 210, online: 6120, revenue: 88460 },
    { minute: 222, online: 5740, revenue: 92680 },
  ],
  "live-20041": [
    { minute: 0, online: 0, revenue: 0 }, { minute: 30, online: 3120, revenue: 9680 },
    { minute: 60, online: 4860, revenue: 25400 }, { minute: 90, online: 7210, revenue: 44200 },
    { minute: 120, online: 5680, revenue: 59600 }, { minute: 150, online: 4380, revenue: 73400 },
    { minute: 180, online: 3860, revenue: 82600 }, { minute: 198, online: 4210, revenue: 86420 },
  ],
};

export function productSalesTrend(sessions: LiveSession[], productId: string) {
  const items = sessions.filter((session) => session.productIds.includes(productId) && rangeMatches(session.startedAt, "近30天"));
  if (!items.length || items.some((session) => !sessionProductMetrics(session, productId))) return null;
  const today = Date.parse(`${LIVE_METRIC_DATE}T00:00:00Z`);
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today - (29 - index) * 86_400_000).toISOString().slice(0, 10);
    return { date, revenue: items.filter((session) => session.startedAt.startsWith(date)).reduce((sum, session) => sum + sessionProductMetrics(session, productId)!.revenue, 0) };
  });
}

export function roi(revenue: number | null | undefined, spend: number | null | undefined): number | null {
  return revenue != null && spend != null && Number.isFinite(revenue) && Number.isFinite(spend) && spend > 0 ? revenue / spend : null;
}

export function formatRoi(value: number | null | undefined): string {
  return value != null && Number.isFinite(value) ? value.toFixed(2) : "--";
}

export function summarizeRefunds(refunds: LiveRefund[] | undefined, paidOrders: number) {
  if (!refunds) return { refundOrders: null, refundAmount: null, refundRate: null };
  const successful = [...new Map(refunds.filter((refund) => refund.status === "成功").map((refund) => [refund.id, refund])).values()];
  const refundOrders = new Set(successful.map((refund) => refund.orderId)).size;
  return {
    refundOrders,
    refundAmount: successful.reduce((cents, refund) => cents + Math.round(refund.amount * 100), 0) / 100,
    refundRate: paidOrders > 0 ? refundOrders / paidOrders * 100 : null,
  };
}

export function sessionRefunds(session: LiveSession) {
  const products = LIVE_METRIC_SNAPSHOTS[session.id]?.products;
  return products?.every((product) => product.refunds !== undefined) ? products.flatMap((product) => product.refunds!) : undefined;
}

export function aggregateLiveMetrics(items: LiveSession[]) {
  const revenue = items.reduce((sum, item) => sum + item.revenue, 0);
  const spend = items.reduce((sum, item) => sum + item.spend, 0);
  const orders = items.reduce((sum, item) => sum + item.orders, 0);
  const refunds = items.map(sessionRefunds);
  return {
    sessions: items.length, revenue, spend, orders,
    roi: roi(revenue, spend),
    viewers: items.reduce((sum, item) => sum + item.viewers, 0),
    ...summarizeRefunds(items.length && refunds.every((item) => item !== undefined) ? refunds.flatMap((item) => item!) : undefined, orders),
  };
}

export function sessionProductMetrics(session: LiveSession, productId: string) {
  const product = LIVE_METRIC_SNAPSHOTS[session.id]?.products.find((item) => item.productId === productId);
  return product ? { ...product, ...summarizeRefunds(product.refunds, product.orders) } : null;
}

export function productLiveMetrics(sessions: LiveSession[], productId: string) {
  const related = sessions.filter((session) => session.productIds.includes(productId));
  const rows = related.map((session) => sessionProductMetrics(session, productId));
  if (!rows.length || rows.some((row) => row === null)) return { orders: null, sales: null, gmv: null, productExposure: null, clicks: null, refundOrders: null, refundAmount: null, refundRate: null };
  const known = rows.filter((row) => row !== null);
  const orders = known.reduce((sum, row) => sum + row.orders, 0);
  return {
    orders,
    sales: known.reduce((sum, row) => sum + row.sales, 0),
    gmv: known.reduce((sum, row) => sum + row.revenue, 0),
    productExposure: known.reduce((sum, row) => sum + row.exposure, 0),
    clicks: known.reduce((sum, row) => sum + row.clicks, 0),
    ...summarizeRefunds(known.every((row) => row.refunds !== undefined) ? known.flatMap((row) => row.refunds!) : undefined, orders),
  };
}

export function rangeMatches(startedAt: string, range: string, referenceDate = LIVE_METRIC_DATE) {
  const today = Date.parse(`${referenceDate}T00:00:00Z`);
  const day = 86_400_000;
  let start = today;
  let end = today + day;
  if (range === "昨日") { start -= day; end -= day; }
  else if (["近7天", "7日"].includes(range)) start -= 6 * day;
  else if (["近30天", "30日"].includes(range)) start -= 29 * day;
  else if (range === "本周") start -= (new Date(today).getUTCDay() + 6) % 7 * day;
  else if (range === "本月") start = Date.parse(`${referenceDate.slice(0, 7)}-01T00:00:00Z`);
  else if (range !== "今日") return false;
  const date = Date.parse(`${startedAt.slice(0, 10)}T00:00:00Z`);
  return date >= start && date < end;
}

export function compareLiveMetrics(session: LiveSession, sessions: LiveSession[], mode: string) {
  if (mode === "vs 行业均值") return { metrics: null, note: "暂无行业均值数据" };
  const previous = sessions.filter((item) => item.accountId === session.accountId && item.id !== session.id && item.status === "已结束" && item.startedAt < session.startedAt)
    .filter((item) => Date.parse(item.startedAt.replace(" ", "T") + "+08:00") + item.durationMinutes * 60_000 <= Date.parse(session.startedAt.replace(" ", "T") + "+08:00"))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const count = mode === "vs 近7场均值" ? 7 : 1;
  if (previous.length < count) return { metrics: null, note: count === 1 ? "暂无上一场完整数据" : `历史完整场次不足7场（${previous.length}/7）` };
  const selected = previous.slice(0, count);
  const mean = (getValue: (item: LiveSession) => number) => selected.reduce((sum, item) => sum + getValue(item), 0) / count;
  const rois = selected.map((item) => roi(item.revenue, item.spend));
  return {
    metrics: {
      revenue: mean((item) => item.revenue), orders: mean((item) => item.orders), viewers: mean((item) => item.viewers),
      avgOnline: mean((item) => item.avgOnline), newFollowers: mean((item) => item.newFollowers),
      roi: rois.every((value) => value !== null) ? rois.reduce<number>((sum, value) => sum + value!, 0) / count : null,
    },
    note: count === 1 ? `${selected[0].title} · ${selected[0].startedAt}` : "此前7场已结束直播的指标算术均值",
  };
}
