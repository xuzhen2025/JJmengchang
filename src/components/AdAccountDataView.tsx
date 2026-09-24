import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Megaphone,
  TrendingUp,
  X,
} from "lucide-react";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import {
  REPORT_START,
  REPORT_TODAY,
  reportTotals,
  selectReportFacts,
  type ReportFact,
} from "../lib/reportDemoData";
import { useReportData } from "../lib/useReportData";
import ColumnSettingsControl from "./ColumnSettingsControl";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import ReportCategoryFilter from "./ReportCategoryFilter";

interface AdAccountDataViewProps {
  showToast?: (title: string, desc: string) => void;
}

const PLATFORMS = [
  { id: "qianchuan", name: "巨量千川", icon: TrendingUp },
  { id: "juliang", name: "巨量广告", icon: Megaphone },
] as const;

const PROMOTIONS = [
  { id: "standard", label: "标准推广", value: "标准推广" },
  { id: "product_domain", label: "商品全域推广", value: "商品全域推广" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];
type PromotionId = (typeof PROMOTIONS)[number]["id"];
type Dimension = "personnel" | "category" | "advertiser";
type PersonnelLevel = "team" | "group" | "person";
type CategoryLevel = "primary" | "secondary";

interface Filters {
  start: string;
  end: string;
  team: string;
  group: string;
  person: string;
  account: string;
  category: string;
  advertiserId: string;
  advertiserName: string;
}

const DEFAULT_FILTERS: Filters = {
  start: REPORT_START,
  end: REPORT_TODAY,
  team: "",
  group: "",
  person: "",
  account: "",
  category: "",
  advertiserId: "",
  advertiserName: "",
};

interface MetricValues {
  [key: string]: number;
}

interface MetricColumn {
  key: string;
  label: string;
  value: (values: MetricValues) => number;
  render: (values: MetricValues) => string;
}

interface DataRow {
  key: string;
  team: string;
  group: string;
  user: string;
  cat1: string;
  cat2: string;
  accountName: string;
  accountId: string;
  facts: ReportFact[];
  metrics: MetricValues;
}

const fixed = (value: number) => value.toFixed(2);
const integer = (value: number) => String(Math.round(value));
const percent = (value: number) => `${value.toFixed(2)}%`;

function metricColumn(
  key: string,
  label: string,
  formatter: (value: number) => string = fixed,
): MetricColumn {
  return {
    key,
    label,
    value: values => values[key] || 0,
    render: values => formatter(values[key] || 0),
  };
}

function standardMetricColumns(): MetricColumn[] {
  return [
    metricColumn("spend", "消耗"),
    metricColumn("roi", "roi"),
    metricColumn("totalGmv", "总成交金额"),
    metricColumn("dealAmount", "成交金额"),
    metricColumn("smartCoupon", "智能优惠券"),
    metricColumn("subsidy", "电商平台补贴金额"),
    metricColumn("orders", "转化数", integer),
    metricColumn("conversionRate", "转化率", percent),
    metricColumn("orderCost", "转化成本"),
    metricColumn("impressions", "展示数", integer),
    metricColumn("cpm", "平均千次展现费用"),
    metricColumn("clicks", "点击数", integer),
    metricColumn("clickRate", "点击率", percent),
    metricColumn("cpc", "平均点击单价"),
    metricColumn("plays", "播放量", integer),
    metricColumn("completionRate", "完播率", percent),
    metricColumn("completions", "有效播放数", integer),
    metricColumn("threeSecondPlays", "3秒播放数", integer),
    metricColumn("threeSecondRate", "3秒播放率", percent),
  ];
}

function productDomainMetricColumns(): MetricColumn[] {
  return [
    metricColumn("overallSpend", "整体消耗"),
    metricColumn("overallRoi", "整体ROI"),
    metricColumn("overallTotalGmv", "整体总成交金额"),
    metricColumn("userPaid", "用户实际支付金额"),
    metricColumn("overallCoupon", "整体成交智能优惠券"),
    metricColumn("overallOrders", "整体成交订单数", integer),
    metricColumn("overallOrderCost", "整体成交订单成本"),
    metricColumn("platformSubsidy", "电商平台补贴金额"),
    metricColumn("overallGmv", "整体成交金额"),
    metricColumn("comprehensiveCost", "综合成本"),
    metricColumn("netGmv", "净成交金额"),
    metricColumn("netOrders", "净成交订单数", integer),
    metricColumn("comprehensiveRoi", "综合ROI"),
    metricColumn("comprehensiveOrderCost", "综合订单成本"),
    metricColumn("netRoi", "净成交ROI"),
    metricColumn("netOrderCost", "净成交订单成本"),
    metricColumn("overallImpressions", "整体展现次数", integer),
    metricColumn("productConversionRate", "转化率", percent),
    metricColumn("productCpm", "平均千次展现费用"),
    metricColumn("overallClicks", "整体点击次数", integer),
    metricColumn("productCtr", "点击率", percent),
    metricColumn("estimatedGmv", "整体预估订单金额"),
    metricColumn("estimatedOrders", "整体预估订单数", integer),
    metricColumn("unsettledOrders", "整体未完结预估订单", integer),
    metricColumn("baseSpend", "基础消耗"),
    metricColumn("boostSpend", "追投消耗"),
    metricColumn("boostGmv", "追投成交金额"),
    metricColumn("boostOrders", "追投成交订单数", integer),
    metricColumn("videoPlays", "视频播放数", integer),
    metricColumn("videoCompletions", "视频完播数", integer),
    metricColumn("productThreeSecondPlays", "3秒播放数", integer),
    metricColumn("productThreeSecondRate", "3秒播放率", percent),
    metricColumn("productCompletionRate", "完播率", percent),
    metricColumn("likes", "视频点赞数", integer),
    metricColumn("comments", "视频评论数", integer),
    metricColumn("followers", "新增粉丝数", integer),
  ];
}

function metricsFor(facts: ReportFact[]): MetricValues {
  const totals = reportTotals(facts);
  const smartCoupon = Math.max(0, totals.coupon - totals.subsidy);
  const threeSecondPlays = facts.reduce((sum, fact) => sum + fact.finish3s, 0);
  const completions = Math.round(totals.views * 0.36);
  const netOrders = Math.max(0, totals.netOrders);
  const estimatedOrders = Math.round(totals.conv * 1.08);
  const estimatedGmv = totals.totalGmv * 1.08;
  const baseSpend = totals.spend * 0.72;
  const boostSpend = totals.spend - baseSpend;
  const boostOrders = Math.round(totals.conv * 0.28);
  const boostGmv = totals.totalGmv * 0.28;
  const comprehensiveCost = totals.spend + smartCoupon + totals.subsidy;
  const completionRate = totals.views > 0 ? (completions / totals.views) * 100 : 0;
  const threeSecondRate = totals.views > 0 ? (threeSecondPlays / totals.views) * 100 : 0;

  return {
    spend: totals.spend,
    roi: totals.roi,
    totalGmv: totals.totalGmv,
    dealAmount: totals.dealAmount,
    smartCoupon,
    subsidy: totals.subsidy,
    orders: totals.conv,
    conversionRate: totals.cvr,
    orderCost: totals.conv > 0 ? totals.spend / totals.conv : 0,
    impressions: totals.imp,
    cpm: totals.imp > 0 ? (totals.spend / totals.imp) * 1000 : 0,
    clicks: totals.clicks,
    clickRate: totals.ctr,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    plays: totals.views,
    completionRate,
    completions,
    threeSecondPlays,
    threeSecondRate,
    overallSpend: totals.spend,
    overallRoi: totals.roi,
    overallTotalGmv: totals.totalGmv,
    userPaid: totals.dealAmount,
    overallCoupon: smartCoupon,
    overallOrders: totals.conv,
    overallOrderCost: totals.conv > 0 ? totals.spend / totals.conv : 0,
    platformSubsidy: totals.subsidy,
    overallGmv: totals.totalGmv,
    comprehensiveCost,
    netGmv: totals.netSales,
    netOrders,
    comprehensiveRoi: comprehensiveCost > 0 ? totals.netSales / comprehensiveCost : 0,
    comprehensiveOrderCost: netOrders > 0 ? comprehensiveCost / netOrders : 0,
    netRoi: totals.netRoi,
    netOrderCost: netOrders > 0 ? totals.spend / netOrders : 0,
    overallImpressions: totals.imp,
    productConversionRate: totals.cvr,
    productCpm: totals.imp > 0 ? (totals.spend / totals.imp) * 1000 : 0,
    overallClicks: totals.clicks,
    productCtr: totals.ctr,
    estimatedGmv,
    estimatedOrders,
    unsettledOrders: Math.max(0, estimatedOrders - totals.conv),
    baseSpend,
    boostSpend,
    boostGmv,
    boostOrders,
    videoPlays: totals.views,
    videoCompletions: completions,
    productThreeSecondPlays: threeSecondPlays,
    productThreeSecondRate: threeSecondRate,
    productCompletionRate: completionRate,
    likes: Math.round(totals.clicks * 0.14),
    comments: Math.round(totals.clicks * 0.017),
    followers: Math.round(totals.clicks * 0.006),
  };
}

function aggregateFacts(
  facts: ReportFact[],
  dimension: Dimension,
  personnelLevel: PersonnelLevel,
  categoryLevel: CategoryLevel,
): DataRow[] {
  const groups = new Map<string, ReportFact[]>();
  for (const fact of facts) {
    const key = dimension === "personnel"
      ? personnelLevel === "team"
        ? fact.department
        : personnelLevel === "group"
          ? `${fact.department}||${fact.group}`
          : `${fact.department}||${fact.group}||${fact.person}`
      : dimension === "category"
        ? categoryLevel === "primary"
          ? fact.category
          : `${fact.category}||${fact.subcategory}`
        : `${fact.platform}||${fact.accountId}`;
    const list = groups.get(key) || [];
    list.push(fact);
    groups.set(key, list);
  }

  return [...groups.entries()].map(([key, items]) => {
    const first = items[0];
    return {
      key,
      team: first.department,
      group: first.group,
      user: first.person,
      cat1: first.category,
      cat2: first.subcategory,
      accountName: first.account,
      accountId: first.accountId,
      facts: items,
      metrics: metricsFor(items),
    };
  });
}

function relationText(value: string, kind: "team" | "group" | "user" | "category") {
  if (kind === "team" && (!value || value === "未归属部门")) return "未绑定团队";
  if (kind === "group" && (!value || value === "未归属分组")) return "未绑定分组";
  if (kind === "user" && (!value || value === "未关联员工")) return "未绑定用户";
  if (kind === "category" && (!value || value === "未设置分类")) return "未绑定分类";
  return value;
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export default function AdAccountDataView({ showToast }: AdAccountDataViewProps) {
  const report = useReportData();
  const [platform, setPlatform] = useState<PlatformId>("qianchuan");
  const [promotion, setPromotion] = useState<PromotionId>("standard");
  const [dimension, setDimension] = useState<Dimension>("personnel");
  const [personnelLevel, setPersonnelLevel] = useState<PersonnelLevel>("team");
  const [categoryLevel, setCategoryLevel] = useState<CategoryLevel>("primary");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState("spend");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [pageInput, setPageInput] = useState("1");
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [columnOrder, setColumnOrder] = useState(() => standardMetricColumns().map(column => column.key));
  const [exportOpen, setExportOpen] = useState(false);
  const [unboundOpen, setUnboundOpen] = useState(false);

  const platformName = PLATFORMS.find(item => item.id === platform)!.name;
  const metricColumns = useMemo(
    () => platform === "qianchuan" && promotion === "product_domain"
      ? productDomainMetricColumns()
      : standardMetricColumns(),
    [platform, promotion],
  );
  const platformFacts = useMemo(
    () => report.facts.filter(fact => fact.platform === platformName),
    [report.facts, platformName],
  );

  const filterOptions = useMemo(() => {
    const teamFacts = filters.team ? platformFacts.filter(fact => fact.department === filters.team) : platformFacts;
    const groupFacts = filters.group ? teamFacts.filter(fact => fact.group === filters.group) : teamFacts;
    return {
      teams: unique(platformFacts.map(fact => fact.department)),
      groups: unique(teamFacts.map(fact => fact.group)),
      people: unique(groupFacts.map(fact => fact.person)),
      accounts: [...new Map(groupFacts.map(fact => [fact.accountId, { id: fact.accountId, name: fact.account }])).values()],
    };
  }, [platformFacts, filters.team, filters.group]);

  const selectedFacts = useMemo(() => {
    const selected = selectReportFacts(report.facts, platformName, {
      start: appliedFilters.start,
      end: appliedFilters.end,
      department: appliedFilters.team,
      group: appliedFilters.group,
      person: appliedFilters.person,
      category: appliedFilters.category,
      accountId: appliedFilters.advertiserId,
      query: appliedFilters.advertiserName,
      promotion: platform === "qianchuan"
        ? PROMOTIONS.find(item => item.id === promotion)!.value
        : undefined,
    });
    return selected.filter(fact => !appliedFilters.account || fact.accountId === appliedFilters.account);
  }, [report.facts, platformName, platform, promotion, appliedFilters]);

  const orderedColumns = useMemo(() => {
    const byKey = new Map(metricColumns.map(column => [column.key, column]));
    const ordered = columnOrder.flatMap(key => byKey.has(key) ? [byKey.get(key)!] : []);
    const present = new Set(ordered.map(column => column.key));
    return [...ordered, ...metricColumns.filter(column => !present.has(column.key))];
  }, [metricColumns, columnOrder]);
  const visibleColumns = orderedColumns.filter(column => !hiddenColumns.has(column.key));

  const rows = useMemo(() => {
    const aggregated = aggregateFacts(selectedFacts, dimension, personnelLevel, categoryLevel);
    const column = metricColumns.find(item => item.key === sortKey) || metricColumns[0];
    return aggregated.sort((left, right) => {
      const difference = column.value(left.metrics) - column.value(right.metrics);
      return sortDirection === "asc" ? difference : -difference;
    });
  }, [selectedFacts, dimension, personnelLevel, categoryLevel, metricColumns, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const totals = useMemo(() => metricsFor(selectedFacts), [selectedFacts]);

  useEffect(() => {
    setPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  useEffect(() => setPageInput(String(page)), [page]);

  const leftColumns = useMemo(() => {
    if (dimension === "personnel") {
      if (personnelLevel === "team") return [{ key: "team", label: "团队" }];
      if (personnelLevel === "group") return [{ key: "team", label: "团队" }, { key: "group", label: "分组" }];
      return [{ key: "team", label: "团队" }, { key: "group", label: "分组" }, { key: "user", label: "用户" }];
    }
    if (dimension === "category") {
      return categoryLevel === "primary"
        ? [{ key: "cat1", label: "一级分类" }]
        : [{ key: "cat1", label: "一级分类" }, { key: "cat2", label: "二级分类" }];
    }
    return [
      { key: "account", label: "广告账户" },
      { key: "team", label: "团队" },
      { key: "group", label: "分组" },
      { key: "user", label: "用户" },
      { key: "cat1", label: "一级分类" },
      { key: "cat2", label: "二级分类" },
    ];
  }, [dimension, personnelLevel, categoryLevel]);

  const unboundAccounts = useMemo(() => {
    const accountFacts = aggregateFacts(platformFacts, "advertiser", "team", "primary");
    return accountFacts.filter(row =>
      relationText(row.team, "team").startsWith("未绑定") ||
      relationText(row.group, "group").startsWith("未绑定") ||
      relationText(row.user, "user").startsWith("未绑定") ||
      relationText(row.cat1, "category").startsWith("未绑定") ||
      relationText(row.cat2, "category").startsWith("未绑定")
    );
  }, [platformFacts]);

  const resetColumns = (nextPromotion = promotion, nextPlatform = platform) => {
    const next = nextPlatform === "qianchuan" && nextPromotion === "product_domain"
      ? productDomainMetricColumns()
      : standardMetricColumns();
    setColumnOrder(next.map(column => column.key));
    setHiddenColumns(new Set());
    setSortKey(next[0].key);
    setSortDirection("desc");
  };

  const resetFilters = (notify = true) => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    if (notify) showToast?.("已重置", "已恢复默认筛选条件");
  };

  const changePlatform = (next: PlatformId) => {
    if (next === platform) return;
    setPlatform(next);
    setPromotion("standard");
    resetColumns("standard", next);
    resetFilters(false);
  };

  const changePromotion = (next: PromotionId) => {
    if (next === promotion) return;
    setPromotion(next);
    resetColumns(next, platform);
    setPage(1);
  };

  const changeDimension = (next: Dimension) => {
    if (next === dimension) return;
    setDimension(next);
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleQuery = () => {
    if (!filters.start || !filters.end || filters.start > filters.end) {
      showToast?.("查询失败", "请选择有效的消耗时间范围");
      return;
    }
    setAppliedFilters({ ...filters });
    setPage(1);
    showToast?.("查询成功", `已提交 ${platformName} 账户数据筛选`);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDirection(direction => direction === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const sortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
    return sortDirection === "desc"
      ? <ArrowDown className="h-3 w-3 text-purple-600" />
      : <ArrowUp className="h-3 w-3 text-purple-600" />;
  };

  const toggleColumn = (key: string) => {
    setHiddenColumns(previous => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const moveColumn = (sourceKey: string, targetKey: string) => {
    setColumnOrder(() => {
      const current = orderedColumns.map(column => column.key);
      const sourceIndex = current.indexOf(sourceKey);
      const targetIndex = current.indexOf(targetKey);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const renderLeftCell = (row: DataRow, key: string) => {
    if (key === "account") {
      return <div className="max-w-56 whitespace-normal">
        <div className="font-bold text-slate-800">{row.accountName}</div>
        <div className="mt-0.5 font-mono text-[11px] text-slate-400">{row.accountId}</div>
      </div>;
    }
    const type = key === "team" ? "team" : key === "group" ? "group" : key === "user" ? "user" : "category";
    const value = relationText(row[key as keyof DataRow] as string, type);
    const unbound = value.startsWith("未绑定");
    return <span className={unbound ? "font-bold text-purple-600" : "font-medium text-slate-700"}>{value}</span>;
  };

  const dimensionLabel = dimension === "personnel" ? "人员数据" : dimension === "category" ? "分类数据" : "广告主明细";
  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const selected = selectReportFacts(report.facts, platformName, {
      start: request.startDate,
      end: request.endDate,
      department: appliedFilters.team,
      group: appliedFilters.group,
      person: appliedFilters.person,
      category: appliedFilters.category,
      accountId: appliedFilters.advertiserId,
      query: appliedFilters.advertiserName,
      promotion: platform === "qianchuan" ? PROMOTIONS.find(item => item.id === promotion)!.value : undefined,
    }).filter(fact => !appliedFilters.account || fact.accountId === appliedFilters.account);
    const column = metricColumns.find(item => item.key === sortKey) || metricColumns[0];
    const exportRows = aggregateFacts(selected, dimension, personnelLevel, categoryLevel).sort((left, right) => {
      const difference = column.value(left.metrics) - column.value(right.metrics);
      return sortDirection === "asc" ? difference : -difference;
    });
    const fileName = await exportAnalyticsRows([
      [...leftColumns.map(column => column.label), ...visibleColumns.map(column => column.label)],
      ...exportRows.map(row => [
        ...leftColumns.map(column => column.key === "account" ? `${row.accountName} (${row.accountId})` : String(renderExportCell(row, column.key))),
        ...visibleColumns.map(column => column.render(row.metrics)),
      ]),
    ], request, "广告账户数据");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(previous => ({ ...previous, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center gap-6 overflow-x-auto border-b border-slate-100 px-5 py-3">
          {PLATFORMS.map(item => {
            const active = platform === item.id;
            const Icon = item.icon;
            return <button
              type="button"
              key={item.id}
              onClick={() => changePlatform(item.id)}
              className={`relative flex cursor-pointer items-center gap-2 whitespace-nowrap py-1 text-sm font-bold transition-colors ${active ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"}`}
            >
              <span className={`rounded-md p-1 ${active ? "bg-purple-100 text-[#7C3AED]" : "bg-slate-100 text-slate-400"}`}><Icon className="h-4 w-4" /></span>
              {item.name}
              {active && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 rounded-full bg-[#7C3AED]" />}
            </button>;
          })}
        </div>
        {platform === "qianchuan" && <div className="flex items-center gap-2 overflow-x-auto px-5 py-3">
          {PROMOTIONS.map(item => <button
            type="button"
            key={item.id}
            onClick={() => changePromotion(item.id)}
            className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${promotion === item.id ? "bg-[#7C3AED] text-white shadow-2xs" : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"}`}
          >{item.label}</button>)}
        </div>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="space-y-3 bg-slate-50/50 p-4">
          <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
            {([
              { id: "personnel", label: "人员数据" },
              { id: "category", label: "分类数据" },
              { id: "advertiser", label: "广告主明细" },
            ] as const).map(item => <button
              type="button"
              key={item.id}
              onClick={() => changeDimension(item.id)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md px-4 py-1.5 text-xs font-bold transition-all ${dimension === item.id ? "bg-white text-[#7C3AED] shadow-2xs" : "text-slate-700 hover:text-slate-900"}`}
            >{item.label}</button>)}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {dimension === "personnel" && <>
                <SelectField
                  ariaLabel="人员汇总层级"
                  value={personnelLevel}
                  onChange={value => { setPersonnelLevel(value as PersonnelLevel); setPage(1); }}
                  options={[
                    { value: "team", label: "团队汇总" },
                    { value: "group", label: "分组汇总" },
                    { value: "person", label: "个人汇总" },
                  ]}
                  width="w-32"
                  strong
                />
                <SelectField
                  ariaLabel="团队"
                  value={filters.team}
                  onChange={value => setFilters(previous => ({ ...previous, team: value, group: "", person: "", account: "" }))}
                  placeholder="请选择团队"
                  prefix="团队"
                  options={filterOptions.teams.map(value => ({ value, label: relationText(value, "team") }))}
                />
                {personnelLevel !== "team" && <SelectField
                  ariaLabel="分组"
                  value={filters.group}
                  onChange={value => setFilters(previous => ({ ...previous, group: value, person: "", account: "" }))}
                  placeholder="请选择分组"
                  prefix="分组"
                  options={filterOptions.groups.map(value => ({ value, label: relationText(value, "group") }))}
                />}
                {personnelLevel === "person" && <SelectField
                  ariaLabel="用户"
                  value={filters.person}
                  onChange={value => updateFilter("person", value)}
                  placeholder="请选择用户"
                  prefix="用户"
                  options={filterOptions.people.map(value => ({ value, label: relationText(value, "user") }))}
                />}
              </>}

              {dimension === "category" && <>
                <SelectField
                  ariaLabel="分类汇总层级"
                  value={categoryLevel}
                  onChange={value => { setCategoryLevel(value as CategoryLevel); setPage(1); }}
                  options={[
                    { value: "primary", label: "一级分类汇总" },
                    { value: "secondary", label: "二级分类汇总" },
                  ]}
                  width="w-36"
                  strong
                />
                <ReportCategoryFilter categories={report.categories} value={filters.category} onChange={value => updateFilter("category", value)} />
              </>}

              {dimension === "advertiser" && <>
                <SelectField
                  ariaLabel="团队"
                  value={filters.team}
                  onChange={value => setFilters(previous => ({ ...previous, team: value, group: "", person: "", account: "" }))}
                  placeholder="请选择团队"
                  prefix="团队"
                  options={filterOptions.teams.map(value => ({ value, label: relationText(value, "team") }))}
                />
                <SelectField
                  ariaLabel="分组"
                  value={filters.group}
                  onChange={value => setFilters(previous => ({ ...previous, group: value, person: "", account: "" }))}
                  placeholder="请选择分组"
                  prefix="分组"
                  options={filterOptions.groups.map(value => ({ value, label: relationText(value, "group") }))}
                />
                <SelectField
                  ariaLabel="账号"
                  value={filters.account}
                  onChange={value => updateFilter("account", value)}
                  placeholder="请选择账号"
                  prefix="账号"
                  options={filterOptions.accounts.map(account => ({ value: account.id, label: account.name }))}
                />
                <ReportCategoryFilter categories={report.categories} value={filters.category} onChange={value => updateFilter("category", value)} />
              </>}

              <DateRange
                start={filters.start}
                end={filters.end}
                onStart={value => updateFilter("start", value)}
                onEnd={value => updateFilter("end", value)}
              />
              <LabeledInput label="广告主ID" placeholder="请输入广告主ID" value={filters.advertiserId} onChange={value => updateFilter("advertiserId", value)} />
              <LabeledInput label="广告主名称" placeholder="请输入广告主名称" value={filters.advertiserName} onChange={value => updateFilter("advertiserName", value)} />

              <div className="inline-flex items-center gap-1 text-xs text-slate-400">
                <button type="button" onClick={() => setUnboundOpen(true)} className="inline-flex cursor-pointer items-center gap-1 hover:text-slate-600">
                  未绑定数据 <HelpCircle className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setUnboundOpen(true)} className="inline-flex cursor-pointer items-center gap-1 font-bold text-purple-600 hover:text-purple-700">
                  点击前往 <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
              <button type="button" onClick={handleQuery} className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-purple-700">查询</button>
              <button type="button" onClick={() => resetFilters()} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50">重置</button>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <button type="button" onClick={() => setExportOpen(true)} className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50" aria-haspopup="dialog">
                  导出 <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <ColumnSettingsControl
                columns={orderedColumns}
                hiddenKeys={hiddenColumns}
                onToggle={toggleColumn}
                onMove={moveColumn}
                onReset={() => resetColumns()}
              />
            </div>
          </div>
        </div>

        <div className="max-h-[480px] overflow-auto border-y border-slate-100">
          <table data-testid="ad-account-data-table" className="w-full border-collapse whitespace-nowrap text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-500">
                {leftColumns.map(column => <th key={column.key} className="px-4 py-3 text-left font-bold">{column.label}</th>)}
                {visibleColumns.map(column => <th
                  key={column.key}
                  data-column-key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="min-w-32 cursor-pointer select-none px-4 py-3 text-right font-bold hover:text-purple-600"
                ><span className="inline-flex items-center justify-end gap-1">{column.label}{sortIcon(column.key)}</span></th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 bg-purple-50/40 font-bold">
                {leftColumns.map((column, index) => <td key={column.key} className="px-4 py-2.5 text-slate-900">{index === 0 ? "总计" : ""}</td>)}
                {visibleColumns.map(column => <td key={column.key} className="px-4 py-2.5 text-right tabular-nums text-slate-900">{column.render(totals)}</td>)}
              </tr>
              {pageRows.map(row => <tr key={row.key} className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
                {leftColumns.map(column => <td key={column.key} className="px-4 py-3">{renderLeftCell(row, column.key)}</td>)}
                {visibleColumns.map(column => <td key={column.key} className="px-4 py-3 text-right tabular-nums text-slate-700">{column.render(row.metrics)}</td>)}
              </tr>)}
            </tbody>
          </table>
          {pageRows.length === 0 && <div className="py-16 text-center text-xs text-slate-400">暂无符合条件的数据</div>}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-3 text-xs text-slate-500">
          <span>共 {rows.length} 条</span>
          <select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none">
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
          <button type="button" title="上一页" aria-label="上一页" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1} className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" className="h-7 min-w-7 rounded-lg bg-purple-600 px-2 text-xs font-bold text-white">{page}</button>
          <button type="button" title="下一页" aria-label="下一页" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          <label className="flex items-center gap-1.5">前往
            <input
              value={pageInput}
              onChange={event => setPageInput(event.target.value.replace(/\D/g, ""))}
              onKeyDown={event => {
                if (event.key !== "Enter") return;
                const target = Math.min(totalPages, Math.max(1, Number(pageInput) || 1));
                setPage(target);
              }}
              onBlur={() => {
                const target = Math.min(totalPages, Math.max(1, Number(pageInput) || 1));
                setPage(target);
                setPageInput(String(target));
              }}
              className="w-12 rounded-lg border border-slate-200 px-2 py-1 text-center focus:border-purple-500 focus:outline-none"
              aria-label="前往页码"
            /> 页
          </label>
        </div>
      </section>

      {unboundOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs" onMouseDown={() => setUnboundOpen(false)}>
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="unbound-title">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 id="unbound-title" className="text-sm font-bold text-slate-900">未绑定数据</h3>
              <p className="mt-1 text-xs text-slate-500">当前平台共有 {unboundAccounts.length} 个账户存在未绑定关系</p>
            </div>
            <button type="button" title="关闭" aria-label="关闭" onClick={() => setUnboundOpen(false)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full whitespace-nowrap text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500"><tr>{["广告账户", "团队", "分组", "用户", "一级分类", "二级分类"].map(label => <th key={label} className="px-4 py-2.5 text-left font-bold">{label}</th>)}</tr></thead>
              <tbody>{unboundAccounts.map(row => <tr key={row.key} className="border-t border-slate-100">
                <td className="px-4 py-3"><div className="font-bold text-slate-800">{row.accountName}</div><div className="mt-0.5 font-mono text-[11px] text-slate-400">{row.accountId}</div></td>
                {[relationText(row.team, "team"), relationText(row.group, "group"), relationText(row.user, "user"), relationText(row.cat1, "category"), relationText(row.cat2, "category")].map((value, index) => <td key={`${row.key}-${index}`} className={`px-4 py-3 ${value.startsWith("未绑定") ? "font-bold text-purple-600" : "text-slate-700"}`}>{value}</td>)}
              </tr>)}</tbody>
            </table>
            {unboundAccounts.length === 0 && <div className="py-12 text-center text-xs text-slate-400">当前平台没有未绑定数据</div>}
          </div>
          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3"><button type="button" onClick={() => setUnboundOpen(false)} className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700">关闭</button></div>
        </div>
      </div>}
      <AnalyticsExportDialog
        open={exportOpen}
        pageName="广告账户数据"
        filters={[
          { label: "平台", value: platformName },
          { label: "推广", value: platform === "qianchuan" ? PROMOTIONS.find(item => item.id === promotion)?.label : "" },
          { label: "维度", value: dimensionLabel },
          { label: "部门", value: appliedFilters.team },
          { label: "分组", value: appliedFilters.group },
          { label: "用户", value: appliedFilters.person },
          { label: "账户", value: appliedFilters.account },
          { label: "分类", value: appliedFilters.category },
          { label: "广告主ID", value: appliedFilters.advertiserId },
          { label: "广告主名称", value: appliedFilters.advertiserName },
        ]}
        startDate={appliedFilters.start}
        endDate={appliedFilters.end}
        onClose={() => setExportOpen(false)}
        onConfirm={handleExport}
      />
    </div>
  );
}

function renderExportCell(row: DataRow, key: string) {
  if (key === "team") return relationText(row.team, "team");
  if (key === "group") return relationText(row.group, "group");
  if (key === "user") return relationText(row.user, "user");
  if (key === "cat1") return relationText(row.cat1, "category");
  if (key === "cat2") return relationText(row.cat2, "category");
  return "";
}

interface SelectFieldProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  prefix?: string;
  width?: string;
  strong?: boolean;
}

function SelectField({ ariaLabel, value, onChange, options, placeholder, prefix, width = "w-56", strong }: SelectFieldProps) {
  return <div className={`relative ${width} max-w-full shrink-0`}>
    {prefix && <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs font-bold text-slate-700">{prefix}</span>}
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={event => onChange(event.target.value)}
      className={`w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 text-xs shadow-2xs focus:border-purple-500 focus:outline-none ${prefix ? "pl-14" : "pl-3"} ${strong ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
  </div>;
}

function DateRange({ start, end, onStart, onEnd }: { start: string; end: string; onStart: (value: string) => void; onEnd: (value: string) => void }) {
  return <div className="flex min-w-[330px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-2xs">
    <span className="font-bold text-slate-700">消耗时间</span>
    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
    <input type="date" aria-label="开始日期" value={start} onChange={event => onStart(event.target.value)} className="w-[116px] bg-transparent font-medium text-slate-700 outline-none" />
    <span className="text-slate-400">至</span>
    <input type="date" aria-label="结束日期" value={end} onChange={event => onEnd(event.target.value)} className="w-[116px] bg-transparent font-medium text-slate-700 outline-none" />
  </div>;
}

function LabeledInput({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex w-56 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs focus-within:border-purple-500">
    <span className="shrink-0 font-bold text-slate-700">{label}</span>
    <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="ml-2 min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400" />
  </label>;
}
