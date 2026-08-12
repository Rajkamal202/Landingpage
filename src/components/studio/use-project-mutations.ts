"use client";

import * as React from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { deleteProject, duplicateProject, renameProject } from "@/lib/api/projects";
import type { Project } from "@/lib/schemas";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import { toast } from "@/components/ui/toast";

type Snapshot = ReadonlyArray<[QueryKey, Project[] | undefined]>;

/**
 * SPEC §13: "Optimistic updates where a mutation's outcome is predictable."
 * Rename, duplicate and delete all are, so the grid reacts on the click and
 * rolls back with a named error if the call fails.
 *
 * Every cached project list is patched, not just the one currently rendered —
 * the workspace list, a filtered view and a search result are three cache
 * entries, and updating one leaves the other two lying.
 */
function useProjectListPatch() {
  const queryClient = useQueryClient();

  const patch = React.useCallback(
    (update: (list: Project[]) => Project[]): Snapshot => {
      const snapshot = queryClient.getQueriesData<Project[]>({
        queryKey: queryKeys.projects.all,
      });
      queryClient.setQueriesData<Project[]>({ queryKey: queryKeys.projects.all }, (old) =>
        Array.isArray(old) ? update(old) : old,
      );
      return snapshot;
    },
    [queryClient],
  );

  const restore = React.useCallback(
    (snapshot: Snapshot | undefined) => {
      if (!snapshot) return;
      for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
    },
    [queryClient],
  );

  const settle = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  }, [queryClient]);

  return { patch, restore, settle };
}

export function useProjectMutations() {
  const { patch, restore, settle } = useProjectListPatch();
  const renameTab = useWorkspaceStore((state) => state.renameTab);
  const closeTab = useWorkspaceStore((state) => state.closeTab);

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProject(id, name),
    onMutate: ({ id, name }) => {
      renameTab(id, name);
      return {
        snapshot: patch((list) =>
          list.map((project) => (project.id === id ? { ...project, name } : project)),
        ),
      };
    },
    onError: (_error, variables, context) => {
      restore(context?.snapshot);
      toast.error("That name didn't save", {
        description: `${variables.name} was put back to its previous name. Try renaming it again.`,
      });
    },
    onSuccess: (project) => {
      toast.success("Project renamed", { description: `It's now called ${project.name}.` });
    },
    onSettled: settle,
  });

  const duplicate = useMutation({
    mutationFn: (project: Project) => duplicateProject(project.id),
    onMutate: (project) => {
      const copy: Project = {
        ...project,
        id: `pending-copy-${project.id}`,
        name: `${project.name} copy`,
        updatedAt: new Date().toISOString(),
      };
      return { snapshot: patch((list) => [copy, ...list]) };
    },
    onError: (_error, project, context) => {
      restore(context?.snapshot);
      toast.error("Couldn't duplicate that project", {
        description: `${project.name} is unchanged. Try again in a moment.`,
      });
    },
    onSuccess: (copy) => {
      toast.success("Project duplicated", { description: `${copy.name} is ready to edit.` });
    },
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: (project: Project) => deleteProject(project.id),
    onMutate: (project) => {
      closeTab(project.id);
      return { snapshot: patch((list) => list.filter((item) => item.id !== project.id)) };
    },
    onError: (_error, project, context) => {
      restore(context?.snapshot);
      toast.error("Couldn't delete that project", {
        description: `${project.name} is still here. Try again in a moment.`,
      });
    },
    onSuccess: (_data, project) => {
      toast.success("Project deleted", { description: `${project.name} and its variations are gone.` });
    },
    onSettled: settle,
  });

  return { rename, duplicate, remove };
}
