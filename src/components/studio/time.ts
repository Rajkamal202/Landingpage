import { referenceTime } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";

/**
 * Fixtures are dated against a fixed clock (`referenceTime()`), but anything
 * the user creates in-session is stamped with the real one. Formatting a
 * just-created project against the fixture clock would read "in 5 months".
 *
 * Taking the later of the two as "now" keeps seeded content stable and reads
 * "just now" for anything the user made a moment ago.
 */
export function formatEdited(iso: string): string {
  const then = Date.parse(iso);
  const now = Number.isNaN(then) ? referenceTime() : Math.max(referenceTime(), then);
  return formatRelativeTime(iso, now);
}
