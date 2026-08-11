"use client";

import * as React from "react";

/**
 * Adapts an async generator from `lib/api` to React state, with cancellation
 * on unmount. SPEC §9 requires long operations to show real incremental
 * progress; this is the only bridge between those streams and the UI, so no
 * screen has to hand-roll a `for await` loop with its own teardown bug.
 */
export type StreamStatus = "idle" | "running" | "done" | "error";

export interface ProgressStreamState<TProgress, TResult> {
  status: StreamStatus;
  progress: TProgress | null;
  result: TResult | null;
  error: Error | null;
  start: () => void;
  cancel: () => void;
  reset: () => void;
}

export function useProgressStream<TProgress, TResult>(
  factory: () => AsyncGenerator<TProgress, TResult, void>,
  options: { onDone?: (result: TResult) => void; onError?: (error: Error) => void } = {},
): ProgressStreamState<TProgress, TResult> {
  const [status, setStatus] = React.useState<StreamStatus>("idle");
  const [progress, setProgress] = React.useState<TProgress | null>(null);
  const [result, setResult] = React.useState<TResult | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  const cancelled = React.useRef(false);
  const factoryRef = React.useRef(factory);
  factoryRef.current = factory;
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  React.useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  const start = React.useCallback(() => {
    cancelled.current = false;
    setStatus("running");
    setProgress(null);
    setResult(null);
    setError(null);

    void (async () => {
      try {
        const iterator = factoryRef.current();
        for (;;) {
          const next = await iterator.next();
          if (cancelled.current) {
            await iterator.return?.(undefined as TResult);
            return;
          }
          if (next.done) {
            setResult(next.value);
            setStatus("done");
            optionsRef.current.onDone?.(next.value);
            return;
          }
          setProgress(next.value);
        }
      } catch (caught) {
        if (cancelled.current) return;
        const err = caught instanceof Error ? caught : new Error(String(caught));
        setError(err);
        setStatus("error");
        optionsRef.current.onError?.(err);
      }
    })();
  }, []);

  const cancel = React.useCallback(() => {
    cancelled.current = true;
    setStatus("idle");
  }, []);

  const reset = React.useCallback(() => {
    cancelled.current = true;
    setStatus("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, start, cancel, reset };
}
