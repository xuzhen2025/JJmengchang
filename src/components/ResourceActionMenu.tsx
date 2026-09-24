import React, { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import AnchoredPopover from "./overlays/AnchoredPopover";

export default function ResourceActionMenu({ label, options, onSelect, disabled = false }: {
  label: string;
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={anchorRef} type="button" disabled={disabled} aria-expanded={open} aria-haspopup="menu"
      onClick={() => setOpen(value => !value)}
      className="border border-slate-200 hover:border-purple-300 bg-white text-slate-700 px-2.5 py-1.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all text-xs disabled:opacity-40">
      {label}<ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    </button>
    {open && <AnchoredPopover anchorRef={anchorRef} onClose={() => setOpen(false)} width={192} maxHeight={256} gap={4}
      className="bg-white rounded-lg shadow-xl border border-slate-200 py-1.5">
      <div role="menu" aria-label={label}>
        {options.map(option => <button type="button" role="menuitem" key={option}
          onClick={() => { setOpen(false); onSelect(option); }}
          className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors cursor-pointer">
          {option}
        </button>)}
      </div>
    </AnchoredPopover>}
  </>;
}
