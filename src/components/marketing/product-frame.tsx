import Image from "next/image";
import { cn } from "@/lib/cn";

export interface FramePoster {
  readonly id: string;
  readonly src: string;
  readonly videoSrc?: string;
  readonly tag?: string;
  readonly title?: string;
}

export interface ProductFrameProps {
  posters: readonly FramePoster[];
  /** What this group of outputs is, in one sentence. */
  label: string;
  density?: "hero" | "step";
  className?: string;
}

export function ProductFrame({
  posters,
  label,
  density = "hero",
  className,
}: ProductFrameProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/40 bg-surface/95 p-3 backdrop-blur-md shadow-elev-4 lg:p-4",
        className,
      )}
    >
      <div
        role="region"
        aria-label={label}
        className={cn(
          "grid gap-3 rounded-xl bg-ink-950/5 p-3 sm:gap-4 sm:p-4",
          density === "hero"
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            : "grid-cols-2",
        )}
      >
        {posters.map((poster, index) => (
          <div
            key={poster.id}
            className={cn(
              "group relative aspect-ad w-full overflow-hidden rounded-lg bg-ink-900 shadow-elev-2 transition-ui hover:-translate-y-1 hover:shadow-elev-3",
              density === "hero" && index === 2 && "hidden sm:block",
              density === "hero" && index > 2 && "hidden lg:block",
            )}
          >
            {poster.videoSrc ? (
              <video
                src={poster.videoSrc}
                poster={poster.src}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover transition-transform duration-(--dur-slow) group-hover:scale-105"
              />
            ) : (
              <Image
                src={poster.src}
                alt={poster.title ?? ""}
                width={540}
                height={960}
                sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                priority={density === "hero" && index < 2}
                className="h-full w-full object-cover transition-transform duration-(--dur-slow) group-hover:scale-105"
              />
            )}

            {/* Gradient overlay on hover & bottom badges */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

            {poster.tag ? (
              <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-1.5">
                <span className="truncate rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-label font-medium tracking-wide text-white backdrop-blur-md">
                  {poster.tag}
                </span>
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
