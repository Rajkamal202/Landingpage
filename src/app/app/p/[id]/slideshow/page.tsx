import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconSlideshow } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Slideshow editor"
      specSection="SPEC §8.6"
      owner="Agent SLIDESHOW"
      summary="A slide rail, a 9:16 layer canvas with alignment guides, and typography controls."
      glyph={IconSlideshow}
    />
  );
}
