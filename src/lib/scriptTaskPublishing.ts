import type { TaskItem } from "../components/TaskCollaborationView";
import { snapshotTaskFields, TaskFieldItem, TaskFieldValues } from "./taskFieldConfig";

export function createScriptTask(script: { id: string; title: string }, form: {
  assigneePath: string; orderCount: number | string; deadlineDate: string; remark: string;
  visibilityType: "none" | "specified"; visibilityRange: "public" | "public_resource" | "specified_range";
  specifiedTeam: string; specifiedGroup: string; specifiedPerson: string; publicDate: string;
}, fields: TaskFieldItem[], values: TaskFieldValues): TaskItem {
  const legacyValue = (key: "product" | "scriptType") => {
    const field = fields.find(item => item.legacyKey === key);
    const value = field && values[field.id];
    return Array.isArray(value) ? value.join("、") : value || "";
  };
  return {
    ...form, id: `task-${crypto.randomUUID()}`, publisher: "徐振", publishDate: new Date().toLocaleString("sv-SE"),
    assignee: form.assigneePath.split("/").pop()?.trim() || "", assigneeDeptPath: form.assigneePath,
    orderCount: Number(form.orderCount), completedCount: 0, status: "pending", cost: 0,
    product: legacyValue("product"), scriptType: legacyValue("scriptType"),
    customFields: snapshotTaskFields(fields, values),
    associatedScript: { id: script.id, title: script.title, status: "待审核" },
  };
}
