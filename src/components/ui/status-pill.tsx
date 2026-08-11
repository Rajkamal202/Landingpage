"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconCheckCircle, IconClock, IconErrorCircle, IconEdit } from "@/components/icons";
import { ProgressRing } from "./progress";

/**
 * One status vocabulary across the studio grid, the bulk grid and the
 * workspace list. Two surfaces calling the same state "Processing" and
 * "Generating" is the kind of seam that makes a product feel assembled from
 * parts (SPEC §12: an action keeps its name through the whole flow).
 */
export type StatusValue = "draft" | "queued" | "generating" | "ready" | "failed";

const STATUS_LABEL: Record<StatusValue, string> = {
  draft: "Draft",
  queued: "Queued",
  generating: "Generating",
  ready: "Ready",
  failed: "Failed",
};

const STATUS_STYLE: Record<StatusValue, string> = {
  draft: "bg-ink-100 text-ink-500",
  queued: "bg-ink-100 text-ink-700",
  generating: "bg-brand-50 text-brand-700",
  ready: "bg-success/10 text-success-600",
  failed: "bg-danger/10 text-danger",
};

export function StatusPill({
  status,
  progress = 0,
  className,
}: {
  status: StatusValue;
  progress?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-label inline-flex h-6 items-center gap-1 rounded-pill px-2 font-medium",
        STATUS_STYLE[status],
        className,
      )}
    >
      {status === "generating" ? (
        <ProgressRing value={progress} size={16} strokeWidth={2} />
      ) : status === "ready" ? (
        <Icon glyph={IconCheckCircle} size={16} />
      ) : status === "failed" ? (
        <Icon glyph={IconErrorCircle} size={16} />
      ) : status === "queued" ? (
        <Icon glyph={IconClock} size={16} />
      ) : (
        <Icon glyph={IconEdit} size={16} />
      )}
      {status === "generating" ? `${Math.round(progress)}%` : STATUS_LABEL[status]}
    </span>
  );
}

export { STATUS_LABEL };
