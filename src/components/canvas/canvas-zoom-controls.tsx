"use client";

import { useReactFlow, useViewport } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { dur } from "@/lib/motion/tokens";
import { IconFullscreen, IconZoomIn, IconZoomOut } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Zoom controls (SPEC §8.4, bottom-right). Our surface, our icons, our
 * keyboard behaviour — React Flow's `<Controls>` never appears.
 *
 * The readout is a control, not a label: pressing it returns the canvas to
 * 100%, which is what people reach for after over-zooming. Durations come
 * from the motion tokens rather than being typed in milliseconds here.
 */
const FAST = dur.fast * 1000;
const BASE = dur.base * 1000;

export function CanvasZoomControls() {
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const percent = Math.round(zoom * 100);

  return (
    <Toolbar
      ariaLabel="Canvas view"
      className={cn(
        "glass absolute bottom-4 right-4 gap-1 rounded-md border border-ink-200",
        "bg-surface/90 p-1 shadow-elev-2",
      )}
    >
      <Tooltip content="Zoom out">
        <IconButton
          label="Zoom out"
          glyph={IconZoomOut}
          size="sm"
          disabled={zoom <= 0.25}
          onClick={() => zoomOut({ duration: FAST })}
        />
      </Tooltip>

      <Tooltip content="Reset to 100%">
        <button
          type="button"
          onClick={() => zoomTo(1, { duration: FAST })}
          className={cn(
            "mono-sm h-control-sm min-w-12 rounded-sm px-2 text-ink-700",
            "transition-ui duration-(--dur-instant)",
            "hover:bg-ink-100 hover:text-ink-950 active:bg-ink-200",
          )}
        >
          {percent}%
        </button>
      </Tooltip>

      <Tooltip content="Zoom in">
        <IconButton
          label="Zoom in"
          glyph={IconZoomIn}
          size="sm"
          disabled={zoom >= 2.5}
          onClick={() => zoomIn({ duration: FAST })}
        />
      </Tooltip>

      <ToolbarSeparator />

      <Tooltip content="Fit the whole graph on screen">
        <IconButton
          label="Fit the graph to the view"
          glyph={IconFullscreen}
          size="sm"
          onClick={() => fitView({ padding: 0.2, duration: BASE, maxZoom: 1 })}
        />
      </Tooltip>
    </Toolbar>
  );
}
