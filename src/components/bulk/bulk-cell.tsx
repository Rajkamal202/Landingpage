"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { BulkColumn } from "@/lib/schemas";
import { hasAssetDragPayload, readAssetDragPayload } from "@/lib/dnd/payload";
import { Icon } from "@/components/icon";
import { IconImage, IconRetry } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { StatusPill } from "@/components/ui/status-pill";
import { Tooltip } from "@/components/ui/tooltip";
import {
  selectCellState,
  selectIsEditing,
  selectIsFillOrigin,
  useBulkStore,
} from "@/lib/stores/bulk";
import { displayValue, optionsFor, useBulkCatalog } from "./catalog";
import { CellChoiceEditor, CellTextEditor } from "./cell-editors";
import { useBulkGridActions } from "./grid-context";

/**
 * One cell. Memoised, and every piece of state it needs is read through a
 * selector that returns a primitive — so moving the cursor re-renders the two
 * cells whose appearance actually changed, and editing a cell re-renders that
 * cell. Nothing here is ever re-rendered by a sibling.
 */
export interface BulkCellProps {
  rowIndex: number;
  colIndex: number;
  column: BulkColumn;
  width: number;
  /** The leftmost data column stays put while the grid scrolls sideways. */
  sticky: boolean;
  stickyOffset: number;
}

const SELECTION_STYLE = {
  none: "bg-surface",
  range: "bg-brand-50",
  fill: "bg-brand-50/60",
  cursor: "bg-surface",
} as const;

export const BulkCell = React.memo(function BulkCell({
  rowIndex,
  colIndex,
  column,
  width,
  sticky,
  stickyOffset,
}: BulkCellProps) {
  const state = useBulkStore((store) => selectCellState(store, rowIndex, colIndex));
  const isEditing = useBulkStore((store) => selectIsEditing(store, rowIndex, colIndex));
  const isFillOrigin = useBulkStore((store) => selectIsFillOrigin(store, rowIndex, colIndex));
  const actions = useBulkGridActions();

  const isMedia = column.kind === "media";
  const [dropTarget, setDropTarget] = React.useState(false);

  return (
    <div
      id={`bulk-cell-${rowIndex}-${colIndex}`}
      role="gridcell"
      // The grid is a single tab stop (the container is tabIndex 0) and the
      // cell cursor moves with arrow keys, so each cell must be
      // programmatically focusable but not in the tab order — the roving
      // tabindex pattern from the ARIA grid practices.
      tabIndex={-1}
      aria-colindex={colIndex + 2}
      aria-selected={state !== "none"}
      aria-readonly={column.kind === "status" || undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        actions.pressCell(rowIndex, colIndex, event.shiftKey);
      }}
      onPointerEnter={() => actions.dragOverCell(rowIndex, colIndex)}
      onDoubleClick={() => actions.editCell(rowIndex, colIndex)}
      onDragOver={
        isMedia
          ? (event) => {
              if (!hasAssetDragPayload(event.dataTransfer)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setDropTarget(true);
            }
          : undefined
      }
      onDragLeave={isMedia ? () => setDropTarget(false) : undefined}
      onDrop={
        isMedia
          ? (event) => {
              const payload = readAssetDragPayload(event.dataTransfer);
              setDropTarget(false);
              if (!payload) return;
              event.preventDefault();
              actions.dropAsset(rowIndex, colIndex, payload.assetId);
            }
          : undefined
      }
      className={cn(
        "relative flex h-full shrink-0 items-center border-b border-r border-ink-200 px-2",
        "transition-ui duration-(--dur-instant)",
        SELECTION_STYLE[state],
        sticky && "sticky z-(--z-sticky)",
        state === "cursor" && "z-(--z-sticky) outline-2 -outline-offset-2 outline-brand-500",
        dropTarget && "bg-brand-100",
        column.kind === "status" && "justify-between",
      )}
      // dynamic: the column's dragged width, and the sticky offset past the row gutter.
      style={{ width, ...(sticky ? { left: stickyOffset } : {}) }}
    >
      {column.kind === "status" ? (
        <StatusCellContent rowIndex={rowIndex} />
      ) : (
        <ValueCellContent rowIndex={rowIndex} column={column} isEditing={isEditing} />
      )}

      {isEditing ? <CellEditor rowIndex={rowIndex} column={column} /> : null}

      {isFillOrigin ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Drag to fill down"
          onPointerDown={(event) => {
            event.stopPropagation();
            actions.startFill(rowIndex);
          }}
          className={cn(
            "absolute -bottom-px -right-px size-2 translate-x-1/2 translate-y-1/2",
            "cursor-crosshair rounded-sm border border-white bg-brand-500",
            "transition-ui duration-(--dur-instant) hover:bg-brand-600",
          )}
        />
      ) : null}
    </div>
  );
});

/* ── Editors ───────────────────────────────────────────────────────────── */

const CHOICE_COPY: Record<string, { placeholder: string; empty: string }> = {
  actor: { placeholder: "Pick an actor", empty: "No actors have loaded yet." },
  voice: { placeholder: "Pick a voice", empty: "No voices have loaded yet." },
  music: { placeholder: "Pick a track", empty: "No music beds have loaded yet." },
};

function CellEditor({ rowIndex, column }: { rowIndex: number; column: BulkColumn }) {
  const value = useBulkStore((store) => store.rows[rowIndex]?.cells[column.key] ?? "");
  const seed = useBulkStore((store) => store.editSeed);
  const catalog = useBulkCatalog();
  const actions = useBulkGridActions();

  // A media cell opens the shared library picker instead, mounted once by the
  // grid — a dialog per cell would be twenty dialogs in the tree at any moment.
  if (column.kind === "media") return null;

  if (column.kind === "text") {
    return (
      <CellTextEditor
        initialValue={value}
        seed={seed}
        onCommit={actions.commitEdit}
        onCancel={actions.cancelEdit}
      />
    );
  }

  const copy = CHOICE_COPY[column.kind] ?? { placeholder: "Choose one", empty: "Nothing to pick." };
  return (
    <CellChoiceEditor
      value={value}
      options={optionsFor(column.kind, catalog)}
      placeholder={copy.placeholder}
      emptyMessage={copy.empty}
      onSelect={(next) => actions.commitEdit(next, "stay")}
      onCancel={actions.cancelEdit}
    />
  );
}

/* ── Value cells ───────────────────────────────────────────────────────── */

function ValueCellContent({
  rowIndex,
  column,
  isEditing,
}: {
  rowIndex: number;
  column: BulkColumn;
  isEditing: boolean;
}) {
  const value = useBulkStore((store) => store.rows[rowIndex]?.cells[column.key] ?? "");
  const catalog = useBulkCatalog();

  if (column.kind === "media") {
    const asset = value === "" ? undefined : catalog.assetsById.get(value);
    return (
      <span className="flex min-w-0 items-center gap-2">
        {asset ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.poster}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-8 w-5 shrink-0 rounded-sm object-cover"
            />
            <span className="text-body-sm truncate text-ink-700">{asset.name}</span>
          </>
        ) : (
          <span className="text-body-sm flex items-center gap-2 text-ink-400">
            <Icon glyph={IconImage} size={16} />
            {isEditing ? "Choosing…" : "Choose an image"}
          </span>
        )}
      </span>
    );
  }

  const text = displayValue(column.kind, value, catalog);
  return (
    <span
      className={cn(
        "text-body-sm truncate",
        text === "" ? "text-ink-400" : "text-ink-950",
        column.kind !== "text" && "text-ink-700",
      )}
    >
      {text === "" ? EMPTY_HINT[column.kind] : text}
    </span>
  );
}

const EMPTY_HINT: Record<BulkColumn["kind"], string> = {
  text: "",
  media: "Choose an image",
  actor: "Pick an actor",
  voice: "Pick a voice",
  music: "Pick a track",
  status: "",
};

/* ── Status cell ───────────────────────────────────────────────────────── */

function StatusCellContent({ rowIndex }: { rowIndex: number }) {
  const status = useBulkStore((store) => store.rows[rowIndex]?.status ?? "draft");
  const progress = useBulkStore((store) => store.rows[rowIndex]?.progress ?? 0);
  const outputAssetId = useBulkStore((store) => store.rows[rowIndex]?.outputAssetId ?? null);
  const error = useBulkStore((store) => store.rows[rowIndex]?.error ?? null);
  const rowId = useBulkStore((store) => store.rows[rowIndex]?.id ?? "");
  const catalog = useBulkCatalog();
  const actions = useBulkGridActions();

  const output = outputAssetId === null ? undefined : catalog.assetsById.get(outputAssetId);

  return (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {output ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={output.poster}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-8 w-5 shrink-0 rounded-sm object-cover"
          />
        ) : null}
        <StatusPill status={status} progress={progress} />
      </span>

      {status === "failed" ? (
        <Tooltip content={error ?? "This row didn't finish. Run it again."}>
          <IconButton
            label="Run this row again"
            glyph={IconRetry}
            size="sm"
            tabIndex={-1}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => actions.retryRow(rowId)}
          />
        </Tooltip>
      ) : null}
    </>
  );
}
