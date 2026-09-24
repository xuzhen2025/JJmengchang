import React, { useState } from "react";
import { Edit2, Trash2, Copy, Sparkles, AlertCircle, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";
import { useResourceConfig } from "../lib/useResourceConfig";
import { RESOURCE_PARTITIONS } from "../lib/resourceConfig";
import type { CategoryL1Node, CategoryL2Node } from "../data/resourceCategories";

export type { CategoryL2Node, CategoryL1Node } from "../data/resourceCategories";



export { INITIAL_CATEGORIES } from "../data/resourceCategories";

export default function CategoryManagementSubView() {
  const resourceTypes = ["成片", "素材", "第三方", "脚本", "图片", "音频"];
  const [activeResourceType, setActiveResourceType] = useState("成片");
  const { store } = useResourceConfig();
  const categoriesData = store.getCategories();
  const setCategoriesData = store.setCategories;
  const [selectedL1Id, setSelectedL1Id] = useState("sp1-c1");
  const [selectedL2Id, setSelectedL2Id] = useState<string | null>("sp1-c1-1");

  type ModalType = "add_l1" | "add_l2" | "edit_l1" | "edit_l2" | "delete_l1" | "delete_l2";
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [targetCategory, setTargetCategory] = useState<{ id: string; name: string } | null>(null);
  const [inputCategoryName, setInputCategoryName] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  };

  const currentL1List = categoriesData[activeResourceType] || [];
  const currentL1Node = currentL1List.find(node => node.id === selectedL1Id);
  const currentL2List = currentL1Node?.children || [];

  const selectCategory = (node?: CategoryL1Node) => {
    setSelectedL1Id(node?.id || "");
    setSelectedL2Id(node?.children[0]?.id || null);
  };

  const handleResourceTypeChange = (type: string) => {
    setActiveResourceType(type);
    selectCategory(categoriesData[type]?.[0]);
  };

  const handleSelectL1 = (node: CategoryL1Node) => selectCategory(node);

  const closeModal = () => {
    setModalType(null);
    setTargetCategory(null);
    setInputCategoryName("");
  };

  const openAddModal = (level: "l1" | "l2") => {
    if (level === "l2" && !currentL1Node) {
      showToast("请先选择一级分类");
      return;
    }
    setTargetCategory(null);
    setInputCategoryName("");
    setModalType(level === "l1" ? "add_l1" : "add_l2");
  };

  const openEditModal = (level: "l1" | "l2", id: string, name: string) => {
    setTargetCategory({ id, name });
    setInputCategoryName(name);
    setModalType(level === "l1" ? "edit_l1" : "edit_l2");
  };

  const openDeleteModal = (level: "l1" | "l2", id: string, name: string) => {
    const scope = Object.keys(RESOURCE_PARTITIONS).find(key => RESOURCE_PARTITIONS[key] === activeResourceType)!;
    if (store.categoryUsage(scope, id)) { showToast("该分类下存在资源，无法删除。请先调整资源分类。"); return; }
    setTargetCategory({ id, name });
    setModalType(level === "l1" ? "delete_l1" : "delete_l2");
  };

  const handleModalConfirm = () => {
    if (!modalType) return;
    if (modalType.startsWith("delete") && targetCategory) {
      const scope = Object.keys(RESOURCE_PARTITIONS).find(key => RESOURCE_PARTITIONS[key] === activeResourceType)!;
      if (store.categoryUsage(scope, targetCategory.id)) { showToast("该分类下存在资源，无法删除。请先调整资源分类。"); return; }
    }
    const name = inputCategoryName.trim();
    if (!modalType.startsWith("delete") && !name) {
      showToast("分类名称不能为空");
      return;
    }
    if (!modalType.startsWith("add") && !targetCategory) return;
    if (!modalType.startsWith("delete")) {
      const siblings = modalType.endsWith("l1") ? currentL1List : currentL2List;
      if (siblings.some(node => node.id !== targetCategory?.id && node.name === name)) { showToast("同级分类名称不能重复"); return; }
    }

    if (modalType === "add_l1") {
      const node: CategoryL1Node = { id: `cat-l1-${Date.now()}`, name, children: [] };
      setCategoriesData(prev => ({
        ...prev, [activeResourceType]: [...prev[activeResourceType], node]
      }));
      selectCategory(node);
      showToast(`成功新增一级分类: ${name}`);
    } else if (modalType === "add_l2") {
      if (!currentL1Node) {
        showToast("请先选择一级分类");
        return;
      }
      const node: CategoryL2Node = { id: `cat-l2-${Date.now()}`, name };
      setCategoriesData(prev => ({
        ...prev,
        [activeResourceType]: prev[activeResourceType].map(l1 =>
          l1.id === selectedL1Id ? { ...l1, children: [...l1.children, node] } : l1
        )
      }));
      setSelectedL2Id(node.id);
      showToast(`成功新增二级分类: ${name}`);
    } else if (modalType === "edit_l1") {
      setCategoriesData(prev => ({
        ...prev,
        [activeResourceType]: prev[activeResourceType].map(l1 =>
          l1.id === targetCategory!.id ? { ...l1, name } : l1
        )
      }));
      showToast(`已将一级分类修改为: ${name}`);
    } else if (modalType === "edit_l2") {
      setCategoriesData(prev => ({
        ...prev,
        [activeResourceType]: prev[activeResourceType].map(l1 =>
          l1.id === selectedL1Id
            ? { ...l1, children: l1.children.map(l2 => l2.id === targetCategory!.id ? { ...l2, name } : l2) }
            : l1
        )
      }));
      showToast(`已将二级分类修改为: ${name}`);
    } else if (modalType === "delete_l1") {
      const remaining = currentL1List.filter(l1 => l1.id !== targetCategory!.id);
      setCategoriesData(prev => ({ ...prev, [activeResourceType]: remaining }));
      if (selectedL1Id === targetCategory!.id) selectCategory(remaining[0]);
      showToast("一级分类已成功删除");
    } else if (modalType === "delete_l2") {
      const remaining = currentL2List.filter(l2 => l2.id !== targetCategory!.id);
      setCategoriesData(prev => ({
        ...prev,
        [activeResourceType]: prev[activeResourceType].map(l1 =>
          l1.id === selectedL1Id ? { ...l1, children: remaining } : l1
        )
      }));
      if (selectedL2Id === targetCategory!.id) setSelectedL2Id(remaining[0]?.id || null);
      showToast("二级分类已成功删除");
    }

    closeModal();
  };

  const handleDuplicateL1 = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newName = `${name}-副本`;
    let suffix = 2;
    while (currentL1List.some(node => node.name === newName)) newName = `${name}-副本${suffix++}`;
    const newNode: CategoryL1Node = { id: `cat-l1-${Date.now()}`, name: newName, children: [] };
    setCategoriesData(prev => ({
      ...prev, [activeResourceType]: [...prev[activeResourceType], newNode]
    }));
    showToast(`已复制一级分类: ${newName}`);
  };

  const getModalTitle = () => {
    switch (modalType) {
      case "add_l1": return "新增一级分类";
      case "add_l2": return "新增二级分类";
      case "edit_l1": return "编辑一级分类";
      case "edit_l2": return "编辑二级分类";
      case "delete_l1": return "删除一级分类";
      case "delete_l2": return "删除二级分类";
      default: return "";
    }
  };

  return (
    <div data-testid="category-management" className="space-y-5 text-slate-800 font-sans">
      {/* Toast */}
      {toastMessage && (
        <OverlayPortal layer="toast" role="status" className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </OverlayPortal>
      )}

      {/* Top Resource Types Tabs */}
      <div className="border-b border-slate-200/80 flex items-center gap-8 px-2 overflow-x-auto text-xs font-bold">
        {resourceTypes.map((type) => {
          const isActive = activeResourceType === type;
          return (
            <button
              key={type}
              onClick={() => handleResourceTypeChange(type)}
              className={`pb-3.5 transition-all cursor-pointer whitespace-nowrap relative ${
                isActive
                  ? "text-[#7C3AED] font-bold border-b-2 border-[#7C3AED] -mb-[1px]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* 一级分类 */}
        <div data-testid="category-primary" className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/80 min-h-[420px] flex flex-col justify-between">
          <div className="space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="font-bold text-slate-800 text-xs">一级分类</span>
              <button
                onClick={() => openAddModal("l1")}
                className="bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                添加
              </button>
            </div>

            {/* List of L1 Categories */}
            <div className="space-y-1">
              {currentL1List.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  暂无一级分类，请点击上方“添加”
                </div>
              ) : (
                currentL1List.map((node) => {
                  const isSelected = node.id === selectedL1Id;
                  return (
                    <div
                      key={node.id}
                      data-category-id={node.id}
                      onClick={() => handleSelectL1(node)}
                      className={`px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? "bg-[#7C3AED] text-white font-bold shadow-xs"
                          : "hover:bg-slate-100 text-slate-700 font-medium"
                      }`}
                    >
                      <span className="text-xs truncate">{node.name}</span>
                      
                      {/* Action Icons */}
                      <div className={`flex items-center gap-1 ${isSelected ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-100"}`}>
                        <button
                          onClick={(e) => handleDuplicateL1(node.name, e)}
                          className={`p-1 rounded transition-colors ${isSelected ? "hover:bg-purple-500 text-purple-100" : "text-slate-400 hover:text-purple-600 hover:bg-slate-200"}`}
                          title="复制分类"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal("l1", node.id, node.name);
                          }}
                          className={`p-1 rounded transition-colors ${isSelected ? "hover:bg-purple-500 text-purple-100" : "text-slate-400 hover:text-purple-600 hover:bg-slate-200"}`}
                          title="编辑名称"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal("l1", node.id, node.name);
                          }}
                          className={`p-1 rounded transition-colors ${isSelected ? "hover:bg-purple-500 text-purple-100" : "text-slate-400 hover:text-rose-600 hover:bg-slate-200"}`}
                          title="删除分类"
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
        </div>

        {/* 二级分类 */}
        <div data-testid="category-secondary" className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/80 min-h-[420px] flex flex-col justify-between">
          <div className="space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="font-bold text-slate-800 text-xs">二级分类</span>
              <button
                onClick={() => openAddModal("l2")}
                className="bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                添加
              </button>
            </div>

            {/* List of L2 Categories */}
            <div className="space-y-1">
              {currentL2List.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  暂无二级分类，请点击上方“添加”
                </div>
              ) : (
                currentL2List.map((child) => {
                  const isSelected = child.id === selectedL2Id;
                  return (
                    <div
                      key={child.id}
                      data-category-id={child.id}
                      onClick={() => setSelectedL2Id(child.id)}
                      className={`px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? "bg-purple-100 text-purple-800 font-bold border border-purple-300"
                          : "hover:bg-slate-100 text-slate-700 font-medium"
                      }`}
                    >
                      <span className="text-xs truncate">{child.name}</span>

                      {/* Action Icons */}
                      <div className={`flex items-center gap-1 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal("l2", child.id, child.name);
                          }}
                          className="p-1 text-slate-400 hover:text-purple-600 rounded hover:bg-slate-100 transition-colors"
                          title="编辑名称"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal("l2", child.id, child.name);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="删除分类"
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
        </div>

      </div>

      {/* MODAL: Add / Edit Category Modal */}
      {(modalType?.startsWith("add") || modalType?.startsWith("edit")) && (
        <OverlayPortal role="dialog" aria-modal="true" aria-label={getModalTitle()} onKeyDown={e => { if (e.key === "Escape") closeModal(); }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-32px)] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-600 rounded-full" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {getModalTitle()}
                </h3>
              </div>
              <button
                onClick={closeModal}
                aria-label="关闭"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 shrink-0 w-20 text-right">
                  <span className="text-rose-500 mr-0.5">*</span>名称
                </label>
                <input
                  type="text"
                  aria-label="分类名称"
                  placeholder="请输入名称"
                  value={inputCategoryName}
                  onChange={(e) => setInputCategoryName(e.target.value)}
                  autoFocus
                  className="flex-1 border border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold px-5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleModalConfirm}
                className="bg-[#7C3AED] hover:bg-purple-700 text-white font-bold px-6 py-1.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* MODAL: Delete Category Confirmation Modal */}
      {(modalType?.startsWith("delete")) && (
        <OverlayPortal role="dialog" aria-modal="true" aria-label={getModalTitle()} onKeyDown={e => { if (e.key === "Escape") closeModal(); }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[calc(100dvh-32px)] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">{getModalTitle()}</h3>
              <button
                onClick={closeModal}
                aria-label="关闭"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                请确认是否删除“{targetCategory?.name}”，删除后无法恢复
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold px-5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleModalConfirm}
                className="bg-[#7C3AED] hover:bg-purple-700 text-white font-bold px-6 py-1.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

    </div>
  );
}
