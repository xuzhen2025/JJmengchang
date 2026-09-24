import React, { RefObject } from "react";
import { Check, X } from "lucide-react";
import AnchoredPopover from "./overlays/AnchoredPopover";

import { QUICK_CREATION_MODEL_OPTIONS } from "../lib/creationModels";
export { QUICK_CREATION_MODEL_OPTIONS } from "../lib/creationModels";

interface QuickCreationModelPopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  selectedModel: string;
  onClose: () => void;
  onSelect: (model: (typeof QUICK_CREATION_MODEL_OPTIONS)[number]) => void;
}

export default function QuickCreationModelPopover({ anchorRef, selectedModel, onClose, onSelect }: QuickCreationModelPopoverProps) {
  return <AnchoredPopover anchorRef={anchorRef} onClose={onClose} align="end" gap={8} width={320} maxHeight={420} className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
    <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-3">
      <h3 className="text-sm font-bold text-slate-900">选择模型</h3>
      <button type="button" onClick={onClose} title="关闭模型选择" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
    </div>
    <div className="space-y-2">
      {QUICK_CREATION_MODEL_OPTIONS.map((option) => <button type="button" key={option.name} aria-pressed={selectedModel === option.name} onClick={() => { onSelect(option); anchorRef.current?.focus({ preventScroll: true }); }} className={`w-full rounded-lg border p-3 text-left transition ${selectedModel === option.name ? "border-purple-400 bg-purple-50" : "border-slate-200 hover:border-purple-200 hover:bg-slate-50"}`}>
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>{option.name}</span>{selectedModel === option.name && <Check className="h-4 w-4 shrink-0 text-purple-600" />}</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">{option.desc}</p>
        <p className="mt-2 text-[10px] text-amber-600">图片 {option.imageCost}积分 · 视频 {option.videoCost}积分/次 · 最长 {option.maxSeconds}秒</p>
      </button>)}
    </div>
  </AnchoredPopover>;
}
