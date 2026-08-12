import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * One card per decision. The brand kit is the only setup Vireo asks for
 * (SPEC §6.6, §8.3), so the screen is built from small, finished sections a
 * person can fill in any order rather than one long form they have to survive.
 */
export function BrandSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-ink-200 bg-surface p-5 shadow-elev-1",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-title-md text-ink-950">{title}</h2>
          <p className="text-body-sm text-ink-500">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
