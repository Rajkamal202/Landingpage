/**
 * Command-pattern undo, shared by all four editor stores (SPEC §10).
 *
 * Four hand-rolled undo stacks is four different coalescing bugs, four
 * different history limits, and four different answers to "what does ⌘Z do
 * while I'm mid-drag". This is that answer, once.
 *
 * Coalescing is the part that matters: dragging a clip fires a command per
 * pointer-move. Without merging, one drag costs fifty undo entries and ⌘Z
 * becomes useless. Commands that share a `mergeKey` inside the merge window
 * collapse into a single entry that undoes the whole gesture.
 */

export interface Command {
  /** Shown in the history and in the undo toast — "Move clip", "Delete node". */
  label: string;
  do: () => void;
  undo: () => void;
  /**
   * Commands with the same key, issued within `mergeWindowMs` of each other,
   * collapse into one. Leave undefined for discrete actions.
   */
  mergeKey?: string;
}

export interface CommandStackState {
  past: Command[];
  future: Command[];
  lastAt: number;
  lastMergeKey: string | undefined;
}

export const MAX_HISTORY = 100;
const MERGE_WINDOW_MS = 500;

export function createCommandStack(): CommandStackState {
  return { past: [], future: [], lastAt: 0, lastMergeKey: undefined };
}

export interface ExecuteOptions {
  /** Injected in tests so merge behaviour is deterministic. */
  now?: number;
  mergeWindowMs?: number;
}

/**
 * Runs the command and records it. Returns the next state — the caller owns
 * storing it, so this stays a pure function that a Zustand slice can use
 * inside `set()` without surprises.
 */
export function execute(
  state: CommandStackState,
  command: Command,
  options: ExecuteOptions = {},
): CommandStackState {
  command.do();

  const now = options.now ?? Date.now();
  const window = options.mergeWindowMs ?? MERGE_WINDOW_MS;
  const previous = state.past[state.past.length - 1];

  const canMerge =
    command.mergeKey !== undefined &&
    previous !== undefined &&
    state.lastMergeKey === command.mergeKey &&
    now - state.lastAt <= window;

  if (canMerge && previous) {
    // Keep the *original* undo — undoing a merged gesture must return to the
    // state before the gesture began, not before its final increment.
    const merged: Command = {
      label: command.label,
      do: command.do,
      undo: previous.undo,
      ...(command.mergeKey === undefined ? {} : { mergeKey: command.mergeKey }),
    };
    return {
      past: [...state.past.slice(0, -1), merged],
      future: [],
      lastAt: now,
      lastMergeKey: command.mergeKey,
    };
  }

  const past = [...state.past, command];
  return {
    past: past.length > MAX_HISTORY ? past.slice(past.length - MAX_HISTORY) : past,
    future: [],
    lastAt: now,
    lastMergeKey: command.mergeKey,
  };
}

export function undo(state: CommandStackState): CommandStackState {
  const command = state.past[state.past.length - 1];
  if (!command) return state;
  command.undo();
  return {
    past: state.past.slice(0, -1),
    future: [command, ...state.future],
    lastAt: 0,
    lastMergeKey: undefined,
  };
}

export function redo(state: CommandStackState): CommandStackState {
  const command = state.future[0];
  if (!command) return state;
  command.do();
  return {
    past: [...state.past, command],
    future: state.future.slice(1),
    lastAt: 0,
    lastMergeKey: undefined,
  };
}

export const canUndo = (state: CommandStackState): boolean => state.past.length > 0;
export const canRedo = (state: CommandStackState): boolean => state.future.length > 0;

export const undoLabel = (state: CommandStackState): string | undefined =>
  state.past[state.past.length - 1]?.label;

export const redoLabel = (state: CommandStackState): string | undefined => state.future[0]?.label;

/** Ends any in-flight merge, so the next command always starts a new entry. */
export function commitMerge(state: CommandStackState): CommandStackState {
  return { ...state, lastAt: 0, lastMergeKey: undefined };
}
