import type { Asset } from "@/lib/schemas";
import { MEDIA_AUDIO, MEDIA_CLIPS, MEDIA_PORTRAITS, MEDIA_PRODUCTS } from "./media-manifest";
import { ago, rng } from "./seed";

/**
 * SPEC §9: 60 assets. 24 video clips, 16 audio beds, 16 portraits and 4
 * product stills, all pointing at real generated files so every grid, picker
 * and drag source in the app renders actual media.
 */

const CLIP_NAMES = [
  "Serum pour — close",
  "Morning routine — wide",
  "Texture swatch",
  "Bottle on marble",
  "Hands applying",
  "Before and after wipe",
  "Studio spin",
  "Gym floor pan",
  "Shaker mix",
  "Unboxing reveal",
  "Founder to camera",
  "Product on shelf",
  "Sunrise window",
  "Bathroom counter",
  "Dropper detail",
  "Packaging fold",
  "Skin glow macro",
  "Gift wrap",
  "Kitchen pour",
  "Bag drop",
  "Label turn",
  "Candle flicker",
  "Lash brush",
  "Coffee steam",
] as const;

const AUDIO_NAMES = [
  "Soft pad — warm",
  "Upbeat pulse",
  "Low hum bed",
  "Bright lift",
  "Slow build",
  "Calm loop",
  "Percussive tick",
  "Airy drift",
  "Focus bed",
  "Night drive",
  "Gentle rise",
  "Room tone",
  "Sunny loop",
  "Deep swell",
  "Light shimmer",
  "Steady bed",
] as const;

const PORTRAIT_NAMES = [
  "Maya R. — portrait",
  "Devon K. — portrait",
  "Priya S. — portrait",
  "Noah B. — portrait",
  "Lena M. — portrait",
  "Theo A. — portrait",
  "Ines V. — portrait",
  "Rowan T. — portrait",
  "Sana Q. — portrait",
  "Elias F. — portrait",
  "Nora W. — portrait",
  "Kai H. — portrait",
  "Amara D. — portrait",
  "Julian P. — portrait",
  "Freya L. — portrait",
  "Omar N. — portrait",
] as const;

const PRODUCT_NAMES = [
  "Hydrating serum — hero",
  "Creatine gummies — jar",
  "Sleep tincture — bottle",
  "Lash serum — tube",
] as const;

const CLIP_TAGS = [
  ["product", "close-up"],
  ["lifestyle", "morning"],
  ["texture", "macro"],
  ["product", "studio"],
  ["hands", "demo"],
  ["before-after", "demo"],
  ["studio", "spin"],
  ["gym", "lifestyle"],
  ["demo", "kitchen"],
  ["unboxing", "hands"],
  ["ugc", "talking-head"],
  ["retail", "shelf"],
] as const;

function makeVideoAssets(): Asset[] {
  return MEDIA_CLIPS.map((clip, index) => ({
    id: `asset-video-${String(index + 1).padStart(2, "0")}`,
    name: CLIP_NAMES[index] ?? `Clip ${index + 1}`,
    kind: "video" as const,
    src: clip.src,
    poster: clip.poster,
    sprite: clip.sprite,
    spriteFrames: clip.spriteFrames,
    peaks: null,
    durationMs: clip.durationMs,
    width: clip.width,
    height: clip.height,
    aspect: "9:16" as const,
    sizeBytes: rng.int(180_000, 940_000),
    tags: [...(CLIP_TAGS[index % CLIP_TAGS.length] ?? ["product"])],
    favorite: index % 7 === 0,
    source: index % 3 === 0 ? ("generated" as const) : ("upload" as const),
    createdAt: ago(index * 6 + 2, "hour"),
  }));
}

function makeAudioAssets(): Asset[] {
  return MEDIA_AUDIO.map((bed, index) => ({
    id: `asset-audio-${String(index + 1).padStart(2, "0")}`,
    name: AUDIO_NAMES[index] ?? `Bed ${index + 1}`,
    kind: "audio" as const,
    src: bed.src,
    poster: MEDIA_CLIPS[index % MEDIA_CLIPS.length]?.poster ?? "",
    sprite: null,
    spriteFrames: 0,
    peaks: [...bed.peaks],
    durationMs: bed.durationMs,
    width: 0,
    height: 0,
    aspect: "9:16" as const,
    sizeBytes: rng.int(60_000, 220_000),
    tags: ["audio", "bed"],
    favorite: index === 3,
    source: "upload" as const,
    createdAt: ago(index * 2 + 1, "day"),
  }));
}

function makePortraitAssets(): Asset[] {
  return MEDIA_PORTRAITS.map((still, index) => ({
    id: `asset-portrait-${String(index + 1).padStart(2, "0")}`,
    name: PORTRAIT_NAMES[index] ?? `Portrait ${index + 1}`,
    kind: "image" as const,
    src: still.src,
    poster: still.src,
    sprite: null,
    spriteFrames: 0,
    peaks: null,
    durationMs: 0,
    width: 400,
    height: 400,
    aspect: "1:1" as const,
    sizeBytes: rng.int(24_000, 70_000),
    tags: ["actor", "portrait"],
    favorite: false,
    source: "generated" as const,
    createdAt: ago(index + 1, "week"),
  }));
}

function makeProductAssets(): Asset[] {
  return MEDIA_PRODUCTS.slice(0, 4).map((still, index) => ({
    id: `asset-product-${String(index + 1).padStart(2, "0")}`,
    name: PRODUCT_NAMES[index] ?? `Product ${index + 1}`,
    kind: "image" as const,
    src: still.src,
    poster: still.src,
    sprite: null,
    spriteFrames: 0,
    peaks: null,
    durationMs: 0,
    width: 800,
    height: 800,
    aspect: "1:1" as const,
    sizeBytes: rng.int(40_000, 120_000),
    tags: ["brand", "product"],
    favorite: index === 0,
    source: "brand" as const,
    createdAt: ago(index + 2, "month"),
  }));
}

export const ASSETS: readonly Asset[] = [
  ...makeVideoAssets(),
  ...makeAudioAssets(),
  ...makePortraitAssets(),
  ...makeProductAssets(),
];

export const ASSET_BY_ID: ReadonlyMap<string, Asset> = new Map(
  ASSETS.map((asset) => [asset.id, asset]),
);

export const VIDEO_ASSETS = ASSETS.filter((asset) => asset.kind === "video");
export const AUDIO_ASSETS = ASSETS.filter((asset) => asset.kind === "audio");
export const PORTRAIT_ASSETS = ASSETS.filter((asset) => asset.id.startsWith("asset-portrait"));
export const PRODUCT_ASSETS = ASSETS.filter((asset) => asset.id.startsWith("asset-product"));
