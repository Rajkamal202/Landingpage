"use client";

import { create } from "zustand";
import type { BulkColumn, BulkDoc, BulkRow } from "@/lib/schemas";
import {
  canRedo as stackCanRedo,
  canUndo as stackCanUndo,
  commitMerge as stackCommitMerge,
  createCommandStack,
  execute as stackExecute,
  redo as stackRedo,
  undo as stackUndo,
  type Command,
  type CommandStackState,
} from "@/lib/stores/command-stack";

/**
 * The bulk grid's state (SPEC §8.7, §10).
 *
 * Two decisions shape everything here:
 *
 * 1. **Every data mutation is one command that swaps the whole `rows` array.**
 *    Rows are shared references, so a snapshot at 1,000 rows is an 8KB pointer
 *    copy — cheaper than the bookkeeping a diff would need, and it means an
 *    edit, a paste, an insert, a delete and a reorder all undo through exactly
 *    one code path. A multi-cell paste is therefore one undo entry by
 *    construction rather than by remembering to batch.
 *
 * 2. **The cursor lives here, not in the cells.** Cells subscribe with
 *    selectors that return a primitive, so moving the cursor re-renders the two
 *    cells whose state actually changed rather than the grid.
 */

export interface CellRef {
  row: number;
  col: number;
}

export interface CellRange {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/** What a cell is, as one primitive, so a selector comparison is an === . */
export type CellSelection = "none" | "range" | "cursor" | "fill";

export const ORIGIN: CellRef = { row: 0, col: 0 };

let idSequence = 0;
const nextRowId = (): string => `row-${(idSequence += 1).toString(36)}-${Date.now().toString(36)}`;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const rangeOf = (a: CellRef, b: CellRef): CellRange => ({
  top: Math.min(a.row, b.row),
  bottom: Math.max(a.row, b.row),
  left: Math.min(a.col, b.col),
  right: Math.max(a.col, b.col),
});

export const rangeSize = (range: CellRange): number =>
  (range.bottom - range.top + 1) * (range.right - range.left + 1);

export function blankRow(columns: readonly BulkColumn[]): BulkRow {
  const cells: Record<string, string> = {};
  for (const column of columns) {
    if (column.kind !== "status") cells[column.key] = "";
  }
  return { id: nextRowId(), cells, status: "draft", progress: 0, outputAssetId: null, error: null };
}

/**
 * Changing a row's copy invalidates whatever was rendered from the old copy,
 * so an edited row drops back to Draft rather than claiming a video that no
 * longer matches it.
 */
function withCells(row: BulkRow, cells: Record<string, string>): BulkRow {
  if (row.status === "ready" || row.status === "failed") {
    return { ...row, cells, status: "draft", progress: 0, outputAssetId: null, error: null };
  }
  return { ...row, cells };
}

export interface BulkState {
  projectId: string;
  templateName: string;
  columns: BulkColumn[];
  /** The widths the template shipped with, so "Reset width" has an answer. */
  defaultWidths: Record<string, number>;
  rows: BulkRow[];
  cursor: CellRef;
  anchor: CellRef;
  editing: boolean;
  /** The keystroke that opened the editor — typing replaces, Enter appends. */
  editSeed: string | null;
  /** Row the fill handle is currently dragged to, or null when idle. */
  fillTo: number | null;
  stack: CommandStackState;
  loaded: boolean;

  load: (document: BulkDoc, cursor: CellRef | null) => void;
  reset: () => void;

  setCursor: (ref: CellRef, extend?: boolean) => void;
  moveCursor: (deltaRow: number, deltaCol: number, extend?: boolean) => void;
  moveToEdge: (deltaRow: number, deltaCol: number, extend?: boolean) => void;
  selectAll: () => void;
  collapseSelection: () => void;

  beginEdit: (seed: string | null) => void;
  cancelEdit: () => void;
  commitEdit: (value: string, move: CellRef | null) => void;
  setCellValue: (ref: CellRef, value: string) => void;
  clearSelection: () => void;

  pasteMatrix: (matrix: readonly (readonly string[])[]) => number;
  setFillTo: (row: number | null) => void;
  applyFill: (toRow: number) => void;

  addRows: (count: number) => void;
  duplicateRows: (indices: readonly number[]) => void;
  deleteRows: (indices: readonly number[]) => void;
  moveRows: (indices: readonly number[], delta: number) => void;
  appendRows: (rows: readonly BulkRow[], label: string) => void;

  moveColumn: (from: number, to: number) => void;
  resizeColumns: (sizing: Record<string, number>) => void;

  /** Generation progress. Deliberately outside the undo stack — you cannot
   *  ⌘Z a render that already happened. */
  patchRow: (rowId: string, patch: Partial<Omit<BulkRow, "id" | "cells">>) => void;

  undo: () => void;
  redo: () => void;
}

export const useBulkStore = create<BulkState>()((set, get) => {
  /** Runs `project`, records it, and leaves the stack ready for the next one. */
  const mutate = (
    label: string,
    mergeKey: string | undefined,
    project: (rows: BulkRow[]) => BulkRow[] | null,
  ): void => {
    const before = get().rows;
    const after = project(before);
    if (after === null) return;
    const command: Command = {
      label,
      do: () => set({ rows: after }),
      undo: () => set({ rows: before }),
      mergeKey,
    };
    set({ stack: stackExecute(get().stack, command) });
  };

  const writeCells = (
    label: string,
    mergeKey: string | undefined,
    targets: ReadonlyArray<{ row: number; col: number; value: string }>,
  ): void => {
    const { columns } = get();
    mutate(label, mergeKey, (rows) => {
      const byRow = new Map<number, Record<string, string>>();
      for (const target of targets) {
        const row = rows[target.row];
        const column = columns[target.col];
        if (!row || !column || column.kind === "status") continue;
        const cells = byRow.get(target.row) ?? { ...row.cells };
        cells[column.key] = target.value;
        byRow.set(target.row, cells);
      }
      if (byRow.size === 0) return null;
      return rows.map((row, index) => {
        const cells = byRow.get(index);
        return cells ? withCells(row, cells) : row;
      });
    });
  };

  const clampCursor = (ref: CellRef, rows: number, cols: number): CellRef => ({
    row: clamp(ref.row, 0, Math.max(0, rows - 1)),
    col: clamp(ref.col, 0, Math.max(0, cols - 1)),
  });

  return {
    projectId: "",
    templateName: "",
    columns: [],
    defaultWidths: {},
    rows: [],
    cursor: ORIGIN,
    anchor: ORIGIN,
    editing: false,
    editSeed: null,
    fillTo: null,
    stack: createCommandStack(),
    loaded: false,

    load: (document, cursor) => {
      const start = clampCursor(
        cursor ?? ORIGIN,
        document.rows.length,
        document.columns.length,
      );
      set({
        projectId: document.projectId,
        templateName: document.templateName,
        columns: [...document.columns],
        defaultWidths: Object.fromEntries(
          document.columns.map((column) => [column.id, column.width]),
        ),
        rows: [...document.rows],
        cursor: start,
        anchor: start,
        editing: false,
        editSeed: null,
        fillTo: null,
        stack: createCommandStack(),
        loaded: true,
      });
    },

    reset: () => set({ loaded: false, rows: [], columns: [], stack: createCommandStack() }),

    setCursor: (ref, extend = false) =>
      set((state) => {
        const next = clampCursor(ref, state.rows.length, state.columns.length);
        return {
          cursor: next,
          anchor: extend ? state.anchor : next,
          editing: false,
          editSeed: null,
          stack: stackCommitMerge(state.stack),
        };
      }),

    moveCursor: (deltaRow, deltaCol, extend = false) =>
      set((state) => {
        const next = clampCursor(
          { row: state.cursor.row + deltaRow, col: state.cursor.col + deltaCol },
          state.rows.length,
          state.columns.length,
        );
        return {
          cursor: next,
          anchor: extend ? state.anchor : next,
          editing: false,
          editSeed: null,
          stack: stackCommitMerge(state.stack),
        };
      }),

    moveToEdge: (deltaRow, deltaCol, extend = false) =>
      set((state) => {
        const next: CellRef = {
          row:
            deltaRow === 0
              ? state.cursor.row
              : deltaRow < 0
                ? 0
                : Math.max(0, state.rows.length - 1),
          col:
            deltaCol === 0
              ? state.cursor.col
              : deltaCol < 0
                ? 0
                : Math.max(0, state.columns.length - 1),
        };
        return { cursor: next, anchor: extend ? state.anchor : next, editing: false };
      }),

    selectAll: () =>
      set((state) => ({
        anchor: ORIGIN,
        cursor: {
          row: Math.max(0, state.rows.length - 1),
          col: Math.max(0, state.columns.length - 1),
        },
        editing: false,
      })),

    collapseSelection: () => set((state) => ({ anchor: state.cursor, editing: false })),

    beginEdit: (seed) => {
      const { columns, cursor } = get();
      const column = columns[cursor.col];
      if (!column || column.kind === "status") return;
      set({ editing: true, editSeed: seed, anchor: cursor });
    },

    cancelEdit: () => set({ editing: false, editSeed: null }),

    commitEdit: (value, move) => {
      const { cursor } = get();
      writeCells("Edit cell", `cell:${cursor.row}:${cursor.col}`, [
        { row: cursor.row, col: cursor.col, value },
      ]);
      set({ editing: false, editSeed: null });
      if (move) get().setCursor(move, false);
    },

    setCellValue: (ref, value) => {
      writeCells("Edit cell", undefined, [{ row: ref.row, col: ref.col, value }]);
      set({ editing: false, editSeed: null });
    },

    clearSelection: () => {
      const { anchor, cursor } = get();
      const range = rangeOf(anchor, cursor);
      const targets: Array<{ row: number; col: number; value: string }> = [];
      for (let row = range.top; row <= range.bottom; row += 1) {
        for (let col = range.left; col <= range.right; col += 1) {
          targets.push({ row, col, value: "" });
        }
      }
      writeCells(targets.length > 1 ? "Clear cells" : "Clear cell", undefined, targets);
    },

    pasteMatrix: (matrix) => {
      const { columns, anchor, cursor } = get();
      if (matrix.length === 0) return 0;
      // Paste lands at the top-left of the selection, not at the cursor — a
      // range selected upwards has its cursor at the *bottom*.
      const origin = rangeOf(anchor, cursor);
      const startRow = origin.top;
      const startCol = origin.left;
      let written = 0;

      mutate("Paste cells", undefined, (rows) => {
        const next = [...rows];
        while (next.length < startRow + matrix.length) next.push(blankRow(columns));

        for (const [offset, line] of matrix.entries()) {
          const index = startRow + offset;
          const row = next[index];
          if (!row) continue;
          const cells = { ...row.cells };
          let touched = false;
          for (const [column, value] of line.entries()) {
            const target = columns[startCol + column];
            if (!target || target.kind === "status") continue;
            cells[target.key] = value;
            touched = true;
            written += 1;
          }
          if (touched) next[index] = withCells(row, cells);
        }
        return next;
      });

      set((state) => ({
        anchor: { row: startRow, col: startCol },
        cursor: clampCursor(
          {
            row: startRow + matrix.length - 1,
            col: startCol + Math.max(...matrix.map((line) => line.length)) - 1,
          },
          state.rows.length,
          state.columns.length,
        ),
      }));
      return written;
    },

    setFillTo: (row) => set({ fillTo: row }),

    applyFill: (toRow) => {
      const { anchor, cursor, columns } = get();
      const range = rangeOf(anchor, cursor);
      const height = range.bottom - range.top + 1;
      const targets: Array<{ row: number; col: number; value: string }> = [];

      const write = (row: number) => {
        const sourceOffset = ((row - range.top) % height + height) % height;
        const source = get().rows[range.top + sourceOffset];
        if (!source) return;
        for (let col = range.left; col <= range.right; col += 1) {
          const column = columns[col];
          if (!column || column.kind === "status") continue;
          targets.push({ row, col, value: source.cells[column.key] ?? "" });
        }
      };

      if (toRow > range.bottom) for (let row = range.bottom + 1; row <= toRow; row += 1) write(row);
      else if (toRow < range.top) for (let row = toRow; row < range.top; row += 1) write(row);

      if (targets.length > 0) writeCells("Fill cells", undefined, targets);
      set((state) => ({
        fillTo: null,
        anchor: { row: Math.min(range.top, toRow), col: range.left },
        cursor: { row: Math.max(range.bottom, toRow), col: state.cursor.col },
      }));
    },

    addRows: (count) => {
      const { columns } = get();
      mutate(count === 1 ? "Add row" : `Add ${count} rows`, undefined, (rows) => [
        ...rows,
        ...Array.from({ length: count }, () => blankRow(columns)),
      ]);
      set((state) => ({
        cursor: { row: Math.max(0, state.rows.length - count), col: 0 },
        anchor: { row: Math.max(0, state.rows.length - count), col: 0 },
      }));
    },

    duplicateRows: (indices) => {
      const sorted = [...indices].sort((a, b) => a - b);
      const last = sorted[sorted.length - 1];
      if (last === undefined) return;
      mutate(sorted.length === 1 ? "Duplicate row" : `Duplicate ${sorted.length} rows`, undefined, (rows) => {
        const copies = sorted
          .map((index) => rows[index])
          .filter((row): row is BulkRow => row !== undefined)
          .map((row) => ({
            ...row,
            id: nextRowId(),
            cells: { ...row.cells },
            status: "draft" as const,
            progress: 0,
            outputAssetId: null,
            error: null,
          }));
        if (copies.length === 0) return null;
        return [...rows.slice(0, last + 1), ...copies, ...rows.slice(last + 1)];
      });
      set((state) => {
        const first = last + 1;
        const next = clampCursor(
          { row: first, col: state.cursor.col },
          state.rows.length,
          state.columns.length,
        );
        return { cursor: next, anchor: { row: first + sorted.length - 1, col: state.cursor.col } };
      });
    },

    deleteRows: (indices) => {
      const doomed = new Set(indices);
      if (doomed.size === 0) return;
      mutate(doomed.size === 1 ? "Delete row" : `Delete ${doomed.size} rows`, undefined, (rows) =>
        rows.filter((_, index) => !doomed.has(index)),
      );
      set((state) => {
        const next = clampCursor(state.cursor, state.rows.length, state.columns.length);
        return { cursor: next, anchor: next };
      });
    },

    moveRows: (indices, delta) => {
      const sorted = [...indices].sort((a, b) => a - b);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (first === undefined || last === undefined) return;
      mutate(delta < 0 ? "Move rows up" : "Move rows down", undefined, (rows) => {
        if (first + delta < 0 || last + delta > rows.length - 1) return null;
        const block = rows.slice(first, last + 1);
        const rest = [...rows.slice(0, first), ...rows.slice(last + 1)];
        return [...rest.slice(0, first + delta), ...block, ...rest.slice(first + delta)];
      });
      set((state) => ({
        cursor: clampCursor(
          { row: state.cursor.row + delta, col: state.cursor.col },
          state.rows.length,
          state.columns.length,
        ),
        anchor: clampCursor(
          { row: state.anchor.row + delta, col: state.anchor.col },
          state.rows.length,
          state.columns.length,
        ),
      }));
    },

    appendRows: (incoming, label) => {
      if (incoming.length === 0) return;
      mutate(label, undefined, (rows) => [...rows, ...incoming]);
    },

    moveColumn: (from, to) =>
      set((state) => {
        const columns = [...state.columns];
        const moved = columns[from];
        if (!moved || to < 0 || to >= columns.length || from === to) return state;
        columns.splice(from, 1);
        columns.splice(to, 0, moved);
        const shift = (ref: CellRef): CellRef =>
          ref.col === from ? { ...ref, col: to } : ref;
        return { columns, cursor: shift(state.cursor), anchor: shift(state.anchor) };
      }),

    // Column widths are a view preference, not document history: a drag that
    // emits a width per pointer-move would bury every real edit in the stack.
    resizeColumns: (sizing) =>
      set((state) => ({
        columns: state.columns.map((column) =>
          sizing[column.id] === undefined
            ? column
            : { ...column, width: Math.round(sizing[column.id] ?? column.width) },
        ),
      })),

    patchRow: (rowId, patch) =>
      set((state) => ({
        rows: state.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
      })),

    undo: () => set((state) => ({ stack: stackUndo(state.stack) })),
    redo: () => set((state) => ({ stack: stackRedo(state.stack) })),
  };
});

/* ── Selectors — each returns a primitive so cells compare with === ─────── */

export const selectRange = (state: BulkState): CellRange => rangeOf(state.anchor, state.cursor);

export function selectCellState(state: BulkState, row: number, col: number): CellSelection {
  if (state.cursor.row === row && state.cursor.col === col) return "cursor";
  const range = selectRange(state);
  const inRange =
    row >= range.top && row <= range.bottom && col >= range.left && col <= range.right;
  if (inRange) return "range";
  if (state.fillTo !== null && col >= range.left && col <= range.right) {
    const low = Math.min(state.fillTo, range.top);
    const high = Math.max(state.fillTo, range.bottom);
    if (row >= low && row <= high) return "fill";
  }
  return "none";
}

/** The one cell that carries the fill handle — bottom-right of the selection. */
export function selectIsFillOrigin(state: BulkState, row: number, col: number): boolean {
  const range = selectRange(state);
  return row === range.bottom && col === range.right && !state.editing;
}

export function selectIsEditing(state: BulkState, row: number, col: number): boolean {
  return state.editing && state.cursor.row === row && state.cursor.col === col;
}

export const selectSelectedRowIndices = (state: BulkState): number[] => {
  const range = selectRange(state);
  return Array.from({ length: range.bottom - range.top + 1 }, (_, index) => range.top + index);
};

export const selectCanUndo = (state: BulkState): boolean => stackCanUndo(state.stack);
export const selectCanRedo = (state: BulkState): boolean => stackCanRedo(state.stack);
