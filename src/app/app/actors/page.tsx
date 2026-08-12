import type { Metadata } from "next";
import { Suspense } from "react";
import { ActorsScreen } from "@/components/studio/actors/actors-screen";
import { PageFallback } from "@/components/studio/page-fallback";

export const metadata: Metadata = { title: "AI actors" };

const DESCRIPTION =
  "Presenters you can cast in a talking head, hear before you commit, and reuse across every variation.";

/** SPEC §8.3. Every filter lives in search params. */
export default function Page() {
  return (
    <Suspense fallback={<PageFallback title="AI actors" description={DESCRIPTION} tiles={8} />}>
      <ActorsScreen />
    </Suspense>
  );
}
