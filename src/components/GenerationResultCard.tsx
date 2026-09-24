import React, { useState } from "react";
import {
  AlertCircle, Ban, Check, CheckCircle2, Clock3, CloudUpload,
  Download, Edit3, Loader2, Play, Sparkles,
} from "lucide-react";
import { Task } from "../types";

export interface GenerationResultFile {
  id: string;
  name: string;
  url: string;
  coverUrl: string;
  metadata: string;
  secondaryMetadata: string;
}

interface GenerationResultCardProps<T extends GenerationResultFile> {
  task: Task;
  mediaType: "image" | "video";
  outputs: T[];
  selected?: boolean;
  id?: string;
  recordRef?: React.Ref<HTMLElement>;
  compact?: boolean;
  onSelect?: () => void;
  onCancel?: () => void;
  onPreview: (output: T) => void;
  onDownload: (output: T) => void;
  onUpload: (outputs: T[]) => void;
  onReEdit: () => void;
}

export default function GenerationResultCard<T extends GenerationResultFile>({
  task, mediaType, outputs, selected, id, recordRef, compact,
  onSelect, onCancel, onPreview, onDownload, onUpload, onReEdit,
}: GenerationResultCardProps<T>) {
  const [selectedOutputIds, setSelectedOutputIds] = useState<string[]>([]);
  const selectedOutputs = outputs.filter((output) => selectedOutputIds.includes(output.id));
  const label = mediaType === "image" ? "图片" : "视频";
  const statusHeading = {
    ready: "等待配置生成内容",
    queue: "正在排队，预计很快开始生成",
    generating: `正在生成${label}，预计 5 秒内完成`,
    completed: `已为你生成 ${outputs.length} ${mediaType === "image" ? "张图片" : "个视频"}`,
    failed: "生成遇到问题，请重新编辑后再试",
    cancelled: "排队已取消",
  }[task.status];
  const statusLabel = {
    ready: "待配置", queue: "排队中", generating: "生成中",
    completed: "生成成功", failed: "生成失败", cancelled: "已取消",
  }[task.status];
  const toggleOutput = (outputId: string) => {
    setSelectedOutputIds((current) => current.includes(outputId)
      ? current.filter((id) => id !== outputId)
      : [...current, outputId]);
  };
  const reEditButton = (
    <button type="button" onClick={(event) => { event.stopPropagation(); onReEdit(); }} className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700">
      <Edit3 className="h-3.5 w-3.5" />重新编辑
    </button>
  );

  return (
    <article id={id} ref={recordRef} data-task-id={task.id} data-status={task.status} onClick={onSelect} className={`@container my-5 min-w-0 rounded-lg border p-4 transition-colors ${selected ? "border-violet-500 bg-violet-50/30 ring-2 ring-violet-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${task.status === "failed" ? "bg-rose-50 text-rose-600" : task.status === "cancelled" ? "bg-amber-50 text-amber-600" : "bg-slate-950 text-violet-300"}`}>
            {task.status === "failed" ? <AlertCircle className="h-4 w-4" /> : task.status === "cancelled" ? <Ban className="h-4 w-4" /> : task.status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800">{statusHeading}</h3>
            <p title={`任务名称：${task.name} · ${task.createdAt} · ID：${task.id}`} className="mt-1 truncate text-[10px] text-slate-400">任务名称：{task.name}　·　{task.createdAt}　·　ID：{task.id.replace(/\D/g, "").slice(-11) || task.id.slice(-11)}</p>
          </div>
        </div>
        {task.status === "completed" ? (
          <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
            <button type="button" disabled={selectedOutputs.length === 0} onClick={(event) => { event.stopPropagation(); if (selectedOutputs.length) onUpload(selectedOutputs); }} className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40">
              <CloudUpload className="h-3.5 w-3.5" />上传资源库{selectedOutputs.length > 0 && ` (${selectedOutputs.length})`}
            </button>
            {reEditButton}
          </div>
        ) : (
          <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${task.status === "failed" ? "bg-rose-50 text-rose-700" : task.status === "cancelled" ? "bg-amber-50 text-amber-700" : task.status === "generating" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel}</span>
        )}
      </div>
      {task.status === "queue" && (
        <div className="mt-4 flex h-48 flex-col items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Clock3 className="h-7 w-7" /><p className="mt-2 text-xs font-bold">排队中</p><p className="mt-1 text-[10px] text-slate-400">正在等待可用计算资源</p>
          {onCancel && <button type="button" onClick={(event) => { event.stopPropagation(); onCancel(); }} className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-600">取消排队</button>}
        </div>
      )}
      {task.status === "generating" && (
        <div className="mt-4 flex h-48 flex-col items-center justify-center rounded-md bg-slate-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-violet-300"><Sparkles className="h-6 w-6" /></span>
          <div className="mt-5 flex w-72 max-w-[90%] items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${task.progress}%` }} /></div><span className="w-8 text-right text-[10px] font-bold text-slate-600">{task.progress}%</span></div>
          <p className="mt-2 text-[10px] text-slate-400">正在{mediaType === "image" ? "生成图片" : "渲染合成视频"}...</p>
        </div>
      )}
      {task.status === "failed" && (
        <div className="mt-4 flex min-h-44 flex-col items-center justify-center rounded-md bg-rose-50/60 px-8 py-4 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500" /><p className="mt-3 text-xs font-bold text-rose-700">任务生成失败</p>
          <p className="mt-1 text-[11px] leading-5 text-rose-500">{task.failureReason || "生成服务发生异常，请检查素材后重试。"}</p>
          {task.refundedCredits === task.creditsCost && <p className="mt-2 text-[10px] font-semibold text-emerald-600">本次消耗的 {task.creditsCost} 积分已退还</p>}
        </div>
      )}
      {task.status === "cancelled" && (
        <div className="mt-4 flex h-40 flex-col items-center justify-center rounded-md bg-amber-50/60 text-center">
          <Ban className="h-7 w-7 text-amber-500" /><p className="mt-2 text-xs font-bold text-amber-700">已取消排队</p><p className="mt-1 text-[10px] text-amber-600">积分已退还，点击重新编辑可再次提交</p>
        </div>
      )}
      {task.status === "completed" && outputs.length > 0 && (
        <div className="mt-4">
          <div className={compact ? "flex gap-3 overflow-x-auto px-0.5 py-0.5" : "grid grid-cols-[repeat(auto-fill,minmax(144px,176px))] gap-3"}>
            {outputs.map((output) => {
              const checked = selectedOutputIds.includes(output.id);
              return (
                <div key={output.id} data-output-id={output.id} className={`min-w-0 overflow-hidden rounded-md border bg-white transition-colors ${compact ? "w-44 max-w-full shrink-0" : ""} ${checked ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200"}`}>
                  <div className="relative aspect-[9/16] overflow-hidden bg-slate-950">
                    <button type="button" onClick={(event) => { event.stopPropagation(); onPreview(output); }} title={`预览 ${output.name}`} className="group block h-full w-full text-left">
                      <img src={output.coverUrl} alt={output.name} className={`h-full w-full ${mediaType === "image" ? "object-contain" : "object-cover"}`} referrerPolicy="no-referrer" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                        {mediaType === "video" && <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-violet-700"><Play className="ml-0.5 h-4 w-4 fill-current" /></span>}
                      </span>
                    </button>
                    <button type="button" role="checkbox" aria-checked={checked} aria-label={`选择${output.name}`} onClick={(event) => { event.stopPropagation(); toggleOutput(output.id); }} title={checked ? "取消选择" : `选择${label}`} className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded border shadow-sm ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-white bg-white/90 text-transparent hover:text-slate-300"}`}><Check className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onDownload(output); }} title={`下载${label}`} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded bg-black/65 text-white shadow-sm hover:bg-black/80"><Download className="h-3.5 w-3.5" /></button>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-2 pb-2 pt-10 text-white">
                      <div className="flex items-center justify-between gap-2 text-[10px]"><span>{output.metadata}</span><span>{output.secondaryMetadata}</span></div>
                      <p title={output.name} className="mt-1 truncate text-[10px] font-semibold">{output.name}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[10px] text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />已通过素材初审，具体请以最终投放平台规则为准</p>
        </div>
      )}
      {(task.status === "ready" || task.status === "failed" || task.status === "cancelled") && <div className="mt-3 flex justify-end">{reEditButton}</div>}
    </article>
  );
}
