import type { GenerationMode } from "@/lib/schemas";

/**
 * SPEC §8.2: "Each mode swaps the composer's controls."
 *
 * The differences are declared as data rather than branched in JSX, so the
 * composer animates between two configurations of one layout instead of
 * rendering nine near-identical forms.
 */
export interface ModeConfig {
  placeholder: string;
  /** What the tile to the left of the prompt is for in this mode. */
  frame: "hidden" | "start" | "source";
  frameLabel: string;
  aspect: boolean;
  duration: boolean;
  actor: boolean;
  templates: boolean;
  reference: boolean;
  /** One line under the composer explaining what this mode does. */
  hint: string;
}

const base: Omit<ModeConfig, "placeholder" | "hint"> = {
  frame: "start",
  frameLabel: "Start frame",
  aspect: true,
  duration: true,
  actor: false,
  templates: true,
  reference: true,
};

export const MODE_CONFIG: Record<GenerationMode, ModeConfig> = {
  "talking-head": {
    ...base,
    actor: true,
    placeholder: "Write what the actor says, and how they should say it",
    hint: "Pick an actor, write the script, and Vireo performs it to camera.",
  },
  "replace-motion": {
    ...base,
    frameLabel: "Source clip",
    frame: "source",
    placeholder: "Describe the movement you want in place of the original",
    hint: "Keeps the subject and framing, replaces how everything moves.",
  },
  video: {
    ...base,
    placeholder: "Describe the shot: subject, framing, light, movement",
    hint: "A start frame is optional. Without one, the model composes the opening shot too.",
  },
  image: {
    ...base,
    duration: false,
    frameLabel: "Reference image",
    placeholder: "Describe the still: product, surface, light, angle",
    hint: "Stills work well as start frames for video and as thumbnails.",
  },
  audio: {
    ...base,
    frame: "hidden",
    frameLabel: "",
    aspect: false,
    duration: false,
    actor: true,
    reference: false,
    placeholder: "Write the voiceover script",
    hint: "The read follows your punctuation, so write it the way you want it spoken.",
  },
  "lip-sync": {
    ...base,
    frame: "source",
    frameLabel: "Source clip",
    duration: false,
    actor: true,
    templates: false,
    placeholder: "Write the new line for the person on screen",
    hint: "Re-times the mouth to a new line without reshooting the clip.",
  },
  upscale: {
    ...base,
    frame: "source",
    frameLabel: "Source clip",
    aspect: false,
    duration: false,
    templates: false,
    reference: false,
    placeholder: "Note anything to preserve — fine text, skin texture, product edges",
    hint: "Doubles resolution and cleans compression artefacts.",
  },
  "remove-background": {
    ...base,
    frame: "source",
    frameLabel: "Source clip",
    aspect: false,
    duration: false,
    templates: false,
    reference: false,
    placeholder: "Note anything tricky — loose hair, transparent packaging, motion blur",
    hint: "Cuts the subject out and returns it on transparency.",
  },
  extend: {
    ...base,
    frame: "source",
    frameLabel: "Source clip",
    templates: false,
    placeholder: "Describe what happens after the clip ends",
    hint: "Continues the shot from its last frame.",
  },
};

/** The five segments always on the toolbar; the rest live in the overflow. */
export const PRIMARY_MODES: readonly GenerationMode[] = [
  "talking-head",
  "replace-motion",
  "video",
  "image",
  "audio",
];

export const OVERFLOW_MODES: readonly GenerationMode[] = [
  "lip-sync",
  "upscale",
  "remove-background",
  "extend",
];

export const ALL_MODES: readonly GenerationMode[] = [...PRIMARY_MODES, ...OVERFLOW_MODES];
