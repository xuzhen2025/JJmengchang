export interface TaskFieldItem {
  id: string; name: string; type: string; isRequired: boolean; options: string[];
  legacyKey?: "product" | "scriptType";
}
export type TaskFieldValues = Record<string, string | string[]>;
export interface TaskFieldSnapshot { fields: TaskFieldItem[]; values: TaskFieldValues }
export const INITIAL_TASK_FIELDS: TaskFieldItem[] = [
  { id: "tf-product", name: "产品", type: "单选", isRequired: true, legacyKey: "product", options: ["抗衰精华液", "无钢圈内衣", "防晒冰袖", "加绒风衣", "星光吊坠", "补水面膜", "修护霜", "复古马丁靴"] },
  { id: "tf-script-type", name: "脚本类型", type: "单选", isRequired: false, legacyKey: "scriptType", options: ["口播种草", "痛点对比", "剧情演绎", "混剪卡点", "特写展示", "开箱测评"] },
];
export function snapshotTaskFields(fields: TaskFieldItem[], values: TaskFieldValues): TaskFieldSnapshot {
  return structuredClone({ fields, values: Object.fromEntries(fields.map(field => [field.id, values[field.id] ?? (field.type === "多选" ? [] : "")])) });
}
export function legacyTaskFields(task: { product?: string; scriptType?: string }): TaskFieldSnapshot {
  const fields = structuredClone(INITIAL_TASK_FIELDS);
  for (const field of fields) {
    const value = field.legacyKey && task[field.legacyKey];
    if (value && !field.options.includes(value)) field.options.push(value);
  }
  return snapshotTaskFields(fields, { "tf-product": task.product || "", "tf-script-type": task.scriptType || "" });
}
export function taskFieldErrors(fields: TaskFieldItem[], values: TaskFieldValues) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.id] ?? "";
    const empty = Array.isArray(value) ? !value.length : !String(value).trim();
    if (field.isRequired && empty) errors[field.id] = `请填写${field.name}`;
    if (empty) continue;
    if (["单选", "多选"].includes(field.type) && (Array.isArray(value) ? value : [value]).some(v => !field.options.includes(v))) errors[field.id] = `请重新选择${field.name}`;
    if (field.type === "数字" && !Number.isFinite(Number(value))) errors[field.id] = "请输入有效数字";
    if (field.type === "链接") { try { const url = new URL(String(value)); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { errors[field.id] = "请输入有效的 HTTP 或 HTTPS 链接"; } }
  }
  return errors;
}
export function createTaskFieldStore() {
  let fields = structuredClone(INITIAL_TASK_FIELDS);
  let settings = { enabled: true, assignTarget: "all" as "all" | "team" | "group" };
  const listeners = new Set<() => void>();
  let revision = 0;
  const emit = () => { revision++; listeners.forEach(listener => listener()); };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => revision,
    getFields: () => fields,
    getSettings: () => settings,
    setSettings(value: typeof settings) { settings = { ...value }; emit(); },
    setFields(update: TaskFieldItem[] | ((previous: TaskFieldItem[]) => TaskFieldItem[])) {
      const next = typeof update === "function" ? update(fields) : update;
      if (next.some(f => !f.name.trim()) || new Set(next.map(f => f.name.trim())).size !== next.length) throw new Error("字段名称不能为空或重复");
      if (next.some(f => ["单选", "多选"].includes(f.type) && (!f.options.length || new Set(f.options).size !== f.options.length))) throw new Error("选择类字段至少需要一个选项，且选项不能重复");
      fields = structuredClone(next); emit();
    },
  };
}
export const taskFieldStore = createTaskFieldStore();
