/**
 * The route map under test. Kept in one place so a new route is covered by
 * every audit at once rather than being added to four spec files.
 *
 * `PROJECT_ID` is a seeded fixture project that exists in every run.
 */
export const PROJECT_ID = "proj-serum-hooks";

export interface RouteUnderTest {
  path: string;
  name: string;
  /** Editors are desktop-only by design (SPEC §13) — skip narrow viewports. */
  desktopOnly?: boolean;
}

export const MARKETING_ROUTES: RouteUnderTest[] = [
  { path: "/", name: "home" },
  { path: "/pricing", name: "pricing" },
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
  { path: "/features/link-cloning", name: "features-link-cloning" },
  { path: "/features/ai-actors", name: "features-ai-actors" },
  { path: "/features/bulk-variations", name: "features-bulk-variations" },
  { path: "/solutions/dtc-brands", name: "solutions-dtc-brands" },
  { path: "/solutions/agencies", name: "solutions-agencies" },
  { path: "/solutions/app-marketers", name: "solutions-app-marketers" },
  { path: "/industries/beauty-and-skincare", name: "industries-beauty" },
  { path: "/industries/fitness-and-supplements", name: "industries-fitness" },
];

export const APP_ROUTES: RouteUnderTest[] = [
  { path: "/app", name: "workspace" },
  { path: "/app/import", name: "import" },
  { path: "/app/library", name: "library" },
  { path: "/app/templates", name: "templates" },
  { path: "/app/actors", name: "actors" },
  { path: "/app/brand", name: "brand" },
  { path: "/app/settings/account", name: "settings-account" },
  { path: "/app/settings/billing", name: "settings-billing" },
  { path: "/app/settings/team", name: "settings-team" },
  { path: `/app/p/${PROJECT_ID}/studio`, name: "studio" },
  { path: `/app/p/${PROJECT_ID}/timeline`, name: "timeline", desktopOnly: true },
  { path: `/app/p/${PROJECT_ID}/canvas`, name: "canvas", desktopOnly: true },
  { path: `/app/p/${PROJECT_ID}/slideshow`, name: "slideshow", desktopOnly: true },
  { path: `/app/p/${PROJECT_ID}/bulk`, name: "bulk", desktopOnly: true },
];

export const ALL_ROUTES: RouteUnderTest[] = [...MARKETING_ROUTES, ...APP_ROUTES];

export const VIEWPORTS = [
  { width: 390, height: 844, name: "390" },
  { width: 768, height: 1024, name: "768" },
  { width: 1280, height: 900, name: "1280" },
  { width: 1920, height: 1080, name: "1920" },
] as const;
