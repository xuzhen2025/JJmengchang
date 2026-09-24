import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_VIRAL_VIDEO_RULE, formatViralVideoRule, getVideoSpendMonth, getViralVideoHeat, isValidViralVideoRule, isViralVideo,
  loadViralVideoRule, saveViralVideoRule, VIRAL_VIDEO_RULE_STORAGE_KEY, VIRAL_VIDEO_RULE_CHANGE_EVENT,
} from "../src/lib/viralVideoRule.ts";

const month = "2026-09";
const monthly = { period: "monthly", thresholdWan: 10 } as const;
const total = { period: "total", thresholdWan: 10 } as const;

test("heat uses one point per 100 yuan of current-month spending", () => {
  assert.equal(getViralVideoHeat({ cost: 9999999, monthlyCosts: { [month]: 120000 } }, month), 1200);
  assert.equal(getViralVideoHeat({ monthlyCosts: { [month]: 199.99 } }, month), 1);
  assert.equal(getViralVideoHeat({ monthlyCosts: { [month]: 100 } }, month), 1);
  assert.equal(getViralVideoHeat({ monthlyCosts: { [month]: 0 } }, month), 0);
});

test("missing monthly spending is distinct from zero heat and never uses lifetime spending", () => {
  const video = { cost: 200000, monthlyCosts: { [month]: 120000 } };
  assert.equal(getViralVideoHeat(video, "2026-10"), null);
  assert.equal(isViralVideo(video, total, "2026-10"), true);
  for (const value of [-1, NaN, Infinity]) {
    assert.equal(getViralVideoHeat({ monthlyCosts: { [month]: value } }, month), null);
  }
});

test("monthly spending includes equality, but not one cent below the threshold", () => {
  assert.equal(isViralVideo({ cost: 200000, monthlyCosts: { [month]: 100000 } }, monthly, month), true);
  assert.equal(isViralVideo({ cost: 200000, monthlyCosts: { [month]: 99999.99 } }, monthly, month), false);
  assert.equal(isViralVideo({ monthlyCosts: { [month]: 120000 } }, monthly, month), true);
});

test("monthly and total rules use separate metrics", () => {
  const video = { cost: 152000, monthlyCosts: { [month]: 80000 } };
  assert.equal(isViralVideo(video, monthly, month), false);
  assert.equal(isViralVideo(video, total, month), true);
  assert.equal(isViralVideo(video, { ...total, thresholdWan: 16 }, month), false);
});

test("raising the threshold or lowering the reported amount immediately removes qualification", () => {
  const video = { monthlyCosts: { [month]: 120000 } };
  assert.equal(isViralVideo(video, monthly, month), true);
  assert.equal(isViralVideo(video, { ...monthly, thresholdWan: 13 }, month), false);
  assert.equal(isViralVideo({ monthlyCosts: { [month]: 50000 } }, monthly, month), false);
});

test("month rollover cannot reuse the previous month's spending", () => {
  const video = { cost: 250000, monthlyCosts: { "2026-09": 120000, "2026-10": 100 } };
  assert.equal(isViralVideo(video, monthly, "2026-09"), true);
  assert.equal(isViralVideo(video, monthly, "2026-10"), false);
  assert.equal(isViralVideo(video, monthly, "2026-11"), false);
  assert.equal(isViralVideo(video, total, "2026-11"), true);
});

test("missing or invalid spending and ordinary viral tags cannot produce a badge", () => {
  const video = { title: "爆款视频", tags: ["爆款视频"], cost: 500000, todayCost: 120000 };
  assert.equal(isViralVideo(video, monthly, month), false);
  for (const cost of [undefined, -1, NaN, Infinity]) assert.equal(isViralVideo({ cost }, total, month), false);
  assert.equal(isViralVideo({ cost: 0, monthlyCosts: { [month]: 0 } }, monthly, month), false);
});

test("invalid settings are rejected and fractional wan amounts compare in cents", () => {
  for (const thresholdWan of [0, -10, NaN, Infinity, 1e20, "10", null]) {
    assert.equal(isValidViralVideoRule({ period: "monthly", thresholdWan }), false);
  }
  assert.equal(isValidViralVideoRule({ period: "weekly", thresholdWan: 10 }), false);
  assert.equal(isViralVideo({ cost: 1000000 }, { ...total, thresholdWan: 0 }, month), false);
  assert.equal(isViralVideo({ cost: 51000 }, { ...total, thresholdWan: 5.1 }, month), true);
  assert.equal(formatViralVideoRule({ ...total, thresholdWan: 5.1 }), "总消耗达到5.1万");
});

test("the reporting month follows the Shanghai calendar, including year rollover", () => {
  assert.equal(getVideoSpendMonth(new Date("2026-09-30T15:59:59Z")), "2026-09");
  assert.equal(getVideoSpendMonth(new Date("2026-09-30T16:00:00Z")), "2026-10");
  assert.equal(getVideoSpendMonth(new Date("2026-12-31T16:00:00Z")), "2027-01");
});

test("only a valid, successfully saved rule is published; malformed storage uses the default", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let stored: string | null = null;
  let fail = false;
  const events: string[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: {
      getItem: (key: string) => { assert.equal(key, VIRAL_VIDEO_RULE_STORAGE_KEY); return stored; },
      setItem: (key: string, value: string) => { assert.equal(key, VIRAL_VIDEO_RULE_STORAGE_KEY); if (fail) throw new Error("Storage full"); stored = value; },
    },
    dispatchEvent: (event: Event) => { events.push(event.type); return true; },
  } });
  try {
    assert.deepEqual(loadViralVideoRule(), DEFAULT_VIRAL_VIDEO_RULE);
    saveViralVideoRule(total);
    assert.deepEqual(loadViralVideoRule(), total);
    assert.deepEqual(events, [VIRAL_VIDEO_RULE_CHANGE_EVENT]);
    assert.throws(() => saveViralVideoRule({ ...monthly, thresholdWan: 0 }));
    fail = true;
    assert.throws(() => saveViralVideoRule(monthly));
    assert.deepEqual(loadViralVideoRule(), total);
    assert.equal(events.length, 1);
    stored = "invalid json";
    assert.deepEqual(loadViralVideoRule(), DEFAULT_VIRAL_VIDEO_RULE);
    stored = '{"period":"monthly","thresholdWan":-1}';
    assert.deepEqual(loadViralVideoRule(), DEFAULT_VIRAL_VIDEO_RULE);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
