import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioScreen } from "@/components/studio/studio/studio-screen";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Generation studio" };

/** SPEC §8.2. The screen keeps mode and the open result in search params. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<StudioFallback />}>
      <StudioScreen projectId={id} />
    </Suspense>
  );
}

function StudioFallback() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-marketing px-4 pt-6 sm:px-6">
        <h1 className="sr-only">Generation studio</h1>
        <Skeleton className="mb-6 h-8 w-panel" />
        <div className="flex items-start gap-4">
          {[0, 1, 2, 3].map((column) => (
            <div key={column} className="flex min-w-0 flex-1 flex-col gap-4">
              <Skeleton className="aspect-9/16 w-full rounded-md" />
              <Skeleton className="aspect-4/5 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
