"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

/**
 * SPEC §8.2 — the responsive masonry of results.
 *
 * CSS multi-column would be shorter, but it fills column one before column
 * two, which buries the newest result at the bottom left. Distributing items
 * round-robin across measured columns keeps reading order left-to-right, so
 * the tiles that appear the moment you press generate are the top row.
 */
export function useColumnCount(): number {
  const sm = useMediaQuery("(min-width: 640px)");
  const lg = useMediaQuery("(min-width: 1024px)");
  const xl = useMediaQuery("(min-width: 1536px)");
  // Denser than a gallery on purpose. At four columns a 9:16 tile is over
  // 500px tall inside a 1200px container, so a single row does not fit above
  // the floating composer and the grid reads as three enormous posters rather
  // than a set of results to compare.
  if (xl) return 6;
  if (lg) return 5;
  if (sm) return 3;
  return 2;
}

export interface MasonryProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  ariaLabel: string;
  className?: string;
}

export function Masonry<T>({ items, getKey, renderItem, ariaLabel, className }: MasonryProps<T>) {
  const columns = useColumnCount();

  const buckets = React.useMemo(() => {
    const out: T[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, index) => {
      out[index % columns]?.push(item);
    });
    return out;
  }, [items, columns]);

  return (
    <div role="list" aria-label={ariaLabel} className={cn("flex items-start gap-4", className)}>
      {buckets.map((bucket, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
          {bucket.map((item) => (
            <div key={getKey(item)} role="listitem">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
