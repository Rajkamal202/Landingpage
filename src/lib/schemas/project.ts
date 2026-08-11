import { z } from "zod";
import { zAspectRatio, zId, zPlatform, zTimestamp } from "./common";

/** The three editor surfaces a project can open into. */
export const zProjectKind = z.enum(["video", "slideshow", "canvas"]);
export type ProjectKind = z.infer<typeof zProjectKind>;

export const PROJECT_KIND_LABEL: Record<ProjectKind, string> = {
  video: "Video",
  slideshow: "Slideshow",
  canvas: "Canvas",
};

export const zProject = z.object({
  id: zId,
  name: z.string(),
  kind: zProjectKind,
  thumbnailAssetId: zId.nullable(),
  aspect: zAspectRatio,
  durationMs: z.number().int().nonnegative(),
  /** Set when the project came from the clone flow. */
  clonedFrom: z
    .object({ platform: zPlatform, url: z.string(), handle: z.string() })
    .nullable(),
  variationCount: z.number().int().nonnegative(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp,
});
export type Project = z.infer<typeof zProject>;

export const zProjectFilter = z.object({
  kind: zProjectKind.optional(),
  query: z.string().optional(),
  sort: z.enum(["recent", "name"]).default("recent"),
});
export type ProjectFilter = z.infer<typeof zProjectFilter>;

/** An open editor tab. SPEC §7.1 — tabs are the navigation model. */
export const zWorkspaceTab = z.object({
  projectId: zId,
  name: z.string(),
  kind: zProjectKind,
  surface: z.enum(["studio", "timeline", "slideshow", "canvas", "bulk"]),
});
export type WorkspaceTab = z.infer<typeof zWorkspaceTab>;
