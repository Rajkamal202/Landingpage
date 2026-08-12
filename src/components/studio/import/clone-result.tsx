"use client";

import { PLATFORM_LABEL, type CloneResult } from "@/lib/schemas";
import { formatDurationShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SceneStrip } from "./scene-strip";

const PACING_LABEL: Record<CloneResult["pacing"], string> = {
  fast: "Fast",
  medium: "Medium",
  slow: "Slow",
};

/** SPEC §8.1 — the summary the whole flow exists to produce. */
export function CloneResultCard({
  result,
  onOpenTimeline,
  onOpenBulk,
  onStartOver,
}: {
  result: CloneResult;
  onOpenTimeline: () => void;
  onOpenBulk: () => void;
  onStartOver: () => void;
}) {
  const stats: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Scenes", value: String(result.scenes.length) },
    { label: "Duration", value: formatDurationShort(result.durationMs) },
    { label: "Text layers", value: String(result.textLayers.length) },
    { label: "Overlays", value: String(result.overlayCount) },
    { label: "Aspect", value: result.aspect },
    { label: "Pacing", value: PACING_LABEL[result.pacing] },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="eyebrow text-ink-500">Video cloned</p>
          <h2 className="text-title-lg text-ink-950">
            {result.scenes.length} scenes, ready to edit
          </h2>
          <p className="text-body-sm truncate text-ink-500">{result.handle}</p>
        </div>
        <Badge tone="brand" size="md">
          {PLATFORM_LABEL[result.platform]}
        </Badge>
      </div>

      <dl className="grid grid-cols-3 gap-4 rounded-md bg-ink-50 p-4 sm:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-label text-ink-500">{stat.label}</dt>
            <dd className="mono-sm truncate text-ink-950">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <SceneStrip scenes={result.scenes} expectedCount={result.scenes.length} showDurations />

      <ul className="flex flex-col gap-2">
        {result.textLayers.slice(0, 3).map((layer) => (
          <li key={layer.id} className="flex items-center gap-3">
            <Badge tone="outline">{layer.role}</Badge>
            <span className="text-body-sm truncate text-ink-700">{layer.content}</span>
          </li>
        ))}
        {result.textLayers.length > 3 ? (
          <li className="text-body-sm text-ink-500">
            and {result.textLayers.length - 3} more text layers
          </li>
        ) : null}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={onOpenTimeline}>
          Open in timeline
        </Button>
        <Button variant="secondary" size="lg" onClick={onOpenBulk}>
          Send to bulk editor
        </Button>
        <Button variant="ghost" onClick={onStartOver} className="ml-auto">
          Start over
        </Button>
      </div>
    </div>
  );
}
