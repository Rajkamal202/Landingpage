import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconBrand } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Brand kit"
      specSection="SPEC §8.3"
      owner="Agent STUDIO"
      summary="Logo, colours, fonts, saved products and tone of voice — the only setup Vireo asks for."
      glyph={IconBrand}
    />
  );
}
