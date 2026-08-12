"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duplicateProject } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { formatTimecode } from "@/lib/format";
import { canRedo, canUndo, redoLabel, undoLabel } from "@/lib/stores/command-stack";
import { selectClipCount, useTimelineStore } from "@/lib/stores/timeline";
import { IconLink, IconRedo, IconUndo } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { ExportDialog } from "./export-dialog";
import { TOOLS } from "./tools";
import type { SaveStatus } from "./use-autosave";

/**
 * SPEC §8.5's top bar: tool cluster left, aspect and duration in the centre in
 * mono, the three project actions right with Export as the filled primary.
 *
 * The tools are a real `Toolbar`, so the whole cluster is one tab stop with
 * arrow-key travel between the eight controls inside it (SPEC §11).
 */
export interface TimelineToolbarProps {
  projectId: string;
  projectName: string;
  saveStatus: SaveStatus;
}

const SAVE_COPY: Record<SaveStatus, string> = {
  saved: "Saved",
  saving: "Saving…",
  unsaved: "Unsaved",
};

export function TimelineToolbar({ projectId, projectName, saveStatus }: TimelineToolbarProps) {
  const [exportOpen, setExportOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const tool = useTimelineStore((state) => state.tool);
  const setTool = useTimelineStore((state) => state.setTool);
  const aspect = useTimelineStore((state) => state.aspect);
  const durationMs = useTimelineStore((state) => state.durationMs);
  const fps = useTimelineStore((state) => state.fps);
  const trackCount = useTimelineStore((state) => state.trackOrder.length);
  const clipCount = useTimelineStore(selectClipCount);

  const undoable = useTimelineStore((state) => canUndo(state.history));
  const redoable = useTimelineStore((state) => canRedo(state.history));
  const nextUndo = useTimelineStore((state) => undoLabel(state.history));
  const nextRedo = useTimelineStore((state) => redoLabel(state.history));
  const undo = useTimelineStore((state) => state.undo);
  const redo = useTimelineStore((state) => state.redo);

  const variation = useMutation({
    mutationFn: () => duplicateProject(projectId),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success("Variation created", {
        description: `${project.name} is in your workspace, ready to change.`,
      });
    },
    onError: () =>
      toast.error("The variation didn't get created", {
        description: "Nothing changed in this cut. Try creating it again.",
      }),
  });

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Toolbar ariaLabel="Timeline tools">
          {TOOLS.map((definition) => (
            <Tooltip key={definition.id} content={definition.label}>
              <IconButton
                label={definition.label}
                glyph={definition.glyph}
                size="sm"
                variant={tool === definition.id ? "primary" : "ghost"}
                aria-pressed={tool === definition.id}
                onClick={() => setTool(definition.id)}
              />
            </Tooltip>
          ))}

          <ToolbarSeparator />

          <Tooltip content={nextUndo ? `Undo ${nextUndo.toLowerCase()}` : "Nothing to undo"}>
            <IconButton
              label="Undo"
              glyph={IconUndo}
              size="sm"
              disabled={!undoable}
              onClick={undo}
            />
          </Tooltip>
          <Tooltip content={nextRedo ? `Redo ${nextRedo.toLowerCase()}` : "Nothing to redo"}>
            <IconButton
              label="Redo"
              glyph={IconRedo}
              size="sm"
              disabled={!redoable}
              onClick={redo}
            />
          </Tooltip>
        </Toolbar>
      </div>

      <p className="mono-sm shrink-0 text-ink-700" data-numeric>
        <span className="text-ink-400">{aspect}</span>
        <span aria-hidden="true" className="px-2 text-ink-300">
          ·
        </span>
        <span aria-label={`Project length ${formatTimecode(durationMs, fps)}`}>
          {formatTimecode(durationMs, fps)}
        </span>
      </p>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className="text-body-sm hidden text-ink-400 xl:inline" aria-live="polite">
          {SAVE_COPY[saveStatus]}
        </span>
        <Button
          variant="secondary"
          size="sm"
          loading={variation.isPending}
          onClick={() => variation.mutate()}
        >
          Create variation
        </Button>
        <ButtonLink
          href={{ pathname: "/app/import", query: { from: projectName } }}
          variant="secondary"
          size="sm"
          iconStart={IconLink}
        >
          Clone video
        </ButtonLink>
        <Button variant="primary" size="sm" onClick={() => setExportOpen(true)}>
          Export
        </Button>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        aspect={aspect}
        durationMs={durationMs}
        fps={fps}
        clipCount={clipCount}
        trackCount={trackCount}
      />
    </>
  );
}
