import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFallback } from "@/components/studio/page-fallback";
import { TemplatesScreen } from "@/components/studio/templates/templates-screen";

export const metadata: Metadata = { title: "Templates" };

const DESCRIPTION =
  "Formats that already work, broken down so you can see the structure before you commit.";

/** SPEC §8.3. Filters and the open template live in search params. */
export default function Page() {
  return (
    <Suspense fallback={<PageFallback title="Templates" description={DESCRIPTION} tiles={10} />}>
      <TemplatesScreen />
    </Suspense>
  );
}
