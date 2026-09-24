import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import AssetPagination from "./AssetPagination";
import { canUseDerivations } from "../lib/derivationPermissions";
import { useAdStore } from "../lib/useAdStore";
import { exportHistoryCsv } from "../lib/operationHistory";
import { AD_PLATFORMS, cancelAdRecords, getAdActor, isAdActive, visibleAdRecords, type AdDraft, type AdPushRecord } from "../lib/adPush";
export type { AdPushRecord } from "../lib/adPush";

import { AdDialog, Field, ErrorLine, inputClass, buttonClass, primaryClass } from "./AdPushDialogs";
export { AdDialog } from "./AdPushDialogs";
export { default as AdAccountPushWorkspace } from "./AdPushWorkspace";

function RecordFrame({ embedded, children, footer, onClose }: { embedded?: boolean; children: React.ReactNode; footer: React.ReactNode; onClose: () => void }) {
  return embedded ? <div className="min-w-0 p-5">{children}<div className="mt-4">{footer}</div></div> : <AdDialog title="推送记录" wide onClose={onClose} footer={footer}>{children}</AdDialog>;
}
export function PushRecordsModal({ records: _records, videoId, onClose, onEdit, embedded, currentUserOnly, derivativeId, derivativesOnly }: { records?: AdPushRecord[]; videoId?: string; onClose: () => void; onEdit: (draft: AdDraft, record?: AdPushRecord) => void; embedded?: boolean; currentUserOnly?: boolean; derivativeId?: string; derivativesOnly?: boolean }) {
  const store = useAdStore(), actor = getAdActor();
  const [tab, setTab] = useState("推送视频"), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const [platform, setPlatform] = useState(""), [version, setVersion] = useState(""), [goal, setGoal] = useState("");
  const [start, setStart] = useState(""), [end, setEnd] = useState(""), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(20);
  const [detailId, setDetailId] = useState<string | null>(null), [selected, setSelected] = useState<string[]>([]), [confirmCancel, setConfirmCancel] = useState(false), [error, setError] = useState("");
  const related = (currentUserOnly ? store.records.filter(r => r.operatorId === actor.id && (!videoId || r.videoId === videoId)) : visibleAdRecords(store, actor, videoId || "")).filter(r => (!r.derivativeId || canUseDerivations(actor)) && (!derivativesOnly || r.derivativeId) && (!derivativeId || r.derivativeId === derivativeId));
  const filtered = related.filter(r => (tab === "推送视频" || r.method !== "push") && (!platform || r.platform === platform) && (!version || (r.derivativeId ? "衍生视频" : r.snapshot.version) === version) && (!goal || (r.method !== "push" && r.marketingGoal === goal)) && (!status || r.status === status) && (!search || [r.videoTitle, r.videoId, r.account, r.accountId, r.assetId, r.planId, r.templateName, r.taskId, r.operator, r.derivativeId || ""].some(s => s.toLowerCase().includes(search.toLowerCase()))) && (!start || r.createdAt.slice(0, 10) >= start) && (!end || r.createdAt.slice(0, 10) <= end)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize))), rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const detail = related.find(r => r.id === detailId);
  const exportRecords = () => {
    const cells = [["视频ID", "衍生编号", "账户ID", "任务ID", "素材ID", "计划ID", "状态", "失败原因", "操作人"], ...filtered.map(r => [r.videoId, r.derivativeId || "", r.accountId, r.taskId, r.assetId, r.planId, r.status, r.failureReason, r.operator])];
    exportHistoryCsv("推送记录.csv", cells, "推送视频记录");
  };
  const edit = (r: AdPushRecord) => {
    if (r.derivativeId ? !canUseDerivations(actor) : !actor.permissions.includes("uc_ad_push")) return setError("暂无推送权限");
    if (r.method !== "push" && !actor.permissions.includes("uc_ad_plan_manage")) return setError("暂无管理投放计划权限");
    onEdit({ ...structuredClone(r.snapshot), scheduledAt: "" }, r);
  };
  return <RecordFrame embedded={embedded} onClose={onClose} footer={<AssetPagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />}>
    <div className="mb-4 flex gap-4 border-b border-slate-200 pb-3">{["推送视频", "创建计划记录"].map(t => <button key={t} onClick={() => { setTab(t); setPage(1); setSelected([]); }} className={`text-sm ${tab === t ? "font-bold text-violet-600" : "text-slate-500"}`}>{t}</button>)}</div>
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field title="账户 / 素材 / 计划 / 模板 / 任务 / 操作人"><input className={inputClass} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></Field><Field title="状态"><select className={inputClass} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">全部状态</option>{["待处理", "衍生中", "推送中", "审核中", "创建计划中", "推送成功", "推送失败", "已取消"].map(s => <option key={s}>{s}</option>)}</select></Field><Field title="开始日期"><input type="date" className={inputClass} value={start} onChange={e => { setStart(e.target.value); setPage(1); }} /></Field><Field title="结束日期"><input type="date" className={inputClass} min={start} value={end} onChange={e => { setEnd(e.target.value); setPage(1); }} /></Field></div>
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <Field title="广告平台"><select className={inputClass} value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}><option value="">全部平台</option>{AD_PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></Field>
      <Field title="推送视频类型"><select className={inputClass} value={version} onChange={e => { setVersion(e.target.value); setPage(1); }}><option value="">全部类型</option><option>原片</option><option>转码后视频</option><option>衍生视频</option></select></Field>
      <Field title="营销目标"><select className={inputClass} value={goal} onChange={e => { setGoal(e.target.value); setPage(1); }}><option value="">全部目标</option><option>推商品</option><option>推直播间</option></select></Field>
    </div>
    <div className="mb-3 flex flex-wrap gap-3"><button className={buttonClass} onClick={() => { setSearch(""); setStatus(""); setStart(""); setEnd(""); setPlatform(""); setVersion(""); setGoal(""); setPage(1); setSelected([]); }}>重置</button><button className={buttonClass} disabled={!selected.length} onClick={() => setConfirmCancel(true)}>取消待处理任务（{selected.length}）</button><button className={buttonClass} onClick={exportRecords}><Download className="h-4 w-4" />导出</button></div><ErrorLine text={error} />
    <div className="overflow-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{["选择", "广告账户", "任务ID", "素材ID", tab === "推送视频" ? "推送状态 / 素材审核" : "计划 / 创建结果 / 投放状态", "任务状态", "失败原因", "操作人 / 创建时间", "操作"].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-b border-slate-100"><td className="p-3"><input aria-label={`选择记录 ${r.id}`} type="checkbox" disabled={r.status !== "待处理"} checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))} /></td><td className="max-w-52 break-words p-3">{r.account}<p className="mt-1 text-slate-400">{r.accountId}</p></td><td className="max-w-28 break-all p-3">{r.taskId}</td><td className="max-w-32 break-all p-3">{r.assetId || "--"}</td><td className="max-w-52 break-all p-3">{tab === "推送视频" ? <>{r.pushStatus}<p>{r.materialReview}</p></> : <>{r.planName}<p className="mt-1 text-slate-500">{r.planId || "--"}</p><p>{r.planResult} · {r.deliveryStatus}</p></>}</td><td className="p-3"><span className={`whitespace-nowrap ${r.status === "推送成功" ? "text-emerald-600" : r.status === "推送失败" ? "text-rose-600" : "text-slate-600"}`}>{isAdActive(r) && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}{r.status}</span></td><td className="max-w-40 p-3 text-rose-600">{r.failureReason || "--"}</td><td className="p-3">{r.operator}<p className="mt-1 text-slate-400">{r.createdAt}</p></td><td className="p-3"><button className="whitespace-nowrap text-violet-600" onClick={() => setDetailId(r.id)}>详情</button>{["推送失败", "已取消"].includes(r.status) && <button className="mt-2 block whitespace-nowrap text-violet-600" onClick={() => edit(r)}>重新编辑</button>}</td></tr>)}</tbody></table>{!rows.length && <p className="py-12 text-center text-sm text-slate-400">暂无数据</p>}</div>
    {detail && <AdDialog title="推送任务详情" onClose={() => setDetailId(null)}>
      <dl className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 text-xs">
        {Object.entries({
          "成片": detail.videoTitle,
          "广告平台": detail.platform,
          "广告账户": `${detail.account} (${detail.accountId})`,
          "推送方式": detail.method === "push" ? "仅推送" : detail.method === "plan" ? "推送并搭建计划" : "全域推广",
          "推送视频类型": detail.derivativeId ? "衍生视频" : detail.snapshot.version,
          ...(detail.derivativeId ? { "衍生编号": detail.derivativeId } : {}),
          "营销目标": detail.method === "push" ? "不涉及" : detail.marketingGoal,
          ...(detail.method === "full_domain" && detail.snapshot.workbench ? {
            "营销目标入口": detail.snapshot.workbench.target,
            "计划操作": detail.snapshot.workbench.operation === "create" ? "批量创建计划" : "已有计划添加视频",
            "视频分配": detail.snapshot.workbench.distribution,
            "移除规则": detail.snapshot.workbench.operation === "append" ? detail.snapshot.workbench.removal : "不涉及",
            "计划生成规则": detail.snapshot.workbench.operation === "create" ? detail.snapshot.workbench.grouping : "不涉及",
          } : {}),
          "抖音号ID": detail.snapshot.rows[0]?.douyinId || "不涉及",
          "店铺ID": detail.snapshot.rows[0]?.storeId || "不涉及",
          "商品ID": detail.snapshot.rows[0]?.productId || "不涉及",
          "素材ID": detail.assetId || "--",
          "素材名称": detail.assetName,
          "素材审核": detail.materialReview,
          "计划ID": detail.planId || "--",
          "计划名称": detail.planName || "--",
          "创建结果": detail.planResult,
          "计划审核": detail.planReview,
          "投放状态": detail.deliveryStatus,
          "推送后成片状态": detail.snapshot.successStatus || "保持不变",
          "失败原因": detail.failureReason || "--",
        }).map(([k, v]) => <React.Fragment key={k}><dt className="text-slate-500">{k}</dt><dd className="break-all text-slate-800">{v}</dd></React.Fragment>)}
      </dl>
      {detail.templateSnapshot && <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="mb-2 text-sm font-semibold">历史模板配置</h3>
        <p className="text-xs leading-6">{detail.templateSnapshot.name} · {detail.templateSnapshot.params.scene} · 日预算 {detail.templateSnapshot.params.budget} 元 · 出价 {detail.templateSnapshot.params.bid} · {detail.templateSnapshot.params.optimization} · {detail.templateSnapshot.params.period}</p>
      </div>}
      <h3 className="mb-3 mt-5 text-sm font-semibold">执行日志</h3>
      {detail.logs.map((log, i) => <p key={i} className="mb-2 text-xs leading-5"><span className="mr-3 text-slate-400">{log.time}</span>{log.text}</p>)}
    </AdDialog>}
    {confirmCancel && <AdDialog title="取消待处理任务" onClose={() => setConfirmCancel(false)} footer={<><button className={buttonClass} onClick={() => setConfirmCancel(false)}>返回</button><button className={primaryClass} onClick={() => { try { cancelAdRecords(selected, currentUserOnly ? actor.id : undefined); setSelected([]); setConfirmCancel(false); } catch (e) { setError(e instanceof Error ? e.message : "取消失败"); setConfirmCancel(false); } }}>确定取消</button></>}><p className="text-sm">确定取消所选 {selected.length} 条待处理记录？已开始执行的任务无法取消。</p></AdDialog>}
  </RecordFrame>;
}
