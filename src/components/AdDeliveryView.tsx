import React, { useEffect, useState } from "react";
import PlatformTagsView from "./PlatformTagsView";
import TagAnalyticsView from "./TagAnalyticsView";
import AdAccountDataView from "./AdAccountDataView";
import AccountFinanceReportView from "./AccountFinanceReportView";
import DeliveryStatusReportView from "./DeliveryStatusReportView";
import DataInsightsView from "./DataInsightsView";
import CreationAnalyticsView from "./CreationAnalyticsView";
import TaskAnalyticsView from "./TaskAnalyticsView";
import AdPlatformAnalysisView from "./AdPlatformAnalysisView";
import { 
  BarChart3, Video, Users, Activity, Tag, Tv, FileText, 
  DollarSign, PieChart, ShieldCheck, ShoppingBag, Brain, 
  Sparkles, ListTodo, LineChart, Server, Cpu, HardDrive, 
  Search, Filter, RefreshCw, Download, Plus, ArrowUpRight, 
  TrendingUp, CheckCircle2, AlertCircle, Clock, Check, X
} from "lucide-react";

// --- Category & SubTab Types ---
export type MainCategory = "video_analytics" | "account_analytics" | "team_analytics";

export type SubTabMap = {
  video_analytics: "platform_tags" | "tag_analytics" | "ad_platform_analysis";
  account_analytics: "account_data" | "financial_report" | "status_report";
  team_analytics: "data_insights" | "creation_analytics" | "task_analytics";
};

export default function AdDeliveryView({ initialDerivativeId }: { initialDerivativeId?: string }) {
  const [activeCategory, setActiveCategory] = useState<MainCategory>("video_analytics");
  const [activeSubTab, setActiveSubTab] = useState<string>("ad_platform_analysis");
  useEffect(() => {
    if (initialDerivativeId) { setActiveCategory("video_analytics"); setActiveSubTab("ad_platform_analysis"); }
  }, [initialDerivativeId]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [toast, setToast] = useState<{ show: boolean; title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToast({ show: true, title, desc });
    setTimeout(() => setToast(null), 3000);
  };

  // Major categories configuration
  const categories = [
    {
      id: "video_analytics" as MainCategory,
      name: "视频数据分析",
      icon: Video,
      subTabs: [
        { id: "ad_platform_analysis", name: "广告平台分析" },
        { id: "platform_tags", name: "广告平台标签" },
        { id: "tag_analytics", name: "标签分析" },
      ]
    },
    {
      id: "account_analytics" as MainCategory,
      name: "广告账户分析",
      icon: PieChart,
      subTabs: [
        { id: "account_data", name: "广告账户数据" },
        { id: "financial_report", name: "广告账户财务报表" },
        { id: "status_report", name: "投放状态报表" },
      ]
    },
    {
      id: "team_analytics" as MainCategory,
      name: "部门分析",
      icon: Users,
      subTabs: [
        { id: "data_insights", name: "数据洞察" },
        { id: "creation_analytics", name: "创作分析" },
        { id: "task_analytics", name: "任务分析" },
      ]
    }
  ];

  // Handle Category Switch
  const handleCategoryChange = (catId: MainCategory) => {
    setActiveCategory(catId);
    const catObj = categories.find(c => c.id === catId);
    if (catObj && catObj.subTabs.length > 0) {
      setActiveSubTab(catObj.subTabs[0].id);
    }
  };

  const currentCategoryObj = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-full bg-slate-50/50 p-6 font-sans text-slate-800 space-y-6 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">{toast.title}</div>
            <div className="text-[11px] text-slate-300">{toast.desc}</div>
          </div>
        </div>
      )}



      {/* Redesigned Compact Category & Sub-Tab Navigation Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Level 1 Categories (一级目录) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-50/70 border-b border-slate-100 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white text-[#7C3AED] shadow-2xs border border-purple-200/80 ring-1 ring-purple-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#7C3AED]" : "text-slate-400"}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Level 2 Sub-Tabs (二级目录) */}
        {currentCategoryObj && (
          <div className="flex items-center gap-1.5 p-2 overflow-x-auto bg-white">
            {currentCategoryObj.subTabs.map((sub) => {
              const isSubActive = activeSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSubActive
                      ? "bg-[#7C3AED] text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-Tab Content View Router */}
      <div className="space-y-6">
        {/* ================= 视频数据分析 (Video Analytics) ================= */}
        {activeCategory === "video_analytics" && (
          <>
            {/* 1. 广告平台标签 */}
            {activeSubTab === "platform_tags" && (
              <PlatformTagsView showToast={showToast} />
            )}

            {/* 2. 标签分析 */}
            {activeSubTab === "tag_analytics" && (
              <TagAnalyticsView showToast={showToast} />
            )}

            {/* 3. 广告平台分析 */}
            {activeSubTab === "ad_platform_analysis" && (
              <AdPlatformAnalysisView showToast={showToast} initialDerivativeId={initialDerivativeId} />
            )}
          </>
        )}

        {/* ================= 广告账户分析 (Account Analytics) ================= */}
        {activeCategory === "account_analytics" && (
          <>
            {/* 1. 广告账户数据 */}
            {activeSubTab === "account_data" && (
              <AdAccountDataView showToast={showToast} />
            )}

            {/* 2. 广告账户财务报表 */}
            {activeSubTab === "financial_report" && (
              <AccountFinanceReportView showToast={showToast} />
            )}

            {/* 3. 投放状态报表 */}
            {activeSubTab === "status_report" && (
              <DeliveryStatusReportView showToast={showToast} />
            )}
          </>
        )}

        {/* ================= 部门分析 (Department Analytics) ================= */}
        {activeCategory === "team_analytics" && (
          <>
            {/* 1. 数据洞察 */}
            {activeSubTab === "data_insights" && (
              <DataInsightsView showToast={showToast} />
            )}

            {/* 2. 创作分析 */}
            {activeSubTab === "creation_analytics" && (
              <CreationAnalyticsView showToast={showToast} />
            )}

            {/* 3. 任务分析 */}
            {activeSubTab === "task_analytics" && (
              <TaskAnalyticsView showToast={showToast} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
