"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

/**
 * Track colour crossfades over `--dur-fast`; the thumb travels on the same
 * beat. The thumb keeps a contact shadow so it reads as sitting *on* the
 * track rather than being a hole cut out of it.
 */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "group relative inline-flex h-5 w-8 shrink-0 items-center rounded-pill p-px",
        "transition-ui duration-(--dur-fast) touch-target",
        "bg-ink-300 hover:bg-ink-400",
        "data-[state=checked]:bg-ink-950 data-[state=checked]:hover:bg-ink-900",
        "disabled:cursor-not-allowed disabled:bg-ink-200",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-4 rounded-pill bg-white shadow-elev-1",
          "transition-ui duration-(--dur-fast)",
          "translate-x-0 data-[state=checked]:translate-x-3",
          "group-disabled:bg-ink-100",
        )}
      />
    </SwitchPrimitive.Root>
  );
});
