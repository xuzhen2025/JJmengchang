import React, { useState, useMemo } from "react";
import {
  Image as ImageIcon,
  FileCheck,
  FileText,
  Mic,
  Music,
  Video,
  UserCheck,
  Bot,
  Search,
  Plus,
  Filter,
  Trash2,
  Copy,
  ExternalLink,
  Play,
  Pause,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Download,
  Share2,
  Sparkles,
  Layers,
  BarChart3,
  Calendar,
  X,
  History,
  Info,
  ShieldCheck,
  User,
  Building2,
  ListOrdered,
  ChevronRight,
  Check,
  RefreshCw,
  Zap,
  Smile
} from "lucide-react";

import { ECommerceAsset, ECommerceAssetCategory, UsageRecord } from "../types/ecommerceAsset";
import { INITIAL_ECOMMERCE_ASSETS } from "../data/mockEcommerceAssets";

export default function AssetsView() {
  const [assets, setAssets] = useState<ECommerceAsset[]>(INITIAL_ECOMMERCE_ASSETS);
  const [activeCategory, setActiveCategory] = useState<ECommerceAssetCategory | "all" | "recycle">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copyrightFilter, setCopyrightFilter] = useState<string>("all");
  const [authStatusFilter, setAuthStatusFilter] = useState<"all" | "valid" | "warning" | "expired">("all");
  const [sortBy, setSortBy] = useState<"newest" | "usage_desc" | "usage_asc">("usage_desc");

  // 详情弹窗与编辑/预览状态
  const [selectedAsset, setSelectedAsset] = useState<ECommerceAsset | null>(null);
  const [detailTab, setDetailTab] = useState<"preview" | "usage_logs" | "info">("preview");

  // 音频/视频播放状态管理
  const [playingId, setPlayingId] = useState<string | null>(null);

  // 一键复制提示状态
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 新建资产 Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<ECommerceAssetCategory>("image");
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newAvatarStyle, setNewAvatarStyle] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newMotionType, setNewMotionType] = useState("");
  const [newExpireDate, setNewExpireDate] = useState("");
  const [newCertNumber, setNewCertNumber] = useState("");
  const [newCertScope, setNewCertScope] = useState("");
  const [newRefPlatform, setNewRefPlatform] = useState("Douyin");
  const [newRefHighlights, setNewRefHighlights] = useState("");
  const [newTags, setNewTags] = useState("");

  // 新增使用记录 Modal (在详情页内触发)
  const [isAddUsageOpen, setIsAddUsageOpen] = useState(false);
  const [useProjectName, setUseProjectName] = useState("");
  const [useType, setUseType] = useState("AI视频混剪");
  const [usePlatform, setUsePlatform] = useState("Douyin");
  const [useUserName, setUseUserName] = useState("运营-当前用户");

  // 授权到期状态辅助计算逻辑 (核心功能：真人素材/模特增效到期监控)
  const getAuthExpireInfo = (asset: ECommerceAsset) => {
    if (asset.copyrightStatus === "自有版权" && !asset.expireDate) {
      return {
        type: "permanent" as const,
        statusLabel: "自有/永久授权",
        shortLabel: "永久有效",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        pillClass: "bg-emerald-500",
        daysLeft: null,
        isExpired: false,
        isWarning: false,
        riskText: "自有版权/永久授权，无任何到期下架风险"
      };
    }

    if (!asset.expireDate) {
      return {
        type: "valid" as const,
        statusLabel: "授权有效",
        shortLabel: "授权有效",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        pillClass: "bg-emerald-500",
        daysLeft: null,
        isExpired: false,
        isWarning: false,
        riskText: "正在合规授权期限内，可以放心进行混剪与发布"
      };
    }

    // 假设系统当前评估基准时间为 2026-07-24 (与Mock数据逻辑统一)
    const today = new Date("2026-07-24").getTime();
    const expireTime = new Date(asset.expireDate).getTime();
    const diffDays = Math.ceil((expireTime - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        type: "expired" as const,
        statusLabel: `授权已到期 (${asset.expireDate}届满，超期 ${Math.abs(diffDays)} 天)`,
        shortLabel: `已到期 (${Math.abs(diffDays)}天)`,
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
        pillClass: "bg-rose-600",
        daysLeft: diffDays,
        isExpired: true,
        isWarning: false,
        riskText: "⛔ 严重侵权风险！肖像授权已届满，严禁在任何新广告中调用，已有投放请排查下线！"
      };
    }

    if (diffDays <= 30) {
      return {
        type: "warning" as const,
        statusLabel: `授权临期预警 (将于 ${asset.expireDate} 到期，剩 ${diffDays} 天)`,
        shortLabel: `临期 (剩${diffDays}天)`,
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300 font-bold",
        pillClass: "bg-amber-500",
        daysLeft: diffDays,
        isExpired: false,
        isWarning: true,
        riskText: "⚠️ 临期告警：肖像或资质将在30天内到期，请商务部门及时与模特/MCN沟通续约。"
      };
    }

    return {
      type: "valid" as const,
      statusLabel: `授权有效 (至 ${asset.expireDate})`,
      shortLabel: `至 ${asset.expireDate}`,
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      pillClass: "bg-emerald-500",
      daysLeft: diffDays,
      isExpired: false,
      isWarning: false,
      riskText: "合规授权期内，可以正常挂载AI混剪与宣发"
    };
  };

  // 分类统计数
  const categoryCounts = useMemo(() => {
    const activeAssets = assets.filter(a => !a.deletedAt);
    return {
      all: activeAssets.length,
      image: activeAssets.filter(a => a.category === "image").length,
      human_model: activeAssets.filter(a => a.category === "human_model").length,
      digital_human: activeAssets.filter(a => a.category === "digital_human").length,
      qualification: activeAssets.filter(a => a.category === "qualification").length,
      copywriting: activeAssets.filter(a => a.category === "copywriting").length,
      audio: activeAssets.filter(a => a.category === "audio").length,
      bgm: activeAssets.filter(a => a.category === "bgm").length,
      ref_video: activeAssets.filter(a => a.category === "ref_video").length,
      recycle: assets.filter(a => a.deletedAt).length,
    };
  }, [assets]);

  // 真人素材授权到期警报统计
  const humanModelExpireStats = useMemo(() => {
    const activeHumans = assets.filter(a => !a.deletedAt && a.category === "human_model");
    let expiredCount = 0;
    let warningCount = 0;
    let validCount = 0;

    activeHumans.forEach(asset => {
      const info = getAuthExpireInfo(asset);
      if (info.isExpired) expiredCount++;
      else if (info.isWarning) warningCount++;
      else validCount++;
    });

    return {
      total: activeHumans.length,
      expiredCount,
      warningCount,
      validCount
    };
  }, [assets]);

  // 过滤后的列表
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      // 1. 回收站过滤
      if (activeCategory === "recycle") {
        if (!item.deletedAt) return false;
      } else {
        if (item.deletedAt) return false;
        if (activeCategory !== "all" && item.category !== activeCategory) return false;
      }

      // 2. 版权筛选
      if (copyrightFilter !== "all" && item.copyrightStatus !== copyrightFilter) {
        return false;
      }

      // 3. 授权到期状态筛选
      if (authStatusFilter !== "all") {
        const info = getAuthExpireInfo(item);
        if (authStatusFilter === "expired" && !info.isExpired) return false;
        if (authStatusFilter === "warning" && !info.isWarning) return false;
        if (authStatusFilter === "valid" && (info.isExpired || info.isWarning)) return false;
      }

      // 4. 搜索匹配
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchContent = item.content?.toLowerCase().includes(q) || false;
        const matchCert = item.certNumber?.toLowerCase().includes(q) || false;
        const matchStyle = item.avatarStyle?.toLowerCase().includes(q) || false;
        const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
        const matchHighlights = item.refHighlights?.toLowerCase().includes(q) || false;
        if (!matchName && !matchContent && !matchCert && !matchStyle && !matchTags && !matchHighlights) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "usage_desc") return b.usageCount - a.usageCount;
      if (sortBy === "usage_asc") return a.usageCount - b.usageCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [assets, activeCategory, copyrightFilter, authStatusFilter, searchQuery, sortBy]);

  // 总引用次数统计
  const totalUsageCount = useMemo(() => {
    return assets.filter(a => !a.deletedAt).reduce((acc, curr) => acc + curr.usageCount, 0);
  }, [assets]);

  // 软删除与恢复
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssets(prev => prev.map(a => a.id === id ? { ...a, deletedAt: new Date().toISOString() } : a));
    if (selectedAsset?.id === id) setSelectedAsset(null);
  };

  const handleRestore = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssets(prev => prev.map(a => a.id === id ? { ...a, deletedAt: undefined } : a));
  };

  // 复制文本功能
  const handleCopyText = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 添加新使用记录
  const handleAddUsageRecord = () => {
    if (!selectedAsset || !useProjectName) return;
    const newLog: UsageRecord = {
      id: `use-${Date.now()}`,
      projectName: useProjectName,
      usedAt: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-"),
      usedBy: useUserName,
      usageType: useType,
      targetPlatform: usePlatform
    };

    const updatedAssets = assets.map(a => {
      if (a.id === selectedAsset.id) {
        const newLogs = [newLog, ...a.usageLogs];
        return {
          ...a,
          usageCount: a.usageCount + 1,
          usageLogs: newLogs
        };
      }
      return a;
    });

    setAssets(updatedAssets);
    const currentUpdated = updatedAssets.find(a => a.id === selectedAsset.id);
    if (currentUpdated) setSelectedAsset(currentUpdated);

    setIsAddUsageOpen(false);
    setUseProjectName("");
  };

  // 创建新资产
  const handleCreateAsset = () => {
    if (!newName.trim()) return;

    const created: ECommerceAsset = {
      id: `asset-${Date.now()}`,
      name: newName,
      category: newCategory,
      url: newUrl || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
      content: newContent,
      avatarStyle: newAvatarStyle,
      gender: newGender,
      motionType: newMotionType,
      certNumber: newCertNumber,
      certScope: newCertScope,
      refPlatform: newRefPlatform,
      refHighlights: newRefHighlights,
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-"),
      creator: "当前登录账号",
      tags: newTags ? newTags.split(/[,，\s]+/).filter(Boolean) : ["新增资源", "电商素材"],
      copyrightStatus: newCategory === "human_model" ? "已授权" : "自有版权",
      expireDate: newExpireDate || (newCategory === "human_model" ? "2027-12-31" : undefined),
      usageCount: 0,
      usageLogs: [],
      notes: "手动录入的资源素材"
    };

    setAssets([created, ...assets]);
    setIsCreateModalOpen(false);
    // 重置表单
    setNewName("");
    setNewContent("");
    setNewUrl("");
    setNewAvatarStyle("");
    setNewGender("");
    setNewMotionType("");
    setNewExpireDate("");
    setNewCertNumber("");
    setNewCertScope("");
    setNewRefHighlights("");
    setNewTags("");
  };

  // 渲染分类 Tab 标牌图标
  const getCategoryIcon = (cat: ECommerceAssetCategory) => {
    switch (cat) {
      case "image": return <ImageIcon className="w-3.5 h-3.5 text-sky-500" />;
      case "human_model": return <UserCheck className="w-3.5 h-3.5 text-rose-500" />;
      case "digital_human": return <Bot className="w-3.5 h-3.5 text-blue-500" />;
      case "qualification": return <FileCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case "copywriting": return <FileText className="w-3.5 h-3.5 text-amber-500" />;
      case "audio": return <Mic className="w-3.5 h-3.5 text-purple-500" />;
      case "bgm": return <Music className="w-3.5 h-3.5 text-pink-500" />;
      case "ref_video": return <Video className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const getCategoryLabel = (cat: ECommerceAssetCategory) => {
    switch (cat) {
      case "image": return "图片素材";
      case "human_model": return "真人素材";
      case "digital_human": return "数字人";
      case "qualification": return "资质备案";
      case "copywriting": return "爆款文案";
      case "audio": return "口播音频";
      case "bgm": return "BGM音乐";
      case "ref_video": return "第三方参考视频";
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 pb-24 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 顶部标语与概览指标卡 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 font-bold text-xs px-2.5 py-1 rounded-md">
              电商全要素素材中心
            </span>
            <span className="text-xs text-slate-400">集中管理·快速调用·精准追溯</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">资源资产库</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            集中集中管理图片、真人模特/KOC、数字人、资质文件、爆款文案、口播音频、BGM和第三方参考视频，全程记录使用日志。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer hover:shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            <span>新增资源/录入素材</span>
          </button>
        </div>
      </div>

      {/* 5大关键核心指标 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">总资源素材</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{categoryCounts.all} <span className="text-xs text-slate-400 font-normal">项</span></div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0 relative">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            {(humanModelExpireStats.expiredCount > 0 || humanModelExpireStats.warningCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">真人素材/KOC</div>
            <div className="text-lg sm:text-xl font-bold text-rose-600 flex items-baseline gap-1">
              <span>{categoryCounts.human_model}</span>
              <span className="text-xs text-slate-400 font-normal">项</span>
              {humanModelExpireStats.expiredCount > 0 && (
                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold ml-1">
                  {humanModelExpireStats.expiredCount}已到期
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">数字人形象</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">{categoryCounts.digital_human} <span className="text-xs text-slate-400 font-normal">个</span></div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">调用引用累计</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-600">{totalUsageCount} <span className="text-xs text-slate-400 font-normal">次</span></div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">资质备案</div>
            <div className="text-lg sm:text-xl font-bold text-indigo-600">{categoryCounts.qualification} <span className="text-xs text-slate-400 font-normal">份</span></div>
          </div>
        </div>
      </div>

      {/* 真人素材与资质肖像权授权到期预警 Banner (高亮安全监控栏) */}
      {(humanModelExpireStats.expiredCount > 0 || humanModelExpireStats.warningCount > 0) && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-rose-950 text-sm flex items-center gap-2">
                <span>肖像权/版权授权到期监控预警</span>
                <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  侵权风控
                </span>
              </div>
              <p className="text-slate-700 mt-0.5">
                真人素材库中现有 <strong className="text-rose-600 font-extrabold">{humanModelExpireStats.expiredCount}</strong> 项模特授权已到期届满，
                <strong className="text-amber-700 font-extrabold">{humanModelExpireStats.warningCount}</strong> 项将在30天内到期！已到期肖像禁用于新AI剪辑投放，请排查下架。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {humanModelExpireStats.expiredCount > 0 && (
              <button
                onClick={() => {
                  setActiveCategory("human_model");
                  setAuthStatusFilter("expired");
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>仅看已到期 ({humanModelExpireStats.expiredCount})</span>
              </button>
            )}
            {humanModelExpireStats.warningCount > 0 && (
              <button
                onClick={() => {
                  setActiveCategory("human_model");
                  setAuthStatusFilter("warning");
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>仅看临期预警 ({humanModelExpireStats.warningCount})</span>
              </button>
            )}
            {authStatusFilter !== "all" && (
              <button
                onClick={() => setAuthStatusFilter("all")}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all cursor-pointer"
              >
                重置筛选
              </button>
            )}
          </div>
        </div>
      )}

      {/* 资产分类 Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 flex flex-wrap gap-1 shadow-xs">
        {[
          { id: "all", label: "全部素材", icon: Layers, count: categoryCounts.all },
          { id: "image", label: "图片素材", icon: ImageIcon, count: categoryCounts.image },
          { id: "human_model", label: "真人素材", icon: UserCheck, count: categoryCounts.human_model, badge: humanModelExpireStats.expiredCount > 0 ? `${humanModelExpireStats.expiredCount}到期` : null },
          { id: "digital_human", label: "数字人", icon: Bot, count: categoryCounts.digital_human },
          { id: "qualification", label: "资质备案", icon: FileCheck, count: categoryCounts.qualification },
          { id: "copywriting", label: "爆款文案", icon: FileText, count: categoryCounts.copywriting },
          { id: "audio", label: "口播音频", icon: Mic, count: categoryCounts.audio },
          { id: "bgm", label: "BGM音乐", icon: Music, count: categoryCounts.bgm },
          { id: "ref_video", label: "第三方参考视频", icon: Video, count: categoryCounts.ref_video },
          { id: "recycle", label: "回收站", icon: Trash2, count: categoryCounts.recycle },
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer relative ${
                isActive
                  ? "bg-purple-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? "bg-purple-700 text-purple-100" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
              {tab.badge && !isActive && (
                <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1 rounded-full animate-pulse ml-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 搜索与工具过滤栏 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 搜索输入 */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索素材名称、模特形象风格、文案内容、资质号、标签或到期状态..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              清除
            </button>
          )}
        </div>

        {/* 筛选与排序 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 授权/到期状态筛选选择框 (针对真人素材特化) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>授权到期状态:</span>
            <select
              value={authStatusFilter}
              onChange={(e) => setAuthStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">全部授权状态</option>
              <option value="valid">🟢 授权有效 (未到期)</option>
              <option value="warning">⚠️ 临期预警 (30天内到期)</option>
              <option value="expired">🔴 授权已到期 (严重违规风险)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>版权:</span>
            <select
              value={copyrightFilter}
              onChange={(e) => setCopyrightFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">全部类型</option>
              <option value="自有版权">自有版权</option>
              <option value="已授权">已授权</option>
              <option value="限制使用">限制使用</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
            <span>排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="usage_desc">引用次数最高</option>
              <option value="usage_asc">引用次数最低</option>
              <option value="newest">最新上传</option>
            </select>
          </div>
        </div>
      </div>

      {/* 资产卡片网格列表：按用户要求调整为 4-5 个一行 (xl:grid-cols-5, lg:grid-cols-4) */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">未找到符合条件的资源素材</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            尝试更换搜索关键词，或调整版权与分类筛选条件；您也可以点击右上角新增录入素材。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredAssets.map(asset => {
            const authInfo = getAuthExpireInfo(asset);
            return (
              <div
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  setDetailTab("preview");
                }}
                className={`bg-white rounded-xl border hover:border-purple-300 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer relative ${
                  authInfo.isExpired
                    ? "border-rose-300 ring-1 ring-rose-200"
                    : authInfo.isWarning
                    ? "border-amber-300"
                    : "border-slate-200/80"
                }`}
              >
                {/* 顶部分类小标牌 */}
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-1.5 bg-slate-50/50 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 rounded bg-white border border-slate-200 shadow-2xs shrink-0">
                      {getCategoryIcon(asset.category)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                      {getCategoryLabel(asset.category)}
                    </span>
                  </div>

                  <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                    {asset.usageCount}次引用
                  </span>
                </div>

                {/* 内容与精小预览区域 (高约 110px-130px 保持每行 4-5 个的精致紧凑) */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  {/* 1. 图片类 Preview */}
                  {asset.category === "image" && (
                    <div className="relative aspect-[4/3] rounded-lg bg-slate-100 overflow-hidden border border-slate-200/60">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.2 rounded backdrop-blur-xs">
                        {asset.format?.split(" ")[0] || "图片"}
                      </div>
                    </div>
                  )}

                  {/* 2. 真人素材 (Human Model) Preview */}
                  {asset.category === "human_model" && (
                    <div className="relative aspect-[4/3] rounded-lg bg-rose-50 overflow-hidden border border-rose-100/80">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1 bg-rose-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {asset.gender || "真人模特"}
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded truncate backdrop-blur-xs">
                        {asset.avatarStyle || "亲切KOC口播"}
                      </div>
                    </div>
                  )}

                  {/* 3. 数字人 (Digital Human) Preview */}
                  {asset.category === "digital_human" && (
                    <div className="relative aspect-[4/3] rounded-lg bg-blue-50 overflow-hidden border border-blue-100/80">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" />
                        AI数字人
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded truncate backdrop-blur-xs">
                        {asset.avatarStyle || "主播数字人"}
                      </div>
                    </div>
                  )}

                  {/* 4. 资质类 Preview */}
                  {asset.category === "qualification" && (
                    <div className="bg-emerald-50/60 rounded-lg p-2.5 border border-emerald-100 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-emerald-800 font-medium">
                        <span className="flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          编号
                        </span>
                        <span className="font-mono text-emerald-900 font-semibold text-[10px] truncate max-w-[90px]">{asset.certNumber || "N/A"}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        <span className="text-slate-400">机构:</span> {asset.certIssuer || "质检院"}
                      </div>
                    </div>
                  )}

                  {/* 5. 文案类 Preview */}
                  {asset.category === "copywriting" && (
                    <div className="bg-amber-50/40 rounded-lg p-2.5 border border-amber-100 text-[11px] text-slate-700 relative">
                      <p className="line-clamp-3 leading-snug whitespace-pre-wrap font-sans text-slate-800 text-[11px]">
                        {asset.content}
                      </p>
                      <button
                        onClick={(e) => handleCopyText(asset.content || "", asset.id, e)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 hover:bg-amber-200/80 px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        {copiedId === asset.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>复制文案</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* 6. 音频/BGM 类 Preview */}
                  {(asset.category === "audio" || asset.category === "bgm") && (
                    <div className="bg-purple-50/40 rounded-lg p-2.5 border border-purple-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingId(playingId === asset.id ? null : asset.id);
                          }}
                          className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-all cursor-pointer shadow-2xs"
                        >
                          {playingId === asset.id ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="text-[10px] text-right">
                          <div className="font-semibold text-slate-800 truncate max-w-[100px]">
                            {asset.category === "bgm" ? `BPM ${asset.bpm || 120}` : "高保真音频"}
                          </div>
                          <div className="text-slate-400">{asset.duration || "00:30"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. 第三方参考视频 Preview */}
                  {asset.category === "ref_video" && (
                    <div className="bg-indigo-50/50 rounded-lg p-2 border border-indigo-100 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-indigo-900 font-semibold">
                        <span>对标: {asset.refPlatform || "Douyin"}</span>
                        <span className="text-[9px] text-indigo-600 bg-indigo-100 px-1 py-0.2 rounded">参考视频</span>
                      </div>
                      <p className="text-[10px] text-slate-600 line-clamp-2 bg-white/80 p-1 rounded border border-indigo-100/60 leading-tight">
                        💡 {asset.refHighlights || "暂无记录"}
                      </p>
                    </div>
                  )}

                  {/* 授权到期状态 Badge (特别突显真人素材和到期预警) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${authInfo.badgeClass}`}>
                      {authInfo.isExpired && <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />}
                      {authInfo.isWarning && <Clock className="w-3 h-3 text-amber-600" />}
                      {!authInfo.isExpired && !authInfo.isWarning && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      <span>{authInfo.shortLabel}</span>
                    </span>
                    {asset.copyrightStatus === "自有版权" && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded-full font-medium">
                        自有版权
                      </span>
                    )}
                  </div>

                  {/* 资产标题 */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 leading-snug">
                      {asset.name}
                    </h3>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.2 rounded">
                        #{t}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="text-[9px] text-slate-400">+{asset.tags.length - 2}</span>
                    )}
                  </div>
                </div>

                {/* 底部小按钮 */}
                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAsset(asset);
                      setDetailTab("usage_logs");
                    }}
                    className="text-purple-600 hover:text-purple-700 text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <History className="w-3 h-3" />
                    使用日志({asset.usageLogs.length})
                  </button>

                  <div className="flex items-center gap-1">
                    {activeCategory === "recycle" ? (
                      <button
                        onClick={(e) => handleRestore(asset.id, e)}
                        className="text-emerald-600 hover:text-emerald-700 text-[10px] font-medium flex items-center gap-0.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        恢复
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDelete(asset.id, e)}
                        className="text-slate-300 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                        title="移入回收站"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 资产详情与使用记录 Drawer / Modal */}
      {/* ============================================================ */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
            {/* 顶部 Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  {getCategoryIcon(selectedAsset.category)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      {getCategoryLabel(selectedAsset.category)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {selectedAsset.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">{selectedAsset.name}</h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 详情 Tab 切换 */}
            <div className="flex border-b border-slate-200 px-6 bg-white gap-6 text-sm font-medium">
              <button
                onClick={() => setDetailTab("preview")}
                className={`py-3 border-b-2 transition-all cursor-pointer ${
                  detailTab === "preview"
                    ? "border-purple-600 text-purple-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                内容与元数据预览
              </button>

              <button
                onClick={() => setDetailTab("usage_logs")}
                className={`py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  detailTab === "usage_logs"
                    ? "border-purple-600 text-purple-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>引用与使用记录</span>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {selectedAsset.usageLogs.length} 条
                </span>
              </button>
            </div>

            {/* Tab 1: 预览区 */}
            {detailTab === "preview" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 图片/真人/数字人分类展示 */}
                {(selectedAsset.category === "image" || selectedAsset.category === "human_model" || selectedAsset.category === "digital_human") && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-center p-2 relative">
                    <img
                      src={selectedAsset.url}
                      alt={selectedAsset.name}
                      className="max-h-80 mx-auto object-contain rounded-xl"
                    />
                    {selectedAsset.avatarStyle && (
                      <div className="mt-2 text-xs text-white/90 bg-white/10 py-1 px-3 rounded-lg backdrop-blur-xs inline-block">
                        风格形象: {selectedAsset.avatarStyle} {selectedAsset.gender ? `· ${selectedAsset.gender}` : ""}
                      </div>
                    )}
                  </div>
                )}

                {selectedAsset.category === "qualification" && (
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      官方资质备案证明明细
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 block mb-1">资质/证书编号</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{selectedAsset.certNumber || "暂未填写"}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 block mb-1">发证机构</span>
                        <span className="font-semibold text-slate-800">{selectedAsset.certIssuer || "检测检验中心"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAsset.category === "copywriting" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">文案脚本完整富文本：</span>
                      <button
                        onClick={(e) => handleCopyText(selectedAsset.content || "", selectedAsset.id, e)}
                        className="text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        复制全部文案
                      </button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                      {selectedAsset.content}
                    </div>
                  </div>
                )}

                {(selectedAsset.category === "audio" || selectedAsset.category === "bgm") && (
                  <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-purple-600 font-bold block">音频属性</span>
                        <span className="text-sm font-bold text-slate-800">
                          {selectedAsset.category === "bgm" ? `BPM ${selectedAsset.bpm || 120} · ${selectedAsset.genre || "轻快"}` : "解说配音音频"}
                        </span>
                      </div>
                      <button
                        onClick={() => setPlayingId(playingId === selectedAsset.id ? null : selectedAsset.id)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        {playingId === selectedAsset.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{playingId === selectedAsset.id ? "暂停播放" : "在线试听"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedAsset.category === "ref_video" && (
                  <div className="space-y-3">
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden relative flex items-center justify-center">
                      <video
                        src={selectedAsset.url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 space-y-1.5 text-xs text-indigo-950">
                      <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        竞品拆解亮点与分镜建议:
                      </div>
                      <p className="leading-relaxed text-slate-700">{selectedAsset.refHighlights}</p>
                    </div>
                  </div>
                )}

                {/* 1.2 肖像权/版权授权到期监控卡片 (核心增强: 满足用户真人素材授权到期状态要求) */}
                {(() => {
                  const authInfo = getAuthExpireInfo(selectedAsset);
                  return (
                    <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
                      authInfo.isExpired
                        ? "bg-rose-50/80 border-rose-300"
                        : authInfo.isWarning
                        ? "bg-amber-50/80 border-amber-300"
                        : "bg-emerald-50/60 border-emerald-200/80"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {authInfo.isExpired && <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />}
                          {authInfo.isWarning && <Clock className="w-5 h-5 text-amber-600" />}
                          {!authInfo.isExpired && !authInfo.isWarning && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                          <h4 className="text-sm font-bold text-slate-900">肖像权/版权授权到期监控状态</h4>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${authInfo.badgeClass}`}>
                          {authInfo.statusLabel}
                        </span>
                      </div>

                      {/* 风险警告说明文本 */}
                      <div className="p-3 rounded-xl bg-white/90 border border-slate-200/60 text-xs space-y-1">
                        <div className="font-bold text-slate-800">合规风控评估:</div>
                        <p className="text-slate-700 leading-relaxed">{authInfo.riskText}</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 block text-[11px]">版权归属</span>
                          <span className="font-bold text-purple-700">{selectedAsset.copyrightStatus}</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 block text-[11px]">授权截止时间</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedAsset.expireDate || "永久有效"}</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 block text-[11px]">录入创建人</span>
                          <span className="font-medium text-slate-700">{selectedAsset.creator}</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 block text-[11px]">录入时间</span>
                          <span className="font-medium text-slate-700">{selectedAsset.createdAt}</span>
                        </div>
                      </div>

                      {/* 如果临期或到期，提供快捷沟通复制工具 */}
                      {(authInfo.isExpired || authInfo.isWarning) && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {authInfo.isExpired ? "肖像授权届满，需发起续约沟通或全面下架" : "临期到期，建议提前7天向MCN/模特确认续约"}
                          </span>
                          <button
                            onClick={(e) => {
                              const msg = `【授权到期提醒】素材《${selectedAsset.name}》(ID: ${selectedAsset.id}) 的肖像权合同于 ${selectedAsset.expireDate || '近期'} 届满。当前状态: ${authInfo.statusLabel}。请商务同事跟进续约手续或运营排查下线！`;
                              handleCopyText(msg, `renew-${selectedAsset.id}`, e);
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedId === `renew-${selectedAsset.id}` ? "已复制续约提醒文案" : "复制续约提醒风控通知"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 1.3 备注说明 */}
                {selectedAsset.notes && (
                  <div className="text-xs text-slate-500 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60">
                    <span className="font-bold text-amber-800">💡 素材使用建议与备注：</span>
                    <p className="mt-1 text-slate-700">{selectedAsset.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: 使用记录与引用追踪 */}
            {detailTab === "usage_logs" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
                  <div>
                    <h3 className="text-sm font-bold text-purple-950">该素材累计被引用 {selectedAsset.usageCount} 次</h3>
                    <p className="text-xs text-purple-700/80 mt-0.5">详细记录每一次 AI剪辑任务、详情页挂载或广告投放的使用信息</p>
                  </div>

                  <button
                    onClick={() => setIsAddUsageOpen(true)}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>手动登记新使用</span>
                  </button>
                </div>

                {/* 使用明细列表 */}
                {selectedAsset.usageLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    暂无项目引用记录，您可以点击右上角手动登记。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedAsset.usageLogs.map((log, idx) => (
                      <div
                        key={log.id || idx}
                        className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-purple-200 shadow-2xs space-y-2 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            {log.projectName}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {log.usageType}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block">使用时间:</span>
                            <span className="font-mono text-slate-700">{log.usedAt}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">操作使用人:</span>
                            <span className="text-slate-700">{log.usedBy}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">目标关联平台:</span>
                            <span className="text-purple-700 font-semibold">{log.targetPlatform || "通用"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 弹窗 1：新增使用记录 Modal */}
      {/* ============================================================ */}
      {isAddUsageOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">登记该素材的使用情况</h3>
              <button onClick={() => setIsAddUsageOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">调用的项目/视频名称 *</label>
                <input
                  type="text"
                  value={useProjectName}
                  onChange={(e) => setUseProjectName(e.target.value)}
                  placeholder="例如: 8月美妆防晒混剪短视频A组"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">使用用途类型</label>
                <select
                  value={useType}
                  onChange={(e) => setUseType(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                >
                  <option value="AI视频混剪">AI视频混剪</option>
                  <option value="信息流广告">信息流广告</option>
                  <option value="详情页挂载">详情页挂载</option>
                  <option value="直播间贴纸/背景">直播间贴纸/背景</option>
                  <option value="图文笔记矩阵">图文笔记矩阵</option>
                  <option value="同款重拍/借鉴">同款重拍/借鉴</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">目标投放平台</label>
                <select
                  value={usePlatform}
                  onChange={(e) => setUsePlatform(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                >
                  <option value="Douyin">抖音 Douyin</option>
                  <option value="Xiaohongshu">小红书</option>
                  <option value="TikTok">TikTok 美区/海区</option>
                  <option value="Taobao">淘宝/天猫</option>
                  <option value="Kuaishou">快手</option>
                  <option value="Jingdong">京东</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">登记人/使用人</label>
                <input
                  type="text"
                  value={useUserName}
                  onChange={(e) => setUseUserName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAddUsageOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAddUsageRecord}
                disabled={!useProjectName}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs"
              >
                保存登记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 弹窗 2：新增素材 Modal */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">录入/新增电商资源素材</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 选择分类 */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">素材类别 *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "image", label: "图片素材" },
                    { id: "human_model", label: "真人素材" },
                    { id: "digital_human", label: "数字人" },
                    { id: "qualification", label: "资质备案" },
                    { id: "copywriting", label: "爆款文案" },
                    { id: "audio", label: "口播音频" },
                    { id: "bgm", label: "BGM音乐" },
                    { id: "ref_video", label: "参考视频" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCategory(c.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newCategory === c.id
                          ? "bg-purple-50 border-purple-500 text-purple-700 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">素材名称 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="请输入清晰可辨识的素材名称"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              {/* 定制输入项：真人/数字人专属 */}
              {(newCategory === "human_model" || newCategory === "digital_human") && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">形象/风格特点</label>
                    <input
                      type="text"
                      value={newAvatarStyle}
                      onChange={(e) => setNewAvatarStyle(e.target.value)}
                      placeholder="如: 欧美高奢/亲切KOC"
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">性别/受众定位</label>
                    <input
                      type="text"
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      placeholder="如: 女性 20-25岁"
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* 定制输入项：文案 */}
              {newCategory === "copywriting" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">文案富文本内容</label>
                  <textarea
                    rows={5}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="粘贴或编写爆款口播/种草文案..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              )}

              {newCategory === "qualification" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">资质编号</label>
                    <input
                      type="text"
                      value={newCertNumber}
                      onChange={(e) => setNewCertNumber(e.target.value)}
                      placeholder="例如: GZ-2026-901"
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">适用类目</label>
                    <input
                      type="text"
                      value={newCertScope}
                      onChange={(e) => setNewCertScope(e.target.value)}
                      placeholder="如: 美妆/服饰"
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {newCategory === "ref_video" && (
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">参考视频拆解亮点</label>
                    <textarea
                      rows={3}
                      value={newRefHighlights}
                      onChange={(e) => setNewRefHighlights(e.target.value)}
                      placeholder="如: 前3秒痛点钩子 + 镜头切频..."
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {newCategory !== "copywriting" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">文件/封面/播放链接 URL</label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="可输入图片/封面/音频/视频在线URL地址"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              )}

              {/* 授权/合同到期时间输入 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    {newCategory === "human_model" ? "肖像授权到期日期 *" : "授权/文件有效截止日期"}
                  </label>
                  <span className="text-[10px] text-slate-400">留空则默认自有或永久授权</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newExpireDate}
                    onChange={(e) => setNewExpireDate(e.target.value)}
                    className="flex-1 p-2 border border-slate-200 rounded-xl outline-none focus:border-purple-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setNewExpireDate("2027-08-31")}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    1年后到期
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExpireDate("2026-08-05")}
                    className="px-2.5 py-1 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold cursor-pointer"
                  >
                    设为临期预警
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">标签 (用逗号分隔)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="例如: 爆款主图, 4K, 美妆"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreateAsset}
                disabled={!newName.trim()}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs"
              >
                确认录入资源
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
