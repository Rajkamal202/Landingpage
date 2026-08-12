import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFallback } from "@/components/studio/page-fallback";
import { WorkspaceScreen } from "@/components/studio/workspace-screen";

export const metadata: Metadata = { title: "Projects" };

const DESCRIPTION = "Everything you have in flight. Open one in the editor it was built for.";

/**
 * SPEC §8.8. The screen reads its filters and sort from search params, so the
 * Suspense boundary is what keeps this route prerenderable.
 */
export default function Page() {
  return (
    <Suspense fallback={<PageFallback title="Projects" description={DESCRIPTION} tiles={10} />}>
      <WorkspaceScreen />
    </Suspense>
  );
}
