# Decisions

Where SPEC.md was ambiguous or silent, this is the call that was made and why.
Per the build rules: make the call a senior designer would make, implement it,
note it here, don't stall.

---

## Phase 1 — foundation

### D1. Tailwind's default scales are deleted, not merely unused

SPEC §13 requires every value to trace to a token. A rule that lives only in a
document is a rule six parallel agents will break. `globals.css` therefore
resets `--color-*`, `--spacing-*`, `--shadow-*`, `--text-*`, `--radius-*`,
`--font-*` and `--ease-*` to `initial` before defining ours. `bg-blue-500`,
`shadow-md`, `text-sm` and `p-7` do not compile.

**Cost:** unfamiliar to anyone expecting stock Tailwind. **Benefit:** the wrong
value is a build error rather than a review comment.

### D2. Spacing steps are exactly SPEC §4.4's list

`4 8 12 16 20 24 32 40 48 64 80 96 128`, plus `px` and `0`. 7, 9, 11, 14 and 18
are deliberately absent. Chrome dimensions that aren't spacing rhythm (56px top
bar, 280px panel, 420px sheet, 120px track header, 28/36/44px control heights)
are defined as *named* keys on the same namespace — `h-topbar`, `w-panel`,
`h-control-md` — so they compose with every utility and need no arbitrary value.

### D3. Type in rem, spacing in px

SPEC §4.3 gives px. Type is expressed in rem so browser text-resize works
(WCAG 1.4.4); spacing stays in px for layout precision. At a 16px root the
rendered values are exactly the spec's.

### D4. `caption` and `mono-sm` are composed utilities, not font-size tokens

`caption` is always uppercase and `mono-sm` is always the mono family. Neither
fits in a `--text-*` token, and splitting them into "token plus two extra
classes" invites half of them to be applied. They are `@utility eyebrow` and
`@utility mono-sm` — one class, one decision.

### D5. Hero headline breakpoints

SPEC §4.3: "drops to 44/48 at `md`, 34/38 at `sm`." Implemented mobile-first as
base 34/38 → `md:` 44/48 → `lg:` 68/72, which is the reading that produces the
stated sizes at the stated widths.

### D6. A sixth button variant: `inverse`

SPEC §5 lists five. The Pro pricing card and the Enterprise slab both need a
white CTA on `--color-ink-950`. The alternative was six one-off `className`
overrides on the marketing page, which is exactly the drift the variant system
exists to prevent.

### D7. Two hover-shade colour tokens

SPEC §4.2 gives one value per semantic colour, but a filled danger button needs
a hover state and SPEC §4.6 permits animating colour, not `filter` — so a
`brightness()` hover is not available. `--color-danger-600` and
`--color-success-600` are added. Both keep white text above 4.5:1.

### D8. `exactOptionalPropertyTypes` is off

`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
`noFallthroughCasesInSwitch`, `noUnusedLocals` and `noUnusedParameters` are on,
which is the contract SPEC §3 sets. `exactOptionalPropertyTypes` additionally
forbids passing `undefined` to an optional prop, which turns ordinary prop
spreading into conditional-spread gymnastics and makes the code worse, not
safer.

### D9. No `asChild` on `Button`; a `ButtonLink` instead

A button that navigates is an anchor. `ButtonLink` shares the same variants and
gets correct semantics, and the loading overlay does not have to survive Radix
`Slot` cloning.

### D10. Icons are exported as descriptors, not components

`icons.ts` exports `{ glyph, nudge }` objects rather than React components, so a
raw Lucide glyph cannot be rendered without `<Icon>`. That makes SPEC §4.7's
"never mix stroke widths in one toolbar" structurally impossible to violate, and
gives per-glyph optical nudges somewhere to live as data.

### D11. The "Backed by Y Combinator" eyebrow is deleted

SPEC §6.2 says ship it only if true. There is no basis to claim it, and the spec
is explicit that a fake credential must not ship. The hero opens on the headline.

### D12. The provider tree is split by surface

TanStack Query, Sonner and the shortcut registry are mounted in the app shell,
not the root layout. Marketing gets Motion and tooltips only. This took the
marketing first-load bundle from 164 kB to 154 kB and the shared chunk from
174 kB to 126 kB, which matters against SPEC §13's Lighthouse ≥95 on `/`.
Pricing and landing content resolve on the server rather than through a client
query.

### D13. `/_dev` is a `%5Fdev` directory

Next.js treats a folder beginning with `_` as private and never routes it, so
`src/app/_dev/components` silently 404s. URL-encoding the underscore gives the
literal `/_dev/components` path SPEC §5 asks for. The route additionally calls
`notFound()` in production unless `NEXT_PUBLIC_DEV_ROUTES=1`.

### D14. Placeholder media is JPEG, not WebP

The installed ffmpeg has no `libwebp` encoder. These are blurred gradients,
which JPEG compresses well, and every target browser supports it. Total media
is 5.7 MB committed.

### D15. Hover-scrub reads a sprite sheet, not the video

SPEC §8.2 wants the preview to scrub on pointer X. Seeking a `<video>` on every
pointer move stalls on keyframes and drops frames. Each clip therefore ships a
12-frame sprite sheet; scrubbing shifts a background position, which is a
compositor-only change. The `<video>` mounts only on sustained hover, for real
playback. Waveform peaks are pre-computed for the same reason.

### D16. Raw hex is permitted in two places, both of them data

`lib/fixtures/**` and `ColorSwatch`. A brand palette entry, a caption fill and a
layer colour are values the *user* picks in a colour well; they cannot come from
our scale without capping the brand kit at four colours. Everywhere else a hex
is a build failure. `ColorSwatch` carries a file-level directive stating this;
`lint-tokens.mjs` requires a reason on every exemption.

### D17. Fixture composition adds up to exactly 60 assets

24 video clips, 16 audio beds, 16 portraits, 4 product stills. The brand kit
holds 4 saved products. Four generated product stills are spare.

### D18. A loading control is busy, not disabled

Setting `disabled` on a loading button drops it out of the tab order and paints
it with the disabled fill, so the primary action of the screen appears to die
the moment it is pressed. Loading instead sets `aria-busy` and `aria-disabled`,
suppresses pointer events and the click handler, and keeps the variant's fill.
The label stays in flow at `opacity-0` with the spinner absolutely centred, so
the control cannot change width. *(Found by looking at the rendered gallery, not
by reading the code.)*

### D19. No drag-and-drop library

Motion's `Reorder` covers the workspace tabs and the slide rail. The timeline,
canvas and bulk grid need raw pointer maths regardless. A DnD library here would
be a dependency doing 30% of the job.

### D20. Logomark geometry, second pass

The first version — 6×20 slats separated only by opacity — rendered as a dark
smudge at 20px and as fat lozenges at 96px. The shipped mark uses a 1:3.3 slat
ratio and has each slat knock a 1-unit gap out of the one behind it via an SVG
mask, so edges stay crisp at nav size; the opacity step then adds depth at
display size. *(Also found by looking at it.)*

### D21. The `?` shortcuts registry is an external store

Holding the registry version in React context made the context identity change
on every registration, which re-ran every consumer's registration effect, which
bumped the version again — an infinite render loop that shipped as a working
build and only surfaced in the browser console. It is now a stable context value
with `useSyncExternalStore` subscribers. *(Found by reading the console on a
running page.)*
