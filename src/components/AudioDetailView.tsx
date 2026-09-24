import React, { useState, useEffect, useRef } from "react";
import { useResourceConfig, useResourceConfigState } from "../lib/useResourceConfig";
import { ResourceCategoryModal } from "./ResourceEditDialog";
import ResourceTagModal from "./ResourceTagModal";
import { useResourceTagState } from "../lib/useResourceTags";
import AnchoredPopover from "./overlays/AnchoredPopover";
import {
  ArrowLeft,
  X,
  User,
  Share2,
  ChevronDown,
  Edit3,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";

export interface AudioItem {
  id: string;
  title: string;
  duration: number; // in seconds
  durationFormatted: string;
  author: string;
  primaryCategory: string;
  secondaryCategory: string;
  publicTags: string[];
  personalTag: string;
  personalTags?: string[];
  starred?: boolean;
}

export interface AudioDetailViewProps {
  item: AudioItem;
  onClose: () => void;
  showToast: (msg: string) => void;
  onDelete?: (id: string) => void;
}





export default function AudioDetailView({
  item,
  onClose,
  showToast,
  onDelete
}: AudioDetailViewProps) {
  // Audio Editable Fields State
  const [audioCategoryText, setAudioCategoryText] = useResourceConfigState("audio", item, "category");
  const { store: configStore } = useResourceConfig();
  const CATEGORY_TREE = configStore.categories("audio").map(n => ({ name: n.name, subs: n.children.map(c => c.name) }));
  const [audioTitleText, setAudioTitleText] = useState<string>(item.title || "洗牙4.7");
  const [audioPublicTags, setAudioPublicTags] = useResourceTagState("audio", item, "public");
  const [audioPersonalTags, setAudioPersonalTags] = useResourceTagState("audio", item, "personal");

  // Player State
  const [detailCurrentTime, setDetailCurrentTime] = useState<number>(0);
  const [detailIsPlaying, setDetailIsPlaying] = useState<boolean>(false);
  const [detailSpeed, setDetailSpeed] = useState<string>("1x倍速");
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [detailIsMuted, setDetailIsMuted] = useState<boolean>(false);

  // Detail Menu & Modals State
  const [showDetailMoreMenu, setShowDetailMoreMenu] = useState<boolean>(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [showModifyCategoryModal, setShowModifyCategoryModal] = useState<boolean>(false);
  const [showModifyTitleModal, setShowModifyTitleModal] = useState<boolean>(false);
  const [showPublicTagModal, setShowPublicTagModal] = useState<boolean>(false);
  const [showPersonalTagModal, setShowPersonalTagModal] = useState<boolean>(false);

  // Temp State for Modals
  const [tempCategoryPath, setTempCategoryPath] = useState<string>("");
  const [selectedPrimaryCat, setSelectedPrimaryCat] = useState<string>("美容美体");
  const [selectedSecondaryCat, setSelectedSecondaryCat] = useState<string>("短对话");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [tempTitleText, setTempTitleText] = useState<string>("");

  const [selectedPublicGroupKey, setSelectedPublicGroupKey] = useState<string>("场景");
  const [tempAddedPublicTags, setTempAddedPublicTags] = useState<string[]>([]);

  const [selectedPersonalGroupKey, setSelectedPersonalGroupKey] = useState<string>("个人设的");
  const [tempAddedPersonalTags, setTempAddedPersonalTags] = useState<string[]>([]);

  const [publicPresetTab, setPublicPresetTab] = useState<string>("我的预设");
  const [personalPresetTab, setPersonalPresetTab] = useState<string>("我的预设");

  // Timer loop for playback
  useEffect(() => {
    if (!detailIsPlaying) return;

    const interval = setInterval(() => {
      setDetailCurrentTime((prev) => {
        if (prev >= item.duration) {
          setDetailIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [detailIsPlaying, item.duration]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen text-slate-800 space-y-6 pb-16 animate-fade-in font-sans overflow-y-auto">
      {/* 1. Top Page Sticky Header with Back Button & ID */}
      <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200/90 shadow-2xs sticky top-0 z-20">
        <button
          onClick={() => {
            setDetailIsPlaying(false);
            onClose();
          }}
          className="px-4 py-2 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-600 border border-slate-200 hover:border-purple-300 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
          title="返回音频列表"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600" />
          <span>返回音频列表</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            ID: {item.id === "1" ? "37923662" : item.id}
          </span>
        </div>
      </div>

      {/* 2. Main Page Content Container */}
      <div className="max-w-5xl mx-auto px-6 space-y-4">
        
        {/* Card 1: Top Main Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
          {/* Row 1: Author Info & Action Buttons */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Left: Avatar & Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {item.author || "月儿弯弯"} / 管理组 / 管理部
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  发布时间: 2025-04-24 14:43:53
                </p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => showToast(`已开始下载: ${item.title}.mp3`)}
                className="bg-[#7C3AED] hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                下载
              </button>

              <button
                onClick={() => showToast("已复制在线分享链接")}
                className="w-9 h-9 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="分享"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* 更多操作 Dropdown */}
              <div className="relative">
                <button
                  ref={moreButtonRef}
                  onClick={() => setShowDetailMoreMenu(!showDetailMoreMenu)}
                  className="border border-purple-300 text-purple-600 hover:bg-purple-50 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>更多操作</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showDetailMoreMenu && (
                  <AnchoredPopover anchorRef={moreButtonRef} align="end" width={160} gap={6} onClose={() => setShowDetailMoreMenu(false)} className="bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 text-xs font-medium animate-in fade-in duration-100">
                    <button
                      onClick={() => {
                        setShowDetailMoreMenu(false);
                        if (!window.confirm("删除后将移入管理端集中回收站，当前用户将无法继续查看；如需恢复请联系管理员。确认继续吗？")) return;
                        if (onDelete) onDelete(item.id);
                        showToast("已移入管理端集中回收站");
                        onClose();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 cursor-pointer"
                    >
                      放入回收站
                    </button>
                  </AnchoredPopover>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="space-y-3.5">
            {/* Row 2: 音频区 / 分类 */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-20 text-slate-500 font-medium shrink-0">音频区</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{audioCategoryText}</span>
                  <button
                    onClick={() => {
                      setTempCategoryPath(audioCategoryText);
                      setSelectedPrimaryCat(audioCategoryText.split(" / ")[0] || "美容美体");
                      setIsCategoryDropdownOpen(true);
                      setShowModifyCategoryModal(true);
                    }}
                    className="text-slate-400 hover:text-purple-600 cursor-pointer transition-colors p-0.5 flex items-center gap-1 text-xs font-normal"
                    title="修改分类"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="text-purple-600 font-medium hover:underline">修改</span>
                  </button>
                </span>
              </div>
            </div>

            {/* Row 3: 音频标题 */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-20 text-slate-500 font-medium shrink-0">音频标题</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{audioTitleText}</span>
                  <button
                    onClick={() => {
                      setTempTitleText(audioTitleText);
                      setShowModifyTitleModal(true);
                    }}
                    className="text-slate-400 hover:text-purple-600 cursor-pointer transition-colors p-0.5"
                    title="修改标题"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            </div>

            {/* Row 4: 公共标签 Line */}
            <div className="flex items-start gap-3 text-xs">
              <span className="w-20 text-slate-500 font-medium shrink-0 pt-1">公共标签</span>
              <div className="flex flex-wrap items-center gap-2">
                {audioPublicTags.map((tag, idx) => (
                  <span key={idx} className="bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/60 flex items-center">
                    <span>{tag}</span>
                  </span>
                ))}
                <button
                  onClick={() => {
                    setTempAddedPublicTags([...audioPublicTags]);
                    setShowPublicTagModal(true);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer py-1 hover:underline"
                >
                  <span>+ 添加公共标签</span>
                </button>
              </div>
            </div>

            {/* Row 5: 个人标签 Line */}
            <div className="flex items-start gap-3 text-xs">
              <span className="w-20 text-slate-500 font-medium shrink-0 pt-1">个人标签</span>
              <div className="flex flex-wrap items-center gap-2">
                {audioPersonalTags.map((tag, idx) => (
                  <span key={idx} className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-purple-100 flex items-center gap-1">
                    <span>{tag}</span>
                    <button
                      onClick={() => setAudioPersonalTags(audioPersonalTags.filter((_, i) => i !== idx))}
                      className="text-purple-400 hover:text-rose-500 ml-0.5 cursor-pointer text-xs"
                      title="删除标签"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    setTempAddedPersonalTags([...audioPersonalTags]);
                    setShowPersonalTagModal(true);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer py-1 hover:underline"
                >
                  <span>+ 添加个人标签</span>
                </button>
              </div>
            </div>

            {/* Row 6: 音频备注 */}
            <div className="text-xs pt-1">
              <span className="text-slate-400 font-medium">音频备注</span>
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Audio Player Control Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
          <h3 className="font-bold text-slate-900 text-base">
            {audioTitleText}
          </h3>

          {/* Player Bar */}
          <div className="flex items-center gap-4">
            {/* Play / Pause button */}
            <button
              onClick={() => setDetailIsPlaying(!detailIsPlaying)}
              className={`w-10 h-10 rounded-full border-2 border-purple-600 flex items-center justify-center text-purple-600 hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer shadow-xs ${
                detailIsPlaying ? "bg-purple-600 text-white" : "bg-white hover:bg-purple-50"
              }`}
            >
              {detailIsPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Current Time */}
            <span className="text-xs font-mono font-medium text-slate-600 shrink-0 min-w-[38px]">
              {formatSeconds(detailCurrentTime)}
            </span>

            {/* Scrubber Range Input */}
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={item.duration}
                value={detailCurrentTime}
                onChange={(e) => setDetailCurrentTime(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none focus:outline-none"
              />
            </div>

            {/* Total Duration */}
            <span className="text-xs font-mono font-medium text-slate-600 shrink-0 min-w-[38px]">
              {item.durationFormatted}
            </span>

            {/* Mute Button */}
            <button
              onClick={() => setDetailIsMuted(!detailIsMuted)}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
              title={detailIsMuted ? "取消静音" : "静音"}
            >
              {detailIsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Playback Speed Button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="border border-slate-200 hover:border-slate-300 bg-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                {detailSpeed}
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-28 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs font-medium">
                  {["0.5x倍速", "0.75x倍速", "1x倍速", "1.25x倍速", "1.5x倍速", "2x倍速"].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        setDetailSpeed(speed);
                        setShowSpeedMenu(false);
                        showToast(`倍速设置为: ${speed}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-purple-50 cursor-pointer ${
                        detailSpeed === speed ? "text-purple-600 font-bold bg-purple-50/50" : "text-slate-700"
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL 1: 修改分类 Modal */}
      {showModifyCategoryModal && (
        <ResourceCategoryModal scope="audio" initialCategory={audioCategoryText} onClose={() => setShowModifyCategoryModal(false)} onConfirm={value => { setAudioCategoryText(value); setShowModifyCategoryModal(false); showToast("分类修改成功"); }} />
      )}

      {/* MODAL 2: 修改标题 Modal */}
      {showModifyTitleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">修改音频标题</h3>
              </div>
              <button
                onClick={() => setShowModifyTitleModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <label className="block font-bold text-slate-700">音频标题</label>
              <input
                type="text"
                value={tempTitleText}
                onChange={(e) => setTempTitleText(e.target.value)}
                placeholder="请输入新标题..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
              />
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowModifyTitleModal(false)}
                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (tempTitleText.trim() && tempTitleText.trim() !== audioTitleText) {
                    setAudioTitleText(tempTitleText.trim());
                    showToast(`✅ 音频标题已修改为：[${tempTitleText.trim()}]`);
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

      {/* MODAL 3: 关联公共标签 Modal (3-column layout) */}
{showPublicTagModal && <ResourceTagModal kind="public" initialTags={audioPublicTags} onClose={() => setShowPublicTagModal(false)} onConfirm={(tags) => { setAudioPublicTags(tags); showToast("公共标签已更新"); }} showToast={showToast} />}

      {/* MODAL 4: 关联个人标签 Modal (3-column layout) */}
{showPersonalTagModal && <ResourceTagModal kind="personal" initialTags={audioPersonalTags} onClose={() => setShowPersonalTagModal(false)} onConfirm={(tags) => { setAudioPersonalTags(tags); showToast("个人标签已更新"); }} showToast={showToast} />}
    </div>
  );
}
