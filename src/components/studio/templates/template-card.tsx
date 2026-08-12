"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import type { Asset, Template } from "@/lib/schemas";
import { TEMPLATE_CATEGORY_LABEL } from "@/lib/schemas";
import { formatDurationShort } from "@/lib/format";
import { Icon } from "@/components/icon";
import { IconTemplate } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PACING_LABEL } from "./labels";

/**
 * SPEC §8.3 — "cards autoplay a muted preview on hover".
 *
 * The poster carries the card until the pointer arrives; the `<video>` mounts
 * only while the card is hovered or focused, so a screen of 24 templates is
 * one decoding video at a time rather than 24. Focus counts as hover here, so
 * a keyboard user sees the same preview a mouse user does.
 *
 * Under `prefers-reduced-motion` the preview never starts and the still holds
 * — SPEC §4.6 has no exception for autoplaying video.
 */
export interface TemplateCardProps {
  template: Template;
  preview: Asset | undefined;
  onOpen: () => void;
}

export function TemplateCard({ template, preview, onOpen }: TemplateCardProps) {
  const reduced = useReducedMotion();
  const [active, setActive] = React.useState(false);
  const playing = active && !reduced && preview !== undefined;

  return (
    <article className="group flex min-w-0 flex-col gap-3">
      <div
        className={cn(
          "relative aspect-9/16 w-full overflow-hidden rounded-md bg-ink-100",
          "shadow-elev-1 transition-ui duration-(--dur-fast) group-hover:shadow-elev-2",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.poster}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn(
              "size-full object-cover transition-ui duration-(--dur-fast)",
              playing && "opacity-0",
            )}
          />
        ) : (
          <span className="grid size-full place-items-center text-ink-400">
            <Icon glyph={IconTemplate} size={24} />
          </span>
        )}

        {playing && preview ? (
          <video
            src={preview.src}
            muted
            loop
            autoPlay
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-16",
            "bg-gradient-to-t from-ink-950/60 to-transparent opacity-0",
            "transition-ui duration-(--dur-fast) group-hover:opacity-100",
          )}
        />

        <span className="mono-sm glass pointer-events-none absolute bottom-2 left-2 rounded-sm bg-ink-950/55 px-1 text-white">
          {formatDurationShort(template.durationMs)}
        </span>

        <button
          type="button"
          onClick={onOpen}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setActive(true);
          }}
          onPointerLeave={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          className="absolute inset-0 focus-visible:ring-focus-inset"
        >
          <span className="sr-only">Open {template.name}</span>
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-body-md truncate font-medium text-ink-950">{template.name}</h2>
        <p className="text-body-sm line-clamp-2 text-ink-500">{template.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{TEMPLATE_CATEGORY_LABEL[template.category]}</Badge>
          <Badge tone="outline">{PACING_LABEL[template.pacing]}</Badge>
          <span className="mono-sm text-ink-400" data-numeric>
            {template.sceneCount} scenes · {template.aspect}
          </span>
        </div>
      </div>
    </article>
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-9/16 w-full rounded-md" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-5 w-3/5" />
    </div>
  );
}
