"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-3", className)} {...props} />
  );
});

export const Radio = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function Radio({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-pill border bg-surface",
        "transition-ui duration-(--dur-fast) touch-target",
        "border-ink-300 hover:border-ink-400",
        "data-[state=checked]:border-ink-950",
        "disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-100",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="block size-2 rounded-pill bg-ink-950" />
    </RadioGroupPrimitive.Item>
  );
});
