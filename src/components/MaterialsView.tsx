import React, { useState } from "react";
import { recordDownload } from "../lib/operationHistory";
import { useTaggedResources } from "../lib/useResourceTags";
import { resourceTagStore } from "../lib/resourceTags";
import { resourceConfigStore } from "../lib/resourceConfig";
import { useResourceConfig, useConfigFilter } from "../lib/useResourceConfig";
import { useUploadedResources } from "../lib/resourceUploads";
import { PublicTagFilter, PersonalTagFilter } from "./PublicTagFilter";
import { ResourceCategoryFilters, ResourceStatusFilter, ResourceStatusBadge } from "./ResourceConfigControls";
import FinishedVideoDetailModal from "./FinishedVideoDetailModal";
import { Pagination } from "./Pagination";
import { Asset, ResourceSearchIntent } from "../types";
import { toPublishedVideo } from "../lib/publishedVideo";
import { INITIAL_THIRD_PARTY } from "../data/thirdPartyVideos";
import { changeThirdPartyLifecycle, useThirdPartyLifecycle } from "../lib/thirdPartyLifecycle";
import ResourceSearchCondition from "./ResourceSearchCondition";
import ResourceFilterPresets from "./ResourceFilterPresets";
import { VIDEO_PRESET_DEFAULTS } from "../lib/resourceFilterPresets";
import VideoBatchActions from "./VideoBatchActions";
import OverlayPortal from "./overlays/OverlayPortal";
import { useResourceEdits } from "../lib/useResourceEdits";
import { applyVideoBatchChange, VideoBatchChange, VideoResourceMetadata } from "../lib/resourceBatch";
import { DEFAULT_ASSOCIATED_SCRIPTS, DEFAULT_RELATED_VIDEOS } from "../data/videoResourceOptions";
import { 
  Film, 
  Play, 
  CheckCircle2, 
  Share2, 
  Sliders, 
  Download, 
  Copy,
  Sparkles, 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  Flame, 
  Check, 
  Layers, 
  Bot, 
  Video, 
  ExternalLink, 
  Eye, 
  Heart, 
  BarChart3, 
  Scissors, 
  X,
  RefreshCw,
  Zap,
  CheckCircle,
  User,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Calendar,
  Edit3,
  Bookmark,
  Box,
  Pencil,
  Star,
  Paperclip,
  Pause,
  Volume2,
  MoreVertical,
  Tag,
  Columns
} from "lucide-react";

interface UsedMaterial {
  id: string;
  name: string;
  type: "video" | "image" | "audio";
  thumbnail?: string;
  category?: string;
}

interface FinishedVideo extends VideoResourceMetadata {
  id: string;
  numericId?: string;
  title: string;
  videoUrl: string;
  coverUrl: string;
  duration: string;
  resolution: string;
  size: string;
  creator: "ai" | "human";
  aiModel?: string;
  createdAt: string;
  relativeTime?: string;
  syncStatus: "unsynced" | "syncing" | "synced";
  syncedAccounts?: string[];
  shares: number;      // 转发
  likes: number;       // 赞
  comments: number;    // 评论
  cuts?: number;       // 剪切数
  downloads?: number;  // 下载数
  referenceCount?: number;
  author: string;      // 作者
  todayCost?: number;  // 今日消耗
  cost: number;        // 总消耗
  roi?: number;        // Return on Investment
  category?: string;
  typeLabel?: string;  // 示例: 混剪, 剪辑, AI画质
  subtitle?: string;   // 视频底部台词/文字
  tags?: string[];
  status?: string;
  version?: string;
  secondaryCount?: number;
  performanceRating?: "S" | "A" | "B" | "C";
  brandName?: string;
  authorAvatar?: string;
  usedMaterials?: UsedMaterial[];
}

export const INITIAL_FINISHED: FinishedVideo[] = [
  {
        personalTags: ["本周主推"],
    id: "fv1",
    numericId: "110332274",
    title: "0730-8835-鲁月园-复古耳环动态奢感视频.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
    duration: "15s",
    resolution: "1080p",
    size: "14.2 MB",
    creator: "ai",
    aiModel: "seedance_2.5",
    createdAt: "2026-07-31 19:15",
    relativeTime: "1 小时前",
    syncStatus: "synced",
    syncedAccounts: ["抖音小店首饰专营", "巨量千川-黄金海岸推广账户"],
    shares: 0,
    downloads: 0,
    cuts: 0,
    likes: 45200,
    comments: 3200,
    author: "刘弯",
    todayCost: 0,
    cost: 0,
    roi: 3.85,
    category: "女士内衣",
    typeLabel: "混剪",
    subtitle: "不管咱胖不胖",
    tags: ["商品展示","高端质感","达人成片"],
    status: "待审核",
    version: "v2.0 爆款优化版",
    secondaryCount: 5,
    performanceRating: "S",
    usedMaterials: [
      { id: "m1", name: "法式古法金耳环-光泽特写Raw.mp4", type: "video", category: "商品原料" },
      { id: "m2", name: "模特夏日风情佩戴走秀-剪辑切片.mp4", type: "video", category: "模特分镜" },
      { id: "m3", name: "AI算法配音-高奢质感解说.mp3", type: "audio", category: "AI音轨" }
    ]
  },
  {
        personalTags: ["待二创","美妆项目"],
    id: "fv2",
    numericId: "110332275",
    title: "0730-8836-水光针去黄测评-爆款对比.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
    duration: "30s",
    resolution: "1080p",
    size: "24.1 MB",
    creator: "human",
    createdAt: "2026-07-31 18:22",
    relativeTime: "2 小时前",
    syncStatus: "unsynced",
    shares: 12,
    downloads: 5,
    cuts: 2,
    likes: 9800,
    comments: 890,
    author: "张小花",
    todayCost: 120,
    cost: 3200,
    roi: 1.95,
    category: "草本初色内衣",
    typeLabel: "AI画质提升",
    subtitle: "透气无痕聚拢体验",
    tags: ["实测对比","美妆护肤","千川投流"],
    status: "审核通过",
    version: "v1.0 剪辑初稿",
    secondaryCount: 1,
    performanceRating: "B",
    usedMaterials: [
      { id: "m4", name: "水光针瓶身360度展示.mp4", type: "video", category: "实拍材质" },
      { id: "m5", name: "去黄效果前后对比分镜.png", type: "image", category: "对比图" }
    ]
  },
  {
        personalTags: ["本周主推","服饰项目"],
    id: "fv3",
    numericId: "110332276",
    title: "0730-8837-防晒冰丝T恤冷感微距分镜.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    duration: "10s",
    resolution: "2K",
    size: "19.8 MB",
    creator: "ai",
    aiModel: "seedance_2.0-VIP",
    createdAt: "2026-07-31 15:40",
    relativeTime: "5 小时前",
    syncStatus: "synced",
    syncedAccounts: ["抖音号: AIGC潮牌夏装"],
    shares: 88,
    downloads: 34,
    cuts: 6,
    likes: 24000,
    comments: 1800,
    author: "李阿牛",
    todayCost: 1500,
    cost: 8900,
    roi: 2.64,
    category: "女士睡衣",
    typeLabel: "高质感原创",
    subtitle: "瞬间冰感降温",
    tags: ["防晒","清凉冰丝","材质特写"],
    status: "已上机",
    version: "v1.5 迭代分镜版",
    secondaryCount: 3,
    performanceRating: "A",
    usedMaterials: [
      { id: "m6", name: "冰丝面料微距放大切片.mp4", type: "video", category: "3D渲染" },
      { id: "m7", name: "透气粒子流动特写.mp4", type: "video", category: "AI粒子" }
    ]
  },
  {
    id: "fv4",
    numericId: "110332277",
    title: "0730-8838-不粘锅真实口播展示.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80",
    duration: "15s",
    resolution: "720p",
    size: "11.5 MB",
    creator: "human",
    createdAt: "2026-07-31 10:05",
    relativeTime: "10 小时前",
    syncStatus: "unsynced",
    shares: 3,
    downloads: 1,
    cuts: 0,
    likes: 920,
    comments: 88,
    author: "赵铁柱",
    todayCost: 0,
    cost: 500,
    roi: 1.20,
    category: "塑身裤",
    typeLabel: "切片重构",
    subtitle: "真实防粘不粘底",
    tags: ["口播种草","家庭生活","使用过程"],
    status: "审核驳回",
    version: "v1.0 测试版",
    secondaryCount: 0,
    performanceRating: "C",
    usedMaterials: [
      { id: "m8", name: "厨房无油煎蛋对比录屏.mp4", type: "video", category: "现场录屏" }
    ]
  },
  {
    id: "fv5",
    numericId: "110332278",
    title: "0730-8839-高弹透气提臀内裤走秀实拍.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    duration: "18s",
    resolution: "1080p",
    size: "16.8 MB",
    creator: "ai",
    aiModel: "seedance_2.5",
    createdAt: "2026-07-30 22:10",
    relativeTime: "1 天前",
    syncStatus: "synced",
    syncedAccounts: ["巨量千川-爆款账户02"],
    shares: 150,
    downloads: 62,
    cuts: 12,
    likes: 18200,
    comments: 1200,
    author: "王大锤",
    todayCost: 2800,
    cost: 52000,
    roi: 4.12,
    category: "女士内裤",
    typeLabel: "混剪",
    subtitle: "收腹高腰无痕提臀",
    tags: ["高弹透气","模特出镜","服饰内衣"],
    status: "画面利用",
    version: "v3.0 爆款冲榜版",
    secondaryCount: 8,
    performanceRating: "S",
    usedMaterials: [
      { id: "m9", name: "高弹面料拉伸特写.mp4", type: "video", category: "面料展示" }
    ]
  },
  {
        personalTags: ["服饰项目"],
    id: "fv6",
    numericId: "110332279",
    title: "0730-8840-极简美肤衣无感贴合对比镜头.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
    duration: "12s",
    resolution: "1080p",
    size: "13.5 MB",
    creator: "ai",
    aiModel: "seedance_2.5",
    createdAt: "2026-07-30 20:15",
    relativeTime: "1 天前",
    syncStatus: "synced",
    syncedAccounts: ["微信视频号小店推广-01"],
    shares: 42,
    downloads: 18,
    cuts: 3,
    likes: 12400,
    comments: 890,
    author: "陈晨",
    todayCost: 600,
    cost: 15400,
    roi: 3.12,
    category: "4199美肤衣",
    typeLabel: "AI画质",
    subtitle: "隐形无痕 贴肤如丝",
    tags: ["美肤衣","轻盈裸感","效果对比"],
    status: "审核通过",
    version: "v2.1 优化音轨版",
    secondaryCount: 4,
    performanceRating: "A",
    usedMaterials: [
      { id: "m10", name: "美肤衣特写反光面料.mp4", type: "video", category: "面料展示" }
    ]
  },
  {
        personalTags: ["秋季上新"],
    id: "fv7",
    numericId: "110332280",
    title: "0730-8841-保暖内衣发热纤维实验展示.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    duration: "20s",
    resolution: "2K",
    size: "32.0 MB",
    creator: "human",
    createdAt: "2026-07-30 18:30",
    relativeTime: "1 天前",
    syncStatus: "synced",
    syncedAccounts: ["美妆潮流品线巨量账号"],
    shares: 95,
    downloads: 40,
    cuts: 8,
    likes: 31000,
    comments: 2400,
    author: "林杰",
    todayCost: 1200,
    cost: 28000,
    roi: 3.45,
    category: "保暖内衣",
    typeLabel: "高质感原创",
    subtitle: "德绒发热 37度恒温",
    tags: ["秋冬新品","德绒蓄热","实测对比"],
    status: "已上机",
    version: "v1.0 官方正片",
    secondaryCount: 6,
    performanceRating: "S",
    usedMaterials: [
      { id: "m11", name: "红外线测温对比实拍.mp4", type: "video", category: "实验分镜" }
    ]
  },
  {
    id: "fv8",
    numericId: "110332281",
    title: "0730-8842-秒缇8024前扣内衣搭扣方便性演示.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
    duration: "15s",
    resolution: "1080p",
    size: "15.4 MB",
    creator: "ai",
    aiModel: "seedance_2.0-VIP",
    createdAt: "2026-07-30 14:00",
    relativeTime: "1 天前",
    syncStatus: "unsynced",
    shares: 10,
    downloads: 2,
    cuts: 1,
    likes: 5600,
    comments: 420,
    author: "赵雪",
    todayCost: 0,
    cost: 1800,
    roi: 1.80,
    category: "秒缇8024前扣内衣",
    typeLabel: "混剪",
    subtitle: "前扣一秒穿脱 聚拢不空杯",
    tags: ["秒缇前扣","使用过程","细节展示"],
    status: "审核通过",
    version: "v1.2 修改试看",
    secondaryCount: 2,
    performanceRating: "B",
    usedMaterials: [
      { id: "m12", name: "前扣快速扣合慢动作.mp4", type: "video", category: "特写展示" }
    ]
  },
  {
    id: "fv9",
    numericId: "110332282",
    title: "0730-8843-男士莫代尔冰丝内裤蜂窝透气性实测.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
    duration: "16s",
    resolution: "1080p",
    size: "17.1 MB",
    creator: "human",
    createdAt: "2026-07-30 11:20",
    relativeTime: "1 天前",
    syncStatus: "synced",
    syncedAccounts: ["快手金牛-母婴品线账号"],
    shares: 68,
    downloads: 25,
    cuts: 4,
    likes: 19800,
    comments: 1530,
    author: "孙强",
    todayCost: 800,
    cost: 21000,
    roi: 2.98,
    category: "男士内裤",
    typeLabel: "剪辑",
    subtitle: "干爽不闷热 告别黏腻",
    tags: ["男士内衣","高弹透气","实测对比"],
    status: "画面利用",
    version: "v2.0 精剪混剪",
    secondaryCount: 3,
    performanceRating: "A",
    usedMaterials: [
      { id: "m13", name: "干冰穿透布料透气演示.mp4", type: "video", category: "实验特写" }
    ]
  },
  {
    id: "fv10",
    numericId: "110332283",
    title: "0730-8844-少女无钢圈发育期文胸舒爽棉切片.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
    duration: "14s",
    resolution: "1080p",
    size: "14.8 MB",
    creator: "ai",
    aiModel: "seedance_2.5",
    createdAt: "2026-07-30 09:10",
    relativeTime: "1 天前",
    syncStatus: "synced",
    syncedAccounts: ["抖音小店首饰专营"],
    shares: 33,
    downloads: 12,
    cuts: 2,
    likes: 8700,
    comments: 610,
    author: "周婷",
    todayCost: 350,
    cost: 6700,
    roi: 2.25,
    category: "少女内衣",
    typeLabel: "AI画质提升",
    subtitle: "天然有机棉 保护成长期",
    tags: ["少女系列","安全舒适","材质特写"],
    status: "待审核",
    version: "v1.0 试跑版",
    secondaryCount: 1,
    performanceRating: "B",
    usedMaterials: [
      { id: "m14", name: "纯棉柔软弯折捏压.mp4", type: "video", category: "触感展示" }
    ]
  },
  {
    id: "fv11",
    numericId: "110332284",
    title: "0730-8845-8811纯棉舒适家居服情侣款温馨镜头.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80",
    duration: "22s",
    resolution: "2K",
    size: "26.5 MB",
    creator: "human",
    createdAt: "2026-07-29 21:00",
    relativeTime: "2 天前",
    syncStatus: "synced",
    syncedAccounts: ["微信视频号小店推广-01", "巨量千川-黄金海岸推广账户"],
    shares: 210,
    downloads: 88,
    cuts: 15,
    likes: 54000,
    comments: 4100,
    author: "吴磊",
    todayCost: 3200,
    cost: 89000,
    roi: 4.88,
    category: "8811纯棉",
    typeLabel: "高质感原创",
    subtitle: "居家触感 亲肤软糯",
    tags: ["情侣家居","家庭生活","模特出镜"],
    status: "已上机",
    version: "v3.2 全量终版",
    secondaryCount: 10,
    performanceRating: "S",
    usedMaterials: [
      { id: "m15", name: "情侣晨起生活互动切片.mp4", type: "video", category: "场景故事" }
    ]
  },
  {
    id: "fv12",
    numericId: "110332285",
    title: "0730-8846-草本8018无痛矫正姿态塑身衣效果.mp4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80",
    duration: "18s",
    resolution: "1080p",
    size: "18.3 MB",
    creator: "ai",
    aiModel: "seedance_2.5",
    createdAt: "2026-07-29 16:45",
    relativeTime: "2 天前",
    syncStatus: "unsynced",
    shares: 55,
    downloads: 19,
    cuts: 5,
    likes: 16500,
    comments: 1100,
    author: "郑敏",
    todayCost: 450,
    cost: 12300,
    roi: 2.75,
    category: "草本8018",
    typeLabel: "混剪",
    subtitle: "提背直腰 塑造开肩美姿",
    tags: ["体态矫正","前后对比","服饰内衣"],
    status: "画面利用",
    version: "v2.0 优化对比版",
    secondaryCount: 4,
    performanceRating: "A",
    usedMaterials: [
      { id: "m16", name: "侧面站姿矫正对比图.mp4", type: "video", category: "3D骨骼演示" }
    ]
  }
];
INITIAL_FINISHED.push(...["植萃精华使用实拍原素材.mp4","通勤风衣面料细节.mp4","收纳盒容量对比实拍.mp4"].map((title, index) => ({
  ...INITIAL_FINISHED[index % INITIAL_FINISHED.length], id: "materials-analytics-" + (index + 1), title,
  author: ["徐振", "王剪辑", "周雅"][index], downloads: [8, 12, 5][index],
  createdAt: `2026-09-${10 + index} 10:30`, time: `2026-09-${10 + index} 10:30`,
})));

resourceTagStore.register("materials", INITIAL_FINISHED);
resourceConfigStore.register("materials", INITIAL_FINISHED);

const AD_ACCOUNTS_MOCK = [
  "抖音小店首饰专营",
  "巨量千川-黄金海岸推广账户",
  "美妆潮流品线巨量账号",
  "快手金牛-母婴品线账号",
  "微信视频号小店推广-01"
];

// Categories from Screenshot


// Custom invented secondary categories as requested




const SORT_OPTIONS = [
  "最新发布",
  "浏览最多",
  "标题升序",
  "标题降序",
  "下载最多",
  "今日消耗",
  "总消耗",
  "今日消耗（标准）",
  "最早发布",
  "最高ROI"
];

const AD_PLATFORM_TAG_OPTIONS = [
  "不限广告平台标签",
  "低效素材",
  "同质化挤压严重素材",
  "AD优质素材",
  "千川优质素材",
  "首发素材"
];

const COST_RANGE_OPTIONS = [
  "不限",
  "无消耗",
  "无消耗（TK）",
  "爆款视频（总消耗5w）",
  "有消耗",
  "有消耗（TK）",
  "消耗达到1w",
  "消耗达到5w",
  "消耗达到100w"
];

const AUTHOR_TYPE_OPTIONS = ["部门", "分组", "作者"];

const TIME_TYPE_OPTIONS = [
  "上传时间",
  "编辑时间",
  "抖音消耗时间",
  "ADQ消耗时间",
  "TikTok消耗时间"
];

const PUBLIC_TAGS = [
  "姓名", "投放平台（素材必选标签）", "腾讯广告", "快手投手", "达人姓名", "素材类型", "草本剪辑", "8015-摄影/编导（基础）",
  "草本8015摄影师", "达人标签", "8018-沈阳分组"
];

interface MaterialsViewProps {
  resourceScope?: "materials" | "thirdParty";
  uploadedVideos?: Asset[];
  onTriggerTask?: (type: any, name: string, inputUrls: string[], cost: number) => void;
  onNavigateToDelivery?: () => void;
  onDetailStateChange?: (isDetail: boolean) => void;
  initialSearch?: ResourceSearchIntent | null;
  onClearSearch?: () => void;
}

export default function MaterialsView({ uploadedVideos = [], resourceScope = "materials", onTriggerTask, onNavigateToDelivery, onDetailStateChange, initialSearch, onClearSearch }: MaterialsViewProps) {
  const resourceName = resourceScope === "thirdParty" ? "第三方" : "素材";
  const uploaded = useUploadedResources();
  const lifecycle = useThirdPartyLifecycle();
  const [baseVideos, setVideos] = useState<FinishedVideo[]>(() => [...uploadedVideos.map(toPublishedVideo), ...(resourceScope === "thirdParty" ? INITIAL_THIRD_PARTY : INITIAL_FINISHED)]);
  const { edits, saveEdits } = useResourceEdits<VideoResourceMetadata>(resourceScope);
  const uniqueVideos = new Map<string, FinishedVideo>();
  for (const video of [...uploaded.filter((item) => item.resourceCategory === resourceName).map(toPublishedVideo), ...baseVideos]) {
    if (!uniqueVideos.has(video.id)) uniqueVideos.set(video.id, video);
  }
  const untaggedVideos = [...uniqueVideos.values()].filter(video => resourceScope !== "thirdParty" || !lifecycle[video.id] || lifecycle[video.id].state === "active").map(video => ({
      ...video, associatedScripts: DEFAULT_ASSOCIATED_SCRIPTS, relatedVideos: DEFAULT_RELATED_VIDEOS,
      ...edits[video.id],
    }));
  const videos = useTaggedResources<FinishedVideo>(resourceScope, untaggedVideos);
  const [activeTab, setActiveTab] = useState<"all" | "secondary" | "performance">("all");
  
  // Screenshot Filter States
  const [selectedPreset, setSelectedPreset] = useState("");
  const [searchQuery, setSearchQuery] = useState(initialSearch?.query || "");
  React.useEffect(() => { setSearchQuery(initialSearch?.query || ""); }, [initialSearch?.requestId, initialSearch?.query]);
  const [primaryCat, setPrimaryCat] = useState("全部");
  const [primaryMore, setPrimaryMore] = useState(false);
  
  const [secondarySearch, setSecondarySearch] = useState("");
  const [secondaryCat, setSecondaryCat] = useState("全部");
  const [statusVal, setStatusVal] = useState("全部");
  const { store: configStore } = useResourceConfig();
  const PRIMARY_CATEGORIES = ["全部", ...configStore.categories(resourceScope).map(n => n.name)];
  const SECONDARY_CATEGORIES = ["全部", ...configStore.categories(resourceScope).flatMap(n => n.children.map(c => c.name))];
  const STATUS_OPTIONS = ["全部", ...configStore.statuses(resourceScope).map(s => s.name)];
  
  const [publicTagSearch, setPublicTagSearch] = useState("");
  const [publicTagKeyword, setPublicTagKeyword] = useState("");
  const [selectedPublicTag, setSelectedPublicTag] = useState("全部");
  
  const [personalTagSearch, setPersonalTagSearch] = useState("");
  const [personalTagFilter, setPersonalTagFilter] = useState("all");

  // Advanced Search States
  const [sortBy, setSortBy] = useState("最新发布");
  const [adPlatformTag, setAdPlatformTag] = useState("不限广告平台标签");
  const [costRange, setCostRange] = useState("不限");
  const [systemAutoTag, setSystemAutoTag] = useState("请选择系统标签");

  // Toolbar States
  const [authorType, setAuthorType] = useState("作者");
  const [authorInput, setAuthorInput] = useState("");
  const [timeType, setTimeType] = useState("上传时间");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "graph">("grid");
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  React.useEffect(() => { setCurrentPage(1); }, [personalTagFilter, personalTagSearch]);
  const [pageSize, setPageSize] = useState(20);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [activeCardMenu, setActiveCardMenu] = useState<{
    videoId: string;
    type: "download" | "tag" | "share";
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [initialTagModalType, setInitialTagModalType] = useState<"public" | "personal" | undefined>(undefined);

  React.useEffect(() => {
    const tag = initialSearch?.tag;
    if (!tag) return;
    if (PRIMARY_CATEGORIES.includes(tag)) setPrimaryCat(tag);
    else if (SECONDARY_CATEGORIES.includes(tag)) setSecondaryCat(tag);
    else if (STATUS_OPTIONS.includes(tag)) setStatusVal(tag);
    else if (AD_PLATFORM_TAG_OPTIONS.includes(tag)) setAdPlatformTag(tag);
    else if (PUBLIC_TAGS.includes(tag)) setSelectedPublicTag(tag);
    setCurrentPage(1);
  }, [initialSearch?.requestId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Modals / Dialog states
  const [selectedVideo, setSelectedVideo] = useState<FinishedVideo | null>(null);
  const [detailModalVideo, setDetailModalVideo] = useState<FinishedVideo | null>(null);

  React.useEffect(() => {
    if (!initialSearch?.openDetail || !initialSearch.query) return;
    const target = initialSearch.query.trim().toLowerCase();
    const match = videos.find((video) => video.title.toLowerCase() === target || video.id.toLowerCase() === target);
    if (match) setDetailModalVideo(match);
  }, [initialSearch?.requestId]);

  React.useEffect(() => {
    onDetailStateChange?.(!!detailModalVideo);
  }, [detailModalVideo, onDetailStateChange]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [targetAccount, setTargetAccount] = useState(AD_ACCOUNTS_MOCK[0]);
  const [syncBudget, setSyncBudget] = useState("1000");
  const [syncLoading, setSyncLoading] = useState(false);
  const [accountsList, setAccountsList] = useState<string[]>(AD_ACCOUNTS_MOCK);

  // Custom Edit Operations Dialog
  const [activeEditorVideo, setActiveEditorVideo] = useState<FinishedVideo | null>(null);
  const [editorType, setEditorType] = useState<"eraser" | "upscale" | "split_rebuild" | null>(null);
  const [rebuildPrompt, setRebuildPrompt] = useState("对此片段镜头重构为：在更加明亮的阳光下展示，加入玫瑰金丝绸背景微风吹拂。");
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("ad_accounts");
      if (stored) {
        const parsed = JSON.parse(stored);
        const activeNames = parsed
          .filter((acc: any) => acc.deptId !== "")
          .map((acc: any) => acc.name);
        if (activeNames.length > 0) {
          setAccountsList(activeNames);
          setTargetAccount(activeNames[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const presetFilters = { searchQuery, primaryCat, secondarySearch, secondaryCat, statusVal, publicTagSearch, publicTagKeyword, selectedPublicTag, personalTagSearch, personalTagFilter, sortBy, adPlatformTag, costRange, systemAutoTag, authorType, authorInput, timeType, startDate, endDate };
  const applyPresetFilters = (next: typeof VIDEO_PRESET_DEFAULTS) => {
    setSearchQuery(next.searchQuery);
    setPrimaryCat(next.primaryCat);
    setSecondarySearch(next.secondarySearch);
    setSecondaryCat(next.secondaryCat);
    setStatusVal(next.statusVal);
    setPublicTagSearch(next.publicTagSearch);
    setPublicTagKeyword(next.publicTagKeyword);
    setSelectedPublicTag(next.selectedPublicTag);
    setPersonalTagSearch(next.personalTagSearch);
    setPersonalTagFilter(next.personalTagFilter);
    setSortBy(next.sortBy);
    setAdPlatformTag(next.adPlatformTag);
    setCostRange(next.costRange);
    setSystemAutoTag(next.systemAutoTag);
    setAuthorType(next.authorType);
    setAuthorInput(next.authorInput);
    setTimeType(next.timeType);
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    setCurrentPage(1);
    setSelectedVideoIds([]);
    setSelectAllPage(false);
    setIsSelectionActive(false);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedPreset("");
    setPrimaryCat("全部");
    setSecondarySearch("");
    setSecondaryCat("全部");
    setStatusVal("全部");
    setPublicTagSearch("");
    setPublicTagKeyword("");
    setSelectedPublicTag("全部");
    setPersonalTagSearch("");
    setPersonalTagFilter("all");
    setSortBy("最新发布");
    setAdPlatformTag("不限广告平台标签");
    setCostRange("不限");
    setSystemAutoTag("请选择系统标签");
    setAuthorType("作者");
    setAuthorInput("");
    setTimeType("上传时间");
    setStartDate("");
    setEndDate("");
    setSelectAllPage(false);
    setSelectedVideoIds([]);
    setIsSelectionActive(false);
    setOpenDropdown(null);
  };

  // Filter Logic
  const filteredVideos = videos.filter(v => {
    const homeSearch = searchQuery.trim().toLowerCase();
    const matchesHomeSearch = !homeSearch || [v.title, v.category, v.typeLabel, v.author, ...(v.tags || [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(homeSearch));
    if (!matchesHomeSearch) return false;

    // Primary category
    const [primary, secondary] = (v.category || "").split(" / ");
    const matchesPrimary = primaryCat === "全部" || primary === primaryCat;
    
    // Secondary category search / option
    const matchesSecondarySearch = !secondarySearch ? true : v.title.toLowerCase().includes(secondarySearch.toLowerCase());
    const matchesSecondaryCat = secondaryCat === "全部" || secondary === secondaryCat;
    
    // Status
    const matchesStatus = !configStore.statusEnabled(resourceScope) || statusVal === "全部" || v.status === statusVal;
    
    // Public tag
    const matchesPublicSearch = !publicTagSearch ? true : v.tags?.some(t => t.toLowerCase().includes(publicTagSearch.toLowerCase()));
    const matchesPublicTagSelect = selectedPublicTag === "全部" ? true : v.tags?.includes(selectedPublicTag);

    // Personal tag
    const matchesPersonalSearch = !personalTagSearch || v.personalTags?.some(tag => tag.includes(personalTagSearch));
    const matchesPersonalFilter = personalTagFilter === "all" || (personalTagFilter === "none" ? !v.personalTags?.length
      : personalTagFilter === "has" ? Boolean(v.personalTags?.length) : v.personalTags?.includes(personalTagFilter));

    // Author
    const matchesAuthor = !authorInput ? true : v.author.toLowerCase().includes(authorInput.toLowerCase());

    // Ad Platform Tag
    const matchesAdPlatformTag = (adPlatformTag === "不限广告平台标签" || adPlatformTag === "请选择广告平台")
      ? true
      : (v.tags?.includes(adPlatformTag) || v.title.includes(adPlatformTag));

    // Cost Range
    const matchesCostRange = (() => {
      if (costRange === "不限") return true;
      if (costRange === "无消耗" || costRange === "无消耗（TK）") return v.cost === 0;
      if (costRange === "有消耗" || costRange === "有消耗（TK）") return v.cost > 0;
      if (costRange === "爆款视频（总消耗5w）" || costRange === "消耗达到5w") return v.cost >= 50000;
      if (costRange === "消耗达到1w") return v.cost >= 10000;
      if (costRange === "消耗达到100w") return v.cost >= 1000000;
      return true;
    })();

    return matchesPrimary && matchesSecondarySearch && matchesSecondaryCat && matchesStatus && matchesPublicSearch && matchesPublicTagSelect && matchesPersonalSearch && matchesPersonalFilter && matchesAuthor && matchesAdPlatformTag && matchesCostRange;
  }).sort((a, b) => {
    if (sortBy === "最新发布") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "最早发布") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "最高消耗" || sortBy === "总消耗" || sortBy === "今日消耗" || sortBy === "今日消耗（标准）") return b.cost - a.cost;
    if (sortBy === "最高ROI") return (b.roi || 0) - (a.roi || 0);
    if (sortBy === "浏览最多") return (b.likes + b.shares) - (a.likes + a.shares);
    if (sortBy === "下载最多") return resourceScope === "materials" ? (b.downloads ?? 0) - (a.downloads ?? 0) : b.shares - a.shares;
    if (sortBy === "标题升序") return a.title.localeCompare(b.title, "zh-CN");
    if (sortBy === "标题降序") return b.title.localeCompare(a.title, "zh-CN");
    return 0;
  });

  // Pagination calculations
  const totalCount = filteredVideos.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  React.useEffect(() => {
    setSelectAllPage(paginatedVideos.length > 0 && paginatedVideos.every(video => selectedVideoIds.includes(video.id)));
  }, [currentPage, pageSize, selectedVideoIds.join(","), paginatedVideos.map(video => video.id).join(",")]);

  const handleSelectAllPageToggle = () => {
    if (selectAllPage) {
      const currentIds = paginatedVideos.map(v => v.id);
      setSelectedVideoIds(prev => prev.filter(id => !currentIds.includes(id)));
      setSelectAllPage(false);
    } else {
      setIsSelectionActive(true);
      const currentIds = paginatedVideos.map(v => v.id);
      setSelectedVideoIds(prev => Array.from(new Set([...prev, ...currentIds])));
      setSelectAllPage(true);
    }
  };

  const applyBatchChange = (ids: string[], change: VideoBatchChange) => {
    const updated = applyVideoBatchChange(videos, ids, change);
    const patches = Object.fromEntries(updated.filter(video => ids.includes(video.id)).map(video => [video.id, {
      tags: video.tags, personalTags: video.personalTags, status: video.status,
      category: video.category, associatedScripts: video.associatedScripts, relatedVideos: video.relatedVideos,
    }]));
    if (saveEdits(patches)) return true;
    showToast("保存失败，请检查浏览器存储空间后重新操作");
    return false;
  };

  const handleSyncToAd = (video: FinishedVideo) => {
    setSelectedVideo(video);
    setShowSyncModal(true);
  };

  const handleConfirmSync = () => {
    if (!selectedVideo) return;
    setSyncLoading(true);
    
    setTimeout(() => {
      setSyncLoading(false);
      setShowSyncModal(false);
      
      setVideos(prev => prev.map(v => {
        if (v.id === selectedVideo.id) {
          const originalAccounts = v.syncedAccounts || [];
          return {
            ...v,
            syncStatus: "synced",
            status: "已投放",
            syncedAccounts: Array.from(new Set([...originalAccounts, targetAccount, "巨量千川同步组"]))
          };
        }
        return v;
      }));

      try {
        const newTask = {
          id: "task_" + Date.now(),
          videoId: selectedVideo.id,
          videoTitle: selectedVideo.title,
          videoCover: selectedVideo.coverUrl,
          advertiserName: targetAccount,
          pitcher: "未认领",
          status: "pending_claim",
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          budget: Number(syncBudget),
          is_aigc: selectedVideo.creator === "ai",
          duration: selectedVideo.duration,
          resolution: selectedVideo.resolution,
          size: selectedVideo.size
        };
        const existingTasks = JSON.parse(localStorage.getItem("delivery_tasks") || "[]");
        localStorage.setItem("delivery_tasks", JSON.stringify([newTask, ...existingTasks]));
      } catch (e) {
        console.error("Failed to write delivery task", e);
      }

      setActionSuccessToast(`🎉 成功将《${selectedVideo.title.slice(0, 15)}...》推送至投放交接池！`);
      setTimeout(() => setActionSuccessToast(null), 4000);
      setSelectedVideo(null);
    }, 1500);
  };

  const triggerEditAction = (type: "subtitle" | "enhance" | "rebuild") => {
    if (!activeEditorVideo) return;
    
    const taskName = 
      type === "subtitle" ? `智能字幕/水印擦除 - ${activeEditorVideo.title.slice(0, 15)}` :
      type === "enhance" ? `4K/2K 超分辨率增强 - ${activeEditorVideo.title.slice(0, 15)}` :
      `指定片段镜头重构 - ${activeEditorVideo.title.slice(0, 15)}`;

    if (onTriggerTask) {
      onTriggerTask(
        type === "subtitle" ? "subtitle" : type === "enhance" ? "enhance" : "video_gen", 
        taskName, 
        [activeEditorVideo.coverUrl], 
        type === "enhance" ? 5.0 : 3.0
      );
      
      setActionSuccessToast(`🚀 编辑重构任务已成功添加到右侧“云渲染计算排队”中！`);
      setTimeout(() => setActionSuccessToast(null), 4000);
      setActiveEditorVideo(null);
      setEditorType(null);
    } else {
      alert(`已成功创建 [${taskName}] 计算任务！`);
      setActiveEditorVideo(null);
      setEditorType(null);
    }
  };

  const handleDeleteVideo = (id: string) => {
    if (confirm("删除后将把该素材移入管理端集中回收站，当前用户将无法继续查看；如需恢复请联系管理员。确认继续吗？")) {
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  };

  if (detailModalVideo) {
    return (
      <FinishedVideoDetailModal
        isMaterialMode={true}
        resourceScope={resourceScope}
        onDelete={resourceScope === "thirdParty" ? () => {
          changeThirdPartyLifecycle([detailModalVideo.id], "trash", "用户端");
          setDetailModalVideo(null);
          showToast("第三方视频已移入回收站");
        } : undefined}
        key={detailModalVideo.id}
        video={videos.find(video => video.id === detailModalVideo.id) || detailModalVideo}
        onUpdate={(patch) => saveEdits({ [detailModalVideo.id]: patch })}
        onClose={() => {
          setDetailModalVideo(null);
          setInitialTagModalType(undefined);
        }}
        onSyncToAd={(vid) => handleSyncToAd(vid)}
        initialTagModal={initialTagModalType}
      />
    );
  }

  return (
    <div data-testid="material-resource-view" data-resource-scope={resourceScope} className="flex-1 overflow-y-auto bg-slate-50 p-5 space-y-4 text-slate-800 font-sans relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <OverlayPortal layer="toast" role="status" className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border border-white/20 animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </OverlayPortal>
      )}

      {/* Card Dropdown Menu Backdrop */}
      {activeCardMenu && (
        <div 
          className="fixed inset-0 z-30 bg-transparent cursor-default" 
          onClick={() => setActiveCardMenu(null)} 
        />
      )}
      




      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-purple-900 text-white px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in max-w-md text-xs">
          <Zap className="w-4 h-4 text-purple-300" />
          <div>
            <p className="font-bold">平台操作响应成功</p>
            <p className="text-purple-200 mt-0.5">{actionSuccessToast}</p>
          </div>
        </div>
      )}

      {/* SECONDARY TAB VIEW */}
      {activeTab === "secondary" && (
        <div className="space-y-4 animate-fade-in">
          {/* Secondary Creation Header Banner */}
          <div className="bg-white rounded-2xl border border-purple-200/80 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>二创复投中心 (爆款视频二次剪辑与裂变投递)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  筛选高ROI爆款成片，一键进行 AI 自动拆解重构、去字幕换音轨、多镜头微调并一键推送至广告库复投。
                </p>
              </div>

              <button
                onClick={() => {
                  setActionSuccessToast("🚀 已成功发起 [全量高ROI爆款一键裂变]，5支衍生新成片进入异步渲染管道！");
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>一键批量裂变所有爆款 (ROI ≥ 2.0)</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                <span className="text-purple-600 text-[10px] font-bold block">可二创爆款基底</span>
                <span className="text-lg font-black text-purple-900 font-mono">
                  {videos.filter(v => (v.roi || 0) >= 2.0).length} 支
                </span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <span className="text-amber-700 text-[10px] font-bold block">已衍生二创新版本</span>
                <span className="text-lg font-black text-amber-900 font-mono">12 支</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 text-[10px] font-bold block">二创复投贡献消耗</span>
                <span className="text-lg font-black text-emerald-900 font-mono">¥48,200</span>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <span className="text-indigo-700 text-[10px] font-bold block">二创平均 ROAS</span>
                <span className="text-lg font-black text-indigo-900 font-mono">3.42x</span>
              </div>
            </div>
          </div>

          {/* List of High-ROI Videos for Secondary Creation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.filter(v => (v.roi || 0) >= 2.0).map(v => (
              <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex gap-3">
                  <img src={v.coverUrl} className="w-28 h-20 rounded-xl object-cover border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded font-mono">
                        ROI {v.roi}x · S级爆款
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">版本: {v.version || "v2.0"}</span>
                    </div>
                    <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{v.title}</h3>
                    <p className="text-[10px] text-slate-500">责任编导: {v.author} | 已衍生二创: {v.secondaryCount || 3} 支</p>
                    <div className="text-[10px] text-purple-700 font-medium truncate">
                      关联素材: {v.usedMaterials?.map(m => m.name).join(", ") || "法式古法金耳环, 模特走秀"}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => {
                      setActionSuccessToast(`🚀 已针对《${v.title.slice(0, 10)}...》发起 [AI 5支分镜衍生裂变]！`);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>一键 AI 衍生 5 支新成片</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveEditorVideo(v);
                      setEditorType("split_rebuild");
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Scissors className="w-3.5 h-3.5 text-slate-500" />
                    <span>镜头微调重构</span>
                  </button>

                  <button
                    onClick={() => handleSyncToAd(v)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>一键二次复投</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERFORMANCE TAB VIEW */}
      {activeTab === "performance" && (
        <div className="space-y-5 animate-fade-in">
          {/* Performance Overview Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <span>内容部门绩效分析与爆款素材源归因</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  透视编导/剪辑师/AI模型产出成片数与爆款率，溯源最常被剪成爆款的黄金素材源。
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                全部门考评周期: 2026年7月
              </span>
            </div>

            {/* 1. Leaderboard Table for Team Performance */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-600" />
                <span>创作者与部门绩效贡献榜</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-2.5">创作者/责任人</th>
                      <th className="p-2.5">角色分类</th>
                      <th className="p-2.5">产出成片数</th>
                      <th className="p-2.5">爆款率 (ROI≥2.0)</th>
                      <th className="p-2.5">贡献投放总消耗</th>
                      <th className="p-2.5">平均 ROAS/ROI</th>
                      <th className="p-2.5">绩效星级</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {[
                      { name: "王大锤", role: "责任编导", count: 12, rate: "75%", cost: "¥68,500", roi: "3.85x", grade: "S级 爆款编导" },
                      { name: "Seedance 2.5 (AI)", role: "AI 大模型", count: 18, rate: "66.7%", cost: "¥92,100", roi: "3.20x", grade: "S级 AI引擎" },
                      { name: "张小花", role: "摄影/剪辑", count: 8, rate: "50%", cost: "¥24,000", roi: "2.10x", grade: "A级 优秀剪辑" },
                      { name: "李阿牛", role: "特效/剪辑", count: 6, rate: "60%", cost: "¥18,900", roi: "2.64x", grade: "A级 精剪师" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{row.name}</td>
                        <td className="p-2.5 text-slate-500">{row.role}</td>
                        <td className="p-2.5 font-mono font-bold text-purple-700">{row.count} 支</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">{row.rate}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{row.cost}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-600">{row.roi}</td>
                        <td className="p-2.5">
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-extrabold border border-purple-200">
                            {row.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Top Performing Raw Material Lineage */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>爆款源素材归因贡献榜 (哪些Raw素材最容易出爆款)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {[
                  { name: "法式古法金耳环-光泽特写Raw.mp4", type: "商品原料", refCount: 8, spend: "¥52,400", roi: "3.85x", level: "S级 黄金主词原料" },
                  { name: "模特夏日风情佩戴走秀-剪辑切片.mp4", type: "模特分镜", refCount: 6, spend: "¥38,900", roi: "3.40x", level: "S级 优质画面源" },
                  { name: "AI算法配音-高奢质感解说.mp3", type: "AI音轨", refCount: 11, spend: "¥71,200", roi: "3.10x", level: "A级 通用金牌BGM" }
                ].map((mat, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                        {mat.level}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">引用成片 {mat.refCount} 支</span>
                    </div>
                    <h4 className="font-bold text-slate-900 truncate">{mat.name}</h4>
                    <div className="text-[10px] text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-200/60">
                      <span>累计贡献消耗: <strong className="text-slate-800">{mat.spend}</strong></span>
                      <span className="text-purple-700 font-bold">ROI {mat.roi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ALL TAB VIEW ===== */}
      {activeTab === "all" && (
        <>
          {/* ===== FILTER CARD (EXACT REPLICA OF ATTACHED SCREENSHOT) ===== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5 text-xs text-slate-700">
        
        {/* ROW 1: 常用筛选预设 */}
        <div className="flex justify-end items-center gap-2 pb-1 border-b border-slate-100/60">
          <ResourceFilterPresets scope={resourceScope} defaults={VIDEO_PRESET_DEFAULTS} value={presetFilters}
            selectedName={selectedPreset} onSelectName={setSelectedPreset} onApply={applyPresetFilters}
            seeds={[
              { name: "高爆款素材预设", filters: { costRange: "消耗达到5w", sortBy: "总消耗" } },
              { name: "女装新品投放预设", filters: { primaryCat: "女士内衣" } },
            ]} />
        </div>

        {/* ROW 2: 一级分类 */}
          <ResourceCategoryFilters scope={resourceScope} primary={primaryCat} secondary={secondaryCat} search={secondarySearch}
            onPrimary={setPrimaryCat} onSecondary={setSecondaryCat} onSearch={setSecondarySearch} />

        {/* ROW 3: 二级分类 (Custom invented options) */}


        {/* ROW 4: 状 态 */}
        <ResourceStatusFilter scope={resourceScope} value={statusVal} onChange={setStatusVal} />

        {/* ROW 5: 公共标签 */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-slate-900 font-bold shrink-0 w-20 text-right pr-2">公共标签：</span>
          <PublicTagFilter
            searchKeyword={publicTagKeyword}
            onSearchKeywordChange={setPublicTagKeyword}
            selectedTag={selectedPublicTag}
            onSelectTag={(tag) => setSelectedPublicTag(tag)}
          />
        </div>

        {/* ROW 6: 个人标签 */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-slate-900 font-bold shrink-0 w-20 text-right pr-2">个人标签：</span>
          <PersonalTagFilter
            searchKeyword={personalTagSearch}
            onSearchKeywordChange={setPersonalTagSearch}
            selectedTag={({ all: "全部", none: "无个人标签", has: "有个人标签" }[personalTagFilter] || personalTagFilter)}
            onSelectTag={(tag) => setPersonalTagFilter({ "全部": "all", "无个人标签": "none", "有个人标签": "has" }[tag] || tag)}
          />
        </div>

      </div>

      <ResourceSearchCondition query={searchQuery} onClear={() => { setSearchQuery(""); onClearSearch?.(); }} />

      {/* ===== ROW 7: 高级搜索 ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-900 font-bold shrink-0">高级搜索：</span>

          {/* 排序 */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
            <span className="text-slate-900 font-bold shrink-0">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 广告平台标签 */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
            <span className="text-slate-900 font-bold shrink-0">广告平台标签：</span>
            <select
              value={adPlatformTag}
              onChange={(e) => setAdPlatformTag(e.target.value)}
              className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
            >
              {AD_PLATFORM_TAG_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 消耗 */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
            <span className="text-slate-900 font-bold shrink-0">消耗：</span>
            <select
              value={costRange}
              onChange={(e) => setCostRange(e.target.value)}
              className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
            >
              {COST_RANGE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 系统自动标签 */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
            <span className="text-slate-900 font-bold shrink-0">系统自动标签：</span>
            <select
              value={systemAutoTag}
              onChange={(e) => setSystemAutoTag(e.target.value)}
              className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="请选择系统标签">请选择系统标签</option>
              <option value="AI智能高分">AI智能高分</option>
              <option value="原声口播">原声口播</option>
              <option value="高光分镜">高光分镜</option>
            </select>
          </div>
        </div>

        {/* Reset filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg font-bold transition-all shadow-xs cursor-pointer"
          >
            重置
          </button>
        </div>
      </div>

      {/* ===== ROW 8: BOTTOM ACTION TOOLBAR ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs relative">

        {isSelectionActive || selectedVideoIds.length > 0 ? (
          /* ACTIVE SELECTION TOOLBAR (Matching reference screenshot) */
          <div className="flex flex-wrap items-center gap-2 text-xs z-50">
            {/* 取消选择 Button */}
            <button
              onClick={() => {
                setIsSelectionActive(false);
                setSelectedVideoIds([]);
                setSelectAllPage(false);
                setOpenDropdown(null);
              }}
              className="border border-purple-500 text-purple-600 bg-white hover:bg-purple-50 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-2xs transition-all shrink-0"
            >
              取消选择
            </button>

            {/* 选中本页 Button */}
            <button
              onClick={handleSelectAllPageToggle}
              className={`border border-purple-500 text-purple-600 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-2xs transition-all flex items-center gap-1.5 shrink-0 ${
                selectAllPage ? "bg-purple-50/90" : "bg-white hover:bg-purple-50"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                selectAllPage ? "bg-purple-600 text-white" : "border-2 border-purple-400 bg-white text-transparent"
              }`}>✓</div>
              <span>选中本页</span>
            </button>

            {/* 已选： X 个 Label */}
            <div className="text-slate-700 font-medium text-xs whitespace-nowrap shrink-0 px-1">
              已选： <span className="text-purple-600 font-bold font-mono text-sm px-0.5">{selectedVideoIds.length}</span> 个
            </div>

            <VideoBatchActions videos={videos} selectedIds={selectedVideoIds}
              isMaterialMode={true} resourceScope={resourceScope} onApply={applyBatchChange} showToast={showToast} />
          </div>
        ) : (
          /* STANDARD UNSELECTED BAR */
          <>
            {/* Left: 选择 / 选中本页 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSelectionActive(true);
                }}
                className="border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 cursor-pointer transition-all"
              >
                选择
              </button>

              <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer hover:text-purple-600">
                <input
                  type="checkbox"
                  checked={selectAllPage}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setIsSelectionActive(true);
                      setSelectAllPage(true);
                      setSelectedVideoIds(filteredVideos.map(v => v.id));
                    } else {
                      setSelectAllPage(false);
                      setSelectedVideoIds([]);
                    }
                  }}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>选中本页</span>
              </label>
            </div>

            {/* Middle: 作者 & 上传时间 */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <select
                  value={authorType}
                  onChange={(e) => setAuthorType(e.target.value)}
                  className="bg-slate-50 border-r border-slate-200 px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none cursor-pointer"
                >
                  {AUTHOR_TYPE_OPTIONS.map(at => (
                    <option key={at} value={at}>{at}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="请选择(支持输入搜索)"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-normal text-slate-700 focus:outline-none w-36 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <select
                  value={timeType}
                  onChange={(e) => setTimeType(e.target.value)}
                  className="bg-slate-50 border-r border-slate-200 px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none cursor-pointer"
                >
                  {TIME_TYPE_OPTIONS.map(tt => (
                    <option key={tt} value={tt}>{tt}</option>
                  ))}
                </select>
                <div className="flex items-center px-2 py-1.5 text-slate-400 gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs text-slate-700 font-normal focus:outline-none cursor-pointer"
                  />
                  <span className="text-slate-300 font-normal">至</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs text-slate-700 font-normal focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Right: View Toggles */}
        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white shrink-0 ml-auto z-50">
          <button
            onClick={() => setViewMode("graph")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === "graph" ? "bg-purple-100 text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
            title="拓扑图谱视图"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === "grid" ? "bg-purple-100 text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
            title="网格卡片视图"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === "list" ? "bg-purple-100 text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
            title="列表明细视图"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===== FINISHED VIDEOS DISPLAY ===== */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 flex flex-col items-center justify-center text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-3 animate-pulse">
            <Film className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">未找到符合条件的爆款成片</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            您可以尝试更改上方的筛选器、或者重置所有筛选规则。
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
          >
            重置所有筛选条件
          </button>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW MODE */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectAllPage}
                    onChange={handleSelectAllPageToggle}
                    className="rounded border-slate-300 text-purple-600"
                  />
                </th>
                <th className="p-3">成片预览与标题</th>
                <th className="p-3">制作者</th>
                <th className="p-3">所属分类</th>
                <th className="p-3">投放消耗</th>
                <th className="p-3">ROI</th>
                <th className="p-3">状态</th>
                <th className="p-3">生成时间</th>
                <th className="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVideos.map((video) => (
                <tr key={video.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedVideoIds.includes(video.id)}
                      onChange={() => {
                        setIsSelectionActive(true);
                        setSelectedVideoIds(prev => {
                          const isCurrentlySelected = prev.includes(video.id);
                          const next = isCurrentlySelected ? prev.filter(id => id !== video.id) : [...prev, video.id];
                          setSelectAllPage(next.length === filteredVideos.length && filteredVideos.length > 0);
                          return next;
                        });
                      }}
                      className="rounded border-slate-300 text-purple-600"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 bg-slate-900 rounded overflow-hidden relative shrink-0">
                        <img src={video.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white">
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </a>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{video.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{video.duration} | {video.resolution} | {video.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">
                    {video.creator === "ai" ? "AI 智能生成" : "精剪师剪制"}
                  </td>
                  <td className="p-3 text-slate-600">{video.category || "女士内衣"}</td>
                  <td className="p-3 font-mono font-bold text-orange-600">¥{video.cost.toLocaleString()}</td>
                  <td className="p-3 font-mono font-bold text-purple-600">{video.roi ? `${video.roi.toFixed(2)}x` : "-"}</td>
                  <td className="p-3">
                    <ResourceStatusBadge scope={resourceScope} status={video.status} />
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[10px]">{video.createdAt}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailModalVideo(video)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <BarChart3 className="w-3 h-3 text-purple-600" />
                        <span>{resourceName}详情</span>
                      </button>
                      <button
                        onClick={() => handleSyncToAd(video)}
                        className="hidden bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-xs cursor-pointer"
                      >
                        同步投放
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW MODE matching reference screenshot style */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {paginatedVideos.map((video) => {
            const getStatusBadgeStyle = (st?: string) => {
              switch (st) {
                case "待审核": return "bg-[#f08080] text-white";
                case "审核通过": return "bg-emerald-500 text-white";
                case "审核驳回": return "bg-rose-500 text-white";
                case "已修改": return "bg-amber-500 text-white";
                case "二次修改": return "bg-orange-500 text-white";
                case "已上机":
                case "已投放": return "bg-purple-600 text-white";
                case "画面利用": return "bg-indigo-500 text-white";
                case "放弃":
                case "放弃测试": return "bg-slate-400 text-white";
                default: return "bg-[#f08080] text-white";
              }
            };

            const isSelected = selectedVideoIds.includes(video.id);
            const isSelectionModeActive = isSelectionActive || selectedVideoIds.length > 0;
            const isMenuOpen = activeCardMenu?.videoId === video.id;

            return (
              <div 
                key={video.id}
                data-testid="material-video-card"
                data-resource-id={video.id}
                onMouseEnter={() => setHoveredVideoId(video.id)}
                onMouseLeave={() => {
                  if (!isMenuOpen) {
                    setHoveredVideoId(null);
                  }
                }}
                onClick={() => {
                  if (isSelectionModeActive) {
                    setSelectedVideoIds(prev => {
                      const isCurrentlySelected = prev.includes(video.id);
                      const next = isCurrentlySelected ? prev.filter(id => id !== video.id) : [...prev, video.id];
                      setSelectAllPage(next.length === filteredVideos.length && filteredVideos.length > 0);
                      return next;
                    });
                  } else {
                    setDetailModalVideo(video);
                  }
                }}
                className={`bg-white border rounded-2xl shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative cursor-pointer ${
                  isMenuOpen ? "z-50 overflow-visible" : "z-10 overflow-hidden"
                } ${
                  isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-200/90"
                }`}
              >
                {/* HOVER VIDEO PREVIEW OVERLAY (only when NOT in selection mode) */}
                {(hoveredVideoId === video.id || isMenuOpen) && !isSelectionModeActive && (
                  <div className={`absolute inset-0 z-40 bg-slate-950 rounded-2xl flex flex-col justify-between pointer-events-auto ${
                    isMenuOpen ? "overflow-visible" : "overflow-hidden"
                  }`}>
                    {/* Media Layer with rounded corner clipping */}
                    <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden pointer-events-none">
                      {/* Fallback Cover Image so it is NEVER pitch black */}
                      <img 
                        src={video.coverUrl} 
                        alt={video.title} 
                        className="w-full h-full object-cover absolute inset-0 z-0 opacity-90"
                        referrerPolicy="no-referrer"
                      />

                      {/* Playing Video Layer */}
                      <video 
                        src={video.videoUrl} 
                        poster={video.coverUrl}
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover absolute inset-0 z-0" 
                      />
                    </div>

                    {/* TOP BAR OVERLAY */}
                    <div className="relative z-20 p-2 flex items-center justify-between w-full">
                      {/* Top Left: Duration Pill */}
                      <div className="bg-black/60 backdrop-blur-md text-white font-mono text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs border border-white/10 shrink-0">
                        <span>00:29</span>
                      </div>

                      {/* Top Right: 3 Action Icons (下载, 标签, 分享) */}
                      <div className="flex items-center gap-1 z-20">
                        {/* 1. 下载按钮 (与下拉选项) */}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardMenu(
                                activeCardMenu?.videoId === video.id && activeCardMenu?.type === "download"
                                  ? null
                                  : { videoId: video.id, type: "download" }
                              );
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shadow-md transition-all cursor-pointer ${
                              activeCardMenu?.videoId === video.id && activeCardMenu?.type === "download"
                                ? "bg-purple-600 text-white scale-105"
                                : "bg-black/60 hover:bg-purple-600 text-white/90 hover:text-white border border-white/20"
                            }`}
                            title="下载"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Download Dropdown */}
                          {activeCardMenu?.videoId === video.id && activeCardMenu?.type === "download" && (
                            <div 
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-44 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-medium text-slate-700 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(null);
                                  const a = document.createElement("a");
                                  a.href = video.videoUrl;
                                  a.download = `${video.title}_原片.mp4`;
                                  recordDownload(a.download, resourceScope === "thirdParty" ? "第三方" : "素材");
                                  a.target = "_blank";
                                  a.click();
                                  showToast("📥 开始下载无水印原片...");
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer block"
                              >
                                下载原片
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(null);
                                  const a = document.createElement("a");
                                  a.href = video.videoUrl;
                                  a.download = `${video.title}_转码.mp4`;
                                  recordDownload(a.download, resourceScope === "thirdParty" ? "第三方" : "素材");
                                  a.target = "_blank";
                                  a.click();
                                  showToast("📥 开始下载转码视频...");
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer block"
                              >
                                下载转码视频
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(null);
                                  const a = document.createElement("a");
                                  a.href = video.videoUrl;
                                  a.download = `${video.title}_预览水印.mp4`;
                                  recordDownload(a.download, resourceScope === "thirdParty" ? "第三方" : "素材");
                                  a.target = "_blank";
                                  a.click();
                                  showToast("📥 开始下载带水印预览视频...");
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer block"
                              >
                                下载预览视频 (带水印)
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 2. 标签按钮 (与下拉选项) */}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardMenu(
                                activeCardMenu?.videoId === video.id && activeCardMenu?.type === "tag"
                                  ? null
                                  : { videoId: video.id, type: "tag" }
                              );
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shadow-md transition-all cursor-pointer ${
                              activeCardMenu?.videoId === video.id && activeCardMenu?.type === "tag"
                                ? "bg-purple-600 text-white scale-105"
                                : "bg-black/60 hover:bg-purple-600 text-white/90 hover:text-white border border-white/20"
                            }`}
                            title="标签"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Tag Dropdown */}
                          {activeCardMenu?.videoId === video.id && activeCardMenu?.type === "tag" && (
                            <div 
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-36 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-medium text-slate-700 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(null);
                                  setInitialTagModalType("public");
                                  setDetailModalVideo(video);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer block"
                              >
                                添加公共标签
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(null);
                                  setInitialTagModalType("personal");
                                  setDetailModalVideo(video);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer block"
                              >
                                添加个人标签
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 3. 分享按钮 (与下拉选项) */}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardMenu(
                                activeCardMenu?.videoId === video.id && activeCardMenu?.type === "share"
                                  ? null
                                  : { videoId: video.id, type: "share" }
                              );
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shadow-md transition-all cursor-pointer ${
                              activeCardMenu?.videoId === video.id && activeCardMenu?.type === "share"
                                ? "bg-purple-600 text-white scale-105"
                                : "bg-black/60 hover:bg-purple-600 text-white/90 hover:text-white border border-white/20"
                            }`}
                            title="分享"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Share Dropdown */}
                          {activeCardMenu?.videoId === video.id && activeCardMenu?.type === "share" && (
                            <div 
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-36 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-medium text-slate-700 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(null);
                                  navigator.clipboard?.writeText(`${window.location.origin}/video/pc/${video.id}`);
                                  showToast("🔗 PC端预览链接已复制到剪贴板！");
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer block"
                              >
                                复制PC端链接
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(null);
                                  navigator.clipboard?.writeText(`${window.location.origin}/video/m/${video.id}`);
                                  showToast("📱 移动端预览链接已复制到剪贴板！");
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer block"
                              >
                                复制移动端链接
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM PLAYBACK CONTROLS & PROGRESS BAR */}
                    <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-4 flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between text-white">
                        <button onClick={(e) => e.stopPropagation()} className="p-0.5 hover:scale-110 transition-transform cursor-pointer" title="暂停/播放">
                          <Pause className="w-4 h-4 text-white fill-white" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button onClick={(e) => e.stopPropagation()} className="p-0.5 hover:scale-110 transition-transform cursor-pointer" title="音量控制">
                            <Volume2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative">
                        <div className="w-2/3 h-full bg-white rounded-full transition-all duration-300"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Cover / Thumbnail Section */}
                <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden shrink-0">
                  <img 
                    src={video.coverUrl} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />

                  {/* Top Left Selection Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSelectionActive(true);
                      setSelectedVideoIds(prev => {
                        const isCurrentlySelected = prev.includes(video.id);
                        const next = isCurrentlySelected ? prev.filter(id => id !== video.id) : [...prev, video.id];
                        setSelectAllPage(next.length === filteredVideos.length && filteredVideos.length > 0);
                        return next;
                      });
                    }}
                    className={`absolute top-1.5 left-1.5 z-30 w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-purple-600 text-white shadow-xs ring-2 ring-purple-200 opacity-100" 
                        : isSelectionActive
                          ? "bg-white/90 hover:bg-white border-2 border-purple-400 text-slate-400 shadow-xs opacity-100"
                          : "bg-black/40 hover:bg-black/60 border border-white/70 text-transparent opacity-0 group-hover:opacity-100"
                    }`}
                    title={isSelected ? "取消选择" : "选择此项"}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? "opacity-100 text-white" : isSelectionActive ? "opacity-0 hover:opacity-100 text-purple-600" : "opacity-0"}`} />
                  </button>

                  {/* Top Left Tag: 素材 (shifts right when checkbox is visible) */}
                  <span className={`absolute top-0 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-br-lg z-10 shadow-xs transition-all ${
                    isSelected || isSelectionActive ? "left-7 bg-purple-600" : "left-0 bg-[#00aed6]"
                  }`}>
                    {resourceName}
                  </span>

                  {/* Top Right Tag: Status */}
                  <ResourceStatusBadge scope={resourceScope} status={video.status} className="absolute top-0 right-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-bl-lg z-10 shadow-xs" />

                  {/* ID Overlay (top left below tag) */}
                  <div className="absolute top-6 left-1.5 z-10 bg-black/50 backdrop-blur-xs text-white/90 text-[10px] font-mono px-1.5 py-0.2 rounded">
                    ID: {video.numericId || "110332274"}
                  </div>

                  {/* Bottom Overlay on Thumbnail */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 z-10 text-white flex items-center justify-center text-[10px] font-mono">
                    <div data-testid="material-video-stats" className="flex items-center justify-center gap-3.5 text-white/90">
                      {resourceScope === "thirdParty" && <span className="flex items-center gap-0.5" title="剪切/分镜数">
                        <Scissors className="w-3 h-3 text-white/80" />
                        <span>{video.cuts || 0}</span>
                      </span>}
                      <span className="flex items-center gap-0.5" title="下载次数" aria-label={`下载 ${video.downloads ?? 0} 次`}>
                        <Download className="w-3 h-3 text-white/80" />
                        <span>{video.downloads ?? 0}</span>
                      </span>
                      {resourceScope === "materials" ? <span className="flex items-center gap-0.5" title="被引用次数" aria-label={`被引用 ${video.referenceCount ?? video.secondaryCount ?? 0} 次`}>
                        <Copy className="w-3 h-3 text-white/80" />
                        <span>{video.referenceCount ?? video.secondaryCount ?? 0}</span>
                      </span> : <span className="flex items-center gap-0.5" title="分享转发数">
                        <Share2 className="w-3 h-3 text-white/80" />
                        <span>{video.shares || 0}</span>
                      </span>}
                    </div>
                  </div>
                </div>

                {/* Middle Content Section */}
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                  {/* Title */}
                  <h3 
                    className="text-xs font-normal text-slate-800 leading-snug line-clamp-1 hover:text-purple-600 transition-colors cursor-pointer"
                    title={video.title}
                  >
                    {video.title}
                  </h3>

                  {/* Cost Line */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-purple-600 font-bold">￥</span>
                    <span className="text-purple-600 font-mono font-normal">
                      {video.todayCost || 0} / {video.cost || 0}
                    </span>
                  </div>

                  {/* Type / Category */}
                  <p className="text-[11px] text-slate-400 font-normal">
                    {video.typeLabel || video.category || "混剪"}
                  </p>
                </div>

                {/* Footer Section */}
                <div className="border-t border-slate-100 px-2.5 py-2 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/40">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">
                      <User className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-normal text-slate-800 truncate max-w-[80px]">
                      {video.author?.replace(/ \(.*\)/, '') || "刘弯"}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-normal shrink-0">
                    {video.relativeTime || "1 小时前"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部标准翻页模块 */}
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
      </>
      )}

      {/* Sync to Ad Account Popup Modal */}
      {showSyncModal && selectedVideo && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-800 animate-fade-in">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-600 animate-spin" />
                <span>巨量千川 / 巨量引擎视频创意智能同步</span>
              </span>
              <button 
                onClick={() => setShowSyncModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 bg-purple-50/50 p-3 rounded-2xl border border-purple-100/50">
                <img src={selectedVideo.coverUrl} className="w-14 h-14 object-cover rounded-xl border" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1">{selectedVideo.title}</h4>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">规格: {selectedVideo.duration} | {selectedVideo.resolution} | {selectedVideo.size}</p>
                </div>
              </div>

              {/* Form item: Select Target Ad Account */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">推送目标广告主账户 / Ad Account</label>
                <div className="relative">
                  <select
                    value={targetAccount}
                    onChange={(e) => setTargetAccount(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:border-purple-500 font-bold appearance-none cursor-pointer"
                  >
                    {accountsList.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form item: Initial Ad Budget */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">该创意初始预算规划 / Daily Budget (RMB)</label>
                <div className="grid grid-cols-4 gap-2">
                  {["500", "1000", "2000", "5000"].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSyncBudget(b)}
                      className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        syncBudget === b
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      ¥{b}/天
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-[9px] text-slate-400 leading-relaxed">
                <p className="font-bold text-slate-500 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>千川同步说明 / Delivery Guidelines:</span>
                </p>
                <p>1. 视频及对应标签、公司分类(如:试用前)将作为素材创意属性一并同步给巨量引擎，助力大模型精准归因。</p>
                <p>2. 同步后在巨量千川平台可通过 [MC_AIGC_创意包] 标签快速调取本片开展定向曝光投放。</p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSync}
                  disabled={syncLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-purple-500/10 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {syncLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>正在同步中...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>确认一键同步投放</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Advanced Re-Edit Custom Overlay (Eraser / Rebuild / Upscale) */}
      {activeEditorVideo && editorType && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-800 animate-fade-in">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>
                  {editorType === "eraser" ? "高阶智能 AI 字幕与水印清除" : 
                   editorType === "upscale" ? "画面超分插帧与 2K/4K 级画质增强" : 
                   "选定秒数片段指定镜头智能重构"}
                </span>
              </span>
              <button 
                onClick={() => {
                  setActiveEditorVideo(null);
                  setEditorType(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 text-[10px] text-slate-500 leading-relaxed">
                <span className="font-bold block text-slate-700">正在操作成片 / Editing Product:</span>
                <span className="font-mono text-purple-600 font-extrabold">{activeEditorVideo.title}</span>
              </div>

              {editorType === "eraser" && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">擦除选项 / Erasing Scope</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className="py-2 rounded-lg border border-purple-500 bg-purple-50 text-purple-700 text-xs font-bold">擦除底部硬字幕</button>
                      <button type="button" className="py-2 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50">擦除角标与水印</button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">系统将调用智能视频补全大模型对擦除区域进行背景级自适应纹理补全，100%保留画质，不破坏原有比例。</p>
                </div>
              )}

              {editorType === "upscale" && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">增强分辨率目标 / Target Scale</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" className="py-2 rounded-lg border border-purple-500 bg-purple-50 text-purple-700 text-xs font-bold">2K 视网膜超清</button>
                      <button type="button" className="py-2 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50">4K 极致高奢</button>
                      <button type="button" className="py-2 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50">超频 60FPS 补帧</button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">调用云端超级算力对画面进行光影重建、抗锯齿锐化、HDR细节恢复。需扣除 **5.0** 渲染积分。</p>
                </div>
              )}

              {editorType === "split_rebuild" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">重构时间范围 (默认指定精彩前 5 秒)</span>
                    <div className="flex gap-2 items-center">
                      <input type="text" defaultValue="00:00" className="w-16 text-center text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 font-mono font-bold" />
                      <span className="text-slate-400 text-xs">至</span>
                      <input type="text" defaultValue="00:05" className="w-16 text-center text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 font-mono font-bold" />
                      <span className="text-[10px] text-slate-400">共重塑 5 秒镜头画面</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">镜头再生成提示词 / Prompt</span>
                    <textarea
                      value={rebuildPrompt}
                      onChange={(e) => setRebuildPrompt(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-750 h-20 resize-none font-sans"
                    />
                  </div>
                </div>
              )}

              {/* Cost indicator and actions */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
                  <span>💎</span>
                  <span>预估消耗: {editorType === "upscale" ? "5.0" : "3.0"} 渲染积分</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEditorVideo(null);
                      setEditorType(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerEditAction(editorType === "eraser" ? "subtitle" : editorType === "upscale" ? "enhance" : "rebuild")}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-purple-100 hover:shadow-purple-200 cursor-pointer"
                  >
                    开始异步重置
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
