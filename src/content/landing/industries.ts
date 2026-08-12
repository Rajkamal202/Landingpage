import {
  IconCampaign,
  IconFilm,
  IconImage,
  IconPalette,
  IconTemplate,
  IconText,
  IconUser,
} from "@/components/icons";
import type { LandingEntry } from "./types";

export const BEAUTY_AND_SKINCARE: LandingEntry = {
  group: "industries",
  slug: "beauty-and-skincare",
  name: "Beauty and skincare",
  title: "Routine videos, at the pace the category demands",
  sub: "Beauty buyers watch demonstrations, not claims. Vireo rebuilds the routine format — the hand-in-frame application, the before-and-after beat, the ingredient callout — around your own line.",
  metaTitle: "Vireo for beauty and skincare",
  metaDescription:
    "Produce routine and demonstration video for skincare and cosmetics at volume. Keep the pacing that holds attention, swap in your own products, shades and actives.",
  posters: ["/media/posters/clip-03.jpg", "/media/posters/clip-19.jpg"],
  frameLabel: "One routine format carrying two different products from the same range.",
  benefitsHeading: "What this category actually needs from a video tool",
  benefits: [
    {
      title: "The texture shot is the product shot",
      body: "Keep the source's macro beats and the pacing that holds attention on them, then drop your own bottle, swatch and application in their place.",
      glyph: IconImage,
    },
    {
      title: "Ingredient callouts stay editable",
      body: "The overlay naming an active comes back as a type layer, so moving from niacinamide to azelaic acid across a range is a retype rather than a re-render.",
      glyph: IconText,
    },
    {
      title: "A presenter per concern",
      body: "Cast different actors across the same script when a routine targets different skin concerns, and hold the structure identical so results read cleanly against each other.",
      glyph: IconUser,
    },
    {
      title: "Shade and variant fan-out",
      body: "One approved routine, twelve shades. The grid holds the copy constant and swaps only the product image and the shade name, so the set stays coherent.",
      glyph: IconPalette,
    },
  ],
  stepsHeading: "How a range gets covered",
  steps: [
    {
      title: "Clone a routine that performs",
      body: "Take the structure of a demonstration video that already works in your category and keep its rhythm.",
    },
    {
      title: "Drop your line into it",
      body: "Saved products carry the bottle shots and the copy; the brand kit carries the type, the palette and the tone.",
    },
    {
      title: "Fan it across the range",
      body: "One row per shade or per concern, generated together and exported as a set ready for paid and organic.",
    },
  ],
  faqs: [
    {
      question: "Can I show before-and-after results?",
      answer:
        "You can structure the beats for it and drop in footage you own. Vireo will not generate results imagery for you — that is a claim, and claims should come from your own evidence.",
    },
    {
      question: "Do the AI actors resemble real influencers?",
      answer:
        "No. Every presenter is generated and none is modelled on a specific person, so nothing you publish carries somebody else's likeness.",
    },
    {
      question: "What about regulated claim language?",
      answer:
        "Scripts are yours to write and yours to clear. Vireo does not add efficacy language to a script on its own, and every word on screen is an editable layer you can review before export.",
    },
  ],
  related: ["solutions/dtc-brands", "features/ai-actors", "industries/fitness-and-supplements"],
};

export const FITNESS_AND_SUPPLEMENTS: LandingEntry = {
  group: "industries",
  slug: "fitness-and-supplements",
  name: "Fitness and supplements",
  title: "Proof-led video, produced every week",
  sub: "This category runs on demonstration, routine and repetition. Vireo rebuilds the formats that carry it — the day-in-the-life, the stack breakdown, the form check — so the calendar stays full without a studio day.",
  metaTitle: "Vireo for fitness and supplements",
  metaDescription:
    "Keep a weekly short-form calendar full for fitness and supplement brands. Reusable stack-breakdown formats, your own gym footage, and offer tests that never touch the edit.",
  posters: ["/media/posters/clip-13.jpg", "/media/posters/clip-22.jpg"],
  frameLabel: "A stack breakdown and a form check produced from the same set of assets.",
  benefitsHeading: "The formats this category repeats, made repeatable",
  benefits: [
    {
      title: "Stack breakdowns as a template",
      body: "The three-product callout becomes a reusable structure. Change the stack and keep the rhythm that made it readable at a scroll.",
      glyph: IconTemplate,
    },
    {
      title: "Your gym footage, a generated presenter",
      body: "Use the footage you actually shot where it counts and let an AI actor carry the voiceover and the pieces to camera you never found time to film.",
      glyph: IconFilm,
    },
    {
      title: "Captions built for a muted feed",
      body: "Burned-in captions with outline and highlight styles, positioned clear of the platform's own interface so nothing important sits under a like button.",
      glyph: IconText,
    },
    {
      title: "Change the offer, not the edit",
      body: "The call to action is its own column in the bulk grid, so a new promotion sweeps a whole batch without anybody reopening the timeline.",
      glyph: IconCampaign,
    },
  ],
  stepsHeading: "How a week's calendar gets filled",
  steps: [
    {
      title: "Start from a format your audience already watches",
      body: "Clone the structure of a routine, a stack breakdown or a form check that performs in your niche.",
    },
    {
      title: "Bring your own footage where it matters",
      body: "Real gym and product footage in the scenes that need to be real, generated takes everywhere else.",
    },
    {
      title: "Rotate the offer, not the cut",
      body: "The grid keeps the video and changes only the hook, the product and the call to action, so results stay comparable week to week.",
    },
  ],
  faqs: [
    {
      question: "Can I use footage I already have?",
      answer:
        "Yes. Upload it into the library once and drop it into any scene of any cloned structure, alongside generated material in the same timeline.",
    },
    {
      question: "How do captions cope with gym noise?",
      answer:
        "Captions are typed layers rather than transcription output, so nothing is at the mercy of a noisy audio track and every word is checked before it renders.",
    },
    {
      question: "Can I test offers as well as hooks?",
      answer:
        "The call to action is a separate column from the hook, so you can hold one constant while you move the other and actually read which one moved the number.",
    },
  ],
  related: ["solutions/dtc-brands", "features/bulk-variations", "industries/beauty-and-skincare"],
};

export const INDUSTRY_ENTRIES: readonly LandingEntry[] = [
  BEAUTY_AND_SKINCARE,
  FITNESS_AND_SUPPLEMENTS,
];
