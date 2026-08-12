"use client";

import * as React from "react";
import { formatTimecode } from "@/lib/format";
import { useTimelineStore } from "@/lib/stores/timeline";

/**
 * The playhead is the one element that must move on every animation frame, so
 * it owns the playhead subscription alone and positions itself with a
 * transform — a compositor-only change that costs no layout.
 *
 * The grip carries `role="slider"`, which makes the playhead a real focusable
 * control that announces its timecode; the arrow keys that move it are bound
 * globally and listed in the `?` dialog (SPEC §11).
 */
export interface PlayheadProps {
  onScrub: (event: React.PointerEvent) => void;
}

export function Playhead({ onScrub }: PlayheadProps) {
  const playheadMs = useTimelineStore((state) => state.playheadMs);
  const durationMs = useTimelineStore((state) => state.durationMs);
  const pxPerMs = useTimelineStore((state) => state.pxPerMs);
  const fps = useTimelineStore((state) => state.fps);

  const timecode = formatTimecode(playheadMs, fps);

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-20 w-px"
      // dynamic: the playhead's x is the playhead time at the current zoom.
      style={{ transform: `translateX(${playheadMs * pxPerMs}px)` }}
    >
      <div aria-hidden="true" className="absolute inset-y-0 w-px bg-ink-950" />
      <button
        type="button"
        role="slider"
        aria-label="Playhead"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs)}
        aria-valuenow={Math.round(playheadMs)}
        aria-valuetext={timecode}
        onPointerDown={onScrub}
        className={[
          "pointer-events-auto absolute -left-2 top-0 grid h-3 w-4 place-items-center",
          "cursor-ew-resize rounded-b-sm bg-ink-950",
          "transition-ui duration-(--dur-instant) hover:bg-ink-700",
        ].join(" ")}
      >
        <span className="sr-only">{timecode}</span>
      </button>
    </div>
  );
}
