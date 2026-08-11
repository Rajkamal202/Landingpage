"use client";

import * as React from "react";

/**
 * SPEC §11: where a mouse gesture is the primary interaction, provide a
 * keyboard equivalent "and document it in a `?` shortcuts dialog."
 *
 * Editors *register* their shortcuts here; the dialog renders whatever is
 * registered. Four editors writing four `?` dialogs would produce four
 * different lists that disagree with each other and with the code.
 */

export interface ShortcutDefinition {
  /** "mod+z", "shift+ArrowLeft", "s", "?" */
  keys: string;
  /** What it does, in the interface's voice. Shown in the dialog. */
  label: string;
  /** Section heading in the dialog — "Playback", "Editing", "Selection". */
  group: string;
  handler: (event: KeyboardEvent) => void;
  /** Skip when focus is in a text field. Defaults to true. */
  skipInInputs?: boolean;
  enabled?: boolean;
  /** Hide from the dialog while still binding (rare — prefer visible). */
  hidden?: boolean;
}

interface RegistryEntry extends ShortcutDefinition {
  id: string;
}

interface ShortcutContextValue {
  register: (entry: RegistryEntry) => () => void;
  list: () => RegistryEntry[];
  version: number;
}

const ShortcutContext = React.createContext<ShortcutContextValue | null>(null);

function normalize(keys: string): string {
  return keys
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .sort()
    .join("+");
}

function eventSignature(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("mod");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  parts.push(key === " " ? "space" : key);
  return parts.sort().join("+");
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const entries = React.useRef(new Map<string, RegistryEntry>());
  const [version, setVersion] = React.useState(0);

  const register = React.useCallback((entry: RegistryEntry) => {
    entries.current.set(entry.id, entry);
    setVersion((v) => v + 1);
    return () => {
      entries.current.delete(entry.id);
      setVersion((v) => v + 1);
    };
  }, []);

  const list = React.useCallback(() => [...entries.current.values()], []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const signature = eventSignature(event);
      const typing = isTypingTarget(event.target);

      for (const entry of entries.current.values()) {
        if (entry.enabled === false) continue;
        if (normalize(entry.keys) !== signature) continue;
        if ((entry.skipInInputs ?? true) && typing) continue;
        event.preventDefault();
        entry.handler(event);
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = React.useMemo<ShortcutContextValue>(
    () => ({ register, list, version }),
    [register, list, version],
  );

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>;
}

/** Registers one shortcut for the lifetime of the calling component. */
export function useShortcut(definition: ShortcutDefinition): void {
  const ctx = React.useContext(ShortcutContext);
  const id = React.useId();
  const latest = React.useRef(definition);
  latest.current = definition;

  const { keys, label, group, enabled, hidden, skipInInputs } = definition;

  React.useEffect(() => {
    if (!ctx) return;
    return ctx.register({
      id,
      keys,
      label,
      group,
      enabled,
      hidden,
      skipInInputs,
      handler: (event) => latest.current.handler(event),
    });
  }, [ctx, id, keys, label, group, enabled, hidden, skipInInputs]);
}

/** Everything currently bound, grouped, for the `?` dialog. */
export function useShortcutList(): Array<{ group: string; items: RegistryEntry[] }> {
  const ctx = React.useContext(ShortcutContext);
  const version = ctx?.version ?? 0;

  return React.useMemo(() => {
    if (!ctx) return [];
    const groups = new Map<string, RegistryEntry[]>();
    for (const entry of ctx.list()) {
      if (entry.hidden) continue;
      groups.set(entry.group, [...(groups.get(entry.group) ?? []), entry]);
    }
    return [...groups.entries()].map(([group, items]) => ({ group, items }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, version]);
}
