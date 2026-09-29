import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { AdDialog, buttonClass, primaryClass, inputClass } from "./AdPushDialogs";
import { useAdStore } from "../lib/useAdStore";
import { adAccountState, canUseAdAccount, getAdActor, type AdAccount, type AdConnectionCandidate } from "../lib/adPush";
import { connectAuthorizedAdAccounts, demoAuthorizationCandidates, simulateAdAuthorization, type AuthorizationScenario, type DemoAuthorizationResult } from "../lib/adAccountAuthorization";

const typeNames = { SHOP: "商家", SHOP_STAR: "商家达人", COMMON_STAR: "普通达人", AGENT: "机构" };
type Step = "start" | "consent" | "callback" | "select" | "connecting" | "success" | "failed";

export default function AdAuthorizationDialog({ platform, account, onClose, onSuccess }: { platform: string; account?: AdAccount; onClose: () => void; onSuccess: () => void }) {
  const qianchuan = platform === "巨量千川";
  const reconnecting = account && adAccountState(account) === "disconnected";
  const { accounts } = useAdStore();
  const [step, setStep] = useState<Step>("start");
  const [scenario, setScenario] = useState<AuthorizationScenario>("success");
  const [receipt, setReceipt] = useState<DemoAuthorizationResult>();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const actorId = useRef(getAdActor().id);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const options: AdConnectionCandidate[] = account
    ? [{ id: account.id, name: account.name, ...(account.ecpType ? { ecpType: account.ecpType } : {}), ...(account.authorizationSubject ? { authorizationSubject: account.authorizationSubject } : {}) }]
    : demoAuthorizationCandidates(platform, accounts);
  const connected = (id: string) => !account && accounts.some(item => item.platform === platform && item.id === id && canUseAdAccount(item));
  const close = () => { window.clearTimeout(timer.current); if (step === "success") onSuccess(); else onClose(); };
  const restart = () => { window.clearTimeout(timer.current); setSelected([]); setReceipt(undefined); setError(""); actorId.current = getAdActor().id; setStep("start"); };
  const returnFromPlatform = (consent: boolean) => {
    if (step !== "consent") return;
    setStep("callback");
    timer.current = window.setTimeout(() => {
      const result = simulateAdAuthorization(platform, options, scenario, consent, actorId.current);
      setReceipt(result);
      if (result.outcome !== "success") { setError(result.message); setStep("failed"); return; }
      if (getAdActor().id !== result.actorId || !getAdActor().permissions.includes("ab_ad_group_manage")) { setError("登录身份或管理权限已变化，请重新发起授权"); setStep("failed"); return; }
      setStep("select");
    }, 700);
  };
  const connect = () => {
    if (step !== "select" || !receipt) return;
    setError(""); setStep("connecting");
    timer.current = window.setTimeout(() => {
      try { connectAuthorizedAdAccounts(receipt, selected, account); setStep("success"); }
      catch (e) { setError(e instanceof Error ? e.message : "接入失败，请重试"); setStep("select"); }
    }, 700);
  };
  const missingAccount = Boolean(account && receipt && !receipt.candidates.some(item => item.id === account.id));
  const stageIndex = ["start", "consent"].includes(step) ? 0 : step === "success" ? 3 : ["select", "connecting"].includes(step) ? 2 : 1;
  return <AdDialog title={`${reconnecting ? "重新接入" : account ? "重新授权" : "授权"}${platform}广告账户`} onClose={close} footer={<>
    {step !== "success" && <button className={buttonClass} onClick={close}>{step === "failed" ? "关闭" : "取消"}</button>}
    {step === "start" && <button className={primaryClass} onClick={() => setStep("consent")}><ExternalLink className="h-4 w-4" />前往模拟授权</button>}
    {step === "consent" && <><button className={buttonClass} onClick={() => returnFromPlatform(false)}>拒绝授权</button><button className={primaryClass} onClick={() => returnFromPlatform(true)}>同意授权并返回</button></>}
    {step === "select" && <><button className={buttonClass} onClick={restart}><ArrowLeft className="h-4 w-4" />重新授权</button><button className={primaryClass} disabled={!selected.length || missingAccount} onClick={connect}>确认接入{selected.length ? ` (${selected.length})` : ""}</button></>}
    {step === "failed" && <button className={primaryClass} onClick={restart}>重新发起授权</button>}
    {step === "success" && <button className={primaryClass} onClick={onSuccess}>返回账户列表</button>}
  </>}>
    <div className="space-y-5 text-sm text-slate-800">
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">模拟授权 · 未连接广告平台，不需要真实账号密码</p>
      <ol aria-label="接入进度" className="grid grid-cols-4 gap-2 text-center text-xs">{["平台授权", "返回校验", "选择账户", "接入完成"].map((label, i) => <li key={label} aria-current={i === stageIndex ? "step" : undefined} className={`border-b-2 pb-2 ${i <= stageIndex ? "border-violet-600 text-violet-700" : "border-slate-200 text-slate-500"}`}>{label}</li>)}</ol>
      {step === "start" && <div className="space-y-4">
        <p>授权平台：{platform}</p>
        {account && <p className="break-words">待恢复账户：{account.name}<span className="mt-1 block break-all text-xs text-slate-500">{account.id}</span></p>}
        <label className="block space-y-2"><span className="text-xs font-semibold">模拟返回结果</span><select className={inputClass} value={scenario} onChange={event => setScenario(event.target.value as AuthorizationScenario)}>
          <option value="success">授权成功</option><option value="failed">授权服务失败</option><option value="empty">无可接入账户</option><option value="invalid_callback">回调校验失败</option>{account && <option value="wrong_account">未返回待恢复账户</option>}
        </select></label>
      </div>}
      {step === "consent" && <div className="space-y-4">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-emerald-600" />{platform}侧授权确认（模拟）</div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-xs"><dt className="text-slate-500">接入应用</dt><dd>梦畅AIGC一期</dd><dt className="text-slate-500">业务范围</dt><dd>广告账户、视频素材、投放计划及相关投放对象</dd><dt className="text-slate-500">返回平台</dt><dd>梦畅AIGC</dd></dl>
        <p className="text-xs text-slate-500">授权不会上传视频、创建计划或开启投放；具体可用能力以账户权限为准。</p>
      </div>}
      {step === "select" && <div className="space-y-3">
        <p className="text-xs text-emerald-700">模拟回调已校验，已取得 {receipt?.candidates.length || 0} 个广告账户</p>
        {missingAccount ? <p role="alert" className="py-5 text-amber-800">本次授权未返回待恢复账户，请重新授权。原账户配置和历史记录未变更。</p> : !receipt?.candidates.length ? <p role="status" className="py-5 text-slate-500">当前授权主体下暂无可接入账户</p> : <fieldset className="space-y-1"><legend className="mb-2 font-semibold">选择接入账户</legend>{receipt.candidates.map(item => <label key={item.id} className={`flex items-start gap-3 border-b border-slate-200 py-3 ${connected(item.id) ? "opacity-50" : "cursor-pointer"}`}>
          <input type={qianchuan ? "checkbox" : "radio"} name="authorize-account" aria-label={`接入 ${item.name}`} disabled={connected(item.id)} checked={selected.includes(item.id)} onChange={() => { setSelected(previous => qianchuan ? previous.includes(item.id) ? previous.filter(id => id !== item.id) : [...previous, item.id] : [item.id]); setError(""); }} className="mt-1 accent-violet-600" />
          <span className="min-w-0 break-words">{item.name}{connected(item.id) && <span className="ml-2 text-xs text-emerald-700">已接入</span>}<span className="mt-1 block break-all text-xs text-slate-500">{item.id}{item.ecpType ? ` · ${typeNames[item.ecpType]}` : ""}</span>{item.authorizationSubject && <span className="mt-1 block text-xs text-slate-500">授权主体：{item.authorizationSubject.kind === "shop" ? "店铺" : "代理商"} · {item.authorizationSubject.name}</span>}</span>
        </label>)}</fieldset>}
      </div>}
      {(step === "callback" || step === "connecting") && <p role="status" className="flex items-center gap-3 py-8"><Loader2 className="h-5 w-5 animate-spin text-violet-600" />{step === "callback" ? "正在返回本平台并校验模拟授权结果" : "正在接入所选账户"}</p>}
      {step === "success" && <div role="status" className="space-y-3 py-5"><p className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />已接入 {selected.length} 个账户，未发起投放</p><p className="text-xs text-slate-500">{account ? "原有绑定、分组、备注和历史记录已保留。" : "新账户默认仅接入人可见；成员使用范围由账户分组与系统可见性共同决定。"}</p></div>}
      {error && <p role="alert" className="flex items-start gap-2 text-rose-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
    </div>
  </AdDialog>;
}
