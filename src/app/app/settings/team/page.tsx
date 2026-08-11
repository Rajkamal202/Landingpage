import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconTeam } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Team"
      specSection="SPEC §7.2"
      owner="Agent STUDIO"
      summary="Members, roles and pending invitations."
      glyph={IconTeam}
    />
  );
}
