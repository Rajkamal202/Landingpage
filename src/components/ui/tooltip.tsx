"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

/**
 * A tooltip is never the only carrier of information a user needs — it
 * supplements a control that already has an accessible name. It is used here
 * mainly for the *reason* something is disabled, which is why the trigger
 * stays focusable when disabled (see `Button`).
 *
 * 400ms open delay, then 0ms for neighbours in the same group, so sweeping
 * across a toolbar doesn't strobe.
 */
export function TooltipProvider({
  delayDuration = 400,
  skipDelayDuration = 300,
  children,
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 6, children, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "anim-pop z-(--z-dropdown) max-w-panel rounded-md bg-ink-950 px-2 py-1",
          "text-body-sm text-white shadow-elev-3",
          "origin-(--radix-tooltip-content-transform-origin)",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});

export interface TooltipProps {
  content: React.ReactNode;
  side?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["side"];
  align?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["align"];
  /** Keeps the tooltip reachable when the trigger is a disabled control. */
  disabledTrigger?: boolean;
  children: React.ReactNode;
}

/** The shorthand used almost everywhere. */
export function Tooltip({
  content,
  side = "top",
  align = "center",
  disabledTrigger = false,
  children,
}: TooltipProps) {
  if (!content) return <>{children}</>;
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        {disabledTrigger ? (
          // A disabled button emits no pointer events, so the tooltip would
          // never open. Wrapping it in a focusable span keeps the explanation
          // reachable by both mouse and keyboard (SPEC §8.2).
          <span tabIndex={0} className="inline-flex rounded-md">
            {children}
          </span>
        ) : (
          children
        )}
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}
