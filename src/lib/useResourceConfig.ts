import { useEffect, useRef, useSyncExternalStore } from "react";
import { ConfigurableResource, resourceConfigStore } from "./resourceConfig";

export function useResourceConfig() {
  const revision = useSyncExternalStore(resourceConfigStore.subscribe, resourceConfigStore.getSnapshot);
  return { revision, store: resourceConfigStore };
}
export function useResourceConfigState(scope: string, resource: ConfigurableResource, field: "status" | "category") {
  useResourceConfig();
  const value = resourceConfigStore.project(scope, resource)[field] || "";
  const setValue = (next: string) => resourceConfigStore.assign(scope, resource, { [field]: next });
  return [value, setValue] as const;
}
export function useConfigFilter(scope: string, field: "status" | "primary" | "secondary", value: string, onChange: (value: string) => void, all = "全部") {
  const { revision } = useResourceConfig();
  const entries = () => field === "status" ? resourceConfigStore.statuses(scope) : field === "primary" ? resourceConfigStore.categories(scope) : resourceConfigStore.categories(scope).flatMap(n => n.children);
  const previous = useRef(entries());
  useEffect(() => {
    const old = previous.current.find(n => n.name === value);
    const current = entries();
    previous.current = current;
    if (old) {
      const next = current.find(n => n.id === old.id)?.name || all;
      if (next !== value) onChange(next);
    } else if (value !== all && !current.some(n => n.name === value)) onChange(all);
  }, [revision, value, scope, field]);
}
