import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconGenerate } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Generation studio"
      specSection="SPEC §8.2"
      owner="Agent STUDIO"
      summary="The masonry results grid, mode toolbar and prompt composer."
      glyph={IconGenerate}
    />
  );
}
