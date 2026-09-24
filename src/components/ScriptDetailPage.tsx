import React, { useState, useRef } from "react";
import { useResourceConfig } from "../lib/useResourceConfig";
import { ResourceCategoryModal, ResourceEditDialog } from "./ResourceEditDialog";
import { ResourceStatusBadge } from "./ResourceConfigControls";
import { useTaggedResources } from "../lib/useResourceTags";
import { resourceTagStore } from "../lib/resourceTags";
import ResourceTagModal from "./ResourceTagModal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import {
  ArrowLeft,
  User,
  Edit3,
  Plus,
  Share2,
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  FileText,
  Upload,
  Link2,
  Check,
  X,
  Search,
  HelpCircle,
  Eye,
  Trash2,
  History,
  Tag,
  Film,
  Calendar,
  Layers,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  Box,
  Filter,
  Grid,
  List,
  Pencil,
  Play,
  Info
} from "lucide-react";
import { TaskDetailPage } from "./TaskDetailPage";
import { TaskItem, AssociatedWorkItem, addTaskRecord, useTaskRecords } from "./TaskCollaborationView";
import TaskCustomFields from "./TaskCustomFields";
import { useTaskFields } from "../lib/useTaskFields";
import { taskFieldErrors, TaskFieldValues } from "../lib/taskFieldConfig";
import { createScriptTask } from "../lib/scriptTaskPublishing";
import OverlayPortal from "./overlays/OverlayPortal";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";

export interface ScriptItem {
  id: string;
  title: string;
  author: string;
  categoryTag: string;
  content: string;
  status: string;
  primaryCategory: string;
  secondaryCategory: string;
  classTag: string;
  descTag: string;
  tasksCount: number;
  tasks: Array<{
    id: string;
    name: string;
    assignee: string;
    status: "进行中" | "已完成" | "待处理";
    updatedAt: string;
  }>;
  createdAt: string;
  scenesCount: number;
  // Detail fields
  publisherGroup?: string;
  basicType?: string;
  benchmarkVideo?: string;
  modelSelect?: string;
  sceneSelect?: string;
  coreHighlight?: string;
  derivedContent?: string;
  specialSupplement?: string;
  auditNotes?: string;
  publicTags?: string[];
  personalTags?: string[];
  associatedWorks?: AssociatedWorkItem[];
}

interface ScriptDetailPageProps {
  script: ScriptItem;
  onBack: () => void;
  onTriggerTask?: (type: any, name: string, inputFiles: string[], cost: number) => void;
  onUpdateScript?: (updatedScript: ScriptItem) => void;
  onDeleteScript?: (scriptId: string) => void;
}

// Cascader Department Tree matching TaskCollaborationView exactly
const DEPT_TREE = [
  {
    name: "剪辑一组",
    subGroups: [
      { name: "视频后发", members: ["张三", "李四", "王五", "赵六"] },
      { name: "特效包装", members: ["钱七", "孙八"] }
    ]
  },
  {
    name: "拍摄一组",
    subGroups: [
      { name: "现场摄制", members: ["周九", "吴十"] },
      { name: "灯光布景", members: ["郑十一", "王十二"] }
    ]
  },
  {
    name: "AIGC爆款拆解部",
    subGroups: [
      { name: "抖音投流组", members: ["鲁月园", "刘弯", "陈晨"] },
      { name: "快手投流组", members: ["梁浩然", "莫钦全", "蔡卓良"] }
    ]
  }
];

// Product options list for Task Creation
const PRODUCTS_LIST = [
  "得力双头马克笔",
  "美的可折叠台灯",
  "晨光速干黑笔",
  "罗技无线静音鼠标",
  "冰丝鸡蛋裤",
  "美妆深层卸妆油",
  "防晒修护霜"
];

// Script types for Task Creation
const SCRIPT_TYPES = [
  "爆款拆解",
  "对标翻拍",
  "原创新写",
  "二创剪辑",
  "痛点直击"
];

const LINKABLE_WORK_LIBRARY: VideoResourcePickerItem[] = [
  { id: "w-11033274", name: "0730-8835-复古耳环珠宝展示视频.mp4", cover: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80", status: "待审核", section: "成片", primaryCategory: "时尚配饰", secondaryCategory: "珠宝首饰", tags: ["商品展示", "质感特写"], author: "张三", duration: "00:30", size: "42.6 MB" },
  { id: "w-11033275", name: "0801-美妆洗护自然透亮模特成片.mp4", cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80", status: "审核通过", section: "成片", primaryCategory: "美妆护肤", secondaryCategory: "面部护理", tags: ["模特出镜", "效果展示"], author: "李四", duration: "00:42", size: "58.2 MB" },
  { id: "w-11033276", name: "0802-高腰提臀修身牛仔裤翻拍.mp4", cover: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80", status: "已上机", section: "成片", primaryCategory: "服饰内衣", secondaryCategory: "女士下装", tags: ["对标翻拍", "穿搭展示"], author: "王五", duration: "00:36", size: "49.8 MB" },
  { id: "w-11033277", name: "0803-居家生活厨房剪辑特写.mp4", cover: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80", status: "审核驳回", section: "成片", primaryCategory: "日用百货", secondaryCategory: "厨房用品", tags: ["场景展示", "使用过程"], author: "赵六", duration: "00:28", size: "35.4 MB" },
  { id: "w-11033278", name: "0804-运动健身连体服街拍视频.mp4", cover: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80", status: "已搭", section: "成片", primaryCategory: "服饰内衣", secondaryCategory: "运动服饰", tags: ["街拍", "真人展示"], author: "钱七", duration: "00:31", size: "44.1 MB" },
  { id: "w-11033279", name: "0805-墨镜时尚穿搭展示成片.mp4", cover: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80", status: "审核通过", section: "成片", primaryCategory: "时尚配饰", secondaryCategory: "眼镜", tags: ["穿搭展示", "户外场景"], author: "孙八", duration: "00:25", size: "31.7 MB" },
  { id: "v-101", name: "0623-MF-鲁月园-刘弯-大盘有量分解-3.mp4", cover: "./assets/prototype/beauty-promo-detail.jpg", status: "审核通过", section: "成片", primaryCategory: "服饰内衣", secondaryCategory: "女士内衣", tags: ["种草口播", "爆款复刻"], author: "鲁月园", duration: "00:45", size: "61.3 MB" },
  { id: "v-102", name: "0624-鸡蛋裤舒适冰丝透气展示-1.mp4", cover: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop&q=80", status: "待审核", section: "成片", primaryCategory: "服饰内衣", secondaryCategory: "女士下装", tags: ["对标翻拍", "面料展示"], author: "徐振", duration: "00:30", size: "39.5 MB" },
  { id: "v-103", name: "0625-夏季高弹无痕内衣测评-2.mp4", cover: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop&q=80", status: "审核通过", section: "成片", primaryCategory: "服饰内衣", secondaryCategory: "女士内衣", tags: ["痛点解说", "效果对比"], author: "李四", duration: "01:10", size: "86.7 MB" },
  { id: "v-104", name: "0626-美妆卸妆油实测无死角清洁.mp4", cover: "./assets/prototype/skincare-product.jpg", status: "审核通过", section: "成片", primaryCategory: "美妆护肤", secondaryCategory: "清洁卸妆", tags: ["实测", "使用过程"], author: "王五", duration: "00:55", size: "72.4 MB" },
  { id: "w-2204101", name: "鸡蛋裤冰丝透气拉扯特写.mp4", cover: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800&auto=format&fit=crop&q=80", status: "审核通过", section: "素材", primaryCategory: "服饰内衣", secondaryCategory: "面料展示", tags: ["材质特写", "拉扯测试"], author: "摄制组", duration: "00:12", size: "18.4 MB" },
  { id: "w-2204102", name: "模特展示平缝腰头特写镜头.mp4", cover: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80", status: "已上机", section: "素材", primaryCategory: "服饰内衣", secondaryCategory: "模特展示", tags: ["真人展示", "腰头特写"], author: "摄制组", duration: "00:08", size: "12.9 MB" },
  { id: "m-103", name: "卸妆油乳化过程近景素材.mp4", cover: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80", status: "审核通过", section: "素材", primaryCategory: "美妆护肤", secondaryCategory: "清洁卸妆", tags: ["产品实拍", "过程特写"], author: "徐振", duration: "00:15", size: "20.6 MB" },
  { id: "m-104", name: "护肤产品瓶身旋转展示素材.mp4", cover: "./assets/prototype/luxury-skincare-set.jpg", status: "待审核", section: "素材", primaryCategory: "美妆护肤", secondaryCategory: "商品主图", tags: ["产品实拍", "瓶身展示"], author: "汤小真", duration: "00:10", size: "16.8 MB" },
  { id: "m-105", name: "厨房台面清洁前后对比素材.mp4", cover: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80", status: "审核通过", section: "素材", primaryCategory: "日用百货", secondaryCategory: "清洁用品", tags: ["前后对比", "场景实拍"], author: "梁浩然", duration: "00:18", size: "24.3 MB" },
  { id: "m-106", name: "户外通勤全身穿搭跟拍素材.mp4", cover: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80", status: "未审核", section: "素材", primaryCategory: "服饰内衣", secondaryCategory: "模特展示", tags: ["街拍", "全身展示"], author: "刘弯", duration: "00:22", size: "29.1 MB" },
];

const isVideoWork = (work: AssociatedWorkItem) => work.type === "成片" || work.type === "素材" || work.type === "video";

const associatedWorkToPickerItem = (work: AssociatedWorkItem): VideoResourcePickerItem => {
  const section = work.type === "素材" ? "素材" : "成片";
  const [primaryCategory = section === "成片" ? "成片视频" : "视频素材", secondaryCategory = "未分类"] = (work.category || "").split("/").map((item) => item.trim()).filter(Boolean);
  return {
    id: work.id,
    name: work.name,
    cover: work.coverUrl || "./assets/prototype/beauty-promo-detail.jpg",
    status: work.status || "审核通过",
    section,
    primaryCategory,
    secondaryCategory,
    tags: work.publicTags || [],
    author: work.author || "当前用户",
    duration: work.duration || "00:30",
    size: work.size || "24.0 MB",
  };
};

// Tag Groups definitions matching FinishedVideoDetailModal






export default function ScriptDetailPage({
  script,
  onBack,
  onUpdateScript,
  onDeleteScript
}: ScriptDetailPageProps) {
  // Local state for script data
  const [baseCurrentScript, setCurrentScript] = useState<ScriptItem>({
      ...script,
      publisherGroup: script.publisherGroup || `${script.author || "鲁月园"} / 投流二组 / 抖音投流组`,
      basicType: script.basicType || script.classTag || "基础: 对标翻拍/MF",
      benchmarkVideo: script.benchmarkVideo || "0623-MF-鲁月园-刘弯-大盘有量分解-3.mp4",
      modelSelect: script.modelSelect || "单人讲解展示产品",
      sceneSelect: script.sceneSelect || "室内居家背景 / 真实拆封",
      coreHighlight: script.coreHighlight || "解决夏天穿裤闷汗尴尬，平缝高弹面料不勒痕，展示面料强弹力与透气度",
      derivedContent: script.derivedContent || `模特腿部画一点疤痕\n\n其实我挺感谢咱们家粉丝姐妹推荐我这条鸡蛋裤。其实我夏天吧，愿意穿大衫，拉上一穿上那个下边配芭比裤的时候出一下汗，一脱下来哈，槽的虎的。就这个小裤，你看它就是可薄可薄的了 (运镜特写——参考对标)，而且弹力特别特别好。你看我这个大腿指甲轻了，这么一撑都能看看...`,
      specialSupplement: script.specialSupplement || "针对夏季露肤场景，增加冰丝面料特写镜头与强弹力拉扯测试",
      auditNotes: script.auditNotes ?? "表达自然生动，爆点突出",
      publicTags: script.publicTags || ["题材类型: 单人讲解展示产品", "脚本标签: 稍微变动"],
      personalTags: script.personalTags || [],
      associatedWorks: script.associatedWorks && script.associatedWorks.length > 0 ? script.associatedWorks : [
        {
          id: "w-11033274",
          numericId: "11033274",
          name: "0730-8835-复古耳环珠宝展示视频.mp4",
          type: "成片",
          coverUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
          status: "待审核",
          author: "张三",
          createdAt: "2026-08-04"
        },
        {
          id: "w-11033275",
          numericId: "11033275",
          name: "0801-美妆洗护自然透亮模特成片.mp4",
          type: "成片",
          coverUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
          status: "审核通过",
          author: "李四",
          createdAt: "2026-08-05"
        },
        {
          id: "w-11033276",
          numericId: "11033276",
          name: "0802-高腰提臀修身牛仔裤翻拍.mp4",
          type: "成片",
          coverUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
          status: "已上机",
          author: "王五",
          createdAt: "2026-08-05"
        },
        {
          id: "w-11033277",
          numericId: "11033277",
          name: "0803-居家生活厨房剪辑特写.mp4",
          type: "成片",
          coverUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
          status: "审核驳回",
          author: "赵六",
          createdAt: "2026-08-06"
        },
        {
          id: "w-11033278",
          numericId: "11033278",
          name: "0804-运动健身连体服街拍视频.mp4",
          type: "成片",
          coverUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80",
          status: "已搭",
          author: "钱七",
          createdAt: "2026-08-06"
        },
        {
          id: "w-11033279",
          numericId: "11033279",
          name: "0805-墨镜时尚穿搭展示成片.mp4",
          type: "成片",
          coverUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
          status: "审核通过",
          author: "孙八",
          createdAt: "2026-08-07"
        },
        {
          id: "w-2204101",
          numericId: "2204101",
          name: "鸡蛋裤冰丝透气拉扯特写.mp4",
          type: "素材",
          coverUrl: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800&auto=format&fit=crop&q=80",
          status: "审核通过",
          author: "摄制组",
          createdAt: "2026-08-03"
        },
        {
          id: "w-2204102",
          numericId: "2204102",
          name: "模特展示平缝腰头特写镜头.mp4",
          type: "素材",
          coverUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
          status: "已上机",
          author: "摄制组",
          createdAt: "2026-08-04"
        },
        {
          id: "w-3301001",
          numericId: "3301001",
          name: "鸡蛋裤平铺展台宣传海报.png",
          type: "图片",
          coverUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80",
          status: "审核通过",
          author: "设计组",
          createdAt: "2026-08-02"
        }
      ]
    });
  const [currentScript] = useTaggedResources("scripts", [baseCurrentScript]);
  const { store: configStore } = useResourceConfig();
  const CATEGORY_TREE = configStore.categories("scripts").map(n => ({ name: n.name, subs: n.children.map(c => c.name) }));

  // Task list in state (converted to TaskItem for TaskDetailPage integration)
  const [baseAssociatedTasks] = useState<TaskItem[]>([
    {
      id: "task-001",
      publisher: currentScript.author || "鲁月园",
      publishDate: "2026-06-25",
      deadlineDate: "2026-07-02",
      assignee: "张三 (剪辑组)",
      assigneeDeptPath: "剪辑一组 / 视频后发 / 张三",
      orderCount: 1,
      completedCount: 1,
      status: "completed",
      cost: 15,
      associatedScript: {
        title: currentScript.title,
        template: "种草口播",
        status: "可以拍摄"
      },
      associatedWorks: [
        { id: "v-101", name: "0623-MF-鲁月园-刘弯-大盘有量分解-3.mp4", type: "video" }
      ]
    },
    {
      id: "task-002",
      publisher: currentScript.author || "鲁月园",
      publishDate: "2026-06-28",
      deadlineDate: "2026-07-05",
      assignee: "李四 (拍摄组)",
      assigneeDeptPath: "拍摄一组 / 现场摄制 / 李四",
      orderCount: 2,
      completedCount: 1,
      status: "in_progress",
      cost: 20,
      associatedScript: {
        title: currentScript.title,
        template: "对标翻拍",
        status: "待审核"
      }
    }
  ]);
  const [taskRecords] = useTaskRecords();
  const associatedTaskList = [...taskRecords.filter(task => task.associatedScript?.id === currentScript.id), ...baseAssociatedTasks.filter(task => !taskRecords.some(item => item.id === task.id))];

  // Selected Task for viewing TaskDetailPage
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskItem | null>(null);

  // UI States & Navigation Tabs
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"tasks" | "works">("tasks");

  // Sub-tab for 关联作品: 成片 | 素材 | 图片 | 音频
  const [activeWorkType, setActiveWorkType] = useState<"成片" | "素材" | "图片" | "音频">("成片");

  // Filter States for 关联作品 matching user screenshot
  const [workFilterCat1, setWorkFilterCat1] = useState("全部");
  const [workFilterCat2Search, setWorkFilterCat2Search] = useState("");
  const [workFilterCat2, setWorkFilterCat2] = useState("全部");
  const [workFilterStatus, setWorkFilterStatus] = useState("全部");
  const [workFilterPublicTagSearch, setWorkFilterPublicTagSearch] = useState("");
  const [workFilterPublicTag, setWorkFilterPublicTag] = useState("全部");
  const [workFilterPersonalTagSearch, setWorkFilterPersonalTagSearch] = useState("");
  const [workFilterPersonalTag, setWorkFilterPersonalTag] = useState("全部");

  const [workSortBy, setWorkSortBy] = useState("最新发布");
  const [workAdPlatform, setWorkAdPlatform] = useState("不限广告平台标签");
  const [workCostRange, setWorkCostRange] = useState("不限");
  const [workAutoTag, setWorkAutoTag] = useState("请选择系统自动标签");

  const [workSelectAuthor, setWorkSelectAuthor] = useState("");
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const [workViewMode, setWorkViewMode] = useState<"grid" | "list">("grid");

  // Basic Info Modals (Matching FinishedVideoDetailModal / MaterialsView)
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState(currentScript.title);

  const [showModifyCategoryModal, setShowModifyCategoryModal] = useState(false);
  const [editCategoryInput, setEditCategoryInput] = useState(currentScript.basicType || "女士内衣");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(true);
  const [selectedPrimaryCat, setSelectedPrimaryCat] = useState("宠物食品");
  const [tempCategoryPath, setTempCategoryPath] = useState(currentScript.basicType || "女士内衣");

  const [showPublicTagModal, setShowPublicTagModal] = useState(false);
  const [publicTagSearch, setPublicTagSearch] = useState("");
  const [tempAddedPublicTags, setTempAddedPublicTags] = useState<string[]>(currentScript.publicTags || []);
  const [selectedPublicGroupKey, setSelectedPublicGroupKey] = useState<string>("模特");
  const [publicGroupSearch, setPublicGroupSearch] = useState<string>("");
  const [publicSubSearch, setPublicSubSearch] = useState<string>("");
  const [publicPresetTab, setPublicPresetTab] = useState<"我的预设" | "分享给我">("我的预设");

  const [showPersonalTagModal, setShowPersonalTagModal] = useState(false);
  const [personalTagSearch, setPersonalTagSearch] = useState("");
  const [tempAddedPersonalTags, setTempAddedPersonalTags] = useState<string[]>(currentScript.personalTags || []);
  const [selectedPersonalGroupKey, setSelectedPersonalGroupKey] = useState<string>("Zs测试一");
  const [personalGroupSearch, setPersonalGroupSearch] = useState<string>("");
  const [personalSubSearch, setPersonalSubSearch] = useState<string>("");

  const [showAuditStatusModal, setShowAuditStatusModal] = useState(false);
  const [auditStatusInput, setAuditStatusInput] = useState("");
  const [auditNotesInput, setAuditNotesInput] = useState("");
  const scriptStatuses = configStore.statuses("scripts");
  const auditStatusValid = scriptStatuses.some(status => status.name === auditStatusInput);

  // Task Creation Modal (Matching TaskCollaborationView exactly)
  const [showPublishTaskModal, setShowPublishTaskModal] = useState(false);
  const [taskFormState, setTaskFormState] = useState({
    assigneePath: "",
    orderCount: 1 as number | string,
    deadlineDate: "2026-08-15",
    visibilityType: "none" as "none" | "specified",
    visibilityRange: "public" as "public" | "public_resource" | "specified_range",
    specifiedTeam: "",
    specifiedGroup: "",
    specifiedPerson: "",
    publicDate: new Date().toISOString().split("T")[0],
    remark: "",
    product: "得力双头马克笔",
    scriptType: "爆款拆解"
  });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});
  const { fields: taskFields, settings: taskSettings } = useTaskFields();
  const [taskCustomValues, setTaskCustomValues] = useState<TaskFieldValues>({});
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [activeDeptIndex, setActiveDeptIndex] = useState<number | null>(0);
  const [activeSubGroupIndex, setActiveSubGroupIndex] = useState<number | null>(0);

  // Upload Video Modal (Bottom Action 1)
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(false);
  const [uploadVideoName, setUploadVideoName] = useState(`${currentScript.title}_成片视频.mp4`);
  const [uploadVideoType, setUploadVideoType] = useState<"video" | "image">("video");

  // Link Works Modal (Bottom Action 2)
  const [showLinkWorkModal, setShowLinkWorkModal] = useState(false);

  // Other Modals
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showOpLogsModal, setShowOpLogsModal] = useState(false);

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    showToast(`已复制${label}到剪贴板！`);
  };

  // Operation Logs mock
  const [opLogs] = useState([
    { id: "log-1", user: "鲁月园", action: "创建脚本", time: "2026-06-24 15:59:49" },
    { id: "log-2", user: "张三 (审核)", action: "修改状态为 [待审核]", time: "2026-06-25 09:12:00" },
    { id: "log-3", user: "李四 (编导)", action: "关联公共标签 [题材类型: 单人讲解展示产品]", time: "2026-06-26 14:30:15" }
  ]);

  // Update Script Helper
  const updateCurrentScript = (part: Partial<ScriptItem>) => {
    if (part.status !== undefined) configStore.assign("scripts", currentScript, { status: part.status });
    if (part.basicType !== undefined) configStore.assign("scripts", currentScript, { category: part.basicType });
    if (part.publicTags) resourceTagStore.assign("scripts", currentScript, "public", part.publicTags);
    if (part.personalTags) resourceTagStore.assign("scripts", currentScript, "personal", part.personalTags);
    const updated = { ...currentScript, ...part };
    setCurrentScript(updated);
    if (onUpdateScript) onUpdateScript(updated);
  };

  // Submit Task Creation Form (Matching TaskCollaborationView exactly)
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskSettings.enabled) { showToast("任务功能已关闭"); return; }
    const errors: Record<string, string> = {};

    if (!taskFormState.assigneePath) {
      errors.assigneePath = "请选择指派人员/部门";
    }
    if (!taskFormState.orderCount || Number(taskFormState.orderCount) <= 0) {
      errors.orderCount = "请输入有效下单数量";
    }
    if (!taskFormState.deadlineDate) {
      errors.deadlineDate = "请选择出片日期";
    }
    Object.assign(errors, taskFieldErrors(taskFields, taskCustomValues));

    if (Object.keys(errors).length > 0) {
      setTaskFormErrors(errors);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .border-rose-500')?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }

    const assigneeName = taskFormState.assigneePath.split("/").pop()?.trim() || "未指定";

    const newTask = createScriptTask(currentScript, taskFormState, taskFields, taskCustomValues);

    addTaskRecord(newTask);
    updateCurrentScript({ tasksCount: (currentScript.tasksCount || 0) + 1 });
    setShowPublishTaskModal(false);
    showToast(`✅ 关联任务《${currentScript.title}》发布成功！已自动关联当前脚本并在任务协作中心同步建立`);
  };

  // Submit Video Upload Form
  const handleUploadVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadVideoName.trim()) return;

    const newWork: AssociatedWorkItem = {
      id: `v-${Date.now().toString().slice(-4)}`,
      name: uploadVideoName.trim(),
      type: uploadVideoType === "video" ? "video" : "image"
    };

    const updatedWorks = [...(currentScript.associatedWorks || []), newWork];
    updateCurrentScript({ associatedWorks: updatedWorks });
    setShowUploadVideoModal(false);
    showToast(`✅ 视频《${newWork.name}》上传成功，并已关联至当前脚本！`);
  };

  const libraryWorkIds = new Set(LINKABLE_WORK_LIBRARY.map((item) => item.id));
  const linkableWorkOptions = [
    ...LINKABLE_WORK_LIBRARY,
    ...(currentScript.associatedWorks || [])
      .filter((work) => isVideoWork(work) && !libraryWorkIds.has(work.id))
      .map(associatedWorkToPickerItem),
  ];

  const confirmLinkedWorks = (selectedItems: VideoResourcePickerItem[]) => {
    const associatedWorks: AssociatedWorkItem[] = selectedItems.map((item) => ({
      id: item.id,
      numericId: item.id.replace(/\D/g, "") || item.id,
      name: item.name,
      type: item.section,
      coverUrl: item.cover,
      status: item.status,
      author: item.author,
      createdAt: "2026-09-07",
      category: `${item.primaryCategory} / ${item.secondaryCategory}`,
      publicTags: item.tags,
      duration: item.duration,
      size: item.size,
    }));
    updateCurrentScript({ associatedWorks });
    setShowLinkWorkModal(false);
    showToast(associatedWorks.length ? `已关联 ${associatedWorks.length} 个视频` : "已清空关联作品");
  };

  // Render TaskDetailPage if selected
  if (selectedTaskForDetail) {
    return (
      <TaskDetailPage
        task={selectedTaskForDetail}
        onBack={() => setSelectedTaskForDetail(null)}
        onShowToast={showToast}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100/80 p-4 md:p-6 space-y-4 text-slate-800 font-sans relative">
      {/* Toast Floating Banner */}
      {toastMessage && (
        <OverlayPortal layer="toast" role="status" className="fixed top-6 right-6 z-[120] bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="whitespace-pre-line">{toastMessage}</span>
        </OverlayPortal>
      )}

      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-purple-600 font-bold text-xs transition-colors cursor-pointer group"
        >
          <div className="p-1.5 bg-slate-100 group-hover:bg-purple-100 text-slate-500 group-hover:text-purple-600 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>返回脚本列表</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
            ID: {currentScript.id}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-bold">脚本详情</span>
        </div>
      </div>

      {/* 2. TOP SECTION: BASIC INFO CARD (Matching FinishedVideoDetailModal & MaterialsView UI) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* LEFT: Author, Title, Category, Public & Personal Tags */}
          <div className="space-y-3.5 flex-1 min-w-0">
            {/* Publisher Info Row */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                {currentScript.author?.charAt(0) || "鲁"}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{currentScript.publisherGroup}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  发布时间：{currentScript.createdAt}
                </div>
              </div>
            </div>

            {/* Basic Details List */}
            <div className="space-y-2.5 pt-1 text-xs">
              {/* Badge & Category Row */}
              <div className="flex items-center gap-3">
                <span className="w-20 text-slate-500 font-medium shrink-0">脚本区</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-800 font-bold">{currentScript.basicType}</span>
                  <button
                    onClick={() => {
                      const currentCat = currentScript.basicType || "演示分类 / 卸妆油";
                      setEditCategoryInput(currentCat);
                      setTempCategoryPath(currentCat);
                      setSelectedPrimaryCat("宠物食品");
                      setIsCategoryDropdownOpen(true);
                      setShowModifyCategoryModal(true);
                    }}
                    className="text-slate-400 hover:text-purple-600 cursor-pointer p-0.5 flex items-center gap-1 font-medium hover:underline text-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-purple-600">修改</span>
                  </button>
                </div>
              </div>

              {/* Title Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-20 text-slate-500 font-medium shrink-0">脚本标题</span>
                <span className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                  <span>{currentScript.title}</span>
                  <button
                    onClick={() => {
                      setEditTitleInput(currentScript.title);
                      setShowEditTitleModal(true);
                    }}
                    className="text-slate-400 hover:text-purple-600 cursor-pointer p-0.5"
                    title="修改标题"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>

              {/* Public Tags Row */}
              <div className="flex items-start gap-3">
                <span className="w-20 text-slate-500 font-medium shrink-0 pt-1">公共标签</span>
                <div className="flex flex-wrap items-center gap-2">
                  {currentScript.publicTags?.map((tag, idx) => (
                    <span key={idx} className="bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/60 flex items-center">
                      <span>{tag}</span>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      setTempAddedPublicTags(currentScript.publicTags || []);
                      setShowPublicTagModal(true);
                    }}
                    className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer py-1 hover:underline"
                  >
                    <span>+ 添加公共标签</span>
                  </button>
                </div>
              </div>

              {configStore.statusEnabled("scripts") && <div className="flex items-center gap-3">
                <span className="w-20 text-slate-500 font-medium shrink-0">脚本状态</span>
                <ResourceStatusBadge scope="scripts" status={currentScript.status} />
                <button type="button" onClick={() => {
                  setAuditStatusInput(currentScript.status);
                  setAuditNotesInput(currentScript.auditNotes ?? "");
                  setShowAuditStatusModal(true);
                }} className="text-purple-600 text-xs hover:underline">修改状态并批注</button>
              </div>}

              {/* Personal Tags Row */}
              <div className="flex items-start gap-3">
                <span className="w-20 text-slate-500 font-medium shrink-0 pt-1">个人标签</span>
                <div className="flex flex-wrap items-center gap-2">
                  {currentScript.personalTags?.length === 0 ? (
                    <span className="text-slate-400 text-xs italic py-1">无</span>
                  ) : (
                    currentScript.personalTags?.map((tag, idx) => (
                      <span key={idx} className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-purple-100 flex items-center gap-1">
                        <span>{tag}</span>
                        <button
                          onClick={() => {
                            const updated = currentScript.personalTags?.filter((_, i) => i !== idx) || [];
                            updateCurrentScript({ personalTags: updated });
                          }}
                          className="text-purple-400 hover:text-rose-500 ml-0.5 cursor-pointer text-xs"
                          title="删除标签"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                  <button
                    onClick={() => {
                      setTempAddedPersonalTags(currentScript.personalTags || []);
                      setShowPersonalTagModal(true);
                    }}
                    className="text-purple-600 hover:text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer py-1 hover:underline"
                  >
                    <span>+ 添加个人标签</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Metric Cards & Action Buttons */}
          <div className="space-y-3 shrink-0 lg:w-96">
            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/90 border border-slate-200/90 p-3 rounded-2xl text-center space-y-1">
                <div className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>关联任务数</span>
                </div>
                <div className="text-xl font-extrabold text-purple-700 font-mono">
                  {associatedTaskList.length}
                </div>
              </div>

              <div className="bg-slate-50/90 border border-slate-200/90 p-3 rounded-2xl text-center space-y-1">
                <div className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>关联视频消耗</span>
                </div>
                <div className="text-xl font-extrabold text-purple-700 font-mono">
                  0
                </div>
              </div>
            </div>

            {/* Share, Publish Task & More */}
            <div className="flex items-center gap-2 text-xs font-bold relative">
              {/* Share / Copy Link */}
              <button
                onClick={() => {
                  const url = `http://ygj-zssoft.sucaicloud.com/#/script-detail/${currentScript.id}`;
                  navigator.clipboard.writeText(url).catch(() => {});
                  showToast(`已复制脚本链接！\n${url}`);
                }}
                className="p-2 bg-white border border-slate-200 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                title="分享链接"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* 发布任务 (Task Collaboration Task Creation Modal matching TaskCollaborationView) */}
              <button
                onClick={() => {
                  setTaskFormState({
                    ...taskFormState,
                    assigneePath: "剪辑一组 / 视频后发 / 张三"
                  });
                  setShowPublishTaskModal(true);
                  if (!taskSettings.enabled) { setShowPublishTaskModal(false); showToast("任务功能已关闭"); return; }
                  setTaskCustomValues({});
                  setTaskFormErrors({});
                }}
                className="flex-1 py-2 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl transition-colors cursor-pointer text-center whitespace-nowrap shadow-2xs"
              >
                发布任务
              </button>

              {/* 更多操作 ∨ Dropdown Trigger */}
              <div className="relative">
                <button
                  ref={moreButtonRef}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="py-2 px-3 bg-white border border-purple-500 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <span>更多操作</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown Menu */}
                {showMoreMenu && (
                  <AnchoredPopover
                    anchorRef={moreButtonRef}
                    align="end"
                    width={144}
                    gap={4}
                    onClose={() => setShowMoreMenu(false)}
                    className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs font-medium text-slate-700"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <button
                      onClick={() => setShowTasksModal(true)}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors cursor-pointer block"
                    >
                      查看关联任务
                    </button>
                    <button
                      onClick={() => setShowOpLogsModal(true)}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors cursor-pointer block"
                    >
                      操作记录
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确定要删除脚本《${currentScript.title}》吗？`)) {
                          if (onDeleteScript) onDeleteScript(currentScript.id);
                          onBack();
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer block font-bold"
                    >
                      删除
                    </button>
                  </AnchoredPopover>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 3. MIDDLE SECTION: "脚本内容" MODULE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden relative">


        {/* Part A: 脚本分镜拆解 Table matching Image 1 */}
        <div className="flex relative border-b border-slate-200/80 overflow-x-auto">
          {/* Left Vertical Label Column: 二创衍生 */}
          <div className="w-12 bg-[#EBE5F7] text-slate-800 font-bold flex flex-col items-center justify-center shrink-0 border-r border-purple-200/80 select-none py-6">
            <span className="text-xs font-bold text-slate-700 tracking-widest [writing-mode:vertical-lr]">
              二创衍生
            </span>
          </div>

          {/* Main Table */}
          <div className="flex-1 min-w-[800px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F0FF] text-slate-800 font-bold border-b border-purple-100">
                  <th className="py-3 px-3 w-12 text-center border-r border-purple-100/80">序号</th>
                  <th className="py-3 px-4 w-1/3 border-r border-purple-100/80">
                    <div className="flex items-center justify-between">
                      <span>对标文案、故事线</span>
                      <button
                        onClick={() => copyToClipboard(currentScript.content, "对标文案")}
                        className="text-purple-600 hover:text-purple-800 p-1 cursor-pointer"
                        title="复制本列"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-1/3 border-r border-purple-100/80">
                    <div className="flex items-center justify-between">
                      <span>二创衍生文案</span>
                      <button
                        onClick={() => copyToClipboard(currentScript.derivedContent || "", "二创衍生文案")}
                        className="text-purple-600 hover:text-purple-800 p-1 cursor-pointer"
                        title="复制本列"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-3 px-4 border-r border-purple-100/80">
                    <div className="flex items-center justify-between">
                      <span>脚本特别补充</span>
                      <button
                        onClick={() => copyToClipboard(currentScript.specialSupplement || "", "脚本特别补充")}
                        className="text-purple-600 hover:text-purple-800 p-1 cursor-pointer"
                        title="复制本列"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-44 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[#E05263] font-bold">审核批注</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="align-top border-b border-slate-100">
                  {/* 序号 cell - strictly contains number 1 */}
                  <td className="py-4 px-2 text-center font-bold text-slate-800 border-r border-slate-200/80">
                    1
                  </td>

                  {/* 对标文案、故事线 */}
                  <td className="py-4 px-4 text-slate-800 leading-relaxed font-sans border-r border-slate-200/80 whitespace-pre-wrap">
                    {currentScript.content || `[00:00] Speaker 1: 其实我挺感谢咱家粉丝姐妹推荐我这条鸡蛋裤。其实我夏天吧，愿意穿大色，但是一穿上那个下边配芭比裤的时候气一下汗，一脱下来哈，槽我就槽的虎的。就这个小裤，你看它就是可薄可薄的了，而且弹力特别特别好。你看我这个大拇指甲轻了，这么一撑都能看出来。关键吧，它下面做的是这种平缝的，就不能勒一个大棱子。你看我这手指甲多长呢，你就这么勾住它哈，一点儿都不勾丝呀，也不起套子啥的。我这不是穿一调整挺好嘛，我又整一条，我就寻思夏天搭配着穿呗。就是它这个弹力真的特别好，所以说你有一点肉肉的姐妹穿它，你完全不会觉得有那个紧绷感啥的哈。主要是把它这个腰头做的，看到没？够高！就是你来回坐着的时候吧，它不会卷边，也不会往下出溜。尤其是像我这年纪大了哈，我就感觉我腿上有花纹，就是直接露大腿，就是没什么自信。哎，穿着大色的时候吧，都不愿意穿短裤，就愿意穿，之前是愿意穿那个芭比裤，现在吧，就直接穿它，因为穿上它之后吧，顺便能修饰一下咱们的那个腿型，它这个颜色就不是那种贼亮贼亮哈，这种吧，有点儿像哑光似的，穿上吧，就是有一种那种高级感`}
                  </td>

                  {/* 二创衍生文案 */}
                  <td className="py-4 px-4 text-slate-800 leading-relaxed font-sans border-r border-slate-200/80 whitespace-pre-wrap">
                    {currentScript.derivedContent || `模特腿部画面一点疤痕\n\n其实我挺感谢咱家粉丝姐妹推荐我这条鸡蛋裤。其实我夏天吧，愿意穿大色，但是一穿上那个下边配芭比裤的时候气一下汗，一脱下来哈，槽我就槽的虎的。就这个小裤，你看它就是可薄可薄的了（运镜特写——参考对标），而且弹力特别特别好。你看我这个大拇指甲轻了，这么一撑都能看出来。关键吧，它下面做的是这种平缝的，就不能勒一个大棱子。你看我这手指甲多长呢，你就这么勾住它哈，一点儿都不勾丝呀，也不起套子啥的。（分镜拍）不是穿一调整挺好嘛，我又整一条，我就寻思夏天搭配着穿呗。就是它这个弹力哈哈的特别好，所以说你有一点肉肉的姐妹穿它，你完全不会觉得有那个紧绷感啥的哈。主要是把它这个腰头做的，你看到没？够高！就是你来回坐着的时候吧，它不会卷边，也不会往下出溜。尤其是像我这年纪大了哈，我就感觉我腿上有花纹，就是直接露大腿，就是没什么自信。哎，穿着大衫的时候吧，都不愿意穿短裤，就是愿意穿，之前是愿意穿那个芭比裤，现在吧，就直接穿它，因为穿上它之后吧，顺便能修饰一下咱们的那个腿型，它这个颜色就不是那种贼亮贼亮哈，这种吧，有点儿像哑光似的，穿上吧，就是有一种那种高级感`}
                  </td>

                  {/* 脚本特别补充 */}
                  <td className="py-4 px-4 text-slate-600 leading-relaxed border-r border-slate-200/80 whitespace-pre-wrap">
                    {currentScript.specialSupplement || ""}
                  </td>

                  {/* 审核批注 */}
                  <td className="py-4 px-4 text-purple-700 font-bold whitespace-pre-wrap break-words" data-testid="script-audit-notes">
                    {currentScript.auditNotes || ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Part B: 脚本属性明细 matching Image 2 */}
        <div className="divide-y divide-slate-100 text-xs bg-white">
          {/* Row 1: 脚本类型 (大类) */}
          <div className="flex items-stretch border-b border-slate-100">
            <div className="w-52 bg-[#EFE9FA] text-slate-800 font-bold p-3.5 flex items-center shrink-0 border-r border-slate-200/80">
              脚本类型（大类）
            </div>
            <div className="p-3.5 text-slate-800 flex-1 flex items-center font-medium">
              {currentScript.classTag || ""}
            </div>
          </div>

          {/* Row 2: 对标视频 */}
          <div className="flex items-stretch border-b border-slate-100">
            <div className="w-52 bg-[#EFE9FA] text-slate-800 font-bold p-3.5 flex items-center shrink-0 border-r border-slate-200/80">
              对标视频
            </div>
            <div className="p-3.5 text-purple-600 font-bold flex-1 flex items-center hover:underline cursor-pointer">
              {currentScript.benchmarkVideo || "0623-MF-鲁月园-刘弯-大盘有量分解-3.mp4"}
            </div>
          </div>

          {/* Row 3: 模特选择 */}
          <div className="flex items-stretch border-b border-slate-100">
            <div className="w-52 bg-[#EFE9FA] text-slate-800 font-bold p-3.5 flex items-center shrink-0 border-r border-slate-200/80">
              模特选择
            </div>
            <div className="p-3.5 text-slate-800 flex-1 flex items-center font-medium">
              {currentScript.modelSelect || ""}
            </div>
          </div>

          {/* Row 4: 场景选择 */}
          <div className="flex items-stretch border-b border-slate-100">
            <div className="w-52 bg-[#EFE9FA] text-slate-800 font-bold p-3.5 flex items-center shrink-0 border-r border-slate-200/80">
              场景选择
            </div>
            <div className="p-3.5 text-slate-800 flex-1 flex items-center font-medium">
              {currentScript.sceneSelect || ""}
            </div>
          </div>

          {/* Row 5: 个人理解该本子的爆点精髓 */}
          <div className="flex items-stretch">
            <div className="w-52 bg-[#EFE9FA] text-slate-800 font-bold p-3.5 flex items-center shrink-0 border-r border-slate-200/80">
              个人理解该本子的爆点精髓
            </div>
            <div className="p-3.5 text-slate-800 flex-1 flex items-center font-medium leading-relaxed">
              {currentScript.coreHighlight || ""}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: ASSOCIATED TASKS & WORKS (关联任务 & 关联作品 - Matching Image 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        {/* Header Bar with Segmented Tabs on Left & FIXED Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Left Segmented Tab Group */}
          <div className="inline-flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveBottomTab("tasks")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBottomTab === "tasks"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-transparent text-slate-600 hover:text-purple-600"
              }`}
            >
              关联任务
            </button>
            <button
              onClick={() => setActiveBottomTab("works")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBottomTab === "works"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-transparent text-slate-600 hover:text-purple-600"
              }`}
            >
              关联作品
            </button>
          </div>

          {/* Right Action Buttons - ALWAYS FIXED regardless of active tab (Per User Instruction) */}
          <div className="flex items-center gap-2">
            <div className="relative group inline-block">
              <button
                onClick={() => setShowUploadVideoModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer relative"
              >
                <span>上传视频</span>
                <Info className="w-3.5 h-3.5 text-white/90 shrink-0" />
              </button>

              {/* Tooltip on hover matching reference image */}
              <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out z-50">
                <div className="bg-[#2B2B2E] text-white text-[12px] font-normal leading-relaxed px-4 py-2 rounded-md shadow-xl border border-slate-700/60 whitespace-nowrap text-center">
                  请注意，直接给脚本上传视频，不会与任务产生关联（不计算出片进度）。
                </div>
                {/* Arrow pointing down */}
                <div className="w-0 h-0 border-x-5 border-x-transparent border-t-6 border-t-[#2B2B2E] mx-auto -mt-px" />
              </div>
            </div>

            <button
              onClick={() => setShowLinkWorkModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>关联作品</span>
            </button>
          </div>
        </div>

        {/* Tab 1: 关联任务 Table matching Image 2 headers: 下单 | 出片 | 出片进度 | 备注 | 操作 */}
        {activeBottomTab === "tasks" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F6FC] text-slate-700 font-bold border-b border-slate-200/80">
                  <th className="py-3 px-5 w-1/5">下单</th>
                  <th className="py-3 px-5 w-1/5">出片</th>
                  <th className="py-3 px-5 w-1/5">出片进度</th>
                  <th className="py-3 px-5 w-1/4">备注</th>
                  <th className="py-3 px-5 text-right w-24">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {associatedTaskList.length === 0 ? (
                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-700">2026-08-04 11:30 (张三)</td>
                    <td className="py-3 px-5 text-slate-600 font-medium">2026-08-05 18:00 (李四)</td>
                    <td className="py-3 px-5">
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-[11px] font-bold">
                        进行中 (80%)
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-500">已完成二创文案初稿，等待成片上传</td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => showToast("正在查看任务详情...")}
                        className="text-purple-600 hover:text-purple-700 hover:underline font-bold cursor-pointer"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ) : (
                  associatedTaskList.map((task: any) => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{task.createdAt || task.deadlineDate} ({task.creator || "张三"})</td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">{task.deadlineDate} ({task.assignee})</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          task.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          task.status === "in_progress" ? "bg-purple-100 text-purple-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {task.status === "completed" ? "已完成 (100%)" : task.status === "in_progress" ? "进行中 (60%)" : "待处理 (0%)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 truncate max-w-xs">{task.description || "关联脚本二创生产任务"}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="text-purple-600 hover:text-purple-700 hover:underline font-bold cursor-pointer"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tab 2: 关联作品 Module with 4 Sub-Tabs (成片, 素材, 图片, 音频) & Filter Module matching User Screenshot */
          <div className="space-y-4">
            {/* 1. Sub-Tab Category Options */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              {(["成片", "素材", "图片", "音频"] as const).map((type) => {
                const count = (currentScript.associatedWorks || []).filter(
                  (w: any) =>
                    w.type === type ||
                    (type === "成片" && w.type === "video") ||
                    (type === "素材" && w.type === "material") ||
                    (type === "图片" && w.type === "image") ||
                    (type === "音频" && w.type === "audio")
                ).length;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveWorkType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeWorkType === type
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-purple-600"
                    }`}
                  >
                    <span>{type}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeWorkType === type ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. Filter Module matching User Screenshot */}
            <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 space-y-3.5 text-xs">
              {/* Row 1: 常用筛选预设 */}
              <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-200/50 pb-2.5">
                <div className="flex items-center gap-2 shrink-0">
                  <select className="border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-600 text-xs focus:outline-none cursor-pointer">
                    <option>选择常用筛选预设</option>
                    <option>近7天爆款剪辑</option>
                    <option>审核通过投流套件</option>
                  </select>
                  <button
                    onClick={() => showToast("已保存常用筛选预设！")}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    保存
                  </button>
                </div>
              </div>

              {/* Row 2: 一级分类 */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/50 pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-900 font-bold shrink-0 w-20 text-right pr-2">一级分类：</span>
                  {[
                    "全部",
                    "女士内衣",
                    "女士内裤",
                    "女士睡衣",
                    "塑身裤",
                    "塑身衣",
                    "保暖内衣",
                    "少女内衣",
                    "袜子",
                    "男士内裤",
                    "男士睡衣",
                    "购买达人视频"
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => setWorkFilterCat1(item)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        workFilterCat1 === item
                          ? "bg-purple-600 text-white font-bold"
                          : "bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/80"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => showToast("已展开更多一级分类")}
                  className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-0.5 shrink-0 cursor-pointer"
                >
                  <span>更多</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 3: 二级分类 */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/50 pb-2.5">
                <span className="font-bold text-slate-800 w-16 shrink-0">二级分类:</span>
                <div className="relative shrink-0 w-36">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜索分类"
                    value={workFilterCat2Search}
                    onChange={(e) => setWorkFilterCat2Search(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                {["全部", "抹胸款", "无钢圈", "聚拢款", "蕾丝杯面", "无痕塑形", "爆款走秀", "高弹透气", "情侣套盒", "收腹高腰"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setWorkFilterCat2(item)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        workFilterCat2 === item
                          ? "bg-purple-600 text-white font-bold"
                          : "bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/80"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              {/* Row 4: 状态 */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/50 pb-2.5">
                <span className="font-bold text-slate-800 w-16 shrink-0">状态:</span>
                {["全部", "待审核", "审核通过", "审核驳回", "已修改", "二次修改", "已上机", "已搭", "放弃"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setWorkFilterStatus(item)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      workFilterStatus === item
                        ? "bg-purple-600 text-white font-bold"
                        : "bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/80"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Row 5: 公共标签 */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/50 pb-2.5">
                <span className="font-bold text-slate-800 w-16 shrink-0">公共标签:</span>
                <div className="relative shrink-0 w-36">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜索二级标签"
                    value={workFilterPublicTagSearch}
                    onChange={(e) => setWorkFilterPublicTagSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                {[
                  "全部",
                  "姓名",
                  "投放平台 (成片必选标签)",
                  "腾讯广告",
                  "快手投手",
                  "达人姓名",
                  "素材类型",
                  "草本剪辑",
                  "8015-摄影/编导 (基础)",
                  "草本8015摄影师",
                  "达人标签",
                  "8018-沈阳分组"
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() => setWorkFilterPublicTag(item)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      workFilterPublicTag === item
                        ? "bg-purple-600 text-white font-bold"
                        : "bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/80"
                    }`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setWorkFilterPublicTag("全部");
                    setWorkFilterPublicTagSearch("");
                  }}
                  className="text-slate-400 hover:text-slate-600 ml-auto text-xs cursor-pointer"
                >
                  重置公共标签
                </button>
              </div>

              {/* Row 6: 个人标签 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-800 w-16 shrink-0">个人标签:</span>
                <div className="relative shrink-0 w-36">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜索二级标签"
                    value={workFilterPersonalTagSearch}
                    onChange={(e) => setWorkFilterPersonalTagSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                {["全部", "无个人标签", "有个人标签"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setWorkFilterPersonalTag(item)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      workFilterPersonalTag === item
                        ? "bg-purple-600 text-white font-bold"
                        : "bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/80"
                    }`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setWorkFilterPersonalTag("全部");
                    setWorkFilterPersonalTagSearch("");
                  }}
                  className="text-slate-400 hover:text-slate-600 ml-auto text-xs cursor-pointer flex items-center gap-1"
                >
                  <span>重置个人标签</span>
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 3. Advanced Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <span className="text-slate-900 font-bold shrink-0">高级搜索：</span>

                {/* 排序 */}
                <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
                  <span className="text-slate-900 font-bold shrink-0">排序：</span>
                  <select
                    value={workSortBy}
                    onChange={(e) => setWorkSortBy(e.target.value)}
                    className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option>最新发布</option>
                    <option>最早发布</option>
                    <option>消耗最高</option>
                  </select>
                </div>

                {/* 广告平台标签 */}
                <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
                  <span className="text-slate-900 font-bold shrink-0">广告平台标签：</span>
                  <select
                    value={workAdPlatform}
                    onChange={(e) => setWorkAdPlatform(e.target.value)}
                    className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option>不限广告平台标签</option>
                    <option>巨量引擎</option>
                    <option>腾讯广告</option>
                    <option>快手磁力</option>
                  </select>
                </div>

                {/* 消耗 */}
                <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
                  <span className="text-slate-900 font-bold shrink-0">消耗：</span>
                  <select
                    value={workCostRange}
                    onChange={(e) => setWorkCostRange(e.target.value)}
                    className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option>不限</option>
                    <option>&gt; 1000元</option>
                    <option>&gt; 5000元</option>
                  </select>
                </div>

                {/* 系统自动标签 */}
                <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs">
                  <span className="text-slate-900 font-bold shrink-0">系统自动标签：</span>
                  <select
                    value={workAutoTag}
                    onChange={(e) => setWorkAutoTag(e.target.value)}
                    className="bg-transparent font-normal text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option>请选择系统自动标签</option>
                    <option>优质文案</option>
                    <option>爆款二创</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => showToast("已筛选相关作品数据")}
                  className="border border-purple-600 text-purple-600 hover:bg-purple-50 font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>筛选</span>
                </button>
                <button
                  onClick={() => {
                    setWorkFilterCat1("全部");
                    setWorkFilterCat2("全部");
                    setWorkFilterStatus("全部");
                    setWorkFilterPublicTag("全部");
                    setWorkFilterPersonalTag("全部");
                    showToast("已重置筛选条件");
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  重置
                </button>
              </div>
            </div>

            {/* 4. Action Toolbar */}
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <button className="bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-lg font-bold text-slate-700 cursor-pointer shadow-2xs">
                  选择
                </button>
                <label className="flex items-center gap-1.5 text-slate-600 font-medium cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                  <span>选中本页</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <select
                    value={workSelectAuthor}
                    onChange={(e) => setWorkSelectAuthor(e.target.value)}
                    className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">作者</option>
                    <option value="张三">张三</option>
                    <option value="李四">李四</option>
                  </select>
                  <input
                    type="text"
                    placeholder="请选择(支持输入搜索)"
                    className="border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none w-40"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <select className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer">
                    <option>上传时间</option>
                    <option>关联时间</option>
                  </select>
                  <input
                    type="date"
                    value={workStartDate}
                    onChange={(e) => setWorkStartDate(e.target.value)}
                    className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="date"
                    value={workEndDate}
                    onChange={(e) => setWorkEndDate(e.target.value)}
                    className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast("快捷分享已生成")}
                  className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-500 transition-colors cursor-pointer"
                  title="分享"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWorkViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    workViewMode === "grid"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "hover:bg-slate-200/80 text-slate-500"
                  }`}
                  title="网格视图"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWorkViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    workViewMode === "list"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "hover:bg-slate-200/80 text-slate-500"
                  }`}
                  title="列表视图"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 5. Resource Content Grid or Empty State */}
            {(() => {
              const items = (currentScript.associatedWorks || []).filter((w: any) => {
                const matchesType =
                  w.type === activeWorkType ||
                  (activeWorkType === "成片" && w.type === "video") ||
                  (activeWorkType === "素材" && w.type === "material") ||
                  (activeWorkType === "图片" && w.type === "image") ||
                  (activeWorkType === "音频" && w.type === "audio");

                if (!matchesType) return false;
                if (workFilterStatus !== "全部" && w.status && w.status !== workFilterStatus) {
                  return false;
                }
                return true;
              });

              if (items.length === 0) {
                return (
                  <div className="py-16 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Film className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">暂无关联的{activeWorkType}数据</p>
                    <p className="text-xs text-slate-400">当前脚本尚未关联{activeWorkType}作品，您可以随时上传或绑定</p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setShowUploadVideoModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>上传{activeWorkType}</span>
                      </button>
                      <button
                        onClick={() => setShowLinkWorkModal(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-purple-700 font-bold rounded-xl text-xs hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>关联{activeWorkType}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 pt-1">
                  {items.map((item: any) => {
                    const statusBg =
                      item.status === "待审核"
                        ? "bg-[#FF4D4F]"
                        : item.status === "审核通过"
                        ? "bg-[#00B96B]"
                        : item.status === "已上机"
                        ? "bg-[#722ED1]"
                        : item.status === "审核驳回"
                        ? "bg-[#CF1322]"
                        : item.status === "已搭"
                        ? "bg-[#1677FF]"
                        : "bg-purple-600";

                    return (
                      <div
                        key={item.id}
                        className="group relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
                      >
                        {/* Aspect 3/4 Thumbnail Container */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900/90">
                          <img
                            src={
                              item.coverUrl ||
                              "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Top-Left Category Ribbon (Cyan) */}
                          <div className="absolute top-0 left-0 bg-[#00BCD4] text-white font-bold text-[10px] px-2 py-0.5 rounded-br-lg shadow-2xs tracking-wider z-10">
                            {activeWorkType}
                          </div>

                          {/* ID Badge directly under category tag */}
                          <div className="absolute top-6 left-2 bg-black/65 text-white font-mono text-[10px] px-1.5 py-0.5 rounded backdrop-blur-xs z-10">
                            ID: {item.numericId || item.id.replace(/\D/g, "") || "11033274"}
                          </div>

                          {/* Top-Right Status Badge */}
                          <div
                            className={`absolute top-0 right-0 ${statusBg} text-white font-bold text-[10px] px-2.5 py-0.5 rounded-bl-lg shadow-2xs z-10`}
                          >
                            {item.status || "待审核"}
                          </div>

                          {/* Hover Action Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                            <button
                              onClick={() => showToast(`正在查看《${item.name}》`)}
                              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-purple-700 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                              title="预览作品"
                            >
                              <Play className="w-4 h-4 fill-purple-700 ml-0.5" />
                            </button>
                            <button
                              onClick={() => {
                                const updated = currentScript.associatedWorks?.filter(
                                  (w: any) => w.id !== item.id
                                );
                                updateCurrentScript({ associatedWorks: updated });
                                showToast("已移除关联作品！");
                              }}
                              className="w-9 h-9 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                              title="移除关联"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-2.5 flex flex-col gap-1 bg-white">
                          <p
                            className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-purple-600 transition-colors"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <span>{item.author || "编导"}</span>
                            <span>{item.createdAt || "2026-08-04"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-3 text-xs text-slate-500 font-medium">
          <span>
            共{" "}
            {activeBottomTab === "tasks"
              ? associatedTaskList.length
              : (currentScript.associatedWorks || []).filter(
                  (w: any) =>
                    w.type === activeWorkType ||
                    (activeWorkType === "成片" && w.type === "video") ||
                    (activeWorkType === "素材" && w.type === "material") ||
                    (activeWorkType === "图片" && w.type === "image") ||
                    (activeWorkType === "音频" && w.type === "audio")
                ).length}{" "}
            条
          </span>
          <select className="border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none cursor-pointer">
            <option value="20">20条/页</option>
            <option value="50">50条/页</option>
          </select>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 bg-slate-100 rounded text-slate-400 cursor-not-allowed">&lt;</button>
            <button className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded">1</button>
            <button className="px-2 py-1 bg-slate-100 rounded text-slate-400 cursor-not-allowed">&gt;</button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Edit Title Modal (Matching FinishedVideoDetailModal UI) */}
      {showEditTitleModal && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="font-extrabold text-slate-900 text-sm">修改标题</h3>
              </div>
              <button onClick={() => setShowEditTitleModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <label className="font-bold text-slate-700 block">请输入新标题：</label>
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowEditTitleModal(false)} className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100">
                取消
              </button>
              <button
                onClick={() => {
                  if (editTitleInput.trim()) {
                    updateCurrentScript({ title: editTitleInput.trim() });
                    setShowEditTitleModal(false);
                    showToast("已更新脚本标题！");
                  }
                }}
                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
              >
                保存
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* MODAL 2: Modify Category Modal (修改分类 Modal - matching Image 1) */}
      {showModifyCategoryModal && (
        <ResourceCategoryModal scope="scripts" initialCategory={currentScript.basicType} onClose={() => setShowModifyCategoryModal(false)} onConfirm={value => { updateCurrentScript({ basicType: value }); setShowModifyCategoryModal(false); showToast("分类修改成功"); }} />
      )}

      {/* MODAL 3: Audit Status Modal */}
      {showAuditStatusModal && (
        <ResourceEditDialog title="修改状态并批注" onClose={() => setShowAuditStatusModal(false)}
          disabled={!auditStatusValid}
          onConfirm={() => {
            if (!auditStatusValid) return;
            updateCurrentScript({ status: auditStatusInput, auditNotes: auditNotesInput.trim() });
            setShowAuditStatusModal(false);
            showToast("脚本状态和审核批注已更新");
          }}>
          <div className="space-y-5 text-xs">
            <div className="space-y-2">
              <label htmlFor="script-audit-status" className="block font-bold text-slate-700">脚本状态<span className="ml-1 text-rose-500" aria-hidden="true">*</span></label>
              <select id="script-audit-status" autoFocus required value={auditStatusValid ? auditStatusInput : ""}
                onChange={event => setAuditStatusInput(event.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
                <option value="" disabled>请选择状态</option>
                {scriptStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="script-audit-notes" className="block font-bold text-slate-700">审核批注<span className="ml-1 font-normal text-slate-400">（选填）</span></label>
              <textarea id="script-audit-notes" rows={4} value={auditNotesInput}
                onChange={event => setAuditNotesInput(event.target.value)} placeholder="请输入审核批注"
                className="w-full min-h-28 resize-y px-3 py-2.5 border border-slate-300 rounded-lg text-slate-800 leading-relaxed focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
            </div>
          </div>
        </ResourceEditDialog>
      )}

      {/* MODAL 4: Public Tag Modal (关联公共标签 Modal - Matching FinishedVideoDetailModal) */}
{showPublicTagModal && <ResourceTagModal kind="public" initialTags={currentScript.publicTags} onClose={() => setShowPublicTagModal(false)} onConfirm={(publicTags) => { updateCurrentScript({ publicTags }); showToast("公共标签已更新"); }} showToast={showToast} />}

      {/* MODAL 5: Personal Tag Modal (关联个人标签 Modal - Matching FinishedVideoDetailModal) */}
{showPersonalTagModal && <ResourceTagModal kind="personal" initialTags={currentScript.personalTags} onClose={() => setShowPersonalTagModal(false)} onConfirm={(personalTags) => { updateCurrentScript({ personalTags }); showToast("个人标签已更新"); }} showToast={showToast} />}

      {/* MODAL 6: Publish Task Modal (发布任务 Modal - EXACT SAME AS TaskCollaborationView) */}
      {showPublishTaskModal && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
            {/* Header: | 新增任务 */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  新增任务
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishTaskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* 1. * 指派给 */}
              <div className="flex items-start gap-3 relative">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0 flex items-center justify-end">
                  <span className="text-rose-500 mr-1">*</span>指派给
                </label>

                <div className="flex-1 min-w-0 relative">
                  <div
                    onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg flex items-center justify-between cursor-pointer font-medium text-slate-800 transition-colors ${
                      taskFormErrors.assigneePath ? "border-rose-500" : isDeptDropdownOpen ? "border-purple-500 bg-white ring-2 ring-purple-500/20" : "border-slate-200 hover:bg-slate-100/50"
                    }`}
                  >
                    {taskFormState.assigneePath ? (
                      <span className="inline-flex items-center gap-1.5 bg-purple-100/70 text-purple-900 px-2 py-0.5 rounded font-medium">
                        <span>{taskFormState.assigneePath}</span>
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-rose-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskFormState({ ...taskFormState, assigneePath: "" });
                          }}
                        />
                      </span>
                    ) : (
                      <span className="text-slate-400">请选择</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Cascader Dropdown */}
                  {isDeptDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full sm:w-[480px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 grid grid-cols-3 divide-x divide-slate-100 h-56 text-xs overflow-hidden">
                      {/* Column 1: Groups */}
                      <div className="overflow-y-auto py-1">
                        {DEPT_TREE.map((dept, idx) => (
                          <div
                            key={idx}
                            onMouseEnter={() => {
                              setActiveDeptIndex(idx);
                              setActiveSubGroupIndex(0);
                            }}
                            className={`px-3 py-2 flex items-center justify-between cursor-pointer font-medium transition-colors ${
                              activeDeptIndex === idx ? "bg-purple-50 text-purple-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">{dept.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ))}
                      </div>

                      {/* Column 2: Sub Groups */}
                      <div className="overflow-y-auto py-1 bg-slate-50/50">
                        {activeDeptIndex !== null &&
                          DEPT_TREE[activeDeptIndex].subGroups.map((sub, idx) => (
                            <div
                              key={idx}
                              onMouseEnter={() => setActiveSubGroupIndex(idx)}
                              className={`px-3 py-2 flex items-center justify-between cursor-pointer font-medium transition-colors ${
                                activeSubGroupIndex === idx ? "bg-purple-100/60 text-purple-800 font-bold" : "text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          ))}
                      </div>

                      {/* Column 3: Members */}
                      <div className="overflow-y-auto py-1 bg-slate-50">
                        {activeDeptIndex !== null &&
                          activeSubGroupIndex !== null &&
                          DEPT_TREE[activeDeptIndex].subGroups[activeSubGroupIndex]?.members.map((member, idx) => {
                            const fullPath = `${DEPT_TREE[activeDeptIndex].name} / ${DEPT_TREE[activeDeptIndex].subGroups[activeSubGroupIndex].name} / ${member}`;
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setTaskFormState({ ...taskFormState, assigneePath: fullPath });
                                  setIsDeptDropdownOpen(false);
                                  if (taskFormErrors.assigneePath) {
                                    setTaskFormErrors({ ...taskFormErrors, assigneePath: "" });
                                  }
                                }}
                                className="px-3 py-2 hover:bg-purple-600 hover:text-white cursor-pointer font-bold text-slate-800 transition-colors"
                              >
                                {member}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  {taskFormErrors.assigneePath && <p className="text-rose-500 text-[11px] font-medium mt-1">{taskFormErrors.assigneePath}</p>}
                </div>
              </div>

              {/* 2. * 下单数量 */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0 flex items-center justify-end">
                  <span className="text-rose-500 mr-1">*</span>下单数量
                </label>
                <div className="flex-1 min-w-0">
                  <input
                    type="number"
                    min={1}
                    placeholder="请输入"
                    value={taskFormState.orderCount || ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setTaskFormState({ ...taskFormState, orderCount: val });
                      if (taskFormErrors.orderCount) setTaskFormErrors({ ...taskFormErrors, orderCount: "" });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none font-medium text-slate-800 transition-colors ${
                      taskFormErrors.orderCount ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-200 focus:border-purple-500"
                    }`}
                  />
                  {taskFormErrors.orderCount && <p className="text-rose-500 text-[11px] font-medium mt-1">{taskFormErrors.orderCount}</p>}
                </div>
              </div>

              {/* 3. * 出片日期 */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0 flex items-center justify-end">
                  <span className="text-rose-500 mr-1">*</span>出片日期
                </label>
                <div className="flex-1 min-w-0 relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={taskFormState.deadlineDate}
                    onChange={(e) => {
                      setTaskFormState({ ...taskFormState, deadlineDate: e.target.value });
                      if (taskFormErrors.deadlineDate) setTaskFormErrors({ ...taskFormErrors, deadlineDate: "" });
                    }}
                    className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none font-medium text-slate-800 transition-colors ${
                      taskFormErrors.deadlineDate ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-200 focus:border-purple-500"
                    }`}
                  />
                  {taskFormErrors.deadlineDate && <p className="text-rose-500 text-[11px] font-medium mt-1">{taskFormErrors.deadlineDate}</p>}
                </div>
              </div>

              {/* 4. 出片可见性 */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0">
                  出片可见性
                </label>
                <div className="flex-1 min-w-0 space-y-3 pt-0.5">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg overflow-hidden border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTaskFormState({ ...taskFormState, visibilityType: "none" })}
                        className={`px-3.5 py-1.5 font-medium text-xs transition-colors cursor-pointer ${
                          taskFormState.visibilityType === "none"
                            ? "bg-[#7C3AED] text-white border border-[#7C3AED] shadow-2xs"
                            : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        不设置
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskFormState({ ...taskFormState, visibilityType: "specified" })}
                        className={`px-3.5 py-1.5 font-medium text-xs transition-colors cursor-pointer border-l ${
                          taskFormState.visibilityType === "specified"
                            ? "bg-[#7C3AED] text-white border border-[#7C3AED] shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        指定可见性
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTaskFormState({
                          ...taskFormState,
                          visibilityType: "specified",
                          visibilityRange: "specified_range",
                          specifiedTeam: "快手投流组",
                          specifiedGroup: "快手",
                          specifiedPerson: ""
                        });
                        showToast("已自动设定为我的小组可见");
                      }}
                      className="text-[#7C3AED] hover:text-purple-800 font-medium text-xs cursor-pointer ml-1 border-0 bg-transparent transition-colors"
                    >
                      指定我的小组
                    </button>
                  </div>

                  {/* Sub Options when 指定可见性 */}
                  {taskFormState.visibilityType === "specified" && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="visibilityRange"
                            checked={taskFormState.visibilityRange === "public"}
                            onChange={() => setTaskFormState({ ...taskFormState, visibilityRange: "public" })}
                            className="accent-[#7C3AED]"
                          />
                          <span>公开</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="visibilityRange"
                            checked={taskFormState.visibilityRange === "public_resource"}
                            onChange={() => setTaskFormState({ ...taskFormState, visibilityRange: "public_resource" })}
                            className="accent-[#7C3AED]"
                          />
                          <span>公用资源</span>
                          <span title="设定为公用资源后，全公司均可共享使用">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="visibilityRange"
                            checked={taskFormState.visibilityRange === "specified_range"}
                            onChange={() => setTaskFormState({ ...taskFormState, visibilityRange: "specified_range" })}
                            className="accent-[#7C3AED]"
                          />
                          <span>指定范围</span>
                        </label>
                      </div>

                      {/* Specified Range Dropdowns */}
                      {taskFormState.visibilityRange === "specified_range" && (
                        <div className="space-y-2 pt-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-right text-xs text-slate-500 shrink-0">指定部门</span>
                            <select
                              value={taskFormState.specifiedTeam}
                              onChange={(e) => setTaskFormState({ ...taskFormState, specifiedTeam: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                            >
                              <option value="">请选择</option>
                              <option value="电商运营一部">电商运营一部</option>
                              <option value="AIGC爆款拆解部">AIGC爆款拆解部</option>
                              <option value="快手投流组">快手投流组</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="w-16 text-right text-xs text-slate-500 shrink-0">指定分组</span>
                            <select
                              value={taskFormState.specifiedGroup}
                              onChange={(e) => setTaskFormState({ ...taskFormState, specifiedGroup: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                            >
                              <option value="">请选择</option>
                              <option value="天猫投流组">天猫投流组</option>
                              <option value="快手投流组">快手投流组</option>
                              <option value="快手">快手</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="w-16 text-right text-xs text-slate-500 shrink-0">指定人员</span>
                            <select
                              value={taskFormState.specifiedPerson}
                              onChange={(e) => setTaskFormState({ ...taskFormState, specifiedPerson: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                            >
                              <option value="">请选择</option>
                              <option value="梁浩然">梁浩然</option>
                              <option value="莫钦全">莫钦全</option>
                              <option value="蔡卓良">蔡卓良</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. 公开日期 */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0">
                  公开日期
                </label>
                <div className="flex-1 min-w-0 relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={taskFormState.publicDate}
                    onChange={(e) => setTaskFormState({ ...taskFormState, publicDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-purple-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* 6. 备注 */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0">
                  备注
                </label>
                <div className="flex-1 min-w-0">
                  <textarea
                    rows={2}
                    placeholder="备注需求说明"
                    value={taskFormState.remark}
                    onChange={(e) => setTaskFormState({ ...taskFormState, remark: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-purple-500 font-medium text-slate-800 resize-none"
                  />
                </div>
              </div>

              {/* 7. * 产品 */}
              <TaskCustomFields fields={taskFields} values={taskCustomValues} errors={taskFormErrors} onChange={(id, value) => { setTaskCustomValues(previous => ({ ...previous, [id]: value })); setTaskFormErrors(previous => ({ ...previous, [id]: "" })); }} />

              {/* 8. 脚本类型 */}


              {/* 9. 关联脚本 (Auto-associated to current script) */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0">
                  关联脚本
                </label>
                <div className="flex-1 min-w-0">
                  <div className="w-full px-3 py-2 bg-purple-50/80 border border-purple-200 rounded-lg flex items-center justify-between font-bold text-purple-900">
                    <span className="truncate">{currentScript.title}</span>
                    <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] rounded font-extrabold shrink-0 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      已自动关联
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPublishTaskModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </form>
          </div>
        </OverlayPortal>
      )}

      {/* MODAL 7: Upload Video Modal (上传视频 Modal) */}
      {showUploadVideoModal && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fade-in p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-800 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="text-sm font-extrabold text-slate-900">上传成品视频</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadVideoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadVideoSubmit} className="p-6 space-y-4 text-xs">
              {/* Drag & Drop Zone */}
              <div className="border-2 border-dashed border-purple-300 bg-purple-50/40 rounded-2xl p-6 text-center space-y-2 cursor-pointer hover:bg-purple-50/80 transition-colors">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-800">点击或将视频文件拖拽至此处上传</div>
                <p className="text-slate-400 text-[11px]">支持 MP4, MOV, AVI 格式，单个文件不超过 500MB</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">作品/视频名称：</label>
                <input
                  type="text"
                  value={uploadVideoName}
                  onChange={(e) => setUploadVideoName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">作品类型：</label>
                <select
                  value={uploadVideoType}
                  onChange={(e) => setUploadVideoType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="video">视频成片</option>
                  <option value="image">图片素材</option>
                </select>
              </div>

              <div className="px-6 py-4 bg-slate-50 -mx-6 -mb-6 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadVideoModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                >
                  确认上传
                </button>
              </div>
            </form>
          </div>
        </OverlayPortal>
      )}

      {/* MODAL 8: Link Works Modal */}
      {showLinkWorkModal && (
        <VideoResourcePickerModal
          items={linkableWorkOptions}
          initialSelectedIds={(currentScript.associatedWorks || []).filter(isVideoWork).map((work) => work.id)}
          initialSection={activeWorkType === "素材" ? "素材" : "成片"}
          onClose={() => setShowLinkWorkModal(false)}
          onConfirm={confirmLinkedWorks}
        />
      )}

      {/* MODAL 9: Associated Tasks Modal */}
      {showTasksModal && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="font-extrabold text-slate-900 text-sm">关联任务列表</h3>
              </div>
              <button onClick={() => setShowTasksModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-80 overflow-y-auto text-xs">
              {associatedTaskList.length === 0 ? (
                <p className="text-center text-slate-400 py-6 font-medium">暂无关联的任务记录</p>
              ) : (
                associatedTaskList.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{t.associatedScript?.title || t.id}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">负责人: {t.assignee}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowTasksModal(false);
                        setSelectedTaskForDetail(t);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white font-bold rounded-lg text-xs cursor-pointer hover:bg-purple-700"
                    >
                      查看详情
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button onClick={() => setShowTasksModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300">
                关闭
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* MODAL 10: Operation Logs Modal */}
      {showOpLogsModal && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#7C3AED] rounded-full" />
                <h3 className="font-extrabold text-slate-900 text-sm">操作记录</h3>
              </div>
              <button onClick={() => setShowOpLogsModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-80 overflow-y-auto text-xs">
              {opLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{log.action}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">操作人: {log.user}</div>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">{log.time}</div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button onClick={() => setShowOpLogsModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300">
                关闭
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}

    </div>
  );
}
