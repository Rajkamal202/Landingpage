#!/usr/bin/env node
/**
 * Placeholder media generator — SPEC §9.
 *
 * Everything under `public/media` is produced here, procedurally, from a fixed
 * seed. Nothing is scraped, and there are no images of real people: the clips
 * are drifting colour fields with an organic bokeh layer, the portraits are
 * abstract, and the audio beds are filtered noise.
 *
 * Output is committed, so CI and every contributor get byte-identical media
 * without needing ffmpeg installed. Re-run with `pnpm gen:media` after editing
 * this file.
 *
 * Also emits `src/lib/fixtures/media-manifest.ts` — a typed manifest, so the
 * fixtures reference real files and a missing asset is a type error rather
 * than a broken <img> in the UI.
 */

import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "media");
const MANIFEST = path.join(ROOT, "src", "lib", "fixtures", "media-manifest.ts");

const CONCURRENCY = 4;
const CLIP_COUNT = 24;
const AUDIO_COUNT = 16;
const PORTRAIT_COUNT = 16;
const PRODUCT_COUNT = 8;
const SPRITE_FRAMES = 12;
const CLIP_W = 540;
const CLIP_H = 960;

/* ── Deterministic PRNG ─────────────────────────────────────────────────── */

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x5f1e0);
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => min + rand() * (max - min);

/**
 * Palettes drawn from the token set plus the gradient-bleed pairs named in
 * SPEC §6.3, so generated media sits in the same world as the marketing page.
 */
const PALETTES = [
  { name: "cobalt-magenta", c: ["0x1E4FD6", "0xC24BC9", "0xF0D5D8", "0x2B5BE0"] },
  { name: "violet-pink", c: ["0x5B3DD4", "0xC24BC9", "0xF7D9E4", "0x3D6FF0"] },
  { name: "rose-amber", c: ["0xE0812B", "0xF0D5D8", "0xF5EFE6", "0xC24BC9"] },
  { name: "sky-indigo", c: ["0x4277F0", "0x1F3F9E", "0xB8CCFF", "0x14285F"] },
  { name: "mint-sky", c: ["0x17916B", "0x6E93F7", "0xF5EFE6", "0x2B5BE0"] },
  { name: "pink-orange", c: ["0xD0342C", "0xE0812B", "0xF0D5D8", "0xC24BC9"] },
  { name: "deep-cream", c: ["0x14285F", "0x3D6FF0", "0xF5EFE6", "0x8B5CF6"] },
  { name: "dusk", c: ["0x2B5BE0", "0x8B5CF6", "0xF0D5D8", "0x1E4FD6"] },
];

const GRADIENT_TYPES = ["linear", "radial", "circular"];

/* ── Helpers ────────────────────────────────────────────────────────────── */

async function ffmpeg(args) {
  return run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    maxBuffer: 1024 * 1024 * 64,
  });
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

/* ── Clips ──────────────────────────────────────────────────────────────── */

function clipSpecs() {
  return Array.from({ length: CLIP_COUNT }, (_, i) => {
    const palette = PALETTES[i % PALETTES.length];
    return {
      index: i,
      id: `clip-${String(i + 1).padStart(2, "0")}`,
      palette: palette.name,
      colors: palette.c,
      type: pick(GRADIENT_TYPES),
      // SPEC §9 asks for short loops; 2–4s keeps them light and loopable.
      duration: Number(between(2, 4).toFixed(2)),
      speed: Number(between(0.28, 0.55).toFixed(3)),
      lifeSeed: Math.floor(rand() * 100000),
      lifeRatio: Number(between(0.05, 0.11).toFixed(3)),
      blur: Math.round(between(20, 30)),
      zoomIn: rand() > 0.4,
      zoomAmount: Number(between(0.04, 0.09).toFixed(3)),
      x0: Math.round(between(40, 200)),
      y0: Math.round(between(80, 400)),
      x1: Math.round(between(380, 600)),
      y1: Math.round(between(700, 1050)),
      opacity: Number(between(0.6, 0.82).toFixed(2)),
    };
  });
}

async function renderClip(spec) {
  const src = path.join(OUT, "clips", `${spec.id}.mp4`);
  const poster = path.join(OUT, "posters", `${spec.id}.jpg`);
  const sprite = path.join(OUT, "sprites", `${spec.id}.jpg`);

  const grad =
    `gradients=s=612x1088:c0=${spec.colors[0]}:c1=${spec.colors[1]}:c2=${spec.colors[2]}` +
    `:c3=${spec.colors[3]}:x0=${spec.x0}:y0=${spec.y0}:x1=${spec.x1}:y1=${spec.y1}` +
    `:nb_colors=4:speed=${spec.speed}:type=${spec.type}:d=${spec.duration}:r=24`;

  const life =
    `life=s=76x136:mold=12:r=8:ratio=${spec.lifeRatio}` +
    `:death_color=${spec.colors[0]}:life_color=${spec.colors[2]}:seed=${spec.lifeSeed}`;

  const frames = Math.round(spec.duration * 24);
  const zoom = spec.zoomIn
    ? `z='min(${(1 + spec.zoomAmount).toFixed(3)},1+${spec.zoomAmount}*on/${frames})'`
    : `z='max(${(1 - spec.zoomAmount / 2).toFixed(3)},${(1 + spec.zoomAmount / 2).toFixed(3)}-${spec.zoomAmount}*on/${frames})'`;

  await ffmpeg([
    "-f", "lavfi", "-i", grad,
    "-f", "lavfi", "-t", String(spec.duration), "-i", life,
    "-filter_complex",
    `[1:v]scale=612:1088:flags=bicubic,gblur=sigma=${spec.blur},format=gbrp[org];` +
      `[0:v][org]blend=all_mode=softlight:all_opacity=${spec.opacity},` +
      `zoompan=${zoom}:d=1:s=${CLIP_W}x${CLIP_H}:fps=24,vignette=PI/4.5,format=yuv420p[v]`,
    "-map", "[v]",
    "-t", String(spec.duration),
    "-c:v", "libx264", "-preset", "slow", "-crf", "32",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    src,
  ]);

  // Poster: a frame from a third of the way in, which is past the zoom's
  // starting position and reads better as a still than frame zero.
  await ffmpeg([
    "-i", src,
    "-ss", (spec.duration / 3).toFixed(2),
    "-frames:v", "1",
    "-c:v", "mjpeg", "-q:v", "4",
    poster,
  ]);

  // Sprite sheet for hover-scrub: exactly SPRITE_FRAMES columns.
  await ffmpeg([
    "-i", src,
    "-vf", `fps=${SPRITE_FRAMES}/${spec.duration},scale=108:192,tile=${SPRITE_FRAMES}x1`,
    "-frames:v", "1",
    "-c:v", "mjpeg", "-q:v", "5",
    sprite,
  ]);

  return {
    id: spec.id,
    src: `/media/clips/${spec.id}.mp4`,
    poster: `/media/posters/${spec.id}.jpg`,
    sprite: `/media/sprites/${spec.id}.jpg`,
    spriteFrames: SPRITE_FRAMES,
    durationMs: Math.round(spec.duration * 1000),
    width: CLIP_W,
    height: CLIP_H,
    palette: spec.palette,
  };
}

/* ── Audio beds + waveform peaks ────────────────────────────────────────── */

const PEAK_BUCKETS = 240;

async function renderAudio(_unused, index) {
  const id = `bed-${String(index + 1).padStart(2, "0")}`;
  const file = path.join(OUT, "audio", `${id}.m4a`);
  const duration = Number(between(6, 14).toFixed(2));
  const seed = Math.floor(rand() * 100000);
  const color = pick(["brown", "pink"]);
  const tremoloFreq = Number(between(1.4, 4.2).toFixed(2));
  const cutoff = Math.round(between(280, 900));

  await ffmpeg([
    "-f", "lavfi",
    "-i", `anoisesrc=color=${color}:seed=${seed}:duration=${duration}:sample_rate=44100`,
    "-af",
    `lowpass=f=${cutoff},tremolo=f=${tremoloFreq}:d=0.75,` +
      `afade=t=in:d=0.4,afade=t=out:st=${(duration - 0.6).toFixed(2)}:d=0.6,volume=0.9`,
    "-c:a", "aac", "-b:a", "64k",
    file,
  ]);

  // Peaks are computed once here so the timeline never decodes audio at
  // runtime to draw a waveform (SPEC §13, 60fps scrub).
  const { stdout } = await run(
    "ffmpeg",
    ["-v", "error", "-i", file, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
    { encoding: "buffer", maxBuffer: 1024 * 1024 * 64 },
  );

  const samples = new Int16Array(
    stdout.buffer.slice(stdout.byteOffset, stdout.byteOffset + stdout.byteLength - (stdout.byteLength % 2)),
  );
  const bucketSize = Math.max(1, Math.floor(samples.length / PEAK_BUCKETS));
  const peaks = [];
  for (let b = 0; b < PEAK_BUCKETS; b++) {
    let max = 0;
    const start = b * bucketSize;
    for (let i = start; i < Math.min(start + bucketSize, samples.length); i++) {
      const value = Math.abs(samples[i] ?? 0);
      if (value > max) max = value;
    }
    peaks.push(Number((max / 32768).toFixed(3)));
  }

  return { id, src: `/media/audio/${id}.m4a`, durationMs: Math.round(duration * 1000), peaks };
}

/* ── Stills: abstract portraits, products, brand mark ───────────────────── */

async function renderStill({ dir, id, size, colors, type, vignetteAmount }) {
  const file = path.join(OUT, dir, `${id}.jpg`);
  const grad =
    `gradients=s=${size}x${size}:c0=${colors[0]}:c1=${colors[1]}:c2=${colors[2]}` +
    `:x0=${Math.round(size * 0.2)}:y0=${Math.round(size * 0.15)}` +
    `:x1=${Math.round(size * 0.85)}:y1=${Math.round(size * 0.9)}` +
    `:nb_colors=3:type=${type}:d=1:r=1`;

  // Stills sit on near-white app chrome, so they are lifted rather than
  // vignetted down — a dark, crushed thumbnail reads as a loading failure.
  await ffmpeg([
    "-f", "lavfi", "-i", grad,
    "-frames:v", "1",
    "-vf",
    `gblur=sigma=${Math.round(size / 70)},vignette=PI/${vignetteAmount},` +
      `eq=brightness=0.06:saturation=1.12:contrast=1.04,format=yuv420p`,
    "-c:v", "mjpeg", "-q:v", "3",
    file,
  ]);

  return { id, src: `/media/${dir}/${id}.jpg` };
}

/* ── Manifest ───────────────────────────────────────────────────────────── */

function manifestSource({ clips, audio, portraits, products, logo }) {
  return `/**
 * GENERATED by scripts/gen-media.mjs — do not edit by hand.
 * Run \`pnpm gen:media\` to regenerate. Output is deterministic.
 */

export interface MediaClip {
  readonly id: string;
  readonly src: string;
  readonly poster: string;
  readonly sprite: string;
  readonly spriteFrames: number;
  readonly durationMs: number;
  readonly width: number;
  readonly height: number;
  readonly palette: string;
}

export interface MediaAudio {
  readonly id: string;
  readonly src: string;
  readonly durationMs: number;
  readonly peaks: readonly number[];
}

export interface MediaStill {
  readonly id: string;
  readonly src: string;
}

export const MEDIA_CLIPS: readonly MediaClip[] = ${JSON.stringify(clips, null, 2)};

export const MEDIA_AUDIO: readonly MediaAudio[] = ${JSON.stringify(audio, null, 2)};

export const MEDIA_PORTRAITS: readonly MediaStill[] = ${JSON.stringify(portraits, null, 2)};

export const MEDIA_PRODUCTS: readonly MediaStill[] = ${JSON.stringify(products, null, 2)};

export const MEDIA_LOGO = ${JSON.stringify(logo)} as const;
`;
}

/* ── Main ───────────────────────────────────────────────────────────────── */

async function main() {
  console.log("Generating placeholder media…");
  await rm(OUT, { recursive: true, force: true });
  for (const dir of ["clips", "posters", "sprites", "audio", "portraits", "products", "brand"]) {
    await mkdir(path.join(OUT, dir), { recursive: true });
  }

  const specs = clipSpecs();
  console.log(`  ${specs.length} clips (+ posters, + sprite sheets)…`);
  const clips = await pool(specs, renderClip);

  console.log(`  ${AUDIO_COUNT} audio beds (+ waveform peaks)…`);
  const audio = await pool(Array.from({ length: AUDIO_COUNT }), renderAudio);

  console.log(`  ${PORTRAIT_COUNT} abstract portraits…`);
  const portraits = await pool(
    Array.from({ length: PORTRAIT_COUNT }, (_, i) => {
      const palette = PALETTES[(i + 3) % PALETTES.length];
      // Light colour first: `radial` puts c0 at the centre, so the portrait
      // reads as a lit subject against a colour field rather than a dark hole.
      return {
        dir: "portraits",
        id: `portrait-${String(i + 1).padStart(2, "0")}`,
        size: 400,
        colors: [palette.c[2], palette.c[1], palette.c[3]],
        type: "radial",
        vignetteAmount: 8,
      };
    }),
    renderStill,
  );

  console.log(`  ${PRODUCT_COUNT} product stills…`);
  const products = await pool(
    Array.from({ length: PRODUCT_COUNT }, (_, i) => {
      const palette = PALETTES[(i + 1) % PALETTES.length];
      // A product still is a coloured form on a clean surface, so the cream
      // token leads and the saturated tokens sit behind it.
      return {
        dir: "products",
        id: `product-${String(i + 1).padStart(2, "0")}`,
        size: 800,
        colors: ["0xF5EFE6", palette.c[1], palette.c[0]],
        type: "circular",
        vignetteAmount: 10,
      };
    }),
    renderStill,
  );

  const logoStill = await renderStill({
    dir: "brand",
    id: "logo",
    size: 256,
    colors: ["0x0B0C0E", "0x3D6FF0", "0xF5EFE6"],
    type: "linear",
    vignetteAmount: 6,
  });

  await writeFile(
    MANIFEST,
    manifestSource({ clips, audio, portraits, products, logo: logoStill.src }),
    "utf8",
  );

  console.log(`Done. Manifest written to ${path.relative(ROOT, MANIFEST)}`);
}

await main();
