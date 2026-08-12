"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import { useSearchParamEnum, useSearchParamState } from "@/lib/hooks/use-search-param-state";
import type { Asset, AssetFilter, MediaKind } from "@/lib/schemas";
import { IconFolder, IconSearch } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Lightbox } from "@/components/ui/lightbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualGrid } from "@/components/ui/virtual-grid";
import { AppPage } from "../app-page";
import { ConfirmDialog } from "../confirm-dialog";
import { downloadAsset } from "../download";
import { ANY, FilterSelect } from "../filter-select";
import { RenameDialog } from "../rename-dialog";
import { LibraryTile, LibraryTileSkeleton } from "./library-tile";
import { useAssetMutations } from "./use-asset-mutations";

/**
 * SPEC §7.2 `/app/library` — the library sheet at page scale.
 *
 * Same vocabulary as the 420px sheet (All · Images · Video · Audio · Brand,
 * the same three sorts, the same card), because they are the same feature seen
 * through two windows. What the page adds is room: a virtualised grid, the
 * per-asset actions that do not fit in a drawer, and filters that live in the
 * URL so a filtered library is a link you can send (SPEC §10).
 */
type TypeValue = typeof ANY | "images" | "video" | "audio" | "brand";

const TYPE_VALUES = [ANY, "images", "video", "audio", "brand"] as const;

const TYPE_OPTIONS = [
  { value: "images", label: "Images" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "brand", label: "Brand" },
] as const;

const KIND_FOR_TYPE: Partial<Record<TypeValue, MediaKind>> = {
  images: "image",
  video: "video",
  audio: "audio",
};

const SORT_VALUES = ["recent", "name", "duration"] as const;

/**
 * Sort is not a filter — there is no "unsorted" — so it is a plain `Select`
 * with every option listed, the same three the library sheet offers.
 */
const SORT_OPTIONS = [
  { value: "recent", label: "Newest first" },
  { value: "name", label: "Name, A to Z" },
  { value: "duration", label: "Longest first" },
] as const;

/** The thumbnail is `h-panel` (280px); the caption adds 48px on top of it. */
const THUMB_HEIGHT = 280;
const ROW_HEIGHT = THUMB_HEIGHT + 48;
const COLUMN_MIN = 160;
const GAP = 16;

const SKELETON_GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6";

export function LibraryScreen() {
  const [type, setType] = useSearchParamEnum<TypeValue>("type", TYPE_VALUES, ANY);
  const [sort, setSort] = useSearchParamEnum("sort", SORT_VALUES, "recent");
  const [query, setQuery] = useSearchParamState<string>("q", {
    defaultValue: "",
    serialize: (value) => (value.trim() ? value : null),
  });
  const [openId, setOpenId] = useSearchParamState<string>("asset", {
    defaultValue: "",
    mode: "push",
    serialize: (value) => value || null,
  });

  const [renaming, setRenaming] = React.useState<Asset | null>(null);
  const [deleting, setDeleting] = React.useState<Asset | null>(null);

  const { favorite, rename, remove } = useAssetMutations();

  const filter = React.useMemo<AssetFilter>(() => {
    const kind = KIND_FOR_TYPE[type];
    return {
      ...(kind ? { kind } : {}),
      ...(type === "brand" ? { source: "brand" as const } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
      sort,
    };
  }, [type, query, sort]);

  const assets = useQuery({
    queryKey: queryKeys.assets.list(filter),
    queryFn: () => listAssets(filter),
  });

  const items = React.useMemo(() => assets.data ?? [], [assets.data]);
  const filtered = type !== ANY || query.trim().length > 0;

  const clearFilters = () => {
    setType(ANY);
    setQuery("");
  };

  const lightboxIndex = openId ? items.findIndex((asset) => asset.id === openId) : -1;

  return (
    <AppPage
      fill
      title="Library"
      description="Every clip, still and audio bed on the account. Drag one straight into an editor, or open it for a closer look."
      actions={
        <ButtonLink href="/app/import" variant="secondary">
          Clone a video
        </ButtonLink>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Input
            iconStart={IconSearch}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or tag"
            aria-label="Search the library"
            containerClassName="min-w-0 flex-1 sm:max-w-panel"
          />
          <FilterSelect
            label="Filter by type"
            anyLabel="All types"
            value={type}
            onValueChange={setType}
            options={TYPE_OPTIONS}
            className="w-32"
          />
          <Select value={sort} onValueChange={(next) => setSort(next as (typeof SORT_VALUES)[number])}>
            <SelectTrigger size="sm" aria-label="Sort assets" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mono-sm ml-auto text-ink-500" data-numeric>
            {assets.isPending
              ? "Loading"
              : `${items.length} ${items.length === 1 ? "asset" : "assets"}`}
          </p>
        </div>
      }
    >
      {assets.isPending ? (
        <ul className={SKELETON_GRID}>
          {Array.from({ length: 12 }, (_, index) => (
            <li key={index}>
              <LibraryTileSkeleton />
            </li>
          ))}
        </ul>
      ) : assets.isError ? (
        <EmptyState
          glyph={IconFolder}
          title="Your library didn't load"
          description="The request came back empty-handed. Nothing was lost — reload to see your assets again."
          action={
            <Button variant="primary" onClick={() => void assets.refetch()}>
              Reload library
            </Button>
          }
        />
      ) : items.length === 0 && filtered ? (
        <EmptyState
          glyph={IconSearch}
          title="Nothing matches those filters"
          description="No asset here is that type, or has that word in its name or tags."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          size="lg"
          glyph={IconFolder}
          title="Your library is empty"
          description="Everything you generate, upload or pull out of a clone lands here, ready to drag into any editor."
          action={<ButtonLink href="/app/import">Clone a video</ButtonLink>}
          secondaryAction={
            <ButtonLink href="/app/templates" variant="secondary">
              Browse templates
            </ButtonLink>
          }
        />
      ) : (
        <VirtualGrid
          items={items}
          ariaLabel="Library assets"
          minColumnWidth={COLUMN_MIN}
          rowHeight={ROW_HEIGHT}
          gap={GAP}
          getKey={(asset) => asset.id}
          renderItem={(asset) => (
            <LibraryTile
              asset={asset}
              onOpen={() => setOpenId(asset.id)}
              onToggleFavorite={() => favorite.mutate(asset)}
              onRename={() => setRenaming(asset)}
              onDownload={() => downloadAsset(asset)}
              onDelete={() => setDeleting(asset)}
            />
          )}
        />
      )}

      <Lightbox
        assets={items}
        index={lightboxIndex >= 0 ? lightboxIndex : null}
        onIndexChange={(index) => setOpenId(items[index]?.id ?? "")}
        onClose={() => setOpenId("")}
      />

      <RenameDialog
        open={renaming !== null}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
        title="Rename asset"
        description="This is the name you'll search for and see on the card."
        label="Asset name"
        initialValue={renaming?.name ?? ""}
        onRename={(name) => {
          if (renaming) rename.mutate({ id: renaming.id, name });
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? "this asset"}?`}
        description="It leaves the library for good. Projects that already use it keep the copy they rendered with."
        confirmLabel="Delete asset"
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting);
          setDeleting(null);
        }}
      />
    </AppPage>
  );
}
