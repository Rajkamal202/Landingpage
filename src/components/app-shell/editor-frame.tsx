"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import type { IconDef } from "@/components/icons";
import { SmallScreenNotice } from "@/components/ui/small-screen-notice";

/**
 * The frame every editor mounts into — timeline, canvas, slideshow, bulk.
 *
 * It exists so that four surfaces built by four people share one chrome:
 * the same toolbar band, the same 280px right panel, the same honest
 * small-screen behaviour. An agent fills the slots; it does not redesign the
 * shell around them.
 */
export interface EditorFrameProps {
  /** Editor-specific toolbar row, under the app top bar. */
  toolbar?: React.ReactNode;
  /** The editing surface itself. */
  children: React.ReactNode;
  /** The 280px contextual property panel. */
  panel?: React.ReactNode;
  /** Timeline track area, bulk summary bar — anything docked to the bottom. */
  footer?: React.ReactNode;
  /** For the small-screen fallback. */
  surface: string;
  projectName: string;
  glyph: IconDef;
  availableOnMobile: string;
  className?: string;
}

export function EditorFrame({
  toolbar,
  children,
  panel,
  footer,
  surface,
  projectName,
  glyph,
  availableOnMobile,
  className,
}: EditorFrameProps) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <SmallScreenNotice
        surface={surface}
        projectName={projectName}
        glyph={glyph}
        available={availableOnMobile}
      />
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {toolbar ? (
        <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-ink-200 bg-surface px-3">
          {toolbar}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
          {footer}
        </div>
        {panel}
      </div>
    </div>
  );
}
