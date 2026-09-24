import React, { useMemo, useRef, useState } from "react";
import { Check, Search, Trash2, Upload, X } from "lucide-react";
import AssetPagination from "./AssetPagination";
import OverlayPortal from "./overlays/OverlayPortal";
import { useResourceConfig } from "../lib/useResourceConfig";
import { useTaggedResources, useTagFilterSync } from "../lib/useResourceTags";

export interface ImageResourcePickerItem {
  id: string;
  name: string;
  url: string;
  status: string;
  primaryCategory: string;
  secondaryCategory: string;
  tags: string[];
  author: string;
  resolution: string;
  size: string;
  sizeBytes?: number;
  source?: "library" | "local";
}

interface ImageResourcePickerModalProps {
  items: ImageResourcePickerItem[];
  initialSelectedIds: string[];
  multiple?: boolean;
  initialSourceTab?: "library" | "local";
  maxSelections?: number;
  onClose: () => void;
  onConfirm: (items: ImageResourcePickerItem[]) => void;
}

const filterClassName = "h-9 w-[130px] shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-violet-400";
const uniqueValues = (values: string[]) => Array.from(new Set(values)).filter(Boolean);

export default function ImageResourcePickerModal({
  items: sourceItems,
  initialSelectedIds,
  multiple = false,
  initialSourceTab = "library",
  maxSelections,
  onClose,
  onConfirm,
}: ImageResourcePickerModalProps) {
  const items = useTaggedResources("images", sourceItems);
  const [sourceTab, setSourceTab] = useState(initialSourceTab);
  const [primaryCategory, setPrimaryCategory] = useState("全部一级分类");
  const [secondaryCategory, setSecondaryCategory] = useState("全部二级分类");
  const [tag, setTag] = useState("全部标签");
  useTagFilterSync("public", tag, (value) => setTag(value === "全部" ? "全部标签" : value));
  const [status, setStatus] = useState("全部状态");
  const [author, setAuthor] = useState("全部上传人");
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const selectionLimit = multiple ? maxSelections : 1;
  const [selectedIds, setSelectedIds] = useState(() => uniqueValues(initialSelectedIds).slice(0, selectionLimit));
  const [localItems, setLocalItems] = useState<ImageResourcePickerItem[]>([]);
  const [selectionError, setSelectionError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const allItems = useMemo(() => [...items, ...localItems], [items, localItems]);
  const { store: configStore } = useResourceConfig();
  const primaryCategories = configStore.categories("images").map(n => n.name);
  const secondaryCategories = uniqueValues(configStore.categories("images").filter(n => primaryCategory === "全部一级分类" || n.name === primaryCategory).flatMap(n => n.children.map(c => c.name)));
  const tags = useMemo(() => uniqueValues(items.flatMap((item) => item.tags)), [items]);
  const statuses = useMemo(() => uniqueValues(items.map((item) => item.status)), [items]);
  const authors = useMemo(() => uniqueValues(items.map((item) => item.author)), [items]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) =>
      (primaryCategory === "全部一级分类" || item.primaryCategory === primaryCategory)
      && (secondaryCategory === "全部二级分类" || item.secondaryCategory === secondaryCategory)
      && (tag === "全部标签" || item.tags.includes(tag))
      && (status === "全部状态" || item.status === status)
      && (author === "全部上传人" || item.author === author)
      && (!onlyMine || item.author === "徐振")
      && (!query || `${item.name}${item.id}`.toLowerCase().includes(query)),
    );
  }, [author, items, onlyMine, primaryCategory, search, secondaryCategory, status, tag]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredItems.length / pageSize)));
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setPage(1);
  const toggleItem = (id: string) => {
    if (multiple && selectionLimit !== undefined && selectedIds.length >= selectionLimit && !selectedIds.includes(id)) {
      setSelectionError(`最多选择 ${selectionLimit} 张图片。`);
      return;
    }
    setSelectionError("");
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return multiple ? [...current, id] : [id];
    });
  };

  const handleLocalUpload = (files?: FileList | null) => {
    if (!files?.length) return;
    const candidates = multiple ? Array.from(files) : Array.from(files).slice(0, 1);
    const valid = candidates.filter(file => file.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif|tiff?)$/i.test(file.name));
    const capacity = multiple && selectionLimit !== undefined ? Math.max(0, selectionLimit - selectedIds.length) : undefined;
    const selectedFiles = valid.slice(0, capacity);
    setSelectionError(valid.length !== candidates.length ? "请选择图片文件。" : selectedFiles.length < valid.length ? `最多选择 ${selectionLimit} 张图片，超出部分未添加。` : "");
    const uploaded = selectedFiles
      .filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif|tiff?)$/i.test(file.name))
      .map((file, index): ImageResourcePickerItem => ({
        id: `script-image-local-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        status: "本地文件",
        primaryCategory: "本地上传",
        secondaryCategory: "未分类",
        tags: [],
        author: "当前用户",
        resolution: "读取中",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        sizeBytes: file.size,
        source: "local",
      }));
    setLocalItems((current) => multiple ? [...current, ...uploaded] : uploaded);
    setSelectedIds((current) => multiple ? [...current, ...uploaded.map((item) => item.id)] : uploaded.slice(0, 1).map((item) => item.id));
    if (uploadRef.current) uploadRef.current.value = "";
  };

  return (
    <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="选择图片" className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white text-slate-800 shadow-2xl">
        <div className="flex min-h-0 flex-1 flex-col p-5 pb-0">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { setSourceTab("library"); resetPage(); }} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${sourceTab === "library" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>图片管理</button>
              <button type="button" onClick={() => { setSourceTab("local"); resetPage(); }} className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${sourceTab === "local" ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>本地上传</button>
            </div>
            <button type="button" onClick={onClose} title="关闭" className="mb-1 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>

          {sourceTab === "library" ? <>
            <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto py-4">
              <select value={primaryCategory} onChange={(event) => { setPrimaryCategory(event.target.value); setSecondaryCategory("全部二级分类"); resetPage(); }} className={filterClassName}><option>全部一级分类</option>{primaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={secondaryCategory} onChange={(event) => { setSecondaryCategory(event.target.value); resetPage(); }} className={filterClassName}><option>全部二级分类</option>{secondaryCategories.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={tag} onChange={(event) => { setTag(event.target.value); resetPage(); }} className={filterClassName}><option value="全部标签">全部二级标签</option>{tags.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }} className={filterClassName}><option>全部状态</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={author} onChange={(event) => { setAuthor(event.target.value); resetPage(); }} className={`${filterClassName} whitespace-nowrap`}><option>全部上传人</option>{authors.map((item) => <option key={item}>{item}</option>)}</select>
              <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="搜索图片名称或 ID" className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-violet-400" /></div>
              <label className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap px-2 text-xs text-slate-600"><input type="checkbox" checked={onlyMine} onChange={(event) => { setOnlyMine(event.target.checked); resetPage(); }} className="accent-violet-600" />仅看我的</label>
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[900px] table-fixed text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr><th className="w-14 px-4 py-3" /><th className="w-28 px-3 py-3">图片缩略图</th><th className="w-[34%] px-3 py-3">文件名称 / ID</th><th className="w-28 px-3 py-3">状态</th><th className="w-48 px-3 py-3">分类 / 标签</th><th className="w-24 px-3 py-3">上传人</th><th className="w-28 px-3 py-3">分辨率</th><th className="w-20 px-3 py-3">大小</th></tr></thead>
                <tbody>{pagedItems.length ? pagedItems.map((item) => { const selected = selectedIds.includes(item.id); return <tr key={item.id} onClick={() => toggleItem(item.id)} className={`cursor-pointer border-t border-slate-100 ${selected ? "bg-violet-50" : "hover:bg-slate-50"}`}><td className="px-4 py-3"><span className={`flex h-4 w-4 items-center justify-center ${multiple ? "rounded" : "rounded-full"} border ${selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>{selected && <Check className="h-2.5 w-2.5" />}</span></td><td className="px-3 py-2"><img src={item.url} alt="" className="h-12 w-12 rounded object-cover" referrerPolicy="no-referrer" /></td><td className="px-3 py-3"><p className="truncate font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.id}</p></td><td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{item.status}</span></td><td className="px-3 py-3"><p className="font-semibold text-slate-700">{item.primaryCategory} / {item.secondaryCategory}</p><p className="mt-1 truncate text-[10px] text-slate-400">{item.tags.join("、")}</p></td><td className="px-3 py-3 text-slate-500">{item.author}</td><td className="px-3 py-3 text-slate-500">{item.resolution}</td><td className="px-3 py-3 text-slate-500">{item.size}</td></tr>; }) : <tr><td colSpan={8} className="h-48 text-center text-sm text-slate-400">暂无符合条件的图片</td></tr>}</tbody>
              </table>
            </div>
            <div className="shrink-0"><AssetPagination total={filteredItems.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); resetPage(); }} /></div>
          </> : <div className="min-h-0 flex-1 overflow-y-auto py-5">
            <button type="button" onClick={() => uploadRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-violet-400 hover:text-violet-700"><Upload className="h-6 w-6" /><span className="mt-3 text-xs font-semibold">点击选择本地图片</span></button>
            <input ref={uploadRef} type="file" multiple={multiple} accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,.gif,image/*" className="hidden" onChange={(event) => handleLocalUpload(event.target.files)} />
            <p className="mt-3 text-center text-xs leading-6 text-slate-400">支持 jpeg、png、webp、bmp、tiff、gif 格式，单张图片大小需小于 30MB。<br />请确保上传素材为原创内容或已取得合法授权。</p>
            {localItems.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{localItems.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 p-2"><img src={item.url} alt="" className="h-11 w-11 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.size}</p></div><button type="button" onClick={() => { setLocalItems((current) => current.filter((image) => image.id !== item.id)); setSelectedIds((current) => current.filter((id) => id !== item.id)); }} title="删除" className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}
          </div>}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-5 py-4"><div className="mr-auto min-w-0"><p className="text-xs text-slate-500">已选择 <b className="text-violet-700">{selectedIds.length}</b>{maxSelections !== undefined ? ` / ${selectionLimit}` : ""} 张图片</p>{selectionError && <p role="alert" className="mt-1 text-xs text-rose-600">{selectionError}</p>}</div><button type="button" onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">取消</button><button type="button" disabled={!selectedIds.length} onClick={() => onConfirm(selectedIds.flatMap(id => { const item = allItems.find(candidate => candidate.id === id); return item ? [item] : []; }))} className="rounded-md bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40">确认选择</button></div>
      </div>
    </OverlayPortal>
  );
}
