import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
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
  Megaphone,
  Pencil,
  PlayCircle,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  UsersRound,
  Video,
  WalletCards,
  X,
} from "lucide-react";

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
type DialogId = "bind" | "account" | "unbind" | "session" | "employee" | "delete_employee" | "shift" | "import" | "logs" | "store" | "plugin" | null;

interface LiveAccount {
  id: string;
  name: string;
  handle: string;
  roomCount: number;
  likes: number;
  spend: number;
  sessions: number;
  orders: number;
  revenue: number;
  roi: number;
  sales: number;
  status: "已绑定" | "首次同步中" | "授权即将到期";
  lastSync: string;
}

interface LiveSession {
  id: string;
  accountId: string;
  roomNo: string;
  title: string;
  host: string;
  startedAt: string;
  duration: string;
  roi: number;
  revenue: number;
  spend: number;
  presaleOrders: number;
  directOrders: number;
  likes: number;
  sales: number;
  status: "直播中" | "已结束" | "数据同步中" | "数据异常";
  dataNote?: string;
}

interface Employee {
  id: string;
  name: string;
  account: string;
  liveAccountId: string;
  role: string;
  employment: string;
  status?: "在职" | "待重新关联" | "已停用";
}

interface Shift {
  id: string;
  accountId: string;
  roomId: string;
  date: string;
  participantIds: string[];
  start: number;
  end: number;
}

const initialAccounts: LiveAccount[] = [
  { id: "acc-1", name: "梦畅美妆旗舰店", handle: "MCBeauty_2026", roomCount: 3, likes: 286400, spend: 82640, sessions: 24, orders: 1286, revenue: 368420, roi: 4.46, sales: 2158, status: "已绑定", lastSync: "今天 10:26" },
  { id: "acc-2", name: "梦畅服饰直播号", handle: "MCFashion_Live", roomCount: 2, likes: 184600, spend: 59320, sessions: 18, orders: 968, revenue: 286900, roi: 4.84, sales: 1462, status: "已绑定", lastSync: "今天 10:24" },
  { id: "acc-3", name: "梦畅家居好物", handle: "MCHome_Select", roomCount: 1, likes: 93200, spend: 31860, sessions: 11, orders: 462, revenue: 128760, roi: 4.04, sales: 708, status: "授权即将到期", lastSync: "昨天 23:58" },
  { id: "acc-4", name: "梦畅个护精选", handle: "MCCare_Select", roomCount: 1, likes: 0, spend: 0, sessions: 0, orders: 0, revenue: 0, roi: 0, sales: 0, status: "首次同步中", lastSync: "等待首次同步" },
];

const initialSessions: LiveSession[] = [
  { id: "live-10086", accountId: "acc-1", roomNo: "L20260819001", title: "七夕美妆礼盒专场", host: "徐云卿", startedAt: "2026-08-19 09:30", duration: "03:42:18", roi: 4.82, revenue: 92680, spend: 19220, presaleOrders: 86, directOrders: 300, likes: 68420, sales: 612, status: "直播中" },
  { id: "live-10085", accountId: "acc-1", roomNo: "L20260818102", title: "新品首发专场", host: "梁清淇", startedAt: "2026-08-18 19:00", duration: "05:16:40", roi: 5.13, revenue: 146520, spend: 28560, presaleOrders: 124, directOrders: 400, likes: 93280, sales: 886, status: "已结束" },
  { id: "live-10084", accountId: "acc-1", roomNo: "L20260817108", title: "夏日防晒返场", host: "谭明珠", startedAt: "2026-08-17 14:00", duration: "02:48:12", roi: 3.96, revenue: 58740, spend: 14820, presaleOrders: 48, directOrders: 170, likes: 47260, sales: 346, status: "已结束" },
  { id: "live-10083", accountId: "acc-1", roomNo: "L20260816206", title: "会员日晚间返场", host: "徐云卿", startedAt: "2026-08-16 20:00", duration: "03:08:40", roi: 0, revenue: 0, spend: 12680, presaleOrders: 0, directOrders: 0, likes: 38420, sales: 0, status: "数据同步中", dataNote: "直播已结束，订单与成交数据正在从店铺侧同步，预计 10 分钟内完成。" },
  { id: "live-10082", accountId: "acc-1", roomNo: "L20260815112", title: "品牌会员大场", host: "梁清淇", startedAt: "2026-08-15 18:30", duration: "04:26:18", roi: 0, revenue: 0, spend: 21860, presaleOrders: 0, directOrders: 0, likes: 62580, sales: 0, status: "数据异常", dataNote: "店铺订单授权已过期，本场成交数据未能同步。请重新授权后重试。" },
  { id: "live-20021", accountId: "acc-2", roomNo: "L20260819008", title: "秋季通勤穿搭", host: "梁清淇", startedAt: "2026-08-19 11:00", duration: "04:06:32", roi: 4.72, revenue: 88720, spend: 18780, presaleOrders: 62, directOrders: 246, likes: 52680, sales: 498, status: "直播中" },
  { id: "live-20020", accountId: "acc-2", roomNo: "L20260818119", title: "显瘦牛仔合集", host: "徐云卿", startedAt: "2026-08-18 20:00", duration: "03:28:06", roi: 4.96, revenue: 116800, spend: 23560, presaleOrders: 95, directOrders: 318, likes: 74620, sales: 624, status: "已结束" },
  { id: "live-30009", accountId: "acc-3", roomNo: "L20260818031", title: "小户型收纳指南", host: "谭明珠", startedAt: "2026-08-18 15:00", duration: "03:12:48", roi: 4.04, revenue: 48260, spend: 11940, presaleOrders: 39, directOrders: 132, likes: 38600, sales: 228, status: "已结束" },
];

const initialEmployees: Employee[] = [
  { id: "emp-1", name: "徐云卿", account: "xuyunqing", liveAccountId: "acc-1", role: "主播", employment: "全职", status: "在职" },
  { id: "emp-2", name: "梁清淇", account: "liangqingqi", liveAccountId: "acc-2", role: "主播", employment: "全职", status: "在职" },
  { id: "emp-3", name: "谭明珠", account: "tanmingzhu", liveAccountId: "acc-1", role: "助播", employment: "全职", status: "在职" },
  { id: "emp-4", name: "冯浩伦", account: "fenghaolun", liveAccountId: "acc-1", role: "场控", employment: "兼职", status: "在职" },
  { id: "emp-5", name: "周嘉宁", account: "zhoujianing", liveAccountId: "acc-unbound", role: "投手", employment: "全职", status: "待重新关联" },
];

const liveRooms = [
  { id: "room-1", accountId: "acc-1", name: "梦畅美妆主直播间" },
  { id: "room-2", accountId: "acc-1", name: "新品首发直播间" },
  { id: "room-3", accountId: "acc-1", name: "品牌会员直播间" },
  { id: "room-4", accountId: "acc-2", name: "梦畅服饰主直播间" },
  { id: "room-5", accountId: "acc-2", name: "穿搭测评直播间" },
  { id: "room-6", accountId: "acc-3", name: "家居好物直播间" },
  { id: "room-7", accountId: "acc-4", name: "梦畅个护主直播间" },
];

const initialShifts: Shift[] = [
  { id: "shift-1", accountId: "acc-1", roomId: "room-1", date: "08-17", participantIds: ["emp-1", "emp-3", "emp-4"], start: 9, end: 13 },
  { id: "shift-2", accountId: "acc-1", roomId: "room-2", date: "08-17", participantIds: ["emp-3"], start: 15, end: 19 },
  { id: "shift-3", accountId: "acc-1", roomId: "room-1", date: "08-18", participantIds: ["emp-1", "emp-3"], start: 10, end: 16 },
  { id: "shift-4", accountId: "acc-1", roomId: "room-3", date: "08-18", participantIds: ["emp-4"], start: 18, end: 23 },
  { id: "shift-5", accountId: "acc-1", roomId: "room-1", date: "08-19", participantIds: ["emp-1", "emp-3", "emp-4"], start: 9, end: 13 },
  { id: "shift-6", accountId: "acc-1", roomId: "room-2", date: "08-19", participantIds: ["emp-3"], start: 14, end: 19 },
  { id: "shift-7", accountId: "acc-1", roomId: "room-1", date: "08-20", participantIds: ["emp-1", "emp-3"], start: 13, end: 18 },
  { id: "shift-8", accountId: "acc-1", roomId: "room-3", date: "08-21", participantIds: ["emp-4"], start: 18, end: 23 },
  { id: "shift-9", accountId: "acc-1", roomId: "room-2", date: "08-22", participantIds: [], start: 20, end: 23 },
];

const weekDates = [
  { date: "08-17", weekday: "周一" }, { date: "08-18", weekday: "周二" },
  { date: "08-19", weekday: "周三" }, { date: "08-20", weekday: "周四" },
  { date: "08-21", weekday: "周五" }, { date: "08-22", weekday: "周六" },
  { date: "08-23", weekday: "周日" },
];
const hours = Array.from({ length: 24 }, (_, index) => index);

const fieldClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100";
const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700";
const secondaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700";
const iconButton = "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700";

const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
const formatMoney = (value: number) => `¥${formatNumber(value)}`;
const accountTone = (status: LiveAccount["status"]): "green" | "amber" | "purple" => status === "已绑定" ? "green" : status === "授权即将到期" ? "amber" : "purple";
const sessionTone = (status: LiveSession["status"]): "green" | "slate" | "purple" | "red" => status === "直播中" ? "green" : status === "数据同步中" ? "purple" : status === "数据异常" ? "red" : "slate";

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "purple" | "amber" | "red" }) {
  const colors = { slate: "bg-slate-100 text-slate-600", green: "bg-emerald-50 text-emerald-700", purple: "bg-purple-50 text-purple-700", amber: "bg-amber-50 text-amber-700", red: "bg-rose-50 text-rose-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${colors[tone]}`}>{children}</span>;
}

function PageHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5"><div><h1 className="text-xl font-black text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-400">{description}</p></div><div className="flex flex-wrap gap-2">{children}</div></div>;
}

function Dialog({ title, children, onClose, footer, width = "max-w-2xl" }: { title: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode; width?: string }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"><div className={`flex max-h-[90vh] w-full ${width} flex-col overflow-hidden rounded-lg bg-white shadow-2xl`}><div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-5"><div className="flex items-center gap-3"><span className="h-5 w-1 rounded-full bg-purple-600" /><h2 className="font-black text-slate-900">{title}</h2></div><button title="关闭" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><div className="overflow-y-auto p-6">{children}</div>{footer && <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</div>}</div></div>;
}

function MetricGrid({ account }: { account: LiveAccount }) {
  const metrics = [
    ["开播场次", `${account.sessions} 场`, PlayCircle, "bg-purple-50 text-purple-600"],
    ["总成交订单", formatNumber(account.orders), ShoppingCart, "bg-emerald-50 text-emerald-600"],
    ["总成交金额", formatMoney(account.revenue), CircleDollarSign, "bg-amber-50 text-amber-600"],
    ["总投放消耗", formatMoney(account.spend), TrendingUp, "bg-blue-50 text-blue-600"],
  ] as const;
  return <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 xl:grid-cols-4">{metrics.map(([label, value, Icon, color]) => <div key={label} className="flex min-h-24 items-center gap-3 bg-white px-4 py-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 truncate text-lg font-black text-slate-900">{value}</p></div></div>)}</div>;
}

export default function LiveManagementWorkspaceV2() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [dialog, setDialog] = useState<DialogId>(null);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [employees, setEmployees] = useState(initialEmployees);
  const [shifts, setShifts] = useState(initialShifts);
  const [selectedAccountId, setSelectedAccountId] = useState("acc-1");
  const [selectedAccount, setSelectedAccount] = useState<LiveAccount | null>(null);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [dateRange, setDateRange] = useState("近7天");
  const [teamView, setTeamView] = useState<"employees" | "roles">("employees");
  const [search, setSearch] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");
  const [employeeForm, setEmployeeForm] = useState({ name: "", account: "", liveAccountId: "acc-1", role: "主播", employment: "全职" });
  const [shiftForm, setShiftForm] = useState({ accountId: "acc-1", roomId: "room-1", date: "08-19", participantIds: ["emp-1", "emp-3", "emp-4"], start: 9, end: 13 });
  const [storeBound, setStoreBound] = useState(false);

  const activeAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];
  const accountSessions = useMemo(() => initialSessions.filter((session) => session.accountId === selectedAccountId), [selectedAccountId]);
  const filteredEmployees = useMemo(() => employees.filter((employee) => employee.name.includes(search) || employee.role.includes(search) || employee.account.includes(search)), [employees, search]);
  const accountShifts = shifts.filter((shift) => shift.accountId === selectedAccountId);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const closeDialog = () => {
    setDialog(null);
    setFormError("");
  };

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    setSearch("");
  };

  const openAccountDetail = (account: LiveAccount) => {
    setSelectedAccount(account);
    setDialog("account");
  };

  const openUnbind = (account: LiveAccount) => {
    setSelectedAccount(account);
    setDialog("unbind");
  };

  const unbindAccount = () => {
    if (!selectedAccount) return;
    const remaining = accounts.filter((account) => account.id !== selectedAccount.id);
    setAccounts(remaining);
    if (selectedAccountId === selectedAccount.id && remaining[0]) setSelectedAccountId(remaining[0].id);
    closeDialog();
    notify(`${selectedAccount.name} 已解绑`);
  };

  const bindAccount = () => {
    if (!accounts.some((account) => account.id === "acc-4")) {
      setAccounts((current) => [...current, { id: "acc-4", name: "梦畅个护精选", handle: "MCCare_Select", roomCount: 1, likes: 0, spend: 0, sessions: 0, orders: 0, revenue: 0, roi: 0, sales: 0, status: "首次同步中", lastSync: "等待首次同步" }]);
    }
    closeDialog();
    notify("直播号绑定成功，等待首次数据同步");
  };

  const openSession = (session: LiveSession) => {
    setSelectedSession(session);
    setDialog("session");
  };

  const openEmployee = (employee?: Employee) => {
    setSelectedEmployee(employee ?? null);
    const liveAccountId = employee && accounts.some((account) => account.id === employee.liveAccountId) ? employee.liveAccountId : selectedAccountId;
    setEmployeeForm(employee ? { name: employee.name, account: employee.account, liveAccountId, role: employee.role, employment: employee.employment } : { name: "", account: "", liveAccountId: selectedAccountId, role: "主播", employment: "全职" });
    setDialog("employee");
  };

  const saveEmployee = () => {
    if (!employeeForm.name.trim() || !employeeForm.account.trim()) {
      setFormError("请填写员工姓名和登录账号");
      return;
    }
    if (selectedEmployee) {
      setEmployees((current) => current.map((employee) => employee.id === selectedEmployee.id ? { ...employee, ...employeeForm, status: "在职" } : employee));
      notify("员工信息已更新");
    } else {
      setEmployees((current) => [...current, { id: `emp-${Date.now()}`, ...employeeForm, status: "在职" }]);
      notify("员工已创建");
    }
    closeDialog();
  };

  const deleteEmployee = () => {
    if (!selectedEmployee) return;
    setEmployees((current) => current.filter((employee) => employee.id !== selectedEmployee.id));
    setShifts((current) => current.map((shift) => ({ ...shift, participantIds: shift.participantIds.filter((id) => id !== selectedEmployee.id) })));
    closeDialog();
    notify(`${selectedEmployee.name} 已删除，相关排班已清理`);
  };

  const openNewShift = (date = "08-19", start = 9) => {
    const accountEmployees = employees.filter((employee) => employee.liveAccountId === selectedAccountId);
    const firstRoom = liveRooms.find((room) => room.accountId === selectedAccountId);
    setSelectedShift(null);
    setShiftForm({ accountId: selectedAccountId, roomId: firstRoom?.id ?? "", date, participantIds: accountEmployees.slice(0, 3).map((employee) => employee.id), start, end: Math.min(start + 4, 24) });
    setDialog("shift");
  };

  const openShift = (shift: Shift) => {
    setSelectedShift(shift);
    setShiftForm({ accountId: shift.accountId, roomId: shift.roomId, date: shift.date, participantIds: shift.participantIds, start: shift.start, end: shift.end });
    setDialog("shift");
  };

  const saveShift = () => {
    if (!shiftForm.roomId) {
      setFormError("请选择本次开播的直播间");
      return;
    }
    if (shiftForm.participantIds.length === 0) {
      setFormError("请至少选择一名参与本场直播的员工");
      return;
    }
    if (shiftForm.end <= shiftForm.start) {
      setFormError("结束时间必须晚于开始时间");
      return;
    }
    const roomConflict = shifts.find((shift) => shift.id !== selectedShift?.id && shift.roomId === shiftForm.roomId && shift.date === shiftForm.date && shift.start < shiftForm.end && shift.end > shiftForm.start);
    if (roomConflict) {
      const room = liveRooms.find((item) => item.id === shiftForm.roomId);
      setFormError(`${room?.name ?? "该直播间"}在 ${roomConflict.start}:00-${roomConflict.end}:00 已安排直播，请调整时段`);
      return;
    }
    const participantConflict = shifts.find((shift) => shift.id !== selectedShift?.id && shift.date === shiftForm.date && shift.start < shiftForm.end && shift.end > shiftForm.start && shift.participantIds.some((id) => shiftForm.participantIds.includes(id)));
    if (participantConflict) {
      const employeeId = participantConflict.participantIds.find((id) => shiftForm.participantIds.includes(id));
      const employee = employees.find((item) => item.id === employeeId);
      setFormError(`${employee?.name ?? "参与员工"}在 ${participantConflict.start}:00-${participantConflict.end}:00 已参加其他直播，请调整人员或时段`);
      return;
    }
    if (selectedShift) {
      setShifts((current) => current.map((shift) => shift.id === selectedShift.id ? { ...shift, ...shiftForm } : shift));
      notify("排班已更新");
    } else {
      setShifts((current) => [...current, { id: `shift-${Date.now()}`, ...shiftForm }]);
      notify("排班已添加");
    }
    closeDialog();
  };

  const deleteShift = () => {
    if (!selectedShift) return;
    setShifts((current) => current.filter((shift) => shift.id !== selectedShift.id));
    closeDialog();
    notify("该班次已删除");
  };

  const renderHome = () => (
    <div className="space-y-5">
      <PageHeader title="直播账号总览" description="查看所有已绑定直播号的点赞、消耗与经营表现">
        <button onClick={() => setDialog("bind")} className={primaryButton}><Link2 className="h-4 w-4" />绑定直播号</button>
      </PageHeader>

      <section className="grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["正常同步", accounts.filter((account) => account.status === "已绑定").length, "text-emerald-600"],
          ["首次同步中", accounts.filter((account) => account.status === "首次同步中").length, "text-purple-600"],
          ["授权待处理", accounts.filter((account) => account.status === "授权即将到期").length, "text-amber-600"],
          ["当前直播中", initialSessions.filter((session) => session.status === "直播中").length, "text-rose-600"],
        ].map(([label, value, color], index) => <div key={String(label)} className={`px-5 py-4 ${index > 0 ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-xl font-black ${color}`}>{value}</p></div>)}
      </section>

      {accounts.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center">
          <Radio className="h-10 w-10 text-purple-500" />
          <h2 className="mt-4 font-black text-slate-800">暂未绑定直播号</h2>
          <p className="mt-2 text-sm text-slate-400">绑定抖音直播号后即可同步点赞、消耗与成交数据。</p>
          <button onClick={() => setDialog("bind")} className={`${primaryButton} mt-5`}><Plus className="h-4 w-4" />立即绑定</button>
        </div>
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr>{["直播账号", "直播间数", "累计点赞", "投放消耗", "成交销量", "成交金额", "综合 ROI", "状态", "操作"].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{accounts.map((account) => <tr key={account.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><button onClick={() => openAccountDetail(account)} className="flex items-center gap-3 text-left"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white"><Radio className="h-5 w-5" /></div><div><p className="font-black text-slate-800 hover:text-purple-700">{account.name}</p><p className="mt-1 text-xs text-slate-400">@{account.handle} · {account.lastSync}</p></div></button></td><td className="px-5 py-4 font-bold text-slate-700">{account.roomCount}</td><td className="px-5 py-4"><span className="flex items-center gap-1.5 font-bold text-rose-600"><Heart className="h-4 w-4" />{formatNumber(account.likes)}</span></td><td className="px-5 py-4 font-bold text-slate-700">{formatMoney(account.spend)}</td><td className="px-5 py-4 font-bold text-slate-700">{formatNumber(account.sales)}</td><td className="px-5 py-4 font-bold text-slate-900">{formatMoney(account.revenue)}</td><td className="px-5 py-4 font-black text-purple-600">{account.roi.toFixed(2)}</td><td className="px-5 py-4"><Badge tone={accountTone(account.status)}>{account.status}</Badge></td><td className="px-5 py-4"><div className="flex items-center gap-2"><button onClick={() => openAccountDetail(account)} className={iconButton} title="查看详情"><Eye className="h-4 w-4" /></button>{account.status !== "已绑定" && <button onClick={() => account.status === "授权即将到期" ? setDialog("bind") : notify(`${account.name}正在同步，请稍后刷新`)} className={iconButton} title={account.status === "授权即将到期" ? "重新授权" : "查看同步状态"}><RefreshCw className="h-4 w-4" /></button>}<button onClick={() => openUnbind(account)} className={`${iconButton} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`} title="解绑"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );

  const renderRooms = () => {
    if (!activeAccount) return <div />;
    const visibleSessions = accountSessions.filter((session) => !search.trim() || session.roomNo.includes(search.trim()) || session.host.includes(search.trim()) || session.title.includes(search.trim()));
    return <div className="space-y-5">
      <PageHeader title="我的直播间" description="按直播号与时间范围查看经营数据和每场直播明细">
        <button className={secondaryButton}><Download className="h-4 w-4" />导出数据</button>
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="self-start overflow-hidden rounded-lg border border-slate-200 bg-white lg:sticky lg:top-0">
          <div className="border-b border-slate-100 px-4 py-3"><p className="text-xs font-black text-slate-400">我名下的直播号</p></div>
          <div className="p-2">{accounts.map((account) => <button key={account.id} onClick={() => { setSelectedAccountId(account.id); setSearch(""); }} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${selectedAccountId === account.id ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedAccountId === account.id ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"}`}><Radio className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold">{account.name}</p><p className="mt-0.5 text-xs text-slate-400">{account.roomCount} 个直播间</p></div></button>)}</div>
        </aside>
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-3"><div><p className="font-black text-slate-900">{activeAccount.name}</p><p className="mt-1 text-xs text-slate-400">@{activeAccount.handle}</p></div><div className="ml-auto flex rounded-lg border border-slate-200 bg-white p-1">{["今日", "昨日", "近7天", "近30天"].map((item) => <button key={item} onClick={() => setDateRange(item)} className={`h-8 rounded-md px-3 text-xs font-bold ${dateRange === item ? "bg-purple-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{item}</button>)}</div><button className={secondaryButton}><Filter className="h-4 w-4" />自定义时间</button><button onClick={() => notify("直播数据已刷新")} className={iconButton} title="刷新"><RefreshCw className="h-4 w-4" /></button></div>
          <MetricGrid account={activeAccount} />
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-black text-slate-900">直播间列表</h2><p className="mt-1 text-xs text-slate-400">{dateRange} · 共 {visibleSessions.length} 场直播</p></div><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索直播间号、主题或主播" className={`${fieldClass} w-64 pl-9`} /></label></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr>{["直播间号", "直播主题", "主播", "开播时间", "时长", "ROI（全域）", "整体成交金额", "消耗（全域）", "整体预售订单", "直接成交订单", "点赞", "成交销量", "状态", "操作"].map((head) => <th key={head} className="whitespace-nowrap px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleSessions.length > 0 ? visibleSessions.map((session) => <tr key={session.id} className="hover:bg-slate-50/60"><td className="px-4 py-4 font-bold text-slate-800">{session.roomNo}</td><td className="px-4 py-4 text-slate-700">{session.title}</td><td className="px-4 py-4 text-slate-600">{session.host}</td><td className="whitespace-nowrap px-4 py-4 text-slate-500">{session.startedAt}</td><td className="px-4 py-4 text-slate-500">{session.duration}</td><td className="px-4 py-4 font-black text-purple-600">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : session.roi.toFixed(2)}</td><td className="px-4 py-4 font-bold text-slate-900">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : formatMoney(session.revenue)}</td><td className="px-4 py-4 text-slate-700">{formatMoney(session.spend)}</td><td className="px-4 py-4 text-slate-700">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : session.presaleOrders}</td><td className="px-4 py-4 text-slate-700">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : session.directOrders}</td><td className="px-4 py-4 text-rose-600">{formatNumber(session.likes)}</td><td className="px-4 py-4 text-slate-700">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : session.sales}</td><td className="px-4 py-4"><Badge tone={sessionTone(session.status)}>{session.status}</Badge></td><td className="px-4 py-4"><button onClick={() => openSession(session)} className="font-bold text-purple-600 hover:text-purple-700">详情</button></td></tr>) : <tr><td colSpan={14} className="px-6 py-16 text-center"><Video className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">{search ? "未找到匹配的直播场次" : "当前时间范围暂无直播记录"}</p><p className="mt-1 text-xs text-slate-400">{search ? "请更换关键词或清空搜索条件" : "直播结束并完成数据同步后将在此显示"}</p></td></tr>}</tbody></table></div>
          </section>
        </div>
      </div>
    </div>;
  };

  const renderSchedule = () => {
    const scheduledHours = accountShifts.reduce((total, shift) => total + shift.end - shift.start, 0);
    const emptyDays = weekDates.filter((day) => !accountShifts.some((shift) => shift.date === day.date)).length;
    const unstaffedSessions = accountShifts.filter((shift) => shift.participantIds.length === 0).length;
    return <div className="space-y-5">
      <PageHeader title="直播间排班" description="以直播间场次为主，纵向按日、横向按小时查看直播覆盖及参与人员">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500"><button onClick={() => setPushEnabled(!pushEnabled)} className={`relative h-6 w-11 rounded-full transition ${pushEnabled ? "bg-purple-600" : "bg-slate-200"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${pushEnabled ? "left-6" : "left-1"}`} /></button><BellRing className="h-4 w-4" />上播提醒</label>
        <button onClick={() => notify("本周排班通知已发送，主播可在移动端查看")} className={secondaryButton}><Megaphone className="h-4 w-4" />推送通知</button>
      </PageHeader>
      <div className="flex flex-wrap items-center gap-3"><select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)} className={`${fieldClass} w-56`}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><div className="flex items-center rounded-lg border border-slate-200 bg-white"><button onClick={() => notify("已切换到上一周")} className="flex h-10 w-10 items-center justify-center text-slate-500 hover:text-purple-600"><ChevronLeft className="h-4 w-4" /></button><span className="border-x border-slate-200 px-4 text-sm font-bold text-slate-700">2026.08.17 - 08.23</span><button onClick={() => notify("已切换到下一周")} className="flex h-10 w-10 items-center justify-center text-slate-500 hover:text-purple-600"><ChevronRight className="h-4 w-4" /></button></div><button onClick={() => openNewShift()} className={primaryButton}><Plus className="h-4 w-4" />设置上播时段</button><div className="ml-auto flex gap-2"><button onClick={() => setDialog("import")} className={secondaryButton}><FileSpreadsheet className="h-4 w-4" />导入 Excel</button><button onClick={() => setDialog("logs")} className={secondaryButton}><History className="h-4 w-4" />操作记录</button></div></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400">本周直播时长</p><p className="mt-1 text-xl font-black text-slate-900">{scheduledHours} 小时</p></div><div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400">参与员工</p><p className="mt-1 text-xl font-black text-slate-900">{new Set(accountShifts.flatMap((shift) => shift.participantIds)).size} 人</p></div><div className={`rounded-lg border p-4 ${emptyDays || unstaffedSessions ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}><p className="text-xs text-slate-500">排班完整性</p><p className={`mt-1 text-xl font-black ${emptyDays || unstaffedSessions ? "text-amber-700" : "text-emerald-700"}`}>{unstaffedSessions ? `${unstaffedSessions} 场直播缺人` : emptyDays ? `${emptyDays} 天未安排直播` : "本周已覆盖"}</p></div></div>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-purple-500" />主直播间</span>
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-emerald-500" />其他直播间</span>
            <span className="ml-auto">点击空白小时安排直播，点击场次编辑直播间与参与人员</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1320px]">
            <div className="sticky top-0 z-20 grid bg-slate-50" style={{ gridTemplateColumns: "120px repeat(24, minmax(50px, 1fr))" }}>
              <div className="flex items-center px-4 py-3 text-xs font-bold text-slate-400">日期 / 时间</div>
              {hours.map((hour) => <div key={hour} className="border-l border-slate-200 px-1 py-3 text-center text-[10px] font-bold text-slate-400">{String(hour).padStart(2, "0")}:00</div>)}
            </div>
            {weekDates.map((day) => {
              const dayShifts = accountShifts.filter((shift) => shift.date === day.date);
              return <div key={day.date} className={`relative grid min-h-28 border-t border-slate-100 ${day.date === "08-19" ? "bg-purple-50/20" : ""}`} style={{ gridTemplateColumns: "120px repeat(24, minmax(50px, 1fr))" }}>
                <div className="z-10 flex flex-col justify-center bg-white px-4"><p className="text-sm font-black text-slate-800">{day.date}</p><p className="mt-1 text-xs text-slate-400">{day.weekday}</p></div>
                {hours.map((hour) => <button key={hour} onClick={() => openNewShift(day.date, hour)} title={`${day.date} ${hour}:00 安排直播`} className="border-l border-slate-100 hover:bg-purple-50" />)}
                {dayShifts.map((shift, index) => {
                  const room = liveRooms.find((item) => item.id === shift.roomId);
                  const participants = shift.participantIds.map((id) => employees.find((employee) => employee.id === id)?.name).filter(Boolean).join("、");
                  const tone = index % 2 === 0 ? "border-purple-300 bg-purple-500" : "border-emerald-300 bg-emerald-500";
                  return <button key={shift.id} onClick={() => openShift(shift)} title={`${room?.name ?? "直播间"} · ${participants}`} className={`z-10 mx-1.5 h-10 overflow-hidden rounded-lg border px-2 py-1.5 text-left text-white shadow-sm ${tone}`} style={{ gridColumn: `${shift.start + 2} / span ${shift.end - shift.start}`, gridRow: 1, marginTop: `${8 + (index % 2) * 46}px` }}><span className="block truncate text-xs font-black">{room?.name ?? "未知直播间"}</span><span className="block truncate text-[10px] opacity-90">{String(shift.start).padStart(2, "0")}:00-{String(shift.end).padStart(2, "0")}:00 · {participants || "未选人员"}</span></button>;
                })}
              </div>;
            })}
          </div>
        </div>
      </section>
    </div>;
  };

  const renderTeam = () => (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b border-slate-200"><div className="flex gap-6"><button onClick={() => setTeamView("employees")} className={`border-b-2 pb-4 text-sm font-bold ${teamView === "employees" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500"}`}>部门管理</button><button onClick={() => setTeamView("roles")} className={`border-b-2 pb-4 text-sm font-bold ${teamView === "roles" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500"}`}>岗位设置</button></div>{teamView === "employees" && <button onClick={() => openEmployee()} className={`${primaryButton} mb-3`}><UserPlus className="h-4 w-4" />创建员工</button>}</div>
      {teamView === "employees" ? <><div className="flex flex-wrap gap-3"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索员工姓名、账号或岗位" className={`${fieldClass} w-72 pl-9`} /></label><select className={`${fieldClass} w-44`}><option>全部岗位</option><option>主播</option><option>助播</option><option>场控</option><option>投手</option></select><button onClick={() => notify("员工导入模板已下载")} className={`${secondaryButton} ml-auto`}><Upload className="h-4 w-4" />批量导入</button></div><section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr>{["员工信息", "登录账号", "所属直播号", "岗位", "用工类型", "状态", "操作"].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredEmployees.map((employee) => { const account = accounts.find((item) => item.id === employee.liveAccountId); const employeeStatus = account ? (employee.status || "在职") : "待重新关联"; return <tr key={employee.id} className={employeeStatus === "待重新关联" ? "bg-amber-50/30" : ""}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 font-black text-purple-600">{employee.name.slice(0, 1)}</span><b className="text-slate-800">{employee.name}</b></div></td><td className="px-5 py-4 text-slate-500">{employee.account}</td><td className="px-5 py-4 text-slate-600">{account?.name ?? <span className="font-bold text-amber-700">直播号已解绑</span>}</td><td className="px-5 py-4"><Badge tone="purple">{employee.role}</Badge></td><td className="px-5 py-4 text-slate-600">{employee.employment}</td><td className="px-5 py-4"><Badge tone={employeeStatus === "在职" ? "green" : employeeStatus === "已停用" ? "slate" : "amber"}>{employeeStatus}</Badge></td><td className="px-5 py-4"><div className="flex gap-2"><button title={employeeStatus === "待重新关联" ? "重新关联直播号" : "编辑员工"} onClick={() => openEmployee(employee)} className={iconButton}>{employeeStatus === "待重新关联" ? <Link2 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}</button><button title="删除员工" onClick={() => { setSelectedEmployee(employee); setDialog("delete_employee"); }} className={`${iconButton} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`}><Trash2 className="h-4 w-4" /></button></div></td></tr>; })}</tbody></table></div></section></> : <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><p className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">员工在不同直播号拥有多个岗位时，将合并全部岗位权限。</p><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr><th className="px-5 py-3">岗位</th><th className="px-5 py-3">员工数</th><th className="px-5 py-3">权限范围</th><th className="px-5 py-3">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{[["主播", "直播记录、主播排班、主播数据"], ["助播", "直播记录、排班查看、主播数据"], ["场控", "运营控制台、直播记录、排班查看"], ["部门管理员", "直播管理全部功能与部门配置"]].map(([role, permissions]) => <tr key={role}><td className="px-5 py-4 font-bold text-slate-800">{role}</td><td className="px-5 py-4 text-slate-500">{employees.filter((employee) => employee.role === role).length}</td><td className="px-5 py-4 text-slate-500">{permissions}</td><td className="px-5 py-4"><button onClick={() => notify(`${role}权限设置已打开`)} className="font-bold text-purple-600">修改权限</button></td></tr>)}</tbody></table></div></section>}
    </div>
  );

  const renderHosts = () => (
    <div className="space-y-5"><PageHeader title="主播数据" description="汇总已排班主播的直播时长、成交与投放表现"><button onClick={() => notify("主播数据导出任务已创建")} className={secondaryButton}><Download className="h-4 w-4" />导出数据</button></PageHeader>{activeAccount && <MetricGrid account={activeAccount} />}<section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr>{["主播", "所属直播号", "直播时长", "成交金额", "投放消耗", "全场 ROI", "成交订单", "排班完成率"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{employees.filter((employee) => ["主播", "助播"].includes(employee.role)).map((employee, index) => <tr key={employee.id}><td className="px-4 py-4 font-bold text-slate-800">{employee.name}</td><td className="px-4 py-4 text-slate-600">{accounts.find((account) => account.id === employee.liveAccountId)?.name ?? "-"}</td><td className="px-4 py-4 text-slate-600">{["32.6 小时", "28.2 小时", "19.8 小时"][index] ?? "12.5 小时"}</td><td className="px-4 py-4 font-bold">{["¥168,420", "¥146,520", "¥82,740"][index] ?? "¥38,600"}</td><td className="px-4 py-4 text-slate-600">{["¥36,520", "¥28,560", "¥20,890"][index] ?? "¥9,860"}</td><td className="px-4 py-4 font-black text-purple-600">{["4.61", "5.13", "3.96"][index] ?? "3.91"}</td><td className="px-4 py-4 text-slate-600">{["628", "524", "318"][index] ?? "126"}</td><td className="px-4 py-4"><Badge tone="green">{["96%", "92%", "88%"][index] ?? "86%"}</Badge></td></tr>)}</tbody></table></div></section></div>
  );

  const renderStores = () => (
    <div className="space-y-5"><PageHeader title="店铺管理" description="授权后同步成交、退款与订单数据"><button onClick={() => setDialog("store")} className={primaryButton}><Link2 className="h-4 w-4" />绑定店铺</button></PageHeader><section className="overflow-hidden rounded-lg border border-slate-200 bg-white">{storeBound ? <div className="grid min-w-[700px] grid-cols-[1fr_160px_180px_120px] items-center gap-4 p-5 text-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Store className="h-5 w-5" /></span><div><b className="text-slate-800">梦畅美妆旗舰店</b><p className="mt-1 text-xs text-slate-400">抖店 · 23851947</p></div></div><Badge tone="green">已授权</Badge><span className="text-slate-500">2027-08-19 到期</span><button onClick={() => setDialog("store")} className="font-bold text-purple-600">重新授权</button></div> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><Store className="h-10 w-10 text-purple-500" /><h2 className="mt-4 font-black text-slate-800">暂未绑定店铺</h2><p className="mt-2 text-sm text-slate-400">完成抖店授权后同步订单、成交与退款数据。</p><button onClick={() => setDialog("store")} className={`${primaryButton} mt-5`}>绑定店铺</button></div>}</section></div>
  );

  const renderTools = () => (
    <div className="space-y-5"><PageHeader title="辅助工具" description="用于巨量百应直播中控台的效率插件" /><section className="max-w-xl rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-start gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Bot className="h-6 w-6" /></span><div><div className="flex items-center gap-2"><h2 className="font-black text-slate-900">云管家智播助手</h2><Badge tone="green">推荐</Badge></div><p className="mt-2 text-sm leading-6 text-slate-500">支持商品自动点击讲解、自动发送评论与直播辅助操作。</p></div></div><div className="mt-5 flex gap-3 border-t border-slate-100 pt-4"><button onClick={() => setDialog("plugin")} className={primaryButton}><Download className="h-4 w-4" />点击获取</button><button onClick={() => notify("插件安装说明已打开")} className={secondaryButton}><ExternalLink className="h-4 w-4" />安装说明</button></div></section></div>
  );

  const pageMap: Record<TabId, () => React.ReactNode> = { home: renderHome, rooms: renderRooms, schedule: renderSchedule, hosts: renderHosts, team: renderTeam, stores: renderStores, tools: renderTools };

  const renderDialog = () => {
    if (dialog === "bind") return <Dialog title="绑定直播号" onClose={closeDialog} footer={<><button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={bindAccount} className={primaryButton}>确认绑定</button></>}><div className="space-y-5"><div className="grid grid-cols-3 gap-3">{["抖音扫码授权", "千川账户授权", "同步直播数据"].map((label, index) => <div key={label} className={`rounded-lg border p-3 ${index === 0 ? "border-purple-300 bg-purple-50" : "border-slate-200"}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${index === 0 ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span><p className="mt-2 text-xs font-bold text-slate-700">{label}</p></div>)}</div><div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center"><Radio className="mx-auto h-28 w-28 text-slate-900" /><p className="mt-3 text-sm font-bold text-slate-700">使用抖音 App 扫码授权</p><p className="mt-1 text-xs text-slate-400">授权完成后自动同步直播间账号</p></div></div></Dialog>;
    if (dialog === "account" && selectedAccount) { const sessions = initialSessions.filter((session) => session.accountId === selectedAccount.id); return <Dialog title="直播账号详情" onClose={closeDialog} width="max-w-4xl" footer={<button onClick={closeDialog} className={primaryButton}>关闭</button>}><div className="space-y-5"><div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white"><Radio className="h-6 w-6" /></span><div><h3 className="font-black text-slate-900">{selectedAccount.name}</h3><p className="mt-1 text-xs text-slate-400">@{selectedAccount.handle} · {selectedAccount.lastSync}</p></div><Badge tone={accountTone(selectedAccount.status)}>{selectedAccount.status}</Badge></div><div className="grid gap-3 sm:grid-cols-4">{[["成交销量", formatNumber(selectedAccount.sales)], ["销售额", formatMoney(selectedAccount.revenue)], ["累计点赞", formatNumber(selectedAccount.likes)], ["投放消耗", formatMoney(selectedAccount.spend)]].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-900">{value}</p></div>)}</div><div><h4 className="mb-3 text-sm font-black text-slate-800">直播间销量与销售额</h4><div className="overflow-x-auto rounded-lg border border-slate-200">{sessions.length > 0 ? <table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-400"><tr><th className="px-4 py-3">直播间</th><th className="px-4 py-3">主播</th><th className="px-4 py-3">销量</th><th className="px-4 py-3">销售额</th><th className="px-4 py-3">ROI</th><th className="px-4 py-3">状态</th></tr></thead><tbody className="divide-y divide-slate-100">{sessions.map((session) => <tr key={session.id}><td className="px-4 py-4 font-bold text-slate-800">{session.title}</td><td className="px-4 py-4 text-slate-600">{session.host}</td><td className="px-4 py-4">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : session.sales}</td><td className="px-4 py-4 font-bold">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : formatMoney(session.revenue)}</td><td className="px-4 py-4 font-black text-purple-600">{session.status === "数据同步中" || session.status === "数据异常" ? "--" : session.roi.toFixed(2)}</td><td className="px-4 py-4"><Badge tone={sessionTone(session.status)}>{session.status}</Badge></td></tr>)}</tbody></table> : <div className="flex min-h-40 flex-col items-center justify-center text-center"><Activity className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">暂无可展示的直播经营数据</p><p className="mt-1 text-xs text-slate-400">{selectedAccount.status === "首次同步中" ? "首次同步完成后自动展示直播记录" : "该直播号尚未产生直播场次"}</p></div>}</div></div></div></Dialog>; }
    if (dialog === "unbind" && selectedAccount) return <Dialog title="解绑直播号" onClose={closeDialog} footer={<><button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={unbindAccount} className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700">确认解绑</button></>}><div className="rounded-lg border border-rose-200 bg-rose-50 p-4"><p className="font-bold text-rose-800">确认解绑“{selectedAccount.name}”吗？</p><p className="mt-2 text-sm leading-6 text-rose-700">解绑后将停止同步直播、投放与成交数据；历史数据仍保留，相关员工和排班会显示为直播号已解绑。</p></div></Dialog>;
    if (dialog === "session" && selectedSession) {
      const dataUnavailable = selectedSession.status === "数据同步中" || selectedSession.status === "数据异常";
      const metrics = [
        ["整体成交金额", dataUnavailable ? "--" : formatMoney(selectedSession.revenue)],
        ["成交销量", dataUnavailable ? "--" : formatNumber(selectedSession.sales)],
        ["消耗（全域）", formatMoney(selectedSession.spend)],
        ["ROI（全域）", dataUnavailable ? "--" : selectedSession.roi.toFixed(2)],
        ["整体预售订单", dataUnavailable ? "--" : formatNumber(selectedSession.presaleOrders)],
        ["直接成交订单", dataUnavailable ? "--" : formatNumber(selectedSession.directOrders)],
        ["直播点赞", formatNumber(selectedSession.likes)],
        ["直播时长", selectedSession.duration],
      ];
      return <Dialog title="直播场次详细数据" onClose={closeDialog} width="max-w-5xl" footer={<>{dataUnavailable && <button onClick={() => { closeDialog(); notify(selectedSession.status === "数据异常" ? "已重新发起数据同步，请先检查店铺授权" : "同步任务仍在进行中"); }} className={secondaryButton}><RefreshCw className="h-4 w-4" />{selectedSession.status === "数据异常" ? "重新同步" : "刷新状态"}</button>}<button onClick={closeDialog} className={primaryButton}>关闭</button></>}><div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{selectedSession.title}</h3><p className="mt-1 text-xs text-slate-400">直播间号 {selectedSession.roomNo} · {selectedSession.startedAt} · 主播 {selectedSession.host}</p></div><Badge tone={sessionTone(selectedSession.status)}>{selectedSession.status}</Badge></div>{selectedSession.dataNote && <div className={`flex items-start gap-3 rounded-lg border p-4 ${selectedSession.status === "数据异常" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-purple-200 bg-purple-50 text-purple-700"}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p className="text-sm font-bold leading-6">{selectedSession.dataNote}</p></div>}<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-900">{value}</p></div>)}</div>{dataUnavailable ? <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center"><Activity className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">经营趋势暂不可用</p><p className="mt-1 text-xs text-slate-400">成交数据同步完成后自动生成小时趋势与投放分析</p></div> : <div className="grid gap-4 lg:grid-cols-[1fr_280px]"><div className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-bold text-slate-400">小时成交趋势</p><div className="mt-4 flex h-36 items-end gap-2">{[24, 38, 52, 68, 60, 82, 74, 92, 66].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t bg-purple-400" style={{ height: `${height}%` }} /><span className="text-[9px] text-slate-400">{index + 9}时</span></div>)}</div></div><div className="space-y-3 rounded-lg border border-slate-200 p-4"><p className="text-xs font-bold text-slate-400">投放分析</p><div className="flex justify-between text-sm"><span className="text-slate-500">千川消耗</span><b>{formatMoney(selectedSession.spend)}</b></div><div className="flex justify-between text-sm"><span className="text-slate-500">支付 ROI</span><b className="text-purple-600">{selectedSession.roi.toFixed(2)}</b></div><div className="flex justify-between text-sm"><span className="text-slate-500">订单成本</span><b>{formatMoney(Math.round(selectedSession.spend / (selectedSession.directOrders + selectedSession.presaleOrders)))}</b></div></div></div>}</div></Dialog>;
    }
    if (dialog === "employee") return <Dialog title={selectedEmployee ? "编辑员工" : "创建员工"} onClose={closeDialog} footer={<><button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={saveEmployee} className={primaryButton}>{selectedEmployee ? "保存修改" : "确认创建"}</button></>}><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-bold text-slate-600">员工姓名<input value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} className={fieldClass} /></label><label className="space-y-2 text-sm font-bold text-slate-600">登录账号<input value={employeeForm.account} onChange={(event) => setEmployeeForm({ ...employeeForm, account: event.target.value })} className={fieldClass} /></label><label className="space-y-2 text-sm font-bold text-slate-600">所属直播号<select value={employeeForm.liveAccountId} onChange={(event) => setEmployeeForm({ ...employeeForm, liveAccountId: event.target.value })} className={fieldClass}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="space-y-2 text-sm font-bold text-slate-600">岗位<select value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value })} className={fieldClass}><option>主播</option><option>助播</option><option>场控</option><option>中控</option><option>投手</option><option>部门管理员</option></select></label><label className="space-y-2 text-sm font-bold text-slate-600">用工类型<select value={employeeForm.employment} onChange={(event) => setEmployeeForm({ ...employeeForm, employment: event.target.value })} className={fieldClass}><option>全职</option><option>兼职</option></select></label></div>{formError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{formError}</p>}</div></Dialog>;
    if (dialog === "delete_employee" && selectedEmployee) return <Dialog title="删除员工" onClose={closeDialog} footer={<><button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={deleteEmployee} className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700">确认删除</button></>}><div className="rounded-lg border border-rose-200 bg-rose-50 p-4"><p className="font-bold text-rose-800">确认删除员工“{selectedEmployee.name}”吗？</p><p className="mt-2 text-sm leading-6 text-rose-700">删除后，该员工会从尚未执行的直播场次参与名单中移除，直播间排班本身仍然保留。</p></div></Dialog>;
    if (dialog === "shift") {
      const availableEmployees = employees.filter((employee) => employee.liveAccountId === shiftForm.accountId);
      const availableRooms = liveRooms.filter((room) => room.accountId === shiftForm.accountId);
      return <Dialog title={selectedShift ? "编辑直播场次" : "设置直播场次"} onClose={closeDialog} footer={<>{selectedShift && <button onClick={deleteShift} className="mr-auto inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" />删除场次</button>}<button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={saveShift} className={primaryButton}>保存排班</button></>}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-bold text-slate-600">直播号<select value={shiftForm.accountId} onChange={(event) => { const accountId = event.target.value; const room = liveRooms.find((item) => item.accountId === accountId); setShiftForm({ ...shiftForm, accountId, roomId: room?.id ?? "", participantIds: [] }); }} className={fieldClass}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
            <label className="space-y-2 text-sm font-bold text-slate-600">直播间<select value={shiftForm.roomId} onChange={(event) => setShiftForm({ ...shiftForm, roomId: event.target.value })} className={fieldClass}>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
            <label className="space-y-2 text-sm font-bold text-slate-600">日期<select value={shiftForm.date} onChange={(event) => setShiftForm({ ...shiftForm, date: event.target.value })} className={fieldClass}>{weekDates.map((day) => <option key={day.date} value={day.date}>{day.date} {day.weekday}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label className="space-y-2 text-sm font-bold text-slate-600">开始时间<select value={shiftForm.start} onChange={(event) => setShiftForm({ ...shiftForm, start: Number(event.target.value) })} className={fieldClass}>{hours.map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label><label className="space-y-2 text-sm font-bold text-slate-600">结束时间<select value={shiftForm.end} onChange={(event) => setShiftForm({ ...shiftForm, end: Number(event.target.value) })} className={fieldClass}>{Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label></div>
          </div>
          <div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold text-slate-600">参与本场直播的员工</p><span className="text-xs text-slate-400">仅显示部门管理中绑定该直播号的员工</span></div><div className="grid gap-2 sm:grid-cols-2">{availableEmployees.map((employee) => { const checked = shiftForm.participantIds.includes(employee.id); return <label key={employee.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${checked ? "border-purple-300 bg-purple-50" : "border-slate-200 hover:border-purple-200"}`}><input type="checkbox" checked={checked} onChange={() => setShiftForm({ ...shiftForm, participantIds: checked ? shiftForm.participantIds.filter((id) => id !== employee.id) : [...shiftForm.participantIds, employee.id] })} className="h-4 w-4 accent-purple-600" /><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-purple-600">{employee.name.slice(0, 1)}</span><span><span className="block text-sm font-bold text-slate-700">{employee.name}</span><span className="block text-xs text-slate-400">{employee.role} · {employee.employment}</span></span></label>; })}</div>{availableEmployees.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">该直播号尚未绑定员工，请先前往部门管理配置</p>}</div>
          {formError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{formError}</p>}
          <p className="rounded-lg bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">保存时会同时检查直播间占用和参与员工跨直播间撞班；开启上播提醒后，本场直播安排会推送给全部参与员工。</p>
        </div>
      </Dialog>;
    }
    if (dialog === "import") return <Dialog title="导入排班" onClose={closeDialog} footer={<><button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={() => { closeDialog(); notify("排班表已导入并完成冲突检查"); }} className={primaryButton}>确认导入</button></>}><div className="space-y-4"><button onClick={() => notify("排班导入模板已下载")} className={secondaryButton}><Download className="h-4 w-4" />下载导入模板</button><label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-200 bg-purple-50/40"><FileSpreadsheet className="h-10 w-10 text-purple-500" /><span className="mt-3 text-sm font-bold text-slate-700">点击上传 Excel 排班表</span><span className="mt-1 text-xs text-slate-400">导入后将校验人员与时段冲突</span><input type="file" accept=".xlsx,.xls" className="hidden" /></label></div></Dialog>;
    if (dialog === "logs") return <Dialog title="排班操作记录" onClose={closeDialog} footer={<button onClick={closeDialog} className={primaryButton}>关闭</button>}><div className="space-y-5">{[["今天 10:26", "新增梦畅美妆主直播间 08-19 09:00-13:00 场次"], ["昨天 18:42", "向本周直播参与员工推送排班通知"], ["08-17 11:08", "导入直播间排班表.xlsx"]].map(([time, action]) => <div key={time} className="flex gap-3"><span className="mt-1 h-3 w-3 rounded-full bg-purple-500" /><div><p className="text-sm font-bold text-slate-700">{action}</p><p className="mt-1 text-xs text-slate-400">{time} · 操作人 徐振</p></div></div>)}</div></Dialog>;
    if (dialog === "store") return <Dialog title="绑定店铺" onClose={closeDialog} footer={<><button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={() => { setStoreBound(true); closeDialog(); notify("店铺授权成功，订单数据开始同步"); }} className={primaryButton}>确认绑定</button></>}><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-purple-200 bg-purple-50 p-5"><WalletCards className="h-8 w-8 text-purple-600" /><p className="mt-3 text-sm font-black text-slate-800">第一步：订阅服务</p><p className="mt-1 text-xs leading-5 text-slate-500">前往抖店服务市场订阅商品推广管家。</p></div><div className="rounded-lg border border-slate-200 p-5"><ShieldCheck className="h-8 w-8 text-purple-600" /><p className="mt-3 text-sm font-black text-slate-800">第二步：完成授权</p><p className="mt-1 text-xs leading-5 text-slate-500">授权后同步订单、成交与退款数据。</p></div></div></Dialog>;
    if (dialog === "plugin") return <Dialog title="获取云管家智播助手" onClose={closeDialog} footer={<><button onClick={closeDialog} className={secondaryButton}>取消</button><button onClick={() => { closeDialog(); notify("智播助手安装包已加入下载任务"); }} className={primaryButton}>下载安装包</button></>}><div className="space-y-4"><div className="flex items-center gap-4 rounded-lg bg-blue-50 p-4"><Bot className="h-8 w-8 text-blue-600" /><div><p className="font-black text-slate-800">云管家智播助手 v2.6.1</p><p className="mt-1 text-xs text-slate-500">适用于 Chrome / Edge 浏览器</p></div></div><ol className="space-y-3 text-sm text-slate-600"><li>1. 下载并解压插件安装包</li><li>2. 进入浏览器扩展管理并开启开发者模式</li><li>3. 加载扩展后打开巨量百应直播中控台</li></ol></div></Dialog>;
    return null;
  };

  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-800"><div className="shrink-0 border-b border-slate-200 bg-white px-4 pt-3 sm:px-6"><div className="flex items-center gap-1 overflow-x-auto pb-2">{tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} onClick={() => switchTab(tab.id)} className={`flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition sm:px-4 ${active ? "bg-purple-50 text-purple-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon className={`h-4 w-4 ${active ? "text-purple-600" : "text-slate-400"}`} />{tab.label}</button>; })}<button onClick={() => notify("直播管理数据已刷新")} title="刷新" className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-purple-600"><RefreshCw className="h-4 w-4" /></button></div></div><main className="flex-1 overflow-y-auto p-4 sm:p-6">{pageMap[activeTab]()}</main>{toast && <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-400" />{toast}</div>}{renderDialog()}</div>;
}
