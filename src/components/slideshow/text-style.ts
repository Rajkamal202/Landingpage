import type { CSSProperties } from "react";
import type { SlideLayer, TextStyleName } from "@/lib/schemas";

/**
 * The four text styles from SPEC §8.6, as real paint rather than four labels
 * that all render the same.
 *
 * - **Filled** is the fill colour alone.
 * - **Outlined** strokes the glyphs and paints the stroke *behind* the fill via
 *   `paint-order`, which is the difference between a clean outline and one that
 *   eats half the letterform.
 * - **Shadowed** offsets a hard drop shadow — the look burned-in captions use,
 *   not a blurred glow.
 * - **Highlighted** paints a box behind the text runs, cloned per line, so a
 *   two-line headline gets two boxes instead of one ragged rectangle.
 *
 * Outlined, shadowed and highlighted all take their second colour from
 * `outlineColor`, which keeps the panel to one "outline colour" control instead
 * of three that each apply to exactly one style.
 */

export type TextLayer = Extract<SlideLayer, { kind: "text" }>;

export const TEXT_STYLE_OPTIONS: ReadonlyArray<{ value: TextStyleName; label: string }> = [
  { value: "filled", label: "Filled" },
  { value: "outlined", label: "Outlined" },
  { value: "shadowed", label: "Shadowed" },
  { value: "highlighted", label: "Highlighted" },
];

export const FONT_WEIGHT_OPTIONS: ReadonlyArray<{
  value: TextLayer["fontWeight"];
  label: string;
}> = [
  { value: "normal", label: "Normal" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
];

const WEIGHT_VALUE: Record<TextLayer["fontWeight"], number> = {
  normal: 400,
  semibold: 600,
  bold: 700,
};

export const ALIGN_OPTIONS: ReadonlyArray<{ value: TextLayer["align"]; label: string }> = [
  { value: "left", label: "Left" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Right" },
];

/**
 * Faces available to a caption. Every one resolves to something already on the
 * device — SPEC §8.5 asks for a platform-native default, and a video ad tool
 * that renders a face the user does not have is lying about the export.
 */
export const FONT_OPTIONS: ReadonlyArray<{ value: string; label: string; stack: string }> = [
  { value: "Inter", label: "Inter", stack: "Inter, ui-sans-serif, system-ui, sans-serif" },
  {
    value: "Helvetica Neue",
    label: "Helvetica Neue",
    stack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  { value: "Georgia", label: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
  {
    value: "Courier New",
    label: "Courier New",
    stack: '"Courier New", ui-monospace, monospace',
  },
  { value: "Impact", label: "Impact", stack: 'Impact, "Arial Black", sans-serif' },
];

export function fontStack(family: string): string {
  return (
    FONT_OPTIONS.find((option) => option.value === family)?.stack ??
    `"${family}", ui-sans-serif, system-ui, sans-serif`
  );
}

export interface TextLayerStyles {
  /** The layer box: type scale, alignment, block layout. */
  block: CSSProperties;
  /** The text run itself: stroke, shadow or highlight box. */
  run: CSSProperties;
}

const JUSTIFY: Record<TextLayer["align"], CSSProperties["justifyContent"]> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

export function textLayerStyles(layer: TextLayer): TextLayerStyles {
  const block: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: JUSTIFY[layer.align],
    fontFamily: fontStack(layer.fontFamily),
    fontSize: layer.fontSize,
    lineHeight: 1.15,
    fontWeight: WEIGHT_VALUE[layer.fontWeight],
    textAlign: layer.align,
    color: layer.color,
    overflow: "hidden",
    wordBreak: "break-word",
  };

  const run: CSSProperties = {};

  switch (layer.textStyle) {
    case "outlined":
      run.WebkitTextStrokeWidth = `${layer.outlineWidth}px`;
      run.WebkitTextStrokeColor = layer.outlineColor;
      run.paintOrder = "stroke fill";
      break;
    case "shadowed": {
      // The shadow tracks the outline width so one control drives both, with a
      // floor so "shadowed" is always visibly shadowed.
      const offset = Math.max(2, layer.outlineWidth);
      run.textShadow = `0 ${offset}px 0 ${layer.outlineColor}`;
      break;
    }
    case "highlighted":
      run.backgroundColor = layer.outlineColor;
      run.padding = `${Math.round(layer.fontSize * 0.08)}px ${Math.round(layer.fontSize * 0.2)}px`;
      run.borderRadius = `${Math.round(layer.fontSize * 0.1)}px`;
      run.boxDecorationBreak = "clone";
      run.WebkitBoxDecorationBreak = "clone";
      break;
    case "filled":
      break;
  }

  return { block, run };
}
