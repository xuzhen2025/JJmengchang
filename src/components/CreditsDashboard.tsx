import React, { useState } from "react";
import { 
  User, 
  Coins, 
  Filter, 
  Key, 
  Sparkles,
  FolderOpen,
  Tags
} from "lucide-react";
import { Asset, CreditTransaction } from "../types";
import PersonalResourceCenter from "./PersonalResourceCenterV2";
import ChangePasswordModal from "./ChangePasswordModal";
import PersonalInformationPanel from "./PersonalInformationPanel";
import AccountLogoutButton from "./AccountLogoutButton";

interface CreditsDashboardProps {
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  dailyAvailable: number;
  transactions: CreditTransaction[];
  assets: Asset[];
  onLogout: () => void;
}

export default function CreditsDashboard({
  dailyLimit,
  monthlyLimit,
  dailyUsed,
  monthlyUsed,
  dailyAvailable,
  transactions,
  assets,
  onLogout
}: CreditsDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "resources" | "personal_tags" | "history">("profile");

  // Filters for Billing History
  const [typeFilter, setTypeFilter] = useState<"all" | "consume" | "recharge" | "refund">("all");
  const [toolFilter, setToolFilter] = useState<string>("all");

  // Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const dailyProgress = dailyLimit > 0 ? Math.min(100, dailyUsed / dailyLimit * 100) : 0;
  const monthlyProgress = monthlyLimit > 0 ? Math.min(100, monthlyUsed / monthlyLimit * 100) : 0;
  const monthlyRemaining = monthlyLimit > 0 ? Math.max(0, monthlyLimit - monthlyUsed) : 0;
  const formatCredits = (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    const typeMatch = typeFilter === "all" || tx.type === typeFilter;
    const toolMatch = toolFilter === "all" || tx.tool === toolFilter;
    return typeMatch && toolMatch;
  });

  const toolsList = ["Agent创作", "AI视频原料", "水印擦除", "字幕擦除", "画质增强", "爆款复刻", "系统赠送"];

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto font-sans relative">
      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-none space-y-6">
        {/* Header Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              个人中心
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              查看个人基础资料、所属部门架构、可用算力积分与明细账单
            </p>
          </div>
          
          {/* Nav Tabs */}
          <div className="flex w-full flex-wrap bg-slate-100 border border-slate-200 p-1 rounded-lg lg:w-auto lg:shrink-0">
            {([
              ["profile", "个人信息", User],
              ["resources", "我的资源", FolderOpen],
              ["personal_tags", "个人标签", Tags],
              ["history", "明细账单", Coins]
            ] as const).map(([value, label, Icon]) => (
              <button key={value} onClick={() => setActiveSubTab(value)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeSubTab === value ? "bg-purple-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                <Icon className="w-3.5 h-3.5" /><span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Balance Overview Cards: only shown with personal information. */}
        {activeSubTab === "profile" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section data-testid="daily-credit-limit" className="relative overflow-hidden rounded-xl bg-violet-700 p-5 text-white shadow-md">
              <Coins className="pointer-events-none absolute right-3 top-2 h-20 w-20 text-white opacity-10" />
              <div className="relative flex items-center justify-between gap-3">
                <p className="text-sm font-bold">本日上限</p>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">每日额度</span>
              </div>
              <p className="relative mt-2 font-mono text-3xl font-black">{dailyLimit > 0 ? formatCredits(dailyLimit) : "不限"}</p>
              <div className="relative mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] text-violet-100">
                  <span>已用 {formatCredits(dailyUsed)} / {dailyLimit > 0 ? formatCredits(dailyLimit) : "不限"}</span>
                  <span>{dailyLimit > 0 ? `${dailyProgress.toFixed(0)}%` : "不限"}</span>
                </div>
                <div role="progressbar" aria-label="本日积分使用进度" aria-valuemin={0} aria-valuemax={dailyLimit || undefined} aria-valuenow={Math.min(dailyUsed, dailyLimit || dailyUsed)} className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${dailyProgress}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold text-white">本日可用积分：{formatCredits(dailyAvailable)}</p>
              </div>
            </section>

            <section data-testid="monthly-credit-limit" className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-800">本月上限</p>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">每月额度</span>
              </div>
              <p className="mt-2 font-mono text-3xl font-black text-slate-900">{monthlyLimit > 0 ? formatCredits(monthlyLimit) : "不限"}</p>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>已用 {formatCredits(monthlyUsed)} / {monthlyLimit > 0 ? formatCredits(monthlyLimit) : "不限"}</span>
                  <span>{monthlyLimit > 0 ? `${monthlyProgress.toFixed(0)}%` : "不限"}</span>
                </div>
                <div role="progressbar" aria-label="本月积分使用进度" aria-valuemin={0} aria-valuemax={monthlyLimit || undefined} aria-valuenow={Math.min(monthlyUsed, monthlyLimit || monthlyUsed)} className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-violet-600 transition-[width]" style={{ width: `${monthlyProgress}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-700">本月剩余积分：{monthlyLimit > 0 ? formatCredits(monthlyRemaining) : "不限"}</p>
              </div>
            </section>
          </div>
        )}

        {(activeSubTab === "resources" || activeSubTab === "personal_tags") && (
          <PersonalResourceCenter mode={activeSubTab} assets={assets} onToast={showToast} />
        )}

        {/* TAB 1: 个人信息 (PROFILE TAB) */}
        {activeSubTab === "profile" && (
          <PersonalInformationPanel
            name="徐振"
            role="剪辑师"
            employeeId="ZS-008"
            phone="138****8888"
            email="xuzhen@dreamchang.com"
            recentLogin="最近登录: 2026-08-05 23:20 (IP: 110.88.24.18 - 本地局域网)"
            company="梦畅AIGC"
            companyLevel="1级公司 (HQ-001)"
            parentNode="最高公司节点 (无上级)"
            structureType="公司 > 部门 > 分组 > 人员"
            hierarchySummary="电商投放一部 (女装千川放量组、美妆珠宝爆款组)、品牌效果投放部、AIGC爆款内容拆解部 (千川剧本拆解小组)、视频智能剪辑中心"
            actions={(
              <>
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>修改密码</span>
                  </button>
                  <AccountLogoutButton onClick={onLogout} />
              </>
            )}
          />
        )}

        {/* TAB 2: 明细账单 (BILLING HISTORY TAB) */}
        {activeSubTab === "history" && (
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>账单类型:</span>
                </div>
                <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                  {(["all", "consume", "recharge", "refund"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        typeFilter === t
                          ? "bg-white text-slate-700 shadow-xs border border-slate-100"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {t === "all" ? "全部" : t === "consume" ? "消费" : t === "recharge" ? "充值" : "退款"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">功能归属:</span>
                <select
                  value={toolFilter}
                  onChange={(e) => setToolFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-1.5 text-slate-600 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="all">全部工具</option>
                  {toolsList.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="p-4">时间 / 流水号</th>
                      <th className="p-4">工具项目</th>
                      <th className="p-4">明细说明</th>
                      <th className="p-4 text-right">变化额度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                          没有符合过滤条件的账单明细
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-semibold text-slate-700 font-mono">{tx.time}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.id}</p>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 text-[10px]">
                              {tx.tool}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 max-w-xs truncate">
                            {tx.remark}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-bold font-mono text-sm ${
                              tx.type === "recharge" || tx.type === "refund"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: 修改密码 ================= */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => showToast("密码修改成功，请妥善保管您的新登录密码。")}
      />
    </div>
  );
}
