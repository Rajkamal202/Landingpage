import type { Route } from "next";
import type { LandingEntry } from "@/content/landing";

/**
 * Every destination the public site can offer, in one place.
 *
 * The constraint that shapes this file: **every link here resolves.** There are
 * no `#` placeholders and no invented routes — the site has `/`, `/pricing`,
 * `/login`, `/signup`, the eight §6.8 landing pages, `/app`, and the four
 * section anchors on the home page. A footer full of dead links is the fastest
 * way to make a build read as a mock-up.
 */

/**
 * `Route` is the union Next generates from the app directory, so a typo in a
 * static href is a compile error.
 *
 * Two things it deliberately is not:
 *
 * - Not `ComponentProps<typeof Link>["href"]`. `Link` is generic over its route
 *   type, so `typeof Link` erases the parameter to `unknown` and every literal
 *   here fails to match.
 * - Not sufficient on its own for the landing pages. `Route` contains the
 *   *pattern* `/features/[slug]`, not filled slugs, so the eight §6.8 pages are
 *   typed as `/{group}/{slug}` where the slug union comes from the content
 *   collection itself. A footer link to a page that was never written is
 *   therefore a compile error, which is a stronger guarantee than Next's own.
 *
 * Anchors and external URLs are separate cases: they are not app routes, and
 * widening `href` to `string` to accommodate them would delete the guarantee
 * for everything else.
 */
export type LandingHref = `/${LandingEntry["group"]}/${string}`;

export type SiteHref =
  | Route
  | LandingHref
  | `#${string}`
  | `https://${string}`
  | `mailto:${string}`;

export interface SiteLink {
  readonly label: string;
  readonly href: SiteHref;
  /** Opens in a new tab and gets `rel="noreferrer"`. */
  readonly external?: boolean;
}

export const COMMUNITY_URL = "https://community.vireo.studio";
export const SUPPORT_EMAIL = "mailto:support@vireo.studio";
export const CONTACT_EMAIL = "mailto:hello@vireo.studio";

export const SECTION_IDS = {
  howItWorks: "how-it-works",
  comparison: "comparison",
  pricing: "pricing",
  faq: "faq",
} as const;

// Home-page section anchors. Rendered as `/#how-it-works`, which is a plain
// string rather than a UrlObject so it satisfies SiteHref.
const anchor = (hash: string): SiteHref => `#${hash}`;

export const NAV_SECTION_LINKS: readonly SiteLink[] = [
  { label: "How it works", href: anchor(SECTION_IDS.howItWorks) },
  { label: "Pricing", href: "/pricing" },
  { label: "Frequently asked questions", href: anchor(SECTION_IDS.faq) },
];

export interface FooterColumn {
  readonly heading: string;
  readonly links: readonly SiteLink[];
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Link cloning", href: "/features/link-cloning" },
      { label: "AI actors", href: "/features/ai-actors" },
      { label: "Bulk variations", href: "/features/bulk-variations" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "DTC brands", href: "/solutions/dtc-brands" },
      { label: "Agencies", href: "/solutions/agencies" },
      { label: "App marketers", href: "/solutions/app-marketers" },
      { label: "Beauty and skincare", href: "/industries/beauty-and-skincare" },
      { label: "Fitness and supplements", href: "/industries/fitness-and-supplements" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "How it works", href: anchor(SECTION_IDS.howItWorks) },
      { label: "Why not an agency", href: anchor(SECTION_IDS.comparison) },
      { label: "Frequently asked questions", href: anchor(SECTION_IDS.faq) },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create an account", href: "/signup" },
      { label: "Open the studio", href: "/app" },
    ],
  },
];

/**
 * The footer's outbound row. Everything the product publishes lives on its own
 * domain — there are no third-party profile links, because a link to an account
 * that does not exist is worse than no link at all.
 */
export const OUTBOUND_LINKS: readonly SiteLink[] = [
  { label: "Community", href: COMMUNITY_URL, external: true },
  { label: "Support", href: SUPPORT_EMAIL, external: true },
  { label: "Contact", href: CONTACT_EMAIL, external: true },
];
