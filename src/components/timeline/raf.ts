/**
 * Pointer events can fire faster than the compositor paints. Every drag in the
 * timeline routes its store write through one of these, so a gesture costs one
 * state update per frame rather than one per event (SPEC §13, 60fps scrub).
 */
export interface RafScheduler {
  schedule: (task: () => void) => void;
  cancel: () => void;
}

export function createRafScheduler(): RafScheduler {
  let frame = 0;
  let pending: (() => void) | null = null;

  return {
    schedule(task) {
      pending = task;
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const run = pending;
        pending = null;
        run?.();
      });
    },
    cancel() {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
    },
  };
}
