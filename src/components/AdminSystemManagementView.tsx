import React, { useState } from "react";
import { recordExport } from "../lib/operationHistory";
import {
  ShieldCheck,
  FileText,
  Settings,
  Tag,
  Megaphone,
  Key,
  Bell,
  Users,
  Search,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Minus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Building2,
  Phone,
  Mail,
  UserPlus,
  UserCheck,
  UserX,
  Layers,
  RotateCcw,
  Calendar,
  Zap,
  Server,
  Activity,
  Image as ImageIcon,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  HardDrive,
  FolderPlus,
  Star
} from "lucide-react";
import { DeptNode, AccountMember, INITIAL_DEPTS, INITIAL_MEMBERS } from "../data/adminAccounts";
import { ORGANIZATION_CHANGE, readReportOrganization } from "../lib/analyticsOrganization";
import AssetPagination from "./AssetPagination";
import { useViralVideoRule } from "../lib/useViralVideoRule";
import { isValidViralVideoRule, saveViralVideoRule, type ViralVideoRule } from "../lib/viralVideoRule";
import OverlayPortal from "./overlays/OverlayPortal";
import { useAdStore } from "../lib/useAdStore";
import { AD_CHANGE_EVENT, adDate, adId, getAdActor, revokeAdAccounts, updateAdStore, type AdAccount, type AdAccountGroup } from "../lib/adPush";
import { AdDialog } from "./AdAccountPush";
import AdAuthorizationDialog from "./AdAuthorizationDialog";

type SystemTabType =
  | "depts"
  | "members"
  | "roles"
  | "audit"
  | "watermark"
  | "system_settings"
  | "auto_tags"
  | "ad_groups"
  | "login_logs"
  | "notifications"
  | "users";

// ---------------------------------------------------------------------------
// TYPES & DATA STRUCTURES FOR ROLES & PERMISSIONS
// ---------------------------------------------------------------------------
export interface PermissionNode {
  id: string;
  label: string;
  children?: PermissionNode[];
}

export interface RolePermission {
  id: string;
  name: string;
  code?: string;
  type?: "preset" | "custom";
  category: "default" | "other" | "custom";
  description: string;
  memberCount: number;
  dataScope?: "self" | "dept_tree" | "all";
  enabled?: boolean;
  checkedKeys?: string[];
  permissions?: string[];
  updatedAt?: string;
}

export const USER_CLIENT_PERMISSION_TREE: PermissionNode[] = [
  { id: "uc_remake_run", label: "爆款复刻" },
  {
    id: "uc_resource_library",
    label: "资源库",
    children: [
      { id: "uc_resource_view_finished", label: "查看成片" },
      { id: "uc_resource_view_material", label: "查看素材" },
      { id: "uc_resource_view_third_party", label: "查看第三方" },
      { id: "uc_resource_view_image", label: "查看图片" },
      { id: "uc_resource_view_audio", label: "查看音频" },
      { id: "uc_resource_view_script", label: "查看脚本" },
      {
        id: "uc_resource_upload",
        label: "上传文件",
        children: [
          { id: "uc_upload_video", label: "上传视频" },
          { id: "uc_upload_image", label: "上传图片" },
          { id: "uc_upload_script", label: "上传脚本" },
          { id: "uc_upload_audio", label: "上传音频" },
        ]
      },
      {
        id: "uc_finished_management",
        label: "成片管理",
        children: [
          { id: "uc_finished_edit", label: "修改基础信息" },
          { id: "uc_finished_status", label: "修改状态" },
          { id: "uc_finished_download", label: "下载原片" },
          { id: "uc_finished_logs", label: "查看操作记录" },
          { id: "uc_finished_ad_push", label: "推送广告账户" },
          { id: "uc_finished_ad_records", label: "查看推送记录" },
          { id: "uc_derivation", label: "衍生视频" },
          { id: "uc_finished_interaction", label: "查看互动数据" },
          { id: "uc_finished_project_upload", label: "上传工程文件" },
          { id: "uc_finished_project_download", label: "下载工程文件" },
          { id: "uc_finished_project_visibility", label: "修改工程文件访问权限" },
          { id: "uc_finished_delete", label: "删除" },
          { id: "uc_finished_asset_data", label: "查看素材数据" },
          { id: "uc_finished_reference_data", label: "查看引用数据" },
          { id: "uc_finished_new_version", label: "上传新版" },
        ]
      },
      {
        id: "uc_material_management",
        label: "素材管理",
        children: [
          { id: "uc_material_edit", label: "修改基础信息" },
          { id: "uc_material_status", label: "修改状态" },
          { id: "uc_material_download", label: "下载原片" },
          { id: "uc_material_logs", label: "查看操作记录" },
          { id: "uc_material_delete", label: "删除" },
          { id: "uc_material_reference_data", label: "查看引用数据" },
          { id: "uc_material_new_version", label: "上传新版" },
        ]
      },
      {
        id: "uc_third_party_management",
        label: "第三方管理",
        children: [
          { id: "uc_third_party_edit", label: "修改基础信息" },
          { id: "uc_third_party_status", label: "修改状态" },
          { id: "uc_third_party_download", label: "下载原片" },
          { id: "uc_third_party_logs", label: "查看操作记录" },
          { id: "uc_third_party_delete", label: "删除" },
          { id: "uc_third_party_reference_data", label: "查看引用数据" },
          { id: "uc_third_party_new_version", label: "上传新版" },
        ]
      },
      {
        id: "uc_script_management",
        label: "脚本管理",
        children: [
          { id: "uc_script_edit", label: "修改基础信息" },
          { id: "uc_script_status", label: "修改状态" },
          { id: "uc_script_logs", label: "查看操作记录" },
          { id: "uc_script_delete", label: "删除" },
        ]
      },
      {
        id: "uc_image_management",
        label: "图片管理",
        children: [
          { id: "uc_image_edit", label: "修改基础信息" },
          { id: "uc_image_download", label: "下载无水印图片" },
          { id: "uc_image_delete", label: "删除" },
        ]
      },
      {
        id: "uc_audio_management",
        label: "音频管理",
        children: [
          { id: "uc_audio_edit", label: "修改基础信息" },
          { id: "uc_audio_download", label: "下载" },
          { id: "uc_audio_delete", label: "删除" },
        ]
      },
    ]
  },
  { id: "uc_data_analysis", label: "数据分析" },
];

export const ADMIN_BACKEND_PERMISSION_TREE: PermissionNode[] = [
  {
    id: "ab_content_management",
    label: "内容管理",
    children: [
      { id: "ab_resource_view", label: "资源库（不包含删除类）" },
      { id: "ab_video_status_manage", label: "视频状态" },
      { id: "ab_task_manage", label: "任务" },
      { id: "ab_tag_manage", label: "公共标签" },
      { id: "ab_category_manage", label: "分类管理" },
      { id: "ab_script_template_manage", label: "脚本模板" },
    ]
  },
  {
    id: "ab_system_management",
    label: "系统管理",
    children: [
      { id: "ab_dept_view", label: "组织部门架构" },
      {
        id: "ab_member_view",
        label: "人员账号管理",
        children: [{ id: "ab_member_export", label: "导出人员表" }]
      },
      { id: "ab_role_view", label: "角色菜单权限配置" },
      {
        id: "ab_audit_view",
        label: "操作记录",
        children: [{ id: "ab_audit_export", label: "导出" }]
      },
      { id: "ab_watermark_manage", label: "水印" },
      { id: "ab_system_setting_manage", label: "系统设置" },
      { id: "ab_auto_tag_manage", label: "系统自动化标签" },
      { id: "ab_ad_group_manage", label: "广告组管理" },
      { id: "ab_login_log_view", label: "登录记录" },
      { id: "ab_message_rule_manage", label: "消息通知" },
    ]
  },
  { id: "ab_credit_manage", label: "积分管理" },
];

const getLeafKeysFromNodes = (nodes: PermissionNode[]): string[] => {
  let keys: string[] = [];
  for (const n of nodes) {
    if (n.children && n.children.length > 0) {
      keys = keys.concat(getLeafKeysFromNodes(n.children));
    } else {
      keys.push(n.id);
    }
  }
  return keys;
};

export const USER_PERMISSION_KEYS = getLeafKeysFromNodes(USER_CLIENT_PERMISSION_TREE);
export const ADMIN_PERMISSION_KEYS = getLeafKeysFromNodes(ADMIN_BACKEND_PERMISSION_TREE);
export const ALL_PERMISSION_KEYS = [...USER_PERMISSION_KEYS, ...ADMIN_PERMISSION_KEYS];

const BASIC_USER_KEYS = [
  "uc_resource_view_finished", "uc_resource_view_material", "uc_resource_view_third_party", "uc_resource_view_image",
  "uc_resource_view_audio", "uc_resource_view_script", "uc_remake_run"
];

const mergePermissionKeys = (...groups: string[][]): string[] => Array.from(new Set(groups.flat()));

const CONTENT_CREATOR_KEYS = [...USER_PERMISSION_KEYS];

const AD_OPERATOR_KEYS = [...BASIC_USER_KEYS, "uc_finished_ad_push", "uc_finished_ad_records"];

const ADMIN_CONTENT_KEYS = [
  "ab_resource_view", "ab_video_status_manage", "ab_task_manage", "ab_tag_manage",
  "ab_category_manage", "ab_script_template_manage"
];

const ADMIN_READ_KEYS = ["ab_resource_view", "ab_dept_view", "ab_member_view", "ab_role_view", "ab_audit_view"];

const DEPT_MANAGER_KEYS = mergePermissionKeys(
  CONTENT_CREATOR_KEYS,
  ["uc_credit_approve", "uc_data_dashboard", "uc_data_export"],
  ADMIN_READ_KEYS,
  ["ab_credit_manage"]
);

const SECURITY_AUDIT_KEYS = [
  "ab_role_view", "ab_audit_view", "ab_audit_export", "ab_login_log_view"
];

const INITIAL_ROLES: RolePermission[] = [
  {
    id: "role_staff",
    name: "普通员工",
    code: "STAFF",
    type: "preset",
    category: "other",
    description: "基础工作台、本人资源与被分配任务的最小可用权限",
    memberCount: 18,
    dataScope: "self",
    enabled: true,
    checkedKeys: BASIC_USER_KEYS,
    permissions: [],
    updatedAt: "2026-07-24 10:00"
  },
  {
    id: "role_super_admin",
    name: "超级管理员",
    code: "SUPER_ADMIN",
    type: "preset",
    category: "default",
    description: "全站最高控制权限，全选所有业务模块与系统管理权限",
    memberCount: 2,
    dataScope: "all",
    enabled: true,
    checkedKeys: ALL_PERMISSION_KEYS,
    permissions: [],
    updatedAt: "2026-07-24 09:00"
  },
  {
    id: "role_photo_edit",
    name: "摄影+剪辑",
    code: "PHOTO_EDIT",
    type: "preset",
    category: "other",
    description: "拍摄素材采集与AI剪辑成片一体化配置",
    memberCount: 6,
    dataScope: "self",
    enabled: true,
    checkedKeys: [...CONTENT_CREATOR_KEYS, "uc_material_pin"],
    permissions: [],
    updatedAt: "2026-07-23 15:20"
  },
  {
    id: "role_director_assist",
    name: "编导助理",
    code: "DIRECTOR_ASSIST",
    type: "preset",
    category: "other",
    description: "辅助爆款分镜拆解、剧本复刻与素材归类",
    memberCount: 4,
    dataScope: "self",
    enabled: true,
    checkedKeys: [
      ...BASIC_USER_KEYS,
      "uc_script_create", "uc_script_edit", "uc_material_edit"
    ],
    permissions: [],
    updatedAt: "2026-07-22 14:10"
  },
  {
    id: "role_content_edit",
    name: "内容部剪辑",
    code: "CONTENT_EDIT",
    type: "preset",
    category: "other",
    description: "内容中心专用精剪与字幕合成岗位",
    memberCount: 8,
    dataScope: "self",
    enabled: true,
    checkedKeys: CONTENT_CREATOR_KEYS,
    permissions: [],
    updatedAt: "2026-07-21 11:30"
  },
  {
    id: "role_transition_pitcher",
    name: "(过渡性角色) 投手+编导",
    code: "PITCH_DIR",
    type: "custom",
    category: "other",
    description: "兼任千川建组投放与爆款视频拆解复刻",
    memberCount: 2,
    dataScope: "dept_tree",
    enabled: true,
    checkedKeys: mergePermissionKeys(CONTENT_CREATOR_KEYS, AD_OPERATOR_KEYS),
    permissions: [],
    updatedAt: "2026-07-20 18:00"
  },
  {
    id: "role_pitcher",
    name: "投手",
    code: "PITCHER",
    type: "preset",
    category: "other",
    description: "负责广告主账号建组、消耗跟踪与一键同步投放",
    memberCount: 12,
    dataScope: "dept_tree",
    enabled: true,
    checkedKeys: AD_OPERATOR_KEYS,
    permissions: [],
    updatedAt: "2026-07-20 16:45"
  },
  {
    id: "role_editor",
    name: "剪辑",
    code: "EDITOR",
    type: "preset",
    category: "other",
    description: "负责视频精剪、爆款微调与画质一键增强",
    memberCount: 9,
    dataScope: "self",
    enabled: true,
    checkedKeys: CONTENT_CREATOR_KEYS,
    permissions: [],
    updatedAt: "2026-07-19 12:00"
  },
  {
    id: "role_cameraman",
    name: "摄影",
    code: "CAMERAMAN",
    type: "preset",
    category: "other",
    description: "现场素材拍摄、样片采集与原片批量归档",
    memberCount: 3,
    dataScope: "self",
    enabled: true,
    checkedKeys: [
      ...BASIC_USER_KEYS, "uc_material_upload", "uc_material_edit", "uc_material_download", "uc_material_category", "uc_material_pin"
    ],
    permissions: [],
    updatedAt: "2026-07-18 10:20"
  },
  {
    id: "role_copywriter",
    name: "文案",
    code: "COPYWRITER",
    type: "preset",
    category: "other",
    description: "AI文案写作、Hook爆点拆解与标题文案批注",
    memberCount: 5,
    dataScope: "self",
    enabled: true,
    checkedKeys: [
      ...BASIC_USER_KEYS, "uc_script_create", "uc_script_edit"
    ],
    permissions: [],
    updatedAt: "2026-07-17 15:00"
  },
  {
    id: "role_model",
    name: "模特",
    code: "MODEL",
    type: "preset",
    category: "other",
    description: "数字形象、出镜素材确认与成品合集查看",
    memberCount: 4,
    dataScope: "self",
    enabled: true,
    checkedKeys: BASIC_USER_KEYS,
    permissions: [],
    updatedAt: "2026-07-16 09:30"
  },
  {
    id: "role_brand_planner",
    name: "品牌策划",
    code: "BRAND_PLANNER",
    type: "preset",
    category: "other",
    description: "品牌视觉风格设定与商详视觉卡片审核",
    memberCount: 2,
    dataScope: "dept_tree",
    enabled: true,
    checkedKeys: [
      ...BASIC_USER_KEYS, "uc_finished_edit", "uc_script_create", "uc_script_edit"
    ],
    permissions: [],
    updatedAt: "2026-07-15 17:10"
  },
  {
    id: "role_star_biz",
    name: "星图商务",
    code: "STAR_BIZ",
    type: "preset",
    category: "other",
    description: "星图达人接单、第三方视频引用与合作对接",
    memberCount: 3,
    dataScope: "dept_tree",
    enabled: true,
    checkedKeys: AD_OPERATOR_KEYS,
    permissions: [],
    updatedAt: "2026-07-14 11:20"
  },
  {
    id: "role_live_assist",
    name: "直播助理",
    code: "LIVE_ASSIST",
    type: "preset",
    category: "other",
    description: "直播间切片推流、实时挂车与现场协助",
    memberCount: 5,
    dataScope: "self",
    enabled: true,
    checkedKeys: mergePermissionKeys(BASIC_USER_KEYS, ["uc_material_upload", "uc_material_edit"]),
    permissions: [],
    updatedAt: "2026-07-13 19:00"
  },
  {
    id: "role_live_anchor",
    name: "直播主播",
    code: "LIVE_ANCHOR",
    type: "preset",
    category: "other",
    description: "直播出镜与录屏切片归档授权",
    memberCount: 6,
    dataScope: "self",
    enabled: true,
    checkedKeys: BASIC_USER_KEYS,
    permissions: [],
    updatedAt: "2026-07-12 16:10"
  },
  {
    id: "role_live_head",
    name: "直播负责人",
    code: "LIVE_HEAD",
    type: "preset",
    category: "other",
    description: "直播部门业务统筹、排期与切片发布管理",
    memberCount: 2,
    dataScope: "dept_tree",
    enabled: true,
    checkedKeys: [...BASIC_USER_KEYS, "uc_finished_upload", "uc_finished_download", "uc_data_dashboard"],
    permissions: [],
    updatedAt: "2026-07-11 14:00"
  },
  {
    id: "role_ops_head",
    name: "运营负责人",
    code: "OPS_HEAD",
    type: "preset",
    category: "other",
    description: "整体电商运营策略、投放效果监控与大盘调度",
    memberCount: 3,
    dataScope: "all",
    enabled: true,
    checkedKeys: mergePermissionKeys(
      USER_PERMISSION_KEYS,
      ADMIN_CONTENT_KEYS,
      ADMIN_READ_KEYS,
      [
        "ab_export_audit_view", "ab_credit_account_view", "ab_credit_application_view", "ab_credit_application_approve",
        "ab_dashboard_view", "ab_business_data_view", "ab_business_data_export"
      ]
    ),
    permissions: [],
    updatedAt: "2026-07-10 10:00"
  },
  {
    id: "role_content_head",
    name: "内容负责人",
    code: "CONTENT_HEAD",
    type: "preset",
    category: "other",
    description: "内容生产质量控制、AI复刻模版审批与团队质检",
    memberCount: 2,
    dataScope: "all",
    enabled: true,
    checkedKeys: mergePermissionKeys(
      CONTENT_CREATOR_KEYS,
      [
        "uc_finished_delete", "uc_material_pin", "uc_material_delete", "uc_script_delete",
        "uc_credit_approve"
      ],
      ADMIN_CONTENT_KEYS,
      ["ab_dept_view", "ab_member_view", "ab_role_view", "ab_audit_view", "ab_dashboard_view"]
    ),
    permissions: [],
    updatedAt: "2026-07-09 15:40"
  },
  {
    id: "role_dept_head",
    name: "部门负责人/主管",
    code: "DEPT_HEAD",
    type: "preset",
    category: "other",
    description: "管理本部门及下级分组的任务、内容、数据与积分审批",
    memberCount: 5,
    dataScope: "dept_tree",
    enabled: true,
    checkedKeys: DEPT_MANAGER_KEYS,
    permissions: [],
    updatedAt: "2026-08-19 16:20"
  },
  {
    id: "role_security_auditor",
    name: "安全审计员",
    code: "SECURITY_AUDITOR",
    type: "preset",
    category: "other",
    description: "查看操作、登录与数据导出审计记录，并核查高风险导出",
    memberCount: 2,
    dataScope: "all",
    enabled: true,
    checkedKeys: SECURITY_AUDIT_KEYS,
    permissions: [],
    updatedAt: "2026-08-19 16:20"
  },
  {
    id: "role_finance",
    name: "积分与财务管理员",
    code: "FINANCE_ADMIN",
    type: "preset",
    category: "other",
    description: "管理企业积分账户、审批记录及全公司业务数据只读查看",
    memberCount: 2,
    dataScope: "all",
    enabled: true,
    checkedKeys: [
      "uc_home_view", "uc_message_view", "uc_credit_view", "uc_credit_approve", "uc_data_dashboard",
      "ab_credit_account_view", "ab_credit_recharge", "ab_credit_application_view", "ab_credit_application_approve",
      "ab_credit_record_export", "ab_credit_rule_manage", "ab_dashboard_view", "ab_business_data_view"
    ],
    permissions: [],
    updatedAt: "2026-08-19 16:20"
  }
].filter(role => !["role_live_assist", "role_live_anchor", "role_live_head"].includes(role.id)) as RolePermission[];

const SUPER_ADMIN_ROLE_ID = "role_super_admin";

function normalizeSystemRoles(roles: RolePermission[]): RolePermission[] {
  const superAdmin = INITIAL_ROLES.find(role => role.id === SUPER_ADMIN_ROLE_ID)!;
  const validKeys = new Set(ALL_PERMISSION_KEYS);
  const normalizeKeys = (keys?: string[]) => (keys || []).filter(key => validKeys.has(key));
  const next = roles.map<RolePermission>(role => role.id === SUPER_ADMIN_ROLE_ID
    ? { ...role, name: superAdmin.name, code: superAdmin.code, type: "preset",
      category: "default", description: superAdmin.description,
      enabled: true, dataScope: "all", checkedKeys: [...ALL_PERMISSION_KEYS] }
    : { ...role, category: role.category === "default" ? "other" : role.category, checkedKeys: normalizeKeys(role.checkedKeys) });
  // Preserve role IDs and ordering because existing member defaults use array positions.
  if (!next.some(role => role.id === "role_staff")) next.unshift({ ...INITIAL_ROLES[0], checkedKeys: normalizeKeys(INITIAL_ROLES[0].checkedKeys) });
  if (!next.some(role => role.id === SUPER_ADMIN_ROLE_ID)) next.push({ ...superAdmin, checkedKeys: [...ALL_PERMISSION_KEYS] });
  return next;
}

// ---------------------------------------------------------------------------
// TYPES & DATA STRUCTURES FOR NOTIFICATIONS
// ---------------------------------------------------------------------------
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  recipients: string;
  enabled: boolean;
  channels: {
    system?: boolean;
    mobile?: boolean;
    feishu?: boolean;
  };
  hasCustomConfig?: boolean;
}

export interface NotificationCategory {
  id: string;
  title: string;
  items: NotificationItem[];
}

export const INITIAL_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: "approval",
    title: "审批待办",
    items: [
      {
        id: "credit_application",
        title: "积分申请",
        description: "员工提交额外积分申请后生成待办；审批人可在消息详情中选择同意或拒绝",
        recipients: "申请人的直属部长/主管",
        enabled: true,
        channels: { system: true }
      }
    ]
  },
  {
    id: "task",
    title: "任务协作",
    items: [
      {
        id: "task_created",
        title: "新任务",
        description: "发布人创建任务并指派执行人后发送",
        recipients: "被指派的执行人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "task_rescheduled",
        title: "任务改期",
        description: "任务的出片日期或截止时间被发布人修改后发送",
        recipients: "任务执行人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "task_work_linked",
        title: "关联作品",
        description: "执行人为任务新增或移除关联作品后发送，并展示当前已关联数量",
        recipients: "任务发布人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "task_script_linked",
        title: "关联脚本",
        description: "执行人为任务新增、替换或移除关联脚本后发送",
        recipients: "任务发布人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "task_completed",
        title: "任务完成",
        description: "已上传任务所需数量的作品时自动发送，并将任务标记为已达标",
        recipients: "任务发布人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "task_overdue",
        title: "任务逾期",
        description: "超过任务出片时间且未达到要求数量时由系统自动发送",
        recipients: "任务发布人和执行人",
        enabled: true,
        channels: { system: true }
      }
    ]
  },
  {
    id: "resource",
    title: "内容资源",
    items: [
      {
        id: "upload_success",
        title: "上传成功",
        description: "素材或成片上传并完成转码入库后发送",
        recipients: "上传操作人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "upload_failed",
        title: "上传失败",
        description: "上传、分片校验或转码失败时发送，并给出失败阶段和重试建议",
        recipients: "上传操作人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "ai_generation_completed",
        title: "AI生成完成",
        description: "AI 视频或爆款复刻任务完成时发送，并展示成功数量和积分消耗",
        recipients: "AI 任务发起人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "resource_status_changed",
        title: "状态修改",
        description: "素材、成片或脚本的业务状态被其他成员修改后发送",
        recipients: "资源上传人/负责人",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "resource_mentioned",
        title: "批注与@提醒",
        description: "成员新增批注、回复批注或在批注中 @ 指定人员时发送",
        recipients: "被 @ 人；回复时同时通知原批注人",
        enabled: true,
        channels: { system: true }
      }
    ]
  },
  {
    id: "live",
    title: "直播",
    items: [
      {
        id: "live_shift_created",
        title: "新增排班",
        description: "直播间新增场次并选择参与主播、助播和场控后发送",
        recipients: "该直播场次关联的全部人员",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "live_shift_changed",
        title: "排班调整",
        description: "直播日期、时间段、直播间或参与人员发生变化后发送，并展示调整前后内容",
        recipients: "调整前后涉及的全部人员",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "live_shift_cancelled",
        title: "取消场次",
        description: "直播场次被取消后发送，并展示取消人和取消原因",
        recipients: "该直播场次关联的全部人员",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "live_start_reminder",
        title: "开播提醒",
        description: "按场次设定时间在开播前自动发送准备提醒",
        recipients: "该直播场次关联的全部人员",
        enabled: true,
        channels: { system: true }
      }
    ]
  },
  {
    id: "security",
    title: "安全与系统",
    items: [
      {
        id: "abnormal_login",
        title: "异常登录",
        description: "检测到异地 IP、新设备或高风险环境登录时发送",
        recipients: "账号本人和安全管理员",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "account_locked",
        title: "账号锁定",
        description: "连续多次登录失败触发账号临时锁定时发送",
        recipients: "账号本人和管理员",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "permission_changed",
        title: "权限变更",
        description: "用户角色、数据范围或功能权限被管理员调整并生效后发送",
        recipients: "权限被调整的用户",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "data_export_audit",
        title: "数据导出记录",
        description: "用户导出报表或业务数据后生成审计消息；大批量、跨部门或包含敏感字段时标记为高风险",
        recipients: "超级管理员和指定安全审计角色",
        enabled: true,
        channels: { system: true }
      },
      {
        id: "system_notice",
        title: "系统公告",
        description: "系统维护、功能停用或重要平台规则调整时由平台发布",
        recipients: "公告指定范围内的用户",
        enabled: true,
        channels: { system: true }
      }
    ]
  }
];

export default function AdminSystemManagementView() {
  const [activeTab, setActiveTab] = useState<SystemTabType>("roles");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const tabs: { id: SystemTabType; label: string; icon: any; desc: string }[] = [
    { id: "depts", label: "组织部门架构", icon: Building2, desc: "树状多层级公司、部门与业务分组架构配置" },
    { id: "members", label: "人员账号管理", icon: Users, desc: "企业全员账号列表、组织归属与状态管控" },
    { id: "roles", label: "角色与权限矩阵", icon: ShieldCheck, desc: "自定义角色菜单与按钮级精细化权限矩阵" },
    { id: "audit", label: "操作记录", icon: FileText, desc: "全员系统操作审计日志与追溯" },
    { id: "watermark", label: "水印", icon: ImageIcon, desc: "全局图文水印与视频防盗贴图设置" },
    { id: "system_settings", label: "系统设置", icon: Settings, desc: "站点配置、存储引擎与渲染基础参数" },
    { id: "auto_tags", label: "系统自动化标签", icon: Tag, desc: "AI智能触发打标规则与指标自动分流" },
    { id: "ad_groups", label: "广告组管理", icon: Megaphone, desc: "跨平台广告组绑定、预算控制与同步" },
    { id: "login_logs", label: "登录记录", icon: Key, desc: "账号登录历史、IP终端及安全预警" },
    { id: "notifications", label: "消息通知", icon: Bell, desc: "系统预警、任务状态与通知渠道订阅" },
  ];

  // ---------------------------------------------------------------------------
  // 0. 组织部门架构 & 人员账号管理 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const DEFAULT_PLATFORM_PASSWORD = "Dc@20258888";

  const appendAuditLog = (type: string, target: string, detail: string) => {
    console.log(`[AuditLog] ${type} - ${target}: ${detail}`);
  };

  const [depts, setDepts] = useState<DeptNode[]>(() => {
    const saved = localStorage.getItem("cloud_video_depts");
    if (!saved) return INITIAL_DEPTS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_DEPTS;
    }
  });

  const [members, setMembers] = useState<AccountMember[]>(() => {
    return readReportOrganization().members;
  });

  React.useEffect(() => {
    localStorage.setItem("cloud_video_depts", JSON.stringify(depts));
    window.dispatchEvent(new Event(ORGANIZATION_CHANGE));
  }, [depts]);

  React.useEffect(() => {
    localStorage.setItem("cloud_video_members", JSON.stringify(members));
    window.dispatchEvent(new Event(ORGANIZATION_CHANGE));
  }, [members]);

  // Dept Modal
  const [deptModal, setDeptModal] = useState<{ open: boolean; mode: "add" | "edit"; data?: DeptNode } | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    levelType: "department" as "department" | "group",
    parentId: "dept_root",
    manager: "",
    phone: "",
    quota: 10,
    type: "综合部门" as DeptNode["type"],
    description: ""
  });

  const handleOpenAddDept = (parentId: string = "dept_root", levelType: "department" | "group" = "department") => {
    setDeptForm({
      name: "",
      code: levelType === "group" ? "GRP-NEW" : "DEPT-NEW",
      levelType,
      parentId: levelType === "department" ? "dept_root" : parentId,
      manager: "",
      phone: "",
      quota: 10,
      type: (levelType === "group" ? "投放组" : "综合部门") as DeptNode["type"],
      description: ""
    });
    setDeptModal({ open: true, mode: "add" });
  };

  const handleOpenEditDept = (dept: DeptNode) => {
    const rawType = dept.levelType === "company" ? "department" : dept.levelType;
    const resolvedLevelType: "department" | "group" = rawType || (dept.parentId === "dept_root" ? "department" : "group");

    setDeptForm({
      name: dept.name,
      code: dept.code,
      levelType: resolvedLevelType,
      parentId: dept.parentId || "dept_root",
      manager: dept.manager,
      phone: dept.phone,
      quota: dept.quota,
      type: dept.type,
      description: dept.description
    });
    setDeptModal({ open: true, mode: "edit", data: dept });
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      showToast("名称不能为空");
      return;
    }

    let finalParentId = deptForm.parentId;
    if (deptForm.levelType === "department") {
      finalParentId = "dept_root";
    }

    if (deptModal?.mode === "add") {
      const newDept: DeptNode = {
        id: "dept_" + Date.now(),
        name: deptForm.name,
        code: deptForm.code || (deptForm.levelType === "group" ? "GRP-NEW" : "DEPT-NEW"),
        parentId: finalParentId,
        levelType: deptForm.levelType,
        manager: deptForm.manager || "未设定",
        phone: deptForm.phone || "-",
        memberCount: 0,
        quota: deptForm.quota || 10,
        type: deptForm.type,
        description: deptForm.description || (deptForm.levelType === "group" ? "全新设立分组" : "全新设立部门"),
        createdAt: new Date().toISOString().slice(0, 10),
        status: "active"
      };
      setDepts([...depts, newDept]);
      appendAuditLog("部门更替", newDept.name, `新建${deptForm.levelType === "group" ? "分组" : "部门"}【${newDept.name}】`);
      showToast(`✅ 成功创建${deptForm.levelType === "group" ? "分组" : "部门"}【${newDept.name}】！`);
    } else if (deptModal?.data) {
      const updated: DeptNode[] = depts.map(d => {
        if (d.id === deptModal.data!.id) {
          return {
            ...d,
            name: deptForm.name,
            code: deptForm.code,
            parentId: finalParentId,
            levelType: deptForm.levelType,
            manager: deptForm.manager,
            phone: deptForm.phone,
            quota: deptForm.quota,
            type: deptForm.type as DeptNode["type"],
            description: deptForm.description
          };
        }
        return d;
      });
      setDepts(updated);
      appendAuditLog("部门更替", deptForm.name, `更新${deptForm.levelType === "group" ? "分组" : "部门"}【${deptForm.name}】`);
      showToast(`✅ ${deptForm.levelType === "group" ? "分组" : "部门"}【${deptForm.name}】配置更新成功！`);
    }
    setDeptModal(null);
  };

  const handleDeleteDept = (id: string) => {
    const dept = depts.find(d => d.id === id);
    if (!dept) return;

    const memberInDept = members.filter(m => m.deptId === id);
    if (memberInDept.length > 0) {
      if (!confirm(`部门【${dept.name}】下目前尚有 ${memberInDept.length} 名成员，解散后人员将被移至根组织。是否确定继续解散？`)) {
        return;
      }
      setMembers(prev => prev.map(m => m.deptId === id ? { ...m, deptId: "dept_root" } : m));
    } else {
      if (!confirm(`确定要解散并注销部门【${dept.name}】吗？此操作无法撤销。`)) return;
    }

    setDepts(prev => prev.filter(d => d.id !== id));
    appendAuditLog("部门更替", dept.name, `解散部门【${dept.name}】`);
    showToast(`🗑️ 部门【${dept.name}】已成功解散！`);
  };

  // Member Filter & Modal state
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberFilterDept, setMemberFilterDept] = useState("all");
  const [memberFilterRole, setMemberFilterRole] = useState("all");
  const [memberFilterStatus, setMemberFilterStatus] = useState("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [memberModal, setMemberModal] = useState<{ open: boolean; mode: "add" | "edit"; data?: AccountMember } | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    open: boolean;
    member: AccountMember;
    resetType: "default" | "custom" | "random";
    customPassword: string;
    notifyUser: boolean;
    forceNextChange: boolean;
  } | null>(null);

  const getDeptAndGroupFromId = (id: string, deptsList: DeptNode[]) => {
    const item = deptsList.find(d => d.id === id);
    if (!item) {
      const defaultDept = deptsList.find(d => d.parentId === "dept_root" || d.id === "dept_root" || d.levelType === "department");
      return { deptId: defaultDept?.id || "dept_root", groupId: "" };
    }
    const parent = deptsList.find(d => d.id === item.parentId);
    if (parent && parent.id !== "dept_root") {
      return { deptId: parent.id, groupId: item.id };
    } else {
      return { deptId: item.id, groupId: "" };
    }
  };

  const [memberForm, setMemberForm] = useState({
    name: "",
    employeeNo: "",
    phone: "",
    email: "",
    selectedDeptId: "",
    selectedGroupId: "",
    deptId: "",
    roleId: "",
    dataScope: "self" as AccountMember["dataScope"],
    status: "normal" as AccountMember["status"],
    boundAccount: "巨量千川-千川主账号01 (1776342461268999)",
    remark: ""
  });

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteDeptId, setInviteDeptId] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");

  const handleMemberDeptChange = (newDeptId: string) => {
    const groups = depts.filter(g => g.parentId === newDeptId);
    const newGroupId = groups[0]?.id || "";
    const finalDeptId = newGroupId || newDeptId;
    setMemberForm(prev => ({
      ...prev,
      selectedDeptId: newDeptId,
      selectedGroupId: newGroupId,
      deptId: finalDeptId
    }));
  };

  const handleMemberGroupChange = (newGroupId: string) => {
    const finalDeptId = newGroupId || memberForm.selectedDeptId;
    setMemberForm(prev => ({
      ...prev,
      selectedGroupId: newGroupId,
      deptId: finalDeptId
    }));
  };

  const handleOpenAddMember = () => {
    const nextNo = "ZS-" + Math.floor(100 + Math.random() * 900);
    const firstDept = depts.find(d => d.parentId === "dept_root" && d.id !== "dept_root") || depts.find(d => d.id === "dept_root") || depts[0];
    const selDeptId = firstDept?.id || "dept_root";
    const availableGroups = depts.filter(g => g.parentId === selDeptId);
    const selGroupId = availableGroups[0]?.id || "";
    const finalDeptId = selGroupId || selDeptId;

    setMemberForm({
      name: "",
      employeeNo: nextNo,
      phone: "",
      email: "",
      selectedDeptId: selDeptId,
      selectedGroupId: selGroupId,
      deptId: finalDeptId,
      roleId: [roles[2], ...roles].find(role => role && role.id !== SUPER_ADMIN_ROLE_ID)?.id || "",
      dataScope: "self",
      status: "normal",
      boundAccount: "巨量千川-千川主账号01 (1776342461268999)",
      remark: ""
    });
    setMemberModal({ open: true, mode: "add" });
  };

  const handleOpenEditMember = (m: AccountMember) => {
    const { deptId: selDeptId, groupId: selGroupId } = getDeptAndGroupFromId(m.deptId, depts);
    setMemberForm({
      name: m.name,
      employeeNo: m.employeeNo,
      phone: m.phone,
      email: m.email,
      selectedDeptId: selDeptId,
      selectedGroupId: selGroupId,
      deptId: selGroupId || selDeptId || m.deptId,
      roleId: m.roleIds[0] || "",
      dataScope: m.dataScope || "self",
      status: m.status,
      boundAccount: m.boundAccount || "巨量千川-千川主账号01 (1776342461268999)",
      remark: m.remark || ""
    });
    setMemberModal({ open: true, mode: "edit", data: m });
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      showToast("成员姓名不能为空");
      return;
    }
    if (!memberForm.phone.trim() || memberForm.phone.length < 8) {
      showToast("请输入有效手机号码");
      return;
    }

    const matchedRole = roles.find(r => r.id === memberForm.roleId);
    const roleName = matchedRole ? matchedRole.name : "普通成员";

    if (memberModal?.mode === "add") {
      const newMember: AccountMember = {
        id: "mem_" + Date.now(),
        employeeNo: memberForm.employeeNo || "ZS-" + Math.floor(Math.random() * 899 + 100),
        name: memberForm.name,
        phone: memberForm.phone,
        email: memberForm.email || `${memberForm.phone}@dreamchang.com`,
        deptId: memberForm.deptId || "dept_root",
        roleIds: memberForm.roleId ? [memberForm.roleId] : [],
        roleName,
        dataScope: memberForm.dataScope,
        status: memberForm.status,
        boundAccount: memberForm.boundAccount,
        createdAt: new Date().toISOString().slice(0, 10),
        lastActiveAt: "刚刚注册",
        logCount: 0,
        remark: memberForm.remark
      };

      setMembers([newMember, ...members]);
      setDepts(prev => prev.map(d => d.id === newMember.deptId ? { ...d, memberCount: d.memberCount + 1 } : d));
      appendAuditLog("账号创建", newMember.name, `手动录入成员【${newMember.name}】`);
      showToast(`✅ 成员【${newMember.name}】账号录入成功！`);
    } else if (memberModal?.data) {
      const prevDeptId = memberModal.data.deptId;
      const updated = members.map(m => {
        if (m.id === memberModal.data!.id) {
          return {
            ...m,
            name: memberForm.name,
            employeeNo: memberForm.employeeNo,
            phone: memberForm.phone,
            email: memberForm.email,
            deptId: memberForm.deptId,
            roleIds: [memberForm.roleId],
            roleName,
            dataScope: memberForm.dataScope,
            status: memberForm.status,
            boundAccount: memberForm.boundAccount,
            remark: memberForm.remark
          };
        }
        return m;
      });

      setMembers(updated);

      if (prevDeptId !== memberForm.deptId) {
        setDepts(prev => prev.map(d => {
          if (d.id === prevDeptId) return { ...d, memberCount: Math.max(0, d.memberCount - 1) };
          if (d.id === memberForm.deptId) return { ...d, memberCount: d.memberCount + 1 };
          return d;
        }));
      }

      appendAuditLog("角色权限变更", memberForm.name, `修改成员【${memberForm.name}】角色为【${roleName}】`);
      showToast(`✅ 成员【${memberForm.name}】配置保存成功！`);
    }

    setMemberModal(null);
  };

  const handleToggleMemberStatus = (m: AccountMember) => {
    const nextStatus: AccountMember["status"] = m.status === "normal" ? "disabled" : "normal";
    setMembers(prev => prev.map(item => item.id === m.id ? { ...item, status: nextStatus } : item));
    appendAuditLog("状态变更", m.name, `调整账号【${m.name}】状态为【${nextStatus === "normal" ? "正常启用" : "禁用停用"}】`);
    showToast(`已${nextStatus === "normal" ? "解封" : "停用"}账号【${m.name}】`);
  };

  const handleDeleteMember = (id: string) => {
    const m = members.find(item => item.id === id);
    if (!m) return;
    if (!confirm(`确定要彻底注销并删除成员【${m.name}】吗？`)) return;

    setMembers(prev => prev.filter(item => item.id !== id));
    setDepts(prev => prev.map(d => d.id === m.deptId ? { ...d, memberCount: Math.max(0, d.memberCount - 1) } : d));
    appendAuditLog("敏感解绑", m.name, `注销系统成员【${m.name}】账号`);
    showToast(`🗑️ 成员【${m.name}】已被彻底移除！`);
  };

  const handleOpenResetPassword = (m: AccountMember) => {
    setResetPasswordModal({
      open: true,
      member: m,
      resetType: "default",
      customPassword: DEFAULT_PLATFORM_PASSWORD,
      notifyUser: true,
      forceNextChange: true
    });
  };

  const handleConfirmResetPassword = () => {
    if (!resetPasswordModal) return;
    const { member, resetType, customPassword } = resetPasswordModal;

    let finalPwd = DEFAULT_PLATFORM_PASSWORD;
    if (resetType === "custom" && customPassword.trim()) {
      finalPwd = customPassword.trim();
    } else if (resetType === "random") {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
      finalPwd = Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    }

    appendAuditLog(
      "密码重置",
      member.name,
      `管理员重置了成员【${member.name}】密码`
    );

    try {
      navigator.clipboard.writeText(finalPwd);
      showToast(`🔑 成员【${member.name}】登录密码已重置为 [${finalPwd}]，已自动复制剪贴板！`);
    } catch {
      showToast(`🔑 成员【${member.name}】登录密码已成功重置为：${finalPwd}`);
    }

    setResetPasswordModal(null);
  };

  const handleBatchResetPassword = () => {
    if (selectedMemberIds.length === 0) return;
    const count = selectedMemberIds.length;
    if (!confirm(`确定要为选中的 ${count} 位成员重置登录密码为初始默认密码 [${DEFAULT_PLATFORM_PASSWORD}] 吗？`)) return;

    try {
      navigator.clipboard.writeText(DEFAULT_PLATFORM_PASSWORD);
      showToast(`🔑 已为选中的 ${count} 位成员批量重置登录密码为：${DEFAULT_PLATFORM_PASSWORD}（已复制）`);
    } catch {
      showToast(`🔑 已为选中的 ${count} 位成员批量重置登录密码为：${DEFAULT_PLATFORM_PASSWORD}`);
    }

    setSelectedMemberIds([]);
  };

  const handleOpenInviteModal = () => {
    const defaultDeptId = depts.find(d => d.id !== "dept_root")?.id || depts[0]?.id || "dept_root";
    const defaultRoleId = roles.find(r => r.id !== SUPER_ADMIN_ROLE_ID)?.id || "";
    setInviteDeptId(defaultDeptId);
    setInviteRoleId(defaultRoleId);
    setInviteLink(`https://sucaicloud.com/invite/join?org=dreamchang&dept=${defaultDeptId}&code=${Math.random().toString(36).substring(2, 8)}`);
    setInviteModalOpen(true);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast("📋 专属邀请加入链接已成功复制到剪贴板！");
  };

  const handleSelectAllMembers = () => {
    if (selectedMemberIds.length === filteredMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map(m => m.id));
    }
  };

  const handleBatchStatusChange = (status: AccountMember["status"]) => {
    if (selectedMemberIds.length === 0) return;
    setMembers(prev => prev.map(m => selectedMemberIds.includes(m.id) ? { ...m, status } : m));
    showToast(`已对所选 ${selectedMemberIds.length} 位成员执行批量状态变更`);
    setSelectedMemberIds([]);
  };

  const handleConfirmImportCsv = () => {
    if (!importCsvText.trim()) {
      showToast("请输入或粘贴 CSV 数据");
      return;
    }
    const lines = importCsvText.trim().split("\n");
    let addedCount = 0;

    const newMems: AccountMember[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 2 && parts[0] !== "姓名") {
        const name = parts[0];
        const phone = parts[1];
        const roleStr = parts[2] || "广告投手 (Media Buyer)";
        const email = parts[3] || `${phone}@dreamchang.com`;

        newMems.push({
          id: "mem_csv_" + Date.now() + "_" + idx,
          employeeNo: "ZS-" + (500 + idx),
          name,
          phone,
          email,
          deptId: depts[1]?.id || "dept_root",
          roleIds: [[roles[2], ...roles].find(role => role && role.id !== SUPER_ADMIN_ROLE_ID)?.id || ""],
          roleName: roleStr,
          dataScope: "self",
          status: "normal",
          createdAt: new Date().toISOString().slice(0, 10),
          lastActiveAt: "批量导入待激活",
          logCount: 0
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setMembers([...newMems, ...members]);
      showToast(`🎉 成功批量导入 ${addedCount} 名成员账号！`);
      setImportCsvText("");
      setImportModalOpen(false);
    } else {
      showToast("解析数据格式错误，请按 [姓名,手机号,角色,邮箱] 填写");
    }
  };

  const handleExportMembersCsv = () => {
    const header = "工号,姓名,手机号,邮箱,部门,角色,数据权限,状态,创建日期\n";
    const body = filteredMembers.map(m => {
      const deptName = depts.find(d => d.id === m.deptId)?.name || "主公司";
      return `"${m.employeeNo}","${m.name}","${m.phone}","${m.email}","${deptName}","${m.roleName}","${m.dataScope}","${m.status}","${m.createdAt}"`;
    }).join("\n");

    const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `云视频管家_全员名单_${new Date().toISOString().slice(0, 10)}.csv`;
    recordExport(blob, a.download, "成员名单");
    a.click();
    showToast("📄 成员名单 CSV 文件已生成并开始下载！");
  };

  const filteredMembers = members.filter((m) => {
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchPhone = m.phone.includes(q);
      const matchEmail = m.email.toLowerCase().includes(q);
      const matchNo = m.employeeNo.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchNo) return false;
    }
    if (memberFilterDept !== "all") {
      if (m.deptId !== memberFilterDept) {
        const isChild = depts.some(d => d.id === m.deptId && d.parentId === memberFilterDept);
        if (!isChild) return false;
      }
    }
    if (memberFilterRole !== "all" && !m.roleIds.includes(memberFilterRole)) return false;
    if (memberFilterStatus !== "all" && m.status !== memberFilterStatus) return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // 1. 角色与权限矩阵 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [roles, setRoles] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem("cloud_video_roles_v2");
    let next = normalizeSystemRoles(INITIAL_ROLES);
    try {
      if (saved) next = normalizeSystemRoles(JSON.parse(saved));
    } catch {
      // Invalid legacy role data falls back to the built-in catalog.
    }
    localStorage.setItem("cloud_video_roles_v2", JSON.stringify(next));
    return next;
  });

  const [selectedRoleId, setSelectedRoleId] = useState<string>("role_super_admin");
  React.useEffect(() => { window.dispatchEvent(new Event(AD_CHANGE_EVENT)); }, [roles]);
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const isSuperAdminRole = selectedRole?.id === SUPER_ADMIN_ROLE_ID;
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormName, setRoleFormName] = useState("");
  const [roleFormDesc, setRoleFormDesc] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const handleOpenAddRole = () => {
    setEditingRoleId(null);
    setRoleFormName("");
    setRoleFormDesc("");
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RolePermission) => {
    if (role.id === SUPER_ADMIN_ROLE_ID) return;
    setEditingRoleId(role.id);
    setRoleFormName(role.name);
    setRoleFormDesc(role.description || "");
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    if (editingRoleId === SUPER_ADMIN_ROLE_ID) return;
    if (!roleFormName.trim()) {
      showToast("请输入角色名称");
      return;
    }
    if (editingRoleId) {
      setRoles((prev) => {
        const next = prev.map((r) =>
          r.id === editingRoleId ? { ...r, name: roleFormName, description: roleFormDesc, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : r
        );
        localStorage.setItem("cloud_video_roles_v2", JSON.stringify(next));
        return next;
      });
      showToast("✅ 修改角色成功");
    } else {
      const newRole: RolePermission = {
        id: `role_${Date.now()}`,
        name: roleFormName.trim(),
        code: `CUSTOM_${Date.now().toString().slice(-4)}`,
        type: "custom",
        category: "other",
        description: roleFormDesc.trim() || "自定义新增业务角色",
        memberCount: 0,
        dataScope: "self",
        enabled: true,
        checkedKeys: BASIC_USER_KEYS,
        permissions: [],
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setRoles((prev) => {
        const next = [...prev, newRole];
        localStorage.setItem("cloud_video_roles_v2", JSON.stringify(next));
        return next;
      });
      setSelectedRoleId(newRole.id);
      showToast(`🎉 已成功创建角色 [${roleFormName.trim()}]`);
    }
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
    if (id === SUPER_ADMIN_ROLE_ID) return;
    const roleToDelete = roles.find((r) => r.id === id);
    if (roleToDelete?.type === "preset") {
      showToast("预设角色不可删除，可复制后调整为自定义角色");
      return;
    }
    if (confirm(`确定要删除角色【${roleToDelete?.name}】吗？`)) {
      setRoles((prev) => {
        const next = prev.filter((r) => r.id !== id);
        localStorage.setItem("cloud_video_roles_v2", JSON.stringify(next));
        return next;
      });
      if (selectedRoleId === id) {
        setSelectedRoleId("role_super_admin");
      }
      showToast("🗑️ 已删除该角色");
    }
  };

  const handleCopyRole = (role: RolePermission, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRole: RolePermission = {
      ...role,
      id: `role_copy_${Date.now()}`,
      name: `${role.name} (副本)`,
      code: `${role.code || 'ROLE'}_COPY`,
      type: "custom",
      category: "other",
      memberCount: 0,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setRoles(prev => {
      const next = [...prev, newRole];
      localStorage.setItem("cloud_video_roles_v2", JSON.stringify(next));
      return next;
    });
    setSelectedRoleId(newRole.id);
    showToast(`📋 已成功复刻角色 [${role.name}]`);
  };

  const handleToggleRoleEnabled = () => {
    if (!selectedRole || isSuperAdminRole) return;
    const nextEnabled = !(selectedRole.enabled ?? true);
    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, enabled: nextEnabled } : r));
    showToast(`⚡ 角色【${selectedRole.name}】已${nextEnabled ? '开启' : '停用'}`);
  };

  const handleChangeRoleDataScope = (dataScope: NonNullable<RolePermission["dataScope"]>) => {
    if (!selectedRole || isSuperAdminRole) return;
    setRoles(prev => prev.map(role => role.id === selectedRoleId ? { ...role, dataScope } : role));
  };

  const handleToggleNodeChecked = (nodeId: string, nodeChildrenKeys: string[]) => {
    if (!selectedRole || isSuperAdminRole) return;
    const currentKeys = selectedRole.checkedKeys || [];
    
    let nextKeys: string[] = [];
    if (nodeChildrenKeys.length > 0) {
      const isAllChecked = nodeChildrenKeys.every(k => currentKeys.includes(k));
      if (isAllChecked) {
        nextKeys = currentKeys.filter(k => !nodeChildrenKeys.includes(k));
      } else {
        const setObj = new Set([...currentKeys, ...nodeChildrenKeys]);
        nextKeys = Array.from(setObj);
      }
    } else {
      if (currentKeys.includes(nodeId)) {
        nextKeys = currentKeys.filter(k => k !== nodeId);
      } else {
        nextKeys = [...currentKeys, nodeId];
      }
    }

    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, checkedKeys: nextKeys } : r));
  };

  const handleSelectAllTree = () => {
    if (!selectedRole || isSuperAdminRole) return;
    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, checkedKeys: ALL_PERMISSION_KEYS } : r));
    showToast("✅ 已全选当前角色的所有控制菜单");
  };

  const handleClearAllTree = () => {
    if (!selectedRole || isSuperAdminRole) return;
    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, checkedKeys: [] } : r));
    showToast("🧹 已清空当前角色的所有控制权限");
  };

  const handleSaveRolePermissions = () => {
    if (!selectedRole || isSuperAdminRole) return;
    localStorage.setItem("cloud_video_roles_v2", JSON.stringify(roles));
    window.dispatchEvent(new Event(AD_CHANGE_EVENT));
    showToast(`✅ 角色【${selectedRole.name}】权限矩阵保存成功！`);
  };

  // Node Expansion State
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([
    "uc_resource_library", "uc_resource_upload", "uc_finished_management", "uc_material_management",
    "uc_third_party_management", "uc_script_management", "uc_image_management", "uc_audio_management",
    "ab_content_management", "ab_system_management", "ab_member_view", "ab_audit_view"
  ]);

  const toggleExpandNode = (nodeId: string) => {
    setExpandedNodeIds(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  };

  const getLeafKeysOfNode = (node: PermissionNode): string[] => {
    if (!node.children || node.children.length === 0) {
      return [node.id];
    }
    let keys: string[] = [];
    for (const child of node.children) {
      keys = keys.concat(getLeafKeysOfNode(child));
    }
    return keys;
  };

  const getNodeCheckState = (node: PermissionNode, currentKeys: string[]) => {
    const leafKeys = getLeafKeysOfNode(node);
    const checkedCount = leafKeys.filter(k => currentKeys.includes(k)).length;
    if (checkedCount === leafKeys.length && leafKeys.length > 0) {
      return { isChecked: true, isIndeterminate: false };
    } else if (checkedCount > 0) {
      return { isChecked: false, isIndeterminate: true };
    }
    return { isChecked: false, isIndeterminate: false };
  };

  const handleToggleNode = (node: PermissionNode) => {
    if (!selectedRole || isSuperAdminRole) return;
    const currentKeys = selectedRole.checkedKeys || [];
    const leafKeys = getLeafKeysOfNode(node);
    const allChecked = leafKeys.every(k => currentKeys.includes(k));

    let nextKeys: string[] = [];
    if (allChecked) {
      nextKeys = currentKeys.filter(k => !leafKeys.includes(k));
    } else {
      const setObj = new Set([...currentKeys, ...leafKeys]);
      nextKeys = Array.from(setObj);
    }

    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, checkedKeys: nextKeys } : r));
  };

  // Helper to render Tree Nodes for Roles matching screenshot style
  const renderPermissionTreeNodes = (nodes: PermissionNode[]) => {
    const currentKeys = selectedRole?.checkedKeys || [];

    return (
      <div className="space-y-1 font-sans">
        {nodes.map(node => {
          const hasChildren = Boolean(node.children && node.children.length > 0);
          const isExpanded = expandedNodeIds.includes(node.id);
          const { isChecked, isIndeterminate } = getNodeCheckState(node, currentKeys);

          return (
            <div key={node.id} className="select-none">
              <div className="flex items-center gap-2 py-0.5 px-1 hover:bg-slate-50 rounded-md transition-colors group">
                {/* Arrow indicator */}
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpandNode(node.id)}
                    aria-label={`${isExpanded ? "收起" : "展开"}${node.label}`}
                    aria-expanded={isExpanded}
                    className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-purple-600 cursor-pointer"
                  >
                    {isExpanded ? (
                      <span className="text-[10px] transform rotate-90 inline-block text-slate-500 font-bold">▲</span>
                    ) : (
                      <span className="text-[10px] inline-block text-slate-400">▶</span>
                    )}
                  </button>
                ) : (
                  <div className="w-4" />
                )}

                {/* Custom Checkbox */}
                <button
                  type="button"
                  role="checkbox"
                  aria-label={node.label}
                  aria-checked={isIndeterminate ? "mixed" : isChecked}
                  disabled={isSuperAdminRole}
                  onClick={() => handleToggleNode(node)}
                  className={`w-4 h-4 rounded text-white flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all shrink-0 ${
                    isChecked || isIndeterminate
                      ? "bg-[#7C3AED] border-[#7C3AED] shadow-2xs"
                      : "bg-white border border-slate-300 hover:border-purple-400"
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  {isIndeterminate && <Minus className="w-3 h-3 stroke-[3]" />}
                </button>

                {/* Node Label */}
                <span
                  onClick={() => handleToggleNode(node)}
                  className={`text-xs ${isSuperAdminRole ? "cursor-default" : "cursor-pointer"} font-medium ${
                    isChecked || isIndeterminate ? "text-slate-900 font-bold" : "text-slate-700"
                  }`}
                >
                  {node.label}
                </span>
              </div>

              {/* Children Nodes */}
              {hasChildren && isExpanded && (
                <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-2 mt-0.5">
                  {renderPermissionTreeNodes(node.children!)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 2. 操作记录 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [auditTab, setAuditTab] = useState<"today" | "history">("today");
  const [auditActionType, setAuditActionType] = useState<string>("");
  const [auditNameInput, setAuditNameInput] = useState<string>("");
  const [auditStartDate, setAuditStartDate] = useState<string>("2025-04-22");
  const [auditEndDate, setAuditEndDate] = useState<string>("2025-05-21");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);

  // Active filter state triggered by "搜索"
  const [appliedAuditFilter, setAppliedAuditFilter] = useState({
    tab: "today" as "today" | "history",
    actionType: "",
    name: "",
    startDate: "2025-04-22",
    endDate: "2025-05-21",
  });

  const handleAuditSearch = () => {
    setAppliedAuditFilter({
      tab: auditTab,
      actionType: auditActionType,
      name: auditNameInput,
      startDate: auditStartDate,
      endDate: auditEndDate,
    });
    showToast("🔍 已完成日志查询筛选");
  };

  const handleSwitchAuditTab = (tab: "today" | "history") => {
    setAuditTab(tab);
    setAppliedAuditFilter((prev) => ({
      ...prev,
      tab: tab,
      actionType: auditActionType,
      name: auditNameInput,
      startDate: auditStartDate,
      endDate: auditEndDate,
    }));
  };

  // Mock Audit Log Data with realistic mobile numbers for account and real names
  const [allAuditLogs] = useState([
    // 今日数据
    { id: "LOG-1001", account: "13800138000", name: "致上", time: "2025-05-22 14:15:07", client: "用户端", ip: "112.5.168.19", actionType: "下载", relatedId: "41235080", isToday: true },
    { id: "LOG-1002", account: "13912345678", name: "陈伟", time: "2025-05-22 14:15:01", client: "用户端", ip: "112.5.168.19", actionType: "上传", relatedId: "41235080", isToday: true },
    { id: "LOG-1003", account: "15088889999", name: "刘洋", time: "2025-05-22 14:10:52", client: "用户端", ip: "112.5.168.19", actionType: "上传", relatedId: "41234568", isToday: true },
    { id: "LOG-1004", account: "18666667777", name: "周敏", time: "2025-05-22 14:10:52", client: "用户端", ip: "112.5.168.19", actionType: "上传", relatedId: "41234567", isToday: true },
    { id: "LOG-1005", account: "13755554444", name: "徐振", time: "2025-05-22 13:20:10", client: "管理端", ip: "121.34.89.12", actionType: "编辑", relatedId: "908123", isToday: true },
    { id: "LOG-1006", account: "15811112222", name: "张小梅", time: "2025-05-22 11:05:44", client: "用户端", ip: "114.220.10.55", actionType: "移动到回收站", relatedId: "501239", isToday: true },
    { id: "LOG-1007", account: "17733334444", name: "李强", time: "2025-05-22 09:40:12", client: "用户端", ip: "220.181.108.91", actionType: "推送", relatedId: "881204", isToday: true },
    { id: "LOG-1008", account: "18955556666", name: "赵天", time: "2025-05-22 08:30:00", client: "管理端", ip: "58.216.2.100", actionType: "从回收站恢复", relatedId: "60128", isToday: true },

    // 历史数据
    { id: "LOG-2001", account: "13800138000", name: "致上", time: "2025-05-21 18:02:11", client: "用户端", ip: "27.30.115.46", actionType: "登录", relatedId: "703", isToday: false },
    { id: "LOG-2002", account: "13912345678", name: "陈伟", time: "2025-05-21 18:00:00", client: "用户端", ip: "112.5.168.54", actionType: "登录", relatedId: "703", isToday: false },
    { id: "LOG-2003", account: "15088889999", name: "刘洋", time: "2025-05-21 17:55:12", client: "用户端", ip: "112.5.168.54", actionType: "登录", relatedId: "703", isToday: false },
    { id: "LOG-2004", account: "13699998888", name: "林建红", time: "2025-05-21 17:45:00", client: "管理端", ip: "112.5.168.54", actionType: "账号删除", relatedId: "53032", isToday: false },
    { id: "LOG-2005", account: "18065731211", name: "灰灰", time: "2025-05-21 17:41:04", client: "用户端", ip: "112.5.168.54", actionType: "登录", relatedId: "29028", isToday: false },
    { id: "LOG-2006", account: "13522223333", name: "王芳", time: "2025-05-20 14:12:00", client: "管理端", ip: "183.136.220.4", actionType: "彻底删除", relatedId: "77192", isToday: false },
    { id: "LOG-2007", account: "17388889999", name: "陈明", time: "2025-05-19 11:30:15", client: "用户端", ip: "121.34.89.12", actionType: "编辑", relatedId: "33019", isToday: false },
  ]);

  const handleExportFile = (fileType: "csv" | "excel") => {
    setIsExportDropdownOpen(false);
    showToast(`✅ 已成功导出 ${fileType.toUpperCase()} 文件！`);
  };

  const filteredAuditLogs = allAuditLogs.filter((log) => {
    // 1. Check today / history tab
    if (appliedAuditFilter.tab === "today" && !log.isToday) return false;
    if (appliedAuditFilter.tab === "history" && log.isToday) return false;

    // 2. Check operation type filter
    if (appliedAuditFilter.actionType && log.actionType !== appliedAuditFilter.actionType) {
      return false;
    }

    // 3. Check name / account search key
    if (appliedAuditFilter.name) {
      const q = appliedAuditFilter.name.trim().toLowerCase();
      const matchName = log.name.toLowerCase().includes(q);
      const matchAccount = log.account.toLowerCase().includes(q);
      if (!matchName && !matchAccount) return false;
    }

    return true;
  });

  const renderActionBadge = (actionType: string) => {
    switch (actionType) {
      case "上传":
        return <span className="bg-[#DCFCE7] text-[#16A34A] font-bold px-3 py-1 rounded-md text-[11px]">上传</span>;
      case "下载":
        return <span className="bg-[#F3E8FF] text-[#7C3AED] font-bold px-3 py-1 rounded-md text-[11px]">下载</span>;
      case "登录":
        return <span className="bg-[#F3E8FF] text-[#7C3AED] font-bold px-3 py-1 rounded-md text-[11px]">登录</span>;
      case "账号删除":
        return <span className="bg-[#FEE2E2] text-[#DC2626] font-bold px-3 py-1 rounded-md text-[11px]">账号删除</span>;
      case "彻底删除":
        return <span className="bg-[#FEE2E2] text-[#DC2626] font-bold px-3 py-1 rounded-md text-[11px]">彻底删除</span>;
      case "移动到回收站":
        return <span className="bg-[#FFEDD5] text-[#EA580C] font-bold px-3 py-1 rounded-md text-[11px]">移动到回收站</span>;
      case "从回收站恢复":
        return <span className="bg-[#CCFBF1] text-[#0D9488] font-bold px-3 py-1 rounded-md text-[11px]">从回收站恢复</span>;
      case "编辑":
        return <span className="bg-[#DBEAFE] text-[#2563EB] font-bold px-3 py-1 rounded-md text-[11px]">编辑</span>;
      case "推送":
        return <span className="bg-[#DCFCE7] text-[#16A34A] font-bold px-3 py-1 rounded-md text-[11px]">推送</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md text-[11px]">{actionType}</span>;
    }
  };

  // ---------------------------------------------------------------------------
  // 3. 水印 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState("梦畅AIGC 版权所有");
  const [watermarkOpacity, setWatermarkOpacity] = useState(80);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-right");
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

  // ---------------------------------------------------------------------------
  // 4. 系统设置 STATE & HANDLERS (支持包含12大功能模块的完整配置)
  // ---------------------------------------------------------------------------
  // 1. 视频下载/推送/复制到剪映的方式
  const [videoFormatMode, setVideoFormatMode] = useState<"transcoded" | "original">("transcoded");

  // 2. 爆款视频的规则
  const { rule: viralVideoRule } = useViralVideoRule();
  const [hotVideoType, setHotVideoType] = useState<ViralVideoRule["period"]>(viralVideoRule.period);
  const [hotVideoThreshold, setHotVideoThreshold] = useState(String(viralVideoRule.thresholdWan));
  const [hotVideoError, setHotVideoError] = useState("");
  const hotVideoThresholdRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setHotVideoType(viralVideoRule.period);
    setHotVideoThreshold(String(viralVideoRule.thresholdWan));
    setHotVideoError("");
  }, [viralVideoRule]);

  const saveHotVideoSettings = () => {
    const next = { period: hotVideoType, thresholdWan: Number(hotVideoThreshold) };
    if (!isValidViralVideoRule(next)) {
      setHotVideoError("请输入有效且大于0的消耗门槛。");
      hotVideoThresholdRef.current?.focus();
      return;
    }
    try {
      saveViralVideoRule(next);
      setHotVideoError("");
      showToast("爆款视频设置已保存！");
    } catch {
      setHotVideoError("保存失败，原规则仍有效，请检查浏览器存储后重试。");
    }
  };

  // 3. 功能开关管理
  const [featureSwitches, setFeatureSwitches] = useState({
    categorySearch: true, // 分类搜索开关
    imageDownloadLog: true, // 图片下载，操作记录开关
    textDownloadLog: true, // 文案下载，操作记录开关
    finishedListSpendData: true, // 成片列表展示消耗数据开关
    finishedManualLinkMaterial: true, // 成片手动关联素材开关
    videoPushSuccessNotify: false, // 视频推送成功发送消息开关
    uploadFinishedCutTimeRequired: false, // 上传成片剪辑时间必填
    uploadMaterialShootTimeRequired: false, // 上传素材拍摄时间必填
  });

  // 4. 资源开放下载规则 (发布多少天后开放下载/复制到剪映)
  const [downloadRules, setDownloadRules] = useState({
    finished: { group: 0, team: 0, others: 7 },
    material: { group: 0, team: 0, others: 7 },
    thirdParty: { group: 0, team: 0, others: 7 },
    image: { group: 0, team: 0, others: 7 },
    text: { group: 0, team: 0, others: 7 },
    audio: { group: 0, team: 0, others: 7 },
  });

  // 6. 资源开放查看规则 (发布多少天后开放查看)
  const [viewRules, setViewRules] = useState({
    finished: { group: 0, team: 0, others: 0 },
    material: { group: 0, team: 0, others: 30 },
    thirdParty: { group: 0, team: 0, others: 30 },
    image: { group: 0, team: 0, others: 30 },
    text: { group: 0, team: 0, others: 30 },
    audio: { group: 0, team: 0, others: 30 },
    script: { group: 0, team: 0, others: 0 },
  });

  // 7. 资源推送规则 (发布多少天后支持推送)
  const [pushDaysRules, setPushDaysRules] = useState({
    group: 999,
    team: 999,
    others: 999,
  });

  // 8. 外网权限
  const [extLoginMode, setExtLoginMode] = useState<"forbidden" | "allow" | "scope">("scope");
  const [extLoginTeam, setExtLoginTeam] = useState("");
  const [extLoginGroup, setExtLoginGroup] = useState("");
  const [extLoginUser, setExtLoginUser] = useState("陈嘉");

  const [extDownloadMode, setExtDownloadMode] = useState<"forbidden" | "allow" | "scope">("allow");
  const [extEditMode, setExtEditMode] = useState<"forbidden" | "allow" | "scope">("allow");
  const [extDeleteMode, setExtDeleteMode] = useState<"forbidden" | "allow" | "scope">("allow");
  const [extPermissionScopes, setExtPermissionScopes] = useState<
    Record<"download" | "edit" | "delete", { team: string; group: string; user: string }>
  >({
    download: { team: "", group: "", user: "陈嘉" },
    edit: { team: "", group: "", user: "陈嘉" },
    delete: { team: "", group: "", user: "陈嘉" },
  });

  // 9. 作品可见性设置
  const [publishVisibility, setPublishVisibility] = useState({
    public: true,
    team: true,
    group: true,
    publicResource: true,
    specifiedScope: true,
  });

  // 11. 下载+复制到剪映报警规则
  const [bulkDownloadAlertSwitch, setBulkDownloadAlertSwitch] = useState<boolean>(false);
  const [dailyDownloadLimit, setDailyDownloadLimit] = useState<number>(0);
  const [weeklyDownloadLimit, setWeeklyDownloadLimit] = useState<number>(0);
  const [lockAndKickoutOnLimit, setLockAndKickoutOnLimit] = useState<boolean>(false);
  const [emailReceivers, setEmailReceivers] = useState<string[]>([""]);

  // 12. 自动修改状态 (资源状态修改规则)
  const [autoChangeStatusOnPushSuccess, setAutoChangeStatusOnPushSuccess] = useState<boolean>(false);
  const [pushSuccessDefaultVideoStatus, setPushSuccessDefaultVideoStatus] = useState<string>("已上机");

  const [autoChangeStatusOnScriptLinked, setAutoChangeStatusOnScriptLinked] = useState<boolean>(false);
  const [scriptLinkedDefaultScriptStatus, setScriptLinkedDefaultScriptStatus] = useState<string>("审核通过");

  // ---------------------------------------------------------------------------
  // 5. 系统自动化标签 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  // 保护标签 state
  const [protectedTagSwitch, setProtectedTagSwitch] = useState<boolean>(true);
  const [protectedCategories, setProtectedCategories] = useState<string[]>([
    "7.4一级分类211 / 7.4二级分类211",
  ]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState<boolean>(false);

  const [protectAddDays, setProtectAddDays] = useState<number>(10);
  const [protectAddAmount, setProtectAddAmount] = useState<number>(0.1);

  const [protectRemoveDays, setProtectRemoveDays] = useState<number>(5);
  const [protectRemoveAmount, setProtectRemoveAmount] = useState<number>(2);
  const [protectRemoveTimes, setProtectRemoveTimes] = useState<number>(6);

  const availableCategoryOptions = [
    "7.4一级分类211 / 7.4二级分类211",
    "美妆护肤 / 核心精选防晒",
    "服装鞋包 / 爆款连衣裙",
    "家居日用 / 洁面巾类目",
    "3C数码 / 无线耳机",
    "食品饮料 / 休闲零食",
  ];

  const [tagRules, setTagRules] = useState([
    { id: "TR-01", name: "爆款复刻高赞标记", condition: "复刻视频完播率 > 45%", targetTag: "🔥 爆款潜质", enabled: true },
    { id: "TR-02", name: "高清画质素材分类", condition: "素材分辨率 == 4K 且 帧率 >= 60", targetTag: "💎 极清原片", enabled: true },
    { id: "TR-03", name: "千川高ROI商品标", condition: "消耗 > ¥5,000 且 ROI >= 2.5", targetTag: "💰 高转化商品", enabled: false },
  ]);

  const toggleTagRule = (id: string) => {
    setTagRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    showToast("自动化打标规则状态已更新");
  };

  // ---------------------------------------------------------------------------
  // 6. 广告主/广告组管理 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const AD_PLATFORMS = [
    "巨量广告",
    "巨量千川",
    "磁力智投",
    "磁力金牛",
    "腾讯ADQ",
    "TikTok",
    "百度营销",
    "小红书聚光",
    "小红书乘风",
    "Bilibili三连推广",
  ];

  // 选中的平台与子 Tab ('account' | 'group')
  const [adPlatform, setAdPlatform] = useState<string>("巨量广告");
  const [adSubTab, setAdSubTab] = useState<"account" | "group">("account");

  // 广告账户数据列表
  const adStore = useAdStore();
  const adAccounts = adStore.accounts;
  const checkAdManagement = () => {
    if (getAdActor().permissions.includes("ab_ad_group_manage")) return true;
    showToast("暂无管理广告组权限");
    return false;
  };
  const setAdAccounts = (change: (accounts: AdAccount[]) => AdAccount[]) => {
    if (checkAdManagement()) updateAdStore(s => ({ ...s, accounts: change(s.accounts) }));
  };
  const [adVisibility, setAdVisibility] = useState(adStore.visibility);

  // 账户筛选 State
  const [adAuthFilter, setAdAuthFilter] = useState<"authorized" | "expired">("authorized");
  const [adCategoryFilter, setAdCategoryFilter] = useState<string>("all"); // 'all' | 'bound' | 'unbound'
  const [adGroupFilter, setAdGroupFilter] = useState<string>("all"); // 'all' | 'bound' | 'unbound'
  const [adUserFilter, setAdUserFilter] = useState<string>("all"); // 'all' | 'bound' | 'unbound'
  const [adGroupSelectFilter, setAdGroupSelectFilter] = useState<string>("all");
  const [adSearchKeyword, setAdSearchKeyword] = useState<string>("");

  // 批量选中的账户 IDs
  const [selectedAdAccountIds, setSelectedAdAccountIds] = useState<string[]>([]);

  // 过滤计算出的广告账户列表
  const filteredAdAccounts = adAccounts.filter((acc) => {
    if (acc.platform !== adPlatform) return false;
    if (acc.status !== adAuthFilter) return false;

    if (adCategoryFilter === "bound" && !acc.category) return false;
    if (adCategoryFilter === "unbound" && acc.category) return false;

    if (adGroupFilter === "bound" && !acc.group) return false;
    if (adGroupFilter === "unbound" && acc.group) return false;

    if (adUserFilter === "bound" && !acc.user) return false;
    if (adUserFilter === "unbound" && acc.user) return false;

    if (adGroupSelectFilter !== "all" && acc.group !== adGroupSelectFilter) return false;

    if (adSearchKeyword.trim()) {
      const kw = adSearchKeyword.toLowerCase();
      const matchName = acc.name.toLowerCase().includes(kw);
      const matchId = acc.id.includes(kw);
      const matchRemark = acc.remark.toLowerCase().includes(kw);
      if (!matchName && !matchId && !matchRemark) return false;
    }

    return true;
  });

  // 批量绑定 Modal State
  const [batchBindModalOpen, setBatchBindModalOpen] = useState(false);
  const [batchBindGroup, setBatchBindGroup] = useState("");
  const [batchBindCategory, setBatchBindCategory] = useState("");

  // 批量备注 Modal State
  const [batchRemarkModalOpen, setBatchRemarkModalOpen] = useState(false);
  const [batchRemarkText, setBatchRemarkText] = useState("");

  // 批量取消授权 Modal State
  const [batchCancelAuthModalOpen, setBatchCancelAuthModalOpen] = useState(false);

  // 千川授权流程：仅管理端发起，授权成功后回填账户列表。
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reauthorizingAccount, setReauthorizingAccount] = useState<AdAccount | undefined>();
  const [syncingAdAccounts, setSyncingAdAccounts] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failures: { name: string; reason: string }[] } | null>(null);

  // 账户分组 STATE
  const accountGroups = adStore.groups;
  const setAccountGroups = (change: (groups: AdAccountGroup[]) => AdAccountGroup[]) => {
    if (checkAdManagement()) updateAdStore(s => ({ ...s, groups: change(s.groups) }));
  };

  // 新增/编辑分组 Modal State
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<"create" | "edit">("create");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [groupFormName, setGroupFormName] = useState("");
  const [groupFormTeam, setGroupFormTeam] = useState("");
  const [groupFormGroup, setGroupFormGroup] = useState("");
  const [groupFormUsers, setGroupFormUsers] = useState<string[]>(["一凡最帅"]);
  const [groupFormAccountIds, setGroupFormAccountIds] = useState<string[]>([]);
  const [groupFormSearch, setGroupFormSearch] = useState("");
  const [groupAccountPage, setGroupAccountPage] = useState(1);
  const [groupAccountPageSize, setGroupAccountPageSize] = useState(20);

  const filteredGroupAccounts = adAccounts
    .filter((account) => account.platform === adPlatform)
    .filter((account) =>
      !groupFormSearch.trim() ||
      account.name.toLowerCase().includes(groupFormSearch.trim().toLowerCase()) ||
      account.id.includes(groupFormSearch.trim())
    );
  const currentGroupAccountPage = Math.min(
    groupAccountPage,
    Math.max(1, Math.ceil(filteredGroupAccounts.length / groupAccountPageSize))
  );
  const pagedGroupAccounts = filteredGroupAccounts.slice(
    (currentGroupAccountPage - 1) * groupAccountPageSize,
    currentGroupAccountPage * groupAccountPageSize
  );

  // 下拉可选项
  const availableTeamsList = ["华东运营部", "电商事业部", "品牌营销部", "海外推广部"];
  const availableGroupsList = ["核心投手一组", "第二投放组", "第一投放组", "千川第一组"];
  const availableUsersList = ["徐振", "普通用户", "一凡最帅", "罗福强", "童欣园", "张小梅", "李强", "陈斌"];
  const availableCategoriesList = ["千川引流", "卸妆油类目", "核心精选", "备选类目", "爆款连衣裙", "防晒系列"];

  // 删除分组 Modal State
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // 批量绑定的点击处理
  const handleConfirmBatchBind = () => {
    if (!checkAdManagement()) return;
    if (selectedAdAccountIds.length === 0) {
      showToast("请先选择要绑定的广告账户");
      return;
    }
    setAdAccounts((prev) =>
      prev.map((acc) => {
        if (!selectedAdAccountIds.includes(acc.id)) return acc;
        return {
          ...acc,
          group: batchBindGroup || acc.group,
          category: batchBindCategory || acc.category,
        };
      })
    );
    showToast(`成功为 ${selectedAdAccountIds.length} 个账户绑定小组/分类！`);
    setBatchBindModalOpen(false);
    setBatchBindGroup("");
    setBatchBindCategory("");
  };

  // 批量备注的点击处理
  const handleConfirmBatchRemark = () => {
    if (!checkAdManagement()) return;
    if (selectedAdAccountIds.length === 0) {
      showToast("请先选择要备注的广告账户");
      return;
    }
    if (!batchRemarkText.trim()) {
      showToast("请输入备注内容");
      return;
    }
    setAdAccounts((prev) =>
      prev.map((acc) => {
        if (!selectedAdAccountIds.includes(acc.id)) return acc;
        return {
          ...acc,
          remark: batchRemarkText,
        };
      })
    );
    showToast(`已成功批量备注 ${selectedAdAccountIds.length} 个广告账户！`);
    setBatchRemarkModalOpen(false);
    setBatchRemarkText("");
  };

  // 批量取消授权的点击处理
  const handleConfirmBatchCancelAuth = () => {
    if (!selectedAdAccountIds.length) return;
    try { revokeAdAccounts(selectedAdAccountIds, adPlatform); }
    catch (error) { showToast(error instanceof Error ? error.message : "取消授权失败"); return; }
    showToast(`已成功取消 ${selectedAdAccountIds.length} 个账户的授权！`);
    setBatchCancelAuthModalOpen(false);
    setSelectedAdAccountIds([]);
  };

  const handleSyncAdAccounts = () => {
    if (!checkAdManagement() || syncingAdAccounts) return;
    setSyncingAdAccounts(true);
    window.setTimeout(() => {
      const failures: { name: string; reason: string }[] = [];
      let success = 0;
      if (!checkAdManagement()) { setSyncingAdAccounts(false); return; }
      updateAdStore(s => ({ ...s, accounts: s.accounts.map(account => {
        const reason = account.status === "expired" || account.revoked ? "授权已失效，请重新授权" : "";
        if (reason) { failures.push({ name: `${account.name} (${account.id})`, reason }); return { ...account, syncError: reason }; }
        success++;
        return { ...account, syncedAt: adDate(), syncError: "" };
      }) }));
      setSyncingAdAccounts(false);
      setSyncResult({ success, failures });
    }, 700);
  };

  // 打开新增分组模态框
  const handleOpenCreateGroupModal = () => {
    if (!checkAdManagement()) return;
    setGroupModalMode("create");
    setEditingGroupId(null);
    setGroupFormName("");
    setGroupFormTeam("");
    setGroupFormGroup("");
    setGroupFormUsers([getAdActor().name]);
    setGroupFormAccountIds([]);
    setGroupFormSearch("");
    setGroupAccountPage(1);
    setGroupModalOpen(true);
  };

  // 打开编辑分组模态框
  const handleOpenEditGroupModal = (group: (typeof accountGroups)[0]) => {
    setGroupModalMode("edit");
    setEditingGroupId(group.id);
    setGroupFormName(group.name);
    setGroupFormTeam(group.viewTeam);
    setGroupFormGroup(group.viewGroup);
    setGroupFormUsers(group.viewUsers || []);
    setGroupFormAccountIds(group.accountIds || []);
    setGroupFormSearch("");
    setGroupAccountPage(1);
    setGroupModalOpen(true);
  };

  // 保存分组
  const handleSaveGroup = () => {
    if (!checkAdManagement()) return;
    if (!groupFormName.trim()) {
      showToast("请输入账户分组名称");
      return;
    }
    if (groupModalMode === "create") {
      const newGroup = {
        id: `AG-${adId()}`,
        platform: adPlatform,
        name: groupFormName,
        viewTeam: groupFormTeam,
        viewGroup: groupFormGroup,
        viewUsers: groupFormUsers,
        accountIds: groupFormAccountIds,
      };
      setAccountGroups((prev) => [...prev, newGroup]);
      showToast("新增账户分组成功！");
    } else {
      setAccountGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroupId
            ? {
                ...g,
                name: groupFormName,
                viewTeam: groupFormTeam,
                viewGroup: groupFormGroup,
                viewUsers: groupFormUsers,
                accountIds: groupFormAccountIds,
              }
            : g
        )
      );
      showToast("修改账户分组成功！");
    }
    setGroupModalOpen(false);
  };

  // 删除分组
  const handleConfirmDeleteGroup = () => {
    if (!checkAdManagement()) return;
    if (!deletingGroupId) return;
    setAccountGroups((prev) => prev.filter((g) => g.id !== deletingGroupId));
    showToast("账户分组已被删除！");
    setDeleteGroupModalOpen(false);
    setDeletingGroupId(null);
  };

  // ---------------------------------------------------------------------------
  // 7. 登录记录 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [loginLogs] = useState([
    { id: "L-1", user: "徐振 (CEO)", ip: "121.34.89.12", location: "浙江省杭州市", device: "Chrome 127.0 (macOS)", time: "2026-08-12 23:10:05", status: "正常" },
    { id: "L-2", user: "张小梅", ip: "114.220.10.55", location: "江苏省南京市", device: "Edge 126.0 (Windows)", time: "2026-08-12 21:05:12", status: "正常" },
    { id: "L-3", user: "李强", ip: "220.181.108.91", location: "北京市", device: "Safari 17.5 (iOS)", time: "2026-08-12 19:12:40", status: "异地安全预警" },
  ]);

  // ---------------------------------------------------------------------------
  // 8. 消息通知 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [notifications, setNotifications] = useState<NotificationCategory[]>(() => {
    const saved = localStorage.getItem("cloud_video_notification_settings_v2");
    if (!saved) return INITIAL_NOTIFICATION_CATEGORIES;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_NOTIFICATION_CATEGORIES;
    }
  });

  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<string[]>([]);
  const [configModalItem, setConfigModalItem] = useState<{
    catId: string;
    itemId: string;
    title: string;
    description: string;
  } | null>(null);
  const [customDescInput, setCustomDescInput] = useState("");

  const [spendModalOpen, setSpendModalOpen] = useState(false);
  const [spendModalCatId, setSpendModalCatId] = useState("");
  const [spendValue, setSpendValue] = useState("10000");
  const [growthValue, setGrowthValue] = useState("30");

  const toggleCollapseCategory = (catId: string) => {
    setCollapsedCategoryIds(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleToggleEnable = (catId: string, itemId: string) => {
    setNotifications(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, enabled: !item.enabled };
        })
      };
    }));
  };

  const handleOpenSpendModal = (catId: string, item: NotificationItem) => {
    setSpendModalCatId(catId);
    const foundSpend = item.description.match(/(\d+)\s*¥/);
    const foundGrowth = item.description.match(/(\d+)\s*%/);

    setSpendValue(foundSpend ? foundSpend[1] : "10000");
    setGrowthValue(foundGrowth ? foundGrowth[1] : "30");
    setSpendModalOpen(true);
  };

  const handleSaveSpendConfig = () => {
    const sVal = spendValue.trim() || "10000";
    const gVal = growthValue.trim() || "30";
    const newDesc = `当日消耗大于 ${sVal}¥ 并且涨幅大于 ${gVal}%，管理员收到消息提醒`;

    setNotifications(prev => prev.map(cat => {
      if (cat.id !== spendModalCatId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== "daily_spend_growth") return item;
          return { ...item, description: newDesc };
        })
      };
    }));

    showToast("✅ 已成功保存【当日消耗增长】配置");
    setSpendModalOpen(false);
  };

  const handleOpenConfigModal = (catId: string, item: NotificationItem) => {
    setConfigModalItem({
      catId,
      itemId: item.id,
      title: item.title,
      description: item.description
    });
    setCustomDescInput(item.description);
  };

  const handleSaveConfigModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configModalItem) return;
    const trimmed = customDescInput.trim();
    if (!trimmed) {
      showToast("场景规则描述不能为空");
      return;
    }
    setNotifications(prev => prev.map(cat => {
      if (cat.id !== configModalItem.catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== configModalItem.itemId) return item;
          return { ...item, description: trimmed };
        })
      };
    }));
    showToast(`✅ 已更新【${configModalItem.title}】的场景提醒规则`);
    setConfigModalItem(null);
  };

  const handleSaveNotificationSettings = () => {
    localStorage.setItem("cloud_video_notification_settings_v2", JSON.stringify(notifications));
    showToast("✅ 消息通知设置保存成功！");
  };

  // ---------------------------------------------------------------------------
  // 10. 用户列表 STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [users, setUsers] = useState([
    { id: "U-1", name: "徐振", phone: "13800138000", dept: "高管层", role: "超级管理员", time: "2025-12-16", status: true, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop" },
    { id: "U-2", name: "张小梅", phone: "13912345678", dept: "剪辑1组", role: "普通剪辑师", time: "2026-01-10", status: true, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop" },
    { id: "U-3", name: "李强", phone: "13422223333", dept: "电商1组", role: "广告投放员", time: "2026-01-12", status: true, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop" },
    { id: "U-4", name: "赵天", phone: "13788889999", dept: "家电部", role: "剪辑总监", time: "2026-02-01", status: false, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&h=80&fit=crop" },
  ]);

  const [userSearchKey, setUserSearchKey] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userFormName, setUserFormName] = useState("");
  const [userFormPhone, setUserFormPhone] = useState("");
  const [userFormDept, setUserFormDept] = useState("剪辑1组");
  const [userFormRole, setUserFormRole] = useState("普通剪辑师");

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: !u.status } : u))
    );
    showToast("用户状态更替完成");
  };

  const handleAddUser = () => {
    if (!userFormName.trim() || !userFormPhone.trim()) {
      showToast("请填写完整的成员姓名与手机号");
      return;
    }
    const newUser = {
      id: `U-${Date.now()}`,
      name: userFormName,
      phone: userFormPhone,
      dept: userFormDept,
      role: userFormRole,
      time: new Date().toISOString().split("T")[0],
      status: true,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`已新增用户 [${userFormName}]`);
    setIsAddUserModalOpen(false);
    setUserFormName("");
    setUserFormPhone("");
  };

  const filteredUsers = users.filter((u) =>
    u.name.includes(userSearchKey) || u.phone.includes(userSearchKey) || u.role.includes(userSearchKey)
  );

  const renderExternalScopeSelector = (permission: "download" | "edit" | "delete") => {
    const scope = extPermissionScopes[permission];
    const updateScope = (field: "team" | "group" | "user", value: string) => {
      setExtPermissionScopes((prev) => ({
        ...prev,
        [permission]: { ...prev[permission], [field]: value },
      }));
    };

    return (
      <div className="flex items-center gap-4 pl-18 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-normal">部门:</span>
          <select
            value={scope.team}
            onChange={(e) => updateScope("team", e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 bg-white"
          >
            <option value="">请选择</option>
            <option value="team_a">电商一部</option>
            <option value="team_b">品牌二部</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-normal">分组:</span>
          <select
            value={scope.group}
            onChange={(e) => updateScope("group", e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 bg-white"
          >
            <option value="">请选择</option>
            <option value="group_1">爆款剪辑组</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-normal">用户:</span>
          <div className="px-3 py-1 border border-slate-200 rounded-xl flex items-center gap-1.5 bg-white">
            <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
              {scope.user}
              <X
                className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                onClick={() => updateScope("user", "")}
              />
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-slate-50 text-slate-800 font-sans relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-[200] bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 顶部一排导航栏 (与内容管理/资源库页面风格完全一致，顶部留出 pt-4 边距) */}
      <div className="pt-4 px-5 pb-1 bg-slate-50 shrink-0 z-30 relative overflow-visible">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs relative overflow-visible">
          <div className="flex items-center justify-between p-1.5 bg-slate-50/70 rounded-xl overflow-visible">
            <div className="flex items-center gap-1.5 min-w-max overflow-visible">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;

                return (
                  <div key={t.id} className="relative group/tab">
                    <button
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? "bg-white text-[#7C3AED] shadow-2xs border border-purple-200/80 ring-1 ring-purple-100"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#7C3AED]" : "text-slate-400"}`} />
                      <span>{t.label}</span>
                    </button>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content Container */}
      <div className="px-5 pt-3 pb-12 space-y-6 flex-1">
        {/* --------------------------------------------------------------------------- */}
        {/* TAB 0-A: 组织部门架构                                                      */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "depts" && (() => {
          const orderedDeptList: (DeptNode & { depth: number; parentName: string })[] = [];
          const processedSet = new Set<string>();

          const addChildrenNodes = (parentId: string | null, depth: number) => {
            const children = depts.filter(d => d.parentId === parentId);
            for (const child of children) {
              if (processedSet.has(child.id)) continue;
              processedSet.add(child.id);
              const parent = depts.find(p => p.id === child.parentId);
              orderedDeptList.push({
                ...child,
                depth,
                parentName: parent ? parent.name : "无 (1级顶级根节点)"
              });
              addChildrenNodes(child.id, depth + 1);
            }
          };

          addChildrenNodes(null, 0);

          for (const d of depts) {
            if (!processedSet.has(d.id)) {
              const parent = depts.find(p => p.id === d.parentId);
              orderedDeptList.push({
                ...d,
                depth: 1,
                parentName: parent ? parent.name : "已知顶级节点"
              });
            }
          }

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-xl shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">最高公司实体</p>
                    <p className="text-sm font-bold text-slate-900 truncate">梦畅AIGC</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">组织架构标准</p>
                    <p className="text-sm font-bold text-slate-900 truncate">公司 &gt; 部门 &gt; 分组 &gt; 人员</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">部门 / 分组数量</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {depts.filter(d => d.parentId === "dept_root" && d.id !== "dept_root").length} 部门 / {depts.filter(d => d.parentId && d.parentId !== "dept_root").length} 分组
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                  <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">总在职成员/编制</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{members.length} / 50 人</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black text-slate-800">组织部门架构表 (公司 &gt; 部门 &gt; 分组 &gt; 人员)</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddDept("dept_root", "department")}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增部门/分组</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <th className="p-4 min-w-[280px]">组织架构名称 & 节点级别</th>
                        <th className="p-4 min-w-[110px]">编号</th>
                        <th className="p-4 min-w-[160px]">上级层级</th>
                        <th className="p-4 min-w-[110px]">职责类型</th>
                        <th className="p-4 min-w-[130px]">负责人</th>
                        <th className="p-4 min-w-[150px]">编制与现有成员</th>
                        <th className="p-4 min-w-[90px]">状态</th>
                        <th className="p-4 text-right min-w-[180px]">架构管理操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {orderedDeptList.map((d) => {
                        const deptMembers = members.filter(m => m.deptId === d.id);
                        const isRoot = d.id === "dept_root";
                        const isDept = !isRoot && d.parentId === "dept_root";
                        const isGroup = !isRoot && d.parentId !== "dept_root";
                        const indentPadding = d.depth === 0 ? "pl-4" : d.depth === 1 ? "pl-9" : "pl-16";

                        return (
                          <tr key={d.id} className={`hover:bg-purple-50/30 transition-colors ${isRoot ? "bg-purple-50/20 font-bold" : ""}`}>
                            <td className={`p-4 ${indentPadding}`}>
                              <div className="flex items-center gap-2.5">
                                {d.depth > 0 && (
                                  <span className="text-purple-400 font-mono font-bold flex items-center shrink-0 select-none">
                                    <span className="text-purple-300 mr-0.5">└──</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                                  </span>
                                )}

                                <div className={`p-2 rounded-xl shrink-0 ${
                                  isRoot 
                                    ? "bg-purple-600 text-white shadow-xs" 
                                    : isDept 
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                }`}>
                                  <Building2 className="w-4 h-4" />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-black text-slate-900 ${isRoot ? "text-sm text-purple-950" : "text-xs"}`}>
                                      {d.name}
                                    </span>

                                    {isRoot && (
                                      <span className="bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                                        1级公司
                                      </span>
                                    )}

                                    {isDept && (
                                      <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded-md border border-purple-200">
                                        部门
                                      </span>
                                    )}

                                    {isGroup && (
                                      <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-md border border-indigo-200">
                                        分组
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                                    {d.description || "暂无职能说明"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                {d.code}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${
                                isRoot 
                                  ? "bg-slate-100 text-slate-400 border border-slate-200" 
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}>
                                <Building2 className="w-3 h-3" />
                                <span>{isRoot ? "无上级 (最高公司)" : d.parentName}</span>
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                {d.type}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-slate-800">
                                <span>{d.manager || "未设定"}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.phone}</p>
                            </td>

                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                                  <span className="text-purple-700">{deptMembers.length} 人在职</span>
                                  <span className="text-slate-400">上限 {d.quota}</span>
                                </div>
                                <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-purple-600 h-full rounded-full transition-all" 
                                    style={{ width: `${Math.min(100, (deptMembers.length / d.quota) * 100)}%` }} 
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                正常启用
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isRoot && (
                                  <button
                                    onClick={() => handleOpenAddDept("dept_root", "department")}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-purple-200"
                                    title="在公司下新增部门/分组"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>新增部门/分组</span>
                                  </button>
                                )}

                                {isDept && (
                                  <button
                                    onClick={() => handleOpenAddDept(d.id, "group")}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-purple-200"
                                    title="在部门下新增分组"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>新增分组</span>
                                  </button>
                                )}

                                {isGroup && (
                                  <button
                                    onClick={() => {
                                      setActiveTab("members");
                                      setMemberFilterDept(d.id);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-indigo-200"
                                    title="查看分组成员"
                                  >
                                    <Users className="w-3 h-3 text-indigo-600" />
                                    <span>查看人员 ({deptMembers.length})</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenEditDept(d)}
                                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title={isRoot ? "修改公司信息" : isDept ? "修改部门配置" : "修改分组配置"}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {!isRoot && (
                                  <button
                                    onClick={() => handleDeleteDept(d.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title={isDept ? "解散此部门" : "解散此分组"}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 0-B: 人员账号管理                                                      */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "members" && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">企业人员与账号一览</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">支持按手机号/邮箱快捷邀请、CSV批量导入导出、变更角色与数据全生命周期管理</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenInviteModal}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-purple-200"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>快捷邀请</span>
                  </button>

                  <button
                    onClick={handleExportMembersCsv}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出人员表 (CSV)</span>
                  </button>

                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>批量导入人员</span>
                  </button>

                  <button
                    onClick={handleOpenAddMember}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>新增人员</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="lg:col-span-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="搜索姓名 / 手机号 / 邮箱 / 工号..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <select
                    value={memberFilterDept}
                    onChange={(e) => setMemberFilterDept(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">全部组织部门</option>
                    {depts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={memberFilterRole}
                    onChange={(e) => setMemberFilterRole(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">全部系统角色</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={memberFilterStatus}
                    onChange={(e) => setMemberFilterStatus(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">全部账号状态</option>
                    <option value="normal">正常启用</option>
                    <option value="bound">账号绑定</option>
                    <option value="pending">待激活邀请</option>
                    <option value="disabled">已禁用封禁</option>
                  </select>
                </div>
              </div>

              {selectedMemberIds.length > 0 && (
                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 flex items-center justify-between text-xs animate-fade-in">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-purple-600" />
                    已选中 <strong className="text-rose-600 font-black">{selectedMemberIds.length}</strong> 位成员
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBatchStatusChange("normal")}
                      className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer hover:bg-emerald-700"
                    >
                      批量解封启用
                    </button>
                    <button
                      onClick={() => handleBatchStatusChange("disabled")}
                      className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg cursor-pointer hover:bg-rose-700"
                    >
                      批量停用禁用
                    </button>
                    <button
                      onClick={handleBatchResetPassword}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>批量重置密码</span>
                    </button>
                    <button
                      onClick={() => setSelectedMemberIds([])}
                      className="px-2.5 py-1 text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
                    >
                      取消选择
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[10.5px] uppercase font-bold tracking-wider">
                      <th className="p-4 w-10 text-center">
                        <button onClick={handleSelectAllMembers} className="cursor-pointer">
                          {selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-4">成员基础信息</th>
                      <th className="p-4">所属部门</th>
                      <th className="p-4">绑定岗位角色</th>
                      <th className="p-4">账号状态</th>
                      <th className="p-4">注册/活跃时间</th>
                      <th className="p-4 text-right">管理操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredMembers.map((m) => {
                      const dept = depts.find(d => d.id === m.deptId);
                      const isSelected = selectedMemberIds.includes(m.id);

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isSelected ? "bg-purple-50/40" : ""
                          }`}
                        >
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                if (isSelected) setSelectedMemberIds(selectedMemberIds.filter(id => id !== m.id));
                                else setSelectedMemberIds([...selectedMemberIds, m.id]);
                              }}
                              className="cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={m.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 text-sm">{m.name}</span>
                                  <span className="text-[9.5px] bg-slate-100 font-mono text-slate-500 px-1.5 py-0.2 rounded font-bold">
                                    {m.employeeNo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                  <span>{m.phone}</span>
                                  <span>•</span>
                                  <span>{m.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            {dept ? (
                              <span className="bg-purple-50 text-purple-900 text-xs px-2.5 py-1 rounded-full border border-purple-200/80 font-bold">
                                {dept.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">未分配部门</span>
                            )}
                          </td>

                          <td className="p-4">
                            <span className="bg-indigo-50 text-indigo-900 text-xs px-2.5 py-1 rounded-full border border-indigo-200/80 font-bold">
                              {m.roleName}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              m.status === "normal" ? "bg-emerald-100 text-emerald-800" :
                              m.status === "bound" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                              m.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {m.status === "normal" ? "正常" : m.status === "bound" ? "账号绑定" : m.status === "pending" ? "待激活" : "已停用"}
                            </span>
                            {m.status === "bound" && m.boundAccount && (
                              <div className="text-[10px] text-purple-600 font-mono mt-0.5 truncate max-w-[130px]" title={m.boundAccount}>
                                {m.boundAccount}
                              </div>
                            )}
                          </td>

                          <td className="p-4 font-mono text-[11px] text-slate-500">
                            <div>{m.createdAt}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{m.lastActiveAt}</div>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleMemberStatus(m)}
                                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  m.status === "normal" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                                title={m.status === "normal" ? "停用账号" : "解封账号"}
                              >
                                {m.status === "normal" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => handleOpenEditMember(m)}
                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="编辑角色与部门"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenResetPassword(m)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="重置登录密码"
                              >
                                <Key className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteMember(m.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="注销删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 bg-white">
                          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold">未找到符合条件的人员信息</p>
                          <p className="text-[10px] text-slate-400 mt-1">请尝试清空筛选条件或点击右上角“新增人员”</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 1: 角色与权限矩阵 (ROLES & PERMISSION MATRIX)                             */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "roles" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            {/* Top Banner / Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>系统菜单与功能权限矩阵</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  根据系统已有菜单和功能合理规划角色权限，左侧选择岗位角色，右侧配置树形控制权限
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">已配置角色: <strong className="text-purple-700 font-bold">{roles.length}</strong> 个</span>
              </div>
            </div>

            {/* Split View Container */}
            <div className="flex flex-col lg:flex-row gap-5 min-h-[580px]">
              {/* Left Column: Role List Sidebar */}
              <div className="w-full lg:w-64 border-r-0 lg:border-r border-slate-200/80 pr-0 lg:pr-4 space-y-4 shrink-0">
                {/* Default Roles Section */}
                <div className="space-y-1.5" data-testid="default-roles">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2">
                    默认角色
                  </div>
                  <div className="space-y-1">
                    {roles.filter(r => r.category === "default").map(r => {
                      const isSelected = r.id === selectedRoleId;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRoleId(r.id)}
                          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-purple-100/80 text-purple-800 font-black border-l-4 border-purple-600 shadow-2xs"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.enabled === false ? "bg-slate-300" : "bg-emerald-500"}`} />
                            <span className="truncate">{r.name}</span>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400">{r.memberCount}人</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Other Roles Section */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100" data-testid="other-roles">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      其他角色
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAddRole}
                      className="text-purple-600 hover:text-purple-800 text-[11px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>新增角色</span>
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                    {roles.filter(r => r.category !== "default").map(r => {
                      const isSelected = r.id === selectedRoleId;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRoleId(r.id)}
                          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-purple-100/80 text-purple-800 font-black border-l-4 border-purple-600 shadow-2xs"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.enabled === false ? "bg-slate-300" : "bg-emerald-500"}`} />
                            <span className="truncate">{r.name}</span>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400">{r.memberCount}人</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => handleCopyRole(r, e)}
                                title="复制角色"
                                className="p-1 text-slate-400 hover:text-purple-600 rounded hover:bg-purple-100/50"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {r.type === "custom" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditRole(r);
                                    }}
                                    title="修改自定义角色"
                                    className="p-1 text-slate-400 hover:text-purple-600 rounded hover:bg-purple-100/50"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRole(r.id);
                                    }}
                                    title="删除自定义角色"
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-100/50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Tree Permission Grid */}
              <div className="flex-1 pl-0 lg:pl-2 space-y-4 flex flex-col justify-between">
                <div>
                  {/* Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="text-sm font-black text-purple-700 pb-1 inline-block">
                          角色菜单权限配置
                        </span>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        当前选中岗位: <strong className="text-slate-800 font-bold">{selectedRole?.name}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllTree}
                        disabled={isSuperAdminRole}
                        className="px-3 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllTree}
                        disabled={isSuperAdminRole}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        清空
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{selectedRole?.name}</span>
                        <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{selectedRole?.code}</span>
                        <span className="text-[11px] text-slate-400">已关联 {selectedRole?.memberCount ?? 0} 人</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">{selectedRole?.description}</p>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[10px] font-bold text-slate-400">数据查看范围</p>
                      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                        {([
                          { value: "self", label: "仅本人" },
                          { value: "dept_tree", label: "本部门及下级" },
                          { value: "all", label: "全公司" }
                        ] as const).map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleChangeRoleDataScope(option.value)}
                            disabled={isSuperAdminRole}
                            aria-pressed={selectedRole?.dataScope === option.value}
                            className={`h-8 px-3 text-[11px] font-bold transition disabled:cursor-not-allowed ${selectedRole?.dataScope === option.value ? "bg-purple-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[10px] font-bold text-slate-400">角色状态</p>
                      <button
                        type="button"
                        onClick={handleToggleRoleEnabled}
                        disabled={isSuperAdminRole}
                        className={`inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-[11px] font-bold transition disabled:cursor-not-allowed ${(selectedRole?.enabled ?? true) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${(selectedRole?.enabled ?? true) ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {(selectedRole?.enabled ?? true) ? "已启用" : "已停用"}
                      </button>
                    </div>
                  </div>

                  {/* Two Column Grid matching user screenshot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left Column: 用户端 */}
                    <div className="space-y-3 border-r-0 md:border-r border-slate-100 pr-0 md:pr-4">
                      <div className="pb-2 border-b border-slate-200/80 flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-slate-900">用户端</h3>
                        <span className="text-[10px] font-bold text-slate-400">已授权 {(selectedRole?.checkedKeys || []).filter(key => key.startsWith("uc_")).length}/{USER_PERMISSION_KEYS.length}</span>
                      </div>
                      <div className="py-1 max-h-[520px] overflow-y-auto scrollbar-thin pr-2">
                        {renderPermissionTreeNodes(USER_CLIENT_PERMISSION_TREE)}
                      </div>
                    </div>

                    {/* Right Column: 管理后台 */}
                    <div className="space-y-3">
                      <div className="pb-2 border-b border-slate-200/80 flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-slate-900">管理端</h3>
                        <span className="text-[10px] font-bold text-slate-400">已授权 {(selectedRole?.checkedKeys || []).filter(key => key.startsWith("ab_")).length}/{ADMIN_PERMISSION_KEYS.length}</span>
                      </div>

                      <div className="py-1 max-h-[520px] overflow-y-auto scrollbar-thin pr-2">
                        {renderPermissionTreeNodes(ADMIN_BACKEND_PERMISSION_TREE)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Save Action Bar matching red box in screenshot */}
                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSaveRolePermissions}
                    disabled={isSuperAdminRole}
                    className="px-10 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white font-extrabold text-sm rounded-lg shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer border border-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 2: 操作记录                                                              */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            {/* Top Toolbar matching screenshots */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 今日数据 / 历史数据 Switcher */}
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => handleSwitchAuditTab("today")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    auditTab === "today"
                      ? "bg-[#7C3AED] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  今日数据
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAuditTab("history")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    auditTab === "history"
                      ? "bg-[#7C3AED] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  历史数据
                </button>
              </div>

              {/* Date Range Selector (Only shown when 历史数据 is active) */}
              {auditTab === "history" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs text-slate-700 font-medium hover:border-[#7C3AED] focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{auditStartDate} &nbsp;至&nbsp; {auditEndDate}</span>
                  </button>

                  {/* Dual Month Calendar Popover matching screenshot 2 */}
                  {isDatePickerOpen && (
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-[520px] animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-900">选择历史时间跨度</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAuditStartDate("2025-05-15");
                              setAuditEndDate("2025-05-22");
                            }}
                            className="text-[11px] text-[#7C3AED] hover:underline font-bold"
                          >
                            近7天
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuditStartDate("2025-04-22");
                              setAuditEndDate("2025-05-21");
                            }}
                            className="text-[11px] text-[#7C3AED] hover:underline font-bold"
                          >
                            近30天
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(false)}
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Month 1: 2025年 4月 */}
                        <div className="space-y-2">
                          <div className="text-center text-xs font-extrabold text-slate-800">2025 年 4 月</div>
                          <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-bold py-1">
                            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
                          </div>
                          <div className="grid grid-cols-7 text-center text-xs gap-y-1">
                            <span className="text-slate-300">30</span><span className="text-slate-300">31</span>
                            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                            <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
                            <span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span>
                            <span>20</span><span>21</span>
                            <span className="bg-[#7C3AED] text-white rounded-full font-bold shadow-2xs">22</span>
                            <span className="bg-purple-100 text-purple-800">23</span>
                            <span className="bg-purple-100 text-purple-800">24</span>
                            <span className="bg-purple-100 text-purple-800">25</span>
                            <span className="bg-purple-100 text-purple-800">26</span>
                            <span className="bg-purple-100 text-purple-800">27</span>
                            <span className="bg-purple-100 text-purple-800">28</span>
                            <span className="bg-purple-100 text-purple-800">29</span>
                            <span className="bg-purple-100 text-purple-800">30</span>
                          </div>
                        </div>

                        {/* Month 2: 2025年 5月 */}
                        <div className="space-y-2">
                          <div className="text-center text-xs font-extrabold text-slate-800">2025 年 5 月</div>
                          <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-bold py-1">
                            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
                          </div>
                          <div className="grid grid-cols-7 text-center text-xs gap-y-1">
                            <span className="bg-purple-100 text-purple-800">27</span>
                            <span className="bg-purple-100 text-purple-800">28</span>
                            <span className="bg-purple-100 text-purple-800">29</span>
                            <span className="bg-purple-100 text-purple-800">30</span>
                            <span className="bg-purple-100 text-purple-800">1</span>
                            <span className="bg-purple-100 text-purple-800">2</span>
                            <span className="bg-purple-100 text-purple-800">3</span>
                            <span className="bg-purple-100 text-purple-800">4</span>
                            <span className="bg-purple-100 text-purple-800">5</span>
                            <span className="bg-purple-100 text-purple-800">6</span>
                            <span className="bg-purple-100 text-purple-800">7</span>
                            <span className="bg-purple-100 text-purple-800">8</span>
                            <span className="bg-purple-100 text-purple-800">9</span>
                            <span className="bg-purple-100 text-purple-800">10</span>
                            <span className="bg-purple-100 text-purple-800">11</span>
                            <span className="bg-purple-100 text-purple-800">12</span>
                            <span className="bg-purple-100 text-purple-800">13</span>
                            <span className="bg-purple-100 text-purple-800">14</span>
                            <span className="bg-purple-100 text-purple-800">15</span>
                            <span className="bg-purple-100 text-purple-800">16</span>
                            <span className="bg-purple-100 text-purple-800">17</span>
                            <span className="bg-purple-100 text-purple-800">18</span>
                            <span className="bg-purple-100 text-purple-800">19</span>
                            <span className="bg-purple-100 text-purple-800">20</span>
                            <span className="bg-[#7C3AED] text-white rounded-full font-bold shadow-2xs">21</span>
                            <span>22</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={auditStartDate}
                            onChange={(e) => setAuditStartDate(e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
                          />
                          <span className="text-slate-400 text-xs">至</span>
                          <input
                            type="date"
                            value={auditEndDate}
                            onChange={(e) => setAuditEndDate(e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDatePickerOpen(false)}
                          className="px-4 py-1.5 bg-[#7C3AED] text-white font-bold rounded-lg text-xs hover:bg-purple-700 cursor-pointer"
                        >
                          确认日期
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 操作类型 Select Dropdown */}
              <div className="w-48">
                <select
                  value={auditActionType}
                  onChange={(e) => setAuditActionType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-600 font-medium focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="">请选择操作类型</option>
                  <option value="上传">上传</option>
                  <option value="下载">下载</option>
                  <option value="编辑">编辑</option>
                  <option value="移动到回收站">移动到回收站</option>
                  <option value="从回收站恢复">从回收站恢复</option>
                  <option value="彻底删除">彻底删除</option>
                  <option value="推送">推送</option>
                  <option value="登录">登录</option>
                  <option value="账号删除">账号删除</option>
                </select>
              </div>

              {/* 姓名 Input */}
              <div className="w-48">
                <input
                  type="text"
                  placeholder="请输入姓名"
                  value={auditNameInput}
                  onChange={(e) => setAuditNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* 搜索 Button */}
              <button
                type="button"
                onClick={handleAuditSearch}
                className="px-5 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
              >
                搜索
              </button>

              {/* 导出 ∨ Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="px-4 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>导出</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown Menu */}
                {isExportDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-2 w-32 text-xs font-medium text-slate-700 animate-in fade-in slide-in-from-top-1">
                    <button
                      type="button"
                      onClick={() => handleExportFile("csv")}
                      className="w-full text-center py-2 hover:bg-purple-50 hover:text-[#7C3AED] transition-colors cursor-pointer"
                    >
                      导出csv
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportFile("excel")}
                      className="w-full text-center py-2 hover:bg-purple-50 hover:text-[#7C3AED] transition-colors cursor-pointer"
                    >
                      导出excel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Logs Table matching Screenshots */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-4">账号</th>
                    <th className="py-3 px-4">姓名</th>
                    <th className="py-3 px-4">时间</th>
                    <th className="py-3 px-4">操作端</th>
                    <th className="py-3 px-4">操作IP</th>
                    <th className="py-3 px-4">操作类型</th>
                    <th className="py-3 px-4">关联ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-800">{log.account}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{log.name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{log.time}</td>
                        <td className="py-3 px-4 text-slate-600">{log.client}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{log.ip}</td>
                        <td className="py-3 px-4">{renderActionBadge(log.actionType)}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{log.relatedId}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <span>暂无符合条件的操作记录</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 3: 水印                                                                  */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "watermark" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">全局暗水印与视频防盗贴图设置</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  开启后将在AI渲染成片、导出的高清视频及素材中强制嵌入版块标识
                </p>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => {
                    setWatermarkEnabled(e.target.checked);
                    showToast(`全局水印已${e.target.checked ? "开启" : "停用"}`);
                  }}
                  className="accent-[#7C3AED] rounded"
                />
                <span className="text-xs font-bold text-slate-700">
                  {watermarkEnabled ? "已启用全局水印" : "全局水印已关闭"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">水印类型</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="wmType"
                        checked={watermarkType === "text"}
                        onChange={() => setWatermarkType("text")}
                        className="accent-[#7C3AED]"
                      />
                      <span>文字版权水印</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="wmType"
                        checked={watermarkType === "image"}
                        onChange={() => setWatermarkType("image")}
                        className="accent-[#7C3AED]"
                      />
                      <span>透明PNG Logo防伪贴图</span>
                    </label>
                  </div>
                </div>

                {watermarkType === "text" ? (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">水印文本内容</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">防伪Logo图片</label>
                    <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400">
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500 font-bold">点击上传 PNG 透明水印 Logo</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    不透明度 ({watermarkOpacity}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                    className="w-full accent-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">九宫格落点位置</label>
                  <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-bold"
                  >
                    <option value="top-left">左上角</option>
                    <option value="top-right">右上角</option>
                    <option value="center">画面居中 (平铺平铺)</option>
                    <option value="bottom-left">左下角</option>
                    <option value="bottom-right">右下角 (推荐标准)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => showToast("全局水印参数已成功保存")}
                  className="px-5 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  保存水印配置
                </button>
              </div>

              {/* Live Canvas Mock */}
              <div className="bg-slate-900 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[220px] border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">视频画布渲染预览 (16:9)</div>
                <div className="text-center py-10">
                  <span className="text-slate-600 text-xs font-bold">【视频爆款场景片段】</span>
                </div>
                {watermarkEnabled && (
                  <div
                    style={{ opacity: watermarkOpacity / 100 }}
                    className={`absolute p-2 bg-black/40 text-white text-xs font-black rounded backdrop-blur-xs ${
                      watermarkPosition === "bottom-right"
                        ? "bottom-4 right-4"
                        : watermarkPosition === "top-left"
                        ? "top-4 left-4"
                        : watermarkPosition === "top-right"
                        ? "top-4 right-4"
                        : watermarkPosition === "bottom-left"
                        ? "bottom-4 left-4"
                        : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    }`}
                  >
                    {watermarkText}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 4: 系统设置 (系统全面规则配置)                                            */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "system_settings" && (
          <div className="space-y-6 pb-12">
            <section className="space-y-4 border-b border-slate-200 bg-white p-5">
              <h3 className="text-sm font-extrabold text-slate-900">广告账户可见性</h3>
              <div className="flex flex-wrap gap-6 text-xs">
                {([['all', '全部'], ['personal', '个人'], ['group', '小组'], ['category', '分类']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="radio" name="ad-visibility" value={value} checked={adVisibility === value} onChange={() => setAdVisibility(value)} className="accent-violet-600" />{label}</label>)}
              </div>
              <div className="flex justify-end"><button type="button" className="rounded-md bg-violet-600 px-4 py-2 text-xs font-bold text-white" onClick={() => { if (!getAdActor().permissions.includes('ab_system_setting_manage')) { showToast('暂无系统设置权限'); return; } updateAdStore(s => ({ ...s, visibility: adVisibility })); showToast('广告账户可见性已保存'); }}>保存账户可见性</button></div>
            </section>
            {/* 1. 视频下载/推送/复制到剪映 */}
            <div className="hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">视频下载/推送/复制到剪映</h3>
              </div>
              
              <div className="pt-2 space-y-4">
                <div className="flex items-center gap-6 text-xs text-slate-700 font-bold">
                  <span className="w-48 shrink-0">下载 / 推送 / 复制到剪映</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="video_format_mode"
                        checked={videoFormatMode === "transcoded"}
                        onChange={() => setVideoFormatMode("transcoded")}
                        className="accent-[#7C3AED] w-4 h-4 cursor-pointer"
                      />
                      <span className={videoFormatMode === "transcoded" ? "text-[#7C3AED] font-bold" : "text-slate-600"}>
                        转码后视频
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="video_format_mode"
                        checked={videoFormatMode === "original"}
                        onChange={() => setVideoFormatMode("original")}
                        className="accent-[#7C3AED] w-4 h-4 cursor-pointer"
                      />
                      <span className={videoFormatMode === "original" ? "text-[#7C3AED] font-bold" : "text-slate-600"}>
                        原片
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-500 space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>请结合公司网络情况设置:</span>
                  </div>
                  <p className="pl-5">【转码后视频】视频体积更小，节省公司网络带宽资源，能够改善使用高峰期网络卡顿情况，视频细节可能有细微变化。</p>
                  <p className="pl-5">【原片】视频体积大，占用公司网络带宽较多，使用高峰期较容易发生卡顿情况，原片和上传的视频完全一致。</p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("视频下载/推送方式设置已保存！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 3. 功能开关 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">功能开关</h3>
              </div>

              <div className="pt-1 space-y-3.5 max-w-xl text-xs font-bold text-slate-700">
                {[
                  { key: "categorySearch", label: "分类搜索开关" },
                  { key: "imageDownloadLog", label: "图片下载，操作记录开关" },
                  { key: "textDownloadLog", label: "文案下载，操作记录开关" },
                  { key: "finishedListSpendData", label: "成片列表展示消耗数据开关" },
                  { key: "finishedManualLinkMaterial", label: "成片手动关联素材开关" },
                  { key: "videoPushSuccessNotify", label: "视频推送成功发送消息开关", desc: "开启后视频推送完成后会收到消息通知。" },
                  { key: "uploadFinishedCutTimeRequired", label: "上传成片剪辑时间必填" },
                  { key: "uploadMaterialShootTimeRequired", label: "上传素材拍摄时间必填" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <span>{item.label}</span>
                      {item.desc && <p className="text-[11px] text-slate-400 font-normal mt-0.5">{item.desc}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFeatureSwitches((prev: any) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (featureSwitches as any)[item.key] ? "bg-[#7C3AED]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          (featureSwitches as any)[item.key] ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("功能开关设置已生效！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 4. 发布多少天后开放下载/复制到剪映 */}
            <div className="hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">发布多少天后开放下载/复制到剪映</h3>
                <span className="text-xs text-slate-400 font-normal">设置成片、素材、第三方、图片、文案、音频发布后多久可以下载/复制到剪映</span>
              </div>

              <div className="pt-2 space-y-3 max-w-4xl">
                {[
                  { key: "finished", label: "成片" },
                  { key: "material", label: "素材" },
                  { key: "thirdParty", label: "第三方" },
                  { key: "image", label: "图片" },
                  { key: "text", label: "文案" },
                  { key: "audio", label: "音频" },
                ].map((row) => {
                  const val = (downloadRules as any)[row.key];
                  return (
                    <div key={row.key} className="flex items-center gap-6 text-xs font-bold text-slate-700">
                      <span className="w-16 shrink-0 text-right">{row.label}</span>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-400 font-normal shrink-0">分组成员</span>
                        <input
                          type="number"
                          value={val.group}
                          onChange={(e) =>
                            setDownloadRules((prev: any) => ({
                              ...prev,
                              [row.key]: { ...prev[row.key], group: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-400 font-normal shrink-0">部门成员</span>
                        <input
                          type="number"
                          value={val.team}
                          onChange={(e) =>
                            setDownloadRules((prev: any) => ({
                              ...prev,
                              [row.key]: { ...prev[row.key], team: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-400 font-normal shrink-0">公司其他人</span>
                        <input
                          type="number"
                          value={val.others}
                          onChange={(e) =>
                            setDownloadRules((prev: any) => ({
                              ...prev,
                              [row.key]: { ...prev[row.key], others: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("资源开放下载规则保存成功！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 6. 发布多少天后开放查看 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">发布多少天后开放查看</h3>
                <span className="text-xs text-slate-400 font-normal">设置成片、素材、第三方、图片、文案、音频、脚本发布后多久公开</span>
              </div>

              <div className="pt-2 space-y-3 max-w-4xl">
                {[
                  { key: "finished", label: "成片" },
                  { key: "material", label: "素材" },
                  { key: "thirdParty", label: "第三方" },
                  { key: "image", label: "图片" },
                  { key: "text", label: "文案" },
                  { key: "audio", label: "音频" },
                  { key: "script", label: "脚本" },
                ].map((row) => {
                  const val = (viewRules as any)[row.key];
                  return (
                    <div key={row.key} className="flex items-center gap-6 text-xs font-bold text-slate-700">
                      <span className="w-16 shrink-0 text-right">{row.label}</span>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-400 font-normal shrink-0">分组成员</span>
                        <input
                          type="number"
                          value={val.group}
                          onChange={(e) =>
                            setViewRules((prev: any) => ({
                              ...prev,
                              [row.key]: { ...prev[row.key], group: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-400 font-normal shrink-0">部门成员</span>
                        <input
                          type="number"
                          value={val.team}
                          onChange={(e) =>
                            setViewRules((prev: any) => ({
                              ...prev,
                              [row.key]: { ...prev[row.key], team: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-400 font-normal shrink-0">公司其他人</span>
                        <input
                          type="number"
                          value={val.others}
                          onChange={(e) =>
                            setViewRules((prev: any) => ({
                              ...prev,
                              [row.key]: { ...prev[row.key], others: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("资源开放查看规则保存成功！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 7. 发布多少天后支持推送 */}
            <div className="hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">发布多少天后支持推送</h3>
                <span className="text-xs text-slate-400 font-normal">设置多少天后可以推送至广告账户</span>
              </div>

              <div className="pt-2 flex items-center gap-8 max-w-4xl text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400 font-normal shrink-0">分组成员</span>
                  <input
                    type="number"
                    value={pushDaysRules.group}
                    onChange={(e) => setPushDaysRules({ ...pushDaysRules, group: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400 font-normal shrink-0">部门成员</span>
                  <input
                    type="number"
                    value={pushDaysRules.team}
                    onChange={(e) => setPushDaysRules({ ...pushDaysRules, team: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400 font-normal shrink-0">公司其他人</span>
                  <input
                    type="number"
                    value={pushDaysRules.others}
                    onChange={(e) => setPushDaysRules({ ...pushDaysRules, others: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("资源推送规则保存成功！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 8. 外网权限 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">外网权限</h3>
              </div>

              <div className="pt-2 space-y-4 text-xs font-bold text-slate-700">
                {/* 登录 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-6">
                    <span className="w-12 text-slate-700 font-bold">登录</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="ext_login_mode"
                        checked={extLoginMode === "forbidden"}
                        onChange={() => setExtLoginMode("forbidden")}
                        className="accent-[#7C3AED] w-4 h-4 cursor-pointer"
                      />
                      <span className="font-medium text-slate-600">禁止</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="ext_login_mode"
                        checked={extLoginMode === "allow"}
                        onChange={() => setExtLoginMode("allow")}
                        className="accent-[#7C3AED] w-4 h-4 cursor-pointer"
                      />
                      <span className="font-medium text-slate-600">允许</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="ext_login_mode"
                        checked={extLoginMode === "scope"}
                        onChange={() => setExtLoginMode("scope")}
                        className="accent-[#7C3AED] w-4 h-4 cursor-pointer"
                      />
                      <span className={extLoginMode === "scope" ? "text-[#7C3AED] font-bold" : "font-medium text-slate-600"}>
                        允许指定范围
                      </span>
                    </label>
                  </div>

                  {extLoginMode === "scope" && (
                    <div className="flex items-center gap-4 pl-18 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">部门:</span>
                        <select
                          value={extLoginTeam}
                          onChange={(e) => setExtLoginTeam(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 bg-white"
                        >
                          <option value="">请选择</option>
                          <option value="team_a">电商一部</option>
                          <option value="team_b">品牌二部</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">分组:</span>
                        <select
                          value={extLoginGroup}
                          onChange={(e) => setExtLoginGroup(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 bg-white"
                        >
                          <option value="">请选择</option>
                          <option value="group_1">爆款剪辑组</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">用户:</span>
                        <div className="px-3 py-1 border border-slate-200 rounded-xl flex items-center gap-1.5 bg-white">
                          <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                            {extLoginUser}
                            <X className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setExtLoginUser("")} />
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 下载 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-6">
                    <span className="w-12 text-slate-700 font-bold">下载</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_dl" checked={extDownloadMode === "forbidden"} onChange={() => setExtDownloadMode("forbidden")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className="font-medium text-slate-600">禁止</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_dl" checked={extDownloadMode === "allow"} onChange={() => setExtDownloadMode("allow")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className={extDownloadMode === "allow" ? "text-[#7C3AED] font-bold" : "font-medium text-slate-600"}>允许</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_dl" checked={extDownloadMode === "scope"} onChange={() => setExtDownloadMode("scope")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className={extDownloadMode === "scope" ? "text-[#7C3AED] font-bold" : "font-medium text-slate-600"}>允许指定范围</span>
                    </label>
                  </div>
                  {extDownloadMode === "scope" && renderExternalScopeSelector("download")}
                </div>

                {/* 编辑 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-6">
                    <span className="w-12 text-slate-700 font-bold">编辑</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_ed" checked={extEditMode === "forbidden"} onChange={() => setExtEditMode("forbidden")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className="font-medium text-slate-600">禁止</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_ed" checked={extEditMode === "allow"} onChange={() => setExtEditMode("allow")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className={extEditMode === "allow" ? "text-[#7C3AED] font-bold" : "font-medium text-slate-600"}>允许</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_ed" checked={extEditMode === "scope"} onChange={() => setExtEditMode("scope")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className={extEditMode === "scope" ? "text-[#7C3AED] font-bold" : "font-medium text-slate-600"}>允许指定范围</span>
                    </label>
                  </div>
                  {extEditMode === "scope" && renderExternalScopeSelector("edit")}
                </div>

                {/* 删除 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-6">
                    <span className="w-12 text-slate-700 font-bold">删除</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_del" checked={extDeleteMode === "forbidden"} onChange={() => setExtDeleteMode("forbidden")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className="font-medium text-slate-600">禁止</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_del" checked={extDeleteMode === "allow"} onChange={() => setExtDeleteMode("allow")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className={extDeleteMode === "allow" ? "text-[#7C3AED] font-bold" : "font-medium text-slate-600"}>允许</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="radio" name="ext_del" checked={extDeleteMode === "scope"} onChange={() => setExtDeleteMode("scope")} className="accent-[#7C3AED] w-4 h-4 cursor-pointer" />
                      <span className={extDeleteMode === "scope" ? "text-[#7C3AED] font-bold" : "font-medium text-slate-600"}>允许指定范围</span>
                    </label>
                  </div>
                  {extDeleteMode === "scope" && renderExternalScopeSelector("delete")}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("外网权限规则配置已保存！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 9. 发布作品，可见性设置 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">发布作品，可见性设置</h3>
              </div>

              <div className="pt-2 flex items-center gap-6 text-xs font-bold text-slate-700 flex-wrap">
                <span className="text-rose-500 mr-1">* 允许项</span>
                {[
                  { key: "public", label: "公开" },
                  { key: "team", label: "部门范围可见" },
                  { key: "group", label: "分组范围可见" },
                  { key: "publicResource", label: "公用资源", hasHelp: true },
                  { key: "specifiedScope", label: "指定范围" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(publishVisibility as any)[item.key]}
                      onChange={(e) =>
                        setPublishVisibility((prev: any) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="accent-[#7C3AED] w-4 h-4 rounded cursor-pointer"
                    />
                    <span className={(publishVisibility as any)[item.key] ? "text-[#7C3AED] font-bold" : "text-slate-700"}>
                      {item.label}
                    </span>
                    {item.hasHelp && <HelpCircle className="w-3.5 h-3.5 text-slate-400" />}
                  </label>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("作品可见性规则已应用！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 11. 下载+复制到剪映报警 */}
            <div className="hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">下载+复制到剪映报警</h3>
              </div>

              <div className="pt-2 space-y-4 text-xs font-bold text-slate-700">
                {/* 报警开关 */}
                <div className="flex items-center justify-between max-w-xl">
                  <span>大批量【下载+复制到剪映】报警开关</span>
                  <button
                    type="button"
                    onClick={() => setBulkDownloadAlertSwitch(!bulkDownloadAlertSwitch)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      bulkDownloadAlertSwitch ? "bg-[#7C3AED]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        bulkDownloadAlertSwitch ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 员工一天内 */}
                <div className="flex items-center gap-3">
                  <span className="shrink-0">员工一天内【下载+复制到剪映】超过</span>
                  <input
                    type="number"
                    value={dailyDownloadLimit}
                    onChange={(e) => setDailyDownloadLimit(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                  />
                  <span className="shrink-0">次，发送预警邮件</span>
                  <span className="text-slate-400 font-normal">(0或放空为不限制)</span>
                </div>

                {/* 员工一周内 */}
                <div className="flex items-center gap-3">
                  <span className="shrink-0">员工一周内【下载+复制到剪映】超过</span>
                  <input
                    type="number"
                    value={weeklyDownloadLimit}
                    onChange={(e) => setWeeklyDownloadLimit(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none"
                  />
                  <span className="shrink-0">次，发送预警邮件</span>
                  <span className="text-slate-400 font-normal">(0或放空为不限制)</span>
                </div>

                {/* 锁定账号并踢下线 */}
                <div className="flex items-center justify-between max-w-xl">
                  <span>达到下载/复制到剪映数量，锁定账号并踢下线</span>
                  <button
                    type="button"
                    onClick={() => setLockAndKickoutOnLimit(!lockAndKickoutOnLimit)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      lockAndKickoutOnLimit ? "bg-[#7C3AED]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        lockAndKickoutOnLimit ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 接收邮箱列表 */}
                <div className="space-y-2 pt-1">
                  {emailReceivers.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-slate-500 font-medium shrink-0">接收邮箱 {idx + 1}</span>
                      <input
                        type="text"
                        placeholder="请填写邮箱"
                        value={email}
                        onChange={(e) => {
                          const next = [...emailReceivers];
                          next[idx] = e.target.value;
                          setEmailReceivers(next);
                        }}
                        className="w-80 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#7C3AED] outline-none font-medium"
                      />
                      {emailReceivers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEmailReceivers(emailReceivers.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setEmailReceivers([...emailReceivers, ""])}
                    className="text-[#7C3AED] hover:underline font-bold text-xs pt-1 inline-flex items-center gap-1 cursor-pointer"
                  >
                    + 点击添加
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("下载与剪映批量报警规则设置成功！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>

            {/* 12. 自动修改状态 (资源状态修改规则) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">自动修改状态</h3>
              </div>

              <div className="pt-2 space-y-5 max-w-md text-xs font-bold text-slate-700">
                {/* 推送成功后修改视频状态 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>推送成功后修改视频状态</span>
                    <button
                      type="button"
                      onClick={() => setAutoChangeStatusOnPushSuccess(!autoChangeStatusOnPushSuccess)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoChangeStatusOnPushSuccess ? "bg-[#7C3AED]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          autoChangeStatusOnPushSuccess ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pl-6">
                    <span className="text-slate-500 font-normal shrink-0">默认值</span>
                    <select
                      value={pushSuccessDefaultVideoStatus}
                      onChange={(e) => setPushSuccessDefaultVideoStatus(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#7C3AED] outline-none"
                    >
                      <option value="已上机">已上机</option>
                      <option value="投放中">投放中</option>
                      <option value="待审核">待审核</option>
                      <option value="已完成">已完成</option>
                    </select>
                  </div>
                </div>

                {/* 脚本关联任务后修改状态 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>脚本关联任务后修改状态</span>
                    <button
                      type="button"
                      onClick={() => setAutoChangeStatusOnScriptLinked(!autoChangeStatusOnScriptLinked)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoChangeStatusOnScriptLinked ? "bg-[#7C3AED]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          autoChangeStatusOnScriptLinked ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pl-6">
                    <span className="text-slate-500 font-normal shrink-0">默认值</span>
                    <select
                      value={scriptLinkedDefaultScriptStatus}
                      onChange={(e) => setScriptLinkedDefaultScriptStatus(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#7C3AED] outline-none"
                    >
                      <option value="审核通过">审核通过</option>
                      <option value="进行中">进行中</option>
                      <option value="制作中">制作中</option>
                      <option value="已封存">已封存</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("自动修改状态规则保存成功！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 5: 系统自动化标签                                                       */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "auto_tags" && (
          <div className="space-y-6 pb-12">
            {/* 1. 爆款视频 */}
            <div data-testid="viral-video-settings" className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">爆款视频</h3>
              </div>

              <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <span className="shrink-0 text-slate-600">成片</span>
                  <select
                    aria-label="爆款判定指标"
                    value={hotVideoType}
                    onChange={(e) => { setHotVideoType(e.target.value as ViralVideoRule["period"]); setHotVideoError(""); }}
                    className="px-3 py-1.5 border border-slate-200 focus:border-[#7C3AED] rounded-xl text-xs font-bold text-slate-800 bg-white shadow-2xs outline-none cursor-pointer"
                  >
                    <option value="monthly">月消耗</option>
                    <option value="total">总消耗</option>
                  </select>
                  <span className="text-slate-600">达到</span>
                  <input
                    ref={hotVideoThresholdRef}
                    aria-label="爆款消耗门槛（万元）"
                    aria-invalid={Boolean(hotVideoError)}
                    aria-describedby={hotVideoError ? "viral-video-rule-error" : undefined}
                    type="number"
                    min="0.000001"
                    step="any"
                    value={hotVideoThreshold}
                    onChange={(e) => { setHotVideoThreshold(e.target.value); setHotVideoError(""); }}
                    className={`w-28 px-3 py-1.5 border rounded-xl text-xs font-bold text-slate-800 outline-none text-center ${hotVideoError ? "border-rose-500" : "border-slate-200 focus:border-[#7C3AED]"}`}
                  />
                  <span className="text-slate-600">万，自动设置为爆款视频</span>
                </div>

                <button
                  type="button"
                  onClick={saveHotVideoSettings}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
              {hotVideoError && <p id="viral-video-rule-error" role="alert" className="text-xs text-rose-600">{hotVideoError}</p>}
            </div>

            {/* 2. 保护标签 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-[#7C3AED] pl-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">保护标签</h3>
              </div>

              {/* 开关 */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-bold text-slate-700">开关</span>
                <button
                  type="button"
                  onClick={() => setProtectedTagSwitch(!protectedTagSwitch)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    protectedTagSwitch ? "bg-[#7C3AED]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      protectedTagSwitch ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 指定成片分类与打上保护标签条件 */}
              <div className="flex items-center gap-4 flex-wrap text-xs font-bold text-slate-700 pt-1">
                <span className="shrink-0 text-slate-700">指定成片分类</span>
                
                <div className="relative">
                  <div
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="min-w-64 max-w-md px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white flex items-center gap-1.5 flex-wrap cursor-pointer hover:border-[#7C3AED] transition-colors"
                  >
                    {protectedCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium border border-slate-200/80"
                      >
                        {cat}
                        <X
                          className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProtectedCategories(protectedCategories.filter((_, i) => i !== idx));
                          }}
                        />
                      </span>
                    ))}
                    {protectedCategories.length === 0 && (
                      <span className="text-slate-400 font-normal">请选择成片分类...</span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                  </div>

                  {/* 下拉类目选择器 */}
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-2 space-y-1">
                      <div className="text-[11px] font-normal text-slate-400 px-2 py-1">选择要设置的成片分类</div>
                      {availableCategoryOptions.map((opt) => {
                        const isSelected = protectedCategories.includes(opt);
                        return (
                          <div
                            key={opt}
                            onClick={() => {
                              if (isSelected) {
                                setProtectedCategories(protectedCategories.filter((c) => c !== opt));
                              } else {
                                setProtectedCategories([...protectedCategories, opt]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between ${
                              isSelected ? "bg-purple-50 text-[#7C3AED] font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="shrink-0 text-slate-700">打上保护标签条件：最近</span>
                  <input
                    type="number"
                    value={protectAddDays}
                    onChange={(e) => setProtectAddDays(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none text-center"
                  />
                  <span className="shrink-0 text-slate-700">天，消耗达到</span>
                  <input
                    type="number"
                    step="0.1"
                    value={protectAddAmount}
                    onChange={(e) => setProtectAddAmount(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none text-center"
                  />
                  <span className="text-slate-500 font-normal">万，打上保护标签 (仅第1次达成条件会打上保护标签)</span>
                </div>
              </div>

              {/* 取消保护标签条件 */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700 pt-1">
                <span className="shrink-0 text-slate-700">取消保护标签条件：最近</span>
                <input
                  type="number"
                  value={protectRemoveDays}
                  onChange={(e) => setProtectRemoveDays(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none text-center"
                />
                <span className="shrink-0 text-slate-700">天，消耗未达到</span>
                <input
                  type="number"
                  value={protectRemoveAmount}
                  onChange={(e) => setProtectRemoveAmount(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none text-center"
                />
                <span className="shrink-0 text-slate-700">万，连续未达到</span>
                <input
                  type="number"
                  value={protectRemoveTimes}
                  onChange={(e) => setProtectRemoveTimes(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#7C3AED] outline-none text-center"
                />
                <span className="text-slate-500 font-normal">次 (每天判断1次)，取消保护标签</span>
              </div>

              {/* 保存按钮 */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast("保护标签规则设置已成功保存！")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 6: 广告组管理 / 广告主管理                                              */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "ad_groups" && (
          <div className="space-y-5 animate-fade-in pb-12">
            {/* 1. 顶部巨量/腾讯/TikTok等多平台 Tab 栏 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1 min-w-max border-b border-slate-100 pb-2">
                {AD_PLATFORMS.map((plat) => {
                  const isActive = adPlatform === plat;
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => {
                        setAdPlatform(plat);
                        setSelectedAdAccountIds([]);
                        setGroupAccountPage(1);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {plat}
                    </button>
                  );
                })}
              </div>

              {/* 2. 二级 Mode 视图切换：广告账户 VS 账户分组 */}
              <div className="flex items-center gap-6 pt-3 px-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdSubTab("account")}
                  className={`text-xs font-bold pb-2 transition-all cursor-pointer relative ${
                    adSubTab === "account"
                      ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  广告账户
                </button>
                <button
                  type="button"
                  onClick={() => setAdSubTab("group")}
                  className={`text-xs font-bold pb-2 transition-all cursor-pointer relative ${
                    adSubTab === "group"
                      ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  账户分组
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* 视图 1：广告账户 (AD ACCOUNTS VIEW)                                    */}
            {/* ----------------------------------------------------------------------- */}
            {adSubTab === "account" && (
              <div className="space-y-4">
                {/* 筛选与授权工具栏 */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* 去授权按钮 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!checkAdManagement()) return;
                        setReauthorizingAccount(undefined);
                        setAuthModalOpen(true);
                      }}
                      className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      去授权
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncAdAccounts}
                      disabled={syncingAdAccounts}
                      className="px-4 py-1.5 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`mr-1 inline h-3.5 w-3.5 ${syncingAdAccounts ? "animate-spin" : ""}`} />
                      {syncingAdAccounts ? "同步中" : "手动同步"}
                    </button>

                    {/* 已授权 / 已失效 Tab 开关 */}
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAdAuthFilter("authorized")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          adAuthFilter === "authorized"
                            ? "bg-[#7C3AED] text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        已授权
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdAuthFilter("expired")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          adAuthFilter === "expired"
                            ? "bg-[#7C3AED] text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        已失效
                      </button>
                    </div>

                    {/* 下拉筛选：是否关联分类 */}
                    <select
                      value={adCategoryFilter}
                      onChange={(e) => setAdCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-2xs outline-none cursor-pointer focus:border-[#7C3AED]"
                    >
                      <option value="all">请选择是否关联分类</option>
                      <option value="bound">已关联分类</option>
                      <option value="unbound">未关联分类</option>
                    </select>

                    {/* 下拉筛选：是否关联小组 */}
                    <select
                      value={adGroupFilter}
                      onChange={(e) => setAdGroupFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-2xs outline-none cursor-pointer focus:border-[#7C3AED]"
                    >
                      <option value="all">请选择是否关联小组</option>
                      <option value="bound">已关联小组</option>
                      <option value="unbound">未关联小组</option>
                    </select>

                    {/* 下拉筛选：是否关联用户 */}
                    <select
                      value={adUserFilter}
                      onChange={(e) => setAdUserFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-2xs outline-none cursor-pointer focus:border-[#7C3AED]"
                    >
                      <option value="all">请选择是否关联用户</option>
                      <option value="bound">已关联用户</option>
                      <option value="unbound">未关联用户</option>
                    </select>

                    {/* 下拉筛选：选择小组 */}
                    <select
                      value={adGroupSelectFilter}
                      onChange={(e) => setAdGroupSelectFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-2xs outline-none cursor-pointer focus:border-[#7C3AED]"
                    >
                      <option value="all">请选择小组</option>
                      {availableGroupsList.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 账户ID 搜索框 */}
                  <div className="relative w-48 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="请输入账户ID"
                      value={adSearchKeyword}
                      onChange={(e) => setAdSearchKeyword(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#7C3AED] outline-none shadow-2xs"
                    />
                  </div>
                </div>

                {/* 批量操作控制按钮区 */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAdAccountIds.length === 0) {
                        showToast("请先勾选需要绑定的广告账户");
                        return;
                      }
                      setBatchBindModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    批量绑定 {selectedAdAccountIds.length > 0 && `(${selectedAdAccountIds.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAdAccountIds.length === 0) {
                        showToast("请先勾选需要备注的广告账户");
                        return;
                      }
                      setBatchRemarkModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    批量备注
                  </button>
                  <button
                    type="button"
                      onClick={() => {
                        if (!checkAdManagement()) return;
                        if (!selectedAdAccountIds.length) {
                        showToast("请先选择广告账户");
                        return;
                      }
                      setBatchCancelAuthModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    取消授权
                  </button>
                </div>

                {/* 广告账户表格 */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                          <th className="py-3 px-4 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredAdAccounts.length > 0 &&
                                filteredAdAccounts.every((a) => selectedAdAccountIds.includes(a.id))
                              }
                              onChange={() => {
                                const allFilteredIds = filteredAdAccounts.map((a) => a.id);
                                const isAll = allFilteredIds.every((id) =>
                                  selectedAdAccountIds.includes(id)
                                );
                                if (isAll) {
                                  setSelectedAdAccountIds((prev) =>
                                    prev.filter((id) => !allFilteredIds.includes(id))
                                  );
                                } else {
                                  setSelectedAdAccountIds((prev) =>
                                    Array.from(new Set([...prev, ...allFilteredIds]))
                                  );
                                }
                              }}
                              className="rounded accent-[#7C3AED] cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-4">广告账户</th>
                          <th className="py-3 px-4">关联分类</th>
                          <th className="py-3 px-4">关联小组</th>
                          <th className="py-3 px-4">关联用户</th>
                          <th className="py-3 px-4">备注</th>
                          <th className="py-3 px-4 text-center">授权状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredAdAccounts.map((acc) => {
                          const isSelected = selectedAdAccountIds.includes(acc.id);
                          return (
                            <tr
                              key={acc.id}
                              className={`hover:bg-purple-50/30 transition-colors ${
                                isSelected ? "bg-purple-50/50" : ""
                              }`}
                            >
                              <td className="py-3.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedAdAccountIds((prev) =>
                                      prev.includes(acc.id)
                                        ? prev.filter((i) => i !== acc.id)
                                        : [...prev, acc.id]
                                    );
                                  }}
                                  className="rounded accent-[#7C3AED] cursor-pointer"
                                />
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5 max-w-xl">
                                  <div className="font-bold text-slate-800 text-xs leading-relaxed">
                                    {acc.name}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    {acc.id}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                {acc.category ? (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200/80">
                                    {acc.category}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-normal">--</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {acc.group ? (
                                  <span className="px-2 py-0.5 bg-purple-50 text-[#7C3AED] rounded-md text-[11px] font-bold">
                                    {acc.group}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-normal">--</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {acc.user ? (
                                  <span className="text-xs text-slate-700 font-medium">
                                    {acc.user}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-normal">--</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="text-xs text-slate-500 font-mono">
                                  {acc.remark || "--"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {acc.status === "authorized" ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold">
                                    已授权
                                  </span>
                                ) : (
                                  <div className="space-y-2"><span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[11px] font-bold">已失效</span><button type="button" className="block mx-auto text-xs text-violet-600" onClick={() => { if (!checkAdManagement()) return; setReauthorizingAccount(acc); setAuthModalOpen(true); }}>重新授权</button></div>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {filteredAdAccounts.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                              暂无符合条件的广告账户
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* 视图 2：账户分组 (ACCOUNT GROUPS VIEW)                                 */}
            {/* ----------------------------------------------------------------------- */}
            {adSubTab === "group" && (
              <div className="space-y-4">
                {/* 顶部新增账户分组按钮卡片 */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleOpenCreateGroupModal}
                    className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增账户分组</span>
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    当前平台 ({adPlatform}) 共{" "}
                    <strong className="text-[#7C3AED]">
                      {accountGroups.filter((g) => g.platform === adPlatform).length}
                    </strong>{" "}
                    个分组
                  </span>
                </div>

                {/* 分组列表表格 */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                          <th className="py-3 px-5">分组名称</th>
                          <th className="py-3 px-5">包含账户数</th>
                          <th className="py-3 px-5">谁能查看</th>
                          <th className="py-3 px-5 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {accountGroups
                          .filter((g) => g.platform === adPlatform)
                          .map((group) => (
                            <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-5 font-bold text-slate-900 text-xs">
                                {group.name}
                              </td>
                              <td className="py-3.5 px-5">
                                <span className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] rounded-lg text-xs font-extrabold">
                                  共 {group.accountIds.length} 个账户
                                </span>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="text-xs space-y-1 text-slate-600">
                                  <div>
                                    <span className="text-slate-400">部门：</span>
                                    {group.viewTeam || "未指定"}
                                  </div>
                                  <div>
                                    <span className="text-slate-400">用户：</span>
                                    {group.viewUsers && group.viewUsers.length > 0
                                      ? group.viewUsers.join(", ")
                                      : "未指定"}
                                  </div>
                                  <div><span className="text-slate-400">小组：</span>{group.viewGroup || "未指定"}</div>
                                  {!group.viewTeam && !group.viewGroup && !group.viewUsers.length && <div>全部成员</div>}
                                </div>
                              </td>
                              <td className="py-3.5 px-5 text-right space-x-3">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditGroupModal(group)}
                                  className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
                                >
                                  编辑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingGroupId(group.id);
                                    setDeleteGroupModalOpen(true);
                                  }}
                                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))}

                        {accountGroups.filter((g) => g.platform === adPlatform).length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                              该平台暂未新增账户分组，点击左上方“新增账户分组”开始配置
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {authModalOpen && (
          <AdAuthorizationDialog platform={adPlatform} account={reauthorizingAccount} onClose={() => setAuthModalOpen(false)} onSuccess={() => { setAuthModalOpen(false); setAdAuthFilter('authorized'); setAdSearchKeyword(''); setAdCategoryFilter('all'); setAdGroupFilter('all'); setAdUserFilter('all'); setAdGroupSelectFilter('all'); showToast('广告账户授权成功'); }} />
        )}
        {syncResult && <AdDialog title="同步结果" onClose={() => setSyncResult(null)}><div className="space-y-4 text-sm"><p>同步成功 {syncResult.success} 个，失败 {syncResult.failures.length} 个</p><p className="text-xs text-slate-500">原型演示 · {adDate()}</p>{syncResult.failures.map((f, i) => <div key={i} className="border-b border-slate-200 py-3"><p className="break-all">{f.name}</p><p className="mt-2 text-rose-600">{f.reason}</p></div>)}</div></AdDialog>}

        {/* =========================================================================== */}
        {/* MODAL 1: 批量绑定 MODAL (参见截图5)                                         */}
        {/* =========================================================================== */}
        {batchBindModalOpen && (
          <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="批量绑定" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
              {/* Modal 标题 */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                  <h3 className="text-sm font-extrabold text-slate-900">批量绑定</h3>
                </div>
                <X
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setBatchBindModalOpen(false)}
                />
              </div>

              {/* Modal 表单 */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-20 text-xs font-bold text-slate-700 text-right">
                    关联小组
                  </label>
                  <select
                    value={batchBindGroup}
                    onChange={(e) => setBatchBindGroup(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-[#7C3AED] outline-none shadow-2xs"
                  >
                    <option value="">请选择</option>
                    {availableGroupsList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-20 text-xs font-bold text-slate-700 text-right">
                    关联分类
                  </label>
                  <select
                    value={batchBindCategory}
                    onChange={(e) => setBatchBindCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-[#7C3AED] outline-none shadow-2xs"
                  >
                    <option value="">请选择</option>
                    {availableCategoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-slate-400 text-center pt-2">
                  为广告账户绑定小组/用户或分类，后续新产生的数据将按绑定关系统计
                </p>
              </div>

              {/* Modal 操作底部 */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBatchBindModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchBind}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </OverlayPortal>
        )}

        {/* =========================================================================== */}
        {/* MODAL 2: 批量备注 MODAL (参见截图6)                                         */}
        {/* =========================================================================== */}
        {batchRemarkModalOpen && (
          <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="批量备注" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                  <h3 className="text-sm font-extrabold text-slate-900">批量备注</h3>
                </div>
                <X
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setBatchRemarkModalOpen(false)}
                />
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <label className="w-16 text-xs font-bold text-slate-700 text-right pt-2 shrink-0">
                    <span className="text-rose-500 mr-0.5">*</span>备注
                  </label>
                  <input
                    type="text"
                    placeholder="请输入备注"
                    value={batchRemarkText}
                    onChange={(e) => setBatchRemarkText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-[#7C3AED] outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBatchRemarkModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchRemark}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </OverlayPortal>
        )}

        {/* =========================================================================== */}
        {/* MODAL 3: 批量取消授权 二次确认 MODAL (参见截图7)                             */}
        {/* =========================================================================== */}
        {batchCancelAuthModalOpen && (
          <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="取消授权" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">取消授权</h3>
                <X
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setBatchCancelAuthModalOpen(false)}
                />
              </div>

              <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  请确认是否取消所选 {selectedAdAccountIds.length} 个账户的授权，历史推送记录将保留。
                </p>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBatchCancelAuthModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchCancelAuth}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </OverlayPortal>
        )}

        {/* =========================================================================== */}
        {/* MODAL 4: 新增/编辑账户分组 MODAL (参见截图8, 9)                              */}
        {/* =========================================================================== */}
        {groupModalOpen && (
          <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="账户分组" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#7C3AED] rounded-full" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {groupModalMode === "create" ? "新增账户分组" : "编辑账户分组"}
                  </h3>
                </div>
                <X
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setGroupModalOpen(false)}
                />
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto min-h-0 flex-1">
                {/* 账户分组名称 */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                  <label className="w-24 text-xs font-bold text-slate-700 text-right shrink-0">
                    <span className="text-rose-500 mr-0.5">*</span>账户分组名称
                  </label>
                  <input
                    type="text"
                    placeholder="请输入账户分组名称"
                    value={groupFormName}
                    onChange={(e) => setGroupFormName(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-[#7C3AED] outline-none shadow-2xs"
                  />
                </div>

                {/* 谁能查看 */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="w-24 text-xs font-bold text-slate-700 text-right shrink-0">
                      谁能查看
                    </label>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-xs text-slate-500 w-12 text-right">部门：</span>
                      <select
                        value={groupFormTeam}
                        onChange={(e) => setGroupFormTeam(e.target.value)}
                        className="min-w-0 flex-1 sm:w-64 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-[#7C3AED] outline-none"
                      >
                        <option value="">请选择</option>
                        {availableTeamsList.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:pl-24">
                    <div className="flex min-w-0 w-full sm:w-auto items-center gap-2">
                      <span className="text-xs text-slate-500 w-12 text-right">小组：</span>
                      <select
                        value={groupFormGroup}
                        onChange={(e) => setGroupFormGroup(e.target.value)}
                        className="min-w-0 flex-1 sm:w-64 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-[#7C3AED] outline-none"
                      >
                        <option value="">请选择</option>
                        {availableGroupsList.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:pl-24">
                    <div className="flex min-w-0 w-full sm:w-auto items-center gap-2">
                      <span className="text-xs text-slate-500 w-12 text-right">用户：</span>
                      <div className="min-w-0 flex-1 sm:w-64 px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white flex items-center gap-1.5 flex-wrap">
                        {groupFormUsers.map((u, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium border border-slate-200"
                          >
                            {u}
                            <X
                              className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                              onClick={() =>
                                setGroupFormUsers(groupFormUsers.filter((_, i) => i !== idx))
                              }
                            />
                          </span>
                        ))}
                        {groupFormUsers.length < availableUsersList.length && (
                          <select
                            onChange={(e) => {
                              if (e.target.value && !groupFormUsers.includes(e.target.value)) {
                                setGroupFormUsers([...groupFormUsers, e.target.value]);
                              }
                              e.target.value = "";
                            }}
                            className="text-[11px] text-slate-400 bg-transparent outline-none cursor-pointer border-none"
                          >
                            <option value="">+添加</option>
                            {availableUsersList
                              .filter((u) => !groupFormUsers.includes(u))
                              .map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 穿梭框 (两栏选号) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  {/* 左栏：关联的账户 */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>关联的账户</span>
                      <button
                        type="button"
                        onClick={() => {
                          setGroupModalOpen(false);
                          if (!checkAdManagement()) return;
                          setReauthorizingAccount(undefined);
                          setAuthModalOpen(true);
                        }}
                        className="text-[#7C3AED] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        去授权
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="请输入账户名称/id"
                      value={groupFormSearch}
                      onChange={(e) => {
                        setGroupFormSearch(e.target.value);
                        setGroupAccountPage(1);
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-[#7C3AED]"
                    />

                    {/* 全选 */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 px-1 pt-1 border-b border-slate-200 pb-2">
                      <input
                        type="checkbox"
                        checked={
                          adAccounts.filter((a) => a.platform === adPlatform).length > 0 &&
                          adAccounts
                            .filter((a) => a.platform === adPlatform)
                            .every((a) => groupFormAccountIds.includes(a.id))
                        }
                        onChange={() => {
                          const platAccounts = adAccounts.filter((a) => a.platform === adPlatform);
                          const allPlatIds = platAccounts.map((a) => a.id);
                          const isAll = allPlatIds.every((id) =>
                            groupFormAccountIds.includes(id)
                          );
                          if (isAll) {
                            setGroupFormAccountIds((prev) =>
                              prev.filter((id) => !allPlatIds.includes(id))
                            );
                          } else {
                            setGroupFormAccountIds((prev) =>
                              Array.from(new Set([...prev, ...allPlatIds]))
                            );
                          }
                        }}
                        className="rounded accent-[#7C3AED] cursor-pointer"
                      />
                      <span>全选</span>
                    </div>

                    {/* 账户列表 */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {pagedGroupAccounts.map((acc) => {
                          const isChecked = groupFormAccountIds.includes(acc.id);
                          return (
                            <div
                              key={acc.id}
                              onClick={() => {
                                setGroupFormAccountIds((prev) =>
                                  prev.includes(acc.id)
                                    ? prev.filter((i) => i !== acc.id)
                                    : [...prev, acc.id]
                                );
                              }}
                              className={`p-2 bg-white rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                isChecked
                                  ? "border-[#7C3AED] bg-purple-50/40"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-2 max-w-[80%]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="mt-0.5 rounded accent-[#7C3AED]"
                                />
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 text-[11px] truncate">
                                    {acc.name}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                                    <span>{acc.id}</span>
                                    {acc.status === "expired" && (
                                      <span className="px-1 bg-rose-100 text-rose-600 rounded text-[9px] font-bold">
                                        失效
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  acc.isStarred
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            </div>
                          );
                        })}
                    </div>
                    <AssetPagination
                      total={filteredGroupAccounts.length}
                      page={currentGroupAccountPage}
                      pageSize={groupAccountPageSize}
                      onPageChange={setGroupAccountPage}
                      onPageSizeChange={(value) => {
                        setGroupAccountPageSize(value);
                        setGroupAccountPage(1);
                      }}
                    />
                  </div>

                  {/* 右栏：已选账号 */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                    <div className="text-xs font-bold text-slate-800">已选账号</div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                      {groupFormAccountIds.map((id) => {
                        const acc = adAccounts.find((a) => a.id === id);
                        if (!acc) return null;
                        return (
                          <div
                            key={id}
                            className="p-2 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <div className="space-y-0.5 max-w-[85%]">
                              <div className="font-bold text-slate-800 text-[11px] truncate">
                                {acc.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">{acc.id}</div>
                            </div>
                            <X
                              className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                              onClick={() =>
                                setGroupFormAccountIds((prev) => prev.filter((i) => i !== id))
                              }
                            />
                          </div>
                        );
                      })}

                      {groupFormAccountIds.length === 0 && (
                        <div className="py-16 text-center text-slate-400 text-xs font-normal">
                          暂未添加账号
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveGroup}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </OverlayPortal>
        )}

        {/* =========================================================================== */}
        {/* MODAL 5: 删除账户分组 确认 MODAL (参见截图10)                              */}
        {/* =========================================================================== */}
        {deleteGroupModalOpen && (
          <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label="删除账户分组" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">删除</h3>
                <X
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setDeleteGroupModalOpen(false)}
                />
              </div>

              <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  请确认是否删除该分组
                </p>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteGroupModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteGroup}
                  className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </OverlayPortal>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 7: 登录记录                                                              */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "login_logs" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              全员登录历史、终端与安全预警记录
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">用户</th>
                    <th className="py-2.5 px-3">IP地址</th>
                    <th className="py-2.5 px-3">归属地</th>
                    <th className="py-2.5 px-3">登录终端设备</th>
                    <th className="py-2.5 px-3">登录时间</th>
                    <th className="py-2.5 px-3">状态预警</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loginLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{l.user}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{l.ip}</td>
                      <td className="py-2.5 px-3 text-slate-600">{l.location}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{l.device}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{l.time}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${l.status === "正常" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 8: 消息通知 (MESSAGE NOTIFICATIONS)                                     */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "notifications" && (
          <div className="space-y-4 animate-fade-in pb-12">
            {notifications.map((cat) => {
              const isCollapsed = collapsedCategoryIds.includes(cat.id);
              return (
                <div 
                  key={cat.id} 
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Category Header */}
                  <div 
                    onClick={() => toggleCollapseCategory(cat.id)}
                    className="p-4 bg-white hover:bg-slate-50/80 cursor-pointer flex items-center justify-between border-b border-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-600 rounded-full" />
                      <span className="font-extrabold text-slate-800 text-sm">{cat.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} />
                  </div>

                  {/* Category Table Content */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-extrabold text-[11px]">
                            <th className="py-3 px-5 w-44">消息类型</th>
                            <th className="py-3 px-5">触发场景</th>
                            <th className="py-3 px-5 w-64">接收对象</th>
                            <th className="py-3 px-5 w-28 text-center">站内消息</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                            {cat.items.map((item) => {
                              return (
                                <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                                  <td className="py-3.5 px-5 font-bold text-slate-900">{item.title}</td>
                                  <td className="py-3.5 px-5 text-slate-500 text-xs">
                                    <span>{item.description}</span>
                                  </td>
                                  <td className="py-3.5 px-5 text-slate-600 text-xs">{item.recipients}</td>
                                  <td className="py-3.5 px-5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleEnable(cat.id, item.id)}
                                      title={item.enabled ? "关闭站内消息" : "开启站内消息"}
                                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        item.enabled ? "bg-purple-600" : "bg-slate-200"
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                          item.enabled ? "translate-x-4" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Floating/Sticky Actions */}
            <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg flex items-center justify-between text-xs mt-6">
              <span className="text-slate-400 font-medium">
                修改后，点击右侧【保存设置】即可生效
              </span>
              <button
                type="button"
                onClick={handleSaveNotificationSettings}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>保存设置</span>
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------------- */}
        {/* TAB 10: 用户                                                                 */}
        {/* --------------------------------------------------------------------------- */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索成员姓名 / 手机号 / 角色..."
                  value={userSearchKey}
                  onChange={(e) => setUserSearchKey(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>新增系统用户</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">用户</th>
                    <th className="py-2.5 px-3">手机号</th>
                    <th className="py-2.5 px-3">所属部门</th>
                    <th className="py-2.5 px-3">分配角色</th>
                    <th className="py-2.5 px-3">注册日期</th>
                    <th className="py-2.5 px-3">账号状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                          <span className="font-bold text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{u.phone}</td>
                      <td className="py-3 px-3 text-slate-600">{u.dept}</td>
                      <td className="py-3 px-3 font-bold text-purple-700">{u.role}</td>
                      <td className="py-3 px-3 text-slate-400">{u.time}</td>
                      <td className="py-3 px-3">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={u.status}
                            onChange={() => toggleUserStatus(u.id)}
                            className="accent-[#7C3AED] rounded"
                          />
                          <span className={u.status ? "text-emerald-600 font-bold" : "text-slate-400"}>
                            {u.status ? "启用" : "已禁用"}
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: 部门 / 分组 */}
      {deptModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
              <h3 className="flex items-center gap-2 text-sm font-black"><FolderPlus className="h-4 w-4 text-purple-400" />{deptModal.mode === "add" ? `新增${deptForm.levelType === "group" ? "分组" : "部门"}` : `编辑${deptForm.levelType === "group" ? "分组" : "部门"}配置`}</h3>
              <button type="button" onClick={() => setDeptModal(null)} title="关闭" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-4 p-6 text-xs">
              {deptModal.data?.id !== "dept_root" && (
                <div>
                  <label className="mb-1 block font-bold text-slate-500">架构节点类型</label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 font-bold">
                    <button type="button" onClick={() => setDeptForm({ ...deptForm, levelType: "department", parentId: "dept_root" })} className={`rounded-lg py-2 ${deptForm.levelType === "department" ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-white"}`}>部门</button>
                    <button type="button" onClick={() => setDeptForm({ ...deptForm, levelType: "group", parentId: depts.find(d => d.parentId === "dept_root" && d.id !== "dept_root")?.id || "dept_root" })} className={`rounded-lg py-2 ${deptForm.levelType === "group" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white"}`}>分组</button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1"><span className="block font-bold text-slate-500">{deptForm.levelType === "group" ? "分组名称" : "部门名称"} *</span><input required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500" /></label>
                <label className="space-y-1"><span className="block font-bold text-slate-500">编号</span><input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-purple-500" /></label>
              </div>
              <label className="block space-y-1"><span className="block font-bold text-slate-500">上级归属节点</span>{deptForm.levelType === "department" ? <span className="block rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 font-bold">梦畅AIGC（最高公司）</span> : <select value={deptForm.parentId} onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500">{depts.filter(d => d.parentId === "dept_root" && d.id !== "dept_root" && d.id !== deptModal.data?.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1"><span className="block font-bold text-slate-500">负责人</span><input value={deptForm.manager} onChange={(e) => setDeptForm({ ...deptForm, manager: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-purple-500" /></label>
                <label className="space-y-1"><span className="block font-bold text-slate-500">联系电话</span><input value={deptForm.phone} onChange={(e) => setDeptForm({ ...deptForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-purple-500" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1"><span className="block font-bold text-slate-500">职责类型</span><select value={deptForm.type} onChange={(e) => setDeptForm({ ...deptForm, type: e.target.value as DeptNode["type"] })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500"><option value="综合部门">综合部门</option><option value="内容部门">内容部门</option><option value="投放部门">投放部门</option><option value="投放组">投放组</option><option value="剪辑组">剪辑组</option><option value="编导组">编导组</option><option value="直播组">直播组</option></select></label>
                <label className="space-y-1"><span className="block font-bold text-slate-500">编制数上限</span><input type="number" min={1} value={deptForm.quota} onChange={(e) => setDeptForm({ ...deptForm, quota: Number(e.target.value) || 1 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-purple-500" /></label>
              </div>
              <label className="block space-y-1"><span className="block font-bold text-slate-500">职责简述</span><textarea rows={3} value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-purple-500" /></label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setDeptModal(null)} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800">取消</button><button type="submit" className="rounded-xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-700">保存配置</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 人员账号 */}
      {memberModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-900 px-5 py-4 text-white"><h3 className="flex items-center gap-2 text-sm font-black"><UserPlus className="h-4 w-4 text-purple-400" />{memberModal.mode === "add" ? "录入人员账号" : "编辑成员资料与角色"}</h3><button type="button" onClick={() => setMemberModal(null)} title="关闭" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSaveMember} className="space-y-4 p-6 text-xs">
              <div className="grid grid-cols-2 gap-3"><label className="space-y-1"><span className="block font-bold text-slate-500">真实姓名 *</span><input required value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500" /></label><label className="space-y-1"><span className="block font-bold text-slate-500">工号</span><input value={memberForm.employeeNo} onChange={(e) => setMemberForm({ ...memberForm, employeeNo: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-purple-500" /></label></div>
              <div className="grid grid-cols-2 gap-3"><label className="space-y-1"><span className="block font-bold text-slate-500">手机号码 *</span><input required value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-purple-500" /></label><label className="space-y-1"><span className="block font-bold text-slate-500">工作邮箱</span><input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-purple-500" /></label></div>
              <div className="grid grid-cols-2 gap-3"><label className="space-y-1"><span className="block font-bold text-slate-500">所属部门 *</span><select value={memberForm.selectedDeptId} onChange={(e) => handleMemberDeptChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500">{depts.filter(d => d.id === "dept_root" || d.parentId === "dept_root" || d.levelType === "department" || d.levelType === "company").map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label className="space-y-1"><span className="block font-bold text-slate-500">所属分组</span><select value={memberForm.selectedGroupId} onChange={(e) => handleMemberGroupChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500"><option value="">不指定分组</option>{depts.filter(d => d.parentId === memberForm.selectedDeptId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label></div>
              <div className="grid grid-cols-2 gap-3"><label className="space-y-1"><span className="block font-bold text-slate-500">绑定岗位角色</span><select value={memberForm.roleId} onChange={(e) => setMemberForm({ ...memberForm, roleId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500">{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label className="space-y-1"><span className="block font-bold text-slate-500">账号状态</span><select value={memberForm.status} onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as AccountMember["status"] })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold outline-none focus:border-purple-500"><option value="normal">正常启用</option><option value="bound">账号绑定</option><option value="pending">待激活</option><option value="disabled">已停用</option></select></label></div>
              {memberForm.status === "bound" && <label className="block space-y-1 rounded-xl border border-purple-200 bg-purple-50 p-3"><span className="block font-bold text-purple-800">绑定广告/媒体账号</span><select value={memberForm.boundAccount} onChange={(e) => setMemberForm({ ...memberForm, boundAccount: e.target.value })} className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 font-bold"><option value="巨量千川-千川主账号01 (1776342461268999)">巨量千川 - 千川主账号01</option><option value="巨量千川-服装旗舰店账号 (1776342461268888)">巨量千川 - 服装旗舰店账号</option><option value="抖音官方蓝V-美妆爆款运营账户">抖音官方蓝V - 美妆爆款运营账户</option></select></label>}
              <label className="block space-y-1"><span className="block font-bold text-slate-500">备注</span><textarea rows={2} value={memberForm.remark} onChange={(e) => setMemberForm({ ...memberForm, remark: e.target.value })} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-purple-500" /></label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">{memberModal.mode === "add" ? <>新账号默认登录密码为 <code className="font-bold text-purple-700">{DEFAULT_PLATFORM_PASSWORD}</code></> : <button type="button" onClick={() => { const member = memberModal.data; setMemberModal(null); if (member) handleOpenResetPassword(member); }} className="flex items-center gap-1 font-bold text-amber-700"><Key className="h-3.5 w-3.5" />重置该成员登录密码</button>}</div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setMemberModal(null)} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800">取消</button><button type="submit" className="rounded-xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-700">保存成员信息</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 重置密码 */}
      {resetPasswordModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white"><h3 className="flex items-center gap-2 text-sm font-black"><Key className="h-4 w-4 text-amber-400" />重置人员登录密码</h3><button type="button" onClick={() => setResetPasswordModal(null)} title="关闭" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-4 p-6 text-xs">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><img src={resetPasswordModal.member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"} alt={resetPasswordModal.member.name} className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" /><div><p className="font-extrabold text-slate-900">{resetPasswordModal.member.name}</p><p className="mt-1 text-[10px] text-slate-500">{resetPasswordModal.member.roleName} · {resetPasswordModal.member.phone}</p></div></div>
              <div className="space-y-2"><p className="font-bold text-slate-600">选择密码重置模式</p>{([['default', '恢复平台默认初始密码'], ['random', '随机生成 8 位高强度密码'], ['custom', '手动指定新密码']] as const).map(([value, label]) => <label key={value} className={`block cursor-pointer rounded-xl border p-3 ${resetPasswordModal.resetType === value ? "border-purple-300 bg-purple-50 text-purple-900" : "border-slate-200"}`}><span className="flex items-center gap-2 font-bold"><input type="radio" name="resetType" checked={resetPasswordModal.resetType === value} onChange={() => setResetPasswordModal({ ...resetPasswordModal, resetType: value, customPassword: value === "default" ? DEFAULT_PLATFORM_PASSWORD : "" })} className="accent-purple-600" />{label}</span>{value === "custom" && resetPasswordModal.resetType === "custom" && <input value={resetPasswordModal.customPassword} onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, customPassword: e.target.value })} placeholder="请输入 6~20 位新密码" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono outline-none focus:border-purple-500" />}</label>)}</div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={resetPasswordModal.notifyUser} onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, notifyUser: e.target.checked })} className="accent-purple-600" />通知该成员</label><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={resetPasswordModal.forceNextChange} onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, forceNextChange: e.target.checked })} className="accent-purple-600" />下次登录强制修改密码</label></div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setResetPasswordModal(null)} className="px-4 py-2 font-bold text-slate-500">取消</button><button type="button" onClick={handleConfirmResetPassword} className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-white hover:bg-amber-600">确认重置密码</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 快捷邀请 */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl"><div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white"><h3 className="flex items-center gap-2 text-sm font-black"><UserPlus className="h-4 w-4 text-purple-400" />生成专属邀请链接</h3><button type="button" onClick={() => setInviteModalOpen(false)} title="关闭" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"><X className="h-5 w-5" /></button></div><div className="space-y-4 p-6 text-xs"><label className="block space-y-1"><span className="block font-bold text-slate-500">预指派部门</span><select value={inviteDeptId} onChange={(e) => setInviteDeptId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold">{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label className="block space-y-1"><span className="block font-bold text-slate-500">预赋予角色</span><select value={inviteRoleId} onChange={(e) => setInviteRoleId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold">{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label className="block space-y-1 rounded-xl border border-purple-200 bg-purple-50 p-3"><span className="block font-bold text-purple-900">邀请链接（有效期 7 天）</span><input readOnly value={inviteLink} className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-mono text-[11px] text-purple-800" /></label><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setInviteModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">关闭</button><button type="button" onClick={handleCopyInviteLink} className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-700"><Copy className="h-3.5 w-3.5" />复制邀请链接</button></div></div></div>
        </div>
      )}

      {/* MODAL: 批量导入人员 */}
      {importModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl"><div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white"><h3 className="flex items-center gap-2 text-sm font-black"><Upload className="h-4 w-4 text-purple-400" />批量导入组织成员账号</h3><button type="button" onClick={() => setImportModalOpen(false)} title="关闭" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"><X className="h-5 w-5" /></button></div><div className="space-y-4 p-6 text-xs"><div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-600"><p className="font-sans font-bold text-slate-800">每行一个人，格式：</p><p className="mt-1 text-purple-700">姓名, 手机号, 角色, 邮箱</p></div><label className="block space-y-1"><span className="block font-bold text-slate-500">粘贴 CSV 数据</span><textarea rows={7} value={importCsvText} onChange={(e) => setImportCsvText(e.target.value)} placeholder={"张三, 13800001111, 投手, zhangsan@dreamchang.com\n李四, 13900002222, 剪辑, lisi@dreamchang.com"} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono outline-none focus:border-purple-500" /></label><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setImportModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">取消</button><button type="button" onClick={handleConfirmImportCsv} className="rounded-xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-700">解析并导入</button></div></div></div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: 新增/修改角色                                                         */}
      {/* --------------------------------------------------------------------------- */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {editingRoleId ? "修改角色" : "新增角色"}
              </h3>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">角色名称</label>
                <input
                  type="text"
                  value={roleFormName}
                  onChange={(e) => setRoleFormName(e.target.value)}
                  placeholder="如：特效高级剪辑师"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">角色描述</label>
                <textarea
                  value={roleFormDesc}
                  onChange={(e) => setRoleFormDesc(e.target.value)}
                  placeholder="说明该角色的业务定位与使用场景..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  className="px-4 py-1.5 bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  确认保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: 提醒规则修改模态框                                                   */}
      {/* --------------------------------------------------------------------------- */}
      {configModalItem && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                修改场景提醒规则【{configModalItem.title}】
              </h3>
              <button
                type="button"
                onClick={() => setConfigModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveConfigModal} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">场景提醒描述</label>
                <textarea
                  value={customDescInput}
                  onChange={(e) => setCustomDescInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfigModalItem(null)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  保存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: 当日消耗增长规则修改                                                 */}
      {/* --------------------------------------------------------------------------- */}
      {spendModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">修改【当日消耗增长】提醒阈值</h3>
              <button
                type="button"
                onClick={() => setSpendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">当日消耗金额大于 (¥)</label>
                <input
                  type="number"
                  value={spendValue}
                  onChange={(e) => setSpendValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">并且涨幅大于 (%)</label>
                <input
                  type="number"
                  value={growthValue}
                  onChange={(e) => setGrowthValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSpendModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveSpendConfig}
                  className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  确认修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* MODAL: 新增用户                                                             */}
      {/* --------------------------------------------------------------------------- */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">新增系统用户</h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">成员姓名</label>
                <input
                  type="text"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  placeholder="请输入真实姓名"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">手机号码</label>
                <input
                  type="text"
                  value={userFormPhone}
                  onChange={(e) => setUserFormPhone(e.target.value)}
                  placeholder="请输入11位手机号"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">所属部门</label>
                  <select
                    value={userFormDept}
                    onChange={(e) => setUserFormDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
                  >
                    <option value="剪辑1组">剪辑1组</option>
                    <option value="电商1组">电商1组</option>
                    <option value="品牌2组">品牌2组</option>
                    <option value="服装部">服装部</option>
                    <option value="家电部">家电部</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">分配角色</label>
                  <select
                    value={userFormRole}
                    onChange={(e) => setUserFormRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
                  >
                    <option value="超级管理员">超级管理员</option>
                    <option value="剪辑总监">剪辑总监</option>
                    <option value="普通剪辑师">普通剪辑师</option>
                    <option value="广告投放员">广告投放员</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="px-4 py-1.5 bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  提交新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
