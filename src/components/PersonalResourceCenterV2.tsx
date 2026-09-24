import React, { useMemo, useState } from "react";
import { useTagCatalog, useScopedTaggedResources } from "../lib/useResourceTags";
import { useUploadedResources, resourceScope } from "../lib/resourceUploads";
import { resourceTagStore } from "../lib/resourceTags";
import OverlayPortal from "./overlays/OverlayPortal";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Edit3,
  Link2,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  Unlink,
  X
} from "lucide-react";
import { Asset } from "../types";
import AssetPagination from "./AssetPagination";
import ResourceLibraryItem, { ResourceLibraryItemData } from "./ResourceLibraryItem";

export const PERSONAL_TAGS_KEY = "cloud_video_personal_tags_v1";
export const PERSONAL_TAG_GROUPS_KEY = "cloud_video_personal_tag_groups_v1";
export const TASK_BINDINGS_KEY = "cloud_video_task_resource_bindings_v1";

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

const CURRENT_USER = "徐振";

type ResourceCategory = NonNullable<Asset["resourceCategory"]>;
type ResourceSource = NonNullable<Asset["source"]>;
type PersonalAsset = Asset & {
  resourceCategory: ResourceCategory;
  source: ResourceSource;
  publicTags: string[];
  sourceTaskId?: string;
};

interface PersonalTagItem {
  id: string;
  name: string;
  color: string;
  resourceIds: string[];
}

interface PersonalTagGroup {
  id: string;
  name: string;
  tagIds: string[];
}

interface PersonalResourceCenterProps {
  mode: "resources" | "personal_tags";
  assets: Asset[];
  onToast: (message: string) => void;
}

type AvailableTaskStatus = "in_progress" | "review" | "completed";

interface AvailableTask {
  id: string;
  title: string;
  publisher: string;
  deadline: string;
  required: number;
  submitted: number;
  status: AvailableTaskStatus;
}

const AVAILABLE_TASKS: AvailableTask[] = [
  { id: "06211055102", title: "防晒冰袖户外实测内容制作", publisher: "梁浩然", deadline: "2026-08-22", required: 4, submitted: 1, status: "in_progress" },
  { id: "06231146281", title: "七夕美妆礼盒短视频批量制作", publisher: "蔡卓良", deadline: "2026-08-28", required: 8, submitted: 5, status: "in_progress" },
  { id: "06231430099", title: "星光吊坠送礼情境短片", publisher: "孙剧本", deadline: "2026-08-25", required: 6, submitted: 0, status: "in_progress" },
  { id: "08201150318", title: "秋季风衣通勤场景三版混剪", publisher: "徐振", deadline: "2026-08-20", required: 5, submitted: 5, status: "review" },
  { id: "06061131660", title: "抗衰精华夜间修护口播", publisher: "蔡卓良", deadline: "2026-06-06", required: 5, submitted: 5, status: "completed" }
];

const TASK_STATUS_META: Record<AvailableTaskStatus, { label: string; className: string }> = {
  in_progress: { label: "进行中", className: "border-blue-200 bg-blue-50 text-blue-700" },
  review: { label: "待验收", className: "border-amber-200 bg-amber-50 text-amber-700" },
  completed: { label: "已完成", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
};

const DEFAULT_TASK_BINDINGS: TaskResourceBinding[] = [
  { id: "bind-example-current", taskId: "06231146281", resourceId: "a4", resourceName: "七夕美妆礼盒_送礼场景成片_V3.mp4", resourceType: "video", resourceUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4", boundAt: "2026/8/20 10:42:00", boundBy: CURRENT_USER },
  { id: "bind-example-locked", taskId: "06061131660", resourceId: "a4", resourceName: "七夕美妆礼盒_送礼场景成片_V3.mp4", resourceType: "video", resourceUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4", boundAt: "2026/8/20 10:45:00", boundBy: CURRENT_USER }
];

const TASK_UPLOAD_ASSETS: PersonalAsset[] = [
  {
    id: "task-upload-110321101",
    name: "抗衰精华夜间修护口播_V1.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80",
    size: "36.8 MB",
    createdAt: "2026-08-16 10:12",
    category: "美妆口播成片",
    resourceCategory: "成片",
    source: "task_collaboration",
    sourceTaskId: "06171146266",
    creator: CURRENT_USER,
    publicTags: ["美妆护肤", "抗衰", "夜间修护"],
    status: "已通过"
  },
  {
    id: "task-upload-110321102",
    name: "A醇精油质地特写_原始素材.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600&auto=format&fit=crop&q=80",
    size: "28.4 MB",
    createdAt: "2026-08-16 11:08",
    category: "商品特写",
    resourceCategory: "素材",
    source: "task_collaboration",
    sourceTaskId: "06171146266",
    creator: CURRENT_USER,
    publicTags: ["美妆护肤", "产品名称", "质地特写"],
    status: "未审核"
  },
  {
    id: "task-upload-110321103",
    name: "抗衰精华成分卖点口播稿.docx",
    type: "document",
    url: "data:text/plain;charset=utf-8,%E6%8A%97%E8%A1%B0%E7%B2%BE%E5%8D%8E%E6%88%90%E5%88%86%E5%8D%96%E7%82%B9%E5%8F%A3%E6%92%AD%E7%A8%BF",
    size: "72 KB",
    createdAt: "2026-08-16 13:26",
    category: "口播种草",
    resourceCategory: "脚本",
    source: "task_collaboration",
    sourceTaskId: "06171146266",
    creator: CURRENT_USER,
    publicTags: ["美妆护肤", "成分卖点", "口播"],
    status: "待审核"
  },
  {
    id: "task-upload-110321104",
    name: "夜间修护版温柔女声旁白.wav",
    type: "audio",
    url: "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3",
    size: "4.9 MB",
    createdAt: "2026-08-16 15:04",
    category: "AI配音",
    resourceCategory: "音频",
    source: "task_collaboration",
    sourceTaskId: "06171146266",
    creator: CURRENT_USER,
    publicTags: ["美妆护肤", "女声", "温柔"],
    status: "已通过"
  }
];

const RESOURCE_CATEGORIES: ResourceCategory[] = ["成片", "素材", "第三方", "图片", "音频", "脚本"];





const loadJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const loadTaskBindings = (): TaskResourceBinding[] => {
  const stored = loadJson<TaskResourceBinding[]>(TASK_BINDINGS_KEY, []);
  const seedKey = `${TASK_BINDINGS_KEY}_examples_v2`;
  if (window.localStorage.getItem(seedKey)) return stored;
  const merged = Array.from(new Map([...DEFAULT_TASK_BINDINGS, ...stored].map((binding) => [`${binding.taskId}-${binding.resourceId}`, binding])).values());
  window.localStorage.setItem(TASK_BINDINGS_KEY, JSON.stringify(merged));
  window.localStorage.setItem(seedKey, "1");
  return merged;
};

const inferResourceCategory = (asset: Asset): ResourceCategory => {
  if (asset.resourceCategory) return asset.resourceCategory;
  if (asset.type === "image") return "图片";
  if (asset.type === "audio") return "音频";
  if (asset.type === "document") return "脚本";
  if (asset.type === "template") return "素材";
  return asset.libraryType === "finished" || asset.category?.includes("成片") ? "成片" : "素材";
};

const normalizeAsset = (asset: Asset): PersonalAsset => ({
  ...asset,
  resourceCategory: inferResourceCategory(asset),
  source: asset.source || (asset.category?.includes("生成") ? "ai_generation" : "resource_library"),
  publicTags: asset.publicTags || asset.tags || []
});

export default function PersonalResourceCenterV2({ mode, assets, onToast }: PersonalResourceCenterProps) {
  const [search, setSearch] = useState("");
  const [resourceCategory, setResourceCategory] = useState<ResourceCategory>("成片");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [publicTagFilter, setPublicTagFilter] = useState("全部");
  const [sourceFilter, setSourceFilter] = useState<"全部" | ResourceSource>("全部");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [bindings, setBindings] = useState<TaskResourceBinding[]>(loadTaskBindings);
  const { personalTags: tags, personalTagGroups: tagGroups, revision: tagRevision } = useTagCatalog();

  const [selectedTagGroupId, setSelectedTagGroupId] = useState("personal-group-1");
  const [groupSearch, setGroupSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [tagSelectMode, setTagSelectMode] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [bindingAsset, setBindingAsset] = useState<PersonalAsset | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [boundTaskPage, setBoundTaskPage] = useState(1);
  const [linkableTaskPage, setLinkableTaskPage] = useState(1);
  const [taskPageSize, setTaskPageSize] = useState(20);

  const basePersonalAssets = useMemo(() => {
      const merged = [
        ...assets.filter((asset) => !asset.deletedAt && asset.creator === CURRENT_USER).map(normalizeAsset),
        ...TASK_UPLOAD_ASSETS
      ];
      return Array.from(new Map(merged.map((asset) => [asset.id, asset])).values());
    }, [assets]);
  const uploadedResources = useUploadedResources();
  const personalAssets = useScopedTaggedResources<PersonalAsset>(Array.from(new Map([...uploadedResources.filter((item) => item.creator === CURRENT_USER).map(normalizeAsset), ...basePersonalAssets].map((item) => [item.id, item])).values()), resourceScope);

  const categoryOptions = useMemo(() => Array.from(new Set(personalAssets.map((asset) => asset.category).filter(Boolean) as string[])).sort(), [personalAssets]);
  const publicTagOptions = useMemo(() => Array.from(new Set(personalAssets.flatMap((asset) => asset.publicTags))).sort(), [personalAssets]);
  const selectedTagGroup = tagGroups.find((group) => group.id === selectedTagGroupId) || tagGroups[0];
  const filteredTagGroups = tagGroups.filter((group) => group.name.toLowerCase().includes(groupSearch.trim().toLowerCase()));
  const visibleGroupTags = tags.filter((tagItem) =>
    selectedTagGroup?.tagIds.includes(tagItem.id) && tagItem.name.toLowerCase().includes(tagSearch.trim().toLowerCase())
  );

  const filteredAssets = useMemo(() => personalAssets
    .filter((asset) => {
      const query = search.trim().toLowerCase();
      const searchable = [asset.id, asset.name, asset.category, ...asset.publicTags].filter(Boolean).join(" ").toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (asset.resourceCategory !== resourceCategory) return false;
      if (categoryFilter !== "全部" && asset.category !== categoryFilter) return false;
      if (publicTagFilter !== "全部" && !asset.publicTags.includes(publicTagFilter)) return false;
      if (sourceFilter !== "全部" && asset.source !== sourceFilter) return false;
      const date = asset.createdAt.slice(0, 10);
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    })
    .sort((left, right) => {
      if (sortBy === "oldest") return left.createdAt.localeCompare(right.createdAt);
      if (sortBy === "name") return left.name.localeCompare(right.name, "zh-CN");
      return right.createdAt.localeCompare(left.createdAt);
    }), [categoryFilter, endDate, personalAssets, publicTagFilter, resourceCategory, search, sortBy, sourceFilter, startDate]);

  const visualAssets = filteredAssets.filter((asset) => ["成片", "素材", "第三方", "图片"].includes(asset.resourceCategory));
  const audioAssets = filteredAssets.filter((asset) => asset.resourceCategory === "音频");
  const scriptAssets = filteredAssets.filter((asset) => asset.resourceCategory === "脚本");

  const persistTags = resourceTagStore.setPersonalTags;

  const persistTagGroups = resourceTagStore.setPersonalGroups;

  const addTagGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    if (tagGroups.some((group) => group.name === name)) { onToast("已存在同名标签组"); return; }
    const group: PersonalTagGroup = { id: `ptg-${Date.now()}`, name, tagIds: [] };
    persistTagGroups([...tagGroups, group]);
    setSelectedTagGroupId(group.id);
    setNewGroupName("");
    onToast(`个人标签组“${name}”已创建`);
  };

  const saveTagGroupName = (groupId: string) => {
    const name = editingGroupName.trim();
    if (!name) return;
    if (tagGroups.some((group) => group.id !== groupId && group.name === name)) { onToast("已存在同名标签组"); return; }
    persistTagGroups(tagGroups.map((group) => group.id === groupId ? { ...group, name } : group));
    setEditingGroupId(null);
    onToast("标签组名称已更新");
  };

  const deleteTagGroup = (group: PersonalTagGroup) => {
    if (!window.confirm(`删除标签组“${group.name}”及组内二级标签？已标记资源不会被删除。`)) return;
    persistTags(tags.filter((tagItem) => !group.tagIds.includes(tagItem.id)));
    const next = tagGroups.filter((item) => item.id !== group.id);
    persistTagGroups(next);
    setSelectedTagGroupId(next[0]?.id || "");
    setSelectedTagIds([]);
    onToast(`标签组“${group.name}”已删除`);
  };

  const addTagToCurrentGroup = () => {
    const name = newTagName.trim();
    if (!name || !selectedTagGroup) return;
    if (tags.some((tag) => selectedTagGroup.tagIds.includes(tag.id) && tag.id !== editingTagId && tag.name === name)) { onToast("同一标签组内不能添加同名二级标签"); return; }
    if (editingTagId) {
      persistTags(tags.map((tag) => tag.id === editingTagId ? { ...tag, name } : tag));
      setShowAddTagModal(false); setEditingTagId(null); setNewTagName("");
      onToast("个人二级标签已更新，关联资源同步生效"); return;
    }
    const tagItem: PersonalTagItem = {
      id: `pt-${Date.now()}`,
      name,
      color: ["#7c3aed", "#0284c7", "#059669", "#e11d48", "#d97706"][tags.length % 5],
      resourceIds: []
    };
    persistTags([...tags, tagItem]);
    persistTagGroups(tagGroups.map((group) => group.id === selectedTagGroup.id ? { ...group, tagIds: [...group.tagIds, tagItem.id] } : group));
    setNewTagName("");
    setShowAddTagModal(false);
    onToast(`个人标签“${name}”已新增`);
  };

  const removePersonalTags = (tagIds: string[]) => {
    if (tagIds.length === 0) return;
    persistTags(tags.filter((tagItem) => !tagIds.includes(tagItem.id)));
    persistTagGroups(tagGroups.map((group) => ({ ...group, tagIds: group.tagIds.filter((id) => !tagIds.includes(id)) })));
    setSelectedTagIds([]);
    onToast(`已删除 ${tagIds.length} 个个人标签，资源本身未受影响`);
  };

  const resetFilters = () => {
    setSearch("");
    setResourceCategory("成片");
    setCategoryFilter("全部");
    setPublicTagFilter("全部");
    setSourceFilter("全部");
    setStartDate("");
    setEndDate("");
    setSortBy("newest");
  };

  const persistBindings = (next: TaskResourceBinding[]) => {
    setBindings(next);
    window.localStorage.setItem(TASK_BINDINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("task-resource-bindings-changed"));
  };

  const confirmBinding = () => {
    if (!bindingAsset || selectedTaskIds.length === 0) return;
    const additions: TaskResourceBinding[] = selectedTaskIds
      .filter((taskId) => !bindings.some((item) => item.taskId === taskId && item.resourceId === bindingAsset.id))
      .map((taskId) => ({
        id: `bind-${Date.now()}-${taskId}`,
        taskId,
        resourceId: bindingAsset.id,
        resourceName: bindingAsset.name,
        resourceType: bindingAsset.type,
        resourceUrl: bindingAsset.url,
        boundAt: new Date().toLocaleString("zh-CN", { hour12: false }),
        boundBy: CURRENT_USER
      }));
    const next = [...bindings, ...additions];
    persistBindings(next);
    onToast(additions.length > 0 ? `已将资源绑定到 ${additions.length} 个任务` : "所选任务已绑定该资源，不重复计数");
    setSelectedTaskIds([]);
  };

  const unbindTask = (task: AvailableTask) => {
    if (!bindingAsset || task.status === "completed") return;
    persistBindings(bindings.filter((binding) => !(binding.resourceId === bindingAsset.id && binding.taskId === task.id)));
    onToast(`已解除与任务“${task.title}”的关联`);
  };

  const toResourceItem = (asset: PersonalAsset): ResourceLibraryItemData => ({
    id: asset.id,
    numericId: asset.id,
    type: asset.resourceCategory,
    title: asset.name,
    coverUrl: asset.coverUrl || (asset.type === "image" ? asset.url : undefined),
    status: asset.status,
    author: asset.creator || CURRENT_USER,
    time: asset.createdAt.slice(0, 10),
    category: asset.category,
    subtitle: asset.publicTags.slice(0, 2).join(" / "),
    downloads: 0,
    filesCount: 1,
    size: asset.size,
    content: asset.resourceCategory === "脚本" ? `${asset.category || "任务脚本"}，用于电商短视频内容制作。` : undefined,
    scenesCount: asset.resourceCategory === "脚本" ? 6 : undefined
  });

  const bindingButton = (asset: PersonalAsset) => {
    const bindingCount = new Set(bindings.filter((binding) => binding.resourceId === asset.id).map((binding) => binding.taskId)).size;
    return (
      <button
        type="button"
        onClick={() => { setBindingAsset(asset); setSelectedTaskIds([]); }}
        className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-purple-600 px-2 text-[11px] font-bold text-white transition-colors hover:bg-purple-700"
      >
        <Link2 className="h-3.5 w-3.5" />
        绑定任务{bindingCount > 0 ? `（${bindingCount}）` : ""}
      </button>
    );
  };

  const currentBindingRows = bindingAsset
    ? bindings.filter((binding) => binding.resourceId === bindingAsset.id).map((binding) => ({
      binding,
      task: AVAILABLE_TASKS.find((task) => task.id === binding.taskId) || {
        id: binding.taskId,
        title: `协作任务 ${binding.taskId}`,
        publisher: "平台成员",
        deadline: "--",
        required: 1,
        submitted: 1,
        status: "in_progress" as const
      }
    }))
    : [];
  const currentBoundTaskIds = new Set(currentBindingRows.map(({ task }) => task.id));
  const linkableTasks = AVAILABLE_TASKS.filter((task) => task.status !== "completed" && !currentBoundTaskIds.has(task.id));
  const currentBoundTaskPage = Math.min(boundTaskPage, Math.max(1, Math.ceil(currentBindingRows.length / taskPageSize)));
  const currentLinkableTaskPage = Math.min(linkableTaskPage, Math.max(1, Math.ceil(linkableTasks.length / taskPageSize)));
  const pagedCurrentBindingRows = currentBindingRows.slice((currentBoundTaskPage - 1) * taskPageSize, currentBoundTaskPage * taskPageSize);
  const pagedLinkableTasks = linkableTasks.slice((currentLinkableTaskPage - 1) * taskPageSize, currentLinkableTaskPage * taskPageSize);

  if (mode === "personal_tags") {
    return (
      <div className="flex min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs" style={{ height: "calc(100vh - 160px)" }}>
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white xl:w-80">
          <div className="space-y-3 border-b border-slate-200 p-4">
            <div className="flex gap-2">
              <input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTagGroup(); }} placeholder="请输入标签组名称" className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-violet-400" />
              <button type="button" onClick={addTagGroup} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700">添加</button>
            </div>
            <div className="relative"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={groupSearch} onChange={(event) => setGroupSearch(event.target.value)} placeholder="筛选已有标签组" className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-violet-400" /></div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filteredTagGroups.map((group) => {
              const groupTags = tags.filter((tagItem) => group.tagIds.includes(tagItem.id));
              const markedResources = new Set(groupTags.flatMap((tagItem) => tagItem.resourceIds)).size;
              const active = selectedTagGroup?.id === group.id;
              return <div key={group.id} onClick={() => { setSelectedTagGroupId(group.id); setTagSearch(""); setSelectedTagIds([]); }} className={`group flex min-h-16 cursor-pointer items-center gap-2 border-l-4 px-4 py-3 transition-colors ${active ? "border-violet-600 bg-violet-50/70" : "border-transparent hover:bg-slate-50"}`}>
                <div className="min-w-0 flex-1">
                  {editingGroupId === group.id ? <input autoFocus value={editingGroupName} onClick={(event) => event.stopPropagation()} onChange={(event) => setEditingGroupName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveTagGroupName(group.id); }} className="w-full rounded border border-violet-300 bg-white px-2 py-1 text-xs font-semibold outline-none" /> : <div className="flex items-center gap-1.5"><span className={`truncate text-xs font-bold ${active ? "text-violet-700" : "text-slate-800"}`}>{group.name} ({groupTags.length})</span><span className="text-[10px] text-slate-400">{markedResources} 个资源</span></div>}
                  <div className="mt-1.5 flex gap-1">{[["成", "bg-violet-500"], ["素", "bg-cyan-500"], ["图", "bg-emerald-500"], ["音", "bg-amber-500"], ["脚", "bg-blue-500"]].map(([label, color]) => <span key={label} className={`flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold text-white ${color}`}>{label}</span>)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {editingGroupId === group.id ? <><button type="button" title="保存" onClick={(event) => { event.stopPropagation(); saveTagGroupName(group.id); }} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button><button type="button" title="取消" onClick={(event) => { event.stopPropagation(); setEditingGroupId(null); }} className="rounded p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></> : <button type="button" title="修改标签组" onClick={(event) => { event.stopPropagation(); setEditingGroupId(group.id); setEditingGroupName(group.name); }} className="rounded p-1.5 text-violet-500 hover:bg-violet-100"><Edit3 className="h-4 w-4" /></button>}
                  <button type="button" title="删除标签组" onClick={(event) => { event.stopPropagation(); deleteTagGroup(group); }} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>;
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={!selectedTagGroup} onClick={() => { setEditingTagId(null); setNewTagName(""); setShowAddTagModal(true); }} className="flex items-center gap-1 rounded-md bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-40"><Plus className="h-3.5 w-3.5" />新增</button>
              <button type="button" onClick={() => { setTagSelectMode(!tagSelectMode); setSelectedTagIds([]); }} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{tagSelectMode ? "取消选择" : "选择"}</button>
              <label className="flex cursor-pointer items-center gap-2 px-1 text-xs font-semibold text-slate-600"><input type="checkbox" disabled={!tagSelectMode || visibleGroupTags.length === 0} checked={tagSelectMode && visibleGroupTags.length > 0 && visibleGroupTags.every((tagItem) => selectedTagIds.includes(tagItem.id))} onChange={(event) => setSelectedTagIds(event.target.checked ? visibleGroupTags.map((tagItem) => tagItem.id) : [])} />选中本页</label>
              <button type="button" disabled={!selectedTagGroup} onClick={() => { if (selectedTagGroup) { setEditingGroupId(selectedTagGroup.id); setEditingGroupName(selectedTagGroup.name); } }} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">修改标签组</button>
              {selectedTagIds.length > 0 && <button type="button" onClick={() => { if (window.confirm(`删除选中的 ${selectedTagIds.length} 个个人二级标签？`)) removePersonalTags(selectedTagIds); }} className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">批量删除 ({selectedTagIds.length})</button>}
            </div>
            <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={tagSearch} onChange={(event) => setTagSearch(event.target.value)} placeholder="请输入二级标签名称进行搜索" className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-violet-400" /></div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-xs"><strong className="text-slate-900">{selectedTagGroup?.name || "暂无标签组"}</strong><span className="text-slate-400">共 {visibleGroupTags.length} 个二级标签</span></div>
          <div className="flex flex-1 content-start flex-wrap gap-3 overflow-y-auto p-5">
            {visibleGroupTags.map((tagItem) => {
              const selected = selectedTagIds.includes(tagItem.id);
              return <div key={tagItem.id} onClick={() => { if (tagSelectMode) setSelectedTagIds((prev) => selected ? prev.filter((id) => id !== tagItem.id) : [...prev, tagItem.id]); }} className={`flex h-11 min-w-36 items-center justify-between gap-3 rounded-md border px-4 text-xs font-semibold transition-colors ${selected ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300"}`}>
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tagItem.color }} />{tagItem.name}<span className="font-normal text-slate-400">{tagItem.resourceIds.length}</span></span>
                {!tagSelectMode && <button type="button" title={`编辑个人二级标签 ${tagItem.name}`} onClick={() => { setEditingTagId(tagItem.id); setNewTagName(tagItem.name); setShowAddTagModal(true); }} className="rounded p-1 text-slate-400 hover:text-violet-600"><Edit3 className="h-3.5 w-3.5" /></button>}
                {tagSelectMode ? <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>{selected && <Check className="h-3 w-3" />}</span> : <span title="删除二级标签" onClick={(event) => { event.stopPropagation(); if (window.confirm(`删除个人二级标签“${tagItem.name}”？`)) removePersonalTags([tagItem.id]); }} className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-rose-500"><X className="h-3.5 w-3.5" /></span>}
              </div>;
            })}
            {selectedTagGroup && visibleGroupTags.length === 0 && <div className="flex w-full flex-col items-center justify-center py-20 text-xs text-slate-400"><Tag className="mb-2 h-8 w-8 text-slate-300" />暂无符合条件的个人二级标签</div>}
          </div>
        </section>

        {showAddTagModal && <OverlayPortal className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-sm rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900">{editingTagId ? "编辑个人二级标签" : "新增个人二级标签"}</h3><p className="mt-1 text-xs text-slate-500">添加到“{selectedTagGroup?.name}”</p></div><button type="button" title="关闭" onClick={() => setShowAddTagModal(false)}><X className="h-5 w-5 text-slate-400" /></button></div><div className="p-5"><label className="text-xs font-semibold text-slate-600">二级标签名称</label><input autoFocus value={newTagName} onChange={(event) => setNewTagName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTagToCurrentGroup(); }} placeholder="请输入二级标签名称" className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400" /></div><div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setShowAddTagModal(false)} className="rounded-md border border-slate-200 px-4 py-2 text-xs text-slate-600">取消</button><button type="button" onClick={addTagToCurrentGroup} className="rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white">{editingTagId ? "保存" : "确认新增"}</button></div></div></OverlayPortal>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs" aria-label="资源筛选">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索资源名称、ID、分类或标签" className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400" />
            </div>
            <div className="flex overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              {RESOURCE_CATEGORIES.map((item) => <button type="button" key={item} onClick={() => setResourceCategory(item)} className={`min-w-12 px-3 py-2 text-xs font-semibold transition-colors ${resourceCategory === item ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}>{item}</button>)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center gap-2"><span className="w-14 shrink-0 text-[11px] font-semibold text-slate-500">分类标签</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-violet-400"><option value="全部">全部分类</option>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="flex items-center gap-2"><span className="w-14 shrink-0 text-[11px] font-semibold text-slate-500">公共标签</span><select value={publicTagFilter} onChange={(event) => setPublicTagFilter(event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-violet-400"><option value="全部">全部二级标签</option>{publicTagOptions.map((tagName) => <option key={tagName} value={tagName}>{tagName}</option>)}</select></label>
            <label className="flex items-center gap-2"><span className="w-14 shrink-0 text-[11px] font-semibold text-slate-500">资源来源</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as "全部" | ResourceSource)} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-violet-400"><option value="全部">全部来源</option><option value="resource_library">资源库上传</option><option value="task_collaboration">任务协作上传</option><option value="ai_generation">AI 生成</option></select></label>
            <label className="flex items-center gap-2"><span className="w-14 shrink-0 text-[11px] font-semibold text-slate-500">排序方式</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-violet-400"><option value="newest">最新上传</option><option value="oldest">最早上传</option><option value="name">名称排序</option></select></label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" /><span className="font-semibold">上传时间</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-md border border-slate-200 px-2.5 py-1.5 outline-none focus:border-violet-400" />
              <span className="text-slate-300">至</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-md border border-slate-200 px-2.5 py-1.5 outline-none focus:border-violet-400" />
            </div>
            <div className="flex items-center gap-3"><span className="text-xs text-slate-400">共 {filteredAssets.length} 条</span><button type="button" onClick={resetFilters} className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />重置</button></div>
          </div>
        </div>
      </section>

      {filteredAssets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
          <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-500">暂无符合条件的资源</p><button type="button" onClick={resetFilters} className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700">清除筛选条件</button>
        </div>
      ) : (
        <div className="space-y-5">
          {visualAssets.length > 0 && <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{visualAssets.map((asset) => <ResourceLibraryItem key={asset.id} item={toResourceItem(asset)} onOpen={() => onToast(`正在查看《${asset.name}》`)} footerAction={mode === "resources" ? bindingButton(asset) : undefined} />)}</div>}
          {audioAssets.length > 0 && <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{audioAssets.map((asset) => <ResourceLibraryItem key={asset.id} item={toResourceItem(asset)} onOpen={() => onToast(`正在查看《${asset.name}》`)} footerAction={mode === "resources" ? bindingButton(asset) : undefined} />)}</div>}
          {scriptAssets.length > 0 && <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs"><div className="min-w-[860px]"><div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(240px,2fr)_100px_150px_90px] gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-bold text-slate-500"><span>脚本</span><span>脚本内容</span><span>状态</span><span>分类/标签</span><span className="text-right">绑定任务</span></div>{scriptAssets.map((asset) => <ResourceLibraryItem key={asset.id} item={toResourceItem(asset)} onOpen={() => onToast(`正在查看《${asset.name}》`)} footerAction={mode === "resources" ? bindingButton(asset) : undefined} />)}</div></div>}
        </div>
      )}

      {bindingAsset && (
        <OverlayPortal className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0"><h3 className="text-sm font-bold text-slate-900">任务关联</h3><p className="mt-1 truncate text-xs text-slate-500">{bindingAsset.name}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">{bindingAsset.resourceCategory}</span><span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">{bindingAsset.category || "未分类"}</span><span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">{bindingAsset.status || "待审核"}</span></div></div>
              <button type="button" title="关闭" onClick={() => setBindingAsset(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="overflow-y-auto p-5">
              <section>
                <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-bold text-slate-800">当前已绑定任务（{currentBindingRows.length}）</h4><span className="text-[10px] text-slate-400">已完成任务保留历史关联</span></div>
                {currentBindingRows.length > 0 ? <><div className="space-y-2">{pagedCurrentBindingRows.map(({ binding, task }) => { const statusMeta = TASK_STATUS_META[task.status]; return <div key={binding.id} className="rounded-md border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-bold text-slate-800">{task.title}</p><span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}>{statusMeta.label}</span></div><p className="mt-1 text-[10px] text-slate-500">任务 {task.id} · 发布人 {task.publisher} · 提交进度 {task.submitted}/{task.required}</p><p className="mt-1 text-[10px] text-slate-400">绑定时间 {binding.boundAt}</p></div>{task.status === "completed" ? <span className="flex shrink-0 items-center gap-1 rounded bg-slate-100 px-2 py-1.5 text-[10px] font-semibold text-slate-500" title="任务完成后保留历史快照，不可解除关联"><LockKeyhole className="h-3 w-3" />不可解除</span> : <button type="button" onClick={() => unbindTask(task)} className="flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"><Unlink className="h-3 w-3" />解除关联</button>}</div></div>; })}</div><AssetPagination total={currentBindingRows.length} page={currentBoundTaskPage} pageSize={taskPageSize} onPageChange={setBoundTaskPage} onPageSizeChange={(value) => { setTaskPageSize(value); setBoundTaskPage(1); setLinkableTaskPage(1); }} /></> : <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/60 py-7 text-center text-xs text-slate-400">该资源暂未绑定任务</div>}
              </section>

              <section className="mt-5 border-t border-slate-100 pt-5">
                <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-bold text-slate-800">可关联任务</h4><span className="text-[10px] text-slate-400">同一资源可关联多个未完成任务</span></div>
                {linkableTasks.length > 0 ? <><div className="space-y-2">{pagedLinkableTasks.map((task) => { const statusMeta = TASK_STATUS_META[task.status]; const selected = selectedTaskIds.includes(task.id); return <label key={task.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${selected ? "border-purple-400 bg-purple-50/50" : "border-slate-200 hover:bg-slate-50"}`}><input type="checkbox" checked={selected} onChange={() => setSelectedTaskIds((prev) => prev.includes(task.id) ? prev.filter((id) => id !== task.id) : [...prev, task.id])} className="mt-0.5 accent-purple-600" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-semibold text-slate-800">{task.title}</p><span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}>{statusMeta.label}</span></div><p className="mt-1 text-[10px] text-slate-500">任务 {task.id} · 发布人 {task.publisher} · 提交进度 {task.submitted}/{task.required} · 截止 {task.deadline}</p></div></label>; })}</div><AssetPagination total={linkableTasks.length} page={currentLinkableTaskPage} pageSize={taskPageSize} onPageChange={setLinkableTaskPage} onPageSizeChange={(value) => { setTaskPageSize(value); setBoundTaskPage(1); setLinkableTaskPage(1); }} /></> : <div className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-50 py-5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />暂无其他可关联任务</div>}
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4"><p className="text-[10px] text-slate-400">绑定后将计入对应任务的已提交文件数量</p><div className="flex gap-2"><button type="button" onClick={() => setBindingAsset(null)} className="rounded-md border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">关闭</button><button type="button" disabled={selectedTaskIds.length === 0} onClick={confirmBinding} className="rounded-md bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40">关联所选任务（{selectedTaskIds.length}）</button></div></div>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
