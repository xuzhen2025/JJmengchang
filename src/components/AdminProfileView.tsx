import React, { useState } from "react";
import { Key, Sparkles, User } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";
import PersonalInformationPanel from "./PersonalInformationPanel";
import AccountLogoutButton from "./AccountLogoutButton";

interface AdminProfileViewProps {
  onLogout: () => void;
}

export default function AdminProfileView({ onLogout }: AdminProfileViewProps) {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative flex-1 overflow-y-auto bg-slate-50 p-6 font-sans">
      {toastMessage && (
        <div className="fixed right-5 top-5 z-[120] flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-none space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800">
              <User className="h-5 w-5 text-purple-600" />
              个人中心
            </h1>
            <p className="mt-1 text-xs text-slate-400">查看个人基础资料与所属部门架构</p>
          </div>

          <div className="flex w-full flex-wrap rounded-lg border border-slate-200 bg-slate-100 p-1 lg:w-auto lg:shrink-0">
            <button type="button" className="flex cursor-pointer items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs">
              <User className="h-3.5 w-3.5" />
              <span>个人信息</span>
            </button>
          </div>
        </div>

        <PersonalInformationPanel
          name="徐振"
          role="超级管理员"
          employeeId="ZS-001"
          phone="138****0000"
          email="xuzhen@dreamchang.com"
          recentLogin="最近登录: 2026-08-21 09:08 (IP: 110.88.24.18 - 本地局域网)"
          company="梦畅AIGC"
          companyLevel="1级公司 (HQ-001)"
          parentNode="最高公司节点 (无上级)"
          structureType="公司 > 部门 > 分组 > 人员"
          hierarchySummary="电商投放一部、品牌效果投放部、AIGC爆款内容拆解部、视频智能剪辑中心、平台运营与系统管理组"
          actions={(
            <>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-center text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 sm:flex-none"
              >
                <Key className="h-3.5 w-3.5 text-amber-400" />
                <span>修改密码</span>
              </button>
              <AccountLogoutButton onClick={onLogout} />
            </>
          )}
        />
      </div>

      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => showToast("密码修改成功，请妥善保管您的新登录密码。")}
      />
    </div>
  );
}
