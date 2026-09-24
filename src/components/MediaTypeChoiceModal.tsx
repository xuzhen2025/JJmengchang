import React from "react";
import { Images, Video, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";

export default function MediaTypeChoiceModal({ title = "选择模特素材类型", onClose, onSelect }: { title?: string; onClose: () => void; onSelect: (allowed: "image" | "video") => void }) {
  return <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h3 className="text-sm font-bold text-slate-800">{title}</h3><button type="button" onClick={onClose} title="关闭" className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
      <div className="grid grid-cols-2 gap-3 p-5">
        <button type="button" onClick={() => onSelect("image")} className="flex h-32 flex-col items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-violet-400 hover:bg-violet-50/40 hover:text-violet-700"><Images className="h-6 w-6" /><span className="mt-3 text-sm font-bold">选择图片</span><span className="mt-1 text-[10px] text-slate-400">图片管理或本地上传</span></button>
        <button type="button" onClick={() => onSelect("video")} className="flex h-32 flex-col items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-violet-400 hover:bg-violet-50/40 hover:text-violet-700"><Video className="h-6 w-6" /><span className="mt-3 text-sm font-bold">选择视频</span><span className="mt-1 text-[10px] text-slate-400">资源库或本地上传</span></button>
      </div>
      <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4"><button type="button" onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">取消</button></div>
    </div>
  </OverlayPortal>;
}
