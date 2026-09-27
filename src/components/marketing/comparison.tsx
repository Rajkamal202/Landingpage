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

const AGENCY_ROWS = [
  "$5k–$15k/mo monthly retainers",
  "3–4 weeks for a single cut",
  "Endless reshoots and talent fees",
  "Slow testing cycle kills momentum",
] as const;

const AVELON_ROWS = [
  "Clone winning ad formats in minutes",
  "Photorealistic AI UGC actors & voices",
  "Studio photoshoot sets (Calacatta, Kyoto, etc.)",
  "10× creative variations at 90% lower cost",
  "Private beta early access with 50 free credits",
] as const;

const CREATOR_ROWS = [
  "$300–$800 per raw video clip",
  "High ghosting and revision latency",
  "Inconsistent lighting & audio quality",
  "Impossible to scale across 20+ hooks",
] as const;

const REST = 1.5;
const ENTER = 4.5;

export function Comparison() {
  const fanned = useMediaQuery("(min-width: 768px)");

  return (
    <Section id={SECTION_IDS.comparison} className="bg-surface">
      <Container className="flex flex-col gap-12 lg:gap-16">
        <SectionHeading
          title="Traditional ad production is too slow for modern DTC."
          sub="Agencies and freelance creators add heavy retainers, slow revision loops, and creative fatigue. Avelon puts an agile AI video studio in your browser."
        />

        <div className="rounded-2xl bg-ink-50 p-6 md:p-10 lg:p-16 border border-ink-100">
          <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:items-center md:gap-5 lg:gap-8">
            <AsideCard
              title="Creative Agencies"
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
                "relative order-first rounded-2xl bg-surface p-6 shadow-elev-4 md:order-none lg:p-8 border-2 border-brand-500",
              )}
            >
              <div className="flex items-center justify-between pb-2">
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
                  Coming Soon
                </span>
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-pill bg-brand-600 text-white shadow-sm"
                >
                  <Icon glyph={IconCheck} size={20} />
                </span>
              </div>
              <h3 className="text-title-lg text-ink-950 font-sans tracking-tight">With Avelon</h3>
              <ul className="mt-6 flex flex-col gap-4">
                {AVELON_ROWS.map((row) => (
                  <li key={row} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill bg-emerald-500 text-white"
                    >
                      <Icon glyph={IconCheck} size={16} />
                    </span>
                    <span className="text-body-md text-ink-950 font-medium">{row}</span>
                  </li>
                ))}
              </ul>
            </motion.article>

            <AsideCard
              title="Freelance Creators"
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
      initial={{ rotate: from, opacity: 0 }}
      whileInView={{ rotate: angle, opacity: 1 }}
      viewport={reveal.viewport}
      transition={transition.slow}
      // dynamic: resting angle transforms originate from the center-bottom pivot
      style={{ transformOrigin: "center bottom" }}
      className={cn(
        "rounded-xl bg-surface/80 p-6 shadow-elev-1 transition-shadow hover:shadow-elev-2",
        !fanned && "transform-none",
      )}
    >
      <h3 className="text-title-md text-ink-700">{title}</h3>
      <ul className="mt-5 flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row} className="flex items-start gap-3 text-body-sm text-ink-500">
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-pill bg-ink-200 text-ink-500"
            >
              <Icon glyph={IconMinus} size={16} />
            </span>
            <span>{row}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
