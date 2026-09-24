import React, { useEffect, useMemo, useRef, useState } from "react";
import UploadFinishedVideoModal from "./UploadFinishedVideoModal";
import {
  AlertCircle,
  AtSign,
  AudioLines,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Combine,
  Copy,
  Download,
  Ellipsis,
  Film,
  FileSearch,
  FolderOpen,
  History,
  Image as ImageIcon,
  Languages,
  Loader2,
  Mic2,
  Package,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Video,
  Maximize,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Asset, Task } from "../types";
import type { FinishedVideo } from "../data/finishedVideos";
import { INITIAL_THIRD_PARTY } from "../data/thirdPartyVideos";
import { toPublishedVideo } from "../lib/publishedVideo";
import { useUploadedResources } from "../lib/resourceUploads";
import { useThirdPartyLifecycle } from "../lib/thirdPartyLifecycle";
import { useResourceEdits } from "../lib/useResourceEdits";
import { useTaggedResources } from "../lib/useResourceTags";
import { parseVideoCategory } from "../lib/videoCategories";
import AssetPagination from "./AssetPagination";
import PrimaryGenerationButton from "./PrimaryGenerationButton";
import ViralInspirationGallery from "./ViralInspirationGallery";
import AnchoredPopover from "./overlays/AnchoredPopover";
import OverlayPortal from "./overlays/OverlayPortal";

type Step = "source" | "subjects" | "storyboard" | "final";
type SubjectType = "person" | "scene" | "product";
type GenerationStatus = "pending" | "generating" | "completed" | "failed";
type SubjectImageTarget = "original" | "candidate" | "reference";
type VideoRatio = "16:9" | "4:3" | "3:4" | "9:16" | "21:9";
type VideoResolution = "480p" | "720p" | "1080p" | "4K";
type SubjectImageModel = "Doubao-Seedream-5.0-Pro" | "Doubao-Seedream-5.0-lite" | "Doubao-Seedream-4.5" | "VisionGenesis" | "旗舰 Pro";
type SubjectImageCount = 1 | 2 | 4 | 9;
type SubjectImageResolution = "1k" | "2k" | "4k";
type SubjectImageRatio = "1:1" | "3:2" | "2:3" | "3:4" | "4:3" | "4:5" | "5:4" | "16:9" | "9:16" | "21:9";
type SubjectImageQuality = "Low" | "Medium" | "High";
type StoryboardVideoFormat = "mp4" | "mov";

interface SubjectGenerationConfig {
  model: SubjectImageModel;
  count: SubjectImageCount;
  resolution: SubjectImageResolution;
  ratio: SubjectImageRatio;
  quality: SubjectImageQuality;
  cost: number;
}

export interface SourceVideo {
  id: string;
  name: string;
  url: string;
  cover: string;
  size: string;
  duration: string;
  section: "成片" | "素材" | "第三方" | "本地上传";
}

interface CandidateImage {
  id: string;
  name: string;
  image: string;
  source: "AI生成" | "图片管理" | "本地上传";
}

interface ImageLibraryItem {
  candidate: CandidateImage;
  primaryCategory: string;
  secondaryCategory: string;
  tags: string[];
  status: string;
  author: string;
  resolution: string;
  size: string;
}

interface RemakeVoice {
  id: string;
  name: string;
  description: string;
}

interface RemakeSubject {
  id: string;
  type: SubjectType;
  name: string;
  prompt: string;
  originalImage: string;
  originalName: string;
  replacementName?: string;
  candidates: CandidateImage[];
  referenceImages?: CandidateImage[];
  selectedCandidateId?: string;
  voices?: RemakeVoice[];
  activeVoiceId?: string;
}

interface StoryboardShot {
  id: string;
  title: string;
  duration: number;
  description: string;
  manuallyAdded?: boolean;
  dialogue: string;
  subjectIds: string[];
  status: GenerationStatus;
  progress: number;
  cover?: string;
  failureReason?: string;
  referenceImages?: CandidateImage[];
  resolution?: Exclude<VideoResolution, "4K">;
  format?: StoryboardVideoFormat;
  versions?: StoryboardVideoVersion[];
  currentVersionId?: string;
}

interface StoryboardVideoVersion {
  id: string;
  cover: string;
  createdAt: number;
}

interface SavedRemakeState {
  step: Step;
  source: SourceVideo | null;
  language: string;
  videoRatio: VideoRatio;
  resolution: VideoResolution;
  projectName: string;
  subjects: RemakeSubject[];
  shots: StoryboardShot[];
  selectedSubjectId: string | null;
  selectedShotId: string | null;
  finalStatus: GenerationStatus;
  finalProgress: number;
  finalName: string;
  spentCredits: number;
  videoFailureShown: boolean;
  backgroundOperation: { key: string; label: string; progress: number } | null;
}

interface VideoRemakeViewProps {
  onBack: () => void;
  onOpenQueue: () => void;
  credits: number;
  assets: Asset[];
  activeSessionId: string | null;
  activeTask?: Task;
  initialSource?: SourceVideo;
  onSessionChange: (sessionId: string) => void;
  onSyncTask: (task: Task, creditsCharge?: number) => void;
  onUploadVideos: (videos: Array<{ name: string; cover: string }>) => void;
}

const ORIGINAL_PERSON = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
const ORIGINAL_PERSON_2 = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80";
const ORIGINAL_PERSON_3 = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80";
const ORIGINAL_PERSON_4 = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop&q=80";
const ORIGINAL_PERSON_5 = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80";
const ORIGINAL_PERSON_6 = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80";
const ORIGINAL_SCENE = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80";
const ORIGINAL_SCENE_2 = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80";
const ORIGINAL_PRODUCT = "./assets/prototype/skincare-product.jpg";
const ORIGINAL_PROP = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80";

const CHARACTER_GENERATION_PROMPT = `- 任务：完成角色的上半身正面平视特写和该角色的全身三视图，左边是角色的上半身正面平视特写，右边是该角色的全身三视图。三视图不可以有分割线，比例是 16:9，左侧为角色胸部以上特写大图，占画面约 40% 宽度，用于展示面部、发型、表情、眼神、上半身服装和配饰细节，右侧为同一角色的三视图，占画面约 60% 宽度，依次展示正面全身、侧面全身、背面全身。
- 时代基底：现代
- 国家：中国
- 人种：亚洲人（中国人）
- 性别：女
- 年龄：青年
- 脸型：偏圆润的鹅蛋脸，眉形为自然的平直粗眉，双眼皮杏眼，鼻梁挺直线条柔和，嘴唇厚度适中唇线清晰，下颌线圆润流畅，颧骨平缓不突出，面颊分布浅淡零星晒斑，整体面容清秀耐看，无过度修饰痕迹
- 发型：自然深黑色头发，额前散落细碎轻薄的刘海修饰额头，两侧耳前取少量头发编做两根细麻花辫，剩余头发在脑后扎成利落的低马尾，发际线处有自然的绒碎发，整体造型清爽不拖沓，方便劳作行动
- 耳饰：无
- 身材：体型偏瘦但结实紧致，肩背挺直不佝偻，带有常年劳作养成的利落感，体态舒展大方不扭捏，身高约162厘米，站姿稳当，透着不服输的韧劲
- 头身比：写实7头身，符合普通劳动青年女性的真实形象定位，无夸张超模比例，接地气有真实感
- 上身着装：藏青色加厚磨毛劳动布工装夹克，立领设计，门襟配做旧铜色按扣，肩部与手肘处缝有同色系稍浅的耐磨帆布补丁，两侧设带翻盖的大容量贴袋方便收纳小物件，内里夹薄棉兼顾保暖，面料洗得略带软旧感但干净平整，袖口配有可调节松紧的布袢，无多余花哨装饰，利落耐穿适配奔波劳作的需求
- 下身着装：深炭灰色重磅斜纹棉直筒工装裤，裤型宽松不紧绷方便大幅度活动，裤脚做微收设计，膝盖处拼接双层耐磨布料，腰侧配有可调节松紧的布袢，面料洗得略有泛白但整洁无污渍，无夸张logo与装饰，结实耐穿适配四处奔波谋生计的状态
- 鞋子：洗得略微泛白的黑色帆布劳保鞋，鞋头有黑色橡胶防撞包边，配防滑厚橡胶底，鞋带系得整齐服帖，鞋边刷得干净无泥污，结实跟脚适合长时间行走赶路，与整体实用利落的造型风格呼应`;

const SUBJECT_IMAGE_MODELS: SubjectImageModel[] = ["Doubao-Seedream-5.0-Pro", "Doubao-Seedream-5.0-lite", "Doubao-Seedream-4.5", "VisionGenesis", "旗舰 Pro"];
const SUBJECT_IMAGE_COUNTS: SubjectImageCount[] = [1, 2, 4, 9];
const SUBJECT_IMAGE_RATIOS: SubjectImageRatio[] = ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "16:9", "9:16", "21:9"];
const SUBJECT_IMAGE_QUALITIES: SubjectImageQuality[] = ["Low", "Medium", "High"];

const subjectImageCost = (model: SubjectImageModel, count: SubjectImageCount, resolution: SubjectImageResolution, quality: SubjectImageQuality) => {
  if (model === "Doubao-Seedream-5.0-Pro") return count * (resolution === "2k" ? 60 : 30);
  if (model === "Doubao-Seedream-5.0-lite") return count * 22;
  if (model === "Doubao-Seedream-4.5") return count * 25;
  if (model === "旗舰 Pro") return count * (resolution === "4k" ? 244 : 136);
  const visionCosts: Record<SubjectImageResolution, Record<SubjectImageQuality, number>> = {
    "1k": { Low: 18, Medium: 84, High: 310 },
    "2k": { Low: 26, Medium: 122, High: 449 },
    "4k": { Low: 42, Medium: 198, High: 728 },
  };
  return count * visionCosts[resolution][quality];
};

const GENERATED_IMAGES: Record<SubjectType, string[]> = {
  person: [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=700&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80",
  ],
  scene: [
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&auto=format&fit=crop&q=80",
  ],
  product: [
    "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=700&auto=format&fit=crop&q=80",
    "./assets/prototype/luxury-skincare-set.jpg",
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=700&auto=format&fit=crop&q=80",
  ],
};

const VIDEO_COVERS = [
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=700&auto=format&fit=crop&q=80",
];

const STORYBOARD_GENERATION_COST = 10;
const STORYBOARD_VIDEO_MODELS = ["Doubao-Seedance-2.5", "Doubao-Seedance-2.0-Pro", "Vidu-Q2"] as const;
const STORYBOARD_MAX_DURATIONS = [15, 20, 30] as const;

const IMAGE_PICKER_SAMPLES: ImageLibraryItem[] = [
  { candidate: { id: "lib-img-01", name: "精华空瓶商品主体.png", image: "./assets/prototype/skincare-product.jpg", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "商品主图", tags: ["产品名称", "白底图"], status: "已通过", author: "徐振", resolution: "1200x800", size: "1.2 MB" },
  { candidate: { id: "lib-img-02", name: "防晒乳柔光展示图.jpg", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "商品主图", tags: ["防晒", "柔光"], status: "已通过", author: "汤小真", resolution: "1080x1440", size: "1.8 MB" },
  { candidate: { id: "lib-img-03", name: "洁面乳成分展示图.jpg", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "成分展示", tags: ["洁面", "成分党"], status: "已通过", author: "徐振", resolution: "1200x1600", size: "2.1 MB" },
  { candidate: { id: "lib-img-04", name: "草本护肤套装俯拍图.jpg", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "套装展示", tags: ["草本", "套装"], status: "待审核", author: "美妆设计组", resolution: "1600x1067", size: "3.4 MB" },
  { candidate: { id: "lib-img-05", name: "美妆产品桌面陈列图.jpg", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "场景展示", tags: ["桌面陈列", "产品实拍"], status: "已通过", author: "刘弯", resolution: "1440x960", size: "2.7 MB" },
  { candidate: { id: "lib-img-06", name: "彩妆礼盒组合展示图.jpg", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "礼盒套装", tags: ["礼盒", "促销"], status: "已通过", author: "汤小真", resolution: "1200x1200", size: "2.3 MB" },
  { candidate: { id: "lib-img-07", name: "高端护肤套装主视觉.jpg", image: "./assets/prototype/luxury-skincare-set.jpg", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "商品场景图", tags: ["高端质感", "套装"], status: "未审核", author: "徐振", resolution: "1200x1600", size: "2.0 MB" },
  { candidate: { id: "lib-img-08", name: "精华液瓶身特写图.jpg", image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "商品特写", tags: ["精华液", "瓶身"], status: "已通过", author: "美妆设计组", resolution: "1200x1600", size: "2.6 MB" },
  { candidate: { id: "lib-img-09", name: "补水精华静物图.jpg", image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "商品主图", tags: ["补水", "静物"], status: "已通过", author: "汤小真", resolution: "1080x1440", size: "1.9 MB" },
  { candidate: { id: "lib-img-10", name: "护肤瓶罐组合图.jpg", image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "套装展示", tags: ["瓶罐", "组合"], status: "待审核", author: "刘弯", resolution: "1200x800", size: "2.4 MB" },
  { candidate: { id: "lib-img-11", name: "彩妆工具促销展示图.jpg", image: "./assets/prototype/beauty-promo-detail.jpg", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "宣发主图", tags: ["彩妆", "活动促销"], status: "已通过", author: "徐振", resolution: "1200x1600", size: "3.1 MB" },
  { candidate: { id: "lib-img-12", name: "智能腕表黑色商品图.jpg", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "数码家电", secondaryCategory: "智能穿戴", tags: ["腕表", "黑色"], status: "已通过", author: "赵铁柱", resolution: "1200x1200", size: "1.5 MB" },
  { candidate: { id: "lib-img-13", name: "无线耳机产品主图.jpg", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "数码家电", secondaryCategory: "影音设备", tags: ["耳机", "产品实拍"], status: "已通过", author: "赵铁柱", resolution: "1200x800", size: "1.7 MB" },
  { candidate: { id: "lib-img-14", name: "运动鞋侧面展示图.jpg", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "服饰内衣", secondaryCategory: "鞋靴", tags: ["运动", "商品主图"], status: "已通过", author: "梁浩然", resolution: "1200x800", size: "1.6 MB" },
  { candidate: { id: "lib-img-15", name: "通勤风衣模特展示图.jpg", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "服饰内衣", secondaryCategory: "模特展示", tags: ["通勤", "风衣"], status: "待审核", author: "梁浩然", resolution: "1080x1440", size: "2.8 MB" },
  { candidate: { id: "lib-img-16", name: "复古耳环材质特写.jpg", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "服饰内衣", secondaryCategory: "配饰", tags: ["耳环", "高端质感"], status: "已通过", author: "刘弯", resolution: "1200x1200", size: "2.2 MB" },
  { candidate: { id: "lib-img-17", name: "不粘锅使用场景图.jpg", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "日用百货", secondaryCategory: "厨房用品", tags: ["不粘锅", "使用过程"], status: "已通过", author: "赵铁柱", resolution: "1440x960", size: "3.0 MB" },
  { candidate: { id: "lib-img-18", name: "夏日穿搭街拍图.jpg", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "服饰内衣", secondaryCategory: "场景展示", tags: ["街拍", "夏日"], status: "未审核", author: "汤小真", resolution: "1080x1440", size: "2.5 MB" },
  { candidate: { id: "lib-img-19", name: "植物成分原料展示图.jpg", image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "美妆护肤", secondaryCategory: "成分展示", tags: ["植物提取", "原料"], status: "已通过", author: "美妆设计组", resolution: "1200x800", size: "2.0 MB" },
  { candidate: { id: "lib-img-20", name: "清新茶饮静物展示图.jpg", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80", source: "图片管理" }, primaryCategory: "食品饮料", secondaryCategory: "茶饮", tags: ["清新", "产品实拍"], status: "已通过", author: "徐振", resolution: "1200x800", size: "1.8 MB" },
];

const INITIAL_SUBJECTS: RemakeSubject[] = [
  {
    id: "person-1",
    type: "person",
    name: "护肤测评博主",
    originalName: "原视频角色 01",
    originalImage: ORIGINAL_PERSON,
    prompt: CHARACTER_GENERATION_PROMPT,
    candidates: [],
    voices: [{ id: "voice-person-1", name: "自然女声", description: "年轻女性，表达自然亲切，语速适中，适合生活化产品讲解。" }],
    activeVoiceId: "voice-person-1",
  },
  {
    id: "person-1-look-2",
    type: "person",
    name: "护肤测评博主-白色休闲装",
    originalName: "原视频角色 01-形象 02",
    originalImage: ORIGINAL_PERSON_3,
    prompt: CHARACTER_GENERATION_PROMPT,
    candidates: [],
    voices: [{ id: "voice-person-1-look-2", name: "自然女声", description: "年轻女性，表达自然亲切，语速适中，适合生活化产品讲解。" }],
    activeVoiceId: "voice-person-1-look-2",
  },
  {
    id: "person-1-look-3",
    type: "person",
    name: "护肤测评博主-黑色套装",
    originalName: "原视频角色 01-形象 03",
    originalImage: ORIGINAL_PERSON_4,
    prompt: CHARACTER_GENERATION_PROMPT,
    candidates: [],
    voices: [{ id: "voice-person-1-look-3", name: "自然女声", description: "年轻女性，表达自然亲切，语速适中，适合生活化产品讲解。" }],
    activeVoiceId: "voice-person-1-look-3",
  },
  {
    id: "person-2",
    type: "person",
    name: "体验用户",
    originalName: "原视频角色 02",
    originalImage: ORIGINAL_PERSON_2,
    prompt: CHARACTER_GENERATION_PROMPT,
    candidates: [],
    voices: [{ id: "voice-person-2", name: "清爽女声", description: "年轻女性，音色清晰明亮，语气真实，适合体验分享。" }],
    activeVoiceId: "voice-person-2",
  },
  {
    id: "person-2-look-2",
    type: "person",
    name: "体验用户-居家形象",
    originalName: "原视频角色 02-形象 02",
    originalImage: ORIGINAL_PERSON_5,
    prompt: CHARACTER_GENERATION_PROMPT,
    candidates: [],
    voices: [{ id: "voice-person-2-look-2", name: "清爽女声", description: "年轻女性，音色清晰明亮，语气真实，适合体验分享。" }],
    activeVoiceId: "voice-person-2-look-2",
  },
  {
    id: "person-3",
    type: "person",
    name: "成分讲解专家",
    originalName: "原视频角色 03",
    originalImage: ORIGINAL_PERSON_6,
    prompt: CHARACTER_GENERATION_PROMPT,
    candidates: [],
    voices: [{ id: "voice-person-3", name: "专业女声", description: "成熟清晰的女性音色，表达专业可信，适合成分与功效讲解。" }],
    activeVoiceId: "voice-person-3",
  },
  {
    id: "scene-1",
    type: "scene",
    name: "明亮居家客厅",
    originalName: "原视频场景 01",
    originalImage: ORIGINAL_SCENE,
    prompt: "现代明亮居家客厅，白天自然光，浅色沙发与木质茶几，空间整洁，真实生活感，竖屏构图。",
    candidates: [],
  },
  {
    id: "scene-2",
    type: "scene",
    name: "护肤产品展示台",
    originalName: "原视频场景 02",
    originalImage: ORIGINAL_SCENE_2,
    prompt: "浅灰色石材护肤品展示台，柔和侧逆光，背景干净，突出瓶身轮廓和产品肌理，电商广告质感。",
    candidates: [],
  },
  {
    id: "product-1",
    type: "product",
    name: "核心护肤产品",
    originalName: "原视频商品",
    originalImage: ORIGINAL_PRODUCT,
    prompt: "用户自有护肤精华产品，完整保留瓶身结构、品牌标识和包装文字，白底正面产品图，边缘清晰。",
    candidates: [],
  },
  {
    id: "product-2",
    type: "product",
    name: "辅助展示道具",
    originalName: "原视频道具",
    originalImage: ORIGINAL_PROP,
    prompt: "透明玻璃托盘与简洁化妆镜，轻奢但不过度装饰，适合护肤产品近景展示。",
    candidates: [],
  },
];

const INITIAL_SHOTS: StoryboardShot[] = [
  { id: "shot-1", title: "分镜 01", duration: 5, description: "护肤测评博主在明亮客厅内正对镜头，手持核心护肤产品进入画面，镜头由中景缓慢推近至产品与角色同框。", dialogue: "最近我发现了一款很适合日常维稳的精华。", subjectIds: ["person-1", "scene-1", "product-1"], status: "pending", progress: 0 },
  { id: "shot-2", title: "分镜 02", duration: 5, description: "核心护肤产品放在展示台中央，柔和侧光扫过瓶身，镜头环绕展示包装和精华质地。", dialogue: "质地清爽，吸收速度很快。", subjectIds: ["scene-2", "product-1", "product-2"], status: "pending", progress: 0 },
  { id: "shot-3", title: "分镜 03", duration: 6, description: "体验用户将精华均匀涂抹在面部，镜头切换到皮肤近景，突出使用过程与即时肤感。", dialogue: "上脸不会黏，后续叠加面霜也很舒服。", subjectIds: ["person-2", "scene-1", "product-1"], status: "pending", progress: 0 },
  { id: "shot-4", title: "分镜 04", duration: 5, description: "护肤测评博主再次出镜，对比展示使用前后的肌肤状态，角色与产品交替特写。", dialogue: "坚持使用后，皮肤状态看起来更稳定。", subjectIds: ["person-1", "scene-1", "product-1"], status: "pending", progress: 0 },
  { id: "shot-5", title: "分镜 05", duration: 4, description: "产品定格在展示台上，角色手部从侧面拿起产品并面向镜头，画面收束到品牌包装。", dialogue: "需要日常维稳的朋友可以试试。", subjectIds: ["scene-2", "product-1", "product-2"], status: "pending", progress: 0 },
];

const TYPE_META: Record<SubjectType, { label: string; icon: React.ElementType }> = {
  person: { label: "角色", icon: UserRound },
  scene: { label: "场景", icon: ImageIcon },
  product: { label: "商品与道具", icon: Package },
};

const STORAGE_PREFIX = "mengchang_remake_";
const LEGACY_STORAGE_PREFIX = "mengchang_remake2_";

const formatDate = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
};

const parseDurationSeconds = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return 30;
  if (normalized.includes(":")) {
    const parts = normalized.split(":").map((part) => Number(part));
    if (parts.every(Number.isFinite)) return Math.max(1, Math.round(parts.reduce((total, part) => total * 60 + part, 0)));
  }
  const numeric = Number(normalized.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 30;
};

const formatDuration = (seconds: number) => {
  const value = Math.max(0, Math.round(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remaining = value % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
};

const getStoryboardVersions = (shot: StoryboardShot): StoryboardVideoVersion[] => {
  if (shot.versions?.length) return shot.versions;
  return shot.cover ? [{ id: `${shot.id}-legacy`, cover: shot.cover, createdAt: 0 }] : [];
};

const getInitialState = (sessionId: string, activeTask?: Task): SavedRemakeState => {
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`)
      || window.localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${sessionId}`);
    if (stored) {
      const parsed = JSON.parse(stored) as SavedRemakeState;
      return {
        ...parsed,
        videoRatio: parsed.videoRatio || "9:16",
        resolution: parsed.resolution || "720p",
        subjects: (parsed.subjects || []).map((subject) => ({
          ...subject,
          prompt: subject.type === "person" && !subject.prompt.includes("- 时代基底：") ? CHARACTER_GENERATION_PROMPT : subject.prompt,
          referenceImages: subject.referenceImages ?? [],
          replacementName: subject.replacementName ?? (subject.candidates.length ? subject.originalName : undefined),
        })),
      };
    }
  } catch {
    // Ignore malformed prototype persistence.
  }
  if (activeTask && (activeTask.category === "fission" || activeTask.type === "fission")) {
    const restoredStep: Step = activeTask.remakeStage === "final"
      ? "final"
      : activeTask.remakeStage === "storyboard"
        ? "storyboard"
        : "subjects";
    const cover = activeTask.outputFiles?.[0]
      || activeTask.inputFiles.find((file) => /^https?:\/\//.test(file))
      || VIDEO_COVERS[0];
    const restoredShots = restoredStep === "subjects"
      ? []
      : INITIAL_SHOTS.map((shot, index) => {
        const shotCover = VIDEO_COVERS[index % VIDEO_COVERS.length];
        const completed = restoredStep === "final" || activeTask.status === "completed";
        return completed
          ? { ...shot, status: "completed" as const, progress: 100, cover: shotCover, versions: [{ id: `${shot.id}-restored`, cover: shotCover, createdAt: 0 }], currentVersionId: `${shot.id}-restored` }
          : { ...shot };
      });
    return {
      step: restoredStep,
      source: {
        id: `${sessionId}-source`,
        name: activeTask.name.replace(/\s*·.*$/, "") + ".mp4",
        url: cover,
        cover,
        size: "86.4 MB",
        duration: formatDuration(restoredShots.reduce((total, shot) => total + shot.duration, 0) || 25),
        section: "成片",
      },
      language: "中文",
      videoRatio: "9:16",
      resolution: "720p",
      projectName: activeTask.name.replace(/\s*·.*$/, ""),
      subjects: INITIAL_SUBJECTS.map((subject) => ({ ...subject, candidates: [], referenceImages: [] })),
      shots: restoredShots,
      selectedSubjectId: null,
      selectedShotId: restoredShots[0]?.id || null,
      finalStatus: restoredStep === "final" ? "completed" : "pending",
      finalProgress: restoredStep === "final" ? 100 : 0,
      finalName: `爆款复刻成片_${formatDate()}_${sessionId.slice(-6)}_0.mp4`,
      spentCredits: activeTask.creditsCost,
      videoFailureShown: false,
      backgroundOperation: null,
    };
  }
  return {
    step: "source",
    source: null,
    language: "中文",
    videoRatio: "9:16",
    resolution: "720p",
    projectName: "新建爆款复刻",
    subjects: [],
    shots: [],
    selectedSubjectId: null,
    selectedShotId: null,
    finalStatus: "pending",
    finalProgress: 0,
    finalName: `爆款复刻成片_${formatDate()}_${sessionId.slice(-6)}_0.mp4`,
    spentCredits: 0,
    videoFailureShown: false,
    backgroundOperation: null,
  };
};

export default function VideoRemakeView({
  onBack,
  onOpenQueue,
  credits,
  assets,
  activeSessionId,
  activeTask,
  initialSource,
  onSessionChange,
  onSyncTask,
  onUploadVideos,
}: VideoRemakeViewProps) {
  const [sessionId] = useState(() => activeSessionId || `remake-${Date.now()}`);
  const initial = useMemo(() => getInitialState(sessionId, activeTask), [activeTask, sessionId]);
  const [step, setStep] = useState<Step>(initial.step);
  const [source, setSource] = useState<SourceVideo | null>(initial.source || initialSource || null);
  const [language, setLanguage] = useState(initial.language);
  const [videoRatio, setVideoRatio] = useState<VideoRatio>(initial.videoRatio);
  const [resolution, setResolution] = useState<VideoResolution>(initial.resolution);
  const [projectName, setProjectName] = useState(initial.source ? initial.projectName : initialSource?.name.replace(/\.[^.]+$/, "") || initial.projectName);
  const [subjects, setSubjects] = useState<RemakeSubject[]>(initial.subjects);
  const [shots, setShots] = useState<StoryboardShot[]>(initial.shots);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(initial.selectedSubjectId);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(initial.selectedShotId);
  const [finalStatus, setFinalStatus] = useState<GenerationStatus>(initial.finalStatus);
  const [finalProgress, setFinalProgress] = useState(initial.finalProgress);
  const [finalName, setFinalName] = useState(initial.finalName);
  const [spentCredits, setSpentCredits] = useState(initial.spentCredits);
  const [videoFailureShown, setVideoFailureShown] = useState(initial.videoFailureShown);
  const [subjectTab, setSubjectTab] = useState<SubjectType>("person");
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [imageModalSubjectId, setImageModalSubjectId] = useState<string | null>(null);
  const [imageModalTarget, setImageModalTarget] = useState<SubjectImageTarget>("candidate");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [addSubjectType, setAddSubjectType] = useState<SubjectType | null>(null);
  const [mergeSubjectId, setMergeSubjectId] = useState<string | null>(null);
  const [independentSubjectId, setIndependentSubjectId] = useState<string | null>(null);
  const [voiceSubjectId, setVoiceSubjectId] = useState<string | null>(null);
  const [generatingVoiceSubjectIds, setGeneratingVoiceSubjectIds] = useState<string[]>([]);
  const [emptySubjectsWarningOpen, setEmptySubjectsWarningOpen] = useState(false);
  const [addShotIndex, setAddShotIndex] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [operation, setOperation] = useState<{ key: string; label: string; progress: number } | null>(initial.backgroundOperation);
  const [seek, setSeek] = useState(0);
  const timers = useRef<number[]>([]);
  const operationLockRef = useRef(!!initial.backgroundOperation);

  const selectedSubject = subjects.find((item) => item.id === selectedSubjectId) || (selectedSubjectId ? subjects[0] : null);
  const selectedShot = shots.find((item) => item.id === selectedShotId) || shots[0] || null;
  const currentCandidate = selectedSubject?.candidates.find((item) => item.id === selectedSubject.selectedCandidateId);
  const generatedShotCount = shots.filter((item) => item.status === "completed").length;
  const replacedSubjects = subjects.filter((item) => item.selectedCandidateId);
  const queueTaskId = activeTask?.id || `remake-task-${sessionId}`;

  const showToast = (message: string) => {
    setToast(message);
    const timer = window.setTimeout(() => setToast(""), 2400);
    timers.current.push(timer);
  };

  useEffect(() => {
    onSessionChange(sessionId);
  }, [onSessionChange, sessionId]);

  useEffect(() => {
    const saved: SavedRemakeState = {
      step,
      source,
      language,
      videoRatio,
      resolution,
      projectName,
      subjects,
      shots,
      selectedSubjectId,
      selectedShotId,
      finalStatus,
      finalProgress,
      finalName,
      spentCredits,
      videoFailureShown,
      backgroundOperation: operation,
    };
    window.localStorage.setItem(`${STORAGE_PREFIX}${sessionId}`, JSON.stringify(saved));
  }, [finalName, finalProgress, finalStatus, language, operation, projectName, resolution, selectedShotId, selectedSubjectId, sessionId, shots, source, spentCredits, step, subjects, videoFailureShown, videoRatio]);

  const persistPatch = (patch: Partial<SavedRemakeState>) => {
    try {
      const current = getInitialState(sessionId);
      window.localStorage.setItem(`${STORAGE_PREFIX}${sessionId}`, JSON.stringify({ ...current, ...patch }));
    } catch {
      // Prototype state will continue in memory if persistence is unavailable.
    }
  };

  useEffect(() => {
    const needsBackgroundSync = !!operation || shots.some((item) => item.status === "generating") || finalStatus === "generating";
    if (!needsBackgroundSync) return;
    const interval = window.setInterval(() => {
      const latest = getInitialState(sessionId);
      setOperation(latest.backgroundOperation);
      setSubjects(latest.subjects);
      setShots(latest.shots);
      setStep(latest.step);
      setFinalStatus(latest.finalStatus);
      setFinalProgress(latest.finalProgress);
      setSpentCredits(latest.spentCredits);
      setVideoFailureShown(latest.videoFailureShown);
    }, 500);
    return () => window.clearInterval(interval);
  }, [finalStatus, operation, sessionId, shots]);

  useEffect(() => {
    if (!operation) operationLockRef.current = false;
  }, [operation]);

  const syncTask = (label: string, status: Task["status"], progress: number, totalCredits: number, remakeStage: NonNullable<Task["remakeStage"]>, failureReason?: string) => {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    onSyncTask({
      id: queueTaskId,
      name: `${projectName} · ${label}`,
      type: "fission",
      status,
      progress,
      inputFiles: source ? [source.cover] : [],
      createdAt: now,
      creditsCost: totalCredits,
      source: "tool",
      category: "fission",
      autoProgress: false,
      failureReason,
      remakeStage,
      remakeSessionId: sessionId,
      cancellable: false,
      restartable: false,
    }, 0);
  };

  const runOperation = (
    key: string,
    label: string,
    cost: number,
    onComplete: () => void,
    options?: { fail?: boolean; failureReason?: string; duration?: number },
  ) => {
    if (operationLockRef.current || operation) return false;
    if (credits < cost) {
      showToast(`积分不足，本次操作需要 ${cost} 积分`);
      return false;
    }
    operationLockRef.current = true;
    const nextSpent = spentCredits + cost;
    const remakeStage: NonNullable<Task["remakeStage"]> = key === "analysis" || key.startsWith("subject-")
      ? "video_analysis"
      : key === "final"
        ? "final"
        : "storyboard";
    setSpentCredits(nextSpent);
    setOperation({ key, label, progress: 6 });
    persistPatch({ backgroundOperation: { key, label, progress: 6 }, spentCredits: nextSpent });
    syncTask(label, "generating", 6, nextSpent, remakeStage);
    if (cost > 0) {
      onSyncTask({
        id: queueTaskId,
        name: `${projectName} · ${label}`,
        type: "fission",
        status: "generating",
        progress: 6,
        inputFiles: source ? [source.cover] : [],
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        creditsCost: nextSpent,
        source: "tool",
        category: "fission",
        autoProgress: false,
        remakeStage,
        remakeSessionId: sessionId,
        cancellable: false,
        restartable: false,
      }, cost);
    }
    let progress = 6;
    const interval = window.setInterval(() => {
      progress = Math.min(100, progress + 11);
      setOperation({ key, label, progress });
      persistPatch({ backgroundOperation: { key, label, progress } });
      syncTask(label, "generating", progress, nextSpent, remakeStage);
      if (progress >= 100) {
        window.clearInterval(interval);
        operationLockRef.current = false;
        setOperation(null);
        onComplete();
        persistPatch({ backgroundOperation: null });
        if (options?.fail) {
          syncTask(label, "failed", 100, nextSpent, remakeStage, options.failureReason || "生成失败，请重新生成。积分不退回。 ");
        } else {
          syncTask(label, "completed", 100, nextSpent, remakeStage);
        }
      }
    }, options?.duration || 260);
    timers.current.push(interval);
    return true;
  };

  const startAnalysis = () => {
    if (!source) return showToast("请先选择一个原视频");
    runOperation("analysis", "视频分析中", 0, () => {
      const nextSubjects = INITIAL_SUBJECTS.map((item) => ({ ...item, candidates: [], referenceImages: [] }));
      const analyzedVideoName = source.name.replace(/\.[^.]+$/, "");
      setSubjects(nextSubjects);
      setProjectName(analyzedVideoName);
      setSelectedSubjectId(null);
      setSubjectTab("person");
      setStep("subjects");
      persistPatch({ subjects: nextSubjects, projectName: analyzedVideoName, selectedSubjectId: null, step: "subjects" });
      showToast("原视频解析完成");
    }, { duration: 220 });
  };

  const selectSource = (item: SourceVideo) => {
    if (operationLockRef.current || operation) return;
    setSource(item);
    setProjectName(item.name.replace(/\.[^.]+$/, ""));
    setSubjects([]);
    setShots([]);
    setSelectedSubjectId(null);
    setSelectedShotId(null);
    setFinalStatus("pending");
    setFinalProgress(0);
    setStep("source");
    setSourceModalOpen(false);
  };

  const generateSubject = (subject: RemakeSubject, config: SubjectGenerationConfig) => {
    const index = subject.candidates.filter((item) => item.source === "AI生成").length;
    runOperation(`subject-${subject.id}`, `正在生成${subject.name}（${config.count}张）`, config.cost, () => {
      const createdAt = Date.now();
      const candidates: CandidateImage[] = Array.from({ length: config.count }, (_, offset) => ({
        id: `${subject.id}-ai-${createdAt}-${offset}`,
        name: `${subject.name}候选图 ${index + offset + 1}`,
        image: GENERATED_IMAGES[subject.type][(index + offset) % GENERATED_IMAGES[subject.type].length],
        source: "AI生成",
      }));
      const latestSubjects = getInitialState(sessionId).subjects;
      const nextSubjects = latestSubjects.map((item) => item.id === subject.id
        ? { ...item, replacementName: item.replacementName ?? item.originalName, candidates: [...item.candidates, ...candidates], selectedCandidateId: candidates[0].id }
        : item);
      persistPatch({ subjects: nextSubjects });
      setSubjects(nextSubjects);
      showToast(`已生成 ${config.count} 张候选图片`);
    });
  };

  const startStoryboardAnalysis = (model: (typeof STORYBOARD_VIDEO_MODELS)[number], maxSegmentDuration: (typeof STORYBOARD_MAX_DURATIONS)[number]) => {
    setReviewOpen(false);
    runOperation("storyboard-analysis", "正在分析电商视频并拆分分镜", 0, () => {
      const totalDuration = Math.max(4, parseDurationSeconds(source?.duration || "00:30"));
      const shotCount = Math.max(1, Math.ceil(totalDuration / maxSegmentDuration));
      const availableSubjectIds = new Set(subjects.map((item) => item.id));
      const shotResolution: Exclude<VideoResolution, "4K"> = resolution === "4K" ? "1080p" : resolution;
      const createdAt = Date.now();
      const nextShots: StoryboardShot[] = Array.from({ length: shotCount }, (_, index) => {
        const template = INITIAL_SHOTS[index % INITIAL_SHOTS.length];
        const segmentStart = index * maxSegmentDuration;
        const remainingDuration = totalDuration - segmentStart;
        const duration = Math.max(4, Math.min(maxSegmentDuration, remainingDuration));
        const segmentEnd = Math.min(totalDuration, segmentStart + duration);
        return {
          ...template,
          id: `shot-${createdAt}-${index}`,
          title: `分镜 ${String(index + 1).padStart(2, "0")}`,
          duration,
          description: `AI 分析原视频第 ${segmentStart + 1}-${segmentEnd} 秒内容：${template.description}`,
          subjectIds: template.subjectIds.filter((id) => availableSubjectIds.has(id)),
          status: "pending",
          progress: 0,
          cover: undefined,
          failureReason: undefined,
          referenceImages: [],
          resolution: shotResolution,
          format: "mp4",
          versions: [],
          currentVersionId: undefined,
        };
      });
      setShots(nextShots);
      setSelectedShotId(nextShots[0].id);
      setStep("storyboard");
      persistPatch({ shots: nextShots, selectedShotId: nextShots[0].id, step: "storyboard" });
      showToast(`${model} 分镜解析完成`);
    }, { duration: 230 });
  };

  const generateAllShots = () => {
    const targetIds = shots.filter((item) => item.status !== "completed").map((item) => item.id);
    if (!targetIds.length) return;
    const cost = targetIds.length * STORYBOARD_GENERATION_COST;
    if (credits < cost) return showToast(`积分不足，本次操作需要 ${cost} 积分`);
    setShots((current) => current.map((item) => targetIds.includes(item.id) ? { ...item, status: "generating", progress: 6, failureReason: undefined } : item));
    const failOnce = !videoFailureShown && targetIds.length >= 3;
    persistPatch({ shots: shots.map((item) => targetIds.includes(item.id) ? { ...item, status: "generating", progress: 6, failureReason: undefined } : item) });
    runOperation("all-shots", `正在生成${targetIds.length}个分镜视频`, cost, () => {
      const failedId = failOnce ? targetIds[2] : null;
      const latestShots = getInitialState(sessionId).shots;
      const nextShots = latestShots.map((item, index) => {
          if (!targetIds.includes(item.id)) return item;
          if (item.id === failedId) return { ...item, status: "failed" as const, progress: 100, failureReason: "视频生成失败，请重新生成。已消耗积分不退回。" };
          const cover = VIDEO_COVERS[index % VIDEO_COVERS.length];
          const version: StoryboardVideoVersion = { id: `${item.id}-video-${Date.now()}-${index}`, cover, createdAt: Date.now() };
          return { ...item, status: "completed" as const, progress: 100, cover, failureReason: undefined, versions: [version, ...getStoryboardVersions(item)], currentVersionId: version.id };
      });
      persistPatch({ shots: nextShots, videoFailureShown: failOnce || videoFailureShown });
      setShots(nextShots);
      if (failOnce) {
        setVideoFailureShown(true);
        showToast("4 个分镜生成成功，1 个生成失败");
      } else {
        showToast("全部分镜视频生成完成");
      }
    }, { fail: failOnce, failureReason: "部分分镜视频生成失败，请进入任务重试。积分不退回。", duration: 300 });
  };

  const generateShot = (shot: StoryboardShot) => {
    if (!shot.description.trim()) return showToast("请先填写画面描述");
    if (credits < STORYBOARD_GENERATION_COST) return showToast(`积分不足，本次操作需要 ${STORYBOARD_GENERATION_COST.toLocaleString()} 积分`);
    setShots((current) => current.map((item) => item.id === shot.id ? { ...item, status: "generating", progress: 6, failureReason: undefined } : item));
    persistPatch({ shots: shots.map((item) => item.id === shot.id ? { ...item, status: "generating", progress: 6, failureReason: undefined } : item) });
    runOperation(`shot-${shot.id}`, `正在生成${shot.title}视频`, STORYBOARD_GENERATION_COST, () => {
      const index = shots.findIndex((item) => item.id === shot.id);
      const latestShots = getInitialState(sessionId).shots;
      const nextShots = latestShots.map((item) => {
        if (item.id !== shot.id) return item;
        const existingVersions = getStoryboardVersions(item);
        const cover = VIDEO_COVERS[(Math.max(index, 0) + existingVersions.length) % VIDEO_COVERS.length];
        const version: StoryboardVideoVersion = { id: `${item.id}-video-${Date.now()}`, cover, createdAt: Date.now() };
        return { ...item, status: "completed" as const, progress: 100, cover, failureReason: undefined, versions: [version, ...existingVersions], currentVersionId: version.id };
      });
      persistPatch({ shots: nextShots });
      setShots(nextShots);
      showToast(`${shot.title}生成完成`);
    });
  };

  useEffect(() => {
    if (!operation) return;
    if (operation.key === "all-shots") {
      setShots((current) => current.map((item) => item.status === "generating" ? { ...item, progress: operation.progress } : item));
    }
    if (operation.key === "final") setFinalProgress(operation.progress);
  }, [operation]);

  const updateSubject = (id: string, patch: Partial<RemakeSubject>) => {
    setSubjects((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const addSubject = (subject: RemakeSubject) => {
    setSubjects((current) => [...current, subject]);
    setSelectedSubjectId(subject.id);
    setSubjectTab(subject.type);
    setAddSubjectType(null);
    showToast(`已添加${TYPE_META[subject.type].label}`);
  };

  const deleteSubject = (id: string, deletePersonGroup = false) => {
    const target = subjects.find((item) => item.id === id);
    if (!target) return;
    const deletedIds = deletePersonGroup && target.type === "person"
      ? subjects.filter((item) => item.type === "person" && getPersonGroupName(item.name) === getPersonGroupName(target.name)).map((item) => item.id)
      : [id];
    const deletedIdSet = new Set(deletedIds);
    const next = subjects.filter((item) => !deletedIdSet.has(item.id));
    setSubjects(next);
    setShots((current) => current.map((shot) => ({ ...shot, subjectIds: shot.subjectIds.filter((subjectId) => !deletedIdSet.has(subjectId)) })));
    if (selectedSubjectId && deletedIdSet.has(selectedSubjectId)) setSelectedSubjectId(next.find((item) => item.type === target.type)?.id || null);
    showToast(deletePersonGroup && target.type === "person" ? `已删除角色“${getPersonGroupName(target.name)}”` : `已删除${target.name}`);
  };

  const mergeSubject = (sourceId: string, targetId: string) => {
    const sourceSubject = subjects.find((item) => item.id === sourceId);
    const targetSubject = subjects.find((item) => item.id === targetId);
    if (!sourceSubject || !targetSubject) return;
    const mergedCandidates = [...targetSubject.candidates, ...sourceSubject.candidates.filter((candidate) => !targetSubject.candidates.some((item) => item.id === candidate.id))];
    const next = subjects.filter((item) => item.id !== sourceId).map((item) => item.id === targetId ? {
      ...item,
      candidates: mergedCandidates,
      selectedCandidateId: item.selectedCandidateId || sourceSubject.selectedCandidateId,
    } : item);
    setSubjects(next);
    setShots((current) => current.map((shot) => ({ ...shot, subjectIds: shot.subjectIds.includes(sourceId) ? Array.from(new Set(shot.subjectIds.map((id) => id === sourceId ? targetId : id))) : shot.subjectIds })));
    setSelectedSubjectId(targetId);
    setMergeSubjectId(null);
    showToast(`已将${sourceSubject.name}合并到${targetSubject.name}`);
  };

  const createIndependentSubject = (id: string) => {
    const sourceSubject = subjects.find((item) => item.id === id);
    if (!sourceSubject) return;
    const copy: RemakeSubject = {
      ...sourceSubject,
      id: `${sourceSubject.id}-independent-${Date.now()}`,
      name: `${sourceSubject.name} 2`,
      originalName: `${sourceSubject.originalName}（独立）`,
      replacementName: undefined,
      candidates: [],
      selectedCandidateId: undefined,
      voices: sourceSubject.voices?.map((voice) => ({ ...voice })),
    };
    setSubjects((current) => [...current, copy]);
    setSelectedSubjectId(copy.id);
    setIndependentSubjectId(null);
    showToast("已新增独立角色");
  };

  const generateVoice = (subjectId: string, description: string) => {
    if (generatingVoiceSubjectIds.includes(subjectId)) return;
    const target = subjects.find((item) => item.id === subjectId);
    if (!target) return;
    const voice: RemakeVoice = {
      id: `voice-${subjectId}-${Date.now()}`,
      name: `音色 ${(target.voices?.length ?? 0) + 1}`,
      description,
    };
    setGeneratingVoiceSubjectIds((current) => [...current, subjectId]);
    const timer = window.setTimeout(() => {
      setSubjects((current) => current.map((item) => item.id === subjectId
        ? { ...item, voices: item.voices?.some((entry) => entry.id === voice.id) ? item.voices : [...(item.voices ?? []), voice] }
        : item));
      setGeneratingVoiceSubjectIds((current) => current.filter((id) => id !== subjectId));
      showToast(`${target.name}的新音色生成完成`);
    }, 3000);
    timers.current.push(timer);
  };

  const openReplacementReview = () => {
    if (!subjects.length) {
      setEmptySubjectsWarningOpen(true);
      return;
    }
    setReviewOpen(true);
  };

  const updateShot = (id: string, patch: Partial<StoryboardShot>) => {
    setShots((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    setFinalStatus("pending");
    setFinalProgress(0);
  };

  const addShot = (duration: number) => {
    if (addShotIndex === null) return;
    const shot: StoryboardShot = {
      id: `shot-${Date.now()}`,
      title: "",
      duration,
      description: "",
      manuallyAdded: true,
      dialogue: "",
      subjectIds: [],
      referenceImages: [],
      resolution: resolution === "4K" ? "1080p" : resolution,
      format: "mp4",
      versions: [],
      status: "pending",
      progress: 0,
    };
    const next = [...shots];
    next.splice(addShotIndex, 0, shot);
    const renamed = next.map((item, index) => ({ ...item, title: `分镜 ${String(index + 1).padStart(2, "0")}` }));
    setShots(renamed);
    setFinalStatus("pending");
    setFinalProgress(0);
    setSelectedShotId(shot.id);
    setAddShotIndex(null);
    showToast("已新增分镜");
  };

  const deleteShot = (id: string) => {
    if (shots.length <= 1) return showToast("至少保留一个分镜");
    const next = shots.filter((item) => item.id !== id).map((item, index) => ({ ...item, title: `分镜 ${String(index + 1).padStart(2, "0")}` }));
    setShots(next);
    if (selectedShotId === id) setSelectedShotId(next[0]?.id || null);
    setFinalStatus("pending");
    showToast("已删除分镜");
  };

  const steps: Array<{ id: Step; label: string; enabled: boolean }> = [
    { id: "subjects", label: "主体设定", enabled: subjects.length > 0 },
    { id: "storyboard", label: "分镜解析", enabled: shots.length > 0 },
    { id: "final", label: "视频成片", enabled: shots.length > 0 },
  ];
  const historyButton = <button type="button" onClick={onOpenQueue} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><History className="h-4 w-4" />历史任务</button>;

  if (uploadOpen) {
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        {toast && <OverlayPortal layer="toast" className="fixed left-1/2 top-20 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</OverlayPortal>}
        <UploadFinishedVideoModal
          key={finalName}
          isOpen
          isPage
          initialFiles={[{ name: finalName, type: "video/mp4" }]}
          onClose={() => setUploadOpen(false)}
          onPublishSuccess={(message) => {
            onUploadVideos([{ name: finalName, cover: VIDEO_COVERS[0] }]);
            showToast(message);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-800">
      {step === "source" && <header className="flex h-14 shrink-0 items-center justify-end border-b border-slate-200 bg-white px-5">{historyButton}</header>}
      {step !== "source" && <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onBack} title="返回" className="rounded p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
          <div className="min-w-0">
            <EditableVideoName value={projectName} disabled={!!operation} onChange={setProjectName} />
            <div className="mt-1 flex items-center text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm border border-slate-500" />{videoRatio}</span>
              <span className="mx-3 h-3 w-px bg-slate-200" />
              <span>{resolution}</span>
              <span className="mx-3 h-3 w-px bg-slate-200" />
              <span>目标语种：{language}</span>
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
          {steps.map((item, index) => <React.Fragment key={item.id}>
            <button disabled={!item.enabled || !!operation} onClick={() => setStep(item.id)} className={`rounded px-4 py-2 text-xs font-semibold ${step === item.id ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800"} disabled:cursor-not-allowed disabled:opacity-35`}>{item.label}</button>
            {index < steps.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
          </React.Fragment>)}
        </nav>
        <div className="flex w-[200px] shrink-0 justify-end">{historyButton}</div>
      </header>}

      {operation && <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-5 py-2.5">
        <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-semibold text-blue-700"><Loader2 className="h-3.5 w-3.5 animate-spin" />{operation.label}</span><span className="font-mono text-blue-600">{operation.progress}%</span></div>
        <div className="mt-2 h-1 overflow-hidden rounded bg-blue-100"><div className="h-full rounded bg-blue-600 transition-all" style={{ width: `${operation.progress}%` }} /></div>
      </div>}

      <main className="min-h-0 flex-1 overflow-hidden">
        {step === "source" && <SourceStep assets={assets} source={source} language={language} videoRatio={videoRatio} resolution={resolution} operation={operation} onLanguage={setLanguage} onVideoRatio={setVideoRatio} onResolution={setResolution} onOpen={() => setSourceModalOpen(true)} onAnalyze={startAnalysis} onSelectSource={selectSource} />}
        {step === "subjects" && (operation?.key === "storyboard-analysis"
          ? <StoryboardAnalysisProgress progress={operation.progress} />
          : <SubjectsStep subjects={subjects} subjectTab={subjectTab} selectedSubject={selectedSubject} currentCandidate={currentCandidate} operation={operation} onTab={setSubjectTab} onSelect={setSelectedSubjectId} onUpdate={updateSubject} onGenerate={generateSubject} onChooseImage={(id, target = "candidate") => { setImageModalTarget(target); setImageModalSubjectId(id); }} onLightbox={setLightbox} onAdd={setAddSubjectType} onConfigureVoice={setVoiceSubjectId} onMerge={setMergeSubjectId} onIndependent={setIndependentSubjectId} onDelete={deleteSubject} onContinue={openReplacementReview} />)}
        {step === "storyboard" && <StoryboardStep source={source} resolution={resolution} subjects={subjects} shots={shots} selectedShot={selectedShot} operation={operation} seek={seek} generatedShotCount={generatedShotCount} onSeek={setSeek} onSelectShot={setSelectedShotId} onUpdateShot={updateShot} onGenerateAll={generateAllShots} onGenerateShot={generateShot} onAddShot={setAddShotIndex} onDeleteShot={deleteShot} onNotify={showToast} />}
        {step === "final" && <FinalStep source={source} shots={shots} finalName={finalName} onUpload={() => setUploadOpen(true)} />}
      </main>

      {sourceModalOpen && <SourceVideoModal assets={assets} selected={source} onClose={() => setSourceModalOpen(false)} onConfirm={selectSource} showToast={showToast} />}
      {imageModalSubjectId && (() => {
        const modalSubject = subjects.find((item) => item.id === imageModalSubjectId);
        const referenceImages = modalSubject?.referenceImages ?? [];
        const multiple = imageModalTarget === "reference";
        return <ImagePickerModal
          assets={assets}
          unavailableImageUrls={modalSubject ? [modalSubject.originalImage, ...modalSubject.candidates.map((candidate) => candidate.image), ...referenceImages.map((candidate) => candidate.image)].filter(Boolean) : []}
          multiple={multiple}
          maxSelections={multiple ? Math.max(0, 10 - referenceImages.length) : 1}
          onClose={() => setImageModalSubjectId(null)}
          onConfirm={(selectedImages) => {
            const id = imageModalSubjectId;
            const candidate = selectedImages[0];
            if (!candidate) return;
            setSubjects((current) => current.map((item) => {
              if (item.id !== id) return item;
              if (imageModalTarget === "original") return { ...item, originalImage: candidate.image, originalName: candidate.name };
              if (imageModalTarget === "reference") {
                const nextReferenceImages = [...(item.referenceImages ?? []), ...selectedImages]
                  .slice(0, 10)
                  .map((image, index) => ({ ...image, name: `图片${index + 1}` }));
                return { ...item, referenceImages: nextReferenceImages };
              }
              return { ...item, replacementName: item.replacementName ?? item.originalName, candidates: [...item.candidates, candidate], selectedCandidateId: candidate.id };
            }));
            setImageModalSubjectId(null);
          }}
          showToast={showToast}
        />;
      })()}
      {addSubjectType && <AddSubjectModal type={addSubjectType} onClose={() => setAddSubjectType(null)} onConfirm={addSubject} showToast={showToast} />}
      {mergeSubjectId && (() => { const sourceSubject = subjects.find((item) => item.id === mergeSubjectId); return sourceSubject ? <MergeSubjectModal source={sourceSubject} options={subjects.filter((item) => item.type === "person" && item.id !== sourceSubject.id)} onClose={() => setMergeSubjectId(null)} onConfirm={(targetId) => mergeSubject(sourceSubject.id, targetId)} /> : null; })()}
      {independentSubjectId && (() => { const target = subjects.find((item) => item.id === independentSubjectId); return target ? <ConfirmationModal title="独立形象确认" description={`将“${target.name}”拆分为一个新的独立角色，新角色需单独配置替换图片。`} confirmLabel="确认" onClose={() => setIndependentSubjectId(null)} onConfirm={() => createIndependentSubject(target.id)} /> : null; })()}
      {voiceSubjectId && (() => { const target = subjects.find((item) => item.id === voiceSubjectId); return target ? <VoiceConfigModal subject={target} generating={generatingVoiceSubjectIds.includes(target.id)} onClose={() => setVoiceSubjectId(null)} onGenerate={(description) => generateVoice(target.id, description)} onApply={(voices, activeVoiceId) => { updateSubject(target.id, { voices, activeVoiceId }); setVoiceSubjectId(null); showToast("音色已应用"); }} showToast={showToast} /> : null; })()}
      {emptySubjectsWarningOpen && <ConfirmationModal title="请先完成替换关系设定" description="当前没有可用于分镜解析的主体，请先添加角色、场景或道具后再继续。" confirmLabel="知道了" hideCancel onClose={() => setEmptySubjectsWarningOpen(false)} onConfirm={() => setEmptySubjectsWarningOpen(false)} />}
      {reviewOpen && <ReplacementReviewModal subjects={subjects} onClose={() => setReviewOpen(false)} onConfirm={startStoryboardAnalysis} />}
      {addShotIndex !== null && <AddShotModal onClose={() => setAddShotIndex(null)} onConfirm={addShot} />}
      {lightbox && <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-black/70 p-8" onClick={() => setLightbox(null)}><button title="关闭" className="absolute right-6 top-6 rounded bg-white/90 p-2 text-slate-700"><X className="h-5 w-5" /></button><img src={lightbox} alt="查看大图" className="max-h-full max-w-full rounded object-contain" referrerPolicy="no-referrer" /></OverlayPortal>}
      {toast && <OverlayPortal layer="toast" className="fixed left-1/2 top-20 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</OverlayPortal>}
    </div>
  );
}

function SourceStep({ assets, source, language, videoRatio, resolution, operation, onLanguage, onVideoRatio, onResolution, onOpen, onAnalyze, onSelectSource }: { assets: Asset[]; source: SourceVideo | null; language: string; videoRatio: VideoRatio; resolution: VideoResolution; operation: { key: string; label: string; progress: number } | null; onLanguage: (value: string) => void; onVideoRatio: (value: VideoRatio) => void; onResolution: (value: VideoResolution) => void; onOpen: () => void; onAnalyze: () => void; onSelectSource: (source: SourceVideo) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const uploadedVideos = useMemo(() => assets.filter((asset) => asset.id.startsWith("face-published-") && asset.resourceCategory === "成片"), [assets]);

  useEffect(() => {
    if (!preview) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previewCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [preview]);

  if (operation?.key === "analysis") return <VideoAnalysisProgress progress={operation.progress} />;
  return <div ref={scrollRef} className="h-full overflow-y-auto"><div className="mx-auto w-full max-w-[1600px] space-y-12 py-8 pl-4 pr-12 sm:py-12 sm:pl-6"><div ref={sourceRef} tabIndex={-1} className="mx-auto w-full max-w-5xl outline-none">
    <div className="mb-6 text-center"><h2 className="text-2xl font-bold text-slate-900">复刻爆款，让好内容持续转化</h2><p className="mt-2 text-sm text-slate-500">上传电商爆款视频，替换角色、场景、商品和道具，生成属于你的全新带货视频。</p></div>
    <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-4">{!source ? <button disabled={!!operation} onClick={onOpen} className="flex h-40 w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700 disabled:opacity-50"><Upload className="h-7 w-7" /><span className="mt-3 text-sm font-semibold">选择一个原视频</span><span className="mt-1 text-xs text-slate-400">资源库选择或本地上传</span></button> : <div className="flex h-40 flex-col items-center justify-center"><div className="flex min-w-0 max-w-full items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 sm:min-w-80"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600"><Film className="h-5 w-5" /></span><p className="min-w-0 truncate text-sm font-semibold text-slate-800">{source.name}</p></div><button disabled={!!operation} onClick={onOpen} className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />重选视频</button></div>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3"><CompactSourceSetting label="目标语种" icon={<Languages className="h-3.5 w-3.5" />}><select value={language} onChange={(event) => onLanguage(event.target.value)} disabled={!!operation} className="min-w-20 bg-transparent text-xs font-bold text-slate-600 outline-none"><option>中文</option><option>英语</option><option>日语</option><option>韩语</option><option>西班牙语</option><option>葡萄牙语</option><option>印尼语</option><option>越南语</option><option>泰语</option><option>马来语</option></select></CompactSourceSetting><div className="flex flex-wrap items-center gap-2"><RatioDropdown value={videoRatio} disabled={!!operation} onChange={onVideoRatio} /><CompactSourceSetting label="分辨率" icon={<ImageIcon className="h-3.5 w-3.5" />}><select value={resolution} onChange={(event) => onResolution(event.target.value as VideoResolution)} disabled={!!operation} className="min-w-24 bg-transparent text-xs font-bold text-slate-600 outline-none"><option value="480p">480p</option><option value="720p">720p（标清）</option><option value="1080p">1080p（高清）</option><option value="4K">4K</option></select></CompactSourceSetting></div></div>
    </section>
    <div className="mt-6 flex justify-center"><PrimaryGenerationButton disabled={!source || !!operation} onClick={onAnalyze}>开始解析</PrimaryGenerationButton></div>
  </div>
    <ViralInspirationGallery
      uploadedVideos={uploadedVideos}
      onPreview={(video) => {
        setPreviewError(false);
        setPreview({ url: video.videoUrl, title: video.title });
      }}
      onRemake={(video) => {
        onSelectSource(video);
        sourceRef.current?.focus({ preventScroll: true });
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  </div>
    {preview && <OverlayPortal layer="modal" role="dialog" aria-modal="true" aria-label={preview.title} className="fixed inset-0 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="min-w-0 break-words text-sm font-semibold text-slate-800">{preview.title}</h3>
          <button ref={previewCloseRef} type="button" onClick={() => setPreview(null)} title="关闭预览" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <video src={preview.url} controls autoPlay playsInline onError={() => setPreviewError(true)} className="max-h-[70vh] w-full rounded-xl bg-black" />
        {previewError && <p role="status" className="mt-3 text-sm text-slate-500">视频暂时无法播放</p>}
      </div>
    </OverlayPortal>}
  </div>;
}

function VideoAnalysisProgress({ progress }: { progress: number }) {
  const items = ["爆款结构分析", "角色主体分析", "场景主体分析", "商品与道具分析"];
  return <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto px-6 py-8"><div className="w-full max-w-3xl text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm"><FileSearch className="h-8 w-8" /></div><h2 className="mt-5 text-xl font-bold text-slate-900">视频分析中</h2><p className="mt-2 text-sm text-slate-400">正在分析爆款结构、角色、场景、商品与道具，请耐心等待...</p><section className="mt-8 grid grid-cols-4 gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{items.map((label, index) => { const value = Math.max(0, Math.min(100, progress - index * 6)); return <div key={label} className="flex flex-col items-center"><div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `conic-gradient(#7c3aed ${value * 3.6}deg, #e2e8f0 0deg)` }}><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700">{value}%</span></div><p className="mt-3 text-xs font-semibold text-slate-600">{label}</p></div>; })}</section></div></div>;
}

function StoryboardAnalysisProgress({ progress }: { progress: number }) {
  const items = ["视频内容拆分", "镜头描述生成", "主体引用匹配", "台词旁白整理"];
  return <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto px-6 py-8"><div className="w-full max-w-3xl text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm"><FileSearch className="h-8 w-8" /></div><h2 className="mt-5 text-xl font-bold text-slate-900">分镜解析中</h2><p className="mt-2 text-sm text-slate-400">正在拆分电商视频内容并生成分镜描述，请耐心等待...</p><section className="mt-8 grid grid-cols-4 gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{items.map((label, index) => { const value = Math.max(0, Math.min(100, progress - index * 7)); return <div key={label} className="flex flex-col items-center"><div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `conic-gradient(#7c3aed ${value * 3.6}deg, #e2e8f0 0deg)` }}><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700">{value}%</span></div><p className="mt-3 text-xs font-semibold text-slate-600">{label}</p></div>; })}</section></div></div>;
}

function CompactSourceSetting({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <label className="flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100"><span className="text-slate-500">{icon}</span><span className="whitespace-nowrap">{label}</span><span className="mx-1 h-4 border-l border-slate-200" />{children}</label>;
}

function RatioDropdown({ value, disabled, onChange }: { value: VideoRatio; disabled: boolean; onChange: (value: VideoRatio) => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const options: VideoRatio[] = ["16:9", "4:3", "3:4", "9:16", "21:9"];

  return <div className="relative">
    <button ref={buttonRef} type="button" disabled={disabled} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex min-w-40 items-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-50 px-3.5 py-2 text-left text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"><Video className="h-3.5 w-3.5 text-slate-500" /><span>比例</span><span className="mx-1 h-4 border-l border-slate-200" /><span className="flex-1">{value}</span><ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} /></button>
    {open && <AnchoredPopover anchorRef={buttonRef} align="end" width={176} onClose={() => setOpen(false)} className="rounded-lg border border-slate-200 bg-white p-2 shadow-xl"><p className="px-2 pb-1.5 pt-0.5 text-xs text-slate-400">比例</p><div className="space-y-0.5">{options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm font-medium ${value === option ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}><RatioGlyph ratio={option} /><span>{option}</span></button>)}</div></AnchoredPopover>}
  </div>;
}

function RatioGlyph({ ratio }: { ratio: VideoRatio }) {
  const sizeClass: Record<VideoRatio, string> = {
    "16:9": "h-4 w-7",
    "4:3": "h-5 w-6",
    "3:4": "h-6 w-4",
    "9:16": "h-7 w-3.5",
    "21:9": "h-3 w-8",
  };
  return <span className="flex h-7 w-8 shrink-0 items-center justify-center"><span className={`rounded-sm border-2 border-slate-500 ${sizeClass[ratio]}`} /></span>;
}

interface SubjectsStepProps {
  subjects: RemakeSubject[];
  subjectTab: SubjectType;
  selectedSubject: RemakeSubject | null;
  currentCandidate?: CandidateImage;
  operation: { key: string; label: string; progress: number } | null;
  onTab: (type: SubjectType) => void;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<RemakeSubject>) => void;
  onGenerate: (subject: RemakeSubject, config: SubjectGenerationConfig) => void;
  onChooseImage: (id: string, target?: SubjectImageTarget) => void;
  onLightbox: (url: string) => void;
  onAdd: (type: SubjectType) => void;
  onConfigureVoice: (id: string) => void;
  onMerge: (id: string) => void;
  onIndependent: (id: string) => void;
  onDelete: (id: string, deletePersonGroup?: boolean) => void;
  onContinue: () => void;
}

function SubjectsStep({ subjects, subjectTab, selectedSubject, currentCandidate, operation, onTab, onSelect, onUpdate, onGenerate, onChooseImage, onLightbox, onAdd, onConfigureVoice, onMerge, onIndependent, onDelete, onContinue }: SubjectsStepProps) {
  const visible = subjects.filter((item) => item.type === subjectTab);
  const addLabel: Record<SubjectType, string> = { person: "添加角色", scene: "添加场景", product: "添加道具" };
  const [expandedPersonGroups, setExpandedPersonGroups] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const personGroups = useMemo(() => {
    const groups: Array<{ key: string; items: RemakeSubject[] }> = [];
    visible.forEach((item) => {
      const key = getPersonGroupName(item.name);
      const group = groups.find((entry) => entry.key === key);
      if (group) group.items.push(item);
      else groups.push({ key, items: [item] });
    });
    return groups;
  }, [visible]);
  const personRoleCount = new Set(subjects.filter((item) => item.type === "person").map((item) => getPersonGroupName(item.name))).size;
  const visibleSubjectCount = subjectTab === "person" ? personGroups.length : visible.length;
  const expandableGroupKeys = subjectTab === "person" ? personGroups.filter((group) => group.items.length > 1).map((group) => group.key) : [];
  const allPersonGroupsExpanded = expandableGroupKeys.length > 0 && expandableGroupKeys.every((key) => expandedPersonGroups.includes(key));
  const displayedSubjects = subjectTab === "person"
    ? personGroups.flatMap((group) => expandedPersonGroups.includes(group.key)
      ? group.items.map((subject, index) => ({ subject, groupKey: group.key, stackSize: 1, groupPrimary: index === 0 }))
      : [{ subject: group.items[0], groupKey: group.key, stackSize: group.items.length, groupPrimary: true }])
    : visible.map((subject) => ({ subject, groupKey: subject.id, stackSize: 1, groupPrimary: true }));

  const expandPersonGroup = (groupKey: string) => {
    if (!expandedPersonGroups.includes(groupKey)) {
      setExpandedPersonGroups((current) => [...current, groupKey]);
    }
  };

  const openSubjectSettings = (subjectId: string) => {
    onSelect(subjectId);
    setSettingsOpen(true);
  };

  return <div className="relative flex h-full min-h-0 flex-col">
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3"><div className="flex items-center gap-1">{(Object.keys(TYPE_META) as SubjectType[]).map((type) => { const MetaIcon = TYPE_META[type].icon; const count = type === "person" ? personRoleCount : subjects.filter((item) => item.type === type).length; return <button key={type} onClick={() => { setSettingsOpen(false); onTab(type); onSelect(null); }} className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold ${subjectTab === type ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50"}`}><MetaIcon className="h-3.5 w-3.5" />{TYPE_META[type].label}<span className="rounded bg-white px-1.5 py-0.5 text-[10px]">{count}</span></button>; })}</div><div className="text-xs text-slate-500">已替换 <b className="text-emerald-600">{subjects.filter((item) => item.selectedCandidateId).length}</b> / {subjects.length}</div></div>
    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-2.5"><div className="flex items-center gap-2"><button disabled={!!operation} onClick={() => onAdd(subjectTab)} className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-40"><Plus className="h-3.5 w-3.5" />{addLabel[subjectTab]}</button>{subjectTab === "person" && <button disabled={!!operation || expandableGroupKeys.length === 0} onClick={() => setExpandedPersonGroups(allPersonGroupsExpanded ? [] : expandableGroupKeys)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40">{allPersonGroupsExpanded ? "一键收起" : "一键展开"}</button>}</div><span className="text-[10px] text-slate-400">{TYPE_META[subjectTab].label}共 {visibleSubjectCount} 个</span></div>
    <div className={`grid min-h-0 flex-1 overflow-hidden ${settingsOpen && selectedSubject ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-1"}`}>
      <div className="overflow-y-auto p-5">{visible.length ? <div className={`grid items-start gap-4 ${settingsOpen && selectedSubject ? "grid-cols-2" : "grid-cols-4"}`}>{displayedSubjects.map(({ subject: item, groupKey, stackSize, groupPrimary }) => {
        const stacked = subjectTab === "person" && stackSize > 1;
        return <div key={item.id} className={`relative min-w-0 ${stacked ? "mb-2 mr-2" : ""}`}>
          {stacked && <><span className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg border border-slate-200 bg-white" /><span className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg border border-slate-200 bg-white" /></>}
          <RemakeSubjectCard subject={item} selected={selectedSubject?.id === item.id} personCount={subjects.filter((entry) => entry.type === "person").length} stacked={stacked} isPrimaryPerson={groupPrimary} showVoiceButton={groupPrimary} onSelect={() => { if (stacked) { expandPersonGroup(groupKey); return; } openSubjectSettings(item.id); }} onReplaceOriginal={() => onChooseImage(item.id, "original")} onReplaceCandidate={() => onChooseImage(item.id, "candidate")} onRenameOriginal={(name) => onUpdate(item.id, { originalName: name })} onRenameCandidate={(name) => onUpdate(item.id, { replacementName: name })} onConfigureVoice={() => onConfigureVoice(item.id)} onMerge={() => onMerge(item.id)} onIndependent={() => onIndependent(item.id)} onDelete={() => onDelete(item.id, item.type === "person" && groupPrimary)} />
        </div>;
      })}</div> : <div className="flex h-full min-h-56 flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-300"><ImageIcon className="h-5 w-5" /></div><p className="mt-3 text-xs font-semibold text-slate-500">暂无{TYPE_META[subjectTab].label}</p><button onClick={() => onAdd(subjectTab)} className="mt-3 text-xs font-semibold text-violet-700">{addLabel[subjectTab]}</button></div>}</div>
      {settingsOpen && selectedSubject && <SubjectSettingsPanel subject={selectedSubject} currentCandidate={currentCandidate} operation={operation} onClose={() => { setSettingsOpen(false); onSelect(null); }} onUpdate={onUpdate} onGenerate={onGenerate} onChooseImage={onChooseImage} onLightbox={onLightbox} />}
    </div>
    <div className={`pointer-events-none absolute inset-x-0 bottom-5 z-20 grid ${settingsOpen && selectedSubject ? "grid-cols-2" : "grid-cols-1"}`}>
      <div className="flex items-center justify-center px-6"><button disabled={!!operation} onClick={onContinue} className="pointer-events-auto flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-violet-700 disabled:opacity-40">分镜解析<ChevronRight className="h-4 w-4" /></button></div>
    </div>
  </div>;
}

function SubjectSettingsPanel({ subject, currentCandidate, operation, onClose, onUpdate, onGenerate, onChooseImage, onLightbox }: { subject: RemakeSubject; currentCandidate?: CandidateImage; operation: { key: string; label: string; progress: number } | null; onClose: () => void; onUpdate: (id: string, patch: Partial<RemakeSubject>) => void; onGenerate: (subject: RemakeSubject, config: SubjectGenerationConfig) => void; onChooseImage: (id: string, target?: SubjectImageTarget) => void; onLightbox: (url: string) => void }) {
  const [previewCandidateId, setPreviewCandidateId] = useState<string | null>(subject.selectedCandidateId ?? null);
  const [imageModel, setImageModel] = useState<SubjectImageModel>("Doubao-Seedream-5.0-Pro");
  const [imageCount, setImageCount] = useState<SubjectImageCount>(1);
  const [imageResolution, setImageResolution] = useState<SubjectImageResolution>("1k");
  const [imageRatio, setImageRatio] = useState<SubjectImageRatio>("16:9");
  const [imageQuality, setImageQuality] = useState<SubjectImageQuality>("Low");
  useEffect(() => {
    setPreviewCandidateId(subject.selectedCandidateId ?? null);
  }, [subject.id, subject.selectedCandidateId]);

  useEffect(() => {
    setImageModel("Doubao-Seedream-5.0-Pro");
    setImageCount(1);
    setImageResolution("1k");
    setImageRatio("16:9");
    setImageQuality("Low");
  }, [subject.id]);

  const previewCandidate = subject.candidates.find((item) => item.id === previewCandidateId);
  const displayImage = previewCandidate?.image;
  const replacementName = subject.replacementName || subject.originalName;
  const displayName = previewCandidate ? replacementName : "暂未配置新图片";
  const currentImage = currentCandidate?.image;
  const currentName = currentCandidate ? replacementName : "暂未配置新图片";
  const otherCandidates = [...subject.candidates]
    .reverse()
    .filter((candidate) => candidate.id !== subject.selectedCandidateId);
  const latestCandidates = otherCandidates.slice(0, 3);
  const historyCandidates = otherCandidates.slice(3);
  const previewIsCurrent = previewCandidateId === (subject.selectedCandidateId ?? null);
  const supportsDetailedSettings = imageModel !== "Doubao-Seedream-5.0-lite" && imageModel !== "Doubao-Seedream-4.5";
  const resolutionOptions: SubjectImageResolution[] = imageModel === "旗舰 Pro" ? ["1k", "2k", "4k"] : ["1k", "2k"];
  const generationCost = subjectImageCost(imageModel, imageCount, imageResolution, imageQuality);
  const referenceImages = subject.referenceImages ?? [];
  const changeModel = (model: SubjectImageModel) => {
    setImageModel(model);
    if (model !== "旗舰 Pro" && imageResolution === "4k") setImageResolution("2k");
  };
  const confirmCurrentImage = () => {
    onUpdate(subject.id, { selectedCandidateId: previewCandidateId ?? undefined });
  };

  return <aside className="flex min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
      <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{displayName}</h3>
      <a href={displayImage || undefined} download={displayName} target="_blank" rel="noreferrer" title="下载图片" className={`flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 ${displayImage ? "" : "pointer-events-none opacity-30"}`}><Download className="h-4 w-4" /></a>
      <button onClick={confirmCurrentImage} className="flex h-8 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"><Check className="h-3.5 w-3.5" />确认{TYPE_META[subject.type].label}</button>
      <button onClick={onClose} title="关闭" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
    </div>

    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_80px] overflow-hidden">
      <div className="flex min-h-0 flex-col">
        <div className="h-[280px] shrink-0 p-5 pb-0">
          <button disabled={!displayImage} onClick={() => displayImage && onLightbox(displayImage)} className="flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-slate-100 disabled:cursor-default">
            {displayImage ? <img src={displayImage} alt={displayName} className="h-full w-full object-contain" referrerPolicy="no-referrer" /> : <span className="flex flex-col items-center gap-2 text-xs text-slate-300"><ImageIcon className="h-8 w-8" />暂未配置新图片</span>}
          </button>
        </div>

        <div className="mt-5 min-h-0 flex-1 bg-white px-4 pb-4">
          <div className="flex h-full min-h-0 flex-col rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Sparkles className="h-4 w-4 text-violet-600" />Agent 生成形象</div>
              <button disabled={!!operation} onClick={() => onChooseImage(subject.id)} className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-40"><FolderOpen className="h-3.5 w-3.5" />选择图片</button>
            </div>
            <div className="mt-3 flex shrink-0 items-start gap-2 overflow-x-auto pb-1">
              {referenceImages.map((image, index) => <div key={image.id} className="group relative w-9 shrink-0">
                <img src={image.image} alt={image.name} className="h-9 w-9 rounded object-cover ring-1 ring-slate-200" referrerPolicy="no-referrer" />
                <button type="button" disabled={!!operation} onClick={() => onUpdate(subject.id, { referenceImages: referenceImages.filter((item) => item.id !== image.id).map((item, nextIndex) => ({ ...item, name: `图片${nextIndex + 1}` })) })} title="删除参考图" className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-black/65 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100 disabled:hidden"><Trash2 className="h-2.5 w-2.5" /></button>
                <p className="mt-1 truncate text-center text-[9px] leading-3 text-slate-400">图片{index + 1}</p>
              </div>)}
              {referenceImages.length < 10 && <button type="button" disabled={!!operation} onClick={() => onChooseImage(subject.id, "reference")} title="添加参考图" className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-700 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>}
            </div>
            <textarea value={subject.prompt} onChange={(event) => onUpdate(subject.id, { prompt: event.target.value })} disabled={!!operation} rows={3} className="mt-2 min-h-0 w-full flex-1 resize-none border-0 p-0 text-xs leading-6 text-slate-700 outline-none placeholder:text-slate-300" placeholder="输入形象生成提示词" />
            <div className="relative z-30 mt-3 flex shrink-0 items-center gap-1.5 border-t border-slate-100 pt-3">
              <GenerationSelect value={imageModel} options={SUBJECT_IMAGE_MODELS} onChange={changeModel} disabled={!!operation} className="w-[200px]" icon={<Sparkles className="h-3.5 w-3.5" />} />
              <GenerationSelect<SubjectImageCount> value={imageCount} options={SUBJECT_IMAGE_COUNTS} onChange={setImageCount} disabled={!!operation} formatLabel={(value) => `${value}张`} className="w-[72px]" />
              {supportsDetailedSettings && <GenerationSelect<SubjectImageResolution> value={imageResolution} options={resolutionOptions} onChange={setImageResolution} disabled={!!operation} className="w-[62px]" />}
              {supportsDetailedSettings && <GenerationSelect<SubjectImageRatio> value={imageRatio} options={SUBJECT_IMAGE_RATIOS} onChange={setImageRatio} disabled={!!operation} className="w-[72px]" menuClassName="max-h-56 overflow-y-auto" />}
              {imageModel === "VisionGenesis" && <GenerationSelect<SubjectImageQuality> value={imageQuality} options={SUBJECT_IMAGE_QUALITIES} onChange={setImageQuality} disabled={!!operation} className="w-[82px]" />}
              <button disabled={!!operation || !subject.prompt.trim()} onClick={() => onGenerate(subject, { model: imageModel, count: imageCount, resolution: imageResolution, ratio: imageRatio, quality: imageQuality, cost: generationCost })} className="ml-auto flex h-8 min-w-[76px] shrink-0 items-center justify-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" />{generationCost}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white px-3 py-5 scrollbar-thin">
        <p className="text-xs font-semibold text-slate-500">当前</p>
        <button disabled={!currentImage} onClick={() => setPreviewCandidateId(subject.selectedCandidateId ?? null)} title={currentName} className={`mt-2 block aspect-square w-full overflow-hidden rounded-md border-2 bg-slate-100 disabled:border-slate-200 ${previewIsCurrent ? "border-violet-500" : "border-transparent hover:border-violet-200"}`}>
          {currentImage ? <img src={currentImage} alt={currentName} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <ImageIcon className="m-auto h-5 w-5 text-slate-300" />}
        </button>
        {latestCandidates.length > 0 && <><p className="mt-5 text-xs font-semibold text-slate-500">最新</p><div className="mt-2 space-y-2">{latestCandidates.map((candidate) => <button key={candidate.id} onClick={() => setPreviewCandidateId(candidate.id)} title={replacementName} className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-slate-100 ${previewCandidateId === candidate.id ? "border-violet-500" : "border-transparent hover:border-violet-200"}`}><img src={candidate.image} alt={replacementName} className="h-full w-full object-cover" referrerPolicy="no-referrer" /></button>)}</div></>}
        {historyCandidates.length > 0 && <><p className="mt-5 text-xs font-semibold text-slate-500">历史</p><div className="mt-2 space-y-2">{historyCandidates.map((candidate) => <button key={candidate.id} onClick={() => setPreviewCandidateId(candidate.id)} title={replacementName} className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-slate-100 ${previewCandidateId === candidate.id ? "border-violet-500" : "border-transparent hover:border-violet-200"}`}><img src={candidate.image} alt={replacementName} className="h-full w-full object-cover" referrerPolicy="no-referrer" /></button>)}</div></>}
      </div>
    </div>
  </aside>;
}

function GenerationSelect<T extends string | number>({ value, options, onChange, disabled = false, formatLabel, className = "", menuClassName = "", icon }: { value: T; options: readonly T[]; onChange: (value: T) => void; disabled?: boolean; formatLabel?: (value: T) => string; className?: string; menuClassName?: string; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const label = (item: T) => formatLabel ? formatLabel(item) : String(item);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return <div className={`relative shrink-0 ${className}`}>
    <button ref={buttonRef} type="button" disabled={disabled} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-8 w-full items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-700 hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-40">
      {icon}<span className="min-w-0 flex-1 truncate text-left">{label(value)}</span><ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <AnchoredPopover anchorRef={buttonRef} side="top" matchAnchorWidth onClose={() => setOpen(false)} className={`rounded-md border border-slate-200 bg-white p-1 shadow-xl ${menuClassName}`}>
      {options.map((option) => <button key={String(option)} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`flex w-full items-center rounded px-3 py-2 text-left text-xs whitespace-nowrap ${option === value ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}>{label(option)}</button>)}
    </AnchoredPopover>}
  </div>;
}

function getPersonGroupName(name: string) {
  const normalized = name.trim().replace(/\s+\d+$/, "");
  return normalized.split(/\s*[-—_（(]\s*/)[0] || normalized;
}

function getSubjectAppearanceLabel(subject: RemakeSubject, allSubjects: RemakeSubject[]) {
  if (subject.type !== "person") return "主形象";
  const groupName = getPersonGroupName(subject.name);
  const groupSubjects = allSubjects.filter((item) => item.type === "person" && getPersonGroupName(item.name) === groupName);
  const imageIndex = groupSubjects.findIndex((item) => item.id === subject.id);
  return imageIndex > 0 ? `变装${imageIndex}` : "主形象";
}

function RemakeSubjectCard({ subject, selected, personCount, stacked = false, isPrimaryPerson = false, showVoiceButton = true, onSelect, onReplaceOriginal, onReplaceCandidate, onRenameOriginal, onRenameCandidate, onConfigureVoice, onMerge, onIndependent, onDelete }: { subject: RemakeSubject; selected: boolean; personCount: number; stacked?: boolean; isPrimaryPerson?: boolean; showVoiceButton?: boolean; onSelect: () => void; onReplaceOriginal: () => void; onReplaceCandidate: () => void; onRenameOriginal: (name: string) => void; onRenameCandidate: (name: string) => void; onConfigureVoice: () => void; onMerge: () => void; onIndependent: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const candidate = subject.candidates.find((entry) => entry.id === subject.selectedCandidateId);

  return <article onClick={onSelect} className={`relative cursor-pointer rounded-lg border bg-white p-2.5 text-left ${selected ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300"}`}>
    <div className="grid grid-cols-2 gap-2">
      <div className="min-w-0">
        <SubjectImage label="原" src={subject.originalImage} onReplace={onReplaceOriginal} />
        <EditableImageName value={subject.originalName} onChange={onRenameOriginal} />
      </div>
      <div className="min-w-0">
        <SubjectImage label="新" src={candidate?.image} onReplace={onReplaceCandidate} />
        {candidate ? <EditableImageName value={subject.replacementName || subject.originalName} onChange={onRenameCandidate} /> : <div className="mt-2 h-7" />}
      </div>
    </div>
    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
      {subject.type === "person" ? <>
        {showVoiceButton ? <button onClick={(event) => { event.stopPropagation(); onConfigureVoice(); }} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Volume2 className="h-3.5 w-3.5" />配置音色</button> : <span />}
        <div className="relative">
          <button ref={moreButtonRef} onClick={(event) => { event.stopPropagation(); setMenuOpen((current) => !current); }} title="更多操作" className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Ellipsis className="h-4 w-4" /></button>
          {menuOpen && <AnchoredPopover anchorRef={moreButtonRef} side="top" align="end" width={128} onClose={() => setMenuOpen(false)} className="rounded-md border border-slate-200 bg-white p-1.5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <button disabled={personCount < 2} onClick={() => { setMenuOpen(false); onMerge(); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"><Combine className="h-3.5 w-3.5" />合并去重</button>
            <button onClick={() => { setMenuOpen(false); onIndependent(); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" />独立形象</button>
            <button onClick={() => { setMenuOpen(false); setDeleteConfirmOpen(true); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />删除</button>
          </AnchoredPopover>}
          {deleteConfirmOpen && <SubjectDeletePopover anchorRef={moreButtonRef} type={subject.type} primaryPerson={isPrimaryPerson} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { setDeleteConfirmOpen(false); onDelete(); }} />}
        </div>
      </> : <><span /><div className="relative"><button ref={deleteButtonRef} onClick={(event) => { event.stopPropagation(); setDeleteConfirmOpen(true); }} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" />删除</button>{deleteConfirmOpen && <SubjectDeletePopover anchorRef={deleteButtonRef} type={subject.type} primaryPerson={false} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { setDeleteConfirmOpen(false); onDelete(); }} />}</div></>}
    </div>
  </article>;
}

function SubjectDeletePopover({ anchorRef, type, primaryPerson, onCancel, onConfirm }: { anchorRef: React.RefObject<HTMLElement | null>; type: SubjectType; primaryPerson: boolean; onCancel: () => void; onConfirm: () => void }) {
  const copy = type === "person"
    ? primaryPerson
      ? { title: "确定要删除角色主形象吗？", description: "主形象删除后所有变装和历史生图记录均不可恢复，请谨慎操作！" }
      : { title: "确定要删除角色变装形象吗？", description: "变装形象删除后该变装下的历史生图记录均不可恢复，请谨慎操作！" }
    : type === "scene"
      ? { title: "确定要删除场景吗？", description: "场景删除后不可恢复，请谨慎操作！" }
      : { title: "确定要删除道具吗？", description: "道具删除后不可恢复，请谨慎操作！" };

  return <AnchoredPopover anchorRef={anchorRef} side="top" align="end" width={360} onClose={onCancel} onClick={(event) => event.stopPropagation()} className="cursor-default rounded-lg border border-slate-200 bg-white p-5 text-left shadow-2xl">
    <span className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white" />
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"><AlertCircle className="h-3.5 w-3.5" /></span>
      <div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{copy.title}</p><p className="mt-2 text-xs leading-5 text-slate-600">{copy.description}</p></div>
    </div>
    <div className="mt-5 flex justify-end gap-2.5"><button type="button" onClick={onCancel} className="rounded-md bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">取消</button><button type="button" onClick={onConfirm} className="rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700">删除</button></div>
  </AnchoredPopover>;
}

function EditableImageName({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onChange(next);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) return <input autoFocus value={draft} onClick={(event) => event.stopPropagation()} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") commit(); if (event.key === "Escape") { setDraft(value); setEditing(false); } }} className="mt-2 h-7 w-full rounded-md border border-violet-500 px-2 text-xs text-slate-800 outline-none ring-2 ring-violet-100" />;

  return <button onClick={(event) => { event.stopPropagation(); setEditing(true); }} title="点击修改图片名称" className="mt-2 block h-7 w-full truncate rounded px-1 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-violet-700">{value}</button>;
}

function EditableVideoName({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const next = draft.trim();
    if (next) onChange(next);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) return <input autoFocus value={draft} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") commit(); if (event.key === "Escape") { setDraft(value); setEditing(false); } }} className="h-8 w-64 rounded-md border border-violet-500 bg-white px-3 text-sm font-semibold text-slate-900 outline-none ring-2 ring-violet-100" />;

  return <button disabled={disabled} onClick={() => setEditing(true)} title="修改视频名称" className="flex h-6 max-w-64 items-center gap-2 text-left text-sm font-bold text-slate-900 disabled:cursor-default"><span className="truncate">{value}</span><Pencil className="h-3.5 w-3.5 shrink-0 text-slate-400" /></button>;
}

function StoryboardStep({ source, resolution, subjects, shots, selectedShot, operation, seek, generatedShotCount, onSeek, onSelectShot, onUpdateShot, onGenerateAll, onGenerateShot, onAddShot, onDeleteShot, onNotify }: { source: SourceVideo | null; resolution: VideoResolution; subjects: RemakeSubject[]; shots: StoryboardShot[]; selectedShot: StoryboardShot | null; operation: { key: string; label: string; progress: number } | null; seek: number; generatedShotCount: number; onSeek: (value: number) => void; onSelectShot: (id: string) => void; onUpdateShot: (id: string, patch: Partial<StoryboardShot>) => void; onGenerateAll: () => void; onGenerateShot: (shot: StoryboardShot) => void; onAddShot: (index: number) => void; onDeleteShot: (id: string) => void; onNotify: (message: string) => void }) {
  const initialBatchAvailable = generatedShotCount === 0 && shots.some((item) => item.status === "pending");
  const [subjectFilter, setSubjectFilter] = useState<"all" | SubjectType>("all");
  const [videoPreviewTab, setVideoPreviewTab] = useState<"generated" | "original">("generated");
  const [storyboardModel, setStoryboardModel] = useState<(typeof STORYBOARD_VIDEO_MODELS)[number]>(STORYBOARD_VIDEO_MODELS[0]);
  const [addingSubjectType, setAddingSubjectType] = useState<SubjectType | null>(null);
  const [expandedRoleGroup, setExpandedRoleGroup] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [shotSettingsOpen, setShotSettingsOpen] = useState(false);
  const addPersonButtonRef = useRef<HTMLButtonElement | null>(null);
  const addSceneButtonRef = useRef<HTMLButtonElement | null>(null);
  const addProductButtonRef = useRef<HTMLButtonElement | null>(null);
  const shotSettingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const shotReferenceUploadRef = useRef<HTMLInputElement | null>(null);
  const addSubjectButtonRefs: Record<SubjectType, React.RefObject<HTMLButtonElement | null>> = {
    person: addPersonButtonRef,
    scene: addSceneButtonRef,
    product: addProductButtonRef,
  };
  const referencedSubjects = selectedShot
    ? selectedShot.subjectIds.map((id) => subjects.find((subject) => subject.id === id)).filter((subject): subject is RemakeSubject => !!subject)
    : [];
  const visibleSubjectTypes: SubjectType[] = subjectFilter === "all" ? ["person", "scene", "product"] : [subjectFilter];
  const subjectFilterOptions: Array<{ value: "all" | SubjectType; label: string }> = [
    { value: "all", label: "全部" },
    { value: "person", label: "角色" },
    { value: "scene", label: "场景" },
    { value: "product", label: "道具" },
  ];
  const roleGroups = subjects.filter((subject) => subject.type === "person").reduce<Array<{ name: string; subjects: RemakeSubject[] }>>((groups, subject) => {
    const name = getPersonGroupName(subject.name);
    const existing = groups.find((group) => group.name === name);
    if (existing) existing.subjects.push(subject);
    else groups.push({ name, subjects: [subject] });
    return groups;
  }, []);
  const normalizedSubjectSearch = subjectSearch.trim().toLowerCase();
  const searchedRoleGroups = roleGroups.filter((group) => !normalizedSubjectSearch || group.name.toLowerCase().includes(normalizedSubjectSearch) || group.subjects.some((subject) => subject.name.toLowerCase().includes(normalizedSubjectSearch)));
  useEffect(() => {
    setAddingSubjectType(null);
    setExpandedRoleGroup(null);
    setSubjectSearch("");
    setShotSettingsOpen(false);
  }, [selectedShot?.id]);

  const addReferencedSubject = (subject: RemakeSubject) => {
    if (!selectedShot || selectedShot.subjectIds.includes(subject.id)) return;
    onUpdateShot(selectedShot.id, {
      subjectIds: [...selectedShot.subjectIds, subject.id],
    });
    setAddingSubjectType(null);
    setExpandedRoleGroup(null);
    setSubjectSearch("");
  };

  const uploadShotReferences = (files?: FileList | null) => {
    if (!selectedShot || !files?.length) return;
    const currentReferences = selectedShot.referenceImages ?? [];
    const remainingCount = Math.max(0, 30 - currentReferences.length);
    if (!remainingCount) return onNotify("当前分镜最多上传 30 张参考图");
    const validFiles = Array.from(files).filter((file) => {
      if (!/\.(jpe?g|png|webp|bmp|tiff?|gif)$/i.test(file.name)) return false;
      return file.size < 30 * 1024 * 1024;
    });
    const acceptedFiles = validFiles.slice(0, remainingCount);
    if (acceptedFiles.length < files.length) onNotify(validFiles.length > remainingCount ? `最多还能上传 ${remainingCount} 张参考图` : "已忽略不支持或超过 30MB 的图片");
    if (!acceptedFiles.length) return;
    const createdAt = Date.now();
    const nextReferences = [...currentReferences, ...acceptedFiles.map((file, index) => ({
      id: `${selectedShot.id}-reference-${createdAt}-${index}`,
      name: file.name,
      image: URL.createObjectURL(file),
      source: "本地上传" as const,
    }))].map((image, index) => ({ ...image, name: `图片${index + 1}` }));
    onUpdateShot(selectedShot.id, { referenceImages: nextReferences });
  };

  const selectCurrentVersion = (versionId: string) => {
    if (!selectedShot) return;
    const versions = getStoryboardVersions(selectedShot);
    const selectedVersion = versions.find((version) => version.id === versionId);
    if (!selectedVersion || selectedShot.currentVersionId === versionId) return;
    onUpdateShot(selectedShot.id, {
      cover: selectedVersion.cover,
      currentVersionId: selectedVersion.id,
      versions: [selectedVersion, ...versions.filter((version) => version.id !== selectedVersion.id)],
    });
  };

  return <div className="grid h-full min-h-0 grid-cols-[240px_minmax(0,1fr)] overflow-hidden">
    <aside className="relative z-30 min-h-0 overflow-visible border-r border-slate-200 bg-white p-4">
      <div className="grid grid-cols-4 rounded-md bg-slate-100 p-1">
        {subjectFilterOptions.map((option) => <button key={option.value} type="button" onClick={() => { setSubjectFilter(option.value); setAddingSubjectType(null); setExpandedRoleGroup(null); setSubjectSearch(""); }} className={`rounded px-2 py-1.5 text-[10px] font-semibold ${subjectFilter === option.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{option.label}</button>)}
      </div>
      <div className="mt-4 space-y-5">
        {visibleSubjectTypes.map((type) => {
          const typeSubjects = referencedSubjects.filter((subject) => subject.type === type);
          const sectionLabel: Record<SubjectType, string> = { person: "角色", scene: "场景", product: "道具" };
          const availableSubjects = subjects.filter((subject) => subject.type === type && !selectedShot?.subjectIds.includes(subject.id) && subject.name.toLowerCase().includes(subjectSearch.trim().toLowerCase()));
          const selectedRoleGroup = roleGroups.find((group) => group.name === expandedRoleGroup);
          return <section key={type}>
            <div className="relative mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">{sectionLabel[type]}</h3>
              <button ref={addSubjectButtonRefs[type]} type="button" disabled={!!operation} onClick={() => { setAddingSubjectType((current) => current === type ? null : type); setExpandedRoleGroup(null); setSubjectSearch(""); }} title={`添加${sectionLabel[type]}`} className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-violet-700 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
              {addingSubjectType === type && <AnchoredPopover anchorRef={addSubjectButtonRefs[type]} align="end" width={type === "person" && expandedRoleGroup ? 416 : 208} onClose={() => { setAddingSubjectType(null); setExpandedRoleGroup(null); setSubjectSearch(""); }} className="rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="p-2"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input autoFocus value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder="请输入" className="h-9 w-full rounded-md border border-slate-200 pl-8 pr-2 text-xs outline-none focus:border-violet-400" /></div></div>
                {type === "person" ? <div className={`grid min-h-56 border-t border-slate-100 ${expandedRoleGroup ? "grid-cols-2" : "grid-cols-1"}`}>
                  <div className={`max-h-72 overflow-y-auto p-2 ${expandedRoleGroup ? "border-r border-slate-200" : ""}`}>
                    {searchedRoleGroups.map((group) => { const first = group.subjects[0]; const candidate = first.candidates.find((entry) => entry.id === first.selectedCandidateId); const image = candidate?.image || first.originalImage; return <button key={group.name} type="button" onClick={() => setExpandedRoleGroup(group.name)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left ${expandedRoleGroup === group.name ? "bg-violet-50 text-violet-700" : "hover:bg-slate-50"}`}>{image ? <img src={image} alt="" className="h-7 w-7 shrink-0 rounded object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100"><UserRound className="h-3.5 w-3.5 text-slate-300" /></span>}<span className="min-w-0 flex-1 truncate text-[10px] font-semibold">{group.name}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /></button>; })}
                    {!searchedRoleGroups.length && <div className="flex h-20 items-center justify-center text-[10px] text-slate-400">暂无角色</div>}
                  </div>
                  {expandedRoleGroup && <div className="max-h-72 overflow-y-auto p-2">
                    {selectedRoleGroup?.subjects.map((subject) => { const candidate = subject.candidates.find((entry) => entry.id === subject.selectedCandidateId); const image = candidate?.image || subject.originalImage; const alreadyReferenced = !!selectedShot?.subjectIds.includes(subject.id); return <button key={subject.id} type="button" disabled={alreadyReferenced} onClick={() => addReferencedSubject(subject)} title={alreadyReferenced ? "当前分镜已引用该形象" : undefined} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-45">{image ? <img src={image} alt="" className="h-7 w-7 shrink-0 rounded object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100"><ImageIcon className="h-3.5 w-3.5 text-slate-300" /></span>}<span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-700">{subject.name}</span></button>; })}
                  </div>}
                </div> : <div className="max-h-72 min-h-56 overflow-y-auto border-t border-slate-100 p-2">
                  {availableSubjects.map((subject) => { const candidate = subject.candidates.find((entry) => entry.id === subject.selectedCandidateId); const image = candidate?.image || subject.originalImage; return <button key={subject.id} type="button" onClick={() => addReferencedSubject(subject)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50">{image ? <img src={image} alt="" className="h-7 w-7 shrink-0 rounded object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100"><ImageIcon className="h-3.5 w-3.5 text-slate-300" /></span>}<span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-700">{subject.name}</span></button>; })}
                  {!availableSubjects.length && <div className="flex h-20 items-center justify-center text-[10px] text-slate-400">暂无可添加主体</div>}
                </div>}
              </AnchoredPopover>}
            </div>
            <div className={`grid gap-x-2 gap-y-3 ${type === "person" ? "grid-cols-2" : "grid-cols-1"}`}>
              {typeSubjects.map((item) => {
                const candidate = item.candidates.find((entry) => entry.id === item.selectedCandidateId);
                const image = candidate?.image || item.originalImage;
                return <div key={item.id} className="min-w-0">
                  {image ? <img src={image} alt="" className={`${type === "person" ? "aspect-square" : "aspect-video"} w-full rounded-md object-cover`} referrerPolicy="no-referrer" /> : <div className={`flex ${type === "person" ? "aspect-square" : "aspect-video"} w-full items-center justify-center rounded-md bg-slate-100`}><ImageIcon className="h-5 w-5 text-slate-300" /></div>}
                  <p className="mt-1 truncate text-[10px] font-semibold text-slate-600">{item.name}</p>
                  <p className="text-[9px] text-slate-400">{getSubjectAppearanceLabel(item, subjects)}</p>
                </div>;
              })}
              {!typeSubjects.length && <p className="col-span-full py-3 text-center text-[10px] text-slate-400">当前分镜未引用{sectionLabel[type]}</p>}
            </div>
          </section>;
        })}
      </div>
    </aside>

    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        {selectedShot && <div className="grid h-full min-w-0 grid-cols-[minmax(420px,1fr)_500px] overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden p-5">
            <div className="flex shrink-0 items-center justify-between"><div><h2 className="text-base font-bold text-slate-900">{selectedShot.title}</h2><p className="mt-1 text-xs text-slate-400">内容自动保存</p></div>{initialBatchAvailable && <button disabled={!!operation} onClick={onGenerateAll} className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40"><Sparkles className="h-4 w-4" />生成全部分镜 <span className="rounded bg-violet-500 px-1.5 py-0.5">{(shots.length * STORYBOARD_GENERATION_COST).toLocaleString()}积分</span></button>}</div>
            <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex shrink-0 flex-wrap items-start gap-2">
                {(selectedShot.referenceImages ?? []).map((image, index) => <div key={image.id} className="group relative w-11 shrink-0">
                  <img src={image.image} alt={image.name} className="h-11 w-11 rounded-md border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                  <button type="button" disabled={!!operation} onClick={() => onUpdateShot(selectedShot.id, { referenceImages: (selectedShot.referenceImages ?? []).filter((item) => item.id !== image.id).map((item, nextIndex) => ({ ...item, name: `图片${nextIndex + 1}` })) })} title="删除参考图" className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded bg-black/65 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100 disabled:hidden"><Trash2 className="h-3 w-3" /></button>
                  <p className="mt-1 truncate text-center text-[9px] text-slate-400">图片{index + 1}</p>
                </div>)}
                {(selectedShot.referenceImages ?? []).length < 30 && <button type="button" disabled={!!operation} onClick={() => shotReferenceUploadRef.current?.click()} title="上传本地参考图" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-700 disabled:opacity-40"><Plus className="h-4 w-4" /></button>}
              </div>
              <input ref={shotReferenceUploadRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,.gif,image/*" className="hidden" onChange={(event) => { uploadShotReferences(event.target.files); event.currentTarget.value = ""; }} />

              <StoryboardDescriptionEditor key={selectedShot.id} shot={selectedShot} subjects={referencedSubjects} allSubjects={subjects} disabled={!!operation} onChange={(description) => onUpdateShot(selectedShot.id, { description, manuallyAdded: selectedShot.manuallyAdded || !selectedShot.description.trim() })} />

              {selectedShot.status === "failed" && <div className="mt-4 rounded-md bg-rose-50 p-3 text-xs text-rose-700"><div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{selectedShot.failureReason}</span></div></div>}
              <div className="mt-4 flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3">
                <GenerationSelect<(typeof STORYBOARD_VIDEO_MODELS)[number]> value={storyboardModel} options={STORYBOARD_VIDEO_MODELS} onChange={setStoryboardModel} disabled={!!operation} className="w-[210px]" icon={<Sparkles className="h-3.5 w-3.5" />} />
                <div className="relative">
                  <button ref={shotSettingsButtonRef} type="button" disabled={!!operation} onClick={() => setShotSettingsOpen((current) => !current)} className="flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-40"><Clock3 className="mr-2 h-3.5 w-3.5 text-slate-400" />{selectedShot.duration}s | {selectedShot.resolution ?? (resolution === "4K" ? "1080p" : resolution)} | {selectedShot.format ?? "mp4"}</button>
                  {shotSettingsOpen && <AnchoredPopover anchorRef={shotSettingsButtonRef} side="top" width={304} onClose={() => setShotSettingsOpen(false)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                    <div><p className="text-xs font-semibold text-slate-400">视频时长</p><div className="mt-3 flex items-center gap-4"><input type="range" min="4" max="30" value={selectedShot.duration} onChange={(event) => onUpdateShot(selectedShot.id, { duration: Number(event.target.value) })} className="min-w-0 flex-1 accent-violet-600" /><span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-700">{selectedShot.duration} s</span></div></div>
                    <div className="mt-5"><p className="text-xs font-semibold text-slate-400">视频清晰度</p><div className="mt-2 grid grid-cols-3 rounded-xl bg-slate-100 p-1">{(["480p", "720p", "1080p"] as const).map((item) => { const active = (selectedShot.resolution ?? (resolution === "4K" ? "1080p" : resolution)) === item; return <button type="button" key={item} onClick={() => onUpdateShot(selectedShot.id, { resolution: item })} className={`h-10 rounded-lg text-xs font-semibold ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{item}</button>; })}</div></div>
                    <div className="mt-5"><p className="text-xs font-semibold text-slate-400">视频格式</p><div className="mt-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1">{(["mp4", "mov"] as const).map((item) => <button type="button" key={item} onClick={() => onUpdateShot(selectedShot.id, { format: item })} className={`h-10 rounded-lg text-xs font-semibold ${(selectedShot.format ?? "mp4") === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{item}</button>)}</div></div>
                  </AnchoredPopover>}
                </div>
                <button disabled={!!operation || !selectedShot.description.trim()} onClick={() => onGenerateShot(selectedShot)} title={selectedShot.status === "completed" ? "重新生成当前分镜" : "生成当前分镜"} className="ml-auto flex h-8 min-w-[104px] items-center justify-center gap-1.5 rounded-md bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" />{STORYBOARD_GENERATION_COST.toLocaleString()}</button>
              </div>
            </div>
          </section>
          <StoryboardVideoPreview sourceCover={source?.cover || ORIGINAL_PERSON} shot={selectedShot} seek={seek} activeTab={videoPreviewTab} onSeek={onSeek} onTab={setVideoPreviewTab} onMakeCurrent={selectCurrentVersion} />
        </div>}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-700">{shots.length} 个分镜</span></div>
        <div className="flex items-stretch overflow-x-auto pb-2">{shots.map((shot, index) => <React.Fragment key={shot.id}><button onClick={() => onAddShot(index)} title="新增分镜" className="group flex w-7 shrink-0 items-center justify-center"><span className="hidden h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white group-hover:flex"><Plus className="h-3.5 w-3.5" /></span></button><article onClick={() => onSelectShot(shot.id)} className={`group relative w-36 shrink-0 cursor-pointer rounded-md border p-1.5 ${selectedShot?.id === shot.id ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200"}`}><div className="relative aspect-video overflow-hidden rounded bg-slate-100">{shot.cover ? <img src={shot.cover} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-full items-center justify-center">{shot.status === "generating" ? <Loader2 className="h-5 w-5 animate-spin text-violet-500" /> : shot.status === "failed" ? <AlertCircle className="h-5 w-5 text-rose-500" /> : <Video className="h-5 w-5 text-slate-300" />}</div>}<button onClick={(event) => { event.stopPropagation(); onDeleteShot(shot.id); }} title="删除分镜" className="absolute right-1 top-1 hidden rounded bg-black/65 p-1.5 text-white group-hover:block"><Trash2 className="h-3 w-3" /></button></div><div className="mt-1.5 flex items-center justify-between text-[10px]"><span className="font-semibold text-slate-600">{shot.title}</span><span className="text-slate-400">{shot.duration}s</span></div></article>{index === shots.length - 1 && <button onClick={() => onAddShot(shots.length)} title="新增分镜" className="group flex w-7 shrink-0 items-center justify-center"><span className="hidden h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white group-hover:flex"><Plus className="h-3.5 w-3.5" /></span></button>}</React.Fragment>)}</div>
      </div>
    </div>
  </div>;
}

function FinalStep({ source, shots, finalName, onUpload }: { source: SourceVideo | null; shots: StoryboardShot[]; finalName: string; onUpload: () => void }) {
  const totalDuration = Math.max(1, shots.reduce((total, shot) => total + shot.duration, 0));
  const allReady = shots.length > 0 && shots.every((shot) => shot.status === "completed" && !!shot.cover);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const activeShotIndex = Math.max(0, shots.findIndex((_, index) => {
    const start = shots.slice(0, index).reduce((total, shot) => total + shot.duration, 0);
    const end = start + shots[index].duration;
    return currentTime >= start && (currentTime < end || (index === shots.length - 1 && currentTime <= end));
  }));
  const activeShot = shots[activeShotIndex];
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  useEffect(() => {
    if (!playing || !allReady || dragging) return;
    const timer = window.setInterval(() => {
      setCurrentTime((current) => {
        const next = Math.min(totalDuration, current + 0.25);
        if (next >= totalDuration) setPlaying(false);
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [allReady, dragging, playing, totalDuration]);

  useEffect(() => {
    if (currentTime > totalDuration) setCurrentTime(0);
  }, [currentTime, totalDuration]);

  const togglePlaying = () => {
    if (!allReady) return;
    if (!playing && currentTime >= totalDuration) setCurrentTime(0);
    setPlaying((current) => !current);
  };

  const seekToShot = (index: number) => {
    const start = shots.slice(0, index).reduce((total, shot) => total + shot.duration, 0);
    setCurrentTime(start);
  };

  const seekFromPointer = (clientX: number, element: HTMLDivElement) => {
    const bounds = element.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    setCurrentTime(ratio * totalDuration);
  };

  const beginTimelineDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event.clientX, event.currentTarget);
  };

  const moveTimelineDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) seekFromPointer(event.clientX, event.currentTarget);
  };

  const endTimelineDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    seekFromPointer(event.clientX, event.currentTarget);
    draggingRef.current = false;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const renderPlayerControls = () => <div className="flex h-16 shrink-0 items-center justify-center gap-4 border-t border-slate-200 bg-white">
    <span className="text-xs font-semibold tabular-nums text-slate-700">{formatTime(currentTime)} <span className="text-slate-400">/ {formatTime(totalDuration)}</span></span>
    <button disabled={!allReady} onClick={togglePlaying} title={playing ? "暂停" : "播放"} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white disabled:cursor-not-allowed disabled:opacity-35">{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button>
  </div>;

  const renderTimelineRuler = () => <div onPointerDown={beginTimelineDrag} onPointerMove={moveTimelineDrag} onPointerUp={endTimelineDrag} onPointerCancel={endTimelineDrag} className="relative h-9 cursor-ew-resize touch-none border-b border-slate-100">
    {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, second) => {
      const major = second % 10 === 0 || second === Math.ceil(totalDuration);
      return <React.Fragment key={second}><span className={`absolute bottom-1 w-px bg-slate-400 ${major ? "h-3" : "h-1.5"}`} style={{ left: `${Math.min(100, second / totalDuration * 100)}%` }} />{major && <span className={`absolute top-0 text-[10px] tabular-nums text-slate-500 ${second === 0 ? "" : second >= totalDuration ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: `${Math.min(100, second / totalDuration * 100)}%` }}>{formatTime(Math.min(second, totalDuration))}</span>}</React.Fragment>;
    })}
  </div>;

  const renderTimeline = (original: boolean) => <section className="relative h-44 min-w-0 rounded-lg border border-slate-200 bg-white px-4 pb-5 pt-3">
    <div className="relative h-full select-none">
      {renderTimelineRuler()}
      <div className="relative mt-1 flex h-[104px] overflow-hidden rounded-md">
        {original ? <button type="button" onClick={() => setCurrentTime(0)} className="w-full min-w-0 rounded-md border border-slate-200 bg-slate-50 p-2 text-left hover:border-violet-300">
          <div className="flex items-center justify-between gap-1 text-[10px]"><span className="truncate font-semibold text-slate-600">原视频</span><span className="shrink-0 text-slate-400">{formatTime(totalDuration)}</span></div>
          <div className="mt-2 flex h-[68px] items-center justify-center overflow-hidden rounded bg-white/70">{source?.cover ? <img src={source.cover} alt="原视频" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-[10px] text-slate-400">原视频不可用</span>}</div>
        </button> : shots.map((shot, index) => {
          const selected = index === activeShotIndex;
          return <button key={shot.id} type="button" onClick={(event) => { event.stopPropagation(); seekToShot(index); }} style={{ width: `${shot.duration / totalDuration * 100}%` }} className={`group min-w-0 border p-2 text-left first:rounded-l-md last:rounded-r-md ${selected ? "z-10 border-violet-500 bg-violet-50" : "border-slate-200 bg-slate-50 hover:border-violet-300"}`}>
            <div className="flex items-center justify-between gap-1 text-[10px]"><span className="truncate font-semibold text-slate-600">{shot.title}</span><span className="shrink-0 text-slate-400">{formatTime(shot.duration)}</span></div>
            <div className="mt-2 flex h-[68px] items-center justify-center overflow-hidden rounded bg-white/70">{shot.status === "completed" && shot.cover ? <img src={shot.cover} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <span className="px-1 text-center text-[10px] text-slate-400">分镜视频未生成</span>}</div>
          </button>;
        })}
      </div>
      <span className="pointer-events-none absolute bottom-0 top-5 z-20 w-px bg-slate-900" style={{ left: `${Math.min(100, currentTime / totalDuration * 100)}%` }}><span className="absolute -left-1 -top-1 h-2.5 w-2 rounded-b-sm bg-slate-900" /></span>
    </div>
  </section>;

  return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 p-5">
    <div className="mb-4 flex shrink-0 items-center gap-3">
      <button type="button" role="switch" aria-checked={compareOriginal} onClick={() => setCompareOriginal((current) => !current)} className="ml-auto flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-violet-300"><span>对比原视频</span><span className={`relative h-5 w-9 rounded-full transition-colors ${compareOriginal ? "bg-violet-600" : "bg-slate-300"}`}><span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${compareOriginal ? "translate-x-4" : "translate-x-0"}`} /></span></button>
      {allReady && activeShot?.cover ? <a href={activeShot.cover} download={finalName} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700"><Download className="h-4 w-4" />下载完整视频</a> : <button disabled className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-400 opacity-60"><Download className="h-4 w-4" />下载完整视频</button>}
      <button disabled={!allReady} onClick={onUpload} className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><Upload className="h-4 w-4" />上传资源库</button>
    </div>

    <div className={`grid min-h-0 flex-1 gap-3 ${compareOriginal ? "grid-cols-2" : "grid-cols-1"}`}>
      {compareOriginal && <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">{source?.cover ? <img src={source.cover} alt="原视频" className="h-full w-full object-contain" referrerPolicy="no-referrer" /> : <div className="text-sm font-semibold text-slate-400">原视频不可用</div>}<span className="absolute left-4 top-4 rounded bg-black/55 px-3 py-1.5 text-xs font-semibold text-white">原视频</span></div>{renderPlayerControls()}</section>}
      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">{activeShot?.status === "completed" && activeShot.cover ? <img src={activeShot.cover} alt={activeShot.title} className="h-full w-full object-contain" referrerPolicy="no-referrer" /> : <div className="flex flex-col items-center text-slate-400"><Video className="h-9 w-9" /><p className="mt-3 text-sm font-semibold">分镜视频未生成</p></div>}<span className="absolute right-4 top-4 rounded bg-black/55 px-3 py-1.5 text-xs font-semibold text-white">{activeShot?.title || "分镜"}</span></div>{renderPlayerControls()}</section>
    </div>

    <div className={`mt-4 grid shrink-0 gap-3 ${compareOriginal ? "grid-cols-2" : "grid-cols-1"}`}>
      {compareOriginal && renderTimeline(true)}
      {renderTimeline(false)}
    </div>
  </div>;
}

function SourceVideoModal({ assets, selected, onClose, onConfirm, showToast }: { assets: Asset[]; selected: SourceVideo | null; onClose: () => void; onConfirm: (item: SourceVideo) => void; showToast: (message: string) => void }) {
  const [tab, setTab] = useState<"library" | "local">("library");
  const [section, setSection] = useState<Exclude<SourceVideo["section"], "本地上传">>(selected?.section === "素材" || selected?.section === "第三方" ? selected.section : "成片");
  const [primaryCategory, setPrimaryCategory] = useState("全部一级分类");
  const [secondaryCategory, setSecondaryCategory] = useState("全部二级分类");
  const [tag, setTag] = useState("全部标签");
  const [status, setStatus] = useState("全部状态");
  const [author, setAuthor] = useState("全部上传人");
  const [onlyMine, setOnlyMine] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [draft, setDraft] = useState<SourceVideo | null>(selected);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const uploaded = useUploadedResources();
  const lifecycle = useThirdPartyLifecycle();
  const { edits } = useResourceEdits<FinishedVideo & { deleted?: boolean }>("thirdParty");
  const thirdPartyBase = useMemo(() => {
    const uniqueVideos = new Map<string, FinishedVideo>();
    for (const video of [...uploaded.filter((item) => item.resourceCategory === "第三方").map(toPublishedVideo), ...assets.filter((item) => item.type === "video" && item.resourceCategory === "第三方").map(toPublishedVideo), ...INITIAL_THIRD_PARTY]) {
      if (!uniqueVideos.has(video.id)) uniqueVideos.set(video.id, video);
    }
    return [...uniqueVideos.values()]
      .filter((video) => (!lifecycle[video.id] || lifecycle[video.id].state === "active") && !edits[video.id]?.deleted)
      .map((video) => ({ ...video, ...edits[video.id] }));
  }, [assets, uploaded, lifecycle, edits]);
  const thirdPartyVideos = useTaggedResources("thirdParty", thirdPartyBase);
  const videos = [...assets.filter((item) => item.type === "video" && (item.resourceCategory === "成片" || item.resourceCategory === "素材")).map((item) => {
    const categories = (item.category || "未分类").split(/\s*[/／]\s*/);
    return {
      source: { id: item.id, name: item.name, url: item.url, cover: item.coverUrl || item.url, size: item.size, duration: item.fileInfo?.duration || "00:30", section: item.resourceCategory as "成片" | "素材" },
      displayId: item.id,
      primaryCategory: categories[0] || "未分类",
      secondaryCategory: categories[1] || "未分类",
      tags: item.publicTags?.length ? item.publicTags : item.tags || [],
      status: item.status || "审核通过",
      author: item.creator || "徐振",
    };
  }), ...thirdPartyVideos.map((video) => {
    const category = parseVideoCategory(video.category);
    return {
      source: { id: video.id, name: video.title, url: video.videoUrl, cover: video.coverUrl, size: video.size, duration: video.duration, section: "第三方" as const },
      displayId: video.numericId || video.id,
      primaryCategory: category.primary || "未分类",
      secondaryCategory: category.secondary || "未分类",
      tags: video.tags || [],
      status: video.status || "待审核",
      author: video.author,
    };
  })];
  const sectionVideos = videos.filter((item) => item.source.section === section);
  const primaryCategories = Array.from(new Set(sectionVideos.map((item) => item.primaryCategory)));
  const secondaryCategories = Array.from(new Set(sectionVideos.filter((item) => primaryCategory === "全部一级分类" || item.primaryCategory === primaryCategory).map((item) => item.secondaryCategory)));
  const tags = Array.from(new Set(sectionVideos.flatMap((item) => item.tags)));
  const statuses = Array.from(new Set(sectionVideos.map((item) => item.status)));
  const authors = Array.from(new Set(sectionVideos.map((item) => item.author)));
  const chosenSource = draft?.section === "第三方" ? videos.find((item) => item.source.id === draft.id)?.source || null : draft;
  const filtered = sectionVideos.filter((item) =>
    (primaryCategory === "全部一级分类" || item.primaryCategory === primaryCategory) &&
    (secondaryCategory === "全部二级分类" || item.secondaryCategory === secondaryCategory) &&
    (tag === "全部标签" || item.tags.includes(tag)) &&
    (status === "全部状态" || item.status === status) &&
    (author === "全部上传人" || item.author === author) &&
    (!onlyMine || item.author === "徐振") &&
    `${item.source.name}${item.source.id}${item.displayId}${item.primaryCategory}${item.secondaryCategory}${item.tags.join("")}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  useEffect(() => setPage(1), [section, primaryCategory, secondaryCategory, tag, status, author, onlyMine, search]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pagedVideos = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const upload = (file?: File) => {
    if (!file) return;
    if (!/\.(mp4|mpeg|mov)$/i.test(file.name)) return showToast("仅支持 mp4、mpeg、mov 格式");
    if (file.size >= 1000 * 1024 * 1024) return showToast("视频文件需小于 1000MB");
    const id = `local-${Date.now()}`;
    const url = URL.createObjectURL(file);
    setDraft({ id, name: file.name, url, cover: ORIGINAL_PERSON, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, duration: "读取中", section: "本地上传" });
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => setDraft((current) => current?.id === id ? { ...current, duration: formatDuration(video.duration) } : current);
    video.onerror = () => setDraft((current) => current?.id === id ? { ...current, duration: "00:30" } : current);
    video.src = url;
  };
  const switchTab = (nextTab: "library" | "local") => {
    setTab(nextTab);
    setDraft((current) => current && (nextTab === "local" ? current.section === "本地上传" : current.section !== "本地上传") ? current : null);
  };
  const switchSection = (nextSection: typeof section) => {
    setSection(nextSection);
    setPrimaryCategory("全部一级分类");
    setSecondaryCategory("全部二级分类");
    setTag("全部标签");
    setStatus("全部状态");
    setAuthor("全部上传人");
    setOnlyMine(false);
    setSearch("");
  };
  return <Modal title="" hideHeader lockBodyScroll onClose={onClose} width="max-w-6xl" footer={<><span className="mr-auto text-xs text-slate-500">已选择 <b className="text-violet-700">{chosenSource ? 1 : 0}</b> 个视频</span><button onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button disabled={!chosenSource} onClick={() => chosenSource && onConfirm(chosenSource)} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">确认选择</button></>}>
    <div className="flex h-full min-h-0 flex-col p-5">
      <div className="mb-5 flex shrink-0 items-center justify-between border-b border-slate-200"><div className="flex items-center gap-1"><TabButton active={tab === "library"} onClick={() => switchTab("library")}>资源库</TabButton><TabButton active={tab === "local"} onClick={() => switchTab("local")}>本地上传</TabButton></div><button onClick={onClose} title="关闭" className="mb-1 rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
      {tab === "library" ? <>
        <div className="mb-4 flex shrink-0 items-center gap-1 border-b border-slate-200">{(["成片", "素材", "第三方"] as const).map((item) => <TabButton key={item} active={section === item} onClick={() => switchSection(item)}>{{ 成片: "成片管理", 素材: "素材管理", 第三方: "第三方管理" }[item]}</TabButton>)}</div>
        <div className="mb-4 flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          <select value={primaryCategory} onChange={(event) => { setPrimaryCategory(event.target.value); setSecondaryCategory("全部二级分类"); }} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部一级分类</option>{primaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={secondaryCategory} onChange={(event) => setSecondaryCategory(event.target.value)} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部二级分类</option>{secondaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={tag} onChange={(event) => setTag(event.target.value)} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option value="全部标签">全部二级标签</option>{tags.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部状态</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={author} onChange={(event) => setAuthor(event.target.value)} className="h-9 w-[130px] shrink-0 whitespace-nowrap rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部上传人</option>{authors.map((item) => <option key={item}>{item}</option>)}</select>
          <div className="relative min-w-[180px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文件名称或 ID" className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-violet-400" /></div>
          <label className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap px-2 text-xs text-slate-600"><input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} className="accent-violet-600" />仅看我的</label>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr><th className="w-12 px-4 py-3"></th><th className="px-3 py-3">文件缩略图</th><th className="px-3 py-3">文件名称 / ID</th><th className="px-3 py-3">状态</th><th className="px-3 py-3">所在分类</th><th className="px-3 py-3">上传人</th><th className="px-3 py-3">时长</th><th className="px-3 py-3">大小</th></tr></thead>
            <tbody>
              {pagedVideos.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">暂无符合条件的视频</td></tr>}
              {pagedVideos.map((item) => {
                const checked = chosenSource?.id === item.source.id;
                return <tr key={item.source.id} aria-selected={checked} onClick={() => setDraft(item.source)} className={`cursor-pointer border-t border-slate-100 ${checked ? "bg-violet-50" : "hover:bg-slate-50"}`}>
                  <td className="px-4 py-3"><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"}`}>{checked && <Check className="h-2.5 w-2.5" />}</span></td>
                  <td className="px-3 py-2"><img src={item.source.cover} alt="" className="h-10 w-16 rounded object-cover" referrerPolicy="no-referrer" /></td>
                  <td className="max-w-[220px] px-3 py-3"><p className="truncate font-semibold text-slate-700">{item.source.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.displayId}</p></td>
                  <td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{item.status}</span></td>
                  <td className="px-3 py-3"><p className="font-semibold text-slate-700">{item.source.section}</p><p className="mt-1 text-[10px] text-slate-400">{item.primaryCategory} / {item.secondaryCategory}</p></td>
                  <td className="px-3 py-3 text-slate-500">{item.author}</td>
                  <td className="px-3 py-3 text-slate-500">{item.source.duration}</td>
                  <td className="px-3 py-3 text-slate-500">{item.source.size}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
      </> : <div className="min-h-0 flex-1 overflow-y-auto"><button onClick={() => uploadRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700"><Upload className="h-6 w-6" /><span className="mt-3 text-xs font-semibold">点击选择本地视频</span></button><input ref={uploadRef} type="file" accept=".mp4,.mpeg,.mov,video/mp4,video/mpeg,video/quicktime" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /><p className="mt-3 text-center text-xs leading-6 text-slate-400">视频格式：mp4、mpeg、mov，宽高无限制，大小&lt;1000MB<br />请确保您上传素材为您原创或已取得合法授权</p>{draft?.section === "本地上传" && <div className="mt-4 flex items-center gap-3 rounded-md border border-slate-200 p-2.5"><Film className="h-5 w-5 text-violet-600" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{draft.name}</p><p className="mt-1 text-[10px] text-slate-400">{draft.duration} · {draft.size}</p></div></div>}</div>}
    </div>
  </Modal>;
}

function ImagePickerModal({ assets, unavailableImageUrls, multiple = false, maxSelections = 1, onClose, onConfirm, showToast }: { assets: Asset[]; unavailableImageUrls: string[]; multiple?: boolean; maxSelections?: number; onClose: () => void; onConfirm: (candidates: CandidateImage[]) => void; showToast: (message: string) => void }) {
  const [tab, setTab] = useState<"library" | "local">("library");
  const [primaryCategory, setPrimaryCategory] = useState("全部一级分类");
  const [secondaryCategory, setSecondaryCategory] = useState("全部二级分类");
  const [tag, setTag] = useState("全部标签");
  const [status, setStatus] = useState("全部状态");
  const [author, setAuthor] = useState("全部上传人");
  const [onlyMine, setOnlyMine] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [drafts, setDrafts] = useState<CandidateImage[]>([]);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const assetImages: ImageLibraryItem[] = assets.filter((item) => item.type === "image" && item.resourceCategory === "图片").map((item) => {
    const categories = (item.category || "未分类").split(/\s*[/／]\s*/);
    return {
      candidate: { id: item.id, name: item.name, image: item.url, source: "图片管理" as const },
      primaryCategory: categories[0] || "未分类",
      secondaryCategory: categories[1] || "未分类",
      tags: item.publicTags?.length ? item.publicTags : item.tags || [],
      status: item.status || "审核通过",
      author: item.creator || "徐振",
      resolution: item.fileInfo?.resolution || "-",
      size: item.size,
    };
  });
  const seenImages = new Set(assetImages.map((item) => item.candidate.image));
  const images = [...assetImages, ...IMAGE_PICKER_SAMPLES.filter((item) => !seenImages.has(item.candidate.image))]
    .slice(0, Math.max(20, assetImages.length));
  const unavailableImages = new Set(unavailableImageUrls);
  const primaryCategories = Array.from(new Set(images.map((item) => item.primaryCategory)));
  const secondaryCategories = Array.from(new Set(images.map((item) => item.secondaryCategory)));
  const tags = Array.from(new Set(images.flatMap((item) => item.tags)));
  const statuses = Array.from(new Set(images.map((item) => item.status)));
  const authors = Array.from(new Set(images.map((item) => item.author)));
  const filtered = images.filter((item) =>
    (primaryCategory === "全部一级分类" || item.primaryCategory === primaryCategory) &&
    (secondaryCategory === "全部二级分类" || item.secondaryCategory === secondaryCategory) &&
    (tag === "全部标签" || item.tags.includes(tag)) &&
    (status === "全部状态" || item.status === status) &&
    (author === "全部上传人" || item.author === author) &&
    (!onlyMine || item.author === "徐振") &&
    `${item.candidate.name}${item.candidate.id}${item.primaryCategory}${item.secondaryCategory}${item.tags.join("")}`.toLowerCase().includes(search.toLowerCase())
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pagedImages = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectCandidate = (candidate: CandidateImage) => {
    if (!multiple) {
      setDrafts([candidate]);
      return;
    }
    setDrafts((current) => {
      if (current.some((item) => item.image === candidate.image)) return current.filter((item) => item.image !== candidate.image);
      if (current.length >= maxSelections) {
        showToast(`本次最多还能选择 ${maxSelections} 张图片`);
        return current;
      }
      return [...current, candidate];
    });
  };
  const upload = (files?: FileList | null) => {
    if (!files?.length) return;
    const validFiles = Array.from(files).filter((file) => {
      if (!/\.(jpe?g|png|webp|bmp|tiff?|gif)$/i.test(file.name)) {
        showToast("请选择图片文件");
        return false;
      }
      if (file.size >= 30 * 1024 * 1024) {
        showToast("单张图片需小于 30MB");
        return false;
      }
      return true;
    });
    const availableCount = multiple ? Math.max(0, maxSelections - drafts.length) : 1;
    const selectedFiles = validFiles.slice(0, availableCount);
    if (validFiles.length > availableCount) showToast(`本次最多还能选择 ${availableCount} 张图片`);
    const uploaded = selectedFiles.map((file, index) => ({ id: `local-image-${Date.now()}-${index}`, name: file.name, image: URL.createObjectURL(file), source: "本地上传" as const }));
    setDrafts((current) => multiple ? [...current, ...uploaded] : uploaded.slice(0, 1));
  };
  return <Modal title="" hideHeader lockBodyScroll onClose={onClose} width="max-w-6xl" footer={<><span className="mr-auto text-xs text-slate-500">已选 <b className="text-violet-700">{drafts.length}</b> 张{multiple && <span className="ml-1 text-slate-400">/ {maxSelections}</span>}</span><button onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button disabled={!drafts.length} onClick={() => drafts.length && onConfirm(drafts)} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">确认选择</button></>}>
    <div className="flex h-full min-h-0 flex-col p-5">
      <div className="mb-5 flex shrink-0 items-center justify-between border-b border-slate-200"><div className="flex items-center gap-1"><TabButton active={tab === "library"} onClick={() => setTab("library")}>图片管理</TabButton><TabButton active={tab === "local"} onClick={() => setTab("local")}>本地上传</TabButton></div><button onClick={onClose} title="关闭" className="mb-1 rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
      {tab === "library" ? <>
        <div className="mb-4 flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          <select value={primaryCategory} onChange={(event) => setPrimaryCategory(event.target.value)} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部一级分类</option>{primaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={secondaryCategory} onChange={(event) => setSecondaryCategory(event.target.value)} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部二级分类</option>{secondaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={tag} onChange={(event) => setTag(event.target.value)} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option value="全部标签">全部二级标签</option>{tags.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部状态</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={author} onChange={(event) => setAuthor(event.target.value)} className="h-9 w-[130px] shrink-0 whitespace-nowrap rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部上传人</option>{authors.map((item) => <option key={item}>{item}</option>)}</select>
          <div className="relative min-w-[180px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索图片名称或 ID" className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-violet-400" /></div>
          <label className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap px-2 text-xs text-slate-600"><input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} className="accent-violet-600" />仅看我的</label>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200"><table className="min-w-[860px] w-full text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr><th className="w-12 px-4 py-3"></th><th className="px-3 py-3">图片缩略图</th><th className="px-3 py-3">文件名称 / ID</th><th className="px-3 py-3">状态</th><th className="px-3 py-3">分类 / 标签</th><th className="px-3 py-3">上传人</th><th className="px-3 py-3">分辨率</th><th className="px-3 py-3">大小</th></tr></thead><tbody>{pagedImages.map((item) => { const checked = drafts.some((candidate) => candidate.id === item.candidate.id); const unavailable = unavailableImages.has(item.candidate.image); return <tr key={item.candidate.id} onClick={() => { if (!unavailable) selectCandidate(item.candidate); }} title={unavailable ? "该图片已在当前主体中" : undefined} className={`border-t border-slate-100 ${unavailable ? "cursor-not-allowed bg-slate-50 opacity-50" : checked ? "cursor-pointer bg-violet-50" : "cursor-pointer hover:bg-slate-50"}`}><td className="px-4 py-3"><span className={`flex h-4 w-4 items-center justify-center rounded border ${unavailable ? "border-slate-200 bg-slate-100" : checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"}`}>{checked && !unavailable && <Check className="h-2.5 w-2.5" />}</span></td><td className="px-3 py-2"><img src={item.candidate.image} alt="" className="h-12 w-12 rounded object-cover" referrerPolicy="no-referrer" /></td><td className="max-w-[220px] px-3 py-3"><p className="truncate font-semibold text-slate-700">{item.candidate.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.candidate.id}</p></td><td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{item.status}</span></td><td className="px-3 py-3"><p className="font-semibold text-slate-700">{item.primaryCategory} / {item.secondaryCategory}</p><p className="mt-1 text-[10px] text-slate-400">{item.tags.join("、")}</p></td><td className="px-3 py-3 text-slate-500">{item.author}</td><td className="px-3 py-3 text-slate-500">{item.resolution}</td><td className="px-3 py-3 text-slate-500">{item.size}</td></tr>; })}</tbody></table></div>
        <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
      </> : <div className="min-h-0 flex-1 overflow-y-auto"><button onClick={() => uploadRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700"><Upload className="h-6 w-6" /><span className="mt-3 text-xs font-semibold">点击选择本地图片</span></button><input ref={uploadRef} type="file" multiple={multiple} accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,.gif,image/*" className="hidden" onChange={(event) => upload(event.target.files)} /><p className="mt-3 text-center text-xs leading-6 text-slate-400">支持 jpeg、png、webp、bmp、tiff、gif，单张图片大小&lt;30MB。{multiple && `最多选择 ${maxSelections} 张。`}<br />请确保您上传素材为您原创或已取得合法授权。</p>{drafts.some((item) => item.source === "本地上传") && <div className="mt-4 grid grid-cols-5 gap-2 rounded-md border border-slate-200 p-2.5">{drafts.filter((item) => item.source === "本地上传").map((item) => <button key={item.id} type="button" onClick={() => setDrafts((current) => current.filter((candidate) => candidate.id !== item.id))} title="移除" className="group relative overflow-hidden rounded-md"><img src={item.image} alt={item.name} className="aspect-square w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-4 w-4" /></span></button>)}</div>}</div>}
    </div>
  </Modal>;
}

function AddSubjectModal({ type, onClose, onConfirm, showToast }: { type: SubjectType; onClose: () => void; onConfirm: (subject: RemakeSubject) => void; showToast: (message: string) => void }) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const title: Record<SubjectType, string> = { person: "添加角色-原形象", scene: "添加场景", product: "添加道具" };
  const fieldLabel: Record<SubjectType, string> = { person: "原形象名称", scene: "原场景名称", product: "原道具名称" };
  const upload = (file?: File) => {
    if (!file) return;
    if (!/\.(jpe?g|png)$/i.test(file.name)) return showToast("仅支持 JPG、PNG 格式");
    if (file.size > 20 * 1024 * 1024) return showToast("图片文件需小于 20MB");
    setImage(URL.createObjectURL(file));
  };
  const add = () => {
    const id = `${type}-${Date.now()}`;
    const voiceId = `voice-${id}`;
    const prompt: Record<SubjectType, string> = {
      person: `根据原形象生成${name.trim()}的清晰角色形象，保持角色身份特征一致，适配电商短视频。`,
      scene: `生成${name.trim()}场景，构图清晰，光线自然，适配电商短视频。`,
      product: `生成${name.trim()}的清晰商品或道具图片，结构和细节准确，适配电商短视频。`,
    };
    onConfirm({ id, type, name: name.trim(), originalName: name.trim(), originalImage: image, prompt: prompt[type], candidates: [], referenceImages: [], voices: type === "person" ? [{ id: voiceId, name: "自然音色", description: "表达自然清晰，语速适中，适合电商视频。" }] : undefined, activeVoiceId: type === "person" ? voiceId : undefined });
  };
  const canAdd = !!name.trim() && (type !== "person" || !!image);
  return <Modal title={title[type]} onClose={onClose} width="max-w-2xl" footer={<><button onClick={onClose} className="ml-auto rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button disabled={!canAdd} onClick={add} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">添加</button></>}><div className="space-y-4 p-5"><FormField label={fieldLabel[type]}><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={`请输入${fieldLabel[type]}`} className="h-10 w-full rounded-md border border-slate-200 px-3 text-xs outline-none focus:border-violet-400" /></FormField>{type === "person" && <div><p className="mb-2 text-xs font-semibold text-slate-600">原形象图片</p><button onClick={() => uploadRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files?.[0]); }} className="flex h-56 w-full flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400">{image ? <img src={image} alt="原形象预览" className="h-full w-full object-contain" /> : <><Plus className="h-7 w-7" /><span className="mt-3 text-xs font-semibold">点击或拖拽图片到此处上传</span><span className="mt-1 text-[10px] text-slate-400">仅支持 JPG、PNG，最大 20MB</span></>}</button><input ref={uploadRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></div>}</div></Modal>;
}

function ConfirmationModal({ title, description, confirmLabel, danger = false, hideCancel = false, onClose, onConfirm }: { title: string; description: string; confirmLabel: string; danger?: boolean; hideCancel?: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Modal title={title} onClose={onClose} width="max-w-md" footer={<>{!hideCancel && <button onClick={onClose} className="ml-auto rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button>}<button onClick={onConfirm} className={`${hideCancel ? "ml-auto" : ""} rounded-md px-4 py-2 text-xs font-semibold text-white ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-violet-600 hover:bg-violet-700"}`}>{confirmLabel}</button></>}><div className="flex gap-3 p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"><AlertCircle className="h-4 w-4" /></span><p className="pt-1 text-xs leading-6 text-slate-600">{description}</p></div></Modal>;
}

function MergeSubjectModal({ source, options, onClose, onConfirm }: { source: RemakeSubject; options: RemakeSubject[]; onClose: () => void; onConfirm: (targetId: string) => void }) {
  const [targetId, setTargetId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const target = options.find((item) => item.id === targetId);
  return <><Modal title="合并去重" onClose={onClose} width="max-w-3xl" footer={<><button onClick={onClose} className="ml-auto rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button disabled={!targetId} onClick={() => setConfirming(true)} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">确认</button></>}><div className="grid min-h-72 grid-cols-[220px_1fr] gap-5 p-5"><div><p className="mb-3 text-xs font-bold text-slate-700">待合并角色</p><MiniSubjectCard subject={source} selected /></div><div className="border-l border-slate-200 pl-5"><p className="mb-3 text-xs font-bold text-slate-700">选择目标角色</p><div className="grid grid-cols-2 gap-3">{options.map((item) => <button key={item.id} onClick={() => setTargetId(item.id)} className={`rounded-md border p-2 text-left ${targetId === item.id ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-200"}`}><MiniSubjectCard subject={item} selected={targetId === item.id} /></button>)}</div></div></div></Modal>{confirming && target && <ConfirmationModal title="合并去重确认" description={`合并后保留“${target.name}”，并删除“${source.name}”。被删除角色的候选图片将合并到目标角色中。`} confirmLabel="确认" onClose={() => setConfirming(false)} onConfirm={() => onConfirm(target.id)} />}</>;
}

function MiniSubjectCard({ subject, selected }: { subject: RemakeSubject; selected: boolean }) {
  const candidate = subject.candidates.find((item) => item.id === subject.selectedCandidateId);
  return <div className="min-w-0"><div className="grid grid-cols-2 gap-1.5"><div className="relative aspect-square overflow-hidden rounded bg-slate-100">{subject.originalImage ? <img src={subject.originalImage} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-slate-300" />}<span className="absolute left-1 top-1 rounded bg-slate-700 px-1 py-0.5 text-[8px] text-white">原</span></div><div className="relative aspect-square overflow-hidden rounded bg-slate-100">{candidate ? <img src={candidate.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-slate-300" />}<span className="absolute left-1 top-1 rounded bg-violet-600 px-1 py-0.5 text-[8px] text-white">新</span></div></div><div className="mt-2 flex items-center justify-between"><p className="truncate text-[10px] font-semibold text-slate-700">{subject.name}</p>{selected && <Check className="h-3.5 w-3.5 shrink-0 text-violet-600" />}</div></div>;
}

function VoiceConfigModal({ subject, generating, onClose, onGenerate, onApply, showToast }: { subject: RemakeSubject; generating: boolean; onClose: () => void; onGenerate: (description: string) => void; onApply: (voices: RemakeVoice[], activeVoiceId: string) => void; showToast: (message: string) => void }) {
  const defaults: RemakeVoice[] = [{ id: "voice-natural", name: "自然女声", description: "年轻女性，表达自然亲切，语速适中。" }, { id: "voice-clear", name: "清晰女声", description: "音色清晰明亮，重点信息表达准确。" }, { id: "voice-steady", name: "沉稳男声", description: "成熟稳重，适合专业产品讲解。" }];
  const voices = subject.voices?.length ? subject.voices : defaults;
  const [activeVoiceId, setActiveVoiceId] = useState(subject.activeVoiceId || voices[0]?.id || "");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [description, setDescription] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stop = () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); utteranceRef.current = null; setPlayingVoiceId(null); };
  useEffect(() => () => stop(), []);
  const preview = (voice: RemakeVoice) => {
    if (playingVoiceId === voice.id) return stop();
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return showToast("当前浏览器暂不支持音色试听");
    stop();
    const utterance = new SpeechSynthesisUtterance(`这是${voice.name}的试听效果，适合用于电商短视频内容。`);
    utterance.lang = "zh-CN";
    utterance.onend = () => { if (utteranceRef.current === utterance) { utteranceRef.current = null; setPlayingVoiceId(null); } };
    utteranceRef.current = utterance;
    setPlayingVoiceId(voice.id);
    window.speechSynthesis.speak(utterance);
  };
  const addVoice = () => {
    onGenerate(description.trim());
    setDescription("");
    setAdding(false);
  };
  return <Modal title={`配置音色 · ${subject.name}`} onClose={() => { stop(); onClose(); }} width="max-w-2xl" footer={<><button onClick={() => { stop(); onClose(); }} className="ml-auto rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button disabled={generating || !activeVoiceId} onClick={() => { stop(); onApply(voices, activeVoiceId); }} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">应用</button></>}><div className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-700">选择音色</p><button disabled={generating} onClick={() => setAdding((current) => !current)} className="flex min-w-20 items-center justify-end gap-1.5 text-xs font-semibold text-violet-700 disabled:cursor-not-allowed disabled:text-violet-400">{generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />生成中...</> : adding ? "取消" : "新增音色"}</button></div><div className="mt-4 grid grid-cols-3 gap-3">{voices.map((voice) => { const playing = playingVoiceId === voice.id; return <div key={voice.id} className="group/voice relative"><button disabled={generating} onClick={() => setActiveVoiceId(voice.id)} className={`h-14 w-full rounded-md border px-4 text-center text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-55 ${activeVoiceId === voice.id ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:border-violet-200"}`}>{voice.name}</button><button disabled={generating} onClick={() => preview(voice)} title={playing ? "停止试听" : "试听音色"} className={`absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-violet-700 transition-opacity hover:bg-violet-100 disabled:cursor-not-allowed ${playing ? "opacity-100" : "opacity-0 group-hover/voice:opacity-100"}`}>{playing ? <AudioLines className="h-4 w-4" /> : <Play className="h-3.5 w-3.5 fill-current" />}</button></div>; })}</div>{adding && !generating && <section className="mt-4 rounded-md border border-violet-200 bg-violet-50/30 p-3"><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="描述希望生成的音色，例如：年轻女性，表达自然，语速稍快" className="w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-xs leading-6 outline-none focus:border-violet-400" /><div className="mt-2 flex justify-end"><button disabled={!description.trim()} onClick={addVoice} className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Mic2 className="h-3.5 w-3.5" />生成音色</button></div></section>}</div></Modal>;
}

function ReplacementReviewModal({ subjects, onClose, onConfirm }: { subjects: RemakeSubject[]; onClose: () => void; onConfirm: (model: (typeof STORYBOARD_VIDEO_MODELS)[number], maxSegmentDuration: (typeof STORYBOARD_MAX_DURATIONS)[number]) => void }) {
  const replaced = subjects.filter((item) => item.selectedCandidateId);
  const unchanged = subjects.filter((item) => !item.selectedCandidateId);
  const [model, setModel] = useState<(typeof STORYBOARD_VIDEO_MODELS)[number]>(STORYBOARD_VIDEO_MODELS[0]);
  const [maxSegmentDuration, setMaxSegmentDuration] = useState<(typeof STORYBOARD_MAX_DURATIONS)[number]>(30);
  return <Modal title="分镜解析设置" onClose={onClose} width="max-w-2xl" footer={<><div className="flex min-w-0 items-center gap-2"><label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3"><span className="shrink-0 text-[10px] font-semibold text-slate-400">预设模型</span><select value={model} onChange={(event) => setModel(event.target.value as (typeof STORYBOARD_VIDEO_MODELS)[number])} className="min-w-0 bg-transparent text-xs font-semibold text-slate-700 outline-none">{STORYBOARD_VIDEO_MODELS.map((item) => <option key={item}>{item}</option>)}</select></label><label title="每段拆分分镜最大时长设置" className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3"><span className="shrink-0 text-[10px] font-semibold text-slate-400">每段最长</span><select value={maxSegmentDuration} onChange={(event) => setMaxSegmentDuration(Number(event.target.value) as (typeof STORYBOARD_MAX_DURATIONS)[number])} className="bg-transparent text-xs font-semibold text-slate-700 outline-none">{STORYBOARD_MAX_DURATIONS.map((item) => <option key={item} value={item}>{item}s</option>)}</select></label></div><button onClick={onClose} className="ml-auto rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button onClick={() => onConfirm(model, maxSegmentDuration)} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white">开始解析</button></>}><div className="space-y-5 p-5"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />已替换 {replaced.length}</div><div className="space-y-2">{replaced.length ? replaced.map((item) => <ReviewRow key={item.id} subject={item} status="已替换" />) : <p className="rounded bg-slate-50 p-3 text-xs text-slate-400">暂无已替换主体</p>}</div></div><div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-700"><AlertCircle className="h-4 w-4" />未替换 {unchanged.length}</div><div className="space-y-2">{unchanged.length ? unchanged.map((item) => <ReviewRow key={item.id} subject={item} status="沿用原视频" />) : <p className="rounded bg-slate-50 p-3 text-xs text-slate-400">全部主体均已替换</p>}</div></div>{unchanged.length > 0 && <p className="rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-700">确认后，未配置新图片的主体将继续沿用原视频内容。</p>}</div></Modal>;
}

function AddShotModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (duration: number) => void }) {
  const [duration, setDuration] = useState(4);
  return <Modal title="新增分镜" onClose={onClose} width="max-w-md" footer={<><button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button onClick={() => onConfirm(duration)} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white">确认新增</button></>}><div className="p-5"><div className="flex items-center justify-between"><label className="text-xs font-semibold text-slate-700">视频时长</label><span className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">{duration}s</span></div><input type="range" min="4" max="30" value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-5 w-full accent-violet-600" /><div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>4s</span><span>30s</span></div></div></Modal>;
}

function Modal({ title, onClose, width, footer, children, hideHeader = false, lockBodyScroll = false }: { title: string; onClose: () => void; width: string; footer: React.ReactNode; children: React.ReactNode; hideHeader?: boolean; lockBodyScroll?: boolean }) {
  return <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-900/35 p-6"><div className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl ${lockBodyScroll ? "h-[88vh]" : ""} ${width}`}>{!hideHeader && <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5"><h3 className="text-sm font-bold text-slate-900">{title}</h3><button onClick={onClose} title="关闭" className="rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>}<div className={`min-h-0 flex-1 ${lockBodyScroll ? "overflow-hidden" : "overflow-y-auto"}`}>{children}</div><div className="flex h-16 shrink-0 items-center gap-2 border-t border-slate-200 px-5">{footer}</div></div></OverlayPortal>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${active ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{children}</button>;
}

function SubjectImage({ label, src, onReplace }: { label: "原" | "新"; src?: string; onReplace: () => void }) {
  return <div className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
    {src ? <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-full flex-col items-center justify-center text-slate-300"><ImageIcon className="h-5 w-5" /><span className="mt-2 text-[10px]">暂未配置</span></div>}
    <span className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-semibold text-white ${label === "原" ? "bg-slate-700" : "bg-violet-600"}`}>{label}</span>
    <button onClick={(event) => { event.stopPropagation(); onReplace(); }} title="替换图片" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"><RefreshCw className="h-4 w-4" /></button>
  </div>;
}

function StoryboardDescriptionEditor({ shot, subjects, allSubjects, disabled, onChange }: { shot: StoryboardShot; subjects: RemakeSubject[]; allSubjects: RemakeSubject[]; disabled: boolean; onChange: (description: string) => void }) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [editorHasContent, setEditorHasContent] = useState(Boolean(shot.description.trim()));
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mentionRangeRef = useRef<Range | null>(null);
  const roleNames = subjects.filter((subject) => subject.type === "person").map((subject) => subject.name);
  const sceneNames = subjects.filter((subject) => subject.type === "scene").map((subject) => subject.name);
  const productNames = subjects.filter((subject) => subject.type === "product").map((subject) => subject.name);
  const primaryRole = roleNames[0] || "出镜角色";
  const secondaryRole = roleNames[1] || primaryRole;
  const primaryScene = sceneNames[0] || "现代电商展示空间";
  const primaryProduct = productNames[0] || "核心商品";
  const cameraCount = Math.max(2, Math.min(6, Math.ceil(shot.duration / 3)));
  const cameraTemplates = [
    (start: number, end: number) => `镜头1（${start}-${end}秒）：[现代·白天·明亮通透·${primaryScene}，室内]\n[机位] 机位与${primaryRole}胸部齐平，平拍朝向${primaryRole}，固定不动，背景保留完整商品展示区。\n[站位] ${primaryRole}位于镜头正前方，面朝镜头，近距离，${primaryProduct}摆放在人物右手可自然拿取的位置。\n[动作] 中近景，浅景深。${primaryRole}拿起${primaryProduct}进入画面，先展示包装正面，再把产品靠近镜头，眉眼自然放松，动作真实利落。\n角色台词（${primaryRole}）：“最近很多人问我，怎样用更简单的方法做好日常护理，今天直接把真实体验讲清楚。”`,
    (start: number, end: number) => `镜头2（${start}-${end}秒）：[现代·白天·产品细节展示·${primaryScene}，室内]\n[机位] 镜头切至桌面上方四十五度俯拍，缓慢推进至${primaryProduct}瓶身和质地细节。\n[站位] ${primaryRole}的双手从画面下方进入，人物面部不入镜，产品位于画面视觉中心。\n[动作] 特写，${primaryRole}打开${primaryProduct}并取出适量内容，缓慢展示流动性、延展度和吸收后的肤感，包装文字保持清晰。\n旁白：“质地轻盈好推开，接触皮肤后能快速铺匀，日常使用不会给肌肤增加厚重负担。”`,
    (start: number, end: number) => `镜头3（${start}-${end}秒）：[现代·白天·真实使用演示·${primaryScene}，室内]\n[机位] 机位回到${primaryRole}正前方，面部近景，镜头轻微跟随手部动作。\n[站位] ${primaryRole}面对镜头坐于展示台前，${primaryProduct}置于画面前景。\n[动作] ${primaryRole}将产品均匀涂抹在面部或手背，轻拍至吸收，随后转动角度展示使用前后的光泽和细腻感。\n角色台词（${primaryRole}）：“上脸很清爽，吸收以后摸起来是润的，但不会有黏腻感。”`,
    (start: number, end: number) => `镜头4（${start}-${end}秒）：[现代·白天·体验反馈·${primaryScene}，室内]\n[机位] 双人中景，镜头平视，构图保留人物互动和桌面的${primaryProduct}。\n[站位] ${primaryRole}位于画面左侧，${secondaryRole}位于右侧，两人自然面向彼此后转向镜头。\n[动作] ${secondaryRole}观察使用效果并轻触手背，${primaryRole}同步补充使用方法，表情自然可信，避免夸张表演。\n角色台词（${secondaryRole}）：“肤感比我预想得更轻，白天用也不会影响后续上妆。”`,
    (start: number, end: number) => `镜头5（${start}-${end}秒）：[现代·白天·核心卖点强化·${primaryScene}，室内]\n[机位] 产品微距特写与人物面部近景自然切换，焦点从${primaryProduct}平稳过渡到${primaryRole}。\n[站位] ${primaryProduct}立于前景，${primaryRole}处于后景右侧，画面层次清晰。\n[动作] ${primaryRole}指向包装上的关键信息，再展示肌肤细节；镜头停留足够时间，让观众看清产品和使用效果。\n旁白：“从质地、使用步骤到实际肤感都清楚呈现，适合希望精简护理流程、同时重视体验感的人群。”`,
    (start: number, end: number) => `镜头6（${start}-${end}秒）：[现代·白天·购买引导·${primaryScene}，室内]\n[机位] 机位略低于产品，缓慢拉远形成完整收尾构图。\n[站位] ${primaryRole}站在${primaryProduct}后方，产品保持在画面中心，人物视线看向镜头。\n[动作] ${primaryRole}将${primaryProduct}稳稳托在胸前，微笑点头，随后用手势指向购买入口，画面最后定格在商品包装正面。\n角色台词（${primaryRole}）：“想认真体验的可以从现在开始，坚持使用一段时间，再看肌肤状态的真实变化。”`,
  ];
  const cameraDescriptions = Array.from({ length: cameraCount }, (_, index) => {
    const start = Math.round(index * shot.duration / cameraCount);
    const end = Math.round((index + 1) * shot.duration / cameraCount);
    return cameraTemplates[index](start, end);
  });
  const formattedDescription = shot.manuallyAdded || !shot.description.trim()
    ? shot.description
    : shot.description.includes("[机位]")
    ? shot.description
    : [
      "画风：写实风格，细节刻画逼真，参考院线电影，真人电影风格，影视大片，真实透视比例，细节清晰不过度锐化",
      `分镜场景设定在：${sceneNames.length ? sceneNames.join("、") : primaryScene}`,
      "分镜具体动作描述：",
      "整体视觉基调：画面明亮，色彩饱和，质感细腻，景深较浅以突出人物和产品。",
      `原视频内容分析：${shot.description}`,
      ...cameraDescriptions,
      "视频中保留角色台词与旁白，不叠加额外字幕，不使用纯色空镜，不添加无关背景音乐。",
    ].join("\n\n");
  const subjectByName = new Map(subjects.map((subject) => [subject.name, subject]));
  const subjectNames = Array.from(subjectByName.keys()).sort((a, b) => b.length - a.length);
  const tokenPattern = subjectNames.length ? new RegExp(`(${subjectNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g") : null;
  const mentionSubjects = subjects.filter((subject) => subject.name.toLowerCase().includes(mentionQuery.toLowerCase()));
  const mentionTypeLabel: Record<SubjectType, string> = { person: "角色", scene: "场景", product: "道具" };

  const createSubjectChip = (subject: RemakeSubject) => {
    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.subjectId = subject.id;
    chip.title = subject.name;
    chip.className = "mx-1 inline-flex h-6 select-none items-center gap-1 whitespace-nowrap rounded-md bg-violet-50 px-1.5 align-middle text-[11px] font-semibold leading-none text-violet-700";
    const candidate = subject.candidates.find((item) => item.id === subject.selectedCandidateId);
    const imageUrl = candidate?.image || subject.originalImage;
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = "";
      image.className = "h-4 w-4 rounded object-cover";
      chip.appendChild(image);
    }
    chip.appendChild(document.createTextNode(subject.name));
    return chip;
  };

  const serializeEditor = () => {
    const editor = editorRef.current;
    if (!editor) return "";
    const serializeNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (!(node instanceof HTMLElement)) return "";
      if (node.dataset.subjectId) return node.textContent || "";
      if (node.tagName === "BR") return "\n";
      const content = Array.from(node.childNodes).map(serializeNode).join("");
      return node.tagName === "DIV" || node.tagName === "P" ? `${content}\n` : content;
    };
    return Array.from(editor.childNodes).map(serializeNode).join("").replace(/\n$/, "");
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    if (serializeEditor() === formattedDescription) return;
    editor.replaceChildren();
    const descriptionParts = tokenPattern ? formattedDescription.split(tokenPattern) : [formattedDescription];
    descriptionParts.forEach((part) => {
      const subject = subjectByName.get(part);
      editor.appendChild(subject ? createSubjectChip(subject) : document.createTextNode(part));
    });
    setEditorHasContent(Boolean(formattedDescription.trim()));
  }, [formattedDescription, subjects]);

  const updateMentionRange = () => {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const editor = editorRef.current;
    if (!range || !range.collapsed || !editor?.contains(range.startContainer) || range.startContainer.nodeType !== Node.TEXT_NODE) {
      setMentionOpen(false);
      return;
    }
    const content = range.startContainer.textContent?.slice(0, range.startOffset) || "";
    const match = content.match(/@([^@\s]*)$/);
    if (!match) {
      setMentionOpen(false);
      return;
    }
    const mentionRange = range.cloneRange();
    mentionRange.setStart(range.startContainer, range.startOffset - match[0].length);
    mentionRangeRef.current = mentionRange;
    setMentionQuery(match[1]);
    setMentionIndex(0);
    setMentionOpen(true);
  };

  const insertSubject = (subject: RemakeSubject) => {
    const range = mentionRangeRef.current;
    const editor = editorRef.current;
    if (!range || !editor) return;
    range.deleteContents();
    const chip = createSubjectChip(subject);
    const space = document.createTextNode(" ");
    range.insertNode(space);
    range.insertNode(chip);
    range.setStartAfter(space);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    setMentionOpen(false);
    setMentionQuery("");
    setEditorHasContent(true);
    onChange(serializeEditor().replace(/\n{3,}/g, "\n\n").trim());
  };

  return <div ref={wrapperRef} className="relative mt-4 min-h-0 flex-1">
    {!editorHasContent && <span className="pointer-events-none absolute left-0 top-1 text-xs text-slate-400">请输入分镜描述，包括画面、动作、角色台词和旁白</span>}
    <div
      ref={editorRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="分镜描述"
      onInput={(event) => {
        setEditorHasContent(Boolean(event.currentTarget.innerText.trim()));
        updateMentionRange();
      }}
      onMouseUp={updateMentionRange}
      onKeyUp={(event) => {
        if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) updateMentionRange();
      }}
      onKeyDown={(event) => {
        if (!mentionOpen) return;
        if (event.key === "Escape") {
          event.preventDefault();
          setMentionOpen(false);
        } else if (event.key === "ArrowDown" && mentionSubjects.length) {
          event.preventDefault();
          setMentionIndex((current) => (current + 1) % mentionSubjects.length);
        } else if (event.key === "ArrowUp" && mentionSubjects.length) {
          event.preventDefault();
          setMentionIndex((current) => (current - 1 + mentionSubjects.length) % mentionSubjects.length);
        } else if (event.key === "Enter" && mentionSubjects.length) {
          event.preventDefault();
          insertSubject(mentionSubjects[mentionIndex] || mentionSubjects[0]);
        }
      }}
      onBlur={() => {
        const nextDescription = serializeEditor().replace(/\n{3,}/g, "\n\n").trim();
        if (nextDescription !== formattedDescription) onChange(nextDescription);
        setMentionOpen(false);
      }}
      className={`h-full overflow-y-auto whitespace-pre-wrap rounded-md px-0 py-1 pr-2 text-xs leading-7 text-slate-700 outline-none ${disabled ? "cursor-not-allowed opacity-60" : "focus:bg-violet-50/20"}`}
    />
    {mentionOpen && <AnchoredPopover anchorRef={wrapperRef} getAnchorRect={() => mentionRangeRef.current?.getBoundingClientRect() || null} width={224} maxHeight={192} gap={6} onClose={() => setMentionOpen(false)} className="rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
      <p className="px-2 py-1 text-[10px] text-slate-400">选择当前分镜主体</p>
      {mentionSubjects.length ? mentionSubjects.map((subject, index) => {
        const candidate = subject.candidates.find((item) => item.id === subject.selectedCandidateId);
        const image = candidate?.image || subject.originalImage;
        return <button key={subject.id} type="button" onMouseDown={(event) => { event.preventDefault(); insertSubject(subject); }} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left ${index === mentionIndex ? "bg-violet-50" : "hover:bg-slate-50"}`}>
          {image ? <img src={image} alt="" className="h-7 w-7 shrink-0 rounded object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100"><AtSign className="h-3.5 w-3.5 text-slate-400" /></span>}
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{subject.name}</span><span className="mt-0.5 block text-[9px] text-slate-400">{mentionTypeLabel[subject.type]}-{getSubjectAppearanceLabel(subject, allSubjects)}</span></span>
        </button>;
      }) : <p className="px-2 py-3 text-xs text-slate-400">没有匹配的当前分镜主体</p>}
    </AnchoredPopover>}
  </div>;
}

function StoryboardVideoPreview({ sourceCover, shot, seek, activeTab, onSeek, onTab, onMakeCurrent }: { sourceCover: string; shot: StoryboardShot; seek: number; activeTab: "generated" | "original"; onSeek: (value: number) => void; onTab: (tab: "generated" | "original") => void; onMakeCurrent: (versionId: string) => void }) {
  const showingGenerated = activeTab === "generated";
  const versions = getStoryboardVersions(shot);
  const currentVersionId = shot.currentVersionId || versions[0]?.id || "";
  const [previewVersionId, setPreviewVersionId] = useState(currentVersionId);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef(seek);
  const previewVersion = versions.find((version) => version.id === previewVersionId) || versions[0];
  const cover = showingGenerated ? previewVersion?.cover : sourceCover;
  const ready = showingGenerated ? !!cover : true;
  const previewIsCurrent = !!previewVersion && previewVersion.id === currentVersionId;
  const currentSeconds = Math.min(shot.duration, Math.round(shot.duration * seek / 100));
  const formatVideoTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    setPreviewVersionId(currentVersionId);
  }, [currentVersionId, shot.id]);

  useEffect(() => {
    seekRef.current = seek;
  }, [seek]);

  useEffect(() => {
    setPlaying(false);
  }, [activeTab, previewVersionId, shot.id]);

  useEffect(() => {
    if (!playing || !ready) return;
    const timer = window.setInterval(() => {
      const nextSeek = Math.min(100, seekRef.current + (100 / Math.max(shot.duration, 1)) * 0.25 * playbackRate);
      seekRef.current = nextSeek;
      onSeek(nextSeek);
      if (nextSeek >= 100) setPlaying(false);
    }, 250);
    return () => window.clearInterval(timer);
  }, [onSeek, playbackRate, playing, ready, shot.duration]);

  const togglePlaying = () => {
    if (!ready) return;
    if (!playing && seekRef.current >= 100) {
      seekRef.current = 0;
      onSeek(0);
    }
    setPlaying((current) => !current);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2, 0.5];
    setPlaybackRate((current) => rates[(rates.indexOf(current) + 1) % rates.length]);
  };

  return <section className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white p-5">
    <div className="flex justify-center gap-8 border-b border-slate-100">
      <button type="button" onClick={() => onTab("generated")} className={`relative pb-2 text-sm font-semibold ${showingGenerated ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>分镜生成{showingGenerated && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-violet-600" />}</button>
      <button type="button" onClick={() => onTab("original")} className={`relative pb-2 text-sm font-semibold ${!showingGenerated ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>原视频{!showingGenerated && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-violet-600" />}</button>
    </div>

    <div ref={previewRef} className="group/video relative mt-3 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg bg-[#08090d]">
      {ready && cover ? <>
        <img src={cover} alt={showingGenerated ? "分镜生成视频" : "原视频"} className="h-full w-auto max-w-full object-cover" referrerPolicy="no-referrer" />
        {showingGenerated && !previewIsCurrent && previewVersion && <button type="button" onClick={() => onMakeCurrent(previewVersion.id)} className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-slate-900/85 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-slate-900"><Sparkles className="h-3.5 w-3.5" />选为分镜</button>}
        {!playing && <button type="button" onClick={togglePlaying} title="播放" className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"><Play className="ml-1 h-5 w-5 fill-current" /></button>}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-2 pt-8 text-white">
          <input type="range" min="0" max="100" step="0.1" value={seek} onChange={(event) => { const value = Number(event.target.value); seekRef.current = value; onSeek(value); }} aria-label="视频播放进度" className="h-1 w-full cursor-pointer accent-violet-500" />
          <div className="mt-2 flex h-7 items-center gap-3">
            <button type="button" onClick={togglePlaying} title={playing ? "暂停" : "播放"} className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15">{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button>
            <span className="text-xs font-medium tabular-nums"><strong>{formatVideoTime(currentSeconds)}</strong><span className="text-white/60"> / {formatVideoTime(shot.duration)}</span></span>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={cyclePlaybackRate} title="切换播放速度" className="min-w-10 rounded bg-black/35 px-2 py-1 text-xs font-medium hover:bg-white/15">{playbackRate}x</button>
              {showingGenerated && <a href={cover} download title="下载视频" className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15"><Download className="h-4 w-4" /></a>}
              <button type="button" onClick={() => setMuted((current) => !current)} title={muted ? "打开声音" : "静音"} className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
              <button type="button" onClick={() => previewRef.current?.requestFullscreen?.()} title="全屏" className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15"><Maximize className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </> : <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        {shot.status === "generating" ? <><Loader2 className="h-7 w-7 animate-spin text-violet-400" /><span className="mt-3 text-xs text-violet-200">生成中 {shot.progress}%</span></> : shot.status === "failed" ? <><AlertCircle className="h-7 w-7 text-rose-400" /><span className="mt-3 text-xs text-rose-200">生成失败</span></> : <><Video className="h-7 w-7 text-slate-600" /><span className="mt-3 text-xs text-slate-500">待生成</span></>}
      </div>}
    </div>

    {showingGenerated && versions.length > 0 && <div className="mt-3 flex max-h-36 flex-wrap content-start gap-2 overflow-y-auto pr-1">
      {versions.map((version) => { const isCurrent = version.id === currentVersionId; const isPreviewing = version.id === previewVersion?.id; return <button key={version.id} type="button" onClick={() => setPreviewVersionId(version.id)} title={isCurrent ? "当前分镜" : "预览历史分镜"} className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-md border bg-slate-100 ${isPreviewing ? "border-slate-900 ring-1 ring-slate-300" : "border-slate-200 hover:border-violet-300"}`}><img src={version.cover} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />{isCurrent && <span className="absolute inset-x-0 bottom-0 bg-black/75 py-0.5 text-center text-[8px] font-semibold text-white">当前分镜</span>}</button>; })}
    </div>}

  </section>;
}

function ReviewRow({ subject, status }: { subject: RemakeSubject; status: string }) {
  return <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5"><div className="flex items-center gap-3">{subject.originalImage ? <img src={subject.originalImage} alt="" className="h-9 w-9 rounded object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded bg-slate-100"><ImageIcon className="h-4 w-4 text-slate-300" /></span>}<div><p className="text-xs font-semibold text-slate-700">{subject.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{TYPE_META[subject.type].label}</p></div></div><span className="text-[10px] font-semibold text-slate-500">{status}</span></div>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-3"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}
