import type { Task, WatermarkVideo } from "../types";

export const FACE_SWAP_COST = 40;
export const FACE_ANALYSIS_MS = 3000;
export const FACE_QUEUE_MS = 2000;
export const FACE_PROCESS_MS = 4000;

export interface FaceCrop {
  id: string;
  url: string;
  timestamp: number;
  sourceVideoId: string;
  region: { x: number; y: number; width: number; height: number };
}

export interface FacePortrait {
  id: string;
  name: string;
  url: string;
}

export interface FaceGroup {
  id: string;
  name: string;
  cropIds: string[];
  portrait: FacePortrait | null;
}

export interface FaceSwapAttempt {
  id: string;
  startedAt: number;
  status: "queue" | "processing" | "succeeded" | "failed" | "cancelled";
  groups: FaceGroup[];
  cost: number;
  refunded: number;
  outcome: "success" | "failure";
}

export interface FaceSwapVersion {
  id: string;
  number: number;
  attemptId: string;
  createdAt: number;
  name: string;
  videoUrl: string;
  groups: FaceGroup[];
  prototype: true;
}

export interface FaceSwapSession {
  source: WatermarkVideo;
  phase: "analyzing" | "ready" | "queue" | "processing" | "succeeded" | "failed" | "cancelled" | "analysis_failed";
  analysisStartedAt: number;
  analysisOutcome: "success" | "no_faces" | "failure";
  crops: FaceCrop[];
  groups: FaceGroup[];
  undo: FaceGroup[][];
  attempts: FaceSwapAttempt[];
  versions: FaceSwapVersion[];
  selectedVersionId: string | null;
  view: "settings" | "result";
  error: string;
  demoStatic?: boolean;
}

export const cloneGroups = (groups: FaceGroup[]) => groups.map((group) => ({
  ...group, cropIds: [...group.cropIds], portrait: group.portrait ? { ...group.portrait } : null,
}));

export const isFaceSwapBusy = (session: FaceSwapSession) => ["analyzing", "queue", "processing"].includes(session.phase);

export function mergeFaceGroups(session: FaceSwapSession, sourceId: string, targetId: string): FaceSwapSession {
  if (isFaceSwapBusy(session) || sourceId === targetId) return session;
  const source = session.groups.find((group) => group.id === sourceId);
  const target = session.groups.find((group) => group.id === targetId);
  if (!source || !target) return session;
  return { ...session, undo: [...session.undo, cloneGroups(session.groups)], groups: session.groups
    .filter((group) => group.id !== sourceId)
    .map((group) => group.id === targetId ? { ...group, cropIds: [...new Set([...group.cropIds, ...source.cropIds])] } : group) };
}

export function splitFaceGroup(session: FaceSwapSession, sourceId: string, selectedIds: string[], newId: string): FaceSwapSession {
  if (isFaceSwapBusy(session) || session.groups.some((group) => group.id === newId)) return session;
  const source = session.groups.find((group) => group.id === sourceId);
  if (!source) return session;
  const selected = source.cropIds.filter((id) => selectedIds.includes(id));
  if (!selected.length || selected.length === source.cropIds.length) return session;
  const number = Math.max(0, ...session.groups.map((group) => Number(group.name.match(/\d+$/)?.[0]) || 0)) + 1;
  return { ...session, undo: [...session.undo, cloneGroups(session.groups)], groups: [
    ...session.groups.map((group) => group.id === sourceId ? { ...group, cropIds: group.cropIds.filter((id) => !selected.includes(id)) } : group),
    { id: newId, name: `角色${number}`, cropIds: selected, portrait: null },
  ] };
}

export function undoFaceGrouping(session: FaceSwapSession): FaceSwapSession {
  if (isFaceSwapBusy(session) || !session.undo.length) return session;
  return { ...session, groups: cloneGroups(session.undo[session.undo.length - 1]), undo: session.undo.slice(0, -1) };
}

export function beginFaceSwap(session: FaceSwapSession, id: string, now: number, outcome: FaceSwapAttempt["outcome"] = "success"): FaceSwapSession {
  if (!["ready", "succeeded", "failed", "cancelled"].includes(session.phase) || !session.groups.some((group) => group.portrait) || !session.crops.length) return session;
  const attempt: FaceSwapAttempt = { id, startedAt: now, status: "queue", groups: cloneGroups(session.groups), cost: FACE_SWAP_COST, refunded: 0, outcome };
  return { ...session, phase: "queue", attempts: [...session.attempts, attempt], undo: [], view: "result", error: "" };
}

export function cancelFaceSwap(session: FaceSwapSession, now: number): FaceSwapSession {
  const last = session.attempts.at(-1);
  if (session.phase !== "queue" || !last || now - last.startedAt >= FACE_QUEUE_MS) return session;
  return { ...session, phase: "cancelled", attempts: session.attempts.map((attempt) => attempt.id === last.id ? { ...attempt, status: "cancelled", refunded: attempt.cost } : attempt) };
}

export function advanceFaceSwap(session: FaceSwapSession, now: number): FaceSwapSession {
  if (session.phase === "analyzing") {
    if (now - session.analysisStartedAt < FACE_ANALYSIS_MS) return session;
    const error = session.analysisOutcome === "failure" ? "视频分析失败，请重新分析或更换视频。" : session.analysisOutcome === "no_faces" ? "未识别到可用人脸，请更换视频。" : "";
    return { ...session, phase: error ? "analysis_failed" : "ready", error };
  }
  const last = session.attempts.at(-1);
  if (!last || !["queue", "processing"].includes(session.phase)) return session;
  const elapsed = now - last.startedAt;
  if (elapsed < FACE_QUEUE_MS) return session;
  if (elapsed < FACE_QUEUE_MS + FACE_PROCESS_MS) {
    if (session.phase === "processing") return session;
    return { ...session, phase: "processing", attempts: session.attempts.map((attempt) => attempt.id === last.id ? { ...attempt, status: "processing" } : attempt) };
  }
  if (last.outcome === "failure") {
    return { ...session, phase: "failed", error: "换脸处理失败，本次40积分已退回，历史版本不受影响。", attempts: session.attempts.map((attempt) => attempt.id === last.id ? { ...attempt, status: "failed", refunded: attempt.cost } : attempt) };
  }
  const number = session.versions.length + 1;
  // Prototype output retains the full source media. A real adapter must provide an encoded result.
  const extension = session.source.name.match(/\.(mp4|mpeg|mov)$/i)?.[1].toLowerCase() || "mp4";
  const version: FaceSwapVersion = { id: `${last.id}-result`, number, attemptId: last.id, createdAt: now, name: `${session.source.name.replace(/\.[^.]+$/, "")}_换脸_版本${number}.${extension}`, videoUrl: session.source.url, groups: cloneGroups(last.groups), prototype: true };
  return { ...session, phase: "succeeded", versions: [...session.versions, version], selectedVersionId: version.id, attempts: session.attempts.map((attempt) => attempt.id === last.id ? { ...attempt, status: "succeeded" } : attempt) };
}

export function getFaceSwapProgress(session: FaceSwapSession, now: number) {
  if (session.phase === "analyzing") return Math.min(99, Math.max(0, Math.floor((now - session.analysisStartedAt) / FACE_ANALYSIS_MS * 100)));
  if (session.phase === "queue") return 0;
  if (session.phase === "processing") return Math.min(99, Math.max(0, Math.floor((now - (session.attempts.at(-1)?.startedAt || now) - FACE_QUEUE_MS) / FACE_PROCESS_MS * 100)));
  return session.phase === "succeeded" || session.phase === "ready" ? 100 : 0;
}

export const FACE_PHASE_LABELS: Record<FaceSwapSession["phase"], string> = {
  analyzing: "分析中", ready: "待配置", queue: "排队中", processing: "处理中", succeeded: "处理成功", failed: "处理失败", cancelled: "已取消", analysis_failed: "分析失败",
};

export function faceSwapTask(id: string, session: FaceSwapSession, now: number): Task {
  const status: Task["status"] = session.phase === "analyzing" || session.phase === "processing" ? "generating" : session.phase === "ready" ? "ready" : session.phase === "succeeded" ? "completed" : session.phase === "analysis_failed" ? "failed" : session.phase;
  return { id, name: `${session.source.name.replace(/\.[^.]+$/, "")}_视频换脸`, type: "face_swap", category: "face_swap", source: "tool", status,
    progress: getFaceSwapProgress(session, now), inputFiles: [session.source.url], outputFiles: session.versions.map((version) => version.videoUrl),
    createdAt: new Date(session.analysisStartedAt).toISOString().replace("T", " ").slice(0, 19),
    creditsCost: session.attempts.reduce((sum, attempt) => sum + attempt.cost, 0), refundedCredits: session.attempts.reduce((sum, attempt) => sum + attempt.refunded, 0),
    autoProgress: false, restartable: false, cancellable: session.phase === "queue", failureReason: session.error || undefined, faceSwap: session };
}
