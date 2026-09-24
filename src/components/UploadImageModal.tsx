import React, { useState } from "react";
import { useResourceConfig } from "../lib/useResourceConfig";
import CategoryCascader from "./CategoryCascader";
import { useTagCatalog, useTagGroupSelection, useTagSelection } from "../lib/useResourceTags";
import LinkScriptModal from "./LinkScriptModal";
import { publishResources, type ResourcePublishDetails } from "../lib/resourceUploads";
import {
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  Check,
  Plus,
  X,
  Calendar,
  Search,
  Shield,
  Tag,
  Folder,
  RefreshCw,
  Sliders,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface UploadImageModalProps {
  isOpen: boolean;
  isPage?: boolean;
  onClose: () => void;
  onPublishSuccess?: (msg: string, details?: ResourcePublishDetails) => void;
  initialFiles?: Array<{ name: string; type?: string; url?: string }>;
}

// Category Cascade Options


// Preset Template Interface
interface PresetTemplate {
  id: string;
  name: string;
  category: string;
  nameType: "title_suffix" | "individual";
  imageTitle: string;
}

const INITIAL_PRESETS: PresetTemplate[] = [
  {
    id: "p1",
    name: "默认肖像图片模板",
    category: "模特切片 / 正面展示图",
    nameType: "title_suffix",
    imageTitle: "模特肖像精修图",
  },
  {
    id: "p2",
    name: "电商产品主图模板",
    category: "电商营销 / 主图宣发",
    nameType: "title_suffix",
    imageTitle: "高清商品主图",
  },
];

// Mock Tag Groups & Sub-Tags for Personal & Public Tags


export default function UploadImageModal({
  isOpen,
  isPage = true,
  onClose,
  onPublishSuccess,
  initialFiles = [],
}: UploadImageModalProps) {
  // Mode Selection: 发布图组 vs 发布多张图片
  const [publishMode, setPublishMode] = useState<"group" | "multiple">("group");

  // Group Tabs for 发布图组
  const [groups, setGroups] = useState<string[]>(["分组1"]);
  const [activeGroupIdx, setActiveGroupIdx] = useState<number>(0);

  // File State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(() =>
    initialFiles.map(
      (file) => new File([""], file.name, { type: file.type || "image/png" }),
    ),
  );

  // Preset Templates State
  const [presetTemplates, setPresetTemplates] =
    useState<PresetTemplate[]>(INITIAL_PRESETS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Category Selector State
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const { store: configStore } = useResourceConfig();
  const CATEGORY_TREE = configStore.categories("images").map(n => ({ name: n.name, children: n.children.map(c => c.name) }));
  const [hoveredCategory, setHoveredCategory] = useState<string>(CATEGORY_TREE[0]?.name || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Basic Info Form States
  const [nameType, setNameType] = useState<"title_suffix" | "individual">(
    "title_suffix",
  );
  const [imageTitle, setImageTitle] = useState<string>(
    "邓彦晨_2026-08-07_10:41:58_634630",
  );

  // Task Association
  const [associatedTask, setAssociatedTask] = useState<string>("1148431");
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  // Script Association Modal
  const [associatedScript, setAssociatedScript] = useState<string>("");
  const [showScriptDropdown, setShowScriptDropdown] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptSearchText, setScriptSearchText] = useState("");

  // Public Tag 3-Column States
  const [publicSearchText, setPublicSearchText] = useState("");
  const [publicGroupSearch, setPublicGroupSearch] = useState("");
  const [publicSubSearch, setPublicSubSearch] = useState("");
  const { publicGroups: PUBLIC_TAG_GROUPS, personalGroups: PERSONAL_TAG_GROUPS } = useTagCatalog();
  const [selectedPublicGroupKey, setSelectedPublicGroupKey] = useTagGroupSelection(PUBLIC_TAG_GROUPS);
  const [addedPublicTags, setAddedPublicTags] = useTagSelection("public");

  // Personal Tag 3-Column States
  const [personalSearchText, setPersonalSearchText] = useState("");
  const [personalGroupSearch, setPersonalGroupSearch] = useState("");
  const [personalSubSearch, setPersonalSubSearch] = useState("");
  const [selectedPersonalGroupKey, setSelectedPersonalGroupKey] = useTagGroupSelection(PERSONAL_TAG_GROUPS);
  const [addedPersonalTags, setAddedPersonalTags] = useTagSelection("personal");

  // Date & Other Info States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageDescription, setImageDescription] = useState("");

  // Permission Settings States
  const [permission, setPermission] = useState<
    "公开" | "部门成员" | "分组成员" | "公用资源" | "指定范围"
  >("公开");
  const [scheduledDate, setScheduledDate] = useState("");
  const [receiver, setReceiver] = useState("");
  const [messageContent, setMessageContent] = useState("");

  if (!isOpen) return null;

  // File Upload Handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Preset Template Select Handler
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const tpl = presetTemplates.find((t) => t.id === id);
    if (!tpl) return;

    setSelectedCategory(tpl.category);
    setNameType(tpl.nameType);
    setImageTitle(tpl.imageTitle);

    setToastMessage(`已套用预设模板：「${tpl.name}」`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save Preset Template
  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTpl: PresetTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      category: selectedCategory,
      nameType,
      imageTitle,
    };
    setPresetTemplates((prev) => [...prev, newTpl]);
    setSelectedTemplateId(newTpl.id);
    setShowSaveTemplateModal(false);

    setToastMessage(`✅ 预设模板「${newTpl.name}」已成功保存！`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add Group
  const handleAddGroup = () => {
    const nextIdx = groups.length + 1;
    setGroups((prev) => [...prev, `分组${nextIdx}`]);
    setActiveGroupIdx(groups.length);
  };

  // Handle Publish
  const handlePublish = (mode: string) => {
    if (uploadedFiles.length === 0) { setToastMessage("请先上传图片"); return; }
    const [primaryCategory = "", secondaryCategory = ""] = selectedCategory.split(" / ");
    if (!configStore.categoryValid("images", primaryCategory, secondaryCategory)) { setToastMessage("请选择当前可用的一级分类和二级分类"); return; }
    const published = publishResources({ partition: "图片", primaryCategory, secondaryCategory,
      publicTags: addedPublicTags, personalTags: addedPersonalTags,
      files: uploadedFiles.map((file) => ({ name: file.name, size: file.size, url: initialFiles.find((initial) => initial.name === file.name)?.url || URL.createObjectURL(file) })),
    });
    const msg =
      mode === "相同配置继续上传"
        ? "✅ 发布成功！已保留当前配置，可继续上传下一批图片素材。"
        : "✅ 图片发布成功！已存入资源库。";
    if (onPublishSuccess) {
      onPublishSuccess(msg, published);
    } else {
      onClose();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FD] w-full h-full overflow-hidden animate-in fade-in duration-150 text-xs text-slate-800 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[140] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Page Header Bar (Return to list, title, no close button) */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mr-2"
            title="返回列表"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </button>

          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-extrabold text-slate-900">
                图片上传页面
              </h2>
              <span className="text-xs text-slate-400">
                支持拖拽 200 个图片，上传的图片将显示在资源库列表中。
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 w-full">
        {/* ================= 1. Top Card: 图片上传 (Upload Section) ================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">图片上传</h2>
          </div>

          {/* Mode Selector Toggles */}
          <div className="flex items-center gap-4 pt-1">
            {/* Option 1: 发布图组 */}
            <button
              type="button"
              onClick={() => setPublishMode("group")}
              className={`p-3.5 rounded-xl border transition-all text-left flex flex-col min-w-[140px] cursor-pointer ${
                publishMode === "group"
                  ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-2xs"
                  : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/80"
              }`}
            >
              <span className="font-bold text-xs">发布图组</span>
              <span className="text-[11px] opacity-75 font-normal mt-0.5">
                多张图片为一组
              </span>
            </button>

            {/* Option 2: 发布多张图片 */}
            <button
              type="button"
              onClick={() => setPublishMode("multiple")}
              className={`p-3.5 rounded-xl border transition-all text-left flex flex-col min-w-[140px] cursor-pointer ${
                publishMode === "multiple"
                  ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-2xs"
                  : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/80"
              }`}
            >
              <span className="font-bold text-xs">发布多张图片</span>
              <span className="text-[11px] opacity-75 font-normal mt-0.5">
                每张图片单独一组
              </span>
            </button>
          </div>

          {/* Group Pills (when publishMode === "group") */}
          {publishMode === "group" && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddGroup}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
                title="添加分组"
              >
                <Plus className="w-4 h-4" />
              </button>
              {groups.map((grp, idx) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setActiveGroupIdx(idx)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    activeGroupIdx === idx
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          )}

          {/* Upload Dropzone (Purple Dashed Border) */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/20 hover:bg-purple-50/40 rounded-2xl p-8 text-center transition-all relative group cursor-pointer"
          >
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.psd,.ai,.eps,.heic,.zip,.rar"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <span className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-xs inline-flex items-center gap-2 shadow-xs transition-colors z-20">
                <UploadCloud className="w-4 h-4" />
                上传本地文件
              </span>

              <p className="text-xs font-bold text-slate-600">
                粘贴或拖拽至此，或点击上传按钮上传
              </p>

              <p className="text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
                支持上传:
                jpg、png、pdf、gif、txt、mp4、mov、psd、ai、jpeg、psb、pptx、ppt、doc、docx、xls、xlsx、heic、arw、zip、max、obj、raw、raf、tif、webp、eps、key、3ds、fbx、dwg、mxf、aep、prproj、c4d、wav、CR2、CR3、json、stp、stl、aep
              </p>

              <p className="text-[11px] text-slate-400 font-medium">
                一组图片上限200个
              </p>
            </div>
          </div>

          {/* Uploaded Files Display List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>已选择 {uploadedFiles.length} 个图片文件</span>
                <button
                  type="button"
                  onClick={() => setUploadedFiles([])}
                  className="text-rose-500 hover:underline cursor-pointer"
                >
                  清空列表
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="truncate text-slate-700 font-medium">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= 2. Second Card: 图片信息 (Image Info Card) ================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">图片信息</h2>
                <p className="text-[11px] text-slate-400">填写图片分类、命名</p>
              </div>
            </div>

            {/* Right: Preset Template Controls */}
            <div className="flex items-center gap-2">
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-purple-500 shadow-2xs transition-colors"
              >
                <option value="">选择预设模板</option>
                {presetTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setNewTemplateName(
                    `图片预设模板_${new Date().toISOString().slice(5, 10).replace("-", "")}`,
                  );
                  setShowSaveTemplateModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>存为预设模板</span>
                <HelpCircle className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>

          {/* --- Sub-section: 基础信息 --- */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-xs">基础信息</h3>
            </div>

            <div className="space-y-4 pl-3.5 border-l-2 border-slate-100">
              {/* 1. 图片分类 */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <label className="w-24 font-bold text-slate-700 text-right shrink-0"><span className="text-rose-500 mr-1">*</span>图片分类</label>
                  <CategoryCascader scope="images" primaryCategory={selectedCategory.split(" / ")[0] || ""} secondaryCategory={selectedCategory.split(" / ")[1] || ""} onSelect={(primary, secondary) => setSelectedCategory([primary, secondary].filter(Boolean).join(" / "))} />
                </div>

                {/* Quick Category Selection Tags Box */}
                <div className="ml-28 mt-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">一级分类</span>
                  {CATEGORY_TREE.map(category => <button key={category.name} type="button" onClick={() => setSelectedCategory([category.name, category.children[0]].filter(Boolean).join(" / "))} className="px-3 py-1 bg-white hover:bg-purple-50 hover:text-purple-600 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">{category.name}</button>)}
                </div>
              </div>

              {/* 2. 图片名称 */}
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>图片名称
                </label>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-6 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="nameType"
                        checked={nameType === "title_suffix"}
                        onChange={() => setNameType("title_suffix")}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span>统一标题+后缀</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-500 font-normal">
                      <input
                        type="radio"
                        name="nameType"
                        checked={nameType === "individual"}
                        onChange={() => setNameType("individual")}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span>单独设置</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    placeholder="请输入图片统一标题"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* 3. 关联任务 */}
              <div className="flex items-center gap-4 relative">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  关联任务
                </label>
                <div className="flex-1 relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={associatedTask}
                      onChange={(e) => setAssociatedTask(e.target.value)}
                      onFocus={() => setShowTaskDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowTaskDropdown(false), 200)
                      }
                      placeholder="输入任务编号 / 备注 / ID 搜索"
                      className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-colors shadow-2xs pr-8"
                    />
                    {associatedTask && (
                      <button
                        type="button"
                        onClick={() => setAssociatedTask("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Task Popover */}
                  {showTaskDropdown && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-6 w-80 animate-in fade-in duration-100">
                      <p className="font-bold text-xs text-slate-700 mb-4">
                        我的待办任务
                      </p>
                      <div className="flex flex-col items-center justify-center text-slate-400 py-4 space-y-2">
                        <Folder className="w-10 h-10 stroke-1 text-slate-300" />
                        <span className="text-xs">暂无待办任务</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. 关联脚本 */}
              <div className="flex items-center gap-4 relative">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  关联脚本
                </label>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={associatedScript}
                    onClick={() => setShowScriptDropdown((prev) => !prev)}
                    readOnly
                    placeholder="关联脚本，后续可自动统计脚本效果数据"
                    className="w-full bg-white border border-slate-200 hover:border-purple-400 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 cursor-pointer focus:outline-none transition-colors shadow-2xs"
                  />
                  {associatedScript && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssociatedScript("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs cursor-pointer"
                      title="清除关联脚本"
                    >
                      ✕
                    </button>
                  )}

                  {/* Popover dropdown matching user screenshot */}
                  {showScriptDropdown && (
                    <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-5 w-full max-w-md animate-in fade-in duration-100 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="font-bold text-xs text-slate-800">
                          任务关联脚本
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowScriptDropdown(false);
                            setShowScriptModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-700 font-bold text-xs cursor-pointer transition-colors"
                        >
                          从脚本库选择
                        </button>
                      </div>

                      {/* Content */}
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                          <Folder className="w-7 h-7 stroke-[1.25]" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {associatedTask
                            ? "暂无关联脚本"
                            : "暂无关联脚本，请先选择任务"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- Sub-section: 标签信息 --- */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-xs">标签信息</h3>
            </div>

            {/* 1. 公共标签 */}
            <div className="space-y-3 pl-3">
              <div className="flex items-center justify-between gap-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  <span className="text-rose-500 mr-0.5">*</span>公共标签
                </span>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={publicSearchText}
                    onChange={(e) => setPublicSearchText(e.target.value)}
                    placeholder="请选择公共标签，支持输入文字搜索"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs text-slate-700 focus:outline-none focus:border-purple-500 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  编辑公共标签
                </button>
              </div>

              {/* 公共标签 3 模块 Panel: 标签组 / 二级标签 / 已添加二级标签 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F8F9FC] border border-slate-200/80 rounded-xl p-3">
                {/* Col 1: 标签组 */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 flex flex-col h-[220px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 shrink-0">
                    <span>标签组</span>
                    <button
                      type="button"
                      onClick={() => setPublicGroupSearch("")}
                      className="text-purple-600 hover:underline flex items-center gap-0.5 font-normal text-[11px] cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      刷新
                    </button>
                  </div>
                  <input
                    type="text"
                    value={publicGroupSearch}
                    onChange={(e) => setPublicGroupSearch(e.target.value)}
                    placeholder="请输入标签组名称"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none shrink-0"
                  />
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                    {Object.keys(PUBLIC_TAG_GROUPS)
                      .filter((g) => g.includes(publicGroupSearch.trim()))
                      .map((group) => (
                        <div
                          key={group}
                          onClick={() => setSelectedPublicGroupKey(group)}
                          className={`px-2.5 py-1.5 rounded-md cursor-pointer text-xs font-medium transition-colors ${
                            selectedPublicGroupKey === group
                              ? "text-purple-600 font-bold bg-purple-50"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {group}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Col 2: 二级标签 */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 flex flex-col h-[220px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 shrink-0">
                    <span>二级标签</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      多选
                    </span>
                  </div>
                  <input
                    type="text"
                    value={publicSubSearch}
                    onChange={(e) => setPublicSubSearch(e.target.value)}
                    placeholder="请输入二级标签名称"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none shrink-0"
                  />
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pt-1">
                    {(PUBLIC_TAG_GROUPS[selectedPublicGroupKey] || [])
                      .filter((sub) => sub.includes(publicSubSearch.trim()))
                      .map((subTag) => {
                        const isChecked = addedPublicTags.includes(subTag);
                        return (
                          <label
                            key={subTag}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-purple-600 select-none px-1"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setAddedPublicTags(
                                    addedPublicTags.filter((t) => t !== subTag),
                                  );
                                } else {
                                  setAddedPublicTags([
                                    ...addedPublicTags,
                                    subTag,
                                  ]);
                                }
                              }}
                              className="accent-purple-600 w-3.5 h-3.5 rounded"
                            />
                            <span>{subTag}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Col 3: 已添加二级标签 */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 flex flex-col h-[220px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 shrink-0">
                    <span>已添加二级标签</span>
                    {addedPublicTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAddedPublicTags([])}
                        className="text-slate-400 hover:text-rose-500 text-[10px] cursor-pointer"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto pt-1">
                    {addedPublicTags.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-12">
                        暂未添加二级标签
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {addedPublicTags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAddedPublicTags(
                                  addedPublicTags.filter((t) => t !== tag),
                                )
                              }
                              className="text-purple-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 个人标签 */}
            <div className="space-y-3 pl-3 pt-2 border-t border-slate-100/80">
              <div className="flex items-center justify-between gap-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  个人标签
                </span>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={personalSearchText}
                    onChange={(e) => setPersonalSearchText(e.target.value)}
                    placeholder="请选择个人标签，支持输入文字搜索"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs text-slate-700 focus:outline-none focus:border-purple-500 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  编辑个人标签
                </button>
              </div>

              {/* 个人标签 3 模块 Panel: 标签组 / 二级标签 / 已添加二级标签 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F8F9FC] border border-slate-200/80 rounded-xl p-3">
                {/* Col 1: 标签组 */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 flex flex-col h-[220px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 shrink-0">
                    <span>标签组</span>
                    <button
                      type="button"
                      onClick={() => setPersonalGroupSearch("")}
                      className="text-purple-600 hover:underline flex items-center gap-0.5 font-normal text-[11px] cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      刷新
                    </button>
                  </div>
                  <input
                    type="text"
                    value={personalGroupSearch}
                    onChange={(e) => setPersonalGroupSearch(e.target.value)}
                    placeholder="请输入标签组名称"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none shrink-0"
                  />
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                    {Object.keys(PERSONAL_TAG_GROUPS)
                      .filter((g) => g.includes(personalGroupSearch.trim()))
                      .map((group) => (
                        <div
                          key={group}
                          onClick={() => setSelectedPersonalGroupKey(group)}
                          className={`px-2.5 py-1.5 rounded-md cursor-pointer text-xs font-medium transition-colors ${
                            selectedPersonalGroupKey === group
                              ? "text-purple-600 font-bold bg-purple-50"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {group}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Col 2: 二级标签 */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 flex flex-col h-[220px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 shrink-0">
                    <span>二级标签</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      多选
                    </span>
                  </div>
                  <input
                    type="text"
                    value={personalSubSearch}
                    onChange={(e) => setPersonalSubSearch(e.target.value)}
                    placeholder="请输入二级标签名称"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none shrink-0"
                  />
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pt-1">
                    {(PERSONAL_TAG_GROUPS[selectedPersonalGroupKey] || [])
                      .filter((sub) => sub.includes(personalSubSearch.trim()))
                      .map((subTag) => {
                        const isChecked = addedPersonalTags.includes(subTag);
                        return (
                          <label
                            key={subTag}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-purple-600 select-none px-1"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setAddedPersonalTags(
                                    addedPersonalTags.filter(
                                      (t) => t !== subTag,
                                    ),
                                  );
                                } else {
                                  setAddedPersonalTags([
                                    ...addedPersonalTags,
                                    subTag,
                                  ]);
                                }
                              }}
                              className="accent-purple-600 w-3.5 h-3.5 rounded"
                            />
                            <span>{subTag}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Col 3: 已添加二级标签 */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 flex flex-col h-[220px]">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 shrink-0">
                    <span>已添加二级标签</span>
                    {addedPersonalTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAddedPersonalTags([])}
                        className="text-slate-400 hover:text-rose-500 text-[10px] cursor-pointer"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto pt-1">
                    {addedPersonalTags.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-12">
                        暂未添加二级标签
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {addedPersonalTags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAddedPersonalTags(
                                  addedPersonalTags.filter((t) => t !== tag),
                                )
                              }
                              className="text-purple-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Sub-section: 时间设置 --- */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-xs">时间设置</h3>
              <span className="text-[11px] text-slate-400 font-normal">
                剪辑时间、授权有效期
              </span>
            </div>

            <div className="space-y-4 pl-3.5 border-l-2 border-slate-100">
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  授权有效时间
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <span className="text-slate-400">至</span>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Sub-section: 其他信息 --- */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-xs">其他信息</h3>
              <span className="text-[11px] text-slate-400 font-normal">
                补充说明
              </span>
            </div>

            <div className="space-y-4 pl-3.5 border-l-2 border-slate-100">
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  图片备注
                </label>
                <input
                  type="text"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="请输入图片备注"
                  className="flex-1 bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-colors shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. Third Card: 权限设置 (Permissions Card) ================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">权限设置</h2>
                <p className="text-[11px] text-slate-400">
                  设置查看权限、定时权限变更和消息提醒
                </p>
              </div>
            </div>

            {/* Right: Preset Config Dropdown */}
            <div className="flex items-center gap-2">
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none">
                <option value="">选择预设配置</option>
              </select>
              <button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>存为预设模板</span>
                <HelpCircle className="w-3 h-3.5 opacity-80" />
              </button>
            </div>
          </div>

          {/* 查看权限 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-xs">查看权限</h3>
            </div>

            <div className="space-y-2 pl-3.5 border-l-2 border-slate-100">
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>图片查看权限
                </label>
                <div className="flex items-center gap-5 text-xs font-bold text-slate-700">
                  {(
                    [
                      "公开",
                      "部门成员",
                      "分组成员",
                      "公用资源",
                      "指定范围",
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="permission"
                        checked={permission === opt}
                        onChange={() => setPermission(opt)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span>{opt}</span>
                      {opt === "公用资源" && (
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <p className="ml-28 text-[11px] text-slate-400">
                控制图片上传后哪些人可以查看该图片。
              </p>
            </div>
          </div>

          {/* 定期权限 */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-xs">定期权限</h3>
              <span className="text-[11px] text-slate-400 font-normal">
                可选，到期后自动修改查看权限
              </span>
            </div>

            <div className="space-y-2 pl-3.5 border-l-2 border-slate-100">
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  修改日期
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    将在所选日期 00:00 自动修改查看权限
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 消息提醒 */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-xs">消息提醒</h3>
            </div>

            <div className="space-y-3 pl-3.5 border-l-2 border-slate-100">
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  接收人
                </label>
                <select
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="">请选择</option>
                  <option value="user1">李明 (剪辑负责人)</option>
                  <option value="user2">王芳 (项目经理)</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  消息内容
                </label>
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="请输入消息内容"
                  className="flex-1 bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-colors shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="px-6 py-3.5 bg-white border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 shadow-lg">
        {/* 发布后，相同配置继续上传 with Tooltip */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => handlePublish("相同配置继续上传")}
            className="bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>发布后，相同配置继续上传</span>
            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
          </button>

          <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block z-50 w-80 sm:w-96 p-3 bg-[#2D2D2D] text-white rounded-lg shadow-2xl text-[11px] leading-relaxed pointer-events-none animate-in fade-in duration-150">
            <p className="font-normal text-slate-100">
              适用于图片上传数量超过200个的情况。
            </p>
            <p className="font-normal text-slate-200 mt-1">
              使用此功能，可直接再次上传图片，系统将自动填写当前的分类、标签等配置信息，无需重复操作。只需选择文件，即可快速完成上传，省时高效。
            </p>
            <div className="absolute top-full right-5 -mt-1 w-2.5 h-2.5 bg-[#2D2D2D] rotate-45" />
          </div>
        </div>

        {/* 发布 Primary Button */}
        <button
          type="button"
          onClick={() => handlePublish("发布")}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-purple-600/20"
        >
          发布
        </button>
      </div>

      {/* Save Preset Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  存为预设模板
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="text-rose-500 mr-1">*</span>模板名称
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="请输入预设模板名称"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 border-b border-slate-200/60 pb-1.5 flex items-center justify-between">
                  <span>提取预设内容预览</span>
                  <span className="text-purple-600 font-medium text-[10px]">
                    仅保存图片分类与命名
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">1. 图片分类:</span>
                    <span className="font-bold text-purple-600">
                      {selectedCategory || "未选择"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">2. 图片名称:</span>
                    <span className="font-bold text-slate-800">
                      {imageTitle}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                确定保存模板
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Association Modal (任务关联脚本) */}
      <LinkScriptModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        onConfirm={(selected) => {
          const chosen = Array.isArray(selected) ? selected[0] : selected;
          if (chosen) {
            setAssociatedScript(chosen.title);
          }
        }}
      />
    </div>
  );
}
