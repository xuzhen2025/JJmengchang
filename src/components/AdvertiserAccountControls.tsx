import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { adAccountState, type AdAccount } from "../lib/adPush";
import { bindAdAccounts } from "../lib/adAccountAuthorization";
import { accountBindingGroups, accountBindingPatch, AD_SYNC_OPTIONS, recentAccountSpend, setAccountSyncPreference, type AccountBindingDraft, type AccountBindingGroup, type AccountFilters } from "../lib/adAccountManagement";
import { useReportOrganization } from "../lib/analyticsOrganization";
import { useReportData } from "../lib/useReportData";
import { useResourceConfig } from "../lib/useResourceConfig";
import AnchoredPopover from "./overlays/AnchoredPopover";
import OverlayPortal from "./overlays/OverlayPortal";
import AssetPagination from "./AssetPagination";
import CategoryCascader from "./CategoryCascader";

const fieldClass = "h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-purple-500";
const primaryClass = "h-9 rounded-md bg-purple-600 px-4 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50";

function useAccountCategories(accounts: AdAccount[]) {
  const { store, revision } = useResourceConfig();
  return useMemo(() => {
    const map = Object.fromEntries(Object.entries(store.categoryMap("finished")).map(([name, children]) => [name, [...children]]));
    const paths = Object.entries(map).flatMap(([primary, children]) => children.map(child => `${primary} / ${child}`));
    for (const account of accounts) {
      if (account.category && !paths.includes(account.category) && !map[account.category]) map[account.category] = [];
    }
    return map;
  }, [accounts, store, revision]);
}

function AccountCategorySelect({ accounts, value, onChange, label, placeholder, clearValue = "" }: {
  accounts: AdAccount[]; value: string; onChange: (value: string) => void; label: string; placeholder?: string; clearValue?: string;
}) {
  const map = useAccountCategories(accounts);
  const primary = Object.keys(map).find(key => key === value || map[key].some(child => `${key} / ${child}` === value)) || "";
  const secondary = map[primary]?.find(child => `${primary} / ${child}` === value) || "";
  return <div className="[&>div>div]:h-10 [&>div>div]:rounded-md"><CategoryCascader customCategoryMap={map} primaryCategory={primary} secondaryCategory={secondary} expandTrigger="click"
    ariaLabel={label} placeholder={placeholder || "请选择分类"} onSelect={(a, b) => onChange(b ? `${a} / ${b}` : a)} onClear={() => onChange(clearValue)} /></div>;
}

export function AdvertiserAccountFilters({ accounts, filters, onChange, groups, children, syncControls }: {
  accounts: AdAccount[]; filters: AccountFilters; onChange: (next: AccountFilters) => void; groups: string[]; children: ReactNode; syncControls: ReactNode;
}) {
  const update = (key: keyof AccountFilters, value: string) => onChange({ ...filters, [key]: value });
  return <section aria-label="广告账户筛选" className="space-y-4 rounded-b-[inherit] border-b border-slate-100 bg-white px-5 py-5">
    <div className="flex flex-wrap items-center gap-3">
      {children}
      {([
        ["categoryBound", "关联分类"], ["groupBound", "关联小组"], ["userBound", "关联用户"], ["roomBound", "绑定直播间"],
      ] as const).map(([key, label]) => <select key={key} aria-label={`是否${label}`} value={filters[key]} onChange={e => update(key, e.target.value)} className={`${fieldClass} w-48 max-w-full`}>
        <option value="all">请选择是否{label}</option><option value="bound">已{label}</option><option value="unbound">未{label}</option>
      </select>)}
      <select aria-label="筛选小组" value={filters.group} onChange={e => update("group", e.target.value)} className={`${fieldClass} w-48 max-w-full`}>
        <option value="">请选择小组</option>{groups.map(group => <option key={group} value={group}>{group}</option>)}
      </select>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-56 max-w-full"><AccountCategorySelect accounts={accounts} value={filters.category} onChange={value => update("category", value)} label="筛选分类" /></div>
      <input aria-label="账户名称" placeholder="请输入账户名称" value={filters.name} onChange={e => update("name", e.target.value)} className={`${fieldClass} w-52 max-w-full`} />
      <input aria-label="账户ID" placeholder="请输入账户ID" value={filters.id} onChange={e => update("id", e.target.value)} className={`${fieldClass} w-52 max-w-full`} />
      <div className="ml-auto flex flex-wrap items-center gap-3">{syncControls}</div>
    </div>
  </section>;
}

function GroupUserSelect({ groups, value, onChange, placeholder }: {
  groups: AccountBindingGroup[]; value: AccountBindingDraft; onChange: (groupId: string, userId: string) => void; placeholder: string;
}) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(value.groupId);
  const [search, setSearch] = useState("");
  const selectedGroup = groups.find(group => group.id === value.groupId);
  const selectedUser = selectedGroup?.users.find(user => user.id === value.userId);
  const active = groups.find(group => group.id === activeId);
  const term = search.trim().toLowerCase();
  const visibleGroups = groups.filter(group => `${group.name} ${group.department}`.toLowerCase().includes(term) || group.users.some(user => user.name.toLowerCase().includes(term)));
  const users = active?.users.filter(user => !term || active.name.toLowerCase().includes(term) || user.name.toLowerCase().includes(term)) || [];
  const label = value.groupId === "__clear__" ? "清除关联" : selectedGroup ? [selectedGroup.name, selectedUser?.name].filter(Boolean).join(" / ") : placeholder;
  const select = (groupId: string, userId = "") => { onChange(groupId, userId); setOpen(false); setSearch(""); };
  return <div className="min-w-0">
    <button ref={anchor} type="button" aria-label="关联小组" aria-expanded={open} aria-haspopup="dialog" title={label}
      className={`${fieldClass} flex w-full items-center justify-between gap-2 text-left`} onClick={() => { setActiveId(value.groupId); setOpen(!open); setSearch(""); }}>
      <span className="min-w-0 truncate">{label}</span><ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
    {open && <AnchoredPopover anchorRef={anchor} onClose={() => setOpen(false)} width={active ? 520 : 280} maxHeight={360} className="rounded-md border border-slate-200 bg-white shadow-xl">
      <label className="flex items-center gap-2 border-b border-slate-100 p-3"><Search className="h-4 w-4 shrink-0 text-slate-400" /><input type="search" aria-label="搜索小组或用户" value={search} onChange={e => setSearch(e.target.value)} className="min-w-0 flex-1 text-xs outline-none" placeholder="搜索小组或用户" /></label>
      <div className={`grid divide-x divide-slate-100 ${active ? "grid-cols-2" : "grid-cols-1"}`}>
        <div role="group" aria-label="小组" className="max-h-64 min-w-0 overflow-y-auto py-1 text-xs">
          <button type="button" onClick={() => select("")} className="w-full px-3 py-2 text-left text-slate-500 hover:bg-slate-50">保持不变</button>
          <button type="button" onClick={() => select("__clear__")} className="w-full px-3 py-2 text-left text-slate-500 hover:bg-slate-50">清除关联</button>
          {visibleGroups.map(group => <button type="button" key={group.id} aria-expanded={activeId === group.id} onClick={() => setActiveId(group.id)} className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left ${activeId === group.id ? "bg-purple-50 text-purple-600" : "text-slate-900 hover:bg-slate-50"}`}>
            <span className="min-w-0 break-words">{group.name}<span className="mt-1 block text-[11px] text-slate-400">{group.department}</span></span><ChevronRight className="h-4 w-4 shrink-0" />
          </button>)}
          {!visibleGroups.length && <p className="p-3 text-slate-400">无匹配小组</p>}
        </div>
        {active && <div role="group" aria-label="小组用户" className="max-h-64 min-w-0 overflow-y-auto py-1 text-xs">
          <button type="button" onClick={() => select(active.id)} className="w-full break-words border-b border-slate-100 px-3 py-2 text-left text-purple-600 hover:bg-purple-50">仅绑定此小组</button>
          {users.map(user => <button key={user.id} type="button" onClick={() => select(active.id, user.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-slate-900 hover:bg-purple-50">
            <span className="break-words">{user.name}</span>{selectedGroup?.id === active.id && selectedUser?.id === user.id && <Check className="h-4 w-4 shrink-0 text-purple-600" />}
          </button>)}
          {!users.length && <p className="p-3 text-slate-400">暂无可选用户</p>}
        </div>}
      </div>
    </AnchoredPopover>}
  </div>;
}

export function AdAccountBindingDialog({ accounts, platform, targets, editing, onClose, onSaved }: {
  accounts: AdAccount[]; platform: string; targets: string[]; editing: boolean; onClose: () => void; onSaved: () => void;
}) {
  const org = useReportOrganization();
  const groups = accountBindingGroups(org);
  const categoryMap = useAccountCategories(accounts);
  const categoryPaths = Object.entries(categoryMap).flatMap(([primary, children]) => children.length ? children.map(child => `${primary} / ${child}`) : [primary]);
  const [draft, setDraft] = useState<AccountBindingDraft>({ groupId: "", userId: "", category: "" });
  const [error, setError] = useState("");
  const current = editing ? accounts.find(account => account.platform === platform && account.id === targets[0]) : undefined;
  const title = editing ? "编辑" : "批量绑定";
  const submit = () => {
    try { bindAdAccounts(platform, targets, accountBindingPatch(draft, groups, categoryPaths)); onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败，请重试"); }
  };
  return <OverlayPortal layer="dialog" role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
    <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h3 className="border-l-[3px] border-purple-600 pl-2 text-sm font-semibold text-slate-900">{title}</h3><button type="button" aria-label={`关闭${title}`} title="关闭" onClick={onClose} className="flex h-7 w-7 items-center justify-center text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button></header>
      <div className="space-y-6 overflow-y-auto px-6 py-8 sm:px-12">
        <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4"><label className="text-right text-xs font-medium text-slate-900">关联小组</label><GroupUserSelect groups={groups} value={draft} onChange={(groupId, userId) => { setDraft({ ...draft, groupId, userId }); setError(""); }} placeholder={current ? [current.group, current.user].filter(Boolean).join(" / ") || "请选择" : "请选择"} /></div>
        <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4"><label className="text-right text-xs font-medium text-slate-900">关联分类</label><AccountCategorySelect accounts={accounts} value={draft.category || current?.category || ""} clearValue="__clear__" onChange={category => { setDraft({ ...draft, category }); setError(""); }} label="关联分类" placeholder={draft.category === "__clear__" ? "清除关联" : "请选择"} /></div>
        <p className="text-center text-xs leading-5 text-slate-400">为广告账户绑定小组/用户或分类，后续新产生的数据将按绑定关系统计</p>
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      </div>
      <footer className="flex justify-center gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="h-9 rounded-md border border-slate-200 px-5 text-xs text-slate-600 hover:bg-slate-50">取消</button><button type="button" onClick={submit} className={primaryClass}>确定</button></footer>
    </div>
  </OverlayPortal>;
}

export function AdvertiserAccountTable({ accounts, platform, selectedIds, onSelection, onEdit, onRevoke, onAuthorize, showToast }: {
  accounts: AdAccount[]; platform: string; selectedIds: string[]; onSelection: (ids: string[]) => void;
  onEdit: (account: AdAccount) => void; onRevoke: (account: AdAccount) => void; onAuthorize: (account: AdAccount) => void; showToast: (message: string) => void;
}) {
  const report = useReportData();
  const spend = useMemo(() => recentAccountSpend(report.facts, platform), [report.facts, platform]);
  const [sort, setSort] = useState<"asc" | "desc" | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const all = useRef<HTMLInputElement>(null);
  const count = accounts.filter(account => selectedIds.includes(account.id)).length;
  useEffect(() => { if (all.current) all.current.indeterminate = count > 0 && count < accounts.length; }, [count, accounts.length]);
  const identity = accounts.map(account => account.id).join(",");
  useEffect(() => setPage(1), [identity, platform]);
  const rows = sort ? [...accounts].sort((a, b) => ((spend.get(a.id) || 0) - (spend.get(b.id) || 0)) * (sort === "asc" ? 1 : -1)) : accounts;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize)));
  return <div className="bg-white">
    <div className="overflow-x-auto">
      <table data-testid="advertiser-accounts-table" className="w-full min-w-[1780px] table-fixed border-collapse text-left text-xs text-slate-900">
        <colgroup><col className="w-12" /><col className="w-56" /><col className="w-28" />{Array.from({ length: 6 }, (_, index) => <col key={index} className="w-28" />)}{AD_SYNC_OPTIONS.map(item => <col key={item.key} className={item.key === "douyinVideoData" ? "w-32" : "w-24"} />)}<col className="w-32" /><col className="w-28" /></colgroup>
        <thead className="bg-slate-50"><tr>
          <th className="px-3 py-5 text-center"><input ref={all} type="checkbox" aria-label="选择当前筛选结果的全部账户" checked={accounts.length > 0 && count === accounts.length} aria-checked={count > 0 && count < accounts.length ? "mixed" : accounts.length > 0 && count === accounts.length} disabled={!accounts.length} className="accent-purple-600" onChange={() => onSelection(count === accounts.length ? [] : accounts.map(account => account.id))} /></th>
          <th className="px-3 py-5 font-medium">广告账户</th>
          <th className="px-3 py-5" aria-sort={sort ? sort === "asc" ? "ascending" : "descending" : "none"}><button type="button" aria-label="按近七天消耗排序" onClick={() => { setSort(sort === "desc" ? "asc" : "desc"); setPage(1); }} className="flex items-center gap-1 whitespace-nowrap font-medium">近七天消耗{sort === "asc" ? <ArrowUp className="h-3 w-3" /> : sort === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-slate-400" />}</button></th>
          {["关联小组", "关联用户", "关联分类", "授权人", "关联直播间", "备注"].map(label => <th key={label} className="px-3 py-5 font-medium">{label}</th>)}
          {AD_SYNC_OPTIONS.map(item => <th key={item.key} className="px-3 py-5 text-center font-medium leading-6">{item.label}</th>)}
          <th className="px-3 py-5 font-medium">授权更新时间</th><th className="sticky right-0 bg-slate-50 px-3 py-5 text-center font-medium">操作</th>
        </tr></thead>
        <tbody>{rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(account => {
          const state = adAccountState(account);
          return <tr key={account.id} data-account-id={account.id} className="border-b border-slate-100 hover:bg-slate-50/70">
            <td className="px-3 py-5 text-center"><input type="checkbox" aria-label={`选择账户 ${account.id}`} checked={selectedIds.includes(account.id)} onChange={() => onSelection(selectedIds.includes(account.id) ? selectedIds.filter(id => id !== account.id) : [...selectedIds, account.id])} className="accent-purple-600" /></td>
            <td className="break-words px-3 py-5 leading-6"><div>{account.name}</div><div className="break-all">{account.id}</div>{account.authorizationSubject && <div className="text-[11px] text-slate-500">{account.authorizationSubject.name}</div>}{account.syncError && <p className="text-[11px] text-rose-600">{account.syncError}</p>}</td>
            <td className="px-3 py-5 tabular-nums">{(spend.get(account.id) || 0).toFixed(2)}</td>
            {[account.group, account.user, account.category, account.authorizedBy, account.liveRoomName, account.remark].map((value, index) => <td key={index} className="break-words px-3 py-5 leading-6">{value || "/"}</td>)}
            {AD_SYNC_OPTIONS.map(item => {
              const checked = Boolean(account.syncPreferences?.[item.key]);
              return <td key={item.key} className="px-3 py-5 text-center"><button type="button" role="switch" aria-label={`${account.id} ${item.label}`} aria-checked={checked} disabled={state !== "authorized"} title={state !== "authorized" ? "请先恢复账户授权或接入" : item.label}
                onClick={() => { try { setAccountSyncPreference(platform, account.id, item.key, !checked); showToast(`已${checked ? "关闭" : "开启"}${item.label}，设置已保存`); } catch (cause) { showToast(cause instanceof Error ? cause.message : "保存失败"); } }}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${checked ? "bg-purple-600" : "bg-slate-200"}`}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button></td>;
            })}
            <td className="break-words px-3 py-5 leading-6" title={account.syncedAt ? `最近同步：${account.syncedAt}` : "尚未同步"}>{account.authorizedAt || "/"}</td>
            <td className="sticky right-0 bg-white px-3 py-5 text-center"><div className="flex flex-col items-center gap-3">
              <button type="button" onClick={() => onEdit(account)} className="text-purple-600 hover:underline">编辑</button>
              {state !== "authorized" && <button type="button" onClick={() => onAuthorize(account)} className="text-purple-600 hover:underline">{state === "disconnected" ? "重新接入" : "重新授权"}</button>}
              {state !== "disconnected" && <button type="button" onClick={() => onRevoke(account)} className="text-purple-600 hover:underline">取消授权</button>}
            </div></td>
          </tr>;
        })}{!rows.length && <tr><td colSpan={16} className="py-14 text-center text-slate-400">暂无符合条件的广告账户</td></tr>}</tbody>
      </table>
    </div>
    <AssetPagination total={rows.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
  </div>;
}
