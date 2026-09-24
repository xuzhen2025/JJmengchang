import React, { useEffect, useMemo, useRef, useState } from "react";
import { recordDownload } from "../lib/operationHistory";
import {
  ArrowLeft,
  ChevronDown,
  Eraser,
  Image as ImageIcon,
  Layers,
  Plus,
  Scissors,
  Send,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { Asset, QuickCreationTaskSnapshot, Task } from "../types";
import type { SourceVideo } from "./VideoRemakeView";
import ViralInspirationGallery from "./ViralInspirationGallery";
import OverlayPortal from "./overlays/OverlayPortal";
import GenerationResultCard, { GenerationResultFile } from "./GenerationResultCard";
import QuickCreationOutputSettings from "./QuickCreationOutputSettings";
import QuickCreationModelPopover, {
  QUICK_CREATION_MODEL_OPTIONS,
} from "./QuickCreationModelPopover";
import QuickCreationMediaPicker, {
  QuickCreationMedia,
} from "./QuickCreationMediaPicker";

type Media = QuickCreationMedia;
type MediaTarget = "general" | "video";
type MediaPicker = {
  target: MediaTarget;
  source: "local" | "library";
  allowed: "image" | "video" | "both";
  maxImages: number;
};

interface QuickCreationViewProps {
  uploadedVideos: Asset[];
  onRemake: (source: SourceVideo) => void;
  assets: Asset[];
  tasks: Task[];
  activeTaskId?: string | null;
  setActiveScreen: (
    screen:
      "watermark" | "subtitle" | "enhance" | "face_swap" | "quick_creation",
  ) => void;
  onAddTask: (
    taskType: Task["type"],
    name: string,
    inputFiles: string[],
    creditsCost: number,
    source?: "agent" | "tool",
    snapshot?: QuickCreationTaskSnapshot,
  ) => string | void;
  onUploadToLibrary: (
    type: "图片" | "成片",
    files: Array<{ name: string; type: string; url: string }>,
  ) => void;
}

const IMAGE_FALLBACKS = [
  "./assets/prototype/luxury-skincare-set.jpg",
  "./assets/prototype/skincare-product.jpg",
  "./assets/prototype/luxury-skincare-set.jpg",
  "./assets/prototype/skincare-product.jpg",
];
const VIDEO_FALLBACK =
  "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4";

const MODEL_OPTIONS = QUICK_CREATION_MODEL_OPTIONS;
type QuickCreationModel = (typeof MODEL_OPTIONS)[number]["name"];

function getQuickCreationOutputs(task: Task): GenerationResultFile[] {
  const snapshot = task.quickCreationSnapshot!;
  const urls = task.outputFiles?.length
    ? task.outputFiles
    : snapshot.mode === "video"
      ? [VIDEO_FALLBACK]
      : IMAGE_FALLBACKS.slice(0, snapshot.outputLabels?.length || snapshot.imageCount);
  return urls.map((url, index) => ({
    id: `${task.id}-output-${index + 1}`,
    name: `${task.name}-${snapshot.outputLabels?.[index] || index + 1}.${snapshot.mode === "video" ? "mp4" : "png"}`,
    url,
    coverUrl: snapshot.mode === "image" ? url : snapshot.referenceImages[0] || IMAGE_FALLBACKS[0],
    metadata: snapshot.mode === "video" ? `00:${String(snapshot.videoLength).padStart(2, "0")}` : snapshot.imageQuality,
    secondaryMetadata: snapshot.mode === "video"
      ? `${(snapshot.videoLength * 1.02 + 0.8 + index * 0.33).toFixed(2)}MB`
      : snapshot.imageAspectRatio,
  }));
}

function ReferenceMediaStack({
  items,
  onAdd,
  onRemove,
  layout = "stack",
}: {
  items: Media[];
  onAdd: () => void;
  onRemove: (url: string) => void;
  layout?: "stack" | "grid";
}) {
  const rotations = [
    "-rotate-6",
    "rotate-3",
    "-rotate-2",
    "rotate-6",
    "-rotate-3",
    "rotate-2",
    "-rotate-6",
  ];
  return (
    <div className={layout === "grid" ? "grid grid-cols-4 gap-2" : "relative flex h-24 min-w-0 max-w-full items-end overflow-visible"}>
      {items.map((media, index) => (
        <div
          key={`${media.url}-${index}`}
          className={layout === "grid" ? "group relative aspect-square min-w-0" : `group relative h-20 w-16 shrink-0 overflow-visible ${index > 0 ? "-ml-12" : ""}`}
          style={layout === "stack" ? { zIndex: items.length - index } : undefined}
        >
          <div
            className={layout === "grid" ? "h-full w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100" : `relative h-full w-full overflow-hidden rounded-md border-2 border-white bg-slate-100 shadow-md transition-transform group-hover:rotate-0 ${rotations[index % rotations.length]}`}
          >
            {media.type === "video" ? (
              <video
                src={media.url}
                className="h-full w-full object-cover"
                muted
              />
            ) : (
              <img
                src={media.url}
                className="h-full w-full object-cover"
                alt={media.name}
              />
            )}
          </div>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 max-w-48 -translate-x-1/2 truncate rounded-lg bg-slate-800 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {media.name}
          </span>
          <button
            type="button"
            onClick={() => onRemove(media.url)}
            title="删除参考内容"
            className={`absolute z-10 flex h-5 w-5 items-center justify-center bg-slate-700 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 ${layout === "grid" ? "right-1 top-1 rounded" : "-right-2 -top-2 rounded-full"}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        title="添加参考内容"
        className={
          layout === "grid"
            ? "flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-purple-400 hover:text-purple-600"
            : items.length
            ? "relative z-20 -ml-5 mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg transition hover:bg-purple-600"
            : "relative ml-1 flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600"
        }
      >
        <Plus className="h-5 w-5" />
        {(!items.length || layout === "grid") && (
          <span className="mt-1 text-[10px] font-medium">参考内容</span>
        )}
      </button>
    </div>
  );
}

export default function QuickCreationView({
  uploadedVideos,
  onRemake,
  assets,
  tasks,
  activeTaskId,
  setActiveScreen,
  onAddTask,
  onUploadToLibrary,
}: QuickCreationViewProps) {
  const [mode, setMode] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<Media[]>([]);
  const [referenceVideo, setReferenceVideo] = useState<Media | null>(null);
  const [imageAspectRatio, setImageAspectRatio] =
    useState<QuickCreationTaskSnapshot["imageAspectRatio"]>("3:4");
  const [imageQuality, setImageQuality] =
    useState<QuickCreationTaskSnapshot["imageQuality"]>("2K");
  const [imageCount, setImageCount] = useState(1);
  const [videoAspectRatio, setVideoAspectRatio] =
    useState<QuickCreationTaskSnapshot["videoAspectRatio"]>("9:16");
  const [videoLength, setVideoLength] = useState(8);
  const [model, setModel] = useState<QuickCreationModel>(MODEL_OPTIONS[0].name);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    type: "image" | "video";
    title: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [workspaceOpen, setWorkspaceOpen] = useState(Boolean(activeTaskId));
  const [mediaPicker, setMediaPicker] = useState<MediaPicker | null>(null);
  const activeRecordRef = useRef<HTMLElement>(null);
  const controlsBodyRef = useRef<HTMLDivElement>(null);
  const recordsListRef = useRef<HTMLDivElement>(null);
  const outputSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const modelButtonRef = useRef<HTMLButtonElement>(null);

  const quickTasks = useMemo(
    () =>
      [...tasks]
        .filter(
          (task) =>
            task.category === "quick_creation" && task.quickCreationSnapshot,
        )
        .sort((left, right) => {
          const leftTime = Date.parse(left.createdAt.replace(" ", "T"));
          const rightTime = Date.parse(right.createdAt.replace(" ", "T"));
          return leftTime - rightTime || left.id.localeCompare(right.id);
        }),
    [tasks],
  );
  const selectedModel =
    MODEL_OPTIONS.find((item) => item.name === model) || MODEL_OPTIONS[0];
  const currentCost =
    mode === "image"
      ? selectedModel.imageCost * imageCount
      : selectedModel.videoCost;
  const currentMaxSeconds = selectedModel.maxSeconds;

  useEffect(() => {
    if (activeTaskId) setWorkspaceOpen(true);
    if (activeTaskId)
      window.setTimeout(
        () =>
          activeRecordRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        80,
      );
  }, [activeTaskId]);

  useEffect(() => {
    if (!workspaceOpen || quickTasks.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      recordsListRef.current?.scrollTo({
        top: recordsListRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [quickTasks.length, quickTasks[quickTasks.length - 1]?.status, workspaceOpen]);

  const clearFiles = () => {
    setReferenceImages([]);
    setReferenceVideo(null);
  };

  const switchMode = (nextMode: "image" | "video") => {
    setSettingsOpen(false);
    setModelOpen(false);
    setMode(nextMode);
    clearFiles();
    setError("");
  };

  const openMediaPicker = (
    target: MediaTarget,
    source: "local" | "library",
  ) => {
    let allowed: MediaPicker["allowed"] =
      target === "video"
        ? "video"
        : target === "general" && mode === "video"
          ? "both"
          : "image";
    const maxImages = target === "general" ? 7 - referenceImages.length : 1;
    if (maxImages <= 0) {
      if (allowed === "both") allowed = "video";
      else {
        setError("最多添加7张参考图，请删除后再添加。");
        return;
      }
    }
    setError("");
    setModelOpen(false);
    setSettingsOpen(false);
    setMediaPicker({ target, source, allowed, maxImages });
  };

  const confirmMedia = (items: Media[]) => {
    if (!mediaPicker || !items.length) return;
    const { target } = mediaPicker;
    if (target === "general") {
      setReferenceImages((current) =>
        [
          ...current,
          ...items.filter(
            (item) =>
              item.type === "image" &&
              !current.some((existing) => existing.url === item.url),
          ),
        ].slice(0, 7),
      );
      const video = items.find((item) => item.type === "video");
      if (video) setReferenceVideo(video);
    } else if (target === "video") setReferenceVideo(items[0]);
    setError("");
    setMediaPicker(null);
  };

  const validate = () => {
    if (
      !prompt.trim() &&
      referenceImages.length === 0 &&
      !referenceVideo
    )
      return "请输入创作内容或上传参考素材。";
    return "";
  };

  const buildSnapshot = (): QuickCreationTaskSnapshot => {
    return {
      mode,
      preset: null,
      prompt: prompt.trim(),
      referenceImages: referenceImages.map((item) => item.url),
      referenceVideo: referenceVideo?.url,
      imageAspectRatio,
      imageQuality,
      imageCount,
      videoAspectRatio,
      videoLength: Math.min(videoLength, currentMaxSeconds),
      model,
    };
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    const snapshot = buildSnapshot();
    const inputFiles = [
      ...snapshot.referenceImages,
      ...(snapshot.referenceVideo ? [snapshot.referenceVideo] : []),
      ...(snapshot.roleMaterials || []).map((item) => item.url),
    ];
    const title = mode === "image"
        ? "快速创作图片"
        : "快速创作视频";
    const taskId = onAddTask(
      mode === "image" ? "image_gen" : "video_gen",
      title,
      inputFiles,
      currentCost,
      "tool",
      snapshot,
    );
    if (taskId) {
      setWorkspaceOpen(true);
      setSettingsOpen(false);
      setModelOpen(false);
    }
    setError("");
  };

  const hydrate = (task: Task) => {
    const snapshot = task.quickCreationSnapshot;
    if (!snapshot) return;
    setMode(snapshot.mode);
    setPrompt(snapshot.prompt);
    setImageAspectRatio(snapshot.imageAspectRatio);
    setImageQuality(snapshot.imageQuality);
    setImageCount(snapshot.imageCount);
    setVideoAspectRatio(snapshot.videoAspectRatio);
    setVideoLength(snapshot.videoLength);
    setModel(
      MODEL_OPTIONS.find((option) => option.name === snapshot.model)?.name ||
        MODEL_OPTIONS[0].name,
    );
    setReferenceImages(
      snapshot.referenceImages.map((url, index) => ({
        url,
        type: "image",
        name: `参考图${index + 1}`,
      })),
    );
    setReferenceVideo(
      snapshot.referenceVideo
        ? { url: snapshot.referenceVideo, type: "video", name: "参考视频" }
        : null,
    );
    setError("");
    controlsBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generateButton = (
    <button
      type="submit"
      className={`flex h-9 min-h-9 max-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-purple-600 px-4 py-0 text-xs font-bold text-white shadow-sm hover:bg-purple-700 ${workspaceOpen ? "w-full" : "ml-auto w-[132px] rounded-lg"}`}
    >
      <Send className="h-4 w-4" />
      生成 <span className="text-purple-200">{currentCost}积分</span>
    </button>
  );

  return (
    <div
      className={
        workspaceOpen
          ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50"
          : "flex-1 overflow-y-auto bg-slate-50 p-5 md:p-8"
      }
    >
      <div
        className={
          workspaceOpen
            ? "grid min-h-0 flex-1 grid-cols-[390px_minmax(0,1fr)] gap-3 p-4 max-xl:grid-cols-[350px_minmax(0,1fr)] max-lg:auto-rows-min max-lg:grid-cols-1 max-lg:overflow-y-auto"
            : "mx-auto max-w-6xl space-y-6 pb-12"
        }
      >
        {!workspaceOpen && (
          <header>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">快速创作</h1>
            <p className="mt-1 text-sm text-slate-500">
              选择生成类型，上传参考素材，快速得到适合电商使用的图片或视频。
            </p>
          </header>
        )}

        <section
          aria-label="快速创作操作台"
          data-testid="quick-creation-controls"
          className={
            workspaceOpen
              ? "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm max-lg:min-h-[540px]"
              : "rounded-2xl border border-slate-200 bg-white shadow-sm"
          }
        >
          {workspaceOpen && <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2">
            <button type="button" title="返回快速创作首页" onClick={() => { setWorkspaceOpen(false); setSettingsOpen(false); setModelOpen(false); }} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /></button>
            <h1 className="text-sm font-bold text-slate-800">快速创作</h1>
          </header>}
          <form
            onSubmit={submit}
            className={
              workspaceOpen ? "flex min-h-0 flex-1 flex-col" : "p-5"
            }
          >
            <div ref={controlsBodyRef} className={workspaceOpen ? "order-2 min-h-0 flex-1 overflow-y-auto p-4" : "p-0"}>
              <div className={workspaceOpen ? "space-y-4" : "flex min-h-24 flex-wrap items-start gap-3"}>
                <div className={workspaceOpen ? "" : "contents"}>
                {workspaceOpen && <label className="mb-2 block text-xs font-bold text-slate-700">参考内容</label>}
                <ReferenceMediaStack
                  layout={workspaceOpen ? "grid" : "stack"}
                  items={[
                    ...referenceImages.map((item) => ({ ...item })),
                    ...(referenceVideo ? [referenceVideo] : []),
                  ]}
                  onAdd={() => openMediaPicker("general", "library")}
                  onRemove={(url) => {
                    setReferenceImages((current) =>
                      current.filter((item) => item.url !== url),
                    );
                    if (referenceVideo?.url === url) setReferenceVideo(null);
                  }}
                />
                </div>
                <div className={workspaceOpen ? "" : "contents"}>
                {workspaceOpen && <label htmlFor="quick-creation-prompt" className="mb-2 block text-xs font-bold text-slate-700">提示词</label>}
                <textarea
                  id="quick-creation-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="描述你想生成的内容，例如：制作一张适合电商首页的轻薄羽绒服商品图"
                  className={workspaceOpen ? "h-40 w-full resize-none rounded-md border border-slate-200 p-3 text-xs leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400" : "min-h-24 min-w-[240px] flex-1 resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400"}
                />
                </div>
              </div>
            </div>

            <div className={workspaceOpen ? "order-1 grid shrink-0 grid-cols-2 gap-2 border-b border-slate-200 p-3" : "mt-4 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap pb-1"}>
              <div className={`flex h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-white p-1 ${workspaceOpen ? "order-1 col-span-2" : ""}`}>
                {(["image", "video"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={mode === item}
                    onClick={() => switchMode(item)}
                    className={`flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${workspaceOpen ? "flex-1" : ""} ${mode === item ? "bg-purple-50 text-purple-700" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    <span>
                      {item === "image" ? (
                        <ImageIcon className="h-3.5 w-3.5" />
                      ) : (
                        <Video className="h-3.5 w-3.5" />
                      )}
                    </span>
                    {item === "image" ? "生成图片" : "生成视频"}
                  </button>
                ))}
              </div>
              <button
                ref={outputSettingsButtonRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={settingsOpen}
                onClick={() => {
                  setModelOpen(false);
                  setSettingsOpen((open) => !open);
                }}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${workspaceOpen ? "order-3 justify-between" : ""} ${settingsOpen ? "border-purple-300 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-600"}`}
              >
                输出参数
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                ref={modelButtonRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={modelOpen}
                onClick={() => {
                  setSettingsOpen(false);
                  setModelOpen((open) => !open);
                }}
                className={`flex h-9 min-w-0 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${workspaceOpen ? "order-2" : ""} ${modelOpen ? "border-purple-300 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-600"}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className={workspaceOpen ? "min-w-0 flex-1 truncate" : ""}>{model}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
              {!workspaceOpen && generateButton}
            </div>

            {modelOpen && (
              <QuickCreationModelPopover
                anchorRef={modelButtonRef}
                selectedModel={model}
                onClose={() => setModelOpen(false)}
                onSelect={(option) => {
                  setModel(option.name);
                  setModelOpen(false);
                  setVideoLength((current) =>
                    Math.min(current, option.maxSeconds),
                  );
                }}
              />
            )}
            {workspaceOpen && <div className="order-3 shrink-0 border-t border-slate-200 bg-white p-4">
              {error && <p role="alert" className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
              {generateButton}
            </div>}
            {!workspaceOpen && error && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </p>
            )}
          </form>
        </section>

        <section
          aria-label="生成记录"
          data-testid="quick-creation-records"
          className={
            workspaceOpen ? "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm max-lg:h-[640px]" : "hidden"
          }
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-purple-300"><Sparkles className="h-5 w-5" /></span>
            <div><h2 className="text-sm font-bold text-slate-900">生成记录</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              共 {quickTasks.length} 条
            </p></div>
          </div>
          <div
            ref={recordsListRef}
            className="min-h-0 flex-1 overflow-y-auto px-5 pb-8"
          >
            {quickTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-400">
                提交后，生成过程和结果会显示在这里
              </div>
            ) : (
              quickTasks.map((task) => {
                const snapshot = task.quickCreationSnapshot!;
                return (
                  <GenerationResultCard
                    key={task.id}
                    task={task}
                    mediaType={snapshot.mode}
                    outputs={getQuickCreationOutputs(task)}
                    selected={activeTaskId === task.id}
                    recordRef={task.id === activeTaskId ? activeRecordRef : undefined}
                    compact
                    onPreview={(output) => setPreview({ url: output.url, type: snapshot.mode, title: output.name })}
                    onDownload={(output) => {
                      const anchor = document.createElement("a");
                      anchor.href = output.url;
                      anchor.target = "_blank";
                      anchor.rel = "noreferrer";
                      anchor.download = output.name;
                      recordDownload(output.name, snapshot.mode === "video" ? "生成视频" : "生成图片");
                      anchor.click();
                    }}
                    onUpload={(outputs) => onUploadToLibrary(
                      snapshot.mode === "video" ? "成片" : "图片",
                      outputs.map((output) => ({
                        name: output.name,
                        type: snapshot.mode === "video" ? "video/mp4" : "image/png",
                        url: output.url,
                      })),
                    )}
                    onReEdit={() => hydrate(task)}
                  />
                );
              })
            )}
          </div>
        </section>

        <section className={workspaceOpen ? "hidden" : "space-y-6"}>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-slate-400">
              电商核心创意工具组
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "视频去水印",
                  description: "智能擦除视频水印与遮挡元素",
                  action: "立即擦除",
                  icon: Eraser,
                  screen: "watermark" as const,
                  tone: "pink",
                },
                {
                  label: "字幕擦除",
                  description: "一键去除视频字幕与画面文字",
                  action: "立即清除",
                  icon: Scissors,
                  screen: "subtitle" as const,
                  tone: "blue",
                },
                {
                  label: "画质增强",
                  description: "提升视频清晰度与画面质感",
                  action: "立即增强",
                  icon: Sparkles,
                  screen: "enhance" as const,
                  tone: "amber",
                },
                {
                  label: "视频换脸",
                  description: "识别人脸分组，为视频替换人像",
                  action: "开始换脸",
                  icon: Layers,
                  screen: "face_swap" as const,
                  tone: "blue",
                },
              ].map((tool) => {
                const Icon = tool.icon;
                const tone =
                  tool.tone === "pink"
                    ? "bg-pink-50 text-pink-600"
                    : tool.tone === "amber"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-blue-50 text-blue-600";
                return (
                  <button
                    type="button"
                    key={tool.label}
                    onClick={() => setActiveScreen(tool.screen)}
                    className="group flex h-44 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                  >
                    <div>
                      <div
                        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {tool.label}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {tool.description}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition group-hover:text-purple-600">
                      {tool.action}
                      <span aria-hidden="true">→</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <ViralInspirationGallery
            uploadedVideos={uploadedVideos}
            onRemake={onRemake}
            onPreview={(video) => setPreview({ url: video.videoUrl, type: "video", title: video.title })}
          />
        </section>
      </div>

      {mediaPicker && (
        <QuickCreationMediaPicker
          {...mediaPicker}
          assets={assets}
          onClose={() => setMediaPicker(null)}
          onConfirm={confirmMedia}
        />
      )}

      {settingsOpen && (
        <QuickCreationOutputSettings
          anchorRef={outputSettingsButtonRef}
          mode={mode}
          value={{
            imageAspectRatio,
            imageQuality,
            imageCount,
            videoAspectRatio,
            videoLength,
          }}
          maxSeconds={currentMaxSeconds}
          onClose={() => setSettingsOpen(false)}
          onChange={(settings) => {
            setImageAspectRatio(settings.imageAspectRatio);
            setImageQuality(settings.imageQuality);
            setImageCount(settings.imageCount);
            setVideoAspectRatio(settings.videoAspectRatio);
            setVideoLength(settings.videoLength);
          }}
        />
      )}

      {preview && (
        <OverlayPortal
          layer="modal"
          className="fixed inset-0 flex items-center justify-center bg-slate-950/70 p-4"
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                {preview.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreview(null)}
                title="关闭预览"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {preview.type === "video" ? (
              <video
                src={preview.url}
                controls
                autoPlay
                className="max-h-[70vh] w-full rounded-xl bg-black"
              />
            ) : (
              <img
                src={preview.url}
                alt={preview.title}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            )}
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
