/**
 * Layout maths for the slideshow canvas (SPEC §8.6).
 *
 * The document is always 1080×1920, whatever the canvas is scaled to. Every
 * transform in the store is in document coordinates, so a layer sits in the
 * same place on a 13" laptop and a 32" display, and an export never has to
 * re-derive anything from screen pixels.
 *
 * SPEC §15 on snapping: "with visible guides and the right threshold (~6px at
 * current zoom), it feels precise. Without it, amateurish." The threshold below
 * is therefore in *screen* pixels and divided by the current scale, so it stays
 * a constant on-screen distance as the canvas resizes rather than a constant
 * document distance that gets tighter as you zoom out.
 */

export const DOC_WIDTH = 1080;
export const DOC_HEIGHT = 1920;

/** Below this a layer can no longer be grabbed, so resizing stops here. */
export const MIN_LAYER_SIZE = 24;

/** SPEC §15 — measured on screen, converted to document units per frame. */
export const SNAP_SCREEN_PX = 6;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vector {
  x: number;
  y: number;
}

export type GuideOrigin = "slide-centre" | "slide-edge" | "layer";

export interface AlignmentGuide {
  axis: "x" | "y";
  /** Document-space coordinate of the line. */
  position: number;
  origin: GuideOrigin;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
}

interface SnapTarget {
  position: number;
  origin: GuideOrigin;
}

/** Leading edge, centre, trailing edge — the three lines a designer aligns to. */
const EDGE_FRACTIONS = [0, 0.5, 1] as const;

function axisTargets(siblings: readonly Rect[], axis: "x" | "y"): SnapTarget[] {
  const extent = axis === "x" ? DOC_WIDTH : DOC_HEIGHT;
  const targets: SnapTarget[] = [
    { position: 0, origin: "slide-edge" },
    { position: extent / 2, origin: "slide-centre" },
    { position: extent, origin: "slide-edge" },
  ];

  for (const sibling of siblings) {
    const start = axis === "x" ? sibling.x : sibling.y;
    const size = axis === "x" ? sibling.width : sibling.height;
    for (const fraction of EDGE_FRACTIONS) {
      targets.push({ position: start + size * fraction, origin: "layer" });
    }
  }

  return targets;
}

function snapAxis(
  start: number,
  size: number,
  targets: readonly SnapTarget[],
  threshold: number,
  axis: "x" | "y",
): { value: number; guides: AlignmentGuide[] } {
  let best: { value: number; distance: number } | null = null;

  for (const fraction of EDGE_FRACTIONS) {
    const edge = start + size * fraction;
    for (const target of targets) {
      const distance = Math.abs(target.position - edge);
      if (distance > threshold) continue;
      if (best !== null && distance >= best.distance) continue;
      best = { value: target.position - size * fraction, distance };
    }
  }

  const value = best === null ? start : best.value;

  // Collect every line the snapped position now sits on, not just the winning
  // one — aligning to a sibling's centre *and* the slide's centre should draw
  // both, which is how the user knows the two agree.
  const guides: AlignmentGuide[] = [];
  const seen = new Set<number>();
  for (const fraction of EDGE_FRACTIONS) {
    const edge = value + size * fraction;
    for (const target of targets) {
      if (Math.abs(target.position - edge) > 0.5) continue;
      if (seen.has(target.position)) continue;
      seen.add(target.position);
      guides.push({ axis, position: target.position, origin: target.origin });
    }
  }

  return { value, guides };
}

/**
 * Snaps a moving rectangle against the slide's edges and centre and against its
 * siblings, returning the corrected position and the lines to draw.
 *
 * Rotation is deliberately ignored: a rotated layer snaps on its layout box,
 * which is the box the resize handles and the Layout panel also describe. Using
 * the rotated hull instead would make the guides disagree with the numbers in
 * the panel, which is worse than the geometric purity is worth.
 */
export function snapRect(
  rect: Rect,
  siblings: readonly Rect[],
  threshold: number,
): SnapResult {
  const horizontal = snapAxis(rect.x, rect.width, axisTargets(siblings, "x"), threshold, "x");
  const vertical = snapAxis(rect.y, rect.height, axisTargets(siblings, "y"), threshold, "y");
  return {
    x: horizontal.value,
    y: vertical.value,
    guides: [...horizontal.guides, ...vertical.guides],
  };
}

export function rotateVector(vector: Vector, degrees: number): Vector {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

/** −1, 0 or 1 on each axis: which edges of the box a handle drags. */
export interface ResizeHandle {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

/**
 * Resizes from one handle while the opposite edge stays put.
 *
 * The pointer delta is rotated into the layer's own frame first, so dragging
 * the right-hand handle of a layer rotated 30° widens it along its own axis
 * rather than along the screen's — the difference between a rotation that
 * behaves and one that fights you.
 */
export function resizeRect(
  rect: Rect,
  rotation: number,
  handle: ResizeHandle,
  worldDelta: Vector,
  preserveAspect: boolean,
): Rect {
  const local = rotateVector(worldDelta, -rotation);

  let width = rect.width + handle.x * local.x;
  let height = rect.height + handle.y * local.y;

  if (preserveAspect && handle.x !== 0 && handle.y !== 0 && rect.height !== 0) {
    const ratio = rect.width / rect.height;
    // Let whichever axis the pointer moved further drive the other.
    if (Math.abs(width - rect.width) > Math.abs(height - rect.height)) height = width / ratio;
    else width = height * ratio;
  }

  width = Math.max(MIN_LAYER_SIZE, width);
  height = Math.max(MIN_LAYER_SIZE, height);

  // Growing from one edge moves the centre by half the growth, in local space.
  const shift = rotateVector(
    { x: (handle.x * (width - rect.width)) / 2, y: (handle.y * (height - rect.height)) / 2 },
    rotation,
  );
  const centreX = rect.x + rect.width / 2 + shift.x;
  const centreY = rect.y + rect.height / 2 + shift.y;

  return {
    x: centreX - width / 2,
    y: centreY - height / 2,
    width,
    height,
  };
}

/** Degrees from a centre point to a pointer, with 0° pointing up. */
export function angleFrom(centre: Vector, point: Vector): number {
  return (Math.atan2(point.y - centre.y, point.x - centre.x) * 180) / Math.PI + 90;
}

/** Keeps rotation in −180…180 so the panel readout never shows 359°. */
export function normaliseAngle(degrees: number): number {
  const wrapped = ((degrees + 180) % 360 + 360) % 360;
  return wrapped - 180;
}

export function roundRect(rect: Rect): Rect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/** Fits a source aspect inside a document-space box, centred. */
export function fitInto(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  return {
    width: Math.round(sourceWidth * ratio),
    height: Math.round(sourceHeight * ratio),
  };
}
