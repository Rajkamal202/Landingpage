"use client";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { BillingPeriod, Plan } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconCheck } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PlanCardProps {
  plan: Plan;
  period: BillingPeriod;
  tone: "light" | "dark";
  onSelect: () => void;
}

export function PlanCard({ plan, tone }: PlanCardProps) {
  const dark = tone === "dark";

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

      {/* Blurred Price Container with Coming Soon Badge */}
      <div className="relative flex flex-col gap-2 overflow-hidden rounded-xl p-2 -mx-2">
        {/* Blurred Price Teaser */}
        <div
          aria-hidden="true"
          className="flex flex-col gap-2 select-none filter blur-md pointer-events-none opacity-30"
        >
          <p className="flex flex-wrap items-baseline gap-2">
            <span className={cn("text-display-md font-bold", dark ? "text-white" : "text-ink-950")}>
              $•••
            </span>
            <span className={cn("text-body-md", dark ? "text-ink-300" : "text-ink-500")}>
              /month
            </span>
          </p>

          <p className={cn("text-body-sm min-h-10", dark ? "text-ink-300" : "text-ink-500")}>
            Full commercial license and platform updates included.
          </p>

          {plan.tokensPerMonth === null ? null : (
            <p className={cn("mono-sm", dark ? "text-white" : "text-ink-950")}>
              {formatNumber(plan.tokensPerMonth)} tokens / month
            </p>
          )}
        </div>

        {/* Foreground Coming Soon Tag */}
        <div className="absolute inset-0 flex flex-col items-start justify-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 border shadow-elev-1 backdrop-blur-md",
              dark
                ? "border-white/20 bg-white/10 text-white"
                : "border-brand-500/20 bg-white/95 text-brand-700",
            )}
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-body-sm font-semibold tracking-wide">
              Pricing Coming Soon
            </span>
          </div>
        </div>
      </div>

      <Button
        variant={dark ? "inverse" : "secondary"}
        shape="pill"
        size="lg"
        block
        disabled
        className="cursor-default opacity-90"
      >
        Coming Soon
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
