"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { CellOption } from "./catalog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * The two in-cell editors.
 *
 * SPEC §8.7: "type to begin editing, Enter commits and moves down, Tab commits
 * and moves right, Esc cancels." Those three keys are handled on the input
 * itself rather than through the global registry, because while a text field
 * has focus the registry deliberately stands aside — which is also what stops
 * the grid's arrow-key navigation from fighting the caret.
 */

export type CommitDirection = "down" | "up" | "right" | "left" | "stay";

export interface CellTextEditorProps {
  initialValue: string;
  /** The keystroke that opened the editor — typing replaces, Enter appends. */
  seed: string | null;
  onCommit: (value: string, direction: CommitDirection) => void;
  onCancel: () => void;
}

export function CellTextEditor({ initialValue, seed, onCommit, onCancel }: CellTextEditorProps) {
  const [value, setValue] = React.useState(seed ?? initialValue);
  const ref = React.useRef<HTMLInputElement>(null);
  const committed = React.useRef(false);

  React.useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    // Opening with Enter puts the caret at the end so you can amend; opening by
    // typing has already replaced the value, so there is nothing to select.
    if (seed === null) input.setSelectionRange(input.value.length, input.value.length);
  }, [seed]);

  const commit = (direction: CommitDirection) => {
    if (committed.current) return;
    committed.current = true;
    onCommit(value, direction);
  };

  return (
    <input
      ref={ref}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => commit("stay")}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit(event.shiftKey ? "up" : "down");
        } else if (event.key === "Tab") {
          event.preventDefault();
          commit(event.shiftKey ? "left" : "right");
        } else if (event.key === "Escape") {
          event.preventDefault();
          committed.current = true;
          onCancel();
        }
      }}
      className={cn(
        "text-body-sm absolute inset-0 z-(--z-sticky) size-full bg-surface px-2 text-ink-950",
        "ring-focus-inset focus-visible:outline-none",
      )}
      aria-label="Cell value"
    />
  );
}

export interface CellChoiceEditorProps {
  value: string;
  options: readonly CellOption[];
  placeholder: string;
  emptyMessage: string;
  onSelect: (value: string) => void;
  onCancel: () => void;
}

/**
 * Actor, voice and music cells choose from a known list rather than accepting
 * free text — the same reason media cells open the library picker. The list
 * opens the moment the cell enters edit mode, so one keystroke gets you there.
 */
export function CellChoiceEditor({
  value,
  options,
  placeholder,
  emptyMessage,
  onSelect,
  onCancel,
}: CellChoiceEditorProps) {
  return (
    <Select
      defaultOpen
      value={value === "" ? undefined : value}
      onValueChange={onSelect}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <SelectTrigger size="sm" className="absolute inset-0 size-full rounded-none border-brand-500">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <p className="text-body-sm px-3 py-4 text-ink-500">{emptyMessage}</p>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value} hint={option.hint}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
