"use client";

import * as React from "react";
import { NODE_LABEL, type NodeKind } from "@/lib/schemas";
import { CommandPalette, type CommandAction } from "@/components/ui/command-palette";
import { NODE_BLURB, NODE_GLYPH, NODE_KINDS } from "./graph";

/**
 * The node library (SPEC §8.4) — the shared searchable palette, not a
 * bespoke list. It opens from the toolbar's `+`, from a double-click on empty
 * canvas, from dropping a wire on nothing, and from ⌘K.
 */
const GROUP: Record<NodeKind, string> = {
  source: "Inputs",
  prompt: "Inputs",
  "image-gen": "Generate",
  "video-gen": "Generate",
  voice: "Generate",
  compose: "Assemble",
  output: "Assemble",
};

export function NodeLibrary({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (kind: NodeKind) => void;
}) {
  const actions = React.useMemo<CommandAction[]>(
    () =>
      NODE_KINDS.map((kind) => ({
        id: kind,
        label: `${NODE_LABEL[kind]} node`,
        description: NODE_BLURB[kind],
        group: GROUP[kind],
        glyph: NODE_GLYPH[kind],
        onSelect: () => onAdd(kind),
      })),
    [onAdd],
  );

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      actions={actions}
      title="Node library"
      placeholder="Search nodes — image, voice, export"
      emptyMessage="No node matches that. Try image, voice, or export."
    />
  );
}
