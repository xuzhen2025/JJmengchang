import { useSyncExternalStore } from "react";
import { readAdPushSettings } from "./adPushConfig";
import { getAdActor, type AdPushRecord, type AdVideo } from "./adPush";
import { requireDerivationPermission } from "./derivationPermissions";

export interface DerivationOptions {
  allocation: "shared" | "per_account";
  count: number;
}
export const DERIVATION_TIME_MS = 6000;
export function derivationCount(options: DerivationOptions, accountCount = 1) {
  if (accountCount <= 0) return 0;
  return options.allocation === "shared" ? 1 : options.count * accountCount;
}
export function validateDerivationCount(count: number, limit: number, active = 0): string {
  if (!Number.isSafeInteger(count) || count < 1) return "衍生数量须为大于0的整数";
  if (count > limit) return `本次最多可衍生 ${limit} 个视频，请调整数量`;
  if (count + active > limit) return `当前还有 ${active} 个视频正在衍生，本次最多可衍生 ${Math.max(0, limit - active)} 个`;
  return "";
}
export interface DerivationTask {
  id: string;
  sourceVideoId: string;
  ownerId: string;
  count: number;
  createdAt: number;
  status: "处理中" | "已完成";
  resultIds: string[];
}
let tasks: DerivationTask[] = [];
export const DERIVATION_STATUSES = ["成功", "失败", "处理中", "取消衍生", "待衍生", "已删除"] as const;
export type DerivationStatus = typeof DERIVATION_STATUSES[number];
export interface DerivationRecord {
  id: string; taskId: string; ownerId: string; source: AdVideo; name: string; url: string;
  status: DerivationStatus; createdAt: number; updatedAt: number; startedAt: number;
  note: string; message: string; reviewBlocked: boolean | null; driver: "standalone" | "push";
  attempt: number; example?: boolean;
  ownerName?: string;
}
let records: DerivationRecord[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getDerivationTasks = () => tasks;
export const useDerivationTasks = () => useSyncExternalStore(subscribe, getDerivationTasks);
export const getDerivationRecords = () => records;
export const useDerivationRecords = () => useSyncExternalStore(subscribe, getDerivationRecords);
export const activeDerivationCount = (ownerId: string) => records.filter(r => r.ownerId === ownerId && r.driver === "standalone" && !r.example && ["待衍生", "处理中"].includes(r.status)).length;
export const derivationOutput = (id: string, ownerId?: string) => records.find(r => r.id === id && (!ownerId || r.ownerId === ownerId));
let noteHistory: Record<string, string[]> = {};
export const getDerivationNoteHistory = (ownerId: string) => noteHistory[ownerId] || [];

export function derivationVideo(record: DerivationRecord): AdVideo {
  return { ...record.source, title: record.name, videoUrl: record.url, derivativeId: record.id };
}

// Built-in demo sources use bundled media so preview/download do not depend on external hosts.
const demoOutputMedia: Record<string, string> = {
  fv1: "dress", fv2: "serum", fv3: "fashion-sport", fv7: "fashion-home", fv11: "fashion-home",
  fv13: "serum", fv14: "skincare-set", fv17: "watch", fv18: "headphones", fv21: "dress",
};
function prototypeOutputUrl(source: AdVideo) {
  if (demoOutputMedia[source.id]) return `./assets/viral-gallery/${demoOutputMedia[source.id]}.mp4`;
  return source.videoUrl || "./assets/viral-gallery/serum.mp4";
}

function updateTasks() {
  tasks = tasks.map(task => {
    const outputs = records.filter(r => r.taskId === task.id);
    return { ...task, status: outputs.some(r => ["待衍生", "处理中"].includes(r.status)) ? "处理中" : "已完成", resultIds: outputs.filter(r => r.status === "成功").map(r => r.id) };
  });
  emit();
}
function schedule(record: DerivationRecord) {
  const attempt = record.attempt;
  const transition = (status: "处理中" | "成功") => {
    records = records.map(r => r.id === record.id && r.attempt === attempt && ["待衍生", "处理中"].includes(r.status)
      ? { ...r, status, updatedAt: Date.now(), url: status === "成功" ? prototypeOutputUrl(r.source) : "", message: status === "成功" ? "衍生完成" : "视频处理中" } : r);
    updateTasks();
  };
  const at = (time: number, status: "处理中" | "成功") => {
    const delay = time - Date.now();
    if (delay > 2147483647) setTimeout(() => at(time, status), 2147483647);
    else setTimeout(() => transition(status), Math.max(0, delay));
  };
  at(record.startedAt + 1000, "处理中");
  at(record.startedAt + DERIVATION_TIME_MS, "成功");
}

export function validateDerivationSelection(ids: string[], ownerId: string, statuses?: readonly DerivationStatus[], now = Date.now(), sourceVideoId?: string) {
  requireDerivationPermission(getAdActor());
  const unique = new Set(ids), selected = records.filter(r => unique.has(r.id) && (sourceVideoId ? r.source.id === sourceVideoId : r.ownerId === ownerId));
  if (!ids.length || selected.length !== unique.size) throw new Error(sourceVideoId ? "请选择当前成片的有效衍生记录" : "请选择当前用户的有效记录");
  if (statuses && selected.some(r => !statuses.includes(r.status) || statuses.length === 1 && statuses[0] === "待衍生" && !r.example && now >= r.startedAt + 1000)) throw new Error("所选记录状态已变化，请重新选择符合条件的记录");
  return selected;
}
export function changeDerivations(ids: string[], ownerId: string, action: "cancel" | "retry" | "delete" | "note", note = "", sourceVideoId?: string) {
  const selected = validateDerivationSelection(ids, ownerId, action === "cancel" ? ["待衍生"] : action === "retry" ? ["失败"] : action === "delete" ? ["成功"] : undefined, Date.now(), sourceVideoId);
  if (action === "note") {
    note = note.trim();
    if (note.length > 200) throw new Error("备注最多200个字");
    const userId = getAdActor().id;
    const keywords = note.split(/[,，]/).map(word => word.trim()).filter(Boolean);
    noteHistory = { ...noteHistory, [userId]: [...new Set([...keywords, ...getDerivationNoteHistory(userId)])].slice(0, 30) };
  }
  if (action === "retry") {
    for (const selectedOwner of new Set(selected.map(record => record.ownerId))) {
      const active = records.filter(r => r.ownerId === selectedOwner && !r.example && ["待衍生", "处理中"].includes(r.status)).length;
      const issue = validateDerivationCount(selected.filter(record => record.ownerId === selectedOwner).length, readAdPushSettings().maxDerive, active);
      if (issue) throw new Error(issue);
    }
  }
  const now = Date.now();
  records = records.map(r => !selected.some(s => s.id === r.id) ? r : action === "note" ? { ...r, note, updatedAt: now }
    : action === "retry" ? { ...r, status: "待衍生", driver: "standalone", attempt: r.attempt + 1, startedAt: now, updatedAt: now, message: "已提交重试", example: false }
    : { ...r, status: action === "cancel" ? "取消衍生" : "已删除", url: "", updatedAt: now, message: action === "cancel" ? "用户取消待衍生任务" : "衍生文件已删除，原视频不受影响" });
  if (action === "retry") records.filter(r => ids.includes(r.id)).forEach(schedule);
  updateTasks();
}

// Synchronize only actual submitted push records; preview/validation never creates history.
export function syncPushDerivations(pushes: AdPushRecord[], now = Date.now()) {
  let changed = false;
  const groups = new Map<string, AdPushRecord[]>();
  for (const push of pushes) if (push.derivativeId && push.snapshot.derivation) {
    const key = `${push.operatorId}:${push.derivativeId}`;
    groups.set(key, [...(groups.get(key) || []), push]);
  }
  for (const items of groups.values()) {
    const first = items[0], existing = derivationOutput(first.derivativeId!, first.operatorId);
    if (existing) {
      if (existing.status === "待衍生" && items.every(p => p.status === "已取消")) {
        records = records.map(r => r === existing ? { ...r, status: "取消衍生", updatedAt: now, message: "关联推送已取消" } : r); changed = true;
      }
      continue;
    }
    const cancelled = items.every(p => p.status === "已取消"), age = now - first.startedAt;
    const status: DerivationStatus = cancelled ? "取消衍生" : age >= DERIVATION_TIME_MS ? "成功" : age >= 1000 ? "处理中" : "待衍生";
    const source = first.sourceVideo || { id: first.videoId, title: first.videoTitle, videoUrl: "./assets/viral-gallery/serum.mp4" };
    const record: DerivationRecord = { id: first.derivativeId!, taskId: first.taskId, ownerId: first.operatorId, ownerName: first.operator, source, name: `${first.videoTitle.replace(/\.mp4$/i, "")}_衍生_${first.derivativeId!.split("-").at(-1)}.mp4`, url: status === "成功" ? prototypeOutputUrl(source) : "", status, createdAt: Date.parse(first.createdAt), updatedAt: now, startedAt: first.startedAt, note: "", message: status === "成功" ? "衍生完成" : "衍生并推送", reviewBlocked: null, driver: "push", attempt: 0 };
    records = [...records, record]; changed = true;
    if (["待衍生", "处理中"].includes(status)) schedule(record);
  }
  if (changed) emit();
}

const seeded = new Set<string>();
const seededVideos = new Set<string>();
export function seedVideoDerivationExamples(source: AdVideo, owners: { id: string; name: string }[]) {
  if (!demoOutputMedia[source.id] || seededVideos.has(source.id) || !owners.length) return;
  seededVideos.add(source.id);
  const states: DerivationStatus[] = ["成功", "成功", "成功", "待衍生", "处理中", "失败", "取消衍生", "已删除"];
  const now = Date.now();
  records = [...records, ...states.map((status, index): DerivationRecord => {
    const owner = owners[index % owners.length];
    const id = `DER-${source.id}-DEMO-${index + 1}`;
    return { id, taskId: `TASK-${id}`, ownerId: owner.id, ownerName: owner.name, source,
      name: `${source.title.replace(/\.mp4$/i, "")}_衍生${index + 1}.mp4`,
      url: status === "成功" ? prototypeOutputUrl(source) : "", status,
      createdAt: now - (index + 1) * 3600000, updatedAt: now - (index + 1) * 3600000 + 6000, startedAt: now,
      note: index === 0 ? "首轮投放，关注转化" : index === 1 ? "产品特写版本" : "",
      message: status === "失败" ? "视频解码异常，请重试" : status, reviewBlocked: status === "成功" ? index === 1 : null,
      driver: "standalone", attempt: 0, example: true };
  })];
  emit();
}

export function seedDerivationExamples(ownerId: string) {
  if (!ownerId || seeded.has(ownerId)) return;
  seeded.add(ownerId);
  const now = Date.now(), titles = ["焕肤精华_成分介绍", "轻氧跑鞋_上脚展示", "通勤连衣裙_试穿", "蓝牙耳机_降噪体验", "焕肤精华_质地特写", "腕表_细节展示"];
  const assets = ["serum", "shoes", "dress", "headphones", "skincare-set", "watch"];
  records = [...records, ...DERIVATION_STATUSES.map((status, i): DerivationRecord => ({ id: `DER-DEMO-${ownerId}-${i + 1}`, taskId: `DER-TASK-DEMO-${i + 1}`, ownerId,
    source: { id: `FV-260918-${String(i + 1).padStart(3, "0")}`, title: `${titles[i]}.mp4`, videoUrl: `./assets/viral-gallery/${assets[i]}.mp4`, coverUrl: `./assets/viral-gallery/${assets[i]}.jpg` },
    name: `${titles[i]}_衍生01.mp4`, url: status === "成功" ? `./assets/viral-gallery/${assets[i]}.mp4` : "", status, createdAt: now - (i + 1) * 3600000, updatedAt: now - (i + 1) * 3600000 + 6000, startedAt: now,
    note: i === 0 ? "秋季护肤投放素材" : "", message: status === "失败" ? "视频解码异常，请重试" : status === "已删除" ? "衍生文件已删除，原视频保留" : status,
    reviewBlocked: i === 0 ? false : null, driver: "standalone", attempt: 0, example: true }))];
  emit();
}

// Prototype outputs reuse bundled samples or source media, without transcoding or library upload.
export function submitDerivation(sourceVideoId: string, count: number, ownerId: string, activePushCount = 0, source?: AdVideo) {
  requireDerivationPermission(getAdActor());
  const issue = validateDerivationCount(count, readAdPushSettings().maxDerive, activeDerivationCount(ownerId) + activePushCount);
  if (issue) throw new Error(issue);
  const task: DerivationTask = { id: crypto.randomUUID(), sourceVideoId, ownerId, count, createdAt: Date.now(), status: "处理中", resultIds: [] };
  tasks = [...tasks, task];
  const outputs: DerivationRecord[] = Array.from({ length: count }, (_, i) => ({ id: `${task.id}-${i + 1}`, taskId: task.id, ownerId, source: source || { id: sourceVideoId, title: sourceVideoId }, name: `${(source?.title || sourceVideoId).replace(/\.mp4$/i, "")}_衍生${i + 1}.mp4`, url: "", status: "待衍生", createdAt: task.createdAt, updatedAt: task.createdAt, startedAt: task.createdAt, note: "", message: "任务已提交", reviewBlocked: null, driver: "standalone", attempt: 0 }));
  records = [...records, ...outputs.map(record => ({ ...record, ownerName: getAdActor().name }))];
  outputs.forEach(schedule);
  emit();
  return task;
}
