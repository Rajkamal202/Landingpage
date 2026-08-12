"use client";

import { motion, useReducedMotion } from "motion/react";
import { Container } from "./section";
import { HeroCta } from "./hero-cta";
import { ProductFrame } from "./product-frame";
import { Sky } from "./illustration/sky";
import { HERO_BEATS, heroBeat } from "./hero-sequence";

/**
 * SPEC §6.2 — act one.
 *
 * Height: the copy stack occupies the viewport less 80px (`min-h-dvh` with an
 * 80px reserve at the foot), and the screenshot frame is pulled up into that
 * reserve so its top edge lands right at the fold. The frame then carries a
 * negative bottom margin, so it bleeds past the sky and overlaps the white
 * section below — which is the "bleeding off the bottom of the viewport" the
 * spec asks for, and it survives every viewport height rather than only the
 * one it was eyeballed at.
 *
 * Contrast is handled in `illustration/sky.tsx`, where the numbers are.
 */

const HEADLINE_LINES = ["Your AI short-form ads", "editor at scale"] as const;

const HERO_POSTERS = [
  { id: "clip-01", src: "/media/posters/clip-01.jpg" },
  { id: "clip-07", src: "/media/posters/clip-07.jpg" },
  { id: "clip-12", src: "/media/posters/clip-12.jpg" },
  { id: "clip-18", src: "/media/posters/clip-18.jpg" },
  { id: "clip-22", src: "/media/posters/clip-22.jpg" },
] as const;

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={heroBeat(HERO_BEATS.sky, reduced)}
        className="absolute inset-0"
      >
        <Sky />
      </motion.div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-marketing flex-col px-6 pb-20 pt-32 lg:px-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-hero-sm md:text-hero-md lg:text-hero-lg max-w-marketing text-white">
            {HEADLINE_LINES.map((line, index) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={heroBeat(
                  HERO_BEATS.headline + index * HERO_BEATS.headlineStagger,
                  reduced,
                )}
                className="block"
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroBeat(HERO_BEATS.sub, reduced)}
            className="text-body-lg max-w-measure text-white/82"
          >
            Clone what already works, then make it yours — in minutes, not weeks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={heroBeat(HERO_BEATS.cta, reduced)}
            className="mt-2 flex w-full justify-center"
          >
            <HeroCta />
          </motion.div>
        </div>
      </div>

      <Container className="relative -mt-20 lg:-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={heroBeat(HERO_BEATS.screenshot, reduced)}
          className="-mb-24 lg:-mb-32"
        >
          <ProductFrame
            posters={HERO_POSTERS}
            label="Five vertical ads produced in the Vireo studio, shown side by side."
          />
        </motion.div>
      </Container>
    </section>
  );
}
