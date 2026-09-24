import React, { useEffect, useState } from "react";
import { HelpCircle, Pencil, RefreshCw } from "lucide-react";
import { adDate, getAdActor, readAdStore, updateAdStore, type AdDraft, type AdPushRecord, type AdVideo } from "../lib/adPush";
import { canUseDerivations, requireDerivationPermission } from "../lib/derivationPermissions";
import { changeDerivations, DERIVATION_STATUSES, derivationVideo, getDerivationRecords, seedVideoDerivationExamples, useDerivationRecords, validateDerivationSelection, type DerivationRecord } from "../lib/videoDerivation";
import { downloadHistoryMedia } from "../lib/operationHistory";
import { readReportOrganization } from "../lib/analyticsOrganization";
import { openDerivativeAnalytics } from "../lib/analyticsNavigation";
import { useAdStore } from "../lib/useAdStore";
import { AdDialog, buttonClass, primaryClass, inputClass } from "./AdPushDialogs";
import { PushRecordsModal } from "./AdAccountPush";
import AdPushWorkspace from "./AdPushWorkspace";
import AssetPagination from "./AssetPagination";
import DerivationNoteDialog from "./DerivationNoteDialog";

const date = (time: number) => adDate(new Date(time));
const matches = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase());
const filtersInitial = { asset: "", title: "", note: "", status: "", operator: "" };

function seedExamples(source: AdVideo) {
  const actor = getAdActor();
  if (!canUseDerivations(actor)) return;
  const members = readReportOrganization().members.filter(member => member.name !== actor.name).slice(0, 2);
  seedVideoDerivationExamples(source, [{ id: actor.id, name: actor.name }, ...members.map(member => ({ id: member.id, name: member.name }))]);
  const examples = getDerivationRecords().filter(record => record.source.id === source.id && record.example && record.status === "成功").slice(0, 2);
  const current = readAdStore();
  const sample = current.records.find(record => !record.derivativeId);
  if (!sample) return;
  const missing = examples.filter(record => !current.records.some(push => push.derivativeId === record.id));
  if (!missing.length) return;
  updateAdStore(store => ({ ...store, records: [...missing.map((record, index): AdPushRecord => ({ ...sample,
    id: `PUSH-${record.id}`, taskId: `PUSH-TASK-${record.id}`, derivativeId: record.id,
    videoId: source.id, videoTitle: source.title, sourceVideo: source, assetName: record.name,
    assetId: `QC-${source.id}-260922-${index + 1}`, operatorId: record.ownerId, operator: record.ownerName || record.ownerId,
    status: "推送成功", pushStatus: "推送成功", materialReview: "审核通过", failureReason: "",
    planId: `PLAN-${record.id}`, planName: `${source.title}_日常推广`, planResult: "创建成功", planReview: "审核通过", deliveryStatus: "投放中",
    snapshot: { ...sample.snapshot, derivation: undefined }, applied: true, resourceStateApplied: true,
    createdAt: date(record.createdAt), updatedAt: date(record.updatedAt), startedAt: record.createdAt,
    logs: [{ time: date(record.updatedAt), text: "衍生视频推送成功" }],
  })), ...store.records] }));
}

export default function FinishedVideoDerivations({ source, onDerivePush }: { source: AdVideo; onDerivePush: () => void }) {
  const all = useDerivationRecords();
  const store = useAdStore();
  const actor = getAdActor();
  const allowed = canUseDerivations(actor);
  const [filters, setFilters] = useState(filtersInitial);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(20);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [action, setAction] = useState<{ kind: "delete" | "retry" | "cancel"; ids: string[] } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPushRecords, setShowPushRecords] = useState(false);
  const [push, setPush] = useState<{ videos: AdVideo[]; draft?: AdDraft } | null>(null);
  const [message, setMessage] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);

  useEffect(() => { if (allowed) seedExamples(source); }, [source.id, allowed]);
  useEffect(() => { if (!allowed) { setSelected([]); setPush(null); setNoteId(null); setPreviewId(null); setAction(null); setShowPushRecords(false); } }, [allowed]);
  const records = allowed ? all.filter(record => record.source.id === source.id) : [];
  const linked = (id: string) => store.records.filter(record => record.derivativeId === id);
  const assets = (id: string) => [...new Set(linked(id).map(record => record.assetId).filter(Boolean))];
  const filtered = records.filter(record => matches(assets(record.id).join(" "), filters.asset) && matches(record.name, filters.title) && matches(record.note, filters.note) && (!filters.status || record.status === filters.status) && (!filters.operator || record.ownerId === filters.operator)).sort((a, b) => b.createdAt - a.createdAt);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const chosen = records.filter(record => selected.includes(record.id));
  const canBatch = chosen.length > 0 && chosen.every(record => record.status === "成功");
  const preview = records.find(record => record.id === previewId && record.status === "成功");
  const noteRecord = records.find(record => record.id === noteId);
  const selectValid = (ids: string[], statuses?: readonly DerivationRecord["status"][]) => validateDerivationSelection(ids, getAdActor().id, statuses, Date.now(), source.id);
  const notify = (text: string) => { setMessage(text); setError(""); };
  const startPush = (ids: string[], draft?: AdDraft) => {
    try { setPush({ videos: selectValid(ids, ["成功"]).map(derivationVideo), draft: draft ? { ...draft, derivation: undefined } : undefined }); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "无法推送"); }
  };
  const download = async (ids: string[]) => {
    setBusy(true); setError(""); let count = 0;
    try { for (const record of selectValid(ids, ["成功"])) { selectValid([record.id], ["成功"]); await downloadHistoryMedia(record.url, record.name); count++; } notify(`已发起 ${count} 个视频的下载`); }
    catch (e) { setError(`${count ? `已发起 ${count} 个下载；` : ""}${e instanceof Error ? e.message : "下载失败"}`); }
    finally { setBusy(false); }
  };
  const filter = (key: keyof typeof filters, value: string) => { setFilters(previous => ({ ...previous, [key]: value })); setSelected([]); setPage(1); };

  if (!allowed) return <div role="status" data-testid="derivation-no-access" className="py-16 text-center text-sm text-slate-400">暂无衍生视频查看权限</div>;
  return <div data-testid="finished-derivations" className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-violet-600">
      <button onClick={() => { try { requireDerivationPermission(getAdActor()); onDerivePush(); } catch (e) { setError((e as Error).message); } }}>衍生新视频并推送</button>
      <button onClick={() => setShowPushRecords(true)}>推送记录</button>
      <button title="刷新" aria-label="刷新衍生视频" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50" onClick={() => { setSelected([]); notify("已刷新衍生视频记录"); }}><RefreshCw size={14} /></button>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {([['asset', '请输入素材ID'], ['title', '请输入衍生视频标题'], ['note', '请输入备注关键词']] as const).map(([key, placeholder]) => <input key={key} aria-label={placeholder} placeholder={placeholder} value={filters[key]} onChange={e => filter(key, e.target.value)} className={`${inputClass} !h-9 !text-xs`} />)}
        <select aria-label="衍生状态" className={`${inputClass} !h-9 !text-xs`} value={filters.status} onChange={e => filter("status", e.target.value)}><option value="">全部状态</option>{DERIVATION_STATUSES.map(status => <option key={status}>{status}</option>)}</select>
        <select aria-label="操作人" className={`${inputClass} !h-9 !text-xs`} value={filters.operator} onChange={e => filter("operator", e.target.value)}><option value="">请选择操作人</option>{[...new Map(records.map(record => [record.ownerId, record.ownerName || linked(record.id)[0]?.operator || record.ownerId])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      </div>
      <div className="flex max-w-full flex-wrap gap-2">
        <button className={primaryClass} disabled={!canBatch} onClick={() => startPush(selected)}>批量推送</button>
        <button className={primaryClass} disabled={!canBatch || busy} onClick={() => void download(selected)}>批量下载</button>
        <button className={primaryClass} disabled={!canBatch} onClick={() => setAction({ kind: "delete", ids: selected })}>批量删除</button>
      </div>
    </div>
    {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}{message && <p role="status" className="text-xs text-emerald-600">{message}</p>}
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[1040px] table-fixed text-xs">
        <thead className="bg-slate-50 text-slate-500"><tr>
          <th className="w-10 p-3"><input aria-label="选择本页全部衍生视频" type="checkbox" checked={rows.length > 0 && rows.every(record => selected.includes(record.id))} onChange={e => setSelected(e.target.checked ? rows.map(record => record.id) : [])} /></th>
          <th className="w-[18%] p-3 font-medium">衍生视频</th>
          <th className="w-[10%] p-3 font-medium"><span className="inline-flex items-center gap-1" title="推送至广告平台素材库后返回素材ID；尚未推送或推送未成功时显示 --。">素材ID<HelpCircle size={13} aria-label="素材ID说明" /></span></th>
          <th className="w-20 p-3 font-medium">衍生状态</th><th className="w-20 p-3 font-medium">是否卡审</th>
          <th className="w-18 p-3 font-medium">操作人</th><th className="w-24 p-3 font-medium">操作时间</th><th className="w-34 p-3 font-medium">操作</th><th className="p-3 font-medium">备注</th>
        </tr></thead>
        <tbody>{rows.map(record => <tr key={record.id} data-derivative-id={record.id} className="border-b border-slate-100 text-center hover:bg-slate-50/60">
          <td className="p-3"><input aria-label={`选择衍生视频 ${record.name}`} type="checkbox" checked={selected.includes(record.id)} onChange={e => setSelected(e.target.checked ? [...selected, record.id] : selected.filter(id => id !== record.id))} /></td>
          <td className="p-3"><button className="max-w-full break-words text-left leading-5 text-slate-700 hover:text-violet-600 disabled:text-slate-400" disabled={record.status !== "成功"} onClick={() => { try { selectValid([record.id], ["成功"]); setPreviewId(record.id); } catch (e) { setError((e as Error).message); } }}>{record.name}</button></td>
          <td className="break-all p-3 leading-5">{assets(record.id).join(" / ") || "--"}</td>
          <td className="p-3"><span title={record.message} className={`inline-block whitespace-nowrap rounded px-2 py-1.5 ${record.status === "成功" ? "bg-emerald-50 text-emerald-600" : record.status === "失败" ? "bg-rose-50 text-rose-600" : ["待衍生", "处理中"].includes(record.status) ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{record.status}</span></td>
          <td className="p-3">{record.reviewBlocked === null ? "--" : <span className={`rounded px-2 py-1.5 ${record.reviewBlocked ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{record.reviewBlocked ? "是" : "否"}</span>}</td>
          <td className="break-words p-3">{record.ownerName || linked(record.id)[0]?.operator || record.ownerId}</td><td className="p-3 leading-5">{date(record.createdAt)}</td>
          <td className="p-3"><div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-violet-600">
            {record.status === "成功" && <><button disabled={busy} onClick={() => void download([record.id])}>下载</button><button onClick={() => startPush([record.id])}>推送</button><button onClick={() => setAction({ kind: "delete", ids: [record.id] })}>删除</button><button onClick={() => { try { selectValid([record.id], ["成功"]); openDerivativeAnalytics(record.id); } catch (e) { setError((e as Error).message); } }}>查看数据</button></>}
            {record.status === "失败" && <button onClick={() => setAction({ kind: "retry", ids: [record.id] })}>重试</button>}
            {record.status === "待衍生" && <button onClick={() => setAction({ kind: "cancel", ids: [record.id] })}>取消</button>}
            {["处理中", "取消衍生", "已删除"].includes(record.status) && <span className="text-slate-400">--</span>}
          </div></td>
          <td className="p-3"><div className="flex items-start justify-center gap-2"><span className="min-w-0 break-words text-left leading-5">{record.note || "--"}</span><button title="编辑备注" aria-label={`编辑备注 ${record.name}`} className="shrink-0 p-0.5 text-violet-600 hover:text-violet-800" onClick={() => setNoteId(record.id)}><Pencil size={14} /></button></div></td>
        </tr>)}</tbody>
      </table>{!rows.length && <p className="py-14 text-center text-xs text-slate-400">暂无数据</p>}
    </div>
    <AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={value => { setPage(value); setSelected([]); }} onPageSizeChange={value => { setPageSize(value); setPage(1); setSelected([]); }} />
    {noteRecord && <DerivationNoteDialog initialNote={noteRecord.note} onClose={() => setNoteId(null)} onSave={note => { changeDerivations([noteRecord.id], getAdActor().id, "note", note, source.id); setNoteId(null); notify("备注已保存"); }} />}
    {action && <AdDialog title={action.kind === "delete" ? "删除衍生视频" : action.kind === "retry" ? "重试衍生" : "取消衍生"} onClose={() => setAction(null)} footer={<><button className={buttonClass} onClick={() => setAction(null)}>取消</button><button className={primaryClass} onClick={() => {
      try { changeDerivations(action.ids, getAdActor().id, action.kind, "", source.id); setAction(null); setSelected([]); notify("操作成功"); } catch (e) { setError((e as Error).message); setAction(null); }
    }}>确定</button></>}><p className="text-sm leading-6">{action.kind === "delete" ? `确定删除 ${action.ids.length} 个衍生视频文件？原成片与历史记录保留，删除后无法预览、下载或再次推送。` : action.kind === "retry" ? "确定重试该失败任务？重试后更新原记录。" : "确定取消待衍生任务？相关待执行推送也将取消。"}</p></AdDialog>}
    {preview && <AdDialog title={preview.name} onClose={() => setPreviewId(null)}><video src={preview.url} controls autoPlay className="max-h-[65vh] w-full bg-black" /></AdDialog>}
    {showPushRecords && <PushRecordsModal videoId={source.id} derivativesOnly onClose={() => setShowPushRecords(false)} onEdit={(draft, record) => { if (record?.derivativeId) { setShowPushRecords(false); startPush([record.derivativeId], draft); } }} />}
    {push && <AdPushWorkspace video={push.videos[0]} videos={push.videos} initialDraft={push.draft} onClose={() => setPush(null)} onCreate={records => { updateAdStore(current => ({ ...current, records: [...records, ...current.records] })); setPush(null); setSelected([]); notify(`已提交 ${records.length} 条推送记录`); }} />}
  </div>;
}
