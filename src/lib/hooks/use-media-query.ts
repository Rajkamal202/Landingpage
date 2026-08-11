"use client";

import * as React from "react";

/**
 * Subscribes with `useSyncExternalStore` so the value is correct on the first
 * client render rather than flipping after an effect — which is what makes an
 * editor flash its small-screen notice on desktop.
 *
 * Returns `false` during SSR, so the server always renders the desktop branch
 * and the markup is stable.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `lg` breakpoint — the point below which the editors degrade. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function useIsCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
