import type {
  BulkDoc,
  BulkRow,
  CanvasDoc,
  Clip,
  ProjectDocument,
  Slide,
  SlideLayer,
  SlideshowDoc,
  TimelineDoc,
  Track,
} from "@/lib/schemas";
import { AUDIO_ASSETS, PRODUCT_ASSETS, VIDEO_ASSETS } from "./assets";
import { ACTORS } from "./catalog";
import { rng } from "./seed";

/**
 * A populated document for every editor surface, so no editor ever opens on an
 * empty canvas during development — and so the empty states are a deliberate
 * choice rather than the only thing anyone has ever seen.
 */

/* ── Timeline ──────────────────────────────────────────────────────────── */

const SCENE_CUTS_MS = [0, 1_780, 3_240, 5_600, 7_120, 9_480, 11_020, 13_400, 15_000];

const CAPTIONS: ReadonlyArray<{ content: string; startMs: number; durationMs: number }> = [
  { content: "I stopped buying serums for 6 months", startMs: 240, durationMs: 2_360 },
  { content: "then I found one that actually absorbs", startMs: 2_700, durationMs: 2_700 },
  { content: "no pilling under makeup", startMs: 5_600, durationMs: 2_500 },
  { content: "week 1 vs week 8", startMs: 8_300, durationMs: 2_700 },
  { content: "link in bio", startMs: 12_800, durationMs: 2_200 },
];

const DEFAULT_TEXT_STYLE = {
  fontFamily: "Inter",
  fontSize: 44,
  fontWeight: "bold" as const,
  color: "#FFFFFF",
  outlineColor: "#0B0C0E",
  outlineWidth: 3,
  align: "center" as const,
  x: 0,
  y: 240,
  rotation: 0,
  opacity: 1,
  animateIn: "rise" as const,
  animateOut: "fade" as const,
};

function videoClips(): Clip[] {
  return SCENE_CUTS_MS.slice(0, -1).map((startMs, index) => {
    const asset = VIDEO_ASSETS[index % VIDEO_ASSETS.length];
    const endMs = SCENE_CUTS_MS[index + 1] ?? startMs + 1_500;
    return {
      kind: "video",
      id: `clip-video-${index + 1}`,
      startMs,
      durationMs: endMs - startMs,
      trimInMs: 0,
      trimOutMs: 0,
      label: asset?.name ?? `Scene ${index + 1}`,
      assetId: asset?.id ?? "",
    };
  });
}

function captionClips(): Clip[] {
  return CAPTIONS.map((caption, index) => ({
    kind: "text",
    id: `clip-text-${index + 1}`,
    startMs: caption.startMs,
    durationMs: caption.durationMs,
    trimInMs: 0,
    trimOutMs: 0,
    label: caption.content,
    content: caption.content,
    style: { ...DEFAULT_TEXT_STYLE, y: index === 3 ? 900 : 240 },
  }));
}

const TIMELINE_TRACKS: Track[] = [
  {
    id: "track-video",
    kind: "video",
    name: "Scenes",
    visible: true,
    locked: false,
    muted: false,
    clips: videoClips(),
  },
  {
    id: "track-text",
    kind: "text",
    name: "Captions",
    visible: true,
    locked: false,
    muted: false,
    clips: captionClips(),
  },
  {
    id: "track-overlay",
    kind: "overlay",
    name: "Product callout",
    visible: true,
    locked: false,
    muted: false,
    clips: [
      {
        kind: "overlay",
        id: "clip-overlay-1",
        startMs: 9_600,
        durationMs: 4_100,
        trimInMs: 0,
        trimOutMs: 0,
        label: "Hydrating serum — hero",
        assetId: PRODUCT_ASSETS[0]?.id ?? "",
        opacity: 0.95,
      },
    ],
  },
  {
    id: "track-audio",
    kind: "audio",
    name: "Music bed",
    visible: true,
    locked: false,
    muted: false,
    clips: [
      {
        kind: "audio",
        id: "clip-audio-1",
        startMs: 0,
        durationMs: 15_000,
        trimInMs: 0,
        trimOutMs: 0,
        label: AUDIO_ASSETS[0]?.name ?? "Music bed",
        assetId: AUDIO_ASSETS[0]?.id ?? "",
        gain: 0.45,
      },
    ],
  },
];

export const TIMELINE_DOC: TimelineDoc = {
  projectId: "proj-serum-hooks",
  aspect: "9:16",
  durationMs: 15_000,
  fps: 30,
  tracks: TIMELINE_TRACKS,
};

/* ── Canvas ────────────────────────────────────────────────────────────── */

export const CANVAS_DOC: CanvasDoc = {
  projectId: "proj-retinol-graph",
  nodes: [
    {
      kind: "source",
      id: "node-source",
      name: "Product still",
      position: { x: 0, y: 120 },
      status: "ready",
      progress: 100,
      assetId: PRODUCT_ASSETS[0]?.id ?? null,
    },
    {
      kind: "prompt",
      id: "node-prompt",
      name: "Angle — texture",
      position: { x: 0, y: 400 },
      status: "idle",
      progress: 0,
      text: "Macro of the serum spreading across a glass slide, warm side light",
      mentions: [],
    },
    {
      kind: "image-gen",
      id: "node-image",
      name: "Start frame",
      position: { x: 360, y: 200 },
      status: "ready",
      progress: 100,
      modelId: "model-frame-xl",
      size: "9:16",
      referenceAssetIds: [PRODUCT_ASSETS[0]?.id ?? null, null, null, null],
      negativePrompt: "text, watermark, hands",
      outputAssetId: VIDEO_ASSETS[2]?.id ?? null,
    },
    {
      kind: "video-gen",
      id: "node-video",
      name: "Motion pass",
      position: { x: 720, y: 160 },
      status: "running",
      progress: 48,
      modelId: "model-motion-2",
      startFrameAssetId: VIDEO_ASSETS[2]?.id ?? null,
      durationMs: 10_000,
      aspect: "9:16",
      outputAssetId: null,
    },
    {
      kind: "voice",
      id: "node-voice",
      name: "Read — Maya",
      position: { x: 720, y: 480 },
      status: "ready",
      progress: 100,
      actorId: ACTORS[0]?.id ?? null,
      script: "It absorbs in about ten seconds, and nothing pills over it.",
      speed: 1,
      outputAssetId: AUDIO_ASSETS[2]?.id ?? null,
    },
    {
      kind: "compose",
      id: "node-compose",
      name: "Scene 1",
      position: { x: 1_080, y: 300 },
      status: "idle",
      progress: 0,
      sceneName: "Texture open",
    },
    {
      kind: "output",
      id: "node-output",
      name: "Export",
      position: { x: 1_400, y: 300 },
      status: "idle",
      progress: 0,
      outputAssetId: null,
    },
  ],
  edges: [
    { id: "edge-1", source: "node-source", sourceHandle: "out", target: "node-image", targetHandle: "ref", type: "image" },
    { id: "edge-2", source: "node-prompt", sourceHandle: "out", target: "node-image", targetHandle: "prompt", type: "text" },
    { id: "edge-3", source: "node-image", sourceHandle: "out", target: "node-video", targetHandle: "start", type: "image" },
    { id: "edge-4", source: "node-video", sourceHandle: "out", target: "node-compose", targetHandle: "video", type: "video" },
    { id: "edge-5", source: "node-voice", sourceHandle: "out", target: "node-compose", targetHandle: "audio", type: "audio" },
    { id: "edge-6", source: "node-compose", sourceHandle: "out", target: "node-output", targetHandle: "in", type: "scene" },
  ],
};

/* ── Slideshow ─────────────────────────────────────────────────────────── */

function slide(
  id: string,
  name: string,
  heading: string,
  body: string,
  bgIndex: number,
): Slide {
  const layers: SlideLayer[] = [
    {
      kind: "image",
      id: `${id}-image`,
      name: "Background",
      transform: { x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 1 },
      assetId: VIDEO_ASSETS[bgIndex % VIDEO_ASSETS.length]?.id ?? "",
      fit: "cover",
    },
    {
      kind: "text",
      id: `${id}-heading`,
      name: "Heading",
      transform: { x: 90, y: 560, width: 900, height: 320, rotation: 0, opacity: 1 },
      content: heading,
      textStyle: "filled",
      fontFamily: "Inter",
      fontSize: 96,
      fontWeight: "bold",
      color: "#FFFFFF",
      outlineColor: "#0B0C0E",
      outlineWidth: 0,
      align: "center",
    },
    {
      kind: "text",
      id: `${id}-body`,
      name: "Body",
      transform: { x: 140, y: 940, width: 800, height: 200, rotation: 0, opacity: 1 },
      content: body,
      textStyle: "shadowed",
      fontFamily: "Inter",
      fontSize: 48,
      fontWeight: "semibold",
      color: "#F5EFE6",
      outlineColor: "#0B0C0E",
      outlineWidth: 0,
      align: "center",
    },
  ];
  return { id, name, backgroundAssetId: null, backgroundColor: "#0B0C0E", layers };
}

const BASE_SLIDES: Slide[] = [
  slide("slide-1", "Hook", "30% off everything", "Ends Sunday night", 3),
  slide("slide-2", "Proof", "Our best-selling serum", "4,200 reviews, 4.8 average", 0),
  slide("slide-3", "Bundle", "Build a routine", "Save more when you stack three", 16),
  slide("slide-4", "Urgency", "Sizes are going fast", "Restock is six weeks out", 11),
  slide("slide-5", "CTA", "Shop the sale", "Link in bio", 20),
];

export const SLIDESHOW_DOC: SlideshowDoc = {
  projectId: "proj-winter-sale",
  aspect: "9:16",
  stylePreset: "Bold sans, centred",
  templateName: "Gift edit",
  templateVariation: "Variation A",
  slides: BASE_SLIDES,
  variations: [
    {
      id: "variation-b",
      name: "Variation B — price-led",
      slides: [
        slide("slide-b1", "Hook", "Everything under $40", "Ends Sunday night", 5),
        slide("slide-b2", "Proof", "The serum people rebuy", "4,200 reviews", 1),
        slide("slide-b3", "CTA", "Shop the sale", "Link in bio", 21),
      ],
    },
    {
      id: "variation-c",
      name: "Variation C — gift-led",
      slides: [
        slide("slide-c1", "Hook", "Sorted for the gift list", "30% off through Sunday", 17),
        slide("slide-c2", "Bundle", "Three picks under $60", "Wrapped and ready", 9),
        slide("slide-c3", "CTA", "Shop gifts", "Link in bio", 13),
      ],
    },
  ],
};

/* ── Bulk editor ───────────────────────────────────────────────────────── */

const HOOKS = [
  "I stopped buying serums for 6 months",
  "This is why your serum pills under makeup",
  "Three things I check before buying skincare",
  "My esthetician told me to stop doing this",
  "Week 1 vs week 8, same lighting",
  "The only step I never skip",
] as const;

const BODIES = [
  "It absorbs in about ten seconds and nothing pills over it.",
  "Hyaluronic acid at a concentration that actually holds water.",
  "One pump, damp skin, morning only. That's the whole routine.",
  "No fragrance, no essential oils, no sting around the eyes.",
  "I stacked it under SPF for eight weeks and took the same photo every Monday.",
  "It costs less per use than the one I was buying before.",
] as const;

const CTAS = [
  "Shop the serum",
  "Link in bio",
  "Get 20% off your first order",
  "See the full routine",
  "Read the ingredient list",
] as const;

const BULK_STATUSES: ReadonlyArray<BulkRow["status"]> = [
  "ready",
  "ready",
  "ready",
  "generating",
  "queued",
  "draft",
  "failed",
];

export const BULK_DOC: BulkDoc = {
  projectId: "proj-sleep-ugc",
  templateName: "Honest review",
  columns: [
    { id: "col-hook", key: "hook", label: "Hook", kind: "text", width: 280 },
    { id: "col-body", key: "body", label: "Body copy", kind: "text", width: 340 },
    { id: "col-cta", key: "cta", label: "CTA", kind: "text", width: 200 },
    { id: "col-product", key: "product", label: "Product", kind: "text", width: 180 },
    { id: "col-productImage", key: "productImage", label: "Product image", kind: "media", width: 160 },
    { id: "col-actor", key: "actor", label: "Actor", kind: "actor", width: 160 },
    { id: "col-voice", key: "voice", label: "Voice", kind: "voice", width: 160 },
    { id: "col-music", key: "music", label: "Music", kind: "music", width: 160 },
    { id: "col-status", key: "status", label: "Status", kind: "status", width: 140 },
  ],
  rows: Array.from({ length: 30 }, (_, index): BulkRow => {
    const status = BULK_STATUSES[index % BULK_STATUSES.length] ?? "draft";
    const actor = ACTORS[index % ACTORS.length];
    return {
      id: `row-${String(index + 1).padStart(2, "0")}`,
      cells: {
        hook: HOOKS[index % HOOKS.length] ?? "",
        body: BODIES[index % BODIES.length] ?? "",
        cta: CTAS[index % CTAS.length] ?? "",
        product: "Hydrating serum",
        productImage: PRODUCT_ASSETS[index % PRODUCT_ASSETS.length]?.id ?? "",
        actor: actor?.id ?? "",
        voice: actor?.voiceName ?? "",
        music: AUDIO_ASSETS[index % AUDIO_ASSETS.length]?.name ?? "",
      },
      status,
      progress: status === "generating" ? rng.int(15, 85) : status === "ready" ? 100 : 0,
      outputAssetId: status === "ready" ? (VIDEO_ASSETS[index % VIDEO_ASSETS.length]?.id ?? null) : null,
      error:
        status === "failed"
          ? "The actor in this row doesn't support Portuguese. Pick another actor or switch the voice to English."
          : null,
    };
  }),
};

/* ── Per-project resolution ────────────────────────────────────────────── */

export function documentFor(projectId: string): ProjectDocument {
  return {
    timeline: projectId === "proj-serum-hooks" ? TIMELINE_DOC : { ...TIMELINE_DOC, projectId },
    canvas: projectId === "proj-retinol-graph" ? CANVAS_DOC : { ...CANVAS_DOC, projectId },
    slideshow: projectId === "proj-winter-sale" ? SLIDESHOW_DOC : { ...SLIDESHOW_DOC, projectId },
    bulk: projectId === "proj-sleep-ugc" ? BULK_DOC : { ...BULK_DOC, projectId },
  };
}
