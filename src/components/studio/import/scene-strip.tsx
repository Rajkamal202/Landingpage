"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { Scene } from "@/lib/schemas";
import { transition } from "@/lib/motion/variants";
import { Filmstrip } from "@/components/ui/filmstrip";

/**
 * SPEC §8.1 / §15: the boundary markers draw onto the strip as detection
 * reaches them. This is the product's whole claim — "we can tell where the
 * cuts are" — so the markers arrive one at a time off the stream rather than
 * appearing complete at the end.
 *
 * `Filmstrip` draws its own hairline between frames; here the boundaries are
 * drawn separately so each one can animate in at the moment its scene lands.
 */
export interface SceneStripProps {
  scenes: readonly Scene[];
  /** How many scenes the analysis expects, so the strip keeps its full width. */
  expectedCount: number;
  showDurations?: boolean;
  className?: string;
}

export function SceneStrip({
  scenes,
  expectedCount,
  showDurations = false,
  className,
}: SceneStripProps) {
  const total = Math.max(expectedCount, scenes.length, 1);

  return (
    <div className={cn("relative", className)}>
      <Filmstrip
        frames={scenes.map((scene) => ({
          posterUrl: scene.posterUrl,
          startMs: scene.startMs,
          endMs: scene.endMs,
        }))}
        expectedCount={expectedCount}
        showBoundaries={false}
        showDurations={showDurations}
        ariaLabel={`${scenes.length} of ${expectedCount} scenes detected`}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {scenes.slice(1).map((scene, index) => (
          <motion.span
            key={scene.id}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={transition.fast}
            className="absolute inset-y-0 w-px origin-top bg-white shadow-elev-1"
            // dynamic: the marker sits on the boundary between two detected scenes.
            style={{ left: `${((index + 1) / total) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
