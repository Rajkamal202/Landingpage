import type { Metadata } from "next";
import { Suspense } from "react";
import { ImportScreen } from "@/components/studio/import/import-screen";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Clone a video" };

/** SPEC §8.1. Search params (`?url=`, `?chaos=`) need the Suspense boundary. */
export default function Page() {
  return (
    <Suspense fallback={<ImportFallback />}>
      <ImportScreen />
    </Suspense>
  );
}

function ImportFallback() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-display-md text-ink-950">Clone a video</h1>
          <p className="text-body-lg text-ink-500">
            Paste a link and Vireo rebuilds it as editable scenes, text and captions.
          </p>
        </header>
        <div className="flex flex-col gap-4 rounded-lg border border-ink-200 bg-surface p-6 shadow-elev-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-control-lg w-full rounded-sm" />
          <Skeleton className="h-control-lg w-32 rounded-md" />
        </div>
      </div>
    </main>
  );
}
