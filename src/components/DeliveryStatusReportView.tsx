import { useId, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, BarChart2, Calendar, ChevronUp, HelpCircle, RotateCcw, Search } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { REPORT_COLORS, REPORT_START, REPORT_TODAY } from "../lib/reportDemoData";
import { useReportData } from "../lib/useReportData";
import { buildDeliveryReport, deliveryCategoryOptions, deliveryChartData, deliveryEntityOptions, type DeliveryDimension, type DeliveryFilters, type DeliveryStatusKey } from "../lib/deliveryStatusReport";
import AnchoredPopover from "./overlays/AnchoredPopover";
import ReportMultiSelect from "./ReportMultiSelect";
import ColumnSettingsControl from "./ColumnSettingsControl";
import AssetPagination from "./AssetPagination";

interface DeliveryStatusReportViewProps {
  showToast?: (title: string, desc: string) => void;
}

type Platform = "巨量广告" | "巨量千川";
type MetricFilter = "搭建计划总数" | "投放中" | "未投放";
const DIMENSION_TABS: { id: DeliveryDimension; label: string }[] = [
  { id: "team", label: "部门数据" },
  { id: "group", label: "分组数据" },
  { id: "personal", label: "个人数据" },
  { id: "advertiser_detail", label: "广告主明细数据" },
];
const METRIC_KEYS: Record<MetricFilter, DeliveryStatusKey> = { 搭建计划总数: "total", 投放中: "delivering", 未投放: "pending" };
const STATUS_COLUMNS: { key: DeliveryStatusKey; label: string }[] = [
  { key: "total", label: "搭建计划总数" }, { key: "delivering", label: "投放中" }, { key: "pending", label: "未投放" },
  { key: "terminated", label: "已终止" }, { key: "finished", label: "已完成" }, { key: "deleted", label: "已删除" },
];
const PENDING_STATUS_RULES = [
  "审核不通过、新建审核中、修改审核中、已暂停、配额达限、未到投放时间",
  "项目已暂停、不在投放时段、未达投放时间、账户余额不足、账户超出预算",
  "预算组超出预算、项目超出预算、广告超出预算、直播间不可投放",
  "产品不可投放、抖音号不可投放、锚点不可投放",
];

function PendingStatusHelp() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  return <>
    <button ref={anchorRef} type="button" aria-label="查看未投放状态说明" aria-describedby={open ? tooltipId : undefined}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (document.activeElement !== anchorRef.current) setOpen(false); }}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)}
      className="inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded text-slate-400 hover:text-purple-600 focus-visible:outline-2 focus-visible:outline-purple-500">
      <HelpCircle className="h-4 w-4" />
    </button>
    {open && <AnchoredPopover anchorRef={anchorRef} id={tooltipId} role="tooltip" side="top" align="center" gap={6} width={590} onClose={() => setOpen(false)}
      className="rounded-md bg-[#202431] px-4 py-3 text-left text-sm font-medium leading-7 text-white shadow-xl">
      <p className="font-bold">未投放-包含状态：</p>
      {PENDING_STATUS_RULES.map(rule => <p key={rule}>{rule}</p>)}
    </AnchoredPopover>}
  </>;
}

export default function DeliveryStatusReportView({ showToast }: DeliveryStatusReportViewProps) {
  const report = useReportData();
  const [activePlatform, setActivePlatform] = useState<Platform>("巨量广告");
  const [activeDimension, setActiveDimension] = useState<DeliveryDimension>("team");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [advertiserAccountId, setAdvertiserAccountId] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(REPORT_START);
  const [endDate, setEndDate] = useState(REPORT_TODAY);
  const [appliedFilters, setAppliedFilters] = useState<DeliveryFilters | null>(null);
  const [activeMetricFilter, setActiveMetricFilter] = useState<MetricFilter>("搭建计划总数");
  const [chartExpanded, setChartExpanded] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [columnOrder, setColumnOrder] = useState<string[]>(STATUS_COLUMNS.map(column => column.key));
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: DeliveryStatusKey; direction: "asc" | "desc" } | null>(null);
  const chartId = useId();

  const entityOptions = useMemo(() => deliveryEntityOptions(report.tree, activeDimension), [report.tree, activeDimension]);
  const categoryOptions = useMemo(() => deliveryCategoryOptions(report.categories), [report.categories]);
  const result = useMemo(() => buildDeliveryReport(report.facts, appliedFilters, entityOptions), [report.facts, appliedFilters, entityOptions]);
  const chartData = useMemo(() => deliveryChartData(result.rows, result.dates, METRIC_KEYS[activeMetricFilter]), [result, activeMetricFilter]);
  const allRows = useMemo(() => sort ? [...result.rows].sort((a, b) => (a[sort.key] - b[sort.key]) * (sort.direction === "asc" ? 1 : -1)) : result.rows, [result, sort]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(allRows.length / pageSize)));
  const pageRows = allRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasData = allRows.length > 0;
  const advertiser = activeDimension === "advertiser_detail";
  const dimensionLabel = activeDimension === "team" ? "部门" : activeDimension === "group" ? "分组" : "个人";
  const levels = activeDimension === "team" ? ["部门"] : activeDimension === "group" ? ["部门", "分组"] : ["部门", "分组", "个人"];
  const orderedColumns = columnOrder.map(key => STATUS_COLUMNS.find(column => column.key === key)!);
  const visibleColumns = orderedColumns.filter(column => !hiddenColumns.has(column.key));

  const clearCriteria = (resetDates: boolean) => {
    setSelectedEntities([]);
    setAdvertiserAccountId("");
    setSelectedCategories([]);
    setAppliedFilters(null);
    setActiveMetricFilter("搭建计划总数");
    setChartExpanded(true);
    setPage(1);
    if (resetDates) { setStartDate(REPORT_START); setEndDate(REPORT_TODAY); }
  };
  const changePlatform = (platform: Platform) => {
    if (platform === activePlatform) return;
    setActivePlatform(platform);
    clearCriteria(false);
    showToast?.("切换广告平台", `已切换至【${platform}】，请重新选择筛选条件`);
  };
  const changeDimension = (dimension: DeliveryDimension) => {
    if (dimension === activeDimension) return;
    setActiveDimension(dimension);
    clearCriteria(false);
  };
  const handleQuery = () => {
    if (!startDate || !endDate || startDate > endDate) {
      showToast?.("查询失败", "请选择有效的计划搭建时间范围");
      return;
    }
    if (advertiser ? !advertiserAccountId.trim() && !selectedCategories.length : !selectedEntities.length) {
      setAppliedFilters(null);
      setPage(1);
      showToast?.("请选择筛选条件", advertiser ? "请输入广告账户 ID 或选择二级分类" : `请至少选择一个${dimensionLabel}`);
      return;
    }
    setAppliedFilters({ platform: activePlatform, dimension: activeDimension, selectedEntities: [...selectedEntities],
      advertiserAccountId: advertiserAccountId.trim(), categories: [...selectedCategories], startDate, endDate });
    setPage(1);
    setChartExpanded(true);
    showToast?.("查询成功", "折线图和数据分析已按当前条件更新");
  };

  return <div className="min-w-0 rounded-module bg-white">
    <div className="flex items-center gap-8 overflow-x-auto border-b border-slate-100 px-6 py-4">
      {(["巨量广告", "巨量千川"] as Platform[]).map(platform => <button key={platform} type="button" onClick={() => changePlatform(platform)}
        className={`relative flex shrink-0 items-center gap-2 pb-1 text-sm font-bold ${activePlatform === platform ? "text-purple-600" : "text-slate-500 hover:text-slate-800"}`}>
        {platform === "巨量广告" ? <span className="h-3 w-3 rounded-xs bg-purple-600" /> : <BarChart2 className="h-4 w-4" />}{platform}
        {activePlatform === platform && <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-purple-600" />}
      </button>)}
    </div>

    <div className="overflow-x-auto px-6 pt-5">
      <div className="inline-flex gap-1 whitespace-nowrap rounded-full bg-slate-100/80 p-1">
        {DIMENSION_TABS.map(tab => <button key={tab.id} type="button" aria-pressed={activeDimension === tab.id} onClick={() => changeDimension(tab.id)}
          className={`shrink-0 rounded-full px-5 py-1.5 text-sm ${activeDimension === tab.id ? "bg-white font-semibold text-purple-600" : "text-slate-700 hover:text-purple-600"}`}>{tab.label}</button>)}
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3 px-6 py-5">
      {!advertiser && <ReportMultiSelect key={`${activePlatform}-${activeDimension}`} label={dimensionLabel} levels={levels} options={entityOptions} values={selectedEntities} onChange={setSelectedEntities} />}
      {advertiser && <>
        <label className="flex h-10 w-[280px] max-w-full items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-purple-500">
          <span className="shrink-0 text-sm text-slate-900">广告账户 ID</span>
          <input type="text" aria-label="广告账户 ID" placeholder="请输入广告账户 ID" value={advertiserAccountId} onChange={event => setAdvertiserAccountId(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        </label>
        <ReportMultiSelect key={activePlatform} label="分类" levels={["一级分类", "二级分类"]} options={categoryOptions} values={selectedCategories} onChange={setSelectedCategories} />
      </>}
      <div className="flex min-h-10 max-w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900">
        <span className="flex shrink-0 items-center gap-1">计划搭建时间<HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
        <input type="date" aria-label="计划搭建开始时间" value={startDate} onChange={event => setStartDate(event.target.value)} className="w-[118px] min-w-0 bg-transparent text-xs outline-none" />
        <span className="text-slate-500">至</span>
        <input type="date" aria-label="计划搭建结束时间" value={endDate} onChange={event => setEndDate(event.target.value)} className="w-[118px] min-w-0 bg-transparent text-xs outline-none" />
      </div>
      <button type="button" onClick={handleQuery} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-700"><Search className="h-4 w-4" />查询</button>
      <button type="button" onClick={() => { clearCriteria(true); showToast?.("重置成功", "已恢复默认日期并清空查询数据"); }} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"><RotateCcw className="h-4 w-4" />重置</button>
    </div>

    <section aria-label="投放分析" className="px-6 pb-6 pt-2">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-900">投放分析</h3>
        <button type="button" onClick={() => setChartExpanded(value => !value)} aria-expanded={chartExpanded} aria-controls={chartId} className="inline-flex items-center gap-1 text-sm text-purple-600">
          {chartExpanded ? "收起" : "展开"}<ChevronUp className={`h-4 w-4 ${chartExpanded ? "" : "rotate-180"}`} />
        </button>
      </div>
      {chartExpanded && <div id={chartId}>
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-slate-100/80 p-1">
          {(Object.keys(METRIC_KEYS) as MetricFilter[]).map(metric => <button key={metric} type="button" aria-pressed={activeMetricFilter === metric} onClick={() => setActiveMetricFilter(metric)}
            className={`shrink-0 whitespace-nowrap rounded-full px-5 py-1.5 text-sm ${activeMetricFilter === metric ? "bg-white text-purple-600" : "text-slate-700 hover:text-purple-600"}`}>{metric}</button>)}
        </div>
        <div data-testid="delivery-status-legend" className="my-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-700">
          {result.rows.map((row, index) => <div key={row.id} className="flex max-w-full items-center gap-2">
            <span className="flex h-4 w-6 shrink-0 items-center justify-center" style={{ color: REPORT_COLORS[index % REPORT_COLORS.length] }}><span className="h-0.5 w-1 bg-current" /><span className="h-3 w-3 rounded-full border-2 border-current bg-white" /><span className="h-0.5 w-1 bg-current" /></span>
            <span className="max-w-[300px] break-words">{row.legendName}</span>
          </div>)}
        </div>
        <div data-testid="delivery-status-chart" className="h-[300px] w-full min-w-0 sm:h-[380px]">
          {hasData ? <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid vertical={false} stroke="var(--border-color-slate-200)" />
              <XAxis dataKey="date" minTickGap={32} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, (maximum: number) => Math.max(1, maximum)]} allowDecimals={false} width={36} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-color-slate-200)", fontSize: "12px" }} />
              {result.rows.map((row, index) => <Line key={row.id} name={row.legendName} type="linear" dataKey={`series${index}`} stroke={REPORT_COLORS[index % REPORT_COLORS.length]} strokeWidth={2}
                isAnimationActive={false} dot={{ r: 2, fill: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 4 }} />)}
            </LineChart>
          </ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">暂无数据</div>}
        </div>
      </div>}
    </section>

    <section aria-label="数据分析" className="px-6 pb-4">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-900">数据分析</h3>
        <ColumnSettingsControl columns={orderedColumns} hiddenKeys={hiddenColumns}
          onToggle={key => setHiddenColumns(previous => { const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next; })}
          onMove={(source, target) => setColumnOrder(previous => { const next = previous.filter(key => key !== source); next.splice(previous.indexOf(target), 0, source); return next; })}
          onReset={() => { setColumnOrder(STATUS_COLUMNS.map(column => column.key)); setHiddenColumns(new Set()); }} />
      </div>
      <div className="max-h-[480px] overflow-auto border-b border-slate-100">
        <table data-testid="delivery-status-table" className={`w-full border-collapse text-center text-xs ${advertiser ? "min-w-[1450px]" : "min-w-[800px]"}`}>
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr>
            {(advertiser ? ["广告账户", "部门", "分组", "用户", "一级分类", "二级分类", "绑定直播间"] : [dimensionLabel]).map(label => <th key={label} className="px-4 py-4 font-semibold">{label}</th>)}
            {visibleColumns.map(column => <th key={column.key} aria-sort={sort?.key === column.key ? sort.direction === "asc" ? "ascending" : "descending" : "none"} className="px-4 py-4 font-semibold">
              <span className="inline-flex items-center justify-center gap-1">
                <button type="button" aria-label={`按${column.label}排序`} onClick={() => { setSort({ key: column.key, direction: sort?.key === column.key && sort.direction === "desc" ? "asc" : "desc" }); setPage(1); }} className="inline-flex items-center justify-center gap-1 hover:text-purple-600">
                  {column.label}{sort?.key === column.key ? sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5 shrink-0" /> : <ArrowDown className="h-3.5 w-3.5 shrink-0" /> : <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                </button>
                {column.key === "pending" && <PendingStatusHelp />}
              </span>
            </th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100 text-slate-900">
            {hasData && <tr className="font-semibold">
              <td className="px-4 py-4">总计</td>
              {advertiser && ["", "", "", "", "", "/"].map((value, index) => <td key={index} className="px-4 py-4">{value}</td>)}
              {visibleColumns.map(column => <td key={column.key} className="px-4 py-4 tabular-nums">{result.totals[column.key]}</td>)}
            </tr>}
            {hasData && pageRows.map(row => <tr key={row.id} className="hover:bg-slate-50">
              {advertiser ? <>
                <td className="max-w-[250px] break-words px-4 py-4"><span className="block font-semibold">{row.accountName}</span><span className="mt-1 block font-mono text-[11px]">{row.accountId}</span></td>
                {[row.team, row.group, row.user, row.cat1, row.cat2, row.liveRoom].map((value, index) => <td key={index} className="px-4 py-4">{value || "未绑定"}</td>)}
              </> : <td title={row.id} className="px-4 py-4 font-medium">{row.legendName}</td>}
              {visibleColumns.map(column => <td key={column.key} className="px-4 py-4 tabular-nums">{row[column.key]}</td>)}
            </tr>)}
            {!hasData && <tr><td colSpan={(advertiser ? 7 : 1) + visibleColumns.length} className="h-32 px-4 text-center text-sm text-slate-400">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>
      {hasData && <AssetPagination total={allRows.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} bordered={false} />}
    </section>
  </div>;
}
