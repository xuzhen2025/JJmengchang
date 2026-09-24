import { activeAdDerivationCount, getAdActor, readAdStore, updateAdStore, type AdDraft } from "../lib/adPush";
import { activeDerivationCount, derivationOutput, derivationVideo, submitDerivation, useDerivationTasks } from "../lib/videoDerivation";
import DeriveVideoDialog from "./DeriveVideoDialog";
import FinishedVideoDerivations from "./FinishedVideoDerivations";
import { canUseDerivations } from "../lib/derivationPermissions";
import { useAdStore } from "../lib/useAdStore";
import React, { useState, useRef, useEffect, useMemo } from "react";
import VideoInteractionSelectors from "./VideoInteractionSelectors";
import { INTERACTION_CHANNELS, createVideoInteractionDemoRecords, selectVideoInteractionTrend, type InteractionChannelId } from "../lib/videoInteraction";
import LinkScriptModal from "./LinkScriptModal";
import ResourceTagModal from "./ResourceTagModal";
import { useResourceTagState } from "../lib/useResourceTags";
import { useResourceEdits } from "../lib/useResourceEdits";
import OverlayPortal from "./overlays/OverlayPortal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { ResourceCategoryModal, ResourceEditDialog, VideoStatusSelect } from "./ResourceEditDialog";
import { useResourceConfigState, useResourceConfig } from "../lib/useResourceConfig";
import { ResourceStatusBadge } from "./ResourceConfigControls";
import { appendById, toRelatedVideo, VideoResourceMetadata } from "../lib/resourceBatch";
import { DEFAULT_ASSOCIATED_SCRIPTS, DEFAULT_RELATED_VIDEOS, RELATED_VIDEO_OPTIONS, AssociatedScript } from "../data/videoResourceOptions";
export { CATEGORY_TREE } from "../data/videoResourceOptions";
export type { AssociatedScript } from "../data/videoResourceOptions";
import ReferencedVideosProduced from "./ReferencedVideosProduced";
import ReferenceVideoCard from "./ReferenceVideoCard";
import { shotReferenceCard } from "../lib/referenceVideoCards";
import AssetPagination from "./AssetPagination";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";
import {
  AdAccountPushWorkspace,
  PushRecordsModal,
  type AdPushRecord,
} from "./AdAccountPush";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  BarChart3,
  Share2,
  TrendingUp,
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  ThumbsUp,
  Tag,
  Zap,
  Filter,
  Eye,
  Flame,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Layers,
  Film,
  FileText,
  Heart,
  MessageCircle,
  Star,
  Search,
  Plus,
  Music,
  Edit3,
  ShoppingBag,
  EyeOff,
  Smartphone,
  Monitor,
  ShoppingCart,
  Box,
  ChevronDown,
  Check,
  Info,
  Folder,
  FileVideo,
  SlidersHorizontal,
  Image as ImageIcon,
  Upload,
  Square,
  ArrowUpRight,
  Pencil,
  Type,
  RotateCcw,
  Trash2,
  HelpCircle,
  RefreshCw,
  Calendar,
  Link2,
  Repeat
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart
} from "recharts";

export interface UsedMaterial {
  id: string;
  name: string;
  type: "video" | "image" | "audio";
  thumbnail?: string;
  category?: string;
}

export interface FinishedVideo extends VideoResourceMetadata {
  id: string;
  title: string;
  videoUrl: string;
  coverUrl: string;
  duration: string;
  resolution: string;
  size: string;
  creator: "ai" | "human";
  aiModel?: string;
  createdAt: string;
  syncStatus: "unsynced" | "syncing" | "synced";
  syncedAccounts?: string[];
  shares: number;
  likes: number;
  comments: number;
  author: string;
  cost: number;
  roi?: number;
  category?: string;
  tags?: string[];
  status?: string;
  version?: string;
  usedMaterials?: UsedMaterial[];
  secondaryCount?: number;
  performanceRating?: "S" | "A" | "B" | "C";
  brandName?: string;
  authorAvatar?: string;
  subtitle?: string;
}

// Mengchang Media Winged Crown "MC" Logo component matching user provided reference image
function MengchangWingedLogo({ className = "w-9 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mcWingedLogoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      
      {/* Outer Wings Left Feathers */}
      <path
        d="M 52,38 C 42,28 25,12 8,10 C 20,20 30,28 45,35 Z
           M 50,42 C 38,36 20,22 10,21 C 20,29 32,36 46,41 Z
           M 49,46 C 36,43 18,33 11,32 C 20,38 31,43 46,45 Z
           M 48,50 C 35,49 20,43 14,42 C 22,46 32,49 45,49 Z
           M 48,54 C 38,55 24,52 18,51 C 25,54 34,55 45,53 Z"
        fill="url(#mcWingedLogoGradient)"
      />
      
      {/* Left Wing Outer Swoop */}
      <path
        d="M 52,22 C 35,12 22,10 8,10 C 22,18 36,26 50,40 C 48,34 50,26 52,22 Z"
        fill="url(#mcWingedLogoGradient)"
      />

      {/* Outer Wings Right Feathers */}
      <path
        d="M 68,38 C 78,28 95,12 112,10 C 100,20 90,28 75,35 Z
           M 70,42 C 82,36 100,22 110,21 C 100,29 88,36 74,41 Z
           M 71,46 C 84,43 102,33 109,32 C 100,38 89,43 74,45 Z
           M 72,50 C 85,49 100,43 106,42 C 98,46 88,49 75,49 Z
           M 72,54 C 82,55 96,52 102,51 C 95,54 86,55 75,53 Z"
        fill="url(#mcWingedLogoGradient)"
      />

      {/* Right Wing Outer Swoop */}
      <path
        d="M 68,22 C 85,12 98,10 112,10 C 98,18 84,26 70,40 C 72,34 70,26 68,22 Z"
        fill="url(#mcWingedLogoGradient)"
      />

      {/* Outer Circle Ring */}
      <circle cx="60" cy="42" r="18" stroke="url(#mcWingedLogoGradient)" strokeWidth="2.5" fill="none" />
      {/* Inner Circle Ring */}
      <circle cx="60" cy="42" r="15" stroke="url(#mcWingedLogoGradient)" strokeWidth="1.2" fill="none" />

      {/* Crown on top inside circle */}
      <path
        d="M 53,32 L 51,26 L 55,28 L 60,24 L 65,28 L 69,26 L 67,32 Z"
        fill="url(#mcWingedLogoGradient)"
      />
      <circle cx="51" cy="25" r="1" fill="url(#mcWingedLogoGradient)" />
      <circle cx="60" cy="23" r="1.2" fill="url(#mcWingedLogoGradient)" />
      <circle cx="69" cy="25" r="1" fill="url(#mcWingedLogoGradient)" />

      {/* MC Text in center */}
      <text
        x="60"
        y="48"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fontFamily="serif, Times New Roman, Georgia"
        fill="url(#mcWingedLogoGradient)"
        letterSpacing="-0.5"
      >
        MC
      </text>
    </svg>
  );
}


export interface OperationLogItem {
  id: string;
  operator: string;
  actionType: "修改标题" | "修改公共标签" | "修改个人标签" | "修改备注" | "修改状态" | "类目变更" | "系统生成";
  timestamp: string;
  beforeValue: string;
  afterValue: string;
}

interface FinishedVideoDetailModalProps {
  backLabel?: string;
  resourceScope?: "finished" | "materials" | "thirdParty";
  video: FinishedVideo;
  onClose: () => void;
  onDelete?: () => void;
  onSyncToAd?: (video: FinishedVideo) => void;
  isMaterialMode?: boolean;
  initialTagModal?: "public" | "personal";
  onUpdate?: (patch: VideoResourceMetadata & Partial<FinishedVideo>) => boolean | void;
  isAdminMode?: boolean;
}

// Mock campaign plans data
interface CampaignPlan {
  id: string;
  name: string;
  platform: string;
  totalClicks: number;
  peakClicks: number;
  peakSecond: number;
  liveRoomClicks: number;
  productClicks: number;
  retentionRate: number;
  secondData: Array<{
    second: number;
    secondLabel: string;
    productClicks: number;
    liveClicks: number;
    totalClicks: number;
    retention: number;
    highlight?: string;
  }>;
}

const CAMPAIGN_PLANS: CampaignPlan[] = [
  {
    id: "all",
    name: "全渠道计划汇总",
    platform: "全网汇总",
    totalClicks: 28450,
    peakClicks: 2450,
    peakSecond: 9,
    liveRoomClicks: 11200,
    productClicks: 17250,
    retentionRate: 71.5,
    secondData: [
      { second: 1, secondLabel: "01s", productClicks: 210, liveClicks: 120, totalClicks: 330, retention: 98, highlight: "前3秒黄金Hook引爆" },
      { second: 2, secondLabel: "02s", productClicks: 340, liveClicks: 210, totalClicks: 550, retention: 92 },
      { second: 3, secondLabel: "03s", productClicks: 580, liveClicks: 350, totalClicks: 930, retention: 85, highlight: "痛点场景呈现" },
      { second: 4, secondLabel: "04s", productClicks: 720, liveClicks: 410, totalClicks: 1130, retention: 81 },
      { second: 5, secondLabel: "05s", productClicks: 890, liveClicks: 520, totalClicks: 1410, retention: 78 },
      { second: 6, secondLabel: "06s", productClicks: 1050, liveClicks: 680, totalClicks: 1730, retention: 76, highlight: "产品细节微距特写" },
      { second: 7, secondLabel: "07s", productClicks: 1200, liveClicks: 790, totalClicks: 1990, retention: 74 },
      { second: 8, secondLabel: "08s", productClicks: 1450, liveClicks: 920, totalClicks: 2370, retention: 72 },
      { second: 9, secondLabel: "09s", productClicks: 1520, liveClicks: 930, totalClicks: 2450, retention: 71, highlight: "🔥 弹窗峰值: 直播间买一赠一" },
      { second: 10, secondLabel: "10s", productClicks: 1380, liveClicks: 880, totalClicks: 2260, retention: 68 },
      { second: 11, secondLabel: "11s", productClicks: 1150, liveClicks: 750, totalClicks: 1900, retention: 65, highlight: "模特真人佩戴展示" },
      { second: 12, secondLabel: "12s", productClicks: 980, liveClicks: 620, totalClicks: 1600, retention: 62 },
      { second: 13, secondLabel: "13s", productClicks: 850, liveClicks: 510, totalClicks: 1360, retention: 59 },
      { second: 14, secondLabel: "14s", productClicks: 710, liveClicks: 420, totalClicks: 1130, retention: 56, highlight: "尾帧强引导点击" },
      { second: 15, secondLabel: "15s", productClicks: 580, liveClicks: 340, totalClicks: 920, retention: 52 }
    ]
  },
  {
    id: "qianchuan_01",
    name: "巨量千川01-夏日爆款女装直投",
    platform: "抖音千川",
    totalClicks: 15200,
    peakClicks: 1420,
    peakSecond: 8,
    liveRoomClicks: 6100,
    productClicks: 9100,
    retentionRate: 74.2,
    secondData: [
      { second: 1, secondLabel: "01s", productClicks: 120, liveClicks: 80, totalClicks: 200, retention: 99 },
      { second: 2, secondLabel: "02s", productClicks: 220, liveClicks: 140, totalClicks: 360, retention: 95 },
      { second: 3, secondLabel: "03s", productClicks: 410, liveClicks: 260, totalClicks: 670, retention: 88, highlight: "千川人群精准勾起" },
      { second: 4, secondLabel: "04s", productClicks: 520, liveClicks: 310, totalClicks: 830, retention: 84 },
      { second: 5, secondLabel: "05s", productClicks: 680, liveClicks: 410, totalClicks: 1090, retention: 80 },
      { second: 6, secondLabel: "06s", productClicks: 810, liveClicks: 500, totalClicks: 1310, retention: 78 },
      { second: 7, secondLabel: "07s", productClicks: 920, liveClicks: 580, totalClicks: 1500, retention: 76 },
      { second: 8, secondLabel: "08s", productClicks: 1020, liveClicks: 400, totalClicks: 1420, retention: 75, highlight: "🔥 高亮商品卡点击爆发" },
      { second: 9, secondLabel: "09s", productClicks: 950, liveClicks: 420, totalClicks: 1370, retention: 73 },
      { second: 10, secondLabel: "10s", productClicks: 820, liveClicks: 380, totalClicks: 1200, retention: 70 },
      { second: 11, secondLabel: "11s", productClicks: 710, liveClicks: 320, totalClicks: 1030, retention: 67 },
      { second: 12, secondLabel: "12s", productClicks: 600, liveClicks: 280, totalClicks: 880, retention: 64 },
      { second: 13, secondLabel: "13s", productClicks: 510, liveClicks: 220, totalClicks: 730, retention: 61 },
      { second: 14, secondLabel: "14s", productClicks: 420, liveClicks: 180, totalClicks: 600, retention: 58 },
      { second: 15, secondLabel: "15s", productClicks: 340, liveClicks: 150, totalClicks: 490, retention: 54 }
    ]
  },
  {
    id: "tencent_ad",
    name: "腾讯AD-视频号小店直通计划",
    platform: "腾讯广告",
    totalClicks: 8900,
    peakClicks: 780,
    peakSecond: 10,
    liveRoomClicks: 3800,
    productClicks: 5100,
    retentionRate: 68.0,
    secondData: [
      { second: 1, secondLabel: "01s", productClicks: 80, liveClicks: 40, totalClicks: 120, retention: 96 },
      { second: 2, secondLabel: "02s", productClicks: 130, liveClicks: 70, totalClicks: 200, retention: 90 },
      { second: 3, secondLabel: "03s", productClicks: 210, liveClicks: 110, totalClicks: 320, retention: 82 },
      { second: 4, secondLabel: "04s", productClicks: 290, liveClicks: 160, totalClicks: 450, retention: 77 },
      { second: 5, secondLabel: "05s", productClicks: 350, liveClicks: 200, totalClicks: 550, retention: 73 },
      { second: 6, secondLabel: "06s", productClicks: 410, liveClicks: 250, totalClicks: 660, retention: 70 },
      { second: 7, secondLabel: "07s", productClicks: 480, liveClicks: 290, totalClicks: 770, retention: 68 },
      { second: 8, secondLabel: "08s", productClicks: 520, liveClicks: 320, totalClicks: 840, retention: 66 },
      { second: 9, secondLabel: "09s", productClicks: 580, liveClicks: 350, totalClicks: 930, retention: 65 },
      { second: 10, secondLabel: "10s", productClicks: 620, liveClicks: 160, totalClicks: 780, retention: 63, highlight: "🔥 微信小程序卡片跳转" },
      { second: 11, secondLabel: "11s", productClicks: 510, liveClicks: 280, totalClicks: 790, retention: 60 },
      { second: 12, secondLabel: "12s", productClicks: 420, liveClicks: 230, totalClicks: 650, retention: 57 },
      { second: 13, secondLabel: "13s", productClicks: 350, liveClicks: 190, totalClicks: 540, retention: 54 },
      { second: 14, secondLabel: "14s", productClicks: 280, liveClicks: 150, totalClicks: 430, retention: 51 },
      { second: 15, secondLabel: "15s", productClicks: 220, liveClicks: 120, totalClicks: 340, retention: 48 }
    ]
  },
  {
    id: "kuaishou_01",
    name: "快手磁力金牛-直播间卡片引流A",
    platform: "快手金牛",
    totalClicks: 4350,
    peakClicks: 520,
    peakSecond: 6,
    liveRoomClicks: 2800,
    productClicks: 1550,
    retentionRate: 65.5,
    secondData: [
      { second: 1, secondLabel: "01s", productClicks: 30, liveClicks: 50, totalClicks: 80, retention: 95 },
      { second: 2, secondLabel: "02s", productClicks: 60, liveClicks: 100, totalClicks: 160, retention: 88 },
      { second: 3, secondLabel: "03s", productClicks: 100, liveClicks: 180, totalClicks: 280, retention: 80 },
      { second: 4, secondLabel: "04s", productClicks: 140, liveClicks: 240, totalClicks: 380, retention: 74 },
      { second: 5, secondLabel: "05s", productClicks: 180, liveClicks: 290, totalClicks: 470, retention: 70 },
      { second: 6, secondLabel: "06s", productClicks: 200, liveClicks: 320, totalClicks: 520, retention: 67, highlight: "🔥 快手老客狂欢抢购" },
      { second: 7, secondLabel: "07s", productClicks: 180, liveClicks: 280, totalClicks: 460, retention: 64 },
      { second: 8, secondLabel: "08s", productClicks: 150, liveClicks: 240, totalClicks: 390, retention: 61 },
      { second: 9, secondLabel: "09s", productClicks: 130, liveClicks: 210, totalClicks: 340, retention: 58 },
      { second: 10, secondLabel: "10s", productClicks: 110, liveClicks: 180, totalClicks: 290, retention: 55 },
      { second: 11, secondLabel: "11s", productClicks: 90, liveClicks: 150, totalClicks: 240, retention: 52 },
      { second: 12, secondLabel: "12s", productClicks: 80, liveClicks: 130, totalClicks: 210, retention: 49 },
      { second: 13, secondLabel: "13s", productClicks: 70, liveClicks: 110, totalClicks: 180, retention: 46 },
      { second: 14, secondLabel: "14s", productClicks: 50, liveClicks: 90, totalClicks: 140, retention: 43 },
      { second: 15, secondLabel: "15s", productClicks: 40, liveClicks: 70, totalClicks: 110, retention: 40 }
    ]
  }
];

export interface AnalyticsMetricConfig {
  id: string;
  name: string;
  color: string;
  isRate: boolean;
  unit: string;
}

export const ANALYTICS_METRICS: AnalyticsMetricConfig[] = [
  { id: "clicks", name: "点击数", color: "#9333ea", isRate: false, unit: "次" },
  { id: "losses", name: "流失数", color: "#22c55e", isRate: false, unit: "次" },
  { id: "follows", name: "关注数", color: "#06b6d4", isRate: false, unit: "人" },
  { id: "comments", name: "评论数", color: "#f59e0b", isRate: false, unit: "条" },
  { id: "likes", name: "点赞数", color: "#ec4899", isRate: false, unit: "赞" },
  { id: "ctr", name: "点击率", color: "#3b82f6", isRate: true, unit: "%" },
  { id: "lossRate", name: "流失率", color: "#ef4444", isRate: true, unit: "%" },
];

export interface AnalyticsReviewItem {
  id: string;
  tag: string;
  timestampSec: number;
  timeLabel: string;
  company: string;
  title: string;
  date: string;
  thumbnail: string;
}

export interface ProjectFileItem {
  id: string;
  name: string;
  uploadTime: string;
  size: string;
  thumbnail: string;
  visibility: "公开" | "仅本部门" | "私密";
  editorName: string;
  tracksCount: number;
  software: string;
}

export const INITIAL_PROJECT_FILES: ProjectFileItem[] = [
  {
    id: "pf1",
    name: "10.6子涵酒吧1",
    uploadTime: "2023-10-17",
    size: "48.2 MB",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    visibility: "公开",
    editorName: "刘怡晴 (拍摄/剪辑)",
    tracksCount: 8,
    software: "剪映 Pro 草稿工程包"
  },
  {
    id: "pf2",
    name: "纯朴洁面油爆款框架_高转化卡点V2",
    uploadTime: "2023-10-19",
    size: "62.5 MB",
    thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
    visibility: "仅本部门",
    editorName: "王力 (资深剪辑师)",
    tracksCount: 12,
    software: "剪映 Draft / PR XML 兼容包"
  }
];

export const SPEND_TREND_CHART_DATA = [
  { date: "2025-07-26", 消耗: 45.2, ROI: 5.8, 成交金额: 262.16, 智能优惠券: 12.0, 转化数: 15, 转化率: 12.5, 转化成本: 3.01, 展示数: 12000, 平均千次展现费用: 3.76, 点击数: 950, 点击率: 7.91, 播放量: 10500, 完播率: 18.2, 净成交金额: 240.0, 净成交ROI: 5.3 },
  { date: "2025-07-27", 消耗: 28.6, ROI: 0.8, 成交金额: 22.88, 智能优惠券: 5.0, 转化数: 8, 转化率: 8.2, 转化成本: 3.57, 展示数: 8500, 平均千次展现费用: 3.36, 点击数: 620, 点击率: 7.29, 播放量: 7200, 完播率: 15.0, 净成交金额: 20.0, 净成交ROI: 0.7 },
  { date: "2025-07-28", 消耗: 18.0, ROI: 6.8, 成交金额: 122.4, 智能优惠券: 8.0, 转化数: 22, 转化率: 15.1, 转化成本: 0.82, 展示数: 19000, 平均千次展现费用: 0.94, 点击数: 1450, 点击率: 7.63, 播放量: 16000, 完播率: 22.1, 净成交金额: 110.0, 净成交ROI: 6.1 },
  { date: "2025-07-29", 消耗: 15.5, ROI: 0.5, 成交金额: 7.75, 智能优惠券: 2.0, 转化数: 5, 转化率: 5.0, 转化成本: 3.10, 展示数: 6000, 平均千次展现费用: 2.58, 点击数: 380, 点击率: 6.33, 播放量: 5100, 完播率: 12.0, 净成交金额: 6.0, 净成交ROI: 0.38 },
  { date: "2025-07-30", 消耗: 25.1, ROI: 6.5, 成交金额: 163.15, 智能优惠券: 10.0, 转化数: 30, 转化率: 16.4, 转化成本: 0.84, 展示数: 21000, 平均千次展现费用: 1.19, 点击数: 1820, 点击率: 8.66, 播放量: 18500, 完播率: 25.4, 净成交金额: 150.0, 净成交ROI: 5.97 },
  { date: "2025-07-31", 消耗: 98.4, ROI: 4.8, 成交金额: 472.32, 智能优惠券: 35.0, 转化数: 65, 转化率: 14.2, 转化成本: 1.51, 展示数: 45000, 平均千次展现费用: 2.18, 点击数: 3910, 点击率: 8.68, 播放量: 41000, 完播率: 21.0, 净成交金额: 430.0, 净成交ROI: 4.37 },
  { date: "2025-08-01", 消耗: 62.0, ROI: 2.1, 成交金额: 130.2, 智能优惠券: 15.0, 转化数: 28, 转化率: 9.8, 转化成本: 2.21, 展示数: 28000, 平均千次展现费用: 2.21, 点击数: 2100, 点击率: 7.50, 播放量: 24000, 完播率: 16.5, 净成交金额: 120.0, 净成交ROI: 1.93 },
  { date: "2025-08-02", 消耗: 251.38, ROI: 2.5, 成交金额: 628.45, 智能优惠券: 80.0, 转化数: 110, 转化率: 11.2, 转化成本: 2.28, 展示数: 98000, 平均千次展现费用: 2.56, 点击数: 7800, 点击率: 7.95, 播放量: 89000, 完播率: 19.8, 净成交金额: 590.0, 净成交ROI: 2.34 },
  { date: "2025-08-03", 消耗: 700.0, ROI: 2.8, 成交金额: 1960.0, 智能优惠券: 210.0, 转化数: 280, 转化率: 13.5, 转化成本: 2.50, 展示数: 240000, 平均千次展现费用: 2.91, 点击数: 19200, 点击率: 8.00, 播放量: 215000, 完播率: 22.0, 净成交金额: 1850.0, 净成交ROI: 2.64 },
  { date: "2025-08-04", 消耗: 135.0, ROI: 2.2, 成交金额: 297.0, 智能优惠券: 40.0, 转化数: 55, 转化率: 10.1, 转化成本: 2.45, 展示数: 54000, 平均千次展现费用: 2.50, 点击数: 4100, 点击率: 7.59, 播放量: 48000, 完播率: 17.2, 净成交金额: 280.0, 净成交ROI: 2.07 },
  { date: "2025-08-05", 消耗: 210.0, ROI: 1.6, 成交金额: 336.0, 智能优惠券: 65.0, 转化数: 72, 转化率: 8.9, 转化成本: 2.91, 展示数: 81000, 平均千次展现费用: 2.59, 点击数: 5900, 点击率: 7.28, 播放量: 72000, 完播率: 15.8, 净成交金额: 310.0, 净成交ROI: 1.47 },
  { date: "2025-08-08", 消耗: 12.0, ROI: 0.2, 成交金额: 2.4, 智能优惠券: 1.0, 转化数: 2, 转化率: 2.0, 转化成本: 6.00, 展示数: 3000, 平均千次展现费用: 4.00, 点击数: 180, 点击率: 6.00, 播放量: 2500, 完播率: 8.0, 净成交金额: 2.0, 净成交ROI: 0.16 },
  { date: "2025-08-12", 消耗: 8.0, ROI: 0.1, 成交金额: 0.8, 智能优惠券: 0.0, 转化数: 1, 转化率: 1.0, 转化成本: 8.00, 展示数: 1500, 平均千次展现费用: 5.33, 点击数: 90, 点击率: 6.00, 播放量: 1200, 完播率: 5.0, 净成交金额: 0.0, 净成交ROI: 0.0 },
  { date: "2025-08-16", 消耗: 5.0, ROI: 0.0, 成交金额: 0.0, 智能优惠券: 0.0, 转化数: 0, 转化率: 0.0, 转化成本: 0.00, 展示数: 800, 平均千次展现费用: 6.25, 点击数: 40, 点击率: 5.00, 播放量: 600, 完播率: 3.0, 净成交金额: 0.0, 净成交ROI: 0.0 },
  { date: "2025-08-20", 消耗: 2.0, ROI: 0.0, 成交金额: 0.0, 智能优惠券: 0.0, 转化数: 0, 转化率: 0.0, 转化成本: 0.00, 展示数: 300, 平均千次展现费用: 6.66, 点击数: 15, 点击率: 5.00, 播放量: 200, 完播率: 1.0, 净成交金额: 0.0, 净成交ROI: 0.0 }
];

export const INTERACTION_TREND_DATA = [
  { second: 0, secondLabel: "0s", clicks: 8900, losses: 1650000, follows: 120, comments: 45, likes: 320, ctr: 8.5, lossRate: 78.2 },
  { second: 5, secondLabel: "5s", clicks: 6200, losses: 1220000, follows: 210, comments: 85, likes: 580, ctr: 7.2, lossRate: 64.1 },
  { second: 10, secondLabel: "10s", clicks: 4500, losses: 890000, follows: 340, comments: 130, likes: 790, ctr: 6.1, lossRate: 52.0 },
  { second: 15, secondLabel: "15s", clicks: 3100, losses: 610000, follows: 480, comments: 190, likes: 1050, ctr: 5.4, lossRate: 43.8 },
  { second: 20, secondLabel: "20s", clicks: 2200, losses: 420000, follows: 520, comments: 210, likes: 1180, ctr: 4.8, lossRate: 38.2 },
  { second: 25, secondLabel: "25s", clicks: 1800, losses: 310000, follows: 580, comments: 240, likes: 1320, ctr: 4.2, lossRate: 35.0 },
  { second: 30, secondLabel: "30s", clicks: 1500, losses: 240000, follows: 610, comments: 260, likes: 1410, ctr: 3.9, lossRate: 32.5 },
  { second: 35, secondLabel: "35s", clicks: 1200, losses: 180000, follows: 640, comments: 280, likes: 1500, ctr: 3.5, lossRate: 29.8 },
  { second: 40, secondLabel: "40s", clicks: 950, losses: 120000, follows: 670, comments: 295, likes: 1580, ctr: 3.1, lossRate: 27.2 },
  { second: 45, secondLabel: "45s", clicks: 810, losses: 85000, follows: 690, comments: 310, likes: 1640, ctr: 2.8, lossRate: 25.0 },
  { second: 50, secondLabel: "50s", clicks: 720, losses: 52000, follows: 710, comments: 320, likes: 1700, ctr: 2.5, lossRate: 23.1 },
  { second: 55, secondLabel: "55s", clicks: 687, losses: 33713, follows: 730, comments: 335, likes: 1760, ctr: 2.3, lossRate: 21.4 },
  { second: 60, secondLabel: "60s", clicks: 820, losses: 41000, follows: 760, comments: 350, likes: 1820, ctr: 2.7, lossRate: 20.0 },
  { second: 65, secondLabel: "65s", clicks: 1150, losses: 68000, follows: 790, comments: 380, likes: 1910, ctr: 3.4, lossRate: 18.5 },
  { second: 70, secondLabel: "70s", clicks: 1680, losses: 110000, follows: 830, comments: 410, likes: 2050, ctr: 4.1, lossRate: 17.2 },
  { second: 75, secondLabel: "75s", clicks: 2150, losses: 210000, follows: 880, comments: 450, likes: 2210, ctr: 5.0, lossRate: 16.0 },
  { second: 80, secondLabel: "80s", clicks: 2564, losses: 461688, follows: 940, comments: 490, likes: 2400, ctr: 5.8, lossRate: 15.1 }
];

interface ReviewComment {
  id: string;
  author: string;
  avatar: string;
  role: "投手" | "编导" | "运营" | "剪辑师" | "总监";
  timestampSec: number; // e.g. 3 for 00:03
  timeLabel: string;   // e.g. "00:03"
  commentText: string;
  tag: "黄金Hook" | "转化高光" | "流失避坑" | "剪辑建议" | "复盘总结";
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

const INITIAL_REVIEWS: ReviewComment[] = [
  {
    id: "rev1",
    author: "张伟",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
    role: "投手",
    timestampSec: 3,
    timeLabel: "00:03",
    commentText: "前3秒法式黄金耳环近景光泽感极好，千川大盘数据显示开场点击率比平时高出 35%！建议将该3秒切出作为全局模版推广。",
    tag: "黄金Hook",
    createdAt: "2026-07-22 14:30",
    likes: 18,
    isLiked: true
  },
  {
    id: "rev2",
    author: "王大锤",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&h=80&fit=crop",
    role: "编导",
    timestampSec: 9,
    timeLabel: "00:09",
    commentText: "第9秒弹窗配合【买一赠一限量抢】字幕，秒级点击量达到 2,450 次峰值！主播口播语气和背景微风流动节奏卡得非常精准。",
    tag: "转化高光",
    createdAt: "2026-07-22 15:10",
    likes: 24
  },
  {
    id: "rev3",
    author: "李蕾",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    role: "运营",
    timestampSec: 13,
    timeLabel: "00:13",
    commentText: "12-14秒留存率稍有掉帧，建议下次二创时在13秒插入【进入直播间领取领券补贴】的醒目动效浮窗，防止用户提前滑走。",
    tag: "流失避坑",
    createdAt: "2026-07-22 16:45",
    likes: 9
  }
];

export interface AuditReply {
  id: string;
  author: string;
  replyTo: string;
  text: string;
  time: string;
}

export interface DrawingShape {
  id: string;
  type: "rect" | "arrow" | "pencil" | "text";
  color: string;
  points: { x: number; y: number }[];
  text?: string;
}

export interface AuditAnnotation {
  id: string;
  author: string;
  avatar: string;
  createdAt: string;
  version: string;
  timeRange: string;
  startSec: number;
  endSec?: number;
  type: "片段批注" | "单帧批注" | "字幕批注";
  commentText: string;
  isResolved?: boolean;
  drawings?: DrawingShape[];
  replies: AuditReply[];
}

const INITIAL_AUDIT_ANNOTATIONS: AuditAnnotation[] = [
  {
    id: "ann_1",
    author: "致上运营",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    createdAt: "05-13 15:24",
    version: "第1版",
    timeRange: "0分2秒73 至 0分4秒53",
    startSec: 2.73,
    endSec: 4.53,
    type: "片段批注",
    commentText: "这里有点模糊，改一下 @dy4 @lan",
    isResolved: false,
    drawings: [
      { id: "d1", type: "rect", color: "#ef4444", points: [{ x: 15, y: 30 }, { x: 85, y: 65 }] },
      { id: "d2", type: "text", color: "#ef4444", points: [{ x: 18, y: 22 }], text: "画面清晰度较差" }
    ],
    replies: [
      {
        id: "rep_1",
        author: "致上运营",
        replyTo: "致上运营",
        text: "已修改 @致上运营",
        time: "05-13 15:26"
      },
      {
        id: "rep_2",
        author: "致上运营",
        replyTo: "致上运营",
        text: "二次修改 @致上运营",
        time: "05-13 15:39"
      }
    ]
  },
  {
    id: "ann_2",
    author: "致上编导",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    createdAt: "05-13 16:10",
    version: "第1版",
    timeRange: "0分8秒15",
    startSec: 8.15,
    type: "单帧批注",
    commentText: "产品LOGO放大15%，避免被抖音橱窗浮窗遮挡 @剪辑师小王",
    isResolved: true,
    drawings: [
      { id: "d3", type: "arrow", color: "#f97316", points: [{ x: 80, y: 35 }, { x: 65, y: 15 }] },
      { id: "d4", type: "text", color: "#f97316", points: [{ x: 30, y: 38 }], text: "避免被右侧挂件遮挡" }
    ],
    replies: []
  }
];

export default function FinishedVideoDetailModal({
  video,
  onClose,
  onDelete,
  onSyncToAd,
  isMaterialMode = false,
  resourceScope = isMaterialMode ? "materials" : "finished",
  initialTagModal,
  onUpdate,
  isAdminMode = false,
  backLabel
}: FinishedVideoDetailModalProps) {
  const resourceName = resourceScope === "thirdParty" ? "第三方" : isMaterialMode ? "素材" : "成片";
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Platform UI Safe-Zone Overlay Style (douyin | douyin_showcase | channels | hidden)
  const [overlayStyle, setOverlayStyle] = useState<"douyin" | "douyin_showcase" | "channels" | "hidden">("douyin");

  // Right Side Navigation Tabs ("info" | "review" | "interaction" | "project")
  const [activeRightTab, setActiveRightTab] = useState<"info" | "review" | "interaction" | "project">("info");

  // Video Info Form Fields
  const [categoryText, setCategoryText] = useResourceConfigState(resourceScope, video, "category");
  const [showModifyCategoryModal, setShowModifyCategoryModal] = useState(false);
  const [titleText, setTitleText] = useState(video.title || "视频标题1");
  const [showModifyTitleModal, setShowModifyTitleModal] = useState(false);
  const [tempTitleText, setTempTitleText] = useState("");
  const [publicTags, setPublicTags] = useResourceTagState(resourceScope, video, "public");
  const [showPublicTagModal, setShowPublicTagModal] = useState(initialTagModal === "public");

  const [personalTags, setPersonalTags] = useResourceTagState(resourceScope, video, "personal");
  const [showPersonalTagModal, setShowPersonalTagModal] = useState(initialTagModal === "personal");
  const [videoStatus, setVideoStatus] = useResourceConfigState(resourceScope, video, "status");
  const { store: configStore } = useResourceConfig();
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const { edits: noteEdits, saveEdits: saveNoteEdits } = useResourceEdits<VideoResourceMetadata>(resourceScope);
  const videoNotes = noteEdits[video.id]?.notes ?? video.notes ?? "";
  const notesHistory = noteEdits[video.id]?.notesHistory ?? video.notesHistory ?? [];
  const [notesDraft, setNotesDraft] = useState(videoNotes);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const notesReturnFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    setNotesDraft(videoNotes);
    setShowNotesModal(false);
  }, [video.id, resourceScope]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [showJianyingMenu, setShowJianyingMenu] = useState(false);

  // Video Audit States
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("第1版");
  const [auditStatusFilter, setAuditStatusFilter] = useState("已上机");
  const [auditTypeFilter, setAuditTypeFilter] = useState("全部批注");
  const [onlyAtMe, setOnlyAtMe] = useState(false);
  const [onlyReplyMe, setOnlyReplyMe] = useState(false);
  const [annotationType, setAnnotationType] = useState<"片段批注" | "单帧批注" | null>(null);
  const [clipStart, setClipStart] = useState<number>(2.5);
  const [clipEnd, setClipEnd] = useState<number>(6.5);
  const [draggingClipHandle, setDraggingClipHandle] = useState<"start" | "end" | null>(null);
  const clipTrackRef = useRef<HTMLDivElement | null>(null);
  const [activeDrawTool, setActiveDrawTool] = useState<"rect" | "arrow" | "pencil" | "text">("text");
  const [drawColor, setDrawColor] = useState<string>("#ef4444");
  const [selectedAnnotationRange, setSelectedAnnotationRange] = useState("0分2秒50 至 0分6秒50");

  // Canvas Drawing Overlay States
  const [drawings, setDrawings] = useState<DrawingShape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingShape | null>(null);
  const [textPopover, setTextPopover] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState("请修改此处画面");
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateSegmentRangeText = (startSec: number, endSec: number) => {
    const sMin = Math.floor(startSec / 60);
    const sSec = Math.floor(startSec % 60);
    const sMs = Math.floor((startSec % 1) * 100);

    const eMin = Math.floor(endSec / 60);
    const eSec = Math.floor(endSec % 60);
    const eMs = Math.floor((endSec % 1) * 100);

    const startStr = `${sMin}分${sSec.toString().padStart(2, "0")}秒${sMs.toString().padStart(2, "0")}`;
    const endStr = `${eMin}分${eSec.toString().padStart(2, "0")}秒${eMs.toString().padStart(2, "0")}`;

    setSelectedAnnotationRange(`${startStr} 至 ${endStr}`);
  };

  const clipTrackDuration = duration || 15;
  const clipPercent = (value: number) => `${Math.max(0, Math.min(100, (value / clipTrackDuration) * 100))}%`;
  const setClipHandleValue = (handle: "start" | "end", value: number) => {
    const next = Math.max(0, Math.min(clipTrackDuration, value));
    if (handle === "start") {
      const clamped = Math.min(clipEnd - 0.2, next);
      setClipStart(clamped);
      updateSegmentRangeText(clamped, clipEnd);
    } else {
      const clamped = Math.max(clipStart + 0.2, next);
      setClipEnd(clamped);
      updateSegmentRangeText(clipStart, clamped);
    }
  };
  const clipValueFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = clipTrackRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return 0;
    return ((event.clientX - rect.left) / rect.width) * clipTrackDuration;
  };
  const beginClipDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const value = clipValueFromPointer(event);
    const handle = Math.abs(value - clipStart) <= Math.abs(value - clipEnd) ? "start" : "end";
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingClipHandle(handle);
    setClipHandleValue(handle, value);
  };
  const moveClipDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingClipHandle) setClipHandleValue(draggingClipHandle, clipValueFromPointer(event));
  };
  const endClipDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggingClipHandle(null);
  };
  const nudgeClipHandle = (handle: "start" | "end", event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = handle === "start" ? clipStart : clipEnd;
    const step = event.key === "Home" ? -clipTrackDuration : event.key === "End" ? clipTrackDuration : event.key === "ArrowLeft" ? -0.1 : 0.1;
    setClipHandleValue(handle, current + step);
  };

  const commitTextShape = () => {
    if (textPopover && textInputValue.trim()) {
      const newTextShape: DrawingShape = {
        id: `text_${Date.now()}`,
        type: "text",
        color: drawColor,
        points: [{ x: textPopover.x, y: textPopover.y }],
        text: textInputValue.trim()
      };
      setDrawings(prev => [...prev, newTextShape]);
      showToast(`🅣 已添加文字标注: "${textInputValue.trim()}"`);
    }
    setTextPopover(null);
  };

  // Interactive Drawing Canvas Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeDrawTool === "text") {
      setTextPopover({ x, y });
      setTextInputValue("请修改此处画面");
      return;
    }

    setIsDrawing(true);
    setDrawStartPoint({ x, y });
    setCurrentDrawing({
      id: `shape_${Date.now()}`,
      type: activeDrawTool,
      color: drawColor,
      points: [{ x, y }, { x, y }]
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !overlayRef.current || !drawStartPoint) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeDrawTool === "pencil") {
      setCurrentDrawing(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
    } else {
      setCurrentDrawing(prev => prev ? { ...prev, points: [drawStartPoint, { x, y }] } : null);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing]);
      showToast(`🎨 已画出 ${activeDrawTool === "rect" ? "矩形框" : activeDrawTool === "arrow" ? "箭头" : "画笔"}`);
    }
    setIsDrawing(false);
    setDrawStartPoint(null);
    setCurrentDrawing(null);
  };

  // Handle clicking on an audit comment message in the right list
  const handleSelectAuditAnnotation = (ann: AuditAnnotation) => {
    seekToSecond(ann.startSec);
    if (ann.type === "片段批注") {
      setAnnotationType("片段批注");
      setClipStart(ann.startSec);
      setClipEnd(ann.endSec || ann.startSec + 3);
      updateSegmentRangeText(ann.startSec, ann.endSec || ann.startSec + 3);
    } else if (ann.type === "单帧批注") {
      setAnnotationType("单帧批注");
    }

    if (ann.drawings && ann.drawings.length > 0) {
      setDrawings(ann.drawings);
    } else {
      setDrawings([
        { id: `demo_${ann.id}`, type: "rect", color: "#ef4444", points: [{ x: 15, y: 25 }, { x: 85, y: 70 }] },
        { id: `demo_t_${ann.id}`, type: "text", color: "#ef4444", points: [{ x: 18, y: 18 }], text: ann.commentText.slice(0, 16) }
      ]);
    }

    showToast(`▶️ 跳转并播放批注: [${ann.timeRange}]`);
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };
  const SYSTEM_AT_USERS = [
    "@致上运营",
    "@致上编导",
    "@dy4",
    "@lan",
    "@剪辑师小王",
    "@邓彦晨",
    "@蔡卓良",
    "@李云",
    "@王强",
    "@全体成员"
  ];

  const [annotationInputText, setAnnotationInputText] = useState("");
  const [mentionedMembers, setMentionedMembers] = useState<string[]>(["@致上运营"]);
  const [atSearchText, setAtSearchText] = useState("");
  const [showAtDropdown, setShowAtDropdown] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [auditAnnotations, setAuditAnnotations] = useState<AuditAnnotation[]>(INITIAL_AUDIT_ANNOTATIONS);

  const filteredAuditAnnotations = auditAnnotations.filter(ann => {
    if (auditStatusFilter === "待处理" && ann.isResolved) return false;
    if (auditStatusFilter === "已解决" && !ann.isResolved) return false;
    if (auditTypeFilter !== "全部批注" && ann.type !== auditTypeFilter) return false;
    if (onlyAtMe && !ann.commentText.includes("@致上运营")) return false;
    return true;
  });

  // Associated Scripts State
  const [showRelatedScriptsModal, setShowRelatedScriptsModal] = useState(false);
  const [associatedScripts, setAssociatedScripts] = useState<AssociatedScript[]>(video.associatedScripts || DEFAULT_ASSOCIATED_SCRIPTS);
  const [showScriptDetailModal, setShowScriptDetailModal] = useState(false);
  const [selectedScriptDetail, setSelectedScriptDetail] = useState<AssociatedScript | null>(null);
  const [showAddScriptModal, setShowAddScriptModal] = useState(false);
  const [availableScriptsToLink, setAvailableScriptsToLink] = useState<AssociatedScript[]>([
    { id: "script_2", title: "美妆留存神级爆款脚本_v2", template: "痛点场景剧本", tag: "留存拉爆", status: "1", publisher: "lisa", publishTime: "2025-04-20 10:15:00" },
    { id: "script_3", title: "3秒Hook测试脚本", template: "视觉冲击拆解", tag: "勾子高转", status: "2", publisher: "alex", publishTime: "2025-04-22 14:20:10" },
    { id: "script_4", title: "模特试用真实体验反转脚本", template: "真人测评口播", tag: "种草转换", status: "1", publisher: "momo", publishTime: "2025-04-25 09:30:45" },
  ]);

  // Operation Logs State
  const [showOperationLogsModal, setShowOperationLogsModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<OperationLogItem | null>(null);
  const [operationLogSearch, setOperationLogSearch] = useState("");
  const [operationLogTypeFilter, setOperationLogTypeFilter] = useState<string>("all");
  const [operationLogPage, setOperationLogPage] = useState(1);
  const [operationLogPageSize, setOperationLogPageSize] = useState(20);
  const [operationLogs, setOperationLogs] = useState<OperationLogItem[]>([
    {
      id: "log_5",
      operator: "张三 (编导)",
      actionType: "修改备注",
      timestamp: "2026-08-01 01:10:00",
      beforeValue: "初始脚本初剪版本，画面清晰度达标。",
      afterValue: "该成片已在抖音大号首发，前3秒留存率达68%，建议作为通用模板推广。",
    },
    {
      id: "log_4",
      operator: "王五 (剪辑)",
      actionType: "修改状态",
      timestamp: "2026-07-31 16:40:00",
      beforeValue: "待审核",
      afterValue: "已上机",
    },
    {
      id: "log_3",
      operator: "李四 (运营)",
      actionType: "修改公共标签",
      timestamp: "2026-07-31 14:05:30",
      beforeValue: "无",
      afterValue: "纯混剪, 对比: 有对比, 白茶: 白茶产品3",
    },
    {
      id: "log_2",
      operator: "张三 (编导)",
      actionType: "修改标题",
      timestamp: "2026-07-30 10:20:12",
      beforeValue: "未命名视频草稿_001",
      afterValue: video.title || "视频标题1",
    },
    {
      id: "log_1",
      operator: "系统管理员",
      actionType: "系统生成",
      timestamp: "2026-07-30 09:15:00",
      beforeValue: "无",
      afterValue: "成片渲染合成完成（分辨率1080P/60fps，时长 00:28）",
    }
  ]);

  // Ad account push workflow
  const [showAdPushWorkspace, setShowAdPushWorkspace] = useState(false);
  const [derivePush, setDerivePush] = useState(false);
  const [repushDerivativeId, setRepushDerivativeId] = useState<string | null>(null);
  const repushDerivative = repushDerivativeId ? derivationOutput(repushDerivativeId) : undefined;
  const [showDeriveDialog, setShowDeriveDialog] = useState(false);
  const [derivationTaskId, setDerivationTaskId] = useState<string | null>(null);
  const derivationTasks = useDerivationTasks();
  const [showPushRecordsModal, setShowPushRecordsModal] = useState(false);
  const adStore = useAdStore();
  const [adDraft, setAdDraft] = useState<AdDraft | undefined>();
  useEffect(() => { if (!showAdPushWorkspace) setRepushDerivativeId(null); }, [showAdPushWorkspace]);
  useEffect(() => {
    const task = derivationTasks.find(item => item.id === derivationTaskId);
    if (task?.status === "已完成") {
      setToastMsg(task.resultIds.length ? `衍生处理已完成，共 ${task.resultIds.length} 个视频` : "衍生任务已结束，未生成视频");
      setDerivationTaskId(null);
    }
  }, [derivationTasks, derivationTaskId]);
  const handleCreateAdPushTask = (records: AdPushRecord[]) => {
    updateAdStore(s => ({ ...s, records: [...records, ...s.records] }));
    setAdDraft(undefined);
    setShowAdPushWorkspace(false);
    setShowPushRecordsModal(true);
  };

  const addOperationLog = (actionType: OperationLogItem['actionType'], beforeValue: string, afterValue: string) => {
    if (beforeValue === afterValue) return;
    const nowStr = new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const newLog: OperationLogItem = {
      id: `log_${Date.now()}`,
      operator: "当前用户 (管理员)",
      actionType,
      timestamp: nowStr,
      beforeValue: beforeValue || "无",
      afterValue: afterValue || "无"
    };
    setOperationLogs(prev => [newLog, ...prev]);
  };


  const openNotesEditor = (content: string) => {
    notesReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotesDraft(content);
    setShowNotesModal(true);
  };

  const closeNotesEditor = () => {
    setNotesDraft(videoNotes);
    setShowNotesModal(false);
    notesReturnFocusRef.current?.focus();
  };

  const handleNotesKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeNotesEditor();
    } else if (event.key === "Tab") {
      const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), textarea");
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  const handleSaveNote = () => {
    const content = notesDraft.trim();
    if (content === videoNotes) return;
    const timestamp = new Date().toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    const nextHistory = [{ id: crypto.randomUUID(), timestamp, content }, ...notesHistory];
    if (!saveNoteEdits({ [video.id]: { notes: content, notesHistory: nextHistory } })) {
      setToastMsg("保存失败，请检查浏览器存储空间后重新操作");
      return;
    }
    addOperationLog("修改备注", videoNotes, content);
    setNotesDraft(content);
    setShowNotesModal(false);
    notesReturnFocusRef.current?.focus();
  };

  // Selected Plan Filter
  const [selectedPlanId, setSelectedPlanId] = useState<string>("all");
  const selectedPlan = CAMPAIGN_PLANS.find(p => p.id === selectedPlanId) || CAMPAIGN_PLANS[0];

  // Chart Metric Mode (totalClicks / productClicks / liveClicks)
  const [chartMetric, setChartMetric] = useState<"totalClicks" | "productClicks" | "liveClicks">("totalClicks");

  const [analyticsChannel, setAnalyticsChannel] = useState<InteractionChannelId>("qc-live");
  const [analyticsScope, setAnalyticsScope] = useState("all");
  const analyticsPlatform = INTERACTION_CHANNELS.find(item => item.id === analyticsChannel)!.platform;
  const interactionRecords = useMemo(() => createVideoInteractionDemoRecords(
    { id: video.id, title: titleText, syncStatus: video.syncStatus, cost: video.cost }, analyticsChannel, adStore, getAdActor(),
  ), [video.id, titleText, video.syncStatus, video.cost, analyticsChannel, adStore]);
  const interactionTrend = useMemo(() => selectVideoInteractionTrend(INTERACTION_TREND_DATA, interactionRecords, analyticsScope), [interactionRecords, analyticsScope]);
  useEffect(() => { setAnalyticsChannel("qc-live"); setAnalyticsScope("all"); }, [video.id]);
  useEffect(() => {
    if (analyticsScope !== "all" && !interactionRecords.some(record => record.id === analyticsScope)) setAnalyticsScope("all");
  }, [interactionRecords, analyticsScope]);
  const [metricLeft, setMetricLeft] = useState<string>("clicks"); // 点击数
  const [metricRight, setMetricRight] = useState<string>("losses"); // 流失数

  const [analyticsReviews, setAnalyticsReviews] = useState<AnalyticsReviewItem[]>([
    {
      id: "ar1",
      tag: "优质画面",
      timestampSec: 57,
      timeLabel: "0分57秒",
      company: "纯朴科技",
      title: "“二次清洁”提高用户点击和评论",
      date: "2023-12-09 10:35",
      thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&h=120&fit=crop"
    },
    {
      id: "ar2",
      tag: "优质画面",
      timestampSec: 80,
      timeLabel: "1分20秒",
      company: "纯朴科技",
      title: "提到价格不贵，增加转换",
      date: "2023-12-09 10:34",
      thumbnail: "./assets/prototype/beauty-promo-detail.jpg"
    },
    {
      id: "ar3",
      tag: "爆点金句",
      timestampSec: 15,
      timeLabel: "0分15秒",
      company: "纯朴科技",
      title: "“纯植物萃取不刺激”，引发弹幕关注与流失骤降",
      date: "2023-12-09 09:12",
      thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=120&h=120&fit=crop"
    }
  ]);

  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewTag, setNewReviewTag] = useState<string>("优质画面");
  const [newReviewCompany, setNewReviewCompany] = useState("纯朴科技");
  const [newReviewSec, setNewReviewSec] = useState<number>(30);

  // Project Files State (工程文件)
  const [projectFiles, setProjectFiles] = useState<ProjectFileItem[]>(INITIAL_PROJECT_FILES);
  const [showUploadProjectModal, setShowUploadProjectModal] = useState(false);
  const [showProjectFaqModal, setShowProjectFaqModal] = useState(false);
  
  // Upload Project File Form State
  const [uploadProjectName, setUploadProjectName] = useState("");
  const [uploadProjectVisibility, setUploadProjectVisibility] = useState<"公开" | "仅本部门" | "私密">("公开");
  const [uploadProjectEditor, setUploadProjectEditor] = useState("刘怡晴");
  const [uploadProjectTracks, setUploadProjectTracks] = useState(8);
  const [uploadSelectedFolder, setUploadSelectedFolder] = useState<string | null>(null);
  const [isUploadingProject, setIsUploadingProject] = useState(false);

  // 素材数据 (Asset Data / Performance Analytics) State
  const [assetPlatformTab, setAssetPlatformTab] = useState<string>("汇总数据");
  const [assetStartDate, setAssetStartDate] = useState<string>("2025-04-10");
  const [assetEndDate, setAssetEndDate] = useState<string>("2025-05-13");
  
  // 消耗曲线 Modal State
  const [showSpendTrendModal, setShowSpendTrendModal] = useState(false);
  const [trendMetric1, setTrendMetric1] = useState<string>("消耗");
  const [trendMetric2, setTrendMetric2] = useState<string>("ROI");
  
  // 镜头/分镜溯源与关联 (Shot Traceability & AIGC Video Associations) State
  const [shotTraceTab, setShotTraceTab] = useState<"引用视频镜头" | "被引用后出片" | "衍生视频">("引用视频镜头");
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [showAddAigcLinkModal, setShowAddAigcLinkModal] = useState(false);
  const [shotTraceMaterials, setShotTraceMaterials] = useState(video.relatedVideos || DEFAULT_RELATED_VIDEOS);
  const relatedDuration = shotTraceMaterials.reduce((sum, item) => sum + item.durationNum, 0);
  const relatedBreakdown = shotTraceMaterials.map((item, index) => ({
    ...item,
    percent: relatedDuration ? item.durationNum / relatedDuration * 100 : 0,
    offset: relatedDuration ? shotTraceMaterials.slice(0, index).reduce((sum, video) => sum + video.durationNum, 0) / relatedDuration * 100 : 0,
  }));

  const availableAigcVideos: VideoResourcePickerItem[] = [
    ...shotTraceMaterials.map((item) => ({
      id: item.id,
      name: item.title,
      cover: item.cover,
      status: "已关联",
      section: item.type === "成片" ? "成片" as const : "素材" as const,
      primaryCategory: "AIGC视频",
      secondaryCategory: "已关联视频",
      tags: ["已关联"],
      author: item.author,
      duration: item.duration,
      size: "--",
      url: item.videoUrl,
    })),
    ...RELATED_VIDEO_OPTIONS.filter(
      (option) => !shotTraceMaterials.some((item) => item.id === option.id),
    ),
  ];

  // Review Comments State
  const [reviews, setReviews] = useState<ReviewComment[]>(INITIAL_REVIEWS);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentTag, setNewCommentTag] = useState<ReviewComment["tag"]>("黄金Hook");
  const [newCommentSec, setNewCommentSec] = useState<number>(3);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  // Video timeupdate listener
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seekToSecond = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
      setNewCommentSec(Math.floor(sec));
    }
  };

  const handleAddReviewComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    setTimeout(() => {
      const formattedSec = Math.floor(newCommentSec);
      const minStr = Math.floor(formattedSec / 60).toString().padStart(2, "0");
      const secStr = (formattedSec % 60).toString().padStart(2, "0");
      const timeLabel = `${minStr}:${secStr}`;

      const newRev: ReviewComment = {
        id: "rev_" + Date.now(),
        author: "当前账户 (我)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
        role: "总监",
        timestampSec: formattedSec,
        timeLabel,
        commentText: newCommentText.trim(),
        tag: newCommentTag,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        likes: 0
      };

      setReviews([newRev, ...reviews]);
      setNewCommentText("");
      setIsSubmittingComment(false);

      showToast(`✅ 复盘评论与时间锚点 [${timeLabel}] 关联发布成功！`);
    }, 400);
  };

  const handleLikeComment = (id: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === id) {
        const isLiked = !r.isLiked;
        return {
          ...r,
          isLiked,
          likes: isLiked ? r.likes + 1 : r.likes - 1
        };
      }
      return r;
    }));
  };

  const updateMetadata = (patch: VideoResourceMetadata) => {
    if (onUpdate?.(patch) === false) {
      setToastMsg("保存失败，请检查浏览器存储空间后重新操作");
      window.setTimeout(() => setToastMsg(null), 4000);
      return false;
    }
    return true;
  };

  const showToast = (_msg: string) => {
    // Disabled toast prompts per user request
  };

  // Format second number to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSecondFloor = Math.min(15, Math.max(1, Math.floor(currentTime) || 1));

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 text-slate-800 p-4 sm:p-6 space-y-6 animate-fade-in font-sans pb-24">
      
      {/* Toast floating banner */}
      {toastMsg && (
        <OverlayPortal layer="toast" role="alert" className="fixed top-6 right-6 bg-purple-900/95 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 border border-purple-400/30 animate-bounce">
          <Zap className="w-4 h-4 text-purple-300" />
          <span>{toastMsg}</span>
        </OverlayPortal>
      )}

      {/* Main Page Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 w-full overflow-hidden text-slate-800">
        
        {/* 1. Page Header with Back Button Only */}
        <div className="px-6 py-4 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-purple-600 border border-slate-200/90 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
            title={backLabel || `返回${resourceName}列表`}
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
            <span>{backLabel || `返回${resourceName}列表`}</span>
          </button>
        </div>

        {/* 2. Full Page Body Content */}
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50">
          
          {/* Main Top Grid: Left (Video Preview) + Right (Campaign Selection & Analytics Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Video Player & Second-by-Second Frame Strip (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">

              {/* Top Controls Header Bar for Video Audit (Only visible when activeRightTab === "review") */}
              {activeRightTab === "review" && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 text-xs font-medium text-slate-700 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedVersion}
                      onChange={(e) => {
                        setSelectedVersion(e.target.value);
                        showToast(`已切换至 ${e.target.value}`);
                      }}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="第1版">第1版</option>
                      <option value="第2版 (二创修剪)">第2版 (二创修剪)</option>
                      <option value="第3版 (终审高清)">第3版 (终审高清)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => showToast("📤 已打开新版本视频上传与替换通道")}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上传新版</span>
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-600 hover:text-purple-700 select-none">
                    <input
                      type="checkbox"
                      checked={showGuidelines}
                      onChange={(e) => setShowGuidelines(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                    <span>辅助线</span>
                  </label>
                </div>
              )}

              {/* Platform Overlay / Safe-Zone Style Switcher (Hidden when in Video Audit / review tab) */}
              {activeRightTab !== "review" && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-purple-600" />
                      <span>平台 UI 遮挡排查蒙版</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-sans">预审防遮挡违规</span>
                  </div>

                  {/* 4 Style Selector Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setOverlayStyle("douyin")}
                      className={`px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        overlayStyle === "douyin"
                          ? "bg-purple-600 text-white shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>抖音样式</span>
                    </button>

                    <button
                      onClick={() => setOverlayStyle("douyin_showcase")}
                      className={`px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        overlayStyle === "douyin_showcase"
                          ? "bg-purple-600 text-white shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>抖音橱窗</span>
                    </button>

                    <button
                      onClick={() => setOverlayStyle("channels")}
                      className={`px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        overlayStyle === "channels"
                          ? "bg-purple-600 text-white shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>视频号样式</span>
                    </button>

                    <button
                      onClick={() => setOverlayStyle("hidden")}
                      className={`px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        overlayStyle === "hidden"
                          ? "bg-purple-600 text-white shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>隐藏样式</span>
                    </button>
                  </div>
                </div>
              )}

              {/* VIDEO PLAYER SECTION */}
              {activeRightTab === "review" ? (
                /* RAW CLEAN VIDEO PLAYER FOR VIDEO AUDIT / ANNOTATION */
                <div className="w-full space-y-3">
                  {/* Video Box - Kept centered at max-w-[340px] so preview doesn't enlarge */}
                  <div className="mx-auto max-w-[340px]">
                    <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl select-none group">
                      <video
                        ref={videoRef}
                        src={video.videoUrl}
                        poster={video.coverUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                        className={`absolute inset-0 w-full h-full object-cover ${
                          annotationType !== null ? "cursor-crosshair" : "cursor-pointer"
                        }`}
                        onClick={annotationType !== null ? undefined : togglePlay}
                      />

                      {/* Grid Guidelines Overlay */}
                      {showGuidelines && (
                        <div className="absolute inset-0 z-30 pointer-events-none border border-dashed border-purple-400/50">
                          <div className="w-full h-1/3 border-b border-dashed border-white/30" />
                          <div className="w-full h-1/3 border-b border-dashed border-white/30" />
                          <div className="absolute top-0 bottom-0 left-1/3 border-r border-dashed border-white/30" />
                          <div className="absolute top-0 bottom-0 left-2/3 border-r border-dashed border-white/30" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-rose-400/60 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          </div>
                        </div>
                      )}

                      {/* Interactive Canvas Overlay for Drawing Annotations */}
                      <div
                        ref={overlayRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={() => {
                          if (isDrawing && currentDrawing) {
                            setDrawings(prev => [...prev, currentDrawing]);
                          }
                          setIsDrawing(false);
                          setDrawStartPoint(null);
                          setCurrentDrawing(null);
                        }}
                        className={`absolute inset-0 z-30 select-none ${
                          annotationType !== null ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
                        }`}
                      >
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full pointer-events-none">
                          <defs>
                            <marker id="arrowhead-red" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                              <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
                            </marker>
                            <marker id="arrowhead-amber" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                              <polygon points="0 0, 6 2, 0 4" fill="#f97316" />
                            </marker>
                            <marker id="arrowhead-sky" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                              <polygon points="0 0, 6 2, 0 4" fill="#06b6d4" />
                            </marker>
                            <marker id="arrowhead-emerald" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                              <polygon points="0 0, 6 2, 0 4" fill="#22c55e" />
                            </marker>
                            <marker id="arrowhead-dark" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                              <polygon points="0 0, 6 2, 0 4" fill="#1e293b" />
                            </marker>
                            <marker id="arrowhead-white" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                              <polygon points="0 0, 6 2, 0 4" fill="#ffffff" />
                            </marker>
                          </defs>

                          {[...drawings, ...(currentDrawing ? [currentDrawing] : [])].map((shape) => {
                            if (shape.type === "rect") {
                              const p0 = shape.points[0];
                              const p1 = shape.points[shape.points.length - 1] || p0;
                              const x = Math.min(p0.x, p1.x);
                              const y = Math.min(p0.y, p1.y);
                              const w = Math.abs(p1.x - p0.x);
                              const h = Math.abs(p1.y - p0.y);
                              return (
                                <rect
                                  key={shape.id}
                                  x={x}
                                  y={y}
                                  width={w}
                                  height={h}
                                  stroke={shape.color}
                                  strokeWidth="1.2"
                                  fill={`${shape.color}25`}
                                  rx="1"
                                />
                              );
                            }
                            if (shape.type === "arrow") {
                              const p0 = shape.points[0];
                              const p1 = shape.points[shape.points.length - 1] || p0;
                              let markerId = "arrowhead-red";
                              if (shape.color === "#f97316") markerId = "arrowhead-amber";
                              if (shape.color === "#06b6d4") markerId = "arrowhead-sky";
                              if (shape.color === "#22c55e") markerId = "arrowhead-emerald";
                              if (shape.color === "#1e293b") markerId = "arrowhead-dark";
                              if (shape.color === "#ffffff") markerId = "arrowhead-white";
                              return (
                                <line
                                  key={shape.id}
                                  x1={p0.x}
                                  y1={p0.y}
                                  x2={p1.x}
                                  y2={p1.y}
                                  stroke={shape.color}
                                  strokeWidth="1.2"
                                  markerEnd={`url(#${markerId})`}
                                />
                              );
                            }
                            if (shape.type === "pencil") {
                              const pathData = shape.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
                              return (
                                <path
                                  key={shape.id}
                                  d={pathData}
                                  stroke={shape.color}
                                  strokeWidth="1.2"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              );
                            }
                            if (shape.type === "text") {
                              const p0 = shape.points[0];
                              const textLen = shape.text?.length || 4;
                              const rectW = Math.max(16, textLen * 3.6);
                              return (
                                <g key={shape.id}>
                                  <rect
                                    x={Math.min(95 - rectW, Math.max(1, p0.x - 1))}
                                    y={Math.min(94, Math.max(1, p0.y - 3))}
                                    width={rectW}
                                    height="5.5"
                                    fill="rgba(15, 23, 42, 0.9)"
                                    rx="1"
                                    stroke={shape.color}
                                    strokeWidth="0.3"
                                  />
                                  <text
                                    x={Math.min(95 - rectW, Math.max(1, p0.x - 1)) + 1.2}
                                    y={Math.min(94, Math.max(1, p0.y - 3)) + 3}
                                    fill={shape.color}
                                    fontSize="3.2"
                                    fontWeight="bold"
                                    dominantBaseline="middle"
                                  >
                                    {shape.text}
                                  </text>
                                </g>
                              );
                            }
                            return null;
                          })}
                        </svg>

                        {/* Inline Text Input Popover on Video when Text Tool is Clicked */}
                        {textPopover && (
                          <div 
                            style={{ left: `${textPopover.x}%`, top: `${textPopover.y}%` }} 
                            className="absolute z-50 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border border-purple-500/80 rounded-xl p-2 shadow-2xl flex items-center gap-1.5 w-56 animate-in zoom-in-95 duration-150"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              autoFocus
                              value={textInputValue}
                              onChange={(e) => setTextInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitTextShape();
                                if (e.key === "Escape") setTextPopover(null);
                              }}
                              className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg flex-1 focus:outline-none border border-slate-700 focus:border-purple-400 font-medium"
                              placeholder="请输入标注文字..."
                            />
                            <button
                              type="button"
                              onClick={commitTextShape}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer shadow-xs active:scale-95"
                            >
                              确定
                            </button>
                            <button
                              type="button"
                              onClick={() => setTextPopover(null)}
                              className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Floating Overlay Action Buttons: 片段批注 & 单帧批注 */}
                      <div className="absolute bottom-4 right-3 z-40 flex items-center gap-1.5 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (annotationType === "片段批注") {
                              setAnnotationType(null);
                              showToast("已取消片段批注");
                            } else {
                              setAnnotationType("片段批注");
                              const startSec = Math.max(0, parseFloat((currentTime - 1.0).toFixed(2)));
                              const endSec = Math.min(duration || 15, parseFloat((currentTime + 3.0).toFixed(2)));
                              setClipStart(startSec);
                              setClipEnd(endSec);
                              updateSegmentRangeText(startSec, endSec);
                              showToast(`✂️ 已开启片段批注: ${Math.floor(startSec)}s 至 ${Math.floor(endSec)}s`);
                            }
                          }}
                          className={`px-2.5 py-1.5 backdrop-blur-md rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border ${
                            annotationType === "片段批注"
                              ? "bg-purple-600 text-white border-purple-400 shadow-purple-900/30 ring-2 ring-purple-300"
                              : "bg-black/60 hover:bg-black/80 text-white/90 border-white/20"
                          }`}
                        >
                          <Film className="w-3.5 h-3.5 text-purple-200" />
                          <span>片段批注</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (annotationType === "单帧批注") {
                              setAnnotationType(null);
                              showToast("已取消单帧批注");
                            } else {
                              setAnnotationType("单帧批注");
                              const sec = Math.floor(currentTime);
                              const ms = Math.floor((currentTime % 1) * 100);
                              setSelectedAnnotationRange(`${Math.floor(sec / 60)}分${sec % 60}秒${ms.toString().padStart(2, '0')}`);
                              showToast(`📍 已开启单帧批注: ${Math.floor(sec / 60)}分${sec % 60}秒`);
                            }
                          }}
                          className={`px-2.5 py-1.5 backdrop-blur-md rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border ${
                            annotationType === "单帧批注"
                              ? "bg-purple-600 text-white border-purple-400 shadow-purple-900/30 ring-2 ring-purple-300"
                              : "bg-black/60 hover:bg-black/80 text-white/90 border-white/20"
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                          <span>单帧批注</span>
                        </button>
                      </div>

                      {/* Big Play Overlay Icon when Paused (HIDDEN during annotation mode) */}
                      {!isPlaying && annotationType === null && (
                        <div 
                          onClick={togglePlay}
                          className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer z-20 group"
                        >
                          <div className="w-16 h-16 bg-purple-600/90 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-purple-400/50 shadow-2xl transition-transform transform group-hover:scale-110 active:scale-95">
                            <Play className="w-8 h-8 fill-white ml-1 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DEDICATED PROGRESS BARS & ANNOTATION TOOLBAR BELOW VIDEO (WIDENED TO FULL CONTAINER) */}
                  <div className="w-full max-w-[520px] mx-auto space-y-2.5 pt-1">
                    {/* Track 1: Standard Main Progress Bar (ONLY when NOT in annotation mode) */}
                    {annotationType === null && (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="w-7 h-7 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
                          title={isPlaying ? "暂停" : "播放"}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white text-white" /> : <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="relative flex items-center h-3">
                            {/* Main Progress Track */}
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                              {/* Played Portion (Purple) */}
                              <div 
                                className="h-full bg-purple-600 absolute left-0 top-0 rounded-l-full pointer-events-none"
                                style={{ width: `${(currentTime / (duration || 15)) * 100}%` }}
                              />
                            </div>

                            {/* Seek Range Input */}
                            <input
                              type="range"
                              min={0}
                              max={duration || 15}
                              step={0.05}
                              value={currentTime}
                              onChange={(e) => seekToSecond(parseFloat(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />

                            {/* Playhead Knob */}
                            <div 
                              className="w-3.5 h-3.5 bg-white border-2 border-purple-600 rounded-full shadow-md absolute pointer-events-none z-20 -ml-1.5"
                              style={{ left: `${(currentTime / (duration || 15)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Track 2: 片段批注 - 片段截取区间设置 (ONLY when annotationType === "片段批注") */}
                    {annotationType === "片段批注" && (
                      <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 text-purple-700">
                            <Film className="w-3.5 h-3.5" />
                            <span>片段截取区间设置</span>
                          </span>
                          <span className="font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100 text-[11px]">
                            {selectedAnnotationRange || `${Math.floor(clipStart)}s 至 ${Math.floor(clipEnd)}s`}
                          </span>
                        </div>

                        {/* Single range track with two handles for the selected clip interval. */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full bg-purple-600" />开始时间 <span className="font-mono font-bold text-purple-600">{Math.floor(clipStart / 60)}分{Math.floor(clipStart % 60).toString().padStart(2, '0')}秒{(Math.floor((clipStart % 1) * 100)).toString().padStart(2, '0')}</span></span>
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full bg-purple-600" />结束时间 <span className="font-mono font-bold text-purple-600">{Math.floor(clipEnd / 60)}分{Math.floor(clipEnd % 60).toString().padStart(2, '0')}秒{(Math.floor((clipEnd % 1) * 100)).toString().padStart(2, '0')}</span></span>
                          </div>
                          <div
                            ref={clipTrackRef}
                            role="group"
                            aria-label="片段截取区间"
                            onPointerDown={beginClipDrag}
                            onPointerMove={moveClipDrag}
                            onPointerUp={endClipDrag}
                            onPointerCancel={endClipDrag}
                            className="relative h-9 cursor-pointer touch-none select-none"
                          >
                            <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200" />
                            <div
                              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-purple-600 shadow-[0_0_0_3px_rgba(147,51,234,0.12)]"
                              style={{ left: clipPercent(clipStart), width: `${Math.max(0, ((clipEnd - clipStart) / clipTrackDuration) * 100)}%` }}
                            />
                            <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between text-[10px] text-slate-400 pointer-events-none">
                              <span>0秒</span><span>{Math.floor(clipTrackDuration / 60)}分{Math.floor(clipTrackDuration % 60).toString().padStart(2, '0')}秒</span>
                            </div>
                            {(["start", "end"] as const).map((handle) => {
                              const value = handle === "start" ? clipStart : clipEnd;
                              return (
                                <div
                                  key={handle}
                                  role="slider"
                                  tabIndex={0}
                                  aria-label={handle === "start" ? "开始时间" : "结束时间"}
                                  aria-valuemin={0}
                                  aria-valuemax={clipTrackDuration}
                                  aria-valuenow={Number(value.toFixed(1))}
                                  onKeyDown={(event) => nudgeClipHandle(handle, event)}
                                  className={`absolute top-1/2 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-transparent outline-none transition-shadow focus:ring-2 focus:ring-purple-200 ${draggingClipHandle === handle ? "ring-2 ring-purple-200" : ""}`}
                                  style={{ left: clipPercent(value) }}
                                  onPointerDown={(event) => {
                                    event.stopPropagation();
                                    event.currentTarget.setPointerCapture(event.pointerId);
                                    setDraggingClipHandle(handle);
                                  }}
                                  onPointerMove={(event) => {
                                    if (draggingClipHandle === handle) setClipHandleValue(handle, clipValueFromPointer(event));
                                  }}
                                  onPointerUp={(event) => {
                                    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                                    setDraggingClipHandle(null);
                                  }}
                                  onPointerCancel={() => setDraggingClipHandle(null)}
                                ><span className="block h-4 w-4 rounded-full border-2 border-purple-600 bg-white shadow-md transition-shadow hover:shadow-lg" /></div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Track 2 Alt: 单帧批注 - 单帧时间选择 (ONLY when annotationType === "单帧批注") */}
                    {annotationType === "单帧批注" && (
                      <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 text-purple-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>单帧时间选择</span>
                          </span>
                          <span className="font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100 text-[11px]">
                            {`${Math.floor(currentTime / 60)}分${Math.floor(currentTime % 60).toString().padStart(2, '0')}秒${(Math.floor((currentTime % 1) * 100)).toString().padStart(2, '0')}`}
                          </span>
                        </div>

                        {/* Progress Bar: 单帧时刻 (Frame Time) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                            <span>单帧时刻 (Frame Timestamp)</span>
                            <span className="font-mono text-purple-600 font-bold">
                              {Math.floor(currentTime / 60)}分{Math.floor(currentTime % 60).toString().padStart(2, '0')}秒{(Math.floor((currentTime % 1) * 100)).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="relative flex items-center h-4">
                            <div className="w-full h-2 bg-slate-200 rounded-full relative overflow-hidden">
                              <div 
                                className="h-full bg-purple-600 absolute left-0 top-0 rounded-full"
                                style={{ width: `${(currentTime / (duration || 15)) * 100}%` }}
                              />
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={duration || 15}
                              step={0.05}
                              value={currentTime}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                seekToSecond(val);
                                const secFloor = Math.floor(val);
                                const ms = Math.floor((val % 1) * 100);
                                const mStr = Math.floor(secFloor / 60);
                                const sStr = (secFloor % 60).toString().padStart(2, '0');
                                const msStr = ms.toString().padStart(2, '0');
                                setSelectedAnnotationRange(`${mStr}分${sStr}秒${msStr}`);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                              className="w-4 h-4 bg-white border-2 border-purple-600 rounded-full shadow-md absolute pointer-events-none z-20 -ml-2"
                              style={{ left: `${(currentTime / (duration || 15)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Track 3: ANNOTATION DRAWING TOOLBAR (ONLY SHOWN WHEN ANNOTATION IS ACTIVE) */}
                    {annotationType !== null && (
                      <div className="w-full bg-white border border-slate-200/90 rounded-2xl px-3 py-2 shadow-2xs flex items-center justify-between text-xs text-slate-700 select-none whitespace-nowrap gap-2 font-medium animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Left: 工具 Label & Tool Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-slate-700 text-[11px]">工具</span>
                          <span className="text-slate-300">|</span>

                          {/* Rectangle Tool (▢) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDrawTool("rect");
                              showToast("🔲 已选择: 矩形框工具");
                            }}
                            className={`p-1 rounded-lg border cursor-pointer transition-all ${
                              activeDrawTool === "rect"
                                ? "bg-purple-100 text-purple-700 border-purple-300 font-bold"
                                : "border-transparent text-slate-600 hover:bg-slate-100"
                            }`}
                            title="矩形框"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>

                          {/* Arrow Tool (↗) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDrawTool("arrow");
                              showToast("↗️ 已选择: 箭头工具");
                            }}
                            className={`p-1 rounded-lg border cursor-pointer transition-all ${
                              activeDrawTool === "arrow"
                                ? "bg-purple-100 text-purple-700 border-purple-300 font-bold"
                                : "border-transparent text-slate-600 hover:bg-slate-100"
                            }`}
                            title="箭头"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Pencil Tool (✏) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDrawTool("pencil");
                              showToast("✏️ 已选择: 画笔工具");
                            }}
                            className={`p-1 rounded-lg border cursor-pointer transition-all ${
                              activeDrawTool === "pencil"
                                ? "bg-purple-100 text-purple-700 border-purple-300 font-bold"
                                : "border-transparent text-slate-600 hover:bg-slate-100"
                            }`}
                            title="画笔"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Text Tool (🅣) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDrawTool("text");
                              showToast("🅣 已选择: 文字工具");
                            }}
                            className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                              activeDrawTool === "text"
                                ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs"
                                : "border-transparent text-slate-700 hover:bg-slate-100"
                            }`}
                            title="文字"
                          >
                            <Type className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-slate-300 shrink-0">|</span>

                        {/* Center: Color Selection Dots */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {[
                            { name: "红", color: "#ef4444", bg: "bg-red-500" },
                            { name: "橙", color: "#f97316", bg: "bg-amber-500" },
                            { name: "蓝", color: "#06b6d4", bg: "bg-sky-500" },
                            { name: "绿", color: "#22c55e", bg: "bg-emerald-500" },
                            { name: "黑", color: "#1e293b", bg: "bg-slate-800" },
                            { name: "白", color: "#ffffff", bg: "bg-white border border-slate-300" }
                          ].map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                setDrawColor(c.color);
                                showToast(`🎨 已切换颜色: ${c.name}`);
                              }}
                              className={`w-3.5 h-3.5 rounded-full ${c.bg} cursor-pointer transition-transform ${
                                drawColor === c.color ? "scale-125 ring-2 ring-purple-500 ring-offset-1" : "hover:scale-110"
                              }`}
                              title={c.name}
                            />
                          ))}
                        </div>

                        <span className="text-slate-300 shrink-0">|</span>

                        {/* Right: Actions (↩ 撤销, 清除, 退出) */}
                        <div className="flex items-center gap-2 text-[11px] shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setDrawings(prev => prev.slice(0, -1));
                              showToast("↩ 已撤销上一笔");
                            }}
                            className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer font-medium"
                            title="撤销"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDrawings([]);
                              showToast("🧹 已清除全部画笔");
                            }}
                            className="text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                          >
                            清除
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDrawings([]);
                              setAnnotationType(null);
                              showToast("已退出批注模式");
                            }}
                            className="text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                          >
                            退出
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* STANDARD SHORT VIDEO PLAYER WITH MOBILE PHONE BEZEL FRAME */
                <div className="mx-auto max-w-[360px] bg-slate-950 rounded-[42px] p-2 sm:p-2.5 shadow-2xl border-[6px] border-slate-900 relative text-white font-sans overflow-hidden">
                  
                  {/* Top Phone Speaker & Camera Notch */}
                  <div className="w-28 h-4 bg-slate-900 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-2">
                    <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                    <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                  </div>

                  {/* Phone Screen Canvas (9:16 vertical player) */}
                  <div className="relative aspect-[9/16] w-full rounded-[32px] overflow-hidden bg-black flex flex-col justify-between select-none">
                    
                    {/* Background Video Layer */}
                    <video
                      ref={videoRef}
                      src={video.videoUrl}
                      poster={video.coverUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                      onClick={togglePlay}
                    />

                    {/* Grid Guidelines Overlay */}
                    {showGuidelines && (
                      <div className="absolute inset-0 z-30 pointer-events-none border border-dashed border-purple-400/50">
                        <div className="w-full h-1/3 border-b border-dashed border-white/30" />
                        <div className="w-full h-1/3 border-b border-dashed border-white/30" />
                        <div className="absolute top-0 bottom-0 left-1/3 border-r border-dashed border-white/30" />
                        <div className="absolute top-0 bottom-0 left-2/3 border-r border-dashed border-white/30" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-rose-400/60 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* Big Play Overlay Icon when Paused */}
                    {!isPlaying && (
                      <div 
                        onClick={togglePlay}
                        className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer z-20 group"
                      >
                        <div className="w-16 h-16 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/30 shadow-2xl transition-transform transform group-hover:scale-110 active:scale-95">
                          <Play className="w-8 h-8 fill-white ml-1 text-white" />
                        </div>
                      </div>
                    )}

                    {/* ==================== 1 & 2: DOUYIN OVERLAY (STANDARD / SHOWCASE) ==================== */}
                    {(overlayStyle === "douyin" || overlayStyle === "douyin_showcase") && (
                      <>
                        {/* TOP OVERLAY: Phone Status Bar & Douyin Top Tabs */}
                        <div className="relative z-30 pt-3 px-3 space-y-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-6">
                          
                          {/* 1. System Status Line (Signal, Brand Name, Battery) */}
                          <div className="flex justify-between items-center text-[10px] text-white/80 font-mono tracking-wider">
                            <span className="flex items-center gap-1 font-bold">
                              <span className="text-purple-400">•••••</span> BELL 📶
                            </span>
                            <span className="truncate max-w-[130px] text-[10px] text-white/90 font-sans font-medium">{video.brandName || "俪缇润黑露-植物护理型"}</span>
                            <span className="flex items-center gap-1">
                              <span>22%</span>
                              <span className="w-3 h-1.5 border border-white/80 rounded-[1px] relative inline-block">
                                <span className="bg-white absolute inset-0.5 w-[60%]"></span>
                              </span>
                            </span>
                          </div>

                          {/* 2. Douyin Header Navigation */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            {/* Purple Floating Cloud Video Icon */}
                            <div className="w-7 h-7 bg-purple-600/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-purple-400/40 text-white" title="云视频中心">
                              <Film className="w-4 h-4 fill-white text-purple-200" />
                            </div>

                            {/* Header Tabs (直播 | 同城 | 关注 | 推荐) */}
                            <div className="flex items-center gap-3 text-white/70 font-medium text-xs">
                              <span>直播</span>
                              <span>同城</span>
                              <span>关注</span>
                              <span className="text-white font-bold relative pb-0.5">
                                推荐
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"></span>
                              </span>
                            </div>

                            {/* Search Icon */}
                            <div className="p-1 text-white/90">
                              <Search className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* MIDDLE OVERLAY: Cover Headline + Left Disclaimer + Right Interaction Bar */}
                        <div className="relative z-20 flex-1 px-2.5 flex justify-between items-center pointer-events-none">
                          
                          {/* Left Vertical Disclaimer Text */}
                          <div className="text-[9px] text-white/60 space-y-1 select-none font-sans leading-none pl-0.5 border-l border-white/20 py-2">
                            <p className="[writing-mode:vertical-lr] tracking-widest">孕妇儿童禁用</p>
                            <p className="[writing-mode:vertical-lr] tracking-widest">广告呈现效果仅供参考</p>
                            <p className="[writing-mode:vertical-lr] tracking-widest">实际效果因人而异</p>
                          </div>

                          {/* Douyin Large Yellow Headline (Top Center Text) */}
                          <div className="absolute top-1 left-8 right-12 text-center pointer-events-none">
                            <h3 className="text-amber-300 font-extrabold text-sm sm:text-base tracking-wide leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] stroke-black font-sans">
                              {video.title || "如何做个背影美女 从一头黑发开始"}
                            </h3>
                          </div>

                          {/* Right Vertical Interaction Toolbar (Mock Safe-Zone UI) */}
                          <div className="ml-auto flex flex-col items-center gap-3 pointer-events-none pr-0.5">
                            {/* Avatar with Red Plus Badge */}
                            <div className="relative">
                              <img
                                src={video.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                                alt="author"
                                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-lg"
                              />
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white rounded-full p-0.5 shadow-md">
                                <Plus className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>

                            {/* Likes (Heart) */}
                            <div className="flex flex-col items-center">
                              <div className="p-1.5 rounded-full bg-black/20 backdrop-blur-xs">
                                <Heart className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono font-medium drop-shadow-xs">12.8w</span>
                            </div>

                            {/* Comments */}
                            <div className="flex flex-col items-center">
                              <div className="p-1.5 rounded-full bg-black/20 backdrop-blur-xs">
                                <MessageCircle className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono font-medium drop-shadow-xs">3,204</span>
                            </div>

                            {/* Favorite (Star) */}
                            <div className="flex flex-col items-center">
                              <div className="p-1.5 rounded-full bg-black/20 backdrop-blur-xs">
                                <Star className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono font-medium drop-shadow-xs">1,892</span>
                            </div>

                            {/* Share */}
                            <div className="flex flex-col items-center">
                              <div className="p-1.5 rounded-full bg-black/20 backdrop-blur-xs">
                                <Share2 className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono font-medium drop-shadow-xs">{video.shares || 842}</span>
                            </div>

                          </div>
                        </div>

                        {/* BOTTOM OVERLAY: Author Info + Showcase Banner (if active) + Player Controls + App Bottom Nav */}
                        <div className="relative z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-3 pb-2 px-3 space-y-2">
                          
                          {/* Douyin E-Commerce Showcase Product Card Pill (If overlayStyle === "douyin_showcase") */}
                          {overlayStyle === "douyin_showcase" && (
                            <div className="bg-gradient-to-r from-amber-500/90 to-rose-600/90 text-white rounded-xl p-2 flex items-center justify-between border border-amber-300/40 shadow-lg animate-pulse-subtle">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                                  <ShoppingCart className="w-4 h-4 text-amber-200" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <p className="text-[11px] font-bold truncate">🛒 进橱窗 | {video.brandName || "俪缇润黑露植物护理液"}</p>
                                  <p className="text-[9px] text-amber-200 font-mono">券后价 ￥59.9 · 爆款已售10w+</p>
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-amber-300 text-slate-900 rounded-lg text-[10px] font-black shrink-0">去抢购</span>
                            </div>
                          )}

                          {/* Author Handle & Music Note Banner */}
                          <div className="space-y-1 text-left">
                            <p className="font-bold text-xs text-white drop-shadow-xs flex items-center gap-1.5">
                              <span>@{video.author || "致上运营"}</span>
                              <span className="bg-purple-600/80 text-[9px] px-1.5 py-0.2 rounded text-white font-normal">官方创作</span>
                            </p>
                            <p className="text-[11px] text-white/90 line-clamp-2 leading-snug drop-shadow-xs">
                              {video.subtitle || video.title || "夏日爆款高品质发质护理，看这一篇就够了！"}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-white/70 pt-0.5">
                              <Music className="w-3 h-3 text-purple-300 animate-spin" style={{ animationDuration: '4s' }} />
                              <span className="truncate max-w-[200px]">原声 - {video.author || "致上剪辑"} · 热门爆款音轨</span>
                            </div>
                          </div>

                          {/* Video Player Control Bar (Progress Bar only) */}
                          <div className="flex items-center justify-between text-white text-[11px] gap-2 pt-1 px-0.5">
                            <span className="font-mono text-[10px] text-white/90 font-medium">{formatTime(currentTime)}</span>
                            <div className="flex-1 relative flex items-center">
                              <input
                                type="range"
                                min={0}
                                max={duration || 15}
                                step={0.1}
                                value={currentTime}
                                onChange={(e) => seekToSecond(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:h-1.5 transition-all"
                              />
                            </div>
                            <span className="font-mono text-[10px] text-white/90 font-medium">{formatTime(duration)}</span>
                          </div>

                          {/* Douyin Bottom Navigation Bar */}
                          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] font-medium text-white/60 px-1">
                            <span className="text-white font-bold">首页</span>
                            <span className="relative">
                              朋友
                              <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">3</span>
                            </span>
                            <div className="w-7 h-5 bg-white text-black rounded-md flex items-center justify-center font-bold shadow-md">
                              <Plus className="w-4 h-4 text-black stroke-[3]" />
                            </div>
                            <span>消息</span>
                            <span>我</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ==================== 3: WECHAT CHANNELS OVERLAY (视频号样式) ==================== */}
                    {overlayStyle === "channels" && (
                      <>
                        {/* TOP OVERLAY: WeChat Channels Header */}
                        <div className="relative z-30 pt-3 px-3 space-y-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-6">
                          
                          {/* Status Bar */}
                          <div className="flex justify-between items-center text-[10px] text-white/80 font-mono">
                            <span>09:41</span>
                            <span className="text-[10px] font-sans font-bold text-emerald-400">微信视频号</span>
                            <span>100% 🔋</span>
                          </div>

                          {/* Channels Header (Avatar + Name + Follow) */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <img
                                src={video.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                                alt="channel"
                                className="w-8 h-8 rounded-full border border-white/50 object-cover"
                              />
                              <div className="text-left">
                                <p className="text-xs font-bold text-white flex items-center gap-1">
                                  <span>{video.author || "致上美发官方"}</span>
                                  <span className="w-3 h-3 bg-blue-500 rounded-full text-[8px] flex items-center justify-center text-white">✓</span>
                                </p>
                                <p className="text-[9px] text-white/70">发表于 2小时前</p>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-600/90 text-white rounded-full text-[10px] font-bold ml-1">
                                + 关注
                              </span>
                            </div>

                            <span className="text-white/80 text-sm font-bold">•••</span>
                          </div>
                        </div>

                        {/* MIDDLE OVERLAY: Left Disclaimer + Right WeChat Interaction Icons */}
                        <div className="relative z-20 flex-1 px-2.5 flex justify-between items-center pointer-events-none">
                          
                          {/* Left Vertical Disclaimer */}
                          <div className="text-[9px] text-white/60 space-y-1 select-none font-sans leading-none pl-0.5 border-l border-white/20 py-2">
                            <p className="[writing-mode:vertical-lr] tracking-widest">广告呈现效果仅供参考</p>
                            <p className="[writing-mode:vertical-lr] tracking-widest">实际效果因人而异</p>
                          </div>

                          {/* Right WeChat Channels Interaction Bar */}
                          <div className="ml-auto flex flex-col items-center gap-4 pointer-events-none pr-1">
                            {/* Like (赞) */}
                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-black/30 backdrop-blur-xs">
                                <Heart className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono mt-0.5">2.4w</span>
                            </div>

                            {/* Forward (转发) */}
                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-black/30 backdrop-blur-xs">
                                <Share2 className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono mt-0.5">1.1w</span>
                            </div>

                            {/* Star (留存/收藏) */}
                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-black/30 backdrop-blur-xs">
                                <Star className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono mt-0.5">950</span>
                            </div>

                            {/* Comment (评论) */}
                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-black/30 backdrop-blur-xs">
                                <MessageCircle className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[10px] text-white/90 font-mono mt-0.5">580</span>
                            </div>
                          </div>
                        </div>

                        {/* BOTTOM OVERLAY: Channels Title, Hashtags & Progress Control */}
                        <div className="relative z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-3 pb-3 px-3 space-y-2">
                          <div className="space-y-1 text-left">
                            <p className="text-xs font-medium text-white line-clamp-2 leading-relaxed">
                              {video.title || "植物温和萃取，黑发护理新选择"}
                            </p>
                            <p className="text-[10px] text-emerald-400 font-medium">
                              #植萃护发 #美发推荐 #黑发护理 #致上出品
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-white/60 pt-0.5">
                              <Music className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                              <span>官方原声 - {video.author || "致上美发"}</span>
                            </div>
                          </div>

                          {/* Video Player Control Bar */}
                          <div className="flex items-center justify-between text-white text-[11px] gap-2 pt-1 px-0.5">
                            <span className="font-mono text-[10px] text-white/90 font-medium">{formatTime(currentTime)}</span>
                            <div className="flex-1 relative flex items-center">
                              <input
                                type="range"
                                min={0}
                                max={duration || 15}
                                step={0.1}
                                value={currentTime}
                                onChange={(e) => seekToSecond(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:h-1.5 transition-all"
                              />
                            </div>
                            <span className="font-mono text-[10px] text-white/90 font-medium">{formatTime(duration)}</span>
                          </div>
                        </div>
                      </>
                    )}

                  {/* ==================== 4: HIDDEN / CLEAN OVERLAY (隐藏样式) ==================== */}
                  {overlayStyle === "hidden" && (
                    <div className="relative z-30 mt-auto p-3 space-y-1">
                      <div className="flex items-center justify-between text-white text-[11px] gap-2 pt-1 px-0.5">
                        <span className="font-mono text-[10px] text-white/90 font-medium">{formatTime(currentTime)}</span>
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="range"
                            min={0}
                            max={duration || 15}
                            step={0.1}
                            value={currentTime}
                            onChange={(e) => seekToSecond(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:h-1.5 transition-all"
                          />
                        </div>
                        <span className="font-mono text-[10px] text-white/90 font-medium">{formatTime(duration)}</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            </div>

            {/* RIGHT COLUMN: Video Information / Review / Interaction / Project Tabs (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* MAIN CONTAINER CARD: Header + Nav Tabs + Tab Content */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                
                {/* 1. Header Row (Brand Path + Timestamps) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  {/* Left: Brand Path & Timestamps */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-0.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shadow-2xs">
                        <MengchangWingedLogo className="w-10 h-7" />
                      </div>
                      <span className="font-bold text-slate-800 text-sm tracking-wide">
                        梦畅AIGC <span className="text-slate-300 mx-1">/</span> 默认部门 <span className="text-slate-300 mx-1">/</span> 默认分组
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-4 pl-12">
                      <span>发布时间: 2025-04-02 12:06:28</span>
                      <span>剪辑时间: 2025-05-02</span>
                    </div>
                  </div>

                </div>

                {/* 2. Top Navigation Tabs Bar */}
                <div className={`bg-slate-100/80 p-1 rounded-2xl grid ${isMaterialMode ? "grid-cols-2" : "grid-cols-4"} gap-1 text-xs font-bold text-slate-600`}>
                  <button
                    onClick={() => setActiveRightTab("info")}
                    className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
                      activeRightTab === "info"
                        ? "bg-white text-purple-700 shadow-xs font-extrabold"
                        : "hover:bg-slate-200/50 hover:text-slate-900"
                    }`}
                  >
                    视频信息
                  </button>

                  <button
                    onClick={() => setActiveRightTab("review")}
                    className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
                      activeRightTab === "review"
                        ? "bg-white text-purple-700 shadow-xs font-extrabold"
                        : "hover:bg-slate-200/50 hover:text-slate-900"
                    }`}
                  >
                    视频审核
                  </button>

                  {!isMaterialMode && (
                    <button
                      onClick={() => setActiveRightTab("interaction")}
                      className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
                        activeRightTab === "interaction"
                          ? "bg-white text-purple-700 shadow-xs font-extrabold"
                          : "hover:bg-slate-200/50 hover:text-slate-900"
                      }`}
                    >
                      互动数据
                    </button>
                  )}

                  {!isMaterialMode && (
                    <button
                      onClick={() => setActiveRightTab("project")}
                      className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
                        activeRightTab === "project"
                          ? "bg-white text-purple-700 shadow-xs font-extrabold"
                          : "hover:bg-slate-200/50 hover:text-slate-900"
                      }`}
                    >
                      工程文件
                    </button>
                  )}
                </div>

                {/* 3. TAB 1: 视频信息 (Visuals matching user reference screenshot) */}
                {activeRightTab === "info" && (
                  <div className="space-y-4 pt-1 text-xs text-slate-700 font-sans leading-relaxed">
                    
                    {/* 成片区 / 素材区 */}
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-slate-500 font-medium shrink-0">{resourceName}区</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{categoryText}</span>
                          <button
                            onClick={() => {
                              setShowModifyCategoryModal(true);
                            }}
                            className="text-slate-400 hover:text-purple-600 cursor-pointer transition-colors p-0.5 flex items-center gap-1 text-xs font-normal"
                            title="修改分类"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-purple-600 font-medium hover:underline">修改</span>
                          </button>
                        </span>
                      </div>
                    </div>

                    {/* 视频标题 */}
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-slate-500 font-medium shrink-0">视频标题</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{titleText}</span>
                          <button
                            onClick={() => {
                              setTempTitleText(titleText);
                              setShowModifyTitleModal(true);
                            }}
                            className="text-slate-400 hover:text-purple-600 cursor-pointer transition-colors p-0.5"
                            title="修改标题"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    </div>

                    {/* 公共标签 */}
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-500 font-medium shrink-0 pt-1">公共标签</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {publicTags.map((tag, idx) => (
                          <span key={idx} className="bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/60 flex items-center">
                            <span>{tag}</span>
                          </span>
                        ))}

                        <button
                          onClick={() => {
                            setShowPublicTagModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer py-1 hover:underline"
                        >
                          <span>+ 添加公共标签</span>
                        </button>
                      </div>
                    </div>

                    {/* 个人标签 */}
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-500 font-medium shrink-0 pt-1">个人标签</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {personalTags.map((tag, idx) => (
                          <span key={idx} className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-purple-100 flex items-center gap-1">
                            <span>{tag}</span>
                            <button
                              onClick={() => {
                                const next = personalTags.filter((_, i) => i !== idx);
                                if (updateMetadata({ personalTags: next })) setPersonalTags(next);
                              }}
                              className="text-purple-400 hover:text-rose-500 ml-0.5 cursor-pointer text-xs"
                              title="删除标签"
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        <button
                          onClick={() => {
                            setShowPersonalTagModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer py-1 hover:underline"
                        >
                          <span>+ 添加个人标签</span>
                        </button>
                      </div>
                    </div>

                    {/* 关联脚本 */}
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-slate-500 font-medium shrink-0">关联脚本</span>
                      <button
                        onClick={() => setShowRelatedScriptsModal(true)}
                        className="text-purple-600 hover:text-purple-700 font-bold text-xs cursor-pointer hover:underline flex items-center gap-1"
                      >
                        <span>查看脚本({associatedScripts.length})</span>
                      </button>
                    </div>

                    {/* 视频状态 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {configStore.statusEnabled(resourceScope) && <>
                        <span className="w-20 text-slate-500 font-medium shrink-0">视频状态</span>
                        <div className="flex items-center gap-2">
                          {isChangingStatus ? (
                            <div className="flex items-center gap-1.5">
                              <VideoStatusSelect value={videoStatus} scope={resourceScope} onChange={newStatus => {
                                if (!updateMetadata({ status: newStatus })) return;
                                if (newStatus !== videoStatus) addOperationLog("修改状态", videoStatus, newStatus);
                                setVideoStatus(newStatus);
                                setIsChangingStatus(false);
                                showToast(`状态修改成功，现为：${newStatus}`);
                              }} />
                              <button
                                onClick={() => setIsChangingStatus(false)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ResourceStatusBadge scope={resourceScope} status={videoStatus} className="px-2.5 py-1 font-extrabold text-xs rounded-md shadow-2xs" />
                              <button
                                onClick={() => setIsChangingStatus(true)}
                                className="text-purple-600 hover:text-purple-700 font-medium text-xs cursor-pointer hover:underline"
                              >
                                修改状态
                              </button>
                            </div>
                          )}
                        </div>
                        </>}
                      </div>

                      {/* 备注修改历史 Select */}
                      <select
                        disabled={!videoNotes.trim() && notesHistory.length === 0}
                        value=""
                        onChange={(e) => {
                          const entry = notesHistory.find((item) => item.id === e.target.value);
                          if (entry) openNotesEditor(entry.content);
                        }}
                        className={`bg-white border text-xs px-3 py-1.5 rounded-xl transition-all ${
                          !videoNotes.trim() && notesHistory.length === 0
                            ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50"
                            : "border-purple-200 text-purple-700 hover:border-purple-400 cursor-pointer shadow-2xs font-medium"
                        }`}
                        title={!videoNotes.trim() && notesHistory.length === 0 ? "当前视频暂无备注修改历史" : "选择查看历史修改备注"}
                      >
                        <option value="" disabled>
                          {!videoNotes.trim() && notesHistory.length === 0 ? "备注修改历史 (无记录)" : "备注修改历史"}
                        </option>
                        {notesHistory.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.timestamp}{item.content === "" ? "（已清空）" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 视频备注 */}
                    <div className="flex items-start gap-3 pt-1">
                      <span className="w-20 text-slate-500 font-medium shrink-0 pt-2">视频备注</span>
                      <button
                        type="button"
                        aria-label="编辑视频备注"
                        aria-haspopup="dialog"
                        aria-expanded={showNotesModal}
                        onClick={() => openNotesEditor(videoNotes)}
                        className={`block min-w-0 flex-1 h-[150px] overflow-y-auto whitespace-pre-wrap break-words p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left text-xs leading-5 focus:outline-none focus:border-purple-400 transition-colors font-sans ${videoNotes ? "text-slate-800" : "text-slate-400"}`}
                      >
                        <span className="block min-h-full">{videoNotes || "暂无备注"}</span>
                      </button>
                    </div>

                    {/* 附件 */}
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-slate-500 font-medium shrink-0">附件</span>
                      <div className="flex items-center gap-2">
                        {attachments.map((att, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono">
                            {att}
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            setAttachments([...attachments, `附件_${attachments.length + 1}.pdf`]);
                            showToast("📎 附件添加成功");
                          }}
                          className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>+ 添加附件</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Action Toolbar (Icon Buttons + Purple Buttons) */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      {/* Row 1: Small Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Share Button with Hover Menu (PC & Mobile links) */}
                        <div
                          className="relative group"
                        >
                          <button
                            onClick={async () => {
                              const link = `${window.location.origin}/#/resources/${video.id}`;
                              await navigator.clipboard?.writeText(link);
                              showToast("详情链接已复制，访问时将按查看者登录状态与资源权限显示");
                            }}
                            className="p-2 border border-purple-300 bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-bold"
                            title="分享链接"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>分享</span>
                          </button>

                          {/* Hover Dropdown with seamless padding bridge */}
                          <div
                            className="hidden"
                          >
                            <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 w-44 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  showToast("🔗 PC端预览链接已复制到剪贴板！");
                                  setShowShareDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Monitor className="w-3.5 h-3.5 text-purple-600" />
                                <span>复制PC端链接</span>
                              </button>
                              <button
                                onClick={() => {
                                  showToast("📱 移动端预览链接已复制到剪贴板！");
                                  setShowShareDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                                <span>复制移动端链接</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {!isMaterialMode && !isAdminMode && (
                          <div className="inline-flex items-stretch rounded-xl border border-purple-300 bg-white text-purple-700 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => { if (!getAdActor().permissions.includes("uc_ad_push")) { setToastMsg("暂无推送权限"); window.setTimeout(() => setToastMsg(null), 4000); return; } setDerivePush(false); setAdDraft(undefined); setShowAdPushWorkspace(true); }}
                              className="flex items-center gap-1.5 rounded-l-[11px] px-3 py-2 text-xs font-bold transition-colors hover:bg-purple-50"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>推送广告账户</span>
                            </button>
                            <div className="group relative border-l border-purple-200">
                              <button
                                type="button"
                                onClick={() => setShowPushRecordsModal(true)}
                                className="flex h-full min-w-10 items-center justify-center rounded-r-[11px] px-2.5 transition-colors hover:bg-purple-50"
                                aria-label="查看推送记录"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                              <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg group-hover:block">
                                推送记录
                                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 操作记录 */}
                        <button
                          onClick={() => setShowOperationLogsModal(true)}
                          className="px-3 py-2 border border-purple-300 hover:bg-purple-50 text-purple-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>操作记录</span>
                        </button>

                        {/* 更多 v Popover Menu */}
                        <div className="relative">
                          <button
                            ref={moreButtonRef}
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className="px-3 py-2 border border-purple-300 hover:bg-purple-50 text-purple-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <span>更多</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-purple-600 transition-transform duration-200 ${showMoreMenu ? "rotate-180" : ""}`} />
                          </button>

                          {showMoreMenu && (
                              <AnchoredPopover anchorRef={moreButtonRef} align="end" side="top" width={192} gap={12} onClose={() => setShowMoreMenu(false)} className="bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col gap-0.5 text-center font-medium text-slate-700 text-xs animate-in fade-in zoom-in-95 duration-100">
                                {!isMaterialMode && !isAdminMode && canUseDerivations(getAdActor()) && <>
                                  <button className="w-full rounded-xl px-3 py-2 text-slate-600 hover:bg-purple-50 hover:text-purple-700" onClick={() => {
                                    setShowMoreMenu(false);
                                    const actor = getAdActor();
                                    if (!canUseDerivations(actor)) return setToastMsg("暂无衍生视频权限");
                                    setAdDraft(undefined); setDerivePush(true); setShowAdPushWorkspace(true);
                                  }}>衍生视频并推送</button>
                                  <button className="w-full rounded-xl px-3 py-2 text-slate-600 hover:bg-purple-50 hover:text-purple-700" onClick={() => {
                                    setShowMoreMenu(false);
                                    if (!canUseDerivations(getAdActor())) return setToastMsg("暂无衍生视频权限");
                                    setShowDeriveDialog(true);
                                  }}>衍生新视频</button>
                                </>}
                                <button
                                  onClick={() => {
                                    setShowMoreMenu(false);
                                    showToast("📥 开始下载无水印原片...");
                                  }}
                                  className="w-full py-2 px-3 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer text-center font-medium"
                                >
                                  下载原片
                                </button>

                                <button
                                  onClick={() => {
                                    setShowMoreMenu(false);
                                    setShowOperationLogsModal(true);
                                  }}
                                  className="w-full py-2 px-3 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer text-center font-medium"
                                >
                                  操作记录
                                </button>

                                {(resourceScope !== "thirdParty" || onDelete) && <button
                                  onClick={() => {
                                    setShowMoreMenu(false);
                                    if (window.confirm("删除后将移入回收站，可在回收站恢复。确认继续吗？")) {
                                      if (onDelete) onDelete();
                                      else showToast("视频已移至回收站");
                                    }
                                  }}
                                  className="w-full py-2 px-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-center font-medium"
                                >
                                  删除
                                </button>}

                              </AnchoredPopover>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* 4. TAB 2: 视频审核 (Video Audit & Annotations) */}
                {activeRightTab === "review" && (
                  <div className="space-y-4 pt-1">
                    {/* Sub-Filters Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Annotation Type Dropdown */}
                        <select
                          value={auditTypeFilter}
                          onChange={(e) => setAuditTypeFilter(e.target.value)}
                          className="bg-white border border-slate-200 text-slate-700 font-medium px-2.5 py-1.5 rounded-xl text-xs focus:outline-none cursor-pointer hover:border-purple-300 shadow-2xs"
                        >
                          <option value="全部批注">全部批注</option>
                          <option value="单帧批注">单帧批注</option>
                          <option value="片段批注">片段批注</option>
                          <option value="字幕批注">字幕批注</option>
                        </select>

                        {/* Checkbox: 只看@我的 */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none text-xs ml-1 font-medium">
                          <input
                            type="checkbox"
                            checked={onlyAtMe}
                            onChange={(e) => setOnlyAtMe(e.target.checked)}
                            className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                          />
                          <span>只看@我的</span>
                        </label>

                        {/* Checkbox: 只看回复我的 */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none text-xs ml-1 font-medium">
                          <input
                            type="checkbox"
                            checked={onlyReplyMe}
                            onChange={(e) => setOnlyReplyMe(e.target.checked)}
                            className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                          />
                          <span>只看回复我的</span>
                        </label>
                      </div>
                    </div>

                    {/* Annotations List */}
                    <div className="space-y-3 min-h-[220px]">
                      {filteredAuditAnnotations.map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() => handleSelectAuditAnnotation(ann)}
                          className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                          {/* Header Row: Avatar, Author, Date, Version Badge */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <img
                                src={ann.avatar}
                                alt={ann.author}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 group-hover:text-purple-700 transition-colors">{ann.author}</span>
                                <span className="text-[11px] text-slate-400 font-mono">{ann.createdAt}</span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md">
                              {ann.version || "第1版"}
                            </span>
                          </div>

                          {/* Comment Body Row: Clickable Time Range Badge + Comment Text + Actions */}
                          <div className="space-y-1.5 pl-9">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAuditAnnotation(ann);
                                }}
                                className="text-purple-600 hover:text-purple-800 font-bold hover:underline cursor-pointer flex items-center gap-1 font-mono text-xs bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100"
                                title="点击播放并于视频播放器渲染画面标注"
                              >
                                <Play className="w-3 h-3 fill-purple-600 text-purple-600" />
                                <span>{ann.timeRange}</span>
                              </button>

                              <span className="text-slate-800 font-medium text-xs leading-relaxed">
                                {ann.commentText}
                              </span>
                            </div>

                            {/* Actions: Reply, Delete, Resolved Circle Check */}
                            <div className="flex items-center justify-end gap-3 text-xs text-slate-500 pt-1 border-t border-slate-100/80">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const handleName = ann.author.startsWith("@") ? ann.author : `@${ann.author}`;
                                  setMentionedMembers(prev => prev.includes(handleName) ? prev : [...prev, handleName]);
                                  showToast(`已添加回复目标 ${handleName}`);
                                }}
                                className="hover:text-purple-600 cursor-pointer transition-colors font-medium text-[11px]"
                              >
                                回复
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAuditAnnotations(prev => prev.filter(a => a.id !== ann.id));
                                  showToast("🗑️ 已删除该批注");
                                }}
                                className="hover:text-rose-600 cursor-pointer transition-colors font-medium text-[11px]"
                              >
                                删除
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAuditAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, isResolved: !a.isResolved } : a));
                                  showToast(ann.isResolved ? "标记为未解决" : "✅ 标记为已解决");
                                }}
                                className={`flex items-center gap-1 cursor-pointer transition-colors text-[11px] ${
                                  ann.isResolved ? "text-emerald-600 font-bold" : "hover:text-slate-800"
                                }`}
                                title={ann.isResolved ? "已完成审核" : "标记为已完成"}
                              >
                                <CheckCircle2 className={`w-4 h-4 ${ann.isResolved ? "text-emerald-500 fill-emerald-100" : "text-slate-300"}`} />
                                <span>{ann.isResolved ? "已完成" : "标记完成"}</span>
                              </button>
                            </div>

                            {/* Nested Replies */}
                            {ann.replies && ann.replies.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-xs bg-slate-50/70 p-2.5 rounded-xl">
                                {ann.replies.map(rep => (
                                  <div key={rep.id} className="flex items-start justify-between text-[11px] text-slate-700">
                                    <div>
                                      <span className="font-bold text-slate-800">{rep.author}</span>
                                      <span className="text-slate-400 mx-1">回复</span>
                                      <span className="font-bold text-slate-800">{rep.replyTo}:</span>
                                      <span className="ml-1.5 text-slate-700 font-medium">{rep.text}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const handleName = rep.author.startsWith("@") ? rep.author : `@${rep.author}`;
                                          setMentionedMembers(prev => prev.includes(handleName) ? prev : [...prev, handleName]);
                                          showToast(`已添加回复目标 ${handleName}`);
                                        }}
                                        className="text-purple-600 hover:underline text-[10px] cursor-pointer font-medium"
                                      >
                                        回复
                                      </button>
                                      <span className="text-[10px] text-slate-400 font-mono">{rep.time}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {filteredAuditAnnotations.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
                          暂无匹配的审核批注记录，可通过左侧视频浮窗添加“片段批注”或“单帧批注”。
                        </div>
                      )}
                    </div>

                    {/* Bottom Annotation Input Box */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-2.5">
                      {/* Time Range Badge Header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-purple-700 font-mono bg-purple-100 px-2.5 py-0.5 rounded-lg text-xs">
                            {selectedAnnotationRange || `${Math.floor(currentTime / 60)}分${Math.floor(currentTime % 60)}秒${Math.floor((currentTime % 1) * 100)}`}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({annotationType || "单帧批注"})
                          </span>
                        </div>
                      </div>

                      {/* Textarea with Char Count */}
                      <div className="relative">
                        <textarea
                          rows={3}
                          maxLength={100}
                          value={annotationInputText}
                          onChange={(e) => setAnnotationInputText(e.target.value)}
                          placeholder="请输入文字信息"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium resize-none shadow-2xs"
                        />
                        <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono pointer-events-none">
                          {annotationInputText.length}/100
                        </span>
                      </div>

                      {/* Bottom Controls Row: Image Upload, Multi-Member @ Selection Input, Send Notification Checkbox, Send Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          {/* Image Icon Button */}
                          <button
                            type="button"
                            onClick={() => showToast("🖼️ 已上传视频标注截图/附件")}
                            className="p-1.5 bg-white border border-slate-200 hover:border-purple-300 text-slate-500 hover:text-purple-600 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="上传截图附件"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>

                          {/* Multi-User @ Mention Input Component */}
                          <div className="relative flex-1">
                            <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 focus-within:border-purple-500 rounded-xl px-2 py-1 min-h-[32px] text-xs shadow-2xs">
                              {mentionedMembers.map((member) => (
                                <span
                                  key={member}
                                  className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-purple-200/80 animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <span>{member}</span>
                                  <button
                                    type="button"
                                    onClick={() => setMentionedMembers(prev => prev.filter(m => m !== member))}
                                    className="hover:text-purple-900 rounded-full p-0.5 transition-colors cursor-pointer"
                                    title="移除"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}

                              <div className="relative flex-1 min-w-[80px]">
                                <input
                                  type="text"
                                  value={atSearchText}
                                  onChange={(e) => {
                                    setAtSearchText(e.target.value);
                                    setShowAtDropdown(true);
                                  }}
                                  onFocus={() => setShowAtDropdown(true)}
                                  placeholder={mentionedMembers.length === 0 ? "输入 @ 选择用户..." : "输入 @..."}
                                  className="w-full bg-transparent border-none text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none p-0"
                                />

                                {/* Autocomplete Dropdown List for @ Users */}
                                {showAtDropdown && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setShowAtDropdown(false)}
                                    />
                                    <div className="absolute left-0 bottom-full mb-1.5 w-52 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 space-y-0.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
                                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                                        选择 @ 提醒用户 (可多选)
                                      </div>
                                      {SYSTEM_AT_USERS
                                        .filter(u => u.toLowerCase().includes(atSearchText.toLowerCase().replace("@", "")))
                                        .map(user => {
                                          const isSelected = mentionedMembers.includes(user);
                                          return (
                                            <button
                                              key={user}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  setMentionedMembers(prev => prev.filter(m => m !== user));
                                                } else {
                                                  setMentionedMembers(prev => [...prev, user]);
                                                }
                                                setAtSearchText("");
                                                setShowAtDropdown(false);
                                                showToast(`已${isSelected ? "取消" : "选择"} ${user}`);
                                              }}
                                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                                isSelected ? "bg-purple-50 text-purple-700 font-bold" : "hover:bg-slate-100 text-slate-700"
                                              }`}
                                            >
                                              <span>{user}</span>
                                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                                            </button>
                                          );
                                        })}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Checkbox: 同时发送通知 */}
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none text-[11px] font-medium">
                            <input
                              type="checkbox"
                              checked={sendNotification}
                              onChange={(e) => setSendNotification(e.target.checked)}
                              className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                            />
                            <span>同时发送通知</span>
                          </label>

                          {/* Send Button */}
                          <button
                            type="button"
                            disabled={!annotationInputText.trim()}
                            onClick={() => {
                              if (!annotationInputText.trim()) return;
                              const atString = mentionedMembers.length > 0 ? " " + mentionedMembers.join(" ") : "";
                              const newAnn: AuditAnnotation = {
                                id: `ann_${Date.now()}`,
                                author: "致上运营",
                                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
                                createdAt: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) + " " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
                                version: selectedVersion || "第1版",
                                timeRange: selectedAnnotationRange || `${Math.floor(currentTime / 60)}分${Math.floor(currentTime % 60)}秒${Math.floor((currentTime % 1) * 100)}`,
                                startSec: currentTime,
                                endSec: annotationType === "片段批注" ? clipEnd : undefined,
                                type: annotationType || "单帧批注",
                                commentText: `${annotationInputText}${atString}`,
                                isResolved: false,
                                drawings: [...drawings],
                                replies: []
                              };
                              setAuditAnnotations(prev => [newAnn, ...prev]);
                              setAnnotationInputText("");
                              showToast("🚀 审核批注已发布，已同步保存画面标注信息与通知部门成员");
                            }}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                          >
                            发送
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. TAB 3: 互动数据 (支持巨量引擎、腾讯ADQ、TikTok平台，多指标对比趋势图与复盘区) */}
                {!isMaterialMode && activeRightTab === "interaction" && (
                  <div className="space-y-4 pt-1 text-slate-800">
                    
                    {/* Top Control Bar: Platform Selector + Scope Dropdown + Dual Metric Selectors */}
                    <div data-testid="video-interaction-panel" className={`${interactionTrend.length ? "bg-slate-50/90" : "bg-white"} p-3.5 rounded-2xl border border-slate-200/80 space-y-3`}>
                      <div className="flex flex-col md:flex-row flex-wrap md:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-3">
                        
                        <VideoInteractionSelectors channelId={analyticsChannel} scopeId={analyticsScope} records={interactionRecords}
                          onChannelChange={channel => { setAnalyticsChannel(channel); setAnalyticsScope("all"); }}
                          onScopeChange={setAnalyticsScope} />

                        {/* Dual Metric Selectors (Matching user screenshot) */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Metric 1 Dropdown (Left Y Axis) */}
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ANALYTICS_METRICS.find(m => m.id === metricLeft)?.color || "#9333ea" }} />
                            <select
                              value={metricLeft}
                              onChange={(e) => setMetricLeft(e.target.value)}
                              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                            >
                              {ANALYTICS_METRICS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Metric 2 Dropdown (Right Y Axis) */}
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ANALYTICS_METRICS.find(m => m.id === metricRight)?.color || "#22c55e" }} />
                            <select
                              value={metricRight}
                              onChange={(e) => setMetricRight(e.target.value)}
                              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                            >
                              {ANALYTICS_METRICS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                      </div>

                      {/* Dynamic Dual Y-Axis Trend Chart */}
                      {interactionTrend.length ? <div className="h-64 w-full pt-1 relative">
                        {/* Legend Indicator */}
                        <div className="flex items-center justify-center sm:justify-end gap-5 text-[11px] font-bold text-slate-600 mb-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ANALYTICS_METRICS.find(m => m.id === metricLeft)?.color }} />
                            <span>{ANALYTICS_METRICS.find(m => m.id === metricLeft)?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ANALYTICS_METRICS.find(m => m.id === metricRight)?.color }} />
                            <span>{ANALYTICS_METRICS.find(m => m.id === metricRight)?.name}</span>
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height="88%">
                          <AreaChart
                            data={interactionTrend}
                            margin={{ top: 10, right: 15, left: -5, bottom: 0 }}
                            onClick={(e: any) => {
                              if (e && e.activePayload && e.activePayload.length > 0) {
                                const sec = e.activePayload[0].payload.second;
                                seekToSecond(sec);
                                showToast(`⏱️ 已跳转至视频 ${sec}s 帧`);
                              }
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                              dataKey="secondLabel"
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              axisLine={{ stroke: '#cbd5e1' }}
                            />
                            
                            {/* Left Y Axis */}
                            <YAxis
                              yAxisId="left"
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => val >= 10000 ? `${(val/10000).toFixed(0)}w` : val}
                            />

                            {/* Right Y Axis */}
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => val >= 10000 ? `${(val/10000).toFixed(0)}w` : val}
                            />

                            {/* Custom Tooltip matching user screenshot */}
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const leftObj = ANALYTICS_METRICS.find(m => m.id === metricLeft)!;
                                  const rightObj = ANALYTICS_METRICS.find(m => m.id === metricRight)!;
                                  const valLeft = data[metricLeft];
                                  const valRight = data[metricRight];
                                  return (
                                    <div className="bg-white text-slate-800 p-3 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-2 min-w-48">
                                      <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
                                        <span>{data.secondLabel}</span>
                                        <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">点击跳转播放</span>
                                      </div>
                                      <div className="space-y-1 text-[11px]">
                                        <div className="flex items-center justify-between gap-4">
                                          <span className="flex items-center gap-1.5 font-bold" style={{ color: leftObj.color }}>
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leftObj.color }} />
                                            <span>{leftObj.name}</span>
                                          </span>
                                          <span className="font-mono font-bold text-slate-900">
                                            {leftObj.isRate ? `${valLeft}%` : valLeft?.toLocaleString()} {leftObj.unit}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                          <span className="flex items-center gap-1.5 font-bold" style={{ color: rightObj.color }}>
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rightObj.color }} />
                                            <span>{rightObj.name}</span>
                                          </span>
                                          <span className="font-mono font-bold text-slate-900">
                                            {rightObj.isRate ? `${valRight}%` : valRight?.toLocaleString()} {rightObj.unit}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />

                            {/* Playback Position Indicator */}
                            <ReferenceLine
                              yAxisId="left"
                              x={`${currentSecondFloor.toString().padStart(1, "0")}s`}
                              stroke="#e11d48"
                              strokeWidth={2}
                              strokeDasharray="3 3"
                            />

                            <Area
                              yAxisId="left"
                              type="monotone"
                              dataKey={metricLeft}
                              stroke={ANALYTICS_METRICS.find(m => m.id === metricLeft)?.color || "#9333ea"}
                              fillOpacity={0.15}
                              fill={ANALYTICS_METRICS.find(m => m.id === metricLeft)?.color || "#9333ea"}
                              strokeWidth={2.5}
                              activeDot={{ r: 5 }}
                            />

                            <Area
                              yAxisId="right"
                              type="monotone"
                              dataKey={metricRight}
                              stroke={ANALYTICS_METRICS.find(m => m.id === metricRight)?.color || "#22c55e"}
                              fillOpacity={0.12}
                              fill={ANALYTICS_METRICS.find(m => m.id === metricRight)?.color || "#22c55e"}
                              strokeWidth={2.5}
                              activeDot={{ r: 5 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div> : (
                        <div data-testid="video-interaction-empty" role="status" className="h-64 flex flex-col items-center justify-center gap-3 text-sm text-neutral-400">
                          <img src="./assets/prototype/interaction-empty.png" alt="" aria-hidden="true" width={176} height={178} className="w-44 h-[178px] object-contain" />
                          <span>暂无数据</span>
                        </div>
                      )}

                      <div className="text-center text-[11px] text-neutral-400 pt-2">
                        <p>(数据来源：根据{analyticsPlatform === "巨量引擎" ? "巨量" : analyticsPlatform === "腾讯ADQ" ? "ADQ" : "TikTok"}接口实时查询，近一个月视频素材的互动流失数据)</p>
                      </div>
                    </div>

                    {/* Review Section (复盘区 - Exact design from screenshot) */}
                    <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-4 bg-purple-600 rounded-full" />
                            <span>复盘区</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            分析视频在每个帧数的亮点与爆点，支持点击定位跳转播放
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setNewReviewSec(Math.floor(currentTime) || 10);
                            setShowAddReviewModal(true);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>添加帧复盘</span>
                        </button>
                      </div>

                      {/* Review Items List matching screenshot */}
                      <div className="space-y-2.5">
                        {analyticsReviews.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              seekToSecond(item.timestampSec);
                              showToast(`⏱️ 已跳转至视频 ${item.timeLabel} 帧`);
                            }}
                            className="bg-white hover:bg-purple-50/60 p-3 rounded-2xl border border-slate-200/90 hover:border-purple-300 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Frame Thumbnail */}
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group-hover:scale-105 transition-transform">
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Play className="w-4 h-4 fill-white text-white opacity-80 group-hover:opacity-100" />
                                </div>
                              </div>

                              {/* Content Info */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200/60 rounded-md text-[10px] font-bold">
                                    {item.tag}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                    {item.timeLabel}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-800 font-bold group-hover:text-purple-700 transition-colors">
                                  <span className="text-slate-500 font-normal mr-1">{item.company}:</span>
                                  {item.title}
                                </p>
                              </div>
                            </div>

                            {/* Timestamp Date */}
                            <span className="text-[11px] text-slate-400 font-mono shrink-0 hidden sm:inline">
                              {item.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 6. TAB 4: 工程文件 (根据图片样式与需求完美重构) */}
                {!isMaterialMode && activeRightTab === "project" && (
                  <div className="space-y-4 pt-1 text-xs">
                    
                    {/* Top Action Bar: Upload Button on Left, FAQ link on Right (Exact layout from user screenshot) */}
                    <div className="flex items-center justify-between px-1">
                      {/* Left: Upload Project File Button (Outlined Purple Style) */}
                      <button
                        onClick={() => {
                          setUploadProjectName(video.title || "10.6子涵酒吧1");
                          setShowUploadProjectModal(true);
                        }}
                        className="border border-purple-500 hover:border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-purple-600" />
                        <span>上传工程文件</span>
                      </button>

                      {/* Right: FAQ Help link */}
                      <button
                        onClick={() => setShowProjectFaqModal(true)}
                        className="text-slate-500 hover:text-purple-600 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 group"
                      >
                        <span>常见问题</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                      </button>
                    </div>

                    {/* Project File Cards List (Exact UI matching screenshot) */}
                    <div className="space-y-3">
                      {projectFiles.map((pf) => (
                        <div
                          key={pf.id}
                          className="bg-slate-50/90 hover:bg-slate-50/100 p-4 rounded-2xl border border-slate-200/90 transition-all shadow-2xs space-y-3"
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Project Video Thumbnail */}
                            <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200/80 relative group shadow-2xs">
                              <img src={pf.thumbnail} alt={pf.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <Folder className="w-5 h-5 text-white/90" />
                              </div>
                            </div>

                            {/* Project Information */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <h4 className="text-sm font-extrabold text-slate-900 truncate">{pf.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">
                                上传工程时间：<span className="font-mono text-slate-700">{pf.uploadTime}</span>
                              </p>
                              
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <span className="px-2 py-0.5 bg-purple-100/80 text-purple-800 border border-purple-200/60 rounded-md text-[10px] font-bold">
                                  {pf.software}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {pf.size} · 保留 {pf.tracksCount} 轨时间线
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Download Button & Visibility Permission */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70">
                            {/* Download Button (Exact purple pill button from screenshot) */}
                            <button
                              onClick={() => {
                                showToast(`🚀 正在开始下载【${pf.name}】工程文件，导入剪映即可恢复完整剪辑轨道！`);
                              }}
                              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5 text-purple-700" />
                              <span>下载</span>
                            </button>

                            {/* Permission Badge / Dropdown (Exact '公开' style from screenshot) */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-medium">访问权限:</span>
                              <select
                                value={pf.visibility}
                                onChange={(e) => {
                                  const val = e.target.value as "公开" | "仅本部门" | "私密";
                                  setProjectFiles(prev => prev.map(p => p.id === pf.id ? { ...p, visibility: val } : p));
                                  showToast(`🔒 已更新【${pf.name}】访问权限为：${val}`);
                                }}
                                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md focus:outline-none cursor-pointer shadow-2xs"
                              >
                                <option value="公开">公开</option>
                                <option value="仅本部门">仅本部门</option>
                                <option value="私密">私密</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explanatory Banner on Team Enablement */}
                    <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-2 text-slate-700 text-xs">
                      <div className="flex items-center gap-2 text-purple-900 font-extrabold text-xs">
                        <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>爆款视频工程文件拆解与复用价值</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-600 pl-5 list-disc leading-relaxed font-medium">
                        <li><strong className="text-slate-800">爆款框架微调：</strong>下载爆款视频工程文件并导入剪映后，系统保留所有画轨、音轨、特效与花字时间线。只需替换特定镜头或产品，即可快速批量产出高质素材。</li>
                        <li><strong className="text-slate-800">新人迅速上手：</strong>新员工可通过解构优秀剪辑师的工程草稿，学习黄金Hook节奏、转场卡点与音效编排。</li>
                        <li><strong className="text-slate-800">内网资产归档：</strong>拍摄与剪辑人员在内网环境下无缝协作与工程同步，保障视频数字资产不丢失。</li>
                      </ul>
                    </div>

                  </div>
                )}

              </div>

            </div>



            {/* Bottom Full-Width Section: 素材数据 (Asset Performance Data & Sync) */}
            {!isMaterialMode && !isAdminMode && (
              <div className="lg:col-span-12 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                {/* Header row matching Screenshot 1 */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      <span>素材数据</span>
                    </h3>

                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto text-xs">
                    <button
                      onClick={() => showToast("🔄 已成功手动刷新近3天广告数据！")}
                      className="text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                      <span>手动刷新近3天数据</span>
                    </button>

                    {/* Date Range Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-mono text-[11px] font-bold shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="date"
                        value={assetStartDate}
                        onChange={(e) => {
                          setAssetStartDate(e.target.value);
                          showToast(`📅 已更新素材数据统计起始时间: ${e.target.value}`);
                        }}
                        className="bg-transparent border-none p-0 text-[11px] font-mono font-bold text-slate-800 focus:outline-none cursor-pointer w-[96px]"
                      />
                      <span className="text-slate-400 font-sans">至</span>
                      <input
                        type="date"
                        value={assetEndDate}
                        onChange={(e) => {
                          setAssetEndDate(e.target.value);
                          showToast(`📅 已更新素材数据统计截止时间: ${e.target.value}`);
                        }}
                        className="bg-transparent border-none p-0 text-[11px] font-mono font-bold text-slate-800 focus:outline-none cursor-pointer w-[96px]"
                      />
                      <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-0.5 text-[10px]">
                        {[
                          { label: "近7天", start: "2025-05-06", end: "2025-05-13" },
                          { label: "近30天", start: "2025-04-13", end: "2025-05-13" }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              setAssetStartDate(preset.start);
                              setAssetEndDate(preset.end);
                              showToast(`📅 已切换为${preset.label}数据 (${preset.start} 至 ${preset.end})`);
                            }}
                            className={`px-1.5 py-0.5 rounded font-sans transition-colors cursor-pointer ${
                              assetStartDate === preset.start && assetEndDate === preset.end
                                ? "bg-purple-600 text-white font-extrabold"
                                : "text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
                  {[
                    "汇总数据",
                    "巨量广告",
                    "巨量千川",
                    "巨量本地推",
                    "磁力智投",
                    "磁力金牛",
                    "腾讯ADQ",
                    "TikTok",
                    "百度营销",
                    "小红书",
                    "Bilibili三连推广"
                  ].map((plat) => (
                    <button
                      key={plat}
                      onClick={() => setAssetPlatformTab(plat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        assetPlatformTab === plat
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-purple-600 hover:bg-slate-50"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>

                {/* Metrics Cards Horizontal Scrollable Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin pt-1">
                  
                  {/* 1. Sparkline Chart Card */}
                  <button
                    onClick={() => setShowSpendTrendModal(true)}
                    className="w-36 h-20 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-50 border border-purple-200 hover:border-purple-400 rounded-2xl p-2.5 shrink-0 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group text-left"
                  >
                    <div className="flex items-center justify-between w-full z-10">
                      <span className="text-[11px] font-extrabold text-purple-900">消耗曲线</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="w-full h-9 z-10 flex items-end">
                      <svg className="w-full h-full text-purple-600" viewBox="0 0 100 30" preserveAspectRatio="none">
                        <path
                          d="M 0 25 Q 15 5, 30 18 T 60 8 T 90 20 L 100 12 L 100 30 L 0 30 Z"
                          fill="rgba(147, 51, 234, 0.15)"
                        />
                        <path
                          d="M 0 25 Q 15 5, 30 18 T 60 8 T 90 20 L 100 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Metric Card Item List */}
                  {[
                    { label: "消耗", val: "¥ 566981.93", icon: "⚡", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "ROI", val: "1.58", icon: "📈", iconBg: "bg-blue-100 text-blue-600" },
                    { label: "成交金额", val: "877103.19", icon: "¥", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "智能优惠券", val: "23500.28", icon: "🎟️", iconBg: "bg-indigo-100 text-indigo-600" },
                    { label: "总成交金额", val: "900603.47", icon: "💰", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "电商平台补贴金额", val: "12450.00", icon: "🧧", iconBg: "bg-amber-100 text-amber-600" },
                    { label: "转化数", val: "11271", icon: "🎯", iconBg: "bg-blue-100 text-blue-600" },
                    { label: "转化率", val: "14.01%", icon: "📊", iconBg: "bg-emerald-100 text-emerald-600" },
                    { label: "转化成本", val: "¥ 50.3", icon: "🏷️", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "展示数", val: "7095352", icon: "👁️", iconBg: "bg-sky-100 text-sky-600" },
                    { label: "平均千次展现费用", val: "¥ 79.91", icon: "💡", iconBg: "bg-indigo-100 text-indigo-600" },
                    { label: "点击数", val: "189420", icon: "👆", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "点击率", val: "2.67%", icon: "📉", iconBg: "bg-blue-100 text-blue-600" },
                    { label: "平均点击单价", val: "2.99", icon: "💵", iconBg: "bg-emerald-100 text-emerald-600" },
                    { label: "播放量", val: "6820100", icon: "▶️", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "完播率", val: "8.45%", icon: "🎬", iconBg: "bg-indigo-100 text-indigo-600" },
                    { label: "有效播放率", val: "24.12%", icon: "🌟", iconBg: "bg-amber-100 text-amber-600" },
                    { label: "千川3S完播率", val: "45.8%", icon: "⏱️", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "净成交金额", val: "¥ 782100.00", icon: "💎", iconBg: "bg-emerald-100 text-emerald-600" },
                    { label: "净成交金额数", val: "7210", icon: "📦", iconBg: "bg-purple-100 text-purple-600" },
                    { label: "净成交ROI", val: "1.38", icon: "🚀", iconBg: "bg-blue-100 text-blue-600" },
                    { label: "净成交订单成本", val: "¥ 78.6", icon: "🏷️", iconBg: "bg-indigo-100 text-indigo-600" }
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      className="w-40 h-20 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shrink-0 flex flex-col justify-between shadow-2xs transition-all group"
                    >
                      <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight group-hover:text-purple-600 transition-colors truncate">
                        {m.val}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-500">{m.label}</span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${m.iconBg}`}>
                          {m.icon}
                        </span>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* Bottom Full-Width Section: 镜头溯源与视频关联 / 被引用后出片 */}
            {!isAdminMode && (
              <div className="reference-cards-section lg:col-span-12 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                {isMaterialMode ? (
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="text-purple-700">被引用后出片</span>
                    </h3>
                  </div>
                  <ReferencedVideosProduced hideTitle={true} hideCardWrapper={true} />
                </>
              ) : (
                <>
                  {/* Header with Tabs on Left and Edit Button on Right */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    {/* Left Tabs */}
                    <div className="flex flex-wrap items-center gap-6 text-sm font-extrabold">
                      {[
                        { id: "引用视频镜头", label: "引用视频镜头" },
                        { id: "被引用后出片", label: "被引用后出片" },
                        { id: "衍生视频", label: "衍生视频" }
                      ].map((tab) => (
                        <div key={tab.id} className="relative flex items-center gap-1">
                          <button
                            onClick={() => setShotTraceTab(tab.id as any)}
                            className={`pb-1 transition-colors cursor-pointer flex items-center gap-1 ${
                              shotTraceTab === tab.id
                                ? "text-purple-600 border-b-2 border-purple-600 font-extrabold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <span>{tab.label}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Right Action Button */}
                    <div>
                      {shotTraceTab === "引用视频镜头" && (
                        isEditingLink ? (
                          <button
                            onClick={() => {
                              setIsEditingLink(false);
                              showToast("已退出关联编辑模式");
                            }}
                            className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200/80 transition-all cursor-pointer shadow-2xs"
                          >
                            <span>退出关联视频</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsEditingLink(true);
                              showToast("✏️ 已进入编辑关联模式，可点击『关联梦畅AIGC视频』或取消关联素材");
                            }}
                            className="text-purple-600 hover:text-purple-700 font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>编辑关联视频</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Module Body: If "被引用后出片" is active, show the specialized analytics & videos component */}
                  {shotTraceTab === "衍生视频" ? (
                    <FinishedVideoDerivations source={{ id: video.id, title: titleText, coverUrl: video.coverUrl, videoUrl: video.videoUrl, author: video.author }} onDerivePush={() => { setAdDraft(undefined); setDerivePush(true); setShowAdPushWorkspace(true); }} />
                  ) : shotTraceTab === "被引用后出片" ? (
                    <ReferencedVideosProduced hideTitle={true} hideCardWrapper={true} />
                  ) : (
                    <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 flex flex-col lg:flex-row items-stretch gap-4">
                      {/* ... rest ... */}
                
                {/* Left Column: Donut Breakdown Chart & Filters */}
                <div className="w-full lg:w-[320px] shrink-0 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
                  {/* Donut Chart & Legend Display - Vertically Centered */}
                  <div className="flex-1 flex items-center justify-center gap-3 py-1 my-auto">
                    {/* SVG Donut Chart */}
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center my-auto">
                      <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="-3 -3 42 42">
                        {/* Background circle */}
                        <path
                          className="text-slate-100"
                          strokeWidth="5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {relatedBreakdown.map(item => <path key={item.id}
                          strokeWidth="5" strokeDasharray={`${item.percent}, 100`}
                          strokeDashoffset={-item.offset} stroke={item.color} fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />)}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] text-slate-400 font-bold">总时长</span>
                        <span className="text-xs font-black text-slate-800 font-mono">{relatedDuration.toFixed(1)}s</span>
                      </div>
                    </div>

                    {/* Legend List */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {relatedBreakdown.map((item, i) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600 font-medium truncate max-w-[75px]">{item.title}</span>
                            </div>
                            <span className="font-mono font-bold text-purple-700 shrink-0 ml-1">{item.durationNum.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Horizontally Scrollable Compact Video Material Cards List */}
                <div data-testid="shot-reference-list" className="flex-1 min-w-0 flex items-start gap-2.5 overflow-x-auto pb-1 scrollbar-thin pt-0.5 relative">
                  
                  {/* Dashed Add Card when in Edit Mode ("关联梦畅AIGC视频") */}
                  {isEditingLink && (
                    <button
                      onClick={() => setShowAddAigcLinkModal(true)}
                      className="reference-video-add border-2 border-dashed border-purple-400 hover:border-purple-600 bg-purple-50/40 hover:bg-purple-50 rounded-lg flex flex-col items-center justify-center p-3 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-purple-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                        <Link2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-[11px] font-extrabold text-purple-800 text-center leading-snug">
                        关联梦畅AIGC视频
                      </span>
                      <span className="text-[9px] text-purple-500/80 mt-1 text-center">
                        支持成片与素材
                      </span>
                    </button>
                  )}

                  {shotTraceMaterials.map((item) => (
                    <ReferenceVideoCard key={item.id} video={shotReferenceCard(item)} scope={item.type === "成片" ? "finished" : "materials"}
                      usageDuration={item.duration} onUnlink={isEditingLink ? () => {
                        const next = shotTraceMaterials.filter(current => current.id !== item.id);
                        if (!updateMetadata({ relatedVideos: next })) return;
                        setShotTraceMaterials(next);
                        showToast(`已取消关联该视频 (${item.code})`);
                      } : undefined} />
                  ))}

                </div>
              </div>
              )}
                </>
              )}
            </div>
            )}

          </div>

        </div>

      </div>

      {showModifyCategoryModal && <ResourceCategoryModal scope={resourceScope} initialCategory={categoryText}
        onClose={() => setShowModifyCategoryModal(false)}
        onConfirm={category => {
          if (!updateMetadata({ category })) return;
          if (category !== categoryText) addOperationLog("类目变更", categoryText, category);
          setCategoryText(category);
          setShowModifyCategoryModal(false);
          showToast(`已成功保存分类为：${category}`);
        }} />}

      {showNotesModal && (
        <ResourceEditDialog title="编辑备注" confirmLabel="保存" onClose={closeNotesEditor}
          onConfirm={handleSaveNote} disabled={notesDraft.trim() === videoNotes} onKeyDown={handleNotesKeyDown}>
          <label htmlFor="video-notes-editor" className="mb-3 block text-xs font-bold text-slate-700">视频备注</label>
          <textarea
            id="video-notes-editor"
            autoFocus
            rows={7}
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            placeholder="请输入备注"
            className="block w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </ResourceEditDialog>
      )}

      {/* 编辑标题 Modal */}
      {showModifyTitleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">编辑标题</h3>
              </div>
              <button
                onClick={() => setShowModifyTitleModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center">
                  <span className="text-rose-500 font-bold mr-1">*</span>
                  <span>标题</span>
                </label>
                <input
                  type="text"
                  value={tempTitleText}
                  onChange={(e) => setTempTitleText(e.target.value)}
                  placeholder="请输入标题"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 rounded-xl text-xs font-medium text-slate-800 transition-all focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowModifyTitleModal(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const newTitle = tempTitleText.trim();
                  if (newTitle && newTitle !== titleText) {
                    addOperationLog("修改标题", titleText, newTitle);
                    setTitleText(newTitle);
                    showToast(`✅ 已成功修改视频标题为：${newTitle}`);
                  }
                  setShowModifyTitleModal(false);
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关联脚本 Modal */}
      {showRelatedScriptsModal && (
        <OverlayPortal role="dialog" aria-modal="true" aria-label="关联脚本" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">关联脚本</h3>
              </div>
              <button
                onClick={() => setShowRelatedScriptsModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Top Action Button */}
              <div>
                <button
                  onClick={() => setShowAddScriptModal(true)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>关联脚本</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="py-3.5 px-4 font-bold text-slate-600">脚本标题</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600">脚本模板</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600">标签</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-center">状态</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600">发布人</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600">发布时间</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associatedScripts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          暂未关联任何脚本，点击上方“关联脚本”按钮进行关联
                        </td>
                      </tr>
                    ) : (
                      associatedScripts.map((scr) => (
                        <tr key={scr.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {scr.title}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {scr.template}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-sky-100 text-sky-700 font-normal px-2.5 py-0.5 rounded-md text-[11px] inline-block">
                              {scr.tag}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-amber-500 text-white font-bold px-2 py-0.5 rounded text-xs inline-block shadow-2xs">
                              {scr.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {scr.publisher}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {scr.publishTime}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setSelectedScriptDetail(scr);
                                  setShowScriptDetailModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-800 font-medium cursor-pointer hover:underline"
                              >
                                详情
                              </button>
                              <button
                                onClick={() => {
                                  const next = associatedScripts.filter(s => s.id !== scr.id);
                                  if (!updateMetadata({ associatedScripts: next })) return;
                                  setAssociatedScripts(next);
                                  showToast(`已取消关联脚本《${scr.title}》`);
                                }}
                                className="text-purple-600 hover:text-purple-800 font-medium cursor-pointer hover:underline"
                              >
                                取消关联
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowRelatedScriptsModal(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  showToast("✅ 已保存关联脚本配置");
                  setShowRelatedScriptsModal(false);
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* 选择关联新脚本 Modal */}
      <LinkScriptModal
        isOpen={showAddScriptModal}
        onClose={() => setShowAddScriptModal(false)}
        onConfirm={(selected) => {
          const chosen = Array.isArray(selected) ? selected[0] : selected;
          if (chosen) {
            const next = appendById(associatedScripts, [{
              id: chosen.id, title: chosen.title, template: chosen.template || "通用模板",
              tag: chosen.tags?.[0] || "", status: chosen.status || "待审核",
              publisher: chosen.publisher || "", publishTime: chosen.publishTime || new Date().toLocaleString(),
            }]);
            if (!updateMetadata({ associatedScripts: next })) return false;
            setAssociatedScripts(next);
            showToast(`✅ 已关联脚本《${chosen.title}》`);
          }
        }}
      />

      {/* 脚本详情 Modal */}
      {showScriptDetailModal && selectedScriptDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">脚本详情 - {selectedScriptDetail.title}</h3>
              </div>
              <button
                onClick={() => setShowScriptDetailModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div><span className="text-slate-400">脚本标题: </span><span className="font-bold text-slate-800">{selectedScriptDetail.title}</span></div>
                <div><span className="text-slate-400">模板类型: </span><span className="font-medium text-purple-700">{selectedScriptDetail.template}</span></div>
                <div><span className="text-slate-400">发布人: </span><span className="text-slate-700">{selectedScriptDetail.publisher}</span></div>
                <div><span className="text-slate-400">发布时间: </span><span className="font-mono text-slate-600">{selectedScriptDetail.publishTime}</span></div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>分镜脚本拆解内容</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="p-3 bg-white">
                    <div className="font-bold text-purple-900 mb-1">【镜头 1】3秒强勾子</div>
                    <p className="text-slate-600 leading-relaxed">画面：近景展示产品特写，配合快速反转画面与字幕冲击。</p>
                    <p className="text-purple-700 font-medium mt-1">口播：还在为了选择分类发愁？看看这个绝密技巧！</p>
                  </div>
                  <div className="p-3 bg-white">
                    <div className="font-bold text-purple-900 mb-1">【镜头 2】核心卖点痛点展示</div>
                    <p className="text-slate-600 leading-relaxed">画面：模特实际试用使用，展示前后强烈差异效果。</p>
                    <p className="text-purple-700 font-medium mt-1">口播：质地细腻清凉，一抹即化，轻松拿捏全场。</p>
                  </div>
                  <div className="p-3 bg-white">
                    <div className="font-bold text-purple-900 mb-1">【镜头 3】行动召唤CTA</div>
                    <p className="text-slate-600 leading-relaxed">画面：左下角弹窗指引点击购买，右侧高亮优惠力度。</p>
                    <p className="text-purple-700 font-medium mt-1">口播：点击下方链接，限量优惠先到先得！</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowScriptDetailModal(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showPersonalTagModal && <ResourceTagModal kind="personal" initialTags={personalTags}
        showToast={showToast} onClose={() => setShowPersonalTagModal(false)}
        onConfirm={tags => {
          if (!updateMetadata({ personalTags: tags })) return false;
          addOperationLog("修改个人标签", personalTags.join(", ") || "无", tags.join(", ") || "无");
          setPersonalTags(tags);
          showToast("已同步个人标签设置");
        }} />}
      {showPublicTagModal && <ResourceTagModal kind="public" initialTags={publicTags}
        showToast={showToast} onClose={() => setShowPublicTagModal(false)}
        onConfirm={tags => {
          if (!updateMetadata({ tags })) return false;
          addOperationLog("修改公共标签", publicTags.join(", ") || "无", tags.join(", ") || "无");
          setPublicTags(tags);
          showToast("已同步公共标签设置");
        }} />}

      {/* 操作记录 Modal */}
      {showOperationLogsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{resourceName}操作记录</h3>
                <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  共 {operationLogs.length} 条记录
                </span>
              </div>
              <button
                onClick={() => setShowOperationLogsModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="搜索操作人或关键词..."
                  value={operationLogSearch}
                  onChange={(e) => {
                    setOperationLogSearch(e.target.value);
                    setOperationLogPage(1);
                  }}
                  className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">事项筛选:</span>
                <select
                  value={operationLogTypeFilter}
                  onChange={(e) => {
                    setOperationLogTypeFilter(e.target.value);
                    setOperationLogPage(1);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="all">全部事项</option>
                  <option value="修改标题">修改标题</option>
                  <option value="修改公共标签">修改公共标签</option>
                  <option value="修改个人标签">修改个人标签</option>
                  <option value="修改备注">修改备注</option>
                  <option value="修改状态">修改状态</option>
                  <option value="系统生成">系统生成</option>
                </select>
              </div>
            </div>

            {/* Log Table Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const filtered = operationLogs.filter(log => {
                  const matchSearch = log.operator.includes(operationLogSearch) ||
                    log.actionType.includes(operationLogSearch) ||
                    log.beforeValue.includes(operationLogSearch) ||
                    log.afterValue.includes(operationLogSearch);
                  const matchType = operationLogTypeFilter === "all" || log.actionType === operationLogTypeFilter;
                  return matchSearch && matchType;
                });
                const currentPage = Math.min(
                  operationLogPage,
                  Math.max(1, Math.ceil(filtered.length / operationLogPageSize))
                );
                const pagedLogs = filtered.slice(
                  (currentPage - 1) * operationLogPageSize,
                  currentPage * operationLogPageSize
                );

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium">
                      暂无符合条件的操作记录
                    </div>
                  );
                }

                return (
                  <>
                  <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                          <th className="py-3.5 px-4">操作时间</th>
                          <th className="py-3.5 px-4">操作人</th>
                          <th className="py-3.5 px-4">操作事项</th>
                          <th className="py-3.5 px-4">变更摘要</th>
                          <th className="py-3.5 px-4 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {pagedLogs.map((log) => {
                          const actionColor =
                            log.actionType === "修改备注" ? "bg-purple-50 text-purple-700 border-purple-200" :
                            log.actionType === "修改标题" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            log.actionType === "修改状态" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            log.actionType === "修改公共标签" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            log.actionType === "修改个人标签" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            "bg-slate-100 text-slate-700 border-slate-200";

                          return (
                            <tr key={log.id} className="hover:bg-purple-50/30 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                                {log.timestamp}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">
                                {log.operator}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${actionColor}`}>
                                  {log.actionType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                                <span className="text-slate-400 font-normal">修改后: </span>
                                <span className="font-medium text-slate-800">{log.afterValue}</span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedLogDetail(log)}
                                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-purple-200/60 inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>详情</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <AssetPagination
                    total={filtered.length}
                    page={currentPage}
                    pageSize={operationLogPageSize}
                    onPageChange={setOperationLogPage}
                    onPageSizeChange={(value) => {
                      setOperationLogPageSize(value);
                      setOperationLogPage(1);
                    }}
                  />
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowOperationLogsModal(false)}
                className="px-5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改过程 详情 Sub-Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">操作记录详情</h3>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Meta Info */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block mb-0.5">操作事项</span>
                  <span className="font-extrabold text-purple-700">{selectedLogDetail.actionType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">操作人</span>
                  <span className="font-bold text-slate-800">{selectedLogDetail.operator}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">操作时间</span>
                  <span className="font-mono text-slate-700">{selectedLogDetail.timestamp}</span>
                </div>
              </div>

              {/* Before vs After Comparison */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  <span>修改前后过程对比</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 修改前 */}
                  <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        修改前 (Before)
                      </span>
                    </div>
                    <div className="p-3 bg-white/90 rounded-lg border border-rose-100 text-slate-700 font-sans leading-relaxed whitespace-pre-wrap min-h-[90px] text-xs">
                      {selectedLogDetail.beforeValue}
                    </div>
                  </div>

                  {/* 修改后 */}
                  <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        修改后 (After)
                      </span>
                    </div>
                    <div className="p-3 bg-white/90 rounded-lg border border-emerald-100 text-slate-800 font-sans leading-relaxed font-medium whitespace-pre-wrap min-h-[90px] text-xs">
                      {selectedLogDetail.afterValue}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加帧亮点复盘 Modal */}
      {showAddReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full" />
                <h3 className="text-sm font-extrabold text-slate-900">添加帧亮点复盘</h3>
              </div>
              <button
                onClick={() => setShowAddReviewModal(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">定位时间 (秒)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={Math.floor(duration || 100)}
                    value={newReviewSec}
                    onChange={(e) => setNewReviewSec(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <span className="text-slate-500 font-bold shrink-0">
                    ({Math.floor(newReviewSec / 60)}分{newReviewSec % 60}秒)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">复盘标签</label>
                <select
                  value={newReviewTag}
                  onChange={(e) => setNewReviewTag(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="优质画面">优质画面</option>
                  <option value="爆点金句">爆点金句</option>
                  <option value="高转化诱导">高转化诱导</option>
                  <option value="黄金Hook">黄金Hook</option>
                  <option value="痛点共鸣">痛点共鸣</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">归属公司 / 主体</label>
                <input
                  type="text"
                  value={newReviewCompany}
                  onChange={(e) => setNewReviewCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="例如：纯朴科技"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">复盘分析描述</label>
                <textarea
                  rows={3}
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  placeholder="例如：“二次清洁”提高用户点击和评论..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none font-medium"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddReviewModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newReviewTitle.trim()) return;
                  const newItem: AnalyticsReviewItem = {
                    id: `ar_${Date.now()}`,
                    tag: newReviewTag,
                    timestampSec: newReviewSec,
                    timeLabel: `${Math.floor(newReviewSec / 60)}分${newReviewSec % 60}秒`,
                    company: newReviewCompany || "纯朴科技",
                    title: newReviewTitle,
                    date: new Date().toLocaleDateString("zh-CN") + " " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&h=120&fit=crop"
                  };
                  setAnalyticsReviews(prev => [newItem, ...prev]);
                  setShowAddReviewModal(false);
                  setNewReviewTitle("");
                  showToast("🎉 复盘节点已成功添加到列表");
                }}
                disabled={!newReviewTitle.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 上传工程文件 Modal */}
      {showUploadProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full" />
                <h3 className="text-sm font-extrabold text-slate-900">上传剪映 / CapCut 工程文件</h3>
              </div>
              <button
                onClick={() => setShowUploadProjectModal(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">工程文件名称</label>
                <input
                  type="text"
                  value={uploadProjectName}
                  onChange={(e) => setUploadProjectName(e.target.value)}
                  placeholder="例如：10.6子涵酒吧1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Folder Selector Zone */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">选择剪映工程目录 (.draft / .zip)</label>
                <div
                  onClick={() => {
                    const mockPath = `C:\\Users\\Admin\\AppData\\Local\\JianyingPro\\User Data\\Projects\\com.lveditor.draft\\${uploadProjectName || "10.6子涵酒吧1"}`;
                    setUploadSelectedFolder(mockPath);
                    showToast("📂 已定位并选中剪映本地工程目录");
                  }}
                  className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
                    uploadSelectedFolder
                      ? "bg-purple-50/60 border-purple-400 text-purple-900"
                      : "bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-600"
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto shadow-2xs">
                    <Folder className="w-5 h-5 text-purple-600" />
                  </div>
                  {uploadSelectedFolder ? (
                    <div>
                      <p className="font-extrabold text-purple-900 text-xs">已选中剪映工程文件夹</p>
                      <p className="text-[10px] text-purple-700 font-mono mt-0.5 break-all">{uploadSelectedFolder}</p>
                      <span className="inline-block mt-2 text-[10px] bg-purple-200/60 text-purple-900 px-2 py-0.5 rounded-md font-bold">
                        解析到 8 个轨线及完整卡点 keyframe
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-800">点击打开【剪映工程目录】选择文件</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">支持自动读取本地 /JianyingPro Drafts 工程文件包</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visibility Permission */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">开放访问权限</label>
                  <select
                    value={uploadProjectVisibility}
                    onChange={(e) => setUploadProjectVisibility(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="公开">公开 (全公司员工可下载)</option>
                    <option value="仅本部门">仅本部门 (指定分组共享)</option>
                    <option value="私密">私密 (仅作者与管理员)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">上传作者/剪辑师</label>
                  <input
                    type="text"
                    value={uploadProjectEditor}
                    onChange={(e) => setUploadProjectEditor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1 font-medium">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>内网共享提醒</span>
                </p>
                <p className="text-amber-800 leading-tight">
                  工程文件上传后，获得权限的同事即可下载该视频的所有剪辑轨道，直接在剪映中微调素材进行复用产出。
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowUploadProjectModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!uploadProjectName.trim()) {
                    showToast("⚠️ 请输入工程文件名称");
                    return;
                  }
                  setIsUploadingProject(true);
                  setTimeout(() => {
                    const newItem: ProjectFileItem = {
                      id: `pf_${Date.now()}`,
                      name: uploadProjectName,
                      uploadTime: new Date().toISOString().split("T")[0],
                      size: "52.4 MB",
                      thumbnail: video.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
                      visibility: uploadProjectVisibility,
                      editorName: uploadProjectEditor || "刘怡晴",
                      tracksCount: uploadProjectTracks,
                      software: "剪映 Pro 草稿工程包"
                    };
                    setProjectFiles(prev => [newItem, ...prev]);
                    setIsUploadingProject(false);
                    setShowUploadProjectModal(false);
                    showToast(`🎉 工程文件【${uploadProjectName}】上传成功，已保存至内网工程库！`);
                  }, 800);
                }}
                disabled={isUploadingProject}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isUploadingProject ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>上传中...</span>
                  </>
                ) : (
                  <span>确认上传</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 常见问题 (Project Files FAQ) Modal */}
      {showProjectFaqModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">工程文件常见问题</h3>
              </div>
              <button
                onClick={() => setShowProjectFaqModal(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              {/* Question 1 */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                  1、工程文件无法上传
                </h4>
                <ul className="text-slate-600 text-[11px] leading-relaxed pl-3.5 space-y-1 list-disc list-inside">
                  <li>工程体积是否过大超过2G，体积过大浏览器资源不足会上传失败</li>
                </ul>
              </div>

              {/* Question 2 */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                  2、工程下载后在剪映打开会丢失片段
                </h4>
                <ul className="text-slate-600 text-[11px] leading-relaxed pl-3.5 space-y-1 list-disc list-inside">
                  <li>复制到剪映的插件没有正常打开连接</li>
                  <li>工程内使用的是本地文件，只有复制过去的云管家素材能共享，本地文件会丢失</li>
                  <li>素材是复制到剪映的文件，但是是在剪辑时有做出预设/复合片段</li>
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProjectFaqModal(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: 消耗曲线 (Dual Metric Trend Modal - Matches User Screenshots 1, 2, 3) */}
      {showSpendTrendModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[140] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="text-sm font-extrabold text-purple-600 tracking-tight">消耗曲线</h3>
              
              <div className="flex items-center gap-3">
                {/* Left Axis Metric Selector (Purple) */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                  <span className="w-3 h-3 bg-purple-600 rounded-xs shrink-0" />
                  <select
                    value={trendMetric1}
                    onChange={(e) => setTrendMetric1(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1 text-xs"
                  >
                    {[
                      "消耗", "ROI", "成交金额", "智能优惠券", "转化数", "转化率", "转化成本",
                      "展示数", "平均千次展现费用", "点击数", "点击率", "平均点击单价",
                      "播放量", "完播率", "有效播放率", "净成交金额", "净成交ROI"
                    ].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Right Axis Metric Selector (Blue) */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                  <span className="w-3 h-3 bg-blue-500 rounded-xs shrink-0" />
                  <select
                    value={trendMetric2}
                    onChange={(e) => setTrendMetric2(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1 text-xs"
                  >
                    {[
                      "消耗", "ROI", "成交金额", "智能优惠券", "转化数", "转化率", "转化成本",
                      "展示数", "平均千次展现费用", "点击数", "点击率", "平均点击单价",
                      "播放量", "完播率", "有效播放率", "净成交金额", "净成交ROI"
                    ].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowSpendTrendModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Interactive Dual-Axis Recharts Chart */}
            <div className="p-6 bg-white">
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={SPEND_TREND_CHART_DATA} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="trendColorMetric1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="trendColorMetric2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const m1Obj = payload.find(p => p.dataKey === trendMetric1);
                          const m2Obj = payload.find(p => p.dataKey === trendMetric2);
                          const m1Val = m1Obj ? m1Obj.value : undefined;
                          const m2Val = m2Obj ? m2Obj.value : undefined;
                          
                          const hasCurrency1 = ["消耗", "转化成本", "平均千次展现费用", "净成交金额", "净成交订单成本"].includes(trendMetric1);
                          const hasCurrency2 = ["消耗", "转化成本", "平均千次展现费用", "净成交金额", "净成交订单成本"].includes(trendMetric2);

                          return (
                            <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-200 text-xs font-medium space-y-1.5 min-w-36">
                              <p className="text-slate-400 text-[11px] font-mono">{label}</p>
                              {m1Val !== undefined && (
                                <div className="flex items-center justify-between gap-3 text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                                    <span className="font-bold">{trendMetric1}</span>
                                  </div>
                                  <span className="font-mono text-purple-700 font-bold">
                                    {hasCurrency1 ? "¥ " : ""}{m1Val}
                                  </span>
                                </div>
                              )}
                              {m2Val !== undefined && (
                                <div className="flex items-center justify-between gap-3 text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="font-bold">{trendMetric2}</span>
                                  </div>
                                  <span className="font-mono text-blue-700 font-bold">
                                    {hasCurrency2 ? "¥ " : ""}{m2Val}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey={trendMetric1}
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#trendColorMetric1)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey={trendMetric2}
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#trendColorMetric2)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddAigcLinkModal && (
        <VideoResourcePickerModal
          items={availableAigcVideos}
          initialSelectedIds={shotTraceMaterials.map((item) => item.id)}
          initialSection="成片"
          onClose={() => setShowAddAigcLinkModal(false)}
          onConfirm={selectedVideos => {
            const next = selectedVideos.map(item => shotTraceMaterials.find(current => current.id === item.id) || toRelatedVideo(item));
            if (!updateMetadata({ relatedVideos: next })) return;
            setShotTraceMaterials(next);
            setShowAddAigcLinkModal(false);
            showToast(`已更新关联视频，共 ${next.length} 项`);
          }}
        />
      )}

      {showDeriveDialog && canUseDerivations(getAdActor()) && <DeriveVideoDialog
        activeCount={activeDerivationCount(getAdActor().id) + activeAdDerivationCount(adStore.records, getAdActor().id)}
        onClose={() => setShowDeriveDialog(false)} onConfirm={count => {
          const actor = getAdActor();
          if (!canUseDerivations(actor)) throw new Error("暂无衍生视频权限");
          const task = submitDerivation(video.id, count, actor.id, activeAdDerivationCount(readAdStore().records, actor.id), { id: video.id, title: titleText, coverUrl: video.coverUrl, videoUrl: video.videoUrl });
          setDerivationTaskId(task.id); setShowDeriveDialog(false); setShotTraceTab("衍生视频"); setToastMsg(`已提交 ${count} 个视频的衍生任务`);
        }} />}
      {showAdPushWorkspace && (!(derivePush || repushDerivativeId) || canUseDerivations(getAdActor())) && (
        <AdAccountPushWorkspace
          deriveMode={derivePush}
          video={repushDerivative ? derivationVideo(repushDerivative) : { id: video.id, title: titleText, coverUrl: video.coverUrl, videoUrl: video.videoUrl, author: video.author }}
          initialDraft={adDraft}
          onClose={() => setShowAdPushWorkspace(false)}
          onCreate={handleCreateAdPushTask}
        />
      )}

      {showPushRecordsModal && (
        <PushRecordsModal
          records={adStore.records}
          videoId={video.id}
          onEdit={(draft, record) => {
            if (record?.derivativeId && (!canUseDerivations(getAdActor()) || derivationOutput(record.derivativeId)?.status !== "成功")) {
              setToastMsg("衍生文件尚不可用或无操作权限"); return;
            }
            setRepushDerivativeId(record?.derivativeId || null);
            setDerivePush(false); setAdDraft({ ...draft, derivation: undefined }); setShowPushRecordsModal(false); setShowAdPushWorkspace(true);
          }}
          onClose={() => setShowPushRecordsModal(false)}
        />
      )}

    </div>
  );
}
