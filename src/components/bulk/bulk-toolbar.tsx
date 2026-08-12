"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/api/keys";
import { getTokenBalance } from "@/lib/api/billing";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";
import { useTokenGuard } from "@/components/ui/token-meter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconGenerate,
  IconPlus,
  IconRedo,
  IconUndo,
  IconUpload,
} from "@/components/icons";
import { selectCanRedo, selectCanUndo, selectRange, useBulkStore } from "@/lib/stores/bulk";

/**
 * SPEC §8.7 toolbar: add, duplicate, import, generate with a count and a total
 * cost, export.
 *
 * "Generate all" is guarded by `useTokenGuard`, the one place in the product
 * that decides whether a generation can start — so this button and the
 * studio's submit button can never disagree about it (SPEC §7.1).
 */
export interface BulkToolbarProps {
  running: boolean;
  tokensPerRow: number;
  onAddRows: (count: number) => void;
  onGenerateAll: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function BulkToolbar({
  running,
  tokensPerRow,
  onAddRows,
  onGenerateAll,
  onImport,
  onExport,
}: BulkToolbarProps) {
  const rowCount = useBulkStore((store) => store.rows.length);
  const selectedRows = useBulkStore(useShallow((store) => selectRange(store)));
  const canUndo = useBulkStore(selectCanUndo);
  const canRedo = useBulkStore(selectCanRedo);
  const pending = useBulkStore(
    (store) => store.rows.filter((row) => row.status !== "ready").length,
  );

  const balance = useQuery({ queryKey: queryKeys.billing.balance, queryFn: getTokenBalance });
  const cost = pending * tokensPerRow;
  const guard = useTokenGuard(balance.data, cost);

  const selectedCount = selectedRows.bottom - selectedRows.top + 1;
  const blocked = !guard.allowed || pending === 0 || running;
  const reason = running
    ? "This batch is still running. Stop it first if you want to change the queue."
    : pending === 0
      ? "Every row already has a video. Edit a row to queue it again."
      : guard.reason;

  return (
    <Toolbar ariaLabel="Bulk editor actions" className="w-full">
      <div className="flex items-center">
        <Button
          variant="secondary"
          size="sm"
          iconStart={IconPlus}
          className="rounded-r-none"
          onClick={() => onAddRows(1)}
        >
          Add row
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              label="Add several rows"
              glyph={IconChevronDown}
              variant="secondary"
              size="sm"
              className="rounded-l-none border-l-0"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem glyph={IconPlus} onSelect={() => onAddRows(10)}>
              Add 10 rows
            </DropdownMenuItem>
            <DropdownMenuItem glyph={IconPlus} onSelect={() => onAddRows(100)}>
              Add 100 rows
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        variant="ghost"
        size="sm"
        iconStart={IconCopy}
        disabled={rowCount === 0}
        onClick={() => {
          const store = useBulkStore.getState();
          const range = selectRange(store);
          store.duplicateRows(
            Array.from({ length: range.bottom - range.top + 1 }, (_, i) => range.top + i),
          );
        }}
      >
        Duplicate {selectedCount > 1 ? `${selectedCount} rows` : "row"}
      </Button>

      <Button variant="ghost" size="sm" iconStart={IconUpload} onClick={onImport}>
        Import CSV
      </Button>

      <ToolbarSeparator />

      <IconButton
        label="Undo"
        glyph={IconUndo}
        size="sm"
        disabled={!canUndo}
        onClick={() => useBulkStore.getState().undo()}
      />
      <IconButton
        label="Redo"
        glyph={IconRedo}
        size="sm"
        disabled={!canRedo}
        onClick={() => useBulkStore.getState().redo()}
      />

      <span className="mono-sm ml-auto shrink-0 text-ink-400">
        {formatNumber(rowCount)} {rowCount === 1 ? "variation" : "variations"}
      </span>

      <Button
        variant="secondary"
        size="sm"
        iconStart={IconDownload}
        disabled={rowCount === 0}
        onClick={onExport}
      >
        Export all
      </Button>

      <Tooltip content={blocked ? reason : undefined} disabledTrigger={blocked}>
        <Button
          variant="primary"
          size="sm"
          iconStart={IconGenerate}
          loading={running}
          disabled={!running && blocked}
          onClick={onGenerateAll}
        >
          Generate all
          <span className="mono-sm text-white/60">
            {pending} · {formatNumber(cost)}
          </span>
        </Button>
      </Tooltip>
    </Toolbar>
  );
}
