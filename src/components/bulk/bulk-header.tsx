"use client";

import * as React from "react";
import type { Header } from "@tanstack/react-table";
import { cn } from "@/lib/cn";
import type { BulkColumn } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import {
  IconArrowLeft,
  IconArrowRight,
  IconChevronDown,
  IconGrip,
  IconSliders,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GUTTER_WIDTH, HEADER_HEIGHT } from "./grid-context";

/**
 * The sticky header: drag the divider to resize, drag the header itself to
 * reorder (SPEC §8.7).
 *
 * Both are mouse gestures, so both have a keyboard route — the per-column menu
 * moves and resets a column, and ⌥← / ⌥→ do the same from the grid. SPEC §11
 * asks for the equivalent, not for a second way of dragging.
 */
export interface GridRowRef {
  id: string;
}

export interface BulkHeaderProps {
  headers: ReadonlyArray<Header<GridRowRef, unknown>>;
  columnsById: ReadonlyMap<string, BulkColumn>;
  onMoveColumn: (from: number, to: number) => void;
  onResetWidth: (columnId: string) => void;
}

export function BulkHeader({ headers, columnsById, onMoveColumn, onResetWidth }: BulkHeaderProps) {
  const [dragFrom, setDragFrom] = React.useState<number | null>(null);
  const [dragOver, setDragOver] = React.useState<number | null>(null);

  return (
    <div
      role="row"
      aria-rowindex={1}
      className="sticky top-0 z-(--z-nav) flex bg-ink-50 shadow-elev-1"
      // dynamic: the header band height is shared with the virtualiser's offsets.
      style={{ height: HEADER_HEIGHT }}
    >
      <div
        role="columnheader"
        aria-colindex={1}
        className={cn(
          "sticky left-0 z-(--z-sticky) flex shrink-0 items-center justify-center",
          "border-b border-r border-ink-200 bg-ink-50",
        )}
        // dynamic: the row-number gutter width, shared with every body row.
        style={{ width: GUTTER_WIDTH }}
      >
        <span className="sr-only">Row</span>
        <Icon glyph={IconSliders} size={16} className="text-ink-300" />
      </div>

      {headers.map((header, index) => {
        const column = columnsById.get(header.column.id);
        if (!column) return null;
        const isResizing = header.column.getIsResizing();

        return (
          <div
            key={header.id}
            role="columnheader"
            // Roving tabindex — see the note in bulk-cell.tsx.
            tabIndex={-1}
            aria-colindex={index + 2}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", column.label);
              setDragFrom(index);
            }}
            onDragOver={(event) => {
              if (dragFrom === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOver(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragFrom !== null && dragFrom !== index) onMoveColumn(dragFrom, index);
              setDragFrom(null);
              setDragOver(null);
            }}
            onDragEnd={() => {
              setDragFrom(null);
              setDragOver(null);
            }}
            className={cn(
              "group relative flex shrink-0 items-center gap-1 border-b border-r border-ink-200",
              "bg-ink-50 pl-2 pr-1",
              index === 0 && "sticky left-0 z-(--z-sticky)",
              dragFrom === index && "opacity-50",
              dragOver === index && dragFrom !== index && "bg-brand-50",
            )}
            // dynamic: the live width from the resize drag, and the sticky offset past the gutter.
            style={{
              width: header.getSize(),
              ...(index === 0 ? { left: GUTTER_WIDTH } : {}),
            }}
          >
            <Icon
              glyph={IconGrip}
              size={16}
              className="shrink-0 cursor-grab text-ink-300 opacity-0 transition-ui duration-(--dur-instant) group-hover:opacity-100"
            />

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "text-label flex min-w-0 flex-1 items-center gap-1 rounded-sm px-1 py-1 text-left",
                  "text-ink-700 transition-ui duration-(--dur-instant)",
                  "hover:bg-ink-100 hover:text-ink-950 data-[state=open]:bg-ink-100",
                )}
              >
                <span className="truncate">{column.label}</span>
                <Icon
                  glyph={IconChevronDown}
                  size={16}
                  className="shrink-0 text-ink-500 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  glyph={IconArrowLeft}
                  shortcut="⌥←"
                  disabled={index === 0}
                  onSelect={() => onMoveColumn(index, index - 1)}
                >
                  Move left
                </DropdownMenuItem>
                <DropdownMenuItem
                  glyph={IconArrowRight}
                  shortcut="⌥→"
                  disabled={index === headers.length - 1}
                  onSelect={() => onMoveColumn(index, index + 1)}
                >
                  Move right
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem glyph={IconSliders} onSelect={() => onResetWidth(column.id)}>
                  Reset width
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              tabIndex={-1}
              aria-label={`Drag to resize the ${column.label} column`}
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              onDoubleClick={() => onResetWidth(column.id)}
              onDragStart={(event) => event.preventDefault()}
              className={cn(
                "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none",
                "transition-ui duration-(--dur-instant) hover:bg-brand-500",
                isResizing && "bg-brand-500",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
