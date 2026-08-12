"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { listActors } from "@/lib/api/actors";
import { queryKeys } from "@/lib/api/keys";
import { listTemplates } from "@/lib/api/templates";
import { formatDurationShort } from "@/lib/format";
import { TEMPLATE_CATEGORY_LABEL } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconCheck, IconTemplate, IconVoice } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

const trigger = cn(
  "inline-flex h-control-md items-center gap-2 rounded-md px-3",
  "text-body-sm text-ink-700 transition-ui duration-(--dur-instant)",
  "hover:bg-ink-100 hover:text-ink-950",
  "data-[state=open]:bg-ink-100 data-[state=open]:text-ink-950",
);

const row = cn(
  "flex w-full items-center gap-3 rounded-sm p-2 text-left",
  "text-body-sm transition-ui duration-(--dur-instant) hover:bg-ink-100",
);

/** SPEC §8.2 bottom row — Templates. Clearing is part of the same control. */
export function TemplatePicker({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const templates = useQuery({ queryKey: queryKeys.templates.list, queryFn: () => listTemplates() });
  const selected = templates.data?.find((template) => template.id === value);

  return (
    <Popover>
      <PopoverTrigger className={trigger} aria-label="Choose a template">
        <Icon glyph={IconTemplate} size={16} className="text-ink-400" />
        <span className="max-w-32 truncate">{selected?.name ?? "Templates"}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-sheet p-2">
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <p className="eyebrow text-ink-500">Structure to follow</p>
          {value ? (
            <button
              type="button"
              onClick={() => onValueChange(null)}
              className="text-body-sm text-ink-500 transition-ui duration-(--dur-instant) hover:text-ink-950"
            >
              Clear
            </button>
          ) : null}
        </div>
        <ul className="dropdown-list overflow-y-auto">
          {templates.isPending
            ? Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="p-2">
                  <Skeleton className="h-8 w-full" />
                </li>
              ))
            : (templates.data ?? []).slice(0, 12).map((template) => (
                <li key={template.id}>
                  <button type="button" className={row} onClick={() => onValueChange(template.id)}>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-ink-950">{template.name}</span>
                      <span className="mono-sm text-ink-500">
                        {TEMPLATE_CATEGORY_LABEL[template.category]} ·{" "}
                        {formatDurationShort(template.durationMs)}
                      </span>
                    </span>
                    {template.id === value ? (
                      <Icon glyph={IconCheck} size={16} className="text-brand-500" />
                    ) : null}
                  </button>
                </li>
              ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** SPEC §8.2 bottom row — Actor. */
export function ActorPicker({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const actors = useQuery({ queryKey: queryKeys.actors.list, queryFn: () => listActors() });
  const selected = actors.data?.find((actor) => actor.id === value);

  return (
    <Popover>
      <PopoverTrigger className={trigger} aria-label="Choose an actor">
        <Icon glyph={IconVoice} size={16} className="text-ink-400" />
        <span className="max-w-32 truncate">{selected?.name ?? "Actor"}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-sheet p-2">
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <p className="eyebrow text-ink-500">Who delivers it</p>
          {value ? (
            <button
              type="button"
              onClick={() => onValueChange(null)}
              className="text-body-sm text-ink-500 transition-ui duration-(--dur-instant) hover:text-ink-950"
            >
              Clear
            </button>
          ) : null}
        </div>
        <ul className="dropdown-list overflow-y-auto">
          {actors.isPending
            ? Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="p-2">
                  <Skeleton className="h-8 w-full" />
                </li>
              ))
            : (actors.data ?? []).map((actor) => (
                <li key={actor.id}>
                  <button type="button" className={row} onClick={() => onValueChange(actor.id)}>
                    <Avatar name={actor.name} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-ink-950">{actor.name}</span>
                      <span className="mono-sm truncate text-ink-500">
                        {actor.styles.join(" · ")}
                      </span>
                    </span>
                    {actor.id === value ? (
                      <Icon glyph={IconCheck} size={16} className="text-brand-500" />
                    ) : null}
                  </button>
                </li>
              ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
