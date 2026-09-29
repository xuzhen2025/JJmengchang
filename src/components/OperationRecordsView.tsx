import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ClipboardList, Download, FileOutput, Film, HelpCircle, LogIn, Pencil, Search, Send, Upload } from "lucide-react";
import AssetPagination from "./AssetPagination";
import { canUseDerivations } from "../lib/derivationPermissions";
import { AdDialog, buttonClass, inputClass, primaryClass } from "./AdPushDialogs";
import { PushRecordsModal } from "./AdAccountPush";
import AdPushWorkspace from "./AdPushWorkspace";
import DerivationNoteDialog from "./DerivationNoteDialog";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { openDerivativeAnalytics } from "../lib/analyticsNavigation";
import { buildAnalyticsExportName, exportAnalyticsRows, type AnalyticsExportFormat } from "../lib/analyticsExport";
import { DERIVATION_HISTORY_COLUMNS, derivationHistoryExportRows, derivationHistoryFilters, derivationHistoryRows, filterDerivationHistory, type DerivationHistoryFilters } from "../lib/derivationHistory";
import { openFinishedLibrary } from "../lib/resourceNavigation";
import {
  AD_PUSH_STATUSES,
  cancelActiveAdRecords,
  getAdActor,
  isAdActive,
  isCreatingAdPlan,
  adRetryBlockReason,
  retryAdRecords,
  updateAdStore,
  type AdDraft,
  type AdPushRecord,
  type AdVideo,
} from "../lib/adPush";
import { useAdStore } from "../lib/useAdStore";
import { seedOperationAdExamples } from "../lib/operationAdExamples";
import { AD_PLAN_QUEUE_STATUSES, adPlanQueueActionIds, adPlanQueueFilters, adPlanQueueRows, applyAdPlanQueueAction, filterAdPlanQueue, type AdPlanQueueFilters } from "../lib/adPlanQueue";
import {
  DERIVATION_STATUSES,
  changeDerivations,
  derivationVideo,
  seedDerivationExamples,
  useDerivationRecords,
  validateDerivationSelection,
  type DerivationRecord,
} from "../lib/videoDerivation";
import {
  downloadHistoryMedia,
  seedOperationExamples,
  useOperationRecords,
  type OperationKind,
  type OperationRecord,
} from "../lib/operationHistory";
import type { ResourceSearchType } from "../types";
import { hasUserPermission, useUserPermissions, OPERATION_RECORDS_EXPORT_KEY } from "../lib/userPermissions";

const tabs = [
  { id: "derivation", name: "衍生视频记录", icon: Film },
  { id: "push", name: "推送视频记录", icon: Send },
  { id: "plan", name: "创建计划队列", icon: ClipboardList },
  { id: "upload", name: "上传文件记录", icon: Upload },
  { id: "export", name: "导出记录", icon: FileOutput },
  { id: "download", name: "下载记录", icon: Download },
  { id: "login", name: "登录记录", icon: LogIn },
] as const;

type Tab = (typeof tabs)[number]["id"];
const date = (time: number) => new Date(time).toLocaleString("sv-SE");
const today = () => new Date().toLocaleDateString("sv-SE");
const includes = (text: string, value: string) => text.toLowerCase().includes(value.trim().toLowerCase());
const th = "px-4 py-3 text-left font-bold text-slate-500 whitespace-nowrap";
const td = "px-4 py-3 align-middle text-slate-600";
const uploadResourceTypes = new Set<ResourceSearchType>(["成片", "素材", "第三方", "脚本", "图片", "音频"]);

function isUploadResourceType(type: string): type is ResourceSearchType {
  return uploadResourceTypes.has(type as ResourceSearchType);
}

interface OperationRecordsViewProps {
  onOpenResource?: (record: OperationRecord & { type: ResourceSearchType }) => void;
}

export default function OperationRecordsView({ onOpenResource }: OperationRecordsViewProps) {
  const actor = getAdActor();
  return <OperationRecords key={actor.id} ownerId={actor.id} ownerName={actor.name} onOpenResource={onOpenResource} />;
}

function OperationRecords({ ownerId, ownerName, onOpenResource }: { ownerId: string; ownerName: string; onOpenResource?: OperationRecordsViewProps["onOpenResource"] }) {
  useAdStore();
  const allowed = canUseDerivations(getAdActor());
  const { has } = useUserPermissions();
  const tabPermissionMap: Record<Tab, string> = {
    derivation: "uc_operation_records_derivation",
    push: "uc_operation_records_push",
    plan: "uc_operation_records_plan",
    upload: "uc_operation_records_upload",
    export: "uc_operation_records_export",
    download: "uc_operation_records_download",
    login: "uc_operation_records_login",
  };
  // 菜单权限过滤：缺失即隐藏对应子页入口
  const visibleTabs = tabs.filter(t => has(tabPermissionMap[t.id]));
  const [tab, setTab] = useState<Tab>("derivation");

  useEffect(() => {
    if (allowed) {
      seedDerivationExamples(ownerId, ownerName);
    }
    seedOperationExamples(ownerId);
    seedOperationAdExamples();
  }, [ownerId, ownerName, allowed]);

  return <div data-testid="operation-records" className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 text-slate-800">
    <div className="shrink-0 px-5 pb-1 pt-4">
      <div className="flex gap-2 overflow-x-auto rounded-module border border-slate-200 bg-slate-50 p-1.5" role="tablist" aria-label="操作记录分类">
        {visibleTabs.map(({ id, name, icon: Icon }) => <button
          role="tab"
          aria-selected={tab === id}
          key={id}
          onClick={() => setTab(id)}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-xs font-bold ${tab === id ? "border-purple-200 bg-white text-violet-600 shadow-xs" : "border-transparent text-slate-600 hover:bg-slate-100"}`}
        ><Icon size={16} />{name}</button>)}
      </div>
    </div>
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-module bg-white" role="tabpanel">
      {!has(tabPermissionMap[tab]) ? <p role="status" className="py-16 text-center text-sm text-slate-400">暂无权限</p> : tab === "derivation"
        ? allowed
          ? <DerivationHistory ownerId={ownerId} ownerName={ownerName} />
          : <p role="status" className="py-16 text-center text-sm text-slate-400">暂无衍生视频查看权限</p>
        : tab === "push"
          ? <PushHistory ownerId={ownerId} />
          : tab === "plan"
            ? <PlanHistory ownerId={ownerId} />
            : <SimpleHistory key={tab} kind={tab} ownerId={ownerId} ownerName={ownerName} onOpenResource={onOpenResource} />}
    </main>
  </div>;
}

function DerivationHistory({ ownerId, ownerName }: { ownerId: string; ownerName: string }) {
  const records = useDerivationRecords();
  const store = useAdStore();
  const [draft, setDraft] = useState<DerivationHistoryFilters>(derivationHistoryFilters);
  const [filters, setFilters] = useState<DerivationHistoryFilters>(derivationHistoryFilters);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ id: string; source: boolean } | null>(null);
  const [noteIds, setNoteIds] = useState<string[] | null>(null);
  const [action, setAction] = useState<{ kind: "retry" | "cancel" | "delete"; ids: string[] } | null>(null);
  const [push, setPush] = useState<{ videos: AdVideo[]; draft?: AdDraft } | null>(null);
  const [pushDetailId, setPushDetailId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportAnchor = useRef<HTMLButtonElement>(null);
  const tableRows = useMemo(() => derivationHistoryRows(records, store.records, ownerId, ownerName), [records, store.records, ownerId, ownerName]);
  const filtered = filterDerivationHistory(tableRows, filters);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const chosen = tableRows.filter(row => selected.includes(row.output.id));
  const everySelected = (status: DerivationRecord["status"]) => chosen.length > 0 && chosen.length === selected.length && chosen.every(row => row.output.status === status);
  const previewRecord = tableRows.find(row => row.output.id === preview?.id)?.output;
  const previewVideo = previewRecord && (preview?.source ? previewRecord.source : previewRecord.status === "成功" ? derivationVideo(previewRecord) : null);
  const notes = noteIds ? tableRows.filter(row => noteIds.includes(row.output.id)).map(row => row.output.note) : [];
  const change = (key: keyof DerivationHistoryFilters, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const selectValid = (ids: string[], statuses?: readonly DerivationRecord["status"][]) => validateDerivationSelection(ids, getAdActor().id, statuses);
  const notify = (message: string) => { setNotice(message); setError(""); };
  const fail = (cause: unknown) => { setError(cause instanceof Error ? cause.message : "操作失败，请重试"); setNotice(""); };
  const query = () => {
    if (!draft.start || !draft.end || draft.start > draft.end) { setError("请选择有效的衍生时间范围"); setNotice(""); return; }
    setFilters({ ...draft }); setPage(1); setSelected([]); setError(""); setNotice("");
  };
  const requestAction = (kind: "retry" | "cancel" | "delete", ids: string[]) => {
    try { selectValid(ids, [kind === "retry" ? "失败" : kind === "cancel" ? "待衍生" : "成功"]); setAction({ kind, ids: [...ids] }); setError(""); }
    catch (cause) { fail(cause); }
  };
  const startPush = (ids: string[], initialDraft?: AdDraft) => {
    try {
      setPush({ videos: selectValid(ids, ["成功"]).map(derivationVideo), draft: initialDraft ? { ...initialDraft, derivation: undefined } : undefined });
      setPushDetailId(null); setError("");
    } catch (cause) { fail(cause); }
  };
  const download = async (ids: string[]) => {
    setBusy(true); setError(""); setNotice(""); let count = 0;
    try {
      for (const record of selectValid(ids, ["成功"])) {
        selectValid([record.id], ["成功"]);
        await downloadHistoryMedia(record.url, record.name); count++;
      }
      notify(`已发起 ${count} 个视频的下载`);
    } catch (cause) { fail(new Error(`${count ? `已发起 ${count} 个下载；` : ""}${cause instanceof Error ? cause.message : "下载失败"}`)); }
    finally { setBusy(false); }
  };
  const editNotes = (ids: string[]) => {
    try { selectValid(ids); setNoteIds([...ids]); setError(""); }
    catch (cause) { fail(cause); }
  };
  const exportRows = async (format: AnalyticsExportFormat) => {
    setExportOpen(false); setBusy(true); setError(""); setNotice("");
    try {
      selectValid(filtered.map(row => row.output.id));
      const name = buildAnalyticsExportName({ pageName: "衍生视频记录", startDate: filters.start, endDate: filters.end,
        filters: [{ label: "视频ID", value: filters.videoId }, { label: "状态", value: filters.status }, { label: "操作人", value: filters.operator ? ownerName : "" }, { label: "推送记录ID", value: filters.pushId }, { label: "素材ID", value: filters.assetId }, { label: "视频标题", value: filters.title }, { label: "备注", value: filters.note }] });
      await exportAnalyticsRows(derivationHistoryExportRows(filtered), { format, name, startDate: filters.start, endDate: filters.end }, "衍生视频记录");
      notify(`已导出 ${filtered.length} 条衍生视频记录`);
    } catch (cause) { fail(cause); }
    finally { setBusy(false); }
  };

  return <div className="min-w-0 p-5" data-testid="derivation-history">
    <form onSubmit={event => { event.preventDefault(); query(); }} className="mb-5 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <input aria-label="视频ID" placeholder="请输入视频ID" className={inputClass} value={draft.videoId} onChange={event => change("videoId", event.target.value)} />
        <select aria-label="衍生状态" className={inputClass} value={draft.status} onChange={event => change("status", event.target.value)}><option value="">请选择状态</option>{DERIVATION_STATUSES.map(status => <option key={status}>{status}</option>)}</select>
        <select aria-label="操作人" className={inputClass} value={draft.operator} onChange={event => change("operator", event.target.value)}><option value="">请选择操作人</option>{[...new Map(tableRows.map(row => [row.output.ownerId, row.operator])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        {([['pushId', '推送记录ID'], ['assetId', '素材ID'], ['title', '视频标题'], ['note', '备注关键词']] as const).map(([key, label]) => <input key={key} aria-label={label} placeholder={`请输入${label}`} className={inputClass} value={draft[key]} onChange={event => change(key, event.target.value)} />)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DateRange compact start={draft.start} end={draft.end} onStart={start => change("start", start)} onEnd={end => change("end", end)} />
        <button type="submit" className={primaryClass}><Search size={14} />查询</button>
        <button type="button" className={primaryClass} disabled={!everySelected("失败")} title="重试所选失败记录" onClick={() => requestAction("retry", selected)}>批量重试</button>
        <button type="button" className={primaryClass} disabled={!everySelected("待衍生")} title="取消所选待衍生记录" onClick={() => requestAction("cancel", selected)}>批量取消</button>
        <button type="button" className={primaryClass} disabled={!everySelected("成功")} onClick={() => startPush(selected)}>批量推送</button>
        <button type="button" className={primaryClass} disabled={!everySelected("成功") || busy} onClick={() => void download(selected)}>批量下载</button>
        <button type="button" className={primaryClass} disabled={!selected.length} onClick={() => editNotes(selected)}>批量备注</button>
        <button type="button" ref={exportAnchor} className={primaryClass} disabled={!filtered.length || busy} aria-haspopup="menu" aria-expanded={exportOpen} onClick={() => { if (!hasUserPermission(OPERATION_RECORDS_EXPORT_KEY)) { setError("暂无权限"); setNotice(""); return; } setExportOpen(value => !value); }}>导出<ChevronDown size={14} /></button>
      </div>
    </form>
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
    {notice && <p role="status" className="mb-3 text-sm text-emerald-600">{notice}</p>}
    <div className="max-w-full overflow-x-auto border-y border-slate-100">
      <table className="w-full min-w-[1800px] table-fixed text-xs text-slate-900">
        <colgroup>{[44, 210, 210, 160, 90, 86, 90, 140, 140, 190, 150, 155, 170].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
        <thead className="bg-slate-50"><tr>
          <th className={th}><input type="checkbox" aria-label="选择本页全部衍生视频" checked={rows.length > 0 && rows.every(row => selected.includes(row.output.id))} ref={element => { if (element) element.indeterminate = rows.some(row => selected.includes(row.output.id)) && !rows.every(row => selected.includes(row.output.id)); }} onChange={event => setSelected(event.target.checked ? rows.map(row => row.output.id) : [])} /></th>
          {DERIVATION_HISTORY_COLUMNS.map(label => <th key={label} className={th}>{label === "素材ID" ? <span className="inline-flex items-center gap-1">素材ID<DerivationMaterialHelp /></span> : label}</th>)}
        </tr></thead>
        <tbody>{rows.map(({ output: record, pushes, assetIds, operator }) => {
          const cell = "px-4 py-3 align-middle break-words leading-5";
          return <tr key={record.id} data-derivative-id={record.id} data-testid={`derivation-row-${record.status}`} className="border-b border-slate-100 hover:bg-slate-50/60">
            <td className={cell}><input type="checkbox" aria-label={`选择衍生视频 ${record.name}`} checked={selected.includes(record.id)} onChange={event => setSelected(event.target.checked ? [...selected, record.id] : selected.filter(id => id !== record.id))} /></td>
            <td className={cell}><button type="button" className="text-left hover:text-violet-600" disabled={!record.source.videoUrl} onClick={() => setPreview({ id: record.id, source: true })}>{record.source.title}</button><p className="mt-1 break-all text-[11px]">ID：{record.source.id}</p></td>
            <td className={cell}><button type="button" className="text-left enabled:hover:text-violet-600" disabled={record.status !== "成功"} onClick={() => { try { selectValid([record.id], ["成功"]); setPreview({ id: record.id, source: false }); } catch (cause) { fail(cause); } }}>{record.name}</button></td>
            <td className={`${cell} break-all`}>{assetIds.join(" / ") || "--"}</td>
            <td className={cell}><StatusBadge status={record.status} /></td>
            <td className={cell}>{record.reviewBlocked === null ? "--" : <span className={`inline-flex rounded border px-2 py-1 ${record.reviewBlocked ? "border-amber-200 bg-amber-50 text-amber-600" : "border-emerald-200 bg-emerald-50 text-emerald-600"}`}>{record.reviewBlocked ? "是" : "否"}</span>}</td>
            <td className={cell}>{operator}</td>
            <td className={cell}>{date(record.createdAt)}</td><td className={cell}>{date(record.updatedAt)}</td>
            <td className={`${cell} break-all`}>{pushes.length ? <div className="space-y-2">{pushes.map(linked => <button key={linked.id} type="button" className="block text-left hover:text-violet-600" onClick={() => setPushDetailId(linked.id)}>{linked.id}</button>)}</div> : "--"}</td>
            <td className={cell}><div className="flex items-start gap-2"><button type="button" className="min-w-0 break-words text-left" onClick={() => editNotes([record.id])}>{record.note || "--"}</button><button type="button" title="编辑备注" aria-label={`编辑备注 ${record.name}`} className="shrink-0 pt-0.5 text-violet-600" onClick={() => editNotes([record.id])}><Pencil size={14} /></button></div></td>
            <td className={cell}><div className="flex flex-wrap gap-x-3 gap-y-2 text-violet-600">
              {record.status === "成功" && <><button type="button" disabled={busy} onClick={() => void download([record.id])}>下载</button><button type="button" onClick={() => startPush([record.id])}>推送</button><button type="button" onClick={() => requestAction("delete", [record.id])}>删除</button><button type="button" onClick={() => { try { selectValid([record.id], ["成功"]); openDerivativeAnalytics(record.id); } catch (cause) { fail(cause); } }}>查看数据</button></>}
              {record.status === "失败" && <button type="button" onClick={() => requestAction("retry", [record.id])}>重试</button>}
              {record.status === "待衍生" && <button type="button" onClick={() => requestAction("cancel", [record.id])}>取消</button>}
              {["处理中", "取消衍生", "已删除"].includes(record.status) && <span className="text-slate-900">--</span>}
            </div></td>
            <td className={cell}>{record.message || "--"}</td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className="py-16 text-center text-sm text-slate-400">暂无数据</p>}
    </div>
    <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={value => { setPage(value); setSelected([]); }} onPageSizeChange={size => { setPageSize(size); setPage(1); setSelected([]); }} />
    {exportOpen && <AnchoredPopover anchorRef={exportAnchor} align="end" width={160} onClose={() => setExportOpen(false)} className="rounded-md border border-slate-200 bg-white p-1 shadow-xl"><div role="menu" aria-label="导出衍生视频记录">{([['csv', '导出CSV'], ['xlsx', '导出Excel']] as const).map(([format, label]) => <button key={format} type="button" role="menuitem" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-slate-700 hover:bg-violet-50" onClick={() => void exportRows(format)}><FileOutput size={14} />{label}</button>)}</div></AnchoredPopover>}
    {noteIds && <DerivationNoteDialog initialNote={notes.every(note => note === notes[0]) ? notes[0] || "" : ""} onClose={() => setNoteIds(null)} onSave={note => { changeDerivations(noteIds, getAdActor().id, "note", note); setNoteIds(null); notify(`已保存 ${noteIds.length} 条记录的备注`); }} />}
    {action && <AdDialog title={action.kind === "delete" ? "删除衍生视频" : action.kind === "retry" ? "重试衍生" : "取消衍生"} onClose={() => setAction(null)} footer={<><button type="button" className={buttonClass} onClick={() => setAction(null)}>取消</button><button type="button" className={primaryClass} onClick={() => {
      try { changeDerivations(action.ids, getAdActor().id, action.kind); setSelected([]); notify(action.kind === "retry" ? `已提交 ${action.ids.length} 条衍生记录重试` : action.kind === "cancel" ? `已取消 ${action.ids.length} 条待衍生记录` : "衍生视频文件已删除"); }
      catch (cause) { fail(cause); }
      setAction(null);
    }}>确定</button></>}><p className="text-sm leading-6">{action.kind === "delete" ? `确定删除 ${action.ids.length} 个衍生视频文件？原成片与历史记录保留，删除后无法预览、下载或再次推送。` : action.kind === "retry" ? `确定重试所选 ${action.ids.length} 条失败记录？重试后更新原记录，不会重复新增。` : `确定取消所选 ${action.ids.length} 条待衍生记录？相关待执行推送也将取消。`}</p></AdDialog>}
    {previewVideo?.videoUrl && <AdDialog title={previewVideo.title} onClose={() => setPreview(null)}><video src={previewVideo.videoUrl} controls autoPlay className="max-h-[65vh] w-full bg-black" /></AdDialog>}
    {pushDetailId && <PushRecordsModal initialDetailId={pushDetailId} currentUserOnly onClose={() => setPushDetailId(null)} onEdit={(initialDraft, record) => { if (record?.derivativeId) startPush([record.derivativeId], initialDraft); }} />}
    {push && <AdPushWorkspace video={push.videos[0]} videos={push.videos} initialDraft={push.draft} onClose={() => setPush(null)} onCreate={created => { updateAdStore(current => ({ ...current, records: [...created, ...current.records] })); setPush(null); setSelected([]); notify(`已提交 ${created.length} 条推送记录`); }} />}
  </div>;
}

function DerivationMaterialHelp() {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return <><button type="button" ref={anchor} aria-label="素材ID说明" aria-describedby={open ? "derivation-material-help" : undefined} className="inline-flex h-5 w-5 items-center justify-center text-slate-400" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}><HelpCircle size={13} /></button>
    {open && <AnchoredPopover anchorRef={anchor} side="top" align="center" width={380} gap={8} onClose={() => setOpen(false)} className="pointer-events-none rounded-md bg-neutral-800 px-4 py-3 text-xs font-normal text-white shadow-lg"><div id="derivation-material-help" role="tooltip" className="whitespace-normal leading-6">列表中的视频无素材ID，通常由以下情况导致：<br />1.仅执行了衍生操作，尚未推送。<br />2.衍生并推送后，操作被取消。<br />若您的操作不属于上述情况，请联系客服协助排查。</div></AnchoredPopover>}
  </>;
}

const pushEmpty = () => ({ videoId: "", videoType: "", accountId: "", pushType: "", assetId: "", status: "", operator: "", taskId: "", start: today(), end: today() });
type PushFilters = ReturnType<typeof pushEmpty>;

function PushHistory({ ownerId }: { ownerId: string }) {
  const store = useAdStore();
  const [draft, setDraft] = useState<PushFilters>(pushEmpty);
  const [filters, setFilters] = useState<PushFilters>(pushEmpty);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState<"retry" | "cancel" | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const related = useMemo(() => store.records.filter(record => record.operatorId === ownerId), [store.records, ownerId]);
  const operators = unique(related.map(record => record.operator));
  const filtered = related.filter(record => {
    const videoType = record.derivativeId ? "衍生视频" : record.snapshot.version;
    return includes(record.videoId, filters.videoId) &&
      (!filters.videoType || videoType === filters.videoType) &&
      includes(record.accountId, filters.accountId) &&
      (!filters.pushType || (record.method === "push" ? "push" : isCreatingAdPlan(record.snapshot) ? "create" : "append") === filters.pushType) &&
      includes(record.assetId, filters.assetId) &&
      (!filters.status || record.status === filters.status) &&
      (!filters.operator || record.operator === filters.operator) &&
      includes(record.taskId, filters.taskId) &&
      (!filters.start || record.createdAt.slice(0, 10) >= filters.start) &&
      (!filters.end || record.createdAt.slice(0, 10) <= filters.end);
  }).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const todayRecords = related.filter(record => record.createdAt.slice(0, 10) === today());
  const selectedRows = related.filter(record => selected.includes(record.id));

  const query = () => {
    if (!draft.start || !draft.end || draft.start > draft.end) {
      setError("请选择有效的推送时间范围");
      return;
    }
    setFilters({ ...draft });
    setSelected([]);
    setPage(1);
    setError("");
    setNotice("");
  };

  const requestAction = (action: "retry" | "cancel") => {
    if (!selectedRows.length) {
      setError("请先选择需要操作的推送记录");
      return;
    }
    if (action === "retry" && selectedRows.some(record => record.status !== "推送失败")) {
      setError("批量重试仅支持推送失败的记录");
      return;
    }
    if (action === "retry") {
      const issue = selectedRows.map(adRetryBlockReason).find(Boolean);
      if (issue) { setError(issue); return; }
    }
    if (action === "cancel" && selectedRows.some(record => !isAdActive(record))) {
      setError("批量取消仅支持进行中的推送记录");
      return;
    }
    setError("");
    setConfirmAction(action);
  };

  const applyAction = () => {
    if (!confirmAction) return;
    try {
      if (confirmAction === "retry") retryAdRecords(selected, ownerId);
      else cancelActiveAdRecords(selected, ownerId);
      setNotice(confirmAction === "retry" ? `已重试 ${selected.length} 条推送记录` : `已取消 ${selected.length} 条推送记录`);
      setSelected([]);
      setConfirmAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "操作失败");
      setConfirmAction(null);
    }
  };

  return <div className="min-w-0 p-5" data-testid="push-history">
    <form onSubmit={event => { event.preventDefault(); query(); }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <input aria-label="视频ID" placeholder="请输入视频ID" className={inputClass} value={draft.videoId} onChange={event => setDraft({ ...draft, videoId: event.target.value })} />
        <select aria-label="推送视频类型" className={inputClass} value={draft.videoType} onChange={event => setDraft({ ...draft, videoType: event.target.value })}><option value="">请选择推送视频类型</option><option>原片</option><option>转码后视频</option><option>衍生视频</option></select>
        <input aria-label="广告账户ID" placeholder="请输入广告账户ID" className={inputClass} value={draft.accountId} onChange={event => setDraft({ ...draft, accountId: event.target.value })} />
        <select aria-label="推送类型" className={inputClass} value={draft.pushType} onChange={event => setDraft({ ...draft, pushType: event.target.value })}><option value="">请选择推送类型</option><option value="push">仅推送</option><option value="create">新建计划并投放</option><option value="append">追加已有计划</option></select>
        <input aria-label="推送素材ID" placeholder="请输入素材ID" className={inputClass} value={draft.assetId} onChange={event => setDraft({ ...draft, assetId: event.target.value })} />
        <select aria-label="推送状态" className={inputClass} value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option value="">请选择状态</option>{AD_PUSH_STATUSES.map(status => <option key={status}>{status}</option>)}</select>
        <select aria-label="操作人" className={inputClass} value={draft.operator} onChange={event => setDraft({ ...draft, operator: event.target.value })}><option value="">请选择操作人</option>{operators.map(operator => <option key={operator}>{operator}</option>)}</select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input aria-label="推送任务ID" placeholder="请输入任务ID" className={`${inputClass} !w-52`} value={draft.taskId} onChange={event => setDraft({ ...draft, taskId: event.target.value })} />
        <DateRange start={draft.start} end={draft.end} onStart={start => setDraft({ ...draft, start })} onEnd={end => setDraft({ ...draft, end })} />
      </div>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={primaryClass}><Search size={14} />查询</button>
          <button type="button" className={primaryClass} disabled={!selected.length} onClick={() => requestAction("retry")}>批量重试</button>
          <button type="button" className={primaryClass} disabled={!selected.length} onClick={() => requestAction("cancel")}>批量取消</button>
        </div>
        <div className="flex flex-wrap items-center rounded-md border border-violet-100 bg-violet-50/40 px-4 py-2 text-xs text-slate-600 shadow-xs">
          <span className="border-r border-slate-200 pr-4">今日创建推送 <b className="ml-2 text-slate-900">{todayRecords.length}</b></span>
          <span className="border-r border-slate-200 px-4">今日成功推送 <b className="ml-2 text-slate-900">{todayRecords.filter(record => record.status === "推送成功").length}</b></span>
          <span className="pl-4">堆积等待推送 <b className="ml-2 text-orange-600">{related.filter(isAdActive).length}</b></span>
        </div>
      </div>
    </form>
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
    {notice && <p role="status" className="mb-3 text-sm text-emerald-600">{notice}</p>}

    <div className="mr-10 max-w-full overflow-x-auto border-y border-slate-100">
      <table className="w-full min-w-[1650px] text-xs">
        <thead className="bg-slate-50"><tr>
          <th className={th}><input aria-label="选择本页全部推送记录" type="checkbox" checked={rows.length > 0 && rows.every(row => selected.includes(row.id))} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...rows.map(row => row.id)])] : selected.filter(id => !rows.some(row => row.id === id)))} /></th>
          {["视频标题", "推送视频", "广告账户", "媒体", "素材ID", "推送状态", "失败原因", "操作人", "创建推送时间", "更新时间", "任务ID", "操作"].map(label => <th key={label} className={th}>{label}</th>)}
        </tr></thead>
        <tbody>{rows.map(record => <tr key={record.id} data-testid={`push-row-${record.status}`} className="border-b border-slate-100 hover:bg-slate-50/60">
          <td className={td}><input aria-label={`选择推送记录 ${record.id}`} type="checkbox" checked={selected.includes(record.id)} onChange={event => setSelected(event.target.checked ? [...selected, record.id] : selected.filter(id => id !== record.id))} /></td>
          <td className={`${td} max-w-60 whitespace-normal leading-5`}><span className="font-bold text-slate-800">{record.videoTitle}</span><p className="mt-1 break-all text-[11px] text-slate-400">{record.videoId}</p></td>
          <td className={`${td} max-w-60 whitespace-normal leading-5`}>{record.assetName || record.videoTitle}<p className="mt-1 break-all text-[11px] text-slate-400">{record.derivativeId || record.snapshot.version}</p></td>
          <td className={`${td} max-w-56 whitespace-normal leading-5`}>{record.account}<p className="mt-1 break-all text-[11px] text-slate-400">{record.accountId}</p></td>
          <td className={td}>{record.platform}</td>
          <td className={`${td} max-w-48 break-all`}>{record.assetId || "--"}</td>
          <td className={td}><StatusBadge status={record.status} /></td>
          <td className={`${td} max-w-60 whitespace-normal leading-5 text-rose-600`}>{record.failureReason || "--"}</td>
          <td className={td}>{record.operator}</td>
          <td className={`${td} whitespace-nowrap`}>{record.createdAt}</td>
          <td className={`${td} whitespace-nowrap`}>{record.updatedAt}</td>
          <td className={`${td} max-w-48 break-all font-mono`}>{record.taskId}</td>
          <td className={td}><button className="whitespace-nowrap text-violet-600" onClick={() => setDetailId(record.id)}>详情</button></td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="py-16 text-center text-sm text-slate-400">暂无数据</p>}
    </div>
    <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />

    {confirmAction && <AdDialog
      title={confirmAction === "retry" ? "批量重试" : "批量取消"}
      onClose={() => setConfirmAction(null)}
      footer={<><button type="button" className={buttonClass} onClick={() => setConfirmAction(null)}>取消</button><button type="button" className={primaryClass} onClick={applyAction}>{confirmAction === "retry" ? "确认重试" : "确认取消"}</button></>}
    ><p className="text-sm leading-6">{confirmAction === "retry" ? `确认重试所选 ${selected.length} 条记录的未完成步骤？已成功上传或创建的结果保留。` : `确认取消所选 ${selected.length} 条记录的未完成步骤？已上传素材、已创建计划及千川正在执行的投放不撤销。`}</p></AdDialog>}
    {detailId && <PushRecordsModal initialDetailId={detailId} currentUserOnly onClose={() => setDetailId(null)} onEdit={() => { setDetailId(null); openFinishedLibrary(); }} />}
  </div>;
}

function PlanHistory({ ownerId }: { ownerId: string }) {
  const store = useAdStore();
  const [draft, setDraft] = useState<AdPlanQueueFilters>(adPlanQueueFilters);
  const [filters, setFilters] = useState<AdPlanQueueFilters>(adPlanQueueFilters);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState<"retry" | "cancel" | null>(null);
  const related = useMemo(() => adPlanQueueRows(store.records, ownerId), [store.records, ownerId]);
  const operators = unique(related.map(row => row.records[0].operator));
  const filtered = filterAdPlanQueue(related, filters);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const change = (key: keyof AdPlanQueueFilters, value: string) => setDraft(current => ({ ...current, [key]: value }));

  const query = () => {
    if (!draft.start || !draft.end || draft.start > draft.end) { setError("请选择有效的操作时间范围"); return; }
    setFilters({ ...draft }); setPage(1); setSelected([]); setError(""); setNotice("");
  };
  const requestAction = (action: "retry" | "cancel") => {
    try {
      adPlanQueueActionIds(related, selected, action);
      setError(""); setNotice(""); setConfirmAction(action);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "操作失败"); }
  };
  const applyAction = () => {
    if (!confirmAction) return;
    try {
      applyAdPlanQueueAction(selected, confirmAction, ownerId);
      setNotice(confirmAction === "retry" ? `已重试 ${selected.length} 个计划的未完成步骤` : `已取消 ${selected.length} 个计划的未完成步骤`);
      setSelected([]); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "操作失败"); }
    setConfirmAction(null);
  };

  return <div className="min-w-0 p-5" data-testid="plan-history">
    <form onSubmit={event => { event.preventDefault(); query(); }} className="mb-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <input aria-label="视频ID" placeholder="请输入视频ID" className={inputClass} value={draft.videoId} onChange={event => change("videoId", event.target.value)} />
        <input aria-label="广告账户ID" placeholder="请输入广告账户ID" className={inputClass} value={draft.accountId} onChange={event => change("accountId", event.target.value)} />
        <input aria-label="计划ID" placeholder="请输入计划ID" className={inputClass} value={draft.planId} onChange={event => change("planId", event.target.value)} />
        <input aria-label="模板名称" placeholder="请输入模板名称" className={inputClass} value={draft.templateName} onChange={event => change("templateName", event.target.value)} />
        <select aria-label="推送类型" className={inputClass} value={draft.platform} onChange={event => change("platform", event.target.value)}><option value="">请选择推送类型</option><option>巨量千川</option><option>巨量广告</option></select>
        <select aria-label="营销目标" className={inputClass} value={draft.goal} onChange={event => change("goal", event.target.value)}><option value="">请选择营销目标</option><option>推商品</option><option>推直播间</option></select>
        <select aria-label="创建状态" className={inputClass} value={draft.status} onChange={event => change("status", event.target.value)}><option value="">请选择状态</option>{AD_PLAN_QUEUE_STATUSES.map(status => <option key={status}>{status}</option>)}</select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select aria-label="操作人" className={`${inputClass} sm:!w-40 2xl:!w-52`} value={draft.operator} onChange={event => change("operator", event.target.value)}><option value="">请选择操作人</option>{operators.map(operator => <option key={operator}>{operator}</option>)}</select>
        <input aria-label="任务ID" placeholder="请输入任务ID" className={`${inputClass} sm:!w-40 2xl:!w-52`} value={draft.taskId} onChange={event => change("taskId", event.target.value)} />
        <DateRange compact start={draft.start} end={draft.end} onStart={start => change("start", start)} onEnd={end => change("end", end)} />
        <div className="flex shrink-0 gap-3">
          <button type="submit" className={primaryClass}><Search size={14} />查询</button>
          <button type="button" className={primaryClass} disabled={!selected.length} onClick={() => requestAction("retry")}>批量重试</button>
          <button type="button" className={primaryClass} disabled={!selected.length} onClick={() => requestAction("cancel")}>批量取消</button>
        </div>
      </div>
    </form>
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
    {notice && <p role="status" className="mb-3 text-sm text-emerald-600">{notice}</p>}
    <div className="mr-10 max-w-full overflow-x-auto border-y border-slate-100">
      <table className="w-full min-w-[1500px] text-xs">
        <thead className="bg-slate-50"><tr>
          <th className={th}><input type="checkbox" aria-label="选择本页全部创建计划记录" checked={rows.length > 0 && rows.every(row => selected.includes(row.id))} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...rows.map(row => row.id)])] : selected.filter(id => !rows.some(row => row.id === id)))} /></th>
          {["视频标题", "计划模板", "定向", "广告账户", "营销目标", "推送状态", "失败原因", "操作人", "操作时间", "更新时间", "任务ID"].map(label => <th key={label} className={th}>{label}</th>)}
        </tr></thead>
        <tbody>{rows.map(row => {
          const record = row.records[0];
          const videos = [...new Map(row.records.map(item => [item.derivativeId || item.videoId, item])).values()];
          return <tr key={row.id} data-testid={`plan-row-${row.status}`} className="border-b border-slate-100 hover:bg-slate-50/60">
            <td className={td}><input type="checkbox" aria-label={`选择创建计划 ${record.taskId} ${record.planName || row.id}`} checked={selected.includes(row.id)} onChange={event => setSelected(event.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id))} /></td>
            <td className={`${td} max-w-60 !text-slate-900`}>{videos.map(video => <div key={video.derivativeId || video.videoId} className="mb-2 last:mb-0"><p className="break-words leading-5">{video.derivativeId ? video.assetName || video.videoTitle : video.videoTitle}</p><p className="mt-1 break-all text-[11px]">{video.derivativeId || video.videoId}</p></div>)}</td>
            <td className={`${td} max-w-48 break-words !text-slate-900`}>{record.templateName || record.templateSnapshot?.name || "--"}</td>
            <td className={`${td} !text-slate-900`}>--</td>
            <td className={`${td} max-w-56 !text-slate-900`}>{record.account}<p className="mt-1 break-all text-[11px]">{record.accountId}</p></td>
            <td className={`${td} whitespace-nowrap !text-slate-900`}>{record.marketingGoal}</td>
            <td className={td}><StatusBadge status={row.status} /></td>
            <td className={`${td} max-w-60 whitespace-normal break-words leading-5 !text-slate-900`}>{row.failureReason || "--"}</td>
            <td className={`${td} whitespace-nowrap !text-slate-900`}>{record.operator}</td>
            <td className={`${td} whitespace-nowrap !text-slate-900`}>{row.createdAt}</td>
            <td className={`${td} whitespace-nowrap !text-slate-900`}>{row.updatedAt}</td>
            <td className={`${td} max-w-48 break-all !text-slate-900`}>{record.taskId}</td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className="py-16 text-center text-sm text-slate-400">暂无数据</p>}
    </div>
    <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
    {confirmAction && <AdDialog title={confirmAction === "retry" ? "批量重试" : "批量取消"} onClose={() => setConfirmAction(null)} footer={<><button type="button" className={buttonClass} onClick={() => setConfirmAction(null)}>取消</button><button type="button" className={primaryClass} onClick={applyAction}>{confirmAction === "retry" ? "确认重试" : "确认取消"}</button></>}>
      <p className="text-sm leading-6">{confirmAction === "retry" ? `确认重试所选 ${selected.length} 个计划的未完成步骤？已成功上传的视频不会重复上传，已创建的计划不会重复创建。` : `确认取消所选 ${selected.length} 个计划的未完成步骤？同一计划关联的视频任务一并停止后续处理；已上传的视频不删除，也不会撤销或暂停千川已创建的计划。`}</p>
    </AdDialog>}
  </div>;
}

function DateRange({ start, end, onStart, onEnd, compact = false }: { start: string; end: string; onStart: (value: string) => void; onEnd: (value: string) => void; compact?: boolean }) {
  return <div className={`flex h-8 ${compact ? "min-w-0 w-full sm:w-[340px]" : "min-w-[340px]"} max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500`}>
    <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
    <input aria-label="开始日期" type="date" value={start} onChange={event => onStart(event.target.value)} className="min-w-0 flex-1 bg-transparent text-center outline-none" />
    <span>至</span>
    <input aria-label="结束日期" type="date" min={start} value={end} onChange={event => onEnd(event.target.value)} className="min-w-0 flex-1 bg-transparent text-center outline-none" />
  </div>;
}

function StatusBadge({ status }: { status: string }) {
  const className = status.includes("成功")
    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
    : status.includes("失败")
      ? "border-rose-200 bg-rose-50 text-rose-600"
      : ["待处理", "待衍生", "待创建", "创建中", "处理中", "衍生中", "推送中", "审核中", "创建计划中"].includes(status)
        ? "border-amber-200 bg-amber-50 text-amber-600"
        : "border-slate-200 bg-slate-50 text-slate-500";
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 font-bold ${className}`}>{status}</span>;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function SimpleHistory({ kind, ownerId, ownerName, onOpenResource }: { kind: OperationKind; ownerId: string; ownerName: string; onOpenResource?: OperationRecordsViewProps["onOpenResource"] }) {
  const all = useOperationRecords();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detail, setDetail] = useState<OperationRecord | null>(null);
  const [error, setError] = useState("");
  const own = all.filter(record => record.ownerId === ownerId && record.kind === kind);
  const filtered = own.filter(record => includes(`${record.name} ${record.resourceId || ""}`, search) && (!status || record.status === status) && (!type || record.type === type) && (!start || date(record.createdAt).slice(0, 10) >= start) && (!end || date(record.createdAt).slice(0, 10) <= end)).sort((left, right) => right.createdAt - left.createdAt);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const openDetail = (record: OperationRecord) => {
    const hasResource = (kind === "upload" && record.status === "成功") || (kind === "download" && record.status === "已发起");
    if (hasResource && isUploadResourceType(record.type) && onOpenResource) {
      onOpenResource({ ...record, type: record.type });
      return;
    }
    setDetail(record);
  };
  return <div className="min-w-0 p-5">
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <input aria-label="记录搜索" placeholder={kind === "login" ? "账号" : "文件名称 / 文件ID"} className={inputClass} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
      <select aria-label="记录类型" className={inputClass} value={type} onChange={event => { setType(event.target.value); setPage(1); }}><option value="">{kind === "login" ? "全部浏览器" : "全部类型"}</option>{unique(own.map(record => record.type)).map(value => <option key={value}>{value}</option>)}</select>
      <select aria-label="记录状态" className={inputClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">全部状态</option>{unique(own.map(record => record.status)).map(value => <option key={value}>{value}</option>)}</select>
      <input type="date" aria-label="开始日期" className={inputClass} value={start} onChange={event => { setStart(event.target.value); setPage(1); }} />
      <input type="date" aria-label="结束日期" min={start} className={inputClass} value={end} onChange={event => { setEnd(event.target.value); setPage(1); }} />
      <button className={buttonClass} onClick={() => { setSearch(""); setType(""); setStatus(""); setStart(""); setEnd(""); setPage(1); }}>重置</button>
    </div>
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
    <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[840px] text-xs"><thead className="bg-slate-50"><tr>{[kind === "login" ? "登录账号" : "文件名称", kind === "login" ? "浏览器" : "类型", "状态", "操作人", "操作时间", "系统信息", "操作"].map(label => <th key={label} className={th}>{label}</th>)}</tr></thead><tbody>{rows.map(record => <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/60">
      <td className={`${td} max-w-64 break-words`}>{record.name}{record.resourceId && <p className="mt-1 text-slate-400">{record.resourceId}</p>}</td><td className={td}>{record.type}</td><td className={td}><StatusBadge status={record.status} /></td><td className={td}>{ownerName}</td><td className={td}>{date(record.createdAt)}</td><td className={`${td} max-w-64 text-slate-500`}>{record.message}</td>
      <td className={td}>{kind !== "export" && <button className="text-violet-600" onClick={() => openDetail(record)}>详情</button>}{kind === "export" && record.status === "成功" && record.url && <button className="text-violet-600" onClick={() => { void downloadHistoryMedia(record.url!, record.name, "导出文件").catch(cause => setError(cause.message)); }}>下载</button>}</td>
    </tr>)}</tbody></table>{!rows.length && <p className="py-16 text-center text-sm text-slate-400">暂无数据</p>}</div>
    <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
    {detail && <AdDialog title="记录详情" onClose={() => setDetail(null)}><dl className="grid grid-cols-[85px_minmax(0,1fr)] gap-4 text-sm">{Object.entries({ "记录ID": detail.id, [kind === "login" ? "账号" : "文件名称"]: detail.name, "类型": detail.type, "文件ID": detail.resourceId || "--", "文件大小": detail.size || "--", "状态": detail.status, "操作人": ownerName, "操作时间": date(detail.createdAt), "系统信息": detail.message }).map(([label, value]) => <React.Fragment key={label}><dt className="text-slate-500">{label}</dt><dd className="break-all">{value}</dd></React.Fragment>)}</dl></AdDialog>}
  </div>;
}
