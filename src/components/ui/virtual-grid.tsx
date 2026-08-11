"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";

/**
 * Virtualised responsive grid for the library, template and actor browsers.
 *
 * The column count is measured rather than assumed, so the same component
 * works at 390px and 1920px without a breakpoint table. Only rows are
 * virtualised — columns are always few enough to render whole, and windowing
 * both axes buys nothing while making keyboard focus order unpredictable.
 */
export interface VirtualGridProps<T> {
  items: readonly T[];
  /** Target minimum column width in px; the grid fits as many as will go. */
  minColumnWidth: number;
  rowHeight: number;
  gap?: number;
  overscan?: number;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  ariaLabel: string;
}

export function VirtualGrid<T>({
  items,
  minColumnWidth,
  rowHeight,
  gap = 16,
  overscan = 3,
  getKey,
  renderItem,
  className,
  ariaLabel,
}: VirtualGridProps<T>) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const columns = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight + gap,
    overscan,
  });

  return (
    <div ref={scrollRef} className={cn("h-full overflow-y-auto", className)}>
      <div
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={rowCount}
        className="relative w-full"
        // dynamic: total scroll height is the virtualizer's measurement.
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowItems = items.slice(start, start + columns);
          return (
            <div
              key={virtualRow.key}
              role="row"
              aria-rowindex={virtualRow.index + 1}
              className="absolute left-0 top-0 grid w-full"
              // dynamic: row offset and column template come from the measured
              // container width and the virtualizer.
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: `${rowHeight}px`,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: `${gap}px`,
                marginBottom: `${gap}px`,
              }}
            >
              {rowItems.map((item, columnIndex) => (
                <div key={getKey(item, start + columnIndex)} role="gridcell" className="min-w-0">
                  {renderItem(item, start + columnIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
