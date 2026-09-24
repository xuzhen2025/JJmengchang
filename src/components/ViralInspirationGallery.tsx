import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy, Flame, Film, Volume2, VolumeX } from "lucide-react";
import { Asset } from "../types";
import { FinishedVideo } from "../data/finishedVideos";
import { useFinishedVideos } from "../lib/useFinishedVideos";
import { useViralVideoRule } from "../lib/useViralVideoRule";
import { getViralVideoHeat, isViralVideo } from "../lib/viralVideoRule";
import { getVideoSecondaryCategories, parseVideoCategory } from "../lib/videoCategories";
import type { SourceVideo } from "./VideoRemakeView";
import AnchoredPopover from "./overlays/AnchoredPopover";

interface ViralInspirationGalleryProps {
  uploadedVideos: Asset[];
  onPreview: (video: FinishedVideo) => void;
  onRemake: (source: SourceVideo) => void;
}

function ViralInspirationCard({ video, heat, active, onEnter, onLeave, onPreview, onRemake }: {
  video: FinishedVideo;
  heat: number | null;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onPreview: () => void;
  onRemake: () => void;
}) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    setMuted(true);
    setPlaybackError(false);
    const player = playerRef.current;
    if (!active || !player) return;
    let disposed = false;
    const play = () => {
      player.muted = true;
      player.play().catch((error) => {
        if (!disposed && error.name !== "AbortError") setPlaybackError(true);
      });
    };
    const visibilityChange = () => {
      player.muted = true;
      setMuted(true);
      if (document.hidden) player.pause();
      else play();
    };
    play();
    document.addEventListener("visibilitychange", visibilityChange);
    return () => {
      disposed = true;
      player.pause();
      player.muted = true;
      document.removeEventListener("visibilitychange", visibilityChange);
    };
  }, [active, video.videoUrl]);

  return (
    <article data-testid="viral-inspiration-card" data-video-id={video.id} onMouseEnter={onEnter} onMouseLeave={onLeave} onFocusCapture={onEnter} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onLeave(); }} className="group relative aspect-[9/16] min-w-0 overflow-hidden rounded-lg bg-slate-900 text-white shadow-sm ring-1 ring-black/5 transition-shadow hover:ring-2 hover:ring-violet-400 focus-within:ring-2 focus-within:ring-violet-400">
      <button type="button" aria-label={`预览 ${video.title}`} onClick={onPreview} className="absolute inset-0 h-full w-full">
        <img src={video.coverUrl} alt={video.title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        {active && <video ref={playerRef} data-testid="viral-hover-video" src={video.videoUrl} poster={video.coverUrl} muted={muted} playsInline loop onError={() => setPlaybackError(true)} className="absolute inset-0 h-full w-full object-cover" />}
      </button>
      {active && <>
        <button type="button" title={muted ? "开启声音" : "关闭声音"} aria-pressed={!muted} onClick={() => {
          const nextMuted = !muted;
          if (playerRef.current) playerRef.current.muted = nextMuted;
          setMuted(nextMuted);
        }} className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded bg-black/55 text-white hover:bg-black/75">
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <span data-testid="viral-hover-duration" className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold">{video.duration}</span>
        {playbackError && <span role="status" className="pointer-events-none absolute inset-x-2 top-12 rounded bg-black/60 px-2 py-1 text-center text-[10px]">视频暂时无法播放</span>}
      </>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2.5 pb-2.5 pt-14">
        <div aria-label="公共标签" title={(video.tags || []).join("、")} className="pointer-events-auto flex max-h-12 flex-wrap gap-1 overflow-y-auto">
          {(video.tags || []).map((tag) => <span key={tag} className="max-w-full truncate rounded bg-white/20 px-1.5 py-0.5 text-[10px] leading-4">{tag}</span>)}
        </div>
        <div className="relative mt-2 h-8">
          <span data-testid="viral-inspiration-heat" className="pointer-events-auto absolute inset-y-0 right-0 flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold tabular-nums">
            <Flame className="h-3.5 w-3.5 shrink-0 text-orange-400" />{heat === null ? "暂无热度" : `热度 ${heat.toLocaleString("zh-CN")}`}
          </span>
          <button type="button" onClick={onRemake} className="pointer-events-none absolute inset-0 flex w-full items-center justify-center gap-1 rounded-md bg-violet-600 px-1 text-[11px] font-semibold text-white opacity-0 transition-opacity hover:bg-violet-700 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
            <Copy className="h-3.5 w-3.5 shrink-0" />一键复刻
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ViralInspirationGallery({ uploadedVideos, onPreview, onRemake }: ViralInspirationGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { videos } = useFinishedVideos(uploadedVideos);
  const { rule, month } = useViralVideoRule();
  const viralVideos = useMemo(() => videos.filter((video) => isViralVideo(video, rule, month)), [videos, rule, month]);
  const categories = useMemo(() => getVideoSecondaryCategories(viralVideos), [viralVideos]);
  const activeCategory = selectedCategory && categories.includes(selectedCategory) ? selectedCategory : null;
  const categoryLabel = activeCategory ?? "全部爆款";

  useEffect(() => {
    if (selectedCategory !== null && !categories.includes(selectedCategory)) setSelectedCategory(null);
  }, [categories, selectedCategory]);

  const items = useMemo(() => viralVideos
    .filter((video) => activeCategory === null || parseVideoCategory(video.category).secondary === activeCategory)
    .map((video) => ({ video, heat: getViralVideoHeat(video, month) }))
    .sort((left, right) => (right.heat ?? -1) - (left.heat ?? -1)
      || right.video.createdAt.localeCompare(left.video.createdAt)
      || left.video.id.localeCompare(right.video.id)), [viralVideos, month, activeCategory]);

  return (
    <section aria-label="电商爆款灵感画廊" data-testid="viral-inspiration-gallery" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-400">电商爆款灵感画廊</h2>
        <button ref={categoryButtonRef} type="button" aria-label={`爆款分类：${categoryLabel}`} title={categoryLabel} aria-expanded={categoryOpen} aria-haspopup="dialog" onClick={() => setCategoryOpen((open) => !open)} className="flex h-9 w-32 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-purple-300 hover:bg-purple-50">
          <span className="min-w-0 truncate">{categoryLabel}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
        </button>
        {categoryOpen && (
          <AnchoredPopover anchorRef={categoryButtonRef} align="end" width={192} maxHeight={320} gap={6} onClose={() => setCategoryOpen(false)} className="rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
            <div role="group" aria-label="爆款分类">
              {[null, ...categories].map((category) => (
                <button key={category === null ? "all" : `category-${category}`} type="button" aria-pressed={activeCategory === category} onClick={() => {
                  setSelectedCategory(category);
                  setHoveredId(null);
                  setCategoryOpen(false);
                  categoryButtonRef.current?.focus({ preventScroll: true });
                }} className={`flex min-h-9 w-full items-center break-words rounded-md px-3 py-2 text-left text-xs transition-colors ${activeCategory === category ? "bg-purple-50 font-semibold text-purple-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                  {category ?? "全部爆款"}
                </button>
              ))}
            </div>
          </AnchoredPopover>
        )}
      </div>
      <div className="border-t border-slate-200 pt-4">
        {items.length > 0 ? (
          <div data-testid="viral-inspiration-grid" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {items.map(({ video, heat }) => (
              <ViralInspirationCard
                key={video.id}
                video={video}
                heat={heat}
                active={hoveredId === video.id}
                onEnter={() => setHoveredId(video.id)}
                onLeave={() => setHoveredId((current) => current === video.id ? null : current)}
                onPreview={() => { setHoveredId(null); onPreview(video); }}
                onRemake={() => { setHoveredId(null); onRemake({ id: video.id, name: video.title, url: video.videoUrl, cover: video.coverUrl, duration: video.duration, size: video.size, section: "成片" }); }}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-slate-400"><Film className="h-8 w-8" /><p>暂无符合当前条件的爆款成片</p></div>
        )}
      </div>
    </section>
  );
}
