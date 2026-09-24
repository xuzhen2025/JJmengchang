import React, { useState } from "react";
import { useTagCatalog } from "../lib/useResourceTags";
import { resourceTagStore } from "../lib/resourceTags";
import { useResourceConfig } from "../lib/useResourceConfig";
import OverlayPortal from "./overlays/OverlayPortal";
import {
  Plus,
  X,
  Trash2,
  Edit3,
  Search,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Minus,
  Upload,
  Check,
  AlertTriangle,
  Tag as TagIcon
} from "lucide-react";

// 分类层级节点接口
export interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
}

// 二级标签类型接口
export interface SubTagItem {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  aiDirection?: string;
  description?: string;
  imageUrl?: string;
}

// 标签组类型接口
export interface TagGroupItem {
  id: string;
  name: string;
  rule: "multi" | "single"; // "支持多选" | "只能单选"
  categories: string[]; // 绑定的适用分类列表
  requiredCategories: string[]; // 必填分类路径列表
  hasAdminPermission: boolean; // 指定管理权限
  subTags: SubTagItem[];
  badges: { label: string; color: string }[]; // 分类徽章如 图、文、音、脚本
}

export default function TagGroupManagementView() {
  // Toast 提示框
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // 分类层级模拟数据（5个大分类：成片、素材、图片、脚本、音频）
  const { store: configStore } = useResourceConfig();
  const categoryTree: CategoryNode[] = Object.entries(configStore.getCategories()).map(([name, categories]) => ({
    id: `cat-${name}`, name, children: categories.map((category) => ({ id: category.id, name: category.name, children: category.children })),
  }));

  // 必填全路径列表
  const allRequiredPaths = categoryTree.flatMap((root) => (root.children || []).flatMap((primary) => (primary.children || []).map((secondary) => `${root.name}/${primary.name}/${secondary.name}`)));

  // 默认标签组模拟数据（完全对齐截图列表）
  const { publicTagGroups: tagGroups } = useTagCatalog();
  const setTagGroups = resourceTagStore.setPublicGroups;

  // 当前选中的标签组 ID
  const [selectedTagGroupId, setSelectedTagGroupId] = useState<string>("public-group-1");
  const currentGroup = tagGroups.find((g) => g.id === selectedTagGroupId) || tagGroups[0];

  // 左侧搜索标签组
  const [groupSearchKey, setGroupSearchKey] = useState("");
  const [topInputGroupName, setTopInputGroupName] = useState("");

  // 右侧搜索二级标签
  const [subTagSearchKey, setSubTagSearchKey] = useState("");

  // 过滤后的标签组与二级标签
  const filteredTagGroups = tagGroups.filter((g) =>
    g.name.toLowerCase().includes(groupSearchKey.toLowerCase())
  );

  const filteredSubTags = (currentGroup?.subTags || []).filter((st) =>
    st.name.toLowerCase().includes(subTagSearchKey.toLowerCase())
  );

  // 模态框状态 1：新增/编辑标签组
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<"add" | "edit">("add");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // 标签组表单状态
  const [formGroupName, setFormGroupName] = useState("");
  const [formSubTagRule, setFormSubTagRule] = useState<"multi" | "single">("multi");
  const [formCategories, setFormCategories] = useState<string[]>(["成片", "素材", "第三方"]);
  const [formRequiredCats, setFormRequiredCats] = useState<string[]>([]);
  const [formHasAdminPermission, setFormHasAdminPermission] = useState(false);

  // 模态框状态 2：删除标签组确认
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // 模态框状态 3：新增二级标签
  const [isAddSubTagModalOpen, setIsAddSubTagModalOpen] = useState(false);
  const [formSubTagNamesText, setFormSubTagNamesText] = useState("");
  const [editingSubTagId, setEditingSubTagId] = useState<string | null>(null);

  // 右侧二级标签多选模式 & 批量删除状态
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedSubTagIds, setSelectedSubTagIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // 适用分类三列级联当前选中的大分类与一级分类
  const [activeTopCatId, setActiveTopCatId] = useState<string>("cat-成片");
  const [activeSubCatId, setActiveSubCatId] = useState<string | null>(categoryTree[0]?.children?.[0]?.id || null);

  const currentTopCat = categoryTree.find((c) => c.id === activeTopCatId) || categoryTree[0];
  const currentSubCat = currentTopCat?.children?.find((c) => c.id === activeSubCatId) || currentTopCat?.children?.[0];

  // 独立勾选/取消勾选单一分类节点（下级不自动全选）
  const toggleCategorySelection = (catName: string) => {
    setFormCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  // -------------------------- 标签组 Action 函数 --------------------------

  // 1. 点击左上角“添加”或顶部“新增标签组”
  const handleOpenAddGroupModal = (presetName?: string) => {
    setGroupModalMode("add");
    setFormGroupName(presetName || topInputGroupName || "");
    setFormSubTagRule("multi");
    setFormCategories([]);
    setFormRequiredCats([]);
    setFormHasAdminPermission(false);
    setActiveTopCatId("cat-成片");
    setActiveSubCatId(categoryTree[0]?.children?.[0]?.id || null);
    setIsGroupModalOpen(true);
  };

  // 2. 点击标签组后方的【修改图标】
  const handleOpenEditGroupModal = (group: TagGroupItem) => {
    setGroupModalMode("edit");
    setEditingGroupId(group.id);
    setFormGroupName(group.name);
    setFormSubTagRule(group.rule);
    setFormCategories([...group.categories]);
    setFormRequiredCats([...group.requiredCategories]);
    setFormHasAdminPermission(group.hasAdminPermission);
    setActiveTopCatId("cat-成片");
    setActiveSubCatId(categoryTree[0]?.children?.[0]?.id || null);
    setIsGroupModalOpen(true);
  };

  // 3. 提交标签组 (新增/修改)
  const handleSubmitGroupModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGroupName.trim()) {
      showToast("请输入标签组名称");
      return;
    }

    if (groupModalMode === "add") {
      if (tagGroups.some((group) => group.name === formGroupName.trim())) { showToast("已存在同名标签组"); return; }
      const newGroup: TagGroupItem = {
        id: `tg-${Date.now()}`,
        name: formGroupName.trim(),
        rule: formSubTagRule,
        categories: formCategories,
        requiredCategories: formRequiredCats,
        hasAdminPermission: formHasAdminPermission,
        subTags: [],
        badges: [
          { label: "图", color: "bg-emerald-500" },
          { label: "文", color: "bg-emerald-600" },
          { label: "音", color: "bg-amber-500" },
          { label: "脚", color: "bg-emerald-400" },
        ],
      };
      setTagGroups((prev) => [...prev, newGroup]);
      setSelectedTagGroupId(newGroup.id);
      setTopInputGroupName("");
      showToast(`新增标签组 [${newGroup.name}] 成功！`);
    } else {
      if (tagGroups.some((group) => group.id !== editingGroupId && group.name === formGroupName.trim())) { showToast("已存在同名标签组"); return; }
      setTagGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroupId
            ? {
                ...g,
                name: formGroupName.trim(),
                rule: formSubTagRule,
                categories: formCategories,
                requiredCategories: formRequiredCats,
                hasAdminPermission: formHasAdminPermission,
              }
            : g
        )
      );
      showToast(`标签组 [${formGroupName.trim()}] 修改成功！`);
    }

    setIsGroupModalOpen(false);
  };

  // 4. 点击标签组后方的【删除图标】
  const handleOpenDeleteGroupModal = (group: TagGroupItem) => {
    setDeletingGroupId(group.id);
  };

  // 确认删除标签组
  const handleConfirmDeleteGroup = () => {
    if (!deletingGroupId) return;
    const target = tagGroups.find((g) => g.id === deletingGroupId);
    setTagGroups((prev) => prev.filter((g) => g.id !== deletingGroupId));
    if (selectedTagGroupId === deletingGroupId) {
      const remaining = tagGroups.filter((g) => g.id !== deletingGroupId);
      if (remaining.length > 0) {
        setSelectedTagGroupId(remaining[0].id);
      }
    }
    showToast(`标签组 [${target?.name || ""}] 已成功删除`);
    setDeletingGroupId(null);
  };

  // -------------------------- 二级标签 Action 函数 --------------------------

  // 打开【新增二级标签】模态框
  const handleOpenAddSubTagModal = () => {
    if (!currentGroup) { showToast("请先创建标签组"); return; }
    setEditingSubTagId(null);
    setFormSubTagNamesText("");
    setIsAddSubTagModalOpen(true);
  };

  // 提交新增二级标签
  const handleSubmitAddSubTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubTagNamesText.trim()) {
      showToast("请输入二级标签名称");
      return;
    }

    // 处理多行标签批量拆分
    const names = formSubTagNamesText
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (!currentGroup) return;
    if (editingSubTagId && names.length !== 1) { showToast("编辑时仅填写一个二级标签名称"); return; }
    if (new Set(names).size !== names.length || names.some((name) => currentGroup.subTags.some((tag) => tag.name === name && tag.id !== editingSubTagId))) {
      showToast("同一标签组内不能添加同名二级标签"); return;
    }

    const newSubTags: SubTagItem[] = names.map((n, idx) => ({
      id: `st-${Date.now()}-${idx}`,
      name: n,
    }));

    setTagGroups((prev) =>
      prev.map((g) => {
        if (g.id === currentGroup?.id) {
          return {
            ...g,
            subTags: editingSubTagId
              ? g.subTags.map((tag) => tag.id === editingSubTagId ? { ...tag, ...newSubTags[0], id: tag.id } : tag)
              : [...g.subTags, ...newSubTags],
          };
        }
        return g;
      })
    );

    setIsAddSubTagModalOpen(false);
    showToast(editingSubTagId ? "二级标签已更新，关联资源同步生效" : `成功在 [${currentGroup.name}] 添加 ${newSubTags.length} 个二级标签`);
  };

  // 删除单项二级标签
  const handleDeleteSubTag = (subTagId: string, subTagName: string) => {
    if (!window.confirm(`删除二级标签“${subTagName}”并解除资源关联？资源本身不会删除。`)) return;
    setTagGroups((prev) =>
      prev.map((g) => {
        if (g.id === currentGroup?.id) {
          return {
            ...g,
            subTags: g.subTags.filter((st) => st.id !== subTagId),
          };
        }
        return g;
      })
    );
    showToast(`已移除二级标签 [${subTagName}]`);
  };

  // 切换多选模式 (选择 / 取消选择)
  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedSubTagIds([]);
    } else {
      setIsSelectMode(true);
    }
  };

  // 切换单个二级标签选中状态
  const handleToggleSubTagSelect = (subTagId: string) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
    }
    setSelectedSubTagIds((prev) =>
      prev.includes(subTagId) ? prev.filter((id) => id !== subTagId) : [...prev, subTagId]
    );
  };

  // 判断当前筛选的二级标签是否全部选中
  const isAllCurrentSelected =
    filteredSubTags.length > 0 &&
    filteredSubTags.every((st) => selectedSubTagIds.includes(st.id));

  // 点击【选中本页】触发逻辑
  const handleToggleSelectAllPage = () => {
    if (!isSelectMode) {
      setIsSelectMode(true);
    }
    const currentIds = filteredSubTags.map((st) => st.id);
    if (isAllCurrentSelected) {
      // 全不选当前页
      setSelectedSubTagIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      // 全选当前页
      setSelectedSubTagIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // 点击【批量删除】按钮
  const handleBatchDeleteClick = () => {
    if (selectedSubTagIds.length === 0) {
      showToast("请先选择要删除的二级标签");
      return;
    }
    setIsBatchDeleteModalOpen(true);
  };

  // 确认批量删除
  const handleConfirmBatchDelete = () => {
    const count = selectedSubTagIds.length;
    setTagGroups((prev) =>
      prev.map((g) => {
        if (g.id === currentGroup?.id) {
          return {
            ...g,
            subTags: g.subTags.filter((st) => !selectedSubTagIds.includes(st.id)),
          };
        }
        return g;
      })
    );
    showToast(`成功删除 ${count} 个二级标签`);
    setSelectedSubTagIds([]);
    setIsBatchDeleteModalOpen(false);
    setIsSelectMode(false);
  };

  // 必填全选 / 单选逻辑
  const handleToggleSelectAllRequired = () => {
    if (formRequiredCats.length === allRequiredPaths.length) {
      setFormRequiredCats([]);
    } else {
      setFormRequiredCats([...allRequiredPaths]);
    }
  };

  const toggleRequiredPath = (path: string) => {
    setFormRequiredCats((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  return (
    <div data-testid="public-tag-management" className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5 p-6 animate-fade-in w-full overflow-y-auto text-slate-800">
      {/* Toast 提示通知 */}
      {toastMsg && (
        <OverlayPortal layer="toast" role="status" className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </OverlayPortal>
      )}

      {/* ========================================================================= */}
      {/* 左侧面板：标签组列表 (Tag Group Sidebar)                                */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-80 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden shrink-0">
        {/* 左侧顶栏：搜索/输入框 + [添加] 按钮 */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={topInputGroupName}
              onChange={(e) => setTopInputGroupName(e.target.value)}
              placeholder="请输入标签组名称"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => handleOpenAddGroupModal(topInputGroupName)}
              className="px-4 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
            >
              添加
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={groupSearchKey}
              onChange={(e) => setGroupSearchKey(e.target.value)}
              placeholder="筛选已有标签组..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 focus:border-[#7C3AED] rounded-lg text-xs outline-hidden font-medium text-slate-700"
            />
          </div>
        </div>

        {/* 标签组列表 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px]">
          {filteredTagGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              未匹配到相关标签组
            </div>
          ) : (
            filteredTagGroups.map((group) => {
              const isSelected = group.id === selectedTagGroupId;
              return (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedTagGroupId(group.id);
                    setIsSelectMode(false);
                    setSelectedSubTagIds([]);
                  }}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-all group ${
                    isSelected
                      ? "bg-purple-50/70 border-l-4 border-l-[#7C3AED]"
                      : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {/* 标签组名称 + 数量 */}
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? "text-[#7C3AED]" : "text-slate-800"
                      }`}
                    >
                      {group.name} ({group.subTags.length})
                    </span>

                    {/* 彩色分类图标徽章 (图 文 音 脚本) */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {group.badges.map((b, i) => (
                        <span
                          key={i}
                          className={`w-4 h-4 rounded-xs text-[9px] text-white flex items-center justify-center font-bold ${b.color}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 右侧编辑与删除图标按钮 */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditGroupModal(group);
                      }}
                      className="p-1 text-purple-600 hover:text-purple-800 rounded-md hover:bg-purple-100/60 transition-colors cursor-pointer"
                      title="修改标签组"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteGroupModal(group);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="删除标签组"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 右侧面板：二级标签管理区域 (Sub-Tags Panel)                                */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
        {/* 顶栏控制组：新增 | 选择/取消选择 | 选中本页 | 批量删除 | 搜索框 */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* [新增] 按钮 */}
            <button
              type="button"
              onClick={handleOpenAddSubTagModal}
              className="px-4 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span>新增</span>
            </button>

            {/* [选择 / 取消选择] 按钮 */}
            <button
              type="button"
              onClick={handleToggleSelectMode}
              className={`px-3.5 py-1.5 border text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isSelectMode
                  ? "bg-purple-50 text-[#7C3AED] border-[#7C3AED]"
                  : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700"
              }`}
            >
              {isSelectMode ? "取消选择" : "选择"}
            </button>

            {/* [选中本页] 勾选框 */}
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllCurrentSelected}
                onChange={handleToggleSelectAllPage}
                className="w-4 h-4 rounded-sm border-slate-300 text-[#7C3AED] focus:ring-purple-200 cursor-pointer accent-[#7C3AED]"
              />
              <span>选中本页</span>
            </label>

            {/* 非多选模式下显示 [修改标签组] */}
            {!isSelectMode && (
              <button
                type="button"
                disabled={!currentGroup}
                onClick={() => currentGroup && handleOpenEditGroupModal(currentGroup)}
                className="px-3.5 py-1.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                修改标签组
              </button>
            )}

            {/* 多选模式下才显示 [批量删除] */}
            {isSelectMode && (
              <button
                type="button"
                onClick={handleBatchDeleteClick}
                className="px-3.5 py-1.5 bg-white border border-slate-200/80 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                批量删除
              </button>
            )}
          </div>

          {/* 搜索二级标签 */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={subTagSearchKey}
              onChange={(e) => setSubTagSearchKey(e.target.value)}
              placeholder="请输入二级标签名称进行搜索"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 focus:border-[#7C3AED] rounded-lg text-xs outline-hidden font-medium text-slate-700"
            />
          </div>
        </div>

        {/* 当前标签组信息 */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{currentGroup?.name || "未选中标签组"}</span>
          </div>
          <span className="font-mono text-slate-400">共 {currentGroup?.subTags?.length || 0} 个二级标签</span>
        </div>

        {/* 二级标签 Chip 网格展示 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {filteredSubTags.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <TagIcon className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-medium">暂无二级标签，请点击左上方【新增】创建二级标签</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {filteredSubTags.map((subTag) => {
                const isSelected = selectedSubTagIds.includes(subTag.id);

                if (isSelectMode) {
                  return (
                    <div
                      key={subTag.id}
                      onClick={() => handleToggleSubTagSelect(subTag.id)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-all select-none shadow-2xs ${
                        isSelected
                          ? "bg-purple-50/90 border-[#7C3AED] text-[#7C3AED] font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="shrink-0 flex items-center justify-center">
                        {isSelected ? (
                          <span className="w-4 h-4 rounded border-2 border-[#7C3AED] bg-[#7C3AED] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded border-2 border-slate-400 bg-white hover:border-[#7C3AED] transition-colors" />
                        )}
                      </div>
                      <span>{subTag.name}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={subTag.id}
                    className="px-3.5 py-2 bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 rounded-lg border border-slate-200/60 text-xs font-medium flex items-center gap-2.5 transition-all group/item shadow-2xs"
                  >
                    <span>{subTag.name}</span>
                    <button
                      type="button"
                      title={`编辑二级标签 ${subTag.name}`}
                      onClick={() => {
                        setEditingSubTagId(subTag.id); setFormSubTagNamesText(subTag.name);
                        setIsAddSubTagModalOpen(true);
                      }}
                      className="rounded p-0.5 text-slate-400 hover:text-violet-600"
                    ><Edit3 className="h-3.5 w-3.5" /></button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubTag(subTag.id, subTag.name)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer rounded"
                      title="移除此标签"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 模态框 1：新增/编辑标签组 (完全对齐截图 1 & 截图 2)                        */}
      {/* ========================================================================= */}
      {isGroupModalOpen && (
        <OverlayPortal role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">
                  {groupModalMode === "add" ? "新增标签组" : "编辑标签组"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitGroupModal} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* 1. 标签组名称 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 w-28 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>标签组名称
                </label>
                <input
                  type="text"
                  value={formGroupName}
                  onChange={(e) => setFormGroupName(e.target.value)}
                  placeholder="请输入标签组名称"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              {/* 2. 选择二级标签规则 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 w-28 text-right shrink-0">
                  选择二级标签规则
                </label>
                <div className="flex items-center gap-6 text-xs text-slate-700 font-medium">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="subTagRule"
                      checked={formSubTagRule === "multi"}
                      onChange={() => setFormSubTagRule("multi")}
                      className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 cursor-pointer accent-[#7C3AED]"
                    />
                    <span className={formSubTagRule === "multi" ? "text-[#7C3AED] font-bold" : ""}>
                      支持多选
                    </span>
                    <div className="relative group/tooltip inline-flex items-center" title="文件可关联分组内多个二级标签">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block bg-slate-800 text-white text-[11px] font-normal px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg z-50 pointer-events-none">
                        文件可关联分组内多个二级标签
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  </label>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="subTagRule"
                      checked={formSubTagRule === "single"}
                      onChange={() => setFormSubTagRule("single")}
                      className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 cursor-pointer accent-[#7C3AED]"
                    />
                    <span className={formSubTagRule === "single" ? "text-[#7C3AED] font-bold" : ""}>
                      只能单选
                    </span>
                    <div className="relative group/tooltip inline-flex items-center" title="文件仅可关联分组内一个二级标签">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block bg-slate-800 text-white text-[11px] font-normal px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg z-50 pointer-events-none">
                        文件仅可关联分组内一个二级标签
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. 适用分类 */}
              <div className="flex items-start gap-4">
                <label className="text-xs font-bold text-slate-700 w-28 text-right shrink-0 pt-2">
                  <span className="text-rose-500 mr-1">*</span>适用分类
                </label>
                {(() => {
                  // 1. 获取所有已勾选的大分类
                  const selectedTopCats = categoryTree.filter((top) => formCategories.includes(top.name));
                  const isFirstBoxSelected = selectedTopCats.length > 0;

                  // 第二列要展示的一级分类列表：勾选了大分类时显示这些大分类子项的合集，未勾选时显示当前高亮大分类子项
                  let subCategoriesToDisplay: CategoryNode[] = [];
                  if (isFirstBoxSelected) {
                    const subMap = new Map<string, CategoryNode>();
                    selectedTopCats.forEach((top) => {
                      top.children?.forEach((sub) => {
                        if (!subMap.has(sub.id)) {
                          subMap.set(sub.id, sub);
                        }
                      });
                    });
                    subCategoriesToDisplay = Array.from(subMap.values());
                  } else if (currentTopCat?.children) {
                    subCategoriesToDisplay = currentTopCat.children;
                  }

                  // 2. 获取所有已勾选的一级分类
                  const allSubCatNodes: CategoryNode[] = [];
                  categoryTree.forEach((top) => {
                    top.children?.forEach((sub) => {
                      allSubCatNodes.push(sub);
                    });
                  });
                  const selectedSubCatNodes = allSubCatNodes.filter((sub) => formCategories.includes(sub.name));
                  const isSecondBoxSelected = isFirstBoxSelected && selectedSubCatNodes.length > 0;

                  // 第三列要展示的二级分类列表：勾选了一级分类时显示这些一级分类子项的合集，未勾选时显示当前高亮一级分类子项
                  let thirdCategoriesToDisplay: CategoryNode[] = [];
                  if (selectedSubCatNodes.length > 0) {
                    const thirdMap = new Map<string, CategoryNode>();
                    selectedSubCatNodes.forEach((sub) => {
                      sub.children?.forEach((third) => {
                        if (!thirdMap.has(third.id)) {
                          thirdMap.set(third.id, third);
                        }
                      });
                    });
                    thirdCategoriesToDisplay = Array.from(thirdMap.values());
                  } else if (currentSubCat?.children) {
                    thirdCategoriesToDisplay = currentSubCat.children;
                  }

                  return (
                    <div className="flex items-start gap-3 overflow-x-auto pb-1">
                      {/* 第一列（框1）：大分类 */}
                      <div className="w-[230px] shrink-0 border border-slate-200/90 rounded-xl h-60 overflow-y-auto p-1.5 space-y-0.5 bg-white shadow-2xs">
                        {categoryTree.map((topCat) => {
                          const isChecked = formCategories.includes(topCat.name);
                          const isActive = activeTopCatId === topCat.id;

                          return (
                            <div
                              key={topCat.id}
                              onClick={() => {
                                setActiveTopCatId(topCat.id);
                                if (topCat.children && topCat.children.length > 0) {
                                  setActiveSubCatId(topCat.children[0].id);
                                } else {
                                  setActiveSubCatId(null);
                                }
                                toggleCategorySelection(topCat.name);
                              }}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                                isChecked
                                  ? "bg-purple-50/70 text-[#7C3AED] font-bold"
                                  : isActive
                                  ? "bg-slate-100/80 text-slate-800 font-medium"
                                  : "text-slate-700 hover:bg-slate-50 font-normal"
                              }`}
                            >
                              <div className="shrink-0 flex items-center justify-center">
                                {isChecked ? (
                                  <span className="w-4 h-4 rounded border-2 border-[#7C3AED] bg-[#7C3AED] text-white flex items-center justify-center">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>
                                ) : (
                                  <span className="w-4 h-4 rounded border-2 border-slate-400/80 bg-white hover:border-[#7C3AED] transition-colors" />
                                )}
                              </div>
                              <span className={`truncate ${isChecked ? "text-[#7C3AED] font-bold" : "text-slate-700"}`}>
                                {topCat.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* 第二列（框2）：一级分类（仅在有选中大分类时显示，固定宽度） */}
                      {isFirstBoxSelected && subCategoriesToDisplay.length > 0 && (
                        <div className="w-[230px] shrink-0 border border-slate-200/90 rounded-xl h-60 overflow-y-auto p-1.5 space-y-0.5 bg-white shadow-2xs">
                          {subCategoriesToDisplay.map((subCat) => {
                            const isChecked = formCategories.includes(subCat.name);
                            const isActive = activeSubCatId === subCat.id;

                            return (
                              <div
                                key={subCat.id}
                                onClick={() => {
                                  setActiveSubCatId(subCat.id);
                                  toggleCategorySelection(subCat.name);
                                }}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                                  isChecked
                                    ? "bg-purple-50/70 text-[#7C3AED] font-bold"
                                    : isActive
                                    ? "bg-slate-100/80 text-slate-800 font-medium"
                                    : "text-slate-700 hover:bg-slate-50 font-normal"
                                }`}
                              >
                                <div className="shrink-0 flex items-center justify-center">
                                  {isChecked ? (
                                    <span className="w-4 h-4 rounded border-2 border-[#7C3AED] bg-[#7C3AED] text-white flex items-center justify-center">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span className="w-4 h-4 rounded border-2 border-slate-400/80 bg-white hover:border-[#7C3AED] transition-colors" />
                                  )}
                                </div>
                                <span className={`truncate ${isChecked ? "text-[#7C3AED] font-bold" : "text-slate-700"}`}>
                                  {subCat.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 第三列（框3）：二级分类（仅在有选中一级分类时显示，固定宽度） */}
                      {isSecondBoxSelected && thirdCategoriesToDisplay.length > 0 && (
                        <div className="w-[230px] shrink-0 border border-slate-200/90 rounded-xl h-60 overflow-y-auto p-1.5 space-y-0.5 bg-white shadow-2xs">
                          {thirdCategoriesToDisplay.map((thirdCat) => {
                            const isChecked = formCategories.includes(thirdCat.name);

                            return (
                              <div
                                key={thirdCat.id}
                                onClick={() => toggleCategorySelection(thirdCat.name)}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                                  isChecked ? "bg-purple-50/70 text-[#7C3AED] font-bold" : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <div className="shrink-0 flex items-center justify-center">
                                  {isChecked ? (
                                    <span className="w-4 h-4 rounded border-2 border-[#7C3AED] bg-[#7C3AED] text-white flex items-center justify-center">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span className="w-4 h-4 rounded border-2 border-slate-400/80 bg-white hover:border-[#7C3AED] transition-colors" />
                                  )}
                                </div>
                                <span className={`truncate ${isChecked ? "text-[#7C3AED] font-bold" : "text-slate-700"}`}>
                                  {thirdCat.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-6 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </form>
          </div>
        </OverlayPortal>
      )}

      {/* ========================================================================= */}
      {/* 模态框 2：删除标签组 (完全对齐截图 3)                                     */}
      {/* ========================================================================= */}
      {deletingGroupId && (
        <OverlayPortal role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">删除标签组</h3>
              <button
                type="button"
                onClick={() => setDeletingGroupId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 text-slate-700 text-xs font-medium">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  !
                </div>
                <span>请确认是否删除该标签组，删除后无法恢复</span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingGroupId(null)}
                  className="px-5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteGroup}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* ========================================================================= */}
      {/* 模态框 2.5：批量删除二级标签确认                                           */}
      {/* ========================================================================= */}
      {isBatchDeleteModalOpen && (
        <OverlayPortal role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">批量删除标签</h3>
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 text-slate-700 text-xs font-medium">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  !
                </div>
                <span>
                  请确认是否删除选中的 <strong className="text-rose-600 px-0.5">{selectedSubTagIds.length}</strong> 个二级标签，删除后无法恢复
                </span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(false)}
                  className="px-5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* ========================================================================= */}
      {/* 模态框 3：新增 / 编辑二级标签                                            */}
      {/* ========================================================================= */}
      {isAddSubTagModalOpen && (
        <OverlayPortal role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">{editingSubTagId ? "编辑二级标签" : "新增二级标签"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubTagModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitAddSubTag} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* 1. 二级标签名称 */}
              <div className="flex items-start gap-4">
                <label className="text-xs font-bold text-slate-700 w-24 text-right shrink-0 pt-2">
                  <span className="text-rose-500 mr-1">*</span>二级标签名称
                </label>
                <textarea
                  rows={3}
                  value={formSubTagNamesText}
                  onChange={(e) => setFormSubTagNamesText(e.target.value)}
                  placeholder="可一次添加多个，不同二级标签换行隔开"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400 resize-y"
                  autoFocus
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSubTagModalOpen(false)}
                  className="px-6 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </form>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
