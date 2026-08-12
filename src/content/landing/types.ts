import type { IconDef } from "@/components/icons";

/**
 * SPEC §6.8 — the typed content collection behind `/features/[slug]`,
 * `/solutions/[slug]` and `/industries/[slug]`.
 *
 * The shape is deliberately rigid: exactly four benefits, exactly three steps,
 * exactly three questions. A template whose slots are optional grows uneven
 * pages, and uneven pages are how a set of eight starts reading like a set of
 * forty. If an entry cannot fill the shape with real sentences, the spec's
 * instruction is to drop the slug rather than pad it.
 */

export const LANDING_GROUPS = ["features", "solutions", "industries"] as const;
export type LandingGroup = (typeof LANDING_GROUPS)[number];

export const GROUP_EYEBROW: Record<LandingGroup, string> = {
  features: "Feature",
  solutions: "Solution",
  industries: "Industry",
};

export interface LandingBenefit {
  readonly title: string;
  readonly body: string;
  readonly glyph: IconDef;
}

export interface LandingStep {
  readonly title: string;
  readonly body: string;
}

export interface LandingFaq {
  readonly question: string;
  readonly answer: string;
}

export interface LandingEntry {
  readonly group: LandingGroup;
  readonly slug: string;
  /** Short label — related-page cards, footer, breadcrumbs. */
  readonly name: string;
  /** The page's `h1`. A sentence, not a keyword. */
  readonly title: string;
  readonly sub: string;
  readonly metaTitle: string;
  readonly metaDescription: string;
  /** Two 9:16 stills framed as in-product output beside the hero. */
  readonly posters: readonly [string, string];
  readonly frameLabel: string;
  readonly benefitsHeading: string;
  readonly benefits: readonly [LandingBenefit, LandingBenefit, LandingBenefit, LandingBenefit];
  readonly stepsHeading: string;
  readonly steps: readonly [LandingStep, LandingStep, LandingStep];
  readonly faqs: readonly [LandingFaq, LandingFaq, LandingFaq];
  /** `${group}/${slug}` keys. Three, so the grid is always full. */
  readonly related: readonly [string, string, string];
}

export type LandingKey = string;

export const landingKey = (entry: Pick<LandingEntry, "group" | "slug">): LandingKey =>
  `${entry.group}/${entry.slug}`;
