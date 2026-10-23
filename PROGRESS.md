# PROGRESS — fix/emc-audit (FINAL)

## Environment substitutions (honest record)
- **Spec PDFs not provided** → prompt digest transcribed to `docs/spec/brief-digest.md`; all 12
  lecture check values independently recomputed (`docs/spec/verify-checks.mjs`, 12/12 ≤1%).
- **bun not installed** → npm/node used for every script (`bun.lock` NOT regenerated — see
  AUDIT-REPORT §9.2). Vercel's bun build path untouched.
- **No git push / no Vercel credentials** → deployment NOT performed: **not verified live**.
- Playwright 1.64.1: chromium 156.0.8078.4, firefox 157.0, msedge 156.0.4314.42 — all verified.
  puppeteer (Chrome 148) declared as devDependency for the perf tools (TOOL-01).

## Status board — ALL PHASES COMPLETE
- [x] Phase 1 — Baseline: evidence + BUG_AUDIT.md + SCOPE_TRACE.md before any edit (commit 6f03d43-era)
- [x] Phase 2 — Critical repairs:
  - [x] BOOT-01 engine dead everywhere (root cause: boot before window.EMC assignment) — FIXED
  - [x] SIM-01 canvas infinite growth (border-box → content-box feedback) — FIXED
  - [x] SIM-02 pre-init preset clicks dropped — FIXED
  - [x] NET-01 third-party analytics removed + purity gates — FIXED (live: not verified)
  - [x] DATA-01 k=8.99e9 everywhere + stated — FIXED
  - [x] BOOT-02/03 loader rebuilt to §3.1 (150ms gate / 240ms exit / 1500ms watchdog / error card) — FIXED
  - [x] DETAIL-01 aria-pressed + announce + blocked storage — FIXED
  - [x] SCOPE-01 three-chapter reconciliation (registry/ch2 merge/stubs/quiz 24/progress v4/nav/meta/README) — FIXED
  - [x] DATA-02/03 lecture preset geometries + worked examples + quiz rewrites — FIXED
  - [x] DETAIL-02 parity (8 blocks written + check-detail-parity gate) — FIXED
  - [x] TOOL-02 hygiene; forbidden mascot/parallax/tips removed — FIXED
  - [x] NAV-01 full §3.3 matrix (nav-verify 31 checks) — FIXED
  - Gate check: Z(✓) L(✓) D(✓) C(✓) N(✓) X(✓ local; live not verified)
- [x] Phase 3 — Functional repairs:
  - [x] R1-01 circuit builder drag/drop (+ leave-cancel & mid-drag-scroll defects) — FIXED
  - [x] QUIZ-01 stale-bank fingerprint + explicit handling; chapter filters; alias deep links — FIXED
  - [x] QUIZ-02 docked mobile timer (zero option overlap) — FIXED
  - [x] lecture-values browser harness 19/19; quiz-verify 18/18 — PASS
  - Gate check: S(✓) Q(✓) P(✓)
- [x] Phase 4 — Design & motion:
  - [x] Electric-yellow identity tokens; bold chapter numerals; filter-free hovers
  - [x] UI-01 360px header compression → zero overflow at all six widths
  - [x] A11Y-01 quiz 'n' jump lock + shell-mounted complete-buttons — FIXED
  - [x] NAV-02 single transition implementation + capture-phase shell intercept — FIXED
  - [x] a11y-verify (A) 17/17 + reduced-motion (R) suite — PASS
  - Gate check: V(✓) A(✓) R(✓), no earlier gate regressed (full suite re-run)
- [x] Phase 5 — Final regression: every tool + harness green (evidence/phase5/), browser
      matrix PASS on Chrome/Firefox/Edge, metrics table + AUDIT-REPORT.md written.

## Final gate scoreboard (details + evidence paths in AUDIT-REPORT.md §8)
Z ✓ · L ✓ · D ✓ · C ✓ · N ✓ · S ✓ · Q ✓ · P ✓ · X ✓(local) · V ✓ · A ✓ · R ✓ · B ✓ · T ✓

## Second brief (stabilization + YTPMV intro + cute polish) — COMPLETE 2026-10-23
- [x] Phase 1: repo/live inspection; reproduction harness tools/stability-stress.mjs
      (PART 3.2 sequence + PART 4.3 Details matrix + PART 4.5 typography parity):
      35/35 PASS on current code -> reported nav/Details/link bugs NOT reproducible
      (recorded NAV-03/DET-03/LINK-01 as Not-reproducible with the harness as monitor).
- [x] Phase 2/3: no new fundamental repairs needed; link audit clean (check-links 0,
      no external <a> targets exist); typography parity measured equal on all pages.
- [x] Phase 4: intro implemented (js/intro.js + #introOverlay + CSS beats) and verified
      (intro-verify 10/10, a11y A0 5/5, smoke +14, frame evidence).
- [x] Phase 5: mascot restored as identity anchor (hero capped area, cheers, intro),
      micro-polish (focus-within cards, numeral emphasis); MASCOT-01 documents the
      deliberate reversal of the earlier scope lock + the justified smoke change.
- [x] Phase 6: FULL regression green: check/test(550)/interact/shell/perf/guard/shots/
      build + loader 16 + nav 31 + stability 35 + quiz 18 + lecture 19 + a11y 22 +
      intro 10 + matrix (Chrome 156/Firefox 157/Edge 156) — evidence/phase6/.
- [x] Phase 7: deployment impossible (no credentials) -> production UNVERIFIED, stated.

## Post-audit addendum (lecture PDF arrived 2026-10-23)
- [x] PDF committed to docs/spec/; figures rendered to docs/spec/slides/; slide-by-slide
      verification log appended to docs/spec/brief-digest.md — all digest values + both
      lecture errors confirmed on-slide.
- [x] DATA-04 fixed: slide-21 example + its quiz question aligned to the lecture's real
      numbers (E = 2.0 N/C → 3.6×10⁻⁷ / 4.8×10⁻⁷ N, correction note for the 4.7 slip).
- [x] Full re-verification: evidence/phase6/ — every gate still green incl. browser matrix.
- [x] Loader gate made contract-exact: LOADER.state() now exposes showAtMs/finishAtMs so the
      harness asserts "overlay paints only if boot exceeded the 150 ms gate" instead of
      assuming every load is fast (3/3 stable runs).

## Remaining (handed over)
1. Merge + deploy `fix/emc-audit` (needs credentials) → then re-verify live URL.
2. `bun install` to refresh bun.lock for the new devDeps before merge.
3. OG card artwork regeneration (npm run og:card) in a future identity pass.

## Blocker log (3-attempt rule)
- playwright install-deps hung → manual apt-get library list (1 retry, worked).
- apt-get timed out mid-download → resumed with warm cache (worked).
- clone landed in /tmp (HOME=/tmp) → moved under /home/user (worked).
- No fix consumed 3 failed attempts; the quiz `lastJump` scope leak was caught by retest and
  fixed on its second iteration (recorded in BUG_AUDIT A11Y-01).
