# Vireo — Frontend Specification

**Version 1.0 · Frontend only · No backend**

> **Codename.** The product is called **Vireo** throughout this document. If you have a real product name, find-and-replace `Vireo` before starting. All copy, the logomark, and the visual identity in this spec are original and belong to this project.

---

## 1. What this product is

Vireo is a browser-based studio for producing short-form vertical video ads and organic social content at volume.

The single primitive the whole product is built on: **de-editing**. A user pastes a link to an existing video or slideshow, and Vireo decomposes it back into an editable structure — separate scenes, on-screen text layers, overlays, captions, timing, and pacing. From that skeleton the user swaps in their own product, script, and talent, then fans a single approved output into dozens of variations.

Three surfaces of increasing power sit on top of that primitive:

1. **Timeline editor** — familiar, linear, for finishing a single cut.
2. **Node canvas** — a visual graph for composing multi-step generations with references.
3. **Bulk editor** — a spreadsheet that turns one approved asset into a batch.

Everything else (avatars, voiceover, templates) is supporting capability.

**Primary users:** performance marketers and social teams at DTC brands, and agencies running many client accounts.

**Output format:** 9:16 vertical, targeting TikTok, Instagram Reels, and YouTube Shorts.

---

## 2. Scope

### In scope
- Complete public marketing site
- Complete authenticated app UI, every screen, fully interactive
- Typed mock data layer that makes every screen feel real
- Design system, component library, motion system
- Responsive down to 390px, full keyboard operation, WCAG 2.1 AA

### Out of scope for this build
- Any backend, database, or API server
- Real AI inference, real video encoding, real file upload to storage
- Real authentication (mock a session; login form navigates to the app)
- Payment processing (pricing CTAs open a mock checkout dialog)
- Social platform publishing

### Architectural requirement
All data access goes through `src/lib/api/*`. Each module exports typed async functions that currently resolve from fixtures with realistic latency. Swapping to a real backend must be an edit to those modules only. **No component ever imports a fixture directly.**

---

## 3. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15, App Router | RSC where it helps, `"use client"` deliberately |
| Language | TypeScript 5.6, `strict` | `noUncheckedIndexedAccess: true` |
| Styling | Tailwind CSS v4 | CSS-first config, tokens as `@theme` custom properties |
| Primitives | Radix UI | Wrapped in our own components; do not ship raw shadcn defaults |
| Motion | Motion (framer-motion v11+) | Layout animations, orchestrated sequences |
| Client state | Zustand | One store per editor surface, slices not one god store |
| Server state | TanStack Query v5 | Against the mock API layer |
| Forms | react-hook-form + zod | Zod schemas are the single source of truth for types |
| Node graph | React Flow (`@xyflow/react`) | Custom node + edge renderers, never the defaults |
| Virtualization | TanStack Virtual | Bulk editor grid, library grid |
| Tables | TanStack Table | Bulk editor |
| Icons | Lucide | One consistent stroke width, see §4.7 |
| Testing | Vitest + Testing Library, Playwright | Smoke E2E on critical flows |
| Tooling | pnpm, ESLint flat config, Prettier | |

**Forbidden:** any component library that imposes its own visual language (MUI, Chakra, Ant, Mantine, DaisyUI). We are building the visual language.

---

## 4. Design system

### 4.1 Direction

The site is deliberately **two acts**, and the contrast between them is the concept.

**Act one — the hero.** A saturated cobalt sky rendered as flat vector illustration: soft cumulus clouds in warm cream and dusty rose, a few loose magenta brushstrokes. Optimistic, hand-drawn, closer to an animation still than to a SaaS landing page. This is the risk we take, and it earns its place: the product is about making things people actually want to watch, and a page that opens with a rendered sky says that faster than a gradient mesh does.

**Act two — everything below.** Near-white, quiet, precise. Generous whitespace, restrained type, product screenshots framed in soft gradient bleeds. All the boldness is spent in act one; the rest of the page is disciplined so the work can speak.

The app itself is act two: light, neutral, near-monochrome chrome so that colorful video thumbnails are the only saturated thing on screen.

### 4.2 Color

Define as CSS custom properties in `@theme`. Never write a raw hex in a component.

```
/* Brand */
--color-brand-50   #EEF3FF
--color-brand-100  #D9E3FF
--color-brand-200  #B8CCFF
--color-brand-400  #6E93F7
--color-brand-500  #3D6FF0   /* primary — links, active states, focus */
--color-brand-600  #2B55CC   /* hover */
--color-brand-700  #1F3F9E
--color-brand-900  #14285F

/* Hero illustration palette (marketing only) */
--color-sky-deep     #2B5BE0
--color-sky-mid      #4277F0
--color-cloud-cream  #F5EFE6
--color-cloud-rose   #F0D5D8
--color-streak       #C24BC9

/* Neutrals — slightly cool, never pure gray */
--color-ink-950  #0B0C0E   /* primary text, dark surfaces */
--color-ink-900  #16181C
--color-ink-700  #3A3F47
--color-ink-500  #6B717C   /* secondary text */
--color-ink-400  #8C929C   /* tertiary / placeholder */
--color-ink-300  #C3C8D0
--color-ink-200  #E1E4E9   /* borders */
--color-ink-100  #EFF1F4   /* subtle fills */
--color-ink-50   #F7F8FA   /* page background, act two */
--color-white    #FFFFFF

/* Semantic */
--color-success  #17916B
--color-warning  #B87514
--color-danger   #D0342C
--color-info     var(--color-brand-500)

/* Editor-only accents (timeline tracks) */
--track-video    #3D6FF0
--track-audio    #17916B
--track-text     #8B5CF6
--track-overlay  #E0812B
```

Dark mode is **not** in scope for v1. Build tokens so it could be added, but do not ship a half-considered dark theme.

### 4.3 Typography

Two families, chosen for a specific reason and used with discipline.

- **Display / UI:** `Geist` (variable). Geometric, slightly technical, excellent at large sizes with tight tracking. Used for everything except numeric data.
- **Mono / data:** `Geist Mono`. Timecodes, token counts, dimensions, node ports, spreadsheet cells. Anything that is a number the user compares against another number is mono.

Self-host both via `next/font/local`. No Google Fonts network request.

Scale — every size paired with a fixed line-height and tracking. Do not deviate.

| Token | Size / LH | Tracking | Weight | Use |
|---|---|---|---|---|
| `display-xl` | 68 / 72 | -0.03em | 500 | Hero headline (desktop) |
| `display-lg` | 48 / 54 | -0.025em | 500 | Section headings |
| `display-md` | 34 / 40 | -0.02em | 500 | Sub-section, pricing tier name |
| `title-lg` | 24 / 32 | -0.015em | 500 | Card titles, dialog titles |
| `title-md` | 18 / 26 | -0.01em | 500 | Panel headers |
| `body-lg` | 17 / 28 | -0.005em | 400 | Marketing body copy |
| `body-md` | 15 / 24 | 0 | 400 | App default |
| `body-sm` | 13.5 / 20 | 0 | 400 | Secondary, help text |
| `label` | 12.5 / 16 | 0.01em | 500 | Form labels, property panel labels |
| `caption` | 11.5 / 16 | 0.04em, uppercase | 600 | Eyebrows, section markers |
| `mono-sm` | 12.5 / 16 | 0 | 450 | Timecodes, counts |

Hero headline drops to 44/48 at `md`, 34/38 at `sm`.

**Rules:** sentence case everywhere except `caption`. Never center body copy longer than two lines. Measure caps at 68ch for marketing prose.

### 4.4 Spacing & layout

4px base. Allowed steps only: `4 8 12 16 20 24 32 40 48 64 80 96 128`.

- Marketing container: `max-w-[1200px]`, gutters 24px mobile / 40px desktop.
- Marketing vertical section rhythm: 128px desktop, 80px tablet, 64px mobile. Applied consistently — this rhythm is most of what makes a page feel professionally built.
- App chrome: 56px top bar, 12px inner padding on panels, 8px gaps in dense toolbars.
- Property panels: fixed 280px wide, never percentage.

### 4.5 Radii, borders, elevation

```
--radius-sm    6px    /* inputs, small chips */
--radius-md    10px   /* buttons, cards in dense UI */
--radius-lg    14px   /* panels, dialogs */
--radius-xl    20px   /* marketing cards, screenshot frames */
--radius-pill  999px  /* nav pill, CTA pills, toggles */
```

Borders are always `1px solid var(--color-ink-200)`. Never 2px, never a colored border except on focus or active selection.

Elevation — four levels, no more. Every shadow is two-layer (a tight contact shadow plus a diffuse one). Never use Tailwind's default `shadow-*`.

```
--elev-1  0 1px 2px rgb(11 12 14 / .04), 0 1px 3px rgb(11 12 14 / .06)
--elev-2  0 2px 4px rgb(11 12 14 / .04), 0 6px 16px rgb(11 12 14 / .08)
--elev-3  0 4px 8px rgb(11 12 14 / .05), 0 16px 32px rgb(11 12 14 / .10)
--elev-4  0 8px 16px rgb(11 12 14 / .06), 0 32px 64px rgb(11 12 14 / .14)
```

Floating toolbars and the nav pill additionally get `backdrop-filter: blur(20px) saturate(1.6)` with a translucent fill.

### 4.6 Motion

```
--ease-out    cubic-bezier(.32, .72, 0, 1)    /* default, feels expensive */
--ease-in-out cubic-bezier(.65, 0, .35, 1)
--ease-spring spring(1, 90, 14, 0)            /* Motion physics for drag release */

--dur-instant  90ms    /* hover, color change */
--dur-fast     160ms   /* dropdowns, tooltips, toggles */
--dur-base     240ms   /* dialogs, panels, tab switches */
--dur-slow     420ms   /* page/route transitions, hero reveal */
```

**Rules.**
- Hover transitions animate `color`, `background-color`, `border-color`, `box-shadow`, `transform` only. Never `all`.
- Elements entering the viewport rise 12px and fade in, staggered 40ms per sibling, triggered once at 20% visibility.
- The hero runs a single orchestrated load sequence (§6.2) — not five independent animations.
- Drag operations use spring physics on release, linear during drag.
- **Every animation is disabled or reduced to a 1ms opacity fade under `prefers-reduced-motion: reduce`.** Implement this once, globally, plus a `useReducedMotion` guard in Motion components.

### 4.7 Icons

Lucide, 1.5px stroke at 16px and 20px sizes, 2px at 24px. Never mix stroke widths in one toolbar. Icons in buttons are optically aligned — nudge 0.5px where the glyph's visual center is off. No emoji anywhere in the product UI.

### 4.8 The logomark

Original, geometric, drawn as inline SVG (not an image file). A single mark that reads at 20px in the nav and at 320px on an empty state: **three overlapping vertical rounded slats of decreasing height**, suggesting both stacked video clips in a timeline and a stylized leaf. Currency: `currentColor`, so it inherits from context. Wordmark is Geist Medium at -0.02em tracking, mark sits at 1.15× cap height with 8px optical gap.

---

## 5. Shared component inventory

Build these in Phase 1 before any screen. Each ships with all interaction states and a Storybook-less demo route at `/_dev/components` (excluded from production build).

**Primitives:** `Button` (variants: primary, secondary, ghost, danger, pill; sizes sm/md/lg; `loading` and `icon` props), `IconButton`, `Input`, `Textarea` (auto-grow), `Select`, `Combobox`, `Checkbox`, `Radio`, `Switch`, `Slider`, `NumberStepper`, `SegmentedControl`, `Tabs`, `Tooltip`, `Popover`, `DropdownMenu`, `ContextMenu`, `Dialog`, `Sheet`, `Toast` (via Sonner, restyled), `Skeleton`, `Progress`, `Badge`, `Avatar`, `EmptyState`, `ScrollArea`.

**Composite:** `TokenMeter`, `AspectRatioPicker`, `DurationPicker`, `ModelPicker`, `AssetThumb` (with hover-scrub video preview), `UploadDropzone`, `ColorSwatch`, `PropertyRow` (label + control, 280px panel layout), `PanelSection` (collapsible), `Toolbar`, `FloatingToolbar`, `KeyboardShortcut` (renders ⌘/Ctrl per platform).

**`EmptyState` is mandatory** on every list, grid, canvas, and timeline. Each one has an illustration or icon, a one-line explanation of what goes here, and a primary action. Empty screens are invitations, not dead ends.

---

## 6. Marketing site — `/`

Single scrolling page. Nav is fixed; everything else is one column.

### 6.1 Navigation

A floating pill, centered-left, 24px from top, `--radius-pill`, translucent with backdrop blur, `--elev-2`.

Contents: logomark + wordmark · `Community` · `Log in`. A separate solid `--color-ink-950` pill button reading **Get started** floats at top right, independent of the nav pill.

Over the hero the nav is white-on-translucent-dark; past the hero it inverts to ink-on-translucent-white. Cross-fade over `--dur-base` driven by scroll position, not a hard swap.

Mobile: pill collapses to logomark + hamburger; menu opens as a full-height `Sheet`.

### 6.2 Hero

Full-viewport-height minus 80px. Background is the illustrated cobalt sky (§4.1), authored as an inline SVG component — clouds as layered paths with soft edges, brushstrokes as separate paths. Two cloud layers parallax at 0.3× and 0.15× scroll rate. On `prefers-reduced-motion`, parallax is disabled and the sky is static.

Stacked, centered:

1. Eyebrow: `Backed by Y Combinator` — **only if true for you; otherwise delete this element entirely.** Do not ship a fake credential.
2. H1, `display-xl`, white, two lines: **"Your AI short-form ads editor at scale"**
3. Sub, `body-lg`, white at 82% opacity: **"Clone what already works, then make it yours — in minutes, not weeks."**
4. **The CTA, which is the most important component on the site.**

**Hero CTA.** A white pill container, `--elev-3`, containing a borderless text input with a link icon and placeholder **"Paste a video or slideshow link"**, and an inline `--color-ink-950` pill button **"Get started"**. To its right, the word `or` in ink-400, then a white outlined pill button **"Upload files"**.

Behaviors:
- Focus: the container's shadow lifts to `--elev-4` and a 2px `--color-brand-500` ring appears, over `--dur-fast`.
- On paste of a recognized URL, a platform badge (TikTok / Instagram / Meta Ads / YouTube) fades in inside the input's left edge. Detect by hostname against a typed matcher.
- Invalid URL on submit: inline message below the pill, `body-sm` in `--color-danger`, no layout shift (space is reserved). Message states what's wrong and what to do — never "Invalid input."
- "Upload files" opens the `UploadDropzone` dialog.
- Both paths navigate to `/app/import` with the value in a query param.

5. Below, a **product screenshot** of the generation studio, in a white rounded frame (`--radius-xl`, `--elev-4`), bleeding off the bottom of the viewport. It scales from 0.96 to 1.0 and rises 24px as it enters — this is the last beat of the load sequence.

**Load sequence** (orchestrated, total ~900ms): sky fades in → nav pill drops 8px into place → headline lines rise and fade, staggered 60ms → sub → CTA scales from 0.98 → screenshot rises. One timeline, not six independent animations.

### 6.3 How it works

Section heading `display-lg`, centered: **"How it works"**.

Six steps in an **alternating two-column zigzag**: odd steps have text left / image right, even steps reverse. Vertical rhythm between steps is 96px. Each step is a numbered circular marker (`--color-ink-950` fill, white `mono-sm` numeral), a `title-lg` heading, a two-line `body-md` description in `--color-ink-500`, and a screenshot in a gradient-bleed frame.

Gradient bleeds are per-step, 24px of padding around the screenshot, `--radius-xl`:

| # | Step | Copy | Bleed |
|---|---|---|---|
| 1 | **Clone** | "Drop in a TikTok, Instagram, or Meta Ads link and Vireo pulls the video apart — scenes, on-screen text, overlays, and captions become editable layers." | blue → violet |
| 2 | **Create** | "Generate UGC-style video with AI actors, voices, and scripts. Authentic-looking content without a shoot." | rose → amber |
| 3 | **Generate** | "Compose image and video generations on a visual canvas. Wire up references, branch ideas, and iterate without leaving the graph." | violet → pink |
| 4 | **Slideshows** | "Clone a slideshow from a link, swap the text and assets, and turn one layout into a dozen variations." | sky → indigo |
| 5 | **Edit** | "Fine-tune timing, captions, and product callouts on the timeline, then export the final cut." | pink → orange |
| 6 | **Bulk edit** | "Turn one approved video into a batch. Swap copy, products, and hooks in a spreadsheet, then export the whole set at once." | mint → sky |

The numbering here is legitimate — this is a real sequence and order carries meaning.

### 6.4 Comparison

Heading: **"The alternatives are expensive and slow."**
Sub: "Agencies and one-off creators add cost, revision cycles, and coordination. Vireo keeps production in-house and repeatable."

Three cards on a soft `--color-ink-50` rounded slab. The outer two (**Agencies**, **Creators**) are smaller, at 92% scale, slightly rotated (−1.5° and +1.5°), lower elevation, `--color-ink-400` text, and each row prefixed with a muted `−` chip. The center card (**With Vireo**) is full scale, white, `--elev-3`, with a filled ink circle-check badge at top right and each row prefixed with a filled check.

| Agencies | With Vireo | Creators |
|---|---|---|
| $5k+ per month | Clone any high-performing video in minutes | $500+ per video |
| Endless retakes and reshoots | Reusable AI actors | Long revision cycles |
| Weeks of turnaround | Fan one template into many variations | Inconsistent quality |
| Coordination overhead | A fraction of the cost, at 10× the pace | Can't scale with demand |

On scroll into view the outer cards settle from a wider rotation to their resting angle while the center card scales up from 0.97. One beat, 420ms.

Below 768px this becomes a vertical stack with no rotation, center card first.

### 6.5 Pricing

Heading **"Pricing"**, sub: "Access 100+ reference videos, templates, and every AI model we support." Then a smaller line in `--color-ink-400`: "Starter and Pro are self-serve. Enterprise is concierge."

**Billing toggle:** a `SegmentedControl` pill — `Monthly` / `Yearly` with a `Save 20%` badge inside the Yearly segment. Switching animates the price digits with a vertical roll (`Motion` layout on a digit-by-digit basis), not a hard swap. Yearly is the default selected state.

Two primary cards side by side, then a full-width Enterprise slab beneath.

**Starter** — light card, `--color-ink-50` fill, ink border.
Price: `$36` struck through in `--color-danger` at 60% size, then `$29` at `display-md`, then `/month`. Sub-line `body-sm`: "($348/year) per month, billed annually". Then `4,050 tokens / month` in mono. Description: "For creators getting started with short-form video." Primary dark pill CTA **Get started**.
Features: All AI generative media models · 1 video clone at a time · 1 slideshow clone at a time · No Vireo watermark · 25GB storage.

**Pro** — dark card, `--color-ink-950` fill, white text, `Popular` badge top right.
`$99` struck → `$79` /month · "($948/year) per month, billed annually" · `11,880 tokens / month`. Description: "For teams shipping content every week." White pill CTA **Get started**.
Features: Everything in Starter · 200GB storage · 3GB max file size · Priority rendering.

> **Note for the build.** The reference product's Pro tier does not visibly raise the "1 clone at a time" concurrency limit, which is a real gap for its target user. We fix it: Pro states **"3 video clones at a time"** explicitly. Do not replicate a confusing feature matrix just because the reference had one.

**Enterprise** — full-width dark slab, `--radius-xl`. `Concierge` badge, then heading **Enterprise**. Copy: "White-glove onboarding, custom template building, and features we build for you." Two feature columns: Custom token allocation · Custom template building · Dedicated support · White-glove onboarding · Embedded engineering support · SLA. Right side: `Custom` at `display-md`, "Scoped to your onboarding, team workflow, and feature needs," and a white pill **Book a call**.

All CTAs open a mock checkout `Dialog` (no real payment).

### 6.6 FAQ

Two-column: heading **"Frequently asked questions"** left, sticky until the list scrolls past. Accordion right — Radix Accordion, single-open, each item a bordered card with `--radius-lg`, 20px padding, chevron rotating 180° over `--dur-fast`, content height animated.

1. **What is Vireo?** — "An AI video studio for short-form. Paste a link to something that's working, and Vireo rebuilds it as an editable project you can make your own."
2. **How does it work?** — "Sign up, add your brand assets, and start creating. Generate scripts, clone formats, produce UGC-style video, and export ready for TikTok, Reels, and Shorts."
3. **What can I make?** — "Slideshows, UGC-style video, product ads, explainers, dialogue scenes, and talking-head content. All vertical, all short-form."
4. **How is this different from hiring an agency?** — "You keep control. No revision queues, no retainers, no waiting on someone else's calendar."
5. **What do I need to start?** — "Your brand assets — a logo and product images. Vireo supplies the visuals, voices, and everything else."
6. **What's in each plan?** — "Every plan includes the full editor, all models, brand kits, and export. Higher tiers add tokens, storage, and hands-on support."
7. **How fast is the first video?** — "Minutes. No setup call, no onboarding queue. Log in and start."

### 6.7 Footer

Dark `--color-ink-950`. Four columns (Product / Solutions / Resources / Company), logomark and one-line positioning statement, social row, legal row. Links to the SEO landing routes in §6.8.

### 6.8 Programmatic landing pages

Routes `/features/[slug]`, `/solutions/[slug]`, `/industries/[slug]` render from a typed content collection at `src/content/landing/*.ts`. One shared template: hero (title, sub, CTA), a four-item benefit grid, a three-step "how it fits" strip, an FAQ accordion, and a related-pages grid.

**These must not read as machine-generated.** Each entry carries genuinely distinct body copy, not one sentence with a noun swapped. If you cannot write real copy for a slug, do not create that slug. Ship eight good pages, not forty hollow ones.

---

## 7. App shell — `/app`

### 7.1 Top bar (56px, fixed)

Left: back chevron to the workspace list, then **workspace tabs**.

Tabs are the primary navigation model — projects are tabs, not a sidebar tree. Each tab: a type icon (video / slideshow / canvas), a name, and a close ✕ on hover. A `+` opens a new-project popover. Tabs are reorderable by drag (`Motion` layout animation). Overflow scrolls horizontally with fade masks at both edges. Double-click a tab name to rename inline. Middle-click closes.

Right: **Library** button (opens a `Sheet` from the right) and the **`TokenMeter`**.

`TokenMeter` is persistent and always visible: a small mono numeral, a thin 40px progress bar, and the balance. Hovering opens a popover breaking down usage by generation type this cycle, with a "Top up" action. When under 10% remaining, the bar turns `--color-warning`; at zero, `--color-danger` and generation buttons disable with a tooltip explaining why and how to fix it.

### 7.2 Routes

```
/                            marketing
/features/[slug]             landing template
/solutions/[slug]            landing template
/industries/[slug]           landing template
/pricing  /login  /signup

/app                         workspace list (grid of projects)
/app/import                  clone import flow
/app/p/[id]/studio           generation studio
/app/p/[id]/canvas           node graph
/app/p/[id]/timeline         video editor
/app/p/[id]/slideshow        slideshow editor
/app/p/[id]/bulk             bulk variation editor
/app/library                 asset library
/app/templates               template browser
/app/actors                  AI actor browser
/app/brand                   brand kit
/app/settings/{account,billing,team}
```

---

## 8. App screens

### 8.1 Import / clone — `/app/import`

The moment that has to feel like magic. Three states in one centered card, transitions animated with shared layout.

**Input.** A large URL field ("Paste a video or slideshow link"), a platform badge that appears on recognition, and an "or upload a file" affordance. Below, a `Recent clones` list.

**Analyzing.** A staged progress sequence with real-feeling substeps, each checking off as it completes:
`Fetching source` → `Detecting scenes` → `Extracting on-screen text` → `Separating overlays and captions` → `Reading pacing` → `Building editable project`.
Left of the steps, a preview of the source video plays muted and looping. As "Detecting scenes" completes, animated scene-boundary markers draw onto a filmstrip beneath it. This is the product's whole thesis rendered as a loading state — make it good. Total ~4.5s in mocks.

**Result.** A summary card: scene count, detected duration, number of text layers, detected aspect, and a filmstrip of extracted scenes. Two actions: **Open in timeline** (primary) and **Send to bulk editor**. A secondary "Start over" ghost link.

Failure state: named cause ("This post is private or has been deleted"), a suggested fix, and a retry. Never a generic error.

### 8.2 Generation studio — `/app/p/[id]/studio`

The screen shown in the hero. Layout: full-bleed content area with a floating composer docked at the bottom.

**Content area.** A responsive masonry grid of 9:16 generation results. Each `AssetThumb`: rounded, `--elev-1`, hover raises to `--elev-2` and scrubs the video preview on mouse X position. Hover reveals a top-right action cluster (favorite, download, duplicate, delete) and a bottom-left type badge. Click opens a lightbox with prev/next arrow-key navigation. Generating items render as an animated skeleton with a shimmer and a progress ring. Select multiple with shift-click; a contextual action bar rises from the bottom when a selection exists.

**Mode toolbar** — a `FloatingToolbar` (translucent, blurred, `--elev-3`) centered above the composer. Segments: `Talking Head` · `Replace Motion` · `Video` · `Image` · `Audio` · `…` (overflow menu: Lip Sync, Upscale, Remove Background, Extend). Active segment is a filled ink pill; the fill animates between segments with a shared layout transition.

Each mode swaps the composer's controls, animating height smoothly rather than jumping.

**Composer** — a white panel, `--radius-lg`, `--elev-3`.
- Left: a **Start Frame** dropzone — a small dashed 9:16 tile with a `+`, accepting drop or click. Populated, it shows the thumbnail with a remove ✕.
- Center: an auto-growing prompt `Textarea`. It supports **`@` reference syntax**: typing `@` opens a combobox of library assets; a selection inserts an inline pill chip (`@img1`) that is a real token in the value, deletable as a unit. Implement as a controlled contenteditable or a token-aware input — not a plain string with regex.
- Bottom row, left: `Templates` · `Actor` · `Reference` — each opens a picker popover.
- Bottom row, right: `ModelPicker` (a select with model name, a capability badge, and a per-generation token cost), `AspectRatioPicker` (9:16 default, plus 1:1, 16:9, 4:5), `DurationPicker` (5s / 10s / 15s), a `NumberStepper` for batch count (1–8), and a circular submit button.

Submit is disabled with an explanatory tooltip when the prompt is empty or tokens are insufficient. On submit, the estimated cost animates out of the `TokenMeter` and placeholder tiles appear at the top of the grid immediately.

**Library `Sheet`.** Right-side panel, 420px. Tabs: All · Images · Video · Audio · Brand. Grid with search, type filter, and sort. Drag an asset from here directly into the Start Frame slot or into the prompt as an `@` reference.

### 8.3 Templates, actors, brand kit

**Templates** — filterable grid (category, aspect, duration, industry). Cards autoplay a muted preview on hover. Clicking opens a detail `Sheet` with a full preview, the structural breakdown (scene count, text layers, pacing), and **Use template**.

**Actors** — grid of AI presenter cards with name, style tags, voice sample (a play button with an animated waveform), and language badges. Filter by gender presentation, age range, style, language.

**Brand kit** — logo upload, brand color swatches with a picker, font selection, a saved-products list (name, image, description, URL), and a default tone-of-voice field. This is what the FAQ promises users only need to supply; make it a genuinely quick screen.

### 8.4 Node canvas — `/app/p/[id]/canvas`

React Flow with entirely custom rendering. Do not ship default node styling.

**Canvas.** Dot grid background, pan on space-drag or middle-drag, zoom on scroll with a 0.25–2.5 clamp, a minimap bottom-left, and zoom controls bottom-right. Snap to an 8px grid. Marquee selection.

**Node types**, each a white card with `--radius-lg`, `--elev-2`, a 32px header strip with a type icon and editable name, typed ports, and a body preview:
- `Source` — an uploaded or library asset
- `Prompt` — text, with the same `@` reference support
- `ImageGen` — model, size, references 1–4, negative prompt; renders its output as the node body
- `VideoGen` — model, start frame, duration, aspect
- `Voice` — actor, script, speed
- `Compose` — merges inputs into a scene
- `Output` — terminal, with an export action

**Edges** are bezier, 2px, `--color-ink-300`, animating to `--color-brand-500` when either endpoint is selected. An animated dash flows along edges while the downstream node is generating. Ports are 10px circles, typed by color, and reject incompatible connections with a shake and a tooltip explaining the mismatch.

**Right panel** (280px) shows the selected node's properties via `PropertyRow`s: Image Size, Model, Reference Image 1–4 (thumbnail slots), Prompt, Negative Prompt.

Node library opens from a `+` button or double-click on empty canvas, as a searchable command palette.

Keyboard: `⌘C/⌘V` duplicate, `Delete` remove, `⌘A` select all, `⌘Z/⌘⇧Z` undo/redo, `F` fit view, `⌘Enter` run selected branch. Undo/redo is a real command stack in the Zustand store, minimum 50 entries.

### 8.5 Timeline editor — `/app/p/[id]/timeline`

Classic NLE layout, executed precisely.

**Top bar:** tool cluster left (select, cut, text, shape, crop, zoom), aspect + duration readout center, and `Create variation` · `Clone video` · `Export` right. Export is the filled primary.

**Preview** — centered 9:16 player on a neutral backdrop, with transport controls, a mono timecode readout (`00:04:12 / 00:14:00`), volume, and fullscreen. Captions render burned-in over the preview.

**Track area** — a ruler with adaptive tick density by zoom level and a draggable playhead that scrubs the preview. Tracks stack vertically, each with a 120px header (visibility toggle, lock, mute, name) and a lane:
- Video/scene track — clips render as filmstrips of extracted frames
- Audio track — a real waveform rendered to canvas, colored `--track-audio`
- Text/caption clips — `--track-text`
- Overlay clips — `--track-overlay`

Clip interactions: drag to move (snapping to playhead, clip edges, and ruler marks with a visible snap guide), drag edges to trim with a live duration tooltip, `S` to split at playhead, right-click for a context menu, double-click to open properties. Multi-select with shift or marquee.

**Properties panel** (280px, right) is contextual to selection. For a text clip: content, font family (default to a platform-native face), size, weight, color, outline color and width, alignment, position X/Y, rotation, opacity, and animation in/out. Numeric fields are drag-scrubbable — click and drag horizontally to adjust, a detail that separates real tools from toys.

Keyboard: `Space` play/pause, `←/→` step one frame, `⇧←/→` one second, `J/K/L` shuttle, `S` split, `⌘Z/⌘⇧Z` undo, `+/-` zoom timeline, `Home/End` jump.

Zoom range: whole project fits to 1 second across the full width.

### 8.6 Slideshow editor — `/app/p/[id]/slideshow`

**Left:** a vertical rail of slide thumbnails, reorderable by drag, with add/duplicate/delete per slide and a slide counter.

**Center:** a canvas showing the current slide at 9:16 with selectable, draggable, resizable layers. Selection shows eight resize handles plus a rotation handle. Smart alignment guides appear against slide center, edges, and sibling layers while dragging.

**Right:** the properties panel, sectioned via `PanelSection`:
- *Style* — a style preset select
- *Typography* — text content, text style (Filled / Outlined / Shadowed / Highlighted), size, color, outline color and width, weight (Normal / Semibold / Bold), font family, alignment
- *Layout* — position X/Y, width/height, rotation, opacity

**Top bar:** an imported-template selector (showing which template and which variation this derives from), plus `Add variation` and `Export all`.

Variations are shown as a secondary row beneath the main canvas — the same layout with different copy and assets, each editable and individually exportable.

### 8.7 Bulk editor — `/app/p/[id]/bulk`

A spreadsheet, built properly with TanStack Table + Virtual. This must feel like a real grid, not an HTML table with borders.

**Structure.** Rows are variations. Columns are the editable slots the source template exposes: Hook, Body copy, CTA, Product, Product image, Actor, Voice, Music, plus a Status column.

**Behaviors that are non-negotiable:**
- Click to select a cell, type to begin editing, `Enter` commits and moves down, `Tab` commits and moves right, `Esc` cancels
- Arrow-key navigation across the whole grid
- Range selection by drag or shift-arrow, with `⌘C` / `⌘V` supporting multi-cell clipboard including paste from an external spreadsheet (parse TSV)
- A fill handle at the bottom-right of a selection that drags to fill down
- Column resize by dragging the header divider; column reorder by dragging the header
- Row context menu: duplicate, delete, generate this row, move up/down
- Sticky header and sticky first column
- Virtualized to 1,000 rows without frame drops
- Undo/redo across all cell edits

Media cells render a thumbnail and open a library picker on edit rather than accepting text.

**Toolbar:** `Add row`, `Duplicate selected`, `Import CSV`, `Generate all` (with a count and total token cost), and `Export all`.

**Generation:** each row shows live status (Queued / Generating with a progress ring / Ready with a thumbnail / Failed with a retry). A summary bar shows aggregate progress.

### 8.8 Workspace list — `/app`

Grid of project cards: thumbnail (hover-scrubbing), name, type badge, last-modified relative time, and an overflow menu (rename, duplicate, move, delete). Filter by type, sort by recent/name. A prominent "New project" card first. Empty state points at the import flow.

---

## 9. Mock data layer

```
src/lib/api/
  client.ts        latency simulation, seeded failure injection
  projects.ts  assets.ts  generations.ts  templates.ts
  actors.ts    billing.ts  clone.ts
src/lib/fixtures/  — seeded, deterministic
src/lib/schemas/   — zod; all types derive via z.infer
```

`client.ts` exposes a `delay(min, max)` helper and a dev-only failure toggle so error states are testable. Async operations that model long work (generation, cloning, export) emit progress via an async generator or a subscription so the UI shows real incremental progress, not a fake timer.

**Fixture volume:** 12 projects, 60 assets, 24 templates, 16 actors, 40 generations, 30 bulk rows. Seeded and deterministic so screenshots are reproducible.

**Media:** ship a small set of locally-generated placeholder video and image assets — abstract gradients and motion, generated at build time or committed as small files. **Do not scrape real social media content, and do not use images of real people.**

---

## 10. State

- **Zustand** per editor surface: `useTimelineStore`, `useCanvasStore`, `useSlideshowStore`, `useBulkStore`. Each owns a command-pattern undo stack. Slices, not one global store.
- **TanStack Query** for everything through `src/lib/api`. Sensible `staleTime`, optimistic updates on mutations.
- **URL is state** where it should be: active tab, selected asset, timeline playhead position, and grid filters all live in search params so a refresh restores context and links are shareable.
- Session persistence via `sessionStorage` for open tabs and unsaved editor state.

---

## 11. Accessibility

WCAG 2.1 AA, verified not assumed.

- Every screen fully operable by keyboard, including the canvas, timeline, and grid. Where a mouse gesture is the primary interaction, provide a keyboard equivalent and document it in a `?` shortcuts dialog.
- Visible focus on everything: 2px `--color-brand-500` ring, 2px offset. Never remove outlines without replacing them.
- Semantic landmarks (`header`, `nav`, `main`, `aside`), one `h1` per route, correct heading order.
- All icon-only buttons carry `aria-label`. All interactive elements meet a 44×44 touch target on coarse pointers.
- Radix handles dialog/menu focus trapping; verify it rather than trusting it.
- Live regions announce generation completion and errors.
- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI boundaries. **Check the hero specifically** — white on the cobalt sky must pass, and the illustration must not reduce contrast behind the headline.
- `prefers-reduced-motion` fully respected.

---

## 12. Copy

All UI copy is written, never placeholder. Apply these rules:

- Name things by what the user controls, not how the system works. "Reference image," not "conditioning input."
- Active voice, sentence case, no filler. Buttons say what happens: "Export video," not "Submit."
- An action keeps its name through the whole flow: a button labeled "Publish" produces a toast that says "Published."
- Errors state what went wrong and what to do next, in the interface's voice. They do not apologize and they are never vague.
- Empty states are invitations with a clear action.
- Each element does exactly one job — a label labels, an example demonstrates.

---

## 13. Definition of done

A screen is complete only when all of the following are true.

**Visual**
- [ ] Every value traces to a token. No arbitrary hex, spacing, radius, or shadow.
- [ ] Vertical rhythm is consistent within and across sections.
- [ ] Optical alignment checked on icons, numerals, and button labels.
- [ ] No default shadcn or Tailwind styling survives untouched.
- [ ] Type uses the §4.3 scale exactly, with correct tracking at each size.

**Interaction**
- [ ] Hover, active, focus-visible, disabled, and loading states on every control.
- [ ] Skeletons, not spinners, for content loading.
- [ ] Empty state present on every list, grid, timeline, and canvas.
- [ ] Error states are specific and actionable.
- [ ] Optimistic updates where a mutation's outcome is predictable.

**Motion**
- [ ] Only token durations and easings used.
- [ ] Nothing transitions `all`.
- [ ] `prefers-reduced-motion` verified by actually toggling it.

**Responsive**
- [ ] Verified at 390, 768, 1280, 1920. No horizontal scroll, no clipped content, no overlap.
- [ ] Editor surfaces degrade honestly on mobile — a clear "this needs a larger screen" state is better than a broken timeline.

**Code**
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` all clean.
- [ ] No `any`, no `@ts-ignore`.
- [ ] Components under ~200 lines; extract when longer.
- [ ] `"use client"` only where genuinely needed.
- [ ] No component imports a fixture directly.

**Performance**
- [ ] Lighthouse ≥ 95 performance and ≥ 100 accessibility on `/`.
- [ ] LCP < 2.0s, CLS < 0.05 on the marketing page.
- [ ] Timeline scrub and canvas pan hold 60fps.
- [ ] Bulk grid virtualized; no drop at 1,000 rows.

---

## 14. Build order

1. Scaffold, tokens, fonts, primitives, mock layer *(no delegation)*
2. Marketing site
3. App shell, workspace tabs, token meter, library sheet
4. Import/clone flow
5. Generation studio
6. Timeline editor
7. Slideshow editor
8. Node canvas
9. Bulk editor
10. Templates, actors, brand kit, settings
11. Integration and design critique pass

Steps 2 and 5–9 parallelize across agents. Steps 1 and 11 do not.

---

## 15. Things to get right that are easy to get wrong

- **The hero CTA.** It is the thesis of the product compressed into one control. Paste-detection, the platform badge, the focus lift, and the error handling all have to feel considered.
- **The clone loading sequence.** Most products waste this moment. It is the best storytelling opportunity in the app.
- **The `@` reference input.** A regex over a string will feel broken the first time someone backspaces. Build real tokens.
- **Drag-scrubbable number fields.** Small detail, enormous credibility.
- **Snapping in the timeline.** With visible guides and the right threshold (~6px at current zoom), it feels precise. Without it, amateurish.
- **The bulk grid's clipboard.** Pasting a column out of Google Sheets and having it just work is the feature that makes the screen believable.
- **Empty states.** They are most of what separates a demo from a product.
