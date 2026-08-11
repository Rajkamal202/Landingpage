"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/cn";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  tone?: "ink" | "brand" | "success" | "warning" | "danger";
  indeterminate?: boolean;
}

const TONE = {
  ink: "bg-ink-950",
  brand: "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

export const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(function Progress({ className, value, tone = "ink", indeterminate, ...props }, ref) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={indeterminate ? null : value}
      className={cn("relative h-1 w-full overflow-hidden rounded-pill bg-ink-200", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-pill transition-ui duration-(--dur-base)",
          TONE[tone],
          indeterminate && "w-1/3 animate-shimmer",
        )}
        // dynamic: the fill width is the measured progress value.
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  );
});

export interface ProgressRingProps {
  /** 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

/**
 * Shared by the studio's generating tiles, the bulk grid's row status and the
 * import sequence — one arc, one cap, one easing, so "in progress" looks the
 * same everywhere it appears.
 */
export function ProgressRing({
  value,
  size = 24,
  strokeWidth = 2,
  className,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={0.2}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct / 100)}
        // dynamic: the arc length is the measured progress value.
        style={{ transition: "stroke-dashoffset var(--dur-base) var(--ease-out)" }}
      />
    </svg>
  );
}
