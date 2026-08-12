"use client";

import * as React from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { deleteAsset, renameAsset, toggleFavorite } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import type { Asset } from "@/lib/schemas";
import { toast } from "@/components/ui/toast";

type Snapshot = ReadonlyArray<[QueryKey, Asset[] | undefined]>;

/**
 * SPEC §13: "Optimistic updates where a mutation's outcome is predictable."
 * A favourite, a rename and a delete all are, so the grid reacts on the click
 * and rolls back with a named cause and a fix if the call fails.
 *
 * Every cached asset list is patched rather than only the one on screen — the
 * full library, the library sheet's filtered view and each asset picker are
 * separate cache entries, and updating one leaves the others lying.
 */
function useAssetListPatch() {
  const queryClient = useQueryClient();

  const patch = React.useCallback(
    (update: (list: Asset[]) => Asset[]): Snapshot => {
      const snapshot = queryClient.getQueriesData<Asset[]>({
        queryKey: queryKeys.assets.all,
      });
      queryClient.setQueriesData<Asset[]>({ queryKey: queryKeys.assets.all }, (old) =>
        // The brand kit lives under the same key prefix and is not a list; the
        // guard keeps this from mangling it.
        Array.isArray(old) ? update(old) : old,
      );
      return snapshot;
    },
    [queryClient],
  );

  const restore = React.useCallback(
    (snapshot: Snapshot | undefined) => {
      if (!snapshot) return;
      for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
    },
    [queryClient],
  );

  const settle = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
  }, [queryClient]);

  return { patch, restore, settle };
}

export function useAssetMutations() {
  const { patch, restore, settle } = useAssetListPatch();

  const favorite = useMutation({
    mutationFn: (asset: Asset) => toggleFavorite(asset.id),
    onMutate: (asset) => ({
      snapshot: patch((list) =>
        list.map((item) =>
          item.id === asset.id ? { ...item, favorite: !item.favorite } : item,
        ),
      ),
    }),
    onError: (_error, asset, context) => {
      restore(context?.snapshot);
      toast.error("That favourite didn't stick", {
        description: `${asset.name} is back the way it was. Try the heart again in a moment.`,
      });
    },
    onSettled: settle,
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameAsset(id, name),
    onMutate: ({ id, name }) => ({
      snapshot: patch((list) => list.map((item) => (item.id === id ? { ...item, name } : item))),
    }),
    onError: (_error, variables, context) => {
      restore(context?.snapshot);
      toast.error("That name didn't save", {
        description: `${variables.name} was put back to its previous name. Try renaming it again.`,
      });
    },
    onSuccess: (asset) => {
      toast.success("Asset renamed", { description: `It's now called ${asset.name}.` });
    },
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: (asset: Asset) => deleteAsset(asset.id),
    onMutate: (asset) => ({
      snapshot: patch((list) => list.filter((item) => item.id !== asset.id)),
    }),
    onError: (_error, asset, context) => {
      restore(context?.snapshot);
      toast.error("Couldn't delete that asset", {
        description: `${asset.name} is still in your library. Try again in a moment.`,
      });
    },
    onSuccess: (_data, asset) => {
      toast.success("Asset deleted", {
        description: `${asset.name} is gone. Projects already using it keep their copy.`,
      });
    },
    onSettled: settle,
  });

  return { favorite, rename, remove };
}
