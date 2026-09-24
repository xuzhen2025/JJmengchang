import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";
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
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
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
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            title={`关闭${title}`}
            onClick={onClose}
            className={iconClass}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-5 py-3">
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
function ParameterFields({
  goal,
  params,
  onChange,
}: {
  goal: MarketingGoal;
  params: AdParameters;
  onChange: (p: AdParameters) => void;
}) {
  const set = (key: keyof AdParameters, value: string | number | boolean) =>
    onChange({ ...params, [key]: value });
  return (
    <div className="space-y-5">
      <Options
        label="营销场景"
        values={
          goal === "推商品"
            ? ["日常销售", "新客转化", "新品起量"]
            : ["日常销售", "新客转化"]
        }
        value={params.scene}
        onChange={(v) => set("scene", v)}
      />
      {params.scene === "新客转化" && (
        <Options
          label="新客类型"
          values={
            goal === "推商品"
              ? ["店铺新客"]
              : ["店铺新客", "品牌新客", "抖音号新客"]
          }
          value={params.newcomer}
          onChange={(v) => set("newcomer", v)}
        />
      )}
      <Options
        label="广告类型"
        values={["通投广告", "搜索广告", "商城广告"]}
        disabled={["搜索广告", "商城广告"]}
        value={params.adType}
        onChange={(v) => set("adType", v)}
      />
      <Options
        label="推广方式"
        values={["自定义", "托管"]}
        disabled={["自定义"]}
        value={params.promotion}
        onChange={(v) => set("promotion", v)}
      />
      <label className="flex items-center gap-4 text-xs font-semibold text-slate-600">
        <span className="w-[120px]">智能优惠券</span>
        <input
          type="checkbox"
          checked={params.coupon}
          onChange={(e) => set("coupon", e.target.checked)}
          className="h-4 w-4 accent-violet-600"
        />
        启用
      </label>
    </div>
  );
}

export function TemplateEditor({
  initial,
  goal,
  video,
  row,
  account,
  onClose,
  onSave,
}: {
  initial?: AdTemplate;
  goal: MarketingGoal;
  video: AdVideo;
  row?: DeliveryRow;
  account?: AdAccount;
  onClose: () => void;
  onSave: (t: AdTemplate) => void;
}) {
  const actor = getAdActor();
  const [template, setTemplate] = useState<AdTemplate>(() =>
    initial
      ? structuredClone(initial)
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
        ) > 110
      )
        throw new Error("计划名称超出110个字符（汉字按2个字符计算）");
      const saved = saveAdTemplate(template);
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
          <Field title="模板名称">
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
          <Field title="计划名称">
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
          <p className="text-xs text-slate-600">巨量千川 / {goal}</p>
          <ParameterFields
            goal={goal}
            params={template.params}
            onChange={(params) => setTemplate((t) => ({ ...t, params }))}
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field title="日预算（元）">
            <input
              className={inputClass}
              type="number"
              min="0.01"
              step="0.01"
              value={template.params.budget}
              onChange={(e) =>
                setTemplate((t) => ({
                  ...t,
                  params: { ...t.params, budget: Number(e.target.value) },
                }))
              }
            />
          </Field>
          <Field title="出价（元）">
            <input
              className={inputClass}
              type="number"
              min="0.01"
              step="0.01"
              value={template.params.bid}
              onChange={(e) =>
                setTemplate((t) => ({
                  ...t,
                  params: { ...t.params, bid: Number(e.target.value) },
                }))
              }
            />
          </Field>
          <Field title="转化目标">
            <select
              className={inputClass}
              value={template.params.optimization}
              onChange={(e) =>
                setTemplate((t) => ({
                  ...t,
                  params: { ...t.params, optimization: e.target.value },
                }))
              }
            >
              <option>成交</option>
              <option>支付ROI</option>
            </select>
          </Field>
          <Field title="优化周期">
            <select
              className={inputClass}
              value={template.params.period}
              onChange={(e) =>
                setTemplate((t) => ({
                  ...t,
                  params: { ...t.params, period: e.target.value },
                }))
              }
            >
              <option>1天</option>
              <option>7天</option>
            </select>
          </Field>
          <p className="col-span-full text-xs text-amber-700">
            新建计划默认暂停，需在千川检查后手动开启。
          </p>
        </div>
      )}
    </AdDialog>
  );
}
