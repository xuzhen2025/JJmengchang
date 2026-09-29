import { OPERATION_EXAMPLE_VIDEOS, operationExampleTime } from "../data/operationExamples";
import { adCatalog, adDate, canSeeAdAccount, canUseAdAccount, getAdActor, isCreatingAdPlan, updateAdStore, type AdAccount, type AdActor, type AdDraft, type AdPlan, type AdPushRecord, type AdStore, type AdTemplate } from "./adPush";
import { defaultWorkbench } from "./adPushConfig";
import { canUseDerivations } from "./derivationPermissions";
import { derivationOutput } from "./videoDerivation";

type ExampleOptions = { account?: AdAccount; method?: AdDraft["method"]; live?: boolean; template?: AdTemplate; video?: number; group?: string; task?: string };

export function withOperationAdExamples(store: AdStore, actor: AdActor, now = Date.now()): AdStore {
  if (!actor.id || actor.id === "anonymous" || !actor.permissions.includes("uc_ad_push")) return store;
  const available = store.accounts.filter(account => ["巨量千川", "巨量广告"].includes(account.platform) && canSeeAdAccount(account, store, actor));
  const qc = available.filter(account => account.platform === "巨量千川" && canUseAdAccount(account));
  const primary = qc[0] || available.find(canUseAdAccount);
  if (!primary) return store;
  const day = adDate(new Date(now)).slice(0, 10).replaceAll("-", "");
  const prefix = `OP-DEMO-${actor.id}-${day}`;
  const examples: AdPushRecord[] = [];
  const canPlan = actor.permissions.includes("uc_ad_plan_manage") && qc.length > 0;
  const template = store.templates.find(item => item.platform === "巨量千川" && item.goal === "推商品" && item.workbench?.target === "商品全域" && (item.scope === "公司模板" || item.ownerId === actor.id));

  const add = (key: string, patch: Partial<AdPushRecord> = {}, options: ExampleOptions = {}) => {
    const account = options.account || primary, method = options.method || "push";
    const source = OPERATION_EXAMPLE_VIDEOS[options.video ?? examples.length % OPERATION_EXAMPLE_VIDEOS.length];
    const catalog = adCatalog(account), product = catalog.products[0], douyin = catalog.douyins[0];
    const time = adDate(new Date(operationExampleTime(examples.length, now)));
    const id = `${prefix}-${key}`, group = `${prefix}-${options.group || key}`;
    const append = options.live === true;
    const planId = append ? `${prefix}-LIVE-${account.id}` : "";
    const config = { ...defaultWorkbench(), target: append ? "直播全域" as const : "商品全域" as const, operation: append ? "append" as const : "create" as const, budget: "300", roi: "2", titles: ["商品实拍与使用展示"], planName: `示例计划_${options.group || key}` };
    const snapshot: AdDraft = { platform: account.platform, method, goal: append ? "推直播间" : "推商品", creative: "多创意", naming: "{视频名称}", version: examples.length % 2 ? "转码后视频" : "原片", scheduledAt: "", templateIds: options.template ? [options.template.id] : [],
      rows: [{ id: `${id}-row`, accountId: account.id, douyinId: method === "push" ? "" : douyin?.id || "", storeId: method === "push" || append ? "" : product?.storeId || "", productId: method === "push" || append ? "" : product?.id || "", planId }],
      workbench: method === "push" ? undefined : structuredClone(options.template?.workbench || config) };
    const record: AdPushRecord = { id, taskId: `${prefix}-${options.task || key}`, planGroupId: group, kind: "push_video", sourceVideo: source, videoId: source.id, videoTitle: source.title, platform: account.platform, accountId: account.id, account: account.name,
      method, marketingGoal: snapshot.goal, assetId: "", assetName: source.title, planId, planName: method === "push" ? "" : append ? "示例直播全域计划" : config.planName, templateName: options.template?.name || "", templateSnapshot: options.template && structuredClone(options.template),
      status: "待处理", pushStatus: "待处理", materialReview: method === "push" ? "不涉及投放审核" : "未提交", planResult: method === "push" ? "不涉及" : "待处理", planReview: method === "push" ? "不涉及" : "未提交", deliveryStatus: method === "push" ? "不涉及" : append ? "投放中" : "未创建", enableResult: method === "push" || append ? "不涉及" : "未请求", removalResult: "不涉及",
      failureReason: "", operatorId: actor.id, operator: actor.name, createdAt: time, updatedAt: time, startedAt: operationExampleTime(examples.length, now), snapshot, logs: [], dataSource: "prototype", examplePaused: true, ...patch };
    if (record.pushStatus === "推送成功") {
      record.assetId ||= `DEMO-MAT-${account.id}-${key}`;
      record.remoteVideoId ||= `DEMO-VID-${account.id}-${key}`;
      record.materialReady ??= true;
      if (method !== "push") { record.coverId ||= `DEMO-IMG-${account.id}-${key}`; record.coverReady ??= true; }
    }
    if (["创建成功", "追加成功"].includes(record.planResult)) {
      record.planId ||= `DEMO-PLAN-${group}`;
      record.applied = true;
      record.planHandledAt = time;
      record.planReview = patch.planReview || "待同步";
      record.deliveryStatus = patch.deliveryStatus || (append ? "投放中" : "待同步");
    }
    record.logs = [{ time, text: "操作记录演示任务（模拟数据）" }, { time, text: record.failureReason || `当前执行状态：${record.status}` }];
    examples.push(record);
    return record;
  };

  add("upload-waiting");
  add("upload-running", { status: "推送中", pushStatus: "推送中" });
  add("upload-success", { status: "推送成功", pushStatus: "推送成功" });
  add("upload-failed", { status: "推送失败", pushStatus: "推送失败", failureKind: "transport", failureReason: "视频上传连接中断，未产生素材，可重试" });
  add("upload-cancelled", { status: "已取消", pushStatus: "已取消" });
  const unknownUpload = add("upload-unknown", { status: "待确认", pushStatus: "结果待核查", failureKind: "unknown_write", failureReason: "视频上传请求超时，请先核查原请求，不能重复上传" });
  unknownUpload.pendingWrite = { step: "upload", attemptId: `${unknownUpload.id}:upload`, requestedAt: unknownUpload.createdAt };
  add("media-rejected", { status: "推送失败", pushStatus: "未推送", executionIssue: "media", failureKind: "transport", failureReason: "视频预检未通过，请返回资源库处理成片后重新发起" });
  const ad = available.find(account => account.platform === "巨量广告" && canUseAdAccount(account));
  if (ad) add("ad-upload-success", { status: "推送成功", pushStatus: "推送成功" }, { account: ad });
  const expired = available.find(account => !canUseAdAccount(account));
  if (expired) add("authorization-failed", { status: "推送失败", pushStatus: "未推送", failureKind: "authorization", failureReason: "广告账户授权已失效，请联系管理员恢复授权后重试" }, { account: expired });
  if (canUseDerivations(actor)) {
    const deriving = derivationOutput(`DER-DEMO-${actor.id}-3`, actor.id);
    if (deriving) {
      const record = add("deriving", { status: "衍生中", pushStatus: "未推送", derivativeId: deriving.id, sourceVideo: deriving.source, videoId: deriving.source.id, videoTitle: deriving.source.title, assetName: deriving.name });
      record.snapshot.derivation = { allocation: "shared", count: 1 };
    }
    const output = derivationOutput(`DER-DEMO-${actor.id}-1`, actor.id);
    if (output) add("derivative-success", { status: "推送成功", pushStatus: "推送成功", derivativeId: output.id, sourceVideo: output.source, videoId: output.source.id, videoTitle: output.source.title, assetName: output.name });
  }
  if (canPlan) {
    const direct: ExampleOptions = { method: "full_domain", account: qc[0] };
    const templated: ExampleOptions = template ? { ...direct, method: "plan", template } : direct;
    const uploaded: Partial<AdPushRecord> = { pushStatus: "推送成功", materialReview: "待确认" };
    const created: Partial<AdPushRecord> = { ...uploaded, planResult: "创建成功", enableResult: "请求成功", enableApplied: true, status: "推送成功" };
    add("plan-waiting", {}, templated);
    add("library-waiting", { ...uploaded, status: "等待素材入库", materialReady: false, coverReady: false, executionIssue: "library", planResult: "等待视频入库" }, direct);
    add("plan-running", { ...uploaded, status: "创建计划中", planResult: "创建计划中" }, templated);
    add("enable-running", { ...created, status: "请求开启中", enableResult: "请求中", enableApplied: false }, direct);
    add("audit-running", { ...created, status: "审核中", materialReview: "审核中", planReview: "审核中", deliveryStatus: "审核中" }, direct);
    add("plan-success", { ...created, materialReview: "审核通过", planReview: "审核通过", deliveryStatus: "投放中" }, templated);
    add("plan-failed", { ...uploaded, status: "推送失败", planResult: "未完成", failureKind: "transport", failureReason: "创建计划请求明确失败，已上传的视频保留，可重试创建步骤" }, direct);
    add("plan-cancelled", { status: "已取消", pushStatus: "已取消", planResult: "已取消" }, templated);
    const unknown = add("plan-unknown", { ...uploaded, status: "待确认", planResult: "结果待核查", failureKind: "unknown_write", failureReason: "创建计划请求超时，结果未知；先核查原请求，禁止重复创建" }, direct);
    unknown.pendingWrite = { step: "create", attemptId: `${unknown.planGroupId}:create`, requestedAt: unknown.createdAt };
    add("material-rejected", { ...created, status: "推送失败", materialReview: "审核驳回", failureKind: "material_rejected", failureReason: "视频内容审核驳回，请返回资源库选择合规成片重新发起" }, direct);
    add("plan-rejected", { ...created, status: "推送失败", planReview: "审核驳回", failureKind: "plan_rejected", failureReason: "计划资质审核驳回，请处理资质后核查原计划，不重复创建" }, direct);
    add("enable-failed", { ...created, status: "推送失败", enableResult: "请求失败", enableApplied: false, failureKind: "transport", failureReason: "计划已创建，请求开启失败；重试仅继续开启步骤" }, direct);
    add("cover-failed", { ...uploaded, status: "推送失败", coverReady: false, coverId: "", executionIssue: "cover", failureKind: "transport", failureReason: "视频已入库，封面上传失败，可重试封面上传" }, direct).coverId = "";
    const live: ExampleOptions = { ...direct, live: true };
    add("append-running", { ...uploaded, status: "追加中", planResult: "追加中" }, live);
    add("append-success", { ...uploaded, status: "推送成功", planResult: "追加成功", materialReview: "审核通过", planReview: "审核通过", deliveryStatus: "投放中" }, live);
    add("append-capacity", { ...uploaded, status: "推送失败", planResult: "未完成", failureKind: "transport", executionIssue: "capacity", failureReason: "计划素材容量不足，旧视频未移除；请处理容量后重试" }, live);
    add("partial-success", { ...created }, { ...direct, task: "partial-accounts", video: 0 });
    add("partial-failed", { ...uploaded, status: "推送失败", planResult: "未完成", failureKind: "transport", failureReason: "本账户创建失败；同一任务其他账户已创建成功，不受影响" }, { ...direct, account: qc[1] || qc[0], task: "partial-accounts", video: 0 });
    for (const video of [0, 1]) add(`multi-video-${video}`, { ...created }, { ...direct, group: "multi-video", task: "multi-video", video });
  }
  const ids = new Set(store.records.map(record => record.id));
  const added = examples.filter(record => !ids.has(record.id));
  if (!added.length) return store;

  // Add only demo-owned plans; never alter a user's existing target plan or authorization.
  const accounts = store.accounts.map(account => {
    const related = added.filter(record => record.accountId === account.id && record.platform === account.platform && record.planId);
    if (!related.length) return account;
    const catalog = adCatalog(account), plans = [...catalog.plans];
    for (const planId of new Set(related.map(record => record.planId))) {
      if (plans.some(plan => plan.id === planId)) continue;
      const members = related.filter(record => record.planId === planId), first = members[0];
      const linked = members.filter(record => ["创建成功", "追加成功"].includes(record.planResult));
      const row = first.snapshot.rows[0], combinations = [{ productId: row.productId, douyinId: row.douyinId }];
      const plan: AdPlan = { id: planId, name: first.planName, goal: first.marketingGoal, target: first.snapshot.workbench?.target, douyinId: row.douyinId, status: first.deliveryStatus,
        optStatus: first.enableResult === "请求成功" || !isCreatingAdPlan(first.snapshot) ? "ENABLE" : "DISABLE", createdAt: first.createdAt, budget: Number(first.snapshot.workbench?.budget || 300), roiTarget: Number(first.snapshot.workbench?.roi || 2), workbench: first.snapshot.workbench,
        targets: first.snapshot.rows, combinations, associationCoverage: "complete", videoIds: linked.map(record => record.derivativeId || record.videoId), materials: linked.map(record => ({ videoId: record.derivativeId || record.videoId, assetId: record.assetId, uploadedAt: record.createdAt, rejected: record.materialReview === "审核驳回", combinations, materialSelectType: "CUSTOM", daily: [] })) };
      plans.push(plan);
    }
    return { ...account, catalog: { ...catalog, plans } };
  });
  return { ...store, accounts, records: [...store.records, ...added] };
}

export function seedOperationAdExamples() {
  updateAdStore(store => withOperationAdExamples(store, getAdActor()));
}
