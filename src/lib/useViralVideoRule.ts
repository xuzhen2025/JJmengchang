import { useEffect, useState } from "react";
import { getVideoSpendMonth, loadViralVideoRule, VIRAL_VIDEO_RULE_CHANGE_EVENT, VIRAL_VIDEO_RULE_STORAGE_KEY } from "./viralVideoRule";

export function useViralVideoRule() {
  const [rule, setRule] = useState(loadViralVideoRule);
  const [month, setMonth] = useState(getVideoSpendMonth);

  useEffect(() => {
    const update = () => {
      const next = loadViralVideoRule();
      setRule(current => current.period === next.period && current.thresholdWan === next.thresholdWan ? current : next);
      setMonth(getVideoSpendMonth());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === VIRAL_VIDEO_RULE_STORAGE_KEY || event.key === null) update();
    };
    const timer = window.setInterval(() => setMonth(getVideoSpendMonth()), 60_000);
    window.addEventListener(VIRAL_VIDEO_RULE_CHANGE_EVENT, update);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(VIRAL_VIDEO_RULE_CHANGE_EVENT, update);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return { rule, month };
}
