import { Container, Section, SectionHeading } from "./section";
import { FaqAccordion, type FaqItem } from "./faq-accordion";
import { SECTION_IDS } from "./site-links";

/** SPEC §6.6 — the seven questions, verbatim. */
const FAQS: readonly FaqItem[] = [
  {
    question: "What is Vireo?",
    answer:
      "An AI video studio for short-form. Paste a link to something that's working, and Vireo rebuilds it as an editable project you can make your own.",
  },
  {
    question: "How does it work?",
    answer:
      "Sign up, add your brand assets, and start creating. Generate scripts, clone formats, produce UGC-style video, and export ready for TikTok, Reels, and Shorts.",
  },
  {
    question: "What can I make?",
    answer:
      "Slideshows, UGC-style video, product ads, explainers, dialogue scenes, and talking-head content. All vertical, all short-form.",
  },
  {
    question: "How is this different from hiring an agency?",
    answer:
      "You keep control. No revision queues, no retainers, no waiting on someone else's calendar.",
  },
  {
    question: "What do I need to start?",
    answer:
      "Your brand assets — a logo and product images. Vireo supplies the visuals, voices, and everything else.",
  },
  {
    question: "What's in each plan?",
    answer:
      "Every plan includes the full editor, all models, brand kits, and export. Higher tiers add tokens, storage, and hands-on support.",
  },
  {
    question: "How fast is the first video?",
    answer: "Minutes. No setup call, no onboarding queue. Log in and start.",
  },
];

/**
 * SPEC §6.6 — heading left and sticky until the list scrolls past, accordion
 * right. `self-start` is what makes the sticky work: a stretched grid item is
 * as tall as the accordion and therefore has nothing to stick within.
 */
export function Faq() {
  return (
    <Section id={SECTION_IDS.faq} className="bg-surface">
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <SectionHeading
          align="start"
          title="Frequently asked questions"
          sub="What people ask before their first clone."
          className="lg:sticky lg:top-32 lg:self-start"
        />
        <FaqAccordion items={FAQS} />
      </Container>
    </Section>
  );
}
