import type { Metadata } from "next";
import { listPlans } from "@/lib/api/billing";
import { PricingSection } from "@/components/marketing/pricing/pricing-section";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Starter and Pro are self-serve. Enterprise is concierge. Every plan includes the full editor, all models, brand kits, and export.",
};

export default async function Page() {
  const plans = await listPlans();

  return (
    <main id="main" className="pt-24">
      <PricingSection plans={plans} headingLevel={1} />
      <Faq />
    </main>
  );
}
