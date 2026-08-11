import type { AssetFilter, ProjectFilter } from "@/lib/schemas";

/**
 * One registry for every TanStack Query key. Six people writing six screens
 * will otherwise all reach for `["assets"]` and quietly invalidate each other.
 */
export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    list: (filter?: ProjectFilter) => ["projects", "list", filter ?? null] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
    document: (id: string) => ["projects", "document", id] as const,
  },
  assets: {
    all: ["assets"] as const,
    list: (filter?: AssetFilter) => ["assets", "list", filter ?? null] as const,
    detail: (id: string) => ["assets", "detail", id] as const,
    brandKit: ["assets", "brand-kit"] as const,
  },
  generations: {
    all: ["generations"] as const,
    list: (projectId: string) => ["generations", "list", projectId] as const,
    detail: (id: string) => ["generations", "detail", id] as const,
  },
  templates: {
    all: ["templates"] as const,
    list: ["templates", "list"] as const,
    detail: (id: string) => ["templates", "detail", id] as const,
  },
  actors: {
    all: ["actors"] as const,
    list: ["actors", "list"] as const,
    detail: (id: string) => ["actors", "detail", id] as const,
  },
  models: {
    list: ["models", "list"] as const,
  },
  billing: {
    plans: ["billing", "plans"] as const,
    balance: ["billing", "balance"] as const,
    usage: ["billing", "usage"] as const,
    account: ["billing", "account"] as const,
    team: ["billing", "team"] as const,
  },
  clone: {
    recent: ["clone", "recent"] as const,
    result: (id: string) => ["clone", "result", id] as const,
  },
} as const;
