import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryScreen } from "@/components/studio/library/library-screen";
import { PageFallback } from "@/components/studio/page-fallback";

export const metadata: Metadata = { title: "Library" };

const DESCRIPTION =
  "Every clip, still and audio bed on the account. Drag one straight into an editor, or open it for a closer look.";

/**
 * SPEC §7.2. Filters, sort, search and the open asset all live in search
 * params, so the Suspense boundary is what keeps this route prerenderable.
 */
export default function Page() {
  return (
    <Suspense fallback={<PageFallback title="Library" description={DESCRIPTION} tiles={12} />}>
      <LibraryScreen />
    </Suspense>
  );
}
