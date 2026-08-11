"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * SPEC §4.8 — three overlapping vertical rounded slats of decreasing height,
 * reading as both stacked clips in a timeline and a stylised leaf.
 *
 * Geometry notes, so nobody "tidies" it later:
 *
 * - 24-unit grid, slat width 6, radius 3 (fully rounded ends). A 1:3.3 slat
 *   reads as a slat; the first pass used 1:2.9 and read as a fat lozenge.
 * - Slats overlap by 1 unit (x = 3, 8, 13). Adjacent-but-touching would read
 *   as a bar chart; the overlap is what makes them stack.
 * - The slat in front knocks a 1-unit gap out of the one behind, via the mask
 *   below. Relying on opacity alone to separate them turned the mark into a
 *   smudge at 20px — the knockout keeps every edge crisp at nav size, and the
 *   opacity step then adds depth at display size.
 * - Tops descend 4 units each (2 → 6 → 10) while bottoms rise only 1 then 2
 *   (22 → 21 → 19). The asymmetric taper is what turns three bars into a leaf.
 * - Everything is `currentColor`, so one mark works on the cobalt hero, the
 *   ink-950 footer and white app chrome.
 */
export function Logomark({ size = 24, className }: { size?: number; className?: string }) {
  const id = useId();
  const maskB = `${id}-b`;
  const maskC = `${id}-c`;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <defs>
        {/* Each mask hides the 1-unit band where the next slat forward sits. */}
        <mask id={maskB}>
          <rect width="24" height="24" fill="white" />
          <rect x="3" y="1" width="8" height="22" rx="4" fill="black" />
        </mask>
        <mask id={maskC}>
          <rect width="24" height="24" fill="white" />
          <rect x="8" y="5" width="8" height="17" rx="4" fill="black" />
        </mask>
      </defs>

      <rect x="14" y="10" width="6" height="9" rx="3" fill="currentColor" opacity="0.52" mask={`url(#${maskC})`} />
      <rect x="9" y="6" width="6" height="15" rx="3" fill="currentColor" opacity="0.76" mask={`url(#${maskB})`} />
      <rect x="4" y="2" width="6" height="20" rx="3" fill="currentColor" />
    </svg>
  );
}

export interface LogoProps {
  /** Wordmark font size in px; the mark scales from it optically. */
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Mark + wordmark lockup. The mark is set to 1.15× cap height rather than to
 * the em box — Geist's cap height is ~0.72em, so 1.15 × 0.72 ≈ 0.83em — and
 * sits 8px from the wordmark, which is an optical gap, not a metric one.
 */
export function Logo({ size = 20, showWordmark = true, className }: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-current", className)}
      // dynamic: the lockup is proportional to the wordmark size, which is a
      // runtime prop rather than one of a fixed set of steps.
      style={{ fontSize: `${size}px` }}
    >
      <Logomark size={size * 0.83} />
      {showWordmark ? (
        <span
          className="font-sans font-medium"
          // dynamic: tracking and leading are tied to the proportional size.
          style={{ letterSpacing: "-0.02em", lineHeight: 1 }}
        >
          Vireo
        </span>
      ) : null}
    </span>
  );
}
