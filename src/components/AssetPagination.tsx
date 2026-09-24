import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AssetPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const getVisiblePages = (page: number, totalPages: number): Array<number | "ellipsis"> => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  if (page >= totalPages - 3) return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
};

export default function AssetPagination({ total, page, pageSize, onPageChange, onPageSizeChange }: AssetPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const [jumpPage, setJumpPage] = useState("");

  useEffect(() => {
    if (page !== currentPage) onPageChange(currentPage);
  }, [currentPage, onPageChange, page]);

  const jump = () => {
    const target = Number(jumpPage);
    if (!Number.isInteger(target) || target < 1 || target > totalPages) return;
    onPageChange(target);
    setJumpPage("");
  };

  return (
    <div className="flex min-h-14 w-full shrink-0 flex-nowrap items-center gap-2 overflow-x-auto border-t border-slate-200 bg-white px-1 py-2 text-xs text-slate-500">
      <span className="mr-1 whitespace-nowrap">共 {total} 条记录</span>
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} title="上一页" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
      {getVisiblePages(currentPage, totalPages).map((item, index) => item === "ellipsis"
        ? <span key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center">...</span>
        : <button type="button" key={item} onClick={() => onPageChange(item)} className={`h-8 min-w-8 rounded-md border px-2 font-semibold ${item === currentPage ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"}`}>{item}</button>)}
      <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} title="下一页" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="ml-2 h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-violet-400"><option value={20}>20条/页</option><option value={50}>50条/页</option><option value={100}>100条/页</option></select>
      <label className="ml-2 flex items-center gap-2 whitespace-nowrap">跳转<input value={jumpPage} inputMode="numeric" onChange={(event) => setJumpPage(event.target.value.replace(/\D/g, ""))} onKeyDown={(event) => event.key === "Enter" && jump()} onBlur={jump} aria-label="跳转页码" className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-center text-xs text-slate-700 outline-none focus:border-violet-400" /></label>
    </div>
  );
}
