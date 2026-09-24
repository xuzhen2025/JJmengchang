import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEnhanceOutputName,
  calculateEnhanceCredits,
  getAvailableEnhanceResolutions,
  getMinimumEnhanceResolution,
  parseDurationSeconds,
  resolveEnhanceResolution,
} from "../src/lib/videoEnhance.ts";

test("duration parsing supports resource-library timestamps", () => {
  assert.equal(parseDurationSeconds("01:30"), 90);
  assert.equal(parseDurationSeconds("01:02:03"), 3723);
  assert.equal(parseDurationSeconds("45"), 45);
  assert.equal(parseDurationSeconds("--:--", 12), 12);
});

test("output resolution never falls below the source video", () => {
  assert.equal(getMinimumEnhanceResolution("1280 x 720"), "1080p");
  assert.equal(getMinimumEnhanceResolution("1080 x 1920"), "1080p");
  assert.equal(getMinimumEnhanceResolution("2560 x 1440"), "2k");
  assert.equal(getMinimumEnhanceResolution("1440 x 2560"), "2k");
  assert.equal(getMinimumEnhanceResolution("3840 x 2160"), "4k");
  assert.deepEqual(getAvailableEnhanceResolutions("2560 x 1440"), ["2k", "4k"]);
  assert.equal(resolveEnhanceResolution("1080p", "3840 x 2160"), "4k");
  assert.equal(resolveEnhanceResolution("auto", "1920 x 1080"), "1080p");
});

test("credits bill each started minute and include optional 60 FPS", () => {
  assert.deepEqual(calculateEnhanceCredits(1, "1080p", "source"), { billingMinutes: 1, perMinute: 10, total: 10 });
  assert.deepEqual(calculateEnhanceCredits(61, "2k", "60"), { billingMinutes: 2, perMinute: 30, total: 60 });
  assert.deepEqual(calculateEnhanceCredits(180, "4k", "source"), { billingMinutes: 3, perMinute: 40, total: 120 });
});

test("output names preserve the source name and selected resolution", () => {
  assert.equal(buildEnhanceOutputName("秋季风衣原片.mov", "2k", 60), "秋季风衣原片_画质增强_2K_60FPS.mp4");
});
