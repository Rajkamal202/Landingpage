"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import type { BulkRow } from "@/lib/schemas";
import { queryKeys } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/client";
import { getProject, getProjectDocument } from "@/lib/api/projects";
import { useRegisterWorkspaceTab } from "@/components/app-shell/use-register-tab";
import { EditorFrame } from "@/components/app-shell/editor-frame";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { STATUS_LABEL } from "@/components/ui/status-pill";
import { toast } from "@/components/ui/toast";
import { IconGenerate, IconRetry, IconTable, IconWarning } from "@/components/icons";
import { useBulkStore } from "@/lib/stores/bulk";
import { BulkCatalogProvider, displayValue, useBulkCatalog } from "./catalog";
import { BulkGrid } from "./bulk-grid";
import { BulkImportDialog } from "./bulk-import-dialog";
import { BulkSkeleton } from "./bulk-skeleton";
import { BulkSummaryBar } from "./bulk-summary-bar";
import { BulkToolbar } from "./bulk-toolbar";
import { downloadTextFile, toCsv } from "./delimited";
import { useBulkGeneration } from "./use-bulk-generation";
import { useCursorParams } from "./use-cursor-params";

/**
 * `/app/p/[id]/bulk` — SPEC §8.7.
 *
 * The document comes from `getProjectDocument`, the same call every other
 * editor makes, and the grid mounts inside `EditorFrame` so the toolbar band,
 * the footer and the honest below-`lg` fallback are the ones the rest of the
 * app uses rather than four different interpretations of them.
 */
export function BulkEditor({ projectId }: { projectId: string }) {
  return (
    <BulkCatalogProvider>
      <BulkWorkspace projectId={projectId} />
    </BulkCatalogProvider>
  );
}

function BulkWorkspace({ projectId }: { projectId: string }) {
  const [importOpen, setImportOpen] = React.useState(false);
  const catalog = useBulkCatalog();
  const { initialCursor, syncCursor } = useCursorParams();

  const project = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
  });

  // SPEC §7.1 — reaching this route directly still opens its workspace tab.
  useRegisterWorkspaceTab(project.data, "bulk");
  const docQuery = useQuery({
    queryKey: queryKeys.projects.document(projectId),
    queryFn: () => getProjectDocument(projectId),
  });

  const bulk = docQuery.data?.bulk ?? null;
  const loaded = useBulkStore((store) => store.loaded && store.projectId === projectId);
  const columns = useBulkStore((store) => store.columns);
  const cursor = useBulkStore(useShallow((store) => store.cursor));

  React.useEffect(() => {
    if (bulk) useBulkStore.getState().load(bulk, initialCursor);
  }, [bulk, initialCursor]);

  React.useEffect(() => {
    if (loaded) syncCursor(cursor);
  }, [cursor, loaded, syncCursor]);

  const generation = useBulkGeneration(projectId, columns);

  const generateAll = React.useCallback(() => {
    const ids = useBulkStore
      .getState()
      .rows.filter((row) => row.status !== "ready")
      .map((row) => row.id);
    if (ids.length === 0) return;
    generation.generate(ids);
  }, [generation]);

  const addRows = React.useCallback((count: number) => {
    useBulkStore.getState().addRows(count);
    if (count > 1) {
      toast(`Added ${count} rows`, { description: "They're empty and ready to fill in." });
    }
  }, []);

  const exportAll = React.useCallback(() => {
    const store = useBulkStore.getState();
    const header = store.columns.map((column) => column.label);
    const body = store.rows.map((row) =>
      store.columns.map((column) =>
        column.kind === "status"
          ? STATUS_LABEL[row.status]
          : displayValue(column.kind, row.cells[column.key] ?? "", catalog),
      ),
    );
    const name = store.templateName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadTextFile(`${name}-variations.csv`, toCsv([header, ...body]), "text/csv");
    toast.success(`Exported ${store.rows.length} variations`, {
      description: "Every column came across, with names instead of ids.",
    });
  }, [catalog]);

  const importRows = React.useCallback((rows: BulkRow[], summary: string) => {
    useBulkStore.getState().appendRows(rows, summary);
    toast.success(summary, { description: "Undo with ⌘Z if the columns landed wrong." });
  }, []);

  const projectName = project.data?.name ?? "This project";

  if (docQuery.isError) {
    const error = docQuery.error;
    return (
      <ErrorPanel
        title={error instanceof ApiError ? error.message : "This sheet didn't open"}
        description={
          error instanceof ApiError
            ? error.fix
            : "The project loaded but its variation sheet didn't come back. Try again — nothing has been lost."
        }
        onRetry={() => void docQuery.refetch()}
      />
    );
  }

  if (docQuery.isPending || !loaded) {
    return (
      <EditorFrame
        surface="bulk editor"
        projectName={projectName}
        glyph={IconTable}
        availableOnMobile="Rows, copy and per-row status are all here on a laptop."
      >
        <BulkSkeleton />
      </EditorFrame>
    );
  }

  if (!bulk) {
    return (
      <ErrorPanel
        title="This project has no variation sheet yet"
        description="Bulk editing starts from an approved cut. Open the studio, pick the video you want to fan out, and send it here."
        action={
          <ButtonLink href={studioHref(projectId)} variant="primary" iconStart={IconGenerate}>
            Open the generation studio
          </ButtonLink>
        }
      />
    );
  }

  return (
    <EditorFrame
      surface="bulk editor"
      projectName={projectName}
      glyph={IconTable}
      availableOnMobile="Rows, copy and per-row status are all here on a laptop."
      toolbar={
        <BulkToolbar
          running={generation.running}
          tokensPerRow={generation.tokensPerRow}
          onAddRows={addRows}
          onGenerateAll={generateAll}
          onImport={() => setImportOpen(true)}
          onExport={exportAll}
        />
      }
      footer={
        <BulkSummaryBar
          running={generation.running}
          onStop={generation.cancel}
          onRetryFailed={(ids) => generation.generate(ids)}
        />
      }
    >
      <h1 className="sr-only">{projectName} — variations</h1>

      <BulkGrid
        onAddRow={() => addRows(1)}
        onImport={() => setImportOpen(true)}
        onGenerateRows={(ids) => generation.generate(ids)}
      />

      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        columns={columns}
        onImport={importRows}
      />
    </EditorFrame>
  );
}

/**
 * `typedRoutes` is on, and a path assembled at runtime cannot be matched
 * against the generated route map. The pathname pattern itself is real and
 * checked by the `[id]` segment, so the assertion is over the id, not the route.
 */
function studioHref(projectId: string): React.ComponentProps<typeof ButtonLink>["href"] {
  return `/app/p/${projectId}/studio` as React.ComponentProps<typeof ButtonLink>["href"];
}

function ErrorPanel({
  title,
  description,
  onRetry,
  action,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <EmptyState
        glyph={IconWarning}
        title={title}
        description={description}
        action={
          action ?? (
            <Button variant="primary" iconStart={IconRetry} onClick={onRetry}>
              Try again
            </Button>
          )
        }
        secondaryAction={
          <ButtonLink href="/app" variant="ghost">
            Back to projects
          </ButtonLink>
        }
      />
    </div>
  );
}
