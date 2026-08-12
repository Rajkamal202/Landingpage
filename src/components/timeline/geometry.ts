/**
 * The timeline's arithmetic, kept out of the components that render it.
 *
 * Every number here is a *geometry* value — a lane height, a tick interval, a
 * pixel-to-millisecond conversion. None of them is a design token: they are
 * measurements the layout computes from zoom, which is exactly the case the
 * inline-style rule exists for.
 */

/** One lane, and the ruler above it. Matches `h-16` and `h-8`. */
export const LANE_HEIGHT = 64;
export const RULER_HEIGHT = 32;

/** The track area stops growing after this many lanes and scrolls instead. */
export const MAX_VISIBLE_LANES = 5;

/** SPEC §15: "the right threshold (~6px at current zoom)". */
export const SNAP_THRESHOLD_PX = 6;

/** Grab area on each end of a clip for the trim handles. */
export const TRIM_HANDLE_PX = 8;

export const msToPx = (ms: number, pxPerMs: number): number => ms * pxPerMs;
export const pxToMs = (px: number, pxPerMs: number): number => (pxPerMs > 0 ? px / pxPerMs : 0);

export const frameMs = (fps: number): number => 1000 / fps;

/** Rounds to the nearest whole frame so an edit never lands between frames. */
export const quantizeToFrame = (ms: number, fps: number): number =>
  Math.round(ms / frameMs(fps)) * frameMs(fps);

/**
 * Adaptive tick density (SPEC §8.5). The smallest interval whose on-screen
 * width still leaves room for a legible timecode wins, so the ruler reads
 * 5-minute marks when the whole project fits and quarter-seconds at full zoom
 * without anyone choosing a "zoom level".
 */
const TICK_STEPS_MS = [
  100, 250, 500, 1_000, 2_000, 5_000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000, 600_000,
] as const;

export function chooseTickStep(pxPerMs: number, minLabelPx = 72): number {
  for (const step of TICK_STEPS_MS) {
    if (step * pxPerMs >= minLabelPx) return step;
  }
  return TICK_STEPS_MS[TICK_STEPS_MS.length - 1] ?? 600_000;
}

/** Minor ticks between two labels — dropped entirely when they would crowd. */
export function minorTickCount(stepMs: number, pxPerMs: number): number {
  const width = stepMs * pxPerMs;
  if (width >= 240) return 10;
  if (width >= 120) return 5;
  if (width >= 84) return 2;
  return 0;
}

/** `0:04.5` — the ruler's own label, shorter than a full timecode by design. */
export function formatRulerLabel(ms: number, stepMs: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const decimals = stepMs < 1000 ? 1 : 0;
  const padded = seconds.toFixed(decimals).padStart(decimals > 0 ? 4 : 2, "0");
  return `${minutes}:${padded}`;
}

/** How many filmstrip frames fit in a clip of this pixel width. */
export function filmstripFrameCount(widthPx: number): number {
  return Math.min(24, Math.max(1, Math.round(widthPx / 48)));
}
