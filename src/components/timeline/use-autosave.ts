"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { saveProjectDocument } from "@/lib/api/projects";
import type { TimelineDoc } from "@/lib/schemas";
import { selectTimelineDoc, useTimelineStore } from "@/lib/stores/timeline";
import { toast } from "@/components/ui/toast";

export type SaveStatus = "saved" | "saving" | "unsaved";

/**
 * Edits settle, then save. The document is re-nested from the normalised store
 * only at the moment it is sent, so nothing on the editing path pays for the
 * shape the API wants.
 */
const SETTLE_MS = 900;

export function useTimelineAutosave(projectId: string): SaveStatus {
  const dirty = useTimelineStore((state) => state.dirty);

  const mutation = useMutation({
    mutationFn: (document: TimelineDoc) =>
      saveProjectDocument(projectId, { timeline: document }),
    onSuccess: () => useTimelineStore.getState().markSaved(),
    onError: () =>
      toast.error("This cut didn't save", {
        description: "Your edits are still here. Make one more change to try again.",
      }),
  });

  const save = React.useRef(mutation.mutate);
  save.current = mutation.mutate;

  React.useEffect(() => {
    if (!dirty || projectId === "") return;
    const timer = setTimeout(() => {
      save.current(selectTimelineDoc(useTimelineStore.getState()));
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [dirty, projectId]);

  if (!dirty) return "saved";
  return mutation.isPending ? "saving" : "unsaved";
}
