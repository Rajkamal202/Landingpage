import Image from "next/image";
import { cn } from "@/lib/cn";
import { Rise } from "@/components/ui/scroll-reveal";
import { Container, Section, SectionHeading } from "./section";
import { Bleed, type BleedTone } from "./illustration/bleed";
import { SECTION_IDS } from "./site-links";

interface StepMedia {
  readonly poster: string;
  readonly video?: string;
  readonly title?: string;
}

interface Step {
  readonly n: number;
  readonly title: string;
  readonly body: string;
  readonly tone: BleedTone;
  readonly items: readonly [StepMedia, StepMedia];
  readonly frameLabel: string;
}

const STEPS: readonly Step[] = [
  {
    n: 1,
    title: "Clone & Deconstruct Winning Ads",
    body: "Paste any TikTok, Instagram Reel, or Meta Ads link. Avelon deconstructs the winning video into editable layers: scene breaks, on-screen text, pacing, voiceovers, and visual hooks.",
    tone: "blue-violet",
    items: [
      {
        poster: "/media/real-ads/ex-camera-pov.jpg",
        video: "/media/real-ads/ex-camera-pov.mp4",
        title: "Original Reference Ad",
      },
      {
        poster: "/media/real-ads/ex-direct-to-camera.jpg",
        video: "/media/real-ads/ex-direct-to-camera.mp4",
        title: "Extracted Hook Scene",
      },
    ],
    frameLabel: "A source ad beside the editable scenes Avelon deconstructed from it.",
  },
  {
    n: 2,
    title: "Hyper-Realistic AI UGC Actors",
    body: "Produce authentic creator-led testimonials, unboxings, and product reviews with diverse AI talent. Consistent facial likeness, natural vocal inflection, and emotional resonance without a physical shoot.",
    tone: "rose-amber",
    items: [
      {
        poster: "/media/real-ads/ex-ugc.jpg",
        video: "/media/real-ads/ex-ugc.mp4",
        title: "Generated UGC Take",
      },
      {
        poster: "/media/avatars/avatar-preset-cn-female-young.jpg",
        title: "AI Creator Talent Preset",
      },
    ],
    frameLabel: "Two UGC creator variations produced without booking talent.",
  },
  {
    n: 3,
    title: "Studio-Grade Photoshoot Environments",
    body: "Drop in your raw packshot or 3D product render. Avelon casts it into prestige architectural sets — Calacatta marble, Kyoto gardens, or liquid caustics — with photorealistic lighting and contact shadows.",
    tone: "violet-pink",
    items: [
      {
        poster: "/media/photoshoot-templates/calacatta-silk.jpg",
        title: "Calacatta Silk Studio",
      },
      {
        poster: "/media/photoshoot-templates/kyoto-conservatory.jpg",
        title: "Kyoto Bamboo Conservatory",
      },
    ],
    frameLabel: "Photorealistic studio environments generated for product placement.",
  },
  {
    n: 4,
    title: "Psychological Hook & Script Remixing",
    body: "Multiply one product message across diverse psychological angles: curiosity loops, pain-point agitation, sensory ASMR unboxings, and viral problem-solving hooks.",
    tone: "sky-indigo",
    items: [
      {
        poster: "/media/real-ads/ex-secret-hack.jpg",
        video: "/media/real-ads/ex-secret-hack.mp4",
        title: "Secret Hack Curiosity Hook",
      },
      {
        poster: "/media/real-ads/ex-gadget-saved-me.jpg",
        video: "/media/real-ads/ex-gadget-saved-me.mp4",
        title: "Problem / Solution Angle",
      },
    ],
    frameLabel: "Two different creative hook angles generated from the same core value prop.",
  },
  {
    n: 5,
    title: "Timeline Pacing & Dynamic Captions",
    body: "Fine-tune beat transitions, dynamic animated subtitles, sound effects, and product callouts directly on the timeline. Preview changes instantly with zero rendering lag.",
    tone: "pink-orange",
    items: [
      {
        poster: "/media/real-ads/ex-unboxing.jpg",
        video: "/media/real-ads/ex-unboxing.mp4",
        title: "Dynamic Subtitle Cut",
      },
      {
        poster: "/media/real-ads/ex-unboxing-asmr.jpg",
        video: "/media/real-ads/ex-unboxing-asmr.mp4",
        title: "Paced ASMR Cut",
      },
    ],
    frameLabel: "Timeline fine-tuning showing kinetic captions and scene pacing.",
  },
  {
    n: 6,
    title: "10× Multi-Variant Batch Export",
    body: "Turn one approved creative into 10+ variations ready for Meta Advantage+, TikTok Spark Ads, and YouTube Shorts. Test creative breadth at scale to beat creative fatigue.",
    tone: "mint-sky",
    items: [
      {
        poster: "/media/real-ads/ex-couple-sharing.jpg",
        video: "/media/real-ads/ex-couple-sharing.mp4",
        title: "Lifestyle Ad Variant",
      },
      {
        poster: "/media/real-ads/ex-tvspot.jpg",
        video: "/media/real-ads/ex-tvspot.mp4",
        title: "Cinematic TV Spot Variant",
      },
    ],
    frameLabel: "Two exports from the same batch, each optimized for ad platform algorithms.",
  },
];

export function HowItWorks() {
  return (
    <Section id={SECTION_IDS.howItWorks} className="bg-surface">
      <Container className="flex flex-col gap-16 lg:gap-24">
        <SectionHeading
          title="How Avelon works"
          sub="Six powerful steps, from deconstructing what already converts to multiplying variations at scale — all inside your browser."
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
                      className="grid size-10 place-items-center rounded-pill bg-ink-950 mono-sm text-white"
                    >
                      {step.n}
                    </span>
                    <h3 className="text-title-lg text-ink-950 font-sans tracking-tight">{step.title}</h3>
                    <p className="max-w-measure text-body-md text-ink-600 leading-relaxed">{step.body}</p>
                  </div>

                  <div
                    className={cn(
                      "relative mx-auto w-full max-w-frame overflow-hidden rounded-2xl p-6",
                      flipped && "lg:order-1",
                    )}
                  >
                    <Bleed tone={step.tone} />
                    <div
                      role="img"
                      aria-label={step.frameLabel}
                      className="relative grid grid-cols-2 gap-4"
                    >
                      {step.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-ad w-full overflow-hidden rounded-xl bg-ink-950 shadow-elev-2 transition-ui hover:shadow-elev-3"
                        >
                          {item.video ? (
                            <video
                              src={item.video}
                              poster={item.poster}
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="none"
                              className="h-full w-full object-cover transition-ui group-hover:scale-105"
                            />
                          ) : (
                            <Image
                              src={item.poster}
                              alt={item.title ?? ""}
                              fill
                              sizes="(min-width: 1024px) 220px, 40vw"
                              loading="lazy"
                              className="h-full w-full object-cover transition-ui group-hover:scale-105"
                            />
                          )}

                          {item.title ? (
                            <div className="absolute inset-x-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-label font-medium text-white/95 backdrop-blur-md">
                              {item.title}
                            </div>
                          ) : null}
                        </div>
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
