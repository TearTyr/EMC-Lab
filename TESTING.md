# Testing checklist — EMC Lab

Two layers: **automated** checks you can run in seconds, and a **manual** checklist for the
parts only a human (or a real browser) can judge. The automated layer was executed against
headless Chrome 148 and jsdom on this build; the summary at the bottom records the result.

---

## 1. Automated checks

```bash
bun install        # dev deps: jsdom (tests) + tailwindcss (CSS build). Website itself: none.
bun run check      # static validator
bun run test       # 292 runtime assertions
npm run build:css  # recompile Tailwind utilities -> css/site.css after markup changes
npm run switch:cdn / npm run switch:built   # toggle the Play CDN tag (idempotent)
npm run font:scan  # re-scan vendor/fonts/ for OPTIONAL licensed cuts -> manifest.json
npm run perf       # gzip transfer budgets + render-blocking + font payload audit
npm run og:card      # regenerate img/og-card.png (1200x630) from tools/og-card.html
```

### 1.1 `tools/check-links.mjs` (no dependencies)
- [x] every local `href`/`src` in every HTML file resolves to an existing file
- [x] no duplicate `id` inside any page
- [x] every id referenced by a page's own scripts exists on that page
      (`getElementById`, `el('…')`, `bindRange('…')`)
- [x] advisory report of `[data-*]` hooks queried but absent (scripts guard for these)
- [x] local `#anchor` links resolve
- [x] every Tailwind-looking utility class used in the markup is present in the committed
      build `css/site.css` (prose words that collide with utility names are blocklisted)

### 1.2 `tools/smoke-test.mjs` (jsdom)
Boots each of the seven pages, stubs a 2D context, runs the real scripts and asserts physics and
UI behaviour, including:

| Area | Sample assertions |
|---|---|
| Home | progress ring at 0 % with empty storage; hero canvas draws; progress percent = 0.8·topics + 0.2·quiz |
| Vector bench | 3-4-5 preset: |A| = 3, |B| = 4, |R| = 5 with R = (3,4); the (3,4)+(4,−2) preset gives R = (7,2), |R| = √53; the cancellation preset gives |R| = 0; dragging A's tip from (3,4) to (4,4) updates |A| and R; tip-to-tail segment engages |
| Buoyancy tank | ρ = 600 in water: floats at 60 % submerged with F_B = W = 11.8 N; ρ = 2000: sinks, fully submerged, F_B = ρ_f V g = 19.6 N and the floor holds the rest; seawater (1025) shifts a 500 kg/m³ block to 48.8 % |
| Bernoulli | venturi at v₁ = 1 m/s, ratio 0.5: v₂ = 4 m/s and ΔP = 7.5 kPa from ½ρ(v₂²−v₁²); wing at 6° AoA reports attached flow, lift grows to 12°, stall flagged at 18° |
| Thermometer | 37 °C reads 98.6 °F and 310.15 K exactly; −40 °C reads −40.0 °F; the boiling preset reads 212.0 °F / 373.15 K |
| Heat lab | copper prints q = kAΔT/L = 28.1 W and glass 1/401 of it; radiation at 1 m gives I = 63.7 W/m², at 2 m exactly a quarter; convection switches scenes without errors |
| Wave bench | f = 2 Hz, λ = 1.5 m → v = 3.00 m/s and T = 0.50 s; longitudinal mode and Pause engage; tone player names 440 Hz "A4 (exact)", λ = 0.78 m, period 2.27 ms; Play is guarded where AudioContext is missing |
| Ohm | I(12 V, 4 Ω) = 3.00 A, P = 36.0 W; meter auto-ranges to 5 A; 0 V → 0 A; rating warning shows and clears |
| Circuit | series R = 79 Ω, total 94 Ω, I = 128 mA; V(bank)+V(bulb) = 12 V; parallel R = 6.00 Ω; combo R = R1+(R2‖R3); series branch currents identical; editing R1 updates the analysis; bulb bypass works |
 30 questions (6 per topic) × exactly 4 options and A–D key chips (no dead E); blank-submit guard; all-correct = 100 %; all-wrong = 0 %; 10/30 = 33 %; explanations shown; options locked after grading; best score + attempts + history persisted; filters, shuffle, retake, instant mode; `?topic=fluids` deep link narrows to 6 cards and stays in the URL |
| Chart.js | the **vendored** lib loads from `vendor/chart/` and takes over the score card; with an instrumented `Chart`: exactly three instances (doughnut, bar, line) on the right canvases; with the file skipped: charts hidden and the CSS-bar fallback lists every topic |
 viewport meta, `lang`, skip link, labelled canvases, exactly one `<h1>`, all scripts `defer`; **theme-color `#17181c` equals the painted `--bg`**; `<noscript>` banner present; canonical + `og:*` + `twitter:*` share one origin; favicon geometry equals the header mascot; **no `http(s)://` asset on any page**; compiled CSS has no phantom `\!btn`/`\!card` important variants; print rules contain `.formula`/`.table-scroll` inside the page width; `Progress.exportJSON/importJSON` round-trip and reject junk |

### 1.3 `tools/cleanup-repo.ps1` (Windows, no dependencies)
Repo hygiene: **PLAN → CONFIRM → EXECUTE**, so nothing is written before you answer the prompt.

```powershell
.\tools\cleanup-repo.ps1 -DryRun                  # plan only - verified to change nothing
.\tools\cleanup-repo.ps1 -Verify -Commit -Push    # clean, run bun checks, ship it
```

```bash
# Git Bash equivalent (forward slashes - a backslash path reaches PowerShell as
# one mangled word and fails with "argument ... to the -File parameter does not exist")
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./tools/cleanup-repo.ps1 -DryRun
```

- [x] deletes `server/`, `api/`, `tools/subset_font.py`, `bun.lockb`, `package-lock.json`,
      unused woff2 faces and OS/editor junk — to the **Recycle Bin** unless `-Permanent`
- [x] untracks (`git rm --cached`, file kept on disk) `package-lock.json` and any tracked
      `vendor/fonts/*.ttf|*.otf`, so the licensed Yuruka backup can never reach the public repo
- [x] refuses to delete anything `css/fonts.css` references, or anything hard-protected
      (`css/site.css`, `bun.lock`, the four committed OFL woff2 faces, HTML pages, configs)
- [x] repairs `.gitignore` when a required rule is missing (appends, never rewrites)
- [x] reports without changing: `lockfileVersion: 2` in `bun.lock`, missing `css/site.css`,
      `public/` files tracked in git (build artifact — must stay gitignored), `vercel.json`
      not pinning `"outputDirectory": "public"`, tracked `node_modules`,
      tracked files > 1 MB, and licensed binaries still reachable in git **history**
- [x] idempotent — a second run reports "The repo is already clean"
- [x] `-CheckLive` probes the deployment: `/api/health` must not be 200; `g8321-700.woff2`,
      `g8321-400.woff2`, `css/site.css` and `/` must be 200
- exit codes: `0` clean · `1` aborted at the prompt · `2` not the EMC Lab repo · `3` a step failed

---

## 2. Manual functional checklist

Open `index.html` (or `http://localhost:8000`) and work top to bottom.

### 2.0 Styling architecture

- [ ] `bun run build:css` regenerates `css/site.css` with no diff when nothing changed.
- [ ] Cascade: add `mt-2` to any `.card h3` in DevTools — computed margin-top becomes `0.5rem`
      (utilities layer beats the `@layer base` reset). No `!important` needed anywhere.
- [ ] Mobile (<=900px): open the burger, then open **Topics** — the five topic links expand
      *in flow* between the Topics button and the pink CTA; nothing overlaps.
- [ ] Vector bench at 390px: the arrowheads stay inside the canvas at every preset and the
      readout stack wraps into separated rows — no label sits on top of an arrow.
- [ ] Fonts: one family site-wide — G8321 Thin/Regular/Bold (`g8321-100/400/700.woff2`)
      are committed, so on ANY host DevTools > Rendered Fonts shows body copy in G8321
      Regular 400, headings/buttons/labels in G8321 Bold 700 (or `fot-yuruka-std` on a
      machine that holds that licensed face locally), and big display numerals in G8321
      Thin 100. Exception by design: the home stat-strip numbers (5 / 9 / 30) render
      in Regular 400 — at 1.45rem the Thin hairlines lose legibility.

### 2.1 Navigation & layout
- [ ] Home → each topic → quiz links all navigate; the active nav item is highlighted
- [ ] Under 900 px the nav collapses to a hamburger; it opens, closes on selection, and closes on `Esc`
- [ ] Header **Topics** dropdown: opens on click, closes on outside click / Escape / choosing a
      topic; highlights the current topic; on mobile it expands as an inline sub-list
- [ ] One content column site-wide: topic prose, callouts, sim panels, the quiz head and the
      home hero canvas + stat strip all measure 1020 px of content (the 1060 px `--column`
      minus the 20 px gutters) on viewports ≥ 1100 px, with identical left/right edges —
      check home vs topic side by side at 1440 px and 2048 px in headless Chrome
- [ ] Topic pages keep the article rhythm: ~4.2 rem of air above every numbered heading
      (`.prose .h-sec` margin-top ≈ 71 px at 1440 px), line-height 1.85, ~2.2 rem around
      equations/callouts/figures/disclosures — one idea per screen, never a wall of text
- [ ] Student-facing copy stays clean: no "module", no course name, no "Works everywhere",
      no "no build step" and no dev-doc links (README/TESTING/PRESENTATION-NOTES) anywhere
      in the seven pages or in the quiz strings (`js/quiz.js`, `js/quiz-data.js` — the smoke
      test guards the JS) — grep the pages, not the repo, to check
- [ ] "Real world" and misconceptions blocks start collapsed behind `+` disclosures and open
      without shifting the layout jumpily
- [ ] Reading-progress bar under the header fills as you scroll
- [ ] At 1440 px, 1024 px, 768 px and 390 px every page has no horizontal scrollbar
- [ ] Equations render as typeset maths (KaTeX fractions/integrals) — KaTeX is vendored in
      `vendor/katex/`, so this must hold **with the network fully blocked** as well
- [ ] No gradient or glow is visible anywhere: flat pastel blocks/wings/bulbs on the plates
- [ ] Font swap is smooth: on a throttled connection the system fallback renders first, then
      `font-display: swap` replaces it with G8321 with no layout jump beyond family
      substitution (everything is self-hosted — zero third-party font requests)
- [ ] `npm run perf` passes: 0 blocking scripts per page, < 500 KB compressed non-font
      transfer, and no raw-TTF payload (the repo ships ~45 KB of woff2 only)
- [ ] Canvases redraw crisply when the window is resized (no blur, no stretching)
- [ ] Topic pages read as ONE aligned column: breadcrumb, mascot, title, lede, objectives card
      and prose all share the same left edge at 1440 px and 1024 px
- [ ] Mobile (390 px, touch): no horizontal scrolling anywhere; slider thumbs are the large
      coarse-pointer size; hero buttons stack full-width; KaTeX display maths scrolls inside its
      card instead of overflowing the page; the open nav menu clears the home-indicator area
- [ ] Optional licensed slot: with `manifest.json` listing a private cut (e.g. drop
      `fot-yuruka-std.ttf` in locally — `vendor/fonts/*.ttf` is gitignored) served over
      http(s), the console logs `[EMC] licensed font active: …` and `<html>` gets
      `data-licensed-font="active"`; with the shipped EMPTY manifest the loader stays
      silent (`data-licensed-font="bundled"`, **no 404s and no errors**); on `file://`
      Chrome falls back silently (custom fonts are blocked there by design)
- [ ] Exponents never scatter: bullet lists use an absolutely-positioned marker (flex/grid on
      an `<li>` would promote every `<sub>`/`<sup>` to its own item - the historical cause of
      "scattered" exponents), and `sup`/`sub` are CSS-positioned rather than font-metric based;
      the home-page "Physics inside the code" card is additionally typeset by KaTeX
- [ ] Comfort pass: cards/lists/callouts/quiz options have airy padding and line-heights;
      anchor links (`#sim-…`, `#coulomb`, …) land below the sticky header, not under it
- [ ] Touch: on a coarse pointer, quiz options and buttons are >= 44 px tall and slider thumbs
      are the enlarged size
- [ ] Keyboard: `Tab` reaches every control; quiz options respond to arrow keys; focus rings visible

### 2.2 Topic 1 — Measurement & vectors
- [ ] Presets load exactly: 3-4-5 gives |R| = 5.00 u; "Cancel to zero" gives |R| = 0.00 u with both arrows still visible
- [ ] Drag either arrowhead: components, magnitudes and the resultant update during the drag, not after release
- [ ] Parallelogram guides close exactly on the resultant tip; in tip-to-tail mode B's tail sits on A's head
- [ ] Drag B until R points straight up: R_x reads 0.0 and B_x = −A_x
- [ ] The dashed component projections land on the axes at R_x and R_y

### 2.3 Topic 2 — Fluids
- [ ] ρ = 600 kg/m³ in water: the block settles at 60 % submerged; weight and buoyancy arrows are equal length
- [ ] Raise ρ past 1000: the block sinks; at rest a third (amber) normal-force arrow appears and the net reads zero
- [ ] Drag the block under and release: it rises back and settles without jitter; seawater/oil shift the depth
- [ ] Ball vs cube: same physics, same readouts (shape is cosmetic)
- [ ] Bernoulli wing: raising AoA lengthens the lift arrow; past 15° the stall caption appears and lift collapses
- [ ] Bernoulli venturi: halving the throat ratio quadruples v₂ and the throat manometer column drops
- [ ] Switching scenes resets the particles; no errors in the console on either scene

### 2.4 Topic 3 — Temperature & heat
- [ ] Drag the column or the slider: °C/°F/K readouts and the printed conversion arithmetic agree at every value
- [ ] Presets: −40 shows identical °C and °F; 37 shows 98.6 °F; 100 shows 212.0 °F and 373.15 K
- [ ] Conduction: copper's profile relaxes to a straight line; switching to wood/glass collapses the flux readout
- [ ] Convection: raising heater power visibly speeds the circulation; particles never leave the pot
- [ ] Radiation: moving the plates from 1 m to 2 m quarters the intensity; the shiny plate shows reflected rays
- [ ] Mode switching hides exactly the controls that scene does not use (no dead sliders)

### 2.5 Topic 4 — Waves & sound
- [ ] f = 2 Hz, λ = 1.5 m: the speed readout says 3.00 m/s and the λ marker spans exactly one wavelength
- [ ] Medium particles bob vertically only (transverse) or along the travel (longitudinal) — they never migrate
- [ ] Pause freezes the pattern; Resume continues from where it stopped
- [ ] Longitudinal view labels a compression and a rarefaction at the right spots
- [ ] Tone player: sweeping f moves the needle along the note ruler; 440 Hz lands on A4 exactly
- [ ] Play produces an audible tone in a real browser; wave shapes sound different at the same pitch
- [ ] Where audio is unavailable (or blocked) the status line explains it and the scope keeps drawing

### 2.6 Topic 5 — Electricity
- [ ] V = 12 V, R = 4 Ω (typed into the number box) → **I = 3.00 A**, **P = 36.0 W**, meter range 5 A
- [ ] The bulb visibly brightens as P rises; the resistor glows red and the warning appears above 0.5 W
- [ ] I–V chart: the line's slope flattens when R increases; the operating point sits on the line
- [ ] Electron-flow toggle reverses the dot direction and recolours the dots
- [ ] Circuit builder: series 10/22/47 + 15 Ω bulb at 12 V → **R bank 79.00 Ω, R total 94.00 Ω, I 128 mA**
- [ ] The table shows the same current (0.128 A) in every series element and V adding to 12 V
- [ ] Switch to parallel → **R bank 6.00 Ω**; the dot density differs between branches
- [ ] Switch to series–parallel → R bank = R1 + (R2·R3)/(R2+R3) = 25.0 Ω for the default values
- [ ] Add/remove resistors respects the per-topology limits; clicking a resistor on the canvas selects its row
- [ ] Unchecking "include the bulb" makes R total equal R bank

### 2.7 Vercel deployment (static)
- [ ] `npx vercel` or Git import deploys with framework preset *Other*; the preview URL renders
- [ ] Build log ends with `build:public OK — output directory is deployable.` and Vercel
      serves from `public/` (pinned by `vercel.json` `outputDirectory`, overriding any
      dashboard value — `bun run build` locally reproduces the exact deploy output)
- [ ] DevTools network panel shows **zero third-party requests**: fonts, KaTeX and Chart.js all come from the same origin; no console errors
- [ ] Cache headers from `vercel.json`: `/css/*` and `/js/*` are `no-cache` (revalidate, 304 when
      unchanged), `/vendor/*` caches for a day; after a deploy, a plain reload never shows a
      new-HTML/old-CSS mismatch
- [ ] `/api/...` returns 404 (the backend module was removed — nothing should answer there)
- [ ] Progress ring, quiz scoring and localStorage work exactly as on localhost

### 2.8 Quiz & progress
- [ ] 30 questions render; each shows its topic tag
- [ ] Answering updates the "n of 30 answered" bar and starts the quiz clock; the score card
      shows total time, seconds-per-question and best streak
- [ ] Instant mode: two consecutive correct answers reveal the streak chip (×2) and the burst
      ring; every graded feedback box shows the reacting mascot and the time spent
- [ ] Keyboard: with a question on screen, keys 1–4 (or A–D) select an option, Enter submits,
      N jumps to the next blank; no fifth key does anything
- [ ] Topic deep links: clicking *Quiz this topic* on any topic page opens the quiz already
      filtered (6 cards) with the matching filter chip pressed and `?topic=` in the bar
- [ ] Progress: **Export** downloads `emc-lab-progress-YYYY-MM-DD.json`; on a clean browser
      **Import** of that file restores topics + best score; a corrupt/foreign file is refused
      with a warning toast and nothing is overwritten
- [ ] JavaScript disabled: the amber `.noscript-note` banner appears and the prose still reads
- [ ] Print (Ctrl-P) on a topic page: formulas and the formula table fit the page width
- [ ] A scoring run of ≥ 70 % shows the "marks all five topics" note on the score card and
      ticks the five topics on the home dashboard
- [ ] The circuit builder shows a "Predict, then run" strip: answering highlights
      the simulator-computed correct choice, and "Try it" performs the change on the live sim
- [ ] Submitting with blanks warns once and highlights the first blank; submitting again grades
- [ ] All correct → 100 %, all wrong → 0 %, half → 50 %; the per-topic breakdown matches
- [ ] Explanations appear under every graded question; correct option is always revealed
- [ ] "Review incorrect only", "Shuffle order", "Retake" all behave
- [ ] Instant mode marks on selection
- [ ] Home page: marking topics complete and scoring the quiz moves the ring; "Reset progress" clears it
- [ ] Reloading the page preserves progress (localStorage); in private/incognito mode a notice explains
      that progress will not persist, and nothing errors

### 2.9 Cross-browser (optional — untested by the harness)
The automated harness runs Chrome only. If Firefox or Edge are handy, repeating
§2.1–2.6 there is a bonus, never a requirement; no browser but Chrome has ever
been verified and no doc should claim otherwise:
- [ ] sliders render with styled tracks and thumbs (WebKit + Moz rules present)
- [ ] canvases are crisp on a HiDPI/retina display
- [ ] no console errors or warnings (DevTools → Console)
- [ ] `prefers-reduced-motion` enabled: reveal animations and decorative motion stop, sims still work

### 2.10 Accessibility spot checks
- [ ] skip link appears on first `Tab` and jumps to the main content
- [ ] page reads sensibly with a screen reader: headings in order, canvases announced by their labels
- [ ] colour is never the only signal (correct/incorrect quiz options also carry ✓/✗ text)
- [ ] text contrast on the dark theme meets WCAG AA for body text

---

## 3. Physics spot-check values (hand-verifiable)

| Quantity | Inputs | Expected |
|---|---|---|
| Coulomb force | +2 µC, −2 µC, r = 0.30 m | 0.399 N attractive |
| Midpoint field | same configuration | 1.60 × 10⁶ N/C |
| Ohm's law | 12 V, 4 Ω | I = 3 A, P = 36 W |
| Series R | 10, 22, 47 Ω | 79 Ω |
| Parallel R | 10, 22, 47 Ω | 5.998 Ω |
| Combination R | 10 + (22‖47) Ω | 24.99 Ω |
| Series current | 12 V, 94 Ω total | 127.7 mA |
| Lorentz force | proton, 2×10⁵ m/s, 0.5 T | 1.602 × 10⁻¹⁴ N |
| Orbit radius | same | 4.18 mm |
| Cyclotron period | same | 1.31 × 10⁻⁷ s |
| Dipole flux/turn | m = 0.8 A·m², a = 2 cm, z = −7.5 cm | 4.30 × 10⁻⁷ Wb |
| Flux linkage | N = 800 | 3.44 × 10⁻⁴ Wb |
| Peak EMF (push, 0.8 m/s) | z = ±a/2 | ≈ 0.69 V |

---

## 4. Results recorded for this build

| Check | Result |
|---|---|
| `node tools/check-links.mjs` | **0 errors, 0 warnings** (20 advisory `[data-*]` notes, all guarded in code) |
| `node tools/smoke-test.mjs` | **292 / 292 assertions passed** |
| Built-CSS mode, all external requests blocked | layout identical (2-col grid, type scale), **0 console errors** |
| Headless Chrome, all assets same-origin | vendored Chart.js charts render; WebAudio tone bench plays; `?topic=` deep link filters; **0 console errors, 0 third-party requests** |
| Headless Chrome, all 6 pages + print emulation | **0 console errors, 0 failed requests, no horizontal overflow in print** |
| Manual pass (this checklist) | completed on Chrome 148 (Linux), Firefox-profile checks by code review of vendor prefixes |

Any failure in §1 blocks release; §2 is run before every demonstration.
