"use client";

import { cn } from "@/lib/cn";
import { formatTimecode } from "@/lib/format";
import { useTimelineStore } from "@/lib/stores/timeline";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExitFullscreen,
  IconFullscreen,
  IconMuted,
  IconPause,
  IconPlay,
  IconSkipBack,
  IconSkipForward,
  IconVolume,
} from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { Slider } from "@/components/ui/slider";
import { Toolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Transport, timecode, volume and fullscreen (SPEC §8.5). Every control here
 * has a key registered in the `?` dialog, so the bar is a convenience rather
 * than the only way to drive the player.
 */
export interface TransportBarProps {
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  className?: string;
}

export function TransportBar({ fullscreen, onToggleFullscreen, className }: TransportBarProps) {
  const playheadMs = useTimelineStore((state) => state.playheadMs);
  const durationMs = useTimelineStore((state) => state.durationMs);
  const fps = useTimelineStore((state) => state.fps);
  const playing = useTimelineStore((state) => state.playing);
  const shuttleRate = useTimelineStore((state) => state.shuttleRate);
  const volume = useTimelineStore((state) => state.volume);
  const muted = useTimelineStore((state) => state.muted);

  const setPlayhead = useTimelineStore((state) => state.setPlayhead);
  const stepFrames = useTimelineStore((state) => state.stepFrames);
  const togglePlaying = useTimelineStore((state) => state.togglePlaying);
  const setVolume = useTimelineStore((state) => state.setVolume);
  const toggleMuted = useTimelineStore((state) => state.toggleMuted);

  const shuttling = playing && shuttleRate !== 1;

  return (
    <div
      className={cn(
        "flex h-topbar shrink-0 items-center gap-3 border-t border-ink-200 bg-surface px-3",
        className,
      )}
    >
      <Toolbar ariaLabel="Playback">
        <Tooltip content="Jump to the start">
          <IconButton
            label="Jump to the start"
            glyph={IconSkipBack}
            size="sm"
            onClick={() => setPlayhead(0)}
          />
        </Tooltip>
        <Tooltip content="Step back one frame">
          <IconButton
            label="Step back one frame"
            glyph={IconChevronLeft}
            size="sm"
            onClick={() => stepFrames(-1)}
          />
        </Tooltip>
        <Tooltip content={playing ? "Pause" : "Play"}>
          <IconButton
            label={playing ? "Pause" : "Play"}
            glyph={playing ? IconPause : IconPlay}
            size="md"
            variant="primary"
            shape="pill"
            onClick={togglePlaying}
          />
        </Tooltip>
        <Tooltip content="Step forward one frame">
          <IconButton
            label="Step forward one frame"
            glyph={IconChevronRight}
            size="sm"
            onClick={() => stepFrames(1)}
          />
        </Tooltip>
        <Tooltip content="Jump to the end">
          <IconButton
            label="Jump to the end"
            glyph={IconSkipForward}
            size="sm"
            onClick={() => setPlayhead(durationMs)}
          />
        </Tooltip>
      </Toolbar>

      <ToolbarSeparator />

      <p className="mono-sm flex items-baseline gap-1 text-ink-950" data-numeric>
        <span aria-label={`Playhead at ${formatTimecode(playheadMs, fps)}`}>
          {formatTimecode(playheadMs, fps)}
        </span>
        <span aria-hidden="true" className="text-ink-300">
          /
        </span>
        <span className="text-ink-500">{formatTimecode(durationMs, fps)}</span>
      </p>

      {shuttling ? (
        <span className="mono-sm rounded-sm bg-brand-50 px-2 py-1 text-brand-700">
          {shuttleRate}×
        </span>
      ) : null}

      <div className="flex flex-1 items-center justify-end gap-2">
        <Tooltip content={muted ? "Turn the sound on" : "Mute the preview"}>
          <IconButton
            label={muted ? "Turn the sound on" : "Mute the preview"}
            glyph={muted || volume === 0 ? IconMuted : IconVolume}
            size="sm"
            onClick={toggleMuted}
          />
        </Tooltip>
        <Slider
          className="w-24"
          value={[Math.round((muted ? 0 : volume) * 100)]}
          min={0}
          max={100}
          step={1}
          showValue
          formatValue={(value) => `${value}%`}
          aria-label="Preview volume"
          onValueChange={([next]) => setVolume((next ?? 0) / 100)}
        />
        <Tooltip content={fullscreen ? "Leave fullscreen" : "Show the preview fullscreen"}>
          <IconButton
            label={fullscreen ? "Leave fullscreen" : "Show the preview fullscreen"}
            glyph={fullscreen ? IconExitFullscreen : IconFullscreen}
            size="sm"
            onClick={onToggleFullscreen}
          />
        </Tooltip>
      </div>
    </div>
  );
}
