import React from "react";
import { LogOut, X } from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";

interface LogoutConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmDialog({ open, onCancel, onConfirm }: LogoutConfirmDialogProps) {
  if (!open) return null;

  return (
    <OverlayPortal layer="dialog" className="fixed inset-0 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600">
              <LogOut className="h-4 w-4" />
            </span>
            <h2 id="logout-title" className="text-sm font-bold text-slate-900">退出登录</h2>
          </div>
          <button type="button" onClick={onCancel} title="关闭" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 text-sm text-slate-600">确认退出当前账号？</div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">取消</button>
          <button type="button" onClick={onConfirm} className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">确认退出</button>
        </div>
      </div>
    </OverlayPortal>
  );
}
