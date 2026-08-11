import { Logo } from "@/components/brand/logomark";

/**
 * Phase 1 scaffolding for the marketing routes, owned in Phase 2 by Agent
 * MARKETING. Present from the start so the footer and nav links typecheck
 * against Next.js typed routes rather than 404ing at runtime.
 */
export function MarketingPlaceholder({
  title,
  specSection,
  summary,
}: {
  title: string;
  specSection: string;
  summary: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-marketing flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo size={24} />
      <div className="flex max-w-measure flex-col gap-3">
        <h1 className="text-display-md text-ink-950">{title}</h1>
        <p className="text-body-lg text-ink-500">{summary}</p>
      </div>
      <p className="mono-sm text-ink-400">{specSection} · Agent MARKETING</p>
    </main>
  );
}
