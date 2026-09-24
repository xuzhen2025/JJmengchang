import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages = 1,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const safeTotalPages = Math.max(1, totalPages);

  const renderPageButtons = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;

    if (endPage > safeTotalPages) {
      endPage = safeTotalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages.map((pageNum) => {
      const isActive = currentPage === pageNum;
      return (
        <button
          key={pageNum}
          type="button"
          onClick={() => onPageChange(pageNum)}
          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isActive
              ? "bg-purple-600 text-white shadow-2xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-600"
          }`}
        >
          {pageNum}
        </button>
      );
    });
  };

  return (
    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 select-none">
      <div className="flex items-center gap-2">
        <span>
          共 <strong className="text-slate-800 font-bold">{totalCount}</strong> 条记录
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} 条/页
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderPageButtons()}

        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 ml-3 text-slate-500">
          <span>跳至</span>
          <input
            type="number"
            min={1}
            max={safeTotalPages}
            key={currentPage}
            defaultValue={currentPage}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= safeTotalPages) {
                onPageChange(val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                if (!isNaN(val) && val >= 1 && val <= safeTotalPages) {
                  onPageChange(val);
                }
              }
            }}
            className="w-12 px-1.5 py-1 text-center bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-purple-500 shadow-2xs"
          />
          <span>页</span>
        </div>
      </div>
    </div>
  );
};
