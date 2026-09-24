import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  FileVideo,
  Image as ImageIcon,
  Minus,
  Plus,
  Upload,
  X,
} from "lucide-react";
import {
  loadScriptTemplates,
  ScriptTemplateField,
  subscribeToScriptTemplates,
} from "../data/scriptTemplates";
import AnchoredPopover from "./overlays/AnchoredPopover";
import OverlayPortal from "./overlays/OverlayPortal";
import ImageResourcePickerModal, { ImageResourcePickerItem } from "./ImageResourcePickerModal";
import VideoResourcePickerModal, { VideoResourcePickerItem } from "./VideoResourcePickerModal";

export interface DynamicScriptTemplateFormHandle {
  validate: () => boolean;
  getSnapshot: () => { templateId: string; templateName: string; rowValues: Record<string, ScriptFieldValue>; rows: ScriptInputRow[] };
}

type ScriptFieldValue = string | string[] | ImageResourcePickerItem[] | VideoResourcePickerItem[];

interface ScriptInputRow {
  id: string;
  values: Record<string, ScriptFieldValue>;
}

interface PickerTarget {
  fieldId: string;
  rowId?: string;
  kind: "image" | "video";
}

let rowSequence = 0;
const createRow = (): ScriptInputRow => ({ id: `script-row-${Date.now()}-${rowSequence++}`, values: {} });

const IMAGE_COVERS = [
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
  "./assets/prototype/luxury-skincare-set.jpg",
  "./assets/prototype/skincare-product.jpg",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
];

const IMAGE_NAMES = [
  "草本精华液商品主图", "轻透底妆效果展示", "护肤成分质感特写", "高奢护肤套装陈列",
  "清洁卸妆产品实拍", "都市通勤模特展示", "高腰修身裤面料图", "智能生活产品主图",
  "保湿面膜效果对比", "防晒乳夏日场景图", "口红显色对比图", "厨房清洁使用场景",
  "运动服饰动态展示", "香氛瓶身光影特写", "眼霜成分拆解图", "居家好物陈列图",
  "珠宝耳饰佩戴效果", "洗护产品泡沫特写", "食品包装促销主图", "户外装备场景展示",
];

const SCRIPT_IMAGE_LIBRARY: ImageResourcePickerItem[] = IMAGE_NAMES.map((name, index) => ({
  id: `script-image-${String(index + 1).padStart(3, "0")}`,
  name: `${name}.jpg`,
  url: IMAGE_COVERS[index % IMAGE_COVERS.length],
  status: index % 5 === 1 ? "待审核" : index % 7 === 3 ? "未审核" : "审核通过",
  primaryCategory: ["美妆护肤", "服饰内衣", "日用百货", "食品饮料"][index % 4],
  secondaryCategory: ["商品主图", "模特展示", "成分展示", "效果对比"][index % 4],
  tags: [["产品实拍", "高端质感"], ["模特出镜"], ["对比实测"], ["场景展示"]][index % 4],
  author: ["徐振", "致上互娱", "汤小真", "美妆设计组"][index % 4],
  resolution: index % 2 ? "1080x1440" : "1920x1080",
  size: `${(1.4 + (index % 7) * 0.6).toFixed(1)} MB`,
  source: "library",
}));

const VIDEO_NAMES = [
  "美妆精华液痛点口播成片", "高腰修身裤对标翻拍", "防晒产品户外实测", "厨房清洁前后对比",
  "香氛瓶身光影成片", "内衣面料拉伸素材", "模特通勤跟拍素材", "卸妆油乳化过程素材",
  "运动服饰街拍成片", "零食开箱口播视频", "智能家电功能演示", "护肤套装节日礼盒",
  "耳饰佩戴效果特写", "洗发产品泡沫素材", "保湿面膜测评成片", "收纳用品居家场景",
  "鞋履防滑功能实测", "眼霜使用手法素材", "口红显色种草成片", "户外水杯耐摔实测",
];

const SCRIPT_VIDEO_LIBRARY: VideoResourcePickerItem[] = VIDEO_NAMES.map((name, index) => ({
  id: `script-video-${String(index + 1).padStart(3, "0")}`,
  name: `${name}.mp4`,
  cover: IMAGE_COVERS[index % IMAGE_COVERS.length],
  status: index % 6 === 1 ? "待审核" : index % 7 === 4 ? "未审核" : "审核通过",
  section: index % 3 === 0 ? "成片" : "素材",
  primaryCategory: ["美妆护肤", "服饰内衣", "日用百货", "食品饮料"][index % 4],
  secondaryCategory: ["面部护理", "模特展示", "商品实拍", "效果对比"][index % 4],
  tags: [["对标翻拍", "爆款口播"], ["产品实拍"], ["使用过程"], ["效果对比"]][index % 4],
  author: ["徐振", "刘弯", "张小花", "梁浩然"][index % 4],
  duration: `00:${String(12 + (index % 7) * 5).padStart(2, "0")}`,
  size: `${(16.2 + (index % 8) * 5.7).toFixed(1)} MB`,
}));

const valueIsEmpty = (value: ScriptFieldValue | undefined) => {
  if (value === undefined) return true;
  if (typeof value === "string") return !value.trim();
  return value.length === 0;
};

const asText = (value: ScriptFieldValue | undefined) => typeof value === "string" ? value : "";
const asStringList = (value: ScriptFieldValue | undefined) => Array.isArray(value) && value.every((item) => typeof item === "string") ? value as string[] : [];
const asImages = (value: ScriptFieldValue | undefined) => Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && "url" in item) ? value as ImageResourcePickerItem[] : [];
const asVideos = (value: ScriptFieldValue | undefined) => Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && "cover" in item) ? value as VideoResourcePickerItem[] : [];

function MultiSelectInput({ field, value, invalid, onChange }: { field: ScriptTemplateField; value: string[]; invalid: boolean; onChange: (value: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const options = field.options || [];
  const toggle = (option: string) => onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  return (
    <div className="relative w-full">
      <button ref={anchorRef} type="button" onClick={() => setOpen((current) => !current)} className={`flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left text-xs outline-none ${invalid ? "ring-1 ring-inset ring-rose-500" : "hover:bg-slate-50"}`}>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {value.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 font-medium text-slate-600">{item}<span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); toggle(item); }} className="text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></span></span>)}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <AnchoredPopover anchorRef={anchorRef} matchAnchorWidth maxHeight={260} gap={4} onClose={() => setOpen(false)} className="rounded-md border border-slate-200 bg-white py-1.5 shadow-xl">{options.length ? options.map((option) => { const checked = value.includes(option); return <button key={option} type="button" onClick={() => toggle(option)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-violet-50"><span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"}`}>{checked && <Check className="h-2.5 w-2.5" />}</span>{option}</button>; }) : <p className="px-3 py-4 text-center text-xs text-slate-400">暂无选项</p>}</AnchoredPopover>}
    </div>
  );
}

interface FieldControlProps {
  field: ScriptTemplateField;
  value?: ScriptFieldValue;
  invalid: boolean;
  compact?: boolean;
  onChange: (value: ScriptFieldValue) => void;
  onOpenPicker: (kind: "image" | "video") => void;
}

function FieldControl({ field, value, invalid, compact = false, onChange, onOpenPicker }: FieldControlProps) {
  const baseInput = `w-full bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 ${invalid ? "ring-1 ring-inset ring-rose-500" : "focus:ring-1 focus:ring-inset focus:ring-violet-400"}`;
  if (field.type === "多选") return <MultiSelectInput field={field} value={asStringList(value)} invalid={invalid} onChange={onChange} />;
  if (field.type === "单选") return <div className="relative w-full"><select aria-label={field.title} value={asText(value)} onChange={(event) => onChange(event.target.value)} className={`${baseInput} h-10 appearance-none pr-9 cursor-pointer`}><option value="" aria-label="未选择" />{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></div>;
  if (field.type === "图片") {
    const images = asImages(value);
    return <div className={`flex w-full flex-col items-center justify-center gap-3 p-3 ${compact ? "min-h-[150px]" : "min-h-[112px]"} ${invalid ? "ring-1 ring-inset ring-rose-500" : ""}`}><button type="button" onClick={() => onOpenPicker("image")} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-violet-400 hover:text-violet-700"><ImageIcon className="h-4 w-4" />选择图片</button>{images.map((item) => <div key={item.id} className="flex w-full max-w-sm items-center gap-2 rounded-md border border-slate-200 p-2"><img src={item.url} alt="" className="h-12 w-12 rounded object-cover" /><p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">{item.name}</p><button type="button" onClick={() => onChange(images.filter((image) => image.id !== item.id))} title="删除" className="p-1 text-slate-400 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button></div>)}</div>;
  }
  if (field.type === "附件") {
    const videos = asVideos(value);
    return <div className={`flex w-full flex-col items-center justify-center gap-3 p-3 ${compact ? "min-h-[150px]" : "min-h-[112px]"} ${invalid ? "ring-1 ring-inset ring-rose-500" : ""}`}><button type="button" onClick={() => onOpenPicker("video")} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-violet-400 hover:text-violet-700"><Upload className="h-4 w-4" />上传</button>{videos.length > 0 && <div className="w-full space-y-2">{videos.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"><span className="rounded bg-violet-100 px-1.5 py-1 text-[10px] font-bold text-violet-600">MP4</span><p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">{item.name}</p><button type="button" onClick={() => onChange(videos.filter((video) => video.id !== item.id))} title="删除" className="p-1 text-slate-400 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button></div>)}</div>}</div>;
  }
  if (field.type === "文本") return <textarea aria-label={field.title} value={asText(value)} onChange={(event) => onChange(event.target.value)} className={`${baseInput} ${compact ? "min-h-[240px]" : "min-h-[112px]"} resize-none leading-6`} />;
  return <input aria-label={field.title} type={field.type === "数字" ? "number" : field.type === "时间" ? "time" : "text"} value={asText(value)} onChange={(event) => onChange(event.target.value)} className={`${baseInput} h-10`} />;
}

const DynamicScriptTemplateForm = forwardRef<DynamicScriptTemplateFormHandle>(function DynamicScriptTemplateForm(_, ref) {
  const [templates, setTemplates] = useState(loadScriptTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [rows, setRows] = useState<ScriptInputRow[]>([createRow()]);
  const [rowValues, setRowValues] = useState<Record<string, ScriptFieldValue>>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => subscribeToScriptTemplates(() => setTemplates(loadScriptTemplates())), []);
  useEffect(() => () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current); }, []);

  const enabledTemplates = useMemo(() => templates.filter((template) => template.enabled), [templates]);
  const selectedTemplate = enabledTemplates.find((template) => template.id === selectedTemplateId);
  const columnFields = selectedTemplate?.fields.filter((field) => field.displayMode === "column") || [];
  const rowFields = selectedTemplate?.fields.filter((field) => field.displayMode === "row") || [];

  useEffect(() => {
    if (selectedTemplateId && !selectedTemplate) {
      setSelectedTemplateId("");
      setRows([createRow()]);
      setRowValues({});
      setErrors(new Set());
    }
  }, [selectedTemplate, selectedTemplateId]);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  };

  const clearError = (key: string) => setErrors((current) => {
    if (!current.has(key)) return current;
    const next = new Set(current);
    next.delete(key);
    return next;
  });

  const updateColumnValue = (rowId: string, fieldId: string, value: ScriptFieldValue) => {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, values: { ...row.values, [fieldId]: value } } : row));
    clearError(`column:${rowId}:${fieldId}`);
  };

  const updateRowValue = (fieldId: string, value: ScriptFieldValue) => {
    setRowValues((current) => ({ ...current, [fieldId]: value }));
    clearError(`row:${fieldId}`);
  };

  const updateTargetValue = (target: PickerTarget, value: ScriptFieldValue) => {
    if (target.rowId) updateColumnValue(target.rowId, target.fieldId, value);
    else updateRowValue(target.fieldId, value);
  };

  const getTargetValue = (target: PickerTarget | null) => {
    if (!target) return undefined;
    return target.rowId ? rows.find((row) => row.id === target.rowId)?.values[target.fieldId] : rowValues[target.fieldId];
  };

  const validate = () => {
    const missing: string[] = [];
    if (!selectedTemplate) missing.push("template");
    if (selectedTemplate) {
      rows.forEach((row) => columnFields.forEach((field) => {
        if (valueIsEmpty(row.values[field.id])) missing.push(`column:${row.id}:${field.id}`);
      }));
      rowFields.forEach((field) => {
        if (valueIsEmpty(rowValues[field.id])) missing.push(`row:${field.id}`);
      });
    }
    setErrors(new Set(missing));
    const first = missing[0];
    if (first) {
      window.setTimeout(() => {
        const target = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-validation-key]") || []).find((element) => element.dataset.validationKey === first);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        target?.querySelector<HTMLElement>("select, textarea, input, button")?.focus();
      }, 0);
      notify(first === "template" ? "请先选择脚本模板" : "请填写完整后再发布");
      return false;
    }
    return true;
  };

  useImperativeHandle(ref, () => ({ validate, getSnapshot: () => ({ templateId: selectedTemplateId, templateName: selectedTemplate?.title || "", rowValues, rows }) }), [columnFields, rowFields, rowValues, rows, selectedTemplate, selectedTemplateId]);

  const changeTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setRows([createRow()]);
    setRowValues({});
    setErrors(new Set());
  };

  const addRow = (index?: number) => {
    const newRow = createRow();
    setRows((current) => {
      if (typeof index !== "number") return [...current, newRow];
      const next = [...current];
      next.splice(index + 1, 0, newRow);
      return next;
    });
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      notify("无法删除，最少保留1行");
      return;
    }
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const renderField = (field: ScriptTemplateField, value: ScriptFieldValue | undefined, key: string, onChange: (value: ScriptFieldValue) => void, compact = false, rowId?: string) => (
    <div data-validation-key={key} className="h-full w-full">
      <FieldControl field={field} value={value} invalid={errors.has(key)} compact={compact} onChange={onChange} onOpenPicker={(kind) => setPickerTarget({ fieldId: field.id, rowId, kind })} />
      {errors.has(key) && <p className="px-3 pb-2 text-[11px] font-medium text-rose-500">此项为必填项</p>}
    </div>
  );

  const pickerValue = getTargetValue(pickerTarget);
  const currentImages = asImages(pickerValue);
  const currentVideos = asVideos(pickerValue);
  const imagePickerItems = [...SCRIPT_IMAGE_LIBRARY, ...currentImages.filter((item) => !SCRIPT_IMAGE_LIBRARY.some((libraryItem) => libraryItem.id === item.id))];
  const videoPickerItems = [...SCRIPT_VIDEO_LIBRARY, ...currentVideos.filter((item) => !SCRIPT_VIDEO_LIBRARY.some((libraryItem) => libraryItem.id === item.id))];

  return (
    <div ref={rootRef} className="rounded-lg border border-slate-200 bg-white shadow-2xs">
      <div className="border-b border-slate-100 px-6 py-4"><h3 className="text-sm font-extrabold text-slate-900">填写脚本</h3></div>
      <div className="space-y-5 p-6">
        <div data-validation-key="template" className="flex items-center gap-4">
          <label className="w-24 shrink-0 text-right text-xs font-bold text-slate-700"><span className="mr-0.5 text-rose-500">*</span>脚本模板</label>
          <div className={`relative min-w-0 flex-1 rounded-md ${errors.has("template") ? "ring-1 ring-rose-500" : ""}`}>
            <select value={selectedTemplateId} onChange={(event) => changeTemplate(event.target.value)} className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-3.5 pr-9 text-xs text-slate-700 outline-none focus:border-violet-500"><option value="">请选择脚本模板</option>{enabledTemplates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {selectedTemplate && <>
          {columnFields.length > 0 && <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <div className="min-w-max" style={{ width: `max(100%, ${188 + columnFields.length * 260}px)` }}>
              <div className="grid border-b border-slate-200 bg-violet-50/70 text-center text-xs font-bold text-slate-700" style={{ gridTemplateColumns: `64px 64px repeat(${columnFields.length}, minmax(240px, 1fr)) 52px` }}>
                <div className="border-r border-slate-200" />
                <div className="flex min-h-12 items-center justify-center border-r border-slate-200">序号</div>
                {columnFields.map((field) => <div key={field.id} className="flex min-h-12 items-center justify-center border-r border-slate-200 px-3">{field.title}</div>)}
                <div />
              </div>
              <div className="flex items-stretch">
                <div className="flex w-16 shrink-0 items-center justify-center border-r border-slate-200 bg-violet-100/70 px-2 text-center text-xs font-bold text-slate-700">
                  <span className="[writing-mode:vertical-rl]">{selectedTemplate.columnGroupTitle}</span>
                </div>
                <div className="min-w-0 flex-1">
                  {rows.map((row, index) => <div key={row.id} className="grid border-b border-slate-200" style={{ gridTemplateColumns: `64px repeat(${columnFields.length}, minmax(240px, 1fr)) 52px` }}>
                    <div className="flex min-h-[280px] items-center justify-center border-r border-slate-200 text-sm font-semibold text-slate-800">{index + 1}</div>
                    {columnFields.map((field) => <div key={field.id} className="min-h-[280px] border-r border-slate-200">{renderField(field, row.values[field.id], `column:${row.id}:${field.id}`, (value) => updateColumnValue(row.id, field.id, value), true, row.id)}</div>)}
                    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3"><button type="button" onClick={() => addRow(index)} title="在下方插入一行" className="flex h-6 w-6 items-center justify-center rounded-full border border-violet-400 text-violet-600 hover:bg-violet-50"><Plus className="h-3.5 w-3.5" /></button><button type="button" onClick={() => removeRow(index)} title="删除此行" className="flex h-6 w-6 items-center justify-center rounded-full border border-violet-400 text-violet-600 hover:bg-violet-50"><Minus className="h-3.5 w-3.5" /></button></div>
                  </div>)}
                  <button type="button" onClick={() => addRow()} className="flex h-9 w-full items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-4 w-4" />新增一行</button>
                </div>
              </div>
            </div>
          </div>}

          <div className="space-y-3">
            {rowFields.map((field) => {
              const key = `row:${field.id}`;
              return <div key={field.id} data-validation-key={key} className={`flex min-h-14 overflow-hidden rounded-md border bg-white ${errors.has(key) ? "border-rose-500" : "border-slate-200"}`}><div className="flex w-52 shrink-0 items-center bg-violet-100/70 px-5 text-xs font-bold text-slate-800">{field.title}</div><div className="min-w-0 flex-1">{renderField(field, rowValues[field.id], key, (value) => updateRowValue(field.id, value))}</div></div>;
            })}
          </div>
        </>}
      </div>

      {toast && <OverlayPortal layer="toast" className="fixed left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-md bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-white shadow-xl"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px]">!</span>{toast}</OverlayPortal>}

      {pickerTarget?.kind === "image" && <ImageResourcePickerModal items={imagePickerItems} initialSelectedIds={currentImages.map((item) => item.id)} onClose={() => setPickerTarget(null)} onConfirm={(items) => { updateTargetValue(pickerTarget, items); setPickerTarget(null); }} />}
      {pickerTarget?.kind === "video" && <VideoResourcePickerModal items={videoPickerItems} initialSelectedIds={currentVideos.map((item) => item.id)} allowLocalUpload showAllSection onClose={() => setPickerTarget(null)} onConfirm={(items) => { updateTargetValue(pickerTarget, items); setPickerTarget(null); }} />}
    </div>
  );
});

export default DynamicScriptTemplateForm;
