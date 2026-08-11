"use client";

import * as React from "react";
import { setFailureRate, getFailureRate } from "@/lib/api/client";
import {
  IconCopy,
  IconDelete,
  IconDownload,
  IconGenerate,
  IconSettings,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/toast";
import { Elevations, Row, Section } from "./primitives";

export function GalleryOverlays() {
  const [chaos, setChaos] = React.useState([getFailureRate() * 100]);

  return (
    <>
      <Section title="Elevation" description="Four levels. Every shadow is two-layer.">
        <Elevations />
      </Section>

      <Section
        title="Overlays"
        description="All of them share one surface, one enter and one exit."
      >
        <Row label="Dialog, sheet, popover, menus">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent aria-describedby="demo-dialog-description">
              <DialogHeader>
                <DialogTitle>Delete this project?</DialogTitle>
                <DialogDescription id="demo-dialog-description">
                  Hydrating serum — hook tests and its 8 variations will be removed. This cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Keep project</Button>
                <Button variant="danger">Delete project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent aria-describedby="demo-sheet-description">
              <SheetHeader>
                <SheetTitle>Library</SheetTitle>
                <SheetDescription id="demo-sheet-description">
                  Drag an asset into the composer, or use the picker.
                </SheetDescription>
              </SheetHeader>
              <SheetBody>
                <p className="text-body-md text-ink-500">
                  The library grid mounts here in Phase 2.
                </p>
              </SheetBody>
              <SheetFooter>
                <Button variant="secondary" block>
                  Upload files
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-sheet">
              <p className="text-title-md text-ink-950">Usage this cycle</p>
              <p className="text-body-sm mt-1 text-ink-500">
                Popovers and menus share one surface, so they never disagree.
              </p>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" iconStart={IconSettings}>
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Project</DropdownMenuLabel>
              <DropdownMenuItem glyph={IconCopy} shortcut="⌘D">
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem glyph={IconDownload}>Export video</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem glyph={IconDelete} tone="danger">
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ContextMenu>
            <ContextMenuTrigger asChild>
              <span className="text-body-sm flex h-control-md items-center rounded-md border border-dashed border-ink-300 px-4 text-ink-500">
                Right-click me
              </span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem glyph={IconCopy} shortcut="⌘C">
                Copy
              </ContextMenuItem>
              <ContextMenuItem glyph={IconGenerate}>Generate this row</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem glyph={IconDelete} tone="danger">
                Delete row
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Row>

        <Row label="Toasts">
          <Button
            variant="secondary"
            onClick={() => toast.success("Video exported", { description: "Saved to your library." })}
          >
            Success
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.error("Export didn't finish", {
                description: "The render ran out of memory at scene 6. Lower the resolution and try again.",
                action: { label: "Retry", onClick: () => undefined },
              })
            }
          >
            Error
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.promise(new Promise((resolve) => setTimeout(resolve, 1800)), {
                loading: "Exporting video",
                success: "Video exported",
                error: "Export didn't finish",
              })
            }
          >
            Promise
          </Button>
        </Row>
      </Section>

      <Section
        title="Failure injection"
        description="Every error state has to be reachable without editing code."
      >
        <Row label={`Injected failure rate: ${Math.round(chaos[0] ?? 0)}%`}>
          <div className="w-64">
            <Slider
              value={chaos}
              onValueChange={(next) => {
                setChaos(next);
                setFailureRate((next[0] ?? 0) / 100);
              }}
              max={100}
              aria-label="Injected failure rate"
              showValue
              formatValue={(value) => `${value}%`}
            />
          </div>
          <p className="text-body-sm max-w-measure text-ink-500">
            Applies to every call through the API layer. The same rate can be set per-route with
            a <code className="mono-sm">?chaos=</code> query param.
          </p>
        </Row>
      </Section>
    </>
  );
}
