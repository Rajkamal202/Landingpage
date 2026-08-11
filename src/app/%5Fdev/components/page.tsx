import { notFound } from "next/navigation";
import { ComponentGallery } from "./gallery";

/**
 * SPEC §5 — "a Storybook-less demo route at `/_dev/components` (excluded from
 * production build)."
 *
 * The guard is a real 404 in production rather than a hidden link, so the
 * route cannot ship by accident.
 */
export const dynamic = "force-static";

export default function Page() {
  if (process.env.NODE_ENV === "production" && process.env["NEXT_PUBLIC_DEV_ROUTES"] !== "1") {
    notFound();
  }
  return <ComponentGallery />;
}
