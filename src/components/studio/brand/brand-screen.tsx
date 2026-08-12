"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getBrandKit, listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import { IconBrand } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPage } from "../app-page";
import { BrandForm } from "./brand-form";

/**
 * SPEC §8.3 — the brand kit. The FAQ promises a user only has to supply their
 * logo and product images, so this screen has to be finishable in a couple of
 * minutes: five small cards, one save, no wizard.
 */
export function BrandScreen() {
  const kit = useQuery({ queryKey: queryKeys.assets.brandKit, queryFn: getBrandKit });
  const assets = useQuery({ queryKey: queryKeys.assets.list(), queryFn: () => listAssets() });

  const assetById = React.useMemo(
    () => new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
    [assets.data],
  );

  return (
    <AppPage
      title="Brand kit"
      description="Your logo, colours, type, products and tone. Set once, and every generation starts from it."
    >
      {kit.isPending ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-panel w-full rounded-lg" />
          ))}
        </div>
      ) : kit.isError || kit.data === undefined ? (
        <EmptyState
          glyph={IconBrand}
          title="Your brand kit didn't load"
          description="The request came back empty-handed. Nothing was lost — reload to pick up where you left off."
          action={
            <Button variant="primary" onClick={() => void kit.refetch()}>
              Reload brand kit
            </Button>
          }
        />
      ) : (
        <BrandForm kit={kit.data} assetById={assetById} />
      )}
    </AppPage>
  );
}
