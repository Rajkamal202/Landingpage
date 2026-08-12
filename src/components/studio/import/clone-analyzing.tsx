"use client";

import { CLONE_STEPS, type CloneProgress } from "@/lib/schemas";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CloneSteps } from "./clone-steps";
import { SceneStrip } from "./scene-strip";

/**
 * Room reserved on the strip for a typical short-form cut count. It is a
 * layout decision, not a claim about the source: frames drop into place as
 * they are detected instead of the row resizing under the cursor.
 */
export const EXPECTED_SCENES = 8;

export interface CloneAnalyzingProps {
  progress: CloneProgress | null;
  sourceLabel: string;
  previewSrc: string | undefined;
  previewPoster: string | undefined;
}

/** SPEC §8.1 — the analysing state, driven entirely by the real stream. */
export function CloneAnalyzing({
  progress,
  sourceLabel,
  previewSrc,
  previewPoster,
}: CloneAnalyzingProps) {
  const scenes = progress?.scenes ?? [];
  const percent = progress?.percent ?? 0;
  const stepLabel = CLONE_STEPS[progress?.stepIndex ?? 0]?.label ?? CLONE_STEPS[0]?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-5">
        <div className="w-32 shrink-0">
          <div className="relative aspect-9/16 overflow-hidden rounded-md bg-ink-100 shadow-elev-2">
            {previewSrc ? (
              <video
                src={previewSrc}
                poster={previewPoster}
                muted
                loop
                autoPlay
                playsInline
                aria-hidden="true"
                className="size-full object-cover"
              />
            ) : (
              <Skeleton className="absolute inset-0 rounded-none" />
            )}
          </div>
          <p className="mono-sm mt-2 truncate text-ink-400">{sourceLabel}</p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="eyebrow text-ink-400">Cloning video</p>
            <h2 className="text-title-md text-ink-950">Taking the video apart</h2>
          </div>
          <CloneSteps progress={progress} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-body-sm text-ink-500">
            {scenes.length} of {EXPECTED_SCENES} scenes detected
          </p>
          <p className="mono-sm text-ink-400">{Math.round(percent)}%</p>
        </div>

        <SceneStrip scenes={scenes} expectedCount={EXPECTED_SCENES} />

        <Progress value={percent} aria-label="Clone progress" />
      </div>

      <p aria-live="polite" className="sr-only">
        {stepLabel}, {Math.round(percent)} percent complete.
      </p>
    </div>
  );
}
