"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { AspectRatio, Model } from "@/lib/schemas";
import { ASPECT_DIMENSIONS } from "@/lib/schemas";
import { formatNumber } from "@/lib/format";
import { Icon } from "@/components/icon";
import { IconChevronsUpDown, IconGenerate } from "@/components/icons";
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/* ── Aspect ratio ──────────────────────────────────────────────────────── */

const ASPECTS: readonly AspectRatio[] = ["9:16", "1:1", "16:9", "4:5"];

/**
 * Each option draws its own proportion rather than relying on the label, so
 * the choice is legible before you read anything (SPEC §8.2).
 */
export function AspectRatioPicker({
  value,
  onValueChange,
  disabled,
  className,
}: {
  value: AspectRatio;
  onValueChange: (value: AspectRatio) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label={`Aspect ratio: ${value}`}
        className={cn(
          "flex h-control-md items-center gap-2 rounded-md border border-ink-200 bg-surface px-3",
          "text-body-sm text-ink-950 transition-ui duration-(--dur-instant)",
          "hover:border-ink-300 hover:bg-ink-50",
          "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-300",
          className,
        )}
      >
        <AspectGlyph aspect={value} />
        <span className="mono-sm">{value}</span>
        <Icon glyph={IconChevronsUpDown} size={16} className="text-ink-400" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-1">
        <ul className="flex flex-col">
          {ASPECTS.map((aspect) => {
            const dims = ASPECT_DIMENSIONS[aspect];
            return (
              <li key={aspect}>
                <button
                  type="button"
                  onClick={() => onValueChange(aspect)}
                  aria-pressed={aspect === value}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left",
                    "text-body-sm transition-ui duration-(--dur-instant)",
                    aspect === value ? "bg-ink-100 text-ink-950" : "text-ink-700 hover:bg-ink-50",
                  )}
                >
                  <AspectGlyph aspect={aspect} />
                  <span className="mono-sm w-10">{aspect}</span>
                  <span className="mono-sm text-ink-500">
                    {dims.width}×{dims.height}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function AspectGlyph({ aspect }: { aspect: AspectRatio }) {
  const { width, height } = ASPECT_DIMENSIONS[aspect];
  const scale = 16 / Math.max(width, height);
  return (
    <span
      aria-hidden="true"
      className="grid size-4 shrink-0 place-items-center text-ink-500"
    >
      <span
        className="block border border-current"
        // dynamic: the glyph draws the ratio it represents.
        style={{
          width: `${Math.max(4, width * scale)}px`,
          height: `${Math.max(4, height * scale)}px`,
        }}
      />
    </span>
  );
}

/* ── Duration ──────────────────────────────────────────────────────────── */

export function DurationPicker({
  value,
  onValueChange,
  options = [5000, 10_000, 15_000],
  disabled,
  className,
}: {
  value: number;
  onValueChange: (value: number) => void;
  options?: readonly number[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onValueChange(Number(next))}
      disabled={disabled}
    >
      <SelectTrigger aria-label="Clip duration" className={cn("w-20", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((ms) => (
          <SelectItem key={ms} value={String(ms)}>
            {ms / 1000}s
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── Model ─────────────────────────────────────────────────────────────── */

/**
 * Shows the capability badge and per-generation cost next to each name — the
 * two things the choice actually turns on (SPEC §8.2).
 */
export function ModelPicker({
  models,
  value,
  onValueChange,
  disabled,
  className,
}: {
  models: readonly Model[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const selected = models.find((model) => model.id === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label="Model" className={cn("w-panel", className)}>
        <Icon glyph={IconGenerate} size={16} className="text-ink-400" />
        <span className="truncate">{selected?.name ?? "Choose a model"}</span>
        {selected ? (
          <span className="mono-sm ml-auto shrink-0 text-ink-500">
            {formatNumber(selected.tokensPerGeneration)}
          </span>
        ) : null}
      </SelectTrigger>
      <SelectContent className="w-sheet">
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <span className="flex min-w-0 flex-1 flex-col gap-1 py-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-ink-950">{model.name}</span>
                <Badge tone="brand" size="sm">
                  {model.capability}
                </Badge>
                <span className="mono-sm ml-auto text-ink-500">
                  {formatNumber(model.tokensPerGeneration)}
                </span>
              </span>
              <span className="text-body-sm text-ink-500">{model.description}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
