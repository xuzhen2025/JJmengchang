import React, { useState, useEffect } from "react";
import { useTaggedResources, useTagCatalog } from "../lib/useResourceTags";
import { resourceTagStore } from "../lib/resourceTags";
import { resourceConfigStore } from "../lib/resourceConfig";
import { useResourceConfig, useConfigFilter } from "../lib/useResourceConfig";
import { useUploadedResources, uploadedAudio } from "../lib/resourceUploads";
import { PublicTagFilter, PersonalTagFilter } from "./PublicTagFilter";
import {
  RESOURCE_FILTER_LABEL_CLASS,
  RESOURCE_FILTER_PANEL_CLASS,
  RESOURCE_FILTER_PRESET_ROW_CLASS,
  RESOURCE_FILTER_TAG_ROW_CLASS,
  ResourceCategoryFilters,
  ResourceStatusFilter,
  ResourceStatusBadge,
} from "./ResourceConfigControls";
import AudioDetailView from "./AudioDetailView";
import { Pagination } from "./Pagination";
import { ResourceSearchIntent } from "../types";
import ResourceSearchCondition from "./ResourceSearchCondition";
import ResourceFilterPresets from "./ResourceFilterPresets";
import { AUDIO_PRESET_DEFAULTS } from "../lib/resourceFilterPresets";
import ResourceActionMenu from "./ResourceActionMenu";
import ResourceTagModal from "./ResourceTagModal";
import OverlayPortal from "./overlays/OverlayPortal";
import { appendTags } from "../lib/resourceBatch";
import { useResourceEdits } from "../lib/useResourceEdits";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Download,
  Edit2,
  Edit3,
  Copy,
  Plus,
  Check,
  Trash2,
  ListOrdered,
  Paperclip,
  Folder,
  Eye,
  X,
  LayoutGrid,
  List,
  ExternalLink,
  Tag,
  Share2,
  ArrowUpDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  MoreHorizontal,
  Send,
  MessageSquare,
  BarChart2,
  Archive,
  Layers,
  CheckSquare,
  Square,
  User
} from "lucide-react";





export interface AudioItem {
  id: string;
  title: string;
  subtitle: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "00:52"
  badge: string;
  downloads: number;
  author: string;
  time: string;
  primaryCategory: string;
  secondaryCategory: string;
  publicTags: string[];
  personalTag: string;
  personalTags?: string[];
  size: string;
}

interface AudioManagementViewProps {
  onTriggerTask?: (type: any, name: string, inputFiles: string[], cost: number) => void;
  onDetailStateChange?: (isDetail: boolean) => void;
  initialSearch?: ResourceSearchIntent | null;
  onClearSearch?: () => void;
}

export const INITIAL_AUDIO_LIST: AudioItem[] = [
  {
    id: "aud-1",
    title: "现在洁牙",
    subtitle: "医院",
    duration: 52,
    durationFormatted: "00:52",
    badge: "音频",
    downloads: 1,
    author: "月儿弯弯",
    time: "25 天前",
    primaryCategory: "美容美体",
    secondaryCategory: "医疗机构",
    publicTags: ["商品旁白","自然男声"],
    personalTag: "口播专项",
    size: "1.2 MB"
  },
  {
    id: "aud-2",
    title: "危害",
    subtitle: "王五",
    duration: 62,
    durationFormatted: "01:02",
    badge: "音频",
    downloads: 1,
    author: "月儿弯弯",
    time: "25 天前",
    primaryCategory: "美容美体",
    secondaryCategory: "警示解说",
    publicTags: ["痛点解说","自然男声"],
    personalTag: "无个人标签",
    size: "1.4 MB"
  },
  {
    id: "aud-3",
    title: "洗牙4.7",
    subtitle: "王五",
    duration: 12,
    durationFormatted: "00:12",
    badge: "音频",
    downloads: 0,
    author: "月儿弯弯",
    time: "25 天前",
    primaryCategory: "美容美体",
    secondaryCategory: "短对话",
    publicTags: ["商品旁白","温柔女声"],
    personalTag: "口播专项",
    size: "0.4 MB"
  },
  {
    id: "aud-4",
    title: "4月7日 (1)",
    subtitle: "里斯 | 王五",
    duration: 6,
    durationFormatted: "00:06",
    badge: "音频",
    downloads: 0,
    author: "月儿弯弯",
    time: "25 天前",
    primaryCategory: "个人护理",
    secondaryCategory: "口播切片",
    publicTags: ["促销口播"],
    personalTag: "待二创",
    size: "0.2 MB"
  },
  {
    id: "aud-5",
    title: "爆款防脱洗发水口播旁白",
    subtitle: "美妆 | 旁白解说",
    duration: 45,
    durationFormatted: "00:45",
    badge: "音频",
    downloads: 5,
    author: "致上互娱",
    time: "1小时前",
    primaryCategory: "美妆护肤",
    secondaryCategory: "洗护系列",
    publicTags: ["商品旁白","温柔女声"],
    personalTag: "美妆项目",
    size: "1.1 MB"
  },
  {
    id: "aud-6",
    title: "欢快电商带货节奏BGM",
    subtitle: "BGM | 电商促销",
    duration: 90,
    durationFormatted: "01:30",
    badge: "音频",
    downloads: 12,
    author: "汤小真",
    time: "3天前",
    primaryCategory: "休闲零食",
    secondaryCategory: "促销大促",
    publicTags: ["轻快节奏","纯音乐"],
    personalTag: "本周主推",
    size: "2.5 MB"
  },
  {
    id: "aud-7",
    title: "草本初色内衣舒适感音效",
    subtitle: "柔和 | 品牌语",
    duration: 28,
    durationFormatted: "00:28",
    badge: "音频",
    downloads: 8,
    author: "李剪辑",
    time: "5天前",
    primaryCategory: "服饰内衣",
    secondaryCategory: "品牌调性",
    publicTags: ["舒缓氛围","服饰内衣"],
    personalTag: "服饰项目",
    size: "0.8 MB"
  },
  {
    id: "aud-8",
    title: "搞笑短视频转场音效-拔塞子",
    subtitle: "音效 | 短视频转场",
    duration: 3,
    durationFormatted: "00:03",
    badge: "音频",
    downloads: 19,
    author: "王五",
    time: "7天前",
    primaryCategory: "家居优选",
    secondaryCategory: "趣味音效",
    publicTags: ["转场音效"],
    personalTag: "无个人标签",
    size: "0.1 MB"
  }
];
INITIAL_AUDIO_LIST.push(...["植萃精华自然口播.wav","通勤穿搭轻快配乐.mp3","收纳产品开箱解说.wav"].map((title, index) => ({
  ...INITIAL_AUDIO_LIST[index % INITIAL_AUDIO_LIST.length], id: "audio-analytics-" + (index + 1), title,
  author: ["徐振", "王剪辑", "周雅"][index], downloads: [8, 12, 5][index],
  createdAt: `2026-09-${10 + index} 10:30`, time: `2026-09-${10 + index} 10:30`,
})));

resourceTagStore.register("audio", INITIAL_AUDIO_LIST);
resourceConfigStore.register("audio", INITIAL_AUDIO_LIST);

export default function AudioManagementView({ onTriggerTask, onDetailStateChange, initialSearch, onClearSearch }: AudioManagementViewProps) {
  // Category states
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState("全部");
  const [selectedSecondaryCategory, setSelectedSecondaryCategory] = useState("全部");
  const [selectedPublicTag, setSelectedPublicTag] = useState("全部");
  const [selectedPersonalTag, setSelectedPersonalTag] = useState("全部");

  // Search & Filters
  const [sortBy, setSortBy] = useState("最新发布");
  const [searchCategoryKeyword, setSearchCategoryKeyword] = useState("");
  const [searchPublicTagKeyword, setSearchPublicTagKeyword] = useState("");
  const [searchPersonalTagKeyword, setSearchPersonalTagKeyword] = useState("");
  const [searchAuthorKeyword, setSearchAuthorKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [searchQuery, setSearchQuery] = useState(initialSearch?.query || "");
  React.useEffect(() => { setSearchQuery(initialSearch?.query || ""); }, [initialSearch?.requestId, initialSearch?.query]);

  // View Mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Audio Playback State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTimeMap, setCurrentTimeMap] = useState<Record<string, number>>({});

  // Dropdown States
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false);

  // Audio items list
  const [baseAudioList, setAudioList] = useState<AudioItem[]>(INITIAL_AUDIO_LIST);
  const uploaded = useUploadedResources();
  const { edits: audioEdits, saveEdits: saveAudioEdits } = useResourceEdits<AudioItem>("audio");
  const untaggedAudioList = [...uploaded.filter((item) => item.resourceCategory === "音频").map(uploadedAudio), ...baseAudioList].map(item => ({ ...item, ...audioEdits[item.id] }));
  const audioList = useTaggedResources("audio", untaggedAudioList);
  const { publicGroups: PUBLIC_TAG_GROUPS, personalGroups: PERSONAL_TAG_GROUPS } = useTagCatalog();
  const [batchTagKind, setBatchTagKind] = useState<"public" | "personal" | null>(null);

  // Audio Detail Modal State
  const [detailAudioItem, setDetailAudioItem] = useState<AudioItem | null>(null);

  React.useEffect(() => {
    if (!initialSearch?.openDetail || !initialSearch.query) return;
    const target = initialSearch.query.trim().toLowerCase();
    const match = audioList.find((item) => item.title.toLowerCase() === target || item.id.toLowerCase() === target);
    if (match) setDetailAudioItem(match);
  }, [initialSearch?.requestId]);

  React.useEffect(() => {
    onDetailStateChange?.(!!detailAudioItem);
  }, [detailAudioItem, onDetailStateChange]);
  const [detailCurrentTime, setDetailCurrentTime] = useState<number>(0);
  const [detailIsPlaying, setDetailIsPlaying] = useState<boolean>(false);
  const [detailSpeed, setDetailSpeed] = useState<string>("1x倍速");
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [detailIsMuted, setDetailIsMuted] = useState<boolean>(false);
  const [showDetailMoreMenu, setShowDetailMoreMenu] = useState<boolean>(false);

  // Modals & detail fields matching FinishedVideoDetailModal pattern
  const [audioCategoryText, setAudioCategoryText] = useState<string>("美容美体 / 短对话");
  const [showModifyCategoryModal, setShowModifyCategoryModal] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [selectedPrimaryCat, setSelectedPrimaryCat] = useState<string>("宠物食品");
  const [tempCategoryPath, setTempCategoryPath] = useState<string>("");

  const [audioTitleText, setAudioTitleText] = useState<string>("");
  const [showModifyTitleModal, setShowModifyTitleModal] = useState<boolean>(false);
  const [tempTitleText, setTempTitleText] = useState<string>("");

  const [audioPublicTags, setAudioPublicTags] = useState<string[]>(["场景: 模特"]);
  const [showPublicTagModal, setShowPublicTagModal] = useState<boolean>(false);
  const [publicGroupSearch, setPublicGroupSearch] = useState<string>("");
  const [publicSubSearch, setPublicSubSearch] = useState<string>("");
  const [selectedPublicGroupKey, setSelectedPublicGroupKey] = useState<string>("模特");
  const [tempAddedPublicTags, setTempAddedPublicTags] = useState<string[]>([]);

  const [audioPersonalTags, setAudioPersonalTags] = useState<string[]>(["Zs测试一"]);
  const [showPersonalTagModal, setShowPersonalTagModal] = useState<boolean>(false);
  const [personalGroupSearch, setPersonalGroupSearch] = useState<string>("");
  const [personalSubSearch, setPersonalSubSearch] = useState<string>("");
  const [selectedPersonalGroupKey, setSelectedPersonalGroupKey] = useState<string>("Zs测试一");
  const [tempAddedPersonalTags, setTempAddedPersonalTags] = useState<string[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openDetailModal = (item: AudioItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDetailAudioItem(item);
    setDetailCurrentTime(currentTimeMap[item.id] || 0);
    setDetailIsPlaying(playingId === item.id);
    const cat = `${item.primaryCategory || "美容美体"} / ${item.secondaryCategory || "短对话"}`;
    setAudioCategoryText(cat);
    setAudioTitleText(item.title);
    setAudioPublicTags(item.publicTags && item.publicTags.length > 0 ? item.publicTags : ["场景: 模特"]);
    setAudioPersonalTags(item.personalTag && item.personalTag !== "无个人标签" ? [item.personalTag] : ["Zs测试一"]);
    setShowDetailMoreMenu(false);
    setShowSpeedMenu(false);
  };

  // Detail Audio Timer Loop
  useEffect(() => {
    if (!detailIsPlaying || !detailAudioItem) return;

    const interval = setInterval(() => {
      setDetailCurrentTime((prev) => {
        if (prev >= detailAudioItem.duration) {
          setDetailIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [detailIsPlaying, detailAudioItem]);

  // Audio Timer loop
  useEffect(() => {
    if (!playingId) return;

    const interval = setInterval(() => {
      setCurrentTimeMap((prev) => {
        const item = audioList.find((a) => a.id === playingId);
        const duration = item ? item.duration : 60;
        const current = prev[playingId] || 0;
        if (current >= duration) {
          setPlayingId(null);
          return { ...prev, [playingId]: 0 };
        }
        return { ...prev, [playingId]: current + 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playingId, audioList]);

  // Toggle audio playback
  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const handleSeek = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTimeMap((prev) => ({ ...prev, [id]: val }));
  };

  const presetFilters = { searchQuery, selectedPrimaryCategory, selectedSecondaryCategory, selectedPublicTag, selectedPersonalTag, sortBy, searchCategoryKeyword, searchPublicTagKeyword, searchPersonalTagKeyword, searchAuthorKeyword, startDate, endDate };
  const applyPresetFilters = (next: typeof AUDIO_PRESET_DEFAULTS) => {
    setSearchQuery(next.searchQuery);
    setSelectedPrimaryCategory(next.selectedPrimaryCategory);
    setSelectedSecondaryCategory(next.selectedSecondaryCategory);
    setSelectedPublicTag(next.selectedPublicTag);
    setSelectedPersonalTag(next.selectedPersonalTag);
    setSortBy(next.sortBy);
    setSearchCategoryKeyword(next.searchCategoryKeyword);
    setSearchPublicTagKeyword(next.searchPublicTagKeyword);
    setSearchPersonalTagKeyword(next.searchPersonalTagKeyword);
    setSearchAuthorKeyword(next.searchAuthorKeyword);
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    setCurrentPage(1);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  // Filter logic
  const filteredAudios = audioList.filter((item) => {
    const homeSearch = searchQuery.trim().toLowerCase();
    const matchesHomeSearch = !homeSearch || [item.title, item.subtitle, item.primaryCategory, item.secondaryCategory, item.personalTag, item.author, ...item.publicTags]
      .some((value) => value.toLowerCase().includes(homeSearch));
    if (!matchesHomeSearch) return false;

    if (selectedPrimaryCategory !== "全部" && item.primaryCategory !== selectedPrimaryCategory) {
      return false;
    }
    if (selectedSecondaryCategory !== "全部" && item.secondaryCategory !== selectedSecondaryCategory) {
      return false;
    }
    if (selectedPublicTag !== "全部" && !item.publicTags.includes(selectedPublicTag)) {
      return false;
    }
    if (selectedPersonalTag !== "全部") {
      if (selectedPersonalTag === "无个人标签" && item.personalTag !== "无个人标签") return false;
      if (selectedPersonalTag === "有个人标签" && item.personalTag === "无个人标签") return false;
      if (selectedPersonalTag !== "无个人标签" && selectedPersonalTag !== "有个人标签" && !(item.personalTags || [item.personalTag]).includes(selectedPersonalTag)) {
        return false;
      }
    }
    if (searchAuthorKeyword && !item.author.toLowerCase().includes(searchAuthorKeyword.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Pagination calculations
  const totalCount = filteredAudios.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedAudios = filteredAudios.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Select all on current page
  const handleSelectPage = () => {
    const pageIds = paginatedAudios.map((a) => a.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(combined);
      setIsSelectionMode(true);
    }
  };

  const toggleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((i) => i !== id);
      setSelectedIds(next);
      if (next.length === 0) {
        setIsSelectionMode(false);
      }
    } else {
      setSelectedIds([...selectedIds, id]);
      setIsSelectionMode(true);
    }
  };

  const { store: configStore } = useResourceConfig();
  const primaryCategories = ["全部", ...configStore.categories("audio").map(n => n.name)];

  const secondaryCategories = ["全部", ...configStore.categories("audio").flatMap(n => n.children.map(c => c.name))];

  const publicTags = Object.values(PUBLIC_TAG_GROUPS).flat();
  const personalTags = ["全部", "无个人标签", "有个人标签", ...Object.values(PERSONAL_TAG_GROUPS).flat()];
  useEffect(() => { setCurrentPage(1); }, [selectedPersonalTag, searchPersonalTagKeyword]);

  React.useEffect(() => {
    const tag = initialSearch?.tag;
    if (!tag) return;
    if (primaryCategories.includes(tag)) setSelectedPrimaryCategory(tag);
    else if (secondaryCategories.includes(tag)) setSelectedSecondaryCategory(tag);
    else if (publicTags.includes(tag)) setSelectedPublicTag(tag);
    else if (personalTags.includes(tag)) setSelectedPersonalTag(tag);
    setCurrentPage(1);
  }, [initialSearch?.requestId]);

  const isAllPageSelected = filteredAudios.length > 0 && filteredAudios.every((a) => selectedIds.includes(a.id));

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  if (detailAudioItem) {
    return (
      <AudioDetailView
        item={detailAudioItem}
        onClose={() => {
          setDetailAudioItem(null);
          setDetailIsPlaying(false);
        }}
        showToast={showToast}
        onDelete={(id) => setAudioList((prev) => prev.filter((a) => a.id !== id))}
      />
    );
  }

  return (
    <div className="flex-1 bg-slate-100/70 p-4 min-h-0 flex flex-col font-sans text-slate-800 overflow-y-auto space-y-3">
      {/* Toast Notification */}
      {toastMessage && (
        <OverlayPortal layer="toast" role="status" className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </OverlayPortal>
      )}

      {/* Top Cascading Filter Section */}
      <div className={RESOURCE_FILTER_PANEL_CLASS}>
        
        {/* Row 1: 常用筛选预设 */}
        <div className={RESOURCE_FILTER_PRESET_ROW_CLASS}>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <ResourceFilterPresets scope="audio" defaults={AUDIO_PRESET_DEFAULTS} value={presetFilters}
              selectedName={selectedPreset} onSelectName={setSelectedPreset} onApply={applyPresetFilters}
              seeds={[
                { name: "音频速查预设1", filters: {} },
                { name: "高下载口播旁白", filters: { selectedSecondaryCategory: "口播切片", sortBy: "最多下载" } },
              ]} />
          </div>
        </div>

        {/* Row 2-3: 一级分类、二级分类 */}
        <ResourceCategoryFilters scope="audio" primary={selectedPrimaryCategory} secondary={selectedSecondaryCategory} search={searchCategoryKeyword}
          onPrimary={setSelectedPrimaryCategory} onSecondary={setSelectedSecondaryCategory} onSearch={setSearchCategoryKeyword} />

        {/* Row 4: 公共标签 */}
        <div className={RESOURCE_FILTER_TAG_ROW_CLASS}>
          <span className={RESOURCE_FILTER_LABEL_CLASS}>公共标签：</span>
          <PublicTagFilter
            searchKeyword={searchPublicTagKeyword}
            onSearchKeywordChange={setSearchPublicTagKeyword}
            selectedTag={selectedPublicTag}
            onSelectTag={(tag) => setSelectedPublicTag(tag)}
          />
        </div>

        {/* Row 5: 个人标签 */}
        <div className={RESOURCE_FILTER_TAG_ROW_CLASS}>
          <span className={RESOURCE_FILTER_LABEL_CLASS}>个人标签：</span>
          <PersonalTagFilter
            searchKeyword={searchPersonalTagKeyword}
            onSearchKeywordChange={setSearchPersonalTagKeyword}
            selectedTag={selectedPersonalTag}
            onSelectTag={setSelectedPersonalTag}
          />
        </div>
      </div>

      <ResourceSearchCondition query={searchQuery} onClear={() => { setSearchQuery(""); onClearSearch?.(); }} />

      {/* Filter Card 2: 高级搜索 Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <span className="text-slate-900 font-bold shrink-0">高级搜索：</span>

          {/* 排序 */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
            <span className="text-slate-900 font-bold shrink-0">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="最新发布">最新发布</option>
              <option value="最多下载">最多下载</option>
              <option value="时长降序">时长从长到短</option>
            </select>
          </div>

          {/* 系统自动标签 */}
          <select aria-label="系统自动标签" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 bg-white focus:outline-none focus:border-purple-400 cursor-pointer">
            <option value="">系统自动标签: 请选择系统标签</option>
            <option value="voice_tag">AI识别配音</option>
            <option value="bgm_tag">BGM音效</option>
          </select>

          {/* 近期未使用 */}
          <span className="text-slate-500 font-normal shrink-0">近期未使用:</span>

          {/* 店铺+链接ID */}
          <select
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 bg-white focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            <option value="">请选择店铺+链接ID</option>
            <option value="shop_a">a店铺-草本洗发水链接</option>
            <option value="shop_b">b店铺-古法金饰链接</option>
          </select>

          {/* 日历时间区间 */}
          <div className="flex items-center gap-1 text-slate-500 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>请选择时间</span>
            <span className="text-slate-300 mx-1">|</span>
            <span>至今</span>
          </div>
        </div>

        {/* Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              applyPresetFilters({ ...AUDIO_PRESET_DEFAULTS, searchQuery });
              setSelectedPreset("");
              showToast("已重置所有筛选");
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            重置
          </button>
        </div>
      </div>

      {batchTagKind && <ResourceTagModal kind={batchTagKind}
        title={batchTagKind === "public" ? "添加公共标签" : "添加个人标签"}
        requireSelection
        onClose={() => setBatchTagKind(null)} showToast={showToast}
        onConfirm={added => {
          const patches = Object.fromEntries(audioList.filter(item => selectedIds.includes(item.id)).map(item => {
            if (batchTagKind === "public") return [item.id, { publicTags: appendTags(item.publicTags, added) }];
            const original = item.personalTags || (item.personalTag && item.personalTag !== "无个人标签" ? [item.personalTag] : []);
            const tags = appendTags(original, added);
            return [item.id, { personalTags: tags, personalTag: tags[0] || "无个人标签" }];
          }));
          if (!saveAudioEdits(patches)) { showToast("保存失败，请检查浏览器存储空间后重新操作"); return false; }
          showToast(`已为 ${selectedIds.length} 个音频添加${batchTagKind === "public" ? "公共" : "个人"}标签`);
        }} />}

      {/* Sub Toolbar: Selection mode or Batch Action Toolbar (Matches Screenshot 3 & 4) */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs">
        
        {isSelectionMode && selectedIds.length > 0 ? (
          /* Mode B: Active Batch Toolbar (Screenshot 4) */
          <div className="flex items-center gap-2 flex-wrap w-full">
            <button
              onClick={() => {
                setSelectedIds([]);
                setIsSelectionMode(false);
              }}
              className="border border-purple-300 text-purple-600 bg-white hover:bg-purple-50 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
            >
              取消选择
            </button>

            <button
              onClick={handleSelectPage}
              className="border border-purple-600 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-purple-600" />
              <span>选中本页</span>
            </button>

            <span className="text-slate-600 font-bold px-2">
              已选: <strong className="text-purple-600 text-sm font-extrabold">{selectedIds.length}</strong> 个
            </span>

            <button
              onClick={() => showToast(`已打包下载 ${selectedIds.length} 个音频文件`)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors shadow-2xs"
            >
              下载
            </button>

            <ResourceActionMenu label="添加标签" options={["添加公共标签", "添加个人标签"]}
              onSelect={option => setBatchTagKind(option === "添加公共标签" ? "public" : "personal")} />

            {/* 操作 下拉 (投放数据分析, 发送消息提醒, 放入回收站) */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>操作</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showMoreActionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowMoreActionsMenu(false);
                      showToast("正在分析选中音频投放数据...");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-purple-50 text-slate-700 font-medium flex items-center gap-2"
                  >
                    <BarChart2 className="w-4 h-4 text-purple-600" />
                    <span>投放数据分析</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreActionsMenu(false);
                      showToast("已向部门成员群发消息提醒");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-purple-50 text-slate-700 font-medium flex items-center gap-2"
                  >
                    <Send className="w-4 h-4 text-blue-600" />
                    <span>发送消息提醒</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setShowMoreActionsMenu(false);
                      if (!window.confirm(`删除后将把选中的 ${selectedIds.length} 个音频移入管理端集中回收站，当前用户将无法继续查看；如需恢复请联系管理员。确认继续吗？`)) return;
                      setAudioList((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
                      setSelectedIds([]);
                      setIsSelectionMode(false);
                      showToast("已将选中音频移入管理端集中回收站");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>放入回收站 ⓘ</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Mode A: Default toolbar (Screenshot 1 & 3) */
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSelectionMode(true)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shadow-2xs"
              >
                选择
              </button>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={handleSelectPage}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>选中本页</span>
              </label>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* 作者 Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400">作者:</span>
                <input
                  type="text"
                  placeholder="请选择(支持输入搜索)"
                  value={searchAuthorKeyword}
                  onChange={(e) => setSearchAuthorKeyword(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 w-44 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* 上传时间 Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">上传时间:</span>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-slate-700 focus:outline-none text-xs"
                  />
                  <span className="text-slate-400 font-bold">至</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-slate-700 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-white text-purple-600 shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="宫格网图"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-white text-purple-600 shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="列表试图"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Audio Cards Grid List (Exact layout of Screenshot 2, 3 & 4) */}
      {filteredAudios.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 space-y-3">
          <Music className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-bold text-sm">暂无符合条件的音频资源</p>
          <p className="text-slate-400 text-xs">尝试重置筛选或上传新的音频文件</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredAudios.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isPlaying = playingId === item.id;
            const currentSec = currentTimeMap[item.id] || 0;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isSelectionMode) toggleSelectItem(item.id);
                }}
                className={`bg-white rounded-2xl border transition-all duration-150 relative overflow-hidden group flex flex-col justify-between p-3.5 ${
                  isSelected
                    ? "border-purple-600 ring-2 ring-purple-500/20 shadow-md bg-purple-50/10"
                    : "border-slate-200/90 hover:border-purple-300 hover:shadow-md"
                }`}
              >
                {/* Checkbox for Selection Mode */}
                {isSelectionMode && (
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Top Section: Title & Download Count / Hover Actions */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      onClick={(e) => openDetailModal(item, e)}
                      className="font-bold text-slate-900 text-sm tracking-tight truncate flex-1 hover:text-purple-600 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h3>

                    {/* Download count / Action buttons (Screenshot 2 & 3) */}
                    <div className="flex items-center gap-1 shrink-0 text-slate-400 text-xs">
                      {!isSelectionMode && (
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showToast(`正在下载: ${item.title}.mp3`);
                            }}
                            className="p-1 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-lg transition-colors shadow-2xs"
                            title="下载"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-0.5 text-slate-400 font-medium group-hover:hidden">
                        <Download className="w-3 h-3" />
                        <span>{item.downloads}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle / Tags line */}
                  <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">
                    {item.subtitle}
                  </p>
                </div>

                {/* Middle Section: Interactive Audio Player (Exact look of Screenshot 2 & 3) */}
                <div className="py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    {/* Purple Circular Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay(item.id);
                      }}
                      className={`w-9 h-9 rounded-full border-2 border-purple-600 flex items-center justify-center text-purple-600 hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer shadow-xs ${
                        isPlaying ? "bg-purple-600 text-white" : "bg-white hover:bg-purple-50"
                      }`}
                      title={isPlaying ? "暂停" : "播放"}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Progress Scrubber Bar */}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min={0}
                          max={item.duration}
                          value={currentSec}
                          onChange={(e) => handleSeek(item.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none focus:outline-none"
                        />
                      </div>

                      {/* Duration Text */}
                      <span className="text-xs font-mono font-medium text-slate-600 shrink-0 min-w-[36px] text-right">
                        {isPlaying ? formatSeconds(currentSec) : item.durationFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Author Avatar & Relative Time (Exact layout of Screenshot 2 & 3) */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">
                      {item.author.slice(0, 1)}
                    </div>
                    <span className="truncate">{item.author}</span>
                  </div>
                  <span className="text-slate-400 shrink-0">{item.time}</span>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleSelectPage}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">音频标题与类型</th>
                <th className="p-3.5">试听播放</th>
                <th className="p-3.5">时长</th>
                <th className="p-3.5">作者</th>
                <th className="p-3.5">下载数</th>
                <th className="p-3.5">上传时间</th>
                <th className="p-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredAudios.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isPlaying = playingId === item.id;
                const currentSec = currentTimeMap[item.id] || 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? "bg-purple-50/30" : ""}`}
                  >
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5">
                      <div>
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                      </div>
                    </td>
                    <td className="p-3.5 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePlay(item.id)}
                          className={`w-7 h-7 rounded-full border-2 border-purple-600 flex items-center justify-center text-purple-600 cursor-pointer ${
                            isPlaying ? "bg-purple-600 text-white" : "bg-white hover:bg-purple-50"
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={item.duration}
                          value={currentSec}
                          onChange={(e) => handleSeek(item.id, e)}
                          className="w-28 accent-purple-600 h-1 bg-slate-200 rounded"
                        />
                      </div>
                    </td>
                    <td className="p-3.5 font-mono">{item.durationFormatted}</td>
                    <td className="p-3.5">{item.author}</td>
                    <td className="p-3.5">{item.downloads}</td>
                    <td className="p-3.5 text-slate-400">{item.time}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => openDetailModal(item, e)}
                          className="text-slate-600 hover:text-purple-600 font-bold px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => showToast(`已开始下载: ${item.title}.mp3`)}
                          className="text-purple-600 hover:text-purple-700 font-bold px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        >
                          下载
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS (修改分类/修改标题/公共标签/个人标签 in List View if needed) */}
      {/* ========================================================================= */}

      {/* MODAL 1: 修改分类 Modal (Matching FinishedVideoDetailModal) */}
      {showModifyCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">修改分类</h3>
              </div>
              <button
                onClick={() => setShowModifyCategoryModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">当前选择路径</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                  {tempCategoryPath || audioCategoryText}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">选择分类层级</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedPrimaryCat}
                    onChange={(e) => {
                      setSelectedPrimaryCat(e.target.value);
                      setTempCategoryPath(`${e.target.value} / 默认二级分类`);
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-purple-500"
                  >
                    <option value="美容美体">美容美体</option>
                    <option value="宠物食品">宠物食品</option>
                    <option value="美妆护肤">美妆护肤</option>
                    <option value="数码家电">数码家电</option>
                  </select>
                  <select
                    onChange={(e) => setTempCategoryPath(`${selectedPrimaryCat} / ${e.target.value}`)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-purple-500"
                  >
                    <option value="短对话">短对话</option>
                    <option value="旁白解说">旁白解说</option>
                    <option value="情绪配音">情绪配音</option>
                    <option value="爆款BGM">爆款BGM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowModifyCategoryModal(false)}
                className="px-5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setAudioCategoryText(tempCategoryPath || audioCategoryText);
                  showToast("✅ 已同步音频分类");
                  setShowModifyCategoryModal(false);
                }}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 编辑标题 Modal (Matching FinishedVideoDetailModal) */}
      {showModifyTitleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">音频标题</label>
                <input
                  type="text"
                  value={tempTitleText}
                  onChange={(e) => setTempTitleText(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-100"
                  placeholder="请输入音频标题"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowModifyTitleModal(false)}
                className="px-5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (tempTitleText.trim()) {
                    setAudioTitleText(tempTitleText.trim());
                    showToast("✅ 已更新音频标题");
                  }
                  setShowModifyTitleModal(false);
                }}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: 关联公共标签 Modal (Matching FinishedVideoDetailModal 3-column layout) */}
      {showPublicTagModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">关联公共标签</h3>
              </div>
              <button
                onClick={() => setShowPublicTagModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3.5 h-[380px]">
                {/* Col 1: 标签组 */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col bg-white">
                  <div className="bg-slate-100/90 text-slate-700 text-xs font-bold py-2.5 px-3.5 border-b border-slate-200/80 flex items-center justify-between">
                    <span>标签组</span>
                    <button
                      onClick={() => showToast("已刷新标签组")}
                      className="text-purple-600 hover:underline text-xs font-normal cursor-pointer"
                    >
                      刷新
                    </button>
                  </div>
                  <div className="p-3 flex-1 flex flex-col overflow-hidden">
                    <input
                      type="text"
                      placeholder="请输入标签组名称"
                      value={publicGroupSearch}
                      onChange={(e) => setPublicGroupSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 mb-2.5"
                    />
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                      {Object.keys(PUBLIC_TAG_GROUPS)
                        .filter(g => g.includes(publicGroupSearch.trim()))
                        .map((group) => (
                          <div
                            key={group}
                            onClick={() => setSelectedPublicGroupKey(group)}
                            className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                              selectedPublicGroupKey === group
                                ? "text-purple-600 font-bold bg-purple-50/80"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {group}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Col 2: 二级标签 */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col bg-white">
                  <div className="bg-slate-100/90 text-slate-700 text-xs font-bold py-2.5 px-3.5 border-b border-slate-200/80 flex items-center justify-between">
                    <span>二级标签</span>
                    <button
                      onClick={() => showToast("弹出添加二级标签弹窗")}
                      className="text-purple-600 hover:underline text-xs font-normal cursor-pointer"
                    >
                      + 添加二级标签
                    </button>
                  </div>
                  <div className="p-3 flex-1 flex flex-col overflow-hidden">
                    <input
                      type="text"
                      placeholder="请输入二级标签名称"
                      value={publicSubSearch}
                      onChange={(e) => setPublicSubSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 mb-2.5"
                    />
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {(PUBLIC_TAG_GROUPS[selectedPublicGroupKey] || [])
                        .filter(sub => sub.includes(publicSubSearch.trim()))
                        .map((subTag) => {
                          const isChecked = tempAddedPublicTags.includes(subTag);
                          return (
                            <label
                              key={subTag}
                              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-purple-700 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setTempAddedPublicTags(tempAddedPublicTags.filter(t => t !== subTag));
                                  } else {
                                    setTempAddedPublicTags([...tempAddedPublicTags, subTag]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                              />
                              <span>{subTag}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Col 3: 已添加二级标签 */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col bg-white">
                  <div className="bg-slate-100/90 text-slate-700 text-xs font-bold py-2.5 px-3.5 border-b border-slate-200/80 flex items-center justify-between">
                    <span>已添加二级标签</span>
                    <button
                      onClick={() => showToast("已保存当前选择为预设")}
                      className="text-purple-600 hover:underline text-xs font-normal cursor-pointer"
                    >
                      保存为预设
                    </button>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto">
                    {tempAddedPublicTags.length === 0 ? (
                      <div className="text-slate-400 text-xs pt-4 text-left">
                        暂未添加二级标签
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {tempAddedPublicTags.map((tag) => (
                          <div
                            key={tag}
                            className="bg-slate-50 border border-slate-100 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium hover:bg-slate-100/80 transition-colors"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => setTempAddedPublicTags(tempAddedPublicTags.filter(t => t !== tag))}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowPublicTagModal(false)}
                className="px-5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setAudioPublicTags([...tempAddedPublicTags]);
                  showToast("✅ 已同步公共标签设置");
                  setShowPublicTagModal(false);
                }}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: 关联个人标签 Modal (Matching FinishedVideoDetailModal 3-column layout) */}
      {showPersonalTagModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">关联个人标签</h3>
              </div>
              <button
                onClick={() => setShowPersonalTagModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <button
                  onClick={() => showToast("进入编辑个人标签模式")}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  编辑个人标签
                </button>
              </div>

              {/* 3 Columns */}
              <div className="grid grid-cols-3 gap-3.5 h-[380px]">
                {/* Col 1: 标签组 */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col bg-white">
                  <div className="bg-slate-100/90 text-slate-700 text-xs font-bold py-2.5 px-3.5 border-b border-slate-200/80">
                    标签组
                  </div>
                  <div className="p-3 flex-1 flex flex-col overflow-hidden">
                    <input
                      type="text"
                      placeholder="请输入标签组名称"
                      value={personalGroupSearch}
                      onChange={(e) => setPersonalGroupSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 mb-2.5"
                    />
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                      {Object.keys(PERSONAL_TAG_GROUPS)
                        .filter(g => g.includes(personalGroupSearch.trim()))
                        .map((group) => (
                          <div
                            key={group}
                            onClick={() => setSelectedPersonalGroupKey(group)}
                            className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                              selectedPersonalGroupKey === group
                                ? "text-purple-600 font-bold bg-purple-50/80"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {group}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Col 2: 二级标签 */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col bg-white">
                  <div className="bg-slate-100/90 text-slate-700 text-xs font-bold py-2.5 px-3.5 border-b border-slate-200/80">
                    二级标签
                  </div>
                  <div className="p-3 flex-1 flex flex-col overflow-hidden">
                    <input
                      type="text"
                      placeholder="请输入二级标签名称"
                      value={personalSubSearch}
                      onChange={(e) => setPersonalSubSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 mb-2.5"
                    />
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {(PERSONAL_TAG_GROUPS[selectedPersonalGroupKey] || [])
                        .filter(sub => sub.includes(personalSubSearch.trim()))
                        .map((subTag) => {
                          const isChecked = tempAddedPersonalTags.includes(subTag);
                          return (
                            <label
                              key={subTag}
                              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-purple-700 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setTempAddedPersonalTags(tempAddedPersonalTags.filter(t => t !== subTag));
                                  } else {
                                    setTempAddedPersonalTags([...tempAddedPersonalTags, subTag]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                              />
                              <span>{subTag}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Col 3: 已添加二级标签 */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col bg-white">
                  <div className="bg-slate-100/90 text-slate-700 text-xs font-bold py-2.5 px-3.5 border-b border-slate-200/80">
                    已添加二级标签
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto">
                    {tempAddedPersonalTags.length === 0 ? (
                      <div className="text-slate-400 text-xs pt-4 text-left">
                        暂未添加二级标签
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tempAddedPersonalTags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-purple-50 text-purple-700 border border-purple-100 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => setTempAddedPersonalTags(tempAddedPersonalTags.filter(t => t !== tag))}
                              className="text-purple-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowPersonalTagModal(false)}
                className="px-5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setAudioPersonalTags([...tempAddedPersonalTags]);
                  showToast("✅ 已同步个人标签设置");
                  setShowPersonalTagModal(false);
                }}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
