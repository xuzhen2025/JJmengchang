import React, { useState } from "react";
import { useTaskFields } from "../lib/useTaskFields";
import type { TaskFieldItem } from "../lib/taskFieldConfig";
import OverlayPortal from "./overlays/OverlayPortal";
import { Plus, X, Trash2, GripVertical } from "lucide-react";

export type { TaskFieldItem } from "../lib/taskFieldConfig";

export default function TaskFieldsManagementView() {
  const { fields, settings, store } = useTaskFields();
  // 1. 顶部配置
  const [globalEnabled, setGlobalEnabled] = useState(settings.enabled);
  const [assignTarget, setAssignTarget] = useState(settings.assignTarget);

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // 2. 字段列表数据（与截图完全一致）
  const fieldsList = fields;
  const setFieldsList = (update: React.SetStateAction<TaskFieldItem[]>) => {
    try { store.setFields(update); return true; }
    catch (error) { showToast((error as Error).message); return false; }
  };

  // 3. 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaskFieldItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<TaskFieldItem | null>(null);

  // 表单状态：新增 & 编辑
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("单选");
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formOptions, setFormOptions] = useState<string[]>([]);

  // 拖拽/排序状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 保存顶部任务指派配置
  const handleSaveConfig = () => {
    store.setSettings({ enabled: globalEnabled, assignTarget });
    showToast("任务功能配置与指派规则保存成功！");
  };

  // 打开新增模态框
  const handleOpenAddModal = () => {
    setFormName("");
    setFormType("多选");
    setFormIsRequired(false);
    setFormOptions(["选项1", "选项2"]);
    setIsAddModalOpen(true);
  };

  // 提交新增字段
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("请输入字段名称");
      return;
    }

    const newItem: TaskFieldItem = {
      id: `tf-${Date.now()}`,
      name: formName.trim(),
      type: formType,
      isRequired: formIsRequired,
      options:
        formType === "单选" || formType === "多选"
          ? formOptions.filter((o) => o.trim().length > 0)
          : [],
    };

    if (!setFieldsList((prev) => [...prev, newItem])) return;
    setIsAddModalOpen(false);
    showToast(`新增任务字段 [${newItem.name}] 成功！`);
  };

  // 打开编辑模态框
  const handleOpenEditModal = (item: TaskFieldItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormIsRequired(item.isRequired);
    setFormOptions(item.options.length > 0 ? [...item.options] : ["选项1", "选项2"]);
  };

  // 提交编辑字段
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!formName.trim()) {
      showToast("字段名称不能为空");
      return;
    }

    if (!setFieldsList((prev) =>
      prev.map((f) =>
        f.id === editingItem.id
          ? {
              ...f,
              name: formName.trim(),
              type: formType,
              isRequired: formIsRequired,
              options:
                formType === "单选" || formType === "多选"
                  ? formOptions.filter((o) => o.trim().length > 0)
                  : [],
            }
          : f
      )
    )) return;

    setEditingItem(null);
    showToast(`任务字段 [${formName.trim()}] 更新成功！`);
  };

  // 打开删除模态框
  const handleOpenDeleteModal = (item: TaskFieldItem) => {
    setDeletingItem(item);
  };

  // 确认删除字段
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    setFieldsList((prev) => prev.filter((f) => f.id !== deletingItem.id));
    showToast(`任务字段 [${deletingItem.name}] 已成功删除`);
    setDeletingItem(null);
  };

  // 选项动态增删
  const handleAddOption = () => {
    setFormOptions((prev) => [...prev, `选项${prev.length + 1}`]);
  };

  const handleUpdateOption = (index: number, val: string) => {
    setFormOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveOption = (index: number) => {
    setFormOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // HTML5 原生 HTML拖拽排序
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedList = [...fieldsList];
    const [draggedItem] = updatedList.splice(draggedIndex, 1);
    updatedList.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setFieldsList(updatedList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    showToast("字段排序已更新");
  };

  // 排序升/降操作
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...fieldsList];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setFieldsList(updated);
    showToast("排序已调整");
  };

  return (
    <div className="flex-1 p-6 space-y-6 animate-fade-in w-full relative min-h-0 overflow-y-auto">
      {/* Toast 提示 */}
      {toastMsg && (
        <OverlayPortal layer="toast" role="status" className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <span>{toastMsg}</span>
        </OverlayPortal>
      )}

      {/* 1. 顶部：任务功能开关 + 能指派任务给谁 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 px-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-8">
          {/* 开关 */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800">任务功能开关</span>
            <button
              type="button"
              onClick={() => setGlobalEnabled(!globalEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-hidden p-0.5 shrink-0 ${
                globalEnabled ? "bg-[#7C3AED]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
                  globalEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 指派目标 */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-800">能指派任务给谁</span>
            <div className="flex items-center gap-5 text-xs text-slate-700 font-medium">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignTarget"
                  checked={assignTarget === "all"}
                  onChange={() => setAssignTarget("all")}
                  className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 border-slate-300 cursor-pointer accent-[#7C3AED]"
                />
                <span className={assignTarget === "all" ? "text-[#7C3AED] font-bold" : ""}>
                  公司所有人
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignTarget"
                  checked={assignTarget === "team"}
                  onChange={() => setAssignTarget("team")}
                  className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 border-slate-300 cursor-pointer accent-[#7C3AED]"
                />
                <span className={assignTarget === "team" ? "text-[#7C3AED] font-bold" : ""}>
                  部门成员
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignTarget"
                  checked={assignTarget === "group"}
                  onChange={() => setAssignTarget("group")}
                  className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 border-slate-300 cursor-pointer accent-[#7C3AED]"
                />
                <span className={assignTarget === "group" ? "text-[#7C3AED] font-bold" : ""}>
                  分组成员
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          type="button"
          onClick={handleSaveConfig}
          className="px-5 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          保存
        </button>
      </div>

      {/* 2. 字段列表 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-700 text-xs font-bold">
                {/* 字段名称 + 新增字段 */}
                <th className="py-3.5 px-6 w-72">
                  <div className="flex items-center gap-4">
                    <span>字段名称</span>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="text-[#7C3AED] hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>新增字段</span>
                    </button>
                  </div>
                </th>

                <th className="py-3.5 px-6 font-bold w-32">类型</th>
                <th className="py-3.5 px-6 font-bold">取值范围</th>
                <th className="py-3.5 px-6 text-right font-bold pr-8 w-48">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/80 text-slate-700 text-xs font-medium">
              {fieldsList.map((item, index) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    draggedIndex === index ? "opacity-40 bg-purple-50/50" : ""
                  }`}
                >
                  {/* 字段名称 */}
                  <td className="py-4 px-6 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </td>

                  {/* 类型 */}
                  <td className="py-4 px-6 text-slate-600 font-medium">{item.type}</td>

                  {/* 取值范围 */}
                  <td className="py-4 px-6 text-slate-600 font-medium max-w-xl">
                    {item.options.length > 0 ? (
                      <span className="break-words leading-relaxed">
                        {item.options.join(",")}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* 操作: 编辑 | 删除 */}
                  <td className="py-4 px-6 text-right pr-8 space-x-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="text-[#7C3AED] font-bold hover:underline cursor-pointer"
                    >
                      编辑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(item)}
                      className="text-slate-400 font-bold hover:text-rose-600 cursor-pointer transition-colors"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 模态框 1：新增字段 ==================== */}
      {isAddModalOpen && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-y-auto max-h-[calc(100dvh-32px)] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">新增字段</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              {/* 字段名称 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>字段名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入字段名称"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              {/* 类型 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>类型
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 cursor-pointer"
                >
                  <option value="单选">单选</option>
                  <option value="多选">多选</option>
                  <option value="文本">文本</option>
                  <option value="链接">链接</option>
                  <option value="数字">数字</option>
                  <option value="时间">时间</option>
                </select>
              </div>

              {/* 是否必填 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  是否必填
                </label>
                <div className="flex items-center gap-6 text-xs text-slate-700 font-medium">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isRequired"
                      checked={!formIsRequired}
                      onChange={() => setFormIsRequired(false)}
                      className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 border-slate-300 cursor-pointer accent-[#7C3AED]"
                    />
                    <span className={!formIsRequired ? "text-[#7C3AED] font-bold" : ""}>
                      非必填
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isRequired"
                      checked={formIsRequired}
                      onChange={() => setFormIsRequired(true)}
                      className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 border-slate-300 cursor-pointer accent-[#7C3AED]"
                    />
                    <span className={formIsRequired ? "text-[#7C3AED] font-bold" : ""}>
                      必填
                    </span>
                  </label>
                </div>
              </div>

              {/* 如果是单选/多选，允许编辑选项 */}
              {(formType === "单选" || formType === "多选") && (
                <div className="pl-24 space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer transition-colors"
                    >
                      + 添加一个选项
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(idx, e.target.value)}
                          placeholder={`选项 ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 border border-slate-200 focus:border-[#7C3AED] rounded-lg text-xs outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </form>
          </div>
        </OverlayPortal>
      )}

      {/* ==================== 模态框 2：编辑字段 (完全匹配截图4) ==================== */}
      {editingItem && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-y-auto max-h-[calc(100dvh-32px)] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">编辑字段</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {/* 字段名称 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>字段名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入字段名称"
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800"
                />
              </div>

              {/* 类型 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>类型
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 cursor-pointer"
                >
                  <option value="单选">单选</option>
                  <option value="多选">多选</option>
                  <option value="文本">文本</option>
                  <option value="链接">链接</option>
                  <option value="数字">数字</option>
                  <option value="时间">时间</option>
                </select>
              </div>

              {/* 是否必填 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  是否必填
                </label>
                <div className="flex items-center gap-6 text-xs text-slate-700 font-medium">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editIsRequired"
                      checked={!formIsRequired}
                      onChange={() => setFormIsRequired(false)}
                      className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 border-slate-300 cursor-pointer accent-[#7C3AED]"
                    />
                    <span className={!formIsRequired ? "text-[#7C3AED] font-bold" : ""}>
                      非必填
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editIsRequired"
                      checked={formIsRequired}
                      onChange={() => setFormIsRequired(true)}
                      className="w-4 h-4 text-[#7C3AED] focus:ring-purple-200 border-slate-300 cursor-pointer accent-[#7C3AED]"
                    />
                    <span className={formIsRequired ? "text-[#7C3AED] font-bold" : ""}>
                      必填
                    </span>
                  </label>
                </div>
              </div>

              {/* 选项增加列表 (针对单选/多选) */}
              {(formType === "单选" || formType === "多选") && (
                <div className="pl-24 space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer transition-colors"
                  >
                    添加一个选项
                  </button>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {formOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 cursor-grab" />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(idx, e.target.value)}
                          placeholder={`选项 ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 border border-slate-200 focus:border-[#7C3AED] rounded-lg text-xs outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </form>
          </div>
        </OverlayPortal>
      )}

      {/* ==================== 模态框 3：删除字段 (完全匹配截图5) ==================== */}
      {deletingItem && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-y-auto max-h-[calc(100dvh-32px)] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">删除字段</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 text-slate-700 text-xs font-medium">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  !
                </div>
                <span>请确认是否删除该字段，删除后无法恢复</span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
