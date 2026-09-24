import React, { useState, useRef, useEffect, useId, useLayoutEffect } from "react";
import { useTagCatalog, useTagFilterSync } from "../lib/useResourceTags";
import type { TagKind } from "../lib/resourceTags";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { Search, ChevronDown } from "lucide-react";

const COLLAPSED_ROW_HEIGHT = 36;

export interface TagGroupItem {
  id: string;
  name: string;
  subTags: string[];
}



interface TagFilterProps {
  selectedTag?: string;
  onSelectTag?: (tag: string, groupName?: string) => void;
  tagGroups?: TagGroupItem[];
  showSearchInput?: boolean;
  searchKeyword?: string;
  onSearchKeywordChange?: (keyword: string) => void;
}

export const PublicTagFilter = (props: TagFilterProps) => <TagFilter {...props} kind="public" />;
export const PersonalTagFilter = (props: TagFilterProps) => <TagFilter {...props} kind="personal" />;

const TagFilter = ({
  kind,
  selectedTag = "全部",
  onSelectTag,
  showSearchInput = true,
  searchKeyword,
  onSearchKeywordChange,
}: TagFilterProps & { kind: TagKind }) => {
  const { publicTagGroups, publicGroups, personalTagGroups, personalGroups } = useTagCatalog();
  const groups = kind === "public" ? publicTagGroups : personalTagGroups;
  const dictionary = kind === "public" ? publicGroups : personalGroups;
  const tagGroups = groups.map((group) => ({ id: group.id, name: group.name, subTags: dictionary[group.name] || [] }));
  const label = kind === "public" ? "公共标签" : "个人标签";
  const popoverId = useId();
  useTagFilterSync(kind, selectedTag, (value) => onSelectTag?.(value));
  const anchorRef = useRef<HTMLElement | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [popoverSearchKey, setPopoverSearchKey] = useState("");
  const [localSearchKey, setLocalSearchKey] = useState("");
  const [expanded, setExpanded] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const topSearchKey = searchKeyword ?? localSearchKey;
  const setTopSearchKey = (keyword: string) => {
    setLocalSearchKey(keyword);
    onSearchKeywordChange?.(keyword);
  };
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  const closePopover = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveGroupId(null);
    setPopoverSearchKey("");
  };

  const handleMouseEnter = (groupId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (activeGroupId !== groupId) {
      setActiveGroupId(groupId);
      setPopoverSearchKey("");
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(closePopover, 200);
  };

  const handleSelectSubTag = (subTag: string, groupName: string) => {
    if (onSelectTag) {
      onSelectTag(subTag, groupName);
    }
    closePopover();
  };

  const handleReset = () => {
    closePopover();
    setTopSearchKey("");
    if (onSelectTag) {
      onSelectTag("全部");
    }
  };

  // 过滤包含搜索关键字的标签组
  const filteredGroups = tagGroups.filter((g) => {
    if (!topSearchKey) return true;
    const matchGroup = g.name.toLowerCase().includes(topSearchKey.toLowerCase());
    const matchSub = g.subTags.some((st) =>
      st.toLowerCase().includes(topSearchKey.toLowerCase())
    );
    return matchGroup || matchSub;
  });

  useLayoutEffect(() => {
    const element = optionsRef.current;
    if (!element) return;
    const check = () => setHasMore(element.scrollHeight > COLLAPSED_ROW_HEIGHT + 1);
    check();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    observer?.observe(element);
    window.addEventListener("resize", check);
    return () => { observer?.disconnect(); window.removeEventListener("resize", check); };
  }, [expanded, filteredGroups.length, topSearchKey]);

  return (
    <div data-testid={`${kind}-tag-filter`} className="flex flex-1 min-w-0 flex-wrap items-center gap-2 relative">
      {/* 搜索框 */}
      {showSearchInput && (
        <div className="relative border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5 bg-white w-32 shrink-0 focus-within:border-purple-400 mr-1 shadow-2xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索二级标签"
            value={topSearchKey}
            onChange={(e) => setTopSearchKey(e.target.value)}
            className="text-xs focus:outline-hidden w-full placeholder:text-slate-400 font-normal text-slate-700"
          />
        </div>
      )}

      {kind === "personal" ? (
        <div role="group" aria-label="个人标签范围" className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white shrink-0">
          {["全部", "无个人标签", "有个人标签"].map((option) => (
            <button key={option} type="button" aria-pressed={selectedTag === option}
              onClick={() => { closePopover(); onSelectTag?.(option); }}
              className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                selectedTag === option ? "bg-purple-600 text-white font-bold shadow-xs" : "text-slate-600 hover:bg-slate-50 font-medium"
              }`}>
              {option}
            </button>
          ))}
        </div>
      ) : <button
        type="button"
        onClick={() => handleReset()}
        className={`transition-all cursor-pointer text-xs px-2.5 py-1 rounded-md font-medium ${
          selectedTag === "全部" || !selectedTag
            ? "text-purple-600 font-bold bg-purple-50 border border-purple-200/80 shadow-2xs"
            : "text-slate-600 hover:text-purple-600 font-normal hover:bg-slate-100/60"
        }`}
      >
        全部
      </button>}

      <div ref={optionsRef} className={`flex min-w-0 flex-1 flex-wrap items-center gap-2 ${expanded ? "max-h-[999px]" : "max-h-[2.25rem] overflow-hidden"}`}>
      {/* 标签组列表 */}
      {filteredGroups.map((group) => {
        // 判断当前标签组下是否有二级标签被选中
        const hasSelectedSubTag =
          selectedTag !== "全部" && group.subTags.includes(selectedTag);

        const isOpen = activeGroupId === group.id;

        // 根据内部搜索筛选二级标签
        const filteredSubTags = group.subTags.filter((st) =>
          st.toLowerCase().includes(popoverSearchKey.toLowerCase())
        );

        return (
          <div
            key={group.id}
            className="relative inline-block shrink-0"
            onMouseEnter={(event) => { anchorRef.current = event.currentTarget; handleMouseEnter(group.id); }}
            onMouseLeave={handleMouseLeave}
          >
            {/* 标签组触发按钮 */}
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-controls={isOpen ? popoverId : undefined}
              onClick={(event) => {
                anchorRef.current = event.currentTarget;
                handleMouseEnter(group.id);
              }}
              className={`transition-all cursor-pointer text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-medium border whitespace-nowrap ${
                hasSelectedSubTag
                  ? "text-[#7C3AED] font-bold bg-purple-100/80 border-purple-200 shadow-2xs"
                  : isOpen
                  ? "text-[#7C3AED] bg-purple-50 font-semibold border-purple-200/60"
                  : "text-slate-700 hover:text-[#7C3AED] hover:bg-purple-50/60 font-normal border-transparent"
              }`}
            >
              <span>
                {hasSelectedSubTag ? selectedTag.startsWith(`${group.name}: `) ? selectedTag : `${group.name}: ${selectedTag}` : group.name}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 opacity-60 ${
                  isOpen ? "rotate-180 text-[#7C3AED]" : ""
                }`}
              />
            </button>

            {/* Hover 下拉 Popover (对齐截图) */}
            {isOpen && (
              <AnchoredPopover
                anchorRef={anchorRef}
                onClose={closePopover}
                width={360}
                className="bg-white border border-slate-200/90 rounded-lg shadow-2xl p-4 text-left"
                onPointerEnter={() => handleMouseEnter(group.id)}
                onPointerLeave={handleMouseLeave}
              >
                <div id={popoverId} data-testid={`${kind}-tag-popover`}>
                  {/* 顶部搜索输入框 (对齐截图1:1) */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="请输入二级标签名"
                      value={popoverSearchKey}
                      onChange={(e) => setPopoverSearchKey(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all shadow-2xs"
                    />
                  </div>

                  {/* 二级标签 Grid (对齐截图4列平铺风格) */}
                  <div className="grid grid-cols-4 gap-y-2 gap-x-2.5 max-h-64 overflow-y-auto pr-1">
                    {filteredSubTags.length > 0 ? (
                      filteredSubTags.map((subTag) => {
                        const isSelected = selectedTag === subTag;
                        return (
                          <button
                            key={subTag}
                            type="button"
                            onClick={() => handleSelectSubTag(subTag, group.name)}
                            className={`text-xs px-1.5 py-1.5 rounded-md text-center truncate cursor-pointer transition-all ${
                              isSelected
                                ? "bg-[#7C3AED] text-white font-bold shadow-2xs"
                                : "text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50/80 font-normal"
                            }`}
                            title={subTag}
                          >
                            {subTag}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-4 py-4 text-center text-xs text-slate-400">
                        未找到相关二级标签
                      </div>
                    )}
                  </div>
                </div>
              </AnchoredPopover>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleReset}
        className="text-slate-400 hover:text-[#7C3AED] text-xs ml-2 cursor-pointer font-normal transition-colors shrink-0"
      >
        重置{label}
      </button>
      </div>

      {hasMore && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(current => !current)} className="flex shrink-0 items-center gap-0.5 pt-1 text-xs font-semibold text-purple-600 hover:text-purple-700">
        {expanded ? "收起" : "更多"}<span className={`text-[11px] transition-transform ${expanded ? "rotate-180" : ""}`}>⌄</span>
      </button>}
    </div>
  );
};
