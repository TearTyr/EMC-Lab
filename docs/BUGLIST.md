# EMC Lab — bug & duplication inventory (perf/optimize)

Phase 1–2 deliverable. Every suspect below was checked against the actual source at
commit `e537678` (branch `perf/optimize`). Severity: P0 crash/leak/runaway ·
P1 measurable jank or substantial perf · P2 polish/lower impact.
Status: CONFIRMED (verified, needs fix) · NOT-A-BUG (verified absent/benign) · FIXED (Phase 3+).

Line numbers refer to the baseline commit.

---

## 1. Memory & resource lifecycle

| ID | Suspect | Finding | File:line | Sev | Evidence | Proposed minimal fix | Status |
|---|---|---|---|---|---|---|---|
| M1 | Uncapped/large canvas backing stores | DPR **is** capped at 2; backing = CSS × min(DPR,2), matches visible box; ≤4.42 MB/page mobile | `js/common.js:108` | – | baseline.json canvases: 349×320 css → 698×640 dev at DPR3 | none (cap already correct); revisit only if mobile budget still missed after P1 fixes | NOT-A-BUG |
| M1b | backing realloc churn | `resize()` early-returns when w/h/dpr unchanged; RO + window resize are the only triggers | `js/common.js:104-116,120-123` | – | code read | none | NOT-A-BUG |
| M2 | Offscreen sims retain resources | rAF pauses offscreen (IO), canvas/state retained by design; init is eager (see C5) | `js/common.js:128-134` | P2 | probe1: raf=0 at top & footer on topic pages | optional late-init (C5); no forced teardown (churn risk) | CONFIRMED (partial, via C5) |
| M3 | Per-frame allocations | `label()` builds a font string per call; readout template strings per frame in animating sims | `js/common.js:234`; `js/sim-archimedes.js:57,144-163`; `js/sim-heat-transfer.js:238,243-280`; `js/sim-bernoulli.js:185,190-215` | P1 | probe3: continuous 50–70 ms mobile long tasks while idle in view | cache font strings per (weight,size); write readouts only on change / ≤15 Hz via shared helper | CONFIRMED |
| M4 | Chart.js recreated without teardown | charts **are** destroyed before re-create and on retake | `js/quiz.js:398-399,413-414` | – | code read + smoke test asserts destroy counts | none | NOT-A-BUG |
| M4b | Audio node retention | one shared AudioContext (good); per play: osc+gain created, osc stopped, refs nulled — but gain stays connected to analyser until next play; context never suspended when idle | `js/sim-sound.js:25-40` | P2 | code read | `gain.disconnect()` in `audioStop`; `actx.suspend()` after stop (resume on gesture preserved) | CONFIRMED |
| M5 | Unbounded collections | particles fixed caps (70/46/≤34), toasts self-remove, quiz history capped 20, streak bursts are CSS-only | `js/sim-heat-transfer.js:51`; `js/sim-bernoulli.js:51`; `js/common.js` toast; `js/common.js` quizHistory slice | – | code read + 10-min session slope +0.87 MB | none | NOT-A-BUG |
| M6 | Duplicate KaTeX rendering | second pass is a guarded no-op walk (`data-texDone`); the *first* synchronous typeset is the cost (see C5/N2) | `js/common.js` katexify guard; boot + `load` calls | – | code read | no duplicate-render fix needed; address boot cost under C5 | NOT-A-BUG (dup), cost moved to C5 |

## 2. CPU, rendering, animation

| ID | Suspect | Finding | File:line | Sev | Evidence | Proposed minimal fix | Status |
|---|---|---|---|---|---|---|---|
| C1a | Duplicate rAF chain | constructor `start()` + IO first callback both enter `_tick()` → **two live chains** (double render rate) on canvases visible at boot; IO resume path can duplicate again after re-entry | `js/common.js:97-100` + `js/common.js:133` | P1 | probe1: index raf=2 (single Stage on page); topics raf=1 only because sims start offscreen | guard `_tick()` re-entry (chain token / `_raf` liveness check) in Stage | CONFIRMED |
| C1b | No hidden-tab pause in code | Stage reacts only to IntersectionObserver; synthetic `visibilitychange` leaves chains running | `js/common.js:128-134` (no `visibilitychange` anywhere in `js/`) | P1 | probe1 hidden-probe: index 2, fluids/waves/current 1 chains still pending | add `visibilitychange` pause/resume in Stage (shared, one place) | CONFIRMED |
| C1c | Idle redraw of settled scenes | archimedes at rest, heat at steady state, sound scope not playing: full redraw every frame forever | `js/sim-archimedes.js:44-58`; `js/sim-heat-transfer.js:232-240`; `js/sim-sound.js:105-160` | P1 | probe3 idle window long tasks; raf=1 while nothing moves | Stage dirty-flag API (`stage.invalidate()`); sims mark dirty on state change / while animating quantities change | CONFIRMED |
| C1d | reduced-motion | mascot CSS honours it (`css/input.css:529`); canvas sims do not | `css/input.css:529` vs Stage | P2 | code read | honour `prefers-reduced-motion` for nonessential canvas motion (static frame + on-demand redraw) | CONFIRMED |
| C2a | Per-frame layout read | `_tick()` calls `this.resize()` → `getBoundingClientRect()` every frame per canvas | `js/common.js:157` (inside `_tick` 150-160) | P1 | code read; contributes to every animating frame | resize only from RO/window/dpr-change; keep cheap w/h compare | CONFIRMED |
| C2b | Per-frame DOM writes | readouts rewritten every frame (see M3) | same as M3 | P1 | probe3 | shared change-detected writer + ≤15 Hz cap for non-critical readouts | CONFIRMED |
| C3 | Unstable dt | dt clamped to 0.05 s; spring/diffusion use clamped dt; no frame-rate-dependent physics output in tests | `js/common.js:154` | – | code read + physics assertions pass | none | NOT-A-BUG |
| C4 | Mobile particle counts | 70 convection / 46 bernoulli / ≤34 circuit dots; cost not isolated from C2/M3 raster cost | `js/sim-heat-transfer.js:51`; `js/sim-bernoulli.js:49-51` | P2 | probe3 (cost present but attribution shared) | re-measure after P1 fixes; only then consider device-tier counts | CONFIRMED (deferred) |
| C5 | Eager init | every sim constructs Stage + listeners at script eval; KaTeX typesets synchronously at boot | each `js/sim-*.js` IIFE; `js/common.js` boot→katexify | P1 | load long tasks 102–359 ms | defer sim Stage creation to first approach of viewport (IO, once); typeset above-the-fold at boot, rest on idle (`requestIdleCallback` + fallback) | CONFIRMED |
| C6 | Resize feedback loops | RO callback = resize+draw once per notification; `resize()` no-ops when unchanged; no loop observed | `js/common.js:120` | – | code read + no repeating-task signature in probes | coalesce RO to one update per frame (cheap insurance) | NOT-A-BUG (harden optionally) |
| C7 | Compositing waste | no `will-change` anywhere; infinite `bob` animation on mascot (transform-only, compositor) on every page; burst animation one-shot | `css/input.css:417,405,455-456` | P2 | grep | pause `bob` offscreen/hidden via `animation-play-state` or limit to hero; keep transform-only | CONFIRMED (minor) |

## 3. Loading, assets, production output

| ID | Suspect | Finding | File:line | Sev | Evidence | Proposed minimal fix | Status |
|---|---|---|---|---|---|---|---|
| N1 | Cache headers | `/css`,`/js` no-cache; `/vendor` 1 day | `vercel.json` | P2 | file read | optional: hashed filenames + `immutable` in public build only (deploy-affecting → needs approval) | CONFIRMED (optional) |
| N2 | Unminified shipped JS | public build copies sources verbatim; 178–214 KB gzip/page, eval in load long tasks | `tools/build-public.mjs` COPY_DIRS | P1 | `bun run perf` + load long tasks | minify js (and keep css min) **in public build only**; sources stay readable; `file://` untouched | CONFIRMED |
| N3 | Font/asset fetches | manifest fetched `no-store` per page load (tiny, but always network); preloads are the two genuinely used woff2 | `js/common.js:606` | P2 | code read | serve manifest cacheable (or inline its empty default); keep licensed-slot behaviour | CONFIRMED (minor) |
| N4 | Dev files in public | allow-list copies only runtime dirs; `tools/`, docs, md excluded | `tools/build-public.mjs` | – | file read + build output 57 files | none | NOT-A-BUG |
| N5 | Stale pairings | html no-store by host default + css/js no-cache → no stale pairs observed | `vercel.json` | – | file read | none | NOT-A-BUG |
| N6 | Dev-environment disk (context for the “300 MB” report) | `node_modules` 97 MB + puppeteer Chrome 636 MB on the audit box; repo source 2.5 MB | – | – | `du` inventory in PERF.md §4 | document in README dev notes (no runtime change); optional `.gitignore`d tooling cache | NOT-A-BUG (informational) |

## 4. Interaction & accessibility

| ID | Suspect | Finding | File:line | Sev | Evidence | Proposed minimal fix | Status |
|---|---|---|---|---|---|---|---|
| I1 | Touch scroll trap | `.sim-canvas { touch-action: none }` blocks page scrolling anywhere on a 380 px-tall full-width canvas, even for sims whose drag is horizontal-only or optional | `css/input.css:257` | P1 | CSS spec behaviour + mobile viewport review | default `touch-action: pan-y`; switch to `none` on the element only while a canvas drag is active (pointerdown→up) | CONFIRMED |
| I2 | Small hit areas | vector tips 22 px radius, thermometer 60 px band, sliders coarse-sized | `js/sim-vector-add.js:41-43`; `css/input.css` coarse block | – | code read | enlarge vector-tip hit to ≥28 px effective (invisible halo) | CONFIRMED (minor) |
| I3 | Hover-only affordances | circuit “click a resistor on canvas” has no keyboard path (rows have sliders, so function is reachable) | `topics/current.html` rows | P2 | code read | document row sliders as the keyboard path (already functional) | NOT-A-BUG (alternate exists) |
| I4 | pointermove → synchronous draw | vector bench calls `refresh()` (draw + readouts) per pointermove event | `js/sim-vector-add.js:40-45,139` | P1 | code read; desktop drag = up to 120 draws/s | coalesce in Stage: store latest point, apply once per rAF | CONFIRMED |
| I5 | Viewport units | `100vh` with `100dvh` fallback present | `css/input.css:55` | – | grep | none | NOT-A-BUG |
| I6 | Blocking handlers | scroll listener passive; no unload/beforeunload anywhere | `js/common.js:492` | – | grep | none | NOT-A-BUG |
| I7 | Slider per-event full refresh | `bindRange` apply → sim refresh per input event (keyboard stepping included) | `js/common.js` bindRange; sims’ refresh | P2 | code read | same coalescing as I4 (one draw per frame max) | CONFIRMED |
| I8 | Slow interactions | INP proxy ≤120 ms (mobile quiz) — under budget but watch | baseline.json | P2 | matrix | re-measure after fixes | CONFIRMED (watch) |
| I9 | Audio gesture | resume-on-gesture present | `js/sim-sound.js:25` | – | code read | none | NOT-A-BUG |
| I10 | Quiz focus loss | graded options become `disabled`; a focused disabled button drops focus to body — keyboard user loses place | `js/quiz.js` grading path (opts disabled post-grade) | P2 | code read (single `focus()` at :242 is the N-key jump) | move focus to the card’s feedback region on grade | CONFIRMED |

---

## 5. WET audit → DRY plan

Verified duplication across the 9 sim files + 7 pages (actual counts: 13 js files, 7 pages).

| Cluster | Files & line ranges | Duplicated behaviour | Proposed shared home | Expected benefit | Risk |
|---|---|---|---|---|---|
| W1 `el()` lookup helper | all 9 `js/sim-*.js` (`sim-archimedes.js:143`, `sim-bernoulli.js:189`, `sim-circuit.js:266`, `sim-heat-transfer.js:242`, `sim-ohm.js:279`, `sim-sound.js:138`, `sim-thermometer.js:102`, `sim-vector-add.js:119`, `sim-wave.js:115`) | identical one-line DOM lookup | `EMC.el` in `js/common.js` | 9 deletions, one null-safe impl | none |
| W2 readout write + throttle | `sim-archimedes.js:144-163`, `sim-heat-transfer.js:243-280`, `sim-bernoulli.js:190-215`, `sim-ohm.js:280-300`, `sim-wave.js:120-130`, `sim-sound.js:140-152` | “set textContent if element exists” + per-frame call pattern | `EMC.setText(el, str)` (change-detected) + `EMC.throttleReadouts(fn, hz)` in common.js | kills C2b/M3 duplication in one place | low (output identical) |
| W3 pointer-drag state machine | `sim-vector-add.js:30-50`, `sim-archimedes.js:118-140`, `sim-thermometer.js:88-100` | down→hit-test→move→up + cursor swap | `Stage.onDrag({hit, move, end})` built on existing `onPointer` | one coalesced drag path (fixes I4 once) | medium (must preserve physics) |
| W4 preset-button wiring | `sim-ohm.js:336`, `sim-sound.js:182`, `sim-thermometer.js:139`, `sim-vector-add.js:144` | `querySelectorAll('[data-*-preset]')` + parse + toast | `EMC.bindPresets(attr, cb)` | 4× ~8 lines → 1 | none |
| W5 panel control visibility sync | `sim-bernoulli.js:222-228`, `sim-heat-transfer.js:278-290` | show/hide ctl wrappers per mode | `EMC.syncControls(map, mode)` | small DRY | none |
| W6 sim lifecycle (pause/hidden/dirty/resize) | every sim via `EMC.Stage` (`js/common.js:88-170`) | each sim relies on Stage but Stage itself duplicates chain/visibility/resize work per instance | **fix inside `EMC.Stage` once** (C1a/b/c, C2a): chain guard, `visibilitychange`, dirty-flag `invalidate()`, resize-from-observers-only | all 9 sims fixed with zero per-sim patches | medium (shared code, regression-tested by smoke suite) |
| W7 head/nav/footer markup | 7 pages × ~90 lines identical chrome | copy-paste chrome | **document only** — no template engine/build migration (per constraint) | awareness; future risk noted | n/a |

### Proposed shared Sim lifecycle contract (smallest compatible design)

Keep `EMC.Stage` as the single lifecycle owner; extend it rather than adding a parallel `Sim` class:

```
new EMC.Stage(canvas, render, opts)
  init      : listeners + observers only; NO rAF until start()
  start()   : single guarded chain (token check kills C1a)
  stop()    : cancel chain (already)
  invalidate(): mark dirty; animate=false sims draw on demand (vectors/thermo already)
  internal  : pause on (offscreen IO) OR (document hidden) OR (reduced-motion & nonessential)
              resume on reverse; resize only from RO / window resize / dpr matchMedia
```

Sims opt in with `stage.invalidate()` on state changes; animating sims keep `animate:true`
but may call `stage.setIdle(true)` when their state is visually settled (archimedes at rest,
heat steady, sound not playing) so Stage skips redraws until invalidated.

## 6. Proposed implementation order (Phase 3, one logical commit each)

1. `perf: guard Stage rAF chain + pause on visibilitychange` (C1a, C1b) — measure raf matrix → expect index 2→1, hidden→0.
2. `perf: resize from observers only; drop per-frame getBoundingClientRect` (C2a) — measure frame p95.
3. `perf: change-detected + throttled readouts (EMC.setText)` (C2b, M3, W2) — measure mobile idle long tasks (probe3).
4. `perf: dirty-flag idle for settled scenes (Stage.invalidate/setIdle)` (C1c) — measure idle raf/long tasks.
5. `perf: coalesce pointer & slider drags to one draw per frame (Stage.onDrag)` (I4, I7, W3) — measure drag frame times.
6. `perf: minify JS in public build only` (N2) — measure gzip transfer + load long tasks.
7. `perf: defer offscreen sim init + idle-time KaTeX for below-fold maths` (C5) — measure load LT>100 count.
8. `fix: touch-action pan-y with drag-time none; quiz focus restore; audio node disconnect; vector hit halo` (I1, I10, M4b, I2) — behaviour commits with TESTING.md procedures.
9. Optional/approval-gated: hashed immutable assets (N1), manifest caching (N3), particle tiers (C4), mascot bob pause (C7).

## 7. Phase 2 approval checkpoint (summary for review)

1. Baseline: `docs/PERF.md` (+ `docs/perf-data/*.json`, `docs/perf-shots/before/`).
2. Audited suspects: this file §1–4 (24 entries; 14 CONFIRMED, 10 NOT-A-BUG).
3. WET table + shared homes: §5 (W1–W7).
4. Implementation order: §6 (9 commits, last group approval-gated).
5. Top-3 measured problems: PERF.md §6 (mobile per-frame jank; load long tasks; lifecycle waste incl. double chain + no hidden pause).
6. Unmeasurable targets: GPU memory, true per-tab renderer footprint, `measureUserAgentSpecificMemory` (needs COOP/COEP), real-device touch/Safari/Firefox (PERF.md §5).
7. Risky proposals needing explicit approval: **N1** (deploy cache headers/hashed filenames touch `vercel.json` behaviour), **C5** (deferred init changes first-paint timing of sims), **C1d** (reduced-motion alters canvas behaviour for motion-sensitive users), public-build minification (N2) changes deployed bytes only. Licensing/Git-history: untouched.

**Awaiting explicit approval before any application-code change.**

---

## 8. Phase 3–4 final statuses

| ID | Final status | Fix commit | Evidence |
|---|---|---|---|
| M1 / M1b | NOT-A-BUG | – | DPR capped at 2; backing matches CSS box; resize early-returns |
| M2 | FIXED | 584a017 | boot backing 1.28–3.67 → 0.17–0.51 MB (after.json) |
| M3 | FIXED | 467ebef | font-string cache + setText + 15 Hz readout cap; idle LayoutCount 120 → 0 |
| M4 | NOT-A-BUG | – | charts destroyed before re-create (quiz.js:398,413) |
| M4b | FIXED | 67f3371 | osc/gain disconnect on ended; context suspends when idle |
| M5 | NOT-A-BUG | – | all collections bounded; session slope unchanged |
| M6 | NOT-A-BUG | – | second KaTeX pass was a guarded walk; boot cost moved to C5 |
| C1a | FIXED | 78445ed | home chains 2 → 1 (probe) |
| C1b | FIXED | 78445ed | hidden-probe chains 1–2 → 0 |
| C1c | FIXED | 467ebef | settled sims 1 → 0 chains; guard-enforced |
| C1d | FIXED | 1b4c115 | PRM: 0 chains, controls still redraw (verified emulated) |
| C2a | FIXED | 54ece11 | gBCR 120 → 0 per 2 s idle |
| C2b | FIXED | 467ebef | mobile idle long-task series → zero |
| C3 | NOT-A-BUG | – | dt clamped; physics assertions unchanged (292/292) |
| C4 | FIXED | 21ee722 | 30 fps cap + particles 70→42 / 46→30 on tier; motion tasks halved in rate |
| C5 | FIXED | 584a017 | whenNear lazy init + idle-time KaTeX |
| C6 | NOT-A-BUG | – | no feedback loop observed |
| C7 | FIXED | 6439e42 | mascot bob paused offscreen |
| N1 | FIXED | 1bbb629 | hashed immutable assets; repeat transfer 0 for our js/css |
| N2 | FIXED | 1defb22 | public js gzip 65.6 → 45.8 KB |
| N3 | FIXED | 6439e42 | manifest uses HTTP cache |
| N4 / N5 | NOT-A-BUG | – | allow-list clean; no-cache prevents stale pairs |
| N6 | NOT-A-BUG (info) | – | 300 MB = dev disk / whole-browser attribution (PERF.md §4) |
| I1 | FIXED | 67f3371 | pan-y default, none only during active canvas drag |
| I2 | FIXED | 67f3371 | 30 px hit halo |
| I3 | NOT-A-BUG | – | keyboard path exists via row sliders |
| I4 / I7 | FIXED | 9d7ea63 | pointer burst + invalidation coalesced to 1 draw/frame |
| I5 / I6 / I9 | NOT-A-BUG | – | dvh present; passive scroll; resume-on-gesture |
| I8 | CONFIRMED (watch) | – | INP proxy ≤120 ms after (no regression); budget met |
| I10 | FIXED | 67f3371 | focus moves to feedback / score card on grade |

**Not fixed / accepted:** load long tasks >100 ms on emulated mobile (2–5 per page)
and the mobile 24 ms frame target — both attributed by CPU profile to first
paint/raster inside Blink under headless software raster + 4× throttle, with app
JS ≈2–3 %; the 30 fps device cap is the deliberate, measured trade. Flagged for
real-device verification (needs-human).

**WET clusters deliberately NOT extracted:** W1 (`el()` one-liner), W4 (preset
button wiring), W5 (control-visibility sync). Verified as duplication but with
no measured cost and no bug attached; extracting them would be cosmetic churn
against the KISS rule. W2 (readout writer/throttle), W3 (drag coalescing, via
Stage pointer coalescing) and W6 (lifecycle, inside `EMC.Stage`) were centralised
because they carried verified performance bugs.
