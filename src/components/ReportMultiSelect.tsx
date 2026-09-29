import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { filterReportOptions, reportSelectLeaves, reportSelectPath, reportSelectState, toggleReportSelection, type ReportSelectOption } from "../lib/reportMultiSelect";

interface ReportMultiSelectProps {
  label: string;
  levels: string[];
  options: ReportSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
}

export default function ReportMultiSelect({ label, levels, options, values, onChange }: ReportMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activePath, setActivePath] = useState<string[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const leaves = useMemo(() => reportSelectLeaves(options), [options]);
  const selected = leaves.filter(option => values.includes(option.value));
  const filtered = useMemo(() => filterReportOptions(options, query), [options, query]);
  const first = selected[0];
  const columns: ReportSelectOption[][] = [filtered];
  let children = filtered;
  for (const value of activePath) {
    const option = children.find(item => item.value === value);
    if (!option?.children) break;
    children = option.children;
    columns.push(children);
  }
  const originals = new Map<string, ReportSelectOption>();
  const index = (nodes: ReportSelectOption[]) => nodes.forEach(node => { originals.set(node.value, node); if (node.children) index(node.children); });
  index(options);

  const close = () => { setOpen(false); setQuery(""); };
  const expand = (value: string, level: number) => setActivePath([...activePath.slice(0, level), value]);
  const toggleOpen = () => {
    if (open) return close();
    setActivePath(reportSelectPath(options, first?.value).slice(0, first ? -1 : 0));
    setOpen(true);
  };

  return <div ref={anchorRef} className={`relative flex h-10 w-[270px] max-w-full shrink-0 items-center gap-2 rounded-lg border bg-white px-3 text-sm ${open ? "border-purple-500 ring-2 ring-purple-100" : "border-slate-200 hover:border-purple-300"}`}>
    <button type="button" aria-label={`${label}筛选`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? popupId : undefined} onClick={toggleOpen}
      className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-purple-500" />
    <span className="pointer-events-none relative shrink-0 text-slate-900">{label}</span>
    {first ? <>
      <span className="pointer-events-none relative flex min-w-0 items-center gap-1 rounded bg-purple-50 px-2 py-1 text-xs text-slate-900">
        <span title={first.value} className="truncate">{first.label}</span>
        <button type="button" title={`移除${first.label}`} aria-label={`移除${first.label}`} onClick={() => onChange(values.filter(value => value !== first.value))}
          className="pointer-events-auto flex h-4 w-4 shrink-0 items-center justify-center rounded text-purple-600 hover:bg-purple-100"><X className="h-3 w-3" /></button>
      </span>
      {selected.length > 1 && <span title={selected.map(option => option.value).join("\n")} className="pointer-events-none relative shrink-0 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">+{selected.length - 1}</span>}
    </> : <span className="pointer-events-none relative min-w-0 flex-1 truncate text-slate-400">请选择{label}</span>}
    <span className="flex-1" />
    {selected.length > 0 && <button type="button" title={`清空${label}`} aria-label={`清空${label}`} onClick={() => onChange([])} className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>}
    <ChevronDown className={`pointer-events-none relative h-4 w-4 shrink-0 text-slate-400 ${open ? "rotate-180" : ""}`} />

    {open && <AnchoredPopover id={popupId} anchorRef={anchorRef} width={Math.max(300, columns.length * 250)} maxHeight={380} onClose={close} className="rounded-lg border border-slate-200 bg-white shadow-xl">
      <div className="sticky top-0 z-10 bg-white p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input autoFocus type="search" aria-label={`搜索${label}`} placeholder={`搜索${label}`} value={query}
            onChange={event => { setQuery(event.target.value); setActivePath(reportSelectPath(filterReportOptions(options, event.target.value)).slice(0, -1)); }}
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-purple-500" />
        </div>
      </div>
      <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((nodes, level) => <div key={level} role="group" aria-label={levels[level]} className="min-w-0">
          <div className="px-3 pb-2 text-xs text-slate-400">{levels[level]}</div>
          <div className="h-64 overflow-y-auto p-1.5">
            {nodes.map(option => {
              const original = originals.get(option.value)!;
              const state = reportSelectState(original, values);
              const branch = Boolean(option.children);
              const active = activePath[level] === option.value;
              return <div key={option.value} className={`flex min-h-10 items-center gap-2 rounded-md px-2 py-1 text-sm ${active || state.checked ? "bg-purple-50 text-purple-600" : "text-slate-700 hover:bg-slate-50"}`}>
                <input type="checkbox" aria-label={option.label} checked={state.checked} aria-checked={state.mixed ? "mixed" : state.checked} disabled={state.disabled}
                  ref={element => { if (element) element.indeterminate = state.mixed; }}
                  onChange={() => onChange(toggleReportSelection(original, values))} className="h-4 w-4 shrink-0 accent-purple-600 disabled:opacity-40" />
                <button type="button" title={option.value} aria-expanded={branch ? active : undefined} disabled={!branch && state.disabled}
                  onClick={() => branch ? expand(option.value, level) : onChange(toggleReportSelection(original, values))}
                  className="flex min-w-0 flex-1 items-center gap-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                  <span className="min-w-0 flex-1 break-words">{option.label}</span>
                  {branch && <ChevronRight className="h-4 w-4 shrink-0" />}
                </button>
              </div>;
            })}
            {!nodes.length && <div className="px-2 py-8 text-center text-xs text-slate-400">暂无{query ? "匹配选项" : levels[level]}</div>}
          </div>
        </div>)}
      </div>
    </AnchoredPopover>}
  </div>;
}
