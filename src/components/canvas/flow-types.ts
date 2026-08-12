import type { Edge, Node } from "@xyflow/react";
import type { CanvasNode, NodeKind } from "@/lib/schemas";

/**
 * The bridge between the document model and React Flow's own node shape.
 *
 * `CanvasNode` stays the single source of truth: a flow node carries the
 * whole document node in `data` and adds nothing of its own. React Flow's
 * `type` is the node kind, which is what maps it to a renderer.
 */
export type CanvasNodeData = { node: CanvasNode };

export type CanvasFlowNode = Node<CanvasNodeData, NodeKind>;

/**
 * Edges carry no data. Whether an edge is highlighted or flowing depends on
 * live selection and run status, and reading those from the store inside the
 * edge means the edge array does not have to be rebuilt on every progress
 * tick — which is most of what keeps a running graph at 60fps.
 */
export type CanvasFlowEdge = Edge<Record<string, never>, "typed">;
