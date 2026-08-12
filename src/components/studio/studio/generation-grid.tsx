"use client";

import type * as React from "react";
import type { Asset, Generation } from "@/lib/schemas";
import { IconGenerate } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerationTile } from "./generation-tile";
import { Masonry } from "./masonry";

export interface GenerationActions {
  toggleSelect: (generation: Generation) => void;
  activate: (generation: Generation) => void;
  favorite: (generation: Generation) => void;
  download: (generation: Generation) => void;
  duplicate: (generation: Generation) => void;
  remove: (generation: Generation) => void;
  retry: (generation: Generation) => void;
}

export interface GenerationGridProps {
  items: readonly Generation[];
  assetById: ReadonlyMap<string, Asset>;
  pending: boolean;
  failed: boolean;
  selection: ReadonlySet<string>;
  actions: GenerationActions;
  onRetryLoad: () => void;
  /** Records the shift key so a shift-click can extend the selection. */
  onPointerDownCapture: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export function GenerationGrid({
  items,
  assetById,
  pending,
  failed,
  selection,
  actions,
  onRetryLoad,
  onPointerDownCapture,
}: GenerationGridProps) {
  if (pending) {
    return (
      <div className="flex items-start gap-4">
        {[0, 1, 2, 3].map((column) => (
          <div key={column} className="flex min-w-0 flex-1 flex-col gap-4">
            <Skeleton className="aspect-9/16 w-full rounded-md" />
            <Skeleton className="aspect-4/5 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <EmptyState
        glyph={IconGenerate}
        title="This project's results didn't load"
        description="The request came back empty-handed. Nothing was lost — reload to see them again."
        action={
          <Button variant="primary" onClick={onRetryLoad}>
            Reload results
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        size="lg"
        glyph={IconGenerate}
        title="Nothing generated here yet"
        description="Describe a shot in the composer below and Vireo returns a batch of 9:16 takes to choose from."
        action={<ButtonLink href="/app/templates">Start from a template</ButtonLink>}
        secondaryAction={
          <ButtonLink href="/app/import" variant="secondary">
            Clone a video
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div onPointerDownCapture={onPointerDownCapture}>
      <Masonry
        items={items}
        ariaLabel="Generated results"
        getKey={(generation) => generation.id}
        renderItem={(generation) => (
          <GenerationTile
            generation={generation}
            asset={generation.assetId ? assetById.get(generation.assetId) : undefined}
            selected={selection.has(generation.id)}
            onToggleSelect={() => actions.toggleSelect(generation)}
            onActivate={() => actions.activate(generation)}
            onFavorite={() => actions.favorite(generation)}
            onDownload={() => actions.download(generation)}
            onDuplicate={() => actions.duplicate(generation)}
            onDelete={() => actions.remove(generation)}
            onRetry={() => actions.retry(generation)}
          />
        )}
      />
    </div>
  );
}
