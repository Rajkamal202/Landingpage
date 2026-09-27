import { Container, Section, SectionHeading } from "./section";
import { FaqAccordion, type FaqItem } from "./faq-accordion";
import { SECTION_IDS } from "./site-links";

const FAQS: readonly FaqItem[] = [
  {
    question: "What is Avelon?",
    answer:
      "Avelon is an AI video ad studio engineered specifically for high-performance DTC brands and performance agencies. Paste a link to any winning video ad or upload product assets, and Avelon turns it into editable scenes, hyper-realistic UGC creator takes, and 10+ high-converting variations.",
  },
  {
    question: "When will Avelon be available?",
    answer:
      "Avelon is coming soon. Connect with our community and follow announcements for release updates and feature drops.",
  },
  {
    question: "How does Avelon work?",
    answer:
      "Add your brand assets, pick a reference video or product shot, and start creating. Avelon decomposes source videos into editable layers, casts realistic AI presenters, and exports cuts formatted for TikTok, Reels, and Shorts.",
  },
  {
    question: "What ad formats and platforms are supported?",
    answer:
      "Every output is native 9:16 vertical video formatted for TikTok Ads, Meta Reels, Instagram Stories, and YouTube Shorts. We provide pre-built templates for UGC hooks, tactile ASMR unboxings, founder pitches, and luxury studio photoshoots.",
  },
  {
    question: "Can I use my brand's real products and logo?",
    answer:
      "Yes. Upload your raw packshots, logos, and brand guidelines. Avelon places your exact physical product into photorealistic studio environments (such as Calacatta marble, Kyoto gardens, or liquid caustics) with physical lighting accuracy.",
  },
  {
    question: "How fast is the video generation?",
    answer:
      "Minutes. No waiting for physical shoots, talent booking, or round-trip revisions. Compose, edit, and export batch variations in a single browser session.",
  },
  {
    question: "How does Avelon differ from generic AI video tools?",
    answer:
      "Generic AI tools generate abstract art. Avelon is built from the ground up for direct response ROAS: hook-rate optimization, psychology-driven messaging, dynamic captions, and instant 10× variant generation for creative testing.",
  },
];

export function Faq() {
  return (
    <Section id={SECTION_IDS.faq} className="bg-surface">
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <SectionHeading
          align="start"
          title="Frequently asked questions"
          sub="Everything you need to know about Avelon and the upcoming platform release."
          className="lg:sticky lg:top-32 lg:self-start"
        />
        <FaqAccordion items={FAQS} />
      </Container>
    </Section>
  );
}
