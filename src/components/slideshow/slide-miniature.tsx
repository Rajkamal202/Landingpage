"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset, Slide } from "@/lib/schemas";
import { DOC_HEIGHT, DOC_WIDTH } from "./geometry";
import { LayerView } from "./layer-view";

/**
 * A true miniature of a slide — the same layers, the same type, the same
 * images, drawn at a fraction of document scale.
 *
 * The alternative (a grey box with a slide number) is the tell of a prototype:
 * the rail stops being a view of the deck and becomes a list of nothing. The
 * width is passed in rather than measured because both call sites — the 96px
 * rail and the variation cards — know exactly how wide they are, and measuring
 * would cost a layout pass per thumbnail for a number we already have.
 */
export interface SlideMiniatureProps {
  slide: Slide;
  assets: ReadonlyMap<string, Asset>;
  /** Rendered width in CSS pixels; height follows the 9:16 document. */
  width: number;
  className?: string;
}

export const SlideMiniature = React.memo(function SlideMiniature({
  slide,
  assets,
  width,
  className,
}: SlideMiniatureProps) {
  const height = Math.round((width * DOC_HEIGHT) / DOC_WIDTH);
  const scale = width / DOC_WIDTH;

  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden", className)}
      // dynamic: computed 9:16 geometry for the requested thumbnail width.
      style={{ width, height, backgroundColor: slide.backgroundColor }}
    >
      <div
        // dynamic: the document stage scaled down to thumbnail size.
        style={{
          position: "absolute",
          width: DOC_WIDTH,
          height: DOC_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {slide.layers.map((layer) => (
          <LayerView key={layer.id} layer={layer} assets={assets} />
        ))}
      </div>
    </div>
  );
});
