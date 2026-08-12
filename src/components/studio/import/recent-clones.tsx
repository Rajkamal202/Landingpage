"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { listRecentClones } from "@/lib/api/clone";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { PLATFORM_LABEL } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconChevronRight, IconLink, IconRetry } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEdited } from "../time";
import { useOpenProject } from "../use-open-project";

/** SPEC §8.1 — the `Recent clones` list under the input. */
export function RecentClones({
  onReuse,
  onFocusInput,
}: {
  onReuse: (url: string) => void;
  onFocusInput: () => void;
}) {
  const openProject = useOpenProject();

  const recent = useQuery({
    queryKey: queryKeys.clone.recent,
    queryFn: listRecentClones,
  });
  const projects = useQuery({ queryKey: queryKeys.projects.list(), queryFn: () => listProjects() });

  const nameFor = (projectId: string) =>
    projects.data?.find((project) => project.id === projectId);

  if (recent.isPending) {
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 rounded-md border border-ink-200 bg-surface p-3">
            <Skeleton className="h-12 w-8 rounded-sm" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-4 w-16" />
          </li>
        ))}
      </ul>
    );
  }

  if (!recent.data || recent.data.length === 0) {
    return (
      <EmptyState
        size="sm"
        glyph={IconLink}
        title="No clones yet"
        description="Paste a link to a post that's performing and it will show up here."
        action={
          <Button variant="secondary" size="sm" onClick={onFocusInput}>
            Paste a link
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {recent.data.map((clone) => {
        const project = nameFor(clone.projectId);
        return (
          <li key={clone.id}>
            <div
              className={cn(
                "group flex items-center gap-3 rounded-md border border-ink-200 bg-surface p-2 pr-3",
                "transition-ui duration-(--dur-fast) hover:border-ink-300 hover:shadow-elev-1",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  openProject({
                    id: clone.projectId,
                    name: project?.name ?? `${clone.handle} clone`,
                    kind: project?.kind ?? "video",
                  })
                }
                className="flex min-w-0 flex-1 items-center gap-3 rounded-sm text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={clone.posterUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-8 shrink-0 rounded-sm object-cover"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-body-sm truncate font-medium text-ink-950">
                    {project?.name ?? clone.handle}
                  </span>
                  <span className="mono-sm truncate text-ink-400">
                    {clone.sceneCount} scenes · {formatEdited(clone.createdAt)}
                  </span>
                </span>
                <Badge tone="neutral" className="hidden sm:inline-flex">
                  {PLATFORM_LABEL[clone.platform]}
                </Badge>
                <Icon
                  glyph={IconChevronRight}
                  size={16}
                  className="shrink-0 text-ink-300 group-hover:text-ink-500"
                />
              </button>

              <IconButton
                label={`Clone ${clone.handle} again`}
                glyph={IconRetry}
                size="sm"
                onClick={() => onReuse(clone.sourceUrl)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
