import { z } from "zod";
import { zAspectRatio, zId } from "./common";

/**
 * The four editor document shapes.
 *
 * These exist in Phase 1, before any editor is written, because four agents
 * building four surfaces in parallel would otherwise invent four incompatible
 * models and the integration pass would be a data migration rather than a
 * design review. Each agent owns the *behaviour* of its editor; none owns the
 * *shape* of its document.
 */

/* ── Timeline (SPEC §8.5) ──────────────────────────────────────────────── */

export const zTrackKind = z.enum(["video", "audio", "text", "overlay"]);
export type TrackKind = z.infer<typeof zTrackKind>;

export const TRACK_COLOR_VAR: Record<TrackKind, string> = {
  video: "var(--color-track-video)",
  audio: "var(--color-track-audio)",
  text: "var(--color-track-text)",
  overlay: "var(--color-track-overlay)",
};

const zClipBase = z.object({
  id: zId,
  /** Position on the timeline, ms from project start. */
  startMs: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
  /** Trim handles, ms into the source media. */
  trimInMs: z.number().int().nonnegative(),
  trimOutMs: z.number().int().nonnegative(),
  label: z.string(),
});

export const zTextClipStyle = z.object({
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  fontWeight: z.enum(["normal", "semibold", "bold"]),
  color: z.string(),
  outlineColor: z.string(),
  outlineWidth: z.number().nonnegative(),
  align: z.enum(["left", "center", "right"]),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
  animateIn: z.enum(["none", "fade", "rise", "pop"]),
  animateOut: z.enum(["none", "fade", "sink"]),
});
export type TextClipStyle = z.infer<typeof zTextClipStyle>;

export const zClip = z.discriminatedUnion("kind", [
  zClipBase.extend({ kind: z.literal("video"), assetId: zId }),
  zClipBase.extend({ kind: z.literal("audio"), assetId: zId, gain: z.number().min(0).max(2) }),
  zClipBase.extend({ kind: z.literal("text"), content: z.string(), style: zTextClipStyle }),
  zClipBase.extend({ kind: z.literal("overlay"), assetId: zId, opacity: z.number().min(0).max(1) }),
]);
export type Clip = z.infer<typeof zClip>;

export const zTrack = z.object({
  id: zId,
  kind: zTrackKind,
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  muted: z.boolean(),
  clips: z.array(zClip),
});
export type Track = z.infer<typeof zTrack>;

export const zTimelineDoc = z.object({
  projectId: zId,
  aspect: zAspectRatio,
  durationMs: z.number().int().positive(),
  fps: z.number().int().positive(),
  tracks: z.array(zTrack),
});
export type TimelineDoc = z.infer<typeof zTimelineDoc>;

/* ── Node canvas (SPEC §8.4) ───────────────────────────────────────────── */

export const zPortType = z.enum(["image", "video", "audio", "text", "scene"]);
export type PortType = z.infer<typeof zPortType>;

export const PORT_COLOR_VAR: Record<PortType, string> = {
  image: "var(--color-brand-500)",
  video: "var(--color-track-video)",
  audio: "var(--color-track-audio)",
  text: "var(--color-track-text)",
  scene: "var(--color-track-overlay)",
};

export const zNodeKind = z.enum([
  "source",
  "prompt",
  "image-gen",
  "video-gen",
  "voice",
  "compose",
  "output",
]);
export type NodeKind = z.infer<typeof zNodeKind>;

export const NODE_LABEL: Record<NodeKind, string> = {
  source: "Source",
  prompt: "Prompt",
  "image-gen": "Image",
  "video-gen": "Video",
  voice: "Voice",
  compose: "Compose",
  output: "Output",
};

export const zNodeStatus = z.enum(["idle", "queued", "running", "ready", "failed"]);
export type NodeStatus = z.infer<typeof zNodeStatus>;

const zNodeBase = z.object({
  id: zId,
  name: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  status: zNodeStatus,
  progress: z.number().min(0).max(100),
});

export const zCanvasNode = z.discriminatedUnion("kind", [
  zNodeBase.extend({ kind: z.literal("source"), assetId: zId.nullable() }),
  zNodeBase.extend({ kind: z.literal("prompt"), text: z.string(), mentions: z.array(zId) }),
  zNodeBase.extend({
    kind: z.literal("image-gen"),
    modelId: zId,
    size: zAspectRatio,
    referenceAssetIds: z.array(zId.nullable()).length(4),
    negativePrompt: z.string(),
    outputAssetId: zId.nullable(),
  }),
  zNodeBase.extend({
    kind: z.literal("video-gen"),
    modelId: zId,
    startFrameAssetId: zId.nullable(),
    durationMs: z.number().int().positive(),
    aspect: zAspectRatio,
    outputAssetId: zId.nullable(),
  }),
  zNodeBase.extend({
    kind: z.literal("voice"),
    actorId: zId.nullable(),
    script: z.string(),
    speed: z.number().min(0.5).max(2),
    outputAssetId: zId.nullable(),
  }),
  zNodeBase.extend({ kind: z.literal("compose"), sceneName: z.string() }),
  zNodeBase.extend({ kind: z.literal("output"), outputAssetId: zId.nullable() }),
]);
export type CanvasNode = z.infer<typeof zCanvasNode>;

export const zCanvasEdge = z.object({
  id: zId,
  source: zId,
  sourceHandle: z.string(),
  target: zId,
  targetHandle: z.string(),
  type: zPortType,
});
export type CanvasEdge = z.infer<typeof zCanvasEdge>;

export const zCanvasDoc = z.object({
  projectId: zId,
  nodes: z.array(zCanvasNode),
  edges: z.array(zCanvasEdge),
});
export type CanvasDoc = z.infer<typeof zCanvasDoc>;

/** Which port types a node accepts and emits. Enforced at connect time. */
export const NODE_PORTS: Record<
  NodeKind,
  { inputs: ReadonlyArray<{ id: string; type: PortType; label: string }>; outputs: ReadonlyArray<{ id: string; type: PortType; label: string }> }
> = {
  source: { inputs: [], outputs: [{ id: "out", type: "image", label: "Asset" }] },
  prompt: { inputs: [], outputs: [{ id: "out", type: "text", label: "Text" }] },
  "image-gen": {
    inputs: [
      { id: "prompt", type: "text", label: "Prompt" },
      { id: "ref", type: "image", label: "Reference" },
    ],
    outputs: [{ id: "out", type: "image", label: "Image" }],
  },
  "video-gen": {
    inputs: [
      { id: "prompt", type: "text", label: "Prompt" },
      { id: "start", type: "image", label: "Start frame" },
    ],
    outputs: [{ id: "out", type: "video", label: "Video" }],
  },
  voice: {
    inputs: [{ id: "script", type: "text", label: "Script" }],
    outputs: [{ id: "out", type: "audio", label: "Voice" }],
  },
  compose: {
    inputs: [
      { id: "video", type: "video", label: "Video" },
      { id: "audio", type: "audio", label: "Audio" },
    ],
    outputs: [{ id: "out", type: "scene", label: "Scene" }],
  },
  output: { inputs: [{ id: "in", type: "scene", label: "Scene" }], outputs: [] },
};

/* ── Slideshow (SPEC §8.6) ─────────────────────────────────────────────── */

export const zTextStyleName = z.enum(["filled", "outlined", "shadowed", "highlighted"]);
export type TextStyleName = z.infer<typeof zTextStyleName>;

export const zLayerTransform = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
});
export type LayerTransform = z.infer<typeof zLayerTransform>;

export const zSlideLayer = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    id: zId,
    name: z.string(),
    transform: zLayerTransform,
    content: z.string(),
    textStyle: zTextStyleName,
    fontFamily: z.string(),
    fontSize: z.number().positive(),
    fontWeight: z.enum(["normal", "semibold", "bold"]),
    color: z.string(),
    outlineColor: z.string(),
    outlineWidth: z.number().nonnegative(),
    align: z.enum(["left", "center", "right"]),
  }),
  z.object({
    kind: z.literal("image"),
    id: zId,
    name: z.string(),
    transform: zLayerTransform,
    assetId: zId,
    fit: z.enum(["cover", "contain"]),
  }),
  z.object({
    kind: z.literal("shape"),
    id: zId,
    name: z.string(),
    transform: zLayerTransform,
    fill: z.string(),
    radius: z.number().nonnegative(),
  }),
]);
export type SlideLayer = z.infer<typeof zSlideLayer>;

export const zSlide = z.object({
  id: zId,
  name: z.string(),
  backgroundAssetId: zId.nullable(),
  backgroundColor: z.string(),
  layers: z.array(zSlideLayer),
});
export type Slide = z.infer<typeof zSlide>;

export const zSlideshowVariation = z.object({
  id: zId,
  name: z.string(),
  slides: z.array(zSlide),
});
export type SlideshowVariation = z.infer<typeof zSlideshowVariation>;

export const zSlideshowDoc = z.object({
  projectId: zId,
  aspect: zAspectRatio,
  stylePreset: z.string(),
  templateName: z.string(),
  templateVariation: z.string(),
  slides: z.array(zSlide),
  variations: z.array(zSlideshowVariation),
});
export type SlideshowDoc = z.infer<typeof zSlideshowDoc>;

/* ── Bulk editor (SPEC §8.7) ───────────────────────────────────────────── */

export const zBulkColumnKind = z.enum(["text", "media", "actor", "voice", "music", "status"]);
export type BulkColumnKind = z.infer<typeof zBulkColumnKind>;

export const zBulkColumn = z.object({
  id: zId,
  key: z.string(),
  label: z.string(),
  kind: zBulkColumnKind,
  width: z.number().int().positive(),
});
export type BulkColumn = z.infer<typeof zBulkColumn>;

export const zBulkRowStatus = z.enum(["draft", "queued", "generating", "ready", "failed"]);
export type BulkRowStatus = z.infer<typeof zBulkRowStatus>;

export const zBulkRow = z.object({
  id: zId,
  /** Keyed by column key. Media cells hold an asset id, text cells hold text. */
  cells: z.record(z.string(), z.string()),
  status: zBulkRowStatus,
  progress: z.number().min(0).max(100),
  outputAssetId: zId.nullable(),
  error: z.string().nullable(),
});
export type BulkRow = z.infer<typeof zBulkRow>;

export const zBulkDoc = z.object({
  projectId: zId,
  templateName: z.string(),
  columns: z.array(zBulkColumn),
  rows: z.array(zBulkRow),
});
export type BulkDoc = z.infer<typeof zBulkDoc>;

/* ── The union a project resolves to ───────────────────────────────────── */

export const zProjectDocument = z.object({
  timeline: zTimelineDoc.nullable(),
  canvas: zCanvasDoc.nullable(),
  slideshow: zSlideshowDoc.nullable(),
  bulk: zBulkDoc.nullable(),
});
export type ProjectDocument = z.infer<typeof zProjectDocument>;
