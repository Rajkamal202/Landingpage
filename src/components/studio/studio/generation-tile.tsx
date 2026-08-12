"use client";

import { cn } from "@/lib/cn";
import { GENERATION_MODE_LABEL, type Asset, type Generation } from "@/lib/schemas";
import { IconCheck, IconCopy, IconDelete, IconDownload, IconFavorite, IconMore, IconRetry } from "@/components/icons";
import { AssetThumb } from "@/components/ui/asset-thumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { ProgressRing } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { aspectClass } from "../asset-card";

export interface GenerationTileProps {
  generation: Generation;
  asset: Asset | undefined;
  selected: boolean;
  onToggleSelect: () => void;
  onActivate: () => void;
  onFavorite: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRetry: () => void;
}

/**
 * SPEC §8.2 — one result. In flight it is a shimmering skeleton with a real
 * progress ring; failed, it shows the model's own explanation and a retry
 * rather than a red box.
 */
export function GenerationTile({
  generation,
  asset,
  selected,
  onToggleSelect,
  onActivate,
  onFavorite,
  onDownload,
  onDuplicate,
  onDelete,
  onRetry,
}: GenerationTileProps) {
  const shape = aspectClass(generation.aspect);

  if (generation.status === "failed") {
    return (
      <div
        className={cn(
          "flex w-full flex-col justify-end gap-2 rounded-md border border-danger/30 bg-danger/5 p-3",
          shape,
        )}
      >
        <StatusPill status="failed" className="self-start" />
        <p className="text-body-sm line-clamp-4 text-ink-700">
          {generation.error ?? "The model stopped before it returned a frame."}
        </p>
        <Button size="sm" variant="secondary" iconStart={IconRetry} onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (generation.status !== "ready" || !asset) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-md bg-ink-100 shadow-elev-1",
          shape,
        )}
      >
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-0 grid place-items-center text-brand-500">
          <ProgressRing
            value={generation.progress}
            size={40}
            strokeWidth={3}
            label={`${Math.round(generation.progress)} percent generated`}
          />
        </div>
        <div className="absolute bottom-2 left-2">
          <StatusPill status={generation.status} progress={generation.progress} />
        </div>
      </div>
    );
  }

  return (
    <AssetThumb
      asset={asset}
      selected={selected}
      onActivate={onActivate}
      className={cn("w-full", shape)}
      badge={
        <span className="mono-sm glass inline-flex items-center rounded-sm bg-ink-950/55 px-1 text-white">
          {GENERATION_MODE_LABEL[generation.mode]}
        </span>
      }
      actions={
        <>
          <IconButton
            label={selected ? "Remove from selection" : "Add to selection"}
            glyph={IconCheck}
            size="sm"
            variant="overlay"
            aria-pressed={selected}
            onClick={onToggleSelect}
            className={selected ? "bg-brand-500" : undefined}
          />
          <IconButton
            label={generation.favorite ? "Remove from favourites" : "Add to favourites"}
            glyph={IconFavorite}
            size="sm"
            variant="overlay"
            aria-pressed={generation.favorite}
            onClick={onFavorite}
            className={generation.favorite ? "bg-brand-500" : undefined}
          />
          <IconButton
            label={`Download ${asset.name}`}
            glyph={IconDownload}
            size="sm"
            variant="overlay"
            onClick={onDownload}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                label="More actions"
                glyph={IconMore}
                size="sm"
                variant="overlay"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem glyph={IconCopy} onSelect={onDuplicate}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem glyph={IconDelete} tone="danger" onSelect={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );
}
