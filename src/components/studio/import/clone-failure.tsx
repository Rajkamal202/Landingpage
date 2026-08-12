"use client";

import { ApiError } from "@/lib/api/client";
import { CloneError } from "@/lib/api/clone";
import { Icon } from "@/components/icon";
import { IconRetry, IconWarning } from "@/components/icons";
import { Button } from "@/components/ui/button";

/**
 * SPEC §8.1: "Never a generic error." Every failure the clone stream can
 * raise carries its own cause and fix, so this renders what the API said
 * rather than inventing a sentence of its own.
 */
function describe(error: Error): { title: string; fix: string; code: string } {
  if (error instanceof CloneError) {
    return { title: error.failure.title, fix: error.failure.fix, code: error.failure.code };
  }
  if (error instanceof ApiError) {
    return { title: error.message, fix: error.fix, code: error.code };
  }
  return {
    title: "The clone stopped part-way through",
    fix: "The connection to the source dropped. Paste the link again to restart the analysis.",
    code: "interrupted",
  };
}

export function CloneFailureCard({
  error,
  sourceLabel,
  onRetry,
  onStartOver,
}: {
  error: Error;
  sourceLabel: string;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  const { title, fix, code } = describe(error);

  return (
    <div className="flex flex-col gap-5" role="alert">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
          <Icon glyph={IconWarning} size={24} />
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-title-md text-ink-950">{title}</h2>
          <p className="text-body-md text-ink-500">{fix}</p>
          <p className="mono-sm truncate text-ink-400">{sourceLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" iconStart={IconRetry} onClick={onRetry}>
          Try this link again
        </Button>
        <Button variant="ghost" onClick={onStartOver}>
          Use a different link
        </Button>
        <span className="mono-sm ml-auto text-ink-300">{code}</span>
      </div>
    </div>
  );
}
