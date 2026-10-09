import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, usePlotArea, type PlotArea } from "recharts";
import type { InteractionPoint } from "../lib/videoInteraction";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { clampTimelineWindow, minimumTimelineSpan, panTimeline, timelineSecond, timelineTicks, zoomTimeline, type TimelineWindow } from "../lib/videoInteractionTimeline";

interface Metric { id: string; name: string; color: string; isRate: boolean; unit: string; }
interface Props {
  data: InteractionPoint[];
  duration: number;
  currentTime: number;
  left: Metric;
  right: Metric;
  onSeek: (second: number) => void;
}

function PlotBounds({ onChange }: { onChange: React.Dispatch<React.SetStateAction<PlotArea | undefined>> }) {
  const plot = usePlotArea();
  useLayoutEffect(() => {
    if (plot) onChange(previous => previous?.x === plot.x && previous?.y === plot.y && previous?.width === plot.width && previous?.height === plot.height ? previous : plot);
  }, [plot, onChange]);
  return null;
}

const axisLabel = (value: number) => value >= 10000 ? `${(value / 10000).toFixed(0)}w` : String(value);
const metricValue = (point: InteractionPoint, metric: Metric) => point[metric.id as keyof InteractionPoint] as number;

export default function VideoInteractionChart({ data, duration, currentTime, left, right, onSeek }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const plotId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; window: TimelineWindow; moved: boolean } | null>(null);
  const [plot, setPlot] = useState<PlotArea>();
  const [window, setWindow] = useState<TimelineWindow>({ start: 0, span: duration });
  const [dragging, setDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const viewport = clampTimelineWindow(window, duration, minimumTimelineSpan(duration, plot?.width ?? 1));
  const zoomed = duration - viewport.span > 0.001;
  const ticks = timelineTicks(viewport, plot?.width ?? 400);
  const domains = useMemo(() => [left, right].map(metric => [0, data.reduce((max, point) => Math.max(max, metricValue(point, metric)), 1)] as [number, number]), [data, left, right]);

  useEffect(() => { setWindow({ start: 0, span: duration }); }, [duration]);
  useLayoutEffect(() => { setShowTooltip(false); }, [viewport.start, viewport.span, plot?.width]);
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !zoomed) return;
    const target = viewport.start / (duration - viewport.span) * (scroller.scrollWidth - scroller.clientWidth);
    if (Math.abs(scroller.scrollLeft - target) > 0.75) scroller.scrollLeft = target;
  }, [viewport.start, viewport.span, duration, plot?.width, zoomed]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !plot) return;
    const wheel = (event: WheelEvent) => {
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left - plot.x;
      const y = event.clientY - rect.top;
      if (x < 0 || x > plot.width || y < plot.y || y > plot.y + plot.height + 30) return;
      event.preventDefault();
      if (drag.current) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? plot.height : 1);
      setWindow(previous => zoomTimeline(clampTimelineWindow(previous, duration), duration, plot.width, x / plot.width, delta));
    };
    host.addEventListener("wheel", wheel, { passive: false });
    return () => host.removeEventListener("wheel", wheel);
  }, [duration, plot]);

  const endDrag = () => { drag.current = null; setDragging(false); };

  return <div className="w-full pt-1" data-testid="video-interaction-timeline" data-start={viewport.start} data-end={viewport.start + viewport.span} data-duration={duration}>
    <div className="flex items-center justify-center sm:justify-end gap-5 text-[11px] font-bold text-slate-600 mb-1 pr-2">
      {[left, right].map((metric, index) => <div key={index} className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metric.color }} />
        <span>{metric.name}</span>
      </div>)}
    </div>
    <div id={plotId} ref={hostRef} data-testid="video-interaction-plot" className="h-56 w-full select-none [&_.recharts-surface:focus:not(:focus-visible)]:outline-none [&_.recharts-surface:focus-visible]:outline-purple-500" style={{ touchAction: "pan-y", cursor: dragging ? "grabbing" : zoomed ? "grab" : "crosshair" }}
      data-plot-x={plot?.x} data-plot-y={plot?.y} data-plot-width={plot?.width} data-plot-height={plot?.height}
      onPointerDown={event => {
        if (event.button !== 0 || !event.isPrimary || !plot) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - plot.x;
        const y = event.clientY - rect.top;
        if (x < 0 || x > plot.width || y < plot.y || y > plot.y + plot.height + 30) return;
        setShowTooltip(false);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, window: viewport, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture) setShowTooltip(true);
        if (!gesture || gesture.id !== event.pointerId || !plot) return;
        if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 5) gesture.moved = true;
        if (gesture.moved) {
          setDragging(true);
          setWindow(panTimeline(gesture.window, duration, plot.width, event.clientX - gesture.x));
        }
      }}
      onPointerUp={event => {
        const gesture = drag.current;
        if (!gesture || gesture.id !== event.pointerId || !plot) return;
        if (!gesture.moved && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 5) {
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek(timelineSecond(viewport, (event.clientX - rect.left - plot.x) / plot.width, duration));
        }
        endDrag();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerLeave={() => setShowTooltip(false)} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
          <PlotBounds onChange={setPlot} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color-slate-200)" />
          <XAxis type="number" dataKey="second" domain={[viewport.start, viewport.start + viewport.span]} allowDataOverflow ticks={ticks} interval={0}
            tickFormatter={second => `${second}s`} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
          <YAxis yAxisId="left" width={46} domain={domains[0]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={axisLabel} />
          <YAxis yAxisId="right" width={46} domain={domains[1]} orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={axisLabel} />
          <Tooltip active={dragging || !showTooltip ? false : undefined} isAnimationActive={false} content={({ active, payload, coordinate }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as InteractionPoint;
            return <AnchoredPopover key={point.second} anchorRef={hostRef} role="tooltip" width={180} side="top" gap={12}
              getAnchorRect={() => {
                const rect = hostRef.current?.getBoundingClientRect();
                return rect ? new DOMRect(rect.left + (coordinate?.x ?? 0), rect.top + (coordinate?.y ?? 0), 0, 0) : null;
              }} onClose={() => setShowTooltip(false)}
              className="pointer-events-none bg-white text-slate-800 p-3 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-2">
              <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-1">{point.secondLabel}</div>
              {[left, right].map((metric, index) => <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: metric.color }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metric.color }} />{metric.name}
                </span>
                <span className="font-mono font-bold text-slate-900">{metricValue(point, metric).toLocaleString()} {metric.unit}</span>
              </div>)}
            </AnchoredPopover>;
          }} />
          <ReferenceLine yAxisId="left" x={currentTime} stroke="#e11d48" strokeWidth={2} strokeDasharray="3 3" />
          {[left, right].map((metric, index) => <Area key={index} yAxisId={index === 0 ? "left" : "right"} type="monotone" dataKey={metric.id}
            stroke={metric.color} fill={metric.color} fillOpacity={index === 0 ? 0.15 : 0.12} strokeWidth={2.5}
            activeDot={dragging || !showTooltip ? false : { r: 5 }} isAnimationActive={false} />)}
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="h-4" style={{ marginLeft: plot?.x ?? 46, width: plot?.width }}>
      {zoomed && <div ref={scrollRef} data-testid="video-interaction-scrollbar" role="scrollbar" aria-label={"\u89c6\u9891\u65f6\u95f4\u8f74"} tabIndex={0}
        aria-controls={plotId} aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={duration - viewport.span} aria-valuenow={viewport.start}
        className="h-4 overflow-x-scroll overflow-y-hidden rounded outline-offset-2 focus-visible:outline-2 focus-visible:outline-purple-500"
        style={{ scrollbarColor: "#94a3b8 #e2e8f0", scrollbarWidth: "auto" }}
        onKeyDown={event => {
          const starts: Record<string, number> = { ArrowLeft: viewport.start - 1, ArrowRight: viewport.start + 1,
            PageUp: viewport.start - viewport.span, PageDown: viewport.start + viewport.span, Home: 0, End: duration - viewport.span };
          if (!(event.key in starts)) return;
          event.preventDefault();
          setWindow(clampTimelineWindow({ ...viewport, start: starts[event.key] }, duration));
        }}
        onScroll={event => {
          const scroller = event.currentTarget;
          const maxScroll = scroller.scrollWidth - scroller.clientWidth;
          if (maxScroll <= 0) return;
          const start = scroller.scrollLeft / maxScroll * (duration - viewport.span);
          if (Math.abs(start - viewport.start) > (duration - viewport.span) / maxScroll * 0.75) setWindow({ ...viewport, start });
        }}>
        <div aria-hidden="true" style={{ width: (plot?.width ?? 1) * duration / viewport.span, height: 1 }} />
      </div>}
    </div>
  </div>;
}
