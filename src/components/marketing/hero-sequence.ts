import type { Transition } from "motion/react";
import { dur, ease } from "@/lib/motion/tokens";

/**
 * SPEC §6.2 — "One timeline, not six independent animations."
 *
 * The hero load is authored here as a single set of offsets rather than as a
 * delay typed into each component, because the nav pill lives in the marketing
 * shell and the rest lives in the hero: two files, one choreography. Anything
 * that participates in the load reads its beat from this object.
 *
 *   0.00  sky fades up
 *   0.12  nav pill drops 8px into place
 *   0.22  headline line one rises
 *   0.28  headline line two rises        (60ms stagger, per spec)
 *   0.36  sub
 *   0.46  CTA scales 0.98 → 1
 *   0.54  screenshot rises 24px, scales 0.96 → 1
 *
 * Last beat ends at 0.54 + 0.42 = 0.96s, which is the "~900ms" the spec asks
 * for measured to the final frame rather than to the final trigger.
 */
export const HERO_BEATS = {
  sky: 0,
  nav: 0.12,
  headline: 0.22,
  /** SPEC §6.2: headline lines are staggered 60ms. */
  headlineStagger: 0.06,
  sub: 0.36,
  cta: 0.46,
  screenshot: 0.54,
} as const;

/**
 * Reduced motion collapses the stagger to zero rather than playing a
 * one-second staged fade at the user who asked for less movement. Motion's
 * `reducedMotion="user"` already strips the transforms; this strips the wait.
 */
export function heroBeat(delay: number, reduced: boolean | null): Transition {
  return { duration: dur.slow, ease: ease.out, delay: reduced ? 0 : delay };
}

export function navBeat(reduced: boolean | null): Transition {
  return { duration: dur.base, ease: ease.out, delay: reduced ? 0 : HERO_BEATS.nav };
}
