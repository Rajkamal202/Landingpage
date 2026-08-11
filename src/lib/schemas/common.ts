import { z } from "zod";

/**
 * SPEC §9: zod is the single source of truth. Every type in the app is
 * `z.infer`'d from a schema in this folder — there are no hand-written
 * interfaces describing data, so a fixture that drifts from its type fails
 * validation rather than failing silently in a component.
 */

export const zAspectRatio = z.enum(["9:16", "1:1", "16:9", "4:5"]);
export type AspectRatio = z.infer<typeof zAspectRatio>;

export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

export const zMediaKind = z.enum(["video", "image", "audio"]);
export type MediaKind = z.infer<typeof zMediaKind>;

export const zPlatform = z.enum(["tiktok", "instagram", "youtube", "meta-ads"]);
export type Platform = z.infer<typeof zPlatform>;

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  "meta-ads": "Meta Ads",
};

/** ISO 8601. Kept as a string so fixtures stay serialisable and deterministic. */
export const zTimestamp = z.string();

export const zId = z.string().min(1);
