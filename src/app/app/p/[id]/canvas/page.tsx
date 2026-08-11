import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconGraph } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Node canvas"
      specSection="SPEC §8.4"
      owner="Agent CANVAS"
      summary="A visual graph for composing multi-step generations with typed ports and references."
      glyph={IconGraph}
    />
  );
}
