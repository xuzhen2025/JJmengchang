import { useRef, useState } from "react";
import { GripVertical, Settings2 } from "lucide-react";
import AnchoredPopover from "./overlays/AnchoredPopover";

export interface ColumnSettingItem {
  key: string;
  label: string;
}

interface ColumnSettingsControlProps {
  columns: readonly ColumnSettingItem[];
  hiddenKeys: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onMove: (sourceKey: string, targetKey: string) => void;
  onReset: () => void;
}

export default function ColumnSettingsControl({
  columns,
  hiddenKeys,
  onToggle,
  onMove,
  onReset,
}: ColumnSettingsControlProps) {
  const [open, setOpen] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(value => !value)}
        className={`border p-1.5 rounded-lg cursor-pointer bg-white shadow-2xs transition-colors ${open ? "border-[#7C3AED] text-[#7C3AED] ring-2 ring-purple-100" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
        title="列设置"
        aria-label="列设置"
        aria-expanded={open}
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {open && (
        <AnchoredPopover
          anchorRef={buttonRef}
          onClose={() => setOpen(false)}
          align="end"
          width={256}
          maxHeight={360}
          className="bg-white rounded-xl shadow-xl border border-slate-200/90 p-4 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <span className="text-sm font-bold text-slate-800">自定义字段(可拖动排序)</span>
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
            >
              重置
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {columns.map(column => (
              <div
                key={column.key}
                draggable
                onDragStart={event => {
                  setDraggedKey(column.key);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", column.key);
                }}
                onDragOver={event => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={event => {
                  event.preventDefault();
                  const sourceKey = event.dataTransfer.getData("text/plain") || draggedKey;
                  if (sourceKey && sourceKey !== column.key) onMove(sourceKey, column.key);
                  setDraggedKey(null);
                }}
                onDragEnd={() => setDraggedKey(null)}
                className={`flex items-center gap-2 px-1 py-1.5 rounded hover:bg-slate-50 text-xs font-medium text-slate-700 ${draggedKey === column.key ? "opacity-50" : ""}`}
              >
                <GripVertical className="w-3.5 h-3.5 shrink-0 text-slate-300 cursor-grab active:cursor-grabbing" aria-hidden="true" />
                <label className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hiddenKeys.has(column.key)}
                    onChange={() => onToggle(column.key)}
                    className="rounded text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer w-3.5 h-3.5"
                  />
                  <span className="truncate">{column.label}</span>
                </label>
              </div>
            ))}
          </div>
        </AnchoredPopover>
      )}
    </div>
  );
}
