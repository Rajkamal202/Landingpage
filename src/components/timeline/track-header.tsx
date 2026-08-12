"use client";

import { cn } from "@/lib/cn";
import { useTimelineStore } from "@/lib/stores/timeline";
import {
  IconHidden,
  IconLocked,
  IconMuted,
  IconUnlocked,
  IconVisible,
  IconVolume,
} from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";
import { LANE_HEIGHT } from "./geometry";
import { TRACK_ACCENT } from "./track-style";

/**
 * The 120px track header (SPEC §8.5) — visibility, lock, mute, name.
 *
 * Mute only appears on tracks that carry sound. A muted caption track is a
 * control that does nothing, and a control that does nothing is worse than an
 * absent one.
 */
export function TrackHeader({ trackId }: { trackId: string }) {
  const track = useTimelineStore((state) => state.tracks[trackId]);
  const setTrackFlag = useTimelineStore((state) => state.setTrackFlag);

  if (!track) return null;
  const audible = track.kind === "audio" || track.kind === "video";

  return (
    <div
      className="flex w-track-head flex-col justify-center gap-1 border-b border-ink-200 px-2"
      // dynamic: header rows line up with the lanes beside them.
      style={{ height: LANE_HEIGHT }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={cn("size-2 shrink-0 rounded-pill", TRACK_ACCENT[track.kind])}
        />
        <span className={cn("text-label min-w-0 truncate", track.visible ? "text-ink-950" : "text-ink-500")}>
          {track.name}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip content={track.visible ? `Hide ${track.name}` : `Show ${track.name}`}>
          <IconButton
            size="sm"
            label={track.visible ? `Hide ${track.name}` : `Show ${track.name}`}
            glyph={track.visible ? IconVisible : IconHidden}
            aria-pressed={!track.visible}
            className={track.visible ? undefined : "text-ink-300"}
            onClick={() => setTrackFlag(trackId, "visible", !track.visible)}
          />
        </Tooltip>

        <Tooltip content={track.locked ? `Unlock ${track.name}` : `Lock ${track.name}`}>
          <IconButton
            size="sm"
            label={track.locked ? `Unlock ${track.name}` : `Lock ${track.name}`}
            glyph={track.locked ? IconLocked : IconUnlocked}
            aria-pressed={track.locked}
            className={track.locked ? "text-warning" : undefined}
            onClick={() => setTrackFlag(trackId, "locked", !track.locked)}
          />
        </Tooltip>

        {audible ? (
          <Tooltip content={track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}>
            <IconButton
              size="sm"
              label={track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}
              glyph={track.muted ? IconMuted : IconVolume}
              aria-pressed={track.muted}
              className={track.muted ? "text-ink-300" : undefined}
              onClick={() => setTrackFlag(trackId, "muted", !track.muted)}
            />
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
