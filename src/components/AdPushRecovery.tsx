import React, { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { getAdActor, type AdAccount, type AdPushRecord, type AdStore } from "../lib/adPush";
import { AUTH_REPAIR_INTERVAL, adAuthRepairIssue, adDeliveryAdvice, initializeAdAuthorization, recheckAdAuthorization, recheckAdLibrary, repairableProducts, retainOldAdMaterials, retryAdCapacity, simulateAdWriteRecheck, type WriteEvidence } from "../lib/adPushRecovery";
import { AdDialog, ErrorLine, Field, buttonClass, inputClass, primaryClass } from "./AdPushDialogs";

export function AdAuthorizationRepair({ account, store, onClose }: { account: AdAccount; store: AdStore; onClose: () => void }) {
  const [response, setResponse] = useState<"accepted" | "unknown" | "failed">("accepted");
  const [query, setQuery] = useState<"eligible" | "ineligible" | "unavailable">("ineligible");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now);
  const requestedAt = account.authRepair?.requestedAt;
  useEffect(() => {
    if (requestedAt === undefined || Date.now() >= requestedAt + AUTH_REPAIR_INTERVAL) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= requestedAt + AUTH_REPAIR_INTERVAL) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [account.id, requestedAt]);
  const issue = adAuthRepairIssue(store, getAdActor(), account.id, Math.max(now, requestedAt ?? 0));
  const run = (action: () => void) => { try { action(); setError(""); } catch (cause) { setError((cause as Error).message); } };
  return <AdDialog title="修复商品投放权限" onClose={onClose} footer={<><button className={buttonClass} onClick={onClose}>关闭</button>{account.authRepair && <button className={buttonClass} onClick={() => run(() => recheckAdAuthorization(account.id, query))}><RefreshCw size={14} />重新查询商品</button>}<button className={primaryClass} disabled={Boolean(issue)} title={issue} onClick={() => run(() => initializeAdAuthorization(account.id, response))}><ShieldCheck size={14} />提交初始化</button></>}>
    <p className="break-words text-sm font-medium">{account.name}</p><p className="mt-1 break-all text-xs text-slate-500">{account.id}</p>
    <p className="my-4 text-sm leading-6">将向千川提交该账户的全域授权初始化。请求成功不代表商品已可投，仍以重新查询的商品结果为准。同一账户每10分钟最多提交一次。</p>
    <ul className="mb-4 space-y-2 text-xs">{repairableProducts(account).map(product => <li key={product.id} className="border-b border-slate-100 pb-2"><b>{product.name}</b><p className="mt-1 break-all">{product.grayReasons?.join("；")}</p></li>)}</ul>
    <div className="grid gap-3 sm:grid-cols-2"><Field title="模拟初始化反馈"><select className={inputClass} aria-label="模拟初始化反馈" value={response} onChange={e => setResponse(e.target.value as typeof response)}><option value="accepted">请求成功，待查询商品</option><option value="unknown">请求超时，结果未知</option><option value="failed">接口明确失败</option></select></Field><Field title="模拟商品查询反馈"><select className={inputClass} aria-label="模拟商品查询反馈" value={query} onChange={e => setQuery(e.target.value as typeof query)}><option value="ineligible">仍不可投</option><option value="eligible">该权限原因已解除</option><option value="unavailable">查询失败</option></select></Field></div>
    {account.authRepair && <p role="status" className="mt-4 text-sm leading-6">{account.authRepair.message}</p>}
    {issue && <p className="mt-3 text-xs leading-5 text-amber-700">{issue}</p>}<ErrorLine text={error} />
  </AdDialog>;
}

export function AdTaskRecovery({ record, ownerId }: { record: AdPushRecord; ownerId?: string }) {
  const [outcome, setOutcome] = useState<WriteEvidence["outcome"]>("not_found");
  const [library, setLibrary] = useState<"ready" | "pending" | "unavailable">("pending");
  const [confirmation, setConfirmation] = useState<"retain" | "capacity" | null>(null);
  const [error, setError] = useState("");
  const advice = adDeliveryAdvice(record);
  const run = (action: () => void) => { try { action(); setError(""); } catch (cause) { setError((cause as Error).message); } };
  const stepNames = { upload: "视频上传", cover: "封面上传", create: "新建计划", append: "追加素材", enable: "请求开启" };
  const stopped = record.status === "已取消";
  const coverLibrary = record.executionIssue === "cover_library";
  return <>
    {record.pendingWrite && !stopped && <section className="mb-4 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm leading-6">
      <h3 className="font-semibold">{stepNames[record.pendingWrite.step]}结果待核查</h3>
      <p>不会重复提交原请求。未查到结果或匹配到多个结果时保持待确认；长期无法确认请将本平台任务ID交给技术支持。</p>
      <Field title="模拟原请求核查反馈"><select aria-label="模拟原请求核查反馈" className={inputClass} value={outcome} onChange={e => setOutcome(e.target.value as typeof outcome)}><option value="not_found">暂未查到，保持待确认</option><option value="ambiguous">多个候选 / 字段不匹配</option><option value="unavailable">查询失败</option><option value="matched">唯一匹配原请求成功结果</option><option value="failed">收到原请求明确失败回执</option></select></Field>
      <button className={`${buttonClass} mt-3`} onClick={() => run(() => simulateAdWriteRecheck(record.id, outcome, ownerId))}><RefreshCw size={14} />核查原请求并继续</button>
    </section>}
    {(record.executionIssue === "library" || coverLibrary) && !stopped && <section className="mb-4 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm leading-6"><h3 className="font-semibold">{coverLibrary ? "等待封面入库" : "等待素材入库"}</h3><p>{coverLibrary ? "封面" : "视频"}上传已返回标识，当前只查询入库，不重复上传。长期未入库可取消后续步骤并联系技术支持。</p><Field title="模拟素材入库反馈"><select aria-label="模拟素材入库反馈" className={inputClass} value={library} onChange={e => setLibrary(e.target.value as typeof library)}><option value="pending">仍未入库</option><option value="ready">匹配原{coverLibrary ? "封面" : "视频"}，已入库</option><option value="unavailable">查询失败</option></select></Field><button className={`${buttonClass} mt-3`} onClick={() => run(() => recheckAdLibrary(record.id, library, ownerId))}><RefreshCw size={14} />{coverLibrary ? "查询封面入库" : "查询素材入库"}</button></section>}
    {record.executionIssue === "cover" && !record.pendingWrite && !stopped && <p className="mb-4 text-sm leading-6 text-amber-700">封面处理失败，已上传的视频保留。重试只继续封面和后续步骤，不重复上传视频。</p>}
    {record.executionIssue === "capacity" && !stopped && <section className="mb-4 text-sm leading-6"><p>千川返回素材容量不足，未追加、未移除旧视频。处理千川原计划容量后可以重试；不会先删除旧视频腾出位置。</p><button className={`${buttonClass} mt-2`} onClick={() => setConfirmation("capacity")}>已处理容量，重试追加</button></section>}
    {advice && <p className="mb-4 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm leading-6">{advice}</p>}
    {!stopped && record.applied && !record.pendingWrite && ["待确认", "移除失败"].includes(record.removalResult || "") && <button className={`${buttonClass} mb-4`} onClick={() => setConfirmation("retain")}>保留旧视频并结束替换</button>}
    {record.recoveryEvidence && <p role="status" className="mb-4 break-words text-xs leading-5">核查来源：{record.recoveryEvidence.source}<br />{record.recoveryEvidence.checkedAt} · {record.recoveryEvidence.conclusion}</p>}
    <ErrorLine text={error} />
    {confirmation && <AdDialog title={confirmation === "retain" ? "保留旧视频" : "重试原追加步骤"} onClose={() => setConfirmation(null)} footer={<><button className={buttonClass} onClick={() => setConfirmation(null)}>取消</button><button className={primaryClass} onClick={() => { run(() => confirmation === "retain" ? retainOldAdMaterials(record.id, ownerId) : retryAdCapacity(record.id, ownerId)); setConfirmation(null); }}>确认</button></>}><p className="text-sm leading-6">{confirmation === "retain" ? "结束本次旧视频移除，已新增素材保留，不暂停或撤销千川投放，也不改变审核结论。此任务之后不会自动移除旧视频。" : "确认已在千川处理原计划容量？将复用已上传素材重试追加，仍以千川返回结果为准，不提前移除旧视频。"}</p></AdDialog>}
  </>;
}
