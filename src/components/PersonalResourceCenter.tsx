import React, { useMemo, useState } from "react";
import { recordDownload } from "../lib/operationHistory";
import { Bookmark, Check, Download, Edit3, File, Image, Link2, Plus, Search, Tag, Trash2, Video, X } from "lucide-react";
import { Asset } from "../types";

export const FAVORITES_KEY = "cloud_video_personal_favorites_v1";
export const PERSONAL_TAGS_KEY = "cloud_video_personal_tags_v1";
export const TASK_BINDINGS_KEY = "cloud_video_task_resource_bindings_v1";

interface PersonalTagItem {
  id: string;
  name: string;
  color: string;
  resourceIds: string[];
}

export interface TaskResourceBinding {
  id: string;
  taskId: string;
  resourceId: string;
  resourceName: string;
  resourceType: Asset["type"];
  resourceUrl?: string;
  boundAt: string;
  boundBy: string;
}

interface PersonalResourceCenterProps {
  mode: "resources" | "favorites" | "personal_tags";
  assets: Asset[];
  onToast: (message: string) => void;
}

const AVAILABLE_TASKS = [
  { id: "06211055102", title: "防晒冰袖户外实测内容制作", publisher: "梁浩然", deadline: "2026-06-22", required: 4 },
  { id: "06231146281", title: "七夕美妆礼盒短视频批量制作", publisher: "蔡卓良", deadline: "2026-08-28", required: 8 },
  { id: "06231430099", title: "星光吊坠送礼情境短片", publisher: "孙剧本", deadline: "2026-06-25", required: 6 }
];

const loadJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

export default function PersonalResourceCenter({ mode, assets, onToast }: PersonalResourceCenterProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | Asset["type"]>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadJson(FAVORITES_KEY, ["a1"]));
  const [tags, setTags] = useState<PersonalTagItem[]>(() => loadJson(PERSONAL_TAGS_KEY, [
    { id: "pt-1", name: "本周主推", color: "#7c3aed", resourceIds: ["a1"] },
    { id: "pt-2", name: "待二创", color: "#0284c7", resourceIds: ["a3"] },
    { id: "pt-3", name: "高转化备选", color: "#059669", resourceIds: [] }
  ]));
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [bindingAsset, setBindingAsset] = useState<Asset | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taggingAsset, setTaggingAsset] = useState<Asset | null>(null);

  const personalAssets = useMemo(() => assets.filter((asset) => !asset.deletedAt && (asset.creator === "徐振" || asset.category === "我的素材" || !asset.creator)), [assets]);
  const filteredAssets = personalAssets.filter((asset) => {
    const matchesMode = mode !== "favorites" || favoriteIds.includes(asset.id);
    const matchesType = type === "all" || asset.type === type;
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase());
    return matchesMode && matchesType && matchesSearch;
  });

  const persistFavorites = (next: string[]) => {
    setFavoriteIds(next);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const persistTags = (next: PersonalTagItem[]) => {
    setTags(next);
    window.localStorage.setItem(PERSONAL_TAGS_KEY, JSON.stringify(next));
  };

  const toggleFavorite = (asset: Asset) => {
    const next = favoriteIds.includes(asset.id) ? favoriteIds.filter((id) => id !== asset.id) : [...favoriteIds, asset.id];
    persistFavorites(next);
    onToast(next.includes(asset.id) ? `已收藏《${asset.name}》` : `已取消收藏《${asset.name}》`);
  };

  const copyDetailLink = async (asset: Asset) => {
    const link = `${window.location.origin}/#/resources/${asset.id}`;
    await navigator.clipboard?.writeText(link);
    onToast("详情链接已复制，访问时将按查看者登录状态与资源权限显示");
  };

  const downloadAsset = (asset: Asset) => {
    const link = document.createElement("a");
    link.href = asset.url;
    link.download = asset.name;
    recordDownload(asset.name, asset.resourceCategory || "资源库文件");
    link.target = "_blank";
    link.click();
    onToast(`已开始下载《${asset.name}》`);
  };

  const confirmBinding = () => {
    if (!bindingAsset || selectedTaskIds.length === 0) return;
    const existing = loadJson<TaskResourceBinding[]>(TASK_BINDINGS_KEY, []);
    const additions = selectedTaskIds
      .filter((taskId) => !existing.some((item) => item.taskId === taskId && item.resourceId === bindingAsset.id))
      .map((taskId) => ({
        id: `bind-${Date.now()}-${taskId}`,
        taskId,
        resourceId: bindingAsset.id,
        resourceName: bindingAsset.name,
        resourceType: bindingAsset.type,
        resourceUrl: bindingAsset.url,
        boundAt: new Date().toLocaleString("zh-CN", { hour12: false }),
        boundBy: "徐振"
      }));
    window.localStorage.setItem(TASK_BINDINGS_KEY, JSON.stringify([...existing, ...additions]));
    window.dispatchEvent(new CustomEvent("task-resource-bindings-changed"));
    onToast(additions.length > 0 ? `已将该资源绑定到 ${additions.length} 个任务，每个任务分别计数 1 个` : "所选任务已绑定该资源，不重复计数");
    setBindingAsset(null);
    setSelectedTaskIds([]);
  };

  if (mode === "personal_tags") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div><h2 className="text-base font-bold text-slate-900">个人标签管理</h2><p className="mt-1 text-xs text-slate-500">仅自己可见，用于整理个人上传或生成的资源</p></div>
          <div className="flex items-center gap-2">
            <input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="输入标签名称" className="w-44 rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-violet-400" />
            <button onClick={() => { const name = newTagName.trim(); if (!name) return; persistTags([...tags, { id: `pt-${Date.now()}`, name, color: ["#7c3aed", "#0284c7", "#059669", "#e11d48"][tags.length % 4], resourceIds: [] }]); setNewTagName(""); onToast("个人标签已创建"); }} className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />新建标签</button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">标签名称</th><th className="px-4 py-3">已标记资源</th><th className="px-4 py-3">创建人</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {tags.map((tag) => <tr key={tag.id}>
                <td className="px-4 py-3">{editingTagId === tag.id ? <input autoFocus value={editingTagName} onChange={(event) => setEditingTagName(event.target.value)} className="rounded border border-violet-300 px-2 py-1 outline-none" /> : <span className="flex items-center gap-2 font-semibold text-slate-800"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tag.color }} />{tag.name}</span>}</td>
                <td className="px-4 py-3 text-slate-500">{tag.resourceIds.length} 个</td><td className="px-4 py-3 text-slate-500">徐振（个人）</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">{editingTagId === tag.id ? <button title="保存" onClick={() => { const value = editingTagName.trim(); if (value) persistTags(tags.map((item) => item.id === tag.id ? { ...item, name: value } : item)); setEditingTagId(null); }} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button> : <button title="编辑" onClick={() => { setEditingTagId(tag.id); setEditingTagName(tag.name); }} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Edit3 className="h-4 w-4" /></button>}<button title="删除" onClick={() => { if (window.confirm(`删除个人标签“${tag.name}”？资源本身不会被删除。`)) persistTags(tags.filter((item) => item.id !== tag.id)); }} className="rounded p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div><h2 className="text-base font-bold text-slate-900">{mode === "favorites" ? "我的收藏" : "我的资源"}</h2><p className="mt-1 text-xs text-slate-500">{mode === "favorites" ? "收藏内容与资源库保持同步" : "当前用户上传或 AI 生成的全部资源"}</p></div>
        <div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索资源" className="w-48 rounded-md border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-violet-400" /></div><select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600"><option value="all">全部类型</option><option value="video">视频</option><option value="image">图片</option><option value="audio">音频</option><option value="document">文档</option></select></div>
      </div>
      {filteredAssets.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center text-xs text-slate-400">暂无符合条件的资源</div> : <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{filteredAssets.map((asset) => {
        const Icon = asset.type === "video" ? Video : asset.type === "image" ? Image : File;
        const assetTags = tags.filter((tag) => tag.resourceIds.includes(asset.id));
        return <article key={asset.id} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">{asset.type === "image" ? <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" /> : <Icon className="h-7 w-7 text-slate-400" />}</div>
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{asset.name}</p><p className="mt-1 text-[10px] text-slate-400">{asset.createdAt} · {asset.size} · {asset.creator || "徐振"}</p></div><button title={favoriteIds.includes(asset.id) ? "取消收藏" : "收藏"} onClick={() => toggleFavorite(asset)} className={`rounded p-1.5 ${favoriteIds.includes(asset.id) ? "bg-amber-50 text-amber-600" : "text-slate-400 hover:bg-slate-100"}`}><Bookmark className="h-4 w-4" fill={favoriteIds.includes(asset.id) ? "currentColor" : "none"} /></button></div>
          <div className="mt-2 flex min-h-5 flex-wrap gap-1">{assetTags.map((tag) => <span key={tag.id} className="rounded px-1.5 py-0.5 text-[10px] text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>)}</div>
          <div className="mt-2 flex flex-wrap gap-1.5"><button onClick={() => downloadAsset(asset)} className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600"><Download className="h-3 w-3" />下载</button><button onClick={() => copyDetailLink(asset)} className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600"><Link2 className="h-3 w-3" />分享</button><button onClick={() => setTaggingAsset(asset)} className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600"><Tag className="h-3 w-3" />标签</button><button onClick={() => { setBindingAsset(asset); setSelectedTaskIds([]); }} className="flex items-center gap-1 rounded bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white"><Plus className="h-3 w-3" />绑定任务</button></div></div>
        </article>;
      })}</div>}

      {bindingAsset && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-lg rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900">绑定到任务</h3><p className="mt-1 max-w-sm truncate text-xs text-slate-500">{bindingAsset.name}</p></div><button onClick={() => setBindingAsset(null)}><X className="h-5 w-5 text-slate-400" /></button></div><div className="p-5"><div className="mb-3 rounded bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">任意状态的已上传资源均可计数。同一资源可绑定多个任务，但在同一任务中只计数一次；数量达标后由发布人确认完成。</div><div className="space-y-2">{AVAILABLE_TASKS.map((task) => <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded border border-slate-200 p-3 hover:bg-slate-50"><input type="checkbox" checked={selectedTaskIds.includes(task.id)} onChange={() => setSelectedTaskIds((prev) => prev.includes(task.id) ? prev.filter((id) => id !== task.id) : [...prev, task.id])} className="mt-1" /><div className="flex-1"><p className="text-xs font-semibold text-slate-800">{task.title}</p><p className="mt-1 text-[10px] text-slate-500">任务 {task.id} · 发布人 {task.publisher} · 需提交 {task.required} 个 · 截止 {task.deadline}</p></div></label>)}</div></div><div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button onClick={() => setBindingAsset(null)} className="rounded border border-slate-200 px-4 py-2 text-xs text-slate-600">取消</button><button disabled={selectedTaskIds.length === 0} onClick={confirmBinding} className="rounded bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">确认绑定（{selectedTaskIds.length}）</button></div></div></div>}

      {taggingAsset && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">设置个人标签</h3><button onClick={() => setTaggingAsset(null)}><X className="h-5 w-5 text-slate-400" /></button></div><p className="mt-1 truncate text-xs text-slate-500">{taggingAsset.name}</p><div className="mt-4 space-y-2">{tags.map((tag) => { const checked = tag.resourceIds.includes(taggingAsset.id); return <label key={tag.id} className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 p-2.5 text-xs"><input type="checkbox" checked={checked} onChange={() => persistTags(tags.map((item) => item.id === tag.id ? { ...item, resourceIds: checked ? item.resourceIds.filter((id) => id !== taggingAsset.id) : [...item.resourceIds, taggingAsset.id] } : item))} /><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tag.color }} />{tag.name}</label>; })}</div><button onClick={() => setTaggingAsset(null)} className="mt-4 w-full rounded bg-slate-900 py-2 text-xs font-semibold text-white">完成</button></div></div>}
    </div>
  );
}
