import type { Generation, PromptToken } from "@/lib/schemas";
import { VIDEO_ASSETS } from "./assets";
import { MODELS } from "./models";
import { PROJECTS } from "./projects";
import { ago, rng } from "./seed";

/** SPEC §9: 40 generations, with real prompts a marketer would actually write. */

const PROMPTS: readonly string[] = [
  "Close on the dropper releasing one bead of serum onto a fingertip, morning light from the left",
  "Hands unscrewing the jar and taking one gummy, kitchen counter, shallow depth of field",
  "Slow push in on the bottle against a linen backdrop, warm afternoon light",
  "Woman in her late twenties applying serum along the cheekbone, bathroom mirror, natural light",
  "Overhead shot of four products arranged on a marble surface, hand enters and takes one",
  "Product rotating slowly on a cream pedestal, single soft key light from above",
  "Gym setting, shaker bottle being filled and closed, morning light through high windows",
  "Macro of the serum texture spreading across a glass slide",
  "Hand placing the box on a wooden table, camera holds, then hands open the lid",
  "Founder speaking to camera in a plant-filled workspace, mid-shot, warm tone",
  "Two people at a kitchen island, one hands the other a bottle, both laugh",
  "Close on a label being peeled and smoothed onto a bottle",
  "Side-by-side hold: left frame week one, right frame week eight, identical framing",
  "Candle being lit, flame catches, camera holds on the flicker",
  "Lash brush drawn along the lash line, extreme close, steady",
  "Bag dropped onto a bed, products spill out, quick cut",
  "Steam rising from a mug beside the tincture bottle, early morning",
  "Slow tilt from the product up to the model's face, she looks into lens and smiles",
  "Product held up against a bright window, backlit, silhouette edge",
  "Fingers pressing the gummy jar lid closed, sharp click, tight frame",
];

const ERRORS: readonly string[] = [
  "The start frame is 4:5 but this model only outputs 9:16. Pick a 9:16 start frame or switch to Vireo Motion 2.",
  "The reference image is 480×480, below this model's 720px minimum. Upload a larger version and run it again.",
  "The prompt referenced @serum-hero, which was deleted from the library. Point it at a current asset and retry.",
];

function promptFor(text: string, mention: string | null): PromptToken[] {
  if (!mention) return [{ type: "text", value: text }];
  return [
    { type: "text", value: `${text} using ` },
    { type: "mention", assetId: mention, label: "serum-hero" },
  ];
}

export const GENERATIONS: readonly Generation[] = Array.from({ length: 40 }, (_, index) => {
  const project = PROJECTS[index % PROJECTS.length];
  const model = MODELS[index % MODELS.length];
  const asset = VIDEO_ASSETS[index % VIDEO_ASSETS.length];
  const text = PROMPTS[index % PROMPTS.length] ?? PROMPTS[0] ?? "";

  // A small, deliberate spread of states so the grid shows skeletons, progress
  // rings, a failure with a real message, and finished work on first paint.
  const status =
    index === 0
      ? ("generating" as const)
      : index === 1
        ? ("generating" as const)
        : index === 2
          ? ("queued" as const)
          : index === 9
            ? ("failed" as const)
            : ("ready" as const);

  return {
    id: `gen-${String(index + 1).padStart(2, "0")}`,
    projectId: project?.id ?? "proj-serum-hooks",
    mode:
      index % 5 === 0
        ? ("talking-head" as const)
        : index % 5 === 1
          ? ("video" as const)
          : index % 5 === 2
            ? ("image" as const)
            : index % 5 === 3
              ? ("replace-motion" as const)
              : ("audio" as const),
    prompt: promptFor(text, index % 6 === 0 ? "asset-product-01" : null),
    modelId: model?.id ?? "model-motion-2",
    aspect: "9:16" as const,
    durationMs: rng.pick([5000, 10_000, 15_000]),
    status,
    progress: status === "generating" ? (index === 0 ? 62 : 24) : status === "queued" ? 0 : 100,
    assetId: status === "ready" ? (asset?.id ?? null) : null,
    startFrameAssetId: index % 8 === 0 ? "asset-product-01" : null,
    error: status === "failed" ? (ERRORS[index % ERRORS.length] ?? null) : null,
    tokenCost: model?.tokensPerGeneration ?? 120,
    favorite: index % 9 === 0,
    createdAt: ago(index * 40 + 5, "minute"),
  };
});

export const GENERATION_BY_ID: ReadonlyMap<string, Generation> = new Map(
  GENERATIONS.map((generation) => [generation.id, generation]),
);
