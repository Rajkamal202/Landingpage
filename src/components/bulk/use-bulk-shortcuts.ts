"use client";

import { useShortcut } from "@/lib/hooks/use-shortcuts";

/**
 * Every key the grid answers to, registered through the shared registry so the
 * `?` dialog is generated from the bindings rather than written alongside them
 * (SPEC §11).
 *
 * Three of these — ⌘C, ⌘X, ⌘V — are registered with `enabled: false`. They are
 * real bindings, but they are handled by the browser's own `copy`/`cut`/`paste`
 * events on the grid, which is the only route that gets at `clipboardData` and
 * therefore the only route that round-trips a real spreadsheet. Preventing the
 * keydown here would cancel those events outright. Registering them disabled
 * documents the keys without breaking them. Same for Tab, which belongs to the
 * cell editor while a cell editor has focus.
 */
export interface BulkShortcutOptions {
  /** True only when the grid itself holds focus and no editor is open. */
  active: boolean;
  move: (row: number, col: number, extend: boolean) => void;
  toEdge: (row: number, col: number, extend: boolean) => void;
  selectAll: () => void;
  collapse: () => void;
  beginEdit: () => void;
  clear: () => void;
  fillDown: () => void;
  undo: () => void;
  redo: () => void;
  duplicateRows: () => void;
  deleteRows: () => void;
  moveRows: (delta: number) => void;
  moveColumn: (delta: number) => void;
  generate: () => void;
}

const NAV = "Moving around";
const EDIT = "Editing cells";
const ROWS = "Rows and columns";
const CLIP = "Clipboard";

export function useBulkShortcuts(options: BulkShortcutOptions): void {
  const { active } = options;

  useShortcut({ keys: "arrowup", label: "Move up a row", group: NAV, enabled: active, handler: () => options.move(-1, 0, false) });
  useShortcut({ keys: "arrowdown", label: "Move down a row", group: NAV, enabled: active, handler: () => options.move(1, 0, false) });
  useShortcut({ keys: "arrowleft", label: "Move left a column", group: NAV, enabled: active, handler: () => options.move(0, -1, false) });
  useShortcut({ keys: "arrowright", label: "Move right a column", group: NAV, enabled: active, handler: () => options.move(0, 1, false) });

  useShortcut({ keys: "shift+arrowup", label: "Extend the selection up", group: NAV, enabled: active, handler: () => options.move(-1, 0, true) });
  useShortcut({ keys: "shift+arrowdown", label: "Extend the selection down", group: NAV, enabled: active, handler: () => options.move(1, 0, true) });
  useShortcut({ keys: "shift+arrowleft", label: "Extend the selection left", group: NAV, enabled: active, handler: () => options.move(0, -1, true) });
  useShortcut({ keys: "shift+arrowright", label: "Extend the selection right", group: NAV, enabled: active, handler: () => options.move(0, 1, true) });

  useShortcut({ keys: "home", label: "Jump to the first column", group: NAV, enabled: active, handler: () => options.toEdge(0, -1, false) });
  useShortcut({ keys: "end", label: "Jump to the last column", group: NAV, enabled: active, handler: () => options.toEdge(0, 1, false) });
  useShortcut({ keys: "mod+a", label: "Select every cell", group: NAV, enabled: active, handler: options.selectAll });
  useShortcut({ keys: "escape", label: "Collapse the selection to one cell", group: NAV, enabled: active, handler: options.collapse });

  useShortcut({ keys: "enter", label: "Edit the selected cell", group: EDIT, enabled: active, handler: options.beginEdit });
  useShortcut({ keys: "tab", label: "Commit and move right, while editing", group: EDIT, enabled: false, handler: noop });
  useShortcut({ keys: "backspace", label: "Clear the selected cells", group: EDIT, enabled: active, handler: options.clear });
  useShortcut({ keys: "mod+d", label: "Fill the selection down", group: EDIT, enabled: active, handler: options.fillDown });
  useShortcut({ keys: "mod+z", label: "Undo", group: EDIT, enabled: active, handler: options.undo });
  useShortcut({ keys: "mod+shift+z", label: "Redo", group: EDIT, enabled: active, handler: options.redo });

  useShortcut({ keys: "mod+c", label: "Copy the selection as spreadsheet text", group: CLIP, enabled: false, handler: noop });
  useShortcut({ keys: "mod+x", label: "Cut the selection", group: CLIP, enabled: false, handler: noop });
  useShortcut({ keys: "mod+v", label: "Paste, including from a spreadsheet", group: CLIP, enabled: false, handler: noop });

  useShortcut({ keys: "mod+enter", label: "Generate the selected rows", group: ROWS, enabled: active, handler: options.generate });
  useShortcut({ keys: "mod+shift+d", label: "Duplicate the selected rows", group: ROWS, enabled: active, handler: options.duplicateRows });
  useShortcut({ keys: "mod+backspace", label: "Delete the selected rows", group: ROWS, enabled: active, handler: options.deleteRows });
  useShortcut({ keys: "alt+arrowup", label: "Move the selected rows up", group: ROWS, enabled: active, handler: () => options.moveRows(-1) });
  useShortcut({ keys: "alt+arrowdown", label: "Move the selected rows down", group: ROWS, enabled: active, handler: () => options.moveRows(1) });
  useShortcut({ keys: "alt+arrowleft", label: "Move this column left", group: ROWS, enabled: active, handler: () => options.moveColumn(-1) });
  useShortcut({ keys: "alt+arrowright", label: "Move this column right", group: ROWS, enabled: active, handler: () => options.moveColumn(1) });
}

const noop = () => undefined;
