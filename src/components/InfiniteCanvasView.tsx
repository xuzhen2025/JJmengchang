import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Trash2, 
  GitFork, 
  Edit3, 
  Image as ImageIcon, 
  Tv2, 
  FileAudio, 
  FileText, 
  Check, 
  RotateCcw, 
  Move,
  MousePointer,
  HelpCircle,
  Sparkles,
  Link2,
  FolderOpen,
  Layers,
  Upload,
  Send,
  Settings2,
  Clock,
  Volume2,
  ChevronDown,
  X,
  Music
} from "lucide-react";

interface CanvasNode {
  id: string;
  type: "text" | "image" | "video" | "audio";
  title: string;
  content: string;
  x: number;
  y: number;
  parentId?: string;
}

interface InfiniteCanvasViewProps {
  onBack: () => void;
  onOpenMaterialSelector: (callback: (selectedUrls: string[]) => void) => void;
}

export default function InfiniteCanvasView({
  onBack,
  onOpenMaterialSelector
}: InfiniteCanvasViewProps) {
  // Initial demo nodes
  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      id: "node-1",
      type: "text",
      title: "香水新品推广计划",
      content: "针对全新北欧冷淡风木质调香水进行的全渠道多场景种草推广画布。",
      x: 100,
      y: 150
    },
    {
      id: "node-2",
      type: "image",
      title: "高奢主视觉图",
      content: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80",
      x: 480,
      y: 50,
      parentId: "node-1"
    },
    {
      id: "node-3",
      type: "video",
      title: "15s带货爆款分镜",
      content: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
      x: 480,
      y: 320,
      parentId: "node-1"
    },
    {
      id: "node-4",
      type: "audio",
      title: "背景配乐-高雅沙龙",
      content: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      x: 850,
      y: 380,
      parentId: "node-3"
    }
  ]);

  // Canvas Viewport transform state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  // Temporal values during dragging
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Edit node states
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // UI States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showBranchDropdownId, setShowBranchDropdownId] = useState<string | null>(null);

  // Dialogue States for the "高奢主视觉图" (node-2) Card
  const [dialogImage, setDialogImage] = useState<string | null>(
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80"
  );
  const [dialogPrompt, setDialogPrompt] = useState("制作15秒高奢感珠宝香水推广视频，镜头以慢动作旋转展示，光影自然，背景有丝绸质感的玫瑰金布料。");
  const [dialogModel, setDialogModel] = useState("seedance_2.5");
  const [dialogRatio, setDialogRatio] = useState("9:16");
  const [dialogResolution, setDialogResolution] = useState("1080p");
  const [dialogAudio, setDialogAudio] = useState("无");
  const [dialogDuration, setDialogDuration] = useState("15s");
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDialogSend = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      
      const node2 = nodes.find(n => n.id === "node-2");
      const newX = node2 ? node2.x : 480;
      const newY = node2 ? node2.y + 320 : 350;
      
      const newNodeId = `node-generated-${Date.now()}`;
      const newNode: CanvasNode = {
        id: newNodeId,
        type: "video",
        title: `AI生成: ${dialogRatio} ${dialogResolution}`,
        content: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
        x: newX,
        y: newY,
        parentId: "node-2"
      };
      
      setNodes(prev => [...prev, newNode]);
      setSelectedNodeId(newNodeId);
      alert("🎉 AI 视频生成成功！已将生成结果加入无线创意画布。");
    }, 1500);
  };

  // Pan canvas logic
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on a node or button, don't trigger panning
    const target = e.target as HTMLElement;
    if (target.closest(".canvas-node") || target.closest("button") || target.closest("input") || target.closest("textarea")) {
      return;
    }
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      });
    } else if (draggedNodeId) {
      // Scale coordinates relative to zoom
      const deltaX = (e.clientX - dragStartOffset.current.x) / zoom;
      const deltaY = (e.clientY - dragStartOffset.current.y) / zoom;

      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggedNodeId
            ? { ...node, x: Math.round(node.x + deltaX), y: Math.round(node.y + deltaY) }
            : node
        )
      );
      dragStartOffset.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Node Dragging Start
  const startDragNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setShowBranchDropdownId(null);
    dragStartOffset.current = { x: e.clientX, y: e.clientY };
  };

  // Zoom helpers
  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Add a new Root Node
  const createRootNode = (type: "text" | "image" | "video" | "audio") => {
    const id = `node-${Date.now()}`;
    const defaultContents = {
      text: "新文本画板内容，双击进行自定义文案编辑...",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
      video: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    };

    const typeLabels = {
      text: "新文本画板",
      image: "新图片画板",
      video: "新视频画板",
      audio: "新音频画板"
    };

    // Place node in center of current viewport view
    const canvasWidth = canvasRef.current?.clientWidth || 800;
    const canvasHeight = canvasRef.current?.clientHeight || 500;
    const x = Math.round((canvasWidth / 2 - pan.x - 140) / zoom);
    const y = Math.round((canvasHeight / 2 - pan.y - 100) / zoom);

    const newNode: CanvasNode = {
      id,
      type,
      title: typeLabels[type],
      content: defaultContents[type],
      x: Math.max(20, x),
      y: Math.max(20, y)
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  // Branch a new Node from parent
  const createBranchNode = (parentId: string, type: "text" | "image" | "video" | "audio") => {
    const parentNode = nodes.find((n) => n.id === parentId);
    if (!parentNode) return;

    const id = `node-${Date.now()}`;
    const defaultContents = {
      text: "分支创意画板内容，双击输入卖点、台词或背景提示词...",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
      video: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    };

    const typeLabels = {
      text: "分支文本",
      image: "分支主视觉",
      video: "分支视频分镜",
      audio: "分支配乐"
    };

    // Position branch shifted to the right & slightly down
    const newNode: CanvasNode = {
      id,
      type,
      title: `${typeLabels[type]}`,
      content: defaultContents[type],
      x: parentNode.x + 360,
      y: parentNode.y + (Math.random() * 160 - 80),
      parentId
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setShowBranchDropdownId(null);
  };

  // Delete node and its subtree recursively
  const deleteNode = (nodeId: string) => {
    const getSubtreeIds = (id: string): string[] => {
      const children = nodes.filter((n) => n.parentId === id);
      return [id, ...children.flatMap((c) => getSubtreeIds(c.id))];
    };

    const toDelete = getSubtreeIds(nodeId);
    setNodes((prev) => prev.filter((n) => !toDelete.includes(n.id)));
    if (selectedNodeId && toDelete.includes(selectedNodeId)) {
      setSelectedNodeId(null);
    }
    setEditingNodeId(null);
  };

  // Start Editing node properties
  const startEditing = (node: CanvasNode) => {
    setEditingNodeId(node.id);
    setEditTitle(node.title);
    setEditContent(node.content);
  };

  // Save Node edit
  const saveNodeEdit = () => {
    if (!editingNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === editingNodeId
          ? { ...n, title: editTitle, content: editContent }
          : n
      )
    );
    setEditingNodeId(null);
  };

  // Change Media using Asset Library Selector
  const triggerAssetSelection = (nodeId: string) => {
    onOpenMaterialSelector((selectedUrls) => {
      if (selectedUrls.length > 0) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? { ...n, content: selectedUrls[0] }
              : n
          )
        );
        // If currently editing this, keep fields updated
        if (editingNodeId === nodeId) {
          setEditContent(selectedUrls[0]);
        }
      }
    });
  };

  // Connection line generation paths (Smooth Bezier)
  const drawLink = (parent: CanvasNode, child: CanvasNode) => {
    // Outgoing from right center of parent card (width ~300)
    const startX = parent.x + 300;
    const startY = parent.y + 100; // Half height roughly
    // Incoming to left center of child card
    const endX = child.x;
    const endY = child.y + 100;

    // Control points for smooth s-curve
    const cp1x = startX + (endX - startX) * 0.4;
    const cp1y = startY;
    const cp2x = startX + (endX - startX) * 0.6;
    const cp2y = endY;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden text-slate-800">
      
      {/* Upper Action Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              无限创意画布
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100 font-mono">
                BETA
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              支持无限分枝画板，创建及串联文本、图片、视频、音频多维脑图
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Node Add Preset tools */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => createRootNode("text")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+文本</span>
            </button>
            <button
              onClick={() => createRootNode("image")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>+图片</span>
            </button>
            <button
              onClick={() => createRootNode("video")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Tv2 className="w-3.5 h-3.5" />
              <span>+视频</span>
            </button>
            <button
              onClick={() => createRootNode("audio")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1 cursor-pointer"
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span>+音频</span>
            </button>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            返回首页
          </button>
        </div>
      </div>

      {/* Infinite Canvas Container */}
      <div className="flex-1 flex relative overflow-hidden h-full">
        
        {/* Workspace Canvas Area */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 h-full select-none outline-none relative overflow-hidden bg-slate-50 cursor-grab ${
            isPanning ? "cursor-grabbing" : ""
          }`}
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        >
          {/* Main transformation Layer */}
          <div
            className="absolute inset-0 origin-top-left pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
            }}
          >
            {/* SVG Lines Layer underneath cards */}
            <svg className="absolute inset-0 overflow-visible w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#c084fc" />
                </marker>
              </defs>
              {nodes.map((child) => {
                if (!child.parentId) return null;
                const parent = nodes.find((n) => n.id === child.parentId);
                if (!parent) return null;

                return (
                  <path
                    key={`link-${child.id}`}
                    d={drawLink(parent, child)}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    markerEnd="url(#arrow)"
                    className="stroke-purple-300 drop-shadow-sm"
                  />
                );
              })}
            </svg>

            {/* Interactive HTML Card Nodes */}
            <div className="absolute inset-0 pointer-events-auto">
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isEditing = editingNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    className={`canvas-node absolute w-[300px] bg-white rounded-2xl border transition-all duration-150 shadow-md ${
                      isSelected
                        ? "border-purple-500 shadow-purple-500/10 ring-2 ring-purple-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    style={{
                      left: node.x,
                      top: node.y,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                  >
                    {/* Header Bar - Handles Dragging */}
                    <div
                      onMouseDown={(e) => startDragNode(e, node.id)}
                      className="p-3 bg-slate-50/80 border-b border-slate-150 rounded-t-2xl flex items-center justify-between cursor-move"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {node.type === "text" && <FileText className="w-4 h-4 text-purple-600 shrink-0" />}
                        {node.type === "image" && <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {node.type === "video" && <Tv2 className="w-4 h-4 text-blue-600 shrink-0" />}
                        {node.type === "audio" && <FileAudio className="w-4 h-4 text-amber-600 shrink-0" />}
                        
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {node.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Quick Action options */}
                        <button
                          onClick={() => startEditing(node)}
                          className="p-1 rounded-md hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
                          title="编辑内容"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteNode(node.id)}
                          className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="删除节点"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Node Main Content Frame */}
                    <div className="p-4 space-y-3 min-h-[100px]">
                      {/* Body Rendering depending on type */}
                      {node.type === "text" && (
                        <p className="text-xs text-slate-600 font-sans leading-relaxed break-words whitespace-pre-line">
                          {node.content}
                        </p>
                      )}

                      {node.type === "image" && (
                        <div className="space-y-2">
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-150 relative">
                            <img
                              src={node.content}
                              alt={node.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      )}

                      {node.type === "video" && (
                        <div className="space-y-2">
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-150 relative">
                            <video
                              src={node.content}
                              className="w-full h-full object-cover"
                              controls
                            />
                          </div>
                        </div>
                      )}

                      {node.type === "audio" && (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <FileAudio className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-[10px] text-slate-500 font-mono truncate">音乐文件</span>
                            </div>
                            <audio
                              src={node.content}
                              controls
                              className="w-full scale-90 origin-left"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Control / Branching handle */}
                    <div className="px-4 pb-4 flex justify-end items-center relative">
                      {/* Branch Button Trigger */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBranchDropdownId(showBranchDropdownId === node.id ? null : node.id);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>分支</span>
                        </button>

                        {/* Branch Dropdown Popup */}
                        {showBranchDropdownId === node.id && (
                          <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-150 rounded-xl shadow-xl p-1.5 z-30 min-w-[120px] flex flex-col gap-1">
                            <p className="text-[9px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">选择分支类型</p>
                            <button
                              onClick={() => createBranchNode(node.id, "text")}
                              className="w-full px-2 py-1.5 hover:bg-slate-50 rounded-lg text-[11px] text-slate-700 font-semibold text-left flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-purple-500" />
                              <span>文本画板</span>
                            </button>
                            <button
                              onClick={() => createBranchNode(node.id, "image")}
                              className="w-full px-2 py-1.5 hover:bg-slate-50 rounded-lg text-[11px] text-slate-700 font-semibold text-left flex items-center gap-2 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                              <span>图片画板</span>
                            </button>
                            <button
                              onClick={() => createBranchNode(node.id, "video")}
                              className="w-full px-2 py-1.5 hover:bg-slate-50 rounded-lg text-[11px] text-slate-700 font-semibold text-left flex items-center gap-2 cursor-pointer"
                            >
                              <Tv2 className="w-3.5 h-3.5 text-blue-500" />
                              <span>视频画板</span>
                            </button>
                            <button
                              onClick={() => createBranchNode(node.id, "audio")}
                              className="w-full px-2 py-1.5 hover:bg-slate-50 rounded-lg text-[11px] text-slate-700 font-semibold text-left flex items-center gap-2 cursor-pointer"
                            >
                              <FileAudio className="w-3.5 h-3.5 text-amber-500" />
                              <span>音频画板</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dialogue under High Luxury Main Visual (node-2) card */}
                    {node.id === "node-2" && isSelected && (
                      <div 
                        className="absolute top-[102%] left-1/2 -translate-x-1/2 bg-white border border-purple-100 shadow-2xl rounded-2xl p-4 z-40 w-[340px] space-y-3.5 pointer-events-auto cursor-default text-slate-700 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-bold text-slate-850 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                            高奢视觉 AI 视频工作流 / Workflow
                          </span>
                          <span className="text-[9px] bg-purple-50 text-purple-600 font-bold px-1.5 py-0.5 rounded-full font-mono">
                            Seedance 2.5
                          </span>
                        </div>

                        {/* Upload Image Section */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">上传图片 / Image Input</span>
                          {dialogImage ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200 group">
                              <img src={dialogImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onOpenMaterialSelector((urls) => {
                                      if (urls && urls.length > 0) setDialogImage(urls[0]);
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
                                >
                                  替换图片
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDialogImage(null)}
                                  className="p-1 bg-rose-500 hover:bg-rose-600 rounded-lg text-white transition-all cursor-pointer"
                                  title="移除图片"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenMaterialSelector((urls) => {
                                  if (urls && urls.length > 0) setDialogImage(urls[0]);
                                });
                              }}
                              className="w-full h-20 border border-dashed border-slate-300 hover:border-purple-300 rounded-xl flex flex-col items-center justify-center gap-1 bg-slate-50 text-slate-400 hover:text-purple-600 transition-all cursor-pointer"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-[10px] font-bold">上传或从资产库选择图片</span>
                            </button>
                          )}
                        </div>

                        {/* Prompt Textarea */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">提示词输入框 / Creative Prompt</span>
                          <textarea
                            value={dialogPrompt}
                            onChange={(e) => setDialogPrompt(e.target.value)}
                            placeholder="描述您期待生成的画面及镜头动作，例如：3D慢镜头环绕、香水在花瓣中、阳光温柔洒下..."
                            className="w-full text-[11px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-750 h-16 resize-none font-sans leading-relaxed"
                          />
                        </div>

                        {/* Row: Model Selection & Settings */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Model selector */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 font-bold block">模型选择 / Model</span>
                            <div className="relative">
                              <select
                                value={dialogModel}
                                onChange={(e) => setDialogModel(e.target.value)}
                                className="w-full text-[10px] pl-2.5 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-700 font-bold appearance-none cursor-pointer"
                              >
                                <option value="seedance_2.5">seedance 2.5 (默认)</option>
                                <option value="seedance_2.0-VIP">seedance 2.0-VIP</option>
                                <option value="seedance_1.5-HD">seedance 1.5-HD</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {/* Settings Popup Trigger */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 font-bold block">参数规格 / Settings</span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowSettingsPopup(!showSettingsPopup)}
                                className={`w-full text-[10px] px-2.5 py-2 rounded-lg border text-left font-bold cursor-pointer transition-all flex items-center justify-between ${
                                  showSettingsPopup 
                                    ? "bg-purple-50 border-purple-200 text-purple-700" 
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                <span className="truncate">{dialogRatio} | {dialogResolution} | {dialogDuration}</span>
                                <Settings2 className="w-3.5 h-3.5 text-purple-500 shrink-0 ml-1" />
                              </button>

                              {/* Settings popup dropdown overlay */}
                              {showSettingsPopup && (
                                <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 w-[260px] space-y-3.5 animate-fade-in text-slate-700 pointer-events-auto">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                      <Settings2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                                      比例规格详细参数
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => setShowSettingsPopup(false)} 
                                      className="p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Aspect Ratio Selection */}
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">比例选择 / Ratio</span>
                                    <div className="grid grid-cols-4 gap-1">
                                      {["9:16", "16:9", "1:1", "4:3"].map(r => (
                                        <button
                                          key={r}
                                          type="button"
                                          onClick={() => setDialogRatio(r)}
                                          className={`py-1 text-[9px] font-extrabold rounded border transition-all cursor-pointer ${
                                            dialogRatio === r
                                              ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                          }`}
                                        >
                                          {r}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Resolution Selection */}
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">选择分辨率 / Resolution</span>
                                    <div className="grid grid-cols-3 gap-1">
                                      {["720p", "1080p", "2K"].map(res => (
                                        <button
                                          key={res}
                                          type="button"
                                          onClick={() => setDialogResolution(res)}
                                          className={`py-1 text-[9px] font-extrabold rounded border transition-all cursor-pointer ${
                                            dialogResolution === res
                                              ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                          }`}
                                        >
                                          {res}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Audio Selection */}
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">音频 / Audio Option</span>
                                    <div className="relative">
                                      <select
                                        value={dialogAudio}
                                        onChange={(e) => setDialogAudio(e.target.value)}
                                        className="w-full text-[10px] pl-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-700 font-bold appearance-none cursor-pointer"
                                      >
                                        <option value="无">无音频伴奏</option>
                                        <option value="浪漫爵士">伴奏1 - 浪漫爵士</option>
                                        <option value="动感电子">伴奏2 - 动感电子</option>
                                        <option value="高雅沙龙">伴奏3 - 高雅沙龙</option>
                                      </select>
                                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                  </div>

                                  {/* Duration Selection */}
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">时长 / Duration</span>
                                    <div className="grid grid-cols-3 gap-1">
                                      {["5s", "15s", "30s"].map(dur => (
                                        <button
                                          key={dur}
                                          type="button"
                                          onClick={() => setDialogDuration(dur)}
                                          className={`py-1 text-[9px] font-extrabold rounded border transition-all cursor-pointer ${
                                            dialogDuration === dur
                                              ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                          }`}
                                        >
                                          {dur}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Close panel confirm */}
                                  <button
                                    type="button"
                                    onClick={() => setShowSettingsPopup(false)}
                                    className="w-full py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center"
                                  >
                                    保存并返回配置
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer: Bottom Right Credit 20 & Send Button */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold">
                            <span className="animate-bounce">💎</span>
                            <span>20 积分 / 条</span>
                          </div>

                          <button
                            type="button"
                            onClick={handleDialogSend}
                            disabled={isGenerating}
                            className={`px-3.5 py-2 rounded-xl text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                              isGenerating 
                                ? "bg-slate-300 cursor-not-allowed" 
                                : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-md shadow-purple-100 hover:shadow-purple-200"
                            }`}
                          >
                            {isGenerating ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <span>生片中...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>开始制作</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating Side Controller Panel (Left Side Overlay) */}
        <div className="absolute left-4 top-4 bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-xl z-10 w-64 backdrop-blur-md">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">画布属性控制</span>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">当前画板数</span>
              <span className="text-xs font-bold text-slate-800">{nodes.length} 个</span>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={zoomIn}
                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-all flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer"
                title="放大"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>放大</span>
              </button>
              <button
                onClick={zoomOut}
                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-all flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer"
                title="缩小"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>缩小</span>
              </button>
              <button
                onClick={resetZoom}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition-all cursor-pointer"
                title="重置视图"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Content Bottom Dialog Modal */}
      {editingNodeId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-purple-600" />
                编辑画板属性
              </h3>
              <button
                onClick={() => setEditingNodeId(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                取消
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">标题</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                  {nodes.find(n => n.id === editingNodeId)?.type === "text" ? "核心内容" : "媒体链接"}
                </label>
                {nodes.find(n => n.id === editingNodeId)?.type === "text" ? (
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => triggerAssetSelection(editingNodeId)}
                      className="w-full py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>从 MC 资产库导入素材</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingNodeId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={saveNodeEdit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
