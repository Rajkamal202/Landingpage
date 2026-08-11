import { createRng } from "@/lib/seeded-random";
import { FIXTURE_NOW } from "@/lib/fixtures/seed";

/**
 * SPEC §2: every data access goes through `src/lib/api/*`. Swapping to a real
 * backend is an edit to these modules and nothing else — no component imports
 * a fixture, enforced by an ESLint rule.
 *
 * SPEC §9: this module owns latency simulation, injectable failure, and the
 * progress-stream primitive that keeps long operations honest.
 */

const latencyRng = createRng(0x1a7e);

/**
 * The clock relative timestamps are formatted against.
 *
 * Fixtures are dated from a fixed epoch so "2 hours ago" is stable across runs
 * and machines. Components ask the API layer rather than importing the fixture
 * constant, so swapping in a real backend — where this becomes `Date.now()` —
 * touches this function and nothing else.
 */
export function referenceTime(): number {
  return FIXTURE_NOW;
}

/** Simulated network latency, seeded so runs are reproducible. */
export function delay(min: number, max: number): Promise<void> {
  const ms = min + latencyRng.next() * (max - min);
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* ── Failure injection ─────────────────────────────────────────────────── */

let forcedFailureRate = 0;

/**
 * Dev-only. Every error state in the product should be reachable without
 * editing code — `?chaos=0.5` on any route, or the toggle in `/_dev`.
 */
export function setFailureRate(rate: number): void {
  forcedFailureRate = Math.max(0, Math.min(1, rate));
}

export function getFailureRate(): number {
  return forcedFailureRate;
}

export class ApiError extends Error {
  readonly code: string;
  readonly fix: string;

  constructor(message: string, options: { code?: string; fix?: string } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = options.code ?? "unknown";
    // SPEC §12: an error says what went wrong *and* what to do next.
    this.fix = options.fix ?? "Try again in a moment.";
  }
}

export function maybeFail(context: string, rate = forcedFailureRate): void {
  if (rate <= 0) return;
  if (latencyRng.next() >= rate) return;
  throw new ApiError(`${context} didn't complete`, {
    code: "injected",
    fix: "This is the dev failure toggle. Set the chaos rate to 0 to stop it.",
  });
}

/* ── Progress streams ──────────────────────────────────────────────────── */

/**
 * SPEC §9: long operations emit real incremental progress rather than a fake
 * timer. Consumers get an async generator, so cancellation is just breaking
 * out of the loop and the UI can render partial payloads as they arrive —
 * which is what lets the clone screen draw scene markers while it works.
 */
export interface ProgressStep {
  /** Milliseconds this step should take. */
  durationMs: number;
  /** Fired as the step advances, 0–1 within the step. */
  onTick?: (fraction: number) => void;
}

export async function* ticker(
  totalMs: number,
  intervalMs = 60,
): AsyncGenerator<number, void, void> {
  const started = Date.now();
  for (;;) {
    const elapsed = Date.now() - started;
    const fraction = Math.min(1, elapsed / totalMs);
    yield fraction;
    if (fraction >= 1) return;
    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }
}

/** Deep-clones fixture data so a consumer mutating a result cannot corrupt it. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}
