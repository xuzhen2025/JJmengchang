import React, { useEffect, useMemo, useRef, useState } from "react";
import { recordDownload } from "../lib/operationHistory";
import { FACE_PHASE_LABELS } from "../lib/videoFaceSwap";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Upload,
  Video,
  WandSparkles,
  X
} from "lucide-react";
import { EnhanceTaskOutput, GenerationTaskCategory, Task, WatermarkTaskOutput } from "../types";
import OverlayPortal from "./overlays/OverlayPortal";

export interface TaskQueueUploadRequest {
  files: Array<{ name: string; type: string; url: string }>;
  onPublishSuccess: (message: string) => void;
}

interface TaskQueuePanelProps {
  tasks: Task[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  cancelTask: (taskId: string) => void;
  restartTask: (taskId: string) => void;
  viewResult: (taskId: string) => void;
  uploadEraseResult: (type: "watermark" | "subtitle", output: WatermarkTaskOutput) => void;
  uploadEnhanceResult: (output: EnhanceTaskOutput) => void;
  onUploadToLibrary: (request: TaskQueueUploadRequest) => void;
  uploadPageOpen: boolean;
}

const CATEGORY_META: Record<GenerationTaskCategory, { label: string }> = {
  agent: { label: "Agent创作" },
  quick_creation: { label: "快速创作" },
  watermark: { label: "视频去水印" },
  subtitle: { label: "字幕擦除" },
  enhance: { label: "画质增强" },
  face_swap: { label: "视频换脸" },
  fission: { label: "爆款复刻" },
  ai_video: { label: "AI视频原料" }
};

const STATUS_META: Record<Task["status"], { label: string; className: string }> = {
  ready: { label: "待配置", className: "bg-amber-50 text-amber-700" },
  queue: { label: "排队中", className: "bg-slate-100 text-slate-700" },
  generating: { label: "生成中", className: "bg-blue-50 text-blue-700" },
  completed: { label: "生成成功", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "生成失败", className: "bg-rose-50 text-rose-700" },
  cancelled: { label: "已取消", className: "bg-amber-50 text-amber-700" }
};

const getTaskCategory = (task: Task): GenerationTaskCategory => {
  if (task.category) return task.category;
  if (task.source === "agent") return "agent";
  if (task.type === "watermark") return "watermark";
  if (task.type === "subtitle") return "subtitle";
  if (task.type === "enhance") return "enhance";
  if (task.type === "face_swap") return "face_swap";
  if (task.type === "fission") return "fission";
  if (task.type === "video_gen") return "ai_video";
  return "quick_creation";
};

const hasVideoProcessSnapshot = (task: Task) => {
  if (task.category === "enhance") return Boolean(task.enhanceSnapshot);
  if (task.category === "subtitle") return Boolean(task.subtitleSnapshot);
  if (task.category === "watermark") return Boolean(task.watermarkSnapshot);
  return false;
};

const getTimestamp = (value: string) => {
  const timestamp = Date.parse(value.replace(/-/g, "/"));
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getDateLabel = (date: string) => {
  const [, month = "", day = ""] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
};

const AGENT_STAGE_LABELS: Record<NonNullable<Task["agentStage"]>, string> = {
  analysis: "需求分析",
  script: "创意分镜",
  preview: "视频预览",
  final: "成片"
};

const REMAKE_STAGE_LABELS: Record<NonNullable<Task["remakeStage"]>, string> = {
  video_analysis: "视频分析",
  storyboard: "分镜解析",
  final: "成片"
};

const LAUNCHER_VIEWPORT_MARGIN = 12;
const LAUNCHER_DRAG_THRESHOLD = 4;

const clampLauncherTop = (top: number, height: number, viewportHeight: number) => {
  const maxTop = Math.max(LAUNCHER_VIEWPORT_MARGIN, viewportHeight - height - LAUNCHER_VIEWPORT_MARGIN);
  return Math.min(maxTop, Math.max(LAUNCHER_VIEWPORT_MARGIN, top));
};

const getTaskStageLabel = (task: Task, category: GenerationTaskCategory) => {
  if (category === "agent" && task.agentStage) return AGENT_STAGE_LABELS[task.agentStage];
  if (category === "fission") {
    if (task.remakeStage) return REMAKE_STAGE_LABELS[task.remakeStage];
    if (task.name.includes("成片")) return "成片";
    if (task.name.includes("分镜")) return "分镜解析";
    return "视频分析";
  }
  return "";
};

export default function TaskQueuePanel({ tasks, isOpen, setIsOpen, cancelTask, restartTask, viewResult, uploadEraseResult, uploadEnhanceResult, onUploadToLibrary, uploadPageOpen }: TaskQueuePanelProps) {
  const [eraseDetailTaskId, setEraseDetailTaskId] = useState<string | null>(null);
  const [eraseOutputName, setEraseOutputName] = useState("");
  const [toast, setToast] = useState("");
  const [launcherTop, setLauncherTop] = useState<number | null>(null);
  const [isLauncherDragging, setIsLauncherDragging] = useState(false);
  const launcherRef = useRef<HTMLDivElement>(null);
  const launcherDragRef = useRef<{
    pointerId: number;
    startY: number;
    startTop: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const suppressLauncherClickRef = useRef(false);

  const activeCount = tasks.filter((task) => task.status === "queue" || task.status === "generating").length;

  const sortedTasks = useMemo(
    () => [...tasks].sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt)),
    [tasks]
  );
  const groupedTasks = useMemo(() => sortedTasks.reduce<Array<{ date: string; tasks: Task[] }>>((groups, task) => {
    const date = task.createdAt.slice(0, 10);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.date === date) lastGroup.tasks.push(task);
    else groups.push({ date, tasks: [task] });
    return groups;
  }, []), [sortedTasks]);
  const selectedEraseDetailTask = eraseDetailTaskId ? tasks.find((task) => task.id === eraseDetailTaskId) || null : null;
  const eraseDetailTask = selectedEraseDetailTask && hasVideoProcessSnapshot(selectedEraseDetailTask) ? selectedEraseDetailTask : null;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openEraseDetail = (task: Task) => {
    const output = task.category === "enhance" ? task.enhanceOutput : task.category === "subtitle" ? task.subtitleOutput : task.watermarkOutput;
    setEraseDetailTaskId(task.id);
    setEraseOutputName(output?.name || `${task.name}.mp4`);
  };

  const downloadEraseResult = (task: Task) => {
    const output = task.category === "enhance" ? task.enhanceOutput : task.category === "subtitle" ? task.subtitleOutput : task.watermarkOutput;
    if (!output) return;
    const link = document.createElement("a");
    link.href = output.videoUrl;
    link.download = eraseOutputName || output.name;
    recordDownload(link.download, "任务结果");
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  };

  const openResultUpload = (task: Task) => {
    const output = task.category === "enhance" ? task.enhanceOutput : task.category === "subtitle" ? task.subtitleOutput : task.watermarkOutput;
    if (task.status !== "completed" || !output) return;
    const name = eraseOutputName || output.name;
    onUploadToLibrary({
      files: [{ name, type: "video/mp4", url: output.videoUrl }],
      onPublishSuccess: (message) => {
        if (task.category === "enhance" && task.enhanceOutput) {
          uploadEnhanceResult({ ...task.enhanceOutput, name });
        } else if (task.category === "subtitle" && task.subtitleOutput) {
          uploadEraseResult("subtitle", { ...task.subtitleOutput, name });
        } else if (task.watermarkOutput) {
          uploadEraseResult("watermark", { ...task.watermarkOutput, name });
        }
        setToast(message);
      },
    });
  };

  useEffect(() => {
    const keepLauncherInView = () => {
      setLauncherTop((currentTop) => {
        if (currentTop === null) return null;
        const height = launcherRef.current?.getBoundingClientRect().height ?? 128;
        return clampLauncherTop(currentTop, height, window.innerHeight);
      });
    };

    window.addEventListener("resize", keepLauncherInView);
    return () => window.removeEventListener("resize", keepLauncherInView);
  }, []);

  const handleLauncherPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    launcherDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTop: bounds.top,
      height: bounds.height,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLauncherPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = launcherDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(deltaY) < LAUNCHER_DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      setIsLauncherDragging(true);
    }
    setLauncherTop(clampLauncherTop(drag.startTop + deltaY, drag.height, window.innerHeight));
  };

  const finishLauncherDrag = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = launcherDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    launcherDragRef.current = null;
    setIsLauncherDragging(false);
    if (!cancelled && drag.moved) {
      suppressLauncherClickRef.current = true;
      window.setTimeout(() => { suppressLauncherClickRef.current = false; }, 0);
    }
  };

  const openQueueFromLauncher = () => {
    if (suppressLauncherClickRef.current) {
      suppressLauncherClickRef.current = false;
      return;
    }
    setIsOpen(true);
  };

  if (uploadPageOpen) return null;

  if (!isOpen) {
    return (
      <OverlayPortal
        ref={launcherRef}
        layer="drawer"
        onClick={openQueueFromLauncher}
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={(event) => finishLauncherDrag(event)}
        onPointerCancel={(event) => finishLauncherDrag(event, true)}
        title={activeCount > 0 ? `当前有 ${activeCount} 个任务进行中` : "打开任务队列"}
        style={launcherTop === null ? undefined : { top: launcherTop }}
        className={`fixed right-0 flex min-h-32 touch-none select-none flex-col items-center justify-center gap-2 rounded-l-lg border border-r-0 border-violet-200 bg-white px-2.5 py-3 text-violet-700 shadow-lg transition-colors hover:bg-violet-50 ${launcherTop === null ? "top-1/2 -translate-y-1/2" : "translate-y-0"} ${isLauncherDragging ? "cursor-grabbing" : "cursor-grab"}`}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setIsOpen(true); } }}
      >
        {activeCount > 0 && <Loader2 className="h-4 w-4 animate-spin" />}
        <span className="text-[11px] font-bold [writing-mode:vertical-lr]">{activeCount > 0 ? `${activeCount}个任务` : "任务队列"}</span>
      </OverlayPortal>
    );
  }

  if (eraseDetailTask) {
    const isSubtitle = eraseDetailTask.category === "subtitle";
    const isEnhance = eraseDetailTask.category === "enhance";
    const status = eraseDetailTask.status === "generating"
      ? { ...STATUS_META.generating, label: isEnhance ? "增强中" : "处理中" }
      : eraseDetailTask.status === "completed"
        ? { ...STATUS_META.completed, label: isEnhance ? "增强成功" : "处理成功" }
        : eraseDetailTask.status === "failed"
          ? { ...STATUS_META.failed, label: isEnhance ? "增强失败" : "处理失败" }
          : STATUS_META[eraseDetailTask.status];
    const source = isEnhance ? eraseDetailTask.enhanceSnapshot?.sourceVideo : isSubtitle ? eraseDetailTask.subtitleSnapshot?.sourceVideo : eraseDetailTask.watermarkSnapshot?.sourceVideo;
    const output = isEnhance ? eraseDetailTask.enhanceOutput : isSubtitle ? eraseDetailTask.subtitleOutput : eraseDetailTask.watermarkOutput;
    const previewUrl = output?.videoUrl || source?.url;
    const previewCover = output?.coverUrl || source?.coverUrl;

    return <>
      <OverlayPortal layer="drawer" className="fixed right-0 top-0 flex h-screen w-[390px] flex-col border-l border-slate-200 bg-white text-slate-800 shadow-2xl" role="complementary">
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3.5">
          <button type="button" onClick={() => setEraseDetailTaskId(null)} title="返回任务列表" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /></button>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">{isEnhance ? "视频画质增强" : isSubtitle ? "字幕擦除" : "视频去水印"}</h2><p className="mt-0.5 truncate text-[10px] text-slate-400">{eraseDetailTask.name}</p></div>
          <button type="button" onClick={() => { setEraseDetailTaskId(null); setIsOpen(false); }} title="收起任务队列" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between"><span className={`rounded px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span><span className="text-[10px] text-slate-400">{eraseDetailTask.createdAt}</span></div>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            {previewUrl ? <video src={previewUrl} poster={previewCover} controls className="aspect-video w-full object-contain" preload="metadata" /> : <div className="flex aspect-video items-center justify-center text-slate-500"><Video className="h-8 w-8" /></div>}
          </div>
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="truncate text-xs font-semibold text-slate-700">{source?.name || eraseDetailTask.inputFiles[0] || "待处理视频"}</p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400"><span>{source ? `${source.resolution} · ${source.size}` : `${isEnhance ? "视频画质增强" : isSubtitle ? "字幕擦除" : "视频去水印"}任务`}</span><span>消耗 {eraseDetailTask.creditsCost} 积分</span></div>
            {isEnhance && eraseDetailTask.enhanceSnapshot && <p className="mt-2 border-t border-slate-200 pt-2 text-[10px] text-slate-500">输出 {eraseDetailTask.enhanceSnapshot.outputResolution.toUpperCase()} · {eraseDetailTask.enhanceSnapshot.outputFps} FPS · 计费 {eraseDetailTask.enhanceSnapshot.billingMinutes} 分钟</p>}
          </div>

          {(eraseDetailTask.status === "queue" || eraseDetailTask.status === "generating") && <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3"><div className="flex items-center justify-between text-[11px] font-semibold text-blue-700"><span className="flex items-center gap-1.5">{eraseDetailTask.status === "queue" ? <Clock3 className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}{eraseDetailTask.status === "queue" ? "等待处理资源" : isEnhance ? "正在增强视频画质" : isSubtitle ? "正在擦除字幕" : "正在去除水印"}</span><span className="font-mono">{eraseDetailTask.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${Math.max(eraseDetailTask.progress, 3)}%` }} /></div>{eraseDetailTask.status === "queue" && <button type="button" onClick={() => cancelTask(eraseDetailTask.id)} className="mt-3 w-full rounded-md border border-rose-200 bg-white py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50">取消排队</button>}</div>}
          {eraseDetailTask.status === "cancelled" && <p className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-3 text-[11px] leading-5 text-amber-700">任务已取消，{eraseDetailTask.creditsCost} 积分已全额退回。</p>}
          {eraseDetailTask.status === "failed" && <p className="mt-4 rounded-md border border-rose-100 bg-rose-50 p-3 text-[11px] leading-5 text-rose-700">{eraseDetailTask.failureReason || `处理失败，${eraseDetailTask.creditsCost} 积分已全额退回。`}</p>}
          {eraseDetailTask.status === "completed" && output && <div className="mt-4 space-y-3"><div><label className="mb-1.5 block text-[10px] font-semibold text-slate-500">输出文件名称</label><input value={eraseOutputName} onChange={(event) => setEraseOutputName(event.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400" /></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => downloadEraseResult(eraseDetailTask)} className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700"><Download className="h-3.5 w-3.5" />下载视频</button><button type="button" onClick={() => openResultUpload(eraseDetailTask)} className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-violet-600 text-xs font-semibold text-white hover:bg-violet-700"><Upload className="h-3.5 w-3.5" />上传资源库</button></div></div>}
        </div>
      </OverlayPortal>
      {toast && <OverlayPortal layer="toast" className="fixed left-1/2 top-6 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{toast}</OverlayPortal>}
    </>;
  }

  return (
    <OverlayPortal layer="drawer" className="fixed right-0 top-0 flex h-screen w-[390px] flex-col border-l border-slate-200 bg-white text-slate-800 shadow-2xl" role="complementary">
      <header className="border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-bold">任务队列</h2>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{tasks.length}</span>
          </div>
          <button onClick={() => setIsOpen(false)} title="收起任务队列" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {groupedTasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Sparkles className="h-6 w-6" /></div><p className="text-xs font-semibold text-slate-600">暂无任务</p></div>
        ) : groupedTasks.map((group) => (
          <section key={group.date}>
            <div className="sticky top-0 z-10 bg-white/95 py-2 text-[11px] font-bold text-slate-500 backdrop-blur-sm">{getDateLabel(group.date)}</div>
            <div className="space-y-2.5">
              {group.tasks.map((task) => {
                const category = getTaskCategory(task);
                const stageLabel = getTaskStageLabel(task, category);
                const isAgent = category === "agent";
                const isRemake = category === "fission";
                const isAiVideo = category === "ai_video";
                const isFaceSwap = category === "face_swap" && Boolean(task.faceSwap);
                const isErase = category === "watermark" || category === "subtitle";
                const isEnhance = category === "enhance";
                const isVideoProcess = (isErase || isEnhance) && hasVideoProcessSnapshot(task);
                const processOutput = isEnhance ? task.enhanceOutput : category === "subtitle" ? task.subtitleOutput : category === "watermark" ? task.watermarkOutput : undefined;
                const processSnapshot = isEnhance ? task.enhanceSnapshot : category === "subtitle" ? task.subtitleSnapshot : category === "watermark" ? task.watermarkSnapshot : undefined;
                const status = isFaceSwap ? { ...STATUS_META[task.status], label: FACE_PHASE_LABELS[task.faceSwap!.phase] } : isVideoProcess && task.status === "generating" ? { ...STATUS_META.generating, label: isEnhance ? "增强中" : "处理中" } : isVideoProcess && task.status === "completed" ? { ...STATUS_META.completed, label: isEnhance ? "增强成功" : "处理成功" } : isVideoProcess && task.status === "failed" ? { ...STATUS_META.failed, label: isEnhance ? "增强失败" : "处理失败" } : STATUS_META[task.status];
                const canCancel = task.cancellable !== false && (task.status === "queue" || (!isAiVideo && !isVideoProcess && task.status === "generating"));
                const canRestart = task.restartable !== false && (task.status === "failed" || task.status === "cancelled");
                const preview = task.faceSwap?.source.coverUrl || processOutput?.coverUrl || processSnapshot?.sourceVideo.coverUrl || task.aiVideoOutput?.coverUrl || task.outputFiles?.[0] || task.inputFiles.find((file) => /^https?:\/\//.test(file));
                const estimatedMinutes = Math.max(1, Math.ceil((100 - task.progress) / 12));
                const PreviewIcon = category === "agent" ? Bot : task.type === "image_gen" ? ImageIcon : category === "ai_video" ? Video : WandSparkles;
                return (
                  <article
                    key={task.id}
                    role={isAiVideo || isVideoProcess || isFaceSwap ? "button" : undefined}
                    tabIndex={isAiVideo || isVideoProcess || isFaceSwap ? 0 : undefined}
                    onClick={isVideoProcess ? () => openEraseDetail(task) : isAiVideo || isFaceSwap ? () => viewResult(task.id) : undefined}
                    onKeyDown={isAiVideo || isVideoProcess || isFaceSwap ? (event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); isVideoProcess ? openEraseDetail(task) : viewResult(task.id); } } : undefined}
                    className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 ${isAiVideo || isVideoProcess || isFaceSwap ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-200" : ""}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {preview ? <img src={preview} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <PreviewIcon className="h-6 w-6 text-slate-300" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-xs font-bold leading-5 text-slate-800">{task.name}</p><span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span></div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400"><span>{CATEGORY_META[category].label}{stageLabel && <> · <b className="font-medium text-slate-500">{stageLabel}</b></>}</span><span className="font-mono">{task.createdAt.slice(11)}</span></div>
                        <div className="mt-1.5 text-[10px] text-slate-500">消耗积分 <span className="font-mono font-bold text-amber-600">-{task.creditsCost.toFixed(2)}</span>{(task.refundedCredits || 0) > 0 && <span className="ml-2 text-emerald-600">已退回 {task.refundedCredits?.toFixed(2)}</span>}</div>
                      </div>
                    </div>

                    {(task.status === "queue" || task.status === "generating") && (
                      <div className="mt-3 rounded-md bg-slate-50 p-2.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500"><span className="flex items-center gap-1">{task.status === "queue" ? <Clock3 className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}{task.status === "queue" ? (isVideoProcess ? "等待处理资源" : "等待计算资源") : isFaceSwap ? (task.faceSwap?.phase === "analyzing" ? "正在分析视频人脸" : "正在处理视频换脸") : category === "enhance" ? "正在增强视频画质" : category === "subtitle" ? "正在擦除字幕" : category === "watermark" ? "正在去除水印" : `预计约 ${estimatedMinutes} 分钟完成`}</span><span className="font-mono font-bold">{task.progress}%</span></div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-slate-200"><div className={`h-full rounded ${task.status === "queue" ? "bg-slate-400" : "bg-blue-600"}`} style={{ width: `${Math.max(task.progress, 3)}%` }} /></div>
                      </div>
                    )}
                    {task.status === "failed" && <p className="mt-2 flex items-start gap-1.5 rounded bg-rose-50 p-2 text-[10px] leading-4 text-rose-700"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />{task.failureReason || "生成过程异常，任务已停止。"}</p>}
                    {isFaceSwap && <p className="mt-2 text-[10px] text-slate-500">已生成 {task.faceSwap?.versions.length} 个版本</p>}
                    {task.status === "cancelled" && <p className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 p-2 text-[10px] leading-4 text-amber-700"><Ban className="mt-0.5 h-3 w-3 shrink-0" />{isFaceSwap ? "本次排队取消，40积分已退回，历史版本保留。" : task.refundedCredits === task.creditsCost ? "排队阶段取消，积分已全额退回。" : "生成阶段取消，已发生的计算消耗不退回。"}</p>}

                    <div className="mt-2.5 flex justify-end gap-1.5 border-t border-slate-100 pt-2.5">
                      {isFaceSwap && <button onClick={(event) => { event.stopPropagation(); viewResult(task.id); }} className="flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700"><Eye className="h-3 w-3" />查看任务</button>}
                      {canCancel && <button onClick={(event) => { event.stopPropagation(); cancelTask(task.id); }} className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><X className="h-3 w-3" />取消任务</button>}
                      {isRemake && <button onClick={() => viewResult(task.id)} className="flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700"><Eye className="h-3 w-3" />查看任务</button>}
                      {isAgent && <button onClick={() => viewResult(task.id)} className="flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700"><Eye className="h-3 w-3" />{canRestart ? "继续创作" : "进入会话"}</button>}
                      {isAiVideo && <button onClick={(event) => { event.stopPropagation(); viewResult(task.id); }} className="flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700"><Eye className="h-3 w-3" />{task.status === "failed" || task.status === "cancelled" ? "重新编辑" : "查看任务"}</button>}
                      {isVideoProcess && <button onClick={(event) => { event.stopPropagation(); openEraseDetail(task); }} className="flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700"><Eye className="h-3 w-3" />查看结果</button>}
                      {!isRemake && !isAgent && !isAiVideo && !isVideoProcess && canRestart && <button onClick={() => restartTask(task.id)} className="flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700"><RotateCcw className="h-3 w-3" />重新生成</button>}
                      {!isFaceSwap && !isRemake && !isAgent && !isAiVideo && !isVideoProcess && task.status === "completed" && <><button onClick={() => viewResult(task.id)} className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Eye className="h-3 w-3" />查看结果</button><button className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Download className="h-3 w-3" />下载</button></>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-[11px] text-slate-500">
        当前共 {tasks.length} 条任务，全部历史任务长期保留
      </footer>
    </OverlayPortal>
  );
}
