"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";

/** Deterministic fill from the name, so a person keeps their colour. */
const FALLBACK_TONES = [
  "bg-brand-100 text-brand-700",
  "bg-cloud-rose text-ink-900",
  "bg-cloud-cream text-ink-900",
  "bg-ink-200 text-ink-700",
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function toneFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK_TONES[hash % FALLBACK_TONES.length] ?? FALLBACK_TONES[0];
}

export interface AvatarProps {
  name: string;
  src?: string | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "size-6 text-label",
  md: "size-8 text-body-sm",
  lg: "size-12 text-body-md",
} as const;

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-pill",
        SIZES[size],
        className,
      )}
    >
      {src ? (
        <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />
      ) : null}
      <AvatarPrimitive.Fallback
        delayMs={src ? 300 : 0}
        className={cn("grid size-full place-items-center font-medium", toneFor(name))}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
