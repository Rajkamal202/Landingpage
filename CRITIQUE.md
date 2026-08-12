# Phase 3 — design critique

A pass over my own build against SPEC §13, written after walking every route
and reading the screenshots rather than the source. Findings are what I found
and what I did about them; the last section is what I did **not** fix, and why.

---

## What the automated audit caught, and what it could not

The QA harness runs 293 checks and all of them pass: axe at WCAG 2.1 AA on 26
routes, four viewports each for overflow, keyboard traversal with trap
detection, `prefers-reduced-motion` by emulation, and a silent-console
assertion per route.

Worth being honest about what that does and does not prove. Every one of the
worst defects in this build **passed all four gates** — typecheck, lint,
token-lint and build — and several passed axe too:

| Defect | Caught by | Would a gate have caught it? |
|---|---|---|
| Slideshow route threw on mount and rendered an error page | loading the page | No. Radix's `SelectLabel` outside `SelectGroup` is a runtime throw. |
| Shortcut registry infinite render loop | browser console | No. Build was clean. |
| `w-36` / `w-40` emitted no CSS; filter rows collapsed | looking at the page | No — until I wrote a rule for it. |
| Studio composer covering its own results | looking at the page | No. |
| Logomark illegible at 20px | looking at it | No. |
| Loading buttons painted as disabled | looking at them | No. |

That table is the honest summary of this phase: **the gates keep the build
compiling; only looking keeps it good.**

---

## Visual

**Every value traces to a token.** Enforced, not asserted. Tailwind's palette,
spacing, shadow and type scales are deleted, so `bg-blue-500` and `p-7` do not
compile. `lint:tokens` catches raw hex, arbitrary values, `transition-all`,
emoji, timer-driven progress and unjustified inline styles.

*Found and fixed:* the enforcement had a hole. A utility naming a spacing key
that does not exist — `w-36`, `h-40` — produces **no CSS at all**, silently.
Seventeen were live, including five I had written. Now a `no-undefined-spacing`
rule fails the build on any key outside the §4.4 scale.

**Vertical rhythm.** Consistent within sections. *Found and fixed:* the
how-it-works step frames rendered ~640px tall, making one step taller than the
viewport and the section over 5,000px of scroll, and the gradient bleed spanned
the whole column instead of hugging the screenshot with 24px of padding as
§6.3 specifies.

**Optical alignment.** Icons carry a per-glyph nudge table; play triangles,
chevrons and the send glyph are corrected. Numerals are tabular everywhere they
are compared. *Found and fixed:* the logomark read as a dark smudge at 20px —
reworked to a 1:3.3 slat with a mask knockout so edges stay crisp at nav size.

*Found and fixed:* overlay clips in the timeline rendered their label twice —
once in the clip body and once as the badge that exists because a video clip's
filmstrip body carries no text of its own. The badge is now video-only.

*Found and fixed:* at 390px the "new project" button overlapped the last tab's
name. It sat inside the horizontally scrolling tab strip, so it also scrolled
away with the tabs; it now lives outside the scroll area, which fixes the
collision and is the better behaviour anyway.

**No default styling survives.** Sonner is `unstyled` with every class
replaced; React Flow ships zero default node, edge, handle or control styling,
and its attribution watermark is removed.

**Type uses the §4.3 scale exactly.** Every size is a token carrying its own
line-height, tracking and weight, so they cannot be applied separately.

---

## Interaction

**States on every control.** *Found and fixed:* loading buttons were setting
`disabled`, so the primary action of a screen took the disabled fill and left
the tab order the moment it was pressed. Loading is now busy, not disabled.

**Skeletons, not spinners.** Held throughout. The one spinner in the product
lives inside a control that is itself submitting.

**Empty states.** `EmptyState`'s prop types require a title and an action, so a
dead end cannot be rendered. Grids additionally distinguish "nothing here yet"
from "nothing matches that filter", which are different problems with different
fixes.

**Errors are specific.** `CloneError` carries a named cause and a fix; the
duplicate-invite error names the person and says what to do instead.

**Optimistic updates.** Favourite, rename, delete and reorder all apply
immediately with rollback.

---

## Motion

Only token durations and easings. Nothing transitions `all` — verified against
computed styles on every route. Reduced motion is implemented once globally,
plus `MotionConfig reducedMotion="user"`, and verified by emulating the setting
and asserting no element retains a duration over 1ms.

*Found and fixed:* my own `transition-all` test was wrong. `transition-property`
**initialises** to `all` in CSS, so testing it alone flags every element with no
transition at all. Only a non-zero duration makes it real.

---

## Responsive

108 checks pass: 26 routes × 390 / 768 / 1280 / 1920, no horizontal overflow
anywhere. The four editors degrade to one designed `SmallScreenNotice` rather
than four different apologies, and that notice now carries a landmark and an
`h1` like any other screen.

---

## Accessibility

This is where the audit earned its cost. 33 real violations, all fixed.

The significant one was systemic: **`ink-400` cannot carry readable text
anywhere in the product** — 3.13:1 on white, 2.77:1 on `ink-100` — yet SPEC
§6.5 asks for it on the pricing sub-line. §11 wins that conflict: it requires
4.5:1 and says to verify rather than assume. The token value is unchanged per
§4.2; 113 readable-text usages moved up the ramp. Disabled and placeholder text
stayed, which WCAG 1.4.3 exempts and where faintness is the correct signal.

Three follow-on findings, each measured rather than eyeballed:

- `ink-500` passes on white (4.91:1) and the page (4.62:1) but **fails on
  `ink-100`** (4.34:1) and on the `brand-50` tint (4.42:1).
- The ramp **inverts** on the `ink-950` footer: `ink-500` reads 3.99:1 and
  fails there, `ink-400` reads 6.25:1 and passes.
- `brand-500` as link text on white is **4.44:1** — just under. Links moved to
  `brand-600` (6.41:1); `brand-500` remains the focus ring and active-state
  colour, which need only 3:1 as non-text UI.

The hero was checked specifically, as §11 asks. Measuring the lightest rendered
sky pixel behind the headline: **6.84:1 at desktop, 6.49:1 at 390px.** The
cloud bank's mid band is deliberately held near 0.25 opacity for exactly this
reason while the top and bottom bands carry the illustration.

Also fixed: the workspace tab strip was `role="tablist"`, which is wrong — an
ARIA tablist controls tabpanels in the same document, and these navigate to
different routes. It is a navigation list with `aria-current`.

---

## Code

`typecheck`, `lint`, `lint:tokens` and `build` are clean. No `any`, no
`@ts-ignore`, no unjustified non-null assertions. No component imports a
fixture — enforced by ESLint, not convention.

---

## What I did not fix, and why

Being straight about the gaps rather than implying completeness:

1. **Account, password and team-role changes do not persist.** `lib/api/billing.ts`
   has readers but no `updateAccount` / `updateTeamMemberRole`. They update the
   query cache so the UI is consistent, and the screen says plainly that it goes
   no further than this device. Adding the writers is a small change to one
   module — which is the architecture working as intended.

2. **Invoices are derived, not fetched.** No invoice endpoint exists, so past
   cycles are computed from the plan price and cycle end date, isolated in one
   module documented as the seam to delete when the endpoint lands.

3. **Lighthouse — desktop passes, mobile does not.** Measured against a
   production build:

   | | Perf | A11y | Best practices | SEO | LCP | CLS |
   |---|---|---|---|---|---|---|
   | Desktop | **99** | **100** | **100** | **100** | **1.0s** | **0** |
   | Mobile | 84 | 100 | 100 | 100 | 4.6s | 0 |

   Desktop clears every §13 target (≥95 performance, 100 accessibility, LCP
   < 2.0s, CLS < 0.05). Mobile does not clear performance.

   *Fixed along the way:* the hero was authored in Motion, which writes its
   `initial` state into the server HTML — so the headline shipped at
   `opacity: 0` and did not appear until React had hydrated. Mobile LCP was
   exactly equal to time-to-interactive, because the text was waiting for
   JavaScript. The load sequence is now CSS, the hero is a server component,
   and first contentful paint went from 4.7s to **0.9s**.

   *Still open on mobile:* LCP is the hero sub-line, which cannot paint before
   its own entrance animation reaches it — SPEC §6.2's orchestrated ~900ms
   sequence and §13's LCP budget are in genuine tension on a throttled device.
   Measured directly under 4× CPU throttling and 1.6 Mbps, LCP is **1.9s**;
   Lighthouse's simulated (Lantern) model is more pessimistic and reports 4.6s.
   I am reporting both rather than picking the flattering one. The remaining
   headroom is 78 KiB of unused JavaScript, which I have not chased.

4. **60fps is engineered for, not profiled.** The timeline and canvas use
   store selectors, transform-based positioning and memoised children, and
   waveform peaks are precomputed so nothing decodes audio at runtime. I have
   not put a profiler on a scrub or a pan.

5. **The bulk grid is not proven at 1,000 rows.** It is virtualised with
   TanStack Virtual and the fixture ships 30. The clipboard round-trip is
   covered by an E2E test; the row count is not.

Items 3–5 are all measurements rather than unknowns — the work is built to meet
them, but SPEC §13 says "verified, not assumed", and I have not verified them,
so I am not going to report them as met.
