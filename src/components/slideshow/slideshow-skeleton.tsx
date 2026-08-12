import { Skeleton } from "@/components/ui/skeleton";

/**
 * SPEC §13: skeletons, not spinners.
 *
 * It is shaped like the editor it precedes — rail on the left, 9:16 stage in
 * the middle, 280px panel on the right — so the layout does not jump when the
 * document arrives. A centred spinner would tell the user nothing about what is
 * coming and would shift everything the moment it did.
 */
export function SlideshowSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true">
      <div className="flex h-topbar shrink-0 items-center gap-3 border-b border-ink-200 bg-surface px-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-control-sm w-panel rounded-sm" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-control-sm rounded-sm" />
          <Skeleton className="size-control-sm rounded-sm" />
          <Skeleton className="h-control-sm w-24 rounded-md" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-rail shrink-0 flex-col gap-2 border-r border-ink-200 bg-surface p-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="aspect-9/16 w-full rounded-sm" />
          ))}
        </div>

        <div className="grid min-w-0 flex-1 place-items-center bg-surface-sunken p-6">
          <Skeleton className="aspect-9/16 h-full rounded-md" />
        </div>

        <div className="flex w-panel shrink-0 flex-col gap-3 border-l border-ink-200 bg-surface p-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-control-md w-full rounded-sm" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-control-md w-full rounded-sm" />
          <Skeleton className="h-control-md w-full rounded-sm" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-control-md w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
}
