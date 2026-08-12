import type { LayerTransform } from "@/lib/schemas";
import type { AlignmentGuide, Rect } from "./geometry";

/**
 * The contract between the canvas and the two things that drag on it — a layer
 * body and a selection handle. Both report transforms the same way, so both end
 * up as one undo entry per gesture rather than one per pointer event.
 *
 * Every callback takes the layer id rather than being bound to one layer, which
 * keeps them referentially stable across renders. That is what lets the layer
 * components stay memoised while a sibling is being dragged sixty times a
 * second: nothing about their props changes, so they do not re-render at all.
 */
export interface GestureCallbacks {
  onTransform: (
    layerId: string,
    transform: LayerTransform,
    label: string,
    mergeKey: string,
  ) => void;
  /** Alignment lines to draw right now; an empty array clears them. */
  onGuides: (guides: AlignmentGuide[]) => void;
  /** Closes the merge window so the next gesture is a separate undo entry. */
  onGestureEnd: () => void;
}

/** Boxes to snap against, resolved at gesture start rather than passed as props. */
export type SiblingResolver = (layerId: string) => Rect[];

/** Pointer travel, in screen pixels, before a press counts as a drag. */
export const DRAG_THRESHOLD_PX = 3;
