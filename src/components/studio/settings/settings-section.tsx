import type * as React from "react";
import { cn } from "@/lib/cn";

/** The `<main>` and the single `h1` for a settings route (SPEC §11). */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-display-md text-ink-950">{title}</h1>
        <p className="text-body-md text-ink-500">{description}</p>
      </header>
      {children}
    </main>
  );
}

/** One card per subject, so a settings page is scannable rather than a wall. */
export function SettingsCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
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
          {description ? <p className="text-body-sm text-ink-500">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/**
 * SPEC §2 puts authentication, payment and persistence out of scope. Where a
 * control in here would reach a server that does not exist, the screen says so
 * in plain words instead of pretending — the same line the login form takes.
 */
export function LocalOnlyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-body-sm text-ink-500">{children}</p>;
}
