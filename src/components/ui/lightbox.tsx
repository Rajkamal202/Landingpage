"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import type { Asset } from "@/lib/schemas";
import { formatDurationShort } from "@/lib/format";
import { IconChevronLeft, IconChevronRight, IconClose } from "@/components/icons";
import { DialogOverlay } from "./dialog";
import { IconButton } from "./icon-button";

/**
 * SPEC §8.2 — full-size preview with arrow-key prev/next.
 *
 * The counter is a live region so a screen reader announces the move between
 * items; without it, arrow-key navigation is silent and the user has no idea
 * anything changed.
 */
export interface LightboxProps {
  assets: readonly Asset[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function Lightbox({ assets, index, onIndexChange, onClose }: LightboxProps) {
  const asset = index === null ? undefined : assets[index];

  const go = React.useCallback(
    (delta: number) => {
      if (index === null || assets.length === 0) return;
      onIndexChange((index + delta + assets.length) % assets.length);
    },
    [index, assets.length, onIndexChange],
  );

  return (
    <DialogPrimitive.Root
      open={index !== null && asset !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogOverlay className="bg-ink-950/85" />
        <DialogPrimitive.Content
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              go(1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              go(-1);
            }
          }}
          className={cn(
            "anim-dialog fixed inset-0 z-(--z-dialog) flex flex-col items-center justify-center",
            "p-6 focus-visible:outline-none",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {asset?.name ?? "Preview"}
          </DialogPrimitive.Title>

          <div className="absolute right-4 top-4">
            <DialogPrimitive.Close asChild>
              <IconButton label="Close preview" glyph={IconClose} variant="overlay" />
            </DialogPrimitive.Close>
          </div>

          {assets.length > 1 ? (
            <>
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <IconButton
                  label="Previous"
                  glyph={IconChevronLeft}
                  variant="overlay"
                  size="lg"
                  onClick={() => go(-1)}
                />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <IconButton
                  label="Next"
                  glyph={IconChevronRight}
                  variant="overlay"
                  size="lg"
                  onClick={() => go(1)}
                />
              </div>
            </>
          ) : null}

          {asset ? (
            <figure className="flex min-h-0 flex-col items-center gap-4">
              {asset.kind === "video" ? (
                <video
                  key={asset.id}
                  src={asset.src}
                  poster={asset.poster}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="overlay-media rounded-lg shadow-elev-4"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={asset.id}
                  src={asset.src}
                  alt={asset.name}
                  className="overlay-media rounded-lg shadow-elev-4"
                />
              )}
              <figcaption className="flex flex-col items-center gap-1 text-center">
                <p className="text-body-md text-white">{asset.name}</p>
                <p className="mono-sm text-white/60">
                  {asset.width}×{asset.height}
                  {asset.durationMs > 0 ? ` · ${formatDurationShort(asset.durationMs)}` : ""}
                </p>
              </figcaption>
            </figure>
          ) : null}

          <p aria-live="polite" className="mono-sm mt-6 text-white/60">
            {index === null ? "" : `${index + 1} of ${assets.length}`}
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
