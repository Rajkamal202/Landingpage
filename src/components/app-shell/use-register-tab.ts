"use client";

import * as React from "react";
import type { Project } from "@/lib/schemas";
import { useWorkspaceStore, type EditorSurface } from "@/lib/stores/workspace";

/**
 * Opens the workspace tab for the project a screen is showing.
 *
 * SPEC §7.1 makes tabs the primary navigation model, which means the strip has
 * to reflect what is actually open — including when a route is reached
 * directly, by a link, or by a reload. Three of the five editors had this as a
 * hand-written effect and two had nothing at all, so landing on the bulk editor
 * showed a project open under a tab strip reading "No open projects."
 *
 * One hook, used by every surface, so the behaviour cannot diverge again.
 */
export function useRegisterWorkspaceTab(
  project: Project | undefined,
  surface: EditorSurface,
): void {
  const openTab = useWorkspaceStore((state) => state.openTab);

  React.useEffect(() => {
    if (!project) return;
    openTab({
      projectId: project.id,
      name: project.name,
      kind: project.kind,
      surface,
    });
  }, [project, surface, openTab]);
}
