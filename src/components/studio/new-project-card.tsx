"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/api/keys";
import { createProject } from "@/lib/api/projects";
import type { ProjectKind } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconGraph, IconPlus, IconSlideshow, IconVideo, type IconDef } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { useOpenProject } from "./use-open-project";

const OPTIONS: ReadonlyArray<{
  kind: ProjectKind;
  name: string;
  label: string;
  description: string;
  glyph: IconDef;
}> = [
  {
    kind: "video",
    name: "Untitled video",
    label: "Video project",
    description: "Cut and finish a single vertical video on the timeline.",
    glyph: IconVideo,
  },
  {
    kind: "slideshow",
    name: "Untitled slideshow",
    label: "Slideshow",
    description: "Build a swipeable set of slides and fan it into variations.",
    glyph: IconSlideshow,
  },
  {
    kind: "canvas",
    name: "Untitled canvas",
    label: "Canvas",
    description: "Wire generations together on a graph with references.",
    glyph: IconGraph,
  },
];

/** SPEC §8.8 — the first card in the grid, and the fastest route to work. */
export function NewProjectCard() {
  const queryClient = useQueryClient();
  const openProject = useOpenProject();
  const [open, setOpen] = React.useState(false);

  const create = useMutation({
    mutationFn: (kind: ProjectKind) => {
      const option = OPTIONS.find((candidate) => candidate.kind === kind);
      return createProject({ name: option?.name ?? "Untitled project", kind });
    },
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      setOpen(false);
      toast.success("Project created", { description: `${project.name} is open and ready.` });
      openProject(project);
    },
    onError: () => {
      toast.error("Couldn't create the project", {
        description: "Nothing was saved. Try again in a moment.",
      });
    },
  });

  return (
    <article className="flex min-w-0 flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={create.isPending}
          className={cn(
            "flex aspect-9/16 w-full flex-col items-center justify-center gap-3 rounded-md",
            "border border-dashed border-ink-300 bg-surface text-ink-500",
            "transition-ui duration-(--dur-fast)",
            "hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700",
            "active:bg-brand-100",
            "disabled:cursor-not-allowed disabled:border-ink-200 disabled:text-ink-300",
          )}
        >
          <span className="grid size-12 place-items-center rounded-pill bg-ink-100 text-ink-700">
            <Icon glyph={IconPlus} size={24} />
          </span>
          <span className="text-body-md font-medium">New project</span>
          <span className="text-body-sm max-w-measure px-4 text-center text-ink-400">
            Start from a blank timeline, slideshow or canvas
          </span>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-sheet p-2">
          <p className="eyebrow px-2 pb-2 text-ink-400">Start with</p>
          <ul className="flex flex-col">
            {OPTIONS.map((option) => (
              <li key={option.kind}>
                <button
                  type="button"
                  disabled={create.isPending}
                  onClick={() => create.mutate(option.kind)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-sm p-2 text-left",
                    "transition-ui duration-(--dur-instant) hover:bg-ink-100",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                >
                  <span className="mt-px grid size-8 shrink-0 place-items-center rounded-sm bg-ink-100 text-ink-700">
                    <Icon glyph={option.glyph} size={16} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-body-sm font-medium text-ink-950">{option.label}</span>
                    <span className="text-body-sm text-ink-500">{option.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-body-md truncate font-medium text-ink-950">New project</h2>
        <p className="text-body-sm text-ink-500">
          {create.isPending ? "Creating…" : "Or clone a link to start from something proven"}
        </p>
      </div>
    </article>
  );
}
