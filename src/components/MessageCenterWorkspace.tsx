import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Inbox,
  ListTodo,
  MessageSquare,
  Radio,
  Search,
  ShieldAlert,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { ActiveScreen, AppMessage, MessageResourceLink } from "../types";
import { INITIAL_MESSAGES, MESSAGE_CATEGORY_CONFIGS } from "../data";
import ApprovalActionBox from "./ApprovalActionBox";

interface MessageCenterWorkspaceProps {
  onBack: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  messages?: AppMessage[];
  onApproveCredits?: (msgId: string) => void;
  onRejectCredits?: (msgId: string, rejectReason: string) => void;
  onMarkMessageRead?: (id: string) => void;
  onMarkAllMessagesRead?: () => void;
  onOpenResource?: (resource: MessageResourceLink) => void;
}

const CATEGORY_META: Record<string, { icon: React.ElementType; tone: string; active: string; description: string }> = {
  "审批待办": { icon: FileCheck2, tone: "bg-amber-50 text-amber-700", active: "bg-amber-50 text-amber-800 border-amber-200", description: "需要你处理的积分申请" },
  "任务协作": { icon: ListTodo, tone: "bg-blue-50 text-blue-700", active: "bg-blue-50 text-blue-800 border-blue-200", description: "发布人与执行人的协作动态" },
  "内容资源": { icon: UploadCloud, tone: "bg-emerald-50 text-emerald-700", active: "bg-emerald-50 text-emerald-800 border-emerald-200", description: "上传、生成、状态与批注" },
  "直播": { icon: Radio, tone: "bg-rose-50 text-rose-700", active: "bg-rose-50 text-rose-800 border-rose-200", description: "直播间场次与排班提醒" },
  "安全与系统": { icon: ShieldAlert, tone: "bg-slate-100 text-slate-700", active: "bg-slate-100 text-slate-900 border-slate-300", description: "账号安全、系统与导出审计" },
};

const SEVERITY_META = {
  info: { label: "通知", className: "bg-blue-50 text-blue-700 border-blue-100" },
  success: { label: "已完成", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  warning: { label: "请关注", className: "bg-amber-50 text-amber-700 border-amber-100" },
  danger: { label: "重要", className: "bg-rose-50 text-rose-700 border-rose-100" },
};

export default function MessageCenterWorkspace({
  onBack,
  setActiveScreen,
  messages: propMessages,
  onApproveCredits,
  onRejectCredits,
  onMarkMessageRead,
  onMarkAllMessagesRead,
  onOpenResource,
}: MessageCenterWorkspaceProps) {
  const [localMessages, setLocalMessages] = useState<AppMessage[]>(INITIAL_MESSAGES);
  const messagesList = propMessages ?? localMessages;
  const [selectedCategory, setSelectedCategory] = useState("全部消息");
  const [selectedType, setSelectedType] = useState("全部类型");
  const [selectedStatus, setSelectedStatus] = useState("全部状态");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [drawerMessageId, setDrawerMessageId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState("");

  const drawerMessage = messagesList.find((message) => message.id === drawerMessageId) ?? null;
  const unreadCount = messagesList.filter((message) => message.status === "unread").length;
  const currentCategory = MESSAGE_CATEGORY_CONFIGS.find((category) => category.name === selectedCategory);

  const filteredMessages = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return messagesList.filter((message) => {
      if (selectedCategory !== "全部消息" && message.category !== selectedCategory) return false;
      if (selectedType !== "全部类型" && message.subcategory !== selectedType) return false;
      if (selectedStatus === "未读" && message.status !== "unread") return false;
      if (selectedStatus === "已读" && message.status !== "read") return false;
      const date = message.time.slice(0, 10);
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      if (keyword) {
        const source = [message.title, message.detail, message.subcategory, message.actorName, message.recipientNames?.join(" "), message.sourceId]
          .filter(Boolean).join(" ").toLowerCase();
        if (!source.includes(keyword)) return false;
      }
      return true;
    });
  }, [messagesList, selectedCategory, selectedType, selectedStatus, searchText, startDate, endDate]);

  const markRead = (id: string) => {
    if (onMarkMessageRead) onMarkMessageRead(id);
    else setLocalMessages((current) => current.map((message) => message.id === id ? { ...message, status: "read", isRedDot: false } : message));
  };

  const markAllRead = () => {
    if (onMarkAllMessagesRead) onMarkAllMessagesRead();
    else setLocalMessages((current) => current.map((message) => ({ ...message, status: "read", isRedDot: false })));
  };

  const openMessage = (message: AppMessage) => {
    setDrawerMessageId(message.id);
    setActionFeedback("");
    if (message.status === "unread") markRead(message.id);
  };

  const handleMessageAction = (message: AppMessage) => {
    if (message.actionScreen) {
      setDrawerMessageId(null);
      setActiveScreen(message.actionScreen);
      return;
    }
    setActionFeedback(message.subcategory === "数据导出记录" ? "已定位该用户本次导出的审计记录" : "已定位对应的安全与系统记录");
  };

  const resetFilters = () => {
    setSelectedType("全部类型");
    setSelectedStatus("全部状态");
    setSearchText("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-800">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} title="返回首页" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <div className="flex items-center gap-2"><h1 className="text-lg font-black text-slate-900">消息中心</h1>{unreadCount > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{unreadCount} 条未读</span>}</div>
            <p className="mt-0.5 text-xs text-slate-400">业务通知、协作消息与管理审计统一入口</p>
          </div>
        </div>
        <button onClick={markAllRead} disabled={unreadCount === 0} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-4 w-4" />全部标为已读</button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white p-3 lg:border-b-0 lg:border-r">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            <button onClick={() => { setSelectedCategory("全部消息"); setSelectedType("全部类型"); }} className={`flex min-w-40 items-center gap-3 rounded-lg border px-3 py-3 text-left transition lg:min-w-0 ${selectedCategory === "全部消息" ? "border-purple-200 bg-purple-50 text-purple-800" : "border-transparent text-slate-600 hover:bg-slate-50"}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700"><Inbox className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-black">全部消息</span><span className="mt-0.5 block text-[11px] text-slate-400">共 {messagesList.length} 条</span></span>
            </button>
            {MESSAGE_CATEGORY_CONFIGS.map((category) => {
              const meta = CATEGORY_META[category.name];
              const Icon = meta.icon;
              const total = messagesList.filter((message) => message.category === category.name).length;
              const unread = messagesList.filter((message) => message.category === category.name && message.status === "unread").length;
              const active = selectedCategory === category.name;
              return (
                <button key={category.id} onClick={() => { setSelectedCategory(category.name); setSelectedType("全部类型"); }} className={`flex min-w-48 items-center gap-3 rounded-lg border px-3 py-3 text-left transition lg:min-w-0 ${active ? meta.active : "border-transparent text-slate-600 hover:bg-slate-50"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 text-sm font-black"><span>{category.name}</span>{unread > 0 && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">{unread}</span>}</span><span className="mt-0.5 block truncate text-[11px] font-normal text-slate-400">{total} 条 · {meta.description}</span></span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="搜索标题、人员或业务编号" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-purple-400 focus:bg-white" /></div>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none">
                <option>全部类型</option>
                {(currentCategory?.subcategories ?? MESSAGE_CATEGORY_CONFIGS.flatMap((category) => [...category.subcategories])).map((type) => <option key={type}>{type}</option>)}
              </select>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"><option>全部状态</option><option>未读</option><option>已读</option></select>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-8 w-28 bg-transparent text-[11px] text-slate-500 outline-none" /><span className="text-slate-300">-</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-8 w-28 bg-transparent text-[11px] text-slate-500 outline-none" /></div>
              <button onClick={resetFilters} className="h-9 rounded-lg px-3 text-xs font-bold text-slate-500 hover:bg-slate-100">重置</button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="mb-3"><h2 className="text-sm font-black text-slate-900">{selectedCategory}</h2><p className="mt-1 text-xs text-slate-400">当前筛选结果 {filteredMessages.length} 条</p></div>
            {filteredMessages.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center border border-dashed border-slate-200 bg-white text-center"><Inbox className="h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">没有符合条件的消息</p><button onClick={resetFilters} className="mt-3 text-xs font-bold text-purple-600">清除筛选条件</button></div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {filteredMessages.map((message) => {
                  const categoryMeta = CATEGORY_META[message.category] ?? CATEGORY_META["安全与系统"];
                  const CategoryIcon = categoryMeta.icon;
                  const severity = SEVERITY_META[message.severity ?? "info"];
                  return (
                    <button key={message.id} onClick={() => openMessage(message)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50 sm:gap-4 sm:px-5">
                      <div className="relative"><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${categoryMeta.tone}`}><CategoryIcon className="h-4 w-4" /></span>{message.status === "unread" && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black text-slate-900">{message.title}</span><span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${severity.className}`}>{severity.label}</span><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{message.subcategory}</span></div>
                        <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">{message.detail}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{message.actorName ?? "系统"} → {message.recipientNames?.join("、") ?? "当前用户"}</span>{message.sourceId && <span className="font-mono">{message.sourceId}</span>}</div>
                      </div>
                      <div className="hidden min-w-28 text-right sm:block"><span className="text-[11px] text-slate-400">{message.time.slice(0, 10)}</span><span className="mt-1 block font-mono text-xs font-bold text-slate-500">{message.time.slice(11, 16)}</span>{message.businessStatus && <span className="mt-2 inline-block text-[10px] font-bold text-purple-600">{message.businessStatus}</span>}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {drawerMessage && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25">
          <button aria-label="关闭消息详情" className="min-w-0 flex-1 cursor-default" onClick={() => setDrawerMessageId(null)} />
          <section className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2"><Bell className="h-4 w-4 text-purple-600" /><h2 className="text-sm font-black text-slate-900">消息详情</h2></div><button onClick={() => setDrawerMessageId(null)} title="关闭" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-purple-50 px-2 py-1 text-[11px] font-black text-purple-700">{drawerMessage.category}</span><span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{drawerMessage.subcategory}</span><span className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400"><Clock3 className="h-3 w-3" />{drawerMessage.time}</span></div>
              <h3 className="mt-5 text-xl font-black leading-7 text-slate-900">{drawerMessage.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{drawerMessage.detail}</p>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><div><p className="text-[10px] font-bold text-slate-400">触发方</p><p className="mt-1 text-sm font-black text-slate-800">{drawerMessage.actorName ?? "系统"}</p></div><ChevronRight className="h-5 w-5 text-purple-400" /><div className="text-right"><p className="text-[10px] font-bold text-slate-400">接收人</p><p className="mt-1 text-sm font-black text-slate-800">{drawerMessage.recipientNames?.join("、") ?? "当前用户"}</p></div></div>

              {(drawerMessage.sourceType || drawerMessage.sourceId || drawerMessage.businessStatus) && <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200"><div className="bg-white p-3"><p className="text-[10px] text-slate-400">业务对象</p><p className="mt-1 truncate text-xs font-bold text-slate-800">{drawerMessage.sourceType ?? "-"}</p></div><div className="bg-white p-3"><p className="text-[10px] text-slate-400">业务编号</p><p className="mt-1 truncate font-mono text-xs font-bold text-slate-800">{drawerMessage.sourceId ?? "-"}</p></div><div className="bg-white p-3"><p className="text-[10px] text-slate-400">当前状态</p><p className="mt-1 truncate text-xs font-bold text-purple-700">{drawerMessage.businessStatus ?? "-"}</p></div></div>}

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /><h4 className="text-xs font-black text-slate-800">{drawerMessage.template === "security" ? "审计与安全信息" : drawerMessage.template === "live" ? "场次信息" : drawerMessage.template === "task" ? "任务变更信息" : drawerMessage.template === "resource" ? "资源处理信息" : "申请信息"}</h4></div>
                <dl className="overflow-hidden rounded-lg border border-slate-200">{drawerMessage.details.map((item, index) => <div key={`${item.label}-${index}`} className="grid grid-cols-[120px_minmax(0,1fr)] border-b border-slate-100 last:border-b-0"><dt className="bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">{item.label}</dt><dd className="px-3 py-3 text-xs leading-5 text-slate-800">{item.isLink ? <a href={item.value} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">{item.value}</a> : item.value}</dd></div>)}</dl>
              </div>

              {!!drawerMessage.relatedResources?.length && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><ExternalLink className="h-4 w-4 text-purple-500" /><h4 className="text-xs font-black text-slate-800">关联资源</h4></div>
                    <span className="text-[11px] text-slate-400">共 {drawerMessage.relatedResources.length} 条</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {drawerMessage.relatedResources.map((resource, index) => (
                      <button
                        key={`${resource.id}-${index}`}
                        onClick={() => onOpenResource?.(resource)}
                        className="flex w-full items-center gap-3 border-b border-slate-100 px-3.5 py-3 text-left transition last:border-b-0 hover:bg-purple-50/60"
                      >
                        <span className="rounded bg-purple-50 px-2 py-1 text-[10px] font-black text-purple-700">{resource.type}</span>
                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">{resource.name}</span>
                        <span className="shrink-0 text-[11px] font-bold text-purple-600">查看详情</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {drawerMessage.approvalType === "credits" && <ApprovalActionBox message={drawerMessage} onApprove={(id) => onApproveCredits?.(id)} onReject={(id, reason) => onRejectCredits?.(id, reason)} />}
              {drawerMessage.template === "security" && drawerMessage.severity === "danger" && <div className="mt-5 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /><div><p className="text-xs font-black text-rose-800">需要关注</p><p className="mt-1 text-xs leading-5 text-rose-700">请核对操作人、发生时间、设备环境与业务范围，并根据审计结果及时处理。</p></div></div>}
              {actionFeedback && <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{actionFeedback}</div>}
            </div>
            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4"><span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:inline-flex"><MessageSquare className="h-3 w-3" />事件编号：{drawerMessage.eventCode ?? "MESSAGE_EVENT"}</span><div className="ml-auto flex gap-2"><button onClick={() => setDrawerMessageId(null)} className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50">关闭</button>{drawerMessage.actionLabel && drawerMessage.approvalStatus !== "pending" && <button onClick={() => handleMessageAction(drawerMessage)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-xs font-bold text-white hover:bg-purple-700">{drawerMessage.actionLabel}<ChevronRight className="h-3.5 w-3.5" /></button>}</div></footer>
          </section>
        </div>
      )}
    </div>
  );
}
