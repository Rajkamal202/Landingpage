import { cn } from "@/lib/cn";
import { Rise } from "@/components/ui/scroll-reveal";
import { Container, Section, SectionHeading } from "./section";
import { Bleed, type BleedTone } from "./illustration/bleed";
import { SECTION_IDS } from "./site-links";

/**
 * SPEC §6.3 — six steps, alternating two-column zigzag, 96px apart.
 *
 * It is an `<ol>` because the spec is explicit that the numbering is real:
 * these steps happen in this order. A screen-reader user gets "list, 6 items,
 * item 1 of 6" for free, which is the same information the ink circles carry
 * visually, and the marker itself is `aria-hidden` so the count is not read
 * twice.
 *
 * Each step reveals on its own scroll trigger rather than sharing one with the
 * whole list — six items staggered from a single group would finish animating
 * four screens before the reader reaches them.
 */

interface Step {
  readonly n: number;
  readonly title: string;
  readonly body: string;
  readonly tone: BleedTone;
  readonly posters: readonly [string, string];
  readonly frameLabel: string;
}

const STEPS: readonly Step[] = [
  {
    n: 1,
    title: "Clone",
    body: "Drop in a TikTok, Instagram, or Meta Ads link and Vireo pulls the video apart — scenes, on-screen text, overlays, and captions become editable layers.",
    tone: "blue-violet",
    posters: ["/media/posters/clip-01.jpg", "/media/posters/clip-17.jpg"],
    frameLabel: "A source video beside the editable scenes Vireo extracted from it.",
  },
  {
    n: 2,
    title: "Create",
    body: "Generate UGC-style video with AI actors, voices, and scripts. Authentic-looking content without a shoot.",
    tone: "rose-amber",
    posters: ["/media/posters/clip-03.jpg", "/media/posters/clip-11.jpg"],
    frameLabel: "Two UGC-style takes generated from the same script.",
  },
  {
    n: 3,
    title: "Generate",
    body: "Compose image and video generations on a visual canvas. Wire up references, branch ideas, and iterate without leaving the graph.",
    tone: "violet-pink",
    posters: ["/media/posters/clip-02.jpg", "/media/posters/clip-18.jpg"],
    frameLabel: "Two branches of the same generation, produced side by side on the canvas.",
  },
  {
    n: 4,
    title: "Slideshows",
    body: "Clone a slideshow from a link, swap the text and assets, and turn one layout into a dozen variations.",
    tone: "sky-indigo",
    posters: ["/media/posters/clip-04.jpg", "/media/posters/clip-20.jpg"],
    frameLabel: "One slideshow layout carrying two different sets of copy and product shots.",
  },
  {
    n: 5,
    title: "Edit",
    body: "Fine-tune timing, captions, and product callouts on the timeline, then export the final cut.",
    tone: "pink-orange",
    posters: ["/media/posters/clip-06.jpg", "/media/posters/clip-14.jpg"],
    frameLabel: "A rough cut and the finished cut after timing and captions were tuned.",
  },
  {
    n: 6,
    title: "Bulk edit",
    body: "Turn one approved video into a batch. Swap copy, products, and hooks in a spreadsheet, then export the whole set at once.",
    tone: "mint-sky",
    posters: ["/media/posters/clip-05.jpg", "/media/posters/clip-21.jpg"],
    frameLabel: "Two exports from the same batch, each with a different hook and product.",
  },
];

export function HowItWorks() {
  return (
    <Section id={SECTION_IDS.howItWorks} className="bg-surface">
      <Container className="flex flex-col gap-16 lg:gap-24">
        <SectionHeading
          title="How it works"
          sub="Six moves, in the order you actually make them: start from something that already performs, then take it apart, rebuild it, and multiply it."
        />

        <ol className="flex flex-col gap-16 md:gap-20 lg:gap-24">
          {STEPS.map((step) => {
            const flipped = step.n % 2 === 0;
            return (
              <li key={step.title}>
                <Rise className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={cn("flex flex-col gap-4", flipped && "lg:order-2")}>
                    <span
                      aria-hidden="true"
                      className="mono-sm grid size-10 place-items-center rounded-pill bg-ink-950 text-white"
                    >
                      {step.n}
                    </span>
                    <h3 className="text-title-lg text-ink-950">{step.title}</h3>
                    <p className="text-body-md max-w-measure text-ink-500">{step.body}</p>
                  </div>

                  {/*
                    The bleed hugs the screenshots with 24px of padding
                    (SPEC §6.3) rather than spanning the whole column. Capping
                    it here — not on the inner grid — keeps the gradient and the
                    stills the same object instead of a slab with pictures
                    floating in it.
                  */}
                  <div
                    className={cn(
                      "relative mx-auto w-full max-w-frame overflow-hidden rounded-xl p-6",
                      flipped && "lg:order-1",
                    )}
                  >
                    <Bleed tone={step.tone} />
                    <div
                      role="img"
                      aria-label={step.frameLabel}
                      className="relative grid grid-cols-2 gap-4"
                    >
                      {step.posters.map((src) => (
                        <img
                          key={src}
                          src={src}
                          alt=""
                          width={540}
                          height={960}
                          loading="lazy"
                          decoding="async"
                          className="h-auto w-full rounded-lg bg-ink-100 object-cover shadow-elev-2"
                        />
                      ))}
                    </div>
                  </div>
                </Rise>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}
