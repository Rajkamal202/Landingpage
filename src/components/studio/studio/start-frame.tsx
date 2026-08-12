"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { hasAssetDragPayload, readAssetDragPayload } from "@/lib/dnd/payload";
import type { Asset } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconClose, IconPlus } from "@/components/icons";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { IconButton } from "@/components/ui/icon-button";

/**
 * SPEC §8.2 — the composer's start-frame slot. It is a drop target for the
 * library's typed drag payload and, because a drag is not a keyboard gesture,
 * a click opens the shared asset picker (SPEC §11).
 */
export function StartFrame({
  label,
  asset,
  onSelect,
  onClear,
  onDropAssetId,
}: {
  label: string;
  asset: Asset | undefined;
  onSelect: (asset: Asset) => void;
  onClear: () => void;
  onDropAssetId: (assetId: string) => void;
}) {
  const [picking, setPicking] = React.useState(false);
  const [over, setOver] = React.useState(false);

  // The drop target is the button itself rather than a wrapping div, so the
  // element that accepts a drag is the same one that is focusable and opens
  // the picker — one control, one target, and no static element with handlers.
  const dropProps = {
    onDragOver: (event: React.DragEvent<HTMLButtonElement>) => {
      if (!hasAssetDragPayload(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (event: React.DragEvent<HTMLButtonElement>) => {
      const payload = readAssetDragPayload(event.dataTransfer);
      setOver(false);
      if (!payload) return;
      event.preventDefault();
      onDropAssetId(payload.assetId);
    },
  };

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <div className="relative">
        {asset ? (
          <>
            <button
              type="button"
              {...dropProps}
              onClick={() => setPicking(true)}
              aria-label={`${label}: ${asset.name}. Choose a different one.`}
              className={cn(
                "block aspect-9/16 w-12 overflow-hidden rounded-sm border bg-ink-100",
                "transition-ui duration-(--dur-fast)",
                over ? "border-brand-500" : "border-ink-200 hover:border-ink-300",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.poster} alt="" className="size-full object-cover" />
            </button>
            <IconButton
              label={`Remove ${label.toLowerCase()}`}
              glyph={IconClose}
              size="sm"
              variant="overlay"
              onClick={onClear}
              className="absolute -right-2 -top-2 size-5 rounded-pill"
            />
          </>
        ) : (
          <button
            type="button"
            {...dropProps}
            onClick={() => setPicking(true)}
            aria-label={`Add a ${label.toLowerCase()}`}
            className={cn(
              "grid aspect-9/16 w-12 place-items-center rounded-sm border border-dashed",
              "transition-ui duration-(--dur-fast)",
              over
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-ink-300 bg-ink-50 text-ink-500 hover:border-ink-400 hover:text-ink-700",
            )}
          >
            <Icon glyph={IconPlus} size={16} />
          </button>
        )}
      </div>

      <span className="text-label w-12 text-center text-ink-500">{label.split(" ")[0]}</span>

      <AssetPickerDialog
        open={picking}
        onOpenChange={setPicking}
        onSelect={onSelect}
        title={`Choose a ${label.toLowerCase()}`}
        description="Pick from your library, or drag one straight in from the library panel."
      />
    </div>
  );
}
