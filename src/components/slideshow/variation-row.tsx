"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset, Slide } from "@/lib/schemas";
import { IconDownload, IconPlus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlideMiniature } from "./slide-miniature";

/**
 * Variations, docked beneath the canvas (SPEC §8.6): the same layout with
 * different copy and assets, each one editable and individually exportable.
 *
 * Each card shows the first three slides as real miniatures, so the row reads
 * as "the same ad, said three ways" at a glance — which is the entire argument
 * for variations and is invisible if the cards are just names in a list.
 */
const CARD_THUMBNAIL_WIDTH = 32;
const PREVIEW_SLIDES = 3;

export interface VariationEntry {
  id: string | null;
  name: string;
  slides: readonly Slide[];
}

export interface VariationRowProps {
  entries: readonly VariationEntry[];
  assets: ReadonlyMap<string, Asset>;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onExport: (entry: VariationEntry) => void;
  onAdd: () => void;
}

export function VariationRow({
  entries,
  assets,
  activeId,
  onSelect,
  onExport,
  onAdd,
}: VariationRowProps) {
  return (
    <section
      aria-label="Variations"
      className="shrink-0 border-t border-ink-200 bg-surface px-3 py-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <h2 className="eyebrow text-ink-500">Variations</h2>
        <span className="mono-sm text-ink-500">{entries.length}</span>
      </div>

      <ScrollArea orientation="horizontal" fadeEdges>
        <ul className="flex items-stretch gap-3 pb-2">
          {entries.map((entry) => {
            const active = entry.id === activeId;
            return (
              <li key={entry.id ?? "imported"} className="relative shrink-0">
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => onSelect(entry.id)}
                  className={cn(
                    "flex w-32 flex-col gap-2 rounded-md border p-2 text-left",
                    "transition-ui duration-(--dur-fast)",
                    active
                      ? "border-brand-500 bg-brand-50 shadow-elev-1"
                      : "border-ink-200 bg-surface hover:border-ink-300 hover:shadow-elev-1",
                  )}
                >
                  <span className="flex gap-1">
                    {entry.slides.slice(0, PREVIEW_SLIDES).map((slide) => (
                      <SlideMiniature
                        key={slide.id}
                        slide={slide}
                        assets={assets}
                        width={CARD_THUMBNAIL_WIDTH}
                        className="rounded-sm border border-ink-200"
                      />
                    ))}
                    {entry.slides.length === 0 ? (
                      <span className="text-body-sm text-ink-500">No slides yet</span>
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="text-label block truncate text-ink-950">{entry.name}</span>
                    <span className="mono-sm block text-ink-500">
                      {entry.slides.length} {entry.slides.length === 1 ? "slide" : "slides"}
                    </span>
                  </span>
                </button>

                <IconButton
                  size="sm"
                  variant="ghost"
                  glyph={IconDownload}
                  label={`Export ${entry.name}`}
                  onClick={() => onExport(entry)}
                  className="absolute right-1 top-1 bg-surface/80"
                />
              </li>
            );
          })}

          <li className="flex shrink-0 items-center">
            <Button size="sm" variant="secondary" iconStart={IconPlus} onClick={onAdd}>
              Add variation
            </Button>
          </li>
        </ul>
      </ScrollArea>
    </section>
  );
}
