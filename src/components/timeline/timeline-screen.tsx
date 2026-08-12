"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { getProject, getProjectDocument } from "@/lib/api/projects";
import { useTimelineStore } from "@/lib/stores/timeline";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import { EditorFrame } from "@/components/app-shell/editor-frame";
import { IconFilm } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewStage } from "./preview-stage";
import { PropertiesPanel } from "./properties-panel";
import { TimelineShortcuts } from "./timeline-shortcuts";
import { TimelineToolbar } from "./timeline-toolbar";
import { TrackArea } from "./track-area";

/**
 * SPEC §8.5 — the classic NLE layout: transport and tools on top, the 9:16
 * preview centred, the track area docked below, and the contextual property
 * panel on the right.
 *
 * The document loads once into the Zustand store; every child then reads it
 * through selectors. Passing it down as props instead would re-render every
 * clip on every playhead tick, which is exactly what stops a timeline scrubbing
 * at 60fps.
 */
export function TimelineScreen({ projectId }: { projectId: string }) {
  const project = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
  });

  const document = useQuery({
    queryKey: queryKeys.projects.document(projectId),
    queryFn: () => getProjectDocument(projectId),
  });

  const load = useTimelineStore((state) => state.load);
  const ready = useTimelineStore((state) => state.ready);
  const openTab = useWorkspaceStore((state) => state.openTab);

  const timeline = document.data?.timeline;
  React.useEffect(() => {
    if (timeline) load(timeline);
  }, [timeline, load]);

  // SPEC §7.1 — arriving at an editor directly opens its workspace tab, so the
  // tab strip always reflects what is actually open.
  React.useEffect(() => {
    const data = project.data;
    if (!data) return;
    openTab({
      projectId: data.id,
      name: data.name,
      kind: data.kind,
      surface: "timeline",
    });
  }, [project.data, openTab]);

  const projectName = project.data?.name ?? "Loading project";

  if (!ready || !project.data) return <TimelineSkeleton />;

  return (
    <EditorFrame
      surface="timeline"
      projectName={projectName}
      glyph={IconFilm}
      availableOnMobile="You can still review this project, rename it, and start new generations from the studio on a phone."
      toolbar={
        <TimelineToolbar
          projectId={projectId}
          projectName={projectName}
          saveStatus={document.isFetching ? "saving" : "saved"}
        />
      }
      panel={<PropertiesPanel />}
      footer={<TrackArea />}
    >
      <TimelineShortcuts />
      <PreviewStage />
    </EditorFrame>
  );
}

function TimelineSkeleton() {
  // SPEC §13: skeletons, not spinners. The shape matches the real layout so
  // nothing jumps when the document arrives.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-topbar shrink-0 items-center gap-3 border-b border-ink-200 bg-surface px-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid flex-1 place-items-center bg-ink-100 p-8">
            <Skeleton className="aspect-9/16 h-full max-h-96 rounded-lg" />
          </div>
          <div className="flex h-64 shrink-0 flex-col gap-2 border-t border-ink-200 bg-surface p-3">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="hidden w-panel shrink-0 flex-col gap-3 border-l border-ink-200 bg-surface p-3 lg:flex">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
