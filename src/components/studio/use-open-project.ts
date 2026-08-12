"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/schemas";
import { SURFACE_FOR_KIND, useWorkspaceStore } from "@/lib/stores/workspace";
import { projectPath, pushHref, type ProjectSurface } from "./href";

/**
 * SPEC §7.1: projects are tabs. Opening one anywhere in the app registers the
 * tab first, so the shell's tab strip and the route never disagree about what
 * is open.
 */
export function useOpenProject() {
  const router = useRouter();
  const openTab = useWorkspaceStore((state) => state.openTab);

  return React.useCallback(
    (
      project: Pick<Project, "id" | "name" | "kind">,
      surface?: ProjectSurface,
      query = "",
    ) => {
      const target = surface ?? SURFACE_FOR_KIND[project.kind];
      openTab({
        projectId: project.id,
        name: project.name,
        kind: project.kind,
        surface: target,
      });
      router.push(pushHref(projectPath(project.id, target, query)));
    },
    [openTab, router],
  );
}
