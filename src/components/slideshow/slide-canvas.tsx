"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { hasAssetDragPayload, readAssetDragPayload, type AssetDragPayload } from "@/lib/dnd/payload";
import type { Asset, Slide } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconImage, IconLayers } from "@/components/icons";
import { AlignmentGuides } from "./alignment-guides";
import { CanvasLayer } from "./canvas-layer";
import type { GestureCallbacks } from "./canvas-types";
import { DOC_HEIGHT, DOC_WIDTH, type AlignmentGuide, type Rect } from "./geometry";
import { SelectionFrame } from "./selection-frame";

/**
 * The 9:16 editing surface (SPEC §8.6).
 *
 * The document is a fixed 1080×1920 and the stage is scaled to fit its
 * container, so every transform stays in document coordinates and is
 * resolution-independent — the same layer sits in the same place whether the
 * canvas is 380px tall or 900px, and an export never has to unpick screen
 * pixels.
 *
 * Guides live in this component's state rather than the store: they are drag
 * feedback, not document content, and putting them in the undo stack would mean
 * ⌘Z redrawing a line.
 */
export interface SlideCanvasProps {
  slide: Slide;
  assets: ReadonlyMap<string, Asset>;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  onTransform: GestureCallbacks["onTransform"];
  onGestureEnd: GestureCallbacks["onGestureEnd"];
  /** A library asset dropped at a point in document coordinates. */
  onDropAsset: (payload: AssetDragPayload, at: { x: number; y: number }) => void;
  onAddText: () => void;
  onAddImage: () => void;
}

/** Breathing room between the stage and its container, in CSS pixels. */
const CANVAS_PADDING = 24;

export function SlideCanvas({
  slide,
  assets,
  selectedLayerId,
  onSelectLayer,
  onTransform,
  onGestureEnd,
  onDropAsset,
  onAddText,
  onAddImage,
}: SlideCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const slideRef = React.useRef(slide);
  slideRef.current = slide;

  const [box, setBox] = React.useState({ width: 0, height: 0 });
  const [guides, setGuides] = React.useState<readonly AlignmentGuide[]>([]);
  const [dropActive, setDropActive] = React.useState(false);

  /**
   * The parent rebuilds its handlers on every render, and one of those renders
   * happens per drag frame. Routing them through a ref gives every layer a
   * callback identity that never changes, which is the last thing standing
   * between `React.memo` and a full re-render of the canvas sixty times a
   * second.
   */
  const callbacks = React.useRef({ onSelectLayer, onTransform, onGestureEnd, onDropAsset });
  callbacks.current = { onSelectLayer, onTransform, onGestureEnd, onDropAsset };

  const selectLayer = React.useCallback(
    (layerId: string | null) => callbacks.current.onSelectLayer(layerId),
    [],
  );
  const transformLayer = React.useCallback<SlideCanvasProps["onTransform"]>(
    (layerId, transform, label, mergeKey) =>
      callbacks.current.onTransform(layerId, transform, label, mergeKey),
    [],
  );
  const endGesture = React.useCallback(() => callbacks.current.onGestureEnd(), []);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const available = {
    width: Math.max(0, box.width - CANVAS_PADDING * 2),
    height: Math.max(0, box.height - CANVAS_PADDING * 2),
  };
  const scale = Math.min(available.width / DOC_WIDTH, available.height / DOC_HEIGHT) || 0;

  const getSiblings = React.useCallback(
    (layerId: string): Rect[] =>
      slideRef.current.layers
        .filter((layer) => layer.id !== layerId)
        .map((layer) => ({
          x: layer.transform.x,
          y: layer.transform.y,
          width: layer.transform.width,
          height: layer.transform.height,
        })),
    [],
  );

  const onGuides = React.useCallback((next: AlignmentGuide[]) => setGuides(next), []);

  /**
   * Drop is bound natively rather than in JSX. A drag-and-drop handler on a
   * plain element is exactly what `jsx-a11y/no-static-element-interactions`
   * exists to flag, and the honest answer to it is not a fake `role` on the
   * stage — it is a real keyboard equivalent, which this canvas has: the asset
   * picker, on `i`, documented in the shortcuts dialog. Binding the listeners
   * directly keeps the markup truthful about what the stage is.
   */
  React.useEffect(() => {
    const element = stageRef.current;
    if (!element || scale === 0) return;

    const toDocument = (clientX: number, clientY: number) => {
      const rect = element.getBoundingClientRect();
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    };

    const onDragOver = (event: DragEvent) => {
      if (!hasAssetDragPayload(event.dataTransfer)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      setDropActive(true);
    };
    const onDragLeave = () => setDropActive(false);
    const onDrop = (event: DragEvent) => {
      setDropActive(false);
      if (!event.dataTransfer) return;
      const payload = readAssetDragPayload(event.dataTransfer);
      if (!payload) return;
      event.preventDefault();
      callbacks.current.onDropAsset(payload, toDocument(event.clientX, event.clientY));
    };

    element.addEventListener("dragover", onDragOver);
    element.addEventListener("dragleave", onDragLeave);
    element.addEventListener("drop", onDrop);
    return () => {
      element.removeEventListener("dragover", onDragOver);
      element.removeEventListener("dragleave", onDragLeave);
      element.removeEventListener("drop", onDrop);
    };
  }, [scale]);

  const selected = slide.layers.find((layer) => layer.id === selectedLayerId) ?? null;

  return (
    <div
      ref={containerRef}
      className="grid size-full place-items-center overflow-hidden bg-surface-sunken p-6"
    >
      {scale > 0 ? (
        <div
          ref={stageRef}
          className={cn(
            "relative overflow-hidden rounded-md shadow-elev-3 transition-ui duration-(--dur-fast)",
            dropActive && "ring-focus",
          )}
          // A pointer press that reaches the stage itself, rather than a layer,
          // is a click on empty space. Escape is the keyboard equivalent and is
          // registered in the shortcuts dialog.
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) selectLayer(null);
          }}
          // dynamic: the stage is the 9:16 document scaled to fit its container.
          style={{
            width: DOC_WIDTH * scale,
            height: DOC_HEIGHT * scale,
            backgroundColor: slide.backgroundColor,
          }}
        >
          <div
            // dynamic: the document coordinate space, scaled once so every layer inside it stays resolution-independent.
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: DOC_WIDTH,
              height: DOC_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {slide.layers.map((layer) => (
              <CanvasLayer
                key={layer.id}
                layer={layer}
                assets={assets}
                scale={scale}
                selected={layer.id === selectedLayerId}
                getSiblings={getSiblings}
                onSelect={selectLayer}
                onTransform={transformLayer}
                onGuides={onGuides}
                onGestureEnd={endGesture}
              />
            ))}

            {selected ? (
              <SelectionFrame
                layer={selected}
                scale={scale}
                onTransform={transformLayer}
                onGuides={onGuides}
                onGestureEnd={endGesture}
              />
            ) : null}

            <AlignmentGuides guides={guides} scale={scale} />
          </div>

          {slide.layers.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center bg-surface/90">
              <EmptyState
                size="sm"
                glyph={IconLayers}
                title="This slide is empty"
                description="Add a headline, or drop an image straight in from the library."
                action={
                  <Button size="sm" variant="primary" onClick={onAddText}>
                    Add a text layer
                  </Button>
                }
                secondaryAction={
                  <Button size="sm" variant="secondary" iconStart={IconImage} onClick={onAddImage}>
                    Add an image
                  </Button>
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
