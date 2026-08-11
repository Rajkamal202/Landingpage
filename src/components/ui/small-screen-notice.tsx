"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconGrid, type IconDef } from "@/components/icons";
import { ButtonLink } from "./button";

/**
 * SPEC §13: "Editor surfaces degrade honestly on mobile — a clear 'this needs
 * a larger screen' state is better than a broken timeline."
 *
 * One designed screen rather than four different apologies. It names the
 * surface, shows what the project is, says plainly what needs a bigger
 * viewport and what *is* possible here, and gives a real way onward.
 */
export interface SmallScreenNoticeProps {
  surface: string;
  projectName: string;
  glyph: IconDef;
  /** What the user can genuinely still do from a phone. */
  available: string;
  className?: string;
}

export function SmallScreenNotice({
  surface,
  projectName,
  glyph,
  available,
  className,
}: SmallScreenNoticeProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-lg bg-ink-100 text-ink-400">
        <Icon glyph={glyph} size={24} />
      </span>

      <div className="flex max-w-measure flex-col gap-2">
        <h2 className="text-title-md text-ink-950">The {surface} needs a wider screen</h2>
        <p className="text-body-md text-ink-500">
          {projectName} is open and saved. Precise editing depends on a pointer and about
          1,000px of width, so rather than give you a cramped version, it waits for a laptop.
        </p>
        <p className="text-body-sm text-ink-400">{available}</p>
      </div>

      <ButtonLink href="/app" variant="secondary" size="md" iconStart={IconGrid}>
        Back to projects
      </ButtonLink>
    </div>
  );
}
