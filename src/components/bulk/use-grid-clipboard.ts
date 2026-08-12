"use client";

import * as React from "react";
import { STATUS_LABEL } from "@/components/ui/status-pill";
import { toast } from "@/components/ui/toast";
import { rangeSize, selectRange, useBulkStore } from "@/lib/stores/bulk";
import { displayValue, resolveValue, type BulkCatalog } from "./catalog";
import { parseClipboard, toTsv } from "./delimited";

/**
 * SPEC §15: "Pasting a column out of Google Sheets and having it just work is
 * the feature that makes the screen believable."
 *
 * These are the browser's own `copy` / `cut` / `paste` events on the focused
 * grid, not key handlers. That is the only route that reaches `clipboardData`,
 * so it is the only route where the round trip in *both* directions is real:
 * copy writes tab-separated text a spreadsheet understands, paste reads
 * whatever a spreadsheet wrote — quoted fields, embedded commas and all.
 */
export interface GridClipboard {
  onCopy: (event: React.ClipboardEvent<HTMLElement>) => void;
  onCut: (event: React.ClipboardEvent<HTMLElement>) => void;
  onPaste: (event: React.ClipboardEvent<HTMLElement>) => void;
}

export function useGridClipboard(catalog: BulkCatalog): GridClipboard {
  const catalogRef = React.useRef(catalog);
  catalogRef.current = catalog;

  const write = React.useCallback((event: React.ClipboardEvent<HTMLElement>): number => {
    const store = useBulkStore.getState();
    const range = selectRange(store);
    const matrix: string[][] = [];

    for (let row = range.top; row <= range.bottom; row += 1) {
      const source = store.rows[row];
      if (!source) continue;
      const line: string[] = [];
      for (let col = range.left; col <= range.right; col += 1) {
        const column = store.columns[col];
        if (!column) continue;
        // Names, not ids: a column of `asset-17` pasted into a spreadsheet is
        // useless to the person reading it. Paste resolves names back.
        line.push(
          column.kind === "status"
            ? STATUS_LABEL[source.status]
            : displayValue(column.kind, source.cells[column.key] ?? "", catalogRef.current),
        );
      }
      matrix.push(line);
    }

    event.clipboardData.setData("text/plain", toTsv(matrix));
    event.preventDefault();
    return rangeSize(range);
  }, []);

  const onCopy = React.useCallback(
    (event: React.ClipboardEvent<HTMLElement>) => {
      const count = write(event);
      toast(`Copied ${count} ${count === 1 ? "cell" : "cells"}`, {
        description: "Paste it back here, or straight into a spreadsheet.",
      });
    },
    [write],
  );

  const onCut = React.useCallback(
    (event: React.ClipboardEvent<HTMLElement>) => {
      const count = write(event);
      useBulkStore.getState().clearSelection();
      toast(`Cut ${count} ${count === 1 ? "cell" : "cells"}`, {
        description: "Undo with ⌘Z if that was not what you meant.",
      });
    },
    [write],
  );

  const onPaste = React.useCallback((event: React.ClipboardEvent<HTMLElement>) => {
    const text = event.clipboardData.getData("text/plain");
    if (text === "") return;
    event.preventDefault();

    const store = useBulkStore.getState();
    const range = selectRange(store);
    let matrix = parseClipboard(text);
    if (matrix.length === 0) return;

    // One value pasted over a range fills the range — the behaviour every
    // spreadsheet has, and the one people try first.
    const first = matrix[0];
    const single = matrix.length === 1 && first?.length === 1 ? first[0] : undefined;
    if (single !== undefined && rangeSize(range) > 1) {
      matrix = Array.from({ length: range.bottom - range.top + 1 }, () =>
        Array.from({ length: range.right - range.left + 1 }, () => single),
      );
    }

    const resolved = matrix.map((line) =>
      line.map((value, colOffset) => {
        const column = store.columns[range.left + colOffset];
        return column ? resolveValue(column.kind, value, catalogRef.current) : value;
      }),
    );

    const written = store.pasteMatrix(resolved);
    const rowsAdded = useBulkStore.getState().rows.length - store.rows.length;
    toast(`Pasted ${written} ${written === 1 ? "cell" : "cells"}`, {
      description:
        rowsAdded > 0
          ? `${rowsAdded} new ${rowsAdded === 1 ? "row was" : "rows were"} added to fit. Undo with ⌘Z.`
          : "Undo with ⌘Z if that landed in the wrong place.",
    });
  }, []);

  return { onCopy, onCut, onPaste };
}
