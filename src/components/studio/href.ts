import type Link from "next/link";
import type { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * `typedRoutes` is on, so a route built at runtime — `/app/p/<id>/studio` —
 * cannot be proven to the compiler from a string concatenation. The path
 * shapes here are all real routes in SPEC §7.2; this is the single place the
 * assertion lives rather than one cast per call site.
 */
export type AppHref = ComponentProps<typeof Link>["href"];

export function appHref(path: string): AppHref {
  return path as AppHref;
}

type RouterHref = Parameters<ReturnType<typeof useRouter>["push"]>[0];

export function pushHref(path: string): RouterHref {
  return path as RouterHref;
}

export type ProjectSurface = "studio" | "timeline" | "slideshow" | "canvas" | "bulk";

export function projectPath(projectId: string, surface: ProjectSurface, query = ""): string {
  return `/app/p/${projectId}/${surface}${query}`;
}
