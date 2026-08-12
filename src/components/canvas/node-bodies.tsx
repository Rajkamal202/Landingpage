"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { formatDurationShort } from "@/lib/format";
import { hasAssetDragPayload, readAssetDragPayload } from "@/lib/dnd/payload";
import type { CanvasNode, NodeKind } from "@/lib/schemas";
import { useCanvasStore } from "@/lib/stores/canvas";
import { IconDownload, IconFolder } from "@/components/icons";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { AssetThumb } from "@/components/ui/asset-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { Waveform } from "@/components/ui/waveform";
import { useAsset, useCanvasData } from "./canvas-data";
import { promptToTokens } from "./graph";
import { ResultFrame } from "./node-shell";

/**
 * The body preview for each of the seven node kinds (SPEC §8.4).
 *
 * The generative kinds render their *output* as the body, which is the whole
 * point of a graph you can read at a glance — you should be able to see what
 * a branch produced without selecting anything.
 */
export type NodeOf<K extends NodeKind> = Extract<CanvasNode, { kind: K }>;

/* ── Source ────────────────────────────────────────────────────────────── */

export function SourceBody({ node }: { node: NodeOf<"source"> }) {
  const asset = useAsset(node.assetId);
  const replaceNode = useCanvasStore((state) => state.replaceNode);
  const [picking, setPicking] = React.useState(false);
  const [over, setOver] = React.useState(false);

  const choose = (assetId: string, name: string) => {
    replaceNode({ ...node, assetId, name, status: "ready", progress: 100 }, "Set source asset");
  };

  return (
    <div
      className="nodrag flex flex-col gap-2"
      onDragOver={(event) => {
        if (!hasAssetDragPayload(event.dataTransfer)) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        setOver(false);
        const payload = readAssetDragPayload(event.dataTransfer);
        if (!payload) return;
        event.preventDefault();
        choose(payload.assetId, payload.name);
      }}
    >
      {asset ? (
        <AssetThumb asset={asset} draggable={false} className="h-32 w-full" />
      ) : (
        <p
          className={cn(
            "text-body-sm flex h-32 items-center justify-center rounded-md border border-dashed",
            "px-3 text-center transition-ui duration-(--dur-fast)",
            over ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500",
          )}
        >
          Drop a library asset here, or choose one below.
        </p>
      )}

      <Button variant="secondary" size="sm" block iconStart={IconFolder} onClick={() => setPicking(true)}>
        {asset ? "Replace asset" : "Choose asset"}
      </Button>

      <AssetPickerDialog
        open={picking}
        onOpenChange={setPicking}
        onSelect={(picked) => choose(picked.id, picked.name)}
        title="Choose a source asset"
        description="Pick the file this branch starts from. You can also drag one in from the library panel."
      />
    </div>
  );
}

/* ── Prompt ────────────────────────────────────────────────────────────── */

export function PromptBody({ node }: { node: NodeOf<"prompt"> }) {
  const { assets } = useCanvasData();
  const tokens = React.useMemo(
    () => promptToTokens(node.text, node.mentions, (id) => assets.get(id)?.name),
    [node.text, node.mentions, assets],
  );

  if (node.text.length === 0) {
    return (
      <p className="text-body-sm text-ink-500">
        No prompt yet. Write one in the properties panel — type @ to reference a library asset.
      </p>
    );
  }

  return (
    <p className="text-body-sm max-h-20 overflow-hidden text-ink-700">
      {tokens.map((token, index) =>
        token.type === "mention" ? (
          <span key={`${token.assetId}-${index}`} className="mention-chip">
            @{token.label}
          </span>
        ) : (
          <React.Fragment key={`text-${index}`}>{token.value}</React.Fragment>
        ),
      )}
    </p>
  );
}

/* ── Image ─────────────────────────────────────────────────────────────── */

export function ImageGenBody({ node }: { node: NodeOf<"image-gen"> }) {
  const output = useAsset(node.outputAssetId);
  const { models } = useCanvasData();
  const model = models.find((candidate) => candidate.id === node.modelId);
  const references = node.referenceAssetIds.filter((id) => id !== null).length;

  return (
    <>
      <ResultFrame
        status={node.status}
        progress={node.progress}
        empty="Run this branch and the frame appears here."
      >
        {output ? <AssetThumb asset={output} draggable={false} className="h-32 w-full" /> : null}
      </ResultFrame>
      <div className="flex items-center justify-between gap-2">
        <span className="mono-sm truncate text-ink-500">
          {node.size} · {model?.name ?? "No model chosen"}
        </span>
        <Badge tone={references > 0 ? "brand" : "neutral"} size="sm">
          {references} of 4 refs
        </Badge>
      </div>
    </>
  );
}

/* ── Video ─────────────────────────────────────────────────────────────── */

export function VideoGenBody({ node }: { node: NodeOf<"video-gen"> }) {
  const output = useAsset(node.outputAssetId);
  const start = useAsset(node.startFrameAssetId);
  const { models } = useCanvasData();
  const model = models.find((candidate) => candidate.id === node.modelId);

  return (
    <>
      <ResultFrame
        status={node.status}
        progress={node.progress}
        empty="Wire in a start frame, then run this branch."
      >
        {output ? (
          <AssetThumb asset={output} draggable={false} className="h-32 w-full" />
        ) : start ? (
          <AssetThumb
            asset={start}
            draggable={false}
            className="h-32 w-full opacity-60"
            badge={<Badge tone="neutral" size="sm">Start frame</Badge>}
          />
        ) : null}
      </ResultFrame>
      <span className="mono-sm truncate text-ink-500">
        {formatDurationShort(node.durationMs)} · {node.aspect} · {model?.name ?? "No model chosen"}
      </span>
    </>
  );
}

/* ── Voice ─────────────────────────────────────────────────────────────── */

export function VoiceBody({ node }: { node: NodeOf<"voice"> }) {
  const output = useAsset(node.outputAssetId);
  const { actors } = useCanvasData();
  const actor = actors.find((candidate) => candidate.id === node.actorId);

  return (
    <>
      <ResultFrame
        status={node.status}
        progress={node.progress}
        empty="Pick an actor and write a script, then run this branch."
      >
        {output?.peaks ? (
          <div className="h-32 w-full rounded-md bg-ink-50 p-3">
            <Waveform peaks={output.peaks} ariaLabel={`Waveform for ${output.name}`} />
          </div>
        ) : null}
      </ResultFrame>
      <span className="mono-sm truncate text-ink-500">
        {actor?.name ?? "No actor chosen"} · {node.speed.toFixed(2)}× speed
      </span>
      {node.script.length > 0 ? (
        <p className="text-body-sm max-h-20 overflow-hidden text-ink-700">{node.script}</p>
      ) : null}
    </>
  );
}

/* ── Compose ───────────────────────────────────────────────────────────── */

export function ComposeBody({ node }: { node: NodeOf<"compose"> }) {
  const connected = useCanvasStore(
    React.useCallback(
      (state) =>
        state.edges
          .filter((edge) => edge.target === node.id)
          .map((edge) => edge.targetHandle)
          .join(","),
      [node.id],
    ),
  );
  const handles = connected.length > 0 ? connected.split(",") : [];

  return (
    <>
      <p className="text-body-md truncate text-ink-950">{node.sceneName}</p>
      <div className="flex flex-wrap gap-1">
        <Badge tone={handles.includes("video") ? "success" : "neutral"} size="sm">
          {handles.includes("video") ? "Video in" : "No video yet"}
        </Badge>
        <Badge tone={handles.includes("audio") ? "success" : "neutral"} size="sm">
          {handles.includes("audio") ? "Audio in" : "No audio yet"}
        </Badge>
      </div>
    </>
  );
}

/* ── Output ────────────────────────────────────────────────────────────── */

export function OutputBody({ node }: { node: NodeOf<"output"> }) {
  const asset = useAsset(node.outputAssetId);

  const exportScene = () => {
    if (!asset) return;
    toast.success("Scene exported", {
      description: `${node.name} is ready to download from your library.`,
    });
  };

  return (
    <>
      <ResultFrame
        status={node.status}
        progress={node.progress}
        empty="Nothing to export yet. Run the branch that feeds this node."
      >
        {asset ? <AssetThumb asset={asset} draggable={false} className="h-32 w-full" /> : null}
      </ResultFrame>
      <div className="nodrag">
        <Tooltip
          disabledTrigger={!asset}
          content={asset ? "" : "Run the branch first — there's nothing to export yet."}
        >
          <Button size="sm" block iconStart={IconDownload} disabled={!asset} onClick={exportScene}>
            Export scene
          </Button>
        </Tooltip>
      </div>
    </>
  );
}
