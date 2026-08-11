"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { transition } from "@/lib/motion/variants";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";

export interface SegmentedItem<T extends string> {
  value: T;
  label: React.ReactNode;
  glyph?: IconDef;
  /** Rendered inside the segment — e.g. the "Save 20%" badge on Yearly. */
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  items: readonly SegmentedItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  /** Dark fill for the mode toolbar; light fill for forms and pricing. */
  tone?: "light" | "dark";
  ariaLabel: string;
  className?: string;
}

/**
 * A single filled pill travels between segments with a shared `layoutId`
 * (SPEC §6.5, §8.2). Implemented as a radiogroup rather than buttons so arrow
 * keys move between options the way a native control does.
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onValueChange,
  size = "md",
  tone = "light",
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const id = React.useId();
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const move = (from: number, delta: number) => {
    const next = (from + delta + items.length) % items.length;
    const item = items[next];
    if (!item) return;
    if (item.disabled) return move(next, delta);
    onValueChange(item.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center rounded-pill p-1",
        tone === "light" ? "bg-ink-100" : "glass bg-ink-950/70",
        className,
      )}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={item.disabled}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                move(index, 1);
              }
              if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                move(index, -1);
              }
            }}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-pill font-medium",
              "transition-ui duration-(--dur-instant) focus-visible:ring-focus-inset",
              size === "sm" ? "h-control-sm px-3 text-body-sm" : "h-control-md px-4 text-body-sm",
              "disabled:pointer-events-none disabled:opacity-40",
              tone === "light"
                ? selected
                  ? "text-ink-950"
                  : "text-ink-500 hover:text-ink-950"
                : selected
                  ? "text-ink-950"
                  : "text-white/70 hover:text-white",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={`${id}-thumb`}
                transition={transition.base}
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 rounded-pill",
                  tone === "light" ? "bg-surface shadow-elev-1" : "bg-white",
                )}
              />
            ) : null}
            <span className="relative inline-flex items-center gap-2">
              {item.glyph ? <Icon glyph={item.glyph} size={16} /> : null}
              {item.label}
              {item.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}
