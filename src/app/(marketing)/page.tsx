import { listPlans } from "@/lib/api/billing";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Comparison } from "@/components/marketing/comparison";
import { PricingSection } from "@/components/marketing/pricing/pricing-section";
import { Faq } from "@/components/marketing/faq";

/**
 * SPEC §6 — one scrolling page. The sections are server-rendered and only the
 * pieces that genuinely need interactivity (the hero CTA, the nav cross-fade,
 * the pricing toggle, the accordion) are client islands.
 */
export default async function Page() {
  const plans = await listPlans();

  return (
    <main id="main">
      <Hero />
      <HowItWorks />
      <Comparison />
      <PricingSection plans={plans} />
      <Faq />
    </main>
  );
}
