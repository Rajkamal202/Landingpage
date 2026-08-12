"use client";

import type { Asset, Template } from "@/lib/schemas";
import { TEMPLATE_CATEGORY_LABEL } from "@/lib/schemas";
import { formatDurationShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PACING_DESCRIPTION, PACING_LABEL } from "./labels";

/**
 * SPEC §8.3 — the detail sheet: a full preview, the structural breakdown, and
 * "Use template".
 *
 * The breakdown is the point of this panel. A template is a *structure* —
 * this many scenes, this many text layers, cut at this pace — and knowing that
 * before committing is what stops the browser being a wall of moving
 * thumbnails.
 */
export interface TemplateDetailSheetProps {
  template: Template | undefined;
  preview: Asset | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (template: Template) => void;
  using: boolean;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-ink-200 bg-ink-50 px-3 py-2">
      <dt className="text-label text-ink-500">{label}</dt>
      <dd className="mono-sm text-ink-950" data-numeric>
        {value}
      </dd>
    </div>
  );
}

export function TemplateDetailSheet({
  template,
  preview,
  open,
  onOpenChange,
  onUse,
  using,
}: TemplateDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby="template-detail-description">
        <SheetHeader>
          <SheetTitle>{template?.name ?? "Loading template"}</SheetTitle>
          <SheetDescription id="template-detail-description">
            {template?.description ?? "Fetching this template's structure."}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {template === undefined ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="aspect-9/16 w-full rounded-md" />
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {preview ? (
                <video
                  key={preview.id}
                  src={preview.src}
                  poster={preview.poster}
                  controls
                  loop
                  playsInline
                  preload="metadata"
                  className="aspect-9/16 w-full rounded-md bg-ink-100 object-cover"
                />
              ) : (
                <div className="grid aspect-9/16 w-full place-items-center rounded-md bg-ink-100 px-6 text-center">
                  <p className="text-body-sm text-ink-500">
                    This template&rsquo;s preview clip isn&rsquo;t in your library. The structure
                    below is still exactly what you&rsquo;ll get.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{TEMPLATE_CATEGORY_LABEL[template.category]}</Badge>
                <Badge tone="outline">{template.industry}</Badge>
                <Badge tone="brand">{template.aspect}</Badge>
              </div>

              <section className="flex flex-col gap-3">
                <h3 className="eyebrow text-ink-500">Structure</h3>
                <dl className="grid grid-cols-2 gap-3">
                  <Stat label="Scenes" value={String(template.sceneCount)} />
                  <Stat label="Text layers" value={String(template.textLayerCount)} />
                  <Stat label="Runtime" value={formatDurationShort(template.durationMs)} />
                  <Stat label="Pacing" value={PACING_LABEL[template.pacing]} />
                </dl>
                <p className="text-body-sm text-ink-500">
                  {PACING_DESCRIPTION[template.pacing]}
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="eyebrow text-ink-500">What you can swap</h3>
                <ul className="flex flex-wrap gap-2">
                  {template.slots.map((slot) => (
                    <li key={slot}>
                      <Badge tone="neutral">{slot}</Badge>
                    </li>
                  ))}
                </ul>
                <p className="text-body-sm text-ink-500">
                  Every slot becomes a column in the bulk editor, so one approved cut fans out
                  into a batch.
                </p>
              </section>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            variant="primary"
            loading={using}
            disabled={template === undefined}
            onClick={() => {
              if (template) onUse(template);
            }}
          >
            Use template
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep browsing
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
