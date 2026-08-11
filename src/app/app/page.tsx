import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconGrid } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Projects"
      specSection="SPEC §8.8"
      owner="Agent STUDIO"
      summary="The workspace grid: project cards with hover-scrubbing thumbnails, type filters, and a New project card first."
      glyph={IconGrid}
    />
  );
}
