"use client";

import { formatDuration } from "@/lib/format";
import type { Clip } from "@/lib/schemas";
import { useTimelineStore } from "@/lib/stores/timeline";
import { DragNumberInput } from "@/components/ui/drag-number-input";
import { PanelSection, PropertyRow } from "@/components/ui/property-row";

/**
 * Where a clip sits and how long it runs, shared by every clip kind. Both
 * fields are drag-scrubbable, so the panel is a second way to do what the lane
 * does with a pointer — and the keyboard way to do it precisely (SPEC §11).
 */
export function ClipTimingSection({ clip }: { clip: Clip }) {
  const durationMs = useTimelineStore((state) => state.durationMs);
  const placeClips = useTimelineStore((state) => state.placeClips);
  const commitGesture = useTimelineStore((state) => state.commitGesture);

  const place = (startMs: number, clipDurationMs: number, label: string, key: string) =>
    placeClips(
      [
        {
          id: clip.id,
          startMs,
          durationMs: clipDurationMs,
          trimInMs: clip.trimInMs,
          trimOutMs: clip.trimOutMs,
        },
      ],
      label,
      key,
    );

  return (
    <PanelSection title="Timing">
      <PropertyRow label="Starts at" htmlFor={`${clip.id}-start`}>
        <DragNumberInput
          id={`${clip.id}-start`}
          ariaLabel="Clip start, in seconds"
          value={clip.startMs / 1000}
          min={0}
          max={Math.max(0, (durationMs - clip.durationMs) / 1000)}
          step={0.05}
          sensitivity={0.02}
          precision={2}
          unit="s"
          onValueChange={(value) =>
            place(value * 1000, clip.durationMs, "Move clip", `${clip.id}:start`)
          }
          onCommit={commitGesture}
        />
      </PropertyRow>

      <PropertyRow label="Runs for" htmlFor={`${clip.id}-duration`}>
        <DragNumberInput
          id={`${clip.id}-duration`}
          ariaLabel="Clip duration, in seconds"
          value={clip.durationMs / 1000}
          min={0.12}
          max={Math.max(0.12, (durationMs - clip.startMs) / 1000)}
          step={0.05}
          sensitivity={0.02}
          precision={2}
          unit="s"
          onValueChange={(value) =>
            place(clip.startMs, value * 1000, "Trim clip end", `${clip.id}:duration`)
          }
          onCommit={commitGesture}
        />
      </PropertyRow>

      <PropertyRow label="Trimmed" hint="How much of the source sits outside this clip.">
        <p className="mono-sm text-ink-500" data-numeric>
          {formatDuration(clip.trimInMs)} in · {formatDuration(clip.trimOutMs)} out
        </p>
      </PropertyRow>
    </PanelSection>
  );
}
