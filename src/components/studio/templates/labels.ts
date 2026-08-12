import type { Pacing, Template } from "@/lib/schemas";

/**
 * Pacing is stored as `fast | medium | slow`; the browser says what that means
 * for the edit rather than repeating the enum at the user (SPEC §12: name
 * things by what the user controls).
 */
export const PACING_LABEL: Record<Pacing, string> = {
  fast: "Fast cuts",
  medium: "Even pacing",
  slow: "Slow build",
};

export const PACING_DESCRIPTION: Record<Pacing, string> = {
  fast: "Cuts land every second or two. Built to survive the first scroll.",
  medium: "A steady rhythm with room for a line of copy per scene.",
  slow: "Long holds that let the product and the voice carry it.",
};

/**
 * Duration is a filter the user thinks in, but `TemplateFilter` has no range
 * — so the buckets are applied here, over the API's result, rather than
 * inventing a query parameter the data layer does not support.
 */
export const DURATION_BUCKETS = ["short", "medium", "long"] as const;
export type DurationBucket = (typeof DURATION_BUCKETS)[number];

export const DURATION_LABEL: Record<DurationBucket, string> = {
  short: "Under 15s",
  medium: "15 to 25s",
  long: "Over 25s",
};

export function inDurationBucket(template: Template, bucket: DurationBucket): boolean {
  const seconds = template.durationMs / 1000;
  if (bucket === "short") return seconds < 15;
  if (bucket === "medium") return seconds >= 15 && seconds <= 25;
  return seconds > 25;
}
