import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `tailwind-merge` resolves conflicts by knowing which utilities belong to
 * which group. Our theme replaces Tailwind's scales wholesale (SPEC §4), so
 * the stock configuration would misclassify almost every token we own —
 * `text-display-lg` would be read as a *colour* and silently dropped by a
 * later `text-ink-500`. That failure is invisible until a heading renders at
 * body size in production, so the scales are declared here explicitly.
 *
 * Keep in lockstep with `src/app/globals.css`.
 */

const FONT_SIZES = [
  "display-xl",
  "display-lg",
  "display-md",
  "title-lg",
  "title-md",
  "body-lg",
  "body-md",
  "body-sm",
  "label",
  "hero-sm",
  "hero-md",
  "hero-lg",
] as const;

const SPACING = [
  "px",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "8",
  "10",
  "12",
  "16",
  "20",
  "24",
  "32",
  "topbar",
  "panel",
  "sheet",
  "track-head",
  "rail",
  "control-sm",
  "control-md",
  "control-lg",
] as const;

const RADII = ["sm", "md", "lg", "xl", "pill"] as const;

const SHADOWS = ["elev-1", "elev-2", "elev-3", "elev-4"] as const;

const twMerge = extendTailwindMerge({
  override: {
    theme: {
      text: [...FONT_SIZES],
      spacing: [...SPACING],
      radius: [...RADII],
      shadow: [...SHADOWS],
      ease: ["out", "in-out", "linear"],
      animate: ["spin", "shimmer", "dash"],
    },
    classGroups: {
      // `eyebrow` and `mono-sm` set font-size, so they conflict with the
      // scale above; `transition-ui` is our only transition shorthand.
      "font-size": [{ text: [...FONT_SIZES] }, "eyebrow", "mono-sm"],
      transition: [{ transition: ["none"] }, "transition-ui"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
