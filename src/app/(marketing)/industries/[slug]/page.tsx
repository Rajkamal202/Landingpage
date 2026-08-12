import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLandingEntry, getRelatedEntries, listLandingSlugs } from "@/content/landing";
import { LandingTemplate } from "@/components/marketing/landing-template";

/**
 * SPEC §6.8 — rendered from the typed content collection. Every industry page
 * carries genuinely distinct copy; the collection is the source of truth and a
 * slug that has no entry 404s rather than rendering a hollow page.
 */
export function generateStaticParams() {
  return listLandingSlugs("industries");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getLandingEntry("industries", slug);
  if (!entry) return {};
  return {
    title: entry.metaTitle,
    description: entry.metaDescription,
    alternates: { canonical: `/industries/${entry.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getLandingEntry("industries", slug);
  if (!entry) notFound();
  return <LandingTemplate entry={entry} related={getRelatedEntries(entry)} />;
}
