"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSearchParamState } from "@/lib/hooks/use-search-param-state";
import type { CellRef } from "@/lib/stores/bulk";

/**
 * SPEC §10: the cell cursor lives in the URL, so a refresh puts you back on
 * the cell you were editing and a link to a row is shareable.
 *
 * Two details the naive version gets wrong. Row and column are written in a
 * single navigation — two `useSearchParamState` setters both build from the
 * same snapshot, so the second would erase the first. And the write is
 * debounced: an arrow key held down is sixty cursor moves a second, and sixty
 * history writes a second is how a grid ends up feeling like treacle.
 */
const SETTLE_MS = 600;

const parseIndex = (raw: string): number | null => {
  const value = Number.parseInt(raw, 10);
  return Number.isInteger(value) && value >= 0 ? value : null;
};

export function useCursorParams(): {
  initialCursor: CellRef | null;
  syncCursor: (cursor: CellRef) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [row] = useSearchParamState<number>("row", { defaultValue: -1, parse: parseIndex });
  const [col] = useSearchParamState<number>("col", { defaultValue: -1, parse: parseIndex });

  // Only the value the page opened with matters; after that the store owns it.
  const initialRef = React.useRef<CellRef | null>(
    row >= 0 ? { row, col: Math.max(0, col) } : null,
  );

  const searchRef = React.useRef(searchParams);
  searchRef.current = searchParams;
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const syncCursor = React.useCallback(
    (cursor: CellRef) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const params = new URLSearchParams(searchRef.current.toString());
        if (
          params.get("row") === String(cursor.row) &&
          params.get("col") === String(cursor.col)
        ) {
          return;
        }
        params.set("row", String(cursor.row));
        params.set("col", String(cursor.col));
        const href = `${pathname}?${params.toString()}`;
        // A runtime-built query string cannot be known to the typed-route map;
        // the pathname itself is unchanged, so the navigation is always valid.
        router.replace(href as Parameters<typeof router.replace>[0], { scroll: false });
      }, SETTLE_MS);
    },
    [pathname, router],
  );

  return { initialCursor: initialRef.current, syncCursor };
}
