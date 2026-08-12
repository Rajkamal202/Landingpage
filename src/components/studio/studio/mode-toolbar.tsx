"use client";

import { cn } from "@/lib/cn";
import { GENERATION_MODE_LABEL, type GenerationMode } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconMore } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FloatingToolbar, ToolbarSeparator } from "@/components/ui/toolbar";
import { OVERFLOW_MODES, PRIMARY_MODES } from "./modes";

/**
 * SPEC §8.2 — the mode toolbar, centred above the composer.
 *
 * The travelling pill is `SegmentedControl`'s shared `layoutId`, not a second
 * implementation of it. The overflow trigger takes the pill's place when one
 * of its modes is active, so the toolbar always shows what is selected.
 */
export function ModeToolbar({
  mode,
  onModeChange,
  className,
}: {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  className?: string;
}) {
  const overflowActive = OVERFLOW_MODES.includes(mode);

  return (
    <FloatingToolbar ariaLabel="Generation mode" className={cn("max-w-full", className)}>
      <div className="min-w-0 overflow-x-auto">
        <SegmentedControl
          ariaLabel="Primary generation modes"
          tone="dark"
          size="sm"
          value={mode}
          onValueChange={onModeChange}
          items={PRIMARY_MODES.map((value) => ({
            value,
            label: GENERATION_MODE_LABEL[value],
          }))}
          className="bg-transparent p-0"
        />
      </div>

      <ToolbarSeparator className="bg-white/20" />

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={
            overflowActive
              ? `More modes, ${GENERATION_MODE_LABEL[mode]} selected`
              : "More generation modes"
          }
          className={cn(
            "inline-flex h-control-sm items-center gap-2 rounded-pill px-3",
            "text-body-sm font-medium transition-ui duration-(--dur-instant)",
            overflowActive
              ? "bg-white text-ink-950"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          {overflowActive ? (
            GENERATION_MODE_LABEL[mode]
          ) : (
            <Icon glyph={IconMore} size={16} />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={10}>
          <DropdownMenuRadioGroup
            value={mode}
            onValueChange={(next) => onModeChange(next as GenerationMode)}
          >
            {OVERFLOW_MODES.map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {GENERATION_MODE_LABEL[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </FloatingToolbar>
  );
}
