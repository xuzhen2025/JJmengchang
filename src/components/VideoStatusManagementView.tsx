import React, { useState } from "react";
import { useResourceConfig } from "../lib/useResourceConfig";
import type { ResourceStatusItem } from "../lib/resourceConfig";
import OverlayPortal from "./overlays/OverlayPortal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { Plus, X, AlertCircle, ChevronDown, Check } from "lucide-react";

export type VideoStatusItem = ResourceStatusItem;

const PARTITION_OPTIONS = ["成片", "素材", "第三方"];

// 分区简写与特定背景色
const PARTITION_BADGES: Record<string, { label: string; bg: string }> = {
  成片: { label: "成", bg: "bg-[#06B6D4]" }, // 青色
  素材: { label: "素", bg: "bg-[#7C3AED]" }, // 紫色
  第三方: { label: "三", bg: "bg-[#2563EB]" },
};

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

export default function VideoStatusManagementView() {
  const { store } = useResourceConfig();
  // 1. 顶部全局功能配置
  const [globalEnabled, setGlobalEnabled] = useState(() => store.getSettings("video").enabled);
  const [globalPartitions, setGlobalPartitions] = useState(() => store.getSettings("video").partitions);

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // 2. 状态列表数据 (完全比对截图2、3、4)
  const statusList = store.getStatusCatalog("video");
  const setStatusList = (update: React.SetStateAction<ResourceStatusItem[]>) => {
    try { store.setStatusCatalog("video", update); return true; }
    catch (error) { showToast((error as Error).message); return false; }
  };

  // 3. 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoStatusItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<VideoStatusItem | null>(null);

  // 新增/编辑 表单状态
  const [formName, setFormName] = useState("");
  const [formPartitions, setFormPartitions] = useState<string[]>([]);
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
    store.setSettings("video", { enabled: globalEnabled, partitions: globalPartitions });
    showToast("状态功能与显示分区配置保存成功！");
  };

  // 全局分区勾选切换
  const toggleGlobalPartition = (p: string) => {
    if (globalPartitions.includes(p)) {
      setGlobalPartitions(globalPartitions.filter((item) => item !== p));
    } else {
      setGlobalPartitions([...globalPartitions, p]);
    }
  };

  // 打开新增模态框
  const handleOpenAddModal = () => {
    setFormName("");
    setFormPartitions([...PARTITION_OPTIONS]);
    setFormWeight("");
    setIsAddModalOpen(true);
  };

  // 提交新增
  const handleConfirmAdd = () => {
    if (!formName.trim()) {
      showToast("请输入状态名称");
      return;
    }
    if (formPartitions.length === 0) {
      showToast("请至少选择一个关联分区");
      return;
    }

    const newItem: VideoStatusItem = {
      id: `vs-${Date.now()}`,
      name: formName.trim(),
      partitions: formPartitions,
      textColor: "#FFFFFF",
      bgColor: "#7C3AED", // 默认紫底白字
      weight: typeof formWeight === "number" ? formWeight : 0,
      notifyEnabled: true,
      isDefault: false,
    };

    // 按权重降序排序放置
    const updated = [...statusList, newItem].sort((a, b) => b.weight - a.weight);
    if (!setStatusList(updated)) return;
    setIsAddModalOpen(false);
    showToast(`新增状态【${newItem.name}】成功！`);
  };

  // 打开编辑模态框
  const handleOpenEditModal = (item: VideoStatusItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPartitions(item.partitions);
    setFormWeight(item.weight);
  };

  // 提交编辑
  const handleConfirmEdit = () => {
    if (!editingItem) return;
    if (!formName.trim()) {
      showToast("状态名称不能为空");
      return;
    }
    if (formPartitions.length === 0) {
      showToast("请至少选择一个关联分区");
      return;
    }

    const updated = statusList
      .map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: formName.trim(),
            partitions: formPartitions,
            weight: typeof formWeight === "number" ? formWeight : 0,
          };
        }
        return item;
      })
      .sort((a, b) => b.weight - a.weight);

    if (!setStatusList(updated)) return;
    setEditingItem(null);
    showToast(`修改状态【${formName.trim()}】成功！`);
  };

  // 打开删除模态框
  const handleOpenDeleteModal = (item: VideoStatusItem) => {
    setDeletingItem(item);
    setReplaceOtherStatus(false);
    // 默认选取第一个其他可用的状态
    const other = store.replacementStatuses("video", item.id)[0];
    setReplacementStatusId(other ? other.id : "");
  };

  // 确认删除
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    try {
      store.deleteStatus("video", deletingItem.id, replaceOtherStatus ? replacementStatusId : undefined);
      setDeletingItem(null);
      showToast(replaceOtherStatus ? "状态已删除，关联资源已替换为所选状态" : "状态已删除");
    } catch (error) { showToast((error as Error).message); }
  };

  // 设为默认值
  const handleSetDefault = (id: string) => {
    const updated = statusList.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    setStatusList(updated);
    const target = statusList.find((item) => item.id === id);
    if (target) {
      showToast(`已将【${target.name}】设为默认状态`);
    }
  };

  // 切换单项消息通知
  const toggleNotify = (id: string) => {
    setStatusList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextVal = !item.notifyEnabled;
          showToast(`已${nextVal ? "开启" : "关闭"}【${item.name}】的状态消息通知`);
          return { ...item, notifyEnabled: nextVal };
        }
        return item;
      })
    );
  };

  // 修改颜色
  const handleChangeColor = (
    itemId: string,
    type: "textColor" | "bgColor",
    colorHex: string
  ) => {
    setStatusList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, [type]: colorHex };
        }
        return item;
      })
    );
  };

  // 表单中复选框 Toggle
  const toggleFormPartition = (p: string) => {
    if (formPartitions.includes(p)) {
      setFormPartitions(formPartitions.filter((i) => i !== p));
    } else {
      setFormPartitions([...formPartitions, p]);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50/50 min-h-0 overflow-y-auto">
      {/* Toast 提示框 */}
      {toastMsg && (
        <OverlayPortal layer="toast" role="status" className="fixed top-5 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Check className="w-4 h-4 text-purple-400" />
          <span>{toastMsg}</span>
        </OverlayPortal>
      )}

      {/* 顶部控制栏 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 px-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-8">
          {/* 状态功能开关 */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800">
              状态功能开关
            </span>
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

          {/* 请选择需要显示状态的分区 */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold text-slate-700">
              请选择需要显示状态的分区
            </span>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
              {PARTITION_OPTIONS.map((p) => {
                const isChecked = globalPartitions.includes(p);
                return (
                  <label
                    key={p}
                    className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none hover:text-purple-600 font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleGlobalPartition(p)}
                      className="w-4 h-4 rounded text-[#7C3AED] focus:ring-purple-200 border-slate-300 accent-[#7C3AED] cursor-pointer"
                    />
                    <span>{p}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          type="button"
          onClick={handleSaveGlobalConfig}
          className="px-5 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          保存
        </button>
      </div>

      {/* 视频状态列表表格 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-700 text-xs font-bold">
                {/* 状态列与新增状态按钮 */}
                <th className="py-3.5 px-6 w-56">
                  <div className="flex items-center gap-3">
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
                <th className="py-3.5 px-4 font-bold">关联分区</th>
                <th className="py-3.5 px-4 text-center font-bold">字体颜色</th>
                <th className="py-3.5 px-4 text-center font-bold">背景颜色</th>
                <th className="py-3.5 px-4 text-center font-bold">权重</th>
                <th className="py-3.5 px-4 text-center font-bold">消息通知</th>
                <th className="py-3.5 px-6 text-right font-bold">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/80 text-slate-700 text-xs font-medium">
              {statusList.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* 状态名称胶囊与默认值标签 */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold shadow-2xs inline-block transition-colors"
                        style={{
                          color: item.textColor,
                          backgroundColor: item.bgColor,
                        }}
                      >
                        {item.name}
                      </span>
                      {item.isDefault && (
                        <span className="px-2 py-0.5 bg-purple-50 text-[#7C3AED] border border-purple-200/60 rounded text-[11px] font-bold">
                          默认值
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 关联分区图标徽章 (成/素/三/文) */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      {PARTITION_OPTIONS.map((p) => {
                        const hasIt = item.partitions.includes(p);
                        const badgeInfo = PARTITION_BADGES[p];
                        if (!hasIt) return null;
                        return (
                          <span
                            key={p}
                            title={p}
                            className={`w-5 h-5 rounded-md ${badgeInfo.bg} text-white font-bold text-[10px] flex items-center justify-center shadow-2xs`}
                          >
                            {badgeInfo.label}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* 字体颜色选择块 */}
                  <td className="py-4 px-4 text-center relative">
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
                      className="w-8 h-8 rounded-lg border border-slate-200 p-1 flex items-center justify-center bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs mx-auto"
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
                          onChange={(color) => {
                            handleChangeColor(item.id, "textColor", color);
                          }}
                          onClose={() => setActiveColorPicker(null)}
                        />
                      )}
                  </td>

                  {/* 背景颜色选择块 */}
                  <td className="py-4 px-4 text-center relative">
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
                      className="w-9 h-8 rounded-lg border border-slate-200 px-1.5 flex items-center justify-between bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs mx-auto"
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
                          onChange={(color) => {
                            handleChangeColor(item.id, "bgColor", color);
                          }}
                          onClose={() => setActiveColorPicker(null)}
                        />
                      )}
                  </td>

                  {/* 权重 */}
                  <td className="py-4 px-4 text-center font-mono text-slate-600 font-bold">
                    {item.weight}
                  </td>

                  {/* 消息通知 开关 (对应截图4) */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleNotify(item.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer inline-block align-middle ${
                        item.notifyEnabled ? "bg-[#7C3AED]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                          item.notifyEnabled
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>

                  {/* 操作: 设为默认值 | 编辑 | 删除 */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3 font-bold">
                      <button
                        type="button"
                        onClick={() => handleSetDefault(item.id)}
                        disabled={item.isDefault}
                        className={`transition-colors cursor-pointer ${
                          item.isDefault
                            ? "text-slate-300 cursor-not-allowed"
                            : "text-[#7C3AED] hover:text-purple-800"
                        }`}
                      >
                        设为默认值
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="text-[#7C3AED] hover:text-purple-800 transition-colors cursor-pointer"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(item)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 模态框 1：新增状态 (完全对齐截图2) */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-y-auto max-h-[calc(100dvh-32px)] border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* 头部标题与关闭：| 新增状态 */}
            <div className="p-4 px-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full inline-block" />
                <h3 className="text-base font-bold text-slate-900">新增状态</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 表单体 */}
            <div className="p-6 space-y-5 text-xs sm:text-sm">
              {/* 状态名称 */}
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-bold shrink-0 w-20 text-right">
                  <span className="text-rose-500 mr-1">*</span>状态名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入状态名称"
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-300 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all bg-white"
                  autoFocus
                />
              </div>

              {/* 关联分区 */}
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-bold shrink-0 w-20 text-right">
                  <span className="text-rose-500 mr-1">*</span>关联分区
                </label>
                <div className="flex items-center gap-4 text-slate-700 font-medium select-none">
                  {PARTITION_OPTIONS.map((p) => {
                    const isChecked = formPartitions.includes(p);
                    return (
                      <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFormPartition(p)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 accent-[#7C3AED]"
                        />
                        <span>{p}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 权重 */}
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-bold shrink-0 w-20 text-right">
                  权重
                </label>
                <input
                  type="number"
                  value={formWeight}
                  onChange={(e) =>
                    setFormWeight(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="请输入权重数字(0-999)数字越大排越前面"
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-300 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all bg-white"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 px-6 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-6 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* ============================================================ */}
      {/* 模态框 2：编辑状态 (完全对齐截图5) */}
      {/* ============================================================ */}
      {editingItem && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-y-auto max-h-[calc(100dvh-32px)] border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* 头部标题与关闭：| 编辑状态 */}
            <div className="p-4 px-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full inline-block" />
                <h3 className="text-base font-bold text-slate-900">编辑状态</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 表单体 */}
            <div className="p-6 space-y-5 text-xs sm:text-sm">
              {/* 状态名称 */}
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-bold shrink-0 w-20 text-right">
                  <span className="text-rose-500 mr-1">*</span>状态名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入状态名称"
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-300 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all bg-white"
                  autoFocus
                />
              </div>

              {/* 关联分区 */}
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-bold shrink-0 w-20 text-right">
                  <span className="text-rose-500 mr-1">*</span>关联分区
                </label>
                <div className="flex items-center gap-4 text-slate-700 font-medium select-none">
                  {PARTITION_OPTIONS.map((p) => {
                    const isChecked = formPartitions.includes(p);
                    return (
                      <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFormPartition(p)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 accent-[#7C3AED]"
                        />
                        <span>{p}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 权重 */}
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-bold shrink-0 w-20 text-right">
                  权重
                </label>
                <input
                  type="number"
                  value={formWeight}
                  onChange={(e) =>
                    setFormWeight(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="请输入权重数字"
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-300 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all bg-white"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 px-6 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="px-6 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* ============================================================ */}
      {/* 模态框 3：删除状态 (完全对齐截图6) */}
      {/* ============================================================ */}
      {deletingItem && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-y-auto max-h-[calc(100dvh-32px)] border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* 头部标题与关闭：| 删除状态 */}
            <div className="p-4 px-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full inline-block" />
                <h3 className="text-base font-bold text-slate-900">删除状态</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容体：警告图标 + 提示语 + 是否替换状态 */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  !
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-bold">
                  请确认是否删除该状态，删除后无法恢复
                </p>
              </div>

              {/* 是否替换成其他状态 */}
              <div className="pl-9 space-y-3">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={replaceOtherStatus}
                    onChange={(e) => setReplaceOtherStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 accent-[#7C3AED]"
                  />
                  <span>是否替换成其他状态</span>
                </label>

                {/* 如果勾选了替换状态，列出下拉选择框 */}
                {replaceOtherStatus && (
                  <div className="pt-1">
                    <select
                      value={replacementStatusId}
                      onChange={(e) => setReplacementStatusId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 bg-white outline-none focus:border-[#7C3AED]"
                    >
                      {store.replacementStatuses("video", deletingItem.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 px-6 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
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
