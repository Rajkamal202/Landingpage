"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Actor, Asset, BulkColumnKind } from "@/lib/schemas";
import { queryKeys } from "@/lib/api/keys";
import { listAssets } from "@/lib/api/assets";
import { listActors } from "@/lib/api/actors";
import { formatDurationShort } from "@/lib/format";

/**
 * Everything the grid's cells need to turn a stored id into something a person
 * recognises — an actor's name, a product still, a music bed.
 *
 * It is fetched once at the top of the screen and read through context. A
 * thousand rows each running their own query would be a thousand requests and
 * a thousand loading states for sixty assets.
 */
export interface CellOption {
  value: string;
  label: string;
  hint?: string;
}

export interface BulkCatalog {
  assetsById: ReadonlyMap<string, Asset>;
  actorsById: ReadonlyMap<string, Actor>;
  actorOptions: readonly CellOption[];
  voiceOptions: readonly CellOption[];
  musicOptions: readonly CellOption[];
  ready: boolean;
}

const EMPTY_CATALOG: BulkCatalog = {
  assetsById: new Map(),
  actorsById: new Map(),
  actorOptions: [],
  voiceOptions: [],
  musicOptions: [],
  ready: false,
};

const CatalogContext = React.createContext<BulkCatalog>(EMPTY_CATALOG);

export function BulkCatalogProvider({ children }: { children: React.ReactNode }) {
  const assets = useQuery({
    queryKey: queryKeys.assets.list({ sort: "recent" }),
    queryFn: () => listAssets({ sort: "recent" }),
  });
  const actors = useQuery({ queryKey: queryKeys.actors.list, queryFn: () => listActors() });

  const value = React.useMemo<BulkCatalog>(() => {
    const assetList = assets.data ?? [];
    const actorList = actors.data ?? [];

    return {
      assetsById: new Map(assetList.map((asset) => [asset.id, asset])),
      actorsById: new Map(actorList.map((actor) => [actor.id, actor])),
      actorOptions: actorList.map((actor) => ({
        value: actor.id,
        label: actor.name,
        hint: actor.languages[0] ?? "",
      })),
      // Voices are stored by name, the way the source template names them, so
      // a sheet exported from here still reads as a sheet.
      voiceOptions: [...new Set(actorList.map((actor) => actor.voiceName))].map((voice) => ({
        value: voice,
        label: voice,
      })),
      musicOptions: assetList
        .filter((asset) => asset.kind === "audio")
        .map((asset) => ({
          value: asset.name,
          label: asset.name,
          hint: formatDurationShort(asset.durationMs),
        })),
      ready: assets.isSuccess && actors.isSuccess,
    };
  }, [assets.data, actors.data, assets.isSuccess, actors.isSuccess]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useBulkCatalog(): BulkCatalog {
  return React.useContext(CatalogContext);
}

export function optionsFor(kind: BulkColumnKind, catalog: BulkCatalog): readonly CellOption[] {
  if (kind === "actor") return catalog.actorOptions;
  if (kind === "voice") return catalog.voiceOptions;
  if (kind === "music") return catalog.musicOptions;
  return [];
}

/** The stored value rendered for a human — ids never reach the screen. */
export function displayValue(
  kind: BulkColumnKind,
  value: string,
  catalog: BulkCatalog,
): string {
  if (value === "") return "";
  if (kind === "actor") return catalog.actorsById.get(value)?.name ?? value;
  if (kind === "media") return catalog.assetsById.get(value)?.name ?? value;
  return value;
}

/**
 * The inverse, for paste and CSV import.
 *
 * Copy writes names, because a column of `asset-17` pasted into a spreadsheet
 * is worthless to the person reading it. So paste has to accept names back —
 * both from our own clipboard and from a sheet somebody typed by hand — and
 * turn them into the ids the document stores. An unrecognised name is kept
 * verbatim rather than dropped, so nothing a user pasted silently disappears.
 */
export function resolveValue(
  kind: BulkColumnKind,
  raw: string,
  catalog: BulkCatalog,
): string {
  const value = raw.trim();
  if (value === "") return "";
  if (kind === "actor") {
    if (catalog.actorsById.has(value)) return value;
    const needle = value.toLowerCase();
    for (const actor of catalog.actorsById.values()) {
      if (actor.name.toLowerCase() === needle) return actor.id;
    }
    return value;
  }
  if (kind === "media") {
    if (catalog.assetsById.has(value)) return value;
    const needle = value.toLowerCase();
    for (const asset of catalog.assetsById.values()) {
      if (asset.name.toLowerCase() === needle) return asset.id;
    }
    return value;
  }
  return value;
}
