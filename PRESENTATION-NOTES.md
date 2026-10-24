# Presentation notes — EMC Lab interactive physics module

Companion notes for presenting the project: what the physics is, where each rubric point is
satisfied, and a scripted 5-minute live demo. Full project record: `README.md` (features,
commands, file map) and `BUG_AUDIT.md` (audit history).

---

## Part 1 — The physics, in three lessons

### 1. Electric Charge (Lesson 1)
Two kinds of charge — proton +e, electron −e, neutron 0 — governed by one rule: **like
repels, unlike attracts**. Charge is **quantised** (q = n·e, e = 1.602×10⁻¹⁹ C, so
1 C = 6.24×10¹⁸ electrons) and **conserved** (rubbing/touching only moves charge; the total
never changes). **Conductors** let charge roam, **insulators** hold it; a charged object near
a neutral conductor polarises it — the nearer opposite charge wins because the force is
stronger up close (balloon on a wall).

**Teaching hook in the sandbox:** the Static Room's tally literally cannot be broken — flood
the room, make metal balls touch and share (q′ = (q₁+q₂)/2), and the total stays fixed. The
balloon toy ticks two counters in exact lockstep: −ne on the balloon, +ne on the hair.

### 2. Coulomb's Law (Lesson 2)
F = k|q₁q₂|/r², k = 8.99×10⁹ N·m²/C². Inverse-square (2× r → ¼ F); signs steer direction
only; the pair is always a Newton's-third-law couple; several forces add **as vectors**.
The lecture's four worked examples all reproduce live in the arena: +1 C/−1 C at 1 km →
8.99×10³ N; the −4/+3/−7 µC line → net 1.1 N on q₁; the 2-D +4/−6/−5 µC layout → ≈23 N at
≈24°; Bohr hydrogen → v = √(ke²/mₑr) = 2.19×10⁶ m/s at r = 5.29×10⁻¹¹ m.

**Teaching hook:** select a charge in the arena — the dashed green arrows are its individual
pulls, the thick arrow is the vector sum. Load the *Lecture line* preset and the readout says
1.1 N before anyone types a number.

### 3. Electric Field (Lesson 3)
E = F/|q₀| (N/C); the direction rule: **E points the way a positive test charge would be
pushed** (out of +, into −). Point charge E = kq/r²; fields superpose as vectors; between two
like charges there is a point where E = 0 — cancellation, not emptiness. Field lines start on
+, end on −, never cross, and bunch where the field is strong. Lecture examples reproduce
live: F = |q₀|E (3.6×10⁻⁴ N along E; 4.8×10⁻⁴ N opposite for the negative charge) and the
±4 µC y-axis pair → E at P = 7.55×10⁴ N/C along +y (the lecture prints 75.6×10³ with
k ≈ 9×10⁹).

**Teaching hook:** the Field Painter's *Lecture replica* preset parks the E-probe at P and
reads the lecture's own answer — measured by dragging, not memorised. Then hunt the zero:
the meter goes cold → cool → warm → ★.

---

## Part 2 — Rubric cheat sheet (one page)

| Rubric criterion | Where it lives | One line to say |
|---|---|---|
| **Accurate physics (20 %)** | Every readout computed per frame from q = n·e, F = k\|q₁q₂\|/r² (softened + capped), E = Σ kq r̂/r², F = q₀E, v = √(ke²/mₑr). The lecture's worked answers fall out of live presets (arena → 1.1 N and ≈23 N; painter → 7.55×10⁴ N/C; Bohr → 2.19×10⁶ m/s). 561 runtime assertions check physics values, not screenshots. | "Nothing is animated by hand — the lecture's own answers fall out of the live equations." |
| **Creativity & interactivity (15 %)** | Nine goal-free sandboxes/toys: unlimited draggable objects (even the ruler), pinch-zoom, long-press editing, release mode with bounce + stability chip, trails, slow-mo, undo/random, star challenges detected from the physics state, predict-then-run prompts computed from live state, share-codes in the URL. | "Students build anything; challenges are optional; every setup is a link." |
| **Quiz effectiveness (10 %)** | 35 questions; each lesson = 2 concept + 2 calculation (lecture numbers) + 1 spot-the-mistake; every question has a hint button and an Easy/Full tag; per-topic weak-area analytics; a Lessons 1–3 filter keeps Extra out of the way. | "Five questions per lesson using the exact numbers from class — including one that grades a *mistake*." |
| **Design & clarity (5 %)** | One 4-layer template on all three lessons (30-s summary → easy → full → try-it); one symbol table; the Details switch changes reading level site-wide; unchanged sticker design, flat art, one content column; first-visit splash with honest signals; skeleton plates → zero layout shift. | "Minutes, not hours: the same lesson in three depths, one toggle switches the room's reading level." |
| **Clear explanation (presenter)** | Layer-A cards are the 30-second talk; every toy ends with a one-line "what you just discovered" that links to the summary. | "We present the summary card, then let the sandbox say the rest." |
| **Smooth demo (presenter)** | Splash never re-plays mid-demo (session gate); sims start on scroll and pause off-screen; fully offline (zero third-party requests); any scene is one paste away via share-code. | "The demo can't drift: every number is on screen, and any scene is one paste away." |

---

## Part 3 — Five-minute demo script (3 presenters)

| Time | Who | Screen | Clicks & lines |
|---|---|---|---|
| 0:00–0:35 | **A** | Home | Fresh browser → splash appears once (mascot bob; chips: fonts / equations / first sim; rotating lecture tip) → "honest loading — real signals only; it won't show again this session." Land on home: three lesson cards + Extra. Pitch: *"One lecture, three lessons, minutes each — and everything is a sandbox."* |
| 0:35–1:35 | **A** | Lesson 1 | Show the A-card (4 bullets, q = n·e). **Rub the Balloon**: three swipes → counters tick −/+ in lockstep → "rubbing moves electrons; the total never changes." **Charge Ledger**: touch +6 onto −2 → both +2 → tally frozen → conservation, live. (Static Room only if time allows.) |
| 1:35–3:00 | **B** | Lesson 2 | **Tug-of-War Arena**: drop a −6 µC next to the seeded +4 µC; drag → arrow stretches; add two more; select the centre charge → dashed component ghosts + thick net; flip **let go** → orbit/crash with wobble and trails → "real integration, capped so it can never explode." Preset *Lecture line* → net reads **1.1 N**. Quick **Pin the Force**: drag to 2r → the curve drops to ¼. |
| 3:00–4:15 | **C** | Lesson 3 | **Field Painter**: paint a dipole → lines bloom; drag the **ghost** → F = q₀E arrow follows the hand; preset **Lecture replica** → probe at P reads **7.55×10⁴ N/C, +y** → "the lecture's answer, measured by playing." 30-second **Zero-Field Hunt**: cold → cool → warm → ★ → "E = 0 means cancellation, not emptiness." |
| 4:15–5:00 | **Any** | Quiz + close | Quiz filtered to Lesson 2: answer the spot-the-mistake live in instant mode → hint → explanation → per-topic bars. Press **Copy setup link** in any sandbox, paste in a second window → identical scene. End on the home progress ring. Close: *"Accurate physics, creative interactivity, effective quizzes, clear design — the four rubric lines, in that order."* |

**2-presenter variant:** A takes 0:00–2:10 (home + L1 + arena only), B takes 2:10–5:00
(L3 + quiz + close); mention Pin-the-Force and Zero-Hunt verbally.
**Fallback discipline:** every scene above exists as a share-code — if the venue Wi-Fi or
projector misbehaves, paste codes instead of building live. The site is fully offline anyway:
every font, KaTeX and Chart.js is vendored in the repo.

---

## Part 4 — Likely audience questions

* **"Can the simulation blow up?"** No: forces use close-range softening (ε ≤ 1 cm) and a hard
  10 kN cap; release mode clamps dt and speed and bounces off walls with 0.6 restitution. When
  the cap engages, an honest amber chip says "forces maxed — softening is keeping the sim stable".
* **"Is the ghost's release motion Newtonian?"** Charged pucks integrate F = ma with a printed
  play mass. The ghost *rides the field* (direction from E, speed from log|E|) — a labelled flow
  view, because a 1 nC test charge's real acceleration would be invisible.
* **"Why is neutral metal attracted to charge?"** Polarisation, modelled with the classic
  image-charge result for a conducting sphere — real physics, and the ball's own net charge
  stays 0, so the conservation tally is untouched.
* **"The lecture says 75.6×10³ N/C; your probe says 7.55×10⁴."** Same number: the lecture rounds
  k to 9×10⁹; the sim computes with full CODATA k and prints 3 significant figures.
* **"Why do circuits and magnetism still exist?"** They are beyond this lecture, so they moved
  to a clearly labelled *Extra* section — same quality, out of the graded flow, behind their
  own quiz filter.
* **"Does progress survive the restructure?"** Yes: `emc.progress.v3` migrates v1/v2 records
  automatically (finishing the old fields chapter credits all three lessons) and keeps a
  recoverable legacy copy.
