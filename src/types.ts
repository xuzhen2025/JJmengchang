export type AssetLibraryType =
  | "finished"
  | "viral"
  | "template"
  | "component"
  | "ad_delivery"
  | "archive"
  | "trash";

export interface AssetVersion {
  id: string;
  version: string;
  label: string;
  url: string;
  updatedAt: string;
  updatedBy: string;
  changelog: string;
  fileSize: string;
  isCurrent?: boolean;
}

export interface RawMaterialRelation {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "script";
  url?: string;
  role: string;
}

export interface AssetPerformance {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  completionRate: string;
  gmv: number;
  roi: number;
  orders: number;
  conversionRate: string;
}

export interface AssetFileInfo {
  size: string;
  resolution: string;
  duration: string;
  format: string;
  bitrate?: string;
  aspectRatio?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document" | "template";
  url: string;
  size: string;
  createdAt: string;
  category?: string;
  resourceCategory?: "成片" | "素材" | "第三方" | "脚本" | "图片" | "音频";
  source?: "resource_library" | "task_collaboration" | "ai_generation";
  publicTags?: string[];
  personalTags?: string[];
  coverUrl?: string;
  status?: string;

  // Rich Asset Library extensions
  libraryType?: AssetLibraryType;
  isViral?: boolean;
  viralRank?: "S级" | "A级" | "B级" | "非爆款";
  version?: string;
  versions?: AssetVersion[];
  rawMaterials?: RawMaterialRelation[];
  creator?: string;
  project?: string;
  platforms?: string[];
  deliveryStatus?: "未投放" | "投放中" | "已结束" | "已暂停";
  performance?: AssetPerformance;
  tags?: string[];
  copyrightStatus?: "已授权" | "自有版权" | "待核验" | "商业专有";
  permission?: "内部使用" | "对外分发" | "商业全渠道授权";
  expireDate?: string;
  notes?: string;
  fileInfo?: AssetFileInfo;
  deletedAt?: string;
}

export type GenerationTaskCategory =
  | "agent"
  | "quick_creation"
  | "watermark"
  | "subtitle"
  | "enhance"
  | "face_swap"
  | "fission"
  | "ai_video";

export type AiVideoMode =
  "reference" | "first_last" | "dubbing" | "background" | "outfit" | "pain_comparison" | "usage_process";

export type AiVideoSceneMode = "pain_comparison" | "usage_process";

export interface AiVideoSceneInputs {
  painMaterial?: AiVideoMediaItem | null;
  solutionMaterial?: AiVideoMediaItem | null;
  usageVideo?: AiVideoMediaItem | null;
  productImage?: AiVideoMediaItem | null;
  prompt?: string;
}

export interface AiVideoMediaItem {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  coverUrl?: string;
  durationSeconds?: number;
  source?: "library" | "local" | "generated";
}

export interface AiVideoTaskSnapshot extends AiVideoSceneInputs {
  mode: AiVideoMode;
  model: string;
  ratio: "9:16" | "16:9" | "4:3" | "3:4" | "1:1";
  duration: number;
  prompt?: string;
  references?: AiVideoMediaItem[];
  firstFrame?: AiVideoMediaItem | null;
  lastFrame?: AiVideoMediaItem | null;
  character?: AiVideoMediaItem | null;
  voiceId?: string;
  voiceName?: string;
  speech?: string;
  actionDescription?: string;
  sourceVideos?: AiVideoMediaItem[];
  outfitMode?: "single" | "multiple";
  clothingImages?: AiVideoMediaItem[];
  modelMedia?: AiVideoMediaItem | null;
  selectedLook?: AiVideoMediaItem | null;
}

export interface AiVideoTaskOutput {
  id?: string;
  name?: string;
  videoUrl: string;
  coverUrl: string;
  duration: number;
  size?: string;
  sourceVideoId?: string;
}

export interface WatermarkRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WatermarkVideo {
  id: string;
  name: string;
  url: string;
  coverUrl?: string;
  size: string;
  duration: number;
  resolution: string;
}

export interface WatermarkTaskSnapshot {
  sourceVideo: WatermarkVideo;
  regions: WatermarkRegion[];
}

export interface WatermarkTaskOutput {
  name: string;
  videoUrl: string;
  coverUrl?: string;
  size: string;
  duration: number;
  resolution: string;
}

export type EnhanceResolution = "auto" | "1080p" | "2k" | "4k";
export type EnhanceFrameRate = "source" | "60";

export interface EnhanceVideo extends WatermarkVideo {
  fps: number;
}

export interface EnhanceTaskSnapshot {
  sourceVideo: EnhanceVideo;
  requestedResolution: EnhanceResolution;
  outputResolution: Exclude<EnhanceResolution, "auto">;
  frameRate: EnhanceFrameRate;
  outputFps: number;
  billingMinutes: number;
}

export interface EnhanceTaskOutput extends WatermarkTaskOutput {
  fps: number;
}

export interface QuickCreationTaskSnapshot {
  mode: "image" | "video";
  preset: "产品素材" | "痛点对比" | "使用过程" | null;
  prompt: string;
  referenceImages: string[];
  referenceVideo?: string;
  roleMaterials?: Array<{ role: string; url: string; type: "image" | "video" }>;
  imageAspectRatio: "1:1" | "3:4" | "9:16" | "16:9";
  imageQuality: "HD" | "2K" | "4K";
  imageCount: number;
  videoAspectRatio: "9:16" | "16:9";
  videoLength: number;
  model: string;
  outputLabels?: string[];
}

export interface Task {
  id: string;
  name: string;
  type:
    | "video"
    | "watermark"
    | "subtitle"
    | "enhance"
    | "face_swap"
    | "video_gen"
    | "image_gen"
    | "fission";
  status:
    "queue" | "generating" | "completed" | "failed" | "cancelled" | "ready";
  progress: number;
  inputFiles: string[];
  outputFiles?: string[];
  createdAt: string;
  creditsCost: number;
  source?: "agent" | "tool";
  category?: GenerationTaskCategory;
  autoProgress?: boolean;
  cancelledAt?: string;
  refundedCredits?: number;
  failureReason?: string;
  agentStage?: "analysis" | "script" | "preview" | "final";
  remakeStage?: "video_analysis" | "storyboard" | "final";
  remakeSessionId?: string;
  cancellable?: boolean;
  restartable?: boolean;
  aiVideoSnapshot?: AiVideoTaskSnapshot;
  aiVideoOutput?: AiVideoTaskOutput;
  aiVideoOutputs?: AiVideoTaskOutput[];
  watermarkSnapshot?: WatermarkTaskSnapshot;
  watermarkOutput?: WatermarkTaskOutput;
  subtitleSnapshot?: WatermarkTaskSnapshot;
  subtitleOutput?: WatermarkTaskOutput;
  enhanceSnapshot?: EnhanceTaskSnapshot;
  enhanceOutput?: EnhanceTaskOutput;
  quickCreationSnapshot?: QuickCreationTaskSnapshot;
  simulationStartedAt?: number;
  faceSwap?: import("./lib/videoFaceSwap").FaceSwapSession;
}

export interface CreditTransaction {
  id: string;
  type: "recharge" | "consume" | "refund";
  tool?: string;
  amount: number;
  time: string;
  date?: string;
  remark?: string;
  note?: string;
  balance?: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  type: "image" | "video";
  url: string;
  coverUrl?: string;
  likes: number;
  views: number;
  category: string;
  prompt?: string;
  duration?: string;
  tags?: string[];
}

export type ActiveScreen =
  | "operation_records"
  | "home"
  | "quick_creation"
  | "face_swap"
  | "agent_creation"
  | "video_remake"
  | "ai_video"
  | "canvas"
  | "live_management"
  | "assets"
  | "enhance"
  | "watermark"
  | "subtitle"
  | "credits"
  | "resources"
  | "materials"
  | "finished_videos"
  | "scripts"
  | "images"
  | "audio"
  | "ad_delivery"
  | "same_style_video"
  | "task_collaboration"
  | "message_center";

export type ResourceSearchType = "成片" | "素材" | "第三方" | "脚本" | "图片" | "音频";

export interface ResourceSearchIntent {
  type: ResourceSearchType;
  query?: string;
  tag?: string;
  openDetail?: boolean;
  requestId: number;
}

export interface MessageResourceLink {
  id: string;
  name: string;
  type: ResourceSearchType;
}

export interface MessageDetailItem {
  label: string;
  value: string;
  isLink?: boolean;
}

export interface AppMessage {
  id: string;
  category: string;
  subcategory: string;
  type?: string;
  title: string;
  detail: string;
  status: "unread" | "read";
  time: string;
  summary?: string;
  categoryName?: string;
  isRedDot?: boolean;
  details: MessageDetailItem[];

  // Prototype event metadata used to demonstrate source, recipient and destination.
  eventCode?: string;
  template?: "approval" | "task" | "resource" | "live" | "security";
  severity?: "info" | "success" | "warning" | "danger";
  actorName?: string;
  recipientNames?: string[];
  sourceType?: string;
  sourceId?: string;
  businessStatus?: string;
  actionLabel?: string;
  actionScreen?: ActiveScreen;
  relatedResources?: MessageResourceLink[];

  // Approval specific fields
  approvalType?: "credits";
  approvalStatus?: "pending" | "approved" | "rejected";
  applicantName?: string;
  managerName?: string;
  creditsAmount?: number;
  reason?: string;
  rejectReason?: string;
}
