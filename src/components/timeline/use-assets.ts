"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import type { Asset, AssetFilter } from "@/lib/schemas";

/**
 * Clips reference assets by id; the lanes, the preview and the property panel
 * all need the resolved asset. One query key means TanStack Query fetches the
 * library once no matter how many call sites ask for it.
 */
const LIBRARY_FILTER: AssetFilter = { sort: "recent" };

export function useAssetMap(): { assets: ReadonlyMap<string, Asset>; pending: boolean } {
  const query = useQuery({
    queryKey: queryKeys.assets.list(LIBRARY_FILTER),
    queryFn: () => listAssets(LIBRARY_FILTER),
  });

  const assets = React.useMemo(
    () => new Map((query.data ?? []).map((asset) => [asset.id, asset])),
    [query.data],
  );

  return { assets, pending: query.isPending };
}
