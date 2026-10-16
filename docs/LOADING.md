# Loading experience, startup pipeline & Detail Mode — engineering report

Companion to `docs/PERF.md` (measurements) and `docs/BUGLIST.md` (inventory).
Commits: `e608aec` (startup system), `9bf4d07` + follow-ups (Detail Mode).

## 1. What was implemented

### 1.1 Native staged boot indicator (no fake progress)
A fixed overlay strip under the sticky header (`#bootStrip`, `.boot-chip`s:
layout / equations / simulations). Each chip flips **only when the real work
completes**: `boot()` (shell), the above-fold `katexify()` pass (equations),
first lazy sim init or load-idle when no sim is near the viewport (simulations).
The strip stays invisible unless a stage is still pending 160 ms in (warm
repeat visits never flash it), fades out when complete, then sets `hidden`
(unmounted; no listener/loop left behind). `position: fixed` + `pointer-events:
none` ⇒ **zero CLS, zero input interception**. Offset is read from the header's
real bottom edge at show time (mobile header wraps). PRM: transitions off.

### 1.2 Per-panel "warming" state
Lazy sims mark their `.panel` with `data-sim-pending`; the panel title dot
pulses (opacity keyframe only) until `whenNear()` initialises the sim. Users
see *why* a plate is momentarily empty; the attribute disappears on init.

### 1.3 Stage-5 background preparation
- Pager "next topic" prefetched via `link rel=prefetch` at idle (browser-idle
  priority; never competes with the critical path).
- Hover/focus-intent prefetch of topic links (delegated, passive, deduped,
  same-origin only). Multi-page site ⇒ navigation discards speculative work
  for free; no cancellation machinery needed.
- Repeat visits: hashed immutable js/css (0 bytes re-transfer), 1-day vendor
  cache, `emc.progress.v1` + `emc.prefs.v1` read pre-paint from localStorage.

### 1.4 Startup staging already in place (perf/optimize, referenced)
Lazy sim init near viewport, above-fold-then-idle KaTeX, lazy Chart.js at first
grading, hero loop start after `load`, observer-only canvas sizing, throttled
readouts, dirty-flag idle, 30 fps device tier, PRM static frames.

## 2. Cache architecture & invalidation
| Layer | Mechanism | Freshness / invalidation |
|---|---|---|
| Our js/css | content-hashed names, `immutable` 1 y | hash changes with content; HTML revalidates |
| vendor (KaTeX/Chart/fonts) | 1-day `max-age` | versioned upstream; names stable |
| HTML | platform default revalidate | always fresh pairing |
| prefs | `emc.prefs.v1` (localStorage, JSON-validated, storage-safe fallback) | schema-less scalar; invalid values fall back to default |
| progress | `emc.progress.v1` (existing, sanitized import/export) | unchanged |
No service worker: the site is fully static, `file://`-compatible, and HTTP
caching already makes repeats instant; a SW would add invalidation risk for no
measured gain (documented decision, revisitable if offline becomes a need).

## 3. Detail Mode (global toggle)
- Switch in the header left cluster: `role=switch`, `aria-checked`, keyboard-
  native button, compact ≤640 px, focus-visible ring, PRM-safe.
- One attribute on `<html data-detail="on|off">`; two CSS rules swap every
  dual-level block. **No reload, no rerender of sims/charts, no form/scroll
  state touched, no network.** Measured flip cost: **0.07 ms** average.
- Content convention (markup-local, no string tables): `[data-detail=tech]`
  = dig disclosures, substitution mono notes, each section's detailed opening
  paragraph, exam-mode fine print; `[data-detail=plain]` = 32 one-line
  plain-language TL;DRs (same facts, everyday words). Sections that do not
  benefit (tables, formulas, checks, sims) are shared by both modes.
- Default **ON**: the site's stated purpose is calculus-based physics, so the
  technical level is the primary reading; OFF is the accessibility ramp.
- Applied pre-paint by a per-page inline head script (validated read of
  `emc.prefs.v1`) ⇒ no flash of the wrong level; indicator and content always
  agree on first render.
- Screenshots: `docs/perf-shots/detailmode/`.

## 4. Measurements (probe8, public build, cold vs warm, same conditions)
| Metric | Before | After | Note |
|---|---|---|---|
| desktop cold FCP index / current | 344 / 212 ms | 288 / 220 ms | within noise ↔ improved |
| mobile cold FCP index / current | 660 / 748 ms | 548 / 556 ms | −112 / −192 ms |
| CLS (all pages, both profiles) | 0 | 0 | boot strip is a fixed overlay |
| warm repeat transfer | 68 KB | 89 KB | +21 KB = the intentional next-page prefetch |
| requests warm | 27 | 28 | same reason |
| load long tasks | unchanged | unchanged | raster-bound on emulated mobile (PERF.md §6) |
| toggle flip cost | – | 0.07 ms | 10 flips, main thread |
| boot strip | – | never shows when nothing pending; completes+unmounts otherwise | smoke-enforced |

## 5. Tests
Smoke 313/313 (new: default level, flip + aria + persistence + no-reload,
slider/readout survival across toggle, prefetch link, boot-strip completion +
unmount, both levels shipped on all 7 pages). `check` clean, `perf` green,
`perf:guard` green (lifecycle invariants).

## 6. Limitations
- Emulated-mobile load long tasks remain raster-bound (headless software
  raster + 4× throttle); real-device verification outstanding (PERF.md §8).
- Prefetch spends ~21 KB on idle bandwidth to buy instant next-page loads;
  deprioritized by the browser, cancelled implicitly on navigation.
- Detail Mode covers explanatory prose; worked examples, tables, formulas and
  self-checks are intentionally shared by both levels (they *are* the content).
