import { useEffect, useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";
import {
  buildAnalyticsExportName,
  type AnalyticsExportFilter,
  type AnalyticsExportFormat,
  type AnalyticsExportRequest,
} from "../lib/analyticsExport";

interface AnalyticsExportDialogProps {
  open: boolean;
  pageName: string;
  filters: AnalyticsExportFilter[];
  startDate: string;
  endDate: string;
  onClose: () => void;
  onConfirm: (request: AnalyticsExportRequest) => Promise<void> | void;
}

export default function AnalyticsExportDialog({
  open,
  pageName,
  filters,
  startDate,
  endDate,
  onClose,
  onConfirm,
}: AnalyticsExportDialogProps) {
  const [format, setFormat] = useState<AnalyticsExportFormat>("csv");
  const [name, setName] = useState("");
  const [rangeStart, setRangeStart] = useState(startDate);
  const [rangeEnd, setRangeEnd] = useState(endDate);
  const [openedAt, setOpenedAt] = useState(() => new Date());
  const [nameEdited, setNameEdited] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setFormat("csv");
    setRangeStart(startDate);
    setRangeEnd(endDate);
    setOpenedAt(now);
    setName(buildAnalyticsExportName({ pageName, filters, startDate, endDate, now }));
    setNameEdited(false);
    setError("");
    setExporting(false);
  }, [open]);

  if (!open) return null;

  const updateRange = (nextStart: string, nextEnd: string) => {
    setRangeStart(nextStart);
    setRangeEnd(nextEnd);
    setError("");
    if (!nameEdited) setName(buildAnalyticsExportName({ pageName, filters, startDate: nextStart, endDate: nextEnd, now: openedAt }));
  };

  const submit = async () => {
    if (!name.trim()) { setError("请输入导出名称"); return; }
    if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) { setError("请选择有效的导出时间范围"); return; }
    setExporting(true);
    setError("");
    try {
      await onConfirm({ format, name, startDate: rangeStart, endDate: rangeEnd });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出失败，请稍后重试");
      setExporting(false);
    }
  };

  return (
    <OverlayPortal
      layer="dialog"
      role="dialog"
      aria-modal="true"
      aria-label="导出"
      className="fixed inset-0 flex items-center justify-center bg-slate-950/45 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !exporting) onClose(); }}
      onKeyDown={(event) => { if (event.key === "Escape" && !exporting) onClose(); }}
    >
      <form
        onSubmit={(event) => { event.preventDefault(); void submit(); }}
        className="flex max-h-[92dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-violet-600" />
            <h2 className="text-lg font-bold text-slate-900">导出</h2>
          </div>
          <button type="button" title="关闭导出" disabled={exporting} onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-8">
          <fieldset className="grid gap-3 sm:grid-cols-[108px_1fr] sm:items-center">
            <legend className="sr-only">导出格式</legend>
            <span className="text-sm font-bold text-slate-600">导出格式</span>
            <div className="flex items-center gap-10">
              {(["csv", "xlsx"] as const).map((item) => (
                <label key={item} className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-600">
                  <input type="radio" name="analytics-export-format" value={item} checked={format === item} onChange={() => setFormat(item)} className="h-5 w-5 accent-violet-600" />
                  <span className={format === item ? "text-violet-600" : ""}>{item === "csv" ? "CSV" : "Excel"}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-3 sm:grid-cols-[108px_1fr] sm:items-center">
            <span className="text-sm font-bold text-slate-600">导出名称</span>
            <input
              value={name}
              onChange={(event) => { setName(event.target.value); setNameEdited(true); setError(""); }}
              aria-label="导出名称"
              className="h-10 min-w-0 rounded-md border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[108px_1fr] sm:items-center">
            <span className="text-sm font-bold text-slate-600">导出时间范围</span>
            <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-700 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
              <input type="date" aria-label="导出开始日期" value={rangeStart} onChange={(event) => updateRange(event.target.value, rangeEnd)} className="min-w-[130px] flex-1 bg-transparent outline-none" />
              <span className="text-slate-500">至</span>
              <input type="date" aria-label="导出结束日期" value={rangeEnd} onChange={(event) => updateRange(rangeStart, event.target.value)} className="min-w-[130px] flex-1 bg-transparent outline-none" />
            </div>
          </div>

          {error && <p role="alert" className="text-center text-sm text-rose-600">{error}</p>}
        </div>

        <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4">
          <button type="button" disabled={exporting} onClick={onClose} className="h-10 rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">取消</button>
          <button type="submit" disabled={exporting} className="flex h-10 min-w-24 items-center justify-center gap-2 rounded-md bg-violet-600 px-6 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
            {exporting ? "导出中" : "确定"}
          </button>
        </footer>
      </form>
    </OverlayPortal>
  );
}
