import { SlideshowEditor } from "@/components/slideshow/slideshow-editor";

/**
 * SPEC §8.6 — the slideshow editor.
 *
 * The route stays a thin server shell: it resolves the project id from the URL
 * and hands off. Everything below it is a client surface, because a layer drag
 * is not something a server component can help with.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SlideshowEditor projectId={id} />;
}
