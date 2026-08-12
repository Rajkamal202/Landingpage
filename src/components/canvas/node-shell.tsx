"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { dur } from "@/lib/motion/tokens";
import { shake } from "@/lib/motion/variants";
import { NODE_LABEL, type CanvasNode, type NodeStatus } from "@/lib/schemas";
import { useCanvasStore } from "@/lib/stores/canvas";
import { Icon } from "@/components/icon";
import { IconCheckCircle, IconClock, IconErrorCircle } from "@/components/icons";
import { ProgressRing } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableName } from "./editable-name";
import { NODE_GLYPH } from "./graph";
import { PortRail } from "./node-ports";

/**
 * The card every node kind is drawn on (SPEC §8.4): white, `--radius-lg`,
 * `--elev-2`, a 32px header strip carrying a type icon and an editable name,
 * then the typed ports, then the body preview.
 *
 * A node that just refused a connection shakes. The shake is the `shake`
 * variant from the shared motion set, so it matches every other rejection in
 * the product and stops under `prefers-reduced-motion`.
 */
export interface NodeShellProps {
  node: CanvasNode;
  selected: boolean;
  children: React.ReactNode;
}

export function NodeShell({ node, selected, children }: NodeShellProps) {
  const rejectionId = useCanvasStore((state) =>
    state.rejection?.nodeId === node.id ? state.rejection.id : null,
  );
  const [shaking, setShaking] = React.useState(false);

  React.useEffect(() => {
    if (rejectionId === null) return;
    setShaking(true);
    const timer = window.setTimeout(() => setShaking(false), dur.base * 1000);
    return () => window.clearTimeout(timer);
  }, [rejectionId]);

  return (
    <motion.div
      variants={shake}
      initial="idle"
      animate={shaking ? "shake" : "idle"}
      aria-label={`${NODE_LABEL[node.kind]} node: ${node.name}`}
      className={cn(
        "w-panel rounded-lg border bg-surface",
        "transition-ui duration-(--dur-fast)",
        selected
          ? "border-brand-500 shadow-elev-3"
          : "border-ink-200 shadow-elev-2 hover:border-ink-300",
      )}
    >
      <header className="flex h-8 items-center gap-2 rounded-t-lg border-b border-ink-200 bg-ink-50 px-2">
        <Icon glyph={NODE_GLYPH[node.kind]} size={16} className="text-ink-400" />
        <EditableName node={node} />
        <NodeStatusMark status={node.status} progress={node.progress} />
      </header>

      <PortRail kind={node.kind} />

      <div className="flex flex-col gap-2 p-2">{children}</div>
    </motion.div>
  );
}

export function NodeStatusMark({ status, progress }: { status: NodeStatus; progress: number }) {
  if (status === "running") {
    return (
      <span className="shrink-0 text-brand-500">
        <ProgressRing
          value={progress}
          size={16}
          strokeWidth={2}
          label={`Generating, ${Math.round(progress)} per cent done`}
        />
      </span>
    );
  }
  if (status === "queued") {
    return <Icon glyph={IconClock} size={16} className="text-ink-400" label="Queued" />;
  }
  if (status === "ready") {
    return <Icon glyph={IconCheckCircle} size={16} className="text-success" label="Ready" />;
  }
  if (status === "failed") {
    return <Icon glyph={IconErrorCircle} size={16} className="text-danger" label="Failed" />;
  }
  return null;
}

/**
 * The body slot shared by every node that renders a result: a skeleton while
 * the run is in flight, the output once it lands, and an honest empty frame
 * with the reason before either.
 */
export function ResultFrame({
  status,
  progress,
  empty,
  children,
}: {
  status: NodeStatus;
  progress: number;
  empty: string;
  children: React.ReactNode | null;
}) {
  if (status === "running" || status === "queued") {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-md">
        <Skeleton className="absolute inset-0 rounded-md" />
        <span className="absolute inset-0 grid place-items-center text-brand-500">
          <ProgressRing value={progress} size={24} strokeWidth={2} />
        </span>
      </div>
    );
  }

  if (children) return <>{children}</>;

  return (
    <p
      className={cn(
        "text-body-sm flex h-32 items-center justify-center rounded-md border border-dashed",
        "border-ink-200 px-3 text-center text-ink-400",
      )}
    >
      {empty}
    </p>
  );
}
