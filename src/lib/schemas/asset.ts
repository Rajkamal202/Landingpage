import { z } from "zod";
import { zAspectRatio, zId, zMediaKind, zTimestamp } from "./common";

export const zAssetSource = z.enum(["upload", "generated", "clone", "brand"]);
export type AssetSource = z.infer<typeof zAssetSource>;

export const zAsset = z.object({
  id: zId,
  name: z.string(),
  kind: zMediaKind,
  /** Playable/renderable file under /media. */
  src: z.string(),
  /** Still frame. Always present so a thumbnail never renders empty. */
  poster: z.string(),
  /**
   * Horizontal sprite sheet used for hover-scrub. Scrubbing a sprite is exact
   * and cheap; seeking a <video> on pointer move is neither.
   */
  sprite: z.string().nullable(),
  spriteFrames: z.number().int().positive(),
  /**
   * Pre-computed waveform peaks, 0–1, for audio assets. Decoding audio in the
   * browser to draw a waveform is the kind of thing that drops a timeline to
   * 20fps, so it is done once at media-generation time.
   */
  peaks: z.array(z.number()).nullable(),
  durationMs: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspect: zAspectRatio,
  sizeBytes: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  favorite: z.boolean(),
  source: zAssetSource,
  createdAt: zTimestamp,
});
export type Asset = z.infer<typeof zAsset>;

export const zAssetFilter = z.object({
  kind: zMediaKind.optional(),
  source: zAssetSource.optional(),
  query: z.string().optional(),
  favoriteOnly: z.boolean().optional(),
  sort: z.enum(["recent", "name", "duration"]).default("recent"),
});
export type AssetFilter = z.infer<typeof zAssetFilter>;
