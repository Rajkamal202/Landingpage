"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import { listProjects } from "@/lib/api/projects";
import { useSearchParamEnum, useSearchParamState } from "@/lib/hooks/use-search-param-state";
import type { Project, ProjectFilter, ProjectKind } from "@/lib/schemas";
import { IconGrid, IconSearch } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { AppPage } from "./app-page";
import { ConfirmDialog } from "./confirm-dialog";
import { ANY, FilterSelect } from "./filter-select";
import { NewProjectCard } from "./new-project-card";
import { ProjectCard, ProjectCardSkeleton } from "./project-card";
import { RenameDialog } from "./rename-dialog";
import { useOpenProject } from "./use-open-project";
import { useProjectMutations } from "./use-project-mutations";
import type { ProjectSurface } from "./href";

const KIND_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "slideshow", label: "Slideshow" },
  { value: "canvas", label: "Canvas" },
] as const;

const SORT_OPTIONS = [
  { value: "recent", label: "Recently edited" },
  { value: "name", label: "Name, A to Z" },
] as const;

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** SPEC §8.8 — the workspace grid. */
export function WorkspaceScreen() {
  const [kind, setKind] = useSearchParamEnum(
    "type",
    [ANY, "video", "slideshow", "canvas"] as const,
    ANY,
  );
  const [sort, setSort] = useSearchParamEnum("sort", ["recent", "name"] as const, "recent");
  const [query, setQuery] = useSearchParamState<string>("q", {
    defaultValue: "",
    serialize: (value) => (value.trim() ? value : null),
  });

  const [renaming, setRenaming] = React.useState<Project | null>(null);
  const [deleting, setDeleting] = React.useState<Project | null>(null);

  const openProject = useOpenProject();
  const { rename, duplicate, remove } = useProjectMutations();

  const filter = React.useMemo<ProjectFilter>(
    () => ({
      ...(kind === ANY ? {} : { kind: kind as ProjectKind }),
      ...(query.trim() ? { query: query.trim() } : {}),
      sort,
    }),
    [kind, query, sort],
  );

  const projects = useQuery({
    queryKey: queryKeys.projects.list(filter),
    queryFn: () => listProjects(filter),
  });

  const assets = useQuery({ queryKey: queryKeys.assets.list(), queryFn: () => listAssets() });

  const assetById = React.useMemo(
    () => new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
    [assets.data],
  );

  const filtered = kind !== ANY || query.trim().length > 0;
  const items = projects.data ?? [];

  return (
    <AppPage
      title="Projects"
      description="Everything you have in flight. Open one in the editor it was built for."
      actions={<ButtonLink href="/app/import">Clone a video</ButtonLink>}
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Input
            iconStart={IconSearch}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            containerClassName="min-w-0 flex-1 sm:max-w-panel"
          />
          <FilterSelect
            label="Filter by type"
            anyLabel="All types"
            value={kind}
            onValueChange={setKind}
            options={KIND_OPTIONS}
            className="w-32"
          />
          <FilterSelect
            label="Sort projects"
            anyLabel="Recently edited"
            value={sort}
            onValueChange={setSort}
            options={SORT_OPTIONS.filter((option) => option.value !== "recent")}
            className="w-32"
          />
        </div>
      }
    >
      {projects.isPending ? (
        <ul className={GRID}>
          {Array.from({ length: 10 }, (_, index) => (
            <li key={index}>
              <ProjectCardSkeleton />
            </li>
          ))}
        </ul>
      ) : projects.isError ? (
        <EmptyState
          glyph={IconGrid}
          title="Your projects didn't load"
          description="The workspace request came back empty-handed. Reload to try again."
          action={
            <Button variant="primary" onClick={() => void projects.refetch()}>
              Reload projects
            </Button>
          }
        />
      ) : items.length === 0 && filtered ? (
        <EmptyState
          glyph={IconSearch}
          title="Nothing matches those filters"
          description="No project here is that type, or has that word in its name."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setKind(ANY);
                setQuery("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          size="lg"
          glyph={IconGrid}
          title="No projects yet"
          description="Paste a link to a video that already works and Vireo rebuilds it as scenes, text layers and captions you can edit."
          action={<ButtonLink href="/app/import">Clone a video</ButtonLink>}
          secondaryAction={
            <ButtonLink href="/app/templates" variant="secondary">
              Browse templates
            </ButtonLink>
          }
        />
      ) : (
        <ul className={GRID}>
          <li>
            <NewProjectCard />
          </li>
          {items.map((project) => (
            <li key={project.id}>
              <ProjectCard
                project={project}
                thumbnail={
                  project.thumbnailAssetId ? assetById.get(project.thumbnailAssetId) : undefined
                }
                onOpen={(surface?: ProjectSurface) => openProject(project, surface)}
                onRename={() => setRenaming(project)}
                onDuplicate={() => duplicate.mutate(project)}
                onDelete={() => setDeleting(project)}
              />
            </li>
          ))}
        </ul>
      )}

      <RenameDialog
        open={renaming !== null}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
        title="Rename project"
        description="This is the name you'll see in the tab strip and the workspace grid."
        label="Project name"
        initialValue={renaming?.name ?? ""}
        onRename={(name) => {
          if (renaming) rename.mutate({ id: renaming.id, name });
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? "this project"}?`}
        description="The project, its variations and its edit history go with it. Generated clips stay in your library."
        confirmLabel="Delete project"
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting);
          setDeleting(null);
        }}
      />
    </AppPage>
  );
}
