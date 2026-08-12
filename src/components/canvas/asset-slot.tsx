"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { hasAssetDragPayload, readAssetDragPayload } from "@/lib/dnd/payload";
import type { MediaKind } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconClose, IconPlus } from "@/components/icons";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { useAsset } from "./canvas-data";

/**
 * A thumbnail slot in the property panel — reference images, a start frame, a
 * source asset (SPEC §8.4).
 *
 * The slot is a button, so choosing an asset never requires a pointer: it
 * opens the shared `AssetPickerDialog`, which is the keyboard equivalent of
 * dragging one in from the library (SPEC §11). Dropping still works, because
 * for people with a mouse it is the faster path.
 */
export interface AssetSlotProps {
  assetId: string | null;
  label: string;
  emptyLabel: string;
  onChange: (assetId: string | null) => void;
  kind?: MediaKind;
}

export function AssetSlot({ assetId, label, emptyLabel, onChange, kind }: AssetSlotProps) {
  const asset = useAsset(assetId);
  const [picking, setPicking] = React.useState(false);
  const [over, setOver] = React.useState(false);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        aria-label={asset ? `${label}: ${asset.name}. Choose a different asset.` : `${label}: ${emptyLabel}. Choose an asset.`}
        onClick={() => setPicking(true)}
        onDragOver={(event) => {
          if (!hasAssetDragPayload(event.dataTransfer)) return;
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          setOver(false);
          const payload = readAssetDragPayload(event.dataTransfer);
          if (!payload) return;
          event.preventDefault();
          event.stopPropagation();
          onChange(payload.assetId);
        }}
        className={cn(
          "grid size-10 shrink-0 place-items-center overflow-hidden rounded-sm border",
          "transition-ui duration-(--dur-fast)",
          over
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : asset
              ? "border-ink-200 hover:border-ink-300"
              : "border-dashed border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-700",
        )}
      >
        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.poster} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <Icon glyph={IconPlus} size={16} />
        )}
      </button>

      <span className="text-body-sm min-w-0 flex-1 truncate text-ink-500">
        {asset?.name ?? emptyLabel}
      </span>

      {asset ? (
        <IconButton
          label={`Clear ${label.toLowerCase()}`}
          glyph={IconClose}
          size="sm"
          onClick={() => onChange(null)}
        />
      ) : null}

      <AssetPickerDialog
        open={picking}
        onOpenChange={setPicking}
        onSelect={(picked) => onChange(picked.id)}
        {...(kind ? { kind } : {})}
        title={`Choose ${label.toLowerCase()}`}
        description="Pick from your library, or drag one straight onto the slot."
      />
    </div>
  );
}
