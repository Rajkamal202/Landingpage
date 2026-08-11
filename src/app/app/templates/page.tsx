import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconTemplate } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Templates"
      specSection="SPEC §8.3"
      owner="Agent STUDIO"
      summary="Filterable formats with hover previews and a structural breakdown before you commit."
      glyph={IconTemplate}
    />
  );
}
