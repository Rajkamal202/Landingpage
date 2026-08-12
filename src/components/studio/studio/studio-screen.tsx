"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";
import { getTokenBalance } from "@/lib/api/billing";
import {
  deleteGeneration,
  listGenerations,
  listModels,
  retryGeneration,
  toggleGenerationFavorite,
} from "@/lib/api/generations";
import { queryKeys } from "@/lib/api/keys";
import { getProject } from "@/lib/api/projects";
import { useSearchParamEnum, useSearchParamState } from "@/lib/hooks/use-search-param-state";
import { useShortcut } from "@/lib/hooks/use-shortcuts";
import { useRegisterWorkspaceTab } from "@/components/app-shell/use-register-tab";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import type { Asset, Generation, GenerationMode } from "@/lib/schemas";
import { Lightbox } from "@/components/ui/lightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { downloadAsset } from "../download";
import { LibrarySheet } from "../library-sheet";
import { Composer } from "./composer";
import { GenerationGrid, type GenerationActions } from "./generation-grid";
import { ModeToolbar } from "./mode-toolbar";
import { ALL_MODES, MODE_CONFIG } from "./modes";
import { SelectionBar } from "./selection-bar";
import { useGenerationRunner } from "./use-generation-runner";

/** SPEC §8.2 — full-bleed results with the composer docked at the bottom. */
export function StudioScreen({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const setLibraryOpen = useWorkspaceStore((state) => state.setLibraryOpen);
  const libraryOpen = useWorkspaceStore((state) => state.libraryOpen);

  const [mode, setMode] = useSearchParamEnum<GenerationMode>("mode", ALL_MODES, "video");
  const [assetParam, setAssetParam] = useSearchParamState<string>("asset", {
    defaultValue: "",
    mode: "push",
    serialize: (value) => value || null,
  });

  const [selection, setSelection] = React.useState<ReadonlySet<string>>(new Set());
  const [frameId, setFrameId] = React.useState<string | null>(null);
  const lastClicked = React.useRef<string | null>(null);
  const shiftHeld = React.useRef(false);

  const project = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
  });
  const generations = useQuery({
    queryKey: queryKeys.generations.list(projectId),
    queryFn: () => listGenerations(projectId),
  });
  const assets = useQuery({ queryKey: queryKeys.assets.list(), queryFn: () => listAssets() });
  const models = useQuery({ queryKey: queryKeys.models.list, queryFn: listModels });
  const balance = useQuery({ queryKey: queryKeys.billing.balance, queryFn: getTokenBalance });

  const runner = useGenerationRunner(projectId);

  // Landing on this URL directly still registers the tab, so the shell's tab
  // strip and the route never disagree about what is open (SPEC §7.1).
  useRegisterWorkspaceTab(project.data, "studio");

  useShortcut({
    keys: "l",
    label: "Show or hide the library",
    group: "Studio",
    handler: () => setLibraryOpen(!libraryOpen),
  });
  useShortcut({
    keys: "escape",
    label: "Clear the current selection",
    group: "Studio",
    enabled: selection.size > 0,
    handler: () => setSelection(new Set()),
  });

  const assetById = React.useMemo(
    () => new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
    [assets.data],
  );

  const items = React.useMemo<readonly Generation[]>(() => {
    const liveIds = new Set(runner.live.map((generation) => generation.id));
    return [...runner.live, ...(generations.data ?? []).filter((item) => !liveIds.has(item.id))];
  }, [runner.live, generations.data]);

  const readyAssets = React.useMemo(
    () =>
      items
        .map((generation) => (generation.assetId ? assetById.get(generation.assetId) : undefined))
        .filter((asset): asset is Asset => asset !== undefined),
    [items, assetById],
  );

  const lightboxIndex = assetParam
    ? readyAssets.findIndex((asset) => asset.id === assetParam)
    : -1;

  const patch = React.useCallback(
    (update: (list: Generation[]) => Generation[]) => {
      queryClient.setQueryData<Generation[]>(queryKeys.generations.list(projectId), (old) =>
        old ? update(old) : old,
      );
    },
    [queryClient, projectId],
  );

  const selectRange = (generation: Generation) => {
    const anchor = lastClicked.current;
    const to = items.findIndex((item) => item.id === generation.id);
    const from = anchor ? items.findIndex((item) => item.id === anchor) : -1;
    const next = new Set(selection);
    if (from >= 0 && to >= 0) {
      const [start, end] = from < to ? [from, to] : [to, from];
      for (const item of items.slice(start, end + 1)) next.add(item.id);
    } else if (next.has(generation.id)) {
      next.delete(generation.id);
    } else {
      next.add(generation.id);
    }
    lastClicked.current = generation.id;
    setSelection(next);
  };

  const toggleOne = (generation: Generation) => {
    const next = new Set(selection);
    if (next.has(generation.id)) next.delete(generation.id);
    else next.add(generation.id);
    lastClicked.current = generation.id;
    setSelection(next);
  };

  const assetFor = (generation: Generation) =>
    generation.assetId ? assetById.get(generation.assetId) : undefined;

  const actions: GenerationActions = {
    toggleSelect: toggleOne,
    activate: (generation) => {
      if (shiftHeld.current) {
        selectRange(generation);
        return;
      }
      const asset = assetFor(generation);
      if (asset) setAssetParam(asset.id);
    },
    favorite: (generation) => {
      patch((list) =>
        list.map((item) =>
          item.id === generation.id ? { ...item, favorite: !item.favorite } : item,
        ),
      );
      void toggleGenerationFavorite(generation.id).catch(() => {
        patch((list) =>
          list.map((item) =>
            item.id === generation.id ? { ...item, favorite: generation.favorite } : item,
          ),
        );
        toast.error("That favourite didn't stick", {
          description: "The change was rolled back. Try again in a moment.",
        });
      });
    },
    download: (generation) => {
      const asset = assetFor(generation);
      if (!asset) return;
      downloadAsset(asset);
      toast.success("Download started", { description: `${asset.name} is saving to your device.` });
    },
    duplicate: (generation) => {
      runner.run(
        {
          projectId,
          mode: generation.mode,
          prompt: generation.prompt,
          modelId: generation.modelId,
          aspect: generation.aspect,
          durationMs: generation.durationMs > 0 ? generation.durationMs : 1,
          batchCount: 1,
          startFrameAssetId: generation.startFrameAssetId,
        },
        generation.tokenCost,
      );
    },
    remove: (generation) => {
      patch((list) => list.filter((item) => item.id !== generation.id));
      void deleteGeneration(generation.id).then(() => {
        toast.success("Result deleted", { description: "The clip stays in your library." });
      });
    },
    retry: (generation) => {
      void retryGeneration(generation.id).then((next) => {
        patch((list) => list.map((item) => (item.id === next.id ? next : item)));
        toast.success("Queued again", { description: "This one is back in the queue." });
      });
    },
  };

  // The composer and mode toolbar float over the results, so the scroll area
  // has to know how tall they currently are.
  const dockRef = React.useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = React.useState(320);

  React.useEffect(() => {
    const node = dockRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setDockHeight(Math.round(entry.contentRect.height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const selected = items.filter((generation) => selection.has(generation.id));

  return (
    <main className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="mx-auto w-full max-w-marketing px-4 pt-6 sm:px-6"
          // dynamic: the grid reserves exactly the height of the floating
          // composer cluster. A fixed value cannot work — SPEC §8.2 has each
          // mode swap the composer's controls and animate its height — and
          // guessing low means the toolbar sits on top of the last row of
          // results and their type badges.
          style={{ paddingBottom: `${dockHeight + 24}px` }}
        >
          <header className="mb-6 flex flex-wrap items-baseline gap-3">
            {project.data ? (
              <h1 className="text-title-lg text-ink-950">{project.data.name}</h1>
            ) : (
              <Skeleton className="h-8 w-panel" />
            )}
            <p className="text-body-sm text-ink-500">
              {items.length} {items.length === 1 ? "result" : "results"}
            </p>
          </header>

          <GenerationGrid
            items={items}
            assetById={assetById}
            pending={generations.isPending}
            failed={generations.isError}
            selection={selection}
            actions={actions}
            onRetryLoad={() => void generations.refetch()}
            onPointerDownCapture={(event) => {
              shiftHeld.current = event.shiftKey;
            }}
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-page to-transparent"
      />

      <div
        ref={dockRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-3 pb-3"
      >
        <div className="pointer-events-auto">
          <SelectionBar
            count={selection.size}
            onClear={() => setSelection(new Set())}
            onDownload={() => {
              let count = 0;
              for (const generation of selected) {
                const asset = assetFor(generation);
                if (!asset) continue;
                downloadAsset(asset);
                count += 1;
              }
              toast.success(`Downloading ${count} ${count === 1 ? "result" : "results"}`, {
                description: "They're saving to your device now.",
              });
            }}
            onFavorite={() => {
              for (const generation of selected) actions.favorite(generation);
              setSelection(new Set());
            }}
            onDelete={() => {
              for (const generation of selected) {
                patch((list) => list.filter((item) => item.id !== generation.id));
                void deleteGeneration(generation.id);
              }
              toast.success(`${selected.length} results deleted`, {
                description: "The clips stay in your library.",
              });
              setSelection(new Set());
            }}
          />
        </div>

        <div className="pointer-events-auto max-w-full">
          <ModeToolbar mode={mode} onModeChange={setMode} />
        </div>

        <div className="pointer-events-auto w-full max-w-3xl">
          <Composer
            projectId={projectId}
            mode={mode}
            models={models.data ?? []}
            assets={assets.data ?? []}
            balance={balance.data}
            submitting={runner.running}
            frameId={frameId}
            onFrameChange={setFrameId}
            onSubmit={runner.run}
          />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {runner.announcement}
      </p>

      <Lightbox
        assets={readyAssets}
        index={lightboxIndex >= 0 ? lightboxIndex : null}
        onIndexChange={(index) => setAssetParam(readyAssets[index]?.id ?? "")}
        onClose={() => setAssetParam("")}
      />

      <LibrarySheet
        useHint="Click an asset to load it as the start frame, or drag it into the composer."
        onUse={(asset) => {
          if (MODE_CONFIG[mode].frame === "hidden") {
            toast.info(`${asset.name} stays in the library`, {
              description: "This mode doesn't take a start frame. Drag the asset into the prompt to reference it.",
            });
            return;
          }
          setFrameId(asset.id);
          setLibraryOpen(false);
          toast.success(`${asset.name} set as the ${MODE_CONFIG[mode].frameLabel.toLowerCase()}`, {
            description: "Clear it from the tile beside the prompt.",
          });
        }}
      />
    </main>
  );
}
