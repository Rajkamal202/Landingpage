"use client";

import * as React from "react";
import { useShortcut, useShortcutList } from "@/lib/hooks/use-shortcuts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { KeyboardShortcut } from "./keyboard-shortcut";

/**
 * SPEC §11 — the `?` dialog documenting every keyboard equivalent.
 *
 * It renders whatever the current screen registered through
 * `useShortcut`, so it cannot drift from the bindings that actually exist.
 * Mount it once inside the app shell; each editor's shortcuts appear when that
 * editor is on screen and disappear when it is not.
 */
export function ShortcutsDialog() {
  const [open, setOpen] = React.useState(false);
  const groups = useShortcutList();

  useShortcut({
    keys: "?",
    label: "Show keyboard shortcuts",
    group: "General",
    handler: () => setOpen((value) => !value),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="lg" aria-describedby="shortcuts-description">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription id="shortcuts-description">
            Everything on this screen that has a key. Press ? again to close.
          </DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <p className="text-body-md text-ink-500">
            This screen has no shortcuts of its own yet. Open an editor to see its keys.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {groups.map((group) => (
              <section key={group.group} className="flex flex-col gap-3">
                <h3 className="eyebrow text-ink-500">{group.group}</h3>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4">
                      <span className="text-body-sm min-w-0 truncate text-ink-700">
                        {item.label}
                      </span>
                      <KeyboardShortcut keys={item.keys} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
