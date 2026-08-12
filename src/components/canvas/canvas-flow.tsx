"use client";

import "@xyflow/react/dist/base.css";
import "./canvas.css";

import * as React from "react";
import {
  ReactFlow,
  SelectionMode,
  ViewportPortal,
  useReactFlow,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { hasAssetDragPayload, readAssetDragPayload } from "@/lib/dnd/payload";
import { useCanvasStore } from "@/lib/stores/canvas";
import type { CanvasFlowEdge, CanvasFlowNode } from "./flow-types";
import { resolveConnection, type Point } from "./graph";
import { CanvasMinimap } from "./canvas-minimap";
import { CanvasZoomControls } from "./canvas-zoom-controls";
import { ConnectionCallout } from "./connection-callout";
import { nodeTypes } from "./node-types";
import { edgeTypes } from "./typed-edge";

/**
 * The canvas surface (SPEC §8.4).
 *
 * React Flow supplies the pane, the viewport transform and the pointer maths;
 * every visible surface — nodes, edges, ports, minimap, controls, marquee,
 * backdrop — is ours. `base.css` is imported for geometry only; `canvas.css`
 * repaints everything it styles.
 *
 * Pan is middle-drag or space-drag, left-drag marquees, scroll zooms inside a
 * 0.25–2.5 clamp, and nodes snap to the 8px grid.
 */
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2.5;
const SNAP: [number, number] = [8, 8];

function pointerFrom(event: MouseEvent | TouchEvent): Point {
  if ("clientX" in event) return { x: event.clientX, y: event.clientY };
  const touch = event.changedTouches[0];
  return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
}

export function CanvasFlow({ onOpenLibraryAt }: { onOpenLibraryAt: (screen: Point) => void }) {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const selectedEdgeIds = useCanvasStore((state) => state.selectedEdgeIds);
  const { screenToFlowPosition } = useReactFlow();

  /**
   * Flow nodes are cached per document node, so a node whose `CanvasNode`
   * object did not change keeps the exact same `data` object — and therefore
   * skips re-rendering. Without this, one node's progress tick would re-render
   * the entire graph twenty times a second.
   */
  const cache = React.useRef(new Map<string, { node: CanvasFlowNode["data"]["node"]; selected: boolean; flow: CanvasFlowNode }>());

  const flowNodes = React.useMemo(() => {
    const selected = new Set(selectedIds);
    const next = new Map<string, { node: CanvasFlowNode["data"]["node"]; selected: boolean; flow: CanvasFlowNode }>();

    const list = nodes.map((node) => {
      const isSelected = selected.has(node.id);
      const hit = cache.current.get(node.id);
      if (hit && hit.node === node && hit.selected === isSelected) {
        next.set(node.id, hit);
        return hit.flow;
      }
      const flow: CanvasFlowNode = {
        id: node.id,
        type: node.kind,
        position: node.position,
        data: { node },
        selected: isSelected,
        focusable: false,
      };
      next.set(node.id, { node, selected: isSelected, flow });
      return flow;
    });

    cache.current = next;
    return list;
  }, [nodes, selectedIds]);

  const flowEdges = React.useMemo<CanvasFlowEdge[]>(() => {
    const selected = new Set(selectedEdgeIds);
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: "typed",
      selected: selected.has(edge.id),
      focusable: false,
    }));
  }, [edges, selectedEdgeIds]);

  const onNodesChange = React.useCallback((changes: NodeChange<CanvasFlowNode>[]) => {
    const store = useCanvasStore.getState();
    const moves: Array<{ id: string; position: Point }> = [];
    let selection: readonly string[] | null = null;

    for (const change of changes) {
      if (change.type === "position" && change.position) {
        moves.push({ id: change.id, position: change.position });
        continue;
      }
      if (change.type === "select") {
        // Annotated explicitly: `selection` is assigned from an expression
        // that reads `current`, which TypeScript reads as circular inference.
        const current: readonly string[] = selection ?? store.selectedIds;
        selection = change.selected
          ? current.includes(change.id)
            ? current
            : [...current, change.id]
          : current.filter((id: string) => id !== change.id);
      }
    }

    if (moves.length > 0) store.moveNodes(moves);
    if (selection) store.setSelection([...selection], store.selectedEdgeIds);
  }, []);

  const onEdgesChange = React.useCallback((changes: EdgeChange<CanvasFlowEdge>[]) => {
    const store = useCanvasStore.getState();
    let selection: readonly string[] | null = null;

    for (const change of changes) {
      if (change.type !== "select") continue;
      // Annotated explicitly — see the note in onNodesChange.
      const current: readonly string[] = selection ?? store.selectedEdgeIds;
      selection = change.selected
        ? current.includes(change.id)
          ? current
          : [...current, change.id]
        : current.filter((id: string) => id !== change.id);
    }

    if (selection) store.setSelection(store.selectedIds, [...selection]);
  }, []);

  return (
    <div
      className="relative size-full bg-page"
      onDragOver={(event) => {
        if (hasAssetDragPayload(event.dataTransfer)) event.preventDefault();
      }}
      onDrop={(event) => {
        const payload = readAssetDragPayload(event.dataTransfer);
        if (!payload) return;
        event.preventDefault();
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        useCanvasStore.getState().addSourceNode(position, payload.assetId, payload.name);
      }}
      onDoubleClick={(event) => {
        // Only the empty pane opens the library; a double-click on a node is
        // the rename gesture.
        if (!(event.target instanceof Element)) return;
        if (!event.target.classList.contains("react-flow__pane")) return;
        onOpenLibraryAt({ x: event.clientX, y: event.clientY });
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={() => useCanvasStore.getState().beginGesture()}
        onNodeDragStop={() => useCanvasStore.getState().endGesture("Move node")}
        onConnect={(connection) => {
          useCanvasStore.getState().connect(
            {
              source: connection.source,
              sourceHandle: connection.sourceHandle,
              target: connection.target,
              targetHandle: connection.targetHandle,
            },
            { x: 0, y: 0 },
          );
        }}
        isValidConnection={(candidate) => {
          const store = useCanvasStore.getState();
          return resolveConnection(store.nodes, store.edges, {
            source: candidate.source,
            sourceHandle: candidate.sourceHandle ?? null,
            target: candidate.target,
            targetHandle: candidate.targetHandle ?? null,
          }).ok;
        }}
        onConnectEnd={(event, connection) => {
          if (connection.isValid) return;
          const point = pointerFrom(event);
          const from = connection.fromHandle;
          if (!from) return;

          const to = connection.toHandle;
          if (!to) {
            // A wire dropped on nothing is a request for a node to attach it
            // to, which is exactly what the library is for.
            onOpenLibraryAt(point);
            return;
          }

          const forward = from.type === "source";
          const attempt = {
            source: forward ? from.nodeId : to.nodeId,
            sourceHandle: (forward ? from.id : to.id) ?? null,
            target: forward ? to.nodeId : from.nodeId,
            targetHandle: (forward ? to.id : from.id) ?? null,
          };

          const store = useCanvasStore.getState();
          const result = resolveConnection(store.nodes, store.edges, attempt);
          if (result.ok) return;
          store.reject(result.problem, attempt.target, point);
        }}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
        snapToGrid
        snapGrid={SNAP}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        zoomOnDoubleClick={false}
        panOnDrag={[1]}
        panActivationKeyCode="Space"
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={null}
        nodesFocusable={false}
        edgesFocusable={false}
        disableKeyboardA11y
        onlyRenderVisibleElements
        attributionPosition="bottom-center"
        className="canvas-surface"
      >
        {/* The dot grid lives inside the viewport, so it pans and zooms as one
            GPU transform instead of repainting a background position. */}
        <ViewportPortal>
          <div aria-hidden="true" className="canvas-grid-plane dot-grid" />
        </ViewportPortal>
      </ReactFlow>

      <CanvasMinimap />
      <CanvasZoomControls />
      <ConnectionCallout />
    </div>
  );
}
