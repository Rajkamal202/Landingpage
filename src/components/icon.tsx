import { cn } from "@/lib/cn";
import type { IconDef } from "./icons";

/** SPEC §4.7 — 1.5px stroke at 16 and 20, 2px at 24. Never mixed. */
const STROKE: Record<IconSize, number> = { 16: 1.5, 20: 1.5, 24: 2 };

export type IconSize = 16 | 20 | 24;

export interface IconProps {
  glyph: IconDef;
  size?: IconSize;
  className?: string;
  /**
   * Icons are decorative by default — the control around them carries the
   * accessible name. Pass a label only when the icon is the sole content of a
   * non-interactive element and its meaning is not otherwise available.
   */
  label?: string;
}

export function Icon({ glyph, size = 16, className, label }: IconProps) {
  const Glyph = glyph.glyph;
  const [nx = 0, ny = 0] = glyph.nudge ?? [];
  const scale = size / 16;
  const shifted = nx !== 0 || ny !== 0;

  return (
    <Glyph
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      width={size}
      height={size}
      strokeWidth={STROKE[size]}
      className={cn("shrink-0", className)}
      // dynamic: sub-pixel optical correction from the per-glyph nudge table;
      // the value is data, not a design decision made at the call site.
      style={
        shifted
          ? { transform: `translate(${nx * scale}px, ${ny * scale}px)` }
          : undefined
      }
    />
  );
}
