"use client";

import * as React from "react";
import { getBezierPath, type EdgeProps, type EdgeTypes } from "@xyflow/react";
import { useCanvasStore } from "@/lib/stores/canvas";

/**
 * The only edge renderer on the canvas (SPEC §8.4).
 *
 * Bezier, 2px, `--color-ink-300`, brand when either endpoint is selected, and
 * a dash that flows along the wire while the downstream node is generating.
 * Colour and dash live in `canvas.css`; this component only decides which
 * state the wire is in.
 *
 * Both flags are read from the store rather than passed through edge data, so
 * a run that ticks progress twenty times a second never rebuilds the edge
 * array.
 */
function TypedEdgeImpl({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const active = useCanvasStore(
    React.useCallback(
      (state) =>
        selected === true ||
        state.selectedIds.includes(source) ||
        state.selectedIds.includes(target),
      [selected, source, target],
    ),
  );

  const flowing = useCanvasStore(
    React.useCallback(
      (state) => {
        const downstream = state.nodes.find((node) => node.id === target);
        return downstream?.status === "running" || downstream?.status === "queued";
      },
      [target],
    ),
  );

  return (
    <>
      <path
        d={path}
        className="react-flow__edge-path canvas-edge"
        data-active={active}
        data-flowing={flowing}
        strokeDasharray={flowing ? "8 8" : undefined}
      />
      {/* The wire is 2px; the thing you can actually click is 20px. */}
      <path d={path} className="react-flow__edge-interaction canvas-edge-hit" />
    </>
  );
}

export const TypedEdge = React.memo(TypedEdgeImpl);

export const edgeTypes: EdgeTypes = { typed: TypedEdge };
