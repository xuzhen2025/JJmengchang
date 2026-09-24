import React, { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  ChevronDown, 
  X, 
  Check,
  ExternalLink
} from "lucide-react";
import { ActiveScreen, AppMessage } from "../types";
import { INITIAL_MESSAGES } from "../data";
import ApprovalActionBox from "./ApprovalActionBox";

export interface MessageDetailItem {
  label: string;
  value: string;
  isLink?: boolean;
}

const TYPE_OPTIONS = [
  "全部类型",
  "积分审核",
  "审核不通过",
  "上传视频",
  "编辑视频",
  "账号锁定"
];

const STATUS_OPTIONS = [
  "全部状态",
  "未读",
  "已读"
];

interface MessageCenterViewProps {
  onBack: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  messages?: AppMessage[];
  onApproveCredits?: (msgId: string) => void;
  onRejectCredits?: (msgId: string, rejectReason: string) => void;
  onMarkMessageRead?: (id: string) => void;
  onMarkAllMessagesRead?: () => void;
}

export default function MessageCenterView({ 
  onBack, 
  messages: propMessages,
  onApproveCredits,
  onRejectCredits,
  onMarkMessageRead,
  onMarkAllMessagesRead
}: MessageCenterViewProps) {
  const [localMessages] = useState<AppMessage[]>(INITIAL_MESSAGES);
  const messagesList = propMessages || localMessages;

  const [selectedType, setSelectedType] = useState<string>("全部类型");
  const [selectedStatus, setSelectedStatus] = useState<string>("全部状态");
  const [startDate, setStartDate] = useState<string>("2025-05-20");
  const [endDate, setEndDate] = useState<string>("2026-12-31");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Drawer state
  const [drawerMessageId, setDrawerMessageId] = useState<string | null>(null);

  // Popover open states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<boolean>(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<boolean>(false);

  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const drawerMessage = messagesList.find((m) => m.id === drawerMessageId) || null;

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtering
  const filteredMessages = messagesList.filter((m) => {
    if (selectedType !== "全部类型") {
      const typeMatch = m.type === selectedType || m.subcategory === selectedType || m.category === selectedType;
      if (!typeMatch) return false;
    }
    if (selectedStatus === "未读" && m.status !== "unread") return false;
    if (selectedStatus === "已读" && m.status !== "read") return false;
    const msgDate = m.time.substring(0, 10);
    if (startDate && msgDate < startDate) return false;
    if (endDate && msgDate > endDate) return false;
    return true;
  });

  // Select all checkbox state
  const isAllSelected = filteredMessages.length > 0 && filteredMessages.every((m) => selectedIds.includes(m.id));
  const isSomeSelected = filteredMessages.some((m) => selectedIds.includes(m.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMessages.map((m) => m.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleMarkAsRead = () => {
    if (selectedIds.length > 0) {
      selectedIds.forEach((id) => onMarkMessageRead && onMarkMessageRead(id));
      setSelectedIds([]);
    } else if (onMarkAllMessagesRead) {
      onMarkAllMessagesRead();
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F9FAFB] text-slate-800 font-sans overflow-hidden relative">
      
      {/* 1. Top Bar */}
      <div className="bg-white border-b border-slate-200/90 px-6 pt-3 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="relative pb-3 text-sm font-bold text-purple-700 cursor-pointer">
            <span>全部消息</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          </div>
        </div>

        <button
          onClick={onBack}
          className="mb-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg flex items-center gap-1 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回首页</span>
        </button>
      </div>

      {/* 2. Control Row: Mark Read & Filters */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Mark as read button */}
        <div>
          <button
            onClick={handleMarkAsRead}
            className="px-4 py-1.5 bg-[#9333ea] hover:bg-[#7e22ce] text-white text-xs font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            标记为已读
          </button>
        </div>

        {/* Right: Type, Status, Time Range Filters */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700">
          
          {/* 消息类型 */}
          <div className="flex items-center gap-2 relative" ref={typeDropdownRef}>
            <span className="font-medium text-slate-700">消息类型</span>
            <div
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              className={`min-w-[120px] px-3 py-1.5 bg-white border rounded-lg flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
                typeDropdownOpen ? "border-purple-500 ring-2 ring-purple-100" : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <span className={selectedType === "全部类型" ? "text-slate-400" : "text-slate-800 font-medium"}>
                {selectedType === "全部类型" ? "请选择" : selectedType}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${typeDropdownOpen ? "rotate-180 text-purple-600" : ""}`} />
            </div>

            {/* Type Dropdown Options (Matches Screenshot 2) */}
            {typeDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-fade-in text-xs">
                {TYPE_OPTIONS.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setSelectedType(opt);
                      setTypeDropdownOpen(false);
                    }}
                    className={`px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between ${
                      selectedType === opt ? "text-purple-700 font-bold bg-purple-50/50" : "text-slate-700 font-normal"
                    }`}
                  >
                    <span>{opt === "全部类型" ? "全部类型" : opt}</span>
                    {selectedType === opt && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 消息状态 */}
          <div className="flex items-center gap-2 relative" ref={statusDropdownRef}>
            <span className="font-medium text-slate-700">消息状态</span>
            <div
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className={`min-w-[100px] px-3 py-1.5 bg-white border rounded-lg flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
                statusDropdownOpen ? "border-purple-500 ring-2 ring-purple-100" : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <span className={selectedStatus === "全部状态" ? "text-slate-400" : "text-slate-800 font-medium"}>
                {selectedStatus === "全部状态" ? "请选择" : selectedStatus}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${statusDropdownOpen ? "rotate-180 text-purple-600" : ""}`} />
            </div>

            {/* Status Dropdown Options (Matches Screenshot 3) */}
            {statusDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-fade-in text-xs">
                {STATUS_OPTIONS.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setSelectedStatus(opt);
                      setStatusDropdownOpen(false);
                    }}
                    className={`px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between ${
                      selectedStatus === opt ? "text-purple-700 font-bold bg-purple-50/50" : "text-slate-700 font-normal"
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedStatus === opt && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 消息时间 Range */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">消息时间</span>
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-700 cursor-pointer"
              />
              <span className="text-slate-400 font-normal">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-700 cursor-pointer"
              />
            </div>
          </div>

        </div>

      </div>

      {/* 3. Messages Data Table (Matches Screenshot 1 & 4) */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white border border-slate-200/90 rounded-none shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-medium whitespace-nowrap">
                <th className="py-3 px-4 w-10 text-center">
                  <div
                    onClick={handleToggleSelectAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                      isAllSelected
                        ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                        : isSomeSelected
                        ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                        : "border-slate-300 hover:border-slate-400 bg-white"
                    }`}
                  >
                    {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {isSomeSelected && <div className="w-2 h-0.5 bg-white rounded-full" />}
                  </div>
                </th>
                <th className="py-3 px-4 font-normal text-slate-500">消息详情</th>
                <th className="py-3 px-4 font-normal text-slate-500 w-32">消息分类</th>
                <th className="py-3 px-4 font-normal text-slate-500 w-44">消息时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    暂无相关消息通知
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => {
                  const isChecked = selectedIds.includes(msg.id);

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => {
                        setDrawerMessageId(msg.id);
                        if (onMarkMessageRead && msg.status === "unread") {
                          onMarkMessageRead(msg.id);
                        }
                      }}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Checkbox Column */}
                      <td className="py-3.5 px-4 text-center align-top" onClick={(e) => handleToggleSelectOne(msg.id, e)}>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                              : "border-slate-300 hover:border-slate-400 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </td>

                      {/* 消息详情 Column */}
                      <td className="py-3.5 px-4 pr-6 align-top">
                        <div className="space-y-1">
                          {/* Title with dot */}
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              msg.isRedDot || msg.status === "unread" ? "bg-rose-500" : "bg-slate-300"
                            }`} />
                            <span className={`font-bold ${
                              msg.status === "unread" ? "text-slate-900" : "text-slate-800"
                            }`}>
                              {msg.title}
                            </span>
                            {msg.approvalStatus === "pending" && (
                              <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 font-bold rounded-sm border border-amber-200">
                                待审核
                              </span>
                            )}
                            {msg.approvalStatus === "approved" && (
                              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-sm border border-emerald-200">
                                已审核通过
                              </span>
                            )}
                            {msg.approvalStatus === "rejected" && (
                              <span className="px-1.5 py-0.2 text-[10px] bg-rose-100 text-rose-800 font-bold rounded-sm border border-rose-200">
                                已驳回
                              </span>
                            )}
                          </div>

                          {/* Detail summary line */}
                          <p className="text-slate-500 text-xs font-normal leading-relaxed line-clamp-2 pl-3">
                            {msg.summary || msg.detail}
                          </p>
                        </div>
                      </td>

                      {/* 消息分类 Column */}
                      <td className="py-3.5 px-4 align-top text-slate-600 font-normal whitespace-nowrap">
                        {msg.subcategory || msg.categoryName || msg.type || msg.category || ""}
                      </td>

                      {/* 消息时间 Column */}
                      <td className="py-3.5 px-4 align-top font-mono text-slate-500 whitespace-nowrap">
                        {msg.time}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Slide-over Details Drawer */}
      {drawerMessage && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-2xs animate-fade-in">
          {/* Backdrop Click */}
          <div className="flex-1" onClick={() => setDrawerMessageId(null)} />

          {/* Drawer Panel */}
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">消息详情</h2>
              <button
                onClick={() => setDrawerMessageId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
              {/* Message Title & Time */}
              <div>
                <h3 className="text-sm font-black text-slate-900">{drawerMessage.title}</h3>
                <p className="text-slate-400 font-mono text-xs mt-1">{drawerMessage.time}</p>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              {/* Key Value Details */}
              <div className="space-y-3 font-normal leading-relaxed">
                {(drawerMessage.details || [
                  { label: "消息内容", value: drawerMessage.detail }
                ]).map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5">
                    <div className="text-slate-600">
                      <span className="text-slate-600">{item.label}: </span>
                      {item.isLink ? (
                        <a
                          href={item.value}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-600 hover:underline inline-flex items-center gap-1 font-mono break-all"
                        >
                          <span>{item.value}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-800 break-words">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Credit Audit Approval Action Box */}
              {(drawerMessage.approvalType === "credits" || drawerMessage.subcategory === "积分审核") && (
                <ApprovalActionBox
                  message={drawerMessage}
                  onApprove={(id) => onApproveCredits && onApproveCredits(id)}
                  onReject={(id, reason) => onRejectCredits && onRejectCredits(id, reason)}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
