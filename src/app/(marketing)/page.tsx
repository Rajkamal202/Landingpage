import { listPlans } from "@/lib/api/billing";
import { Hero } from "@/components/marketing/hero";
import { TemplateShowcase } from "@/components/marketing/template-showcase";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Comparison } from "@/components/marketing/comparison";
import { PricingSection } from "@/components/marketing/pricing/pricing-section";
import { Faq } from "@/components/marketing/faq";

/**
 * Avelon Coming Soon Page.
 * Server-rendered showcase of real video and photoshoot templates,
 * workflow deconstruction, and launch previews.
 */
export default async function Page() {
  const plans = await listPlans();

  return (
    <main id="main">
      <Hero />
      <TemplateShowcase />
      <HowItWorks />
      <Comparison />
      <PricingSection plans={plans} />
      <Faq />
    </main>
  );
}
