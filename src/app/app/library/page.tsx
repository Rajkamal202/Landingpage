import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconFolder } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Library"
      specSection="SPEC §8.2"
      owner="Agent STUDIO"
      summary="Every asset in the account, filterable by type and source, draggable into any editor."
      glyph={IconFolder}
    />
  );
}
