import React, { useState } from "react";
import { AlertTriangle, Key, Lock, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    setError("");
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    onClose();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.oldPassword) {
      setError("请输入当前原密码");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("新密码长度不能少于 6 位");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    close();
    onSuccess();
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-none";

  return (
    <OverlayPortal layer="modal" className="fixed inset-0 flex items-center justify-center bg-slate-950/70 p-4 font-sans backdrop-blur-xs" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between bg-slate-900 p-4 text-white">
          <span className="flex items-center gap-2 text-sm font-black"><Key className="h-4 w-4 text-amber-400" />修改个人登录密码</span>
          <button type="button" onClick={close} className="cursor-pointer rounded-xl p-1 hover:bg-slate-800" title="关闭"><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6 text-xs">
          {error && <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-bold text-rose-700"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

          <label className="block"><span className="mb-1 block font-bold text-slate-700">当前原密码 <span className="text-rose-500">*</span></span><input type="password" required value={form.oldPassword} onChange={(event) => setForm({ ...form, oldPassword: event.target.value })} placeholder="请输入您当前的登录密码" className={inputClass} /></label>
          <label className="block"><span className="mb-1 block font-bold text-slate-700">设置新密码 <span className="text-rose-500">*</span></span><input type="password" required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} placeholder="请输入至少 6 位的新密码" className={inputClass} /></label>
          <label className="block"><span className="mb-1 block font-bold text-slate-700">确认新密码 <span className="text-rose-500">*</span></span><input type="password" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="请再次输入新密码" className={inputClass} /></label>

          <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[10px] text-slate-400">
            <p>• 密码需包含字母或数字，建议长度不少于 8 位。</p>
            <p>• 修改成功后，您的全端登录状态将被安全更新。</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={close} className="cursor-pointer px-4 py-2 font-bold text-slate-500 hover:text-slate-800">取消</button>
            <button type="submit" className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 font-bold text-white shadow-xs hover:bg-slate-800"><Lock className="h-4 w-4 text-amber-400" />更新修改密码</button>
          </div>
        </form>
      </div>
    </OverlayPortal>
  );
}
