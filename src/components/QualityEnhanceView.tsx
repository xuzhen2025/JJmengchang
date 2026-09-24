import React, { useEffect, useMemo, useRef, useState } from "react";
import { recordDownload } from "../lib/operationHistory";
import {
  ArrowLeft,
  Clock3,
  Download,
  FileVideo2,
  Gauge,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  Asset,
  EnhanceFrameRate,
  EnhanceResolution,
  EnhanceTaskOutput,
  EnhanceTaskSnapshot,
  EnhanceVideo,
  Task,
} from "../types";
import {
  buildEnhanceOutputName,
  calculateEnhanceCredits,
  ENHANCE_MAX_FILE_SIZE_MB,
  getAvailableEnhanceResolutions,
  getEnhanceResolutionLabel,
  parseDurationSeconds,
  resolveEnhanceResolution,
} from "../lib/videoEnhance";
import OverlayPortal from "./overlays/OverlayPortal";
import UploadFinishedVideoModal from "./UploadFinishedVideoModal";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";

interface QualityEnhanceViewProps {
  assets: Asset[];
  credits: number;
  task: Task | null;
  onBack: () => void;
  onCreateTask: (snapshot: EnhanceTaskSnapshot, creditsCost: number) => string | null;
  onActiveTaskChange: (taskId: string | null) => void;
  onCancelTask: (taskId: string) => void;
  onUploadResult: (output: EnhanceTaskOutput) => void;
}

const FALLBACK_DURATION = 15;
const FALLBACK_RESOLUTION = "1920 x 1080";
const FALLBACK_COVER = "./assets/prototype/beauty-promo-detail.jpg";

const statusMeta: Record<Task["status"], { label: string; className: string }> = {
  ready: { label: "待配置", className: "bg-amber-50 text-amber-700" },
  queue: { label: "排队中", className: "bg-slate-100 text-slate-700" },
  generating: { label: "增强中", className: "bg-blue-50 text-blue-700" },
  completed: { label: "增强成功", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "增强失败", className: "bg-rose-50 text-rose-700" },
  cancelled: { label: "已取消", className: "bg-amber-50 text-amber-700" },
};

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const readVideoMetadata = (url: string) => new Promise<{ duration: number; resolution: string }>((resolve) => {
  const probe = document.createElement("video");
  let settled = false;
  const finish = (result: { duration: number; resolution: string }) => {
    if (settled) return;
    settled = true;
    probe.removeAttribute("src");
    probe.load();
    resolve(result);
  };
  const timeout = window.setTimeout(() => finish({ duration: FALLBACK_DURATION, resolution: FALLBACK_RESOLUTION }), 3000);
  probe.preload = "metadata";
  probe.onloadedmetadata = () => {
    window.clearTimeout(timeout);
    finish({
      duration: Number.isFinite(probe.duration) ? probe.duration : FALLBACK_DURATION,
      resolution: probe.videoWidth && probe.videoHeight ? `${probe.videoWidth} x ${probe.videoHeight}` : FALLBACK_RESOLUTION,
    });
  };
  probe.onerror = () => {
    window.clearTimeout(timeout);
    finish({ duration: FALLBACK_DURATION, resolution: FALLBACK_RESOLUTION });
  };
  probe.src = url;
});

export default function QualityEnhanceView({
  assets,
  credits,
  task,
  onBack,
  onCreateTask,
  onActiveTaskChange,
  onCancelTask,
  onUploadResult,
}: QualityEnhanceViewProps) {
  const [isEditing, setIsEditing] = useState(!task);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftVideo, setDraftVideo] = useState<EnhanceVideo | null>(null);
  const [requestedResolution, setRequestedResolution] = useState<EnhanceResolution>("auto");
  const [frameRate, setFrameRate] = useState<EnhanceFrameRate>("source");
  const [isReadingMetadata, setIsReadingMetadata] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [outputName, setOutputName] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [comparePosition, setComparePosition] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(FALLBACK_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const primaryVideoRef = useRef<HTMLVideoElement | null>(null);
  const comparisonVideoRef = useRef<HTMLVideoElement | null>(null);

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
      resolution: asset.fileInfo?.resolution || FALLBACK_RESOLUTION,
      fps: 30,
    })), [assets]);

  const snapshot = task?.enhanceSnapshot;
  const output = task?.enhanceOutput;
  const sourceVideo = isEditing ? draftVideo : snapshot?.sourceVideo || null;
  const availableResolutions = useMemo(
    () => getAvailableEnhanceResolutions(sourceVideo?.resolution || FALLBACK_RESOLUTION),
    [sourceVideo?.resolution],
  );
  const resolvedResolution = resolveEnhanceResolution(requestedResolution, sourceVideo?.resolution || FALLBACK_RESOLUTION);
  const quote = calculateEnhanceCredits(sourceVideo?.duration || FALLBACK_DURATION, resolvedResolution, frameRate);
  const taskInProgress = !isEditing && (task?.status === "queue" || task?.status === "generating");
  const completed = !isEditing && task?.status === "completed" && Boolean(output);
  const displayUrl = completed ? output?.videoUrl : sourceVideo?.url;
  const displayCover = completed ? output?.coverUrl : sourceVideo?.coverUrl;
  const taskStatus = task ? statusMeta[task.status] : null;
  const hasEnoughCredits = credits >= quote.total;

  useEffect(() => {
    if (!task) return;
    setIsEditing(false);
    setRequestedResolution(task.enhanceSnapshot?.requestedResolution || "auto");
    setFrameRate(task.enhanceSnapshot?.frameRate || "source");
    setOutputName(task.enhanceOutput?.name || (task.enhanceSnapshot ? buildEnhanceOutputName(task.enhanceSnapshot.sourceVideo.name, task.enhanceSnapshot.outputResolution, task.enhanceSnapshot.outputFps) : `${task.name}.mp4`));
  }, [task?.id, task?.enhanceOutput?.name, task?.enhanceSnapshot]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(sourceVideo?.duration || output?.duration || FALLBACK_DURATION);
    setIsPlaying(false);
    setComparePosition(50);
    if (primaryVideoRef.current) primaryVideoRef.current.currentTime = 0;
    if (comparisonVideoRef.current) comparisonVideoRef.current.currentTime = 0;
  }, [displayUrl, output?.duration, sourceVideo?.duration]);

  useEffect(() => {
    if (!taskInProgress) return;
    primaryVideoRef.current?.pause();
    comparisonVideoRef.current?.pause();
    setIsPlaying(false);
  }, [taskInProgress]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handlePickerConfirm = async (selected: VideoResourcePickerItem[]) => {
    const item = selected[0];
    if (!item) return;
    setPickerOpen(false);
    setIsReadingMetadata(true);
    setValidationMessage("");
    const measured = item.url ? await readVideoMetadata(item.url) : { duration: FALLBACK_DURATION, resolution: FALLBACK_RESOLUTION };
    const listedDuration = parseDurationSeconds(item.duration, measured.duration);
    setDraftVideo({
      id: item.id,
      name: item.name,
      url: item.url || item.cover,
      coverUrl: item.cover,
      size: item.size,
      duration: item.duration === "--:--" ? measured.duration : listedDuration,
      resolution: item.resolution || measured.resolution,
      fps: item.fps || 30,
    });
    setRequestedResolution("auto");
    setFrameRate("source");
    setIsReadingMetadata(false);
  };

  const startNewTask = () => {
    primaryVideoRef.current?.pause();
    comparisonVideoRef.current?.pause();
    onActiveTaskChange(null);
    setIsEditing(true);
    setDraftVideo(null);
    setRequestedResolution("auto");
    setFrameRate("source");
    setValidationMessage("");
    setOutputName("");
  };

  const startEnhance = () => {
    if (!draftVideo) {
      setValidationMessage("请先选择待增强视频");
      return;
    }
    if (!hasEnoughCredits) {
      setValidationMessage(`可用积分不足，还需 ${quote.total - credits} 积分`);
      return;
    }
    const outputResolution = resolveEnhanceResolution(requestedResolution, draftVideo.resolution);
    const creditsQuote = calculateEnhanceCredits(draftVideo.duration, outputResolution, frameRate);
    const taskId = onCreateTask({
      sourceVideo: draftVideo,
      requestedResolution,
      outputResolution,
      frameRate,
      outputFps: frameRate === "60" ? 60 : draftVideo.fps,
      billingMinutes: creditsQuote.billingMinutes,
    }, creditsQuote.total);
    if (!taskId) return;
    primaryVideoRef.current?.pause();
    comparisonVideoRef.current?.pause();
    onActiveTaskChange(taskId);
    setIsEditing(false);
    setValidationMessage("");
  };

  const syncComparisonTime = (time: number) => {
    const comparison = comparisonVideoRef.current;
    if (comparison && Math.abs(comparison.currentTime - time) > 0.08) comparison.currentTime = time;
  };

  const togglePlayback = async () => {
    const primary = primaryVideoRef.current;
    if (!primary || taskInProgress) return;
    if (primary.paused) {
      syncComparisonTime(primary.currentTime);
      try {
        await primary.play();
        if (comparisonVideoRef.current) await comparisonVideoRef.current.play();
      } catch {
        primary.pause();
        comparisonVideoRef.current?.pause();
        setIsPlaying(false);
      }
    } else {
      primary.pause();
      comparisonVideoRef.current?.pause();
    }
  };

  const seekTo = (value: number) => {
    if (taskInProgress) return;
    if (primaryVideoRef.current) primaryVideoRef.current.currentTime = value;
    if (comparisonVideoRef.current) comparisonVideoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const downloadResult = () => {
    if (!output) return;
    const link = document.createElement("a");
    link.href = output.videoUrl;
    link.download = outputName || output.name;
    recordDownload(link.download, "画质增强");
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  };

  const renderPrimaryVideo = (enhanced = false) => <video
    ref={primaryVideoRef}
    src={displayUrl}
    poster={displayCover}
    className="absolute inset-0 h-full w-full object-contain"
    style={enhanced ? { filter: "contrast(1.1) saturate(1.08) brightness(1.025)" } : undefined}
    preload="metadata"
    playsInline
    onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : sourceVideo?.duration || FALLBACK_DURATION)}
    onTimeUpdate={(event) => { setCurrentTime(event.currentTarget.currentTime); syncComparisonTime(event.currentTarget.currentTime); }}
    onPlay={() => setIsPlaying(true)}
    onPause={() => { setIsPlaying(false); comparisonVideoRef.current?.pause(); }}
    onEnded={() => { setIsPlaying(false); comparisonVideoRef.current?.pause(); }}
  />;

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
          <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={onBack} title="返回" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /></button><div className="min-w-0"><h1 className="text-base font-bold text-slate-900">视频画质增强</h1><p className="mt-0.5 truncate text-[11px] text-slate-400">智能修复视频细节并提升输出画质</p></div></div>
          <button type="button" disabled={taskInProgress} onClick={startNewTask} className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />新建任务</button>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-hidden">
        <aside className="flex min-h-[560px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm lg:min-h-0 lg:overflow-hidden">
          <div className="shrink-0 border-b border-slate-100 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">待增强视频</h2><span className="text-[10px] text-slate-400">一次处理 1 个</span></div>{sourceVideo ? <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5"><div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-slate-200"><img src={sourceVideo.coverUrl || FALLBACK_COVER} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /><span className="absolute inset-0 flex items-center justify-center bg-black/15"><Play className="h-4 w-4 fill-white text-white" /></span></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{sourceVideo.name}</p><p className="mt-1 text-[10px] text-slate-400">{formatTime(sourceVideo.duration)} · {sourceVideo.size}</p></div>{isEditing && <button type="button" onClick={() => setPickerOpen(true)} title="更换视频" className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-violet-700"><RotateCcw className="h-3.5 w-3.5" /></button>}</div> : <button type="button" onClick={() => setPickerOpen(true)} className="flex h-28 w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:bg-violet-50/30 hover:text-violet-700"><Upload className="h-5 w-5" /><span className="mt-2 text-xs font-semibold">选择视频</span><span className="mt-1 text-[10px] text-slate-400">资源库或本地上传</span></button>}{isReadingMetadata && <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-violet-700"><Loader2 className="h-3.5 w-3.5 animate-spin" />正在读取视频信息</p>}</div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="rounded-md border border-violet-100 bg-violet-50/60 p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded bg-violet-600 text-white"><Sparkles className="h-3.5 w-3.5" /></span><div><p className="text-xs font-bold text-slate-800">智能综合增强</p><p className="mt-0.5 text-[10px] text-slate-400">降噪 · 去模糊 · 瑕疵修复 · 细节与色彩优化</p></div></div></div>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">输出分辨率</span><select value={requestedResolution} disabled={!isEditing || !sourceVideo} onChange={(event) => { setRequestedResolution(event.target.value as EnhanceResolution); setValidationMessage(""); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="auto">智能推荐（{getEnhanceResolutionLabel(resolveEnhanceResolution("auto", sourceVideo?.resolution || FALLBACK_RESOLUTION))}）</option>{(["1080p", "2k", "4k"] as const).map((resolution) => <option key={resolution} value={resolution} disabled={!availableResolutions.includes(resolution)}>{getEnhanceResolutionLabel(resolution)}{!availableResolutions.includes(resolution) ? "（低于原视频）" : ""}</option>)}</select>{sourceVideo && <p className="mt-1.5 text-[10px] text-slate-400">原视频 {sourceVideo.resolution}</p>}</label>
              <div><span className="mb-2 block text-xs font-bold text-slate-700">目标帧率</span><div className="grid grid-cols-2 rounded-md bg-slate-100 p-1">{([{ value: "source", label: `保持原帧率${sourceVideo ? ` ${sourceVideo.fps} FPS` : ""}` }, { value: "60", label: "智能补帧 60 FPS" }] as const).map((item) => <button key={item.value} type="button" disabled={!isEditing || !sourceVideo} onClick={() => { setFrameRate(item.value); setValidationMessage(""); }} className={`h-8 rounded text-[11px] font-semibold transition-colors ${frameRate === item.value ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"} disabled:cursor-not-allowed disabled:opacity-50`}>{item.label}</button>)}</div></div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">计费时长</span><span className="font-semibold text-slate-700">{quote.billingMinutes} 分钟</span></div><div className="mt-2 flex items-center justify-between text-[11px]"><span className="text-slate-500">输出规格</span><span className="font-semibold text-slate-700">{getEnhanceResolutionLabel(resolvedResolution)} · {frameRate === "60" ? "60 FPS" : `${sourceVideo?.fps || 30} FPS`}</span></div><div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3"><span className="text-xs font-bold text-slate-700">预计消耗</span><span className="font-mono text-sm font-bold text-amber-600">{quote.total} 积分</span></div></div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 p-4">{validationMessage && <p className="mb-2.5 text-[11px] font-medium text-rose-600">{validationMessage}</p>}{isEditing && sourceVideo && !hasEnoughCredits && <p className="mb-2.5 text-[11px] font-medium text-rose-600">可用积分不足，还需 {quote.total - credits} 积分</p>}{!isEditing && task?.status === "queue" ? <button type="button" onClick={() => onCancelTask(task.id)} className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-rose-200 bg-white text-sm font-bold text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" />取消排队</button> : !isEditing && task?.status === "generating" ? <button type="button" disabled className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-100 text-sm font-bold text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />增强处理中</button> : !isEditing ? <button type="button" onClick={startNewTask} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"><RotateCcw className="h-4 w-4" />新建画质增强任务</button> : <button type="button" disabled={!draftVideo || isReadingMetadata || !hasEnoughCredits} onClick={startEnhance} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><Gauge className="h-4 w-4" />开始增强<span className={draftVideo && hasEnoughCredits ? "text-violet-200" : "text-slate-400"}>· {quote.total} 积分</span></button>}</div>
        </aside>

        <main className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:min-h-0">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-4"><div><h2 className="text-sm font-bold text-slate-900">{completed ? "增强效果对比" : "视频预览"}</h2><p className="mt-1 text-[10px] text-slate-400">{sourceVideo ? `${sourceVideo.resolution} · ${sourceVideo.fps} FPS · 完整视频` : "等待选择视频"}</p></div>{taskStatus && !isEditing && <span className={`rounded px-2.5 py-1 text-[11px] font-semibold ${taskStatus.className}`}>{taskStatus.label}</span>}</div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-slate-950 p-4">{displayUrl ? <div className="relative h-full max-h-full w-full max-w-full overflow-hidden bg-black">{completed ? <>{renderPrimaryVideo(true)}<video ref={comparisonVideoRef} src={snapshot?.sourceVideo.url} poster={snapshot?.sourceVideo.coverUrl} muted className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }} preload="metadata" playsInline /><div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow" style={{ left: `${comparePosition}%` }}><span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-violet-300 bg-white text-[11px] font-bold text-violet-700 shadow-lg">↔</span></div><input type="range" min={0} max={100} value={comparePosition} onChange={(event) => setComparePosition(Number(event.target.value))} aria-label="调整原视频与增强效果对比范围" className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0" /><span className="pointer-events-none absolute left-3 top-3 z-30 rounded bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white">原视频</span><span className="pointer-events-none absolute right-3 top-3 z-30 rounded bg-violet-600/90 px-2 py-1 text-[10px] font-semibold text-white">增强效果</span></> : renderPrimaryVideo()}{taskInProgress && task && <div className="absolute inset-x-4 bottom-4 z-30 rounded-md border border-white/15 bg-slate-950/90 px-4 py-3 text-white shadow-xl backdrop-blur-sm"><div className="flex items-center justify-between gap-4 text-xs"><span className="flex items-center gap-2 font-semibold">{task.status === "queue" ? <Clock3 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}{task.status === "queue" ? "任务排队中" : "正在增强视频画质"}</span><span className="shrink-0 font-mono font-bold">{task.progress}%</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-violet-500 transition-[width]" style={{ width: `${Math.max(task.progress, 3)}%` }} /></div></div>}</div> : <div className="text-center text-slate-500"><FileVideo2 className="mx-auto h-10 w-10" /><p className="mt-3 text-sm font-semibold">选择视频后在此预览</p></div>}</div>
          {displayUrl && !taskInProgress && <div className="mt-4 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5"><div className="flex items-center gap-3"><button type="button" onClick={togglePlayback} title={isPlaying ? "暂停" : "播放"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-violet-700">{isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}</button><span className="w-10 text-right font-mono text-[10px] text-slate-500">{formatTime(currentTime)}</span><input type="range" min={0} max={Math.max(duration, 0.1)} step={0.05} value={Math.min(currentTime, duration)} onChange={(event) => seekTo(Number(event.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-violet-600" /><span className="w-10 font-mono text-[10px] text-slate-500">{formatTime(duration)}</span></div></div>}
          {completed && output && <div className="mt-4 flex shrink-0 items-end gap-3 rounded-md border border-emerald-100 bg-emerald-50/60 p-4"><div className="min-w-0 flex-1"><label className="mb-1.5 block text-[10px] font-semibold text-slate-500">输出文件名称</label><input value={outputName} onChange={(event) => setOutputName(event.target.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400" /></div><button type="button" onClick={downloadResult} className="flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700"><Download className="h-3.5 w-3.5" />下载视频</button><button type="button" onClick={() => setUploadOpen(true)} className="flex h-9 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"><Upload className="h-3.5 w-3.5" />上传资源库</button></div>}
          {!isEditing && task?.status === "failed" && <div className="mt-4 shrink-0 rounded-md border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700">{task.failureReason || `视频画质增强失败，${task.creditsCost} 积分已全额退回。`}</div>}
          {!isEditing && task?.status === "cancelled" && <div className="mt-4 shrink-0 rounded-md border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700">任务已取消，{task.creditsCost} 积分已全额退回。</div>}
        </main>
      </div>

      {pickerOpen && <VideoResourcePickerModal items={videoItems} initialSelectedIds={draftVideo ? [draftVideo.id] : []} allowLocalUpload showAllSection maxSelections={1} maxFileSizeMB={ENHANCE_MAX_FILE_SIZE_MB} onClose={() => setPickerOpen(false)} onConfirm={handlePickerConfirm} />}
      {toast && <OverlayPortal layer="toast" className="fixed left-1/2 top-6 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</OverlayPortal>}
    </section>
  );
}
