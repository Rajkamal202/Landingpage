import type { Actor } from "@/lib/schemas";
import { ACTORS } from "@/lib/fixtures/catalog";
import { ApiError, clone, delay, maybeFail } from "./client";

export interface ActorFilter {
  genderPresentation?: Actor["genderPresentation"];
  ageRange?: Actor["ageRange"];
  style?: string;
  language?: string;
  query?: string;
}

export async function listActors(filter?: ActorFilter): Promise<Actor[]> {
  await delay(120, 300);
  maybeFail("Loading actors");

  let result = [...ACTORS];
  if (filter?.genderPresentation) {
    result = result.filter((a) => a.genderPresentation === filter.genderPresentation);
  }
  if (filter?.ageRange) result = result.filter((a) => a.ageRange === filter.ageRange);
  if (filter?.style) result = result.filter((a) => a.styles.includes(filter.style ?? ""));
  if (filter?.language) result = result.filter((a) => a.languages.includes(filter.language ?? ""));
  if (filter?.query) {
    const needle = filter.query.trim().toLowerCase();
    result = result.filter(
      (a) =>
        a.name.toLowerCase().includes(needle) || a.description.toLowerCase().includes(needle),
    );
  }
  return clone(result);
}

export async function getActor(id: string): Promise<Actor> {
  await delay(60, 160);
  const actor = ACTORS.find((candidate) => candidate.id === id);
  if (!actor) {
    throw new ApiError("That actor is no longer available", {
      code: "not-found",
      fix: "Pick another from the actor library.",
    });
  }
  return clone(actor);
}

export function listStyles(): string[] {
  return [...new Set(ACTORS.flatMap((actor) => actor.styles))].sort();
}

export function listLanguages(): string[] {
  return [...new Set(ACTORS.flatMap((actor) => actor.languages))].sort();
}
