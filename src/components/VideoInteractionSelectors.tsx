import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { INTERACTION_CHANNELS, type InteractionChannelId, type VideoInteractionRecord } from "../lib/videoInteraction";

interface Props {
  channelId: InteractionChannelId;
  scopeId: string;
  records: VideoInteractionRecord[];
  onChannelChange: (id: InteractionChannelId) => void;
  onScopeChange: (id: string) => void;
}

export default function VideoInteractionSelectors({ channelId, scopeId, records, onChannelChange, onScopeChange }: Props) {
  const [open, setOpen] = useState<"channel" | "scope" | null>(null);
  const channelRef = useRef<HTMLButtonElement>(null);
  const scopeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const channel = INTERACTION_CHANNELS.find(item => item.id === channelId)!;
  const selected = records.find(record => record.id === scopeId);
  const scopeLabel = selected ? `${selected.account} / ${selected.material}` : channel.allLabel;
  const triggerClass = "h-8 min-w-0 flex items-center justify-between gap-2 bg-white border rounded-md px-3 text-xs text-slate-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400";
  const optionClass = "w-full text-left px-4 py-3 text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-400";
  const optionTone = (active: boolean) => active ? "bg-slate-50 text-purple-600 font-semibold" : "text-slate-600 hover:bg-slate-50";
  const close = (restoreFocus = false) => {
    if (restoreFocus) (open === "channel" ? channelRef : scopeRef).current?.focus();
    setOpen(null);
  };

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const focusSelection = () => {
      const option = listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      if (!option) return;
      if (window.getComputedStyle(option).visibility === "hidden") {
        frame = window.requestAnimationFrame(focusSelection);
        return;
      }
      option.focus({ preventScroll: true });
      option.scrollIntoView({ block: "nearest" });
    };
    frame = window.requestAnimationFrame(focusSelection);
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === "Tab") { close(true); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full shrink-0" data-testid="video-interaction-selectors">
      <button ref={channelRef} type="button" aria-label="互动数据平台" aria-haspopup="listbox" aria-expanded={open === "channel"}
        aria-controls={open === "channel" ? `${id}-channel` : undefined} title={channel.label}
        className={`${triggerClass} w-[116px] shrink-0 ${open === "channel" ? "border-purple-500" : "border-slate-200 hover:border-purple-300"}`}
        onClick={() => setOpen(open === "channel" ? null : "channel")}
        onKeyDown={event => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setOpen("channel"); } }}>
        <span className="truncate">{channel.shortLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${open === "channel" ? "rotate-180" : ""}`} />
      </button>
      <button ref={scopeRef} type="button" aria-label="互动数据范围" aria-haspopup="listbox" aria-expanded={open === "scope"}
        aria-controls={open === "scope" ? `${id}-scope` : undefined} title={scopeLabel}
        className={`${triggerClass} w-[216px] max-w-full ${open === "scope" ? "border-purple-500" : "border-slate-200 hover:border-purple-300"}`}
        onClick={() => setOpen(open === "scope" ? null : "scope")}
        onKeyDown={event => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setOpen("scope"); } }}>
        <span className="truncate">{scopeLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${open === "scope" ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <AnchoredPopover anchorRef={open === "channel" ? channelRef : scopeRef} width={open === "channel" ? 184 : 520}
          maxHeight={380} gap={6} onClose={() => close(listRef.current?.contains(document.activeElement))}
          className="rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          <div ref={listRef} id={`${id}-${open}`} role="listbox" aria-label={open === "channel" ? "互动数据平台选项" : "互动数据范围选项"} onKeyDown={handleKeys}>
            {open === "channel" ? INTERACTION_CHANNELS.map(item => (
              <button key={item.id} type="button" role="option" aria-selected={channelId === item.id}
                tabIndex={channelId === item.id ? 0 : -1} className={`${optionClass} ${optionTone(channelId === item.id)}`}
                onClick={() => { onChannelChange(item.id); close(true); }}>{item.label}</button>
            )) : (
              <>
                <button type="button" role="option" aria-selected={!selected} tabIndex={!selected ? 0 : -1}
                  className={`${optionClass} ${optionTone(!selected)}`} onClick={() => { onScopeChange("all"); close(true); }}>
                  {channel.allLabel}
                </button>
                {records.map(record => (
                  <button key={record.id} type="button" role="option" aria-selected={scopeId === record.id}
                    tabIndex={scopeId === record.id ? 0 : -1}
                    className={`${optionClass} leading-6 break-words ${optionTone(scopeId === record.id)}`}
                    onClick={() => { onScopeChange(record.id); close(true); }}>
                    <span className="block">账户：{record.account}</span>
                    <span className="block">id：{record.accountId}</span>
                    <span className="block">素材：{record.material}</span>
                    <span className="block">id：{record.materialId}（消耗：{record.spend.toFixed(2)}）</span>
                  </button>
                ))}
                {!records.length && <div role="status" className="px-4 py-6 text-center text-sm text-slate-400">暂无互动数据</div>}
              </>
            )}
          </div>
        </AnchoredPopover>
      )}
    </div>
  );
}
