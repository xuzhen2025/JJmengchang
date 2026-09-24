export type ScriptTemplateFieldType =
  | "文本"
  | "单选"
  | "多选"
  | "图片"
  | "附件"
  | "链接"
  | "数字"
  | "时间";

export interface ScriptTemplateField {
  id: string;
  title: string;
  type: ScriptTemplateFieldType;
  displayMode: "column" | "row";
  placeholder?: string;
  options?: string[];
}

export interface ScriptTemplate {
  id: string;
  title: string;
  columnGroupTitle: string;
  enabled: boolean;
  fields: ScriptTemplateField[];
}

export const SCRIPT_TEMPLATE_STORAGE_KEY = "cloud_video_script_templates_v3";
export const SCRIPT_TEMPLATE_CHANGE_EVENT = "cloud-video-script-templates-changed";

const scriptTypeField = (prefix: string): ScriptTemplateField => ({
  id: `${prefix}-script-type`,
  title: "脚本类型（大类）",
  type: "多选",
  displayMode: "row",
  placeholder: "请选择脚本类型",
  options: ["剧情", "达人", "AI"],
});

const modelField = (prefix: string): ScriptTemplateField => ({
  id: `${prefix}-model`,
  title: "模特选择",
  type: "文本",
  displayMode: "row",
  placeholder: "请输入模特要求，例如年龄、性别、形象与气质",
});

const sceneField = (prefix: string): ScriptTemplateField => ({
  id: `${prefix}-scene`,
  title: "场景选择",
  type: "文本",
  displayMode: "row",
  placeholder: "请输入拍摄场景、布景及环境要求",
});

const insightField = (prefix: string): ScriptTemplateField => ({
  id: `${prefix}-insight`,
  title: "个人理解该本子的爆点精髓",
  type: "文本",
  displayMode: "row",
  placeholder: "请输入对脚本爆点、节奏与转化逻辑的理解",
});

const benchmarkVideoField = (prefix: string): ScriptTemplateField => ({
  id: `${prefix}-benchmark-video`,
  title: "对标视频",
  type: "附件",
  displayMode: "row",
  placeholder: "请选择一个或多个对标视频",
});

export const DEFAULT_SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: "script-template-benchmark",
    title: "对标翻拍",
    columnGroupTitle: "对标翻拍",
    enabled: true,
    fields: [
      { id: "benchmark-source-copy", title: "对标文案", type: "文本", displayMode: "column", placeholder: "请输入对标视频原文案" },
      { id: "benchmark-derived-copy", title: "衍生文案", type: "文本", displayMode: "column", placeholder: "请输入基于对标内容创作的衍生文案" },
      { id: "benchmark-extra", title: "脚本特别补充", type: "文本", displayMode: "column", placeholder: "请输入脚本的特别补充" },
      scriptTypeField("benchmark"),
      benchmarkVideoField("benchmark"),
      modelField("benchmark"),
      sceneField("benchmark"),
      insightField("benchmark"),
    ],
  },
  {
    id: "script-template-derivative",
    title: "二创衍生",
    columnGroupTitle: "二创衍生",
    enabled: true,
    fields: [
      { id: "derivative-source-copy", title: "对标文案、故事线", type: "文本", displayMode: "column", placeholder: "请输入对标文案与原视频故事线" },
      { id: "derivative-new-copy", title: "二创衍生文案", type: "文本", displayMode: "column", placeholder: "请输入二创后的衍生文案" },
      { id: "derivative-extra", title: "脚本特别补充", type: "文本", displayMode: "column", placeholder: "请输入脚本的特别补充" },
      scriptTypeField("derivative"),
      benchmarkVideoField("derivative"),
      modelField("derivative"),
      sceneField("derivative"),
      insightField("derivative"),
    ],
  },
  {
    id: "script-template-original",
    title: "原创",
    columnGroupTitle: "原创",
    enabled: true,
    fields: [
      { id: "original-copy", title: "原创文案", type: "文本", displayMode: "column", placeholder: "请输入原创脚本文案" },
      { id: "original-extra", title: "脚本特别补充", type: "文本", displayMode: "column", placeholder: "请输入脚本的特别补充" },
      scriptTypeField("original"),
      modelField("original"),
      sceneField("original"),
      insightField("original"),
    ],
  },
];

const cloneTemplates = (templates: ScriptTemplate[]) =>
  templates.map((template) => ({
    ...template,
    fields: template.fields.map((field) => ({
      ...field,
      options: field.options ? [...field.options] : undefined,
    })),
  }));

const isFieldType = (value: unknown): value is ScriptTemplateFieldType =>
  ["文本", "单选", "多选", "图片", "附件", "链接", "数字", "时间"].includes(String(value));

const normalizeTemplates = (value: unknown): ScriptTemplate[] | null => {
  if (!Array.isArray(value)) return null;
  const templates = value.filter((template): template is Omit<ScriptTemplate, "columnGroupTitle"> & { columnGroupTitle?: unknown } => {
    if (!template || typeof template !== "object") return false;
    const candidate = template as Partial<ScriptTemplate>;
    return typeof candidate.id === "string"
      && typeof candidate.title === "string"
      && typeof candidate.enabled === "boolean"
      && Array.isArray(candidate.fields)
      && candidate.fields.every((field) => {
        if (!field || typeof field !== "object") return false;
        const item = field as Partial<ScriptTemplateField>;
        return typeof item.id === "string"
          && typeof item.title === "string"
          && isFieldType(item.type)
          && (item.displayMode === "column" || item.displayMode === "row");
      });
  });
  if (templates.length !== value.length) return null;
  return cloneTemplates(templates.map((template) => ({
    ...template,
    columnGroupTitle: typeof template.columnGroupTitle === "string" && template.columnGroupTitle.trim()
      ? template.columnGroupTitle.trim()
      : template.title,
  })));
};

export const loadScriptTemplates = (): ScriptTemplate[] => {
  if (typeof window === "undefined") return cloneTemplates(DEFAULT_SCRIPT_TEMPLATES);
  try {
    const stored = window.localStorage.getItem(SCRIPT_TEMPLATE_STORAGE_KEY);
    if (!stored) return cloneTemplates(DEFAULT_SCRIPT_TEMPLATES);
    return normalizeTemplates(JSON.parse(stored)) || cloneTemplates(DEFAULT_SCRIPT_TEMPLATES);
  } catch {
    return cloneTemplates(DEFAULT_SCRIPT_TEMPLATES);
  }
};

export const saveScriptTemplates = (templates: ScriptTemplate[]) => {
  const normalized = cloneTemplates(templates);
  if (typeof window === "undefined") return normalized;
  window.localStorage.setItem(SCRIPT_TEMPLATE_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(SCRIPT_TEMPLATE_CHANGE_EVENT));
  return normalized;
};

export const subscribeToScriptTemplates = (listener: () => void) => {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SCRIPT_TEMPLATE_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(SCRIPT_TEMPLATE_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SCRIPT_TEMPLATE_CHANGE_EVENT, listener);
  };
};
