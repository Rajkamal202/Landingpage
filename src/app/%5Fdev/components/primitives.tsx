"use client";

import { cn } from "@/lib/cn";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-title-lg text-ink-950">{title}</h2>
        <p className="text-body-md max-w-measure text-ink-500">{description}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function Row({
  label,
  dark = false,
  children,
}: {
  label: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-ink-400">{label}</p>
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-lg border p-5",
          dark ? "border-ink-900 bg-ink-950" : "border-ink-200 bg-surface",
        )}
      >
        {children}
      </div>
    </div>
  );
}

const TYPE_STEPS = [
  { token: "display-xl", className: "text-display-xl", note: "68 / 72 · -0.03em" },
  { token: "display-lg", className: "text-display-lg", note: "48 / 54 · -0.025em" },
  { token: "display-md", className: "text-display-md", note: "34 / 40 · -0.02em" },
  { token: "title-lg", className: "text-title-lg", note: "24 / 32 · -0.015em" },
  { token: "title-md", className: "text-title-md", note: "18 / 26 · -0.01em" },
  { token: "body-lg", className: "text-body-lg", note: "17 / 28 · -0.005em" },
  { token: "body-md", className: "text-body-md", note: "15 / 24" },
  { token: "body-sm", className: "text-body-sm", note: "13.5 / 20" },
  { token: "label", className: "text-label", note: "12.5 / 16 · 0.01em" },
  { token: "caption", className: "eyebrow", note: "11.5 / 16 · 0.04em · uppercase" },
  { token: "mono-sm", className: "mono-sm", note: "12.5 / 16 · tabular" },
] as const;

export function TypeScale() {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-ink-400">Type scale</p>
      <ul className="flex flex-col divide-y divide-ink-200 rounded-lg border border-ink-200 bg-surface">
        {TYPE_STEPS.map((step) => (
          <li
            key={step.token}
            className="flex flex-col gap-2 p-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <span className={cn(step.className, "min-w-0 truncate text-ink-950")}>
              Clone what already works
            </span>
            {/* The metadata only shrinks away on narrow viewports — at 390px
                there is no room for a 68px sample and its specification on one
                line, and truncating the specification would make it useless. */}
            <span className="flex items-baseline gap-4 sm:shrink-0">
              <span className="mono-sm text-ink-400">{step.note}</span>
              <span className="mono-sm text-ink-700 sm:w-24 sm:text-right">{step.token}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RAMPS = [
  {
    name: "Brand",
    swatches: [
      ["brand-50", "bg-brand-50"],
      ["brand-100", "bg-brand-100"],
      ["brand-200", "bg-brand-200"],
      ["brand-400", "bg-brand-400"],
      ["brand-500", "bg-brand-500"],
      ["brand-600", "bg-brand-600"],
      ["brand-700", "bg-brand-700"],
      ["brand-900", "bg-brand-900"],
    ],
  },
  {
    name: "Ink",
    swatches: [
      ["ink-50", "bg-ink-50"],
      ["ink-100", "bg-ink-100"],
      ["ink-200", "bg-ink-200"],
      ["ink-300", "bg-ink-300"],
      ["ink-400", "bg-ink-400"],
      ["ink-500", "bg-ink-500"],
      ["ink-700", "bg-ink-700"],
      ["ink-900", "bg-ink-900"],
      ["ink-950", "bg-ink-950"],
    ],
  },
  {
    name: "Semantic and tracks",
    swatches: [
      ["success", "bg-success"],
      ["warning", "bg-warning"],
      ["danger", "bg-danger"],
      ["track-video", "bg-track-video"],
      ["track-audio", "bg-track-audio"],
      ["track-text", "bg-track-text"],
      ["track-overlay", "bg-track-overlay"],
    ],
  },
] as const;

export function ColorRamp() {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-ink-400">Colour</p>
      <div className="flex flex-col gap-5 rounded-lg border border-ink-200 bg-surface p-5">
        {RAMPS.map((ramp) => (
          <div key={ramp.name} className="flex flex-col gap-2">
            <p className="text-body-sm text-ink-500">{ramp.name}</p>
            <ul className="flex flex-wrap gap-2">
              {ramp.swatches.map(([token, className]) => (
                <li key={token} className="flex flex-col gap-1">
                  <span
                    className={cn("block size-12 rounded-sm border border-ink-200", className)}
                  />
                  <span className="mono-sm text-ink-400">{token}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const ELEVATIONS = ["shadow-elev-1", "shadow-elev-2", "shadow-elev-3", "shadow-elev-4"] as const;

export function Elevations() {
  return (
    <div className="flex flex-wrap gap-6 rounded-lg bg-page p-8">
      {ELEVATIONS.map((elevation) => (
        <div key={elevation} className="flex flex-col items-center gap-3">
          <span className={cn("block size-20 rounded-lg bg-surface", elevation)} />
          <span className="mono-sm text-ink-400">{elevation.replace("shadow-", "")}</span>
        </div>
      ))}
    </div>
  );
}
