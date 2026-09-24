import { usePlatformReportData } from "../lib/usePlatformReportData";
import { REPORT_START, REPORT_TODAY, REPORT_COLORS } from "../lib/reportDemoData";
import { groupedResources, organizationKey, organizationSelected } from "../lib/reportPlatformData";
import { grouped, ratio } from "../lib/analyticsData";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import React, { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  SlidersHorizontal,
  Check,
  HelpCircle,
  Search,
  X,
  ArrowUpDown,
  Download,
  Filter
} from "lucide-react";

interface CreationAnalyticsViewProps {
  showToast?: (title: string, desc: string) => void;
}

// 1. Types
type TopTab = "team" | "group" | "personal";
type MediaType = "all" | "finished" | "material" | "image" | "audio";
type ChartTab = "trend" | "proportion";
type ActionType = "upload" | "download" | "copy_capcut";

interface DetailedRow {
  id: string;
  dateRange: string;
  team: string;
  group?: string;
  name?: string;
  uploaderCount: number;
  uploadCount: number;
  downloadCount: number;
  downloadedPersonCount: number;
  pushedPersonCount: number;
  copiedCapcutCount: number;
  usageRate: number; // e.g. 59.57
  viralCount: number;
}

export default function CreationAnalyticsView({ showToast }: CreationAnalyticsViewProps) {
  const report = usePlatformReportData();
  const MOCK_TREE = report.tree;
  // 1. Navigation States
  const [topTab, setTopTab] = useState<TopTab>("team");
  const [mediaType, setMediaType] = useState<MediaType>("all");

  // 2. Dropdown Filter Popover State
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(report.tree[0]?.teamName || null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(report.tree[0]?.groups[0]?.groupName || null);

  // 3. Time Controls
  const [timeAggregation, setTimeAggregation] = useState<string>("summary"); // "summary" | "daily" | "weekly" | "monthly"
  const [startDate, setStartDate] = useState<string>(REPORT_START);
  const [endDate, setEndDate] = useState<string>(REPORT_TODAY);

  // 4. Chart Card States
  const [chartTab, setChartTab] = useState<ChartTab>("trend");
  const [chartExpanded, setChartExpanded] = useState<boolean>(true);
  const [actionType, setActionType] = useState<ActionType>("upload");
  const [topCount, setTopCount] = useState<string>("top5");
  const [hoveredChartPointIndex, setHoveredChartPointIndex] = useState<number | null>(0); // Default first point for tooltip matching Screenshot 1

  // 5. Table & Export States
  const [exportOpen, setExportOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("uploadCount");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const handleSort = (field: string) => { setSortAsc(sortField === field ? !sortAsc : false); setSortField(field); };

  // Toggle selection helpers
  const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Label text for entity filter dropdown
  const getFilterDropdownLabel = () => {
    if (topTab === "team") {
      if (selectedTeams.length === 0) return "请选择部门";
      return `已选 ${selectedTeams.length} 个部门`;
    } else if (topTab === "group") {
      if (selectedGroups.length === 0) return "请选择分组";
      return `已选 ${selectedGroups.length} 个分组`;
    } else {
      if (selectedAccounts.length === 0) return "请选择账号";
      return `已选 ${selectedAccounts.length} 个账号`;
    }
  };

  const scope = ({ finished: "finished", material: "materials", image: "images", audio: "audio" } as const)[mediaType];
  const selectedResources = report.resources.filter(row => (mediaType === "all" ? row.scope !== "scripts" : row.scope === scope) &&
    row.date >= (startDate || REPORT_START) && row.date <= (endDate || REPORT_TODAY) &&
    organizationSelected(row, topTab, selectedTeams, selectedGroups, selectedAccounts));
  const selectedEvents = report.activities.filter(event => event.date >= (startDate || REPORT_START) && event.date <= (endDate || REPORT_TODAY));
  const INITIAL_DETAILED_DATA = groupedResources(selectedResources, topTab, timeAggregation, startDate, endDate, selectedEvents)
    .sort((a, b) => (sortAsc ? 1 : -1) * ((Number(a[sortField]) || 0) - (Number(b[sortField]) || 0)));
  const metric = (rows: typeof selectedResources) => actionType === "upload" ? rows.length :
    selectedEvents.filter(event => rows.some(row => row.id === event.resourceId) && event.action === actionType).length;
  const chartGroups = grouped(selectedResources, row => organizationKey(row, topTab)).sort((a, b) => metric(b[1]) - metric(a[1]))
    .slice(0, topCount === "all" ? undefined : Number(topCount.replace("top", "")));
  const TEAMS_LEGEND = chartGroups.map(([key, rows], index) => ({ key, name: topTab === "team" ? rows[0].department : topTab === "group" ? rows[0].group : rows[0].person, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
  const periods = [...new Set((actionType === "upload" ? selectedResources.map(row => row.date) : selectedEvents.filter(event => event.action === actionType && selectedResources.some(row => row.id === event.resourceId)).map(event => event.date)).map(date => date.slice(0, 7)))].sort();
  const chartTotal = chartGroups.reduce((sum, [, rows]) => sum + metric(rows), 0);
  const chartValuesByDate = (chartTab === "proportion" ? chartGroups.map(([key, rows]) => ({
    date: TEAMS_LEGEND.find(item => item.key === key)!.name, values: chartGroups.map(([id]) => id === key ? Math.round(ratio(metric(rows), chartTotal) * 10000) / 100 : 0),
  })) : periods.map(date => ({
    date, values: chartGroups.map(([, rows]) => actionType === "upload" ? rows.filter(row => row.date.startsWith(date)).length :
      selectedEvents.filter(event => event.date.startsWith(date) && event.action === actionType && rows.some(row => row.id === event.resourceId)).length),
  })));
  const CHART_DATES = chartValuesByDate.map(row => row.date);
  const chartWidth = 900, chartHeight = 220, paddingX = 40, paddingY = 30;
  const chartMax = chartTab === "proportion" ? 100 : Math.max(1, ...chartValuesByDate.map(row => row.values.reduce((sum, value) => sum + value, 0)));
  const getX = (index: number) => paddingX + index * (chartWidth - paddingX * 2) / Math.max(1, CHART_DATES.length - 1);
  const getY = (value: number) => chartHeight - paddingY - value / chartMax * (chartHeight - paddingY * 2);
  const stackedPath = chartValuesByDate.map((row, index) => `${index ? "L" : "M"} ${getX(index)} ${getY(row.values.reduce((sum, value) => sum + value, 0))}`).join(" ");
  const stackedAreaPath = chartValuesByDate.length ? `${stackedPath} L ${getX(CHART_DATES.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z` : "";

  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const exportResources = report.resources.filter(row =>
      (mediaType === "all" ? row.scope !== "scripts" : row.scope === scope) &&
      row.date >= request.startDate && row.date <= request.endDate &&
      organizationSelected(row, topTab, selectedTeams, selectedGroups, selectedAccounts));
    const exportEvents = report.activities.filter(event => event.date >= request.startDate && event.date <= request.endDate);
    const exportRows = groupedResources(exportResources, topTab, timeAggregation, request.startDate, request.endDate, exportEvents)
      .sort((a, b) => (sortAsc ? 1 : -1) * ((Number(a[sortField]) || 0) - (Number(b[sortField]) || 0)));
    const dimensionHeaders = topTab === "personal"
      ? ["姓名", "所属部门", "所属分组"]
      : topTab === "group" ? ["分组名称", "所属部门"] : ["部门名称"];
    const dimensionCells = (row: DetailedRow) => topTab === "personal"
      ? [row.name || "", row.team, row.group || "未归属分组"]
      : topTab === "group" ? [row.group || "未归属分组", row.team] : [row.team];
    const fileName = await exportAnalyticsRows([
      ["数据时间", ...dimensionHeaders, "上传人数", "上传次数", "下载次数", "被下载人数", "被推送人数", "被复制剪映人数", "作品被使用率", "爆款视频数"],
      ...exportRows.map(row => [row.dateRange, ...dimensionCells(row), row.uploaderCount, row.uploadCount, row.downloadCount, row.downloadedPersonCount, row.pushedPersonCount, row.copiedCapcutCount, row.usageRate.toFixed(2), row.viralCount]),
    ], request, "创作分析");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };


  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6 animate-fade-in">
      {/* ================= 1. Top Level Tabs: 部门数据 | 分组数据 | 个人数据 (Matches Screenshots 1, 2, 3, 4) ================= */}
      <div className="border-b border-slate-100 pb-2">
        <div className="flex items-center gap-8">
          {(
            [
              { key: "team", label: "部门数据" },
              { key: "group", label: "分组数据" },
              { key: "personal", label: "个人数据" }
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setTopTab(tab.key);
                setShowFilterDropdown(false);
              }}
              className={`text-sm font-bold pb-2 relative cursor-pointer transition-colors ${
                topTab === tab.key ? "text-[#7C3AED]" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
              {topTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 2. Sub Filters & Dropdowns Bar (Matches Screenshots 1-4) ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Media Type Pills + Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Media Type Pills */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            {(
              [
                { key: "all", label: "全部" },
                { key: "finished", label: "成片" },
                { key: "material", label: "素材" },
                { key: "image", label: "图片" },
                { key: "audio", label: "音频" }
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setMediaType(item.key)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  mediaType === item.key
                    ? "bg-[#7C3AED] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filter Dropdown Popover Button (Matches Screenshots 2, 3, 4) */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-3.5 py-1.5 bg-white border border-purple-300 text-slate-500 hover:border-purple-500 rounded-lg text-xs font-medium focus:outline-none flex items-center justify-between gap-3 min-w-[160px] cursor-pointer shadow-2xs"
            >
              <span className={getFilterDropdownLabel().includes("请选择") ? "text-slate-400" : "text-slate-800 font-bold"}>
                {getFilterDropdownLabel()}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Popover Content */}
            {showFilterDropdown && (
              <div className="absolute left-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-40 animate-fade-in text-xs min-w-[220px]">
                {/* 1. If 部门数据 -> Checklist of departments (Matches Screenshot 2) */}
                {topTab === "team" && (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {MOCK_TREE.map((t) => (
                      <label
                        key={t.teamName}
                        className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700 font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(t.teamName)}
                          onChange={() => toggleSelection(selectedTeams, setSelectedTeams, t.teamName)}
                          className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <span>{t.teamName}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* 2. If 分组数据 -> Cascading List (Team > Group) (Matches Screenshot 3) */}
                {topTab === "group" && (
                  <div className="flex border border-slate-100 rounded-lg overflow-hidden">
                    {/* Left Column: Teams */}
                    <div className="w-36 bg-slate-50/70 divide-y divide-slate-100 border-r border-slate-100 max-h-60 overflow-y-auto">
                      {MOCK_TREE.map((t) => (
                        <div
                          key={t.teamName}
                          onMouseEnter={() => setHoveredTeam(t.teamName)}
                          className={`px-3 py-2 flex items-center justify-between cursor-pointer font-medium ${
                            hoveredTeam === t.teamName
                              ? "bg-purple-50 text-[#7C3AED] font-bold"
                              : "text-slate-700 hover:bg-slate-100/60"
                          }`}
                        >
                          <span className="truncate">{t.teamName}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </div>
                      ))}
                    </div>

                    {/* Right Column: Groups of Hovered Team */}
                    <div className="w-40 p-1 max-h-60 overflow-y-auto space-y-1">
                      {MOCK_TREE.find((t) => t.teamName === hoveredTeam)?.groups.map((g) => (
                        <label
                          key={g.groupName}
                          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700 font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(g.groupName)}
                            onChange={() => toggleSelection(selectedGroups, setSelectedGroups, g.groupName)}
                            className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                          />
                          <span className="truncate">{g.groupName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. If 个人数据 -> 3-Level Cascading Tree (Matches Screenshot 4) */}
                {topTab === "personal" && (
                  <div className="flex border border-slate-100 rounded-lg overflow-hidden">
                    {/* Level 1: Teams */}
                    <div className="w-32 bg-slate-50/70 divide-y divide-slate-100 border-r border-slate-100 max-h-60 overflow-y-auto">
                      {MOCK_TREE.map((t) => (
                        <div
                          key={t.teamName}
                          onMouseEnter={() => {
                            setHoveredTeam(t.teamName);
                            setHoveredGroup(t.groups[0]?.groupName || null);
                          }}
                          className={`px-2.5 py-2 flex items-center justify-between cursor-pointer font-medium ${
                            hoveredTeam === t.teamName
                              ? "bg-purple-50 text-[#7C3AED] font-bold"
                              : "text-slate-700 hover:bg-slate-100/60"
                          }`}
                        >
                          <span className="truncate">{t.teamName}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </div>
                      ))}
                    </div>

                    {/* Level 2: Groups */}
                    <div className="w-32 bg-white border-r border-slate-100 max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {MOCK_TREE.find((t) => t.teamName === hoveredTeam)?.groups.map((g) => (
                        <div
                          key={g.groupName}
                          onMouseEnter={() => setHoveredGroup(g.groupName)}
                          className={`px-2.5 py-2 flex items-center justify-between cursor-pointer font-medium ${
                            hoveredGroup === g.groupName
                              ? "bg-purple-50 text-[#7C3AED] font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{g.groupName}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </div>
                      ))}
                    </div>

                    {/* Level 3: Accounts */}
                    <div className="w-36 p-1 max-h-60 overflow-y-auto space-y-1">
                      {MOCK_TREE.find((t) => t.teamName === hoveredTeam)
                        ?.groups.find((g) => g.groupName === hoveredGroup)
                        ?.accounts.map((acc) => (
                          <label
                            key={acc}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700 font-medium"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAccounts.includes(acc)}
                              onChange={() => toggleSelection(selectedAccounts, setSelectedAccounts, acc)}
                              className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                            <span className="truncate">{acc}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Time Aggregation Select & Date Range Picker */}
        <div className="flex items-center gap-3">
          {/* Time Aggregation Select: 汇总 ∨ */}
          <select
            value={timeAggregation}
            onChange={(e) => setTimeAggregation(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer"
          >
            <option value="summary">汇总</option>
            <option value="daily">按日</option>
            <option value="weekly">按周</option>
            <option value="monthly">按月</option>
          </select>

          {/* Date Picker Range */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none w-26 cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-medium">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none w-26 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ================= 3. Chart Section ("时间趋势" | "占比分析") Matches Screenshot 1 ================= */}
      <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-2xs space-y-3">
        {/* Chart Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          {/* Tabs: 时间趋势 | 占比分析 */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setChartTab("trend")}
              className={`text-xs font-bold pb-1.5 relative cursor-pointer transition-colors ${
                chartTab === "trend" ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              时间趋势
              {chartTab === "trend" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setChartTab("proportion")}
              className={`text-xs font-bold pb-1.5 relative cursor-pointer transition-colors ${
                chartTab === "proportion" ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              占比分析
              {chartTab === "proportion" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
              )}
            </button>
          </div>

          {/* Toggle Expand / Collapse */}
          <button
            onClick={() => setChartExpanded(!chartExpanded)}
            className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>{chartExpanded ? "收起" : "展开"}</span>
            {chartExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Chart Body */}
        {chartExpanded && (
          <div className="space-y-4 pt-1">
            {/* Chart Action Buttons + Legend Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Action Pills: 上传 | 下载 | 复制到剪映 */}
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50/50">
                  {(
                    [
                      { key: "upload", label: "上传" },
                      { key: "download", label: "下载" },
                      { key: "copy_capcut", label: "复制到剪映" }
                    ] as const
                  ).map((act) => (
                    <button
                      key={act.key}
                      onClick={() => setActionType(act.key)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        actionType === act.key
                          ? "bg-[#7C3AED] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>

                {/* Top Count Select: 显示top5 ∨ */}
                <select
                  value={topCount}
                  onChange={(e) => setTopCount(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer"
                >
                  <option value="top5">显示top5</option>
                  <option value="top10">显示top10</option>
                  <option value="all">显示全部</option>
                </select>
              </div>

              {/* Legend List */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                {TEAMS_LEGEND.map((leg) => (
                  <div key={leg.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                      style={{ backgroundColor: leg.color }}
                    />
                    <span>{leg.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive SVG Chart Container (Matches Screenshot 1 Peak Area Chart) */}
            <div className="relative bg-slate-50/40 rounded-xl border border-slate-100 p-2 overflow-x-auto">
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                {/* Horizontal Grid Lines */}
                {Array.from({ length: 6 }, (_, i) => Math.round(chartMax * i / 5)).map((val) => (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={getY(val)}
                      x2={chartWidth - paddingX}
                      y2={getY(val)}
                      stroke="#E2E8F0"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={paddingX - 8}
                      y={getY(val) + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {val}
                    </text>
                  </g>
                ))}

                {/* Dates on X Axis */}
                {CHART_DATES.map((d, i) => (
                  <text
                    key={d}
                    x={getX(i)}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {d}
                  </text>
                ))}

                {/* Stacked Blue Area Gradient */}
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Stacked Area Fill */}
                <path d={stackedAreaPath} fill="url(#blueGradient)" />

                {/* Stacked Top Stroke */}
                <path d={stackedPath} fill="none" stroke="#6366F1" strokeWidth={2} />

                {/* Data Points */}
                {chartValuesByDate.map((item, i) => {
                  const total = item.values.reduce((sum, value) => sum + value, 0);
                  const cx = getX(i);
                  const cy = getY(total);

                  return (
                    <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredChartPointIndex(i)}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={hoveredChartPointIndex === i ? 5 : 3}
                        fill="#6366F1"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Box (Matches Screenshot 1 Box on 2025-04-06) */}
              {hoveredChartPointIndex !== null && chartValuesByDate[hoveredChartPointIndex] && (
                <div
                  className="absolute bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-2.5 shadow-xl text-[11px] space-y-1 z-20 pointer-events-none"
                  style={{
                    left: `${Math.min(75, Math.max(10, (getX(hoveredChartPointIndex) / chartWidth) * 100))}%`,
                    top: "15%"
                  }}
                >
                  <div className="font-mono text-slate-400 pb-1 border-b border-slate-100">
                    {CHART_DATES[hoveredChartPointIndex]}
                  </div>
                  {TEAMS_LEGEND.map((t, index) => {
                    const item = chartValuesByDate[hoveredChartPointIndex];
                    const val = item.values[index] || 0;

                    return (
                      <div key={t.name} className="flex items-center justify-between gap-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                          <span className="text-slate-600">{t.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">{val}{chartTab === "proportion" ? "%" : ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. Detailed Data Table ("详细数据") Matches Screenshots 1 & 5 ================= */}
      <div className="space-y-3 pt-2">
        {/* Table Header Row */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">详细数据</h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setExportOpen(true)}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>导出数据</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Column Config Settings Button */}
            <button
              onClick={() => {
                if (showToast) showToast("表头设置", "您可在弹窗中勾选显示/隐藏特定数据列");
              }}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg cursor-pointer shadow-2xs"
              title="设置表格列"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[1100px] text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4">数据时间</th>
                {topTab === "personal" && (
                  <>
                    <th className="py-3 px-4">姓名</th>
                    <th className="py-3 px-4">所属部门</th>
                    <th className="py-3 px-4">所属分组</th>
                  </>
                )}
                {topTab === "group" && (
                  <>
                    <th className="py-3 px-4">分组名称</th>
                    <th className="py-3 px-4">所属部门</th>
                  </>
                )}
                {topTab === "team" && <th className="py-3 px-4">部门名称</th>}

                <th onClick={() => handleSort("uploaderCount")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>上传人数</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th onClick={() => handleSort("uploadCount")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>上传次数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th onClick={() => handleSort("downloadCount")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>下载次数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th onClick={() => handleSort("downloadedPersonCount")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>被下载人数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th onClick={() => handleSort("pushedPersonCount")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>被推送人数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th onClick={() => handleSort("copiedCapcutCount")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>被复制剪映人数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th onClick={() => handleSort("usageRate")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>作品被使用率</span>
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th onClick={() => handleSort("viralCount")} className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>爆款视频数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {INITIAL_DETAILED_DATA.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{row.dateRange}</td>
                  {topTab === "personal" && (
                    <>
                      <td className="py-3 px-4 font-bold text-[#7C3AED] whitespace-nowrap">{row.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">{row.team}</td>
                      <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">{row.group || "未归属分组"}</td>
                    </>
                  )}
                  {topTab === "group" && (
                    <>
                      <td className="py-3 px-4 font-bold text-[#7C3AED] whitespace-nowrap">{row.group || "未归属分组"}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">{row.team}</td>
                    </>
                  )}
                  {topTab === "team" && (
                    <td className="py-3 px-4 font-bold text-[#7C3AED] whitespace-nowrap">{row.team}</td>
                  )}

                  <td className="py-3 px-4 text-center font-mono">{row.uploaderCount}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{row.uploadCount}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.downloadCount}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.downloadedPersonCount}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.pushedPersonCount}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.copiedCapcutCount}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.usageRate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">{row.viralCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AnalyticsExportDialog
        open={exportOpen}
        pageName="创作分析"
        filters={[
          { label: "维度", value: { team: "部门数据", group: "分组数据", personal: "个人数据" }[topTab] },
          { label: "素材类型", value: { all: "全部", finished: "成片", material: "素材", image: "图片", audio: "音频" }[mediaType] },
          { label: "统计方式", value: { summary: "汇总", daily: "按日", weekly: "按周", monthly: "按月" }[timeAggregation] },
          { label: "部门", value: topTab === "team" ? selectedTeams.join("、") : "" },
          { label: "分组", value: topTab === "group" ? selectedGroups.join("、") : "" },
          { label: "账号", value: topTab === "personal" ? selectedAccounts.join("、") : "" },
        ]}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setExportOpen(false)}
        onConfirm={handleExport}
      />
    </div>
  );
}
