import React, { useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { openFinishedLibrary } from "../lib/resourceNavigation";
import AssetPagination from "./AssetPagination";
import { canUseDerivations } from "../lib/derivationPermissions";
import { AdTaskRecovery } from "./AdPushRecovery";
import { useAdStore } from "../lib/useAdStore";
import { adPlanCreationStatus } from "../lib/adPlanQueue";
import { AD_FEEDBACK_SCENARIOS, adRetryBlockReason, cancelActiveAdRecords, getAdActor, isAdActive, isCreatingAdPlan, recheckAdRecords, retryAdRecords, visibleAdRecords, type AdFeedbackScenario, type AdDraft, type AdPushRecord } from "../lib/adPush";
export type { AdPushRecord } from "../lib/adPush";

import { AdDialog, Field, ErrorLine, inputClass, buttonClass, primaryClass, iconClass } from "./AdPushDialogs";
export { AdDialog } from "./AdPushDialogs";
export { default as AdAccountPushWorkspace } from "./AdPushWorkspace";

function RecordFrame({ embedded, children, footer, onClose }: { embedded?: boolean; children: React.ReactNode; footer: React.ReactNode; onClose: () => void }) {
  return embedded ? <div className="min-w-0 p-5">{children}<div className="mt-4">{footer}</div></div> : <AdDialog title="推送记录" wide showHeader={false} onClose={onClose} footer={footer} footerBorder={false}>{children}</AdDialog>;
}
export function PushRecordsModal({ records: _records, videoId, onClose, onEdit, embedded, currentUserOnly, derivativeId, derivativesOnly, initialDetailId }: { records?: AdPushRecord[]; videoId?: string; onClose: () => void; onEdit: (draft: AdDraft, record?: AdPushRecord) => void; embedded?: boolean; currentUserOnly?: boolean; derivativeId?: string; derivativesOnly?: boolean; initialDetailId?: string }) {
  const store = useAdStore(), actor = getAdActor();
  const [tab, setTab] = useState("推送视频"), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(20);
  const [detailId, setDetailId] = useState<string | null>(initialDetailId || null), [cancelId, setCancelId] = useState<string | null>(null), [error, setError] = useState("");
  const [scenario, setScenario] = useState<AdFeedbackScenario>("pending"), [notice, setNotice] = useState("");
  const related = (currentUserOnly ? store.records.filter(r => r.operatorId === actor.id && (!videoId || r.videoId === videoId)) : visibleAdRecords(store, actor, videoId || "")).filter(r => (!r.derivativeId || canUseDerivations(actor)) && (!derivativesOnly || r.derivativeId) && (!derivativeId || r.derivativeId === derivativeId));
  const filtered = related.filter(r => tab === "推送视频" || isCreatingAdPlan(r.snapshot)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const columns = tab === "推送视频"
    ? ["推送视频", "广告账户", "媒体", "素材ID", "推送状态", "失败原因", "操作人", "创建推送时间", "更新时间", "任务ID"]
    : ["计划模板", "定向", "广告账户", "营销目标", "推送状态", "失败原因", "操作人", "操作时间", "更新时间", "任务ID"];
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize))), rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const detail = related.find(r => r.id === detailId);
  const waitingLibrary = detail && ["library", "cover_library"].includes(detail.executionIssue || "");
  const edit = (r: AdPushRecord) => {
    const blocked = adRetryBlockReason(r);
    if (blocked) { setDetailId(r.id); setError(blocked); return; }
    if (r.derivativeId ? !canUseDerivations(actor) : !actor.permissions.includes("uc_ad_push")) return setError("暂无推送权限");
    if (r.method !== "push" && !actor.permissions.includes("uc_ad_plan_manage")) return setError("暂无管理投放计划权限");
    if (r.status === "推送失败" && r.failureKind !== "invalid_target") {
      try { retryAdRecords([r.id], currentUserOnly ? actor.id : undefined); }
      catch (error) { setError(error instanceof Error ? error.message : "重试失败"); }
      return;
    }
    onEdit({ ...structuredClone(r.snapshot), scheduledAt: "" }, r);
  };
  const checkStatus = (ids: string[], response: AdFeedbackScenario = "pending") => {
    try { recheckAdRecords(ids, response, currentUserOnly ? actor.id : undefined); setError(""); setNotice("已核查模拟反馈；查询失败或结果不明时保留上次已确认结果"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "核查失败"); }
  };
  return <RecordFrame embedded={embedded || Boolean(initialDetailId)} onClose={onClose} footer={initialDetailId ? null : <AssetPagination bordered={false} total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />}>
    {!initialDetailId && <>
    <div className="mb-4 flex items-center gap-4 border-b border-slate-200 pb-3">
      {["推送视频", "创建计划记录"].map(t => <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`text-sm ${tab === t ? "font-bold text-violet-600" : "text-slate-500"}`}>{t}</button>)}
      {!embedded && <button type="button" aria-label="关闭推送记录" title="关闭推送记录" className={`${iconClass} ml-auto`} onClick={onClose}><X className="h-5 w-5" /></button>}
    </div>
    <ErrorLine text={error} />
    <div className="overflow-auto">
      <table className="w-full min-w-[1050px] text-left text-xs">
        <thead className="bg-slate-50 text-slate-500"><tr>{columns.map(h => <th className="whitespace-nowrap p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => {
          const status = tab === "推送视频" ? r.status : adPlanCreationStatus([r]);
          return <tr key={r.id} className="border-b border-slate-100">
          {tab === "推送视频" ? <>
            <td className="max-w-52 break-words p-3">{r.assetName || r.videoTitle}<p className="mt-1 break-all text-slate-400">{r.derivativeId || r.snapshot.version}</p></td>
            <td className="max-w-52 break-words p-3">{r.account}<p className="mt-1 text-slate-400">{r.accountId}</p></td>
            <td className="whitespace-nowrap p-3">{r.platform}</td>
            <td className="max-w-32 break-all p-3">{r.assetId || "--"}</td>
          </> : <>
            <td className="max-w-52 break-words p-3">{r.templateName || r.templateSnapshot?.name || "--"}</td>
            <td className="p-3">--</td>
            <td className="max-w-52 break-words p-3">{r.account}<p className="mt-1 text-slate-400">{r.accountId}</p></td>
            <td className="whitespace-nowrap p-3">{r.marketingGoal}</td>
          </>}
          <td className="p-3"><span className={`whitespace-nowrap ${status.includes("成功") ? "text-emerald-600" : status.includes("失败") ? "text-rose-600" : "text-slate-600"}`}>{(tab === "推送视频" ? isAdActive(r) : status === "创建中") && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}{status}</span></td>
          <td className="max-w-40 break-words p-3">{tab !== "推送视频" && ["创建成功", "取消创建"].includes(status) ? "--" : r.failureReason || "--"}</td>
          <td className="whitespace-nowrap p-3">{r.operator}</td>
          <td className="p-3">{r.createdAt}</td>
          <td className="p-3">{r.updatedAt}</td>
          <td className="max-w-32 break-all p-3">{r.taskId}</td>
        </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className="py-12 text-center text-sm text-slate-400">暂无数据</p>}
    </div>
    </>}
    {detail && <AdDialog title="推送任务详情" onClose={() => initialDetailId ? onClose() : setDetailId(null)} footer={<>
      <ErrorLine text={error} />
      <button className={buttonClass} onClick={() => initialDetailId ? onClose() : setDetailId(null)}>关闭</button>
      {isAdActive(detail) && <button className={buttonClass} onClick={() => setCancelId(detail.id)}>取消未完成步骤</button>}
      {detail.status === "推送失败" && !adRetryBlockReason(detail) && <button className={buttonClass} onClick={() => edit(detail)}>重试未完成步骤</button>}
      {detail.status !== "已取消" && !detail.pendingWrite && !waitingLibrary && <button className={primaryClass} onClick={() => checkStatus([detail.id], scenario)}><RefreshCw size={14} />核查状态</button>}
    </>}>
      {adRetryBlockReason(detail) && <div className="mb-4 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm leading-6"><p>{adRetryBlockReason(detail)}</p>{(detail.materialReview === "审核驳回" || detail.executionIssue === "media") && <button className={`${buttonClass} mt-2`} onClick={() => { onClose(); openFinishedLibrary(); }}>返回资源库重新发起</button>}</div>}
      <AdTaskRecovery key={detail.id} record={detail} ownerId={currentUserOnly ? actor.id : undefined} />
      {detail.status !== "已取消" && !detail.pendingWrite && !waitingLibrary && <div className="mb-4"><Field title="模拟千川查询反馈"><select aria-label="模拟千川查询反馈" className={inputClass} value={scenario} onChange={e => setScenario(e.target.value as AdFeedbackScenario)}>{AD_FEEDBACK_SCENARIOS.filter(item => item.value !== "live_off" || detail.marketingGoal === "推直播间").map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>{notice && <p role="status" className="mt-2 text-xs text-emerald-700">{notice}</p>}</div>}
      <dl className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 text-xs">
        {Object.entries({
          "成片": detail.videoTitle,
          "数据来源": "原型模拟",
          "最近核查时间": detail.lastCheckedAt || "尚未核查",
          "本平台任务ID": detail.taskId,
          "广告平台": detail.platform,
          "广告账户": `${detail.account} (${detail.accountId})`,
          "推送方式": detail.method === "push" ? "仅推送" : isCreatingAdPlan(detail.snapshot) ? "新建计划并投放" : "追加已有计划",
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
          ...(detail.method === "push" ? {} : detail.marketingGoal === "推商品" ? {
            "投放组合": detail.snapshot.rows.flatMap(row => row.combinations || (isCreatingAdPlan(detail.snapshot) ? [{ productId: row.productId, douyinId: row.douyinId }] : [])).map(c => `商品 ${c.productId} / 抖音号 ${c.douyinId}`).join("\n") || "历史记录未保存组合，待核实",
          } : { "抖音号ID": detail.snapshot.rows[0]?.douyinId || "待核实" }),
          "素材ID": detail.assetId || "--",
          "视频ID": detail.remoteVideoId || "--",
          "封面图片ID": detail.coverId || "--",
          "封面处理": detail.method === "push" ? "不涉及" : detail.executionIssue === "cover_library" ? "已上传，待确认入库" : detail.coverReady || detail.coverId ? "已确认" : "待处理",
          "素材入库": detail.materialReady ? "已确认入库" : "待确认",
          "素材名称": detail.assetName,
          "素材审核": detail.materialReview,
          "计划ID": detail.planId || "--",
          "计划名称": detail.planName || "--",
          "计划处理结果": detail.planResult,
          "请求开启结果": detail.enableResult || "未记录",
          "移除旧视频结果": detail.removalResult || "不涉及",
          ...(detail.removalReason ? { "移除处理说明": detail.removalReason } : {}),
          "计划审核": detail.planReview,
          "计划投放状态": detail.deliveryStatus,
          "推送后成片状态": detail.snapshot.successStatus || "保持不变",
          "失败原因": detail.failureReason || "--",
        }).map(([k, v]) => <React.Fragment key={k}><dt className="text-slate-500">{k}</dt><dd className="whitespace-pre-line break-all text-slate-800">{v}</dd></React.Fragment>)}
      </dl>
      {detail.templateSnapshot && <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="mb-2 text-sm font-semibold">历史模板配置</h3>
        <p className="text-xs leading-6">{detail.templateSnapshot.name} · {detail.templateSnapshot.workbench?.target || "历史配置"} · 预算 {detail.templateSnapshot.workbench?.budget ?? detail.templateSnapshot.params.budget} 元{detail.templateSnapshot.workbench?.bidding !== "放量投放" && ` · 支付ROI目标 ${detail.templateSnapshot.workbench?.roi ?? detail.templateSnapshot.params.bid}`}</p>
      </div>}
      <h3 className="mb-3 mt-5 text-sm font-semibold">执行日志</h3>
      {detail.logs.map((log, i) => <p key={i} className="mb-2 text-xs leading-5"><span className="mr-3 text-slate-400">{log.time}</span>{log.text}</p>)}
    </AdDialog>}
    {cancelId && <AdDialog title="取消未完成步骤" onClose={() => setCancelId(null)} footer={<><button className={buttonClass} onClick={() => setCancelId(null)}>返回</button><button className={primaryClass} onClick={() => { try { cancelActiveAdRecords([cancelId], currentUserOnly ? actor.id : undefined); setCancelId(null); } catch (e) { setError(e instanceof Error ? e.message : "取消失败"); setCancelId(null); } }}>确定取消</button></>}><p className="text-sm">确定取消当前记录的未完成步骤？已上传素材、已创建计划及远端投放不撤销；不会暂停千川正在投放的计划。</p></AdDialog>}
  </RecordFrame>;
}
