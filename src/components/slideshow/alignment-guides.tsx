"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { DOC_HEIGHT, DOC_WIDTH, type AlignmentGuide } from "./geometry";

/**
 * The visible half of snapping (SPEC §8.6, §15).
 *
 * Snapping without a line drawn is a layer that mysteriously refuses to move
 * one pixel. The line is what turns it into "it locked to the centre" — so the
 * guide has to appear on the same frame the snap takes effect, which is why the
 * drag handlers hand the guides straight through rather than deriving them.
 *
 * Guides against the slide itself read brand blue; guides against a sibling
 * layer read violet, so a glance says whether the layer lined up with the frame
 * or with its neighbour.
 */
export const AlignmentGuides = React.memo(function AlignmentGuides({
  guides,
  scale,
}: {
  guides: readonly AlignmentGuide[];
  scale: number;
}) {
  if (guides.length === 0) return null;
  // A hairline on screen, whatever the canvas is scaled to.
  const thickness = 1 / scale;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {guides.map((guide) => (
        <span
          key={`${guide.axis}-${guide.position}-${guide.origin}`}
          className={cn(
            "absolute",
            guide.origin === "layer" ? "bg-track-text" : "bg-brand-500",
          )}
          // dynamic: guide lines sit at computed document coordinates.
          style={
            guide.axis === "x"
              ? { left: guide.position, top: 0, width: thickness, height: DOC_HEIGHT }
              : { top: guide.position, left: 0, height: thickness, width: DOC_WIDTH }
          }
        />
      ))}
    </div>
  );
});
