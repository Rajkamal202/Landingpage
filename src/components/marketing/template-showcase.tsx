"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Container, Section, SectionHeading } from "./section";

interface VideoTemplate {
  readonly id: string;
  readonly title: string;
  readonly style: string;
  readonly videoSrc: string;
  readonly posterSrc: string;
  readonly metric: string;
  readonly bestFor: string;
  readonly description: string;
}

interface PhotoTemplate {
  readonly id: string;
  readonly title: string;
  readonly material: string;
  readonly lighting: string;
  readonly imageSrc: string;
  readonly bestFor: string;
  readonly description: string;
}

const VIDEO_TEMPLATES: readonly VideoTemplate[] = [
  {
    id: "ugc",
    title: "Organic UGC Creator Hook",
    style: "User Generated Content",
    videoSrc: "/media/real-ads/ex-ugc.mp4",
    posterSrc: "/media/real-ads/ex-ugc.jpg",
    metric: "+64% Hook Retention",
    bestFor: "DTC Skincare, Wellness & Apparel",
    description: "Authentic selfie-shot style that bypasses ad blindness on TikTok and Instagram Reels.",
  },
  {
    id: "unboxing-asmr",
    title: "Sensory ASMR Unboxing",
    style: "Tactile Product Reveal",
    videoSrc: "/media/real-ads/ex-unboxing-asmr.mp4",
    posterSrc: "/media/real-ads/ex-unboxing-asmr.jpg",
    metric: "4.2× Higher Watch Time",
    bestFor: "Premium Packaging & Gadgets",
    description: "Crisp macro product unboxing with high sensory detail and texture focus.",
  },
  {
    id: "secret-hack",
    title: "The 'Secret Hack' Angle",
    style: "Curiosity & Problem Hook",
    videoSrc: "/media/real-ads/ex-secret-hack.mp4",
    posterSrc: "/media/real-ads/ex-secret-hack.jpg",
    metric: "+92% Click-Through Rate",
    bestFor: "Problem-Solving Everyday Goods",
    description: "Opens with a provocative insight that triggers viewer curiosity within the first 1.5 seconds.",
  },
  {
    id: "direct-pitch",
    title: "Direct-to-Camera Testimonial",
    style: "Founder / Expert Breakdown",
    videoSrc: "/media/real-ads/ex-direct-to-camera.mp4",
    posterSrc: "/media/real-ads/ex-direct-to-camera.jpg",
    metric: "3.8× Conversion Rate",
    bestFor: "Supplements, SaaS & High-AOV",
    description: "High-trust eye contact explanation connecting emotional pain points to product benefits.",
  },
  {
    id: "hypermotion",
    title: "Dynamic Hyper-Motion Spot",
    style: "Fast-Paced Action Cut",
    videoSrc: "/media/real-ads/ex-hypermotion.mp4",
    posterSrc: "/media/real-ads/ex-hypermotion.jpg",
    metric: "Top Performer for Meta Ads",
    bestFor: "Fitness, Footwear & Tech",
    description: "Rhythmic beat transitions and kinetic typography built for high-energy campaigns.",
  },
  {
    id: "crush-test",
    title: "Durability & Stress Test",
    style: "Viral Proof Format",
    videoSrc: "/media/real-ads/ex-crush-test.mp4",
    posterSrc: "/media/real-ads/ex-crush-test.jpg",
    metric: "Viral TikTok Format",
    bestFor: "Cases, Hardware & Everyday Carry",
    description: "Extreme real-world demonstration that eliminates buyer skepticism instantly.",
  },
];

const PHOTO_TEMPLATES: readonly PhotoTemplate[] = [
  {
    id: "calacatta",
    title: "Calacatta Silk",
    material: "Honed Italian Marble",
    lighting: "Diffused Morning Daylight",
    imageSrc: "/media/photoshoot-templates/calacatta-silk.jpg",
    bestFor: "Luxury Skincare & Fragrance",
    description: "Organic grey veining with warm, soft-box daylight designed for prestige bottles and creams.",
  },
  {
    id: "kyoto",
    title: "Kyoto Conservatory",
    material: "Wabi-Sabi Stone & Bamboo",
    lighting: "Dappled Garden Shadows",
    imageSrc: "/media/photoshoot-templates/kyoto-conservatory.jpg",
    bestFor: "Organic Teas, Botanicals & Clean Beauty",
    description: "Minimalist Japanese garden setting with architectural serenity and natural foliage accents.",
  },
  {
    id: "elysian",
    title: "Elysian Travertine",
    material: "Sunbaked Roman Travertine",
    lighting: "Warm 45° Sculpting Sun",
    imageSrc: "/media/photoshoot-templates/elysian-travertine.jpg",
    bestFor: "Minimalist Jewelry, Watches & Ceramics",
    description: "Architectural block pedestals with tactile porous stone textures.",
  },
  {
    id: "aqua",
    title: "Aqua Ripple",
    material: "Caustic Crystal Pool Basin",
    lighting: "Prismatic Water Reflections",
    imageSrc: "/media/photoshoot-templates/aqua-ripple.jpg",
    bestFor: "Hydration Serums, Sun Care & Beverage",
    description: "Liquid dynamism with sunlight dancing across tranquil turquoise water ripples.",
  },
  {
    id: "nordic",
    title: "Nordic Linen",
    material: "Heavy-Woven Belgian Flax",
    lighting: "Overcast Window Glow",
    imageSrc: "/media/photoshoot-templates/nordic-linen.jpg",
    bestFor: "Home Goods, Apparel & Self-Care",
    description: "Earthy, tactile textile folds offering a calm and tactile residential backdrop.",
  },
  {
    id: "obsidian",
    title: "Obsidian Monolith",
    material: "Volcanic Matte Basalt",
    lighting: "Dramatic Edge Rim Lighting",
    imageSrc: "/media/photoshoot-templates/obsidian-monolith.jpg",
    bestFor: "Men’s Grooming, Tech & Spirits",
    description: "High-contrast editorial mood with deep inky blacks and razor-sharp edge separation.",
  },
];

export function TemplateShowcase() {
  const [activeTab, setActiveTab] = React.useState<"videos" | "photos">("videos");

  return (
    <Section id="templates" className="bg-surface/50 border-t border-ink-100">
      <Container className="flex flex-col gap-12 lg:gap-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1 text-label font-semibold text-ink-700 shadow-elev-1">
            <span className="size-2 rounded-full bg-brand-500" />
            <span>REAL STUDIO TEMPLATES</span>
          </div>

          <SectionHeading
            title="Production-grade video & photoshoot templates"
            sub="Never start from a blank canvas. Avelon comes loaded with battle-tested video ad frameworks and photorealistic studio environments."
          />

          {/* Tab Selector */}
          <div className="inline-flex rounded-pill bg-ink-100 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("videos")}
              className={cn(
                "rounded-pill px-5 py-2 text-body-sm font-medium transition-ui duration-(--dur-fast)",
                activeTab === "videos"
                  ? "bg-white text-ink-950 shadow-elev-1"
                  : "text-ink-600 hover:text-ink-950",
              )}
            >
              Short-Form Video Ads ({VIDEO_TEMPLATES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={cn(
                "rounded-pill px-5 py-2 text-body-sm font-medium transition-ui duration-(--dur-fast)",
                activeTab === "photos"
                  ? "bg-white text-ink-950 shadow-elev-1"
                  : "text-ink-600 hover:text-ink-950",
              )}
            >
              Studio Photoshoot Sets ({PHOTO_TEMPLATES.length})
            </button>
          </div>
        </div>

        {/* Video Ads Grid */}
        {activeTab === "videos" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEO_TEMPLATES.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-elev-2 transition-ui hover:-translate-y-1 hover:shadow-elev-4"
              >
                {/* 9:16 Video Player Container */}
                <div className="relative aspect-ad w-full overflow-hidden bg-ink-950">
                  <video
                    src={item.videoSrc}
                    poster={item.posterSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-(--dur-slow) group-hover:scale-105"
                  />

                  {/* Gradient Scrim */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-90" />

                  {/* Top Bar: Metric Tag */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-start">
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-950/80 px-2.5 py-0.5 text-label font-semibold tracking-wide text-emerald-300 backdrop-blur-md">
                      {item.metric}
                    </span>
                  </div>

                  {/* Bottom Bar: Template Style */}
                  <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1 text-white">
                    <span className="eyebrow text-white/70">
                      {item.style}
                    </span>
                    <p className="text-body-sm font-semibold tracking-tight text-white drop-shadow-sm">
                      {item.title}
                    </p>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-4 bg-surface">
                  <p className="text-body-xs text-ink-600 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="border-t border-ink-100 pt-3">
                    <div className="flex items-center justify-between text-label text-ink-500">
                      <span className="font-medium text-ink-700">Best for:</span>
                      <span className="truncate">{item.bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photoshoot Templates Grid */}
        {activeTab === "photos" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PHOTO_TEMPLATES.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-elev-2 transition-ui hover:-translate-y-1 hover:shadow-elev-4"
              >
                {/* 4:5 Aspect Photo Container */}
                <div className="relative aspect-photo w-full overflow-hidden bg-ink-100">
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-(--dur-slow) group-hover:scale-105"
                  />

                  {/* Top Bar: Lighting Pill */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                    <span className="rounded-full border border-white/40 bg-black/60 px-2.5 py-0.5 text-label font-medium text-white backdrop-blur-md">
                      {item.lighting}
                    </span>
                    <span className="rounded-full bg-brand-500/90 px-2 py-0.5 eyebrow text-white">
                      4K Studio
                    </span>
                  </div>

                  {/* Bottom Bar: Title & Material */}
                  <div className="absolute inset-x-3 bottom-3 flex flex-col gap-0.5 text-white">
                    <span className="eyebrow text-white/80">
                      {item.material}
                    </span>
                    <p className="text-title-sm font-semibold tracking-tight text-white drop-shadow-md">
                      {item.title}
                    </p>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-4 bg-surface">
                  <p className="text-body-xs text-ink-600 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="border-t border-ink-100 pt-3">
                    <div className="flex items-center justify-between text-label text-ink-500">
                      <span className="font-medium text-ink-700">Best for:</span>
                      <span className="truncate">{item.bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
