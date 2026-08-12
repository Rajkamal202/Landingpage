"use client";

import { cn } from "@/lib/cn";
import type { Asset } from "@/lib/schemas";
import { formatBytes, formatDurationShort } from "@/lib/format";
import {
  IconDelete,
  IconDownload,
  IconEdit,
  IconFavorite,
  IconMore,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCard } from "../asset-card";
import { formatEdited } from "../time";

/**
 * One tile in the full-page library. The card itself is the shared
 * `AssetCard`, so this grid and the 420px library sheet cannot drift apart;
 * only the overlay actions are added here.
 *
 * The overlay sits outside `AssetThumb` rather than in its `actions` slot
 * because that slot fades with hover — an open dropdown whose trigger has
 * vanished under the cursor is the sort of thing that reads as a bug.
 */
export interface LibraryTileProps {
  asset: Asset;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

/** Matches `THUMB_HEIGHT` + caption in `library-screen`, which the grid rows use. */
const THUMB = "h-panel";

export function LibraryTile({
  asset,
  onOpen,
  onToggleFavorite,
  onRename,
  onDownload,
  onDelete,
}: LibraryTileProps) {
  const size =
    asset.durationMs > 0 ? formatDurationShort(asset.durationMs) : formatBytes(asset.sizeBytes);

  return (
    <div className="group relative min-w-0">
      <AssetCard
        asset={asset}
        onActivate={onOpen}
        thumbClassName={THUMB}
        meta={
          <>
            {size} · {formatEdited(asset.createdAt)}
          </>
        }
      />

      <div className="absolute right-2 top-2 flex items-center gap-1">
        <IconButton
          label={asset.favorite ? `Remove ${asset.name} from favourites` : `Favourite ${asset.name}`}
          glyph={IconFavorite}
          size="sm"
          variant="overlay"
          aria-pressed={asset.favorite}
          onClick={onToggleFavorite}
          className={cn(
            "transition-ui duration-(--dur-fast)",
            asset.favorite
              ? "opacity-100 [&_svg]:fill-current"
              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              label={`Actions for ${asset.name}`}
              glyph={IconMore}
              size="sm"
              variant="overlay"
              className={cn(
                "opacity-0 transition-ui duration-(--dur-fast)",
                "group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
              )}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem glyph={IconEdit} onSelect={onRename}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem glyph={IconDownload} onSelect={onDownload}>
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem glyph={IconDelete} tone="danger" onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function LibraryTileSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className={cn(THUMB, "w-full rounded-md")} />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}
