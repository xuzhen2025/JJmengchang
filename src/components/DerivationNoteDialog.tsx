import React, { useState } from "react";
import { AdDialog, buttonClass, primaryClass } from "./AdPushDialogs";
import { getAdActor } from "../lib/adPush";
import { getDerivationNoteHistory } from "../lib/videoDerivation";

export default function DerivationNoteDialog({ initialNote, onClose, onSave }: {
  initialNote: string; onClose: () => void; onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState("");
  const history = getDerivationNoteHistory(getAdActor().id);
  return <AdDialog title="填写备注" onClose={onClose} footer={<>
    <button className={buttonClass} onClick={onClose}>取消</button>
    <button className={primaryClass} onClick={() => { try { onSave(note); } catch (e) { setError(e instanceof Error ? e.message : "保存失败"); } }}>确定</button>
  </>}>
    <div className="flex items-start gap-4">
      <label htmlFor="derivation-note" className="shrink-0 pt-3 text-sm text-slate-600">备注:</label>
      <textarea id="derivation-note" aria-label="记录备注" autoFocus maxLength={200} value={note} onChange={e => { setNote(e.target.value); setError(""); }} placeholder="多个备注关键词请使用逗号（,）隔开，方便系统自动识别" className="min-h-36 min-w-0 flex-1 resize-y rounded-md border border-violet-400 p-3 text-sm outline-none focus:ring-2 focus:ring-violet-100" />
    </div>
    <h4 className="mb-3 mt-6 text-sm font-medium text-slate-700">历史记录</h4>
    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
      {history.map(value => <button key={value} type="button" className={`${buttonClass} max-w-full break-words text-left`} onClick={() => {
        const next = [note.trim(), value].filter(Boolean).join(", ");
        if (next.length > 200) { setError("备注最多200个字"); return; }
        setNote(next); setError("");
      }}>{value}</button>)}
      {!history.length && <p className="text-xs text-slate-400">暂无历史记录</p>}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
  </AdDialog>;
}
