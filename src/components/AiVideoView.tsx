import React, { useEffect, useMemo, useRef, useState } from "react";
import { recordDownload } from "../lib/operationHistory";
import {
  AlertCircle,
  ArrowLeft,
  Box,
  Check,
  ChevronDown,
  Download,
  Film,
  FolderOpen,
  Images,
  GitCompareArrows,
  Loader2,
  Mic2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Volume2,
  WandSparkles,
  X
} from "lucide-react";
import AssetPagination from "./AssetPagination";
import UploadFinishedVideoModal from "./UploadFinishedVideoModal";
import MediaTypeChoiceModal from "./MediaTypeChoiceModal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import OverlayPortal from "./overlays/OverlayPortal";
import AiVideoSceneMediaPicker from "./AiVideoSceneMediaPicker";
import GenerationResultCard from "./GenerationResultCard";
import { AI_VIDEO_MODE_LABELS, AI_VIDEO_SCENE_MODELS, isAiVideoSceneMode, validateAiVideoScene } from "../lib/aiVideo";
import {
  Asset,
  AiVideoMediaItem,
  AiVideoMode,
  AiVideoSceneMode,
  AiVideoSceneInputs,
  AiVideoTaskOutput,
  AiVideoTaskSnapshot,
  GalleryItem,
  Task
} from "../types";

interface AiVideoViewProps {
  assets: Asset[];
  galleryItems: GalleryItem[];
  tasks: Task[];
  activeTaskId: string | null;
  onActiveTaskChange: (taskId: string | null) => void;
  onCreateTask: (snapshot: AiVideoTaskSnapshot, creditsCost: number) => string | null;
  onConsumeCredits: (creditsCost: number, remark: string) => boolean;
  onCancelTask: (taskId: string) => void;
  onUploadVideos: (videos: Array<{ name: string; cover: string }>) => void;
  presetPrompt?: string;
  presetReferences?: string[];
  onClearPreset?: () => void;
}

type PickerTarget =
  | "references"
  | "firstFrame"
  | "lastFrame"
  | "character"
  | "backgroundVideos"
  | "singleClothing"
  | "topClothing"
  | "bottomClothing"
  | "modelMedia";

interface PickerState {
  target: PickerTarget;
  allowed: "image" | "video" | "both";
  max: number;
}

interface VoiceOption {
  id: string;
  name: string;
  scene: string;
  tone: string;
  avatar?: string;
  source: "system" | "asset";
  audioUrl?: string;
  duration?: string;
  size?: string;
  creator?: string;
  createdAt?: string;
}

const MODE_OPTIONS: Array<{
  id: AiVideoMode | "video_edit";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "reference", label: "参考生视频", description: "多图参考，生成连续动态画面", icon: Images },
  { id: "first_last", label: "首尾帧生视频", description: "连接首尾画面，生成自然过渡", icon: Film },
  { id: "dubbing", label: "配音生视频", description: "人物、音色与文案驱动口播", icon: Mic2 },
  { id: "video_edit", label: "视频编辑", description: "为原视频换背景或完成换装", icon: WandSparkles },
  { id: "pain_comparison", label: "痛点对比", description: "结合痛点与解决素材，生成对比视频", icon: GitCompareArrows },
  { id: "usage_process", label: "使用过程", description: "参考使用视频与商品图片，生成演示视频", icon: Play }
];

const MODEL_OPTIONS = [
  { id: "video-vd-1", name: "视频 VD 1.0", description: "支持多张参考图，主体一致性更强", badge: "推荐" },
  { id: "video-sd-t1.6", name: "视频 SD-T1.6", description: "人物动态表现自然，适合电商展示", badge: "" }
];

const RATIOS: AiVideoTaskSnapshot["ratio"][] = ["9:16", "16:9", "4:3", "3:4", "1:1"];
const RESULT_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4";

type DisplayAiVideoOutput = AiVideoTaskOutput & {
  id: string;
  name: string;
  size: string;
};

interface AiVideoPreviewSelection {
  task: Task;
  output: DisplayAiVideoOutput;
}

interface AiVideoUploadSelection {
  task: Task;
  outputs: DisplayAiVideoOutput[];
}

const stripFileExtension = (name: string) => name.replace(/\.[^.]+$/, "");

const getAiVideoTaskOutputs = (task: Task): DisplayAiVideoOutput[] => {
  const snapshot = task.aiVideoSnapshot;
  const sourceVideos = snapshot?.sourceVideos || [];
  const rawOutputs: AiVideoTaskOutput[] = task.aiVideoOutputs?.length
    ? task.aiVideoOutputs
    : snapshot?.mode === "background" && sourceVideos.length > 1 && task.status === "completed"
      ? sourceVideos.map((sourceVideo, index) => ({
          ...(index === 0 ? task.aiVideoOutput : undefined),
          videoUrl: task.outputFiles?.[index] || task.aiVideoOutput?.videoUrl || RESULT_VIDEO_URL,
          coverUrl: sourceVideo.coverUrl || "",
          duration: Math.min(sourceVideo.durationSeconds || snapshot.duration || 8, 8),
          sourceVideoId: sourceVideo.id
        }))
    : task.aiVideoOutput
      ? [task.aiVideoOutput]
      : task.status === "completed"
        ? (task.outputFiles?.length ? task.outputFiles : [RESULT_VIDEO_URL]).map((videoUrl) => ({
            videoUrl,
            coverUrl: "",
            duration: snapshot?.duration || 8
          }))
        : [];

  return rawOutputs.map((output, index) => {
    const sourceVideo = snapshot?.mode === "background" ? sourceVideos[index] : undefined;
    const fallbackMedia = sourceVideo
      || snapshot?.selectedLook
      || snapshot?.character
      || snapshot?.firstFrame
      || snapshot?.references?.[0]
      || snapshot?.modelMedia
      || snapshot?.clothingImages?.[0]
      || snapshot?.productImage
      || snapshot?.solutionMaterial
      || snapshot?.painMaterial
      || snapshot?.usageVideo;
    const duration = output.duration || (snapshot?.mode === "background"
      ? Math.min(sourceVideo?.durationSeconds || snapshot.duration || 8, 8)
      : snapshot?.duration || 8);
    const baseName = stripFileExtension(sourceVideo?.name || task.name);
    const defaultName = snapshot?.mode === "background"
      ? `${baseName}_换背景.mp4`
      : `${baseName}${rawOutputs.length > 1 ? `_${index + 1}` : ""}.mp4`;

    return {
      ...output,
      id: output.id || `${task.id}-output-${index + 1}`,
      name: output.name || defaultName,
      coverUrl: output.coverUrl
        || fallbackMedia?.coverUrl
        || (fallbackMedia?.type === "image" ? fallbackMedia.url : "")
        || "./assets/prototype/luxury-skincare-set.jpg",
      duration,
      size: output.size || `${(duration * 1.02 + 0.8 + index * 0.33).toFixed(2)}MB`
    };
  });
};

const formatAiVideoDuration = (duration: number) => {
  const seconds = Math.max(0, Math.round(duration));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

const STOCK_IMAGES: AiVideoMediaItem[] = [
  { id: "stock-1", name: "轻奢护肤礼盒主图.jpg", type: "image", url: "./assets/prototype/luxury-skincare-set.jpg", source: "library" },
  { id: "stock-2", name: "精华液商品特写.jpg", type: "image", url: "./assets/prototype/skincare-product.jpg", source: "library" },
  { id: "stock-3", name: "护肤品促销场景.jpg", type: "image", url: "./assets/prototype/beauty-promo-detail.jpg", source: "library" },
  { id: "stock-4", name: "都市女性自然口播.jpg", type: "image", url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-5", name: "运动服模特正面.jpg", type: "image", url: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-6", name: "商务男士口播形象.jpg", type: "image", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-7", name: "粉色连衣裙商品图.jpg", type: "image", url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-8", name: "白色针织上衣.jpg", type: "image", url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-9", name: "深色休闲长裤.jpg", type: "image", url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-10", name: "居家厨房场景.jpg", type: "image", url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-11", name: "海边日落氛围.jpg", type: "image", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-12", name: "现代客厅背景.jpg", type: "image", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-13", name: "通勤女装模特.jpg", type: "image", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-14", name: "户外产品展示.jpg", type: "image", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-15", name: "美妆达人半身照.jpg", type: "image", url: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=720&auto=format&fit=crop&q=85", source: "library" },
  { id: "stock-16", name: "清爽产品静物.jpg", type: "image", url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=720&auto=format&fit=crop&q=85", source: "library" }
];

const STOCK_VIDEOS: AiVideoMediaItem[] = [
  { id: "video-1", name: "夏日护肤产品展示.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: "./assets/prototype/skincare-product.jpg", durationSeconds: 6, source: "library" },
  { id: "video-2", name: "都市女性口播原片.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: STOCK_IMAGES[3].url, durationSeconds: 12, source: "library" },
  { id: "video-3", name: "运动服模特走秀.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: STOCK_IMAGES[4].url, durationSeconds: 8, source: "library" },
  { id: "video-4", name: "精华液桌面陈列.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: STOCK_IMAGES[1].url, durationSeconds: 17, source: "library" },
  { id: "video-5", name: "轻奢礼盒开箱.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: STOCK_IMAGES[0].url, durationSeconds: 7, source: "library" },
  { id: "video-6", name: "商务男士产品讲解.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: STOCK_IMAGES[5].url, durationSeconds: 15, source: "library" },
  { id: "video-7", name: "家居场景种草.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: STOCK_IMAGES[9].url, durationSeconds: 10, source: "library" },
  { id: "video-8", name: "海边防晒氛围片.mp4", type: "video", url: RESULT_VIDEO_URL, coverUrl: STOCK_IMAGES[10].url, durationSeconds: 9, source: "library" }
];

const VOICES: VoiceOption[] = [
  { id: "clear-female", name: "清醒语录", scene: "自然对话", tone: "清晰、克制", avatar: STOCK_IMAGES[3].url, source: "system" },
  { id: "story-girl", name: "儿童绘本", scene: "故事讲述", tone: "温柔、亲切", avatar: STOCK_IMAGES[14].url, source: "system" },
  { id: "vivid-male", name: "生动解说", scene: "商品讲解", tone: "明快、有感染力", avatar: STOCK_IMAGES[5].url, source: "system" },
  { id: "premium-female", name: "精品有声书", scene: "质感旁白", tone: "沉稳、细腻", avatar: STOCK_IMAGES[6].url, source: "system" },
  { id: "smooth-female", name: "流畅女声", scene: "电商口播", tone: "自然、轻快", avatar: STOCK_IMAGES[15].url, source: "system" },
  { id: "sunny-male", name: "阳光男生", scene: "潮流种草", tone: "活力、年轻", avatar: STOCK_IMAGES[5].url, source: "system" },
  { id: "warm-aunt", name: "温暖生活家", scene: "生活分享", tone: "松弛、可信", avatar: STOCK_IMAGES[13].url, source: "system" }
];

const MODE_LABELS = AI_VIDEO_MODE_LABELS;

const DEFAULT_PROMPTS: Record<AiVideoMode, string> = {
  reference: "镜头缓慢推进，商品始终保持清晰，人物自然展示产品细节，光线柔和，画面具有真实电商广告质感。",
  first_last: "从首帧自然过渡到尾帧，主体动作连贯，镜头轻微环绕，商品外观与背景结构保持一致。",
  dubbing: "这款精华质地清透，上脸吸收很快，日常护肤使用也不会有黏腻感。",
  background: "将背景替换为明亮整洁的现代家居空间，保留人物与商品主体，光线方向和原视频一致。",
  outfit: "模特先正面展示服装，再缓慢向右转身，动作自然舒展，完整呈现服装正面、侧面与背面细节。",
  pain_comparison: "",
  usage_process: ""
};

const demoSnapshot = (mode: AiVideoMode): AiVideoTaskSnapshot => ({
  mode,
  model: mode === "reference" ? "video-vd-1" : "video-sd-t1.6",
  ratio: "9:16",
  duration: 8,
  prompt: DEFAULT_PROMPTS[mode],
  references: mode === "reference" ? [STOCK_IMAGES[0], STOCK_IMAGES[3]] : [],
  firstFrame: mode === "first_last" ? STOCK_IMAGES[1] : null,
  lastFrame: mode === "first_last" ? STOCK_IMAGES[10] : null,
  character: mode === "dubbing" ? STOCK_IMAGES[3] : null,
  voiceId: mode === "dubbing" ? VOICES[0].id : undefined,
  voiceName: mode === "dubbing" ? VOICES[0].name : undefined,
  speech: mode === "dubbing" ? DEFAULT_PROMPTS.dubbing : undefined,
  sourceVideos: mode === "background" ? [STOCK_VIDEOS[1]] : [],
  outfitMode: mode === "outfit" ? "single" : undefined,
  clothingImages: mode === "outfit" ? [STOCK_IMAGES[7]] : [],
  modelMedia: mode === "outfit" ? STOCK_IMAGES[4] : null,
  selectedLook: mode === "outfit" ? STOCK_IMAGES[12] : null,
  actionDescription: mode === "outfit" ? DEFAULT_PROMPTS.outfit : undefined
});

export default function AiVideoView({
  assets,
  galleryItems,
  tasks,
  activeTaskId,
  onActiveTaskChange,
  onCreateTask,
  onConsumeCredits,
  onCancelTask,
  onUploadVideos,
  presetPrompt,
  presetReferences,
  onClearPreset
}: AiVideoViewProps) {
  const [mode, setMode] = useState<AiVideoMode>("reference");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [model, setModel] = useState(MODEL_OPTIONS[0].id);
  const [sceneModels, setSceneModels] = useState<Record<AiVideoSceneMode, string>>({ pain_comparison: AI_VIDEO_SCENE_MODELS[0].id, usage_process: AI_VIDEO_SCENE_MODELS[0].id });
  const [sceneInputs, setSceneInputs] = useState<Record<AiVideoSceneMode, AiVideoSceneInputs>>({ pain_comparison: {}, usage_process: {} });
  const [scenePicker, setScenePicker] = useState<{ mode: AiVideoSceneMode; target: Exclude<keyof AiVideoSceneInputs, "prompt">; allowed: "image" | "video" | "both" } | null>(null);
  const [ratio, setRatio] = useState<AiVideoTaskSnapshot["ratio"]>("9:16");
  const [durations, setDurations] = useState({ reference: 8, first_last: 8, outfit: 8, pain_comparison: 8, usage_process: 8 });
  const [referencePrompt, setReferencePrompt] = useState(DEFAULT_PROMPTS.reference);
  const [firstLastPrompt, setFirstLastPrompt] = useState(DEFAULT_PROMPTS.first_last);
  const [references, setReferences] = useState<AiVideoMediaItem[]>([]);
  const [firstFrame, setFirstFrame] = useState<AiVideoMediaItem | null>(null);
  const [lastFrame, setLastFrame] = useState<AiVideoMediaItem | null>(null);
  const [character, setCharacter] = useState<AiVideoMediaItem | null>(null);
  const [voice, setVoice] = useState<VoiceOption | null>(null);
  const [speech, setSpeech] = useState("");
  const [dubbingAction, setDubbingAction] = useState("");
  const [backgroundVideos, setBackgroundVideos] = useState<AiVideoMediaItem[]>([]);
  const [backgroundPrompt, setBackgroundPrompt] = useState(DEFAULT_PROMPTS.background);
  const [outfitMode, setOutfitMode] = useState<"single" | "multiple">("single");
  const [singleClothing, setSingleClothing] = useState<AiVideoMediaItem | null>(null);
  const [topClothing, setTopClothing] = useState<AiVideoMediaItem | null>(null);
  const [bottomClothing, setBottomClothing] = useState<AiVideoMediaItem | null>(null);
  const [modelMedia, setModelMedia] = useState<AiVideoMediaItem | null>(null);
  const [outfitAction, setOutfitAction] = useState(DEFAULT_PROMPTS.outfit);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [modelMediaTypePickerOpen, setModelMediaTypePickerOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [outfitPreview, setOutfitPreview] = useState(false);
  const [outfitPreviewProgress, setOutfitPreviewProgress] = useState(0);
  const [outfitCandidates, setOutfitCandidates] = useState<AiVideoMediaItem[]>([]);
  const [selectedLook, setSelectedLook] = useState<AiVideoMediaItem | null>(null);
  const [confirmOutfitReturn, setConfirmOutfitReturn] = useState(false);
  const [previewSelection, setPreviewSelection] = useState<AiVideoPreviewSelection | null>(null);
  const [uploadSelection, setUploadSelection] = useState<AiVideoUploadSelection | null>(null);
  const [toast, setToast] = useState("");
  const lastFocusedTask = useRef<string | null>(null);
  const modeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modelButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);

  const libraryItems = useMemo(() => {
    const galleryMedia: AiVideoMediaItem[] = galleryItems.map((item) => ({
      id: `gallery-${item.id}`,
      name: item.title,
      type: item.type,
      url: item.url,
      coverUrl: item.coverUrl,
      durationSeconds: item.type === "video" ? Number.parseInt(item.duration || "8", 10) || 8 : undefined,
      source: "library"
    }));
    const seen = new Set<string>();
    return [...galleryMedia, ...STOCK_IMAGES, ...STOCK_VIDEOS].filter((item) => {
      const key = `${item.type}-${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [galleryItems]);

  const resourceVoices = useMemo<VoiceOption[]>(() => assets
    .filter((asset) => !asset.deletedAt && Boolean(asset.url) && (asset.type === "audio" || asset.resourceCategory === "音频"))
    .map((asset) => ({
      id: `asset-${asset.id}`,
      name: asset.name,
      scene: "资源库音频",
      tone: asset.category || "资源库音频",
      source: "asset",
      audioUrl: asset.url,
      duration: asset.fileInfo?.duration || "--",
      size: asset.fileInfo?.size || asset.size || "--",
      creator: asset.creator || "--",
      createdAt: asset.createdAt || "--"
    })), [assets]);
  const availableVoices = useMemo(() => [...VOICES, ...resourceVoices], [resourceVoices]);

  const taskRecords = useMemo(() => {
    return tasks
      .filter((task) => task.category === "ai_video")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [tasks]);
  const modeRecords = useMemo(
    () => taskRecords.filter((task) => (task.aiVideoSnapshot?.mode || "reference") === mode),
    [mode, taskRecords]
  );

  useEffect(() => {
    if (presetPrompt) setReferencePrompt(presetPrompt);
    if (presetReferences?.length) {
      setReferences(presetReferences.slice(0, 7).map((url, index) => ({ id: `preset-${index}-${url}`, name: `同款参考图${index + 1}.jpg`, type: "image", url, source: "library" })));
      setMode("reference");
    }
    if (presetPrompt || presetReferences?.length) onClearPreset?.();
  }, [onClearPreset, presetPrompt, presetReferences]);

  useEffect(() => {
    if (!outfitPreview || outfitCandidates.length > 0) return;
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const next = Math.min(100, Math.round(((Date.now() - startedAt) / 5000) * 100));
      setOutfitPreviewProgress(next);
      if (next >= 100) {
        const stamp = Date.now();
        setOutfitCandidates([
          { ...STOCK_IMAGES[12], id: `look-${stamp}-1`, name: "搭配预览 1", source: "generated" },
          { ...STOCK_IMAGES[4], id: `look-${stamp}-2`, name: "搭配预览 2", source: "generated" },
          { ...STOCK_IMAGES[6], id: `look-${stamp}-3`, name: "搭配预览 3", source: "generated" },
          { ...STOCK_IMAGES[14], id: `look-${stamp}-4`, name: "搭配预览 4", source: "generated" }
        ]);
        window.clearInterval(interval);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [outfitCandidates.length, outfitPreview]);

  useEffect(() => {
    if (!activeTaskId || lastFocusedTask.current === activeTaskId) return;
    const task = taskRecords.find((item) => item.id === activeTaskId);
    if (!task) return;
    lastFocusedTask.current = activeTaskId;
    setMode(task.aiVideoSnapshot?.mode || "reference");
    window.setTimeout(() => document.getElementById(`ai-video-record-${activeTaskId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }, [activeTaskId, taskRecords]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const sceneMode = isAiVideoSceneMode(mode) ? mode : null;
  const sceneModel = AI_VIDEO_SCENE_MODELS.find((item) => item.id === (sceneMode ? sceneModels[sceneMode] : "")) || AI_VIDEO_SCENE_MODELS[0];
  const availableModels = sceneMode ? AI_VIDEO_SCENE_MODELS : MODEL_OPTIONS;
  const selectedModel = sceneMode ? sceneModel : MODEL_OPTIONS.find((item) => item.id === model) || MODEL_OPTIONS[0];
  const speechDuration = Math.max(3, Math.ceil(Math.max(1, speech.trim().length) / 4));
  const currentDuration = sceneMode ? Math.max(4, Math.min(durations[sceneMode], sceneModel.maxSeconds)) : mode === "reference"
    ? durations.reference
    : mode === "first_last"
      ? durations.first_last
      : mode === "outfit"
        ? durations.outfit
        : mode === "background"
          ? 8
          : speechDuration;
  const currentCost = useMemo(() => {
    if (sceneMode) return sceneModel.videoCost;
    if (mode === "reference") return 16 + durations.reference * 3;
    if (mode === "first_last") return 20 + durations.first_last * 5;
    if (mode === "dubbing") return 16 + Math.ceil(speech.trim().length / 5) * 3;
    if (mode === "background") return 24 + Math.max(1, backgroundVideos.length) * 10;
    return 27 + durations.outfit * 3 + (outfitMode === "multiple" ? 10 : 5);
  }, [backgroundVideos.length, durations.first_last, durations.outfit, durations.reference, mode, outfitMode, speech, sceneMode, sceneModel]);

  const canGenerate = sceneMode ? !validateAiVideoScene(sceneMode, sceneInputs[sceneMode]) : mode === "reference"
    ? references.length > 0 && Boolean(referencePrompt.trim())
    : mode === "first_last"
      ? Boolean(firstFrame && lastFrame && firstLastPrompt.trim())
      : mode === "dubbing"
        ? Boolean(character && voice && speech.trim())
        : mode === "background"
          ? backgroundVideos.length > 0 && Boolean(backgroundPrompt.trim())
          : Boolean(selectedLook && modelMedia && outfitAction.trim());

  const showMode = (nextMode: AiVideoMode) => {
    setMode(nextMode);
    setModeMenuOpen(false);
    setOutfitPreview(false);
    setSettingsOpen(false);
    setModelMenuOpen(false);
    onActiveTaskChange(null);
  };

  const openPicker = (target: PickerTarget, allowed: PickerState["allowed"], max: number) => setPicker({ target, allowed, max });

  const pickerSelection = (): AiVideoMediaItem[] => {
    if (!picker) return [];
    if (picker.target === "references") return references;
    if (picker.target === "firstFrame") return firstFrame ? [firstFrame] : [];
    if (picker.target === "lastFrame") return lastFrame ? [lastFrame] : [];
    if (picker.target === "character") return character ? [character] : [];
    if (picker.target === "backgroundVideos") return backgroundVideos;
    if (picker.target === "singleClothing") return singleClothing ? [singleClothing] : [];
    if (picker.target === "topClothing") return topClothing ? [topClothing] : [];
    if (picker.target === "bottomClothing") return bottomClothing ? [bottomClothing] : [];
    return modelMedia ? [modelMedia] : [];
  };

  const applyPickerSelection = (items: AiVideoMediaItem[]) => {
    if (!picker) return;
    if (picker.target === "references") setReferences(items.slice(0, 7));
    if (picker.target === "firstFrame") setFirstFrame(items[0] || null);
    if (picker.target === "lastFrame") setLastFrame(items[0] || null);
    if (picker.target === "character") setCharacter(items[0] || null);
    if (picker.target === "backgroundVideos") setBackgroundVideos(items.slice(0, 5));
    if (picker.target === "singleClothing") setSingleClothing(items[0] || null);
    if (picker.target === "topClothing") setTopClothing(items[0] || null);
    if (picker.target === "bottomClothing") setBottomClothing(items[0] || null);
    if (picker.target === "modelMedia") setModelMedia(items[0] || null);
    setPicker(null);
  };

  const hydrateSnapshot = (snapshot: AiVideoTaskSnapshot) => {
    setMode(snapshot.mode);
    if (isAiVideoSceneMode(snapshot.mode)) {
      const restoredModel = AI_VIDEO_SCENE_MODELS.find((item) => item.id === snapshot.model) || AI_VIDEO_SCENE_MODELS[0];
      setSceneModels((current) => ({ ...current, [snapshot.mode]: restoredModel.id }));
      setSceneInputs((current) => ({ ...current, [snapshot.mode]: {
        painMaterial: snapshot.painMaterial, solutionMaterial: snapshot.solutionMaterial,
        usageVideo: snapshot.usageVideo, productImage: snapshot.productImage, prompt: snapshot.prompt || "",
      } }));
      setDurations((current) => ({ ...current, [snapshot.mode]: Math.max(4, Math.min(snapshot.duration || 8, restoredModel.maxSeconds)) }));
    } else setModel(snapshot.model || MODEL_OPTIONS[0].id);
    setRatio(snapshot.ratio || "9:16");
    if (snapshot.mode === "reference") {
      setReferences(snapshot.references || []);
      setReferencePrompt(snapshot.prompt || DEFAULT_PROMPTS.reference);
      setDurations((current) => ({ ...current, reference: snapshot.duration || 8 }));
    }
    if (snapshot.mode === "first_last") {
      setFirstFrame(snapshot.firstFrame || null);
      setLastFrame(snapshot.lastFrame || null);
      setFirstLastPrompt(snapshot.prompt || DEFAULT_PROMPTS.first_last);
      setDurations((current) => ({ ...current, first_last: snapshot.duration || 8 }));
    }
    if (snapshot.mode === "dubbing") {
      setCharacter(snapshot.character || null);
      setVoice(availableVoices.find((item) => item.id === snapshot.voiceId) || null);
      setSpeech(snapshot.speech || "");
      setDubbingAction(snapshot.actionDescription || "");
    }
    if (snapshot.mode === "background") {
      setBackgroundVideos(snapshot.sourceVideos || []);
      setBackgroundPrompt(snapshot.prompt || DEFAULT_PROMPTS.background);
    }
    if (snapshot.mode === "outfit") {
      const clothing = snapshot.clothingImages || [];
      setOutfitMode(snapshot.outfitMode || "single");
      setSingleClothing(snapshot.outfitMode === "single" ? clothing[0] || null : null);
      setTopClothing(snapshot.outfitMode === "multiple" ? clothing[0] || null : null);
      setBottomClothing(snapshot.outfitMode === "multiple" ? clothing[1] || null : null);
      setModelMedia(snapshot.modelMedia || null);
      setSelectedLook(snapshot.selectedLook || null);
      setOutfitAction(snapshot.actionDescription || DEFAULT_PROMPTS.outfit);
      setDurations((current) => ({ ...current, outfit: snapshot.duration || 8 }));
      setOutfitPreview(Boolean(snapshot.selectedLook));
      setOutfitPreviewProgress(snapshot.selectedLook ? 100 : 0);
      setOutfitCandidates(snapshot.selectedLook ? [snapshot.selectedLook] : []);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildSnapshot = (): AiVideoTaskSnapshot => {
    const baseSnapshot = { mode, model: selectedModel.id, ratio, duration: currentDuration };

    if (sceneMode) {
      const inputs = sceneInputs[sceneMode];
      return { ...baseSnapshot, prompt: inputs.prompt?.trim() || "",
        ...(sceneMode === "pain_comparison"
          ? { painMaterial: inputs.painMaterial, solutionMaterial: inputs.solutionMaterial }
          : { usageVideo: inputs.usageVideo, productImage: inputs.productImage }),
      };
    }

    if (mode === "reference") {
      return { ...baseSnapshot, prompt: referencePrompt, references };
    }
    if (mode === "first_last") {
      return { ...baseSnapshot, prompt: firstLastPrompt, firstFrame, lastFrame };
    }
    if (mode === "dubbing") {
      return {
        ...baseSnapshot,
        character,
        voiceId: voice?.id,
        voiceName: voice?.name,
        speech,
        actionDescription: dubbingAction
      };
    }
    if (mode === "background") {
      return { ...baseSnapshot, prompt: backgroundPrompt, sourceVideos: backgroundVideos };
    }

    const clothingImages = outfitMode === "single"
      ? (singleClothing ? [singleClothing] : [])
      : [topClothing, bottomClothing].filter(Boolean) as AiVideoMediaItem[];
    return {
      ...baseSnapshot,
      outfitMode,
      clothingImages,
      modelMedia,
      selectedLook,
      actionDescription: outfitAction
    };
  };

  const submitGeneration = () => {
    if (!canGenerate) return;
    const taskId = onCreateTask(buildSnapshot(), currentCost);
    if (!taskId) return;
    onActiveTaskChange(taskId);
    setToast("任务已加入队列，将在后台继续生成");
    window.setTimeout(() => document.getElementById(`ai-video-record-${taskId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  const startOutfitPreview = () => {
    const hasClothing = outfitMode === "single" ? Boolean(singleClothing) : Boolean(topClothing && bottomClothing);
    if (!hasClothing || !modelMedia) return;
    if (!onConsumeCredits(5, "生成换装搭配预览")) return;
    setOutfitPreview(true);
    setOutfitPreviewProgress(0);
    setOutfitCandidates([]);
    setSelectedLook(null);
  };

  const cancelRecord = (task: Task) => {
    if (task.status !== "queue") return;
    onCancelTask(task.id);
    setToast("排队已取消，积分已退回");
  };

  const reEditTask = (task: Task) => {
    hydrateSnapshot(task.aiVideoSnapshot || demoSnapshot("reference"));
    onActiveTaskChange(task.id);
    setToast("已恢复该任务的全部生成参数");
  };

  const downloadOutput = (output: DisplayAiVideoOutput) => {
    const anchor = document.createElement("a");
    anchor.href = output.videoUrl;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.download = output.name;
    recordDownload(output.name, "AI视频原料");
    anchor.click();
    setToast(`已开始下载：${output.name}`);
  };

  const renderMedia = (item: AiVideoMediaItem, className = "") => item.type === "video" ? (
    <video src={item.url} poster={item.coverUrl} muted className={className} />
  ) : (
    <img src={item.url} alt={item.name} referrerPolicy="no-referrer" className={className} />
  );

  const renderUploadTile = (item: AiVideoMediaItem | null, label: string, onClick: () => void, onRemove?: () => void, compact = false, hideLabel = false) => (
    <div className="group relative">
      <button type="button" onClick={onClick} className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors ${compact ? "h-28" : "h-36"} ${item ? "border-slate-200 bg-slate-100" : "border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:bg-violet-50/40 hover:text-violet-700"}`}>
        {item ? <>{renderMedia(item, "h-full w-full object-cover")}<span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1.5 text-left text-[10px] text-white">{item.name}</span></> : <><Plus className="h-5 w-5" /><span className={hideLabel ? "sr-only" : "mt-2 text-xs font-semibold"}>{label}</span><span className="mt-1 text-[10px] text-slate-400">资源库选择或本地上传</span></>}
      </button>
      {item && onRemove && <button type="button" title="移除" onClick={onRemove} className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded bg-black/65 text-white group-hover:flex"><Trash2 className="h-3.5 w-3.5" /></button>}
    </div>
  );

  const renderPromptEditor = (value: string, onChange: (value: string) => void, placeholder: string, maxLength = 1000) => (
    <div className="relative rounded-md border border-slate-200 bg-white focus-within:border-violet-400">
      <textarea value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-40 w-full resize-none bg-transparent px-3 py-3 pb-10 text-xs leading-6 text-slate-700 outline-none placeholder:text-slate-400" />
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">{value.length}/{maxLength}</span>
    </div>
  );

  const renderReferenceControls = () => <div className="space-y-4"><div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold text-slate-700">参考内容</label><span className="text-[10px] text-slate-400">{references.length}/7</span></div><div className="grid grid-cols-4 gap-2">{references.map((item) => <div key={item.id} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200">{renderMedia(item, "h-full w-full object-cover")}<button onClick={() => setReferences((current) => current.filter((media) => media.id !== item.id))} title="删除" className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded bg-black/65 text-white group-hover:flex"><Trash2 className="h-3 w-3" /></button></div>)}{references.length < 7 && <button onClick={() => openPicker("references", "image", 7)} className="flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700"><Plus className="h-5 w-5" /><span className="mt-1.5 text-[10px]">添加图片</span></button>}</div></div><div><label className="mb-2 block text-xs font-bold text-slate-700">画面描述</label>{renderPromptEditor(referencePrompt, setReferencePrompt, "描述参考图片中主体的动作、表情、镜头与场景变化")}</div></div>;

  const renderFirstLastControls = () => <div className="space-y-4"><div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">{renderUploadTile(firstFrame, "首帧图", () => openPicker("firstFrame", "image", 1), () => setFirstFrame(null), true)}<div className="flex items-center justify-center text-slate-400">→</div>{renderUploadTile(lastFrame, "尾帧图", () => openPicker("lastFrame", "image", 1), () => setLastFrame(null), true)}</div><p className="rounded-md bg-blue-50 px-3 py-2 text-[10px] leading-5 text-blue-700">首帧和尾帧均为必填，系统会生成两幅画面间连续自然的过渡。</p><div><label className="mb-2 block text-xs font-bold text-slate-700">画面描述</label>{renderPromptEditor(firstLastPrompt, setFirstLastPrompt, "描述镜头运动、主体动作及首尾画面的衔接方式")}</div></div>;

  const renderDubbingControls = () => <div className="space-y-4"><div className="grid grid-cols-2 gap-3">{renderUploadTile(character, "人物", () => openPicker("character", "image", 1), () => setCharacter(null), true)}<button onClick={() => setVoicePickerOpen(true)} className={`relative flex h-28 flex-col items-center justify-center overflow-hidden rounded-md border ${voice ? "border-violet-300 bg-violet-50" : "border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700"}`}>{voice ? <>{voice.avatar ? <img src={voice.avatar} alt="" className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600"><Volume2 className="h-5 w-5" /></span>}<span className="mt-2 max-w-[90%] truncate text-xs font-bold text-slate-700">{voice.name}</span><span className="mt-0.5 text-[10px] text-slate-400">{voice.source === "asset" ? "资源库音频" : voice.tone}</span></> : <><Volume2 className="h-5 w-5" /><span className="mt-2 text-xs font-semibold">音色</span><span className="mt-1 text-[10px] text-slate-400">选择 1 个音色</span></>}</button></div><div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold text-slate-700">说话内容</label><span className="text-[10px] text-slate-400">约 {speechDuration} 秒 · {speech.length}/150</span></div>{renderPromptEditor(speech, setSpeech, "请输入你希望角色说出的口播内容", 150)}</div><div><label className="mb-2 block text-xs font-bold text-slate-700">动作描述 <span className="font-normal text-slate-400">（可选）</span></label><textarea value={dubbingAction} maxLength={300} onChange={(event) => setDubbingAction(event.target.value)} placeholder="描述镜头和人物动作，例如：人物面对镜头自然微笑，手持商品轻轻转动" className="h-20 w-full resize-none rounded-md border border-slate-200 p-3 text-xs leading-5 outline-none focus:border-violet-400" /></div></div>;

  const renderBackgroundControls = () => <div className="space-y-4"><div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold text-slate-700">原视频</label><span className="text-[10px] text-slate-400">{backgroundVideos.length}/5</span></div><div className="grid grid-cols-3 gap-2">{backgroundVideos.map((item) => <div key={item.id} className="group relative aspect-[3/4] overflow-hidden rounded-md border border-slate-200">{renderMedia(item, "h-full w-full object-cover")}<span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] text-white">{Math.min(item.durationSeconds || 8, 8)}s{(item.durationSeconds || 0) > 8 ? " · 已截取" : ""}</span><button onClick={() => setBackgroundVideos((current) => current.filter((media) => media.id !== item.id))} title="删除" className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded bg-black/65 text-white group-hover:flex"><Trash2 className="h-3 w-3" /></button></div>)}{backgroundVideos.length < 5 && <button onClick={() => openPicker("backgroundVideos", "video", 5)} className="flex aspect-[3/4] flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700"><Plus className="h-5 w-5" /><span className="mt-2 text-[10px]">添加原视频</span></button>}</div></div><p className="rounded-md bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-700">换背景最多处理每个素材的前 8 秒，超过 8 秒将自动截取。</p><div><label className="mb-2 block text-xs font-bold text-slate-700">背景描述 <span className="text-rose-500">*</span></label>{renderPromptEditor(backgroundPrompt, setBackgroundPrompt, "描述需要替换的新背景、光线、景别与环境氛围")}</div></div>;

  const renderOutfitSetup = () => {
    const hasClothing = outfitMode === "single" ? Boolean(singleClothing) : Boolean(topClothing && bottomClothing);
    return <div className="space-y-5"><div><label className="mb-2 block text-xs font-bold text-slate-700">添加服装</label><div className="inline-flex rounded-md bg-slate-100 p-1"><button onClick={() => setOutfitMode("single")} className={`rounded px-3 py-1.5 text-xs font-semibold ${outfitMode === "single" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>单件服装</button><button onClick={() => setOutfitMode("multiple")} className={`rounded px-3 py-1.5 text-xs font-semibold ${outfitMode === "multiple" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>多件服装</button></div></div>{outfitMode === "single" ? renderUploadTile(singleClothing, "服装图", () => openPicker("singleClothing", "image", 1), () => setSingleClothing(null), true) : <div className="grid grid-cols-2 gap-3">{renderUploadTile(topClothing, "上装", () => openPicker("topClothing", "image", 1), () => setTopClothing(null), true)}{renderUploadTile(bottomClothing, "下装", () => openPicker("bottomClothing", "image", 1), () => setBottomClothing(null), true)}</div>}<div><label className="mb-2 block text-xs font-bold text-slate-700">添加模特</label>{renderUploadTile(modelMedia, "模特图片或视频", () => setModelMediaTypePickerOpen(true), () => setModelMedia(null))}</div><button disabled={!hasClothing || !modelMedia} onClick={startOutfitPreview} className="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="h-4 w-4" />预览搭配 <span className="text-violet-200">· 5 积分</span></button></div>;
  };

  const renderOutfitPreview = () => <div className="space-y-5"><button onClick={() => outfitCandidates.length ? setConfirmOutfitReturn(true) : setOutfitPreview(false)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-violet-700"><ArrowLeft className="h-4 w-4" />返回</button><div><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">选择搭配效果</h3><p className="mt-1 text-[10px] text-slate-400">系统将生成 4 张搭配预览</p></div>{outfitCandidates.length > 0 && <button onClick={startOutfitPreview} className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-violet-700"><RefreshCw className="h-3.5 w-3.5" />重新生成</button>}</div><div className="grid grid-cols-4 gap-2">{outfitPreviewProgress < 100 ? [0, 1, 2, 3].map((index) => <div key={index} className="relative aspect-[3/5] overflow-hidden rounded-md bg-violet-100"><div className="absolute inset-0 animate-pulse bg-gradient-to-b from-violet-100 to-violet-200" /><span className="absolute left-1.5 top-1.5 rounded bg-white/85 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700">生成中 {outfitPreviewProgress}%</span></div>) : outfitCandidates.map((item) => <button key={item.id} onClick={() => setSelectedLook(item)} className={`relative aspect-[3/5] overflow-hidden rounded-md border-2 ${selectedLook?.id === item.id ? "border-violet-600 ring-2 ring-violet-100" : "border-transparent hover:border-violet-300"}`}><img src={item.url} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />{selectedLook?.id === item.id && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white"><Check className="h-3 w-3" /></span>}</button>)}</div></div>{outfitPreviewProgress < 100 ? <div className="rounded-md border border-violet-100 bg-violet-50 p-3"><div className="mb-2 flex justify-between text-[10px] font-semibold text-violet-700"><span>正在生成搭配预览</span><span>{outfitPreviewProgress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${outfitPreviewProgress}%` }} /></div></div> : <div><label className="mb-2 block text-xs font-bold text-slate-700">动作描述</label>{renderPromptEditor(outfitAction, setOutfitAction, "描述模特动作，例如：微微向右侧转动，再缓慢转身展示背面服装")}</div>}</div>;

  const renderSceneControls = (selectedMode: AiVideoSceneMode) => {
    const inputs = sceneInputs[selectedMode];
    const slots: Array<{ target: Exclude<keyof AiVideoSceneInputs, "prompt">; label: string; allowed: "image" | "video" | "both" }> = selectedMode === "pain_comparison"
      ? [{ target: "painMaterial", label: "痛点素材", allowed: "both" }, { target: "solutionMaterial", label: "解决痛点素材", allowed: "both" }]
      : [{ target: "usageVideo", label: "使用过程视频", allowed: "video" }, { target: "productImage", label: "商品图片", allowed: "image" }];
    return <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {slots.map(({ target, label, allowed }) => <div key={target}>
          <label className="mb-2 block text-xs font-bold text-slate-700">{label}</label>
          {renderUploadTile(inputs[target] || null, `添加${label}`, () => setScenePicker({ mode: selectedMode, target, allowed }), () => setSceneInputs((current) => ({ ...current, [selectedMode]: { ...current[selectedMode], [target]: null } })), true, true)}
        </div>)}
      </div>
      <div>
        <label className="mb-2 block text-xs font-bold text-slate-700">提示词</label>
        {renderPromptEditor(inputs.prompt || "", (prompt) => setSceneInputs((current) => ({ ...current, [selectedMode]: { ...current[selectedMode], prompt } })), selectedMode === "pain_comparison" ? "可补充对比重点、镜头或风格要求；留空则根据素材生成" : "可补充使用步骤、镜头或风格要求；留空则根据素材生成")}
      </div>
    </div>;
  };

  const renderControlBody = () => {
    if (sceneMode) return renderSceneControls(sceneMode);
    if (mode === "reference") return renderReferenceControls();
    if (mode === "first_last") return renderFirstLastControls();
    if (mode === "dubbing") return renderDubbingControls();
    if (mode === "background") return renderBackgroundControls();
    return outfitPreview ? renderOutfitPreview() : renderOutfitSetup();
  };

  const rangeConfig = sceneMode
    ? { min: 4, max: sceneModel.maxSeconds, value: currentDuration, set: (value: number) => setDurations((current) => ({ ...current, [sceneMode]: value })) }
    : mode === "reference"
    ? { min: 1, max: 10, value: durations.reference, set: (value: number) => setDurations((current) => ({ ...current, reference: value })) }
    : mode === "first_last"
      ? { min: 3, max: 12, value: durations.first_last, set: (value: number) => setDurations((current) => ({ ...current, first_last: value })) }
      : { min: 3, max: 12, value: durations.outfit, set: (value: number) => setDurations((current) => ({ ...current, outfit: value })) };

  if (uploadSelection) {
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        {toast && <OverlayPortal layer="toast" className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</OverlayPortal>}
        <UploadFinishedVideoModal
          key={`${uploadSelection.task.id}-${uploadSelection.outputs.map((output) => output.id).join("-")}`}
          isOpen
          isPage
          initialFiles={uploadSelection.outputs.map((output) => ({ name: output.name, type: "video/mp4", url: output.videoUrl }))}
          onClose={() => setUploadSelection(null)}
          onPublishSuccess={(message) => {
            onUploadVideos(uploadSelection.outputs.map((output) => ({ name: output.name, cover: output.coverUrl })));
            setToast(message);
          }}
        />
      </div>
    );
  }

  return <section className="flex h-full min-h-[720px] flex-col overflow-hidden bg-slate-50 text-slate-800">
    <div className="grid min-h-0 flex-1 grid-cols-[390px_minmax(0,1fr)] gap-3 p-4 max-xl:grid-cols-[350px_minmax(0,1fr)] max-lg:block max-lg:overflow-y-auto">
      <aside className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm max-lg:min-h-[680px]">
        <div className="relative flex shrink-0 items-center gap-2 border-b border-slate-200 p-3">
          <div className="relative">
            <button
              ref={modeButtonRef}
              type="button"
              aria-expanded={modeMenuOpen}
              onClick={() => {
                setModeMenuOpen((open) => !open);
                setModelMenuOpen(false);
                setSettingsOpen(false);
              }}
              className="flex h-9 min-w-[142px] items-center justify-between gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-800 hover:border-violet-300"
            >
              <span>{mode === "background" || mode === "outfit" ? "视频编辑" : MODE_LABELS[mode]}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${modeMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {modeMenuOpen && (
              <AnchoredPopover
                anchorRef={modeButtonRef}
                width={350}
                onClose={() => setModeMenuOpen(false)}
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
              >
                <p className="mb-2 text-[11px] font-semibold text-slate-500">视频功能选择</p>
                <div className="space-y-2">
                  {MODE_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === mode || (item.id === "video_edit" && (mode === "background" || mode === "outfit"));
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => showMode(item.id === "video_edit" ? "background" : item.id)}
                        className={`flex w-full items-center gap-3 rounded-md border p-3 text-left ${active ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"}`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-800">{item.label}{item.id === "reference" && <b className="rounded bg-cyan-50 px-1.5 py-0.5 text-[9px] text-cyan-700">NEW</b>}</span>
                          <span className="mt-1 block text-[10px] text-slate-400">{item.description}</span>
                        </span>
                        {active && <Check className="h-4 w-4 text-violet-600" />}
                      </button>
                    );
                  })}
                </div>
              </AnchoredPopover>
            )}
          </div>
          <div className="relative min-w-0 flex-1">
            <button
              ref={modelButtonRef}
              type="button"
              aria-expanded={modelMenuOpen}
              onClick={() => {
                setModelMenuOpen((open) => !open);
                setModeMenuOpen(false);
                setSettingsOpen(false);
              }}
              className="flex h-9 w-full items-center justify-between gap-2 rounded-md bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
            >
              <span className="flex min-w-0 items-center gap-1.5"><Box className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{selectedModel.name}</span></span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </button>
            {modelMenuOpen && (
              <AnchoredPopover
                anchorRef={modelButtonRef}
                align="end"
                width={320}
                onClose={() => setModelMenuOpen(false)}
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
              >
                <p className="mb-2 text-[11px] font-semibold text-slate-500">选择模型</p>
                {availableModels.map((item) => (
                  <button key={item.id} type="button" onClick={() => {
                    if (sceneMode) {
                      setSceneModels((current) => ({ ...current, [sceneMode]: item.id }));
                      const nextModel = AI_VIDEO_SCENE_MODELS.find((option) => option.id === item.id)!;
                      setDurations((current) => ({ ...current, [sceneMode]: Math.max(4, Math.min(current[sceneMode], nextModel.maxSeconds)) }));
                    } else setModel(item.id);
                    setModelMenuOpen(false);
                  }} className={`mb-1 flex w-full items-center gap-3 rounded-md p-2.5 text-left hover:bg-slate-50 ${selectedModel.id === item.id ? "bg-violet-50" : ""}`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-xs font-black text-white">{item.name.slice(-3)}</span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-xs font-bold text-slate-700">{item.name}{item.badge && <b className="rounded bg-violet-600 px-1.5 py-0.5 text-[9px] text-white">{item.badge}</b>}</span><span className="mt-1 block text-[10px] text-slate-400">{item.description}</span></span>
                    {selectedModel.id === item.id && <Check className="h-4 w-4 text-violet-600" />}
                  </button>
                ))}
              </AnchoredPopover>
            )}
          </div>
          <div className="relative">
            <button
              ref={settingsButtonRef}
              type="button"
              title="视频规格"
              aria-expanded={settingsOpen}
              onClick={() => {
                setSettingsOpen((open) => !open);
                setModeMenuOpen(false);
                setModelMenuOpen(false);
              }}
              className="flex h-9 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
            >
              <span>{ratio}</span>
              <span>{mode === "dubbing" ? `${speechDuration}s` : mode === "background" ? "≤8s" : `${currentDuration}s`}</span>
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            {settingsOpen && (
              <AnchoredPopover
                anchorRef={settingsButtonRef}
                align="end"
                width={340}
                onClose={() => setSettingsOpen(false)}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
              >
                <p className="text-xs font-bold text-slate-700">视频比例</p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {RATIOS.map((item) => <button key={item} type="button" onClick={() => setRatio(item)} className={`flex h-14 flex-col items-center justify-center rounded-md border text-[10px] font-semibold ${ratio === item ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500"}`}><span className={`mb-1 block border ${item === "9:16" ? "h-5 w-3" : item === "16:9" ? "h-3 w-5" : item === "4:3" ? "h-4 w-5" : item === "3:4" ? "h-5 w-4" : "h-4 w-4"}`} />{item}</button>)}
                </div>
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-700">视频时长</p><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{mode === "dubbing" ? `${speechDuration} 秒` : mode === "background" ? "自动截取 8 秒" : `${rangeConfig.value} 秒`}</span></div>
                  {mode === "dubbing" ? <p className="rounded-md bg-slate-50 px-3 py-2 text-[10px] leading-5 text-slate-500">根据说话内容自动计算视频时长与积分。</p> : mode === "background" ? <p className="rounded-md bg-slate-50 px-3 py-2 text-[10px] leading-5 text-slate-500">原视频超过 8 秒时自动截取前 8 秒。</p> : <><input type="range" min={rangeConfig.min} max={rangeConfig.max} step={1} value={rangeConfig.value} onChange={(event) => rangeConfig.set(Number(event.target.value))} className="w-full accent-violet-600" /><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{rangeConfig.min} 秒</span><span>{rangeConfig.max} 秒</span></div></>}
                </div>
              </AnchoredPopover>
            )}
          </div>
        </div>
        {(mode === "background" || mode === "outfit") && <div className="flex shrink-0 gap-5 border-b border-slate-100 px-4 pt-3"><button onClick={() => showMode("background")} className={`relative pb-2.5 text-xs font-bold ${mode === "background" ? "text-violet-700" : "text-slate-500"}`}>换背景{mode === "background" && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded bg-violet-600" />}</button><button onClick={() => showMode("outfit")} className={`relative pb-2.5 text-xs font-bold ${mode === "outfit" ? "text-violet-700" : "text-slate-500"}`}>换装{mode === "outfit" && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded bg-violet-600" />}</button></div>}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{renderControlBody()}</div>
        {(mode !== "outfit" || outfitPreview) && <div className="shrink-0 border-t border-slate-200 bg-white p-4"><button disabled={!canGenerate || (mode === "outfit" && outfitPreviewProgress < 100)} onClick={submitGeneration} className="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="h-4 w-4" />立即生成 <span className="text-violet-200">· {currentCost} 积分</span></button></div>}
      </aside>
      <main className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm max-lg:mt-3 max-lg:min-h-[700px]"><div className="flex shrink-0 items-center border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white"><Sparkles className="h-5 w-5 text-violet-300" /></span><div><h2 className="text-sm font-bold text-slate-900">{mode === "background" || mode === "outfit" ? "AI视频编辑工作台" : `${MODE_LABELS[mode]}工作台`}</h2><p className="mt-1 text-[11px] text-slate-400">当前类别共 {modeRecords.length} 条生成记录</p></div></div></div><div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">{modeRecords.length === 0 ? <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Video className="h-6 w-6" /></span><p className="mt-4 text-sm font-bold text-slate-700">还没有生成记录</p><p className="mt-1 text-xs text-slate-400">配置左侧内容后即可创建第一条视频原料</p></div> : <div className="divide-y divide-slate-100">{modeRecords.map((task) => <GenerationRecordCard key={task.id} task={task} selected={activeTaskId === task.id} onSelect={() => onActiveTaskChange(task.id)} onCancel={() => cancelRecord(task)} onPreview={(output) => setPreviewSelection({ task, output })} onDownload={downloadOutput} onUpload={(outputs) => setUploadSelection({ task, outputs })} onReEdit={() => reEditTask(task)} />)}</div>}</div></main>
    </div>
    {modelMediaTypePickerOpen && <MediaTypeChoiceModal onClose={() => setModelMediaTypePickerOpen(false)} onSelect={(allowed) => { setModelMediaTypePickerOpen(false); openPicker("modelMedia", allowed, 1); }} />}
    {picker && <MediaPickerModal allowed={picker.allowed} maxSelections={picker.max} initialSelected={pickerSelection()} items={libraryItems} onClose={() => setPicker(null)} onConfirm={applyPickerSelection} />}
    {scenePicker && <AiVideoSceneMediaPicker assets={assets} allowed={scenePicker.allowed} selected={sceneInputs[scenePicker.mode][scenePicker.target] || null} onClose={() => setScenePicker(null)} onConfirm={(item) => {
      setSceneInputs((current) => ({ ...current, [scenePicker.mode]: { ...current[scenePicker.mode], [scenePicker.target]: item } }));
      setScenePicker(null);
    }} />}
    {voicePickerOpen && <VoicePickerModal selected={voice} resourceVoices={resourceVoices} onClose={() => setVoicePickerOpen(false)} onConfirm={(item) => { setVoice(item); setVoicePickerOpen(false); }} />}
    {previewSelection && <VideoPreviewModal task={previewSelection.task} output={previewSelection.output} onClose={() => setPreviewSelection(null)} />}
    {confirmOutfitReturn && <ConfirmDialog title="确认返回？" description="返回后当前搭配预览将无法找回，预览积分无法退还；已提交的视频任务仍会在后台继续。" onCancel={() => setConfirmOutfitReturn(false)} onConfirm={() => { setConfirmOutfitReturn(false); setOutfitPreview(false); setOutfitCandidates([]); setSelectedLook(null); }} />}
    {toast && <OverlayPortal layer="toast" className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</OverlayPortal>}
  </section>;
}

function GenerationRecordCard({ task, selected, onSelect, onCancel, onPreview, onDownload, onUpload, onReEdit }: { task: Task; selected: boolean; onSelect: () => void; onCancel: () => void; onPreview: (output: DisplayAiVideoOutput) => void; onDownload: (output: DisplayAiVideoOutput) => void; onUpload: (outputs: DisplayAiVideoOutput[]) => void; onReEdit: () => void }) {
  const outputs = getAiVideoTaskOutputs(task).map((output) => ({
    ...output,
    url: output.videoUrl,
    metadata: formatAiVideoDuration(output.duration),
    secondaryMetadata: output.size,
  }));
  return <GenerationResultCard<(typeof outputs)[number]>
    id={`ai-video-record-${task.id}`}
    task={task}
    mediaType="video"
    outputs={outputs}
    selected={selected}
    onSelect={onSelect}
    onCancel={onCancel}
    onPreview={onPreview}
    onDownload={onDownload}
    onUpload={onUpload}
    onReEdit={onReEdit}
  />;
}

interface MediaPickerModalProps {
  allowed: "image" | "video" | "both";
  maxSelections: number;
  initialSelected: AiVideoMediaItem[];
  items: AiVideoMediaItem[];
  onClose: () => void;
  onConfirm: (items: AiVideoMediaItem[]) => void;
}

interface MediaPickerRowMeta {
  primaryCategory: string;
  secondaryCategory: string;
  tag: string;
  status: string;
  author: string;
  section: "成片" | "素材";
  resolution: string;
  size: string;
}

const mediaPickerSeed = (value: string) => Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);

function getMediaPickerRowMeta(item: AiVideoMediaItem): MediaPickerRowMeta {
  const seed = mediaPickerSeed(item.id);
  const authors = ["徐振", "致上互娱", "汤小真", "美妆设计组"];
  const imageStatuses = ["审核通过", "待审核", "未审核"];
  const videoStatuses = ["已通过", "待审核", "未审核"];
  const imageResolutions = ["1080x1440", "800x1200", "1920x1080", "1080x1920"];
  const lowerName = item.name.toLowerCase();
  const isBeauty = /护肤|精华|美妆|防晒|礼盒/.test(lowerName);
  const isFashion = /服|裙|裤|模特|通勤|针织/.test(lowerName);
  const isHome = /家居|厨房|客厅|日用/.test(lowerName);
  const primaryCategory = isBeauty ? "美妆护肤" : isFashion ? "服饰内衣" : isHome ? "日用百货" : "通用素材";
  const secondaryCategory = isBeauty
    ? (seed % 2 ? "商品主图" : "成分展示")
    : isFashion
      ? (seed % 2 ? "模特展示" : "服饰实拍")
      : isHome
        ? "场景展示"
        : "营销素材";
  const tag = isBeauty ? (seed % 2 ? "产品实拍" : "高端质感") : isFashion ? "模特展示" : "商品展示";
  const section: "成片" | "素材" = seed % 4 === 0 ? "成片" : "素材";

  return {
    primaryCategory,
    secondaryCategory,
    tag,
    status: item.type === "image" ? imageStatuses[seed % imageStatuses.length] : videoStatuses[seed % videoStatuses.length],
    author: authors[seed % authors.length],
    section,
    resolution: imageResolutions[seed % imageResolutions.length],
    size: item.type === "image" ? `${(1.2 + (seed % 35) / 10).toFixed(1)} MB` : `${(12.4 + (seed % 53)).toFixed(1)} MB`
  };
}

function MediaPickerModal(props: MediaPickerModalProps) {
  if (props.allowed === "both") return <MixedMediaPickerModal {...props} />;
  return <StandardMediaPickerModal {...props} allowed={props.allowed} />;
}

function StandardMediaPickerModal({ allowed, maxSelections, initialSelected, items, onClose, onConfirm }: MediaPickerModalProps & { allowed: "image" | "video" }) {
  const [tab, setTab] = useState<"library" | "local">("library");
  const [section, setSection] = useState<"成片" | "素材">("成片");
  const [primaryCategory, setPrimaryCategory] = useState("全部一级分类");
  const [secondaryCategory, setSecondaryCategory] = useState("全部二级分类");
  const [tag, setTag] = useState("全部标签");
  const [status, setStatus] = useState("全部状态");
  const [author, setAuthor] = useState("全部上传人");
  const [onlyMine, setOnlyMine] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<AiVideoMediaItem[]>(() => initialSelected.filter((item) => item.type === allowed));
  const [localItems, setLocalItems] = useState<AiVideoMediaItem[]>(() => initialSelected.filter((item) => item.type === allowed && item.source === "local"));
  const [notice, setNotice] = useState("");
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const rows = items
    .filter((item) => item.type === allowed)
    .map((item) => ({ item, meta: getMediaPickerRowMeta(item) }));
  const primaryCategories = Array.from(new Set(rows.map(({ meta }) => meta.primaryCategory)));
  const secondaryCategories = Array.from(new Set(rows.map(({ meta }) => meta.secondaryCategory)));
  const tags = Array.from(new Set(rows.map(({ meta }) => meta.tag)));
  const statuses = Array.from(new Set(rows.map(({ meta }) => meta.status)));
  const authors = Array.from(new Set(rows.map(({ meta }) => meta.author)));
  const filteredRows = rows.filter(({ item, meta }) =>
    (allowed === "image" || meta.section === section) &&
    (primaryCategory === "全部一级分类" || meta.primaryCategory === primaryCategory) &&
    (secondaryCategory === "全部二级分类" || meta.secondaryCategory === secondaryCategory) &&
    (tag === "全部标签" || meta.tag === tag) &&
    (status === "全部状态" || meta.status === status) &&
    (author === "全部上传人" || meta.author === author) &&
    (!onlyMine || meta.author === "徐振") &&
    `${item.name}${item.id}${meta.primaryCategory}${meta.secondaryCategory}${meta.tag}`.toLowerCase().includes(search.toLowerCase())
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const label = allowed === "image" ? "图片" : "视频";

  const toggle = (item: AiVideoMediaItem) => {
    setNotice("");
    if (selected.some((media) => media.id === item.id)) {
      setSelected((current) => current.filter((media) => media.id !== item.id));
      return;
    }
    if (maxSelections === 1) {
      setSelected([item]);
      return;
    }
    if (selected.length >= maxSelections) {
      setNotice(`最多选择 ${maxSelections} 个${label}`);
      return;
    }
    setSelected((current) => [...current, item]);
  };

  const upload = (files?: FileList | null) => {
    if (!files?.length) return;
    const remaining = maxSelections === 1 ? 1 : Math.max(0, maxSelections - selected.length);
    if (remaining === 0) {
      setNotice(`最多选择 ${maxSelections} 个${label}`);
      return;
    }
    const accepted: AiVideoMediaItem[] = [];
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mpeg|mov)$/i.test(file.name);
      const fileType: AiVideoMediaItem["type"] = isVideo ? "video" : "image";
      const formatValid = allowed === "image"
        ? /\.(jpe?g|png|webp|bmp|tiff?|gif)$/i.test(file.name)
        : /\.(mp4|mpeg|mov)$/i.test(file.name);
      const sizeValid = allowed === "image" ? file.size < 30 * 1024 * 1024 : file.size < 1000 * 1024 * 1024;
      if (fileType !== allowed || !formatValid || !sizeValid || accepted.length >= remaining) continue;
      accepted.push({
        id: `local-${Date.now()}-${accepted.length}`,
        name: file.name,
        type: allowed,
        url: URL.createObjectURL(file),
        coverUrl: allowed === "video" ? STOCK_IMAGES[(accepted.length + 3) % STOCK_IMAGES.length].url : undefined,
        durationSeconds: allowed === "video" ? 12 : undefined,
        source: "local"
      });
    }
    if (maxSelections === 1) setSelected(accepted.slice(0, 1));
    else setSelected((current) => [...current, ...accepted].slice(0, maxSelections));
    setLocalItems((current) => [...current, ...accepted]);
    if (accepted.length < files.length) setNotice(`仅保留符合格式、大小及数量限制的${label}`);
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const removeLocalItem = (item: AiVideoMediaItem) => {
    setLocalItems((current) => current.filter((media) => media.id !== item.id));
    setSelected((current) => current.filter((media) => media.id !== item.id));
  };

  const formatDuration = (seconds = 8) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  return <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm">
    <div className="flex h-[min(760px,88vh)] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-5 flex shrink-0 items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-1">
            <button onClick={() => { setTab("library"); setPage(1); }} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${tab === "library" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500"}`}>{allowed === "image" ? "图片管理" : "资源库"}</button>
            <button onClick={() => { setTab("local"); setPage(1); }} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${tab === "local" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500"}`}>本地上传</button>
          </div>
          <button onClick={onClose} title="关闭" className="mb-1 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        {tab === "library" ? <>
          {allowed === "video" && <div className="mb-4 flex shrink-0 items-center gap-1 border-b border-slate-200">{(["成片", "素材"] as const).map((item) => <button key={item} onClick={() => { setSection(item); setPage(1); }} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${section === item ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500"}`}>{{ 成片: "成片管理", 素材: "素材管理" }[item]}</button>)}</div>}
          <div className="mb-4 flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1">
            <select value={primaryCategory} onChange={(event) => { setPrimaryCategory(event.target.value); setPage(1); }} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部一级分类</option>{primaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={secondaryCategory} onChange={(event) => { setSecondaryCategory(event.target.value); setPage(1); }} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部二级分类</option>{secondaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={tag} onChange={(event) => { setTag(event.target.value); setPage(1); }} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option value="全部标签">全部二级标签</option>{tags.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 w-[130px] shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部状态</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={author} onChange={(event) => { setAuthor(event.target.value); setPage(1); }} className="h-9 w-[130px] shrink-0 whitespace-nowrap rounded-md border border-slate-200 px-2 text-xs text-slate-600"><option>全部上传人</option>{authors.map((item) => <option key={item}>{item}</option>)}</select>
            <div className="relative min-w-[180px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`搜索${allowed === "image" ? "图片" : "文件"}名称或 ID`} className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-violet-400" /></div>
            <label className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap px-2 text-xs text-slate-600"><input type="checkbox" checked={onlyMine} onChange={(event) => { setOnlyMine(event.target.checked); setPage(1); }} className="accent-violet-600" />仅看我的</label>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr><th className="w-12 px-4 py-3"></th><th className="px-3 py-3">{allowed === "image" ? "图片缩略图" : "文件缩略图"}</th><th className="px-3 py-3">文件名称 / ID</th><th className="px-3 py-3">状态</th><th className="px-3 py-3">{allowed === "image" ? "分类 / 标签" : "所在分类"}</th><th className="px-3 py-3">上传人</th><th className="px-3 py-3">{allowed === "image" ? "分辨率" : "时长"}</th><th className="px-3 py-3">大小</th></tr></thead>
              <tbody>{pagedRows.map(({ item, meta }) => { const checked = selected.some((media) => media.id === item.id); return <tr key={item.id} onClick={() => toggle(item)} className={`cursor-pointer border-t border-slate-100 ${checked ? "bg-violet-50" : "hover:bg-slate-50"}`}>
                <td className="px-4 py-3"><span className={`flex h-4 w-4 items-center justify-center border ${maxSelections === 1 ? "rounded-full" : "rounded"} ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"}`}>{checked && <Check className="h-2.5 w-2.5" />}</span></td>
                <td className="px-3 py-2">{allowed === "image" ? <img src={item.url} alt="" className="h-12 w-12 rounded object-cover" referrerPolicy="no-referrer" /> : <img src={item.coverUrl || item.url} alt="" className="h-10 w-16 rounded object-cover" referrerPolicy="no-referrer" />}</td>
                <td className="max-w-[220px] px-3 py-3"><p className="truncate font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.id}</p></td>
                <td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{meta.status}</span></td>
                <td className="px-3 py-3"><p className="font-semibold text-slate-700">{allowed === "image" ? `${meta.primaryCategory} / ${meta.secondaryCategory}` : meta.section}</p><p className="mt-1 text-[10px] text-slate-400">{allowed === "image" ? meta.tag : `${meta.primaryCategory} / ${meta.secondaryCategory}`}</p></td>
                <td className="px-3 py-3 text-slate-500">{meta.author}</td>
                <td className="px-3 py-3 text-slate-500">{allowed === "image" ? meta.resolution : formatDuration(item.durationSeconds)}</td>
                <td className="px-3 py-3 text-slate-500">{meta.size}</td>
              </tr>; })}</tbody>
            </table>
            {!pagedRows.length && <div className="flex h-full min-h-48 flex-col items-center justify-center text-slate-400"><FolderOpen className="h-8 w-8" /><p className="mt-3 text-xs">没有找到匹配素材</p></div>}
          </div>
          <AssetPagination total={filteredRows.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
        </> : <div className="min-h-0 flex-1 overflow-y-auto">
          <button onClick={() => uploadRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700"><Upload className="h-6 w-6" /><span className="mt-3 text-xs font-semibold">点击选择本地{label}</span></button>
          <input ref={uploadRef} type="file" multiple={maxSelections > 1} accept={allowed === "image" ? ".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,.gif,image/*" : ".mp4,.mpeg,.mov,video/mp4,video/mpeg,video/quicktime"} className="hidden" onChange={(event) => upload(event.target.files)} />
          <p className="mt-3 text-center text-xs leading-6 text-slate-400">{allowed === "image" ? <>支持 jpeg、png、webp、bmp、tiff、gif，单张图片大小&lt;30MB。<br />请确保您上传素材为您原创或已取得合法授权。</> : <>视频格式：mp4、mpeg、mov，宽高无限制，大小&lt;1000MB。<br />建议 1280x720&lt;尺寸&lt;3840x2160，2s&lt;时长&lt;600s。<br />请确保您上传素材为您原创或已取得合法授权。</>}</p>
          {localItems.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{localItems.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 p-2">{item.type === "image" ? <img src={item.url} alt="" className="h-11 w-11 rounded object-cover" /> : <video src={item.url} poster={item.coverUrl} muted className="h-11 w-16 rounded object-cover" />}<div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">本地文件</p></div><button onClick={() => removeLocalItem(item)} title="删除" className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}
        </div>}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4"><p className="mr-auto text-xs text-slate-500">已选择 <b className="text-violet-700">{selected.length}</b> 个{label}{maxSelections > 1 && <> · 还可添加 {Math.max(0, maxSelections - selected.length)} 个</>}</p>{notice && <p className="text-[11px] text-amber-600">{notice}</p>}<button onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">取消</button><button disabled={!selected.length} onClick={() => onConfirm(selected)} className="rounded-md bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40">确认选择</button></div>
    </div>
  </OverlayPortal>;
}

function MixedMediaPickerModal({ allowed, maxSelections, initialSelected, items, onClose, onConfirm }: MediaPickerModalProps) {
  const [tab, setTab] = useState<"library" | "local">("library");
  const [selected, setSelected] = useState<AiVideoMediaItem[]>(initialSelected);
  const [localItems, setLocalItems] = useState<AiVideoMediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [notice, setNotice] = useState("");
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const filtered = items.filter((item) => (allowed === "both" || item.type === allowed) && item.name.toLowerCase().includes(search.toLowerCase()));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const toggle = (item: AiVideoMediaItem) => {
    if (selected.some((media) => media.id === item.id)) return setSelected((current) => current.filter((media) => media.id !== item.id));
    if (maxSelections === 1) return setSelected([item]);
    if (selected.length >= maxSelections) return setNotice(`最多选择 ${maxSelections} 个素材`);
    setSelected((current) => [...current, item]);
  };
  const upload = (files?: FileList | null) => {
    if (!files?.length) return;
    const accepted: AiVideoMediaItem[] = [];
    for (const file of Array.from(files)) {
      const type: AiVideoMediaItem["type"] = file.type.startsWith("video/") ? "video" : "image";
      if (allowed !== "both" && type !== allowed) continue;
      accepted.push({ id: `local-${Date.now()}-${accepted.length}`, name: file.name, type, url: URL.createObjectURL(file), coverUrl: type === "video" ? STOCK_IMAGES[(accepted.length + 3) % STOCK_IMAGES.length].url : undefined, durationSeconds: type === "video" ? 12 : undefined, source: "local" });
    }
    const next = maxSelections === 1 ? accepted.slice(0, 1) : [...selected, ...accepted].slice(0, maxSelections);
    setLocalItems((current) => [...current, ...accepted]);
    setSelected(next);
    if (accepted.length < files.length) setNotice(`仅保留符合类型与数量限制的素材，最多 ${maxSelections} 个`);
    if (uploadRef.current) uploadRef.current.value = "";
  };
  const accept = allowed === "image" ? "image/*" : allowed === "video" ? "video/*" : "image/*,video/*";
  const label = allowed === "image" ? "图片" : allowed === "video" ? "视频" : "图片或视频";
  return <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm"><div className="flex h-[min(720px,88vh)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"><div className="flex shrink-0 items-end justify-between border-b border-slate-200 px-5 pt-3"><div className="flex gap-1"><button onClick={() => { setTab("library"); setPage(1); }} className={`border-b-2 px-4 py-3 text-xs font-bold ${tab === "library" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500"}`}>资源库</button><button onClick={() => setTab("local")} className={`border-b-2 px-4 py-3 text-xs font-bold ${tab === "local" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500"}`}>本地上传</button></div><button onClick={onClose} title="关闭" className="mb-2 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
    {tab === "library" ? <><div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-3"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`搜索${label}名称或 ID`} className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-violet-400" /></div><span className="shrink-0 text-[11px] text-slate-400">最多选择 {maxSelections} 项</span></div><div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-5">{paged.length ? <div className="grid grid-cols-4 gap-3">{paged.map((item) => { const checked = selected.some((media) => media.id === item.id); return <button key={item.id} onClick={() => toggle(item)} className={`overflow-hidden rounded-md border bg-white text-left transition-all ${checked ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300"}`}><div className="relative aspect-video bg-slate-100">{item.type === "video" ? <video src={item.url} poster={item.coverUrl} muted className="h-full w-full object-cover" /> : <img src={item.url} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />}{item.type === "video" && <span className="absolute right-2 top-2 rounded bg-black/65 px-1.5 py-0.5 text-[9px] text-white">视频</span>}{checked && <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white"><Check className="h-3 w-3" /></span>}</div><div className="p-2.5"><p className="truncate text-xs font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.type === "video" ? `${item.durationSeconds || 8} 秒` : "图片素材"} · 资源库</p></div></button>; })}</div> : <div className="flex h-full flex-col items-center justify-center text-slate-400"><FolderOpen className="h-8 w-8" /><p className="mt-3 text-xs">没有找到匹配素材</p></div>}</div><div className="shrink-0 border-t border-slate-100 px-5"><AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} /></div></> : <div className="min-h-0 flex-1 overflow-y-auto p-5"><button onClick={() => uploadRef.current?.click()} className="flex h-52 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:bg-violet-50/30 hover:text-violet-700"><Upload className="h-7 w-7" /><span className="mt-3 text-sm font-bold">点击选择本地{label}</span><span className="mt-2 text-[11px] text-slate-400">单次最多选择 {maxSelections} 项，请确保素材已取得合法授权</span></button><input ref={uploadRef} type="file" multiple={maxSelections > 1} accept={accept} className="hidden" onChange={(event) => upload(event.target.files)} />{localItems.length > 0 && <div className="mt-5 grid grid-cols-4 gap-3">{localItems.map((item) => { const checked = selected.some((media) => media.id === item.id); return <button key={item.id} onClick={() => toggle(item)} className={`overflow-hidden rounded-md border text-left ${checked ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200"}`}><div className="relative aspect-video bg-slate-100">{item.type === "image" ? <img src={item.url} alt="" className="h-full w-full object-cover" /> : <video src={item.url} poster={item.coverUrl} muted className="h-full w-full object-cover" />}{checked && <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white"><Check className="h-3 w-3" /></span>}</div><p className="truncate p-2 text-xs font-semibold text-slate-600">{item.name}</p></button>; })}</div>}</div>}
    <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-5 py-4"><p className="mr-auto text-xs text-slate-500">已选择 <b className="text-violet-700">{selected.length}</b> / {maxSelections}</p>{notice && <p className="text-[11px] text-amber-600">{notice}</p>}<button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">取消</button><button disabled={!selected.length} onClick={() => onConfirm(selected)} className="rounded-md bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40">确认选择</button></div></div></OverlayPortal>;
}

function VoicePickerModal({ selected, resourceVoices, onClose, onConfirm }: { selected: VoiceOption | null; resourceVoices: VoiceOption[]; onClose: () => void; onConfirm: (voice: VoiceOption) => void }) {
  const [tab, setTab] = useState<"system" | "asset">(selected?.source === "asset" ? "asset" : "system");
  const [draft, setDraft] = useState<VoiceOption | null>(selected);
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const systemVoices = VOICES.filter((voice) => `${voice.name}${voice.scene}${voice.tone}`.toLocaleLowerCase().includes(normalizedSearch));
  const assetVoices = resourceVoices.filter((voice) => `${voice.name}${voice.creator || ""}`.toLocaleLowerCase().includes(normalizedSearch));

  const stopPlayback = () => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  }, [tab]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, []);

  const playVoice = (voice: VoiceOption) => {
    if (playingId === voice.id) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setPlayingId(voice.id);

    if (voice.source === "asset" && voice.audioUrl) {
      const audio = new Audio(voice.audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      void audio.play().catch(() => setPlayingId(null));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`你好，我是${voice.name}，欢迎体验这款精选商品。`);
    utterance.lang = "zh-CN";
    utterance.rate = voice.id.includes("male") ? 0.9 : 1;
    utterance.onend = () => setPlayingId(null);
    window.speechSynthesis?.speak(utterance);
  };

  return (
    <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm">
      <div className="flex h-[min(650px,86vh)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-800">选择音色</h3>
          <button onClick={onClose} title="关闭" className="rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex rounded-md bg-slate-100 p-1">
            <button onClick={() => setTab("system")} className={`rounded px-4 py-1.5 text-xs font-semibold ${tab === "system" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>系统推荐</button>
            <button onClick={() => setTab("asset")} className={`rounded px-4 py-1.5 text-xs font-semibold ${tab === "asset" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>我的音色</button>
          </div>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "system" ? "搜索音色" : "搜索音频名称或上传人"} className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-violet-400" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-5">
          {tab === "system" ? (
            systemVoices.length ? <div className="grid grid-cols-3 gap-3">{systemVoices.map((voice) => (
              <button key={voice.id} onClick={() => setDraft(voice)} className={`group relative rounded-md border bg-white p-4 text-left ${draft?.id === voice.id ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={voice.avatar} alt="" className="h-11 w-11 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <span onClick={(event) => { event.stopPropagation(); playVoice(voice); }} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">{playingId === voice.id ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</span>
                  </div>
                  <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-700">{voice.name}</p><p className="mt-1 text-[10px] text-slate-400">{voice.scene}</p></div>
                  {draft?.id === voice.id && <Check className="ml-auto h-4 w-4 text-violet-600" />}
                </div>
                <p className="mt-3 text-[10px] text-slate-500">音色特点：{voice.tone}</p>
              </button>
            ))}</div> : <VoiceEmptyState message="没有找到匹配音色" />
          ) : assetVoices.length ? (
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-400"><tr>{["音频名称", "时长", "文件大小", "上传人", "上传时间", "试听"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">{assetVoices.map((voice) => {
                    const checked = draft?.id === voice.id;
                    return (
                      <tr key={voice.id} role="button" tabIndex={0} onClick={() => setDraft(voice)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDraft(voice); } }} className={`cursor-pointer outline-none transition-colors ${checked ? "bg-violet-50" : "hover:bg-slate-50 focus:bg-slate-50"}`}>
                        <td className="px-4 py-3.5"><span className="flex min-w-0 items-center gap-3"><span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${checked ? "border-violet-600" : "border-slate-300"}`}>{checked && <span className="h-2 w-2 rounded-full bg-violet-600" />}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600"><Volume2 className="h-4 w-4" /></span><b className="max-w-[250px] truncate text-slate-700">{voice.name}</b></span></td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{voice.duration}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{voice.size}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{voice.creator}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{voice.createdAt}</td>
                        <td className="px-4 py-3.5"><button type="button" onClick={(event) => { event.stopPropagation(); playVoice(voice); }} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">{playingId === voice.id ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}{playingId === voice.id ? "暂停" : "试听"}</button></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
          ) : <VoiceEmptyState message="资源库中暂无音频文件" />}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 px-5 py-4">
          <p className="text-[11px] text-slate-400">{tab === "asset" ? "从资源库音频中单选一个，确认后直接用于本次配音" : "选择一个系统推荐音色"}</p>
          <div className="flex gap-2"><button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button disabled={!draft} onClick={() => draft && onConfirm(draft)} className="rounded-md bg-violet-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-40">确认</button></div>
        </div>
      </div>
    </OverlayPortal>
  );
}

function VoiceEmptyState({ message }: { message: string }) {
  return <div className="flex h-full min-h-64 flex-col items-center justify-center text-slate-400"><Volume2 className="h-8 w-8" /><p className="mt-3 text-xs">{message}</p></div>;
}

function VideoPreviewModal({ task, output, onClose }: { task: Task; output: DisplayAiVideoOutput; onClose: () => void }) {
  return <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-sm"><div className="w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-800">{output.name}</h3><p className="mt-1 text-[10px] text-slate-400">{task.name} · {formatAiVideoDuration(output.duration)} · {output.size}</p></div><button onClick={onClose} title="关闭" className="rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><div className="flex h-[min(620px,76vh)] items-center justify-center bg-slate-950 p-5"><video src={output.videoUrl} poster={output.coverUrl} controls autoPlay className="h-full max-w-full object-contain" /></div></div></OverlayPortal>;
}

function ConfirmDialog({ title, description, onCancel, onConfirm }: { title: string; description: string; onCancel: () => void; onConfirm: () => void }) {
  return <OverlayPortal layer="dialog" className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600"><AlertCircle className="h-5 w-5" /></div><h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{description}</p><div className="mt-6 flex justify-end gap-2"><button onClick={onCancel} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">取消</button><button onClick={onConfirm} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">确认</button></div></div></OverlayPortal>;
}
