"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { LibrarySheet } from "./library-sheet";

/**
 * The frame the browse and settings screens share: one `<main>`, one `h1`, a
 * consistent measure and rhythm, and the library sheet mounted so the app
 * shell's Library button works from every screen this agent owns.
 *
 * `fill` switches the scroll container from the page to the content, which is
 * what a virtualised grid needs.
 */
export interface AppPageProps {
  title: string;
  description: string;
  /** Buttons that belong to the whole screen, aligned with the heading. */
  actions?: React.ReactNode;
  /** Filter and sort controls, under the heading. */
  toolbar?: React.ReactNode;
  fill?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AppPage({
  title,
  description,
  actions,
  toolbar,
  fill = false,
  children,
  className,
}: AppPageProps) {
  return (
    <main className={cn("flex min-h-0 flex-1 flex-col", fill ? "overflow-hidden" : "overflow-y-auto")}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-marketing flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8",
          fill && "min-h-0 flex-1",
        )}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-display-md text-ink-950">{title}</h1>
            <p className="text-body-md text-ink-500">{description}</p>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>

        {toolbar}

        <div className={cn("flex min-h-0 flex-1 flex-col", className)}>{children}</div>
      </div>

      <LibrarySheet />
    </main>
  );
}
