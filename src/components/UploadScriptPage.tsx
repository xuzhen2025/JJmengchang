import React, { useRef, useState } from "react";
import { useTagCatalog, useTagGroupSelection, useTagSelection } from "../lib/useResourceTags";
import CategoryCascader from "./CategoryCascader";
import { resourceConfigStore } from "../lib/resourceConfig";
import { publishResources, type ResourcePublishDetails } from "../lib/resourceUploads";
import { operationUser } from "../lib/operationHistory";
import DynamicScriptTemplateForm, { DynamicScriptTemplateFormHandle } from "./DynamicScriptTemplateForm";
import {
  ArrowLeft,
  FileText,
  X,
  HelpCircle,
  RefreshCw,
  Calendar,
  ChevronDown,
  Folder,
  Search
} from "lucide-react";

interface UploadScriptPageProps {
  onClose: () => void;
  onPublishSuccess?: (msg: string, details?: ResourcePublishDetails) => void;
}



export default function UploadScriptPage({
  onClose,
  onPublishSuccess
}: UploadScriptPageProps) {
  // Preset Header
  const [presetTemplate, setPresetTemplate] = useState("");

  // Section 1: Classification & Basic Info
  const [primaryCategory, setPrimaryCategory] = useState(() => resourceConfigStore.categories("scripts")[0]?.name || "");
  const [secondaryCategory, setSecondaryCategory] = useState(() => resourceConfigStore.categories("scripts")[0]?.children[0]?.name || "");
  const [scriptTitle, setScriptTitle] = useState("");
  const [associatedTask, setAssociatedTask] = useState("");
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  // Section 1: Public Tag 3-Column Panel
  const [publicTagSearch, setPublicTagSearch] = useState("");
  const [publicGroupSearch, setPublicGroupSearch] = useState("");
  const [publicSubSearch, setPublicSubSearch] = useState("");
  const { publicGroups: PUBLIC_TAG_GROUPS, personalGroups: PERSONAL_TAG_GROUPS } = useTagCatalog();
  const [selectedPublicGroupKey, setSelectedPublicGroupKey] = useTagGroupSelection(PUBLIC_TAG_GROUPS);
  const [addedPublicTags, setAddedPublicTags] = useTagSelection("public");

  // Section 1: Personal Tag 3-Column Panel
  const [personalTagSearch, setPersonalTagSearch] = useState("");
  const [personalGroupSearch, setPersonalGroupSearch] = useState("");
  const [personalSubSearch, setPersonalSubSearch] = useState("");
  const [selectedPersonalGroupKey, setSelectedPersonalGroupKey] = useTagGroupSelection(PERSONAL_TAG_GROUPS);
  const [addedPersonalTags, setAddedPersonalTags] = useTagSelection("personal");

  const scriptTemplateFormRef = useRef<DynamicScriptTemplateFormHandle | null>(null);

  // Section 3: 更多设置
  const [presetPermissionConfig, setPresetPermissionConfig] = useState("");
  const [viewPermission, setViewPermission] = useState<"公开" | "部门成员" | "分组成员" | "公用资源" | "指定范围">("公开");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reminderUser, setReminderUser] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const handlePublish = (keepConfig = false) => {
    const ownerId = operationUser();
    if (isSubmitting) return;
    if (!resourceConfigStore.categoryValid("scripts", primaryCategory, secondaryCategory)) { setCategoryError("请选择当前可用的一级分类和二级分类"); return; }
    setCategoryError("");
    if (!scriptTemplateFormRef.current?.validate()) return;
    const content = JSON.stringify(scriptTemplateFormRef.current?.getSnapshot(), null, 2);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (!resourceConfigStore.categoryValid("scripts", primaryCategory, secondaryCategory)) { setCategoryError("分类已变更，请重新选择"); return; }
      const published = publishResources({ ownerId, partition: "脚本", primaryCategory, secondaryCategory,
        publicTags: addedPublicTags, personalTags: addedPersonalTags, content,
        files: [{ name: scriptTitle.trim() || "未命名脚本", url: URL.createObjectURL(new Blob([content], { type: "application/json" })) }],
      });
      onClose();
      if (onPublishSuccess) {
        onPublishSuccess(keepConfig ? "✅ 已发布脚本，相同配置可继续上传" : "✅ 已成功上传【脚本】资源", published);
      }
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F5F6FA] w-full h-full overflow-hidden animate-in fade-in duration-150 text-xs font-sans text-slate-700">
      
      {categoryError && <div role="alert" className="px-6 py-2 text-rose-600 bg-rose-50 shrink-0">{categoryError}</div>}
      {/* Top Header */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mr-2"
            title="返回列表"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </button>
          
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">上传脚本</h2>
          </div>
        </div>

        {/* Top Right Template Select */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={presetTemplate}
              onChange={(e) => setPresetTemplate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-purple-500 pr-8 appearance-none cursor-pointer"
            >
              <option value="">选择预设模板</option>
              <option value="t1">电商对标翻拍标准模板</option>
              <option value="t2">短视频二创剧情模板</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <span>存为预设模板</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Form Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 w-full">
        
        {/* SECTION 1: 脚本基本信息 & 标签 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
          
          {/* 1. 脚本分类 */}
          <div className="flex items-center gap-4">
            <label className="w-24 font-bold text-slate-700 text-right shrink-0">
              <span className="text-rose-500 mr-0.5">*</span>脚本分类
            </label>
            <div className="flex-1">
              <CategoryCascader
                scope="scripts"
                primaryCategory={primaryCategory}
                secondaryCategory={secondaryCategory}
                onSelect={(p, s) => {
                  setPrimaryCategory(p);
                  setSecondaryCategory(s);
                }}
              />
            </div>
          </div>

          {/* 2. 脚本标题 */}
          <div className="flex items-center gap-4">
            <label className="w-24 font-bold text-slate-700 text-right shrink-0">
              <span className="text-rose-500 mr-0.5">*</span>脚本标题
            </label>
            <input
              type="text"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              placeholder="请输入脚本标题"
              className="flex-1 bg-white border border-slate-200 focus:border-purple-500 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none shadow-2xs"
            />
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
                  onBlur={() => setTimeout(() => setShowTaskDropdown(false), 200)}
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
                  <p className="font-bold text-xs text-slate-700 mb-4">我的待办任务</p>
                  <div className="flex flex-col items-center justify-center text-slate-400 py-4 space-y-2">
                    <Folder className="w-10 h-10 stroke-1 text-slate-300" />
                    <span className="text-xs">暂无待办任务</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. 公共标签 */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-3">
              <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                <span className="text-rose-500 mr-0.5">*</span>公共标签
              </span>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={publicTagSearch}
                  onChange={(e) => setPublicTagSearch(e.target.value)}
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

            {/* 公共标签 3 模块 Panel */}
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
                  <span className="text-[10px] text-slate-400 font-normal">多选</span>
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
                                setAddedPublicTags(addedPublicTags.filter((t) => t !== subTag));
                              } else {
                                setAddedPublicTags([...addedPublicTags, subTag]);
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
                            onClick={() => setAddedPublicTags(addedPublicTags.filter((t) => t !== tag))}
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

          {/* 5. 个人标签 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-3">
              <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                个人标签
              </span>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={personalTagSearch}
                  onChange={(e) => setPersonalTagSearch(e.target.value)}
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

            {/* 个人标签 3 模块 Panel */}
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
                  <span className="text-[10px] text-slate-400 font-normal">多选</span>
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
                                setAddedPersonalTags(addedPersonalTags.filter((t) => t !== subTag));
                              } else {
                                setAddedPersonalTags([...addedPersonalTags, subTag]);
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
                            onClick={() => setAddedPersonalTags(addedPersonalTags.filter((t) => t !== tag))}
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

        {/* SECTION 2: 填写脚本 */}
        <DynamicScriptTemplateForm ref={scriptTemplateFormRef} />
        {/* SECTION 3: 更多设置 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">更多设置</h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={presetPermissionConfig}
                  onChange={(e) => setPresetPermissionConfig(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-purple-500 pr-8 appearance-none cursor-pointer"
                >
                  <option value="">选择预设配置</option>
                  <option value="p1">公开访问配置</option>
                  <option value="p2">仅部门访问配置</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <span>存为预设模板</span>
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. 谁可以看 */}
          <div className="flex items-center gap-4">
            <label className="w-24 font-bold text-slate-700 text-right shrink-0">
              <span className="text-rose-500 mr-0.5">*</span>谁可以看
            </label>
            <div className="flex items-center gap-5 text-xs font-bold text-slate-700">
              {(["公开", "部门成员", "分组成员", "公用资源", "指定范围"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="scriptViewPermission"
                    checked={viewPermission === opt}
                    onChange={() => setViewPermission(opt)}
                    className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>{opt}</span>
                  {opt === "公用资源" && <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-0.5" />}
                </label>
              ))}
            </div>
          </div>

          {/* 2. 修改日期 */}
          <div className="flex items-center gap-4">
            <label className="w-24 font-bold text-slate-700 text-right shrink-0">
              修改日期
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  placeholder="请选择生效时间"
                  className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500 shadow-2xs"
                />
              </div>
              <span className="text-[11px] text-slate-400">将在所选日期 00:00 自动修改脚本查看权限</span>
            </div>
          </div>

          {/* 3. 提醒谁看 */}
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                提醒谁看
              </label>

              <div className="flex-1 flex items-center gap-3">
                <div className="relative w-44">
                  <select
                    value={reminderUser}
                    onChange={(e) => setReminderUser(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs appearance-none pr-8"
                  >
                    <option value="">请选择</option>
                    <option value="user1">李明 (剪辑负责人)</option>
                    <option value="user2">王芳 (项目经理)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <span className="font-bold text-slate-700 shrink-0">并发送消息</span>

                <input
                  type="text"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  placeholder="请输入消息"
                  className="flex-1 bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-colors shadow-2xs"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="px-8 py-3 bg-white border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 shadow-lg">
        <button
          type="button"
          onClick={() => handlePublish(true)}
          disabled={isSubmitting}
          className="bg-white border border-purple-200 hover:border-purple-300 hover:bg-purple-50/50 text-purple-700 font-bold text-xs px-5 py-2 rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
        >
          <span>发布后，相同配置继续上传</span>
          <HelpCircle className="w-4 h-4 text-purple-500 stroke-[1.75]" />
        </button>

        <button
          type="button"
          onClick={() => handlePublish(false)}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs px-9 py-2 rounded-full transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "正在发布..." : "发布"}
        </button>
      </div>

    </div>
  );
}
