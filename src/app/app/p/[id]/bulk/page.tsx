import { Suspense } from "react";
import { BulkEditor } from "@/components/bulk/bulk-editor";
import { BulkSkeleton } from "@/components/bulk/bulk-skeleton";

/**
 * SPEC §8.7 — the bulk variation editor.
 *
 * The Suspense boundary is not decoration: the editor reads the cell cursor
 * out of the search params (SPEC §10), and a client component that does that
 * has to be suspended so the shell around it can still render on the server.
 * Its fallback is the same skeleton the editor shows while the document
 * resolves, so there is one loading picture rather than two.
 */
export default async function BulkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<BulkSkeleton />}>
      <BulkEditor projectId={id} />
    </Suspense>
  );
}
