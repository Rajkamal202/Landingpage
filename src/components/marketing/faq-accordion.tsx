"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { transition } from "@/lib/motion/variants";
import { Icon } from "@/components/icon";
import { IconChevronDown } from "@/components/icons";

/**
 * SPEC §6.6 — Radix Accordion, single-open, bordered cards, a chevron that
 * turns 180° over `--dur-fast`, and content whose height animates.
 *
 * The panel is mounted only while it is open. `forceMount` keeps it in the
 * tree long enough for Motion's exit animation to finish and then it leaves,
 * so a collapsed answer is genuinely gone rather than sitting at zero height
 * where a screen reader would still read it out.
 *
 * Shared with the §6.8 landing template — the two FAQs are the same component
 * with different questions, which is the point of having one.
 */

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export function FaqAccordion({
  items,
  className,
}: {
  items: readonly FaqItem[];
  className?: string;
}) {
  const [open, setOpen] = React.useState("");
  const base = React.useId();

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      value={open}
      onValueChange={setOpen}
      className={cn("flex flex-col gap-3", className)}
    >
      {items.map((item, index) => {
        const value = `${base}-${index}`;
        const isOpen = open === value;
        return (
          <AccordionPrimitive.Item
            key={item.question}
            value={value}
            className="rounded-lg border border-ink-200 bg-surface"
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                className={cn(
                  "flex w-full items-start justify-between gap-4 rounded-lg p-5 text-left",
                  "transition-ui duration-(--dur-instant) hover:bg-ink-50",
                )}
              >
                <span className="text-title-md text-ink-950">{item.question}</span>
                <Icon
                  glyph={IconChevronDown}
                  size={20}
                  className={cn(
                    "mt-1 shrink-0 text-ink-400 transition-ui duration-(--dur-fast)",
                    isOpen && "rotate-180",
                  )}
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <AccordionPrimitive.Content forceMount asChild>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={transition.base}
                    className="overflow-hidden"
                  >
                    <p className="text-body-md max-w-measure px-5 pb-5 text-ink-500">
                      {item.answer}
                    </p>
                  </motion.div>
                </AccordionPrimitive.Content>
              ) : null}
            </AnimatePresence>
          </AccordionPrimitive.Item>
        );
      })}
    </AccordionPrimitive.Root>
  );
}
