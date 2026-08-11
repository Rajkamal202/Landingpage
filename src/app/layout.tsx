import type { Metadata, Viewport } from "next";
import { geistMono, geistSans } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vireo.studio"),
  title: {
    default: "Vireo — Your AI short-form ads editor at scale",
    template: "%s — Vireo",
  },
  description:
    "Clone what already works, then make it yours. Vireo pulls a video apart into editable scenes, text, and captions, then fans one approved cut into dozens of variations.",
  openGraph: {
    type: "website",
    siteName: "Vireo",
    title: "Vireo — Your AI short-form ads editor at scale",
    description: "Clone what already works, then make it yours — in minutes, not weeks.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // token-lint-disable-next-line no-raw-hex — browser chrome reads this before
  // any stylesheet loads, so it cannot reference var(--color-ink-950).
  themeColor: "#0b0c0e",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
