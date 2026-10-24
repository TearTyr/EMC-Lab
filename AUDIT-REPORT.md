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
  Reference-video verification log (attempted in order, per the follow-up brief):
  1. oEmbed metadata: OK — title/author ("The Larping Tombstone — Larping the Rooms
     [Green Version] (Looping The Rooms Remix)").
  2. Watch page in real Chromium: page text only; playback bot-gated
     ("Sign in to confirm that you're not a bot").
  3. Embed player (autoplay+mute): "Video player configuration error / Error 153".
  4. yt-dlp (node JS runtime; player clients android,mweb,tv; worst format):
     "Sign in to confirm you're not a bot" on every client.
  5. Signed storyboards (i.ytimg.com/sb/…L0-L2): HTTP 403.
  6. Public Invidious/Piped fronts (6 instances): 502/403/530/DNS failures.
  7. Caption track (timedtext): HTTP 200, empty body (no captions exist).
  8. LOCALLY ACCESSIBLE FRAMES (inspected as images, saved in
     evidence/phase6/reference/): the chosen thumbnail (1280×720) and YouTube's
     timeline-quartile frames 1.jpg/2.jpg/3.jpg (120×90, ≈25/50/75% of runtime) —
     these are genuine footage stills, not the chosen thumbnail.
  **Therefore: the video was NOT watched.** Playback, editing rhythm at frame
  precision, transitions and audio remain unverified; no claim otherwise is made
  *(superseded for video 8CilACT9uFs by §9B: the footage became accessible via the
  repository `Video/` folder and WAS inspected frame-by-frame on 2026-10-23)*
  anywhere. What the accessible frames show and what was adopted from them:
  flat saturated single-colour fields swapped per beat (green field with pictogram
  subjects at ~25%, blue/yellow starburst sign-collage at ~50%, dark field with one
  glowing accent at ~75%), diagonal flat corner panels and chunky angled display
  type with scanline duotone in the channel branding. The intro therefore gained
  (a) hard-cut background field swaps on the montage beats (yellow → pink → dark,
  steps() timing, flat colours), (b) two outlined diagonal wedges behind the
  composition, and (c) a colour-collision play (the yellow title half goes dark
  while the yellow field is up). Everything else follows the written creative
  direction with site-local assets only; no copyrighted footage or audio is used.

  Second reference video (follow-up brief, id 8CilACT9uFs — 「シェリーライド」 / 제타 Zeta per
  oEmbed): the SAME access ladder was re-run and blocked identically (embed Error 153,
  yt-dlp bot-gate on all clients, storyboards 403, no captions attempted-needed). The
  accessible thumbnail + timeline-quartile frames (evidence/phase6/reference2/) show
  letterbox bars over flat yellow fields, cut-out subjects, tilted white sticker plates
  with bold outlined type and diagonal arrow slashes. Adopted from those stills plus the
  client's "more motion-graphics type" direction: cinematic letterbox for the whole intro,
  tilted cream sticker plates (kicker + chapter chips), an outlined diagonal arrow slash on
  the cheer beat, and per-letter kinetic title type (six staggered slams, tracking pop,
  marker swipe, flat sticker stroke). The attached mascot PNGs (two eye states) replaced the
  SVG hero/intro/cheer art after white-background removal (MASCOT-02); frame review of our
  own output caught and fixed four composition defects (INTRO-02). Again: the video was NOT
  watched — playback, cut precision and audio remain unverified and are claimed nowhere.
  *(superseded by §9B for this video ID)*
- **Mascot:** restored as the identity anchor (BUG_AUDIT MASCOT-01); no mascot image was
  attached to the brief (`uploads/` held only the lecture PDF), so the project's own
  Denki-chan artwork is the source.
- **Regression after the additions:** every tool green again (`evidence/phase6/`),
  including perf:guard home chains = 0 (the intro adds no JS animation loop) and the
  three-engine browser matrix.


## 9B. Phase-7 addendum — footage inspected, intro v3, drawn-mascot identity (2026-10-23)

1. **Reference access upgraded from metadata to footage.** `git fetch origin`
   succeeded; `origin/main` carries `2e836f8 "Create シェリーライド.mp4"` placing
   `Video/シェリーライド.mp4` in the repository (the master prompt's preferred
   route). The file is real media: 46,580,541 bytes, `ftyp isom`, h264 1920×1080
   @60 fps with an AAC-LC stereo track (ffmpeg 7.0.2 via imageio-ffmpeg).
   Inspection performed: 6×6 overview contact sheet @2 s, 6×4 opening sheet
   @0.5 s, ±0.35 s pairs around every scene-cut (thresholds 0.4/0.25), all
   viewed with the vision tool; audio decoded to WAV and analysed as an RMS
   onset envelope (67 onsets; first at 1.50 s; chorus phrase pulse 1.15–1.20 s
   with 0.30 s fills). Timestamped breakdown:
   `evidence/phase7/reference-analysis.md`; sheets
   `evidence/phase7/reference-overview-sheet.png`,
   `.scratch/ref-analysis/opening.png`, `.scratch/ref-analysis/cutpairs.png`.
2. **What the footage actually does** (correcting the thumbnail-era reading):
   confetti pops → white flash → character cut-out with the outlined title
   LOCKED BELOW it over a faint silhouette strip; discrete paper-doll pose
   swaps on the phrase pulse; VS skit interlude with tilted 3D inset stills on
   the same field; hard insert cut to a black field with red banner + caption;
   collage chorus (panel rectangles, name-plate chip top, small chip bottom,
   wedge slashes, huge rotated outlined lyric slams one per beat, bubble +
   starburst badges, motion-blur whip); white-flash dips on section cuts;
   bookend callback to the title field; end card → black.
3. **Intro v3** transcribes that grammar at EMC-Lab scale: 5.8 s = five 1.16 s
   phrases; pink/plum field mapping of the reference's yellow/blue; pose swaps
   via the two drawn eye states; word slams VOLTS/FIELDS/FORCE/SPARK!; bookend
   then the letterbox wipe into the rendered homepage. Contract re-verified:
   intro-verify 10/10, matrix ×3 engines, sweep clean, perf index 380 K < 500 K,
   perf:guard home rAF chains 0. Frames: `evidence/phase7/intro-frames/`.
4. **Drawn-mascot identity completed (BRAND-01):** every SVG-generated mascot
   image is gone from live surfaces — header/footer brand marks (10 inline
   SVGs), the favicon source (`img/favicon.svg` deleted; `favicon.ico` and
   `img/apple-touch-icon.png` regenerated from `img/mascot.png`), and the
   social card (`tools/og-card.html` + regenerated `img/og-card.png`). Icon
   link is now the drawn PNG; smoke #15 asserts artwork identity across brand
   mark, icon link and file on disk for all five pages.
5. **Merge:** `origin/main` (user commits `719edc8`, `405af20`, `2e836f8`)
   merged as `33afc78`; the user's loader telemetry/`emc:loader-done` contract
   already existed identically here; drawn-PNG artwork kept over the squash's
   older SVG variants; `Video/` accepted as a dev-only reference — `build:public`
   copies only the allow-listed dirs, and `public/` was verified to contain no
   `Video/` or `archive/` content.
6. **Deployment:** unchanged — no push/Vercel credentials exist; production
   remains **not verified live** (§10).

## 9C. Phase-8 addendum — transitions, assets, bug fixes (2026-10-23)

**Scope delivered (master prompt v4):** reference GIF, true frame-level footage
review, frame-accurate transition timeline, site-wide motion system, three
physics-correct chapter diagrams, favicon/assertion/timing bug fixes, new
gates, honest environment reporting. All on `fix/emc-audit`, continuing phase 7.

**Reference media & method.** MP4: `Video/シェリーライド.mp4` (70.47 s, 1080p60).
GIF: phase-8 intro-section GIF (0→12.12 s), SUPERSEDED in phase 9 by full-video
segments `evidence/video-analysis/reference-full-01…04` (0→70.47 s, verified);
see `evidence/video-analysis/reference-analysis.md` + `gif-conversion-notes.md`. Frame-by-frame method
(`reference-review-log.md`): every one of 4226 decoded frames passed through a
numeric diff/luminance pass; `showinfo` PTS table proved CFR (16.7 ms deltas,
six anomalies); 111 transition clusters; sequential visual batches = 9 overview
sheets @2 fps (all read) + 4 intro sheets @4 fps (read) + 15 consecutive-frame
event strips at 60 fps around every cut/flash/swap/whip (S00/S02/S05/S06 read
individually, the rest cross-verified in sheets + numeric curves, all saved).
No real-time player exists in this agent session — stated, not hidden.

**Timeline highlights (verified):** confetti pops 0.25–0.5 s apart over an empty
field → 2-frame pure-white snap f156–157 (2.616 s) → ~90 ms dissolve + staggered
lock-up bursts → pose swaps on the 1.15–1.2 s phrase grid with 0.3 s fills →
whip-squash pose change f440–447 → white-flash dips at 12.116/21.449/40.233/
49.650/59.033 (2 white frames + 150–300 ms decay) → hard cuts (no flash) at
18.916 and 68.516 → continuous rotateY inset spin in the skit → rotated word
slams one per beat → bookend callback → centred end-card still.

**Site changes.** `js/motion.js` (new) + motion CSS block: rise/slam/slide/pop
(90–300 ms), flash dip 260 ms @85 % white at route boundaries, whip squash,
slow rotateY spin; `html.mx-js` gate (content visible if JS dies), `mx-paused`
hidden-tab pause, reduced-motion final states, single-init guard. Hooks:
`emc:view-shown` from shell home/topic switches; quiz jump whip AFTER
synchronous state commit; dropdown pop; intro insets now spin continuously
(4 s, slowed from ~2 s — logged deviation); confetti enlarged + lime accent +
two extra pieces; insets enlarged. Pages touched: index, quiz, 3 chapters
(markup), shell.js, quiz.js, common.js untouched beyond HAVE-list in shell,
css/input.css. Generated assets: `img/art-ch1/2/3.png` (480×480 palette PNGs,
42–59 KB) with HTML `+ − N S` overlays; two drafts rejected for wrong physics
(double-headed field line; mixed loop circulation).

**Bug fixes.** favicon.ico rebuilt square 16/32/48 (was 48×49) + decoded-entry
validation; three v2-era assertions re-reviewed and strengthened (negative
per-letter markers; `in-insetspin` infinite requirement); fixed 6.6 s/1.9 s
smoke sleeps replaced by poll-until-removed + explicit auto-end windows
(5.2–7.4 s / <2.8 s RM); intro-verify grew re-init guards 9–10; shell no longer
double-fetches motion.js (NAV-04); `perf-measure` gained `--disable-dev-shm-
usage` + `PERF_ENGINE=playwright` override (TOOL-05, measurements unchanged).

**Test results (actual, this session, post-final-code unless noted):**
check exit 0 · smoke 556/556 · interact PASS · shell PASS · stability 35/35 ·
nav 31/31 · loader 16/16 · quiz 18/18 · lecture 19/19 · a11y 22/22 ·
intro 12/12 · motion 10/10 · asset 8 checks ×6 passes PASS · perf budgets PASS ·
baseline-sweep 0 overflow/0 third-party (baseline dir restored after) ·
browser-matrix Chrome 11/11 exit 0 with Firefox+Edge rows UNTESTED (ENV-01) ·
build:public OK. Logs: `evidence/phase8/*.log`.

**Environment losses (ENV-01, honest):** Firefox 157 content process SIGSEGVs
in this container (signal 11 even on `data:` URLs; apt lib set + sandbox env
vars tried — 3-attempt rule honoured); Edge binary absent from the reset base
image; late-session, ~750 unreapable zombie tasks (parent = session supervisor)
consume the kernel's 925-thread budget, so every further browser launch fails
(`pthread_create: EAGAIN`, then target crashes). Consequently `perf:guard` and
`shots` were not re-run after the last tool-only edit, and matrix firefox/edge
rows stay UNTESTED here; phase-7 logs record them green on the pre-phase-8
tree. Zombies do not persist across sessions — rerun the full battery first
thing next session.

**Showcase (genuine captures, final code):** `evidence/phase8/strips/`
(SITE-intro-early-fixed, SITE-intro-stages, SITE-chapter-art),
`evidence/phase8/site-intro.gif` + `site-intro-frames.png` (site intro capture);
reference viewing sheets now live in `evidence/video-analysis/sheets/` (the old
2 fps `sheets/` batch was replaced by the denser 4 fps set and removed);
page screenshots in `shots/` and `.scratch/pages/` (dev area, not shipped).

## 10. Deployment status

**Not verified live.** https://emc-lab.vercel.app still serves the pre-audit build (BOOT-01 dead engine + third-party analytics were re-confirmed there during Phase 1). The fix exists on local branch `fix/emc-audit` (commits `3dab934..HEAD`); merging and deploying requires credentials this environment does not have. Per the operating rules this report therefore states: **the fix is not live and not verified live.**

## 9D. Phase-9 addendum (full-video review, 2026-10-24)

Complete-video re-review per the addendum brief: source re-measured (70.47 s,
4225 frames, 1080p60 h264 + AAC + cover PNG); entire footage converted to four
consecutive verified GIF segments + a 30 fps flash montage
(`evidence/video-analysis/`); independent 4 fps sequential viewing pass over all
282 frame slots (sheets W01–W12) plus consecutive-frame slow-motion re-reads of
every fast transition; one prior claim corrected (no black tail — the last ten
decoded frames are the end card). Five additional reference patterns
(full-video-only: staged line reveal, corner slam cluster, strikethrough draw,
starburst badge pop, locked caption) implemented site-wide on real state
changes; reduced-motion and flat-art rules honoured. Cleanup removed the
byte-identical scratch MP4 duplicate, the superseded intro-only GIF, the
replaced 2 fps sheet batch and ref-analysis intermediates; originals, strips
and docs preserved. Full battery re-run: every gate passes (see PROGRESS.md
phase 9); two tool walk-lists gained evidence/Video exclusions (written
rationale in-tool: RAM preload OOM-killed the renderer; assertions untouched,
misses[] now also proves no page requests those paths).
