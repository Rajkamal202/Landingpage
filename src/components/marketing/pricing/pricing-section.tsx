"use client";

import * as React from "react";
import type { BillingPeriod, Plan } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl, type SegmentedItem } from "@/components/ui/segmented-control";
import { Container, Section, SectionHeading } from "../section";
import { SECTION_IDS } from "../site-links";
import { CheckoutDialog, type CheckoutTarget } from "./checkout-dialog";
import { EnterpriseSlab } from "./enterprise-slab";
import { PlanCard } from "./plan-card";

/**
 * SPEC §6.5. Plans arrive as a prop rather than through a client query: the
 * page is a server component that already awaited `listPlans()`, which keeps
 * the pricing numbers in the first HTML response instead of behind a fetch
 * waterfall (DECISIONS D12).
 *
 * Yearly is the default selection, per spec.
 */

const PERIODS: readonly SegmentedItem<BillingPeriod>[] = [
  { value: "monthly", label: "Monthly" },
  {
    value: "yearly",
    label: "Yearly",
    badge: (
      <Badge tone="brand" size="sm" shape="pill">
        Save 20%
      </Badge>
    ),
  },
];

export interface PricingSectionProps {
  plans: readonly Plan[];
  /** `1` when this section is the whole of `/pricing`. */
  headingLevel?: 1 | 2;
  className?: string;
}

export function PricingSection({ plans, headingLevel = 2, className }: PricingSectionProps) {
  const [period, setPeriod] = React.useState<BillingPeriod>("yearly");
  const [target, setTarget] = React.useState<CheckoutTarget | null>(null);

  const starter = plans.find((plan) => plan.id === "starter");
  const pro = plans.find((plan) => plan.id === "pro");
  const enterprise = plans.find((plan) => plan.id === "enterprise");

  return (
    <Section id={SECTION_IDS.pricing} className={className}>
      <Container className="flex flex-col gap-12 lg:gap-16">
        <div className="flex flex-col items-center gap-8">
          <SectionHeading
            level={headingLevel}
            title="Pricing"
            sub="Access 100+ reference videos, templates, and every AI model we support."
            note="Starter and Pro are self-serve. Enterprise is concierge."
          />
          <SegmentedControl
            ariaLabel="Billing period"
            items={PERIODS}
            value={period}
            onValueChange={setPeriod}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            {starter ? (
              <PlanCard
                plan={starter}
                period={period}
                tone="light"
                onSelect={() => setTarget({ plan: starter, period })}
              />
            ) : null}
            {pro ? (
              <PlanCard
                plan={pro}
                period={period}
                tone="dark"
                onSelect={() => setTarget({ plan: pro, period })}
              />
            ) : null}
          </div>

          {enterprise ? (
            <EnterpriseSlab
              plan={enterprise}
              onSelect={() => setTarget({ plan: enterprise, period })}
            />
          ) : null}
        </div>
      </Container>

      <CheckoutDialog
        target={target}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      />
    </Section>
  );
}
