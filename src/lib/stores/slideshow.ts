"use client";

import { create } from "zustand";
import type { LayerTransform, Slide, SlideLayer, SlideshowDoc } from "@/lib/schemas";
import {
  canRedo,
  canUndo,
  commitMerge,
  createCommandStack,
  execute,
  redo as redoStack,
  undo as undoStack,
  type Command,
  type CommandStackState,
} from "./command-stack";

/**
 * The slideshow editor's store (SPEC §8.6, §10).
 *
 * Undo is not re-implemented here — every mutation goes through the shared
 * `command-stack`, which owns the merge window that turns one layer drag into
 * one undo entry rather than fifty. What this module owns is the *document*
 * transformation: a set of pure producers plus one `commit` helper that wraps
 * them in a command.
 *
 * Commands are snapshot-based on purpose. The producers build a new document
 * with structural sharing, so an untouched layer keeps its object identity and
 * a memoised layer component does not re-render while a sibling is dragged.
 * Merging then collapses a gesture's intermediate snapshots, so a drag retains
 * exactly two: the state before it started and the state it ended in.
 *
 * Selection is deliberately absent — it lives in the URL (SPEC §10) so a
 * refresh restores it and a link to a specific slide is shareable.
 */

/** `variationId: null` addresses the base slide list rather than a variation. */
export interface SlideAddress {
  variationId: string | null;
  slideId: string;
}

export interface LayerAddress extends SlideAddress {
  layerId: string;
}

/** The four typographic fields a style preset owns (SPEC §8.6, "Style"). */
export type PresetTextFields = Pick<
  Extract<SlideLayer, { kind: "text" }>,
  "textStyle" | "fontFamily" | "fontWeight" | "align"
>;

export interface CommitOptions {
  /** Shown in the undo history — "Move layer", "Delete slide". */
  label: string;
  /** Commands sharing a key inside the merge window become one entry. */
  mergeKey?: string;
}

let sequence = 0;
const freshId = (prefix: string): string =>
  `${prefix}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * The background a slide gets when there is no sibling to inherit one from.
 * This is document data — a slide background is a colour the user picks in a
 * colour well, the same way the imported template picked this one — so it
 * cannot come from the chrome token scale.
 */
// token-lint-disable-next-line no-raw-hex — document data, not styling: see above.
const FALLBACK_SLIDE_BACKGROUND = "#0B0C0E";

/* ── Pure document readers ─────────────────────────────────────────────── */

export function slidesOf(doc: SlideshowDoc, variationId: string | null): readonly Slide[] {
  if (variationId === null) return doc.slides;
  return doc.variations.find((variation) => variation.id === variationId)?.slides ?? [];
}

export function findSlide(
  doc: SlideshowDoc,
  variationId: string | null,
  slideId: string | null,
): Slide | null {
  if (!slideId) return null;
  return slidesOf(doc, variationId).find((slide) => slide.id === slideId) ?? null;
}

export function findLayer(slide: Slide | null, layerId: string | null): SlideLayer | null {
  if (!slide || !layerId) return null;
  return slide.layers.find((layer) => layer.id === layerId) ?? null;
}

/* ── Pure document producers ───────────────────────────────────────────── */

function withSlides(
  doc: SlideshowDoc,
  variationId: string | null,
  map: (slides: readonly Slide[]) => Slide[],
): SlideshowDoc {
  if (variationId === null) return { ...doc, slides: map(doc.slides) };
  return {
    ...doc,
    variations: doc.variations.map((variation) =>
      variation.id === variationId ? { ...variation, slides: map(variation.slides) } : variation,
    ),
  };
}

function withSlide(
  doc: SlideshowDoc,
  address: SlideAddress,
  map: (slide: Slide) => Slide,
): SlideshowDoc {
  return withSlides(doc, address.variationId, (slides) =>
    slides.map((slide) => (slide.id === address.slideId ? map(slide) : slide)),
  );
}

/** A deep copy with fresh ids, so a duplicate is never a shared reference. */
export function copySlide(slide: Slide, name: string): Slide {
  return {
    ...slide,
    id: freshId("slide"),
    name,
    layers: slide.layers.map((layer) => ({
      ...layer,
      id: freshId("layer"),
      transform: { ...layer.transform },
    })),
  };
}

export function blankSlide(backgroundColor: string, name: string): Slide {
  return { id: freshId("slide"), name, backgroundAssetId: null, backgroundColor, layers: [] };
}

export const newLayerId = (): string => freshId("layer");

/* ── Store ─────────────────────────────────────────────────────────────── */

/**
 * Actions are grouped under one key rather than spread across the state.
 * They are created once and never change identity, so `state => state.actions`
 * is a stable selector: a component that only dispatches never re-renders when
 * the document changes, and a component that renders the document subscribes to
 * exactly that. This is what keeps a sixty-frames-a-second layer drag from
 * re-rendering the toolbar.
 */
export interface SlideshowActions {
  load: (doc: SlideshowDoc) => void;

  applyStylePreset: (
    variationId: string | null,
    name: string,
    fields: PresetTextFields,
  ) => void;
  addSlide: (variationId: string | null, afterSlideId: string | null) => string | null;
  duplicateSlide: (address: SlideAddress) => string | null;
  deleteSlide: (address: SlideAddress) => void;
  reorderSlides: (variationId: string | null, slides: Slide[]) => void;
  moveSlide: (address: SlideAddress, delta: number) => void;
  setSlideBackground: (address: SlideAddress, color: string) => void;

  addLayer: (address: SlideAddress, layer: SlideLayer) => void;
  updateLayer: (
    address: LayerAddress,
    produce: (layer: SlideLayer) => SlideLayer,
    options: CommitOptions,
  ) => void;
  setLayerTransform: (
    address: LayerAddress,
    transform: LayerTransform,
    options: CommitOptions,
  ) => void;
  duplicateLayer: (address: LayerAddress) => string | null;
  deleteLayer: (address: LayerAddress) => void;

  addVariation: () => string | null;

  /** Ends the merge window so the next command starts a new undo entry. */
  endGesture: () => void;
  undo: () => void;
  redo: () => void;
}

interface SlideshowState {
  doc: SlideshowDoc | null;
  /** Which project the loaded document belongs to, so a refetch cannot clobber edits. */
  loadedProjectId: string | null;
  stack: CommandStackState;
  undoable: boolean;
  redoable: boolean;
  actions: SlideshowActions;
}

/** The one stable selector every dispatching component uses. */
export const selectSlideshowActions = (state: SlideshowState): SlideshowActions => state.actions;

export const useSlideshowStore = create<SlideshowState>()((set, get) => {
  /**
   * Runs a producer as an undoable command. `execute` invokes `do()` inline,
   * which is what applies the new document; the stack is stored after.
   */
  function commit(options: CommitOptions, produce: (doc: SlideshowDoc) => SlideshowDoc): void {
    const before = get().doc;
    if (!before) return;
    const after = produce(before);
    if (after === before) return;

    const command: Command = {
      label: options.label,
      do: () => set({ doc: after }),
      undo: () => set({ doc: before }),
      ...(options.mergeKey === undefined ? {} : { mergeKey: options.mergeKey }),
    };

    const stack = execute(get().stack, command);
    set({ stack, undoable: canUndo(stack), redoable: canRedo(stack) });
  }

  const actions: SlideshowActions = {
    load: (doc) =>
      set({
        doc,
        loadedProjectId: doc.projectId,
        stack: createCommandStack(),
        undoable: false,
        redoable: false,
      }),

    /**
     * A preset is a typographic decision applied across the whole variation —
     * that is what keeps five slides looking like one ad. It deliberately does
     * not touch content, colour or position, which are per-layer choices the
     * user made and a preset has no business overwriting.
     */
    applyStylePreset: (variationId, name, fields) =>
      commit({ label: "Apply the style preset" }, (doc) => {
        const restyled = withSlides(doc, variationId, (slides) =>
          slides.map((slide) => ({
            ...slide,
            layers: slide.layers.map((layer) =>
              layer.kind === "text" ? { ...layer, ...fields } : layer,
            ),
          })),
        );
        return { ...restyled, stylePreset: name };
      }),

    addSlide: (variationId, afterSlideId) => {
      const doc = get().doc;
      if (!doc) return null;
      const slides = slidesOf(doc, variationId);
      const anchor =
        slides.find((slide) => slide.id === afterSlideId) ?? slides[slides.length - 1];
      const created = blankSlide(
        anchor?.backgroundColor ?? FALLBACK_SLIDE_BACKGROUND,
        `Slide ${slides.length + 1}`,
      );
      const index = afterSlideId
        ? slides.findIndex((slide) => slide.id === afterSlideId) + 1
        : slides.length;

      commit({ label: "Add a slide" }, (current) =>
        withSlides(current, variationId, (list) => [
          ...list.slice(0, index),
          created,
          ...list.slice(index),
        ]),
      );
      return created.id;
    },

    duplicateSlide: (address) => {
      const doc = get().doc;
      if (!doc) return null;
      const slides = slidesOf(doc, address.variationId);
      const source = slides.find((slide) => slide.id === address.slideId);
      if (!source) return null;
      const copy = copySlide(source, `${source.name} copy`);
      const index = slides.findIndex((slide) => slide.id === address.slideId) + 1;

      commit({ label: "Duplicate the slide" }, (current) =>
        withSlides(current, address.variationId, (list) => [
          ...list.slice(0, index),
          copy,
          ...list.slice(index),
        ]),
      );
      return copy.id;
    },

    deleteSlide: (address) =>
      commit({ label: "Delete the slide" }, (doc) =>
        withSlides(doc, address.variationId, (slides) =>
          slides.filter((slide) => slide.id !== address.slideId),
        ),
      ),

    reorderSlides: (variationId, slides) =>
      commit(
        { label: "Reorder the slides", mergeKey: `reorder:${variationId ?? "base"}` },
        (doc) => withSlides(doc, variationId, () => slides),
      ),

    moveSlide: (address, delta) => {
      const doc = get().doc;
      if (!doc) return;
      const slides = slidesOf(doc, address.variationId);
      const from = slides.findIndex((slide) => slide.id === address.slideId);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= slides.length) return;

      commit({ label: delta < 0 ? "Move the slide up" : "Move the slide down" }, (current) =>
        withSlides(current, address.variationId, (list) => {
          const next = [...list];
          const [moved] = next.splice(from, 1);
          if (moved) next.splice(to, 0, moved);
          return next;
        }),
      );
    },

    setSlideBackground: (address, color) =>
      commit(
        { label: "Change the slide background", mergeKey: `background:${address.slideId}` },
        (doc) => withSlide(doc, address, (slide) => ({ ...slide, backgroundColor: color })),
      ),

    addLayer: (address, layer) =>
      commit({ label: `Add the ${layer.kind} layer` }, (doc) =>
        withSlide(doc, address, (slide) => ({ ...slide, layers: [...slide.layers, layer] })),
      ),

    updateLayer: (address, produce, options) =>
      commit(options, (doc) =>
        withSlide(doc, address, (slide) => ({
          ...slide,
          layers: slide.layers.map((layer) =>
            layer.id === address.layerId ? produce(layer) : layer,
          ),
        })),
      ),

    setLayerTransform: (address, transform, options) =>
      actions.updateLayer(address, (layer) => ({ ...layer, transform }), options),

    duplicateLayer: (address) => {
      const doc = get().doc;
      if (!doc) return null;
      const source = findLayer(findSlide(doc, address.variationId, address.slideId), address.layerId);
      if (!source) return null;
      // Offset the copy so it is visibly a second object rather than an
      // invisible one sitting exactly on top of the original.
      const copy: SlideLayer = {
        ...source,
        id: freshId("layer"),
        name: `${source.name} copy`,
        transform: {
          ...source.transform,
          x: source.transform.x + 32,
          y: source.transform.y + 32,
        },
      };

      commit({ label: "Duplicate the layer" }, (current) =>
        withSlide(current, address, (slide) => ({ ...slide, layers: [...slide.layers, copy] })),
      );
      return copy.id;
    },

    deleteLayer: (address) =>
      commit({ label: "Delete the layer" }, (doc) =>
        withSlide(doc, address, (slide) => ({
          ...slide,
          layers: slide.layers.filter((layer) => layer.id !== address.layerId),
        })),
      ),

    addVariation: () => {
      const doc = get().doc;
      if (!doc) return null;
      const id = freshId("variation");
      // Variations are lettered from the imported one, so the new card reads as
      // the next in the set rather than as an unrelated copy.
      const letter = String.fromCharCode("A".charCodeAt(0) + doc.variations.length + 1);
      const name = `Variation ${letter}`;

      commit({ label: "Add a variation" }, (current) => ({
        ...current,
        variations: [
          ...current.variations,
          { id, name, slides: current.slides.map((slide) => copySlide(slide, slide.name)) },
        ],
      }));
      return id;
    },

    endGesture: () => set((state) => ({ stack: commitMerge(state.stack) })),

    undo: () => {
      const stack = undoStack(get().stack);
      set({ stack, undoable: canUndo(stack), redoable: canRedo(stack) });
    },

    redo: () => {
      const stack = redoStack(get().stack);
      set({ stack, undoable: canUndo(stack), redoable: canRedo(stack) });
    },
  };

  return {
    doc: null,
    loadedProjectId: null,
    stack: createCommandStack(),
    undoable: false,
    redoable: false,
    actions,
  };
});
