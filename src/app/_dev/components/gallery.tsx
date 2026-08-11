"use client";

import * as React from "react";
import { Logo, Logomark } from "@/components/brand/logomark";
import { Icon } from "@/components/icon";
import {
  IconDelete,
  IconDownload,
  IconFavorite,
  IconGenerate,
  IconGrid,
  IconPlay,
  IconSearch,
  IconVideo,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { Combobox } from "@/components/ui/combobox";
import { DragNumberInput } from "@/components/ui/drag-number-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { KeyboardShortcut } from "@/components/ui/keyboard-shortcut";
import { NumberStepper } from "@/components/ui/number-stepper";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { PanelSection, PropertyRow } from "@/components/ui/property-row";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { StatusPill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";
import { GalleryOverlays } from "./overlays";
import { Section, Row, TypeScale, ColorRamp } from "./primitives";

export function ComponentGallery() {
  const [checked, setChecked] = React.useState(true);
  const [switched, setSwitched] = React.useState(true);
  const [radio, setRadio] = React.useState("fast");
  const [slider, setSlider] = React.useState([60]);
  const [count, setCount] = React.useState(3);
  const [segment, setSegment] = React.useState<"monthly" | "yearly">("yearly");
  const [numeric, setNumeric] = React.useState(24);
  // token-lint-disable-next-line no-raw-hex — the demo seeds the colour well
  // with a user-content value, which is what a colour picker holds.
  const [color, setColor] = React.useState("#3D6FF0");
  const [combo, setCombo] = React.useState<string | null>("product-demo");

  return (
    <div className="mx-auto flex max-w-marketing flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-3">
        <Logo size={24} />
        <h1 className="text-display-md text-ink-950">Components</h1>
        <p className="text-body-lg max-w-measure text-ink-500">
          Every primitive in every state. This route exists so a state can be looked at rather
          than assumed, and it is excluded from production builds.
        </p>
      </header>

      <Section title="Foundations" description="Type scale, colour ramps and the logomark.">
        <TypeScale />
        <ColorRamp />
        <Row label="Logomark at three sizes">
          <span className="flex items-end gap-6 text-ink-950">
            <Logomark size={20} />
            <Logomark size={48} />
            <Logomark size={96} />
          </span>
        </Row>
        <Row label="Icon sizes and stroke weights">
          <span className="flex items-center gap-4 text-ink-700">
            <Icon glyph={IconPlay} size={16} />
            <Icon glyph={IconPlay} size={20} />
            <Icon glyph={IconPlay} size={24} />
          </span>
        </Row>
      </Section>

      <Section title="Button" description="Six variants, three sizes, every state.">
        <Row label="Variants">
          <Button variant="primary">Generate video</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete project</Button>
          <Button variant="pill">Get started</Button>
        </Row>
        <Row label="Inverse (on dark)" dark>
          <Button variant="inverse">Book a call</Button>
        </Row>
        <Row label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="With icons">
          <Button iconStart={IconGenerate}>Generate</Button>
          <Button variant="secondary" iconEnd={IconDownload}>
            Export video
          </Button>
        </Row>
        <Row label="Loading and disabled">
          <Button loading>Exporting</Button>
          <Button variant="secondary" loading>
            Saving
          </Button>
          <Button disabled>Not available</Button>
          <Button variant="secondary" disabled>
            Not available
          </Button>
        </Row>
        <Row label="Icon buttons">
          <IconButton label="Favourite" glyph={IconFavorite} />
          <IconButton label="Download" glyph={IconDownload} variant="secondary" />
          <IconButton label="Generate" glyph={IconGenerate} variant="primary" />
          <IconButton label="Delete" glyph={IconDelete} variant="danger" />
          <IconButton label="Loading" glyph={IconDownload} loading />
          <IconButton label="Disabled" glyph={IconDownload} disabled />
        </Row>
      </Section>

      <Section title="Form controls" description="Each with its label, hint, error and disabled state.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Project name" hint="Shown on the workspace card and the tab.">
            <Input placeholder="Hydrating serum — hook tests" />
          </Field>
          <Field label="Source link" error="That doesn't look like a link. Paste the full URL, starting with https.">
            <Input defaultValue="tiktok" iconStart={IconSearch} />
          </Field>
          <Field label="Disabled" hint="Locked while a render is running.">
            <Input disabled defaultValue="Cannot edit right now" />
          </Field>
          <Field label="Script" hint="Cmd+Enter to generate.">
            <Textarea autoGrow placeholder="It absorbs in about ten seconds." />
          </Field>
          <Field label="Category">
            <Combobox
              ariaLabel="Category"
              value={combo}
              onValueChange={setCombo}
              options={[
                { value: "product-demo", label: "Product demo" },
                { value: "ugc-testimonial", label: "UGC testimonial" },
                { value: "listicle", label: "Listicle", hint: "24" },
                { value: "unboxing", label: "Unboxing", disabled: true },
              ]}
            />
          </Field>
          <Field label="Brand colour">
            <ColorSwatch label="Brand colour" value={color} onValueChange={setColor} />
          </Field>
        </div>

        <Row label="Checkbox, radio, switch">
          <span className="flex items-center gap-2">
            <Checkbox
              id="demo-captions"
              checked={checked}
              onCheckedChange={(next) => setChecked(next === true)}
            />
            <label htmlFor="demo-captions" className="text-body-sm text-ink-700">
              Burn in captions
            </label>
          </span>
          <span className="flex items-center gap-2">
            <Checkbox id="demo-disabled" disabled />
            <label htmlFor="demo-disabled" className="text-body-sm text-ink-300">
              Disabled
            </label>
          </span>
          <RadioGroup
            value={radio}
            onValueChange={setRadio}
            className="flex flex-row items-center gap-4"
          >
            {["fast", "medium", "slow"].map((pace) => (
              <span key={pace} className="flex items-center gap-2">
                <Radio id={`demo-pace-${pace}`} value={pace} />
                <label htmlFor={`demo-pace-${pace}`} className="text-body-sm text-ink-700">
                  {pace}
                </label>
              </span>
            ))}
          </RadioGroup>
          <span className="flex items-center gap-2">
            <Switch id="demo-priority" checked={switched} onCheckedChange={setSwitched} />
            <label htmlFor="demo-priority" className="text-body-sm text-ink-700">
              Priority rendering
            </label>
          </span>
        </Row>

        <Row label="Slider, stepper, segmented control">
          <div className="w-48">
            <Slider
              value={slider}
              onValueChange={setSlider}
              max={100}
              showValue
              formatValue={(value) => `${value}%`}
              aria-label="Opacity"
            />
          </div>
          <NumberStepper value={count} onValueChange={setCount} min={1} max={8} ariaLabel="Batch count" />
          <SegmentedControl
            ariaLabel="Billing period"
            value={segment}
            onValueChange={setSegment}
            items={[
              { value: "monthly", label: "Monthly" },
              {
                value: "yearly",
                label: "Yearly",
                badge: (
                  <Badge tone="success" size="sm">
                    Save 20%
                  </Badge>
                ),
              },
            ]}
          />
        </Row>

        <Row label="Drag-scrubbable number (click to type, drag to scrub)">
          <div className="w-32">
            <DragNumberInput
              value={numeric}
              onValueChange={setNumeric}
              ariaLabel="Font size"
              unit="px"
              min={8}
              max={200}
            />
          </div>
        </Row>
      </Section>

      <Section title="Feedback" description="Status, progress and loading.">
        <Row label="Badges">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Popular</Badge>
          <Badge tone="success">Ready</Badge>
          <Badge tone="warning">Low tokens</Badge>
          <Badge tone="danger">Failed</Badge>
          <Badge tone="outline">Draft</Badge>
        </Row>
        <Row label="Status">
          <StatusPill status="draft" />
          <StatusPill status="queued" />
          <StatusPill status="generating" progress={62} />
          <StatusPill status="ready" />
          <StatusPill status="failed" />
        </Row>
        <Row label="Progress">
          <div className="w-48">
            <Progress value={64} aria-label="Export progress" />
          </div>
          <div className="w-48">
            <Progress value={0} indeterminate aria-label="Preparing" />
          </div>
          <span className="text-ink-950">
            <ProgressRing value={72} size={32} label="72% complete" />
          </span>
        </Row>
        <Row label="Skeletons, not spinners">
          <div className="flex w-64 flex-col gap-3">
            <Skeleton className="aspect-9/16 w-24 rounded-md" />
            <SkeletonText lines={3} />
          </div>
        </Row>
        <Row label="Keyboard shortcuts">
          <KeyboardShortcut keys="mod+z" />
          <KeyboardShortcut keys="shift+mod+z" />
          <KeyboardShortcut keys="space" />
          <KeyboardShortcut keys="s" />
        </Row>
      </Section>

      <Section title="Navigation" description="Tabs and toolbars.">
        <Row label="Tabs — line">
          <Tabs defaultValue="all" variant="line" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="audio" disabled>
                Audio
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="pt-4 text-body-sm text-ink-500">
              The indicator travels between tabs rather than fading in and out.
            </TabsContent>
          </Tabs>
        </Row>
        <Row label="Tabs — pill">
          <Tabs defaultValue="grid" variant="pill">
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>
        <Row label="Toolbar (arrow keys move between controls)">
          <Toolbar ariaLabel="Demo tools" className="rounded-md border border-ink-200 bg-surface p-1">
            <IconButton label="Play" glyph={IconPlay} size="sm" />
            <IconButton label="Favourite" glyph={IconFavorite} size="sm" />
            <ToolbarSeparator />
            <IconButton label="Download" glyph={IconDownload} size="sm" />
            <IconButton label="Delete" glyph={IconDelete} size="sm" variant="danger" />
          </Toolbar>
        </Row>
        <Row label="Tooltip">
          <Tooltip content="Generation costs 120 tokens">
            <Button variant="secondary">Hover me</Button>
          </Tooltip>
          <Tooltip content="You're out of tokens for this cycle. Top up to keep generating." disabledTrigger>
            <Button disabled>Generate</Button>
          </Tooltip>
        </Row>
      </Section>

      <Section title="Panels" description="The 280px property panel grid every editor is built from.">
        <div className="w-panel rounded-lg border border-ink-200 bg-surface">
          <PanelSection title="Typography">
            <PropertyRow label="Size">
              <DragNumberInput
                value={numeric}
                onValueChange={setNumeric}
                ariaLabel="Size"
                unit="px"
                min={8}
                max={200}
              />
            </PropertyRow>
            <PropertyRow label="Colour">
              <ColorSwatch label="Text colour" value={color} onValueChange={setColor} size="sm" />
            </PropertyRow>
            <PropertyRow label="Opacity">
              <Slider value={slider} onValueChange={setSlider} max={100} aria-label="Opacity" />
            </PropertyRow>
          </PanelSection>
          <PanelSection title="Layout" defaultOpen={false}>
            <PropertyRow label="Rotation" hint="Drag to scrub, or click to type.">
              <DragNumberInput value={0} onValueChange={() => undefined} ariaLabel="Rotation" unit="°" />
            </PropertyRow>
          </PanelSection>
        </div>
      </Section>

      <GalleryOverlays />

      <Section title="Empty states" description="Mandatory on every list, grid, canvas and timeline.">
        <div className="w-full rounded-lg border border-ink-200 bg-surface">
          <EmptyState
            glyph={IconVideo}
            title="No generations yet"
            description="Describe the shot you want in the composer below, and results land here."
            action={<Button iconStart={IconGenerate}>Write a prompt</Button>}
            secondaryAction={
              <Button variant="ghost" iconStart={IconGrid}>
                Browse templates
              </Button>
            }
          />
        </div>
      </Section>
    </div>
  );
}
