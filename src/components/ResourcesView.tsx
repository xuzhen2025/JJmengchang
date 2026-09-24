import React, { useState, useRef, useEffect } from "react";
import MaterialsView from "./MaterialsView";
import FinishedVideosView from "./FinishedVideosView";
import ScriptManagementView from "./ScriptManagementView";
import ImageManagementView from "./ImageManagementView";
import AudioManagementView from "./AudioManagementView";
import UploadFinishedVideoModal from "./UploadFinishedVideoModal";
import UploadImageModal from "./UploadImageModal";
import UploadGenericResourcePage from "./UploadGenericResourcePage";
import { TaskItem } from "./TaskCollaborationView";
import { Asset, ResourceSearchIntent } from "../types";
import {
  ShoppingBag,
  Film,
  FileText,
  Image as ImageIcon,
  Upload,
  ChevronDown,
  Music,
  X,
  CloudUpload,
  Check,
  Sparkles,
  Plus,
  FolderPlus,
  File,
} from "lucide-react";

interface ResourcesViewProps {
  uploadedVideos?: Asset[];
  initialTab?: "finished_videos" | "materials" | "third_party" | "scripts" | "images" | "audio";
  onTriggerTask?: (
    type: any,
    name: string,
    inputFiles: string[],
    cost: number,
  ) => void;
  onNavigateToDelivery?: () => void;
  onNavigateToTaskDetail?: (task: TaskItem) => void;
  initialSearch?: ResourceSearchIntent | null;
  onClearInitialSearch?: () => void;
  initialUpload?: {
    type: "图片" | "成片";
    files: Array<{ name: string; type: string; url: string }>;
  } | null;
  onClearInitialUpload?: () => void;
}

export type UploadFileType = "成片" | "素材" | "第三方" | "脚本" | "图片" | "音频";

export default function ResourcesView({
  uploadedVideos = [],
  initialTab = "finished_videos",
  onTriggerTask,
  onNavigateToDelivery,
  onNavigateToTaskDetail,
  initialSearch,
  onClearInitialSearch,
  initialUpload = null,
  onClearInitialUpload,
}: ResourcesViewProps) {
  const tabByType = {
    成片: "finished_videos",
    素材: "materials",
    第三方: "third_party",
    脚本: "scripts",
    图片: "images",
    音频: "audio",
  } as const;
  const [activeTab, setActiveTab] = useState<
    "finished_videos" | "materials" | "third_party" | "scripts" | "images" | "audio"
  >(initialSearch ? tabByType[initialSearch.type] : initialTab);
  const [activeSearch, setActiveSearch] = useState<ResourceSearchIntent | null>(
    initialSearch && (initialSearch.query || initialSearch.tag)
      ? initialSearch
      : null,
  );

  useEffect(() => {
    if (initialSearch) {
      setActiveSearch(
        initialSearch.query || initialSearch.tag ? initialSearch : null,
      );
      setActiveTab(tabByType[initialSearch.type]);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialSearch, initialTab]);

  const clearHomeSearch = () => {
    setActiveSearch(null);
    onClearInitialSearch?.();
  };

  // Dropdown menu state
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // In-page upload view state ("成片" | "素材" | "脚本" | "图片" | "音频" | null)
  const [uploadPageView, setUploadPageView] = useState<UploadFileType | null>(
    null,
  );

  useEffect(() => {
    if (!initialUpload) return;
    setActiveTab(initialUpload.type === "图片" ? "images" : "finished_videos");
    setUploadPageView(initialUpload.type);
  }, [initialUpload]);

  // Sub-view detail page open state (when viewing video detail, script detail, image detail, audio detail, etc.)
  const [isSubViewDetailOpen, setIsSubViewDetailOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUploadDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = [
    {
      id: "finished_videos" as const,
      name: "成片管理",
      icon: Film,
      desc: "渲染成片 / AI 生成视频 / 投放推送",
    },
    {
      id: "materials" as const,
      name: "素材管理",
      icon: ShoppingBag,
      desc: "原始片源 / 图片 / 音频 / 关联图谱",
    },
    {
      id: "third_party" as const,
      name: "第三方管理",
      icon: Film,
      desc: "第三方视频",
    },
    {
      id: "scripts" as const,
      name: "脚本管理",
      icon: FileText,
      desc: "口播文案 / AI分镜拆解 / 关联任务发布",
    },
    {
      id: "images" as const,
      name: "图片管理",
      icon: ImageIcon,
      desc: "商品高清图 / 资质设计 / 宣发素材",
    },
    {
      id: "audio" as const,
      name: "音频管理",
      icon: Music,
      desc: "人声音效 / 口播旁白 / BGM衬乐库",
    },
  ];

  const uploadOptions: {
    type: UploadFileType;
    label: string;
    icon: any;
    formats: string;
    tabTarget: "finished_videos" | "materials" | "scripts" | "images" | "audio";
    desc: string;
  }[] = [
    {
      type: "成片",
      label: "上传视频",
      icon: Film,
      formats: "MP4, MOV, MKV (最大 2GB)",
      tabTarget: "finished_videos",
      desc: "上传高画质视频，一键关联投放广告",
    },
    {
      type: "脚本",
      label: "上传脚本",
      icon: FileText,
      formats: "TXT, DOCX, PDF, MD",
      tabTarget: "scripts",
      desc: "分镜脚本、口播文案与AI裂变灵感模板",
    },
    {
      type: "图片",
      label: "上传图片",
      icon: ImageIcon,
      formats: "PNG, JPG, WEBP, PSD (最大 100MB)",
      tabTarget: "images",
      desc: "资质证明、店铺主图、场景海报与宣发素材",
    },
    {
      type: "音频",
      label: "上传音频",
      icon: Music,
      formats: "MP3, WAV, AAC, M4A",
      tabTarget: "audio",
      desc: "背景音乐、旁白配音与音效素材库",
    },
  ];

  const handleOpenUploadModal = (type: UploadFileType) => {
    setShowUploadDropdown(false);
    if (type === "成片" && activeTab === "third_party") {
      setUploadPageView("第三方");
      return;
    }
    const matchingOption = uploadOptions.find((o) => o.type === type);
    if (matchingOption) {
      setActiveTab(matchingOption.tabTarget);
    }
    setUploadPageView(type);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 font-sans text-slate-800 relative">
      {/* Toast Banner Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 页面顶部一级分类切换栏 + 右上角“上传文件”按钮 (仅在非上传页面且非详情页模式下显示) */}
      {!uploadPageView && !isSubViewDetailOpen && (
        <div className="pt-4 px-5 pb-1 bg-slate-50 shrink-0 z-30 relative">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs relative">
            <div className="flex items-center justify-between p-1.5 bg-slate-50/70 rounded-xl">
              {/* Left side: Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive =
                    activeTab === tab.id &&
                    !uploadPageView &&
                    !isSubViewDetailOpen;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        clearHomeSearch();
                        setUploadPageView(null);
                        setIsSubViewDetailOpen(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                        isActive
                          ? "bg-white text-[#7C3AED] shadow-2xs border border-purple-200/80 ring-1 ring-purple-100"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-[#7C3AED]" : "text-slate-400"}`}
                      />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right side: 右上角“上传文件”按钮 + 下拉菜单 */}
              <div className="relative shrink-0 ml-3" ref={dropdownRef}>
                <button
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                  className="bg-[#7C3AED] hover:bg-purple-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs cursor-pointer transition-all border border-purple-500/20"
                  title="选择文件类型进行上传"
                >
                  <Upload className="w-4 h-4" />
                  <span>上传文件</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showUploadDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* 下拉菜单 (Dropdown Menu) */}
                {showUploadDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100/80">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 tracking-wider">
                      选择上传资源类型
                    </div>
                    <div className="py-1">
                      {uploadOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.type}
                            onClick={() => handleOpenUploadModal(opt.type)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50/80 flex items-start gap-3 group transition-colors cursor-pointer"
                          >
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                                  {opt.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {opt.formats}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对应的内容视图/上传页面渲染区 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {uploadPageView === "图片" ? (
          <UploadImageModal
            isOpen={true}
            isPage={true}
            onClose={() => {
              setUploadPageView(null);
              onClearInitialUpload?.();
            }}
            initialFiles={
              initialUpload?.type === "图片" ? initialUpload.files : []
            }
            onPublishSuccess={(msg) => {
              showToast(msg);
              setUploadPageView(null);
              onClearInitialUpload?.();
            }}
          />
        ) : uploadPageView === "脚本" || uploadPageView === "音频" ? (
          <UploadGenericResourcePage
            type={uploadPageView}
            onClose={() => {
              setUploadPageView(null);
              onClearInitialUpload?.();
            }}
            onPublishSuccess={(msg) => {
              showToast(msg);
              setUploadPageView(null);
              onClearInitialUpload?.();
            }}
          />
        ) : uploadPageView ? (
          <UploadFinishedVideoModal
            isOpen={true}
            isPage={true}
            initialPartition={uploadPageView}
            initialFiles={
              initialUpload?.type === "成片" ? initialUpload.files : []
            }
            onClose={() => {
              setUploadPageView(null);
              onClearInitialUpload?.();
            }}
            onPublishSuccess={(msg, details) => {
              showToast(msg);
              setUploadPageView(null);
              onClearInitialUpload?.();
              if (details) setActiveTab(tabByType[details.partition]);
            }}
          />
        ) : (
          <>
            {activeTab === "finished_videos" && (
              <FinishedVideosView
                uploadedVideos={uploadedVideos.filter(
                  (asset) => asset.resourceCategory === "成片",
                )}
                initialSearch={activeSearch}
                onClearSearch={clearHomeSearch}
                onTriggerTask={onTriggerTask}
                onNavigateToDelivery={onNavigateToDelivery}
                onDetailStateChange={setIsSubViewDetailOpen}
              />
            )}
            {(activeTab === "materials" || activeTab === "third_party") && (
              <MaterialsView
                key={activeTab}
                resourceScope={activeTab === "third_party" ? "thirdParty" : "materials"}
                uploadedVideos={uploadedVideos.filter(
                  (asset) => asset.resourceCategory === (activeTab === "third_party" ? "第三方" : "素材"),
                )}
                initialSearch={activeSearch}
                onClearSearch={clearHomeSearch}
                onTriggerTask={onTriggerTask}
                onNavigateToDelivery={onNavigateToDelivery}
                onDetailStateChange={setIsSubViewDetailOpen}
              />
            )}
            {activeTab === "scripts" && (
              <ScriptManagementView
                initialSearch={activeSearch}
                onClearSearch={clearHomeSearch}
                onTriggerTask={onTriggerTask}
                onNavigateToTaskDetail={onNavigateToTaskDetail}
                onDetailStateChange={setIsSubViewDetailOpen}
              />
            )}
            {activeTab === "images" && (
              <ImageManagementView
                initialSearch={activeSearch}
                onClearSearch={clearHomeSearch}
                onTriggerTask={onTriggerTask}
                onDetailStateChange={setIsSubViewDetailOpen}
              />
            )}
            {activeTab === "audio" && (
              <AudioManagementView
                initialSearch={activeSearch}
                onClearSearch={clearHomeSearch}
                onTriggerTask={onTriggerTask}
                onDetailStateChange={setIsSubViewDetailOpen}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
