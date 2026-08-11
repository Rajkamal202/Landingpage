import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconLink } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Clone a video"
      specSection="SPEC §8.1"
      owner="Agent STUDIO"
      summary="Paste a link and watch it come apart into scenes, text layers, overlays and pacing."
      glyph={IconLink}
    />
  );
}
