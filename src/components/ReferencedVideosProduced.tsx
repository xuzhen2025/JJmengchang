import React, { useState, useRef, useMemo } from "react";
import ReferenceVideoCard from "./ReferenceVideoCard";
import { producedReferenceCard } from "../lib/referenceVideoCards";
import ReferencedVideoFilters from "./ReferencedVideoFilters";
import { useReportOrganization } from "../lib/analyticsOrganization";
import { REPORT_TODAY, shiftDate, money, fmt, percent } from "../lib/reportDemoData";
import { createReferencedVideoExamples, selectReferencedVideos, referencedVideoTotals, type ReferenceFilters } from "../lib/referencedVideoData";
import {
  Calendar,
  ChevronDown,
  HelpCircle,
  Zap,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Eye,
  Play,
  MousePointer,
  Percent,
  Film,
  Tag,
  Ticket,
  Share2
} from "lucide-react";

interface ReferencedVideosProducedProps {
  hideTitle?: boolean;
  hideCardWrapper?: boolean;
}

export default function ReferencedVideosProduced({
  hideTitle = false,
  hideCardWrapper = false
}: ReferencedVideosProducedProps = {}) {
  const [sortOrder, setSortOrder] = useState("按关联时间排序");
  const organization = useReportOrganization();
  const [filters, setFilters] = useState<ReferenceFilters>({ dimension: "author", entityId: "", upload: { start: "", end: "" } });
  const [spend, setSpend] = useState({ start: shiftDate(REPORT_TODAY, -6), end: REPORT_TODAY });
  const examples = useMemo(() => createReferencedVideoExamples(organization), [organization]);
  const videos = useMemo(() => selectReferencedVideos(examples, organization, filters, sortOrder), [examples, organization, filters, sortOrder]);
  const totals = useMemo(() => referencedVideoTotals(videos, spend), [videos, spend]);
  const metricValues = [money(totals.cost), totals.roi.toFixed(2), money(totals.paid), money(totals.coupon), money(totals.totalAmount), money(totals.subsidy), fmt(totals.conversions),
    percent(totals.cvr), money(totals.cpa), fmt(totals.impressions), money(totals.cpm), fmt(totals.clicks), percent(totals.ctr), money(totals.cpc), fmt(totals.plays),
    percent(totals.completionRate), percent(totals.effectivePlayRate), percent(totals.finish3sRate), money(totals.netAmount), fmt(totals.netOrders), totals.netRoi.toFixed(2), money(totals.netCpa)];
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const metricCards = [
    { id: 1, label: "消耗", value: "¥ 0", icon: <Zap className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 2, label: "ROI", value: "0", hasHelp: true, helpText: "投流广告产生的投资回报率", icon: <TrendingUp className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 3, label: "成交金额", value: "¥ 0", icon: <DollarSign className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 4, label: "智能优惠券", value: "¥ 0", icon: <Ticket className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 5, label: "总成交金额", value: "¥ 0", icon: <DollarSign className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 6, label: "电商平台补贴金额", value: "¥ 0", icon: <DollarSign className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 7, label: "转化数", value: "0", icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 8, label: "转化率", value: "0%", icon: <BarChart3 className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 9, label: "转化成本", value: "¥ 0", icon: <Tag className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 10, label: "展示数", value: "0", icon: <Eye className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 11, label: "平均千次展现费用", value: "¥ 0", hasHelp: true, helpText: "每展示1000次的平均推广花费(CPM)", icon: <BarChart3 className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 12, label: "点击数", value: "0", icon: <MousePointer className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 13, label: "点击率", value: "0%", icon: <Percent className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 14, label: "平均点击单价", value: "¥ 0", icon: <DollarSign className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 15, label: "播放量", value: "0", icon: <Play className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 16, label: "完播率", value: "0%", icon: <Play className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    {
      id: 17,
      label: "有效播放率",
      value: "0%",
      hasRedHelp: true,
      redHelpText: "由于巨量部分字段未提供，数据无法与官方保持一致\n巨量计算公式: 播放时长超过3秒的次数/播放数，播放时长以播放终止时所在的视频时长来计算，包含拖拽等行为\n云管家计算公式: (有效播放数 / 总播放) * 100%",
      icon: <Film className="w-3.5 h-3.5 text-blue-600" />,
      iconBg: "bg-blue-100"
    },
    {
      id: 18,
      label: "千川3S完播率",
      value: "0%",
      hasRedHelp: true,
      redHelpText: "千川平台统计3秒完播率计算公式",
      icon: <Film className="w-3.5 h-3.5 text-blue-600" />,
      iconBg: "bg-blue-100"
    },
    { id: 19, label: "净成交金额", value: "¥ 0", icon: <DollarSign className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" },
    { id: 20, label: "净成交订单数", value: "0", icon: <BarChart3 className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 21, label: "净成交ROI", value: "0", icon: <TrendingUp className="w-3.5 h-3.5 text-blue-600" />, iconBg: "bg-blue-100" },
    { id: 22, label: "净成交订单成本", value: "¥ 0", icon: <DollarSign className="w-3.5 h-3.5 text-purple-600" />, iconBg: "bg-purple-100" }
  ].map(card => ({ ...card, value: metricValues[card.id - 1] }));

  return (
    <div data-testid="referenced-videos-produced" className={`reference-cards-section ${hideCardWrapper ? "space-y-4" : "bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4"}`}>
      {/* Top Header & Global Date Range Indicator (Hidden if hideTitle is true) */}
      {!hideTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <h3 className="text-sm font-extrabold text-purple-700 flex items-center gap-1.5 pb-1">
                <span>被引用后出片</span>
              </h3>
              <div className="w-8 h-1 bg-purple-600 rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-600 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{spend.start || "不限"} 至 {spend.end || "不限"}</span>
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 text-xs">
        {/* Sort Order Dropdown */}
        <div className="relative">
          <select
            aria-label="引用成片排序"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer appearance-none pr-7 shadow-2xs"
          >
            <option value="按关联时间排序">按关联时间排序</option>
            <option value="按消耗金额排序">按消耗金额排序</option>
            <option value="按ROI高到低排序">按ROI高到低排序</option>
            <option value="按转化数排序">按转化数排序</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        <ReferencedVideoFilters organization={organization} filters={filters} spend={spend} onFilterChange={setFilters} onSpendChange={setSpend} />

        {/* Export Dropdown Button */}
        <div className="ml-auto">
          <button
            onClick={() => alert("🎉 已成功导出成片数据分析报表 (Excel)！")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
          >
            <span>导出</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Metric Cards Container */}
      <div className="relative group">
        {/* Scrollable Cards Wrapper */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 px-1"
        >
          {metricCards.map((card) => (
            <div
              key={card.id}
              data-testid={`reference-metric-${card.id}`}
              className="w-[145px] shrink-0 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-[68px] hover:border-purple-300 hover:shadow-xs transition-all relative group/card"
            >
              {/* Top Row: Value + Optional Help Icon */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-black text-slate-900 font-mono tracking-tight leading-none">
                  {card.value}
                </span>

                {card.hasHelp && (
                  <div className="relative group/tooltip">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-purple-600 cursor-pointer" />
                    <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/tooltip:block z-50 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl font-normal leading-normal whitespace-pre-wrap">
                      {card.helpText}
                    </div>
                  </div>
                )}

                {card.hasRedHelp && (
                  <div className="relative group/tooltip">
                    <HelpCircle className="w-3.5 h-3.5 text-red-500 fill-red-100 hover:text-red-600 cursor-pointer" />
                    <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/tooltip:block z-50 w-64 p-2.5 bg-slate-900 text-white text-[10px] rounded-xl shadow-2xl font-normal leading-relaxed whitespace-pre-wrap border border-slate-700">
                      {card.redHelpText}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Row: Label + Icon */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="truncate pr-1">{card.label}</span>
                <div className={`w-5 h-5 rounded-full ${card.iconBg} flex items-center justify-center shrink-0`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 引用后所出成片列表 (Derived Finished Videos List) */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-black text-slate-800">引用后所出成片列表</h4>
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              {videos.length} 条
            </span>
          </div>
          <span className="text-[11px] text-slate-400">衍生视频数据实时同步中</span>
        </div>

        <div data-testid="reference-result-list" className="flex flex-wrap items-start gap-3">
          {videos.map(video => <ReferenceVideoCard key={video.id} video={producedReferenceCard(video)} scope="finished" />)}
          {!videos.length && <div role="status" className="w-full py-10 text-center text-sm text-slate-400">暂无符合条件的成片</div>}
        </div>
      </div>
    </div>
  );
}
