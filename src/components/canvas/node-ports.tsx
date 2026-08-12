"use client";

import { Handle, Position } from "@xyflow/react";
import { NODE_PORTS, PORT_COLOR_VAR, type NodeKind } from "@/lib/schemas";

/**
 * The typed ports on a node card (SPEC §8.4).
 *
 * `NODE_PORTS` is the authority on what each kind accepts and emits, so the
 * rail is derived rather than declared per node — a port cannot exist in the
 * UI that the connection rules do not know about.
 *
 * Each row is 20px tall and the handle sits on the card's edge, vertically
 * centred on its own label. Inputs read left, outputs read right, which is
 * the direction the graph flows.
 */
export function PortRail({ kind }: { kind: NodeKind }) {
  const { inputs, outputs } = NODE_PORTS[kind];
  if (inputs.length === 0 && outputs.length === 0) return null;

  return (
    <div className="flex items-start justify-between gap-2 border-b border-ink-200 py-2">
      <ul className="flex min-w-0 flex-1 flex-col">
        {inputs.map((port) => (
          <li key={port.id} className="relative flex h-5 items-center pl-3">
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              className="canvas-port"
              // dynamic: the ring colour is resolved from the typed-port table
              // (PORT_COLOR_VAR). It is data about the port, not a styling
              // decision taken at this call site.
              style={{ borderColor: PORT_COLOR_VAR[port.type] }}
            />
            <span className="text-label truncate text-ink-500">{port.label}</span>
          </li>
        ))}
      </ul>

      <ul className="flex min-w-0 flex-1 flex-col items-end">
        {outputs.map((port) => (
          <li key={port.id} className="relative flex h-5 w-full items-center justify-end pr-3">
            <span className="text-label truncate text-ink-500">{port.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              className="canvas-port"
              // dynamic: see the note on the input handle above.
              style={{ borderColor: PORT_COLOR_VAR[port.type] }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
