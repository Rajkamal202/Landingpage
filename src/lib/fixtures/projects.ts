import type { Platform, Project } from "@/lib/schemas";
import { VIDEO_ASSETS } from "./assets";
import { ago } from "./seed";

/**
 * SPEC §9: 12 projects. Names are the ones a performance marketer would
 * actually type — a project called "Untitled 3" tells you nothing about
 * whether the app is usable at volume.
 */

interface Seed {
  id: string;
  name: string;
  kind: Project["kind"];
  aspect: Project["aspect"];
  durationMs: number;
  thumb: number;
  variationCount: number;
  updated: [number, "minute" | "hour" | "day" | "week"];
  created: [number, "day" | "week" | "month"];
  clonedFrom?: { platform: Platform; url: string; handle: string };
}

const SEEDS: readonly Seed[] = [
  {
    id: "proj-serum-hooks",
    name: "Hydrating serum — hook tests",
    kind: "video",
    aspect: "9:16",
    durationMs: 14_000,
    thumb: 0,
    variationCount: 8,
    updated: [24, "minute"],
    created: [6, "day"],
    clonedFrom: {
      platform: "tiktok",
      url: "https://www.tiktok.com/@glowlab.co/video/7318842095512",
      handle: "@glowlab.co",
    },
  },
  {
    id: "proj-creatine-launch",
    name: "Creatine gummies launch",
    kind: "video",
    aspect: "9:16",
    durationMs: 21_000,
    thumb: 8,
    variationCount: 12,
    updated: [3, "hour"],
    created: [11, "day"],
  },
  {
    id: "proj-winter-sale",
    name: "Winter sale slideshow",
    kind: "slideshow",
    aspect: "9:16",
    durationMs: 18_000,
    thumb: 17,
    variationCount: 6,
    updated: [7, "hour"],
    created: [3, "week"],
    clonedFrom: {
      platform: "instagram",
      url: "https://www.instagram.com/reel/CzQ8n2ApL4s/",
      handle: "@northfold",
    },
  },
  {
    id: "proj-founder-story",
    name: "Founder story — 3 cuts",
    kind: "video",
    aspect: "9:16",
    durationMs: 32_000,
    thumb: 10,
    variationCount: 3,
    updated: [1, "day"],
    created: [2, "week"],
  },
  {
    id: "proj-sleep-ugc",
    name: "Sleep tincture UGC batch",
    kind: "video",
    aspect: "9:16",
    durationMs: 16_500,
    thumb: 14,
    variationCount: 30,
    updated: [2, "day"],
    created: [3, "week"],
  },
  {
    id: "proj-retinol-graph",
    name: "Ad graph — retinol angles",
    kind: "canvas",
    aspect: "9:16",
    durationMs: 0,
    thumb: 2,
    variationCount: 0,
    updated: [2, "day"],
    created: [4, "week"],
  },
  {
    id: "proj-protein-taste",
    name: "Protein bar taste test",
    kind: "video",
    aspect: "9:16",
    durationMs: 12_000,
    thumb: 18,
    variationCount: 5,
    updated: [4, "day"],
    created: [5, "week"],
  },
  {
    id: "proj-routine-carousel",
    name: "Skincare routine carousel",
    kind: "slideshow",
    aspect: "4:5",
    durationMs: 0,
    thumb: 16,
    variationCount: 9,
    updated: [5, "day"],
    created: [6, "week"],
  },
  {
    id: "proj-gym-onboarding",
    name: "Gym app onboarding ads",
    kind: "video",
    aspect: "9:16",
    durationMs: 19_000,
    thumb: 7,
    variationCount: 14,
    updated: [1, "week"],
    created: [2, "month"],
    clonedFrom: {
      platform: "meta-ads",
      url: "https://www.facebook.com/ads/library/?id=902471338845",
      handle: "Rep & Set",
    },
  },
  {
    id: "proj-candle-guide",
    name: "Candle gift guide",
    kind: "slideshow",
    aspect: "9:16",
    durationMs: 0,
    thumb: 21,
    variationCount: 4,
    updated: [2, "week"],
    created: [2, "month"],
  },
  {
    id: "proj-referral-march",
    name: "Referral push — March",
    kind: "video",
    aspect: "9:16",
    durationMs: 9_000,
    thumb: 19,
    variationCount: 7,
    updated: [3, "week"],
    created: [3, "month"],
  },
  {
    id: "proj-lash-before-after",
    name: "Lash serum before/after",
    kind: "video",
    aspect: "9:16",
    durationMs: 15_000,
    thumb: 22,
    variationCount: 11,
    updated: [4, "week"],
    created: [3, "month"],
    clonedFrom: {
      platform: "youtube",
      url: "https://www.youtube.com/shorts/8Qk2vRt1nZo",
      handle: "@lashroom",
    },
  },
];

export const PROJECTS: readonly Project[] = SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  kind: seed.kind,
  thumbnailAssetId: VIDEO_ASSETS[seed.thumb]?.id ?? null,
  aspect: seed.aspect,
  durationMs: seed.durationMs,
  clonedFrom: seed.clonedFrom ?? null,
  variationCount: seed.variationCount,
  createdAt: ago(seed.created[0], seed.created[1]),
  updatedAt: ago(seed.updated[0], seed.updated[1]),
}));

export const PROJECT_BY_ID: ReadonlyMap<string, Project> = new Map(
  PROJECTS.map((project) => [project.id, project]),
);
