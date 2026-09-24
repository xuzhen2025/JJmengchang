import { useReportData } from "../lib/useReportData";
import ReportCategoryFilter from "./ReportCategoryFilter";
import { REPORT_START, REPORT_TODAY, financialReportRows } from "../lib/reportDemoData";
import { exportAnalyticsRows } from "../lib/analyticsExport";
import AnalyticsExportDialog from "./AnalyticsExportDialog";
import React, { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ArrowUpDown,
  HelpCircle,
  Search,
  RotateCcw,
  Check
} from "lucide-react";

interface AccountFinanceReportViewProps {
  showToast?: (title: string, desc: string) => void;
}

interface FinancialRow {
  accountName: string;
  accountId: string;
  team: string;
  group: string;
  user: string;
  cat1: string;
  cat2: string;
  totalSpend: number;
  nonGrantSpend: number;
  grantSpend: number;
  rebateSpend: number;
  sharedWalletSpend: number;
  totalDeposit: number;
  totalTransferIn: number;
  totalTransferOut: number;
  totalBalance: number;
  grantBalance: number;
  nonGrantBalance: number;
  standardSpend: number;
  globalSpend: number;
  remark: string;
}

function datesInRange(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export default function AccountFinanceReportView({ showToast }: AccountFinanceReportViewProps) {
  const report = useReportData();
  const [activePlatform, setActivePlatform] = useState<string>("巨量千川");
  const [accountQuery, setAccountQuery] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [queryDate, setQueryDate] = useState<string>(REPORT_TODAY);

  const [exportOpen, setExportOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => setCurrentPage(1), [activePlatform, accountQuery, selectedTeam, selectedGroup, selectedAccount, selectedCategory, queryDate, pageSize]);

  const matchesFilters = (r: FinancialRow) => {
    if (accountQuery) {
      const matchName = r.accountName.toLowerCase().includes(accountQuery.toLowerCase());
      const matchId = r.accountId.includes(accountQuery);
      if (!matchName && !matchId) return false;
    }
    if (selectedTeam && r.team !== selectedTeam) return false;
    if (selectedGroup && r.group !== selectedGroup) return false;
    if (selectedAccount && r.user !== selectedAccount) return false;
    if (selectedCategory && ![r.cat1, `${r.cat1} / ${r.cat2}`].includes(selectedCategory)) return false;
    return true;
  };

  // Filtered rows
  const filteredRows = financialReportRows(report.facts, activePlatform, queryDate).filter(matchesFilters);

  // Calculate Aggregates (Matching values in screenshot aggregate row)
  const sumTotalSpend = filteredRows.reduce((a, b) => a + b.totalSpend, 0);
  const sumNonGrantSpend = filteredRows.reduce((a, b) => a + b.nonGrantSpend, 0);
  const sumGrantSpend = filteredRows.reduce((a, b) => a + b.grantSpend, 0);
  const sumRebateSpend = filteredRows.reduce((a, b) => a + b.rebateSpend, 0);
  const sumSharedWalletSpend = filteredRows.reduce((a, b) => a + b.sharedWalletSpend, 0);
  const sumTotalDeposit = filteredRows.reduce((a, b) => a + b.totalDeposit, 0);
  const sumTotalTransferIn = filteredRows.reduce((a, b) => a + b.totalTransferIn, 0);
  const sumTotalTransferOut = filteredRows.reduce((a, b) => a + b.totalTransferOut, 0);
  const sumTotalBalance = filteredRows.reduce((a, b) => a + b.totalBalance, 0);
  const sumGrantBalance = filteredRows.reduce((a, b) => a + b.grantBalance, 0);
  const sumNonGrantBalance = filteredRows.reduce((a, b) => a + b.nonGrantBalance, 0);
  const sumStandardSpend = filteredRows.reduce((a, b) => a + b.standardSpend, 0);
  const sumGlobalSpend = filteredRows.reduce((a, b) => a + b.globalSpend, 0);

  const handleReset = () => {
    setAccountQuery("");
    setSelectedTeam("");
    setSelectedGroup("");
    setSelectedAccount("");
    setSelectedCategory("");
    setQueryDate(REPORT_TODAY);
    if (showToast) {
      showToast("重置成功", "已清空查询与过滤筛选条件");
    }
  };

  const handleExport = async (request: Parameters<typeof exportAnalyticsRows>[1]) => {
    const exportRows = datesInRange(request.startDate, request.endDate).flatMap(date =>
      financialReportRows(report.facts, activePlatform, date)
        .filter(matchesFilters)
        .map(row => [
          date,
          `${row.accountName} (${row.accountId})`,
          row.team,
          row.group,
          row.user,
          row.cat1,
          row.cat2,
          row.totalSpend,
          row.nonGrantSpend,
          row.grantSpend,
          row.rebateSpend,
          row.sharedWalletSpend,
          row.totalDeposit,
          row.totalTransferIn,
          row.totalTransferOut,
          row.totalBalance,
          row.grantBalance,
          row.nonGrantBalance,
          row.standardSpend,
          row.globalSpend,
          row.remark,
        ]),
    );
    const fileName = await exportAnalyticsRows([
      ["数据日期", "广告账户", "部门", "分组", "关联用户", "一级分类", "二级分类", "总消耗", "非赠款消耗", "赠款消耗", "消返红包消耗", "共享钱包消耗", "总存入", "总转入", "总转出", "总余额", "赠款金额", "非赠款金额", "标准消耗", "全域消耗", "备注"],
      ...exportRows,
    ], request, "广告账户财务报表");
    showToast?.("导出成功", `已生成【${fileName}】`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* 1. Top Platform Header Tabs (Matching Screenshot 1 & 2) */}
      <div className="flex items-center gap-8 px-6 pt-3.5 pb-0 border-b border-slate-100 bg-white">
        {["巨量千川", "巨量广告"].map((pName) => (
          <button
            key={pName}
            onClick={() => {
              setActivePlatform(pName);
              if (showToast) showToast("切换平台", `已切换至【${pName}】财务报表`);
            }}
            className={`text-sm font-bold pb-3 relative cursor-pointer transition-colors ${
              activePlatform === pName ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {pName}
            {activePlatform === pName && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 2. Filter Bar (Matching Screenshots 1, 2, 3, 4) */}
      <div className="p-4 bg-white border-b border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* 请输入账户名称/ID */}
          <input
            type="text"
            placeholder="请输入账户名称/ID"
            value={accountQuery}
            onChange={(e) => setAccountQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs min-w-[170px]"
          />

          {/* 请选择部门 */}
          <select
            value={selectedTeam}
            onChange={(e) => { setSelectedTeam(e.target.value); setSelectedGroup(""); setSelectedAccount(""); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer min-w-[150px]"
          >
            <option value="">请选择部门</option>
            {report.tree.map(t => t.teamName).map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          {/* 请选择分组 */}
          <select
            value={selectedGroup}
            onChange={(e) => { setSelectedGroup(e.target.value); setSelectedAccount(""); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer min-w-[150px]"
          >
            <option value="">请选择分组</option>
            {report.tree.filter(t => !selectedTeam || t.teamName === selectedTeam).flatMap(t => t.groups.map(g => g.groupName)).map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          {/* 请选择账号 */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer min-w-[150px]"
          >
            <option value="">请选择账号</option>
            {report.tree.filter(t => !selectedTeam || t.teamName === selectedTeam).flatMap(t => t.groups.filter(g => !selectedGroup || g.groupName === selectedGroup).flatMap(g => g.accounts)).map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          {/* 请选择分类 */}
          <ReportCategoryFilter categories={report.categories} value={selectedCategory} onChange={setSelectedCategory} />
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker Input */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={queryDate}
              onChange={(e) => { setQueryDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none w-28 cursor-pointer"
            />
          </div>

          {/* 查询 Button (Solid Purple #7C3AED) */}
          <button
            onClick={() => {
              if (!queryDate) return showToast?.("查询失败", "请选择查询日期");
              if (showToast) showToast("查询完成", `已更新【${queryDate}】的数据流水报表`);
            }}
            className="px-5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>查询</span>
          </button>

          {/* 重置 Button */}
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* 3. Section Title Bar (详细数据 & 导出 ∨) */}
      <div className="px-6 py-3 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
        <div className="text-xs font-black text-slate-800">详细数据</div>

        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setExportOpen(true)}
          className="px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
        >
          <span>导出</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* 4. Full Table with Horizontal Scrollable Matrix */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse min-w-[2200px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold text-xs whitespace-nowrap">
              {/* Sticky Left Account Column */}
              <th className="py-3.5 px-6 font-bold sticky left-0 bg-slate-50/95 z-20 shadow-xs border-r border-slate-200/50">
                广告账户
              </th>
              <th className="py-3.5 px-4 font-bold">部门</th>
              <th className="py-3.5 px-4 font-bold">分组</th>
              <th className="py-3.5 px-4 font-bold">关联用户</th>
              <th className="py-3.5 px-4 font-bold">一级分类</th>
              <th className="py-3.5 px-4 font-bold">二级分类</th>

              {/* Numerical Metrics */}
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>总消耗</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>非赠款消耗</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>赠款消耗</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>消返红包消耗</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>共享钱包消耗</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>总存入</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>总转入</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>总转出</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>总余额</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>赠款金额</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>非赠款金额</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold text-right">标准消耗</th>
              <th className="py-3.5 px-4 font-bold text-right">全域消耗</th>
              <th className="py-3.5 px-6 font-bold text-center">备注</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {/* Aggregate (总计) Row - Matches Screenshots */}
            <tr className="bg-purple-50/20 font-bold text-slate-900 whitespace-nowrap">
              <td className="py-3.5 px-6 font-black text-slate-900 sticky left-0 bg-purple-50/90 z-10 border-r border-slate-200/50">
                总计
              </td>
              <td className="py-3.5 px-4 text-slate-400">-</td>
              <td className="py-3.5 px-4 text-slate-400">-</td>
              <td className="py-3.5 px-4 text-slate-400">-</td>
              <td className="py-3.5 px-4 text-slate-400">-</td>
              <td className="py-3.5 px-4 text-slate-400">-</td>
              <td className="py-3.5 px-4 text-right font-bold text-slate-900">{sumTotalSpend.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-slate-800">{sumNonGrantSpend.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-slate-800">{sumGrantSpend.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right text-slate-700">{sumRebateSpend.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right text-slate-700">{sumSharedWalletSpend.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right text-slate-800">{sumTotalDeposit.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-purple-700">{sumTotalTransferIn.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right text-slate-700">{sumTotalTransferOut.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{sumTotalBalance.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-slate-800">{sumGrantBalance.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-slate-800">{sumNonGrantBalance.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right text-slate-700">{sumStandardSpend.toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right text-slate-700">{sumGlobalSpend.toFixed(2)}</td>
              <td className="py-3.5 px-6 text-center text-slate-400">-</td>
            </tr>

            {/* Individual Financial Account Rows */}
            {filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                {/* Account Name & ID (Sticky) */}
                <td className="py-3.5 px-6 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-200/50">
                  <div className="font-bold text-slate-800">{row.accountName}</div>
                  <div className="text-[11px] font-mono text-slate-400">{row.accountId}</div>
                </td>

                <td className="py-3.5 px-4 text-slate-900 font-medium">{row.team}</td>
                <td className="py-3.5 px-4 text-slate-900 font-medium">{row.group}</td>
                <td className="py-3.5 px-4 text-slate-900 font-medium">{row.user}</td>
                <td className="py-3.5 px-4 text-slate-900 font-medium">{row.cat1}</td>
                <td className="py-3.5 px-4 text-slate-900 font-medium">{row.cat2}</td>

                {/* Financial Metrics */}
                <td className="py-3.5 px-4 text-right font-bold text-slate-900">{row.totalSpend.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-slate-800">{row.nonGrantSpend.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-slate-800">{row.grantSpend.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-slate-600">{row.rebateSpend}</td>
                <td className="py-3.5 px-4 text-right text-slate-600">{row.sharedWalletSpend}</td>
                <td className="py-3.5 px-4 text-right text-slate-800">{row.totalDeposit.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right font-bold text-[#7C3AED]">{row.totalTransferIn.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-slate-700">{row.totalTransferOut.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{row.totalBalance.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-slate-800">{row.grantBalance.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-800">{row.nonGrantBalance.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-slate-600">{row.standardSpend}</td>
                <td className="py-3.5 px-4 text-right text-slate-800">{row.globalSpend.toFixed(2)}</td>
                <td className="py-3.5 px-6 text-center text-slate-400">{row.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Horizontal Scroll Bar Accent Line */}
      <div className="h-1.5 bg-slate-200/80 mx-4 rounded-full my-2" />

      {/* 5. Pagination Bar (Matching Screenshots) */}
      <div className="flex flex-wrap items-center justify-end gap-4 px-6 py-3.5 bg-white border-t border-slate-100 text-xs text-slate-500">
        <div>共 {filteredRows.length} 条</div>

        {/* Page Size Select */}
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
        >
          <option value={10}>10条/页</option>
          <option value={20}>20条/页</option>
          <option value={50}>50条/页</option>
          <option value={100}>100条/页</option>
        </select>

        {/* Page Switch Buttons */}
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-bold cursor-pointer"
          >
            &lt;
          </button>
          <button className="px-3 py-1 bg-[#7C3AED] text-white font-bold rounded-lg cursor-pointer">{currentPage}</button>
          <button
            disabled={currentPage * pageSize >= filteredRows.length} onClick={() => setCurrentPage(p => p + 1)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-bold cursor-pointer"
          >
            &gt;
          </button>
        </div>

        {/* Page Input */}
        <div className="flex items-center gap-1.5">
          <span>前往</span>
          <input
            type="text"
            defaultValue="1"
            className="w-10 px-2 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-purple-500"
          />
          <span>页</span>
        </div>
      </div>
      <AnalyticsExportDialog
        open={exportOpen}
        pageName="广告账户财务报表"
        filters={[
          { label: "平台", value: activePlatform },
          { label: "账户", value: accountQuery },
          { label: "部门", value: selectedTeam },
          { label: "分组", value: selectedGroup },
          { label: "用户", value: selectedAccount },
          { label: "分类", value: selectedCategory },
        ]}
        startDate={REPORT_START}
        endDate={queryDate}
        onClose={() => setExportOpen(false)}
        onConfirm={handleExport}
      />
    </div>
  );
}
