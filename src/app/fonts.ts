import localFont from "next/font/local";

/**
 * SPEC §4.3 — both families self-hosted. No Google Fonts network request.
 *
 * The two variable `.woff2` files in `./fonts` are vendored from the
 * `geist` package (OFL-1.1) and committed, so the build has no dependency
 * on that package at runtime or install time. See `./fonts/README.md`.
 *
 * `adjustFontFallback` derives metric overrides for the fallback face, which
 * is what holds CLS at 0 while the webfont loads (SPEC §13, Performance).
 */

export const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});
