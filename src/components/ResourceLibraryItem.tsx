import React, { useState } from "react";
import {
  Check,
  Download,
  FileText,
  Folder,
  Image as ImageIcon,
  Music,
  Pause,
  Play,
  Scissors,
  Share2,
  User
} from "lucide-react";

export type ResourceLibraryItemType = "成片" | "素材" | "第三方" | "脚本" | "图片" | "音频";

export interface ResourceLibraryItemData {
  id: string;
  numericId?: string;
  type: ResourceLibraryItemType;
  title: string;
  coverUrl?: string;
  status?: string;
  author: string;
  time: string;
  todayCost?: number;
  cost?: number;
  category?: string;
  subtitle?: string;
  cuts?: number;
  downloads?: number;
  shares?: number;
  filesCount?: number;
  duration?: string;
  durationSeconds?: number;
  resolution?: string;
  size?: string;
  content?: string;
  scenesCount?: number;
  isFolder?: boolean;
}

interface ResourceLibraryItemProps {
  item: ResourceLibraryItemData;
  selected?: boolean;
  selectionActive?: boolean;
  onToggleSelect?: () => void;
  onOpen?: () => void;
  onDownload?: () => void;
  footerAction?: React.ReactNode;
}

const getStatusBadgeStyle = (status?: string) => {
  if (["审核通过", "已通过", "通过"].includes(status || "")) return "bg-emerald-500 text-white";
  if (["审核驳回", "驳回-待修改"].includes(status || "")) return "bg-rose-500 text-white";
  if (["已上机", "已搭", "已投放"].includes(status || "")) return "bg-purple-600 text-white";
  if (["放弃", "放弃测试"].includes(status || "")) return "bg-slate-400 text-white";
  return "bg-[#f08080] text-white";
};

function VideoResourceItem({ item, selected, selectionActive, onToggleSelect, onOpen, footerAction }: ResourceLibraryItemProps) {
  return (
    <div
      onClick={onOpen}
      className={`group relative z-10 flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-2xs transition-all duration-300 hover:shadow-lg ${selected ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-200/90"}`}
    >
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-slate-900">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full items-center justify-center"><FileText className="h-10 w-10 text-slate-500" /></div>
        )}
        {onToggleSelect && (
          <button
            onClick={(event) => { event.stopPropagation(); onToggleSelect(); }}
            className={`absolute left-1.5 top-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-md transition-all ${selected ? "bg-purple-600 text-white opacity-100 shadow-xs ring-2 ring-purple-200" : selectionActive ? "border-2 border-purple-400 bg-white/90 text-slate-400 opacity-100 shadow-xs" : "border border-white/70 bg-black/40 text-transparent opacity-0 group-hover:opacity-100"}`}
            title={selected ? "取消选择" : "选择此项"}
          >
            <Check className={`h-3.5 w-3.5 stroke-[3] ${selected ? "opacity-100 text-white" : "opacity-0"}`} />
          </button>
        )}
        <span className={`absolute top-0 z-10 rounded-br-lg px-2 py-0.5 text-[11px] font-bold text-white shadow-xs ${selected || selectionActive ? "left-7 bg-purple-600" : "left-0 bg-[#00aed6]"}`}>{item.type}</span>
        <span className={`absolute right-0 top-0 z-10 rounded-bl-lg px-2 py-0.5 text-[11px] font-bold shadow-xs ${getStatusBadgeStyle(item.status)}`}>{item.status || "待审核"}</span>
        <div className="absolute left-1.5 top-6 z-10 rounded bg-black/50 px-1.5 text-[10px] font-mono text-white/90 backdrop-blur-xs">ID: {item.numericId || item.id}</div>
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[10px] font-mono text-white">
          <div className="flex items-center gap-3.5 text-white/90">
            <span className="flex items-center gap-0.5" title="剪切/分镜数"><Scissors className="h-3 w-3" />{item.cuts || 0}</span>
            <span className="flex items-center gap-0.5" title="下载次数"><Download className="h-3 w-3" />{item.downloads || 0}</span>
            <span className="flex items-center gap-0.5" title="分享转发数"><Share2 className="h-3 w-3" />{item.shares || 0}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between space-y-1 p-2.5">
        <h3 className="line-clamp-1 text-xs font-normal leading-snug text-slate-800 transition-colors group-hover:text-purple-600" title={item.title}>{item.title}</h3>
        <div className="flex items-center gap-1 text-xs text-purple-600"><span className="font-bold">￥</span><span className="font-mono">{item.todayCost || 0} / {item.cost || 0}</span></div>
        <p className="text-[11px] font-normal text-slate-400">{item.category || item.subtitle || (item.type === "成片" ? "混剪" : "商品素材")}</p>
      </div>
      {footerAction ? (
        <div onClick={(event) => event.stopPropagation()} className="border-t border-slate-100 bg-slate-50/40 px-2.5 py-2">{footerAction}</div>
      ) : (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-2.5 py-2 text-[11px] text-slate-500">
          <div className="flex min-w-0 items-center gap-1.5 text-slate-700"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white"><User className="h-2.5 w-2.5" /></span><span className="max-w-[80px] truncate text-slate-800">{item.author}</span></div>
          <span className="shrink-0 text-[10px] text-slate-400">{item.time}</span>
        </div>
      )}
    </div>
  );
}

function ImageResourceItem({ item, selected, selectionActive, onToggleSelect, onOpen, footerAction }: ResourceLibraryItemProps) {
  return (
    <div onClick={onOpen} className={`group relative flex cursor-pointer flex-col rounded-2xl border bg-white transition-all ${selected ? "border-purple-600 bg-purple-50/10 shadow-md ring-2 ring-purple-500/20" : "border-slate-200/90 hover:border-purple-300 hover:shadow-md"}`}>
      {selectionActive && onToggleSelect && <button onClick={(event) => { event.stopPropagation(); onToggleSelect(); }} className={`absolute left-1.5 top-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-md ${selected ? "bg-purple-600 text-white" : "border-2 border-purple-400 bg-white/90"}`}><Check className={`h-3.5 w-3.5 ${selected ? "opacity-100" : "opacity-0"}`} /></button>}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-[15px] bg-slate-100">
        <span className={`absolute top-0 z-10 rounded-br-lg px-2 py-0.5 text-[11px] font-bold text-white shadow-xs ${selectionActive ? "left-7 bg-purple-600" : "left-0 bg-[#10B981]"}`}>图片</span>
        {item.isFolder ? <Folder className="h-12 w-12 stroke-1 text-slate-400" /> : item.coverUrl ? <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <ImageIcon className="h-12 w-12 text-slate-300" />}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-[10px] text-white"><span className="flex items-center gap-0.5"><Download className="h-3 w-3" />{item.downloads || 0}</span><span>共{item.filesCount || 1}个文件</span></div>
      </div>
      <div className="flex flex-col gap-1 p-3 text-xs"><h3 className="truncate font-bold text-slate-800 transition-colors group-hover:text-purple-600">{item.title}</h3><p className="truncate text-[11px] text-slate-400">{item.subtitle || item.category || "图片资源"}</p>{footerAction ? <div onClick={(event) => event.stopPropagation()} className="mt-1 border-t border-slate-100/80 pt-2">{footerAction}</div> : <div className="mt-1 flex items-center justify-between border-t border-slate-100/80 pt-2 text-[11px] text-slate-500"><span className="flex min-w-0 items-center gap-1.5"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white">{item.author.slice(0, 1)}</span><span className="truncate">{item.author}</span></span><span className="shrink-0 text-slate-400">{item.time}</span></div>}</div>
    </div>
  );
}

function AudioResourceItem({ item, onOpen, onDownload, footerAction }: ResourceLibraryItemProps) {
  const [playing, setPlaying] = useState(false);
  const durationSeconds = item.durationSeconds || 52;
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 transition-all hover:border-purple-300 hover:shadow-md">
      <div><div className="flex items-start justify-between gap-2"><button onClick={onOpen} className="flex-1 truncate text-left text-sm font-bold tracking-tight text-slate-900 transition-colors hover:text-purple-600">{item.title}</button>{onDownload && <button onClick={onDownload} title="下载" className="rounded-lg bg-purple-600 p-1 text-white opacity-0 shadow-2xs transition-opacity group-hover:opacity-100"><Download className="h-3.5 w-3.5" /></button>}</div><p className="mt-0.5 truncate text-xs font-medium text-slate-400">{item.subtitle || item.category || "音频资源"}</p></div>
      <div className="flex items-center gap-2 py-3"><button onClick={() => setPlaying(!playing)} title={playing ? "暂停" : "播放"} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-purple-600 text-purple-600 shadow-xs ${playing ? "bg-purple-600 text-white" : "bg-white hover:bg-purple-50"}`}>{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button><div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-200"><div className={`h-full rounded bg-purple-600 ${playing ? "w-2/3" : "w-0"}`} /></div><span className="min-w-9 text-right text-xs font-mono text-slate-600">{item.duration || `${String(Math.floor(durationSeconds / 60)).padStart(2, "0")}:${String(durationSeconds % 60).padStart(2, "0")}`}</span></div>
      {footerAction ? <div onClick={(event) => event.stopPropagation()} className="border-t border-slate-100 pt-2.5">{footerAction}</div> : <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500"><span className="flex min-w-0 items-center gap-1.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold">{item.author.slice(0, 1)}</span><span className="truncate">{item.author}</span></span><span className="shrink-0 text-slate-400">{item.time}</span></div>}
    </div>
  );
}

function ScriptResourceItem({ item, onOpen, onDownload, footerAction }: ResourceLibraryItemProps) {
  return (
    <div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(240px,2fr)_100px_150px_90px] items-center gap-4 border-b border-slate-100 px-4 py-4 text-xs last:border-b-0 hover:bg-slate-50/70">
      <div className="min-w-0"><button onClick={onOpen} className="block max-w-full truncate text-left font-bold text-slate-900 hover:text-purple-600">{item.title}</button><div className="mt-1 flex items-center gap-1.5">{!footerAction && <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-600">{item.author}</span>}<span className="text-[10px] text-slate-400">{item.category || "任务脚本"}</span></div></div>
      <p className="line-clamp-2 leading-relaxed text-slate-600">{item.content || item.subtitle || "任务制作脚本文件"}</p>
      <span className={`w-fit rounded-md px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeStyle(item.status)}`}>{item.status || "待审核"}</span>
      <div className="text-[11px] text-slate-600"><p>{item.category || "通用模板"}</p><span className="mt-1 inline-block rounded bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-600">{item.subtitle || "制作参考"}</span></div>
      <div onClick={(event) => footerAction && event.stopPropagation()} className="flex items-center justify-end gap-2">{footerAction || <><span className="font-mono text-slate-500">{item.scenesCount || 0} 场</span>{onDownload && <button onClick={onDownload} title="下载" className="rounded p-1.5 text-purple-600 hover:bg-purple-50"><Download className="h-3.5 w-3.5" /></button>}</>}</div>
    </div>
  );
}

export default function ResourceLibraryItem(props: ResourceLibraryItemProps) {
  if (["成片", "素材", "第三方"].includes(props.item.type)) return <VideoResourceItem {...props} />;
  if (props.item.type === "图片") return <ImageResourceItem {...props} />;
  if (props.item.type === "音频") return <AudioResourceItem {...props} />;
  return <ScriptResourceItem {...props} />;
}
