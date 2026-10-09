import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_MESSAGES, MESSAGE_CATEGORY_CONFIGS } from "../src/data";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTINGS_CHANGE,
  NOTIFICATION_TYPES,
  isNotificationTypeEnabled,
  readNotificationSettings,
  saveNotificationSettings,
} from "../src/lib/notificationSettings";

const expectedTypes = [
  "上传成功",
  "上传失败",
  "AI生成完成",
  "状态修改",
  "批注与@提醒",
  "异常登录",
  "账号锁定",
  "权限变更",
  "数据导出记录",
  "系统公告",
];

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }

  clear() {
    this.values.clear();
  }
}

const storage = new MemoryStorage();
const browserWindow = new EventTarget();
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "window", { value: browserWindow, configurable: true });

test("notification catalog contains only the ten confirmed phase-one message types", () => {
  assert.deepEqual(NOTIFICATION_TYPES.map((item) => item.name), expectedTypes);
  assert.deepEqual(MESSAGE_CATEGORY_CONFIGS.map((item) => item.name), ["内容资源", "安全与系统"]);
  assert.deepEqual(
    MESSAGE_CATEGORY_CONFIGS.flatMap((item) => item.subcategories),
    expectedTypes,
  );

  const messageTypes = new Set(INITIAL_MESSAGES.map((message) => message.subcategory));
  assert.deepEqual([...messageTypes], expectedTypes);
  for (const message of INITIAL_MESSAGES) {
    assert.ok(expectedTypes.includes(message.subcategory), message.subcategory);
    assert.doesNotMatch(
      `${message.category} ${message.subcategory} ${message.title}`,
      /积分申请|任务协作|直播通知|推送结果|计划创建结果|投放结果/,
    );
  }
});

test("notification settings default to enabled and safely complete partial or damaged saved data", () => {
  storage.clear();
  assert.deepEqual(readNotificationSettings(), DEFAULT_NOTIFICATION_SETTINGS);

  storage.setItem("mengchang-notification-settings", JSON.stringify({ upload_failed: false }));
  assert.equal(readNotificationSettings().upload_failed, false);
  assert.equal(readNotificationSettings().ai_completed, true);

  storage.setItem("mengchang-notification-settings", "not-json");
  assert.deepEqual(readNotificationSettings(), DEFAULT_NOTIFICATION_SETTINGS);
});

test("saving notification settings persists the switches and broadcasts the change", () => {
  storage.clear();
  let changeEvents = 0;
  const handleChange = () => { changeEvents += 1; };
  browserWindow.addEventListener(NOTIFICATION_SETTINGS_CHANGE, handleChange);

  const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ai_completed: false, login_risk: false };
  saveNotificationSettings(settings);

  assert.deepEqual(readNotificationSettings(), settings);
  assert.equal(isNotificationTypeEnabled("AI生成完成"), false);
  assert.equal(isNotificationTypeEnabled("上传成功"), true);
  assert.equal(changeEvents, 1);

  browserWindow.removeEventListener(NOTIFICATION_SETTINGS_CHANGE, handleChange);
});
