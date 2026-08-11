import { createRng } from "@/lib/seeded-random";

/**
 * A fixed clock. Relative timestamps ("2 hours ago") are computed against this
 * instead of `Date.now()`, so a screenshot taken today and one taken next
 * month are identical, and so the workspace list never reorders between runs.
 */
export const FIXTURE_NOW = Date.parse("2026-03-12T15:00:00.000Z");

export const rng = createRng(0x51ce0);

/** Minutes/hours/days before the fixture clock, as an ISO string. */
export function ago(
  amount: number,
  unit: "minute" | "hour" | "day" | "week" | "month",
): string {
  const MS = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
  } as const;
  return new Date(FIXTURE_NOW - amount * MS[unit]).toISOString();
}
