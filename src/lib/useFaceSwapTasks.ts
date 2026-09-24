import { useEffect, useRef, useState } from "react";
import type { WatermarkVideo } from "../types";
import { createFaceSwapDemo, getFaceDemoProcessingOutcome } from "../data/faceSwapDemo";
import { advanceFaceSwap, beginFaceSwap, cancelFaceSwap, faceSwapTask, isFaceSwapBusy, FACE_ANALYSIS_MS, FACE_QUEUE_MS, FACE_PROCESS_MS, type FaceSwapSession } from "./videoFaceSwap";

const FACE_DEMO_VIDEO = "./assets/face-swap/demo.mp4";
const FACE_DEMO_COVER = "./assets/face-swap/portrait-a.jpg";

const createStaticFaceSessions = () => {
  const now = Date.now();
  const phases: Array<"queue" | "processing" | "succeeded" | "failed" | "cancelled"> = ["queue", "processing", "succeeded", "failed", "cancelled"];
  const phaseLabels = { queue: "排队中", processing: "生成中", succeeded: "生成成功", failed: "生成失败", cancelled: "已取消" };
  return Object.fromEntries(phases.map((phase, index) => {
    const source = { id: `face-demo-queue-${phase}`, name: `美妆口播案例_${phaseLabels[phase]}.mp4`, url: FACE_DEMO_VIDEO, coverUrl: FACE_DEMO_COVER, size: "12.8 MB", duration: 6, resolution: "1080 x 1920" };
    let session = advanceFaceSwap(createFaceSwapDemo(source, now), now + FACE_ANALYSIS_MS);
    session = { ...session, groups: session.groups.map((group, groupIndex) => ({ ...group, portrait: { id: `demo-portrait-${groupIndex}`, name: `人像0${groupIndex + 1}.jpg`, url: `./assets/face-swap/portrait-${String.fromCharCode(97 + groupIndex)}.jpg` } })) };
    const started = beginFaceSwap(session, `face-demo-attempt-${phase}`, now - (phase === "processing" ? FACE_QUEUE_MS + 500 : 100));
    if (started === session) return [`face-demo-${phase}`, { ...session, demoStatic: true }];
    if (phase === "queue") return [`face-demo-${phase}`, { ...started, demoStatic: true }];
    if (phase === "processing") return [`face-demo-${phase}`, { ...started, phase: "processing", attempts: started.attempts.map((attempt) => ({ ...attempt, status: "processing" as const })), demoStatic: true }];
    const completed = advanceFaceSwap({ ...started, attempts: started.attempts.map((attempt) => ({ ...attempt, outcome: phase === "failed" ? "failure" as const : attempt.outcome })) }, now + FACE_QUEUE_MS + FACE_PROCESS_MS + 100);
    if (phase === "cancelled") return [`face-demo-${phase}`, { ...started, phase: "cancelled", attempts: started.attempts.map((attempt) => ({ ...attempt, status: "cancelled" as const, refunded: attempt.cost })), demoStatic: true }];
    return [`face-demo-${phase}`, { ...completed, demoStatic: true }];
  }));
};

export function useFaceSwapTasks(onCharge: (amount: number, description: string) => boolean, onRefund: (amount: number, description: string) => void) {
  const sessions = useRef<Record<string, FaceSwapSession>>(createStaticFaceSessions());
  const [snapshot, setSnapshot] = useState(sessions.current);
  const [now, setNow] = useState(Date.now());
  const callbacks = useRef({ onCharge, onRefund });
  callbacks.current = { onCharge, onRefund };

  const commit = (id: string, next: FaceSwapSession) => {
    const previous = sessions.current[id];
    if (previous === next) return;
    sessions.current = { ...sessions.current, [id]: next };
    setSnapshot(sessions.current);
    const refund = next.attempts.reduce((sum, attempt) => sum + attempt.refunded, 0) - (previous?.attempts.reduce((sum, attempt) => sum + attempt.refunded, 0) || 0);
    if (refund > 0) callbacks.current.onRefund(refund, `视频换脸：${next.source.name}，本次${next.phase === "cancelled" ? "排队取消" : "处理失败"}`);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      const timestamp = Date.now();
      let active = false;
      for (const [id, session] of Object.entries(sessions.current)) {
        if (!isFaceSwapBusy(session) || session.demoStatic) continue;
        active = true;
        commit(id, advanceFaceSwap(session, timestamp));
      }
      if (active) setNow(timestamp);
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return {
    tasks: Object.entries(snapshot).map(([id, session]) => faceSwapTask(id, session, now)),
    create: (source: WatermarkVideo) => {
      const id = `face-swap-${crypto.randomUUID()}`;
      commit(id, createFaceSwapDemo(source, Date.now()));
      return id;
    },
    update: (id: string, update: (session: FaceSwapSession) => FaceSwapSession) => {
      const session = sessions.current[id];
      if (session) commit(id, update(session));
    },
    submit: (id: string) => {
      const current = sessions.current[id];
      if (!current) return false;
      const next = beginFaceSwap(current, crypto.randomUUID(), Date.now(), getFaceDemoProcessingOutcome(current.source.id));
      if (next === current) return false;
      if (!callbacks.current.onCharge(40, `视频换脸：${current.source.name}，第${next.attempts.length}次处理`)) return false;
      commit(id, next);
      setNow(Date.now());
      return true;
    },
    cancel: (id: string) => {
      const session = sessions.current[id];
      if (session) commit(id, cancelFaceSwap(session, Date.now()));
    },
  };
}
