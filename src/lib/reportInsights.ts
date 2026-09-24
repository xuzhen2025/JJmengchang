import { ratio, unique } from "./analyticsData";
import { creationMetrics, type ResourceActivity } from "./reportPlatformData";
import { taskTotals, type PlatformResource } from "./platformAnalytics";
import { reportTotals, money, type ReportFact } from "./reportDemoData";
import type { TaskItem } from "../components/TaskCollaborationView";

export function insightProfile(name: string, members: string[], resources: PlatformResource[], activities: ResourceActivity[], tasks: TaskItem[], facts: ReportFact[]) {
  const owned = resources.filter(row => members.includes(row.person));
  const ownIds = new Set(owned.map(row => row.id));
  const ownActions = activities.filter(row => members.includes(row.person));
  const metrics = creationMetrics(owned, activities);
  const ad = reportTotals(facts.filter(row => members.includes(row.person)));
  const published = taskTotals(tasks.filter(task => members.includes(task.publisher)));
  const assigned = taskTotals(tasks.filter(task => members.includes(task.assignee)));
  const dataAnalysis: Record<string, number | string> = {
    "成片消耗": money(ad.spend), "成交金额": money(ad.gmv), "ROI": ad.roi.toFixed(2),
    "上传作品（成片）": owned.filter(row => row.scope === "finished").length,
    "上传作品（素材）": owned.filter(row => row.scope === "materials").length,
    "上传作品（图片）": owned.filter(row => row.scope === "images").length,
    "上传作品（音频）": owned.filter(row => row.scope === "audio").length,
    "上传作品（脚本）": owned.filter(row => row.scope === "scripts").length,
    "下载作品数": unique(ownActions.filter(row => row.action === "download").map(row => row.resourceId)).length,
    "推送他人作品数": unique(ownActions.filter(row => row.action === "push" && !ownIds.has(row.resourceId)).map(row => row.resourceId)).length,
    "复制他人作品到剪映数": ownActions.filter(row => row.action === "copy_capcut" && !ownIds.has(row.resourceId)).length,
    "作品被多少人下载": metrics.downloadedPersonCount,
    "作品被多少人复制到剪映": metrics.copiedCapcutCount,
    "作品被多少人推送": metrics.pushedPersonCount,
  };
  const taskAnalysis: Record<string, number> = {
    "发布任务数": published.tasks, "被指派任务数": assigned.tasks,
    "发布的任务（已达标）": published.completed, "发布的任务（待完成）": published.pending,
    "发布的任务（下单数）": published.orders, "发布的任务（出片数）": published.delivered,
    "被指派的任务（已达标）": assigned.completed, "被指派的任务（待完成）": assigned.pending,
    "被指派的任务（下单数）": assigned.orders, "被指派的任务（出片数）": assigned.delivered,
  };
  // Prototype scores use fixed reference scales, not an official third-party rating or a rank against the comparison target.
  const score = (value: number, reference: number) => Math.min(100, Math.round(ratio(value, reference) * 100));
  const headcount = Math.max(1, members.length);
  const radar = { spend: score(ad.spend, 100000 * headcount), contribution: score(assigned.delivered, 10 * headcount),
    diversity: score(unique(owned.map(row => row.scope)).length, 5), viralRate: score(metrics.viralCount, owned.filter(row => row.scope === "finished").length),
    diligence: score(owned.length, 10 * headcount), creativity: score(owned.filter(row => ["scripts", "finished"].includes(row.scope)).length, 5 * headcount) };
  return { name, radar, dataAnalysis, taskAnalysis };
}
