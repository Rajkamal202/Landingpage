"use client";

import * as React from "react";
import { useTimelineStore } from "@/lib/stores/timeline";
import { chooseTickStep, formatRulerLabel, minorTickCount, RULER_HEIGHT } from "./geometry";

/**
 * Adaptive tick density (SPEC §8.5). Nothing here subscribes to the playhead,
 * so scrubbing never repaints a hundred tick marks — the playhead is a
 * separate, transform-positioned element.
 */
export interface TimeRulerProps {
  width: number;
  onScrub: (event: React.PointerEvent) => void;
}

export function TimeRuler({ width, onScrub }: TimeRulerProps) {
  const pxPerMs = useTimelineStore((state) => state.pxPerMs);
  const durationMs = useTimelineStore((state) => state.durationMs);

  const ticks = React.useMemo(() => {
    if (pxPerMs <= 0) return { major: [] as number[], minor: [] as number[], step: 1000 };
    const step = chooseTickStep(pxPerMs);
    const minorPer = minorTickCount(step, pxPerMs);
    const major: number[] = [];
    const minor: number[] = [];

    for (let ms = 0; ms <= durationMs; ms += step) {
      major.push(ms);
      if (minorPer < 2) continue;
      for (let i = 1; i < minorPer; i++) {
        const at = ms + (step / minorPer) * i;
        if (at <= durationMs) minor.push(at);
      }
    }
    return { major, minor, step };
  }, [pxPerMs, durationMs]);

  return (
    <div
      onPointerDown={onScrub}
      className="sticky top-0 z-10 cursor-ew-resize select-none border-b border-ink-200 bg-ink-50"
      // dynamic: the ruler spans the zoomed content, not the viewport.
      style={{ width, height: RULER_HEIGHT }}
    >
      {ticks.minor.map((ms) => (
        <span
          key={`minor-${ms}`}
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-1 w-px bg-ink-300"
          // dynamic: tick position is the time it marks at the current zoom.
          style={{ transform: `translateX(${ms * pxPerMs}px)` }}
        />
      ))}

      {ticks.major.map((ms) => (
        <span
          key={`major-${ms}`}
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 flex w-px items-start bg-ink-300"
          // dynamic: tick position is the time it marks at the current zoom.
          style={{ transform: `translateX(${ms * pxPerMs}px)` }}
        >
          <span className="mono-sm whitespace-nowrap pl-1 text-ink-500">
            {formatRulerLabel(ms, ticks.step)}
          </span>
        </span>
      ))}
    </div>
  );
}
