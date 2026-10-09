export interface TimelineWindow { start: number; span: number; }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function clampTimelineWindow(window: TimelineWindow, duration: number, minSpan = 1): TimelineWindow {
  const span = clamp(window.span, Math.min(minSpan, duration), duration);
  return { start: clamp(window.start, 0, duration - span), span };
}

export function minimumTimelineSpan(duration: number, width: number): number {
  return Math.min(duration, Math.max(1, Math.floor(width / 48)));
}

export function zoomTimeline(window: TimelineWindow, duration: number, width: number, anchor: number, delta: number): TimelineWindow {
  const ratio = clamp(anchor, 0, 1);
  const span = clamp(window.span * Math.exp(clamp(delta, -240, 240) * 0.003), minimumTimelineSpan(duration, width), duration);
  return clampTimelineWindow({ start: window.start + ratio * (window.span - span), span }, duration);
}

export function panTimeline(window: TimelineWindow, duration: number, width: number, pixels: number): TimelineWindow {
  return clampTimelineWindow({ ...window, start: window.start - pixels / Math.max(1, width) * window.span }, duration);
}

export function timelineTicks(window: TimelineWindow, width: number): number[] {
  const target = window.span / Math.max(1, Math.floor(width / 48));
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, target)));
  const step = [1, 2, 5, 10].map(value => value * magnitude).find(value => value >= target) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let value = Math.ceil(window.start / step) * step; value <= window.start + window.span + 1e-8; value += step) ticks.push(value);
  return ticks;
}

export function timelineSecond(window: TimelineWindow, ratio: number, duration: number): number {
  return clamp(Math.round(window.start + clamp(ratio, 0, 1) * window.span), 0, duration);
}
