import { adCatalog, adDate, advanceAdStore, canSeeAdAccount, canUseAdAccount, getAdActor, isCreatingAdPlan, updateAdStore, visibleAdRecords, type AdAccount, type AdActor, type AdPushRecord, type AdStore } from "./adPush";
import { canUseDerivations } from "./derivationPermissions";

export const QC_AUTH_REASON = "当前账户无使用该抖音号投放所选商品的全域投放权限";
export const AUTH_REPAIR_INTERVAL = 10 * 60 * 1000;
export const repairableProducts = (account: AdAccount) => ["COMMON_STAR", "AGENT"].includes(account.ecpType || "")
  ? adCatalog(account).products.filter(p => p.source === "talent" && p.grayReasons?.includes(QC_AUTH_REASON)) : [];

function accountAccess(store: AdStore, actor: AdActor, accountId: string) {
  const account = store.accounts.find(a => a.id === accountId && a.platform === "巨量千川");
  if (!actor.permissions.includes("uc_ad_plan_manage") || !account || !canSeeAdAccount(account, store, actor)) throw new Error("暂无该账户的投放操作权限");
  if (!canUseAdAccount(account)) throw new Error("账户授权不可用，请联系管理员恢复授权后操作");
  return account;
}

export function adAuthRepairIssue(store: AdStore, actor: AdActor, accountId: string, now = Date.now()): string {
  try {
    const account = accountAccess(store, actor, accountId);
    if (!repairableProducts(account).length) return "当前没有符合全域授权初始化条件的商品";
    const remaining = AUTH_REPAIR_INTERVAL - (now - (account.authRepair?.requestedAt ?? -Infinity));
    return remaining > 0 ? `同一账户每10分钟最多提交一次，请在${Math.ceil(remaining / 1000)}秒后再试；可以继续查询商品` : "";
  } catch (cause) { return (cause as Error).message; }
}

export function initializeAdAuthorization(accountId: string, outcome: "accepted" | "unknown" | "failed", now = Date.now()) {
  updateAdStore(store => {
    const issue = adAuthRepairIssue(store, getAdActor(), accountId, now);
    if (issue) throw new Error(issue);
    const message = outcome === "accepted" ? "初始化请求成功，商品可投状态尚未确认，请重新查询" : outcome === "unknown" ? "初始化请求超时，结果未知；先查询商品，10分钟内不重复提交" : "初始化失败，保留原不可投原因；请联系管理员核查授权";
    return { ...store, accounts: store.accounts.map(a => a.id === accountId && a.platform === "巨量千川" ? { ...a, authRepair: { requestedAt: now, outcome, message } } : a) };
  });
}

export function recheckAdAuthorization(accountId: string, response: "eligible" | "ineligible" | "unavailable") {
  updateAdStore(store => {
    const account = accountAccess(store, getAdActor(), accountId);
    if (!account.authRepair) throw new Error("请先提交全域授权初始化");
    const repairable = new Set(repairableProducts(account).map(p => p.id)), time = adDate();
    const message = response === "eligible" ? "商品查询完成，已更新可投结果；请重新选择商品" : response === "ineligible" ? "商品仍不可投，保留千川返回原因，请联系管理员核查商品和抖音号授权" : "商品查询失败，保留上次结果，可稍后重查";
    return { ...store, accounts: store.accounts.map(a => a !== account ? a : { ...a,
      authRepair: { ...account.authRepair!, checkedAt: time, message },
      catalog: response !== "eligible" ? a.catalog : { ...adCatalog(a), products: adCatalog(a).products.map(p => repairable.has(p.id) ? { ...p, grayReasons: p.grayReasons?.filter(reason => reason !== QC_AUTH_REASON) } : p) },
    }) };
  });
}

function recordAccess(store: AdStore, id: string, ownerId?: string) {
  const actor = getAdActor(), record = store.records.find(r => r.id === id);
  if (!record || ownerId && (ownerId !== actor.id || ownerId !== record.operatorId)) throw new Error("记录不可用或无操作权限");
  if (!visibleAdRecords(store, actor, record.videoId).some(r => r.id === id)) throw new Error("记录不在当前用户的数据可见范围内");
  const account = store.accounts.find(a => a.id === record.accountId && a.platform === record.platform);
  if (!account || !canUseAdAccount(account) || !canSeeAdAccount(account, store, actor) || (record.derivativeId ? !canUseDerivations(actor) : !actor.permissions.includes("uc_ad_push")) || record.method !== "push" && !actor.permissions.includes("uc_ad_plan_manage")) throw new Error("账户授权或操作权限不可用");
  if (record.status === "已取消") throw new Error("任务已取消，不再执行后续步骤");
  return record;
}

export type WriteEvidence = {
  attemptId: string; accountId: string; checkedAt: string;
  outcome: "matched" | "failed" | "not_found" | "ambiguous" | "unavailable";
  // This is a server-side reconciliation result, not a Qianchuan response schema.
  exactMatch?: boolean; source: string; planId?: string; videoId?: string; materialId?: string; coverId?: string;
};

export function resolveAdWrite(record: AdPushRecord, evidence: WriteEvidence): AdPushRecord {
  const pending = record.pendingWrite;
  if (!pending) return record;
  const time = evidence.checkedAt;
  if (evidence.attemptId !== pending.attemptId || evidence.accountId !== record.accountId || !Number.isFinite(Date.parse(time)) || Date.parse(time) < Date.parse(pending.requestedAt)) throw new Error("核查结果与原请求不匹配，不能恢复执行");
  const log = (text: string) => [...record.logs, { time, text }];
  if (["not_found", "ambiguous", "unavailable"].includes(evidence.outcome)) {
    const conclusion = evidence.outcome === "not_found" ? "暂未找到对应结果；查询空数据不能证明写入失败" : evidence.outcome === "ambiguous" ? "发现多个候选或字段不一致，不能唯一匹配原请求" : "查询失败，结果仍未知";
    return { ...record, lastCheckedAt: time, recoveryEvidence: { source: evidence.source, checkedAt: time, conclusion }, logs: log(`${conclusion}；保持锁定，不重复写入，可继续核查或联系技术支持`) };
  }
  if (!evidence.exactMatch) throw new Error("缺少原请求与远端结果的唯一匹配证据");
  if (evidence.outcome === "failed") return { ...record, status: "推送失败", pendingWrite: undefined, failureKind: "transport", simulationFailure: undefined, lastCheckedAt: time, failureReason: "已收到原请求明确失败回执，可重试未完成步骤", recoveryEvidence: { source: evidence.source, checkedAt: time, conclusion: "原请求明确失败" }, logs: log("原请求明确失败，解除写入锁定；未重试任何写入") };
  const step = pending.step;
  if (step === "upload" && (!evidence.videoId || !evidence.materialId) || step === "cover" && !evidence.coverId || ["create", "append", "enable"].includes(step) && !evidence.planId || record.planId && evidence.planId && record.planId !== evidence.planId) throw new Error("核查结果缺少对应远端标识或计划不一致");
  const next: AdPushRecord = { ...record, examplePaused: false, status: "待处理", pendingWrite: undefined, failureKind: undefined, failureReason: "", executionIssue: undefined, simulationFailure: undefined, lastCheckedAt: time, updatedAt: time,
    recoveryEvidence: { source: evidence.source, checkedAt: time, conclusion: "已唯一确认原请求成功，继续未完成步骤" }, logs: log("已唯一确认原请求成功，复用原远端标识，不重复写入") };
  if (step === "upload") Object.assign(next, { remoteVideoId: evidence.videoId, assetId: evidence.materialId, pushStatus: "推送成功" });
  if (step === "cover") Object.assign(next, { coverId: evidence.coverId, coverReady: true });
  if (step === "create" || step === "append") Object.assign(next, { planId: evidence.planId, planResult: step === "create" ? "创建成功" : "追加成功", planHandledAt: time });
  if (step === "enable") Object.assign(next, { enableResult: "请求成功", enableApplied: false });
  return next;
}

export function simulateAdWriteRecheck(id: string, outcome: WriteEvidence["outcome"], ownerId?: string) {
  updateAdStore(store => {
    const record = recordAccess(store, id, ownerId), pending = record.pendingWrite;
    if (!pending) throw new Error("当前没有待核查的写入请求");
    const time = adDate(), step = pending.step;
    const source = step === "create" ? "计划列表 + 计划详情 + 原请求日志" : step === "append" || step === "enable" ? "计划详情 + 原请求日志" : step === "upload" ? "上传回执 / 异步任务结果 + 视频素材库" : "图片上传回执 + 当前账户图片库ID / MD5核查";
    const evidence: WriteEvidence = { attemptId: pending.attemptId, accountId: record.accountId, checkedAt: time, outcome, exactMatch: true, source,
      planId: record.planId || `PLAN-${record.planGroupId || record.id}`, videoId: `VID-${record.accountId}-${record.derivativeId || record.videoId}`, materialId: `MAT-${record.accountId}-${record.derivativeId || record.videoId}`, coverId: `IMG-${record.accountId}-${record.derivativeId || record.videoId}` };
    // A create/enable call is plan-scoped; acknowledgement must resolve every member once.
    const records = store.records.map(r => r.status !== "已取消" && (r.id === id || ["create", "enable"].includes(step) && r.accountId === record.accountId && r.platform === record.platform && r.pendingWrite?.attemptId === pending.attemptId)
      ? resolveAdWrite(r, evidence) : r);
    return advanceAdStore({ ...store, records });
  });
}

export function recheckAdLibrary(id: string, outcome: "ready" | "pending" | "unavailable", ownerId?: string) {
  updateAdStore(store => {
    const record = recordAccess(store, id, ownerId);
    const cover = record.executionIssue === "cover_library";
    if (!cover && record.executionIssue !== "library" || (cover ? !record.coverId : !record.remoteVideoId || !record.assetId)) throw new Error("当前没有待查询的素材入库步骤");
    const time = adDate(), ready = outcome === "ready";
    const text = ready ? `已按当前账户和原${cover ? "图片" : "视频"}ID确认入库，继续未完成步骤` : outcome === "pending" ? `${cover ? "封面" : "视频"}仍未入库，保留原上传标识；不重复上传` : "入库查询失败，保留原上传标识，可继续核查";
    return advanceAdStore({ ...store, records: store.records.map(r => r.id !== id ? r : { ...r, ...(ready ? { examplePaused: false, status: "待处理" as const, ...(cover ? { coverReady: true } : { materialReady: true }), executionIssue: undefined, failureKind: undefined, failureReason: "", simulationFailure: undefined } : {}), lastCheckedAt: time, logs: [...r.logs, { time, text }] }) });
  });
}

export function retainOldAdMaterials(id: string, ownerId?: string) {
  updateAdStore(store => {
    const record = recordAccess(store, id, ownerId);
    if (!record.applied || record.pendingWrite || !["待确认", "移除失败"].includes(record.removalResult || "")) throw new Error("当前没有可结束的旧视频移除步骤");
    const time = adDate();
    return { ...store, records: store.records.map(r => r.id !== id ? r : { ...r, removalResult: "已保留" as const, removalReason: "运营已结束替换并保留旧视频；新增素材和远端投放不撤销", status: r.materialReview === "审核驳回" ? "推送失败" as const : "推送成功" as const, failureReason: r.materialReview === "审核驳回" ? r.failureReason : "", simulationFailure: undefined, logs: [...r.logs, { time, text: "保留旧视频，结束本次移除步骤；不改变审核结论和计划投放状态" }] }) };
  });
}

export function retryAdCapacity(id: string, ownerId?: string) {
  updateAdStore(store => {
    const record = recordAccess(store, id, ownerId);
    if (record.executionIssue !== "capacity" || record.pendingWrite) throw new Error("当前没有容量不足的失败步骤");
    const time = adDate();
    return { ...store, records: store.records.map(r => r.id !== id ? r : { ...r, examplePaused: false, status: "待处理" as const, startedAt: Date.now(), executionIssue: undefined, failureKind: undefined, failureReason: "", simulationFailure: undefined, logs: [...r.logs, { time, text: "运营确认已处理千川容量，重试原追加步骤；旧视频不提前移除，仍以接口回执判断是否成功" }] }) };
  });
}

export function adDeliveryAdvice(record: AdPushRecord): string {
  const messages: Record<string, string> = {
    "账户余额不足": "请到千川处理账户余额，完成后核查原计划；无需重新上传或创建计划。",
    "投放预算不足": "请到千川调整原计划预算，完成后核查原计划；本任务不重复创建计划。",
    "未到达投放时间": "等待已设定的投放开始时间，再核查实际投放状态。",
    "在投计划配额超限": "请到千川处理在投计划配额，再核查原计划；本平台不自动暂停其他计划。",
    "关联直播间未开播": "关联直播间开播后再核查；追加素材不会启动直播。",
  };
  return messages[record.deliveryStatus] || "";
}

export const AD_EXECUTION_SCENARIOS = [
  { value: "normal", label: "正常执行" },
  { value: "media", label: "视频预检不通过" },
  { value: "upload", label: "视频上传明确失败" },
  { value: "upload_unknown", label: "视频上传超时，结果未知" },
  { value: "cover", label: "封面上传失败" },
  { value: "cover_unknown", label: "封面上传超时，结果未知" },
  { value: "library", label: "素材入库延迟" },
  { value: "cover_library", label: "封面入库延迟" },
  { value: "create_unknown", label: "新建计划超时，结果未知" },
  { value: "append_unknown", label: "追加素材超时，结果未知" },
  { value: "enable_unknown", label: "请求开启超时，结果未知" },
  { value: "capacity", label: "追加时素材容量不足" },
] as const;
export type AdExecutionScenario = typeof AD_EXECUTION_SCENARIOS[number]["value"];
export function applyAdExecutionScenario(records: AdPushRecord[], scenario: AdExecutionScenario): AdPushRecord[] {
  if (scenario === "normal") return records;
  const step = scenario.replace("_unknown", "") as NonNullable<AdPushRecord["simulationFailure"]>["step"];
  const label = AD_EXECUTION_SCENARIOS.find(s => s.value === scenario)!.label;
  if (records.some(r => r.method === "push" && !["media", "upload", "library"].includes(step) || ["create", "enable"].includes(step) && !isCreatingAdPlan(r.snapshot) || ["append", "capacity"].includes(step) && (isCreatingAdPlan(r.snapshot) || r.method === "push"))) throw new Error("模拟场景与当前推送方式不匹配，请重新选择");
  return records.map(r => ({ ...r, simulationFailure: { step, unknown: scenario.endsWith("_unknown"), message: `原型模拟：${label}` } }));
}
