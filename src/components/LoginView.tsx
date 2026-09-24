import React, { useMemo, useState } from "react";
import { recordLogin } from "../lib/operationHistory";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Infinity,
  LockKeyhole,
  UserRound,
} from "lucide-react";

export type AppMode = "user" | "admin";

export interface PrototypeAccount {
  username: string;
  password: string;
  label: string;
  description: string;
  allowedModes: AppMode[];
  defaultMode: AppMode;
}

interface LoginViewProps {
  accounts: PrototypeAccount[];
  onLogin: (account: PrototypeAccount) => void;
}

export default function LoginView({ accounts, onLogin }: LoginViewProps) {
  const [username, setUsername] = useState(accounts[0]?.username ?? "");
  const [password, setPassword] = useState(accounts[0]?.password ?? "");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.username === username) || null,
    [accounts, username],
  );

  const selectAccount = (account: PrototypeAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    setAccountMenuOpen(false);
    setError("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const account = accounts.find((item) => item.username === username.trim());
    if (!account) {
      setError("账号不存在");
      return;
    }
    if (password !== account.password) {
      recordLogin(account.username, false, "密码验证失败");
      setError("账号或密码不正确");
      return;
    }
    onLogin(account);
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fbf9ff_0%,#f3f6ff_48%,#eef6ff_100%)] px-4 py-10 font-sans text-slate-950">
      <section className="grid w-full max-w-[1188px] overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(88,104,143,0.22)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative flex min-h-[520px] flex-col justify-between border-b border-slate-200 bg-[linear-gradient(145deg,#fbf9ff_0%,#f6f5ff_42%,#f2f7ff_100%)] px-8 py-9 sm:px-10 lg:border-b-0 lg:border-r lg:px-12">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-20 items-center justify-center text-slate-950">
              <Infinity className="h-12 w-20 stroke-[3]" />
            </span>
            <span className="text-3xl font-black tracking-normal">梦畅AIGC</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">回到你的视觉创作台</h1>
            <ul className="mt-20 space-y-3 text-sm font-medium text-slate-600">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                爆款复刻与成片再创作
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                资源库素材、成片、脚本统一管理
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                数据分析与操作记录持续追踪
              </li>
            </ul>
          </div>

          <p className="max-w-md text-sm leading-7 text-slate-500">
            登录后可继续进行爆款复刻、资源整理、投放数据查看和账号操作追溯，一期常用工作流都能直接接上。
          </p>
        </div>

        <div className="flex min-h-[520px] items-center px-8 py-10 sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-[530px]">
            <p className="text-sm font-bold text-violet-400">欢迎回来</p>
            <h2 className="mt-4 text-4xl font-black tracking-normal">登录 梦畅AIGC</h2>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              继续你的电商内容复刻、资源管理与数据分析。
            </p>

            <form onSubmit={handleSubmit} className="mt-14 space-y-7">
              <div>
                <label htmlFor="login-username" className="mb-2 block text-sm font-black text-slate-700">
                  用户名或邮箱
                </label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setError("");
                    }}
                    placeholder="输入用户名或已绑定邮箱"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((open) => !open)}
                    title="选择原型账号"
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {accountMenuOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="关闭账号列表"
                        className="fixed inset-0 z-20 cursor-default"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                        {accounts.map((account) => (
                          <button
                            key={account.username}
                            type="button"
                            onClick={() => selectAccount(account)}
                            className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-slate-50"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                              <UserRound className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-slate-800">{account.username}</span>
                              <span className="mt-0.5 block text-[11px] text-slate-400">{account.description}</span>
                            </span>
                            {selectedAccount?.username === account.username && <Check className="h-4 w-4 text-slate-800" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-black text-slate-700">
                  密码
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="请输入密码"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    title={showPassword ? "隐藏密码" : "显示密码"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="min-h-5 text-sm font-semibold text-rose-600">{error}</div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-slate-950 text-base font-black text-white shadow-sm transition hover:bg-slate-800"
              >
                登录并继续
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-5 flex justify-center gap-3 text-sm">
              <span className="text-slate-400">还没有账号？</span>
              <button type="button" className="font-black text-slate-800 hover:text-slate-950">立即注册</button>
              <span className="text-slate-300">/</span>
              <button type="button" className="font-black text-slate-800 hover:text-slate-950">忘记密码</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
