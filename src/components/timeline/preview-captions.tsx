"use client";

import * as React from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { transition } from "@/lib/motion/variants";
import { ASPECT_DIMENSIONS, type AspectRatio, type Clip, type TextClipStyle } from "@/lib/schemas";
import { activeTextClips, useTimelineStore } from "@/lib/stores/timeline";
import { CSS_FONT_WEIGHT } from "./tools";

/**
 * SPEC §8.5: "Captions render burned-in over the preview."
 *
 * The caption layer is authored in project pixels — a caption at y=240 in the
 * document sits at y=240 of a 1080×1920 frame — and the whole layer is scaled
 * to whatever size the preview happens to be. That way the numbers in the
 * property panel mean the same thing as the numbers in the export, which is
 * the only way position fields are worth having.
 */
export interface PreviewCaptionsProps {
  aspect: AspectRatio;
  /** Rendered height of the preview frame, in CSS pixels. */
  frameHeight: number;
}

/** Project-space inset so a centred caption never touches the frame edge. */
const SAFE_INSET = 72;

export function PreviewCaptions({ aspect, frameHeight }: PreviewCaptionsProps) {
  const playheadMs = useTimelineStore((state) => state.playheadMs);
  const clips = useTimelineStore((state) => state.clips);
  const tracks = useTimelineStore((state) => state.tracks);
  const trackOrder = useTimelineStore((state) => state.trackOrder);

  const captions = React.useMemo(
    () => activeTextClips({ clips, tracks, trackOrder }, playheadMs),
    [clips, tracks, trackOrder, playheadMs],
  );

  const project = ASPECT_DIMENSIONS[aspect];
  const scale = frameHeight > 0 ? frameHeight / project.height : 0;
  if (scale === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 origin-top-left"
      // dynamic: the caption layer is authored in project pixels and scaled to
      // the rendered preview, so document coordinates survive any frame size.
      style={{ width: project.width, height: project.height, transform: `scale(${scale})` }}
    >
      <AnimatePresence>
        {captions.map((clip) => (
          <Caption key={clip.id} clip={clip} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Caption({ clip }: { clip: Clip }) {
  if (clip.kind !== "text") return null;
  const { style } = clip;

  return (
    <motion.p
      variants={captionVariants(style)}
      initial="hidden"
      animate="visible"
      exit="exit"
      // dynamic: every value here is the caption's own styling from the
      // document — the user picked the face, size, colour and position.
      style={{
        position: "absolute",
        left: SAFE_INSET,
        right: SAFE_INSET,
        top: style.y,
        margin: 0,
        textAlign: style.align,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: CSS_FONT_WEIGHT[style.fontWeight],
        lineHeight: 1.2,
        color: style.color,
        WebkitTextStroke:
          style.outlineWidth > 0 ? `${style.outlineWidth}px ${style.outlineColor}` : undefined,
        paintOrder: "stroke fill",
      }}
    >
      {clip.content}
    </motion.p>
  );
}

/** SPEC §4.6 timings only — the animation choice comes from the clip. */
function captionVariants(style: TextClipStyle): Variants {
  const hidden =
    style.animateIn === "rise"
      ? { opacity: 0, y: 32, scale: 1 }
      : style.animateIn === "pop"
        ? { opacity: 0, y: 0, scale: 0.86 }
        : style.animateIn === "fade"
          ? { opacity: 0, y: 0, scale: 1 }
          : { opacity: style.opacity, y: 0, scale: 1 };

  const exit =
    style.animateOut === "sink"
      ? { opacity: 0, y: 32 }
      : style.animateOut === "fade"
        ? { opacity: 0, y: 0 }
        : { opacity: style.opacity, y: 0 };

  return {
    hidden,
    visible: {
      opacity: style.opacity,
      y: 0,
      scale: 1,
      rotate: style.rotation,
      x: style.x,
      transition: transition.base,
    },
    exit: { ...exit, transition: transition.fast },
  };
}
