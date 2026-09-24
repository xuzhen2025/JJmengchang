import React from "react";
import { X, Play, CheckCircle2, AlertCircle, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Task } from "../types";

interface RightQueueProps {
  tasks: Task[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  clearCompleted: () => void;
  restartTask?: (taskId: string) => void;
}

export default function RightQueue({
  tasks,
  isOpen,
  setIsOpen,
  clearCompleted,
  restartTask
}: RightQueueProps) {
  if (!isOpen) {
    // Mini sidebar toggle button on the right edge
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border-l border-t border-b border-purple-200 text-purple-600 p-2.5 rounded-l-2xl hover:bg-purple-50 hover:text-purple-700 transition-all shadow-xl flex flex-col items-center gap-2 z-50 cursor-pointer"
      >
        <span className="text-[10px] font-bold tracking-wider [writing-mode:vertical-lr] uppercase">任务队列</span>
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        {tasks.filter(t => t.status === "queue" || t.status === "generating").length > 0 && (
          <span className="bg-red-500 text-[10px] font-bold text-white w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
            {tasks.filter(t => t.status === "queue" || t.status === "generating").length}
          </span>
        )}
      </button>
    );
  }

  const queueCount = tasks.filter((t) => t.status === "queue").length;
  const generatingCount = tasks.filter((t) => t.status === "generating").length;

  return (
    <div className="w-80 h-screen bg-white border-l border-slate-200 text-slate-800 flex flex-col shadow-2xl relative z-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-purple-600 animate-spin-slow" />
          <h2 className="font-semibold text-sm">任务队列</h2>
          {tasks.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
              {tasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 border-b border-slate-100 text-center text-xs py-2.5 bg-slate-50">
        <div className="border-r border-slate-100">
          <p className="text-slate-400">排队中</p>
          <p className="font-bold font-mono text-slate-600 mt-0.5">{queueCount}</p>
        </div>
        <div>
          <p className="text-slate-400">生成中</p>
          <p className="font-bold font-mono text-purple-600 mt-0.5">{generatingCount}</p>
        </div>
      </div>

      {/* Action panel */}
      {tasks.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-[11px]">
          <span className="text-slate-400">实时计算资源就绪</span>
          <button
            onClick={clearCompleted}
            className="text-purple-600 hover:text-purple-500 font-bold transition-colors cursor-pointer"
          >
            清除已完成
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-semibold">暂无进行中的创意任务</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              使用AI视频原料、快速创作、画质增强或爆款复刻工具，生成结果将在此实时呈现。
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-all flex flex-col gap-2.5 group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{task.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{task.createdAt}</p>
                </div>
                {task.status === "completed" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
                {task.status === "failed" && (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                {task.status === "generating" && (
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin flex-shrink-0" />
                )}
                {task.status === "queue" && (
                  <div className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-400 animate-spin flex-shrink-0" />
                )}
              </div>

              {/* Progress Bar or Status */}
              {(task.status === "generating" || task.status === "queue") ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>
                      {task.status === "queue" ? "正在排队分配GPU..." : 
                        task.progress < 30 ? "正在深度提取边缘线条..." : 
                        task.progress < 60 ? "合成高级棚拍工作室光影..." : 
                        task.progress < 85 ? "细化4K逼真商品材质纹理..." : "正在完成输出封装..."
                      }
                    </span>
                    <span className="font-mono">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[10px] bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400">消耗积分</span>
                  <span className="font-mono font-bold text-amber-600">-{task.creditsCost.toFixed(2)}</span>
                </div>
              )}

              {/* Input details preview if completed */}
              {task.status === "completed" && task.outputFiles && task.outputFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {task.outputFiles.slice(0, 4).map((url, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative bg-slate-50 group/thumb">
                      <img
                        src={url}
                        alt="output preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
