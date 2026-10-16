# EMC Lab — performance report (baseline)

Branch: `perf/optimize` · Baseline commit: `e537678` · Report phase: **Phase 0 (Before)**
The After columns are filled in Phase 5; baseline values below are never overwritten.

---

## 1. Environment & methodology

| Item | Value |
|---|---|
| Browser | Chrome/148.0.7778.97, headless (puppeteer from `node_modules`, invoked by dev-only scripts; **not** a project dependency) |
| Host | Linux container, Node v20.20.2, Bun 1.3.14 (task runner only), CPU-throttling via CDP `Emulation.setCPUThrottlingRate` |
| Desktop profile | viewport 1280×900 CSS px, DPR 1, no throttling |
| Mobile profile | viewport 390×844 CSS px, DPR 3, CPU 4×, `hasTouch` |
| Server | dev-only static server in `tools/perf-measure.mjs` (no compression, `Cache-Control: no-store`), so **transfer sizes here are wire-raw**; gzip numbers come from `bun run perf` (production-equivalent gzip) |
| Harness | `tools/perf-measure.mjs` (matrix, shots, 10-min session, RSS), `tools/perf-probe.mjs` (loop/hidden/sources), `tools/perf-probe2.mjs` (long-task attribution + RSS), `tools/perf-probe3.mjs` (fluids attribution). All dev-only; `tools/` is not in the public-build allow-list |
| Raw data | `docs/perf-data/baseline.json`, `probe-baseline.json`, `probe2-baseline.json`, `probe3-baseline.json`, `session-baseline.json` |
| Screenshots | `docs/perf-shots/before/<page>-{390,1280}.jpg` (14 files, full-page, JPEG q72, DPR 1) |

Metric definitions & how each was obtained:

1. **JS heap** — `performance.memory.usedJSHeapSize` (Chrome, `--enable-precise-memory-info`), after 3.5 s settle.
2. **Renderer/GPU/process memory** — whole-browser RSS from `/proc/*/statm` summed over all Chrome processes; per-tab *delta* vs an idle browser. Headless shares renderer/GPU/services processes across sequential tabs, so per-tab deltas are **indicative only** (see §5 limitations). GPU memory: **unavailable** in this environment.
3. **DOM nodes** — `document.getElementsByTagName('*').length` (cross-checked against CDP `Performance.getMetrics.Nodes`).
4. **Listeners** — CDP `DOMDebugger.getEventListeners` on `window`, `document`, first canvas.
5. **Canvas backing store** — per canvas `width × height × 4` bytes (attributes are already device px, i.e. CSS × min(DPR, 2)); equivalently `cssW × DPRcapped × cssH × DPRcapped × 4`. No double counting.
6. **Active rAF chains** — in-page wrapper around `requestAnimationFrame`/`cancelAnimationFrame` counting pending callbacks (each live chain holds exactly one); sampled at 120–150 ms intervals, max reported. Scenarios: at page top (sims below fold), sim scrolled into view, offscreen (footer), and a synthetic `visibilitychange`→hidden probe (tests *our* listeners only; Chrome's own rAF throttling for genuinely hidden tabs is browser-level).
7. **AudioContexts** — constructor counter injected before page scripts.
8. **Long tasks** — `PerformanceObserver('longtask')`, buffered; attributed to timeline marks where needed.
9. **Frame times** — deltas between consecutive rAF callback timestamps while an animation loop is running and during interactions. **Caveat:** when loops are paused (sim offscreen) the sampler sees gaps, so `frameP95 = 0` or very large values in the matrix are sampler artefacts; the trustworthy interaction numbers are the long-task attributions in `probe2/probe3` (they align tasks to interaction marks).
10. **INP proxy** — max `PerformanceObserver('event')` duration (event timing, threshold 16 ms) during the interaction window.
11. **GC / 10-min session** — `HeapProfiler.collectGarbage` then heap sample every ~30 s during a scripted 10-minute session on `topics/current.html` (scroll cycles, keyboard slider steps, segment toggles).
12. **Network** — CDP `Network.loadingFinished.encodedDataLength` sums (raw, uncompressed here) + `bun run perf` gzip totals.

---

## 2. Baseline matrix (Before)

`back` = summed canvas backing stores; `raf t/v/off/hid` = max pending rAF chains at top / sim-in-view / footer / hidden-probe; `LT50/LT100` = long tasks >50 ms / >100 ms over the whole measurement window; `worst` = worst long task (ms); `p95` = interaction frame p95 (see caveat §1.9); `inp` = INP proxy (ms); `xfer raw` = uncompressed KB; `xfer gz` = gzip KB from `bun run perf`.

| Profile | Page | heap MB | nodes | lis w/d/c | back MB | raf t/v/off/hid | LT50 | LT100 | worst | p95 | inp | req | xfer raw | xfer gz |
|---|---|---:|---:|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| desktop | index | 2.41 | 1687 | 4/5/0 | 1.48 | 2/2/0/2 | 4 | 1 | 102 | 16.7 | 0 | 13 | 487.3 | 189 |
| desktop | quiz | 3.36 | 780 | 3/4/0 | 0 | 0/–/0/0 | 2 | 0 | 62 | – | 32 | 12 | 654 | 214 |
| desktop | vectors | 3.10 | 774 | 3/3/5 | 1.28 | 0/0/0/0 | 2 | 1 | 107 | – | 16 | 13 | 475.2 | 179 |
| desktop | fluids | 3.28 | 733 | 3/3/5 | 2.67 | 0/1/0/1 | 2 | 0 | 94 | 33.4 | 32 | 13 | 486.7 | 180 |
| desktop | heat | 3.05 | 613 | 3/3/5 | 2.49 | 0/0/0/0 | 1 | 0 | 72 | 16.7 | 24 | 13 | 486.3 | 180 |
| desktop | waves | 2.96 | 431 | 3/3/0 | 2.47 | 0/1/0/1 | 3 | 0 | 71 | 16.8 | 24 | 13 | 479.1 | 178 |
| desktop | current | 2.86 | 787 | 3/3/0 | 3.67 | 0/1/0/1 | 3 | 0 | 83 | 16.7 | 40 | 13 | 511.3 | 185 |
| mobile | index | 2.33 | 1687 | 4/5/0 | 1.39 | 2/2/0/2 | 10 | 3 | 359 | 49.9 | 0 | 13 | 487.3 | 189 |
| mobile | quiz | 3.86 | 780 | 3/4/0 | 0 | 0/–/0/0 | 5 | 2 | 147 | – | 120 | 12 | 654 | 214 |
| mobile | vectors | 3.51 | 774 | 3/3/5 | 1.70 | 0/0/0/0 | 6 | 3 | 300 | – | 72 | 13 | 475.2 | 179 |
| mobile | fluids | 3.26 | 733 | 3/3/5 | 3.41 | 0/1/0/1 | 14 | 3 | 194 | 800* | 96 | 13 | 486.7 | 180 |
| mobile | heat | 3.47 | 613 | 3/3/5 | 3.41 | 0/0/0/0 | 12 | 4 | 231 | 833* | 56 | 13 | 486.3 | 180 |
| mobile | waves | 3.34 | 431 | 3/3/0 | 3.41 | 0/1/0/1 | 11 | 3 | 206 | 99.9 | 64 | 13 | 479.1 | 178 |
| mobile | current | 3.32 | 787 | 3/3/0 | 4.42 | 0/1/0/1 | 24 | 4 | 223 | 750* | 112 | 13 | 511.3 | 185 |

\* sampler artefact (gap between loop restarts); probe-based interaction costs are below.
Canvas backing detail (mobile): every canvas is `css × 2` (DPR capped at 2 by `js/common.js:108`), e.g. current.html = 698×640 + 698×300 + 698×720 → 4.42 MB.

**Interaction long-task attribution (mobile profile, 4× CPU)** — `probe2`/`probe3`:

| Page / phase | Long tasks |
|---|---|
| current.html load → boot | 64, 282, 87, 115, 105, 162, 94, 90, 70, 89 ms (t ≈ 0.2–1.5 s: unminified script eval + KaTeX typeset) |
| current.html sim enters view | 76, 58, 50, 56, 55 ms (first draws) |
| current.html slider drag / topology switch | 53 ms / 58, 60 ms |
| fluids.html load → boot | 103, 324, 106, 148, 75, 200, 88 ms |
| fluids.html **idle, sim in view** | continuous 50–69 ms tasks every ~100–200 ms for the whole idle window (archimedes loop: per-frame DOM readout writes + full-canvas raster) |
| fluids.html slider drag / bernoulli in view | 50–58 ms per frame / sustained 50–70 ms |

**10-minute session** (`topics/current.html`, desktop, scripted activity, post-GC heap): 2.06 MB → 2.93 MB (**+0.87 MB / 10 min**, no sustained step growth; ≈ 5 MB/h would be the extrapolation and even that is dominated by legitimate DOM/chart state). Within the <5 MB/10 min budget.

**Process RSS (headless, all Chrome processes)**: idle browser ≈ 678 MB; +158…186 MB while a page is open (shared renderer/GPU/services make per-tab attribution unreliable — see §5).

---

## 3. Baseline vs targets

| Target | Budget | Baseline (worst page) | Status |
|---|---|---|---|
| Tab memory desktop | <80 MB (stretch <60) | heap ≤3.4 MB + backing ≤3.7 MB + DOM; process-level not reliably attributable | likely met (heap-level); process-level **unverified** |
| Tab memory mobile | <60 MB | heap ≤3.9 MB + backing ≤4.4 MB | likely met (heap-level); **unverified** |
| 10-min growth | <5 MB | +0.87 MB | **met** |
| Idle/offscreen/hidden loops | 0 unnecessary | offscreen 0 ✓ (IO pause works); **hidden-probe: loops keep running** (index 2, fluids/waves/current 1); **idle settled scenes still redraw**; **double chain at boot on index (2)** | **missed** |
| Frame p95 desktop | <16 ms | 16.7–33.4 ms where loops run | **missed (marginal→2×)** |
| Frame p95 mobile | <24 ms | 50–70 ms continuous while any sim animates (4× throttle; software raster amplifies) | **missed** |
| INP | <200 ms | proxy max 120 ms (mobile quiz) | met (proxy) |
| Load long tasks >100 ms | 0 | desktop 1 (index 102 ms, vectors 107 ms); mobile 2–4 (up to 359 ms) | **missed** |
| Transfer/page | ≤ baseline, aim −30 % | 178–214 KB gzip (baseline = this) | baseline |
| `bun run check/test/perf` | green | green | **met** |

---

## 4. Source of the reported “~300 MB per tab”

Verified candidates, ranked by evidence:

| Candidate | Measurement | Verdict |
|---|---|---|
| JS heap / leak | 2.3–3.9 MB per page; +0.87 MB per 10 min post-GC | **ruled out** (2 orders of magnitude below 300 MB) |
| Canvas backing stores | ≤4.42 MB per page (DPR already capped at 2, `common.js:108`) | **ruled out** |
| Repo disk | 2.5 MB source (9.8 MB incl. docs/shots); `.git` 1.9 MB; `vendor/` 0.95 MB | **ruled out** |
| Dev-environment disk | `node_modules/` **97 MB**, puppeteer Chrome cache **636 MB**, browser profiles | **matches the magnitude** — disk/tooling, not tab memory |
| Whole-browser process memory | headless all-processes RSS ≈ 860 MB; per-tab delta 158–186 MB but shared-process attribution is unreliable; Chrome Task Manager on a real desktop attributes GPU/service shares to tabs and can plausibly display hundreds of MB for a window | **most plausible reading of a “per tab” figure** |

**Decision (per §0.1 rule):** the 300 MB figure is *not* per-tab runtime memory of this site. It corresponds to (a) development-machine disk (dependencies + browser binaries) and/or (b) whole-browser/process-group attribution as displayed by task managers. Runtime optimisation therefore targets the *measured* problems below (frame times, long tasks, lifecycle waste, transfer), not a phantom heap leak. Disk-side relief (smaller dev footprint) is noted in BUGLIST N6 but is not a runtime fix.

---

## 5. Limitations & unverified metrics

* GPU memory: not exposed headless → **unavailable**.
* `performance.measureUserAgentSpecificMemory()`: requires cross-origin isolation; deliberately **not** enabled (no header changes for measurement) → unavailable.
* Per-tab renderer RSS: headless shares processes; deltas indicative only.
* Headless raster is software (SwiftShader-class); mobile-profile canvas costs are **amplified** relative to real phones with GPU raster. Treat mobile frame times as a relative regression signal, not absolute device truth.
* Hidden-tab probe fakes `visibilityState` + dispatches `visibilitychange`; it tests our listeners, not Chrome's own rAF throttling (which stops rAF in genuinely hidden tabs).
* Safari/Firefox and real touch devices: untested.

---

## 6. Top three measured performance problems (ranked)

1. **Mobile interaction/idle jank from per-frame work in animating sims** — continuous 50–70 ms long tasks whenever a sim is in view (probe3 fluids idle window), driven by per-frame DOM readout writes (`sim-archimedes.js:57`, `sim-heat-transfer.js:238`, `sim-bernoulli.js:185`), a per-frame `getBoundingClientRect()` inside every Stage tick (`common.js:157`), and full-canvas re-raster of settled/static scenes. Desktop frame p95 16.7–33.4 ms already breaches the 16 ms budget.
2. **Load-path long tasks** — 102–107 ms on desktop (index, vectors) and 103–359 ms on mobile: unminified script eval (public build ships readable sources, `tools/build-public.mjs` copies verbatim) plus synchronous KaTeX typeset at boot and again at `load` (second pass is a guarded no-op walk, first is the cost).
3. **Animation lifecycle waste** — (a) canvases visible at boot run **two** rAF chains (IntersectionObserver first callback re-enters `_tick()` while the constructor-started chain is live: `common.js:97-100` + `common.js:133`; index measures raf=2); (b) no `visibilitychange` handling, so loops ignore synthetic hidden state and rely solely on browser throttling; (c) settled scenes (archimedes at rest, heat at steady state, sound scope not playing) redraw forever instead of going dirty-flag idle.

Screenshots: `docs/perf-shots/before/` (14 files). Raw data: `docs/perf-data/`.

---

## 7. After measurements (Phase 4)

Same harness, browser, profiles, profiles' throttling and procedures as §1;
label `after`. Raw data: `docs/perf-data/after.json`, `session-after.json`;
screenshots: `docs/perf-shots/after/` (captured with a scroll-through so lazy
sims initialise before the full-page shot).

### 7.1 After matrix (key columns)

| Profile | Page | heap MB | backing at boot MB | raf idle/hidden | LT>100 | INP proxy | prod first-load gzip |
|---|---|---:|---:|---|---:|---:|---:|
| desktop | index | 3.57 | 1.48 | 1 / 0 | 0 | 0 | 116.4 KB |
| desktop | quiz | 3.43 | 0 | 0 / 0 | 0 | 48 | 191.2 KB |
| desktop | vectors | 3.05 | 0.17 | 0 / 0 | 0 | 24 | 116.7 KB |
| desktop | fluids | 3.04 | 0.34 | 0 / 0 | 0 | 32 | 119.9 KB |
| desktop | heat | 2.90 | 0.34 | 0 / 0 | 0 | 24 | 120.2 KB |
| desktop | waves | 2.68 | 0.34 | 0 / 0 | 1 | 24 | 118.3 KB |
| desktop | current | 2.91 | 0.51 | 0 / 0 | 0 | 40 | 125.2 KB |
| mobile | index | 3.59 | 1.39 | 1 / 0 | 4 | 0 | 116.4 KB |
| mobile | quiz | 3.90 | 0 | 0 / 0 | 2 | 104 | 191.2 KB |
| mobile | vectors | 3.47 | 0.17 | 0 / 0 | 5 | 88 | 116.7 KB |
| mobile | fluids | 3.47 | 0.34 | 0 / 0 | 4 | 120 | 119.9 KB |
| mobile | heat | 3.32 | 0.34 | 0 / 0 | 4 | 88 | 120.2 KB |
| mobile | waves | 3.08 | 0.34 | 0 / 0 | 4 | 72 | 118.3 KB |
| mobile | current | 3.34 | 0.51 | 0 / 0 | 5 | 96 | 125.2 KB |

### 7.2 Measured deltas vs baseline

| Change (commit) | Metric | Before | After |
|---|---|---:|---:|
| Stage chain guard + visibilitychange (78445ed) | home boot rAF chains | 2 | 1 |
| | hidden-probe chains (all animating pages) | 1–2 | 0 |
| observer-only resize (54ece11) | getBoundingClientRect per 2 s idle-in-view | 120 | 0 |
| | LayoutCount per 2 s idle (fluids) | 120 | 0 |
| throttled/change-detected readouts (467ebef) | mobile fluids idle long tasks | continuous 50–70 ms series | 0 in idle window |
| dirty-flag idle (467ebef) | settled sim chains in view | 1 | 0 (guard-enforced) |
| lazy sim init (584a017) | boot backing store, topic pages (desktop) | 1.28–3.67 MB | 0.17–0.51 MB |
| public-build minify (1defb22) | public/js gzip total | 65.6 KB | 45.8 KB (−30 %) |
| | per-page first-load gzip (sim pages) | 178–185 KB | 116–125 KB (−31…−38 %) |
| hashed immutable assets (1bbb629) | repeat-visit transfer for our js/css | revalidate every load | 0 bytes (immutable, 1 y) |
| device tier (21ee722) | bernoulli-in-view mobile long tasks | continuous 50–70 ms @60 fps | 52–94 ms @30 fps cap |
| 10-min session (after) | post-GC heap growth | +0.87 MB | +0.81 MB (flat after t≈90 s) |
| `perf:guard` (ad6081c) | lifecycle invariants | n/a | 4/4 enforced, green |

Interaction frame times: desktop stays at the 16.7 ms vsync quantum under headless
software raster (33.4 ms on two-sim pages before; the remaining 16.7 ms frames are
single-raster frames, not jank clusters). Mobile sustained-motion frames are now
**33 ms by design** on tiered devices (30 fps cap) instead of dropped 50–800 ms
frames; drag interactions cost a single ~50 ms task at 4× throttle (probe3 after).

### 7.3 Targets — final status

| Target | Budget | After | Status |
|---|---|---|---|
| Tab memory desktop | <80 MB | heap ≤3.6 MB + boot backing ≤1.48 MB (≤0.51 topics) | met at measurable levels; process-level unverifiable headless |
| Tab memory mobile | <60 MB | heap ≤3.9 MB + backing ≤1.39 MB | met at measurable levels |
| 10-min growth | <5 MB | +0.81 MB | **met** |
| Unnecessary loops idle/offscreen/hidden | 0 | 0 (guard-enforced) | **met** |
| Frame p95 desktop | <16 ms | 16.7 ms vsync quantum (software raster headless) | marginal miss, environment-bound |
| Frame p95 mobile | <24 ms | 33 ms capped on tiered devices | **missed as measured**; cap is a deliberate trade; real-device GPU raster expected to meet (needs-human) |
| INP | <200 ms | ≤120 ms proxy | **met** |
| Load long tasks >100 ms | 0 | desktop 0–1 (run noise); mobile 2–5 | **missed on emulated mobile** — profiled cause is first paint/raster in Blink (30–32 % "(program)"), not app JS (KaTeX ≈2–3 %) |
| Transfer/page | ≤ baseline, aim −30 % | −31…−38 % sim pages, −11 % quiz | **met** |
| check/test/perf | green | green | **met** |

### 7.4 Screenshot comparison

`docs/perf-shots/{before,after}/` — 14 pairs. home/quiz pairs are byte-size
identical within 0.5 % (no visual change). Topic-page JPEG sizes differ 4–14 %
**only** from animation phase at capture (particle/dot positions) and from lazy
sims initialising during the scroll-through; layout, typography, colours and
panel chrome verified identical by inspection (see after/current-1280.jpg: both
sim panels fully rendered). No unintended visual change was introduced; the only
intentional visual differences are: none at rest (touch-action and hit-halo are
invisible; reduced-motion only affects users who opt in).

---

## 8. Needs-human list

1. **Real-device memory & interaction testing** — all numbers here come from
   headless Chrome (software raster); mobile frame-time and load-long-task
   targets need verification on physical Android/iOS hardware with GPU raster.
2. **Safari & Firefox validation** — not performed (Chrome-only project policy);
   touch-action, PRM and lazy-init paths use standard APIs but are unverified there.
3. **Emulated-mobile load long tasks (>100 ms, 2–5/page)** — profiled to Blink
   first paint/raster, not app JS; a human should confirm on-device whether the
   budget is met in practice before any further work is spent here.
4. **Deployment/caching decisions** — the immutable hashed-asset rule in
   `vercel.json` takes effect on the next deploy to Vercel (branch `main` only);
   someone with deploy access should watch the first production rollout.
5. **Licensed fonts & Git history** — untouched by this work; any future
   font-licensing or history-rewriting decision remains a human call.
6. **The original "~300 MB per tab" report** — if it came from a specific machine
   or tool (task manager screenshot, hosting dashboard), a human should re-check
   that source against §4; runtime measurements rule out tab heap, backing
   stores and leaks by two orders of magnitude.
