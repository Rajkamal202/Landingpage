import type { CloneFailure, CloneResult, RecentClone, Scene, TextLayer } from "@/lib/schemas";
import { VIDEO_ASSETS } from "./assets";
import { ago } from "./seed";

/**
 * SPEC §8.1 — the clone flow's payload. Scene boundaries are irregular on
 * purpose: evenly spaced cuts look computed, and the filmstrip that draws them
 * is the product's whole thesis rendered as a loading state.
 */

const SCENE_BOUNDARIES_MS = [0, 1_780, 3_240, 5_600, 7_120, 9_480, 11_020, 13_400, 15_000];

export function buildScenes(posterIndexOffset = 0): Scene[] {
  return SCENE_BOUNDARIES_MS.slice(0, -1).map((startMs, index) => ({
    id: `scene-${index + 1}`,
    index,
    startMs,
    endMs: SCENE_BOUNDARIES_MS[index + 1] ?? startMs + 1_500,
    posterUrl:
      VIDEO_ASSETS[(index + posterIndexOffset) % VIDEO_ASSETS.length]?.poster ?? "",
  }));
}

const TEXT_LAYERS: readonly TextLayer[] = [
  { id: "text-1", content: "I stopped buying serums for 6 months", startMs: 240, endMs: 2_600, role: "hook" },
  { id: "text-2", content: "then I found one that actually absorbs", startMs: 2_700, endMs: 5_400, role: "body" },
  { id: "text-3", content: "no pilling under makeup", startMs: 5_600, endMs: 8_100, role: "body" },
  { id: "text-4", content: "week 1 vs week 8", startMs: 8_300, endMs: 11_000, role: "caption" },
  { id: "text-5", content: "link in bio", startMs: 12_800, endMs: 15_000, role: "cta" },
];

export const CLONE_RESULT: CloneResult = {
  id: "clone-1",
  sourceUrl: "https://www.tiktok.com/@glowlab.co/video/7318842095512",
  platform: "tiktok",
  handle: "@glowlab.co",
  durationMs: 15_000,
  aspect: "9:16",
  scenes: buildScenes(),
  textLayers: [...TEXT_LAYERS],
  overlayCount: 3,
  pacing: "fast",
  previewAssetId: VIDEO_ASSETS[0]?.id ?? "",
  projectId: "proj-serum-hooks",
  createdAt: ago(20, "minute"),
};

/**
 * SPEC §8.1: "Never a generic error." Each cause names what happened and what
 * to do next, in the interface's voice, without apologising.
 */
export const CLONE_FAILURES: Record<CloneFailure["code"], CloneFailure> = {
  private: {
    code: "private",
    title: "This post is private or has been deleted",
    fix: "Check the link opens in a logged-out browser tab, then paste it again.",
  },
  "not-found": {
    code: "not-found",
    title: "That link doesn't point to a video",
    fix: "Paste a link to a single post rather than a profile or a search page.",
  },
  unsupported: {
    code: "unsupported",
    title: "Vireo doesn't read this platform yet",
    fix: "TikTok, Instagram, YouTube Shorts and Meta Ads links all work. Or upload the file directly.",
  },
  "too-long": {
    code: "too-long",
    title: "This video is longer than 3 minutes",
    fix: "Trim it to the section you want to clone and upload that, or pick a shorter post.",
  },
  network: {
    code: "network",
    title: "The source didn't respond",
    fix: "The platform is rate-limiting us. Wait about a minute and try again.",
  },
};

export const RECENT_CLONES: readonly RecentClone[] = [
  {
    id: "recent-1",
    platform: "tiktok",
    handle: "@glowlab.co",
    sourceUrl: "https://www.tiktok.com/@glowlab.co/video/7318842095512",
    posterUrl: VIDEO_ASSETS[0]?.poster ?? "",
    sceneCount: 8,
    projectId: "proj-serum-hooks",
    createdAt: ago(20, "minute"),
  },
  {
    id: "recent-2",
    platform: "instagram",
    handle: "@northfold",
    sourceUrl: "https://www.instagram.com/reel/CzQ8n2ApL4s/",
    posterUrl: VIDEO_ASSETS[17]?.poster ?? "",
    sceneCount: 6,
    projectId: "proj-winter-sale",
    createdAt: ago(7, "hour"),
  },
  {
    id: "recent-3",
    platform: "meta-ads",
    handle: "Rep & Set",
    sourceUrl: "https://www.facebook.com/ads/library/?id=902471338845",
    posterUrl: VIDEO_ASSETS[7]?.poster ?? "",
    sceneCount: 11,
    projectId: "proj-gym-onboarding",
    createdAt: ago(1, "week"),
  },
  {
    id: "recent-4",
    platform: "youtube",
    handle: "@lashroom",
    sourceUrl: "https://www.youtube.com/shorts/8Qk2vRt1nZo",
    posterUrl: VIDEO_ASSETS[22]?.poster ?? "",
    sceneCount: 5,
    projectId: "proj-lash-before-after",
    createdAt: ago(4, "week"),
  },
];
