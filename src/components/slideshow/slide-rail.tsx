"use client";

import * as React from "react";
import { Reorder, useDragControls } from "motion/react";
import { cn } from "@/lib/cn";
import type { Asset, Slide } from "@/lib/schemas";
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconDelete,
  IconPlus,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { IconButton } from "@/components/ui/icon-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlideMiniature } from "./slide-miniature";

/**
 * The slide rail (SPEC §8.6): a vertical strip of true miniatures, reorderable
 * by drag, with add, duplicate and delete per slide and a counter.
 *
 * Reordering uses Motion's `Reorder`, matching the workspace tabs, so the two
 * drag-to-reorder gestures in the product feel identical. Drag is started from
 * the thumbnail's own pointer-down rather than by the item, so a plain click
 * still selects and the overlay buttons still receive their events.
 *
 * The keyboard equivalent for dragging is in the context menu — "Move up" and
 * "Move down" — and on ⌥⇧↑ / ⌥⇧↓, which the shortcuts dialog documents.
 */
const THUMBNAIL_WIDTH = 72;

export interface SlideRailProps {
  slides: readonly Slide[];
  assets: ReadonlyMap<string, Asset>;
  activeSlideId: string | null;
  activeIndex: number;
  onSelect: (slideId: string) => void;
  onReorder: (slides: Slide[]) => void;
  onAdd: (afterSlideId: string | null) => void;
  onDuplicate: (slideId: string) => void;
  onDelete: (slideId: string) => void;
  onMove: (slideId: string, delta: number) => void;
}

export function SlideRail({
  slides,
  assets,
  activeSlideId,
  activeIndex,
  onSelect,
  onReorder,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
}: SlideRailProps) {
  return (
    <div className="flex w-rail shrink-0 flex-col border-r border-ink-200 bg-surface">
      <div className="flex flex-col gap-1 border-b border-ink-200 px-3 py-3">
        <p className="eyebrow text-ink-400">Slides</p>
        <p className="mono-sm text-ink-700">
          {slides.length === 0 ? "None yet" : `${activeIndex + 1} / ${slides.length}`}
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <Reorder.Group
          as="ul"
          axis="y"
          values={[...slides]}
          onReorder={onReorder}
          aria-label="Slides in this variation"
          className="flex flex-col gap-2 p-2"
        >
          {slides.map((slide, index) => (
            <SlideRailItem
              key={slide.id}
              slide={slide}
              assets={assets}
              index={index}
              total={slides.length}
              active={slide.id === activeSlideId}
              onSelect={() => onSelect(slide.id)}
              onAdd={() => onAdd(slide.id)}
              onDuplicate={() => onDuplicate(slide.id)}
              onDelete={() => onDelete(slide.id)}
              onMove={(delta) => onMove(slide.id, delta)}
            />
          ))}
        </Reorder.Group>
      </ScrollArea>

      <div className="border-t border-ink-200 p-2">
        <Button
          size="sm"
          variant="secondary"
          block
          iconStart={IconPlus}
          onClick={() => onAdd(activeSlideId)}
        >
          Slide
        </Button>
      </div>
    </div>
  );
}

interface SlideRailItemProps {
  slide: Slide;
  assets: ReadonlyMap<string, Asset>;
  index: number;
  total: number;
  active: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
}

function SlideRailItem({
  slide,
  assets,
  index,
  total,
  active,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
}: SlideRailItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item as="li" value={slide} dragListener={false} dragControls={controls}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group relative">
            <button
              type="button"
              aria-current={active ? "true" : undefined}
              aria-label={`Slide ${index + 1}: ${slide.name}`}
              onClick={onSelect}
              onPointerDown={(event) => {
                if (event.button === 0) controls.start(event);
              }}
              className={cn(
                "block w-full overflow-hidden rounded-sm border bg-ink-950",
                "transition-ui duration-(--dur-fast)",
                active
                  ? "border-brand-500 shadow-elev-2"
                  : "border-ink-200 hover:border-ink-300 hover:shadow-elev-1",
              )}
            >
              <SlideMiniature slide={slide} assets={assets} width={THUMBNAIL_WIDTH} />
            </button>

            <span
              aria-hidden="true"
              className={cn(
                "mono-sm pointer-events-none absolute left-1 top-1 rounded-sm px-1",
                active ? "bg-brand-500 text-white" : "bg-ink-950/70 text-white",
              )}
            >
              {index + 1}
            </span>

            <div
              className={cn(
                "absolute inset-x-1 bottom-1 flex justify-between gap-1",
                "opacity-0 transition-ui duration-(--dur-fast)",
                "group-hover:opacity-100 group-focus-within:opacity-100",
                "[@media(pointer:coarse)]:opacity-100",
              )}
            >
              <IconButton
                size="sm"
                variant="overlay"
                glyph={IconCopy}
                label={`Duplicate slide ${index + 1}`}
                onClick={onDuplicate}
              />
              <IconButton
                size="sm"
                variant="overlay"
                glyph={IconDelete}
                label={`Delete slide ${index + 1}`}
                onClick={onDelete}
              />
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem glyph={IconPlus} onSelect={onAdd}>
            Add a slide after this one
          </ContextMenuItem>
          <ContextMenuItem glyph={IconCopy} onSelect={onDuplicate}>
            Duplicate this slide
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            glyph={IconArrowUp}
            disabled={index === 0}
            shortcut="⌥⇧↑"
            onSelect={() => onMove(-1)}
          >
            Move up
          </ContextMenuItem>
          <ContextMenuItem
            glyph={IconArrowDown}
            disabled={index === total - 1}
            shortcut="⌥⇧↓"
            onSelect={() => onMove(1)}
          >
            Move down
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem glyph={IconDelete} tone="danger" onSelect={onDelete}>
            Delete this slide
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Reorder.Item>
  );
}
