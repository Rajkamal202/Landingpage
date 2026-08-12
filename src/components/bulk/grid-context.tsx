"use client";

import * as React from "react";
import type { CommitDirection } from "./cell-editors";

/**
 * The handful of callbacks a cell needs from the grid.
 *
 * They travel by context rather than by prop so that `BulkCell` can be
 * memoised on a tiny, stable prop set — at 1,000 rows the thing that costs
 * frames is not the work a cell does, it is how many cells do any work at all.
 */
export interface BulkGridActions {
  /** Pointer went down on a cell: move the cursor, or extend with shift. */
  pressCell: (row: number, col: number, extend: boolean) => void;
  /** Pointer crossed a cell mid-drag: extend the range, or the fill preview. */
  dragOverCell: (row: number, col: number) => void;
  /** Pointer went down on the fill handle. */
  startFill: (row: number) => void;
  /** Double-click, or Enter — open the editor for this cell. */
  editCell: (row: number, col: number) => void;
  /** Drop an asset from the library onto a media cell. */
  dropAsset: (row: number, col: number, assetId: string) => void;
  /** Re-run generation for one row. */
  retryRow: (rowId: string) => void;
  /** Write the editor's value and move the cursor on. */
  commitEdit: (value: string, direction: CommitDirection) => void;
  /** Esc — leave the value alone and hand focus back to the grid. */
  cancelEdit: () => void;

  /** Clicking the row-number gutter selects the whole row. */
  pressRowHeader: (row: number) => void;
  /** Right-clicking outside the selection moves it, the way a spreadsheet does. */
  pressRowMenu: (row: number) => void;
  generateSelection: () => void;
  duplicateSelection: () => void;
  deleteSelection: () => void;
  moveSelection: (delta: number) => void;
}

const noop = () => undefined;

const BulkGridContext = React.createContext<BulkGridActions>({
  pressCell: noop,
  dragOverCell: noop,
  startFill: noop,
  editCell: noop,
  dropAsset: noop,
  retryRow: noop,
  commitEdit: noop,
  cancelEdit: noop,
  pressRowHeader: noop,
  pressRowMenu: noop,
  generateSelection: noop,
  duplicateSelection: noop,
  deleteSelection: noop,
  moveSelection: noop,
});

export const BulkGridProvider = BulkGridContext.Provider;

export function useBulkGridActions(): BulkGridActions {
  return React.useContext(BulkGridContext);
}

/** Row and header heights in px. The virtualiser needs numbers, not classes. */
export const ROW_HEIGHT = 44;
export const HEADER_HEIGHT = 40;
export const GUTTER_WIDTH = 56;
export const MIN_COLUMN_WIDTH = 120;
export const MAX_COLUMN_WIDTH = 640;
