"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Slide, SlideLayer } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { DragNumberInput } from "@/components/ui/drag-number-input";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { PanelSection, PropertyPanel, PropertyRow } from "@/components/ui/property-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCopy,
  IconDelete,
  IconLayers,
} from "@/components/icons";
import { DOC_HEIGHT, DOC_WIDTH, MIN_LAYER_SIZE } from "./geometry";
import { STYLE_PRESETS } from "./presets";
import {
  ALIGN_OPTIONS,
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TEXT_STYLE_OPTIONS,
  type TextLayer,
} from "./text-style";

/**
 * The 280px property panel (SPEC §8.6), built only from `PropertyPanel`,
 * `PanelSection` and `PropertyRow` — which is what makes it read as the same
 * product as the timeline and canvas panels rather than as a third opinion.
 *
 * Every numeric field is a `DragNumberInput`: click to type, drag to scrub,
 * arrow keys to step. SPEC §15 calls that "enormous credibility", and it is
 * also the keyboard equivalent for the canvas's resize and rotation handles.
 */
export interface PropertiesPanelProps {
  slide: Slide | null;
  layer: SlideLayer | null;
  stylePreset: string;
  onPresetChange: (preset: string) => void;
  onBackgroundChange: (color: string) => void;
  onLayerChange: (
    produce: (layer: SlideLayer) => SlideLayer,
    label: string,
    mergeKey?: string,
  ) => void;
  onDuplicateLayer: () => void;
  onDeleteLayer: () => void;
  onAddText: () => void;
  /** Focuses the content field the frame after a text layer is added. */
  contentFieldRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function PropertiesPanel({
  slide,
  layer,
  stylePreset,
  onPresetChange,
  onBackgroundChange,
  onLayerChange,
  onDuplicateLayer,
  onDeleteLayer,
  onAddText,
  contentFieldRef,
}: PropertiesPanelProps) {
  const text = layer?.kind === "text" ? layer : null;

  return (
    <PropertyPanel aria-label="Slide and layer properties">
      {/*
        Arrow keys nudge the selected layer, but not while focus is in here —
        an arrow press on the rotation field must rotate, not move.
      */}
      <div data-canvas-keys="off" className="flex min-h-0 flex-col">
        <div className="flex items-center gap-2 border-b border-ink-200 px-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-label truncate text-ink-950">{layer?.name ?? "No layer selected"}</p>
            <p className="text-body-sm truncate text-ink-500">
              {layer ? `${LAYER_KIND_LABEL[layer.kind]} layer` : (slide?.name ?? "No slide")}
            </p>
          </div>
          <IconButton
            size="sm"
            glyph={IconCopy}
            label="Duplicate the selected layer"
            disabled={!layer}
            onClick={onDuplicateLayer}
          />
          <IconButton
            size="sm"
            variant="danger"
            glyph={IconDelete}
            label="Delete the selected layer"
            disabled={!layer}
            onClick={onDeleteLayer}
          />
        </div>

        <PanelSection title="Style">
          <PropertyRow label="Preset" layout="stacked">
            <Select value={stylePreset} onValueChange={onPresetChange}>
              <SelectTrigger size="sm" aria-label="Style preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name} hint={preset.hint}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyRow>
          {slide ? (
            <PropertyRow
              label="Background"
              hint="Applies to this slide. A preset applies to every slide in the variation."
            >
              <ColorSwatch
                size="sm"
                label="Slide background"
                value={slide.backgroundColor}
                onValueChange={onBackgroundChange}
              />
            </PropertyRow>
          ) : null}
        </PanelSection>

        <PanelSection title="Typography">
          {text ? (
            <TypographyRows layer={text} onChange={onLayerChange} contentRef={contentFieldRef} />
          ) : (
            <p className="text-body-sm text-ink-500">
              Typography applies to text layers. Select one on the canvas, or{" "}
              <button
                type="button"
                onClick={onAddText}
                className={cn(
                  "rounded-sm font-medium text-brand-600 underline underline-offset-2",
                  "transition-ui duration-(--dur-instant) hover:text-brand-600",
                )}
              >
                add a text layer
              </button>
              .
            </p>
          )}
        </PanelSection>

        <PanelSection title="Layout">
          {layer ? (
            <LayoutRows layer={layer} onChange={onLayerChange} />
          ) : (
            <EmptyState
              size="sm"
              glyph={IconLayers}
              title="Nothing selected"
              description="Pick a layer on the canvas to move, resize or fade it."
              action={
                <Button size="sm" variant="secondary" onClick={onAddText}>
                  Add a text layer
                </Button>
              }
            />
          )}
        </PanelSection>
      </div>
    </PropertyPanel>
  );
}

const LAYER_KIND_LABEL: Record<SlideLayer["kind"], string> = {
  text: "Text",
  image: "Image",
  shape: "Shape",
};

type ChangeHandler = PropertiesPanelProps["onLayerChange"];

function TypographyRows({
  layer,
  onChange,
  contentRef,
}: {
  layer: TextLayer;
  onChange: ChangeHandler;
  contentRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  /**
   * One patch helper for every row. The merge key is per property, so scrubbing
   * the size and then the outline width are two undo entries, while scrubbing
   * the size for three seconds stays one.
   */
  const edit = (patch: Partial<TextLayer>, label: string, key: string) =>
    onChange(
      (current) => (current.kind === "text" ? { ...current, ...patch } : current),
      label,
      `${layer.id}:${key}`,
    );

  return (
    <>
      <PropertyRow label="Text" layout="stacked" htmlFor={`${layer.id}-content`}>
        <Textarea
          ref={contentRef}
          id={`${layer.id}-content`}
          autoGrow
          rows={2}
          value={layer.content}
          onChange={(event) => edit({ content: event.target.value }, "Edit the text", "content")}
        />
      </PropertyRow>

      <PropertyRow label="Style">
        <Select
          value={layer.textStyle}
          onValueChange={(value) =>
            edit(
              { textStyle: value as TextLayer["textStyle"] },
              "Change the text style",
              "textStyle",
            )
          }
        >
          <SelectTrigger size="sm" aria-label="Text style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_STYLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow label="Size">
        <DragNumberInput
          ariaLabel="Text size"
          value={layer.fontSize}
          min={8}
          max={400}
          unit="px"
          onValueChange={(value) => edit({ fontSize: value }, "Change the text size", "fontSize")}
        />
      </PropertyRow>

      <PropertyRow label="Colour">
        <ColorSwatch
          size="sm"
          label="Text colour"
          value={layer.color}
          onValueChange={(value) => edit({ color: value }, "Change the text colour", "color")}
        />
      </PropertyRow>

      <PropertyRow
        label="Outline"
        hint="Outline colour also paints the shadow and the highlight box."
      >
        <ColorSwatch
          size="sm"
          label="Outline colour"
          value={layer.outlineColor}
          onValueChange={(value) =>
            edit({ outlineColor: value }, "Change the outline colour", "outlineColor")
          }
        />
      </PropertyRow>

      <PropertyRow label="Width">
        <DragNumberInput
          ariaLabel="Outline width"
          value={layer.outlineWidth}
          min={0}
          max={40}
          unit="px"
          onValueChange={(value) =>
            edit({ outlineWidth: value }, "Change the outline width", "outlineWidth")
          }
        />
      </PropertyRow>

      <PropertyRow label="Weight">
        <Select
          value={layer.fontWeight}
          onValueChange={(value) =>
            edit(
              { fontWeight: value as TextLayer["fontWeight"] },
              "Change the font weight",
              "fontWeight",
            )
          }
        >
          <SelectTrigger size="sm" aria-label="Font weight">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_WEIGHT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow label="Font">
        <Select
          value={layer.fontFamily}
          onValueChange={(value) => edit({ fontFamily: value }, "Change the font", "fontFamily")}
        >
          <SelectTrigger size="sm" aria-label="Font family">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow label="Align">
        <SegmentedControl
          size="sm"
          ariaLabel="Text alignment"
          value={layer.align}
          onValueChange={(value) => edit({ align: value }, "Change the alignment", "align")}
          items={ALIGN_OPTIONS.map((option) => ({
            value: option.value,
            glyph: ALIGN_GLYPH[option.value],
            label: <span className="sr-only">{option.label}</span>,
          }))}
        />
      </PropertyRow>
    </>
  );
}

const ALIGN_GLYPH = {
  left: IconAlignLeft,
  center: IconAlignCenter,
  right: IconAlignRight,
} as const;

function LayoutRows({ layer, onChange }: { layer: SlideLayer; onChange: ChangeHandler }) {
  const transform = layer.transform;
  const setTransform = (patch: Partial<SlideLayer["transform"]>, label: string, key: string) =>
    onChange(
      (current) => ({ ...current, transform: { ...current.transform, ...patch } }),
      label,
      `${layer.id}:${key}`,
    );

  return (
    <>
      <PropertyRow label="Position">
        <div className="flex gap-2">
          <DragNumberInput
            ariaLabel="Position X"
            value={transform.x}
            min={-DOC_WIDTH}
            max={DOC_WIDTH * 2}
            onValueChange={(value) => setTransform({ x: value }, "Move the layer", "x")}
          />
          <DragNumberInput
            ariaLabel="Position Y"
            value={transform.y}
            min={-DOC_HEIGHT}
            max={DOC_HEIGHT * 2}
            onValueChange={(value) => setTransform({ y: value }, "Move the layer", "y")}
          />
        </div>
      </PropertyRow>

      <PropertyRow label="Size">
        <div className="flex gap-2">
          <DragNumberInput
            ariaLabel="Width"
            value={transform.width}
            min={MIN_LAYER_SIZE}
            max={DOC_WIDTH * 2}
            onValueChange={(value) => setTransform({ width: value }, "Resize the layer", "width")}
          />
          <DragNumberInput
            ariaLabel="Height"
            value={transform.height}
            min={MIN_LAYER_SIZE}
            max={DOC_HEIGHT * 2}
            onValueChange={(value) => setTransform({ height: value }, "Resize the layer", "height")}
          />
        </div>
      </PropertyRow>

      <PropertyRow label="Rotation">
        <DragNumberInput
          ariaLabel="Rotation"
          value={transform.rotation}
          min={-180}
          max={180}
          unit="°"
          onValueChange={(value) => setTransform({ rotation: value }, "Rotate the layer", "rotation")}
        />
      </PropertyRow>

      <PropertyRow label="Opacity">
        <DragNumberInput
          ariaLabel="Opacity"
          value={Math.round(transform.opacity * 100)}
          min={0}
          max={100}
          sensitivity={0.5}
          unit="%"
          onValueChange={(value) =>
            setTransform({ opacity: value / 100 }, "Change the layer opacity", "opacity")
          }
        />
      </PropertyRow>
    </>
  );
}
