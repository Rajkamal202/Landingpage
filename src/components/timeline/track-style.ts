import type { TrackKind } from "@/lib/schemas";

/**
 * SPEC §8.5 gives each track kind its own accent. The classes are named here
 * once so a clip, its lane header and its property panel cannot disagree about
 * what colour "audio" is.
 */
export const TRACK_ACCENT: Record<TrackKind, string> = {
  video: "bg-track-video",
  audio: "bg-track-audio",
  text: "bg-track-text",
  overlay: "bg-track-overlay",
};

/** The clip body fill — the accent at low opacity so media stays readable. */
export const TRACK_FILL: Record<TrackKind, string> = {
  video: "bg-track-video/10",
  audio: "bg-track-audio/12",
  text: "bg-track-text/12",
  overlay: "bg-track-overlay/12",
};

export const TRACK_TEXT: Record<TrackKind, string> = {
  video: "text-track-video",
  audio: "text-track-audio",
  text: "text-track-text",
  overlay: "text-track-overlay",
};

/** Plain-language names, used in aria labels and the property panel heading. */
export const TRACK_KIND_LABEL: Record<TrackKind, string> = {
  video: "Scene",
  audio: "Audio",
  text: "Caption",
  overlay: "Overlay",
};
