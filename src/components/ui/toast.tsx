"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { cn } from "@/lib/cn";

/**
 * Sonner, restyled down to the studs — SPEC §3 forbids shipping a library's
 * own visual language. Every class below is ours; `unstyled` turns off
 * Sonner's defaults entirely rather than layering on top of them.
 *
 * Copy rule from SPEC §12: an action keeps its name through the flow, so a
 * button labelled "Export video" produces "Video exported".
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      offset={24}
      gap={12}
      visibleToasts={4}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: cn(
            "group flex w-full items-start gap-3 rounded-lg border border-ink-200 bg-surface",
            "p-4 shadow-elev-3",
          ),
          title: "text-body-md font-medium text-ink-950",
          description: "text-body-sm mt-1 text-ink-500",
          actionButton: cn(
            "text-body-sm ml-auto shrink-0 rounded-md bg-ink-950 px-3 py-1 font-medium text-white",
            "transition-ui duration-(--dur-instant) hover:bg-ink-900",
          ),
          cancelButton: cn(
            "text-body-sm shrink-0 rounded-md px-3 py-1 font-medium text-ink-500",
            "transition-ui duration-(--dur-instant) hover:bg-ink-100 hover:text-ink-950",
          ),
          closeButton: cn(
            "absolute right-3 top-3 grid size-5 place-items-center rounded-sm text-ink-400",
            "transition-ui duration-(--dur-instant) hover:bg-ink-100 hover:text-ink-950",
          ),
          icon: "mt-px shrink-0",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-danger",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-brand-500",
        },
      }}
    />
  );
}

export { sonnerToast as toast };
