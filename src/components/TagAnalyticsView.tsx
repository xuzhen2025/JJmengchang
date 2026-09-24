import React, { useMemo, useState } from "react";
import { useReportData } from "../lib/useReportData";
import ReportCategoryFilter from "./ReportCategoryFilter";
import ColumnSettingsControl from "./ColumnSettingsControl";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import { grouped, ratio } from "../lib/analyticsData";
import { applicablePublicTagGroups } from "../lib/resourceTags";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import { REPORT_START, REPORT_TODAY, REPORT_COLORS, fmt, money, percent, selectReportFacts, reportTotals, tagReportRow } from "../lib/reportDemoData";
import {
  Calendar,
  ChevronDown,
  HelpCircle,
  ArrowUpDown,
  RotateCcw,
  Search,
  PieChart as PieChartIcon
} from "lucide-react";

interface TagAnalyticsViewProps {
  showToast?: (title: string, desc: string) => void;
}

type TagDetailRow = ReturnType<typeof tagReportRow>;
type TagDetailKey = Exclude<keyof TagDetailRow, "name">;

interface TagDetailColumn {
  key: TagDetailKey;
  label: string;
  help?: boolean;
  totalClass?: string;
  rowClass?: string;
}

const TAG_DETAIL_COLUMNS: TagDetailColumn[] = [
  { key: "videoCount", label: "视频数量", totalClass: "font-extrabold text-slate-900", rowClass: "font-bold text-slate-800" },
  { key: "spend", label: "消耗", totalClass: "font-black text-[#7C3AED]", rowClass: "font-bold text-slate-900" },
  { key: "roi", label: "roi", totalClass: "font-bold text-emerald-600", rowClass: "font-bold text-emerald-600" },
  { key: "salesAmount", label: "成交金额", totalClass: "font-extrabold text-slate-900", rowClass: "font-bold text-slate-800" },
  { key: "coupons", label: "智能优惠券", totalClass: "font-bold text-slate-700", rowClass: "text-slate-600" },
  { key: "subsidy", label: "电商平台补贴金额", totalClass: "font-bold text-slate-700", rowClass: "text-slate-600" },
  { key: "conversions", label: "转化数", totalClass: "font-extrabold text-slate-900", rowClass: "font-bold text-slate-800" },
  { key: "cvr", label: "转化率", totalClass: "font-bold text-indigo-600", rowClass: "font-bold text-indigo-600" },
  { key: "cpa", label: "转化成本", totalClass: "font-bold text-slate-900", rowClass: "text-slate-800" },
  { key: "impressions", label: "展示数", totalClass: "font-bold text-slate-800", rowClass: "text-slate-600" },
  { key: "cpm", label: "平均千次展现费用", help: true, totalClass: "font-bold text-slate-800", rowClass: "text-slate-600" },
  { key: "clicks", label: "点击数", totalClass: "font-bold text-slate-800", rowClass: "text-slate-600" },
  { key: "ctr", label: "点击率", totalClass: "font-bold text-emerald-600", rowClass: "text-slate-600" },
  { key: "cpc", label: "平均点击单价", totalClass: "font-bold text-slate-800", rowClass: "text-slate-600" },
  { key: "views", label: "播放量", totalClass: "font-bold text-slate-800", rowClass: "text-slate-600" },
  { key: "finishRate3s", label: "3S完播率", help: true, totalClass: "font-bold text-indigo-600", rowClass: "font-bold text-indigo-600" },
  { key: "netSales", label: "净成交金额", totalClass: "font-black text-slate-900", rowClass: "font-bold text-slate-900" },
  { key: "netOrders", label: "净成交订单数", totalClass: "font-bold text-slate-900", rowClass: "text-slate-800" },
  { key: "netRoi", label: "净成交ROI", totalClass: "font-bold text-emerald-600", rowClass: "font-bold text-emerald-600" },
  { key: "netCpa", label: "净成交订单成本", totalClass: "font-bold text-slate-900", rowClass: "text-slate-800" },
];

const detailCellValue = (row: TagDetailRow, key: TagDetailKey) => {
  const value = row[key];
  return typeof value === "number" ? value.toLocaleString() : value;
};

export default function TagAnalyticsView({ showToast }: TagAnalyticsViewProps) {
  // Platform sub-selector: 抖音 | 腾讯 | TikTok
  const [platform, setPlatform] = useState<"douyin" | "tencent" | "tiktok">("douyin");

  // Dropdown Selectors
  const [selectCategory, setSelectCategory] = useState("");
  const [selectTag, setSelectTag] = useState("");
  const [uploadStartDate, setUploadStartDate] = useState("");
  const [uploadEndDate, setUploadEndDate] = useState("");
  const [spendStartDate, setSpendStartDate] = useState(REPORT_START);
  const [spendEndDate, setSpendEndDate] = useState(REPORT_TODAY);

  // Hover state for Donut Slices
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // Sorting state for Table
  const [sortField, setSortField] = useState<string>("spend");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const handleSort = (field: string) => { setSortAsc(sortField === field ? !sortAsc : false); setSortField(field); };
  const [hiddenDetailCols, setHiddenDetailCols] = useState<Set<string>>(new Set());
  const [detailColOrder, setDetailColOrder] = useState(() => TAG_DETAIL_COLUMNS.map(column => column.key));
  const [exportOpen, setExportOpen] = useState(false);
  const orderedDetailCols = useMemo(() => {
    const byKey = new Map(TAG_DETAIL_COLUMNS.map(column => [column.key, column]));
    const ordered = detailColOrder.flatMap(key => byKey.has(key) ? [byKey.get(key)!] : []);
    const known = new Set(ordered.map(column => column.key));
    return [...ordered, ...TAG_DETAIL_COLUMNS.filter(column => !known.has(column.key))];
  }, [detailColOrder]);
  const visibleDetailCols = orderedDetailCols.filter(column => !hiddenDetailCols.has(column.key));

  const toggleDetailCol = (key: string) => {
    setHiddenDetailCols(previous => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const moveDetailCol = (sourceKey: string, targetKey: string) => {
    setDetailColOrder(previous => {
      const current = orderedDetailCols.map(column => column.key);
      const sourceIndex = current.indexOf(sourceKey as TagDetailKey);
      const targetIndex = current.indexOf(targetKey as TagDetailKey);
      if (sourceIndex < 0 || targetIndex < 0) return previous;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const resetDetailCols = () => {
    setDetailColOrder(TAG_DETAIL_COLUMNS.map(column => column.key));
    setHiddenDetailCols(new Set());
  };

  const report = useReportData();
  const hasSelectedSecondaryCategory = selectCategory.split(" / ").length === 2;
  const availableTagGroups = useMemo(
    () => applicablePublicTagGroups(report.tags, report.categories, selectCategory),
    [report.tags, report.categories, selectCategory],
  );
  const [applied, setApplied] = useState({ start: REPORT_START, end: REPORT_TODAY, uploadStart: "", uploadEnd: "", category: "", tag: "" });
  const tagGroup = report.tags.find(group => group.subTags.some(tag => tag.id === applied.tag)) || report.tags[0];
  const selected = selectReportFacts(report.facts, platform === "douyin" ? "巨量千川" : platform === "tencent" ? "腾讯ADQ" : "TikTok", applied)
    .filter(row => !applied.tag || Object.values(row.tags).includes(applied.tag));
  const total = tagReportRow(selected, "总计");
  const TOTAL_SPEND = reportTotals(selected).spend;
  const groupedTags = grouped(selected, row => row.tags[tagGroup?.id] || "");
  const INITIAL_TABLE_ROWS = groupedTags.map(([id, rows]) => tagReportRow(rows, tagGroup?.subTags.find(tag => tag.id === id)?.name || "未打标签")).sort((a, b) => {
    const numeric = (value: unknown) => Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
    return (sortAsc ? 1 : -1) * (numeric(a[sortField]) - numeric(b[sortField]));
  });
  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const exportSelected = selectReportFacts(report.facts, platform === "douyin" ? "巨量千川" : platform === "tencent" ? "腾讯ADQ" : "TikTok", {
      ...applied,
      start: request.startDate,
      end: request.endDate,
    }).filter(row => !applied.tag || Object.values(row.tags).includes(applied.tag));
    const exportGroup = report.tags.find(group => group.subTags.some(tag => tag.id === applied.tag)) || report.tags[0];
    const exportRows = grouped(exportSelected, row => row.tags[exportGroup?.id] || "").map(([id, rows]) =>
      tagReportRow(rows, exportGroup?.subTags.find(tag => tag.id === id)?.name || "未打标签"));
    const exportTotal = tagReportRow(exportSelected, "总计");
    const cells = [
      ["模特姓名 / 标签", ...visibleDetailCols.map(column => column.label)],
      [exportTotal.name, ...visibleDetailCols.map(column => detailCellValue(exportTotal, column.key))],
      ...exportRows.map(row => [row.name, ...visibleDetailCols.map(column => detailCellValue(row, column.key))]),
    ];
    const fileName = await exportAnalyticsRows(cells, request, "标签分析");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };
  const DONUT_SLICES = groupedTags.map(([id, rows], i) => ({ name: tagGroup?.subTags.find(tag => tag.id === id)?.name || "未打标签",
    val: reportTotals(rows).spend, ratio: percent(ratio(reportTotals(rows).spend, TOTAL_SPEND) * 100), color: REPORT_COLORS[i % REPORT_COLORS.length] }));
  const handleQuery = () => {
    if (!spendStartDate || !spendEndDate || spendStartDate > spendEndDate || (uploadStartDate && uploadEndDate && uploadStartDate > uploadEndDate)) { showToast?.("查询失败", "请选择有效的日期范围"); return; }
    setApplied({start: spendStartDate, end: spendEndDate, uploadStart: uploadStartDate, uploadEnd: uploadEndDate, category: selectCategory, tag: selectTag});
    if (showToast) {
      showToast("查询成功", `已更新【${platform === "douyin" ? "抖音" : platform === "tencent" ? "腾讯" : "TikTok"}】包含所选标签与时间的数据分析`);
    }
  };

  const handleReset = () => {
    setSelectCategory("");
    setApplied({ start: REPORT_START, end: REPORT_TODAY, uploadStart: "", uploadEnd: "", category: "", tag: "" });
    setSelectTag("");
    setUploadStartDate("");
    setUploadEndDate("");
    setSpendStartDate(REPORT_START);
    setSpendEndDate(REPORT_TODAY);
    if (showToast) {
      showToast("已重置", "筛选条件已重置为默认值");
    }
  };

  // SVG Donut Path calculations
  let accumulatedAngle = 0;
  const pieSlices = DONUT_SLICES.map((item, idx) => {
    const angle = TOTAL_SPEND ? (item.val / TOTAL_SPEND) * 360 : 0;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle = endAngle;

    const cx = 150;
    const cy = 150;
    const r = 115;
    const innerR = 72; // Generous hole for big text in screenshot 2

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      `Z`,
    ].join(" ");

    // Mid angle for callout line anchor
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = ((midAngle - 90) * Math.PI) / 180;
    const labelX1 = cx + (r + 2) * Math.cos(midRad);
    const labelY1 = cy + (r + 2) * Math.sin(midRad);
    const labelX2 = cx + (r + 22) * Math.cos(midRad);
    const labelY2 = cy + (r + 22) * Math.sin(midRad);
    const isRightSide = Math.cos(midRad) >= 0;
    const labelX3 = isRightSide ? labelX2 + 20 : labelX2 - 20;

    return {
      ...item,
      pathData,
      startAngle,
      endAngle,
      midRad,
      labelX1,
      labelY1,
      labelX2,
      labelY2,
      labelX3,
      isRightSide,
    };
  });

  return (
    <div className="space-y-4">
      {/* Platform and filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Platform Selector Buttons (抖音 | 腾讯 | TikTok) */}
        <div className="p-4 bg-slate-50/40 space-y-3">
          <div className="flex items-center gap-1.5 border border-slate-200/90 rounded-lg p-0.5 bg-white inline-flex shadow-2xs">
            <button
              onClick={() => setPlatform("douyin")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                platform === "douyin"
                  ? "bg-[#7C3AED] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100/70"
              }`}
            >
              抖音
            </button>
            <button
              onClick={() => setPlatform("tencent")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                platform === "tencent"
                  ? "bg-[#7C3AED] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100/70"
              }`}
            >
              腾讯
            </button>
            <button
              onClick={() => setPlatform("tiktok")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                platform === "tiktok"
                  ? "bg-[#7C3AED] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100/70"
              }`}
            >
              TikTok
            </button>
          </div>

          {/* Filter Controls Bar (Dropdowns + Date Ranges) */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Select 1: Category Selector (一级分类 / 二级分类) */}
            <ReportCategoryFilter categories={report.categories} value={selectCategory}
              onChange={category => { setSelectCategory(category); setSelectTag(""); }} />

            {/* Select 2: Tag Selector */}
            <div className="relative">
              <select
                value={selectTag}
                onChange={(e) => setSelectTag(e.target.value)}
                disabled={!hasSelectedSecondaryCategory}
                aria-label="选择标签"
                title={!hasSelectedSecondaryCategory ? "请先选择二级分类" : undefined}
                className="pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer min-w-[170px] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">选择标签</option>
                {availableTagGroups.map(group => <optgroup key={group.id} label={group.name}>{group.subTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</optgroup>)}
              </select>
            </div>

            {/* Upload Time Range */}
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>上传时间:</span>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={uploadStartDate}
                  onChange={(e) => setUploadStartDate(e.target.value)}
                  placeholder="开始日期"
                  className="bg-transparent text-slate-700 outline-none w-24 cursor-pointer"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={uploadEndDate}
                  onChange={(e) => setUploadEndDate(e.target.value)}
                  placeholder="结束日期"
                  className="bg-transparent text-slate-700 outline-none w-24 cursor-pointer"
                />
              </div>
            </div>

            {/* Spend Time Range */}
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>消耗时间:</span>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={spendStartDate}
                  onChange={(e) => setSpendStartDate(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 outline-none w-26 cursor-pointer"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={spendEndDate}
                  onChange={(e) => setSpendEndDate(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 outline-none w-26 cursor-pointer"
                />
              </div>
            </div>

            {/* Buttons */}
            <button
              onClick={handleQuery}
              className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              查询
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. Proportion Donut Chart Section (Screenshot 2) ================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">占比分析</h3>
          </div>
          <span className="text-xs text-slate-400">数据汇总范围: {spendStartDate} ~ {spendEndDate}</span>
        </div>

        {/* Large Prominent Donut Chart Container */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-6">
          {/* SVG Donut with Callout Lines */}
          <div className="relative w-[360px] h-[360px] shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {/* Donut Slices */}
              {pieSlices.map((slice, idx) => (
                <g key={idx}>
                  <path
                    d={slice.pathData}
                    fill={slice.color}
                    className={`transition-all duration-300 cursor-pointer ${
                      hoveredSlice === idx ? "opacity-100 scale-105 origin-center stroke-2 stroke-white" : "opacity-90 hover:opacity-100"
                    }`}
                    onMouseEnter={() => setHoveredSlice(idx)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                </g>
              ))}
            </svg>

            {/* Center Big Number (as requested in Screenshot 2: 507441.37) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-bold text-slate-400">总消耗金额 (元)</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {TOTAL_SPEND.toFixed(2)}
              </span>
              <span className="text-[10px] text-purple-600 font-bold mt-0.5">多维对比看板</span>
            </div>
          </div>

          {/* Side Legend Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
            {pieSlices.map((slice, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredSlice(idx)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  hoveredSlice === idx
                    ? "bg-purple-50/80 border-purple-200 shadow-2xs scale-[1.02]"
                    : "bg-slate-50/50 border-slate-100 hover:bg-slate-100/60"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-xs shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-xs font-bold text-slate-800 truncate">{slice.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-slate-900">¥{slice.val.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{slice.ratio}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 3. Detailed Data Table Section (Screenshots 3, 4, 5) ================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Title Bar with Export button */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">详细数据</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportOpen(true)}
              aria-haspopup="dialog"
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>导出</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <ColumnSettingsControl
              columns={orderedDetailCols}
              hiddenKeys={hiddenDetailCols}
              onToggle={toggleDetailCol}
              onMove={moveDetailCol}
              onReset={resetDetailCols}
            />
          </div>
        </div>

        {/* Scrollable Data Table with Full Columns matching screenshots 3, 4, 5 */}
        <div className="overflow-x-auto">
          <table
            data-testid="tag-analytics-detail-table"
            className="w-full text-left border-collapse"
            style={{ minWidth: Math.max(520, 180 + visibleDetailCols.length * 120) }}
          >
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] whitespace-nowrap">
                <th className="py-3 px-4 font-bold sticky left-0 bg-slate-50 z-10 shadow-xs">模特姓名 / 标签</th>
                {visibleDetailCols.map(column => (
                  <th
                    key={column.key}
                    data-column-key={column.key}
                    onClick={() => handleSort(column.key)}
                    className="py-3 px-3.5 font-bold text-right cursor-pointer hover:text-slate-800"
                  >
                    <div className="inline-flex items-center gap-1">
                      {column.label}
                      {column.help && <HelpCircle className="w-3 h-3 text-slate-400" />}
                      <ArrowUpDown className={`w-3 h-3 ${sortField === column.key ? "text-purple-500" : "text-slate-400"}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {/* Total Row (第一行为“总计”) */}
              <tr className="bg-purple-50/60 border-b border-purple-100 text-slate-900 font-bold whitespace-nowrap">
                <td className="py-3.5 px-4 font-black text-slate-900 sticky left-0 bg-purple-50 z-10 shadow-xs">总计</td>
                {visibleDetailCols.map(column => (
                  <td key={column.key} className={`py-3.5 px-3.5 text-right ${column.totalClass || ""}`}>
                    {detailCellValue(total, column.key)}
                  </td>
                ))}
              </tr>

              {/* Data Rows */}
              {INITIAL_TABLE_ROWS.map(row => (
                <tr key={row.name} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                  <td className="py-3.5 px-4 font-bold text-[#7C3AED] sticky left-0 bg-white z-10 shadow-xs">
                    {row.name}
                  </td>
                  {visibleDetailCols.map(column => (
                    <td key={column.key} className={`py-3.5 px-3.5 text-right ${column.rowClass || ""}`}>
                      {detailCellValue(row, column.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AnalyticsExportDialog
        open={exportOpen}
        pageName="标签分析"
        filters={[
          { label: "平台", value: platform === "douyin" ? "抖音" : platform === "tencent" ? "腾讯" : "TikTok" },
          { label: "分类", value: applied.category },
          { label: "标签", value: report.tags.flatMap(group => group.subTags).find(tag => tag.id === applied.tag)?.name },
          { label: "上传时间", value: applied.uploadStart || applied.uploadEnd ? `${applied.uploadStart || "未设置"}至${applied.uploadEnd || "未设置"}` : "" },
        ]}
        startDate={applied.start}
        endDate={applied.end}
        onClose={() => setExportOpen(false)}
        onConfirm={handleExport}
      />
    </div>
  );
}
