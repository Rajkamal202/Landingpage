import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconTable } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Bulk editor"
      specSection="SPEC §8.7"
      owner="Agent BULK"
      summary="A real spreadsheet: range selection, clipboard, fill handle, and per-row generation."
      glyph={IconTable}
    />
  );
}
