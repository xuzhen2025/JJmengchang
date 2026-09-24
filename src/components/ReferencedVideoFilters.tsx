import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, HelpCircle, Search, X } from "lucide-react";
import AnchoredPopover from "./overlays/AnchoredPopover";
import type { ReportOrganization } from "../lib/analyticsOrganization";
import { REFERENCE_DIMENSIONS, referenceEntityOptions, validReferenceRange, type ReferenceDateRange, type ReferenceDimension, type ReferenceFilters } from "../lib/referencedVideoData";

function FilterHelp({ label, children }: { label: string; children: string }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button ref={anchor} type="button" aria-label={`${label}说明`} aria-describedby={open ? id : undefined}
        className="flex shrink-0 items-center justify-center w-5 h-5 cursor-help rounded focus-visible:outline-purple-500"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
        <HelpCircle className="w-3.5 h-3.5 text-white fill-neutral-400" />
      </button>
      {open && <AnchoredPopover anchorRef={anchor} side="top" align="center" gap={8} onClose={() => setOpen(false)}
        className="rounded-md bg-neutral-800 px-3 py-2 text-xs text-white shadow-lg pointer-events-none">
        <span id={id} role="tooltip" className="block leading-5">{children}</span>
      </AnchoredPopover>}
    </>
  );
}

interface Props {
  organization: ReportOrganization;
  filters: ReferenceFilters;
  spend: ReferenceDateRange;
  onFilterChange: (filters: ReferenceFilters) => void;
  onSpendChange: (range: ReferenceDateRange) => void;
}

export default function ReferencedVideoFilters({ organization, filters, spend, onFilterChange, onSpendChange }: Props) {
  const [open, setOpen] = useState<"dimension" | "entity" | null>(null);
  const [query, setQuery] = useState("");
  const [uploadDraft, setUploadDraft] = useState(filters.upload);
  const [spendDraft, setSpendDraft] = useState(spend);
  const dimensionRef = useRef<HTMLButtonElement>(null);
  const dimensionAnchorRef = useRef<HTMLDivElement>(null);
  const entityRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const dimension = REFERENCE_DIMENSIONS.find(item => item.id === filters.dimension)!;
  const options = referenceEntityOptions(organization, filters.dimension);
  const selected = options.find(item => item.id === filters.entityId);
  const matching = options.filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase()));
  const close = (restoreFocus = false) => {
    if (restoreFocus) (open === "dimension" ? dimensionRef : entityRef).current?.focus();
    setOpen(null);
  };
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const focus = () => {
      const target = open === "entity" ? searchRef.current : optionsRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (!target) return;
      if (getComputedStyle(target).visibility === "hidden") { frame = requestAnimationFrame(focus); return; }
      target.focus({ preventScroll: true });
    };
    frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    if (filters.entityId && !options.some(option => option.id === filters.entityId)) onFilterChange({ ...filters, entityId: "" });
  }, [organization, filters, onFilterChange]);

  const chooseDimension = (value: ReferenceDimension) => {
    if (filters.dimension !== value) onFilterChange({ ...filters, dimension: value, entityId: "" });
    setQuery("");
    close(true);
  };
  const updateRange = (kind: "upload" | "spend", range: ReferenceDateRange) => {
    if (kind === "upload") {
      setUploadDraft(range);
      if (validReferenceRange(range)) onFilterChange({ ...filters, upload: range });
    } else {
      setSpendDraft(range);
      if (validReferenceRange(range)) onSpendChange(range);
    }
  };
  const handleKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-option]"));
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length].focus();
  };
  return (
    <>
      <div className="flex items-center h-8 max-w-full rounded-md border border-slate-200 bg-white text-slate-600">
        <div ref={dimensionAnchorRef} className={`flex items-center gap-1 pl-2 rounded-l-md ${open === "dimension" ? "ring-1 ring-purple-500" : ""}`}>
          <FilterHelp label="人员筛选">团队作者、分组筛选数据统计与下方视频列表</FilterHelp>
          <button ref={dimensionRef} type="button" aria-label="人员筛选维度" aria-haspopup="dialog" aria-expanded={open === "dimension"}
            onClick={() => setOpen(open === "dimension" ? null : "dimension")}
            className="flex h-8 w-[72px] shrink-0 items-center justify-between pr-3 cursor-pointer focus-visible:outline-purple-500">
            {dimension.label}<ChevronDown className={`w-3.5 h-3.5 text-slate-400 ${open === "dimension" ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="flex min-w-0 items-center border-l border-slate-200">
          <button ref={entityRef} type="button" aria-label={`选择${dimension.label}`} aria-haspopup="dialog" aria-expanded={open === "entity"}
            onClick={() => { setQuery(""); setOpen(open === "entity" ? null : "entity"); }} title={selected?.label}
            className="flex h-8 w-[202px] max-w-full min-w-0 items-center justify-between gap-2 px-3 text-left cursor-pointer focus-visible:outline-purple-500">
            <span className={`truncate ${selected ? "text-slate-700" : "text-slate-400"}`}>{selected?.label || "请选择(支持输入搜索)"}</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 ${open === "entity" ? "rotate-180" : ""}`} />
          </button>
          <button type="button" aria-label="清除人员筛选" title="清除人员筛选" disabled={!selected} onClick={() => onFilterChange({ ...filters, entityId: "" })} className="p-1 mr-1 cursor-pointer text-slate-400 hover:text-purple-600 disabled:invisible"><X className="w-3 h-3" /></button>
        </div>
      </div>
      {open && <AnchoredPopover anchorRef={open === "dimension" ? dimensionAnchorRef : entityRef} width={open === "dimension" ? 132 : 300}
        maxHeight={320} gap={6} onClose={() => close(optionsRef.current?.contains(document.activeElement))}
        className="rounded-md border border-slate-200 bg-white shadow-lg py-1">
        <div ref={optionsRef} onKeyDown={handleKeys} aria-label={open === "dimension" ? "人员筛选维度选项" : `${dimension.label}选项`}>
          {open === "dimension" ? REFERENCE_DIMENSIONS.map(item => (
            <button key={item.id} data-option type="button" aria-pressed={filters.dimension === item.id} onClick={() => chooseDimension(item.id)}
              className={`block w-full px-5 py-2.5 text-left text-sm cursor-pointer focus-visible:outline-purple-500 ${filters.dimension === item.id ? "bg-slate-50 text-purple-600 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>{item.label}</button>
          )) : <>
            <div className="flex items-center gap-2 m-2 px-2 h-8 rounded border border-slate-200">
              <Search className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <input ref={searchRef} aria-label={`搜索${dimension.label}`} value={query} onChange={event => setQuery(event.target.value)} placeholder="请输入名称搜索" className="min-w-0 w-full outline-none text-xs" />
            </div>
            {matching.map(item => <button key={item.id} data-option type="button" aria-pressed={filters.entityId === item.id}
              onClick={() => { onFilterChange({ ...filters, entityId: item.id }); close(true); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs cursor-pointer focus-visible:outline-purple-500 ${filters.entityId === item.id ? "bg-purple-50 text-purple-600" : "text-slate-700 hover:bg-slate-50"}`}>
              <span className="min-w-0 break-words"><span className="block">{item.label}</span><span className="block text-[10px] text-slate-400 mt-0.5">{item.detail}</span></span>
              {filters.entityId === item.id && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>)}
            {!matching.length && <div role="status" className="py-5 text-center text-xs text-slate-400">暂无匹配{dimension.label}</div>}
          </>}
        </div>
      </AnchoredPopover>}
      {([{ kind: "upload", label: "上传时间", range: uploadDraft, help: "上传时间筛选数据统计与下方视频列表" },
        { kind: "spend", label: "消耗时间", range: spendDraft, help: "消耗时间仅筛选数据统计，不影响下方的视频列表" }] as const).map(({ kind, label, range, help }) => (
        <div key={kind} className="max-w-full">
          <div className={`flex flex-wrap items-center gap-1.5 min-h-8 text-slate-500 ${validReferenceRange(range) ? "" : "text-red-600"}`}>
            <span className="font-medium">{label}</span><FilterHelp label={label}>{help}</FilterHelp>
            <div className={`flex items-center h-8 max-w-full gap-1 bg-white rounded-md border px-2 ${validReferenceRange(range) ? "border-slate-200" : "border-red-400"}`}>
              <div className="relative min-w-0 w-[110px]">
                <input type="date" aria-label={`${label}开始日期`} aria-invalid={!validReferenceRange(range)} value={range.start}
                  onChange={event => updateRange(kind, { ...range, start: event.target.value })} className={`peer min-w-0 w-full bg-transparent text-xs outline-purple-500 ${range.start ? "text-slate-600" : "text-transparent focus:text-slate-600"}`} />
                {!range.start && <span className="absolute left-0 inset-y-0 flex items-center text-slate-400 pointer-events-none peer-focus:hidden">开始日期</span>}
              </div>
              <span>至</span>
              <div className="relative min-w-0 w-[110px]">
                <input type="date" aria-label={`${label}结束日期`} aria-invalid={!validReferenceRange(range)} value={range.end}
                  onChange={event => updateRange(kind, { ...range, end: event.target.value })} className={`peer min-w-0 w-full bg-transparent text-xs outline-purple-500 ${range.end ? "text-slate-600" : "text-transparent focus:text-slate-600"}`} />
                {!range.end && <span className="absolute left-0 inset-y-0 flex items-center text-slate-400 pointer-events-none peer-focus:hidden">结束日期</span>}
              </div>
            </div>
          </div>
          {!validReferenceRange(range) && <p role="alert" className="mt-1 text-[11px] text-red-600">{label}的开始日期不能晚于结束日期</p>}
        </div>
      ))}
    </>
  );
}
