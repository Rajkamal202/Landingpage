"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import type { Asset, AssetFilter, MediaKind } from "@/lib/schemas";
import { useWorkspaceStore } from "@/lib/stores/workspace";
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
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetCard } from "./asset-card";

/**
 * SPEC §8.2 — the right-hand library panel. Open state lives in the workspace
 * store because the button that toggles it is in the app shell, which is
 * frozen and knows nothing about this component.
 *
 * Every thumbnail here is a drag source (`AssetThumb` writes the typed
 * `lib/dnd` payload), which is how an asset reaches the composer's start frame,
 * a canvas source node or a bulk media cell.
 */
type TabValue = "all" | "images" | "video" | "audio" | "brand";

const TABS: ReadonlyArray<{ value: TabValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "images", label: "Images" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "brand", label: "Brand" },
];

const KIND_FOR_TAB: Partial<Record<TabValue, MediaKind>> = {
  images: "image",
  video: "video",
  audio: "audio",
};

const SORT_OPTIONS = [
  { value: "recent", label: "Newest first" },
  { value: "name", label: "Name" },
  { value: "duration", label: "Longest first" },
] as const;

export interface LibrarySheetProps {
  /** Provided by the studio so a click sends the asset into the composer. */
  onUse?: (asset: Asset) => void;
  useHint?: string;
}

export function LibrarySheet({ onUse, useHint }: LibrarySheetProps) {
  const open = useWorkspaceStore((state) => state.libraryOpen);
  const setOpen = useWorkspaceStore((state) => state.setLibraryOpen);

  const [tab, setTab] = React.useState<TabValue>("all");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<AssetFilter["sort"]>("recent");
  const [preview, setPreview] = React.useState<number | null>(null);

  const filter = React.useMemo<AssetFilter>(
    () => ({
      ...(KIND_FOR_TAB[tab] ? { kind: KIND_FOR_TAB[tab] } : {}),
      ...(tab === "brand" ? { source: "brand" as const } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
      sort,
    }),
    [tab, query, sort],
  );

  const assets = useQuery({
    queryKey: queryKeys.assets.list(filter),
    queryFn: () => listAssets(filter),
    enabled: open,
  });

  const items = assets.data ?? [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent aria-describedby="library-sheet-description">
        <SheetHeader>
          <SheetTitle>Library</SheetTitle>
          <SheetDescription id="library-sheet-description">
            {useHint ?? "Drag any asset into an editor, or open it to take a closer look."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 border-b border-ink-200 px-5 py-4">
          <Input
            iconStart={IconSearch}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or tag"
            aria-label="Search the library"
            size="sm"
          />
          <Select value={sort} onValueChange={(next) => setSort(next as AssetFilter["sort"])}>
            <SelectTrigger size="sm" aria-label="Sort assets">
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
        </div>

        <Tabs
          variant="pill"
          value={tab}
          onValueChange={(next) => setTab(next as TabValue)}
          className="min-h-0 flex-1"
        >
          <div className="px-5 pt-4">
            <TabsList>
              {TABS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {TABS.map((item) => (
            <TabsContent
              key={item.value}
              value={item.value}
              className="flex min-h-0 flex-1 flex-col"
            >
              {tab === item.value ? (
                <SheetBody>
                  {assets.isPending ? (
                    <ul className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 6 }, (_, index) => (
                        <li key={index} className="flex flex-col gap-2">
                          <Skeleton className="aspect-9/16 w-full rounded-md" />
                          <Skeleton className="h-4 w-3/4" />
                        </li>
                      ))}
                    </ul>
                  ) : items.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-3">
                      {items.map((asset, index) => (
                        <li key={asset.id}>
                          <AssetCard
                            asset={asset}
                            onActivate={() =>
                              onUse ? onUse(asset) : setPreview(index)
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      size="sm"
                      glyph={IconFolder}
                      title={query ? "Nothing matches that search" : "Nothing here yet"}
                      description={
                        query
                          ? "Try a shorter word, or clear the search to see the whole library."
                          : "Generated clips and uploads land here. Clone a video to fill it fast."
                      }
                      action={
                        query ? (
                          <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                            Clear search
                          </Button>
                        ) : (
                          <ButtonLink href="/app/import" variant="primary" size="sm">
                            Clone a video
                          </ButtonLink>
                        )
                      }
                    />
                  )}
                </SheetBody>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>

        <SheetFooter>
          <ButtonLink
            href="/app/library"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Open the full library
          </ButtonLink>
          <p className="text-body-sm ml-auto text-ink-400">
            {items.length} {items.length === 1 ? "asset" : "assets"}
          </p>
        </SheetFooter>

        <Lightbox
          assets={items}
          index={preview}
          onIndexChange={setPreview}
          onClose={() => setPreview(null)}
        />
      </SheetContent>
    </Sheet>
  );
}
