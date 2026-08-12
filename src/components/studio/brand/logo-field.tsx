"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAsset } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import type { Asset } from "@/lib/schemas";
import { formatBytes } from "@/lib/format";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { UploadDropzone, type UploadFile } from "@/components/ui/upload-dropzone";

/**
 * The logo is the one thing the FAQ promises a user has to supply, so it gets
 * two ways in: drop a file, or pick something already in the library.
 *
 * Upload progress comes from the API layer's generator — real increments, not
 * a timer (SPEC §9). The upload is committed to the library immediately; the
 * *choice* of logo is only committed when the kit is saved.
 */
export interface LogoFieldProps {
  logo: Asset | undefined;
  onChange: (assetId: string | null) => void;
}

const MAX_LOGO_BYTES = 12 * 1024 * 1024;

export function LogoField({ logo, onChange }: LogoFieldProps) {
  const queryClient = useQueryClient();
  const [upload, setUpload] = React.useState<UploadFile | null>(null);
  const [picking, setPicking] = React.useState(false);

  const start = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUpload({
      id: `${file.name}-${file.size}`,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
    });

    try {
      for await (const step of uploadAsset({
        name: file.name,
        size: file.size,
        type: file.type,
      })) {
        setUpload((current) => (current ? { ...current, progress: step.percent } : current));
        if (step.asset) {
          onChange(step.asset.id);
          void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
          toast.success("Logo uploaded", {
            description: `${step.asset.name} is in your library. Save the kit to make it the logo.`,
          });
        }
      }
      setUpload(null);
    } catch {
      setUpload((current) =>
        current
          ? {
              ...current,
              error: "The upload stopped before it finished. Try the same file again.",
            }
          : current,
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {logo ? (
        <div className="flex items-center gap-4 rounded-md border border-ink-200 bg-ink-50 p-3">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo.src} alt="" className="size-full object-contain" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-sm truncate text-ink-950">{logo.name}</span>
            <span className="mono-sm text-ink-500" data-numeric>
              {logo.width}×{logo.height} · {formatBytes(logo.sizeBytes)}
            </span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        </div>
      ) : (
        <UploadDropzone
          accept="image/*"
          multiple={false}
          maxSizeBytes={MAX_LOGO_BYTES}
          files={upload ? [upload] : []}
          onFiles={(files) => void start(files)}
          onRemove={() => setUpload(null)}
          hint="A PNG with a transparent background works best. Up to 12MB."
        />
      )}

      <Button variant="secondary" size="sm" className="self-start" onClick={() => setPicking(true)}>
        Choose from library
      </Button>

      <AssetPickerDialog
        open={picking}
        onOpenChange={setPicking}
        kind="image"
        title="Choose a logo"
        description="Any image already in your library. Product stills work too if you brand with the pack."
        onSelect={(asset) => onChange(asset.id)}
      />
    </div>
  );
}
