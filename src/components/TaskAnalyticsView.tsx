import { usePlatformReportData } from "../lib/usePlatformReportData";
import { REPORT_START, REPORT_TODAY, REPORT_COLORS } from "../lib/reportDemoData";
import { organizationKey, organizationSelected, taskOrganization, taskReportDate } from "../lib/reportPlatformData";
import { taskTotals, fileStatusTotals } from "../lib/platformAnalytics";
import { grouped, ratio } from "../lib/analyticsData";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import type { TaskItem } from "./TaskCollaborationView";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import React, { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  BarChart2,
  PieChart,
  Eye,
  TrendingUp,
  HelpCircle,
  Layers,
  ListFilter
} from "lucide-react";

interface TaskAnalyticsViewProps {
  showToast?: (title: string, desc: string) => void;
}

// Types
type TopTab = "team" | "group" | "personal";
type RoleType = "published" | "assigned" | "order_ops";
type StatusType = "all" | "pending" | "achieved";
type ChartTab = "trend" | "proportion" | "status_dist";
type MetricType = "task_count" | "order_count" | "video_count";

interface TaskRow {
  id: string;
  tasks: TaskItem[];
  team: string;
  group?: string;
  name?: string;
  taskCount: number;
  achievedCount: number;
  pendingCount: number;
  orderCount: number;
  videoCount: number;
  opsDetails: {
    orderQty: number;
    videoQty: number;
    statusBreakdown: { status: string; percent: string; count: number }[];
  };
}

export default function TaskAnalyticsView({ showToast }: TaskAnalyticsViewProps) {
  const report = usePlatformReportData();
  const MOCK_TREE = report.tree;
  // 1. Navigation States
  const [topTab, setTopTab] = useState<TopTab>("team");
  const [roleType, setRoleType] = useState<RoleType>("published");
  const [statusType, setStatusType] = useState<StatusType>("all");

  // 2. Cascading Entity Selection Dropdown State
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(report.tree[0]?.teamName || null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(report.tree[0]?.groups[0]?.groupName || null);

  // 3. Date & Time Controls
  const [dateType, setDateType] = useState<string>("order_date"); // "order_date" | "complete_date" | "create_date"
  const [startDate, setStartDate] = useState<string>(REPORT_START);
  const [endDate, setEndDate] = useState<string>(REPORT_TODAY);

  // 4. Chart Card States
  const [chartTab, setChartTab] = useState<ChartTab>("trend");
  const [chartExpanded, setChartExpanded] = useState<boolean>(true);
  const [metricType, setMetricType] = useState<MetricType>("task_count");
  const [topCount, setTopCount] = useState<string>("top5");
  const [hoveredChartPointIndex, setHoveredChartPointIndex] = useState<number | null>(1); // Default index 1 (2025-04-07) for tooltip

  // 5. Table Modals & Drawers
  const [exportOpen, setExportOpen] = useState(false);
  const [activeStatsModalRow, setActiveStatsModalRow] = useState<TaskRow | null>(null);
  const [activeDetailDrawerRow, setActiveDetailDrawerRow] = useState<TaskRow | null>(null);

  // Helper toggle function for selection
  const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const getFilterLabel = () => {
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

  const selectedTasks = report.tasks.filter(task => {
    const date = taskReportDate(task, dateType);
    return date && date >= (startDate || REPORT_START) && date <= (endDate || REPORT_TODAY) &&
      (statusType === "all" || (statusType === "achieved" ? task.status === "completed" : task.status !== "completed")) &&
      organizationSelected(taskOrganization(task, roleType, report.org), topTab, selectedTeams, selectedGroups, selectedAccounts);
  });
  const buildTaskRows = (tasksToGroup: TaskItem[]): TaskRow[] => grouped(tasksToGroup, task => organizationKey(taskOrganization(task, roleType, report.org), topTab)).map(([id, tasks]) => {
    const org = taskOrganization(tasks[0], roleType, report.org), totals = taskTotals(tasks), statuses = fileStatusTotals(tasks);
    return { id, tasks, team: org.department, group: org.group, name: org.person,
      taskCount: totals.tasks, achievedCount: totals.completed, pendingCount: totals.pending, orderCount: totals.orders, videoCount: totals.delivered,
      opsDetails: { orderQty: totals.orders, videoQty: totals.delivered, statusBreakdown: statuses.map(row => ({ status: row.label, count: row.value, percent: (ratio(row.value, totals.delivered) * 100).toFixed(1) + "%" })) } };
  });
  const INITIAL_TASK_ROWS = buildTaskRows(selectedTasks);
  const valueOf = (tasks: TaskItem[]) => { const totals = taskTotals(tasks); return metricType === "task_count" ? totals.tasks : metricType === "order_count" ? totals.orders : totals.delivered; };
  const chartRows = [...INITIAL_TASK_ROWS].sort((a, b) => valueOf(b.tasks) - valueOf(a.tasks)).slice(0, topCount === "all" ? undefined : Number(topCount.replace("top", "")));
  const TEAMS_LEGEND = chartRows.map((row, index) => ({ name: topTab === "team" ? row.team : topTab === "group" ? row.group : row.name, color: REPORT_COLORS[index % REPORT_COLORS.length] }));
  const periods = [...new Set(selectedTasks.map(task => taskReportDate(task, dateType).slice(0, 7)))].sort();
  const chartTotal = chartRows.reduce((sum, row) => sum + valueOf(row.tasks), 0);
  const chartPoints = chartTab === "status_dist" ? [
    { date: "已达标", values: chartRows.map(row => valueOf(row.tasks.filter(task => task.status === "completed"))) },
    { date: "待完成", values: chartRows.map(row => valueOf(row.tasks.filter(task => task.status !== "completed"))) },
  ] : chartTab === "proportion" ? chartRows.map((row, i) => ({ date: TEAMS_LEGEND[i].name, values: chartRows.map(item => item.id === row.id ? Math.round(ratio(valueOf(row.tasks), chartTotal) * 10000) / 100 : 0) })) :
    periods.map(date => ({ date, values: chartRows.map(row => valueOf(row.tasks.filter(task => taskReportDate(task, dateType).startsWith(date)))) }));
  const chartWidth = 900, chartHeight = 220, paddingX = 40, paddingY = 30;
  const chartMax = chartTab === "proportion" ? 100 : Math.max(1, ...chartPoints.flatMap(row => row.values));
  const getX = (index: number) => paddingX + index * (chartWidth - paddingX * 2) / Math.max(1, chartPoints.length - 1);
  const getY = (value: number) => chartHeight - paddingY - value / chartMax * (chartHeight - paddingY * 2);
  const chartPaths = chartRows.map((_, index) => chartPoints.map((row, i) => `${i ? "L" : "M"} ${getX(i)} ${getY(row.values[index] || 0)}`).join(" "));

  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const exportTasks = report.tasks.filter(task => {
      const date = taskReportDate(task, dateType);
      return date && date >= request.startDate && date <= request.endDate &&
        (statusType === "all" || (statusType === "achieved" ? task.status === "completed" : task.status !== "completed")) &&
        organizationSelected(taskOrganization(task, roleType, report.org), topTab, selectedTeams, selectedGroups, selectedAccounts);
    });
    const exportRows = buildTaskRows(exportTasks);
    const dimensionHeaders = topTab === "personal"
      ? ["姓名", "所属部门", "所属分组"]
      : topTab === "group" ? ["分组名称", "所属部门"] : ["部门名称"];
    const dimensionCells = (row: TaskRow) => topTab === "personal"
      ? [row.name || "", row.team, row.group || "未归属分组"]
      : topTab === "group" ? [row.group || "未归属分组", row.team] : [row.team];
    const fileName = await exportAnalyticsRows([
      [...dimensionHeaders, "任务数", "已达标", "待完成", "下单数", "出片数"],
      ...exportRows.map(row => [...dimensionCells(row), row.taskCount, row.achievedCount, row.pendingCount, row.orderCount, row.videoCount]),
    ], request, "任务分析");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };


  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6 animate-fade-in">
      {/* ================= 1. Top Tabs: 部门数据 | 分组数据 | 个人数据 (Matches Screenshots 1-4) ================= */}
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

      {/* ================= 2. Sub Filters & Cascading Dropdowns Bar (Matches Screenshots 1-4) ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Filter Groups */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Pills: 发布的任务 | 被指派的任务 | 下单运营 */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            {(
              [
                { key: "published", label: "发布的任务" },
                { key: "assigned", label: "被指派的任务" },
                { key: "order_ops", label: "下单运营" }
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setRoleType(item.key)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  roleType === item.key
                    ? "bg-[#7C3AED] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Status Pills: 全部状态 | 待完成 | 已达标 */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            {(
              [
                { key: "all", label: "全部状态" },
                { key: "pending", label: "待完成" },
                { key: "achieved", label: "已达标" }
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusType(item.key)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  statusType === item.key
                    ? "bg-[#7C3AED] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Entity Selector Dropdown (请选择部门 / 请选择分组 / 请选择账号) */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-3.5 py-1.5 bg-white border border-purple-300 text-slate-500 hover:border-purple-500 rounded-lg text-xs font-medium focus:outline-none flex items-center justify-between gap-3 min-w-[150px] cursor-pointer shadow-2xs"
            >
              <span className={getFilterLabel().includes("请选择") ? "text-slate-400" : "text-slate-800 font-bold"}>
                {getFilterLabel()}
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

                {/* 2. If 分组数据 -> 2-Level Cascading List (Team > Group) (Matches Screenshot 3) */}
                {topTab === "group" && (
                  <div className="flex border border-slate-100 rounded-lg overflow-hidden">
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

        {/* Right Date Type Select & Picker */}
        <div className="flex items-center gap-3">
          <select
            value={dateType}
            onChange={(e) => setDateType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer"
          >
            <option value="order_date">下单日期</option>
            <option value="complete_date">完成日期</option>
            <option value="create_date">创建日期</option>
          </select>

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

      {/* ================= 3. Chart Card Section ("时间趋势" | "占比分析" | "视频状态分布") Matches Screenshot 1 ================= */}
      <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-2xs space-y-3">
        {/* Chart Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          {/* Tabs: 时间趋势 | 占比分析 | 视频状态分布 */}
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

            <button
              onClick={() => setChartTab("status_dist")}
              className={`text-xs font-bold pb-1.5 relative cursor-pointer transition-colors ${
                chartTab === "status_dist" ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              视频状态分布
              {chartTab === "status_dist" && (
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
            {/* Chart Control Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Metric Pills: 任务数 | 下单数 | 出片数 */}
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50/50">
                  {(
                    [
                      { key: "task_count", label: "任务数" },
                      { key: "order_count", label: "下单数" },
                      { key: "video_count", label: "出片数" }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMetricType(m.key)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        metricType === m.key
                          ? "bg-[#7C3AED] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Top Count Dropdown */}
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

            {/* Interactive SVG Chart Container (Matches Screenshot 1 Peak Curve) */}
            <div className="relative bg-slate-50/40 rounded-xl border border-slate-100 p-2 overflow-x-auto">
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                {/* Horizontal Grid Lines */}
                {Array.from({ length: 5 }, (_, i) => Math.round(chartMax * i / 4)).map((val) => (
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

                {/* X Axis Dates */}
                {chartPoints.map((pt, i) => (
                  <text
                    key={pt.date}
                    x={getX(i)}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {pt.date}
                  </text>
                ))}

                {/* Defs for gradients */}
                <defs>
                  <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {chartPaths.map((path, index) => (
                  <g key={index}>
                    <path d={path ? `${path} L ${getX(chartPoints.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z` : ""} fill={TEAMS_LEGEND[index].color} fillOpacity={0.12} />
                    <path d={path} fill="none" stroke={TEAMS_LEGEND[index].color} strokeWidth={2} />
                    {chartPoints.map((point, i) => <circle key={i} cx={getX(i)} cy={getY(point.values[index] || 0)} r={4} fill={TEAMS_LEGEND[index].color} stroke="#ffffff" strokeWidth={1.5}><title>{point.date}: {TEAMS_LEGEND[index].name} {point.values[index] || 0}</title></circle>)}
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. Detailed Data Table ("详细数据") Matches Screenshots 1, 5, 6 ================= */}
      <div className="space-y-3 pt-2">
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

            {/* Column Config Settings */}
            <button
              onClick={() => {
                if (showToast) showToast("列配置", "您可在弹窗中自定义任务报表包含的数据项");
              }}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg cursor-pointer shadow-2xs"
              title="设置表格列"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[900px] text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
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

                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>任务数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>已达标</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>待完成</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>下单数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>出片数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                </th>

                <th className="py-3 px-4 text-center">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {INITIAL_TASK_ROWS.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
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

                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{row.taskCount}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.achievedCount}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.pendingCount}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{row.orderCount}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-purple-600">{row.videoCount}</td>

                  {/* 操作 Column (Matches Screenshots 5 & 6) */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium">
                      {/* 统计 Link */}
                      <button
                        onClick={() => setActiveStatsModalRow(row)}
                        className="text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        统计
                      </button>

                      {/* 查看详情 Link */}
                      <button
                        onClick={() => setActiveDetailDrawerRow(row)}
                        className="text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        查看详情
                      </button>

                      {/* 数据洞察 Link */}
                      <button
                        onClick={() => {
                          if (showToast) showToast("数据洞察", `已载入【${row.team}】任务指标与履约全景洞察`);
                        }}
                        className="text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        数据洞察
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 5. "数据汇总" Modal (Matches Screenshot 5) ================= */}
      {activeStatsModalRow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-5">
            {/* Modal Header: | 数据汇总 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-900">数据汇总</h3>
              </div>
              <button
                onClick={() => setActiveStatsModalRow(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs">
              {/* Order & Video Summary Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-2.5 px-4 bg-slate-50 text-slate-500 font-bold border-r border-slate-100 w-1/2">
                        下单数量
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                        {activeStatsModalRow.opsDetails.orderQty}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 bg-slate-50 text-slate-500 font-bold border-r border-slate-100">
                        出片数量
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                        {activeStatsModalRow.opsDetails.videoQty}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Breakdown Table (状态汇总) */}
              <div className="space-y-2">
                <div className="font-bold text-slate-700">状态汇总</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {activeStatsModalRow.opsDetails.statusBreakdown.map((sb, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-4 bg-slate-50 text-slate-700 font-bold border-r border-slate-100 w-1/3">
                            {sb.status}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600 border-r border-slate-100 w-1/3">
                            {sb.percent}
                          </td>
                          <td className="py-2.5 px-4 bg-slate-50 text-slate-500 border-r border-slate-100 text-right w-1/6">
                            数量
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-800 text-center w-1/6">
                            {sb.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveStatsModalRow(null)}
                className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. "查看详情" Drawer / Modal (Matches Screenshot 6) ================= */}
      {activeDetailDrawerRow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#7C3AED]" />
                <span>任务详情列表 - {activeDetailDrawerRow.team}</span>
              </h3>
              <button
                onClick={() => setActiveDetailDrawerRow(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Detail List */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">任务编号</th>
                    <th className="py-2.5 px-3">任务名称</th>
                    <th className="py-2.5 px-3 text-center">目标出片</th>
                    <th className="py-2.5 px-3 text-center">实际完成</th>
                    <th className="py-2.5 px-3 text-center">状态</th>
                    <th className="py-2.5 px-3 text-right">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {activeDetailDrawerRow.tasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-800">{task.id}</td>
                      <td className="py-2.5 px-3 font-bold text-[#7C3AED]">{task.product || task.remark || task.id}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{task.orderCount}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">{task.completedCount}</td>
                      <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded">{task.status === "completed" ? "已达标" : "待完成"}</span></td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono">{taskReportDate(task, dateType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveDetailDrawerRow(null)}
                className="px-5 py-1.5 bg-[#7C3AED] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      <AnalyticsExportDialog
        open={exportOpen}
        pageName="任务分析"
        filters={[
          { label: "维度", value: { team: "部门数据", group: "分组数据", personal: "个人数据" }[topTab] },
          { label: "任务类型", value: { published: "发布的任务", assigned: "被指派的任务", order_ops: "下单运营" }[roleType] },
          { label: "任务状态", value: { all: "全部", pending: "待完成", achieved: "已达标" }[statusType] },
          { label: "日期类型", value: { order_date: "下单日期", complete_date: "完成日期", create_date: "创建日期" }[dateType] },
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
