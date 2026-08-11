import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { IconBilling } from "@/components/icons";

export default function Page() {
  return (
    <RoutePlaceholder
      title="Billing"
      specSection="SPEC §7.2"
      owner="Agent STUDIO"
      summary="Current plan, token allowance, usage this cycle and invoices."
      glyph={IconBilling}
    />
  );
}
