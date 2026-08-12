"use client";

import * as React from "react";
import { useNodes, useReactFlow, useStore, useViewport } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { CanvasFlowNode } from "./flow-types";

/**
 * The canvas minimap (SPEC §8.4, bottom-left) — drawn here rather than taken
 * from the library, so it carries our surface, our radius, our elevation and
 * our ink ramp instead of React Flow's default chrome.
 *
 * It is a button, not a decorated div: pressing or dragging it moves the
 * view, and it is reachable by keyboard like everything else on the screen.
 */
const MAP_WIDTH = 128;
const MAP_HEIGHT = 80;
const PADDING = 120;
const FALLBACK_NODE = { width: 280, height: 220 };

export function CanvasMinimap() {
  const nodes = useNodes<CanvasFlowNode>();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const { x, y, zoom } = useViewport();
  const { setCenter } = useReactFlow();
  const svgRef = React.useRef<SVGSVGElement>(null);

  const view = React.useMemo(
    () => ({ x: -x / zoom, y: -y / zoom, width: width / zoom, height: height / zoom }),
    [x, y, zoom, width, height],
  );

  const frame = React.useMemo(() => {
    let minX = view.x;
    let minY = view.y;
    let maxX = view.x + view.width;
    let maxY = view.y + view.height;

    for (const node of nodes) {
      const w = node.measured?.width ?? FALLBACK_NODE.width;
      const h = node.measured?.height ?? FALLBACK_NODE.height;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + w);
      maxY = Math.max(maxY, node.position.y + h);
    }

    const graphWidth = Math.max(1, maxX - minX + PADDING * 2);
    const graphHeight = Math.max(1, maxY - minY + PADDING * 2);
    const scale = Math.min(MAP_WIDTH / graphWidth, MAP_HEIGHT / graphHeight);

    return {
      originX: minX - PADDING,
      originY: minY - PADDING,
      scale,
      offsetX: (MAP_WIDTH - graphWidth * scale) / 2,
      offsetY: (MAP_HEIGHT - graphHeight * scale) / 2,
    };
  }, [nodes, view]);

  const toMap = (gx: number, gy: number) => ({
    x: (gx - frame.originX) * frame.scale + frame.offsetX,
    y: (gy - frame.originY) * frame.scale + frame.offsetY,
  });

  const jumpTo = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mapX = ((clientX - rect.left) / rect.width) * MAP_WIDTH;
    const mapY = ((clientY - rect.top) / rect.height) * MAP_HEIGHT;
    setCenter(
      (mapX - frame.offsetX) / frame.scale + frame.originX,
      (mapY - frame.offsetY) / frame.scale + frame.originY,
      { zoom, duration: 0 },
    );
  };

  if (nodes.length === 0) return null;

  const viewTopLeft = toMap(view.x, view.y);

  return (
    <button
      type="button"
      aria-label="Canvas minimap. Select a spot to move the view there."
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        jumpTo(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 0) return;
        jumpTo(event.clientX, event.clientY);
      }}
      className={cn(
        "absolute bottom-4 left-4 overflow-hidden rounded-md border border-ink-200",
        "bg-surface/90 glass p-0 shadow-elev-2 transition-ui duration-(--dur-fast)",
        "hover:border-ink-300 hover:shadow-elev-3",
      )}
    >
      <svg
        ref={svgRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        aria-hidden="true"
        className="block"
      >
        {nodes.map((node) => {
          const point = toMap(node.position.x, node.position.y);
          return (
            <rect
              key={node.id}
              x={point.x}
              y={point.y}
              width={Math.max(2, (node.measured?.width ?? FALLBACK_NODE.width) * frame.scale)}
              height={Math.max(2, (node.measured?.height ?? FALLBACK_NODE.height) * frame.scale)}
              rx={1}
              className={node.selected ? "fill-brand-500" : "fill-ink-300"}
            />
          );
        })}
        <rect
          x={viewTopLeft.x}
          y={viewTopLeft.y}
          width={Math.max(4, view.width * frame.scale)}
          height={Math.max(4, view.height * frame.scale)}
          rx={2}
          className="fill-brand-500/10 stroke-brand-500"
          strokeWidth={1}
        />
      </svg>
    </button>
  );
}
