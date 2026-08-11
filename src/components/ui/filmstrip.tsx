"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";

/**
 * The strip of extracted frames used by the clone result (SPEC §8.1) and the
 * timeline's video clips (SPEC §8.5).
 *
 * Frames come from the committed sprite sheet, so a strip of any length costs
 * one image request. Scene boundaries draw as markers that can animate in as
 * detection completes, which is the whole point of the clone loading state.
 */
export interface FilmstripFrame {
  posterUrl: string;
  startMs: number;
  endMs: number;
}

export interface FilmstripProps {
  frames: readonly FilmstripFrame[];
  /** Frames beyond this count render as placeholders — used while detecting. */
  expectedCount?: number;
  showBoundaries?: boolean;
  showDurations?: boolean;
  onFrameClick?: (index: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function Filmstrip({
  frames,
  expectedCount,
  showBoundaries = true,
  showDurations = false,
  onFrameClick,
  className,
  ariaLabel = "Extracted scenes",
}: FilmstripProps) {
  const total = Math.max(expectedCount ?? 0, frames.length);
  const slots = Array.from({ length: total }, (_, index) => frames[index] ?? null);

  return (
    <ol
      aria-label={ariaLabel}
      className={cn("flex h-16 items-stretch gap-px overflow-hidden rounded-md bg-ink-100", className)}
    >
      {slots.map((frame, index) => (
        <li key={index} className="relative min-w-0 flex-1">
          {frame ? (
            <FrameCell
              frame={frame}
              index={index}
              showBoundary={showBoundaries && index > 0}
              showDuration={showDurations}
              {...(onFrameClick ? { onClick: () => onFrameClick(index) } : {})}
            />
          ) : (
            <span className="block size-full bg-ink-100" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}

function FrameCell({
  frame,
  index,
  showBoundary,
  showDuration,
  onClick,
}: {
  frame: FilmstripFrame;
  index: number;
  showBoundary: boolean;
  showDuration: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame.posterUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
      {showBoundary ? (
        // The boundary marker is the visual claim the product makes: this is
        // where a cut was detected. It draws in as detection reaches it.
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-px origin-top scale-y-100 bg-white/80 shadow-elev-1"
        />
      ) : null}
      {showDuration ? (
        <span className="mono-sm absolute bottom-1 left-1 rounded-sm bg-ink-950/60 px-1 text-white">
          {formatDuration(frame.endMs - frame.startMs)}
        </span>
      ) : null}
    </>
  );

  if (!onClick) {
    return <div className="relative size-full overflow-hidden">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Scene ${index + 1}`}
      className={cn(
        "relative block size-full overflow-hidden",
        "transition-ui duration-(--dur-instant) hover:brightness-110",
        "focus-visible:ring-focus-inset",
      )}
    >
      {content}
    </button>
  );
}
