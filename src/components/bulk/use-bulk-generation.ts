"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { BulkColumn, BulkRow, Model } from "@/lib/schemas";
import { queryKeys } from "@/lib/api/keys";
import { createGeneration, listModels } from "@/lib/api/generations";
import { spendTokens } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { useBulkStore } from "@/lib/stores/bulk";

/**
 * Drives per-row generation off the real progress stream in
 * `api/generations.ts` (SPEC §9 — no `setInterval` progress bars anywhere).
 *
 * Rows run three at a time. One at a time makes a thirty-row batch take two
 * minutes; all at once makes every ring move in lockstep, which reads as fake.
 * Three is what a queue actually looks like.
 */
const CONCURRENCY = 3;
const MODE = "talking-head" as const;

export interface BulkGeneration {
  model: Model | undefined;
  tokensPerRow: number;
  running: boolean;
  pendingCount: number;
  generate: (rowIds: readonly string[]) => void;
  cancel: () => void;
}

export function useBulkGeneration(projectId: string, columns: readonly BulkColumn[]): BulkGeneration {
  const queryClient = useQueryClient();
  const [running, setRunning] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);
  const cancelled = React.useRef(false);

  const models = useQuery({ queryKey: queryKeys.models.list, queryFn: listModels });
  const model = React.useMemo(
    () => models.data?.find((candidate) => candidate.modes.includes(MODE)) ?? models.data?.[0],
    [models.data],
  );

  React.useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );

  const mediaKey = React.useMemo(
    () => columns.find((column) => column.kind === "media")?.key ?? null,
    [columns],
  );

  const generate = React.useCallback(
    (rowIds: readonly string[]) => {
      if (!model || rowIds.length === 0) return;
      const { rows, patchRow } = useBulkStore.getState();
      const targets = rowIds
        .map((id) => rows.find((row) => row.id === id))
        .filter((row): row is BulkRow => row !== undefined);
      if (targets.length === 0) return;

      cancelled.current = false;
      setRunning(true);
      setPendingCount(targets.length);

      for (const row of targets) {
        patchRow(row.id, { status: "queued", progress: 0, error: null, outputAssetId: null });
      }

      // The meter moves with the action, not after it (SPEC §8.2).
      void spendTokens(model.tokensPerGeneration * targets.length).then(() =>
        queryClient.invalidateQueries({ queryKey: queryKeys.billing.balance }),
      );

      const queue = [...targets];
      let done = 0;

      const runNext = async (): Promise<void> => {
        const row = queue.shift();
        if (!row || cancelled.current) return;

        try {
          const stream = createGeneration({
            projectId,
            mode: MODE,
            prompt: [{ type: "text", value: promptFor(row, columns) }],
            modelId: model.id,
            aspect: "9:16",
            durationMs: Math.min(15_000, model.maxDurationMs),
            batchCount: 1,
            startFrameAssetId: mediaKey ? (row.cells[mediaKey] ?? null) || null : null,
          });

          for await (const event of stream) {
            if (cancelled.current) break;
            useBulkStore.getState().patchRow(row.id, {
              status: event.generation.status,
              progress: event.generation.progress,
              outputAssetId: event.generation.assetId,
            });
          }
        } catch (caught) {
          const error =
            caught instanceof ApiError
              ? `${caught.message}. ${caught.fix}`
              : "This row didn't reach the renderer. Check the row's actor and voice, then run it again.";
          useBulkStore.getState().patchRow(row.id, { status: "failed", progress: 0, error });
        }

        done += 1;
        setPendingCount(targets.length - done);
        await runNext();
      };

      void Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => runNext()),
      ).then(() => {
        setRunning(false);
        setPendingCount(0);
        if (cancelled.current) return;
        const ready = useBulkStore
          .getState()
          .rows.filter((row) => rowIds.includes(row.id) && row.status === "ready").length;
        toast.success(
          ready === targets.length
            ? `Generated ${targets.length} ${targets.length === 1 ? "variation" : "variations"}`
            : `Generated ${ready} of ${targets.length} variations`,
          {
            description:
              ready === targets.length
                ? "Every row rendered. Export the set when you're happy with it."
                : "The rows that failed say why in the Status column. Fix and run them again.",
          },
        );
      });
    },
    [columns, mediaKey, model, projectId, queryClient],
  );

  const cancel = React.useCallback(() => {
    cancelled.current = true;
    setRunning(false);
    setPendingCount(0);
    for (const row of useBulkStore.getState().rows) {
      if (row.status === "queued" || row.status === "generating") {
        useBulkStore.getState().patchRow(row.id, { status: "draft", progress: 0 });
      }
    }
    toast("Stopped generating", {
      description: "Rows that had already finished kept their video.",
    });
  }, []);

  return {
    model,
    tokensPerRow: model?.tokensPerGeneration ?? 0,
    running,
    pendingCount,
    generate,
    cancel,
  };
}

/** The row's copy, in the order the template reads it. */
function promptFor(row: BulkRow, columns: readonly BulkColumn[]): string {
  return columns
    .filter((column) => column.kind === "text")
    .map((column) => row.cells[column.key] ?? "")
    .filter((value) => value !== "")
    .join("\n");
}
