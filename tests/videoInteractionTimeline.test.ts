import assert from "node:assert/strict";
import test from "node:test";
import { clampTimelineWindow, minimumTimelineSpan, panTimeline, timelineSecond, timelineTicks, zoomTimeline } from "../src/lib/videoInteractionTimeline";
import { createVideoInteractionDemoTrend } from "../src/lib/videoInteraction";

test("zoom keeps the pointer time anchored and never exceeds the video", () => {
  const before = { start: 100, span: 200 };
  const after = zoomTimeline(before, 600, 480, 0.3, -120);
  assert.ok(after.span < before.span);
  assert.ok(Math.abs(before.start + before.span * 0.3 - after.start - after.span * 0.3) < 1e-8);
  let window = after;
  for (let index = 0; index < 30; index++) window = zoomTimeline(window, 600, 480, 1, 240);
  assert.deepEqual(window, { start: 0, span: 600 });
});

test("maximum zoom renders one-second ticks at desktop and narrow widths", () => {
  for (const width of [130, 480, 900]) {
    let window = { start: 0, span: 600 };
    for (let index = 0; index < 30; index++) window = zoomTimeline(window, 600, width, 0.5, -240);
    assert.equal(window.span, minimumTimelineSpan(600, width));
    const ticks = timelineTicks(window, width);
    assert.ok(ticks.length >= 2);
    assert.ok(ticks.every(Number.isInteger));
    assert.ok(ticks.slice(1).every((tick, index) => tick - ticks[index] === 1));
    assert.deepEqual(zoomTimeline(window, 600, width, 0, -240), window);
  }
});

test("panning clamps at both ends and retains the visible duration", () => {
  const window = { start: 100, span: 20 };
  assert.deepEqual(panTimeline(window, 600, 400, -100), { start: 105, span: 20 });
  assert.deepEqual(panTimeline(window, 600, 400, 50000), { start: 0, span: 20 });
  assert.deepEqual(panTimeline(window, 600, 400, -50000), { start: 580, span: 20 });
});

test("short videos, fractional ends and changed sizes stay in bounds", () => {
  assert.deepEqual(clampTimelineWindow({ start: 599, span: 10 }, 600), { start: 590, span: 10 });
  assert.deepEqual(zoomTimeline({ start: 0, span: 0.7 }, 0.7, 480, 0.5, -240), { start: 0, span: 0.7 });
  assert.deepEqual(timelineTicks({ start: 0, span: 1.4 }, 480), [0, 1]);
  assert.deepEqual(clampTimelineWindow({ start: 597, span: 3 }, 600, 10), { start: 590, span: 10 });
});

test("clicks snap to seconds inside the visible window, not the full video", () => {
  assert.equal(timelineSecond({ start: 100.3, span: 10 }, 0.5, 600), 105);
  assert.equal(timelineSecond({ start: 0, span: 10 }, -1, 600), 0);
  assert.equal(timelineSecond({ start: 0, span: 1.6 }, 1, 1.6), 1.6);
});

test("prototype demo points cover actual duration with per-second values and preserve empty data", () => {
  const first = { second: 0, secondLabel: "0s", clicks: 100, losses: 1000, follows: 2, comments: 4, likes: 6, ctr: 1, lossRate: 10 };
  const last = { ...first, second: 80, secondLabel: "80s", clicks: 0, ctr: 5 };
  for (const duration of [0.7, 15, 15.4, 600]) {
    const points = createVideoInteractionDemoTrend([first, last], duration);
    assert.equal(points[0].clicks, 100);
    assert.equal(points.at(-1)?.clicks, 0);
    assert.equal(points.at(-1)?.second, duration);
    assert.ok(points.every(point => point.second <= duration));
    assert.equal(points.filter(point => Number.isInteger(point.second)).length, Math.floor(duration) + 1);
  }
  assert.equal(createVideoInteractionDemoTrend([first, last], 10)[5].clicks, 50);
  assert.deepEqual(createVideoInteractionDemoTrend([], 600), []);
  assert.deepEqual(createVideoInteractionDemoTrend([first], Infinity), []);
  assert.deepEqual(createVideoInteractionDemoTrend([first], 0), []);
});
