"use client";

import { formatDuration } from "@/lib/format";
import { useTimelineStore, zoomBounds } from "@/lib/stores/timeline";
import { IconTarget, IconZoomIn, IconZoomOut } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * The strip above the ruler: how much time is on screen, the zoom controls,
 * and the snapping switch. Zoom is clamped between "the whole project fits"
 * and "one second across the lane" (SPEC §8.5), so the buttons disable at the
 * ends rather than pretending to keep working.
 */
export function TrackControls() {
  const pxPerMs = useTimelineStore((state) => state.pxPerMs);
  const laneWidth = useTimelineStore((state) => state.laneWidth);
  const durationMs = useTimelineStore((state) => state.durationMs);
  const snapEnabled = useTimelineStore((state) => state.snapEnabled);
  const zoomBy = useTimelineStore((state) => state.zoomBy);
  const zoomToFit = useTimelineStore((state) => state.zoomToFit);
  const toggleSnapping = useTimelineStore((state) => state.toggleSnapping);

  const bounds = zoomBounds({ laneWidth, durationMs });
  const visibleMs = pxPerMs > 0 ? laneWidth / pxPerMs : durationMs;

  return (
    <div className="flex h-control-lg shrink-0 items-center gap-2 border-b border-ink-200 bg-surface px-3">
      <span className="text-label text-ink-500">Timeline</span>

      <span className="mono-sm text-ink-500" data-numeric>
        {formatDuration(visibleMs)} on screen
      </span>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Tooltip content={snapEnabled ? "Turn snapping off" : "Turn snapping on"}>
          <button
            type="button"
            aria-pressed={snapEnabled}
            onClick={toggleSnapping}
            className={[
              "text-body-sm h-control-sm rounded-md border px-3 font-medium",
              "transition-ui duration-(--dur-instant) touch-target",
              snapEnabled
                ? "border-ink-950 bg-ink-950 text-white hover:bg-ink-900"
                : "border-ink-200 bg-surface text-ink-500 hover:border-ink-300 hover:text-ink-950",
            ].join(" ")}
          >
            Snapping
          </button>
        </Tooltip>

        <ToolbarSeparator />

        <Toolbar ariaLabel="Timeline zoom">
          <Tooltip content="Zoom out">
            <IconButton
              size="sm"
              label="Zoom out"
              glyph={IconZoomOut}
              disabled={pxPerMs <= bounds.min * 1.001}
              onClick={() => zoomBy(1 / 1.5)}
            />
          </Tooltip>
          <Tooltip content="Fit the whole project">
            <IconButton size="sm" label="Fit the whole project" glyph={IconTarget} onClick={zoomToFit} />
          </Tooltip>
          <Tooltip content="Zoom in">
            <IconButton
              size="sm"
              label="Zoom in"
              glyph={IconZoomIn}
              disabled={pxPerMs >= bounds.max * 0.999}
              onClick={() => zoomBy(1.5)}
            />
          </Tooltip>
        </Toolbar>
      </div>
    </div>
  );
}
