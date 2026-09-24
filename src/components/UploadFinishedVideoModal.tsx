import React, { useState } from "react";
import { useResourceConfig } from "../lib/useResourceConfig";
import { VIDEO_RESOURCE_SCOPES, type VideoPartition } from "../lib/resourceConfig";
import CategoryCascader from "./CategoryCascader";
import { useTagCatalog, useTagGroupSelection, useTagSelection } from "../lib/useResourceTags";
import AssetPagination from "./AssetPagination";
import LinkScriptModal from "./LinkScriptModal";
import OverlayPortal from "./overlays/OverlayPortal";
import {
  X,
  UploadCloud,
  FolderPlus,
  Video,
  Plus,
  RefreshCw,
  HelpCircle,
  Shield,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  FileText,
  ListTodo,
  Folder,
} from "lucide-react";

import { publishResources, type ResourcePublishDetails } from "../lib/resourceUploads";
import { operationUser } from "../lib/operationHistory";

export interface VideoPublishDetails extends ResourcePublishDetails {
  partition: VideoPartition;
  primaryCategory: string;
  secondaryCategory: string;
  names: string[];
}

interface UploadFinishedVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishSuccess?: (msg: string, details?: VideoPublishDetails) => void;
  initialTaskCode?: string;
  initialPartition?: VideoPartition;
  isPage?: boolean;
  initialFiles?: Array<{ name: string; type?: string; url?: string }>;
  stayOpenOnPublish?: boolean;
  lockFiles?: boolean;
}

// Hierarchical Category Data (一级分类 -> 二级分类)


// Mock Task Collaboration Items for Task Picker Modal
const MOCK_COLLAB_TASKS = [
  {
    id: "1148431",
    name: "抖音电商服装爆款切片任务",
    status: "进行中",
    creator: "张三",
    date: "2026-08-08",
  },
  {
    id: "1148432",
    name: "保暖内衣痛点文案拍摄协作",
    status: "进行中",
    creator: "李四",
    date: "2026-08-07",
  },
  {
    id: "1148433",
    name: "美妆复盘口播二创大单",
    status: "已完成",
    creator: "王五",
    date: "2026-08-05",
  },
  {
    id: "1148434",
    name: "明星高光剪辑专项",
    status: "进行中",
    creator: "邓彦晨",
    date: "2026-08-04",
  },
  {
    id: "1148435",
    name: "无痕内衣防勾丝抗起球专题",
    status: "审核中",
    creator: "赵六",
    date: "2026-08-03",
  },
];

// Mock Script Items for Script Picker Modal
const MOCK_SCRIPTS_LIST = [
  {
    id: "SC-20260801",
    name: "保暖内衣3秒黄金前3秒吸引Hook",
    type: "电商爆款",
    creator: "张三",
    date: "2026-08-08",
  },
  {
    id: "SC-20260802",
    name: "无钢圈内衣极致舒爽测评文案",
    type: "种草口播",
    creator: "李四",
    date: "2026-08-07",
  },
  {
    id: "SC-20260803",
    name: "吊带裙外穿穿搭痛点剧本",
    type: "剧情二创",
    creator: "王五",
    date: "2026-08-06",
  },
  {
    id: "SC-20260804",
    name: "明星同款防晒衣实测对比脚本",
    type: "硬广合集",
    creator: "邓彦晨",
    date: "2026-08-05",
  },
  {
    id: "SC-20260805",
    name: "防勾光腿神器防抓对比文案",
    type: "测评对比",
    creator: "刘敏",
    date: "2026-08-02",
  },
];

// Mock Tag Groups & Sub-Tags for Personal & Public Tags


// Preset Template Model
interface PresetTemplate {
  id: string;
  name: string;
  partition: VideoPartition;
  primaryCategory: string;
  secondaryCategory: string;
  nameType: "filename" | "custom" | "prefix";
  customName?: string;
  prefixName?: string;
}

const INITIAL_PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "default-1",
    name: "默认电商成片模板",
    partition: "成片",
    primaryCategory: "女士内衣",
    secondaryCategory: "无钢圈",
    nameType: "filename",
  },
  {
    id: "default-2",
    name: "混剪二创视频模板",
    partition: "素材",
    primaryCategory: "彩妆护肤",
    secondaryCategory: "护肤试用片",
    nameType: "prefix",
    prefixName: "二创卡点_",
  },
];

export default function UploadFinishedVideoModal({
  isOpen,
  onClose,
  onPublishSuccess,
  initialTaskCode = "",
  initialPartition = "成片",
  isPage = false,
  initialFiles = [],
  stayOpenOnPublish = false,
  lockFiles = false,
}: UploadFinishedVideoModalProps) {
  if (!isOpen) return null;

  // Form States
  const [rotation, setRotation] = useState<"none" | "90" | "-90" | "180">(
    "none",
  );
  const { store: configStore } = useResourceConfig();
  const categoryOptions = (type: VideoPartition) => configStore.categories(VIDEO_RESOURCE_SCOPES[type]).map(n => ({ primary: n.name, secondaries: n.children.map(c => c.name) }));
  const [partition, setPartition] = useState<VideoPartition>(initialPartition);
  const productionDateLabel = partition === "成片" ? "剪辑时间" : "拍摄时间";
  const initialCategory = categoryOptions(initialPartition)[0] || { primary: "", secondaries: [] };

  // Hierarchical Category State (一级 + 二级)
  const [selectedPrimaryCat, setSelectedPrimaryCat] =
    useState<string>(initialCategory.primary);
  const [selectedSecondaryCat, setSelectedSecondaryCat] =
    useState<string>(initialCategory.secondaries[0] || "");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [hoveredPrimaryCat, setHoveredPrimaryCat] =
    useState<string>(initialCategory.primary);

  const [nameType, setNameType] = useState<"filename" | "custom" | "prefix">(
    "filename",
  );
  const [customName, setCustomName] = useState<string>(
    `邓彦晨_${new Date().toISOString().slice(0, 10)}_${new Date().toTimeString().slice(0, 8)}_${Math.floor(Math.random() * 899999 + 100000)}`,
  );
  const [prefixName, setPrefixName] = useState<string>("");

  // Preset Template State
  const [presetTemplates, setPresetTemplates] = useState<PresetTemplate[]>(
    INITIAL_PRESET_TEMPLATES,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templateToast, setTemplateToast] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = presetTemplates.find((t) => t.id === templateId);
    if (!tpl) return;

    // Extract preset contents: 视频分区, 视频分类, 视频名称
    setPartition(tpl.partition);
    setSelectedPrimaryCat(tpl.primaryCategory);
    setSelectedSecondaryCat(tpl.secondaryCategory);
    setHoveredPrimaryCat(tpl.primaryCategory);
    setNameType(tpl.nameType);
    if (tpl.customName !== undefined) setCustomName(tpl.customName);
    if (tpl.prefixName !== undefined) setPrefixName(tpl.prefixName);

    setTemplateToast(`已套用预设模板：「${tpl.name}」`);
    setTimeout(() => setTemplateToast(null), 3000);
  };

  const handleOpenSaveTemplateModal = () => {
    setNewTemplateName(
      `预设模板_${new Date().toISOString().slice(5, 10).replace("-", "")}_${Math.floor(Math.random() * 899 + 100)}`,
    );
    setShowSaveTemplateModal(true);
  };

  const handleConfirmSaveTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTpl: PresetTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      partition,
      primaryCategory: selectedPrimaryCat,
      secondaryCategory: selectedSecondaryCat,
      nameType,
      customName: nameType === "custom" ? customName : undefined,
      prefixName: nameType === "prefix" ? prefixName : undefined,
    };

    setPresetTemplates((prev) => [...prev, newTpl]);
    setSelectedTemplateId(newTpl.id);
    setShowSaveTemplateModal(false);

    setTemplateToast(
      `✅ 预设模板「${newTpl.name}」已成功保存！仅包含视频分区、分类与名称设置。`,
    );
    setTimeout(() => setTemplateToast(null), 3500);
  };

  // Association States
  const [selectedTask, setSelectedTask] = useState<{
    id: string;
    name: string;
  } | null>(
    initialTaskCode ? { id: initialTaskCode, name: "关联协作任务" } : null,
  );
  const [associatedTask, setAssociatedTask] = useState<string>(
    initialTaskCode ? initialTaskCode : "",
  );
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [selectedScript, setSelectedScript] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Task & Script Picker Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [taskPageSize, setTaskPageSize] = useState(20);
  const [showScriptDropdown, setShowScriptDropdown] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptSearch, setScriptSearch] = useState("");
  const filteredTaskOptions = MOCK_COLLAB_TASKS.filter(
    (t) => t.id.includes(taskSearch) || t.name.includes(taskSearch),
  );
  const currentTaskPage = Math.min(
    taskPage,
    Math.max(1, Math.ceil(filteredTaskOptions.length / taskPageSize)),
  );
  const pagedTaskOptions = filteredTaskOptions.slice(
    (currentTaskPage - 1) * taskPageSize,
    currentTaskPage * taskPageSize,
  );

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

  // Date and other info
  const [editDate, setEditDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [authStartDate, setAuthStartDate] = useState<string>("");
  const [authEndDate, setAuthEndDate] = useState<string>("");
  const [videoDesc, setVideoDesc] = useState<string>("");
  const [douyinLikes, setDouyinLikes] = useState<string>("");

  // Permissions (Default to "public" / "公开")
  const [permissionType, setPermissionType] = useState<
    "public" | "team" | "group" | "common" | "specified"
  >("public");
  const [specifiedTeam, setSpecifiedTeam] = useState<string>("");
  const [specifiedGroup, setSpecifiedGroup] = useState<string>("");
  const [specifiedPerson, setSpecifiedPerson] = useState<string>("");

  const [permissionChangeDate, setPermissionChangeDate] = useState<string>("");
  const [receiver, setReceiver] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");

  // Selected files
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(() =>
    initialFiles.map(
      (file) => new File([""], file.name, { type: file.type || "video/mp4" }),
    ),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (lockFiles) return;
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handlePublish = (modeText: string = "发布") => {
    const ownerId = operationUser();
    if (uploadedFiles.length === 0 || isSubmitting) return;
    if (!configStore.categoryValid(VIDEO_RESOURCE_SCOPES[partition], selectedPrimaryCat, selectedSecondaryCat)) { setTemplateToast("请选择当前可用的一级分类和二级分类"); return; }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (!configStore.categoryValid(VIDEO_RESOURCE_SCOPES[partition], selectedPrimaryCat, selectedSecondaryCat)) { setTemplateToast("分类已变更，请重新选择"); return; }
      const names = uploadedFiles.map((file) => nameType === "custom" ? customName : nameType === "prefix" ? `${prefixName}${file.name}` : file.name);
      const published = publishResources({ ownerId, partition, primaryCategory: selectedPrimaryCat, secondaryCategory: selectedSecondaryCat,
        publicTags: addedPublicTags, personalTags: addedPersonalTags,
        files: uploadedFiles.map((file, index) => ({ name: names[index], size: file.size, url: initialFiles.find((initial) => initial.name === file.name)?.url || URL.createObjectURL(file) })),
      });
      if (!stayOpenOnPublish) onClose();
      if (onPublishSuccess) {
        onPublishSuccess(`视频已成功${modeText}至资源库`, {
          ...published,
          partition,
          primaryCategory: selectedPrimaryCat,
          secondaryCategory: selectedSecondaryCat,
          names: uploadedFiles.map((file) =>
            nameType === "custom"
              ? customName
              : nameType === "prefix"
                ? `${prefixName}${file.name}`
                : file.name,
          ),
        });
      }
    }, 800);
  };

  // Get current available categories for current partition
  const currentCategoryGroups =
    categoryOptions(partition);
  const activePrimaryObj =
    currentCategoryGroups.find((c) => c.primary === selectedPrimaryCat) ||
    currentCategoryGroups[0];

  const content = (
    <div
      data-testid={isPage ? "video-upload-page" : undefined}
      className={
        isPage
          ? "flex-1 flex flex-col min-h-0 bg-[#F8F9FD] w-full h-full overflow-hidden animate-in fade-in duration-200"
          : "fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      }
    >
      <div
        className={
          isPage
            ? "bg-[#F8F9FD] w-full flex-1 flex flex-col overflow-hidden"
            : "bg-[#F8F9FD] rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden"
        }
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {isPage && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mr-2"
                title="返回资源库"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回列表</span>
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-extrabold text-slate-900">
                  视频上传页面
                </h2>
                {!lockFiles && (
                  <span className="text-xs text-slate-400">
                    支持拖拽 200 个视频，上传的视频将显示在资源库列表中。
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 font-sans">
          {/* SECTION 1: Drag & Drop Box */}
          <div className="bg-white rounded-xl p-5 border border-purple-100/80 shadow-2xs">
            {!lockFiles && (
              <div className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/50 rounded-2xl p-6 text-center transition-all relative group cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">
                    +
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    粘贴或拖拽至此，或点击上传按钮上传
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-2 z-20">
                    <div className="bg-white border border-slate-200 hover:border-purple-300 shadow-2xs rounded-xl px-5 py-3 flex items-center gap-3 transition-colors cursor-pointer">
                      <Video className="w-5 h-5 text-purple-600" />
                      <div className="text-left">
                        <div className="font-bold text-slate-800 text-xs">
                          选择视频
                        </div>
                        <div className="text-[10px] text-slate-400">
                          支持单个或多个文件上传
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 hover:border-purple-300 shadow-2xs rounded-xl px-5 py-3 flex items-center gap-3 transition-colors cursor-pointer">
                      <FolderPlus className="w-5 h-5 text-purple-600" />
                      <div className="text-left">
                        <div className="font-bold text-slate-800 text-xs">
                          选择文件夹
                        </div>
                        <div className="text-[10px] text-slate-400">
                          自动扫描文件夹，仅将视频格式加入上传队列
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadedFiles.map((f, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    {f.name}
                    {!lockFiles && (
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="hover:text-rose-600 ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: 视频处理 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-sm">视频处理</h3>
            </div>

            <div className="flex items-center gap-6 pl-3">
              <span className="text-slate-600 font-medium">旋转视频</span>
              <div className="flex items-center gap-5">
                {[
                  { id: "none", label: "不旋转" },
                  { id: "90", label: "顺时针旋转90°" },
                  { id: "-90", label: "逆时针旋转90°" },
                  { id: "180", label: "旋转180°" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700"
                  >
                    <input
                      type="radio"
                      name="rotation"
                      checked={rotation === item.id}
                      onChange={() => setRotation(item.id as any)}
                      className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: 视频信息 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">视频信息</h3>
                  <p className="text-[11px] text-slate-400">
                    填写视频分区、分类、关联项及命名设置
                  </p>
                </div>
              </div>

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
                  onClick={handleOpenSaveTemplateModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="存为预设模板"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>存为预设模板</span>
                </button>
              </div>
            </div>

            {templateToast && (
              <div className="bg-purple-50 border border-purple-200 text-purple-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
                <span>{templateToast}</span>
                <button
                  type="button"
                  onClick={() => setTemplateToast(null)}
                  className="text-purple-400 hover:text-purple-700 cursor-pointer font-bold text-sm ml-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Sub-section: 基础信息 */}
            <div className="space-y-4 pl-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
                <h4 className="font-bold text-slate-900 text-xs">基础信息</h4>
              </div>

              {/* 视频分区 */}
              <div className="flex items-center gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  <span className="text-rose-500 mr-0.5">*</span>视频分区
                </span>
                <div className="flex items-center gap-6">
                  {(["成片", "素材", "第三方"] as const).map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700"
                    >
                      <input
                        type="radio"
                        name="partition"
                        checked={partition === p}
                        onChange={() => {
                          setPartition(p);
                          const firstPrim = categoryOptions(p)[0] || { primary: "", secondaries: [] };
                          setSelectedPrimaryCat(firstPrim.primary);
                          setSelectedSecondaryCat(
                            firstPrim.secondaries[0] || "",
                          );
                        }}
                        className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. 视频分类 (下拉框：左侧选择一级分类，右侧选择二级分类) */}
              <div className="flex items-start gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0 pt-2"><span className="text-rose-500 mr-0.5">*</span>视频分类</span>
                <div className="flex-1"><CategoryCascader scope={VIDEO_RESOURCE_SCOPES[partition]} primaryCategory={selectedPrimaryCat} secondaryCategory={selectedSecondaryCat} onSelect={(primary, secondary) => { setSelectedPrimaryCat(primary); setSelectedSecondaryCat(secondary); }} /></div>
              </div>

              {/* 3. 视频名称 */}
              <div className="flex items-start gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0 pt-1">
                  <span className="text-rose-500 mr-0.5">*</span>视频名称
                </span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-5">
                    {[
                      { id: "filename", label: "使用文件名" },
                      { id: "custom", label: "自定义" },
                      { id: "prefix", label: "前缀+文件名" },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700"
                      >
                        <input
                          type="radio"
                          name="nameType"
                          checked={nameType === item.id}
                          onChange={() => setNameType(item.id as any)}
                          className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>

                  {nameType === "custom" && (
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  )}

                  {nameType === "prefix" && (
                    <input
                      type="text"
                      value={prefixName}
                      onChange={(e) => setPrefixName(e.target.value)}
                      placeholder="请输入前缀"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  )}
                </div>
              </div>

              {/* 4. 关联任务 */}
              <div className="flex items-center gap-6 pl-3 relative">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  关联任务
                </span>
                <div className="flex-1 relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={associatedTask}
                      onChange={(e) => {
                        setAssociatedTask(e.target.value);
                        if (!e.target.value) {
                          setSelectedTask(null);
                        }
                      }}
                      onFocus={() => setShowTaskDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowTaskDropdown(false), 200)
                      }
                      placeholder="输入任务编号 / 备注 / ID 搜索"
                      className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-colors shadow-2xs pr-8"
                    />
                    {associatedTask && (
                      <button
                        type="button"
                        onClick={() => {
                          setAssociatedTask("");
                          setSelectedTask(null);
                        }}
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

              {/* 5. 关联脚本 (从脚本管理列表中选择) */}
              <div className="flex items-center gap-6 pl-3 relative">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  关联脚本
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      readOnly
                      value={
                        selectedScript
                          ? `${selectedScript.id} - ${selectedScript.name}`
                          : ""
                      }
                      onClick={() => setShowScriptDropdown((prev) => !prev)}
                      placeholder="关联脚本，后续可自动统计脚本效果数据"
                      className="w-full bg-white border border-slate-200 hover:border-purple-400 focus:border-purple-500 rounded-lg px-3 py-2 pr-8 text-xs text-slate-800 cursor-pointer focus:outline-none transition-colors shadow-2xs"
                    />
                    {selectedScript && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScript(null);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer text-xs"
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
                            {selectedTask || associatedTask
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

            {/* Sub-section: 标签信息 (公共标签 + 个人标签 按照设计要求呈现) */}
            <div className="space-y-6 pl-1 pt-3 border-t border-slate-100">
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
                                      addedPublicTags.filter(
                                        (t) => t !== subTag,
                                      ),
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

            {/* Sub-section: 时间设置 */}
            <div className="space-y-4 pl-1 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
                <h4 className="font-bold text-slate-900 text-xs">时间设置</h4>
                <span className="text-[11px] text-slate-400 font-normal">
                  {productionDateLabel}、授权有效期
                </span>
              </div>

              <div className="flex items-center gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  {productionDateLabel}
                </span>
                <input
                  type="date"
                  aria-label={productionDateLabel}
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  授权有效期
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={authStartDate}
                    onChange={(e) => setAuthStartDate(e.target.value)}
                    placeholder="开始日期"
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="date"
                    value={authEndDate}
                    onChange={(e) => setAuthEndDate(e.target.value)}
                    placeholder="结束日期"
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: 其他信息 */}
            <div className="space-y-4 pl-1 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
                <h4 className="font-bold text-slate-900 text-xs">其他信息</h4>
                <span className="text-[11px] text-slate-400 font-normal">
                  补充说明
                </span>
              </div>

              <div className="flex items-start gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0 pt-2">
                  视频备注
                </span>
                <textarea
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  placeholder="请输入视频备注"
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 min-h-[60px]"
                />
              </div>

              <div className="flex items-center gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  抖音数据
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">点赞</span>
                  <input
                    type="text"
                    value={douyinLikes}
                    onChange={(e) => setDouyinLikes(e.target.value)}
                    placeholder="请输入数据"
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: 权限设置 (默认权限为公开) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">权限设置</h3>
                  <p className="text-[11px] text-slate-400">
                    设置查看权限（默认公开）、定时权限变更和消息提醒。
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 cursor-pointer focus:outline-none">
                  <option value="">选择预设配置</option>
                  <option value="public">全员公开配置</option>
                  <option value="dept">仅部门协作配置</option>
                </select>
                <button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>存为预设模板</span>
                  <HelpCircle className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>

            {/* Sub-section: 查看权限 */}
            <div className="space-y-4 pl-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
                <h4 className="font-bold text-slate-900 text-xs">查看权限</h4>
              </div>

              <div className="flex items-start gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0 pt-0.5">
                  <span className="text-rose-500 mr-0.5">*</span>视频查看权限
                </span>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-5 flex-wrap">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-700">
                      <input
                        type="radio"
                        name="permissionType"
                        checked={permissionType === "public"}
                        onChange={() => setPermissionType("public")}
                        className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>公开 (默认)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="permissionType"
                        checked={permissionType === "team"}
                        onChange={() => setPermissionType("team")}
                        className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>部门成员</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="permissionType"
                        checked={permissionType === "group"}
                        onChange={() => setPermissionType("group")}
                        className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>分组成员</span>
                    </label>

                    {/* 公用资源 with Tooltip */}
                    <div className="relative group inline-block">
                      <label className="flex items-center gap-1 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="permissionType"
                          checked={permissionType === "common"}
                          onChange={() => setPermissionType("common")}
                          className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>公用资源</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </label>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                        <div className="bg-[#2B2B2E] text-white text-[11px] leading-relaxed px-3 py-2 rounded-md shadow-xl whitespace-nowrap">
                          不再判断：几天后可见/几天后可下载
                          <br />
                          有角色+分类权限的人：可随时查看/下载/复制到剪映
                        </div>
                        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-5 border-t-[#2B2B2E] mx-auto -mt-px" />
                      </div>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="permissionType"
                        checked={permissionType === "specified"}
                        onChange={() => setPermissionType("specified")}
                        className="accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>指定范围</span>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    控制视频上传后哪些人可以查看该视频。
                  </p>

                  {/* Specified Inputs */}
                  {permissionType === "specified" && (
                    <div className="flex items-center gap-4 pt-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">
                          指定部门
                        </span>
                        <select
                          value={specifiedTeam}
                          onChange={(e) => setSpecifiedTeam(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer min-w-[140px]"
                        >
                          <option value="">请选择</option>
                          <option value="直播事业部">直播事业部</option>
                          <option value="短视频运营部">短视频运营部</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">
                          指定分组
                        </span>
                        <select
                          value={specifiedGroup}
                          onChange={(e) => setSpecifiedGroup(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer min-w-[140px]"
                        >
                          <option value="">请选择</option>
                          <option value="剪辑一组">剪辑一组</option>
                          <option value="二创二组">二创二组</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">
                          指定人员
                        </span>
                        <select
                          value={specifiedPerson}
                          onChange={(e) => setSpecifiedPerson(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer min-w-[140px]"
                        >
                          <option value="">请选择</option>
                          <option value="张三">张三</option>
                          <option value="李四">李四</option>
                          <option value="王五">王五</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-section: 定期权限 */}
            <div className="space-y-4 pl-1 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
                <h4 className="font-bold text-slate-900 text-xs">定期权限</h4>
                <span className="text-[11px] text-slate-400 font-normal">
                  可选，到期后自动修改查看权限
                </span>
              </div>

              <div className="flex items-center gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  修改日期
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={permissionChangeDate}
                    onChange={(e) => setPermissionChangeDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    将在所选日期 00:00 自动修改视频查看权限
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-section: 消息提醒 */}
            <div className="space-y-4 pl-1 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-purple-600 rounded-full" />
                <h4 className="font-bold text-slate-900 text-xs">消息提醒</h4>
              </div>

              <div className="flex items-center gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  接收人
                </span>
                <div className="flex-1 space-y-1">
                  <select
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">请选择</option>
                    <option value="user1">李明 (剪辑负责人)</option>
                    <option value="user2">王芳 (项目经理)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pl-3">
                <span className="w-24 text-slate-700 font-bold text-right shrink-0">
                  消息内容
                </span>
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="请输入消息内容"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar (同级按钮排列) */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 shadow-lg">
          {/* 1. 发布后，相同配置继续上传 */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => handlePublish("相同配置继续上传")}
              className="bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>发布后，相同配置继续上传</span>
              <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
            </button>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block z-50 w-80 sm:w-96 p-3 bg-[#2D2D2D] text-white rounded-lg shadow-2xl text-[11px] leading-relaxed pointer-events-none animate-in fade-in duration-150">
              <p className="font-normal text-slate-100">
                适用于视频上传数量超过200个的情况。
              </p>
              <p className="font-normal text-slate-200 mt-1">
                使用此功能，可直接再次上传视频，系统将自动填写当前的分类、标签等配置信息，无需重复操作。只需选择文件，即可快速完成上传，省时高效。
              </p>
              {/* Caret Arrow pointing to ? icon */}
              <div className="absolute top-full right-5 -mt-1 w-2.5 h-2.5 bg-[#2D2D2D] rotate-45" />
            </div>
          </div>

          {/* 2. 视频上传完毕，自动发布 */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => handlePublish("自动发布")}
              className="bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>视频上传完毕，自动发布</span>
              <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
            </button>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:block z-50 w-80 sm:w-96 p-3 bg-[#2D2D2D] text-white rounded-lg shadow-2xl text-[11px] leading-relaxed pointer-events-none animate-in fade-in duration-150">
              <p className="font-normal text-slate-100">
                适用于视频无法立即上传完毕的情况。
              </p>
              <p className="font-normal text-slate-200 mt-1">
                视频上传完成后，系统将自动发布，无需您手动操作或在电脑前等待。帮助您节省时间、提高效率。
              </p>
              {/* Caret Arrow pointing to ? icon */}
              <div className="absolute top-full right-5 -mt-1 w-2.5 h-2.5 bg-[#2D2D2D] rotate-45" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePublish("发布")}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs px-8 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? "发布中..." : "发布"}
          </button>
        </div>
      </div>

      {/* Task Selection Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  选择关联任务
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => {
                    setTaskSearch(e.target.value);
                    setTaskPage(1);
                  }}
                  placeholder="搜索任务ID或任务名称..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {pagedTaskOptions.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask({ id: task.id, name: task.name });
                    setShowTaskModal(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedTask?.id === task.id
                      ? "border-purple-600 bg-purple-50/60 shadow-2xs"
                      : "border-slate-200/80 hover:border-purple-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                        ID: {task.id}
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        {task.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>创建人: {task.creator}</span>
                      <span>创建日期: {task.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        task.status === "进行中"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {task.status}
                    </span>
                    {selectedTask?.id === task.id && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-5">
              <AssetPagination
                total={filteredTaskOptions.length}
                page={currentTaskPage}
                pageSize={taskPageSize}
                onPageChange={setTaskPage}
                onPageSizeChange={(value) => {
                  setTaskPageSize(value);
                  setTaskPage(1);
                }}
              />
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                点击列表行选择对应的关联任务
              </span>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Selection Modal */}
      <LinkScriptModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        onConfirm={(selected) => {
          const chosen = Array.isArray(selected) ? selected[0] : selected;
          if (chosen) {
            setSelectedScript({ id: chosen.id, name: chosen.title });
          }
        }}
      />

      {/* 存为预设模板 Modal */}
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

              {/* Summary of extracted contents */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 border-b border-slate-200/60 pb-1.5 flex items-center justify-between">
                  <span>提取预设内容预览</span>
                  <span className="text-purple-600 font-medium text-[10px]">
                    仅保存视频信息
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">1. 视频分区:</span>
                    <span className="font-bold text-slate-800">
                      {partition}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">2. 视频分类:</span>
                    <span className="font-bold text-purple-600">
                      {selectedPrimaryCat} / {selectedSecondaryCat}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">3. 视频名称:</span>
                    <span className="font-bold text-slate-800">
                      {nameType === "filename"
                        ? "使用文件名"
                        : nameType === "custom"
                          ? `自定义 (${customName})`
                          : `前缀+文件名 (${prefixName || "未填写"})`}
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
                onClick={handleConfirmSaveTemplate}
                disabled={!newTemplateName.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                确定保存模板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return isPage ? (
    content
  ) : (
    <OverlayPortal layer="modal" className="fixed inset-0">
      {content}
    </OverlayPortal>
  );
}
