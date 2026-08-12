"use client";

import type { Plan } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconCheck } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * SPEC §6.5 — the full-width dark slab beneath the two self-serve cards.
 *
 * It reads as one row on desktop and as a stack on mobile, and the price side
 * comes second in the DOM so that the offer is explained before it is priced —
 * which is also the order a screen reader will read it in.
 */
export function EnterpriseSlab({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  return (
    <article className="grid gap-8 rounded-xl bg-ink-950 p-6 text-white shadow-elev-3 lg:grid-cols-3 lg:gap-16 lg:p-12">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="flex flex-col gap-3">
          <Badge tone="inverse" size="md" shape="pill" className="self-start">
            Concierge
          </Badge>
          <h3 className="text-display-md text-white">{plan.name}</h3>
          <p className="text-body-lg max-w-measure text-ink-300">{plan.description}</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-x-8">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center rounded-pill bg-white text-ink-950"
              >
                <Icon glyph={IconCheck} size={16} />
              </span>
              <span className="text-body-md text-white">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-start gap-4 border-t border-white/15 pt-8 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
        <p className="text-display-md text-white">Custom</p>
        <p className="text-body-md text-ink-300">
          Scoped to your onboarding, team workflow, and feature needs.
        </p>
        <Button variant="inverse" shape="pill" size="lg" onClick={onSelect} className="mt-2">
          Book a call
        </Button>
      </div>
    </article>
  );
}
