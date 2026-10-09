import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, FolderDown, MousePointerClick, Music2, Play, Puzzle, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";

const PLUGIN = {
  name: "爆款视频采集",
  type: "浏览器插件",
  description: "获取抖音爆款电商视频，并同步至第三方管理",
};

function CollectorIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <div
      data-testid="collector-illustration"
      aria-label="抖音爆款视频同步至第三方管理示意图"
      role="img"
      className={`relative isolate h-full w-full overflow-hidden bg-[#f3f7fb] ${compact ? "min-h-44" : "min-h-64"}`}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: "linear-gradient(#dbe7f3 1px, transparent 1px), linear-gradient(90deg, #dbe7f3 1px, transparent 1px)",
          backgroundSize: compact ? "24px 24px" : "32px 32px",
        }}
      />

      <div className={`absolute left-[8%] top-1/2 z-10 -translate-y-1/2 rounded-lg border border-slate-200 bg-white shadow-xl ${compact ? "w-[46%]" : "w-[45%]"}`}>
        <div className="flex h-6 items-center gap-1.5 border-b border-slate-100 px-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        <div className={compact ? "p-2.5" : "p-4"}>
          <div className={`relative flex items-center justify-center overflow-hidden rounded-md bg-[#20212a] ${compact ? "h-20" : "h-32"}`}>
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-white/10 px-1.5 py-1 text-[8px] font-bold text-white">
              <Music2 className="h-2.5 w-2.5 text-cyan-300" />
              抖音电商
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-purple-600 shadow-lg">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
            <span className="absolute bottom-2 right-2 rounded bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold text-white">爆款</span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="h-1.5 w-4/5 rounded-full bg-slate-200" />
            <div className="h-1.5 w-3/5 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#f3f7fb] bg-purple-600 text-white shadow-lg">
        <ArrowRight className={compact ? "h-7 w-7 p-1.5" : "h-10 w-10 p-2"} />
      </div>

      <div className={`absolute right-[8%] top-1/2 z-10 -translate-y-1/2 rounded-lg border border-emerald-200 bg-white shadow-xl ${compact ? "w-[37%] p-3" : "w-[38%] p-5"}`}>
        <div className={`mx-auto flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ${compact ? "h-12 w-12" : "h-16 w-16"}`}>
          <FolderDown className={compact ? "h-6 w-6" : "h-8 w-8"} />
        </div>
        <p className={`mt-3 text-center font-extrabold text-slate-800 ${compact ? "text-[10px]" : "text-sm"}`}>第三方管理</p>
        <div className={`mt-2 flex items-center justify-center gap-1 font-bold text-emerald-600 ${compact ? "text-[8px]" : "text-[11px]"}`}>
          <CheckCircle2 className={compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
          已同步
        </div>
      </div>
    </div>
  );
}

export default function ToolsView() {
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!detailOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailOpen]);

  return (
    <div data-testid="tools-view" className="min-h-full flex-1 bg-slate-50 p-5 sm:p-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-900">工具</h1>
        </header>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,280px))] gap-4">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            aria-label={`查看${PLUGIN.name}`}
            className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <div className="aspect-[4/3] overflow-hidden border-b border-slate-100">
              <div className="h-full w-full transition duration-300 group-hover:scale-[1.02]">
                <CollectorIllustration compact />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-700 ring-1 ring-inset ring-cyan-200">
                  <Puzzle className="h-3 w-3" />
                  {PLUGIN.type}
                </span>
                <h2 className="text-sm font-extrabold text-slate-900">{PLUGIN.name}</h2>
              </div>
              <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{PLUGIN.description}</p>
            </div>
          </button>
        </div>
      </div>

      {detailOpen && (
        <OverlayPortal
          layer="dialog"
          className="fixed inset-0 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plugin-detail-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              title="关闭"
              aria-label="关闭插件详情"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="bg-[#eef6ff]">
                <CollectorIllustration />
              </div>
              <div className="flex flex-col justify-center px-6 py-8 sm:px-8">
                <span className="mb-3 inline-flex w-fit items-center gap-1 rounded bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-700 ring-1 ring-inset ring-cyan-200">
                  <Puzzle className="h-3 w-3" />
                  {PLUGIN.type}
                </span>
                <h2 id="plugin-detail-title" className="text-2xl font-extrabold text-slate-900">{PLUGIN.name}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">{PLUGIN.description}</p>
                <button
                  type="button"
                  aria-disabled="true"
                  className="mt-8 inline-flex h-11 w-fit cursor-default items-center justify-center gap-2 rounded-md bg-purple-600 px-7 text-sm font-bold text-white shadow-sm"
                >
                  <MousePointerClick className="h-4 w-4" />
                  点击获取
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm sm:px-8">
              <span className="font-bold text-slate-700">插件使用说明</span>
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="inline-flex min-w-0 items-center gap-1 font-semibold text-purple-600 hover:text-purple-700"
              >
                <span className="truncate">查看使用说明</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
