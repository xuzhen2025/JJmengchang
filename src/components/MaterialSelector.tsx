import React, { useState } from "react";
import { X, Search, FileUp, Image, Video, Music, Check, FolderHeart } from "lucide-react";
import { Asset } from "../types";
import AssetPagination from "./AssetPagination";
import OverlayPortal from "./overlays/OverlayPortal";

interface MaterialSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onUploadAsset: (file: { name: string; type: "image" | "video" | "audio"; url: string; size: string }) => void;
  onSelectMaterials: (selectedUrls: string[]) => void;
  maxSelections?: number;
  allowedTypes?: Array<"image" | "video" | "audio" | "document" | "template">;
}

export default function MaterialSelector({
  isOpen,
  onClose,
  assets,
  onUploadAsset,
  onSelectMaterials,
  maxSelections = 5,
  allowedTypes = ["image", "video"]
}: MaterialSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio">("all");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  if (!isOpen) return null;

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || asset.type === activeTab;
    const isAllowed = allowedTypes.includes(asset.type);
    return matchesSearch && matchesTab && isAllowed;
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredAssets.length / pageSize)));
  const pagedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelect = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls(selectedUrls.filter((u) => u !== url));
    } else {
      if (maxSelections === 1) {
        setSelectedUrls([url]);
      } else if (selectedUrls.length < maxSelections) {
        setSelectedUrls([...selectedUrls, url]);
      } else {
        alert(`最多选择 ${maxSelections} 张图`);
      }
    }
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.type.startsWith("video/") 
        ? "video" 
        : file.type.startsWith("audio/") 
          ? "audio" 
          : "image";
      
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const objectUrl = URL.createObjectURL(file);

      onUploadAsset({
        name: file.name,
        type,
        url: objectUrl,
        size: sizeStr
      });
    }
  };

  const handleConfirm = () => {
    onSelectMaterials(selectedUrls);
    onClose();
  };

  return (
    <OverlayPortal layer="modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl flex flex-col h-[550px] shadow-2xl overflow-hidden animate-fade-in text-slate-700">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-800 text-sm">选择参考素材</h3>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
              最多选择 {maxSelections} 项
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          {/* Tabs */}
          <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg flex-shrink-0">
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-white text-slate-700 shadow-xs border border-slate-100" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              全部
            </button>
            {allowedTypes.includes("image") && (
              <button
                onClick={() => { setActiveTab("image"); setPage(1); }}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  activeTab === "image" ? "bg-white text-slate-700 shadow-xs border border-slate-100" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                图片
              </button>
            )}
            {allowedTypes.includes("video") && (
              <button
                onClick={() => { setActiveTab("video"); setPage(1); }}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  activeTab === "video" ? "bg-white text-slate-700 shadow-xs border border-slate-100" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                视频
              </button>
            )}
          </div>

          {/* Search & Upload */}
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索资产..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg text-[11px] pl-8 pr-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-purple-500 placeholder-slate-400 w-full"
              />
            </div>

            <label className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-md shadow-purple-600/10">
              <FileUp className="w-3.5 h-3.5" />
              <span>本地上传</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleLocalUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
          {filteredAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2 border border-slate-200">
                <FolderHeart className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-slate-500 text-xs">暂无可用资产，点击本地上传添加素材</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pagedAssets.map((asset) => {
                const isSelected = selectedUrls.includes(asset.url);
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected 
                        ? "border-purple-500 ring-2 ring-purple-100 scale-[0.98]" 
                        : "border-slate-200 hover:border-slate-300 bg-white shadow-xs"
                    }`}
                  >
                    {asset.type === "image" ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full relative bg-slate-100">
                        <video
                          src={asset.url}
                          className="w-full h-full object-cover muted"
                          preload="metadata"
                        />
                        <div className="absolute right-1.5 top-1.5 bg-black/60 px-1 py-0.5 rounded text-[8px] text-white uppercase tracking-wider">
                          video
                        </div>
                      </div>
                    )}

                    {/* Hover text block overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-[10px] text-white font-medium truncate">{asset.name}</p>
                      <p className="text-[8px] text-slate-300 font-mono">{asset.size}</p>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border border-white">
                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-4">
          <AssetPagination total={filteredAssets.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-[10px] text-slate-400">
            已选择 <span className="font-bold text-purple-600 font-mono">{selectedUrls.length}</span> / {maxSelections} 个素材
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className={`text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-lg cursor-pointer ${
                selectedUrls.length > 0 
                  ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/15" 
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
