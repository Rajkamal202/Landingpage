import type { Project, ProjectDocument, ProjectFilter, ProjectKind } from "@/lib/schemas";
import { PROJECTS } from "@/lib/fixtures/projects";
import { documentFor } from "@/lib/fixtures/documents";
import { ApiError, clone, delay, maybeFail } from "./client";

/** In-session mutable store. A refresh resets it; the spec scopes us to that. */
let projects: Project[] = clone([...PROJECTS]);

export async function listProjects(filter?: ProjectFilter): Promise<Project[]> {
  await delay(120, 320);
  maybeFail("Loading projects");

  let result = [...projects];
  if (filter?.kind) result = result.filter((project) => project.kind === filter.kind);
  if (filter?.query) {
    const needle = filter.query.trim().toLowerCase();
    result = result.filter((project) => project.name.toLowerCase().includes(needle));
  }
  result.sort((a, b) =>
    filter?.sort === "name"
      ? a.name.localeCompare(b.name)
      : Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return clone(result);
}

export async function getProject(id: string): Promise<Project> {
  await delay(80, 200);
  const project = projects.find((candidate) => candidate.id === id);
  if (!project) {
    throw new ApiError("That project no longer exists", {
      code: "not-found",
      fix: "It may have been deleted. Head back to the workspace to pick another.",
    });
  }
  return clone(project);
}

export async function createProject(input: {
  name: string;
  kind: ProjectKind;
}): Promise<Project> {
  await delay(200, 420);
  maybeFail("Creating the project");

  const now = new Date().toISOString();
  const project: Project = {
    id: `proj-${Math.random().toString(36).slice(2, 9)}`,
    name: input.name,
    kind: input.kind,
    thumbnailAssetId: null,
    aspect: "9:16",
    durationMs: 0,
    clonedFrom: null,
    variationCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  projects = [project, ...projects];
  return clone(project);
}

export async function renameProject(id: string, name: string): Promise<Project> {
  await delay(90, 200);
  const project = projects.find((candidate) => candidate.id === id);
  if (!project) throw new ApiError("That project no longer exists");
  project.name = name;
  project.updatedAt = new Date().toISOString();
  return clone(project);
}

export async function duplicateProject(id: string): Promise<Project> {
  await delay(240, 480);
  const source = projects.find((candidate) => candidate.id === id);
  if (!source) throw new ApiError("That project no longer exists");
  const copy: Project = {
    ...clone(source),
    id: `proj-${Math.random().toString(36).slice(2, 9)}`,
    name: `${source.name} copy`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects = [copy, ...projects];
  return clone(copy);
}

export async function deleteProject(id: string): Promise<void> {
  await delay(140, 300);
  projects = projects.filter((project) => project.id !== id);
}

export async function getProjectDocument(projectId: string): Promise<ProjectDocument> {
  await delay(180, 380);
  maybeFail("Opening the project");
  return clone(documentFor(projectId));
}

export async function saveProjectDocument(
  projectId: string,
  _document: Partial<ProjectDocument>,
): Promise<void> {
  await delay(120, 260);
  const project = projects.find((candidate) => candidate.id === projectId);
  if (project) project.updatedAt = new Date().toISOString();
}
