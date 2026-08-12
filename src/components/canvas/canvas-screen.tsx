"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { getProject, getProjectDocument } from "@/lib/api/projects";
import { listAssets } from "@/lib/api/assets";
import { listModels } from "@/lib/api/generations";
import { listActors } from "@/lib/api/actors";
import { useCanvasStore } from "@/lib/stores/canvas";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import { EditorFrame } from "@/components/app-shell/editor-frame";
import { IconGraph } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactFlowProvider } from "@xyflow/react";
import { CanvasDataProvider, type CanvasData } from "./canvas-data";
import { CanvasFlow } from "./canvas-flow";
import { CanvasPanel } from "./canvas-panel";
import { CanvasToolbar } from "./canvas-toolbar";
import { NodeLibrary } from "./node-library";
import "./canvas.css";

/**
 * SPEC §8.4 — the node graph.
 *
 * Library assets, models and actors are resolved once here and published
 * through context: React Flow owns node rendering, so a node cannot be handed
 * props from this screen, and thirty nodes each firing their own lookup would
 * be thirty requests for the same data.
 */
export function CanvasScreen({ projectId }: { projectId: string }) {
  const project = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
  });
  const document = useQuery({
    queryKey: queryKeys.projects.document(projectId),
    queryFn: () => getProjectDocument(projectId),
  });
  const assets = useQuery({
    queryKey: queryKeys.assets.list({ sort: "recent" }),
    queryFn: () => listAssets({ sort: "recent" }),
  });
  const models = useQuery({ queryKey: queryKeys.models.list, queryFn: listModels });
  const actors = useQuery({ queryKey: queryKeys.actors.list, queryFn: () => listActors() });

  const load = useCanvasStore((state) => state.load);
  const nodeCount = useCanvasStore((state) => state.nodes.length);
  const addNode = useCanvasStore((state) => state.addNode);
  const openTab = useWorkspaceStore((state) => state.openTab);

  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const dropPoint = React.useRef<{ x: number; y: number } | null>(null);

  const canvas = document.data?.canvas;
  React.useEffect(() => {
    if (canvas) load(canvas);
  }, [canvas, load]);

  React.useEffect(() => {
    const data = project.data;
    if (!data) return;
    openTab({ projectId: data.id, name: data.name, kind: data.kind, surface: "canvas" });
  }, [project.data, openTab]);

  const data = React.useMemo<CanvasData>(
    () => ({
      assets: new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
      models: models.data ?? [],
      actors: actors.data ?? [],
      ready: Boolean(assets.data && models.data && actors.data),
    }),
    [assets.data, models.data, actors.data],
  );

  const openLibraryAt = React.useCallback((screen: { x: number; y: number }) => {
    dropPoint.current = screen;
    setLibraryOpen(true);
  }, []);

  const projectName = project.data?.name ?? "Loading project";

  // The store has no `ready` flag; a loaded document always has nodes, so the
  // absence of both the project and any node means the first load is in flight.
  const loading = !project.data || (!canvas && nodeCount === 0);
  if (loading) return <CanvasSkeleton />;

  return (
    // `CanvasFlow` calls `useReactFlow` for screen-to-flow coordinate mapping,
    // which requires the provider to sit ABOVE the component that uses it —
    // React Flow's own <ReactFlow> element is not an ancestor of that call.
    <ReactFlowProvider>
      <CanvasDataProvider value={data}>
        <EditorFrame
          surface="canvas"
          projectName={projectName}
          glyph={IconGraph}
          availableOnMobile="You can still review this project and start new generations from the studio on a phone."
          toolbar={
            <CanvasToolbar projectName={projectName} onAddNode={() => setLibraryOpen(true)} />
          }
          panel={<CanvasPanel />}
        >
          <CanvasFlow onOpenLibraryAt={openLibraryAt} />
          <NodeLibrary
            open={libraryOpen}
            onOpenChange={setLibraryOpen}
            onAdd={(kind) => {
              addNode(kind, dropPoint.current ?? { x: 240, y: 200 });
              dropPoint.current = null;
            }}
          />
        </EditorFrame>
      </CanvasDataProvider>
    </ReactFlowProvider>
  );
}

function CanvasSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-topbar shrink-0 items-center gap-3 border-b border-ink-200 bg-surface px-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 bg-page dot-grid p-12">
          <div className="flex gap-16">
            {[0, 1, 2].map((column) => (
              <Skeleton key={column} className="h-40 w-panel rounded-lg" />
            ))}
          </div>
        </div>
        <div className="hidden w-panel shrink-0 flex-col gap-3 border-l border-ink-200 bg-surface p-3 lg:flex">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
