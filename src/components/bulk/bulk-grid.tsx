"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTable, IconUpload } from "@/components/icons";
import {
  rangeSize,
  selectRange,
  useBulkStore,
  type CellRef,
} from "@/lib/stores/bulk";
import { displayValue, useBulkCatalog } from "./catalog";
import type { CommitDirection } from "./cell-editors";
import { BulkHeader, type GridRowRef } from "./bulk-header";
import { BulkRow } from "./bulk-row";
import {
  GUTTER_WIDTH,
  HEADER_HEIGHT,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  ROW_HEIGHT,
  BulkGridProvider,
  type BulkGridActions,
} from "./grid-context";
import { useBulkShortcuts } from "./use-bulk-shortcuts";
import { useGridClipboard } from "./use-grid-clipboard";

/**
 * The grid (SPEC §8.7).
 *
 * TanStack Table owns the *column* model — order, live resize widths, header
 * groups — and TanStack Virtual owns the rows. Body cells are rendered from
 * `getVisibleLeafColumns()` rather than from `row.getVisibleCells()` on
 * purpose: at 1,000 rows the cell model would build nine thousand objects on
 * every change, which is precisely the cost virtualisation exists to avoid.
 */
export interface BulkGridProps {
  onAddRow: () => void;
  onImport: () => void;
  onGenerateRows: (rowIds: readonly string[]) => void;
}

const OVERSCAN = 8;

export function BulkGrid({ onAddRow, onImport, onGenerateRows }: BulkGridProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const dragMode = React.useRef<"none" | "select" | "fill">("none");
  const [gridFocused, setGridFocused] = React.useState(false);

  const catalog = useBulkCatalog();
  const columns = useBulkStore((store) => store.columns);
  const rowIds = useBulkStore(useShallow((store) => store.rows.map((row) => row.id)));
  const editing = useBulkStore((store) => store.editing);
  const mediaEditOpen = useBulkStore(
    (store) => store.editing && store.columns[store.cursor.col]?.kind === "media",
  );

  const focusGrid = React.useCallback(() => gridRef.current?.focus(), []);

  /* ── Column model ────────────────────────────────────────────────────── */

  const data = React.useMemo<GridRowRef[]>(() => rowIds.map((id) => ({ id })), [rowIds]);
  const columnDefs = React.useMemo<Array<ColumnDef<GridRowRef>>>(
    () => columns.map((column) => ({ id: column.id, size: column.width })),
    [columns],
  );
  const columnSizing = React.useMemo(
    () => Object.fromEntries(columns.map((column) => [column.id, column.width])),
    [columns],
  );
  const columnsById = React.useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );

  const table = useReactTable<GridRowRef>({
    data,
    columns: columnDefs,
    state: { columnSizing },
    columnResizeMode: "onChange",
    defaultColumn: { minSize: MIN_COLUMN_WIDTH, maxSize: MAX_COLUMN_WIDTH },
    onColumnSizingChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnSizing) : updater;
      useBulkStore.getState().resizeColumns(next);
    },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRows = table.getRowModel().rows;
  const totalWidth = GUTTER_WIDTH + columns.reduce((sum, column) => sum + column.width, 0);

  /* ── Virtualisation ──────────────────────────────────────────────────── */

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    paddingStart: HEADER_HEIGHT,
    getItemKey: (index) => tableRows[index]?.id ?? index,
  });

  const cursorRow = useBulkStore((store) => store.cursor.row);
  const cursorCol = useBulkStore((store) => store.cursor.col);

  React.useEffect(() => {
    virtualizer.scrollToIndex(cursorRow, { align: "auto" });
  }, [cursorRow, virtualizer]);

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    // The first column is sticky, so it can never be scrolled out of view and
    // needs no correction; every other column is measured from the left edge.
    if (cursorCol === 0) {
      scroller.scrollLeft = 0;
      return;
    }
    let left = GUTTER_WIDTH;
    for (let index = 0; index < cursorCol; index += 1) left += columns[index]?.width ?? 0;
    const width = columns[cursorCol]?.width ?? 0;
    const frozen = GUTTER_WIDTH + (columns[0]?.width ?? 0);
    if (left - scroller.scrollLeft < frozen) scroller.scrollLeft = left - frozen;
    else if (left + width - scroller.scrollLeft > scroller.clientWidth) {
      scroller.scrollLeft = left + width - scroller.clientWidth;
    }
  }, [cursorCol, columns]);

  /* ── Pointer gestures ────────────────────────────────────────────────── */

  React.useEffect(() => {
    const stop = () => {
      if (dragMode.current === "fill") {
        const { fillTo, applyFill, setFillTo } = useBulkStore.getState();
        if (fillTo === null) setFillTo(null);
        else applyFill(fillTo);
      }
      dragMode.current = "none";
    };
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  /* ── Clipboard, selection and row commands ───────────────────────────── */

  const clipboard = useGridClipboard(catalog);

  const selectedRowIds = React.useCallback((): string[] => {
    const store = useBulkStore.getState();
    const range = selectRange(store);
    return store.rows.slice(range.top, range.bottom + 1).map((row) => row.id);
  }, []);

  const generateSelection = React.useCallback(() => {
    onGenerateRows(selectedRowIds());
  }, [onGenerateRows, selectedRowIds]);

  const actions = React.useMemo<BulkGridActions>(
    () => ({
      pressCell: (row, col, extend) => {
        focusGrid();
        dragMode.current = "select";
        useBulkStore.getState().setCursor({ row, col }, extend);
      },
      dragOverCell: (row, col) => {
        if (dragMode.current === "select") useBulkStore.getState().setCursor({ row, col }, true);
        else if (dragMode.current === "fill") useBulkStore.getState().setFillTo(row);
      },
      startFill: (row) => {
        dragMode.current = "fill";
        useBulkStore.getState().setFillTo(row);
      },
      editCell: (row, col) => {
        const store = useBulkStore.getState();
        store.setCursor({ row, col }, false);
        store.beginEdit(null);
      },
      dropAsset: (row, col, assetId) => {
        useBulkStore.getState().setCellValue({ row, col }, assetId);
        focusGrid();
      },
      retryRow: (rowId) => onGenerateRows([rowId]),
      commitEdit: (value: string, direction: CommitDirection) => {
        const store = useBulkStore.getState();
        const move = moveFor(store.cursor, direction);
        store.commitEdit(value, move);
        focusGrid();
      },
      cancelEdit: () => {
        useBulkStore.getState().cancelEdit();
        focusGrid();
      },
      pressRowHeader: (row) => {
        focusGrid();
        const store = useBulkStore.getState();
        store.setCursor({ row, col: 0 }, false);
        store.setCursor({ row, col: store.columns.length - 1 }, true);
      },
      pressRowMenu: (row) => {
        const store = useBulkStore.getState();
        const range = selectRange(store);
        if (row < range.top || row > range.bottom) store.setCursor({ row, col: 0 }, false);
      },
      generateSelection,
      duplicateSelection: () => {
        const store = useBulkStore.getState();
        const range = selectRange(store);
        store.duplicateRows(rowsIn(range.top, range.bottom));
      },
      deleteSelection: () => {
        const store = useBulkStore.getState();
        const range = selectRange(store);
        store.deleteRows(rowsIn(range.top, range.bottom));
      },
      moveSelection: (delta) => {
        const store = useBulkStore.getState();
        const range = selectRange(store);
        store.moveRows(rowsIn(range.top, range.bottom), delta);
      },
    }),
    [focusGrid, generateSelection, onGenerateRows],
  );

  useBulkShortcuts({
    active: gridFocused && !editing,
    move: (row, col, extend) => useBulkStore.getState().moveCursor(row, col, extend),
    toEdge: (row, col, extend) => useBulkStore.getState().moveToEdge(row, col, extend),
    selectAll: () => useBulkStore.getState().selectAll(),
    collapse: () => useBulkStore.getState().collapseSelection(),
    beginEdit: () => useBulkStore.getState().beginEdit(null),
    clear: () => useBulkStore.getState().clearSelection(),
    fillDown: () => {
      const store = useBulkStore.getState();
      const range = selectRange(store);
      if (range.bottom >= store.rows.length - 1) return;
      store.applyFill(store.rows.length - 1);
    },
    undo: () => useBulkStore.getState().undo(),
    redo: () => useBulkStore.getState().redo(),
    duplicateRows: actions.duplicateSelection,
    deleteRows: actions.deleteSelection,
    moveRows: actions.moveSelection,
    moveColumn: (delta) => {
      const store = useBulkStore.getState();
      store.moveColumn(store.cursor.col, store.cursor.col + delta);
    },
    generate: generateSelection,
  });

  const announcement = useBulkStore((store) => {
    const column = store.columns[store.cursor.col];
    const row = store.rows[store.cursor.row];
    if (!column || !row) return "";
    const range = selectRange(store);
    const count = rangeSize(range);
    const value =
      column.kind === "status"
        ? (row.error ?? row.status)
        : displayValue(column.kind, row.cells[column.key] ?? "", catalog) || "empty";
    const scope = count > 1 ? ` ${count} cells selected.` : "";
    return `Row ${store.cursor.row + 1}, ${column.label}, ${value}.${scope}`;
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto overscroll-contain bg-surface">
        <div
          ref={gridRef}
          role="grid"
          tabIndex={0}
          aria-label="Variations"
          aria-rowcount={rowIds.length + 1}
          aria-colcount={columns.length + 1}
          aria-multiselectable="true"
          aria-activedescendant={`bulk-cell-${cursorRow}-${cursorCol}`}
          onFocus={() => setGridFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setGridFocused(false);
          }}
          onKeyDown={(event) => {
            // Typing straight into a cell is the one binding the registry
            // cannot express: it is "any printable character".
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (event.key.length !== 1) return;
            event.preventDefault();
            useBulkStore.getState().beginEdit(event.key);
          }}
          onCopy={clipboard.onCopy}
          onCut={clipboard.onCut}
          onPaste={clipboard.onPaste}
          className="relative select-none focus-visible:outline-none"
          // dynamic: the summed column widths and the virtualiser's measured total.
          style={{ width: totalWidth, height: virtualizer.getTotalSize() }}
        >
          <BulkGridProvider value={actions}>
            <BulkHeader
              headers={table.getHeaderGroups()[0]?.headers ?? []}
              columnsById={columnsById}
              onMoveColumn={(from, to) => useBulkStore.getState().moveColumn(from, to)}
              onResetWidth={(columnId) => {
                const store = useBulkStore.getState();
                const width = store.defaultWidths[columnId];
                if (width !== undefined) store.resizeColumns({ [columnId]: width });
              }}
            />

            {virtualItems.map((item) => {
              const id = tableRows[item.index]?.id;
              if (id === undefined) return null;
              return (
                <BulkRow
                  key={item.key}
                  rowIndex={item.index}
                  rowId={id}
                  columns={columns}
                  top={item.start}
                  totalWidth={totalWidth}
                />
              );
            })}
          </BulkGridProvider>
        </div>

        {rowIds.length === 0 ? (
          <EmptyState
            glyph={IconTable}
            title="No variations yet"
            description="Rows are variations. Add one and fill in the hook, the copy and the product — or bring a sheet you already have."
            action={
              <Button variant="primary" onClick={onAddRow}>
                Add row
              </Button>
            }
            secondaryAction={
              <Button variant="secondary" iconStart={IconUpload} onClick={onImport}>
                Import CSV
              </Button>
            }
          />
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <AssetPickerDialog
        open={mediaEditOpen}
        kind="image"
        title="Choose a product image"
        description="This still is the start frame for every render of this row."
        onOpenChange={(open) => {
          if (open) return;
          useBulkStore.getState().cancelEdit();
          focusGrid();
        }}
        onSelect={(asset) => {
          const store = useBulkStore.getState();
          store.setCellValue(store.cursor, asset.id);
          focusGrid();
        }}
      />
    </div>
  );
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const rowsIn = (top: number, bottom: number): number[] =>
  Array.from({ length: bottom - top + 1 }, (_, index) => top + index);

function moveFor(cursor: CellRef, direction: CommitDirection): CellRef | null {
  if (direction === "down") return { row: cursor.row + 1, col: cursor.col };
  if (direction === "up") return { row: cursor.row - 1, col: cursor.col };
  if (direction === "right") return { row: cursor.row, col: cursor.col + 1 };
  if (direction === "left") return { row: cursor.row, col: cursor.col - 1 };
  return null;
}
