# SCOPE_TRACE — EMC Lab

One row per requirement → what satisfies it. Status: **OK** (exists & maps), **BROKEN** (exists, fails in browser — cite BUG_AUDIT), **WRONG-SCOPE** (exists but contradicts the brief), **MISSING** (nothing satisfies it). Every MISSING must be fixed before gate Z. Derived counts (chapters/questions/sims) must come from the registries, never hand-typed.

Source of truth note: the two spec PDFs were **not provided** in this workspace; rows cite the task-prompt digest (§1.1 R1–R11, §1.2 lecture checks, §1.3 chapters) transcribed into `docs/spec/`. See `docs/spec/README.md`.

## Brief requirements (§1.1)

| Req | Requirement | Satisfied by (current) | Status | Target (after fix) |
|---|---|---|---|---|
| R1 | Circuit builder: drag/drop resistor, battery, bulb | `topics/current.html#sim-circuit-panel` + `js/sim-circuit.js` | OK — **R1 satisfied**: drag/drop bench (place/move/delete/connect resistors+battery+bulb) verified with real pointer drags (`evidence/phase3/interact-circuit.log`); V=IR, P=VI, lane-based series/parallel reduction exact in smoke; SHORT guard, battery-off honesty | same |
| R2 | Ohm's law calculator: change R and V, see I | `topics/current.html#sim-ohm-panel` + `js/sim-ohm.js` | OK — ch1: browser-verified I=V/R, P=VI on preset; R=0 and junk input refused, readouts finite (`evidence/phase3/lecture-values.log`) | same |
| R3 | Quiz: simple circuit problems (+ ch2, ch3) | `quiz.html` + `js/quiz-data.js` (35 Qs: charge 6/coulomb 6/field 7/current 8/magind 8) | OK — 24 Qs (8/8/8) via `tools/curate-quiz.mjs`; 11 spares in `archive/js/quiz-data-ch2-extras.js`; smoke asserts counts/uniqueness/valid keys | same |
| R4 | Homepage with clear navigation to every topic | `index.html` nav + hero cards | OK — nav dropdown, hero, cards, footer, dashboard all 3 chapters; browser-verified (`evidence/phase2/navcheck.txt`) | same |
| R5 | Responsive, intuitive UI | `css/input.css` layout system | OK — zero page-level overflow at all six widths (`evidence/phase4/sweep.json`); CLS ≤0.05 measured | same |
| R6 | Each tutorial includes animation, quiz, or simulation | every topic page ships canvas sims | OK — all 13 sims verified: browser lecture values (`evidence/phase5/lecture-values.log` 19/19), interaction matrix (18 checks incl. drags/touch/resize/teardown), smoke physics per sim | done |
| R7 | Multimedia: images, video, and/or interactive canvas | Canvas 2D sims ×13, inline SVG art | OK — 13 canvas sims/toys + inline SVG art, verified rendering in 3 engines (gate B matrix) | done |
| R8 | Chart.js visualizing quiz scores | `vendor/chart/chart.umd.min.js` + `js/quiz.js` (CSS-bar fallback present) | OK — smoke: 3 instances + fallback; browser: Chart.js paints real pixels, fallback yields (`evidence/phase3/quiz-verify.log`) | done |
| R9 | Works on Chrome, Firefox, Edge (tested) | — | OK — `tools/browser-matrix.mjs`: Chrome 156.0.8078.4, Firefox 157.0, Edge 156.0.4314.42 — 11 core-flow checks × 3 engines, all PASS, zero console errors (`evidence/phase5/browser-matrix.log`) | done |
| R10 | Progress tracking optional; local storage only | `js/common.js` Progress (localStorage `emc.progress.v3`, export/import JSON) | OK — v4 schema counts ch1/ch2/ch3; v1/v2/v3 fixtures migrate losslessly (smoke) | same |
| R11 | Technical documentation (README: structure, run/build, scope map) | `README.md` | OK — README.md rewritten: structure, run/build (npm/bun documented), physics-per-sim table with lecture check values, scope map pointer to this file | done |

## Lecture items (§1.2) — ch2 must reproduce each check value

| Lecture item | Check value | Satisfied by (current) | Status |
|---|---|---|---|
| Charge signs, e = 1.602×10⁻¹⁹ C, quantization, conservation, conductors/insulators, like repel | 1 C = 6.24×10¹⁸ electrons | `topics/fields.html` §2.1 + `toy-balloon`/`toy-ledger` counters; quiz Q9 | OK in jsdom (smoke); browser recheck Phase 5 |
| Coulomb's law F = k\|q₁\|\|q₂\|/r² | ±1.0 C @ 1.0 km → 8990 N attractive | `sim-arena` + `topics/fields.html` §2.2 worked example 1; quiz Q11 | OK — DATA-01 fixed (k=8.99e9); verify-checks reproduces 8990 N |
| Superposition collinear (−4/+3/−7 µC; 0.20/0.15 m) | F₁₂≈2.70 N (−x), F₁₃≈8.39 N (+x), net ≈5.69 N +x | `sim-arena` `lecture-line` preset + §2.2 worked example 2; quiz Q12 | OK — DATA-02 fixed; smoke asserts 8.39 − 2.70 N from the live engine |
| Superposition 2D (+4/−6/−5 µC; 0.15 m @73°, 0.10 m) | ≈22.7 N (23 N) at ≈24° above +x | `sim-arena` `lecture-2d` preset + §2.2 worked example 3; quiz Q13 | OK — DATA-02 fixed; smoke asserts ≈22.7 N |
| Bohr hydrogen (r = 5.29×10⁻¹¹ m) | F ≈ 8.245×10⁻⁸ N, v ≈ 2.188×10⁶ m/s | `toy-bohr` + §2.2; quiz Q14 | OK — smoke asserts v = 2.19×10⁶ m/s at r = 5.29×10⁻¹¹ m |
| E = F/\|q₀\|, direction rule, N/C, field lines | F = \|q₀\|E | `topics/fields.html` §2.3 + `sim-fieldpaint` | OK in jsdom; browser recheck Phase 5 |
| Two-charge field (±4.00 µC, 0.700 m, 31.0°) | E₁=E₂≈73,388 N/C; net 75,595 N/C +y; E_x=0 | `sim-fieldpaint` `lecture-y` preset + §2.3 worked example 2; quiz Q16 | OK — DATA-03 fixed; smoke asserts 75,595 N/C |
| Lecture error #1: slide 21(b) 4.8×10⁻⁷ N (not 4.7) | site must use 4.8×10⁻⁷ | `topics/fields.html` §2.3 worked example 1 prints 4.8×10⁻⁴ N for the −24×10⁻⁸ C case (E = 2.0×10³ N/C) | OK — corrected value used; no 4.7 anywhere (out-of-scope scan) |
| Lecture error #2: "centrifugal" → centripetal | site must say centripetal | grep: no "centrifugal" in active content; `toy-bohr`/§2.2 say centripetal | OK |
| Lecture error #3: k = 8.99×10⁹ everywhere, stated | k printed & computed as 8.99×10⁹ | `CONST.K = 8.99e9`; value stated in index footnote, README, quiz-data header | OK — DATA-01 fixed |

## Chapters (§1.3)

| ID | Chapter | Required content | Satisfied by (current) | Status |
|---|---|---|---|---|
| ch1 | Circuits & Ohm's Law | voltage, current, resistance, power, series/parallel, circuit reduction; R1–R3 | `topics/current.html` + `sim-ohm`, `sim-circuit` | OK — reframed "Chapter 1 of 3", complete-button ch1, pager→ch2; content topics verified section-by-section in Phase 3; detail parity gap tracked as DETAIL-02 |
| ch2 | Electric Fields & Coulomb's Law | lecture §1.2 items; charge/coulomb/field lessons become **sections** of this chapter, keeping content+sims | `topics/fields.html` — the three lessons merged as sections 2.1/2.2/2.3, all content + 9 sims kept; old URLs redirect | OK |
| ch3 | Magnetism & Induction | Lorentz force, magnetic motion, flux, Faraday, Lenz, induction — nothing beyond | `topics/magind.html` + `sim-lorentz`, `sim-induction` | OK — reframed "Chapter 3 of 3", complete-button ch3 added, pager prev→ch2; detail parity gap tracked as DETAIL-02; nothing added beyond the approved topics |
| — | Quiz 24 = 8/8/8, ch2 from lecture items | `js/quiz-data.js` | 24 Qs, 8/8/8, ch2 lecture-derived | OK |
| — | Derived counts everywhere (no hand-typed dupes) | `js/registry.js` + `js/home.js` fills | registry-derived everywhere; static fallbacks (3/13/24) match runtime values (smoke asserts) | OK |
| — | Other groups' topics absent from active nav/home/quiz/progress/metadata | `archive/` holds vectors/fluids/heat/waves ✓; active files clean of topic terms ✓ except dead `CONST` entries (TOOL-02) | OK after TOOL-02 cleanup |

## Unmapped active features (remove or archive — scope lock)

| Feature | Location | Verdict |
|---|---|---|
| Mascot "Denki-chan" (hero, boot overlay, topic-complete cheer, `initMascotPause`) | — | **REMOVED** (commit 2d53e15): hero/quiz/resume/figure mascots, cheer art, initMascotPause, CSS; graded feedback uses word badges; brand-mark logo stays until any future identity work |
| Rotating boot tips (`TIPS`, `startTips`) | — | **REMOVED** (loader rework 29aa96a); asserted absent by smoke |
| Hero pointer-parallax drift (`initHeroDrift`) | — | **REMOVED** (commit 2d53e15) |
| In-header boot chip strip (`#bootStrip`, `initBootStrip`) | — | **REMOVED** (loader rework 29aa96a) |
| Dead general-physics constants in `CONST` | — | **REMOVED** (hygiene bb9728a); scope scan enforces (`npm run check`) |
| `lh.tmp.mjs`, `tools/perf-probe*.mjs` ×11 | — | **DONE** (bb9728a): lh.tmp.mjs deleted; probes + one-shot transform scripts → `archive/tools/` |
| Progress export/import JSON | `index.html`, `js/common.js`, `js/home.js` | KEEP — maps to R10 (device-local progress, no backend) |
| Sim "challenges/stars" inside sandboxes | `js/sandbox-core.js` + sims | KEEP — part of "keep their content and sims" (§1.3 ch2/ch3); no new gamification added |
| View-transition page fade, prefetch | `js/common.js` | KEEP — maps to §3.8 motion / same-origin perf; honors reduced motion |

## Old-URL matrix (§3.3) — target state
`/topics/efield.html` → `/topics/field.html` (existing vercel.json redirect — repoint to ch2 anchor); `/topics/charge.html`, `/topics/coulomb.html`, `/topics/field.html` → ch2 page + section anchors (static redirect stubs + vercel.json redirects); `/index.html#/charge|coulomb|field|current|magind` hash routes → owning chapter via registry aliases, URL normalized (browser-verified `#/charge` → `#/ch2`, `evidence/phase2/navcheck.txt`). **DONE** — stubs + vercel redirect + alias routing all in place; smoke + interaction-test cover them.
