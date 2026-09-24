import React, { useEffect, useMemo, useRef, useState } from "react";
import { recordDownload } from "../lib/operationHistory";
import {
  ArrowLeft,
  Check,
  Clock3,
  Download,
  Eraser,
  FileVideo2,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ScanSearch,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Asset, Task, WatermarkRegion, WatermarkTaskOutput, WatermarkTaskSnapshot, WatermarkVideo } from "../types";
import OverlayPortal from "./overlays/OverlayPortal";
import UploadFinishedVideoModal from "./UploadFinishedVideoModal";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";

interface VideoWatermarkWorkspaceProps {
  type: "watermark" | "subtitle";
  assets: Asset[];
  task: Task | null;
  onBack: () => void;
  onCreateTask: (snapshot: WatermarkTaskSnapshot) => string | null;
  onActiveTaskChange: (taskId: string | null) => void;
  onCancelTask: (taskId: string) => void;
  onUploadResult: (output: WatermarkTaskOutput) => void;
}

type RecognitionState = "idle" | "recognizing" | "ready";
type ResizeHandle = "nw" | "ne" | "sw" | "se";

interface PointerInteraction {
  pointerId: number;
  type: "draw" | "move" | "resize";
  startX: number;
  startY: number;
  regionId?: string;
  handle?: ResizeHandle;
  initial?: WatermarkRegion;
}

const MAX_REGIONS = 4;
const WATERMARK_COST = 40;
const MIN_REGION_SIZE = 4;
const FALLBACK_DURATION = 15;
const FALLBACK_COVER = "./assets/prototype/beauty-promo-detail.jpg";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseDuration = (value: string) => {
  const parts = value.split(":").map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1];
  const seconds = Number.parseFloat(value);
  return Number.isFinite(seconds) ? seconds : FALLBACK_DURATION;
};

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const statusMeta: Record<Task["status"], { label: string; className: string }> = {
  ready: { label: "待配置", className: "bg-amber-50 text-amber-700" },
  queue: { label: "排队中", className: "bg-slate-100 text-slate-700" },
  generating: { label: "处理中", className: "bg-blue-50 text-blue-700" },
  completed: { label: "处理成功", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "处理失败", className: "bg-rose-50 text-rose-700" },
  cancelled: { label: "已取消", className: "bg-amber-50 text-amber-700" },
};

export default function VideoWatermarkWorkspace({
  type,
  assets,
  task,
  onBack,
  onCreateTask,
  onActiveTaskChange,
  onCancelTask,
  onUploadResult,
}: VideoWatermarkWorkspaceProps) {
  const [isEditing, setIsEditing] = useState(!task);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftVideo, setDraftVideo] = useState<WatermarkVideo | null>(null);
  const [draftRegions, setDraftRegions] = useState<WatermarkRegion[]>([]);
  const [recognitionState, setRecognitionState] = useState<RecognitionState>("idle");
  const [drawMode, setDrawMode] = useState(false);
  const [drawingRegion, setDrawingRegion] = useState<WatermarkRegion | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(FALLBACK_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [outputName, setOutputName] = useState("");
  const [toast, setToast] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<PointerInteraction | null>(null);
  const recognitionTimerRef = useRef<number | null>(null);

  const videoItems = useMemo<VideoResourcePickerItem[]>(() => assets
    .filter((asset) => asset.type === "video")
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      cover: asset.coverUrl || FALLBACK_COVER,
      status: asset.status || "可用",
      section: asset.resourceCategory === "成片" ? "成片" : "素材",
      primaryCategory: asset.category || "未分类",
      secondaryCategory: asset.publicTags?.[0] || "通用",
      tags: asset.publicTags || [],
      author: asset.creator || "徐振",
      duration: asset.fileInfo?.duration || "00:15",
      size: asset.size,
      url: asset.url,
    })), [assets]);

  const copy = type === "watermark" ? {
    title: "视频去水印",
    description: "识别并去除视频画面中的固定水印",
    regionTitle: "水印选区",
    regionLabel: "水印区",
    recognizing: "正在识别水印区域",
    canvasRecognizing: "AI 正在识别水印位置",
    processing: "正在去除水印",
    start: "开始去水印",
    newTask: "新建去水印任务",
    suffix: "去水印",
  } : {
    title: "字幕擦除",
    description: "识别并擦除视频画面中的字幕内容",
    regionTitle: "字幕选区",
    regionLabel: "字幕区",
    recognizing: "正在识别字幕区域",
    canvasRecognizing: "AI 正在识别字幕位置",
    processing: "正在擦除字幕",
    start: "开始擦除字幕",
    newTask: "新建字幕擦除任务",
    suffix: "字幕擦除",
  };
  const taskSnapshot = type === "watermark" ? task?.watermarkSnapshot : task?.subtitleSnapshot;
  const taskOutput = type === "watermark" ? task?.watermarkOutput : task?.subtitleOutput;
  const taskVideo = taskSnapshot?.sourceVideo || null;
  const sourceVideo = isEditing ? draftVideo : taskVideo;
  const regions = isEditing ? draftRegions : taskSnapshot?.regions || [];
  const output = taskOutput;
  const displayUrl = !isEditing && task?.status === "completed" && output ? output.videoUrl : sourceVideo?.url;
  const displayCover = !isEditing && task?.status === "completed" && output ? output.coverUrl : sourceVideo?.coverUrl;
  const controlsLocked = !isEditing || recognitionState === "recognizing";
  const taskInProgress = !isEditing && (task?.status === "queue" || task?.status === "generating");
  const taskStatus = task ? statusMeta[task.status] : null;

  useEffect(() => {
    if (!task) return;
    setIsEditing(false);
    setOutputName(taskOutput?.name || `${(taskSnapshot?.sourceVideo.name || task.name).replace(/\.[^.]+$/, "")}_${copy.suffix}.mp4`);
  }, [copy.suffix, task?.id, taskOutput?.name, taskSnapshot?.sourceVideo.name]);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setDuration(sourceVideo?.duration || output?.duration || FALLBACK_DURATION);
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [displayUrl, output?.duration, sourceVideo?.duration]);

  useEffect(() => {
    if (!taskInProgress) return;
    videoRef.current?.pause();
    setIsPlaying(false);
  }, [taskInProgress]);

  useEffect(() => () => {
    if (recognitionTimerRef.current !== null) window.clearTimeout(recognitionTimerRef.current);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateDraftRegions = (updater: (current: WatermarkRegion[]) => WatermarkRegion[]) => {
    setDraftRegions((current) => updater(current));
    setValidationMessage("");
  };

  const beginRecognition = (video: WatermarkVideo) => {
    if (recognitionTimerRef.current !== null) window.clearTimeout(recognitionTimerRef.current);
    setDraftVideo(video);
    setDraftRegions([]);
    setRecognitionState("recognizing");
    setDrawMode(false);
    setValidationMessage("");
    setDuration(video.duration);
    recognitionTimerRef.current = window.setTimeout(() => {
      setDraftRegions([type === "watermark"
        ? { id: `watermark-region-${Date.now()}`, x: 76, y: 6, width: 19, height: 12 }
        : { id: `subtitle-region-${Date.now()}`, x: 8, y: 78, width: 84, height: 15 }]);
      setRecognitionState("ready");
      recognitionTimerRef.current = null;
    }, 2000);
  };

  const handlePickerConfirm = (selected: VideoResourcePickerItem[]) => {
    const item = selected[0];
    if (!item) return;
    beginRecognition({
      id: item.id,
      name: item.name,
      url: item.url || item.cover,
      coverUrl: item.cover,
      size: item.size,
      duration: parseDuration(item.duration),
      resolution: "1920 x 1080",
    });
    setPickerOpen(false);
  };

  const startNewTask = () => {
    if (recognitionTimerRef.current !== null) window.clearTimeout(recognitionTimerRef.current);
    if (videoRef.current) videoRef.current.pause();
    onActiveTaskChange(null);
    setIsEditing(true);
    setDraftVideo(null);
    setDraftRegions([]);
    setRecognitionState("idle");
    setDrawMode(false);
    setDrawingRegion(null);
    setValidationMessage("");
    setOutputName("");
  };

  const getPoint = (event: React.PointerEvent) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return {
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100),
    };
  };

  const beginDraw = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawMode || controlsLocked || draftRegions.length >= MAX_REGIONS) return;
    if ((event.target as HTMLElement).closest("[data-region-control]")) return;
    const point = getPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = { pointerId: event.pointerId, type: "draw", startX: point.x, startY: point.y };
    setDrawingRegion({ id: "drawing", x: point.x, y: point.y, width: 0, height: 0 });
  };

  const beginRegionInteraction = (
    event: React.PointerEvent<HTMLElement>,
    region: WatermarkRegion,
    type: "move" | "resize",
    handle?: ResizeHandle,
  ) => {
    if (controlsLocked) return;
    const point = getPoint(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      pointerId: event.pointerId,
      type,
      startX: point.x,
      startY: point.y,
      regionId: region.id,
      handle,
      initial: { ...region },
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    const point = getPoint(event);
    if (!point) return;
    const dx = point.x - interaction.startX;
    const dy = point.y - interaction.startY;

    if (interaction.type === "draw") {
      setDrawingRegion({
        id: "drawing",
        x: Math.min(interaction.startX, point.x),
        y: Math.min(interaction.startY, point.y),
        width: Math.abs(point.x - interaction.startX),
        height: Math.abs(point.y - interaction.startY),
      });
      return;
    }

    if (!interaction.initial || !interaction.regionId) return;
    const initial = interaction.initial;
    let next = initial;
    if (interaction.type === "move") {
      next = {
        ...initial,
        x: clamp(initial.x + dx, 0, 100 - initial.width),
        y: clamp(initial.y + dy, 0, 100 - initial.height),
      };
    } else {
      let left = initial.x;
      let right = initial.x + initial.width;
      let top = initial.y;
      let bottom = initial.y + initial.height;
      if (interaction.handle?.includes("w")) left = clamp(initial.x + dx, 0, right - MIN_REGION_SIZE);
      if (interaction.handle?.includes("e")) right = clamp(initial.x + initial.width + dx, left + MIN_REGION_SIZE, 100);
      if (interaction.handle?.includes("n")) top = clamp(initial.y + dy, 0, bottom - MIN_REGION_SIZE);
      if (interaction.handle?.includes("s")) bottom = clamp(initial.y + initial.height + dy, top + MIN_REGION_SIZE, 100);
      next = { ...initial, x: left, y: top, width: right - left, height: bottom - top };
    }
    updateDraftRegions((current) => current.map((region) => region.id === interaction.regionId ? next : region));
  };

  const finishPointerInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    if (interaction.type === "draw" && drawingRegion) {
      const region = drawingRegion.width >= MIN_REGION_SIZE && drawingRegion.height >= MIN_REGION_SIZE
        ? drawingRegion
        : {
            ...drawingRegion,
            x: clamp(drawingRegion.x - 6, 0, 88),
            y: clamp(drawingRegion.y - 4, 0, 92),
            width: 12,
            height: 8,
          };
      updateDraftRegions((current) => [...current, { ...region, id: `${type}-region-${Date.now()}` }].slice(0, MAX_REGIONS));
      setDrawMode(false);
      setDrawingRegion(null);
    }
    interactionRef.current = null;
  };

  const removeRegion = (id: string) => {
    updateDraftRegions((current) => current.filter((region) => region.id !== id));
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || taskInProgress) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      video.pause();
    }
  };

  const seekTo = (value: number) => {
    if (taskInProgress) return;
    const video = videoRef.current;
    if (video) video.currentTime = value;
    setCurrentTime(value);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextDuration = Number.isFinite(video.duration) ? video.duration : sourceVideo?.duration || FALLBACK_DURATION;
    const resolution = video.videoWidth && video.videoHeight ? `${video.videoWidth} x ${video.videoHeight}` : sourceVideo?.resolution || "1920 x 1080";
    setDuration(nextDuration);
    if (isEditing && draftVideo) {
      setDraftVideo((current) => current ? { ...current, duration: nextDuration, resolution } : current);
    }
  };

  const startProcessing = () => {
    if (!draftVideo) {
      setValidationMessage("请先选择待处理视频");
      return;
    }
    if (recognitionState === "recognizing") {
      setValidationMessage(`正在识别${type === "watermark" ? "水印" : "字幕"}区域，请稍候`);
      return;
    }
    if (draftRegions.length === 0) {
      setValidationMessage(`请至少保留或添加一个${type === "watermark" ? "水印" : "字幕"}选区`);
      return;
    }
    const taskId = onCreateTask({ sourceVideo: draftVideo, regions: draftRegions });
    if (!taskId) return;
    onActiveTaskChange(taskId);
    setIsEditing(false);
    setValidationMessage("");
  };

  const downloadResult = () => {
    if (!output) return;
    const link = document.createElement("a");
    link.href = output.videoUrl;
    link.download = outputName || output.name;
    recordDownload(link.download, "视频处理");
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  };

  const renderRegion = (region: WatermarkRegion, index: number, draft = false) => (
    <div
      key={region.id}
      data-region-control
      onPointerDown={(event) => !draft && beginRegionInteraction(event, region, "move")}
      className={`absolute border-2 ${draft ? "border-dashed border-violet-400 bg-violet-400/15" : "border-violet-500 bg-violet-500/15 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"} ${controlsLocked ? "cursor-default" : "cursor-move"}`}
      style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }}
    >
      {!draft && <>
        <span className="pointer-events-none absolute -top-6 left-0 rounded bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold text-white">{copy.regionLabel} {index + 1}</span>
        {!controlsLocked && <>
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); removeRegion(region.id); }} title="删除选区" className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white shadow"><X className="h-3 w-3" /></button>
          {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => (
            <span
              key={handle}
              onPointerDown={(event) => beginRegionInteraction(event, region, "resize", handle)}
              className={`absolute h-2.5 w-2.5 rounded-sm border border-violet-600 bg-white ${handle === "nw" ? "-left-1.5 -top-1.5 cursor-nwse-resize" : handle === "ne" ? "-right-1.5 -top-1.5 cursor-nesw-resize" : handle === "sw" ? "-bottom-1.5 -left-1.5 cursor-nesw-resize" : "-bottom-1.5 -right-1.5 cursor-nwse-resize"}`}
            />
          ))}
        </>}
      </>}
    </div>
  );

  if (uploadOpen && output) {
    return <UploadFinishedVideoModal
      key={`${task?.id}-${outputName}`}
      isOpen
      isPage
      initialFiles={[{ name: outputName || output.name, type: "video/mp4", url: output.videoUrl }]}
      onClose={() => { setUploadOpen(false); setIsPlaying(false); setCurrentTime(0); }}
      onPublishSuccess={(message) => {
        onUploadResult({ ...output, name: outputName || output.name });
        setToast(message);
      }}
    />;
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 text-slate-800 lg:overflow-hidden">
      <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={onBack} title="返回" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /></button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900">{copy.title}</h1>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{copy.description}</p>
            </div>
          </div>
          <button type="button" disabled={taskInProgress} onClick={startNewTask} className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />新建任务</button>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-hidden">
        <aside className="flex min-h-[560px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm lg:min-h-0 lg:overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">待处理视频</h2><span className="text-[10px] text-slate-400">一次处理 1 个</span></div>
            {sourceVideo ? (
              <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-slate-200">
                  <img src={sourceVideo.coverUrl || FALLBACK_COVER} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15"><Play className="h-4 w-4 fill-white text-white" /></span>
                </div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{sourceVideo.name}</p><p className="mt-1 text-[10px] text-slate-400">{formatTime(sourceVideo.duration)} · {sourceVideo.size}</p></div>
                {isEditing && <button type="button" onClick={() => setPickerOpen(true)} title="更换视频" className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-violet-700"><RotateCcw className="h-3.5 w-3.5" /></button>}
              </div>
            ) : (
              <button type="button" onClick={() => setPickerOpen(true)} className="flex h-28 w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:bg-violet-50/30 hover:text-violet-700"><Upload className="h-5 w-5" /><span className="mt-2 text-xs font-semibold">选择视频</span><span className="mt-1 text-[10px] text-slate-400">资源库或本地上传</span></button>
            )}
            {recognitionState === "recognizing" && isEditing && <div className="mt-3 rounded-md border border-violet-100 bg-violet-50 px-3 py-2.5"><div className="flex items-center justify-between text-[11px] font-semibold text-violet-700"><span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />{copy.recognizing}</span><span>2 秒</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-violet-100"><div className="h-full w-full origin-left animate-pulse rounded-full bg-violet-600" /></div></div>}
            {recognitionState === "ready" && isEditing && <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600"><Check className="h-3.5 w-3.5" />识别完成，已自动框选</p>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-sm font-bold text-slate-900">{copy.regionTitle}</h2><p className="mt-1 text-[10px] text-slate-400">{regions.length} / {MAX_REGIONS}</p></div>
              <button type="button" disabled={controlsLocked || !sourceVideo || draftRegions.length >= MAX_REGIONS} onClick={() => setDrawMode(true)} className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold ${drawMode ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700"} disabled:cursor-not-allowed disabled:opacity-40`}><Plus className="h-3.5 w-3.5" />添加选区</button>
            </div>
            {drawMode && <p className="mt-3 rounded-md bg-violet-50 px-3 py-2 text-[10px] font-medium text-violet-700">请在右侧画面中拖动框选{type === "watermark" ? "水印" : "字幕"}</p>}
            <div className="mt-3 space-y-2">
              {regions.map((region, index) => <div key={region.id} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-violet-50 text-[10px] font-bold text-violet-700">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-slate-700">{copy.regionLabel} {index + 1}</p><p className="mt-0.5 truncate font-mono text-[9px] text-slate-400">X {region.x.toFixed(1)}% · Y {region.y.toFixed(1)}% · {region.width.toFixed(1)}% x {region.height.toFixed(1)}%</p></div>{isEditing && recognitionState !== "recognizing" && <button type="button" onClick={() => removeRegion(region.id)} title="删除选区" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>}</div>)}
              {sourceVideo && recognitionState !== "recognizing" && regions.length === 0 && <div className="rounded-md border border-dashed border-slate-200 py-8 text-center"><ScanSearch className="mx-auto h-5 w-5 text-slate-300" /><p className="mt-2 text-[11px] text-slate-400">暂无{type === "watermark" ? "水印" : "字幕"}选区</p></div>}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 p-4">
            {validationMessage && <p className="mb-2.5 text-[11px] font-medium text-rose-600">{validationMessage}</p>}
            {!isEditing && task?.status === "queue" ? <button type="button" onClick={() => onCancelTask(task.id)} className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-rose-200 bg-white text-sm font-bold text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" />取消排队</button> : !isEditing ? <button type="button" onClick={startNewTask} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"><RotateCcw className="h-4 w-4" />{copy.newTask}</button> : <button type="button" disabled={!draftVideo || recognitionState === "recognizing"} onClick={startProcessing} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><Eraser className="h-4 w-4" />{copy.start}<span className="text-violet-200">· {WATERMARK_COST} 积分</span></button>}
          </div>
        </aside>

        <main className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:min-h-0">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
            <div><h2 className="text-sm font-bold text-slate-900">{!isEditing && task?.status === "completed" ? "处理结果" : "视频预览"}</h2><p className="mt-1 text-[10px] text-slate-400">{sourceVideo ? `${sourceVideo.resolution} · 保留原视频声音` : "等待选择视频"}</p></div>
            {taskStatus && !isEditing && <span className={`rounded px-2.5 py-1 text-[11px] font-semibold ${taskStatus.className}`}>{taskStatus.label}</span>}
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-slate-950 p-4">
            {displayUrl ? (
              <div
                ref={canvasRef}
                onPointerDown={beginDraw}
                onPointerMove={handlePointerMove}
                onPointerUp={finishPointerInteraction}
                onPointerCancel={finishPointerInteraction}
                className={`relative h-full max-h-full w-full max-w-full overflow-hidden bg-black ${drawMode ? "cursor-crosshair" : ""}`}
                style={{ touchAction: "none" }}
              >
                <video ref={videoRef} src={displayUrl} poster={displayCover} className="h-full w-full object-contain" preload="metadata" playsInline onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
                {isEditing && regions.map((region, index) => renderRegion(region, index))}
                {drawingRegion && renderRegion(drawingRegion, draftRegions.length, true)}
                {recognitionState === "recognizing" && isEditing && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/45"><div className="flex items-center gap-2 rounded-md bg-white/95 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xl"><ScanSearch className="h-4 w-4 animate-pulse text-violet-600" />{copy.canvasRecognizing}</div></div>}
                {taskInProgress && task && <div className="absolute inset-x-4 bottom-4 z-20 rounded-md border border-white/15 bg-slate-950/90 px-4 py-3 text-white shadow-xl backdrop-blur-sm"><div className="flex items-center justify-between gap-4 text-xs"><span className="flex items-center gap-2 font-semibold">{task.status === "queue" ? <Clock3 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}{task.status === "queue" ? "任务排队中" : copy.processing}</span><span className="shrink-0 font-mono font-bold">{task.progress}%</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-violet-500 transition-[width]" style={{ width: `${Math.max(task.progress, 3)}%` }} /></div></div>}
              </div>
            ) : <div className="text-center text-slate-500"><FileVideo2 className="mx-auto h-10 w-10" /><p className="mt-3 text-sm font-semibold">选择视频后在此预览</p></div>}
          </div>

          {displayUrl && !taskInProgress && <div className="mt-4 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5"><div className="flex items-center gap-3"><button type="button" onClick={togglePlayback} title={isPlaying ? "暂停" : "播放"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-violet-700">{isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}</button><span className="w-10 text-right font-mono text-[10px] text-slate-500">{formatTime(currentTime)}</span><input type="range" min={0} max={Math.max(duration, 0.1)} step={0.05} value={Math.min(currentTime, duration)} onChange={(event) => seekTo(Number(event.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-violet-600" /><span className="w-10 font-mono text-[10px] text-slate-500">{formatTime(duration)}</span></div></div>}

          {!isEditing && task?.status === "completed" && output && <div className="mt-4 flex shrink-0 items-end gap-3 rounded-md border border-emerald-100 bg-emerald-50/60 p-4"><div className="min-w-0 flex-1"><label className="mb-1.5 block text-[10px] font-semibold text-slate-500">输出文件名称</label><input value={outputName} onChange={(event) => setOutputName(event.target.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400" /></div><button type="button" onClick={downloadResult} className="flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700"><Download className="h-3.5 w-3.5" />下载视频</button><button type="button" onClick={() => setUploadOpen(true)} className="flex h-9 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"><Upload className="h-3.5 w-3.5" />上传资源库</button></div>}
          {!isEditing && task?.status === "failed" && <div className="mt-4 rounded-md border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700">{task.failureReason || "视频处理失败，40 积分已全额退回。"}</div>}
          {!isEditing && task?.status === "cancelled" && <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700">任务已取消，40 积分已全额退回。</div>}
        </main>
      </div>

      {pickerOpen && <VideoResourcePickerModal items={videoItems} initialSelectedIds={draftVideo ? [draftVideo.id] : []} allowLocalUpload showAllSection maxSelections={1} onClose={() => setPickerOpen(false)} onConfirm={handlePickerConfirm} />}
      {toast && <OverlayPortal layer="toast" className="fixed left-1/2 top-6 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</OverlayPortal>}
    </section>
  );
}
