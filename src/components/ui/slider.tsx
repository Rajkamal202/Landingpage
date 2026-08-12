"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/cn";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Shows a value bubble above the thumb while dragging or focused. */
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider({ className, showValue = false, formatValue, ...props }, ref) {
  const values = props.value ?? props.defaultValue ?? [0];
  // Radix puts the slider role on the THUMB, not the root, so a name set on
  // the root never reaches the control axe is inspecting. Forward it, and give
  // each thumb an ordinal when there is more than one.
  const rootLabel = props["aria-label"];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("group relative flex w-full touch-none items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-pill bg-ink-200">
        <SliderPrimitive.Range className="absolute h-full bg-ink-950" />
      </SliderPrimitive.Track>
      {values.map((value, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={
            rootLabel === undefined
              ? undefined
              : values.length > 1
                ? `${rootLabel}, handle ${i + 1}`
                : rootLabel
          }
          className={cn(
            "relative block size-4 rounded-pill border border-ink-300 bg-white shadow-elev-1",
            "transition-ui duration-(--dur-instant)",
            "hover:border-ink-400 hover:shadow-elev-2",
            "active:scale-95",
            "disabled:pointer-events-none disabled:border-ink-200 disabled:bg-ink-100",
          )}
        >
          {showValue ? (
            <span
              className={cn(
                "mono-sm pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2",
                "rounded-sm bg-ink-950 px-2 py-1 text-white opacity-0",
                "transition-ui duration-(--dur-fast)",
                "group-hover:opacity-100 group-focus-within:opacity-100",
              )}
            >
              {formatValue ? formatValue(value) : value}
            </span>
          ) : null}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
});
