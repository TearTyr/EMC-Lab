# EMC Lab — Audit & Fix Report (branch `fix/emc-audit`)

Date: 2026-10-23 · Auditor environment: Debian sandbox, node v20.20.2, npm 10.8.2 (**bun not available** — npm substituted for every `bun run` script; Vercel's bun build path unchanged). Playwright 1.64.1 with Chromium 156.0.8078.4, Firefox 157.0, Edge (msedge channel) 156.0.4314.42; puppeteer Chrome 148.0.7778.97 for perf tools.
Baseline commit: `01675dd` (main). **The two spec PDFs were not provided**; the working source of truth is the prompt digest transcribed to `docs/spec/brief-digest.md`, with every lecture value independently recomputed by `docs/spec/verify-checks.mjs` (`evidence/baseline/lecture-checks.txt`, 12/12 ≤1%). All claims below cite files under `evidence/`.

---

## 1. Critical bugs (problem → root cause → verified result)

**BOOT-01 — the entire site was dead in every real browser (local AND live).**
`common.js` ran `boot()` inside its IIFE before `window.EMC` was assigned (defer scripts execute at `readyState 'interactive'`); `initPlates()` read the bare global `EMC` → `ReferenceError` → the assignment never completed → engine, sims, dashboard, loader stages and Detail toggle dead on all 7 pages; the boot overlay survived until the 4 s failsafe. jsdom smoke passed (561/561) because jsdom defers boot to DOMContentLoaded — a pure real-browser defect. The live site reproduced it identically (`evidence/baseline/live-home.png`, `live-origins.txt`).
*Fix:* publish `window.EMC = api` before triggering boot (one shared-cause edit).
*Verified:* `hasEMC:true`, 0 console errors on every page; `test:interact` from crash+4 FAIL → PASS; shots/perf:guard unblocked (`evidence/phase2/*`, `evidence/phase5/test-interact.log`).

**SIM-01 — every grid-layout canvas grew without bound.**
`Stage.resize()` measured the border-box rect and wrote it into content-box bitmap attributes; each ResizeObserver pass re-added the 1.5px border (×dpr): `#sim-arena` climbed 636→756→… px, never stable (Playwright "element is not stable").
*Fix:* subtract computed borders (rect-based, so jsdom stubs still work — a clientWidth variant broke 11 smoke assertions and was rejected).
*Verified:* height constant 440px across samples; `tools/repro-unstable.mjs`; `evidence/phase2/test-interact.log`.

**SCOPE-01 — the site contradicted the course brief.**
`main` presented "3 lessons + 2 Extra chapters" and a 35-question bank; the brief requires 3 principal chapters (ch1 Circuits, ch2 Electric Fields & Coulomb's Law containing the old lessons as sections, ch3 Magnetism & Induction) and exactly 24 questions (8/8/8). Production was NOT stale: it is the minified+hashed build of the same commit (DEPLOY-01) — source and live disagreed with the *brief* for the same reason.
*Fix:* full reconciliation (registry with legacy alias map, `topics/fields.html` merge, redirect stubs, quiz curation, progress v4 + migrations, nav/home/footer/metadata, README).
*Verified:* smoke 536/536, check 0, `evidence/phase5/browser-matrix.log` (all three engines), `SCOPE_TRACE.md` (no MISSING rows).

**R1-01 — the circuit builder had no drag/drop (brief R1 gap).**
Buttons/sliders only; battery/bulb could not be disconnected, resistors not moved by direct manipulation.
*Fix:* lane-based drag-and-drop bench (palette chips → canvas; drop height picks series/parallel lane; drag-off deletes/disconnects; keyboard paths via lane/×/chip buttons; SHORT guard; battery-off = honest zeros). Also fixed two real drag defects found by the new tests: `pointerleave` cancelling captured drags, and a mid-drag smooth-scroll moving the bench under the pointer.
*Verified:* 5 real-pointer cases in `test:interact` + 10 smoke assertions (`evidence/phase3/interact-circuit.log`, `test-circuit.log`).

## 2. Other bugs (by area)

- **Loader (BOOT-02/03):** always-on splash, 400ms minimum, rotating tips + mascot, 4.2s/4s failsafes, no error state → replaced by one event-driven lifecycle (§3 below).
- **Detail Mode (DETAIL-01/02):** toggle dead (BOOT-01 downstream); `role=switch`→`aria-pressed` + announced; parity violations (current 10 tech/6 plain, magind 4/1) → 8 genuine plain variants written + JS readouts paired (`*-plain` siblings) + permanent parity gate (`tools/check-detail-parity.mjs`, 24 pairs balanced).
- **Data (DATA-01/02/03/04):** engine computed k=8.987551787e9 while every printed example showed 8.99e9 arithmetic → `CONST.K = 8.99e9` everywhere, stated; arena lecture presets and fieldpaint replica used wrong geometries → rebuilt to the lecture's (0.20+0.15 m line; 0.15 m@73°+0.10 m 2-D; r=0.700 m/31.0° field) with worked examples and 3 quiz questions rewritten.
DATA-04 (post-audit, PDF-verified): slide-21 example rescaled ×10³ → aligned to the lecture's E = 2.0 N/C with the corrected 4.8×10⁻⁷ N and an explicit on-page correction note.
- **Network (NET-01):** production-only injection of `cdn.vercel-insights.com` + `cdn.jsdelivr.net` → removed from all 3 carriers; static + runtime same-origin gates added (`tools/check-scope.mjs`). Live re-verification requires a deploy → **not verified live**.
- **Navigation (NAV-01/02):** shell routing dead (BOOT-01) → 31-check matrix green; chapter links full-navigated on engines without native View Transitions (listener-order race) and Chromium logged uncatchable `InvalidStateError` on traversal-aborted view transitions → single `.vt-leaving` transition implementation + shell intercepts in capture phase.
- **Quiz (QUIZ-01/02):** no stale-bank detection (numeric id collisions would silently mis-resume) → session v3 + fingerprint + explicit clear-and-announce; floating timer covered 3 answer options at 360px → docked opaque bottom bar with reserved padding; `n` shortcut answered the wrong card (IO threshold-only retargeting + mid-scroll overwrite) → explicit retarget with a 900ms jump lock.
- **Accessibility (A11Y-01):** shell-mounted "Mark chapter as complete" buttons were inert (boot-time-only binding) → shell rebinds after every mount.
- **Responsive (UI-01):** 360/390px page overflow (header row needed ~400px) → ≤420px header compression; zero overflow at all six widths now.
- **Tooling (TOOL-01/02/03):** puppeteer undeclared (perf:guard unrunnable from clean install) → declared; repo hygiene (lh.tmp.mjs deleted, probes archived, dead constants removed); smoke re-encoded to the brief's scope with written justifications (test-change log in `BUG_AUDIT.md`).

## 3. Loader — cause of delay and the new lifecycle

*Cause:* a "branded splash" design (always shown first visit/session, 400ms minimum display, tips rotator) whose real signals never completed while BOOT-01 stood — so the overlay only ever left via the 4s inline failsafe (measured 4025–4113ms on all 7 pages, `evidence/baseline/sweep.json`). The timeout was masking the real failure.
*New lifecycle (one owner: `LOADER` in `js/common.js` §6c):* no static overlay anywhere — content paints immediately; overlay is **built only if boot is unfinished 150ms after navigation start**; real stages only (fonts / above-the-fold equations where `[data-tex]` exists / critical UI), sims never gate; exit 240ms (200–300 window; instant under reduced motion); **watchdog 1500ms** → usable page + `#bootFatal` card (Retry + Home) when a critical dep (registry; KaTeX on equation pages) is missing; inline per-page dead-man switch covers common.js never executing; zero storage use; every timer cleared on dismissal; visual = one segmented accent bar + sr-only status.
*Verified:* `tools/loader-verify.mjs` 16/16 — fast load never paints; throttled load paints, bar advances on stages, gone ≈1.0s incl. 260ms/script artificial delay; blocked fonts/storage, reduced motion, engine-blocked, registry-blocked, internal navigation, zero leftover timers (`evidence/phase5/loader-verify.log`). Measured overlay lifetime on ordinary loads: 469–590ms only because the local server + cold webfonts genuinely exceed 150ms; warm loads paint nothing (`evidence/phase5/sweep.json`).

## 4. Detail Mode — what was wrong, how both states were verified

One key (`emc.prefs.v1`) and one attribute (`html[data-detail]`, applied pre-paint) were already right; the toggle was dead (BOOT-01), used `role=switch`/`aria-checked` instead of the specified `aria-pressed`, and never announced changes; parity was violated on two chapters (7 unpaired blocks) with no gate.
*Both states verified:* every `[data-detail=tech]` block now has a genuine plain counterpart (parity tool fails on missing/identical/thin variants — 24 pairs balanced); ON→7 tech visible/0 plain, OFF→0/7 on shell-mounted content; persists across reload (pre-paint script, no wrong-level flash); blocked storage → default ON + toggle still flips; state change announced via aria-live toast; `aria-pressed`/label/attribute/content always agree (`evidence/phase2/detail-mount.txt`, `evidence/phase5/a11y-verify.log` R2, `evidence/phase5/browser-matrix.log` per-engine).

## 5. Scope — reconciliation to brief & lecture

- **Structure:** registry = 3 principal chapters; ch2 merges the charge/coulomb/field lessons as sections 2.1/2.2/2.3 keeping ALL content and all 9 sims (`tools/build-fields-page.py` records the transform); old URLs → anchor-preserving redirect stubs + vercel redirect; legacy ids (hash routes, `?topic=` deep links, progress records) resolve via the registry alias map.
- **Quiz:** 35 → exactly 24 (8/8/8); ch2's eight all derive from lecture items; 11 sound-but-over-quota questions archived to `archive/js/quiz-data-ch2-extras.js`; every numeric answer recomputed by script (`tools/curate-quiz.mjs` + `docs/spec/verify-checks.mjs`).
- **Progress:** counts exactly ch1/ch2/ch3 (v4); v1 (`current/charges/magnetism/induction`), v2 (`current/efield/magind`), v3 (`charge/coulomb/field`) fixtures migrate losslessly (OR-merge; v1 magnetism pair still needs both halves; originals kept as `.legacy` copies).
- **Removed/archived as unmapped or forbidden:** mascot everywhere, rotating tips, hero parallax, boot chip strip, dead general-physics constants, perf-probe scripts, `lh.tmp.mjs`. Kept & mapped: progress export/import (R10 device-local), sandbox challenges (part of "keep their content and sims"), prefetch + single transition fade (§3.8 motion).
- **Lecture errors corrected:** (1) site uses 4.8×10⁻⁴ N arithmetic for the slide-21 example (the 4.7 typo appears nowhere); (2) "centripetal" used throughout (no "centrifugal" in active content); (3) k = 8.99×10⁹ computed AND printed everywhere, value stated in index footnote/README/quiz-data header.
- **Chapter 3 note:** Magnetism & Induction appears in **neither source document**; it ships under the prompt's project-approved scope (Lorentz, magnetic motion, flux, Faraday, Lenz, induction) with nothing added beyond it.
- **Production-vs-source finding:** production is a faithful minified+hashed build of `main` (bare source paths 404 there by design); the disagreement was semantic (commit `01675dd` rescoped the site around the lecture alone and demoted the brief's own circuits material to "Extra").

### 5.1 Post-audit: the real lecture PDF arrived (2026-10-23) and was verified slide-by-slide

`docs/spec/PHYSICS2 LEC01 Electrostatic.pdf` (24 slides) was supplied after the audit closed and
committed to `docs/spec/`; figure slides 16–18, 21–23 were rendered to `docs/spec/slides/` and read
as images. Verification log: end of `docs/spec/brief-digest.md`. Result: **every digest value and
both "known lecture errors" confirmed on-slide** (k = 8.99×10⁹ verbatim on slide 15; the collinear
figure on slide 17 matches the rebuilt preset geometry and arrow directions exactly; slide 18 shows
the 2-D layout with q₂ 73° above +x and the printed F=23, 24°; slides 22–23 show 0.700 m / 31.0°,
E₁ = 73.388×10³, Eₓ = 0, E = 75.595×10³ along +y; slide 19 carries the "centrifugal force" note;
slide 21's handwriting shows the 4.7×10⁻⁷ N slip).
One site deviation found and fixed as **DATA-04**: the slide-21 worked example and its quiz question
had quoted a ×10³-rescaled field (E = 2.0×10³ N/C → 10⁻⁴ N results); both now use the lecture's own
E = 2.0 N/C → (a) 3.6×10⁻⁷ N along E, (b) 4.8×10⁻⁷ N opposite E, with an on-page correction note.
The course-brief PDF is still outstanding; R-rows remain digest-sourced (documented in `docs/spec/README.md`).
Re-verified after the change: smoke 536/536, check 0, interact PASS, quiz-verify 18/18,
lecture-values 19/19, a11y 17/17, nav 31/31, loader 16/16 (×3 runs), matrix PASS ×3 engines
(`evidence/phase6/`).

## 6. Design & motion changes

Electric-yellow accent token (`--ye: #e9ff47`) now drives primary buttons, tags, highlights, selection, the loader bar and the circuit motif; bold chapter numerals; hover states use lighter tokens instead of filters; near-black base + high-contrast ink retained (body ≥4.5:1). Motion inventory (all transform/opacity): staggered reveals (fire once, visible-without-JS), shell chapter entrance, Detail crossfade + staged block rise, value ticks, flag pops, score entrance, docked-timer bar; `prefers-reduced-motion` removes decoration and keeps every state feedback (verified R1–R3). Removed: mascot bob, hero parallax, tip rotator, cross-document VT (single fade implementation on all engines). Style bans are now a permanent gate (`check-scope.mjs`): no gradients/backdrop-filter declarations/shadowBlur/blur/drop-shadow in active files.

## 7. Performance — measured before/after (same tools, same viewport, local server)

| Metric (tool) | Baseline (`01675dd`+) | Final | Evidence |
|---|---|---|---|
| Console/page errors per page (sweep) | 3–5 | **0** on all 5 pages | `evidence/baseline/sweep.json` → `evidence/phase5/sweep.json` |
| Third-party requests (live) | 2 origins (vercel-insights, jsdelivr) | **0** in source; live **not verified** (no deploy access) | `live-origins.txt` → `check-scope` PASS |
| Boot overlay lifetime | 4025–4113 ms (failsafe) | 0 ms on fast loads; 469–590 ms when startup genuinely exceeds 150 ms; ≤1.5 s watchdog | sweeps above; `loader-verify.log` |
| Canvas size stability | unbounded growth (+3px/frame) | constant (440px) | `repro-unstable.mjs`, phase2 logs |
| Animation chains (perf:guard) | guard FAIL (0 where 1 expected ×3 — nothing ran) | **guard OK**: home 0 (no permanent loops), lorentz 1 visible / 0 hidden, essential motion 1 | `evidence/baseline/perf-guard.log` → `evidence/phase5/perf-guard.log` |
| CLS | 0 (trivially — engine dead) | index 0.0030, quiz 0.0463, chapters 0.0000 — all ≤0.1 | `evidence/phase5/sweep.json`, guard log |
| Page transfer (perf budgets <500K) | 163–184 KB/page | 178–266 KB/page (fields.html carries 3 merged lessons) — **all budgets met** | `evidence/{baseline,phase5}/perf.log` |
| Home JS heap (informational) | 2.67 MB | 3.31 MB | perf-guard logs |
| DPR cap / offscreen pause / teardown | present | present + browser-verified (stage identity teardown, 0 leaked listeners after chapter switch, single script fetch) | `nav-verify.log`, `test-interact.log` |

Honest note: heap and per-page transfer rose slightly (merged chapter page, new gates); both remain inside the unchanged budgets. No budget or lint rule was loosened anywhere in this audit.

## 8. Gate table

| Gate | Result | Command / evidence |
|---|---|---|
| **Z** Scope | **PASS** | `SCOPE_TRACE.md` (no MISSING, unmapped features removed), `check-scope` clean, `docs/spec/verify-checks.mjs` 12/12, lecture errors corrected, `lecture-values` 19/19 in-browser |
| **L** Loader | **PASS** | `npm run loader-verify` 16/16 (`evidence/phase5/loader-verify.log`) |
| **D** Detail | **PASS** | `check-detail-parity` (in `npm run check`), `detail-mount.txt`, a11y R2, matrix per-engine |
| **C** Content | **PASS** | smoke 536/536 (3 chapters, 24=8/8/8, derived counts, old URLs), `nav-verify` §4 |
| **N** Navigation | **PASS** | `npm run nav-verify` 31/31 ×2 consecutive (`evidence/phase5/nav-verify.log`) |
| **S** Sims | **PASS** | `npm run test:interact` 18 ok, `npm run lecture-values` 19/19, smoke per-sim physics |
| **Q** Quiz | **PASS** | `npm run quiz-verify` 18/18, smoke quiz sections incl. stale-bank + fixtures |
| **P** Progress | **PASS** | smoke v1/v2/v3 migration fixtures (nothing lost, originals kept), browser counts |
| **X** Network | **PASS (local)** | sweep: 0 third-party/0 failed/0 console errors all pages; `check-scope`; **live: not verified** (no deploy access) |
| **V** Visual | **PASS** | sweep: zero overflow flags at 360/390/640/900/1200/1440 on all pages; CLS ≤0.046; banned-style grep gate clean |
| **A** Accessibility | **PASS** | `npm run a11y-verify` 17/17 (keyboard-only home→chapter→sim→quiz→results, visible focus, words-not-colour) |
| **R** Reduced motion | **PASS** | a11y-verify R1–R3 (reveals visible, 0 running animations, all state feedback intact); shell-stress reduce cases |
| **B** Browsers | **PASS** | `npm run browser-matrix`: Chrome 156.0.8078.4, Firefox 157.0, Edge 156.0.4314.42 — 11 flows ×3 engines PASS (`evidence/phase5/browser-matrix.log`). Safari/mobile hardware: **untested** |
| **T** Project checks | **PASS** | `check`✓ `test`✓ `build`✓(as `build:css`+`build:public`; `bun` unavailable→npm) `perf`✓ `perf:guard`✓ `test:interact`✓ `test:shell`✓ `shots`✓ — all exit 0, logs in `evidence/phase5/` |

Environments that could not run: production deploy (no credentials) — anything "live" is **not verified live**; bun (absent — npm substituted, outputs equivalent); Safari/iOS/Android hardware (untested).

## 9. Remaining issues & blockers

1. **Deployment not performed** (no push/Vercel credentials). Everything above is verified locally; the live site still serves the broken `main` build until this branch is merged and deployed. → **not verified live.**
2. `bun.lock` not regenerated for the added devDependencies (puppeteer, playwright) — bun unavailable here; regenerate with `bun install` before merge so the Vercel build pins them.
3. OG card artwork (`img/og-card.png`) still shows pre-audit branding text; regenerate with `npm run og:card` during the next identity pass (meta tags themselves are correct).
4. Quiz CLS 0.046 (≤0.1 ✓) comes from the results-area entrance; could be flattened with reserved chart heights if desired.
5. Brand-mark/favicon artwork is the old character logo (kept deliberately — replacing favicons is an identity task outside the audit's fix scope; the *mascot features* are removed).
6. Blocked-attempt log: 3 environment workarounds (playwright install-deps hang → manual apt; first apt timeout → warm-cache resume; /tmp clone → moved under /home/user). No fix required >3 attempts; the `lastJump` scope leak was caught and fixed on its second iteration.

## 9A. Second-brief addendum (stabilization, intro, cute polish)

A follow-up brief requested reproduction of reported chapter-navigation / Details /
link regressions, a YTPMV-inspired opening, and mascot-led cute polish.
- **Reproduction first:** `tools/stability-stress.mjs` executes the required browser
  sequences verbatim (35 checks). On this branch they PASS — the reported symptoms
  trace to BOOT-01/NAV-01/NAV-02/DETAIL-01, fixed and re-verified earlier; recorded as
  NAV-03/DET-03/LINK-01 *Not reproducible* with the harness kept as a permanent monitor.
  Typography parity (PART 4.5) measured: every plain/tech pair shares font-size and
  line-height (`.lede` = 1.04rem/1.8 ≈ 16.6px, with a `.lede.small` guard rail).
- **Intro:** see BUG_AUDIT INTRO-01 for the full contract and verification
  (intro-verify 10/10, a11y A0 5/5, smoke +14, frames in `evidence/phase6/intro-frames/`).
  Reference-video honesty: metadata inspected via YouTube oEmbed and the watch page
  ("The Larping Tombstone — Larping the Rooms [Green Version]"); the FOOTAGE itself was
  not inspectable (bot-gate; no frame/audio access), so the composition follows the
  written design direction using only site-local assets — no copyrighted footage/audio.
- **Mascot:** restored as the identity anchor (BUG_AUDIT MASCOT-01); no mascot image was
  attached to the brief (`uploads/` held only the lecture PDF), so the project's own
  Denki-chan artwork is the source.
- **Regression after the additions:** every tool green again (`evidence/phase6/`),
  including perf:guard home chains = 0 (the intro adds no JS animation loop) and the
  three-engine browser matrix.

## 10. Deployment status

**Not verified live.** https://emc-lab.vercel.app still serves the pre-audit build (BOOT-01 dead engine + third-party analytics were re-confirmed there during Phase 1). The fix exists on local branch `fix/emc-audit` (commits `3dab934..HEAD`); merging and deploying requires credentials this environment does not have. Per the operating rules this report therefore states: **the fix is not live and not verified live.**
