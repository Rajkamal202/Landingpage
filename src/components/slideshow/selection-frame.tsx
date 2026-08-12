"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { SlideLayer } from "@/lib/schemas";
import { DRAG_THRESHOLD_PX, type GestureCallbacks } from "./canvas-types";
import { angleFrom, normaliseAngle, resizeRect, roundRect, type ResizeHandle } from "./geometry";
import { layerBoxStyle } from "./layer-view";

/**
 * Eight resize handles and a rotation handle (SPEC §8.6).
 *
 * Everything here is counter-scaled: the frame lives inside the stage, which is
 * scaled to fit, so a handle drawn at its natural size would shrink with the
 * canvas until it was too small to hit. `scale(1 / scale)` cancels that, giving
 * handles a constant 12px on screen at any canvas size, with the hairline
 * border staying a hairline.
 *
 * The handles are `<span>`s, not buttons, on purpose: they are a pointer
 * affordance whose keyboard equivalent is the Layout section of the property
 * panel, where width, height and rotation are drag-scrubbable *and* arrow-key
 * operable. Putting nine extra tab stops around every selected layer would make
 * keyboard traversal worse, not better (SPEC §11).
 */
interface HandleSpec {
  id: string;
  handle: ResizeHandle;
  /** Percentage position inside the layer box. */
  left: number;
  top: number;
  cursor: string;
}

const HANDLES: readonly HandleSpec[] = [
  { id: "nw", handle: { x: -1, y: -1 }, left: 0, top: 0, cursor: "cursor-nwse-resize" },
  { id: "n", handle: { x: 0, y: -1 }, left: 50, top: 0, cursor: "cursor-ns-resize" },
  { id: "ne", handle: { x: 1, y: -1 }, left: 100, top: 0, cursor: "cursor-nesw-resize" },
  { id: "e", handle: { x: 1, y: 0 }, left: 100, top: 50, cursor: "cursor-ew-resize" },
  { id: "se", handle: { x: 1, y: 1 }, left: 100, top: 100, cursor: "cursor-nwse-resize" },
  { id: "s", handle: { x: 0, y: 1 }, left: 50, top: 100, cursor: "cursor-ns-resize" },
  { id: "sw", handle: { x: -1, y: 1 }, left: 0, top: 100, cursor: "cursor-nesw-resize" },
  { id: "w", handle: { x: -1, y: 0 }, left: 0, top: 50, cursor: "cursor-ew-resize" },
];

/** Screen pixels between the top edge and the rotation handle. */
const ROTATION_OFFSET_PX = 28;
/** Shift snaps rotation to this many degrees. */
const ROTATION_SNAP_DEGREES = 15;

export interface SelectionFrameProps extends GestureCallbacks {
  layer: SlideLayer;
  scale: number;
}

export function SelectionFrame({
  layer,
  scale,
  onTransform,
  onGuides,
  onGestureEnd,
}: SelectionFrameProps) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const live = React.useRef({ layer, scale, onTransform, onGuides, onGestureEnd });
  live.current = { layer, scale, onTransform, onGuides, onGestureEnd };

  /** Shared pointer plumbing: capture, threshold, rAF coalescing, cleanup. */
  const beginGesture = (
    event: React.PointerEvent<HTMLElement>,
    step: (pointer: { x: number; y: number }, modifiers: { shift: boolean }) => void,
  ) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);

    const start = { x: event.clientX, y: event.clientY };
    let pointer = start;
    let shift = event.shiftKey;
    let frame = 0;
    let moved = false;

    const apply = () => {
      frame = 0;
      step(pointer, { shift });
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      pointer = { x: moveEvent.clientX, y: moveEvent.clientY };
      shift = moveEvent.shiftKey;
      if (!moved) {
        if (Math.hypot(pointer.x - start.x, pointer.y - start.y) < DRAG_THRESHOLD_PX) return;
        moved = true;
      }
      if (frame === 0) frame = requestAnimationFrame(apply);
    };

    const finish = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (frame !== 0) cancelAnimationFrame(frame);
      live.current.onGuides([]);
      if (moved) live.current.onGestureEnd();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const startResize = (event: React.PointerEvent<HTMLElement>, spec: HandleSpec) => {
    const origin = { ...live.current.layer.transform };
    const start = { x: event.clientX, y: event.clientY };

    beginGesture(event, (pointer, modifiers) => {
      const { scale: liveScale } = live.current;
      const worldDelta = {
        x: (pointer.x - start.x) / liveScale,
        y: (pointer.y - start.y) / liveScale,
      };
      const resized = roundRect(
        resizeRect(origin, origin.rotation, spec.handle, worldDelta, modifiers.shift),
      );
      live.current.onTransform(
        live.current.layer.id,
        { ...origin, ...resized },
        "Resize the layer",
        `resize:${live.current.layer.id}`,
      );
    });
  };

  const startRotate = (event: React.PointerEvent<HTMLElement>) => {
    const origin = { ...live.current.layer.transform };
    const box = frameRef.current?.getBoundingClientRect();
    if (!box) return;
    // Rotation is about the centre, so the rotated bounding box shares it.
    const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const startAngle = angleFrom(centre, { x: event.clientX, y: event.clientY });

    beginGesture(event, (pointer, modifiers) => {
      const delta = angleFrom(centre, pointer) - startAngle;
      const raw = normaliseAngle(origin.rotation + delta);
      const next = modifiers.shift
        ? Math.round(raw / ROTATION_SNAP_DEGREES) * ROTATION_SNAP_DEGREES
        : Math.round(raw);
      live.current.onTransform(
        live.current.layer.id,
        { ...origin, rotation: next },
        "Rotate the layer",
        `rotate:${live.current.layer.id}`,
      );
    });
  };

  const counterScale = `scale(${1 / scale}) translate(-50%, -50%)`;

  return (
    <div
      ref={frameRef}
      className="pointer-events-none absolute outline outline-brand-500"
      // dynamic: the frame tracks the layer's document-space box, with a hairline that survives the canvas scale.
      style={{ ...layerBoxStyle(layer.transform), opacity: 1, outlineWidth: 1 / scale }}
    >
      <span
        aria-hidden="true"
        onPointerDown={startRotate}
        className={cn(
          "pointer-events-auto absolute grid size-3 cursor-grab place-items-center rounded-pill",
          "border border-brand-500 bg-surface shadow-elev-1 active:cursor-grabbing",
        )}
        // dynamic: counter-scaled so the handle keeps a constant on-screen size, offset above the top edge.
        style={{
          left: "50%",
          top: 0,
          transform: `scale(${1 / scale}) translate(-50%, -50%) translateY(-${ROTATION_OFFSET_PX}px)`,
        }}
      />

      {HANDLES.map((spec) => (
        <span
          key={spec.id}
          aria-hidden="true"
          onPointerDown={(event) => startResize(event, spec)}
          className={cn(
            "pointer-events-auto absolute size-3 rounded-sm border border-brand-500 bg-surface",
            "shadow-elev-1",
            spec.cursor,
          )}
          // dynamic: percentage position on the layer box, counter-scaled to a constant on-screen size.
          style={{ left: `${spec.left}%`, top: `${spec.top}%`, transform: counterScale }}
        />
      ))}
    </div>
  );
}
