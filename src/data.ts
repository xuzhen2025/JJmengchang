import { GalleryItem, Asset, Task, CreditTransaction, AppMessage, AiVideoMediaItem, WatermarkTaskSnapshot, EnhanceTaskSnapshot } from "./types";

export const MESSAGE_CATEGORY_CONFIGS = [
  { id: "approval", name: "审批待办", subcategories: ["积分申请"] },
  { id: "resource", name: "内容资源", subcategories: ["上传成功", "上传失败", "AI生成完成", "状态修改", "批注与@提醒"] },
  { id: "security", name: "安全与系统", subcategories: ["异常登录", "账号锁定", "权限变更", "数据导出记录", "系统公告"] },
] as const;

export const INITIAL_MESSAGES: AppMessage[] = [
  {
    id: "msg_init_credits_1",
    category: "审批待办",
    subcategory: "积分申请",
    type: "积分申请",
    title: "梁靖淇申请 500 积分，等待你的审批",
    detail: "申请人【梁靖淇】发起【500 积分】算力补给申请，请审批。关联项目：千川服装爆款视频批量生成。",
    status: "unread",
    time: "2026-08-19 10:15:20",
    isRedDot: true,
    summary: "申请人: 梁靖淇 | 申请积分: 500 | 审批部长: 张总 (品牌一部部长)",
    eventCode: "CREDIT_APPLICATION_SUBMITTED",
    template: "approval",
    severity: "warning",
    actorName: "梁靖淇",
    recipientNames: ["徐振"],
    sourceType: "积分申请单",
    sourceId: "CA-20260819-001",
    businessStatus: "待审批",
    approvalType: "credits",
    approvalStatus: "pending",
    applicantName: "梁靖淇",
    managerName: "张总 (品牌一部部长)",
    creditsAmount: 500,
    reason: "千川服装爆款视频批量生成与4K画质增强渲染",
    details: [
      { label: "申请人", value: "梁靖淇" },
      { label: "所属部门", value: "AIGC爆款内容拆解部" },
      { label: "申请积分数量", value: "500 积分" },
      { label: "审批部长/主管", value: "张总 (品牌一部部长)" },
      { label: "关联业务项目", value: "千川服装爆款视频批量生成" },
      { label: "申请原因用途", value: "千川服装爆款视频批量生成与4K画质增强渲染" },
      { label: "提交时间", value: "2026-08-19 10:15:20" },
      { label: "当前审核状态", value: "待审批" }
    ]
  },
  {
    id: "msg_task_new", category: "任务协作", subcategory: "新任务", type: "新任务",
    title: "王经理向你指派了新任务", detail: "任务《七夕美妆礼盒短视频》需要产出 3 条成片，请在 8 月 22 日前完成。",
    status: "unread", time: "2026-08-19 09:42:10", eventCode: "TASK_ASSIGNED", template: "task", severity: "info",
    actorName: "王经理（发布人）", recipientNames: ["徐振（执行人）"], sourceType: "任务", sourceId: "TASK-20260819-018", businessStatus: "待完成",
    actionLabel: "查看任务", actionScreen: "task_collaboration",
    details: [{ label: "任务名称", value: "七夕美妆礼盒短视频" }, { label: "任务要求", value: "3 条成片，比例 9:16，单条 20-30 秒" }, { label: "出片日期", value: "2026-08-22" }, { label: "优先级", value: "高" }]
  },
  {
    id: "msg_task_rescheduled", category: "任务协作", subcategory: "任务改期", type: "任务改期",
    title: "任务出片日期由 8 月 22 日调整为 8 月 21 日", detail: "王经理修改了《七夕美妆礼盒短视频》的出片日期，请重新安排制作计划。",
    status: "unread", time: "2026-08-19 09:18:32", eventCode: "TASK_DUE_DATE_CHANGED", template: "task", severity: "warning",
    actorName: "王经理（发布人）", recipientNames: ["徐振（执行人）"], sourceType: "任务", sourceId: "TASK-20260819-018", businessStatus: "制作中",
    actionLabel: "查看变更", actionScreen: "task_collaboration",
    details: [{ label: "任务名称", value: "七夕美妆礼盒短视频" }, { label: "原出片日期", value: "2026-08-22" }, { label: "新出片日期", value: "2026-08-21" }, { label: "改期说明", value: "直播预热计划提前一天" }]
  },
  {
    id: "msg_task_work_linked", category: "任务协作", subcategory: "关联作品", type: "关联作品",
    title: "徐振为任务关联了 2 条新成片", detail: "任务《七夕美妆礼盒短视频》当前已关联 2/3 条所需作品。",
    status: "unread", time: "2026-08-19 08:56:05", eventCode: "TASK_WORK_LINKED", template: "task", severity: "success",
    actorName: "徐振（执行人）", recipientNames: ["王经理（发布人）"], sourceType: "任务", sourceId: "TASK-20260819-018", businessStatus: "2/3 条已完成",
    actionLabel: "查看关联作品", actionScreen: "task_collaboration",
    details: [{ label: "关联作品", value: "水光针去黄测评、复古耳环动态奢感视频" }, { label: "作品数量", value: "新增 2 条，累计 2/3 条" }, { label: "执行人", value: "徐振" }],
    relatedResources: [
      { id: "110332275", name: "0730-8836-水光针去黄测评-爆款对比.mp4", type: "成片" },
      { id: "110332274", name: "0730-8835-鲁月园-复古耳环动态奢感视频.mp4", type: "成片" }
    ]
  },
  {
    id: "msg_task_script_linked", category: "任务协作", subcategory: "关联脚本", type: "关联脚本",
    title: "徐振为任务关联了脚本", detail: "任务《七夕美妆礼盒短视频》已关联脚本《脚本 1 - 口播温和洁面破圈案》。",
    status: "read", time: "2026-08-18 18:24:46", eventCode: "TASK_SCRIPT_LINKED", template: "task", severity: "info",
    actorName: "徐振（执行人）", recipientNames: ["王经理（发布人）"], sourceType: "任务", sourceId: "TASK-20260819-018", businessStatus: "制作中",
    actionLabel: "查看关联脚本", actionScreen: "task_collaboration",
    details: [{ label: "脚本名称", value: "脚本 1 - 口播温和洁面破圈案" }, { label: "脚本编号", value: "SCRIPT-88216" }, { label: "关联人", value: "徐振" }],
    relatedResources: [{ id: "SCRIPT-88216", name: "脚本 1 - 口播温和洁面破圈案", type: "脚本" }]
  },
  {
    id: "msg_task_completed", category: "任务协作", subcategory: "任务完成", type: "任务完成",
    title: "任务所需 3 条作品已全部上传", detail: "徐振已完成《夏季防晒返场素材》的全部作品上传，任务自动标记为已达标。",
    status: "unread", time: "2026-08-18 16:35:18", eventCode: "TASK_TARGET_REACHED", template: "task", severity: "success",
    actorName: "徐振（执行人）", recipientNames: ["王经理（发布人）"], sourceType: "任务", sourceId: "TASK-20260816-009", businessStatus: "已达标",
    actionLabel: "验收任务", actionScreen: "task_collaboration",
    details: [{ label: "任务名称", value: "夏季防晒返场素材" }, { label: "完成情况", value: "3/3 条作品" }, { label: "完成时间", value: "2026-08-18 16:35:18" }],
    relatedResources: [
      { id: "110332276", name: "0730-8837-防晒冰丝T恤冷感微距分镜.mp4", type: "成片" },
      { id: "110332277", name: "0730-8838-不粘锅真实口播展示.mp4", type: "成片" },
      { id: "IMG-42029245", name: "防晒植物提取精华液展图.jpg", type: "图片" }
    ]
  },
  {
    id: "msg_task_overdue", category: "任务协作", subcategory: "任务逾期", type: "任务逾期",
    title: "任务已逾期 18 小时", detail: "《家居收纳直播切片》应于 8 月 18 日 18:00 完成，目前仅上传 1/4 条作品。",
    status: "unread", time: "2026-08-19 12:00:00", eventCode: "TASK_OVERDUE", template: "task", severity: "danger",
    actorName: "系统", recipientNames: ["陈主管（发布人）", "李剪辑（执行人）"], sourceType: "任务", sourceId: "TASK-20260815-006", businessStatus: "已逾期",
    actionLabel: "查看任务", actionScreen: "task_collaboration",
    details: [{ label: "计划出片时间", value: "2026-08-18 18:00" }, { label: "当前进度", value: "1/4 条作品" }, { label: "逾期时长", value: "18 小时" }]
  },
  {
    id: "msg_upload_success", category: "内容资源", subcategory: "上传成功", type: "上传成功",
    title: "成片《0730-8839-高弹透气提臀内裤走秀实拍.mp4》上传成功", detail: "文件已完成上传与转码，可在成片区查看和继续编辑。",
    status: "unread", time: "2026-08-19 11:28:16", eventCode: "RESOURCE_UPLOAD_SUCCEEDED", template: "resource", severity: "success",
    actorName: "系统", recipientNames: ["徐振（上传人）"], sourceType: "成片", sourceId: "110332278", businessStatus: "可用",
    actionLabel: "查看成片", actionScreen: "resources",
    details: [{ label: "文件名称", value: "0730-8839-高弹透气提臀内裤走秀实拍.mp4" }, { label: "文件规格", value: "1080x1920 / 24.6 MB / 00:26" }, { label: "上传位置", value: "资源库 / 成片 / 女装" }],
    relatedResources: [{ id: "110332278", name: "0730-8839-高弹透气提臀内裤走秀实拍.mp4", type: "成片" }]
  },
  {
    id: "msg_upload_failed", category: "内容资源", subcategory: "上传失败", type: "上传失败",
    title: "素材《主直播间全景_4K.mov》上传失败", detail: "网络中断导致文件分片校验失败，原文件未入库，可重新上传。",
    status: "unread", time: "2026-08-19 11:02:43", eventCode: "RESOURCE_UPLOAD_FAILED", template: "resource", severity: "danger",
    actorName: "系统", recipientNames: ["张摄影（上传人）"], sourceType: "素材", sourceId: "UPLOAD-20260819-091", businessStatus: "上传失败",
    actionLabel: "重新上传", actionScreen: "resources",
    details: [{ label: "失败阶段", value: "第 18/24 个分片上传" }, { label: "失败原因", value: "网络中断，分片校验失败" }, { label: "建议处理", value: "确认网络稳定后重新上传原文件" }]
  },
  {
    id: "msg_ai_completed", category: "内容资源", subcategory: "AI生成完成", type: "AI生成完成",
    title: "AI 视频任务已生成 6 条结果", detail: "《玫瑰精华七夕氛围视频》生成完成，结果已保存到资源库。",
    status: "unread", time: "2026-08-19 10:46:20", eventCode: "AI_GENERATION_COMPLETED", template: "resource", severity: "success",
    actorName: "AI生成服务", recipientNames: ["徐振（发起人）"], sourceType: "AI生成任务", sourceId: "AI-VIDEO-20260819-026", businessStatus: "已完成",
    actionLabel: "查看生成结果", actionScreen: "ai_video",
    details: [{ label: "任务名称", value: "玫瑰精华七夕氛围视频" }, { label: "生成结果", value: "成功 6 条，失败 0 条" }, { label: "积分消耗", value: "60 积分" }, { label: "保存位置", value: "资源库 / 成片 / AI生成结果" }],
    relatedResources: [
      { id: "110332274", name: "0730-8835-鲁月园-复古耳环动态奢感视频.mp4", type: "成片" },
      { id: "110332275", name: "0730-8836-水光针去黄测评-爆款对比.mp4", type: "成片" },
      { id: "110332276", name: "0730-8837-防晒冰丝T恤冷感微距分镜.mp4", type: "成片" },
      { id: "110332277", name: "0730-8838-不粘锅真实口播展示.mp4", type: "成片" },
      { id: "110332278", name: "0730-8839-高弹透气提臀内裤走秀实拍.mp4", type: "成片" },
      { id: "110332279", name: "0730-8840-极简美肤衣无感贴合对比镜头.mp4", type: "成片" }
    ]
  },
  {
    id: "msg_status_changed", category: "内容资源", subcategory: "状态修改", type: "状态修改",
    title: "成片状态由“待修改”更新为“可投放”", detail: "王编导修改了《0730-8841-保暖内衣发热纤维实验展示.mp4》的业务状态。",
    status: "read", time: "2026-08-18 15:20:14", eventCode: "RESOURCE_STATUS_CHANGED", template: "resource", severity: "info",
    actorName: "王编导", recipientNames: ["徐振（上传人）"], sourceType: "成片", sourceId: "110332280", businessStatus: "可投放",
    actionLabel: "查看成片", actionScreen: "resources",
    details: [{ label: "状态变化", value: "待修改 -> 可投放" }, { label: "修改说明", value: "字幕与品牌露出已按意见调整" }, { label: "修改人", value: "王编导" }],
    relatedResources: [{ id: "110332280", name: "0730-8841-保暖内衣发热纤维实验展示.mp4", type: "成片" }]
  },
  {
    id: "msg_mention", category: "内容资源", subcategory: "批注与@提醒", type: "批注与@提醒",
    title: "王编导在视频批注中 @了你", detail: "“00:08 这里的商品特写再延长 1 秒，转场不要使用闪白。”",
    status: "unread", time: "2026-08-19 10:08:55", eventCode: "RESOURCE_MENTIONED", template: "resource", severity: "warning",
    actorName: "王编导", recipientNames: ["徐振（被@人）"], sourceType: "成片批注", sourceId: "ANNOTATION-72018", businessStatus: "待处理",
    actionLabel: "查看批注", actionScreen: "resources",
    details: [{ label: "关联成片", value: "0730-8842-秒缇8024前扣内衣搭扣方便性演示.mp4" }, { label: "时间锚点", value: "00:08" }, { label: "批注内容", value: "商品特写再延长 1 秒，转场不要使用闪白" }],
    relatedResources: [{ id: "110332281", name: "0730-8842-秒缇8024前扣内衣搭扣方便性演示.mp4", type: "成片" }]
  },
  {
    id: "msg_live_schedule", category: "直播", subcategory: "新增排班", type: "新增排班",
    title: "你被安排参加 8 月 20 日直播", detail: "梦畅美妆主直播间新增 09:00-13:00 场次，你的岗位为主播。",
    status: "unread", time: "2026-08-19 09:36:00", eventCode: "LIVE_SHIFT_CREATED", template: "live", severity: "info",
    actorName: "徐振（排班人）", recipientNames: ["徐云卿", "谭明珠", "冯浩伦"], sourceType: "直播场次", sourceId: "SHIFT-20260820-001", businessStatus: "待开播",
    actionLabel: "查看排班", actionScreen: "live_management",
    details: [{ label: "直播间", value: "梦畅美妆主直播间" }, { label: "直播时间", value: "2026-08-20 09:00-13:00" }, { label: "参与人员", value: "徐云卿（主播）、谭明珠（助播）、冯浩伦（场控）" }]
  },
  {
    id: "msg_live_changed", category: "直播", subcategory: "排班调整", type: "排班调整",
    title: "直播开始时间调整为 10:00", detail: "8 月 20 日梦畅美妆主直播间的开播时间由 09:00 调整为 10:00。",
    status: "unread", time: "2026-08-19 09:40:26", eventCode: "LIVE_SHIFT_CHANGED", template: "live", severity: "warning",
    actorName: "徐振（排班人）", recipientNames: ["徐云卿", "谭明珠", "冯浩伦"], sourceType: "直播场次", sourceId: "SHIFT-20260820-001", businessStatus: "已调整",
    actionLabel: "查看新排班", actionScreen: "live_management",
    details: [{ label: "调整内容", value: "09:00-13:00 -> 10:00-14:00" }, { label: "调整原因", value: "商品样品到场时间延迟" }, { label: "受影响人员", value: "徐云卿、谭明珠、冯浩伦" }]
  },
  {
    id: "msg_live_cancelled", category: "直播", subcategory: "取消场次", type: "取消场次",
    title: "8 月 19 日晚间返场直播已取消", detail: "梦畅服饰主直播间 20:00-23:00 场次已取消，相关人员无需到场。",
    status: "read", time: "2026-08-18 17:12:02", eventCode: "LIVE_SHIFT_CANCELLED", template: "live", severity: "danger",
    actorName: "梁主管（排班人）", recipientNames: ["梁清淇", "李助播", "周场控"], sourceType: "直播场次", sourceId: "SHIFT-20260819-008", businessStatus: "已取消",
    actionLabel: "查看排班记录", actionScreen: "live_management",
    details: [{ label: "原直播时间", value: "2026-08-19 20:00-23:00" }, { label: "取消原因", value: "主推商品临时下架" }, { label: "受影响人员", value: "梁清淇、李助播、周场控" }]
  },
  {
    id: "msg_live_reminder", category: "直播", subcategory: "开播提醒", type: "开播提醒",
    title: "距离开播还有 30 分钟", detail: "七夕美妆礼盒专场将在 09:30 开播，请相关人员完成设备与商品检查。",
    status: "unread", time: "2026-08-19 09:00:00", eventCode: "LIVE_START_REMINDER", template: "live", severity: "warning",
    actorName: "系统", recipientNames: ["徐云卿", "谭明珠", "冯浩伦"], sourceType: "直播场次", sourceId: "LIVE-10086", businessStatus: "即将开播",
    actionLabel: "进入直播管理", actionScreen: "live_management",
    details: [{ label: "直播间", value: "梦畅美妆主直播间" }, { label: "直播主题", value: "七夕美妆礼盒专场" }, { label: "计划开播", value: "2026-08-19 09:30" }, { label: "准备事项", value: "设备检查、商品上架、直播脚本确认" }]
  },
  {
    id: "msg_login_risk", category: "安全与系统", subcategory: "异常登录", type: "异常登录",
    title: "检测到新的异地登录", detail: "你的账号于北京市通过一台新设备登录，如非本人操作请立即处理。",
    status: "unread", time: "2026-08-19 07:42:36", eventCode: "SECURITY_ABNORMAL_LOGIN", template: "security", severity: "danger",
    actorName: "安全中心", recipientNames: ["徐振"], sourceType: "登录记录", sourceId: "LOGIN-20260819-006", businessStatus: "待确认",
    actionLabel: "查看安全建议",
    details: [{ label: "登录时间", value: "2026-08-19 07:42:36" }, { label: "登录地点", value: "北京市" }, { label: "IP 地址", value: "220.181.108.91" }, { label: "设备", value: "Safari 17.5 / iPhone" }]
  },
  {
    id: "msg_account_locked", category: "安全与系统", subcategory: "账号锁定", type: "账号锁定",
    title: "账号因连续输错密码被临时锁定", detail: "账号 zhangxiaomei 连续 5 次登录失败，已锁定 30 分钟并通知管理员。",
    status: "unread", time: "2026-08-18 22:16:09", eventCode: "SECURITY_ACCOUNT_LOCKED", template: "security", severity: "danger",
    actorName: "安全中心", recipientNames: ["张小梅", "徐振（管理员）"], sourceType: "用户账号", sourceId: "USER-U-2", businessStatus: "已锁定",
    actionLabel: "查看处理建议",
    details: [{ label: "锁定账号", value: "zhangxiaomei" }, { label: "锁定原因", value: "连续 5 次密码错误" }, { label: "自动解锁时间", value: "2026-08-18 22:46:09" }]
  },
  {
    id: "msg_permission_changed", category: "安全与系统", subcategory: "权限变更", type: "权限变更",
    title: "你的角色权限已更新", detail: "管理员将你的角色由“剪辑师”调整为“高级剪辑师”，新增成片状态修改权限。",
    status: "read", time: "2026-08-18 14:30:00", eventCode: "SECURITY_PERMISSION_CHANGED", template: "security", severity: "info",
    actorName: "徐振（管理员）", recipientNames: ["张小梅"], sourceType: "角色权限", sourceId: "ROLE-EDITOR-SENIOR", businessStatus: "已生效",
    actionLabel: "查看变更内容",
    details: [{ label: "原角色", value: "剪辑师" }, { label: "新角色", value: "高级剪辑师" }, { label: "新增权限", value: "修改成片状态、批量添加标签" }, { label: "生效时间", value: "2026-08-18 14:30:00" }]
  },
  {
    id: "msg_export_audit_normal", category: "安全与系统", subcategory: "数据导出记录", type: "数据导出记录",
    title: "张小梅导出了任务进度报表", detail: "张小梅导出电商事业部近 30 天任务进度数据，共 286 条，系统已留存审计记录。",
    status: "read", time: "2026-08-19 08:26:18", eventCode: "DATA_EXPORT_AUDIT_RECORDED", template: "security", severity: "info",
    actorName: "张小梅（剪辑组长）", recipientNames: ["徐振（超级管理员）", "王敏（安全审计员）"], sourceType: "导出审计", sourceId: "EXPORT-20260819-032", businessStatus: "正常",
    actionLabel: "查看审计记录",
    details: [
      { label: "导出人员", value: "张小梅 / 电商事业部 / 剪辑组长" },
      { label: "导出时间", value: "2026-08-19 08:26:18" },
      { label: "导出数据", value: "任务协作 - 任务进度报表" },
      { label: "筛选范围", value: "电商事业部；2026-07-20 至 2026-08-18；全部任务状态" },
      { label: "数据量与格式", value: "286 条 / XLSX / 1.8 MB" },
      { label: "导出用途", value: "部门周会任务复盘" },
      { label: "操作环境", value: "IP 10.16.8.24 / Microsoft Edge 140 / Windows 11" },
      { label: "风险等级", value: "普通；未包含手机号、财务金额等敏感字段" }
    ]
  },
  {
    id: "msg_export_audit_risk", category: "安全与系统", subcategory: "数据导出记录", type: "数据导出记录",
    title: "李强导出大量广告主财务数据", detail: "李强一次性导出全部广告主近 180 天消耗与成交数据，共 48,632 条，已触发敏感大批量导出提醒。",
    status: "unread", time: "2026-08-19 08:03:42", eventCode: "SENSITIVE_DATA_EXPORT_ALERT", template: "security", severity: "danger",
    actorName: "李强（广告投放员）", recipientNames: ["徐振（超级管理员）", "王敏（安全审计员）"], sourceType: "导出审计", sourceId: "EXPORT-20260819-029", businessStatus: "待核查",
    actionLabel: "核查导出行为",
    details: [
      { label: "导出人员", value: "李强 / 电商一组 / 广告投放员" },
      { label: "导出时间", value: "2026-08-19 08:03:42" },
      { label: "导出数据", value: "广告投放 - 广告主消耗、成交金额、账户余额明细" },
      { label: "筛选范围", value: "全部广告主；2026-02-20 至 2026-08-18；包含已停用账户" },
      { label: "数据量与格式", value: "48,632 条 / CSV / 36.7 MB" },
      { label: "导出用途", value: "未填写" },
      { label: "操作环境", value: "IP 183.6.102.41（深圳市）/ Chrome 139 / macOS" },
      { label: "风险等级", value: "高；跨部门、全量、包含财务字段，需管理员核查" },
      { label: "建议处理", value: "确认业务用途；必要时冻结下载链接并复核该用户数据权限" }
    ]
  },
  {
    id: "msg_system_notice", category: "安全与系统", subcategory: "系统公告", type: "系统公告",
    title: "8 月 21 日凌晨进行系统维护", detail: "平台将在 02:00-03:00 进行存储升级，期间上传与AI生成任务将暂停提交。",
    status: "read", time: "2026-08-18 10:00:00", eventCode: "SYSTEM_MAINTENANCE_NOTICE", template: "security", severity: "warning",
    actorName: "平台运营", recipientNames: ["全体用户"], sourceType: "系统公告", sourceId: "NOTICE-20260818-001", businessStatus: "待执行",
    details: [{ label: "维护时间", value: "2026-08-21 02:00-03:00" }, { label: "影响功能", value: "资源上传、AI视频、爆款复刻" }, { label: "不受影响", value: "资源浏览、任务查看、直播数据查看" }]
  }
].filter(
  (message) =>
    message.category !== "任务协作" &&
    message.category !== "直播" &&
    message.actionScreen !== "task_collaboration" &&
    message.actionScreen !== "live_management" &&
    message.actionScreen !== "ai_video",
) as AppMessage[];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: "g1",
    title: "极简日系高奢美妆主视觉视频",
    author: "Mika_Design",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80",
    likes: 1240,
    views: 8900,
    category: "视频",
    duration: "12s",
    prompt: "A bottle of luxury cosmetic serum on a minimalist beige sand surface, soft studio lighting, organic shadows, high-end editorial product video",
    tags: ["美妆", "日化", "极简高奢", "大理石晨光"]
  },
  {
    id: "g2",
    title: "时尚轻奢真丝吊带裙换装视频",
    author: "电商爆款制造机",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=800&auto=format&fit=crop&q=80",
    likes: 852,
    views: 12400,
    category: "视频",
    duration: "10s",
    prompt: "An elegant female model wearing a luxurious champagne silk slip dress, walking gracefully in a sunlit neutral modern apartment",
    tags: ["女装", "轻奢", "真丝材质", "模特换衣", "爆款推流"]
  },
  {
    id: "g3",
    title: "多功能不粘锅户外场景画质增强",
    author: "Chef_Creative",
    authorAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-vegetables-cooking-in-a-pan-40502-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80",
    likes: 412,
    views: 3100,
    category: "视频",
    duration: "15s",
    prompt: "Vegetables sizzling in a premium non-stick pan, steam rising, professional food commercial lighting, macro view",
    tags: ["厨具", "美食带货", "户外烹饪", "高清重设", "大理石温和"]
  },
  {
    id: "g4",
    title: "智能运动手表多机位动态展示视频",
    author: "Tech_Reviewer",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-smart-watch-with-black-screen-40503-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    likes: 981,
    views: 6540,
    category: "视频",
    duration: "8s",
    prompt: "Premium smart wristwatch on a dark dynamic cyber background with circular light neon rings, hyperrealistic 3D render movie",
    tags: ["数码配件", "智能穿戴", "科技霓虹", "多机位渲染", "3D质感"]
  },
  {
    id: "g5",
    title: "法式复古高帮帆布鞋户外场景视频",
    author: "SoleMate",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-running-shoes-being-tied-41711-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    likes: 1540,
    views: 11000,
    category: "视频",
    duration: "15s",
    prompt: "Retro canvas sneakers on a charming Parisian stone street, sunbeams filtering through autumn leaves, commercial layout",
    tags: ["鞋履", "复古经典", "场景化套图", "法式街头", "爆款详情"]
  },
  {
    id: "g6",
    title: "奢华金箔高脚杯澄澈饮品倾倒视频",
    author: "Mika_Design",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-pouring-orange-juice-into-a-glass-41712-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80",
    likes: 672,
    views: 4200,
    category: "视频",
    duration: "10s",
    prompt: "Gold rimmed luxury glass filling with sparkling orange beverage, caustics light effect, exquisite tabletop styling",
    tags: ["餐饮玻璃", "金箔奢华", "光影折射", "Caustics特效", "餐桌美学"]
  }
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: "a1",
    name: "雅诗兰黛精华空瓶_主图主体.png",
    type: "image",
    url: "./assets/prototype/skincare-product.jpg",
    size: "1.2 MB",
    createdAt: "2026-08-19 14:20",
    category: "商品主图",
    resourceCategory: "图片",
    source: "resource_library",
    creator: "徐振",
    publicTags: ["美妆护肤", "产品名称", "白底图"],
    status: "已通过"
  },
  {
    id: "a2",
    name: "智能蓝牙音箱白色_高对比度.png",
    type: "image",
    url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=80",
    size: "980 KB",
    createdAt: "2026-08-18 15:30",
    category: "商品场景图",
    resourceCategory: "图片",
    source: "resource_library",
    creator: "徐振",
    publicTags: ["数码家电", "产品名称", "高对比度"],
    status: "待审核"
  },
  {
    id: "a3",
    name: "模特红裙走秀素材_原图.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
    size: "18.4 MB",
    createdAt: "2026-08-17 11:15",
    category: "模特实拍",
    resourceCategory: "素材",
    source: "resource_library",
    creator: "徐振",
    publicTags: ["女装", "模特", "走秀"],
    coverUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80",
    status: "已通过"
  },
  {
    id: "a4",
    name: "七夕美妆礼盒_送礼场景成片_V3.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
    size: "42.6 MB",
    createdAt: "2026-08-20 10:36",
    category: "商品成片",
    resourceCategory: "成片",
    source: "resource_library",
    creator: "徐振",
    publicTags: ["美妆护肤", "七夕", "礼赠场景"],
    status: "待审核"
  },
  {
    id: "a5",
    name: "秋季风衣通勤版女声旁白.wav",
    type: "audio",
    url: "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3",
    size: "5.8 MB",
    createdAt: "2026-08-19 16:08",
    category: "真人配音",
    resourceCategory: "音频",
    source: "resource_library",
    creator: "徐振",
    publicTags: ["女装", "女声", "轻快"],
    status: "已通过",
    fileInfo: {
      size: "5.8 MB",
      resolution: "48kHz / 24bit",
      duration: "00:32",
      format: "WAV"
    }
  },
  {
    id: "a6",
    name: "防晒冰袖户外实测口播脚本.docx",
    type: "document",
    url: "data:text/plain;charset=utf-8,%E9%98%B2%E6%99%92%E5%86%B0%E8%A2%96%E6%88%B7%E5%A4%96%E5%AE%9E%E6%B5%8B%E5%8F%A3%E6%92%AD%E8%84%9A%E6%9C%AC",
    size: "86 KB",
    createdAt: "2026-08-18 09:42",
    category: "口播种草",
    resourceCategory: "脚本",
    source: "resource_library",
    creator: "徐振",
    publicTags: ["户外用品", "防晒", "实测对比"],
    status: "可以拍摄"
  },
  {
    id: "a7",
    name: "AI生成_精华液晨间护肤场景.png",
    type: "image",
    url: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80",
    size: "2.3 MB",
    createdAt: "2026-08-20 15:10",
    category: "AI商品场景图",
    resourceCategory: "图片",
    source: "ai_generation",
    creator: "徐振",
    publicTags: ["美妆护肤", "晨间场景", "AI生成"],
    status: "未审核"
  }
];

const AI_VIDEO_DEMO_RESULT_URL = "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4";
const AI_VIDEO_DEMO_MEDIA: Record<string, AiVideoMediaItem> = {
  skincareSet: { id: "stock-1", name: "轻奢护肤礼盒主图.jpg", type: "image", url: "./assets/prototype/luxury-skincare-set.jpg", source: "library" },
  skincareProduct: { id: "stock-2", name: "精华液商品特写.jpg", type: "image", url: "./assets/prototype/skincare-product.jpg", source: "library" },
  character: { id: "stock-4", name: "都市女性自然口播.jpg", type: "image", url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=720&auto=format&fit=crop&q=85", source: "library" },
  model: { id: "stock-5", name: "运动服模特正面.jpg", type: "image", url: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=720&auto=format&fit=crop&q=85", source: "library" },
  clothing: { id: "stock-8", name: "白色针织上衣.jpg", type: "image", url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=720&auto=format&fit=crop&q=85", source: "library" },
  beach: { id: "stock-11", name: "海边日落氛围.jpg", type: "image", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=720&auto=format&fit=crop&q=85", source: "library" },
  selectedLook: { id: "stock-13", name: "通勤女装模特.jpg", type: "image", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=720&auto=format&fit=crop&q=85", source: "generated" },
  sourceVideo: { id: "video-2", name: "都市女性口播原片.mp4", type: "video", url: AI_VIDEO_DEMO_RESULT_URL, coverUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=720&auto=format&fit=crop&q=85", durationSeconds: 12, source: "library" }
};

export const INITIAL_TASKS: Task[] = [
  {
    id: "ai-video-demo-pain-comparison",
    name: "AI视频原料_痛点对比_护肤体验对比",
    type: "video_gen", status: "completed", progress: 100,
    inputFiles: [AI_VIDEO_DEMO_MEDIA.character.url, AI_VIDEO_DEMO_MEDIA.sourceVideo.url],
    outputFiles: [AI_VIDEO_DEMO_RESULT_URL],
    createdAt: "2026-09-11 09:18:00", creditsCost: 36,
    category: "ai_video", source: "tool", autoProgress: false, restartable: false,
    aiVideoSnapshot: {
      mode: "pain_comparison", model: "星绘 Pro", ratio: "9:16", duration: 8,
      prompt: "突出使用前后的体验差异，保持自然光线。",
      painMaterial: { ...AI_VIDEO_DEMO_MEDIA.character, name: "护肤前肌肤状态.jpg" },
      solutionMaterial: { ...AI_VIDEO_DEMO_MEDIA.sourceVideo, name: "精华使用效果.mp4" },
    },
    aiVideoOutput: { videoUrl: AI_VIDEO_DEMO_RESULT_URL, coverUrl: AI_VIDEO_DEMO_MEDIA.skincareProduct.url, duration: 8 },
  },
  {
    id: "ai-video-demo-usage-process",
    name: "AI视频原料_使用过程_精华使用步骤",
    type: "video_gen", status: "completed", progress: 100,
    inputFiles: [AI_VIDEO_DEMO_MEDIA.sourceVideo.url, AI_VIDEO_DEMO_MEDIA.skincareProduct.url],
    outputFiles: [AI_VIDEO_DEMO_RESULT_URL],
    createdAt: "2026-09-11 09:10:00", creditsCost: 60,
    category: "ai_video", source: "tool", autoProgress: false, restartable: false,
    aiVideoSnapshot: {
      mode: "usage_process", model: "云镜 Max", ratio: "16:9", duration: 15,
      prompt: "",
      usageVideo: { ...AI_VIDEO_DEMO_MEDIA.sourceVideo, name: "精华使用方法.mp4" },
      productImage: AI_VIDEO_DEMO_MEDIA.skincareProduct,
    },
    aiVideoOutput: { videoUrl: AI_VIDEO_DEMO_RESULT_URL, coverUrl: AI_VIDEO_DEMO_MEDIA.skincareProduct.url, duration: 15 },
  },
  {
    id: "ai-video-demo-queue",
    name: "AI视频原料_参考生视频_护肤礼盒动态展示",
    type: "video_gen",
    status: "queue",
    progress: 0,
    inputFiles: [AI_VIDEO_DEMO_MEDIA.skincareSet.url, AI_VIDEO_DEMO_MEDIA.character.url],
    createdAt: "2026-09-07 11:26:40",
    creditsCost: 40,
    category: "ai_video",
    source: "tool",
    autoProgress: false,
    restartable: false,
    aiVideoSnapshot: {
      mode: "reference",
      model: "video-vd-1",
      ratio: "9:16",
      duration: 8,
      prompt: "镜头缓慢推进，商品始终保持清晰，人物自然展示产品细节，光线柔和，画面具有真实电商广告质感。",
      references: [AI_VIDEO_DEMO_MEDIA.skincareSet, AI_VIDEO_DEMO_MEDIA.character]
    }
  },
  {
    id: "ai-video-demo-generating",
    name: "AI视频原料_首尾帧生视频_海边产品转场",
    type: "video_gen",
    status: "generating",
    progress: 68,
    inputFiles: [AI_VIDEO_DEMO_MEDIA.skincareProduct.url, AI_VIDEO_DEMO_MEDIA.beach.url],
    createdAt: "2026-09-07 10:48:12",
    creditsCost: 60,
    category: "ai_video",
    source: "tool",
    autoProgress: false,
    cancellable: false,
    restartable: false,
    aiVideoSnapshot: {
      mode: "first_last",
      model: "video-sd-t1.6",
      ratio: "9:16",
      duration: 8,
      prompt: "从首帧自然过渡到尾帧，主体动作连贯，镜头轻微环绕，商品外观与背景结构保持一致。",
      firstFrame: AI_VIDEO_DEMO_MEDIA.skincareProduct,
      lastFrame: AI_VIDEO_DEMO_MEDIA.beach
    }
  },
  {
    id: "ai-video-demo-completed",
    name: "AI视频原料_配音生视频_新品精华口播",
    type: "video_gen",
    status: "completed",
    progress: 100,
    inputFiles: [AI_VIDEO_DEMO_MEDIA.character.url],
    outputFiles: [AI_VIDEO_DEMO_RESULT_URL],
    createdAt: "2026-09-07 10:16:28",
    creditsCost: 34,
    category: "ai_video",
    source: "tool",
    autoProgress: false,
    restartable: false,
    aiVideoSnapshot: {
      mode: "dubbing",
      model: "video-sd-t1.6",
      ratio: "9:16",
      duration: 11,
      character: AI_VIDEO_DEMO_MEDIA.character,
      voiceId: "clear-female",
      voiceName: "清醒语录",
      speech: "这款精华质地清透，上脸吸收很快，日常护肤使用也不会有黏腻感。"
    },
    aiVideoOutput: { videoUrl: AI_VIDEO_DEMO_RESULT_URL, coverUrl: AI_VIDEO_DEMO_MEDIA.character.url, duration: 11 }
  },
  {
    id: "ai-video-demo-failed",
    name: "AI视频原料_视频编辑-换背景_直播间焕新",
    type: "video_gen",
    status: "failed",
    progress: 43,
    inputFiles: [AI_VIDEO_DEMO_MEDIA.sourceVideo.url],
    createdAt: "2026-09-07 09:39:22",
    creditsCost: 34,
    refundedCredits: 34,
    failureReason: "素材中检测到无法稳定分离的快速遮挡，请检查原视频后重新编辑。",
    category: "ai_video",
    source: "tool",
    autoProgress: false,
    restartable: false,
    aiVideoSnapshot: {
      mode: "background",
      model: "video-sd-t1.6",
      ratio: "9:16",
      duration: 8,
      prompt: "将背景替换为明亮整洁的现代家居空间，保留人物与商品主体，光线方向和原视频一致。",
      sourceVideos: [AI_VIDEO_DEMO_MEDIA.sourceVideo]
    }
  },
  {
    id: "ai-video-demo-cancelled",
    name: "AI视频原料_视频编辑-换装_通勤套装展示",
    type: "video_gen",
    status: "cancelled",
    progress: 0,
    inputFiles: [AI_VIDEO_DEMO_MEDIA.clothing.url, AI_VIDEO_DEMO_MEDIA.model.url],
    createdAt: "2026-09-06 18:21:06",
    creditsCost: 61,
    refundedCredits: 61,
    category: "ai_video",
    source: "tool",
    autoProgress: false,
    restartable: false,
    aiVideoSnapshot: {
      mode: "outfit",
      model: "video-sd-t1.6",
      ratio: "9:16",
      duration: 8,
      outfitMode: "single",
      clothingImages: [AI_VIDEO_DEMO_MEDIA.clothing],
      modelMedia: AI_VIDEO_DEMO_MEDIA.model,
      selectedLook: AI_VIDEO_DEMO_MEDIA.selectedLook,
      actionDescription: "模特先正面展示服装，再缓慢向右转身，动作自然舒展，完整呈现服装正面、侧面与背面细节。"
    }
  },
  {
    id: "t_demo_generating_quick",
    name: "七夕礼盒商品视频制作",
    type: "video",
    status: "generating",
    progress: 38,
    inputFiles: ["七夕礼盒主图.png"],
    createdAt: "2026-08-20 16:35",
    creditsCost: 5,
    source: "tool",
    category: "quick_creation",
    autoProgress: false
  },
  {
    id: "t_demo_failed_subtitle",
    name: "直播切片字幕擦除",
    type: "subtitle",
    status: "failed",
    progress: 24,
    inputFiles: ["https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4"],
    createdAt: "2026-08-20 15:48",
    creditsCost: 40,
    refundedCredits: 40,
    failureReason: "视频处理异常，任务已停止，40 积分已全额退回。",
    source: "tool",
    category: "subtitle",
    restartable: false,
    subtitleSnapshot: {
      sourceVideo: {
        id: "subtitle-demo-source",
        name: "直播切片_0820.mp4",
        url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
        coverUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80",
        size: "18.4 MB",
        duration: 15,
        resolution: "1920 x 1080"
      },
      regions: [{ id: "demo-subtitle-region", x: 8, y: 78, width: 84, height: 15 }]
    }
  },
  {
    id: "t_demo_agent_success",
    name: "美妆礼盒七夕送礼场景成片",
    type: "video_gen",
    status: "completed",
    progress: 100,
    inputFiles: ["美妆礼盒参考图.png"],
    outputFiles: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=480&auto=format&fit=crop&q=80"],
    createdAt: "2026-08-20 15:10",
    creditsCost: 12,
    source: "agent",
    category: "agent"
  },
  {
    id: "t_demo_watermark",
    name: "春季女装视频去水印",
    type: "watermark",
    status: "completed",
    progress: 100,
    inputFiles: ["https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4"],
    outputFiles: ["https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4"],
    createdAt: "2026-08-20 13:16",
    creditsCost: 40,
    source: "tool",
    category: "watermark",
    restartable: false,
    watermarkSnapshot: {
      sourceVideo: {
        id: "a3",
        name: "模特红裙走秀素材_原图.mp4",
        url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
        coverUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80",
        size: "18.4 MB",
        duration: 15,
        resolution: "1920 x 1080"
      },
      regions: [{ id: "demo-watermark-region", x: 77, y: 6, width: 18, height: 11 }]
    },
    watermarkOutput: {
      name: "模特红裙走秀素材_原图_去水印.mp4",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
      coverUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80",
      size: "18.4 MB",
      duration: 15,
      resolution: "1920 x 1080"
    }
  },
  {
    id: "t_demo_fission",
    name: "高转化口播视频爆款复刻",
    type: "fission",
    status: "completed",
    progress: 100,
    inputFiles: ["爆款口播参考.mp4"],
    outputFiles: ["https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=480&auto=format&fit=crop&q=80"],
    createdAt: "2026-08-20 11:40",
    creditsCost: 15,
    source: "tool",
    category: "fission"
  },
  {
    id: "t_demo_agent_cancelled",
    name: "秋季新品整合营销视频",
    type: "video_gen",
    status: "cancelled",
    progress: 0,
    inputFiles: ["秋季新品资料包.zip"],
    createdAt: "2026-08-19 18:04",
    creditsCost: 18,
    refundedCredits: 18,
    cancelledAt: "2026-08-19 18:05",
    source: "agent",
    category: "agent"
  },
  {
    id: "t_old_2",
    name: "去除视频右下角水印_15s",
    type: "watermark",
    status: "failed",
    progress: 72,
    inputFiles: ["https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4"],
    createdAt: "2026-07-08 16:12",
    creditsCost: 40,
    refundedCredits: 40,
    failureReason: "视频解码异常，任务已停止，40 积分已全额退回。",
    source: "tool",
    category: "watermark",
    restartable: false,
    watermarkSnapshot: {
      sourceVideo: {
        id: "a4",
        name: "七夕美妆礼盒_送礼场景成片_V3.mp4",
        url: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-blue-glass-bottle-with-dropper-44365-large.mp4",
        coverUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
        size: "42.6 MB",
        duration: 15,
        resolution: "1920 x 1080"
      },
      regions: [{ id: "old-watermark-region", x: 73, y: 82, width: 22, height: 12 }]
    }
  },
  {
    id: "t_old_3",
    name: "七夕美妆礼盒 AI 视频",
    type: "video_gen",
    status: "failed",
    progress: 67,
    inputFiles: ["七夕美妆礼盒主图.png"],
    createdAt: "2026-08-19 14:32",
    creditsCost: 10,
    refundedCredits: 3.3,
    failureReason: "生成服务连接中断，未消耗部分积分已退回",
    source: "agent",
    category: "agent"
  },
  {
    id: "t_old_4",
    name: "秋季风衣素材画质增强",
    type: "enhance",
    status: "cancelled",
    progress: 0,
    inputFiles: ["https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4"],
    createdAt: "2026-08-19 13:06",
    creditsCost: 10,
    refundedCredits: 10,
    cancelledAt: "2026-08-19 13:07",
    source: "tool",
    category: "enhance",
    restartable: false,
    enhanceSnapshot: {
      sourceVideo: {
        id: "enhance-demo-source",
        name: "秋季风衣原片.mp4",
        url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
        coverUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80",
        size: "18.4 MB",
        duration: 15,
        resolution: "1280 x 720",
        fps: 30
      },
      requestedResolution: "1080p",
      outputResolution: "1080p",
      frameRate: "source",
      outputFps: 30,
      billingMinutes: 1
    }
  }
].filter(
  (task) =>
    ![
      "agent",
      "quick_creation",
      "ai_video",
      "watermark",
      "subtitle",
      "enhance",
      "face_swap",
    ].includes(task.category || ""),
) as Task[];

// Fixed task-queue fixtures keep every category demonstrable without waiting for a
// live job to finish. The real creation flows continue to use their own lifecycle.
const DEMO_TASK_VIDEO = "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4";
const DEMO_TASK_COVER = "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80";
const DEMO_TASK_STATUSES: Task["status"][] = ["queue", "generating", "completed", "failed", "cancelled"];

const demoWatermarkSnapshot = (id: string, name: string): WatermarkTaskSnapshot => ({
  sourceVideo: { id, name: `${name}.mp4`, url: DEMO_TASK_VIDEO, coverUrl: DEMO_TASK_COVER, size: "18.4 MB", duration: 15, resolution: "1920 x 1080" },
  regions: [{ id: `${id}-region`, x: 76, y: 6, width: 19, height: 12 }],
});

const makeToolDemoTasks = (category: "watermark" | "subtitle" | "enhance") => DEMO_TASK_STATUSES.map((status, index): Task => {
  const id = `demo-${category}-${status}`;
  const label = category === "watermark" ? "视频去水印" : category === "subtitle" ? "字幕擦除" : "画质增强";
  const sourceName = category === "watermark" ? "秋季女装直播切片" : category === "subtitle" ? "护肤产品口播切片" : "厨房素材画质优化";
  const snapshot = category === "enhance"
    ? { sourceVideo: { ...demoWatermarkSnapshot(id, sourceName).sourceVideo, resolution: "1280 x 720", fps: 30 }, requestedResolution: "1080p" as const, outputResolution: "1080p" as const, frameRate: "source" as const, outputFps: 30, billingMinutes: 1 }
    : demoWatermarkSnapshot(id, sourceName);
  const output = { name: `${sourceName}_${label}.mp4`, videoUrl: DEMO_TASK_VIDEO, coverUrl: DEMO_TASK_COVER, size: "18.4 MB", duration: 15, resolution: "1920 x 1080" };
  const enhanceOutput = { ...output, fps: 30, resolution: "1280 x 720" };
  return {
    id, name: `${sourceName} · ${label} · ${index + 1}`, type: category, status, progress: status === "completed" ? 100 : status === "generating" ? 56 : status === "failed" ? 64 : 0,
    inputFiles: [DEMO_TASK_VIDEO], outputFiles: status === "completed" ? [DEMO_TASK_VIDEO] : undefined, createdAt: `2026-09-15 0${9 + index}:2${index}:00`, creditsCost: category === "enhance" ? 18 : 40,
    refundedCredits: status === "failed" || status === "cancelled" ? (category === "enhance" ? 18 : 40) : undefined, failureReason: status === "failed" ? `${label}处理异常，已停止处理，积分已全额退回。` : undefined,
    source: "tool", category, autoProgress: false, restartable: status === "failed" || status === "cancelled", cancellable: status === "queue",
    ...(category === "watermark" ? { watermarkSnapshot: snapshot as WatermarkTaskSnapshot, watermarkOutput: status === "completed" ? output : undefined } : category === "subtitle" ? { subtitleSnapshot: snapshot as WatermarkTaskSnapshot, subtitleOutput: status === "completed" ? output : undefined } : { enhanceSnapshot: snapshot as EnhanceTaskSnapshot, enhanceOutput: status === "completed" ? enhanceOutput : undefined }),
  };
});

const makeGeneratedDemoTasks = (): Task[] => {
  const generic = (status: Task["status"], index: number): Task => {
    const name = "高转化口播爆款复刻";
    const base: Task = { id: `demo-fission-${status}`, name: `${name} · ${index + 1}`, type: "fission", status, progress: status === "completed" ? 100 : status === "generating" ? 48 : 0, inputFiles: [DEMO_TASK_VIDEO], createdAt: `2026-09-14 1${index}:2${index}:00`, creditsCost: 20, source: "tool", category: "fission", autoProgress: false, restartable: status === "failed" || status === "cancelled" };
    if (status === "failed") { base.failureReason = "演示任务处理失败，未消耗部分积分已退回。"; base.refundedCredits = base.creditsCost; }
    if (status === "cancelled") { base.refundedCredits = base.creditsCost; base.cancelledAt = "2026-09-14 18:20:00"; }
    base.remakeStage = status === "completed" ? "final" : status === "generating" ? "storyboard" : "video_analysis";
    if (status === "completed") base.outputFiles = [DEMO_TASK_VIDEO];
    return base;
  };
  return DEMO_TASK_STATUSES.map((status, index) => generic(status, index));
};

INITIAL_TASKS.push(...makeGeneratedDemoTasks());

export const INITIAL_TRANSACTIONS: CreditTransaction[] = [
  {
    id: "tx1",
    type: "recharge",
    tool: "系统赠送",
    amount: 100.00,
    time: "2026-07-07 00:00:00",
    remark: "新人注册赠送体验积分"
  },
  {
    id: "tx3",
    type: "consume",
    tool: "水印擦除",
    amount: -40,
    time: "2026-07-08 16:12:00",
    remark: "视频去水印 [模特红裙走秀素材_原图.mp4]"
  }
];

export const REFERENCE_SLIDER_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80",
    title: "1. 首页 / 主视觉图",
    desc: "用清晰主体、品牌氛围和核心利益点，快速建立商品第一印象。"
  },
  {
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    title: "2. 卖点细节拆解",
    desc: "微距透视搭配核心功效标签，突出产品科研硬实力与活性配方。"
  },
  {
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    title: "3. 场景化生活应用",
    desc: "置入高端居家化妆台、自然晨光场景，让买家对产品产生日常代入感。"
  },
  {
    url: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80",
    title: "4. 参数对比与评测",
    desc: "以网格背景、清晰参数和简洁配图，完成信息闭环，加速购买决策。"
  }
];
