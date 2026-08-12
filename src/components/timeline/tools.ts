import type { Clip, TextClipStyle } from "@/lib/schemas";
import type { ToolId } from "@/lib/stores/timeline";
import {
  IconCrop,
  IconSelect,
  IconShape,
  IconSplit,
  IconText,
  IconZoomIn,
  type IconDef,
} from "@/components/icons";

/**
 * The tool cluster (SPEC §8.5). Each entry carries the sentence that explains
 * what the tool does to the timeline, which is both the tooltip and the hint
 * shown under the preview while the tool is armed — a mode with no visible
 * consequence is how people get lost in an editor.
 */
export interface ToolDefinition {
  id: ToolId;
  label: string;
  glyph: IconDef;
  /** What happens next, written in the interface's voice. */
  hint: string;
}

export const TOOLS: readonly ToolDefinition[] = [
  {
    id: "select",
    label: "Select",
    glyph: IconSelect,
    hint: "Drag a clip to move it, drag its edges to trim, or drag across the lanes to marquee-select.",
  },
  {
    id: "cut",
    label: "Cut",
    glyph: IconSplit,
    hint: "Click a clip where you want the cut. The playhead moves there and the clip splits in two.",
  },
  {
    id: "text",
    label: "Text",
    glyph: IconText,
    hint: "Click the caption lane to drop a two-second caption at that point.",
  },
  {
    id: "shape",
    label: "Shape",
    glyph: IconShape,
    hint: "Click the overlay lane to lay a product graphic over the video at that point.",
  },
  {
    id: "crop",
    label: "Crop",
    glyph: IconCrop,
    hint: "Framing guides are on. Check the selected clip against the 9:16 title-safe area.",
  },
  {
    id: "zoom",
    label: "Zoom",
    glyph: IconZoomIn,
    hint: "Click the lanes to zoom in on that moment. Hold Alt and click to zoom back out.",
  },
];

/**
 * SPEC §8.5 asks a new caption to "default to a platform-native face". The
 * first entry is that default; the rest are the faces a social ad actually
 * uses. Values are CSS families, so the preview renders what the panel says.
 */
export const FONT_FAMILIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "system-ui", label: "System sans" },
  { value: "Inter", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "ui-monospace, monospace", label: "System mono" },
];

export const FONT_WEIGHTS: ReadonlyArray<{ value: TextClipStyle["fontWeight"]; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
];

export const ANIMATE_IN: ReadonlyArray<{ value: TextClipStyle["animateIn"]; label: string }> = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade in" },
  { value: "rise", label: "Rise" },
  { value: "pop", label: "Pop" },
];

export const ANIMATE_OUT: ReadonlyArray<{ value: TextClipStyle["animateOut"]; label: string }> = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade out" },
  { value: "sink", label: "Sink" },
];

export const CSS_FONT_WEIGHT: Record<TextClipStyle["fontWeight"], number> = {
  normal: 400,
  semibold: 600,
  bold: 700,
};

/** A caption a person would actually type, not "Text layer 1". */
const NEW_CAPTION_TEXT = "New caption";

export const NEW_CAPTION_MS = 2_000;

export function createTextClip(id: string, startMs: number, durationMs: number): Clip {
  const style: TextClipStyle = {
    fontFamily: "system-ui",
    fontSize: 44,
    fontWeight: "bold",
    // token-lint-disable-next-line no-raw-hex — a caption's fill is user
    // content stored in the document, not chrome. It is editable in the
    // properties panel via ColorSwatch, so it cannot be a design token; these
    // are only the defaults a new caption starts from.
    color: "#FFFFFF",
    // token-lint-disable-next-line no-raw-hex — see above.
    outlineColor: "#0B0C0E",
    outlineWidth: 3,
    align: "center",
    x: 0,
    y: 240,
    rotation: 0,
    opacity: 1,
    animateIn: "rise",
    animateOut: "fade",
  };

  return {
    kind: "text",
    id,
    startMs,
    durationMs,
    trimInMs: 0,
    trimOutMs: 0,
    label: NEW_CAPTION_TEXT,
    content: NEW_CAPTION_TEXT,
    style,
  };
}

export function createOverlayClip(
  id: string,
  assetId: string,
  label: string,
  startMs: number,
  durationMs: number,
): Clip {
  return {
    kind: "overlay",
    id,
    startMs,
    durationMs,
    trimInMs: 0,
    trimOutMs: 0,
    label,
    assetId,
    opacity: 0.95,
  };
}

export function createVideoClip(
  id: string,
  assetId: string,
  label: string,
  startMs: number,
  durationMs: number,
): Clip {
  return {
    kind: "video",
    id,
    startMs,
    durationMs,
    trimInMs: 0,
    trimOutMs: 0,
    label,
    assetId,
  };
}

export function createAudioClip(
  id: string,
  assetId: string,
  label: string,
  startMs: number,
  durationMs: number,
): Clip {
  return {
    kind: "audio",
    id,
    startMs,
    durationMs,
    trimInMs: 0,
    trimOutMs: 0,
    label,
    assetId,
    gain: 0.6,
  };
}
