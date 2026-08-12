import type { Slide, SlideLayer, SlideshowDoc } from "@/lib/schemas";
import { newLayerId } from "@/lib/stores/slideshow";
import { DOC_HEIGHT, DOC_WIDTH, fitInto } from "./geometry";
import { findPreset } from "./presets";

/**
 * What a newly added layer looks like before the user touches it.
 *
 * A new caption inherits its colours from a caption that already exists in the
 * document, and its typography from the variation's style preset. That is the
 * difference between "add text" dropping a white box on white footage and
 * dropping something that already belongs to the ad.
 */

/*
 * The two literals below are document data, not chrome: a caption's fill and
 * its outline are colours the user picks in a colour well, so they cannot come
 * from the token scale (the same reason `ColorSwatch` and the fixtures are
 * exempt). They are reached only when a document contains no text layer at all
 * to inherit from.
 */
// token-lint-disable-next-line no-raw-hex — document data, see above.
const FALLBACK_TEXT_COLOUR = "#FFFFFF";
// token-lint-disable-next-line no-raw-hex — document data, see above.
const FALLBACK_OUTLINE_COLOUR = "#0B0C0E";

/** Default caption box: 900×240, centred in the 1080×1920 document. */
const TEXT_WIDTH = 900;
const TEXT_HEIGHT = 240;
const TEXT_SIZE = 72;

type TextLayer = Extract<SlideLayer, { kind: "text" }>;

function sampleTextLayer(doc: SlideshowDoc, slide: Slide): TextLayer | undefined {
  const onSlide = slide.layers.find((layer): layer is TextLayer => layer.kind === "text");
  if (onSlide) return onSlide;
  for (const candidate of doc.slides) {
    const found = candidate.layers.find((layer): layer is TextLayer => layer.kind === "text");
    if (found) return found;
  }
  return undefined;
}

export function createTextLayer(doc: SlideshowDoc, slide: Slide): SlideLayer {
  const sample = sampleTextLayer(doc, slide);
  const preset = findPreset(doc.stylePreset);
  const count = slide.layers.filter((layer) => layer.kind === "text").length;

  return {
    kind: "text",
    id: newLayerId(),
    name: `Text ${count + 1}`,
    transform: {
      x: Math.round((DOC_WIDTH - TEXT_WIDTH) / 2),
      y: Math.round((DOC_HEIGHT - TEXT_HEIGHT) / 2),
      width: TEXT_WIDTH,
      height: TEXT_HEIGHT,
      rotation: 0,
      opacity: 1,
    },
    // A caption the user types over immediately; the panel focuses this field
    // the frame after the layer lands, so it is a starting point, not a label.
    content: "Text",
    textStyle: preset?.textStyle ?? sample?.textStyle ?? "filled",
    fontFamily: preset?.fontFamily ?? sample?.fontFamily ?? "Inter",
    fontSize: TEXT_SIZE,
    fontWeight: preset?.fontWeight ?? sample?.fontWeight ?? "bold",
    color: sample?.color ?? FALLBACK_TEXT_COLOUR,
    outlineColor: sample?.outlineColor ?? FALLBACK_OUTLINE_COLOUR,
    outlineWidth: 0,
    align: preset?.align ?? sample?.align ?? "center",
  };
}

export interface ImageLayerInput {
  assetId: string;
  name: string;
  sourceWidth: number;
  sourceHeight: number;
  /** Document-space point the image should centre on. */
  at: { x: number; y: number };
}

export function createImageLayer(input: ImageLayerInput): SlideLayer {
  // Land at a size that reads as an inserted element rather than a new
  // background — 70% of the frame's width, half its height, whichever binds.
  const { width, height } = fitInto(
    input.sourceWidth,
    input.sourceHeight,
    DOC_WIDTH * 0.7,
    DOC_HEIGHT * 0.5,
  );

  return {
    kind: "image",
    id: newLayerId(),
    name: input.name,
    transform: {
      x: Math.round(input.at.x - width / 2),
      y: Math.round(input.at.y - height / 2),
      width,
      height,
      rotation: 0,
      opacity: 1,
    },
    assetId: input.assetId,
    fit: "cover",
  };
}
