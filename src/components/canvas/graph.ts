import {
  NODE_LABEL,
  NODE_PORTS,
  promptToPlainText,
  type CanvasEdge,
  type CanvasNode,
  type NodeKind,
  type NodeStatus,
  type PortType,
  type PromptToken,
} from "@/lib/schemas";
import {
  IconDownload,
  IconFolder,
  IconImage,
  IconLayers,
  IconText,
  IconVideo,
  IconVoice,
  type IconDef,
} from "@/components/icons";

/**
 * Pure graph maths for the node canvas (SPEC §8.4).
 *
 * Everything here is a function of the document — no React, no store, no
 * side effects — so connection rules, topological order and duplication are
 * testable on their own and the store stays about state transitions.
 *
 * The node model itself is `CanvasNode` from `@/lib/schemas`. Nothing in this
 * file invents a parallel shape; `NODE_PORTS` is the authority on what each
 * kind accepts and emits.
 */

export interface Point {
  x: number;
  y: number;
}

/** SPEC §8.4: nodes snap to an 8px grid. */
export const GRID = 8;

export function snap(value: number): number {
  return Math.round(value / GRID) * GRID;
}

export function snapPoint(point: Point): Point {
  return { x: snap(point.x), y: snap(point.y) };
}

/* ── Identity ──────────────────────────────────────────────────────────── */

export const NODE_GLYPH: Record<NodeKind, IconDef> = {
  source: IconFolder,
  prompt: IconText,
  "image-gen": IconImage,
  "video-gen": IconVideo,
  voice: IconVoice,
  compose: IconLayers,
  output: IconDownload,
};

/** One line each, for the node library palette. */
export const NODE_BLURB: Record<NodeKind, string> = {
  source: "Bring in an uploaded file or a library asset.",
  prompt: "Write the description everything downstream reads from.",
  "image-gen": "Make a still from a prompt and up to four reference images.",
  "video-gen": "Turn a start frame into motion.",
  voice: "Read a script in an actor's voice.",
  compose: "Merge video and audio into one scene.",
  output: "Finish the branch and export the result.",
};

const PORT_NOUN: Record<PortType, string> = {
  image: "image",
  video: "video",
  audio: "audio",
  text: "text",
  scene: "scene",
};

export const NODE_KINDS: readonly NodeKind[] = [
  "source",
  "prompt",
  "image-gen",
  "video-gen",
  "voice",
  "compose",
  "output",
];

/* ── Ports ─────────────────────────────────────────────────────────────── */

export function outputPort(kind: NodeKind, handleId: string | null | undefined) {
  const id = handleId ?? NODE_PORTS[kind].outputs[0]?.id;
  return NODE_PORTS[kind].outputs.find((port) => port.id === id);
}

export function inputPort(kind: NodeKind, handleId: string | null | undefined) {
  const id = handleId ?? NODE_PORTS[kind].inputs[0]?.id;
  return NODE_PORTS[kind].inputs.find((port) => port.id === id);
}

/* ── Traversal ─────────────────────────────────────────────────────────── */

/** Every node reachable by following edges forward from `seeds`, seeds included. */
export function downstreamOf(edges: readonly CanvasEdge[], seeds: readonly string[]): Set<string> {
  const reached = new Set<string>(seeds);
  const queue = [...seeds];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    for (const edge of edges) {
      if (edge.source !== current || reached.has(edge.target)) continue;
      reached.add(edge.target);
      queue.push(edge.target);
    }
  }
  return reached;
}

/**
 * Kahn's algorithm over the nodes in `scope`, so a run always evaluates a
 * node after everything that feeds it. Any node left in a cycle is appended
 * rather than dropped — a run that silently skipped nodes would be worse than
 * one that ran them in an imperfect order.
 */
export function topologicalOrder(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  scope: ReadonlySet<string>,
): string[] {
  const inScope = nodes.filter((node) => scope.has(node.id)).map((node) => node.id);
  const indegree = new Map<string, number>(inScope.map((id) => [id, 0]));

  for (const edge of edges) {
    if (!scope.has(edge.source) || !scope.has(edge.target)) continue;
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const ready = inScope.filter((id) => (indegree.get(id) ?? 0) === 0);
  const ordered: string[] = [];

  while (ready.length > 0) {
    const id = ready.shift();
    if (id === undefined) break;
    ordered.push(id);
    for (const edge of edges) {
      if (edge.source !== id || !scope.has(edge.target)) continue;
      const next = (indegree.get(edge.target) ?? 0) - 1;
      indegree.set(edge.target, next);
      if (next === 0) ready.push(edge.target);
    }
  }

  for (const id of inScope) if (!ordered.includes(id)) ordered.push(id);
  return ordered;
}

export function incomingEdges(edges: readonly CanvasEdge[], nodeId: string): CanvasEdge[] {
  return edges.filter((edge) => edge.target === nodeId);
}

/**
 * Walks back from a node until it finds something that actually holds media.
 * A Compose node carries no asset of its own, so the Output node's export has
 * to reach through it to the video that fed it.
 */
export function upstreamAsset(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  nodeId: string,
  seen: Set<string> = new Set(),
): string | null {
  if (seen.has(nodeId)) return null;
  seen.add(nodeId);

  for (const edge of incomingEdges(edges, nodeId)) {
    const source = nodes.find((node) => node.id === edge.source);
    if (!source) continue;
    const asset = outputAssetOf(source);
    if (asset !== null) return asset;
    const deeper = upstreamAsset(nodes, edges, source.id, seen);
    if (deeper !== null) return deeper;
  }
  return null;
}

/** The nearest Prompt node feeding this one, as plain text. */
export function upstreamPromptText(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  nodeId: string,
): string {
  for (const edge of incomingEdges(edges, nodeId)) {
    const source = nodes.find((node) => node.id === edge.source);
    if (source?.kind === "prompt") return source.text;
  }
  return "";
}

/* ── Connection rules ──────────────────────────────────────────────────── */

export interface ConnectionAttempt {
  source: string;
  sourceHandle: string | null;
  target: string;
  targetHandle: string | null;
}

export type ConnectionResult =
  | { ok: true; edge: CanvasEdge; replaces: string[] }
  | { ok: false; problem: string };

/**
 * SPEC §8.4: incompatible connections are rejected "with a shake and a tooltip
 * explaining the mismatch". The message has to name both sides and say what to
 * do instead — "Invalid connection" teaches nobody anything (SPEC §12).
 */
export function resolveConnection(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  attempt: ConnectionAttempt,
): ConnectionResult {
  const source = nodes.find((node) => node.id === attempt.source);
  const target = nodes.find((node) => node.id === attempt.target);
  if (!source || !target) {
    return { ok: false, problem: "One end of that connection is no longer on the canvas." };
  }
  if (source.id === target.id) {
    return { ok: false, problem: "A node can't feed itself. Wire it into a different node." };
  }

  const from = outputPort(source.kind, attempt.sourceHandle);
  const to = inputPort(target.kind, attempt.targetHandle);
  if (!from) {
    return { ok: false, problem: `${NODE_LABEL[source.kind]} has nothing to send downstream.` };
  }
  if (!to) {
    return { ok: false, problem: `${NODE_LABEL[target.kind]} doesn't take an input.` };
  }

  if (from.type !== to.type) {
    const alternative = NODE_PORTS[target.kind].inputs.find((port) => port.type === from.type);
    const fix = alternative
      ? `Drop it on the ${alternative.label.toLowerCase()} port instead.`
      : `Send it through a node that turns ${PORT_NOUN[from.type]} into ${PORT_NOUN[to.type]}.`;
    return {
      ok: false,
      problem: `${PORT_NOUN[from.type]} out doesn't fit a ${PORT_NOUN[to.type]} input. ${fix}`,
    };
  }

  if (downstreamOf(edges, [target.id]).has(source.id)) {
    return {
      ok: false,
      problem: "That would loop the graph back on itself. A node can't depend on its own output.",
    };
  }

  // An input holds one connection. Replacing beats refusing: the user's intent
  // is obvious, and the old edge is one undo away.
  const replaces = edges
    .filter((edge) => edge.target === target.id && edge.targetHandle === to.id)
    .map((edge) => edge.id);

  return {
    ok: true,
    replaces,
    edge: {
      id: makeId("edge"),
      source: source.id,
      sourceHandle: from.id,
      target: target.id,
      targetHandle: to.id,
      type: from.type,
    },
  };
}

/* ── Creating and copying ──────────────────────────────────────────────── */

let sequence = 0;

export function makeId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export interface NodeDefaults {
  imageModelId: string;
  videoModelId: string;
  voiceModelId: string;
  actorId: string | null;
}

export function createNode(kind: NodeKind, at: Point, defaults: NodeDefaults): CanvasNode {
  const base = {
    id: makeId(`node-${kind}`),
    name: NODE_LABEL[kind],
    position: snapPoint(at),
    status: "idle" as NodeStatus,
    progress: 0,
  };

  switch (kind) {
    case "source":
      return { ...base, kind: "source", assetId: null };
    case "prompt":
      return { ...base, kind: "prompt", text: "", mentions: [] };
    case "image-gen":
      return {
        ...base,
        kind: "image-gen",
        modelId: defaults.imageModelId,
        size: "9:16",
        referenceAssetIds: [null, null, null, null],
        negativePrompt: "",
        outputAssetId: null,
      };
    case "video-gen":
      return {
        ...base,
        kind: "video-gen",
        modelId: defaults.videoModelId,
        startFrameAssetId: null,
        durationMs: 5_000,
        aspect: "9:16",
        outputAssetId: null,
      };
    case "voice":
      return {
        ...base,
        kind: "voice",
        actorId: defaults.actorId,
        script: "",
        speed: 1,
        outputAssetId: null,
      };
    case "compose":
      return { ...base, kind: "compose", sceneName: "New scene" };
    case "output":
      return { ...base, kind: "output", outputAssetId: null };
  }
}

/** Copies a selection, keeping the edges that live entirely inside it. */
export function copySubgraph(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  ids: readonly string[],
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const wanted = new Set(ids);
  return {
    nodes: nodes.filter((node) => wanted.has(node.id)),
    edges: edges.filter((edge) => wanted.has(edge.source) && wanted.has(edge.target)),
  };
}

/** Re-ids a copied subgraph and offsets it so the copy is visibly a copy. */
export function reinstate(
  subgraph: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] },
  offset: Point,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const remap = new Map<string, string>();
  const nodes = subgraph.nodes.map((node) => {
    const id = makeId(`node-${node.kind}`);
    remap.set(node.id, id);
    return withBase(node, {
      id,
      position: snapPoint({ x: node.position.x + offset.x, y: node.position.y + offset.y }),
      status: "idle",
      progress: 0,
    });
  });
  const edges = subgraph.edges.flatMap((edge) => {
    const source = remap.get(edge.source);
    const target = remap.get(edge.target);
    if (!source || !target) return [];
    return [{ ...edge, id: makeId("edge"), source, target }];
  });
  return { nodes, edges };
}

/* ── Field updates ─────────────────────────────────────────────────────── */

export interface BasePatch {
  id?: string;
  name?: string;
  position?: Point;
  status?: NodeStatus;
  progress?: number;
}

/**
 * The seven variants share `zNodeBase`, but a spread across a discriminated
 * union loses the discriminant, so the switch is written out. It is the price
 * of keeping the document model honest, and it is paid exactly once.
 */
export function withBase(node: CanvasNode, patch: BasePatch): CanvasNode {
  switch (node.kind) {
    case "source":
      return { ...node, ...patch };
    case "prompt":
      return { ...node, ...patch };
    case "image-gen":
      return { ...node, ...patch };
    case "video-gen":
      return { ...node, ...patch };
    case "voice":
      return { ...node, ...patch };
    case "compose":
      return { ...node, ...patch };
    case "output":
      return { ...node, ...patch };
  }
}

/** Nodes that can hold a generated result. */
export function withOutputAsset(node: CanvasNode, assetId: string | null): CanvasNode {
  switch (node.kind) {
    case "image-gen":
      return { ...node, outputAssetId: assetId };
    case "video-gen":
      return { ...node, outputAssetId: assetId };
    case "voice":
      return { ...node, outputAssetId: assetId };
    case "output":
      return { ...node, outputAssetId: assetId };
    default:
      return node;
  }
}

export function outputAssetOf(node: CanvasNode): string | null {
  switch (node.kind) {
    case "source":
      return node.assetId;
    case "image-gen":
    case "video-gen":
    case "voice":
    case "output":
      return node.outputAssetId;
    default:
      return null;
  }
}

/** True for the kinds that actually generate something when a branch runs. */
export function isGenerative(kind: NodeKind): boolean {
  return kind === "image-gen" || kind === "video-gen" || kind === "voice";
}

/* ── Prompt tokens ─────────────────────────────────────────────────────── */

/**
 * `CanvasNode` stores a prompt as plain text plus the asset ids it mentions;
 * `MentionInput` works in `PromptToken[]`. These two functions are the bridge,
 * and they round-trip: the token list rebuilt from a serialised prompt is
 * equal to the one that produced it, so the editor never resets the caret.
 */
export function promptToTokens(
  text: string,
  mentions: readonly string[],
  labelOf: (assetId: string) => string | undefined,
): PromptToken[] {
  const tokens: PromptToken[] = [];
  let rest = text;

  for (const assetId of mentions) {
    const label = labelOf(assetId);
    if (label === undefined) continue;
    const needle = `@${label}`;
    const at = rest.indexOf(needle);
    if (at === -1) continue;
    if (at > 0) tokens.push({ type: "text", value: rest.slice(0, at) });
    tokens.push({ type: "mention", assetId, label });
    rest = rest.slice(at + needle.length);
  }

  if (rest.length > 0) tokens.push({ type: "text", value: rest });
  return tokens;
}

export function tokensToPrompt(tokens: readonly PromptToken[]): {
  text: string;
  mentions: string[];
} {
  return {
    text: promptToPlainText(tokens),
    mentions: tokens.flatMap((token) => (token.type === "mention" ? [token.assetId] : [])),
  };
}
