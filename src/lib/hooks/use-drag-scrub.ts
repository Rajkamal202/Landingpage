"use client";

import * as React from "react";

/**
 * SPEC §15: "Drag-scrubbable number fields. Small detail, enormous
 * credibility." This is the shared mechanic behind every numeric property in
 * the timeline, slideshow and canvas panels.
 *
 * Details that make it feel like a real tool rather than a slider in disguise:
 *
 * - Pointer capture, so the drag survives leaving the element.
 * - Pointer lock when available, so the cursor doesn't run out of screen on a
 *   long drag and the value keeps moving.
 * - Shift for fine (×0.25), Alt for coarse (×4).
 * - A 3px dead zone before the drag starts, so a click still focuses the input
 *   for typing instead of nudging the value by one.
 */
export interface DragScrubOptions {
  value: number;
  onChange: (value: number) => void;
  /** Units per pixel of horizontal movement. */
  sensitivity?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export interface DragScrubResult {
  dragging: boolean;
  handlers: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  };
}

const DEAD_ZONE_PX = 3;

export function useDragScrub({
  value,
  onChange,
  sensitivity = 1,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled = false,
  onDragStart,
  onDragEnd,
}: DragScrubOptions): DragScrubResult {
  const [dragging, setDragging] = React.useState(false);
  const state = React.useRef({ startValue: value, accumulated: 0, active: false });

  const latest = React.useRef({ value, onChange, min, max, step, sensitivity });
  latest.current = { value, onChange, min, max, step, sensitivity };

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;
      const element = event.currentTarget;
      element.setPointerCapture(event.pointerId);
      state.current = { startValue: latest.current.value, accumulated: 0, active: false };

      let locked = false;

      const applyDelta = (dx: number) => {
        state.current.accumulated += dx;
        if (!state.current.active) {
          if (Math.abs(state.current.accumulated) < DEAD_ZONE_PX) return;
          state.current.active = true;
          setDragging(true);
          onDragStart?.();
          // Only lock once the gesture is definitely a drag — locking on
          // pointerdown would swallow ordinary clicks.
          if ("requestPointerLock" in element) {
            void Promise.resolve(element.requestPointerLock()).catch(() => undefined);
            locked = true;
          }
        }

        const config = latest.current;
        const modifier = currentModifier;
        const raw =
          state.current.startValue +
          state.current.accumulated * config.sensitivity * modifier;
        const snapped = Math.round(raw / config.step) * config.step;
        const clamped = Math.min(config.max, Math.max(config.min, snapped));
        // Guard against float dust producing 0.30000000000000004.
        const precise = Number(clamped.toFixed(6));
        if (precise !== config.value) config.onChange(precise);
      };

      let currentModifier = 1;

      const onPointerMove = (moveEvent: PointerEvent) => {
        currentModifier = moveEvent.shiftKey ? 0.25 : moveEvent.altKey ? 4 : 1;
        const dx = locked ? moveEvent.movementX : moveEvent.movementX;
        applyDelta(dx);
      };

      const finish = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
        if (locked && document.pointerLockElement) document.exitPointerLock();
        if (state.current.active) {
          setDragging(false);
          onDragEnd?.();
        }
        state.current.active = false;
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
    },
    [disabled, onDragEnd, onDragStart],
  );

  return { dragging, handlers: { onPointerDown } };
}
