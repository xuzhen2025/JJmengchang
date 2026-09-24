import React, { useState, useRef } from "react";
import ReferencedVideosProduced from "./ReferencedVideosProduced";
import OverlayPortal from "./overlays/OverlayPortal";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Tag,
  ShieldCheck,
  FileVideo,
  Info,
  Calendar,
  Sparkles,
  RefreshCw,
  Edit3
} from "lucide-react";

export interface MaterialDetailItem {
  id: string;
  numericId?: string;
  title: string;
  videoUrl: string;
  coverUrl: string;
  duration: string;
  resolution: "720p" | "1080p" | "2K";
  size: string;
  creator: "ai" | "human";
  aiModel?: string;
  createdAt: string;
  author: string;
  category?: string;
  tags?: string[];
  status?: string;
  usedMaterials?: any[];
}

interface MaterialDetailModalProps {
  material: MaterialDetailItem;
  onClose: () => void;
}

export default function MaterialDetailModal({
  material,
  onClose
}: MaterialDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeBasicTab, setActiveBasicTab] = useState<"视频信息" | "视频审核">("视频信息");
  const [auditStatus, setAuditStatus] = useState<"approved" | "pending" | "rejected">(
    material.status === "已驳回" ? "rejected" : material.status === "待审核" ? "pending" : "approved"
  );
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`已复制${label}: ${text}`);
  };

  return (
    <OverlayPortal layer="modal" className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black rounded-full font-mono shrink-0">
              素材
            </span>
            <h2 className="text-base font-extrabold text-slate-900 truncate" title={material.title}>
              {material.title}
            </h2>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400 font-medium">
              ID: {material.numericId || material.id}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Section: Video Preview + Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 1. 视频预览模块 (Video Preview Module) - Left Column */}
            <div className="lg:col-span-5 bg-slate-900 rounded-3xl overflow-hidden shadow-md flex flex-col relative group">
              <div className="relative aspect-9/16 w-full max-h-[460px] bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={material.videoUrl}
                  poster={material.coverUrl}
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Big Center Play Button Overlay */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 bg-purple-600/90 hover:bg-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 cursor-pointer z-10"
                  >
                    <Play className="w-8 h-8 fill-white translate-x-0.5" />
                  </button>
                )}

                {/* Bottom Video Controls Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="hover:text-purple-300 transition-colors cursor-pointer">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <button onClick={toggleMute} className="hover:text-purple-300 transition-colors cursor-pointer">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-[11px] text-slate-300">{material.duration}</span>
                  </div>

                  <span className="font-mono text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-slate-200">
                    {material.resolution}
                  </span>
                </div>
              </div>

              {/* Quick Action Footer */}
              <div className="p-3 bg-slate-950 flex items-center justify-between border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileVideo className="w-4 h-4 text-purple-400" />
                  <span className="font-mono">{material.size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(material.videoUrl, "素材视频播放链接")}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制链接</span>
                  </button>
                  <a
                    href={material.videoUrl}
                    download
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载素材</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 2. 基础信息模块 (Basic Info Module) - Right Column */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              
              {/* Header Tabs: ONLY 视频信息 and 视频审核 */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl">
                  <button
                    onClick={() => setActiveBasicTab("视频信息")}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeBasicTab === "视频信息"
                        ? "bg-white text-purple-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>视频信息</span>
                  </button>

                  <button
                    onClick={() => setActiveBasicTab("视频审核")}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeBasicTab === "视频审核"
                        ? "bg-white text-purple-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>视频审核</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">创建人:</span>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {material.author}
                  </span>
                </div>
              </div>

              {/* Tab 1: 视频信息 (Video Info) */}
              {activeBasicTab === "视频信息" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block">素材编号</span>
                      <span className="text-xs font-bold font-mono text-slate-800">
                        {material.numericId || material.id}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block">所属分类/类目</span>
                      <span className="text-xs font-bold text-slate-800">
                        {material.category || "默认素材类目"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block">生成方式</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          material.creator === "ai" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {material.creator === "ai" ? "AI 智能生成" : "人工采集上传"}
                        </span>
                        {material.aiModel && (
                          <span className="text-[10px] text-slate-500 font-mono">({material.aiModel})</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block">上传时间</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {material.createdAt}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block">视频规格</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {material.duration} | {material.resolution} | {material.size}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block">引用状态</span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>可正常用于剪辑与出片</span>
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-[11px] text-slate-400 font-medium block">素材关联标签</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(material.tags || ["精品素材", "美妆护肤", "高清特写", "原创授权"]).map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 shadow-2xs">
                          <Tag className="w-3 h-3 text-purple-500" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 视频审核 (Video Audit) */}
              {activeBasicTab === "视频审核" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>智能合规与平台审核风控状态</span>
                      </span>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                        auditStatus === "approved"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : auditStatus === "pending"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {auditStatus === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {auditStatus === "pending" && <Clock className="w-3.5 h-3.5" />}
                        {auditStatus === "rejected" && <AlertCircle className="w-3.5 h-3.5" />}
                        <span>
                          {auditStatus === "approved" ? "审核通过 (合规)" : auditStatus === "pending" ? "人工复审中" : "存在风险 (已拦截)"}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">AI违禁词检测</span>
                        <span className="font-bold text-emerald-600">100% 通过</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">肖像版权报备</span>
                        <span className="font-bold text-purple-600">已授权备案</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">抖音/快手平台合规</span>
                        <span className="font-bold text-emerald-600">无违规风险</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Actions */}
                  <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <span className="text-xs text-purple-900 font-medium">
                      审核员备注: 画面画质达标，无诱导点击与虚假宣传行为。
                    </span>
                    <button
                      onClick={() => {
                        setAuditStatus("approved");
                        alert("已提交重新审核请求，AI 与人工复审任务已触发！");
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>重新审核</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* 3. 被引用后出片 Module */}
          <ReferencedVideosProduced hideTitle={true} hideCardWrapper={true} />

        </div>

      </div>
    </OverlayPortal>
  );
}
