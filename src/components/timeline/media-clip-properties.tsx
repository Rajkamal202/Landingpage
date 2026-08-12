"use client";

import { formatDurationShort } from "@/lib/format";
import type { Clip } from "@/lib/schemas";
import { useTimelineStore } from "@/lib/stores/timeline";
import { DragNumberInput } from "@/components/ui/drag-number-input";
import { Input } from "@/components/ui/input";
import { PanelSection, PropertyRow } from "@/components/ui/property-row";
import { ClipTimingSection } from "./clip-timing";
import { useAssetMap } from "./use-assets";

/**
 * Scene, audio and overlay clips. Each shows its own name, the library asset
 * behind it, and the one property that kind actually has — gain for audio,
 * opacity for an overlay — rather than a grid of fields that do nothing.
 */
export function MediaClipProperties({ clip }: { clip: Clip }) {
  const updateClip = useTimelineStore((state) => state.updateClip);
  const commitGesture = useTimelineStore((state) => state.commitGesture);
  const { assets } = useAssetMap();

  const asset = "assetId" in clip ? assets.get(clip.assetId) : undefined;

  return (
    <>
      <PanelSection title="Clip">
        <PropertyRow label="Name" htmlFor={`${clip.id}-label`}>
          <Input
            id={`${clip.id}-label`}
            size="sm"
            value={clip.label}
            aria-label="Clip name"
            placeholder="Name this clip"
            onChange={(event) =>
              updateClip(
                clip.id,
                (current) => ({ ...current, label: event.target.value }),
                "Rename clip",
                `${clip.id}:label`,
              )
            }
            onBlur={commitGesture}
          />
        </PropertyRow>

        <PropertyRow label="Source">
          <p className="text-body-sm truncate text-ink-700">
            {asset ? asset.name : "This clip's asset is no longer in the library"}
          </p>
        </PropertyRow>

        {asset && asset.durationMs > 0 ? (
          <PropertyRow label="Full length">
            <p className="mono-sm text-ink-500" data-numeric>
              {formatDurationShort(asset.durationMs)}
            </p>
          </PropertyRow>
        ) : null}

        {clip.kind === "audio" ? (
          <PropertyRow label="Gain" htmlFor={`${clip.id}-gain`} hint="How loud this bed sits under the voice.">
            <DragNumberInput
              id={`${clip.id}-gain`}
              ariaLabel="Audio gain"
              value={Math.round(clip.gain * 100)}
              min={0}
              max={200}
              step={1}
              sensitivity={0.5}
              unit="%"
              onValueChange={(value) =>
                updateClip(
                  clip.id,
                  (current) =>
                    current.kind === "audio" ? { ...current, gain: value / 100 } : current,
                  "Change the audio gain",
                  `${clip.id}:gain`,
                )
              }
              onCommit={commitGesture}
            />
          </PropertyRow>
        ) : null}

        {clip.kind === "overlay" ? (
          <PropertyRow label="Opacity" htmlFor={`${clip.id}-overlay-opacity`}>
            <DragNumberInput
              id={`${clip.id}-overlay-opacity`}
              ariaLabel="Overlay opacity"
              value={Math.round(clip.opacity * 100)}
              min={0}
              max={100}
              step={1}
              sensitivity={0.5}
              unit="%"
              onValueChange={(value) =>
                updateClip(
                  clip.id,
                  (current) =>
                    current.kind === "overlay" ? { ...current, opacity: value / 100 } : current,
                  "Change the overlay opacity",
                  `${clip.id}:overlay-opacity`,
                )
              }
              onCommit={commitGesture}
            />
          </PropertyRow>
        ) : null}
      </PanelSection>

      <ClipTimingSection clip={clip} />
    </>
  );
}
