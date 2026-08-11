"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/api/keys";
import { getTokenBalance, getUsage } from "@/lib/api/billing";
import { referenceTime } from "@/lib/api/client";
import { createProject } from "@/lib/api/projects";
import { SURFACE_FOR_KIND, useWorkspaceStore } from "@/lib/stores/workspace";
import type { ProjectKind } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import {
  IconChevronLeft,
  IconGraph,
  IconPanelRight,
  IconPlus,
  IconSlideshow,
  IconVideo,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TokenMeter } from "@/components/ui/token-meter";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { WorkspaceTabs } from "./workspace-tabs";

/** SPEC §7.1 — 56px, fixed. */
export function TopBar() {
  const setLibraryOpen = useWorkspaceStore((state) => state.setLibraryOpen);
  const libraryOpen = useWorkspaceStore((state) => state.libraryOpen);

  const balance = useQuery({
    queryKey: queryKeys.billing.balance,
    queryFn: getTokenBalance,
  });
  const usage = useQuery({ queryKey: queryKeys.billing.usage, queryFn: getUsage });

  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-nav) flex h-topbar shrink-0 items-center gap-3",
        "border-b border-ink-200 bg-surface px-3",
      )}
    >
      <Tooltip content="All projects">
        <Link
          href="/app"
          aria-label="All projects"
          className={cn(
            "grid size-control-md shrink-0 place-items-center rounded-md text-ink-500",
            "transition-ui duration-(--dur-instant) hover:bg-ink-100 hover:text-ink-950",
          )}
        >
          <Icon glyph={IconChevronLeft} size={20} />
        </Link>
      </Tooltip>

      <ScrollArea orientation="horizontal" fadeEdges className="min-w-0 flex-1">
        <div className="flex items-center gap-1 px-2 py-1">
          <WorkspaceTabs />
          <NewProjectButton />
        </div>
      </ScrollArea>

      <div className="flex shrink-0 items-center gap-1">
        {/* The label collapses below `sm`; the icon and the accessible name
            both stay, so the control never becomes ambiguous. */}
        <Button
          variant="ghost"
          size="sm"
          iconStart={IconPanelRight}
          aria-label="Library"
          aria-expanded={libraryOpen}
          onClick={() => setLibraryOpen(!libraryOpen)}
          className="px-2 sm:px-3"
        >
          <span className="hidden sm:inline">Library</span>
        </Button>
        <TokenMeter
          balance={balance.data}
          usage={usage.data}
          now={referenceTime()}
          onTopUp={() =>
            toast.success("Tokens added", {
              description: "5,000 tokens are available on your account.",
            })
          }
        />
      </div>
    </header>
  );
}

const NEW_PROJECT_OPTIONS: ReadonlyArray<{
  kind: ProjectKind;
  label: string;
  description: string;
  glyph: typeof IconVideo;
}> = [
  {
    kind: "video",
    label: "Video project",
    description: "Cut and finish a single vertical video on the timeline.",
    glyph: IconVideo,
  },
  {
    kind: "slideshow",
    label: "Slideshow",
    description: "Build a swipeable set of slides and fan it into variations.",
    glyph: IconSlideshow,
  },
  {
    kind: "canvas",
    label: "Canvas",
    description: "Wire generations together on a graph with references.",
    glyph: IconGraph,
  },
];

function NewProjectButton() {
  const router = useRouter();
  const openTab = useWorkspaceStore((state) => state.openTab);
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<ProjectKind | null>(null);

  const create = async (kind: ProjectKind) => {
    setPending(kind);
    try {
      const project = await createProject({ name: "Untitled project", kind });
      const surface = SURFACE_FOR_KIND[kind];
      openTab({
        projectId: project.id,
        name: project.name,
        kind: project.kind,
        surface,
      });
      setOpen(false);
      router.push(`/app/p/${project.id}/${surface}` as Parameters<typeof router.push>[0]);
    } catch {
      toast.error("Couldn't create the project", {
        description: "Nothing was saved. Try again in a moment.",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton label="New project" glyph={IconPlus} size="sm" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-sheet p-2">
        <p className="eyebrow px-2 pb-2 text-ink-400">New project</p>
        <ul className="flex flex-col">
          {NEW_PROJECT_OPTIONS.map((option) => (
            <li key={option.kind}>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void create(option.kind)}
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
  );
}
