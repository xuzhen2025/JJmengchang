import React from "react";
import type { TaskFieldItem, TaskFieldValues } from "../lib/taskFieldConfig";

export default function TaskCustomFields({ fields, values, errors, onChange }: {
  fields: TaskFieldItem[]; values: TaskFieldValues; errors: Record<string, string>;
  onChange: (id: string, value: string | string[]) => void;
}) {
  return <>{fields.map(field => {
    const value = values[field.id] ?? (field.type === "多选" ? [] : "");
    const className = `w-full px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none font-medium text-slate-800 ${errors[field.id] ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-200 focus:border-purple-500"}`;
    return <div key={field.id} className="flex items-start gap-3" data-task-field={field.id}>
      <label htmlFor={`task-field-${field.id}`} className="w-24 text-right pr-1 pt-2 text-xs font-medium text-slate-700 shrink-0">
        {field.isRequired && <span className="text-rose-500 mr-1">*</span>}{field.name}
      </label>
      <div className="flex-1 min-w-0">
        {field.type === "多选" ? <div id={`task-field-${field.id}`} role="group" aria-label={field.name} aria-required={field.isRequired} aria-invalid={Boolean(errors[field.id])} tabIndex={-1} className={`${className} flex flex-wrap gap-3`}>
          {field.options.map(option => <label key={option} className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={e => onChange(field.id, e.target.checked ? [...(Array.isArray(value) ? value : []), option] : (Array.isArray(value) ? value : []).filter(v => v !== option))} className="accent-purple-600" />{option}
          </label>)}
        </div> : field.type === "单选" ? <select id={`task-field-${field.id}`} aria-required={field.isRequired} aria-invalid={Boolean(errors[field.id])} value={String(value)} onChange={e => onChange(field.id, e.target.value)} className={className}>
          <option value="">请选择</option>{field.options.map(option => <option key={option}>{option}</option>)}
        </select> : <input id={`task-field-${field.id}`} type={field.type === "数字" ? "number" : field.type === "时间" ? "datetime-local" : "text"} step={field.type === "数字" ? "any" : undefined}
          aria-required={field.isRequired} aria-invalid={Boolean(errors[field.id])} value={String(value)} onChange={e => onChange(field.id, e.target.value)} className={className} />}
        {errors[field.id] && <p role="alert" className="text-rose-500 text-[11px] font-medium mt-1">{errors[field.id]}</p>}
      </div>
    </div>;
  })}</>;
}
