"use client";

import { create } from "zustand";
import { ticker } from "@/lib/api/client";
import { createGeneration } from "@/lib/api/generations";
import type { CanvasDoc, CanvasEdge, CanvasNode, GenerationMode, NodeKind } from "@/lib/schemas";
import {
  canRedo,
  canUndo,
  commitMerge,
  createCommandStack,
  execute,
  redo,
  undo,
  type Command,
  type CommandStackState,
} from "./command-stack";
import {
  copySubgraph,
  createNode,
  downstreamOf,
  isGenerative,
  reinstate,
  resolveConnection,
  snapPoint,
  topologicalOrder,
  upstreamAsset,
  upstreamPromptText,
  withBase,
  withOutputAsset,
  type ConnectionAttempt,
  type NodeDefaults,
  type Point,
} from "@/components/canvas/graph";

/**
 * The node canvas store (SPEC §8.4, §10).
 *
 * Undo is the shared `command-stack`, never a private one, so ⌘Z means the
 * same thing here as it does in the timeline. Two shapes of edit exist and
 * both are handled honestly:
 *
 *   • a *gesture* — dragging a node — brackets its run with `beginGesture`
 *     and `endGesture` and lands as exactly one entry, however long the drag
 *     takes and however many pointer-moves it fired;
 *   • a *repeat* — scrubbing a number field — passes a `mergeKey` and leans
 *     on the stack's merge window, then closes it with `endMerge`.
 *
 * Generation status is deliberately outside history. Undo restores what the
 * user authored; it does not un-run a generation.
 */

export interface ConnectionRejection {
  id: number;
  message: string;
  /** The node that refused the connection — it shakes. */
  nodeId: string | null;
  /** Viewport coordinates of the drop, so the explanation appears there. */
  x: number;
  y: number;
}

interface Snapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedIds: string[];
}

export interface CanvasState extends Snapshot {
  projectId: string | null;
  loaded: boolean;
  selectedEdgeIds: string[];
  history: CommandStackState;
  clipboard: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null;
  rejection: ConnectionRejection | null;
  defaults: NodeDefaults;
  running: boolean;
  runToken: number;
  announcement: string;

  load: (doc: CanvasDoc) => void;
  setDefaults: (defaults: NodeDefaults) => void;

  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  selectAll: () => void;

  beginGesture: () => void;
  endGesture: (label: string) => void;
  moveNodes: (moves: ReadonlyArray<{ id: string; position: Point }>) => void;
  nudgeSelection: (delta: Point) => void;

  addNode: (kind: NodeKind, at: Point) => string;
  addSourceNode: (at: Point, assetId: string, name: string) => string;
  replaceNode: (node: CanvasNode, label: string, mergeKey?: string) => void;
  removeSelection: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  duplicateSelection: () => void;

  connect: (attempt: ConnectionAttempt, pointer: Point) => void;
  /** The keyboard equivalent of dragging a wire (SPEC §11). */
  setInput: (targetId: string, handleId: string, sourceId: string | null) => void;
  reject: (message: string, nodeId: string | null, pointer: Point) => void;
  clearRejection: () => void;

  undo: () => void;
  redo: () => void;
  endMerge: () => void;

  runBranch: () => Promise<void>;
  cancelRun: () => void;
  announce: (message: string) => void;
}

const EMPTY_DEFAULTS: NodeDefaults = {
  imageModelId: "",
  videoModelId: "",
  voiceModelId: "",
  actorId: null,
};

const GENERATION_MODE: Partial<Record<NodeKind, GenerationMode>> = {
  "image-gen": "image",
  "video-gen": "video",
  voice: "audio",
};

/** The slice of state a run needs. Keeps the generator off the whole store. */
interface RunContext {
  projectId: string | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const useCanvasStore = create<CanvasState>()((set, get) => {
  const apply = (next: Snapshot) => set(next);

  const snapshot = (): Snapshot => {
    const { nodes, edges, selectedIds } = get();
    return { nodes, edges, selectedIds };
  };

  const record = (label: string, next: Snapshot, mergeKey?: string) => {
    const before = snapshot();
    const command: Command = {
      label,
      do: () => apply(next),
      undo: () => apply(before),
      ...(mergeKey === undefined ? {} : { mergeKey }),
    };
    set({ history: execute(get().history, command) });
  };

  /** Runtime status lives outside history — see the note at the top. */
  const setRuntime = (id: string, status: CanvasNode["status"], progress: number) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? withBase(node, { status, progress }) : node,
      ),
    }));

  let gesture: Snapshot | null = null;

  return {
    projectId: null,
    loaded: false,
    nodes: [],
    edges: [],
    selectedIds: [],
    selectedEdgeIds: [],
    history: createCommandStack(),
    clipboard: null,
    rejection: null,
    defaults: EMPTY_DEFAULTS,
    running: false,
    runToken: 0,
    announcement: "",

    load: (doc) =>
      set((state) => ({
        projectId: doc.projectId,
        nodes: doc.nodes,
        edges: doc.edges,
        selectedIds: [],
        selectedEdgeIds: [],
        history: createCommandStack(),
        clipboard: null,
        rejection: null,
        loaded: true,
        running: false,
        runToken: state.runToken + 1,
        announcement: "",
      })),

    setDefaults: (defaults) => set({ defaults }),

    setSelection: (nodeIds, edgeIds) =>
      set({ selectedIds: nodeIds, selectedEdgeIds: edgeIds }),

    selectAll: () =>
      set((state) => ({
        selectedIds: state.nodes.map((node) => node.id),
        selectedEdgeIds: state.edges.map((edge) => edge.id),
        announcement: `${state.nodes.length} ${state.nodes.length === 1 ? "node" : "nodes"} selected.`,
      })),

    beginGesture: () => {
      gesture = snapshot();
    },

    endGesture: (label) => {
      const before = gesture;
      gesture = null;
      if (!before) return;
      const after = snapshot();
      if (before.nodes === after.nodes && before.edges === after.edges) return;
      // `execute` re-applies `after`, which is the state we are already in —
      // an idempotent set that keeps all the stack bookkeeping in one place.
      set({
        history: execute(commitMerge(get().history), {
          label,
          do: () => apply(after),
          undo: () => apply(before),
        }),
      });
    },

    moveNodes: (moves) =>
      set((state) => ({
        nodes: state.nodes.map((node) => {
          const move = moves.find((candidate) => candidate.id === node.id);
          return move ? withBase(node, { position: snapPoint(move.position) }) : node;
        }),
      })),

    nudgeSelection: (delta) => {
      const state = get();
      if (state.selectedIds.length === 0) return;
      const selected = new Set(state.selectedIds);
      record(
        "Move node",
        {
          nodes: state.nodes.map((node) =>
            selected.has(node.id)
              ? withBase(node, {
                  position: snapPoint({
                    x: node.position.x + delta.x,
                    y: node.position.y + delta.y,
                  }),
                })
              : node,
          ),
          edges: state.edges,
          selectedIds: state.selectedIds,
        },
        `nudge:${state.selectedIds.join(",")}`,
      );
    },

    addNode: (kind, at) => {
      const state = get();
      const node = createNode(kind, at, state.defaults);
      record(`Add ${node.name.toLowerCase()} node`, {
        nodes: [...state.nodes, node],
        edges: state.edges,
        selectedIds: [node.id],
      });
      set({ announcement: `${node.name} node added.` });
      return node.id;
    },

    addSourceNode: (at, assetId, name) => {
      const state = get();
      const created = createNode("source", at, state.defaults);
      const node: CanvasNode =
        created.kind === "source"
          ? { ...created, assetId, name, status: "ready", progress: 100 }
          : created;
      record("Add source node", {
        nodes: [...state.nodes, node],
        edges: state.edges,
        selectedIds: [node.id],
      });
      set({ announcement: `${name} added as a source node.` });
      return node.id;
    },

    replaceNode: (next, label, mergeKey) => {
      const state = get();
      record(
        label,
        {
          nodes: state.nodes.map((node) => (node.id === next.id ? next : node)),
          edges: state.edges,
          selectedIds: state.selectedIds,
        },
        mergeKey,
      );
    },

    removeSelection: () => {
      const state = get();
      const doomedNodes = new Set(state.selectedIds);
      const doomedEdges = new Set(state.selectedEdgeIds);
      if (doomedNodes.size === 0 && doomedEdges.size === 0) return;

      const label =
        doomedNodes.size > 0
          ? doomedNodes.size === 1
            ? "Delete node"
            : `Delete ${doomedNodes.size} nodes`
          : doomedEdges.size === 1
            ? "Disconnect nodes"
            : `Remove ${doomedEdges.size} connections`;

      record(label, {
        nodes: state.nodes.filter((node) => !doomedNodes.has(node.id)),
        edges: state.edges.filter(
          (edge) =>
            !doomedEdges.has(edge.id) &&
            !doomedNodes.has(edge.source) &&
            !doomedNodes.has(edge.target),
        ),
        selectedIds: [],
      });
      set({ selectedEdgeIds: [], announcement: `${label}.` });
    },

    copySelection: () => {
      const state = get();
      if (state.selectedIds.length === 0) return;
      const clipboard = copySubgraph(state.nodes, state.edges, state.selectedIds);
      set({
        clipboard,
        announcement:
          clipboard.nodes.length === 1
            ? "Node copied."
            : `${clipboard.nodes.length} nodes copied.`,
      });
    },

    pasteClipboard: () => {
      const state = get();
      if (!state.clipboard || state.clipboard.nodes.length === 0) return;
      const pasted = reinstate(state.clipboard, { x: 32, y: 32 });
      record(pasted.nodes.length === 1 ? "Paste node" : `Paste ${pasted.nodes.length} nodes`, {
        nodes: [...state.nodes, ...pasted.nodes],
        edges: [...state.edges, ...pasted.edges],
        selectedIds: pasted.nodes.map((node) => node.id),
      });
      set({
        selectedEdgeIds: [],
        announcement: pasted.nodes.length === 1 ? "Node pasted." : `${pasted.nodes.length} nodes pasted.`,
      });
    },

    duplicateSelection: () => {
      const state = get();
      if (state.selectedIds.length === 0) return;
      const pasted = reinstate(
        copySubgraph(state.nodes, state.edges, state.selectedIds),
        { x: 32, y: 32 },
      );
      record(
        pasted.nodes.length === 1 ? "Duplicate node" : `Duplicate ${pasted.nodes.length} nodes`,
        {
          nodes: [...state.nodes, ...pasted.nodes],
          edges: [...state.edges, ...pasted.edges],
          selectedIds: pasted.nodes.map((node) => node.id),
        },
      );
      set({ selectedEdgeIds: [] });
    },

    connect: (attempt, pointer) => {
      const state = get();
      const result = resolveConnection(state.nodes, state.edges, attempt);
      if (!result.ok) {
        get().reject(result.problem, attempt.target, pointer);
        return;
      }
      const dropped = new Set(result.replaces);
      record("Connect nodes", {
        nodes: state.nodes,
        edges: [...state.edges.filter((edge) => !dropped.has(edge.id)), result.edge],
        selectedIds: state.selectedIds,
      });
      set({ rejection: null, announcement: "Nodes connected." });
    },

    setInput: (targetId, handleId, sourceId) => {
      const state = get();
      const kept = state.edges.filter(
        (edge) => !(edge.target === targetId && edge.targetHandle === handleId),
      );

      if (sourceId === null) {
        if (kept.length === state.edges.length) return;
        record("Disconnect nodes", {
          nodes: state.nodes,
          edges: kept,
          selectedIds: state.selectedIds,
        });
        set({ announcement: "Input disconnected." });
        return;
      }

      const result = resolveConnection(state.nodes, kept, {
        source: sourceId,
        sourceHandle: null,
        target: targetId,
        targetHandle: handleId,
      });
      if (!result.ok) {
        set({ announcement: result.problem });
        return;
      }
      record("Connect nodes", {
        nodes: state.nodes,
        edges: [...kept, result.edge],
        selectedIds: state.selectedIds,
      });
      set({ announcement: "Nodes connected." });
    },

    reject: (message, nodeId, pointer) =>
      set({
        rejection: { id: Date.now(), message, nodeId, x: pointer.x, y: pointer.y },
        announcement: message,
      }),

    clearRejection: () => set({ rejection: null }),

    undo: () => {
      const state = get();
      if (!canUndo(state.history)) return;
      set({ history: undo(state.history), announcement: "Undone." });
    },

    redo: () => {
      const state = get();
      if (!canRedo(state.history)) return;
      set({ history: redo(state.history), announcement: "Redone." });
    },

    endMerge: () => set((state) => ({ history: commitMerge(state.history) })),

    cancelRun: () =>
      set((state) => ({
        running: false,
        runToken: state.runToken + 1,
        announcement: "Run stopped.",
      })),

    announce: (message) => set({ announcement: message }),

    runBranch: async () => {
      const start = get();
      if (start.running || start.nodes.length === 0) return;

      const seeds =
        start.selectedIds.length > 0 ? start.selectedIds : start.nodes.map((node) => node.id);
      const scope = downstreamOf(start.edges, seeds);
      const order = topologicalOrder(start.nodes, start.edges, scope);
      if (order.length === 0) return;

      const token = start.runToken + 1;
      set((state) => ({
        running: true,
        runToken: token,
        announcement: `Running ${order.length} ${order.length === 1 ? "node" : "nodes"}.`,
        nodes: state.nodes.map((node) =>
          scope.has(node.id) ? withBase(node, { status: "queued", progress: 0 }) : node,
        ),
      }));

      const live = () => get().runToken === token;

      try {
        for (const id of order) {
          if (!live()) return;
          const node = get().nodes.find((candidate) => candidate.id === id);
          if (!node) continue;

          // Inputs are not generated. They are ready the moment they hold
          // something, and honestly idle when they do not.
          if (node.kind === "source" || node.kind === "prompt") {
            const filled = node.kind === "source" ? node.assetId !== null : node.text.length > 0;
            setRuntime(id, filled ? "ready" : "idle", filled ? 100 : 0);
            continue;
          }

          setRuntime(id, "running", 0);
          let produced: string | null = null;

          const context: RunContext = {
            projectId: get().projectId,
            nodes: get().nodes,
            edges: get().edges,
          };

          for await (const step of runNode(node, context, get().defaults)) {
            if (!live()) return;
            setRuntime(id, "running", step.progress);
            if (step.assetId !== null) produced = step.assetId;
          }
          if (!live()) return;

          const resolved = produced ?? upstreamAsset(get().nodes, get().edges, id);
          set((current) => ({
            nodes: current.nodes.map((candidate) =>
              candidate.id === id
                ? withOutputAsset(withBase(candidate, { status: "ready", progress: 100 }), resolved)
                : candidate,
            ),
          }));
        }

        if (!live()) return;
        set({
          running: false,
          announcement: `Run finished. ${order.length} ${order.length === 1 ? "node is" : "nodes are"} ready.`,
        });
      } catch (caught) {
        if (!live()) return;
        const reason =
          caught instanceof Error ? caught.message : "The run stopped before it finished";
        set((state) => ({
          running: false,
          announcement: `${reason}. Check the node's model, then run the branch again.`,
          nodes: state.nodes.map((node) =>
            scope.has(node.id) && node.status !== "ready"
              ? withBase(node, { status: "failed", progress: 0 })
              : node,
          ),
        }));
      }
    },
  };
});

/**
 * Progress for one node.
 *
 * Generative kinds go through the real API stream, so their numbers come from
 * the same place the studio's do. Compose and Output use the shared `ticker`,
 * which is the primitive underneath that stream. Neither path is a
 * `setInterval` counting to a hundred (SPEC §9).
 */
async function* runNode(
  node: CanvasNode,
  context: RunContext,
  defaults: NodeDefaults,
): AsyncGenerator<{ progress: number; assetId: string | null }, void, void> {
  const mode = GENERATION_MODE[node.kind];

  if (mode && isGenerative(node.kind)) {
    const modelId =
      node.kind === "image-gen"
        ? node.modelId
        : node.kind === "video-gen"
          ? node.modelId
          : defaults.voiceModelId;

    const text =
      node.kind === "voice"
        ? node.script
        : upstreamPromptText(context.nodes, context.edges, node.id);

    for await (const event of createGeneration({
      projectId: context.projectId ?? "",
      mode,
      prompt: [{ type: "text", value: text }],
      modelId,
      aspect:
        node.kind === "video-gen" ? node.aspect : node.kind === "image-gen" ? node.size : "9:16",
      durationMs: node.kind === "video-gen" ? node.durationMs : 1_000,
      batchCount: 1,
      startFrameAssetId: node.kind === "video-gen" ? node.startFrameAssetId : null,
    })) {
      yield {
        progress: event.generation.progress,
        assetId: event.done ? event.generation.assetId : null,
      };
    }
    return;
  }

  // Compose and Output do real work in a real product — muxing, encoding — so
  // they get a short pass rather than snapping straight to done.
  for await (const fraction of ticker(node.kind === "compose" ? 1_400 : 900, 120)) {
    yield { progress: Math.round(fraction * 100), assetId: null };
  }
}
