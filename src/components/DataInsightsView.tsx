import { usePlatformReportData } from "../lib/usePlatformReportData";
import { useReportData } from "../lib/useReportData";
import { REPORT_START, REPORT_TODAY, selectReportFacts } from "../lib/reportDemoData";
import { insightProfile } from "../lib/reportInsights";
import { leaderMembers, taskReportDate } from "../lib/reportPlatformData";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import React, { useState } from "react";
import {
  Calendar,
  X,
  Sparkles,
  Users,
  User,
  ShieldCheck,
  Award,
  BarChart3,
  TrendingUp,
  Check,
  HelpCircle,
  Zap,
  ArrowRight
} from "lucide-react";

interface DataInsightsViewProps {
  showToast?: (title: string, desc: string) => void;
}

// 1. Radar Chart Axis Definitions
const RADAR_AXES = [
  { key: "spend", label: "消耗力", fullMark: 100 },
  { key: "contribution", label: "贡献度", fullMark: 100 },
  { key: "diversity", label: "多样性", fullMark: 100 },
  { key: "viralRate", label: "爆片率", fullMark: 100 },
  { key: "diligence", label: "勤奋度", fullMark: 100 },
  { key: "creativity", label: "创造力", fullMark: 100 }
] as const;

// Helper SVG Radar Component
function SVGInteractiveRadarChart({
  dataA,
  dataB,
  nameA,
  nameB,
  size = 420
}: {
  dataA: Record<string, number>;
  dataB: Record<string, number>;
  nameA: string;
  nameB: string;
  size?: number;
}) {
  const center = size / 2;
  const radius = size * 0.36; // 36% of container
  const numAxes = RADAR_AXES.length;

  // Concentric circle ticks (20%, 40%, 60%, 80%, 100%)
  const circleTicks = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Get (x, y) for angle (0 at top, clockwise)
  const getCoordinates = (index: number, level: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = radius * level;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Build polygon path for a dataset
  const buildPolygonPath = (data: Record<string, number>) => {
    return RADAR_AXES.map((axis, i) => {
      const val = (data[axis.key] || 0) / 100;
      const { x, y } = getCoordinates(i, Math.max(0, Math.min(1, val)));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ") + " Z";
  };

  const pathA = buildPolygonPath(dataA);
  const pathB = buildPolygonPath(dataB);

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Concentric Grid Circles */}
        {circleTicks.map((tick, idx) => (
          <circle
            key={idx}
            cx={center}
            cy={center}
            r={radius * tick}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={1}
            strokeDasharray={tick === 1.0 ? "none" : "2 2"}
          />
        ))}

        {/* Axis Spokes & Labels */}
        {RADAR_AXES.map((axis, i) => {
          const { x: endX, y: endY } = getCoordinates(i, 1.0);
          const { x: labelX, y: labelY } = getCoordinates(i, 1.18);

          // Alignment adjustments for top, bottom, left, right labels
          let textAnchor: "start" | "end" | "middle" = "middle";
          if (labelX > center + 15) textAnchor = "start";
          else if (labelX < center - 15) textAnchor = "end";

          let dy = "0.3em";
          if (labelY < center - 15) dy = "-0.2em";
          else if (labelY > center + 15) dy = "0.8em";

          return (
            <g key={axis.key}>
              {/* Radial Line */}
              <line
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="#CBD5E1"
                strokeWidth={1}
              />
              {/* Label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor={textAnchor}
                dy={dy}
                className="text-xs font-semibold fill-slate-500 hover:fill-slate-900 transition-colors cursor-default"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {/* Series A (Blue) Polygon */}
        <path
          d={pathA}
          fill="rgba(59, 130, 246, 0.18)"
          stroke="#3B82F6"
          strokeWidth={2}
          className="transition-all duration-300"
        />

        {/* Series A Dots */}
        {RADAR_AXES.map((axis, i) => {
          const val = (dataA[axis.key] || 0) / 100;
          const { x, y } = getCoordinates(i, Math.max(0.05, Math.min(1, val)));
          return (
            <circle
              key={`dotA-${i}`}
              cx={x}
              cy={y}
              r={4}
              fill="#3B82F6"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Series B (Purple) Polygon */}
        <path
          d={pathB}
          fill="rgba(139, 92, 246, 0.18)"
          stroke="#8B5CF6"
          strokeWidth={2}
          className="transition-all duration-300"
        />

        {/* Series B Dots */}
        {RADAR_AXES.map((axis, i) => {
          const val = (dataB[axis.key] || 0) / 100;
          const { x, y } = getCoordinates(i, Math.max(0.05, Math.min(1, val)));
          return (
            <circle
              key={`dotB-${i}`}
              cx={x}
              cy={y}
              r={4}
              fill="#8B5CF6"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function DataInsightsView({ showToast }: DataInsightsViewProps) {
  const report = usePlatformReportData();
  const adReport = useReportData();
  const leaders = [...new Set(report.org.depts.filter(node => node.levelType !== "company" && report.org.members.some(member => member.name === node.manager)).map(node => node.manager))];
  const groupNames = report.tree.flatMap(dept => dept.groups.filter(group => group.groupName !== "未归属分组").map(group => group.groupName));
  // 1. Top Tab Selection: "personal" (个人数据洞察) | "group" (小组数据洞察)
  const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");

  // 2. Target Dropdowns State
  const [targetA, setTargetA] = useState<string>("徐振");
  const [targetB, setTargetB] = useState<string>("王剪辑");

  // Group Dropdowns State
  const [groupTargetA, setGroupTargetA] = useState<string>(groupNames[0] || "");
  const [groupTargetB, setGroupTargetB] = useState<string>(groupNames[1] || "");

  // 3. Date Range State
  const [startDate, setStartDate] = useState<string>(REPORT_START);
  const [endDate, setEndDate] = useState<string>(REPORT_TODAY);

  // 4. Modals and Dropdowns
  const [exportOpen, setExportOpen] = useState(false);
  const [showLeadershipModal, setShowLeadershipModal] = useState<boolean>(false);

  // Leadership Modal Comparison States
  const [leadershipA, setLeadershipA] = useState<string>("致上运营");
  const [leadershipB, setLeadershipB] = useState<string>("抖音1");

  const profileForRange = (name: string, people: string[], rangeStart: string, rangeEnd: string) => insightProfile(
    name,
    people,
    report.resources.filter(row => row.date >= rangeStart && row.date <= rangeEnd),
    report.activities.filter(row => row.date >= rangeStart && row.date <= rangeEnd),
    report.tasks.filter(task => taskReportDate(task, "create_date") >= rangeStart && taskReportDate(task, "create_date") <= rangeEnd),
    selectReportFacts(adReport.facts, "巨量千川", { start: rangeStart, end: rangeEnd }),
  );
  const profile = (name: string, people: string[]) => profileForRange(name, people, startDate, endDate);
  const groupMembers = (name: string) => report.tree.flatMap(dept => dept.groups.filter(group => group.groupName === name).flatMap(group => group.accounts));
  const currentProfileA = activeTab === "personal" ? profile(targetA, [targetA]) : profile(groupTargetA, groupMembers(groupTargetA));
  const currentProfileB = activeTab === "personal" ? profile(targetB, [targetB]) : profile(groupTargetB, groupMembers(groupTargetB));
  // Data Analysis Metrics (14 items)
  const dataAnalysisList = [
    "成片消耗",
    "成交金额",
    "ROI",
    "上传作品（成片）",
    "上传作品（素材）",
    "上传作品（图片）",
    "上传作品（音频）",
    "上传作品（脚本）",
    "下载作品数",
    "推送他人作品数",
    "复制他人作品到剪映数",
    "作品被多少人下载",
    "作品被多少人复制到剪映",
    "作品被多少人推送"
  ];

  // Task Analysis Metrics (10 items)
  const taskAnalysisList = [
    "发布任务数",
    "被指派任务数",
    "发布的任务（已达标）",
    "发布的任务（待完成）",
    "发布的任务（下单数）",
    "发布的任务（出片数）",
    "被指派的任务（已达标）",
    "被指派的任务（待完成）",
    "被指派的任务（下单数）",
    "被指派的任务（出片数）"
  ];

  // Helper function to extract numeric values for bar length calculation
  const parseVal = (val: number | string | undefined): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const cleaned = val.replace(/[^0-9.]/g, "");
      return parseFloat(cleaned) || 0;
    }
    return 0;
  };

  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const nameA = activeTab === "personal" ? targetA : groupTargetA;
    const nameB = activeTab === "personal" ? targetB : groupTargetB;
    const peopleA = activeTab === "personal" ? [targetA] : groupMembers(groupTargetA);
    const peopleB = activeTab === "personal" ? [targetB] : groupMembers(groupTargetB);
    const profileA = profileForRange(nameA, peopleA, request.startDate, request.endDate);
    const profileB = profileForRange(nameB, peopleB, request.startDate, request.endDate);
    const fileName = await exportAnalyticsRows([
      ["指标分类", "指标", profileA.name, profileB.name],
      ...RADAR_AXES.map(axis => ["雷达图分析", axis.label, profileA.radar[axis.key], profileB.radar[axis.key]]),
      ...dataAnalysisList.map(metric => ["数据分析", metric, profileA.dataAnalysis[metric] ?? 0, profileB.dataAnalysis[metric] ?? 0]),
      ...taskAnalysisList.map(metric => ["任务分析", metric, profileA.taskAnalysis[metric] ?? 0, profileB.taskAnalysis[metric] ?? 0]),
    ], request, "数据洞察");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ================= 1. Top Header Banner (Purple/Blue Gradient) Matches Screenshots 1 & 2 ================= */}
      <div className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Top Left Navigation Tabs */}
          <div className="flex items-center gap-2 border-b lg:border-b-0 border-white/20 pb-3 lg:pb-0">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "personal"
                  ? "bg-white/20 backdrop-blur-md text-white shadow-2xs border border-white/30"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <User className="w-4 h-4" />
              <span>个人数据洞察</span>
            </button>

            <button
              onClick={() => setActiveTab("group")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "group"
                  ? "bg-white/20 backdrop-blur-md text-white shadow-2xs border border-white/30"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>小组数据洞察</span>
            </button>
          </div>

          {/* Center PK Controls + Leadership Insights Button */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {activeTab === "personal" ? (
                <>
                  {/* Target A Dropdown */}
                  <select
                    value={targetA}
                    onChange={(e) => setTargetA(e.target.value)}
                    className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold outline-none cursor-pointer focus:bg-white/30"
                  >
                    {report.org.members.map(member => member.name).map(name => <option key={name} value={name} className="text-slate-800">{name}</option>)}
                  </select>

                  {/* VS Badge */}
                  <div className="px-2 py-0.5 bg-white/30 rounded-lg text-xs font-black italic tracking-wider shadow-2xs">
                    VS
                  </div>

                  {/* Target B Dropdown */}
                  <select
                    value={targetB}
                    onChange={(e) => setTargetB(e.target.value)}
                    className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold outline-none cursor-pointer focus:bg-white/30"
                  >
                    {report.org.members.map(member => member.name).map(name => <option key={name} value={name} className="text-slate-800">{name}</option>)}
                  </select>
                </>
              ) : (
                <>
                  {/* Group Target A Dropdown */}
                  <select
                    value={groupTargetA}
                    onChange={(e) => setGroupTargetA(e.target.value)}
                    className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold outline-none cursor-pointer focus:bg-white/30"
                  >
                    {groupNames.map(name => <option key={name} value={name} className="text-slate-800">{name}</option>)}
                  </select>

                  {/* VS Badge */}
                  <div className="px-2 py-0.5 bg-white/30 rounded-lg text-xs font-black italic tracking-wider shadow-2xs">
                    VS
                  </div>

                  {/* Group Target B Dropdown */}
                  <select
                    value={groupTargetB}
                    onChange={(e) => setGroupTargetB(e.target.value)}
                    className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold outline-none cursor-pointer focus:bg-white/30"
                  >
                    {groupNames.map(name => <option key={name} value={name} className="text-slate-800">{name}</option>)}
                  </select>
                </>
              )}
            </div>

            {/* 领导力洞察 Button (Centered below VS) */}
            <button
              onClick={() => setShowLeadershipModal(true)}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 border border-white/40 backdrop-blur-md text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>领导力洞察</span>
            </button>
          </div>

          {/* Right Date Range Display */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-1.5 text-xs font-semibold self-start lg:self-auto">
            <Calendar className="w-3.5 h-3.5 text-white/80 shrink-0" />
            <span>
              {startDate} 至 {endDate}
            </span>
          </div>

        </div>
      </div>

      {/* ================= 2. Radar Chart Analysis Section ("雷达图分析") Matches Screenshots 1 & 2 ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>雷达图分析</span>
            <span className="text-xs font-normal text-slate-400">
              ({activeTab === "personal" ? targetA : groupTargetA} 对比 {activeTab === "personal" ? targetB : groupTargetB})
            </span>
          </h2>

          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setExportOpen(true)}
            className="px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            导出
          </button>
        </div>

        {/* Radar Chart Display */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4">
          <SVGInteractiveRadarChart
            dataA={currentProfileA.radar}
            dataB={currentProfileB.radar}
            nameA={currentProfileA.name}
            nameB={currentProfileB.name}
            size={380}
          />

          {/* Legend */}
          <div className="flex items-center gap-6 mt-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#3B82F6] rounded-sm" />
              <span className="text-slate-700">{currentProfileA.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#8B5CF6] rounded-sm" />
              <span className="text-slate-700">{currentProfileB.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. Data Analysis Comparative Bars ("数据分析") Matches Screenshot 3 ================= */}
      <div className="bg-[#F4F5FD] rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900">数据分析</h2>

        <div className="space-y-4 max-w-2xl mx-auto">
          {dataAnalysisList.map((metricKey) => {
            const rawDataA = currentProfileA.dataAnalysis[metricKey] ?? 0;
            const rawDataB = currentProfileB.dataAnalysis[metricKey] ?? 0;

            const numA = parseVal(rawDataA);
            const numB = parseVal(rawDataB);

            const total = Math.max(1, numA + numB);
            const pctA = Math.round((numA / total) * 100);
            const pctB = Math.round((numB / total) * 100);

            return (
              <div key={metricKey} className="space-y-1.5 text-center">
                {/* Metric Title */}
                <div className="text-xs font-bold text-slate-700">{metricKey}</div>

                {/* Numeric Comparison Values */}
                <div className="flex items-center justify-center gap-4 text-xs font-mono font-bold">
                  <span className="text-[#3B82F6]">{rawDataA}</span>
                  <span className="text-[#8B5CF6]">{rawDataB}</span>
                </div>

                {/* Comparative Horizontal Bar */}
                <div className="h-3.5 bg-slate-200/80 rounded-full overflow-hidden flex max-w-md mx-auto shadow-inner">
                  <div
                    className="bg-[#3B82F6] h-full transition-all duration-500"
                    style={{ width: `${pctA}%` }}
                    title={`${currentProfileA.name}: ${rawDataA}`}
                  />
                  <div
                    className="bg-[#8B5CF6] h-full transition-all duration-500"
                    style={{ width: `${pctB}%` }}
                    title={`${currentProfileB.name}: ${rawDataB}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 4. Task Analysis Comparative Bars ("任务分析") Matches Screenshot 4 ================= */}
      <div className="bg-[#F4F5FD] rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900">任务分析</h2>

        <div className="space-y-4 max-w-2xl mx-auto">
          {taskAnalysisList.map((metricKey) => {
            const rawDataA = currentProfileA.taskAnalysis[metricKey] ?? 0;
            const rawDataB = currentProfileB.taskAnalysis[metricKey] ?? 0;

            const numA = parseVal(rawDataA);
            const numB = parseVal(rawDataB);

            const total = Math.max(1, numA + numB);
            const pctA = Math.round((numA / total) * 100);
            const pctB = Math.round((numB / total) * 100);

            return (
              <div key={metricKey} className="space-y-1.5 text-center">
                {/* Metric Title */}
                <div className="text-xs font-bold text-slate-700">{metricKey}</div>

                {/* Numeric Comparison Values */}
                <div className="flex items-center justify-center gap-4 text-xs font-mono font-bold">
                  <span className="text-[#3B82F6]">{rawDataA}</span>
                  <span className="text-[#8B5CF6]">{rawDataB}</span>
                </div>

                {/* Comparative Horizontal Bar */}
                <div className="h-3.5 bg-slate-200/80 rounded-full overflow-hidden flex max-w-md mx-auto shadow-inner">
                  <div
                    className="bg-[#3B82F6] h-full transition-all duration-500"
                    style={{ width: `${pctA}%` }}
                    title={`${currentProfileA.name}: ${rawDataA}`}
                  />
                  <div
                    className="bg-[#8B5CF6] h-full transition-all duration-500"
                    style={{ width: `${pctB}%` }}
                    title={`${currentProfileB.name}: ${rawDataB}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 5. "领导力洞察" Modal Matches Screenshot 5 ================= */}
      {showLeadershipModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#7C3AED]" />
                <span>领导力洞察</span>
              </h3>
              <button
                onClick={() => setShowLeadershipModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Selectors inside Modal */}
            <div className="flex items-center justify-center gap-3 text-xs">
              <div className="w-3.5 h-3.5 bg-[#3B82F6] rounded-xs shrink-0" />
              <select
                value={leadershipA}
                onChange={(e) => setLeadershipA(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {leaders.map(name => <option key={name} value={name} className="text-slate-800">{name}</option>)}
                  </select>

              <span className="font-black text-[#7C3AED] italic text-sm">PK</span>

              <select
                value={leadershipB}
                onChange={(e) => setLeadershipB(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {leaders.map(name => <option key={name} value={name} className="text-slate-800">{name}</option>)}
                  </select>
              <div className="w-3.5 h-3.5 bg-[#8B5CF6] rounded-xs shrink-0" />
            </div>

            {/* Radar Chart */}
            <div className="flex justify-center">
              <SVGInteractiveRadarChart
                dataA={profile(leadershipA, leaderMembers(report.org, leadershipA)).radar}
                dataB={profile(leadershipB, leaderMembers(report.org, leadershipB)).radar}
                nameA={leadershipA}
                nameB={leadershipB}
                size={340}
              />
            </div>

          </div>
        </div>
      )}
      <AnalyticsExportDialog
        open={exportOpen}
        pageName="数据洞察"
        filters={[
          { label: "洞察类型", value: activeTab === "personal" ? "个人数据洞察" : "小组数据洞察" },
          { label: "对比对象A", value: activeTab === "personal" ? targetA : groupTargetA },
          { label: "对比对象B", value: activeTab === "personal" ? targetB : groupTargetB },
        ]}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setExportOpen(false)}
        onConfirm={handleExport}
      />
    </div>
  );
}
