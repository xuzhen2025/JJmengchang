import React, { useState } from "react";
import { 
  FolderHeart, 
  Video, 
  FileText, 
  ListTodo, 
  Tag, 
  FolderTree, 
  Copy, 
  Sparkles, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Plus, 
  Eye, 
  TrendingUp, 
  Play, 
  Layers,
  BarChart2,
  FileCheck,
  Zap,
  Check
} from "lucide-react";
import AdminResourceView from "./AdminResourceView";
import CategoryManagementSubView from "./CategoryManagementSubView";
import PlatformTagsView from "./PlatformTagsView";
import VideoStatusManagementView from "./VideoStatusManagementView";
import ScriptStatusManagementView from "./ScriptStatusManagementView";
import TaskFieldsManagementView from "./TaskFieldsManagementView";
import TagGroupManagementView from "./TagGroupManagementView";
import ScriptTemplateManagementView from "./ScriptTemplateManagementView";
import AdminSystemManagementView from "./AdminSystemManagementView";
import AdminCreditsManagementView from "./AdminCreditsManagementView";
import AdminProfileView from "./AdminProfileView";

interface AdminViewProps {
  adminActiveScreen: string;
  onTriggerTask?: (type: any, name: string, inputFiles: string[], cost: number) => void;
  onOpenTaskQueue?: () => void;
  onLogout: () => void;
}

type ContentTabType = 
  | "resource_hub"
  | "video_status"
  | "script_status"
  | "tasks"
  | "tags"
  | "categories"
  | "script_templates";

export default function AdminView({ adminActiveScreen, onTriggerTask, onOpenTaskQueue, onLogout }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<ContentTabType>("resource_hub");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const navTabs: { id: ContentTabType; label: string; icon: any; desc: string }[] = [
    { id: "resource_hub", label: "资源库", icon: FolderHeart, desc: "成片/素材/第三方/脚本/图片/音频统一管理" },
    { id: "video_status", label: "视频状态", icon: Video, desc: "渲染成片/审片流转/投放状态监控" },
    { id: "script_status", label: "脚本状态", icon: FileText, desc: "文案拆解/AI分镜/审核归档状态" },
    { id: "tasks", label: "任务", icon: ListTodo, desc: "后台AI生成与批量渲染任务监控" },
    { id: "tags", label: "公共标签", icon: Tag, desc: "受众偏好与平台爆款标签体系" },
    { id: "categories", label: "分类管理", icon: FolderTree, desc: "多级类目架构与业务属性划分" },
    { id: "script_templates", label: "脚本模板", icon: Copy, desc: "结构化文案框架与AI创作模版" },
  ];

  const handleTabClick = (tabId: ContentTabType) => {
    setActiveTab(tabId);
    if (tabId === "tasks" && onOpenTaskQueue) {
      onOpenTaskQueue();
    }
  };

  // Mock data for Video Status
  const videoStatusList = [
    { id: "V-2026-001", title: "【防晒霜】高颜值清爽不黏腻种草短视频", author: "张小梅", dept: "电商1组", status: "已完成", date: "2026-08-11 14:20", duration: "00:45", runs: 128 },
    { id: "V-2026-002", title: "【智能降噪耳机】深度测评对比画质增强版", author: "李强", dept: "品牌2组", status: "渲染中", date: "2026-08-11 15:05", duration: "01:12", runs: 45 },
    { id: "V-2026-003", title: "【夏季清凉女装】穿搭走秀多视角切片", author: "王芳", dept: "服装推广部", status: "待审核", date: "2026-08-11 11:30", duration: "00:30", runs: 210 },
    { id: "V-2026-004", title: "【空气炸锅】无油低卡美食制作过程", author: "赵天", dept: "家电业务部", status: "投放中", date: "2026-08-10 18:45", duration: "01:05", runs: 530 },
    { id: "V-2026-005", title: "【抗衰精华】实验室成分科普旁白版", author: "陈明", dept: "护肤项目组", status: "违规下架", date: "2026-08-09 09:12", duration: "00:50", runs: 12 },
  ];

  // Mock data for Script Status
  const scriptStatusList = [
    { id: "S-101", name: "护肤品痛点突破三段式口播文案", category: "美妆护肤", status: "AI分镜拆解中", author: "梁靖淇", updatedAt: "2026-08-11 16:00", words: 380 },
    { id: "S-102", name: "数码爆款沉浸式开箱评测脚本", category: "3C数码", status: "已生成视频", author: "汤小真", updatedAt: "2026-08-11 12:15", words: 520 },
    { id: "S-103", name: "限时买一赠一开场黄金3秒吸睛台词", category: "通用电商", status: "草稿", author: "刘建国", updatedAt: "2026-08-10 19:30", words: 210 },
    { id: "S-104", name: "服饰秋冬新品走秀情感共鸣脚本", category: "服装鞋帽", status: "爆款归档", author: "周华", updatedAt: "2026-08-08 10:20", words: 640 },
  ];

  // Mock data for Script Templates
  const scriptTemplates = [
    { id: "T-01", title: "黄金3秒痛点直击型", tag: "高转化", scenario: "美妆/日化/食品", structure: "场景痛点 -> 效果实测 -> 限时福利", usageCount: "2,410 次" },
    { id: "T-02", title: "沉浸式前后对比测评", tag: "强视觉", scenario: "3C数码/家居/小家电", structure: "传统困扰 vs 极致体验 -> 原理解析 -> 引导下单", usageCount: "1,890 次" },
    { id: "T-03", title: "种草剧情与反转剧本", tag: "高完播", scenario: "服装穿搭/剧情号/生活方式", structure: "日常冲突 -> 意外发现 -> 产品救场 -> 真实推荐", usageCount: "3,120 次" },
    { id: "T-04", title: "专家成分科普旁白型", tag: "高背书", scenario: "大健康/高端护肤/母婴", structure: "行业误区 -> 核心成分透析 -> 权威认证 -> 优惠福利", usageCount: "1,450 次" },
  ];

  if (adminActiveScreen === "system_management") {
    return <AdminSystemManagementView />;
  }

  if (adminActiveScreen === "credits_management") {
    return <AdminCreditsManagementView />;
  }

  if (adminActiveScreen === "admin_profile") {
    return <AdminProfileView onLogout={onLogout} />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 text-slate-800 font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 顶部一排导航栏 (与资源库页面风格完全一致) */}
      <div className="pt-4 px-5 pb-1 bg-slate-50 shrink-0 z-30 relative overflow-visible">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs relative overflow-visible">
          <div className="flex items-center justify-between p-1.5 bg-slate-50/70 rounded-xl overflow-visible">
            <div className="flex items-center gap-1.5 min-w-max overflow-visible">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isScriptTemplates = tab.id === "script_templates";

                return (
                  <div key={tab.id} className="relative group/tab">
                    <button
                      onClick={() => handleTabClick(tab.id)}
                      title={isScriptTemplates ? "该模板内容需要看云视频管家系统才能确认" : undefined}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? "bg-white text-[#7C3AED] shadow-2xs border border-purple-200/80 ring-1 ring-purple-100"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#7C3AED]" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                    </button>

                    {isScriptTemplates && (
                      <div className="absolute top-full right-0 mt-2 hidden group-hover/tab:flex items-center gap-1.5 bg-slate-900/95 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xl z-[100] pointer-events-none animate-in fade-in zoom-in-95 duration-100 border border-slate-700/50">
                        <span>该模板内容需要看云视频管家系统才能确认</span>
                        <div className="absolute -top-1 right-5 w-2 h-2 bg-slate-900/95 rotate-45 border-l border-t border-slate-700/50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 选项卡内容区域 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {/* TAB 1: 资源库 */}
        {activeTab === "resource_hub" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AdminResourceView />
          </div>
        )}

        {/* TAB 2: 视频状态 */}
        {activeTab === "video_status" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <VideoStatusManagementView />
          </div>
        )}

        {/* TAB 3: 脚本状态 */}
        {activeTab === "script_status" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScriptStatusManagementView />
          </div>
        )}

        {/* TAB 4: 任务 */}
        {activeTab === "tasks" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <TaskFieldsManagementView />
          </div>
        )}

        {/* TAB 5: 标签 */}
        {activeTab === "tags" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <TagGroupManagementView />
          </div>
        )}

        {/* TAB 6: 分类管理 */}
        {activeTab === "categories" && (
          <div className="flex-1 min-h-0 p-6 animate-fade-in w-full overflow-y-auto">
            <CategoryManagementSubView />
          </div>
        )}

        {/* TAB 7: 脚本模板 */}
        {activeTab === "script_templates" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScriptTemplateManagementView />
          </div>
        )}
      </div>
    </div>
  );
}
