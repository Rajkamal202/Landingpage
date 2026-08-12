"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { CLONE_STEPS, type CloneProgress } from "@/lib/schemas";
import { transition } from "@/lib/motion/variants";
import { Icon } from "@/components/icon";
import { IconCheck } from "@/components/icons";
import { ProgressRing } from "@/components/ui/progress";

/**
 * SPEC §8.1 — the six substeps, each checking off as it lands.
 *
 * Every value here comes off the real stream: which step is running, how far
 * through it is, and how many scenes have been detected so far. Nothing is on
 * a timer, so if the work slows down the interface says so.
 */
export function CloneSteps({ progress }: { progress: CloneProgress | null }) {
  const activeIndex = progress?.stepIndex ?? 0;
  const stepCount = CLONE_STEPS.length;
  const withinStep = progress
    ? Math.max(0, Math.min(1, (progress.percent / 100) * stepCount - progress.stepIndex))
    : 0;

  return (
    <ol className="flex flex-col gap-3" aria-label="Clone progress">
      {CLONE_STEPS.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;

        return (
          <li key={step.id} className="flex items-center gap-3">
            <span className="grid size-5 shrink-0 place-items-center">
              {done ? (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={transition.fast}
                  className="grid size-5 place-items-center rounded-pill bg-success text-white"
                >
                  <Icon glyph={IconCheck} size={16} />
                </motion.span>
              ) : active ? (
                <span className="text-brand-500">
                  <ProgressRing value={withinStep * 100} size={20} strokeWidth={2} />
                </span>
              ) : (
                <span className="size-2 rounded-pill bg-ink-300" />
              )}
            </span>

            <span
              className={cn(
                "text-body-md transition-ui duration-(--dur-fast)",
                done && "text-ink-500",
                active && "font-medium text-ink-950",
                !done && !active && "text-ink-500",
              )}
            >
              {step.label}
            </span>

            {active ? (
              <span className="mono-sm ml-auto text-ink-400" aria-hidden="true">
                {Math.round(withinStep * 100)}%
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
