"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";

/**
 * One audio element for the whole actor browser.
 *
 * Sixteen cards each owning an `<audio>` means sixteen buffers and, the first
 * time two play at once, a mess. A single element also gives the screen its
 * rule for free: starting one sample stops the one before it.
 *
 * Progress is read from `timeupdate` — the element's own clock — so the
 * waveform tracks real playback rather than a timer pretending to (SPEC §9).
 */
export interface VoicePreview {
  playingId: string | null;
  /** 0–1 through the currently playing sample. */
  progress: number;
  toggle: (id: string, src: string) => void;
}

export function useVoicePreview(): VoicePreview {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    };
    const onEnded = () => {
      setPlayingId(null);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  const toggle = React.useCallback(
    (id: string, src: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (playingId === id) {
        audio.pause();
        setPlayingId(null);
        return;
      }

      audio.pause();
      audio.src = src;
      audio.currentTime = 0;
      setProgress(0);
      setPlayingId(id);

      void audio.play().catch(() => {
        setPlayingId(null);
        toast.error("That voice sample didn't play", {
          description: "The file is still downloading. Give it a moment and press play again.",
        });
      });
    },
    [playingId],
  );

  return { playingId, progress, toggle };
}
