"use client";

import * as React from "react";
import { useCanvasStore } from "@/lib/stores/canvas";
import { useShortcut } from "@/lib/hooks/use-shortcuts";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { IconGenerate, IconPlus, IconRedo, IconUndo } from "@/components/icons";

/**
 * SPEC §8.4 top bar. Every shortcut is registered through `useShortcut` so it
 * appears in the global `?` dialog — the editor documents itself rather than
 * carrying its own help sheet.
 */
export function CanvasToolbar({
  projectName,
  onAddNode,
}: {
  projectName: string;
  onAddNode: () => void;
}) {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const runBranch = useCanvasStore((state) => state.runBranch);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const [running, setRunning] = React.useState(false);

  const run = React.useCallback(async () => {
    if (running) return;
    setRunning(true);
    try {
      await runBranch();
      toast.success("Branch finished", { description: "Outputs are attached to their nodes." });
    } catch {
      toast.error("The branch didn't finish", {
        description: "One node failed. Open it to see what it needs, then run again.",
      });
    } finally {
      setRunning(false);
    }
  }, [runBranch, running]);

  useShortcut({ keys: "mod+z", label: "Undo", group: "Editing", handler: undo });
  useShortcut({ keys: "mod+shift+z", label: "Redo", group: "Editing", handler: redo });
  useShortcut({
    keys: "mod+Enter",
    label: "Run the selected branch",
    group: "Generation",
    handler: () => void run(),
  });

  return (
    <>
      <h1 className="text-body-md truncate font-medium text-ink-950">{projectName}</h1>

      <Toolbar ariaLabel="Canvas history" className="ml-4">
        <Tooltip content="Undo">
          <IconButton label="Undo" glyph={IconUndo} size="sm" onClick={undo} />
        </Tooltip>
        <Tooltip content="Redo">
          <IconButton label="Redo" glyph={IconRedo} size="sm" onClick={redo} />
        </Tooltip>
        <ToolbarSeparator />
        <Tooltip content="Add a node">
          <IconButton label="Add a node" glyph={IconPlus} size="sm" onClick={onAddNode} />
        </Tooltip>
      </Toolbar>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          iconStart={IconGenerate}
          loading={running}
          disabled={selectedIds.length === 0 && !running}
          onClick={() => void run()}
        >
          {running ? "Running branch" : "Run branch"}
        </Button>
      </div>
    </>
  );
}
