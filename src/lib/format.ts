/**
 * Formatting shared across every surface. Numbers the user compares against
 * other numbers are rendered here and set in the mono face (SPEC §4.3).
 */

const pad = (value: number, length = 2) => String(Math.floor(value)).padStart(length, "0");

/** `00:04:12` — minutes:seconds:frames, the timeline's readout (SPEC §8.5). */
export function formatTimecode(ms: number, fps = 30): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frames = Math.floor(((safe % 1000) / 1000) * fps);
  return `${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/** `0:08` / `1:24` — a duration a person reads, not a frame-accurate one. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${pad(seconds)}`;
}

/** `8s` / `1m 24s` — for cards and badges where a colon reads as a timecode. */
export function formatDurationShort(ms: number): string {
  const totalSeconds = Math.round(Math.max(0, ms) / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
}

const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["week", 7 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * `2 hours ago`. Takes an explicit `now` so fixture-driven screens render the
 * same string on every run and in every timezone.
 */
export function formatRelativeTime(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const diff = then - now;
  const abs = Math.abs(diff);
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (abs >= ms) return relative.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

const numberFormat = new Intl.NumberFormat("en-US");

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** `4,050` tokens, `1.2k` when space is tight. */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
}

export function formatPrice(dollars: number): string {
  return `$${numberFormat.format(dollars)}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
