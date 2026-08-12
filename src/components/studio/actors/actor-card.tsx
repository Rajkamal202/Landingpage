"use client";

import { cn } from "@/lib/cn";
import type { Actor, Asset } from "@/lib/schemas";
import { formatDurationShort } from "@/lib/format";
import { IconPause, IconPlay } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { Waveform } from "@/components/ui/waveform";
import { AGE_LABEL, GENDER_LABEL } from "./labels";

/**
 * SPEC §8.3 — a presenter card: portrait, style tags, a voice sample with a
 * play button and an animated waveform, and the languages the voice covers.
 *
 * The peaks come off the voice asset, pre-computed at media-generation time
 * (DECISIONS D15). Nothing here decodes audio.
 */
export interface ActorCardProps {
  actor: Actor;
  portrait: Asset | undefined;
  voice: Asset | undefined;
  playing: boolean;
  /** 0–1 through the sample, only meaningful while `playing`. */
  progress: number;
  onTogglePlay: () => void;
}

export function ActorCard({
  actor,
  portrait,
  voice,
  playing,
  progress,
  onTogglePlay,
}: ActorCardProps) {
  const peaks = voice?.peaks ?? null;
  const playable = voice !== undefined && peaks !== null;

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-lg border border-ink-200 bg-surface p-3",
        "shadow-elev-1 transition-ui duration-(--dur-fast) hover:shadow-elev-2",
      )}
    >
      <div className="aspect-square w-full overflow-hidden rounded-md bg-ink-100">
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portrait.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-body-md truncate font-medium text-ink-950">{actor.name}</h2>
        <p className="text-body-sm text-ink-500">{actor.description}</p>
      </div>

      <div className="flex items-center gap-3 rounded-md bg-ink-50 p-2">
        <Tooltip
          content={playable ? undefined : "This voice sample isn't in your library yet."}
          disabledTrigger={!playable}
        >
          <IconButton
            label={playing ? `Pause ${actor.voiceName}` : `Play ${actor.voiceName}`}
            glyph={playing ? IconPause : IconPlay}
            variant="secondary"
            disabled={!playable}
            onClick={onTogglePlay}
          />
        </Tooltip>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-body-sm truncate text-ink-700">{actor.voiceName}</span>
          <div className="h-5">
            {peaks ? (
              <Waveform
                peaks={peaks}
                progress={playing ? progress : 0}
                ariaLabel={`Waveform for ${actor.voiceName}`}
              />
            ) : null}
          </div>
        </div>

        {voice ? (
          <span className="mono-sm shrink-0 text-ink-500" data-numeric>
            {formatDurationShort(voice.durationMs)}
          </span>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-2">
        {actor.styles.map((style) => (
          <li key={style}>
            <Badge tone="neutral">{style}</Badge>
          </li>
        ))}
        <li>
          <Badge tone="outline">{GENDER_LABEL[actor.genderPresentation]}</Badge>
        </li>
        <li>
          <Badge tone="outline">{AGE_LABEL[actor.ageRange]}</Badge>
        </li>
      </ul>

      <ul className="flex flex-wrap gap-2">
        {actor.languages.map((language) => (
          <li key={language}>
            <Badge tone="brand">{language}</Badge>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ActorCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-surface p-3">
      <Skeleton className="aspect-square w-full rounded-md" />
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-5 w-3/5" />
    </div>
  );
}
