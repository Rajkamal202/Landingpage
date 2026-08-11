"use client";

import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconSearch, type IconDef } from "@/components/icons";
import { DialogOverlay } from "./dialog";
import { KeyboardShortcut } from "./keyboard-shortcut";

/**
 * The searchable palette behind the canvas node library (SPEC §8.4) and any
 * ⌘K surface. One implementation so "search a list of actions" always looks
 * and behaves the same.
 */
export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  group: string;
  glyph?: IconDef;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: readonly CommandAction[];
  placeholder?: string;
  emptyMessage?: string;
  title: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  actions,
  placeholder = "Search",
  emptyMessage = "No matches. Try a different word.",
  title,
}: CommandPaletteProps) {
  const groups = React.useMemo(() => {
    const map = new Map<string, CommandAction[]>();
    for (const action of actions) {
      map.set(action.group, [...(map.get(action.group) ?? []), action]);
    }
    return [...map.entries()];
  }, [actions]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "anim-dialog fixed left-1/2 top-24 z-(--z-dialog) w-full max-w-xl -translate-x-1/2",
            "overflow-hidden rounded-lg border border-ink-200 bg-surface shadow-elev-4",
            "focus-visible:outline-none",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Type to search, then press Enter to run.
          </DialogPrimitive.Description>

          <Command loop className="palette-list flex flex-col">
            <div className="flex items-center gap-3 border-b border-ink-200 px-4">
              <Icon glyph={IconSearch} size={20} className="text-ink-400" />
              <CommandInput
                autoFocus
                placeholder={placeholder}
                className="h-control-lg flex-1 bg-transparent text-body-md text-ink-950 placeholder:text-ink-400 focus-visible:outline-none"
              />
            </div>

            <CommandList className="overflow-y-auto p-2">
              <CommandEmpty className="px-3 py-10 text-center text-body-sm text-ink-500">
                {emptyMessage}
              </CommandEmpty>

              {groups.map(([group, items]) => (
                <CommandGroup key={group} className="pb-2">
                  <p className="eyebrow px-2 py-2 text-ink-400">{group}</p>
                  {items.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={`${action.label} ${action.description ?? ""}`}
                      onSelect={() => {
                        action.onSelect();
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex cursor-default items-center gap-3 rounded-sm px-2 py-2",
                        "text-body-sm text-ink-700 outline-none",
                        "aria-selected:bg-ink-100 aria-selected:text-ink-950",
                      )}
                    >
                      {action.glyph ? (
                        <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-ink-100 text-ink-700">
                          <Icon glyph={action.glyph} size={16} />
                        </span>
                      ) : null}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-ink-950">{action.label}</span>
                        {action.description ? (
                          <span className="truncate text-ink-500">{action.description}</span>
                        ) : null}
                      </span>
                      {action.shortcut ? <KeyboardShortcut keys={action.shortcut} /> : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
