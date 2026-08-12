"use client";

import * as React from "react";
import { useSearchParamState } from "@/lib/hooks/use-search-param-state";
import type { Slide, SlideLayer, SlideshowDoc } from "@/lib/schemas";
import { findLayer, slidesOf } from "@/lib/stores/slideshow";

/**
 * SPEC §10: "URL is state where it should be." The open variation, the current
 * slide and the selected layer all live in search params, so a refresh restores
 * exactly what was on screen and a link points at one specific layer.
 *
 * The three params are written independently and read defensively: if a slide
 * id no longer resolves — because the variation changed under it, or the slide
 * was deleted — the selection falls back to the first slide rather than showing
 * an empty canvas. That makes a stale param self-healing instead of a bug.
 */
const asNullableString = {
  parse: (raw: string) => raw,
  serialize: (value: string | null) => value,
};

export interface SlideshowSelection {
  /** `null` is the imported variation the document ships as `doc.slides`. */
  variationId: string | null;
  slides: readonly Slide[];
  slide: Slide | null;
  slideIndex: number;
  layer: SlideLayer | null;
  layerId: string | null;
  selectVariation: (id: string | null) => void;
  selectSlide: (id: string | null) => void;
  selectLayer: (id: string | null) => void;
}

export function useSlideshowSelection(doc: SlideshowDoc | null): SlideshowSelection {
  const [rawVariation, setVariation] = useSearchParamState<string | null>("variation", {
    defaultValue: null,
    ...asNullableString,
  });
  const [rawSlide, setSlide] = useSearchParamState<string | null>("slide", {
    defaultValue: null,
    ...asNullableString,
  });
  const [rawLayer, setLayer] = useSearchParamState<string | null>("layer", {
    defaultValue: null,
    ...asNullableString,
  });

  // A variation id that no longer exists reads as the imported variation.
  const variationId =
    rawVariation !== null && doc?.variations.some((variation) => variation.id === rawVariation)
      ? rawVariation
      : null;

  const slides = React.useMemo(
    () => (doc ? slidesOf(doc, variationId) : []),
    [doc, variationId],
  );

  const slideIndex = React.useMemo(() => {
    const found = slides.findIndex((slide) => slide.id === rawSlide);
    return found === -1 ? (slides.length > 0 ? 0 : -1) : found;
  }, [slides, rawSlide]);

  const slide = slideIndex === -1 ? null : (slides[slideIndex] ?? null);
  const layer = findLayer(slide, rawLayer);

  return {
    variationId,
    slides,
    slide,
    slideIndex,
    layer,
    layerId: layer?.id ?? null,
    selectVariation: setVariation,
    selectSlide: setSlide,
    selectLayer: setLayer,
  };
}
