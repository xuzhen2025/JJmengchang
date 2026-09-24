import React, { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Loader2 } from "lucide-react";
import type { AccountMember, DeptNode } from "../data/adminAccounts";
import { recordExport, startFileDownload } from "../lib/operationHistory";
import {
  CREDIT_RECORD_TYPES, EMPTY_CREDIT_FILTERS, creditMemberOrganization,
  filterCreditRecords, localCreditTime, summarizeCreditConsumption,
  type CreditFilters, type CreditRecord, type CreditRecordType,
} from "../lib/creditConsumption";

type View = "summary" | "details";
interface Props {
  members: AccountMember[];
  depts: DeptNode[];
  records: CreditRecord[];
  showToast: (message: string) => void;
}
const numberText = (value: number) => value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
const tabClass = (active: boolean) => `shrink-0 border-b-2 px-1 pb-3 text-sm font-bold transition-colors ${active ? "border-purple-600 text-purple-600" : "border-transparent text-slate-600 hover:text-purple-600"}`;
const inputClass = "min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-purple-500";

export default function CreditConsumptionDetails({ members, depts, records, showToast }: Props) {
  const [view, setView] = useState<View>("summary");
  const [drafts, setDrafts] = useState<Record<View, CreditFilters>>({ summary: { ...EMPTY_CREDIT_FILTERS }, details: { ...EMPTY_CREDIT_FILTERS } });
  const [applied, setApplied] = useState(drafts);
  const [errors, setErrors] = useState<Record<View, string>>({ summary: "", details: "" });
  const [type, setType] = useState<CreditRecordType | "全部">("全部");
  const [sort, setSort] = useState<"asc" | "desc" | null>(null);
  const [exporting, setExporting] = useState(false);
  const summaries = summarizeCreditConsumption(members, depts, records, applied.summary);
  if (sort) summaries.sort((a, b) => sort === "asc" ? a.total - b.total : b.total - a.total);
  const details = filterCreditRecords(records, applied.details, type);
  const hasRows = (view === "summary" ? summaries : details).length > 0;
  const draft = drafts[view];
  const setFilter = (key: keyof CreditFilters, value: string) => {
    setDrafts(prev => ({ ...prev, [view]: { ...prev[view], [key]: value } }));
    setErrors(prev => ({ ...prev, [view]: "" }));
  };
  const query = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setErrors(prev => ({ ...prev, [view]: "开始日期不能晚于结束日期" }));
      return;
    }
    setErrors(prev => ({ ...prev, [view]: "" }));
    setApplied(prev => ({ ...prev, [view]: { ...draft } }));
  };
  const openMemberDetails = (userId: string) => {
    const filters = { ...applied.summary, userId };
    setDrafts(prev => ({ ...prev, details: filters }));
    setApplied(prev => ({ ...prev, details: filters }));
    setErrors(prev => ({ ...prev, details: "" }));
    setType("全部");
    setView("details");
  };
  const exportRows = async () => {
    if (exporting || !hasRows) return;
    setExporting(true);
    const name = view === "summary" ? "个人消耗汇总" : "消耗明细";
    const rows: (string | number)[][] = view === "summary"
      ? [["用户账号", "分组", "团队", "总消耗"], ...summaries.map(row => [row.name, row.group, row.team, row.total])]
      : [["日期", "类型", "积分", "用户账号", "分组", "团队"], ...details.map(row => [row.time, row.type, row.amount, row.userName, row.group, row.team])];
    try {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const widths = view === "summary" ? [22, 28, 28, 16] : [24, 16, 14, 22, 28, 28];
      const blob = await writeXlsxFile(rows, { sheet: name, columns: widths.map(width => ({ width })) }).toBlob();
      const filename = `${name}_${localCreditTime().slice(0, 10)}.xlsx`;
      recordExport(blob, filename, name);
      const url = URL.createObjectURL(blob);
      startFileDownload(url, filename);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast(`${name}已导出`);
    } catch {
      showToast("导出失败，请稍后重试");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section data-testid="credit-consumption" className="min-w-0 bg-white p-4 sm:p-6 space-y-5">
      <div role="tablist" aria-label="积分明细视图" className="flex gap-7 overflow-x-auto border-b border-slate-100">
        {([["summary", "个人消耗汇总"], ["details", "消耗明细"]] as const).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} aria-controls="credit-consumption-panel" id={`credit-tab-${key}`} onClick={() => setView(key)} className={tabClass(view === key)}>{label}</button>
        ))}
      </div>
      <div role="tabpanel" id="credit-consumption-panel" aria-labelledby={`credit-tab-${view}`} className="space-y-5">
        <form onSubmit={query} className="flex flex-wrap items-start gap-3">
          <select aria-label="用户账号" value={draft.userId} onChange={event => setFilter("userId", event.target.value)} className={`${inputClass} w-full sm:w-72`}>
            <option value="">请选择账户</option>
            {members.map(member => {
              const org = creditMemberOrganization(member, depts);
              return <option key={member.id} value={member.id}>{org.path ? `${org.path} / ` : ""}{member.name} ({member.employeeNo})</option>;
            })}
          </select>
          <div className="min-w-0 w-full sm:w-auto">
            <div className="flex min-w-0 flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-lg border border-slate-200 bg-white px-2">
              <input aria-label="开始日期" aria-invalid={Boolean(errors[view])} type="date" value={draft.startDate} onChange={event => setFilter("startDate", event.target.value)} className="min-w-0 w-full sm:w-36 bg-transparent px-1 py-2 text-sm text-slate-700 focus:outline-none" />
              <span className="shrink-0 text-sm text-slate-500">至</span>
              <input aria-label="结束日期" aria-invalid={Boolean(errors[view])} type="date" value={draft.endDate} onChange={event => setFilter("endDate", event.target.value)} className="min-w-0 w-full sm:w-36 bg-transparent px-1 py-2 text-sm text-slate-700 focus:outline-none" />
            </div>
            {errors[view] && <p role="alert" className="mt-1 text-xs text-rose-600">{errors[view]}</p>}
          </div>
          <button type="submit" className="shrink-0 whitespace-nowrap rounded-lg bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-700">查询</button>
          <button type="button" disabled={!hasRows || exporting} onClick={exportRows} className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "导出中" : "Excel导出"}
          </button>
        </form>
        {view === "details" && (
          <div role="tablist" aria-label="积分变动类型" className="flex gap-5 overflow-x-auto border-b border-slate-100">
            {(["全部", ...CREDIT_RECORD_TYPES] as const).map(label => (
              <button type="button" role="tab" key={label} aria-selected={type === label} onClick={() => setType(label)} className={tabClass(type === label)}>{label}</button>
            ))}
          </div>
        )}
        <div key={view} data-testid="credit-table-scroll" className="overflow-x-auto">
          {view === "summary" ? (
            <table aria-label="个人消耗汇总" className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-4 font-medium">用户账号</th>
                  <th scope="col" className="px-5 py-4 font-medium">分组</th>
                  <th scope="col" className="px-5 py-4 font-medium">团队</th>
                  <th scope="col" className="px-5 py-4 font-medium" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"}>
                    <button type="button" title="按总消耗排序" onClick={() => setSort(current => current === null ? "desc" : current === "desc" ? "asc" : null)} className="flex items-center gap-1 whitespace-nowrap">
                      总消耗{sort === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {summaries.map(row => (
                  <tr key={row.id} data-member-id={row.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-5 font-medium text-slate-800">{row.name}</td>
                    <td className="px-5 py-5">{row.group}</td>
                    <td className="px-5 py-5">{row.team}</td>
                    <td className="px-5 py-5 tabular-nums" data-testid="credit-total">{numberText(row.total)}</td>
                    <td className="px-5 py-5 text-right"><button type="button" onClick={() => openMemberDetails(row.id)} className="font-medium text-purple-600 hover:text-purple-800 hover:underline">明细</button></td>
                  </tr>
                ))}
                {!summaries.length && <tr><td colSpan={5} className="py-14 text-center text-slate-400">暂无符合条件的账号</td></tr>}
              </tbody>
            </table>
          ) : (
            <table aria-label="消耗明细" className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr>{["日期", "类型", "积分", "用户账号", "分组", "团队"].map(label => <th scope="col" key={label} className="px-5 py-4 font-medium">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {details.map(row => (
                  <tr key={row.id} data-credit-id={row.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-5 tabular-nums">{row.time}</td>
                    <td className="whitespace-nowrap px-5 py-5">{row.type}</td>
                    <td className={`px-5 py-5 font-medium tabular-nums ${row.amount < 0 ? "text-rose-500" : "text-emerald-600"}`}>{row.amount > 0 ? "+" : ""}{numberText(row.amount)}</td>
                    <td className="px-5 py-5">{row.userName}</td>
                    <td className="px-5 py-5">{row.group}</td>
                    <td className="px-5 py-5">{row.team}</td>
                  </tr>
                ))}
                {!details.length && <tr><td colSpan={6} className="py-14 text-center text-slate-400">暂无符合条件的消耗明细</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
