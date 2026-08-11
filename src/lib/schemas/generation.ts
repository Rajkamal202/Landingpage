import { z } from "zod";
import { zAspectRatio, zId, zTimestamp } from "./common";

/** SPEC §8.2 mode toolbar — six primary segments plus the overflow menu. */
export const zGenerationMode = z.enum([
  "talking-head",
  "replace-motion",
  "video",
  "image",
  "audio",
  "lip-sync",
  "upscale",
  "remove-background",
  "extend",
]);
export type GenerationMode = z.infer<typeof zGenerationMode>;

export const GENERATION_MODE_LABEL: Record<GenerationMode, string> = {
  "talking-head": "Talking head",
  "replace-motion": "Replace motion",
  video: "Video",
  image: "Image",
  audio: "Audio",
  "lip-sync": "Lip sync",
  upscale: "Upscale",
  "remove-background": "Remove background",
  extend: "Extend",
};

export const zGenerationStatus = z.enum(["queued", "generating", "ready", "failed"]);
export type GenerationStatus = z.infer<typeof zGenerationStatus>;

export const zModel = z.object({
  id: zId,
  name: z.string(),
  /** One-word capability badge shown in the picker — "Fastest", "Sharpest". */
  capability: z.string(),
  description: z.string(),
  tokensPerGeneration: z.number().int().positive(),
  modes: z.array(zGenerationMode),
  maxDurationMs: z.number().int().positive(),
  aspects: z.array(zAspectRatio),
});
export type Model = z.infer<typeof zModel>;

/**
 * The prompt is stored as tokens, not a string (SPEC §15). A regex over a
 * string breaks the first time someone backspaces through a mention, so an
 * `@` reference is a real node in the value with an asset id attached.
 */
export const zPromptToken = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string() }),
  z.object({ type: z.literal("mention"), assetId: zId, label: z.string() }),
]);
export type PromptToken = z.infer<typeof zPromptToken>;

export const zGeneration = z.object({
  id: zId,
  projectId: zId,
  mode: zGenerationMode,
  prompt: z.array(zPromptToken),
  modelId: zId,
  aspect: zAspectRatio,
  durationMs: z.number().int().nonnegative(),
  status: zGenerationStatus,
  /** 0–100 while generating. */
  progress: z.number().min(0).max(100),
  assetId: zId.nullable(),
  startFrameAssetId: zId.nullable(),
  /** Specific and actionable — never "Something went wrong" (SPEC §12). */
  error: z.string().nullable(),
  tokenCost: z.number().int().nonnegative(),
  favorite: z.boolean(),
  createdAt: zTimestamp,
});
export type Generation = z.infer<typeof zGeneration>;

export const zGenerationRequest = z.object({
  projectId: zId,
  mode: zGenerationMode,
  prompt: z.array(zPromptToken),
  modelId: zId,
  aspect: zAspectRatio,
  durationMs: z.number().int().positive(),
  batchCount: z.number().int().min(1).max(8),
  startFrameAssetId: zId.nullable(),
});
export type GenerationRequest = z.infer<typeof zGenerationRequest>;

export function promptToPlainText(prompt: readonly PromptToken[]): string {
  return prompt
    .map((token) => (token.type === "text" ? token.value : `@${token.label}`))
    .join("");
}
