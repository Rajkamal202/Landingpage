"use client";

import * as React from "react";
import { useSearchParamState } from "@/lib/hooks/use-search-param-state";
import { useTimelineStore } from "@/lib/stores/timeline";

/**
 * SPEC §10: "the timeline playhead position … lives in search params so a
 * refresh restores context and links are shareable."
 *
 * The URL is written on a trailing debounce, never per frame — `router.replace`
 * on every pointer-move would re-render the route sixty times a second and
 * bury the scrub under navigation work. Seeding runs once, guarded, so writing
 * the param back cannot re-seed the store from its own output.
 */
const SETTLE_MS = 400;

export function useTimelineUrlSync(ready: boolean): void {
  const [seconds, setSeconds] = useSearchParamState<number>("t", {
    defaultValue: 0,
    parse: (raw) => {
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    },
    serialize: (value) => (value <= 0 ? null : value.toFixed(2)),
  });

  const [clipParam, setClipParam] = useSearchParamState<string>("clip", {
    defaultValue: "",
    serialize: (value) => (value === "" ? null : value),
  });

  const seeded = React.useRef(false);
  const write = React.useRef<(playheadMs: number, selection: readonly string[]) => void>(
    () => undefined,
  );

  write.current = (playheadMs, selection) => {
    const nextSeconds = Number((playheadMs / 1000).toFixed(2));
    if (Math.abs(nextSeconds - seconds) >= 0.01) {
      setSeconds(nextSeconds);
      return;
    }
    const nextClip = selection.join(",");
    if (nextClip !== clipParam) setClipParam(nextClip);
  };

  React.useEffect(() => {
    if (!ready || seeded.current) return;
    seeded.current = true;

    const state = useTimelineStore.getState();
    if (seconds > 0) state.setPlayhead(seconds * 1000);
    if (clipParam !== "") {
      const ids = clipParam.split(",").filter((id) => state.clips[id] !== undefined);
      if (ids.length > 0) state.setSelection(ids);
    }
  }, [ready, seconds, clipParam]);

  React.useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = useTimelineStore.subscribe((state, previous) => {
      if (state.playheadMs === previous.playheadMs && state.selection === previous.selection) {
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const current = useTimelineStore.getState();
        write.current(current.playheadMs, current.selection);
      }, SETTLE_MS);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [ready]);
}
