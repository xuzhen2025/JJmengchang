import { grouped, ratio, shiftDate, unique } from "./analyticsData";
import { memberOrganization, type ReportOrganization } from "./analyticsOrganization";
import { stableNumber, REPORT_TODAY } from "./reportDemoData";
import type { PlatformResource } from "./platformAnalytics";
import type { TaskItem } from "../components/TaskCollaborationView";

export interface ResourceActivity { id: string; resourceId: string; person: string; date: string; action: "download" | "copy_capcut" | "push" }
export function resourceActivities(resources: PlatformResource[], org: ReportOrganization): ResourceActivity[] {
  // Demo operation logs reconcile with the resource counters; unique users are counted from these logs, not authors.
  return resources.flatMap(resource => {
    const people = org.members.filter(member => member.name !== resource.person && member.status === "normal");
    const seed = stableNumber(resource.id);
    const elapsed = Math.max(0, Math.floor((Date.parse(REPORT_TODAY) - Date.parse(resource.date)) / 86400000));
    return ([ ["download", resource.downloads], ["copy_capcut", resource.cuts] ] as const).flatMap(([action, count]) =>
      Array.from({ length: people.length ? count : 0 }, (_, index) => ({ id: `${resource.id}-${action}-${index}`, resourceId: resource.id,
        person: people[(seed + index % Math.min(5, people.length)) % people.length].name,
        date: shiftDate(resource.date, Math.floor(elapsed * (index + 1) / (count + 1))), action })));
  });
}
export function creationMetrics(resources: PlatformResource[], events: ResourceActivity[]) {
  const ids = new Set(resources.map(row => row.id));
  const linked = events.filter(event => ids.has(event.resourceId));
  const people = (action: ResourceActivity["action"]) => unique(linked.filter(event => event.action === action).map(event => event.person)).length;
  return { uploaderCount: unique(resources.map(row => row.person)).length, uploadCount: resources.length,
    downloadCount: linked.filter(event => event.action === "download").length,
    downloadedPersonCount: people("download"), pushedPersonCount: people("push"), copiedCapcutCount: people("copy_capcut"),
    usageRate: ratio(unique(linked.map(event => event.resourceId)).length, resources.length) * 100,
    viralCount: resources.filter(row => row.viral).length };
}
export function organizationKey(value: { department: string; group: string; person: string }, dimension: string) {
  return dimension === "team" ? value.department : dimension === "group" ? `${value.department} / ${value.group}` : `${value.department} / ${value.group} / ${value.person}`;
}
export function periodKey(date: string, aggregation: string) {
  if (aggregation === "monthly" || aggregation === "month") return date.slice(0, 7);
  if (aggregation === "weekly" || aggregation === "week") return shiftDate(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7));
  return date;
}
export function taskReportDate(task: TaskItem, kind: string) {
  return (kind === "complete_date" ? task.completedAt || "" : task.publishDate).slice(0, 10);
}
export function taskOrganization(task: TaskItem, role: string, org: ReportOrganization) {
  const name = role === "assigned" ? task.assignee : task.publisher;
  return { ...memberOrganization(org, name), person: name };
}
export function organizationSelected(value: { department: string; group: string; person: string }, dimension: string, teams: string[], groups: string[], people: string[]) {
  return dimension === "team" ? !teams.length || teams.includes(value.department) : dimension === "group" ? !groups.length || groups.includes(value.group) || groups.includes(`${value.department}-${value.group}`) : !people.length || people.includes(value.person);
}
export function leaderMembers(org: ReportOrganization, leader: string) {
  const nodes = org.depts.filter(node => node.manager === leader && node.levelType !== "company");
  const ids = new Set(nodes.map(node => node.id));
  for (const node of org.depts) if (node.parentId && ids.has(node.parentId)) ids.add(node.id);
  return org.members.filter(member => member.name !== leader && ids.has(member.deptId)).map(member => member.name);
}
export function groupedResources(resources: PlatformResource[], dimension: string, aggregation: string, start: string, end: string, events: ResourceActivity[]) {
  return grouped(resources, row => `${organizationKey(row, dimension)}|${aggregation === "summary" ? "" : periodKey(row.date, aggregation)}`)
    .map(([id, rows]) => ({ id, team: rows[0].department, group: rows[0].group, name: rows[0].person,
      dateRange: aggregation === "summary" ? `${start} 至 ${end}` : periodKey(rows[0].date, aggregation), ...creationMetrics(rows, events) }));
}
