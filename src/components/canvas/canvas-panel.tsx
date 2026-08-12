"use client";

import { useCanvasStore } from "@/lib/stores/canvas";
import { PropertyPanel } from "@/components/ui/property-row";
import { EmptyState } from "@/components/ui/empty-state";
import { IconNode } from "@/components/icons";
import { ConnectionsSection, NodeSection } from "./panel-sections";

/**
 * SPEC §8.4 — the 280px right panel, contextual to the selection.
 *
 * Built only from PropertyPanel / PanelSection / PropertyRow, which is what
 * makes it read as the same panel as the timeline's and the slideshow's rather
 * than a third designer's take on the same idea.
 */
export function CanvasPanel() {
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const nodes = useCanvasStore((state) => state.nodes);

  const selected = nodes.filter((node) => selectedIds.includes(node.id));
  const single = selected.length === 1 ? selected[0] : undefined;

  return (
    <PropertyPanel aria-label="Node properties">
      {single ? (
        <>
          <NodeSection node={single} />
          <ConnectionsSection node={single} />
        </>
      ) : selected.length > 1 ? (
        <div className="flex flex-col gap-2 p-3">
          <p className="text-label text-ink-500">Selection</p>
          <p className="text-body-sm text-ink-700">
            {selected.length} nodes selected. Pick a single node to edit its settings, or press
            ⌘Enter to run this branch.
          </p>
        </div>
      ) : (
        <EmptyState
          size="sm"
          glyph={IconNode}
          title="Nothing selected"
          description="Click a node to edit its model, references and prompt here."
          action={
            <p className="text-body-sm text-ink-400">
              Double-click the canvas to add a node.
            </p>
          }
        />
      )}
    </PropertyPanel>
  );
}
