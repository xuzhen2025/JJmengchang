import React, { useRef, useState } from "react";
import { CircleHelp, Minus, Plus } from "lucide-react";
import { AdDialog, buttonClass, primaryClass } from "./AdPushDialogs";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { readAdPushSettings } from "../lib/adPushConfig";
import { validateDerivationCount } from "../lib/videoDerivation";

export default function DeriveVideoDialog({ activeCount, onClose, onConfirm }: {
  activeCount: number;
  onClose: () => void;
  onConfirm: (count: number) => void;
}) {
  const [count, setCount] = useState("1");
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const helpRef = useRef<HTMLButtonElement>(null);
  const limit = readAdPushSettings().maxDerive;
  const number = Number(count), remaining = Math.max(0, limit - activeCount);
  const invalid = validateDerivationCount(number, limit, activeCount);
  return <AdDialog title="衍生新视频" onClose={onClose} className="[&>div]:max-w-[810px] [&>div>footer]:justify-center [&>div>header>h2]:border-l-4 [&>div>header>h2]:border-violet-500 [&>div>header>h2]:pl-2" footer={<>
    <button className={buttonClass} onClick={onClose}>取消</button>
    <button className={primaryClass} disabled={Boolean(invalid)} onClick={() => {
      try { onConfirm(number); } catch (e) { setError(e instanceof Error ? e.message : "提交失败，请重试"); }
    }}>确定</button>
  </>}>
    <div className="space-y-6 py-6">
      <div className="rounded-md bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-600">
        已选择 1 个视频，每个视频衍生 {Number.isSafeInteger(number) && number > 0 ? number : "--"} 个，预计将生成 {Number.isSafeInteger(number) && number > 0 ? number : "--"} 个衍生视频（本次最多可衍生 {remaining} 个）
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5 pb-8">
        <label htmlFor="derive-count" className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="text-rose-500">*</span>每个视频衍生数量
          <button type="button" ref={helpRef} aria-label="衍生说明" onMouseEnter={() => setHelp(true)} onMouseLeave={() => setHelp(false)} onFocus={() => setHelp(true)} onBlur={() => setHelp(false)}><CircleHelp className="h-4 w-4 text-slate-400" /></button>
        </label>
        <div className="flex h-12 w-[240px] overflow-hidden rounded-md border border-slate-200">
          <button className="flex w-12 shrink-0 items-center justify-center bg-slate-50 disabled:text-slate-300" aria-label="减少衍生数量" disabled={number <= 1 || !Number.isFinite(number)} onClick={() => setCount(String(number - 1))}><Minus size={18} /></button>
          <input id="derive-count" className="min-w-0 flex-1 border-x border-slate-200 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" inputMode="numeric" type="number" min={1} max={remaining} step={1} value={count} onChange={e => { setCount(e.target.value); setError(""); }} />
          <button className="flex w-12 shrink-0 items-center justify-center bg-slate-50 disabled:text-slate-300" aria-label="增加衍生数量" disabled={number >= remaining || !Number.isFinite(number)} onClick={() => setCount(String(number + 1))}><Plus size={18} /></button>
        </div>
      </div>
      {(error || invalid) && <p role="alert" className="text-center text-sm text-rose-600">{error || invalid}</p>}
    </div>
    {help && <AnchoredPopover anchorRef={helpRef} side="top" width={640} onClose={() => setHelp(false)} className="rounded-md bg-slate-900 p-4 text-xs leading-6 text-white">
      梦畅AIGC平台通过视频抽帧、重新编码等处理生成衍生版本，画面内容通常与原视频接近。该功能不是内容创新工具，也不保证通过广告平台的重复素材或同质化审核。
    </AnchoredPopover>}
  </AdDialog>;
}
