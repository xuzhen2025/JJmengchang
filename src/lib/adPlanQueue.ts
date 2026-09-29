import { adRetryBlockReason, advanceAdStore, cancelActiveAdRecords, isAdActive, isCreatingAdPlan, readAdStore, retryAdRecords, type AdPushRecord } from "./adPush";

export const AD_PLAN_QUEUE_STATUSES = ["待创建", "创建中", "创建成功", "创建失败", "取消创建"] as const;
export type AdPlanQueueStatus = (typeof AD_PLAN_QUEUE_STATUSES)[number];
export const hasCreatedAdPlan = (record: AdPushRecord) => Boolean(record.planId && ["创建成功", "追加成功"].includes(record.planResult));

export function adPlanCreationStatus(records: AdPushRecord[]): AdPlanQueueStatus {
  if (records.some(hasCreatedAdPlan)) return "创建成功";
  if (records.length && records.every(record => record.status === "已取消")) return "取消创建";
  if (records.some(record => record.pendingWrite?.step === "create")) return "创建中";
  if (records.some(record => record.status === "推送失败")) return "创建失败";
  if (records.some(record => record.status === "创建计划中")) return "创建中";
  return "待创建";
}

export interface AdPlanQueueRow {
  id: string;
  records: AdPushRecord[];
  status: AdPlanQueueStatus;
  createdAt: string;
  updatedAt: string;
  failureReason: string;
}

export function adPlanQueueRows(records: AdPushRecord[], ownerId?: string): AdPlanQueueRow[] {
  const groups = new Map<string, AdPushRecord[]>();
  for (const record of records) {
    if (!isCreatingAdPlan(record.snapshot) || ownerId && record.operatorId !== ownerId) continue;
    const key = JSON.stringify([record.operatorId, record.platform, record.accountId, record.taskId, record.planGroupId || record.planId || record.id]);
    groups.set(key, [...(groups.get(key) || []), record]);
  }
  return [...groups].map(([id, members]) => ({
    id, records: members, status: adPlanCreationStatus(members),
    createdAt: members.map(record => record.createdAt).sort()[0],
    updatedAt: members.map(record => record.updatedAt).sort().at(-1)!,
    failureReason: members.some(hasCreatedAdPlan) || members.every(record => record.status === "已取消") ? "" : [...new Set(members.map(record => record.failureReason).filter(Boolean))].join("；"),
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const adPlanQueueFilters = (day = new Date().toLocaleDateString("sv-SE")) => ({ videoId: "", accountId: "", planId: "", templateName: "", platform: "", goal: "", status: "", operator: "", taskId: "", start: day, end: day });
export type AdPlanQueueFilters = ReturnType<typeof adPlanQueueFilters>;

export function filterAdPlanQueue(rows: AdPlanQueueRow[], filters: AdPlanQueueFilters) {
  const includes = (text: string, value: string) => text.toLowerCase().includes(value.trim().toLowerCase());
  return rows.filter(row => {
    const record = row.records[0];
    return row.records.some(item => includes(item.videoId, filters.videoId) || Boolean(item.derivativeId && includes(item.derivativeId, filters.videoId))) &&
      includes(record.accountId, filters.accountId) && row.records.some(item => includes(item.planId, filters.planId)) &&
      includes(record.templateName || record.templateSnapshot?.name || "", filters.templateName) &&
      (!filters.platform || record.platform === filters.platform) && (!filters.goal || record.marketingGoal === filters.goal) &&
      (!filters.status || row.status === filters.status) && (!filters.operator || record.operator === filters.operator) &&
      includes(record.taskId, filters.taskId) && (!filters.start || row.createdAt.slice(0, 10) >= filters.start) && (!filters.end || row.createdAt.slice(0, 10) <= filters.end);
  });
}

export function adPlanQueueActionIds(rows: AdPlanQueueRow[], ids: string[], action: "retry" | "cancel") {
  const selected = rows.filter(row => ids.includes(row.id));
  if (!ids.length) throw new Error("请先选择需要操作的创建计划记录");
  if (selected.length !== new Set(ids).size) throw new Error("所选计划记录已发生变化，请重新查询后选择");
  if (selected.some(row => row.status === "创建成功")) throw new Error("所选计划已创建成功，不能重复创建或取消创建；后续投放问题请到推送视频记录处理");
  if (selected.some(row => row.records.some(record => record.pendingWrite || record.failureKind === "unknown_write"))) throw new Error("存在请求结果待确认的任务，请先到推送视频记录核查原请求，避免重复创建计划");
  if (action === "retry") {
    if (selected.some(row => row.status !== "创建失败")) throw new Error("批量重试仅支持创建失败的记录");
    if (selected.some(row => row.records.some(record => record.status === "已取消") && row.records[0].snapshot.workbench?.strategy !== "跳过失败的直接搭建")) throw new Error("同一计划包含已取消的视频，无法按全部成功策略继续，请返回资源库重新发起");
    const failed = selected.flatMap(row => row.records.filter(record => record.status === "推送失败"));
    const issue = failed.map(adRetryBlockReason).find(Boolean);
    if (issue) throw new Error(issue);
    return failed.map(record => record.id);
  }
  if (selected.some(row => !["待创建", "创建中"].includes(row.status) || !row.records.some(isAdActive))) throw new Error("批量取消仅支持待创建或创建中的计划");
  return selected.flatMap(row => row.records.filter(isAdActive).map(record => record.id));
}

export function applyAdPlanQueueAction(ids: string[], action: "retry" | "cancel", ownerId: string) {
  const current = advanceAdStore(readAdStore());
  const recordIds = adPlanQueueActionIds(adPlanQueueRows(current.records, ownerId), ids, action);
  if (action === "retry") retryAdRecords(recordIds, ownerId, { uncreatedPlansOnly: true });
  else cancelActiveAdRecords(recordIds, ownerId, { uncreatedPlansOnly: true });
}
