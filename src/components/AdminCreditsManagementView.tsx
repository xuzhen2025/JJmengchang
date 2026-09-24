import React, { useState } from "react";
import { 
  Sparkles, 
  Coins, 
  Gift, 
  Wallet, 
  HelpCircle, 
  Plus, 
  CheckCircle2, 
  X, 
  Copy, 
  Edit3, 
  Trash2, 
  QrCode, 
  Check, 
  Building2, 
  Phone, 
  Mail, 
  ChevronLeft, 
  SlidersHorizontal, 
  ShieldCheck
} from "lucide-react";
import { DeptNode, AccountMember, INITIAL_DEPTS, INITIAL_MEMBERS } from "../data/adminAccounts";
import CreditConsumptionDetails from "./CreditConsumptionDetails";
import OverlayPortal from "./overlays/OverlayPortal";
import { createCreditExamples, creditMemberOrganization, localCreditTime, netCreditConsumption, roundCredits, type CreditRecord } from "../lib/creditConsumption";
import { readCreditQuotaSettings, saveCreditQuotaSettings, type CreditQuotaRule } from "../lib/creditQuota";
import { operationUser } from "../lib/operationHistory";

interface RechargeTier {
  title: string;
  creditsNum: number;
  creditsDisplay: string;
  baseCredits: number;
  bonusCredits: number;
  price: number;
  originalPrice: number;
  savePrice: number;
  badge: string;
  includesText: string;
  bonusValue: number;
}

const RECHARGE_TIERS: RechargeTier[] = [
  {
    title: "体验试用",
    creditsNum: 300,
    creditsDisplay: "300",
    baseCredits: 300,
    bonusCredits: 0,
    price: 30,
    originalPrice: 50,
    savePrice: 20,
    badge: "入门推荐",
    includesText: "约可生成 15 条高清AI视频",
    bonusValue: 0
  },
  {
    title: "基础创作",
    creditsNum: 1100,
    creditsDisplay: "1,100",
    baseCredits: 1000,
    bonusCredits: 100,
    price: 100,
    originalPrice: 150,
    savePrice: 50,
    badge: "加赠 10%",
    includesText: "约可生成 55 条高清AI视频",
    bonusValue: 10
  },
  {
    title: "进阶爆款",
    creditsNum: 6000,
    creditsDisplay: "6,000",
    baseCredits: 5000,
    bonusCredits: 1000,
    price: 500,
    originalPrice: 750,
    savePrice: 250,
    badge: "加赠 20%",
    includesText: "约可生成 300 条高清AI视频",
    bonusValue: 100
  },
  {
    title: "创意尊享",
    creditsNum: 13000,
    creditsDisplay: "13,000",
    baseCredits: 10000,
    bonusCredits: 3000,
    price: 1000,
    originalPrice: 1600,
    savePrice: 600,
    badge: "加赠 30%",
    includesText: "约可生成 650 条高清AI视频",
    bonusValue: 300
  }
];

export default function AdminCreditsManagementView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // --- Credits / Points Management State ---
  const [creditMode] = useState<"quota" | "wallet">("quota");
  const [creditsSubTab, setCreditsSubTab] = useState<"config" | "details">("config");
  const [initialQuota] = useState(readCreditQuotaSettings);

  // Global quota config state
  const [globalDailyLimit, setGlobalDailyLimit] = useState(initialQuota.globalDailyLimit);
  const [globalMonthlyLimit, setGlobalMonthlyLimit] = useState(initialQuota.globalMonthlyLimit);

  // Custom credit config state
  const [customConfigs, setCustomConfigs] = useState<CreditQuotaRule[]>(initialQuota.customConfigs);

  // Custom credit config filters
  const [customFilterName, setCustomFilterName] = useState("");
  const [customFilterUser, setCustomFilterUser] = useState("all");
  const [customFilterStatus, setCustomFilterStatus] = useState("all");

  // Custom credit config modal state
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingCustomConfig, setEditingCustomConfig] = useState<CreditQuotaRule | null>(null);
  const [customForm, setCustomForm] = useState({
    name: "",
    applicableUser: "梁靖淇",
    dailyLimit: "",
    monthlyLimit: "",
    enabled: true
  });

  // Recharge Modal state
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeTierIndex, setRechargeTierIndex] = useState(3); // default 创意尊享
  const [corporateModalOpen, setCorporateModalOpen] = useState(false);

  // Members & Departments from localstorage or initial mock
  const [members] = useState<AccountMember[]>(() => {
    const saved = localStorage.getItem("cloud_video_members");
    if (!saved) return INITIAL_MEMBERS;
    try { return JSON.parse(saved); } catch { return INITIAL_MEMBERS; }
  });

  const [depts] = useState<DeptNode[]>(() => {
    const saved = localStorage.getItem("cloud_video_depts");
    if (!saved) return INITIAL_DEPTS;
    try { return JSON.parse(saved); } catch { return INITIAL_DEPTS; }
  });

  const [transactionLogs, setTransactionLogs] = useState<CreditRecord[]>(() => createCreditExamples(members, depts));
  const normalRecharge = roundCredits(transactionLogs.filter(row => row.type === "普通充值").reduce((sum, row) => sum + row.amount, 0));
  const giftRecharge = roundCredits(transactionLogs.filter(row => row.type === "赠送充值").reduce((sum, row) => sum + row.amount, 0));
  const actualSpend = netCreditConsumption(transactionLogs);
  const remainingCredits = roundCredits(normalRecharge + giftRecharge - actualSpend);

  // Credit Handlers
  const handleSaveGlobalQuota = () => {
    if ([globalDailyLimit, globalMonthlyLimit].some(value => value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0)) {
      showToast("⚠️ 日上限和月上限必须为大于等于 0 的数字");
      return;
    }
    saveCreditQuotaSettings({ globalDailyLimit, globalMonthlyLimit, customConfigs });
    showToast("✅ 全局积分每日/每月额度限制保存成功！");
  };

  const handleOpenCustomModal = (item?: CreditQuotaRule) => {
    if (item) {
      setEditingCustomConfig(item);
      setCustomForm({
        name: item.name,
        applicableUser: item.applicableUser,
        dailyLimit: item.dailyLimit,
        monthlyLimit: item.monthlyLimit,
        enabled: item.enabled
      });
    } else {
      setEditingCustomConfig(null);
      setCustomForm({
        name: "",
        applicableUser: members[0]?.name || "梁靖淇",
        dailyLimit: "",
        monthlyLimit: "",
        enabled: true
      });
    }
    setCustomModalOpen(true);
  };

  const handleSaveCustomConfig = () => {
    if (!customForm.name.trim()) {
      showToast("⚠️ 请输入配置名称");
      return;
    }
    if (editingCustomConfig) {
      setCustomConfigs(prev => {
        const next = prev.map(c => c.id === editingCustomConfig.id ? {
          ...c,
          name: customForm.name.trim(),
          applicableUser: customForm.applicableUser,
          dailyLimit: customForm.dailyLimit,
          monthlyLimit: customForm.monthlyLimit,
          enabled: customForm.enabled
        } : c);
        saveCreditQuotaSettings({ globalDailyLimit, globalMonthlyLimit, customConfigs: next });
        return next;
      });
      showToast("✅ 已成功更新个性化积分限制");
    } else {
      const newConfig: CreditQuotaRule = {
        id: `cc_${Date.now()}`,
        name: customForm.name.trim(),
        applicableUser: customForm.applicableUser,
        dailyLimit: customForm.dailyLimit,
        monthlyLimit: customForm.monthlyLimit,
        creator: "系统管理员",
        enabled: customForm.enabled,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setCustomConfigs(prev => {
        const next = [newConfig, ...prev];
        saveCreditQuotaSettings({ globalDailyLimit, globalMonthlyLimit, customConfigs: next });
        return next;
      });
      showToast("✅ 已成功新增个性化积分限制");
    }
    setCustomModalOpen(false);
  };

  const handleDeleteCustomConfig = (id: string) => {
    if (confirm("确定要删除该个性化积分限制规则吗？")) {
      setCustomConfigs(prev => {
        const next = prev.filter(c => c.id !== id);
        saveCreditQuotaSettings({ globalDailyLimit, globalMonthlyLimit, customConfigs: next });
        return next;
      });
      showToast("🗑️ 已删除个性化配置");
    }
  };

  const handleToggleCustomConfig = (id: string) => {
    setCustomConfigs(prev => {
      const next = prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c);
      saveCreditQuotaSettings({ globalDailyLimit, globalMonthlyLimit, customConfigs: next });
      return next;
    });
    showToast("⚡ 配置规则启用状态已更新");
  };

  const handleSimulatePayment = () => {
    const tier = RECHARGE_TIERS[rechargeTierIndex];
    const username = operationUser();
    const operator = members.find(member => [member.id, member.name, member.employeeNo, member.phone, member.boundAccount].includes(username))
      ?? (["guanliyuan", "chaojiguanliyuan"].includes(username) ? members.find(member => member.name === "徐振") : undefined);
    const base = {
      userId: operator?.id ?? (username || "company"),
      userName: operator?.name ?? (username || "企业账户"),
      ...(operator ? creditMemberOrganization(operator, depts) : { group: "-", team: "-" }),
      time: localCreditTime(),
    };
    const paymentRecords: CreditRecord[] = [{ ...base, id: crypto.randomUUID(), type: "普通充值", amount: tier.baseCredits }];
    if (tier.bonusCredits) paymentRecords.push({ ...base, id: crypto.randomUUID(), type: "赠送充值", amount: tier.bonusCredits });
    setTransactionLogs(prev => [...paymentRecords, ...prev]);
    showToast(`🎉 充值成功！企业已到账 ${tier.creditsDisplay} 积分`);
    setRechargeModalOpen(false);
  };

  const filteredCustomConfigs = customConfigs.filter(c => {
    if (customFilterName.trim() && !c.name.toLowerCase().includes(customFilterName.toLowerCase())) return false;
    if (customFilterUser !== "all" && c.applicableUser !== customFilterUser) return false;
    if (customFilterStatus !== "all") {
      const isEn = customFilterStatus === "enabled";
      if (c.enabled !== isEn) return false;
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 font-sans relative overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <OverlayPortal layer="toast" role="status" className="fixed top-5 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)] bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </OverlayPortal>
      )}

      {/* Top Header */}
      <div className="p-5 pb-0 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-sm shrink-0">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>积分管理 (Credits & Quota)</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 rounded-full">
                    {creditMode === "quota" ? "配额模式" : "钱包模式"}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">全公司统一积分充值、每日上限设置与消费消耗精细化审计</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRechargeModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>积分充值 &gt;</span>
              </button>
            </div>
          </div>

          {/* Top 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 border border-purple-100 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-sm shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-0.5">剩余总积分</div>
                <div className="text-2xl font-black text-purple-700 tracking-tight">
                  {remainingCredits.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-0.5">普通充值累计</div>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {normalRecharge.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-0.5">活动赠送累计</div>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {giftRecharge.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-0.5 flex items-center gap-1">
                  <span>全员实际总消耗</span>
                  <span title="全员在视频渲染、爆款复刻、AI分镜等创作中消耗的实际积分">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {actualSpend.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-6">
        {/* Navigation Sub-Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-3">
          <div className="flex items-center gap-6 text-sm font-extrabold">
            <button
              type="button"
              onClick={() => setCreditsSubTab("config")}
              className={`pb-2 relative transition-colors cursor-pointer ${
                creditsSubTab === "config" ? "text-purple-600 font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>积分配置</span>
              {creditsSubTab === "config" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setCreditsSubTab("details")}
              className={`pb-2 relative transition-colors cursor-pointer ${
                creditsSubTab === "details" ? "text-purple-600 font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>积分明细</span>
              {creditsSubTab === "details" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          </div>

        </div>

        {/* SUB-VIEW 1: 积分配置 */}
        {creditsSubTab === "config" && (
          <div className="space-y-6 animate-fade-in">
            {/* 全局配置 Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                    <span>全局积分额度限制配置</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    适用于全员账号的默认每日与每月积分使用上限，设置为 0 表示不限制
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveGlobalQuota}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  保存全局配置
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    全员每日生成消耗限制 (积分/天)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={globalDailyLimit}
                      onChange={(e) => setGlobalDailyLimit(e.target.value)}
                      placeholder="如: 300 (0表示不限)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      积分/天
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    全员每月生成消耗限制 (积分/月)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={globalMonthlyLimit}
                      onChange={(e) => setGlobalMonthlyLimit(e.target.value)}
                      placeholder="如: 10000 (0表示不限)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      积分/月
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 个性化配置 Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>特定人员个性化配额规则</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    可为特定高频剪辑师或部门负责人配置更高的每日/每月额度，优先于全局限制
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCustomModal()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增特殊限制</span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <input
                    type="text"
                    value={customFilterName}
                    onChange={(e) => setCustomFilterName(e.target.value)}
                    placeholder="按配置名称搜索..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <select
                    value={customFilterUser}
                    onChange={(e) => setCustomFilterUser(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">全部适用对象</option>
                    {members.map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.roleName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={customFilterStatus}
                    onChange={(e) => setCustomFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">全部启用状态</option>
                    <option value="enabled">已启用</option>
                    <option value="disabled">已停用</option>
                  </select>
                </div>
              </div>

              {/* Custom Configs Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-3.5">配置名称</th>
                      <th className="p-3.5">适用人员对象</th>
                      <th className="p-3.5">每日限制 (积分)</th>
                      <th className="p-3.5">每月限制 (积分)</th>
                      <th className="p-3.5">创建者</th>
                      <th className="p-3.5">创建时间</th>
                      <th className="p-3.5">状态</th>
                      <th className="p-3.5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredCustomConfigs.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                        <td className="p-3.5">
                          <span className="bg-purple-50 text-purple-900 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                            {c.applicableUser}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {c.dailyLimit && c.dailyLimit !== "0" ? `${c.dailyLimit} 积分/天` : "不设置上限"}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {c.monthlyLimit && c.monthlyLimit !== "0" ? `${c.monthlyLimit} 积分/月` : "不设置上限"}
                        </td>
                        <td className="p-3.5 text-slate-600">{c.creator}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">{c.createdAt}</td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCustomConfig(c.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors ${
                              c.enabled
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {c.enabled ? "已启用" : "已停用"}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenCustomModal(c)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="编辑配置"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomConfig(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="删除配置"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredCustomConfigs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          未找到符合条件的个性化积分规则
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: 积分明细 */}
        {creditsSubTab === "details" && (
          <CreditConsumptionDetails members={members} depts={depts} records={transactionLogs} showToast={showToast} />
        )}
      </div>

      {/* ================= MODAL: 积分充值 ================= */}
      {rechargeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-black tracking-tight">全公司统一积分充值</h3>
              </div>
              <button
                onClick={() => setRechargeModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-xl cursor-pointer text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="md:col-span-8 p-6 space-y-6">
                <div className="text-sm font-extrabold text-slate-900">请选择适合企业的充值方案</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {RECHARGE_TIERS.map((tier, idx) => {
                    const isSelected = rechargeTierIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setRechargeTierIndex(idx)}
                        className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between h-48 ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/40 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/20"
                            : "border-slate-200 hover:border-purple-300 bg-white hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full shadow-2xs">
                            {tier.badge}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-black text-slate-800">{tier.title}</div>
                          <div className="text-lg font-black text-purple-700 mt-2">
                            {tier.creditsDisplay} <span className="text-[10px] font-bold text-slate-500">积分</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {tier.includesText}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-slate-900">¥ {tier.price}</span>
                            <span className="text-[10px] text-slate-400 line-through">¥{tier.originalPrice}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            立省 ¥{tier.savePrice}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute bottom-0 right-0 bg-purple-600 text-white p-1 rounded-tl-xl rounded-br-xl">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span>企业大额充值推荐：对公转账</span>
                      <span className="px-1.5 py-0.2 bg-purple-600 text-white text-[9px] rounded font-bold">推荐</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed max-w-xl">
                      对公充值 5000元 起充，单次充值 5万元 以上尊享 20% 最高加赠比例，支持开具增值税专用发票。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCorporateModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    获取对公账户
                  </button>
                </div>
              </div>

              <div className="md:col-span-4 p-6 bg-slate-50/50 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-sm font-extrabold text-slate-900">购买方案</div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{RECHARGE_TIERS[rechargeTierIndex].baseCredits.toLocaleString()} 积分</span>
                      <span className="font-extrabold text-slate-900">¥ {RECHARGE_TIERS[rechargeTierIndex].price}</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-700 font-medium">
                      <span>活动赠送 {RECHARGE_TIERS[rechargeTierIndex].bonusCredits.toLocaleString()} 积分</span>
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-purple-700">¥ 0</span>
                        <span className="text-[10px] text-slate-400 line-through">¥{RECHARGE_TIERS[rechargeTierIndex].bonusValue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 text-center space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>支付宝扫码支付</span>
                    </div>

                    <div className="w-36 h-36 mx-auto bg-slate-900 p-2.5 rounded-2xl shadow-inner flex items-center justify-center relative group">
                      <div className="w-full h-full bg-white rounded-xl p-2 flex flex-col justify-between items-center relative overflow-hidden">
                        <div className="grid grid-cols-5 gap-1 w-full h-full">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className={`rounded-[2px] ${i % 2 === 0 || i % 3 === 0 ? "bg-slate-900" : "bg-purple-100"}`} />
                          ))}
                        </div>
                        <div className="absolute inset-0 bg-purple-600/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-purple-600 bg-white p-1 rounded-lg shadow-sm" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xl font-black text-slate-900">
                        ¥ {RECHARGE_TIERS[rechargeTierIndex].price}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-extrabold mt-0.5">
                        已优惠 ¥{RECHARGE_TIERS[rechargeTierIndex].savePrice}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>模拟扫码支付完成</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 对公转账流程 ================= */}
      {corporateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden text-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-400">积分充值</span>
                <span className="text-slate-300">&gt;</span>
                <button
                  onClick={() => setCorporateModalOpen(false)}
                  className="text-purple-600 hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>对公转账流程</span>
                </button>
              </div>
              <button
                onClick={() => setCorporateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-200/60">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-black">1</span>
                    <span>第一步：对公汇款</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex"><span className="w-20 text-slate-400 shrink-0">账户名称：</span><span className="font-bold text-slate-900">厦门致上信息科技有限公司</span></div>
                    <div className="flex"><span className="w-20 text-slate-400 shrink-0">开户银行：</span><span className="font-medium text-slate-800">中国建设银行股份有限公司厦门滨东支行</span></div>
                    <div className="flex"><span className="w-20 text-slate-400 shrink-0">银行账号：</span><span className="font-mono font-bold text-purple-700">35101510001052510799</span></div>
                    <div className="flex"><span className="w-20 text-slate-400 shrink-0">汇款金额：</span><span className="font-bold text-emerald-600">¥5,000起充</span></div>
                    <div className="flex"><span className="w-20 text-slate-400 shrink-0">汇款备注：</span><span className="text-slate-600">公司名称+积分充值</span></div>
                    <div className="flex"><span className="w-20 text-slate-400 shrink-0">联行号：</span><span className="font-mono text-slate-700">105393000499</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("账户名称：厦门致上信息科技有限公司\n开户银行：中国建设银行股份有限公司厦门滨东支行\n银行账号：35101510001052510799\n联行号：105393000499");
                      showToast("📋 已复制对公账户全套信息至剪贴板");
                    }}
                    className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>一键复制对公账户信息</span>
                  </button>
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-200/60">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-black">2</span>
                      <span>第二步：联系客服，完成积分充值</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      转账完成后，请提供订单号/银行盖章回执单，联系云视频管家客服。我们会尽快为您完成充值~
                    </p>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <Phone className="w-4 h-4 text-purple-600" />
                        <span>客服专线：400-880-9988</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <Mail className="w-4 h-4 text-purple-600" />
                        <span>企业邮箱：vip@cloudvideo.com</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast("💬 已发起专属客服对话框，客服离线留言将在10分钟内响应");
                    }}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>联系专属客服充值</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOM LIMIT CONFIG ================= */}
      {customModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-800 animate-fade-in">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-sm font-black flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>{editingCustomConfig ? "编辑特殊积分限制" : "新增特定人员限制规则"}</span>
              </span>
              <button onClick={() => setCustomModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">配置名称 *</label>
                <input
                  type="text"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  placeholder="如: VIP高配额限制"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">适用人员对象 *</label>
                <select
                  value={customForm.applicableUser}
                  onChange={(e) => setCustomForm({ ...customForm, applicableUser: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer focus:outline-none focus:border-purple-500"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.roleName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">每日限制 (积分/天)</label>
                  <input
                    type="number"
                    value={customForm.dailyLimit}
                    onChange={(e) => setCustomForm({ ...customForm, dailyLimit: e.target.value })}
                    placeholder="0 表示不限"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">每月限制 (积分/月)</label>
                  <input
                    type="number"
                    value={customForm.monthlyLimit}
                    onChange={(e) => setCustomForm({ ...customForm, monthlyLimit: e.target.value })}
                    placeholder="0 表示不限"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-custom-enabled"
                  checked={customForm.enabled}
                  onChange={(e) => setCustomForm({ ...customForm, enabled: e.target.checked })}
                  className="accent-purple-600 rounded"
                />
                <label htmlFor="chk-custom-enabled" className="font-bold text-slate-700 cursor-pointer">立即启用该个性化规则</label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomConfig}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
