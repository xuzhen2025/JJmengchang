import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";
import { adCharacterCount, adToday, defaultWorkbench, planNameLimit, type AdTarget, type AdWorkbenchConfig } from "../lib/adPushConfig";
import {
  DEFAULT_AD_PARAMETERS,
  PLAN_WORDS,
  adId,
  getAdActor,
  nameWidth,
  resolveAdName,
  saveAdTemplate,
  type AdAccount,
  type AdParameters,
  type AdTemplate,
  type AdVideo,
  type DeliveryRow,
  type MarketingGoal,
} from "../lib/adPush";
export type { AdPushRecord } from "../lib/adPush";

export const inputClass =
  "h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-400";
export const buttonClass =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
export const primaryClass =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40";
export const iconClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100";

export function AdDialog({
  title,
  children,
  footer,
  onClose,
  wide = false,
  showHeader = true,
  footerBorder = true,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  showHeader?: boolean;
  footerBorder?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <OverlayPortal
      ref={root}
      tabIndex={-1}
      layer="dialog"
      className={`fixed inset-0 flex items-center justify-center bg-black/40 p-3 outline-none ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={(e) => {
        if (!root.current?.contains(e.target as Node)) return;
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
        if (e.key === "Tab") {
          const items = [
            ...root.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
            ),
          ].filter((el) => el.getClientRects().length);
          const first = items[0],
            last = items[items.length - 1];
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === root.current)
          ) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
          e.stopPropagation();
        }
      }}
    >
      <div
        className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl ${wide ? "max-w-6xl" : "max-w-2xl"}`}
      >
        {showHeader && <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            title={`关闭${title}`}
            onClick={onClose}
            className={iconClass}
          >
            <X className="h-5 w-5" />
          </button>
        </header>}
        <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
        {footer && (
          <footer className={`flex shrink-0 flex-wrap items-center justify-end gap-3 ${footerBorder ? "border-t border-slate-200" : ""} px-5 py-3`}>
            {footer}
          </footer>
        )}
      </div>
    </OverlayPortal>
  );
}
export const ErrorLine = ({ text }: { text: string }) =>
  text ? (
    <p role="alert" className="flex items-start gap-2 text-sm text-rose-600">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {text}
    </p>
  ) : null;
export const Field = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <label className="block min-w-0 space-y-2 text-xs font-semibold text-slate-600">
    <span>{title}</span>
    {children}
  </label>
);
function Options({
  label,
  values,
  value,
  onChange,
  disabled = [],
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: string[];
}) {
  return (
    <fieldset className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
      <legend className="float-left pt-2 text-xs font-semibold text-slate-600">
        {label}
      </legend>
      <div className="flex flex-wrap gap-3">
        {values.map((v) => (
          <label
            key={v}
            title={disabled.includes(v) ? "当前不支持，不可选" : v}
            className="relative cursor-pointer"
          >
            <input
              className="peer sr-only"
              type="radio"
              name={label}
              checked={value === v}
              disabled={disabled.includes(v)}
              onChange={() => onChange(v)}
            />
            <span className="flex min-h-10 min-w-24 items-center justify-center rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 peer-checked:border-violet-500 peer-checked:text-violet-600 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-40">
              {v}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function TemplateCreationFields({ config, onChange }: { config: AdWorkbenchConfig; onChange: (config: AdWorkbenchConfig) => void }) {
  const set = <K extends keyof AdWorkbenchConfig>(key: K, value: AdWorkbenchConfig[K]) => onChange({ ...config, [key]: value });
  return <div className="grid gap-5 sm:grid-cols-2">
    <Field title="出价方式（必填）"><select aria-label="模板出价方式" className={inputClass} value={config.bidding} onChange={e => onChange({ ...config, bidding: e.target.value as AdWorkbenchConfig["bidding"], roi: e.target.value === "放量投放" ? "" : config.roi })}><option>控成本投放</option>{config.target === "商品全域" && <option>放量投放</option>}</select></Field>
    <Field title="预算（元，必填）"><input aria-label="模板预算" className={inputClass} type="number" min="0.01" step="0.01" value={config.budget} onChange={e => set("budget", e.target.value)} /></Field>
    {config.bidding === "控成本投放" && <Field title="支付ROI目标（条件必填）"><input aria-label="模板ROI目标" className={inputClass} type="number" min="0.01" step="0.01" value={config.roi} onChange={e => set("roi", e.target.value)} /></Field>}
    <Field title="投放日期（选填）"><select aria-label="模板投放日期" className={inputClass} value={config.period} onChange={e => set("period", e.target.value as AdWorkbenchConfig["period"])}><option>从今天起长期投放</option><option>设置开始和结束时间</option></select></Field>
    {config.period === "设置开始和结束时间" && <><Field title="开始日期（条件必填）"><input aria-label="模板开始日期" className={inputClass} type="date" min={adToday()} value={config.start} onChange={e => set("start", e.target.value)} /></Field><Field title="结束日期（条件必填）"><input aria-label="模板结束日期" className={inputClass} type="date" min={config.start || adToday()} value={config.end} onChange={e => set("end", e.target.value)} /></Field></>}
    <div className="col-span-full space-y-3">
      <p className="text-xs font-semibold text-slate-600">创意标题（当前成片场景必填，10至110字符，汉字计2）</p>
      {config.titles.map((title, index) => <div key={index} className="flex items-center gap-2"><input aria-label={`模板创意标题${index + 1}`} className={inputClass} value={title} onChange={e => set("titles", config.titles.map((value, i) => i === index ? e.target.value : value))} /><span className="shrink-0 text-xs">{adCharacterCount(title)}/110</span><button title="删除标题" className={iconClass} disabled={config.titles.length === 1} onClick={() => set("titles", config.titles.filter((_, i) => i !== index))}><X size={16} /></button></div>)}
      <button className={buttonClass} disabled={config.titles.length >= 30} onClick={() => set("titles", [...config.titles, ""])}>添加标题</button>
    </div>
    <Field title="主页可见性（条件选填）"><select className={inputClass} value={config.profile} onChange={e => set("profile", e.target.value as AdWorkbenchConfig["profile"])}><option>默认</option><option>仅单次展示可见</option><option>主页始终可见</option></select></Field>
    <div className="col-span-full flex flex-wrap gap-4 text-xs">
      <label title="模板未绑定账户，须在账户能力确认后开启"><input type="checkbox" checked={config.coupon} disabled={!config.coupon} onChange={e => set("coupon", e.target.checked)} /> 智能优惠券（条件选填）</label>
      {config.target === "商品乘方" && <><label><input type="checkbox" checked={config.starMaterial} onChange={e => set("starMaterial", e.target.checked)} /> 千川星选素材（选填）</label><label><input type="checkbox" checked={config.aigc} onChange={e => set("aigc", e.target.checked)} /> AIGC动态创意（选填）</label><label title="须确认所选账户白名单"><input type="checkbox" checked={config.commission} disabled={!config.commission} onChange={e => set("commission", e.target.checked)} /> 达人佣金优化（条件选填）</label></>}
      {(config.cardTitle || config.cardSellingPoints) && <button className={buttonClass} onClick={() => onChange({ ...config, cardTitle: "", cardSellingPoints: "" })}>清除历史推广卡片</button>}
    </div>
    <p className="col-span-full text-sm">提交操作：创建计划并请求开启投放</p>
  </div>;
}

export function TemplateEditor({
  initial,
  goal,
  target = "商品全域",
  video,
  row,
  account,
  onClose,
  onSave,
}: {
  initial?: AdTemplate;
  goal: MarketingGoal;
  target?: AdTarget;
  video: AdVideo;
  row?: DeliveryRow;
  account?: AdAccount;
  onClose: () => void;
  onSave: (t: AdTemplate) => void;
}) {
  const actor = getAdActor();
  const [template, setTemplate] = useState<AdTemplate>(() =>
    initial
      ? { ...structuredClone(initial), workbench: initial.workbench || { ...defaultWorkbench(), target, operation: "create", budget: String(initial.params.budget), roi: String(initial.params.bid), planName: initial.naming } }
      : {
          id: adId(),
          name: "",
          scope: "个人模板",
          ownerId: actor.id,
          platform: "巨量千川",
          goal,
          naming: "",
          suffix: "",
          params: { ...DEFAULT_AD_PARAMETERS },
          workbench: { ...defaultWorkbench(), target, operation: "create" },
        },
  );
  const [step, setStep] = useState(1),
    [error, setError] = useState("");
  useEffect(() => setError(""), [template]);
  const namingRef = useRef<HTMLInputElement>(null);
  const insert = (word: string) => {
    const position =
      namingRef.current?.selectionStart ?? template.naming.length;
    const end = namingRef.current?.selectionEnd ?? position;
    const text = `{${word}}`;
    setTemplate((t) => ({
      ...t,
      naming: t.naming.slice(0, position) + text + t.naming.slice(end),
    }));
    requestAnimationFrame(() => {
      namingRef.current?.focus();
      namingRef.current?.setSelectionRange(
        position + text.length,
        position + text.length,
      );
    });
  };
  const save = () => {
    try {
      if (
        nameWidth(
          resolveAdName(template.naming, video, actor, template, row, account) +
            (template.suffix || "_YYYYMMDD_001"),
        ) + 7 > (planNameLimit(template.workbench!.target) || Infinity)
      )
        throw new Error("计划名称超出商品全域100字符限制（含后缀，汉字计2）");
      const saved = saveAdTemplate({ ...template, workbench: { ...template.workbench!, planName: template.naming }, params: { ...template.params, budget: Number(template.workbench!.budget), bid: Number(template.workbench!.roi), coupon: template.workbench!.coupon } });
      onSave(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败，请检查浏览器存储");
    }
  };
  return (
    <AdDialog
      title="计划模板配置"
      className="ad-push-ui ap-dialog"
      wide
      onClose={onClose}
      footer={
        <>
          <ErrorLine text={error} />
          {step === 2 && (
            <button className="ap-button" onClick={() => setStep(1)}>
              上一步
            </button>
          )}
          <button className="ap-button" onClick={onClose}>
            取消
          </button>
          <button
            className="ap-button primary"
            onClick={step === 1 ? () => setStep(2) : save}
          >
            {step === 1 ? "下一步" : "保存模板"}
          </button>
        </>
      }
    >
      <nav className="mb-6 flex gap-5 border-b border-slate-200 pb-3 text-sm">
        <button
          onClick={() => setStep(1)}
          className={
            step === 1 ? "font-bold text-violet-600" : "text-slate-500"
          }
        >
          基础参数
        </button>
        <button
          onClick={() => setStep(2)}
          className={
            step === 2 ? "font-bold text-violet-600" : "text-slate-500"
          }
        >
          投放设置
        </button>
      </nav>
      {step === 1 ? (
        <div className="space-y-6">
          <Field title="模板名称（必填）">
            <input
              autoFocus
              className={inputClass}
              value={template.name}
              maxLength={60}
              onChange={(e) =>
                setTemplate((t) => ({ ...t, name: e.target.value }))
              }
              placeholder="请输入模板名称"
            />
          </Field>
          <Field title="计划名称（本平台必填）">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={namingRef}
                className={`${inputClass} flex-1`}
                value={template.naming}
                onChange={(e) =>
                  setTemplate((t) => ({ ...t, naming: e.target.value }))
                }
                placeholder="请选择词包"
              />
              <span className="text-xs text-slate-500">
                {template.suffix || "+ 自动编号"}
              </span>
            </div>
          </Field>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <span className="text-slate-500">动态词包：</span>
            {PLAN_WORDS.map((word) => (
              <button
                key={word}
                onClick={() => insert(word)}
                className="text-violet-600 hover:underline"
              >{`{${word}}`}</button>
            ))}
          </div>
          <p className="break-all text-xs text-slate-500">
            预览示例：
            {resolveAdName(
              template.naming,
              video,
              actor,
              template,
              row,
              account,
            )}
            {template.suffix}
          </p>
          <Options
            label="模板类型"
            values={["个人模板", "公司模板"]}
            value={template.scope}
            onChange={(v) =>
              setTemplate((t) => ({ ...t, scope: v as AdTemplate["scope"] }))
            }
          />
          <p className="text-xs text-slate-600">巨量千川 / {template.workbench!.target}</p>
        </div>
      ) : (
        <TemplateCreationFields config={template.workbench!} onChange={workbench => setTemplate(t => ({ ...t, workbench }))} />
      )}
    </AdDialog>
  );
}
