"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Asset, Project, ProjectKind } from "@/lib/schemas";
import { PLATFORM_LABEL, PROJECT_KIND_LABEL } from "@/lib/schemas";
import { formatDurationShort } from "@/lib/format";
import { Icon } from "@/components/icon";
import {
  IconCopy,
  IconDelete,
  IconEdit,
  IconGraph,
  IconMore,
  IconSlideshow,
  IconVideo,
  type IconDef,
} from "@/components/icons";
import { AssetThumb } from "@/components/ui/asset-thumb";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectSurface } from "./href";
import { formatEdited } from "./time";

const KIND_ICON: Record<ProjectKind, IconDef> = {
  video: IconVideo,
  slideshow: IconSlideshow,
  canvas: IconGraph,
};

/** Where each kind of project can be opened, best surface first. */
const SURFACES: Record<ProjectKind, readonly ProjectSurface[]> = {
  video: ["timeline", "studio", "bulk"],
  slideshow: ["slideshow", "studio", "bulk"],
  canvas: ["canvas", "studio", "bulk"],
};

const SURFACE_LABEL: Record<ProjectSurface, string> = {
  studio: "Generation studio",
  timeline: "Timeline editor",
  slideshow: "Slideshow editor",
  canvas: "Node canvas",
  bulk: "Bulk editor",
};

export interface ProjectCardProps {
  project: Project;
  thumbnail: Asset | undefined;
  onOpen: (surface?: ProjectSurface) => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProjectCard({
  project,
  thumbnail,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: ProjectCardProps) {
  // The thumbnail carries the project's name so its accessible label and its
  // drag payload describe what the user sees, not the clip behind it.
  const asset = React.useMemo<Asset | undefined>(
    () => (thumbnail ? { ...thumbnail, name: project.name } : undefined),
    [thumbnail, project.name],
  );

  return (
    <article className="group relative flex min-w-0 flex-col gap-3">
      {asset ? (
        <AssetThumb
          asset={asset}
          draggable={false}
          onActivate={() => onOpen()}
          className="aspect-9/16 w-full"
          badge={
            <span className="mono-sm glass inline-flex items-center gap-1 rounded-sm bg-ink-950/55 px-1 text-white">
              <Icon glyph={KIND_ICON[project.kind]} size={16} />
              {project.durationMs > 0 ? formatDurationShort(project.durationMs) : "Empty"}
            </span>
          }
        />
      ) : (
        <button
          type="button"
          onClick={() => onOpen()}
          className={cn(
            "flex aspect-9/16 w-full flex-col items-center justify-center gap-2 rounded-md",
            "border border-dashed border-ink-300 bg-ink-100 text-ink-400",
            "transition-ui duration-(--dur-fast) hover:border-ink-400 hover:bg-ink-200",
          )}
        >
          <Icon glyph={KIND_ICON[project.kind]} size={24} />
          <span className="text-body-sm px-3 text-center">Nothing rendered yet</span>
          <span className="sr-only">Open {project.name}</span>
        </button>
      )}

      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              label={`Actions for ${project.name}`}
              glyph={IconMore}
              size="sm"
              variant="overlay"
              className={cn(
                "opacity-0 transition-ui duration-(--dur-fast)",
                "group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
              )}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem glyph={IconEdit} onSelect={onRename}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem glyph={IconCopy} onSelect={onDuplicate}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger glyph={KIND_ICON[project.kind]}>
                Open in
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {SURFACES[project.kind].map((surface) => (
                  <DropdownMenuItem key={surface} onSelect={() => onOpen(surface)}>
                    {SURFACE_LABEL[surface]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem glyph={IconDelete} tone="danger" onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-body-md truncate font-medium text-ink-950">{project.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{PROJECT_KIND_LABEL[project.kind]}</Badge>
          {project.clonedFrom ? (
            <Badge tone="brand">{PLATFORM_LABEL[project.clonedFrom.platform]}</Badge>
          ) : null}
          <span className="text-body-sm truncate text-ink-500">
            Edited {formatEdited(project.updatedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-9/16 w-full rounded-md" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}
