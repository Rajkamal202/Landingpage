"use client";

import * as React from "react";
import { Icon } from "@/components/icon";
import { IconDownload, IconPlus, IconRedo, IconTemplate, IconUndo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * The editor's top band (SPEC §8.6): which template this slideshow was imported
 * from and which variation is open, plus "Add variation" and "Export all".
 *
 * One control carries both halves of "imported from" — template and variation —
 * because they are one fact, and splitting them into two selects would imply
 * the template could be changed here, which it cannot.
 */

/** The imported slide list has no id of its own; this stands in for it. */
export const BASE_VARIATION_VALUE = "imported";

export interface VariationOption {
  id: string | null;
  name: string;
  slideCount: number;
}

export interface SlideshowToolbarProps {
  projectName: string;
  templateName: string;
  variations: readonly VariationOption[];
  activeVariationId: string | null;
  onVariationChange: (id: string | null) => void;
  undoable: boolean;
  redoable: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddVariation: () => void;
  onExportAll: () => void;
}

export function SlideshowToolbar({
  projectName,
  templateName,
  variations,
  activeVariationId,
  onVariationChange,
  undoable,
  redoable,
  onUndo,
  onRedo,
  onAddVariation,
  onExportAll,
}: SlideshowToolbarProps) {
  const activeName =
    variations.find((variation) => variation.id === activeVariationId)?.name ?? "Imported";

  return (
    <>
      <h1 className="text-body-md min-w-0 shrink truncate font-medium text-ink-950">
        {projectName}
      </h1>

      <ToolbarSeparator />

      <Select
        value={activeVariationId ?? BASE_VARIATION_VALUE}
        onValueChange={(value) =>
          onVariationChange(value === BASE_VARIATION_VALUE ? null : value)
        }
      >
        <SelectTrigger
          size="sm"
          aria-label={`Imported from ${templateName}, editing ${activeName}`}
          className="w-panel"
        >
          <Icon glyph={IconTemplate} size={16} className="shrink-0 text-ink-400" />
          <span className="truncate">{templateName}</span>
          <span aria-hidden="true" className="text-ink-300">
            /
          </span>
          <span className="truncate text-ink-500">{activeName}</span>
        </SelectTrigger>

        <SelectContent>
          <SelectLabel>Variations of {templateName}</SelectLabel>
          {variations.map((variation) => (
            <SelectItem
              key={variation.id ?? BASE_VARIATION_VALUE}
              value={variation.id ?? BASE_VARIATION_VALUE}
              hint={`${variation.slideCount} ${variation.slideCount === 1 ? "slide" : "slides"}`}
            >
              {variation.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip content="Undo" disabledTrigger={!undoable}>
          <IconButton
            size="sm"
            glyph={IconUndo}
            label="Undo"
            disabled={!undoable}
            onClick={onUndo}
          />
        </Tooltip>
        <Tooltip content="Redo" disabledTrigger={!redoable}>
          <IconButton
            size="sm"
            glyph={IconRedo}
            label="Redo"
            disabled={!redoable}
            onClick={onRedo}
          />
        </Tooltip>

        <ToolbarSeparator />

        <Button size="sm" variant="secondary" iconStart={IconPlus} onClick={onAddVariation}>
          Add variation
        </Button>
        <Button size="sm" variant="primary" iconStart={IconDownload} onClick={onExportAll}>
          Export all
        </Button>
      </div>
    </>
  );
}
