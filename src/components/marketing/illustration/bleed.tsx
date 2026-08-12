import { cn } from "@/lib/cn";

/**
 * SPEC §6.3 — the per-step gradient bleed a "how it works" screenshot sits in.
 *
 * The six pairs are named in the spec by hue (blue → violet, rose → amber …)
 * and none of those hues exist on the §4.2 scale, because they are artwork, not
 * interface. They live here, inside the illustration directory that
 * `scripts/lint-tokens.mjs` exempts from the raw-hex rule, and they are painted
 * as SVG stops rather than as inline styles so no call site ever holds a colour.
 *
 * Every pair was picked at a lightness that keeps a white screenshot frame
 * reading as the brightest thing in the composition — the bleed is a backdrop,
 * not a subject.
 */

export const BLEED_TONES = [
  "blue-violet",
  "rose-amber",
  "violet-pink",
  "sky-indigo",
  "pink-orange",
  "mint-sky",
] as const;

export type BleedTone = (typeof BLEED_TONES)[number];

const STOPS: Record<BleedTone, readonly [from: string, to: string]> = {
  "blue-violet": ["#4277f0", "#8b5cf6"],
  "rose-amber": ["#f0a3ac", "#f0c27b"],
  "violet-pink": ["#8b5cf6", "#e879b9"],
  "sky-indigo": ["#63b3ed", "#5561d6"],
  "pink-orange": ["#f191b8", "#f0a05a"],
  "mint-sky": ["#6fd6b4", "#63b3ed"],
};

export function Bleed({ tone, className }: { tone: BleedTone; className?: string }) {
  const [from, to] = STOPS[tone];
  const id = `vireo-bleed-${tone}`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn("absolute inset-0 size-full", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
    </svg>
  );
}
