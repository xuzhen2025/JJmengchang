import React, { useLayoutEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useConfigFilter, useResourceConfig } from "../lib/useResourceConfig";

const COLLAPSED_ROW_HEIGHT = 36;

export function ResourceCategoryFilters({ scope, primary, secondary, search, onPrimary, onSecondary, onSearch }: {
  scope: string; primary: string; secondary: string; search: string;
  onPrimary: (value: string) => void; onSecondary: (value: string) => void; onSearch: (value: string) => void;
}) {
  const { store } = useResourceConfig();
  useConfigFilter(scope, "primary", primary, onPrimary);
  useConfigFilter(scope, "secondary", secondary, onSecondary);
  const categories = store.categories(scope);
  const children = [...new Set(categories.filter(n => primary === "全部" || n.name === primary).flatMap(n => n.children.map(c => c.name)))];
  const style = (active: boolean) => `px-2.5 py-1 rounded-md text-xs cursor-pointer ${active ? "text-purple-600 font-bold bg-purple-50" : "text-slate-600 hover:text-purple-600 font-normal"}`;
  const [primaryExpanded, setPrimaryExpanded] = useState(false);
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);
  const [primaryRef, primaryOverflow] = useRowOverflow<HTMLDivElement>(primaryExpanded);
  const [secondaryRef, secondaryOverflow] = useRowOverflow<HTMLDivElement>(secondaryExpanded);
  const toggleClass = (expanded: boolean) => expanded ? "max-h-[999px]" : "max-h-[2.25rem] overflow-hidden";
  const MoreButton = ({ expanded, visible, onClick }: { expanded: boolean; visible: boolean; onClick: () => void }) => visible ? (
    <button type="button" aria-expanded={expanded} onClick={onClick} className="flex shrink-0 items-center gap-0.5 pt-1 text-xs font-semibold text-purple-600 hover:text-purple-700">
      {expanded ? "收起" : "更多"}
      <span className={`text-[11px] transition-transform ${expanded ? "rotate-180" : ""}`}>⌄</span>
    </button>
  ) : null;
  return <>
    <div className="flex items-start gap-2 border-t border-slate-100 pt-3" data-testid={`${scope}-primary-filter`}>
      <span className="text-slate-900 font-bold shrink-0 w-20 text-right pr-2 pt-1">一级分类：</span>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <div ref={primaryRef} className={`flex min-w-0 flex-1 flex-wrap items-center gap-2 ${toggleClass(primaryExpanded)}`}>
        {["全部", ...categories.map(n => n.name)].map(name => <button type="button" key={name} onClick={() => { onPrimary(name); onSecondary("全部"); }} className={style(primary === name)}>{name}</button>)}
        </div>
        <MoreButton expanded={primaryExpanded} visible={primaryOverflow} onClick={() => setPrimaryExpanded(current => !current)} />
      </div>
    </div>
    <div className="flex items-center gap-2 border-t border-slate-100 pt-3" data-testid={`${scope}-secondary-filter`}>
      <span className="text-slate-900 font-bold shrink-0 w-20 text-right pr-2">二级分类：</span>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <div ref={secondaryRef} className={`flex min-w-0 flex-1 flex-wrap items-center gap-2 ${toggleClass(secondaryExpanded)}`}>
        <div className="border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5 bg-white w-32 shrink-0 focus-within:border-purple-400">
          <Search className="w-3.5 h-3.5 text-slate-400" /><input aria-label="搜索二级分类" placeholder="搜索分类" value={search} onChange={e => onSearch(e.target.value)} className="text-xs focus:outline-none w-full placeholder:text-slate-400 font-normal" />
        </div>
        {["全部", ...children.filter(name => name.toLowerCase().includes(search.trim().toLowerCase()))].map(name => <button type="button" key={name} onClick={() => onSecondary(name)} className={style(secondary === name)}>{name}</button>)}
        </div>
        <MoreButton expanded={secondaryExpanded} visible={secondaryOverflow} onClick={() => setSecondaryExpanded(current => !current)} />
      </div>
    </div>
  </>;
}

function useRowOverflow<T extends HTMLElement>(expanded: boolean) {
  const ref = useRef<T | null>(null);
  const [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const check = () => setOverflow(element.scrollHeight > COLLAPSED_ROW_HEIGHT + 1);
    check();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    observer?.observe(element);
    window.addEventListener("resize", check);
    return () => { observer?.disconnect(); window.removeEventListener("resize", check); };
  }, [expanded]);
  return [ref, overflow] as const;
}

export function ResourceStatusFilter({ scope, value, onChange }: { scope: string; value: string; onChange: (value: string) => void }) {
  const { store } = useResourceConfig();
  useConfigFilter(scope, "status", value, onChange);
  if (!store.statusEnabled(scope)) return null;
  return <div className="flex items-center gap-2 border-t border-slate-100 pt-3" data-testid={`${scope}-status-filter`}>
    <span className="text-slate-900 font-bold shrink-0 w-20 text-right pr-2">{scope === "scripts" ? "脚本状态：" : "视频状态："}</span>
    <div className="flex flex-wrap items-center gap-2 flex-1">{["全部", ...store.statuses(scope).map(s => s.name)].map(name => <button key={name} type="button" onClick={() => onChange(name)}
      className={`text-xs px-2.5 py-1 rounded-md cursor-pointer ${value === name ? "font-bold bg-purple-50 text-purple-600" : "text-slate-600 hover:bg-slate-50"}`}>{name}</button>)}</div>
  </div>;
}

export function ResourceStatusBadge({ scope, status, className = "rounded px-2 py-0.5 text-xs font-semibold", children }: {
  scope: string; status?: string; className?: string; children?: React.ReactNode;
}) {
  const { store } = useResourceConfig();
  if (!store.statusEnabled(scope)) return null;
  return <span className={className} style={store.statusStyle(scope, status)}>{children || status || "未设置"}</span>;
}
