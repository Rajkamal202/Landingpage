"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset, SlideLayer } from "@/lib/schemas";
import {
  DRAG_THRESHOLD_PX,
  type GestureCallbacks,
  type SiblingResolver,
} from "./canvas-types";
import { snapRect, SNAP_SCREEN_PX } from "./geometry";
import { LayerContent, layerBoxStyle, layerLabel } from "./layer-view";

/**
 * A selectable, draggable layer on the canvas.
 *
 * It is a real `<button>`, which buys three things a `<div role="button">` does
 * not: Tab reaches it in document order (so "Tab cycles layers" is the
 * browser's own behaviour rather than a hijacked key), the focus ring is the
 * global one, and a screen reader announces it as an actionable object with a
 * name.
 *
 * Pointer updates are coalesced into one `requestAnimationFrame` callback.
 * Pointer events fire faster than the compositor paints — on a 120Hz trackpad,
 * considerably faster — and committing to the store on every one of them is how
 * a canvas drag ends up at 30fps.
 */
export interface CanvasLayerProps extends GestureCallbacks {
  layer: SlideLayer;
  assets: ReadonlyMap<string, Asset>;
  selected: boolean;
  /** Live canvas scale; pointer deltas divide by it to reach document units. */
  scale: number;
  /** Resolves the boxes to snap against, called once per gesture. */
  getSiblings: SiblingResolver;
  onSelect: (layerId: string) => void;
}

export const CanvasLayer = React.memo(function CanvasLayer({
  layer,
  assets,
  selected,
  scale,
  getSiblings,
  onSelect,
  onTransform,
  onGuides,
  onGestureEnd,
}: CanvasLayerProps) {
  // Read the moving parts from a ref inside the gesture so the pointer handlers
  // never close over a stale scale or a stale transform.
  const live = React.useRef({ layer, scale, onTransform, onGuides, onGestureEnd });
  live.current = { layer, scale, onTransform, onGuides, onGestureEnd };

  const [dragging, setDragging] = React.useState(false);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    onSelect(layer.id);

    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);

    const siblings = getSiblings(layer.id);
    const origin = { ...live.current.layer.transform };
    const start = { x: event.clientX, y: event.clientY };
    let pointer = start;
    let constrained = event.shiftKey;
    let frame = 0;
    let moved = false;

    const apply = () => {
      frame = 0;
      const { scale: liveScale } = live.current;
      const dx = (pointer.x - start.x) / liveScale;
      const dy = (pointer.y - start.y) / liveScale;

      let x = origin.x + dx;
      let y = origin.y + dy;
      // Shift locks the drag to the axis it has travelled furthest along —
      // the standard gesture for keeping a caption on its baseline.
      if (constrained) {
        if (Math.abs(dx) >= Math.abs(dy)) y = origin.y;
        else x = origin.x;
      }

      const snapped = snapRect(
        { x, y, width: origin.width, height: origin.height },
        siblings,
        SNAP_SCREEN_PX / liveScale,
      );

      live.current.onGuides(snapped.guides);
      live.current.onTransform(
        layer.id,
        { ...origin, x: Math.round(snapped.x), y: Math.round(snapped.y) },
        "Move the layer",
        `move:${layer.id}`,
      );
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      pointer = { x: moveEvent.clientX, y: moveEvent.clientY };
      constrained = moveEvent.shiftKey;
      if (!moved) {
        const travelled = Math.hypot(pointer.x - start.x, pointer.y - start.y);
        if (travelled < DRAG_THRESHOLD_PX) return;
        moved = true;
        setDragging(true);
      }
      if (frame === 0) frame = requestAnimationFrame(apply);
    };

    const finish = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (frame !== 0) cancelAnimationFrame(frame);
      live.current.onGuides([]);
      if (moved) {
        setDragging(false);
        live.current.onGestureEnd();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={layerLabel(layer)}
      onPointerDown={onPointerDown}
      onFocus={() => onSelect(layer.id)}
      className={cn(
        "block touch-none select-none text-left",
        dragging ? "cursor-grabbing" : "cursor-grab",
        "focus-visible:ring-focus",
      )}
      // dynamic: document-space geometry for this layer.
      style={layerBoxStyle(layer.transform)}
    >
      <LayerContent layer={layer} assets={assets} />
    </button>
  );
});
