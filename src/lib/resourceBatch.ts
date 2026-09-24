import type { AssociatedScript } from "../data/videoResourceOptions";
import type { VideoResourcePickerItem } from "../components/VideoResourcePickerModal";
import { parseDurationSeconds } from "./videoEnhance";

export interface RelatedResourceVideo {
  id: string;
  type: string;
  code: string;
  duration: string;
  durationNum: number;
  title: string;
  author: string;
  avatar: string;
  cover: string;
  date: string;
  syncTime: string;
  viewCount: number;
  useCount: number;
  color: string;
  videoUrl?: string;
  videoDuration?: string;
  status?: string;
  category?: string;
  tags?: string[];
}

export interface VideoResourceMetadata {
  tags?: string[];
  personalTags?: string[];
  status?: string;
  category?: string;
  associatedScripts?: AssociatedScript[];
  relatedVideos?: RelatedResourceVideo[];
  notes?: string;
  notesHistory?: Array<{ id: string; timestamp: string; content: string }>;
}

export type VideoBatchChange =
  | { kind: "publicTags" | "personalTags"; tags: string[] }
  | { kind: "status" | "category"; value: string }
  | { kind: "scripts"; scripts: AssociatedScript[] }
  | { kind: "videos"; videos: RelatedResourceVideo[] };

export function appendTags(existing: string[] = [], added: string[] = []): string[] {
  return Array.from(new Set([...existing, ...added]));
}

export function appendById<T extends { id: string }>(existing: T[] = [], added: T[] = []): T[] {
  const ids = new Set(existing.map(item => item.id));
  return [...existing, ...added.filter(item => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  })];
}

export function applyVideoBatchChange<T extends VideoResourceMetadata & { id: string }>(
  records: T[], selectedIds: string[], change: VideoBatchChange,
): T[] {
  const selected = new Set(selectedIds);
  return records.map(record => {
    if (!selected.has(record.id)) return record;
    switch (change.kind) {
      case "publicTags": return { ...record, tags: appendTags(record.tags, change.tags) };
      case "personalTags": return { ...record, personalTags: appendTags(record.personalTags, change.tags) };
      case "status": return { ...record, status: change.value };
      case "category": return { ...record, category: change.value };
      case "scripts": return { ...record, associatedScripts: appendById(record.associatedScripts, change.scripts) };
      case "videos": return { ...record, relatedVideos: appendById(record.relatedVideos, change.videos.filter(item => item.id !== record.id)) };
    }
  });
}

export function toRelatedVideo(video: VideoResourcePickerItem): RelatedResourceVideo {
  const durationNum = parseDurationSeconds(video.duration, 0);
  const now = new Date().toLocaleString("zh-CN", { hour12: false });
  return {
    id: video.id, type: video.section, title: video.name, cover: video.cover,
    code: video.id.replace(/\D/g, "").slice(-8) || video.id,
    duration: video.duration, durationNum, author: video.author,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    date: now.split(" ")[0], syncTime: now, viewCount: 0, useCount: 0,
    color: video.section === "成片" ? "#8b5cf6" : "#06b6d4",
    videoUrl: video.url, videoDuration: video.duration, status: video.status,
    category: [video.primaryCategory, video.secondaryCategory].filter(Boolean).join(" / "), tags: video.tags,
  };
}

export interface DownloadResource { id: string; title: string; videoUrl: string }

export async function downloadResourceFiles(
  records: DownloadResource[],
  save: (blob: Blob, name: string) => void,
  signal?: AbortSignal,
  fetchFile: typeof fetch = fetch,
) {
  const succeeded: string[] = [];
  const failed: string[] = [];
  for (const record of records) {
    if (signal?.aborted) break;
    try {
      const timeout = AbortSignal.timeout(20000);
      const response = await fetchFile(record.videoUrl, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size || blob.type.includes("text/html")) throw new Error("Invalid resource file");
      save(blob, record.title);
      succeeded.push(record.id);
    } catch {
      if (signal?.aborted) break;
      failed.push(record.id);
    }
  }
  return { succeeded, failed };
}
