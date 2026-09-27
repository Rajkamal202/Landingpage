import type { Route } from "next";
import type { LandingEntry } from "@/content/landing";

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

export const COMMUNITY_URL = "https://community.avelon.studio";
export const SUPPORT_EMAIL = "mailto:support@avelon.studio";
export const CONTACT_EMAIL = "mailto:hello@avelon.studio";

export const SECTION_IDS = {
  templates: "templates",
  howItWorks: "how-it-works",
  comparison: "comparison",
  pricing: "pricing",
  faq: "faq",
} as const;

const anchor = (hash: string): SiteHref => `#${hash}`;

export const NAV_SECTION_LINKS: readonly SiteLink[] = [
  { label: "Templates", href: anchor(SECTION_IDS.templates) },
  { label: "Capabilities", href: anchor(SECTION_IDS.howItWorks) },
  { label: "Comparison", href: anchor(SECTION_IDS.comparison) },
  { label: "Pricing", href: anchor(SECTION_IDS.pricing) },
  { label: "FAQ", href: anchor(SECTION_IDS.faq) },
];

export interface FooterColumn {
  readonly heading: string;
  readonly links: readonly SiteLink[];
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Video Templates", href: anchor(SECTION_IDS.templates) },
      { label: "AI UGC Actors", href: "/features/ai-actors" },
      { label: "Link Cloning", href: "/features/link-cloning" },
      { label: "Batch Variations", href: "/features/bulk-variations" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "DTC Brands", href: "/solutions/dtc-brands" },
      { label: "Performance Agencies", href: "/solutions/agencies" },
      { label: "App Marketers", href: "/solutions/app-marketers" },
      { label: "Beauty & Skincare", href: "/industries/beauty-and-skincare" },
      { label: "Fitness & Wellness", href: "/industries/fitness-and-supplements" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "How It Works", href: anchor(SECTION_IDS.howItWorks) },
      { label: "Agency vs Avelon", href: anchor(SECTION_IDS.comparison) },
      { label: "Platform FAQ", href: anchor(SECTION_IDS.faq) },
      { label: "Pricing & Plans", href: anchor(SECTION_IDS.pricing) },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Community", href: COMMUNITY_URL, external: true },
      { label: "Contact Us", href: CONTACT_EMAIL, external: true },
      { label: "Support", href: SUPPORT_EMAIL, external: true },
      { label: "Log in", href: "/login" },
    ],
  },
];

export const OUTBOUND_LINKS: readonly SiteLink[] = [
  { label: "Community", href: COMMUNITY_URL, external: true },
  { label: "Support", href: SUPPORT_EMAIL, external: true },
  { label: "Contact", href: CONTACT_EMAIL, external: true },
];
