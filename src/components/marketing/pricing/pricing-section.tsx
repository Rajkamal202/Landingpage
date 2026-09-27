"use client";

import type { Plan } from "@/lib/schemas";
import { Container, Section, SectionHeading } from "../section";
import { SECTION_IDS } from "../site-links";
import { EnterpriseSlab } from "./enterprise-slab";
import { PlanCard } from "./plan-card";

export interface PricingSectionProps {
  plans: readonly Plan[];
  /** `1` when this section is the whole of `/pricing`. */
  headingLevel?: 1 | 2;
  className?: string;
}

export function PricingSection({ plans, headingLevel = 2, className }: PricingSectionProps) {
  const starter = plans.find((plan) => plan.id === "starter");
  const pro = plans.find((plan) => plan.id === "pro");
  const enterprise = plans.find((plan) => plan.id === "enterprise");

  return (
    <Section id={SECTION_IDS.pricing} className={className}>
      <Container className="flex flex-col gap-12 lg:gap-16">
        <div className="flex flex-col items-center gap-8 text-center">
          <SectionHeading
            level={headingLevel}
            title="Plans & Capabilities"
            sub="Access 100+ reference video templates, studio photoshoot sets, and every AI model we support."
            note="Official pricing tiers will be revealed at launch. All plans include full commercial usage rights."
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            {starter ? (
              <PlanCard
                plan={starter}
                period="yearly"
                tone="light"
                onSelect={() => {}}
              />
            ) : null}
            {pro ? (
              <PlanCard
                plan={pro}
                period="yearly"
                tone="dark"
                onSelect={() => {}}
              />
            ) : null}
          </div>

          {enterprise ? (
            <EnterpriseSlab
              plan={enterprise}
              onSelect={() => {}}
            />
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
