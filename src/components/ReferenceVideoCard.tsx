import React, { useEffect, useRef, useState } from "react";
import { Copy, Download, Flame, LoaderCircle, Pause, Play, Send, Share2, Tag, User, Volume2, VolumeX } from "lucide-react";
import type { FinishedVideo } from "../data/finishedVideos";
import { downloadHistoryMedia } from "../lib/operationHistory";
import { useResourceEdits } from "../lib/useResourceEdits";
import { useTaggedResources, useResourceTagState } from "../lib/useResourceTags";
import { useViralVideoRule } from "../lib/useViralVideoRule";
import { isViralVideo } from "../lib/viralVideoRule";
import { ResourceStatusBadge } from "./ResourceConfigControls";
import ResourceTagModal from "./ResourceTagModal";
import VideoDetail from "./FinishedVideoDetailModal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import OverlayPortal from "./overlays/OverlayPortal";
import "./ReferenceVideoCard.css";

type Menu = "download" | "tag" | "share";

export default function ReferenceVideoCard({ video: source, scope, usageDuration, onUnlink }: {
  video: FinishedVideo; scope: "finished" | "materials"; usageDuration?: string; onUnlink?: () => void;
}) {
  const { edits, saveEdits } = useResourceEdits<FinishedVideo>(scope);
  const [video] = useTaggedResources(scope, [{ ...source, ...edits[source.id] }]);
  const [publicTags, setPublicTags] = useResourceTagState(scope, video, "public");
  const [personalTags, setPersonalTags] = useResourceTagState(scope, video, "personal");
  const { rule, month } = useViralVideoRule();
  const viral = scope === "finished" && isViralVideo(video, rule, month);
  const [hovered, setHovered] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [tagModal, setTagModal] = useState<"public" | "personal" | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mediaFailed, setMediaFailed] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const menuAnchor = useRef<HTMLButtonElement>(null);
  const preview = (hovered || !!menu) && !onUnlink && !tagModal && !detailOpen;
  const name = scope === "finished" ? "成片" : "素材";
  const stats = scope === "finished"
    ? [[Download, "下载次数", video.downloads || 0], [Send, "推送次数", video.pushCount || 0], [Copy, "被引用次数", video.referenceCount || 0]] as const
    : [[Download, "下载次数", video.downloads ?? 0], [Copy, "被引用次数", video.referenceCount ?? video.secondaryCount ?? 0]] as const;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (preview) return;
    setMuted(true);
    setPaused(false);
    setProgress(0);
    setMediaFailed(false);
  }, [preview]);

  async function download(suffix: string) {
    setMenu(null);
    if (!video.videoUrl) { setToast("视频文件暂不可用"); return; }
    setDownloading(true);
    try {
      await downloadHistoryMedia(video.videoUrl, `${video.title.replace(/\.mp4$/i, "")}_${suffix}.mp4`, name);
      saveEdits({ [video.id]: { downloads: (video.downloads || 0) + 1 } });
      setToast("已开始下载");
    } catch { setToast("下载失败，请稍后重试"); }
    finally { setDownloading(false); }
  }

  async function share(mobile: boolean) {
    setMenu(null);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/video/${mobile ? "m" : "pc"}/${video.id}`);
      setToast("预览链接已复制");
    } catch { setToast("复制失败，请检查浏览器剪贴板权限"); }
  }

  const openDetail = () => { setMenu(null); setHovered(false); setDetailOpen(true); };
  const badge = viral && <span role="img" aria-label="爆款视频" title="爆款视频" className="flex h-5 w-5 items-center justify-center rounded bg-white text-orange-600 shadow-sm"><Flame size={14} fill="currentColor" /></span>;
  const iconButton = "h-6 w-6 shrink-0 flex items-center justify-center rounded bg-black/60 text-white hover:bg-purple-600 border border-white/20";

  return <>
    <article data-testid="reference-video-card" data-reference-id={video.id} data-resource-scope={scope}
      className="reference-video-card flex flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-shadow"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {usageDuration !== undefined && <div data-testid="reference-usage-duration" className="flex h-5 shrink-0 items-center justify-center bg-purple-50 px-1 font-semibold text-purple-700">使用时长 {usageDuration}</div>}
      <div className="relative flex flex-1 flex-col">
        <button type="button" aria-label={`查看${name}：${video.title}`} onClick={openDetail} className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
          <div className="reference-video-cover relative w-full overflow-hidden bg-slate-900">
            <img src={video.coverUrl} alt={video.title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            <span className="absolute left-0 top-0 rounded-br-md bg-[#00aed6] px-1.5 py-0.5 font-bold text-white">{name}</span>
            <ResourceStatusBadge scope={scope} status={video.status} className="absolute right-0 top-0 max-w-[65%] truncate rounded-bl-md px-1.5 py-0.5 text-[10px] font-bold" />
            <span className="absolute left-1 top-6 max-w-[calc(100%-8px)] truncate rounded bg-black/50 px-1 font-mono text-white">ID: {video.numericId || video.id}</span>
            <div data-testid="reference-video-stats" className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/80 to-transparent px-1 py-1.5 text-white ${viral ? "pr-7" : ""}`}>
              {stats.map(([Icon, label, count]) => <span key={label} title={label} aria-label={`${label} ${count}`} className="flex min-w-0 items-center gap-0.5 font-mono"><Icon size={11} className="shrink-0" />{count}</span>)}
            </div>
            {badge && <div className="absolute bottom-1 right-1">{badge}</div>}
          </div>
          <div className="space-y-0.5 px-2 py-1">
            <h4 title={video.title} className="truncate font-normal leading-[14px] text-slate-800">{video.title}</h4>
            <p className="truncate font-mono leading-[14px] text-purple-600" title={`今日消耗 / 总消耗：${video.todayCost || 0} / ${video.cost || 0}`}>￥ {video.todayCost || 0} / {video.cost || 0}</p>
            <p className="truncate leading-[14px] text-slate-400" title={video.typeLabel || video.category}>{video.typeLabel || video.category || "未分类"}</p>
          </div>
          <div className="flex h-5 items-center justify-between gap-1 border-t border-slate-100 bg-slate-50/40 px-2">
            <span className="flex min-w-0 items-center gap-1 text-slate-700"><span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white"><User size={10} /></span><span className="truncate" title={video.author}>{video.author}</span></span>
            <span data-testid="reference-upload-date" className="shrink-0 font-mono text-slate-400">{video.relativeTime || video.createdAt.split(" ")[0]}</span>
          </div>
        </button>
        {onUnlink && <button type="button" onClick={onUnlink} className="absolute right-1 top-12 rounded bg-purple-600 px-1.5 py-1 text-[10px] font-semibold text-white hover:bg-purple-700">取消关联</button>}
        {preview && <div data-testid="reference-video-preview" className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-slate-950">
          <img src={video.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {video.videoUrl && <video ref={player} src={video.videoUrl} poster={video.coverUrl} autoPlay loop muted={muted} playsInline
            onError={() => setMediaFailed(true)} onPlay={() => setPaused(false)} onPause={() => setPaused(true)}
            onTimeUpdate={event => { const media = event.currentTarget; setProgress(media.duration ? media.currentTime / media.duration * 100 : 0); }}
            className="absolute inset-0 h-full w-full object-cover" />}
          <button type="button" aria-label={`查看${name}：${video.title}`} onClick={openDetail} className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500" />
          <div className="pointer-events-none relative z-10 flex items-center justify-between gap-1 p-1">
            <span className="rounded bg-black/60 px-1 py-0.5 font-mono text-white">{video.duration}</span>
            <div className="pointer-events-auto flex gap-0.5">
              {([["download", Download, "下载"], ["tag", Tag, "标签"], ["share", Share2, "分享"]] as const).map(([key, Icon, label]) => <button key={key} type="button" ref={menu === key ? menuAnchor : undefined} title={label} aria-label={label} aria-expanded={menu === key} disabled={key === "download" && downloading}
                className={iconButton} onClick={event => { menuAnchor.current = event.currentTarget; setMenu(menu === key ? null : key); }}>
                {key === "download" && downloading ? <LoaderCircle size={12} className="animate-spin" /> : <Icon size={12} />}
              </button>)}
            </div>
          </div>
          {(mediaFailed || !video.videoUrl) && <span className="pointer-events-none relative self-center rounded bg-black/60 px-2 py-1 text-white">暂无法预览</span>}
          <div className="pointer-events-none relative z-10 space-y-1.5 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-4 text-white">
            {badge && <div className="flex justify-end">{badge}</div>}
            <div className="pointer-events-auto flex items-center justify-between">
              <button type="button" aria-label={paused ? "播放" : "暂停"} title={paused ? "播放" : "暂停"} className="p-1" disabled={!video.videoUrl || mediaFailed} onClick={() => {
                if (player.current?.paused) player.current.play().catch(() => setToast("播放失败，请重试")); else player.current?.pause();
              }}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
              <button type="button" aria-label={muted ? "开启声音" : "关闭声音"} title={muted ? "开启声音" : "关闭声音"} className="p-1" onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
            </div>
            <div role="progressbar" aria-label="播放进度" aria-valuenow={Math.round(progress)} className="h-0.5 overflow-hidden rounded bg-white/30"><div className="h-full bg-white" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>}
      </div>
    </article>
    {menu && <AnchoredPopover anchorRef={menuAnchor} onClose={() => setMenu(null)} align="end" width={180} gap={4} className="rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
      <div role="menu" aria-label={`${name}${menu === "download" ? "下载" : menu === "tag" ? "标签" : "分享"}`} className="text-xs text-slate-700">
        {(menu === "download" ? ["下载原片", "下载转码视频", "下载预览视频 (带水印)"] : menu === "tag" ? ["添加公共标签", "添加个人标签"] : ["复制PC端链接", "复制移动端链接"]).map((label, index) => <button key={label} type="button" role="menuitem" className="block w-full rounded px-2 py-2 text-left hover:bg-purple-50 hover:text-purple-700" onClick={() => {
          if (menu === "download") void download(["原片", "转码", "预览水印"][index]);
          else if (menu === "tag") { setTagModal(index === 0 ? "public" : "personal"); setMenu(null); setHovered(false); }
          else void share(index === 1);
        }}>{label}</button>)}
      </div>
    </AnchoredPopover>}
    {tagModal && <ResourceTagModal kind={tagModal} initialTags={tagModal === "public" ? publicTags : personalTags} onClose={() => setTagModal(null)} showToast={setToast}
      onConfirm={tags => { if (tagModal === "public") setPublicTags(tags); else setPersonalTags(tags); setTagModal(null); setToast("标签已更新"); }} />}
    {detailOpen && <OverlayPortal role="dialog" aria-modal="true" aria-label="引用视频详情" className="fixed inset-0 bg-slate-50">
      <VideoDetail video={video} resourceScope={scope} isMaterialMode={scope === "materials"} onClose={() => setDetailOpen(false)} backLabel="返回引用列表" onUpdate={patch => saveEdits({ [video.id]: patch })} />
    </OverlayPortal>}
    {toast && <OverlayPortal layer="toast" role="status" className="fixed right-6 top-6 max-w-[calc(100vw-48px)] rounded-lg bg-slate-900 px-4 py-3 text-xs text-white shadow-xl">{toast}</OverlayPortal>}
  </>;
}
