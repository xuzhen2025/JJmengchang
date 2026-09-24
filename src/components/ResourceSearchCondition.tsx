import React from "react";
import { X } from "lucide-react";

interface ResourceSearchConditionProps {
  query?: string;
  onClear?: () => void;
}

export default function ResourceSearchCondition({ query, onClear }: ResourceSearchConditionProps) {
  if (!query) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
      <span className="font-bold text-slate-700">筛选：</span>
      <span className="inline-flex h-8 items-center gap-2 rounded-md border border-purple-300 bg-purple-50 px-3 font-bold text-purple-700">
        标题/ID：{query}
        <button type="button" onClick={onClear} className="text-purple-500 hover:text-purple-800" title="清除搜索条件">
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  );
}
