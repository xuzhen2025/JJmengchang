import React, { useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  Infinity,
  KeyRound,
  Link2,
  LogOut,
  Plus,
  Power,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  Company,
  PlatformUser,
  createCompany,
  createPlatformUser,
  readCompanies,
  readPlatformUsers,
  resetUserPassword,
  savePlatformAccounts,
  toggleUserStatus,
  updateCompanyStatus,
  updateUserCompany,
  USER_DEFAULT_PASSWORD,
} from "../data/companies";

interface PlatformAdminViewProps {
  onLogout: () => void;
}

const RESERVED_USERNAMES = new Set(["chaojiguanliyuan", "putongyonghu", "guanliyuan", "platform_admin", "mem_prototype_operator"]);

/** 公司数据变更事件：通知登录端刷新账号列表 */
export const COMPANY_CHANGE_EVENT = "mengchang-company-change";
function notifyCompanyChange() {
  window.dispatchEvent(new Event(COMPANY_CHANGE_EVENT));
}

const DEFAULT_LOGO_COLORS = ["from-purple-600 to-indigo-600", "from-rose-500 to-orange-400", "from-emerald-500 to-teal-400", "from-sky-500 to-blue-600", "from-amber-500 to-red-400", "from-fuchsia-500 to-purple-500"];

export default function PlatformAdminView({ onLogout }: PlatformAdminViewProps) {
  const [tab, setTab] = useState<"companies" | "users">("companies");
  const [companies, setCompanies] = useState<Company[]>(() => readCompanies());
  const [users, setUsers] = useState<PlatformUser[]>(() => readPlatformUsers());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refresh = () => {
    setCompanies(readCompanies());
    setUsers(readPlatformUsers());
  };

  // ---------------- 新建公司 ----------------
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    platformName: "",
    logo: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
    email: "",
    remark: "",
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

  const submitCreate = () => {
    setError("");
    if (!form.name.trim() || !form.platformName.trim() || !form.contactPerson.trim() || !form.contactPhone.trim()) {
      setError("请填写企业名称、平台名称、联系人、联系电话");
      return;
    }
    const company = createCompany({
      name: form.name,
      code: form.code || `MC-${String(companies.length + 1).padStart(3, "0")}`,
      platformName: form.platformName,
      logo: form.logo,
      address: form.address,
      contactPerson: form.contactPerson,
      contactPhone: form.contactPhone,
      email: form.email,
      remark: form.remark,
    });
    refresh();
    notifyCompanyChange();
    setCreateOpen(false);
    setForm({ name: "", code: "", platformName: "", logo: "", address: "", contactPerson: "", contactPhone: "", email: "", remark: "" });
    setNotice(`公司「${company.name}」已创建，可到「用户管理」添加管理员并绑定该公司`);
  };

  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const toggleStatus = (company: Company) => {
    updateCompanyStatus(company.id, company.status === "active" ? "disabled" : "active");
    refresh();
    notifyCompanyChange();
    setNotice(company.status === "active" ? `公司「${company.name}」已停用，其账号将无法登录` : `公司「${company.name}」已启用`);
  };

  // ---------------- 添加用户 ----------------
  const [userOpen, setUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", phone: "", email: "", remark: "" });

  const submitCreateUser = () => {
    setError("");
    const phone = userForm.phone.trim();
    if (!userForm.name.trim() || !phone) {
      setError("请填写真实姓名与手机号");
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      setError("手机号格式不正确");
      return;
    }
    const allAccounts = new Set<string>([
      ...RESERVED_USERNAMES,
      ...readPlatformUsers().map((u) => u.username),
    ]);
    if (allAccounts.has(phone)) {
      setError("该手机号已被使用，账号需全局唯一");
      return;
    }
    const user = createPlatformUser({ name: userForm.name, phone, email: userForm.email, remark: userForm.remark });
    refresh();
    setUserOpen(false);
    setUserForm({ name: "", phone: "", email: "", remark: "" });
    setNotice(`管理员「${user.name}」已创建，账号 ${user.username}（默认密码 ${USER_DEFAULT_PASSWORD}），可在列表绑定公司`);
  };

  // ---------------- 绑定公司 ----------------
  const [bindUser, setBindUser] = useState<PlatformUser | null>(null);
  const [bindCompanyId, setBindCompanyId] = useState("");

  const openBind = (user: PlatformUser) => {
    setBindUser(user);
    setBindCompanyId(user.companyId || "");
    setError("");
  };

  const submitBind = () => {
    if (!bindUser || !bindCompanyId) return;
    updateUserCompany(bindUser.id, bindCompanyId);
    const company = readCompanies().find((c) => c.id === bindCompanyId);
    refresh();
    notifyCompanyChange();
    setBindUser(null);
    setNotice(`管理员「${bindUser.name}」已绑定公司「${company?.name || ""}」，该账号登录后进入该公司工作台`);
  };

  const doResetPassword = (user: PlatformUser) => {
    resetUserPassword(user.id);
    refresh();
    setNotice(`管理员「${user.name}」密码已重置为 ${USER_DEFAULT_PASSWORD}`);
  };

  const doToggleUser = (user: PlatformUser) => {
    toggleUserStatus(user.id);
    refresh();
    notifyCompanyChange();
    setNotice(user.status === "active" ? `管理员「${user.name}」已停用` : `管理员「${user.name}」已启用`);
  };

  const companyNameOf = (companyId: string) => {
    const c = companies.find((x) => x.id === companyId);
    return c ? c.name : "";
  };
  const companyLogoClass = (index: number) => DEFAULT_LOGO_COLORS[index % DEFAULT_LOGO_COLORS.length];

  // ---------------- 平台账号 ----------------
  const [platformOpen, setPlatformOpen] = useState(false);
  const [platformPassword, setPlatformPassword] = useState("");

  const savePlatform = () => {
    const accounts = [{ username: "platform_admin", password: platformPassword || "123456", label: "平台管理员" }];
    savePlatformAccounts(accounts);
    setPlatformOpen(false);
    setPlatformPassword("");
    setNotice("平台管理员密码已更新（账号 platform_admin）");
  };

  const activeCount = useMemo(() => companies.filter((c) => c.status === "active").length, [companies]);
  const activeUserCount = useMemo(() => users.filter((u) => u.status === "active").length, [users]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800">
      {/* 顶部 */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 text-white">
            <Infinity className="h-5 w-5 stroke-[3]" />
          </span>
          <div>
            <p className="text-base font-black leading-tight">平台管理系统</p>
            <p className="text-[11px] text-slate-400">管理所有公司及其超级管理员</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-600">
            <ShieldCheck className="h-4 w-4" />平台管理员
          </span>
          <button
            type="button"
            onClick={() => setPlatformOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-purple-300 hover:text-purple-600"
          >
            <Settings2 className="h-4 w-4" />平台账号
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />退出登录
          </button>
        </div>
      </header>

      {/* 页签 */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setTab("companies")}
            className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-bold transition ${tab === "companies" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <Building2 className="h-4 w-4" />公司管理
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-bold transition ${tab === "users" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <Users className="h-4 w-4" />用户管理
          </button>
        </div>
      </div>

      {/* 内容 */}
      <main className="flex-1 overflow-y-auto p-6">
        {notice && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <span className="flex items-center gap-2"><Check className="h-4 w-4" />{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="关闭提示"><X className="h-4 w-4" /></button>
          </div>
        )}

        {tab === "companies" && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black">公司管理</h1>
                <p className="mt-1 text-sm text-slate-500">共 {companies.length} 家公司（{activeCount} 家正常）</p>
              </div>
              <button
                type="button"
                onClick={() => { setError(""); setCreateOpen(true); }}
                className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />新建公司
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-bold text-slate-500">
                    <th className="px-4 py-3">企业名称</th>
                    <th className="px-4 py-3">平台名称</th>
                    <th className="px-4 py-3">编码</th>
                    <th className="px-4 py-3">联系人</th>
                    <th className="px-4 py-3">联系电话</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, index) => (
                    <tr key={company.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {company.logo ? (
                            <img src={company.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                          ) : (
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr text-xs font-black text-white ${companyLogoClass(index)}`}>
                              {(company.name || "企").slice(0, 1)}
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{company.name}</p>
                            {company.address && <p className="text-[11px] text-slate-400">{company.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-bold text-purple-600">{company.platformName}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{company.code}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{company.contactPerson || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{company.contactPhone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${company.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${company.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {company.status === "active" ? "正常" : "已停用"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleStatus(company)}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold transition ${company.status === "active" ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
                        >
                          <Power className="h-3 w-3" />{company.status === "active" ? "停用" : "启用"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">暂无公司，点击"新建公司"创建</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "users" && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black">用户管理</h1>
                <p className="mt-1 text-sm text-slate-500">共 {users.length} 个管理员（{activeUserCount} 个正常）· 均为公司超级管理员</p>
              </div>
              <button
                type="button"
                onClick={() => { setError(""); setUserOpen(true); }}
                className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />添加用户
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-bold text-slate-500">
                    <th className="px-4 py-3">真实姓名</th>
                    <th className="px-4 py-3">账号（手机号）</th>
                    <th className="px-4 py-3">邮箱</th>
                    <th className="px-4 py-3">所属公司</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                            <UserRound className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-bold text-slate-800">{user.name}</p>
                            {user.remark && <p className="text-[11px] text-slate-400">{user.remark}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{user.username}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{user.email || "—"}</td>
                      <td className="px-4 py-3">
                        {user.companyId ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                            <Building2 className="h-3 w-3" />{companyNameOf(user.companyId)}
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600">未绑定公司</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${user.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {user.status === "active" ? "正常" : "已停用"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openBind(user)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-purple-300 hover:text-purple-600"
                          >
                            <Link2 className="h-3 w-3" />{user.companyId ? "更换公司" : "绑定公司"}
                          </button>
                          <button
                            type="button"
                            onClick={() => doResetPassword(user)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-amber-300 hover:text-amber-600"
                          >
                            <KeyRound className="h-3 w-3" />重置密码
                          </button>
                          <button
                            type="button"
                            onClick={() => doToggleUser(user)}
                            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold transition ${user.status === "active" ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
                          >
                            <Power className="h-3 w-3" />{user.status === "active" ? "停用" : "启用"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">暂无用户，点击"添加用户"创建</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">提示：新增管理员默认密码 {USER_DEFAULT_PASSWORD}，添加后可重置；一个管理员只能绑定一家公司，绑定后该账号登录进入对应公司工作台。</p>
          </>
        )}
      </main>

      {/* 新建公司弹窗 */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">新建公司</h3>
              <button type="button" onClick={() => setCreateOpen(false)} aria-label="关闭" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-xs text-slate-400">创建公司档案；公司管理员到「用户管理」添加并绑定</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">企业名称<span className="text-rose-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：星海传媒有限公司" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">公司编码（选填）</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如：XH-001" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">平台名称<span className="text-rose-500">*</span></label>
                  <input value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} placeholder="工作台左上角显示，如：星海" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">公司 Logo</label>
                <div className="flex items-center gap-3">
                  {form.logo ? (
                    <img src={form.logo} alt="logo" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">无</span>
                  )}
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">上传图片</button>
                  {form.logo && <button type="button" onClick={() => setForm({ ...form, logo: "" })} className="text-xs font-bold text-rose-500">移除</button>}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">办公地址（选填）</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="公司办公地址" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">联系人<span className="text-rose-500">*</span></label>
                  <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="公司联系人" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">联系电话<span className="text-rose-500">*</span></label>
                  <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="联系电话" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">邮箱（选填）</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="公司邮箱" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">备注（选填）</label>
                  <input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="备注说明" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
                </div>
              </div>
              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">取消</button>
              <button type="button" onClick={submitCreate} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">创建公司</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加用户弹窗 */}
      {userOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">添加管理员</h3>
              <button type="button" onClick={() => setUserOpen(false)} aria-label="关闭" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-xs text-slate-400">账号即手机号（全局唯一），默认密码 {USER_DEFAULT_PASSWORD}，创建后在列表绑定公司</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">真实姓名<span className="text-rose-500">*</span></label>
                <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="如：李总" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">手机号<span className="text-rose-500">*</span></label>
                <input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} placeholder="11 位手机号，登录账号" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">邮箱（选填）</label>
                <input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="邮箱" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">备注（选填）</label>
                <input value={userForm.remark} onChange={(e) => setUserForm({ ...userForm, remark: e.target.value })} placeholder="备注说明" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
              </div>
              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setUserOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">取消</button>
              <button type="button" onClick={submitCreateUser} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">创建管理员</button>
            </div>
          </div>
        </div>
      )}

      {/* 绑定公司弹窗 */}
      {bindUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">绑定所属公司</h3>
              <button type="button" onClick={() => setBindUser(null)} aria-label="关闭" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-xs text-slate-400">管理员「{bindUser.name}」登录后进入所选公司的工作台（一个用户只能绑定一家公司）</p>
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">所属公司</label>
              <select value={bindCompanyId} onChange={(e) => setBindCompanyId(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50">
                <option value="">请选择公司</option>
                {companies.filter((c) => c.status === "active").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}（{c.platformName}）</option>
                ))}
              </select>
              {companies.filter((c) => c.status === "active").length === 0 && (
                <p className="mt-2 text-xs font-semibold text-rose-500">暂无可绑定的正常公司，请先在公司管理新建公司</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setBindUser(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">取消</button>
              <button type="button" onClick={submitBind} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 平台账号弹窗 */}
      {platformOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">平台账号设置</h3>
              <button type="button" onClick={() => setPlatformOpen(false)} aria-label="关闭" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-xs text-slate-400">平台管理员账号固定为 platform_admin，可修改密码</p>
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">新密码</label>
              <input value={platformPassword} onChange={(e) => setPlatformPassword(e.target.value)} placeholder="输入新密码（不填保持 123456）" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPlatformOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">取消</button>
              <button type="button" onClick={savePlatform} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
