import React, { useState } from "react";
import { Check, X, Coins, CheckCircle, XCircle } from "lucide-react";
import { AppMessage } from "../types";

interface ApprovalActionBoxProps {
  message: AppMessage;
  onApprove: (msgId: string) => void;
  onReject: (msgId: string, rejectReason: string) => void;
}

export default function ApprovalActionBox({ message, onApprove, onReject }: ApprovalActionBoxProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectInput, setRejectInput] = useState("");

  if (message.approvalStatus === "approved") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 mt-4">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <div className="font-extrabold text-xs text-emerald-900">审核结果：已同意并全额加算 (+{message.creditsAmount || 500} 积分)</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">该笔积分已自动归集至申请人的可用积分账户与明细账单。</div>
        </div>
      </div>
    );
  }

  if (message.approvalStatus === "rejected") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 mt-4">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <div className="font-extrabold text-xs text-rose-900">审核结果：已被驳回/不同意</div>
          <div className="text-[11px] text-rose-700 mt-0.5">驳回说明：{message.rejectReason || "不符合当前月度申请额度说明"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 border border-purple-200 rounded-2xl p-4 space-y-3 mt-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-purple-600" />
          <span>部长审批处理 ({message.creditsAmount || 500} 积分)</span>
        </div>
        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 animate-pulse">
          待审批
        </span>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        申请人【<strong className="text-slate-900">{message.applicantName || "梁靖淇"}</strong>】申请补给【<strong className="text-purple-700 font-mono">{message.creditsAmount || 500} 积分</strong>】。请您进行审核操作：
      </p>

      {isRejecting ? (
        <div className="space-y-2 pt-1">
          <label className="block text-[11px] font-bold text-slate-700">请填写驳回原因：</label>
          <input
            type="text"
            value={rejectInput}
            onChange={(e) => setRejectInput(e.target.value)}
            placeholder="例：本月部门算力额度已耗尽，请调整申请方案..."
            className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-sans"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsRejecting(false)}
              className="px-3 py-1 text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={() => {
                onReject(message.id, rejectInput.trim() || "本月部门算力额度已达上限");
                setIsRejecting(false);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              确认驳回
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onApprove(message.id)}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>同意申请 (+{message.creditsAmount || 500} 积分)</span>
          </button>

          <button
            onClick={() => setIsRejecting(true)}
            className="flex-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>不同意 / 驳回</span>
          </button>
        </div>
      )}
    </div>
  );
}
