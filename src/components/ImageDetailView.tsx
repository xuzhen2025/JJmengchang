import React, { useState, useRef } from "react";
import { useResourceConfig, useResourceConfigState } from "../lib/useResourceConfig";
import { ResourceCategoryModal } from "./ResourceEditDialog";
import ResourceTagModal from "./ResourceTagModal";
import { useResourceTagState } from "../lib/useResourceTags";
import AnchoredPopover from "./overlays/AnchoredPopover";
import {
  ArrowLeft,
  X,
  ZoomIn,
  Edit2,
  Edit3,
  Plus,
  ArrowUpDown,
  Share2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Film,
  FileText,
  History,
  Box,
  Search
} from "lucide-react";

export interface ImageItem {
  id: string;
  title: string;
  imageUrl: string;
  badge: string;
  subtitle?: string;
  author?: string;
  primaryCategory: string;
  secondaryCategory: string;
  size: string;
  resolution: string;
  time: string;
  downloads: number;
  tags?: string[];
  publicTags?: string[];
  personalTags?: string[];
  personalTag?: string;
  isFolder?: boolean;
}

export interface ImageDetailViewProps {
  item: ImageItem;
  onClose: () => void;
  showToast: (msg: string) => void;
}







export interface OperationLogItem {
  id: string;
  operator: string;
  actionType: "修改标题" | "修改公共标签" | "修改个人标签" | "修改备注" | "类目变更" | "系统生成" | "修改套图排序";
  timestamp: string;
  beforeValue: string;
  afterValue: string;
}

export default function ImageDetailView({
  item,
  onClose,
  showToast
}: ImageDetailViewProps) {
  // Lightbox
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [selectedDetailThumbIndex, setSelectedDetailThumbIndex] = useState<number>(0);

  // Basic Info Fields & States (Matches FinishedVideoDetailModal pattern)
  const [categoryText, setCategoryText] = useResourceConfigState("images", item, "category");
  const { store: configStore } = useResourceConfig();
  const CATEGORY_TREE = configStore.categories("images").map(n => ({ name: n.name, subs: n.children.map(c => c.name) }));
  const [showModifyCategoryModal, setShowModifyCategoryModal] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedPrimaryCat, setSelectedPrimaryCat] = useState("资质 / a店铺");
  const [tempCategoryPath, setTempCategoryPath] = useState("");

  const [titleText, setTitleText] = useState(item.title);
  const [showModifyTitleModal, setShowModifyTitleModal] = useState(false);
  const [tempTitleText, setTempTitleText] = useState("");

  // Public Tags Modal States
  const [publicTags, setPublicTags] = useResourceTagState("images", item, "public");
  const [showPublicTagModal, setShowPublicTagModal] = useState(false);
  const [publicGroupSearch, setPublicGroupSearch] = useState("");
  const [publicSubSearch, setPublicSubSearch] = useState("");
  const [selectedPublicGroupKey, setSelectedPublicGroupKey] = useState("场景");
  const [tempAddedPublicTags, setTempAddedPublicTags] = useState<string[]>([]);
  const [publicPresetTab, setPublicPresetTab] = useState<"我的预设" | "分享给我">("我的预设");

  // Personal Tags Modal States
  const [personalTags, setPersonalTags] = useResourceTagState("images", item, "personal");
  const [showPersonalTagModal, setShowPersonalTagModal] = useState(false);
  const [personalGroupSearch, setPersonalGroupSearch] = useState("");
  const [personalSubSearch, setPersonalSubSearch] = useState("");
  const [selectedPersonalGroupKey, setSelectedPersonalGroupKey] = useState("常用精选");
  const [tempAddedPersonalTags, setTempAddedPersonalTags] = useState<string[]>([]);

  // Note State
  const [noteText, setNoteText] = useState("已完成电商首图审核与裁剪，高清无瑕疵，建议优先推广。");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNoteText, setTempNoteText] = useState(noteText);

  // More Menu
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Operation Logs
  const [logs, setLogs] = useState<OperationLogItem[]>([
    {
      id: "log_1",
      operator: "致上运营 (管理员)",
      actionType: "修改备注",
      timestamp: "2026-08-02 14:20:10",
      beforeValue: "暂无",
      afterValue: "已完成电商首图审核与裁剪，高清无瑕疵，建议优先推广。"
    },
    {
      id: "log_2",
      operator: "李四 (运营)",
      actionType: "修改公共标签",
      timestamp: "2026-07-28 10:15:33",
      beforeValue: "无",
      afterValue: "场景：测试2, 白爆款: 主图, 高清无水印"
    },
    {
      id: "log_3",
      operator: "系统生成",
      actionType: "系统生成",
      timestamp: "2025-05-26 12:25:11",
      beforeValue: "无",
      afterValue: "成功解析图片资源包，建立高清原图与多尺寸智能缩略图"
    }
  ]);
  const [logFilterType, setLogFilterType] = useState<string>("all");

  const addOperationLog = (
    actionType: OperationLogItem["actionType"],
    beforeValue: string,
    afterValue: string
  ) => {
    const newLog: OperationLogItem = {
      id: `log_${Date.now()}`,
      operator: "致上运营 (当前用户)",
      actionType,
      timestamp: new Date().toLocaleString("zh-CN", { hour12: false }),
      beforeValue: beforeValue || "无",
      afterValue: afterValue || "无"
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Suite Images / Thumbnails state
  const [suiteImages, setSuiteImages] = useState([
    { id: "img-sub-1", url: item.imageUrl, name: "微信图片_202303251645513.jpg" },
    { id: "img-sub-2", url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80", name: "微信图片_202303251645512.jpg" }
  ]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [tempSortList, setTempSortList] = useState<{ id: string; url: string; name: string }[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const currentImageUrl = suiteImages[selectedDetailThumbIndex]?.url || item.imageUrl;

  const handleSaveNote = () => {
    if (tempNoteText.trim() !== noteText) {
      addOperationLog("修改备注", noteText || "无", tempNoteText.trim() || "无");
      setNoteText(tempNoteText.trim());
      showToast("✅ 备注信息更新成功！");
    }
    setIsEditingNote(false);
  };

  const filteredLogs = logFilterType === "all" ? logs : logs.filter((l) => l.actionType === logFilterType);

  return (
    <div className="bg-slate-50/60 flex-1 min-h-0 h-full overflow-y-auto text-slate-800 space-y-6 pb-12 animate-fade-in font-sans">
      {/* 1. Top Page Header with Back Button & ID */}
      <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200/90 shadow-2xs sticky top-0 z-20">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-600 border border-slate-200 hover:border-purple-300 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
          title="返回图片列表"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600" />
          <span>返回图片列表</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            ID: {item.id === "img-1" ? "42029245" : item.id}
          </span>
        </div>
      </div>

      {/* 2. Main Page Body Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Main Card: Image Preview + Metadata Details */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (6 Cols): Big Image Preview + Thumbnails */}
          <div className="lg:col-span-6 space-y-4">
            {/* Big Image Box */}
            <div
              onClick={() => setFullScreenImage(currentImageUrl)}
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 group cursor-zoom-in shadow-xs transition-all hover:border-purple-300"
              title="点击查看大图"
            >
              <img
                src={currentImageUrl}
                alt={titleText}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              {/* Zoom Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="bg-black/75 backdrop-blur-md text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <ZoomIn className="w-4 h-4 text-purple-300" />
                  <span>点击查看大图</span>
                </div>
              </div>
            </div>

            {/* Thumbnails Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {suiteImages.map((t, idx) => (
                <div
                  key={t.id || idx}
                  onClick={() => setSelectedDetailThumbIndex(idx)}
                  className={`relative w-24 h-20 rounded-xl overflow-hidden cursor-pointer transition-all border-2 shrink-0 ${
                    selectedDetailThumbIndex === idx
                      ? "border-purple-600 ring-2 ring-purple-500/20 shadow-xs"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={t.url} alt={`缩略图${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-purple-900/70 text-white text-[9px] px-1 py-0.5 truncate text-center backdrop-blur-2xs">
                    {t.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN (6 Cols): Detailed Metadata & Actions */}
          <div className="lg:col-span-6 space-y-4 text-xs text-slate-700">
            
            {/* 1. Author & Organization Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                  Z
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {item.author || "致上运营"} / 默认部门 / 默认分组
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">发布时间：2025-05-26 12:25:11</p>
                </div>
              </div>
            </div>

            {/* 2. Classification & Title */}
            <div className="space-y-3">
              
              {/* Category Hierarchy Edit (层级修改) */}
              <div className="flex items-center gap-2">
                <span className="bg-[#10B981] text-white font-bold text-[11px] px-2 py-0.5 rounded shadow-2xs shrink-0">
                  图片
                </span>
                <span className="font-bold text-slate-800">{categoryText}</span>
                <button
                  onClick={() => {
                    setTempCategoryPath(categoryText);
                    setSelectedPrimaryCat(categoryText.split(" / ")[0] || "资质 / a店铺");
                    setIsCategoryDropdownOpen(true);
                    setShowModifyCategoryModal(true);
                  }}
                  className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 flex items-center gap-1 text-xs font-normal cursor-pointer"
                  title="修改分类"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="text-purple-600 font-medium hover:underline">修改</span>
                </button>
              </div>

              {/* Title Edit (标题修改) */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium shrink-0">图片标题:</span>
                <span className="font-bold text-slate-900 text-sm">{titleText}</span>
                <button
                  onClick={() => {
                    setTempTitleText(titleText);
                    setShowModifyTitleModal(true);
                  }}
                  className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 cursor-pointer"
                  title="修改标题"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Public Tags (公共标签) */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-slate-500 font-medium shrink-0 pt-0.5">公共标签:</span>
                {publicTags.map((tag, i) => (
                  <span key={i} className="bg-slate-100/90 text-slate-700 font-medium px-2.5 py-0.5 rounded-lg text-[11px] border border-slate-200/60 flex items-center">
                    {tag}
                  </span>
                ))}
                <button
                  onClick={() => {
                    setTempAddedPublicTags([...publicTags]);
                    setShowPublicTagModal(true);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer py-0.5 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加公共标签</span>
                </button>
              </div>

              {/* Personal Tags (个人标签) */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-slate-500 font-medium shrink-0 pt-0.5">个人标签:</span>
                {personalTags.map((tag, i) => (
                  <span key={i} className="bg-purple-50 text-purple-700 font-medium px-2.5 py-0.5 rounded-lg text-[11px] border border-purple-100 flex items-center gap-1">
                    <span>{tag}</span>
                    <button
                      onClick={() => {
                        const newP = personalTags.filter((_, idx) => idx !== i);
                        addOperationLog("修改个人标签", personalTags.join(", "), newP.join(", ") || "无");
                        setPersonalTags(newP);
                      }}
                      className="text-purple-400 hover:text-rose-500 ml-0.5 cursor-pointer text-xs"
                      title="删除标签"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    setTempAddedPersonalTags([...personalTags]);
                    setShowPersonalTagModal(true);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer py-0.5 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加个人标签</span>
                </button>
              </div>
            </div>

            {/* 3. Icon Action Buttons & Record Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => {
                  setTempSortList([...suiteImages]);
                  setShowSortModal(true);
                }}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-600 cursor-pointer transition-colors"
                title="图片排序 (拖拽进行排序)"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>

              <button
                onClick={async () => {
                  await navigator.clipboard?.writeText(`${window.location.origin}/#/resources/${item.id}`);
                  showToast("详情链接已复制，访问时将按查看者登录状态与资源权限显示");
                }}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-600 cursor-pointer transition-colors"
                title="分享"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  ref={moreButtonRef}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="px-3.5 py-1.5 rounded-xl border border-purple-400 text-purple-600 hover:bg-purple-50 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>更多</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showMoreMenu && (
                  <AnchoredPopover anchorRef={moreButtonRef} align="end" width={160} gap={6} onClose={() => setShowMoreMenu(false)} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        showToast("已删除该图片资源");
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-xl font-medium"
                    >
                      删除
                    </button>
                  </AnchoredPopover>
                )}
              </div>
            </div>

            {/* 4. Primary Solid Action Buttons */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              <button
                onClick={() => showToast(`正在下载无水印原图: ${titleText}`)}
                className="bg-[#7C3AED] hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-center shadow-xs cursor-pointer transition-colors text-xs active:scale-95"
              >
                下载无水印图片
              </button>
            </div>

            {/* 5. Metrics & Notes */}
            <div className="bg-slate-50/80 rounded-2xl p-4 space-y-2 text-xs text-slate-500 border border-slate-100/80 mt-2">
              <div className="flex items-center justify-between">
                <span>下载次数: <strong className="text-slate-700">0</strong></span>
              </div>
              <div className="flex items-center justify-between">
                <span>浏览量: <strong className="text-slate-700">0</strong></span>
              </div>

              {/* Editable Note */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">图片备注:</span>
                  <button
                    onClick={() => {
                      setTempNoteText(noteText);
                      setIsEditingNote(!isEditingNote);
                    }}
                    className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isEditingNote ? (
                  <div className="space-y-2 mt-1.5">
                    <textarea
                      value={tempNoteText}
                      onChange={(e) => setTempNoteText(e.target.value)}
                      className="w-full border border-purple-300 rounded-xl p-2 text-xs text-slate-800 focus:outline-none bg-white min-h-[60px]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingNote(false)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="px-3 py-1 bg-purple-600 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        保存备注
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 font-medium mt-1 pl-1 italic bg-white/60 p-2 rounded-xl border border-slate-100">
                    {noteText || "暂无备注"}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>


      </div>

      {/* Full-Screen Image Lightbox */}
      {fullScreenImage && (
        <div
          onClick={() => setFullScreenImage(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in cursor-zoom-out"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullScreenImage(null);
            }}
            className="absolute top-6 right-6 z-[110] bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full transition-colors cursor-pointer"
            title="关闭大图"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center space-y-3"
          >
            <img
              src={fullScreenImage}
              alt="全屏大图"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
            <div className="flex items-center gap-3 text-white/80 text-xs font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <ZoomIn className="w-4 h-4 text-purple-400" />
              <span>点击任意位置或右上角退出大图</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: 修改分类 Modal (Matching FinishedVideoDetailModal) */}
      {showModifyCategoryModal && (
        <ResourceCategoryModal scope="images" initialCategory={categoryText} onClose={() => setShowModifyCategoryModal(false)} onConfirm={value => { setCategoryText(value); setShowModifyCategoryModal(false); showToast("分类修改成功"); }} />
      )}

      {/* MODAL 2: 编辑标题 Modal (Matching FinishedVideoDetailModal) */}
      {showModifyTitleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">修改标题</h3>
              </div>
              <button
                onClick={() => setShowModifyTitleModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center">
                  <span className="text-rose-500 font-bold mr-1">*</span>
                  <span>图片标题</span>
                </label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tempTitleText}
                    onChange={(e) => setTempTitleText(e.target.value)}
                    placeholder="请输入新的图片标题"
                    className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all shadow-2xs pr-8"
                  />
                  {tempTitleText && (
                    <button
                      onClick={() => setTempTitleText("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModifyTitleModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (tempTitleText.trim() && tempTitleText.trim() !== titleText) {
                    addOperationLog("修改标题", titleText, tempTitleText.trim());
                    setTitleText(tempTitleText.trim());
                    showToast(`✅ 图片标题已修改为：[${tempTitleText.trim()}]`);
                  }
                  setShowModifyTitleModal(false);
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: 关联公共标签 Modal (Matching FinishedVideoDetailModal 3-column layout) */}
      {showPublicTagModal && <ResourceTagModal kind="public" initialTags={publicTags} onClose={() => setShowPublicTagModal(false)} onConfirm={(tags) => { addOperationLog("修改公共标签", publicTags.join(", "), tags.join(", ") || "无"); setPublicTags(tags); showToast("公共标签已更新"); }} showToast={showToast} />}

      {/* MODAL 4: 关联个人标签 Modal (Matching FinishedVideoDetailModal 3-column layout) */}
      {showPersonalTagModal && <ResourceTagModal kind="personal" initialTags={personalTags} onClose={() => setShowPersonalTagModal(false)} onConfirm={(tags) => { addOperationLog("修改个人标签", personalTags.join(", "), tags.join(", ") || "无"); setPersonalTags(tags); showToast("个人标签已更新"); }} showToast={showToast} />}

      {/* 5. 图片排序 Modal */}
      {showSortModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4.5 bg-[#7C3AED] rounded-full inline-block"></span>
                <span className="font-bold text-slate-900 text-base">图片排序</span>
                <span className="text-slate-500 text-xs sm:text-sm font-normal">
                  (拖拽图片进行排序，保存后生效)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSortModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-3 max-h-[420px] overflow-y-auto bg-slate-50/30">
              {tempSortList.map((imgItem, idx) => (
                <div
                  key={imgItem.id || idx}
                  draggable
                  onDragStart={() => setDraggedIndex(idx)}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex === null || draggedIndex === idx) return;
                    const newList = [...tempSortList];
                    const [dragged] = newList.splice(draggedIndex, 1);
                    newList.splice(idx, 0, dragged);
                    setTempSortList(newList);
                    setDraggedIndex(null);
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-4 bg-white transition-all cursor-grab active:cursor-grabbing hover:shadow-2xs select-none ${
                    draggedIndex === idx
                      ? "opacity-30 border-purple-400 bg-purple-50/20"
                      : "border-slate-200/90 hover:border-purple-300"
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={imgItem.url}
                      alt={imgItem.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                  <span className="font-medium text-slate-800 text-sm flex-1 truncate">
                    {imgItem.name}
                  </span>

                  {/* Up / Down buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        const newList = [...tempSortList];
                        const prev = newList[idx - 1];
                        newList[idx - 1] = newList[idx];
                        newList[idx] = prev;
                        setTempSortList(newList);
                      }}
                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-purple-600 rounded disabled:opacity-20 cursor-pointer"
                      title="向上移动"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === tempSortList.length - 1}
                      onClick={() => {
                        if (idx === tempSortList.length - 1) return;
                        const newList = [...tempSortList];
                        const next = newList[idx + 1];
                        newList[idx + 1] = newList[idx];
                        newList[idx] = next;
                        setTempSortList(newList);
                      }}
                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-purple-600 rounded disabled:opacity-20 cursor-pointer"
                      title="向下移动"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSortModal(false)}
                className="px-7 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuiteImages(tempSortList);
                  setSelectedDetailThumbIndex(0);
                  addOperationLog("修改套图排序", "原排序", "新排序");
                  showToast("✅ 图片排序已保存！");
                  setShowSortModal(false);
                }}
                className="px-7 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
