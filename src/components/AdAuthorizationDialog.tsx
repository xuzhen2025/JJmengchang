import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { AdDialog } from "./AdAccountPush";
import { AD_PLATFORMS, authorizeAdAccount, type AdAccount } from "../lib/adPush";

export default function AdAuthorizationDialog({ platform, account, onClose, onSuccess }: { platform: string; account?: AdAccount; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"start" | "select" | "waiting" | "success">("start");
  const [selected, setSelected] = useState(account?.id || "");
  const [error, setError] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const options = account ? [{ id: account.id, name: account.name }] : [1, 2].map(n => ({ id: `900${String(AD_PLATFORMS.indexOf(platform)).padStart(2, "0")}00000000${n}`, name: `${platform} · 梦畅官方店${n}` }));
  const close = () => { window.clearTimeout(timer.current); onClose(); };
  const authorize = () => {
    const chosen = options.find(a => a.id === selected);
    if (!chosen) { setError("请选择一个广告账户"); return; }
    setError(""); setStep("waiting");
    timer.current = window.setTimeout(() => {
      try { authorizeAdAccount(platform, chosen.id, chosen.name); setStep("success"); }
      catch (e) { setError(e instanceof Error ? e.message : "授权失败，请重新授权"); setStep("select"); }
    }, 800);
  };
  const button = "rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold";
  return <AdDialog title={`${account ? "重新授权" : "授权"}${platform}广告账户`} onClose={close} footer={<>
    {step !== "success" && <button className={button} onClick={close}>取消</button>}
    {step === "start" && <button className={`${button} bg-violet-600 text-white`} onClick={() => setStep("select")}><ExternalLink className="mr-2 inline h-4 w-4" />前往授权</button>}
    {step === "select" && <button className={`${button} bg-violet-600 text-white`} disabled={!selected} onClick={authorize}>确认授权</button>}
    {step === "success" && <button className={`${button} bg-violet-600 text-white`} onClick={onSuccess}>返回账户列表</button>}
  </>}>
    <div className="space-y-5 text-sm">
      <p className="text-xs text-amber-700">第三方授权原型演示，未连接广告平台。</p>
      {step === "start" && <div className="space-y-3"><p>授权平台：{platform}</p><p className="text-slate-500">申请范围：广告账户、视频素材、投放计划及相关投放对象。</p></div>}
      {step === "select" && <fieldset className="space-y-3"><legend className="mb-3 font-semibold">选择广告账户</legend>{options.map(a => <label key={a.id} className="flex items-center gap-3 border-b border-slate-200 py-3"><input type="radio" name="authorize-account" checked={selected === a.id} onChange={() => { setSelected(a.id); setError(""); }} className="accent-violet-600" /><span className="break-all">{a.name}<span className="mt-1 block text-xs text-slate-400">{a.id}</span></span></label>)}</fieldset>}
      {step === "waiting" && <p role="status" className="flex items-center gap-3 py-8"><Loader2 className="h-5 w-5 animate-spin text-violet-600" />等待授权结果</p>}
      {step === "success" && <p role="status" className="flex items-center gap-3 py-8"><CheckCircle2 className="h-6 w-6 text-emerald-600" />授权成功，账户信息已更新</p>}
      {error && <p role="alert" className="text-rose-600">{error}</p>}
    </div>
  </AdDialog>;
}
