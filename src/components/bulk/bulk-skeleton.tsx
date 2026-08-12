"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { GUTTER_WIDTH, HEADER_HEIGHT, ROW_HEIGHT } from "./grid-context";

/**
 * SPEC §13: skeletons, not spinners, for content.
 *
 * It is shaped like the grid it is standing in for — the same gutter, the same
 * column rhythm, the same row height — so the sheet resolves into place rather
 * than replacing something that looked nothing like it.
 */
const COLUMN_WIDTHS = [280, 340, 200, 180, 160, 160, 160, 160, 140] as const;
const ROWS = 14;

export function BulkSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface" aria-hidden="true">
      <div
        className="flex shrink-0 border-b border-ink-200 bg-ink-50"
        // dynamic: the header band height, shared with the real grid.
        style={{ height: HEADER_HEIGHT }}
      >
        {/* dynamic: the row-number gutter width. */}
        <div className="shrink-0 border-r border-ink-200" style={{ width: GUTTER_WIDTH }} />
        {COLUMN_WIDTHS.map((width, index) => (
          <div
            key={index}
            className="flex shrink-0 items-center border-r border-ink-200 px-2"
            // dynamic: the template's own column widths.
            style={{ width }}
          >
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {Array.from({ length: ROWS }, (_, row) => (
        <div
          key={row}
          className="flex shrink-0"
          // dynamic: the grid's row height, shared with the virtualiser.
          style={{ height: ROW_HEIGHT }}
        >
          <div
            className="shrink-0 border-b border-r border-ink-200 bg-ink-50"
            // dynamic: the row-number gutter width.
            style={{ width: GUTTER_WIDTH }}
          />
          {COLUMN_WIDTHS.map((width, index) => (
            <div
              key={index}
              className="flex shrink-0 items-center border-b border-r border-ink-200 px-2"
              // dynamic: the template's own column widths.
              style={{ width }}
            >
              <Skeleton className="h-3 w-full" shimmer={row < 6} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
