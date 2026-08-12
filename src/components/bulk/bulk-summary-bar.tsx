"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/cn";
import type { BulkRow } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/icon";
import { IconGenerate, IconRetry } from "@/components/icons";
import { useBulkStore } from "@/lib/stores/bulk";

/**
 * SPEC §8.7: "A summary bar shows aggregate progress."
 *
 * It is also the screen's live region — SPEC §11 asks for generation
 * completion to be announced, and the honest place to say "twenty-four of
 * thirty are ready" is the thing already saying it visually.
 */
export interface BulkSummaryBarProps {
  running: boolean;
  onStop: () => void;
  onRetryFailed: (rowIds: readonly string[]) => void;
}

interface Tally {
  total: number;
  ready: number;
  generating: number;
  queued: number;
  failed: number;
  draft: number;
  percent: number;
}

function tally(rows: readonly BulkRow[]): Tally {
  const counts = { ready: 0, generating: 0, queued: 0, failed: 0, draft: 0 };
  let progress = 0;
  for (const row of rows) {
    counts[row.status] += 1;
    progress += row.status === "ready" ? 100 : row.status === "generating" ? row.progress : 0;
  }
  return {
    ...counts,
    total: rows.length,
    percent: rows.length === 0 ? 0 : progress / rows.length,
  };
}

export function BulkSummaryBar({ running, onStop, onRetryFailed }: BulkSummaryBarProps) {
  const counts = useBulkStore(useShallow((store) => tally(store.rows)));
  const failedIds = useBulkStore(
    useShallow((store) =>
      store.rows.filter((row) => row.status === "failed").map((row) => row.id),
    ),
  );

  const inFlight = counts.generating + counts.queued;
  const parts = [
    `${counts.ready} of ${counts.total} ready`,
    counts.generating > 0 ? `${counts.generating} generating` : null,
    counts.queued > 0 ? `${counts.queued} queued` : null,
    counts.failed > 0 ? `${counts.failed} failed` : null,
    counts.draft > 0 ? `${counts.draft} not started` : null,
  ].filter((part): part is string => part !== null);

  return (
    <div className="flex h-topbar shrink-0 items-center gap-4 border-t border-ink-200 bg-surface px-4">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md",
          inFlight > 0 ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500",
        )}
      >
        <Icon glyph={IconGenerate} size={16} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-body-sm truncate text-ink-700" aria-live="polite">
          {counts.total === 0 ? "Nothing to render yet" : parts.join(" · ")}
        </p>
        <Progress
          value={counts.percent}
          tone={counts.failed > 0 && inFlight === 0 ? "warning" : "ink"}
          aria-label="Batch progress"
        />
      </div>

      <span className="mono-sm shrink-0 text-ink-500">{Math.round(counts.percent)}%</span>

      {counts.failed > 0 && !running ? (
        <Button
          variant="secondary"
          size="sm"
          iconStart={IconRetry}
          onClick={() => onRetryFailed(failedIds)}
        >
          Run {counts.failed} failed {counts.failed === 1 ? "row" : "rows"} again
        </Button>
      ) : null}

      {running ? (
        <Button variant="secondary" size="sm" onClick={onStop}>
          Stop generating
        </Button>
      ) : null}
    </div>
  );
}
