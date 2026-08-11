"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with content up to `maxRows`, then scroll. */
  autoGrow?: boolean;
  minRows?: number;
  maxRows?: number;
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, autoGrow = false, minRows = 2, maxRows = 10, invalid, value, ...props },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(forwardedRef, () => {
    // The ref is attached in the same render, so it is always populated by the
    // time any consumer can call this.
    return innerRef.current as HTMLTextAreaElement;
  }, []);

  const field = useFieldControl();
  const isInvalid = invalid ?? Boolean(field["aria-invalid"]);

  const resize = React.useCallback(() => {
    const el = innerRef.current;
    if (!el || !autoGrow) return;
    const styles = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const vertical =
      Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    // Collapse first so shrinking works, then measure the real content height.
    el.style.height = "auto";
    const max = lineHeight * maxRows + vertical;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [autoGrow, maxRows]);

  React.useLayoutEffect(resize, [resize, value]);

  return (
    <textarea
      ref={innerRef}
      rows={minRows}
      value={value}
      onInput={resize}
      className={cn(
        "w-full rounded-sm border bg-surface px-3 py-2 text-ink-950",
        "text-body-md placeholder:text-ink-400",
        "transition-ui duration-(--dur-fast)",
        "focus-visible:border-brand-500",
        "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-300",
        autoGrow ? "resize-none" : "resize-y",
        isInvalid ? "border-danger" : "border-ink-200 hover:border-ink-300",
        className,
      )}
      {...field}
      {...props}
    />
  );
});
