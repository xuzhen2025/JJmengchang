import React, { useState, useMemo } from "react";
import { X, Search, ChevronDown, Calendar } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";
import { useTaggedResources } from "../lib/useResourceTags";

export interface ScriptResourceItem {
  id: string;
  title: string;
  template?: string;
  tags?: string[];
  status?: string;
  publisher?: string;
  publishTime?: string;
}

export const DEFAULT_SCRIPT_LIST: ScriptResourceItem[] = [
  {
    id: "S001",
    title: "【Mardi】好喜欢",
    template: "对标翻拍",
    tags: ["促销...", "稍微..."],
    status: "待审核",
    publisher: "陈婷婷",
    publishTime: "2026-06-22 15:15:53"
  },
  {
    id: "S002",
    title: "【Mardi】清掉",
    template: "对标翻拍",
    tags: ["促销...", "稍微..."],
    status: "待审核",
    publisher: "陈婷婷",
    publishTime: "2026-06-22 15:11:40"
  },
  {
    id: "S003",
    title: "微胖宝妈这样穿",
    template: "对标翻拍",
    tags: ["单人...", "稍微..."],
    status: "待审核",
    publisher: "陈婷婷",
    publishTime: "2026-06-22 14:42:34"
  },
  {
    id: "S004",
    title: "【如悦大码女装】特别显瘦",
    template: "对标翻拍",
    tags: ["单人...", "稍微..."],
    status: "待审核",
    publisher: "陈婷婷",
    publishTime: "2026-06-22 11:54:26"
  },
  {
    id: "S005",
    title: "听说（焕丽女王）夏日爆款",
    template: "二创衍生",
    tags: ["促销...", "稍微..."],
    status: "待审核",
    publisher: "鲁月园",
    publishTime: "2026-06-22 01:52:43"
  },
  {
    id: "S006",
    title: "听说促销（焕丽女王）第二期",
    template: "二创衍生",
    tags: ["促销...", "稍微..."],
    status: "待审核",
    publisher: "鲁月园",
    publishTime: "2026-06-22 01:51:51"
  },
  {
    id: "S007",
    title: "这件送（美嘉挺）无痕内衣",
    template: "二创衍生",
    tags: ["促销...", "稍微..."],
    status: "待审核",
    publisher: "鲁月园",
    publishTime: "2026-06-22 00:24:05"
  },
  {
    id: "S008",
    title: "这件送（美嘉挺）夏季新款",
    template: "二创衍生",
    tags: ["促销...", "稍微..."],
    status: "待审核",
    publisher: "鲁月园",
    publishTime: "2026-06-22 00:24:02"
  },
  {
    id: "S009",
    title: "法式复古法兰绒保暖睡衣",
    template: "原创",
    tags: ["爆款...", "高佣..."],
    status: "已通过",
    publisher: "张小明",
    publishTime: "2026-06-21 18:20:00"
  },
  {
    id: "S010",
    title: "德绒无痕发热保暖内衣",
    template: "对标翻拍",
    tags: ["痛点...", "口播..."],
    status: "已通过",
    publisher: "李四",
    publishTime: "2026-06-20 10:11:22"
  },
  {
    id: "S011",
    title: "爆款收腹高腰塑身裤测试",
    template: "原创",
    tags: ["种草...", "效果..."],
    status: "已通过",
    publisher: "王五",
    publishTime: "2026-06-19 14:05:12"
  },
  {
    id: "S012",
    title: "羊绒感德绒发热打底衫",
    template: "二创衍生",
    tags: ["品牌...", "爆款..."],
    status: "待审核",
    publisher: "赵六",
    publishTime: "2026-06-18 09:30:00"
  },
  {
    id: "S013",
    title: "夏季冰丝无痕打底背心",
    template: "对标翻拍",
    tags: ["透气...", "舒适..."],
    status: "已通过",
    publisher: "陈婷婷",
    publishTime: "2026-06-17 16:45:10"
  },
  {
    id: "S014",
    title: "无钢圈大码聚拢文胸",
    template: "原创",
    tags: ["防下垂...", "聚拢..."],
    status: "已通过",
    publisher: "鲁月园",
    publishTime: "2026-06-16 11:20:00"
  },
  {
    id: "S015",
    title: "云感亲肤蕾丝边家居服",
    template: "二创衍生",
    tags: ["柔软...", "睡衣..."],
    status: "待审核",
    publisher: "陈婷婷",
    publishTime: "2026-06-15 08:12:00"
  }
];

interface LinkScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedScript: ScriptResourceItem | ScriptResourceItem[]) => boolean | void;
  initialSelectedId?: string;
  initialSelectedIds?: string[];
  multiSelect?: boolean;
  title?: string;
  customScripts?: ScriptResourceItem[];
  zIndexClass?: string;
}

export default function LinkScriptModal(props: LinkScriptModalProps) {
  return props.isOpen ? <LinkScriptModalContent {...props} /> : null;
}

function LinkScriptModalContent({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedId,
  initialSelectedIds,
  multiSelect = false,
  title = "关联脚本",
  customScripts,
  zIndexClass = "z-[300]"
}: LinkScriptModalProps) {
  const scriptList = useTaggedResources("scripts", customScripts || DEFAULT_SCRIPT_LIST);

  // Selected State
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedIds) return initialSelectedIds;
    if (initialSelectedId) return [initialSelectedId];
    return ["S001"]; // default select S001 like screenshot
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [authorFilter, setAuthorFilter] = useState("作者");
  const [selectFilter, setSelectFilter] = useState("");
  const [dateRange, setDateRange] = useState("开始日期 至 结束日期");

  // Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Filtered List
  const filteredList = useMemo(() => {
    return scriptList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        if (!matchTitle && !matchId) return false;
      }
      if (categorySearch.trim()) {
        const c = categorySearch.toLowerCase().trim();
        if (!item.template?.toLowerCase().includes(c)) return false;
      }
      if (tagSearch.trim()) {
        const t = tagSearch.toLowerCase().trim();
        const matchTag = item.tags?.some((tag) => tag.toLowerCase().includes(t));
        if (!matchTag) return false;
      }
      if (authorFilter !== "作者" && authorFilter !== "全部" && authorFilter.trim()) {
        if (!item.publisher?.includes(authorFilter)) return false;
      }
      return true;
    });
  }, [scriptList, searchQuery, categorySearch, tagSearch, authorFilter]);

  const totalCount = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Selection Handler
  const toggleSelectRow = (item: ScriptResourceItem) => {
    if (multiSelect) {
      if (selectedIds.includes(item.id)) {
        setSelectedIds(selectedIds.filter((id) => id !== item.id));
      } else {
        setSelectedIds([...selectedIds, item.id]);
      }
    } else {
      setSelectedIds([item.id]);
    }
  };

  const handleSelectAllCurrentPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedList.map((i) => i.id);
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(combined);
    } else {
      const pageIds = paginatedList.map((i) => i.id);
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleConfirm = () => {
    if (!selectedIds.length) return;
    if (multiSelect) {
      const selectedItems = scriptList.filter((i) => selectedIds.includes(i.id));
      if (!selectedItems.length || onConfirm(selectedItems) === false) return;
    } else {
      const selectedItem = scriptList.find((i) => selectedIds.includes(i.id));
      if (!selectedItem || onConfirm(selectedItem) === false) return;
    }
    onClose();
  };

  const isAllCurrentSelected =
    paginatedList.length > 0 && paginatedList.every((i) => selectedIds.includes(i.id));

  const displaySelectedText =
    selectedIds.length === 0
      ? "未选择脚本"
      : selectedIds.length === 1
      ? `已选择脚本 ID: ${selectedIds[0]}`
      : `已选择 ${selectedIds.length} 项脚本: ID ${selectedIds.join(", ")}`;

  return (
    <OverlayPortal layer="modal" className={`fixed inset-0 ${zIndexClass} bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150`}>
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4.5 bg-[#7C3AED] rounded-full inline-block"></span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Search & Filters Form */}
        <div className="space-y-3">
          {/* Row 1: Search bar + Query Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3.5 py-2 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="请输入脚本标题或id"
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setPage(1)}
              className="bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs active:scale-95"
            >
              查询
            </button>
          </div>

          {/* Row 2: 5 Filter Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* 1. 搜索分类 */}
            <div className="relative flex items-center bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="搜索分类"
                className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* 2. 搜索二级标签 */}
            <div className="relative flex items-center bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="搜索二级标签"
                className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* 3. 作者 Dropdown */}
            <div className="relative flex items-center bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-1.5 cursor-pointer">
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-700 focus:outline-none appearance-none cursor-pointer pr-4"
              >
                <option value="作者">作者</option>
                <option value="陈婷婷">陈婷婷</option>
                <option value="鲁月园">鲁月园</option>
                <option value="张小明">张小明</option>
                <option value="李四">李四</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* 4. 请选择(支持输入搜索) */}
            <div className="relative flex items-center bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-1.5 cursor-pointer">
              <input
                type="text"
                value={selectFilter}
                onChange={(e) => setSelectFilter(e.target.value)}
                placeholder="请选择(支持输入搜索)"
                className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none pr-4"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* 5. 开始日期 至 结束日期 */}
            <div className="relative flex items-center bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-1.5 col-span-2 sm:col-span-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                placeholder="开始日期 至 结束日期"
                className="w-full bg-transparent text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none truncate"
              />
            </div>
          </div>
        </div>

        {/* Table & Pagination Box */}
        <div className="border border-slate-200/80 rounded-2xl bg-[#F8F9FA]/40 overflow-hidden flex flex-col">
          {/* Table Area */}
          <div className="overflow-x-auto min-h-[260px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-600 font-bold bg-[#F8F9FA]/90">
                  <th className="py-3 px-4 w-10 text-center">
                    {multiSelect && <input
                      type="checkbox"
                      checked={isAllCurrentSelected}
                      onChange={handleSelectAllCurrentPage}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />}
                  </th>
                  <th className="py-3 px-4 font-bold text-slate-700">脚本标题</th>
                  <th className="py-3 px-4 font-bold text-slate-700">脚本模板</th>
                  <th className="py-3 px-4 font-bold text-slate-700">标签</th>
                  <th className="py-3 px-4 font-bold text-slate-700">状态</th>
                  <th className="py-3 px-4 font-bold text-slate-700">发布人</th>
                  <th className="py-3 px-4 font-bold text-slate-700">发布时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      无匹配的脚本数据
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((item) => {
                    const isChecked = selectedIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => toggleSelectRow(item)}
                        className={`hover:bg-purple-50/40 transition-colors cursor-pointer select-none ${
                          isChecked ? "bg-purple-50/30" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by row click
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {item.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {item.template || "对标翻拍"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(item.tags || ["促销...", "稍微..."]).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-600 border border-sky-100"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              item.status === "已通过"
                                ? "bg-emerald-500 text-white"
                                : "bg-[#FF5722] text-white"
                            }`}
                          >
                            {item.status || "待审核"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {item.publisher || "陈婷婷"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {item.publishTime || "2026-06-22 15:15:53"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="px-4 py-3 bg-[#F8F9FA]/80 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            {/* Left Info */}
            <div className="flex items-center gap-3">
              <span>共 <strong className="text-purple-600 font-bold">{totalCount}</strong> 条数据</span>
              <span className="text-slate-300">|</span>
              <span>第 <strong className="text-slate-800 font-bold">{currentPage}</strong> / {totalPages} 页</span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1">
                <span>每页展示:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 条/页</option>
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 cursor-pointer transition-colors"
              >
                首页
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 cursor-pointer transition-colors"
              >
                上一页
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pNum
                      ? "bg-[#7C3AED] text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 cursor-pointer transition-colors"
              >
                下一页
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 cursor-pointer transition-colors"
              >
                末页
              </button>

              {/* Jump to page */}
              <div className="flex items-center gap-1 ml-2">
                <span>前往</span>
                <input
                  type="text"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder="页码"
                  className="w-10 bg-white border border-slate-200 rounded-lg text-center py-1 text-xs text-slate-700 focus:outline-none"
                />
                <span>页</span>
                <button
                  type="button"
                  onClick={() => {
                    const targetP = parseInt(jumpPageInput, 10);
                    if (!isNaN(targetP) && targetP >= 1 && targetP <= totalPages) {
                      setPage(targetP);
                    }
                  }}
                  className="text-[#7C3AED] font-bold hover:underline ml-1 cursor-pointer"
                >
                  跳转
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-600 font-medium">
            <span className="text-purple-600 font-bold">{displaySelectedText}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedIds.length}
              className="px-6 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              确认关联
            </button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
