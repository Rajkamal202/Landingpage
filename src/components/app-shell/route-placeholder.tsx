import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";

/**
 * Phase 1 scaffolding.
 *
 * Every route in SPEC §7.2 exists from the start so links typecheck, the shell
 * can be walked end to end, and each Phase 2 agent has a stable mount point it
 * owns outright. Each placeholder names the surface, the spec section that
 * defines it, and the agent responsible — so an unfinished screen reads as
 * scheduled work rather than a bug.
 *
 * Replaced wholesale by the owning agent. No placeholder ships to production.
 */
export function RoutePlaceholder({
  title,
  specSection,
  owner,
  summary,
  glyph,
  className,
}: {
  title: string;
  specSection: string;
  owner: string;
  summary: string;
  glyph: IconDef;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-lg bg-ink-100 text-ink-400">
        <Icon glyph={glyph} size={24} />
      </span>
      <div className="flex max-w-measure flex-col gap-2">
        <h1 className="text-title-lg text-ink-950">{title}</h1>
        <p className="text-body-md text-ink-500">{summary}</p>
      </div>
      <p className="mono-sm text-ink-400">
        {specSection} · {owner}
      </p>
    </div>
  );
}
