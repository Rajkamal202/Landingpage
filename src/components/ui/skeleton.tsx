import { cn } from "@/lib/cn";

/**
 * SPEC §13: skeletons, not spinners, for content.
 *
 * One shimmer, one direction, one speed, everywhere — a page where three
 * skeletons pulse out of phase looks broken rather than busy. The sweep is a
 * child element so it clips to the skeleton's own radius, and it is hidden
 * under reduced motion, leaving a static fill.
 */
export function Skeleton({
  className,
  shimmer = true,
  ...props
}: React.ComponentProps<"div"> & { shimmer?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded-sm bg-ink-100", className)}
      {...props}
    >
      {shimmer ? (
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent motion-reduce:hidden" />
      ) : null}
    </div>
  );
}

/** Multi-line text placeholder with a short last line, like real prose. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 && "w-3/5")} />
      ))}
    </div>
  );
}
