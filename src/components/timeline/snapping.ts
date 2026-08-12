import type { TimelineStore } from "@/lib/stores/timeline";
import { chooseTickStep } from "./geometry";

/**
 * SPEC §15: "Snapping in the timeline. With visible guides and the right
 * threshold (~6px at current zoom), it feels precise. Without it, amateurish."
 *
 * Targets are the three things an editor actually aligns to: the playhead, the
 * edges of other clips, and the ruler's own marks. The threshold is expressed
 * in pixels and converted at the current zoom, so snapping stays a constant
 * *visual* distance whether the whole project fits or one second does.
 */

export interface SnapResult {
  /** The value after snapping — unchanged when nothing was within range. */
  value: number;
  /** Where to draw the guide, or null when nothing snapped. */
  guideMs: number | null;
}

export function collectSnapTargets(
  state: TimelineStore,
  excluded: ReadonlySet<string>,
): number[] {
  const targets = new Set<number>([0, state.durationMs, state.playheadMs]);

  for (const clip of Object.values(state.clips)) {
    if (excluded.has(clip.id)) continue;
    targets.add(clip.startMs);
    targets.add(clip.startMs + clip.durationMs);
  }

  const step = chooseTickStep(state.pxPerMs);
  for (let ms = 0; ms <= state.durationMs; ms += step) targets.add(ms);

  return [...targets];
}

/** Snaps one value. `edges` lets a clip drag test both its head and its tail. */
export function snapValue(
  value: number,
  targets: readonly number[],
  thresholdMs: number,
): SnapResult {
  let best: number | null = null;
  let bestDistance = thresholdMs;

  for (const target of targets) {
    const distance = Math.abs(target - value);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }

  return best === null ? { value, guideMs: null } : { value: best, guideMs: best };
}

/**
 * Snaps a moving clip by whichever of its two edges is closest to a target —
 * the behaviour that makes butting two clips together feel automatic.
 */
export function snapSpan(
  startMs: number,
  durationMs: number,
  targets: readonly number[],
  thresholdMs: number,
): SnapResult {
  const head = snapValue(startMs, targets, thresholdMs);
  const tail = snapValue(startMs + durationMs, targets, thresholdMs);

  const headDistance = head.guideMs === null ? Infinity : Math.abs(head.value - startMs);
  const tailDistance =
    tail.guideMs === null ? Infinity : Math.abs(tail.value - (startMs + durationMs));

  if (headDistance === Infinity && tailDistance === Infinity) {
    return { value: startMs, guideMs: null };
  }
  if (headDistance <= tailDistance) return { value: head.value, guideMs: head.guideMs };
  return { value: tail.value - durationMs, guideMs: tail.guideMs };
}
