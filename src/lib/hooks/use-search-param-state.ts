"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * SPEC §10: "URL is state where it should be." Active tab, selected asset,
 * playhead position and grid filters live in search params so a refresh
 * restores context and a link is shareable.
 *
 * `mode` matters: navigation-like changes (opening an asset) push so Back
 * works; continuous changes (dragging a playhead) replace, or the history
 * stack fills with 400 entries.
 */
export interface SearchParamOptions<T> {
  defaultValue: T;
  parse?: (raw: string) => T | null;
  serialize?: (value: T) => string | null;
  mode?: "push" | "replace";
}

export function useSearchParamState<T = string>(
  key: string,
  options: SearchParamOptions<T>,
): [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    defaultValue,
    parse = (raw: string) => raw as unknown as T,
    serialize = (value: T) => (value == null ? null : String(value)),
    mode = "replace",
  } = options;

  const raw = searchParams.get(key);
  const value = React.useMemo(() => {
    if (raw === null) return defaultValue;
    const parsed = parse(raw);
    return parsed === null ? defaultValue : parsed;
    // `parse` is typically an inline arrow; depending on it would thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, defaultValue]);

  const setValue = React.useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());
      const serialized = serialize(next);
      if (serialized === null || serialized === "") params.delete(key);
      else params.set(key, serialized);

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      // Typed routes cannot know a runtime-built query string; the pathname
      // itself is unchanged, so this navigation is always valid.
      const target = href as Parameters<typeof router.replace>[0];
      if (mode === "push") router.push(target, { scroll: false });
      else router.replace(target, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, mode, pathname, router, searchParams],
  );

  return [value, setValue];
}

/** Convenience for the very common enum-valued case. */
export function useSearchParamEnum<T extends string>(
  key: string,
  allowed: readonly T[],
  defaultValue: T,
  mode: "push" | "replace" = "replace",
): [T, (value: T) => void] {
  return useSearchParamState<T>(key, {
    defaultValue,
    mode,
    parse: (raw) => (allowed.includes(raw as T) ? (raw as T) : null),
    serialize: (value) => (value === defaultValue ? null : value),
  });
}
