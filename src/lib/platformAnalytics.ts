import { grouped, personOrg, ratio, unique } from "./analyticsData";
import type { TaskItem } from "../components/TaskCollaborationView";

export interface PlatformResource {
  id: string;
  sourceId: string;
  scope: string;
  label: string;
  person: string;
  department: string;
  group: string;
  date: string;
  category: string;
  downloads: number;
  cuts: number;
  pushed: boolean;
  used: boolean;
  viral: boolean;
  status: string;
}
export function creationTotals(rows: PlatformResource[]) {
  const people = (predicate: (row: PlatformResource) => boolean) =>
    unique(rows.filter(predicate).map((row) => row.person)).length;
  return {
    uploads: rows.length,
    uploaders: people(() => true),
    downloads: rows.reduce((sum, row) => sum + row.downloads, 0),
    downloadedAuthors: people((row) => row.downloads > 0),
    pushedAuthors: people((row) => row.pushed),
    copiedAuthors: people((row) => row.cuts > 0),
    cuts: rows.reduce((sum, row) => sum + row.cuts, 0),
    usage: ratio(rows.filter((row) => row.used).length, rows.length) * 100,
    viral: rows.filter((row) => row.viral).length,
  };
}
export function taskTotals(tasks: TaskItem[]) {
  return {
    tasks: tasks.length,
    completed: tasks.filter((task) => task.status === "completed").length,
    pending: tasks.filter((task) => task.status !== "completed").length,
    orders: tasks.reduce((sum, task) => sum + task.orderCount, 0),
    delivered: tasks.reduce((sum, task) => sum + task.completedCount, 0),
    rate:
      ratio(
        tasks.filter((task) => task.status === "completed").length,
        tasks.length,
      ) * 100,
  };
}
export function taskOwner(task: TaskItem, role: string) {
  return personOrg(
    role === "assigned" ? task.assignee : task.publisher,
    role === "assigned" ? task.assigneeDeptPath : undefined,
  );
}
export function taskFiles(task: TaskItem) {
  return task.status === "completed"
    ? task.completionSnapshot || task.associatedWorks || []
    : task.associatedWorks || [];
}
export function fileStatusTotals(tasks: TaskItem[]) {
  // A resource associated with two tasks is one delivery in each task, matching task completion counts.
  return grouped(
    tasks.flatMap((task) =>
      unique(taskFiles(task).map((file) => file.id)).map(
        (id) => taskFiles(task).find((file) => file.id === id)!,
      ),
    ),
    (file) => file.status || "未设置状态",
  ).map(([label, files]) => ({ id: label, label, value: files.length }));
}
export function orgKey(
  org: { department: string; group: string; person: string },
  dimension: string,
) {
  return dimension === "department"
    ? org.department
    : dimension === "group"
      ? `${org.department} / ${org.group}`
      : `${org.department} / ${org.group} / ${org.person}`;
}
