import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  Sparkles, 
  ChevronDown, 
  Play, 
  Search, 
  Trash2, 
  Image as ImageIcon,
  Settings as SettingsIcon,
  Video,
  Upload,
  Info,
  Wand2,
  X,
  FileVideo,
  Layers,
  Sparkle,
  Plus,
  Volume2,
  Mic,
  ArrowRight
} from "lucide-react";
import { GalleryItem } from "../types";

interface SameStyleVideoViewProps {
  selectedItem: GalleryItem;
  onBack: () => void;
  onAddTask: (
    type: "watermark" | "subtitle" | "enhance" | "video_gen" | "image_gen" | "fission",
    name: string,
    inputFiles: string[],
    creditsCost: number
  ) => void;
  credits: number;
}

type VideoGenMode = "reference" | "first_last" | "voiceover";

export default function SameStyleVideoView({
  selectedItem,
  onBack,
  onAddTask,
  credits
}: SameStyleVideoViewProps) {
  // 1. Generation Modes & Options
  const [currentMode, setCurrentMode] = useState<VideoGenMode>("reference");
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("Sora-Turbo-v2.5");
  const [aspectRatio, setAspectRatio] = useState<string>("9:16");
  const [duration, setDuration] = useState<string>("8秒");
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // 2. Reference Content Upload list (Mode 1: 参考生视频)
  const [references, setReferences] = useState<string[]>([selectedItem.coverUrl || selectedItem.url]);
  const [isUploading, setIsUploading] = useState(false);

  // Mode 2: 首尾帧生视频 States
  const [firstFrame, setFirstFrame] = useState<string>(selectedItem.coverUrl || selectedItem.url);
  const [lastFrame, setLastFrame] = useState<string>("https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&fit=crop");

  // Mode 3: 配音生视频 States
  const [selectedAnchor, setSelectedAnchor] = useState<string>("a1");
  const [selectedVoice, setSelectedVoice] = useState<string>("v1");
  const [voiceoverText, setVoiceoverText] = useState<string>(
    `嗨，大家好！今天给大家强势安利这款精心打造的${selectedItem.title.replace("视频", "")}。极致质感，光影绝伦，现在点击下方链接，享受新客专属惊喜福利哦！`
  );

  // 3. AI Template section
  const [showTemplates, setShowTemplates] = useState(true);
  
  // 4. Prompt Input area
  const [prompt, setPrompt] = useState<string>(
    `参考同款视频的镜头美学。画面主体是一瓶高档${selectedItem.title.replace("视频", "")}，极简日系现代冷感光影，镜头微距慢动作拉远，透明气泡缓缓升腾，高级质感。`
  );
  const [aiOptimize, setAiOptimize] = useState(true);

  // 5. Right side interactive tasks simulation
  const [activeTasks, setActiveTasks] = useState<any[]>([]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Pre-configured AI Templates
  const AI_TEMPLATES = [
    {
      id: "t1",
      title: "流金晨曦",
      desc: "温和晨光微距反射，质感流沙缓缓流动",
      prompt: "Golden abstract fluid cosmetics background, macro details, commercial render, studio lighting, elegant slow motion 8s",
      cover: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=150&auto=format&fit=crop"
    },
    {
      id: "t2",
      title: "极地冰封",
      desc: "极极简冰晶颗粒，清爽冷调剔透包装",
      prompt: "Hyper-realistic slow motion tracking shot of cosmetic glass bottle embedded in crystalline natural ice block, pristine water droplets, 4k macro",
      cover: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=150&auto=format&fit=crop"
    },
    {
      id: "t3",
      title: "科技科幻霓虹",
      desc: "科技感光圈环绕，未来主义3D粒子特效",
      prompt: "Premium product on a spinning dynamic neon platform, high-speed camera rotation, cyber aesthetic, glowing volumetric laser rays",
      cover: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop"
    }
  ];

  // Pre-configured Digital Person Anchors for Mode 3
  const ANCHORS = [
    { id: "a1", name: "甜美女主播 楚楚", role: "时尚/美妆", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop" },
    { id: "a2", name: "知性推荐官 雅琴", role: "家居/生活", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&fit=crop" },
    { id: "a3", name: "数码达人 阿强", role: "数码/科技", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop" }
  ];

  // Upload Simulation
  const handleUploadClick = () => {
    setIsUploading(true);
    setTimeout(() => {
      const extraImages = [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"
      ];
      const randomImg = extraImages[Math.floor(Math.random() * extraImages.length)];
      if (currentMode === "reference") {
        setReferences((prev) => [...prev, randomImg]);
      } else if (currentMode === "first_last") {
        setLastFrame(randomImg);
      }
      setIsUploading(false);
      alert("参考内容已成功同步！已为您精细化指引 AI 视频生成渲染轴。");
    }, 1000);
  };

  const handleRemoveReference = (indexToRemove: number) => {
    setReferences((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleMagicOptimize = () => {
    if (currentMode === "voiceover") {
      if (!voiceoverText.trim()) return;
      setVoiceoverText((prev) => prev + " (现在下单更有买一送一超值惊喜，不容错过哦！)");
      alert("已自动为您优化主播话术，增强促销带货属性！");
      return;
    }

    if (!prompt.trim()) {
      alert("请先输入一些基本的创意念头，AI才能为您进行黄金提示词重构哦。");
      return;
    }
    setPrompt((prev) => prev + " (AI智能润色：极具冲击力的浅景深电影感拍摄，100mm微距镜头，光线自然折射，Caustics光影水波纹特效，8K极致渲染级细节，完美循环。)");
    alert("已为您融入行业顶尖电商爆款公式！提示词已自动优化升级。");
  };

  const handleVoicePreview = () => {
    alert(`正在试听 [${selectedVoice === "v1" ? "成熟女声 - 晓婷" : selectedVoice === "v2" ? "温暖男声 - 智贤" : "活泼女声 - 悠悠"}] 朗读配音：\n"${voiceoverText.slice(0, 45)}..."`);
  };

  // Submit dynamic task
  const handleGenerateSubmit = () => {
    let taskName = "";
    let inputFiles: string[] = [];
    let customPromptText = "";

    if (currentMode === "reference") {
      if (!prompt.trim()) return;
      taskName = `AI 视频生成(同款参考): ${selectedItem.title}`;
      inputFiles = [...references];
      customPromptText = prompt;
    } else if (currentMode === "first_last") {
      taskName = `AI 视频生成(首尾帧同款): ${selectedItem.title}`;
      inputFiles = [firstFrame, lastFrame];
      customPromptText = `[首帧 -> 尾帧 渐变联动] ${prompt}`;
    } else {
      taskName = `AI 视频生成(主播配音同款): ${selectedItem.title}`;
      const anchorName = ANCHORS.find(a => a.id === selectedAnchor)?.name || "";
      inputFiles = [selectedItem.coverUrl || selectedItem.url];
      customPromptText = `[主播: ${anchorName}] [配音内容: ${voiceoverText}]`;
    }

    const taskId = `task_${Date.now()}`;
    const newTask = {
      id: taskId,
      mode: currentMode,
      prompt: customPromptText,
      status: "rendering",
      progress: 0,
      timestamp: new Date().toLocaleTimeString(),
      references: [...inputFiles],
      outputVideo: null
    };

    setActiveTasks((prev) => [newTask, ...prev]);

    onAddTask(
      "video_gen",
      taskName,
      inputFiles,
      72
    );

    // Dynamic Simulation ticker
    const timer = setInterval(() => {
      setActiveTasks((prev) => {
        let done = false;
        const next = prev.map((t) => {
          if (t.id === taskId) {
            const nextProgress = t.progress + Math.floor(Math.random() * 20 + 15);
            if (nextProgress >= 100) {
              done = true;
              return { 
                ...t, 
                progress: 100, 
                status: "completed",
                outputVideo: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4"
              };
            }
            return { ...t, progress: nextProgress };
          }
          return t;
        });
        if (done) clearInterval(timer);
        return next;
      });
    }, 1200);
  };

  // Validation
  const isFormValid = (() => {
    if (currentMode === "reference") {
      return prompt.trim().length > 0 && references.length > 0;
    } else if (currentMode === "first_last") {
      return prompt.trim().length > 0 && !!firstFrame && !!lastFrame;
    } else {
      return voiceoverText.trim().length > 0 && !!selectedAnchor;
    }
  })();

  const getModeLabel = () => {
    switch (currentMode) {
      case "reference": return "参考生视频";
      case "first_last": return "首尾帧生视频";
      case "voiceover": return "配音生视频";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none antialiased">
      
      {/* 1. Header Row - Light minimalist design */}
      <header className="bg-white border-b border-slate-250 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer font-bold bg-white px-3 py-2 rounded-xl border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
            <span>返回灵感画廊</span>
          </button>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI 视频生成工作台
            </span>
            <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full font-black">
              Sora Pro
            </span>
          </div>
        </div>

        {/* Dynamic Status bar */}
        <div className="hidden lg:flex items-center gap-2 bg-purple-50 border border-purple-100/60 rounded-full py-1.5 px-4 text-xs text-purple-700">
          <Sparkle className="w-3.5 h-3.5 animate-pulse text-purple-600" />
          <span>正在生成同款商品：「{selectedItem.title}」— 采用一键镜像风格技术</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 font-mono text-xs text-slate-700">
            <span className="text-slate-500">我的算力额度:</span>
            <span className="text-purple-600 font-black">✦ {credits.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Dual-column Workspace Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ========================================================== */}
        {/* LEFT COLUMN (30% WIDTH) - SCROLLABLE CONFIGURATION FORM    */}
        {/* ========================================================== */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between h-[calc(100vh-140px)] relative overflow-visible">
          
          {/* Header of settings is fixed */}
          <div className="pb-3 border-b border-slate-100 mb-3 shrink-0">
            <span className="text-xs font-black text-slate-400 tracking-wider block mb-2">生成模式</span>
            
            <div className="relative" ref={modeDropdownRef}>
              <button 
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-3 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-black text-slate-850">{getModeLabel()}</span>
                  {currentMode === "reference" && (
                    <span className="text-[8px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* FLOATING DROPDOWN MODAL (MATCHING ATTACHMENT STYLE IN LIGHT THEME) */}
              {isModeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 w-[350px] md:w-[380px] animate-scale-up">
                  <div className="text-xs font-black text-slate-400 pb-2.5 border-b border-slate-100 mb-3">
                    视频功能选择：
                  </div>
                  
                  <div className="space-y-3">
                    {/* Option 1: 参考生视频 */}
                    <div 
                      onClick={() => {
                        setCurrentMode("reference");
                        setIsModeDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        currentMode === "reference" 
                          ? "border-purple-500 bg-purple-50/50" 
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1 pr-2 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">参考生视频</span>
                          <span className="text-[7px] bg-purple-100 text-purple-600 font-bold px-1 rounded-full uppercase">NEW</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">上传参考图，一键生成动态视频</p>
                      </div>

                      {/* Stacked overlapping images on the right */}
                      <div className="relative w-16 h-10 flex items-center justify-end overflow-visible shrink-0 select-none">
                        <img 
                          src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop" 
                          alt="backpack" 
                          className="absolute right-6 top-1 w-6 h-8 rounded border border-white shadow-sm object-cover rotate-[-10deg] z-10"
                          referrerPolicy="no-referrer"
                        />
                        <img 
                          src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100&h=100&fit=crop" 
                          alt="lipstick" 
                          className="absolute right-3 top-0.5 w-6 h-8 rounded border border-white shadow-sm object-cover z-20"
                          referrerPolicy="no-referrer"
                        />
                        <img 
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" 
                          alt="girl model" 
                          className="absolute right-0 top-1 w-6 h-8 rounded border border-white shadow-sm object-cover rotate-[10deg] z-30"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Option 2: 首尾帧生视频 */}
                    <div 
                      onClick={() => {
                        setCurrentMode("first_last");
                        setIsModeDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        currentMode === "first_last" 
                          ? "border-purple-500 bg-purple-50/50" 
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1 pr-2 flex-1 text-left">
                        <span className="text-xs font-black text-slate-900">首尾帧生视频</span>
                        <p className="text-[10px] text-slate-500 font-medium">首尾帧联动，AI 生成流畅视频</p>
                      </div>

                      {/* Start / End frame box layout on the right */}
                      <div className="flex items-center gap-1 shrink-0 select-none">
                        <div className="relative w-7 h-9 rounded border border-slate-200 overflow-hidden bg-slate-50">
                          <img 
                            src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=60&h=80&fit=crop" 
                            alt="first frame" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[7px] text-white font-bold scale-90">首帧</div>
                        </div>
                        <span className="text-slate-300 font-bold text-[8px]">+</span>
                        <div className="relative w-7 h-9 rounded border border-slate-200 overflow-hidden bg-slate-50">
                          <img 
                            src="https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=60&h=80&fit=crop" 
                            alt="last frame" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[7px] text-white font-bold scale-90">尾帧</div>
                        </div>
                      </div>
                    </div>

                    {/* Option 3: 配音生视频 */}
                    <div 
                      onClick={() => {
                        setCurrentMode("voiceover");
                        setIsModeDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        currentMode === "voiceover" 
                          ? "border-purple-500 bg-purple-50/50" 
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1 pr-2 flex-1 text-left">
                        <span className="text-xs font-black text-slate-900">配音生视频</span>
                        <p className="text-[10px] text-slate-500 font-medium">基于形象图生成视频，自定义动作与音色</p>
                      </div>

                      {/* Wide banner anchor image on the right */}
                      <div className="w-14 h-9 rounded border border-slate-200 overflow-hidden shrink-0 select-none bg-slate-50">
                        <img 
                          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=60&fit=crop" 
                          alt="anchor presenter" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Model & Spec selections */}
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center text-left">
                <span className="text-[9px] text-slate-400 font-black">AI 渲染模型</span>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent border-0 p-0 text-[10px] font-black text-slate-700 focus:ring-0 outline-none mt-0.5 cursor-pointer"
                >
                  <option value="Sora-Turbo-v2.5">Sora Turbo 2.5</option>
                  <option value="Gemini-Exp-Video">Gemini Exp Video</option>
                  <option value="Flux-Video-Motion">Flux Video 1.4</option>
                </select>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center text-left">
                <span className="text-[9px] text-slate-400 font-black">画面参数规格</span>
                <div className="flex items-center justify-between mt-0.5 text-[10px] font-black text-slate-700">
                  <span>{aspectRatio} 竖屏</span>
                  <span>{duration}</span>
                </div>
              </div>
            </div>

          </div>

          {/* This is the SCROLLABLE CONFIGURATION SETTINGS area to satisfy Requirement 2 */}
          <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 custom-scrollbar">
            
            {/* ----------------- MODE 1: 参考生视频 CONTROLS ----------------- */}
            {currentMode === "reference" && (
              <div className="space-y-4">
                
                {/* Reference Content Upload list */}
                <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700">参考内容</span>
                    <button
                      onClick={handleUploadClick}
                      disabled={isUploading}
                      className="text-[10px] bg-purple-50 hover:bg-purple-100 border border-purple-100 text-purple-600 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {isUploading ? (
                        <span className="inline-block w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>+ 参考内容</span>
                    </button>
                  </div>

                  {/* References Grid */}
                  <div className="grid grid-cols-3 gap-2 py-1.5">
                    {references.map((refUrl, idx) => (
                      <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-white group shadow-xs">
                        <img 
                          src={refUrl} 
                          alt="Reference visual content" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1 left-1 bg-slate-900/85 text-[8px] text-white px-1.5 py-0.5 rounded font-black">
                          参考图 {idx + 1}
                        </div>
                        {/* Delete button without checkmark */}
                        <button
                          onClick={() => handleRemoveReference(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-red-100"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    {references.length === 0 && (
                      <button 
                        onClick={handleUploadClick}
                        className="col-span-3 h-20 border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer"
                      >
                        <ImageIcon className="w-5 h-5 mb-1 text-slate-400" />
                        <span className="text-[10px] font-bold">暂无参考，点击进行上传</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                    💡 AI将深度识别并提取以上图片中的商品外形、光影风格及场景构图进行融合同款视频生成。例如：“参考图一的人物带上参考图二中的帽子”。
                  </p>
                </div>

                {/* AI Templates recommender */}
                {showTemplates && (
                  <div className="space-y-2 bg-slate-50/50 border border-slate-200/50 rounded-2xl p-3 relative text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-black tracking-wider">AI 模板激发创意</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => alert("完整创意灵感模版库加载中...")}
                          className="text-[9px] text-purple-600 hover:text-purple-700 font-bold"
                        >
                          更多
                        </button>
                        <button 
                          onClick={() => setShowTemplates(false)}
                          className="text-[9px] text-slate-400 hover:text-slate-600"
                        >
                          隐藏
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 select-none pt-1">
                      {AI_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => {
                            setPrompt(tmpl.prompt);
                            alert(`已成功应用「${tmpl.title}」专属提示词模版结构！`);
                          }}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-purple-500 bg-white text-left transition-all cursor-pointer shadow-xs"
                          title={tmpl.desc}
                        >
                          <img 
                            src={tmpl.cover} 
                            alt={tmpl.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent p-1.5 flex flex-col justify-end">
                            <span className="text-[9px] font-black text-white truncate w-full">
                              {tmpl.title}
                            </span>
                            <span className="text-[7px] text-slate-300 truncate w-full">
                              点击套用
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!showTemplates && (
                  <button 
                    onClick={() => setShowTemplates(true)}
                    className="w-full py-1.5 border border-dashed border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>展开 AI 模板推荐</span>
                  </button>
                )}

              </div>
            )}

            {/* ----------------- MODE 2: 首尾帧生视频 CONTROLS ----------------- */}
            {currentMode === "first_last" && (
              <div className="space-y-4 text-left">
                
                {/* Twin frame visual layout */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-black text-slate-700 block">双帧关键画面配对</span>
                  
                  <div className="flex items-center justify-between gap-2.5">
                    
                    {/* First Frame card */}
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] text-slate-500 font-black block">① 起始首帧</span>
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-white group shadow-sm">
                        <img 
                          src={firstFrame} 
                          alt="First frame source" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => {
                            const newUrl = window.prompt("输入新的首帧图URL或点击确认重置:", firstFrame);
                            if (newUrl) setFirstFrame(newUrl);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity cursor-pointer"
                        >
                          更换首帧
                        </button>
                      </div>
                    </div>

                    {/* Arrow spacer */}
                    <div className="flex flex-col items-center justify-center text-slate-400 font-black shrink-0">
                      <span className="text-xs">TO</span>
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                    </div>

                    {/* Last Frame card */}
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] text-slate-500 font-black block">② 渐变尾帧</span>
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-white group shadow-sm">
                        <img 
                          src={lastFrame} 
                          alt="Last frame source" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => {
                            const newUrl = window.prompt("输入新的尾帧图URL或点击确认重置:", lastFrame);
                            if (newUrl) setLastFrame(newUrl);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity cursor-pointer"
                        >
                          更换尾帧
                        </button>
                      </div>
                    </div>

                  </div>

                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                    💡 AI将在此首帧与尾帧画面之间，进行流畅的多模态镜头差值联动演算，适合展示商品开箱、化开、流沙或形态演变全景。
                  </p>
                </div>

              </div>
            )}

            {/* ----------------- MODE 3: 配音生视频 CONTROLS ----------------- */}
            {currentMode === "voiceover" && (
              <div className="space-y-4 text-left">
                
                {/* Anchor Digital Avatars Selection - Satisfies Requirement 3 (no checkmark icon) */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-700 block">① 形象角色选择</span>
                  <div className="grid grid-cols-3 gap-2">
                    {ANCHORS.map((anchor) => {
                      const isSelected = selectedAnchor === anchor.id;
                      return (
                        <button
                          key={anchor.id}
                          onClick={() => setSelectedAnchor(anchor.id)}
                          className={`group relative p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected 
                              ? "border-2 border-purple-600 bg-purple-50/40 shadow-xs" 
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <img 
                            src={anchor.avatar} 
                            alt={anchor.name} 
                            className="w-10 h-10 rounded-full mx-auto object-cover border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="mt-1.5 space-y-0.5">
                            <div className="text-[10px] font-black text-slate-800 truncate w-full">
                              {anchor.name.split(" ")[1]}
                            </div>
                            <div className="text-[8px] text-slate-400">
                              {anchor.role}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Voice Character dropdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-black">② 推荐配音配乐音色</span>
                    <button 
                      onClick={handleVoicePreview}
                      className="text-[9px] text-purple-600 font-bold flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>试听配音</span>
                    </button>
                  </div>

                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none font-bold"
                  >
                    <option value="v1">成熟女声 - 晓婷 (高级质感推荐)</option>
                    <option value="v2">温暖男声 - 智贤 (科技数码主推)</option>
                    <option value="v3">活泼女声 - 悠悠 (零食美妆爆款)</option>
                  </select>
                </div>

              </div>
            )}

            {/* Prompt text area (Shared by Mode 1 & 2, or unique speech container for Mode 3) */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-slate-400">
                  {currentMode === "voiceover" ? "主播口播台词设置" : "视频描述 / 镜头调度提示词"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentMode === "voiceover" ? voiceoverText.length : prompt.length}/1000
                </span>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 relative hover:border-slate-300 transition-all shadow-inner">
                {currentMode === "voiceover" ? (
                  <textarea
                    value={voiceoverText}
                    onChange={(e) => setVoiceoverText(e.target.value)}
                    placeholder="请输入想要数字人主播朗读朗诵的促销口播台词或介绍语..."
                    className="w-full bg-transparent border-0 p-0 text-xs text-slate-750 placeholder-slate-400 focus:ring-0 resize-none min-h-[90px] outline-none leading-relaxed"
                    maxLength={1000}
                  />
                ) : (
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入你想生成的视频描述台词或画面动作..."
                    className="w-full bg-transparent border-0 p-0 text-xs text-slate-750 placeholder-slate-400 focus:ring-0 resize-none min-h-[90px] outline-none leading-relaxed"
                    maxLength={1000}
                  />
                )}
                
                {/* Textarea Bottom toolbars */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 mt-2.5">
                  <div className="flex items-center gap-2">
                    {/* Magic Wand */}
                    <button 
                      onClick={handleMagicOptimize}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:text-purple-600 text-slate-500 transition-all cursor-pointer"
                      title="AI智能台词/词句黄金润色"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                    </button>

                    {/* AI Optimize switch */}
                    <label className="flex items-center gap-1 text-[9px] text-slate-500 cursor-pointer select-none bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      <input 
                        type="checkbox"
                        checked={aiOptimize}
                        onChange={(e) => setAiOptimize(e.target.checked)}
                        className="accent-purple-600 scale-75 cursor-pointer" 
                      />
                      <span className="font-bold">AI润色</span>
                    </label>
                  </div>

                  <button 
                    onClick={() => currentMode === "voiceover" ? setVoiceoverText("") : setPrompt("")}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1.5 cursor-pointer"
                  >
                    重置
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Generation submit button is STICKY/FIXED at bottom */}
          <div className="pt-3 border-t border-slate-100 mt-2.5 shrink-0">
            <button
              onClick={handleGenerateSubmit}
              disabled={!isFormValid}
              className={`w-full py-4.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isFormValid 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-100 hover:scale-[1.01]" 
                  : "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-70"
              }`}
            >
              <Sparkles className={`w-4.5 h-4.5 ${isFormValid ? "text-yellow-300 animate-pulse" : "text-slate-400"}`} />
              <span>立即生成 ✦72</span>
            </button>
            <p className="text-[9px] text-slate-400 text-center mt-2 font-medium">
              本次提交将扣除 72 算力。Sora 高清集群正处于满载流畅渲染通道中。
            </p>
          </div>

        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN (70% WIDTH) - TASKS ENGINE & WELCOME PANEL  */}
        {/* ========================================================== */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-6 h-full min-h-[500px]">
          
          <div className="space-y-6">
            
            {/* Top Toolbar matching specification */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              
              {/* Left welcome text block */}
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <Video className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span>Hi，欢迎来到AI视频生成工具</span>
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium">
                    请在左侧选择生成方式、上传素材、切换模型并创建视频。
                  </p>
                </div>
              </div>

              {/* Right operation entries */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => alert("高级选项：支持配置 AI 首尾帧流體计算精度与音画同步阈值。")}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>高级设置</span>
                </button>

                <button 
                  onClick={() => alert("已与您的 MC 电商图像素材及多场景音频片段资源包完美对齐！")}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>管理视频原料</span>
                </button>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="任务搜索..."
                    onClick={() => alert("可在此模糊检索当前工作会话中排队渲染的任务记录。")}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-600 placeholder-slate-400 outline-none w-28 md:w-36 focus:w-44 focus:border-purple-500 focus:bg-white transition-all font-bold"
                  />
                </div>
              </div>

            </div>

            {/* Main Interactive tasks flow panel */}
            <div className="space-y-4">
              
              {/* If no active tasks yet, display a premium tutorial guidelines placeholder card */}
              {activeTasks.length === 0 ? (
                <div className="space-y-4 text-left">
                  {/* Two guideline dash placeholder cards suggested by the spec */}
                  <div className="border border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50/40 text-center space-y-4 py-8 shadow-xs">
                    <div className="relative w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto text-purple-600 shadow-xs text-xl">
                      📦
                    </div>
                    
                    <div className="space-y-1.5 max-w-lg mx-auto">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        暂无活动任务・工作流待命中
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        您已激活爆款 <span className="text-slate-900 font-bold">「{selectedItem.title}」</span> 的风格同款。该同款带有高契合度的光影配置与高奢构图。只需在左侧点击 <span className="text-purple-600 font-bold">「立即生成」</span> 即可开始极速渲染生成！
                      </p>
                    </div>

                    <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        ✓ 支持智能优化
                      </span>
                      <span className="flex items-center gap-1">
                        ✓ 8秒全4K高清
                      </span>
                      <span className="flex items-center gap-1">
                        ✓ 毫秒级GPU调度
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex gap-3.5 shadow-xs">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-lg shadow-xs">
                        🎬
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800">首个生成攻略</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                          建议同时勾选「智能优化」开关，AI 会自动对美妆、数码、服饰类产品词进行好评词与高端氛围润色。
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex gap-3.5 shadow-xs">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-lg shadow-xs">
                        ⚡
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800">快速替换主视觉</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                          您可以点击左侧参考内容的「+ 参考内容」按钮来加入您真实的电商商品主图，让视频精准展示。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {activeTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs relative overflow-hidden"
                    >
                      {/* Status indicator row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            task.status === "rendering" ? "bg-purple-600 animate-ping" : "bg-emerald-500"
                          }`} />
                          <span className="text-[11px] text-slate-700 font-bold">
                            {task.status === "rendering" ? `渲染中 ${task.progress}%` : "一键同款生成完毕"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-450 font-mono font-medium">
                          提交时间: {task.timestamp}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {/* Reference used */}
                        <div className="flex gap-1 border border-slate-200 p-1 rounded-xl shrink-0 bg-white shadow-xs">
                          {task.references.map((r: string, idx: number) => (
                            <img 
                              key={idx} 
                              src={r} 
                              className="w-10 h-14 object-cover rounded-lg" 
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>

                        {/* Prompt & Output section */}
                        <div className="flex-1 w-full space-y-1.5 text-left">
                          <p className="text-[11px] text-slate-600 font-sans leading-relaxed font-medium">
                            {task.prompt}
                          </p>

                          {/* Progress slider bar */}
                          {task.status === "rendering" ? (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                                  <FileVideo className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-black text-slate-800">4K超高清视频已出炉</p>
                                  <p className="text-[9px] text-slate-400 font-mono font-medium">Size: 12.8 MB | H.264 / AAC | 8秒</p>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full md:w-auto shrink-0">
                                <a 
                                  href={task.outputVideo || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black py-2 px-3.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                                >
                                  <Play className="w-3 h-3 fill-white text-white" />
                                  <span>立即播放</span>
                                </a>
                                <button
                                  onClick={() => alert("同款视频已开始下载！快去将其上传至小红书、抖音或淘宝详情页。")}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-2 px-3 rounded-lg border border-slate-200 w-full md:w-auto"
                                >
                                  下载本地
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

          {/* 3. 底部合规提示 - Gray colors for light theme */}
          <footer className="border-t border-slate-200/60 pt-4 text-center space-y-1">
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              ⚠️ 声明：本系统由 AI 深度生成，视频场景、动作与背景音乐仅供商家参考。请用户对生成内容严格把关并依法进行标识标注。
            </p>
            <p className="text-[9px] text-slate-400 font-medium">
              内容的所有权及合法商业使用授权需遵循 AI 平台通用协议框架规定。
            </p>
          </footer>

        </div>

      </div>

    </div>
  );
}
