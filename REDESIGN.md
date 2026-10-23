# EMC Lab — Lessons, Interactables & Loading Redesign

> **Status: IMPLEMENTED in this repo** (all P0/P1 checklist items). Verified by
> `node tools/check-links.mjs` (clean), `node tools/smoke-test.mjs` (**561/561 assertions**),
> `node tools/shell-stress.mjs` (pass) and `node tools/build-public.mjs` (deployable).
> Where implementation details differ from the plan below, the plan text has been updated
> in place (bank size, quiz default view). This document is kept as the design record.

**Scope:** lessons, interactables and the loading experience only. Look, layout and tech stack
stay as they are (sticker-dark design, `css/input.css` → Tailwind build, vanilla JS, vendored
KaTeX/Chart.js, Canvas 2D `EMC.Stage`, registry-driven pages).

**Sources used**
1. Lecture scope "Electric Forces and Electric Field" (as itemised in the brief — the PDFs are
   not in the workspace, so the brief's scope list is treated as the lecture's table of
   contents; every number quoted from it has been independently recomputed, see §1.3).
2. Project requirements (Calculus-based Physics 2): animations/quizzes/simulations per
   tutorial; rubric = accurate physics 20 %, creativity & interactivity 15 %, quiz
   effectiveness 10 %, design & clarity 5 %; presenters graded on clear explanation + smooth
   demo.
3. Repo `TearTyr/EMC-Lab` @ clone of 2026-10-23 (README §8 design policy, `js/registry.js`,
   `topics/*.html`, `quiz.html`, `js/common.js`, `js/sim-*.js`, `js/quiz-data.js`,
   `css/input.css`, `tools/smoke-test.mjs`, `tools/perf-audit.mjs`, `js/shell.js`).

**Assumptions (stated, not asked)**
- The lecture follows the Cutnell & Johnson Ch. 18 lineage (its examples — 1 C at 1 km, the
  −4/+3/−7 µC line, the Bohr speed, the ±4 µC y-axis field — are that chapter's standard set).
  Where the brief's summary and a verifiable textbook form disagree, the verified form is used
  and the disagreement is flagged (§1.3).
- "Circuits and Magnetism become Extra" means: pages stay in the repo and stay reachable, but
  they leave the main navigation flow and are labelled *Extra — beyond this lecture*.
- The presentation team has up to three speakers; the demo script is written for A/B/C and
  notes how to collapse it to two.
- Existing infra is reused wherever possible: the `data-detail` ON/OFF preference becomes the
  sandbox **Easy/Full** toggle (one mechanism, site-wide); `EMC.Stage`, `whenNear`,
  `#bootOverlay`, the mascot bob, toasts and the storage wrapper are kept as-is.

---

# Phase 1 — Audit

## 1.1 Page and sim audit

| Page / sim | Confusing | Too long | Not in the lecture | Missing from the lecture |
|---|---|---|---|---|
| `topics/efield.html` (Topic 2) | One page carries **five** ideas (charge, Coulomb, superposition, field, *potential*); 5 objectives, 2 sims, 5 self-checks, 4 collapsed digressions. The A/B "−∫E·dr vs analytic V" panel sits under every field experiment and reads as required work. `data-detail` plain/tech slots duplicate the same lede twice. | ~640 lines; the potential/integral block (§2.5 readouts + explanation) is a full calculus interlude inside a first-encounter chapter. | Electric potential V = Σkq/r; −∫E·dr Simpson integral (240 samples); parallel-plate E = V/d; triboelectric series; lightning breakdown 3×10⁶ V/m; laser-printer applications. | **All five lecture worked examples** (1 C @ 1 km; −4/+3/−7 µC line; 2-D +4/−6/−5 µC; Bohr v = 2.19×10⁶ m/s; F = \|q₀\|E pair; ±4 µC y-axis E ≈ 75.6×10³ N/C). q = n·e and "1 C = 6.24×10¹⁸ electrons" appear nowhere in this chapter (only inside Topic 1's current definition). Neutron charge = 0 never stated. |
| `js/sim-coulomb.js` (bench) | Charges live on one fixed horizontal line — the "2-D net force" skill can't be practised; the r-slider moves **both** charges symmetrically (surprising); E(midpoint) mixes Lesson-3 material into a Lesson-2 panel. | n/a (255 lines, tight) | Midpoint-field readout (fine, but belongs to Lesson 3). | Multi-charge superposition; the lecture's line example as a preset; any force-vs-distance graph. |
| `js/sim-efield.js` (explorer) | The probe only exists while the pointer **hovers** — on touch devices it appears only mid-drag, so the "test charge" concept is practically invisible on phones. Presets overwrite the scene without warning (no undo). A/B potential markers always present. | Potential-integral machinery (~60 lines) is dead weight for this course. | −∫E·dr / V comparison. | Persistent draggable test charge; force arrows **between** charges; the lecture's y-axis example as a preset; charge counter tied to conservation; field-zero hunt as an explicit activity. |
| `topics/current.html` + `sim-ohm.js`, `sim-circuit.js` | Not confusing — just **out of scope**: the whole chapter (V = IR, Kirchhoff, power) is beyond "Electric Forces and Electric Field". Circuit builder's predict-then-run is the only instance of that pattern site-wide. | 643 lines for content the lecture never touches. | The entire chapter, relative to this lecture. | n/a |
| `topics/magind.html` + `sim-lorentz.js`, `sim-induction.js` | Same: excellent build, zero overlap with the lecture (F = qv×B, flux, Faraday, Lenz). | 962 lines — the longest page on the site. | The entire chapter, relative to this lecture. | n/a |
| `quiz.html` + `js/quiz-data.js` | 24 questions assume all three chapters; a student of *this* lecture can only answer 8. Q16 tests −∫E·dr (out of scope). Q13's answer leans on V/m (potential, not yet defined). Q15's explanation references the A/B integral panel. | Toolbar carries exam/instant × timer × filters × navigator × flags × autosave — feature-rich but heavy to explain in a demo. | 16 of 24 questions (circuits, magnetism). | No "spot the mistake" question type; no Bohr-speed question; no conservation/quantisation calculation; the lecture's own numbers (1 km, y-axis field) untested. |
| `index.html` | Hero strip claims "the four governing laws" = V·I·R, Coulomb, Lorentz, Faraday — two of the four are Extra content; lesson 1 (charge itself) has no formula on the strip. Copy says "Six simulations" (hard-coded). | n/a | Ohm + Faraday in the hero. | q = n·e, E = F/\|q₀\|, E = kq/r² in the hero; no "Extra" grouping in nav. |
| Boot/loading (`#bootOverlay`, `js/common.js` §6c) | Chips say layout/scripts/equations — honest, but the bar is **indeterminate** (infinite slide) and the overlay shows on *every* navigation, not just first visit. No rotating content. | Failsafe is 6 s; min display 200 ms (brief asks 400 ms / 4 s). | n/a | sessionStorage first-visit gate; fonts-ready signal; first-sim-ready signal; deterministic segments; tips; aria-live announcement text (only `role="status"` + label today). |
| Page transitions | None: plain full-page loads; `js/shell.js` hash-router only exists on `index.html` and only on http(s). | n/a | n/a | Cross-document View Transitions + fallback fade; nothing named for persistence (header/mascot jump between pages). |
| `PRESENTATION-NOTES.md`, `TESTING.md` | **Stale**: notes still present vectors/fluids/heat/waves as "the five movements" and demo buoyancy and the tone bench; TESTING.md says "30 questions (6 per topic)" and lists archived sim assertions; README says "nine simulations" in the notes while six ship. | n/a | n/a | Nothing matches the current EMC build — a presenter reading them would demo the wrong site. |

## 1.2 Structural findings (cross-cutting)

- **The one in-scope chapter does the work of three lessons** and then adds a fourth topic
  (potential) the lecture never mentions. That is the direct cause of "topics feel overly
  complicated".
- **Both in-scope sims are demos, not sandboxes.** The Coulomb bench has exactly two charges on
  a rail; the explorer caps at 12, has no undo/random/share, and its probe is hover-only.
  Nothing lets a student place *any* charge *anywhere* and watch *every* force/field respond —
  the Phase-4 requirement.
- **Easy/Full already exists** as the `data-detail` toggle + CSS slot pattern
  (`html[data-detail] … display:none`) — the lesson template and sandbox readouts should ride
  this one mechanism instead of inventing a second (DRY).
- **Loading is honest but universal** — every navigation replays the overlay; signals tracked
  are scripts/equations, not fonts/first-sim; no session memory.
- Repo physics is **numerically clean**: every worked number on `topics/efield.html` and every
  quiz answer I recomputed is correct (0.60 N; 1.12×10⁶ N/C; 1.80×10⁻¹³ N; 3.5×10¹⁵ m/s²;
  +2 µC each; 0.40 N; 40 W; 2 Ω…). No wrong number was found in repo content — the issues are
  scope and pedagogy, not arithmetic.

## 1.3 Number verification & flags (lecture vs brief vs repo)

| # | Item | Verification (my calculation, k = 8.99×10⁹) | Verdict |
|---|---|---|---|
| 1 | +1 C / −1 C at 1 km | F = k·1·1/1000² = **8.99×10³ N**, attractive | ✅ matches lecture |
| 2 | Line: −4 µC (x=0), +3 µC (x=0.20 m), −7 µC (x=0.40 m); net on q₁ | F₂₁ = 2.70 N (+x, attraction); F₃₁ = 1.57 N (−x, repulsion); net = **1.12 N ≈ 1.1 N toward q₂** | ✅ standard example, reproduces |
| 3 | 2-D: +4, −6, −5 µC → "≈23 N at 24°" | A right-angle corner at the +4 µC with −6 µC 0.10 m away (21.6 N) and −5 µC 0.14 m away (9.2 N) gives **23.4 N at 23.0°**; legs (0.10, 0.15) give 23.0 N at 20.3°. The quoted ≈23 N is reproducible; the exact angle depends on the figure's leg lengths. | ⚠️ **FLAG** — method taught, answer quoted as "≈23 N, ≈24° (lecture figure)"; confirm the two distances from the PDF before printing a component table |
| 4 | Bohr hydrogen speed | v = √(k e²/(mₑ r)) with r = 5.29×10⁻¹¹ m → **2.19×10⁶ m/s** | ✅ matches lecture |
| 5 | F = \|q₀\|E → "3.6×10⁻⁷ N and 4.7×10⁻⁷ N" | The textbook pair behind these mantissas is q₀ = +18×10⁻⁸ C and −24×10⁻⁸ C in E = 2.0×10³ N/C → **3.6×10⁻⁴ N and 4.8×10⁻⁴ N**. No clean (q₀, E) pair produces *both* e−7 values; the exponents in the brief look like transcription slips (−4 → −7, 4.8 → 4.7). | ⚠️ **FLAG** — lessons/quiz use the verified e−4 pair; re-read the PDF before final print |
| 6 | ±4 µC on the y-axis, E at P → "≈75.6×10³ N/C along +y" | Reconstruction: −4 µC at y = +0.50 m, +4 µC at y = −0.50 m, P at (x = 0.60 m, 0). Each charge gives E = kq/r² = 5.90×10⁴ N/C at r² = 0.61 m²; x-components cancel; E_y = 2 × 5.90×10⁴ × (0.50/0.781) = **7.55×10⁴ N/C (+y)**. With k rounded to 9.0×10⁹: **7.56×10⁴** — exactly the lecture value. | ✅ reproduces (k-rounding explains 75.5 vs 75.6) |
| 7 | e = 1.602×10⁻¹⁹ C; 1 C = 6.24×10¹⁸ electrons | 1/1.602×10⁻¹⁹ = 6.242×10¹⁸ | ✅ |
| 8 | Repo `efield.html` examples | 3 µC/−2 µC @ 0.30 m → 0.599 N ("0.60" ✓); +5 µC @ 0.20 m → 1.12×10⁶ N/C ✓; F on electron 1.80×10⁻¹³ N ✓; electron in 2.0×10⁴ N/C → a = 3.52×10¹⁵ m/s² ✓; +6/−2 spheres touched → +2 µC each ✓ | ✅ repo arithmetic correct (content is out of lecture scope, see 1.1, but not wrong) |

---

# Phase 2 — Simplify the curriculum

**Principle:** the graded lecture is *Electric Forces and Electric Field*. Three lessons, in
lecture order, each readable in minutes and playable in one sitting. Everything else stays one
click away under **Extra**, never in the main flow.

## 2.1 New structure (registry-driven — `js/registry.js` is the only place this is declared)

| # | Lesson | Path | Sims (ids) | Quiz tag |
|---|---|---|---|---|
| 1 | **Electric Charge** | `topics/charge.html` | `sim-static-room`, `toy-balloon`, `toy-ledger` | `charge` |
| 2 | **Coulomb's Law** | `topics/coulomb.html` | `sim-arena`, `toy-pinforce`, `toy-bohr` | `coulomb` |
| 3 | **Electric Field** | `topics/field.html` | `sim-fieldpaint`, `toy-dipole`, `toy-zerohunt` | `field` |
| E1 | *Extra* — Circuits & Ohm's Law | `topics/current.html` (unchanged) | `sim-ohm`, `sim-circuit` | `current` |
| E2 | *Extra* — Magnetism & Induction | `topics/magind.html` (unchanged) | `sim-lorentz`, `sim-induction` | `magind` |

Nav: Home · Lessons (dropdown: 1–3) · Extra (dropdown: E1–E2, tag-styled "beyond this
lecture") · Quiz. Breadcrumbs on Extra pages read "Home / Extra".

## 2.2 Disposition of every current chapter, section and sim

| Current item | Verdict | Where it goes / why |
|---|---|---|
| `efield.html` §2.1 charge (rule, e, quantised, conserved, conductors/insulators, friction, induction, balloon-wall self-check) | **Keep → split** | Becomes the core of Lesson 1. Real-world lightning + door-spark details: keep as the collapsed "+ Real world" slot in Lesson 1 (already behind a disclosure). |
| `efield.html` §2.2 Coulomb (law, 3 observations, +3/−2 µC example, superposition intro) | **Keep → move** | Lesson 2. Replace the invented +3/−2 µC example with the lecture's four worked examples (they carry the graded numbers). |
| `efield.html` §2.3 field (E = F/q₀, direction rule, Figure 1, field-line rules, +5 µC example) | **Keep → move** | Lesson 3. Keep the SVG direction figure and the five field-line rules verbatim (they are correct and compact). |
| `efield.html` uniform field / parallel plates (E = V/d, 5000 V example, projectile analogy) | **Move to Extra** | Not in the lecture. A short "Extra: uniform fields" disclosure at the end of Lesson 3 (collapsed, tagged), since E = V/d also underpins quiz Q13's N/C ≡ V/m. |
| `efield.html` potential & −∫E·dr (V = Σkq/r, A/B markers, Simpson check, 3 readouts) | **Cut** (archive code) | The single biggest complexity source; entirely beyond the lecture and the rubric. Move the A/B integral code to `archive/js/sim-efield-potential.js` so it stays recoverable (repo already uses `archive/` for exactly this). |
| `efield.html` self-checks (5) | **Keep → redistribute** | Spheres-touching → Lesson 1 (conservation). Tripled r → Lesson 2. Closed-loop lines + balloon-wall → Lesson 3 / Lesson 1. Electron-in-uniform-field → Extra note (uses E = V/d family). |
| `sim-coulomb.js` | **Merge** | Its 1-D pair becomes a *preset* ("Two on a line") inside the new `sim-arena`; the file itself retires to `archive/js/`. Midpoint-E readout is superseded by the arena's field overlay. |
| `sim-efield.js` | **Edit → `sim-fieldpaint.js`** | Keep `fieldAt()`, `traceLines()`, `drawVectorGrid()`, presets machinery, world scale (3 m). Remove A/B potential; add persistent ghost probe, draggable ruler, force arrows, challenges, share-code (§4.1). |
| `sim-ohm.js`, `sim-circuit.js` | **Move to Extra** | Files unchanged; page relabelled Extra; predict-then-run pattern *promoted* into the sandbox core (§4.1) so all three lessons get it. |
| `sim-lorentz.js`, `sim-induction.js` | **Move to Extra** | Files unchanged. Lorentz's slow-down-factor honesty note is the model for the Bohr toy's time scaling (§4.3). |
| `topics/current.html`, `topics/magind.html` | **Move to Extra** | Content untouched; header tag + breadcrumb + nav placement change only. |
| Quiz bank: 8 `current` + 8 `magind` questions | **Move to Extra tag** | Still selectable via the Extra filter; the default quiz view becomes Lessons 1–3. |
| Quiz bank: 8 `efield` questions | **Merge / cut** | **Keep & retag (4):** Q10 → `field` (field lines into −; complements new L3-C1), Q11 → `coulomb` (2× r → ¼ F; the ratio skill the new 15 never re-ask), Q12 → `field` (proton accelerates along E; motion, not definition), Q14 → `charge` (neutrality = balance). **Cut (4):** Q9 (Coulomb substitution — covered by new L2-N1), Q13 (N/C ≡ V/m needs potential — Extra scope), Q15 (midpoint E = 0 — covered word-for-skill by new L3-C2; keeping both would repeat a fact), Q16 (−∫E·dr, out of scope). Net bank: 15 new + 4 retained + 16 Extra = **35**; the quiz keeps "All" as the default view and adds a one-click **Lessons 1–3** group filter (19 questions); zero duplicates (see §5.4). |
| `index.html` hero strip ("four governing laws") | **Edit** | New strip = the lecture's four: q = n·e · F = k\|q₁q₂\|/r² · E = F/\|q₀\| · E = kq/r². Extra formulas move to an Extra card. "Six simulations" copy becomes registry-derived. |
| `PRESENTATION-NOTES.md`, `TESTING.md` | **Rewrite** | Both describe the archived general-physics site. Replaced by the Phase-6 cheat sheet + demo script and an updated assertion list. |
| Boot overlay | **Edit** | Session-gated, deterministic, fonts/first-sim signals (§7a). One pattern, reused on all five lesson/extra pages + quiz. |

---

# Phase 3 — Lesson template + full content

## 3.0 The template (identical on all three lessons)

| Layer | What it is | Hard limits |
|---|---|---|
| **A · 30-second Summary** | Scannable card at the top: ≤ 4 bullets + the one key formula (KaTeX). Never explains — only names. | 4 bullets, 1 formula |
| **B · Easy Version** | Plain words, one everyday analogy, zero jargon, one flat-SVG picture. Never defines symbols (A already named them; C defines them). | ≤ ~150 words, 1 picture |
| **C · Full Version** | Precise definitions, the lecture's worked examples with full substitutions, common mistakes. Never re-analogises (B did that). | definitions → examples → mistakes |
| **D · Try It** | One sandbox + two tiny toys (Phase 4) and the 5-question quiz (Phase 5). No prose beyond one-line prompts. | 1 + 2 + 5 |

**No-repeat rule enforced:** a fact appears *named* in A, *storied* in B, *precise* in C —
each layer only does what the others don't. The site-wide **Details ON/OFF** toggle
(`data-detail`) keeps working: A + B show when OFF; C shows only when ON. The sandbox
Easy/Full toggle reads the same preference (§4.1).

**Symbols — defined once, in Lesson 1, referenced everywhere else** (one card, id
`#symbols`, linked from Lessons 2–3 wherever a symbol first appears):

| Symbol | Meaning | Unit / value |
|---|---|---|
| q, q₁, q₂ … | a charge (subscripts just count them) | coulomb, C |
| q₀ | test charge (small, positive by convention) | C |
| e | elementary charge — the quantum of charge | 1.602×10⁻¹⁹ C |
| n | integer number of elementary charges | — (count) |
| F | electric force | newton, N |
| r | centre-to-centre distance | metre, m |
| k | Coulomb constant | 8.99×10⁹ N·m²/C² |
| E | electric field | N/C |
| v | speed | m/s |
| mₑ | electron mass | 9.109×10⁻³¹ kg |
| µ (prefix) | micro = 10⁻⁶ | e.g. 1 µC = 10⁻⁶ C |
| θ | angle measured from the +x axis | degrees |

---

## 3.1 Lesson 1 — Electric Charge

### A · 30-second Summary
- Two kinds of charge: proton **+**, electron **−**, neutron **0**.
- **Like repels, unlike attracts.**
- Charge is **quantised** (always whole multiples of e) and **conserved** (only ever moves).
- **Conductors** let charge roam; **insulators** hold it where you put it.

**Key formula:** q = n·e, e = 1.602×10⁻¹⁹ C → 1 C = 6.24×10¹⁸ electrons.

### B · Easy Version  *(≈135 words)*
Everything around you is packed with tiny charged bits. Usually the positives and negatives
balance exactly, so nothing happens. Rub a balloon on your hair and it *scoops* some negatives
off — the balloon takes, the hair gives. Now the balloon behaves like a sticky sock on a wall:
opposites pull together, likes push apart.

Here is the secret worth remembering: rubbing never *makes* charge. It only moves charge that
was already there. Whatever the balloon gains, your hair loses — the total never changes, no
matter what you do. That is why the playground below has a tally that literally cannot be
broken.

Some materials, like metal, let charge wander freely — those are conductors. Rubber, glass and
dry hair grip it tight — insulators. That is why static cling survives a whole winter day.

*Picture idea (flat SVG, palette `--pk`/`--sk`):* a pink balloon with three blue "−" stickers
mid-rub against a hair strand that shows three matching "+" gaps; beside it Denki-chan with
standing hair and a stuck sock, plus a wall patch of small "+" dots.

### C · Full Version
**Definitions.** *Charge* is the property of matter that feels electric pushes and pulls; the
SI unit is the coulomb (C). The proton carries +e, the electron −e, the neutron 0.
*Quantisation*: every observable charge is q = n·e with n an integer — charge comes in
indivisible parcels. *Conservation*: in any process (rubbing, touching, separating) the total
charge before equals the total after; charge moves between objects, it is never created.
*Conductor*: material where charge moves easily (metals, salt water, your body); excess charge
spreads over the surface. *Insulator*: material where charge stays put (rubber, glass, dry
air, plastic). *Charging by friction*: contact + rubbing transfers electrons; the material
higher on the triboelectric series loses them and ends positive. *Polarisation*: a charged
object near a neutral one shifts that object's charges slightly — nearer opposite charge wins
because the field is stronger up close — producing net attraction (the balloon-on-wall effect).

**Worked example 1 — how big is a coulomb?** n = q/e = 1 C / 1.602×10⁻¹⁹ C = **6.24×10¹⁸
electrons**. A coulomb is enormous: ordinary static involves micro-coulombs, 10⁻⁶ C.

**Worked example 2 — conservation in action.** Two identical spheres, +6 µC and −2 µC, are
touched together then separated. Total before = +4 µC; identical spheres share equally →
**+2 µC each**. (Same arithmetic the ledger toy performs live.)

**Common mistakes.**
1. "Neutral means no charges." Neutral means *equal* + and −.
2. "Rubbing creates charge." It transfers electrons; the two objects end equal and opposite.
3. "Conductors can't hold static charge." They can — when isolated (on an insulating handle);
   held in the hand, your body drains them.
4. Counting protons as mobile. In solids only **electrons** move; protons stay in nuclei.

### D · Try It
Sandbox **Static Room** + toys **Rub the Balloon**, **Charge Ledger** (§4.2) + 5-question quiz
(§5.1). Discovery line at the end of each toy links back to bullet 3 of the Summary.

---

## 3.2 Lesson 2 — Coulomb's Law

### A · 30-second Summary
- Every charge pushes or pulls every other charge — the rule of Lesson 1, now with a number.
- Force grows with the charges and dies with the **square** of distance: 2× r → ¼ F.
- Signs pick the **direction only**; the magnitude uses \|q₁q₂\| and is never negative.
- Several forces on one charge add **as arrows** (x- and y-components), never as plain numbers.

**Key formula:** F = k·\|q₁\|\|q₂\| / r², k = 8.99×10⁹ N·m²/C².

### B · Easy Version  *(≈145 words)*
Two charges are like two skaters facing each other. Same-style skaters push apart; opposite
ones pull together — and the interesting part is *distance*. Step back to twice the distance
and the push does not halve — it drops to a quarter. Three times away, a ninth. Up close is
where all the drama lives.

Bigger charges shove harder: double one charge, double the force. And the push is always
mutual — a tiny charge shoves a huge one exactly as hard as the huge one shoves it, just the
other way round, like skaters pushing off each other.

With three or more charges around, each one tugs or pushes on its own. To find the total
effect on any single charge, add the pushes as arrows with direction — like the tug-of-war
arena below, where you can feel the rope change as you drag.

*Picture idea:* flat SVG tug-of-war — a pink "+" and a blue "−" hauling a rope; two arrows of
equal length point at each other; a dashed ruler below marks r and 2r, with the far arrow
drawn a quarter-length.

### C · Full Version
**Definitions.** Coulomb's law gives the force **between two point charges** (or uniform
spheres, r measured centre-to-centre): F = k\|q₁q₂\|/r². The two forces form a **Newton's
third-law pair**: equal magnitude, opposite direction, regardless of which charge is bigger.
**Superposition**: with three or more charges, each pair interacts independently; the net
force on one charge is the vector sum F⃗ₙₑₜ = F⃗₁ + F⃗₂ + … — resolved into
components, then recombined with √(Fₓ² + F_y²) and θ = tan⁻¹(F_y/Fₓ).

**Worked example 1 (lecture) — one coulomb is huge.** q₁ = +1 C, q₂ = −1 C, r = 1 km = 10³ m:
F = (8.99×10⁹)(1)(1)/(10³)² = **8.99×10³ N**, attractive — the weight of about 900 kg. This
is why real static is measured in µC.

**Worked example 2 (lecture) — net force on a line.** q₁ = −4 µC at x = 0; q₂ = +3 µC at
x = 0.20 m; q₃ = −7 µC at x = 0.40 m. Force on q₁:
- from q₂ (unlike → attract, toward +x): F₂₁ = (8.99×10⁹)(4×10⁻⁶)(3×10⁻⁶)/(0.20)² = **2.70 N**
- from q₃ (like → repel, toward −x): F₃₁ = (8.99×10⁹)(4×10⁻⁶)(7×10⁻⁶)/(0.40)² = **1.57 N**
- net = 2.70 − 1.57 = **1.1 N toward q₂** (+x). Directions first, arithmetic second.

**Worked example 3 (lecture) — net force in 2-D.** Charges +4 µC, −6 µC, −5 µC; the net force
on the +4 µC charge is **≈23 N at ≈24°** (lecture figure). The method is the whole lesson:
find each force's magnitude with k\|q₁q₂\|/r², decide each direction from the signs, resolve
into x/y components, add components, then rebuild magnitude and angle. The arena's "component
ghosts" draw exactly these steps live. *(Distances per the lecture figure — see flag §1.3 #3;
the reconstructed right-angle legs 0.10 m / 0.14 m give 23.4 N at 23.0°.)*

**Worked example 4 (lecture) — the Bohr hydrogen atom.** The electron (−e) orbits the proton
(+e) at r = 5.29×10⁻¹¹ m with the Coulomb force supplying the centripetal force:
k e²/r² = mₑ v²/r → v = √(k e²/(mₑ r)) = √(2.31×10⁻²⁸ / 4.82×10⁻⁴¹) = **2.19×10⁶ m/s**
(≈ 0.7 % of the speed of light).

**Common mistakes.**
1. Adding force *magnitudes* in 2-D (2.70 + 1.57 ≠ the vector answer).
2. Forgetting r is squared — or leaving r in cm (0.20 m, not 20).
3. Believing the bigger charge exerts the bigger force (third law says no).
4. Substituting signed charges into F and reporting a "negative force": F is a magnitude;
   signs only steer the arrow.

### D · Try It
Sandbox **Tug-of-War Arena** + toys **Pin the Force**, **Bohr Tuner** (§4.3) + quiz (§5.2).

---

## 3.3 Lesson 3 — Electric Field

### A · 30-second Summary
- A charge changes the space around it: that condition is the **electric field E**.
- E at a point = force per unit **positive** test charge — units N/C.
- **Direction rule:** E points the way a positive test charge would be pushed (out of +, into −).
- Fields add as vectors; between two like charges there is a point where **E = 0**.

**Key formula:** E = F/\|q₀\| ; for a point charge E = kq/r².

### B · Easy Version  *(≈148 words)*
Picture the space around a charge as a room with an invisible wind. Near a positive charge the
wind blows outward; near a negative one it sucks inward. You cannot see the wind, but hold up a
tiny leaf and it points whichever way the push goes. That is the electric field: a push
*waiting* at every spot, whether or not anything is there to feel it.

Closer to the source the wind is stronger; twice as far, four times weaker — the same
inverse-square habit from Lesson 2.

Drop two charges into the room and their winds mix. Between two matching charges there is one
quiet spot where the leaf floats perfectly still: equal pushes, opposite directions, net zero.
The zero-hunt toy below turns finding that spot into a game of hot and cold.

Field lines are the smoke trails of this wind — they show where it blows and how hard.

*Picture idea:* Denki-chan holding a pinwheel among flat arrows radiating out of a pink "+"
disc, with dashed arrows converging into a blue "−" disc; one calm dot marked "?" between two
"+" discs.

### C · Full Version
**Definitions.** The **test charge q₀** is a small positive charge used to probe a point
without disturbing the sources. The **electric field** is E = F/\|q₀\| — newtons per coulomb,
a vector defined at *every* point of space, present whether or not a test charge is there.
For a single point charge this becomes E = kq/r², radially outward for q > 0, inward for
q < 0. **Superposition**: the net field is the vector sum of each charge's contribution,
E⃗ = Σ kqᵢ r̂ᵢ/rᵢ². A charge q₀ placed in a field feels **F = q₀E** — for a *negative*
q₀ the force points *opposite* E. **Field-line rules** (kept from the current page, all five):
start on +, end on −; never cross; density = strength; tangent = direction of E; number of
lines ∝ \|q\|.

**Worked example 1 (lecture) — force from a known field.** In E = 2.0×10³ N/C:
- q₀ = +18×10⁻⁸ C → F = \|q₀\|E = (18×10⁻⁸)(2.0×10³) = **3.6×10⁻⁴ N**, along E.
- q₀ = −24×10⁻⁸ C → F = (24×10⁻⁸)(2.0×10³) = **4.8×10⁻⁴ N**, *opposite* E (negative charge).
*(Brief lists 3.6×10⁻⁷ / 4.7×10⁻⁷ — flagged §1.3 #5; the e−4 pair is the verified textbook
form of this example.)*

**Worked example 2 (lecture) — field of two charges on the y-axis.** q₊ = +4 µC at
y = −0.50 m, q₋ = −4 µC at y = +0.50 m; find E at P = (x = 0.60 m, y = 0).
- r² from each charge to P = 0.60² + 0.50² = 0.61 m²; each contributes
  E₁ = E₂ = kq/r² = (8.99×10⁹)(4×10⁻⁶)/0.61 = 5.90×10⁴ N/C.
- x-components: equal and opposite → cancel. y-components: both point **+y** (away from the
  lower +, toward the upper −): E_y = 2 × 5.90×10⁴ × (0.50/√0.61) = 2 × 5.90×10⁴ × 0.640.
- **E = 7.55×10⁴ N/C along +y** (lecture prints 75.6×10³ using k ≈ 9×10⁹ — same result).
The field-painter's "Lecture replica" preset loads exactly this scene and prints the same
number at P.

**Common mistakes.**
1. Taking E's direction from the force on whatever charge happens to be there — the rule is
   defined for a **positive** test charge; electrons feel the opposite way.
2. "No test charge, no field." The field is a property of the sources and of space.
3. "E = 0 means nothing is there." It means the vectors cancel (the null point).
4. Treating field lines as tracks charges slide along — a released charge follows its
   *velocity plus force*, generally not the line.

### D · Try It
Sandbox **Field Painter** + toys **Dipole Builder**, **Zero-Field Hunt** (§4.4) + quiz (§5.3).

---

# Phase 4 — Interactables: open sandboxes

## 4.0 Global sandbox spec — `js/sandbox-core.js` (new, shared by all nine builds)

Everything below is stated **once** and referenced by each sandbox; no sandbox may special-case
a rule.

- **World:** normalised coordinates on a fixed physical scale (3 m across — the value
  `sim-efield` already proved resolution-independent), flat `--plate` background, faint grid.
- **Objects:** unlimited in principle; soft cap **40** with a toast ("40 is a lot — physics
  still runs, but it will get busy"), because the O(n²) pair kernel and line tracer need a
  budget. Add via toolbar stamp (click/tap places the selected item), magnitude via slider
  **or scroll wheel over the object**, sign via the tool picked. Every object draggable; the
  **ruler is an object too** (drag either end; reads Δx, Δy, r in metres — it never affects
  physics).
- **Kernels (real equations, every frame):** pairwise force F = k\|q₁q₂\|/r² with direction
  from signs; field E(P) = Σ kq(P−r⃗)/\|P−r⃗\|³ (lifted from `sim-efield.fieldAt`).
- **Never blows up:** close-range **softening** r_eff = √(r² + ε²), ε = 4 % of world width
  (0.12 m → worst case ~62 N for two 10 µC charges touching, well-behaved); global force cap
  10⁴ N with a "maxed" flag on the arrow; release-mode integrator clamps dt ≤ 16 ms and speed
  ≤ 50 m/s; a flat amber chip **"unstable — charges are accelerating hard"** appears when any
  kinetic term saturates (no red flashing, no gradient).
- **Release mode (hidden until found):** a small "let go" switch in the toolbar; charges then
  integrate F = ma (masses fixed per object type, printed in Full mode). Charges **bounce**
  off world edges with 0.6 restitution (transform-only squash on impact frame — flat art, no
  glow). Wobble on release: a 120 ms transform scale pulse proportional to \|F\| at release —
  bigger force, bigger thump.
- **Toggles (toolbar, aria-pressed):** field arrows · field lines · force arrows · numbers ·
  trails (release-mode paths, 2 s fading polyline — opacity only) · slow motion (×0.25 time
  scale, printed honestly like `sim-lorentz`'s slow-down factor).
- **Tools (toy-box):** + charge · − charge · test charge (ghost, q₀ = +1 nC, shows F = q₀E) ·
  charged balloon · conductor ball · insulator rod · measuring probe · ruler · eraser.
  Balloon/sock/rod are *skins over the same point-charge kernel* with material rules:
  insulators hold their q where placed; conductor balls redistribute total q equally when they
  touch another conductor (charge conserved — the ledger tally never moves).
- **Undo / Clear / Random:** undo = state-stack (last 30 actions, also Ctrl/Cmd+Z); random =
  3–7 charges, net-q-neutral by construction, seeded from a 4-char code so "Random" results are
  shareable too.
- **Easy/Full toggle:** reads the existing site-wide `emc.prefs.v1` detail preference (one
  mechanism, DRY). **Easy** = arrows, colours, words only ("strong push ←", "field points
  up"). **Full** adds numbers, units, and the live substitution line (e.g.
  F = (8.99×10⁹)·\|4.0×10⁻⁶ × −6.0×10⁻⁶\| ÷ (0.100)² = 21.6 N) using the existing `eng()/unit()`
  formatter — the `sim-coulomb` substitution line, generalised.
- **Predict-then-run prompts:** after ~20 s of idle play, one non-blocking card appears:
  "Before you drag: which way will the ghost move?" [answer chips] → instant ✓/✗ + one-line
  why, computed from the live state (never scripted). Always skippable ("not now" persists for
  the session). Pattern lifted from `sim-circuit`'s existing predict-then-run.
- **Challenges (optional, never block):** a collapsed "★ Challenges" strip; each challenge has
  a one-line goal + a hint button; success is detected **from the physics state** (e.g.
  \|E(P)\| < 1 % of max for 1 s) → flat star + toast + "what you just discovered" line linking
  to the lesson Summary anchor. Stars persist in `EMC.Progress` (existing store).
- **Share:** state → compact base64url code in the URL hash (`#s=…`) + a "Copy setup" button
  (clipboard API with a select-all-text fallback for file://). Load = parse hash on boot,
  validate checksum, reject junk silently. Codes cover objects, toggles and mode.
- **Discovery line:** every sandbox/toy ends (on challenge completion, or via the "?" button)
  with exactly one sentence that **links to the Summary bullet it proves** — the sentence is
  never a restatement of layer A/B/C text, always phrased as "You just showed that …".
- **Reduced motion & flat art:** trails/wobble/bounce/slow-mo off under
  `prefers-reduced-motion` (static frames still fully interactive — Stage already does this);
  zero gradients/glow/blur (smoke-test enforces); all motion is canvas-drawn or
  opacity/transform.
- **Touch contract (all sandboxes):** `touch-action: pan-y` idle → `none` while dragging
  (existing `.dragging` class); **pinch = zoom the world scale** (0.5–4 m across; readouts
  update because physics is resolution-independent); **long-press (350 ms) on an object =
  context sheet** (sign flip · magnitude slider · duplicate · delete); **two-finger drag =
  pan** when zoomed; toolbar buttons ≥ 44 px targets.

## 4.1 Reuse map (which file becomes what)

| New build | From | Verdict |
|---|---|---|
| `js/sandbox-core.js` | `sim-efield.js` (fieldAt, traceLines, vectorGrid, presets, world scale), `sim-coulomb.js` (substitution line, arrow scaling, log-map), `sim-circuit.js` (predict-then-run pattern), `common.js` (Stage, eng/unit, toast, Prefs, Progress) | **New file, ~70 % salvaged logic** |
| `js/sim-static-room.js` | sandbox-core + material rules | new (thin) |
| `js/toy-balloon.js`, `js/toy-ledger.js` | sandbox-core kernels at tiny scale | new (thin) |
| `js/sim-arena.js` | sandbox-core + `sim-coulomb` presets ("Two on a line", lecture line example) | new; `sim-coulomb.js` → `archive/js/` |
| `js/toy-pinforce.js` | `sim-ohm.js`'s chart-drawing approach (axes, live trace) | new (thin) |
| `js/toy-bohr.js` | `sim-lorentz.js`'s honest slow-down-factor orbit drawing | new (thin) |
| `js/sim-fieldpaint.js` | `sim-efield.js` **edited** (drop A/B potential; add ghost, ruler, challenges, share) | edit |
| `js/toy-dipole.js`, `js/toy-zerohunt.js` | `sim-efield.js` traceLines / fieldAt | new (thin) |

Page weight: sandbox-core (~14 KB min) + 2–3 thin toys per page ≈ 25–35 KB JS per lesson —
the <500 KB/page budget stays trivially green (current pages ship ~250–280 KB *including*
KaTeX + fonts).

## 4.2 Lesson 1 — Electric Charge

### Main sandbox · **Static Room**
| | |
|---|---|
| **Play** | A near-empty room (one lonely sock). A bored student immediately stamps a balloon, drags it onto the sock, flips its sign, watches them chase; then floods the room with 20 mixed objects, hits "let go" and watches the pile-up bounce. |
| **Hidden lesson** | Like/unlike is a *pair* rule and charge only moves: the net-charge tally at the top never changes — through rubbing, touching, conductor sharing, chaos. |
| **Learning goal** | Predict attraction vs repulsion for any pair, and state that the room's total charge is invariant. |
| **Formula** | Pair rule from q = n·e bookkeeping; conductor touch: q_shared = (q₁+q₂)/2 (equal identical balls); Σq = const. |
| **Aha** | "I threw 30 charges in, made them collide and share — the tally never blinked." |
| **File map** | **New** `sim-static-room.js` on sandbox-core; kernel reused from `sim-coulomb` (pair force) + `sim-efield` (multi-object loop). |
| **Touch** | Pinch-zoom the room; long-press an object → sign/magnitude sheet; two-finger pan. Drag with `touch-action:none` only while owned. |

### Tiny toy 1 · **Rub the Balloon**
| | |
|---|---|
| **Play** | Swipe the balloon back and forth across the hair strip; each pass is a "rub". Then drag the balloon to the wall / paper bits / the sock. |
| **Hidden lesson** | Rubbing *transfers* electrons one parcel at a time: balloon reads −ne, hair +ne, total 0 — the counters tick up with every stroke. |
| **Learning goal** | Explain charging by friction as electron transfer with q = n·e and conservation. |
| **Formula** | q = n·e (n from a "stroke strength" slider: 10¹⁰–10¹³ electrons/stroke, printed in Full mode). |
| **Aha** | The two counters are always exact opposites — no matter how hard or how long you rub. |
| **File map** | **New** `toy-balloon.js` (single-finger swipe gesture; no arena needed). |
| **Touch** | The rub *is* a touch gesture — one finger back-and-forth; long-press flips which material "wins" the electrons (triboelectric order); pinch disabled (fixed scene). |

### Tiny toy 2 · **Charge Ledger**
| | |
|---|---|
| **Play** | A tray of labelled balls (+6 µC, −2 µC, …). Touch any two together (drag one onto the other); they share. "Randomise" refills the tray; the big tally sits on top. |
| **Hidden lesson** | Conservation is arithmetic: identical conductors share (q₁+q₂)/2; the sum before = sum after, *every* time — it's the worked example 2 of Lesson 1 as a toy. |
| **Learning goal** | Compute post-contact charges and verify conservation as an invariant, not a slogan. |
| **Formula** | q' = (q₁+q₂)/2 per touch; Σq invariant. |
| **Aha** | "I can't break the tally. I *literally* can't." |
| **File map** | **New** `toy-ledger.js` (DOM chips + one short canvas; reuses `eng()/unit()`). |
| **Touch** | Drag-and-drop merging works one-handed; long-press a ball → edit value sheet; no pinch (2-D tray). |

## 4.3 Lesson 2 — Coulomb's Law

### Main sandbox · **Tug-of-War Arena**
| | |
|---|---|
| **Play** | Empty arena + one +4 µC charge pre-seeded at centre (the "rope holder"). Student drops a −6 µC, drags it around, watches the force arrow stretch; adds more charges until the centre charge is pulled five ways; hits "let go" and watches an orbit or a collision. |
| **Hidden lesson** | Forces are vectors obeying 1/r²: net force on the selected charge is the arrow-sum, and a *balanced* configuration (net = 0) exists and is findable by hand. |
| **Learning goal** | Construct and read the net force on any charge from any configuration, including the zero case. |
| **Formula** | F = k\|q₁q₂\|/r² per pair; F⃗ₙₑₜ = ΣF⃗ᵢ; component ghosts drawn when a charge is selected (Full mode prints each Fₓ, F_y). |
| **Aha** | Selecting a charge shows its *individual* pull-arrows plus the net — and dragging one charge can zero the net on another (★ "balance q₁" challenge). |
| **File map** | **New** `sim-arena.js`; absorbs `sim-coulomb.js` (retired to `archive/`) whose two presets return as optional shortcuts: "Two on a line" and the lecture line example (−4/+3/−7 µC at 0/0.20/0.40 m → net 1.1 N verified live). |
| **Touch** | Pinch-zoom to see fine separations (r readout updates); long-press → charge sheet; two-finger pan; "let go" switch is a 44 px toolbar toggle, not a gesture. |

### Tiny toy 1 · **Pin the Force** (live 1/r² tracer)
| | |
|---|---|
| **Play** | One charge is pinned (but *draggable* — "pinned" just means the graph follows it); you drag the second along the ruler and a live F(r) curve traces itself point by point on a small graph strip. |
| **Hidden lesson** | The curve is a hyperbola: the drop from r to 2r is exactly ×¼, from 2r to 3r ×(4/9) — the inverse square is *seen*, not memorised. Ghost markers at r, 2r, 3r print the ratios. |
| **Learning goal** | Relate separation changes to force changes quantitatively via the 1/r² shape. |
| **Formula** | F(r) = k\|q₁q₂\|/r², plotted live with the current q's substituted (Full mode). |
| **Aha** | "The first few centimetres contain almost all the force — the tail is flat forever." |
| **File map** | **New** `toy-pinforce.js`; chart drawing approach reused from `sim-ohm.js`'s I–V strip (axes + live trace). |
| **Touch** | Drag along the ruler with one finger; long-press the curve to pin a comparison marker; pinch changes the r-axis range (0.02–2 m). |

### Tiny toy 2 · **Bohr Tuner**
| | |
|---|---|
| **Play** | An electron circles a proton. Drag the electron inward/outward (or use the radius slider) and watch the speed readout climb/fall; "Release orbit" lets it fly tangentially if you fling it. |
| **Hidden lesson** | Circular orbits need the Coulomb force to *be* the centripetal force: v = √(k e²/(mₑ r)) — smaller orbit, faster electron; the lecture's r gives exactly 2.19×10⁶ m/s. |
| **Learning goal** | Derive and check the Bohr speed from force balance, and explain why v ∝ 1/√r. |
| **Formula** | k e²/r² = mₑ v²/r → v = √(k e²/(mₑ r)); period T = 2πr/v. Visual time slowed by a printed factor (honesty pattern from `sim-lorentz`). |
| **Aha** | ★ challenge "hit the lecture speed": snap within 1 % of r = 5.29×10⁻¹¹ m and the readout flashes **2.19×10⁶ m/s** — the number from class, produced by *play*. |
| **File map** | **New** `toy-bohr.js`; orbit drawing + slow-down-factor label reused from `sim-lorentz.js`. |
| **Touch** | Radius drag is one-finger; long-press the electron toggles a "velocity arrow" (tangential); pinch scales the r-window (10⁻¹¹ m world — the scale chip always prints units). |

## 4.4 Lesson 3 — Electric Field

### Main sandbox · **Field Painter**
| | |
|---|---|
| **Play** | An empty canvas and a brush. Student stamps + and − charges and *paints* the field: arrows and lines bloom live under the cursor; then grabs the **ghost** (a persistent +1 nC test charge) and drags it around to feel where the push is strong, weak, zero, reversed. |
| **Hidden lesson** | The field exists at every point whether or not the ghost is there — the ghost only *reads* it; F on the ghost = q₀E, and its direction defines E's direction. |
| **Learning goal** | Map E for arbitrary charge configurations and predict the force on a test charge at any point. |
| **Formula** | E(P) = Σ kqᵢ r̂ᵢ/rᵢ²; F = q₀E; lines integrated along Ê (existing `traceLines`). |
| **Aha** | The "Lecture replica" preset (±4 µC on the y-axis at ±0.50 m, P at x = 0.60 m) prints **E = 7.55×10⁴ N/C, +y** at P — the exact number from class — and dragging the ghost to P shows the same arrow the algebra produced. |
| **File map** | **Edit** `sim-efield.js` → `sim-fieldpaint.js`: keep fieldAt/traceLines/vectorGrid/presets; **remove** A/B potential markers + Simpson readouts (archived); **add** persistent draggable ghost (replaces hover-only probe — fixes the touch gap), draggable ruler, force arrows between charges, challenges, share-code, release mode for the ghost. |
| **Touch** | Ghost is a 44 px-grabbable ring (no hover needed); pinch-zoom the 3 m world; long-press empty space → stamp menu; two-finger pan. Probe readouts stay in the side panel so they're readable while a finger covers the canvas. |

### Tiny toy 1 · **Dipole Builder**
| | |
|---|---|
| **Play** | Two opposite charges joined by a stretchy bond. Pull them apart, squeeze them together, spin the pair, flip the polarity button; field lines redraw every frame. |
| **Hidden lesson** | Lines leave + and enter − and the *shape* of the pair pattern is symmetric — the archetypal field picture builds itself from two point charges (superposition made visible). |
| **Learning goal** | Draw and explain the dipole field pattern from superposition of two point-charge fields. |
| **Formula** | E⃗ = kq₊r̂₊/r₊² + kq₋r̂₋/r₋² (Full mode prints both contributions at the probe). |
| **Aha** | "The lines don't care that it's 'one object' — they're just two charges' fields added, and the pattern falls out." |
| **File map** | **New** `toy-dipole.js`; thin wrapper on `sim-fieldpaint`'s traceLines + a two-object constraint (bond length slider). |
| **Touch** | One-finger drag rotates the dipole about its centre; pinch stretches the bond; long-press swaps which end is +. |

### Tiny toy 2 · **Zero-Field Hunt**
| | |
|---|---|
| **Play** | A treasure map: 2–3 like charges hidden under a fog of flat arrow glyphs (or your own build). Drag the E-meter probe around; the readout plays hot/cold in flat colour **steps** (never a gradient): pale when strong, bright green chip when \|E\| < threshold. Find the still point, collect the star. |
| **Hidden lesson** | E = 0 doesn't mean "nothing there" — it means the vectors cancel exactly; between two like charges the null point sits closer to the *smaller* charge. |
| **Learning goal** | Locate and explain null points of superposed fields. |
| **Formula** | Σ kqᵢ r̂ᵢ/rᵢ² = 0; for two like charges on a line: x = D/(1 + √(q₂/q₁)) (printed as the hint in Full mode). |
| **Aha** | ★ "Find the zero": the meter drops to ≈0 N/C mid-drag and the arrows around the probe visibly shrink to dots — "I *found* the cancellation the equation promised." |
| **File map** | **New** `toy-zerohunt.js`; reuses `sim-efield.fieldAt` + arrow helpers; "Randomise hunt" reuses sandbox-core's seeded random. |
| **Touch** | Probe drag is one-finger with a 44 px handle; long-press drops a pin marking a guess (pins persist, count shown); pinch-zoom to refine near the null. |

## 4.5 Coverage check against the brief's idea list

Balloon-and-hair ✓ (toy 1.1) · sticky-sock playground ✓ (Static Room's seeded sock + all
skins) · conservation counter ✓ (Ledger + Static Room's permanent tally) · tug-of-war arena ✓
· pin-the-force 1/r² ✓ · Bohr radius↔speed ✓ · paintable field ✓ · draggable test-charge
ghost ✓ · dipole builder ✓ · zero-field treasure hunt ✓ · lecture-replica preset ✓ (Field
Painter, one optional shortcut — presets never required). Extra ideas added: draggable ruler
as a first-class object; seeded shareable "Random"; component ghosts in the arena; honest
slow-motion factor; conductor-touch charge sharing.

---

# Phase 5 — Quizzes (15 questions; every number recomputed — verification table at §5.4)

Format per question: 4 options · correct answer · one-line explanation · hint · **Easy** or
**Full** tag (Easy shown when site detail = OFF, Full when ON — same `data-detail` mechanism).
2 concept + 2 calculation + 1 spot-the-mistake per lesson. Calculation questions use lecture
numbers (flags §1.3 apply).

## 5.1 Lesson 1 — Electric Charge

**L1-C1 · Concept · Easy**
Two objects attract each other electrically. Which statement must be true?
A) Both are positive · B) Both are negative · **C) They carry opposite signs of net charge** · D) One is a magnet
*Explain:* Unlike attracts — attraction requires opposite net charges (repulsion would require like).
*Hint:* What do the skaters in Lesson 2's story do when they're "opposite"?

**L1-C2 · Concept · Easy**
Why can a rubber balloon hold a static charge for hours while a copper ball cannot (held in your hand)?
A) Rubber makes more electrons · **B) Rubber is an insulator — charge stays where it was put; copper is a conductor and your body drains it** · C) Copper has no electrons · D) Rubber is heavier
*Explain:* Conductors let charge move (here, into you); insulators trap it.
*Hint:* Which material lets charge "wander freely" — and where does it wander to?

**L1-N1 · Calculation · Full**
How many electrons carry a total charge of −1.00 C?
A) 1.60×10⁻¹⁹ · **B) 6.24×10¹⁸** · C) 6.24×10⁻¹⁸ · D) 1.60×10¹⁹
*Explain:* n = q/e = 1.00 / 1.602×10⁻¹⁹ = 6.24×10¹⁸ — the lecture's conversion, inverted.
*Hint:* One electron is 1.602×10⁻¹⁹ C. Divide, don't multiply.

**L1-N2 · Calculation · Full**
A dust speck loses 5.0×10⁶ electrons. Its net charge becomes:
A) −8.0×10⁻¹³ C · **B) +8.0×10⁻¹³ C** · C) +5.0×10⁶ C · D) +3.2×10⁻²⁵ C
*Explain:* Losing negative charge leaves q = +ne = +(5.0×10⁶)(1.602×10⁻¹⁹) = +8.01×10⁻¹³ C.
*Hint:* q = n·e — and ask which sign is left behind when electrons *leave*.

**L1-M1 · Spot the mistake · Easy**
A student writes: "Rubbing the balloon on my hair created negative charge on the balloon, which is why the total charge of balloon + hair increased." What is wrong?
A) Balloons can't be charged · B) Hair can't lose electrons · **C) Rubbing transfers electrons; the total charge stays exactly the same (hair gains +, balloon gains −, equal amounts)** · D) The total should have decreased
*Explain:* Conservation: charge moves, never appears — the ledger tally in the toy is the proof.
*Hint:* Play with the Charge Ledger — can you make the big number move?

## 5.2 Lesson 2 — Coulomb's Law

**L2-C1 · Concept · Easy**
A +1 µC charge and a +1000 µC charge sit 1 m apart. Compare the forces each feels.
A) The big charge feels 1000× more · **B) Both feel exactly the same magnitude, opposite directions** · C) The small one feels more · D) Only the big one feels a force
*Explain:* Newton's third law — the pair is always equal and opposite, whatever the sizes.
*Hint:* The skaters in Lesson 2's story: does the heavier skater push harder?

**L2-C2 · Concept · Full**
Two forces act on a charge: 3 N east and 4 N north. The net force is:
A) 7 N northeast · **B) 5 N, at 53° north of east** · C) 1 N east · D) 12 N
*Explain:* Forces add as vectors: √(3²+4²) = 5 N, θ = tan⁻¹(4/3) = 53° — magnitudes never just sum.
*Hint:* 3-4-5. What shape do two perpendicular arrows make?

**L2-N1 · Calculation · Full**  *(lecture example)*
Charges +1 C and −1 C are 1 km apart. The force between them is:
A) 8.99 N · B) 8.99×10⁶ N · **C) 8.99×10³ N, attractive** · D) 8.99×10⁹ N, repulsive
*Explain:* F = k·1·1/(10³)² = 8.99×10⁹/10⁶ = 8.99×10³ N; opposite signs attract.
*Hint:* Convert km → m *before* squaring.

**L2-N2 · Calculation · Full**  *(lecture example — Bohr atom)*
In the Bohr hydrogen atom (r = 5.29×10⁻¹¹ m), the electron's speed is closest to:
A) 2.19×10³ m/s · **B) 2.19×10⁶ m/s** · C) 4.79×10¹² m/s · D) 5.11×10⁴ m/s
*Explain:* k e²/r² = mₑv²/r → v = √(k e²/(mₑ r)) = 2.19×10⁶ m/s.
*Hint:* Set Coulomb force = centripetal force, then solve for v — and take the square root. (C is the pre-root value; D uses the proton's mass.)

**L2-M1 · Spot the mistake · Full**  *(lecture line example)*
For q₁ = −4 µC (x = 0), q₂ = +3 µC (x = 0.20 m), q₃ = −7 µC (x = 0.40 m), a student computes F₂₁ = 2.70 N and F₃₁ = 1.57 N, then answers "net = 4.27 N". The mistake is:
A) The individual forces are wrong · **B) They added magnitudes while the two forces point in opposite directions — the net is 2.70 − 1.57 = 1.1 N toward q₂** · C) They should have multiplied · D) There is no mistake
*Explain:* q₂ attracts q₁ (+x), q₃ repels it (−x): opposite arrows subtract.
*Hint:* Draw both arrows on the x-axis first. Do they point the same way?

## 5.3 Lesson 3 — Electric Field

**L3-C1 · Concept · Easy**
The direction of E at a point is defined as the direction of the force on:
A) an electron placed there · **B) a positive test charge placed there** · C) the source charge · D) a neutron
*Explain:* The convention: E points the way a *positive* q₀ would be pushed — electrons feel it backwards.
*Hint:* Field lines leave + and enter −. Which way would *you* be pushed if you were positive?

**L3-C2 · Concept · Full**
Two equal positive charges sit 1 m apart. At the midpoint:
A) E is zero because there is no charge there · **B) E is zero because the two field vectors are equal and opposite** · C) E is doubled · D) E is undefined
*Explain:* Cancellation, not absence — each charge contributes kq/r² in opposite directions.
*Hint:* The Zero-Field Hunt's hot/cold meter reads ≈0 there — but the arrows around it are huge.

**L3-N1 · Calculation · Full**  *(lecture y-axis example)*
+4 µC sits at y = −0.50 m and −4 µC at y = +0.50 m. The net field at P = (0.60 m, 0) is:
A) 1.18×10⁵ N/C, +y · B) 5.90×10⁴ N/C, +x · **C) 7.55×10⁴ N/C, +y** · D) 0
*Explain:* Each gives 5.90×10⁴ N/C at r² = 0.61 m²; x-components cancel, y-components add: 2 × 5.90×10⁴ × (0.50/0.781) = 7.55×10⁴ N/C (lecture: 75.6×10³ with k ≈ 9×10⁹).
*Hint:* Symmetry kills one axis. Which components survive — and where does each charge push/pull?

**L3-N2 · Calculation · Full**  *(lecture F = \|q₀\|E example; see flag §1.3 #5)*
A charge q₀ = +18×10⁻⁸ C sits in a uniform field E = 2.0×10³ N/C. The force on it is:
A) 9.0×10⁻¹¹ N · **B) 3.6×10⁻⁴ N, along E** · C) 3.6×10⁻⁴ N, opposite E · D) 3.6×10⁻¹¹ N
*Explain:* F = \|q₀\|E = (18×10⁻⁸)(2.0×10³) = 3.6×10⁻⁴ N; positive charge → along E.
*Hint:* Multiply — and the sign of q₀ picks the direction. (A is the division slip.)

**L3-M1 · Spot the mistake · Easy**
A student says: "I put a −2 µC test charge at P and measured the force pointing west, so E at P points west." The mistake is:
A) Test charges must be positive **and** small — but more precisely: **B) E points opposite the force on a negative charge, so E at P points east** · C) Forces can't point west · D) E would point up
*Explain:* E = F/q₀ keeps the sign: negative q₀ flips force vs field.
*Hint:* Which way would a *positive* charge be pushed at the same spot?

## 5.4 Verification table (every calculation recomputed independently)

| Q | Computation | Result | Option matches |
|---|---|---|---|
| L1-N1 | 1 ÷ 1.602×10⁻¹⁹ | 6.242×10¹⁸ | B ✓ (A = e itself; C/D are exponent traps) |
| L1-N2 | 5.0×10⁶ × 1.602×10⁻¹⁹ | 8.01×10⁻¹³ C, positive | B ✓ |
| L2-N1 | 8.99×10⁹ × 1 × 1 ÷ (10³)² | 8.99×10³ N | C ✓ (B = forgot square; D = forgot r) |
| L2-N2 | √(8.99×10⁹ × (1.602×10⁻¹⁹)² ÷ (9.109×10⁻³¹ × 5.29×10⁻¹¹)) | 2.188×10⁶ m/s | B ✓ (C = 4.79×10¹², pre-root; D = 5.11×10⁴, proton mass) |
| L2-M1 | 2.697 N − 1.573 N | 1.124 N | B ✓ (sum-error 4.27 N shown in stem) |
| L2-C2 | √(9+16); tan⁻¹(4/3) | 5 N; 53.1° | B ✓ |
| L3-N1 | r² = 0.61; E_each = 5.895×10⁴; cosθ = 0.6402; 2×E_each×cosθ | 7.548×10⁴ N/C | C ✓ (A = forgot cosθ; B = one charge) |
| L3-N2 | 18×10⁻⁸ × 2.0×10³ | 3.6×10⁻⁴ N | B ✓ (A = 9×10⁻¹¹ division slip) |

Quiz-engine impact: near-zero code changes — `js/quiz.js` derives counts, filters and per-topic
breakdown from the bank + registry; retagging `topic:` fields plus a small "Lessons 1–3" group
filter (`data-quiz-filter="lessons"`) and per-question hint/level chips were the only edits.
Grading still spans the full bank exactly as before.

---

# Phase 6 — Presentation fit

## 6.1 Rubric → feature cheat sheet (one page)

| Rubric criterion | Where it's satisfied | One line to say |
|---|---|---|
| **Accurate physics (20 %)** | Every sandbox readout computed per-frame from F = k\|q₁q₂\|/r², E = Σkqr̂/r², F = q₀E, v = √(ke²/mₑr) (sandbox-core kernels); lecture replicas (arena preset → 1.1 N; Field Painter preset → 7.55×10⁴ N/C; Bohr toy → 2.19×10⁶ m/s); §5.4 verification table; smoke-test asserts physics values, flat art, and no fake numbers | "Nothing is animated by hand — the lecture's own answers fall out of the live equations." |
| **Creativity & interactivity (15 %)** | Open sandboxes (unlimited draggable objects, draggable ruler, release mode, trails, slow-mo), 6 tiny toys, shareable setups via URL code, star challenges that read the physics state, predict-then-run prompts | "Students build anything; the toys are goal-free, the challenges are optional, and every setup is a link." |
| **Quiz effectiveness (10 %)** | 15 new questions in the 2-concept/2-calc/1-mistake shape, lecture numbers, hints + one-line explanations, Easy/Full tagging; per-topic weak-area analytics (existing Chart.js) | "Each lesson ends with five questions that use the exact numbers from class — including one that grades a *mistake*, not just an answer." |
| **Design & clarity (5 %)** | 4-layer lesson template (30-s summary → easy → full → try-it); one symbol table; Details toggle; unchanged sticker design system, flat art, one content column | "Minutes, not hours: the same lesson in three depths, and one toggle switches the room's reading level." |
| **Clear explanation (presenter)** | Layer A card = the 30-second talk; discovery lines give the closing sentence per sandbox; demo script below | "We present the summary card, then let the sandbox say the rest." |
| **Smooth demo (presenter)** | First-visit splash only (never re-plays mid-demo); sims start on scroll and pause off-screen; offline-capable (zero third-party requests); share-code loads a known-good setup instantly if live play stalls | "The demo can't drift: every number is on the screen, and any scene is one paste away." |

## 6.2 Five-minute demo script (3 presenters; 2-presenter variant noted)

| Time | Who | Screen | Clicks & lines |
|---|---|---|---|
| 0:00–0:35 | **A** | Home | Fresh browser → splash appears once (mascot bob, chips: fonts/equations/first sim) → "honest loading: real signals only; it won't show again this session." Land on home: three lesson cards + Extra. Say the pitch: *"One lecture, three lessons, minutes each — and everything is a sandbox."* |
| 0:35–1:35 | **A** | Lesson 1 | Show the A-card (4 bullets, q = n·e). Open **Rub the Balloon**: 3 swipes → counters tick −/+ in lockstep → "rubbing moves electrons; the total never changes." Drop into **Charge Ledger**: touch +6 onto −2 → both +2 → tally frozen → conservation, live. (Skip Static Room unless time allows.) |
| 1:35–3:00 | **B** | Lesson 2 | **Tug-of-War Arena**: stamp −6 µC next to the seeded +4 µC; drag → arrow stretches; add two more charges → select the centre one → component ghosts + net; flip **Release mode** → orbit/crash with wobble & trails → "real integration, capped so it can never explode." Load preset *Lecture line* → net reads **1.1 N** → "the class example, reproduced by dragging." Quick **Pin the Force**: drag to 2r → curve drops to ¼. |
| 3:00–4:15 | **C** | Lesson 3 | **Field Painter**: paint a dipole → lines bloom; grab the **ghost** → F = q₀E arrow follows the hand; hit preset **Lecture replica** → probe to P → **7.55×10⁴ N/C, +y** → "the lecture's answer, measured by playing." 30-second **Zero-Field Hunt**: hot/cold meter → star at the null → "E = 0 means cancellation, not emptiness." |
| 4:15–5:00 | **Any** | Quiz + close | Quiz filtered to Lesson 2: answer L2-M1 live (spot-the-mistake) in instant mode → explanation → score card's per-topic bars. Then press **Copy setup** in any sandbox, paste the link in a second window → identical scene → "shareable physics." End on the home progress ring. Close: *"Accurate physics (every number computed), creative interactivity (nine sandboxes), effective quizzes (15 lecture-verified questions), clear design (one template, three depths)."* |

**2-presenter variant:** A takes 0:00–2:10 (home + L1 + L2 arena only), B takes 2:10–5:00
(L3 + quiz + close). Cut Pin-the-Force and Zero-Hunt to verbal mentions.
**Fallback discipline:** every scene mentioned above exists as a share-code — if Wi-Fi or the
projector misbehaves, paste codes instead of building live. (Site is fully offline anyway.)

---

# Phase 7 — Loading experience & page transitions (spec only)

One loading pattern, reused everywhere: the existing `#bootOverlay` shell (markup already
inline in every page's `<head>`/top-of-body) upgraded per below. Placeholder sizes are keyed to
Phase-4 canvases: mains use `.sim-canvas.tall` (**440 px**), toys use `.short` (**250 px**),
Pin-the-Force's graph strip uses `.chart` (**150 px**) — the same fixed-height classes already
in `css/input.css`, so plates inherit exact sizes and **CLS stays 0**.

## a. First-visit splash

| Aspect | Spec |
|---|---|
| Visual | Reuse current overlay: flat `#17181c`, Denki-chan SVG with the existing `boBob` bob (transform-only), brand lockup, chip row, bar. **Chips become the three real signals:** `fonts` · `equations` · `first sim`. |
| Real signals | `fonts` ← `document.fonts.ready` (plus the licensed-face load path in `common.js`); `equations` ← existing `katexify(aboveFold)` completion (today's `bootStage('equations')`); `first sim` ← first `EMC.Stage` constructed on the page (new `emc:stage-ready` CustomEvent; `window.load` is the fallback signal for pages whose sims are all below the fold or lazy via `whenNear` — honest: the chip then means "page fully loaded"). |
| Bar | Determinate: three equal segments; each completing signal fills its segment via `transform: scaleX()` (motion = transform only). No fake percentages, no timer-driven creep. |
| Session gate | Inline head script (runs pre-paint, wrapped in try/catch like the existing prefs read): if `sessionStorage['emc.splash.v1']` is set → add `hidden` to `#bootOverlay` immediately (no flash on second navigation); else set the key when the overlay first paints. Storage failure → show splash (safe default). |
| Timing | Minimum display **400 ms** (raise `OVERLAY_MIN_MS` 200 → 400); hard timeout **4 s** (lower the inline failsafe 6000 → 4000; the in-page boot-strip keeps tracking lazy sims afterwards, as today). Exit = `.hide` opacity fade (280 ms → retune to the global 200 ms of §7b), then `remove()` — overlay is `position:fixed`, so exit cannot shift layout. |
| JS-failure safety | Unchanged contracts: `<noscript>` hides the overlay; the inline 4-s failsafe deletes it even if no script ever runs; content is never behind the overlay in the DOM (it paints under it). |
| A11y | Overlay keeps `role="status"`; add `aria-live="polite"` on a visually-hidden sentence ("Loading EMC Lab" → "Ready"), set `aria-busy="true"` on `<html>` while up and remove on exit; overlay content `inert`; focus is never trapped or stolen (skip-link remains the first tab stop after removal). |
| Reduced motion | Bob off, bar segments fill instantly (no scaleX transition), overlay fade replaced by instant hide — min-display and gating logic unchanged. |
| Rotating tips | Optional, ≤ **8** one-liners sourced strictly from lecture content, rotated every ~1.2 s in the `bo-sub` slot, `aria-hidden="true"` (the live region carries state, not tips): ① "Like repels, unlike attracts." ② "e = 1.602×10⁻¹⁹ C — charge comes in parcels." ③ "1 C = 6.24×10¹⁸ electrons." ④ "Charge only moves; the total never changes." ⑤ "Double the distance → a quarter of the force." ⑥ "k = 8.99×10⁹ N·m²/C²." ⑦ "E = F/\|q₀\| — the push a positive test charge would feel." ⑧ "Field lines start on + and end on −." Reduced motion: show tip ① statically. |

## b. Page transitions

| Aspect | Spec |
|---|---|
| Primary | Cross-document View Transitions: `@view-transition { navigation: auto; }` in `css/input.css`. Named elements: `.site-header` → `view-transition-name: site-header`; header brand mascot SVG → `denki`. Result: header + Denki-chan hold perfectly still while `main` cross-fades. Duration **200 ms**, easing **ease** — one easing/duration pair everywhere (declare `--vt-ms: 200ms; --vt-ease: ease` as tokens; splash fade, skeleton fades and fallback reuse them). |
| Fallback | For browsers without cross-document VT (Firefox today): a ~40-line handler in `common.js` — intercept clicks on same-origin `.html` links only when: left button, no modifier (ctrl/cmd/shift/alt), no `target`, not `download`, not a bare `#anchor`. Add `html.vt-leaving` (opacity 1→0 on `main` only, 200 ms `--vt-ease`), then `location.assign(href)`. Header stays visible during fade (matches the VT look). |
| bfcache | Navigation is never blocked beyond the fade; on `pageshow` with `persisted === true` remove `vt-leaving` instantly so restored pages aren't blank. No `unload` handlers anywhere (they kill bfcache — none exist today; keep it that way). |
| Hash router coexistence | `shell.js` `#/route` changes reuse the same `.vt-leaving` class on the swapped `<main>` section — one motion pattern for both navigation styles. |
| Reduced motion | All fades/bobs instant (VT respects the media query via a `@media (prefers-reduced-motion: reduce)` override setting animation-duration to 0.01 ms; fallback handler checks `EMC.reducedMotion` and navigates immediately). |

## c. Skeletons & lazy loading

| Aspect | Spec |
|---|---|
| Plates | Each canvas cell gets a `.sim-plate` overlay div (absolute inset-0 inside the existing canvas wrapper): flat `--bg-soft` fill, 1.5 px `--line` border, existing radii, and one centred line of `tiny faint` text ("warming up the bench…"). Height comes from the canvas class it covers (440/380/250/150) → zero layout shift. |
| Handover | `emc:stage-ready` (fired on first Stage construction per canvas, §7a) → plate gets `.gone` (opacity → 0 over `--vt-ms`, then `display:none`). Fade is opacity-only; reduced motion = instant. |
| Start-on-scroll | Extend the existing `EMC.whenNear` pattern (already used by `sim-ohm`/`sim-circuit`) to **every** sandbox/toy: Stage constructed only when the canvas is within ~300 px of the viewport. Off-screen pausing already exists inside Stage (IntersectionObserver `_visible` + the two-animation-chain budget) — unchanged. |
| Quiz page | Question list renders from static markup + one JS pass (already fast): show 3 skeleton `.q-card` plates (same flat style, matching the real card's min-height) until `quiz.js` first render; score-card chart area keeps its fixed 170 px boxes and gains plates that fade out when Chart.js instances construct. **Chart.js stays lazy-loaded exactly as today** (dynamically injected on grade — smoke-tested); no eager preload. |
| Home | Hero counters/equation strip are text — no plates; only the sim-index cards use the plate pattern if their canvases are kept. |

## d. Failure states (never a blank screen)

| Failure | Behaviour |
|---|---|
| Slow network | Splash exits at the 4-s hard timeout regardless; boot-strip keeps tracking sims; plates stay until each Stage is ready — content above canvases is already readable (progressive by construction: all scripts defer). |
| JS blocked | Existing `<noscript>` banner + overlay-hiding style stay; **add**: each `.sim-plate` contains a `<noscript>` child swapping the "warming up" text for "Sims need JavaScript — the lesson text above still reads fine" (flat card, no canvas). Quiz shows its existing static fallback message. |
| Canvas unsupported | `Stage` constructor guard: if `getContext('2d')` returns null, replace the plate content with the same friendly flat card ("This browser can't draw the lab bench — the written lesson is unaffected") and skip all binding. No console spam, one `warn` line max. |
| Storage blocked | Existing `storageNotice` banner + memory fallback (unchanged) — share-codes still work via URL. |
| Stale CSS/JS (deploy race) | Existing content-hash headers handle it; plates never hang because `window.load` is the fallback stage signal (§7a). |

## e. Measurement plan

| Metric | Target | How checked |
|---|---|---|
| CLS (mobile & desktop) | **≤ 0.05** (expect 0.00 — fixed overlay, fixed-height canvases + plates) | Lighthouse CI on the 5 pages + home; DevTools Performance panel on a throttled 4G profile |
| LCP | **≤ 2.0 s local / ≤ 2.5 s throttled 4G** (hero text/mascot SVG; splash never delays LCP because content paints beneath it) | Lighthouse; verify splash min-display doesn't gate paint (it can't — overlay is a sibling) |
| TTI / TBT | TTI ≤ 3.5 s; TBT ≤ 200 ms (sandbox recompute during drag must stay < 50 ms/frame — lite line budget during gestures already exists) | Lighthouse + DevTools long-task filter; `?debug` stage stats |
| Transfer & blocking | Keep existing budgets green: < 500 KB compressed/page (excl. fonts), **0 render-blocking scripts** | `bun run perf` (unchanged, must pass) |
| New smoke-test assertions (`tools/smoke-test.mjs`) | ① splash gated by sessionStorage (first visit renders overlay, second visit doesn't); ② failsafe constant is 4000 and `OVERLAY_MIN_MS = 400`; ③ chips are exactly `fonts,equations,sims` and each flips only on its real event (dispatch-order test); ④ bar segments are transform-driven (no width animation, no timers); ⑤ ≤ 8 tips, all from the allowed lecture set, `aria-hidden`; ⑥ reduced-motion path: no animation classes, overlay still dismisses; ⑦ `@view-transition` present in built CSS and fallback handler ignores modifier/target/anchor clicks (synthetic click test); ⑧ every `.sim-plate` height equals its canvas class height (no CLS source); ⑨ `emc:stage-ready` fires once per canvas and removes the plate; ⑩ whenNear-gated: a below-fold canvas has no Stage until intersection (debugStages snapshot); ⑪ canvas-unsupported guard renders the friendly card (stub `getContext → null`); ⑫ flat-art + no-third-party + gradient-free assertions still pass unchanged | `bun run test` (assertion count rises from 428; keep exact-count print) |

---

# Prioritized checklist (file → change)

**P0 — the restructure (Must):** the graded path: three lessons, three sandboxes, quiz, registry.
**P1 — toys, splash, transitions (Must unless noted).** **P2 — polish (Nice-to-have).**

| Pri | File | Change | Must/Nice |
|---|---|---|---|
| P0 | `js/registry.js` | Re-declare: subject "Electric Forces & Electric Field" with chapters `charge`/`coulomb`/`field` (+ paths, tags, sims, points from §2.1); second subject "Extra" with `current`/`magind` (unchanged paths) | Must |
| P0 | `topics/charge.html` *(new)* | Lesson 1 on the 4-layer template (§3.1); symbols card `#symbols`; embeds `sim-static-room`, `toy-balloon`, `toy-ledger` | Must |
| P0 | `topics/coulomb.html` *(new)* | Lesson 2 (§3.2); embeds `sim-arena`, `toy-pinforce`, `toy-bohr` | Must |
| P0 | `topics/field.html` *(new)* | Lesson 3 (§3.3); embeds `sim-fieldpaint`, `toy-dipole`, `toy-zerohunt`; "Extra: uniform fields" disclosure at the end | Must |
| P0 | `js/sandbox-core.js` *(new)* | Shared engine per §4.0 (kernels, softening/caps, toolbar, toggles, challenges, predict-then-run, share-code, Easy/Full via existing prefs, discovery lines, touch contract) | Must |
| P0 | `js/sim-arena.js` *(new)* | Lesson-2 main sandbox; presets incl. "Two on a line" + lecture line example (1.1 N) | Must |
| P0 | `js/sim-fieldpaint.js` *(edit of `sim-efield.js`)* | Remove A/B potential + Simpson readouts; persistent draggable ghost; ruler object; force arrows; Lecture-replica preset (±4 µC, P → 7.55×10⁴ N/C); challenges; share-code | Must |
| P0 | `js/sim-static-room.js` *(new)* | Lesson-1 main sandbox (materials, conductor-touch sharing, permanent net-charge tally, release mode) | Must |
| P0 | `js/quiz-data.js` | Replace efield 8 with the 15 new questions (§5); retag keepers per §2.2 (Q10/11/12/14/15); cut Q13→Extra, Q16→delete; retag current/magind as Extra topics | Must |
| P0 | `index.html` | Hero strip → q = n·e, Coulomb, E = F/\|q₀\|, E = kq/r²; lesson cards + Extra group from registry; sim count registry-derived | Must |
| P0 | `topics/current.html`, `topics/magind.html` | Relabel: "Extra" breadcrumb + tag; nav placement; content untouched | Must |
| P0 | `js/sim-coulomb.js`, potential code from `sim-efield.js` | Move to `archive/js/` (recoverable, repo convention) | Must |
| P0 | `tools/smoke-test.mjs` | Update page list/chip order/failsafe assertions for the new structure; keep 428+ existing physics assertions green | Must |
| P1 | `js/toy-balloon.js`, `js/toy-ledger.js`, `js/toy-pinforce.js`, `js/toy-bohr.js`, `js/toy-dipole.js`, `js/toy-zerohunt.js` *(new)* | Six thin toys per §4.2–4.4 on sandbox-core | Must |
| P1 | `js/common.js` | Splash: session gate, 400/4000 constants, fonts + first-sim signals, `emc:stage-ready` event, determinate segments, tips rotator, aria-live sentence; VT fallback click handler; `whenNear` wiring helper | Must |
| P1 | `css/input.css` (+ rebuild `site.css`) | `@view-transition`; `view-transition-name` for header/mascot; `--vt-ms/--vt-ease` tokens; `.sim-plate` (+ `.gone`); `.vt-leaving`; determinate bar segments; tips slot | Must |
| P1 | All 6 HTML pages | Overlay chips → fonts/equations/sims; failsafe 4000; plate markup around every canvas; `<noscript>` plate child | Must |
| P1 | `PRESENTATION-NOTES.md` | Rewrite from Phase 6 (cheat sheet + script); delete stale general-physics content | Must |
| P1 | `vercel.json` | Optional redirect `topics/efield.html → topics/field.html` (301) so old links/deep-links survive | Nice |
| P1 | `js/shell.js` | Reuse `.vt-leaving` for hash-route swaps; teach it the Extra group | Must (small) |
| P2 | `tools/interaction-test.mjs` | Add sandbox passes: drag with touch pointer events, pinch-zoom state, share-code round-trip, challenge star detection | Nice |
| P2 | `TESTING.md` | Refresh assertion tables/counts; remove archived-sim rows | Nice |
| P2 | `js/quiz.js` | Skeleton `.q-card` plates until first render (chart lazy-load unchanged) | Nice |
| P2 | `tools/perf-audit.mjs` | No rule changes needed; add per-page plate/JS size line to the report | Nice |
| P2 | `README.md` | Update §2–§4 (file list, feature table, physics table) to the new structure | Must (docs honesty) |
| P2 | Home progress ring | Counts the 3 lessons (Extra pages excluded from required progress; quiz 70 %+ rule unchanged) | Must (small) |

**Verification reminder before printing any lesson:** resolve flags §1.3 #3 (2-D example leg
lengths) and #5 (F = \|q₀\|E exponents) against the actual lecture PDF; everything else in this
document is numerically verified.
