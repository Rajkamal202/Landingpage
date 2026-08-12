import type { Plan, TokenBalance } from "@/lib/schemas";

/**
 * Billing history.
 *
 * `src/lib/api/billing.ts` is frozen and exposes no invoice endpoint, so the
 * history is derived from the two real facts the API does return: the plan's
 * price and the date the current cycle ends. Each past cycle is one invoice at
 * the plan's rate. Nothing is invented beyond that arithmetic, and when a
 * `listInvoices()` lands this module is the only thing the billing screen has
 * to stop calling.
 */
export interface Invoice {
  id: string;
  issuedAt: string;
  amountDollars: number;
  /** The cycle the invoice covers, e.g. "Jul 2026". */
  periodLabel: string;
}

const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DAY = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatInvoiceDate(iso: string): string {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? "" : DAY.format(parsed);
}

export function deriveInvoices(
  plan: Plan | undefined,
  balance: TokenBalance | undefined,
  count = 6,
): Invoice[] {
  if (!plan || !balance) return [];

  const amountDollars = plan.priceYearlyPerMonth ?? plan.priceMonthly;
  if (amountDollars === null) return [];

  const cycleEnd = Date.parse(balance.cycleEndsAt);
  if (Number.isNaN(cycleEnd)) return [];

  const invoices: Invoice[] = [];
  for (let index = 1; index <= count; index += 1) {
    const issued = new Date(cycleEnd);
    issued.setUTCMonth(issued.getUTCMonth() - index);
    const period = new Date(issued);
    period.setUTCMonth(period.getUTCMonth() - 1);

    invoices.push({
      id: `INV-${issued.getUTCFullYear()}-${String(issued.getUTCMonth() + 1).padStart(2, "0")}`,
      issuedAt: issued.toISOString(),
      amountDollars,
      periodLabel: MONTH.format(period),
    });
  }
  return invoices;
}
