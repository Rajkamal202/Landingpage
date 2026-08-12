"use client";

import * as React from "react";
import { newClipId, selectClipCount, useTimelineStore } from "@/lib/stores/timeline";
import { toast } from "@/components/ui/toast";
import {
  LANE_HEIGHT,
  MAX_VISIBLE_LANES,
  pxToMs,
  RULER_HEIGHT,
} from "./geometry";
import { Playhead } from "./playhead";
import { createRafScheduler } from "./raf";
import { TimeRuler } from "./time-ruler";
import { TimelineEmpty } from "./timeline-empty";
import { TrackControls } from "./track-controls";
import { TrackHeader } from "./track-header";
import { TrackLane } from "./track-lane";
import { createOverlayClip, createTextClip, NEW_CAPTION_MS } from "./tools";
import { useAssetMap } from "./use-assets";

/**
 * Ruler, headers, lanes, playhead — the half of the editor a person spends
 * their time in.
 *
 * Headers sit in their own column and mirror the lane column's vertical
 * scroll; the ruler is sticky inside the scroller so it stays put while the
 * lanes move under it. That keeps one horizontal scrollbar for the whole
 * surface, which is the thing that makes a timeline feel like one object.
 */
const SCROLLBAR_ALLOWANCE = 12;
const MARQUEE_MIN_PX = 3;

interface Marquee {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function TrackArea() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const scrubber = React.useRef(createRafScheduler());

  const [scrollTop, setScrollTop] = React.useState(0);
  const [marquee, setMarquee] = React.useState<Marquee | null>(null);

  const trackOrder = useTimelineStore((state) => state.trackOrder);
  const pxPerMs = useTimelineStore((state) => state.pxPerMs);
  const durationMs = useTimelineStore((state) => state.durationMs);
  const laneWidth = useTimelineStore((state) => state.laneWidth);
  const snapGuideMs = useTimelineStore((state) => state.snapGuideMs);
  const setLaneWidth = useTimelineStore((state) => state.setLaneWidth);
  const clipCount = useTimelineStore(selectClipCount);

  const { assets } = useAssetMap();

  React.useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setLaneWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [setLaneWidth]);

  const msAt = React.useCallback((clientX: number) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return pxToMs(clientX - rect.left, useTimelineStore.getState().pxPerMs);
  }, []);

  const beginScrub = React.useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();

      const apply = (clientX: number) => {
        const ms = msAt(clientX);
        scrubber.current.schedule(() => useTimelineStore.getState().setPlayhead(ms));
      };

      apply(event.clientX);
      const onMove = (moveEvent: PointerEvent) => apply(moveEvent.clientX);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [msAt],
  );

  const selectWithin = React.useCallback((rect: Marquee) => {
    const state = useTimelineStore.getState();
    const left = Math.min(rect.x0, rect.x1);
    const right = Math.max(rect.x0, rect.x1);
    const top = Math.min(rect.y0, rect.y1);
    const bottom = Math.max(rect.y0, rect.y1);
    if (right - left < MARQUEE_MIN_PX && bottom - top < MARQUEE_MIN_PX) return;

    const picked: string[] = [];
    state.trackOrder.forEach((trackId, index) => {
      const laneTop = RULER_HEIGHT + index * LANE_HEIGHT;
      if (laneTop + LANE_HEIGHT < top || laneTop > bottom) return;
      const track = state.tracks[trackId];
      if (!track || track.locked) return;
      for (const clipId of track.clipIds) {
        const clip = state.clips[clipId];
        if (!clip) continue;
        const clipLeft = clip.startMs * state.pxPerMs;
        const clipRight = clipLeft + clip.durationMs * state.pxPerMs;
        if (clipRight >= left && clipLeft <= right) picked.push(clipId);
      }
    });
    state.setSelection(picked);
  }, []);

  const beginMarquee = React.useCallback(
    (event: React.PointerEvent) => {
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x0 = event.clientX - rect.left;
      const y0 = event.clientY - rect.top;
      setMarquee({ x0, y0, x1: x0, y1: y0 });

      const onMove = (moveEvent: PointerEvent) => {
        setMarquee({ x0, y0, x1: moveEvent.clientX - rect.left, y1: moveEvent.clientY - rect.top });
      };
      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        selectWithin({ x0, y0, x1: upEvent.clientX - rect.left, y1: upEvent.clientY - rect.top });
        setMarquee(null);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [selectWithin],
  );

  const onBackgroundPointerDown = React.useCallback(
    (event: React.PointerEvent, trackId: string) => {
      if (event.button !== 0) return;
      const state = useTimelineStore.getState();
      const at = Math.max(0, Math.round(msAt(event.clientX)));

      if (state.tool === "text") {
        const target =
          state.tracks[trackId]?.kind === "text"
            ? trackId
            : state.trackOrder.find((id) => state.tracks[id]?.kind === "text");
        if (!target) {
          toast.error("This project has no caption track", {
            description: "Clone a video with captions, or add the caption over the preview later.",
          });
          return;
        }
        const startMs = Math.round(Math.min(at, Math.max(0, state.durationMs - NEW_CAPTION_MS)));
        state.addClip(target, createTextClip(newClipId("text"), startMs, NEW_CAPTION_MS));
        state.requestPanelFocus();
        return;
      }

      if (state.tool === "shape") {
        const target =
          state.tracks[trackId]?.kind === "overlay"
            ? trackId
            : state.trackOrder.find((id) => state.tracks[id]?.kind === "overlay");
        const graphic = [...assets.values()].find((asset) => asset.kind === "image");
        if (!target || !graphic) {
          toast.error("There's no graphic to lay over this cut", {
            description: "Add an image to your library, then place it on the overlay lane.",
          });
          return;
        }
        state.addClip(
          target,
          createOverlayClip(newClipId("overlay"), graphic.id, graphic.name, at, 4_000),
        );
        state.requestPanelFocus();
        return;
      }

      if (state.tool === "zoom") {
        const scroll = scrollRef.current;
        const anchorPx = at * state.pxPerMs - (scroll?.scrollLeft ?? 0);
        state.zoomBy(event.altKey ? 1 / 1.5 : 1.5);
        requestAnimationFrame(() => {
          const next = useTimelineStore.getState().pxPerMs;
          if (scroll) scroll.scrollLeft = Math.max(0, at * next - anchorPx);
        });
        return;
      }

      if (state.tool !== "select") return;
      state.clearSelection();
      beginMarquee(event);
    },
    [assets, beginMarquee, msAt],
  );

  const contentWidth = Math.max(laneWidth, durationMs * pxPerMs);
  const contentHeight = RULER_HEIGHT + trackOrder.length * LANE_HEIGHT;
  const bodyMaxHeight =
    RULER_HEIGHT +
    Math.min(trackOrder.length, MAX_VISIBLE_LANES) * LANE_HEIGHT +
    SCROLLBAR_ALLOWANCE;

  return (
    <section aria-label="Timeline tracks" className="flex shrink-0 flex-col border-t border-ink-200 bg-surface">
      <TrackControls />

      {clipCount === 0 ? (
        <TimelineEmpty />
      ) : (
        <div
          className="flex min-h-0"
          // dynamic: the track area grows with its lanes, then scrolls.
          style={{ maxHeight: bodyMaxHeight }}
        >
          <div className="w-track-head shrink-0 overflow-hidden border-r border-ink-200 bg-surface">
            <div
              className="border-b border-ink-200 bg-ink-50"
              // dynamic: the header spacer matches the ruler's height exactly.
              style={{ height: RULER_HEIGHT }}
            />
            <div
              // dynamic: headers mirror the lane column's vertical scroll.
              style={{ transform: `translateY(${-scrollTop}px)` }}
            >
              {trackOrder.map((trackId) => (
                <TrackHeader key={trackId} trackId={trackId} />
              ))}
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            className="relative min-w-0 flex-1 overflow-auto"
          >
            <div
              ref={contentRef}
              className="relative"
              // dynamic: the content box is the project length at this zoom.
              style={{ width: contentWidth, height: contentHeight }}
            >
              <TimeRuler width={contentWidth} onScrub={beginScrub} />

              {trackOrder.map((trackId) => (
                <TrackLane
                  key={trackId}
                  trackId={trackId}
                  onBackgroundPointerDown={onBackgroundPointerDown}
                  msAt={msAt}
                />
              ))}

              {snapGuideMs !== null ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 z-20 w-px bg-brand-500"
                  // dynamic: the snap guide marks the time the clip locked to.
                  style={{ transform: `translateX(${snapGuideMs * pxPerMs}px)` }}
                />
              ) : null}

              {marquee ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute z-20 border border-brand-500 bg-brand-500/10"
                  // dynamic: the marquee is the rectangle the pointer has drawn.
                  style={{
                    left: Math.min(marquee.x0, marquee.x1),
                    top: Math.min(marquee.y0, marquee.y1),
                    width: Math.abs(marquee.x1 - marquee.x0),
                    height: Math.abs(marquee.y1 - marquee.y0),
                  }}
                />
              ) : null}

              <Playhead onScrub={beginScrub} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
