import React, { useState } from "react";
import { useScopedTaggedResources, useTagCatalog, useTagFilterSync } from "../lib/useResourceTags";
import { Search, ChevronDown, Play, Eye, Trash2, X, Sparkles, Film, Volume2, FileText, Headphones, Check, RotateCcw } from "lucide-react";
import { Pagination } from "./Pagination";
import FinishedVideoDetailModal, { FinishedVideo } from "./FinishedVideoDetailModal";
import ImageDetailView, { ImageItem } from "./ImageDetailView";
import AudioDetailView, { AudioItem } from "./AudioDetailView";
import ScriptDetailPage, { ScriptItem } from "./ScriptDetailPage";
import OverlayPortal from "./overlays/OverlayPortal";
import { INITIAL_THIRD_PARTY } from "../data/thirdPartyVideos";
import { useUploadedResources } from "../lib/resourceUploads";
import { toPublishedVideo } from "../lib/publishedVideo";
import { useResourceEdits } from "../lib/useResourceEdits";
import { changeThirdPartyLifecycle, useThirdPartyLifecycle } from "../lib/thirdPartyLifecycle";

export interface AdminResourceItem {
  id: string;
  name: string;
  cover: string;
  videoUrl?: string;
  tags: string[];
  category: string;
  company: string;
  uploadTime: string;
  tabType: "成片" | "素材" | "第三方" | "图片" | "音频" | "脚本" | "回收站";
  originalTabType?: "成片" | "素材" | "第三方" | "图片" | "音频" | "脚本";
  status?: string;
  author?: string;
  personalTags?: string[];
  fileSize?: string;
  duration?: string;
  scriptContent?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletedSource?: "用户端" | "管理端";
  originalLocation?: string;
}

const INITIAL_ADMIN_RESOURCES: AdminResourceItem[] = [
  {
    id: "RES-001",
    name: "水印视频_1 (1)",
    cover: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    tags: ["实测对比"],
    category: "成片同步一级/成片同步二级",
    company: "梦畅网络",
    uploadTime: "2025-05-24 16:50:18",
    tabType: "成片",
    originalTabType: "成片",
    duration: "00:45",
    fileSize: "18.4 MB"
  },
  {
    id: "RES-002",
    name: "草本初色内衣爆款口播切片_V2",
    cover: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    tags: ["好物推荐", "短视频推广"],
    category: "女士内衣/无钢圈抹胸",
    company: "梦畅网络",
    uploadTime: "2025-05-24 14:22:05",
    tabType: "成片",
    originalTabType: "成片",
    duration: "00:32",
    fileSize: "12.8 MB"
  },
  {
    id: "RES-003",
    name: "高颜清爽防晒霜实验室测评实拍",
    cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    tags: ["实测对比", "成分党"],
    category: "美妆护肤/防晒隔离",
    company: "致上互娱",
    uploadTime: "2025-05-23 18:10:42",
    tabType: "成片",
    originalTabType: "成片",
    duration: "01:05",
    fileSize: "28.1 MB"
  },
  {
    id: "RES-004",
    name: "智能降噪耳机开箱高清音轨素材",
    cover: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    tags: ["数码好物"],
    category: "3C数码/蓝牙耳机",
    company: "云享文化",
    uploadTime: "2025-05-22 11:05:30",
    tabType: "素材",
    originalTabType: "素材",
    duration: "02:10",
    fileSize: "45.0 MB"
  },
  {
    id: "RES-005",
    name: "法式古法金耳环-光泽特写Raw原片",
    cover: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    tags: ["高端质感"],
    category: "服饰首饰/古法金项链",
    company: "梦畅网络",
    uploadTime: "2025-05-21 09:15:00",
    tabType: "素材",
    originalTabType: "素材",
    duration: "00:58",
    fileSize: "22.3 MB"
  },
  {
    id: "RES-006",
    name: "夏日清凉系列高清图库包_01",
    cover: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&auto=format&fit=crop&q=80",
    tags: ["白底图", "商品展示"],
    category: "服装鞋帽/夏装走秀",
    company: "梦畅网络",
    uploadTime: "2025-05-20 15:40:12",
    tabType: "图片",
    originalTabType: "图片",
    fileSize: "5.2 MB"
  },
  {
    id: "RES-007",
    name: "防晒冰丝T恤4K宣发海报展示图",
    cover: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=80",
    tags: ["宣发海报"],
    category: "服饰内衣/夏日防晒",
    company: "致上互娱",
    uploadTime: "2025-05-19 12:00:00",
    tabType: "图片",
    originalTabType: "图片",
    fileSize: "8.1 MB"
  },
  {
    id: "RES-008",
    name: "欢快轻柔电商背景音旁白",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    tags: ["纯音乐"],
    category: "音频分类/欢快商用",
    company: "云享文化",
    uploadTime: "2025-05-18 10:00:00",
    tabType: "音频",
    originalTabType: "音频",
    duration: "01:30",
    fileSize: "3.5 MB"
  },
  {
    id: "RES-009",
    name: "痛点突破黄金3秒开场文案",
    cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=80",
    tags: ["千川投流"],
    category: "脚本同步一级/通用电商",
    company: "致上互娱",
    uploadTime: "2025-05-19 16:20:00",
    tabType: "脚本",
    originalTabType: "脚本",
    fileSize: "120 KB",
    scriptContent: "【黄金3秒Hook】：如果你的衣服总是洗完变硬变干，那一定要试试这个……\n【痛点场景拆解】：普通洗涤剂导致面料受损，无痕内衣变质。\n【转化引导】：今日直播间买一送一，限时限量抢购！"
  },
  {
    id: "RES-010",
    name: "草本内衣无钢圈口播拆解脚本",
    cover: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=500&auto=format&fit=crop&q=80",
    tags: ["口播种草"],
    category: "女士内衣/无钢圈",
    company: "梦畅网络",
    uploadTime: "2025-05-17 14:10:00",
    tabType: "脚本",
    originalTabType: "脚本",
    fileSize: "85 KB",
    scriptContent: "【开场视觉】：展示高弹拉伸，一秒收腹无痕。\n【功能展示】：天然草本有机棉，亲肤透气不闷热。\n【尾帧促销】：下方小黄车直接领券立减20元。"
  },

  /* ---------------- 下面为回收站五种类别文件的初始化案例 ---------------- */
  {
    id: "RES-TRASH-001",
    name: "夏日清凉彩妆新品海报展示图_01",
    cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80",
    tags: ["宣发海报", "白底图"],
    category: "美妆护肤/彩妆口红",
    company: "致上互娱",
    uploadTime: "2025-06-18 15:08:03",
    deletedAt: "2026-08-19 11:24:36",
    deletedBy: "汤小真",
    deletedSource: "用户端",
    originalLocation: "资源库 / 图片管理 / 美妆护肤",
    tabType: "回收站",
    originalTabType: "图片",
    fileSize: "3.4 MB"
  },
  {
    id: "RES-TRASH-002",
    name: "夏日轻快节奏促销旁白音频_02",
    cover: "",
    tags: ["轻快节奏", "促销口播"],
    category: "音频分类/欢快商用",
    company: "致上互娱",
    uploadTime: "2025-06-12 13:44:22",
    deletedAt: "2026-08-19 10:18:12",
    deletedBy: "徐振",
    deletedSource: "用户端",
    originalLocation: "资源库 / 音频管理 / 促销大促",
    tabType: "回收站",
    originalTabType: "音频",
    duration: "01:15",
    fileSize: "1.2 MB"
  },
  {
    id: "RES-TRASH-003",
    name: "防晒霜爆款种草解说音轨_V1",
    cover: "",
    tags: ["口播种草", "轻快节奏"],
    category: "音频分类/解说旁白",
    company: "致上互娱",
    uploadTime: "2025-06-11 17:53:02",
    deletedAt: "2026-08-18 18:42:05",
    deletedBy: "王敏（管理员）",
    deletedSource: "管理端",
    originalLocation: "资源库 / 音频管理 / 解说旁白",
    tabType: "回收站",
    originalTabType: "音频",
    duration: "02:05",
    fileSize: "2.8 MB"
  },
  {
    id: "RES-TRASH-004",
    name: "夏日冰爽爆款广告成片_V3_已移入回收站",
    cover: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    tags: ["短视频推广", "实测对比"],
    category: "美妆护肤/防晒隔离",
    company: "梦畅网络",
    uploadTime: "2025-06-10 11:20:00",
    deletedAt: "2026-08-18 16:08:44",
    deletedBy: "李剪辑",
    deletedSource: "用户端",
    originalLocation: "资源库 / 成片管理 / 防晒隔离",
    tabType: "回收站",
    originalTabType: "成片",
    duration: "00:45",
    fileSize: "18.4 MB"
  },
  {
    id: "RES-TRASH-005",
    name: "高清特写原片片段_02_草稿废弃",
    cover: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    tags: ["实测对比", "高端质感"],
    category: "服饰首饰/古法金",
    company: "云享文化",
    uploadTime: "2025-06-09 16:15:30",
    deletedAt: "2026-08-18 14:30:27",
    deletedBy: "徐振（管理员）",
    deletedSource: "管理端",
    originalLocation: "资源库 / 素材管理 / 古法金",
    tabType: "回收站",
    originalTabType: "素材",
    duration: "00:30",
    fileSize: "12.0 MB"
  },
  {
    id: "RES-TRASH-006",
    name: "无痕内衣痛点爆破口播脚本_草稿",
    cover: "",
    tags: ["痛点解说", "千川投流"],
    category: "脚本分类/电商口播",
    company: "致上互娱",
    uploadTime: "2025-06-08 09:30:15",
    deletedAt: "2026-08-17 17:12:19",
    deletedBy: "莫钦全",
    deletedSource: "用户端",
    originalLocation: "资源库 / 脚本管理 / 电商口播",
    tabType: "回收站",
    originalTabType: "脚本",
    fileSize: "65 KB",
    scriptContent: "【黄金3秒Hook】：如果你的衣服总是洗完变硬变干，那一定要试试这个……"
  }
];

export default function AdminResourceView() {
  const [baseResources, setResources] = useState<AdminResourceItem[]>(INITIAL_ADMIN_RESOURCES);
  const uploaded = useUploadedResources();
  const lifecycle = useThirdPartyLifecycle();
  const { edits, saveEdits } = useResourceEdits<FinishedVideo>("thirdParty");
  const thirdParty = [...uploaded.filter(r => r.resourceCategory === "第三方").map(toPublishedVideo), ...INITIAL_THIRD_PARTY]
    .filter(video => lifecycle[video.id]?.state !== "deleted")
    .map((source): AdminResourceItem => {
      const video = { ...source, ...edits[source.id] }, state = lifecycle[video.id];
      return { id: video.id, name: video.title, cover: video.coverUrl, videoUrl: video.videoUrl,
        category: video.category || "", tags: video.tags || [], personalTags: video.personalTags,
        status: video.status, author: video.author, company: "梦畅网络", uploadTime: video.createdAt,
        duration: video.duration, fileSize: video.size, tabType: state?.state === "trash" ? "回收站" : "第三方",
        originalTabType: "第三方", originalLocation: `资源库 / 第三方管理 / ${video.category || ""}`,
        deletedAt: state?.deletedAt, deletedBy: state?.deletedBy, deletedSource: state?.deletedSource };
    });
  const resources = useScopedTaggedResources<AdminResourceItem>([...baseResources, ...thirdParty], (item) => ({ 成片: "finished", 素材: "materials", 第三方: "thirdParty", 图片: "images", 音频: "audio", 脚本: "scripts" }[item.originalTabType || (item.tabType === "回收站" ? "成片" : item.tabType)]));
  const [activeTab, setActiveTab] = useState<string>("成片");
  
  // 筛选字段
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("全部标签");
  const [selectedCompany, setSelectedCompany] = useState("全部公司");

  // 回收站勾选 ID 集合与选择模式
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);

  // 彻底删除 确认弹窗状态
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    id?: string;
    name?: string;
    isBatch?: boolean;
    itemType?: string;
  }>({ isOpen: false });
  const [moveToTrashItem, setMoveToTrashItem] = useState<AdminResourceItem | null>(null);

  // 一键清空 密码确认弹窗状态
  const [clearTrashModalOpen, setClearTrashModalOpen] = useState<boolean>(false);
  const [clearPassword, setClearPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // 统一缩略图/封面渲染 (确保管理端普通 Tab 与 回收站 的音频、脚本、封面渲染 100% 保持一致)
  const renderItemCover = (item: AdminResourceItem, targetType: string) => {
    if (targetType === "音频") {
      return (
        <div className="w-24 h-28 sm:w-28 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/90 relative group/cover flex flex-col items-center justify-center p-2 shadow-2xs group-hover:border-purple-300 transition-colors">
          <div className="w-10 h-10 rounded-full border border-slate-300 bg-white shadow-2xs flex items-center justify-center mb-1 group-hover/cover:scale-105 transition-transform">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 my-1">
            <span className="w-0.5 h-3 bg-slate-400 rounded-full" />
            <span className="w-0.5 h-4.5 bg-slate-500 rounded-full" />
            <span className="w-0.5 h-2 bg-slate-400 rounded-full" />
            <span className="w-0.5 h-4 bg-slate-500 rounded-full" />
            <span className="w-0.5 h-2.5 bg-slate-400 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold font-mono tracking-tight mt-0.5">音频播放</span>
          <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewItem(item);
              }}
              className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
            </button>
          </div>
          {item.duration && (
            <span className="absolute bottom-1 right-1 bg-slate-800/80 text-white font-mono text-[9px] px-1 rounded">
              {item.duration}
            </span>
          )}
        </div>
      );
    }

    if (targetType === "脚本") {
      return (
        <div className="w-24 h-28 sm:w-28 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/90 relative group/cover flex flex-col items-center justify-center p-2 shadow-2xs group-hover:border-purple-300 transition-colors">
          <div className="w-10 h-13 bg-white rounded-md border border-slate-300 shadow-2xs p-1.5 flex flex-col justify-between relative group-hover/cover:scale-105 transition-transform">
            <div className="absolute -left-1 top-2 bottom-2 flex flex-col justify-between">
              <span className="w-1 h-0.5 bg-slate-400 rounded-full" />
              <span className="w-1 h-0.5 bg-slate-400 rounded-full" />
              <span className="w-1 h-0.5 bg-slate-400 rounded-full" />
            </div>
            <div className="space-y-1 pl-1">
              <div className="w-full h-1 bg-slate-300 rounded-full" />
              <div className="w-3/4 h-1 bg-slate-200 rounded-full" />
              <div className="w-5/6 h-1 bg-slate-200 rounded-full" />
              <div className="w-2/3 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex justify-end pt-0.5">
              <FileText className="w-3 h-3 text-slate-500" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold font-mono tracking-tight mt-1.5">笔记本脚本</span>
          <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewItem(item);
              }}
              className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-900" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-24 h-28 sm:w-28 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-slate-900 relative group/cover shadow-2xs group-hover:border-purple-300 transition-colors">
        <img
          src={item.cover}
          alt={item.name}
          className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewItem(item);
            }}
            className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
          >
            {targetType === "图片" ? (
              <Eye className="w-4 h-4 text-slate-900" />
            ) : (
              <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
            )}
          </button>
        </div>
        {item.duration && (
          <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1 rounded">
            {item.duration}
          </span>
        )}
      </div>
    );
  };

  // 查看弹窗/详情页
  const [previewItem, setPreviewItem] = useState<AdminResourceItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const tabs = ["成片", "素材", "第三方", "图片", "音频", "脚本", "回收站"];
  const companies = ["全部公司", "致上互娱", "梦畅网络", "云享文化", "星耀传媒", "致上电商"];
  const { publicGroups } = useTagCatalog();
  const tagsList = ["全部标签", ...Object.values(publicGroups).flat()];
  useTagFilterSync("public", selectedTag, (tag) => setSelectedTag(tag === "全部" ? "全部标签" : tag));

  // 过滤后的数据
  const filteredResources = resources.filter((item) => {
    // Tab match
    if (item.tabType !== activeTab) return false;
    
    // Keyword match
    if (searchKeyword.trim() !== "") {
      const kw = searchKeyword.toLowerCase();
      const matchName = item.name.toLowerCase().includes(kw);
      const matchId = item.id.toLowerCase().includes(kw);
      const matchCompany = item.company.toLowerCase().includes(kw);
      if (!matchName && !matchId && !matchCompany) return false;
    }

    // Tag match
    if (selectedTag !== "全部标签") {
      if (!item.tags.includes(selectedTag)) return false;
    }

    // Company match
    if (selectedCompany !== "全部公司") {
      if (item.company !== selectedCompany) return false;
    }

    return true;
  });

  // 分页数据
  const totalCount = filteredResources.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 单个删除 -> 移入回收站
  const handleMoveToTrash = (id: string) => {
    if (thirdParty.some(item => item.id === id)) {
      changeThirdPartyLifecycle([id], "trash");
      showToast("第三方视频已移入回收站");
      return;
    }
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            originalTabType: r.tabType !== "回收站" ? r.tabType as any : r.originalTabType,
            tabType: "回收站",
            deletedAt: new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
            deletedBy: "当前管理员",
            deletedSource: "管理端",
            originalLocation: `资源库 / ${r.tabType}管理 / ${r.category}`
          };
        }
        return r;
      })
    );
    showToast("已将该素材移入回收站");
  };

  // 彻底删除确认触发
  const handleRequestPermanentDelete = (item: AdminResourceItem) => {
    const currentType = item.tabType === "回收站" ? (item.originalTabType || "视频") : item.tabType;
    setDeleteConfirmModal({
      isOpen: true,
      id: item.id,
      name: item.name,
      isBatch: false,
      itemType: currentType
    });
  };

  // 批量彻底删除确认触发
  const handleRequestBatchDelete = () => {
    if (selectedIds.length === 0) {
      showToast("请先勾选需要彻底删除的项目");
      return;
    }
    setDeleteConfirmModal({
      isOpen: true,
      isBatch: true,
      name: `选中的 ${selectedIds.length} 项`
    });
  };

  // 执行彻底删除 (单项或批量)
  const handleConfirmDelete = () => {
    const targetIds = deleteConfirmModal.isBatch ? selectedIds : [deleteConfirmModal.id || ""];
    changeThirdPartyLifecycle(targetIds.filter(id => thirdParty.some(item => item.id === id)), "deleted");
    if (deleteConfirmModal.isBatch) {
      const count = selectedIds.length;
      setResources((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      showToast(`已成功批量彻底删除 ${count} 个选中的项目`);
    } else if (deleteConfirmModal.id) {
      const targetId = deleteConfirmModal.id;
      setResources((prev) => prev.filter((r) => r.id !== targetId));
      setSelectedIds((prev) => prev.filter((i) => i !== targetId));
      showToast("已成功彻底删除该素材");
    }
    setDeleteConfirmModal({ isOpen: false });
  };

  // 批量恢复
  const handleBatchRestore = () => {
    if (selectedIds.length === 0) {
      showToast("请先勾选需要恢复的项目");
      return;
    }
    const count = selectedIds.length;
    changeThirdPartyLifecycle(selectedIds.filter(id => thirdParty.some(item => item.id === id)), "active");
    setResources((prev) =>
      prev.map((r) => {
        if (selectedIds.includes(r.id)) {
          return {
            ...r,
            tabType: r.originalTabType || "成片"
          };
        }
        return r;
      })
    );
    setSelectedIds([]);
    showToast(`已成功批量恢复 ${count} 个选中的素材至对应分类`);
  };

  // 一键清空回收站 - 打开密码确认弹窗
  const handleOpenClearTrashModal = () => {
    const trashItems = resources.filter((r) => r.tabType === "回收站");
    if (trashItems.length === 0) {
      showToast("回收站当前为空");
      return;
    }
    setClearPassword("");
    setPasswordError("");
    setClearTrashModalOpen(true);
  };

  // 执行一键清空 (校验密码)
  const handleConfirmClearTrash = () => {
    if (!clearPassword.trim()) {
      setPasswordError("请输入登录密码");
      return;
    }
    changeThirdPartyLifecycle(thirdParty.filter(item => item.tabType === "回收站").map(item => item.id), "deleted");
    setResources((prev) => prev.filter((r) => r.tabType !== "回收站"));
    setSelectedIds([]);
    setClearTrashModalOpen(false);
    setClearPassword("");
    setPasswordError("");
    showToast("已成功清空回收站所有关联素材");
  };

  // 切换勾选
  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 如果打开了详情页，渲染对应的用户端一致的详情组件
  if (previewItem) {
    const videoType = previewItem.originalTabType || previewItem.tabType;
    if (["成片", "素材", "第三方"].includes(videoType)) {
      const finishedVideo: FinishedVideo = {
        id: previewItem.id,
        title: previewItem.name,
        videoUrl: previewItem.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
        coverUrl: previewItem.cover || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80",
        duration: previewItem.duration || "00:45",
        resolution: "1080p",
        size: previewItem.fileSize || "18.4 MB",
        creator: "human",
        createdAt: previewItem.uploadTime,
        syncStatus: "unsynced",
        shares: 12,
        likes: 120,
        comments: 18,
        author: previewItem.author || previewItem.company,
        status: previewItem.status,
        personalTags: previewItem.personalTags,
        cost: 3.5,
        brandName: previewItem.company,
        category: previewItem.category,
        tags: previewItem.tags
      };

      return (
        <FinishedVideoDetailModal
          video={finishedVideo}
          isMaterialMode={videoType !== "成片"}
          resourceScope={videoType === "第三方" ? "thirdParty" : videoType === "素材" ? "materials" : "finished"}
          onUpdate={videoType === "第三方" ? patch => {
            saveEdits({ [previewItem.id]: patch });
            setPreviewItem(prev => prev ? { ...prev, name: patch.title ?? prev.name, category: patch.category ?? prev.category } : prev);
          } : undefined}
          onDelete={videoType === "第三方" && previewItem.tabType !== "回收站" ? () => {
            handleMoveToTrash(previewItem.id); setPreviewItem(null);
          } : undefined}
          isAdminMode={true}
          onClose={() => setPreviewItem(null)}
        />
      );
    }

    if (previewItem.tabType === "图片" || (previewItem.tabType === "回收站" && previewItem.originalTabType === "图片")) {
      const imageItem: ImageItem = {
        id: previewItem.id,
        title: previewItem.name,
        imageUrl: previewItem.cover || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80",
        badge: "普通视角",
        author: previewItem.company,
        primaryCategory: previewItem.category.split("/")[0] || "通用分类",
        secondaryCategory: previewItem.category.split("/")[1] || "未分类",
        size: previewItem.fileSize || "5.2 MB",
        resolution: "1080x1920",
        time: previewItem.uploadTime,
        downloads: 120,
        tags: previewItem.tags
      };

      return (
        <div className="flex-1 min-h-0 h-full overflow-y-auto w-full">
          <ImageDetailView
            item={imageItem}
            onClose={() => setPreviewItem(null)}
            showToast={showToast}
          />
        </div>
      );
    }

    if (previewItem.tabType === "音频" || (previewItem.tabType === "回收站" && previewItem.originalTabType === "音频")) {
      const audioItem: AudioItem = {
        id: previewItem.id,
        title: previewItem.name,
        duration: 90,
        durationFormatted: previewItem.duration || "01:30",
        author: previewItem.company,
        primaryCategory: previewItem.category.split("/")[0] || "通用分类",
        secondaryCategory: previewItem.category.split("/")[1] || "未分类",
        publicTags: previewItem.tags || [],
        personalTag: "常用音轨"
      };

      return (
        <div className="flex-1 min-h-0 h-full overflow-y-auto w-full">
          <AudioDetailView
            item={audioItem}
            onClose={() => setPreviewItem(null)}
            showToast={showToast}
            onDelete={() => {
              handleRequestPermanentDelete(previewItem);
              setPreviewItem(null);
            }}
          />
        </div>
      );
    }

    if (previewItem.tabType === "脚本" || (previewItem.tabType === "回收站" && previewItem.originalTabType === "脚本")) {
      const scriptItem: ScriptItem = {
        id: previewItem.id,
        title: previewItem.name,
        author: previewItem.company,
        categoryTag: "精选爆款",
        content: previewItem.scriptContent || "【开场白】：无痕舒适，专为高品质打造。\n【痛点解法】：亲肤无钢圈，秒提拉升。",
        status: "审核通过",
        primaryCategory: previewItem.category.split("/")[0] || "通用分类",
        secondaryCategory: previewItem.category.split("/")[1] || "未分类",
        classTag: "电商卖货",
        descTag: "爆款卖点",
        tasksCount: 1,
        tasks: [],
        createdAt: previewItem.uploadTime,
        scenesCount: 3,
        publisherGroup: previewItem.company
      };

      return (
        <div className="flex-1 min-h-0 h-full overflow-y-auto w-full">
          <ScriptDetailPage
            script={scriptItem}
            onBack={() => setPreviewItem(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-800 font-sans">
      {/* Toast */}
      {toastMsg && (
        <OverlayPortal layer="toast" role="status" className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMsg}</span>
        </OverlayPortal>
      )}

      {/* 1. 顶部筛选工具栏 (参考截图1) */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索框 */}
          <div className="w-80 relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="关键词搜索（姓名/视频标题/视频id）"
              className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 text-slate-800 focus:outline-hidden focus:border-purple-500 transition-colors"
            />
          </div>

          {/* 标签选择框 */}
          <div className="relative">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer focus:outline-hidden focus:border-purple-500"
            >
              {tagsList.map((t) => (
                <option key={t} value={t}>
                  {t === "全部标签" ? "请选择二级标签" : t}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 公司/分类下拉框 */}
          <div className="relative">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer focus:outline-hidden focus:border-purple-500"
            >
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c === "全部公司" ? "请选择公司" : c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 紫色搜索按钮 */}
          <button
            type="button"
            onClick={() => showToast("已应用搜索筛选条件")}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            搜索
          </button>
        </div>

        {/* 2. 选项卡分类栏 (图1展示：成片、素材、第三方、图片、文案、音频、脚本、回收站) */}
        <div className="flex items-center gap-8 mt-5 border-b border-slate-100/80 pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedIds([]);
                  setIsSelectMode(false);
                }}
                className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                  isActive ? "text-purple-600 font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3. 回收站专用批量功能操作工具栏 (完全参照截图) */}
        {activeTab === "回收站" && (
          <div className="mt-3 space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-100 bg-purple-50/70 px-3.5 py-3">
              <div>
                <p className="text-xs font-extrabold text-purple-900">平台集中回收站</p>
                <p className="mt-1 text-[11px] leading-5 text-purple-700">用户端和管理端删除的资源统一进入这里。仅有回收站管理权限的管理员可恢复或彻底删除，恢复后回到原分类并保留原有关联记录。</p>
              </div>
              <span className="rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-purple-700 shadow-2xs">当前 {filteredResources.length} 条</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
            {/* 选择 / 取消选择 按钮 */}
            <button
              type="button"
              onClick={() => {
                if (isSelectMode) {
                  setIsSelectMode(false);
                  setSelectedIds([]);
                } else {
                  setIsSelectMode(true);
                }
              }}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              {isSelectMode ? "取消选择" : "选择"}
            </button>

            {/* 选中本页 按钮 */}
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(true);
                const currentIds = paginatedResources.map((r) => r.id);
                const isAllSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));
                if (isAllSelected) {
                  setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
                } else {
                  setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
                }
              }}
              className={`px-3.5 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                isSelectMode && paginatedResources.length > 0 && paginatedResources.every((r) => selectedIds.includes(r.id))
                  ? "bg-purple-50 border-purple-600 text-purple-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                isSelectMode && paginatedResources.length > 0 && paginatedResources.every((r) => selectedIds.includes(r.id))
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-slate-300 bg-white"
              }`}>
                <Check className={`w-2.5 h-2.5 stroke-[3] ${
                  isSelectMode && paginatedResources.length > 0 && paginatedResources.every((r) => selectedIds.includes(r.id))
                    ? "text-white"
                    : "text-slate-300 opacity-0 group-hover:opacity-100"
                }`} />
              </div>
              <span>选中本页</span>
            </button>

            {/* 后续三个操作按钮：只有在点击选择或选中本页后才显示 */}
            {isSelectMode && (
              <>
                <button
                  type="button"
                  onClick={handleRequestBatchDelete}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  批量删除
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      showToast("请先勾选需要恢复的项目");
                      return;
                    }
                    handleBatchRestore();
                  }}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  批量恢复
                </button>

                {selectedIds.length > 0 && (
                  <span className="text-xs font-extrabold text-purple-600 ml-1">
                    已选中 {selectedIds.length} 项
                  </span>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleOpenClearTrashModal}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              一键清空
            </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. 内容与卡片列表区域 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-white flex flex-col justify-between">
        <div>
          {filteredResources.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
              <Trash2 className="w-12 h-12 text-slate-300 mb-3 stroke-[1.5]" />
              <p className="text-xs">【{activeTab}】暂无符合条件的内容</p>
            </div>
          ) : (
            /* 统一卡片列表：3列网格 (成片/素材/图片/音频/脚本/回收站 排版完全一致) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedResources.map((item) => {
                const isSelected = activeTab === "回收站" && isSelectMode && selectedIds.includes(item.id);
                const realType = item.tabType === "回收站" ? (item.originalTabType || "图片") : item.tabType;

                return (
                  <div
                    key={item.id}
                    data-testid="admin-resource-card"
                    data-resource-id={item.id}
                    onClick={() => {
                      if (activeTab === "回收站" && isSelectMode) {
                        toggleSelectId(item.id);
                      } else {
                        setPreviewItem(item);
                      }
                    }}
                    className={`bg-white rounded-2xl border border-slate-100/90 p-3.5 shadow-2xs hover:shadow-md transition-all flex gap-3.5 items-start group relative cursor-pointer ${
                      isSelected ? "bg-purple-50/40 ring-2 ring-purple-500/30" : ""
                    }`}
                  >
                    {/* 复选框 - 仅在回收站且启用选择模式下才显示 */}
                    {activeTab === "回收站" && isSelectMode && (
                      <div className="pt-2 shrink-0">
                        <div
                          className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            isSelected
                              ? "bg-purple-600 border-purple-600 text-white shadow-2xs"
                              : "border-slate-300 bg-white group-hover:border-purple-400"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    )}

                    {/* 缩略图/插图 (区分音视频、脚本、图片) */}
                    {renderItemCover(item, realType)}

                    {/* 右侧信息排布 (标题 -> 橙/蓝底色标签 -> 一二级分类 -> 公司名与时间 -> 操作按钮) */}
                    <div className="flex-1 min-w-0 pt-0.5 space-y-1.5 flex flex-col justify-between self-stretch">
                      <div>
                        {/* 标题 */}
                        <h4
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                          }}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-purple-600 transition-colors truncate cursor-pointer"
                          title={item.name}
                        >
                          {item.name}
                        </h4>

                        {/* 标签 Chips (宣发海报、高清壁纸、轻快欢快等) */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {item.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* 一级 / 二级分类 */}
                        <p className="text-xs text-slate-500 font-medium truncate pt-1">
                          {item.category}
                        </p>

                        {activeTab === "回收站" ? (
                          <div className="mt-1.5 space-y-1 rounded-md bg-slate-50 px-2.5 py-2 text-[10px] text-slate-500">
                            <div className="flex items-center justify-between gap-2"><span>删除来源</span><span className="font-bold text-slate-700">{item.deletedSource || "管理端"} · {item.deletedBy || "当前管理员"}</span></div>
                            <div className="flex items-center justify-between gap-2"><span>删除时间</span><span className="font-mono text-slate-600">{item.deletedAt || item.uploadTime}</span></div>
                            <div className="flex items-start justify-between gap-2"><span className="shrink-0">原位置</span><span className="text-right font-medium text-slate-600">{item.originalLocation || `资源库 / ${realType}管理`}</span></div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                            <span className="font-sans font-medium text-slate-500 truncate max-w-[100px]">{item.company}</span>
                            <span className="truncate">{item.uploadTime}</span>
                          </div>
                        )}
                      </div>

                      {/* 普通资源删除后进入回收站；回收站内才允许恢复或彻底删除 */}
                      <div className="flex items-center gap-3 pt-2">
                        {activeTab === "回收站" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.originalTabType === "第三方") changeThirdPartyLifecycle([item.id], "active");
                              setResources((prev) =>
                                prev.map((r) => (r.id === item.id ? { ...r, tabType: r.originalTabType || "成片" } : r))
                              );
                              showToast(`已恢复【${item.name}】`);
                            }}
                            className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>恢复</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeTab === "回收站") handleRequestPermanentDelete(item);
                            else setMoveToTrashItem(item);
                          }}
                          className="text-[11px] text-slate-400 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{activeTab === "回收站" ? "彻底删除" : "删除"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部翻页模块 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>

      {moveToTrashItem && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="删除资源" className="fixed inset-0 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-slate-100/80 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 pb-1 pt-4">
              <h3 className="text-base font-bold text-slate-800">删除资源</h3>
              <button type="button" onClick={() => setMoveToTrashItem(null)} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3.5 px-6 py-5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white shadow-2xs">!</div>
              <div>
                <p className="text-sm font-medium text-slate-700">确认删除《{moveToTrashItem.name}》？</p>
                <p className="mt-1 text-xs text-slate-500">删除后将移入回收站，可在回收站中恢复。</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 pb-4">
              <button type="button" onClick={() => setMoveToTrashItem(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">取消</button>
              <button
                type="button"
                onClick={() => {
                  handleMoveToTrash(moveToTrashItem.id);
                  setMoveToTrashItem(null);
                }}
                className="rounded-lg bg-purple-600 px-5 py-1.5 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-purple-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* ============================================================ */}
      {/* 彻底删除 确认弹窗 (对应截图1) */}
      {/* ============================================================ */}
      {deleteConfirmModal.isOpen && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="彻底删除资源" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-slate-100/80 animate-in zoom-in-95 duration-200">
            {/* 头部标题与关闭 */}
            <div className="p-4 px-5 flex items-center justify-between border-b-0 pb-1">
              <h3 className="text-base font-bold text-slate-800">
                {deleteConfirmModal.isBatch
                  ? "批量删除"
                  : deleteConfirmModal.itemType === "音频"
                  ? "删除音频"
                  : deleteConfirmModal.itemType === "脚本"
                  ? "删除脚本"
                  : deleteConfirmModal.itemType === "图片"
                  ? "删除图片"
                  : "删除视频"}
              </h3>
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false })}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区域：警告图标 + 提示文字 (完全对齐截图1) */}
            <div className="p-6 py-5 flex items-center gap-3.5">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                !
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {deleteConfirmModal.isBatch
                  ? `请确认是否彻底删除这 ${selectedIds.length} 项资源，删除后无法恢复`
                  : `请确认是否删除该${deleteConfirmModal.itemType || "视频"}，删除后无法恢复`}
              </p>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 px-5 bg-white flex items-center justify-end gap-3 border-t-0">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false })}
                className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* ============================================================ */}
      {/* 一键清空 密码确认弹窗 (对应截图2) */}
      {/* ============================================================ */}
      {clearTrashModalOpen && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="清空回收站" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* 头部标题与关闭：| 一键清空 */}
            <div className="p-4 px-5 flex items-center justify-between border-b border-slate-100/80">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-600 rounded-full inline-block"></span>
                <h3 className="text-base font-bold text-slate-900">一键清空</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClearTrashModalOpen(false);
                  setClearPassword("");
                  setPasswordError("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区域：警告提示框 + 密码输入框 (完全对齐截图2) */}
            <div className="p-6 space-y-5">
              {/* 粉红警告框 */}
              <div className="p-3 bg-red-50/90 border border-red-100/90 rounded-lg flex items-center gap-2.5 text-rose-600 text-xs font-bold">
                <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  !
                </div>
                <span>删除后不可恢复，请谨慎操作。</span>
              </div>

              {/* 密码输入区域 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 shrink-0 w-20 sm:w-24 flex items-center">
                    <span className="text-rose-500 mr-1 font-bold">*</span>
                    登录密码
                  </label>
                  <input
                    type="password"
                    value={clearPassword}
                    onChange={(e) => {
                      setClearPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="请输入登录密码"
                    className={`flex-1 px-3.5 py-2 border rounded-lg text-xs sm:text-sm outline-none transition-all placeholder:text-slate-300 ${
                      passwordError
                        ? "border-rose-400 bg-rose-50/30 ring-1 ring-rose-400 text-slate-900"
                        : "border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 bg-white"
                    }`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmClearTrash();
                    }}
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-rose-500 font-medium pl-24">{passwordError}</p>
                )}
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 px-6 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setClearTrashModalOpen(false);
                  setClearPassword("");
                  setPasswordError("");
                }}
                className="px-4 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmClearTrash}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
