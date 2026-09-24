import { useSyncExternalStore } from "react";
import { taskFieldStore } from "./taskFieldConfig";
export function useTaskFields() {
  useSyncExternalStore(taskFieldStore.subscribe, taskFieldStore.getSnapshot);
  return { fields: taskFieldStore.getFields(), settings: taskFieldStore.getSettings(), store: taskFieldStore };
}
