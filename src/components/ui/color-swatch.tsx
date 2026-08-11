"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconCheck } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";

/**
 * token-lint-disable-file no-raw-hex — this component's entire subject is
 * colour the *user* chooses: a brand palette entry, a caption fill, a layer
 * background. Those values cannot come from our token scale without capping
 * the brand kit at four colours. The presets below are seeded from the token
 * palette so the defaults still look like Vireo.
 *
 * A colour well for user-chosen colours — brand palette, caption fill, layer
 * background.
 *
 * The preview sits on a checkerboard so a light colour is still legible
 * against the near-white panel, and the hex is shown in mono for comparison.
 */
const PRESETS = [
  "#0B0C0E",
  "#FFFFFF",
  "#3D6FF0",
  "#14285F",
  "#C24BC9",
  "#E0812B",
  "#17916B",
  "#D0342C",
  "#F5EFE6",
  "#F0D5D8",
] as const;

export interface ColorSwatchProps {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function ColorSwatch({
  value,
  onValueChange,
  label,
  size = "md",
  className,
}: ColorSwatchProps) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);

  const commit = (next: string) => {
    const normalized = next.startsWith("#") ? next : `#${next}`;
    if (HEX.test(normalized)) onValueChange(normalized.toUpperCase());
    else setDraft(value);
  };

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${label}: ${value}`}
        className={cn(
          "flex items-center gap-2 rounded-sm border border-ink-200 bg-surface pr-2",
          "transition-ui duration-(--dur-instant) hover:border-ink-300",
          size === "sm" ? "h-control-sm pl-1" : "h-control-md pl-1",
          className,
        )}
      >
        <span
          className="block size-5 shrink-0 rounded-sm border border-ink-200"
          // dynamic: the swatch shows the user's chosen colour.
          style={{ backgroundColor: value }}
        />
        <span className="mono-sm text-ink-700">{value.toUpperCase()}</span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto">
        <p className="eyebrow mb-3 text-ink-400">{label}</p>
        <ul className="mb-4 grid grid-cols-5 gap-2">
          {PRESETS.map((preset) => (
            <li key={preset}>
              <button
                type="button"
                aria-label={preset}
                onClick={() => onValueChange(preset)}
                className={cn(
                  "grid size-8 place-items-center rounded-sm border border-ink-200",
                  "transition-ui duration-(--dur-instant) hover:scale-105",
                )}
                // dynamic: preset swatch fill.
                style={{ backgroundColor: preset }}
              >
                {preset.toUpperCase() === value.toUpperCase() ? (
                  <Icon
                    glyph={IconCheck}
                    size={16}
                    className={preset === "#FFFFFF" || preset === "#F5EFE6" ? "text-ink-950" : "text-white"}
                  />
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        <Input
          size="sm"
          value={draft}
          aria-label={`${label} hex value`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit(draft);
          }}
          className="mono-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
