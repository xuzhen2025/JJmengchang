import { useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  BarChart2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  REPORT_COLORS,
  REPORT_START,
  REPORT_TODAY,
  reportRows,
  selectReportFacts,
  statusTotals,
} from "../lib/reportDemoData";
import { useReportData } from "../lib/useReportData";
import AnchoredPopover from "./overlays/AnchoredPopover";
import ReportCategoryFilter from "./ReportCategoryFilter";

interface DeliveryStatusReportViewProps {
  showToast?: (title: string, desc: string) => void;
}

type Dimension = "team" | "group" | "personal" | "advertiser_detail";
type Platform = "巨量广告" | "巨量千川";
type MetricFilter = "搭建计划总数" | "投放中" | "未投放";

interface MultiSelectOption {
  value: string;
  label: string;
  meta?: string;
}

interface AppliedFilters {
  platform: Platform;
  dimension: Dimension;
  selectedEntities: string[];
  advertiserAccountId: string;
  category: string;
  startDate: string;
  endDate: string;
}

const PLATFORM_TABS: { id: Platform; label: string }[] = [
  { id: "巨量广告", label: "巨量广告" },
  { id: "巨量千川", label: "巨量千川" },
];

const DIMENSION_TABS: { id: Dimension; label: string }[] = [
  { id: "team", label: "部门数据" },
  { id: "group", label: "分组数据" },
  { id: "personal", label: "个人数据" },
  { id: "advertiser_detail", label: "广告主明细数据" },
];

const METRIC_KEYS: Record<MetricFilter, "total" | "delivering" | "pending"> = {
  搭建计划总数: "total",
  投放中: "delivering",
  未投放: "pending",
};

const PENDING_STATUS_RULES = [
  "审核不通过、新建审核中、修改审核中、已暂停、配额达限、未到投放时间",
  "项目已暂停、不在投放时段、未达投放时间、账户余额不足、账户超出预算",
  "预算组超出预算、项目超出预算、广告超出预算、直播间不可投放",
  "产品不可投放、抖音号不可投放、锚点不可投放",
];

function MultiSelectFilter({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);
  const selectedOptions = options.filter(option => values.includes(option.value));
  const filteredOptions = options.filter(option => `${option.label} ${option.meta || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const first = selectedOptions[0];

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  return <div className="relative">
    <button
      ref={anchorRef}
      type="button"
      aria-label={`${label}筛选`}
      aria-expanded={open}
      onClick={() => open ? close() : setOpen(true)}
      className={`flex h-9 w-[190px] items-center gap-2 rounded-lg border bg-white px-3 text-left text-xs shadow-2xs transition-colors ${open ? "border-purple-500 ring-2 ring-purple-100" : "border-slate-200 hover:border-purple-300"}`}
    >
      <span className="shrink-0 font-bold text-slate-700">{label}</span>
      {first ? <>
        <span title={first.label} className="min-w-0 truncate rounded bg-purple-50 px-2 py-1 font-semibold text-purple-600">{first.label}</span>
        {selectedOptions.length > 1 && <span className="shrink-0 rounded bg-slate-100 px-2 py-1 font-bold text-slate-600">+{selectedOptions.length - 1}</span>}
      </> : <span className="min-w-0 flex-1 truncate text-slate-400">请选择{label}</span>}
      <ChevronDown className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>

    {open && <AnchoredPopover
      anchorRef={anchorRef}
      onClose={close}
      width={320}
      maxHeight={360}
      className="rounded-lg border border-slate-200 bg-white shadow-2xl"
    >
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            type="search"
            aria-label={`搜索${label}`}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={`搜索${label}`}
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {filteredOptions.map(option => {
          const checked = values.includes(option.value);
          return <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-xs transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 accent-purple-600"
            />
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${checked ? "font-bold text-purple-600" : "font-medium text-slate-700"}`}>{option.label}</span>
              {option.meta && <span className="mt-0.5 block truncate text-[10px] text-slate-400">{option.meta}</span>}
            </span>
            {checked && <Check className="h-4 w-4 shrink-0 text-purple-600" />}
          </label>;
        })}
        {!filteredOptions.length && <div className="px-3 py-8 text-center text-xs text-slate-400">暂无匹配选项</div>}
      </div>
    </AnchoredPopover>}
  </div>;
}

function PendingStatusHelp() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return <>
    <button
      ref={anchorRef}
      type="button"
      aria-label="查看未投放状态说明"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="inline-flex text-slate-400 hover:text-purple-600 focus:outline-none"
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </button>
    {open && <AnchoredPopover
      anchorRef={anchorRef}
      side="top"
      align="center"
      gap={6}
      width={560}
      onClose={() => setOpen(false)}
      className="pointer-events-none rounded-md bg-slate-900 px-4 py-3 text-left text-xs font-medium leading-6 text-white shadow-xl"
    >
      <p className="font-bold">未投放-包含状态：</p>
      {PENDING_STATUS_RULES.map(rule => <p key={rule}>{rule}</p>)}
    </AnchoredPopover>}
  </>;
}

function SortableHeading({ children, help = false }: { children: string; help?: boolean }) {
  return <div className="inline-flex items-center justify-center gap-1">
    <span>{children}</span>
    {help && <PendingStatusHelp />}
    <ArrowUpDown className="h-3 w-3 text-slate-400" />
  </div>;
}

export default function DeliveryStatusReportView({ showToast }: DeliveryStatusReportViewProps) {
  const report = useReportData();
  const [activePlatform, setActivePlatform] = useState<Platform>("巨量广告");
  const [activeDimension, setActiveDimension] = useState<Dimension>("team");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [advertiserAccountId, setAdvertiserAccountId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState(REPORT_START);
  const [endDate, setEndDate] = useState(REPORT_TODAY);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
  const [activeMetricFilter, setActiveMetricFilter] = useState<MetricFilter>("搭建计划总数");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [pageInput, setPageInput] = useState("1");

  const entityOptions = useMemo<MultiSelectOption[]>(() => {
    if (activeDimension === "team") {
      return report.tree.map(team => ({ value: team.teamName, label: team.teamName }));
    }
    if (activeDimension === "group") {
      return report.tree.flatMap(team => team.groups.map(group => ({
        value: `${team.teamName} / ${group.groupName}`,
        label: group.groupName,
        meta: team.teamName,
      })));
    }
    if (activeDimension === "personal") {
      return report.tree.flatMap(team => team.groups.flatMap(group => group.accounts.map(person => ({
        value: `${team.teamName} / ${group.groupName} / ${person}`,
        label: person,
        meta: `${team.teamName} / ${group.groupName}`,
      }))));
    }
    return [];
  }, [activeDimension, report.tree]);

  const selectedFacts = useMemo(() => {
    if (!appliedFilters) return [];
    const facts = selectReportFacts(report.facts, appliedFilters.platform, {
      accountId: appliedFilters.advertiserAccountId,
      category: appliedFilters.category,
    }).filter(row => row.planCreatedAt >= appliedFilters.startDate && row.planCreatedAt <= appliedFilters.endDate);

    if (appliedFilters.dimension === "team") {
      return facts.filter(row => appliedFilters.selectedEntities.includes(row.department));
    }
    if (appliedFilters.dimension === "group") {
      return facts.filter(row => appliedFilters.selectedEntities.includes(`${row.department} / ${row.group}`));
    }
    if (appliedFilters.dimension === "personal") {
      return facts.filter(row => appliedFilters.selectedEntities.includes(`${row.department} / ${row.group} / ${row.person}`));
    }
    return facts;
  }, [appliedFilters, report.facts]);

  const buildRows = (dimension: string) => reportRows(selectedFacts, dimension).map(row => ({ ...row, ...statusTotals(row.facts) }));
  const teamRows = buildRows("team");
  const groupRows = buildRows("group");
  const personalRows = buildRows("personal");
  const advertiserRows = buildRows("account");
  const allRows = activeDimension === "team" ? teamRows : activeDimension === "group" ? groupRows : activeDimension === "personal" ? personalRows : advertiserRows;
  const totals = statusTotals(selectedFacts);
  const chartGroups = buildRows(activeDimension);
  const metricKey = METRIC_KEYS[activeMetricFilter];
  const chartData = [...new Set(selectedFacts.map(row => row.planCreatedAt))].sort().map(date => ({
    date,
    ...Object.fromEntries(chartGroups.map(group => [group.id, statusTotals(group.facts.filter(row => row.planCreatedAt === date))[metricKey]])),
  }));
  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = allRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasData = Boolean(appliedFilters && allRows.length);

  const dimensionLabel = activeDimension === "team" ? "部门" : activeDimension === "group" ? "分组" : "个人";

  const clearCriteria = (resetDates: boolean) => {
    setSelectedEntities([]);
    setAdvertiserAccountId("");
    setSelectedCategory("");
    setAppliedFilters(null);
    setActiveMetricFilter("搭建计划总数");
    setPage(1);
    setPageInput("1");
    if (resetDates) {
      setStartDate(REPORT_START);
      setEndDate(REPORT_TODAY);
    }
  };

  const changePlatform = (platform: Platform) => {
    if (platform === activePlatform) return;
    setActivePlatform(platform);
    clearCriteria(false);
    showToast?.("切换广告平台", `已切换至【${platform}】，请重新选择筛选条件`);
  };

  const changeDimension = (dimension: Dimension, label: string) => {
    if (dimension === activeDimension) return;
    setActiveDimension(dimension);
    clearCriteria(false);
    showToast?.("切换分析维度", `已切换至【${label}】，请重新选择筛选条件`);
  };

  const handleQuery = () => {
    if (!startDate || !endDate || startDate > endDate) {
      showToast?.("查询失败", "请选择有效的计划搭建时间范围");
      return;
    }
    const hasCriteria = activeDimension === "advertiser_detail"
      ? Boolean(advertiserAccountId.trim() || selectedCategory.includes(" / "))
      : selectedEntities.length > 0;
    if (!hasCriteria) {
      setAppliedFilters(null);
      setPage(1);
      setPageInput("1");
      showToast?.("请选择筛选条件", activeDimension === "advertiser_detail" ? "请输入广告账户 ID 或选择二级分类" : `请至少选择一个${dimensionLabel}`);
      return;
    }
    setAppliedFilters({
      platform: activePlatform,
      dimension: activeDimension,
      selectedEntities: [...selectedEntities],
      advertiserAccountId: advertiserAccountId.trim(),
      category: selectedCategory,
      startDate,
      endDate,
    });
    setPage(1);
    setPageInput("1");
    showToast?.("查询成功", "折线图和详细数据已按当前条件更新");
  };

  const handleReset = () => {
    clearCriteria(true);
    showToast?.("重置成功", "已恢复默认日期并清空查询数据");
  };

  const goToPage = (nextPage: number) => {
    const target = Math.min(totalPages, Math.max(1, nextPage));
    setPage(target);
    setPageInput(String(target));
  };

  return <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
    <div className="flex items-center gap-8 overflow-x-auto border-b border-slate-100 px-6 py-3.5">
      {PLATFORM_TABS.map(tab => <button
        key={tab.id}
        type="button"
        onClick={() => changePlatform(tab.id)}
        className={`relative flex shrink-0 items-center gap-2 pb-1 text-sm font-bold transition-colors ${activePlatform === tab.id ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"}`}
      >
        {tab.id === "巨量广告" ? <span className="h-3 w-3 rounded-xs bg-[#7C3AED]" /> : <BarChart2 className="h-4 w-4 text-blue-500" />}
        {tab.label}
        {activePlatform === tab.id && <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 rounded-full bg-[#7C3AED]" />}
      </button>)}
    </div>

    <div className="flex items-center gap-8 overflow-x-auto border-b border-slate-100 px-6 pt-3.5">
      {DIMENSION_TABS.map(tab => <button
        key={tab.id}
        type="button"
        onClick={() => changeDimension(tab.id, tab.label)}
        className={`relative shrink-0 pb-3 text-sm font-bold transition-colors ${activeDimension === tab.id ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"}`}
      >
        {tab.label}
        {activeDimension === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#7C3AED]" />}
      </button>)}
    </div>

    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/50 p-4">
      {activeDimension !== "advertiser_detail" && <MultiSelectFilter
        label={dimensionLabel}
        options={entityOptions}
        values={selectedEntities}
        onChange={setSelectedEntities}
      />}

      {activeDimension === "advertiser_detail" && <>
        <input
          type="text"
          aria-label="广告账户 ID"
          placeholder="请输入广告账户 ID"
          value={advertiserAccountId}
          onChange={event => setAdvertiserAccountId(event.target.value)}
          className="h-9 min-w-[190px] rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-2xs outline-none placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
        />
        <ReportCategoryFilter categories={report.categories} value={selectedCategory} onChange={setSelectedCategory} />
      </>}

      <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-2xs">
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500">
          计划搭建时间
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
        </span>
        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input type="date" aria-label="计划搭建开始时间" value={startDate} onChange={event => setStartDate(event.target.value)} className="w-24 bg-transparent text-xs font-medium text-slate-700 outline-none" />
        <span className="text-xs text-slate-400">至</span>
        <input type="date" aria-label="计划搭建结束时间" value={endDate} onChange={event => setEndDate(event.target.value)} className="w-24 bg-transparent text-xs font-medium text-slate-700 outline-none" />
      </div>

      <button type="button" onClick={handleQuery} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-purple-700">
        <Search className="h-3.5 w-3.5" />查询
      </button>
      <button type="button" onClick={handleReset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900">
        <RotateCcw className="h-3.5 w-3.5" />重置
      </button>
    </div>

    <div className="space-y-4 border-b border-slate-100 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-0.5">
          {(["搭建计划总数", "投放中", "未投放"] as MetricFilter[]).map(metric => <button
            key={metric}
            type="button"
            onClick={() => setActiveMetricFilter(metric)}
            className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${activeMetricFilter === metric ? "bg-[#7C3AED] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
          >{metric}</button>)}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
          {chartGroups.map((group, index) => <div key={group.id} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2 bg-white" style={{ borderColor: REPORT_COLORS[index % REPORT_COLORS.length] }} />
            <span>{group.name}</span>
          </div>)}
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        {hasData ? <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
            {chartGroups.map((group, index) => <Line key={group.id} name={group.name} type="monotone" dataKey={group.id} stroke={REPORT_COLORS[index % REPORT_COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: REPORT_COLORS[index % REPORT_COLORS.length] }} />)}
          </LineChart>
        </ResponsiveContainer> : <div className="flex h-full items-center justify-center text-xs text-slate-400">暂无数据</div>}
      </div>
    </div>

    <div className="bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-black text-slate-800">详细数据</div>
        <button
          type="button"
          title="列设置"
          aria-label="列设置"
          onClick={() => showToast?.("表格列配置", "您可以按需显示或隐藏详细数据指标列")}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-2xs hover:text-slate-800"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[480px] overflow-auto border-y border-slate-100">
        <table data-testid="delivery-status-table" className={`w-full border-collapse text-left text-xs ${activeDimension === "advertiser_detail" ? "min-w-[1450px]" : "min-w-[900px]"}`}>
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-slate-500">
            {activeDimension !== "advertiser_detail" ? <tr>
              <th className="px-4 py-3 font-bold">{dimensionLabel}</th>
              {["搭建计划总数", "投放中", "未投放", "已终止", "已完成", "已删除"].map(header => <th key={header} className="px-4 py-3 text-center font-bold"><SortableHeading help={header === "未投放"}>{header}</SortableHeading></th>)}
            </tr> : <tr>
              {["广告账户", "部门", "分组", "用户", "一级分类", "二级分类", "绑定直播间"].map(header => <th key={header} className="px-4 py-3 font-bold">{header}</th>)}
              {["搭建计划总数", "投放中", "未投放", "已终止", "已完成", "已删除"].map(header => <th key={header} className="px-4 py-3 text-center font-bold"><SortableHeading help={header === "未投放"}>{header}</SortableHeading></th>)}
            </tr>}
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {hasData && <tr className="bg-purple-50/30 font-bold text-slate-900">
              <td className="px-4 py-3 font-black">总计</td>
              {activeDimension === "advertiser_detail" && <>
                <td className="px-4 py-3 text-slate-400">-</td>
                <td className="px-4 py-3 text-slate-400">-</td>
                <td className="px-4 py-3 text-slate-400">-</td>
                <td className="px-4 py-3 text-slate-400">-</td>
                <td className="px-4 py-3 text-slate-400">-</td>
                <td className="px-4 py-3 text-slate-400">/</td>
              </>}
              <td className="px-4 py-3 text-center font-bold">{totals.total}</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-600">{totals.delivering}</td>
              <td className="px-4 py-3 text-center">{totals.pending}</td>
              <td className="px-4 py-3 text-center">{totals.terminated}</td>
              <td className="px-4 py-3 text-center">{totals.finished}</td>
              <td className="px-4 py-3 text-center text-slate-500">{totals.deleted}</td>
            </tr>}

            {hasData && activeDimension !== "advertiser_detail" && pageRows.map(row => <tr key={row.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-900">{row.name}</td>
              <td className="px-4 py-3 text-center font-bold">{row.total}</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-600">{row.delivering}</td>
              <td className="px-4 py-3 text-center">{row.pending}</td>
              <td className="px-4 py-3 text-center">{row.terminated}</td>
              <td className="px-4 py-3 text-center">{row.finished}</td>
              <td className="px-4 py-3 text-center text-slate-500">{row.deleted}</td>
            </tr>)}

            {hasData && activeDimension === "advertiser_detail" && pageRows.map(row => <tr key={row.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="block font-bold text-slate-900">{row.accountName}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-slate-500">{row.accountId}</span>
              </td>
              <td className="px-4 py-3">{row.team}</td>
              <td className="px-4 py-3">{row.group}</td>
              <td className="px-4 py-3">{row.user}</td>
              <td className="px-4 py-3">{row.cat1}</td>
              <td className="px-4 py-3">{row.cat2}</td>
              <td className="px-4 py-3">{row.liveRoom}</td>
              <td className="px-4 py-3 text-center font-bold">{row.total}</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-600">{row.delivering}</td>
              <td className="px-4 py-3 text-center">{row.pending}</td>
              <td className="px-4 py-3 text-center">{row.terminated}</td>
              <td className="px-4 py-3 text-center">{row.finished}</td>
              <td className="px-4 py-3 text-center text-slate-500">{row.deleted}</td>
            </tr>)}

            {!hasData && <tr>
              <td colSpan={activeDimension === "advertiser_detail" ? 13 : 7} className="h-32 px-4 text-center text-xs text-slate-400">暂无数据</td>
            </tr>}
          </tbody>
        </table>
      </div>

      {hasData && <div className="flex flex-wrap items-center justify-end gap-3 px-2 py-3 text-xs text-slate-500">
        <span>共 {allRows.length} 条</span>
        <select
          aria-label="每页条数"
          value={pageSize}
          onChange={event => { setPageSize(Number(event.target.value)); goToPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-purple-500"
        >
          <option value={20}>20条/页</option>
          <option value={50}>50条/页</option>
          <option value={100}>100条/页</option>
        </select>
        <button type="button" title="上一页" aria-label="上一页" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" aria-current="page" className="h-7 min-w-7 rounded-lg bg-purple-600 px-2 text-xs font-bold text-white">{currentPage}</button>
        <button type="button" title="下一页" aria-label="下一页" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        <label className="flex items-center gap-1.5">前往
          <input
            aria-label="前往页码"
            value={pageInput}
            onChange={event => setPageInput(event.target.value.replace(/\D/g, ""))}
            onKeyDown={event => { if (event.key === "Enter") goToPage(Number(pageInput) || 1); }}
            onBlur={() => goToPage(Number(pageInput) || 1)}
            className="w-12 rounded-lg border border-slate-200 px-2 py-1 text-center outline-none focus:border-purple-500"
          /> 页
        </label>
      </div>}
    </div>
  </div>;
}
