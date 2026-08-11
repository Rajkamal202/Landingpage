"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { reveal } from "@/lib/motion/tokens";
import { riseIn, staggerGroup } from "@/lib/motion/variants";

/**
 * SPEC §4.6: "Elements entering the viewport rise 12px and fade in, staggered
 * 40ms per sibling, triggered once at 20% visibility."
 *
 * One implementation, so every section on the marketing page enters on the
 * same beat. Reduced motion is handled by `MotionConfig reducedMotion="user"`
 * at the root: the transform is dropped and only the opacity fade remains.
 *
 * There are separate `div` and list variants rather than one polymorphic `as`
 * prop — a real `<ul>`/`<li>` matters for a list of features, and Motion's
 * per-element prop types do not survive being unioned.
 */
const groupProps = {
  initial: "hidden",
  whileInView: "visible",
  viewport: reveal.viewport,
  variants: staggerGroup,
} as const;

export function ScrollReveal(props: HTMLMotionProps<"div">) {
  return <motion.div {...groupProps} {...props} />;
}

export function ScrollRevealSection(props: HTMLMotionProps<"section">) {
  return <motion.section {...groupProps} {...props} />;
}

export function ScrollRevealList(props: HTMLMotionProps<"ul">) {
  return <motion.ul {...groupProps} {...props} />;
}

export function ScrollRevealItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={riseIn} {...props} />;
}

export function ScrollRevealListItem(props: HTMLMotionProps<"li">) {
  return <motion.li variants={riseIn} {...props} />;
}

/** For a single element with no siblings to stagger against. */
export function Rise(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={reveal.viewport}
      variants={riseIn}
      {...props}
    />
  );
}
