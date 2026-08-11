"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";
import { Icon } from "@/components/icon";
import { IconClose, IconUpload } from "@/components/icons";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Progress } from "./progress";

/**
 * SPEC §5, §6.2. Keyboard-operable: the whole zone is a button, so a file
 * dialog is one Enter press away — a dropzone that only accepts drops is
 * unusable without a pointer.
 */
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  error?: string;
}

export interface UploadDropzoneProps {
  accept?: string;
  multiple?: boolean;
  files?: readonly UploadFile[];
  maxSizeBytes?: number;
  onFiles: (files: File[]) => void;
  onRemove?: (id: string) => void;
  hint?: string;
  className?: string;
}

export function UploadDropzone({
  accept = "video/*,image/*,audio/*",
  multiple = true,
  files = [],
  maxSizeBytes,
  onFiles,
  onRemove,
  hint = "MP4, MOV, PNG, JPG, WAV or MP3, up to 3GB each.",
  className,
}: UploadDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [rejected, setRejected] = React.useState<string | null>(null);

  const accept_ = (incoming: FileList | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    const tooBig = maxSizeBytes ? list.filter((file) => file.size > maxSizeBytes) : [];
    if (tooBig.length > 0 && maxSizeBytes) {
      const first = tooBig[0];
      setRejected(
        `${first?.name ?? "That file"} is ${formatBytes(first?.size ?? 0)}, over the ${formatBytes(maxSizeBytes)} limit. Compress it or trim it down first.`,
      );
      return;
    }
    setRejected(null);
    onFiles(list);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept_(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed",
          "px-6 py-12 text-center transition-ui duration-(--dur-fast)",
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-ink-300 bg-ink-50 hover:border-ink-400 hover:bg-ink-100",
        )}
      >
        <span
          className={cn(
            "grid size-12 place-items-center rounded-lg transition-ui duration-(--dur-fast)",
            dragging ? "bg-brand-100 text-brand-700" : "bg-surface text-ink-400 shadow-elev-1",
          )}
        >
          <Icon glyph={IconUpload} size={20} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-body-md font-medium text-ink-950">
            {dragging ? "Drop to upload" : "Drop files here, or click to browse"}
          </span>
          <span className="text-body-sm text-ink-500">{hint}</span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          accept_(event.target.files);
          event.target.value = "";
        }}
      />

      {rejected ? (
        <p role="alert" className="text-body-sm text-danger">
          {rejected}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-md border border-ink-200 bg-surface p-3"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-body-sm truncate text-ink-950">{file.name}</span>
                {file.error ? (
                  <span className="text-body-sm text-danger">{file.error}</span>
                ) : (
                  <Progress
                    value={file.progress}
                    aria-label={`Uploading ${file.name}`}
                    tone={file.progress === 100 ? "success" : "ink"}
                  />
                )}
              </span>
              <span className="mono-sm shrink-0 text-ink-400">{formatBytes(file.size)}</span>
              {onRemove ? (
                <IconButton
                  label={`Remove ${file.name}`}
                  glyph={IconClose}
                  size="sm"
                  onClick={() => onRemove(file.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** The "or upload a file" affordance used beside a URL field. */
export function UploadTrigger({
  onFiles,
  label = "Upload files",
  className,
}: {
  onFiles: (files: File[]) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        variant="secondary"
        shape="pill"
        size="lg"
        iconStart={IconUpload}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,image/*"
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
    </>
  );
}
