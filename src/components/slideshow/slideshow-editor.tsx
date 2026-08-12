"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import { getProject, getProjectDocument } from "@/lib/api/projects";
import { useRegisterWorkspaceTab } from "@/components/app-shell/use-register-tab";
import type { AssetDragPayload } from "@/lib/dnd/payload";
import type { Asset, SlideLayer } from "@/lib/schemas";
import { selectSlideshowActions, useSlideshowStore } from "@/lib/stores/slideshow";
import { EditorFrame } from "@/components/app-shell/editor-frame";
import { IconSlideshow } from "@/components/icons";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { DOC_HEIGHT, DOC_WIDTH } from "./geometry";
import { createImageLayer, createTextLayer } from "./layer-defaults";
import { PropertiesPanel } from "./properties-panel";
import { findPreset } from "./presets";
import { SlideCanvas } from "./slide-canvas";
import { SlideRail } from "./slide-rail";
import { SlideshowShortcuts } from "./slideshow-shortcuts";
import { SlideshowSkeleton } from "./slideshow-skeleton";
import { SlideshowToolbar } from "./slideshow-toolbar";
import { useSlideshowSelection } from "./use-selection";
import { VariationRow, type VariationEntry } from "./variation-row";

/**
 * The slideshow editor (SPEC §8.6).
 *
 * This component owns wiring only: data in, store actions out, selection in the
 * URL. The rail, canvas, panel and variation row each own their own behaviour,
 * which is what keeps every one of them inside the ~200 line budget SPEC §13
 * sets.
 */
export function SlideshowEditor({ projectId }: { projectId: string }) {
  const project = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
  });

  // SPEC §7.1 — reaching this route directly still opens its workspace tab.
  useRegisterWorkspaceTab(project.data, "slideshow");

  const documentQuery = useQuery({
    queryKey: queryKeys.projects.document(projectId),
    queryFn: () => getProjectDocument(projectId),
    // The store is the live copy once loaded; a background refetch that
    // replaced it would silently throw away unsaved edits.
    staleTime: Number.POSITIVE_INFINITY,
  });

  const assetQuery = useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: () => listAssets(),
  });

  const assets = React.useMemo<ReadonlyMap<string, Asset>>(
    () => new Map((assetQuery.data ?? []).map((asset) => [asset.id, asset])),
    [assetQuery.data],
  );

  const doc = useSlideshowStore((state) => state.doc);
  const loadedProjectId = useSlideshowStore((state) => state.loadedProjectId);
  const { load } = useSlideshowStore(selectSlideshowActions);

  React.useEffect(() => {
    const incoming = documentQuery.data?.slideshow;
    if (incoming && loadedProjectId !== incoming.projectId) load(incoming);
  }, [documentQuery.data, loadedProjectId, load]);

  if (documentQuery.isError || project.isError) {
    return (
      <SlideshowLoadError
        onRetry={() => {
          void documentQuery.refetch();
          void project.refetch();
        }}
      />
    );
  }

  if (!doc || !project.data) return <SlideshowSkeleton />;

  return <SlideshowWorkspace projectName={project.data.name} assets={assets} />;
}

function SlideshowLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center bg-page">
      <EmptyState
        glyph={IconSlideshow}
        title="This slideshow didn't open"
        description="The project data didn't come back. Nothing has been lost — try loading it again."
        action={
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    </div>
  );
}

/**
 * Split from the loader so every hook below runs against a document that is
 * known to exist, rather than against a nullable one guarded at forty call
 * sites.
 */
function SlideshowWorkspace({
  projectName,
  assets,
}: {
  projectName: string;
  assets: ReadonlyMap<string, Asset>;
}) {
  const doc = useSlideshowStore((state) => state.doc);
  const undoable = useSlideshowStore((state) => state.undoable);
  const redoable = useSlideshowStore((state) => state.redoable);
  const actions = useSlideshowStore(selectSlideshowActions);
  const selection = useSlideshowSelection(doc);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const contentFieldRef = React.useRef<HTMLTextAreaElement | null>(null);

  const { variationId, slides, slide, slideIndex, layer } = selection;

  const slideAddress = React.useMemo(
    () => (slide ? { variationId, slideId: slide.id } : null),
    [slide, variationId],
  );

  /* ── Layer actions ───────────────────────────────────────────────────── */

  const addLayer = React.useCallback(
    (built: SlideLayer) => {
      if (!slideAddress) return;
      actions.addLayer(slideAddress, built);
      selection.selectLayer(built.id);
    },
    [slideAddress, actions, selection],
  );

  const addText = React.useCallback(() => {
    if (!doc || !slide) return;
    addLayer(createTextLayer(doc, slide));
    // The caption lands with a starting word; put the cursor in the field so
    // the next thing the user types replaces it.
    requestAnimationFrame(() => contentFieldRef.current?.select());
  }, [doc, slide, addLayer]);

  const addImageFromAsset = React.useCallback(
    (asset: Asset, at: { x: number; y: number }) => {
      addLayer(
        createImageLayer({
          assetId: asset.id,
          name: asset.name,
          sourceWidth: asset.width,
          sourceHeight: asset.height,
          at,
        }),
      );
    },
    [addLayer],
  );

  const onDropAsset = React.useCallback(
    (payload: AssetDragPayload, at: { x: number; y: number }) => {
      const asset = assets.get(payload.assetId);
      if (!asset) {
        toast.error("That asset isn't in your library any more", {
          description: "Open the library and pick another, or upload it again.",
        });
        return;
      }
      addImageFromAsset(asset, at);
    },
    [assets, addImageFromAsset],
  );

  const nudge = React.useCallback(
    (dx: number, dy: number) => {
      if (!slideAddress || !layer) return;
      actions.setLayerTransform(
        { ...slideAddress, layerId: layer.id },
        { ...layer.transform, x: layer.transform.x + dx, y: layer.transform.y + dy },
        { label: "Nudge the layer", mergeKey: `nudge:${layer.id}` },
      );
    },
    [slideAddress, layer, actions],
  );

  const deleteLayer = React.useCallback(() => {
    if (!slideAddress || !layer) return;
    actions.deleteLayer({ ...slideAddress, layerId: layer.id });
    selection.selectLayer(null);
  }, [slideAddress, layer, actions, selection]);

  const duplicateLayer = React.useCallback(() => {
    if (!slideAddress || !layer) return;
    const id = actions.duplicateLayer({ ...slideAddress, layerId: layer.id });
    if (id) selection.selectLayer(id);
  }, [slideAddress, layer, actions, selection]);

  /* ── Slide actions ───────────────────────────────────────────────────── */

  const goToSlide = React.useCallback(
    (delta: number) => {
      const next = slides[slideIndex + delta];
      if (next) selection.selectSlide(next.id);
    },
    [slides, slideIndex, selection],
  );

  const addSlide = React.useCallback(
    (afterSlideId: string | null) => {
      const id = actions.addSlide(variationId, afterSlideId);
      if (id) selection.selectSlide(id);
    },
    [actions, variationId, selection],
  );

  /* ── Variations ──────────────────────────────────────────────────────── */

  const entries = React.useMemo<VariationEntry[]>(() => {
    if (!doc) return [];
    return [
      { id: null, name: doc.templateVariation, slides: doc.slides },
      ...doc.variations.map((variation) => ({
        id: variation.id,
        name: variation.name,
        slides: variation.slides,
      })),
    ];
  }, [doc]);

  const exportOne = (entry: VariationEntry) =>
    toast.success(`Exporting ${entry.name}`, {
      description: `${entry.slides.length} slides are rendering at ${DOC_WIDTH} × ${DOC_HEIGHT}. They'll appear in your library.`,
    });

  const exportAll = () =>
    toast.success("Exporting all variations", {
      description: `${entries.length} variations are rendering at ${DOC_WIDTH} × ${DOC_HEIGHT}. They'll appear in your library.`,
    });

  const addVariation = () => {
    const id = actions.addVariation();
    if (id) selection.selectVariation(id);
  };

  if (!doc) return null;

  const announcement = layer
    ? `${layer.name} selected on slide ${slideIndex + 1}`
    : slide
      ? `Slide ${slideIndex + 1} of ${slides.length}, ${slide.name}. Nothing selected.`
      : "This variation has no slides.";

  return (
    <EditorFrame
      surface="slideshow editor"
      projectName={projectName}
      glyph={IconSlideshow}
      availableOnMobile="Variations and slide order are safe to review here; layout editing opens on a laptop."
      toolbar={
        <SlideshowToolbar
          projectName={projectName}
          templateName={doc.templateName}
          variations={entries.map((entry) => ({
            id: entry.id,
            name: entry.name,
            slideCount: entry.slides.length,
          }))}
          activeVariationId={variationId}
          onVariationChange={selection.selectVariation}
          undoable={undoable}
          redoable={redoable}
          onUndo={actions.undo}
          onRedo={actions.redo}
          onAddVariation={addVariation}
          onExportAll={exportAll}
        />
      }
      panel={
        <PropertiesPanel
          slide={slide}
          layer={layer}
          stylePreset={doc.stylePreset}
          contentFieldRef={contentFieldRef}
          onPresetChange={(name) => {
            const preset = findPreset(name);
            if (!preset) return;
            actions.applyStylePreset(variationId, preset.name, {
              textStyle: preset.textStyle,
              fontFamily: preset.fontFamily,
              fontWeight: preset.fontWeight,
              align: preset.align,
            });
          }}
          onBackgroundChange={(color) => {
            if (slideAddress) actions.setSlideBackground(slideAddress, color);
          }}
          onLayerChange={(produce, label, mergeKey) => {
            if (!slideAddress || !layer) return;
            actions.updateLayer({ ...slideAddress, layerId: layer.id }, produce, {
              label,
              ...(mergeKey === undefined ? {} : { mergeKey }),
            });
          }}
          onDuplicateLayer={duplicateLayer}
          onDeleteLayer={deleteLayer}
          onAddText={addText}
        />
      }
      footer={
        <VariationRow
          entries={entries}
          assets={assets}
          activeId={variationId}
          onSelect={selection.selectVariation}
          onExport={exportOne}
          onAdd={addVariation}
        />
      }
    >
      <div className="flex h-full min-h-0">
        <SlideRail
          slides={slides}
          assets={assets}
          activeSlideId={slide?.id ?? null}
          activeIndex={slideIndex}
          onSelect={selection.selectSlide}
          onReorder={(next) => actions.reorderSlides(variationId, next)}
          onAdd={addSlide}
          onDuplicate={(slideId) => {
            const id = actions.duplicateSlide({ variationId, slideId });
            if (id) selection.selectSlide(id);
          }}
          onDelete={(slideId) => actions.deleteSlide({ variationId, slideId })}
          onMove={(slideId, delta) => actions.moveSlide({ variationId, slideId }, delta)}
        />

        <div className="min-w-0 flex-1">
          {slide ? (
            <SlideCanvas
              slide={slide}
              assets={assets}
              selectedLayerId={selection.layerId}
              onSelectLayer={(id) => {
                if (id !== selection.layerId) selection.selectLayer(id);
              }}
              onTransform={(layerId, transform, label, mergeKey) => {
                if (!slideAddress) return;
                actions.setLayerTransform({ ...slideAddress, layerId }, transform, {
                  label,
                  mergeKey,
                });
              }}
              onGestureEnd={actions.endGesture}
              onDropAsset={onDropAsset}
              onAddText={addText}
              onAddImage={() => setPickerOpen(true)}
            />
          ) : (
            <div className="grid size-full place-items-center bg-surface-sunken">
              <EmptyState
                glyph={IconSlideshow}
                title="This variation has no slides"
                description="Add the first slide and lay out the hook — the rest of the deck follows from it."
                action={
                  <Button variant="primary" onClick={() => addSlide(null)}>
                    Add a slide
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <AssetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Add an image layer"
        description="Pick a library asset. It lands in the centre of the slide, ready to move."
        onSelect={(asset) => addImageFromAsset(asset, { x: DOC_WIDTH / 2, y: DOC_HEIGHT / 2 })}
      />

      <SlideshowShortcuts
        nudge={nudge}
        duplicateLayer={duplicateLayer}
        deleteLayer={deleteLayer}
        deselect={() => selection.selectLayer(null)}
        addText={addText}
        addImage={() => setPickerOpen(true)}
        goToSlide={goToSlide}
        moveSlide={(delta) => {
          if (slideAddress) actions.moveSlide(slideAddress, delta);
        }}
        undo={actions.undo}
        redo={actions.redo}
      />
    </EditorFrame>
  );
}
