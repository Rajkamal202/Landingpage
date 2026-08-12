import type * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { GROUP_EYEBROW, landingHref, type LandingEntry } from "@/content/landing";
import { Icon } from "@/components/icon";
import { IconArrowUpRight } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Rise } from "@/components/ui/scroll-reveal";
import { Container, Section, SectionHeading } from "./section";
import { FaqAccordion } from "./faq-accordion";
import { ProductFrame } from "./product-frame";
import { Sky } from "./illustration/sky";

/**
 * SPEC §6.8 — one template, eight pages.
 *
 * The template is fixed on purpose: hero, four benefits, three steps, three
 * questions, three related pages. What varies between the eight is every
 * sentence, which is the part the spec actually cares about. A template with
 * optional slots would have let a thin entry ship as a short page instead of
 * being rewritten or dropped.
 *
 * The hero reuses the same cobalt sky as the home page, in a shorter frame.
 * Contrast is inherited from that component along with its scrim — see the
 * measurements in `illustration/sky.tsx`.
 */

export function LandingTemplate({
  entry,
  related,
}: {
  entry: LandingEntry;
  related: readonly LandingEntry[];
}) {
  return (
    <main id="main">
      <section className="relative">
        <Sky />
        <Container className="relative grid items-center gap-12 pb-16 pt-32 lg:grid-cols-2 lg:gap-16 lg:pb-24">
          <div className="flex flex-col items-start gap-6">
            <p className="eyebrow text-white/70">{GROUP_EYEBROW[entry.group]}</p>
            <h1 className="text-hero-sm md:text-hero-md text-white">{entry.title}</h1>
            <p className="text-body-lg max-w-measure text-white/82">{entry.sub}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" variant="pill" size="lg">
                Get started
              </ButtonLink>
              <ButtonLink
                href="/pricing"
                variant="ghost"
                shape="pill"
                size="lg"
                className={cn(
                  "border border-white/60 text-white",
                  "hover:bg-white/15 hover:text-white active:bg-white/25",
                )}
              >
                See pricing
              </ButtonLink>
            </div>
          </div>

          <ProductFrame
            posters={entry.posters.map((src) => ({ id: src, src }))}
            label={entry.frameLabel}
            density="step"
          />
        </Container>
      </section>

      <Section className="bg-surface">
        <Container className="flex flex-col gap-12 lg:gap-16">
          <SectionHeading align="start" title={entry.benefitsHeading} />
          <ul className="grid gap-6 sm:grid-cols-2">
            {entry.benefits.map((benefit) => (
              <li key={benefit.title}>
                <Rise className="flex h-full flex-col gap-4 rounded-xl border border-ink-200 bg-surface p-6 shadow-elev-1">
                  <span
                    aria-hidden="true"
                    className="grid size-10 place-items-center rounded-md bg-ink-100 text-ink-700"
                  >
                    <Icon glyph={benefit.glyph} size={20} />
                  </span>
                  <h3 className="text-title-md text-ink-950">{benefit.title}</h3>
                  <p className="text-body-md max-w-measure text-ink-500">{benefit.body}</p>
                </Rise>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col gap-12 lg:gap-16">
          <SectionHeading align="start" title={entry.stepsHeading} />
          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {entry.steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-4 border-t border-ink-200 pt-6">
                <span
                  aria-hidden="true"
                  className="mono-sm grid size-10 place-items-center rounded-pill bg-ink-950 text-white"
                >
                  {index + 1}
                </span>
                <h3 className="text-title-md text-ink-950">{step.title}</h3>
                <p className="text-body-md max-w-measure text-ink-500">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="bg-surface">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            align="start"
            title="Questions about this, specifically"
            className="lg:sticky lg:top-32 lg:self-start"
          />
          <FaqAccordion items={entry.faqs} />
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col gap-10 lg:gap-12">
          <SectionHeading align="start" title="Keep reading" />
          <ul className="grid gap-6 md:grid-cols-3">
            {related.map((page) => (
              <li key={landingHref(page)}>
                <RelatedCard entry={page} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </main>
  );
}

/** The eight landing paths are generated, so they need one cast to satisfy typed routes. */
type LinkHref = React.ComponentProps<typeof Link>["href"];

function RelatedCard({ entry }: { entry: LandingEntry }) {
  return (
    <Link
      href={landingHref(entry) as LinkHref}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-xl border border-ink-200 bg-surface p-6",
        "shadow-elev-1 transition-ui duration-(--dur-fast) hover:border-ink-300 hover:shadow-elev-2",
      )}
    >
      <span className="eyebrow text-ink-400">{GROUP_EYEBROW[entry.group]}</span>
      <span className="text-title-md text-ink-950">{entry.name}</span>
      <span className="text-body-md flex-1 text-ink-500">{entry.title}</span>
      <span className="text-body-sm inline-flex items-center gap-1 font-medium text-brand-600">
        Read more
        <Icon glyph={IconArrowUpRight} size={16} />
      </span>
    </Link>
  );
}
