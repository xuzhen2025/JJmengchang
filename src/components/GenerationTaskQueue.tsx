import React, { useMemo, useState } from "react";
import { AlertCircle, Ban, CheckCircle2, Clock3, Eye, Loader2, RefreshCw, RotateCcw, Sparkles, X } from "lucide-react";
import { Task } from "../types";

interface GenerationTaskQueueProps {
  tasks: Task[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  cancelTask: (taskId: string) => void;
  restartTask: (taskId: string) => void;
  viewResult: (taskId: string) => void;
}

const STATUS_META: Record<Task["status"], { label: string; className: string }> = {
  ready: { label: "待配置", className: "bg-amber-50 text-amber-700" },
  queue: { label: "排队", className: "bg-slate-100 text-slate-600" },
  generating: { label: "生成中", className: "bg-violet-50 text-violet-700" },
  completed: { label: "生成成功", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "生成失败", className: "bg-rose-50 text-rose-700" },
  cancelled: { label: "已取消", className: "bg-amber-50 text-amber-700" }
};

export default function GenerationTaskQueue({ tasks, isOpen, setIsOpen, cancelTask, restartTask, viewResult }: GenerationTaskQueueProps) {
  const [tab, setTab] = useState<"recent" | "all">("recent");
  const [sourceFilter, setSourceFilter] = useState<"all" | "agent" | "tool">("all");
  const activeCount = tasks.filter((task) => task.status === "queue" || task.status === "generating").length;
  const visibleTasks = useMemo(() => {
    const filtered = sourceFilter === "all" ? tasks : tasks.filter((task) => task.source === sourceFilter);
    return tab === "recent" ? filtered.slice(0, 20) : filtered;
  }, [sourceFilter, tab, tasks]);

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} title="打开 AI 任务队列" className="fixed right-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-2 rounded-l-lg border border-r-0 border-violet-200 bg-white p-2.5 text-violet-700 shadow-lg hover:bg-violet-50">
        <span className="text-[10px] font-bold [writing-mode:vertical-lr]">任务队列</span>
        {activeCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{activeCount}</span>}
      </button>
    );
  }

  const queueCount = tasks.filter((task) => task.status === "queue").length;
  const generatingCount = tasks.filter((task) => task.status === "generating").length;

  return (
    <aside className="relative z-50 flex h-screen w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white text-slate-800 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-violet-600" />
          <h2 className="text-sm font-semibold">AI 任务队列</h2>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{tasks.length}</span>
        </div>
        <button onClick={() => setIsOpen(false)} title="收起任务队列" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50 py-2.5 text-center text-xs">
        <div className="border-r border-slate-200"><p className="text-slate-400">排队</p><p className="mt-0.5 font-mono font-bold text-slate-700">{queueCount}</p></div>
        <div><p className="text-slate-400">生成中</p><p className="mt-0.5 font-mono font-bold text-violet-700">{generatingCount}</p></div>
      </div>

      <div className="space-y-2 border-b border-slate-100 px-3 py-3">
        <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1">
          {(["recent", "all"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded px-3 py-1.5 text-xs font-semibold ${tab === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{item === "recent" ? "近期任务" : "全部任务"}</button>)}
        </div>
        <div className="flex gap-1.5">
          {([["all", "全部来源"], ["agent", "Agent 创作"], ["tool", "AI 工具"]] as const).map(([value, label]) => (
            <button key={value} onClick={() => setSourceFilter(value)} className={`rounded border px-2.5 py-1 text-[11px] ${sourceFilter === value ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {visibleTasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Sparkles className="h-6 w-6" /></div><p className="text-xs font-semibold text-slate-600">暂无符合条件的任务</p></div>
        ) : visibleTasks.map((task) => {
          const status = STATUS_META[task.status];
          const canCancel = task.status === "queue" || task.status === "generating";
          const canRestart = task.status === "failed" || task.status === "cancelled";
          return (
            <section key={task.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{task.name}</p><p className="mt-1 text-[10px] text-slate-400">{task.createdAt} · {task.source === "agent" ? "Agent 创作" : "AI 工具"}</p></div>
                <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
              </div>

              {(task.status === "queue" || task.status === "generating") && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500"><span className="flex items-center gap-1">{task.status === "queue" ? <Clock3 className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}{task.status === "queue" ? "等待计算资源" : "正在生成结果"}</span><span className="font-mono">{task.progress}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-violet-600 transition-all" style={{ width: `${task.progress}%` }} /></div>
                </div>
              )}

              {task.status === "failed" && <p className="mt-2 flex items-start gap-1.5 rounded bg-rose-50 p-2 text-[10px] leading-4 text-rose-700"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />{task.failureReason || "生成过程异常，已停止任务。"}</p>}
              {task.status === "cancelled" && <p className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 p-2 text-[10px] leading-4 text-amber-700"><Ban className="mt-0.5 h-3 w-3 shrink-0" />{task.refundedCredits === task.creditsCost ? "排队阶段取消，积分已全额退回。" : "生成阶段取消，已发生的计算消耗不退回。"}</p>}

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <div className="text-[10px] text-slate-400">消耗 <span className="font-mono font-bold text-amber-600">{task.creditsCost.toFixed(2)}</span>{(task.refundedCredits || 0) > 0 && <span className="ml-1 text-emerald-600">退回 {task.refundedCredits?.toFixed(2)}</span>}</div>
                <div className="flex items-center gap-1.5">
                  {canCancel && <button onClick={() => cancelTask(task.id)} className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-50"><X className="h-3 w-3" />取消</button>}
                  {canRestart && <button onClick={() => restartTask(task.id)} className="flex items-center gap-1 rounded bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-violet-700"><RotateCcw className="h-3 w-3" />重新生成</button>}
                  {task.status === "completed" && <button onClick={() => viewResult(task.id)} className="flex items-center gap-1 rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-700"><Eye className="h-3 w-3" />查看结果</button>}
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] leading-4 text-slate-400"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-500" />失败任务退回未消耗积分；历史任务长期保留。</div>
    </aside>
  );
}
