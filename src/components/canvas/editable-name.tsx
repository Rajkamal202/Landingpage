"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { NODE_LABEL, type CanvasNode } from "@/lib/schemas";
import { useCanvasStore } from "@/lib/stores/canvas";
import { withBase } from "./graph";

/**
 * The editable name in a node's header strip (SPEC §8.4).
 *
 * It is a button until you mean to rename it, which keeps the header a single
 * tab stop and makes the node reachable by keyboard: Tab lands here, Enter
 * opens the field, Escape abandons the edit. The button is also the canvas's
 * focus target for a node, so arrow-key navigation moves between these.
 */
export function EditableName({ node }: { node: CanvasNode }) {
  const replaceNode = useCanvasStore((state) => state.replaceNode);
  const endMerge = useCanvasStore((state) => state.endMerge);

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(node.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) setDraft(node.name);
  }, [editing, node.name]);

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name.length === 0 || name === node.name) return;
    replaceNode(withBase(node, { name }), "Rename node");
    endMerge();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label={`${NODE_LABEL[node.kind]} node name`}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(node.name);
            setEditing(false);
          }
        }}
        className={cn(
          "nodrag nopan min-w-0 flex-1 rounded-sm border border-brand-500 bg-surface px-1",
          "text-label text-ink-950 focus-visible:outline-none",
        )}
      />
    );
  }

  return (
    <button
      type="button"
      data-node-focus={node.id}
      title={node.name}
      aria-label={`${NODE_LABEL[node.kind]} node: ${node.name}. Press Enter to rename.`}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "F2") {
          event.preventDefault();
          event.stopPropagation();
          setEditing(true);
        }
      }}
      className={cn(
        "nodrag min-w-0 flex-1 truncate rounded-sm px-1 text-left",
        "text-label text-ink-950 transition-ui duration-(--dur-instant)",
        "hover:bg-ink-200 active:bg-ink-300",
      )}
    >
      {node.name}
    </button>
  );
}
