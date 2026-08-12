import type { Asset, TrackKind } from "@/lib/schemas";
import { newClipId, useTimelineStore } from "@/lib/stores/timeline";
import { toast } from "@/components/ui/toast";
import { createAudioClip, createOverlayClip, createVideoClip } from "./tools";

/**
 * The keyboard-and-dialog path to the same result the library drag produces
 * (SPEC §11 — every mouse gesture needs an equivalent). Both routes end here,
 * so a clip added by dialog and a clip added by drag are identical.
 */
const TRACK_FOR_KIND: Record<Asset["kind"], TrackKind> = {
  video: "video",
  audio: "audio",
  image: "overlay",
};

const STILL_DURATION_MS = 4_000;

export function addAssetToTimeline(asset: Asset, atMs?: number): void {
  const state = useTimelineStore.getState();
  const wanted = TRACK_FOR_KIND[asset.kind];
  const trackId = state.trackOrder.find(
    (id) => state.tracks[id]?.kind === wanted && state.tracks[id]?.locked !== true,
  );

  if (!trackId) {
    toast.error(`There's no unlocked ${wanted} track to put this on`, {
      description: "Unlock the track from its header, then add the asset again.",
    });
    return;
  }

  const durationMs = asset.durationMs > 0 ? asset.durationMs : STILL_DURATION_MS;
  const startMs = Math.max(0, Math.round(atMs ?? state.playheadMs));
  const id = newClipId(wanted);

  const clip =
    wanted === "video"
      ? createVideoClip(id, asset.id, asset.name, startMs, durationMs)
      : wanted === "audio"
        ? createAudioClip(id, asset.id, asset.name, startMs, durationMs)
        : createOverlayClip(id, asset.id, asset.name, startMs, durationMs);

  state.addClip(trackId, clip);
  toast.success("Clip added", {
    description: `${asset.name} is on ${state.tracks[trackId]?.name ?? "the track"}.`,
  });
}
