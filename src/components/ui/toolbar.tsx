"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * SPEC §4.4: 8px gaps in dense toolbars. Both variants are `role="toolbar"`
 * with roving arrow-key focus, so a toolbar is one tab stop rather than
 * fourteen — which is the difference between a keyboard user reaching the
 * canvas in one press and in fifteen.
 */
export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  ariaLabel: string;
  orientation?: "horizontal" | "vertical";
}

export function Toolbar({
  ariaLabel,
  orientation = "horizontal",
  className,
  children,
  ...props
}: ToolbarProps) {
  const ref = useRovingFocus(orientation);
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={cn(
        "flex items-center gap-2",
        orientation === "vertical" && "flex-col",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * SPEC §8.2: translucent, blurred, `--elev-3`, floating above the content it
 * acts on.
 */
export function FloatingToolbar({
  ariaLabel,
  orientation = "horizontal",
  className,
  children,
  ...props
}: ToolbarProps) {
  const ref = useRovingFocus(orientation);
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={cn(
        "glass inline-flex items-center gap-1 rounded-pill border border-white/10",
        "bg-ink-950/70 p-1 shadow-elev-3",
        orientation === "vertical" && "flex-col",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Arrow keys move between controls, Home/End jump to the ends, and only the
 * active control is in the tab order.
 */
function useRovingFocus(orientation: "horizontal" | "vertical") {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [role="radio"]:not([aria-disabled="true"]), a[href]',
        ),
      );

    const sync = () => {
      const list = items();
      const active = list.find((item) => item.tabIndex === 0) ?? list[0];
      for (const item of list) item.tabIndex = item === active ? 0 : -1;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const next = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
      const previous = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
      if (![next, previous, "Home", "End"].includes(event.key)) return;

      const list = items();
      const index = list.findIndex((item) => item === document.activeElement);
      if (index === -1) return;

      event.preventDefault();
      const target =
        event.key === "Home"
          ? list[0]
          : event.key === "End"
            ? list[list.length - 1]
            : list[(index + (event.key === next ? 1 : -1) + list.length) % list.length];

      if (!target) return;
      for (const item of list) item.tabIndex = item === target ? 0 : -1;
      target.focus();
    };

    sync();
    container.addEventListener("keydown", onKeyDown);
    const observer = new MutationObserver(sync);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      container.removeEventListener("keydown", onKeyDown);
      observer.disconnect();
    };
  }, [orientation]);

  return ref;
}

/** A hairline divider between toolbar groups. */
export function ToolbarSeparator({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("h-5 w-px shrink-0 bg-ink-200", className)} />;
}
