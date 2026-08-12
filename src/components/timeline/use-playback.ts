"use client";

import * as React from "react";
import { useTimelineStore } from "@/lib/stores/timeline";

/**
 * The transport, driven by `requestAnimationFrame` rather than an interval.
 *
 * Reading the store imperatively inside the loop means this hook subscribes to
 * `playing` and `shuttleRate` only — advancing the playhead never re-renders
 * the component that owns the loop, so the 60fps budget goes to the elements
 * that actually move (SPEC §13).
 */
export function usePlayback(): void {
  const playing = useTimelineStore((state) => state.playing);
  const rate = useTimelineStore((state) => state.shuttleRate);

  React.useEffect(() => {
    if (!playing || rate === 0) return;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;

      const state = useTimelineStore.getState();
      const next = state.playheadMs + delta * rate;

      if (next >= state.durationMs) {
        state.setPlayhead(state.durationMs);
        state.setPlaying(false);
        return;
      }
      if (next <= 0) {
        state.setPlayhead(0);
        state.setPlaying(false);
        return;
      }

      state.setPlayhead(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, rate]);
}
