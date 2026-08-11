"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Canvas-rendered waveform for the timeline's audio track and the actor
 * browser's voice preview.
 *
 * Peaks arrive pre-computed from the media pipeline (SPEC §9), so nothing is
 * decoded at runtime. Drawing is DPR-aware and redraws only when size, peaks
 * or progress change — a waveform that repaints on every animation frame is
 * exactly what stops a timeline scrubbing at 60fps.
 */
export interface WaveformProps {
  peaks: readonly number[];
  /** 0–1. Played portion renders in `color`, the rest in `mutedColor`. */
  progress?: number;
  color?: string;
  mutedColor?: string;
  className?: string;
  ariaLabel?: string;
}

export function Waveform({
  peaks,
  progress = 1,
  color = "var(--color-track-audio)",
  mutedColor = "var(--color-ink-300)",
  className,
  ariaLabel,
}: WaveformProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.width, size.height);

    const styles = getComputedStyle(canvas);
    // Canvas cannot read CSS custom properties, so they are resolved against
    // the element first. The fallback is the inherited text colour — itself
    // token-derived — rather than a hardcoded literal.
    const resolve = (value: string) =>
      value.startsWith("var(")
        ? styles.getPropertyValue(value.slice(4, -1).trim()).trim() || styles.color
        : value;

    const barWidth = 2;
    const gap = 1;
    const step = barWidth + gap;
    const barCount = Math.max(1, Math.floor(size.width / step));
    const mid = size.height / 2;
    const playedBars = Math.round(barCount * progress);

    for (let i = 0; i < barCount; i++) {
      // Sample rather than interpolate — the peaks array is a summary already,
      // and smoothing it makes quiet passages look louder than they are.
      const peak = peaks[Math.floor((i / barCount) * peaks.length)] ?? 0;
      const height = Math.max(1, peak * (size.height - 2));
      ctx.fillStyle = resolve(i < playedBars ? color : mutedColor);
      ctx.fillRect(i * step, mid - height / 2, barWidth, height);
    }
  }, [peaks, progress, size, color, mutedColor]);

  return (
    <div
      ref={containerRef}
      className={cn("relative size-full", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <canvas
        ref={canvasRef}
        // dynamic: the canvas backing store is sized in device pixels while the
        // element is sized in CSS pixels.
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}
