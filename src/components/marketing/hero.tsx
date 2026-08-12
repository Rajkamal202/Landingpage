import { Container } from "./section";
import { HeroCta } from "./hero-cta";
import { ProductFrame } from "./product-frame";
import { Sky } from "./illustration/sky";
import { HERO_BEATS } from "./hero-sequence";

/**
 * SPEC §6.2 — act one.
 *
 * Height: the copy stack occupies the viewport less 80px (`min-h-dvh` with an
 * 80px reserve at the foot), and the screenshot frame is pulled up into that
 * reserve so its top edge lands right at the fold. The frame then carries a
 * negative bottom margin, so it bleeds past the sky and overlaps the white
 * section below — which is the "bleeding off the bottom of the viewport" the
 * spec asks for, and it survives every viewport height rather than only the
 * one it was eyeballed at.
 *
 * Contrast is handled in `illustration/sky.tsx`, where the numbers are.
 *
 * The load sequence is CSS, not Motion, and this is a SERVER component as a
 * result. Motion writes its `initial` state into the server HTML, so the
 * headline shipped at `opacity: 0` and did not appear until React had
 * hydrated — which measured a 4.7s LCP on throttled mobile, exactly equal to
 * time-to-interactive. A CSS animation starts at first paint. Same beats, same
 * choreography, no JavaScript on the critical path.
 */

const HEADLINE_LINES = ["Your AI short-form ads", "editor at scale"] as const;

const HERO_POSTERS = [
  { id: "clip-01", src: "/media/posters/clip-01.jpg" },
  { id: "clip-07", src: "/media/posters/clip-07.jpg" },
  { id: "clip-12", src: "/media/posters/clip-12.jpg" },
  { id: "clip-18", src: "/media/posters/clip-18.jpg" },
  { id: "clip-22", src: "/media/posters/clip-22.jpg" },
] as const;

/** Seconds → the `--beat` custom property the hero utilities read. */
const beat = (seconds: number) => ({ "--beat": `${seconds}s` }) as React.CSSProperties;

export function Hero() {
  return (
    <section className="relative">
      {/* dynamic: each beat's delay comes from the shared HERO_BEATS timeline,
          so the choreography lives in one file rather than in six classNames. */}
      <div className="hero-in-fade absolute inset-0" style={beat(HERO_BEATS.sky)}>
        <Sky />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-marketing flex-col px-6 pb-20 pt-32 lg:px-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-hero-sm md:text-hero-md lg:text-hero-lg max-w-marketing text-white">
            {HEADLINE_LINES.map((line, index) => (
              // dynamic: SPEC §6.2 staggers the two headline lines 60ms apart.
              <span
                key={line}
                className="hero-in block"
                style={beat(HERO_BEATS.headline + index * HERO_BEATS.headlineStagger)}
              >
                {line}
              </span>
            ))}
          </h1>

          {/* dynamic: beat from the shared timeline. */}
          <p
            className="hero-in text-body-lg max-w-measure text-white/82"
            style={beat(HERO_BEATS.sub)}
          >
            Clone what already works, then make it yours — in minutes, not weeks.
          </p>

          {/* dynamic: beat from the shared timeline. */}
          <div
            className="hero-in-scale mt-2 flex w-full justify-center"
            style={beat(HERO_BEATS.cta)}
          >
            <HeroCta />
          </div>
        </div>
      </div>

      <Container className="relative -mt-20 lg:-mt-24">
        {/* dynamic: the last beat — the screenshot rises 24px and scales up. */}
        <div
          className="hero-in-lift -mb-24 lg:-mb-32"
          style={beat(HERO_BEATS.screenshot)}
        >
          <ProductFrame
            posters={HERO_POSTERS}
            label="Five vertical ads produced in the Vireo studio, shown side by side."
          />
        </div>
      </Container>
    </section>
  );
}
