import React, { useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Search, Trash2, Upload, X } from "lucide-react";
import AssetPagination from "./AssetPagination";
import OverlayPortal from "./overlays/OverlayPortal";
import { useResourceConfig } from "../lib/useResourceConfig";
import { VIDEO_RESOURCE_SCOPES } from "../lib/resourceConfig";
import { ResourceStatusBadge } from "./ResourceConfigControls";
import { useScopedTaggedResources, useTaggedResources, useTagFilterSync } from "../lib/useResourceTags";

export type VideoResourceSection = "成片" | "素材" | "第三方" | "图片";

export interface VideoResourcePickerItem {
  id: string;
  name: string;
  cover: string;
  status: string;
  section: VideoResourceSection;
  primaryCategory: string;
  secondaryCategory: string;
  tags: string[];
  author: string;
  duration: string;
  size: string;
  sizeBytes?: number;
  url?: string;
  resolution?: string;
  fps?: number;
  kind?: "video" | "image";
}

export interface VideoResourcePickerImageItem {
  id: string;
  name: string;
  cover: string;
  status: string;
  primaryCategory: string;
  secondaryCategory: string;
  tags: string[];
  author: string;
  size: string;
  sizeBytes?: number;
  url: string;
  resolution?: string;
}

interface VideoResourcePickerModalProps {
  items: VideoResourcePickerItem[];
  initialSelectedIds: string[];
  initialSection?: VideoResourceSection;
  initialSourceTab?: "library" | "local";
  allowLocalUpload?: boolean;
  showAllSection?: boolean;
  maxSelections?: number;
  maxFileSizeMB?: number;
  allowImageSelection?: boolean;
  imageItems?: VideoResourcePickerImageItem[];
  onClose: () => void;
  onConfirm: (items: VideoResourcePickerItem[]) => void;
}

const filterClassName = "h-9 w-[130px] shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-violet-400";

const uniqueValues = (values: string[]) => Array.from(new Set(values)).filter(Boolean);

export default function VideoResourcePickerModal({
  items: sourceItems,
  initialSelectedIds,
  initialSection = "成片",
  initialSourceTab = "library",
  allowLocalUpload = false,
  maxSelections,
  maxFileSizeMB = 1000,
  allowImageSelection = false,
  imageItems: sourceImageItems = [],
  onClose,
  onConfirm,
}: VideoResourcePickerModalProps) {
  const items = useScopedTaggedResources<VideoResourcePickerItem>(sourceItems, (item) => item.section === "图片" ? "images" : VIDEO_RESOURCE_SCOPES[item.section]);
  const sections: VideoResourceSection[] = ["成片", "素材"];
  if (initialSection === "第三方" || sourceItems.some(item => item.section === "第三方")) sections.push("第三方");
  if (allowImageSelection) sections.push("图片");
  const imageItems = useTaggedResources("images", sourceImageItems);
  const [sourceTab, setSourceTab] = useState<"library" | "local">(allowLocalUpload ? initialSourceTab : "library");
  const [section, setSection] = useState<VideoResourceSection>(initialSection);
  const [primaryCategory, setPrimaryCategory] = useState("全部一级分类");
  const [secondaryCategory, setSecondaryCategory] = useState("全部二级分类");
  const [tag, setTag] = useState("全部标签");
  useTagFilterSync("public", tag, (value) => setTag(value === "全部" ? "全部标签" : value));
  const [status, setStatus] = useState("全部状态");
  const [author, setAuthor] = useState("全部上传人");
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => {
    const initial = uniqueValues(initialSelectedIds);
    return maxSelections ? initial.slice(0, maxSelections) : initial;
  });
  const [localItems, setLocalItems] = useState<VideoResourcePickerItem[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const selectableImageItems = useMemo<VideoResourcePickerItem[]>(() => imageItems.map((item) => ({ ...item, section: "图片", duration: "图片", kind: "image" })), [imageItems]);
  const allItems = useMemo(() => [...items, ...selectableImageItems, ...localItems], [items, localItems, selectableImageItems]);
  const sectionItems = useMemo(
    () => [...items, ...(allowImageSelection ? selectableImageItems : [])].filter((item) => item.section === section),
    [allowImageSelection, items, section, selectableImageItems],
  );
  const { store: configStore } = useResourceConfig();
  const scopes = [section === "图片" ? "images" : VIDEO_RESOURCE_SCOPES[section]];
  const categoryNodes = scopes.flatMap(scope => configStore.categories(scope));
  const primaryCategories = uniqueValues(categoryNodes.map(n => n.name));
  const secondaryCategories = uniqueValues(categoryNodes.filter(n => primaryCategory === "全部一级分类" || n.name === primaryCategory).flatMap(n => n.children.map(c => c.name)));
  const tags = useMemo(() => uniqueValues(sectionItems.flatMap((item) => item.tags)), [sectionItems]);
  const statusEnabled = section === "图片" || scopes.some(scope => configStore.statusEnabled(scope));
  const statuses = section === "图片" ? uniqueValues(sectionItems.map(item => item.status)) : uniqueValues(scopes.filter(scope => configStore.statusEnabled(scope)).flatMap(scope => configStore.statuses(scope).map(s => s.name)));
  const authors = useMemo(() => uniqueValues(sectionItems.map((item) => item.author)), [sectionItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sectionItems.filter((item) =>
      (primaryCategory === "全部一级分类" || item.primaryCategory === primaryCategory) &&
      (secondaryCategory === "全部二级分类" || item.secondaryCategory === secondaryCategory) &&
      (tag === "全部标签" || item.tags.includes(tag)) &&
      (!statusEnabled || status === "全部状态" || item.status === status) &&
      (author === "全部上传人" || item.author === author) &&
      (!onlyMine || item.author === "徐振") &&
      (!query || `${item.name}${item.id}`.toLowerCase().includes(query)),
    );
  }, [author, onlyMine, primaryCategory, search, secondaryCategory, sectionItems, status, tag, statusEnabled]);

  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredItems.length / pageSize)));
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setPage(1);
  const getFileSizeMB = (size: string) => {
    const match = size.replace(/,/g, "").match(/([\d.]+)\s*(KB|MB|GB)/i);
    if (!match) return null;
    const value = Number(match[1]);
    const unit = match[2].toUpperCase();
    if (!Number.isFinite(value)) return null;
    if (unit === "GB") return value * 1024;
    if (unit === "KB") return value / 1024;
    return value;
  };

  const toggleItem = (id: string) => {
    const item = allItems.find((video) => video.id === id);
    if (item?.kind !== "image" && item && !/\.(mp4|mpeg|mov)$/i.test(item.name)) {
      setUploadError(`“${item.name}”格式不受支持，仅可选择 MP4、MPEG、MOV 视频。`);
      return;
    }
    const sizeMB = item ? getFileSizeMB(item.size) : null;
    if (item?.kind !== "image" && sizeMB !== null && sizeMB >= maxFileSizeMB) {
      setUploadError(`“${item?.name}”大小为 ${item?.size}，单个视频需小于 ${maxFileSizeMB} MB。`);
      return;
    }
    setUploadError("");
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (maxSelections === 1) return [id];
      if (maxSelections && current.length >= maxSelections) return current;
      return [...current, id];
    });
  };

  const handleLocalUpload = (files?: FileList | null) => {
    if (!files?.length) return;
    const candidates = Array.from(files);
    const supported = candidates.filter((file) => allowImageSelection
      ? /\.(mp4|mpeg|mov|jpe?g|png|webp|bmp|gif|tiff?)$/i.test(file.name)
      : /\.(mp4|mpeg|mov)$/i.test(file.name));
    const accepted = supported.filter((file) => file.size < maxFileSizeMB * 1024 * 1024);
    const errors: string[] = [];
    if (supported.length < candidates.length) errors.push(allowImageSelection ? "仅支持图片、MP4、MPEG、MOV 格式" : "仅支持 MP4、MPEG、MOV 格式");
    if (accepted.length < supported.length) errors.push(`单个视频需小于 ${maxFileSizeMB} MB`);
    setUploadError(errors.join("；"));

    const uploaded = accepted
      .map((file, index): VideoResourcePickerItem => ({
        id: `script-video-local-${Date.now()}-${index}`,
        name: file.name,
        cover: file.type.startsWith("image/") ? URL.createObjectURL(file) : "./assets/prototype/beauty-promo-detail.jpg",
        status: "本地文件",
        section: "素材",
        primaryCategory: "本地上传",
        secondaryCategory: "未分类",
        tags: [],
        author: "当前用户",
        duration: "--:--",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        sizeBytes: file.size,
        url: URL.createObjectURL(file),
        kind: file.type.startsWith("image/") ? "image" : "video",
      }));
    if (uploaded.length === 0) {
      if (uploadRef.current) uploadRef.current.value = "";
      return;
    }
    setLocalItems((current) => [...current, ...uploaded]);
    setSelectedIds((current) => {
      if (maxSelections === 1) return uploaded.slice(-1).map((item) => item.id);
      const next = [...current, ...uploaded.map((item) => item.id)];
      return maxSelections ? next.slice(0, maxSelections) : next;
    });
    if (uploadRef.current) uploadRef.current.value = "";
  };

  return (
    <OverlayPortal
      layer="modal"
      className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="选择关联作品" className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white text-slate-800 shadow-2xl">
        <div className="flex min-h-0 flex-1 flex-col p-5 pb-0">
          {allowLocalUpload && (
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => { setSourceTab("library"); resetPage(); }} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${sourceTab === "library" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>资源库</button>
                <button type="button" onClick={() => { setSourceTab("local"); resetPage(); }} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${sourceTab === "local" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>本地上传</button>
              </div>
              <button type="button" onClick={onClose} title="关闭" className="mb-1 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {sourceTab === "library" ? <>
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-1">
              {sections.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSection(item);
                    setPrimaryCategory("全部一级分类");
                    setSecondaryCategory("全部二级分类");
                    setTag("全部标签");
                    setStatus("全部状态");
                    setAuthor("全部上传人");
                    resetPage();
                  }}
                  className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${section === item ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  {{ 成片: "成片管理", 素材: "素材管理", 第三方: "第三方管理", 图片: "图片管理" }[item]}
                </button>
              ))}
            </div>
            {!allowLocalUpload && <button type="button" onClick={onClose} title="关闭" className="mb-1 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>}
          </div>

          <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto py-4">
            <select value={primaryCategory} onChange={(event) => { setPrimaryCategory(event.target.value); setSecondaryCategory("全部二级分类"); resetPage(); }} className={filterClassName}>
              <option>全部一级分类</option>
              {primaryCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={secondaryCategory} onChange={(event) => { setSecondaryCategory(event.target.value); resetPage(); }} className={filterClassName}>
              <option>全部二级分类</option>
              {secondaryCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={tag} onChange={(event) => { setTag(event.target.value); resetPage(); }} className={filterClassName}>
              <option value="全部标签">全部二级标签</option>
              {tags.map((item) => <option key={item}>{item}</option>)}
            </select>
            {statusEnabled && <select value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }} className={filterClassName}>
              <option>全部状态</option>
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>}
            <select value={author} onChange={(event) => { setAuthor(event.target.value); resetPage(); }} className={`${filterClassName} whitespace-nowrap`}>
              <option>全部上传人</option>
              {authors.map((item) => <option key={item}>{item}</option>)}
            </select>
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="搜索文件名称或 ID" className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-violet-400" />
            </div>
            <label className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap px-2 text-xs text-slate-600">
              <input type="checkbox" checked={onlyMine} onChange={(event) => { setOnlyMine(event.target.checked); resetPage(); }} className="accent-violet-600" />
              仅看我的
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[960px] table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                <tr>
                  <th className="w-14 px-4 py-3" />
                  <th className="w-32 px-3 py-3">{section === "图片" ? "图片缩略图" : "文件缩略图"}</th>
                  <th className="w-[34%] px-3 py-3">文件名称 / ID</th>
                  <th className="w-28 px-3 py-3">状态</th>
                  <th className="w-44 px-3 py-3">{section === "图片" ? "分类 / 标签" : "所在分类"}</th>
                  <th className="w-24 px-3 py-3">上传人</th>
                  <th className="w-20 px-3 py-3">{section === "图片" ? "分辨率" : "时长"}</th>
                  <th className="w-24 px-3 py-3">大小</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.length ? pagedItems.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} onClick={() => toggleItem(item.id)} className={`cursor-pointer border-t border-slate-100 ${selected ? "bg-violet-50" : "hover:bg-slate-50"}`}>
                      <td className="px-4 py-3"><span className={`flex h-4 w-4 items-center justify-center border ${maxSelections === 1 ? "rounded-full" : "rounded"} ${selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>{selected && <Check className="h-2.5 w-2.5" />}</span></td>
                      <td className="px-3 py-2"><img src={item.cover} alt="" className="h-10 w-16 rounded object-cover" referrerPolicy="no-referrer" /></td>
                      <td className="px-3 py-3"><p className="truncate font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.id}</p></td>
                      <td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{item.status}</span></td>
                      <td className="px-3 py-3"><p className="font-semibold text-slate-700">{section === "图片" ? `${item.primaryCategory} / ${item.secondaryCategory}` : item.section}</p><p className="mt-1 truncate text-[10px] text-slate-400">{section === "图片" ? item.tags.join("、") : `${item.primaryCategory} / ${item.secondaryCategory}`}</p></td>
                      <td className="truncate px-3 py-3 text-slate-500">{item.author}</td>
                      <td className="px-3 py-3 text-slate-500">{section === "图片" ? item.resolution || "--" : item.kind === "image" ? "图片" : item.duration}</td>
                      <td className="px-3 py-3 text-slate-500">{item.size}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={8} className="h-48 text-center text-sm text-slate-400">暂无符合条件的文件</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="shrink-0">
            <AssetPagination total={filteredItems.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); resetPage(); }} />
          </div>
          </> : (
            <div className="min-h-0 flex-1 overflow-y-auto py-5">
              <button type="button" onClick={() => uploadRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700">
                <Upload className="h-6 w-6" />
                <span className="mt-3 text-xs font-semibold">点击选择本地{allowImageSelection ? "图片或视频" : "视频"}</span>
              </button>
              <input ref={uploadRef} type="file" multiple={maxSelections !== 1} accept={allowImageSelection ? ".jpg,.jpeg,.png,.webp,.bmp,.gif,.tif,.tiff,.mp4,.mpeg,.mov,image/*,video/*" : ".mp4,.mpeg,.mov,video/mp4,video/mpeg,video/quicktime"} className="hidden" onChange={(event) => handleLocalUpload(event.target.files)} />
              <p className="mt-3 text-center text-xs leading-6 text-slate-400">支持 {allowImageSelection ? "图片、" : ""}MP4、MPEG、MOV 格式，单个文件大小需小于 {maxFileSizeMB} MB。<br />请确保上传素材为原创内容或已取得合法授权。</p>
              {uploadError && <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-rose-600"><AlertCircle className="h-3.5 w-3.5" />{uploadError}</p>}
              {localItems.length > 0 && <div className="mt-4 space-y-2">{localItems.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-md border border-slate-200 p-2.5"><img src={item.cover} alt="" className="h-11 w-16 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.size}</p></div><button type="button" onClick={() => { setLocalItems((current) => current.filter((video) => video.id !== item.id)); setSelectedIds((current) => current.filter((id) => id !== item.id)); }} title="删除" className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <div className="mr-auto min-w-0"><p className="text-xs text-slate-500">已选择 <b className="text-violet-700">{selectedIds.length}</b>{maxSelections ? ` / ${maxSelections}` : ""} 个{allowImageSelection ? "文件" : "视频"}</p>{sourceTab === "library" && uploadError && <p className="mt-1 truncate text-[10px] font-medium text-rose-600">{uploadError}</p>}</div>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">取消</button>
          <button type="button" disabled={selectedIds.length === 0} onClick={() => onConfirm(allItems.filter((item) => selectedIds.includes(item.id)))} className="rounded-md bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">确认选择</button>
        </div>
      </div>
    </OverlayPortal>
  );
}
