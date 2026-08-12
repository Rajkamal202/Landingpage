"use client";

import * as React from "react";
import type { BulkColumn, BulkRow } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { blankRow } from "@/lib/stores/bulk";
import { resolveValue, useBulkCatalog, type BulkCatalog } from "./catalog";
import { parseClipboard } from "./delimited";

/**
 * SPEC §8.7 "Import CSV".
 *
 * Two routes in, because both are how people actually have the data: a file
 * they exported, or a block they copied. Either way the first line is matched
 * against the column names, so a sheet whose columns are in a different order
 * still lands in the right places — and a column we do not recognise is named
 * in the preview rather than silently dropped.
 */
export interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: readonly BulkColumn[];
  onImport: (rows: BulkRow[], summary: string) => void;
}

interface Analysis {
  rows: BulkRow[];
  matched: string[];
  ignored: string[];
  error: string | null;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  columns,
  onImport,
}: BulkImportDialogProps) {
  const [text, setText] = React.useState("");
  const catalog = useBulkCatalog();

  React.useEffect(() => {
    if (!open) setText("");
  }, [open]);

  const analysis = React.useMemo<Analysis | null>(
    () => (text.trim() === "" ? null : analyse(text, columns, catalog)),
    [text, columns, catalog],
  );

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setText(typeof reader.result === "string" ? reader.result : "");
    });
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" aria-describedby="bulk-import-description">
        <DialogHeader>
          <DialogTitle>Import rows from a spreadsheet</DialogTitle>
          <DialogDescription id="bulk-import-description">
            Drop in a CSV, or paste the cells straight out of your sheet. Keep the first line
            as the column names and they will line up on their own.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex h-control-lg cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-ink-300 px-4 text-body-sm text-ink-500 transition-ui duration-(--dur-instant) hover:border-ink-400 hover:bg-ink-50 hover:text-ink-950">
            Choose a .csv file
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) readFile(file);
              }}
            />
          </label>

          <Field
            label="Or paste your cells"
            error={analysis?.error ?? undefined}
            hint="Hook, Body copy, CTA, Product, Product image, Actor, Voice, Music"
          >
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              minRows={6}
              maxRows={12}
              placeholder={"Hook\tBody copy\tCTA\nWeek 1 vs week 8\tSame lighting, same angle.\tShop the serum"}
              className="font-mono text-body-sm"
            />
          </Field>

          {analysis && analysis.error === null ? (
            <div className="rounded-md bg-ink-50 p-4">
              <p className="text-body-sm text-ink-950">
                Adds {analysis.rows.length} {analysis.rows.length === 1 ? "row" : "rows"} and
                fills {analysis.matched.length}{" "}
                {analysis.matched.length === 1 ? "column" : "columns"}:{" "}
                {analysis.matched.join(", ")}.
              </p>
              {analysis.ignored.length > 0 ? (
                <p className="text-body-sm mt-2 text-ink-500">
                  No column here is called {analysis.ignored.join(" or ")}, so{" "}
                  {analysis.ignored.length === 1 ? "that column is" : "those columns are"}{" "}
                  skipped. Rename {analysis.ignored.length === 1 ? "it" : "them"} in your sheet
                  to bring {analysis.ignored.length === 1 ? "it" : "them"} in.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!analysis || analysis.error !== null || analysis.rows.length === 0}
            onClick={() => {
              if (!analysis || analysis.error !== null) return;
              onImport(
                analysis.rows,
                `Imported ${analysis.rows.length} ${analysis.rows.length === 1 ? "row" : "rows"}`,
              );
              onOpenChange(false);
            }}
          >
            {analysis && analysis.error === null && analysis.rows.length > 0
              ? `Import ${analysis.rows.length} ${analysis.rows.length === 1 ? "row" : "rows"}`
              : "Import rows"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function analyse(
  text: string,
  columns: readonly BulkColumn[],
  catalog: BulkCatalog,
): Analysis {
  const matrix = parseClipboard(text);
  const header = matrix[0];
  if (!header || matrix.length < 2) {
    return {
      rows: [],
      matched: [],
      ignored: [],
      error:
        "This needs a header line and at least one row of data. Include the column names on the first line.",
    };
  }

  const editable = columns.filter((column) => column.kind !== "status");
  const mapping = header.map((name) => {
    const needle = name.trim().toLowerCase();
    return (
      editable.find(
        (column) => column.label.toLowerCase() === needle || column.key.toLowerCase() === needle,
      ) ?? null
    );
  });

  const matched = mapping.filter((column): column is BulkColumn => column !== null);
  if (matched.length === 0) {
    return {
      rows: [],
      matched: [],
      ignored: [],
      error: `None of those column names match this sheet. Rename the first line to some of: ${editable
        .map((column) => column.label)
        .join(", ")}.`,
    };
  }

  const ignored = header
    .map((name, index) => (mapping[index] === null ? name.trim() : null))
    .filter((name): name is string => name !== null && name !== "");

  const rows = matrix.slice(1).map((line) => {
    const row = blankRow(columns);
    for (const [index, column] of mapping.entries()) {
      if (!column) continue;
      row.cells[column.key] = resolveValue(column.kind, line[index] ?? "", catalog);
    }
    return row;
  });

  return { rows, matched: matched.map((column) => column.label), ignored, error: null };
}
