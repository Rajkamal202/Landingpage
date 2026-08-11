"use client";

import { MotionConfig } from "motion/react";

/**
 * Root providers — deliberately almost empty.
 *
 * Only what *every* route needs lives here. TanStack Query, the shortcut
 * registry and the toaster are mounted in the app shell instead, because
 * shipping them to the marketing page costs it real bundle weight for
 * machinery no marketing route uses (SPEC §13: Lighthouse ≥95 on `/`).
 *
 * `reducedMotion="user"` is global: it makes every Motion component honour the
 * OS setting without a per-component guard, and the CSS media query in
 * `globals.css` covers plain CSS transitions. Between the two, SPEC §4.6's
 * "implement this once, globally" is satisfied.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
