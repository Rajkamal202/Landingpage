import type { Template, TemplateCategory } from "@/lib/schemas";
import { TEMPLATES } from "@/lib/fixtures/catalog";
import { ApiError, clone, delay, maybeFail } from "./client";

export interface TemplateFilter {
  category?: TemplateCategory;
  aspect?: Template["aspect"];
  pacing?: Template["pacing"];
  industry?: string;
  query?: string;
}

export async function listTemplates(filter?: TemplateFilter): Promise<Template[]> {
  await delay(140, 320);
  maybeFail("Loading templates");

  let result = [...TEMPLATES];
  if (filter?.category) result = result.filter((t) => t.category === filter.category);
  if (filter?.aspect) result = result.filter((t) => t.aspect === filter.aspect);
  if (filter?.pacing) result = result.filter((t) => t.pacing === filter.pacing);
  if (filter?.industry) result = result.filter((t) => t.industry === filter.industry);
  if (filter?.query) {
    const needle = filter.query.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle),
    );
  }
  return clone(result);
}

export async function getTemplate(id: string): Promise<Template> {
  await delay(70, 180);
  const template = TEMPLATES.find((candidate) => candidate.id === id);
  if (!template) {
    throw new ApiError("That template isn't available any more", {
      code: "not-found",
      fix: "Browse the library for a similar format.",
    });
  }
  return clone(template);
}

export function listIndustries(): string[] {
  return [...new Set(TEMPLATES.map((template) => template.industry))].sort();
}
