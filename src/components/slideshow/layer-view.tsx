"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import type { Asset, LayerTransform, SlideLayer } from "@/lib/schemas";
import { textLayerStyles } from "./text-style";

/**
 * One renderer for a layer, used by the canvas *and* by every miniature.
 *
 * The rail thumbnails and the variation cards are true miniatures of the slide
 * rather than grey rectangles because they run this exact code at a smaller
 * scale — so a thumbnail can never disagree with the canvas about what a slide
 * looks like.
 */

/** Positions a layer inside the 1080×1920 document space. */
export function layerBoxStyle(transform: LayerTransform): CSSProperties {
  return {
    position: "absolute",
    left: transform.x,
    top: transform.y,
    width: transform.width,
    height: transform.height,
    // Rotating about the centre is what the rotation handle and the panel's
    // rotation readout both assume.
    transform: `rotate(${transform.rotation}deg)`,
    opacity: transform.opacity,
  };
}

export interface LayerContentProps {
  layer: SlideLayer;
  assets: ReadonlyMap<string, Asset>;
}

export const LayerContent = React.memo(function LayerContent({
  layer,
  assets,
}: LayerContentProps) {
  if (layer.kind === "text") {
    const { block, run } = textLayerStyles(layer);
    return (
      // dynamic: type scale, colour and paint come from the document, not the token scale.
      <div style={{ ...block, width: "100%", height: "100%" }}>
        {/* dynamic: stroke, shadow or highlight box for the chosen text style. */}
        <span style={run}>{layer.content}</span>
      </div>
    );
  }

  if (layer.kind === "image") {
    const asset = assets.get(layer.assetId);
    if (!asset) {
      return (
        <div className="size-full bg-ink-100" aria-hidden="true">
          <span className="sr-only">Missing image</span>
        </div>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.poster}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        className="size-full"
        // dynamic: the fit mode is a per-layer document value.
        style={{ objectFit: layer.fit }}
      />
    );
  }

  return (
    <div
      className="size-full"
      // dynamic: the fill and corner radius are user-chosen document values.
      style={{ backgroundColor: layer.fill, borderRadius: layer.radius }}
    />
  );
});

/** A whole layer, positioned and painted — the read-only form. */
export function LayerView({ layer, assets }: LayerContentProps) {
  return (
    // dynamic: document-space geometry for this layer.
    <div style={layerBoxStyle(layer.transform)} aria-hidden="true">
      <LayerContent layer={layer} assets={assets} />
    </div>
  );
}

/** A human name for a layer, used in labels and announcements. */
export function layerLabel(layer: SlideLayer): string {
  if (layer.kind === "text") {
    const trimmed = layer.content.trim();
    return trimmed.length > 0 ? `${layer.name} — ${trimmed}` : layer.name;
  }
  return `${layer.name} — ${layer.kind} layer`;
}
