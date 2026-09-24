import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  X,
  Trash2,
  Edit3,
  Check,
  FileText,
  Type,
  Image as ImageIcon,
  Paperclip,
  Link,
  List,
  Clock,
  ChevronDown
} from "lucide-react";
import {
  loadScriptTemplates,
  saveScriptTemplates,
  ScriptTemplate as ScriptTemplateItem,
  ScriptTemplateField as TemplateFieldItem,
  ScriptTemplateFieldType,
  subscribeToScriptTemplates,
} from "../data/scriptTemplates";
import OverlayPortal from "./overlays/OverlayPortal";

export default function ScriptTemplateManagementView() {
  // Toast 提示框
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  const [templates, setTemplates] = useState<ScriptTemplateItem[]>(loadScriptTemplates);
  const templatesRef = useRef(templates);

  // 当前选中模板 ID
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => loadScriptTemplates()[0]?.id || "");
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  useEffect(() => subscribeToScriptTemplates(() => {
    const next = loadScriptTemplates();
    templatesRef.current = next;
    setTemplates(next);
  }), []);

  useEffect(() => {
    if (!templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0]?.id || "");
    }
  }, [selectedTemplateId, templates]);

  const commitTemplates = (updater: (current: ScriptTemplateItem[]) => ScriptTemplateItem[]) => {
    const next = updater(templatesRef.current);
    templatesRef.current = next;
    setTemplates(next);
    saveScriptTemplates(next);
  };

  // -------------------------- 模板 Modal 状态 --------------------------
  // 新增模板 Modal
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  const [formTemplateTitle, setFormTemplateTitle] = useState("");

  // 编辑模板 Modal
  const [editingTemplate, setEditingTemplate] = useState<ScriptTemplateItem | null>(null);
  const [formEditTemplateTitle, setFormEditTemplateTitle] = useState("");

  // 编辑列向区域名称 Modal
  const [editingColumnGroupTemplate, setEditingColumnGroupTemplate] = useState<ScriptTemplateItem | null>(null);
  const [formColumnGroupTitle, setFormColumnGroupTitle] = useState("");
  const [columnGroupTitleError, setColumnGroupTitleError] = useState("");

  // 删除模板 Modal
  const [deletingTemplate, setDeletingTemplate] = useState<ScriptTemplateItem | null>(null);

  // -------------------------- 字段 Modal & Popover 状态 --------------------------
  // Popover 菜单 (在左侧插入一列/在右侧插入一列，或在上方插入一行/在下方插入一行)
  const [activeMenuFieldId, setActiveMenuFieldId] = useState<string | null>(null);

  // 新增字段 Modal
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateFieldItem | null>(null);
  const [insertConfig, setInsertConfig] = useState<{
    targetFieldId?: string;
    position?: "left" | "right" | "top" | "bottom";
    displayMode: "column" | "row";
  }>({ displayMode: "column" });

  // 字段表单状态 (完全对齐截图 6)
  const [formFieldTitle, setFormFieldTitle] = useState("");
  const [formFieldType, setFormFieldType] = useState<ScriptTemplateFieldType>("单选");
  const [formFieldPlaceholder, setFormFieldPlaceholder] = useState("");
  const [formFieldOptions, setFormFieldOptions] = useState<string[]>(["选项1"]);
  const [formFieldErrors, setFormFieldErrors] = useState<{ title?: string; options?: string }>({});

  // -------------------------- 模板管理 handler --------------------------

  // 打开新增模板 Modal
  const handleOpenAddTemplateModal = () => {
    setFormTemplateTitle("");
    setIsAddTemplateModalOpen(true);
  };

  // 提交新增模板
  const handleAddTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = formTemplateTitle.trim();
    if (!title) {
      showToast("请输入模板标题");
      return;
    }
    if (templatesRef.current.some((template) => template.title === title)) {
      showToast("模板标题不能重复");
      return;
    }

    const newTemplate: ScriptTemplateItem = {
      id: `tpl-${Date.now()}`,
      title,
      columnGroupTitle: title,
      enabled: true,
      fields: [],
    };

    commitTemplates((current) => [...current, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setIsAddTemplateModalOpen(false);
    showToast(`新增脚本模板 [${newTemplate.title}] 成功！`);
  };

  const handleOpenEditTemplateModal = (tpl: ScriptTemplateItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingTemplate(tpl);
    setFormEditTemplateTitle(tpl.title);
  };

  const handleEditTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    const title = formEditTemplateTitle.trim();
    if (!title) {
      showToast("模板标题不能为空");
      return;
    }
    if (templatesRef.current.some((template) => template.id !== editingTemplate.id && template.title === title)) {
      showToast("模板标题不能重复");
      return;
    }

    commitTemplates((current) => current.map((template) => template.id === editingTemplate.id ? { ...template, title } : template));
    showToast(`修改脚本模板 [${title}] 成功！`);
    setEditingTemplate(null);
  };

  const handleOpenEditColumnGroupTitle = (template: ScriptTemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingColumnGroupTemplate(template);
    setFormColumnGroupTitle(template.columnGroupTitle);
    setColumnGroupTitleError("");
  };

  const handleEditColumnGroupTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumnGroupTemplate) return;
    const columnGroupTitle = formColumnGroupTitle.trim();
    if (!columnGroupTitle) {
      setColumnGroupTitleError("列向区域名称不能为空");
      return;
    }

    commitTemplates((current) => current.map((template) => template.id === editingColumnGroupTemplate.id
      ? { ...template, columnGroupTitle }
      : template));
    setEditingColumnGroupTemplate(null);
    setColumnGroupTitleError("");
    showToast(`列向区域名称已修改为 [${columnGroupTitle}]`);
  };

  const handleToggleTemplateEnabled = (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = templatesRef.current.find((template) => template.id === tplId);
    if (!target) return;
    commitTemplates((current) => current.map((template) => template.id === tplId ? { ...template, enabled: !template.enabled } : template));
    showToast(target.enabled ? `已停用脚本模板 [${target.title}]` : `已启用脚本模板 [${target.title}]`);
  };

  const handleOpenDeleteTemplateModal = (tpl: ScriptTemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (templatesRef.current.length <= 1) {
      showToast("至少保留一个脚本模板");
      return;
    }
    setDeletingTemplate(tpl);
  };

  const handleConfirmDeleteTemplate = () => {
    if (!deletingTemplate) return;
    const targetTitle = deletingTemplate.title;
    const filtered = templatesRef.current.filter((template) => template.id !== deletingTemplate.id);
    commitTemplates(() => filtered);
    if (selectedTemplateId === deletingTemplate.id) setSelectedTemplateId(filtered[0]?.id || "");
    setDeletingTemplate(null);
    showToast(`已删除脚本模板 [${targetTitle}]`);
  };

  const resetFieldForm = (field?: TemplateFieldItem) => {
    setFormFieldTitle(field?.title || "");
    setFormFieldType(field?.type || "单选");
    setFormFieldPlaceholder(field?.placeholder || "");
    setFormFieldOptions(field?.options?.length ? [...field.options] : [""]);
    setFormFieldErrors({});
  };

  const handleOpenInsertMenu = (fieldId: string, _displayMode: "column" | "row", e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuFieldId((current) => current === fieldId ? null : fieldId);
  };

  const handleSelectInsertDirection = (position: "left" | "right" | "top" | "bottom") => {
    const isColumn = position === "left" || position === "right";
    setInsertConfig({
      targetFieldId: activeMenuFieldId || undefined,
      position,
      displayMode: isColumn ? "column" : "row",
    });
    setEditingField(null);
    resetFieldForm();
    setActiveMenuFieldId(null);
    setIsAddFieldModalOpen(true);
  };

  const handleOpenDirectAddField = (displayMode: "column" | "row") => {
    setInsertConfig({
      position: displayMode === "column" ? "right" : "bottom",
      displayMode,
    });
    setEditingField(null);
    resetFieldForm();
    setIsAddFieldModalOpen(true);
  };

  const handleOpenEditField = (field: TemplateFieldItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingField(field);
    setInsertConfig({ displayMode: field.displayMode });
    resetFieldForm(field);
    setIsAddFieldModalOpen(true);
  };

  const handleAddOption = () => setFormFieldOptions((current) => [...current, ""]);
  const handleUpdateOption = (index: number, value: string) => setFormFieldOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  const handleRemoveOption = (index: number) => setFormFieldOptions((current) => current.length === 1 ? current : current.filter((_, optionIndex) => optionIndex !== index));

  const handleDeleteField = (fieldId: string, fieldTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTemplate) return;
    commitTemplates((current) => current.map((template) => template.id === currentTemplate.id ? { ...template, fields: template.fields.filter((field) => field.id !== fieldId) } : template));
    showToast(`已删除字段 [${fieldTitle}]`);
  };

  const handleAddFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplate) return;
    const errors: { title?: string; options?: string } = {};
    const title = formFieldTitle.trim();
    const options = formFieldOptions.map((option) => option.trim()).filter(Boolean);

    if (!title) errors.title = "请输入名称";
    if ((formFieldType === "单选" || formFieldType === "多选") && (!options.length || formFieldOptions.some((option) => !option.trim()))) {
      errors.options = "选项名称不能为空";
    }
    if (Object.keys(errors).length) {
      setFormFieldErrors(errors);
      return;
    }

    const field: TemplateFieldItem = {
      id: editingField?.id || `f-${Date.now()}`,
      title,
      type: formFieldType,
      displayMode: editingField?.displayMode || insertConfig.displayMode,
      placeholder: formFieldPlaceholder.trim() || undefined,
      options: formFieldType === "单选" || formFieldType === "多选" ? options : undefined,
    };

    commitTemplates((current) => current.map((template) => {
      if (template.id !== currentTemplate.id) return template;
      if (editingField) return { ...template, fields: template.fields.map((item) => item.id === editingField.id ? field : item) };

      const fields = [...template.fields];
      if (insertConfig.targetFieldId && insertConfig.position) {
        const targetIndex = fields.findIndex((item) => item.id === insertConfig.targetFieldId);
        if (targetIndex >= 0) {
          const insertIndex = insertConfig.position === "left" || insertConfig.position === "top" ? targetIndex : targetIndex + 1;
          fields.splice(insertIndex, 0, field);
          return { ...template, fields };
        }
      }

      const sameModeIndexes = fields.map((item, index) => item.displayMode === field.displayMode ? index : -1).filter((index) => index >= 0);
      const insertIndex = sameModeIndexes.length ? sameModeIndexes[sameModeIndexes.length - 1] + 1 : fields.length;
      fields.splice(insertIndex, 0, field);
      return { ...template, fields };
    }));

    setIsAddFieldModalOpen(false);
    setEditingField(null);
    showToast(editingField ? `字段 [${field.title}] 修改成功！` : `新字段 [${field.title}] 创建成功！`);
  };

  // 按 displayMode 分类字段
  const columnFields = currentTemplate?.fields.filter((f) => f.displayMode === "column") || [];
  const rowFields = currentTemplate?.fields.filter((f) => f.displayMode === "row") || [];

  return (
    <div
      className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5 p-6 animate-fade-in w-full overflow-y-auto text-slate-800 relative"
      onClick={() => setActiveMenuFieldId(null)}
    >
      {/* Toast 提示框 */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Check className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 左侧：脚本模板列表 (完全匹配截图 1 & 截图 2)                               */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden shrink-0">
        {/* 左侧表头 */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">脚本模板</span>
          <button
            type="button"
            onClick={handleOpenAddTemplateModal}
            className="text-xs font-bold text-[#7C3AED] hover:text-purple-700 cursor-pointer transition-colors"
          >
            新增模板
          </button>
        </div>

        {/* 模板列表 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[620px]">
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-all group ${
                  isSelected
                    ? "bg-purple-50/70 border-l-4 border-l-[#7C3AED]"
                    : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                }`}
              >
                {/* 模板名称 */}
                <span
                  className={`text-xs font-bold truncate flex-1 pr-2 ${
                    isSelected ? "text-[#7C3AED]" : "text-slate-800"
                  }`}
                >
                  {tpl.title}
                </span>

                {/* 右侧：开关 + 修改图标 + 删除图标 (完全匹配截图 2) */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* 开关 */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleTemplateEnabled(tpl.id, e)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-hidden p-0.5 shrink-0 inline-block align-middle ${
                      tpl.enabled ? "bg-[#7C3AED]" : "bg-slate-300"
                    }`}
                    title={tpl.enabled ? "点击停用" : "点击启用"}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
                        tpl.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* 修改图标 */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditTemplateModal(tpl, e)}
                    className="p-1 text-[#7C3AED] hover:text-purple-800 rounded hover:bg-purple-100/50 cursor-pointer transition-colors"
                    title="修改模板标题"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* 删除图标 */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenDeleteTemplateModal(tpl, e)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                    title="删除模板"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 右侧：脚本模板网格字段结构编辑器 (完全匹配截图 4, 5, 6)                   */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden relative">
        {/* 右侧头部：当前模板名称 + 状态 */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">{currentTemplate.title}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentTemplate.enabled
                  ? "bg-purple-100 text-[#7C3AED]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentTemplate.enabled ? "已启用" : "已停用"}
            </span>
          </div>

          <div className="text-xs text-slate-400">
            点击字段右上角的 <span className="font-bold text-[#7C3AED]">+</span> 可在旁边插入新字段
          </div>
        </div>

        {/* 字段可视化结构表单区域 */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* 1. 列向展示字段区 (展示为并排表格列块，对齐截图 4) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
              <span>列向展示字段 (横向排列)</span>
              <button
                type="button"
                onClick={() => handleOpenDirectAddField("column")}
                className="w-6 h-6 rounded-full border border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold transition-colors cursor-pointer"
                title="添加列向字段"
              >
                +
              </button>
            </div>

            <div className="flex items-stretch gap-3.5">
              <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-violet-200 bg-violet-100/70 px-2 py-3 text-slate-800">
                <span className="flex flex-1 items-center justify-center text-xs font-bold [writing-mode:vertical-rl]">
                  {currentTemplate.columnGroupTitle}
                </span>
                <button
                  type="button"
                  onClick={(event) => handleOpenEditColumnGroupTitle(currentTemplate, event)}
                  title="编辑列向区域名称"
                  className="mt-2 rounded p-1 text-[#7C3AED] hover:bg-violet-200/70"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {columnFields.map((field) => (
                  <div
                    key={field.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs group/card relative flex flex-col"
                  >
                  {/* 列字段 Header */}
                  <div className="px-3 py-2 bg-purple-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {field.title}
                      </span>
                      <button type="button" onClick={(event) => handleOpenEditField(field, event)} title="编辑字段" className="shrink-0 rounded p-0.5 text-[#7C3AED] opacity-70 hover:bg-violet-100 hover:opacity-100">
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 右侧：删除 + (+) 插入按钮 (对齐截图 4) */}
                    <div className="flex items-center gap-1 shrink-0 relative">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteField(field.id, field.title, e)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="删除该字段"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 加号按钮触发 Popover 菜单 */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenInsertMenu(field.id, "column", e)}
                        className="w-5 h-5 rounded-full border border-purple-300 text-[#7C3AED] hover:bg-purple-100 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                        title="插入新列"
                      >
                        +
                      </button>

                      {/* 下拉 Popover 菜单 (对齐截图 4: 在左侧插入一列 / 在右侧插入一列) */}
                      {activeMenuFieldId === field.id && (
                        <div className="absolute top-7 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-32 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => handleSelectInsertDirection("left")}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] font-medium transition-colors"
                          >
                            在左侧插入一列
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectInsertDirection("right")}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] font-medium transition-colors"
                          >
                            在右侧插入一列
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 列字段 内容预览/占位区 */}
                  <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[90px] text-slate-400 text-xs font-medium bg-slate-50/20">
                    <span className="text-slate-600 font-bold">{field.type}</span>
                    {field.placeholder && (
                      <span className="text-[10px] text-slate-400 mt-1 text-center">
                        {field.placeholder}
                      </span>
                    )}
                  </div>
                  </div>
                ))}

                {/* 尾部 (+) 按钮卡片 (完全对齐截图 6 右上方单独 + 按钮) */}
                <div
                  onClick={() => handleOpenDirectAddField("column")}
                  className="border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[120px] text-slate-400 hover:text-[#7C3AED] cursor-pointer transition-all bg-slate-50/30 hover:bg-purple-50/20"
                >
                  <div className="w-7 h-7 rounded-full border border-current flex items-center justify-center font-bold text-sm">
                    +
                  </div>
                  <span className="text-xs font-bold mt-1.5">新增列</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 横向展示字段区 (展示为独立行块，对齐截图 5) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
              <span>横向展示字段 (纵向堆叠)</span>
              <button
                type="button"
                onClick={() => handleOpenDirectAddField("row")}
                className="w-6 h-6 rounded-full border border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold transition-colors cursor-pointer"
                title="添加横向字段"
              >
                +
              </button>
            </div>

            <div className="space-y-3">
              {rowFields.map((field) => (
                <div
                  key={field.id}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs group/row relative"
                >
                  {/* 行字段 Header */}
                  <div className="px-4 py-2.5 bg-purple-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{field.title}</span>
                      <button type="button" onClick={(event) => handleOpenEditField(field, event)} title="编辑字段" className="rounded p-0.5 text-[#7C3AED] opacity-70 hover:bg-violet-100 hover:opacity-100">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 右侧：删除 + (+) 插入按钮 (对齐截图 5) */}
                    <div className="flex items-center gap-2 relative">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteField(field.id, field.title, e)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="删除该字段"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 加号按钮触发 Popover 菜单 */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenInsertMenu(field.id, "row", e)}
                        className="w-5 h-5 rounded-full border border-purple-300 text-[#7C3AED] hover:bg-purple-100 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                        title="插入新行"
                      >
                        +
                      </button>

                      {/* 下拉 Popover 菜单 (对齐截图 5: 在上方插入一行 / 在下方插入一行) */}
                      {activeMenuFieldId === field.id && (
                        <div className="absolute top-7 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-32 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => handleSelectInsertDirection("top")}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] font-medium transition-colors"
                          >
                            在上方插入一行
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectInsertDirection("bottom")}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-[#7C3AED] font-medium transition-colors"
                          >
                            在下方插入一行
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 行字段 内容预览/占位区 */}
                  <div className="p-4 min-h-[60px] flex items-center justify-center text-xs text-slate-500 font-medium bg-slate-50/20">
                    <span>{field.type}</span>
                    {field.options && field.options.length > 0 && (
                      <span className="ml-3 text-slate-400">[{field.options.join(", ")}]</span>
                    )}
                  </div>
                </div>
              ))}

              {/* 尾部 (+) 新增行字段区 */}
              <div
                onClick={() => handleOpenDirectAddField("row")}
                className="border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-xl p-3 flex items-center justify-center gap-2 text-slate-400 hover:text-[#7C3AED] cursor-pointer transition-all bg-slate-50/30 hover:bg-purple-50/20"
              >
                <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-xs">
                  +
                </div>
                <span className="text-xs font-bold">新增行字段</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 模态框 1：新增模板 (完全对齐截图 1)                                        */}
      {/* ========================================================================= */}
      {isAddTemplateModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">新增模板</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddTemplateSubmit} className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>模板标题
                </label>
                <input
                  type="text"
                  value={formTemplateTitle}
                  onChange={(e) => setFormTemplateTitle(e.target.value)}
                  placeholder="请输入标题名称"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTemplateModalOpen(false)}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 模态框 2：编辑模板 (完全对齐截图 3)                                        */}
      {/* ========================================================================= */}
      {editingTemplate && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">编辑模板</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleEditTemplateSubmit} className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>模板标题
                </label>
                <input
                  type="text"
                  value={formEditTemplateTitle}
                  onChange={(e) => setFormEditTemplateTitle(e.target.value)}
                  placeholder="请输入标题名称"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800"
                  autoFocus
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
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
        </div>
      )}

      {editingColumnGroupTemplate && (
        <OverlayPortal layer="dialog" className="fixed inset-0 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#7C3AED]" />
                <h3 className="text-sm font-bold text-slate-800">编辑列向区域名称</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingColumnGroupTemplate(null);
                  setColumnGroupTitleError("");
                }}
                title="关闭"
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditColumnGroupTitleSubmit} className="space-y-6 p-6">
              <div className="flex items-start gap-4">
                <label className="w-24 shrink-0 pt-2 text-right text-xs font-bold text-slate-700">
                  <span className="mr-1 text-rose-500">*</span>区域名称
                </label>
                <div className="min-w-0 flex-1 space-y-1">
                  <input
                    type="text"
                    value={formColumnGroupTitle}
                    onChange={(event) => {
                      setFormColumnGroupTitle(event.target.value);
                      if (event.target.value.trim()) setColumnGroupTitleError("");
                    }}
                    placeholder="请输入列向区域名称"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-hidden focus:ring-1 ${columnGroupTitleError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : "border-purple-300 focus:border-[#7C3AED] focus:ring-purple-200"}`}
                    autoFocus
                  />
                  {columnGroupTitleError && <p className="text-[11px] font-medium text-rose-500">{columnGroupTitleError}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingColumnGroupTemplate(null);
                    setColumnGroupTitleError("");
                  }}
                  className="rounded-lg border border-slate-200 px-6 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  取消
                </button>
                <button type="submit" className="rounded-lg bg-[#7C3AED] px-6 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-purple-700">
                  确定
                </button>
              </div>
            </form>
          </div>
        </OverlayPortal>
      )}

      {/* ========================================================================= */}
      {/* 模态框 3：删除模板确认                                                     */}
      {/* ========================================================================= */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">删除模板</h3>
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 text-slate-700 text-xs font-medium">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  !
                </div>
                <span>请确认是否删除该脚本模板，删除后无法恢复</span>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingTemplate(null)}
                  className="px-5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTemplate}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 模态框 4：新增字段 (完全对齐截图 6)                                        */}
      {/* ========================================================================= */}
      {isAddFieldModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">新增字段</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFieldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form (完全匹配截图 6) */}
            <form onSubmit={handleAddFieldSubmit} className="p-6 space-y-5">
              {/* 1. 模板标题 (字段名称) */}
              <div className="flex items-start gap-4">
                <label className="text-xs font-bold text-slate-700 w-20 text-right shrink-0 pt-2">
                  <span className="text-rose-500 mr-1">*</span>模板标题
                </label>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={formFieldTitle}
                    onChange={(e) => {
                      setFormFieldTitle(e.target.value);
                      if (e.target.value.trim()) {
                        setFormFieldErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                    placeholder="请输入标题名称"
                    className={`w-full px-3.5 py-2 bg-white border rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400 ${
                      formFieldErrors.title
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200"
                    }`}
                    autoFocus
                  />
                  {formFieldErrors.title && (
                    <p className="text-[11px] text-rose-500 font-medium">{formFieldErrors.title}</p>
                  )}
                </div>
              </div>

              {/* 2. 类型 */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 w-20 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>类型
                </label>
                <select
                  value={formFieldType}
                  onChange={(e) => setFormFieldType(e.target.value as ScriptTemplateFieldType)}
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 cursor-pointer"
                >
                  <option value="单选">单选</option>
                  <option value="多选">多选</option>
                  <option value="文本">文本</option>
                  <option value="图片">图片</option>
                  <option value="附件">附件</option>
                  <option value="链接">链接</option>
                  <option value="数字">数字</option>
                  <option value="时间">时间</option>
                </select>
              </div>

              {/* 当类型为单选/多选时，显示添加选项 (完全对齐截图 6) */}
              {(formFieldType === "单选" || formFieldType === "多选") && (
                <div className="pl-24 space-y-3">
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    添加一个选项
                  </button>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {formFieldOptions.map((opt, idx) => (
                      <div key={idx} className="space-y-1">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(idx, e.target.value)}
                          placeholder="请输入选项名称"
                          className={`w-full px-3.5 py-2 bg-white border rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400 ${
                            formFieldErrors.options && !opt.trim()
                              ? "border-rose-500"
                              : "border-purple-300 focus:border-[#7C3AED]"
                          }`}
                        />
                      </div>
                    ))}
                    {formFieldErrors.options && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {formFieldErrors.options}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 3. 提示语 */}
              <div className="flex items-start gap-4">
                <label className="text-xs font-bold text-slate-700 w-20 text-right shrink-0 pt-2">
                  提示语
                </label>
                <textarea
                  rows={2}
                  value={formFieldPlaceholder}
                  onChange={(e) => setFormFieldPlaceholder(e.target.value)}
                  placeholder="会在填写脚本的时候展示出来，用于引导填写"
                  className="flex-1 px-3.5 py-2 bg-white border border-purple-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200 rounded-lg text-xs outline-hidden font-medium text-slate-800 placeholder:text-slate-400 resize-y"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddFieldModalOpen(false)}
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
        </div>
      )}
    </div>
  );
}
