"use client";

import { useShortcut } from "@/lib/hooks/use-shortcuts";
import { newClipId, useTimelineStore, type TimelineStore } from "@/lib/stores/timeline";
import { createTextClip, NEW_CAPTION_MS } from "./tools";

/**
 * Every key the timeline binds, registered through the shared registry so the
 * `?` dialog documents exactly what exists (SPEC §11). Nothing here subscribes
 * to the store — handlers read it imperatively, so a playing transport does
 * not re-render the component that owns the bindings.
 */
const read = (): TimelineStore => useTimelineStore.getState();

export function TimelineShortcuts() {
  /* ── Playback ─────────────────────────────────────────────────────────── */
  useShortcut({
    keys: "space",
    label: "Play or pause",
    group: "Playback",
    handler: () => read().togglePlaying(),
  });
  useShortcut({
    keys: "arrowleft",
    label: "Step back one frame",
    group: "Playback",
    handler: () => read().stepFrames(-1),
  });
  useShortcut({
    keys: "arrowright",
    label: "Step forward one frame",
    group: "Playback",
    handler: () => read().stepFrames(1),
  });
  useShortcut({
    keys: "shift+arrowleft",
    label: "Jump back one second",
    group: "Playback",
    handler: () => {
      const state = read();
      state.setPlayhead(state.playheadMs - 1000);
    },
  });
  useShortcut({
    keys: "shift+arrowright",
    label: "Jump forward one second",
    group: "Playback",
    handler: () => {
      const state = read();
      state.setPlayhead(state.playheadMs + 1000);
    },
  });
  useShortcut({
    keys: "j",
    label: "Shuttle backwards, faster each press",
    group: "Playback",
    handler: () => read().shuttleBy(-1),
  });
  useShortcut({
    keys: "k",
    label: "Stop the shuttle",
    group: "Playback",
    handler: () => read().setShuttleRate(0),
  });
  useShortcut({
    keys: "l",
    label: "Shuttle forwards, faster each press",
    group: "Playback",
    handler: () => read().shuttleBy(1),
  });
  useShortcut({
    keys: "home",
    label: "Jump to the start",
    group: "Playback",
    handler: () => read().setPlayhead(0),
  });
  useShortcut({
    keys: "end",
    label: "Jump to the end",
    group: "Playback",
    handler: () => {
      const state = read();
      state.setPlayhead(state.durationMs);
    },
  });

  /* ── Editing ──────────────────────────────────────────────────────────── */
  useShortcut({
    keys: "s",
    label: "Split at the playhead",
    group: "Editing",
    handler: () => {
      const state = read();
      state.splitAt(state.playheadMs);
    },
  });
  useShortcut({
    keys: "mod+z",
    label: "Undo",
    group: "Editing",
    handler: () => read().undo(),
  });
  useShortcut({
    keys: "mod+shift+z",
    label: "Redo",
    group: "Editing",
    handler: () => read().redo(),
  });
  useShortcut({
    keys: "delete",
    label: "Delete the selected clips",
    group: "Editing",
    handler: () => read().deleteSelection(),
  });
  useShortcut({
    keys: "backspace",
    label: "Delete the selected clips",
    group: "Editing",
    hidden: true,
    handler: () => read().deleteSelection(),
  });
  useShortcut({
    keys: "mod+d",
    label: "Duplicate the selected clips",
    group: "Editing",
    handler: () => read().duplicateSelection(),
  });
  useShortcut({
    keys: ",",
    label: "Nudge the selection one frame earlier",
    group: "Editing",
    handler: () => {
      const state = read();
      state.nudgeSelection(-1000 / state.fps);
      state.commitGesture();
    },
  });
  useShortcut({
    keys: ".",
    label: "Nudge the selection one frame later",
    group: "Editing",
    handler: () => {
      const state = read();
      state.nudgeSelection(1000 / state.fps);
      state.commitGesture();
    },
  });
  useShortcut({
    keys: "[",
    label: "Trim the selection's start to the playhead",
    group: "Editing",
    handler: () => read().trimSelectionToPlayhead("start"),
  });
  useShortcut({
    keys: "]",
    label: "Trim the selection's end to the playhead",
    group: "Editing",
    handler: () => read().trimSelectionToPlayhead("end"),
  });
  useShortcut({
    keys: "t",
    label: "Add a caption at the playhead",
    group: "Editing",
    handler: () => {
      const state = read();
      const trackId = state.trackOrder.find((id) => state.tracks[id]?.kind === "text");
      if (!trackId) return;
      const startMs = Math.round(
        Math.min(state.playheadMs, Math.max(0, state.durationMs - NEW_CAPTION_MS)),
      );
      state.addClip(trackId, createTextClip(newClipId("text"), startMs, NEW_CAPTION_MS));
      state.requestPanelFocus();
    },
  });

  /* ── Selection ────────────────────────────────────────────────────────── */
  useShortcut({
    keys: "mod+a",
    label: "Select every clip",
    group: "Selection",
    handler: () => read().selectAll(),
  });
  useShortcut({
    keys: "escape",
    label: "Clear the selection",
    group: "Selection",
    handler: () => read().clearSelection(),
  });
  useShortcut({
    keys: "alt+arrowleft",
    label: "Select the previous clip on this track",
    group: "Selection",
    handler: () => read().selectStep(-1),
  });
  useShortcut({
    keys: "alt+arrowright",
    label: "Select the next clip on this track",
    group: "Selection",
    handler: () => read().selectStep(1),
  });
  useShortcut({
    keys: "alt+arrowup",
    label: "Select on the track above",
    group: "Selection",
    handler: () => read().selectTrackStep(-1),
  });
  useShortcut({
    keys: "alt+arrowdown",
    label: "Select on the track below",
    group: "Selection",
    handler: () => read().selectTrackStep(1),
  });
  useShortcut({
    keys: "enter",
    label: "Edit the selected clip's properties",
    group: "Selection",
    handler: () => read().requestPanelFocus(),
  });

  /* ── View ─────────────────────────────────────────────────────────────── */
  useShortcut({
    keys: "=",
    label: "Zoom in",
    group: "View",
    handler: () => read().zoomBy(1.5),
  });
  useShortcut({
    keys: "-",
    label: "Zoom out",
    group: "View",
    handler: () => read().zoomBy(1 / 1.5),
  });
  useShortcut({
    keys: "0",
    label: "Fit the whole project",
    group: "View",
    handler: () => read().zoomToFit(),
  });
  useShortcut({
    keys: "n",
    label: "Turn snapping on or off",
    group: "View",
    handler: () => read().toggleSnapping(),
  });

  return null;
}
