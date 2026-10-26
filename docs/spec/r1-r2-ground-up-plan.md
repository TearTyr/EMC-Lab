# R1 + R2, from the ground up — execution plan

**Status: APPROVED-DIRECTION 2026-10-25** (user: the old builds "don't match the
brief"; remove them for now and rethink execution from zero, then start
rebuilding). Brief authority: `docs/spec/brief-digest.md` rows R1–R2.

> R1 **Circuit builder:** drag/drop **resistors, battery, light bulb**
> R2 **Ohm's law calculator:** change R and V, see I

## 1. Why the old builds missed the brief

| old build | what it actually was | brief mismatch |
|---|---|---|
| `sim-ohm` (v1) | an instrument bench: auto-ranging analogue ammeter, power-rating slider + safety warning, electron-flow toggle, I–V chart canvas | the brief asks for a *calculator*: change R and V, **see I**. Every extra instrument (rating, meter range, chart) sat between the learner and the one relationship R2 exists to teach |
| `sim-circuit` (v1) | a lane/row network editor: series lane + parallel branches, Kirchhoff branch solve, challenge strip, row list with lane buttons | the brief asks for *drag/drop of three parts*. The row/lane machinery made placement a form-fill, not a bench; the parallel solve hid the single idea R1 exists to teach (one loop ⇒ one current, resistances add) |

Both were also the two heaviest files in `js/` (~50 KB) — complexity spent
off-brief.

## 2. The ground-up rule

**One relationship per sim, on screen, in motion.**
R2 shows `I = V/R` and nothing else. R1 shows *one loop ⇒ one current;
resistances add; the bulb's brightness is the power* and nothing else.
Anything that does not serve that sentence is cut. Parallel networks,
charts, ratings, challenges are **milestones, not foundations** (§6).

## 3. R2 — Ohm's law calculator (rebuilt `js/sim-ohm.js`)

- **Controls (the whole control set):** `V` slider 0–24 V step 0.1 (exact
  number input alongside), `R` slider 1–100 Ω step 0.5 (exact number input
  alongside). Four lecture presets kept (9 V·22 Ω, 12 V·4 Ω, 5 V·1 kΩ→ now
  5 V·50 Ω, 24 V·2 Ω) because the lecture reuses them.
- **The "see I":** one oversized readout `I` (cyan, 3 s.f.) plus `P = VI`
  (amber) as the only secondary, and a mono working line
  `I = V/R = 12.0 V / 4.0 Ω = 3.00 A`.
- **Canvas (single):** one rectangular loop — battery cell pair labelled V,
  resistor zigzag labelled R, ammeter bead labelled I — with charge dots
  crawling the wire at speed ∝ I (dot *speed*, not count: one current, one
  flow). I = 0 stops the dots; that silence is the V=0 lesson.
- **Cut:** chart canvas, rating slider + warning callout, meter-range
  readout, electron-flow toggle, log-scale R.

## 4. R1 — Circuit builder (rebuilt `js/sim-circuit.js`)

- **Bench model: one series loop, six sockets.** The wire is a closed loop
  drawn through the *occupied* sockets in order; empty sockets are skipped by
  the wire (so a half-built bench still shows an open idea, not an error).
- **Palette: exactly the brief's three parts** — battery (V 1.5–24, default
  12), resistor (R 1–100, default 22), bulb (modelled as a 15 Ω resistor that
  glows; brightness ∝ P = I²R).
- **Placement:** pointer-drag a palette chip onto a socket (drop highlight on
  hover), **or** keyboard/AT path: palette chips are buttons that *arm* a
  part, sockets are buttons that place the armed part — the whole builder
  stays keyboard-complete like every other sim on the site.
- **Tuning/removal:** each occupied socket gets a row under the canvas:
  name, − / + value stepper, × remove. Dragging a placed part off the bench
  also removes it (the brief's "drag/drop" includes dropping *off*).
- **Solve:** `I = V / ΣR` over the loop (ΣR = resistors + bulb; no battery or
  no bulb in the loop ⇒ open circuit, I = 0, bulb dark, one plain-language
  note saying what's missing). Battery with no resistance at all ⇒ the short
  circuit note instead of a fake infinite current.
- **Canvas:** loop wire, battery symbol, zigzag resistors, bulb circle with
  radial glow ∝ P, charge dots at speed ∝ I, and a live working line
  `ΣR = 22 + 15 = 37 Ω · I = 12 V / 37 Ω = 324 mA`.
- **Cut:** parallel branches, Kirchhoff branch solve, challenge strip,
  lane buttons, click-to-edit popover on canvas.

## 5. Contracts kept (non-negotiable, repo-wide)

- Real equations only; readouts are text nodes (AT + detail-mode pairs).
- Every interaction keyboard-reachable; no blur/glass art; flat sticker style.
- `EMC.whenNear` lazy init + `EMC.Stage` (auto-pause off-view); zero rAF chains
  when the sim scrolls away (perf guard).
- Registry ids unchanged (`sim-ohm`, `sim-circuit`) so counts, nav, quiz
  categories and progress keep resolving; chapter 1 keeps its two sim slots
  §1.4/§1.5.

## 6. Milestones

- **M1 (this change):** R2 calculator + R1 series loop, both keyboard-complete.
- **M2:** parallel branches return — as a *second* wire path the learner adds
  deliberately (two sockets linked as a bank), with the dot density splitting
  visibly; solver grows to series-parallel only.
- **M3:** I–V chart returns *inside R2* as an optional overlay, once `I = V/R`
  has been the star for a whole course pass.
