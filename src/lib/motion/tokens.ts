/**
 * SPEC §4.6 motion tokens, mirrored for Motion.
 *
 * CSS reads these from `globals.css`; JS reads them from here. They are the
 * same numbers in two syntaxes — if one changes, change both. Nothing in the
 * codebase should ever type a raw duration or cubic-bezier.
 */

export const dur = {
  /** 90ms — hover, colour change */
  instant: 0.09,
  /** 160ms — dropdowns, tooltips, toggles */
  fast: 0.16,
  /** 240ms — dialogs, panels, tab switches */
  base: 0.24,
  /** 420ms — page transitions, hero reveal */
  slow: 0.42,
} as const;

type Bezier = [number, number, number, number];

export const ease: { out: Bezier; inOut: Bezier } = {
  /** Default. Decelerates hard and late — this is what "expensive" feels like. */
  out: [0.32, 0.72, 0, 1],
  inOut: [0.65, 0, 0.35, 1],
};

/** SPEC §4.6 `spring(1, 90, 14, 0)` — drag release physics. */
export const spring = {
  release: { type: "spring", mass: 1, stiffness: 90, damping: 14, velocity: 0 },
} as const;

/** Entering the viewport: rise 12px, fade in, 40ms per sibling. */
export const reveal = {
  distance: 12,
  stagger: 0.04,
  /** Fire once, at 20% visibility. */
  viewport: { once: true, amount: 0.2 },
} as const;
