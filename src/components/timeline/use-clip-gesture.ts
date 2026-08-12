"use client";

import * as React from "react";
import { formatDuration, formatTimecode } from "@/lib/format";
import { MIN_CLIP_MS, useTimelineStore, type ClipPlacement } from "@/lib/stores/timeline";
import { SNAP_THRESHOLD_PX } from "./geometry";
import { createRafScheduler } from "./raf";
import { collectSnapTargets, snapSpan, snapValue } from "./snapping";

/**
 * Move and trim, the two gestures the timeline lives or dies on.
 *
 * Both resolve against the positions captured when the gesture *started*, not
 * against the previous frame, so a drag never accumulates rounding drift and
 * snapping can pull a clip back out of a snap as the pointer keeps moving.
 * Every write shares one `mergeKey`, which is what collapses a fifty-event
 * drag into a single undo entry.
 */
export type GestureMode = "move" | "trim-start" | "trim-end";

export interface GestureReadout {
  mode: GestureMode;
  /** Rendered in a badge on the clip — the number the gesture is changing. */
  text: string;
}

export interface ClipGesture {
  readout: GestureReadout | null;
  begin: (event: React.PointerEvent, mode: GestureMode) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function useClipGesture(clipId: string, trackId: string): ClipGesture {
  const [readout, setReadout] = React.useState<GestureReadout | null>(null);
  const scheduler = React.useRef(createRafScheduler());

  React.useEffect(() => {
    const current = scheduler.current;
    return () => current.cancel();
  }, []);

  const begin = React.useCallback(
    (event: React.PointerEvent, mode: GestureMode) => {
      if (event.button !== 0) return;
      const store = useTimelineStore.getState();
      if (store.tracks[trackId]?.locked) return;

      const anchor = store.clips[clipId];
      if (!anchor || store.pxPerMs <= 0) return;

      if (!store.selection.includes(clipId)) {
        store.setSelection([clipId], event.shiftKey ? "add" : "replace");
      }

      const movingIds =
        mode === "move" ? useTimelineStore.getState().selection.filter(movable) : [clipId];
      const originals = movingIds
        .map((id) => useTimelineStore.getState().clips[id])
        .filter((clip): clip is NonNullable<typeof clip> => clip !== undefined);
      if (originals.length === 0) return;

      const { pxPerMs, durationMs, snapEnabled } = store;
      const excluded = new Set(movingIds);
      const targets = collectSnapTargets(store, excluded);
      const thresholdMs = SNAP_THRESHOLD_PX / pxPerMs;
      const mergeKey = `${mode}:${movingIds.join(",")}`;
      const startX = event.clientX;
      const label =
        mode === "move" ? "Move clip" : mode === "trim-start" ? "Trim clip start" : "Trim clip end";

      event.preventDefault();
      event.stopPropagation();

      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== event.pointerId) return;
        const deltaMs = (moveEvent.clientX - startX) / pxPerMs;
        const state = useTimelineStore.getState();

        if (mode === "move") {
          let nextStart = anchor.startMs + deltaMs;
          let guide: number | null = null;
          if (snapEnabled) {
            const snapped = snapSpan(nextStart, anchor.durationMs, targets, thresholdMs);
            nextStart = snapped.value;
            guide = snapped.guideMs;
          }
          const applied = Math.round(nextStart) - anchor.startMs;
          const placements: ClipPlacement[] = originals.map((clip) => ({
            id: clip.id,
            startMs: clip.startMs + applied,
            durationMs: clip.durationMs,
            trimInMs: clip.trimInMs,
            trimOutMs: clip.trimOutMs,
          }));
          state.setSnapGuide(guide);
          setReadout({ mode, text: formatTimecode(Math.max(0, anchor.startMs + applied), state.fps) });
          scheduler.current.schedule(() => {
            useTimelineStore.getState().placeClips(placements, label, mergeKey);
          });
          return;
        }

        const end = anchor.startMs + anchor.durationMs;
        let placement: ClipPlacement;
        let guide: number | null = null;

        if (mode === "trim-start") {
          let nextStart = anchor.startMs + deltaMs;
          if (snapEnabled) {
            const snapped = snapValue(nextStart, targets, thresholdMs);
            nextStart = snapped.value;
            guide = snapped.guideMs;
          }
          nextStart = clamp(Math.round(nextStart), 0, end - MIN_CLIP_MS);
          const shift = nextStart - anchor.startMs;
          placement = {
            id: anchor.id,
            startMs: nextStart,
            durationMs: anchor.durationMs - shift,
            trimInMs: anchor.trimInMs + shift,
            trimOutMs: anchor.trimOutMs,
          };
        } else {
          let nextEnd = end + deltaMs;
          if (snapEnabled) {
            const snapped = snapValue(nextEnd, targets, thresholdMs);
            nextEnd = snapped.value;
            guide = snapped.guideMs;
          }
          nextEnd = clamp(Math.round(nextEnd), anchor.startMs + MIN_CLIP_MS, durationMs);
          placement = {
            id: anchor.id,
            startMs: anchor.startMs,
            durationMs: nextEnd - anchor.startMs,
            trimInMs: anchor.trimInMs,
            trimOutMs: anchor.trimOutMs + (end - nextEnd),
          };
        }

        state.setSnapGuide(guide);
        setReadout({ mode, text: formatDuration(placement.durationMs) });
        scheduler.current.schedule(() => {
          useTimelineStore.getState().placeClips([placement], label, mergeKey);
        });
      };

      const onUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== event.pointerId) return;
        scheduler.current.cancel();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        setReadout(null);
        useTimelineStore.getState().commitGesture();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [clipId, trackId],
  );

  return { readout, begin };
}

/** Clips on a locked track never join a move, even when they are selected. */
function movable(id: string): boolean {
  const state = useTimelineStore.getState();
  const trackId = state.trackOfClip[id];
  return trackId !== undefined && state.tracks[trackId]?.locked !== true;
}
