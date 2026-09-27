import type { Metadata, Viewport } from "next";
import { geistMono, geistSans } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://avelon.studio"),
  title: {
    default: "Avelon — The AI Video Ad Studio for DTC Brands | Coming Soon",
    template: "%s — Avelon",
  },
  description:
    "Transform winning ads and product assets into high-converting video variations in minutes. Coming soon.",
  openGraph: {
    type: "website",
    siteName: "Avelon",
    title: "Avelon — The AI Video Ad Studio for DTC Brands | Coming Soon",
    description: "Transform winning ads and product assets into high-converting video variations in minutes.",
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
