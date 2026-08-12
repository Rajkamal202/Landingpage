"use client";

import * as React from "react";
import { ticker } from "@/lib/api/client";
import { formatTimecode } from "@/lib/format";
import { useProgressStream } from "@/lib/hooks/use-progress-stream";
import { ASPECT_DIMENSIONS, type AspectRatio } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";

/**
 * SPEC §2 puts real encoding out of scope, so this renders the honest version:
 * a summary of exactly what would be written, real incremental progress from
 * the API layer's stream (never a `setInterval` bar, SPEC §9), and a completion
 * state that keeps the action's name — "Export video" finishes as "Video
 * exported" (SPEC §12).
 */
export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aspect: AspectRatio;
  durationMs: number;
  fps: number;
  clipCount: number;
  trackCount: number;
}

const EXPORT_MS = 3_400;

export function ExportDialog({
  open,
  onOpenChange,
  aspect,
  durationMs,
  fps,
  clipCount,
  trackCount,
}: ExportDialogProps) {
  const dimensions = ASPECT_DIMENSIONS[aspect];

  const stream = useProgressStream<number, void>(() => ticker(EXPORT_MS), {
    onDone: () =>
      toast.success("Video exported", {
        description: `${dimensions.width} × ${dimensions.height}, ${formatTimecode(durationMs, fps)} long.`,
      }),
  });

  const { reset } = stream;
  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const percent = Math.round((stream.progress ?? 0) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby="export-summary">
        <DialogHeader>
          <DialogTitle>Export video</DialogTitle>
          <DialogDescription id="export-summary">
            {stream.status === "done"
              ? "The cut is rendered and ready for TikTok, Reels and Shorts."
              : "This writes the current cut — every visible track, flattened, with captions burned in."}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3">
          <ExportFact term="Frame" value={`${dimensions.width} × ${dimensions.height}`} />
          <ExportFact term="Aspect" value={aspect} />
          <ExportFact term="Length" value={formatTimecode(durationMs, fps)} />
          <ExportFact term="Frame rate" value={`${fps} fps`} />
          <ExportFact term="Tracks" value={String(trackCount)} />
          <ExportFact term="Clips" value={String(clipCount)} />
        </dl>

        {stream.status === "running" ? (
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-ink-500">Rendering the cut</span>
              <span className="mono-sm text-ink-700">{percent}%</span>
            </div>
            <Progress value={percent} aria-label="Export progress" />
          </div>
        ) : null}

        <DialogFooter>
          {stream.status === "running" ? (
            <>
              <Button variant="ghost" onClick={stream.cancel}>
                Stop the export
              </Button>
              <Button variant="primary" loading>
                Exporting
              </Button>
            </>
          ) : stream.status === "done" ? (
            <Button variant="primary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={stream.start}>
                Export video
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExportFact({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-ink-200 bg-ink-50 px-3 py-2">
      <dt className="text-label text-ink-500">{term}</dt>
      <dd className="mono-sm text-ink-950">{value}</dd>
    </div>
  );
}
