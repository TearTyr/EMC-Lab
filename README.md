# EMC Lab — Interactive Physics Tutorial

A responsive, interactive educational website for **Calculus-based Physics**, built for the
**EMC group**. It teaches measurement & vectors, fluids, temperature & heat, waves & sound
and electricity through written tutorials, **nine live simulations**, and a
**30-question auto-graded quiz** with Chart.js score analytics. Fully static: no backend,
no build step, no required dependencies.

> Every number on every screen is computed from the real equations (the component rule,
> Archimedes' principle, Bernoulli's equation, Q = mcΔT, v = fλ, Ohm's law). Nothing is
> animated by hand.
>
> **Stack:** HTML + CSS + vanilla JavaScript, Tailwind CSS compiled locally
> (`css/input.css` → `css/site.css` via the Tailwind CLI), native Canvas 2D for every
> simulation, WebAudio for the playable tone bench, and **Chart.js** for quiz analytics —
> **vendored under `vendor/`**, so the site makes zero third-party requests.
> The website itself still opens straight from the file system.

---

## 1. Quick start

The site is static. Any of these works:

### Option A — open directly
Double-click `index.html`. Everything works from the file system, including progress tracking
in browsers that allow `localStorage` for `file://` (Chrome, Edge, Firefox all do by default).

### Option B — local web server (recommended)
```bash
cd emc-physics-tutorial
python3 -m http.server 8000        # or: npx serve .
# then open  http://localhost:8000
```

### Option C — any static host
Upload the folder to GitHub Pages, Netlify, Vercel or a university web space as-is.

**Requirements:** a modern browser. Chrome 100+ is the only browser this project
actually tests; Edge 100+, Firefox 100+ and Safari 15.4+ are *targets* — the code
avoids exotic APIs and is expected to work there, but is untested (see §10).
No internet connection is required at run time: Tailwind is compiled ahead of time into
`css/site.css`, and every font (including your licensed faces) is served from `vendor/` (see §7).

---

## 2. File structure

```
emc-physics-tutorial/
├── index.html                     Landing page: navigation, topic cards, formula sheet,
│                                  progress dashboard, animated dipole hero
├── quiz.html                      Quiz page: toolbar, question list, score card
├── topics/
│   ├── vectors.html               Topic 1 — SI units, dimensional analysis, vector addition
│   ├── fluids.html                Topic 2 — pressure, Archimedes, continuity + Bernoulli
│   ├── heat.html                  Topic 3 — temperature scales, Q = mcΔT, heat transfer
│   ├── waves.html                 Topic 4 — wave anatomy, v = fλ, sound and pitch
│   └── current.html               Topic 5 — Ohm's law, series/parallel, R-equivalent
├── css/
│   ├── input.css                  THE styling source: @layer base/components + @tailwind directives
│   ├── site.css                   Committed build of input.css (bun run build:css)
│   └── fonts.css                  @font-face for the vendored open-font fallbacks
├── js/
│   ├── common.js                  Shared engine: constants, HiDPI canvas Stage, pointer input,
│   │                              SI formatter, localStorage progress, nav/reveal/toasts
│   ├── home.js                    Wave hero animation + progress dashboard (index.html)
│   ├── sim-vector-add.js          Sim 1 — vector addition bench (drag arrows, live resultant)
│   ├── sim-archimedes.js          Sim 2 — buoyancy tank (float/sink, to-scale force arrows)
│   ├── sim-bernoulli.js           Sim 3 — aerofoil + venturi visualiser (lift, stall, manometer)
│   ├── sim-thermometer.js         Sim 4 — draggable thermometer (°C / °F / K conversions)
│   ├── sim-heat-transfer.js       Sim 5 — conduction / convection / radiation lab
│   ├── sim-wave.js                Sim 6 — travelling wave bench (transverse + longitudinal)
│   ├── sim-sound.js               Sim 7 — playable tone bench (WebAudio + oscilloscope)
│   ├── sim-ohm.js                 Sim 8 — Ohm's law bench (auto-range meter + I–V chart)
│   ├── sim-circuit.js             Sim 9 — circuit builder (series/parallel/combination)
│   ├── quiz-data.js               30 questions with worked explanations (6 per topic)
│   └── quiz.js                    Quiz engine: marking modes, scoring, Chart.js analytics
├── tools/
│   ├── check-links.mjs            Static validator (links, ids, data-hooks, CSS coverage)
│   ├── smoke-test.mjs             Runtime test harness (jsdom, optional dev dependency)
│   ├── build-public.mjs           Assembles + verifies public/ (the Vercel output directory)
│   ├── perf-audit.mjs             Transfer-size / blocking-script / font-payload budgets
│   ├── add-font.mjs               Registers OPTIONAL licensed faces in vendor/fonts/manifest.json
│   ├── switch-css.mjs             Swaps Tailwind delivery mode (cdn <-> built)
│   ├── og-card.html               Source artwork for the 1200x630 social preview image
│   ├── make-og-card.mjs           Renders that artwork to img/og-card.png (puppeteer, dev only)
│   └── cleanup-repo.ps1           Windows repo-hygiene script: plan -> confirm -> clean (see §9)
├── img/
│   └── og-card.png                Committed Open Graph / Twitter card image (1200x630)
├── vercel.json                    Vercel config: install/build commands, outputDirectory + cache headers
├── tailwind.config.js             Tailwind pipeline config (bun run build:css)
├── vendor/
│   ├── katex/                     Locally vendored KaTeX (js + css + woff2 + LICENSE, MIT)
│   ├── chart/                     Locally vendored Chart.js 4.4.3 (UMD + LICENSE, MIT)
│   └── fonts/                     Committed OFL woff2 faces: G8321 Thin / Regular / Bold
│                                  (+ optional licensed slot: vendor/fonts/README.md)
├── package.json                   Dev scripts: check / test / build:css / perf / font:scan
├── README.md                      This file
├── TESTING.md                     Manual + automated testing checklist
└── PRESENTATION-NOTES.md          Physics + implementation notes for presenting the module
```

Total: ~9,500 lines across 7 pages, the styling pipeline (source + build + font faces)
and 13 scripts. No framework, no bundler, no backend.

---

## 3. Features

| Requirement | Where it lives |
|---|---|
| Clean landing page with navigation to each topic | `index.html` — centred hero with mascot and animated wave, 5 topic cards, simulation index, formula reference; the header carries a **Topics dropdown** (with one-line descriptions) so the nav stays three items wide |
| Responsive UI, desktop + mobile | Fluid `clamp()` type, `md:`/`lg:` grids, hamburger nav < 900 px, canvases resize via `ResizeObserver` |
| Sim 1 — vector addition bench | `js/sim-vector-add.js`: drag the arrowheads of A and B; R = A + B recomposes live by components, as a parallelogram diagonal or tip-to-tail; presets include an exact cancellation |
| Sim 2 — buoyancy tank | `js/sim-archimedes.js`: object density/volume vs three fluids; floats at submerged fraction ρ_obj/ρ_f or sinks to a normal force; F_B = ρ_f V_sub g recomputed every frame, to-scale force arrows, drag-and-release settling |
| Sim 3 — Bernoulli visualiser | `js/sim-bernoulli.js`: aerofoil scene (top/bottom speed-up, lift ∝ ΔP·A, stall past 15° AoA) and venturi scene (continuity A₁v₁ = A₂v₂, manometer Δh from ΔP = ½ρ(v₂²−v₁²)) |
| Sim 4 — interactive thermometer | `js/sim-thermometer.js`: drag the column; °C/°F/K convert live with the arithmetic printed; landmark markers at −40°, 0°, 37°, 100° |
| Sim 5 — heat transfer lab | `js/sim-heat-transfer.js`: conduction diffusion along four materials with q = kAΔT/L, a driven convection circulation, radiation with inverse-square intensity and matt-black vs shiny absorption |
| Sim 6 — wave simulator | `js/sim-wave.js`: y = A sin(kx − ωt) drawn transverse or longitudinal, amplitude/frequency/wavelength sliders, v = fλ recomputed live, medium particles that visibly only oscillate |
| Sim 7 — playable tone bench | `js/sim-sound.js`: WebAudio oscillator (sine/square/saw/triangle) with a live AnalyserNode scope, note ruler, λ = v_sound/f; degrades to a drawn scope where audio is unavailable |
| Sim 8 — Ohm's law calculator | `js/sim-ohm.js`: V and R sliders (R on a log scale), live I, P, auto-ranging ammeter, bulb brightness ∝ P, I–V characteristic plot, power-rating safety warning |
| Sim 9 — circuit builder (battery + bulb, series/parallel) | `js/sim-circuit.js`: add/remove/edit resistors, three topologies, exact per-element V/I/P table, animated charge flow whose density ∝ branch current, clickable resistors |
| Tutorials with explanations, diagrams, formulas, real-world examples | Each topic page: objectives → theory → SVG figures → worked examples → applications → misconceptions → self-check reveals |
| Quiz with ≥ 10 MCQs, automatic scoring + feedback | 30 questions (6 per topic across vectors · fluids · heat · waves · current), exam *or* instant marking, per-question explanations, per-topic breakdown, grade bands, review-incorrect filter, shuffle, retake, **quiz clock with per-question splits, correct-streak counter with a pastel burst, keyboard flow (1–4/A–D, Enter, N)**, `?topic=` deep links from each topic page, and a reacting mascot in every graded feedback |
| Predict-then-run challenges | The circuit builder asks you to predict an outcome; the **simulator itself computes the answer** from its live analysis, then a "Try it" button performs the change so the readouts confirm it |
| Chart.js score visualisation | Doughnut (correct/incorrect), horizontal bars (score per topic), line (attempt history) on the score card, drawn by the **vendored** `vendor/chart/chart.umd.min.js`; CSS-bar fallback if that file ever fails to load |
| Progress tracking with localStorage | `EMC.Progress` in `js/common.js`: topics read + best score + attempt history → ring on the home page; a quiz score of 70%+ also counts as all five topics studied, exactly as the dashboard promises **and as the score card announces at the moment it happens**; **Export / Import** buttons move the snapshot between devices as JSON; degrades gracefully to memory when storage is blocked. Deliberately backend-free |
| Social preview + SEO | Every page carries `<link rel=canonical>`, `og:type/title/description/url/image(+w/h/alt)`, `twitter:card/title/description/image`, all pointing at one production origin and at `img/og-card.png` (committed, 1200×630, regenerated by `bun run og:card`) |
| No-JavaScript notice | Each page ships a `<noscript>` banner (`.noscript-note`) that says the sims, dashboard and quiz need JavaScript while the tutorial text still reads |
| theme-color honesty | `<meta name="theme-color">` is `#17181c`, the exact `--bg` the pages paint, so mobile browser chrome matches the site instead of an older navy |
| Cross-browser design (Chrome tested; Edge / Firefox / Safari targeted, untested) | No exotic APIs; feature-guarded `ResizeObserver`, `IntersectionObserver`, Web Animations; vendor-prefixed range-input styling for both engines |

---

## 4. The physics inside each simulation

| Sim | Governing equations implemented |
|---|---|
| Vector bench | R = A + B by components (R<sub>x</sub> = A<sub>x</sub>+B<sub>x</sub>, R<sub>y</sub> = A<sub>y</sub>+B<sub>y</sub>); |R| = √(R<sub>x</sub>²+R<sub>y</sub>²); θ = tan⁻¹(R<sub>y</sub>/R<sub>x</sub>) with the quadrant fixed by the signs |
| Buoyancy tank | W = ρ<sub>obj</sub>Vg; F<sub>B</sub> = ρ<sub>f</sub>V<sub>sub</sub>g; floats when ρ<sub>obj</sub> < ρ<sub>f</sub> at submerged fraction ρ<sub>obj</sub>/ρ<sub>f</sub>; N = W − F<sub>B</sub> on the floor; spring-damper settling |
| Bernoulli visualiser | A₁v₁ = A₂v₂ (v₂ = v₁/ratio² in the throat); ΔP = ½ρ(v₂² − v₁²); lift = ΔP × wing area; separation model past 15° AoA |
| Thermometer | °F = °C × 9/5 + 32; K = °C + 273.15; ΔT invariance between the degree scales |
| Heat transfer lab | Fourier: q = k·A·ΔT/L with per-material k; convective circulation field driven by heater power; radiation I = P/(4πd²) with absorbed αI per surface |
| Wave simulator | y = A sin(kx − ωt), k = 2π/λ, ω = 2πf; v = fλ; T = 1/f; longitudinal displacement field with compressions/rarefactions |
| Tone bench | λ = v<sub>sound</sub>/f; MIDI-mapped note naming with cent deviation; oscillator frequency = f exactly |
| Ohm bench | I = V/R; P = VI = I²R = V²/R; I–V line of gradient 1/R |
| Circuit builder | R<sub>eq</sub> = ΣRᵢ (series), 1/R<sub>eq</sub> = Σ1/Rᵢ (parallel), R₁+(R₂R₃)/(R₂+R₃) (combo); Kirchhoff's laws; P = I²R per element |

The conduction scene relaxes a 20-cell diffusion profile every frame (with reservoir ends),
so the printed temperature profile is the numerical solution of the heat equation rather than
a drawn line; the radiation scene's intensity follows the inverse square exactly, which the
smoke test verifies by doubling d and expecting a quarter of the intensity.

---

## 5. Bun is the package manager

```bash
bun install          # installs the single dev dependency (tailwindcss) -> bun.lock
bun run build:css    # css/input.css -> css/site.css (minified, ~36 kB)
bun run check        # static validator (links, ids, utility coverage)
bun run test         # 292-assertion jsdom harness
bun run perf         # gzip transfer / font payload / blocking-script budgets
bun run font:scan    # re-scan vendor/fonts/ for OPTIONAL licensed cuts -> manifest.json
bun run og:card      # regenerate img/og-card.png from tools/og-card.html (puppeteer)
```

Everything else is plain static files; Bun and Node produce identical output, but the
project standardises on Bun (`bun.lock` is committed and Vercel detects it).

> **Lockfile compatibility:** the committed `bun.lock` is `lockfileVersion: 1`, the
> format Bun 1.3.x reads and writes. Vercel's install step runs a bundled Bun 1.3.x,
> which cannot parse the `lockfileVersion: 2` files written by Bun ≥ 1.4 — it logs
> `Unknown lockfile version`, ignores the lockfile and re-resolves from scratch
> (vercel/vercel#17577). Keep Bun 1.3.x locally (or re-run `bun install` with 1.3.x
> before committing) so builds stay reproducible.

## 6. Hosting on Vercel

`vercel.json` pins the whole pipeline so a deploy is reproducible from a bare clone:

* `installCommand: bun install` — Vercel detects `bun.lock` and uses Bun.
* `buildCommand: bun run build` — recompiles `css/site.css` from `css/input.css` on every
  deploy (committed CSS can never drift from the markup), then `tools/build-public.mjs`
  assembles the complete site into a fresh `public/` and verifies every local link resolves.
* `outputDirectory: public` — pinned in `vercel.json`, which **overrides** the dashboard's
  Output Directory setting, so a stale dashboard value can never fail the build again.
  `public/` itself is gitignored: it is a build artifact, regenerated on every deploy.
* Headers: `/css/` and `/js/` are `no-cache` (304 when unchanged) so fresh HTML can never
  pair with a stale stylesheet; `/vendor/` (KaTeX, fonts) caches for a day.
* Each page carries one line of inline critical CSS — scoped to `@media (min-width: 901px)` —
  that keeps the Topics dropdown collapsed even if a stale stylesheet were ever served.

Progress is localStorage-only by design: no backend, no database, nothing that can incur cost.

### Dashboard settings (project → Settings → General / Build & Development Settings)

| Setting | Value | Why |
| --- | --- | --- |
| Framework Preset | `Other` | static site; no framework detection needed |
| Root Directory | *(empty)* | the site lives at the repository root |
| Build Command | *(empty — `vercel.json` sets it)* | `bun run build` |
| Output Directory | *(anything — `vercel.json` overrides it)* | `vercel.json` pins `public`; the build generates it |
| Install Command | *(empty — `vercel.json` sets it)* | `bun install` |

> **Troubleshooting.**
> `No Output Directory named "public" found after the Build completed` → historically a
> dashboard-set Output Directory with nothing generating that folder. Fixed at the source:
> `vercel.json` pins `outputDirectory: public` **and** `bun run build` generates the folder
> (the vercel.json value overrides the dashboard per Vercel's docs). If you still see it,
> the deployment predates commit *"generate public/ output dir"* — push and redeploy with
> "Use existing Build Cache" unticked.
> `Unknown lockfile version` while parsing `bun.lock` → a Bun ≥ 1.4 machine rewrote the
> lockfile to version 2 and it was committed; Vercel's bundled Bun 1.3.x cannot read it.
> Regenerate with Bun 1.3.x (see §5) and commit the `lockfileVersion: 1` file.

## 7. Styling architecture — one source, three cascade layers

All styling lives in **`css/input.css`**, compiled by the Tailwind CLI into `css/site.css`.
There is no second stylesheet to fight with: the file is organised as

| Layer | Contents | Loses to |
|---|---|---|
| `@layer base` | colour/shape tokens, the three font stacks, element resets (`h1…h4 {margin:0}`, list padding, `sup/sub` positioning) | components **and** utilities |
| `@layer components` | the sticker design system: `.card`, `.panel`, `.ctl`, `.q-card`, `.opt`, nav, mascot, the `.hr` divider hairline (must keep its own dark rule — an unstyled `<hr>` inherits preflight's light border and reads as a white line), the 640/900/1200 media queries | utilities |
| `@layer utilities` | Tailwind's own output — every utility used in markup (`mt-2`, `gap-4`, `md:grid-cols-2`, …) | nothing |

Because CSS cascade layers order **base < components < utilities**, a utility class in the
markup always wins over an element reset or a component rule of equal specificity — that is
the whole specificity-conflict story, solved by architecture instead of `!important`.
`bun run check` proves coverage: it lists every utility class used in the seven pages and
verifies each one exists in the compiled `css/site.css`.

### Type system (one committed OFL family, three weights)

| Role | Face | Source |
|---|---|---|
| Titles / headings / buttons / labels | `fot-yuruka-std` → **G8321 Bold 700** | licensed face locally (`vendor/fonts/manifest.json` slot); committed fallback `vendor/fonts/g8321-700.woff2` |
| Body copy / prose | **G8321 Regular 400** | committed `vendor/fonts/g8321-400.woff2` |
| Display numerals (grade, watermark, ring %) | **G8321 Thin 100** | committed `vendor/fonts/g8321-100.woff2` |
| Home stat-strip numbers (small, 1.45rem) | **G8321 Regular 400** | committed `vendor/fonts/g8321-400.woff2` |

All three weights are G8321 by Coji Morishita (SIL OFL 1.1) — the whole site is one
family, so local dev and the deployed site are guaranteed consistent. The stacks live once
in `tailwind.config.js` (`fontFamily.title / sans / ui`) and are pulled into CSS with
`theme('fontFamily.…')`, so config and output can never disagree. Titles lead with
`fot-yuruka-std`, a *paid* face that is never committed: on machines that hold it locally
it renders headings; everywhere else titles fall back to G8321 Bold — still the site's
family, no licence risk. ~45 KB of fonts total.

## 8. Engineering notes

* **Visual design policy — "chiikawa official, but dark and minimal".** The layout language is
  borrowed from chiikawaofficial.com and translated, not copied: one calm centred column,
  sections separated by space instead of rules, sticker-like cards with thick soft outlines and
  large radii, pill buttons, and a small bobbing mascot ("Denki-chan") that appears in the hero,
  above each topic title, and as the brand mark. The palette is a warm charcoal base with the
  reference site's own candy pastels (pink `#f8aebe`, lilac `#d5b8d8`, green `#b5d777`,
  blue `#a8d3e0`, yellow `#f6d36b`) used sparingly as the only accents. Typography is a
  single-family system — G8321 (SIL OFL 1.1) in three committed weights (~45 KB total,
  zero licence risk): **Thin 100** for oversized display numerals, **Regular 400** for
  body copy, **Bold 700** for headings, buttons and labels. Titles additionally try the
  privately licensed *FOT-Yuruka Std* first, which only machines holding that paid font
  can render; everywhere else they fall back to G8321 Bold, keeping every host consistent.
  `js/common.js` activates such local-only faces through the optional
  `vendor/fonts/manifest.json` slot (FontFace API, one info log line per face, zero
  console noise when absent). `sup`/`sub` are positioned by CSS
  rather than font metrics, so no activated face can ever scatter exponents. Motion is limited to the mascot's bob
  and soft hover lifts; there is no blur, glass, gradient, glow or scroll animation anywhere.
  Simulations and SVG figures sit on flat near-black plates, like lab instruments.
  Readability rules: prose runs at line-height 1.85 in an article rhythm copied from a clean
  long-form blog layout — ~4.2 rem of air above every numbered heading, ~2.2 rem around
  equations, callouts, figures, definition lists and disclosures — so only one idea sits on
  screen at a time and no page ever reads as a wall of text. Every page shares ONE content
  column (`--column: 1060 px`, i.e. 1020 px of content between the 20 px gutters): topic
  prose, callouts, sim panels, the quiz head and the home hero canvas + stat strip all end
  at the same left/right edges, so no page ever looks thinner than another. Every
  supplementary block (real-world connections, common traps) is collapsed behind a "+"
  disclosure so the main flow stays short; worked examples and rules stay open.
* **The site talks about physics only.** No page mentions the course, the module or how the
  site was built, tested or deployed — no "Works everywhere" blurb, no dependency/build-step
  stats, no dev-doc links in footers. That material lives in this README, TESTING.md and
  PRESENTATION-NOTES.md, which the deployed site no longer links to or ships.
* **Everything is same-origin, on purpose.** KaTeX and Chart.js 4.4.3 are
  committed under `vendor/` with their MIT licence files, exactly like the fonts.
  That removes the CDN outage risk, the privacy leak and the SRI-hash maintenance in one
  move; `tools/smoke-test.mjs` asserts per page that no `http(s)://` asset reference exists,
  and `tools/cleanup-repo.ps1` reports any that reappear.
* **Equations are real LaTeX, with zero network risk.** **KaTeX is vendored locally**
  (`vendor/katex/`: js, css and woff2 fonts, ~600 kB), so typesetting works offline, on
  `file://`, and on any host including Vercel. Every displayed equation carries its source in a
  `data-tex` attribute (`F = k\,\frac{|q_1q_2|}{r^2}`, `\mathcal{E} = -N\,\frac{d\Phi}{dt}`, …)
  and is typeset by `EMC.katexify()` at boot and again on `window.load`; the home-page formula
  table uses inline mode. Each element also keeps hand-readable plain text, so even a totally
  broken script degrades to legible equations, never raw TeX.
* **Flat-art policy.** No gradient or glow exists anywhere in the codebase — not in the CSS and
  not in the canvas code (blocks, wings, bulbs and particles are flat pastel stickers).
  `tools/smoke-test.mjs` enforces this: it fails if `createLinearGradient`,
  `createRadialGradient`, `shadowBlur`, `backdrop-filter` or a CSS gradient ever reappear.
* **Styling.** A single source file, `css/input.css`, holds `@layer base` (tokens, font stacks,
  element resets), `@layer components` (the whole sticker design system) and the three
  `@tailwind` directives; `bun run build:css` compiles it to the committed `css/site.css`
  (also re-run by Vercel on every deploy). Cascade layers guarantee utilities > components >
  base, which is what makes `mt-2`-style markup utilities win without `!important`.
  `tailwind.config.js` scans the markup plus `js/quiz.js` (the one script that injects utility
  classes) and keeps a **top-level** `blocklist` of prose words that collide with utility names
  (`table`, `filter`, `ring`, …). Careful: nesting `blocklist` inside `content` invalidates the
  whole config — Tailwind then logs the `purge`/`content` warning and silently drops the
  blocklist, so scanner accidents leak into the build. One breakpoint system everywhere: **640 / 900 / 1200 px**, shared by the config
  and the component media queries. Accent colours derive from one variable per hue
  (`--c/--ct/--ce`), so tags, callouts, accents and readout highlights never hard-code a tint.
  `node tools/switch-css.mjs cdn` can still add the Play CDN tag if a rubric literally demands
  "Tailwind via CDN"; `… built` (the shipped default) removes it again.
* **Canvas engine.** `EMC.Stage` (`js/common.js`) wraps each `<canvas>`: device-pixel-ratio
  scaling, resize observation, an auto-pausing `requestAnimationFrame` loop, and unified
  pointer events (mouse + touch + pen) with pointer capture for drags. Render functions draw in
  CSS pixels only.
* **Number formatting.** `EMC.eng()` formats to 3 significant figures with a single SI prefix
  (femto…tera, exponential outside that range); `EMC.unit()` joins the unit without a break so
  "399 mN" can never wrap. Prefixes are never stacked (no "µmWb").
* **Robustness.** `localStorage` access is wrapped and falls back to memory; every optional DOM
  lookup is guarded so a page without a given simulation still boots; `scrollIntoView`,
  `Element.animate`, `ResizeObserver` and `IntersectionObserver` are feature-detected.
* **Accessibility.** Skip link, landmark regions, one `<h1>` per page, labelled canvases
  (`role="img"` + `aria-label`), `radiogroup`/`radio` semantics with arrow-key support in the
  quiz, `aria-pressed` toggles, visible focus rings, `prefers-reduced-motion` support, and
  print styles that hide the interactive chrome.
* **No tracking, no backend.** The only persistent state is one `localStorage` key
  (`emc.progress.v1`) in the user's own browser.

---

## 9. Developer commands

```bash
bun install          # dev deps only: jsdom (tests) + tailwindcss (CSS build)
bun run check        # static validation: links, ids, data-hooks, CSS coverage
bun run test         # 292 runtime assertions across all seven pages (skips politely
                     # if jsdom is absent)
bun run build:css    # recompile css/input.css -> css/site.css after markup changes
bun run perf         # gzip transfer / font payload / blocking-script budgets
bun run font:scan    # re-scan vendor/fonts/ for optional licensed cuts -> manifest.json
bun run switch:cdn   # optional: add the Play CDN tag (rubric demands "Tailwind via CDN")
bun run switch:built # optional: back to the shipped default (compiled site.css)
```

The website itself still has **zero required dependencies**: Chart.js and KaTeX are
vendored under `vendor/` (with their licence files), every fallback path is tested, and the
compiled Tailwind CSS is committed. Nothing on any page is fetched from a third-party host —
`tools/cleanup-repo.ps1` health-check 8h fails the repo if a `<script>`/`<link>` ever points
at `http(s)://` again.

### Repo hygiene (Windows)

`tools/cleanup-repo.ps1` automates the tidy-up that a hand-written checklist keeps
forgetting. It runs **PLAN → CONFIRM → EXECUTE**, so nothing is touched until you
answer the prompt (`-DryRun` never writes, `-Force` skips the prompt).

```powershell
# PowerShell / Windows Terminal, from the repo root
.\tools\cleanup-repo.ps1 -DryRun                     # show me everything first
.\tools\cleanup-repo.ps1                             # plan, ask, then clean
.\tools\cleanup-repo.ps1 -Verify -Commit -Push       # clean + bun checks + ship it
.\tools\cleanup-repo.ps1 -RepoPath D:\VS\EMC-Physics -CheckLive -PurgeNodeModules
```

```bash
# Git Bash / MSYS, from the repo root -- forward slashes, or the backslashes are
# eaten as escapes and PowerShell gets the single word "toolscleanup-repo.ps1"
# ("The argument ... to the -File parameter does not exist").
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./tools/cleanup-repo.ps1 -DryRun
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./tools/cleanup-repo.ps1 -Verify -Commit -Push
```

* **deletes** the dead `server/` + `api/` backends, `tools/subset_font.py`,
  `bun.lockb`, `package-lock.json`, unused woff2 faces, and OS/editor junk
  (`Thumbs.db`, `desktop.ini`, `.DS_Store`, `*.bak`, `*.orig`, …) — into the
  **Recycle Bin** unless you pass `-Permanent`;
* **untracks but never deletes** your licensed `.ttf`/`.otf` backups, and repairs
  `.gitignore` if the `vendor/fonts/*.ttf|*.otf` rules went missing;
* **refuses** to delete anything `css/fonts.css` references or anything in its
  hard-protected list (`css/site.css`, `bun.lock`, the committed OFL woff2 files,
  the HTML pages, the configs);
* **reports** (never silently "fixes") a `lockfileVersion: 2` `bun.lock`, a missing
  `css/site.css`, `public/` files **tracked in git** (it is the generated deploy
  artifact and must stay gitignored), `vercel.json` **not** pinning
  `"outputDirectory": "public"` (the pin that overrides the dashboard and prevents
  Vercel's *"No Output Directory named public"* error), tracked
  `node_modules`, tracked files over 1 MB, and private font binaries still
  reachable in **git history** — `.gitignore` does not rewrite history;
* `-CheckLive` then probes the deployment: `/api/health` must **not** be 200 while
  the fonts, `css/site.css` and `/` must be.

Exit codes: `0` clean · `1` you aborted · `2` not the EMC Lab repo · `3` a step failed.

### Performance tooling
* every `<script>` tag is `defer` and same-origin — there are **no third-party requests at
  all**, hence no `preconnect` hints and no Subresource Integrity hashes to maintain;
* the vendored Chart.js (~68 KB gzip) loads only on the quiz page, so no other page pays
  for it; the tone bench needs no library at all (WebAudio is a browser API);
* KaTeX and all fonts are self-hosted (no third-party round trips);
* `npm run perf` (`tools/perf-audit.mjs`) serves the site with gzip like a real host and
  enforces budgets: **0 render-blocking scripts**, **< 500 KB compressed transfer per page**
  excluding the font payload, and **fails if raw-TTF fonts ever exceed 500 KB** (the repo
  ships woff2 only, ~71 KB) — current numbers are ~250-280 KB per page including fonts;
* if you ever add a big TTF, convert it once with `pip install fonttools brotli` and
  `TTFont(...).flavor = 'woff2'` — only woff2 belongs in the repo.

---

## 10. Browser support

Chrome is the only browser this project tests (headless Chrome 148; see
`TESTING.md`). Everything below is a *target*: the code avoids exotic APIs and is
expected to work on these versions, but nothing has been verified there — do not
read this table as a claim of tested support.

| Browser | Minimum version (target) | Notes |
|---|---|---|
| Chrome | 100 | the only tested browser |
| Edge | 100 | same engine as Chrome; untested here |
| Firefox | 100 | `::-moz-range-*` slider styling provided; untested here |
| Safari | 15.4 | `color-mix()` has a `@supports` fallback; untested here |

---

## 11. Licence and credits

Educational use. Physics content follows the standard calculus-based texts
(Halliday/Resnick/Walker; Serway; Young & Freedman). Constants are CODATA 2018 values.
