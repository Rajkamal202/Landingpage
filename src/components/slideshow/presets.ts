import type { TextStyleName } from "@/lib/schemas";
import type { TextLayer } from "./text-style";

/**
 * The style presets behind SPEC §8.6's "Style — a style preset select".
 *
 * A preset is a typographic decision applied across a whole variation, which is
 * what makes it worth having: it is the control that keeps five slides looking
 * like one ad. It deliberately does not touch content, position or colour —
 * those are the user's per-layer choices and a preset that overwrote them would
 * be a reset button wearing a select's clothes.
 *
 * The first entry matches the imported template's stored preset name, so the
 * select opens on the value the document already has rather than on "Custom".
 */
export interface StylePreset {
  name: string;
  /** Shown next to the option — says what changes, not how it works. */
  hint: string;
  textStyle: TextStyleName;
  fontFamily: string;
  fontWeight: TextLayer["fontWeight"];
  align: TextLayer["align"];
}

export const STYLE_PRESETS: readonly StylePreset[] = [
  {
    name: "Bold sans, centred",
    hint: "Heavy centred sans",
    textStyle: "filled",
    fontFamily: "Inter",
    fontWeight: "bold",
    align: "center",
  },
  {
    name: "Outlined caption",
    hint: "Stroked, reads over busy footage",
    textStyle: "outlined",
    fontFamily: "Helvetica Neue",
    fontWeight: "bold",
    align: "center",
  },
  {
    name: "Highlight block",
    hint: "Boxed lines, left aligned",
    textStyle: "highlighted",
    fontFamily: "Inter",
    fontWeight: "semibold",
    align: "left",
  },
  {
    name: "Soft shadow, left",
    hint: "Dropped shadow under each line",
    textStyle: "shadowed",
    fontFamily: "Inter",
    fontWeight: "semibold",
    align: "left",
  },
  {
    name: "Editorial serif",
    hint: "Quieter, longer-form copy",
    textStyle: "filled",
    fontFamily: "Georgia",
    fontWeight: "normal",
    align: "left",
  },
  {
    name: "Poster impact",
    hint: "Condensed, all-caps energy",
    textStyle: "outlined",
    fontFamily: "Impact",
    fontWeight: "bold",
    align: "center",
  },
];

export function findPreset(name: string): StylePreset | undefined {
  return STYLE_PRESETS.find((preset) => preset.name === name);
}
