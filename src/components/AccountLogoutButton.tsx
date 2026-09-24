import React from "react";
import { LogOut } from "lucide-react";

interface AccountLogoutButtonProps {
  onClick: () => void;
}

export default function AccountLogoutButton({ onClick }: AccountLogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-xs font-bold text-slate-600 shadow-xs transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:flex-none"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>退出登录</span>
    </button>
  );
}
