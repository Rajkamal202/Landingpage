import type { Actor } from "@/lib/schemas";

type Gender = Actor["genderPresentation"];
type Age = Actor["ageRange"];

export const GENDER_VALUES = ["feminine", "masculine", "androgynous"] as const satisfies
  readonly Gender[];

export const GENDER_LABEL: Record<Gender, string> = {
  feminine: "Feminine",
  masculine: "Masculine",
  androgynous: "Androgynous",
};

export const AGE_VALUES = ["18-24", "25-34", "35-44", "45-plus"] as const satisfies readonly Age[];

/** The stored value is a range key; the label is how a person says it. */
export const AGE_LABEL: Record<Age, string> = {
  "18-24": "18 to 24",
  "25-34": "25 to 34",
  "35-44": "35 to 44",
  "45-plus": "45 and over",
};
