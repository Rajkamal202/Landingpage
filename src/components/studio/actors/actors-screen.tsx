"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { listActors, listLanguages, listStyles, type ActorFilter } from "@/lib/api/actors";
import { listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import { useSearchParamEnum, useSearchParamState } from "@/lib/hooks/use-search-param-state";
import type { Actor } from "@/lib/schemas";
import { IconSearch, IconTeam } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { AppPage } from "../app-page";
import { ANY, FilterSelect } from "../filter-select";
import { ActorCard, ActorCardSkeleton } from "./actor-card";
import { AGE_LABEL, AGE_VALUES, GENDER_LABEL, GENDER_VALUES } from "./labels";
import { useVoicePreview } from "./use-voice-preview";

/**
 * SPEC §8.3 — the AI actor browser. Every filter and the search term live in
 * search params, so "every androgynous voice that speaks Japanese" is a link.
 */
type Gender = Actor["genderPresentation"];
type Age = Actor["ageRange"];

const GENDER_OPTIONS = GENDER_VALUES.map((value) => ({ value, label: GENDER_LABEL[value] }));
const AGE_OPTIONS = AGE_VALUES.map((value) => ({ value, label: AGE_LABEL[value] }));

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function ActorsScreen() {
  const styles = React.useMemo(() => listStyles(), []);
  const languages = React.useMemo(() => listLanguages(), []);

  const [gender, setGender] = useSearchParamEnum<Gender | typeof ANY>(
    "gender",
    [ANY, ...GENDER_VALUES],
    ANY,
  );
  const [age, setAge] = useSearchParamEnum<Age | typeof ANY>("age", [ANY, ...AGE_VALUES], ANY);
  const [styleParam, setStyle] = useSearchParamState<string>("style", {
    defaultValue: ANY,
    serialize: (value) => (value === ANY ? null : value),
  });
  const [languageParam, setLanguage] = useSearchParamState<string>("language", {
    defaultValue: ANY,
    serialize: (value) => (value === ANY ? null : value),
  });
  const [query, setQuery] = useSearchParamState<string>("q", {
    defaultValue: "",
    serialize: (value) => (value.trim() ? value : null),
  });

  // An unknown value in the URL reads as no filter, so a stale link never
  // leaves a select showing an empty trigger.
  const style = styles.includes(styleParam) ? styleParam : ANY;
  const language = languages.includes(languageParam) ? languageParam : ANY;

  const filter = React.useMemo<ActorFilter>(
    () => ({
      ...(gender === ANY ? {} : { genderPresentation: gender }),
      ...(age === ANY ? {} : { ageRange: age }),
      ...(style === ANY ? {} : { style }),
      ...(language === ANY ? {} : { language }),
      ...(query.trim() ? { query: query.trim() } : {}),
    }),
    [gender, age, style, language, query],
  );

  const actors = useQuery({
    queryKey: [...queryKeys.actors.list, filter] as const,
    queryFn: () => listActors(filter),
  });

  const assets = useQuery({ queryKey: queryKeys.assets.list(), queryFn: () => listAssets() });

  const assetById = React.useMemo(
    () => new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
    [assets.data],
  );

  const voice = useVoicePreview();

  const items = actors.data ?? [];
  const filtered =
    gender !== ANY || age !== ANY || style !== ANY || language !== ANY || query.trim().length > 0;

  const clearFilters = () => {
    setGender(ANY);
    setAge(ANY);
    setStyle(ANY);
    setLanguage(ANY);
    setQuery("");
  };

  return (
    <AppPage
      title="AI actors"
      description="Presenters you can cast in a talking head, hear before you commit, and reuse across every variation."
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Input
            iconStart={IconSearch}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actors"
            aria-label="Search actors"
            containerClassName="min-w-0 flex-1 sm:max-w-panel"
          />
          <FilterSelect
            label="Filter by gender presentation"
            anyLabel="Any presentation"
            value={gender}
            onValueChange={setGender}
            options={GENDER_OPTIONS}
            className="w-32"
          />
          <FilterSelect
            label="Filter by age range"
            anyLabel="Any age"
            value={age}
            onValueChange={setAge}
            options={AGE_OPTIONS}
            className="w-32"
          />
          <FilterSelect
            label="Filter by style"
            anyLabel="Any style"
            value={style}
            onValueChange={setStyle}
            options={styles.map((name) => ({ value: name, label: name }))}
            className="w-32"
          />
          <FilterSelect
            label="Filter by language"
            anyLabel="Any language"
            value={language}
            onValueChange={setLanguage}
            options={languages.map((name) => ({ value: name, label: name }))}
            className="w-32"
          />
        </div>
      }
    >
      {actors.isPending ? (
        <ul className={GRID}>
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index}>
              <ActorCardSkeleton />
            </li>
          ))}
        </ul>
      ) : actors.isError ? (
        <EmptyState
          glyph={IconTeam}
          title="The actor library didn't load"
          description="The request came back empty-handed. Reload to see every presenter again."
          action={
            <Button variant="primary" onClick={() => void actors.refetch()}>
              Reload actors
            </Button>
          }
        />
      ) : items.length === 0 && filtered ? (
        <EmptyState
          glyph={IconSearch}
          title="No actor matches those filters"
          description="Nobody here is that presentation, age, style and language all at once. Loosen one to see more."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          size="lg"
          glyph={IconTeam}
          title="No actors available yet"
          description="Actors arrive with every release. In the meantime you can record a voice of your own and drop it into the timeline."
          action={<ButtonLink href="/app/library">Open your library</ButtonLink>}
        />
      ) : (
        <ul className={GRID}>
          {items.map((actor) => (
            <li key={actor.id}>
              <ActorCard
                actor={actor}
                portrait={assetById.get(actor.portraitAssetId)}
                voice={assetById.get(actor.voiceAssetId)}
                playing={voice.playingId === actor.id}
                progress={voice.progress}
                onTogglePlay={() => {
                  const sample = assetById.get(actor.voiceAssetId);
                  if (sample) voice.toggle(actor.id, sample.src);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
