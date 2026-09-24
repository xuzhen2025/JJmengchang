import React, { useRef, useState } from "react";
import { 
  FolderHeart, 
  CreditCard, 
  Coins,
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Settings,
  BarChart3,
  History,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import { ActiveScreen } from "../types";
import AnchoredPopover from "./overlays/AnchoredPopover";

interface SidebarProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  credits: number;
  openCreditsModal: () => void;
  openAdminProfile?: () => void;
  appMode?: "user" | "admin";
  setAppMode?: (mode: "user" | "admin") => void;
  allowedModes?: ("user" | "admin")[];
  adminActiveScreen?: string;
  setAdminActiveScreen?: (screen: string) => void;
}

export default function Sidebar({
  activeScreen,
  setActiveScreen,
  collapsed,
  setCollapsed,
  credits,
  openCreditsModal,
  openAdminProfile = () => {},
  appMode = "user",
  setAppMode = () => {},
  allowedModes = ["user", "admin"],
  adminActiveScreen = "content_management",
  setAdminActiveScreen = () => {}
}: SidebarProps) {
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const modeButtonRef = useRef<HTMLButtonElement | null>(null);
  const canSwitchModes = allowedModes.length > 1;

  const userMenuItems: { id: string; label: string; icon: any; badge?: string }[] = [
    { id: "video_remake", label: "爆款复刻", icon: RefreshCw },
    { id: "resources", label: "资源库", icon: FolderHeart },
    { id: "ad_delivery", label: "数据分析", icon: BarChart3 },
    { id: "operation_records", label: "操作记录", icon: History },
  ];

  const adminMenuItems: { id: string; label: string; icon: any; badge?: string }[] = [
    { id: "content_management", label: "内容管理", icon: LayoutDashboard },
    { id: "system_management", label: "系统管理", icon: Settings },
    { id: "credits_management", label: "积分管理", icon: Coins },
  ];

  const currentMenuItems = appMode === "admin" ? adminMenuItems : userMenuItems;

  return (
    <aside 
      className={`h-screen bg-white text-slate-800 flex flex-col justify-between border-r border-slate-100 shadow-xs transition-all duration-300 relative z-30 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="relative z-20">
        {/* LOGO Header & Mode Switch Dropdown */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 relative">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Sparkles className="w-4 h-4 text-white" />
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
            </div>
            {!collapsed && (
              <span className="font-extrabold text-base tracking-tight text-slate-900 shrink-0">
                梦畅AIGC
              </span>
            )}
          </div>

          {!collapsed && canSwitchModes && (
            <div className="relative shrink-0">
              <button
                ref={modeButtonRef}
                id="btn-client-mode-dropdown"
                type="button"
                onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                className="flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-lg transition-all cursor-pointer border border-slate-200/60"
              >
                <span>{appMode === "user" ? "用户端" : "管理端"}</span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${modeDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {modeDropdownOpen && (
                  <AnchoredPopover anchorRef={modeButtonRef} align="end" width={112} gap={6} onClose={() => setModeDropdownOpen(false)} className="rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-fade-in">
                    {allowedModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setAppMode(mode);
                          setModeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-center justify-between cursor-pointer ${
                          appMode === mode ? "text-purple-600 font-bold bg-purple-50/60" : "text-slate-700 font-medium"
                        }`}
                      >
                        <span>{mode === "user" ? "用户端" : "管理端"}</span>
                        {appMode === mode && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                      </button>
                    ))}
                  </AnchoredPopover>
              )}
            </div>
          )}

          {collapsed && canSwitchModes && (
            <button
              type="button"
              onClick={() => {
                setCollapsed(false);
                setModeDropdownOpen(true);
              }}
              className="text-[10px] bg-purple-50 text-purple-600 font-bold p-1 rounded hover:bg-purple-100 transition-colors cursor-pointer shrink-0"
              title={`当前: ${appMode === "user" ? "用户端" : "管理端"} (点击切换)`}
            >
              {appMode === "user" ? "用" : "管"}
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {currentMenuItems.map((item) => {
            const Icon = item.icon;
            const tooltipText = item.label;
            const isActive = appMode === "admin"
              ? adminActiveScreen === item.id
              : (
                  activeScreen === item.id || 
                  (item.id === "resources" && ["resources", "materials", "finished_videos", "scripts", "images", "audio"].includes(activeScreen))
                );

            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                type="button"
                onClick={() => {
                  if (appMode === "admin") {
                    setAdminActiveScreen(item.id);
                  } else {
                    setActiveScreen(item.id as ActiveScreen);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? "bg-purple-50 text-purple-600 border-l-2 border-purple-500 font-semibold"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                {!collapsed && (
                  <span className="truncate whitespace-nowrap font-bold">{item.label}</span>
                )}

                {item.badge && !collapsed && (
                  <span className="ml-auto bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white scale-90">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div role="tooltip" className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800 shadow-xl">
                    {tooltipText}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-2 space-y-2 border-t border-slate-100">
        {/* Credit details button */}
        {appMode === "user" && (
          <button
            onClick={openCreditsModal}
            id="btn-sidebar-credits"
            className={`w-full flex items-center rounded-xl transition-all ${
              collapsed
                ? "p-2.5 justify-center hover:bg-slate-50 text-amber-500"
                : "p-3 bg-gradient-to-br from-amber-500/5 to-amber-600/2 hover:from-amber-500/10 border border-amber-500/15 text-amber-700"
            }`}
          >
            <CreditCard className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <div className="ml-2 text-left flex-1 min-w-0">
                <p className="text-[10px] text-amber-600 font-mono">本日可用积分：</p>
                <p className="text-sm font-bold text-slate-800 font-mono truncate">{credits.toFixed(2)}</p>
              </div>
            )}
          </button>
        )}

        {/* User profile */}
        <div 
          onClick={appMode === "admin" ? openAdminProfile : openCreditsModal}
          className={`flex items-center gap-2 rounded-xl cursor-pointer ${
            collapsed ? "p-1 justify-center" : "p-2 hover:bg-slate-50"
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
            alt="User Avatar"
            className="w-8 h-8 rounded-full border border-purple-500/30 object-cover"
            referrerPolicy="no-referrer"
          />
          {!collapsed && (
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">徐振</p>
              <p className="text-[10px] text-slate-400 truncate">{appMode === "admin" ? "超级管理员" : "剪辑师"}</p>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
