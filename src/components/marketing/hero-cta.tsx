"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconPlay } from "@/components/icons";

export function HeroCta() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="#templates"
          className={cn(
            "inline-flex h-control-lg items-center gap-2 rounded-pill bg-white px-6 font-medium text-ink-950 shadow-elev-3",
            "transition-ui duration-(--dur-fast) hover:bg-white/95 hover:shadow-elev-4",
          )}
        >
          <Icon glyph={IconPlay} size={16} />
          <span>Explore Templates</span>
        </a>

        <a
          href="#how-it-works"
          className={cn(
            "inline-flex h-control-lg items-center gap-2 rounded-pill border border-white/60 bg-white/10 px-6 font-medium text-white backdrop-blur-md",
            "transition-ui duration-(--dur-fast) hover:bg-white/20",
          )}
        >
          <span>See How It Works</span>
        </a>
      </div>

      <div className="flex items-center gap-2 text-label text-white/70">
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Real video and studio templates showcase below</span>
      </div>
    </div>
  );
}
