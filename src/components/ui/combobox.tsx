"use client";

import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconCheck, IconChevronsUpDown, IconSearch } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { menuItem } from "./surface";

/**
 * cmdk, restyled to our surface. Powers the filter comboboxes and — with
 * `CommandPalette` below — the canvas node library and ⌘K.
 */
export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Choose one",
  searchPlaceholder = "Search",
  emptyMessage = "Nothing matches that search yet.",
  ariaLabel,
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={cn(
          "flex h-control-md w-full items-center justify-between gap-2 rounded-sm border",
          "border-ink-200 bg-surface px-3 text-body-md transition-ui duration-(--dur-fast)",
          "hover:border-ink-300",
          "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-300",
          selected ? "text-ink-950" : "text-ink-400",
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <Icon glyph={IconChevronsUpDown} size={16} className="text-ink-400" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command loop className="dropdown-list flex flex-col">
          <div className="flex items-center gap-2 border-b border-ink-200 px-3">
            <Icon glyph={IconSearch} size={16} className="text-ink-400" />
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-control-md flex-1 bg-transparent text-body-sm text-ink-950 placeholder:text-ink-400 focus-visible:outline-none"
            />
          </div>
          <CommandList className="overflow-y-auto p-1">
            <CommandEmpty className="px-2 py-6 text-center text-body-sm text-ink-500">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(menuItem, "aria-selected:bg-ink-100 aria-selected:text-ink-950")}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="mono-sm text-ink-400">{option.hint}</span>
                  ) : null}
                  {option.value === value ? (
                    <Icon glyph={IconCheck} size={16} className="text-brand-500" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
