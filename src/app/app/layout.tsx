import type { Metadata } from "next";
import { TopBar } from "@/components/app-shell/top-bar";
import { ShortcutsDialog } from "@/components/ui/shortcuts-dialog";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/**
 * The app shell. SPEC §7.1: 56px fixed top bar, workspace tabs as the primary
 * navigation model, library and token meter on the right.
 *
 * `ShortcutsDialog` is mounted once here rather than per editor, so the `?`
 * dialog always reflects whatever the current screen has registered.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <div className="flex h-dvh flex-col overflow-hidden bg-page">
        <TopBar />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <ShortcutsDialog />
      </div>
    </AppProviders>
  );
}
