# BUG_AUDIT — EMC Lab audit & contract register

Compact register of every audited finding and every gate-contract change. **All
findings below are resolved**; the code plus the gates in `README.md` §7 are the
living source of truth. The full narrative history (repro steps, root causes,
per-phase evidence) lives in git history — the evidence piles and the long-form
entries were pruned in the 2026-10-24 repository cleanup because every fix is in
the code and every gate is re-runnable.

Status key: **Fixed** = repro re-run and passing · **Not reproducible** = never
observed on the audit branch · **Deliberate** = informed reversal of a report.
Browsers actually exercised: Playwright Chromium 156 / Firefox 157 / Edge 156
(msedge channel) — the single Playwright stack also drives the perf tools since
the 2026-10-24 consolidation.

---

## 1. Resolved findings

| ID | Sev | Finding (one line) | Outcome |
|---|---|---|---|
| BOOT-01 | Crit | Engine dead on every page (boot threw before `window.EMC`) | Fixed — loader lifecycle owned solely by `js/common.js` |
| BOOT-02 | High | Loader violated the §3.1 lifecycle contract | Fixed — `tools/loader-verify.mjs` (16 checks) encodes it |
| BOOT-03 | High | Boot overlay stuck ~4 s on every page | Fixed — symptom of BOOT-01/02 |
| SIM-01 | Crit | Canvas grew without bound (resize feedback loop) | Fixed — HiDPI `Stage` in `js/common.js` |
| SIM-02 | High | Sandbox preset clicks before init silently dropped | Fixed — input queued until init |
| DETAIL-01 | High | Detail Mode toggle dead; state contract off-spec | Fixed — pref applied pre-paint, `aria-pressed` |
| DETAIL-02 | High | Explanation-level parity violations | Fixed — `tools/check-detail-parity.mjs` gate |
| SCOPE-01 | Crit | Site scope contradicted the course brief | Fixed — the brief's three chapters, all principal |
| DEPLOY-01 | Info | Production assets minified+hashed, source paths 404 | By design — `tools/build-public.mjs` content-hash + immutable headers |
| NET-01 | High | Third-party runtime requests in production | Fixed — KaTeX/Chart.js/fonts vendored; `tools/check-scope.mjs` gates it |
| UI-01 | Med | Horizontal overflow at 360 px | Fixed — `overflow-x: clip`, coarse-pointer pass |
| DATA-01 | High | Coulomb constant not the lecture value | Fixed — k = 8.99×10⁹ computed *and* printed everywhere |
| DATA-02 | High | Arena "lecture" presets ≠ lecture configurations | Fixed — presets reproduce 5.69 N / 22.7 N ∠24° |
| DATA-03 | High | Field worked-example geometry ≠ lecture | Fixed — replica preset reads 75,595 N/C +y |
| R1-01 | Crit | Circuit builder had no drag & drop (brief R1 gap) | Fixed — `js/sim-circuit.js` bench |
| A11Y-01 | High | Keyboard 'n' jump answered the wrong card; inert complete-buttons | Fixed |
| NAV-01 | High | Shell routing dead (downstream of BOOT-01) | Fixed — full §3.3 matrix via `tools/nav-verify.mjs` |
| NAV-02 | Med | Chapter links full-navigated without View Transitions; VT aborts | Fixed — one cleanup path in `js/shell.js` |
| NAV-03 | Med | Reported chapter-navigation flakiness | Not reproducible |
| DET-03 | Med | Reported Details-switch inconsistency / typography jump | Not reproducible |
| LINK-01 | Med | Reported broken links | Not reproducible |
| INTRO-01 | Feat | Once-per-session opening (brief PART 6) | Working — now the v5 chorus cut (`js/intro.js`) |
| INTRO-02 | Med | Intro beats hid their own content (colour + back-fill) | Fixed — opacity/fill discipline in the intro CSS |
| MASCOT-01 | Info | Mascot restored as identity anchor (PART 7.4) | Deliberate |
| MASCOT-02 | Info | Client's drawn mascot art integrated | Working — hero/header/favicon/social card |
| DATA-04 | Med | Slide-21 example quoted a ×10³-rescaled field | Fixed — lecture's real 2.0 N/C → 3.6/4.8×10⁻⁷ N |
| TOOL-01 | Med | Perf scripts unrunnable from a clean install | Fixed — devDeps declared |
| TOOL-02 | Low | Repo hygiene / dead files | Fixed |
| TOOL-03 | Info | Smoke test re-encoded to the brief's scope | Done — strictness increased, not loosened |
| QUIZ-01 | High | Quiz engine runtime gaps (stale state, §3.5 browser items) | Fixed — `tools/quiz-verify.mjs` |
| QUIZ-02 | Med | Floating timer covered answer options at 360 px | Fixed |
| PHASE-7 | — | Drawn-mascot identity + footage-driven intro v3 | Done |
| PHASE-8 | — | Site-wide motion system, sticker assets, gate harnesses | Done — `js/motion.js`, `tools/motion-verify.mjs`, `tools/asset-verify.mjs` |
| PHASE-9 | — | Intro v4: 1:6 reference cut (9c) + S4 at footage tempo (9d) | Superseded by PHASE-10 |
| PHASE-10 | — | Intro v5 "chorus cut" rebuilt off footage 21 s (main motion), topics + formulas with blur whips | Current — `docs/reference/animation-reference.md` §4 |
| CLEANUP-26-10-24 | — | Purpose-based repo restructure (evidence piles, archive, one-off tools removed) | Done — this register is its survivor |
| INTRO-03 | High | Intro CSS timeline ran from page-parse, JS master clock from `.play`: slow boots played the opening beats invisibly, joined mid-composition and froze on the closed letterbox tail (measured 767 ms drift with an 800 ms-delayed dependency; up to ~1.5 s at the watchdog ceiling) | Fixed — `#introOverlay:not(.play)` pauses the subtree at t=0; `currentTime = 0` at `.play` verified under delayed boot |
| INTRO-04 | Med | Animated blur whips re-rasterise per frame: ~150 dropped frames + 1.0 s worst frame on a mid-tier phone profile across the 14 s composition | Fixed — `.lite` cut on `EMC.lowTier` (blur-free keyframe swaps, identical beat grid); worst frame −44 %; full fidelity elsewhere |
| SHELL-01 | Med | A transient sim-script fetch failure cached `''` for the whole session — that chapter's sims stayed silently dead across every later mount until a full reload | Fixed — failures are never cached; the next mount retries |
| DEPLOY-02 | Low | `/img/` + `/favicon.ico` served `max-age=0, must-revalidate`: a revalidation round trip per image per pageview | Fixed — 24 h cache headers in `vercel.json`; og-card cache-buster bumped ?v=4→?v=5 on all five pages |
| ASSET-01 | Low | Repo/deploy hygiene: 56 KB of unreferenced woff2 (lilita-one, m-plus-rounded-1c ×2) shipped to production; og-card.png 877 KB; dead `window.tailwind` inline script on all five pages (CDN-era leftover) | Fixed — fonts removed, og-card losslessly recompressed to 601 KB (pixels verified identical, IHDR gate intact), dead script removed |
| GATE-01 | Med | smoke-test's two blur/gradient ban scans keyed a marker string (`PHASE 8 — site-wide motion system`) that no longer exists in input.css → `indexOf` = −1 → both scans silently degenerated to a one-character slice (vacuous since the phase-8 comment was retitled) | Fixed — re-pointed to the real header `Site-wide motion system`; strictness increase, logged in §2 |
| SHELL-02 | Crit | **Production-only:** the shell's hard-coded skip list (`'registry.js','common.js','motion.js'` substring match) missed content-hashed production names (`common.58f7f516.js` ∌ `common.js`) → **common.js re-executed on every shell chapter mount**, re-running boot(): Detail toggle dead after the first chapter visit (double-bound handler flips twice = net zero), Topics dropdown and mobile nav menu dead (open-then-cancel), boot loader re-armed (overlay flash), scroll/prefetch/transition listeners accumulating. Every behavioural gate serves the UNHASHED source layout, where the filter works — so the whole suite stayed green while the deployed site rotted per chapter switch. Repro: visit any chapter from the homepage, then flip Details / open the dropdown | Fixed — shell skip-set is now basename-matched against the scripts index actually loaded (hash-proof, `js/shell.js` LOADED) + common.js carries a re-execution guard (a live engine is returned, never re-booted); new production-layout gate `tools/prod-verify.mjs` (`npm run verify:prod`, 14 checks) proven to FAIL 7 checks on the pre-fix build |

## 2. Binding contract changes (test-change justification log)

Integrity rule: gate windows and assertions are only ever **re-pointed with a
written justification, never deleted or weakened**. The changes that still shape
the gates today:

- **Loader numerics (BOOT-02):** `loader-verify` asserts stage order, ~240 ms exit,
  1500 ms watchdog, fatal-card behaviour.
- **Scope re-encode (SCOPE-01/TOOL-03):** smoke suite re-pointed to the three
  chapters; strictness increased (24-question invariants, parity gate added).
- **K constant (DATA-01):** smoke expects `K: 8.99e9`; the ±2 % numeric tolerance
  is unchanged (constant correction, not loosening).
- **Intro v4 1:6 cut (9c):** `intro-verify` auto-end window moved to 11.5–14.5 s.
- **Intro S4 footage tempo (9d):** window moved to **13.6–16.6 s** after `load`;
  overlay-removal waits 20 s; `capture-intro-video` 25 s; `capture-site-intro`
  loop cap 16 s; all verifier file-server walks exclude `Video/` (the 46 MB MP4
  OOM-killed a renderer when preloaded); `stability-stress` scenarios 13/10/8 run
  in fresh contexts (same-site renderer RAM). Assertions byte-identical.
- **Intro v5 chorus cut (PHASE-10, user directive 2026-10-24):** v4-grammar
  assertions replaced by v5-grammar ones (topic-slam stroke, whip keyframes, ramp
  steps, beat onsets, collage bed) plus an assertion that the v4 classes are gone;
  the flat-art **blur ban now holds site-wide except `#introOverlay`** (user asked
  for the footage's smear grammar "with blur and stuff") and `check-scope` strips
  the intro block before its ban scan; `TOTAL_MS = 14000` keeps the unchanged
  13.6–16.6 s window (measured auto-end ≈14.5 s).
- **Single browser stack (2026-10-24 consolidation):** `perf-audit`, `perf-measure`
  and `make-og-card` moved from puppeteer to Playwright chromium (the engine every
  other gate already used); the `PERF_ENGINE` switch, the puppeteer import fallbacks
  and the `PUPPETEER_EXECUTABLE_PATH` workaround were deleted and the `puppeteer`
  devDependency dropped. Guard invariants are counts (0/1 rAF chains, CLS < 0.01)
  and audit budgets are server-gzipped transfer bytes, so neither is
  engine-sensitive; re-verified green on the new engine (guard OK, all budgets met,
  og-card regenerated pixel-equivalent).
- **Intro lifecycle refactor merge (2026-10-24):** origin's refactor of the v5
  controller (named listener bookkeeping + CTA-click preservation) renamed
  `sessionPlayed()` to `hasPlayedThisSession()`; the smoke source-token assertion
  was re-pointed to the new identifier — intent unchanged (chapter-route skip,
  replay gate, boot-fatal cancel all still asserted).
- **Social card becomes AI-generated artwork (2026-10-24, user directive after the
  lavender kawaii UI redesign):** `img/og-card.png` is now generated artwork
  (1200×630, cache-buster bumped ?v=2→?v=3 on all six pages) instead of a render
  of `tools/og-card.html`; the renderer pair (`tools/og-card.html` +
  `tools/make-og-card.mjs` + the `og:card` script) was deleted — "no need to use
  the css or js to generate an image". The smoke size assertion (1200×630 IHDR)
  still guards the committed PNG; the derived-counts mechanism retired with the
  renderer (the artwork carries no counts).
- **Start-CTA focus gate (PHASE-10 follow-up):** the intro CTA is
  `visibility: hidden` until it pops so `introSkip` stays the first tab stop
  (`a11y-verify` gate A0).
- **Motion-marker re-point (GATE-01, 2026-10-25):** smoke-test's two
  blur/gradient ban scans (`cssNoIntro` and the "blur whips live in the intro
  overlay alone" tail scan) keyed the marker `PHASE 8 — site-wide motion
  system`, which has not existed in input.css since the section was retitled
  `Site-wide motion system`: `indexOf` returned −1, `slice(−1)` yielded a
  one-character slice and both bans silently scanned nothing. Re-pointed at
  the real header — a strictness INCREASE (the motion-system and ch-art CSS
  are now genuinely scanned and pass; the post-marker region was verified
  free of gradient/backdrop-filter/blur tokens before the change). Assertion
  logic is otherwise byte-identical.
- **Intro clock sync + low-tier cut (INTRO-03/INTRO-04, 2026-10-25):** no
  gate window or assertion changed. The `#introOverlay:not(.play)` pause rule
  pins the CSS beat grid to the JS master clock (all 12 intro-verify checks
  green; measured auto-end ≈14.5 s, unchanged) and the `.lite` keyframe swaps
  are name-only overrides that inherit every delay/duration/easing, so the
  v5 grammar assertions (stroke, whip keyframes, ramp steps, collage bed)
  hold on both cuts — smoke asserts the blur whips exist in source, which
  they still do, unchanged, for full-fidelity machines.
- **Production-layout gate (SHELL-02, 2026-10-25):** NEW gate
  `tools/prod-verify.mjs` (`npm run verify:prod`) — an addition, no existing
  assertion re-pointed. It runs the shell-mount-affected contracts (engine
  identity across mounts, Detail-toggle flips after one AND two mounts,
  dropdown, 360 px nav menu, zero re-created boot overlays, lazy sim init,
  zero errors) against the HASHED `public/` build, because every pre-existing
  behavioural gate serves the source layout and a source-layout-only suite
  passed while production was broken. Proven to catch the original bug:
  7 FAILs on the pre-fix build, PASS after. `build:public` auto-runs when
  `public/` is missing.

## 3. Pointers

- Requirements & lecture values: `docs/spec/` (lecture PDF, brief digest,
  independent recompute `docs/spec/verify-checks.mjs`).
- Intro & motion grammar: `docs/reference/animation-reference.md`.
- Commands & gates: `README.md` §7.
- Pre-cleanup narrative (per-bug repro/root-cause/evidence): git history.
