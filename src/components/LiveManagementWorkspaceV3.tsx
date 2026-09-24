import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Filter,
  Heart,
  History,
  Home,
  Link2,
  MessageSquare,
  MonitorPlay,
  Package,
  Pencil,
  PlayCircle,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  TrendingUp,
  Upload,
  UserMinus,
  UserPlus,
  UsersRound,
  Video,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_EMPLOYEES,
  INITIAL_LIVE_ACCOUNTS,
  INITIAL_LIVE_ROOMS,
  INITIAL_PRODUCTS,
  INITIAL_REDUCTION_RECORDS,
  INITIAL_SESSIONS,
  INITIAL_SHIFTS,
  INITIAL_STORES,
  LIVE_ROLES,
  type EmployeeAssignment,
  type LiveAccount,
  type LiveEmployee,
  type LiveRole,
  type LiveSession,
  type LiveShift,
  type LiveStore,
  type ReductionRecord,
} from "../data/liveManagement";
import OverlayPortal from "./overlays/OverlayPortal";
import { aggregateLiveMetrics, compareLiveMetrics, formatRoi, LIVE_METRIC_SNAPSHOTS, LIVE_TIMELINES, METRIC_RULES, productLiveMetrics, productSalesTrend, rangeMatches, roi, sessionProductMetrics, sessionRefunds, summarizeRefunds } from "../data/liveMetrics";

const tabs = [
  { id: "home", label: "首页", icon: Home },
  { id: "rooms", label: "我的直播间", icon: Video },
  { id: "schedule", label: "直播排班", icon: CalendarDays },
  { id: "hosts", label: "主播数据", icon: BarChart3 },
  { id: "team", label: "部门管理", icon: UsersRound },
  { id: "stores", label: "店铺管理", icon: Store },
  { id: "tools", label: "辅助工具", icon: Bot },
] as const;

type TabId = (typeof tabs)[number]["id"];
type AccountFilter = "all" | string;
type DetailRoute =
  | { type: "account"; accountId: string }
  | { type: "session"; sessionId: string }
  | { type: "live-data"; sessionId: string }
  | { type: "review"; sessionId: string }
  | { type: "console"; sessionId: string }
  | { type: "host"; employeeId: string }
  | { type: "product"; productId: string };

type DialogId =
  | "account"
  | "unbind-account"
  | "employee"
  | "reduce-employee"
  | "night-shift"
  | "role-permission"
  | "shift"
  | "schedule-import"
  | "schedule-logs"
  | "store"
  | "unbind-store"
  | "tool"
  | null;

interface EmployeeFormState {
  name: string;
  login: string;
  phone: string;
  employment: "全职" | "兼职";
  joinDate: string;
  status: LiveEmployee["status"];
  assignments: EmployeeAssignment[];
}

interface ShiftFormState {
  accountId: string;
  roomId: string;
  date: string;
  start: number;
  end: number;
  title: string;
  participantIds: string[];
  status: LiveShift["status"];
}

const primaryButton = "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-xs font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButton = "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45";
const dangerButton = "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-xs font-bold text-white transition-colors hover:bg-rose-700";
const iconButton = "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700";
const fieldClass = "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const formatNumber = (value: number | null | undefined) => value == null ? "--" : new Intl.NumberFormat("zh-CN").format(Math.round(value));
const formatMoney = (value: number | null | undefined) => value == null ? "--" : `¥${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
const formatCompactMoney = (value: number | null | undefined) => value != null && value >= 10000 ? `¥${(value / 10000).toFixed(2)}万` : formatMoney(value);
const formatPercent = (value: number | null | undefined) => value == null ? "--" : `${value.toFixed(2)}%`;
const roiTitle = `${METRIC_RULES.roi}；投放消耗为0时：${METRIC_RULES.noSpend}`;
const metricTitle = (label: string) => label.includes("ROI") ? roiTitle : label.includes("退款率") ? METRIC_RULES.refunds : label.includes("退款金额") ? METRIC_RULES.refundAmount : label.includes("退款订单") ? METRIC_RULES.refunds : label.includes("成交订单") ? METRIC_RULES.orders : label.includes("成交金额") || label.includes("GMV") ? METRIC_RULES.revenue : undefined;
const formatDuration = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
const sumBy = <T,>(items: T[], getter: (item: T) => number) => items.reduce((total, item) => total + getter(item), 0);

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "purple" | "amber" | "red" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return <span className={`inline-flex h-6 items-center rounded px-2 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

const accountTone = (status: LiveAccount["status"]): "green" | "purple" | "amber" | "slate" => status === "已绑定" ? "green" : status === "首次同步中" ? "purple" : status === "授权即将到期" ? "amber" : "slate";
const sessionTone = (status: LiveSession["status"]): "green" | "purple" | "red" | "slate" => status === "直播中" ? "green" : status === "数据同步中" ? "purple" : status === "数据异常" ? "red" : "slate";
const shiftTone = (status: LiveShift["status"]): "green" | "amber" | "slate" => status === "已确认" ? "green" : status === "待确认" ? "amber" : "slate";

function PageHeader({ title, description, children, onBack }: { title: string; description?: string; children?: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && <button type="button" onClick={onBack} title="返回" className={iconButton}><ArrowLeft className="h-4 w-4" /></button>}
        <div className="min-w-0"><h1 className="text-lg font-black text-slate-900">{title}</h1>{description && <p className="mt-1 text-xs text-slate-400">{description}</p>}</div>
      </div>
      {children && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

function Dialog({ title, children, onClose, footer, width = "max-w-2xl" }: { title: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode; width?: string }) {
  return (
    <OverlayPortal layer="dialog" className="fixed inset-0 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
      <div className={`flex max-h-[88vh] w-full ${width} flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl`}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-5"><h2 className="text-sm font-black text-slate-900">{title}</h2><button type="button" onClick={onClose} title="关闭" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">{footer}</div>}
      </div>
    </OverlayPortal>
  );
}

function Segmented<T extends string>({ value, items, onChange }: { value: T; items: readonly T[]; onChange: (value: T) => void }) {
  return <div className="inline-flex max-w-full flex-wrap gap-y-1 rounded-md border border-slate-200 bg-white p-1">{items.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`h-7 shrink-0 whitespace-nowrap rounded px-3 text-xs font-bold ${value === item ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{item}</button>)}</div>;
}

function MetricCard({ label, value, note, icon: Icon, tone = "purple" }: { label: string; value: React.ReactNode; note?: string; icon: LucideIcon; tone?: "purple" | "green" | "amber" | "blue" | "red" }) {
  const tones = {
    purple: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-rose-50 text-rose-600",
  };
  return <div title={metricTitle(label)} className="flex h-full min-h-24 items-center gap-3 bg-white px-4 py-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}><Icon className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-xs text-slate-400">{label}</span><span className="mt-1 block text-base font-black text-slate-900">{value}</span>{note && <span className="mt-0.5 block text-[10px] text-slate-400">{note}</span>}</span></div>;
}

function MetricStrip({ items }: { items: Array<{ label: string; value: React.ReactNode; note?: string; icon: LucideIcon; tone?: "purple" | "green" | "amber" | "blue" | "red" }> }) {
  return <section className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">{items.map((item) => <div key={item.label} className="min-w-[170px] flex-[1_1_170px]"><MetricCard {...item} /></div>)}</section>;
}

function Pagination({ total, page, pageSize, onPage, onPageSize }: { total: number; page: number; pageSize: number; onPage: (page: number) => void; onPageSize: (size: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  return <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500"><span className="mr-2">共 {total} 条</span><select value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))} className="h-8 rounded border border-slate-200 bg-white px-2 outline-none"><option value={5}>5条/页</option><option value={10}>10条/页</option><option value={20}>20条/页</option></select><button type="button" disabled={safePage <= 1} onClick={() => onPage(safePage - 1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map((item) => <button key={item} type="button" onClick={() => onPage(item)} className={`h-8 min-w-8 rounded border px-2 font-bold ${safePage === item ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white"}`}>{item}</button>)}<button type="button" disabled={safePage >= pageCount} onClick={() => onPage(safePage + 1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button></div>;
}

function TrendChart({ values, color = "#7c3aed", labels }: { values: number[]; color?: string; labels?: string[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${24 + index * (452 / Math.max(values.length - 1, 1))},${156 - (value / max) * 118}`).join(" ");
  return <div className="h-48 w-full"><svg viewBox="0 0 500 180" className="h-full w-full" role="img" aria-label="趋势图"><line x1="24" y1="38" x2="476" y2="38" stroke="#e2e8f0" strokeDasharray="4 4" /><line x1="24" y1="97" x2="476" y2="97" stroke="#e2e8f0" strokeDasharray="4 4" /><line x1="24" y1="156" x2="476" y2="156" stroke="#cbd5e1" /><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, index) => <g key={index}><circle cx={24 + index * (452 / Math.max(values.length - 1, 1))} cy={156 - (value / max) * 118} r="3.5" fill="white" stroke={color} strokeWidth="2" />{labels?.[index] && <text x={24 + index * (452 / Math.max(values.length - 1, 1))} y="174" textAnchor="middle" fontSize="9" fill="#94a3b8">{labels[index]}</text>}</g>)}</svg></div>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center"><Activity className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">{title}</p><p className="mt-1 text-xs text-slate-400">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export default function LiveManagementWorkspaceV3() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [detailRoute, setDetailRoute] = useState<DetailRoute | null>(null);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [accounts, setAccounts] = useState(INITIAL_LIVE_ACCOUNTS);
  const [rooms, setRooms] = useState(INITIAL_LIVE_ROOMS);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [shifts, setShifts] = useState(INITIAL_SHIFTS);
  const [stores, setStores] = useState(INITIAL_STORES);
  const [productCatalog] = useState(INITIAL_PRODUCTS);
  const products = useMemo(() => productCatalog.map((product) => ({ ...product, ...productLiveMetrics(sessions.filter((session) => rangeMatches(session.startedAt, "近30天")), product.id) })), [productCatalog, sessions]);
  const [reductions, setReductions] = useState(INITIAL_REDUCTION_RECORDS);
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");

  const [homeSearch, setHomeSearch] = useState("");
  const [roomAccountFilter, setRoomAccountFilter] = useState<AccountFilter>("all");
  const [roomAccountSearch, setRoomAccountSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [roomRange, setRoomRange] = useState("近7天");
  const [roomMode, setRoomMode] = useState<"直播间列表" | "精确数值">("直播间列表");
  const [hideLive, setHideLive] = useState(false);
  const [hideSyncing, setHideSyncing] = useState(true);
  const [roomPage, setRoomPage] = useState(1);
  const [roomPageSize, setRoomPageSize] = useState(5);

  const [scheduleAccountFilter, setScheduleAccountFilter] = useState<AccountFilter>("all");
  const [scheduleView, setScheduleView] = useState<"排班计划" | "上播记录" | "无效排班">("排班计划");
  const [hostAccountFilter, setHostAccountFilter] = useState<AccountFilter>("all");
  const [hostRole, setHostRole] = useState<LiveRole>("主播");
  const [hostRange, setHostRange] = useState("近7天");
  const [hostView, setHostView] = useState<"主播数据" | "排班计划">("主播数据");
  const [hostSearch, setHostSearch] = useState("");

  const [teamView, setTeamView] = useState<"部门管理" | "岗位设置">("部门管理");
  const [teamGroup, setTeamGroup] = useState<"全部员工" | "按直播号" | "按岗位" | "按在职状态" | "减员记录">("全部员工");
  const [teamAccountFilter, setTeamAccountFilter] = useState<AccountFilter>("all");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatus, setTeamStatus] = useState("全部状态");
  const [teamPage, setTeamPage] = useState(1);
  const [teamPageSize, setTeamPageSize] = useState(10);
  const [storeAccountFilter, setStoreAccountFilter] = useState<AccountFilter>("all");
  const [accountDetailTab, setAccountDetailTab] = useState<"经营概览" | "直播记录" | "商品数据" | "部门成员">("经营概览");

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<LiveRole>("主播");
  const [consoleMessages] = useState(["欢迎来到梦畅直播间，今天新品福利已经上架。", "精华液适合混合肌吗？", "已关注，坐等主播讲面膜套装。"]);

  const [accountForm, setAccountForm] = useState({ name: "", handle: "", manager: "" });
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>({ name: "", login: "", phone: "", employment: "全职", joinDate: "2026-09-08", status: "在职", assignments: [{ accountId: "acc-1", role: "主播" }] });
  const [shiftForm, setShiftForm] = useState<ShiftFormState>({ accountId: "acc-1", roomId: "room-1", date: "2026-09-09", start: 9, end: 13, title: "", participantIds: [], status: "待确认" });
  const [reductionForm, setReductionForm] = useState({ reducedAt: "2026-09-08", lastWorkDate: "2026-09-10", reason: "主动离职", note: "" });
  const [storeForm, setStoreForm] = useState({ accountId: "acc-1", name: "", platform: "抖店" as LiveStore["platform"] });
  const [liveCompare, setLiveCompare] = useState<"vs 上一场" | "vs 近7场均值" | "vs 行业均值">("vs 上一场");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const closeDialog = () => {
    setDialog(null);
    setFormError("");
  };

  const navigateTab = (tab: TabId) => {
    setActiveTab(tab);
    setDetailRoute(null);
  };

  const accountName = (accountId: string) => accounts.find((account) => account.id === accountId)?.name ?? "已解绑直播号";
  const roomName = (roomId: string) => rooms.find((room) => room.id === roomId)?.name ?? "直播间已停用";
  const employeeName = (employeeId: string) => employees.find((employee) => employee.id === employeeId)?.name ?? "已离职员工";
  const activeAccounts = accounts.filter((account) => account.status !== "已解绑");
  const filterSessionsByAccount = (accountFilter: AccountFilter) => sessions.filter((session) => accountFilter === "all" || session.accountId === accountFilter);
  const accountRooms = (accountFilter: AccountFilter) => rooms.filter((room) => accountFilter === "all" || room.accountId === accountFilter);
  const metricSessions = (accountFilter: AccountFilter, range = "近30天") => filterSessionsByAccount(accountFilter).filter((session) => rangeMatches(session.startedAt, range));

  const aggregateMetrics = aggregateLiveMetrics;

  const openAccount = (accountId: string) => {
    setAccountDetailTab("经营概览");
    setDetailRoute({ type: "account", accountId });
  };

  const openSession = (sessionId: string) => setDetailRoute({ type: "session", sessionId });
  const openLiveData = (sessionId: string) => setDetailRoute({ type: "live-data", sessionId });
  const openReview = (sessionId: string) => setDetailRoute({ type: "review", sessionId });

  const openAccountEditor = (account?: LiveAccount) => {
    setSelectedAccountId(account?.id ?? null);
    setAccountForm(account ? { name: account.name, handle: account.handle, manager: account.manager } : { name: "", handle: "", manager: "" });
    setDialog("account");
  };

  const saveAccount = () => {
    const name = accountForm.name.trim();
    const handle = accountForm.handle.trim().replace(/^@/, "");
    const manager = accountForm.manager.trim();
    if (!name || !handle || !manager) {
      setFormError("请完整填写直播号名称、抖音号和负责人");
      return;
    }
    if (accounts.some((account) => account.id !== selectedAccountId && (account.name === name || account.handle === handle))) {
      setFormError("直播号名称或抖音号已存在");
      return;
    }
    if (selectedAccountId) {
      setAccounts((current) => current.map((account) => account.id === selectedAccountId ? { ...account, name, handle, manager } : account));
      notify("直播号信息已更新");
    } else {
      const id = `acc-${Date.now()}`;
      setAccounts((current) => [...current, { id, name, handle, manager, status: "首次同步中", lastSync: "等待首次同步", likes: 0, followers: 0, avatarTone: "bg-indigo-600" }]);
      setRooms((current) => [...current, { id: `room-${Date.now()}`, accountId: id, name: `${name} 1 号间`, roomNo: `MC-${String(current.length + 1).padStart(3, "0")}` }]);
      notify("直播号绑定成功，已开始首次数据同步");
    }
    closeDialog();
  };

  const confirmUnbindAccount = () => {
    if (!selectedAccountId) return;
    const target = accounts.find((account) => account.id === selectedAccountId);
    setAccounts((current) => current.map((account) => account.id === selectedAccountId ? { ...account, status: "已解绑", lastSync: "已停止同步" } : account));
    setShifts((current) => current.map((shift) => shift.accountId === selectedAccountId && shift.status !== "已取消" ? { ...shift, status: "已取消", invalidReason: "直播号已解绑", updatedAt: "刚刚", operator: "徐振" } : shift));
    closeDialog();
    setDetailRoute(null);
    setActiveTab("home");
    notify(`${target?.name ?? "直播号"}已解绑，未执行排班已转为无效排班`);
  };

  const refreshLiveData = () => {
    const syncing = accounts.filter((account) => account.status === "首次同步中");
    if (syncing.length) {
      setAccounts((current) => current.map((account) => account.status === "首次同步中" ? { ...account, status: "已绑定", lastSync: "刚刚" } : account));
      notify(`${syncing.length} 个直播号已完成首次同步`);
      return;
    }
    setAccounts((current) => current.map((account) => account.status === "已绑定" ? { ...account, lastSync: "刚刚" } : account));
    notify("直播管理数据已刷新");
  };

  const openEmployeeEditor = (employee?: LiveEmployee) => {
    setSelectedEmployeeId(employee?.id ?? null);
    setEmployeeForm(employee ? {
      name: employee.name,
      login: employee.login,
      phone: employee.phone,
      employment: employee.employment,
      joinDate: employee.joinDate,
      status: employee.status,
      assignments: employee.assignments.map((assignment) => ({ ...assignment })),
    } : {
      name: "",
      login: "",
      phone: "",
      employment: "全职",
      joinDate: "2026-09-08",
      status: "在职",
      assignments: [{ accountId: activeAccounts[0]?.id ?? "", role: "主播" }],
    });
    setDialog("employee");
  };

  const saveEmployee = () => {
    if (!employeeForm.name.trim() || !employeeForm.login.trim() || !employeeForm.phone.trim()) {
      setFormError("请完整填写员工姓名、登录账号和手机号");
      return;
    }
    if (!employeeForm.assignments.length || employeeForm.assignments.some((assignment) => !assignment.accountId)) {
      setFormError("请至少配置一个有效的直播号岗位");
      return;
    }
    const assignmentKeys = employeeForm.assignments.map((assignment) => `${assignment.accountId}:${assignment.role}`);
    if (new Set(assignmentKeys).size !== assignmentKeys.length) {
      setFormError("同一直播号下不能重复配置相同岗位");
      return;
    }
    if (employees.some((employee) => employee.id !== selectedEmployeeId && employee.login === employeeForm.login.trim())) {
      setFormError("登录账号已被其他员工使用");
      return;
    }
    if (selectedEmployeeId) {
      setEmployees((current) => current.map((employee) => employee.id === selectedEmployeeId ? { ...employee, ...employeeForm, name: employeeForm.name.trim(), login: employeeForm.login.trim(), phone: employeeForm.phone.trim() } : employee));
      notify("员工信息与直播号岗位已同步更新");
    } else {
      setEmployees((current) => [...current, { id: `emp-${Date.now()}`, ...employeeForm, name: employeeForm.name.trim(), login: employeeForm.login.trim(), phone: employeeForm.phone.trim(), nightShift: false }]);
      notify("员工已创建，可立即参与对应直播号排班");
    }
    closeDialog();
  };

  const openReduceEmployee = (employee: LiveEmployee) => {
    setSelectedEmployeeId(employee.id);
    setReductionForm({ reducedAt: "2026-09-08", lastWorkDate: "2026-09-10", reason: "主动离职", note: "" });
    setDialog("reduce-employee");
  };

  const confirmReduceEmployee = () => {
    const employee = employees.find((item) => item.id === selectedEmployeeId);
    if (!employee) return;
    if (reductionForm.lastWorkDate < reductionForm.reducedAt) {
      setFormError("最后工作日不能早于减员日期");
      return;
    }
    const roles = employee.assignments.map((assignment) => `${accountName(assignment.accountId)}-${assignment.role}`).join("、");
    const record: ReductionRecord = { id: `reduce-${Date.now()}`, employeeId: employee.id, employeeName: employee.name, roles, joinDate: employee.joinDate, reducedAt: reductionForm.reducedAt, reason: reductionForm.reason, lastWorkDate: reductionForm.lastWorkDate, operator: "徐振", note: reductionForm.note.trim() || "无" };
    setReductions((current) => [record, ...current]);
    setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, status: "已离职" } : item));
    setShifts((current) => current.map((shift) => shift.date >= reductionForm.lastWorkDate ? { ...shift, participantIds: shift.participantIds.filter((id) => id !== employee.id) } : shift));
    closeDialog();
    setTeamGroup("减员记录");
    notify(`${employee.name}已完成减员，未来排班已解除关联`);
  };

  const openNightShift = (employee: LiveEmployee) => {
    setSelectedEmployeeId(employee.id);
    setDialog("night-shift");
  };

  const toggleNightShift = () => {
    const employee = employees.find((item) => item.id === selectedEmployeeId);
    if (!employee) return;
    setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, nightShift: !item.nightShift } : item));
    closeDialog();
    notify(`${employee.name}的晚班设置已更新`);
  };

  const openShiftEditor = (shift?: LiveShift, presetAccountId?: string, presetDate = "2026-09-09", presetStart = 9) => {
    setSelectedShiftId(shift?.id ?? null);
    const accountId = shift?.accountId ?? presetAccountId ?? (scheduleAccountFilter !== "all" ? scheduleAccountFilter : activeAccounts[0]?.id ?? "");
    const roomId = shift?.roomId ?? accountRooms(accountId)[0]?.id ?? "";
    setShiftForm(shift ? { accountId: shift.accountId, roomId: shift.roomId, date: shift.date, start: shift.start, end: shift.end, title: shift.title, participantIds: [...shift.participantIds], status: shift.status } : { accountId, roomId, date: presetDate, start: presetStart, end: Math.min(presetStart + 4, 24), title: "", participantIds: [], status: "待确认" });
    setDialog("shift");
  };

  const saveShift = () => {
    if (!shiftForm.accountId || !shiftForm.roomId || !shiftForm.title.trim()) {
      setFormError("请完整填写直播号、直播间和直播主题");
      return;
    }
    if (shiftForm.end <= shiftForm.start) {
      setFormError("结束时间必须晚于开始时间");
      return;
    }
    if (!shiftForm.participantIds.length) {
      setFormError("请至少选择一名参与员工");
      return;
    }
    const roomConflict = shifts.find((shift) => shift.id !== selectedShiftId && shift.status !== "已取消" && shift.roomId === shiftForm.roomId && shift.date === shiftForm.date && shift.start < shiftForm.end && shift.end > shiftForm.start);
    if (roomConflict) {
      setFormError(`${roomName(roomConflict.roomId)}在 ${roomConflict.start}:00-${roomConflict.end}:00 已有排班`);
      return;
    }
    const employeeConflict = shifts.find((shift) => shift.id !== selectedShiftId && shift.status !== "已取消" && shift.date === shiftForm.date && shift.start < shiftForm.end && shift.end > shiftForm.start && shift.participantIds.some((id) => shiftForm.participantIds.includes(id)));
    if (employeeConflict) {
      const conflictId = employeeConflict.participantIds.find((id) => shiftForm.participantIds.includes(id));
      setFormError(`${employeeName(conflictId ?? "")}在该时段已有其他直播排班`);
      return;
    }
    if (selectedShiftId) {
      setShifts((current) => current.map((shift) => shift.id === selectedShiftId ? { ...shift, ...shiftForm, title: shiftForm.title.trim(), updatedAt: "刚刚", operator: "徐振" } : shift));
      notify("排班已更新并同步至参与员工");
    } else {
      setShifts((current) => [...current, { id: `shift-${Date.now()}`, ...shiftForm, title: shiftForm.title.trim(), updatedAt: "刚刚", operator: "徐振" }]);
      notify("排班已创建并同步至参与员工");
    }
    closeDialog();
  };

  const cancelShift = () => {
    if (!selectedShiftId) return;
    setShifts((current) => current.map((shift) => shift.id === selectedShiftId ? { ...shift, status: "已取消", invalidReason: "运营调整", updatedAt: "刚刚", operator: "徐振" } : shift));
    closeDialog();
    setScheduleView("无效排班");
    notify("排班已取消并进入无效排班记录");
  };

  const openStoreEditor = (store?: LiveStore) => {
    setSelectedStoreId(store?.id ?? null);
    setStoreForm(store ? { accountId: store.accountId, name: store.name, platform: store.platform } : { accountId: activeAccounts[0]?.id ?? "", name: "", platform: "抖店" });
    setDialog("store");
  };

  const saveStore = () => {
    if (!storeForm.accountId || !storeForm.name.trim()) {
      setFormError("请选择关联直播号并填写店铺名称");
      return;
    }
    if (stores.some((store) => store.id !== selectedStoreId && store.accountId === storeForm.accountId)) {
      setFormError("该直播号已绑定店铺，可直接重新授权");
      return;
    }
    if (selectedStoreId) {
      setStores((current) => current.map((store) => store.id === selectedStoreId ? { ...store, ...storeForm, name: storeForm.name.trim(), status: "已授权", authorizedAt: "2026-09-08", expiresAt: "2027-09-08" } : store));
      notify("店铺授权已更新");
    } else {
      setStores((current) => [...current, { id: `store-${Date.now()}`, ...storeForm, name: storeForm.name.trim(), status: "已授权", authorizedAt: "2026-09-08", expiresAt: "2027-09-08" }]);
      notify("店铺授权成功，订单数据开始同步");
    }
    closeDialog();
  };

  const confirmUnbindStore = () => {
    const store = stores.find((item) => item.id === selectedStoreId);
    if (!store) return;
    setStores((current) => current.filter((item) => item.id !== store.id));
    closeDialog();
    notify(`${store.name}已解除授权`);
  };

  const productImage = (productId: string) => {
    const images: Record<string, string> = {
      "prod-1": "assets/prototype/skincare-product.jpg",
      "prod-2": "assets/prototype/luxury-skincare-set.jpg",
      "prod-3": "assets/prototype/beauty-promo-detail.jpg",
    };
    return images[productId];
  };

  const AccountSelect = ({ value, onChange, includeAll = true, className = "w-48" }: { value: AccountFilter; onChange: (value: AccountFilter) => void; includeAll?: boolean; className?: string }) => (
    <span className={`inline-block shrink-0 ${className}`}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
        {includeAll && <option value="all">全部直播号</option>}
        {activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
      </select>
    </span>
  );

  const SessionTable = ({ items, showAccount = false }: { items: LiveSession[]; showAccount?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1400px] text-left text-xs">
        <thead className="bg-slate-50 font-bold text-slate-400">
          <tr>
            <th className="px-4 py-3">直播场次</th>
            {showAccount && <th className="px-4 py-3">直播号</th>}
            <th className="px-4 py-3">主播</th>
            <th className="px-4 py-3">时长</th>
            <th className="px-4 py-3">观看人数</th>
            <th className="px-4 py-3">成交订单</th>
            <th title={METRIC_RULES.revenue} className="px-4 py-3">成交金额</th>
            <th title={METRIC_RULES.refunds} className="px-4 py-3">退款订单</th>
            <th title={METRIC_RULES.refundAmount} className="px-4 py-3">退款金额</th>
            <th className="px-4 py-3">消耗</th>
            <th className="px-4 py-3">ROI</th>
            <th className="px-4 py-3">状态</th>
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((session) => (
            <tr key={session.id} className="transition-colors hover:bg-slate-50/70">
              <td className="px-4 py-3.5">
                <button type="button" onClick={() => openSession(session.id)} className="text-left">
                  <span className="block font-black text-slate-800 hover:text-violet-700">{session.title}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">{session.startedAt} · {roomName(session.roomId)}</span>
                </button>
              </td>
              {showAccount && <td className="px-4 py-3.5 text-slate-500">{accountName(session.accountId)}</td>}
              <td className="px-4 py-3.5 font-bold text-slate-600">{employeeName(session.hostId)}</td>
              <td className="px-4 py-3.5 text-slate-500">{formatDuration(session.durationMinutes)}</td>
              <td className="px-4 py-3.5 font-bold text-slate-700">{formatNumber(session.viewers)}</td>
              <td className="px-4 py-3.5 font-bold text-slate-700">{formatNumber(session.orders)}</td>
              <td title={METRIC_RULES.revenue} className="px-4 py-3.5 font-black text-slate-900">{formatMoney(session.revenue)}</td>
              <td className="px-4 py-3.5">{formatNumber(summarizeRefunds(sessionRefunds(session), session.orders).refundOrders)}</td>
              <td className="px-4 py-3.5">{formatMoney(summarizeRefunds(sessionRefunds(session), session.orders).refundAmount)}</td>
              <td className="px-4 py-3.5 text-slate-600">{formatMoney(session.spend)}</td>
              <td title={roiTitle} className="px-4 py-3.5 font-black text-violet-700">{formatRoi(roi(session.revenue, session.spend))}</td>
              <td className="px-4 py-3.5"><Badge tone={sessionTone(session.status)}>{session.status}</Badge></td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end gap-1.5">
                  <button type="button" title="查看详情" onClick={() => openSession(session.id)} className={iconButton}><Eye className="h-4 w-4" /></button>
                  <button type="button" title="精确数据" onClick={() => openLiveData(session.id)} className={iconButton}><BarChart3 className="h-4 w-4" /></button>
                  {session.status === "直播中" && <button type="button" title="运营控制台" onClick={() => setDetailRoute({ type: "console", sessionId: session.id })} className={iconButton}><Activity className="h-4 w-4" /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderHome = () => {
    const visibleAccounts = activeAccounts.filter((account) => !homeSearch.trim() || account.name.includes(homeSearch.trim()) || account.handle.toLowerCase().includes(homeSearch.trim().toLowerCase()));
    const liveCount = sessions.filter((session) => session.status === "直播中").length;
    return (
      <div className="space-y-5">
        <PageHeader title="我的直播号" description="近30天经营结果、同步状态与当前直播">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input value={homeSearch} onChange={(event) => setHomeSearch(event.target.value)} placeholder="搜索直播号" className={`${fieldClass} w-52 pl-9`} />
          </label>
          <button type="button" onClick={() => notify("使用手册已在新窗口打开")} className={secondaryButton}><ExternalLink className="h-4 w-4" />使用手册</button>
          <button type="button" onClick={refreshLiveData} className={secondaryButton}><RefreshCw className="h-4 w-4" />刷新</button>
          <button type="button" onClick={() => openAccountEditor()} className={primaryButton}><Link2 className="h-4 w-4" />绑定直播号</button>
        </PageHeader>

        <section className="grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["正常同步", activeAccounts.filter((account) => account.status === "已绑定").length, "text-emerald-600"],
            ["首次同步中", activeAccounts.filter((account) => account.status === "首次同步中").length, "text-violet-600"],
            ["授权待处理", activeAccounts.filter((account) => account.status === "授权即将到期").length, "text-amber-600"],
            ["当前直播中", liveCount, "text-rose-600"],
          ].map(([label, value, tone], index) => <div key={String(label)} className={`px-5 py-4 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-xl font-black ${tone}`}>{value}</p></div>)}
        </section>

        {visibleAccounts.length ? (
          <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleAccounts.map((account) => {
              const accountSessions = sessions.filter((session) => session.accountId === account.id && rangeMatches(session.startedAt, "近30天"));
              const metrics = aggregateMetrics(accountSessions);
              const currentLive = accountSessions.find((session) => session.status === "直播中");
              return (
                <article key={account.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-violet-200 hover:shadow-md">
                  <button type="button" onClick={() => openAccount(account.id)} className="block w-full p-5 text-left">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${account.avatarTone} text-sm font-black text-white`}>{account.name.slice(2, 3)}</span>
                      <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-sm text-slate-900 group-hover:text-violet-700">{account.name}</strong><Badge tone={accountTone(account.status)}>{account.status}</Badge></span><span className="mt-1 block text-[11px] text-slate-400">@{account.handle} · 负责人 {account.manager}</span></span>
                    </div>
                    {currentLive && <span className="mt-4 flex items-center justify-between rounded-md bg-rose-50 px-3 py-2 text-[11px]"><span className="flex items-center gap-2 font-bold text-rose-700"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />{currentLive.title}</span><span className="text-rose-500">{formatNumber(LIVE_METRIC_SNAPSHOTS[currentLive.id]?.currentOnline)} 在线</span></span>}
                    <span className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-4">
                      {[['直播场次', metrics.sessions], ['成交订单', formatNumber(metrics.orders)], ['成交金额', formatCompactMoney(metrics.revenue)], ['ROI', formatRoi(metrics.roi)]].map(([label, value]) => <span key={String(label)} className="min-w-0"><span className="block text-[10px] text-slate-400">{label}</span><strong className="mt-1 block truncate text-xs text-slate-800">{value}</strong></span>)}
                    </span>
                  </button>
                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
                    <span>{rooms.filter((room) => room.accountId === account.id).length} 个直播间 · {account.lastSync}</span>
                    <span className="flex gap-1.5">
                      <button type="button" title="编辑直播号" onClick={() => openAccountEditor(account)} className={iconButton}><Pencil className="h-4 w-4" /></button>
                      <button type="button" title="解绑直播号" onClick={() => { setSelectedAccountId(account.id); setDialog("unbind-account"); }} className={`${iconButton} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`}><Trash2 className="h-4 w-4" /></button>
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        ) : <EmptyState title="没有匹配的直播号" description="调整关键词，或绑定新的直播号" action={<button type="button" onClick={() => openAccountEditor()} className={primaryButton}><Plus className="h-4 w-4" />绑定直播号</button>} />}
      </div>
    );
  };

  const renderRooms = () => {
    const baseSessions = filterSessionsByAccount(roomAccountFilter).filter((session) => rangeMatches(session.startedAt, roomRange));
    const filtered = baseSessions.filter((session) => {
      if (hideLive && session.status === "直播中") return false;
      if (hideSyncing && session.status === "数据同步中") return false;
      const query = roomSearch.trim().toLowerCase();
      return !query || session.title.toLowerCase().includes(query) || employeeName(session.hostId).toLowerCase().includes(query) || roomName(session.roomId).toLowerCase().includes(query);
    });
    const metrics = aggregateMetrics(filtered);
    const start = (roomPage - 1) * roomPageSize;
    const paged = filtered.slice(start, start + roomPageSize);
    return (
      <div className="-m-4 flex min-h-[calc(100vh-132px)] overflow-hidden bg-white sm:-m-6">
        <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4"><h2 className="text-sm font-black text-slate-900">我的直播号</h2><label className="relative mt-3 block"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={roomAccountSearch} onChange={(event) => setRoomAccountSearch(event.target.value)} placeholder="搜索直播号" className={`${fieldClass} pl-8`} /></label></div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            <button type="button" onClick={() => { setRoomAccountFilter("all"); setRoomPage(1); }} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left ${roomAccountFilter === "all" ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-md ${roomAccountFilter === "all" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}><Radio className="h-4 w-4" /></span><span><b className="block text-xs">全部直播号</b><small className="mt-0.5 block text-[10px] text-slate-400">汇总 {activeAccounts.length} 个账号</small></span></button>
            {activeAccounts.filter((account) => !roomAccountSearch.trim() || account.name.includes(roomAccountSearch.trim())).map((account) => <button key={account.id} type="button" onClick={() => { setRoomAccountFilter(account.id); setRoomPage(1); }} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left ${roomAccountFilter === account.id ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-md ${roomAccountFilter === account.id ? account.avatarTone + " text-white" : "bg-slate-100 text-slate-500"}`}>{account.name.slice(2, 3)}</span><span className="min-w-0"><b className="block truncate text-xs">{account.name}</b><small className="mt-0.5 block text-[10px] text-slate-400">{rooms.filter((room) => room.accountId === account.id).length} 个直播间</small></span></button>)}
          </div>
          <div className="border-t border-slate-100 p-3"><button type="button" onClick={() => { navigateTab("home"); openAccountEditor(); }} className={`${secondaryButton} w-full`}><Plus className="h-4 w-4" />添加直播号</button></div>
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-5">
          <div className="space-y-5">
            <PageHeader title={roomAccountFilter === "all" ? "直播经营汇总" : accountName(roomAccountFilter)} description={roomAccountFilter === "all" ? "全部直播号经营数据，可切换单个账号查看" : `@${accounts.find((item) => item.id === roomAccountFilter)?.handle ?? ""}`}>
              <Segmented value={roomRange} items={["今日", "昨日", "7日", "30日", "本周", "本月"]} onChange={(value) => { setRoomRange(value); setRoomPage(1); }} />
              <button type="button" onClick={() => notify("直播数据已导出")} className={secondaryButton}><Download className="h-4 w-4" />导出</button>
            </PageHeader>
            <MetricStrip items={[
              { label: "开播场次", value: `${metrics.sessions} 场`, note: undefined, icon: PlayCircle, tone: "purple" },
              { label: "总成交订单", value: formatNumber(metrics.orders), note: undefined, icon: ShoppingCart, tone: "blue" },
              { label: "总成交金额", value: formatCompactMoney(metrics.revenue), note: undefined, icon: CircleDollarSign, tone: "green" },
              { label: "总投放消耗", value: formatCompactMoney(metrics.spend), note: undefined, icon: TrendingUp, tone: "amber" },
              { label: "整体ROI", value: formatRoi(metrics.roi), note: metrics.spend === 0 ? METRIC_RULES.noSpend : undefined, icon: Activity, tone: "red" }, { label: "退款订单", value: formatNumber(metrics.refundOrders), icon: ShoppingCart, tone: "amber" }, { label: "退款金额", value: formatMoney(metrics.refundAmount), icon: CircleDollarSign, tone: "red" }, { label: "退款率", value: formatPercent(metrics.refundRate), icon: Activity, tone: "blue" },
            ]} />
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
                <Segmented value={roomMode} items={["直播间列表", "精确数值"] as const} onChange={(value) => setRoomMode(value as typeof roomMode)} />
                <label className="relative ml-auto"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={roomSearch} onChange={(event) => { setRoomSearch(event.target.value); setRoomPage(1); }} placeholder="搜索直播主题、主播" className={`${fieldClass} w-56 pl-9`} /></label>
                <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={hideLive} onChange={(event) => setHideLive(event.target.checked)} className="accent-violet-600" />不看直播中</label>
                <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={hideSyncing} onChange={(event) => setHideSyncing(event.target.checked)} className="accent-violet-600" />不看同步中</label>
              </div>
              {roomMode === "直播间列表" ? <SessionTable items={paged} showAccount={roomAccountFilter === "all"} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1850px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400"><tr>{["直播场次", "主播", "曝光人数", "进入人数", "平均在线", "最高在线", "人均停留", "新增粉丝", "评论", "点赞", "分享", "商品点击", "成交订单", "成交金额", "客单价", "转化率", "投放消耗", "ROI", "状态"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3 font-bold">{head}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">{paged.map((session) => <tr key={session.id} className="hover:bg-slate-50"><td className="px-4 py-3"><button type="button" onClick={() => openLiveData(session.id)} className="font-black text-slate-800 hover:text-violet-700">{session.title}</button><span className="mt-1 block text-[10px] text-slate-400">{session.startedAt}</span></td><td className="px-4 py-3">{employeeName(session.hostId)}</td><td className="px-4 py-3">{formatNumber(session.exposure)}</td><td className="px-4 py-3">{formatNumber(session.viewers)}</td><td className="px-4 py-3">{formatNumber(session.avgOnline)}</td><td className="px-4 py-3">{formatNumber(session.peakOnline)}</td><td className="px-4 py-3">{Math.floor(session.avgStaySeconds / 60)}分{session.avgStaySeconds % 60}秒</td><td className="px-4 py-3">{formatNumber(session.newFollowers)}</td><td className="px-4 py-3">{formatNumber(session.comments)}</td><td className="px-4 py-3">{formatNumber(session.likes)}</td><td className="px-4 py-3">{formatNumber(session.shares)}</td><td className="px-4 py-3">{formatNumber(session.productClicks)}</td><td className="px-4 py-3">{formatNumber(session.orders)}</td><td className="px-4 py-3 font-bold">{formatMoney(session.revenue)}</td><td className="px-4 py-3">{formatMoney(session.orders ? session.revenue / session.orders : 0)}</td><td className="px-4 py-3">{session.conversionRate.toFixed(2)}%</td><td className="px-4 py-3">{formatMoney(session.spend)}</td><td title={roiTitle} className="px-4 py-3 font-black text-violet-700">{formatRoi(roi(session.revenue, session.spend))}</td><td className="px-4 py-3"><Badge tone={sessionTone(session.status)}>{session.status}</Badge></td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {!paged.length && <div className="p-5"><EmptyState title="暂无匹配场次" description="尝试调整直播号、日期或搜索条件" /></div>}
              <Pagination total={filtered.length} page={roomPage} pageSize={roomPageSize} onPage={setRoomPage} onPageSize={(size) => { setRoomPageSize(size); setRoomPage(1); }} />
            </section>
          </div>
        </section>
      </div>
    );
  };

  const weekDates = [
    { date: "2026-09-08", label: "09-08", weekday: "周二" },
    { date: "2026-09-09", label: "09-09", weekday: "周三" },
    { date: "2026-09-10", label: "09-10", weekday: "周四" },
    { date: "2026-09-11", label: "09-11", weekday: "周五" },
    { date: "2026-09-12", label: "09-12", weekday: "周六" },
    { date: "2026-09-13", label: "09-13", weekday: "周日" },
    { date: "2026-09-14", label: "09-14", weekday: "周一" },
  ];

  const renderSchedule = () => {
    const scopedShifts = shifts.filter((shift) => scheduleAccountFilter === "all" || shift.accountId === scheduleAccountFilter);
    const validShifts = scopedShifts.filter((shift) => shift.status !== "已取消");
    const invalidShifts = scopedShifts.filter((shift) => shift.status === "已取消");
    const scopedSessions = filterSessionsByAccount(scheduleAccountFilter);
    return (
      <div className="space-y-5">
        <PageHeader title="直播排班" description="按直播号安排班次，系统自动检查直播间占用与人员跨账号撞班">
          <AccountSelect value={scheduleAccountFilter} onChange={setScheduleAccountFilter} />
          <button type="button" onClick={() => setDialog("schedule-logs")} className={secondaryButton}><History className="h-4 w-4" />操作记录</button>
          <button type="button" onClick={() => setDialog("schedule-import")} className={secondaryButton}><Upload className="h-4 w-4" />导入排班</button>
          <button type="button" onClick={() => openShiftEditor(undefined, scheduleAccountFilter === "all" ? undefined : scheduleAccountFilter)} className={primaryButton}><Plus className="h-4 w-4" />新增排班</button>
        </PageHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented value={scheduleView} items={["排班计划", "上播记录", "无效排班"] as const} onChange={(value) => setScheduleView(value as typeof scheduleView)} />
          <span className="ml-auto text-xs text-slate-400">2026年9月8日 - 9月14日</span>
        </div>

        {scheduleView === "排班计划" && <>
          <section className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ["未来7天排班", `${validShifts.length} 场`, CalendarDays, "text-violet-600"],
              ["已确认", `${validShifts.filter((shift) => shift.status === "已确认").length} 场`, Check, "text-emerald-600"],
              ["待确认", `${validShifts.filter((shift) => shift.status === "待确认").length} 场`, Clock3, "text-amber-600"],
              ["预计直播时长", `${sumBy(validShifts, (shift) => shift.end - shift.start)} 小时`, Activity, "text-blue-600"],
            ] as const).map(([label, value, Icon, tone]) => <div key={String(label)} className="flex items-center gap-3 bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-50"><Icon className={`h-4 w-4 ${tone}`} /></span><span><span className="block text-[11px] text-slate-400">{label}</span><b className="mt-1 block text-base text-slate-900">{value}</b></span></div>)}
          </section>
          <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <div className="grid min-w-[1050px] grid-cols-7 divide-x divide-slate-100">
              {weekDates.map((day) => {
                const dayShifts = validShifts.filter((shift) => shift.date === day.date);
                return <div key={day.date} className="min-h-[430px] bg-white"><div className={`border-b border-slate-100 px-3 py-3 text-center ${day.date === "2026-09-08" ? "bg-violet-50" : "bg-slate-50"}`}><b className="block text-xs text-slate-800">{day.weekday}</b><span className="mt-0.5 block text-[10px] text-slate-400">{day.label}{day.date === "2026-09-08" ? " · 今天" : ""}</span></div><div className="space-y-2 p-2">{dayShifts.map((shift) => <button key={shift.id} type="button" onClick={() => openShiftEditor(shift)} className="block w-full rounded-md border border-violet-100 bg-violet-50/70 p-3 text-left transition hover:border-violet-300 hover:bg-violet-50"><span className="flex items-center justify-between gap-2"><b className="text-[11px] text-violet-800">{String(shift.start).padStart(2, "0")}:00-{String(shift.end).padStart(2, "0")}:00</b><Badge tone={shiftTone(shift.status)}>{shift.status}</Badge></span><strong className="mt-2 block text-xs text-slate-800">{shift.title}</strong><span className="mt-1 block truncate text-[10px] text-slate-400">{accountName(shift.accountId)}</span><span className="mt-2 flex -space-x-1">{shift.participantIds.slice(0, 4).map((id) => <span key={id} title={employeeName(id)} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-[9px] font-bold text-white">{employeeName(id).slice(0, 1)}</span>)}{shift.participantIds.length > 4 && <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600">+{shift.participantIds.length - 4}</span>}</span></button>)}<button type="button" onClick={() => openShiftEditor(undefined, scheduleAccountFilter === "all" ? undefined : scheduleAccountFilter, day.date, 9)} className="flex h-10 w-full items-center justify-center rounded-md border border-dashed border-slate-200 text-slate-300 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"><Plus className="h-4 w-4" /></button></div></div>;
              })}
            </div>
          </section>
        </>}

        {scheduleView === "上播记录" && <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="text-sm font-black text-slate-900">实际上播记录</h2><p className="mt-1 text-[11px] text-slate-400">已同步 {scopedSessions.length} 场直播，与排班计划自动关联</p></div><button type="button" onClick={() => notify("上播记录已导出")} className={secondaryButton}><Download className="h-4 w-4" />导出</button></div><SessionTable items={scopedSessions} showAccount={scheduleAccountFilter === "all"} /><Pagination total={scopedSessions.length} page={1} pageSize={10} onPage={() => undefined} onPageSize={() => undefined} /></section>}

        {scheduleView === "无效排班" && <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-black text-slate-900">无效排班记录</h2><p className="mt-1 text-[11px] text-slate-400">取消或因直播号解绑失效的排班均保留操作记录</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["日期", "直播主题", "直播号 / 直播间", "原时段", "参与员工", "无效原因", "操作记录", "操作"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{invalidShifts.map((shift) => <tr key={shift.id}><td className="px-4 py-3 font-bold text-slate-700">{shift.date}</td><td className="px-4 py-3 font-bold text-slate-800">{shift.title}</td><td className="px-4 py-3 text-slate-500">{accountName(shift.accountId)}<span className="block text-[10px] text-slate-400">{roomName(shift.roomId)}</span></td><td className="px-4 py-3">{shift.start}:00-{shift.end}:00</td><td className="px-4 py-3">{shift.participantIds.map(employeeName).join("、") || "未配置"}</td><td className="px-4 py-3"><Badge tone="red">{shift.invalidReason ?? "已取消"}</Badge></td><td className="px-4 py-3 text-slate-500">{shift.updatedAt}<span className="block text-[10px] text-slate-400">{shift.operator}</span></td><td className="px-4 py-3"><button type="button" onClick={() => openShiftEditor(undefined, shift.accountId, shift.date, shift.start)} className="font-bold text-violet-600">重新排班</button></td></tr>)}</tbody></table></div>{!invalidShifts.length && <div className="p-5"><EmptyState title="暂无无效排班" description="取消的排班将在这里留档" /></div>}</section>}
      </div>
    );
  };

  const renderHosts = () => {
    const roleEmployees = employees.filter((employee) => employee.status !== "已离职" && employee.assignments.some((assignment) => assignment.role === hostRole && (hostAccountFilter === "all" || assignment.accountId === hostAccountFilter)) && (!hostSearch.trim() || employee.name.includes(hostSearch.trim()) || employee.login.includes(hostSearch.trim())));
    const scopedShifts = shifts.filter((shift) => shift.status !== "已取消" && (hostAccountFilter === "all" || shift.accountId === hostAccountFilter));
    const hostMetrics = roleEmployees.map((employee) => {
      const assignmentAccounts = employee.assignments.filter((assignment) => assignment.role === hostRole && (hostAccountFilter === "all" || assignment.accountId === hostAccountFilter)).map((assignment) => assignment.accountId);
      const ownedSessions = hostRole === "主播" ? sessions.filter((session) => session.hostId === employee.id && assignmentAccounts.includes(session.accountId) && rangeMatches(session.startedAt, hostRange)) : sessions.filter((session) => assignmentAccounts.includes(session.accountId) && rangeMatches(session.startedAt, hostRange));
      const employeeShifts = scopedShifts.filter((shift) => shift.participantIds.includes(employee.id));
      const metric = aggregateMetrics(ownedSessions);
      return { employee, metric, employeeShifts, assignmentAccounts };
    });
    return <div className="space-y-5">
      <PageHeader title="主播数据" description="查看主播及直播部门各岗位在不同直播号的工作与经营表现"><button type="button" onClick={() => notify("主播数据报表已导出")} className={secondaryButton}><Download className="h-4 w-4" />导出报表</button></PageHeader>
      <div className="flex flex-wrap items-center gap-3"><Segmented value={hostView} items={["主播数据", "排班计划"] as const} onChange={(value) => setHostView(value as typeof hostView)} /><AccountSelect value={hostAccountFilter} onChange={setHostAccountFilter} /><select value={hostRole} onChange={(event) => setHostRole(event.target.value as LiveRole)} className={fieldClass} style={{ width: "8rem" }}>{LIVE_ROLES.filter((role) => role !== "部门管理员").map((role) => <option key={role}>{role}</option>)}</select><Segmented value={hostRange} items={["今日", "近7天", "本月"]} onChange={setHostRange} /><label className="relative ml-auto"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={hostSearch} onChange={(event) => setHostSearch(event.target.value)} placeholder="搜索员工" className={`${fieldClass} w-52 pl-9`} /></label></div>
      {hostView === "主播数据" ? <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["员工", "负责直播号", "岗位", "直播/参与场次", "观看人数", "成交订单", "成交金额", "ROI", "排班时长", "操作"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{hostMetrics.map(({ employee, metric, employeeShifts, assignmentAccounts }) => <tr key={employee.id} className="hover:bg-slate-50"><td className="px-4 py-3"><button type="button" onClick={() => setDetailRoute({ type: "host", employeeId: employee.id })} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 font-black text-violet-700">{employee.name.slice(0, 1)}</span><span><b className="block text-slate-800">{employee.name}</b><small className="text-slate-400">{employee.employment} · {employee.status}</small></span></button></td><td className="px-4 py-3"><div className="flex max-w-xs flex-wrap gap-1">{assignmentAccounts.map((id) => <Badge key={id} tone="slate">{accountName(id)}</Badge>)}</div></td><td className="px-4 py-3"><Badge tone="purple">{hostRole}</Badge></td><td className="px-4 py-3 font-black text-slate-800">{hostRole === "主播" ? metric.sessions : employeeShifts.length}</td><td className="px-4 py-3">{formatNumber(metric.viewers)}</td><td className="px-4 py-3">{formatNumber(metric.orders)}</td><td className="px-4 py-3 font-black">{formatMoney(metric.revenue)}</td><td title={roiTitle} className="px-4 py-3 font-black text-violet-700">{formatRoi(metric.roi)}</td><td className="px-4 py-3">{sumBy(employeeShifts, (shift) => shift.end - shift.start)} 小时</td><td className="px-4 py-3"><button type="button" onClick={() => setDetailRoute({ type: "host", employeeId: employee.id })} className="font-bold text-violet-600">查看详情</button></td></tr>)}</tbody></table></div>{!hostMetrics.length && <div className="p-5"><EmptyState title="暂无匹配员工" description="调整直播号、岗位或搜索条件" /></div>}</section> : <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["日期", "时间", "直播主题", "直播号", "直播间", "参与人员", "状态"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{scopedShifts.map((shift) => <tr key={shift.id}><td className="px-4 py-3 font-bold">{shift.date}</td><td className="px-4 py-3">{shift.start}:00-{shift.end}:00</td><td className="px-4 py-3 font-bold text-slate-800">{shift.title}</td><td className="px-4 py-3">{accountName(shift.accountId)}</td><td className="px-4 py-3">{roomName(shift.roomId)}</td><td className="px-4 py-3">{shift.participantIds.map(employeeName).join("、")}</td><td className="px-4 py-3"><Badge tone={shiftTone(shift.status)}>{shift.status}</Badge></td></tr>)}</tbody></table></div></section>}
    </div>;
  };

  const renderTeam = () => {
    const scopedEmployees = employees.filter((employee) => teamAccountFilter === "all" || employee.assignments.some((assignment) => assignment.accountId === teamAccountFilter));
    let visibleEmployees = scopedEmployees.filter((employee) => !teamSearch.trim() || employee.name.includes(teamSearch.trim()) || employee.login.includes(teamSearch.trim()) || employee.phone.includes(teamSearch.trim()));
    if (teamStatus !== "全部状态") visibleEmployees = visibleEmployees.filter((employee) => employee.status === teamStatus);
    if (teamGroup === "按在职状态") visibleEmployees = [...visibleEmployees].sort((a, b) => a.status.localeCompare(b.status));
    if (teamGroup === "按直播号") visibleEmployees = [...visibleEmployees].sort((a, b) => accountName(a.assignments[0]?.accountId ?? "").localeCompare(accountName(b.assignments[0]?.accountId ?? "")));
    if (teamGroup === "按岗位") visibleEmployees = [...visibleEmployees].sort((a, b) => (a.assignments[0]?.role ?? "").localeCompare(b.assignments[0]?.role ?? ""));
    const visibleReductions = reductions.filter((record) => teamAccountFilter === "all" || record.roles.includes(accountName(teamAccountFilter)));
    const start = (teamPage - 1) * teamPageSize;
    const pagedEmployees = visibleEmployees.slice(start, start + teamPageSize);
    return <div className="space-y-5">
      <PageHeader title="部门管理" description="一个员工可关联多个直播号，并在不同直播号承担不同岗位"><button type="button" onClick={() => notify("员工导入模板已下载")} className={secondaryButton}><Download className="h-4 w-4" />下载模板</button><button type="button" onClick={() => notify("员工导入完成，重复账号已跳过")} className={secondaryButton}><Upload className="h-4 w-4" />批量导入</button><button type="button" onClick={() => openEmployeeEditor()} className={primaryButton}><UserPlus className="h-4 w-4" />新增员工</button></PageHeader>
      <Segmented value={teamView} items={["部门管理", "岗位设置"] as const} onChange={(value) => setTeamView(value as typeof teamView)} />
      {teamView === "部门管理" ? <>
        <section className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">{[["员工总数", scopedEmployees.length], ["在职员工", scopedEmployees.filter((item) => item.status === "在职").length], ["跨账号员工", scopedEmployees.filter((item) => new Set(item.assignments.map((assignment) => assignment.accountId)).size > 1).length], ["支持晚班", scopedEmployees.filter((item) => item.nightShift && item.status === "在职").length]].map(([label, value]) => <div key={String(label)} className="bg-white px-5 py-4"><span className="text-[11px] text-slate-400">{label}</span><b className="mt-1 block text-lg text-slate-900">{value}</b></div>)}</section>
        <div className="flex flex-wrap items-center gap-3"><Segmented value={teamGroup} items={["全部员工", "按直播号", "按岗位", "按在职状态", "减员记录"]} onChange={(value) => { setTeamGroup(value); setTeamPage(1); }} /><AccountSelect value={teamAccountFilter} onChange={(value) => { setTeamAccountFilter(value); setTeamPage(1); }} />{teamGroup !== "减员记录" && <><label className="relative ml-auto"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="搜索姓名、账号、手机号" className={`${fieldClass} w-60 pl-9`} /></label><select value={teamStatus} onChange={(event) => setTeamStatus(event.target.value)} className={fieldClass} style={{ width: "8rem" }}><option>全部状态</option><option>在职</option><option>已停用</option><option>已离职</option></select></>}</div>
        {teamGroup !== "减员记录" ? <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["员工信息", "登录账号 / 手机号", "直播号与岗位", "用工类型", "入职日期", "晚班", "状态", "操作"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{pagedEmployees.map((employee) => <tr key={employee.id} className="hover:bg-slate-50"><td className="px-4 py-3"><button type="button" onClick={() => setDetailRoute({ type: "host", employeeId: employee.id })} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 font-black text-violet-700">{employee.name.slice(0, 1)}</span><b className="text-slate-800">{employee.name}</b></button></td><td className="px-4 py-3 text-slate-600">{employee.login}<span className="mt-1 block text-[10px] text-slate-400">{employee.phone}</span></td><td className="px-4 py-3"><div className="flex max-w-md flex-wrap gap-1.5">{employee.assignments.map((assignment, index) => <Badge key={`${assignment.accountId}-${assignment.role}-${index}`} tone="purple">{accountName(assignment.accountId)} · {assignment.role}</Badge>)}</div></td><td className="px-4 py-3">{employee.employment}</td><td className="px-4 py-3">{employee.joinDate}</td><td className="px-4 py-3"><button type="button" onClick={() => openNightShift(employee)} className={`rounded px-2 py-1 font-bold ${employee.nightShift ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{employee.nightShift ? "支持" : "不支持"}</button></td><td className="px-4 py-3"><Badge tone={employee.status === "在职" ? "green" : employee.status === "已停用" ? "amber" : "slate"}>{employee.status}</Badge></td><td className="px-4 py-3"><div className="flex gap-1.5"><button type="button" title="编辑员工" onClick={() => openEmployeeEditor(employee)} className={iconButton}><Pencil className="h-4 w-4" /></button>{employee.status !== "已离职" && <button type="button" title="员工减员" onClick={() => openReduceEmployee(employee)} className={`${iconButton} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`}><UserMinus className="h-4 w-4" /></button>}</div></td></tr>)}</tbody></table></div><Pagination total={visibleEmployees.length} page={teamPage} pageSize={teamPageSize} onPage={setTeamPage} onPageSize={(size) => { setTeamPageSize(size); setTeamPage(1); }} /></section> : <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["员工", "原直播号岗位", "入职日期", "减员日期", "最后工作日", "原因", "备注", "操作人"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleReductions.map((record) => <tr key={record.id}><td className="px-4 py-3 font-black text-slate-800">{record.employeeName}</td><td className="px-4 py-3 text-slate-600">{record.roles}</td><td className="px-4 py-3">{record.joinDate}</td><td className="px-4 py-3">{record.reducedAt}</td><td className="px-4 py-3">{record.lastWorkDate}</td><td className="px-4 py-3"><Badge tone="slate">{record.reason}</Badge></td><td className="px-4 py-3 text-slate-500">{record.note}</td><td className="px-4 py-3">{record.operator}</td></tr>)}</tbody></table></div><Pagination total={visibleReductions.length} page={1} pageSize={10} onPage={() => undefined} onPageSize={() => undefined} /></section>}
      </> : <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-black text-slate-900">岗位权限</h2><p className="mt-1 text-[11px] text-slate-400">员工拥有多个岗位时，合并其全部岗位权限</p></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr><th className="px-5 py-3">岗位</th><th className="px-5 py-3">当前人数</th><th className="px-5 py-3">权限范围</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{LIVE_ROLES.map((role) => <tr key={role}><td className="px-5 py-4"><Badge tone="purple">{role}</Badge></td><td className="px-5 py-4 font-bold">{employees.filter((employee) => employee.assignments.some((assignment) => assignment.role === role)).length}</td><td className="px-5 py-4 text-slate-500">{rolePermissions[role].join("、")}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => { setSelectedRole(role); setDialog("role-permission"); }} className="font-bold text-violet-600">编辑权限</button></td></tr>)}</tbody></table></div></section>}
    </div>;
  };

  const renderStores = () => {
    const visibleStores = stores.filter((store) => storeAccountFilter === "all" || store.accountId === storeAccountFilter);
    const visibleProducts = products.filter((product) => storeAccountFilter === "all" || product.accountId === storeAccountFilter);
    return <div className="space-y-5">
      <PageHeader title="店铺管理" description="查看店铺授权、商品数据与销售表现"><AccountSelect value={storeAccountFilter} onChange={setStoreAccountFilter} /><button type="button" onClick={() => openStoreEditor()} className={primaryButton}><Link2 className="h-4 w-4" />绑定店铺</button></PageHeader>
      <section className="grid gap-4 lg:grid-cols-3">{visibleStores.map((store) => <article key={store.id} className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-600"><Store className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><b className="truncate text-sm text-slate-900">{store.name}</b><Badge tone={store.status === "已授权" ? "green" : store.status === "即将到期" ? "amber" : "red"}>{store.status}</Badge></span><small className="mt-1 block text-slate-400">{store.platform} · {accountName(store.accountId)}</small></span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-[11px]"><span className="text-slate-400">授权时间<b className="mt-1 block text-slate-700">{store.authorizedAt}</b></span><span className="text-slate-400">到期时间<b className="mt-1 block text-slate-700">{store.expiresAt}</b></span></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => openStoreEditor(store)} className={`${secondaryButton} flex-1`}>{store.status === "已授权" ? "重新授权" : "立即续期"}</button><button type="button" title="解除授权" onClick={() => { setSelectedStoreId(store.id); setDialog("unbind-store"); }} className={`${iconButton} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`}><Trash2 className="h-4 w-4" /></button></div></article>)}</section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="min-w-0 flex-1 basis-56"><h2 className="text-sm font-black text-slate-900">直播商品</h2><p className="mt-1 text-[11px] text-slate-400">近30天商品销售数据；库存状态由已授权店铺同步</p></div><button type="button" onClick={() => notify("商品数据已同步")} className={`${secondaryButton} shrink-0`}><RefreshCw className="h-4 w-4" />同步商品</button></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["商品", "直播号", "分类", "售价", "库存", "预警值", "成交件数", "成交金额", "退款率", "状态", "操作"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleProducts.map((product) => <tr key={product.id} className="hover:bg-slate-50"><td className="px-4 py-3"><button type="button" onClick={() => setDetailRoute({ type: "product", productId: product.id })} className="flex items-center gap-3 text-left">{productImage(product.id) ? <img src={productImage(product.id)} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-slate-400"><Package className="h-5 w-5" /></span>}<span><b className="block max-w-60 truncate text-slate-800">{product.name}</b><small className="text-slate-400">ID {product.id}</small></span></button></td><td className="px-4 py-3">{accountName(product.accountId)}</td><td className="px-4 py-3">{product.category}</td><td className="px-4 py-3 font-bold">{formatMoney(product.price)}</td><td className={`px-4 py-3 font-black ${product.stock <= product.warningStock ? "text-rose-600" : "text-slate-700"}`}>{formatNumber(product.stock)}</td><td className="px-4 py-3">{formatNumber(product.warningStock)}</td><td className="px-4 py-3">{formatNumber(product.sales)}</td><td className="px-4 py-3 font-black">{formatMoney(product.gmv)}</td><td className="px-4 py-3">{product.refundRate == null ? "--" : product.refundRate.toFixed(2) + "%"}</td><td className="px-4 py-3"><Badge tone={product.status === "在售" ? (product.stock <= product.warningStock ? "amber" : "green") : product.status === "已售罄" ? "red" : "slate"}>{product.status}</Badge></td><td className="px-4 py-3"><button type="button" title="查看商品详情" onClick={() => setDetailRoute({ type: "product", productId: product.id })} className={iconButton}><Eye className="h-4 w-4" /></button></td></tr>)}</tbody></table></div><Pagination total={visibleProducts.length} page={1} pageSize={10} onPage={() => undefined} onPageSize={() => undefined} /></section>
    </div>;
  };

  const renderTools = () => (
    <div className="min-h-full">
      <button type="button" onClick={() => setDialog("tool")} className="group w-full max-w-[300px] overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-violet-200 hover:shadow-md">
        <span className="flex h-40 items-center justify-center bg-blue-50">
          <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-white text-blue-500 shadow-lg shadow-blue-100/80 transition-transform group-hover:scale-105"><MonitorPlay className="h-9 w-9" /></span>
        </span>
        <span className="block px-5 py-5">
          <b className="block text-sm font-black text-slate-900">云管家智播助手</b>
          <small className="mt-2 block text-xs leading-5 text-slate-500">直播间中控插件，支持自动点击商品讲解、自动发送评论。</small>
        </span>
      </button>
    </div>
  );

  const renderAccountDetail = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId);
    if (!account) return <EmptyState title="直播号不存在" description="该直播号可能已经解绑" />;
    const accountSessions = sessions.filter((session) => session.accountId === account.id && rangeMatches(session.startedAt, "近30天"));
    const metrics = aggregateMetrics(accountSessions);
    const currentLive = accountSessions.find((session) => session.status === "直播中");
    const accountProducts = products.filter((product) => product.accountId === account.id);
    const accountEmployees = employees.filter((employee) => employee.assignments.some((assignment) => assignment.accountId === account.id));
    return <div className="space-y-5">
      <PageHeader title={account.name} description={`@${account.handle} · 负责人 ${account.manager} · ${account.lastSync}`} onBack={() => setDetailRoute(null)}>
        {currentLive && <button type="button" onClick={() => setDetailRoute({ type: "console", sessionId: currentLive.id })} className={primaryButton}><Activity className="h-4 w-4" />进入控制台</button>}
        <button type="button" onClick={() => { navigateTab("schedule"); setScheduleAccountFilter(account.id); }} className={secondaryButton}><CalendarDays className="h-4 w-4" />查看排班</button>
        <button type="button" onClick={() => openAccountEditor(account)} className={secondaryButton}><Pencil className="h-4 w-4" />编辑</button>
        <button type="button" onClick={() => { setSelectedAccountId(account.id); setDialog("unbind-account"); }} className={`${secondaryButton} border-rose-200 text-rose-600 hover:bg-rose-50`}><Trash2 className="h-4 w-4" />解绑</button>
      </PageHeader>
      {currentLive && <section className="flex flex-wrap items-center gap-4 rounded-lg border border-rose-100 bg-rose-50 px-5 py-4"><span className="flex items-center gap-2 text-xs font-black text-rose-700"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />直播中</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-900">{currentLive.title}</b><small className="text-slate-500">{currentLive.startedAt} · 主播 {employeeName(currentLive.hostId)} · 已直播 {Math.floor(currentLive.durationMinutes / 60)}小时{currentLive.durationMinutes % 60}分</small></span>{[["当前在线", formatNumber(LIVE_METRIC_SNAPSHOTS[currentLive.id]?.currentOnline)], ["当前GMV", formatCompactMoney(currentLive.revenue)], ["成交订单", formatNumber(currentLive.orders)]].map(([label, value]) => <span key={label} className="min-w-24 text-center"><b className="block text-sm text-slate-900">{value}</b><small className="text-[10px] text-slate-400">{label}</small></span>)}</section>}
      <MetricStrip items={[
        { label: "直播场次", value: `${metrics.sessions} 场`, note: "近30日已同步记录", icon: Video, tone: "purple" },
        { label: "累计观看", value: formatNumber(metrics.viewers), note: undefined, icon: Eye, tone: "blue" },
        { label: "成交订单", value: formatNumber(metrics.orders), note: undefined, icon: ShoppingCart, tone: "green" },
        { label: "累计GMV", value: formatCompactMoney(metrics.revenue), note: undefined, icon: CircleDollarSign, tone: "amber" },
        { label: "整体ROI", value: formatRoi(metrics.roi), note: metrics.spend === 0 ? METRIC_RULES.noSpend : undefined, icon: TrendingUp, tone: "red" }, { label: "退款订单", value: formatNumber(metrics.refundOrders), icon: ShoppingCart, tone: "amber" }, { label: "退款金额", value: formatMoney(metrics.refundAmount), icon: CircleDollarSign, tone: "red" }, { label: "退款率", value: formatPercent(metrics.refundRate), icon: Activity, tone: "blue" },
      ]} />
      <Segmented value={accountDetailTab} items={["经营概览", "直播记录", "商品数据", "部门成员"] as const} onChange={(value) => setAccountDetailTab(value as typeof accountDetailTab)} />
      {accountDetailTab === "经营概览" && <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">GMV 趋势</h2><span className="text-xs text-slate-400">最近已同步的最多7场直播</span></div>
          {accountSessions.length ? <TrendChart values={accountSessions.slice().sort((a, b) => a.startedAt.localeCompare(b.startedAt)).slice(-7).map((session) => session.revenue)} labels={accountSessions.slice().sort((a, b) => a.startedAt.localeCompare(b.startedAt)).slice(-7).map((session) => session.startedAt.slice(5, 10))} /> : <EmptyState title="暂无直播场次" description="等待直播数据同步" />}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">流量来源</h2><EmptyState title="暂无流量来源明细" description="当前数据不包含分来源统计" /></section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2"><h2 className="text-sm font-black text-slate-900">经营转化漏斗</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{[
            ["曝光人数", accountSessions.length ? sumBy(accountSessions, (item) => item.exposure) : null],
            ["进入直播间", accountSessions.length ? metrics.viewers : null],
            ["商品点击", accountSessions.length ? sumBy(accountSessions, (item) => item.productClicks) : null],
            ["提交订单", null], ["成交订单", accountSessions.length ? metrics.orders : null],
          ].map(([label, value]) => <div key={String(label)} title={value == null ? "暂无对应明细" : metricTitle(String(label))} className="bg-slate-50 p-4 text-center"><span className="text-xs text-slate-400">{label}</span><b className="mt-1 block break-words text-base text-slate-900">{formatNumber(typeof value === "number" ? value : null)}</b></div>)}</div>
        </section>
      </div>}

      {accountDetailTab === "直播记录" && <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><SessionTable items={accountSessions} /><Pagination total={accountSessions.length} page={1} pageSize={10} onPage={() => undefined} onPageSize={() => undefined} /></section>}
      {accountDetailTab === "商品数据" && <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["商品", "售价", "成交件数", "成交金额", "退款率", "库存", "状态", "操作"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{accountProducts.map((product) => <tr key={product.id}><td className="px-4 py-3 font-black text-slate-800">{product.name}</td><td className="px-4 py-3">{formatMoney(product.price)}</td><td className="px-4 py-3">{formatNumber(product.sales)}</td><td className="px-4 py-3 font-black">{formatMoney(product.gmv)}</td><td className="px-4 py-3">{formatPercent(product.refundRate)}</td><td className="px-4 py-3">{product.stock}</td><td className="px-4 py-3"><Badge tone={product.status === "在售" ? "green" : "red"}>{product.status}</Badge></td><td className="px-4 py-3"><button type="button" onClick={() => setDetailRoute({ type: "product", productId: product.id })} className="font-bold text-violet-600">详情分析</button></td></tr>)}</tbody></table></div></section>}
      {accountDetailTab === "部门成员" && <div className="space-y-4">{LIVE_ROLES.map((role) => { const members = accountEmployees.filter((employee) => employee.assignments.some((assignment) => assignment.accountId === account.id && assignment.role === role)); if (!members.length) return null; return <section key={role} className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">{role}</h2><Badge tone="slate">{members.length} 人</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{members.map((employee) => <button type="button" key={employee.id} onClick={() => setDetailRoute({ type: "host", employeeId: employee.id })} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-left hover:border-violet-200 hover:bg-violet-50"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 font-black text-violet-700">{employee.name.slice(0, 1)}</span><span><b className="block text-xs text-slate-800">{employee.name}</b><small className="text-slate-400">{employee.employment} · {employee.nightShift ? "可晚班" : "仅白班"}</small></span></button>)}</div></section>; })}</div>}
    </div>;
  };

  const renderSessionDetail = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return <EmptyState title="直播记录不存在" description="该直播记录可能尚未同步" />;
    const metrics = aggregateMetrics([session]);
    const timeline = LIVE_TIMELINES[session.id];
    const relatedProducts = products.filter((product) => session.productIds.includes(product.id));
    return <div className="space-y-5"><PageHeader title={session.title} description={`${accountName(session.accountId)} · ${session.startedAt} · ${roomName(session.roomId)}`} onBack={() => setDetailRoute(null)}><button type="button" onClick={() => openLiveData(session.id)} className={secondaryButton}><BarChart3 className="h-4 w-4" />精确数据</button><button type="button" onClick={() => openReview(session.id)} className={secondaryButton}><FileSpreadsheet className="h-4 w-4" />直播复盘</button>{session.status === "直播中" && <button type="button" onClick={() => setDetailRoute({ type: "console", sessionId: session.id })} className={primaryButton}><Activity className="h-4 w-4" />运营控制台</button>}</PageHeader>{session.dataNote && <div className={`flex items-center gap-3 rounded-md px-4 py-3 text-xs ${session.status === "数据异常" ? "bg-rose-50 text-rose-700" : "bg-violet-50 text-violet-700"}`}><AlertTriangle className="h-4 w-4 shrink-0" />{session.dataNote}<button type="button" onClick={refreshLiveData} className="ml-auto font-black">重新同步</button></div>}<MetricStrip items={[{ label: "累计观看", value: formatNumber(session.viewers), note: `曝光 ${formatNumber(session.exposure)}`, icon: Eye, tone: "blue" }, { label: "成交订单", value: formatNumber(session.orders), note: `转化率 ${session.conversionRate}%`, icon: ShoppingCart, tone: "green" }, { label: "成交金额", value: formatMoney(session.revenue), note: `成交 ${session.sales} 件`, icon: CircleDollarSign, tone: "amber" }, { label: "投放消耗", value: formatMoney(session.spend), note: "全场累计", icon: TrendingUp, tone: "red" }, { label: "全场 ROI", value: formatRoi(metrics.roi), note: session.spend === 0 ? METRIC_RULES.noSpend : undefined, icon: Activity, tone: "purple" }, { label: "退款订单", value: formatNumber(metrics.refundOrders), icon: ShoppingCart, tone: "amber" }, { label: "退款金额", value: formatMoney(metrics.refundAmount), icon: CircleDollarSign, tone: "red" }, { label: "退款率", value: formatPercent(metrics.refundRate), icon: Activity, tone: "blue" }]} /><div className="grid gap-4 xl:grid-cols-2"><section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">在线人数趋势</h2><Badge tone={sessionTone(session.status)}>{session.status}</Badge></div>{timeline ? <TrendChart values={timeline.map((point) => point.online)} labels={timeline.map((point) => `${point.minute}m`)} /> : <EmptyState title="暂无在线时序数据" description="当前场次尚无对应时序明细" />}</section><section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">互动表现</h2><div className="mt-5 grid grid-cols-2 gap-3">{[["平均在线", formatNumber(session.avgOnline)], ["最高在线", formatNumber(session.peakOnline)], ["人均停留", `${Math.floor(session.avgStaySeconds / 60)}分${session.avgStaySeconds % 60}秒`], ["新增粉丝", formatNumber(session.newFollowers)], ["评论数", formatNumber(session.comments)], ["分享数", formatNumber(session.shares)]].map(([label, value]) => <div key={label} className="rounded-md bg-slate-50 p-3"><span className="text-[10px] text-slate-400">{label}</span><b className="mt-1 block text-sm text-slate-800">{value}</b></div>)}</div></section></div><section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-black text-slate-900">本场商品表现</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["商品", "售价", "成交件数", "成交金额", "退款率", "库存", "操作"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{relatedProducts.map((product) => <tr key={product.id}><td className="px-4 py-3 font-black text-slate-800">{product.name}</td><td className="px-4 py-3">{formatMoney(product.price)}</td><td className="px-4 py-3">{formatNumber(sessionProductMetrics(session, product.id)?.sales)}</td><td className="px-4 py-3 font-bold">{formatMoney(sessionProductMetrics(session, product.id)?.revenue)}</td><td className="px-4 py-3">{formatPercent(sessionProductMetrics(session, product.id)?.refundRate)}</td><td className="px-4 py-3">{product.stock}</td><td className="px-4 py-3"><button type="button" onClick={() => setDetailRoute({ type: "product", productId: product.id })} className="font-bold text-violet-600">商品详情</button></td></tr>)}</tbody></table></div></section></div>;
  };

  const renderLiveData = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return <EmptyState title="暂无精确数据" description="请等待直播数据同步完成" />;
    const comparison = compareLiveMetrics(session, sessions, liveCompare);
    const compare = comparison.metrics;
    const metrics = aggregateMetrics([session]);
    const timeline = LIVE_TIMELINES[session.id];
    const rows = [
      { label: "成交金额", value: session.revenue, baseline: compare?.revenue, format: formatMoney },
      { label: "成交订单", value: session.orders, baseline: compare?.orders, format: formatNumber },
      { label: "累计观看", value: session.viewers, baseline: compare?.viewers, format: formatNumber },
      { label: "平均在线", value: session.avgOnline, baseline: compare?.avgOnline, format: formatNumber },
      { label: "新增粉丝", value: session.newFollowers, baseline: compare?.newFollowers, format: formatNumber },
      { label: "全场ROI", value: metrics.roi, baseline: compare?.roi, format: formatRoi },
    ];
    return <div className="space-y-5">
      <PageHeader title="单场精确数据" description={`${session.title} · ${LIVE_METRIC_SNAPSHOTS[session.id]?.sampledAt ?? "数据待同步"}`} onBack={() => setDetailRoute({ type: "session", sessionId })}>
        <Segmented value={liveCompare} items={["vs 上一场", "vs 近7场均值", "vs 行业均值"] as const} onChange={(value) => setLiveCompare(value as typeof liveCompare)} />
        <button type="button" onClick={() => notify("精确数据报告已导出")} className={secondaryButton}><Download className="h-4 w-4" />导出报告</button>
      </PageHeader>
      <p className="text-xs text-slate-500" role="status">{comparison.note}{session.status === "直播中" ? " · 本场为截至同步时刻的累计数据" : ""}</p>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ label, value, baseline, format }) => {
          const delta = value != null && baseline != null ? value - baseline : null;
          return <div key={label} title={metricTitle(label)} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-xs text-slate-500">{label}</span><b className="mt-1 block break-words text-lg text-slate-900">{format(value)}</b>
            <small className={`mt-1 block font-bold ${delta == null ? "text-slate-400" : delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{delta == null ? "--" : `${delta >= 0 ? "+" : "-"}${format(Math.abs(delta))}`} {liveCompare.replace("vs ", "较")}</small>
            {label === "全场ROI" && session.spend === 0 && <small className="mt-1 block text-slate-400">{METRIC_RULES.noSpend}</small>}
          </div>;
        })}
      </section>
      <MetricStrip items={[
        { label: "退款订单", value: formatNumber(metrics.refundOrders), icon: ShoppingCart, tone: "amber" },
        { label: "退款金额", value: formatMoney(metrics.refundAmount), icon: CircleDollarSign, tone: "red" },
        { label: "退款率", value: formatPercent(metrics.refundRate), icon: Activity, tone: "blue" },
      ]} />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">分钟级在线趋势</h2>
          {timeline ? <TrendChart values={timeline.map((point) => point.online)} labels={timeline.map((point) => String(point.minute))} /> : <EmptyState title="暂无分钟级在线数据" description="当前场次尚无对应时序明细" />}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">累计成交趋势</h2>
          {timeline ? <TrendChart color="#10b981" values={timeline.map((point) => point.revenue)} labels={timeline.map((point) => `${point.minute}m`)} /> : <EmptyState title="暂无成交时序数据" description="当前场次尚无对应时序明细" />}
        </section>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">时段表现分析</h2>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-400"><tr>{["时段", "时段成交金额", "期末累计成交金额", "期末在线人数"].map((head) => <th key={head} title={metricTitle(head)} className="px-4 py-3">{head}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{timeline ? timeline.slice(1).map((point, index) => <tr key={point.minute}>
            <td className="px-4 py-3">{timeline[index].minute}-{point.minute}分钟</td><td className="px-4 py-3">{formatMoney(point.revenue - timeline[index].revenue)}</td><td className="px-4 py-3">{formatMoney(point.revenue)}</td><td className="px-4 py-3">{formatNumber(point.online)}</td>
          </tr>) : <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">暂无时段明细</td></tr>}</tbody>
        </table></div>
      </section>
    </div>;
  };

  const renderReview = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return <EmptyState title="暂无复盘报告" description="直播数据同步完成后自动生成" />;
    return <div className="space-y-5"><PageHeader title="直播复盘" description={`${session.title} · ${session.startedAt}`} onBack={() => setDetailRoute({ type: "session", sessionId })}><button type="button" onClick={() => notify("AI 已重新生成复盘结论")} className={secondaryButton}><RefreshCw className="h-4 w-4" />重新复盘</button><button type="button" onClick={() => notify("复盘报告已分享给本场部门成员")} className={primaryButton}><Send className="h-4 w-4" />分享部门成员</button></PageHeader><section className="grid gap-4 xl:grid-cols-3"><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><Badge tone="green">表现亮点</Badge><h2 className="mt-3 text-sm font-black text-slate-900">成交效率高于近7场均值</h2><p className="mt-2 text-xs leading-6 text-slate-600">全场 ROI {formatRoi(roi(session.revenue, session.spend))}，商品点击到成交转化稳定。开播后第 60-120 分钟为成交高峰。</p></div><div className="rounded-lg border border-amber-200 bg-amber-50 p-5"><Badge tone="amber">待优化</Badge><h2 className="mt-3 text-sm font-black text-slate-900">中后段停留出现明显回落</h2><p className="mt-2 text-xs leading-6 text-slate-600">第 3 小时平均在线较峰值下降约 28%，建议缩短重复讲解并提前安排福利节点。</p></div><div className="rounded-lg border border-blue-200 bg-blue-50 p-5"><Badge tone="blue">下场建议</Badge><h2 className="mt-3 text-sm font-black text-slate-900">补充低库存主推品并优化投放</h2><p className="mt-2 text-xs leading-6 text-slate-600">优先补充预警商品库存，将 20% 投放预算前置到开播前 45 分钟，承接短视频流量。</p></div></section><div className="grid gap-4 xl:grid-cols-2"><section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">关键指标评分</h2><div className="mt-5 space-y-4">{[["流量获取", 86], ["用户停留", 78], ["互动氛围", 91], ["商品转化", 88], ["投放效率", 84]].map(([label, score]) => <div key={String(label)}><div className="mb-1 flex justify-between text-xs"><span>{label}</span><b>{score}分</b></div><div className="h-2 rounded bg-slate-100"><div className="h-full rounded bg-violet-600" style={{ width: `${score}%` }} /></div></div>)}</div></section><section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">复盘行动项</h2><div className="mt-4 space-y-3">{["运营：调整第 3 小时商品顺序，9月10日前完成", "主播：压缩重复口播，新增两组用户问答承接", "投手：高转化时段预算提高 15%", "中控：低库存商品开播前完成二次核验"].map((item, index) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 text-xs text-slate-600"><input type="checkbox" defaultChecked={index === 0} className="mt-0.5 accent-violet-600" />{item}</label>)}</div></section></div></div>;
  };

  const renderConsole = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return <EmptyState title="无法进入控制台" description="对应直播场次不存在" />;
    const sessionProducts = products.filter((product) => session.productIds.includes(product.id));
    const timeline = LIVE_TIMELINES[session.id];
    const featuredProduct = sessionProducts[0];
    return <div className="space-y-4"><PageHeader title="直播运营控制台" description={`${accountName(session.accountId)} · ${session.title}`} onBack={() => setDetailRoute({ type: "session", sessionId })}><Badge tone="green"><span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />直播中</Badge><button type="button" onClick={() => notify("控制台数据已刷新")} className={secondaryButton}><RefreshCw className="h-4 w-4" />刷新</button></PageHeader><section className="grid min-h-[650px] gap-4 xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(420px,1fr)_300px]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="relative mx-auto aspect-[9/16] max-h-[505px] w-full max-w-[284px] overflow-hidden bg-slate-950"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#6d28d9_0,#18181b_42%,#09090b_100%)]" /><div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/30 px-3 py-2 text-[10px] text-white"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />LIVE</span><span>{formatNumber(LIVE_METRIC_SNAPSHOTS[session.id]?.currentOnline)} 人在线</span></div><div className="absolute inset-x-4 top-[28%] text-center text-white"><Radio className="mx-auto h-10 w-10 opacity-80" /><p className="mt-3 text-sm font-black">梦畅直播画面</p><p className="mt-1 text-[10px] text-white/60">直播画面待同步</p></div>{featuredProduct && <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md bg-white/95 p-2 shadow-lg">{productImage(featuredProduct.id) ? <img src={productImage(featuredProduct.id)} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded bg-violet-50 text-violet-600"><Package className="h-5 w-5" /></span>}<span className="min-w-0 flex-1"><b className="block truncate text-[10px] text-slate-900">{featuredProduct.name}</b><strong className="text-xs text-rose-600">{formatMoney(featuredProduct.price)}</strong></span><span className="rounded bg-rose-600 px-2 py-1 text-[9px] font-bold text-white">讲解中</span></div>}</div><div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">{[["观看", formatNumber(session.viewers)], ["点赞", formatNumber(session.likes)], ["新增粉丝", formatNumber(session.newFollowers)]].map(([label, value]) => <div key={label} className="px-2 py-3 text-center"><b className="block text-xs text-slate-800">{value}</b><small className="text-[9px] text-slate-400">{label}</small></div>)}</div></div>
      <div className="space-y-4"><MetricStrip items={[{ label: "当前GMV", value: formatCompactMoney(session.revenue), icon: CircleDollarSign, tone: "green" }, { label: "成交订单", value: formatNumber(session.orders), icon: ShoppingCart, tone: "blue" }, { label: "实时ROI", value: formatRoi(roi(session.revenue, session.spend)), icon: TrendingUp, tone: "purple" }, { label: "当前在线", value: formatNumber(LIVE_METRIC_SNAPSHOTS[session.id]?.currentOnline), icon: Eye, tone: "red" }, { label: "投放消耗", value: formatCompactMoney(session.spend), icon: WalletCards, tone: "amber" }]} /><section className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h2 className="text-xs font-black text-slate-900">实时在线趋势</h2><span className="text-[10px] text-slate-400">数据快照</span></div>{timeline ? <TrendChart values={timeline.map((point) => point.online)} labels={timeline.map((point) => `${point.minute}m`)} /> : <EmptyState title="暂无在线时序数据" description="等待直播数据同步" />}</section><section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="text-xs font-black text-slate-900">直播商品数据</h2></div><div className="divide-y divide-slate-100">{sessionProducts.map((product, index) => <button key={product.id} type="button" onClick={() => setDetailRoute({ type: "product", productId: product.id })} title="查看商品详情" className={`flex w-full items-center gap-3 px-4 py-3 text-left ${featuredProduct?.id === product.id ? "bg-violet-50" : "hover:bg-slate-50"}`}><span className="w-5 text-center text-[10px] font-black text-slate-400">{index + 1}</span>{productImage(product.id) ? <img src={productImage(product.id)} alt="" className="h-9 w-9 rounded object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded bg-slate-100 text-slate-400"><Package className="h-4 w-4" /></span>}<span className="min-w-0 flex-1"><b className="block truncate text-xs text-slate-800">{product.name}</b><small className="text-slate-400">库存 {product.stock} · 已售 {formatNumber(sessionProductMetrics(session, product.id)?.sales)}</small></span><span className="text-xs font-black text-rose-600">{formatMoney(product.price)}</span>{featuredProduct?.id === product.id && <Badge tone="purple">讲解中</Badge>}</button>)}</div></section></div>
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white xl:col-span-2 2xl:col-span-1"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="text-xs font-black text-slate-900">实时互动</h2><Badge tone="slate">{consoleMessages.length} 条</Badge></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{consoleMessages.map((message, index) => <div key={`${message}-${index}`} className={`rounded-md p-3 text-xs leading-5 ${index % 3 === 0 ? "bg-violet-50 text-violet-800" : "bg-slate-50 text-slate-600"}`}><span className="mb-1 block text-[10px] font-bold text-slate-400">{index % 3 === 0 ? "运营公告" : `用户${String(index + 1).padStart(3, "0")}`}</span>{message}</div>)}</div></aside>
    </section></div>;
  };

  const renderHostDetail = (employeeId: string) => {
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return <EmptyState title="员工不存在" description="该员工可能已经离职" />;
    const hostedSessions = sessions.filter((session) => session.hostId === employee.id);
    const employeeShifts = shifts.filter((shift) => shift.participantIds.includes(employee.id) && shift.status !== "已取消");
    const metrics = aggregateMetrics(hostedSessions);
    return <div className="space-y-5"><PageHeader title={`${employee.name} · 业绩详情`} description={`${employee.login} · ${employee.employment} · ${employee.status}`} onBack={() => setDetailRoute(null)}><button type="button" onClick={() => openEmployeeEditor(employee)} className={secondaryButton}><Pencil className="h-4 w-4" />编辑员工</button><button type="button" onClick={() => notify("个人业绩报表已导出")} className={primaryButton}><Download className="h-4 w-4" />导出业绩</button></PageHeader><section className="flex flex-wrap items-center gap-5 rounded-lg border border-slate-200 bg-white p-5"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-xl font-black text-white">{employee.name.slice(0, 1)}</span><span className="min-w-0 flex-1"><b className="text-base text-slate-900">{employee.name}</b><span className="mt-2 flex flex-wrap gap-1.5">{employee.assignments.map((assignment, index) => <Badge key={`${assignment.accountId}-${assignment.role}-${index}`} tone="purple">{accountName(assignment.accountId)} · {assignment.role}</Badge>)}</span><small className="mt-2 block text-slate-400">手机号 {employee.phone} · 入职 {employee.joinDate} · {employee.nightShift ? "支持晚班" : "不安排晚班"}</small></span><button type="button" onClick={() => openNightShift(employee)} className={secondaryButton}><Clock3 className="h-4 w-4" />晚班设置</button></section><MetricStrip items={[{ label: "主播播出场次", value: `${metrics.sessions} 场`, icon: Video, tone: "purple" }, { label: "累计观看", value: formatNumber(metrics.viewers), icon: Eye, tone: "blue" }, { label: "成交订单", value: formatNumber(metrics.orders), icon: ShoppingCart, tone: "green" }, { label: "成交金额", value: formatCompactMoney(metrics.revenue), icon: CircleDollarSign, tone: "amber" }, { label: "整体ROI", value: formatRoi(metrics.roi), icon: TrendingUp, tone: "red" }, { label: "退款订单", value: formatNumber(metrics.refundOrders), icon: ShoppingCart, tone: "amber" }, { label: "退款金额", value: formatMoney(metrics.refundAmount), icon: CircleDollarSign, tone: "red" }, { label: "退款率", value: formatPercent(metrics.refundRate), icon: Activity, tone: "blue" }]} /><div className="grid gap-4 xl:grid-cols-2"><section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">近场成交趋势</h2><TrendChart values={hostedSessions.length ? hostedSessions.slice().reverse().map((session) => session.revenue) : [0, 0, 0, 0]} labels={hostedSessions.length ? hostedSessions.slice().reverse().map((_, index) => `第${index + 1}场`) : ["1", "2", "3", "4"]} /></section><section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">排班概览</h2><div className="mt-4 space-y-2">{employeeShifts.slice(0, 5).map((shift) => <button key={shift.id} type="button" onClick={() => { navigateTab("schedule"); setScheduleAccountFilter(shift.accountId); }} className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-3 text-left hover:border-violet-200"><span><b className="block text-xs text-slate-800">{shift.title}</b><small className="text-slate-400">{shift.date} · {shift.start}:00-{shift.end}:00 · {accountName(shift.accountId)}</small></span><Badge tone={shiftTone(shift.status)}>{shift.status}</Badge></button>)}{!employeeShifts.length && <p className="py-12 text-center text-xs text-slate-400">暂无有效排班</p>}</div></section></div><section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-black text-slate-900">主播播出记录</h2></div>{hostedSessions.length ? <SessionTable items={hostedSessions} showAccount /> : <div className="p-5"><EmptyState title="暂无主播播出记录" description="助播、场控等岗位仅统计参与排班，不计入主播成交" /></div>}</section></div>;
  };

  const renderProductDetail = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return <EmptyState title="商品不存在" description="商品可能已经下架" />;
    const productSessions = sessions.filter((session) => session.productIds.includes(product.id) && rangeMatches(session.startedAt, "近30天"));
    const trend = productSalesTrend(sessions, product.id);
    const funnel = [["商品曝光", product.productExposure], ["商品点击", product.clicks], ["创建订单", null], ["成交支付", product.orders]] as const;
    return <div className="space-y-5">
      <PageHeader title="商品详情分析" description={`${accountName(product.accountId)} · 商品ID ${product.id} · 近30天`} onBack={() => setDetailRoute(null)}>
        <button type="button" onClick={() => notify("商品报表已导出")} className={primaryButton}><Download className="h-4 w-4" />导出报表</button>
      </PageHeader>
      <section className="flex flex-wrap items-center gap-5 rounded-lg border border-slate-200 bg-white p-5">
        {productImage(product.id) ? <img src={productImage(product.id)} alt={product.name} className="h-24 w-24 rounded-md object-cover" /> : <span className="flex h-24 w-24 items-center justify-center rounded-md bg-violet-50 text-violet-600"><Package className="h-10 w-10" /></span>}
        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="text-base text-slate-900">{product.name}</b><Badge tone={product.status === "在售" ? "green" : "red"}>{product.status}</Badge><Badge tone="slate">{product.category}</Badge></span>
          <span className="mt-3 flex flex-wrap gap-6 text-xs text-slate-500"><span>售价 <b className="text-base text-rose-600">{formatMoney(product.price)}</b></span><span>库存 <b>{product.stock}</b></span><span>预警值 <b>{product.warningStock}</b></span><span>关联直播 <b>{productSessions.length} 场</b></span></span>
        </span>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[["曝光人数", formatNumber(product.productExposure)], ["商品点击", formatNumber(product.clicks)], ["成交件数", formatNumber(product.sales)], ["成交订单", formatNumber(product.orders)], ["成交金额", formatMoney(product.gmv)], ["退款订单", formatNumber(product.refundOrders)], ["退款金额", formatMoney(product.refundAmount)], ["退款率", formatPercent(product.refundRate)], ["库存周转", "--"]].map(([label, value]) =>
          <div key={label} title={metricTitle(label) ?? (label === "库存周转" ? "缺少库存流水，暂不计算" : label === "曝光人数" ? "各场商品曝光人数之和，跨场不去重" : undefined)} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4"><small className="text-slate-400">{label}</small><b className="mt-1 block break-words text-lg text-slate-900">{value}</b></div>
        )}
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.6fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">近30日销售趋势</h2>
          {trend ? <TrendChart color="#10b981" values={trend.map((point) => point.revenue)} labels={trend.map((point, index) => index % 5 === 0 || index === 29 ? point.date.slice(5) : "")} /> : <EmptyState title="暂无商品销售明细" description="数据同步后展示销售趋势" />}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-black text-slate-900">转化漏斗</h2>
          <div className="mt-4 divide-y divide-slate-100">{funnel.map(([label, value]) => <div key={label} className="flex items-center justify-between py-3 text-xs"><span className="text-slate-500">{label}</span><b title={value == null ? "暂无对应明细" : undefined} className="text-slate-900">{formatNumber(value)}</b></div>)}</div>
        </section>
      </div>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-black text-slate-900">关联直播场次</h2></div><SessionTable items={productSessions} showAccount /></section>
    </div>;
  };

  const renderDialog = () => {
    if (!dialog) return null;
    const error = formError && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{formError}</p>;

    if (dialog === "account") return <Dialog title={selectedAccountId ? "编辑直播号" : "绑定直播号"} onClose={closeDialog} footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={saveAccount} className={primaryButton}>{selectedAccountId ? "保存修改" : "确认绑定"}</button></>}>
      <div className="space-y-4">
        <div className="rounded-md bg-violet-50 p-4 text-xs leading-5 text-violet-700">绑定后将同步直播场次、流量、互动、商品、订单及投放数据；原型数据仅在当前访问期间保留。</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-xs font-bold text-slate-600">直播号名称<span className="text-rose-500"> *</span><input value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} className={fieldClass} /></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">抖音号<span className="text-rose-500"> *</span><input value={accountForm.handle} onChange={(event) => setAccountForm({ ...accountForm, handle: event.target.value })} className={fieldClass} /></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">所属平台<select className={fieldClass}><option>抖音</option><option>快手</option><option>淘宝直播</option></select></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">负责人<span className="text-rose-500"> *</span><input value={accountForm.manager} onChange={(event) => setAccountForm({ ...accountForm, manager: event.target.value })} className={fieldClass} /></label>
        </div>
        {error}
      </div>
    </Dialog>;

    if (dialog === "unbind-account") {
      const account = accounts.find((item) => item.id === selectedAccountId);
      const futureCount = shifts.filter((shift) => shift.accountId === selectedAccountId && shift.status !== "已取消").length;
      return <Dialog title="解绑直播号" onClose={closeDialog} width="max-w-lg" footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={confirmUnbindAccount} className={dangerButton}>确认解绑</button></>}><div className="space-y-4"><div className="flex gap-3 rounded-md bg-rose-50 p-4"><AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" /><div><p className="text-sm font-black text-rose-800">确认解绑“{account?.name}”？</p><p className="mt-2 text-xs leading-5 text-rose-700">解绑后停止同步新数据，历史直播记录仍保留；当前 {futureCount} 条未执行排班将自动转为无效排班。</p></div></div></div></Dialog>;
    }

    if (dialog === "employee") return <Dialog title={selectedEmployeeId ? "编辑员工" : "新增员工"} onClose={closeDialog} width="max-w-3xl" footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={saveEmployee} className={primaryButton}>保存员工</button></>}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-xs font-bold text-slate-600">员工姓名<span className="text-rose-500"> *</span><input value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} className={fieldClass} /></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">登录账号<span className="text-rose-500"> *</span><input value={employeeForm.login} onChange={(event) => setEmployeeForm({ ...employeeForm, login: event.target.value })} className={fieldClass} /></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">手机号<span className="text-rose-500"> *</span><input value={employeeForm.phone} onChange={(event) => setEmployeeForm({ ...employeeForm, phone: event.target.value })} className={fieldClass} /></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">入职日期<input type="date" value={employeeForm.joinDate} onChange={(event) => setEmployeeForm({ ...employeeForm, joinDate: event.target.value })} className={fieldClass} /></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">用工类型<select value={employeeForm.employment} onChange={(event) => setEmployeeForm({ ...employeeForm, employment: event.target.value as EmployeeFormState["employment"] })} className={fieldClass}><option>全职</option><option>兼职</option></select></label>
          <label className="space-y-2 text-xs font-bold text-slate-600">员工状态<select value={employeeForm.status} onChange={(event) => setEmployeeForm({ ...employeeForm, status: event.target.value as LiveEmployee["status"] })} className={fieldClass}><option>在职</option><option>已停用</option><option>已离职</option></select></label>
        </div>
        <section className="rounded-lg border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h3 className="text-xs font-black text-slate-800">直播号岗位</h3><p className="mt-1 text-[10px] text-slate-400">可为同一员工配置多个直播号及不同岗位</p></div><button type="button" onClick={() => setEmployeeForm((current) => ({ ...current, assignments: [...current.assignments, { accountId: activeAccounts[0]?.id ?? "", role: "主播" }] }))} className={secondaryButton}><Plus className="h-4 w-4" />添加岗位</button></div>
          <div className="space-y-2 p-4">{employeeForm.assignments.map((assignment, index) => <div key={index} className="grid grid-cols-[1fr_140px_36px] gap-2"><select value={assignment.accountId} onChange={(event) => setEmployeeForm((current) => ({ ...current, assignments: current.assignments.map((item, itemIndex) => itemIndex === index ? { ...item, accountId: event.target.value } : item) }))} className={fieldClass}>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select value={assignment.role} onChange={(event) => setEmployeeForm((current) => ({ ...current, assignments: current.assignments.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value as LiveRole } : item) }))} className={fieldClass}>{LIVE_ROLES.map((role) => <option key={role}>{role}</option>)}</select><button type="button" title="删除岗位" disabled={employeeForm.assignments.length === 1} onClick={() => setEmployeeForm((current) => ({ ...current, assignments: current.assignments.filter((_, itemIndex) => itemIndex !== index) }))} className={`${iconButton} disabled:opacity-30`}><Trash2 className="h-4 w-4" /></button></div>)}</div>
        </section>
        {error}
      </div>
    </Dialog>;

    if (dialog === "reduce-employee") {
      const employee = employees.find((item) => item.id === selectedEmployeeId);
      return <Dialog title="员工减员" onClose={closeDialog} width="max-w-lg" footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={confirmReduceEmployee} className={dangerButton}>确认减员</button></>}><div className="space-y-4"><div className="rounded-md bg-amber-50 p-4 text-xs leading-5 text-amber-800">减员后，{employee?.name}将无法参与新排班，最后工作日之后的排班会自动解除人员关联。</div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-xs font-bold text-slate-600">减员日期<input type="date" value={reductionForm.reducedAt} onChange={(event) => setReductionForm({ ...reductionForm, reducedAt: event.target.value })} className={fieldClass} /></label><label className="space-y-2 text-xs font-bold text-slate-600">最后工作日<input type="date" value={reductionForm.lastWorkDate} onChange={(event) => setReductionForm({ ...reductionForm, lastWorkDate: event.target.value })} className={fieldClass} /></label><label className="space-y-2 text-xs font-bold text-slate-600 sm:col-span-2">减员原因<select value={reductionForm.reason} onChange={(event) => setReductionForm({ ...reductionForm, reason: event.target.value })} className={fieldClass}><option>主动离职</option><option>合同到期</option><option>部门调整</option><option>长期停用</option></select></label><label className="space-y-2 text-xs font-bold text-slate-600 sm:col-span-2">交接备注<textarea value={reductionForm.note} onChange={(event) => setReductionForm({ ...reductionForm, note: event.target.value })} className="min-h-24 w-full rounded-md border border-slate-200 p-3 text-xs outline-none focus:border-violet-400" /></label></div>{error}</div></Dialog>;
    }

    if (dialog === "night-shift") {
      const employee = employees.find((item) => item.id === selectedEmployeeId);
      return <Dialog title="晚班设置" onClose={closeDialog} width="max-w-md" footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={toggleNightShift} className={primaryButton}>确认修改</button></>}><div className="text-xs leading-6 text-slate-600">当前员工：<b className="text-slate-900">{employee?.name}</b><br />当前设置：<Badge tone={employee?.nightShift ? "green" : "slate"}>{employee?.nightShift ? "支持晚班" : "不安排晚班"}</Badge><p className="mt-3 rounded-md bg-slate-50 p-3 text-slate-500">确认后切换为“{employee?.nightShift ? "不安排晚班" : "支持晚班"}”。已存在的排班不会自动取消。</p></div></Dialog>;
    }

    if (dialog === "role-permission") {
      const permissionOptions = ["查看我的直播号", "查看运营控制台", "查看直播记录", "查看主播数据", "查看直播排班", "查看直播商品", "查看投放数据", "部门配置", "店铺授权", "排班管理", "直播管理全部功能"];
      return <Dialog title={`${selectedRole} · 权限设置`} onClose={closeDialog} footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={() => { closeDialog(); notify(`${selectedRole}权限已保存`); }} className={primaryButton}>保存权限</button></>}><div className="grid gap-2 sm:grid-cols-2">{permissionOptions.map((permission) => { const checked = rolePermissions[selectedRole].includes(permission); return <label key={permission} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-xs ${checked ? "border-violet-200 bg-violet-50 text-violet-800" : "border-slate-200 text-slate-600"}`}><input type="checkbox" checked={checked} onChange={() => setRolePermissions((current) => ({ ...current, [selectedRole]: checked ? current[selectedRole].filter((item) => item !== permission) : [...current[selectedRole], permission] }))} className="accent-violet-600" />{permission}</label>; })}</div></Dialog>;
    }

    if (dialog === "shift") {
      const availableRooms = rooms.filter((room) => room.accountId === shiftForm.accountId);
      const availableEmployees = employees.filter((employee) => employee.status === "在职" && employee.assignments.some((assignment) => assignment.accountId === shiftForm.accountId));
      return <Dialog title={selectedShiftId ? "编辑排班" : "新增排班"} onClose={closeDialog} width="max-w-3xl" footer={<>{selectedShiftId && <button type="button" onClick={cancelShift} className={`${secondaryButton} mr-auto border-rose-200 text-rose-600 hover:bg-rose-50`}>取消排班</button>}<button type="button" onClick={closeDialog} className={secondaryButton}>关闭</button><button type="button" onClick={saveShift} className={primaryButton}>保存排班</button></>}>
        <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-xs font-bold text-slate-600">直播号<select value={shiftForm.accountId} onChange={(event) => { const accountId = event.target.value; setShiftForm({ ...shiftForm, accountId, roomId: rooms.find((room) => room.accountId === accountId)?.id ?? "", participantIds: [] }); }} className={fieldClass}>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="space-y-2 text-xs font-bold text-slate-600">直播间<select value={shiftForm.roomId} onChange={(event) => setShiftForm({ ...shiftForm, roomId: event.target.value })} className={fieldClass}>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label><label className="space-y-2 text-xs font-bold text-slate-600 sm:col-span-2">直播主题<span className="text-rose-500"> *</span><input value={shiftForm.title} onChange={(event) => setShiftForm({ ...shiftForm, title: event.target.value })} className={fieldClass} /></label><label className="space-y-2 text-xs font-bold text-slate-600">直播日期<input type="date" value={shiftForm.date} onChange={(event) => setShiftForm({ ...shiftForm, date: event.target.value })} className={fieldClass} /></label><label className="space-y-2 text-xs font-bold text-slate-600">确认状态<select value={shiftForm.status} onChange={(event) => setShiftForm({ ...shiftForm, status: event.target.value as LiveShift["status"] })} className={fieldClass}><option>待确认</option><option>已确认</option></select></label><label className="space-y-2 text-xs font-bold text-slate-600">开始时间<select value={shiftForm.start} onChange={(event) => setShiftForm({ ...shiftForm, start: Number(event.target.value) })} className={fieldClass}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label><label className="space-y-2 text-xs font-bold text-slate-600">结束时间<select value={shiftForm.end} onChange={(event) => setShiftForm({ ...shiftForm, end: Number(event.target.value) })} className={fieldClass}>{Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label></div><section><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black text-slate-800">参与员工<span className="text-rose-500"> *</span></h3><span className="text-[10px] text-slate-400">仅显示已关联该直播号的在职员工</span></div><div className="grid gap-2 sm:grid-cols-2">{availableEmployees.map((employee) => { const checked = shiftForm.participantIds.includes(employee.id); const roles = employee.assignments.filter((assignment) => assignment.accountId === shiftForm.accountId).map((assignment) => assignment.role).join(" / "); return <label key={employee.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${checked ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:border-violet-200"}`}><input type="checkbox" checked={checked} onChange={() => setShiftForm({ ...shiftForm, participantIds: checked ? shiftForm.participantIds.filter((id) => id !== employee.id) : [...shiftForm.participantIds, employee.id] })} className="accent-violet-600" /><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-violet-700">{employee.name.slice(0, 1)}</span><span><b className="block text-xs text-slate-800">{employee.name}</b><small className="text-slate-400">{roles} · {employee.nightShift ? "可晚班" : "仅白班"}</small></span></label>; })}</div>{!availableEmployees.length && <p className="rounded-md border border-dashed border-slate-300 py-8 text-center text-xs text-slate-400">该直播号暂无可排班员工，请先在部门管理配置岗位</p>}</section>{error}<p className="rounded-md bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">保存时会同时校验直播间占用和参与员工跨直播间、跨直播号撞班。</p></div>
      </Dialog>;
    }

    if (dialog === "schedule-import") return <Dialog title="导入排班" onClose={closeDialog} footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={() => { closeDialog(); notify("排班表已导入并完成冲突检查"); }} className={primaryButton}>确认导入</button></>}><div className="space-y-4"><button type="button" onClick={() => notify("排班导入模板已下载")} className={secondaryButton}><Download className="h-4 w-4" />下载导入模板</button><label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-violet-200 bg-violet-50/40"><FileSpreadsheet className="h-10 w-10 text-violet-500" /><span className="mt-3 text-xs font-bold text-slate-700">点击上传 Excel 排班表</span><span className="mt-1 text-[10px] text-slate-400">导入后自动校验直播间和员工时段冲突</span><input type="file" accept=".xlsx,.xls" className="hidden" /></label></div></Dialog>;

    if (dialog === "schedule-logs") return <Dialog title="排班操作记录" onClose={closeDialog} footer={<button type="button" onClick={closeDialog} className={primaryButton}>关闭</button>}><div className="space-y-4">{shifts.slice().reverse().slice(0, 8).map((shift) => <div key={shift.id} className="flex gap-3"><span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${shift.status === "已取消" ? "bg-rose-500" : "bg-violet-500"}`} /><div><p className="text-xs font-bold text-slate-700">{shift.status === "已取消" ? "取消" : shift.updatedAt === "刚刚" ? "更新" : "创建"}{accountName(shift.accountId)}“{shift.title}”排班</p><p className="mt-1 text-[10px] text-slate-400">{shift.updatedAt} · 操作人 {shift.operator} · {shift.date} {shift.start}:00-{shift.end}:00</p></div></div>)}</div></Dialog>;

    if (dialog === "store") return <Dialog title={selectedStoreId ? "更新店铺授权" : "绑定店铺"} onClose={closeDialog} footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={saveStore} className={primaryButton}>确认授权</button></>}><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-violet-200 bg-violet-50 p-4"><WalletCards className="h-6 w-6 text-violet-600" /><b className="mt-3 block text-xs text-slate-800">1. 订阅平台服务</b><p className="mt-1 text-[10px] leading-5 text-slate-500">在店铺服务市场订阅直播数据服务。</p></div><div className="rounded-md border border-slate-200 p-4"><ShieldCheck className="h-6 w-6 text-violet-600" /><b className="mt-3 block text-xs text-slate-800">2. 完成店铺授权</b><p className="mt-1 text-[10px] leading-5 text-slate-500">授权后同步订单、成交、商品与退款数据。</p></div></div><label className="block space-y-2 text-xs font-bold text-slate-600">关联直播号<select value={storeForm.accountId} onChange={(event) => setStoreForm({ ...storeForm, accountId: event.target.value })} className={fieldClass}>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-xs font-bold text-slate-600">店铺名称<input value={storeForm.name} onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })} className={fieldClass} /></label><label className="space-y-2 text-xs font-bold text-slate-600">店铺平台<select value={storeForm.platform} onChange={(event) => setStoreForm({ ...storeForm, platform: event.target.value as LiveStore["platform"] })} className={fieldClass}><option>抖店</option><option>快手小店</option></select></label></div>{error}</div></Dialog>;

    if (dialog === "unbind-store") {
      const store = stores.find((item) => item.id === selectedStoreId);
      return <Dialog title="解除店铺授权" onClose={closeDialog} width="max-w-lg" footer={<><button type="button" onClick={closeDialog} className={secondaryButton}>取消</button><button type="button" onClick={confirmUnbindStore} className={dangerButton}>确认解除</button></>}><div className="flex gap-3 rounded-md bg-rose-50 p-4"><AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" /><p className="text-xs leading-6 text-rose-700">解除“{store?.name}”授权后将停止同步商品、订单及退款数据，已同步历史数据仍保留。</p></div></Dialog>;
    }


    if (dialog === "tool") return (
      <Dialog title="工具详情" onClose={closeDialog} width="max-w-4xl">
        <div className="space-y-7">
          <section className="flex items-start gap-5">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500"><MonitorPlay className="h-11 w-11" /></span>
            <div className="min-w-0 flex-1 pt-1">
              <h3 className="text-lg font-black text-slate-900">云管家智播助手</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">直播间中控插件，支持自动点击商品讲解、自动发送评论。提升直播间运营效率，减少人工操作成本。</p>
              <span className="mt-4 inline-flex h-9 items-center rounded-md bg-violet-600 px-4 text-xs font-bold text-white">点击获取</span>
            </div>
          </section>
          <section>
            <h3 className="text-sm font-black text-slate-900">使用说明</h3>
            <p className="mt-3 break-all text-sm text-violet-600">https://sucaiwang.zhishangsoft.com/#/article/87</p>
          </section>
          <section>
            <h3 className="text-sm font-black text-slate-900">功能特性</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{([
              ["自动商品讲解", "按设定间隔自动点击商品讲解按钮", PlayCircle],
              ["自动发送评论", "自定义评论内容，定时自动发送", Send],
              ["智能话术库", "内置多种直播场景话术模板", MessageSquare],
              ["数据统计", "实时统计互动数据和转化效果", BarChart3],
            ] as const).map(([title, description, Icon]) => <div key={title} className="flex items-start gap-3 rounded-lg bg-slate-50 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-violet-600"><Icon className="h-4 w-4" /></span><span><b className="block text-xs text-slate-800">{title}</b><small className="mt-1 block text-[11px] leading-5 text-slate-500">{description}</small></span></div>)}</div>
          </section>
        </div>
      </Dialog>
    );
    return null;
  };

  const renderCurrentPage = () => {
    if (detailRoute) {
      if (detailRoute.type === "account") return renderAccountDetail(detailRoute.accountId);
      if (detailRoute.type === "session") return renderSessionDetail(detailRoute.sessionId);
      if (detailRoute.type === "live-data") return renderLiveData(detailRoute.sessionId);
      if (detailRoute.type === "review") return renderReview(detailRoute.sessionId);
      if (detailRoute.type === "console") return renderConsole(detailRoute.sessionId);
      if (detailRoute.type === "host") return renderHostDetail(detailRoute.employeeId);
      if (detailRoute.type === "product") return renderProductDetail(detailRoute.productId);
    }
    if (activeTab === "home") return renderHome();
    if (activeTab === "rooms") return renderRooms();
    if (activeTab === "schedule") return renderSchedule();
    if (activeTab === "hosts") return renderHosts();
    if (activeTab === "team") return renderTeam();
    if (activeTab === "stores") return renderStores();
    return renderTools();
  };

  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-800">
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 pt-3 sm:px-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => navigateTab(tab.id)} className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold transition sm:px-4 ${active ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon className={`h-4 w-4 ${active ? "text-violet-600" : "text-slate-400"}`} />{tab.label}</button>; })}
        <button type="button" onClick={refreshLiveData} title="刷新直播管理数据" className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-violet-600"><RefreshCw className="h-4 w-4" /></button>
      </div>
    </header>
    <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{renderCurrentPage()}</main>
    {toast && <OverlayPortal layer="toast" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4"><div className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-400" />{toast}</div></OverlayPortal>}
    {renderDialog()}
  </div>;
}
