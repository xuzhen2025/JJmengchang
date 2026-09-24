import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Trash2, X } from "lucide-react";
import AnchoredPopover from "./overlays/AnchoredPopover";
import OverlayPortal from "./overlays/OverlayPortal";
import {
  filterPresetStorageKey, normalizePresetFilters, readFilterPresets, removeFilterPreset, samePresetFilters, saveFilterPreset,
  type FilterPreset, type FilterPresetSeed, type FilterValues, type ResourcePresetScope,
} from "../lib/resourceFilterPresets";

interface ResourceFilterPresetsProps<T extends FilterValues> {
  scope: ResourcePresetScope;
  defaults: T;
  value: T;
  seeds?: FilterPresetSeed<T>[];
  selectedName: string;
  onSelectName: (name: string) => void;
  onApply: (filters: T) => void;
}

export default function ResourceFilterPresets<T extends FilterValues>(props: ResourceFilterPresetsProps<T>) {
  let storageKey = "";
  try {
    const session = JSON.parse(window.localStorage.getItem("mengchang_prototype_session") || "null");
    if (typeof session?.username === "string" && session.username) storageKey = filterPresetStorageKey(session.username, props.scope);
  } catch { /* The control reports storage errors without sharing another member's presets. */ }
  return <PresetControl key={storageKey} {...props} storageKey={storageKey} />;
}

type PresetDialogState = { kind: "save" } | { kind: "overwrite" | "delete"; id: string; name: string };

function PresetControl<T extends FilterValues>({
  storageKey, defaults, value, seeds = [], selectedName, onSelectName, onApply,
}: ResourceFilterPresetsProps<T> & { storageKey: string }) {
  const load = () => {
    if (!storageKey) throw new Error("Missing member or storage");
    return readFilterPresets(window.localStorage.getItem(storageKey), defaults, seeds);
  };
  const [presets, setPresets] = useState<FilterPreset<T>[]>(() => {
    try { return load(); } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<PresetDialogState | null>(null);
  const [name, setName] = useState("");
  const [draftFilters, setDraftFilters] = useState<T>(value);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const active = presets.find(preset => preset.name === selectedName);

  useEffect(() => {
    if (notice) {
      const timer = window.setTimeout(() => setNotice(""), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [notice]);

  useEffect(() => {
    if (selectedName && (!active || !samePresetFilters(active.filters, value))) onSelectName("");
  }, [selectedName, active, value, onSelectName]);

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      try { setPresets(load()); }
      catch { setNotice("预设读取失败，请检查浏览器存储后重新操作"); }
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [storageKey, defaults, seeds]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);

  const closeMenu = () => { setOpen(false); anchorRef.current?.focus(); };
  const closeDialog = () => { setDialog(null); setError(""); };
  const write = (next: FilterPreset<T>[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, presets: next }));
    setPresets(next);
  };
  const save = (overwriteId?: string) => {
    if (!name.trim()) { setError("请输入名称"); return; }
    try {
      const latest = load();
      const result = saveFilterPreset(latest, name, normalizePresetFilters(draftFilters, defaults), crypto.randomUUID(), overwriteId);
      setPresets(latest);
      if (result.status === "confirm-overwrite") {
        setError("");
        setDialog({ kind: "overwrite", id: result.preset.id, name: result.preset.name });
      } else if (result.status === "saved") {
        write(result.presets);
        onSelectName(result.preset.name);
        closeDialog();
        setNotice(overwriteId ? "筛选预设已覆盖" : "筛选预设保存成功");
      } else {
        setError(result.status === "limit" ? "已达到 5 个预设上限"
          : result.status === "missing" ? "原预设已变更，请重新保存" : "请输入名称");
        setDialog({ kind: "save" });
      }
    } catch { setError("保存失败，请检查浏览器存储后重新操作"); }
  };
  const remove = () => {
    if (dialog?.kind !== "delete") return;
    try {
      const latest = load();
      write(removeFilterPreset(latest, dialog.id));
      if (selectedName === dialog.name) onSelectName("");
      closeDialog();
      setNotice("筛选预设已删除");
    } catch { setError("删除失败，请检查浏览器存储后重新操作"); }
  };

  return <div className="flex max-w-full items-center gap-2 rounded-md bg-purple-50/60 p-1.5">
    <button ref={anchorRef} type="button" aria-label="选择常用筛选预设" aria-haspopup="menu" aria-expanded={open}
      onClick={() => {
        if (open) { closeMenu(); return; }
        try { setPresets(load()); setOpen(true); }
        catch { setNotice("预设读取失败，请检查登录状态及浏览器存储"); }
      }}
      className={`flex h-9 w-60 max-w-[calc(100vw-140px)] items-center justify-between gap-3 rounded-xl border bg-white px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${open ? "border-purple-500" : "border-slate-200 hover:border-purple-400"}`}>
      <span title={selectedName || undefined} className={`min-w-0 truncate ${selectedName ? "text-slate-700" : "text-slate-400"}`}>{selectedName || "选择常用筛选预设"}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    <button type="button" aria-label="保存常用筛选预设" onClick={() => {
      setOpen(false); setName(""); setError(""); setDraftFilters(normalizePresetFilters(value, defaults)); setDialog({ kind: "save" });
    }} className="h-9 shrink-0 rounded-md bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-purple-400">保存</button>

    {open && <AnchoredPopover anchorRef={anchorRef} onClose={closeMenu} matchAnchorWidth gap={8} maxHeight={320}
      className="rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl">
      <div ref={menuRef} role="menu" aria-label="常用筛选预设" onKeyDown={event => {
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
        }
      }}>
        {presets.length === 0 && <div className="px-4 py-4 text-center text-xs text-slate-400">暂无常用筛选预设</div>}
        {presets.map(preset => <div key={preset.id} className="flex items-center rounded-lg bg-slate-50/70 hover:bg-purple-50">
          <button type="button" role="menuitemcheckbox" aria-checked={selectedName === preset.name} title={preset.name}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-4 py-3 text-left text-sm text-slate-600 outline-none focus-visible:bg-purple-100"
            onClick={() => {
              try {
                const latest = load();
                setPresets(latest);
                const current = latest.find(item => item.id === preset.id);
                if (!current) { setNotice("该预设已被删除，请重新选择"); closeMenu(); return; }
                onApply({ ...current.filters });
                onSelectName(current.name); closeMenu(); setNotice(`已载入筛选预设：${current.name}`);
              } catch { setNotice("预设读取失败，请重新选择"); }
            }}>
            <span className="min-w-0 flex-1 truncate">{preset.name}</span>
            {selectedName === preset.name && <Check className="h-3.5 w-3.5 shrink-0 text-purple-600" />}
          </button>
          <button type="button" role="menuitem" aria-label={`删除预设 ${preset.name}`} title={`删除预设 ${preset.name}`}
            onClick={() => { closeMenu(); setError(""); setDialog({ kind: "delete", id: preset.id, name: preset.name }); }}
            className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-purple-400">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>)}
      </div>
    </AnchoredPopover>}

    {dialog && <PresetDialog key={dialog.kind} title={dialog.kind === "save" ? "保存为常用筛选" : dialog.kind === "overwrite" ? "覆盖已有预设" : "删除筛选预设"}
      compact={dialog.kind !== "save"} onClose={closeDialog}
      onSubmit={() => dialog.kind === "delete" ? remove() : save(dialog.kind === "overwrite" ? dialog.id : undefined)}
      onCancel={() => { if (dialog.kind === "overwrite") { setError(""); setDialog({ kind: "save" }); } else closeDialog(); }}
      confirmLabel={dialog.kind === "save" ? "保存" : dialog.kind === "overwrite" ? "确认覆盖" : "确认删除"} danger={dialog.kind === "delete"}>
      {dialog.kind === "save" ? <div className="mx-auto flex w-full max-w-[580px] items-start gap-4">
        <label htmlFor={inputId} className="shrink-0 pt-3.5 text-base font-semibold text-slate-600"><span className="mr-1 text-rose-500">*</span>名称</label>
        <div className="min-w-0 flex-1">
          <input id={inputId} autoFocus required value={name} onChange={event => { setName(event.target.value); setError(""); }}
            aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : undefined} placeholder="请输入名称"
            className={`h-[54px] w-full rounded-xl border px-5 text-base font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-purple-100 ${error ? "border-rose-400" : "border-slate-200 focus:border-purple-400"}`} />
          {error && <p id={`${inputId}-error`} role="alert" className="mt-2 break-words text-xs text-rose-600">{error}</p>}
        </div>
      </div> : <div className="space-y-3 text-sm leading-6 text-slate-600">
        <p className="break-all">{dialog.kind === "overwrite" ? `是否覆盖已有预设“${dialog.name}”？` : `确认删除预设“${dialog.name}”？`}</p>
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      </div>}
    </PresetDialog>}
    {notice && <OverlayPortal layer="toast" role="status" className="fixed left-1/2 top-6 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg bg-slate-900/95 px-5 py-3 text-sm text-white shadow-xl"><span className="break-all">{notice}</span></OverlayPortal>}
  </div>;
}

function PresetDialog({ title, compact, onClose, onCancel, onSubmit, confirmLabel, danger, children }: {
  title: string; compact: boolean; onClose: () => void; onCancel: () => void; onSubmit: () => void;
  confirmLabel: string; danger?: boolean; children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = contentRef.current?.querySelector<HTMLElement>("input, [data-cancel]");
    first?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <OverlayPortal role="dialog" aria-modal="true" aria-labelledby={titleId}
    className="fixed inset-0 flex items-center justify-center bg-black/45 p-4"
    onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
      if (event.key === "Tab") {
        const elements = Array.from(contentRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)") || []);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <form ref={contentRef} noValidate onSubmit={event => { event.preventDefault(); onSubmit(); }}
      className={`w-full overflow-y-auto rounded-2xl bg-white shadow-2xl max-h-[calc(100dvh-32px)] ${compact ? "max-w-md" : "max-w-[880px]"}`}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-9">
        <div className="flex min-w-0 items-center gap-2.5"><span className="h-6 w-1 shrink-0 rounded-full bg-purple-600" /><h3 id={titleId} className="text-xl font-normal text-slate-800">{title}</h3></div>
        <button type="button" onClick={onClose} title="关闭" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"><X className="h-5 w-5" /></button>
      </div>
      <div className={compact ? "p-6" : "px-5 py-10 sm:px-12 sm:py-12"}>{children}</div>
      <div className="flex justify-center gap-4 border-t border-slate-50 px-6 py-6">
        <button type="button" data-cancel onClick={onCancel} className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-base text-slate-600 hover:bg-slate-50">取消</button>
        <button type="submit" className={`h-11 rounded-xl px-6 text-base font-semibold text-white ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-purple-600 hover:bg-purple-700"}`}>{confirmLabel}</button>
      </div>
    </form>
  </OverlayPortal>;
}
