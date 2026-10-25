# EMC Lab — Interactive Electromagnetics Tutorial

A responsive, interactive educational website for **Calculus-based Physics 2** (Electricity
group). The course brief's three chapters are the site's three chapters — all principal,
nothing optional:

| # | Chapter | Page | What's inside |
|---|---------|------|---------------|
| 1 | **Circuits & Ohm's Law** | `topics/current.html` | V, I, R, power, series/parallel reduction, an Ohm's-law bench (R2) and a drag-and-drop circuit builder with resistors, a battery and a bulb whose brightness follows P = VI (R1) |
| 2 | **Electric Fields & Coulomb's Law** | `topics/fields.html` | the graded lecture in three sections — 2.1 Electric Charge, 2.2 Coulomb's Law (1-D/2-D superposition, Bohr atom), 2.3 Electric Field (E = F/\|q₀\|, field lines, the two-charge y-axis example) — with nine open sandboxes and toys |
| 3 | **Magnetism & Induction** | `topics/magind.html` | Lorentz force F = qv × B, magnetic motion, flux, Faraday's law, Lenz's law on a live coil |

Plus a **24-question auto-graded quiz** (exactly 8 per chapter) with Chart.js score
analytics, and device-local **progress tracking** for the three chapters.

> Every number on every screen is computed from the real equations — Ohm's law,
> Coulomb's law with vector superposition, E = Σ kq r̂/r², F = qv × B, ε = −N dΦ/dt.
> Nothing is animated by hand. The Coulomb constant is **k = 8.99×10⁹ N·m²/C²**
> (the lecture's value) everywhere — computed *and* printed — so every readout
> reproduces the lecture's worked answers (±1 C at 1 km → 8990 N; net 5.69 N on the
> +3 µC line example; 22.7 N at ≈24° in 2-D; v = 2.188×10⁶ m/s for Bohr; 75,595 N/C
> along +y for the two-charge field).

**Stack:** HTML + vanilla JavaScript + Canvas 2D, Tailwind CSS compiled locally
(`css/input.css` → `css/site.css` via the Tailwind CLI), vendored **KaTeX** and
**Chart.js** under `vendor/` — the site makes **zero third-party requests** and opens
straight from the file system.

**Single source of truth:** `js/registry.js` defines the three chapters, their paths,
quiz tags and simulations. Navigation, chapter counts, progress topics, quiz
categories, the production page list and `sitemap.xml` are all derived from it —
never hand-typed. Legacy ids from earlier site generations (`charge`, `coulomb`,
`field`, `current`, `magind`, …) resolve through its alias map, so old links, old
hash routes, old quiz deep links and old progress records all keep working.

**Scope map:** `BUG_AUDIT.md` is the compact register of every audited finding and
every gate-contract change (all resolved; narrative history lives in git). The
requirement digest and the lecture PDF are in `docs/spec/`; the reference-video
analysis behind the intro and the site-wide motion system is in
`docs/reference/animation-reference.md`.

---

## 1. Quick start

The site is static. Any of these works:

### Option A — open directly
Double-click `index.html`. Everything works from the file system (the same-page
chapter reader needs `http://`, so on `file://` chapter links simply open the
standalone pages — which is the intended fallback).

### Option B — local web server (recommended)
```bash
python3 -m http.server 8000        # or: npx serve .
# then open  http://localhost:8000
```

### Option C — any static host
Upload the repo root, or run the production build (§5) and upload `public/`.

The reference footage under `Video/` is a Git LFS object; the site, the tests and
every gate run without it (all harness file-servers exclude `Video/`). Install
`git-lfs` and run `git lfs pull` only if you want to re-inspect the footage.

---

## 2. File structure

```
index.html            home: hero, chapter cards, sim index, formula sheet, progress dashboard
quiz.html             the 24-question quiz (filters, timers, navigator, charts, resume)
topics/
  current.html        Chapter 1 — Circuits & Ohm's Law   (sim-ohm, sim-circuit)
  fields.html         Chapter 2 — Electric Fields & Coulomb's Law (§§2.1–2.3, nine sims/toys)
  magind.html         Chapter 3 — Magnetism & Induction  (sim-lorentz, sim-induction)
  charge.html         redirect stub → fields.html#charge   (old URL, anchors preserved)
  coulomb.html        redirect stub → fields.html#coulomb
  field.html          redirect stub → fields.html#field
js/
  registry.js         the three chapters + legacy alias map (pure-JSON core)
  common.js           engine: constants, Stage (HiDPI canvas + rAF), loader, Detail Mode,
                      Progress (v4 + migrations), KaTeX pipeline, UI primitives
  shell.js            same-page chapter reader for index.html (hash routes #/ch1…#/ch3,
                      legacy aliases, one cleanup path for mounted sims)
  home.js             dashboard + derived hero counters
  quiz.js             quiz engine (exam/instant, timers, autosave + bank fingerprint,
                      Chart.js with CSS-bar fallback)
  quiz-data.js        the 24-question bank (8/8/8)
  sandbox-core.js     shared free-play engine for the ch2 sandboxes
  sim-*.js, toy-*.js  the 13 simulations/toys (one file each, registry-listed)
css/                  input.css (source) → site.css (built), fonts.css
vendor/               KaTeX + Chart.js + OFL fonts (same-origin, licensed)
tools/                dev tooling (see §7)
docs/spec/            requirement digest + independent recompute of every lecture value
docs/reference/       reference-video analysis behind the intro & motion system
Video/                the original reference MP4 (analysis source; never shipped;
                      stored via Git LFS — `git lfs pull` after cloning if you need
                      to re-derive the footage analysis; no gate reads it)
```

---

## 3. Features

- **Three chapters, one quiz, one progress ring.** Counts on every screen are derived
  from the registry and the bank (3 chapters · 13 sims · 24 questions).
- **Detail Mode.** One header switch flips every explanation between a simplified and a
  full-technical variant — applied before first paint (no flash of the wrong level),
  persisted per browser, keyboard-operable (`aria-pressed` + announced), and guaranteed
  pair-complete by `npm run check` (parity gate). Sims, scroll position and quiz state
  survive the flip untouched.
- **Once-per-session intro (v8 "drop-in cut", ~12 s).** The homepage opens with
  the frame-accurate recreation of the reference edit: a shape-face countdown
  (ears/eyes pop, 3-2-1, G/O) flash-cuts at 3.5 s into the title card — the
  mascot with per-act face swaps (sparkle → focus → happy), ghost mascots,
  letter-popped "EMC Lab" title, sub chip and feature chips, drifting +/−
  charges, orbiting electrons and a burst ring on the ~68 BPM beat — Start at
  10.3 s, flash out at 11.2 s, done at 12 s. One rAF timeline in `js/intro.js`
  (BEAT0 3.5 / BEAT 0.88), container-query sizing so the composition scales as
  one unit, `?t=<s>` freezes any frame for tuning. Repo contracts kept: once
  per session, chapter routes skip it, skip/Start clickable through playback,
  reduced motion draws the static end frame, face art fetches only when the
  intro actually plays. `npm run intro-verify` proves the whole contract.
  The client's drawn mascot artwork anchors every brand surface
  (hero, header/footer marks, favicon set, social card) — no SVG-generated
  mascot art remains; the hero mascot is capped (capped layout
  area, `pointer-events: none`, gentle float) and reacts once to meaningful
  moments (quiz pass, chapter completion) beside word-based state text.
- **Loader contract.** Page content renders immediately; a segmented accent bar appears
  only if startup exceeds ~150 ms, tracks real stages (fonts, above-fold equations,
  critical UI), exits in ~240 ms, and is capped by a 1500 ms watchdog. A failed critical
  dependency shows Retry + Home — never a permanent spinner. `tools/loader-verify.mjs`
  proves the whole contract in a real browser.
- **Quiz.** Exam or instant marking, optional timers (practice count-up / challenge
  count-down with auto-submit), question navigator, flags, shuffle, autosave & resume
  (with explicit stale-bank detection), dual submit buttons, per-chapter breakdown,
  Chart.js analytics with a CSS-bar fallback if the library fails.
- **Progress.** localStorage only — no accounts, no backend, no network. v1/v2/v3
  records migrate losslessly into the v4 chapter schema; Export/Import moves progress
  between devices as JSON.
- **Accessibility.** Semantic landmarks, skip link, visible focus, ≥4.5:1 body contrast,
  state never carried by colour alone, full keyboard flows, `prefers-reduced-motion`
  honoured everywhere (decorative motion off, state feedback intact).

---

## 4. The physics inside each simulation

| Sim | Chapter | Governing equations (computed live) |
|-----|---------|-------------------------------------|
| Ohm bench (`sim-ohm`) | 1 | I = V/R, P = VI, P = I²R; carrier rate I/e; auto-ranging meters; rated-power warning |
| Circuit builder (`sim-circuit`) | 1 | Series/parallel/combo reduction, Kirchhoff-exact branch solve; bulb brightness ∝ P |
| Static Room (`sim-static-room`) | 2 §2.1 | softened Coulomb pair sum; contact sharing (q₁+q₂)/2; unbreakable conservation tally |
| Rub the Balloon (`toy-balloon`) | 2 §2.1 | q = n·e in whole electrons; equal-and-opposite readouts |
| Charge Ledger (`toy-ledger`) | 2 §2.1 | identical conductors split any total equally; total invariant |
| Tug-of-War Arena (`sim-arena`) | 2 §2.2 | F = k\|q₁q₂\|/r² + vector superposition; lecture line & 2-D presets reproduce 5.69 N and 22.7 N ∠24°; release mode integrates F = ma |
| Pin the Force (`toy-pinforce`) | 2 §2.2 | the 1/r² hyperbola, live ratio readout F(2r)/F(r) = 0.250 |
| Bohr Tuner (`toy-bohr`) | 2 §2.2 | v = √(ke²/(mₑr)) → 2.188×10⁶ m/s at r = 5.29×10⁻¹¹ m (Coulomb pull as the **centripetal** force) |
| Field Painter (`sim-fieldpaint`) | 2 §2.3 | E(P) = Σ kq (P−r)/\|P−r\|³; lecture replica preset: E₁ = 73,388 N/C, net 75,595 N/C +y, Eₓ = 0 |
| Dipole Builder (`toy-dipole`) | 2 §2.3 | bisector field of a live dipole |
| Zero-Field Hunt (`toy-zerohunt`) | 2 §2.3 | sweep for E = 0 with a words-not-colour meter |
| Lorentz Lab (`sim-lorentz`) | 3 | F = qv × B, r = mv/(\|q\|B), RK4-checked orbits |
| Coil Lab (`sim-induction`) | 3 | Φ = BA cosθ, ε = −N dΦ/dt, Lenz-direction current |

Softening (≤1 cm) keeps close-range forces finite; the stability warning says so
outright. The lecture's check values are independently recomputed by
`node docs/spec/verify-checks.mjs` (all twelve, ≤1 %).

---

## 5. Build & deploy

The committed site runs with **no build step**. The build exists for production:

```bash
npm install                # devDependencies: jsdom, tailwindcss, playwright
npm run build:css          # Tailwind CLI: css/input.css -> css/site.css (minified)
npm run build:public       # assemble public/: hashed+minified assets, link verification,
                           # sitemap.xml + generated pages; fails on any broken reference
```

`package.json` scripts historically call `bun`; **npm works identically** for every
script (the two `build:*` steps are the same binaries). On Vercel the project builds
with bun as configured in `vercel.json` (`buildCommand: bun run build`,
`outputDirectory: public`). Production assets ship under content-hash names with
1-year immutable headers — that is by design, so source paths like `/js/common.js`
404 in production while `/js/common.<hash>.js` serves.

---

## 6. Hosting on Vercel

- Framework preset: **Other**; Build command `bun run build`; Output directory `public`
  (also pinned in `vercel.json`, which overrides the dashboard).
- `vercel.json` carries the cache headers and the legacy `/topics/efield.html` redirect.
- No analytics or speed-insights integrations: the site must stay zero-third-party
  (`tools/check-scope.mjs` fails the build locally on any external fetch).

---

## 7. Developer commands

```bash
npm run check          # links + ids + data hooks, Detail-Mode parity, scope & network purity
npm run test           # jsdom smoke test (557 assertions: physics, quiz, loader, a11y, migration, intro)
npm run test:interact  # real Chromium drives every sim (mouse/touch/keyboard, rude cases)
npm run test:shell     # shell stress: rapid route switching, teardown, reduced motion
npm run loader-verify  # (node tools/loader-verify.mjs) the §3.1 loader contract, 16 checks
npm run intro-verify   # the once-per-session intro contract (PART 6.4), 12 checks
npm run motion-verify  # site-wide motion system: reveals, route flash dip, whip, 10 checks
npm run asset-verify   # image/asset contract: decode, dims, alt, lazy, stretch, art, favicon ICO
npm run stability-stress # the reported-bug reproduction matrix (nav/Details/typography), 35 checks
npm run perf           # transfer/DOM/font budgets per page
npm run perf:guard     # animation-chain budgets, CLS, anchor clearance
npm run verify:prod    # production-layout gate: shell-mount contracts against the
                       # HASHED public/ build (auto-builds when missing) — run after
                       # every build:public, before every deploy
npm run shots          # screenshots of every page + sim panel
npm run build          # build:css + build:public
```

Every `*-verify` gate above also has a plain script name (`npm run a11y-verify`,
`nav-verify`, `quiz-verify`, `lecture-values`, `asset-verify`, …). A few harnesses
are manual only (`node tools/<name>.mjs`): `browser-matrix` (gate B:
Chromium+Firefox+Edge core flows), `capture-site-intro` (timestamped intro frame
loop → `/tmp/introcap`), `capture-intro-video [outDir]` (intro as WebM) and
`baseline-sweep [name]` (responsive sweep → `shots/sweeps/[name]/`).

All test tooling is dev-only; the shipped site has zero runtime dependencies.
Playwright browsers: `npx playwright install chromium firefox` (+ `msedge` channel for
the Edge run).

**Harness notes (sandbox/low-RAM environments).**
- Run the browser gates **one at a time**; `pkill -9 -f "chrome|chromium"` between runs —
  zombie browsers from a crashed run cause `Target crashed` on the next harness's first page.
- Every browser harness — gates, screenshots and the perf tools alike — runs on
  Playwright's chromium (`npx playwright install chromium` once).
- The intro runs ~11.5 s (11.05 s picture + 0.45 s fade): `intro-verify` waits up to
  20 s for overlay removal, `capture-intro-video` up to 20 s.
- Dev-only footage tooling (never shipped, gitignored): `.scratch/footage/` holds the
  sha-verified MP4, every frame from 21.0 s, contact sheets and the 11.5 s song-edit
  proof cut; `.scratch/trace/trace.html` is the frame-by-frame trace harness
  (footage × real intro CSS, beat-map synced) — serve the repo root and open it.
- Verifier file-servers preload the repo into RAM and exclude `docs/`, `.scratch/`,
  `shots/` and `Video/` (never requested by any page; a page that did request them
  would 404 into the `misses[]` assertion).
- `check-links.mjs` keeps a `DYNAMIC_IDS` allowlist (includes `introOverlay`: markup only
  in index.html, every script reference null-guarded, behaviour covered by intro-verify).

---

## 8. Browser support

Tested with Playwright in this repo's audit harnesses: **Chromium 156**, **Firefox 157**
and **Edge 156** (msedge channel) for the core flows; the same Playwright Chromium for
the performance budgets. A browser that cannot launch on your machine is reported
UNTESTED by `browser-matrix`, never assumed. The site degrades without JavaScript (all prose readable, noscript
notices) and without localStorage (progress disabled, everything else intact).

---

## 9. Licence and credits

- Code & content: educational use, EMC Lab project.
- KaTeX (MIT) and Chart.js (MIT) are vendored with their licences under `vendor/`.
- Fonts: G8321 (SIL OFL 1.1) committed as woff2; KaTeX fonts (SIL OFL) vendored.
- Physics content follows standard calculus-based texts (Halliday/Resnick/Walker,
  Serway, Young & Freedman) and the course lecture; constants: k = 8.99×10⁹ N·m²/C²
  (lecture value, used everywhere), e = 1.602×10⁻¹⁹ C, μ₀ = 4π×10⁻⁷ T·m/A.
- The social card (`img/og-card.png`, 1200×630) is committed raster artwork
  composed from the site's own design tokens — charcoal `--bg` surface, pink
  brand accent, electric-yellow tagline, the pastel law chips, outline pills
  and the client's mascot art in its canonical cream art frame with ghost
  mascots — rasterised by `tools/make-og-card.mjs` (headless render of the
  token sheet, then committed as a plain PNG; meta tags cache-bust `?v=`).
  Regenerate with that script, never by hand-painting pixels.
