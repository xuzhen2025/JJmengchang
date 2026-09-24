import React, { useRef, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { useResourceConfig } from "../lib/useResourceConfig";

export function ResourceEditDialog({ title, onClose, onConfirm, disabled, confirmLabel = "确定", onKeyDown, children }: {
  title: string; onClose: () => void; onConfirm: () => void; disabled?: boolean; confirmLabel?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>; children: React.ReactNode;
}) {
  return <OverlayPortal role="dialog" aria-modal="true" aria-label={title} onKeyDown={onKeyDown}
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg max-h-[calc(100dvh-32px)] overflow-y-auto">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="w-1.5 h-4 bg-purple-600 rounded-full" />
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3></div>
        <button onClick={onClose} title="关闭" className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-8 min-h-[240px]">{children}</div>
      <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold">取消</button>
        <button disabled={disabled} onClick={onConfirm} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed">{confirmLabel}</button>
      </div>
    </div>
  </OverlayPortal>;
}

export function ResourceCategoryModal({ initialCategory = "", scope = "finished", onClose, onConfirm }: {
  initialCategory?: string; scope?: string; onClose: () => void; onConfirm: (category: string) => void;
}) {
  const { store } = useResourceConfig();
  const CATEGORY_TREE = store.categories(scope).map(n => ({ name: n.name, subs: n.children.map(c => c.name) }));
  const [category, setCategory] = useState(initialCategory);
  const [primary, setPrimary] = useState(initialCategory.split(" / ")[0] || CATEGORY_TREE[0]?.name || "");
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const select = (value: string) => { setCategory(value); setOpen(false); };
  const [selectedPrimary = "", selectedSecondary = ""] = category.split(" / ");
  return <ResourceEditDialog title="修改分类" onClose={onClose} onConfirm={() => onConfirm(category)} disabled={!store.categoryValid(scope, selectedPrimary, selectedSecondary)}>
    <div className="flex items-start gap-4 pt-2">
      <label className="text-xs font-bold text-slate-700 shrink-0 pt-2.5"><span className="text-rose-500 mr-1">*</span>分类</label>
      <button ref={anchorRef} onClick={() => setOpen(value => !value)} aria-expanded={open}
        className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs flex items-center justify-between gap-2">
        <span className="break-words text-left">{category || "请选择分类"}</span><ChevronDown className="w-4 h-4 text-purple-400 shrink-0" />
      </button>
      {open && <AnchoredPopover anchorRef={anchorRef} onClose={() => setOpen(false)} width={360} maxHeight={270} gap={4}
        className="bg-white rounded-lg shadow-2xl border border-slate-200">
        <div className="flex divide-x divide-slate-100 text-xs">
          <div className="w-1/2 py-1 max-h-64 overflow-y-auto">
            {CATEGORY_TREE.map(item => <button key={item.name} onMouseEnter={() => setPrimary(item.name)}
              onClick={() => { setPrimary(item.name); if (!item.subs.length) select(item.name); }}
              className={`w-full text-left px-3.5 py-2.5 flex justify-between gap-1 ${primary === item.name ? "bg-purple-50 text-purple-700 font-bold" : "hover:bg-slate-50 text-slate-700"}`}>
              {item.name}<ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>)}
          </div>
          <div className="w-1/2 py-1 max-h-64 overflow-y-auto">
            {(CATEGORY_TREE.find(item => item.name === primary)?.subs || []).map(sub => <button key={sub}
              onClick={() => select(`${primary} / ${sub}`)} className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50 hover:text-purple-700 text-slate-700">{sub}</button>)}
          </div>
        </div>
      </AnchoredPopover>}
    </div>
  </ResourceEditDialog>;
}

export function VideoStatusSelect({ value, onChange, isMaterialMode = false, scope = isMaterialMode ? "materials" : "finished", placeholder = false }: {
  value: string; onChange: (value: string) => void; isMaterialMode?: boolean; scope?: string; placeholder?: boolean;
}) {
  const { store } = useResourceConfig();
  if (!store.statusEnabled(scope)) return null;
  return <select aria-label="视频状态" value={value} onChange={event => onChange(event.target.value)}
    className="px-2.5 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-900 focus:outline-none cursor-pointer shadow-2xs">
    {placeholder && <option value="" disabled>请选择状态</option>}
    {store.statuses(scope).map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
  </select>;
}
