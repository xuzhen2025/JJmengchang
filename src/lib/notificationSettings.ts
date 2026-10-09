export const NOTIFICATION_TYPES = [
  { id: "upload_success", category: "内容资源", name: "上传成功", trigger: "资源成功发布至资源库", recipients: "资源上传人" },
  { id: "upload_failed", category: "内容资源", name: "上传失败", trigger: "文件上传或发布失败", recipients: "资源上传人" },
  { id: "ai_completed", category: "内容资源", name: "AI生成完成", trigger: "AI生成任务完成", recipients: "任务发起人" },
  { id: "status_changed", category: "内容资源", name: "状态修改", trigger: "资源业务状态发生变化", recipients: "资源上传人或负责人" },
  { id: "mention", category: "内容资源", name: "批注与@提醒", trigger: "批注中@成员或回复批注", recipients: "被@成员或原批注人" },
  { id: "login_risk", category: "安全与系统", name: "异常登录", trigger: "登录环境被判定为异常", recipients: "账号本人及管理人员" },
  { id: "account_locked", category: "安全与系统", name: "账号锁定", trigger: "账号因安全规则被锁定", recipients: "账号本人及管理人员" },
  { id: "permission_changed", category: "安全与系统", name: "权限变更", trigger: "成员角色或权限发生变化", recipients: "受影响成员" },
  { id: "export_record", category: "安全与系统", name: "数据导出记录", trigger: "用户完成业务数据导出", recipients: "超级管理员及审计角色" },
  { id: "system_notice", category: "安全与系统", name: "系统公告", trigger: "管理员发布系统公告", recipients: "公告指定范围内成员" },
] as const;

export type NotificationTypeId = (typeof NOTIFICATION_TYPES)[number]["id"];
export type NotificationTypeName = (typeof NOTIFICATION_TYPES)[number]["name"];
export type NotificationSettings = Record<NotificationTypeId, boolean>;

export const MESSAGE_CATEGORY_CONFIGS = [
  {
    id: "resource",
    name: "内容资源",
    subcategories: NOTIFICATION_TYPES.filter((item) => item.category === "内容资源").map((item) => item.name),
  },
  {
    id: "security",
    name: "安全与系统",
    subcategories: NOTIFICATION_TYPES.filter((item) => item.category === "安全与系统").map((item) => item.name),
  },
] as const;

const STORAGE_KEY = "mengchang-notification-settings";
export const NOTIFICATION_SETTINGS_CHANGE = "mengchang-notification-settings-change";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = Object.fromEntries(
  NOTIFICATION_TYPES.map((item) => [item.id, true]),
) as NotificationSettings;

export function readNotificationSettings(): NotificationSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Partial<NotificationSettings>;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(NOTIFICATION_SETTINGS_CHANGE));
}

export function isNotificationTypeEnabled(name: NotificationTypeName) {
  const definition = NOTIFICATION_TYPES.find((item) => item.name === name);
  return definition ? readNotificationSettings()[definition.id] : false;
}
