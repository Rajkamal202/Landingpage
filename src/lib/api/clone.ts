import type {
  CloneFailure,
  CloneProgress,
  CloneResult,
  Platform,
  RecentClone,
  Scene,
} from "@/lib/schemas";
import { CLONE_STEPS } from "@/lib/schemas";
import { CLONE_FAILURES, CLONE_RESULT, RECENT_CLONES, buildScenes } from "@/lib/fixtures/clone";
import { clone, delay, getFailureRate, ticker } from "./client";

/* ── Platform detection ────────────────────────────────────────────────── */

const HOST_MATCHERS: ReadonlyArray<{ platform: Platform; hosts: readonly string[] }> = [
  { platform: "tiktok", hosts: ["tiktok.com", "vm.tiktok.com"] },
  { platform: "instagram", hosts: ["instagram.com", "instagr.am"] },
  { platform: "youtube", hosts: ["youtube.com", "youtu.be", "m.youtube.com"] },
  { platform: "meta-ads", hosts: ["facebook.com", "fb.com", "business.facebook.com"] },
];

export type UrlCheck =
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | { status: "unsupported"; message: string }
  | { status: "ok"; platform: Platform; url: string };

/**
 * SPEC §6.2 / §15: the hero CTA's paste detection. Messages say what is wrong
 * and what to do — never "Invalid input."
 */
export function detectPlatform(raw: string): UrlCheck {
  const value = raw.trim();
  if (!value) return { status: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return {
      status: "invalid",
      message: "That doesn't look like a link. Paste the full URL to a post, starting with https.",
    };
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const match = HOST_MATCHERS.find(
    (candidate) => candidate.hosts.some((h) => host === h || host.endsWith(`.${h}`)),
  );

  if (!match) {
    return {
      status: "unsupported",
      message:
        "Vireo reads TikTok, Instagram, YouTube Shorts and Meta Ads links. Upload the file instead if it's from somewhere else.",
    };
  }

  return { status: "ok", platform: match.platform, url: parsed.toString() };
}

/* ── The clone stream ──────────────────────────────────────────────────── */

/**
 * SPEC §8.1 — six substeps, ~4.5s, with scenes streaming in during the
 * "Detecting scenes" step so the filmstrip draws its boundary markers live
 * rather than appearing complete at the end. This is the product's thesis
 * rendered as a loading state, so it emits real intermediate data.
 */
const STEP_DURATIONS_MS: Record<string, number> = {
  fetch: 900,
  scenes: 1_300,
  text: 800,
  overlays: 650,
  pacing: 400,
  build: 450,
};

export async function* analyzeSource(
  url: string,
): AsyncGenerator<CloneProgress, CloneResult, void> {
  const detection = detectPlatform(url);
  if (detection.status !== "ok") {
    throw asFailure(CLONE_FAILURES.unsupported);
  }

  // The dev failure toggle picks a *named* cause, so every branch of the
  // failure UI is reachable without editing code (SPEC §9).
  const failureRate = getFailureRate();
  const shouldFail = failureRate > 0 && Math.random() < failureRate;

  const allScenes = buildScenes();
  const revealed: Scene[] = [];
  const stepCount = CLONE_STEPS.length;

  for (const [stepIndex, step] of CLONE_STEPS.entries()) {
    const stepMs = STEP_DURATIONS_MS[step.id] ?? 600;

    for await (const fraction of ticker(stepMs, 70)) {
      if (step.id === "scenes") {
        const target = Math.floor(fraction * allScenes.length);
        while (revealed.length < target) {
          const next = allScenes[revealed.length];
          if (next) revealed.push(next);
        }
      }
      yield {
        step: step.id,
        stepIndex,
        stepCount,
        percent: Math.round(((stepIndex + fraction) / stepCount) * 100),
        scenes: clone(revealed),
      };
    }

    if (shouldFail && step.id === "fetch") throw asFailure(CLONE_FAILURES.private);
  }

  return clone({ ...CLONE_RESULT, sourceUrl: url, platform: detection.platform });
}

export class CloneError extends Error {
  readonly failure: CloneFailure;
  constructor(failure: CloneFailure) {
    super(failure.title);
    this.name = "CloneError";
    this.failure = failure;
  }
}

function asFailure(failure: CloneFailure): CloneError {
  return new CloneError(failure);
}

export async function listRecentClones(): Promise<RecentClone[]> {
  await delay(110, 260);
  return clone([...RECENT_CLONES]);
}

export async function getCloneResult(id: string): Promise<CloneResult> {
  await delay(120, 280);
  return clone({ ...CLONE_RESULT, id });
}
