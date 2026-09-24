import React, { useState } from "react";
import { useReportData } from "../lib/useReportData";
import ReportCategoryFilter from "./ReportCategoryFilter";
import { REPORT_START, REPORT_TODAY, fmt, reportTotals, qualityReport } from "../lib/reportDemoData";
import { PLATFORM_TAG_DIMENSIONS, platformTagGroupKey, platformTagTable, selectPlatformTagFacts, type PlatformTagDimension, type PlatformTagFilters } from "../lib/platformTagAnalytics";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import {
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Calendar,
  Sparkles,
  Award,
  AlertCircle,
  AlertTriangle,
  Layers,
  ShieldAlert,
  BarChart3,
  Compass,
  RotateCcw,
  Download
} from "lucide-react";

interface PlatformTagsViewProps {
  showToast?: (title: string, desc: string) => void;
}

const DEFAULT_FILTERS: PlatformTagFilters = { start: REPORT_START, end: REPORT_TODAY, category: "all", department: "", groupKey: "", memberId: "", subject: "" };
const selectClassName = "h-9 w-[216px] max-w-full pl-3 pr-8 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer";

// Color palette matching the reference donut chart
const MATERIAL_TYPE_META = [
  {
    id: "first_release",
    name: "首发素材",
    color: "#4F46E5", // Indigo / Blue
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    badgeColor: "bg-indigo-100 text-indigo-700",
    icon: Sparkles,
    count: 1280,
    countRatio: "28.5%",
    spend: 342800,
    spendRatio: "32.4%",
  },
  {
    id: "high_quality",
    name: "优质素材",
    color: "#EF4444", // Red / Coral
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    badgeColor: "bg-red-100 text-red-700",
    icon: Award,
    count: 860,
    countRatio: "19.1%",
    spend: 415200,
    spendRatio: "39.2%",
  },
  {
    id: "low_efficiency",
    name: "低效素材",
    color: "#8B5CF6", // Purple
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    badgeColor: "bg-purple-100 text-purple-700",
    icon: AlertCircle,
    count: 940,
    countRatio: "20.9%",
    spend: 182500,
    spendRatio: "17.2%",
  },
  {
    id: "low_quality",
    name: "低质素材",
    color: "#F59E0B", // Amber / Yellow
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700",
    icon: AlertTriangle,
    count: 520,
    countRatio: "11.6%",
    spend: 68100,
    spendRatio: "6.4%",
  },
  {
    id: "homogeneity_severe",
    name: "同质化挤压严重素材",
    color: "#EC4899", // Pink
    bgColor: "bg-pink-50",
    textColor: "text-pink-600",
    badgeColor: "bg-pink-100 text-pink-700",
    icon: Layers,
    count: 480,
    countRatio: "10.7%",
    spend: 32400,
    spendRatio: "3.1%",
  },
  {
    id: "homogeneity_risk",
    name: "同质化素材风险-排队投放素材",
    color: "#10B981", // Emerald / Green
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-700",
    icon: ShieldAlert,
    count: 410,
    countRatio: "9.2%",
    spend: 17900,
    spendRatio: "1.7%",
  },
];

// Mock data rows for Detailed Table
export default function PlatformTagsView({ showToast }: PlatformTagsViewProps) {
  // Top level platforms: 巨量千川 | 巨量广告
  const [platform, setPlatform] = useState<"qianchuan" | "oceanengine">("qianchuan");

  // Dimension level: 汇总 | 部门 | 分组 | 个人 | 广告账户
  const [dimension, setDimension] = useState<PlatformTagDimension>("summary");

  // Filters
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { category, start: startDate, end: endDate } = filters;

  // Collapse toggle for 占比分析
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Tooltip hover/click
  const [showTooltip, setShowTooltip] = useState(false);

  // Active hover index on Pie Chart
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const report = useReportData();
  const [applied, setApplied] = useState(DEFAULT_FILTERS);
  const platformName = platform === "qianchuan" ? "巨量千川" : "巨量广告";
  const selected = selectPlatformTagFacts(report.facts, platformName, dimension, applied);
  const total = qualityReport(selected);
  const qualityKeys = ["firstRelease", "highQuality", "lowEfficiency", "lowQuality", "homogeneitySevere", "homogeneityRisk"];
  const MATERIAL_TYPES = MATERIAL_TYPE_META.map((item, i) => ({...item,
    count: total[qualityKeys[i]], countRatio: total[qualityKeys[i] + "Ratio"],
    spend: reportTotals(selected.filter(row => row.qualityTags.includes(["首发素材", "优质素材", "低效素材", "低质素材", "同质化挤压严重", "同质化排队投放"][i]))).spend,
    spendRatio: total[qualityKeys[i] + "SpendRatio"]
  }));
  const table = platformTagTable(selected, dimension);
  const tableWidth = table.columns.reduce((width, column) => width + column.width, 0);
  const tableRows = table.rows.length ? [table.total, ...table.rows] : [];
  const clearDimensionFilters = () => {
    const clear = (value: PlatformTagFilters) => ({ ...value, department: "", groupKey: "", memberId: "", subject: "" });
    setFilters(clear);
    setApplied(clear);
    setHoveredSlice(null);
  };
  const changeDimension = (next: PlatformTagDimension) => {
    if (next === dimension) return;
    setDimension(next);
    clearDimensionFilters();
  };
  const changePlatform = (next: typeof platform) => {
    if (next === platform) return;
    setPlatform(next);
    clearDimensionFilters();
  };
  const handleQuery = () => {
    if (!startDate || !endDate || startDate > endDate) { showToast?.("查询失败", "请选择有效的日期范围"); return; }
    setApplied({ ...filters });
    if (showToast) {
      showToast("查询成功", `已加载【${platform === "qianchuan" ? "巨量千川" : "巨量广告"}】维度数据 (${startDate} 至 ${endDate})`);
    }
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setHoveredSlice(null);
    if (showToast) {
      showToast("已重置", "已恢复默认筛选条件");
    }
  };

  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const label = PLATFORM_TAG_DIMENSIONS.find(item => item.id === dimension)!.label;
    const exportSelected = selectPlatformTagFacts(report.facts, platformName, dimension, { ...applied, start: request.startDate, end: request.endDate });
    const exportTable = platformTagTable(exportSelected, dimension);
    const exportRows = exportTable.rows.length ? [exportTable.total, ...exportTable.rows] : [];
    const fileName = await exportAnalyticsRows([
      exportTable.columns.map(column => column.label),
      ...exportRows.map(row => exportTable.columns.map(column => row.values[column.key] ?? "")),
    ], request, "广告平台标签");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };

  // Generate SVG Pie Chart paths
  const totalCount = MATERIAL_TYPES.reduce((acc, curr) => acc + curr.count, 0);
  let cumulativeAngle = 0;

  const pieSlices = MATERIAL_TYPES.map((item, index) => {
    const percentage = totalCount ? item.count / totalCount : 0;
    const angle = percentage * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // Convert polar coordinates to Cartesian
    const cx = 100;
    const cy = 100;
    const r = 75;
    const innerR = 42; // Donut style

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

    return {
      ...item,
      pathData,
      startAngle,
      endAngle,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return (
    <div className="space-y-4" data-testid="platform-tags-view">
      {/* ================= 1. Platform & Dimension Tabs Bar ================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Top Level Platforms (巨量千川 / 巨量广告) */}
        <div className="flex items-center gap-6 px-5 py-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => changePlatform("qianchuan")}
            className={`flex items-center gap-2 font-bold text-sm transition-all cursor-pointer relative py-1 ${
              platform === "qianchuan"
                ? "text-[#7C3AED]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`p-1 rounded-md ${platform === "qianchuan" ? "bg-purple-100 text-[#7C3AED]" : "bg-slate-100 text-slate-400"}`}>
              <BarChart3 className="w-4 h-4" />
            </div>
            <span>巨量千川</span>
            {platform === "qianchuan" && (
              <span className="absolute bottom-[-12px] left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
            )}
          </button>

          <button
            onClick={() => changePlatform("oceanengine")}
            className={`flex items-center gap-2 font-bold text-sm transition-all cursor-pointer relative py-1 ${
              platform === "oceanengine"
                ? "text-[#7C3AED]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`p-1 rounded-md ${platform === "oceanengine" ? "bg-purple-100 text-[#7C3AED]" : "bg-slate-100 text-slate-400"}`}>
              <Compass className="w-4 h-4" />
            </div>
            <span>巨量广告</span>
            {platform === "oceanengine" && (
              <span className="absolute bottom-[-12px] left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
            )}
          </button>
        </div>

        {/* Dimension Tabs & Filter Control Row */}
        <div className="p-4 bg-slate-50/50 space-y-3">
          {/* Dimension Selector Buttons */}
          <div role="group" aria-label="统计维度" className="inline-flex max-w-full overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
            {PLATFORM_TAG_DIMENSIONS.map((d) => {
              const isActive = dimension === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => changeDimension(d.id)}
                  aria-pressed={isActive}
                  className={`h-9 shrink-0 px-4 text-xs font-bold transition-colors cursor-pointer border-r last:border-r-0 border-slate-200 ${
                    isActive
                      ? "bg-[#7C3AED] text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1" data-testid="platform-tag-filters">
            <div className="flex items-center gap-3 flex-wrap min-w-0 max-w-full">
              {dimension === "account" && (
                <input aria-label="主体名称" placeholder="请输入主体名称" value={filters.subject}
                  onChange={event => setFilters(value => ({ ...value, subject: event.target.value }))}
                  className={`${selectClassName} cursor-text pr-3`} />
              )}
              {dimension === "team" && (
                <select aria-label="部门" value={filters.department} className={selectClassName}
                  onChange={event => setFilters(value => ({ ...value, department: event.target.value }))}>
                  <option value="">请选择部门</option>
                  {report.tree.map(team => <option key={team.teamName} value={team.teamName}>{team.teamName}</option>)}
                </select>
              )}
              {(dimension === "group" || dimension === "account") && (
                <select aria-label="分组" value={filters.groupKey} className={selectClassName}
                  onChange={event => setFilters(value => ({ ...value, groupKey: event.target.value }))}>
                  <option value="">请选择分组</option>
                  {report.tree.filter(team => team.groups.length).map(team => (
                    <optgroup key={team.teamName} label={team.teamName}>
                      {team.groups.map(group => <option key={group.groupName} value={platformTagGroupKey(team.teamName, group.groupName)}>{group.groupName}</option>)}
                    </optgroup>
                  ))}
                </select>
              )}
              {dimension === "user" && (
                <select aria-label="个人账号" value={filters.memberId} className={selectClassName}
                  onChange={event => setFilters(value => ({ ...value, memberId: event.target.value }))}>
                  <option value="">请选择账号</option>
                  {report.org.members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              )}
              {/* Category Select */}
              <ReportCategoryFilter categories={report.categories} value={category}
                onChange={category => setFilters(value => ({ ...value, category }))} />

              {/* Date Range Selector */}
              <div className="flex flex-wrap items-center min-h-9 gap-2 bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-2xs text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  消耗时间:
                </span>
                <input
                  type="date"
                  aria-label="消耗开始日期"
                  value={startDate}
                  onChange={(e) => setFilters(value => ({ ...value, start: e.target.value }))}
                  className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  aria-label="消耗结束日期"
                  value={endDate}
                  onChange={(e) => setFilters(value => ({ ...value, end: e.target.value }))}
                  className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleQuery}
                className="h-9 px-5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>查询</span>
              </button>

              <button
                onClick={handleReset}
                className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. 占比分析 (Proportion Analysis Panel) ================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">占比分析</h3>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-xs text-purple-600 font-bold hover:text-purple-700 cursor-pointer"
          >
            <span>{isCollapsed ? "展开" : "收起"}</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Card Content Body */}
        {!isCollapsed && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left side: 6 Material Quality Metric Cards (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {MATERIAL_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all flex items-start gap-3 shadow-2xs"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.bgColor} ${item.textColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500">
                        <div>
                          数量: <span className="font-bold text-slate-900">{item.count.toLocaleString()}</span>
                        </div>
                        <div>
                          数量占比: <span className="font-bold text-slate-900">{item.countRatio}</span>
                        </div>
                        <div>
                          消耗: <span className="font-bold text-slate-900">¥{item.spend.toLocaleString()}</span>
                        </div>
                        <div>
                          消耗占比: <span className="font-bold text-slate-900">{item.spendRatio}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right side: SVG Donut Chart & Legends (5 cols) */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center gap-6 p-2 bg-slate-50/30 rounded-xl border border-slate-100">
              {/* Donut SVG */}
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {pieSlices.map((slice, idx) => (
                    <path
                      key={slice.id}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-all duration-300 cursor-pointer hover:opacity-90 hover:scale-105 origin-center"
                      onMouseEnter={() => setHoveredSlice(idx)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))}
                </svg>
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  {hoveredSlice !== null ? (
                    <>
                      <span className="text-[10px] text-slate-400 font-bold">{pieSlices[hoveredSlice].name}</span>
                      <span className="text-sm font-black text-slate-900 mt-0.5">{pieSlices[hoveredSlice].count}</span>
                      <span className="text-[10px] font-bold text-purple-600">{pieSlices[hoveredSlice].percentage}%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 font-bold">总素材数</span>
                      <span className="text-sm font-black text-slate-900 mt-0.5">{totalCount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 font-medium">六维类型</span>
                    </>
                  )}
                </div>
              </div>

              {/* Chart Legend List */}
              <div className="space-y-1.5 text-[11px] font-medium text-slate-600 flex-1 min-w-0">
                {pieSlices.map((slice, idx) => (
                  <div
                    key={slice.id}
                    className={`flex items-center gap-2 p-1 rounded-md transition-colors cursor-pointer ${
                      hoveredSlice === idx ? "bg-slate-200/60 text-slate-900 font-bold" : "hover:bg-slate-100"
                    }`}
                    onMouseEnter={() => setHoveredSlice(idx)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate flex-1">{slice.name}</span>
                    <span className="font-mono text-slate-500 text-[10px] shrink-0">
                      {slice.count} ({slice.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 3. 详细数据 (Detailed Data Table Section) ================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Title Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 relative">
            <h3 className="text-sm font-bold text-slate-900">详细数据</h3>
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Tooltip Popup */}
            {showTooltip && (
              <div className="absolute top-6 left-16 z-30 w-72 p-3 bg-slate-900 text-white rounded-lg shadow-xl text-[11px] leading-relaxed space-y-1 animate-fade-in pointer-events-none">
                <div className="font-bold text-purple-300">指标说明：</div>
                <div>• 首发素材：在该平台首次发布的原创素材。</div>
                <div>• 优质素材：高曝光与高转化率的标杆素材。</div>
                <div>• 低效/低质素材：ROI低于预期的受限素材。</div>
                <div>• 同质化挤压严重：素材重合度高导致排挤。</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setExportOpen(true)}
            aria-haspopup="dialog"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>导出表格</span>
          </button>
        </div>

        {/* Scrollable Responsive Table */}
        <div key={dimension} className="overflow-x-auto" style={{ containerType: "inline-size" }} data-testid="platform-tag-table-scroll">
          <table aria-label="广告平台标签详细数据" className="w-full text-left border-separate border-spacing-0 table-fixed"
            style={{ minWidth: tableWidth, width: dimension === "account" ? tableWidth : undefined }}>
            <colgroup>{table.columns.map(column => <col key={column.key} style={{ width: column.width }} />)}</colgroup>
            <thead>
              <tr className="text-slate-500 font-bold text-[11px]">
                {table.columns.map((column, index) => (
                  <th key={column.key} scope="col"
                    style={column.fixed ? { left: table.columns.slice(0, index).reduce((width, item) => width + item.width, 0) } : undefined}
                    className={`py-3 px-3.5 border-b border-slate-200/80 bg-slate-50 leading-5 break-words ${column.numeric ? "text-right" : "text-left"} ${column.fixed ? "xl:sticky z-20" : ""}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs font-medium">
              {tableRows.map((row, rowIndex) => (
                <tr key={row.id} className="group">
                  {table.columns.map((column, index) => {
                    const value = row.values[column.key];
                    return (
                      <td key={column.key}
                        style={column.fixed ? { left: table.columns.slice(0, index).reduce((width, item) => width + item.width, 0) } : undefined}
                        className={`py-3 px-3.5 border-b border-slate-100 leading-5 ${column.numeric ? "text-right whitespace-nowrap" : "break-words"} ${column.fixed ? "xl:sticky z-10" : ""} ${rowIndex === 0 ? "bg-purple-50 font-bold text-slate-900" : "bg-white text-slate-700 group-hover:bg-slate-50"}`}>
                        <div>{typeof value === "number" ? fmt(value) : value}</div>
                        {column.detailKey && <div className="text-[10px] text-slate-400 font-normal">{row.values[column.detailKey]}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!tableRows.length && <tr><td colSpan={table.columns.length} className="p-0 text-slate-400">
                <div className="sticky left-0 flex h-28 w-[100cqw] items-center justify-center">暂无数据</div>
              </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <AnalyticsExportDialog
        open={exportOpen}
        pageName="广告平台标签"
        filters={[
          { label: "平台", value: platformName },
          { label: "维度", value: PLATFORM_TAG_DIMENSIONS.find(item => item.id === dimension)?.label },
          { label: "主体", value: applied.subject },
          { label: "部门", value: applied.department },
          { label: "分组", value: applied.groupKey },
          { label: "个人", value: report.org.members.find(member => member.id === applied.memberId)?.name },
          { label: "分类", value: applied.category === "all" ? "" : applied.category },
        ]}
        startDate={applied.start}
        endDate={applied.end}
        onClose={() => setExportOpen(false)}
        onConfirm={handleExport}
      />
    </div>
  );
}
