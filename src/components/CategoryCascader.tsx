import React, { useState, useRef, useEffect } from "react";
import { useResourceConfig } from "../lib/useResourceConfig";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { ChevronDown, ChevronUp, ChevronRight, Check, X } from "lucide-react";



interface CategoryCascaderProps {
  scope?: string;
  primaryCategory: string;
  secondaryCategory: string;
  onSelect: (primary: string, secondary: string) => void;
  placeholder?: string;
  customCategoryMap?: Record<string, string[]>;
  expandTrigger?: "hover" | "click";
  ariaLabel?: string;
  onClear?: () => void;
}

export default function CategoryCascader({
  scope = "finished",
  primaryCategory,
  secondaryCategory,
  onSelect,
  placeholder = "请选择分类，支持输入文字搜索",
  customCategoryMap,
  expandTrigger = "hover",
  ariaLabel = "资源分类",
  onClear
}: CategoryCascaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePrimary, setActivePrimary] = useState(primaryCategory || "");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { store, revision } = useResourceConfig();
  const categoryMap = React.useMemo(() => customCategoryMap || store.categoryMap(scope), [scope, revision, customCategoryMap]);

  // Update active primary if primaryCategory changes externally
  useEffect(() => {
    if (primaryCategory && categoryMap[primaryCategory]) {
      setActivePrimary(primaryCategory);
    } else {
      setActivePrimary(expandTrigger === "click" ? "" : Object.keys(categoryMap)[0] || "");
    }
  }, [primaryCategory, categoryMap, expandTrigger]);

  const closeMenu = () => {
    setIsOpen(false);
    setSearchQuery("");
    if (expandTrigger === "click") setActivePrimary(primaryCategory);
  };
  const showSecondary = expandTrigger === "hover" || Boolean(activePrimary && categoryMap[activePrimary]);

  const displayValue = searchQuery
    ? searchQuery
    : primaryCategory && secondaryCategory
    ? `${primaryCategory} / ${secondaryCategory}`
    : primaryCategory
    ? primaryCategory
    : "";

  const primaryKeys = Object.keys(categoryMap).filter((key) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesKey = key.toLowerCase().includes(q);
    const matchesSub = (categoryMap[key] || []).some((sub) => sub.toLowerCase().includes(q));
    return matchesKey || matchesSub;
  });

  const secondaryList = (categoryMap[activePrimary] || []).filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return sub.toLowerCase().includes(q) || activePrimary.toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div
        onClick={() => isOpen ? closeMenu() : setIsOpen(true)}
        className={`w-full bg-white border rounded-xl px-3.5 py-2 flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
          isOpen
            ? "border-purple-500 ring-2 ring-purple-100"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={event => { event.stopPropagation(); setIsOpen(true); }}
          role="combobox" aria-label={ariaLabel} aria-expanded={isOpen} aria-autocomplete="list"
          placeholder={placeholder}
          title={primaryCategory ? `${primaryCategory}${secondaryCategory ? ` / ${secondaryCategory}` : ""}` : undefined}
          className="min-w-0 w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none placeholder-slate-400"
        />
        {onClear && primaryCategory && <button type="button" title="清除分类" aria-label="清除分类"
          onClick={event => { event.stopPropagation(); onClear(); closeMenu(); }}
          className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-purple-600 shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        )}
      </div>

      {/* Cascading Dropdown Popover */}
      {isOpen && (
        <AnchoredPopover anchorRef={containerRef} onClose={closeMenu} matchAnchorWidth width={showSecondary ? 400 : 200} maxHeight={300} className={`bg-white border border-slate-200 rounded-lg shadow-2xl grid ${showSecondary ? "grid-cols-2" : "grid-cols-1"} divide-x divide-slate-100`}>
          {/* Left Column: 一级分类 */}
          <div className="flex flex-col max-h-64">
            <div className="px-4 py-2 text-[11px] font-bold text-slate-400 bg-slate-50/80 border-b border-slate-100 uppercase tracking-wider shrink-0">
              一级分类
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {primaryKeys.length === 0 ? (
                <div className="px-4 py-6 text-slate-400 text-xs text-center">无匹配分类</div>
              ) : (
                primaryKeys.map((pKey) => {
                  const isSelected = activePrimary === pKey;
                  return (
                    <button
                      type="button"
                      key={pKey}
                      aria-expanded={isSelected}
                      onMouseEnter={expandTrigger === "hover" ? () => setActivePrimary(pKey) : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePrimary(pKey);
                        if (!categoryMap[pKey].length) { onSelect(pKey, ""); setIsOpen(false); setSearchQuery(""); }
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left text-xs cursor-pointer select-none transition-colors ${
                        isSelected
                          ? "bg-purple-50/80 text-purple-600 font-bold"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span>{pKey}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? "text-purple-600 stroke-[2.5]" : "text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: 二级分类 */}
          {showSecondary && <div className="flex flex-col max-h-64 bg-white">
            <div className="px-4 py-2 text-[11px] font-bold text-slate-400 bg-slate-50/80 border-b border-slate-100 uppercase tracking-wider shrink-0">
              二级分类
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {secondaryList.length === 0 ? (
                <div className="px-4 py-6 text-slate-400 text-xs text-center">无分类选项</div>
              ) : (
                secondaryList.map((sub) => {
                  const isChecked = primaryCategory === activePrimary && secondaryCategory === sub;
                  return (
                    <button
                      type="button"
                      key={sub}
                      aria-pressed={isChecked}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(activePrimary, sub);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left text-xs cursor-pointer select-none transition-colors ${
                        isChecked
                          ? "bg-purple-50/80 text-purple-600 font-bold"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span>{sub}</span>
                      {isChecked && <Check className="w-4 h-4 shrink-0 text-purple-600 stroke-[2.5]" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>}
        </AnchoredPopover>
      )}
    </div>
  );
}
