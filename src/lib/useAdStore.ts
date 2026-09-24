import { useEffect, useState } from "react";
import { AD_CHANGE_EVENT, AD_STORE_KEY, advanceAdStore, readAdStore, updateAdStore } from "./adPush";
import { saveResourceEdits } from "./useResourceEdits";
import { syncPushDerivations } from "./videoDerivation";

export function useAdStore() {
  const [store, setStore] = useState(readAdStore);
  useEffect(() => {
    syncPushDerivations(readAdStore().records);
    const refresh = () => setStore(readAdStore());
    const storage = (e: StorageEvent) => { if (e.key === AD_STORE_KEY || e.key === "cloud_video_roles_v2" || e.key === "mengchang_prototype_session") refresh(); };
    window.addEventListener(AD_CHANGE_EVENT, refresh);
    window.addEventListener("storage", storage);
    const timer = window.setInterval(() => {
      const current = readAdStore();
      const next = advanceAdStore(current);
      const pending = next.records.filter(r => r.status === "推送成功" && !r.resourceStateApplied && r.snapshot.successStatus);
      const patches: Record<string, { status: string }> = {};
      // Apply oldest first so the latest submitted success wins for the same video.
      pending.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(r => { patches[r.videoId] = { status: r.snapshot.successStatus! }; });
      const applied = pending.length > 0 && saveResourceEdits("finished", patches);
      if (next !== current || applied) updateAdStore(s => {
        const advanced = advanceAdStore(s);
        return applied ? { ...advanced, records: advanced.records.map(r => pending.some(p => p.id === r.id) ? { ...r, resourceStateApplied: true } : r) } : advanced;
      });
    }, 500);
    return () => { window.clearInterval(timer); window.removeEventListener(AD_CHANGE_EVENT, refresh); window.removeEventListener("storage", storage); };
  }, []);
  return store;
}
