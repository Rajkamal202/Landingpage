"use client";

import * as React from "react";
import { formatTimecode } from "@/lib/format";
import type { Clip } from "@/lib/schemas";
import { useTimelineStore } from "@/lib/stores/timeline";
import { Button } from "@/components/ui/button";
import { PanelSection, PropertyPanel, PropertyRow } from "@/components/ui/property-row";
import { MediaClipProperties } from "./media-clip-properties";
import { TextClipProperties } from "./text-clip-properties";
import { TRACK_KIND_LABEL } from "./track-style";

/**
 * The 280px contextual panel (SPEC §8.5), built only from `PropertyPanel`,
 * `PanelSection` and `PropertyRow` so it lines up with the canvas and
 * slideshow panels written by other people.
 *
 * With nothing selected it shows the project rather than an apology — the
 * numbers you check before exporting are exactly the ones that belong here.
 */
const FOCUSABLE =
  'textarea, input, [role="spinbutton"], [role="combobox"], button:not([aria-hidden="true"])';

export function PropertiesPanel() {
  const selection = useTimelineStore((state) => state.selection);
  const clips = useTimelineStore((state) => state.clips);
  const trackOfClip = useTimelineStore((state) => state.trackOfClip);
  const tracks = useTimelineStore((state) => state.tracks);
  const focusToken = useTimelineStore((state) => state.panelFocusToken);

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (focusToken === 0) return;
    containerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [focusToken]);

  const selected = selection
    .map((id) => clips[id])
    .filter((clip): clip is Clip => clip !== undefined);

  const single = selected.length === 1 ? selected[0] : undefined;
  const trackId = single ? trackOfClip[single.id] : undefined;
  const track = trackId ? tracks[trackId] : undefined;

  const title = single
    ? `${TRACK_KIND_LABEL[track?.kind ?? "video"]} properties`
    : selected.length > 1
      ? `${selected.length} clips selected`
      : "Timeline";

  return (
    <PropertyPanel aria-label="Clip properties">
      <header className="flex shrink-0 items-center gap-2 border-b border-ink-200 px-3 py-3">
        <h2 className="text-title-md min-w-0 truncate text-ink-950">{title}</h2>
      </header>

      <div ref={containerRef} className="flex flex-col">
        {single ? (
          single.kind === "text" ? (
            <TextClipProperties clip={single} />
          ) : (
            <MediaClipProperties clip={single} />
          )
        ) : selected.length > 1 ? (
          <MultiSelection clips={selected} />
        ) : (
          <ProjectProperties />
        )}
      </div>
    </PropertyPanel>
  );
}

function MultiSelection({ clips }: { clips: readonly Clip[] }) {
  const duplicateSelection = useTimelineStore((state) => state.duplicateSelection);
  const deleteSelection = useTimelineStore((state) => state.deleteSelection);
  const clearSelection = useTimelineStore((state) => state.clearSelection);

  return (
    <PanelSection title="Selection">
      <ul className="flex flex-col gap-1">
        {clips.map((clip) => (
          <li key={clip.id} className="text-body-sm truncate text-ink-700">
            {clip.label}
          </li>
        ))}
      </ul>
      <p className="text-body-sm text-ink-400">
        Drag any one of them to move the whole group. Properties are per clip — select one to edit
        it.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={duplicateSelection}>
          Duplicate
        </Button>
        <Button size="sm" variant="danger" onClick={deleteSelection}>
          Delete
        </Button>
        <Button size="sm" variant="ghost" onClick={clearSelection}>
          Clear
        </Button>
      </div>
    </PanelSection>
  );
}

function ProjectProperties() {
  const aspect = useTimelineStore((state) => state.aspect);
  const durationMs = useTimelineStore((state) => state.durationMs);
  const fps = useTimelineStore((state) => state.fps);
  const trackCount = useTimelineStore((state) => state.trackOrder.length);
  const clipCount = useTimelineStore((state) => Object.keys(state.clips).length);

  return (
    <PanelSection title="This cut">
      <PropertyRow label="Aspect">
        <p className="mono-sm text-ink-950" data-numeric>
          {aspect}
        </p>
      </PropertyRow>
      <PropertyRow label="Length">
        <p className="mono-sm text-ink-950" data-numeric>
          {formatTimecode(durationMs, fps)}
        </p>
      </PropertyRow>
      <PropertyRow label="Frame rate">
        <p className="mono-sm text-ink-950" data-numeric>
          {fps} fps
        </p>
      </PropertyRow>
      <PropertyRow label="Tracks">
        <p className="mono-sm text-ink-950" data-numeric>
          {trackCount}
        </p>
      </PropertyRow>
      <PropertyRow label="Clips">
        <p className="mono-sm text-ink-950" data-numeric>
          {clipCount}
        </p>
      </PropertyRow>
      <p className="text-body-sm text-ink-400">
        Select a clip on the timeline to edit it. Press ? for every key this screen knows.
      </p>
    </PanelSection>
  );
}
