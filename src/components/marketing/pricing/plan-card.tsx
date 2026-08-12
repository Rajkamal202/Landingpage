"use client";

import { cn } from "@/lib/cn";
import { formatNumber, formatPrice } from "@/lib/format";
import type { BillingPeriod, Plan } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconCheck } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RollingPrice } from "./rolling-price";

/**
 * SPEC §6.5 — Starter and Pro.
 *
 * Two calls worth writing down:
 *
 * - **Tier name is `title-lg`, price is `display-md`.** SPEC §4.3 lists
 *   display-md against "pricing tier name" and SPEC §6.5 puts the price there
 *   too; setting both at 34px flattens the card and makes the word "Pro"
 *   compete with the number nobody came here to ignore. The name takes §4.3's
 *   card-title size instead.
 * - **The struck list price is `--color-danger` on Starter and `white/60` on
 *   Pro.** Danger measures 4.69:1 on the ink-50 card and 3.93:1 on the ink-950
 *   one, and SPEC §11 wants 4.5:1 for text this size. The strike-through is
 *   what carries "this was the old price" anyway; the hue is decoration, and
 *   decoration does not get to cost legibility.
 */

export interface PlanCardProps {
  plan: Plan;
  period: BillingPeriod;
  tone: "light" | "dark";
  onSelect: () => void;
}

export function PlanCard({ plan, period, tone, onSelect }: PlanCardProps) {
  const dark = tone === "dark";
  const monthly = period === "monthly";
  const price = monthly ? plan.priceMonthly : plan.priceYearlyPerMonth;
  const showStrike =
    !monthly && plan.listPriceMonthly !== null && plan.listPriceMonthly !== price;

  return (
    <article
      className={cn(
        "relative flex flex-col gap-6 rounded-xl p-6 lg:p-8",
        dark ? "bg-ink-950 text-white shadow-elev-3" : "border border-ink-200 bg-ink-50",
      )}
    >
      {plan.popular ? (
        <Badge tone="inverse" size="md" shape="pill" className="absolute right-6 top-6">
          Popular
        </Badge>
      ) : null}

      <div className="flex flex-col gap-2 pr-24">
        <h3 className={cn("text-title-lg", dark ? "text-white" : "text-ink-950")}>{plan.name}</h3>
        <p className={cn("text-body-md", dark ? "text-ink-300" : "text-ink-500")}>
          {plan.description}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-baseline gap-2">
          {showStrike && plan.listPriceMonthly !== null ? (
            <span
              className={cn("text-title-md line-through", dark ? "text-white/60" : "text-danger")}
            >
              {formatPrice(plan.listPriceMonthly)}
            </span>
          ) : null}
          {price === null ? null : (
            <RollingPrice
              value={formatPrice(price)}
              className={cn("text-display-md", dark ? "text-white" : "text-ink-950")}
            />
          )}
          <span className={cn("text-body-md", dark ? "text-ink-300" : "text-ink-500")}>
            /month
          </span>
        </p>

        {/* Fixed height: this line is one sentence on wide cards and two on
            narrow ones, and it changes with the toggle. Reserving both keeps
            the CTA from stepping up and down as the user compares. */}
        <p
          className={cn(
            "text-body-sm min-h-10",
            dark ? "text-ink-300" : "text-ink-500",
          )}
        >
          {monthly
            ? "Billed monthly. Change or cancel whenever you like."
            : plan.priceYearlyTotal === null
              ? ""
              : `(${formatPrice(plan.priceYearlyTotal)}/year) per month, billed annually`}
        </p>

        {plan.tokensPerMonth === null ? null : (
          <p className={cn("mono-sm", dark ? "text-white" : "text-ink-950")}>
            {formatNumber(plan.tokensPerMonth)} tokens / month
          </p>
        )}
      </div>

      <Button
        variant={dark ? "inverse" : "pill"}
        shape="pill"
        size="lg"
        block
        onClick={onSelect}
      >
        Get started
      </Button>

      <ul className="flex flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-pill",
                dark ? "bg-white text-ink-950" : "bg-ink-950 text-white",
              )}
            >
              <Icon glyph={IconCheck} size={16} />
            </span>
            <span className={cn("text-body-md", dark ? "text-white" : "text-ink-950")}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
