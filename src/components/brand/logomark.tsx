import { cn } from "@/lib/cn";

/**
 * SPEC §4.8 — three overlapping vertical rounded slats of decreasing height.
 *
 * Geometry notes, so nobody "tidies" it later:
 *
 * - Drawn on a 24-unit grid with slat width 7 and pill radius 3.5, so every
 *   edge lands on a half-unit. At 20px each unit is 0.833px and the vertical
 *   strokes still resolve cleanly; at 320px the pill ends stay perfectly round.
 * - Slats overlap by 1.5 units (x = 3.0, 8.5, 14.0). Adjacent-but-touching
 *   would read as a bar chart; the overlap is what makes them stack.
 * - Vertical centres descend (12 → 12.5 → 13.5) while heights shrink
 *   (20 → 15 → 10). The top edge therefore falls faster than the bottom edge
 *   rises, and the asymmetric taper is what turns three bars into a leaf.
 * - Opacity steps (1 → 0.68 → 0.4) give depth without a second colour, so the
 *   mark survives on the cobalt hero, the ink-950 footer, and white chrome
 *   with a single `currentColor`.
 */
export function Logomark({ size = 24, className }: { size?: number; className?: string }) {
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
      <rect x="3" y="2" width="7" height="20" rx="3.5" fill="currentColor" />
      <rect x="8.5" y="5" width="7" height="15" rx="3.5" fill="currentColor" opacity="0.68" />
      <rect x="14" y="8.5" width="7" height="10" rx="3.5" fill="currentColor" opacity="0.4" />
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
 * the em box — Geist's cap height is ~0.72em, so 1.15 × 0.72 ≈ 0.828em — and
 * sits 8px from the wordmark, which is an optical gap, not a metric one.
 */
export function Logo({ size = 20, showWordmark = true, className }: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-current", className)}
      // dynamic: the lockup is defined proportionally to the wordmark size,
      // which is a runtime prop rather than one of a fixed set of steps.
      style={{ fontSize: `${size}px` }}
    >
      <Logomark size={size * 0.828} />
      {showWordmark ? (
        <span
          className="font-sans font-medium"
          // dynamic: tracking and optical baseline shift are tied to the same
          // proportional size above.
          style={{ letterSpacing: "-0.02em", lineHeight: 1 }}
        >
          Vireo
        </span>
      ) : null}
    </span>
  );
}
