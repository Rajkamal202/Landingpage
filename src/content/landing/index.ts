import { FEATURE_ENTRIES } from "./features";
import { INDUSTRY_ENTRIES } from "./industries";
import { SOLUTION_ENTRIES } from "./solutions";
import { landingKey, type LandingEntry, type LandingGroup } from "./types";

export * from "./types";

/** SPEC §6.8 — exactly eight pages, each with copy written for it. */
export const LANDING_ENTRIES: readonly LandingEntry[] = [
  ...FEATURE_ENTRIES,
  ...SOLUTION_ENTRIES,
  ...INDUSTRY_ENTRIES,
];

const BY_KEY = new Map(LANDING_ENTRIES.map((entry) => [landingKey(entry), entry]));

export function listLandingSlugs(group: LandingGroup): { slug: string }[] {
  return LANDING_ENTRIES.filter((entry) => entry.group === group).map((entry) => ({
    slug: entry.slug,
  }));
}

export function getLandingEntry(group: LandingGroup, slug: string): LandingEntry | undefined {
  return BY_KEY.get(`${group}/${slug}`);
}

/**
 * Related pages resolve through the same map the routes use, so a typo in a
 * `related` key produces a missing card during development rather than a link
 * to a 404 in production.
 */
export function getRelatedEntries(entry: LandingEntry): LandingEntry[] {
  return entry.related
    .map((key) => BY_KEY.get(key))
    .filter((related): related is LandingEntry => related !== undefined);
}

export function landingHref(entry: LandingEntry): string {
  return `/${entry.group}/${entry.slug}`;
}
