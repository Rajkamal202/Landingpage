"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Renders ⌘ on Apple platforms and Ctrl everywhere else. The platform is read
 * after mount — during SSR there is no navigator, and guessing wrong then
 * correcting is a visible flicker on the busiest surfaces in the app.
 *
 * Accepts a token string: "mod+z", "shift+alt+ArrowLeft", "?".
 */
const SYMBOLS: Record<string, { mac: string; other: string }> = {
  mod: { mac: "⌘", other: "Ctrl" },
  meta: { mac: "⌘", other: "Win" },
  alt: { mac: "⌥", other: "Alt" },
  shift: { mac: "⇧", other: "Shift" },
  ctrl: { mac: "⌃", other: "Ctrl" },
  enter: { mac: "↵", other: "Enter" },
  backspace: { mac: "⌫", other: "Backspace" },
  delete: { mac: "⌦", other: "Del" },
  escape: { mac: "Esc", other: "Esc" },
  arrowup: { mac: "↑", other: "↑" },
  arrowdown: { mac: "↓", other: "↓" },
  arrowleft: { mac: "←", other: "←" },
  arrowright: { mac: "→", other: "→" },
  space: { mac: "Space", other: "Space" },
};

export function useIsApplePlatform(): boolean {
  const [isApple, setIsApple] = React.useState(false);
  React.useEffect(() => {
    setIsApple(/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent));
  }, []);
  return isApple;
}

export function formatShortcut(shortcut: string, isApple: boolean): string[] {
  return shortcut.split("+").map((raw) => {
    const key = raw.trim().toLowerCase();
    const symbol = SYMBOLS[key];
    if (symbol) return isApple ? symbol.mac : symbol.other;
    return raw.length === 1 ? raw.toUpperCase() : raw;
  });
}

export interface KeyboardShortcutProps {
  keys: string;
  tone?: "default" | "inverse";
  className?: string;
}

export function KeyboardShortcut({ keys, tone = "default", className }: KeyboardShortcutProps) {
  const isApple = useIsApplePlatform();
  const parts = formatShortcut(keys, isApple);

  return (
    <kbd className={cn("inline-flex items-center gap-1", className)}>
      {parts.map((part, i) => (
        <span
          key={`${part}-${i}`}
          className={cn(
            "mono-sm grid h-5 min-w-5 place-items-center rounded-sm px-1",
            tone === "inverse"
              ? "bg-white/15 text-white"
              : "border border-ink-200 bg-ink-50 text-ink-500",
          )}
        >
          {part}
        </span>
      ))}
    </kbd>
  );
}
