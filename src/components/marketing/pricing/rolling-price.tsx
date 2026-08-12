"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { digitRoll } from "@/lib/motion/variants";

/**
 * SPEC §6.5 — "Switching animates the price digits with a vertical roll
 * (`Motion` layout on a digit-by-digit basis), not a hard swap."
 *
 * Each character position is its own `AnimatePresence`, keyed on the character
 * itself, which produces the behaviour that makes this read as a mechanical
 * counter rather than as a crossfade: `$36 → $29` rolls the 3 and the 6 and
 * leaves the `$` completely still, because the `$` position's key never
 * changed.
 *
 * Width is held by an invisible copy of the character underneath the animated
 * ones. Without it the wrapper would collapse mid-roll — both the outgoing and
 * incoming digit are absolutely positioned — and the whole price would twitch
 * sideways every time somebody touched the toggle.
 */
export function RollingPrice({ value, className }: { value: string; className?: string }) {
  return (
    <span data-numeric className={cn("inline-flex", className)}>
      <span className="sr-only">{value}</span>
      {value.split("").map((char, index) => (
        <span
          // Positional: two `9`s in one price are different slots.
          key={`${index}-slot`}
          aria-hidden="true"
          className="relative inline-block overflow-hidden"
        >
          <span className="invisible">{char}</span>
          <AnimatePresence initial={false}>
            <motion.span
              key={char}
              variants={digitRoll}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0"
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
