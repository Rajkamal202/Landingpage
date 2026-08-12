import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";

const badge = cva(
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-ink-100 text-ink-700",
        brand: "bg-brand-50 text-brand-700",
        success: "bg-success/10 text-success-600",
        warning: "bg-warning/10 text-warning-700",
        danger: "bg-danger/10 text-danger",
        /** On dark surfaces — pricing "Popular", enterprise "Concierge". */
        inverse: "bg-white/12 text-white",
        outline: "border border-ink-200 bg-surface text-ink-700",
      },
      size: {
        sm: "text-label h-5 px-2",
        md: "text-body-sm h-6 px-2",
      },
      shape: { rect: "", pill: "rounded-pill" },
    },
    defaultVariants: { tone: "neutral", size: "sm", shape: "rect" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {
  glyph?: IconDef;
}

export function Badge({ className, tone, size, shape, glyph, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone, size, shape }), className)} {...props}>
      {glyph ? <Icon glyph={glyph} size={16} className="-ml-px" /> : null}
      {children}
    </span>
  );
}
