# BUG_AUDIT — EMC Lab (branch `fix/emc-audit`)

Format: **ID · Severity · Status · Location · Repro · Expected · Actual · Root cause · Fix (file + commit) · Verification (evidence)**.
Status key: **Confirmed** = observed failing in a real browser (Playwright, this sandbox); **Confirmed (static)** = observed in source, browser-repro not applicable; **Suspected** = reasoned, not yet reproduced; **Fixed** = same repro re-run and passing.
Browsers actually run here: Playwright Chromium 156.0.8078.4, Firefox 157.0, Edge (msedge channel) 156.0.4314.42, puppeteer Chrome 148.0.7778.97 (perf tools). Everything else: **untested**.

---

## BOOT-01 · Critical · Confirmed (local + live) — engine dead on every page
- **Location:** `js/common.js` — `UI.initPlates()` (~line 1262, bare `EMC.debugStages` reference) + boot sequencing (~line 1467: `if (document.readyState === 'loading') … else boot()`), consumed by `js/home.js:3`, `js/shell.js`, `js/quiz.js`, all `js/sim-*.js`, `js/toy-*.js`.
- **Repro:** serve repo (`node .scratch/sweep.mjs baseline`) or open https://emc-lab.vercel.app/ in a real browser; watch console.
- **Expected:** `window.EMC` defined; sims, dashboard, loader stages, Detail toggle all work.
- **Actual:** `ReferenceError: EMC is not defined` thrown from `initPlates()` during `boot()`; the exception aborts the `common.js` IIFE **before `window.EMC = …` is assigned**, so every downstream script that reads the bare global `EMC` at top level throws too. 3–5 page errors per page; all 7 pages: `hasEMC:false`, sim readouts empty (`—`), dashboard dead, Detail toggle dead, boot overlay only removed by the inline 4 s failsafe.
- **Root cause:** `defer` scripts run when `readyState === 'interactive'`, so `boot()` executes synchronously **inside** the IIFE, before the assignment `window.EMC = (function(){…})()` completes. `initPlates()` references the bare global `EMC` (not a closure-local), which does not exist yet. jsdom (`npm run test`) loads scripts while `readyState === 'loading'`, so `boot()` defers to DOMContentLoaded — after the assignment — which is why the 561-assertion smoke test passes while every real browser fails.
- **Fix:** `js/common.js` — build the public API as `const api`, assign `window.EMC = api` **before** the boot trigger, and `return api`. One shared-cause fix; no read sites guarded, no behavior otherwise changed. Commit: `phase2(BOOT-01)` (this commit).
- **Verification:** **FIXED — retested.** `tools/diag-boot.mjs`: `hasEMC:true`, `messages: none` on index + coulomb (was `false` + ReferenceErrors). `npm run test:interact` exit 0, "INTERACTION TESTS PASS", 0 console/page errors, 0 404s (baseline: crash + 4 FAIL). `npm run shots` exit 0 (baseline: 1). `npm run test` 561/561 still passing. Evidence: `evidence/phase2/test-interact.log`, `evidence/phase2/shots.log`, `evidence/phase2/test.log`.
- **Baseline evidence:** `evidence/baseline/sweep.json`, `evidence/baseline/test-interact.log`, `evidence/baseline/perf-guard.log`, `evidence/baseline/shots.log`, `evidence/baseline/live-home.png`.

## BOOT-02 · High · Confirmed — loader violates the §3.1 lifecycle contract
- **Location:** `js/common.js` §6c (`OVERLAY_MIN_MS=400`, `TIPS` rotator, 4200 ms watchdog, `bootStrip`), `index.html` (inline 4 s failsafe, `#bootOverlay` markup with mascot/tips/chips, `emc.splash.v1` sessionStorage gate).
- **Repro:** fresh context → any page. Measure overlay lifetime; inspect markup/CSS.
- **Expected (§3.1):** content renders immediately; overlay appears only if startup > ~150 ms; real stages only; exit 200–300 ms after ready; watchdog ≤ 1500 ms; visible error + Retry/Home on critical failure; visuals = segmented accent bar, nothing else; no rotating tips/mascot (scope lock).
- **Actual:** overlay always shown on first visit per session (regardless of speed); minimum display 400 ms; watchdog 4.2 s JS + 4 s inline DOM failsafe (measured overlay lifetime ≈ 4025–4113 ms while BOOT-01 stands — i.e. the timeout is masking the real failure, exactly the §3.1.1 concern); rotating physics tips every 1.2 s; mascot + brand + chips in the overlay; a second in-header "boot strip"; no error state at all.
- **Root cause:** design choice ("splash screen") instead of an event-driven conditional loader; watchdog far beyond spec.
- **Fix:** §6c of `js/common.js` replaced by a single `LOADER` owner: no static overlay anywhere (all 7 pages' markup removed); overlay built dynamically only if boot is unfinished 150 ms after navigation start; real stages `fonts` / `equations` (only on pages carrying `[data-tex]`) / `ui`; sims never gate (lazy `whenNear` untouched); exit 240 ms (inside the 200–300 window; instant under reduced motion); watchdog 1500 ms ends in a usable page and a `#bootFatal` card (Retry + Home) when a critical dep (registry, or KaTeX on an equation page) is missing; an inline per-page dead-man switch covers common.js never executing; zero storage use; every timer tracked and cleared on dismissal; tips/mascot/chips/boot-strip removed; visuals = one segmented accent bar + sr-only status. `grep -rn "bootOverlay" js/` → single owner (`js/common.js` builds it; pages only carry CSS for it). Commit: `phase2(BOOT-02+BOOT-03+DETAIL-01)`.
- **Verification:** **FIXED — retested.** `node tools/loader-verify.mjs` → **LOADER CONTRACT PASS** (15/15: fast load never paints; throttled load paints, bar advances on real stages, dismissed ≈1.0 s incl. artificial 260 ms/script delay; blocked storage OK; reduced motion OK; engine-blocked → dead-man card; registry-blocked → watchdog card naming the registry, content usable; internal hash nav never repaints; 0 timers left). Smoke 561/561, `perf:guard` OK, `test:interact` PASS, `shots` exit 0, `check` exit 0. Evidence: `evidence/phase2/test-loader2.log`, `evidence/phase2/perf-guard3.log`, `evidence/phase2/test-interact2.log`, `evidence/phase2/check4.log`.

## BOOT-03 · High · Confirmed — boot overlay stuck ~4 s on every page (user-visible symptom of BOOT-01+02)
- **Location:** all 7 pages.
- **Repro/Actual:** `evidence/baseline/sweep.json` → `overlayGoneMs` 4025–4113 ms on every page; removed only by the inline failsafe `setTimeout(…4000)`; `aria-busy` never cleared by the failsafe path.
- **Expected:** no overlay at all on fast loads; ≤ 1.5 s worst case.
- **Root cause:** BOOT-01 (stages never complete) + BOOT-02 (failsafe-driven design).
- **Fix/Verification:** tracked with BOOT-01/BOOT-02 — **FIXED**: sweep/verify show no overlay on fast loads; overlayGone ≈ immediate once signals land (was 4025–4113 ms). Evidence: `tools/loader-verify.mjs` output (LOADER CONTRACT PASS).

## SIM-01 · Critical · Confirmed — canvas grows without bound (resize feedback loop)
- **Location:** `js/common.js` `Stage.resize()`; triggered on every sim page using the desktop `.sim-grid` layout (`css/input.css` ~line 886: `height:auto` + stretch) because `.sim-canvas` has a 1.5px `border-bottom`.
- **Repro:** `node tools/repro-unstable.mjs` — load `topics/coulomb.html`, scroll to `#sim-arena`, sample its bounding box: height 636→660→685→709→732→756 px, still climbing (≈ +3px per ResizeObserver pass). Playwright: `scrollIntoViewIfNeeded` times out with "element is not stable" (`test:interact` baseline crash after BOOT-01 fix).
- **Expected:** canvas layout size converges; bitmap attributes = content-box size × dpr.
- **Actual:** `resize()` measured `getBoundingClientRect()` (border-box) and wrote it into `canvas.width/height` (content-box) → each pass re-added the 1.5px border (×2 dpr) to the layout height → RO fires again → unbounded growth, memory/CPU burn, never-stable element.
- **Root cause:** border-box measurement fed back into content-box sizing.
- **Fix:** `js/common.js` `Stage.resize()` subtracts computed border widths before setting attributes (kept rect-based, not clientWidth/Height, so jsdom's stubbed rects still work — a clientWidth variant broke 11 smoke assertions and was rejected). Commit: `phase2(SIM-01)` (this commit).
- **Verification:** **FIXED — retested.** repro: h=440 constant across 6 samples; `test:interact` PASS; smoke 561/561. Evidence: `evidence/phase2/test-interact.log`, `evidence/phase2/test.log`, repro output in commit message.

## SIM-02 · High · Confirmed — sandbox preset clicks before init are silently dropped
- **Location:** `js/sandbox-core.js` (preset buttons are static markup in `topics/*.html`, bound only inside `Sandbox.create()`, which runs on `whenNear`).
- **Repro:** land on `topics/coulomb.html#sim-arena-panel` (anchor jump) and click a preset within the first frames — before `create()` binds the buttons, the click does nothing; `tools/interaction-test.mjs` hit the same race (preset click → later charge click misses → `#ar-sel` stays "—").
- **Expected (§3.4):** every control works; no input silently dropped.
- **Actual:** pre-init clicks lost; test saw an unseeded arena.
- **Root cause:** binding happens at init; nothing queues earlier intent.
- **Fix:** `js/sandbox-core.js` — one capture-phase document listener (registered once, guarded for shell re-execution) records the latest pre-init preset click per `.sb-root`; `create()` marks buttons `data-sb-bound` when binding and replays a queued preset after the box is fully built. Commit: `phase2(SIM-02)`.
- **Verification:** **FIXED — retested.** `test:interact`: "arena: clicking a charge selects it and reports a real force" ok, "dragging … grows the force" ok, 11/11 PASS. Evidence: `evidence/phase2/test-interact.log`.

## DETAIL-01 · High · Confirmed — Detail Mode toggle dead; state contract off-spec
- **Location:** `index.html` header (`#detailToggle`, `role="switch"` + `aria-checked`), `js/common.js` `UI.initDetailToggle`.
- **Repro:** click the Details switch on any page (baseline sweep `detail` field).
- **Expected (§3.2):** one key, one attribute applied pre-paint; label + `aria-pressed` + `data-detail` + visible content always agree; state change announced; works after reload/navigation/dynamic mount; blocked storage → default ON without errors.
- **Actual:** `DEAD (no state change)` on all 7 pages (consequence of BOOT-01 — `initDetailToggle` never runs). Independently: spec asks for `aria-pressed`; button uses `role="switch"`/`aria-checked`; no announcement of the state change (no live region/toast for it); pre-paint inline script and `Prefs` do exist and agree on key `emc.prefs.v1` (recheck after fix).
- **Root cause:** BOOT-01; plus aria attribute choice.
- **Fix:** toggle markup on all 7 pages → plain button with `aria-pressed` (no `role="switch"`/`aria-checked`); `initDetailToggle` renders `aria-pressed` + `.dt-state` label from the single `data-detail` attribute and announces changes through the existing aria-live toast host. Pre-paint inline script and `emc.prefs.v1` key unchanged (already one key, one attribute, storage-safe default ON). Commit: `phase2(BOOT-02+BOOT-03+DETAIL-01)`.
- **Verification:** **FIXED — retested** for toggle liveness + agreement: loader-verify scenario 3 (blocked storage): default `on`, click flips `data-detail=off`, `aria-pressed=false`, label `OFF`; smoke: pressed-state assertions + announcement assertion + persistence. Parity (DETAIL-02) is separate, Phase 3. Baseline evidence: `evidence/baseline/sweep.json`.

## DETAIL-02 · High · Confirmed (static) — explanation-level parity violations
- **Location:** `topics/current.html` (10 × `data-detail="tech"` vs 6 × `plain`), `topics/magind.html` (4 × tech vs 1 × plain).
- **Repro:** `grep -c 'data-detail="tech"' …` vs `"plain"` (recorded below); in a browser with Details OFF, 7 explanation blocks vanish with no simple counterpart.
- **Expected (§3.2.3/§3.2.5):** every explanation block has both variants; automated parity check fails on any block lacking its counterpart.
- **Actual:** counts per file — index 1/1 ✓, quiz 1/1 ✓, charge 2/2 ✓, coulomb 2/2 ✓, field 2/2 ✓, current 6 plain/10 tech ✗, magind 1 plain/4 tech ✗. No parity tool exists.
- **Root cause:** content written tech-first on the two "Extra" chapters; no gate.
- **Fix:** genuine plain variants written for all eight unpaired blocks (3 dig-cards in current.html: conventional current, real-world wiring, misconceptions; 3 in magind.html: naming trap, Lorentz real-world, induction real-world) plus tech counterparts for two orphaned plain intros (current.html §1.1, §1.3); the two JS-filled readouts (`#ohm-sub`, `#circ-breakdown`) got `*-plain` siblings filled by `sim-ohm.js`/`sim-circuit.js` with worded (not copied) text; a redundant nested `data-detail` gate removed. New gate: `tools/check-detail-parity.mjs` (per-parent balance, `-plain` readout pairing, anti-identical + anti-thin rules), wired into `npm run check` alongside `tools/check-scope.mjs` (out-of-scope topic terms + third-party fetch scan, §3.10).
- **Verification:** **FIXED — retested.** `check-detail-parity`: 24 pairs balanced, PASS on all 8 pages; `check-scope`: PASS (caught and fixed two real hits: an "Extra (beyond this lecture)" dig-card summary in fields.html and a registry comment); `npm run check` exit 0 (`evidence/phase2/check-parity.log`); smoke 526/526.

## SCOPE-01 · Critical · Confirmed (static; browser-verified rendering of the wrong scope) — site scope contradicts the course brief
- **Location:** `js/registry.js` (subjects `lecture` + `extra`, `extra:true` flags), `index.html` (nav "Lessons"/"Extra" groups, hero copy "thirteen sandboxes…35-question…Circuits and magnetism live on under Extra", stat strip "Lessons 3"), `quiz.html`/`js/quiz-data.js` (35 Qs: charge 6, coulomb 6, field 7, current 8, magind 8), `js/common.js` (`TOPICS` = lessons only; 70 % quiz auto-tick only lessons), `topics/magind.html` (no `data-complete-topic` button), `README.md`, meta/OG descriptions, `vercel.json` sitemap expectations, `tools/build-public.mjs` page list.
- **Repro:** open home; read nav/hero; run `node -e` count of `EMC_QUIZ` by topic (recorded: `{charge:6,coulomb:6,field:7,current:8,magind:8}` = 35).
- **Expected (brief §1.1/§1.3 via prompt digest):** 3 principal chapters — ch1 Circuits & Ohm's Law, ch2 Electric Fields & Coulomb's Law (charge/coulomb/field lessons as its sections), ch3 Magnetism & Induction; exactly 24 unique questions, 8/8/8; no "Extra" labeling anywhere; progress counts the 3 chapters; metadata/README describe the same project.
- **Actual:** two-tier "3 lessons + 2 Extra" structure; 35 questions; progress ring counts only charge/coulomb/field; ch3 has no completion button; all derived counts advertise the wrong structure.
- **Root cause:** commit `01675dd` "Redesign lessons, interactables & loading around the lecture" re-scoped the site to the lecture alone and demoted the brief's own R1–R3 circuits material to "Extra" (see `REDESIGN.md` — which itself records "the PDFs are not in the workspace"). The deploy is faithful to that commit, so production "disagrees" with the brief for the same reason the source does.
- **Fix:** registry → 3 principal chapters `ch1/ch2/ch3` with a legacy-alias map (`js/registry.js`, pure-JSON core); charge/coulomb/field merged into `topics/fields.html` as sections 2.1/2.2/2.3 (all content + 9 sims kept; heading levels demoted; ids section-prefixed; `tools/build-fields-page.py` records the transform); old lesson URLs → redirect stubs preserving anchors (`topics/{charge,coulomb,field}.html`); `vercel.json` efield redirect → fields.html; nav dropdown/footer/hero/cards/sim-index/formula table/CTA/meta rebuilt around 3 chapters with derived counts (3/13/24 fallbacks); current.html reframed Chapter 1 (complete-button `ch1`, pager→fields), magind.html reframed Chapter 3 (complete-button `ch3` added, pager prev→fields); quiz curated to 24 = 8/8/8 (`tools/curate-quiz.mjs`; 11 spare lesson questions → `archive/js/quiz-data-ch2-extras.js`); progress v4 counts exactly ch1/ch2/ch3 with v1/v2/v3→v4 migration (OR-merge; v1 magnetism+induction still needs both; legacy keys preserved); quiz.js chapter filters replace lessons/Extra filters; legacy `?topic=` deep links + `#/charge` hashes resolve via aliases; build-public/sitemap/perf/shots/interaction tooling repointed. README rewrite lands with docs batch.
- **Verification:** **FIXED — retested.** smoke 526/526 incl. new migration fixtures + legacy-URL stub section + alias deep-link tests (`evidence/phase2/test-scope.log`); `test:interact` PASS incl. legacy-redirect anchor preservation (`evidence/phase2/interact-scope.log`); browser nav check: derived stats 3|13|24, `#/ch2` mounts, `#/charge` → normalizes to `#/ch2`, progress ch2 marks, detail toggle agrees, 0 console errors (`evidence/phase2/navcheck.txt`); `check` 0 errors; `build:public` OK (8 pages: 5 active + 3 stubs); perf budgets met. Baseline evidence: `evidence/baseline/quizbank.txt`.

## DEPLOY-01 · Info · Confirmed — production vs source: not stale, but minified+hashed and semantically off-brief
- **Location:** https://emc-lab.vercel.app vs repo `main` @ `01675dd`.
- **Findings:** deployed `index.html` is byte-identical to source except asset-name hashing (`js/registry.60766501.js` etc., done by `tools/build-public.mjs`, output dir `public`, `vercel.json` `buildCommand: bun run build`); deployed `js/registry.60766501.js` semantically equals source `js/registry.js` (minified). Bare source paths 404 in production (`/js/registry.js` → 404) because only hashed names ship — this is the "production and source disagree" artifact: they don't; the *brief* disagrees with both (SCOPE-01). No divergent branch, no cache staleness.
- **Evidence:** `/tmp/deployed/*` fetches + diff recorded in session; `evidence/baseline/live-home.png`.

## NET-01 · High · Confirmed (live) — third-party runtime requests in production
- **Location:** `index.html` bottom inline script (injects `https://cdn.vercel-insights.com/v1/script.js` and `import('https://cdn.jsdelivr.net/npm/@vercel/speed-insights@2/…')` when hostname matches `*.vercel.app`); same block present in all pages? (index confirmed; check others during fix).
- **Repro:** load https://emc-lab.vercel.app/ in a real browser, list request origins.
- **Expected (§3.7/X):** zero third-party runtime requests.
- **Actual:** origins observed: `cdn.vercel-insights.com`, `cdn.jsdelivr.net` (plus same-origin). Local serving = 0 third-party (injection is hostname-gated), which is why repo tooling never saw it.
- **Root cause:** deliberate analytics injection, gated to production only.
- **Fix:** removed the entire injection block from `index.html`, `quiz.html`, `topics/current.html` (the only three carriers — grep verified). Automated non-same-origin checks: runtime origin counter in `tools/baseline-sweep.mjs` (any third-party request fails the sweep) + static URL scan in the scope checker (Phase 2, `tools/check-scope.mjs`). Commit: `phase2(NET-01+DATA-01)`.
- **Verification:** **FIXED (local)** — `grep vercel-insights|speed-insights|jsdelivr` across active HTML/JS: clean. Production re-verification requires a deploy → **"not verified live"**. Evidence: `evidence/baseline/live-origins.txt` (before-state).

## UI-01 · Medium · Confirmed — horizontal overflow at 360 px
- **Location:** `index.html`, `quiz.html`, `topics/current.html`, `topics/magind.html`: `html scrollWidth 391 > 360`, culprit `#navToggle` right edge at 391 px (header row); `topics/charge.html`: `.canvas-wrap`/`#toy-balloon` right edge 377 px.
- **Repro:** Playwright, viewport 360×900, measure `documentElement.scrollWidth` (`.scratch/sweep.mjs`).
- **Expected (§3.9/V):** zero horizontal overflow at 360/390/640/900/1200/1440.
- **Actual:** 31 px page-level overflow on 4 pages; 17 px canvas overflow on charge. (The `skip-link right=-9772` entry is a detector false positive — standard offscreen `left:-9999px` skip link; excluded.)
- **Root cause:** header flex row (brand + Details + menu) needed ~400 px at ≤420 px widths.
- **Fix:** `@media (max-width:420px)` header compression in `css/input.css` (tighter wrap padding/gaps, 28px brand mark, compact Details pill — the visible Details LABEL stays, per the a11y rule); the old charge.html canvas overflow disappeared with the merge (fields.html canvas-wrap is clean at 360).
- **Verification:** **FIXED — retested.** `tools/baseline-sweep.mjs` (upgraded to the six spec widths 360/390/640/900/1200/1440): zero `html scrollWidth` flags on ALL five active pages at ALL six widths. Evidence: `evidence/phase4/sweep.json`.

## DATA-01 · High · Confirmed (static) — Coulomb constant not the lecture value
- **Location:** `js/common.js` `CONST.K = 8.987551787e9`; `index.html` footnote "…the code keeps full CODATA precision"; `js/quiz-data.js` header comment "the code computes on full-precision k"; `tools/smoke-test.mjs` two `const K = 8.987551787e9` expectation blocks + its printed-k assertion.
- **Expected (§1.2 + lecture-error #3):** compute AND print with k = 8.99×10⁹ N·m²/C² everywhere and state the value; lecture checks: ±1 C @ 1 km → **8990 N** (CODATA k gives 8987.6 N), Bohr F → 8.245×10⁻⁸ N, v → 2.188×10⁶ m/s.
- **Actual:** engine computed 8.987551787e9 while every printed worked example showed 8.99×10⁹ arithmetic — computed readouts and printed text disagreed in the 3rd–4th digit.
- **Root cause:** precision preference over document conformance.
- **Fix:** `CONST.K = 8.99e9` (comment states the lecture value and the CODATA alternative); index footnote, quiz-data comment and README constants line rewritten to say the site computes AND prints 8.99×10⁹; smoke-test expectation constants moved to the same source-of-truth value and its assertion relaxed to match `K: 8.99e9` — **the ±2% numeric tolerance is unchanged** (constant correction, not loosening; see test-change log). Independent check: `node docs/spec/verify-checks.mjs` reproduces all 12 lecture values ≤1% with k=8.99e9 (`evidence/baseline/lecture-checks.txt`). Commit: `phase2(NET-01+DATA-01)`.
- **Verification:** **FIXED — retested.** smoke 561/561 with the new constant (`evidence/phase2/test-data01.log`); verify-checks all OK. In-browser readout checks (8990 N etc.) run in Phase 3/5.

## DATA-02 · High · Confirmed (static; browser check pending) — arena "lecture" presets don't match the lecture configurations
- **Location:** `js/sim-arena.js` presets `lecture-line` (−4/+3/−7 µC spaced 0.20/0.20 m) and `lecture-2d` (−6 µC at 0.10 m, −5 µC at 0.14 m, right angle); `topics/coulomb.html` worked examples 2 & 3; `tools/smoke-test.mjs` expectations encoding the same numbers.
- **Expected (§1.2):** collinear q₂=−4.0, q₁=+3.0, q₃=−7.0 µC at 0.20 m / 0.15 m → F₁₂ ≈ 2.70 N (−x), F₁₃ ≈ 8.39 N (+x), **net ≈ 5.69 N (+x)**. 2-D q₁=+4.0, q₂=−6.0 (0.15 m, 73°), q₃=−5.0 µC (0.10 m) → **≈22.7 N at ≈24°** above +x.
- **Actual:** worked example 2 computes the force on a different charge in a different layout (net 1.1 N); example 3 uses 0.10/0.14 m at 90° (net 23.5 N ∠23°); the line preset's spacing gives F₁₃ = 4.72 N, net 2.02 N — none reproduces the lecture's check values.
- **Root cause:** the redesign reconstructed the examples from a different textbook variant instead of the lecture's own numbers.
- **Fix:** `js/sim-arena.js` presets rebuilt to the lecture layouts (line: 1.30/1.50/1.65 m = 0.20+0.15 spacings, zoom recentred; 2-D: −6 µC at 0.15 m ∠73° = (1.4439, 0.6434), −5 µC at 0.10 m on +x); challenge hint/won text corrected; `topics/fields.html` worked examples 2 & 3 rewritten to the digest numbers; quiz questions on both examples rewritten (`tools/curate-quiz.mjs` RW_COLLINEAR/RW_2D); smoke expectations recomputed from the same physics (tolerance unchanged at 2 %).
- **Verification:** **FIXED — retested.** smoke: 'lecture line example: net force on q₁ = 8.39 − 2.70 N (+x)' ✓ and 'lecture 2-D example … ≈ 22.7 N at ≈24°' ✓ asserted against live engine readouts in jsdom (`evidence/phase2/test-scope.log`); `docs/spec/verify-checks.mjs` independent recompute ✓ (`evidence/baseline/lecture-checks.txt`). Real-browser readout re-verification: Phase 5 gate Z.

## DATA-03 · High · Confirmed (static; browser check pending) — field worked example 2 geometry ≠ lecture
- **Location:** `topics/field.html` worked example 2 (±4 µC at y = ±0.50 m, P at x = 0.60 → r² = 0.61, E₁ = 5.90×10⁴ N/C, net 7.55×10⁴); fieldpaint `lecture-y` preset (same geometry).
- **Expected (§1.2):** ±4.00 µC, each **0.700 m** from P, **31.0°** → E₁ = E₂ ≈ **73,388 N/C**, net **75,595 N/C along +y**, E_x = 0. Geometry: charges at y = ±0.700·sin31° = ±0.3605 m, P at x = 0.700·cos31° = 0.600 m.
- **Actual:** the site's variant reaches a similar net (7.55×10⁴) by a different route but prints E₁ = 5.90×10⁴ ≠ 73,388 — the lecture's per-charge check value is not reproduced.
- **Root cause:** same as DATA-02 (reconstructed variant).
- **Fix:** `js/sim-fieldpaint.js` lecture-y preset moved to the lecture geometry (charges y = ±0.3605 m, P x = 0.600 m ⇒ r = 0.700 m, 31.0°); `topics/fields.html` worked example 2 rewritten (prints E₁ = E₂ = 73,388 N/C, Eₓ = 0, net 75,595 N/C); quiz question rewritten (RW_FIELD); smoke first-principles expectation updated to 2·(kq/0.49)·sin31° (tolerance unchanged).
- **Verification:** **FIXED — retested.** smoke 'lecture y-axis example: |E| at P ≈ 7.56×10⁴ N/C' + component-algebra assertion ✓ (`evidence/phase2/test-scope.log`); verify-checks ✓. Real-browser probe re-verification: Phase 5 gate Z.

## R1-01 · Critical · Confirmed (static + browser) — circuit builder had no drag/drop (brief R1 gap)
- **Location:** `js/sim-circuit.js` + `topics/current.html` circuit panel.
- **Repro:** baseline site: the builder only offered topology segment buttons, an "Add resistor" button and sliders; nothing could be dragged, the battery could not be disconnected, resistors could not be moved between series/parallel wiring by direct manipulation.
- **Expected (brief R1 + §3.4):** drag/drop **resistors, battery, light bulb**; place, move, delete and connect; V = IR, P = VI, series/parallel R exact; bulb brightness follows computed power; R = 0 / degenerate states never NaN/Infinity.
- **Actual:** button/slider builder — R1's interaction model missing.
- **Root cause:** feature never built to the brief's interaction spec (repo history shows the builder predates the brief mapping).
- **Fix:** lane-based drag-and-drop bench: resistors live in a wiring lane (series top-wire / parallel branch); palette chips (Battery, Bulb, +Resistor) drag onto the bench — drop height picks the lane — or click/Enter for the keyboard path (aria-pressed state); canvas components drag between lanes (rewire), off the bench (delete/disconnect — battery off = honest zero current everywhere, never faked numbers); per-row lane-toggle and × buttons keep every action keyboard-reachable; wires-only + bypassed bulb = flagged SHORT (no Infinity/NaN); analyze() generalised to R(eq) = ΣR_series + 1/Σ(1/R_parallel) (the brief's "circuit reduction"), topology segment becomes a wiring shortcut; layout re-flows live; a mid-drag smooth-scroll defect (bench moving under the pointer) fixed by scrolling only on click-like releases. `window.__CIRC` test hook added (parity with `__AR`).
- **Verification:** **FIXED — retested.** Real-pointer interaction cases (`npm run test:interact`): chip-drag places a resistor; two canvas drags rewire into parallel (46.03 Ω asserted, lanes asserted); drag-off deletes; battery drag-off → "no battery" zero current; chip reconnects → current returns. jsdom smoke +10 assertions (palette, lane buttons, battery off/on, SHORT guard, recovery): 536/536. Evidence: `evidence/phase3/interact-circuit.log`, `/tmp/smoke16.log` (copied to evidence).

## A11Y-01 · High · Confirmed → **FIXED** — keyboard 'n' jump answered the wrong card; shell-mounted complete-buttons were inert
- **Location:** `js/quiz.js` ('n' shortcut + IntersectionObserver active-card targeting), `js/shell.js` (mounted chapter content).
- **Repro:** `tools/a11y-verify.mjs` A8: keyboard-only quiz answering stalled at 1/24 (later 14/24); A4: Enter on the mounted "Mark chapter as complete" button did nothing.
- **Expected (§3.9/§3.5):** every flow completable by keyboard; dynamically mounted content fully live.
- **Actual:** (a) 'n' scrolled to the next blank but active-card targeting only updated on IO threshold crossings — jumping to an already-visible card never re-targeted, and the smooth scroll's crossings then OVERWROTE the jump target, so number keys re-answered the previous card; (b) `UI.initTopicButtons` ran once at boot when the shell was empty, so mounted `[data-complete-topic]` buttons had no listeners.
- **Root cause:** observer-as-only-source-of-truth for jump targeting; boot-time-only binding for dynamic content.
- **Fix:** 'n' routes through `gotoQuestion` (explicit retarget); a 900 ms jump lock lets programmatic jumps own targeting while IO still governs free scrolling (`lastJump` hoisted to module scope — the first attempt leaked an implicit global and did nothing, caught by retest); `shell.js` re-runs `UI.initTopicButtons()` after every mount.
- **Verification:** **FIXED — retested.** a11y-verify **A11Y + REDUCED-MOTION PASS** 17/17: A8 24/24 answered keyboard-only in order, A9 submit+confirm by keyboard, A4 pressed=true + "Chapter completed" words. Instrumented trace: `.scratch/quiz-kbd3.mjs` output (24/24). Evidence: `evidence/phase4/a11y-verify.log`.

## NAV-02 · Medium · Confirmed → **FIXED** — chapter links full-navigated instead of shell-mounting on engines without native View Transitions; VT traversal aborted with uncatchable console errors
- **Location:** `js/common.js` `initPageTransitions` (bubble-phase click intercept), `js/shell.js` (bubble-phase topic-link intercept), `css/input.css` `@view-transition { navigation: auto }`.
- **Repro:** Firefox (no native VT): click a chapter dropdown link → full page load instead of same-page mount. Chromium: rapid back/forward during a cross-document view transition → `InvalidStateError: Transition was aborted… ViewTransition opt-in disabled` console error (gate X flake, seen in `evidence/phase5` first nav run; not suppressible from page code).
- **Expected (§3.3/X):** chapter switching mounts identically on every engine; zero console errors.
- **Actual:** engine-dependent routing behaviour + traversal console noise.
- **Root cause:** two competing transition implementations; listener registration order (common.js before shell.js) let the fade intercept win on engines where it was active.
- **Fix:** removed the cross-document `@view-transition` opt-in — the `.vt-leaving` 200 ms fade is now the single implementation on every engine (reduced-motion respected); `shell.js` intercepts topic links in the **capture** phase so the shell owns them everywhere, while the fade still handles non-shell navigations (quiz, standalone pages).
- **Verification:** **FIXED — retested.** nav-verify PASS ×2 consecutive runs (31 checks, incl. click-driven chapter mounts and back/forward), shell-stress PASS, browser-matrix PASS on all 3 engines (chapter mounts checked per engine), smoke 536/536 with the updated one-implementation assertions. Evidence: `evidence/phase5/nav-verify.log`, `evidence/phase5/browser-matrix.log`.

## INTRO-01 · Feature · Confirmed-working — YTPMV-inspired once-per-session opening (new brief PART 6)
- **Location:** `js/intro.js` (new, index-only), `#introOverlay` markup in `index.html`, intro CSS block in `css/input.css`.
- **Design (original composition; the reference video's footage was NOT inspected — see report):** flat-colour stage; beat timeline 0.00 flash → 0.05 mascot pop → 0.55/0.68 two-tone title slams → 0.80 rule wipe → 1.05/1.30 equation chip cuts → 1.90/2.35/2.85 montage jumps with hard cuts + 2.00/2.45/2.90 chapter-chip pops → 3.15 mascot cheer (eye/mouth swap) → 3.30 Start-Learning slam + flat ring pulse → 4.00 stage exit → 4.05 two-panel wipe revealing the already-rendered homepage. Transform/opacity keyframes only; no gradients/blur/backdrop-filter; no rAF loop (perf:guard home chains stay 0); no audio.
- **Contract:** ~4.6 s auto-play; once per session under its own key `emc.intro.v1` (in-memory fallback when storage is blocked; progress keys never touched); never on chapter routes/replays/failed boot; skip button visible bottom-right (never over the header), first Tab stop, Enter/Escape/any key or pointerdown dismisses; overlay is `pointer-events:none` so page controls are never locked (a click through dismisses AND activates); waits for the loader's single `emc:loader-done` event; reduced motion → static composition cleared in ~1.2 s (pseudo-element animations included in the reset — caught by intro-verify); full DOM/listener/timer removal afterwards.
- **Verification:** `tools/intro-verify.mjs` **INTRO CONTRACT PASS** 10/10 (`evidence/phase6/intro-verify.log`); a11y A0 block 5/5 (skip first tab stop + visible ring, pointer-events none, Enter dismisses, skip-link restored after); smoke +14 assertions incl. jsdom lifecycle, replay-skip, hash-skip, reduced-motion; visual frame evidence `evidence/phase6/intro-frames/` (0.45/0.9/2.1/3.5/4.3 s + resolved homepage).

## MASCOT-01 · Info · Deliberate reversal — mascot restored as identity anchor (new brief PART 7.4)
- **History:** the previous client brief's scope lock forbade mascots; commit 2d53e15 removed them. The current brief reverses this: "preserve the mascot's recognizable identity and use it as the visual anchor". No attached mascot image existed in `uploads/` (only the lecture PDF), so the identity source is the project's own Denki-chan artwork (header brand mark / favicon / git history).
- **Changes:** hero mascot restored on index with a predictable capped area (`.hero-mascot`: height clamp(120px,24vh,200px), max-height 40vh, smaller ≤640px, `pointer-events:none`, gentle 5.2 s float, animation off under reduced motion); one-shot cheer reactions on quiz pass (`score-cheer`) and chapter completion (`mascot-cheer`), both `aria-hidden` beside the word-based state text (state never colour- or mascot-only); intro mascot with pop/montage/cheer beats.
- **Test change (integrity rule):** the smoke assertion that required `input.css` to contain NO `.mascot` rules (added under the old scope lock) was replaced by assertions requiring the caps + reduced-motion off-switch + `pointer-events:none`. Justification: client directive changed; strictness preserved (3 assertions → 2, but the intro section adds 14). Recorded here and in the smoke source comment.
- **Verification:** smoke 550/550; a11y 22/22 (mascot never traps focus, pointer-events none); sweep: no overflow introduced at any width (hero mascot capped); frames in `evidence/phase6/intro-frames/f5500-home.png`.

## NAV-03 · High · **Not reproducible** on fix/emc-audit — reported chapter-navigation flakiness
- **Reported (new brief PART 3):** after selecting one chapter, selecting another may stop working or leave inconsistent state.
- **Reproduction attempt:** `tools/stability-stress.mjs` (new, written for this report) executes the full required sequence in real Chromium: ch1→ch2→ch3→ch1 and ch1→ch3→ch2→ch1 via dropdown AND home cards, Details toggles between navigations, sim interaction before leaving each chapter, rapid switching (90 ms apart), Back/Forward, direct hash URLs, refresh on a chapter route, new-tab standalone links, mobile hamburger path, in-page pager links — asserting at every step that hash, mounted h1, nav indicator and click-through agree, plus per-chapter stage teardown **by canvas identity**.
- **Result:** 35/35 checks pass, zero console errors (`evidence/phase6/stability-stress.log`). The historical causes of exactly these symptoms were BOOT-01 (engine dead → shell never armed), NAV-01 (legacy routes) and NAV-02 (listener-order race) — all fixed and re-verified earlier in this branch; no residual defect found. Two harness-side assertion bugs (selector mapping; teardown counted stages instead of comparing identities) were fixed in the harness, not the product.
- **Status:** Not reproducible; monitored by `stability-stress` in the regression set.

## DET-03 · Medium · **Not reproducible** on fix/emc-audit — reported Details-switch inconsistency + typography jump
- **Reported (new brief PART 4):** switch state/appearance/content may disagree; primary reading text may jump between `.lede.small.muted` and `.lede` sizes.
- **Reproduction attempt:** `tools/stability-stress.mjs` sections B+C: ten rapid toggles with attr/aria-pressed/label lockstep assertions; keyboard Enter; reload in both states; Back/Forward; toggle before/after dynamic mount (mounted chapter shows plain variants immediately when OFF, tech appears on toggle); blocked localStorage (boots clean, toggle works); computed font-size + line-height compared for EVERY plain/tech pair on index, fields, current, magind, quiz.
- **Result:** all pass; every pair shares font-size/line-height (`.lede` = 1.04rem/1.8 ≈ 16.6px at base 16, with a `.lede.small` guard rail already in place). No typography jump measurable. Evidence: `evidence/phase6/stability-stress.log`.
- **Status:** Not reproducible; monitored by `stability-stress`.

## LINK-01 · Medium · **Not reproducible** on fix/emc-audit — reported broken links
- **Reproduction attempt:** `npm run check` (links/ids/hooks), `nav-verify` (31 destination+content+refresh+back/forward checks), `stability-stress` section A (every nav surface), plus an external-`<a>` scan of all active pages.
- **Result:** 0 broken references; no external `<a href="http…">` links exist in active pages (all absolute URLs are same-origin meta/canonical/OG), so nothing external can rot silently; old lesson URLs redirect with anchors preserved (verified in-browser).
- **Status:** Not reproducible; monitored by the three tools above.

## DATA-04 · Medium · Confirmed (static, then PDF-verified) — slide-21 example quoted a rescaled field strength
- **Location:** `topics/fields.html` §2.3 worked example 1; `js/quiz-data.js` question on F = |q₀|E.
- **Found by:** reading the real lecture PDF once supplied (`docs/spec/PHYSICS2 LEC01 Electrostatic.pdf`, slide 21 figure): the lecture's spot field is **E = 2.0 N/C** with (a) 3.6×10⁻⁷ N and (b) the misprinted 4.7×10⁻⁷ N. The site instead printed E = 2.0×10³ N/C with 10⁻⁴ results — arithmetically self-consistent but NOT the lecture's numbers, so the digest's corrected check value (4.8×10⁻⁷ N) never appeared on the site.
- **Expected (§1.2 + lecture-error #1):** the site reproduces the lecture example with the corrected product: |−24×10⁻⁸ C| × 2.0 N/C = 4.8×10⁻⁷ N.
- **Fix:** worked example 1 rewritten to E = 2.0 N/C with (a) 3.6×10⁻⁷ N along E, (b) 4.8×10⁻⁷ N opposite E, plus an explicit on-page correction note naming the slide's 4.7×10⁻⁷ slip; the matching quiz question and its distractors rescaled to the same magnitudes (answer index unchanged).
- **Verification:** **FIXED — retested.** `node docs/spec/verify-checks.mjs` still 12/12 (its slide-21 row already used 2.0 N/C); smoke 536/536; `npm run check` 0; quiz-verify 18/18. Evidence: `docs/spec/slides/slide-21.png` (the printed 4.7×10⁻⁷), `evidence/phase6/*`.

## TOOL-01 · Medium · Confirmed — perf scripts unrunnable from a clean install
- **Location:** `package.json` (no `puppeteer` devDependency; `build` script hardcodes `bun`), `tools/perf-measure.mjs:27` (`import puppeteer from 'puppeteer'` — hard crash), `tools/perf-audit.mjs` (graceful skip, exit 0, silently unmeasured).
- **Repro:** `npm ci && npm run perf:guard` on `main`.
- **Expected (T gate):** every listed script runs.
- **Actual:** `perf:guard` exits 1 with `ERR_MODULE_NOT_FOUND`; `perf` exits 0 while measuring nothing.
- **Root cause:** missing devDependency declaration; bun-only build script.
- **Fix:** declared `puppeteer` in `devDependencies` (dev-only; no runtime dep added). `bun.lock` NOT regenerated (bun unavailable in this environment — documented substitution `npm`). Commit: *(this phase)*.
- **Verification:** `evidence/baseline/perf.log` ("✅ all performance budgets met" — real run after install), `evidence/baseline/perf-guard.log` (runs; failures are BOOT-01 downstream, not tooling).

## TOOL-02 · Low · Confirmed (static) — repo hygiene / dead files
- **Location:** `lh.tmp.mjs` (stray temp file at root), `tools/perf-probe*.mjs` × 11 (one-off probes), dead general-physics constants in `js/common.js` `CONST` (`G, RHO_WATER, RHO_AIR, C_WATER, V_SOUND, P_ATM, T_ABS_ZERO` — zero active consumers; out-of-scope terms per §1.1 scan).
- **Fix:** `lh.tmp.mjs` deleted; perf-probe*×10 and the one-shot transform scripts moved to `archive/tools/`; dead constants (G, RHO_WATER, RHO_AIR, C_WATER, V_SOUND, P_ATM, T_ABS_ZERO) removed from `CONST`; `.scratch/` gitignored.
- **Verification:** `tools/check-scope.mjs` PASS (out-of-scope term scan clean on active files); smoke 526/526 (no consumer of the removed constants existed).

## TOOL-03 · Info · Confirmed → **DONE** — smoke test re-encoded to the brief's scope
- **Location:** `tools/smoke-test.mjs` (was: 561 assertions encoding "three lessons + Extra", 35-question bank, lesson-only progress).
- **Note (integrity rule):** the old assertions were not "wrong" against `main`; they became wrong against the brief-mandated scope. Updated across the SCOPE-01/quiz/loader commits with justifications logged in the test-change log below; strictness increased (loader contract numerics, stale-bank, migration fixtures for v1/v2/v3, drag-and-drop bench, one-transition-implementation). Final: 536 assertions — the delta is two retired per-page cross-check loops (2 removed lesson pages × ~15 duplicated structural assertions) minus ~24 new assertions (loader lifecycle 12, legacy stubs 13, stale-bank 1, fixtures 2, alias deep links 2, bench 10, badges 2…). Browser-level coverage ADDED on top: 134 checks across six gate harnesses.
- **Verification:** `evidence/phase5/test.log` — 536/536.

## QUIZ-01 · High · Confirmed → **FIXED** — quiz engine runtime gaps (stale-state, browser-level §3.5 items)
- **Location:** `js/quiz.js` (autosave format, filters, deep links), `quiz.html` (filter row, copy).
- **Repro (baseline):** static — saved sessions (`emc.quiz.session.v1`, `v:2`, answers keyed by numeric id) would resume against ANY bank; after the 24-question curation old ids 1..24 collide with new questions → silent wrong-answer resume. 'Lessons/Extra' filters and `?topic=charge` deep links died with the rescope. The interactive §3.5 checklist had never run in a real browser (BOOT-01 masked everything).
- **Expected (§3.5):** stale saved state detected and handled explicitly; filters/deep links follow the chapter structure; whole checklist browser-verified.
- **Actual:** no fingerprint; legacy tags unresolved; checklist unverified.
- **Fix:** session `v:3` + `bank` fingerprint (hash over ids × question lengths); mismatch → key removed + announced toast, never resumed. `?topic=` resolves through the registry alias map; filters reduced to the three chapters; result-breakdown labels come from registry chapter titles.
- **Verification:** **FIXED — retested.** `tools/quiz-verify.mjs` (new gate tool, `npm run quiz-verify`): **QUIZ VERIFICATION PASS** 18/18 — keyboard 2/f/n flow, shortcuts ignored on nav/input focus, 24 real clicks, dual submit + confirm, 100% score, Chart.js paints real pixels (R8), fallback yields to charts, retake clears, docked timer (QUIZ-02), autosave→reload→resume restores, ch1 deep link = 8 cards, filter↔URL sync. Smoke adds stale-bank detection + fingerprinted resume fixtures (536/536). Evidence: `evidence/phase3/quiz-verify.log`, `evidence/phase3/test.log`.

## QUIZ-02 · Medium · Confirmed → **FIXED** — floating timer covered answer options at 360 px
- **Location:** `quiz.html` `#floatTimer`, `js/quiz.js` placement, `css/input.css` `.float-timer`.
- **Repro:** `tools/quiz-verify.mjs` timer scenario, 360×740, practice timer on, scrolled: the 150 px bottom-right panel intersected 3 visible `.opt` buttons.
- **Expected (§3.5):** timer visible while scrolling, never overlapping answers or mobile nav.
- **Actual:** 3 overlapping options at the default dock position.
- **Root cause:** one floating panel size/position for all widths; phone-width answer rows span the full viewport.
- **Fix:** under 480 px the panel docks as an opaque full-width bottom bar (`.docked`), and `body.timer-docked #quiz-list` reserves matching padding — the bar owns its strip like the sticky header, so no answer is covered at any settled scroll position; wider screens keep the draggable panel (drag/keyboard-move/minimise untouched).
- **Verification:** **FIXED — retested.** quiz-verify: `overlaps: 0, navOverlap: false, docked: true, reserved: true` settled at the worst-case bottom, visible mid-scroll. Evidence: `evidence/phase3/quiz-verify.log`.

## NAV-01 · High · Confirmed → **FIXED** — shell routing was dead (downstream of BOOT-01); full §3.3 matrix now verified
- **Location:** `js/shell.js` (guard `if (!REG || !EMC) return` meant hash routing never armed while BOOT-01 stood).
- **Fix:** BOOT-01 root fix + alias-aware `routeFromHash` (legacy `#/charge|coulomb|field|current|magind` → owning chapter, URL normalized, section anchor preserved) + failCard gained a working Retry (re-activates the chapter, drops the poisoned cache entry).
- **Verification:** **FIXED — retested.** `tools/nav-verify.mjs` (new gate tool, `npm run nav-verify`): **NAVIGATION MATRIX PASS** — 26 checks: nav+dropdown to all 3 chapters, quiz link, 5 direct URLs, 5 old-URL redirects with anchors, legacy hash alias, shell-switch anchor landing + standalone anchors, back/forward, reload on #/ch3, real hrefs for new tabs, stage teardown by IDENTITY (ch2 stages destroyed; ch3 owns its own), focus moves to mounted h1, chapter scripts fetched at most once, fetch-failure error card (never stuck "Loading") with Retry recovering, keyboard dropdown flow, mobile menu at 360 px, skip link first tab stop. Evidence: `evidence/phase2/nav-verify.log`. Detail Mode on dynamically mounted content (gate D): `evidence/phase2/detail-mount.txt` — tech/plain swap exactly, persists across reload, aria-pressed agrees.

---

## Baseline script results (recorded BEFORE any code edit — commit `01675dd` + puppeteer devDep declaration)
| Script | Exit | Result | Evidence |
|---|---|---|---|
| `npm run check` | 0 | pass (notes: magind lacks complete-topic/data-tex-done markers) | `evidence/baseline/check.log` |
| `npm run test` (jsdom smoke) | 0 | 561/561 pass — **blind to BOOT-01** | `evidence/baseline/test.log` |
| `npm run build:css` | 0 | pass | `evidence/baseline/build-css.log` |
| `npm run build:public` | 0 | pass (69 files; "js shipped readable - bun not found") | `evidence/baseline/build-public.log` |
| `npm run test:interact` | 1 | FAIL: arena select/drag readouts empty, fieldpaint preset count 0, ohm preset empty, crash `EMC undefined` | `evidence/baseline/test-interact.log` |
| `npm run test:shell` | 0 | pass | `evidence/baseline/test-shell.log` |
| `npm run perf` | 0 | budgets met (after TOOL-01 fix) | `evidence/baseline/perf.log` |
| `npm run perf:guard` | 1 | FAIL: 0 animation chains where 1 expected (×3) — BOOT-01 downstream; CLS 0 ✓ | `evidence/baseline/perf-guard.log` |
| `npm run shots` | 1 | FAIL: page errors captured | `evidence/baseline/shots.log` |

## Test-change justification log (integrity rule)
- *(empty so far — no test, budget or lint rule has been disabled, deleted, skipped or loosened)*
- Planned: `tools/smoke-test.mjs` scope assertions updated in a dedicated commit (TOOL-03) to encode the brief-mandated scope; strictness increased (24-question invariants, parity tool added).
- **SCOPE-01 rescope** (commit `phase2(SCOPE-01+DATA-02+DATA-03)`): the whole smoke suite was re-pointed from the lessons+Extra structure to the brief's three chapters (page lists, filters, counts 35→24, progress ids, legacy fixtures). Assertion total moved 561 → 526: the drop is two removed per-page cross-check loops (2 lesson pages × ~15 duplicated structural assertions) and the retired splash/lessons-filter assertions; everything removed is replaced by modern equivalents and NEW coverage was added (loader-lifecycle contract ×12, legacy-stub redirects ×13, stale-bank detection, v2/v3 migration fixtures, alias deep links, 3-chapter filter counts). No assertion was weakened; tolerances untouched. Justification: the old assertions encoded the off-brief scope (TOOL-03).
- **BOOT-02 loader rework** (commit `phase2(BOOT-02+BOOT-03+DETAIL-01)`): the smoke section "first-visit splash + repeat-visit gate" and the boot-strip/detail assertions encoded the old splash design (session gate, 4 s failsafe, chips fonts/equations/sims, `role=switch`). They were replaced — not removed — by a stricter "loader lifecycle" section asserting the §3.1 contract numerically (SHOW_AFTER=150, EXIT 200–300, WATCHDOG ≤1500, single owner, no tips, no storage in the owner, real stages list, zero timers) plus the new aria-pressed/announcement assertions. Assertion total unchanged at 561; the browser-level contract is additionally gated by `tools/loader-verify.mjs` (new).
- **perf:guard home-chain expectation** (same commit): `home boot-visible chains = 1` encoded the pre-redesign animated hero canvas (removed in 01675dd). Design rules (§3.8) forbid permanent background loops, so the expectation was **tightened to 0**. The essential-motion budget stays policed (`live lorentz sim keeps exactly 1 chain`). Justification recorded here per the integrity rule.
- **DATA-01** (commit `phase2(NET-01+DATA-01)`): the smoke assertion `every printed Coulomb constant is 8.99×10⁹` previously *required* `K: 8.987551787e9` in `js/common.js` while its own label claimed the lecture value 8.99×10⁹ — the assertion was self-contradictory and encoded the very defect being fixed. Corrected to require `K: 8.99e9`. The two expectation blocks' `const K` were likewise 8.987551787e9 and are now 8.99e9. **`numClose`'s ±2% tolerance is unchanged**; assertion count is unchanged at 561. No assertion was deleted, skipped or weakened.
