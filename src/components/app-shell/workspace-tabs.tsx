"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "motion/react";
import { cn } from "@/lib/cn";
import type { WorkspaceTab } from "@/lib/schemas";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import { Icon } from "@/components/icon";
import { IconClose, IconGraph, IconSlideshow, IconVideo } from "@/components/icons";

/**
 * SPEC §7.1 — projects are tabs, not a sidebar tree.
 *
 * Reorder by drag (Motion layout animation), double-click to rename inline,
 * middle-click to close, ✕ on hover, horizontal overflow with fade masks.
 * Every mouse gesture has a keyboard equivalent: the tab strip is a real
 * tablist, so arrow keys move between tabs and Delete closes one.
 */
const KIND_ICON = {
  video: IconVideo,
  slideshow: IconSlideshow,
  canvas: IconGraph,
} as const;

const SURFACE_PATH: Record<WorkspaceTab["surface"], string> = {
  studio: "studio",
  timeline: "timeline",
  slideshow: "slideshow",
  canvas: "canvas",
  bulk: "bulk",
};

export function WorkspaceTabs() {
  const router = useRouter();
  const tabs = useWorkspaceStore((state) => state.tabs);
  const activeProjectId = useWorkspaceStore((state) => state.activeProjectId);
  const reorderTabs = useWorkspaceStore((state) => state.reorderTabs);
  const closeTab = useWorkspaceStore((state) => state.closeTab);
  const renameTab = useWorkspaceStore((state) => state.renameTab);
  const setActive = useWorkspaceStore((state) => state.setActive);

  const goTo = React.useCallback(
    (tab: WorkspaceTab) => {
      setActive(tab.projectId);
      router.push(
        `/app/p/${tab.projectId}/${SURFACE_PATH[tab.surface]}` as Parameters<
          typeof router.push
        >[0],
      );
    },
    [router, setActive],
  );

  const onClose = React.useCallback(
    (tab: WorkspaceTab) => {
      const remaining = tabs.filter((candidate) => candidate.projectId !== tab.projectId);
      closeTab(tab.projectId);
      if (activeProjectId !== tab.projectId) return;
      const next = remaining[0];
      if (next) goTo(next);
      else router.push("/app");
    },
    [tabs, closeTab, activeProjectId, goTo, router],
  );

  if (tabs.length === 0) {
    // Hidden on narrow viewports: truncated to "No ope…" it says nothing and
    // costs the top bar a third of its width. The + button is the affordance.
    return (
      <p className="text-body-sm hidden truncate px-2 text-ink-500 sm:block">
        No open projects. Open one from the workspace to start a tab.
      </p>
    );
  }

  return (
    <Reorder.Group
      as="div"
      axis="x"
      values={tabs}
      onReorder={reorderTabs}
      role="tablist"
      aria-label="Open projects"
      aria-orientation="horizontal"
      className="flex min-w-0 items-center gap-1"
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.projectId}
          tab={tab}
          active={tab.projectId === activeProjectId}
          onSelect={() => goTo(tab)}
          onClose={() => onClose(tab)}
          onRename={(name) => renameTab(tab.projectId, name)}
        />
      ))}
    </Reorder.Group>
  );
}

interface TabItemProps {
  tab: WorkspaceTab;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
}

function TabItem({ tab, active, onSelect, onClose, onRename }: TabItemProps) {
  const controls = useDragControls();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(tab.name);
  const renameRef = React.useRef<HTMLInputElement>(null);

  // Focus deliberately, on the frame the field appears, rather than with
  // `autoFocus` — the user asked for this field by double-clicking, so moving
  // focus is expected, and this keeps it out of the initial-render path.
  React.useEffect(() => {
    if (editing) renameRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== tab.name) onRename(next);
    else setDraft(tab.name);
  };

  return (
    <Reorder.Item
      value={tab}
      dragListener={false}
      dragControls={controls}
      as="div"
      className={cn(
        "group relative flex h-8 shrink-0 items-center gap-2 rounded-md pl-2 pr-1",
        "transition-ui duration-(--dur-instant)",
        active ? "bg-ink-100 text-ink-950" : "text-ink-500 hover:bg-ink-50 hover:text-ink-700",
      )}
    >
      <Icon glyph={KIND_ICON[tab.kind]} size={16} className="shrink-0" />

      {editing ? (
        <input
          ref={renameRef}
          value={draft}
          aria-label={`Rename ${tab.name}`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") {
              setDraft(tab.name);
              setEditing(false);
            }
          }}
          className="text-body-sm w-32 min-w-0 rounded-sm bg-surface px-1 text-ink-950 ring-focus"
        />
      ) : (
        <button
          type="button"
          role="tab"
          aria-selected={active}
          onClick={onSelect}
          onDoubleClick={() => setEditing(true)}
          onPointerDown={(event) => {
            // Drag from the label, but only with the left button, so the
            // context menu and middle-click close still work.
            if (event.button === 0) controls.start(event);
          }}
          onAuxClick={(event) => {
            if (event.button === 1) {
              event.preventDefault();
              onClose();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Delete" || event.key === "Backspace") {
              event.preventDefault();
              onClose();
            }
          }}
          className="text-body-sm max-w-32 truncate rounded-sm focus-visible:ring-focus"
        >
          {tab.name}
        </button>
      )}

      <button
        type="button"
        aria-label={`Close ${tab.name}`}
        onClick={onClose}
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-sm text-ink-500",
          "transition-ui duration-(--dur-instant)",
          "hover:bg-ink-200 hover:text-ink-950",
          // Always present for keyboard and touch; revealed on hover for mouse.
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          "[@media(pointer:coarse)]:opacity-100",
        )}
      >
        <Icon glyph={IconClose} size={16} />
      </button>
    </Reorder.Item>
  );
}
