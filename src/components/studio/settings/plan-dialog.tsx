"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { startCheckout } from "@/lib/api/billing";
import type { BillingPeriod, Plan, PlanId } from "@/lib/schemas";
import { formatNumber, formatPrice } from "@/lib/format";
import { Icon } from "@/components/icon";
import { IconCheck } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { toast } from "@/components/ui/toast";

/**
 * SPEC §2 and §6.5: no payment processing — every plan CTA opens a mock
 * checkout dialog. This is that dialog, and it says so rather than staging a
 * fake card form.
 */
export interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: readonly Plan[];
  currentPlanId: PlanId | undefined;
}

function priceLine(plan: Plan, period: BillingPeriod): string {
  if (period === "yearly") {
    if (plan.priceYearlyPerMonth === null) return "Priced to your onboarding";
    return `${formatPrice(plan.priceYearlyPerMonth)}/month, billed annually`;
  }
  if (plan.priceMonthly === null) return "Priced to your onboarding";
  return `${formatPrice(plan.priceMonthly)}/month`;
}

export function PlanDialog({ open, onOpenChange, plans, currentPlanId }: PlanDialogProps) {
  const [period, setPeriod] = React.useState<BillingPeriod>("yearly");
  const [pending, setPending] = React.useState<PlanId | null>(null);
  const [handed, setHanded] = React.useState<Plan | null>(null);

  React.useEffect(() => {
    if (!open) {
      setPending(null);
      setHanded(null);
    }
  }, [open]);

  const choose = async (plan: Plan) => {
    setPending(plan.id);
    try {
      await startCheckout(plan.id, period);
      setHanded(plan);
    } catch {
      toast.error("Checkout didn't open", {
        description: `Nothing was charged and you're still on your current plan. Try ${plan.name} again in a moment.`,
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" aria-describedby="plan-dialog-description">
        <DialogHeader>
          <DialogTitle>{handed ? "Checkout would open here" : "Change plan"}</DialogTitle>
          <DialogDescription id="plan-dialog-description">
            {handed
              ? `On a live account this hands off to checkout for ${handed.name} at ${priceLine(handed, period)}. This build stops at the handoff — nothing is charged.`
              : "Every plan includes the full editor, all models, brand kits and export. Higher tiers add tokens, storage and support."}
          </DialogDescription>
        </DialogHeader>

        {handed ? null : (
          <>
            <SegmentedControl
              ariaLabel="Billing period"
              value={period}
              onValueChange={setPeriod}
              items={[
                { value: "monthly", label: "Monthly" },
                {
                  value: "yearly",
                  label: "Yearly",
                  badge: <Badge tone="success">Save 20%</Badge>,
                },
              ]}
            />

            <ul className="palette-list mt-4 grid gap-3 overflow-y-auto sm:grid-cols-3">
              {plans.map((plan) => {
                const current = plan.id === currentPlanId;
                return (
                  <li
                    key={plan.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border p-4",
                      current ? "border-ink-950 bg-ink-50" : "border-ink-200 bg-surface",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-title-md text-ink-950">{plan.name}</h3>
                      {current ? <Badge tone="neutral">Current</Badge> : null}
                      {plan.popular && !current ? <Badge tone="brand">Popular</Badge> : null}
                    </div>

                    <p className="text-body-sm text-ink-500">{plan.description}</p>

                    <p className="mono-sm text-ink-950" data-numeric>
                      {priceLine(plan, period)}
                    </p>

                    <p className="mono-sm text-ink-500" data-numeric>
                      {plan.tokensPerMonth === null
                        ? "Custom token allocation"
                        : `${formatNumber(plan.tokensPerMonth)} tokens / month`}
                    </p>

                    <ul className="flex flex-1 flex-col gap-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="text-body-sm flex items-start gap-2 text-ink-700">
                          <Icon glyph={IconCheck} size={16} className="mt-px text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={current ? "secondary" : "primary"}
                      block
                      disabled={current}
                      loading={pending === plan.id}
                      onClick={() => void choose(plan)}
                    >
                      {current
                        ? "Your plan"
                        : plan.priceMonthly === null
                          ? "Book a call"
                          : `Switch to ${plan.name}`}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <DialogFooter>
          <Button variant={handed ? "primary" : "ghost"} onClick={() => onOpenChange(false)}>
            {handed ? "Back to billing" : "Keep my plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
