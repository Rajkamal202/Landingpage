"use client";

import * as React from "react";
import { addAssetToTimeline } from "./add-asset";
import { Button } from "@/components/ui/button";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconFilm } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";

/**
 * SPEC §5: an empty state is mandatory on the timeline, and SPEC §15 calls
 * them "most of what separates a demo from a product". This one names what a
 * timeline is for and gives the two real ways to fill it — pick something
 * already in the library, or clone a video that works.
 */
export function TimelineEmpty() {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <>
      <EmptyState
        glyph={IconFilm}
        title="This timeline has no clips yet"
        description="Drop a scene on the video lane to start the cut, then layer captions, overlays and a music bed on top."
        action={
          <Button variant="primary" onClick={() => setPickerOpen(true)}>
            Add a scene
          </Button>
        }
        secondaryAction={
          <ButtonLink href="/app/import" variant="secondary">
            Clone a video instead
          </ButtonLink>
        }
      />

      <AssetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        kind="video"
        title="Add a scene"
        description="Pick a clip from your library. It lands on the video lane at the playhead."
        onSelect={(asset) => addAssetToTimeline(asset)}
      />
    </>
  );
}
