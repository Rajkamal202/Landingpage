"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { TokenBalance, UsageEntry } from "@/lib/schemas";
import { GENERATION_MODE_LABEL } from "@/lib/schemas";
import { formatCompactNumber, formatNumber, formatRelativeTime } from "@/lib/format";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Skeleton } from "./skeleton";

/**
 * SPEC §7.1 — persistent, always visible. Under 10% the bar turns warning;
 * at zero it turns danger and every generate button disables with a tooltip
 * that explains why and how to fix it.
 *
 * `useTokenGuard` is the shared source of that disabled state, so five
 * different generate buttons cannot disagree about when generation is possible.
 */
export interface TokenMeterProps {
  balance: TokenBalance | undefined;
  usage: readonly UsageEntry[] | undefined;
  now: number;
  onTopUp: () => void;
  className?: string;
}

export type TokenTone = "ok" | "low" | "empty";

export function tokenTone(balance: TokenBalance | undefined): TokenTone {
  if (!balance) return "ok";
  if (balance.remaining <= 0) return "empty";
  return balance.remaining / balance.total < 0.1 ? "low" : "ok";
}

/** The one place that decides whether a generation can start. */
export function useTokenGuard(balance: TokenBalance | undefined, cost: number) {
  return React.useMemo(() => {
    if (!balance) return { allowed: true, reason: undefined };
    if (balance.remaining <= 0) {
      return {
        allowed: false,
        reason: "You're out of tokens for this cycle. Top up to keep generating.",
      };
    }
    if (balance.remaining < cost) {
      return {
        allowed: false,
        reason: `This costs ${formatNumber(cost)} tokens and you have ${formatNumber(balance.remaining)} left. Top up or lower the batch count.`,
      };
    }
    return { allowed: true, reason: undefined };
  }, [balance, cost]);
}

const TONE_FILL: Record<TokenTone, string> = {
  ok: "bg-ink-950",
  low: "bg-warning",
  empty: "bg-danger",
};

export function TokenMeter({ balance, usage, now, onTopUp, className }: TokenMeterProps) {
  if (!balance) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-1 w-10 rounded-pill" />
      </div>
    );
  }

  const tone = tokenTone(balance);
  const pct = Math.max(0, Math.min(100, (balance.remaining / balance.total) * 100));

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-control-md items-center gap-2 rounded-md px-2",
          "transition-ui duration-(--dur-instant) hover:bg-ink-100",
          className,
        )}
        aria-label={`${formatNumber(balance.remaining)} tokens remaining of ${formatNumber(balance.total)}. Open usage breakdown.`}
      >
        <span
          className={cn(
            "mono-sm",
            tone === "empty" ? "text-danger" : tone === "low" ? "text-warning" : "text-ink-950",
          )}
        >
          {formatCompactNumber(balance.remaining)}
        </span>
        <span className="h-1 w-10 overflow-hidden rounded-pill bg-ink-200">
          <span
            className={cn("block h-full rounded-pill transition-ui duration-(--dur-base)", TONE_FILL[tone])}
            // dynamic: width is the measured remaining-token ratio.
            style={{ width: `${pct}%` }}
          />
        </span>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-sheet">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-title-md text-ink-950">
              {formatNumber(balance.remaining)}{" "}
              <span className="text-body-sm text-ink-500">tokens left</span>
            </p>
            <p className="text-body-sm mt-1 text-ink-500">
              Resets {formatRelativeTime(balance.cycleEndsAt, now)}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={onTopUp}>
            Top up
          </Button>
        </div>

        <hr className="my-4 border-0 border-t border-ink-200" />

        <p className="eyebrow mb-3 text-ink-500">This cycle</p>
        {usage === undefined ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-5" />
            ))}
          </div>
        ) : usage.length === 0 ? (
          <p className="text-body-sm text-ink-500">
            Nothing generated yet this cycle. Your full allowance is available.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {usage.map((entry) => (
              <li key={entry.mode} className="flex items-center gap-3">
                <span className="text-body-sm min-w-0 flex-1 truncate text-ink-700">
                  {GENERATION_MODE_LABEL[entry.mode]}
                </span>
                <span className="mono-sm text-ink-500">{entry.count}</span>
                <span className="mono-sm w-12 text-right text-ink-950">
                  {formatCompactNumber(entry.tokens)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
