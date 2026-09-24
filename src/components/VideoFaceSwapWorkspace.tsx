import React, { useEffect, useMemo, useRef, useState } from "react";
import { operationUser, recordDownload } from "../lib/operationHistory";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Download, FileVideo2, GitMerge, ImagePlus, Loader2, ScanFace, Scissors, Trash2, Undo2, Upload, X } from "lucide-react";
import type { Asset, Task, WatermarkVideo } from "../types";
import { FACE_DEMO_PORTRAITS } from "../data/faceSwapDemo";
import { FACE_PHASE_LABELS, isFaceSwapBusy, mergeFaceGroups, splitFaceGroup, undoFaceGrouping, type FaceSwapSession, type FaceSwapVersion } from "../lib/videoFaceSwap";
import { validateFacePortrait } from "../lib/facePortraitValidation";
import OverlayPortal from "./overlays/OverlayPortal";
import ImageResourcePickerModal, { type ImageResourcePickerItem } from "./ImageResourcePickerModal";
import VideoResourcePickerModal, { type VideoResourcePickerItem } from "./VideoResourcePickerModal";
import UploadFinishedVideoModal, { type VideoPublishDetails } from "./UploadFinishedVideoModal";
import FaceSwapComparePlayer, { faceTime } from "./FaceSwapComparePlayer";

interface Props {
  assets: Asset[];
  task: Task | null;
  credits: number;
  onBack: () => void;
  onCreate: (source: WatermarkVideo) => string;
  onActiveTaskChange: (id: string | null) => void;
  onUpdate: (id: string, update: (session: FaceSwapSession) => FaceSwapSession) => void;
  onSubmit: (id: string) => boolean;
  onCancel: (id: string) => void;
  onPublish: (source: WatermarkVideo, version: FaceSwapVersion, details: VideoPublishDetails) => void;
}

const primary = "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40";
const secondary = "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const iconButton = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-violet-600 disabled:opacity-30";

async function readVideo(item: VideoResourcePickerItem): Promise<WatermarkVideo> {
  if (!item.url || !/\.(mp4|mpeg|mov)$/i.test(item.name)) throw new Error("请选择 MP4、MPEG、MOV 视频。");
  const size = item.sizeBytes === undefined ? Number.parseFloat(item.size) * (/GB/i.test(item.size) ? 1024 : /KB/i.test(item.size) ? 1 / 1024 : 1) : item.sizeBytes / 1024 / 1024;
  if (!Number.isFinite(size) || size >= 1000) throw new Error("单个视频必须小于1000 MB。");
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = item.url;
  try {
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => { clearTimeout(timer); video.onloadedmetadata = null; video.onerror = null; error ? reject(error) : resolve(); };
      const timer = window.setTimeout(() => finish(new Error("视频读取超时，请检查文件或网络后重试。")), 12000);
      video.onloadedmetadata = () => finish();
      video.onerror = () => finish(new Error("视频无法读取，请重新选择可播放的视频。"));
    });
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("无法获取完整视频时长，请重新选择。");
    return { id: item.id, name: item.name, url: item.url, coverUrl: item.cover, size: item.size, duration: video.duration, resolution: `${video.videoWidth}x${video.videoHeight}` };
  } finally { video.removeAttribute("src"); video.load(); }
}

export default function VideoFaceSwapWorkspace({ assets, task, credits, onBack, onCreate, onActiveTaskChange, onUpdate, onSubmit, onCancel, onPublish }: Props) {
  const session = task?.faceSwap;
  const [videoPicker, setVideoPicker] = useState(false);
  const [portraitGroupId, setPortraitGroupId] = useState<string | null>(null);
  const [validatingGroupId, setValidatingGroupId] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<Record<string, string[]>>({});
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [publishVersion, setPublishVersion] = useState<FaceSwapVersion | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const operationId = useRef(0);
  const rolesRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const busy = session ? isFaceSwapBusy(session) : false;
  const selectedVersion = session?.versions.find((version) => version.id === session.selectedVersionId);
  const configuredCount = session?.groups.filter((group) => group.portrait).length || 0;
  const resultView = session?.view === "result";
  const mergeSource = session?.groups.find((group) => group.id === mergeSourceId);
  const mergeTarget = session?.groups.find((group) => group.id === mergeTargetId);
  const locked = busy || reading || Boolean(validatingGroupId);

  const videoItems = useMemo<VideoResourcePickerItem[]>(() => [
    ...[
      { id: "face-demo-video", name: "梦畅_视频换脸演示.mp4", cover: "./assets/face-swap/portrait-a.jpg", url: "./assets/face-swap/demo.mp4", size: "0.37 MB" },
      { id: "face-demo-no-faces", name: "梦畅_无人脸案例.mp4", cover: "./assets/prototype/skincare-product.jpg", url: "./assets/face-swap/no-faces.mp4", size: "0.06 MB" },
      { id: "face-demo-processing-failure", name: "梦畅_处理失败案例.mp4", cover: "./assets/face-swap/portrait-a.jpg", url: "./assets/face-swap/demo.mp4", size: "0.37 MB" },
    ].map((item): VideoResourcePickerItem => ({ ...item, status: "可用", section: "素材", primaryCategory: "原型案例", secondaryCategory: "视频换脸", tags: ["演示"], author: "徐振", duration: "00:15" })),
    ...assets.filter((asset) => asset.type === "video").map((asset): VideoResourcePickerItem => ({ id: asset.id, name: asset.name, cover: asset.coverUrl || "./assets/prototype/beauty-promo-detail.jpg", url: asset.url, status: asset.status || "可用", section: asset.resourceCategory === "成片" ? "成片" : "素材", primaryCategory: asset.category || "未分类", secondaryCategory: asset.publicTags?.[0] || "通用", tags: asset.publicTags || [], author: asset.creator || "徐振", duration: asset.fileInfo?.duration || "--:--", size: asset.size })),
  ], [assets]);
  const imageItems = useMemo<ImageResourcePickerItem[]>(() => [
    ...FACE_DEMO_PORTRAITS.map((image) => ({ ...image, status: "可用", primaryCategory: "人像", secondaryCategory: "原型案例", tags: ["单人人像"], author: "徐振", resolution: "320x400", size: "0.03 MB" })),
    ...assets.filter((asset) => asset.type === "image").map((asset) => ({ id: asset.id, name: asset.name, url: asset.url, status: asset.status || "可用", primaryCategory: asset.category || "未分类", secondaryCategory: "通用", tags: asset.publicTags || [], author: asset.creator || "徐振", resolution: asset.fileInfo?.resolution || "--", size: asset.size })),
  ], [assets]);

  const update = (transform: (current: FaceSwapSession) => FaceSwapSession) => { if (task) onUpdate(task.id, transform); };
  useEffect(() => {
    operationId.current++;
    setExpandedIds([]); setSelectedCrops({}); setError(""); setValidatingGroupId(null);
    return () => { operationId.current++; };
  }, [task?.id]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const chooseVideo = async (items: VideoResourcePickerItem[]) => {
    if (!items[0] || reading) return;
    setVideoPicker(false); setReading(true); setError("");
    const token = ++operationId.current;
    try {
      const source = await readVideo(items[0]);
      if (token !== operationId.current) return;
      const id = onCreate(source);
      onActiveTaskChange(id);
    } catch (reason) { if (token === operationId.current) setError(reason instanceof Error ? reason.message : "视频读取失败。"); }
    finally { if (token === operationId.current) setReading(false); }
  };
  const choosePortrait = async (items: ImageResourcePickerItem[]) => {
    const groupId = portraitGroupId;
    const item = items[0];
    if (!item || !groupId || !task) return;
    const taskId = task.id;
    setPortraitGroupId(null); setValidatingGroupId(groupId); setError("");
    const token = ++operationId.current;
    try {
      const sizeMB = item.sizeBytes === undefined ? Number.parseFloat(item.size) * (/GB/i.test(item.size) ? 1024 : /KB/i.test(item.size) ? 1 / 1024 : 1) : item.sizeBytes / 1024 / 1024;
      const validation = sizeMB >= 30 ? "单张图片需小于30 MB，请重新选择。" : await validateFacePortrait(item.url);
      if (token !== operationId.current) return;
      if (validation) { setError(validation); return; }
      onUpdate(taskId, (current) => isFaceSwapBusy(current) ? current : { ...current, groups: current.groups.map((group) => group.id === groupId ? { ...group, portrait: { id: item.id, name: item.name, url: item.url } } : group) });
      setToast("替换人像已更新");
    } finally { if (token === operationId.current) setValidatingGroupId(null); }
  };
  const submit = () => {
    if (!task || locked) return;
    if (!onSubmit(task.id)) setError(credits < 40 ? "积分不足，本次换脸需要40积分。" : "请至少配置一个有效替换人像后重试。");
    else setError("");
  };
  const download = async () => {
    if (!selectedVersion || downloading) return;
    const version = selectedVersion;
    setDownloading(true); setError("");
    const ownerId = operationUser();
    try {
      const response = await fetch(version.videoUrl);
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = version.name; link.click();
      recordDownload(version.name, "视频换脸", true, ownerId);
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setToast(`版本${version.number}已开始下载`);
    } catch { recordDownload(version.name, "视频换脸", false, ownerId); setError("下载失败，请检查网络后重试。"); }
    finally { setDownloading(false); }
  };

  if (publishVersion && session) {
    return <UploadFinishedVideoModal
      isOpen
      isPage
      lockFiles
      initialFiles={[{ name: publishVersion.name, type: "video", url: publishVersion.videoUrl }]}
      initialTaskCode={task?.id}
      onClose={() => setPublishVersion(null)}
      onPublishSuccess={(message, details) => {
        if (details) onPublish(session.source, publishVersion, details);
        setToast(message);
      }}
    />;
  }

  return <div className="mr-10 flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800" data-testid="face-swap-workspace">
    <header className="grid shrink-0 grid-cols-1 items-center gap-2 border-b border-slate-200 px-3 py-3 md:px-6 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onBack} title="返回快速创作" className={iconButton}><ArrowLeft size={18} /></button>
        <h1 className="shrink-0 text-lg font-semibold">视频换脸</h1>
        {session && <span className={`shrink-0 rounded px-2 py-1 text-xs ${session.phase.includes("failed") ? "bg-rose-50 text-rose-600" : busy ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"}`}>{FACE_PHASE_LABELS[session.phase]}</span>}
      </div>
      {session && <nav aria-label="换脸阶段" className="flex items-center justify-self-center gap-2 whitespace-nowrap text-xs xl:col-start-2 xl:row-start-1">
        <span className="text-slate-400">视频分析</span><ArrowRight size={12} className="text-slate-300" />
        <button disabled={session.phase === "analyzing" || session.phase === "analysis_failed" || busy} onClick={() => { update((current) => ({ ...current, view: "settings" })); rolesRef.current?.focus({ preventScroll: true }); }} className={`px-2 py-1.5 disabled:opacity-40 ${!resultView ? "font-semibold text-violet-700" : "text-slate-500"}`}>角色设定</button><ArrowRight size={12} className="text-slate-300" />
        <button disabled={!session.attempts.length} onClick={() => { update((current) => ({ ...current, view: "result" })); resultRef.current?.focus({ preventScroll: true }); }} className={`px-2 py-1.5 disabled:opacity-40 ${resultView ? "font-semibold text-violet-700" : "text-slate-500"}`}>换脸结果</button>
      </nav>}
    </header>

    {!session ? <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
      <ScanFace size={36} strokeWidth={1.3} className="mb-5 text-violet-600" />
      <h2 className="mb-8 text-xl font-semibold">视频换脸</h2>
      <button disabled={reading} onClick={() => setVideoPicker(true)} className="flex h-52 w-full max-w-xl flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-600 hover:border-violet-400 hover:bg-violet-50/30 disabled:opacity-50">
        {reading ? <Loader2 size={30} className="animate-spin text-violet-500" /> : <FileVideo2 size={32} strokeWidth={1.4} className="text-violet-500" />}
        <span className="font-semibold">{reading ? "正在读取视频" : "选择视频"}</span>
      </button>
      <p className="mt-4 max-w-xl text-center text-xs leading-6 text-slate-400">单次1个视频，支持 MP4、MPEG、MOV，文件小于1000 MB。<br />不限时长，处理完整视频，不自动截取。</p>
      {error && <p role="alert" className="mt-4 max-w-xl text-sm text-rose-600">{error}</p>}
    </div> : <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-testid="face-swap-body">
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-3 md:px-6">
          <div className="min-w-0"><p title={session.source.name} className="truncate text-sm font-semibold">{session.source.name}</p><p className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-400"><span>{faceTime(session.source.duration)}</span><span>{session.source.resolution}</span><span>{session.source.size}</span></p></div>
          <button disabled={locked} onClick={() => setVideoPicker(true)} className={secondary}>{reading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{reading ? "正在读取视频" : "更换视频"}</button>
        </div>
        {error && <p role="alert" className="mx-3 mb-2 shrink-0 rounded border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-600 md:mx-6">{error}</p>}
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3 pb-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:grid-rows-[minmax(0,1fr)] md:gap-6 md:px-6">
          <section ref={rolesRef} tabIndex={-1} aria-label="角色设定" className="flex min-h-0 min-w-0 flex-col outline-none" data-testid="face-roles-panel">
            <div className="mb-2 flex h-9 shrink-0 items-center justify-between gap-2"><h2 className="text-sm font-semibold">角色设定</h2><button disabled={locked || !session.undo.length} title="撤销上一步" onClick={() => { update(undoFaceGrouping); setSelectedCrops({}); setToast("已恢复上一步分组与人像配置"); }} className={secondary}><Undo2 size={14} />撤销上一步</button></div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2" data-testid="face-role-list">
            {session.phase === "analyzing" ? <div className="flex h-full items-center justify-center gap-2 border-y border-slate-100 text-sm text-slate-400"><Loader2 className="animate-spin" size={18} />分析中</div> : session.phase === "analysis_failed" ? <div className="py-5 text-sm text-slate-400"><p className="mb-3">暂无可用角色</p><p role="alert" className="text-xs text-rose-600">{session.error}</p><button className={`${secondary} mt-3`} onClick={() => update((current) => ({ ...current, phase: "analyzing", analysisStartedAt: Date.now(), error: "" }))}>重新分析</button></div> : <div className="space-y-3">
              {session.groups.map((group) => {
                const crops = group.cropIds.map((id) => session.crops.find((crop) => crop.id === id)).filter(Boolean);
                const expanded = expandedIds.includes(group.id);
                const checked = selectedCrops[group.id] || [];
                return <article key={group.id} className="rounded-lg border border-slate-200 bg-white" data-testid="face-group">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
                    <span className="text-sm font-semibold">{group.name}</span>
                    <button disabled={locked || session.groups.length < 2} title="合并去重" onClick={() => { setMergeSourceId(group.id); setMergeTargetId(""); }} className={iconButton}><GitMerge size={16} /></button>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-3 p-4">
                    <button disabled={locked} onClick={() => setExpandedIds((current) => current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id])} className="flex min-w-0 flex-col items-center gap-2" aria-expanded={expanded} aria-label={`展开${group.name}截图`}>
                      <div className="relative h-24 w-full max-w-20">{crops.length > 1 && <div className="absolute inset-0 translate-x-1.5 -translate-y-1 rounded-md border border-slate-200 bg-slate-100" />}<img src={crops[0]?.url} alt={`${group.name}原人脸`} className="relative h-full w-full rounded-md object-cover" /></div>
                      <span className="flex items-center gap-1 text-xs text-slate-500">原人脸 · {crops.length}张{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
                    </button>
                    <ArrowRight size={18} className="text-slate-300" />
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div className="group relative h-24 w-full max-w-20">
                        <button disabled={locked} aria-label={`选择${group.name}替换人像`} onClick={() => setPortraitGroupId(group.id)} className={`flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md border ${group.portrait ? "border-violet-200" : "border-dashed border-slate-300 text-slate-400 hover:border-violet-400"}`}>
                          {validatingGroupId === group.id ? <Loader2 size={20} className="animate-spin text-violet-600" /> : group.portrait ? <img src={group.portrait.url} alt={group.portrait.name} className="h-full w-full object-cover" /> : <><ImagePlus size={22} strokeWidth={1.5} /><span className="text-[11px]">选择人像</span></>}
                        </button>
                        {group.portrait && !locked && <button title="删除替换人像" onClick={() => update((current) => ({ ...current, groups: current.groups.map((item) => item.id === group.id ? { ...item, portrait: null } : item) }))} className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 focus:opacity-100 group-hover:opacity-100"><Trash2 size={12} /></button>}
                      </div>
                      <span className={`text-xs ${group.portrait ? "text-violet-600" : "text-slate-400"}`}>{validatingGroupId === group.id ? "校验人像中" : group.portrait ? "已配置替换人像" : "保持原样"}</span>
                    </div>
                  </div>
                  {expanded && <div className="border-t border-slate-100 px-4 py-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>已选择 {checked.length} 张</span><button disabled={locked || !checked.length || checked.length === crops.length} className={secondary} title={checked.length === crops.length ? "原组至少保留一张截图" : "将选中截图移入新角色分组"} onClick={() => { update((current) => splitFaceGroup(current, group.id, checked, crypto.randomUUID())); setSelectedCrops((current) => ({ ...current, [group.id]: [] })); setToast("所选截图已移入新角色分组"); }}><Scissors size={14} />独立形象</button></div>
                    <div className="flex flex-wrap gap-3">
                      {crops.map((crop) => crop && <label key={crop.id} className="relative w-16 cursor-pointer"><img src={crop.url} alt={`${group.name}截图`} className={`h-20 w-16 rounded-md border-2 object-cover ${checked.includes(crop.id) ? "border-violet-600" : "border-transparent"}`} /><input type="checkbox" aria-label={`选择截图 ${crop.id}`} disabled={locked} checked={checked.includes(crop.id)} onChange={(event) => setSelectedCrops((current) => ({ ...current, [group.id]: event.target.checked ? [...checked, crop.id] : checked.filter((id) => id !== crop.id) }))} className="absolute left-1 top-1 accent-violet-600" /><p className="mt-1 text-center text-[11px] tabular-nums text-slate-400">{faceTime(crop.timestamp)}</p></label>)}
                    </div>
                  </div>}
                </article>;
              })}
            </div>}
            </div>
            <p className="mt-2 shrink-0 text-xs text-slate-400">{session.phase === "analyzing" ? "正在提取人脸截图并分组" : `识别到${session.groups.length}个角色，${session.crops.length}张人脸截图`}</p>
          </section>
          <FaceSwapComparePlayer source={session.source} version={selectedVersion} resultPanelRef={resultRef}
            analysis={session.phase === "analyzing" ? { label: "正在分析视频人脸", progress: task?.progress || 0 } : undefined}
            pending={session.phase === "queue" || session.phase === "processing" ? { label: `${selectedVersion ? "新版本" : ""}${session.phase === "queue" ? "排队中" : "正在处理视频换脸"}`, progress: task?.progress || 0 } : undefined}
            resultHeader={<>
              <div className="flex items-center gap-2"><h2 className="text-sm font-semibold">新视频</h2>{selectedVersion && (session.versions.length === 1 ? <span className="text-xs text-slate-500">版本1</span> : <select aria-label="换脸结果版本" value={selectedVersion.id} onChange={(event) => { const id = event.target.value; update((current) => ({ ...current, selectedVersionId: id })); }} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs">{session.versions.map((version) => <option key={version.id} value={version.id}>版本{version.number}</option>)}</select>)}</div>
              {selectedVersion && <div className="ml-auto flex shrink-0 items-center gap-2">
                <button type="button" title="下载完整视频" aria-label="下载视频" disabled={!selectedVersion || downloading} className={`${secondary} whitespace-nowrap`} onClick={() => void download()}>{downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}下载视频</button>
                <button type="button" disabled={!selectedVersion} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setPublishVersion(selectedVersion || null)}><Upload size={16} />上传资源库</button>
              </div>}
            </>}
            resultDetails={selectedVersion && <div className="flex h-8 shrink-0 items-center gap-2 overflow-hidden border-t border-slate-100 text-[11px] text-slate-500" data-testid="face-version-record"><span className="shrink-0 text-amber-700">原型结果</span><span className="shrink-0">版本{selectedVersion.number} · 替换记录</span><span className="truncate" title={selectedVersion.groups.map((group) => `${group.name}：${group.portrait ? "已替换" : "保持原样"}`).join("；")}>{selectedVersion.groups.map((group) => `${group.name}：${group.portrait ? "已替换" : "保持原样"}`).join("；")}</span></div>}
          />
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-3 md:px-6">
        <div className="min-w-0 text-xs leading-5 text-slate-500"><p>已配置{configuredCount}个角色，{session.groups.length - configuredCount}个保持原样{session.versions.length > 0 && <span className="ml-3 text-slate-400">已生成{session.versions.length}个版本</span>}</p>{session.phase === "cancelled" && <p role="status" className="text-amber-700">本次换脸已取消，40积分已退回。{session.versions.length > 0 && "历史版本不受影响。"}</p>}{session.phase === "failed" && <p role="alert" className="text-rose-600">{session.error}</p>}</div>
        {busy ? session.phase === "queue" ? <button className={secondary} onClick={() => task && onCancel(task.id)}>取消排队</button> : <button disabled className={primary}><Loader2 size={16} className="animate-spin" />{FACE_PHASE_LABELS[session.phase]}</button> : <button disabled={locked || !configuredCount || session.phase === "analysis_failed"} onClick={submit} className={primary}><ScanFace size={16} />{session.versions.length ? "再次换脸" : "开始换脸"}<span className="border-l border-white/30 pl-2 text-xs">40积分</span></button>}
      </footer>
    </>}

    {videoPicker && <VideoResourcePickerModal items={videoItems} initialSelectedIds={[]} initialSection="素材" maxSelections={1} allowLocalUpload onClose={() => setVideoPicker(false)} onConfirm={(items) => void chooseVideo(items)} />}
    {portraitGroupId && <ImageResourcePickerModal items={imageItems} initialSelectedIds={[]} multiple={false} onClose={() => setPortraitGroupId(null)} onConfirm={(items) => void choosePortrait(items)} />}
    {mergeSource && session && <OverlayPortal layer="dialog" className="fixed inset-0 flex items-center justify-center bg-black/40 p-4" onKeyDown={(event) => { if (event.key === "Escape") setMergeSourceId(null); }}>
      <div role="dialog" aria-modal="true" aria-label="合并去重" className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold">合并去重</h2><button autoFocus title="关闭" onClick={() => setMergeSourceId(null)} className={iconButton}><X size={18} /></button></div>
        <div className="min-h-0 overflow-y-auto p-5"><p className="mb-4 text-sm text-slate-500">将{mergeSource.name}合并到</p><div className="space-y-2">{session.groups.filter((group) => group.id !== mergeSource.id).map((group) => <label key={group.id} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${mergeTargetId === group.id ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}><input type="radio" name="face-merge-target" checked={mergeTargetId === group.id} onChange={() => setMergeTargetId(group.id)} className="accent-violet-600" /><img src={session.crops.find((crop) => crop.id === group.cropIds[0])?.url} alt="" className="h-12 w-10 rounded object-cover" /><span className="text-sm">{group.name}</span><span className="ml-auto text-xs text-slate-400">{group.cropIds.length}张截图</span></label>)}</div>
          {mergeTarget && <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-3 text-xs text-slate-500">合并后保留的替换人像</p>{mergeTarget.portrait ? <div className="flex items-center gap-3"><img src={mergeTarget.portrait.url} alt="保留的替换人像" className="h-20 w-16 rounded-md object-cover" /><span className="break-all text-sm text-slate-700">{mergeTarget.portrait.name}</span></div> : <p className="text-sm text-slate-500">未配置，保持原样</p>}</div>}
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-5 py-4"><button className={secondary} onClick={() => setMergeSourceId(null)}>取消</button><button disabled={!mergeTarget} className={primary} onClick={() => { update((current) => mergeFaceGroups(current, mergeSource.id, mergeTargetId)); setMergeSourceId(null); setSelectedCrops({}); setToast("已合并角色并保留目标组人像"); }}>确认合并</button></div>
      </div>
    </OverlayPortal>}
    {toast && <OverlayPortal layer="toast" className="pointer-events-none fixed inset-x-4 top-5 flex justify-center"><div role="status" className="flex max-w-lg items-center gap-2 rounded-md border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-700 shadow-lg"><Check size={16} />{toast}</div></OverlayPortal>}
  </div>;
}
