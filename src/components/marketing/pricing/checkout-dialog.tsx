"use client";

import * as React from "react";
import { startCheckout } from "@/lib/api/billing";
import { formatNumber, formatPrice } from "@/lib/format";
import type { BillingPeriod, Plan } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconCheck } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

/**
 * SPEC §2 and §6.5 — "pricing CTAs open a mock checkout dialog". There is no
 * payment processing anywhere in this build, and the dialog says so plainly
 * rather than pretending to take a card and quietly doing nothing.
 *
 * SPEC §12: an action keeps its name through its flow. "Get started" opens
 * "Get started with Pro", commits with "Confirm plan", and resolves to
 * "Plan confirmed". "Book a call" commits with "Request a call" and resolves to
 * "Call requested".
 */

export interface CheckoutTarget {
  readonly plan: Plan;
  readonly period: BillingPeriod;
}

type Phase = "review" | "done";

export function CheckoutDialog({
  target,
  onOpenChange,
}: {
  target: CheckoutTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [phase, setPhase] = React.useState<Phase>("review");
  const [pending, setPending] = React.useState(false);

  const plan = target?.plan;
  const period = target?.period ?? "yearly";
  const concierge = plan?.id === "enterprise";

  const confirm = async () => {
    if (!plan) return;
    setPending(true);
    try {
      await startCheckout(plan.id, period);
      setPhase("done");
      toast.success(concierge ? "Call requested" : "Plan confirmed", {
        description: concierge
          ? "Someone from the Vireo team will reply within one business day."
          : `Your ${plan.name} workspace is ready to use.`,
      });
    } catch {
      toast.error("Couldn't open checkout", {
        description: "Nothing was charged. Try again in a moment.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setPhase("review");
      }}
    >
      <DialogContent size="md">
        {plan ? (
          phase === "done" ? (
            <Confirmed concierge={concierge} planName={plan.name} />
          ) : (
            <Review
              plan={plan}
              period={period}
              concierge={concierge}
              pending={pending}
              onConfirm={() => void confirm()}
              onCancel={() => onOpenChange(false)}
            />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Review({
  plan,
  period,
  concierge,
  pending,
  onConfirm,
  onCancel,
}: {
  plan: Plan;
  period: BillingPeriod;
  concierge: boolean;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dueToday = concierge
    ? "Scoped with your team"
    : period === "yearly"
      ? plan.priceYearlyTotal === null
        ? "—"
        : `${formatPrice(plan.priceYearlyTotal)} for 12 months`
      : plan.priceMonthly === null
        ? "—"
        : `${formatPrice(plan.priceMonthly)} per month`;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {concierge ? "Book a call" : `Get started with ${plan.name}`}
        </DialogTitle>
        <DialogDescription>
          This build has no payment processing connected, so nothing is charged and no card is
          collected. Confirming sets the workspace up so you can keep looking around.
        </DialogDescription>
      </DialogHeader>

      <dl className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4">
        <Row label="Plan" value={plan.name} />
        <Row
          label="Billing"
          value={concierge ? "Annual, invoiced" : period === "yearly" ? "Yearly" : "Monthly"}
        />
        <Row label="Due today" value={dueToday} />
        <Row
          label="Tokens"
          value={
            plan.tokensPerMonth === null
              ? "Allocated with your team"
              : `${formatNumber(plan.tokensPerMonth)} per month`
          }
        />
      </dl>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={pending}>
          {concierge ? "Request a call" : "Confirm plan"}
        </Button>
      </DialogFooter>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-body-sm text-ink-500">{label}</dt>
      <dd className="text-body-md text-right font-medium text-ink-950">{value}</dd>
    </div>
  );
}

function Confirmed({ concierge, planName }: { concierge: boolean; planName: string }) {
  return (
    <>
      <DialogHeader>
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-pill bg-success/10 text-success"
        >
          <Icon glyph={IconCheck} size={20} />
        </span>
        <DialogTitle>{concierge ? "Call requested" : "Plan confirmed"}</DialogTitle>
        <DialogDescription>
          {concierge
            ? "Someone from the Vireo team will reply within one business day to scope onboarding, templates and the features you need built."
            : `Your ${planName} workspace is ready. Paste a link and Vireo will pull the first video apart for you.`}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <ButtonLink href="/app/import" variant="primary">
          Clone your first video
        </ButtonLink>
      </DialogFooter>
    </>
  );
}
