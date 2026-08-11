import { z } from "zod";
import { zAspectRatio, zId, zTimestamp } from "./common";

/* ── Templates (SPEC §8.3) ─────────────────────────────────────────────── */

export const zTemplateCategory = z.enum([
  "product-demo",
  "ugc-testimonial",
  "listicle",
  "before-after",
  "unboxing",
  "founder-story",
]);
export type TemplateCategory = z.infer<typeof zTemplateCategory>;

export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
  "product-demo": "Product demo",
  "ugc-testimonial": "UGC testimonial",
  listicle: "Listicle",
  "before-after": "Before and after",
  unboxing: "Unboxing",
  "founder-story": "Founder story",
};

export const zPacing = z.enum(["fast", "medium", "slow"]);
export type Pacing = z.infer<typeof zPacing>;

export const zTemplate = z.object({
  id: zId,
  name: z.string(),
  description: z.string(),
  category: zTemplateCategory,
  industry: z.string(),
  aspect: zAspectRatio,
  durationMs: z.number().int().positive(),
  sceneCount: z.number().int().positive(),
  textLayerCount: z.number().int().nonnegative(),
  pacing: zPacing,
  previewAssetId: zId,
  /** Editable slots this template exposes to the bulk editor. */
  slots: z.array(z.string()),
});
export type Template = z.infer<typeof zTemplate>;

/* ── AI actors (SPEC §8.3) ─────────────────────────────────────────────── */

export const zGenderPresentation = z.enum(["feminine", "masculine", "androgynous"]);
export const zAgeRange = z.enum(["18-24", "25-34", "35-44", "45-plus"]);

export const zActor = z.object({
  id: zId,
  name: z.string(),
  description: z.string(),
  portraitAssetId: zId,
  voiceAssetId: zId,
  voiceName: z.string(),
  styles: z.array(z.string()),
  genderPresentation: zGenderPresentation,
  ageRange: zAgeRange,
  languages: z.array(z.string()),
});
export type Actor = z.infer<typeof zActor>;

/* ── Brand kit (SPEC §8.3) ─────────────────────────────────────────────── */

export const zProduct = z.object({
  id: zId,
  name: z.string(),
  description: z.string(),
  url: z.string(),
  imageAssetId: zId.nullable(),
});
export type Product = z.infer<typeof zProduct>;

export const zBrandKit = z.object({
  id: zId,
  name: z.string(),
  logoAssetId: zId.nullable(),
  colors: z.array(z.object({ id: zId, name: z.string(), hex: z.string() })),
  headingFont: z.string(),
  bodyFont: z.string(),
  toneOfVoice: z.string(),
  products: z.array(zProduct),
  updatedAt: zTimestamp,
});
export type BrandKit = z.infer<typeof zBrandKit>;
