import {
  IconBrand,
  IconCampaign,
  IconGrowth,
  IconLocked,
  IconPackage,
  IconSpeed,
  IconTarget,
  IconTeam,
  IconTemplate,
  IconVideo,
  IconVoice,
} from "@/components/icons";
import type { LandingEntry } from "./types";

export const DTC_BRANDS: LandingEntry = {
  group: "solutions",
  slug: "dtc-brands",
  name: "DTC brands",
  title: "Creative volume without a bigger team",
  sub: "You already know which formats convert for your category. Vireo turns that knowledge into a production line: clone the format, drop your product in, and test twenty angles in the week you would otherwise spend briefing one.",
  metaTitle: "Vireo for DTC brands",
  metaDescription:
    "Produce short-form ad creative in-house at volume. Clone the formats that work, apply your brand kit and product catalogue, and test twenty angles a week.",
  posters: ["/media/posters/clip-06.jpg", "/media/posters/clip-14.jpg"],
  frameLabel: "The same product ad in two angles, produced from one approved cut.",
  benefitsHeading: "What changes when production moves in-house",
  benefits: [
    {
      title: "Your catalogue, not a stock library",
      body: "Saved products carry their own images, descriptions and URLs, so swapping the hero product across a batch is one column rather than forty uploads.",
      glyph: IconPackage,
    },
    {
      title: "The brand kit applies itself",
      body: "Logo, palette, type and tone of voice are set once and every generation inherits them. A new hire ships on-brand work on their first afternoon.",
      glyph: IconBrand,
    },
    {
      title: "Test the hook, hold everything else",
      body: "Fan an approved cut into hook variants only. When one wins you know why it won, because nothing else in the video moved.",
      glyph: IconTarget,
    },
    {
      title: "Ship the week you brief",
      body: "No retainer, no revision queue, no waiting on a shoot date. The gap between an idea and a live asset is measured in hours.",
      glyph: IconSpeed,
    },
  ],
  stepsHeading: "How a brand gets started",
  steps: [
    {
      title: "Load your brand once",
      body: "Logo, colours, fonts, tone of voice, and the products you actually sell, with their images and descriptions.",
    },
    {
      title: "Clone a format that already works",
      body: "Take a post from your category, keep the structure and the pacing, and replace everything else with your own.",
    },
    {
      title: "Fan it out and hand it to media buying",
      body: "Export the whole set vertical, ready for TikTok, Reels and Shorts, with no watermark on any paid plan.",
    },
  ],
  faqs: [
    {
      question: "We already work with a creative agency. Where does this fit?",
      answer:
        "Most teams keep the agency for brand films and bring iteration in-house. Vireo covers the twenty ad variants a month that never justified their own line on a retainer.",
    },
    {
      question: "Can two people work on the same account?",
      answer:
        "Projects, the asset library and brand kits are shared across the workspace, so a strategist and an editor can hand work back and forth without exporting anything.",
    },
    {
      question: "What does a month of testing actually cost?",
      answer:
        "A Pro month is 11,880 tokens, which covers roughly sixty short-form renders plus the images and voiceover around them — about a fifth of one agency retainer.",
    },
  ],
  related: ["solutions/agencies", "features/bulk-variations", "industries/beauty-and-skincare"],
};

export const AGENCIES: LandingEntry = {
  group: "solutions",
  slug: "agencies",
  name: "Agencies",
  title: "More accounts, the same creative team",
  sub: "Every client wants weekly creative and none of them want to fund a shoot for it. Vireo lets one strategist produce for six accounts by making the format the reusable thing instead of the footage.",
  metaTitle: "Vireo for agencies",
  metaDescription:
    "Run short-form creative for more accounts without more headcount. Per-client brand kits, reusable format templates, higher clone concurrency and unwatermarked exports.",
  posters: ["/media/posters/clip-02.jpg", "/media/posters/clip-18.jpg"],
  frameLabel: "The same format delivered for two different client brands.",
  benefitsHeading: "Built for a roster, not a single brand",
  benefits: [
    {
      title: "A brand kit per client",
      body: "Each account keeps its own logo, palette, tone and product list. Switching client switches everything downstream of it, including what the generator reaches for.",
      glyph: IconTeam,
    },
    {
      title: "Templates travel between accounts",
      body: "A structure that worked for a supplement brand is one template away from working for a skincare brand — with none of the first client's assets attached to it.",
      glyph: IconTemplate,
    },
    {
      title: "Concurrency you can staff around",
      body: "Pro runs three video clones and three slideshow clones at a time, so a Monday of intake does not queue behind itself while the team waits.",
      glyph: IconVideo,
    },
    {
      title: "Client-ready output, no watermark",
      body: "Exports carry your client's brand and nothing else. There is no Vireo mark on any paid plan, so nothing has to be cropped before it goes out.",
      glyph: IconLocked,
    },
  ],
  stepsHeading: "How a roster runs on it",
  steps: [
    {
      title: "Set each client up as its own brand kit",
      body: "Assets, palette, products and tone of voice, once per account. Everything the team generates afterwards inherits it.",
    },
    {
      title: "Build a library of structures that convert",
      body: "Save the formats that perform as templates rather than rebuilding them from scratch for the next client in the same category.",
    },
    {
      title: "Produce the week's batch in one pass",
      body: "Bulk-generate per account, review the grid, export. One review session covers the whole roster.",
    },
  ],
  faqs: [
    {
      question: "Can we white-label what we deliver?",
      answer:
        "Exports have no Vireo watermark on any paid plan, so what the client receives is entirely theirs. The studio interface itself is not white-labelled in this version.",
    },
    {
      question: "How do we keep client assets separate?",
      answer:
        "Brand kits are scoped per account and the library filters to the active one, so nothing crosses between clients unless somebody deliberately moves it.",
    },
    {
      question: "Is there a plan for a large roster?",
      answer:
        "Enterprise adds custom token allocation, custom template building and embedded engineering support, which is usually what agencies past ten accounts come looking for.",
    },
  ],
  related: ["solutions/dtc-brands", "features/ai-actors", "features/bulk-variations"],
};

export const APP_MARKETERS: LandingEntry = {
  group: "solutions",
  slug: "app-marketers",
  name: "App marketers",
  title: "Creative that keeps up with your bid strategy",
  sub: "App campaigns burn creative faster than any other channel. Vireo makes replacing a fatigued asset a twenty-minute job rather than a sprint item, so the account never has to sit on stale video.",
  metaTitle: "Vireo for app marketers",
  metaDescription:
    "Replace fatigued app install creative in minutes. Turn screen recordings into editable scenes, rotate hooks weekly, and localise without re-cutting.",
  posters: ["/media/posters/clip-04.jpg", "/media/posters/clip-20.jpg"],
  frameLabel: "One app install ad with two different opening hooks.",
  benefitsHeading: "Made for a channel that eats creative",
  benefits: [
    {
      title: "Screen recordings become scenes",
      body: "Upload a capture of the app and Vireo splits it into beats you can retime, so an onboarding flow lands in three seconds instead of eleven.",
      glyph: IconVideo,
    },
    {
      title: "Hook rotation on a schedule",
      body: "Keep the body of a winning ad and rotate only the first two seconds. Fatigue shows up in the hook long before it shows up in the payoff.",
      glyph: IconGrowth,
    },
    {
      title: "One project, every placement",
      body: "9:16 is the default, with 1:1, 4:5 and 16:9 exported from the same timeline when a placement demands a different frame.",
      glyph: IconCampaign,
    },
    {
      title: "Localise without re-cutting",
      body: "Swap the caption track and the voice, keep the timing. A five-market rollout is one grid rather than five separate edits.",
      glyph: IconVoice,
    },
  ],
  stepsHeading: "How a weekly rotation works",
  steps: [
    {
      title: "Bring in a capture or a proven structure",
      body: "Upload a screen recording of the app, or clone the structure of a post that already performs in your category.",
    },
    {
      title: "Rebuild the beats around your funnel",
      body: "Retime the onboarding, move the value proposition to where the hook used to be, and caption it for a muted feed.",
    },
    {
      title: "Rotate weekly from the grid",
      body: "Keep the winner, change the hook, regenerate the row. The rest of the cut is untouched, so the read stays clean.",
    },
  ],
  faqs: [
    {
      question: "Can Vireo use my app's real interface?",
      answer:
        "Yes — upload a screen recording and it becomes editable scenes. Vireo will not invent screenshots of software it has never seen, which is exactly what you want in an install ad.",
    },
    {
      question: "Do you support placements other than 9:16?",
      answer:
        "Every project exports 9:16, 1:1, 4:5 and 16:9 from the same timeline, so a placement change does not send you back to the edit.",
    },
    {
      question: "How fast can we replace a fatigued asset?",
      answer:
        "Cloning the existing winner and swapping its hook is usually under twenty minutes, and most of that is deciding what the new hook should say.",
    },
  ],
  related: ["features/bulk-variations", "features/link-cloning", "solutions/dtc-brands"],
};

export const SOLUTION_ENTRIES: readonly LandingEntry[] = [DTC_BRANDS, AGENCIES, APP_MARKETERS];
