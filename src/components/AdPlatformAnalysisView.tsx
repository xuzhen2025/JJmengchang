import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDerivationRecords } from "../lib/videoDerivation";
import { getAdActor } from "../lib/adPush";
import { useAdStore } from "../lib/useAdStore";
import { canUseDerivations } from "../lib/derivationPermissions";
import { useReportOrganization } from "../lib/analyticsOrganization";
import { derivativeAnalyticsRows } from "../lib/derivationAnalytics";
import { AdDialog } from "./AdPushDialogs";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import CategoryCascader from "./CategoryCascader";
import ColumnSettingsControl from "./ColumnSettingsControl";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import {
  Search, Calendar, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Eye, ExternalLink, TrendingUp, Megaphone
} from "lucide-react";

interface AdPlatformAnalysisViewProps {
  showToast?: (title: string, desc: string) => void;
  initialDerivativeId?: string;
}

// ============ 平台与推广类型 ============
const PLATFORMS = [
  { id: "qianchuan", name: "巨量千川", color: "#2563eb" },
  { id: "juliang", name: "巨量广告", color: "#7c3aed" },
];

const PROMO_TABS = ["汇总", "标准推广", "商品全域推广"];

const DIMENSION_TABS = ["团队", "分组", "个人", "明细", "分日", "分月"] as const;
type DimensionTab = (typeof DIMENSION_TABS)[number];

// ============ 确定性伪随机 ============
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============ 原始明细行（虚拟电商数据，页面内自洽） ============
interface RawRow {
  videoId?: string;
  team: string;
  group: string;
  author: string;
  cat1: string;
  cat2: string;
  video: string;
  uploadDate: string; // YYYY-MM-DD
  date: string; // 消耗日期
  month: string;
  cost: number; // 消耗
  orders: number; // 转化数
  gmv: number; // 成交金额
  coupon: number; // 智能优惠券
  platformSubsidy: number; // 电商平台补贴金额
  impressions: number; // 展示数
  clicks: number; // 点击数
  plays: number; // 播放量
  effectivePlays: number; // 有效播放数
  plays3s: number; // 3s播放数
}

const TEAMS = ["美妆爆品队", "服饰种草队", "个护家清队", "食品饮料队", "母婴宠物资队"];
const GROUPS: Record<string, string[]> = {
  美妆爆品队: ["护肤焕新组", "彩妆潮流组", "香氛精品组"],
  服饰种草队: ["内衣塑形组", "女装穿搭组", "运动休闲组"],
  个护家清队: ["洗护家清组", "口腔护理组", "纸品湿巾组"],
  食品饮料队: ["滋补养生组", "零食解馋组", "茶饮冲调组"],
  母婴宠物资队: ["婴童用品组", "宠物食品组", "孕妈营养组"],
};
const AUTHORS = ["小甜甜", "阿泽", "小鹿", "楠楠", "大飞", "雯雯", "老周", "桃桃", "Leo", "Momo", "Ada", "Kiki"];
const CAT1: Record<string, [string, string[]]> = {
  美妆爆品队: ["美妆护肤", ["面部精华", "面膜贴片", "口红唇釉", "防晒霜"]],
  服饰种草队: ["服饰内衣", ["女士内衣", "塑身衣", "家居服", "保暖内衣"]],
  个护家清队: ["个护家清", ["洗发水", "洗衣液", "牙膏", "纸巾"]],
  食品饮料队: ["食品饮料", ["黑芝麻丸", "养生茶", "坚果礼盒", "低脂零食"]],
  母婴宠物资队: ["母婴宠物", ["婴儿纸尿裤", "猫粮", "孕妇钙片", "儿童零食"]],
};

const VIDEO_TOPICS = [
  "熬夜党急救精华", "换季敏感肌救星", "黄皮显白口红", "高倍防晒不搓泥",
  "聚拢无痕内衣", "收腹提臀裤", "显瘦家居服", "秋冬加绒打底",
  "控油蓬松洗发水", "抑菌洗衣液", "美白牙膏", "柔纸巾",
  "黑芝麻丸零食", "红豆薏米茶", "每日坚果", "无蔗糖糕点",
  "超薄纸尿裤", "全价猫粮", "孕妇钙片", "宝宝溶豆",
];

function buildRawData(): RawRow[] {
  const rand = mulberry32(20260918);
  const rows: RawRow[] = [];
  let vid = 1;
  TEAMS.forEach((team) => {
    const groups = GROUPS[team];
    groups.forEach((group) => {
      const authorList = AUTHORS.slice(0, 3 + Math.floor(rand() * 3));
      authorList.forEach((author) => {
        const cat1 = CAT1[team][0];
        const cat2Pool = CAT1[team][1];
        const videoCount = 5 + Math.floor(rand() * 4);
        for (let v = 0; v < videoCount; v++) {
          const cat2 = cat2Pool[Math.floor(rand() * cat2Pool.length)];
          const topic = VIDEO_TOPICS[(vid + v) % VIDEO_TOPICS.length];
          const videoName = `${topic}_${String(vid).padStart(3, "0")}`;
          // 每条视频在 2026-09-03 ~ 2026-09-18 期间有消耗记录
          const days = 8 + Math.floor(rand() * 9);
          for (let d = 0; d < days; d++) {
            const dayOffset = Math.floor(rand() * 16);
            const date = new Date(2026, 8, 3 + dayOffset);
            const dateStr = date.toISOString().slice(0, 10);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const uploadOffset = Math.floor(rand() * 16);
            const uploadDate = new Date(2026, 8, 3 + uploadOffset);
            // 电商量级：消耗 200~6000/天
            const cost = Math.round(200 + rand() * 5800);
            const impressions = Math.round(cost * (180 + rand() * 320)); // 千次展现 ~
            const ctr = 0.018 + rand() * 0.06; // 点击率 1.8%~7.8%
            const clicks = Math.round(impressions * ctr);
            const cvr = 0.03 + rand() * 0.12; // 转化率
            const orders = Math.max(1, Math.round(clicks * cvr));
            const aov = 45 + rand() * 260; // 客单价
            const gmv = Math.round(orders * aov);
            const coupon = Math.round(gmv * (0.02 + rand() * 0.08));
            const platformSubsidy = Math.round(gmv * (0.01 + rand() * 0.05));
            const plays = Math.round(impressions * (0.35 + rand() * 0.5));
            const plays3s = Math.round(plays * (0.45 + rand() * 0.4));
            const effectivePlays = Math.round(plays * (0.12 + rand() * 0.25));
            rows.push({
              team, group, author: `${author}（${group.slice(0, 2)}）`,
              cat1, cat2, video: videoName,
              uploadDate: uploadDate.toISOString().slice(0, 10),
              date: dateStr, month,
              cost, orders, gmv, coupon, platformSubsidy,
              impressions, clicks, plays, effectivePlays, plays3s,
            });
          }
          vid++;
        }
      });
    });
  });
  return rows;
}

const RAW = buildRawData();

// ============ 聚合 ============
interface MetricRow {
  videoId?: string;
  key: string;
  team: string;
  group: string;
  author: string;
  cat1: string;
  cat2: string;
  video: string;
  uploadDate: string;
  date: string;
  month: string;
  cost: number;
  orders: number;
  gmv: number;
  coupon: number;
  platformSubsidy: number;
  impressions: number;
  clicks: number;
  plays: number;
  effectivePlays: number;
  plays3s: number;
}

function sumRows(rows: RawRow[]): MetricRow {
  const acc: MetricRow = {
    key: "", team: "", group: "", author: "", cat1: "", cat2: "", video: "",
    uploadDate: "", date: "", month: "",
    cost: 0, orders: 0, gmv: 0, coupon: 0, platformSubsidy: 0,
    impressions: 0, clicks: 0, plays: 0, effectivePlays: 0, plays3s: 0,
  };
  rows.forEach((r) => {
    acc.cost += r.cost; acc.orders += r.orders; acc.gmv += r.gmv;
    acc.coupon += r.coupon; acc.platformSubsidy += r.platformSubsidy;
    acc.impressions += r.impressions; acc.clicks += r.clicks;
    acc.plays += r.plays; acc.effectivePlays += r.effectivePlays; acc.plays3s += r.plays3s;
  });
  return acc;
}

function aggregate(rows: RawRow[], dim: DimensionTab): MetricRow[] {
  const map = new Map<string, RawRow[]>();
  rows.forEach((r) => {
    let key = "";
    if (dim === "团队") key = r.team;
    else if (dim === "分组") key = `${r.team}||${r.group}`;
    else if (dim === "个人") key = `${r.team}||${r.group}||${r.author}`;
    else if (dim === "明细") key = r.videoId || r.video;
    else if (dim === "分日") key = r.date;
    else key = r.month;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  const out: MetricRow[] = [];
  map.forEach((list, key) => {
    const s = sumRows(list);
    s.key = key;
    const first = list[0];
    s.team = dim === "团队" ? key : first.team;
    s.group = dim === "团队" ? "—" : dim === "分组" ? key.split("||")[1] : dim === "明细" ? first.group : dim === "个人" ? first.group : "—";
    s.author = dim === "个人" ? key.split("||")[2] : dim === "明细" ? first.author : "—";
    s.cat1 = dim === "明细" ? first.cat1 : "—";
    s.cat2 = dim === "明细" ? first.cat2 : "—";
    s.video = dim === "明细" ? first.video : "—";
    s.videoId = dim === "明细" ? first.videoId : undefined;
    s.uploadDate = dim === "明细" ? first.uploadDate : "—";
    s.date = dim === "分日" ? key : "—";
    s.month = dim === "分月" ? key : "—";
    out.push(s);
  });
  // 按消耗降序
  out.sort((a, b) => b.cost - a.cost);
  return out;
}

// ============ 格式化 ============
const nf = (n: number) => n.toLocaleString("zh-CN");
const yuan = (n: number) => "¥" + n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + "%";

// 指标列定义
interface ColDef {
  key: string;
  label: string;
  align?: "right" | "center";
  value: (r: MetricRow) => number;
  render: (r: MetricRow) => string;
}
const metricColumn = (
  key: string,
  label: string,
  value: (row: MetricRow) => number,
  format: (value: number) => string = nf,
): ColDef => ({ key, label, align: "right", value, render: row => format(value(row)) });

function standardMetricCols(): ColDef[] {
  return [
    metricColumn("cost", "消耗", r => r.cost, yuan),
    metricColumn("roi", "roi", r => r.cost > 0 ? r.gmv / r.cost : 0, value => value.toFixed(2)),
    metricColumn("totalGmv", "总成交金额", r => r.gmv + r.coupon + r.platformSubsidy, yuan),
    metricColumn("gmv", "成交金额", r => r.gmv, yuan),
    metricColumn("coupon", "智能优惠券", r => r.coupon, yuan),
    metricColumn("subsidy", "电商平台补贴金额", r => r.platformSubsidy, yuan),
    metricColumn("orders", "转化数", r => r.orders),
    metricColumn("cvr", "转化率", r => r.clicks > 0 ? r.orders / r.clicks : 0, pct),
    metricColumn("cpa", "转化成本", r => r.orders > 0 ? r.cost / r.orders : 0, yuan),
    metricColumn("impressions", "展示数", r => r.impressions),
    metricColumn("cpm", "平均千次展现费用", r => r.impressions > 0 ? (r.cost / r.impressions) * 1000 : 0, yuan),
    metricColumn("clicks", "点击数", r => r.clicks),
    metricColumn("ctr", "点击率", r => r.impressions > 0 ? r.clicks / r.impressions : 0, pct),
    metricColumn("cpc", "平均点击单价", r => r.clicks > 0 ? r.cost / r.clicks : 0, yuan),
    metricColumn("plays", "播放量", r => r.plays),
    metricColumn("finishRate", "完播率", r => r.plays > 0 ? r.effectivePlays / r.plays : 0, pct),
    metricColumn("effPlays", "有效播放数", r => r.effectivePlays),
    metricColumn("plays3s", "3s播放数", r => r.plays3s),
    metricColumn("rate3s", "3s播放率", r => r.plays > 0 ? r.plays3s / r.plays : 0, pct),
  ];
}

const productNetOrders = (row: MetricRow) => Math.round(row.orders * 0.92);
const productEstimatedOrders = (row: MetricRow) => Math.round(row.orders * 1.08);
const productNetGmv = (row: MetricRow) => Math.round(row.gmv * 0.91);
const productBoostOrders = (row: MetricRow) => Math.round(row.orders * 0.28);

function productDomainMetricCols(): ColDef[] {
  return [
    metricColumn("productOverallSpend", "整体消耗", r => r.cost, yuan),
    metricColumn("productOverallRoi", "整体ROI", r => r.cost > 0 ? (r.gmv + r.coupon + r.platformSubsidy) / r.cost : 0, value => value.toFixed(2)),
    metricColumn("productOverallTotalGmv", "整体总成交金额", r => r.gmv + r.coupon + r.platformSubsidy, yuan),
    metricColumn("productUserPaid", "用户实际支付金额", r => r.gmv, yuan),
    metricColumn("productCoupon", "整体成交智能优惠券", r => r.coupon, yuan),
    metricColumn("productOverallOrders", "整体成交订单数", r => r.orders),
    metricColumn("productOverallOrderCost", "整体成交订单成本", r => r.orders > 0 ? r.cost / r.orders : 0, yuan),
    metricColumn("productSubsidy", "电商平台补贴金额", r => r.platformSubsidy, yuan),
    metricColumn("productOverallGmv", "整体成交金额", r => r.gmv, yuan),
    metricColumn("productComprehensiveCost", "综合成本", r => r.cost + r.coupon + r.platformSubsidy, yuan),
    metricColumn("productNetGmv", "净成交金额", productNetGmv, yuan),
    metricColumn("productNetOrders", "净成交订单数", productNetOrders),
    metricColumn("productComprehensiveRoi", "综合ROI", r => r.cost > 0 ? productNetGmv(r) / r.cost : 0, value => value.toFixed(2)),
    metricColumn("productComprehensiveOrderCost", "综合订单成本", r => r.orders > 0 ? (r.cost + r.coupon + r.platformSubsidy) / r.orders : 0, yuan),
    metricColumn("productNetRoi", "净成交ROI", r => r.cost > 0 ? productNetGmv(r) / r.cost : 0, value => value.toFixed(2)),
    metricColumn("productNetOrderCost", "净成交订单成本", r => productNetOrders(r) > 0 ? r.cost / productNetOrders(r) : 0, yuan),
    metricColumn("productImpressions", "整体展现次数", r => r.impressions),
    metricColumn("productConversionRate", "转化率", r => r.clicks > 0 ? r.orders / r.clicks : 0, pct),
    metricColumn("productCpm", "平均千次展现费用", r => r.impressions > 0 ? (r.cost / r.impressions) * 1000 : 0, yuan),
    metricColumn("productClicks", "整体点击次数", r => r.clicks),
    metricColumn("productCtr", "点击率", r => r.impressions > 0 ? r.clicks / r.impressions : 0, pct),
    metricColumn("productEstimatedGmv", "整体预估订单金额", r => Math.round(r.gmv * 1.08), yuan),
    metricColumn("productEstimatedOrders", "整体预估订单数", productEstimatedOrders),
    metricColumn("productUnsettledOrders", "整体未完结预估订单", r => Math.max(0, productEstimatedOrders(r) - r.orders)),
    metricColumn("productBaseSpend", "基础消耗", r => Math.round(r.cost * 0.72), yuan),
    metricColumn("productBoostSpend", "追投消耗", r => r.cost - Math.round(r.cost * 0.72), yuan),
    metricColumn("productBoostGmv", "追投成交金额", r => Math.round(r.gmv * 0.28), yuan),
    metricColumn("productBoostOrders", "追投成交订单数", productBoostOrders),
    metricColumn("productVideoPlays", "视频播放数", r => r.plays),
    metricColumn("productVideoCompletions", "视频完播数", r => r.effectivePlays),
    metricColumn("productThreeSecondPlays", "3秒播放数", r => r.plays3s),
    metricColumn("productThreeSecondRate", "3秒播放率", r => r.plays > 0 ? r.plays3s / r.plays : 0, pct),
    metricColumn("productCompletionRate", "完播率", r => r.plays > 0 ? r.effectivePlays / r.plays : 0, pct),
    metricColumn("productLikes", "视频点赞数", r => Math.round(r.clicks * 0.14)),
    metricColumn("productComments", "视频评论数", r => Math.round(r.clicks * 0.017)),
    metricColumn("productFollowers", "新增粉丝数", r => Math.round(r.clicks * 0.006)),
  ];
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  qianchuan: <TrendingUp className="w-4 h-4" />,
  juliang: <Megaphone className="w-4 h-4" />,
};

export default function AdPlatformAnalysisView({ showToast, initialDerivativeId }: AdPlatformAnalysisViewProps) {
  const derivatives = useDerivationRecords();
  const adStore = useAdStore();
  const organization = useReportOrganization();
  const allowed = canUseDerivations(getAdActor());
  const highlightedRef = useRef<HTMLTableRowElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState("qianchuan");
  const [activePromo, setActivePromo] = useState(0);
  const [activeDim, setActiveDim] = useState<DimensionTab>(initialDerivativeId ? "明细" : "团队");
  const [sortKey, setSortKey] = useState<string>("cost");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colOrder, setColOrder] = useState(() => standardMetricCols().map(column => column.key));
  const [categoryFilter, setCategoryFilter] = useState({ primary: "", secondary: "" });
  const [exportOpen, setExportOpen] = useState(false);
  const cols = useMemo(() => activePromo === 2 ? productDomainMetricCols() : standardMetricCols(), [activePromo]);
  const derivativeRows = useMemo(() => allowed && activePlatform === "qianchuan" ? derivativeAnalyticsRows(derivatives, adStore.records, organization) : [], [derivatives, adStore, organization, allowed, activePlatform]);
  const raw = useMemo(() => [...RAW, ...derivativeRows], [derivativeRows]);
  const categoryMap = useMemo(() => {
    const categories: Record<string, string[]> = Object.fromEntries(Object.values(CAT1).map(([primary, secondary]) => [primary, [...secondary]]));
    for (const row of raw) {
      if (!row.cat1) continue;
      const secondary = categories[row.cat1] ?? (categories[row.cat1] = []);
      if (row.cat2 && !secondary.includes(row.cat2)) secondary.push(row.cat2);
    }
    return categories;
  }, [raw]);
  const filteredRaw = useMemo(() => raw.filter(row =>
    (!categoryFilter.primary || row.cat1 === categoryFilter.primary) &&
    (!categoryFilter.secondary || row.cat2 === categoryFilter.secondary)
  ), [raw, categoryFilter]);
  const focusedRow = derivativeRows.find(row => row.videoId === initialDerivativeId);
  const preview = allowed ? derivatives.find(record => record.id === previewId && record.status === "成功") : undefined;

  useEffect(() => { if (initialDerivativeId) { setActivePlatform("qianchuan"); setActivePromo(0); setActiveDim("明细"); } }, [initialDerivativeId]);

  const data = useMemo(() => {
    let rows = aggregate(filteredRaw, activeDim);
    // 排序
    const sortColumn = cols.find(column => column.key === sortKey) || cols[0];
    const keyOf = (row: MetricRow) => sortColumn.value(row);
    rows = [...rows].sort((a, b) => (sortDir === "desc" ? keyOf(b) - keyOf(a) : keyOf(a) - keyOf(b)));
    return rows;
  }, [filteredRaw, activeDim, sortKey, sortDir, cols]);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { setPage(current => Math.min(current, totalPages)); }, [totalPages]);
  useEffect(() => { if (!allowed) setPreviewId(null); }, [allowed]);
  const pageData = data.slice((page - 1) * pageSize, page * pageSize);

  // 合计行（明细 tab）
  const totals = useMemo(() => sumRows(filteredRaw), [filteredRaw]);
  const targetIndex = activeDim === "明细" && allowed ? data.findIndex(row => row.videoId === initialDerivativeId) : -1;
  useEffect(() => { if (targetIndex >= 0) setPage(Math.floor(targetIndex / pageSize) + 1); }, [initialDerivativeId, targetIndex]);
  useEffect(() => {
    if (targetIndex < 0) return;
    const frame = requestAnimationFrame(() => highlightedRef.current?.scrollIntoView({ block: "center", inline: "nearest" }));
    return () => cancelAnimationFrame(frame);
  }, [initialDerivativeId, targetIndex, page]);

  const orderedCols = useMemo(() => {
    const byKey = new Map(cols.map(column => [column.key, column]));
    const ordered = colOrder.flatMap(key => byKey.has(key) ? [byKey.get(key)!] : []);
    const known = new Set(ordered.map(column => column.key));
    return [...ordered, ...cols.filter(column => !known.has(column.key))];
  }, [cols, colOrder]);
  const visibleCols = orderedCols.filter((c) => !hiddenCols.has(c.key));

  const toggleCol = (key: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const moveCol = (sourceKey: string, targetKey: string) => {
    setColOrder(previous => {
      const current = orderedCols.map(column => column.key);
      const sourceIndex = current.indexOf(sourceKey);
      const targetIndex = current.indexOf(targetKey);
      if (sourceIndex < 0 || targetIndex < 0) return previous;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const resetCols = () => {
    setColOrder(cols.map(column => column.key));
    setHiddenCols(new Set());
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const sortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === "desc" ? <ArrowDown className="w-3 h-3 text-purple-600" /> : <ArrowUp className="w-3 h-3 text-purple-600" />;
  };

  // 左列定义（随维度变化）
  const leftCols: { key: string; label: string }[] = (() => {
    if (activeDim === "团队") return [{ key: "team", label: "团队" }];
    if (activeDim === "分组") return [{ key: "team", label: "团队" }, { key: "group", label: "分组" }];
    if (activeDim === "个人") return [{ key: "team", label: "团队" }, { key: "group", label: "分组" }, { key: "author", label: "视频发布人" }];
    if (activeDim === "明细") return [
      { key: "team", label: "团队" }, { key: "group", label: "分组" }, { key: "author", label: "视频发布人" },
      { key: "cat1", label: "一级分类" }, { key: "cat2", label: "二级分类" }, { key: "video", label: "视频" },
      { key: "op", label: "操作" }, { key: "uploadDate", label: "视频上传时间" },
    ];
    return [{ key: "date", label: activeDim === "分日" ? "日期" : "月份" }];
  })();
  const exportStartDate = "2026-09-03";
  const exportEndDate = focusedRow && focusedRow.date > "2026-09-18" ? focusedRow.date : "2026-09-18";
  const exportFilters = [
    { label: "平台", value: PLATFORMS.find(item => item.id === activePlatform)?.name },
    { label: "推广", value: activePromo === 0 ? (activePlatform === "qianchuan" ? "千川汇总" : "巨量广告汇总") : PROMO_TABS[activePromo] },
    { label: "维度", value: activeDim },
    { label: "一级分类", value: categoryFilter.primary },
    { label: "二级分类", value: categoryFilter.secondary },
  ];

  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const exportData = aggregate(filteredRaw.filter(row => row.date >= request.startDate && row.date <= request.endDate), activeDim);
    const cells = [
      [...leftCols.map(column => column.label), ...visibleCols.map(column => column.label)],
      ...exportData.map(row => [
        ...leftCols.map(column => column.key === "op" ? "查看" : String(row[column.key as keyof MetricRow] ?? "")),
        ...visibleCols.map(column => column.render(row)),
      ]),
    ];
    const fileName = await exportAnalyticsRows(cells, request, "广告平台分析");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };

  const filterPlaceholder =
    activeDim === "团队" ? "请选择团队" :
    activeDim === "分组" ? "请选择分组" :
    activeDim === "个人" ? "请选择账号" : "请选择视频发布人";

  return (
    <div className="space-y-4">
      {/* ===== 平台一级 Tab（白卡片） ===== */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-6 px-5 py-3 border-b border-slate-100 bg-white overflow-x-auto">
          {PLATFORMS.map((p) => {
            const active = activePlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setActivePlatform(p.id); setPage(1); }}
                className={`flex items-center gap-2 font-bold text-sm transition-all cursor-pointer relative py-1 whitespace-nowrap ${
                  active ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <div className={`p-1 rounded-md ${active ? "bg-purple-100 text-[#7C3AED]" : "bg-slate-100 text-slate-400"}`}>
                  {PLATFORM_ICONS[p.id]}
                </div>
                <span>{p.name}</span>
                {active && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        {/* 二级推广类型 Tab */}
        <div className="flex items-center gap-1 px-5 py-3 overflow-x-auto">
          {PROMO_TABS.map((t, i) => {
            const active = activePromo === i;
            const label = i === 0 ? (activePlatform === "qianchuan" ? "千川汇总" : t + "汇总") : t;
            return (
              <button
                key={t}
                onClick={() => {
                  setActivePromo(i);
                  setSortKey(i === 2 ? "productOverallSpend" : "cost");
                  setSortDir("desc");
                  setPage(1);
                  setColOrder((i === 2 ? productDomainMetricCols() : standardMetricCols()).map(column => column.key));
                  setHiddenCols(new Set());
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#7C3AED] text-white shadow-2xs"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 数据维度 + 筛选 + 表格 白卡片 ===== */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/50 space-y-3">
        {/* 维度 Tab 按钮式 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {DIMENSION_TABS.map((d) => {
            const active = activeDim === d;
            return (
              <button
                key={d}
                onClick={() => { setActiveDim(d); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-white text-[#7C3AED] border border-purple-300 shadow-2xs ring-1 ring-purple-100"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* 筛选行 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 flex-wrap">
          <select className="pl-3 pr-8 py-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer w-44">
            <option>{filterPlaceholder}</option>
            {TEAMS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <div className="w-56 max-w-full">
            <CategoryCascader
              primaryCategory={categoryFilter.primary}
              secondaryCategory={categoryFilter.secondary}
              customCategoryMap={categoryMap}
              expandTrigger="click"
              placeholder="请选择分类"
              onSelect={(primary, secondary) => { setCategoryFilter({ primary, secondary }); setPage(1); }}
              onClear={() => { setCategoryFilter({ primary: "", secondary: "" }); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>上传时间:</span>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-400 shadow-2xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>开始日期</span><span className="text-slate-400">至</span><span>结束日期</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>消耗时间:</span>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>2026-09-03</span><span className="text-slate-400">至</span><span>{focusedRow && focusedRow.date > "2026-09-18" ? focusedRow.date : "2026-09-18"}</span>
            </div>
          </div>

          <button
            onClick={() => showToast?.("查询成功", `已加载 ${total} 条广告平台数据`)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            查询
          </button>
          <button
            onClick={() => { setCategoryFilter({ primary: "", secondary: "" }); setActiveDim("团队"); setPage(1); showToast?.("已重置", "筛选条件已重置"); }}
            className="border border-slate-200 text-slate-600 text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors bg-white shadow-2xs"
          >
            重置
          </button>
          </div>

          {/* 右组：导出 + 列设置 */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setExportOpen(true)} aria-haspopup="dialog" className="border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 flex items-center gap-1 shadow-2xs bg-white">
              导出 <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <ColumnSettingsControl
              columns={orderedCols}
              hiddenKeys={hiddenCols}
              onToggle={toggleCol}
              onMove={moveCol}
              onReset={resetCols}
            />
          </div>
        </div>
        </div>

        {/* 表格（横向滚动，纵向固定高度滚动） */}
        {initialDerivativeId && !allowed && <p role="status" className="mb-3 text-xs text-slate-500">暂无衍生视频查看权限</p>}
        {focusedRow && !focusedRow.cost && <p role="status" className="mb-3 text-xs text-slate-500">该衍生视频暂无投放数据</p>}
        <div className="overflow-auto border border-slate-100 rounded-lg" style={{ height: 380 }}>
          <table data-testid="ad-platform-analysis-table" className="w-full text-xs whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-500 font-bold">
                {leftCols.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3 font-bold">{c.label}</th>
                ))}
                {visibleCols.map((c) => (
                  <th key={c.key} data-column-key={c.key} className="min-w-32 text-right px-4 py-3 font-bold cursor-pointer select-none hover:text-purple-600" onClick={() => handleSort(c.key)}>
                    <span className="inline-flex items-center gap-1 justify-end">
                      {c.label}{c.label === "完播率" && <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[9px]">?</span>}
                      {sortIcon(c.key)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 顶部总计行（所有维度） */}
              <tr className="border-b border-slate-200 bg-purple-50/40 font-bold">
                <td colSpan={leftCols.length} className="px-4 py-2.5 text-slate-900">总计</td>
                {visibleCols.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-right text-slate-900">{c.render(totals)}</td>
                ))}
              </tr>

              {pageData.map(r => {
                const highlighted = Boolean(initialDerivativeId && r.videoId === initialDerivativeId);
                return <tr key={r.key} ref={highlighted ? highlightedRef : undefined} data-video-id={r.videoId} data-highlighted={highlighted ? "true" : undefined} className={`border-t border-slate-100 ${highlighted ? "bg-violet-50 outline outline-2 -outline-offset-2 outline-violet-400" : "hover:bg-slate-50/60"}`}>
                  {leftCols.map((c) => (
                    <td key={c.key} className="px-4 py-2.5 text-slate-700 font-medium">
                      {c.key === "op" ? (
                        <button
                          onClick={() => r.videoId ? setPreviewId(r.videoId) : showToast?.("查看视频", `查看 ${r.video}`)}
                          disabled={Boolean(r.videoId && !derivatives.some(record => record.id === r.videoId && record.status === "成功"))}
                          className="text-purple-600 hover:text-purple-700 font-bold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> 预览
                        </button>
                      ) : c.key === "video" ? (
                        <span className="text-slate-800 font-bold">{r.video}</span>
                      ) : (
                        (r as any)[c.key]
                      )}
                    </td>
                  ))}
                  {visibleCols.map((c) => (
                    <td key={c.key} className="px-4 py-2.5 text-right text-slate-700 tabular-nums">{c.render(r)}</td>
                  ))}
                </tr>;
              })}
            </tbody>
          </table>

          {pageData.length === 0 && (
            <div className="py-16 text-center text-xs text-slate-400">暂无符合条件的数据</div>
          )}
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-end gap-3 mt-4 text-xs text-slate-500">
          <span>共 {total} 条</span>
          <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
            <option>20条/页</option>
            <option>50条/页</option>
            <option>100条/页</option>
          </select>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                  p === page ? "bg-purple-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span>前往 <input value={page} readOnly className="w-12 border border-slate-200 rounded-lg px-2 py-1 text-center" /> 页</span>
        </div>
      </div>
      {preview && <AdDialog title={preview.name} onClose={() => setPreviewId(null)}><video src={preview.url} controls autoPlay className="max-h-[65vh] w-full bg-black" /></AdDialog>}
      <AnalyticsExportDialog open={exportOpen} pageName="广告平台分析" filters={exportFilters} startDate={exportStartDate} endDate={exportEndDate} onClose={() => setExportOpen(false)} onConfirm={handleExport} />
    </div>
  );
}
