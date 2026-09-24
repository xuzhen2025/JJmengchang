import { useSyncExternalStore } from "react";
import { resourceConfigStore } from "./resourceConfig";
import { resourceTagStore } from "./resourceTags";

export interface ThirdPartyLifecycle {
  state: "active" | "trash" | "deleted";
  deletedAt?: string;
  deletedBy?: string;
  deletedSource?: "用户端" | "管理端";
}
let entries: Record<string, ThirdPartyLifecycle> = {};
const listeners = new Set<() => void>();
export const getThirdPartyLifecycle = () => entries;
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const useThirdPartyLifecycle = () => useSyncExternalStore(subscribe, getThirdPartyLifecycle);

export function changeThirdPartyLifecycle(ids: string[], state: ThirdPartyLifecycle["state"], source: "用户端" | "管理端" = "管理端") {
  const next = { ...entries };
  for (const id of ids) {
    if (next[id]?.state === "deleted") continue;
    if (state === "deleted" && next[id]?.state !== "trash") continue;
    next[id] = state === "trash"
      ? { state, deletedAt: new Date().toLocaleString("sv-SE"), deletedBy: "徐振", deletedSource: source }
      : { state };
    if (state === "deleted") {
      resourceConfigStore.removeResource("thirdParty", id);
      resourceTagStore.removeResource("thirdParty", id);
    }
  }
  entries = next;
  listeners.forEach(listener => listener());
}
