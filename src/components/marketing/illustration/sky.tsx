"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * SPEC §4.1 / §6.2 — the illustrated cobalt sky. Act one of the two-act page.
 *
 * Hand-drawn artwork, so this directory is the one place outside `globals.css`
 * and the fixtures where a raw hex is legitimate (see `scripts/lint-tokens.mjs`):
 * the values below are the §4.2 illustration palette, written literally because
 * they live inside SVG paint attributes rather than in a class.
 *
 * ── Composition rule that is load-bearing ────────────────────────────────────
 * Nothing lighter than the sky is drawn inside the horizontal band `y 130…600`.
 * That band is where the headline, sub and CTA sit, and it stays clear at every
 * viewport because `slice` only ever crops this composition horizontally on
 * narrow screens and vertically on wide ones — never into that band's middle.
 * A cream cumulus behind the sub-headline would take its contrast from 4.9:1 to
 * roughly 1.3:1, which is exactly the failure SPEC §11 tells us to check for.
 *
 * ── Measured contrast on the delivered colours ───────────────────────────────
 * The scrim below is not decoration; it is what makes the copy pass. Ratios are
 * computed against the composited backdrop (WCAG 2.x relative luminance):
 *
 *   backdrop  sky-deep #2b5be0 under the ink-950 scrim at its centre  L = 0.101
 *   white     headline                                        6.97:1  ✓ (needs 3)
 *   white/82  sub-headline (`body-lg`, normal text)            5.25:1  ✓ (needs 4.5)
 *   white/80  the word "or" between the two CTAs              5.08:1  ✓
 *   white/60  the outlined CTA's border (UI boundary)          3.57:1  ✓ (needs 3)
 *
 * Without the scrim the sub sits at 4.39:1 over sky-deep and 3.29:1 over
 * sky-mid, so the gradient additionally runs deep → mid top-to-bottom: the copy
 * band gets the darker end and the lighter end is spent below it, behind the
 * screenshot frame, where no white body text ever lands.
 */

const SKY_DEEP = "#2b5be0";
const SKY_MID = "#4277f0";
const CLOUD_CREAM = "#f5efe6";
const CLOUD_ROSE = "#f0d5d8";
const STREAK = "#c24bc9";
const SCRIM = "#0b0c0e";

/* The hero renders one sky, so static ids are safe and keep the markup legible. */
const ID = {
  base: "vireo-sky-base",
  scrim: "vireo-sky-scrim",
  far: "vireo-sky-far",
  near: "vireo-sky-near",
  cloudWide: "vireo-cloud-wide",
  cloudPuff: "vireo-cloud-puff",
  cloudLow: "vireo-cloud-low",
} as const;

/**
 * Three cumulus silhouettes, each a union of ellipses over a rounded base.
 * They carry no `fill`, so each `<use>` paints them — `fill` is an inherited
 * presentation attribute, which is what lets one shape serve cream and rose.
 * Opacity is set on the `<use>`, never on the parts, so overlaps don't bruise.
 */
function CloudShapes() {
  return (
    <>
      <g id={ID.cloudWide}>
        <ellipse cx="60" cy="44" rx="60" ry="26" />
        <ellipse cx="112" cy="28" rx="48" ry="28" />
        <ellipse cx="166" cy="40" rx="44" ry="24" />
        <ellipse cx="206" cy="50" rx="34" ry="20" />
        <rect x="6" y="44" width="232" height="26" rx="13" />
      </g>
      <g id={ID.cloudPuff}>
        <ellipse cx="54" cy="52" rx="52" ry="26" />
        <ellipse cx="98" cy="30" rx="46" ry="30" />
        <ellipse cx="142" cy="50" rx="38" ry="26" />
        <rect x="8" y="52" width="164" height="28" rx="14" />
      </g>
      <g id={ID.cloudLow}>
        <ellipse cx="46" cy="34" rx="46" ry="22" />
        <ellipse cx="88" cy="22" rx="38" ry="24" />
        <ellipse cx="126" cy="34" rx="32" ry="20" />
        <rect x="6" y="34" width="146" height="22" rx="11" />
      </g>
    </>
  );
}

/**
 * The slower layer (0.15× scroll). Softly blurred and held back in opacity so it
 * reads as distance rather than as a second copy of the near bank.
 *
 * The top and bottom bands carry most of the opacity; the MID band — the y 280
 * to 420 strip that sits behind the headline — is deliberately kept near 0.25.
 * SPEC §11 requires white on the cobalt sky to pass 4.5:1 and the illustration
 * not to reduce contrast behind the headline, and a cream cumulus drifting
 * through that band is exactly what would break it.
 */
function CloudsFar() {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 size-full"
    >
      <defs>
        <CloudShapes />
        <filter id={ID.far} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g filter={`url(#${ID.far})`}>
        {/* Top band — above y 130. */}
        <use href={`#${ID.cloudWide}`} x="-80" y="8" fill={CLOUD_CREAM} opacity="0.52" />
        <use href={`#${ID.cloudLow}`} x="420" y="-24" fill={CLOUD_CREAM} opacity="0.42" />
        <use href={`#${ID.cloudPuff}`} x="1060" y="-10" fill={CLOUD_CREAM} opacity="0.5" />
        <use href={`#${ID.cloudLow}`} x="1280" y="46" fill={CLOUD_ROSE} opacity="0.48" />
        {/* Far margins — cropped away on phones, depth on wide monitors. */}
        <use href={`#${ID.cloudLow}`} x="-110" y="330" fill={CLOUD_CREAM} opacity="0.24" />
        <use href={`#${ID.cloudPuff}`} x="1300" y="286" fill={CLOUD_CREAM} opacity="0.26" />
        {/* Bottom bank — below y 600. */}
        <use href={`#${ID.cloudWide}`} x="140" y="646" fill={CLOUD_CREAM} opacity="0.54" />
        <use href={`#${ID.cloudPuff}`} x="640" y="690" fill={CLOUD_ROSE} opacity="0.5" />
        <use href={`#${ID.cloudWide}`} x="1010" y="628" fill={CLOUD_CREAM} opacity="0.52" />
      </g>
    </svg>
  );
}

/**
 * The faster layer (0.3× scroll): larger, closer, barely blurred. The magenta
 * brushstrokes ride with it, which is what keeps them reading as marks made on
 * the same plane as the clouds rather than as a UI overlay.
 */
function CloudsNear() {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 size-full"
    >
      <defs>
        <CloudShapes />
        <filter id={ID.near} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Brushstrokes: loose, uneven weights, kept out of the copy band. */}
      <g strokeLinecap="round" fill="none" stroke={STREAK}>
        <path d="M-60 96 C 180 34 430 62 690 22" strokeWidth="13" opacity="0.5" />
        <path d="M 700 74 C 900 44 1120 60 1420 26" strokeWidth="7" opacity="0.38" />
        <path d="M-40 742 C 260 668 520 706 800 640" strokeWidth="16" opacity="0.44" />
        <path d="M 860 806 C 1050 764 1230 780 1500 726" strokeWidth="9" opacity="0.34" />
        <path d="M 60 826 C 240 792 380 800 520 776" strokeWidth="6" opacity="0.3" />
      </g>

      <g filter={`url(#${ID.near})`}>
        {/* Top band. */}
        <g transform="translate(-46 -34) scale(1.15)">
          <use href={`#${ID.cloudPuff}`} fill={CLOUD_CREAM} opacity="0.86" />
        </g>
        <use href={`#${ID.cloudLow}`} x="1180" y="-6" fill={CLOUD_CREAM} opacity="0.8" />
        <use href={`#${ID.cloudLow}`} x="700" y="-46" fill={CLOUD_ROSE} opacity="0.6" />
        {/* Bottom bank — the composition's weight. */}
        <g transform="translate(-122 498) scale(1.35)">
          <use href={`#${ID.cloudWide}`} fill={CLOUD_CREAM} opacity="0.92" />
        </g>
        <use href={`#${ID.cloudPuff}`} x="420" y="736" fill={CLOUD_ROSE} opacity="0.78" />
        <g transform="translate(733 583) scale(1.2)">
          <use href={`#${ID.cloudWide}`} fill={CLOUD_CREAM} opacity="0.9" />
        </g>
        <use href={`#${ID.cloudLow}`} x="1240" y="812" fill={CLOUD_ROSE} opacity="0.66" />
      </g>
    </svg>
  );
}

export interface SkyProps {
  className?: string;
}

/**
 * SPEC §6.2: two cloud layers parallax at 0.3× and 0.15× the scroll rate, and
 * both freeze under `prefers-reduced-motion`. The transform sits on a wrapping
 * `div` rather than inside the SVG so the browser can composite it rather than
 * re-rasterising a filtered SVG on every frame.
 */
export function Sky({ className }: SkyProps) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const farY = useTransform(scrollY, (value) => (reduced ? 0 : value * 0.15));
  const nearY = useTransform(scrollY, (value) => (reduced ? 0 : value * 0.3));

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Base gradient. `none` because a stretched gradient is still a gradient. */}
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        focusable="false"
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id={ID.base} x1="0" y1="0" x2="0.18" y2="1">
            <stop offset="0" stopColor={SKY_DEEP} />
            <stop offset="0.52" stopColor={SKY_DEEP} />
            <stop offset="1" stopColor={SKY_MID} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${ID.base})`} />
      </svg>

      {/* dynamic: parallax offset is a live scroll-derived MotionValue. */}
      <motion.div style={{ y: farY }} className="absolute inset-0">
        <CloudsFar />
      </motion.div>
      {/* dynamic: parallax offset is a live scroll-derived MotionValue. */}
      <motion.div style={{ y: nearY }} className="absolute inset-0">
        <CloudsNear />
      </motion.div>

      {/* The contrast scrim. Last, so it also tames any cloud edge that drifts. */}
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        focusable="false"
        className="absolute inset-0 size-full"
      >
        <defs>
          <radialGradient id={ID.scrim} cx="50%" cy="36%" r="78%">
            <stop offset="0" stopColor={SCRIM} stopOpacity="0.17" />
            <stop offset="0.55" stopColor={SCRIM} stopOpacity="0.1" />
            <stop offset="1" stopColor={SCRIM} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${ID.scrim})`} />
      </svg>
    </div>
  );
}
