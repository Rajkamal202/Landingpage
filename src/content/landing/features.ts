import {
  IconCheckAll,
  IconClock,
  IconCopy,
  IconLayers,
  IconSliders,
  IconSplit,
  IconTable,
  IconTemplate,
  IconText,
  IconUndo,
  IconUser,
  IconVoice,
} from "@/components/icons";
import type { LandingEntry } from "./types";

export const LINK_CLONING: LandingEntry = {
  group: "features",
  slug: "link-cloning",
  name: "Link cloning",
  title: "Paste a link. Get an editable project back.",
  sub: "Vireo reads a public post and reconstructs it as layers — scenes with real boundaries, on-screen text you can retype, overlays you can move, and the pacing that made it work in the first place.",
  metaTitle: "Link cloning",
  metaDescription:
    "Paste a TikTok, Instagram, YouTube Shorts or Meta Ads link and Vireo rebuilds it as an editable project: scenes, text layers, overlays, captions and timing.",
  posters: ["/media/posters/clip-01.jpg", "/media/posters/clip-17.jpg"],
  frameLabel: "A source post beside the scenes and text layers Vireo extracted from it.",
  benefitsHeading: "What comes back when you paste a link",
  benefits: [
    {
      title: "Scene boundaries, not guesses",
      body: "Cuts are read off the source frames, so a six-second hook that changes shot three times returns as three clips you can retime independently.",
      glyph: IconSplit,
    },
    {
      title: "Text comes back as text",
      body: "Captions and callouts arrive as editable type layers with their weight, position and timing intact. You retype the words; the layout survives.",
      glyph: IconText,
    },
    {
      title: "Pacing is a value you can edit",
      body: "Every clone records how long each beat holds. Speed the whole cut up by fifteen percent and the captions move with it instead of drifting out of sync.",
      glyph: IconClock,
    },
    {
      title: "A starting document, not a preset",
      body: "Delete a scene, add two, replace the audio. Nothing about the original constrains what you ship — the structure is a suggestion you can overrule.",
      glyph: IconLayers,
    },
  ],
  stepsHeading: "How cloning fits into a working day",
  steps: [
    {
      title: "Paste the link",
      body: "TikTok, Instagram, YouTube Shorts and Meta Ads links are recognised as you paste. Anything else, upload the file instead.",
    },
    {
      title: "Watch it come apart",
      body: "Six passes run in front of you: fetch the source, detect scenes, extract on-screen text, separate overlays and captions, read pacing, build the project.",
    },
    {
      title: "Open it and start swapping",
      body: "The result lands in the timeline with every layer selectable. Replace the product, rewrite the hook, export vertical.",
    },
  ],
  faqs: [
    {
      question: "Which links can Vireo read?",
      answer:
        "Public posts on TikTok, Instagram, YouTube Shorts and Meta Ads. A private, deleted or age-gated post fails with a named reason and a suggested fix rather than a spinner that never resolves.",
    },
    {
      question: "Does cloning copy the original video?",
      answer:
        "No. Cloning reconstructs structure — timing, layer positions, text placement — and leaves you to fill it with your own footage, product and script. What you export is yours.",
    },
    {
      question: "How long does a clone take?",
      answer:
        "Under a minute for a typical fifteen to thirty second post, and you can start editing the scenes that have already resolved while the last passes finish.",
    },
  ],
  related: ["features/bulk-variations", "features/ai-actors", "solutions/dtc-brands"],
};

export const AI_ACTORS: LandingEntry = {
  group: "features",
  slug: "ai-actors",
  name: "AI actors",
  title: "UGC-style video without a shoot",
  sub: "Sixteen presenters with consistent faces, voices and delivery. Write the script, cast who says it, and get a talking-head take back in less time than it takes to book one.",
  metaTitle: "AI actors",
  metaDescription:
    "Generate UGC-style talking-head video with consistent AI presenters, real voice control and lip sync that survives a script rewrite.",
  posters: ["/media/posters/clip-03.jpg", "/media/posters/clip-11.jpg"],
  frameLabel: "Two takes of the same script, delivered by two different presenters.",
  benefitsHeading: "Why a cast beats a one-off render",
  benefits: [
    {
      title: "The same face, every week",
      body: "An actor is a saved identity rather than a one-off render. Run a hook test across eight scripts and the person on screen is recognisably the same person in all eight.",
      glyph: IconUser,
    },
    {
      title: "Voice and delivery are separate controls",
      body: "Cast the presenter, then set pace and energy. A skincare routine and a supplement claim need the same face reading at very different speeds.",
      glyph: IconVoice,
    },
    {
      title: "Lip sync that survives a rewrite",
      body: "Change three words and only the affected phrase re-renders. You are not paying for a whole take again to fix the pronunciation of a product name.",
      glyph: IconSliders,
    },
    {
      title: "Languages without a second casting call",
      body: "Each actor carries the languages they speak. Localising a winning hook is a dropdown and a re-render, not a new production.",
      glyph: IconCheckAll,
    },
  ],
  stepsHeading: "How a take gets made",
  steps: [
    {
      title: "Write or generate the script",
      body: "Paste your own, or start from the hook structure Vireo pulled out of a clone and rewrite it in your voice.",
    },
    {
      title: "Cast the take",
      body: "Filter by presentation, age range, style and language, and hear a voice sample before you spend a token.",
    },
    {
      title: "Drop it into the edit",
      body: "The take arrives as a clip on the timeline, ready to sit under your product footage, captions and callouts.",
    },
  ],
  faqs: [
    {
      question: "Are these real people?",
      answer:
        "No. Every presenter is generated. Vireo does not use the likeness or the voice of a real person, and no actor is modelled on a specific individual.",
    },
    {
      question: "Can I use my own footage instead?",
      answer:
        "Yes. Upload a talking-head take you shot yourself and use Vireo only for the captions, overlays, timing and variations around it.",
    },
    {
      question: "What does a take cost in tokens?",
      answer:
        "A fifteen-second talking-head render is 180 tokens, so a Starter month covers roughly twenty-two of them alongside the images and audio around them.",
    },
  ],
  related: ["features/link-cloning", "solutions/agencies", "industries/beauty-and-skincare"],
};

export const BULK_VARIATIONS: LandingEntry = {
  group: "features",
  slug: "bulk-variations",
  name: "Bulk variations",
  title: "One approved cut, forty variants, one export",
  sub: "The bulk editor is a spreadsheet where every row is a finished video. Change the hook in one column, the product in another, and generate the whole set in a single pass.",
  metaTitle: "Bulk variations",
  metaDescription:
    "Turn one approved short-form video into a batch. Edit hooks, copy, products and actors in a real grid, then generate and export the whole set at once.",
  posters: ["/media/posters/clip-05.jpg", "/media/posters/clip-21.jpg"],
  frameLabel: "Two exports from the same batch, each carrying a different hook and product.",
  benefitsHeading: "What makes it a grid and not a form",
  benefits: [
    {
      title: "Paste a column straight out of a sheet",
      body: "Copy forty hooks out of a spreadsheet and paste them in. Tab-separated text lands in the right cells; media columns open a picker rather than accepting stray text.",
      glyph: IconTable,
    },
    {
      title: "Fill down what stays the same",
      body: "Drag the fill handle to push a product, an actor or a music bed through a hundred rows, so only the cells that genuinely differ take a second edit.",
      glyph: IconCopy,
    },
    {
      title: "Watch the batch, not each render",
      body: "Rows report queued, generating, ready or failed individually under one summary bar, so a single failure never hides behind an aggregate percentage.",
      glyph: IconTemplate,
    },
    {
      title: "Undo works across the whole grid",
      body: "Every cell edit, paste and fill goes on one command stack. Pasting into the wrong column is one keystroke to reverse, not an afternoon to rebuild.",
      glyph: IconUndo,
    },
  ],
  stepsHeading: "How a batch gets built",
  steps: [
    {
      title: "Send an approved video to bulk",
      body: "Any finished project exposes its editable slots — hook, body copy, CTA, product, product image, actor, voice and music — as columns.",
    },
    {
      title: "Fill the grid",
      body: "Type, paste, fill down or import a CSV. The grid stays responsive at a thousand rows because it renders only the ones you can see.",
    },
    {
      title: "Generate and export the set",
      body: "Generate all states the row count and the total token cost before it starts, then hands you the finished batch.",
    },
  ],
  faqs: [
    {
      question: "How many variations can one project hold?",
      answer:
        "The grid is virtualised, so a thousand rows scroll as smoothly as ten. Batches that actually get shipped are usually twenty to sixty.",
    },
    {
      question: "Can I generate only part of the batch?",
      answer:
        "Yes. Select the rows you want, or generate a single row from its context menu while you are still writing the rest of the grid.",
    },
    {
      question: "What happens to a failed row?",
      answer:
        "It keeps its cell contents and offers a retry. Nothing else in the batch waits on it, and the summary bar counts it separately from the rows still running.",
    },
  ],
  related: ["features/link-cloning", "solutions/app-marketers", "industries/fitness-and-supplements"],
};

export const FEATURE_ENTRIES: readonly LandingEntry[] = [
  LINK_CLONING,
  AI_ACTORS,
  BULK_VARIATIONS,
];
