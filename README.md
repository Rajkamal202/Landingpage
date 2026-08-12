# Vireo

A browser studio for producing short-form vertical video ads at volume.
Frontend only — every screen runs against a typed mock data layer.

Built to `SPEC.md`. The build plan is in `PLAN.md`, the judgement calls in
`DECISIONS.md`, and the design critique against SPEC §13 in `CRITIQUE.md`.

---

## Run it

```bash
pnpm install     # already done if you cloned with node_modules
pnpm dev         # http://localhost:3000
```

That is the whole setup. No environment variables, no database, no API keys,
no build step to run first. The fixtures and the placeholder media are
committed, so a fresh clone renders every screen on first load.

If port 3000 is busy: `pnpm dev -p 3111`.

---

## Where to look first

| Route | What to try |
|---|---|
| `/` | Paste `https://www.tiktok.com/@glowlab.co/video/7318842095512` into the hero — a platform badge appears and it takes you into the clone flow. Paste `nonsense` to see the error state. |
| `/app/import` | The clone sequence. Six substeps check off and scene markers draw onto the filmstrip as they are detected. ~4.5s. |
| `/app/p/proj-serum-hooks/studio` | Type a prompt, use `@` to reference a library asset, press the circular submit. Placeholder tiles appear immediately and fill in. |
| `/app/p/proj-serum-hooks/timeline` | Drag a clip, drag its edges to trim, press `S` to split at the playhead. Numeric fields in the right panel are drag-scrubbable. |
| `/app/p/proj-retinol-graph/canvas` | Drag between ports. Incompatible types are rejected with a shake and an explanation. Double-click empty canvas for the node library. |
| `/app/p/proj-sleep-ugc/bulk` | Click a cell and just type. Paste TSV straight out of a spreadsheet. Drag the fill handle. |
| `/app/p/proj-winter-sale/slideshow` | Drag a layer — alignment guides appear against slide centre, edges and siblings. |
| `/_dev/components` | Every primitive in every state, plus a failure-injection slider. |

Press `?` on any app screen for its keyboard shortcuts. The dialog lists
whatever that screen actually registered, so it cannot drift from the code.

The editors are desktop-only by design (SPEC §13) — below 1024px they show a
designed notice rather than a broken timeline.

---

## Seeing the error states

Every failure path is reachable without editing code. Append `?chaos=0.9` to
any app route to make 90% of API calls fail, or use the slider at the bottom of
`/_dev/components`. The clone flow's failure states name a specific cause and a
fix rather than a generic message.

---

## Checks

```bash
pnpm check        # typecheck + eslint + token discipline
pnpm e2e          # 294 Playwright checks (builds first, takes ~3 min)
```

`pnpm lint:tokens` is the unusual one. Tailwind's default palette, spacing
scale, shadows and type scale are deleted in `globals.css`, so `bg-blue-500`,
`shadow-md` and `p-7` do not compile at all. The script catches what the
compiler cannot: raw hex, arbitrary values, `transition-all`, emoji,
timer-driven progress, unjustified inline styles, and spacing keys that are off
the scale (those emit no CSS at all, silently — it is worth having a rule for).

The E2E suite covers axe at WCAG 2.1 AA on 26 routes, four viewports each for
overflow, keyboard traversal with focus-trap detection, `prefers-reduced-motion`
by emulation, a silent-console assertion per route, and the critical flows.

---

## Regenerating the media

`public/media` is committed, so you never need this. If you want to change it:

```bash
pnpm gen:media    # needs ffmpeg
```

It produces everything procedurally from a fixed seed — abstract 9:16 loops
with sprite sheets for hover-scrub, audio beds with precomputed waveform peaks,
and abstract stills. Nothing is scraped and there are no images of real people.

---

## Swapping in a real backend

Every data access goes through `src/lib/api/*`. Each module exports typed async
functions that currently resolve from fixtures with realistic latency. No
component imports a fixture — ESLint blocks it — so replacing the mock is an
edit to those modules and nothing else.

Long operations (cloning, generation, export) already emit real incremental
progress through async generators rather than fake timers, so a real
implementation slots into the same shape.
