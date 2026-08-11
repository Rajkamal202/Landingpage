import type { Actor, BrandKit, Template } from "@/lib/schemas";
import { AUDIO_ASSETS, PORTRAIT_ASSETS, PRODUCT_ASSETS, VIDEO_ASSETS } from "./assets";
import { ago } from "./seed";

/* ── Templates (24) ────────────────────────────────────────────────────── */

interface TemplateSeed {
  name: string;
  description: string;
  category: Template["category"];
  industry: string;
  durationMs: number;
  sceneCount: number;
  textLayerCount: number;
  pacing: Template["pacing"];
}

const TEMPLATE_SEEDS: readonly TemplateSeed[] = [
  { name: "Three-second hook", description: "Opens on the problem, names it in text, then cuts to the product before the scroll.", category: "product-demo", industry: "Beauty", durationMs: 12_000, sceneCount: 5, textLayerCount: 4, pacing: "fast" },
  { name: "Honest review", description: "A single talking head, one product in hand, captions burned in throughout.", category: "ugc-testimonial", industry: "Supplements", durationMs: 22_000, sceneCount: 3, textLayerCount: 9, pacing: "medium" },
  { name: "Five reasons", description: "A counted list with a hard cut and a new on-screen line per reason.", category: "listicle", industry: "Fitness", durationMs: 26_000, sceneCount: 6, textLayerCount: 6, pacing: "fast" },
  { name: "Split screen proof", description: "Week one beside week eight, with a wipe on the beat and a date stamp.", category: "before-after", industry: "Skincare", durationMs: 14_000, sceneCount: 4, textLayerCount: 3, pacing: "medium" },
  { name: "First open", description: "Hands only, box to product, no voiceover, sound design carries it.", category: "unboxing", industry: "Home", durationMs: 18_000, sceneCount: 6, textLayerCount: 2, pacing: "slow" },
  { name: "Why I built this", description: "Founder to camera in one take, cutaways to the product on the second beat.", category: "founder-story", industry: "DTC", durationMs: 34_000, sceneCount: 5, textLayerCount: 5, pacing: "slow" },
  { name: "Objection handler", description: "States the doubt in the first line, then answers it with a demo.", category: "product-demo", industry: "Supplements", durationMs: 19_000, sceneCount: 5, textLayerCount: 6, pacing: "medium" },
  { name: "Two friends", description: "A dialogue scene between two actors, cut on the reaction rather than the line.", category: "ugc-testimonial", industry: "Beverage", durationMs: 24_000, sceneCount: 7, textLayerCount: 4, pacing: "fast" },
  { name: "Stop scrolling", description: "A direct address hook with a pattern break at second two.", category: "product-demo", industry: "Apparel", durationMs: 11_000, sceneCount: 4, textLayerCount: 5, pacing: "fast" },
  { name: "Routine in order", description: "Numbered steps, one product per step, consistent framing throughout.", category: "listicle", industry: "Skincare", durationMs: 28_000, sceneCount: 8, textLayerCount: 8, pacing: "medium" },
  { name: "The receipts", description: "Screenshots of results between product shots, timestamps left visible.", category: "before-after", industry: "Fitness", durationMs: 20_000, sceneCount: 6, textLayerCount: 7, pacing: "fast" },
  { name: "Gift edit", description: "A price-laddered set of picks, one card per product, CTA on the last.", category: "listicle", industry: "Home", durationMs: 25_000, sceneCount: 7, textLayerCount: 9, pacing: "medium" },
  { name: "Texture close", description: "Macro shots only, no faces, the product doing the talking.", category: "product-demo", industry: "Beauty", durationMs: 13_000, sceneCount: 5, textLayerCount: 2, pacing: "slow" },
  { name: "Day in the life", description: "Four moments across a day, product appearing naturally in each.", category: "ugc-testimonial", industry: "Wellness", durationMs: 30_000, sceneCount: 8, textLayerCount: 5, pacing: "medium" },
  { name: "Answer the comment", description: "Opens on a pinned question, answers it in one continuous take.", category: "ugc-testimonial", industry: "Supplements", durationMs: 21_000, sceneCount: 3, textLayerCount: 6, pacing: "medium" },
  { name: "What's inside", description: "Ingredient callouts over a slow product rotation, one label per beat.", category: "product-demo", industry: "Skincare", durationMs: 17_000, sceneCount: 6, textLayerCount: 8, pacing: "slow" },
  { name: "Restock haul", description: "Bag to counter, each item named on screen as it lands.", category: "unboxing", industry: "Beauty", durationMs: 23_000, sceneCount: 9, textLayerCount: 9, pacing: "fast" },
  { name: "Before you buy", description: "Three things to check, delivered flat and fast, CTA held two seconds.", category: "listicle", industry: "Apparel", durationMs: 16_000, sceneCount: 5, textLayerCount: 6, pacing: "fast" },
  { name: "One month later", description: "A held comparison with the same lighting and framing on both sides.", category: "before-after", industry: "Beauty", durationMs: 15_000, sceneCount: 4, textLayerCount: 4, pacing: "medium" },
  { name: "How we make it", description: "Process shots in sequence, no faces, one line of text per stage.", category: "founder-story", industry: "Food", durationMs: 27_000, sceneCount: 7, textLayerCount: 5, pacing: "slow" },
  { name: "The switch", description: "Old routine, new routine, the cut lands on the word 'instead'.", category: "before-after", industry: "Wellness", durationMs: 14_500, sceneCount: 5, textLayerCount: 4, pacing: "fast" },
  { name: "Sold out again", description: "Urgency-led, restock date on screen, one product held throughout.", category: "product-demo", industry: "Apparel", durationMs: 10_000, sceneCount: 3, textLayerCount: 4, pacing: "fast" },
  { name: "Team picks", description: "Four short takes from four actors, same question, different answers.", category: "ugc-testimonial", industry: "DTC", durationMs: 29_000, sceneCount: 8, textLayerCount: 8, pacing: "medium" },
  { name: "Quiet demo", description: "No voiceover, no music, just the product working and one closing line.", category: "product-demo", industry: "Home", durationMs: 12_500, sceneCount: 4, textLayerCount: 2, pacing: "slow" },
];

const TEMPLATE_SLOTS = ["Hook", "Body copy", "CTA", "Product", "Product image", "Actor", "Voice", "Music"] as const;

export const TEMPLATES: readonly Template[] = TEMPLATE_SEEDS.map((seed, index) => ({
  id: `template-${String(index + 1).padStart(2, "0")}`,
  name: seed.name,
  description: seed.description,
  category: seed.category,
  industry: seed.industry,
  aspect: index % 6 === 5 ? "4:5" : "9:16",
  durationMs: seed.durationMs,
  sceneCount: seed.sceneCount,
  textLayerCount: seed.textLayerCount,
  pacing: seed.pacing,
  previewAssetId: VIDEO_ASSETS[index % VIDEO_ASSETS.length]?.id ?? "",
  slots: [...TEMPLATE_SLOTS],
}));

export const TEMPLATE_BY_ID: ReadonlyMap<string, Template> = new Map(
  TEMPLATES.map((template) => [template.id, template]),
);

/* ── AI actors (16) ────────────────────────────────────────────────────── */

interface ActorSeed {
  name: string;
  description: string;
  voiceName: string;
  styles: string[];
  gender: Actor["genderPresentation"];
  age: Actor["ageRange"];
  languages: string[];
}

const ACTOR_SEEDS: readonly ActorSeed[] = [
  { name: "Maya R.", description: "Warm and unhurried. Reads well for skincare and wellness.", voiceName: "Maya — soft", styles: ["Warm", "Conversational"], gender: "feminine", age: "25-34", languages: ["English", "Spanish"] },
  { name: "Devon K.", description: "Dry delivery with a fast cadence. Good for objection handling.", voiceName: "Devon — dry", styles: ["Direct", "Fast"], gender: "masculine", age: "25-34", languages: ["English"] },
  { name: "Priya S.", description: "Bright and energetic. Built for hooks that need to land in two seconds.", voiceName: "Priya — bright", styles: ["Energetic", "Upbeat"], gender: "feminine", age: "18-24", languages: ["English", "Hindi"] },
  { name: "Noah B.", description: "Low, steady, credible. The voice for a founder story.", voiceName: "Noah — steady", styles: ["Calm", "Authoritative"], gender: "masculine", age: "35-44", languages: ["English"] },
  { name: "Lena M.", description: "Casual and close-mic'd, like a voice note from a friend.", voiceName: "Lena — close", styles: ["Casual", "Intimate"], gender: "feminine", age: "25-34", languages: ["English", "German"] },
  { name: "Theo A.", description: "Playful with a light rasp. Works for food and beverage.", voiceName: "Theo — playful", styles: ["Playful", "Warm"], gender: "masculine", age: "18-24", languages: ["English", "French"] },
  { name: "Ines V.", description: "Measured and precise. Suits ingredient and process explainers.", voiceName: "Ines — precise", styles: ["Precise", "Calm"], gender: "feminine", age: "35-44", languages: ["English", "Portuguese"] },
  { name: "Rowan T.", description: "Neutral and even. The safe default when the copy is doing the work.", voiceName: "Rowan — neutral", styles: ["Neutral", "Clear"], gender: "androgynous", age: "25-34", languages: ["English"] },
  { name: "Sana Q.", description: "Confident with a rising cadence. Strong on listicles.", voiceName: "Sana — confident", styles: ["Confident", "Fast"], gender: "feminine", age: "25-34", languages: ["English", "Arabic"] },
  { name: "Elias F.", description: "Gentle and slow. For sleep, recovery and anything restful.", voiceName: "Elias — gentle", styles: ["Calm", "Slow"], gender: "masculine", age: "45-plus", languages: ["English", "Swedish"] },
  { name: "Nora W.", description: "Wry and quick. Good for comment-reply formats.", voiceName: "Nora — wry", styles: ["Witty", "Fast"], gender: "feminine", age: "25-34", languages: ["English"] },
  { name: "Kai H.", description: "Even-toned with clean consonants. Reliable for long scripts.", voiceName: "Kai — clean", styles: ["Clear", "Neutral"], gender: "androgynous", age: "18-24", languages: ["English", "Japanese"] },
  { name: "Amara D.", description: "Rich and grounded. Carries authority without pushing.", voiceName: "Amara — rich", styles: ["Authoritative", "Warm"], gender: "feminine", age: "35-44", languages: ["English", "Yoruba"] },
  { name: "Julian P.", description: "Enthusiastic without shouting. Built for launches.", voiceName: "Julian — bright", styles: ["Energetic", "Friendly"], gender: "masculine", age: "25-34", languages: ["English", "Italian"] },
  { name: "Freya L.", description: "Soft-spoken and deliberate. Pairs with macro product footage.", voiceName: "Freya — soft", styles: ["Soft", "Slow"], gender: "feminine", age: "45-plus", languages: ["English", "Danish"] },
  { name: "Omar N.", description: "Straightforward and unfussy. The voice for a demo that just works.", voiceName: "Omar — plain", styles: ["Direct", "Clear"], gender: "masculine", age: "35-44", languages: ["English", "Arabic"] },
];

export const ACTORS: readonly Actor[] = ACTOR_SEEDS.map((seed, index) => ({
  id: `actor-${String(index + 1).padStart(2, "0")}`,
  name: seed.name,
  description: seed.description,
  portraitAssetId: PORTRAIT_ASSETS[index]?.id ?? "",
  voiceAssetId: AUDIO_ASSETS[index % AUDIO_ASSETS.length]?.id ?? "",
  voiceName: seed.voiceName,
  styles: seed.styles,
  genderPresentation: seed.gender,
  ageRange: seed.age,
  languages: seed.languages,
}));

export const ACTOR_BY_ID: ReadonlyMap<string, Actor> = new Map(
  ACTORS.map((actor) => [actor.id, actor]),
);

/* ── Brand kit ─────────────────────────────────────────────────────────── */

export const BRAND_KIT: BrandKit = {
  id: "brand-glowlab",
  name: "Glowlab",
  logoAssetId: PRODUCT_ASSETS[0]?.id ?? null,
  colors: [
    { id: "brand-color-1", name: "Signature", hex: "#3D6FF0" },
    { id: "brand-color-2", name: "Deep", hex: "#14285F" },
    { id: "brand-color-3", name: "Blush", hex: "#F0D5D8" },
    { id: "brand-color-4", name: "Sand", hex: "#F5EFE6" },
  ],
  headingFont: "Geist",
  bodyFont: "Geist",
  toneOfVoice:
    "Plain and specific. We say what a product does and how long it takes. No superlatives, no exclamation marks, no promises we can't measure.",
  products: [
    {
      id: "product-serum",
      name: "Hydrating serum",
      description: "A lightweight hyaluronic serum for morning use. 30ml.",
      url: "https://glowlab.example/products/hydrating-serum",
      imageAssetId: PRODUCT_ASSETS[0]?.id ?? null,
    },
    {
      id: "product-creatine",
      name: "Creatine gummies",
      description: "5g creatine monohydrate per serving, mixed berry. 60 count.",
      url: "https://glowlab.example/products/creatine-gummies",
      imageAssetId: PRODUCT_ASSETS[1]?.id ?? null,
    },
    {
      id: "product-sleep",
      name: "Sleep tincture",
      description: "Magnesium and L-theanine drops, taken 30 minutes before bed.",
      url: "https://glowlab.example/products/sleep-tincture",
      imageAssetId: PRODUCT_ASSETS[2]?.id ?? null,
    },
    {
      id: "product-lash",
      name: "Lash serum",
      description: "Peptide lash conditioner applied nightly along the lash line.",
      url: "https://glowlab.example/products/lash-serum",
      imageAssetId: PRODUCT_ASSETS[3]?.id ?? null,
    },
  ],
  updatedAt: ago(5, "day"),
};
