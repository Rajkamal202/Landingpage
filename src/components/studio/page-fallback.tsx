import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Suspense fallback for screens that read search params. It matches the
 * real page's rhythm exactly, so the first paint settles into the content
 * rather than jumping (SPEC §13 "no layout shift").
 */
export function PageFallback({
  title,
  description,
  tiles = 8,
}: {
  title: string;
  description: string;
  tiles?: number;
}) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-marketing flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-display-md text-ink-950">{title}</h1>
          <p className="text-body-md text-ink-500">{description}</p>
        </header>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: tiles }, (_, index) => (
            <li key={index} className="flex flex-col gap-3">
              <Skeleton className="aspect-9/16 w-full rounded-md" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
