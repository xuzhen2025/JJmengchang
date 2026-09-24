import React, { useState } from "react";
import { useTaggedResources } from "../lib/useResourceTags";
import { resourceTagStore } from "../lib/resourceTags";
import { resourceConfigStore } from "../lib/resourceConfig";
import { useResourceConfig, useConfigFilter } from "../lib/useResourceConfig";
import { useUploadedResources, uploadedScript } from "../lib/resourceUploads";
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
import ScriptDetailPage from "./ScriptDetailPage";
import { TaskItem, addTaskRecord, getTaskRecords, useTaskRecords } from "./TaskCollaborationView";
import TaskCustomFields from "./TaskCustomFields";
import { useTaskFields } from "../lib/useTaskFields";
import { taskFieldErrors, TaskFieldValues } from "../lib/taskFieldConfig";
import { createScriptTask } from "../lib/scriptTaskPublishing";
import OverlayPortal from "./overlays/OverlayPortal";
import { ResourceSearchIntent } from "../types";
import ResourceSearchCondition from "./ResourceSearchCondition";
import ResourceFilterPresets from "./ResourceFilterPresets";
import { SCRIPT_PRESET_DEFAULTS } from "../lib/resourceFilterPresets";
import {
  Search,
  Plus,
  Copy,
  Share2,
  Send,
  Eye,
  RotateCcw,
  Download,
  Check,
  X,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  HelpCircle,
  Tag,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Film
} from "lucide-react";

// Cascader Department Tree
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

const PRODUCTS_LIST = [
  "得力双头马克笔",
  "温和净透洗面奶",
  "控油蓬松洗发水",
  "儿童防晒喷雾",
  "植萃舒缓面膜",
  "全自动咖啡机",
  "无线降噪耳机"
];

const SCRIPT_TYPES = [
  "爆款拆解",
  "口播种草",
  "情景剧演出",
  "产品测评",
  "对比实验",
  "开箱体验",
  "专家科普"
];

export interface ScriptTaskItem {
  id: string;
  name: string;
  assignee: string;
  department?: string;
  deadline?: string;
  status: "已完成" | "进行中" | "待处理";
  updatedAt: string;
}

interface ScriptItem {
  id: string;
  title: string;
  author: string;
  categoryTag: string; // e.g. "AI分镜拆解"
  content: string;
  status: string;
  statusId?: string;
  primaryCategory: string;
  secondaryCategory: string;
  classTag: string; // e.g. "演示分类 / 卸妆油 (仅内部)"
  descTag: string;  // e.g. "标签描述"
  tasksCount: number;
  tasks: ScriptTaskItem[];
  createdAt: string;
  scenesCount: number;
  publicTags?: string[];
  personalTags?: string[];
}

interface ScriptManagementViewProps {
  onTriggerTask?: (type: any, name: string, inputFiles: string[], cost: number) => void;
  onNavigateToTaskDetail?: (task: TaskItem) => void;
  onDetailStateChange?: (isDetail: boolean) => void;
  initialSearch?: ResourceSearchIntent | null;
  onClearSearch?: () => void;
}

export const INITIAL_SCRIPTS: ScriptItem[] = [
      {
        personalTags: ["口播专项"],
        publicTags: ["口播种草","美妆护肤"],
        id: "S-10291",
        title: "脚本 1 - 口播温和洁面破圈案",
        author: "致上编导",
        categoryTag: "AI分镜拆解",
        content: "1: 哪怕是你一周染一次，也不会损伤你的头发，什么干枯毛躁，开叉打结都不会，就这样按一洗，洗出丰富的泡沫，使劲揉，使劲搓啊，它也不沾头皮...",
        status: "待审核",
        primaryCategory: "个人护理",
        secondaryCategory: "洗发护发",
        classTag: "个护家清 / 卸妆油",
        descTag: "爆款洗发水口播",
        tasksCount: 2,
        tasks: [
          {
            id: "06131146256",
            name: "脚本 1 - 口播温和洁面破圈案",
            assignee: "张三 (剪辑组)",
            department: "剪辑一组 / 视频后发 / 张三",
            deadline: "2026-07-02",
            status: "已完成",
            updatedAt: "2026-08-04 14:20"
          },
          {
            id: "06131146255",
            name: "脚本 1 - 口播温和洁面破圈案",
            assignee: "李四 (拍摄组)",
            department: "拍摄一组 / 现场摄制 / 李四",
            deadline: "2026-07-05",
            status: "进行中",
            updatedAt: "2026-08-04 10:15"
          }
        ],
        createdAt: "2026-08-04 11:30",
        scenesCount: 6
      },
      {
        personalTags: ["美妆项目"],
        publicTags: ["成分卖点","实测对比"],
        id: "S-10292",
        title: "脚本 2 - 植萃修护洗发水评测",
        author: "致上编导",
        categoryTag: "AI分镜拆解",
        content: "1: 哪怕是你一周染一次，也不会损伤你的头发，什么干枯毛躁，开叉打结都不会，就这样按一洗，洗出丰富的泡沫，使劲揉，使劲搓啊，它也不沾头皮...",
        status: "待审核",
        primaryCategory: "个人护理",
        secondaryCategory: "洗发护发",
        classTag: "个护家清 / 洗发水",
        descTag: "植萃成分拆解",
        tasksCount: 0,
        tasks: [],
        createdAt: "2026-08-03 16:45",
        scenesCount: 5
      },
      {
        personalTags: [],
        publicTags: ["使用过程","美妆护肤"],
        id: "S-10293",
        title: "脚本 3 - 卸妆油乳化深度实验",
        author: "致上编导",
        categoryTag: "AI分镜拆解",
        content: "1: 哪怕是你一周染一次，也不会损伤你的头发，什么干枯毛躁，开叉打结都不会，就这样按一洗，洗出丰富的泡沫，使劲揉，使劲搓啊，它也不沾头皮...",
        status: "审核通过",
        primaryCategory: "美妆护肤",
        secondaryCategory: "卸妆清洁",
        classTag: "美妆护肤 / 卸妆油",
        descTag: "标签描述",
        tasksCount: 1,
        tasks: [
          { id: "T-803", name: "卸妆油实测1080P混剪", assignee: "王剪辑", status: "已完成", updatedAt: "2026-08-02 09:10" }
        ],
        createdAt: "2026-08-02 09:00",
        scenesCount: 8
      },
      {
        personalTags: ["待二创"],
        publicTags: ["商品展示","成分卖点"],
        id: "S-10294",
        title: "脚本 4 - 4K光感亮肤精华高能开箱",
        author: "美妆内容部",
        categoryTag: "爆款复刻",
        content: "1: 皮肤暗沉黄气重？看这条视频就够了！28天实测对比，透亮感直接拉满，质地丝滑清爽，上脸一抹即化...",
        status: "驳回-待修改",
        primaryCategory: "美妆护肤",
        secondaryCategory: "面部精华",
        classTag: "美妆护肤 / 精华素",
        descTag: "高转化率文案",
        tasksCount: 3,
        tasks: [
          { id: "T-804", name: "精华素A/B测试投放剪辑", assignee: "刘运营", status: "进行中", updatedAt: "2026-08-01 18:30" },
          { id: "T-805", name: "千川广告高能前3秒提审", assignee: "陈主管", status: "已完成", updatedAt: "2026-08-01 15:00" },
          { id: "T-806", name: "字幕配音智能合成", assignee: "AI系统", status: "已完成", updatedAt: "2026-08-01 12:10" }
        ],
        createdAt: "2026-08-01 11:20",
        scenesCount: 7
      },
      {
        personalTags: ["秋季上新"],
        publicTags: ["通勤穿搭","秋冬新品"],
        id: "S-10295",
        title: "脚本 5 - 秋冬穿搭羊绒大衣氛围感种草",
        author: "服饰组",
        categoryTag: "原创策划",
        content: "1: 穿对大衣真的太显贵了！今天给姐妹们推荐这款100%双面羊绒大衣，垂坠感极佳，版型遮肉修身...",
        status: "审核通过",
        primaryCategory: "童装/童鞋",
        secondaryCategory: "女装外套",
        classTag: "服饰内衣 / 羊绒大衣",
        descTag: "秋冬新品种草",
        tasksCount: 1,
        tasks: [
          { id: "T-807", name: "羊绒大衣街拍场景渲染", assignee: "周导", status: "进行中", updatedAt: "2026-07-31 16:00" }
        ],
        createdAt: "2026-07-31 14:10",
        scenesCount: 9
      }
    ];
INITIAL_SCRIPTS.push(...["植萃修护精华种草脚本","通勤风衣换季穿搭脚本","居家收纳痛点对比脚本"].map((title, index) => ({
  ...INITIAL_SCRIPTS[index % INITIAL_SCRIPTS.length], id: "scripts-analytics-" + (index + 1), title,
  author: ["徐振", "王剪辑", "周雅"][index],
  createdAt: `2026-09-${10 + index} 10:30`, time: `2026-09-${10 + index} 10:30`,
})));

resourceTagStore.register("scripts", INITIAL_SCRIPTS);
resourceConfigStore.register("scripts", INITIAL_SCRIPTS);

export default function ScriptManagementView({ onTriggerTask, onNavigateToTaskDetail, onDetailStateChange, initialSearch, onClearSearch }: ScriptManagementViewProps) {
  // Main filter states
  const [selectedPrimaryCat, setSelectedPrimaryCat] = useState("全部");
  const [selectedSecondaryCat, setSelectedSecondaryCat] = useState("全部");
  const [secondarySearch, setSecondarySearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const { store: configStore } = useResourceConfig();
  const [publicTagSearch, setPublicTagSearch] = useState("");
  const [publicTagKeyword, setPublicTagKeyword] = useState("");
  const [personalTagSearch, setPersonalTagSearch] = useState("");
  const [selectedPersonalTag, setSelectedPersonalTag] = useState("全部");
  const [sortBy, setSortBy] = useState("最新发布");
  const [isMorePrimaryExpanded, setIsMorePrimaryExpanded] = useState(false);

  const [searchQuery, setSearchQuery] = useState(initialSearch?.query || "");
  React.useEffect(() => { setSearchQuery(initialSearch?.query || ""); }, [initialSearch?.requestId, initialSearch?.query]);
  const [templateFilter, setTemplateFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedPreset, setSelectedPreset] = useState("");

  // View / Action Modals
  const [selectedScriptForTasks, setSelectedScriptForTasks] = useState<ScriptItem | null>(null);
  const [selectedScriptForPublish, setSelectedScriptForPublish] = useState<ScriptItem | null>(null);
  const [selectedScriptForDetail, setSelectedScriptForDetail] = useState<ScriptItem | null>(null);

  React.useEffect(() => {
    if (!initialSearch?.openDetail || !initialSearch.query) return;
    const target = initialSearch.query.trim().toLowerCase();
    const match = scripts.find((script) => script.title.toLowerCase() === target || script.id.toLowerCase() === target);
    if (match) setSelectedScriptForDetail(match);
  }, [initialSearch?.requestId]);

  React.useEffect(() => {
    onDetailStateChange?.(!!selectedScriptForDetail);
  }, [selectedScriptForDetail, onDetailStateChange]);
  const [showCreateScriptModal, setShowCreateScriptModal] = useState(false);

  // Form State for Publish Task Modal (新增任务 Modal matching reference image)
  const [taskFormState, setTaskFormState] = useState({
    assigneePath: "剪辑一组 / 视频后发 / 张三",
    orderCount: 1 as number | string,
    deadlineDate: "2026-08-15",
    visibilityType: "none" as "none" | "specified",
    visibilityRange: "public" as "public" | "public_resource" | "specified_range",
    specifiedTeam: "",
    specifiedGroup: "",
    specifiedPerson: "",
    publicDate: "2026-08-07",
    remark: "",
    product: "得力双头马克笔",
    scriptType: "爆款拆解"
  });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});
  const { fields: taskFields, settings: taskSettings } = useTaskFields();
  const [taskCustomValues, setTaskCustomValues] = useState<TaskFieldValues>({});
  const [taskRecords] = useTaskRecords();
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [activeDeptIndex, setActiveDeptIndex] = useState<number | null>(0);
  const [activeSubGroupIndex, setActiveSubGroupIndex] = useState<number | null>(0);

  const openPublishTaskModal = (script: ScriptItem) => {
    if (!taskSettings.enabled) { showToast("任务功能已关闭"); return; }
    setTaskCustomValues({});
    setSelectedScriptForPublish(script);
    setTaskFormState({
      assigneePath: "剪辑一组 / 视频后发 / 张三",
      orderCount: 1,
      deadlineDate: "2026-08-15",
      visibilityType: "none",
      visibilityRange: "public",
      specifiedTeam: "",
      specifiedGroup: "",
      specifiedPerson: "",
      publicDate: "2026-08-07",
      remark: "",
      product: "得力双头马克笔",
      scriptType: "爆款拆解"
    });
    setTaskFormErrors({});
    setIsDeptDropdownOpen(false);
  };

  // New Script form
  const [newScriptTitle, setNewScriptTitle] = useState("");
  const [newScriptCategory, setNewScriptCategory] = useState("美妆护肤");
  const [newScriptContent, setNewScriptContent] = useState("");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleViewTaskDetail = (task: ScriptTaskItem) => {
    if (!selectedScriptForTasks) return;
    const savedTask = getTaskRecords().find(item => item.id === task.id);
    if (savedTask && onNavigateToTaskDetail) { setSelectedScriptForTasks(null); onNavigateToTaskDetail(savedTask); return; }
    const taskItem: TaskItem = {
      id: task.id || "06131146256",
      publisher: "徐振",
      publishDate: "2026-06-12",
      deadlineDate: task.deadline || "2026-07-02",
      assignee: task.assignee.split(" ")[0] || task.assignee,
      assigneeDeptPath: task.department || `${task.assignee}`,
      orderCount: 8,
      completedCount: task.status === "已完成" ? 8 : 2,
      status: task.status === "已完成" ? "completed" : task.status === "进行中" ? "in_progress" : "pending",
      cost: 0,
      associatedScript: {
        title: selectedScriptForTasks.title,
        status: "可以拍摄",
        versionCount: 2
      },
      product: selectedScriptForTasks.primaryCategory || "美妆护肤",
      scriptType: selectedScriptForTasks.categoryTag || "AI分镜拆解",
      remark: `关联脚本: ${selectedScriptForTasks.title}`
    };

    setSelectedScriptForTasks(null);
    if (onNavigateToTaskDetail) {
      onNavigateToTaskDetail(taskItem);
    }
  };

  // Mock script dataset
  const [baseScripts, setScripts] = useState<ScriptItem[]>(INITIAL_SCRIPTS);
  const uploaded = useUploadedResources();
  const scripts = useTaggedResources("scripts", [...uploaded.filter((item) => item.resourceCategory === "脚本").map(uploadedScript), ...baseScripts]).map(script => {
    const linked = taskRecords.filter(task => task.associatedScript?.id === script.id);
    const tasks = [...linked.map(task => ({ id: task.id, name: script.title, assignee: task.assignee, department: task.assigneeDeptPath || "", deadline: task.deadlineDate, status: task.status === "completed" ? "已完成" as const : task.status === "pending" ? "待处理" as const : "进行中" as const, updatedAt: task.publishDate })), ...script.tasks.filter(task => !linked.some(item => item.id === task.id))];
    return { ...script, tasks, tasksCount: Math.max(script.tasksCount, tasks.length) };
  });

  // Selected row checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === scripts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(scripts.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filter handlers
  const handleResetFilters = () => {
    setSelectedPrimaryCat("全部");
    setSelectedSecondaryCat("全部");
    setSecondarySearch("");
    setSelectedStatus("全部");
    setPublicTagSearch("");
    setPublicTagKeyword("");
    setPersonalTagSearch("");
    setSelectedPersonalTag("全部");
    setSortBy("最新发布");
    setSelectedPreset("");
    setTemplateFilter("");
    setAuthorFilter("");
    setAuthorSearch("");
    setStartDate("");
    setEndDate("");
    showToast("已重置所有筛选条件");
  };

  const presetFilters = { searchQuery, selectedPrimaryCat, selectedSecondaryCat, secondarySearch, selectedStatus, publicTagSearch, publicTagKeyword, personalTagSearch, selectedPersonalTag, sortBy, templateFilter, authorFilter, authorSearch, startDate, endDate };
  const applyPresetFilters = (next: typeof SCRIPT_PRESET_DEFAULTS) => {
    setSearchQuery(next.searchQuery);
    setSelectedPrimaryCat(next.selectedPrimaryCat);
    setSelectedSecondaryCat(next.selectedSecondaryCat);
    setSecondarySearch(next.secondarySearch);
    setSelectedStatus(next.selectedStatus);
    setPublicTagSearch(next.publicTagSearch);
    setPublicTagKeyword(next.publicTagKeyword);
    setPersonalTagSearch(next.personalTagSearch);
    setSelectedPersonalTag(next.selectedPersonalTag);
    setSortBy(next.sortBy);
    setTemplateFilter(next.templateFilter);
    setAuthorFilter(next.authorFilter);
    setAuthorSearch(next.authorSearch);
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    setSelectedIds([]);
  };

  // Actions
  const handleCopyScript = (script: ScriptItem) => {
    const cloned: ScriptItem = {
      ...script,
      id: `S-${Math.floor(10000 + Math.random() * 90000)}`,
      title: `${script.title} (副本)`,
      status: resourceConfigStore.defaultStatus("scripts"),
      statusId: undefined,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      tasksCount: 0,
      tasks: []
    };
    setScripts(prev => [cloned, ...prev]);
    showToast(`已生成新脚本: ${cloned.title}`);
  };

  const handleShareLink = (script: ScriptItem) => {
    const shareUrl = `http://ygj-zssoft.sucaicloud.com/#/script-detail/${script.id}`;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    showToast(`已复制脚本链接到剪贴板！\n${shareUrl}`);
  };

  const handlePublishTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScriptForPublish) return;
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

    const scriptToPub = selectedScriptForPublish;
    const collaborationTask = createScriptTask(scriptToPub, taskFormState, taskFields, taskCustomValues);
    addTaskRecord(collaborationTask);
    const assigneeName = taskFormState.assigneePath.split("/").pop()?.trim() || "未指定";

    const newTask: ScriptTaskItem = {
      id: collaborationTask.id,
      name: `${scriptToPub.title}`,
      assignee: assigneeName,
      department: taskFormState.assigneePath,
      deadline: taskFormState.deadlineDate,
      status: "进行中",
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    setScripts(prev => prev.map(s => {
      if (s.id === scriptToPub.id) {
        return {
          ...s,
          tasksCount: s.tasksCount + 1,
          tasks: [newTask, ...s.tasks]
        };
      }
      return s;
    }));

    if (onTriggerTask) {
      onTriggerTask("script_video", `${scriptToPub.title} - 新增任务`, [scriptToPub.title], 5);
    }

    setSelectedScriptForPublish(null);
    showToast(`发布任务成功！关联脚本: ${scriptToPub.title}`);
  };

  const handleCreateNewScriptSubmit = () => {
    if (!newScriptTitle.trim()) {
      showToast("请输入脚本标题");
      return;
    }
    const created: ScriptItem = {
      id: `S-${Math.floor(10000 + Math.random() * 90000)}`,
      title: newScriptTitle.trim(),
      author: "致上编导",
      categoryTag: "AI分镜拆解",
      content: newScriptContent.trim() || "1: 美妆爆款口播分镜拆解内容...",
      status: resourceConfigStore.defaultStatus("scripts"),
      primaryCategory: newScriptCategory,
      secondaryCategory: "通用分类",
      classTag: `演示分类 / ${newScriptCategory}`,
      descTag: "最新创建脚本",
      tasksCount: 0,
      tasks: [],
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      scenesCount: 5
    };

    setScripts(prev => [created, ...prev]);
    setShowCreateScriptModal(false);
    setNewScriptTitle("");
    setNewScriptContent("");
    showToast(`成功新建脚本《${created.title}》！`);
  };

  // Filter logic
  const filteredScripts = scripts.filter(s => {
    const homeSearch = searchQuery.trim().toLowerCase();
    const matchesHomeSearch = !homeSearch || [s.title, s.content, s.primaryCategory, s.secondaryCategory, s.categoryTag, s.classTag, s.descTag, s.author]
      .some((value) => value.toLowerCase().includes(homeSearch));
    if (!matchesHomeSearch) return false;
    if (publicTagSearch && publicTagSearch !== "全部" && !s.publicTags.includes(publicTagSearch)) return false;
    if (personalTagSearch && !s.personalTags.some((tag) => tag.includes(personalTagSearch))) return false;
    if (selectedPersonalTag === "无个人标签" && s.personalTags.length) return false;
    if (selectedPersonalTag === "有个人标签" && !s.personalTags.length) return false;
    if (!["全部", "无个人标签", "有个人标签"].includes(selectedPersonalTag) && !s.personalTags.includes(selectedPersonalTag)) return false;

    if (selectedPrimaryCat !== "全部" && s.primaryCategory !== selectedPrimaryCat) return false;
    if (selectedSecondaryCat !== "全部" && s.secondaryCategory !== selectedSecondaryCat) return false;
    if (configStore.statusEnabled("scripts") && selectedStatus !== "全部" && s.status !== selectedStatus) return false;
    if (secondarySearch && !s.secondaryCategory.includes(secondarySearch) && !s.title.includes(secondarySearch)) return false;
    return true;
  });

  const primaryCategoriesFirstRow = ["全部", ...configStore.categories("scripts").map(n => n.name)];



  React.useEffect(() => {
    const tag = initialSearch?.tag;
    if (!tag) return;
    if (primaryCategoriesFirstRow.includes(tag)) setSelectedPrimaryCat(tag);
    else if (["全部", "待审核", "审核通过", "驳回-待修改"].includes(tag)) setSelectedStatus(tag);
  }, [initialSearch?.requestId]);

  if (selectedScriptForDetail) {
    return (
      <ScriptDetailPage
        script={selectedScriptForDetail}
        onBack={() => setSelectedScriptForDetail(null)}
        onTriggerTask={onTriggerTask}
        onUpdateScript={(updated) => {
          setScripts(prev => prev.map(s => s.id === updated.id ? updated : s));
          setSelectedScriptForDetail(updated);
        }}
        onDeleteScript={(scriptId) => {
          setScripts(prev => prev.filter(s => s.id !== scriptId));
          setSelectedScriptForDetail(null);
          showToast("已成功删除脚本！");
        }}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-5 space-y-4 text-slate-800 font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <OverlayPortal layer="toast" role="status" className="fixed top-6 right-6 z-[80] bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="whitespace-pre-line">{toastMessage}</span>
        </OverlayPortal>
      )}

      {/* Filter Card 1: Top Filter Panel (Matches FinishedVideosView UI) */}
      <div className={RESOURCE_FILTER_PANEL_CLASS}>
        {/* Row 1: 常用筛选预设 */}
        <div className={RESOURCE_FILTER_PRESET_ROW_CLASS}>
          {/* Right: 选择常用筛选预设 + 保存 */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <ResourceFilterPresets scope="scripts" defaults={SCRIPT_PRESET_DEFAULTS} value={presetFilters}
              selectedName={selectedPreset} onSelectName={setSelectedPreset} onApply={applyPresetFilters}
              seeds={[
                { name: "洗发水", filters: { selectedPrimaryCat: "个人护理" } },
                { name: "卸妆油模板", filters: { selectedPrimaryCat: "美妆护肤" } },
              ]} />
          </div>
        </div>

        {/* Row 2: 一级分类 */}
          <ResourceCategoryFilters scope="scripts" primary={selectedPrimaryCat} secondary={selectedSecondaryCat} search={secondarySearch}
            onPrimary={setSelectedPrimaryCat} onSecondary={setSelectedSecondaryCat} onSearch={setSecondarySearch} />

        {/* Row 3: 二级分类 */}


        {/* Row 4: 状 态 */}
        <ResourceStatusFilter scope="scripts" value={selectedStatus} onChange={setSelectedStatus} />

        {/* Row 5: 公共标签 */}
        <div className={RESOURCE_FILTER_TAG_ROW_CLASS}>
          <span className={RESOURCE_FILTER_LABEL_CLASS}>公共标签：</span>
          <PublicTagFilter
            searchKeyword={publicTagKeyword}
            onSearchKeywordChange={setPublicTagKeyword}
            selectedTag={publicTagSearch || "全部"}
            onSelectTag={(tag) => setPublicTagSearch(tag === "全部" ? "" : tag)}
          />
        </div>

        {/* Row 6: 个人标签 */}
        <div className={RESOURCE_FILTER_TAG_ROW_CLASS}>
          <span className={RESOURCE_FILTER_LABEL_CLASS}>个人标签：</span>
          <PersonalTagFilter
            searchKeyword={personalTagSearch}
            onSearchKeywordChange={setPersonalTagSearch}
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
              <option value="最早发布">最早发布</option>
              <option value="最多关联任务">最多关联任务</option>
            </select>
          </div>

          {/* 脚本模板 */}
          <select value={templateFilter} onChange={e => setTemplateFilter(e.target.value)} aria-label="脚本模板" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 bg-white focus:outline-none focus:border-purple-400 cursor-pointer">
            <option value="">请选择脚本模板</option>
            <option value="t1">美妆爆款拆解模板</option>
            <option value="t2">服饰种草口播模板</option>
          </select>

          {/* 作者 */}
          <select value={authorFilter} onChange={e => setAuthorFilter(e.target.value)} aria-label="作者" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 bg-white focus:outline-none focus:border-purple-400 cursor-pointer">
            <option value="">作者</option>
            <option value="致上编导">致上编导</option>
            <option value="美妆内容部">美妆内容部</option>
          </select>

          {/* 作者搜索 */}
          <input
            type="text"
            placeholder="请选择(支持输入搜索)"
            value={authorSearch} onChange={e => setAuthorSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-purple-400 w-36"
          />

          {/* 上传时间 */}
          <div className="flex items-center gap-1 text-slate-500 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>上传时间</span>
            <span className="text-slate-300">|</span>
            <input type="text" placeholder="开始日期" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-24 focus:outline-none text-center" />
            <span>至</span>
            <input type="text" placeholder="结束日期" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-24 focus:outline-none text-center" />
          </div>
        </div>

        {/* Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetFilters}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            重置
          </button>
        </div>
      </div>

      {/* Script List Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === scripts.length && scripts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 w-48">脚本</th>
                <th className="py-3 px-4">脚本内容</th>
                <th className="py-3 px-4 w-28">状态</th>
                <th className="py-3 px-4 w-48">分类/标签</th>
                <th className="py-3 px-4 w-24">分镜</th>
                <th className="py-3 px-4 w-44 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScripts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>暂无符合条件的脚本数据</p>
                  </td>
                </tr>
              ) : (
                filteredScripts.map((script) => (
                  <tr
                    key={script.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(script.id)}
                        onChange={() => toggleSelectOne(script.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>

                    {/* 脚本 (Title, Author, Tag) */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedScriptForDetail(script)}
                          className="font-bold text-slate-900 hover:text-purple-600 text-left block line-clamp-1 cursor-pointer"
                        >
                          {script.title}
                        </button>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-medium border border-purple-200">
                            {script.author}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {script.categoryTag}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 脚本内容 Preview */}
                    <td className="py-4 px-4">
                      <p className="text-slate-600 line-clamp-2 leading-relaxed max-w-xl font-normal">
                        {script.content}
                      </p>
                    </td>

                    {/* 状态 Badge */}
                    <td className="py-4 px-4">
                      <ResourceStatusBadge scope="scripts" status={script.status} className="px-2.5 py-1 font-bold rounded-md text-[11px] inline-block shadow-2xs" />
                    </td>

                    {/* 分类/标签 */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="text-slate-700 font-medium text-[11px]">
                          {script.classTag}
                        </div>
                        <span className="inline-block px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded text-[10px] border border-sky-100">
                          {script.descTag}
                        </span>
                      </div>
                    </td>

                    {/* 分镜 Count */}
                    <td className="py-4 px-4 text-slate-500">
                      <span className="font-mono">{script.scenesCount}</span> 场分镜
                    </td>

                    {/* 操作 (查看任务, 发布任务, 分享链接, 复制) */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-3 flex-wrap">
                        {/* 查看任务 */}
                        <button
                          onClick={() => setSelectedScriptForTasks(script)}
                          className="text-purple-600 hover:text-purple-800 font-medium transition-colors cursor-pointer text-xs"
                        >
                          查看任务({script.tasksCount})
                        </button>

                        {/* 发布任务 */}
                        <button
                          onClick={() => openPublishTaskModal(script)}
                          className="text-purple-600 hover:text-purple-800 font-medium transition-colors cursor-pointer text-xs"
                        >
                          发布任务
                        </button>

                        {/* 分享链接 */}
                        <button
                          onClick={() => handleShareLink(script)}
                          className="text-purple-600 hover:text-purple-800 font-medium transition-colors cursor-pointer text-xs"
                        >
                          分享链接
                        </button>

                        {/* 复制 */}
                        <button
                          onClick={() => handleCopyScript(script)}
                          className="text-purple-600 hover:text-purple-800 font-medium transition-colors cursor-pointer text-xs"
                        >
                          复制
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


      {/* Modal 3: 查看关联任务 (View Script Tasks Modal) */}
      {selectedScriptForTasks && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="font-bold text-slate-900 text-sm border-l-4 border-purple-600 pl-2.5">
                查看任务
              </h3>
              <button
                onClick={() => setSelectedScriptForTasks(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table Area */}
            <div className="p-5 overflow-y-auto flex-1 text-xs">
              {selectedScriptForTasks.tasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">该脚本暂未关联任何处理任务</p>
                  <button
                    onClick={() => {
                      const scr = selectedScriptForTasks;
                      setSelectedScriptForTasks(null);
                      openPublishTaskModal(scr);
                    }}
                    className="px-3.5 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>立即发布任务</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-700 font-bold">
                        <th className="py-3 px-4 font-bold">任务名称</th>
                        <th className="py-3 px-4 font-bold">负责人</th>
                        <th className="py-3 px-4 font-bold">部门</th>
                        <th className="py-3 px-4 font-bold">截止时间</th>
                        <th className="py-3 px-4 font-bold">进度状态</th>
                        <th className="py-3 px-4 font-bold text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedScriptForTasks.tasks.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {t.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {t.assignee}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {t.department || "剪辑一组 / 视频后发 / 张三"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono">
                            {t.deadline || "2026-07-02"}
                          </td>
                          <td className="py-3.5 px-4">
                            {t.status === "已完成" ? (
                              <span className="inline-block px-2.5 py-0.5 bg-[#E6F4EA] text-[#137333] font-bold rounded-md text-[11px]">
                                已完成
                              </span>
                            ) : t.status === "进行中" ? (
                              <span className="inline-block px-2.5 py-0.5 bg-[#F3E8FF] text-[#7C3AED] font-bold rounded-md text-[11px]">
                                进行中
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md text-[11px]">
                                待处理
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleViewTaskDetail(t)}
                              className="text-[#7C3AED] hover:text-purple-800 font-bold cursor-pointer transition-colors hover:underline"
                            >
                              查看
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer / Pagination matching screenshot */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-end gap-3 text-xs text-slate-500 font-sans shrink-0">
              <span>共 {selectedScriptForTasks.tasks.length} 条</span>
              <select
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:border-purple-400 cursor-pointer shadow-2xs font-medium"
                defaultValue="20条/页"
              >
                <option value="20条/页">20条/页</option>
                <option value="50条/页">50条/页</option>
                <option value="100条/页">100条/页</option>
              </select>
              <div className="flex items-center gap-1">
                <button
                  disabled
                  className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-300 cursor-not-allowed bg-slate-50 shadow-2xs font-medium"
                >
                  &lt;
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center bg-[#7C3AED] text-white font-bold rounded-lg shadow-2xs"
                >
                  1
                </button>
                <button
                  disabled
                  className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-300 cursor-not-allowed bg-slate-50 shadow-2xs font-medium"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* Modal 4: 发布任务 (Publish Task Modal - Matches reference image / ScriptDetailPage) */}
      {selectedScriptForPublish && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[70] p-4 font-sans animate-fade-in">
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
                onClick={() => setSelectedScriptForPublish(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handlePublishTaskSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              
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


              {/* 9. 关联脚本 (Auto-associated to current selected script) */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0">
                  关联脚本
                </label>
                <div className="flex-1 min-w-0">
                  <div className="w-full px-3 py-2 bg-purple-50/80 border border-purple-200 rounded-lg flex items-center justify-between font-bold text-purple-900">
                    <span className="truncate">{selectedScriptForPublish.title}</span>
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
                  onClick={() => setSelectedScriptForPublish(null)}
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

      {/* Modal 5: 新建脚本 Modal */}
      {showCreateScriptModal && (
        <OverlayPortal layer="dialog" role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm border-l-4 border-purple-600 pl-2">
                新建脚本工程
              </h3>
              <button
                onClick={() => setShowCreateScriptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">
                  <span className="text-rose-500">*</span> 脚本标题
                </label>
                <input
                  type="text"
                  placeholder="请输入脚本标题 (如：卸妆油清爽洁肤30秒口播)"
                  value={newScriptTitle}
                  onChange={(e) => setNewScriptTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">一级分类</label>
                <select
                  value={newScriptCategory}
                  onChange={(e) => setNewScriptCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="美妆护肤">美妆护肤</option>
                  <option value="个人护理">个人护理</option>
                  <option value="童装/童鞋">童装/童鞋</option>
                  <option value="家庭清洁">家庭清洁</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">脚本分镜文案</label>
                <textarea
                  rows={4}
                  placeholder="1: 镜头1 - 展现产品使用前干枯毛躁画面&#10;2: 镜头2 - 洗发水揉搓丰富泡沫特写..."
                  value={newScriptContent}
                  onChange={(e) => setNewScriptContent(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateScriptModal(false)}
                className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold rounded-lg cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                onClick={handleCreateNewScriptSubmit}
                className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg cursor-pointer shadow-2xs text-xs"
              >
                保存脚本
              </button>
            </div>
          </div>
        </OverlayPortal>
      )}
    </div>
  );
}
