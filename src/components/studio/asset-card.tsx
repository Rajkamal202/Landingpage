"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset, AspectRatio } from "@/lib/schemas";
import { formatBytes, formatDurationShort } from "@/lib/format";
import { AssetThumb } from "@/components/ui/asset-thumb";
import { formatEdited } from "./time";

/**
 * One asset card, used by the library sheet, the full-page library and the
 * asset pickers. Cards that look alike in two places should be one component,
 * or they drift the first time either one is touched.
 */
const ASPECT_CLASS: Record<AspectRatio, string> = {
  "9:16": "aspect-9/16",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "4:5": "aspect-4/5",
};

export function aspectClass(aspect: AspectRatio): string {
  return ASPECT_CLASS[aspect];
}

export interface AssetCardProps {
  asset: Asset;
  onActivate?: () => void;
  actions?: React.ReactNode;
  /** Second meta line: defaults to duration or file size. */
  meta?: React.ReactNode;
  selected?: boolean;
  className?: string;
  /** Overrides the aspect box — a virtualised grid needs a fixed row height. */
  thumbClassName?: string;
}

export function AssetCard({
  asset,
  onActivate,
  actions,
  meta,
  selected,
  className,
  thumbClassName,
}: AssetCardProps) {
  return (
    <figure className={cn("flex min-w-0 flex-col gap-2", className)}>
      <AssetThumb
        asset={asset}
        {...(onActivate ? { onActivate } : {})}
        {...(actions ? { actions } : {})}
        {...(selected === undefined ? {} : { selected })}
        className={cn("w-full", thumbClassName ?? aspectClass(asset.aspect))}
      />
      <figcaption className="flex min-w-0 flex-col gap-1">
        <span className="text-body-sm truncate text-ink-950">{asset.name}</span>
        <span className="mono-sm truncate text-ink-700">
          {meta ?? (
            <>
              {asset.durationMs > 0
                ? formatDurationShort(asset.durationMs)
                : formatBytes(asset.sizeBytes)}
              {" · "}
              {formatEdited(asset.createdAt)}
            </>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
