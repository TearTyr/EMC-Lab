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
- [x] Reference-verification pass (follow-up): playback blocked at every route
      (watch bot-gate, embed error 153, yt-dlp bot-gate on all clients, storyboards
      403, six Invidious/Piped fronts down, no captions); inspected the locally
      accessible footage stills (thumbnail + timeline-quartile frames,
      evidence/phase6/reference/) and adopted their flat-field hard-cut rhythm,
      diagonal panels and a colour-collision play into the intro; full log in
      AUDIT-REPORT.md §9A. Video NOT watched — stated explicitly.
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

## Third round (mascot art + second reference + motion-graphics type) — COMPLETE
- [x] Attached mascot PNGs processed (white-bg removal via min-channel alpha, crop,
      resize) -> img/mascot.png + img/mascot-sparkle.png; hero/intro/cheers use them
      (MASCOT-02; first luminance cutout left the body semi-transparent - fixed).
- [x] Second reference video (8CilACT9uFs): access ladder re-run, playback blocked at
      every route; thumbnail + quartile frames inspected -> letterbox, sticker plates,
      arrow slash, per-letter kinetic title adopted; INTRO-02 fixed four composition
      defects found by frame review. Video NOT watched - stated in AUDIT-REPORT §9A.
- [x] Full regression green: check 0 / smoke 554 / interact / shell / perf / guard /
      shots / build + loader 16, nav 31, stability 35, quiz 18, lecture 19, a11y 22,
      intro 10, matrix ×3 engines (evidence/phase6/).

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

## Phase 7 — drawn-mascot identity + footage-driven intro v3 (2026-10-23)
- Fetched origin/main: user merged earlier work (`719edc8`), added `405af20` fixes
  and `2e836f8` with `Video/シェリーライド.mp4`; merged into `fix/emc-audit` (`33afc78`).
- VIDEO INSPECTED for real: metadata + contact sheets + cut pairs viewed, audio
  onset envelope analysed → `evidence/phase7/reference-analysis.md`.
- Intro v3 rebuilt on the footage's grammar (5.8 s, 1.16 s phrases): confetti →
  flash → locked mascot+title over silhouette strip with pose swaps → VS skit
  with tilted insets → black/red insert → collage chorus with rotated word
  slams → white-flash dips → bookend → wipe home. intro-verify 10/10.
- BRAND-01: all SVG-generated mascot art replaced by the drawn PNGs (brand
  marks ×10, favicon.ico + apple-touch regenerated, favicon.svg deleted, OG
  card regenerated); smoke #15 rewritten to the drawn-artwork contract.
- Gates (evidence/phase7/): check 0 · test 554/554 · interact PASS · shell PASS ·
  perf 380K<500K · guard OK · shots 0 · build:public 72 files/196 refs ·
  loader 16/16 · nav 31/31 · stability 35/35 · quiz 18/18 · lecture 19/19 ·
  a11y 22/22 · intro 10/10 · matrix PASS ×3 · sweep 0 overflow/0 third-party.
- Deployment still not performed (no credentials) — production unverified.

## Phase 8 — transitions system, assets, bug fixes (2026-10-23, master prompt v4)
- [x] §1 inspect: branch `fix/emc-audit` continued (no reset); favicon defect found on inspection (48×49 entry).
- [x] §2 GIF: intro-section GIF (0→12.12 s) — later SUPERSEDED by phase-9 full-video
      segments (see phase 9 below); file removed in phase-9 cleanup, notes kept.
- [x] §3 footage: ALL 4226 frames decoded; per-frame diff+luminance series; 111 transition
      clusters; showinfo PTS map (CFR check); 9 overview sheets @2 fps + 4 intro sheets @4 fps
      read sequentially; 15 event strips (consecutive 60 fps frames) around every cut/flash/swap/
      whip; honest review log (what was read vs numeric vs saved).
- [x] §4 `evidence/phase8/reference-timeline.md`: frame-accurate event table, flash grammar
      (2 white frames + 150–300 ms decay), hard-cut rule, spin loop, whip squash, beat grid,
      translation rules + logged deviations.
- [x] §5 MOTION-01 site-wide system (rise/slam/slide/pop/whip/flash/spin; js/motion.js;
      shell view events; quiz whip after synchronous state; dropdown pop; hidden-tab pause;
      reduced-motion final states) — motion-verify 10/10.
- [x] §6 ASSET-01: asset plan + 3 generated physics-correct chapter diagrams (2 regenerations
      for arrow correctness), palette PNGs, HTML symbol overlays, asset-verify 8×6 PASS.
- [x] §7 bug fixes: BRAND-02 favicon square entries; §7B three v2 assertions re-reviewed +
      strengthened (negative markers, spin requirement); INTRO-04 deterministic waits +
      auto-end window; INTRO-05 re-init guards 9/10; §7D confetti contrast/size + inset scale +
      continuous spin (frame strips before/after); §7E css build verified (tokens, keyframes in
      built css, no dead v2 rules); §7F loader contract + nav re-verified (loader 16/16, nav 31/31).
- [x] §8 robustness: whip never gates state; flash pointer-transparent + single-instance +
      interrupted-nav cleanup; mx-paused on hidden; no duplicate listeners (stability 35/35).
- [~] §9 suite: check 0 · test 556/556 · interact PASS · shell PASS · stability PASS · nav 31/31 ·
      loader 16/16 · quiz 18/18 · lecture 19/19 · a11y 22/22 · intro 12/12 · motion 10/10 ·
      asset 8×6 PASS · perf budgets PASS · sweep 0 overflow · matrix Chrome 11/11
      (firefox/edge UNTESTED — ENV-01) · perf:guard/shots NOT re-run after session thread-budget
      exhaustion (ENV-01; last green = phase 7 + earlier this session for perf).
- [x] §10/11: acceptance evidence in `evidence/phase8/`; final report in AUDIT-REPORT §11.
- Deployment still not performed (no credentials) — production unverified.

## Phase 9 — full-video addendum (2026-10-24)
- [x] §1 source measured: 70.47 s container / 4225 decoded frames (last pts 70.416),
      1920×1080 h264 60 fps + AAC stereo + attached PNG cover; md5 unchanged;
      duplicate `.scratch/ref/sherry.mp4` (byte-identical) removed.
- [x] §2 ENTIRE video converted: 4 consecutive cut-aligned GIF segments
      (0–18.9 / 18.9–40.2 / 40.2–59.0 / 59.0–end) + 6-window 30 fps flash montage,
      `evidence/video-analysis/`; seg4 at 20 fps so the true final frame is inside.
- [x] §3 GIFs re-opened & visually checked (first/mid/last per segment + flash grid):
      `evidence/video-analysis/gifcheck/`, numeric audit via `tools/gif-verify.py`.
- [x] §4 complete viewing pass: 12 sequential 4 fps sheets (every frame slot 0→70.25 s)
      read in order (`evidence/video-analysis/sheets/W01–W12`) + slow-motion strip
      re-reads of every fast transition (S00/S05/S06/S07/S13).
- [x] §5 cleanup: duplicate MP4, superseded intro GIF, 2 fps overview sheets (replaced
      by the 4 fps set), ref-analysis intermediates removed; originals + strips kept.
- [x] §6 breakdown docs: `reference-analysis.md`, `frame-timeline.md`,
      `transition-inventory.md` (incl. correction: NO black tail at video end).
- [x] §7 site-wide transitions extended with 5 patterns from the FULL video:
      staged line reveal (`data-mx="lines"` on objective lists), corner slam cluster
      (`data-mx="corner"` on the chapter grid), strikethrough draw on graded-wrong
      quiz options, starburst badge pop on feedback badges, locked-caption rule
      (`.mx-lockline` on the Ohm preset row + whip accent on preset jumps).
- [x] §8 verification: build:css/check/test(556)/quiz/a11y/intro/loader/nav/motion/
      interact/shell/asset/stability/perf:guard ALL PASS; shots refreshed;
      build:public deployable (2.1 MB, no evidence/Video refs at runtime);
      site intro captured as `evidence/phase8/site-intro.gif` (63 frames, 6.29 s,
      real-time capture, timing-faithful) + frame sheet `site-intro-frames.png`.
- [x] check-links pre-existing failure found & fixed (introOverlay allowlist,
      justified in-tool); first `check` run this session had been misread as pass
      via a pipe exit code — corrected and re-run: exit 0.
- [ ] Deployment still not performed (no credentials) — production unverified.
- [ ] Commit not possible this session: `.git` absent from the sandbox snapshot.

### Phase 9b — shareable intro preview (supersedes phase8/site-intro.gif for sharing)
- [x] `tools/capture-intro-video.mjs`: records loader → #introOverlay (~5.8 s) →
      homepage reveal via Playwright screencast (25 fps webm, zero page errors),
      in-memory server, fresh context so the once-per-session intro plays.
- [x] Two-pass palette encode (full imageio ffmpeg; stats_mode=diff + paletteuse
      new=1 so flash scenes keep colour), trimmed 0.35 s blank browser paint at
      the head and the static tail to ~1 s hold.
- [x] Deliverables in `evidence/phase9/`: `intro-preview.gif` (960×600, 203 f,
      20 fps, 10.15 s, 4.5 MB), `intro-preview-small.gif` (640×400, 152 f, 15 fps,
      2.0 MB, for chat apps), `intro-recording.webm` source, `preview-sheet.png`
      12-frame contact sheet read visually (all acts + reveal confirmed present).
- [x] Not shipped: evidence/ stays out of `public/` (build:public exclusions
      unchanged); preview GIFs are share assets, not runtime site assets.

### Phase 9c — the 1:6 cut: site intro near-1:1 with the reference video
User request (2026-10-23): "could be further improved make it near 1 to 1 with
the reference video". Decisions taken with the user: uniform 1:6 time
compression (~12 s intro) + keep the site pink palette.
- [x] Rebuilt `#introOverlay` as a uniform 1:6 compression of ALL 70.416 s of
      picture: nine sections in order, every event at t_ref/6 (confetti pops
      .042-.375 s; flash #1 + staggered lock-up burst; paper-doll micro swaps
      + f440 whip-squash at 1.225; flash #2 + skit with spinning insets and the
      2.667 line swap; ZERO-WHITE hard cut into the black/red insert with
      staged slams 3.333/3.383/3.433 + stamp 3.500; RAMPED flash #3 into chorus
      A with word slams at the exact footage onsets, whips, bubble columns,
      staggered speech panels, title callback + arrow, one-beat corner
      cluster, chip slides + whip-out; flash #4 into chorus B's LOCKED lyric
      caption with grid pose swaps and 0.333 s fairy edge-swaps; flash #5 into
      chorus C correction panels with X-draws, corner words, starburst
      badges, diamonds, bottom-line slams, whip; flash #6 into the bookend
      callback; second ZERO-WHITE hard cut into the single-card end state).
      Flash grammar stays frame-quantised (2 white frames + footage decays);
      blur/gradient/backdrop-filter still absent; reduced motion unchanged.
- [x] `js/intro.js` TOTAL_MS 5800 → 12250; contract comment rewritten.
- [x] Timing map doc: `evidence/video-analysis/intro-1to6-map.md` (event
      table incl. documented deviations: palette, whip-substitution, arc-text
      omission, discretised fairies, 0.5 s spin / 0.15 s arrow floors).
- [x] Gates re-pointed where they encoded the old 5.8 s cut (intro-verify
      window + waits, smoke jsdom window + two css markers, screenshots intro
      preset, capture timeout) — every change justified in BUG_AUDIT.md
      test-change log (PHASE 9c entry). Full battery green: check, 556/556
      smoke, intro-verify (auto-end 12 914 ms), motion, a11y, loader, nav,
      asset, quiz, interaction, shell, stability, perf (330K index),
      perf:guard (0 rAF chains, CLS 0.0007).
- [x] New capture + GIFs in `evidence/intro-1to6/`: `intro-preview.gif`
      (960x600, 302 f, 20 fps, 15.1 s, 3.3 MB), `intro-preview-small.gif`
      (640x400, 15 fps, 1.6 MB), source webm, 16-frame `preview-sheet.png`
      (read visually: all nine acts + wipe + homepage reveal present),
      `compare-sheet.png` — 15 reference/site frame pairs at t_ref and
      t_ref/6, read visually: structure matches section-for-section.
- [ ] Deployment still not performed (no credentials) — production unverified.
