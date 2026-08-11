import type { Model } from "@/lib/schemas";

/**
 * Original model names. No third-party model or company name appears anywhere
 * in this codebase — the capability line is what a user actually chooses on,
 * so it leads.
 */
export const MODELS: readonly Model[] = [
  {
    id: "model-motion-2",
    name: "Vireo Motion 2",
    capability: "Balanced",
    description: "Natural movement and reliable hands. The default for product video.",
    tokensPerGeneration: 120,
    modes: ["video", "replace-motion", "extend"],
    maxDurationMs: 15_000,
    aspects: ["9:16", "1:1", "16:9", "4:5"],
  },
  {
    id: "model-motion-turbo",
    name: "Vireo Motion Turbo",
    capability: "Fastest",
    description: "Roughly four times quicker, for hook tests and first passes.",
    tokensPerGeneration: 45,
    modes: ["video", "replace-motion"],
    maxDurationMs: 10_000,
    aspects: ["9:16", "1:1"],
  },
  {
    id: "model-presence",
    name: "Vireo Presence",
    capability: "Best for people",
    description: "Talking head and lip sync with steady eyelines and clean mouth shapes.",
    tokensPerGeneration: 180,
    modes: ["talking-head", "lip-sync"],
    maxDurationMs: 15_000,
    aspects: ["9:16", "4:5"],
  },
  {
    id: "model-frame-xl",
    name: "Vireo Frame XL",
    capability: "Sharpest",
    description: "High-detail stills for start frames, thumbnails and product hero shots.",
    tokensPerGeneration: 30,
    modes: ["image", "upscale", "remove-background"],
    maxDurationMs: 1,
    aspects: ["9:16", "1:1", "16:9", "4:5"],
  },
  {
    id: "model-frame",
    name: "Vireo Frame",
    capability: "Everyday",
    description: "Fast stills at a third of the cost. Good enough for reference images.",
    tokensPerGeneration: 10,
    modes: ["image", "remove-background"],
    maxDurationMs: 1,
    aspects: ["9:16", "1:1", "4:5"],
  },
  {
    id: "model-voice",
    name: "Vireo Voice",
    capability: "Most natural",
    description: "Conversational read with breath and pacing, in 12 languages.",
    tokensPerGeneration: 25,
    modes: ["audio"],
    maxDurationMs: 60_000,
    aspects: ["9:16", "1:1", "16:9", "4:5"],
  },
] as const;

export const MODEL_BY_ID: ReadonlyMap<string, Model> = new Map(
  MODELS.map((model) => [model.id, model]),
);

export const DEFAULT_MODEL_ID = "model-motion-2";
