import type { Metadata } from "next";
import { BillingScreen } from "@/components/studio/settings/billing-screen";

export const metadata: Metadata = { title: "Billing" };

export default function Page() {
  return <BillingScreen />;
}
