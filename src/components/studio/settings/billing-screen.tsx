"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccount, getTokenBalance, getUsage, listPlans, topUpTokens } from "@/lib/api/billing";
import { referenceTime } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { TokenBalance } from "@/lib/schemas";
import { GENERATION_MODE_LABEL } from "@/lib/schemas";
import { formatNumber, formatPrice, formatRelativeTime } from "@/lib/format";
import { Icon } from "@/components/icon";
import { IconBilling, IconCheck } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { deriveInvoices, formatInvoiceDate } from "./invoices";
import { PlanDialog } from "./plan-dialog";
import { SettingsCard, SettingsSection } from "./settings-section";

const TOP_UP_TOKENS = 5000;

/** SPEC §7.2 — plan, token allowance with the usage breakdown, and invoices. */
export function BillingScreen() {
  const queryClient = useQueryClient();
  const [changing, setChanging] = React.useState(false);

  const account = useQuery({ queryKey: queryKeys.billing.account, queryFn: getAccount });
  const plans = useQuery({ queryKey: queryKeys.billing.plans, queryFn: listPlans });
  const balance = useQuery({ queryKey: queryKeys.billing.balance, queryFn: getTokenBalance });
  const usage = useQuery({ queryKey: queryKeys.billing.usage, queryFn: getUsage });

  const planId = balance.data?.planId ?? account.data?.planId;
  const plan = plans.data?.find((candidate) => candidate.id === planId);

  const topUp = useMutation({
    mutationFn: () => topUpTokens(TOP_UP_TOKENS),
    onSuccess: (next) => {
      queryClient.setQueryData<TokenBalance>(queryKeys.billing.balance, next);
      toast.success("Tokens added", {
        description: `${formatNumber(TOP_UP_TOKENS)} tokens are on your account and ready to spend.`,
      });
    },
    onError: () => {
      toast.error("Those tokens didn't land", {
        description: "Nothing was charged and your balance is unchanged. Try the top up again.",
      });
    },
  });

  const invoices = deriveInvoices(plan, balance.data);
  const usedShare = balance.data ? (balance.data.used / balance.data.total) * 100 : 0;
  const totalUsedTokens = (usage.data ?? []).reduce((sum, entry) => sum + entry.tokens, 0);

  return (
    <SettingsSection
      title="Billing"
      description="What you're on, what you've spent this cycle, and what you've been charged."
    >
      <SettingsCard
        title="Your plan"
        description="Change it whenever — the new allowance starts at the next cycle."
        action={
          <Button variant="secondary" onClick={() => setChanging(true)} disabled={!plans.data}>
            Change plan
          </Button>
        }
      >
        {plans.isPending || balance.isPending ? (
          <Skeleton className="h-24 w-full rounded-md" />
        ) : plan === undefined ? (
          <EmptyState
            size="sm"
            glyph={IconBilling}
            title="Your plan didn't load"
            description="The request came back empty-handed. Your subscription is untouched — reload to see it."
            action={
              <Button variant="primary" size="sm" onClick={() => void plans.refetch()}>
                Reload plan
              </Button>
            }
          />
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-title-lg text-ink-950">{plan.name}</h3>
                {plan.popular ? <Badge tone="brand">Popular</Badge> : null}
              </div>
              <p className="text-body-sm text-ink-500">{plan.description}</p>
              <p className="mono-sm text-ink-950" data-numeric>
                {plan.priceYearlyPerMonth === null
                  ? "Priced to your onboarding"
                  : `${formatPrice(plan.priceYearlyPerMonth)}/month, billed annually`}
              </p>
            </div>

            <ul className="flex min-w-0 flex-col gap-2">
              {plan.features.map((feature) => (
                <li key={feature} className="text-body-sm flex items-start gap-2 text-ink-700">
                  <Icon glyph={IconCheck} size={16} className="mt-px text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        title="Tokens"
        description="One allowance across generation, cloning and export."
        action={
          <Button variant="secondary" loading={topUp.isPending} onClick={() => topUp.mutate()}>
            Top up
          </Button>
        }
      >
        {balance.isPending || balance.data === undefined ? (
          <Skeleton className="h-16 w-full rounded-md" />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-display-md text-ink-950" data-numeric>
                {formatNumber(balance.data.remaining)}{" "}
                <span className="text-body-md text-ink-500">
                  of {formatNumber(balance.data.total)} left
                </span>
              </p>
              <p className="text-body-sm text-ink-500">
                Resets {formatRelativeTime(balance.data.cycleEndsAt, referenceTime())}
              </p>
            </div>
            <Progress
              value={usedShare}
              aria-label={`${formatNumber(balance.data.used)} of ${formatNumber(balance.data.total)} tokens used`}
              tone={
                balance.data.remaining === 0
                  ? "danger"
                  : balance.data.remaining / balance.data.total < 0.1
                    ? "warning"
                    : "ink"
              }
            />
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-ink-200 pt-4">
          <h3 className="eyebrow text-ink-500">Where it went this cycle</h3>
          {usage.isPending ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-5" />
              ))}
            </div>
          ) : usage.isError ? (
            <EmptyState
              size="sm"
              glyph={IconBilling}
              title="The usage breakdown didn't load"
              description="Your balance above is still accurate. Reload to see how it was spent."
              action={
                <Button variant="primary" size="sm" onClick={() => void usage.refetch()}>
                  Reload usage
                </Button>
              }
            />
          ) : (usage.data ?? []).length === 0 ? (
            <p className="text-body-sm text-ink-500">
              Nothing generated yet this cycle — your full allowance is available.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(usage.data ?? []).map((entry) => (
                <li key={entry.mode} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-body-sm text-ink-700">
                      {GENERATION_MODE_LABEL[entry.mode]}
                    </span>
                    <span className="mono-sm text-ink-500" data-numeric>
                      {entry.count} runs · {formatNumber(entry.tokens)}
                    </span>
                  </div>
                  <Progress
                    value={totalUsedTokens > 0 ? (entry.tokens / totalUsedTokens) * 100 : 0}
                    aria-label={`${GENERATION_MODE_LABEL[entry.mode]}: ${formatNumber(entry.tokens)} tokens`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SettingsCard>

      <SettingsCard title="Invoices" description="Every closed cycle, most recent first.">
        {balance.isPending || plans.isPending ? (
          <Skeleton className="h-24 w-full rounded-md" />
        ) : invoices.length === 0 ? (
          <EmptyState
            size="sm"
            glyph={IconBilling}
            title="No invoices yet"
            description="Enterprise accounts are invoiced directly by your contact rather than through the app."
            action={
              <Button variant="secondary" size="sm" onClick={() => setChanging(true)}>
                See the plans
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <caption className="sr-only">Past invoices for this workspace</caption>
              <thead>
                <tr className="border-b border-ink-200">
                  <th scope="col" className="text-label py-2 pr-4 text-left text-ink-500">
                    Invoice
                  </th>
                  <th scope="col" className="text-label py-2 pr-4 text-left text-ink-500">
                    Cycle
                  </th>
                  <th scope="col" className="text-label py-2 pr-4 text-left text-ink-500">
                    Issued
                  </th>
                  <th scope="col" className="text-label py-2 pr-4 text-left text-ink-500">
                    Amount
                  </th>
                  <th scope="col" className="text-label py-2 text-left text-ink-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-ink-200 last:border-b-0">
                    <td className="mono-sm py-3 pr-4 text-ink-950">{invoice.id}</td>
                    <td className="text-body-sm py-3 pr-4 text-ink-700">{invoice.periodLabel}</td>
                    <td className="text-body-sm py-3 pr-4 text-ink-700">
                      {formatInvoiceDate(invoice.issuedAt)}
                    </td>
                    <td className="mono-sm py-3 pr-4 text-ink-950" data-numeric>
                      {formatPrice(invoice.amountDollars)}
                    </td>
                    <td className="py-3">
                      <Badge tone="success">Paid</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      <PlanDialog
        open={changing}
        onOpenChange={setChanging}
        plans={plans.data ?? []}
        currentPlanId={planId}
      />
    </SettingsSection>
  );
}
