import { z } from "zod";
import { zAspectRatio, zId, zPlatform, zTimestamp } from "./common";

/** SPEC §8.1 — the six substeps, in order, each checking off as it lands. */
export const zCloneStepId = z.enum([
  "fetch",
  "scenes",
  "text",
  "overlays",
  "pacing",
  "build",
]);
export type CloneStepId = z.infer<typeof zCloneStepId>;

export const CLONE_STEPS: ReadonlyArray<{ id: CloneStepId; label: string }> = [
  { id: "fetch", label: "Fetching source" },
  { id: "scenes", label: "Detecting scenes" },
  { id: "text", label: "Extracting on-screen text" },
  { id: "overlays", label: "Separating overlays and captions" },
  { id: "pacing", label: "Reading pacing" },
  { id: "build", label: "Building editable project" },
];

export const zScene = z.object({
  id: zId,
  index: z.number().int().nonnegative(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  posterUrl: z.string(),
});
export type Scene = z.infer<typeof zScene>;

export const zTextLayer = z.object({
  id: zId,
  content: z.string(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  role: z.enum(["hook", "body", "caption", "cta"]),
});
export type TextLayer = z.infer<typeof zTextLayer>;

/** Emitted by the clone stream as each substep progresses. */
export const zCloneProgress = z.object({
  step: zCloneStepId,
  stepIndex: z.number().int().nonnegative(),
  stepCount: z.number().int().positive(),
  percent: z.number().min(0).max(100),
  /** Scenes stream in as they are detected, so the filmstrip draws live. */
  scenes: z.array(zScene),
});
export type CloneProgress = z.infer<typeof zCloneProgress>;

export const zCloneResult = z.object({
  id: zId,
  sourceUrl: z.string(),
  platform: zPlatform,
  handle: z.string(),
  durationMs: z.number().int().positive(),
  aspect: zAspectRatio,
  scenes: z.array(zScene),
  textLayers: z.array(zTextLayer),
  overlayCount: z.number().int().nonnegative(),
  pacing: z.enum(["fast", "medium", "slow"]),
  previewAssetId: zId,
  projectId: zId,
  createdAt: zTimestamp,
});
export type CloneResult = z.infer<typeof zCloneResult>;

/**
 * SPEC §8.1: "Never a generic error." Each failure names a cause and a fix,
 * so the UI never has to invent copy for a state it did not anticipate.
 */
export const zCloneFailure = z.object({
  code: z.enum(["private", "not-found", "unsupported", "too-long", "network"]),
  title: z.string(),
  fix: z.string(),
});
export type CloneFailure = z.infer<typeof zCloneFailure>;

export const zRecentClone = z.object({
  id: zId,
  platform: zPlatform,
  handle: z.string(),
  sourceUrl: z.string(),
  posterUrl: z.string(),
  sceneCount: z.number().int().positive(),
  projectId: zId,
  createdAt: zTimestamp,
});
export type RecentClone = z.infer<typeof zRecentClone>;
