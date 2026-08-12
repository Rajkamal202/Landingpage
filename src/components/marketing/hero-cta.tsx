"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { detectPlatform } from "@/lib/api/clone";
import { PLATFORM_LABEL } from "@/lib/schemas";
import { transition } from "@/lib/motion/variants";
import { Icon } from "@/components/icon";
import { IconLink, IconUpload, IconWarning } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadDropzone } from "@/components/ui/upload-dropzone";

/**
 * SPEC §6.2 and §15 — "the thesis of the product compressed into one control".
 *
 * Four things had to be right here:
 *
 * 1. **Recognition is live, not on submit.** `detectPlatform()` runs on every
 *    change, so pasting a link produces the platform badge immediately. The
 *    same typed matcher backs the import screen, so the two agree by
 *    construction rather than by coincidence.
 * 2. **The message row never moves the page.** It is always in the layout at a
 *    fixed height; only its contents change. SPEC §13 is explicit about layout
 *    shift and this is the control most likely to cause it.
 * 3. **The message says what to do.** Both strings come from `detectPlatform`,
 *    which already writes them that way; the empty case is written here to the
 *    same rule. "Invalid input" appears nowhere.
 * 4. **The focus lift is on the container, not the input.** The user perceives
 *    the pill as the control, so the pill is what gains the ring and the
 *    elevation — the bare `<input>` suppresses its own outline in exchange.
 */

const IMPORT_PATH = "/app/import";

/** App-router `push` is typed against the generated route union. */
type PushHref = Parameters<ReturnType<typeof useRouter>["push"]>[0];

const EMPTY_MESSAGE =
  "Paste a link to the video or slideshow you want to clone, or upload a file instead.";

export function HeroCta() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const messageId = React.useId();

  const check = React.useMemo(() => detectPlatform(value), [value]);
  const platform = check.status === "ok" ? check.platform : null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (check.status === "empty") {
      setError(EMPTY_MESSAGE);
      return;
    }
    if (check.status !== "ok") {
      setError(check.message);
      return;
    }
    setError(null);
    router.push(`${IMPORT_PATH}?url=${encodeURIComponent(check.url)}` as PushHref);
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <form
          onSubmit={handleSubmit}
          className={cn(
            "relative flex w-full items-center gap-2 rounded-pill bg-surface p-2 shadow-elev-3",
            "sm:w-auto sm:min-w-cta",
            "transition-ui duration-(--dur-fast)",
            // SPEC §6.2: focus lifts the container to --elev-4 with a 2px brand ring.
            "has-[input:focus]:shadow-elev-4 has-[input:focus]:ring-2 has-[input:focus]:ring-brand-500",
          )}
        >
          <span className="flex shrink-0 items-center gap-2 pl-3">
            <Icon glyph={IconLink} size={16} className="text-ink-400" />
            <AnimatePresence initial={false}>
              {platform ? (
                <motion.span
                  key={platform}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={transition.fast}
                >
                  <Badge tone="brand" size="md" shape="pill">
                    {PLATFORM_LABEL[platform]}
                  </Badge>
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>

          <input
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            aria-label="Video or slideshow link"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? messageId : undefined}
            placeholder="Paste a video or slideshow link"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            className={cn(
              "text-body-md min-w-0 flex-1 bg-transparent text-ink-950",
              "placeholder:text-ink-400 focus-visible:outline-none",
            )}
          />

          <Button type="submit" variant="pill" size="md" className="shrink-0">
            Get started
          </Button>
        </form>

        {/* SPEC §6.2 asks for ink-400 here. On the cobalt sky ink-400 measures
            2.2:1, so this is white at 80% — 5.1:1 — which is the same optical
            weight against a dark ground and passes SPEC §11. */}
        <span aria-hidden="true" className="text-body-md text-white/80">
          or
        </span>

        <Button
          variant="ghost"
          shape="pill"
          size="lg"
          iconStart={IconUpload}
          onClick={() => setUploadOpen(true)}
          className={cn(
            "w-full shrink-0 border border-white/60 text-white sm:w-auto",
            "hover:bg-white/15 hover:text-white active:bg-white/25",
          )}
        >
          Upload files
        </Button>
      </div>

      {/* Reserved space: this row is in the layout whether or not it has copy. */}
      <div className="flex min-h-8 items-start justify-center">
        <AnimatePresence initial={false}>
          {error ? (
            <motion.p
              id={messageId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={transition.fast}
              className={cn(
                "text-body-sm flex max-w-measure items-start gap-2 rounded-lg bg-surface px-4 py-2",
                "text-left text-danger shadow-elev-1",
              )}
            >
              <Icon glyph={IconWarning} size={16} className="mt-px shrink-0" />
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onAccepted={() => {
          setUploadOpen(false);
          router.push(`${IMPORT_PATH}?source=upload` as PushHref);
        }}
      />
    </div>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  onAccepted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Drop in a video or a set of slideshow images and Vireo will pull them apart into
            editable scenes, text layers and timing.
          </DialogDescription>
        </DialogHeader>
        <UploadDropzone
          accept="video/*,image/*"
          hint="MP4, MOV, PNG or JPG, up to 3GB each."
          onFiles={onAccepted}
        />
      </DialogContent>
    </Dialog>
  );
}
