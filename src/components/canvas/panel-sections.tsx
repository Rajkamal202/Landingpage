"use client";

import * as React from "react";
import { NODE_LABEL, NODE_PORTS, type CanvasNode } from "@/lib/schemas";
import { useCanvasStore } from "@/lib/stores/canvas";
import { DragNumberInput } from "@/components/ui/drag-number-input";
import { Input } from "@/components/ui/input";
import { PanelSection, PropertyRow } from "@/components/ui/property-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import { downstreamOf, outputPort, withBase } from "./graph";

const STATUS_TONE = {
  idle: "draft",
  queued: "queued",
  running: "generating",
  ready: "ready",
  failed: "failed",
} as const;

/** Name, kind, live status and position — the same four for every node. */
export function NodeSection({ node }: { node: CanvasNode }) {
  const replaceNode = useCanvasStore((state) => state.replaceNode);
  const endMerge = useCanvasStore((state) => state.endMerge);
  const nameId = React.useId();

  const move = (x: number, y: number) => {
    replaceNode(withBase(node, { position: { x, y } }), "Move node", `position:${node.id}`);
  };

  return (
    <PanelSection title="Node">
      <PropertyRow label="Name" htmlFor={nameId}>
        <Input
          id={nameId}
          size="sm"
          value={node.name}
          onChange={(event) => {
            replaceNode(withBase(node, { name: event.target.value }), "Rename node", `name:${node.id}`);
          }}
          onBlur={endMerge}
        />
      </PropertyRow>

      <PropertyRow label="Kind">
        <div className="flex h-control-sm items-center gap-2">
          <span className="text-body-sm text-ink-700">{NODE_LABEL[node.kind]}</span>
          <StatusPill status={STATUS_TONE[node.status]} progress={node.progress} />
        </div>
      </PropertyRow>

      <PropertyRow label="Position" hint="Drag either number sideways to scrub it.">
        <div className="flex gap-2">
          <DragNumberInput
            ariaLabel="Position from the left"
            value={node.position.x}
            step={8}
            unit="x"
            onValueChange={(x) => move(x, node.position.y)}
            onCommit={endMerge}
          />
          <DragNumberInput
            ariaLabel="Position from the top"
            value={node.position.y}
            step={8}
            unit="y"
            onValueChange={(y) => move(node.position.x, y)}
            onCommit={endMerge}
          />
        </div>
      </PropertyRow>
    </PanelSection>
  );
}

/**
 * Wiring, without a pointer.
 *
 * Dragging a wire is the primary gesture, so SPEC §11 requires an equivalent.
 * Each input port gets a list of the nodes that could legally feed it —
 * matching port type, no cycle — which doubles as the fastest way to rewire a
 * graph once it is more than a handful of nodes wide.
 */
export function ConnectionsSection({ node }: { node: CanvasNode }) {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const setInput = useCanvasStore((state) => state.setInput);

  const inputs = NODE_PORTS[node.kind].inputs;
  const blocked = React.useMemo(() => downstreamOf(edges, [node.id]), [edges, node.id]);
  if (inputs.length === 0) return null;

  return (
    <PanelSection title="Connections">
      {inputs.map((port) => {
        const current = edges.find(
          (edge) => edge.target === node.id && edge.targetHandle === port.id,
        );
        const options = nodes.filter(
          (candidate) =>
            !blocked.has(candidate.id) && outputPort(candidate.kind, null)?.type === port.type,
        );

        return (
          <PropertyRow key={port.id} label={port.label}>
            <Select
              value={current?.source ?? "none"}
              onValueChange={(value) => setInput(node.id, port.id, value === "none" ? null : value)}
            >
              <SelectTrigger size="sm" aria-label={`${port.label} input`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not connected</SelectItem>
                {options.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyRow>
        );
      })}
      {inputs.every(
        (port) => !edges.some((edge) => edge.target === node.id && edge.targetHandle === port.id),
      ) ? (
        <p className="text-body-sm text-ink-400">
          Nothing feeds this node yet. Pick a source above, or drag a wire from another node&apos;s
          output port.
        </p>
      ) : null}
    </PanelSection>
  );
}
