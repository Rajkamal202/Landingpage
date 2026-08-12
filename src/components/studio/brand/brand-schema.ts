import { z } from "zod";
import type { BrandKit } from "@/lib/schemas";

/**
 * SPEC §3: zod is the single source of truth for both the rules and the types.
 * The form's shape is the `BrandKit` shape minus the two fields the user does
 * not own — its id and the timestamp — which are carried through from the
 * loaded kit on save.
 *
 * Every message names the cause and the fix (SPEC §12). None of them says
 * "invalid".
 */

/** Three- or six-digit hex, which is what `ColorSwatch` commits. */
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const productSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(1, "Name the product the way you'd say it in a script.")
    .max(60, "Keep it under 60 characters so it fits on a caption line."),
  description: z
    .string()
    .trim()
    .min(1, "One line on what it is. Scripts and hooks are written from this.")
    .max(200, "Two hundred characters is plenty — this is a description, not a landing page."),
  url: z.url("Paste the full product page address, starting with https://."),
  imageAssetId: z.string().nullable(),
});

export type ProductValues = z.infer<typeof productSchema>;

export const brandFormSchema = z.object({
  name: z.string().trim().min(1, "Your brand needs a name — it labels the kit everywhere it's used."),
  logoAssetId: z.string().nullable(),
  colors: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1, "Name the colour so you can pick it by eye later."),
        hex: z.string().regex(HEX, "Use a hex value like the one in the colour well."),
      }),
    )
    .min(1, "Keep at least one colour. It's what captions and callouts are drawn from.")
    .max(12, "Twelve colours is already more than a brand can hold together."),
  headingFont: z.string().min(1),
  bodyFont: z.string().min(1),
  toneOfVoice: z
    .string()
    .trim()
    .max(600, "Keep it under 600 characters. A short rule is followed; an essay isn't."),
  products: z.array(productSchema),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export function toFormValues(kit: BrandKit): BrandFormValues {
  return {
    name: kit.name,
    logoAssetId: kit.logoAssetId,
    colors: kit.colors.map((color) => ({ ...color })),
    headingFont: kit.headingFont,
    bodyFont: kit.bodyFont,
    toneOfVoice: kit.toneOfVoice,
    products: kit.products.map((product) => ({ ...product })),
  };
}

export function toBrandKit(kit: BrandKit, values: BrandFormValues): BrandKit {
  return {
    ...kit,
    name: values.name,
    logoAssetId: values.logoAssetId,
    colors: values.colors,
    headingFont: values.headingFont,
    bodyFont: values.bodyFont,
    toneOfVoice: values.toneOfVoice,
    products: values.products,
    updatedAt: new Date().toISOString(),
  };
}

/** A short, honest list — every one of these renders on any target device. */
export const FONT_OPTIONS = [
  { value: "Geist", hint: "The face Vireo is set in" },
  { value: "Geist Mono", hint: "Monospaced, good for stats" },
  { value: "Helvetica Neue", hint: "Apple platform default" },
  { value: "Arial", hint: "Identical everywhere" },
  { value: "Georgia", hint: "Serif, warm" },
  { value: "Verdana", hint: "Wide, legible small" },
] as const;
