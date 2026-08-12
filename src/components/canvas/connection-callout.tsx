"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { popSurface } from "@/lib/motion/variants";
import { useCanvasStore } from "@/lib/stores/canvas";
import { Icon } from "@/components/icon";
import { IconBlocked } from "@/components/icons";

/**
 * The explanation half of a rejected connection (SPEC §8.4 — "reject
 * incompatible connections with a shake and a tooltip explaining the
 * mismatch"). The node shakes; this says why, at the point where the wire was
 * dropped, in the same tone as every other error in the product.
 *
 * It is `aria-hidden` on purpose: the same sentence is already pushed to the
 * canvas live region, and announcing it twice is worse than once.
 */
const DISMISS_MS = 3600;

export function ConnectionCallout() {
  const rejection = useCanvasStore((state) => state.rejection);
  const clearRejection = useCanvasStore((state) => state.clearRejection);

  React.useEffect(() => {
    if (!rejection) return;
    const timer = window.setTimeout(clearRejection, DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [rejection, clearRejection]);

  return (
    <AnimatePresence>
      {rejection ? (
        <motion.div
          key={rejection.id}
          variants={popSurface}
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-hidden="true"
          // dynamic: the callout is placed at the viewport coordinates where
          // the wire was dropped, so the explanation lands under the pointer.
          style={{ left: rejection.x, top: rejection.y }}
          className={cn(
            "pointer-events-none fixed z-(--z-dropdown) max-w-panel -translate-x-1/2 translate-y-3",
            "flex items-start gap-2 rounded-md border border-ink-200 bg-surface px-3 py-2",
            "text-body-sm text-ink-700 shadow-elev-3",
          )}
        >
          <Icon glyph={IconBlocked} size={16} className="mt-px shrink-0 text-danger" />
          <span>{rejection.message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
