"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { reveal } from "@/lib/motion/tokens";
import { transition } from "@/lib/motion/variants";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Icon } from "@/components/icon";
import { IconCheck, IconMinus } from "@/components/icons";
import { Container, Section, SectionHeading } from "./section";
import { SECTION_IDS } from "./site-links";

/**
 * SPEC §6.4 — two rejected options fanned out behind the one we are arguing for.
 *
 * Two decisions worth recording:
 *
 * - **The rotation is a Motion value, not a class.** It has to animate from a
 *   wider angle to its resting angle, and it has to be zero below 768px, so a
 *   transform utility would have to be fought rather than used. Under
 *   `prefers-reduced-motion` Motion applies the resting transform instantly
 *   instead of tweening it, so the composition survives without the movement.
 * - **The de-emphasised rows are `ink-500`, not `ink-400`.** SPEC §6.4 asks for
 *   ink-400, which measures 3.1:1 on white — below the 4.5:1 SPEC §11 requires
 *   for body copy. The muted `−` chip keeps the quieter tone; the sentence next
 *   to it stays readable. Scale, rotation and elevation already carry the
 *   hierarchy without borrowing legibility to do it.
 */

const AGENCY_ROWS = [
  "$5k+ per month",
  "Endless retakes and reshoots",
  "Weeks of turnaround",
  "Coordination overhead",
] as const;

const VIREO_ROWS = [
  "Clone any high-performing video in minutes",
  "Reusable AI actors",
  "Fan one template into many variations",
  "A fraction of the cost, at 10× the pace",
] as const;

const CREATOR_ROWS = [
  "$500+ per video",
  "Long revision cycles",
  "Inconsistent quality",
  "Can't scale with demand",
] as const;

/** Resting angles, and the wider angles they settle in from. */
const REST = 1.5;
const ENTER = 4.5;

export function Comparison() {
  const fanned = useMediaQuery("(min-width: 768px)");

  return (
    <Section id={SECTION_IDS.comparison} className="bg-surface">
      <Container className="flex flex-col gap-12 lg:gap-16">
        <SectionHeading
          title="The alternatives are expensive and slow."
          sub="Agencies and one-off creators add cost, revision cycles, and coordination. Vireo keeps production in-house and repeatable."
        />

        <div className="rounded-xl bg-ink-50 p-6 md:p-10 lg:p-16">
          <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:items-center md:gap-5 lg:gap-8">
            <AsideCard
              title="Agencies"
              rows={AGENCY_ROWS}
              angle={fanned ? -REST : 0}
              from={fanned ? -ENTER : 0}
              fanned={fanned}
            />

            <motion.article
              initial={{ scale: 0.97, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={reveal.viewport}
              transition={transition.slow}
              className={cn(
                "relative order-first rounded-xl bg-surface p-6 shadow-elev-3 md:order-none lg:p-8",
              )}
            >
              <span
                aria-hidden="true"
                className="absolute right-6 top-6 grid size-8 place-items-center rounded-pill bg-ink-950 text-white"
              >
                <Icon glyph={IconCheck} size={20} />
              </span>
              <h3 className="text-title-lg pr-10 text-ink-950">With Vireo</h3>
              <ul className="mt-6 flex flex-col gap-4">
                {VIREO_ROWS.map((row) => (
                  <li key={row} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0 grid size-5 shrink-0 place-items-center rounded-pill bg-ink-950 text-white"
                    >
                      <Icon glyph={IconCheck} size={16} />
                    </span>
                    <span className="text-body-md text-ink-950">{row}</span>
                  </li>
                ))}
              </ul>
            </motion.article>

            <AsideCard
              title="Creators"
              rows={CREATOR_ROWS}
              angle={fanned ? REST : 0}
              from={fanned ? ENTER : 0}
              fanned={fanned}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function AsideCard({
  title,
  rows,
  angle,
  from,
  fanned,
}: {
  title: string;
  rows: readonly string[];
  angle: number;
  from: number;
  fanned: boolean;
}) {
  return (
    <motion.article
      initial={{ rotate: from, scale: fanned ? 0.92 : 1, opacity: 0 }}
      whileInView={{ rotate: angle, scale: fanned ? 0.92 : 1, opacity: 1 }}
      viewport={reveal.viewport}
      transition={transition.slow}
      className="rounded-xl border border-ink-200 bg-surface p-6 shadow-elev-1"
    >
      <h3 className="text-title-lg text-ink-500">{title}</h3>
      <ul className="mt-6 flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-5 shrink-0 place-items-center rounded-pill bg-ink-100 text-ink-500"
            >
              <Icon glyph={IconMinus} size={16} />
            </span>
            <span className="text-body-md text-ink-500">{row}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
