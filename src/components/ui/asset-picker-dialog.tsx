"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/api/keys";
import { listAssets } from "@/lib/api/assets";
import type { Asset, MediaKind } from "@/lib/schemas";
import { IconFolder, IconSearch } from "@/components/icons";
import { AssetThumb } from "./asset-thumb";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { EmptyState } from "./empty-state";
import { Input } from "./input";
import { Skeleton } from "./skeleton";

/**
 * One picker for every "choose an asset" moment: the composer's start frame,
 * a canvas source node, a slideshow image layer, a bulk media cell.
 *
 * It is also the keyboard equivalent for every drag-and-drop path in the app,
 * which is what makes those gestures compliant with SPEC §11 rather than
 * mouse-only.
 */
export interface AssetPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: Asset) => void;
  kind?: MediaKind;
  title?: string;
  description?: string;
}

export function AssetPickerDialog({
  open,
  onOpenChange,
  onSelect,
  kind,
  title = "Choose an asset",
  description = "Pick from your library, or drag one straight in from the library panel.",
}: AssetPickerDialogProps) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Asset | null>(null);

  const filter = React.useMemo(
    () => ({ ...(kind ? { kind } : {}), query, sort: "recent" as const }),
    [kind, query],
  );

  const assets = useQuery({
    queryKey: queryKeys.assets.list(filter),
    queryFn: () => listAssets(filter),
    enabled: open,
  });

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected(null);
    }
  }, [open]);

  const confirm = () => {
    if (!selected) return;
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" aria-describedby="asset-picker-description">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="asset-picker-description">{description}</DialogDescription>
        </DialogHeader>

        <Input
          iconStart={IconSearch}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or tag"
          aria-label="Search the library"
        />

        <div className="dropdown-list mt-4 overflow-y-auto">
          {assets.isPending ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="aspect-9/16 w-full rounded-md" />
                </li>
              ))}
            </ul>
          ) : assets.data && assets.data.length > 0 ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets.data.map((asset) => (
                <li key={asset.id}>
                  <AssetThumb
                    asset={asset}
                    draggable={false}
                    selected={selected?.id === asset.id}
                    onActivate={() => setSelected(asset)}
                    className={cn("aspect-9/16 w-full")}
                  />
                  <p className="text-body-sm mt-2 truncate text-ink-700">{asset.name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              size="sm"
              glyph={IconFolder}
              title={query ? "Nothing matches that search" : "Your library is empty"}
              description={
                query
                  ? "Try a shorter word, or clear the search to see everything."
                  : "Upload a file or generate something, and it will show up here."
              }
              action={
                query ? (
                  <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => onOpenChange(false)}>
                    Go to the library
                  </Button>
                )
              }
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!selected} onClick={confirm}>
            {selected ? `Use ${selected.name}` : "Use asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
