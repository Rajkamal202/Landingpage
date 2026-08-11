import type { Transition, Variants } from "motion/react";
import { dur, ease, reveal } from "./tokens";

/**
 * The SPEC §4.6 rules expressed as objects, so no component ever retypes a
 * duration or an easing curve. Import a variant, don't author one.
 */

export const transition = {
  instant: { duration: dur.instant, ease: ease.out },
  fast: { duration: dur.fast, ease: ease.out },
  base: { duration: dur.base, ease: ease.out },
  slow: { duration: dur.slow, ease: ease.out },
} satisfies Record<string, Transition>;

/** Elements entering the viewport: rise 12px and fade in. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: reveal.distance },
  visible: { opacity: 1, y: 0, transition: transition.slow },
};

/** Parent of a revealed group — staggers children 40ms apart. */
export const staggerGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: reveal.stagger } },
};

/** Popovers, dropdowns, menus, tooltips — origin-aware scale + rise. */
export const popSurface: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transition.fast },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: transition.instant },
};

/** Dialogs — a longer beat and a shallower scale than a popover. */
export const dialogSurface: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: transition.fast },
};

export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
  exit: { opacity: 0, transition: transition.fast },
};

/** Right-side Sheet. */
export const sheetSurface: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: transition.base },
  exit: { x: "100%", transition: transition.fast },
};

/** A digit rolling vertically — pricing toggle (SPEC §6.5). */
export const digitRoll: Variants = {
  hidden: { y: "-100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: transition.base },
  exit: { y: "100%", opacity: 0, transition: transition.base },
};

/** Rejected connection / invalid input — a short, non-decorative shake. */
export const shake: Variants = {
  idle: { x: 0 },
  shake: { x: [0, -4, 4, -3, 3, 0], transition: { duration: dur.base, ease: ease.inOut } },
};
