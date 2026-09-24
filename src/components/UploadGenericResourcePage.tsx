import React, { useState } from "react";
import { useTagCatalog, useTagGroupSelection, useTagSelection } from "../lib/useResourceTags";
import LinkScriptModal from "./LinkScriptModal";
import CategoryCascader from "./CategoryCascader";
import { resourceConfigStore } from "../lib/resourceConfig";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  X,
  Shield,
  HelpCircle,
  RefreshCw,
  Calendar,
  Search,
  ChevronDown,
  Folder
} from "lucide-react";
import { UploadFileType } from "./ResourcesView";
import UploadScriptPage from "./UploadScriptPage";
import UploadFinishedVideoModal from "./UploadFinishedVideoModal";
import { publishResources, type ResourcePublishDetails } from "../lib/resourceUploads";
import { operationUser } from "../lib/operationHistory";

interface UploadGenericResourcePageProps {
  type: UploadFileType;
  onClose: () => void;
  onPublishSuccess?: (msg: string, details?: ResourcePublishDetails) => void;
}



export default function UploadGenericResourcePage({
  type,
  onClose,
  onPublishSuccess
}: UploadGenericResourcePageProps) {
  if (type === "第三方") {
    return <UploadFinishedVideoModal isOpen isPage initialPartition="第三方" onClose={onClose} onPublishSuccess={onPublishSuccess} />;
  }
  if (type === "脚本") {
    return <UploadScriptPage onClose={onClose} onPublishSuccess={onPublishSuccess} />;
  }
  // Config per type
  const configMap: Record<
    Exclude<UploadFileType, "第三方">,
    { title: string; formats: string; icon: any; defaultName: string; accept: string; defaultCategory: string[] }
  > = {
    成片: {
      title: "视频上传",
      formats: "MP4, MOV, MKV (最大 2GB)",
      icon: Video,
      defaultName: "爆款洗发水高转化宣传视频_2026.mp4",
      accept: "video/*",
      defaultCategory: ["爆款素材", "内衣", "内裤", "通用", "二创剪辑"]
    },
    素材: {
      title: "素材上传",
      formats: "MP4, MOV, AVI (最大 5GB)",
      icon: Video,
      defaultName: "室外B-Roll打光原片_4K.mov",
      accept: "video/*",
      defaultCategory: ["镜头切片", "模特实拍", "痛点对比", "场景B-Roll"]
    },
    脚本: {
      title: "脚本上传",
      formats: "TXT, DOCX, PDF, MD (最大 50MB)",
      icon: FileText,
      defaultName: "爆款口播痛点对比三段式脚本_V2.docx",
      accept: ".docx,.doc,.txt,.pdf,.md",
      defaultCategory: ["口播文案", "AI拆解脚本", "直播话术", "二创创意"]
    },
    图片: {
      title: "图片上传",
      formats: "PNG, JPG, WEBP, PSD (最大 100MB)",
      icon: ImageIcon,
      defaultName: "高清商品主图_透明底精修图.png",
      accept: "image/*,.psd",
      defaultCategory: ["商品主图", "场景海报", "店铺宣发", "资质证明"]
    },
    音频: {
      title: "音频上传",
      formats: "MP3, WAV, AAC, M4A (最大 200MB)",
      icon: Music,
      defaultName: "欢快节奏电商带货背景音效_BGM.mp3",
      accept: "audio/*",
      defaultCategory: ["提臀裤", "保温衣", "内衣"]
    }
  };

  const config = configMap[type] || configMap["音频"];

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Preset Templates
  const [presetTemplate, setPresetTemplate] = useState("");

  // Basic Info States
  const resourceScope = { 成片: "finished", 素材: "materials", 图片: "images", 音频: "audio", 脚本: "scripts" }[type];
  const [primaryCategory, setPrimaryCategory] = useState(() => resourceConfigStore.categories(resourceScope)[0]?.name || "");
  const [secondaryCategory, setSecondaryCategory] = useState(() => resourceConfigStore.categories(resourceScope)[0]?.children[0]?.name || "");
  const [audioCategorySearch, setAudioCategorySearch] = useState("");
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<string>("提臀裤");
  const [namingType, setNamingType] = useState<"file_name" | "custom" | "prefix">("file_name");
  
  // Task & Script States
  const [associatedTask, setAssociatedTask] = useState("1148431");
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [associatedScript, setAssociatedScript] = useState("");
  const [showScriptDropdown, setShowScriptDropdown] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptSearchText, setScriptSearchText] = useState("");

  // Public Tag 3-Column States
  const [publicTagSearch, setPublicTagSearch] = useState("");
  const [publicGroupSearch, setPublicGroupSearch] = useState("");
  const [publicSubSearch, setPublicSubSearch] = useState("");
  const { publicGroups: PUBLIC_TAG_GROUPS, personalGroups: PERSONAL_TAG_GROUPS } = useTagCatalog();
  const [selectedPublicGroupKey, setSelectedPublicGroupKey] = useTagGroupSelection(PUBLIC_TAG_GROUPS);
  const [addedPublicTags, setAddedPublicTags] = useTagSelection("public");

  // Personal Tag 3-Column States
  const [personalTagSearch, setPersonalTagSearch] = useState("");
  const [personalGroupSearch, setPersonalGroupSearch] = useState("");
  const [personalSubSearch, setPersonalSubSearch] = useState("");
  const [selectedPersonalGroupKey, setSelectedPersonalGroupKey] = useTagGroupSelection(PERSONAL_TAG_GROUPS);
  const [addedPersonalTags, setAddedPersonalTags] = useTagSelection("personal");

  // Other Info
  const [audioDescription, setAudioDescription] = useState("");

  // Permission Settings
  const [presetPermissionConfig, setPresetPermissionConfig] = useState("");
  const [viewPermission, setViewPermission] = useState<"公开" | "部门成员" | "分组成员" | "公用资源" | "指定范围">("公开");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [receiver, setReceiver] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handlePublish = () => {
    const ownerId = operationUser();
    if (!selectedFile || isSubmitting) return;
    if (!resourceConfigStore.categoryValid(resourceScope, primaryCategory, secondaryCategory)) { setCategoryError("请选择当前可用的一级分类和二级分类"); return; }
    setCategoryError("");
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (!resourceConfigStore.categoryValid(resourceScope, primaryCategory, secondaryCategory)) { setCategoryError("分类已变更，请重新选择"); return; }
      const published = publishResources({ ownerId, partition: type, primaryCategory, secondaryCategory,
        publicTags: addedPublicTags, personalTags: addedPersonalTags,
        files: [{ name: selectedFile.name, size: selectedFile.size, url: URL.createObjectURL(selectedFile) }],
      });
      onClose();
      if (onPublishSuccess) {
        onPublishSuccess(`✅ 已成功上传【${type}】资源`, published);
      }
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F5F6FA] w-full h-full overflow-hidden animate-in fade-in duration-150">
      
      {categoryError && <div role="alert" className="px-6 py-2 text-rose-600 bg-rose-50 shrink-0">{categoryError}</div>}
      {/* Top Page Header Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mr-2"
            title="返回资源库"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </button>
          
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-extrabold text-slate-900">{config.title}页面</h2>
              <span className="text-xs text-slate-400">
                支持拖拽上传{type}文件，上传后的文件将显示在资源库列表中。
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Scrollable Form Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 font-sans w-full">
        
        {/* 1. File Upload Dropzone (Upper Card) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-[#FAFAFE] rounded-2xl p-10 text-center transition-all relative group cursor-pointer">
            <input
              type="file"
              accept={config.accept}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>上传本地文件</span>
              </button>
              <p className="text-xs text-slate-400 font-medium">
                {selectedFile ? `已选择文件: ${selectedFile.name}` : "粘贴或拖拽至此，或点击上传按钮上传"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. 音频信息 Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{config.title.replace("上传", "")}信息</h3>
                <span className="text-xs text-slate-400">填写{config.title.replace("上传", "")}分类、统一命名、关联任务及标签</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={presetTemplate}
                  onChange={(e) => setPresetTemplate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-purple-500 pr-8 appearance-none cursor-pointer"
                >
                  <option value="">选择预设模板</option>
                  <option value="template_1">电商带货通用配音模板</option>
                  <option value="template_2">短视频二创音效模板</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>存为预设模板</span>
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* --- Sub-section: 基础信息 --- */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
              <h4 className="font-bold text-slate-900 text-xs">基础信息</h4>
            </div>

            <div className="space-y-4 pl-3">
              {/* 分类 */}
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  <span className="text-rose-500 mr-0.5">*</span>{config.title.replace("上传", "")}分类
                </label>
                <div className="flex-1">
                  <CategoryCascader
                    scope={resourceScope}
                    primaryCategory={primaryCategory}
                    secondaryCategory={secondaryCategory}
                    onSelect={(p, s) => {
                      setPrimaryCategory(p);
                      setSecondaryCategory(s);
                    }}
                  />
                </div>
              </div>

              {/* 名称 */}
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  <span className="text-rose-500 mr-0.5">*</span>{config.title.replace("上传", "")}名称
                </label>
                <div className="flex items-center gap-6">
                  {(
                    [
                      { id: "file_name", label: "使用文件名称" },
                      { id: "custom", label: "自定义" },
                      { id: "prefix", label: "前缀+文件名称" }
                    ] as const
                  ).map((item) => (
                    <label key={item.id} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="radio"
                        name="namingType"
                        checked={namingType === item.id}
                        onChange={() => setNamingType(item.id)}
                        className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 关联任务 */}
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

              {/* 关联脚本 */}
              <div className="flex items-center gap-4 relative">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  关联脚本
                </label>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={associatedScript}
                    onClick={() => setShowScriptDropdown(prev => !prev)}
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

                  {/* Script Dropdown Popover */}
                  {showScriptDropdown && (
                    <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-5 w-full max-w-md animate-in fade-in duration-100 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="font-bold text-xs text-slate-800">任务关联脚本</span>
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

                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                          <Folder className="w-7 h-7 stroke-[1.25]" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {associatedTask ? "暂无关联脚本" : "暂无关联脚本，请先选择任务"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- Sub-section: 标签信息 --- */}
          <div className="space-y-5 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
              <h4 className="font-bold text-slate-900 text-xs">标签信息</h4>
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
                      .filter(g => g.includes(publicGroupSearch.trim()))
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
                      .filter(sub => sub.includes(publicSubSearch.trim()))
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
                                  setAddedPublicTags(addedPublicTags.filter(t => t !== subTag));
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
                              onClick={() => setAddedPublicTags(addedPublicTags.filter(t => t !== tag))}
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
            <div className="space-y-3 pl-3 pt-2">
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
                      .filter(g => g.includes(personalGroupSearch.trim()))
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
                      .filter(sub => sub.includes(personalSubSearch.trim()))
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
                                  setAddedPersonalTags(addedPersonalTags.filter(t => t !== subTag));
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
                              onClick={() => setAddedPersonalTags(addedPersonalTags.filter(t => t !== tag))}
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

          {/* --- Sub-section: 其他信息 --- */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
              <div className="flex items-baseline gap-2">
                <h4 className="font-bold text-slate-900 text-xs">其他信息</h4>
                <span className="text-xs text-slate-400">补充说明</span>
              </div>
            </div>

            <div className="flex items-start gap-4 pl-3">
              <label className="w-24 font-bold text-slate-700 text-right shrink-0 pt-2">
                {config.title.replace("上传", "")}备注
              </label>
              <textarea
                value={audioDescription}
                onChange={(e) => setAudioDescription(e.target.value)}
                placeholder={`请输入${config.title.replace("上传", "")}备注`}
                rows={3}
                className="flex-1 bg-white border border-slate-200 focus:border-purple-500 rounded-lg p-3 text-xs text-slate-800 focus:outline-none shadow-2xs resize-y"
              />
            </div>
          </div>
        </div>

        {/* 3. 权限设置 Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">权限设置</h3>
                <p className="text-[11px] text-slate-400">设置查看权限、定时权限变更和消息提醒</p>
              </div>
            </div>

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
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>存为预设模板</span>
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-section: 查看权限 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h4 className="font-bold text-slate-900 text-xs">查看权限</h4>
            </div>

            <div className="space-y-2 pl-3.5 border-l-2 border-slate-100">
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  <span className="text-rose-500 mr-1">*</span>{config.title.replace("上传", "")}查看权限
                </label>
                <div className="flex items-center gap-5 text-xs font-bold text-slate-700">
                  {(["公开", "部门成员", "分组成员", "公用资源", "指定范围"] as const).map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="permission"
                        checked={viewPermission === opt}
                        onChange={() => setViewPermission(opt)}
                        className="text-purple-600 focus:ring-purple-500 accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{opt}</span>
                      {opt === "公用资源" && <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-0.5" />}
                    </label>
                  ))}
                </div>
              </div>
              <p className="ml-28 text-[11px] text-slate-400">
                控制{config.title.replace("上传", "")}上传后哪些人可以查看该{config.title.replace("上传", "")}。
              </p>
            </div>
          </div>

          {/* Sub-section: 定期权限 */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h4 className="font-bold text-slate-900 text-xs">定期权限</h4>
              <span className="text-[11px] text-slate-400 font-normal">可选，到期后自动修改查看权限</span>
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
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500 shadow-2xs"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">将在所选日期 00:00 自动修改查看权限</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-section: 消息提醒 */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h4 className="font-bold text-slate-900 text-xs">消息提醒</h4>
            </div>

            <div className="space-y-3 pl-3.5 border-l-2 border-slate-100">
              {/* 接收人 */}
              <div className="flex items-center gap-4">
                <label className="w-24 font-bold text-slate-700 text-right shrink-0">
                  接收人
                </label>
                <select
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
                >
                  <option value="">请选择</option>
                  <option value="user1">李明 (剪辑负责人)</option>
                  <option value="user2">王芳 (项目经理)</option>
                </select>
              </div>

              {/* 消息内容 */}
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

      {/* Page Bottom Fixed Bar */}
      <div className="px-8 py-3 bg-white border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 shadow-lg">
        <button
          type="button"
          onClick={handlePublish}
          disabled={isSubmitting}
          className="bg-white border border-purple-200 hover:border-purple-300 hover:bg-purple-50/50 text-purple-700 font-bold text-xs px-5 py-2 rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
        >
          <span>发布后，相同配置继续上传</span>
          <HelpCircle className="w-4 h-4 text-purple-500 stroke-[1.75]" />
        </button>

        <button
          type="button"
          onClick={handlePublish}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs px-9 py-2 rounded-full transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "正在发布..." : "发布"}
        </button>
      </div>

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
