import React, { useEffect, useRef, useState } from "react";
import { FileVideo2, Loader2, Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { WatermarkVideo } from "../types";
import type { FaceSwapVersion } from "../lib/videoFaceSwap";

export const faceTime = (value: number) => {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
};

interface Props {
  source: WatermarkVideo;
  version?: FaceSwapVersion;
  analysis?: { label: string; progress: number };
  pending?: { label: string; progress: number };
  resultHeader: React.ReactNode;
  resultDetails?: React.ReactNode;
  resultPanelRef?: React.Ref<HTMLElement>;
}

export default function FaceSwapComparePlayer({ source, version, analysis, pending, resultHeader, resultDetails, resultPanelRef }: Props) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLVideoElement>(null);
  const sourceRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const pause = () => { resultRef.current?.pause(); sourceRef.current?.pause(); setPlaying(false); };
  const play = async () => {
    const master = resultRef.current || sourceRef.current;
    if (!master || analysis) return;
    if (master.ended) { master.currentTime = 0; setTime(0); }
    if (sourceRef.current && sourceRef.current.readyState > 0) sourceRef.current.currentTime = master.currentTime;
    try {
      await Promise.all([sourceRef.current?.play(), resultRef.current?.play()]);
      setPlaying(true); setError("");
    } catch { pause(); setError("视频暂时无法播放，请稍后重试。"); }
  };
  const seek = (position: number) => {
    setTime(position);
    if (resultRef.current && resultRef.current.readyState > 0) resultRef.current.currentTime = position;
    if (sourceRef.current && sourceRef.current.readyState > 0) sourceRef.current.currentTime = position;
  };
  const updateTime = () => {
    const master = resultRef.current || sourceRef.current;
    const original = sourceRef.current;
    if (!master) return;
    setTime(master.currentTime);
    if (original && original.readyState > 0 && Math.abs(original.currentTime - master.currentTime) > 0.15) original.currentTime = master.currentTime;
  };
  useEffect(() => { pause(); seek(0); setError(""); }, [source.url, version?.id]);
  useEffect(() => { if (analysis) pause(); }, [Boolean(analysis)]);

  return <div ref={rootRef} className="flex h-full min-h-0 min-w-0 flex-col bg-white" data-testid="face-compare-player">
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
      <section className="flex min-h-0 min-w-0 flex-col" data-testid="face-source-panel">
        <div className="mb-2 flex h-9 shrink-0 items-center justify-between"><h3 className="text-sm font-semibold text-slate-700">原视频</h3><span className="text-xs text-slate-400">完整视频</span></div>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-black">
          <video ref={sourceRef} src={source.url} muted={Boolean(version) || muted} playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" onClick={() => playing ? pause() : void play()} onEnded={() => { if (!version) pause(); }} onTimeUpdate={() => { if (!version) updateTime(); }} onError={() => { pause(); setError("原视频无法读取。"); }} />
          {analysis && <ProgressOverlay {...analysis} />}
        </div>
      </section>
      <section ref={resultPanelRef} tabIndex={-1} aria-label="换脸结果预览" className="flex min-h-0 min-w-0 flex-col outline-none" data-testid="face-result-panel">
        <div className="mb-2 flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-0.5">{resultHeader}</div>
        <div className={`relative min-h-0 flex-1 overflow-hidden rounded-md ${version ? "bg-black" : "border border-slate-200 bg-slate-50"}`}>
          {version ? <video key={version.id} ref={resultRef} src={version.videoUrl} muted={muted} playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" onClick={() => playing ? pause() : void play()} onEnded={pause} onPause={() => { sourceRef.current?.pause(); setPlaying(false); }} onTimeUpdate={updateTime} onError={() => { pause(); setError("结果视频无法读取。"); }} /> : !pending && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400"><FileVideo2 size={24} strokeWidth={1.4} /><span className="text-xs">暂无换脸结果</span></div>}
          {pending && <ProgressOverlay {...pending} compact={Boolean(version)} />}
        </div>
      </section>
    </div>
    <div className="mt-2 flex h-10 shrink-0 items-center gap-2 border-t border-slate-200 pt-1">
      <button disabled={Boolean(analysis)} title={playing ? "暂停" : "播放"} aria-label={version ? playing ? "暂停对比" : "播放对比" : playing ? "暂停原视频" : "播放原视频"} onClick={() => playing ? pause() : void play()} className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-600 hover:text-violet-600 disabled:opacity-40">{playing ? <Pause size={16} /> : <Play size={16} />}</button>
      <span className="shrink-0 text-[11px] tabular-nums text-slate-500">{faceTime(time)} / {faceTime(source.duration)}</span>
      <input disabled={Boolean(analysis)} aria-label="对比播放进度" type="range" min={0} max={source.duration || 1} step={0.01} value={time} onChange={(event) => seek(Number(event.target.value))} className="min-w-0 flex-1 accent-violet-600" />
      <button title={muted ? "开启声音" : "静音"} onClick={() => setMuted(!muted)} className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-600">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
      <button title="全屏" onClick={() => rootRef.current?.requestFullscreen().catch(() => setError("当前浏览器不支持全屏。"))} className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-600"><Maximize size={16} /></button>
    </div>
    <div className="h-8 shrink-0">{resultDetails}</div>
    {error && <p role="alert" className="mt-1 shrink-0 text-xs text-rose-600">{error}</p>}
  </div>;
}

function ProgressOverlay({ label, progress, compact = false }: { label: string; progress: number; compact?: boolean }) {
  return <div role="status" className={`absolute inset-x-0 bg-black/75 px-4 py-3 text-white ${compact ? "pointer-events-none top-0" : "inset-y-0 flex flex-col justify-center"}`}><div className="flex items-center justify-center gap-2 text-xs"><Loader2 size={16} className="shrink-0 animate-spin" /><span>{label}</span><span className="tabular-nums">{progress}%</span></div><div className="mx-auto mt-2 h-1 w-full max-w-60 overflow-hidden rounded bg-white/20"><div className="h-full bg-violet-500" style={{ width: `${progress}%` }} /></div></div>;
}
