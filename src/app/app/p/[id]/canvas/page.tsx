import type { Metadata } from "next";
import { CanvasScreen } from "@/components/canvas/canvas-screen";

export const metadata: Metadata = { title: "Node canvas" };

/** SPEC §8.4 — a visual graph for composing multi-step generations. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CanvasScreen projectId={id} />;
}
