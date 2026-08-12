import type { Metadata } from "next";
import { SettingsFrame } from "@/components/studio/settings/settings-frame";

export const metadata: Metadata = { title: { default: "Settings", template: "%s · Settings" } };

/** SPEC §7.2 — the three settings routes share a nav and a measure. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsFrame>{children}</SettingsFrame>;
}
