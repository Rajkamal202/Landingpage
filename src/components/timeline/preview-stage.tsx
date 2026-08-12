"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset, Clip } from "@/lib/schemas";
import { activeMediaClips, useTimelineStore } from "@/lib/stores/timeline";
import { Icon } from "@/components/icon";
import { IconFilm } from "@/components/icons";
import { PreviewCaptions } from "./preview-captions";
import { TOOLS } from "./tools";
import { TransportBar } from "./transport-bar";
import { useAssetMap } from "./use-assets";

/**
 * The centred 9:16 player on a neutral backdrop (SPEC §8.5).
 *
 * The frame is a real `<video>` seeked to the playhead rather than a still,
 * but it is seeked only when the transport is paused — during playback the
 * element runs itself, which keeps the scrub off the decoder's back (DECISIONS
 * D15 is the same reasoning applied to hover-scrub).
 */
export function PreviewStage() {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [frameHeight, setFrameHeight] = React.useState(0);
  const [fullscreen, setFullscreen] = React.useState(false);

  const { assets } = useAssetMap();

  const playheadMs = useTimelineStore((state) => state.playheadMs);
  const playing = useTimelineStore((state) => state.playing);
  const volume = useTimelineStore((state) => state.volume);
  const muted = useTimelineStore((state) => state.muted);
  const aspect = useTimelineStore((state) => state.aspect);
  const tool = useTimelineStore((state) => state.tool);
  const clips = useTimelineStore((state) => state.clips);
  const tracks = useTimelineStore((state) => state.tracks);
  const trackOrder = useTimelineStore((state) => state.trackOrder);

  const active = React.useMemo(
    () => activeMediaClips({ clips, tracks, trackOrder }, playheadMs),
    [clips, tracks, trackOrder, playheadMs],
  );

  const videoClip = active.find(
    (clip): clip is Extract<Clip, { kind: "video" }> => clip.kind === "video",
  );
  const overlays = active.filter(
    (clip): clip is Extract<Clip, { kind: "overlay" }> => clip.kind === "overlay",
  );
  const videoAsset = videoClip ? assets.get(videoClip.assetId) : undefined;

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setFrameHeight(entry.contentRect.height);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = muted ? 0 : volume;
    video.muted = muted || volume === 0;
  }, [volume, muted]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoAsset) return;
    if (playing) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [playing, videoAsset]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoClip || !videoAsset || playing) return;
    const loop = videoAsset.durationMs > 0 ? videoAsset.durationMs : 1;
    const offset = (playheadMs - videoClip.startMs + videoClip.trimInMs) % loop;
    const target = Math.max(0, offset) / 1000;
    // A sub-frame difference is not worth a seek; anything larger is a scrub.
    if (Math.abs(video.currentTime - target) > 0.05) video.currentTime = target;
  }, [playheadMs, playing, videoClip, videoAsset]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void frameRef.current?.requestFullscreen().catch(() => undefined);
  };

  const hint = TOOLS.find((definition) => definition.id === tool)?.hint ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div
          ref={frameRef}
          className={cn(
            "relative aspect-9/16 h-full overflow-hidden rounded-lg bg-ink-950 shadow-elev-2",
          )}
        >
          {videoAsset ? (
            <PreviewVideo ref={videoRef} asset={videoAsset} key={videoAsset.id} />
          ) : (
            <NothingHere />
          )}

          {overlays.map((clip) => {
            const asset = assets.get(clip.assetId);
            if (!asset) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={clip.id}
                src={asset.poster}
                alt=""
                className="pointer-events-none absolute inset-0 size-full object-contain p-6"
                // dynamic: the overlay's opacity is a value on the clip.
                style={{ opacity: clip.opacity }}
              />
            );
          })}

          <PreviewCaptions aspect={aspect} frameHeight={frameHeight} />

          {tool === "crop" ? <SafeAreaGuides /> : null}
        </div>
      </div>

      <p className="text-body-sm shrink-0 border-t border-ink-200 bg-surface px-4 py-2 text-ink-500">
        {hint}
      </p>

      <TransportBar fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} />
    </div>
  );
}

const PreviewVideo = React.forwardRef<HTMLVideoElement, { asset: Asset }>(function PreviewVideo(
  { asset },
  ref,
) {
  return (
    <video
      ref={ref}
      src={asset.src}
      poster={asset.poster}
      preload="auto"
      playsInline
      loop
      aria-label={`Preview of ${asset.name}`}
      className="absolute inset-0 size-full object-cover"
    />
  );
});

function NothingHere() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="grid size-10 place-items-center rounded-md bg-white/10 text-white/60">
        <Icon glyph={IconFilm} size={20} />
      </span>
      <p className="text-body-sm text-white/70">
        Nothing on the scene track at this point. Move the playhead over a clip, or drag one here.
      </p>
    </div>
  );
}

/**
 * The crop tool's output. Platform chrome eats the top and bottom of a 9:16
 * post, so the guide shows where a caption still reads on TikTok, Reels and
 * Shorts rather than a generic rule-of-thirds grid.
 */
function SafeAreaGuides() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full text-white"
    >
      <rect
        x="4"
        y="6"
        width="92"
        height="88"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="7"
        y="13"
        width="86"
        height="67"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="50"
        y1="0"
        x2="50"
        y2="100"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1="50"
        x2="100"
        y2="50"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
