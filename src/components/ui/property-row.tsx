"use client";

import * as React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconChevronDown } from "@/components/icons";

/**
 * The 280px property panel grid (SPEC §4.4, §8.4–8.6).
 *
 * Every editor's right-hand panel is built only from these two components.
 * That is the whole reason the timeline, canvas and slideshow panels — written
 * by three different people — read as one product: the label column is the
 * same width, the row rhythm is the same 12px, and the controls line up
 * across surfaces.
 */
export interface PropertyRowProps {
  label: React.ReactNode;
  htmlFor?: string;
  /** Stack the control under the label for wide inputs (a textarea, a swatch row). */
  layout?: "inline" | "stacked";
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function PropertyRow({
  label,
  htmlFor,
  layout = "inline",
  hint,
  children,
  className,
}: PropertyRowProps) {
  const content = (
    <>
      <label
        htmlFor={htmlFor}
        className={cn(
          "text-label text-ink-500",
          // Optical: the label sits on the control's first text baseline, not
          // centred on the control box, which reads as misaligned at 36px.
          layout === "inline" && "pt-2",
        )}
      >
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </>
  );

  return (
    <div
      className={cn(
        layout === "inline" ? "property-grid" : "flex flex-col gap-2",
        className,
      )}
    >
      {content}
      {hint ? (
        <p className={cn("text-body-sm text-ink-500", layout === "inline" && "col-start-2")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface PanelSectionProps {
  title: string;
  defaultOpen?: boolean;
  /** A count, a reset button — anything that belongs on the section header. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PanelSection({
  title,
  defaultOpen = true,
  action,
  children,
  className,
}: PanelSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className={cn("border-b border-ink-200 last:border-b-0", className)}
    >
      <div className="flex items-center gap-2 pr-3">
        <Collapsible.Trigger
          className={cn(
            "group flex flex-1 items-center gap-2 py-3 pl-3 text-left",
            "text-label text-ink-950 transition-ui duration-(--dur-instant)",
            "hover:text-ink-700",
          )}
        >
          <Icon
            glyph={IconChevronDown}
            size={16}
            className={cn(
              "text-ink-500 transition-ui duration-(--dur-fast)",
              !open && "-rotate-90",
            )}
          />
          {title}
        </Collapsible.Trigger>
        {action}
      </div>
      <Collapsible.Content className="overflow-hidden">
        <div className="flex flex-col gap-3 px-3 pb-4">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

/** The panel shell itself — fixed 280px, never a percentage (SPEC §4.4). */
export function PropertyPanel({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  "aria-label": string;
}) {
  return (
    <aside
      aria-label={ariaLabel}
      className={cn(
        "flex w-panel shrink-0 flex-col overflow-y-auto border-l border-ink-200 bg-surface",
        className,
      )}
    >
      {children}
    </aside>
  );
}
