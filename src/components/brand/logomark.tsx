"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

export interface LogomarkProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Authentic Avelon brand mark — 3D vibrant dimensional ribbon A.
 */
export function Logomark({ size = 24, className, priority = false }: LogomarkProps) {
  const width = Math.round(size * 1.38);

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center select-none", className)}
      // dynamic: width and height calculated from size prop to preserve mark aspect ratio
      style={{ width: `${width}px`, height: `${size}px` }}
    >
      <Image
        src="/brand/avelon-mark.png"
        alt="Avelon"
        width={708}
        height={512}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export interface LogoProps {
  /** Wordmark font size in px; the mark scales from it optically. */
  size?: number;
  showWordmark?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Avelon mark + wordmark lockup.
 * Uses the authentic 3D ribbon mark with typographic lockup
 * tuned for perfect optical balance in both dark and light modes.
 */
export function Logo({
  size = 20,
  showWordmark = true,
  className,
  priority = false,
}: LogoProps) {
  const markSize = Math.round(size * 1.25);

  return (
    <span
      className={cn("inline-flex items-center gap-2.5 text-current select-none", className)}
      // dynamic: font-size scales optically from the size prop
      style={{ fontSize: `${size}px` }}
    >
      <Logomark size={markSize} priority={priority} />
      {showWordmark ? (
        <span
          className="font-sans font-bold tracking-widest uppercase text-current"
          // dynamic: wordmark size proportional to the lockup size prop
          style={{
            fontSize: `${Math.round(size * 0.95)}px`,
            lineHeight: 1,
          }}
        >
          AVELON
        </span>
      ) : null}
    </span>
  );
}
