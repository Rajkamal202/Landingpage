import { Container } from "./section";
import { HeroCta } from "./hero-cta";
import { ProductFrame } from "./product-frame";
import { Sky } from "./illustration/sky";
import { HERO_BEATS } from "./hero-sequence";

const HEADLINE_LINES = ["The AI video ads studio", "built for modern DTC brands"] as const;

const HERO_POSTERS = [
  {
    id: "ex-ugc",
    src: "/media/real-ads/ex-ugc.jpg",
    videoSrc: "/media/real-ads/ex-ugc.mp4",
    tag: "UGC Creator Hook",
    title: "Real UGC Creator Video",
  },
  {
    id: "ex-unboxing",
    src: "/media/real-ads/ex-unboxing.jpg",
    videoSrc: "/media/real-ads/ex-unboxing.mp4",
    tag: "Unboxing Demo",
    title: "Product Unboxing Ad",
  },
  {
    id: "ex-direct",
    src: "/media/real-ads/ex-direct-to-camera.jpg",
    videoSrc: "/media/real-ads/ex-direct-to-camera.mp4",
    tag: "Direct Pitch",
    title: "Direct Founder Pitch",
  },
  {
    id: "ex-pov",
    src: "/media/real-ads/ex-camera-pov.jpg",
    videoSrc: "/media/real-ads/ex-camera-pov.mp4",
    tag: "Camera POV",
    title: "First-Person Camera POV",
  },
  {
    id: "ex-hack",
    src: "/media/real-ads/ex-secret-hack.jpg",
    videoSrc: "/media/real-ads/ex-secret-hack.mp4",
    tag: "Secret Hack Hook",
    title: "Viral Secret Hack",
  },
] as const;

/** Seconds → the `--beat` custom property the hero utilities read. */
const beat = (seconds: number) => ({ "--beat": `${seconds}s` }) as React.CSSProperties;

export function Hero() {
  return (
    <section className="relative">
      {/* Dynamic atmospheric cobalt sky */}
      <div className="hero-in-fade absolute inset-0" style={beat(HERO_BEATS.sky)}>
        <Sky />
      </div>

      <div className="relative mx-auto flex w-full max-w-marketing flex-col px-6 pb-12 pt-32 lg:px-10">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Coming Soon Pill Badge */}
          <div
            className="hero-in inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md shadow-sm"
            style={beat(HERO_BEATS.sky + 0.1)}
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="eyebrow text-emerald-300">
              Coming Soon
            </span>
          </div>

          <h1 className="text-hero-sm md:text-hero-md lg:text-hero-lg max-w-marketing text-white font-sans tracking-tight">
            {HEADLINE_LINES.map((line, index) => (
              <span
                key={line}
                className="hero-in block"
                style={beat(HERO_BEATS.headline + index * HERO_BEATS.headlineStagger)}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="hero-in text-body-lg max-w-measure text-white/85"
            style={beat(HERO_BEATS.sub)}
          >
            Transform winning video ads and product shots into high-converting video variations in minutes.
            Scale creative testing across TikTok, Meta, and Shorts without shoots or agency retainers.
          </p>

          <div
            className="hero-in-scale mt-2 flex w-full justify-center"
            style={beat(HERO_BEATS.cta)}
          >
            <HeroCta />
          </div>
        </div>
      </div>

      <Container className="relative mt-4 lg:mt-6">
        {/* Real video ad showcase frame */}
        <div
          className="hero-in-lift -mb-24 lg:-mb-32"
          style={beat(HERO_BEATS.screenshot)}
        >
          <ProductFrame
            posters={HERO_POSTERS}
            label="Five real high-converting vertical video ads produced in the Avelon studio, running side by side."
          />
        </div>
      </Container>
    </section>
  );
}
