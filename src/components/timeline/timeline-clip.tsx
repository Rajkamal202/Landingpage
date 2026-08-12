"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { formatDuration, formatTimecode } from "@/lib/format";
import { useTimelineStore } from "@/lib/stores/timeline";
import { IconCopy, IconDelete, IconSliders, IconSplit } from "@/components/icons";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ClipBody } from "./clip-body";
import { TRACK_FILL, TRACK_KIND_LABEL } from "./track-style";
import { useAssetMap } from "./use-assets";
import { useClipGesture } from "./use-clip-gesture";

/**
 * One clip in a lane. Subscribes to its own record only, so a drag that moves
 * one clip repaints one element rather than the whole timeline.
 */
export interface TimelineClipProps {
  clipId: string;
  trackId: string;
}

/** Below this width the trim handles would cover the whole clip. */
const HANDLES_MIN_WIDTH = 28;

export function TimelineClip({ clipId, trackId }: TimelineClipProps) {
  const clip = useTimelineStore((state) => state.clips[clipId]);
  const pxPerMs = useTimelineStore((state) => state.pxPerMs);
  const fps = useTimelineStore((state) => state.fps);
  const tool = useTimelineStore((state) => state.tool);
  const selected = useTimelineStore((state) => state.selection.includes(clipId));
  const track = useTimelineStore((state) => state.tracks[trackId]);

  const { assets } = useAssetMap();
  const gesture = useClipGesture(clipId, trackId);

  if (!clip || !track || pxPerMs <= 0) return null;

  const width = Math.max(4, clip.durationMs * pxPerMs);
  const left = clip.startMs * pxPerMs;
  const asset = "assetId" in clip ? assets.get(clip.assetId) : undefined;
  const locked = track.locked;

  const description = `${TRACK_KIND_LABEL[track.kind]} — ${clip.label}, ${formatDuration(
    clip.durationMs,
  )} from ${formatTimecode(clip.startMs, fps)}`;

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const state = useTimelineStore.getState();

    if (tool === "cut") {
      const rect = event.currentTarget.getBoundingClientRect();
      const at = clip.startMs + (event.clientX - rect.left) / pxPerMs;
      state.setPlayhead(at);
      state.splitAt(at, [clipId]);
      return;
    }

    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      state.setSelection([clipId], "toggle");
      return;
    }

    if (tool === "select") {
      gesture.begin(event, "move");
      return;
    }

    state.setSelection([clipId]);
  };

  const openProperties = () => {
    const state = useTimelineStore.getState();
    state.setSelection([clipId]);
    state.requestPanelFocus();
  };

  return (
    <div
      className="absolute bottom-1 left-0 top-1"
      // dynamic: a clip's x and width are its time and duration at this zoom.
      style={{ transform: `translateX(${left}px)`, width }}
    >
      {gesture.readout ? (
        <span className="mono-sm absolute -top-5 left-0 z-30 whitespace-nowrap rounded-sm bg-ink-950 px-2 py-1 text-white shadow-elev-2">
          {gesture.readout.text}
        </span>
      ) : null}

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={description}
            aria-disabled={locked || undefined}
            onPointerDown={locked ? undefined : onPointerDown}
            onDoubleClick={openProperties}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.stopPropagation();
              event.preventDefault();
              openProperties();
            }}
            className={cn(
              "relative size-full select-none overflow-hidden rounded-md border",
              "transition-ui duration-(--dur-instant)",
              TRACK_FILL[track.kind],
              selected
                ? "border-brand-500 shadow-elev-2"
                : "border-ink-200 hover:border-ink-300 hover:shadow-elev-1",
              !track.visible && "opacity-40",
              locked
                ? "cursor-not-allowed"
                : tool === "cut"
                  ? "cursor-crosshair"
                  : tool === "select"
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-pointer",
            )}
          >
            <ClipBody clip={clip} asset={asset} width={width} />

            {clip.kind === "video" || clip.kind === "overlay" ? (
              <span className="text-body-sm absolute bottom-1 left-1 max-w-full truncate rounded-sm bg-ink-950/70 px-1 text-white">
                {clip.label}
              </span>
            ) : null}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem
            glyph={IconSplit}
            shortcut="S"
            onSelect={() => {
              const state = useTimelineStore.getState();
              state.splitAt(state.playheadMs, [clipId]);
            }}
          >
            Split at the playhead
          </ContextMenuItem>
          <ContextMenuItem
            glyph={IconCopy}
            onSelect={() => {
              const state = useTimelineStore.getState();
              state.setSelection([clipId]);
              state.duplicateSelection();
            }}
          >
            Duplicate this clip
          </ContextMenuItem>
          <ContextMenuItem glyph={IconSliders} onSelect={openProperties}>
            Open its properties
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            glyph={IconDelete}
            tone="danger"
            shortcut="⌫"
            onSelect={() => {
              const state = useTimelineStore.getState();
              state.setSelection([clipId]);
              state.deleteSelection();
            }}
          >
            Delete this clip
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {!locked && width >= HANDLES_MIN_WIDTH ? (
        <>
          <TrimHandle
            side="start"
            label={`Trim the start of ${clip.label}`}
            onBegin={(event) => gesture.begin(event, "trim-start")}
          />
          <TrimHandle
            side="end"
            label={`Trim the end of ${clip.label}`}
            onBegin={(event) => gesture.begin(event, "trim-end")}
          />
        </>
      ) : null}
    </div>
  );
}

function TrimHandle({
  side,
  label,
  onBegin,
}: {
  side: "start" | "end";
  label: string;
  onBegin: (event: React.PointerEvent) => void;
}) {
  return (
    <span
      aria-hidden="true"
      title={label}
      onPointerDown={(event) => {
        event.stopPropagation();
        onBegin(event);
      }}
      className={cn(
        "absolute inset-y-0 w-2 cursor-ew-resize rounded-sm bg-ink-950/0",
        "transition-ui duration-(--dur-instant) hover:bg-ink-950/25",
        side === "start" ? "left-0" : "right-0",
      )}
    />
  );
}
