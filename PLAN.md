# Vireo — Build Plan

**Plan v2** (v1 written, critiqued against SPEC §13, revised — audit trail in §12)
Author: lead frontend / design.

**Status: Phase 1 complete.** The gate passes — `pnpm typecheck`, `pnpm lint`,
`pnpm lint:tokens` and `pnpm build` are all clean, `/_dev/components` renders
every primitive in every state, the browser console is silent on every route,
and there is no horizontal overflow at 390 / 768 / 1280 / 1920. Everything under
`components/ui`, `lib/` and the app shell is now **frozen** for Phase 2.
Deviations and judgement calls are recorded in `DECISIONS.md`.

---

## 0. The three decisions this plan makes up front

Everything else follows from these.

**A. The token system is enforced by the compiler, not by discipline.**
Tailwind v4's default palette, default spacing scale, default shadows, and default type scale are *deleted* (`--color-*: initial`, etc.). `text-gray-500`, `bg-blue-500`, `shadow-md`, `text-sm`, and `p-7` do not compile. There is no "remember not to use the default" — the default is gone. A `pnpm lint:tokens` grep pass catches the remaining escape hatch (arbitrary `[...]` values and raw hex) and fails CI.

**B. Phase 1 ships every cross-agent seam.**
Six agents working in parallel invent duplicates at exactly the points where their work touches: the `@`-mention input (STUDIO + CANVAS), drag-scrubbable numbers (TIMELINE + SLIDESHOW + CANVAS), the undo command stack (four stores), the drag payload format (library → four surfaces), the editor document schemas (four stores), and the app shell every app route mounts into. All of it is Phase 1, mine, frozen before any agent starts. This is a deliberate expansion of Phase 1 beyond your brief — see §12, finding C1, for the argument and the one thing I need you to approve.

**C. Directory ownership is exclusive; no two agents ever open the same file.**
Single working tree, no worktrees (merging six worktrees costs more than it saves at this granularity). Route files that mount agent-owned components are pre-created by me in Phase 1 as thin wrappers, so agents never edit shared routing.

---

## 1. Stack lock

| Concern | Package | Range | Note |
|---|---|---|---|
| Framework | `next` | ^15 | App Router, Turbopack dev |
| React | `react` / `react-dom` | ^19 | |
| Language | `typescript` | ^5.6 | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes` |
| Styling | `tailwindcss` + `@tailwindcss/postcss` | ^4 | CSS-first `@theme`, zero JS config |
| Primitives | `@radix-ui/react-*` | latest | individually installed, never a kitchen-sink meta-package |
| Motion | `motion` | ^12 | `motion/react`; this is framer-motion's current package name |
| Client state | `zustand` | ^5 | one store per editor surface, sliced |
| Server state | `@tanstack/react-query` | ^5 | |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | ^7 / ^4 / ^5 | zod is the source of truth; types via `z.infer` |
| Graph | `@xyflow/react` | ^12 | fully custom node/edge renderers |
| Virtual | `@tanstack/react-virtual` | ^3 | |
| Table | `@tanstack/react-table` | ^8 | |
| Icons | `lucide-react` | latest | behind our `<Icon>` wrapper |
| Toast | `sonner` | ^2 | fully restyled, no default look survives |
| Command palette | `cmdk` | ^1 | node library + ⌘K |
| Fonts | `geist` | latest | woff2 **vendored** into `src/app/fonts/`, loaded with `next/font/local` — package used as a delivery mechanism only, zero runtime dependency |
| Test | `vitest`, `@testing-library/react`, `@playwright/test`, `@axe-core/playwright` | latest | |
| Tooling | `pnpm`, `eslint` flat, `prettier` | | |

Verified available on this machine: Node 22.22, pnpm 11.18, ffmpeg 8.1.2, git, Chrome.

**Not installed, ever:** MUI, Chakra, Ant, Mantine, DaisyUI, shadcn CLI. Radix is consumed raw and wrapped by us.

---

## 2. Repo layout & ownership

Owner column is the Phase 2 agent with exclusive write access. `—` means Phase 1, mine, **frozen** at Phase 2 start.

```
src/
  app/
    (marketing)/                     MARKETING   layout + page + pricing/login/signup
      features/[slug]/  solutions/[slug]/  industries/[slug]/
    app/                             —           shell layout, top bar, tabs, route stubs
      page.tsx                       STUDIO      workspace list
      import/                        STUDIO
      p/[id]/studio/                 STUDIO
      p/[id]/canvas/                 CANVAS
      p/[id]/timeline/               TIMELINE
      p/[id]/slideshow/              SLIDESHOW
      p/[id]/bulk/                   BULK
      library/  templates/  actors/  brand/  settings/{account,billing,team}/   STUDIO
    _dev/components/                 —           primitive gallery, excluded from prod
    globals.css  layout.tsx  fonts/  —
  components/
    ui/                              —           §5 primitives + composites (FROZEN)
    icon.tsx  icons.ts               —           Icon wrapper + curated set (FROZEN)
    brand/logomark.tsx               —           inline SVG mark + wordmark (FROZEN)
    app-shell/                       —           top bar, workspace tabs, token meter mount,
                                                 library sheet mount, small-screen notice (FROZEN)
    marketing/                       MARKETING   sky, section heading, gradient frames, …
    studio/                          STUDIO
    timeline/                        TIMELINE
    canvas/                          CANVAS
    slideshow/                       SLIDESHOW
    bulk/                            BULK
  lib/
    api/          client.ts projects.ts assets.ts generations.ts templates.ts
                  actors.ts billing.ts clone.ts keys.ts          —  (FROZEN)
    schemas/      entity + document schemas                      —  (FROZEN)
    fixtures/     seeded, deterministic                          —  (FROZEN)
    stores/       command-stack.ts, persist.ts                   —  base only (FROZEN)
                  timeline.ts / canvas.ts / slideshow.ts / bulk.ts  → owned by each agent
    motion/       tokens.ts, variants.ts, use-reduced-motion.ts   —  (FROZEN)
    dnd/          payload.ts (typed dataTransfer contract)        —  (FROZEN)
    hooks/        use-search-param-state, use-hotkeys, use-drag-scrub,
                  use-media-query, use-shortcut-registry           —  (FROZEN)
    format.ts  cn.ts  seeded-random.ts                            —  (FROZEN)
  content/landing/                   MARKETING   8 typed entries
public/media/                        —           generated by scripts/gen-media.mjs
scripts/gen-media.mjs                —
e2e/                                 QA
```

**Rule handed to every agent verbatim:** *You may create and edit files only under your owned paths. Everything under `components/ui`, `lib/`, and `app/app/layout.tsx` is frozen — if you need a change there, stop and report it. Do not create a local copy of a shared primitive.*

---

## 3. Design tokens — `src/app/globals.css`

This is the real file, not a sketch. Phase 1 ships it verbatim.

```css
@import "tailwindcss";

/* ─────────────────────────────────────────────────────────────
   Namespace resets. Tailwind's defaults are deleted so that a
   stray `text-gray-500`, `bg-blue-500`, `shadow-md`, `text-sm`,
   or `p-7` is a BUILD ERROR, not a code review conversation.
   ───────────────────────────────────────────────────────────── */
@theme {
  --color-*: initial;
  --spacing-*: initial;
  --spacing: initial;      /* kills the dynamic p-1…p-96 scale */
  --shadow-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --font-*: initial;
  --ease-*: initial;
  --blur-*: initial;

  /* ── Keywords ────────────────────────────────────────────── */
  --color-inherit: inherit;
  --color-current: currentColor;
  --color-transparent: transparent;
  --color-white: #ffffff;
  --color-black: #000000;

  /* ── Brand ───────────────────────────────────────────────── */
  --color-brand-50:  #eef3ff;
  --color-brand-100: #d9e3ff;
  --color-brand-200: #b8ccff;
  --color-brand-400: #6e93f7;
  --color-brand-500: #3d6ff0;   /* primary — links, active, focus */
  --color-brand-600: #2b55cc;   /* hover */
  --color-brand-700: #1f3f9e;
  --color-brand-900: #14285f;

  /* ── Hero illustration (marketing only) ──────────────────── */
  --color-sky-deep:    #2b5be0;
  --color-sky-mid:     #4277f0;
  --color-cloud-cream: #f5efe6;
  --color-cloud-rose:  #f0d5d8;
  --color-streak:      #c24bc9;

  /* ── Neutrals — slightly cool, never pure gray ───────────── */
  --color-ink-950: #0b0c0e;
  --color-ink-900: #16181c;
  --color-ink-700: #3a3f47;
  --color-ink-500: #6b717c;
  --color-ink-400: #8c929c;
  --color-ink-300: #c3c8d0;
  --color-ink-200: #e1e4e9;
  --color-ink-100: #eff1f4;
  --color-ink-50:  #f7f8fa;

  /* ── Semantic ────────────────────────────────────────────── */
  --color-success: #17916b;
  --color-warning: #b87514;
  --color-danger:  #d0342c;
  --color-info:    var(--color-brand-500);

  /* Four surface aliases only. Text and borders address the ink
     ramp directly (`text-ink-500`, `border-ink-200`) — a second
     full vocabulary of aliases is how design systems drift. */
  --color-page:           var(--color-ink-50);
  --color-surface:        var(--color-white);
  --color-surface-sunken: var(--color-ink-100);
  --color-focus:          var(--color-brand-500);

  /* ── Editor track accents ────────────────────────────────── */
  --color-track-video:   #3d6ff0;
  --color-track-audio:   #17916b;
  --color-track-text:    #8b5cf6;
  --color-track-overlay: #e0812b;

  /* ── Typography ──────────────────────────────────────────── */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, "SF Mono", monospace;

  /* rem so browser text-resize works (WCAG 1.4.4); px comments
     are the spec §4.3 values at a 16px root. */
  --text-display-xl: 4.25rem;              /* 68 / 72 */
  --text-display-xl--line-height: 4.5rem;
  --text-display-xl--letter-spacing: -0.03em;
  --text-display-xl--font-weight: 500;

  --text-display-lg: 3rem;                 /* 48 / 54 */
  --text-display-lg--line-height: 3.375rem;
  --text-display-lg--letter-spacing: -0.025em;
  --text-display-lg--font-weight: 500;

  --text-display-md: 2.125rem;             /* 34 / 40 */
  --text-display-md--line-height: 2.5rem;
  --text-display-md--letter-spacing: -0.02em;
  --text-display-md--font-weight: 500;

  --text-title-lg: 1.5rem;                 /* 24 / 32 */
  --text-title-lg--line-height: 2rem;
  --text-title-lg--letter-spacing: -0.015em;
  --text-title-lg--font-weight: 500;

  --text-title-md: 1.125rem;               /* 18 / 26 */
  --text-title-md--line-height: 1.625rem;
  --text-title-md--letter-spacing: -0.01em;
  --text-title-md--font-weight: 500;

  --text-body-lg: 1.0625rem;               /* 17 / 28 */
  --text-body-lg--line-height: 1.75rem;
  --text-body-lg--letter-spacing: -0.005em;
  --text-body-lg--font-weight: 400;

  --text-body-md: 0.9375rem;               /* 15 / 24 */
  --text-body-md--line-height: 1.5rem;
  --text-body-md--font-weight: 400;

  --text-body-sm: 0.84375rem;              /* 13.5 / 20 */
  --text-body-sm--line-height: 1.25rem;
  --text-body-sm--font-weight: 400;

  --text-label: 0.78125rem;                /* 12.5 / 16 */
  --text-label--line-height: 1rem;
  --text-label--letter-spacing: 0.01em;
  --text-label--font-weight: 500;

  /* Hero headline, mobile-first: 34/38 → md 44/48 → lg 68/72 */
  --text-hero-sm: 2.125rem;
  --text-hero-sm--line-height: 2.375rem;
  --text-hero-sm--letter-spacing: -0.02em;
  --text-hero-sm--font-weight: 500;
  --text-hero-md: 2.75rem;
  --text-hero-md--line-height: 3rem;
  --text-hero-md--letter-spacing: -0.025em;
  --text-hero-md--font-weight: 500;
  --text-hero-lg: 4.25rem;
  --text-hero-lg--line-height: 4.5rem;
  --text-hero-lg--letter-spacing: -0.03em;
  --text-hero-lg--font-weight: 500;

  /* ── Spacing — SPEC §4.4 allowed steps ONLY ──────────────── */
  --spacing-px:  1px;
  --spacing-0:   0px;
  --spacing-0.5: 2px;   /* optical nudges, focus offsets */
  --spacing-1:   4px;
  --spacing-2:   8px;
  --spacing-3:   12px;
  --spacing-4:   16px;
  --spacing-5:   20px;
  --spacing-6:   24px;
  --spacing-8:   32px;
  --spacing-10:  40px;
  --spacing-12:  48px;
  --spacing-16:  64px;
  --spacing-20:  80px;
  --spacing-24:  96px;
  --spacing-32:  128px;
  /* 7, 9, 11, 14 … deliberately absent. p-7 will not compile. */

  /* Named chrome dimensions — also from --spacing-*, so they work
     with every w-/h-/p-/gap- utility with zero arbitrary values. */
  --spacing-topbar:     56px;
  --spacing-panel:      280px;
  --spacing-sheet:      420px;
  --spacing-track-head: 120px;
  --spacing-rail:       96px;

  /* ── Containers ──────────────────────────────────────────── */
  --container-marketing: 75rem;    /* 1200px */
  --container-prose:     68ch;     /* marketing measure, §4.3 */

  /* ── Radii ───────────────────────────────────────────────── */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-pill: 999px;

  /* ── Elevation — four levels, two-layer, never Tailwind's ── */
  --shadow-elev-1: 0 1px 2px rgb(11 12 14 / 0.04), 0 1px 3px rgb(11 12 14 / 0.06);
  --shadow-elev-2: 0 2px 4px rgb(11 12 14 / 0.04), 0 6px 16px rgb(11 12 14 / 0.08);
  --shadow-elev-3: 0 4px 8px rgb(11 12 14 / 0.05), 0 16px 32px rgb(11 12 14 / 0.10);
  --shadow-elev-4: 0 8px 16px rgb(11 12 14 / 0.06), 0 32px 64px rgb(11 12 14 / 0.14);

  /* ── Motion ──────────────────────────────────────────────── */
  --ease-out:    cubic-bezier(0.32, 0.72, 0, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-linear: linear;

  --dur-instant: 90ms;
  --dur-fast:    160ms;
  --dur-base:    240ms;
  --dur-slow:    420ms;

  /* Spring for drag release — consumed by Motion, not CSS.
     spec `spring(1, 90, 14, 0)` → mass 1, stiffness 90,
     damping 14, velocity 0. Mirrored in lib/motion/tokens.ts. */
}

/* ─────────────────────────────────────────────────────────────
   Layering. Radix portals to body; these keep the stack honest.
   ───────────────────────────────────────────────────────────── */
:root {
  --z-base: 0;
  --z-sticky: 10;
  --z-nav: 20;
  --z-overlay: 30;
  --z-dropdown: 40;
  --z-dialog: 50;
  --z-toast: 60;
}

@layer base {
  html { -webkit-text-size-adjust: 100%; }

  body {
    background-color: var(--color-page);
    color: var(--color-ink-950);
    font-family: var(--font-sans);
    font-size: var(--text-body-md);
    line-height: var(--text-body-md--line-height);
    font-feature-settings: "cv11" 1;      /* Geist: single-storey a-alt off, disambiguated 1/l */
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* Tabular numerals wherever numbers are compared to numbers. */
  .font-mono, [data-numeric] { font-variant-numeric: tabular-nums; }

  /* §11 — visible focus on everything, one ring, never removed. */
  :focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
  :focus:not(:focus-visible) { outline: none; }

  ::selection { background: var(--color-brand-100); color: var(--color-ink-950); }

  /* §4.6 — implemented ONCE, globally. Motion components add a
     useReducedMotion() guard on top for layout/transform work. */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 1ms !important;
      animation-delay: 0ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 1ms !important;
      transition-delay: 0ms !important;
      scroll-behavior: auto !important;
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   Composed utilities. Each exists to make the correct thing the
   shortest thing to type.
   ───────────────────────────────────────────────────────────── */

/* Never `transition-all`. This is the only transition shorthand
   in the codebase; compose duration with `duration-(--dur-fast)`. */
@utility transition-ui {
  transition-property: color, background-color, border-color, box-shadow, transform, opacity;
  transition-timing-function: var(--ease-out);
  transition-duration: var(--dur-instant);
}

/* §4.3 caption: size + tracking + uppercase are one decision. */
@utility eyebrow {
  font-size: 0.71875rem;          /* 11.5 */
  line-height: 1rem;              /* 16 */
  letter-spacing: 0.04em;
  font-weight: 600;
  text-transform: uppercase;
}

/* §4.3 mono-sm: family + size are one decision. */
@utility mono-sm {
  font-family: var(--font-mono);
  font-size: 0.78125rem;          /* 12.5 */
  line-height: 1rem;              /* 16 */
  font-weight: 450;
  font-variant-numeric: tabular-nums;
}

/* §4.5 floating chrome: nav pill, FloatingToolbar, popovers over media. */
@utility glass {
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
}

/* §11 — 44×44 minimum target on coarse pointers, without
   inflating dense desktop toolbars. */
@utility touch-target {
  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
  }
}

/* Explicit ring for elements that suppress the global outline
   (segmented controls, cells, canvas nodes). */
@utility ring-focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

**Enforcement, three layers:**
1. Compiler — the resets above.
2. `pnpm lint:tokens` — a node script that greps `src/**/*.{ts,tsx,css}` for `#[0-9a-f]{3,8}` outside `globals.css`/`gen-media`/illustration SVGs, for `-\[` arbitrary utilities, and for `transition-all` / `shadow-[`. Non-zero exit fails CI. Allowlist file with a required justification comment per entry.
3. ESLint — `no-restricted-syntax` against `style={{}}` literals except where a computed value is unavoidable (timeline clip offsets, canvas transforms, waveform sizing), which must carry a `// dynamic:` comment.

---

## 4. Typography & font delivery

`geist` npm package installed once; the two variable `.woff2` files copied to `src/app/fonts/` and committed. Loaded via `next/font/local` with `display: "swap"`, `adjustFontFallback` metrics to hold CLS at 0, and CSS variables `--font-geist-sans` / `--font-geist-mono` bound on `<html>`. No network font request, no dependency on the package at runtime.

Type rules encoded into components so they cannot drift:
- `<Heading level={1|2|3} size="display-lg">` picks the semantic tag and the scale independently — one `h1` per route, correct order, without forcing a size.
- `<Prose>` clamps to `--container-prose` (68ch).
- All numeric readouts (timecode, token counts, dimensions, node ports, cell values) go through `<Num>` → `mono-sm` + `tabular-nums`. No numeric comparison is ever set in the sans face.

---

## 5. Component inventory

Every one ships with: resting / hover / active / focus-visible / disabled / loading (where async), `aria-*`, keyboard operation, and a live entry in `/_dev/components`. **Phase 1, mine, all of it.**

### 5.1 Primitives (SPEC §5)

| Component | Radix base | Key API | Notes that keep it out of "fine" territory |
|---|---|---|---|
| `Button` | — | `variant: primary\|secondary\|ghost\|danger\|pill`, `size: sm\|md\|lg`, `loading`, `iconStart`, `iconEnd` | Loading swaps label for a spinner **at fixed width** — no reflow. Icon-only forbidden (use `IconButton`). Active state is a 1px translate + shadow drop, not just a darker fill. |
| `IconButton` | — | `label` **required**, `size`, `variant` | `aria-label` non-optional at the type level. `touch-target`. Optical centering via per-icon nudge map in `icons.ts`. |
| `Input` | — | `invalid`, `iconStart`, `suffix`, `size` | Error message space **reserved** — no layout shift on validation. `aria-invalid` + `aria-describedby` wired. |
| `Textarea` | — | `autoGrow` | Grows to `maxRows`, then scrolls. Height animates over `--dur-instant`. |
| `Select` | Select | `options`, `renderOption` | Custom trigger, checkmark on selected, typeahead, no native `<select>`. |
| `Combobox` | Popover + cmdk | `async` search | Empty/no-result state with a real message. |
| `Checkbox` / `Radio` | Checkbox / RadioGroup | | Indeterminate state on Checkbox. Custom check path animates draw. |
| `Switch` | Switch | | Thumb springs; track color crossfades over `--dur-fast`. |
| `Slider` | Slider | `showValue`, `formatValue` | Value bubble on drag; keyboard step + shift-step. |
| `NumberStepper` | — | `min`, `max`, `step` | Hold-to-repeat with acceleration. |
| `SegmentedControl` | ToggleGroup | `items`, `badge` slot | Filled pill moves with a shared `layoutId` — the fill animates between segments, never redraws. |
| `Tabs` | Tabs | `variant: line\|pill` | Underline travels via `layoutId`. |
| `Tooltip` | Tooltip | `shortcut` slot | 400ms open delay, 0ms within group. Renders `KeyboardShortcut` inline. Never the only carrier of critical info. |
| `Popover` / `DropdownMenu` / `ContextMenu` | respective | | Shared surface style (`--radius-lg`, `--shadow-elev-3`, `--color-ink-200` hairline), shared enter/exit (scale 0.97 → 1, 4px rise, `--dur-fast`), origin-aware. |
| `Dialog` | Dialog | `size`, `dismissible` | Overlay fades; panel scales from 0.98 + 8px rise. Body scroll locked. Focus trap **verified in E2E**, not assumed. |
| `Sheet` | Dialog | `side`, `width` | Right side, `--spacing-sheet` (420px), full-height on mobile. |
| `Toast` | sonner | `variant`, `action` | Fully restyled: our radius, elevation, type. Success/error/loading. Promise-driven. |
| `Skeleton` | — | `shimmer` | One shimmer keyframe, one direction, one speed, globally. Reduced-motion → static fill. |
| `Progress` | Progress | `indeterminate` | Linear. `ProgressRing` is separate (§5.2). |
| `Badge` | — | `tone`, `size` | |
| `Avatar` | Avatar | | Deterministic initials fallback from the seeded palette. |
| `EmptyState` | — | `icon\|illustration`, `title`, `body`, `action` | **Mandatory on every list/grid/canvas/timeline.** Prop types force a `title` + one `action`. |
| `ScrollArea` | ScrollArea | `fadeEdges` | Overflow fade masks — used by workspace tabs, library, rails. |

### 5.2 Composites (SPEC §5)

`TokenMeter` · `AspectRatioPicker` · `DurationPicker` · `ModelPicker` · `AssetThumb` · `UploadDropzone` · `ColorSwatch` · `PropertyRow` · `PanelSection` · `Toolbar` · `FloatingToolbar` · `KeyboardShortcut`

- **`TokenMeter`** — mono numeral + 40px bar + balance; hover popover breaks down usage by generation type with a "Top up" action; `<10%` → warning, `0` → danger and a `useTokensSufficient()` hook that every generate button consumes for its disabled state + explanatory tooltip.
- **`AssetThumb`** — hover-scrub driven by pointer X across a committed sprite sheet (deterministic, 60fps, no video decode), swapping to `<video>` on sustained hover for real playback. Hover raises `elev-1 → elev-2`. Action cluster + type badge slots.
- **`PropertyRow`** — the 280px panel grid: label column fixed, control column fluid, 12px row rhythm. Every editor's right panel is built only from these, which is what makes four different panels feel like one product.

### 5.3 Cross-agent components — the anti-duplication set

These exist because two or more Phase 2 agents need them. Shipping them in Phase 1 is the whole reason the parallel phase works.

| Component / module | Consumers | Why it must be shared |
|---|---|---|
| `MentionInput` | STUDIO composer, CANVAS Prompt node | SPEC §15: real tokens, not regex. One implementation — a controlled token model (`Array<TextRun \| AssetRef>`) with backspace-deletes-chip, caret math, and an async combobox. Two of these would diverge immediately. |
| `DragNumberInput` | TIMELINE properties, SLIDESHOW layout, CANVAS node props | SPEC §15 "enormous credibility". Pointer-lock horizontal scrub, shift = fine, alt = coarse, click-to-type, `ew-resize` cursor. |
| `ProgressRing` | STUDIO tiles, BULK rows, IMPORT | Same arc, same cap, same easing everywhere. |
| `StatusPill` | BULK, STUDIO, workspace list | Queued / Generating / Ready / Failed — one vocabulary, one color mapping. |
| `Filmstrip` | IMPORT result, TIMELINE clips | Frame-strip rendering from a sprite sheet. |
| `Waveform` | TIMELINE audio track, ACTORS voice sample | Canvas-rendered, DPR-aware, memoized peaks. |
| `AssetPickerDialog` | STUDIO, SLIDESHOW, BULK media cells, CANVAS source node | One picker, one search/filter/sort behavior. |
| `Lightbox` | STUDIO grid, LIBRARY | Arrow-key prev/next, focus restore. |
| `CommandPalette` | CANVAS node library, global ⌘K | cmdk, our surface style. |
| `ShortcutsDialog` + `useShortcutRegistry` | every editor | SPEC §11 requires a `?` dialog documenting keyboard equivalents. Editors *register* their shortcuts; the dialog renders whatever is registered. Without this each agent writes its own `?` dialog and they disagree. |
| `SmallScreenNotice` | TIMELINE, CANVAS, SLIDESHOW, BULK | SPEC §13: "degrade honestly on mobile". One honest, well-designed screen with the project's name, a thumbnail, what's editable on mobile, and a link back — not four different apologies. |
| `VirtualGrid` | LIBRARY, TEMPLATES, ACTORS | TanStack Virtual wrapper with the right overscan and a resize observer. |
| `lib/dnd/payload.ts` | LIBRARY → composer / start-frame / canvas / slideshow / bulk | Typed `dataTransfer` contract (`application/x-vireo-asset` + JSON payload, plus a pointer-based fallback used by the canvas). Drag sources and drop targets are written by *different agents* — this is the contract between them. |
| `lib/stores/command-stack.ts` | 4 editor stores | Command-pattern undo: `{ label, do(), undo() }`, coalescing window for scrub/drag, 50-entry floor, `⌘Z`/`⌘⇧Z` binding helper. Four hand-rolled undo stacks is four different bugs. |
| `lib/hooks/use-search-param-state.ts` | all | SPEC §10 "URL is state" — typed, debounced, `replace` vs `push` aware. |
| `lib/motion/variants.ts` | all | `rise`, `staggerChildren(40)`, `popover`, `dialog`, `springRelease` — the §4.6 rules as objects so nobody retypes a duration. |

### 5.4 Icons & mark

- `<Icon name size={16|20|24} />` — maps size → stroke width (1.5 / 1.5 / 2) so mixing is impossible, and applies a per-glyph optical nudge from a small table (`play`, `chevron-right`, `send` sit visually off-center in a square box).
- `icons.ts` — a curated named export map. Agents import from here, not from `lucide-react`, so the set stays coherent and tree-shaken.
- `<Logomark />` — inline SVG, `currentColor`, three overlapping vertical rounded slats of decreasing height (stacked clips / stylized leaf), drawn on a 24-unit grid so it snaps clean at 20px and stays smooth at 320px. `<Wordmark />` Geist Medium, `-0.02em`, mark at 1.15× cap height, 8px optical gap. `<Logo />` composes both.
- No emoji anywhere. `lint:tokens` greps for emoji codepoints in `src/**/*.tsx`.

---

## 6. Route map

| Route | Render | `h1` | Data | Owner |
|---|---|---|---|---|
| `/` | RSC shell + client islands (hero, nav, comparison, pricing, FAQ) | "Your AI short-form ads editor at scale" | static | MARKETING |
| `/pricing` | RSC + client toggle | "Pricing" | `billing.getPlans()` | MARKETING |
| `/login`, `/signup` | client form | "Log in" / "Create your account" | mock session → `/app` | MARKETING |
| `/features/[slug]` ×3 | RSC, `generateStaticParams` | entry title | `content/landing` | MARKETING |
| `/solutions/[slug]` ×3 | RSC | entry title | " | MARKETING |
| `/industries/[slug]` ×2 | RSC | entry title | " | MARKETING |
| `/app` | client | "Projects" | `projects.list()` | STUDIO |
| `/app/import` | client | "Clone a video" | `clone.*` | STUDIO |
| `/app/p/[id]/studio` | client | project name | `generations.*` | STUDIO |
| `/app/p/[id]/canvas` | client | project name | `projects.getDocument` | CANVAS |
| `/app/p/[id]/timeline` | client | project name | " | TIMELINE |
| `/app/p/[id]/slideshow` | client | project name | " | SLIDESHOW |
| `/app/p/[id]/bulk` | client | project name | " | BULK |
| `/app/library` | client | "Library" | `assets.list()` | STUDIO |
| `/app/templates` | client | "Templates" | `templates.list()` | STUDIO |
| `/app/actors` | client | "AI actors" | `actors.list()` | STUDIO |
| `/app/brand` | client | "Brand kit" | `assets.getBrandKit()` | STUDIO |
| `/app/settings/{account,billing,team}` | client | section name | `billing.*` | STUDIO |
| `/_dev/components` | client | "Components" | — | — (Phase 1) |
| `not-found`, `error`, `loading` | — | — | — | — (Phase 1) |

`/_dev` is excluded from production via a `NEXT_PUBLIC_DEV_ROUTES` guard + `generateStaticParams` returning empty in prod builds.

**Eight landing pages, real copy, no filler:** `features/link-cloning`, `features/ai-actors`, `features/bulk-variations`; `solutions/dtc-brands`, `solutions/agencies`, `solutions/app-marketers`; `industries/beauty-and-skincare`, `industries/fitness-and-supplements`. MARKETING writes genuinely distinct body copy per entry or drops the slug — §6.8 is explicit and I will hold the line on it in Phase 3.

**URL-as-state (§10):** `?tab=` workspace tab, `?asset=` lightbox selection, `?t=` playhead seconds, `?filter=&sort=&q=` grids, `?node=` canvas selection, `?row=&col=` bulk cursor, `?billing=yearly` pricing.

---

## 7. Data layer

### 7.1 Schemas — `src/lib/schemas/` (zod is the source of truth, all types via `z.infer`)

Entities: `User`, `Project`, `Asset`, `Generation`, `Template`, `Actor`, `BrandKit`, `Product`, `Plan`, `TokenBalance`, `UsageBreakdown`, `CloneJob`, `CloneResult`, `Scene`, `TextLayer`.

**Document schemas — the reason four agents can work in parallel:**
- `TimelineDoc` — `tracks[] { id, kind: video|audio|text|overlay, locked, muted, visible, clips[] { id, start, duration, trimIn, trimOut, ...kindProps } }`
- `CanvasDoc` — `nodes[] { id, type, position, data }` (discriminated union over the 7 node types), `edges[] { source, sourceHandle, target, targetHandle }`, port type table
- `SlideshowDoc` — `slides[] { id, layers[] { id, kind: text|image|shape, transform, style } }`, `variations[]`
- `BulkDoc` — `columns[] { id, key, kind: text|media|actor|voice|music|status, width }`, `rows[] { id, cells, status }`

Each agent implements the *behavior*; none invents the *shape*. Fixtures ship valid documents for all four so every editor opens with real content on first paint.

### 7.2 API — `src/lib/api/`

`client.ts`
- `delay(min, max)` — seeded jitter, deterministic under a fixed seed for reproducible screenshots.
- `maybeFail(rate)` — dev-only injectable failure, toggled from a `/_dev` control and a `?chaos=` param, so every error state is reachable without editing code.
- `stream<T>()` — async-generator progress channel. Cloning, generation, and export emit *real* incremental progress (substep, percent, partial payload). No `setInterval` fake bars anywhere. `useProgressStream()` adapts a generator to React state with cancel-on-unmount.
- `keys.ts` — the TanStack Query key registry, so six agents don't collide on `['assets']`.

Modules: `projects.ts` (list/get/create/rename/duplicate/delete/reorderTabs, `getDocument`/`saveDocument`), `assets.ts`, `generations.ts` (`create` → stream), `templates.ts`, `actors.ts`, `billing.ts` (plans, balance, usage, mock checkout), `clone.ts` (`analyze()` → 6-substep stream, ~4.5s, with a seeded failure path for the private/deleted case).

**No component imports a fixture.** Enforced by an ESLint `no-restricted-imports` rule: `src/lib/fixtures/*` is importable only from `src/lib/api/*`.

### 7.3 Fixtures — seeded, deterministic

`mulberry32(seed)` — 12 projects, 60 assets, 24 templates, 16 actors, 40 generations, 30 bulk rows. All copy written, not generated: real project names ("Hydrating serum — hook tests"), real prompts, real template names. Relative timestamps computed from a fixed epoch so "2 hours ago" is stable across runs.

### 7.4 Media — `scripts/gen-media.mjs`

ffmpeg 8.1.2 is present. The script generates, deterministically from a seed, into `public/media/`:
- 24 abstract 9:16 loops (2–4s, ~40–80KB each, H.264 + a poster WebP) — flowing gradient fields and drifting geometry, no people, nothing scraped;
- a 12-frame sprite sheet per clip for hover-scrub (cheap, exact, 60fps);
- 16 short audio beds for the waveform track + a precomputed peaks JSON per bed (so `Waveform` never decodes audio at runtime);
- brand/product still images for the brand kit and bulk media cells.

Output is committed (small, deterministic, no build-time dependency on ffmpeg for CI). `AssetThumb` degrades: sprite scrub → poster → skeleton, never a broken frame.

---

## 8. State

| Store | Owner | Contents |
|---|---|---|
| `useTimelineStore` | TIMELINE | tracks, clips, selection, playhead, zoom, snapping + `CommandStack` |
| `useCanvasStore` | CANVAS | nodes, edges, selection, viewport + `CommandStack` |
| `useSlideshowStore` | SLIDESHOW | slides, layers, selection, guides, variations + `CommandStack` |
| `useBulkStore` | BULK | rows, columns, cell cursor, range selection, clipboard + `CommandStack` |
| `useWorkspaceStore` | Phase 1 | open tabs, order, active tab, library sheet state — persisted to `sessionStorage` |

Rules: slices not god stores; selectors always (no whole-store subscriptions in render paths — this is what keeps timeline scrub and canvas pan at 60fps); TanStack Query owns anything that came from `lib/api` with optimistic updates on rename/favorite/delete/reorder; `sessionStorage` rehydration is guarded to avoid hydration mismatch.

---

## 9. Motion plan

`lib/motion/tokens.ts` mirrors the CSS tokens as JS (`dur.fast = 0.16`, `ease.out = [0.32,0.72,0,1]`, `spring.release = { type:"spring", mass:1, stiffness:90, damping:14 }`). `<MotionConfig reducedMotion="user">` at the root; `useReducedMotion()` guards every layout/transform animation; the global CSS media query catches everything else.

Orchestrations that are single timelines, not scattered animations:
1. **Hero load (~900ms)** — one `Motion` sequence: sky fade → nav pill drops 8px → headline lines rise staggered 60ms → sub → CTA scale 0.98→1 → screenshot rise 24px + scale 0.96→1.
2. **Scroll reveal** — `ScrollReveal` component: 12px rise + fade, 40ms sibling stagger, `once: true` at 20% visibility. One implementation, used by every section.
3. **Comparison settle** — outer cards from wider rotation to −1.5°/+1.5°, center 0.97→1, one 420ms beat.
4. **Price roll** — per-digit vertical roll on billing toggle via layout animation.
5. **Segment fill** — `layoutId` shared element across SegmentedControl / Tabs / mode toolbar.
6. **Import sequence** — substep check-offs + scene markers drawing onto the filmstrip, driven by the real progress stream.

---

## 10. Build order & dependency graph

```
 P1  scaffold → tokens+fonts → icons/mark → primitives ─┬─→ composites ─┬─→ app shell ─┐
     schemas → fixtures → media script → api client ────┘               │              │
                                                        cross-agent set ┘              │
                                                                                       ▼
 P2  ┌─ MARKETING ──────────────────────────────────────────────────────────┐  (needs: tokens,
     ├─ STUDIO  (workspace list, import, studio, library, templates,        │   primitives,
     │           actors, brand, settings)                                   │   composites,
     ├─ TIMELINE                                                            │   api, shell,
     ├─ CANVAS                                                              │   doc schemas)
     ├─ SLIDESHOW                                                           │
     ├─ BULK                                                                │
     └─ QA ── waves after each agent reports, files issues back ────────────┘
                                                                                       ▼
 P3  integration → seam fixes → written §13 critique → fixes → screenshots → report
```

**Phase 1 gate (hard):** `pnpm typecheck && pnpm lint && pnpm lint:tokens && pnpm build` clean, `/_dev/components` renders every primitive in every state, and one throwaway screen proves the shell + api + a grid together. No agent starts before this.

**Phase 2 briefing packet** (identical for all six): SPEC.md, PLAN.md, owned paths, the frozen-primitives rule, the §13 checklist as their own definition of done, and the escalation instruction — *if you need a new shared primitive or a token that does not exist, stop and report; do not invent a local one.*

**Phase 2 interface contracts** (fixed before agents start, so seams line up):
- Every editor route renders `<EditorFrame>` from the shell: top bar slot, canvas slot, 280px right panel slot, `SmallScreenNotice` below `lg`.
- Every editor registers shortcuts through `useShortcutRegistry` and reads/writes selection to search params.
- Every drop target accepts `lib/dnd/payload.ts` types.
- Every empty surface uses `EmptyState` with written copy from §12 rules.

**QA cadence** — QA runs a wave when each agent reports, not literally continuously (agents are discrete runs). Each wave: `typecheck`, `lint`, `lint:tokens`, axe on the delivered routes, keyboard-only traversal, 390/768/1280/1920 screenshots, reduced-motion pass. Findings go back to the owning agent as a numbered issue list; unfixed items escalate to me for Phase 3.

---

## 11. Copy & content ownership

All UI strings live with their components (no i18n indirection in v1), written to §12 rules: name things by what the user controls; active voice; sentence case; buttons say what happens; an action keeps its name through its flow ("Export video" → "Exporting…" → "Video exported"); errors state cause + fix. Every `EmptyState` is an invitation with an action. **Zero lorem ipsum, zero "Feature description here" — a string that isn't written yet is a blocker, not a placeholder.**

Original identity only. No competitor name appears in code, copy, comments, fixtures, or file names — including in the clone-source examples, which use generic platform names (TikTok, Instagram, YouTube, Meta Ads) because those are the *user's* destinations named in the spec, never as a compared-against product.

The `Backed by Y Combinator` eyebrow in §6.2 is **deleted** — SPEC says ship it only if true, and I have no basis to claim it. The hero opens on the headline.

---

## 12. Self-critique of plan v1 against SPEC §13 — and what changed

I wrote v1, then read it against the Definition of Done line by line. Fourteen findings; all applied above.

**C1 — App shell was assigned to STUDIO, but five other agents mount into it.** *(resolved — approved)*
Five of six agents would have been blocked on, or guessing at, a shell owned by a peer running concurrently — and the guesses would not have matched. **Applied:** the app shell (`/app` layout, 56px top bar, workspace tabs with drag-reorder, `TokenMeter` mount, Library sheet mount, `EditorFrame`, route stubs for all 12 app routes, `SmallScreenNotice`) moves into Phase 1. STUDIO keeps everything with product substance: workspace list, import/clone, generation studio, library contents, templates, actors, brand kit, settings.

**C2 — "Every value traces to a token" was a rule, not a mechanism.** v1 defined tokens and trusted six agents to use them. **Applied:** namespace resets that delete Tailwind's palette/spacing/shadows/type scale (§3), plus `lint:tokens` in CI. Now the wrong thing does not compile.

**C3 — Spacing steps were documented but not enforced.** v1 kept Tailwind's dynamic spacing, so `p-7` (28px, not on the §4.4 list) was legal. **Applied:** `--spacing: initial` + explicit steps only.

**C4 — Undo was listed per store as a feature.** Four agents, four command stacks, four coalescing behaviors, four sets of bugs — and Phase 3 would have had to unify them. **Applied:** `command-stack.ts` in Phase 1, shared.

**C5 — `@` mention input appeared in two agents' scope.** SPEC §15 calls it out as easy to get wrong, and STUDIO and CANVAS would each have built one. **Applied:** `MentionInput`, Phase 1.

**C6 — Drag-scrub numbers appeared in three agents' scope.** Same problem. **Applied:** `DragNumberInput`, Phase 1.

**C7 — Library drag-and-drop crosses agent boundaries.** The drag source (STUDIO's library sheet) and the drop targets (canvas nodes, slideshow layers, bulk media cells, composer start frame) are written by four different agents with no shared contract. **Applied:** typed `lib/dnd/payload.ts`, Phase 1, listed as an explicit interface contract.

**C8 — Editor document shapes were undefined.** Each agent would have invented its own model and Phase 3 would have been a data migration, not a design pass. **Applied:** all four document schemas in Phase 1, with valid fixture documents so every editor opens populated.

**C9 — "Skeletons, not spinners" had one exception hiding in `Button`.** A loading button legitimately needs a spinner. **Applied:** stated the rule precisely — skeletons for *content*, inline spinner only inside a control that is itself the thing loading, and it must not change the control's width.

**C10 — "No layout shift" needed a font strategy, not a promise.** **Applied:** vendored woff2 + `next/font/local` with fallback metric adjustment; reserved space for validation messages; fixed-width loading buttons; `AssetThumb` renders at a known aspect before media resolves.

**C11 — §11 requires a `?` shortcuts dialog; four editors would have written four.** **Applied:** `useShortcutRegistry` + one `ShortcutsDialog`, Phase 1.

**C12 — "Degrade honestly on mobile" would have produced four different apologies.** **Applied:** one designed `SmallScreenNotice`, Phase 1.

**C13 — Reduced motion was scattered across components.** SPEC §4.6 says implement it once, globally. **Applied:** the global media query in `@layer base` *plus* `<MotionConfig reducedMotion="user">` *plus* `useReducedMotion()` guards — belt, braces, and a third belt, because a single missed component fails the checklist.

**C14 — Progress was going to be faked.** v1 said "progress via generator" but the import sequence and generation tiles are exactly where a `setInterval` sneaks in. **Applied:** `stream<T>()` + `useProgressStream()` in `client.ts`, and a hard rule: **no `setInterval`-driven progress bars anywhere.** QA greps for it.

**Two things I am deliberately not doing:**
- **No dark mode**, per §4.2 — but the four surface aliases exist so it's a token swap later, not a rewrite.
- **No dnd-kit.** Motion's `Reorder` handles tabs and slide rails; timeline/canvas/bulk need raw pointer math anyway. A drag library here would be a dependency that does 30% of the job.

---

## 13. Definition of done for *this plan*

Phase 3 is not finished until I can answer yes to all of §13 out loud, per route, with screenshots at four widths, plus:
- Lighthouse ≥95 performance / 100 accessibility on `/` (measured against `pnpm build && pnpm start`, not dev).
- Timeline scrub and canvas pan profiled at 60fps.
- Bulk grid at 1,000 rows, profiled.
- Every screen reached and operated with keyboard only.
- `prefers-reduced-motion` toggled at the OS level and re-walked.
- A written critique of my own build with the fixes I made and why.

---

## Approval needed

One question before Phase 1 (C1): **app shell in Phase 1 (mine) or with STUDIO as you originally briefed?** My recommendation is Phase 1 — five agents depend on it and it's the single largest source of parallel-work conflict.

Everything else in this plan I'm ready to execute as written.
