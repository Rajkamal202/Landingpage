"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAsset } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { UploadDropzone, type UploadFile } from "@/components/ui/upload-dropzone";

const MAX_BYTES = 3 * 1024 * 1024 * 1024;

/**
 * The "or upload a file" path beside the URL field.
 *
 * It says plainly what it does: an upload lands in the library ready to use in
 * any editor. Rebuilding a video into scenes needs the original post's link,
 * so the copy points there rather than implying an upload gets de-edited too.
 */
export function UploadDialog({
  open,
  onOpenChange,
  queue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Files chosen from the affordance that opened this dialog. */
  queue?: readonly File[];
}) {
  const queryClient = useQueryClient();
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const [busy, setBusy] = React.useState(false);
  const cancelled = React.useRef(false);

  React.useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  const patch = (id: string, next: Partial<UploadFile>) => {
    setFiles((current) => current.map((file) => (file.id === id ? { ...file, ...next } : file)));
  };

  const run = async (incoming: File[]) => {
    const entries: UploadFile[] = incoming.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
    }));
    setFiles((current) => [...current, ...entries]);
    setBusy(true);

    let added = 0;
    for (const [index, file] of incoming.entries()) {
      const entry = entries[index];
      if (!entry) continue;
      try {
        for await (const event of uploadAsset({
          name: file.name,
          size: file.size,
          type: file.type,
        })) {
          if (cancelled.current) return;
          patch(entry.id, { progress: event.percent });
          if (event.asset) added += 1;
        }
      } catch {
        patch(entry.id, {
          error: "That file didn't finish uploading. Check your connection and add it again.",
        });
      }
    }

    if (cancelled.current) return;
    setBusy(false);
    void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    if (added > 0) {
      toast.success(added === 1 ? "File added to your library" : `${added} files added to your library`, {
        description: "Drag them into a composer, a canvas node or a slideshow layer.",
      });
    }
  };

  // Files picked from the trigger that opened this dialog start immediately;
  // the queue identity is the guard, so re-renders never re-upload.
  const runRef = React.useRef(run);
  runRef.current = run;
  const lastQueue = React.useRef<readonly File[] | null>(null);

  React.useEffect(() => {
    if (!open || !queue || queue.length === 0) return;
    if (lastQueue.current === queue) return;
    lastQueue.current = queue;
    void runRef.current([...queue]);
  }, [open, queue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby="upload-description">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription id="upload-description">
            Uploads go straight to your library and can be used in any editor. To rebuild a video
            into editable scenes, paste the link to the original post instead.
          </DialogDescription>
        </DialogHeader>

        <UploadDropzone
          files={files}
          maxSizeBytes={MAX_BYTES}
          onFiles={(incoming) => void run(incoming)}
          onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
        />

        <DialogFooter>
          <ButtonLink href="/app/library" variant="ghost" onClick={() => onOpenChange(false)}>
            Open the library
          </ButtonLink>
          <Button variant="primary" loading={busy} onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
