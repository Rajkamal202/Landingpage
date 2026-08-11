"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/cn";

/**
 * The tick is a stroked path with an animated `stroke-dashoffset` rather than
 * an icon that pops in — it draws itself over `--dur-fast`, which is the
 * difference between a control that acknowledges you and one that just
 * changes colour. Under reduced motion the global rule collapses it to 1ms.
 */
export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "group grid size-5 shrink-0 place-items-center rounded-sm border bg-surface",
        "transition-ui duration-(--dur-fast) touch-target",
        "border-ink-300 hover:border-ink-400",
        "data-[state=checked]:border-ink-950 data-[state=checked]:bg-ink-950",
        "data-[state=indeterminate]:border-ink-950 data-[state=indeterminate]:bg-ink-950",
        "disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-100",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-white">
        {props.checked === "indeterminate" ? (
          <span className="block h-px w-2 bg-current" />
        ) : (
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className="check-path"
            />
          </svg>
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
