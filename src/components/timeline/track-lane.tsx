"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { hasAssetDragPayload, readAssetDragPayload } from "@/lib/dnd/payload";
import type { MediaKind, TrackKind } from "@/lib/schemas";
import { newClipId, useTimelineStore } from "@/lib/stores/timeline";
import { toast } from "@/components/ui/toast";
import { LANE_HEIGHT } from "./geometry";
import { TimelineClip } from "./timeline-clip";
import { createAudioClip, createOverlayClip, createVideoClip } from "./tools";
import { useAssetMap } from "./use-assets";

/**
 * One lane. It is also a drop target for the library sheet, through the shared
 * `lib/dnd/payload` contract — the drag source is written by another surface,
 * so the payload type is the only thing the two agree on.
 */
export interface TrackLaneProps {
  trackId: string;
  onBackgroundPointerDown: (event: React.PointerEvent, trackId: string) => void;
  msAt: (clientX: number) => number;
}

/** What each lane accepts from the library. Captions are typed, not dropped. */
const ACCEPTS: Record<TrackKind, MediaKind | null> = {
  video: "video",
  audio: "audio",
  text: null,
  overlay: "image",
};

const KIND_NOUN: Record<MediaKind, string> = {
  video: "video clips",
  audio: "audio",
  image: "images",
};

/** Images have no duration of their own; four seconds reads as a beat. */
const STILL_DURATION_MS = 4_000;

export function TrackLane({ trackId, onBackgroundPointerDown, msAt }: TrackLaneProps) {
  const track = useTimelineStore((state) => state.tracks[trackId]);
  const clipIds = useTimelineStore((state) => state.tracks[trackId]?.clipIds);
  const { assets } = useAssetMap();
  const [over, setOver] = React.useState(false);

  if (!track) return null;

  const accepts = ACCEPTS[track.kind];

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setOver(false);

    const payload = readAssetDragPayload(event.dataTransfer);
    if (!payload) return;
    const state = useTimelineStore.getState();

    if (track.locked) {
      toast.error(`${track.name} is locked`, {
        description: "Unlock the track from its header, then drop the asset again.",
      });
      return;
    }
    if (accepts === null) {
      toast.error("Captions are typed, not dropped", {
        description: "Pick the text tool and click the caption lane to write one.",
      });
      return;
    }
    if (payload.kind !== accepts) {
      toast.error(`${track.name} takes ${KIND_NOUN[accepts]} only`, {
        description: `${payload.name} is ${KIND_NOUN[payload.kind]}. Drop it on a lane that takes it.`,
      });
      return;
    }

    const asset = assets.get(payload.assetId);
    const durationMs = asset && asset.durationMs > 0 ? asset.durationMs : STILL_DURATION_MS;
    const startMs = Math.max(0, Math.round(msAt(event.clientX)));
    const id = newClipId(track.kind);

    const clip =
      track.kind === "video"
        ? createVideoClip(id, payload.assetId, payload.name, startMs, durationMs)
        : track.kind === "audio"
          ? createAudioClip(id, payload.assetId, payload.name, startMs, durationMs)
          : createOverlayClip(id, payload.assetId, payload.name, startMs, durationMs);

    state.addClip(trackId, clip);
    toast.success("Clip added", {
      description: `${payload.name} is on ${track.name}. Drag it to reposition.`,
    });
  };

  return (
    <div
      role="group"
      aria-label={`${track.name} lane`}
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget) return;
        onBackgroundPointerDown(event, trackId);
      }}
      onDragOver={(event) => {
        if (!hasAssetDragPayload(event.dataTransfer)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn("relative border-b border-ink-200", track.locked && "bg-ink-50", over && "bg-brand-50")}
      // dynamic: lanes are a fixed row height shared with the track headers.
      style={{ height: LANE_HEIGHT }}
    >
      {(clipIds ?? []).map((clipId) => (
        <TimelineClip key={clipId} clipId={clipId} trackId={trackId} />
      ))}

      {over ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border border-brand-500"
        />
      ) : null}
    </div>
  );
}
