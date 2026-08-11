"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useDragScrub } from "@/lib/hooks/use-drag-scrub";

/**
 * SPEC §15: "Drag-scrubbable number fields. Small detail, enormous
 * credibility." Used by every numeric property in the timeline, slideshow and
 * canvas panels — one implementation, so the feel is identical everywhere.
 *
 * Click focuses and types. Drag scrubs. Shift is fine, Alt is coarse. Arrow
 * keys step, with Shift for ten at a time, so it is fully operable without a
 * pointer (SPEC §11).
 */
export interface DragNumberInputProps {
  value: number;
  onValueChange: (value: number) => void;
  /** Called once when a drag gesture ends — the hook for committing to undo. */
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Units per pixel dragged. Lower for fine properties like opacity. */
  sensitivity?: number;
  /** Rendered after the number: "px", "°", "%". Never inside the value. */
  unit?: string;
  precision?: number;
  disabled?: boolean;
  id?: string;
  ariaLabel: string;
  className?: string;
}

export function DragNumberInput({
  value,
  onValueChange,
  onCommit,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  sensitivity = 1,
  unit,
  precision = 0,
  disabled = false,
  id,
  ariaLabel,
  className,
}: DragNumberInputProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { dragging, handlers } = useDragScrub({
    value,
    onChange: onValueChange,
    min,
    max,
    step,
    sensitivity,
    disabled,
    onDragEnd: () => onCommit?.(value),
  });

  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const commitDraft = () => {
    const parsed = Number.parseFloat(draft);
    setEditing(false);
    if (Number.isNaN(parsed)) return;
    const next = clamp(parsed);
    onValueChange(next);
    onCommit?.(next);
  };

  const beginEditing = () => {
    if (disabled || dragging) return;
    setDraft(value.toFixed(precision));
    setEditing(true);
    // Focus after the input mounts, then select so typing replaces the value.
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const magnitude = step * (event.shiftKey ? 10 : 1);
      const next = clamp(value + (event.key === "ArrowUp" ? magnitude : -magnitude));
      onValueChange(Number(next.toFixed(6)));
      onCommit?.(next);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (editing) commitDraft();
      else beginEditing();
    }
    if (event.key === "Escape" && editing) {
      event.preventDefault();
      setEditing(false);
    }
  };

  const shell = cn(
    "mono-sm flex h-control-md w-full items-center gap-1 rounded-sm border bg-surface px-2",
    "transition-ui duration-(--dur-instant)",
    disabled
      ? "cursor-not-allowed border-ink-200 bg-ink-50 text-ink-300"
      : "border-ink-200 text-ink-950 hover:border-ink-300",
    dragging && "border-brand-500",
    className,
  );

  if (editing) {
    return (
      <div className={shell}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          aria-label={ariaLabel}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={onKeyDown}
          className="mono-sm min-w-0 flex-1 bg-transparent text-ink-950 focus-visible:outline-none"
        />
        {unit ? <span className="shrink-0 text-ink-400">{unit}</span> : null}
      </div>
    );
  }

  return (
    <div
      role="spinbutton"
      tabIndex={disabled ? -1 : 0}
      id={id}
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={Number.isFinite(min) ? min : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      onDoubleClick={beginEditing}
      onClick={(event) => {
        // A plain click with no drag should open the field for typing.
        if (!dragging && event.detail === 1) beginEditing();
      }}
      className={cn(shell, !disabled && "cursor-ew-resize select-none")}
      {...(disabled ? {} : handlers)}
    >
      <span className="min-w-0 flex-1 truncate">{value.toFixed(precision)}</span>
      {unit ? <span className="shrink-0 text-ink-400">{unit}</span> : null}
    </div>
  );
}
