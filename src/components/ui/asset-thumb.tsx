"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset } from "@/lib/schemas";
import { formatDurationShort } from "@/lib/format";
import { setAssetDragPayload } from "@/lib/dnd/payload";
import { Icon } from "@/components/icon";
import { IconAudio, IconImage, IconVideo } from "@/components/icons";
import { Skeleton } from "./skeleton";

/**
 * SPEC §8.2 — hover raises elevation and scrubs the preview on pointer X.
 *
 * Scrubbing reads from the committed sprite sheet rather than seeking a
 * <video>. Seeking on every pointer move stalls on keyframes and drops frames;
 * shifting a background position is a compositor-only change and holds 60fps.
 * The <video> is only mounted on sustained hover, for actual playback.
 */
export interface AssetThumbProps {
  asset: Asset;
  /** Overlaid at the top-right on hover — favourite, download, delete. */
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  selected?: boolean;
  draggable?: boolean;
  onActivate?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const KIND_ICON = { video: IconVideo, image: IconImage, audio: IconAudio } as const;
const PLAYBACK_DELAY_MS = 420;

export function AssetThumb({
  asset,
  actions,
  badge,
  selected = false,
  draggable = true,
  onActivate,
  className,
  children,
}: AssetThumbProps) {
  const [frame, setFrame] = React.useState<number | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const playTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const canScrub = asset.kind === "video" && asset.sprite !== null && asset.spriteFrames > 0;

  React.useEffect(() => {
    return () => {
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!canScrub || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (event.clientX - rect.left) / rect.width));
    setFrame(Math.floor(ratio * asset.spriteFrames));
  };

  const onPointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    playTimer.current = setTimeout(() => setPlaying(true), PLAYBACK_DELAY_MS);
  };

  const onPointerLeave = () => {
    if (playTimer.current) clearTimeout(playTimer.current);
    setFrame(null);
    setPlaying(false);
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-md bg-ink-100 shadow-elev-1",
        "transition-ui duration-(--dur-fast)",
        "hover:shadow-elev-2",
        selected && "ring-focus",
        className,
      )}
    >
      {!loaded ? <Skeleton className="absolute inset-0 rounded-none" /> : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.poster}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "size-full object-cover transition-ui duration-(--dur-fast)",
          (frame !== null || playing) && "opacity-0",
          !loaded && "opacity-0",
        )}
      />

      {frame !== null && asset.sprite ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          // dynamic: the sprite offset is the pointer position mapped to a frame.
          style={{
            backgroundImage: `url(${asset.sprite})`,
            backgroundSize: `${asset.spriteFrames * 100}% 100%`,
            backgroundPosition: `${(frame / Math.max(1, asset.spriteFrames - 1)) * 100}% 0`,
          }}
        />
      ) : null}

      {playing && asset.kind === "video" ? (
        <video
          src={asset.src}
          muted
          loop
          autoPlay
          playsInline
          preload="none"
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}

      {/*
        The activation target covers the whole card and carries the hover-scrub
        and drag handlers. Putting them on a real <button> rather than the
        wrapping div keeps every interaction on a focusable, keyboard-reachable
        control — and means a purely decorative thumbnail correctly neither
        scrubs nor acts as a drag source. Dragging always has a keyboard
        equivalent elsewhere (the asset picker dialog), per SPEC §11.
      */}
      {onActivate ? (
        <button
          type="button"
          onClick={onActivate}
          onPointerMove={onPointerMove}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          draggable={draggable}
          onDragStart={(event) => {
            if (!draggable) return;
            setAssetDragPayload(event.dataTransfer, {
              type: "asset",
              assetId: asset.id,
              kind: asset.kind,
              name: asset.name,
              poster: asset.poster,
            });
          }}
          className="absolute inset-0 focus-visible:ring-focus-inset"
        >
          <span className="sr-only">Open {asset.name}</span>
        </button>
      ) : null}

      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-16",
          "bg-gradient-to-t from-ink-950/60 to-transparent opacity-0",
          "transition-ui duration-(--dur-fast) group-hover:opacity-100",
        )}
      />

      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2">
        {badge ?? (
          <span className="mono-sm glass inline-flex items-center gap-1 rounded-sm bg-ink-950/55 px-1 text-white">
            <Icon glyph={KIND_ICON[asset.kind]} size={16} />
            {asset.kind === "image" ? "Still" : formatDurationShort(asset.durationMs)}
          </span>
        )}
      </div>

      {actions ? (
        <div
          className={cn(
            "absolute right-2 top-2 flex items-center gap-1 opacity-0",
            "transition-ui duration-(--dur-fast)",
            "group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          {actions}
        </div>
      ) : null}

      {children}
    </div>
  );
}
