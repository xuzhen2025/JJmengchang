import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Download, FileOutput, Film, LogIn, Search, Send, Upload } from "lucide-react";
import AssetPagination from "./AssetPagination";
import { canUseDerivations } from "../lib/derivationPermissions";
import { AdDialog, buttonClass, inputClass, primaryClass } from "./AdPushDialogs";
import {
  cancelActiveAdRecords,
  getAdActor,
  isAdActive,
  retryAdRecords,
  updateAdStore,
  type AdPushRecord,
} from "../lib/adPush";
import { useAdStore } from "../lib/useAdStore";
import {
  DERIVATION_STATUSES,
  derivationOutput,
  seedDerivationExamples,
  useDerivationRecords,
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

const tabs = [
  { id: "derivation", name: "衍生视频记录", icon: Film },
  { id: "push", name: "推送视频记录", icon: Send },
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
const seededPushOwners = new Set<string>();
const uploadResourceTypes = new Set<ResourceSearchType>(["成片", "素材", "第三方", "脚本", "图片", "音频"]);

function isUploadResourceType(type: string): type is ResourceSearchType {
  return uploadResourceTypes.has(type as ResourceSearchType);
}

interface OperationRecordsViewProps {
  onOpenResource?: (record: OperationRecord & { type: ResourceSearchType }) => void;
}

function seedLinkedPushExample(ownerId: string, name: string) {
  if (seededPushOwners.has(ownerId)) return;
  seededPushOwners.add(ownerId);
  updateAdStore(store => {
    const output = derivationOutput(`DER-DEMO-${ownerId}-1`, ownerId);
    const sample = store.records[0];
    if (!output || !sample || store.records.some(record => record.id === `push-example-${ownerId}`)) return store;
    const createdAt = date(output.createdAt + 10000);
    const record: AdPushRecord = {
      ...sample,
      id: `push-example-${ownerId}`,
      taskId: `PUSH-DEMO-${ownerId}`,
      operatorId: ownerId,
      operator: name,
      sourceVideo: output.source,
      derivativeId: output.id,
      videoId: output.source.id,
      videoTitle: output.source.title,
      assetId: "QC-MAT-260918-001",
      assetName: output.name,
      status: "推送成功",
      pushStatus: "推送成功",
      materialReview: "审核通过",
      method: "push",
      planId: "",
      planName: "",
      planResult: "不涉及",
      planReview: "不涉及",
      deliveryStatus: "不涉及",
      failureReason: "",
      createdAt,
      updatedAt: createdAt,
      startedAt: output.createdAt + 10000,
      snapshot: { ...sample.snapshot, method: "push", derivation: undefined },
      logs: [{ time: createdAt, text: "衍生视频已推送至千川素材库" }],
    };
    return { ...store, records: [...store.records, record] };
  });
}

export default function OperationRecordsView({ onOpenResource }: OperationRecordsViewProps) {
  const actor = getAdActor();
  return <OperationRecords key={actor.id} ownerId={actor.id} ownerName={actor.name} onOpenResource={onOpenResource} />;
}

function OperationRecords({ ownerId, ownerName, onOpenResource }: { ownerId: string; ownerName: string; onOpenResource?: OperationRecordsViewProps["onOpenResource"] }) {
  useAdStore();
  const allowed = canUseDerivations(getAdActor());
  const [tab, setTab] = useState<Tab>("derivation");

  useEffect(() => {
    if (allowed) {
      seedDerivationExamples(ownerId);
      seedLinkedPushExample(ownerId, ownerName);
    }
    seedOperationExamples(ownerId);
  }, [ownerId, ownerName, allowed]);

  return <div data-testid="operation-records" className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 text-slate-800">
    <div className="shrink-0 px-5 pb-1 pt-4">
      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1.5" role="tablist" aria-label="操作记录分类">
        {tabs.map(({ id, name, icon: Icon }) => <button
          role="tab"
          aria-selected={tab === id}
          key={id}
          onClick={() => setTab(id)}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-xs font-bold ${tab === id ? "border-purple-200 bg-white text-violet-600 shadow-xs" : "border-transparent text-slate-600 hover:bg-slate-100"}`}
        ><Icon size={16} />{name}</button>)}
      </div>
    </div>
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white" role="tabpanel">
      {tab === "derivation"
        ? allowed
          ? <DerivationHistory ownerId={ownerId} ownerName={ownerName} />
          : <p role="status" className="py-16 text-center text-sm text-slate-400">暂无衍生视频查看权限</p>
        : tab === "push"
          ? <PushHistory ownerId={ownerId} />
          : <SimpleHistory key={tab} kind={tab} ownerId={ownerId} ownerName={ownerName} onOpenResource={onOpenResource} />}
    </main>
  </div>;
}

const derivationEmpty = { taskId: "", account: "", assetId: "", status: "", start: "", end: "" };
type DerivationFilters = typeof derivationEmpty;

interface DerivationTaskRow {
  taskId: string;
  outputs: DerivationRecord[];
  source: DerivationRecord["source"];
  pushes: AdPushRecord[];
  status: DerivationRecord["status"];
  createdAt: number;
  failureReason: string;
}

function taskStatus(outputs: DerivationRecord[]): DerivationRecord["status"] {
  const priority = ["失败", "处理中", "待衍生", "取消衍生", "已删除", "成功"] as const;
  return priority.find(status => outputs.some(output => output.status === status)) || "成功";
}

function DerivationHistory({ ownerId, ownerName }: { ownerId: string; ownerName: string }) {
  const records = useDerivationRecords();
  const store = useAdStore();
  const [draft, setDraft] = useState<DerivationFilters>(derivationEmpty);
  const [filters, setFilters] = useState<DerivationFilters>(derivationEmpty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [error, setError] = useState("");
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);

  const taskRows = useMemo(() => {
    const own = records.filter(record => record.ownerId === ownerId);
    const groups = new Map<string, DerivationRecord[]>();
    own.forEach(record => groups.set(record.taskId, [...(groups.get(record.taskId) || []), record]));
    return [...groups.entries()].map(([taskId, outputs]): DerivationTaskRow => {
      const ids = new Set(outputs.map(output => output.id));
      const pushes = store.records.filter(record => record.operatorId === ownerId && Boolean(record.derivativeId && ids.has(record.derivativeId)));
      return {
        taskId,
        outputs,
        source: outputs[0].source,
        pushes,
        status: taskStatus(outputs),
        createdAt: Math.min(...outputs.map(output => output.createdAt)),
        failureReason: outputs.find(output => output.status === "失败")?.message || "",
      };
    }).sort((left, right) => right.createdAt - left.createdAt);
  }, [records, store.records, ownerId]);

  const filtered = taskRows.filter(row => {
    const accounts = row.pushes.map(push => `${push.account} ${push.accountId}`).join(" ");
    return includes(row.taskId, filters.taskId) &&
      includes(accounts, filters.account) &&
      includes(row.source.id, filters.assetId) &&
      (!filters.status || row.status === filters.status) &&
      (!filters.start || date(row.createdAt).slice(0, 10) >= filters.start) &&
      (!filters.end || date(row.createdAt).slice(0, 10) <= filters.end);
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const preview = taskRows.find(row => row.taskId === previewTaskId);

  const query = () => {
    if (draft.start && draft.end && draft.start > draft.end) {
      setError("开始日期不能晚于结束日期");
      return;
    }
    setFilters({ ...draft });
    setPage(1);
    setError("");
  };

  return <div className="min-w-0 p-5" data-testid="derivation-history">
    <form onSubmit={event => { event.preventDefault(); query(); }} className="mb-5 flex flex-wrap items-center gap-3">
      <input aria-label="任务ID" placeholder="请输入任务ID" className={`${inputClass} !w-52`} value={draft.taskId} onChange={event => setDraft({ ...draft, taskId: event.target.value })} />
      <input aria-label="广告账户名称或ID" placeholder="请输入广告账户名称/ID" className={`${inputClass} !w-64`} value={draft.account} onChange={event => setDraft({ ...draft, account: event.target.value })} />
      <input aria-label="素材ID" placeholder="请输入素材ID" className={`${inputClass} !w-52`} value={draft.assetId} onChange={event => setDraft({ ...draft, assetId: event.target.value })} />
      <select aria-label="衍生状态" className={`${inputClass} !w-56`} value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}>
        <option value="">请选择状态</option>
        {DERIVATION_STATUSES.map(status => <option key={status}>{status}</option>)}
      </select>
      <DateRange start={draft.start} end={draft.end} onStart={start => setDraft({ ...draft, start })} onEnd={end => setDraft({ ...draft, end })} />
      <button type="submit" className={primaryClass}><Search size={14} />查询</button>
    </form>
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}

    <div className="max-w-full overflow-x-auto border-y border-slate-100">
      <table className="w-full min-w-[1500px] text-xs">
        <thead className="bg-slate-50"><tr>{["任务ID", "原爆款视频", "原爆款素材ID", "广告账户", "媒体", "衍生方式", "衍生状态", "衍生生成数量", "操作人", "衍生时间", "失败原因"].map(label => <th key={label} className={th}>{label}</th>)}</tr></thead>
        <tbody>{rows.map(row => {
          const accounts = unique(row.pushes.map(push => `${push.account}\n${push.accountId}`));
          const platforms = unique(row.pushes.map(push => push.platform));
          return <tr key={row.taskId} data-testid={`derivation-row-${row.status}`} className="border-b border-slate-100 hover:bg-slate-50/60">
            <td className={`${td} font-mono`}>{row.taskId}</td>
            <td className={`${td} max-w-64`}><button type="button" onClick={() => setPreviewTaskId(row.taskId)} className="max-w-56 text-left font-bold leading-5 text-violet-600"><span className="line-clamp-2">{row.source.title}</span></button><p className="mt-1 text-[11px] text-slate-400">ID：{row.source.id}</p></td>
            <td className={`${td} max-w-48 break-all`}>{row.source.id}</td>
            <td className={`${td} max-w-56 whitespace-pre-line leading-5`}>{accounts.length ? accounts.join("\n") : "--"}</td>
            <td className={td}>{platforms.length ? platforms.join("、") : "--"}</td>
            <td className={`${td} max-w-56 leading-5`}>{row.outputs.some(output => output.driver === "push") ? "衍生并推送" : "AI视频智能裂变"}</td>
            <td className={td}><StatusBadge status={row.status} /></td>
            <td className={`${td} text-center font-bold text-violet-600`}>{row.outputs.length}</td>
            <td className={td}>{row.outputs[0].ownerName || ownerName}</td>
            <td className={`${td} whitespace-nowrap`}>{date(row.createdAt)}</td>
            <td className={`${td} max-w-60 whitespace-normal leading-5 text-rose-600`}>{row.failureReason || "--"}</td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className="py-16 text-center text-sm text-slate-400">暂无数据</p>}
    </div>
    <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
    {preview && <AdDialog title={preview.source.title} onClose={() => setPreviewTaskId(null)}><video src={preview.source.videoUrl} controls autoPlay className="max-h-[65vh] w-full bg-black" /></AdDialog>}
  </div>;
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

  const related = useMemo(() => store.records.filter(record => record.operatorId === ownerId), [store.records, ownerId]);
  const operators = unique(related.map(record => record.operator));
  const filtered = related.filter(record => {
    const videoType = record.derivativeId ? "衍生视频" : record.snapshot.version;
    return includes(record.videoId, filters.videoId) &&
      (!filters.videoType || videoType === filters.videoType) &&
      includes(record.accountId, filters.accountId) &&
      (!filters.pushType || record.method === filters.pushType) &&
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
        <select aria-label="推送类型" className={inputClass} value={draft.pushType} onChange={event => setDraft({ ...draft, pushType: event.target.value })}><option value="">请选择推送类型</option><option value="push">仅推送</option><option value="plan">推送并搭建计划</option><option value="full_domain">全域推广</option></select>
        <input aria-label="推送素材ID" placeholder="请输入素材ID" className={inputClass} value={draft.assetId} onChange={event => setDraft({ ...draft, assetId: event.target.value })} />
        <select aria-label="推送状态" className={inputClass} value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option value="">请选择状态</option>{["待处理", "衍生中", "推送中", "审核中", "创建计划中", "推送成功", "推送失败", "已取消"].map(status => <option key={status}>{status}</option>)}</select>
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

    <div className="max-w-full overflow-x-auto border-y border-slate-100">
      <table className="w-full min-w-[1650px] text-xs">
        <thead className="bg-slate-50"><tr>
          <th className={th}><input aria-label="选择本页全部推送记录" type="checkbox" checked={rows.length > 0 && rows.every(row => selected.includes(row.id))} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...rows.map(row => row.id)])] : selected.filter(id => !rows.some(row => row.id === id)))} /></th>
          {["视频标题", "推送视频", "广告账户", "媒体", "素材ID", "推送状态", "失败原因", "操作人", "创建推送时间", "更新时间", "任务ID"].map(label => <th key={label} className={th}>{label}</th>)}
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
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="py-16 text-center text-sm text-slate-400">暂无数据</p>}
    </div>
    <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />

    {confirmAction && <AdDialog
      title={confirmAction === "retry" ? "批量重试" : "批量取消"}
      onClose={() => setConfirmAction(null)}
      footer={<><button type="button" className={buttonClass} onClick={() => setConfirmAction(null)}>取消</button><button type="button" className={primaryClass} onClick={applyAction}>{confirmAction === "retry" ? "确认重试" : "确认取消"}</button></>}
    ><p className="text-sm leading-6">{confirmAction === "retry" ? `确认重新执行所选 ${selected.length} 条推送失败记录？` : `确认取消所选 ${selected.length} 条进行中的推送记录？`}</p></AdDialog>}
  </div>;
}

function DateRange({ start, end, onStart, onEnd }: { start: string; end: string; onStart: (value: string) => void; onEnd: (value: string) => void }) {
  return <div className="flex h-10 min-w-[340px] max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500">
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
      : ["待处理", "待衍生", "处理中", "衍生中", "推送中", "审核中", "创建计划中"].includes(status)
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
