import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The white screenshot frame used by the hero and by every "how it works" step.
 *
 * It frames the real 9:16 output the studio produces — the committed placeholder
 * clips from `scripts/gen-media.mjs` — rather than a drawing of an interface
 * that does not exist yet. Every `<img>` carries explicit `width`/`height` so
 * the aspect box is reserved before the bytes arrive; SPEC §13 wants CLS under
 * 0.05 and a grid of unsized 9:16 images is the usual way to blow past it.
 *
 * The tiles are one picture, so the group takes the accessible name and the
 * individual images are silent. Five separate alt strings describing abstract
 * gradient loops would be noise in a screen reader, not information.
 */

export interface FramePoster {
  readonly id: string;
  readonly src: string;
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
        "rounded-xl bg-surface shadow-elev-4",
        density === "hero" ? "p-3 lg:p-4" : "p-3",
        className,
      )}
    >
      <div
        role="img"
        aria-label={label}
        className={cn(
          "grid gap-3 rounded-lg bg-ink-50 p-3",
          density === "hero"
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4"
            : "grid-cols-2",
        )}
      >
        {posters.map((poster, index) => (
          // next/image on the hero frame specifically: these stills are the LCP
          // element on `/`, and SPEC §13 asks for LCP under 2.0s. `priority` on
          // the first two preloads them; `sizes` stops the browser fetching a
          // 540px-wide source for a 190px slot. Width and height are always set
          // so the aspect box is reserved before the bytes arrive (CLS < 0.05).
          <Image
            key={poster.id}
            src={poster.src}
            alt=""
            width={540}
            height={960}
            sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
            priority={density === "hero" && index < 2}
            className={cn(
              "h-auto w-full rounded-md bg-ink-100 object-cover shadow-elev-1",
              density === "hero" && index === 2 && "hidden sm:block",
              density === "hero" && index > 2 && "hidden lg:block",
            )}
          />
        ))}
      </div>
    </div>
  );
}
