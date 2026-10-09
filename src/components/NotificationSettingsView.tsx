import React, { useMemo, useState } from "react";
import { Bell, Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  NOTIFICATION_TYPES,
  readNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "../lib/notificationSettings";

interface NotificationSettingsViewProps {
  onSaved: (message: string) => void;
}

const categories = ["内容资源", "安全与系统"] as const;

export default function NotificationSettingsView({ onSaved }: NotificationSettingsViewProps) {
  const [settings, setSettings] = useState<NotificationSettings>(readNotificationSettings);
  const [savedSettings, setSavedSettings] = useState<NotificationSettings>(readNotificationSettings);
  const [expanded, setExpanded] = useState<Record<(typeof categories)[number], boolean>>({
    内容资源: true,
    安全与系统: true,
  });
  const dirty = useMemo(
    () => NOTIFICATION_TYPES.some((item) => settings[item.id] !== savedSettings[item.id]),
    [settings, savedSettings],
  );

  const save = () => {
    saveNotificationSettings(settings);
    setSavedSettings({ ...settings });
    onSaved("消息通知设置已保存");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-module border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="grid items-start gap-3 border-b border-slate-100 pb-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Bell className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">站内消息通知</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">配置各类业务事件是否向对应成员发送站内消息。关闭后只影响后续消息，已接收的历史消息继续保留。</p>
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-purple-600 px-4 text-xs font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Check className="h-3.5 w-3.5" />保存设置
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {categories.map((category) => {
            const rows = NOTIFICATION_TYPES.filter((item) => item.category === category);
            const enabledCount = rows.filter((item) => settings[item.id]).length;
            const isExpanded = expanded[category];
            return (
              <section key={category} className="overflow-hidden rounded-module border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpanded((current) => ({ ...current, [category]: !current[category] }))}
                  className="flex w-full items-center gap-2 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  <span className="text-xs font-extrabold text-slate-800">{category}</span>
                  <span className="ml-auto text-[11px] text-slate-500">已开启 {enabledCount}/{rows.length}</span>
                </button>
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[660px] text-left text-xs">
                      <thead className="border-y border-slate-200 bg-white text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-bold">消息类型</th>
                          <th className="px-4 py-3 font-bold">触发场景</th>
                          <th className="px-4 py-3 font-bold">接收对象</th>
                          <th className="w-28 px-4 py-3 text-center font-bold">站内消息</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                            <td className="px-4 py-3 text-slate-600">{item.trigger}</td>
                            <td className="px-4 py-3 text-slate-600">{item.recipients}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={settings[item.id]}
                                title={`${settings[item.id] ? "关闭" : "开启"}${item.name}通知`}
                                onClick={() => setSettings((current) => ({ ...current, [item.id]: !current[item.id] }))}
                                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${settings[item.id] ? "bg-purple-600" : "bg-slate-300"}`}
                              >
                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings[item.id] ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
