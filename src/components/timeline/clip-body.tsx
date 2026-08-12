"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset, Clip } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconAudio, IconImage, IconText } from "@/components/icons";
import { Filmstrip, type FilmstripFrame } from "@/components/ui/filmstrip";
import { Waveform } from "@/components/ui/waveform";
import { filmstripFrameCount } from "./geometry";

/**
 * What a clip looks like inside its lane (SPEC §8.5): video is a filmstrip of
 * frames, audio is a real canvas waveform in the audio accent, captions show
 * their own text, overlays show the graphic they place.
 */
export interface ClipBodyProps {
  clip: Clip;
  asset: Asset | undefined;
  /** Rendered width of the clip in pixels — decides how many frames fit. */
  width: number;
}

export function ClipBody({ clip, asset, width }: ClipBodyProps) {
  const frames = React.useMemo<FilmstripFrame[]>(() => {
    if (clip.kind !== "video" || !asset) return [];
    const count = filmstripFrameCount(width);
    const per = clip.durationMs / count;
    return Array.from({ length: count }, (_, index) => ({
      posterUrl: asset.poster,
      startMs: clip.startMs + index * per,
      endMs: clip.startMs + (index + 1) * per,
    }));
  }, [clip, asset, width]);

  if (clip.kind === "video") {
    if (frames.length === 0) return <Placeholder label={clip.label} />;
    return (
      <Filmstrip
        frames={frames}
        showBoundaries={false}
        ariaLabel={`Frames from ${clip.label}`}
        className="h-full rounded-none bg-track-video/20"
      />
    );
  }

  if (clip.kind === "audio") {
    const peaks = asset?.peaks;
    if (!peaks || peaks.length === 0) return <Placeholder label={clip.label} glyph="audio" />;
    return (
      <div className="size-full px-1 py-2">
        <Waveform
          peaks={peaks}
          color="var(--color-track-audio)"
          mutedColor="var(--color-track-audio)"
          ariaLabel={`Waveform for ${clip.label}`}
        />
      </div>
    );
  }

  if (clip.kind === "text") {
    return (
      <div className="flex size-full items-center gap-2 px-2">
        <Icon glyph={IconText} size={16} className="shrink-0 text-track-text" />
        <span className="text-body-sm min-w-0 truncate text-ink-950">{clip.content}</span>
      </div>
    );
  }

  return (
    <div className="flex size-full items-center gap-2 px-2">
      {asset ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.poster}
          alt=""
          className="size-8 shrink-0 rounded-sm object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <Icon glyph={IconImage} size={16} className="shrink-0 text-track-overlay" />
      )}
      <span className="text-body-sm min-w-0 truncate text-ink-950">{clip.label}</span>
    </div>
  );
}

function Placeholder({ label, glyph = "image" }: { label: string; glyph?: "image" | "audio" }) {
  return (
    <div className={cn("flex size-full items-center gap-2 px-2")}>
      <Icon
        glyph={glyph === "audio" ? IconAudio : IconImage}
        size={16}
        className="shrink-0 text-ink-500"
      />
      <span className="text-body-sm min-w-0 truncate text-ink-500">{label}</span>
    </div>
  );
}
