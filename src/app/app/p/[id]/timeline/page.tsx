import type { Metadata } from "next";
import { TimelineScreen } from "@/components/timeline/timeline-screen";

export const metadata: Metadata = { title: "Timeline editor" };

/** SPEC §8.5 — multi-track editing with snapping, trimming and a property panel. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TimelineScreen projectId={id} />;
}
