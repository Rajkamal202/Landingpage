import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconUser } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Account"
      specSection="SPEC §7.2"
      owner="Agent STUDIO"
      summary="Name, email, company and password."
      glyph={IconUser}
    />
  );
}
