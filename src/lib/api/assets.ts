import type { Asset, AssetFilter, BrandKit } from "@/lib/schemas";
import { ASSETS } from "@/lib/fixtures/assets";
import { BRAND_KIT } from "@/lib/fixtures/catalog";
import { ApiError, clone, delay, maybeFail, ticker } from "./client";

let assets: Asset[] = clone([...ASSETS]);
let brandKit: BrandKit = clone(BRAND_KIT);

export async function listAssets(filter?: AssetFilter): Promise<Asset[]> {
  await delay(120, 300);
  maybeFail("Loading the library");

  let result = [...assets];
  if (filter?.kind) result = result.filter((asset) => asset.kind === filter.kind);
  if (filter?.source) result = result.filter((asset) => asset.source === filter.source);
  if (filter?.favoriteOnly) result = result.filter((asset) => asset.favorite);
  if (filter?.query) {
    const needle = filter.query.trim().toLowerCase();
    result = result.filter(
      (asset) =>
        asset.name.toLowerCase().includes(needle) ||
        asset.tags.some((tag) => tag.includes(needle)),
    );
  }

  const sort = filter?.sort ?? "recent";
  result.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "duration") return b.durationMs - a.durationMs;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
  return clone(result);
}

export async function getAsset(id: string): Promise<Asset> {
  await delay(60, 160);
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) {
    throw new ApiError("That asset isn't in your library any more", {
      code: "not-found",
      fix: "Pick another from the library, or upload it again.",
    });
  }
  return clone(asset);
}

/** Batch lookup — grids resolve dozens of ids and should not fire dozens of calls. */
export async function getAssetsByIds(ids: readonly string[]): Promise<Asset[]> {
  await delay(60, 140);
  const wanted = new Set(ids);
  return clone(assets.filter((asset) => wanted.has(asset.id)));
}

export async function toggleFavorite(id: string): Promise<Asset> {
  await delay(80, 180);
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) throw new ApiError("That asset isn't in your library any more");
  asset.favorite = !asset.favorite;
  return clone(asset);
}

export async function renameAsset(id: string, name: string): Promise<Asset> {
  await delay(80, 180);
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) throw new ApiError("That asset isn't in your library any more");
  asset.name = name;
  return clone(asset);
}

export async function deleteAsset(id: string): Promise<void> {
  await delay(120, 240);
  assets = assets.filter((asset) => asset.id !== id);
}

/**
 * Upload emits real progress. There is no file transfer behind it, but the
 * shape is the one a real adapter implements, so the UI never has to change.
 */
export async function* uploadAsset(
  file: { name: string; size: number; type: string },
): AsyncGenerator<{ percent: number; asset: Asset | null }, void, void> {
  const totalMs = 900 + Math.min(file.size / 4000, 2600);
  for await (const fraction of ticker(totalMs)) {
    if (fraction < 1) {
      yield { percent: Math.round(fraction * 100), asset: null };
      continue;
    }
    const kind = file.type.startsWith("video")
      ? ("video" as const)
      : file.type.startsWith("audio")
        ? ("audio" as const)
        : ("image" as const);
    const template = assets.find((asset) => asset.kind === kind) ?? assets[0];
    if (!template) throw new ApiError("Upload failed");
    const created: Asset = {
      ...clone(template),
      id: `asset-upload-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      sizeBytes: file.size,
      favorite: false,
      source: "upload",
      createdAt: new Date().toISOString(),
    };
    assets = [created, ...assets];
    yield { percent: 100, asset: created };
  }
}

export async function getBrandKit(): Promise<BrandKit> {
  await delay(120, 260);
  return clone(brandKit);
}

export async function saveBrandKit(next: BrandKit): Promise<BrandKit> {
  await delay(180, 360);
  maybeFail("Saving your brand kit");
  brandKit = clone(next);
  return clone(brandKit);
}
