import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconFilm } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Timeline editor"
      specSection="SPEC §8.5"
      owner="Agent TIMELINE"
      summary="Multi-track editing with waveforms, snapping, trimming and a contextual property panel."
      glyph={IconFilm}
    />
  );
}
