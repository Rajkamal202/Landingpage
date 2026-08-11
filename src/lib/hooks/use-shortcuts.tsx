"use client";

import * as React from "react";

/**
 * SPEC §11: where a mouse gesture is the primary interaction, provide a
 * keyboard equivalent "and document it in a `?` shortcuts dialog."
 *
 * Editors *register* their shortcuts here; the dialog renders whatever is
 * registered. Four editors writing four `?` dialogs would produce four
 * different lists that disagree with each other and with the code.
 *
 * The registry is an external store rather than context state. Putting the
 * version counter in the context value made the context identity change on
 * every registration, which re-ran every consumer's registration effect, which
 * bumped the version again — an infinite loop. Here the context value is
 * created once and never changes; subscribers are notified out of band.
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

export interface RegistryEntry extends ShortcutDefinition {
  id: string;
}

interface ShortcutStore {
  register: (entry: RegistryEntry) => () => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => readonly RegistryEntry[];
}

const ShortcutContext = React.createContext<ShortcutStore | null>(null);

const EMPTY: readonly RegistryEntry[] = [];

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
  const key = event.key.toLowerCase();
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
  const store = React.useMemo<ShortcutStore>(() => {
    const entries = new Map<string, RegistryEntry>();
    const listeners = new Set<() => void>();
    // `useSyncExternalStore` compares snapshots by identity, so the array is
    // rebuilt only when the registry actually changes.
    let snapshot: readonly RegistryEntry[] = EMPTY;

    const emit = () => {
      snapshot = [...entries.values()];
      for (const listener of listeners) listener();
    };

    return {
      register(entry) {
        entries.set(entry.id, entry);
        emit();
        return () => {
          entries.delete(entry.id);
          emit();
        };
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => snapshot,
    };
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const signature = eventSignature(event);
      const typing = isTypingTarget(event.target);

      for (const entry of store.getSnapshot()) {
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
  }, [store]);

  return <ShortcutContext.Provider value={store}>{children}</ShortcutContext.Provider>;
}

/** Registers one shortcut for the lifetime of the calling component. */
export function useShortcut(definition: ShortcutDefinition): void {
  const store = React.useContext(ShortcutContext);
  const id = React.useId();
  const latest = React.useRef(definition);
  latest.current = definition;

  const { keys, label, group, enabled, hidden, skipInInputs } = definition;

  React.useEffect(() => {
    if (!store) return;
    return store.register({
      id,
      keys,
      label,
      group,
      ...(enabled === undefined ? {} : { enabled }),
      ...(hidden === undefined ? {} : { hidden }),
      ...(skipInInputs === undefined ? {} : { skipInInputs }),
      handler: (event) => latest.current.handler(event),
    });
  }, [store, id, keys, label, group, enabled, hidden, skipInInputs]);
}

/** Everything currently bound, grouped, for the `?` dialog. */
export function useShortcutList(): Array<{ group: string; items: RegistryEntry[] }> {
  const store = React.useContext(ShortcutContext);

  const entries = React.useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getSnapshot ?? getEmpty,
    getEmpty,
  );

  return React.useMemo(() => {
    const groups = new Map<string, RegistryEntry[]>();
    for (const entry of entries) {
      if (entry.hidden) continue;
      groups.set(entry.group, [...(groups.get(entry.group) ?? []), entry]);
    }
    return [...groups.entries()].map(([group, items]) => ({ group, items }));
  }, [entries]);
}

const noopSubscribe = () => () => undefined;
const getEmpty = () => EMPTY;
