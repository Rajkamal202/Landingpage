import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconTeam } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="AI actors"
      specSection="SPEC §8.3"
      owner="Agent STUDIO"
      summary="Presenters with voice samples, style tags and language coverage."
      glyph={IconTeam}
    />
  );
}
