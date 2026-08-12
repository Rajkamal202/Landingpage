"use client";

import type { Clip } from "@/lib/schemas";
import { useTimelineStore } from "@/lib/stores/timeline";
import { IconAlignCenter, IconAlignLeft, IconAlignRight } from "@/components/icons";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { DragNumberInput } from "@/components/ui/drag-number-input";
import { PanelSection, PropertyRow } from "@/components/ui/property-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { ClipTimingSection } from "./clip-timing";
import { ANIMATE_IN, ANIMATE_OUT, FONT_FAMILIES, FONT_WEIGHTS } from "./tools";

/**
 * Everything SPEC §8.5 asks a caption to expose: content, face, size, weight,
 * colour, outline colour and width, alignment, position, rotation, opacity and
 * the two animations. Numeric fields are `DragNumberInput`, which is the
 * detail SPEC §15 says separates a real tool from a toy.
 */
const ALIGNMENTS = [
  { value: "left" as const, label: "Left", glyph: IconAlignLeft },
  { value: "center" as const, label: "Centre", glyph: IconAlignCenter },
  { value: "right" as const, label: "Right", glyph: IconAlignRight },
];

export function TextClipProperties({ clip }: { clip: Extract<Clip, { kind: "text" }> }) {
  const updateClip = useTimelineStore((state) => state.updateClip);
  const updateTextStyle = useTimelineStore((state) => state.updateTextStyle);
  const commitGesture = useTimelineStore((state) => state.commitGesture);

  const { style } = clip;
  const edit = (patch: Parameters<typeof updateTextStyle>[1], label: string, key?: string) =>
    updateTextStyle(clip.id, patch, label, key);

  return (
    <>
      <PanelSection title="Caption">
        <PropertyRow label="Text" layout="stacked" htmlFor={`${clip.id}-content`}>
          <Textarea
            id={`${clip.id}-content`}
            autoGrow
            minRows={2}
            maxRows={6}
            value={clip.content}
            placeholder="What this caption says on screen"
            onChange={(event) =>
              updateClip(
                clip.id,
                (current) =>
                  current.kind === "text"
                    ? { ...current, content: event.target.value, label: event.target.value }
                    : current,
                "Edit the caption",
                `${clip.id}:content`,
              )
            }
            onBlur={commitGesture}
          />
        </PropertyRow>
      </PanelSection>

      <PanelSection title="Typography">
        <PropertyRow label="Font">
          <Select
            value={style.fontFamily}
            onValueChange={(value) => edit({ fontFamily: value }, "Change the caption font")}
          >
            <SelectTrigger size="sm" aria-label="Caption font">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Size" htmlFor={`${clip.id}-size`}>
          <DragNumberInput
            id={`${clip.id}-size`}
            ariaLabel="Caption size"
            value={style.fontSize}
            min={12}
            max={240}
            step={1}
            unit="px"
            onValueChange={(value) =>
              edit({ fontSize: value }, "Change the caption size", `${clip.id}:size`)
            }
            onCommit={commitGesture}
          />
        </PropertyRow>

        <PropertyRow label="Weight">
          <Select
            value={style.fontWeight}
            onValueChange={(value) =>
              edit(
                { fontWeight: value as (typeof FONT_WEIGHTS)[number]["value"] },
                "Change the caption weight",
              )
            }
          >
            <SelectTrigger size="sm" aria-label="Caption weight">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value}>
                  {weight.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Colour">
          <ColorSwatch
            size="sm"
            label="Caption colour"
            value={style.color}
            onValueChange={(value) => edit({ color: value }, "Change the caption colour")}
          />
        </PropertyRow>

        <PropertyRow label="Outline">
          <ColorSwatch
            size="sm"
            label="Caption outline colour"
            value={style.outlineColor}
            onValueChange={(value) => edit({ outlineColor: value }, "Change the outline colour")}
          />
        </PropertyRow>

        <PropertyRow label="Outline width" htmlFor={`${clip.id}-outline`}>
          <DragNumberInput
            id={`${clip.id}-outline`}
            ariaLabel="Caption outline width"
            value={style.outlineWidth}
            min={0}
            max={24}
            step={1}
            unit="px"
            onValueChange={(value) =>
              edit({ outlineWidth: value }, "Change the outline width", `${clip.id}:outline`)
            }
            onCommit={commitGesture}
          />
        </PropertyRow>

        <PropertyRow label="Align">
          <SegmentedControl
            size="sm"
            ariaLabel="Caption alignment"
            value={style.align}
            onValueChange={(value) => edit({ align: value }, "Change the caption alignment")}
            items={ALIGNMENTS.map((item) => ({
              value: item.value,
              label: item.label,
              glyph: item.glyph,
            }))}
          />
        </PropertyRow>
      </PanelSection>

      <PanelSection title="Layout">
        <PropertyRow label="Position X" htmlFor={`${clip.id}-x`}>
          <DragNumberInput
            id={`${clip.id}-x`}
            ariaLabel="Caption horizontal position"
            value={style.x}
            min={-540}
            max={540}
            step={1}
            unit="px"
            onValueChange={(value) => edit({ x: value }, "Move the caption", `${clip.id}:x`)}
            onCommit={commitGesture}
          />
        </PropertyRow>

        <PropertyRow label="Position Y" htmlFor={`${clip.id}-y`}>
          <DragNumberInput
            id={`${clip.id}-y`}
            ariaLabel="Caption vertical position"
            value={style.y}
            min={0}
            max={1920}
            step={1}
            unit="px"
            onValueChange={(value) => edit({ y: value }, "Move the caption", `${clip.id}:y`)}
            onCommit={commitGesture}
          />
        </PropertyRow>

        <PropertyRow label="Rotation" htmlFor={`${clip.id}-rotation`}>
          <DragNumberInput
            id={`${clip.id}-rotation`}
            ariaLabel="Caption rotation"
            value={style.rotation}
            min={-180}
            max={180}
            step={1}
            unit="°"
            onValueChange={(value) =>
              edit({ rotation: value }, "Rotate the caption", `${clip.id}:rotation`)
            }
            onCommit={commitGesture}
          />
        </PropertyRow>

        <PropertyRow label="Opacity" htmlFor={`${clip.id}-opacity`}>
          <DragNumberInput
            id={`${clip.id}-opacity`}
            ariaLabel="Caption opacity"
            value={Math.round(style.opacity * 100)}
            min={0}
            max={100}
            step={1}
            sensitivity={0.5}
            unit="%"
            onValueChange={(value) =>
              edit({ opacity: value / 100 }, "Change the caption opacity", `${clip.id}:opacity`)
            }
            onCommit={commitGesture}
          />
        </PropertyRow>
      </PanelSection>

      <PanelSection title="Animation">
        <PropertyRow label="In">
          <Select
            value={style.animateIn}
            onValueChange={(value) =>
              edit(
                { animateIn: value as (typeof ANIMATE_IN)[number]["value"] },
                "Change how the caption arrives",
              )
            }
          >
            <SelectTrigger size="sm" aria-label="Caption entrance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIMATE_IN.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Out">
          <Select
            value={style.animateOut}
            onValueChange={(value) =>
              edit(
                { animateOut: value as (typeof ANIMATE_OUT)[number]["value"] },
                "Change how the caption leaves",
              )
            }
          >
            <SelectTrigger size="sm" aria-label="Caption exit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIMATE_OUT.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>
      </PanelSection>

      <ClipTimingSection clip={clip} />
    </>
  );
}
