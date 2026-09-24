import React, { RefObject } from "react";
import { QuickCreationTaskSnapshot } from "../types";
import AnchoredPopover from "./overlays/AnchoredPopover";

type OutputSettings = Pick<QuickCreationTaskSnapshot,
  "imageAspectRatio" | "imageQuality" | "imageCount" | "videoAspectRatio" | "videoLength"
>;

interface QuickCreationOutputSettingsProps {
  anchorRef: RefObject<HTMLElement | null>;
  mode: QuickCreationTaskSnapshot["mode"];
  value: OutputSettings;
  maxSeconds: number;
  onClose: () => void;
  onChange: (settings: OutputSettings) => void;
}

const IMAGE_RATIOS = ["1:1", "3:4", "9:16", "16:9"] as const;
const VIDEO_RATIOS = ["9:16", "16:9"] as const;
const optionClass = "flex min-h-9 items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-500 transition peer-checked:border-purple-500 peer-checked:bg-purple-50 peer-checked:text-purple-600 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-disabled:opacity-50";

export default function QuickCreationOutputSettings({ anchorRef, mode, value, maxSeconds, onClose, onChange }: QuickCreationOutputSettingsProps) {
  const ratios = mode === "image" ? IMAGE_RATIOS : VIDEO_RATIOS;
  const ratio = mode === "image" ? value.imageAspectRatio : value.videoAspectRatio;

  return <AnchoredPopover anchorRef={anchorRef} onClose={onClose} align="end" gap={8} width={360} className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
    <div aria-label="输出参数" className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold text-slate-700">{mode === "image" ? "图片比例" : "视频比例"}</legend>
        <div className={`grid gap-2 ${mode === "image" ? "grid-cols-4" : "grid-cols-2"}`}>
          {ratios.map(ratioValue => {
            const [width, height] = ratioValue.split(":").map(Number);
            return <label key={ratioValue} className="relative cursor-pointer">
              <input type="radio" name="output-ratio" value={ratioValue} checked={ratio === ratioValue} onChange={() => onChange(mode === "image" ? { ...value, imageAspectRatio: ratioValue } : { ...value, videoAspectRatio: ratioValue as OutputSettings["videoAspectRatio"] })} className="peer sr-only" />
              <span className={`${optionClass} h-16 flex-col gap-2`}>
                <span className="flex h-6 items-center justify-center" aria-hidden="true"><span className="border border-current" style={{ width: 22 * width / Math.max(width, height), height: 22 * height / Math.max(width, height) }} /></span>
                {ratioValue}
              </span>
            </label>;
          })}
        </div>
      </fieldset>
      {mode === "image" ? <>
        <fieldset>
          <legend className="mb-3 text-xs font-semibold text-slate-700">图片分辨率</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["HD", "2K", "4K"] as const).map(quality => <label key={quality} className="relative cursor-pointer">
              <input type="radio" name="output-quality" value={quality} checked={value.imageQuality === quality} onChange={() => onChange({ ...value, imageQuality: quality })} className="peer sr-only" />
              <span className={optionClass}>{quality === "HD" ? "HD" : quality === "2K" ? "高清 2K" : "超清 4K"}</span>
            </label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-xs font-semibold text-slate-700">生成数量</legend>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 4].map(count => <label key={count} className="relative cursor-pointer">
              <input type="radio" name="output-count" value={count} checked={value.imageCount === count} onChange={() => onChange({ ...value, imageCount: count })} className="peer sr-only" />
              <span className={optionClass}>{count}张</span>
            </label>)}
          </div>
        </fieldset>
      </> : <div>
        <div className="mb-4 flex items-center justify-between"><label htmlFor="quick-video-duration" className="text-xs font-semibold text-slate-700">视频时长</label><output htmlFor="quick-video-duration" className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{value.videoLength} 秒</output></div>
        <input id="quick-video-duration" type="range" min={4} max={maxSeconds} step={1} value={value.videoLength} onChange={event => onChange({ ...value, videoLength: Number(event.target.value) })} className="h-4 w-full cursor-pointer rounded accent-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300" />
        <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>4 秒</span><span>{maxSeconds} 秒</span></div>
      </div>}
    </div>
  </AnchoredPopover>;
}
