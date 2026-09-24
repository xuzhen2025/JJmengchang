import React from "react";
import { Building2, Clock } from "lucide-react";

interface PersonalInformationPanelProps {
  name: string;
  role: string;
  employeeId: string;
  phone: string;
  email: string;
  recentLogin: string;
  company: string;
  companyLevel: string;
  parentNode: string;
  structureType: string;
  hierarchySummary: string;
  actions: React.ReactNode;
}

const AVATAR_URL = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop";

export default function PersonalInformationPanel({
  name,
  role,
  employeeId,
  phone,
  email,
  recentLogin,
  company,
  companyLevel,
  parentNode,
  structureType,
  hierarchySummary,
  actions,
}: PersonalInformationPanelProps) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-purple-100/40 to-pink-100/20 blur-3xl" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={AVATAR_URL}
                alt="User Avatar"
                className="h-20 w-20 rounded-2xl border-2 border-purple-500/30 object-cover shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" title="当前在线" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{name}</h2>
                <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                  {role}
                </span>
              </div>

              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-mono">工号: {employeeId}</span>
                <span>•</span>
                <span>手机号: {phone}</span>
                <span>•</span>
                <span>邮箱: {email}</span>
              </p>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                <span>{recentLogin}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
            {actions}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-extrabold text-slate-800">所属部门与分组架构</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div>
              <p className="text-[10px] font-medium text-slate-400">所属主体/公司</p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{company}</p>
            </div>
            <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-800">{companyLevel}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-medium text-slate-400">上级节点</p>
              <p className="mt-0.5 font-semibold text-slate-700">{parentNode}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-medium text-slate-400">架构类型</p>
              <p className="mt-0.5 font-semibold text-slate-700">{structureType}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-medium text-slate-400">下辖部门与分组</p>
            <p className="mt-0.5 font-semibold text-slate-700">{hierarchySummary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
