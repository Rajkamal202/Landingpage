"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { IconMinus, IconPlus } from "@/components/icons";
import { IconButton } from "./icon-button";

export interface NumberStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Hold-to-repeat accelerates: 400ms before the first repeat, then 120ms, then
 * tightening to 40ms. Without that ramp, dragging a batch count from 1 to 8
 * means eight deliberate clicks; with it, one press.
 */
export function NumberStepper({
  value,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  ariaLabel,
  disabled,
  className,
}: NumberStepperProps) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = React.useRef(value);
  latest.current = value;

  const stopRepeat = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  React.useEffect(() => stopRepeat, [stopRepeat]);

  const apply = React.useCallback(
    (delta: number) => {
      const next = Math.min(max, Math.max(min, latest.current + delta));
      if (next !== latest.current) {
        latest.current = next;
        onValueChange(next);
      }
      return next;
    },
    [max, min, onValueChange],
  );

  const startRepeat = (delta: number) => {
    apply(delta);
    let interval = 400;
    const tick = () => {
      const next = apply(delta);
      if (next === min || next === max) return stopRepeat();
      interval = Math.max(40, interval * 0.7);
      timer.current = setTimeout(tick, interval);
    };
    timer.current = setTimeout(tick, interval);
  };

  return (
    <div
      className={cn(
        "inline-flex h-control-md items-center gap-1 rounded-md border border-ink-200 bg-surface px-1",
        disabled && "bg-ink-50",
        className,
      )}
    >
      <IconButton
        label={`Decrease ${ariaLabel}`}
        glyph={IconMinus}
        size="sm"
        disabled={disabled || value <= min}
        onPointerDown={() => startRepeat(-step)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      />
      <input
        type="number"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(parsed)) return;
          onValueChange(Math.min(max, Math.max(min, parsed)));
        }}
        className={cn(
          "mono-sm w-8 bg-transparent text-center text-ink-950 focus-visible:outline-none",
          "disabled:text-ink-300",
          // The native spinners duplicate the buttons either side of them.
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
        )}
      />
      <IconButton
        label={`Increase ${ariaLabel}`}
        glyph={IconPlus}
        size="sm"
        disabled={disabled || value >= max}
        onPointerDown={() => startRepeat(step)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      />
    </div>
  );
}
