"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { BulkColumn } from "@/lib/schemas";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconDelete,
  IconGenerate,
} from "@/components/icons";
import { selectRange, useBulkStore } from "@/lib/stores/bulk";
import { BulkCell } from "./bulk-cell";
import { GUTTER_WIDTH, ROW_HEIGHT, useBulkGridActions } from "./grid-context";

/**
 * One virtualised row.
 *
 * Rows are absolutely positioned with `top` rather than a transform: a
 * transformed ancestor is exactly the thing that makes a `position: sticky`
 * first column stop sticking, and at two dozen mounted rows the difference is
 * unmeasurable.
 */
export interface BulkRowProps {
  rowIndex: number;
  rowId: string;
  columns: readonly BulkColumn[];
  top: number;
  totalWidth: number;
}

export const BulkRow = React.memo(function BulkRow({
  rowIndex,
  rowId,
  columns,
  top,
  totalWidth,
}: BulkRowProps) {
  const actions = useBulkGridActions();
  const inSelection = useBulkStore((store) => {
    const range = selectRange(store);
    return rowIndex >= range.top && rowIndex <= range.bottom;
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="row"
          // Roving tabindex — see the note in bulk-cell.tsx.
          tabIndex={-1}
          aria-rowindex={rowIndex + 2}
          data-row-id={rowId}
          onContextMenu={() => actions.pressRowMenu(rowIndex)}
          className="absolute left-0 flex"
          // dynamic: the virtualiser's measured offset and the summed column widths.
          style={{ top, height: ROW_HEIGHT, width: totalWidth }}
        >
          <div
            role="rowheader"
            aria-colindex={1}
            onPointerDown={() => actions.pressRowHeader(rowIndex)}
            className={cn(
              "mono-sm sticky left-0 z-(--z-sticky) flex shrink-0 items-center justify-center",
              "border-b border-r border-ink-200 transition-ui duration-(--dur-instant)",
              inSelection ? "bg-brand-50 text-brand-700" : "bg-ink-50 text-ink-500",
            )}
            // dynamic: the row-number gutter width, shared with the header.
            style={{ width: GUTTER_WIDTH }}
          >
            {rowIndex + 1}
          </div>

          {columns.map((column, colIndex) => (
            <BulkCell
              key={column.id}
              rowIndex={rowIndex}
              colIndex={colIndex}
              column={column}
              width={column.width}
              sticky={colIndex === 0}
              stickyOffset={GUTTER_WIDTH}
            />
          ))}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <RowMenuItems />
      </ContextMenuContent>
    </ContextMenu>
  );
});

function RowMenuItems() {
  const actions = useBulkGridActions();
  const count = useBulkStore((store) => {
    const range = selectRange(store);
    return range.bottom - range.top + 1;
  });
  const noun = count === 1 ? "row" : `${count} rows`;

  return (
    <>
      <ContextMenuItem glyph={IconGenerate} shortcut="⌘↵" onSelect={actions.generateSelection}>
        Generate {noun}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem glyph={IconCopy} shortcut="⌘⇧D" onSelect={actions.duplicateSelection}>
        Duplicate {noun}
      </ContextMenuItem>
      <ContextMenuItem glyph={IconArrowUp} shortcut="⌥↑" onSelect={() => actions.moveSelection(-1)}>
        Move {noun} up
      </ContextMenuItem>
      <ContextMenuItem
        glyph={IconArrowDown}
        shortcut="⌥↓"
        onSelect={() => actions.moveSelection(1)}
      >
        Move {noun} down
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        glyph={IconDelete}
        shortcut="⌘⌫"
        tone="danger"
        onSelect={actions.deleteSelection}
      >
        Delete {noun}
      </ContextMenuItem>
    </>
  );
}
