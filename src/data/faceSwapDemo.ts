import type { FaceCrop, FaceGroup, FaceSwapSession } from "../lib/videoFaceSwap";
import type { WatermarkVideo } from "../types";

export const FACE_DEMO_PORTRAITS = [
  { id: "face-portrait-a", name: "人像01.jpg", url: "./assets/face-swap/portrait-a.jpg" },
  { id: "face-portrait-b", name: "人像02.jpg", url: "./assets/face-swap/portrait-b.jpg" },
  { id: "face-portrait-c", name: "人像03.jpg", url: "./assets/face-swap/portrait-c.jpg" },
];

// Fixtures deliberately include an over-split identity and an incorrectly mixed group.
// They exercise grouping corrections, not a real identity-recognition algorithm.
export function createFaceSwapDemo(source: WatermarkVideo, now: number): FaceSwapSession {
  const crops: FaceCrop[] = [0, 0, 1, 1, 2, 0, 0].map((person, index) => ({
    id: `${source.id}-crop-${index}`, url: FACE_DEMO_PORTRAITS[person].url,
    timestamp: source.duration * [0.08, 0.24, 0.36, 0.48, 0.58, 0.72, 0.88][index], sourceVideoId: source.id,
    region: { x: 0.32, y: 0.15, width: 0.25, height: 0.38 },
  }));
  const groups: FaceGroup[] = [[0, 1], [2, 3, 4], [5, 6]].map((indices, index) => ({
    id: `${source.id}-group-${index}`, name: `角色${index + 1}`, cropIds: indices.map((i) => crops[i].id), portrait: null,
  }));
  const noFaces = source.id === "face-demo-no-faces";
  return { source, phase: "analyzing", analysisStartedAt: now, analysisOutcome: noFaces ? "no_faces" : "success", crops: noFaces ? [] : crops, groups: noFaces ? [] : groups,
    undo: [], attempts: [], versions: [], selectedVersionId: null, view: "settings", error: "" };
}

export const getFaceDemoProcessingOutcome = (sourceId: string) => sourceId === "face-demo-processing-failure" ? "failure" as const : "success" as const;
