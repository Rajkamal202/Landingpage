"use client";

import { create } from "zustand";
import type { AspectRatio, Clip, TextClipStyle, TimelineDoc, Track, TrackKind } from "@/lib/schemas";
import {
  commitMerge,
  createCommandStack,
  execute,
  redo,
  undo,
  type Command,
  type CommandStackState,
} from "./command-stack";

/**
 * The timeline editor's state (SPEC §8.5, §10).
 *
 * Two decisions shape this file.
 *
 * **The document is normalised.** `TimelineDoc` nests clips inside tracks, but
 * a nested array means moving one clip changes the identity of every track,
 * which re-renders every clip on every pointer-move. Clips therefore live in a
 * flat `Record<id, Clip>` so a clip component can subscribe to exactly its own
 * clip and a fifty-event drag repaints one element. `selectTimelineDoc` puts
 * the nesting back for the API layer.
 *
 * **Undo is the shared command stack, not a local one.** Every mutating action
 * captures the clips it is about to change and hands `do`/`undo` closures to
 * `execute`. Drag and scrub actions pass a `mergeKey`, so one gesture collapses
 * into one history entry instead of fifty.
 */

export type ToolId = "select" | "cut" | "text" | "shape" | "crop" | "zoom";

export interface TrackMeta {
  id: string;
  kind: TrackKind;
  name: string;
  visible: boolean;
  locked: boolean;
  muted: boolean;
  clipIds: string[];
}

/** A clip's position and trim, the four numbers a drag or trim gesture writes. */
export interface ClipPlacement {
  id: string;
  startMs: number;
  durationMs: number;
  trimInMs: number;
  trimOutMs: number;
}

export type SelectionMode = "replace" | "add" | "toggle";

/** Shortest clip a trim gesture can produce — below this a clip is unhittable. */
export const MIN_CLIP_MS = 120;

/** Playback rates for the J / K / L shuttle. */
export const SHUTTLE_RATES = [-2, -1, 0, 1, 2, 4] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

let idCounter = 0;
/** Ids for clips created in the editor. Prefixed so they read in the devtools. */
export function newClipId(prefix: string): string {
  idCounter += 1;
  return `clip-${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface TimelineStore {
  /* ── Document ─────────────────────────────────────────────────────────── */
  ready: boolean;
  projectId: string;
  aspect: AspectRatio;
  fps: number;
  durationMs: number;
  trackOrder: string[];
  tracks: Record<string, TrackMeta>;
  clips: Record<string, Clip>;
  trackOfClip: Record<string, string>;

  /* ── Session ──────────────────────────────────────────────────────────── */
  selection: string[];
  playheadMs: number;
  playing: boolean;
  shuttleRate: number;
  volume: number;
  muted: boolean;

  /* ── View ─────────────────────────────────────────────────────────────── */
  tool: ToolId;
  /** Pixels per millisecond. Zoom is a scale, not a level, so it composes. */
  pxPerMs: number;
  laneWidth: number;
  snapEnabled: boolean;
  snapGuideMs: number | null;
  /** Bumped when a gesture asks the property panel to take focus. */
  panelFocusToken: number;

  history: CommandStackState;
  dirty: boolean;

  /* ── Actions ──────────────────────────────────────────────────────────── */
  load: (doc: TimelineDoc) => void;
  markSaved: () => void;

  setPlayhead: (ms: number) => void;
  stepFrames: (frames: number) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setShuttleRate: (rate: number) => void;
  shuttleBy: (steps: number) => void;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;

  setTool: (tool: ToolId) => void;
  setLaneWidth: (width: number) => void;
  zoomBy: (factor: number) => void;
  zoomToFit: () => void;
  toggleSnapping: () => void;
  setSnapGuide: (ms: number | null) => void;
  requestPanelFocus: () => void;

  setSelection: (ids: readonly string[], mode?: SelectionMode) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectStep: (direction: -1 | 1) => void;
  selectTrackStep: (direction: -1 | 1) => void;

  placeClips: (placements: readonly ClipPlacement[], label: string, mergeKey?: string) => void;
  nudgeSelection: (deltaMs: number) => void;
  trimSelectionToPlayhead: (edge: "start" | "end") => void;
  updateClip: (id: string, updater: (clip: Clip) => Clip, label: string, mergeKey?: string) => void;
  updateTextStyle: (
    id: string,
    patch: Partial<TextClipStyle>,
    label: string,
    mergeKey?: string,
  ) => void;
  addClip: (trackId: string, clip: Clip) => void;
  splitAt: (ms: number, clipIds?: readonly string[]) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  setTrackFlag: (trackId: string, flag: "visible" | "locked" | "muted", value: boolean) => void;

  undo: () => void;
  redo: () => void;
  commitGesture: () => void;
}

type Structure = Pick<TimelineStore, "tracks" | "clips" | "trackOfClip" | "selection">;

/** Zoom floor fits the whole project; the ceiling is one second across the lane. */
export function zoomBounds(state: Pick<TimelineStore, "laneWidth" | "durationMs">): {
  min: number;
  max: number;
} {
  const width = state.laneWidth > 0 ? state.laneWidth : 960;
  const min = width / Math.max(1000, state.durationMs);
  return { min, max: Math.max(min, width / 1000) };
}

const withClips = (clips: Record<string, Clip>, next: readonly Clip[]): Record<string, Clip> => {
  const merged = { ...clips };
  for (const clip of next) merged[clip.id] = clip;
  return merged;
};

const byStart = (a: Clip, b: Clip) => a.startMs - b.startMs;

export const useTimelineStore = create<TimelineStore>()((set, get) => {
  /** Runs a command through the shared stack and records it. */
  const run = (label: string, apply: () => void, revert: () => void, mergeKey?: string) => {
    const command: Command =
      mergeKey === undefined
        ? { label, do: apply, undo: revert }
        : { label, do: apply, undo: revert, mergeKey };
    set({ history: execute(get().history, command), dirty: true });
  };

  /** The cheap path: only clip records change, so only those clips repaint. */
  const replaceClips = (label: string, next: readonly Clip[], mergeKey?: string) => {
    const current = get().clips;
    const before: Clip[] = [];
    for (const clip of next) {
      const existing = current[clip.id];
      if (existing) before.push(existing);
    }
    if (before.length === 0) return;
    run(
      label,
      () => set((state) => ({ clips: withClips(state.clips, next) })),
      () => set((state) => ({ clips: withClips(state.clips, before) })),
      mergeKey,
    );
  };

  /**
   * Add, delete, split and duplicate change which clips exist and where they
   * live. Those are rare next to a drag, so they snapshot the whole structure
   * rather than reasoning about diffs — one fewer place for undo to be subtly
   * wrong.
   */
  const structural = (label: string, next: Structure) => {
    const state = get();
    const before: Structure = {
      tracks: state.tracks,
      clips: state.clips,
      trackOfClip: state.trackOfClip,
      selection: state.selection,
    };
    run(
      label,
      () => set(next),
      () => set(before),
    );
  };

  const clipsOf = (ids: readonly string[]): Clip[] => {
    const { clips } = get();
    const found: Clip[] = [];
    for (const id of ids) {
      const clip = clips[id];
      if (clip) found.push(clip);
    }
    return found;
  };

  const orderedTrackClips = (state: TimelineStore, trackId: string): Clip[] =>
    (state.tracks[trackId]?.clipIds ?? [])
      .map((id) => state.clips[id])
      .filter((clip): clip is Clip => clip !== undefined)
      .sort(byStart);

  return {
    ready: false,
    projectId: "",
    aspect: "9:16",
    fps: 30,
    durationMs: 1000,
    trackOrder: [],
    tracks: {},
    clips: {},
    trackOfClip: {},

    selection: [],
    playheadMs: 0,
    playing: false,
    shuttleRate: 1,
    volume: 0.8,
    muted: false,

    tool: "select",
    pxPerMs: 0,
    laneWidth: 0,
    snapEnabled: true,
    snapGuideMs: null,
    panelFocusToken: 0,

    history: createCommandStack(),
    dirty: false,

    load: (doc) =>
      set((state) => {
        const tracks: Record<string, TrackMeta> = {};
        const clips: Record<string, Clip> = {};
        const trackOfClip: Record<string, string> = {};

        for (const track of doc.tracks) {
          const ordered = [...track.clips].sort(byStart);
          tracks[track.id] = {
            id: track.id,
            kind: track.kind,
            name: track.name,
            visible: track.visible,
            locked: track.locked,
            muted: track.muted,
            clipIds: ordered.map((clip) => clip.id),
          };
          for (const clip of ordered) {
            clips[clip.id] = clip;
            trackOfClip[clip.id] = track.id;
          }
        }

        const bounds = zoomBounds({ laneWidth: state.laneWidth, durationMs: doc.durationMs });
        return {
          ready: true,
          projectId: doc.projectId,
          aspect: doc.aspect,
          fps: doc.fps,
          durationMs: doc.durationMs,
          trackOrder: doc.tracks.map((track) => track.id),
          tracks,
          clips,
          trackOfClip,
          selection: [],
          playheadMs: clamp(state.playheadMs, 0, doc.durationMs),
          pxPerMs: state.laneWidth > 0 ? bounds.min : 0,
          history: createCommandStack(),
          dirty: false,
        };
      }),

    markSaved: () => set({ dirty: false }),

    setPlayhead: (ms) => set((state) => ({ playheadMs: clamp(ms, 0, state.durationMs) })),

    stepFrames: (frames) =>
      set((state) => ({
        playheadMs: clamp(
          Math.round(state.playheadMs + (frames * 1000) / state.fps),
          0,
          state.durationMs,
        ),
      })),

    setPlaying: (playing) => set({ playing }),
    togglePlaying: () => set((state) => ({ playing: !state.playing, shuttleRate: 1 })),

    setShuttleRate: (rate) => set({ shuttleRate: rate, playing: rate !== 0 }),

    shuttleBy: (steps) =>
      set((state) => {
        const index = SHUTTLE_RATES.indexOf(state.shuttleRate as (typeof SHUTTLE_RATES)[number]);
        const from = index === -1 ? SHUTTLE_RATES.indexOf(1) : index;
        const next = SHUTTLE_RATES[clamp(from + steps, 0, SHUTTLE_RATES.length - 1)] ?? 1;
        return { shuttleRate: next, playing: next !== 0 };
      }),

    setVolume: (volume) => set({ volume: clamp(volume, 0, 1), muted: volume === 0 }),
    toggleMuted: () => set((state) => ({ muted: !state.muted })),

    setTool: (tool) => set({ tool }),

    setLaneWidth: (width) =>
      set((state) => {
        if (width <= 0 || width === state.laneWidth) return {};
        const bounds = zoomBounds({ laneWidth: width, durationMs: state.durationMs });
        return {
          laneWidth: width,
          pxPerMs:
            state.pxPerMs === 0 ? bounds.min : clamp(state.pxPerMs, bounds.min, bounds.max),
        };
      }),

    zoomBy: (factor) =>
      set((state) => {
        const bounds = zoomBounds(state);
        return { pxPerMs: clamp(state.pxPerMs * factor, bounds.min, bounds.max) };
      }),

    zoomToFit: () => set((state) => ({ pxPerMs: zoomBounds(state).min })),

    toggleSnapping: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
    setSnapGuide: (snapGuideMs) => set({ snapGuideMs }),
    requestPanelFocus: () => set((state) => ({ panelFocusToken: state.panelFocusToken + 1 })),

    setSelection: (ids, mode = "replace") =>
      set((state) => {
        if (mode === "replace") return { selection: [...ids] };
        const next = new Set(state.selection);
        for (const id of ids) {
          if (mode === "toggle" && next.has(id)) next.delete(id);
          else next.add(id);
        }
        return { selection: [...next] };
      }),

    selectAll: () => set((state) => ({ selection: Object.keys(state.clips) })),
    clearSelection: () => set({ selection: [] }),

    selectStep: (direction) =>
      set((state) => {
        const anchorId = state.selection[state.selection.length - 1];
        const trackId = anchorId ? state.trackOfClip[anchorId] : state.trackOrder[0];
        if (!trackId) return {};
        const ordered = orderedTrackClips(state, trackId);
        if (ordered.length === 0) return {};
        const index = anchorId ? ordered.findIndex((clip) => clip.id === anchorId) : -1;
        const nextIndex = clamp(index + direction, 0, ordered.length - 1);
        const next = ordered[index === -1 ? 0 : nextIndex];
        return next ? { selection: [next.id], playheadMs: next.startMs } : {};
      }),

    selectTrackStep: (direction) =>
      set((state) => {
        const anchorId = state.selection[state.selection.length - 1];
        const anchor = anchorId ? state.clips[anchorId] : undefined;
        const currentTrack = anchorId ? state.trackOfClip[anchorId] : undefined;
        const from = currentTrack ? state.trackOrder.indexOf(currentTrack) : -1;
        const targetIndex = clamp(from + direction, 0, state.trackOrder.length - 1);
        const targetTrack = state.trackOrder[from === -1 ? 0 : targetIndex];
        if (!targetTrack) return {};
        const ordered = orderedTrackClips(state, targetTrack);
        if (ordered.length === 0) return {};
        const at = anchor?.startMs ?? state.playheadMs;
        // Land on the clip nearest the one we came from, so the selection
        // travels vertically rather than jumping to the head of the track.
        const nearest = ordered.reduce((best, clip) =>
          Math.abs(clip.startMs - at) < Math.abs(best.startMs - at) ? clip : best,
        );
        return { selection: [nearest.id] };
      }),

    placeClips: (placements, label, mergeKey) => {
      const { clips, durationMs } = get();
      const next: Clip[] = [];
      for (const placement of placements) {
        const clip = clips[placement.id];
        if (!clip) continue;
        const duration = Math.max(MIN_CLIP_MS, Math.round(placement.durationMs));
        next.push({
          ...clip,
          startMs: clamp(Math.round(placement.startMs), 0, Math.max(0, durationMs - duration)),
          durationMs: duration,
          trimInMs: Math.max(0, Math.round(placement.trimInMs)),
          trimOutMs: Math.max(0, Math.round(placement.trimOutMs)),
        });
      }
      replaceClips(label, next, mergeKey);
    },

    nudgeSelection: (deltaMs) => {
      const state = get();
      const placements = clipsOf(state.selection)
        .filter((clip) => !state.tracks[state.trackOfClip[clip.id] ?? ""]?.locked)
        .map((clip) => ({
          id: clip.id,
          startMs: clip.startMs + deltaMs,
          durationMs: clip.durationMs,
          trimInMs: clip.trimInMs,
          trimOutMs: clip.trimOutMs,
        }));
      if (placements.length === 0) return;
      get().placeClips(
        placements,
        deltaMs < 0 ? "Nudge clip earlier" : "Nudge clip later",
        `nudge:${state.selection.join(",")}`,
      );
    },

    trimSelectionToPlayhead: (edge) => {
      const state = get();
      const placements: ClipPlacement[] = [];
      for (const clip of clipsOf(state.selection)) {
        if (state.tracks[state.trackOfClip[clip.id] ?? ""]?.locked) continue;
        const end = clip.startMs + clip.durationMs;
        if (state.playheadMs <= clip.startMs || state.playheadMs >= end) continue;
        if (edge === "start") {
          const delta = state.playheadMs - clip.startMs;
          placements.push({
            id: clip.id,
            startMs: state.playheadMs,
            durationMs: clip.durationMs - delta,
            trimInMs: clip.trimInMs + delta,
            trimOutMs: clip.trimOutMs,
          });
        } else {
          const delta = end - state.playheadMs;
          placements.push({
            id: clip.id,
            startMs: clip.startMs,
            durationMs: clip.durationMs - delta,
            trimInMs: clip.trimInMs,
            trimOutMs: clip.trimOutMs + delta,
          });
        }
      }
      if (placements.length === 0) return;
      get().placeClips(
        placements,
        edge === "start" ? "Trim clip start" : "Trim clip end",
        undefined,
      );
    },

    updateClip: (id, updater, label, mergeKey) => {
      const clip = get().clips[id];
      if (!clip) return;
      replaceClips(label, [updater(clip)], mergeKey);
    },

    updateTextStyle: (id, patch, label, mergeKey) => {
      const clip = get().clips[id];
      if (!clip || clip.kind !== "text") return;
      replaceClips(label, [{ ...clip, style: { ...clip.style, ...patch } }], mergeKey);
    },

    addClip: (trackId, clip) => {
      const state = get();
      const track = state.tracks[trackId];
      if (!track) return;
      structural(`Add ${track.kind === "text" ? "caption" : "clip"}`, {
        tracks: {
          ...state.tracks,
          [trackId]: { ...track, clipIds: [...track.clipIds, clip.id] },
        },
        clips: { ...state.clips, [clip.id]: clip },
        trackOfClip: { ...state.trackOfClip, [clip.id]: trackId },
        selection: [clip.id],
      });
    },

    splitAt: (ms, clipIds) => {
      const state = get();
      const candidates = clipIds ?? state.selection;
      const pool =
        candidates.length > 0
          ? clipsOf(candidates)
          : Object.values(state.clips).filter(
              (clip) => ms > clip.startMs && ms < clip.startMs + clip.durationMs,
            );

      const clips = { ...state.clips };
      const tracks = { ...state.tracks };
      const trackOfClip = { ...state.trackOfClip };
      const selection: string[] = [];
      let changed = false;

      for (const clip of pool) {
        const trackId = state.trackOfClip[clip.id];
        const track = trackId ? tracks[trackId] : undefined;
        if (!trackId || !track || track.locked) continue;
        const offset = ms - clip.startMs;
        if (offset < MIN_CLIP_MS || clip.durationMs - offset < MIN_CLIP_MS) continue;

        const tailId = newClipId("split");
        const head: Clip = {
          ...clip,
          durationMs: offset,
          trimOutMs: clip.trimOutMs + (clip.durationMs - offset),
        };
        const tail: Clip = {
          ...clip,
          id: tailId,
          startMs: clip.startMs + offset,
          durationMs: clip.durationMs - offset,
          trimInMs: clip.trimInMs + offset,
        };

        clips[head.id] = head;
        clips[tailId] = tail;
        trackOfClip[tailId] = trackId;
        const index = track.clipIds.indexOf(clip.id);
        const clipIdList = [...track.clipIds];
        clipIdList.splice(index + 1, 0, tailId);
        tracks[trackId] = { ...track, clipIds: clipIdList };
        selection.push(head.id, tailId);
        changed = true;
      }

      if (!changed) return;
      structural("Split clip", { tracks, clips, trackOfClip, selection });
    },

    deleteSelection: () => {
      const state = get();
      const doomed = clipsOf(state.selection).filter(
        (clip) => !state.tracks[state.trackOfClip[clip.id] ?? ""]?.locked,
      );
      if (doomed.length === 0) return;

      const removing = new Set(doomed.map((clip) => clip.id));
      const clips: Record<string, Clip> = {};
      for (const [id, clip] of Object.entries(state.clips)) {
        if (!removing.has(id)) clips[id] = clip;
      }
      const trackOfClip: Record<string, string> = {};
      for (const [id, trackId] of Object.entries(state.trackOfClip)) {
        if (!removing.has(id)) trackOfClip[id] = trackId;
      }
      const tracks: Record<string, TrackMeta> = {};
      for (const [id, track] of Object.entries(state.tracks)) {
        tracks[id] = { ...track, clipIds: track.clipIds.filter((clipId) => !removing.has(clipId)) };
      }

      structural(doomed.length === 1 ? "Delete clip" : "Delete clips", {
        tracks,
        clips,
        trackOfClip,
        selection: [],
      });
    },

    duplicateSelection: () => {
      const state = get();
      const sources = clipsOf(state.selection).filter(
        (clip) => !state.tracks[state.trackOfClip[clip.id] ?? ""]?.locked,
      );
      if (sources.length === 0) return;

      const clips = { ...state.clips };
      const tracks = { ...state.tracks };
      const trackOfClip = { ...state.trackOfClip };
      const selection: string[] = [];

      for (const clip of sources) {
        const trackId = state.trackOfClip[clip.id];
        const track = trackId ? tracks[trackId] : undefined;
        if (!trackId || !track) continue;
        const id = newClipId("copy");
        const copy: Clip = {
          ...clip,
          id,
          // Land the copy immediately after the original — the placement a
          // person expects when they duplicate a beat they want to repeat.
          startMs: clamp(
            clip.startMs + clip.durationMs,
            0,
            Math.max(0, state.durationMs - clip.durationMs),
          ),
        };
        clips[id] = copy;
        trackOfClip[id] = trackId;
        tracks[trackId] = { ...track, clipIds: [...track.clipIds, id] };
        selection.push(id);
      }

      if (selection.length === 0) return;
      structural(sources.length === 1 ? "Duplicate clip" : "Duplicate clips", {
        tracks,
        clips,
        trackOfClip,
        selection,
      });
    },

    setTrackFlag: (trackId, flag, value) => {
      const state = get();
      const track = state.tracks[trackId];
      if (!track || track[flag] === value) return;
      const label =
        flag === "visible"
          ? value
            ? "Show track"
            : "Hide track"
          : flag === "locked"
            ? value
              ? "Lock track"
              : "Unlock track"
            : value
              ? "Mute track"
              : "Unmute track";
      const before = track;
      const after: TrackMeta = { ...track, [flag]: value };
      run(
        label,
        () => set((current) => ({ tracks: { ...current.tracks, [trackId]: after } })),
        () => set((current) => ({ tracks: { ...current.tracks, [trackId]: before } })),
      );
    },

    undo: () => set({ history: undo(get().history), dirty: true }),
    redo: () => set({ history: redo(get().history), dirty: true }),
    commitGesture: () => set({ history: commitMerge(get().history), snapGuideMs: null }),
  };
});

/* ── Selectors ───────────────────────────────────────────────────────────── */

/** Re-nests the normalised state into the shape `saveProjectDocument` takes. */
export function selectTimelineDoc(state: TimelineStore): TimelineDoc {
  const tracks: Track[] = state.trackOrder.map((trackId) => {
    const meta = state.tracks[trackId];
    const clips = (meta?.clipIds ?? [])
      .map((id) => state.clips[id])
      .filter((clip): clip is Clip => clip !== undefined)
      .sort(byStart);
    return {
      id: trackId,
      kind: meta?.kind ?? "video",
      name: meta?.name ?? "Track",
      visible: meta?.visible ?? true,
      locked: meta?.locked ?? false,
      muted: meta?.muted ?? false,
      clips,
    };
  });

  return {
    projectId: state.projectId,
    aspect: state.aspect,
    durationMs: state.durationMs,
    fps: state.fps,
    tracks,
  };
}

export const selectClipCount = (state: TimelineStore): number => Object.keys(state.clips).length;

/**
 * The preview reads the document through these. They take only the three
 * fields they need so a component can pass memoised slices instead of
 * subscribing to the whole store on the playback path.
 */
export type TimelineSlice = Pick<TimelineStore, "clips" | "tracks" | "trackOrder">;

/** Every text clip covering `ms`, for the burned-in captions over the preview. */
export function activeTextClips(state: TimelineSlice, ms: number): Clip[] {
  const active: Clip[] = [];
  for (const trackId of state.trackOrder) {
    const track = state.tracks[trackId];
    if (!track || track.kind !== "text" || !track.visible) continue;
    for (const clipId of track.clipIds) {
      const clip = state.clips[clipId];
      if (!clip || clip.kind !== "text") continue;
      if (ms >= clip.startMs && ms < clip.startMs + clip.durationMs) active.push(clip);
    }
  }
  return active;
}

/** The video and overlay clips under `ms`, in track order, for the preview. */
export function activeMediaClips(state: TimelineSlice, ms: number): Clip[] {
  const active: Clip[] = [];
  for (const trackId of state.trackOrder) {
    const track = state.tracks[trackId];
    if (!track || !track.visible) continue;
    if (track.kind !== "video" && track.kind !== "overlay") continue;
    for (const clipId of track.clipIds) {
      const clip = state.clips[clipId];
      if (!clip) continue;
      if (ms >= clip.startMs && ms < clip.startMs + clip.durationMs) active.push(clip);
    }
  }
  return active;
}
