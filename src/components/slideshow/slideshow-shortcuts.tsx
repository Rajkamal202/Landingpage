"use client";

import { useShortcut } from "@/lib/hooks/use-shortcuts";

/**
 * Every key this editor answers to, registered through the shared registry so
 * the `?` dialog documents exactly what is bound (SPEC §11). Nothing here
 * writes its own help UI.
 *
 * Two deliberate calls:
 *
 * 1. **Tab is documented but not bound.** Layers are real `<button>`s, so Tab
 *    already cycles them in document order and then carries on to the panel.
 *    Binding it would mean calling `preventDefault()` on every Tab press in the
 *    app, trapping keyboard users on the canvas — a worse outcome than the one
 *    the shortcut exists to produce. It is registered with `enabled: false` so
 *    the dialog still lists it and the behaviour stays discoverable.
 *
 * 2. **The Shift variants are hidden.** Registering eight arrow entries would
 *    bury the rest of the list, so the four visible rows say "hold Shift for
 *    10px" and the Shift bindings ride along hidden.
 */
export interface SlideshowShortcutHandlers {
  nudge: (dx: number, dy: number) => void;
  duplicateLayer: () => void;
  deleteLayer: () => void;
  deselect: () => void;
  addText: () => void;
  addImage: () => void;
  goToSlide: (delta: number) => void;
  moveSlide: (delta: number) => void;
  undo: () => void;
  redo: () => void;
}

const NUDGE_STEP = 1;
const NUDGE_STEP_LARGE = 10;

/**
 * Canvas keys must not fire while focus is in the property panel — an arrow
 * press on the rotation field has to rotate, not move — or while a dialog owns
 * the screen.
 */
function canvasKeysBlocked(): boolean {
  if (typeof document === "undefined") return true;
  if (document.querySelector('[role="dialog"][data-state="open"]') !== null) return true;
  const active = document.activeElement;
  return active instanceof HTMLElement && active.closest('[data-canvas-keys="off"]') !== null;
}

export function SlideshowShortcuts(handlers: SlideshowShortcutHandlers) {
  const {
    nudge,
    duplicateLayer,
    deleteLayer,
    deselect,
    addText,
    addImage,
    goToSlide,
    moveSlide,
    undo,
    redo,
  } = handlers;

  const guarded = (run: () => void) => () => {
    if (canvasKeysBlocked()) return;
    run();
  };

  /* ── Layers ──────────────────────────────────────────────────────────── */

  useShortcut({
    keys: "ArrowLeft",
    label: "Nudge the layer left (hold Shift for 10px)",
    group: "Layers",
    handler: guarded(() => nudge(-NUDGE_STEP, 0)),
  });
  useShortcut({
    keys: "ArrowRight",
    label: "Nudge the layer right (hold Shift for 10px)",
    group: "Layers",
    handler: guarded(() => nudge(NUDGE_STEP, 0)),
  });
  useShortcut({
    keys: "ArrowUp",
    label: "Nudge the layer up (hold Shift for 10px)",
    group: "Layers",
    handler: guarded(() => nudge(0, -NUDGE_STEP)),
  });
  useShortcut({
    keys: "ArrowDown",
    label: "Nudge the layer down (hold Shift for 10px)",
    group: "Layers",
    handler: guarded(() => nudge(0, NUDGE_STEP)),
  });

  useShortcut({
    keys: "shift+ArrowLeft",
    label: "Nudge the layer 10px left",
    group: "Layers",
    hidden: true,
    handler: guarded(() => nudge(-NUDGE_STEP_LARGE, 0)),
  });
  useShortcut({
    keys: "shift+ArrowRight",
    label: "Nudge the layer 10px right",
    group: "Layers",
    hidden: true,
    handler: guarded(() => nudge(NUDGE_STEP_LARGE, 0)),
  });
  useShortcut({
    keys: "shift+ArrowUp",
    label: "Nudge the layer 10px up",
    group: "Layers",
    hidden: true,
    handler: guarded(() => nudge(0, -NUDGE_STEP_LARGE)),
  });
  useShortcut({
    keys: "shift+ArrowDown",
    label: "Nudge the layer 10px down",
    group: "Layers",
    hidden: true,
    handler: guarded(() => nudge(0, NUDGE_STEP_LARGE)),
  });

  useShortcut({
    keys: "Tab",
    label: "Move between layers on the canvas",
    group: "Layers",
    // Documented, not bound — see the note at the top of this file.
    enabled: false,
    handler: () => undefined,
  });

  useShortcut({
    keys: "mod+d",
    label: "Duplicate the selected layer",
    group: "Layers",
    handler: guarded(duplicateLayer),
  });
  useShortcut({
    keys: "Delete",
    label: "Delete the selected layer",
    group: "Layers",
    handler: guarded(deleteLayer),
  });
  useShortcut({
    keys: "Backspace",
    label: "Delete the selected layer",
    group: "Layers",
    hidden: true,
    handler: guarded(deleteLayer),
  });
  useShortcut({
    keys: "Escape",
    label: "Deselect",
    group: "Layers",
    handler: guarded(deselect),
  });
  useShortcut({
    keys: "t",
    label: "Add a text layer",
    group: "Layers",
    handler: guarded(addText),
  });
  useShortcut({
    keys: "i",
    label: "Add an image layer from the library",
    group: "Layers",
    handler: guarded(addImage),
  });

  /* ── Slides ──────────────────────────────────────────────────────────── */

  useShortcut({
    keys: "alt+ArrowUp",
    label: "Go to the previous slide",
    group: "Slides",
    handler: () => goToSlide(-1),
  });
  useShortcut({
    keys: "alt+ArrowDown",
    label: "Go to the next slide",
    group: "Slides",
    handler: () => goToSlide(1),
  });
  useShortcut({
    keys: "alt+shift+ArrowUp",
    label: "Move this slide up the rail",
    group: "Slides",
    handler: () => moveSlide(-1),
  });
  useShortcut({
    keys: "alt+shift+ArrowDown",
    label: "Move this slide down the rail",
    group: "Slides",
    handler: () => moveSlide(1),
  });

  /* ── History ─────────────────────────────────────────────────────────── */

  // Undo stays bound inside text fields. The panel's text input is controlled,
  // so the browser's own undo has nothing useful to restore there — leaving it
  // to the native stack would make ⌘Z silently do nothing at the exact moment
  // someone wants their sentence back.
  useShortcut({
    keys: "mod+z",
    label: "Undo",
    group: "History",
    skipInInputs: false,
    handler: undo,
  });
  useShortcut({
    keys: "mod+shift+z",
    label: "Redo",
    group: "History",
    skipInInputs: false,
    handler: redo,
  });

  return null;
}
