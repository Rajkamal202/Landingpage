import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";

/**
 * SPEC §5: mandatory on every list, grid, canvas and timeline. SPEC §15 puts
 * it plainly — empty states are most of what separates a demo from a product.
 *
 * The prop types enforce the shape: a title and a primary action are required.
 * There is no way to render a dead end with this component.
 */
export interface EmptyStateProps {
  glyph?: IconDef;
  /** Use for the large, illustrated empty states — a canvas, an empty project. */
  illustration?: React.ReactNode;
  title: string;
  /** One line explaining what goes here. Not a paragraph. */
  description: string;
  /** Required — an empty state without an action is a dead end. */
  action: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { wrap: "py-10 gap-3", icon: "size-10", title: "text-body-md", body: "text-body-sm" },
  md: { wrap: "py-16 gap-4", icon: "size-12", title: "text-title-md", body: "text-body-md" },
  lg: { wrap: "py-24 gap-5", icon: "size-16", title: "text-title-lg", body: "text-body-lg" },
} as const;

export function EmptyState({
  glyph,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        s.wrap,
        className,
      )}
    >
      {illustration ?? (
        glyph ? (
          <span
            className={cn(
              "grid place-items-center rounded-lg bg-ink-100 text-ink-500",
              s.icon,
            )}
          >
            <Icon glyph={glyph} size={20} />
          </span>
        ) : null
      )}
      <div className="flex max-w-measure flex-col gap-2">
        <h3 className={cn(s.title, "text-ink-950")}>{title}</h3>
        <p className={cn(s.body, "text-ink-500")}>{description}</p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        {action}
        {secondaryAction}
      </div>
    </div>
  );
}
