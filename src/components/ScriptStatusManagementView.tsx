import React, { useState } from "react";
import { useResourceConfig } from "../lib/useResourceConfig";
import type { ResourceStatusItem } from "../lib/resourceConfig";
import OverlayPortal from "./overlays/OverlayPortal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { Plus, X, AlertCircle, ChevronDown, Check } from "lucide-react";

export type ScriptStatusItem = ResourceStatusItem;

// 预设颜色选项
const PRESET_COLORS = [
  { label: "爱马仕橙", value: "#EA580C" },
  { label: "亮亮红", value: "#DC2626" },
  { label: "高贵紫", value: "#9333EA" },
  { label: "科技蓝", value: "#2563EB" },
  { label: "翡翠绿", value: "#059669" },
  { label: "纯洁白", value: "#FFFFFF" },
  { label: "深邃黑", value: "#1E293B" },
  { label: "质感灰", value: "#64748B" },
];

export default function ScriptStatusManagementView() {
  const { store } = useResourceConfig();
  // 1. 顶部全局功能配置
  const [globalEnabled, setGlobalEnabled] = useState(() => store.getSettings("script").enabled);

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // 2. 状态列表数据 (完全比对截图1、2、3、4)
  const statusList = store.getStatusCatalog("script");
  const setStatusList = (update: React.SetStateAction<ResourceStatusItem[]>) => {
    try { store.setStatusCatalog("script", update); return true; }
    catch (error) { showToast((error as Error).message); return false; }
  };

  // 3. 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScriptStatusItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ScriptStatusItem | null>(null);

  // 新增/编辑 表单状态
  const [formName, setFormName] = useState("");
  const [formWeight, setFormWeight] = useState<number | "">("");

  // 删除表单状态
  const [replaceOtherStatus, setReplaceOtherStatus] = useState(false);
  const [replacementStatusId, setReplacementStatusId] = useState("");

  // 4. Color Picker 状态
  const [activeColorPicker, setActiveColorPicker] = useState<{
    itemId: string;
    type: "textColor" | "bgColor";
  } | null>(null);

  // 保存顶部全局设置
  const handleSaveGlobalConfig = () => {
    store.setSettings("script", { enabled: globalEnabled, partitions: ["脚本"] });
    showToast("状态功能配置保存成功！");
  };

  // 打开新增模态框
  const handleOpenAddModal = () => {
    setFormName("");
    setFormWeight("");
    setIsAddModalOpen(true);
  };

  // 提交新增状态
  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("请输入状态名称");
      return;
    }

    const newWeight = formWeight === "" ? 0 : Number(formWeight);
    const newItem: ScriptStatusItem = {
      partitions: ["脚本"],
      id: `ss-${Date.now()}`,
      name: formName.trim(),
      textColor: "#FFFFFF",
      bgColor: "#EA580C", // 默认橙色
      weight: newWeight,
      notifyEnabled: true,
      isDefault: statusList.length === 0,
    };

    if (!setStatusList((prev) => [...prev, newItem])) return;
    setIsAddModalOpen(false);
    showToast(`创建脚本状态 [${newItem.name}] 成功！`);
  };

  // 打开编辑模态框
  const handleOpenEditModal = (item: ScriptStatusItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormWeight(item.weight);
  };

  // 提交编辑状态
  const handleEditStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!formName.trim()) {
      showToast("状态名称不能为空");
      return;
    }

    const newWeight = formWeight === "" ? 0 : Number(formWeight);
    if (!setStatusList((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formName.trim(),
              weight: newWeight,
            }
          : item
      )
    )) return;

    setEditingItem(null);
    showToast(`脚本状态 [${formName.trim()}] 更新成功！`);
  };

  // 打开删除模态框
  const handleOpenDeleteModal = (item: ScriptStatusItem) => {
    setDeletingItem(item);
    setReplaceOtherStatus(false);
    const otherItems = store.replacementStatuses("script", item.id);
    setReplacementStatusId(otherItems.length > 0 ? otherItems[0].id : "");
  };

  // 确认删除状态
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    try {
      store.deleteStatus("script", deletingItem.id, replaceOtherStatus ? replacementStatusId : undefined);
      setDeletingItem(null);
      showToast(replaceOtherStatus ? "状态已删除，关联资源已替换为所选状态" : "状态已删除");
    } catch (error) { showToast((error as Error).message); }
  };

  // 设为默认值
  const handleSetDefault = (id: string) => {
    setStatusList((prev) =>
      prev.map((item) => ({
        ...item,
        isDefault: item.id === id,
      }))
    );
    const item = statusList.find((s) => s.id === id);
    if (item) {
      showToast(`已将 [${item.name}] 设为默认脚本状态`);
    }
  };

  // 切换消息通知
  const handleToggleNotify = (id: string) => {
    setStatusList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextVal = !item.notifyEnabled;
          showToast(`已${nextVal ? "开启" : "关闭"} [${item.name}] 的消息通知`);
          return { ...item, notifyEnabled: nextVal };
        }
        return item;
      })
    );
  };

  // 修改颜色
  const handleChangeColor = (
    id: string,
    type: "textColor" | "bgColor",
    colorHex: string
  ) => {
    setStatusList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [type]: colorHex } : item))
    );
    setActiveColorPicker(null);
  };

  return (
    <div className="flex-1 p-6 space-y-6 animate-fade-in w-full relative min-h-0 overflow-y-auto">
      {/* Toast 提示框 */}
      {toastMsg && (
        <OverlayPortal layer="toast" role="status" className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <span>{toastMsg}</span>
        </OverlayPortal>
      )}

      {/* 顶部：状态功能开关 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 px-6 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-800">状态功能开关</span>
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

        <button
          type="button"
          onClick={handleSaveGlobalConfig}
          className="px-5 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          保存
        </button>
      </div>

      {/* 脚本状态列表表格 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-700 text-xs font-bold">
                {/* 状态 + 新增状态 */}
                <th className="py-3.5 px-6 w-64">
                  <div className="flex items-center gap-4">
                    <span>状态</span>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="text-[#7C3AED] hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>新增状态</span>
                    </button>
                  </div>
                </th>

                <th className="py-3.5 px-6 font-bold">字体颜色</th>
                <th className="py-3.5 px-6 font-bold">背景颜色</th>
                <th className="py-3.5 px-6 font-bold">权重</th>
                <th className="py-3.5 px-6 font-bold">消息通知</th>
                <th className="py-3.5 px-6 text-right font-bold pr-8">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/80 text-slate-700 text-xs font-medium">
              {statusList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* 状态列 */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      {/* 动态 Pill 样式 */}
                      <span
                        className="px-3 py-1 rounded-md text-xs font-bold inline-block shadow-2xs"
                        style={{
                          backgroundColor: item.bgColor,
                          color: item.textColor,
                        }}
                      >
                        {item.name}
                      </span>

                      {/* 默认值徽章 */}
                      {item.isDefault && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-[#7C3AED] border border-purple-200/80 text-[11px] font-bold">
                          默认值
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 字体颜色列 */}
                  <td className="py-4 px-6 relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveColorPicker(
                          activeColorPicker?.itemId === item.id &&
                            activeColorPicker?.type === "textColor"
                            ? null
                            : { itemId: item.id, type: "textColor" }
                        )
                      }
                      className="w-8 h-8 rounded-lg border border-slate-200 p-1 flex items-center justify-center bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                      title="点击设置字体颜色"
                    >
                      <span
                        className="w-full h-full rounded-md border border-black/10"
                        style={{ backgroundColor: item.textColor }}
                      />
                    </button>

                    {/* Color Picker Popover */}
                    {activeColorPicker?.itemId === item.id &&
                      activeColorPicker?.type === "textColor" && (
                        <ColorPickerPopover
                          currentColor={item.textColor}
                          onChange={(color) =>
                            handleChangeColor(item.id, "textColor", color)
                          }
                          onClose={() => setActiveColorPicker(null)}
                        />
                      )}
                  </td>

                  {/* 背景颜色列 */}
                  <td className="py-4 px-6 relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveColorPicker(
                          activeColorPicker?.itemId === item.id &&
                            activeColorPicker?.type === "bgColor"
                            ? null
                            : { itemId: item.id, type: "bgColor" }
                        )
                      }
                      className="w-9 h-8 rounded-lg border border-slate-200 px-1.5 flex items-center justify-between bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                      title="点击设置背景颜色"
                    >
                      <span
                        className="w-5 h-5 rounded-md border border-black/10"
                        style={{ backgroundColor: item.bgColor }}
                      />
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Color Picker Popover */}
                    {activeColorPicker?.itemId === item.id &&
                      activeColorPicker?.type === "bgColor" && (
                        <ColorPickerPopover
                          currentColor={item.bgColor}
                          onChange={(color) =>
                            handleChangeColor(item.id, "bgColor", color)
                          }
                          onClose={() => setActiveColorPicker(null)}
                        />
                      )}
                  </td>

                  {/* 权重 */}
                  <td className="py-4 px-6 font-mono text-xs text-slate-600 font-bold">
                    {item.weight}
                  </td>

                  {/* 消息通知 Toggle */}
                  <td className="py-4 px-6">
                    <button
                      type="button"
                      onClick={() => handleToggleNotify(item.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-hidden p-0.5 shrink-0 inline-block align-middle ${
                        item.notifyEnabled ? "bg-[#7C3AED]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
                          item.notifyEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>

                  {/* 操作列 */}
                  <td className="py-4 px-6 text-right pr-8 space-x-3">
                    <button
                      type="button"
                      disabled={item.isDefault}
                      onClick={() => handleSetDefault(item.id)}
                      className={`font-bold transition-colors ${
                        item.isDefault
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-[#7C3AED] hover:underline cursor-pointer"
                      }`}
                    >
                      设为默认值
                    </button>

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

      {/* ==================== 模态框 1：新增状态 ==================== */}
      {isAddModalOpen && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-y-auto max-h-[calc(100dvh-32px)] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">新增状态</h3>
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
            <form onSubmit={handleAddStatus} className="p-6 space-y-5">
              {/* 状态名称 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>状态名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入状态名称"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              {/* 权重 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  权重
                </label>
                <input
                  type="number"
                  value={formWeight}
                  onChange={(e) =>
                    setFormWeight(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="请输入权重数字(0-999)数字越大排越前面"
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>

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

      {/* ==================== 模态框 2：编辑状态 ==================== */}
      {editingItem && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-y-auto max-h-[calc(100dvh-32px)] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">编辑状态</h3>
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
            <form onSubmit={handleEditStatus} className="p-6 space-y-5">
              {/* 状态名称 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>状态名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入状态名称"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800"
                />
              </div>

              {/* 权重 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">
                  权重
                </label>
                <input
                  type="number"
                  value={formWeight}
                  onChange={(e) =>
                    setFormWeight(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="请输入权重数字(0-999)数字越大排越前面"
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800"
                />
              </div>

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

      {/* ==================== 模态框 3：删除状态 ==================== */}
      {deletingItem && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-y-auto max-h-[calc(100dvh-32px)] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">删除状态</h3>
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
              {/* 提示信息 */}
              <div className="flex items-center gap-3 text-slate-700 text-xs font-medium pl-6">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  !
                </div>
                <span>请确认是否删除该状态，删除后无法恢复</span>
              </div>

              {/* 是否替换成其他状态 Checkbox */}
              <div className="pl-14 space-y-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceOtherStatus}
                    onChange={(e) => setReplaceOtherStatus(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#7C3AED] focus:ring-purple-200 cursor-pointer"
                  />
                  <span>是否替换成其他状态</span>
                </label>

                {/* Dropdown if checked */}
                {replaceOtherStatus && (
                  <div>
                    <select
                      value={replacementStatusId}
                      onChange={(e) => setReplacementStatusId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#7C3AED]"
                    >
                      {store.replacementStatuses("script", deletingItem.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
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

// ----------------------------------------------------------------------
// Color Picker Popover 辅助组件
// ----------------------------------------------------------------------
function ColorPickerPopover({
  currentColor,
  onChange,
  onClose,
}: {
  currentColor: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const [customHex, setCustomHex] = useState(currentColor);
  const anchorRef = React.useRef<HTMLSpanElement>(null);

  return (
    <>
      {/* 透明 BackDrop 用于点击外部关闭 */}
      <span ref={anchorRef} className="absolute top-full left-0 right-0 h-px pointer-events-none" />

      <AnchoredPopover anchorRef={anchorRef} onClose={onClose} width={240} maxHeight={380} gap={6} className="bg-white rounded-lg border border-slate-200 shadow-xl p-3 space-y-3 text-left">
        <div className="text-[11px] font-bold text-slate-500">预设调色板</div>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className="w-full aspect-square rounded-md border border-slate-200 relative flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
              style={{ backgroundColor: c.value }}
              title={c.label}
            >
              {currentColor.toUpperCase() === c.value.toUpperCase() && (
                <Check
                  className={`w-3.5 h-3.5 ${
                    c.value === "#FFFFFF" ? "text-slate-800" : "text-white"
                  }`}
                />
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-2.5">
          <div className="text-[11px] font-bold text-slate-500 mb-1.5">自定义 HEX 颜色</div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 shrink-0"
            />
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => onChange(customHex)}
              className="px-2 py-1 bg-[#7C3AED] text-white text-[11px] font-bold rounded cursor-pointer hover:bg-purple-700"
            >
              应用
            </button>
          </div>
        </div>
      </AnchoredPopover>
    </>
  );
}
