"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { transition } from "@/lib/motion/variants";

/**
 * Two looks, one behaviour. The active indicator is a single element that
 * *moves* between triggers via `layoutId` rather than fading in and out — the
 * travel is what stops a tab strip reading as a row of radio buttons.
 *
 * That requires knowing which trigger is active at render time, which Radix
 * exposes only as a DOM attribute, so this wrapper mirrors the value into
 * context. It supports controlled and uncontrolled use exactly as Radix does.
 */

interface TabsContextValue {
  variant: "line" | "pill";
  id: string;
  value: string | undefined;
}

const TabsContext = React.createContext<TabsContextValue>({
  variant: "line",
  id: "tabs",
  value: undefined,
});

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: "line" | "pill";
}

export function Tabs({
  variant = "line",
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: TabsProps) {
  const id = React.useId();
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value ?? internal;

  const handleChange = React.useCallback(
    (next: string) => {
      setInternal(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  const ctx = React.useMemo<TabsContextValue>(
    () => ({ variant, id, value: current }),
    [variant, id, current],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <TabsPrimitive.Root
        className={cn("flex flex-col", className)}
        {...(value === undefined ? { defaultValue } : { value })}
        onValueChange={handleChange}
        {...props}
      />
    </TabsContext.Provider>
  );
}

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  const { variant } = React.useContext(TabsContext);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "relative flex items-center",
        variant === "line" ? "gap-5 border-b border-ink-200" : "gap-1 rounded-md bg-ink-100 p-1",
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, children, value, ...props }, ref) {
  const { variant, id, value: active } = React.useContext(TabsContext);
  const isActive = active === value;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "relative inline-flex items-center gap-2 whitespace-nowrap",
        "text-body-sm font-medium transition-ui duration-(--dur-instant)",
        "disabled:pointer-events-none disabled:text-ink-300",
        variant === "line"
          ? "-mb-px h-10 text-ink-500 hover:text-ink-950 data-[state=active]:text-ink-950"
          // The pill variant's track is `bg-ink-100`, where ink-500 measures
          // 4.34:1. The line variant sits on the page, where it passes.
          : "h-8 rounded-sm px-3 text-ink-700 hover:text-ink-950 data-[state=active]:text-ink-950",
        className,
      )}
      {...props}
    >
      {isActive ? (
        <motion.span
          layoutId={variant === "pill" ? `${id}-pill` : `${id}-line`}
          transition={transition.base}
          aria-hidden="true"
          className={
            variant === "pill"
              ? "absolute inset-0 rounded-sm bg-surface shadow-elev-1"
              : "absolute inset-x-0 -bottom-px h-px bg-ink-950"
          }
        />
      ) : null}
      <span className="relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
});

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("focus-visible:outline-none", className)}
      {...props}
    />
  );
});
